// =========================================================================
// [ep4_miracle_assets.js - 파트 1/3] 에피소드 4 전용 소프트 로우 폴리곤 에셋 & 태양 그림자 엔진
// 1. 실시간 태양 궤도 이동(Dynamic Sun), 태양 플레어 효과 및 그림자 시스템
// 2. 하늘을 나는 작은 새 모델링 추가
// 3. 인체 비례 의복 & 전면 개방형(Open-Front Arch) 다면체 후드·장발 구조
// =========================================================================

const _miracleDoubleSideMatCache = {};
function matLowPolyDouble(hexColor) {
  if (!_miracleDoubleSideMatCache[hexColor]) {
    const m = new THREE.MeshLambertMaterial({
      color: hexColor,
      flatShading: true,
      side: THREE.DoubleSide
    });
    m.userData = { _cached: true };
    _miracleDoubleSideMatCache[hexColor] = m;
  }
  return _miracleDoubleSideMatCache[hexColor];
}

function markCachedGeo(geo) {
  if (geo) {
    geo.userData = Object.assign(geo.userData || {}, { _cached: true });
  }
  return geo;
}

function createDoubleSideLowPolyMesh(geo, hexColor, x = 0, y = 0, z = 0, castShadow = true) {
  const m = new THREE.Mesh(geo, matLowPolyDouble(hexColor));
  m.position.set(x, y, z);
  if (castShadow) {
    m.castShadow = true;
    m.receiveShadow = true;
  }
  return m;
}

function pushTriangle(arr, a, b, c) {
  arr.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
}
function pushQuad(arr, a, b, c, d) {
  pushTriangle(arr, a, b, c);
  pushTriangle(arr, a, c, d);
}

function buildBufferGeoFromTriangles(verts) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.computeVertexNormals();
  return geo;
}

// -------------------------------------------------------------------------
// 1. [60fps 부드러운 그림자 + 모바일 최적화] 스마트 거리 컬링 태양 & 렌즈 플레어 시스템
//    - 소프트 로우 폴리곤 다면체 태양 + 시선 각도에 반응하는 화면 렌즈 플레어
//    - 모바일 VRAM 및 셰이더 부하 절감 (512 그림자맵, DPR 1.25 상한, 28m 거리 컬링)
// -------------------------------------------------------------------------
let miracleSunSystem = {
  light: null,
  lightTarget: null,
  sunVisualGroup: null,
  sunCoronaMesh: null,
  sunRaysGroup: null,
  flareGroup: null,
  angle: 0.52,
  angularSpeed: 0.35 / 180.0,
  cullTimer: 0,
  cullEntries: [],
  cullBuilt: false,
  flareEls: null,
  isMobile: /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (Math.min(window.innerWidth, window.innerHeight) <= 760)
};

const _sunDirVec = new THREE.Vector3();
const _sunCamDirVec = new THREE.Vector3();
const _sunProjVec = new THREE.Vector3();

function ensureMiracleSunFlareOverlay() {
  let layer = document.getElementById('miracle-sun-flare-layer');
  if (layer && miracleSunSystem.flareEls) return layer;

  if (!layer) {
    layer = document.createElement('div');
    layer.id = 'miracle-sun-flare-layer';
    layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:12;overflow:hidden;opacity:0;display:none;transition:opacity 0.08s linear;';
    layer.innerHTML = `
      <div id="msf-bloom" style="position:absolute;left:0;top:0;width:320px;height:320px;margin:-160px 0 0 -160px;border-radius:50%;background:radial-gradient(circle, rgba(255,253,230,0.92) 0%, rgba(253,224,71,0.52) 26%, rgba(251,146,60,0.20) 54%, rgba(251,146,60,0) 76%);mix-blend-mode:screen;will-change:transform;"></div>
      <div id="msf-streak" style="position:absolute;left:0;top:0;width:520px;height:34px;margin:-17px 0 0 -260px;background:radial-gradient(ellipse at center, rgba(255,252,224,0.72) 0%, rgba(253,224,71,0.28) 40%, rgba(253,224,71,0) 78%);mix-blend-mode:screen;will-change:transform;"></div>
      <div id="msf-halo" style="position:absolute;left:0;top:0;width:210px;height:210px;margin:-105px 0 0 -105px;border-radius:50%;border:4px solid rgba(254,240,138,0.22);box-shadow:0 0 22px rgba(251,191,36,0.20), inset 0 0 18px rgba(125,211,252,0.18);mix-blend-mode:screen;will-change:transform;"></div>
      <div id="msf-g1" style="position:absolute;left:0;top:0;width:62px;height:62px;margin:-31px 0 0 -31px;clip-path:polygon(25% 6%,75% 6%,100% 50%,75% 94%,25% 94%,0% 50%);background:radial-gradient(circle, rgba(254,240,138,0.58) 0%, rgba(251,191,36,0.24) 70%, rgba(251,191,36,0) 100%);mix-blend-mode:screen;will-change:transform;"></div>
      <div id="msf-g2" style="position:absolute;left:0;top:0;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;background:radial-gradient(circle, rgba(186,230,253,0.55) 0%, rgba(56,189,248,0.22) 72%, rgba(56,189,248,0) 100%);mix-blend-mode:screen;will-change:transform;"></div>
      <div id="msf-g3" style="position:absolute;left:0;top:0;width:96px;height:96px;margin:-48px 0 0 -48px;border-radius:50%;border:2.5px solid rgba(253,224,71,0.38);background:radial-gradient(circle, rgba(251,146,60,0.08) 0%, rgba(253,224,71,0.22) 68%, rgba(125,211,252,0.18) 90%, rgba(0,0,0,0) 100%);mix-blend-mode:screen;will-change:transform;"></div>
      <div id="msf-g4" style="position:absolute;left:0;top:0;width:56px;height:56px;margin:-28px 0 0 -28px;clip-path:polygon(25% 6%,75% 6%,100% 50%,75% 94%,25% 94%,0% 50%);background:radial-gradient(circle, rgba(253,186,116,0.48) 0%, rgba(251,146,60,0.18) 72%, rgba(251,146,60,0) 100%);mix-blend-mode:screen;will-change:transform;"></div>
      <div id="msf-g5" style="position:absolute;left:0;top:0;width:30px;height:30px;margin:-15px 0 0 -15px;border-radius:50%;background:radial-gradient(circle, rgba(167,243,208,0.50) 0%, rgba(52,211,153,0.18) 72%, rgba(52,211,153,0) 100%);mix-blend-mode:screen;will-change:transform;"></div>
    `;
    document.body.appendChild(layer);
  }

  miracleSunSystem.flareEls = {
    layer,
    bloom: layer.querySelector('#msf-bloom'),
    streak: layer.querySelector('#msf-streak'),
    halo: layer.querySelector('#msf-halo'),
    g1: layer.querySelector('#msf-g1'),
    g2: layer.querySelector('#msf-g2'),
    g3: layer.querySelector('#msf-g3'),
    g4: layer.querySelector('#msf-g4'),
    g5: layer.querySelector('#msf-g5')
  };
  return layer;
}

function updateMiracleSunScreenFlare(now) {
  const els = miracleSunSystem.flareEls;
  if (!els || !els.layer || !camera || !miracleSunSystem.sunVisualGroup) return;

  // 어두운 폭풍우 하늘(스테이지1 풍랑 등)이거나 게임 플레이 중이 아니면 플레어 숨김
  let skyBright = 1.0;
  if (scene && scene.background && scene.background.isColor) {
    const c = scene.background;
    skyBright = c.r * 0.299 + c.g * 0.587 + c.b * 0.114;
  }
  const playingNow = (typeof isPlaying !== 'undefined' && isPlaying);
  if (skyBright < 0.28 || !playingNow) {
    if (els.layer.style.display !== 'none') {
      els.layer.style.opacity = '0';
      els.layer.style.display = 'none';
    }
    return;
  }

  const sunPos = miracleSunSystem.sunVisualGroup.position;
  _sunDirVec.subVectors(sunPos, camera.position).normalize();
  camera.getWorldDirection(_sunCamDirVec);
  const viewDot = _sunCamDirVec.dot(_sunDirVec);

  if (viewDot <= 0.32) {
    if (els.layer.style.display !== 'none') {
      els.layer.style.opacity = '0';
      els.layer.style.display = 'none';
    }
    return;
  }

  _sunProjVec.copy(sunPos).project(camera);
  if (_sunProjVec.z >= 1.0 || Math.abs(_sunProjVec.x) > 1.48 || Math.abs(_sunProjVec.y) > 1.48) {
    if (els.layer.style.display !== 'none') {
      els.layer.style.opacity = '0';
      els.layer.style.display = 'none';
    }
    return;
  }

  const w = window.innerWidth || 1;
  const h = window.innerHeight || 1;
  const sx = (_sunProjVec.x * 0.5 + 0.5) * w;
  const sy = (-_sunProjVec.y * 0.5 + 0.5) * h;
  const cx = w * 0.5;
  const cy = h * 0.5;

  const angleFactor = Math.min(1, Math.max(0, (viewDot - 0.32) / 0.56));
  const edgeDist = Math.max(Math.abs(_sunProjVec.x), Math.abs(_sunProjVec.y));
  const edgeFade = edgeDist <= 0.92 ? 1.0 : Math.max(0, 1.0 - (edgeDist - 0.92) / 0.56);
  const intensity = Math.min(1, Math.pow(angleFactor, 1.45) * edgeFade * 0.95);

  if (intensity <= 0.02) {
    els.layer.style.opacity = '0';
    els.layer.style.display = 'none';
    return;
  }

  els.layer.style.display = 'block';
  els.layer.style.opacity = intensity.toFixed(3);

  const tSec = now * 0.001;
  const pulse = 1.0 + Math.sin(tSec * 1.8) * 0.04;
  const place = (el, t, sc = 1, rotDeg = 0) => {
    if (!el) return;
    const px = sx + (cx - sx) * t;
    const py = sy + (cy - sy) * t;
    el.style.transform = `translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, 0) scale(${sc.toFixed(3)}) rotate(${rotDeg.toFixed(1)}deg)`;
  };

  place(els.bloom,  0.00, (0.88 + intensity * 0.45) * pulse, 0);
  place(els.streak, 0.00, (0.85 + intensity * 0.55) * pulse, -10 + Math.sin(tSec * 0.6) * 2.5);
  place(els.halo,   0.00, (0.85 + intensity * 0.32) * pulse, 0);
  place(els.g1,     0.42, 0.85 + intensity * 0.28, 18);
  place(els.g2,     0.78, 0.90 + intensity * 0.22, 0);
  place(els.g3,     1.22, 0.82 + intensity * 0.36, 0);
  place(els.g4,     1.58, 0.78 + intensity * 0.32, 30);
  place(els.g5,     1.88, 0.80 + intensity * 0.26, 0);
}

function buildMiracleShadowCullCache() {
  miracleSunSystem.cullEntries = [];
  if (!worldGroup) return;

  const isMob = miracleSunSystem.isMobile;

  worldGroup.children.forEach(rootObj => {
    if (!rootObj || rootObj === miracleSunSystem.sunVisualGroup) return;
    if (rootObj.isMesh && rootObj.geometry && rootObj.geometry.type === 'PlaneGeometry') {
      rootObj.castShadow = false;
      rootObj.receiveShadow = true;
      return;
    }

    const shadowMeshes = [];
    rootObj.traverse(ch => {
      if (!ch.isMesh) return;
      if (isMob) {
        const isMainWall = Array.isArray(wallMeshes) && wallMeshes.includes(ch);
        if (!isMainWall) ch.receiveShadow = false;
      }
      if (ch.castShadow) {
        shadowMeshes.push(ch);
      }
    });

    if (shadowMeshes.length > 0) {
      miracleSunSystem.cullEntries.push({
        root: rootObj,
        meshes: shadowMeshes,
        active: true
      });
    }
  });

  miracleSunSystem.cullBuilt = true;
}

function updateMiracleShadowDistanceCulling(focusX, focusZ) {
  if (!miracleSunSystem.cullBuilt) {
    buildMiracleShadowCullCache();
  }
  const maxShadowDist = miracleSunSystem.isMobile ? 28.0 : 58.0;
  const entries = miracleSunSystem.cullEntries;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (!entry.root || !entry.root.parent) continue;
    const rx = entry.root.position.x;
    const rz = entry.root.position.z;
    const shouldCast = Math.hypot(rx - focusX, rz - focusZ) <= maxShadowDist;

    if (entry.active !== shouldCast) {
      entry.active = shouldCast;
      const mList = entry.meshes;
      for (let j = 0; j < mList.length; j++) {
        mList[j].castShadow = shouldCast;
      }
    }
  }
}

function setupMiracleDynamicSunAndShadows() {
  if (!scene || !renderer) return;

  miracleSunSystem.isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (Math.min(window.innerWidth, window.innerHeight) <= 760);
  const isMob = miracleSunSystem.isMobile;

  // 모바일 가로형 GPU 메모리·프레임 보호를 위해 픽셀 배율을 1.25로 고정 상한 유지
  if (isMob && renderer.setPixelRatio) {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
  }

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = isMob ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = true;
  renderer.shadowMap.needsUpdate = true;

  let dirLight = null;
  scene.traverse(obj => {
    if (obj.isDirectionalLight && !dirLight) dirLight = obj;
  });

  if (!dirLight) {
    dirLight = new THREE.DirectionalLight(0xfff8dc, 0.88);
    scene.add(dirLight);
  }

  dirLight.color.setHex(0xfff8dc);
  dirLight.intensity = 0.88;
  dirLight.castShadow = true;

  // 모바일은 512 그림자맵 + 플레이어 밀착 반경(22m)으로 VRAM 급증 및 버벅임 완벽 방지
  const mapRes = isMob ? 512 : 2048;
  if (dirLight.shadow.mapSize.width !== mapRes || dirLight.shadow.mapSize.height !== mapRes) {
    if (dirLight.shadow.map) {
      dirLight.shadow.map.dispose();
      dirLight.shadow.map = null;
    }
    dirLight.shadow.mapSize.width = mapRes;
    dirLight.shadow.mapSize.height = mapRes;
  }
  dirLight.shadow.camera.near = 2.0;
  dirLight.shadow.camera.far = isMob ? 150.0 : 300.0;
  const d = isMob ? 22 : 65;
  dirLight.shadow.camera.left = -d;
  dirLight.shadow.camera.right = d;
  dirLight.shadow.camera.top = d;
  dirLight.shadow.camera.bottom = -d;
  dirLight.shadow.bias = -0.00025;
  if (dirLight.shadow.normalBias !== undefined) {
    dirLight.shadow.normalBias = 0.020;
  }
  dirLight.shadow.camera.updateProjectionMatrix();

  if (!miracleSunSystem.lightTarget) {
    miracleSunSystem.lightTarget = new THREE.Object3D();
  }
  if (miracleSunSystem.lightTarget.parent !== scene) {
    scene.add(miracleSunSystem.lightTarget);
  }
  dirLight.target = miracleSunSystem.lightTarget;
  miracleSunSystem.light = dirLight;
  miracleSunSystem.cullEntries = [];
  miracleSunSystem.cullBuilt = false;
  miracleSunSystem.cullTimer = 0;

  ensureMiracleSunFlareOverlay();

  if (worldGroup) {
    const sunGrp = new THREE.Group();
    // 회전하는 코로나 없이 깔끔하고 따뜻한 소프트 로우 폴리곤 다면체 태양 구체 + 잔잔한 3D 빛무리
    const coreGeo = new THREE.IcosahedronGeometry(7.2, 1).toNonIndexed();
    coreGeo.computeVertexNormals();
    const coreMat = new THREE.MeshLambertMaterial({
      color: 0xfef08a,
      emissive: 0xfde047,
      emissiveIntensity: 0.82,
      flatShading: true
    });
    const core = new THREE.Mesh(coreGeo, coreMat);

    const flareGrp = new THREE.Group();
    flareGrp.add(new THREE.Mesh(
      new THREE.CircleGeometry(18, 12),
      new THREE.MeshBasicMaterial({ color: 0xfde047, transparent: true, opacity: 0.18, depthWrite: false })
    ));
    flareGrp.add(new THREE.Mesh(
      new THREE.CircleGeometry(32, 12),
      new THREE.MeshBasicMaterial({ color: 0xfb923c, transparent: true, opacity: 0.08, depthWrite: false })
    ));
    flareGrp.children[0].position.z = 2;
    flareGrp.children[1].position.z = 4;

    sunGrp.add(core, flareGrp);
    worldGroup.add(sunGrp);
    miracleSunSystem.sunVisualGroup = sunGrp;
    miracleSunSystem.sunCoronaMesh = null;
    miracleSunSystem.sunRaysGroup = null;
    miracleSunSystem.flareGroup = flareGrp;
  }
}

function updateMiracleDynamicSun(dt, now) {
  if (!miracleSunSystem.light) {
    setupMiracleDynamicSunAndShadows();
  }
  const light = miracleSunSystem.light;
  if (!light) return;

  // 1) 태양이 3분 주기로 부드럽게 궤도 이동 (그림자 고도는 36°~46°로 선명하게 유지, 하늘 태양은 시야에 잘 잡히는 황금빛 지평선 고도 16°~23°에 배치!)
  miracleSunSystem.angle += dt * miracleSunSystem.angularSpeed;
  const azim = Math.sin(miracleSunSystem.angle) * 1.18;
  const elevShadow = 0.64 + Math.cos(miracleSunSystem.angle * 2.0) * 0.12;
  const elevVisual = 0.28 + Math.cos(miracleSunSystem.angle * 2.0) * 0.06;

  const sunDist = 85.0;
  const offsetX = Math.sin(azim) * Math.cos(elevShadow) * sunDist;
  const offsetY = Math.sin(elevShadow) * sunDist;
  const offsetZ = Math.cos(azim) * Math.cos(elevShadow) * sunDist * 0.75 + 18.0;

  const visDist = 195.0;
  const visX = Math.sin(azim) * Math.cos(elevVisual) * visDist;
  const visY = Math.sin(elevVisual) * visDist;
  const visZ = Math.cos(azim) * Math.cos(elevVisual) * visDist * 0.78 + 24.0;

  // 2) 플레이어 주변으로 그림자 타깃 추적
  const focusX = playerPos ? playerPos.x : 0;
  const focusY = playerPos ? playerPos.y : 0;
  const focusZ = playerPos ? playerPos.z : 0;

  light.position.set(focusX + offsetX, focusY + offsetY, focusZ + offsetZ);
  if (miracleSunSystem.lightTarget) {
    miracleSunSystem.lightTarget.position.set(focusX, focusY, focusZ);
    miracleSunSystem.lightTarget.updateMatrixWorld();
  }

  if (miracleSunSystem.sunVisualGroup) {
    miracleSunSystem.sunVisualGroup.position.set(
      focusX + visX,
      focusY + visY,
      focusZ + visZ
    );
    if (miracleSunSystem.flareGroup && camera) {
      miracleSunSystem.flareGroup.lookAt(camera.position);
    }
    // 시선이 태양을 바라볼 때 화면 렌즈 플레어 발동
    updateMiracleSunScreenFlare(now);
  }

  // 3) 첫 프레임 즉시 컬링 빌드 + 0.25초마다 시야 밖 그림자 끄기
  if (!miracleSunSystem.cullBuilt) {
    updateMiracleShadowDistanceCulling(focusX, focusZ);
  } else {
    miracleSunSystem.cullTimer += dt;
    if (miracleSunSystem.cullTimer >= 0.25) {
      miracleSunSystem.cullTimer = 0;
      updateMiracleShadowDistanceCulling(focusX, focusZ);
    }
  }
}

// -------------------------------------------------------------------------
// 2. 소프트 로우 폴리곤 하늘 새 & 인체 비례 의복 / 헤드 / 후드 빌더
// -------------------------------------------------------------------------

let _flyingBirdGeoCache = null;
function getFlyingBirdGeos() {
  if (_flyingBirdGeoCache) return _flyingBirdGeoCache;

  const bodyGeo = new THREE.IcosahedronGeometry(0.18, 0);
  bodyGeo.scale(0.68, 0.62, 1.72);
  const bodyNon = markCachedGeo(bodyGeo.toNonIndexed());
  bodyNon.computeVertexNormals();

  const headGeo = new THREE.IcosahedronGeometry(0.105, 0);
  headGeo.scale(0.95, 0.92, 1.10);
  const headNon = markCachedGeo(headGeo.toNonIndexed());
  headNon.computeVertexNormals();

  const beakGeo = new THREE.ConeGeometry(0.036, 0.14, 4);
  beakGeo.rotateX(Math.PI / 2);
  const beakNon = markCachedGeo(beakGeo.toNonIndexed());
  beakNon.computeVertexNormals();

  const tailGeo = new THREE.ConeGeometry(0.14, 0.28, 3);
  tailGeo.rotateX(-Math.PI / 2);
  tailGeo.scale(1.0, 0.26, 1.0);
  const tailNon = markCachedGeo(tailGeo.toNonIndexed());
  tailNon.computeVertexNormals();

  // 좌·우 날개 (어깨에서 바깥쪽·뒤쪽으로 꺾여 날아가는 소프트 로우폴리 갈매기/비둘기 날개)
  const buildWingGeo = (side) => {
    const P = (x, y, z) => [x * side, y, z];
    const rF = P(0.02,  0.02,  0.11);
    const rB = P(0.02,  0.00, -0.10);
    const rD = P(0.02, -0.04,  0.00);
    const mF = P(0.32,  0.05,  0.08);
    const mB = P(0.30,  0.02, -0.11);
    const mD = P(0.30,  0.00, -0.01);
    const tip = P(0.62, -0.02, -0.07);

    const v = [];
    const emitT = (a, b, c) => (side > 0 ? pushTriangle(v, a, b, c) : pushTriangle(v, a, c, b));
    const emitQ = (a, b, c, d) => { emitT(a, b, c); emitT(a, c, d); };
    // 안쪽 날개 상면·하면
    emitQ(rF, mF, mB, rB);
    emitQ(rF, rD, mD, mF);
    emitQ(rD, rB, mB, mD);
    // 바깥 날개끝 삼각 날개
    emitT(mF, tip, mB);
    emitT(mF, mD, tip);
    emitT(mD, mB, tip);
    return markCachedGeo(buildBufferGeoFromTriangles(v));
  };

  _flyingBirdGeoCache = {
    body: bodyNon,
    head: headNon,
    beak: beakNon,
    tail: tailNon,
    wingL: buildWingGeo(-1),
    wingR: buildWingGeo(1)
  };
  return _flyingBirdGeoCache;
}

// 하늘을 나는 작은 새 모델링 (소프트 로우 폴리곤)
window.createFlyingBirdMesh = function (bodyHex = '#f8fafc', wingHex = '#cbd5e1', scale = 1.0) {
  const geos = getFlyingBirdGeos();
  const g = new THREE.Group();

  const body = createLowPolyMesh(geos.body, bodyHex, 0, 0, 0, false);
  const head = createLowPolyMesh(geos.head, bodyHex, 0, 0.065, 0.25, false);
  const beak = createLowPolyMesh(geos.beak, '#f59e0b', 0, 0.05, 0.37, false);
  const tail = createLowPolyMesh(geos.tail, wingHex, 0, 0.02, -0.34, false);

  const wingL = new THREE.Group();
  wingL.position.set(-0.08, 0.03, 0.04);
  wingL.add(createLowPolyMesh(geos.wingL, wingHex, 0, 0, 0, false));

  const wingR = new THREE.Group();
  wingR.position.set(0.08, 0.03, 0.04);
  wingR.add(createLowPolyMesh(geos.wingR, wingHex, 0, 0, 0, false));

  g.add(body, head, beak, tail, wingL, wingR);
  g.scale.set(scale, scale, scale);
  g.userData = { wingL, wingR, phase: Math.random() * Math.PI * 2 };
  return g;
};

// 2-1) 12각 아코디언 주름(Pleated) A라인 롱 스커트 지오메트리
let _pleatedAlineSkirtGeo = null;
function getPleatedAlineSkirtGeo() {
  if (_pleatedAlineSkirtGeo) return _pleatedAlineSkirtGeo;

  const radialSegs = 12;
  const height = 0.84;
  const geo = new THREE.CylinderGeometry(0.24, 0.44, height, radialSegs, 2, false);
  const pos = geo.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);
    const r = Math.hypot(x, z);

    if (r > 0.04) {
      const ang = Math.atan2(z, x);
      const stepIdx = Math.round(((ang + Math.PI) / (Math.PI * 2)) * radialSegs);
      const heightRatio = (height * 0.5 - y) / height;
      const pleatAmp = 0.02 + heightRatio * 0.055;
      const pleatScale = (stepIdx % 2 === 0) ? (1 + pleatAmp) : (1 - pleatAmp);

      x *= pleatScale;
      z *= pleatScale * 0.74;

      if (y < -height * 0.45) {
        y += (stepIdx % 2 === 0) ? -0.012 : 0.012;
      }
    } else {
      z *= 0.74;
    }
    pos.setXYZ(i, x, y, z);
  }

  const finalGeo = markCachedGeo(geo.toNonIndexed());
  finalGeo.computeVertexNormals();
  _pleatedAlineSkirtGeo = finalGeo;
  return finalGeo;
}

// 2-2) 슬림한 역삼각형 인체 상체(Torso) 지오메트리
let _anatomicalUpperTorsoGeo = null;
function getAnatomicalUpperTorsoGeo() {
  if (_anatomicalUpperTorsoGeo) return _anatomicalUpperTorsoGeo;

  const geo = new THREE.CylinderGeometry(0.25, 0.22, 0.52, 8, 2, false);
  const pos = geo.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);

    z *= 0.64;
    if (y > 0.16) {
      x *= 0.80;
      z *= 0.80;
    }
    pos.setXYZ(i, x, y, z);
  }

  const finalGeo = markCachedGeo(geo.toNonIndexed());
  finalGeo.computeVertexNormals();
  _anatomicalUpperTorsoGeo = finalGeo;
  return finalGeo;
}

// 2-3) 소프트 로우 폴리곤 둥근 두상 빌더 (두건 착용/미착용·성별 분리 캐시)
const _softLowPolyHeadGeoCache = {};
function getSoftLowPolyHeadGeo(isHooded = false, isFemale = false) {
  const key = `${isHooded ? 'H' : 'U'}_${isFemale ? 'F' : 'M'}`;
  if (_softLowPolyHeadGeoCache[key]) return _softLowPolyHeadGeoCache[key];

  const geo = new THREE.SphereGeometry(1.0, 12, 8);
  const pos = geo.attributes.position;

  const rx = isHooded ? (isFemale ? 0.234 : 0.242) : 0.256;
  const ry = isHooded ? (isFemale ? 0.264 : 0.270) : 0.284;
  const rz = isHooded ? (isFemale ? 0.236 : 0.242) : 0.254;
  const yOff = isHooded ? 0.008 : 0.016;
  const jawTaper = isFemale ? 0.29 : 0.22;

  for (let i = 0; i < pos.count; i++) {
    const ux = pos.getX(i);
    const uy = pos.getY(i);
    const uz = pos.getZ(i);

    let x = ux * rx;
    let y = uy * ry + yOff;
    let z = uz * rz;

    // 1) 상단 두개골 & 뒤통수 자연스러운 달걀형 볼륨 (두건 미착용 시 둥근 입체 두상)
    if (!isHooded) {
      if (uy > 0.15) {
        const crownT = Math.sin(((uy - 0.15) / 0.85) * Math.PI);
        x *= 1.0 + 0.045 * crownT;
        if (uz < -0.1) z -= 0.018 * crownT * Math.abs(uz);
      }
      if (uz < -0.25 && uy > -0.35 && uy < 0.45) {
        z -= 0.012 * Math.abs(uz);
      }
    }

    // 2) 정면 안면부: 눈·이마 영역을 부드럽게 다듬어 이목구비와 입체 코가 자연스럽게 안착
    if (uz > 0.45 && uy > -0.30 && uy < 0.58) {
      const fT = (uz - 0.45) / 0.55;
      z -= 0.014 * fT * fT;
    }
    // 광대뼈의 따뜻한 둥근 볼륨
    if (uz > 0.15 && uy > -0.35 && uy < 0.18 && Math.abs(ux) > 0.35) {
      const cheekT = Math.sin(Math.min(1, (Math.abs(ux) - 0.35) / 0.55) * Math.PI);
      x += Math.sign(ux) * 0.010 * cheekT;
      z += 0.008 * cheekT;
    }

    // 3) 턱선 & 턱 끝: 각진 큐브 대신 부드럽게 좁아지는 소프트 로우폴리 턱라인
    if (uy < -0.10) {
      const t = Math.min(1.0, (-uy - 0.10) / 0.90);
      x *= 1.0 - jawTaper * Math.pow(t, 1.32);
      if (uz > 0.35 && uy > -0.86) {
        z += (isFemale ? 0.008 : 0.014) * Math.sin(t * Math.PI);
      }
      if (uy < -0.55 && uz < 0.15) {
        z += 0.020 * (( -uy - 0.55 ) / 0.45);
        y += 0.018 * (( -uy - 0.55 ) / 0.45);
      }
    }

    // 4) 두건 착용 캐릭터: 정면 얼굴은 그대로 살리고, 두건 내부(상단·후면·측면)는 엄격히 내측 수납
    if (isHooded) {
      if (uz < 0.25) {
        const backT = Math.min(1.0, (0.25 - uz) / 1.25);
        x *= 1.0 - 0.14 * backT;
        z = Math.max(z, isFemale ? -0.165 : -0.172);
      }
      if (y > 0.195) {
        y = 0.195 + (y - 0.195) * 0.40;
      }
    }

    pos.setXYZ(i, x, y, z);
  }

  const finalGeo = markCachedGeo(geo.toNonIndexed());
  finalGeo.computeVertexNormals();
  _softLowPolyHeadGeoCache[key] = finalGeo;
  return finalGeo;
}

function getChamferedFaceGeo() {
  return getSoftLowPolyHeadGeo(false, false);
}

// 2-3b) 입체 다면체 코 (콧등·코끝·콧볼·코밑 음영면이 명확히 살아나는 소프트 로우 폴리곤)
const _sculptedNoseGeoCache = {};
function getSculptedNoseGeo(isFemale = false) {
  const key = isFemale ? 'F' : 'M';
  if (_sculptedNoseGeoCache[key]) return _sculptedNoseGeoCache[key];

  const sx = isFemale ? 0.84 : 1.0;
  const sy = isFemale ? 0.88 : 1.0;
  const sz = isFemale ? 0.85 : 1.0;
  const tipLift = isFemale ? 0.005 : 0.0;

  const P = (x, y, z) => [x * sx, y * sy, z * sz];
  const R_T = P( 0.000,  0.066, -0.018);
  const R_L = P(-0.022,  0.056, -0.026);
  const R_R = P( 0.022,  0.056, -0.026);
  const B_L = P(-0.015,  0.024,  0.040);
  const B_R = P( 0.015,  0.024,  0.040);
  const T_C = [0, (-0.022 + tipLift) * sy, 0.076 * sz];
  const T_L = P(-0.022, -0.026 + tipLift * 0.5,  0.050);
  const T_R = P( 0.022, -0.026 + tipLift * 0.5,  0.050);
  const M_L = P(-0.032,  0.004, -0.026);
  const M_R = P( 0.032,  0.004, -0.026);
  const A_L = P(-0.040, -0.036,  0.016);
  const A_R = P( 0.040, -0.036,  0.016);
  const U_L = P(-0.034, -0.044, -0.026);
  const U_R = P( 0.034, -0.044, -0.026);
  const U_C = P( 0.000, -0.052, -0.008);

  const v = [];
  // 콧등 & 코끝 (빛을 받는 상·정면)
  pushTriangle(v, R_T, B_L, B_R);
  pushTriangle(v, B_L, T_C, B_R);
  pushTriangle(v, B_L, T_L, T_C);
  pushTriangle(v, B_R, T_C, T_R);
  // 좌측 콧벽 & 콧볼
  pushTriangle(v, R_T, R_L, B_L);
  pushTriangle(v, R_L, M_L, B_L);
  pushTriangle(v, B_L, M_L, A_L);
  pushTriangle(v, B_L, A_L, T_L);
  pushTriangle(v, M_L, U_L, A_L);
  // 우측 콧벽 & 콧볼
  pushTriangle(v, R_T, B_R, R_R);
  pushTriangle(v, R_R, B_R, M_R);
  pushTriangle(v, B_R, A_R, M_R);
  pushTriangle(v, B_R, T_R, A_R);
  pushTriangle(v, M_R, A_R, U_R);
  // 코밑 음영면 (입체감을 결정짓는 하단면)
  pushTriangle(v, T_L, A_L, U_C);
  pushTriangle(v, T_L, U_C, T_C);
  pushTriangle(v, T_C, U_C, T_R);
  pushTriangle(v, T_R, U_C, A_R);
  pushTriangle(v, A_L, U_L, U_C);
  pushTriangle(v, A_R, U_C, U_R);

  const geo = markCachedGeo(buildBufferGeoFromTriangles(v));
  _sculptedNoseGeoCache[key] = geo;
  return geo;
}

// 2-3c) 입체 다면체 귀 (귓바퀴 테두리·오목한 귓구멍 굴곡·귓불·둥근 후면까지 완전 폐곡면)
let _sculptedEarGeoL = null;
let _sculptedEarGeoR = null;
function getSculptedEarGeo(isLeft = false) {
  if (isLeft && _sculptedEarGeoL) return _sculptedEarGeoL;
  if (!isLeft && _sculptedEarGeoR) return _sculptedEarGeoR;

  const side = isLeft ? -1 : 1;
  // 우측 귀 기준 (+X 외측, CCW 8점 외곽 귓바퀴 루프)
  const profileYZ = [
    [ 0.054,  0.036], // 0: 앞-상단 뿌리
    [-0.006,  0.032], // 1: 이주(tragus)
    [-0.056,  0.024], // 2: 앞-하단 귓불 뿌리
    [-0.078, -0.008], // 3: 귓불 하단
    [-0.050, -0.042], // 4: 하단 후면 귓바퀴
    [ 0.006, -0.054], // 5: 중앙 후면 귓바퀴
    [ 0.060, -0.036], // 6: 상단 후면 귓바퀴
    [ 0.076,  0.004]  // 7: 귓바퀴 최상단
  ];
  const outerX = [0.010, 0.022, 0.012, 0.032, 0.050, 0.060, 0.058, 0.036];
  const rimScale = [0.76, 0.62, 0.74, 0.68, 0.66, 0.64, 0.66, 0.68];

  const root = [];
  const outer = [];
  const innerRim = [];
  for (let i = 0; i < 8; i++) {
    const py = profileYZ[i][0];
    const pz = profileYZ[i][1];
    const ox = outerX[i];
    root.push([side * (-0.026), py * 0.76, pz * 0.76 + 0.005]);
    outer.push([side * ox, py, pz]);
    // 귓바퀴 앞쪽 안쪽 테두리 (볼록한 림 + 오목한 귓구멍 전환)
    const rs = rimScale[i];
    const ix = (i <= 2) ? (ox * 0.64) : (ox - 0.005);
    innerRim.push([side * ix, py * rs - 0.002, pz * rs + 0.004]);
  }
  const bowlCenter = [side * 0.005, -0.004, 0.003];

  const v = [];
  const emitTri = (a, b, c) => {
    if (side > 0) pushTriangle(v, a, b, c);
    else pushTriangle(v, a, c, b);
  };
  const emitQuad = (a, b, c, d) => {
    emitTri(a, b, c);
    emitTri(a, c, d);
  };

  for (let i = 0; i < 8; i++) {
    const n = (i + 1) % 8;
    // 1) 귀 뒤쪽 둥근 연결면 (두개골에 틈새 없이 밀착)
    emitQuad(root[i], root[n], outer[n], outer[i]);
    // 2) 두툼한 귓바퀴 외곽 베벨 림
    emitQuad(outer[i], outer[n], innerRim[n], innerRim[i]);
    // 3) 오목하게 패인 귓구멍(이갑개) 입체 음영면
    emitTri(bowlCenter, innerRim[i], innerRim[n]);
  }

  const geo = markCachedGeo(buildBufferGeoFromTriangles(v));
  if (isLeft) _sculptedEarGeoL = geo;
  else _sculptedEarGeoR = geo;
  return geo;
}

// 2-3d) 둥근 얼굴 곡면에 밀착하는 소프트 로우 폴리곤 이목구비 (눈·눈썹·입체 코·미소)
let _softEyeGeo = null;
let _softBrowGeo = null;
let _softSmileGeo = null;
function getSoftEyeGeo() {
  if (_softEyeGeo) return _softEyeGeo;
  const geo = new THREE.CylinderGeometry(0.032, 0.032, 0.024, 6);
  geo.rotateX(Math.PI / 2);
  geo.scale(0.95, 1.72, 0.90);
  const finalGeo = markCachedGeo(geo.toNonIndexed());
  finalGeo.computeVertexNormals();
  _softEyeGeo = finalGeo;
  return finalGeo;
}
let _softBrowGeoM = null;
let _softBrowGeoF = null;
function getSoftBrowGeo(isFemale = false) {
  if (isFemale && _softBrowGeoF) return _softBrowGeoF;
  if (!isFemale && _softBrowGeoM) return _softBrowGeoM;
  const r1 = isFemale ? 0.010 : 0.013;
  const r2 = isFemale ? 0.012 : 0.015;
  const len = isFemale ? 0.098 : 0.106;
  const geo = new THREE.CylinderGeometry(r1, r2, len, 5);
  geo.rotateZ(Math.PI / 2);
  geo.scale(1.0, 0.92, 0.65);
  const finalGeo = markCachedGeo(geo.toNonIndexed());
  finalGeo.computeVertexNormals();
  if (isFemale) _softBrowGeoF = finalGeo;
  else _softBrowGeoM = finalGeo;
  return finalGeo;
}
function getSoftSmileGeo() {
  if (_softSmileGeo) return _softSmileGeo;
  // 곡면 입술을 따라 부드럽게 감싸는 3분할 아치형 미소
  const geo = new THREE.BoxGeometry(0.096, 0.026, 0.022, 3, 1, 1);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const nx = x / 0.048;
    z -= nx * nx * 0.012;
    y += nx * nx * 0.006;
    pos.setXYZ(i, x, y, z);
  }
  const finalGeo = markCachedGeo(geo.toNonIndexed());
  finalGeo.computeVertexNormals();
  _softSmileGeo = finalGeo;
  return finalGeo;
}

function createSoftFacialFeaturesGroup(skinHex, hairHex, isFemale = false, isHooded = false, browHex = null) {
  const grp = new THREE.Group();
  const zEye   = isHooded ? (isFemale ? 0.214 : 0.220) : 0.228;
  const zBrow  = isHooded ? (isFemale ? 0.212 : 0.218) : 0.226;
  const zNose  = isHooded ? (isFemale ? 0.224 : 0.230) : 0.238;
  const zMouth = isHooded ? (isFemale ? 0.216 : 0.222) : 0.232;
  const eyeX   = isFemale ? 0.094 : 0.102;

  const eyeCol = '#1e1815';
  const actualBrowCol = browHex || hairHex;
  const eyeL = createLowPolyMesh(getSoftEyeGeo(), eyeCol, -eyeX, 0.028, zEye, false);
  eyeL.rotation.y = -0.26;
  const eyeR = createLowPolyMesh(getSoftEyeGeo(), eyeCol,  eyeX, 0.028, zEye, false);
  eyeR.rotation.y =  0.26;

  const browL = createLowPolyMesh(getSoftBrowGeo(isFemale), actualBrowCol, -eyeX, 0.126, zBrow, false);
  browL.rotation.y = -0.24;
  browL.rotation.z =  0.035;
  const browR = createLowPolyMesh(getSoftBrowGeo(isFemale), actualBrowCol,  eyeX, 0.126, zBrow, false);
  browR.rotation.y =  0.24;
  browR.rotation.z = -0.035;

  const nose = createLowPolyMesh(getSculptedNoseGeo(isFemale), skinHex, 0, -0.006, zNose, false);
  const smileMouth = createLowPolyMesh(getSoftSmileGeo(), isFemale ? '#c87e6d' : '#b57c68', 0, -0.132, zMouth, false);

  grp.add(eyeL, eyeR, browL, browR, nose, smileMouth);
  return grp;
}

// 2-3e) 둥근 턱선을 따라 밀착하는 소프트 로우 폴리곤 수염 & 콧수염 (두건 착용 시 외부 돌출 0%)
const _softBeardGeoCache = {};
function getSoftBeardGeo(style = 'short', isHooded = false) {
  const key = `${style}_${isHooded ? 'H' : 'U'}`;
  if (_softBeardGeoCache[key]) return _softBeardGeoCache[key];

  const segs = 6;
  const maxPhi = isHooded ? 0.94 : 1.24;
  const chinDrop = (style === 'full' || style === 'jesus') ? -0.296 : (style === 'short' ? -0.278 : -0.262);
  const thick = (style === 'full' || style === 'jesus') ? 0.036 : (style === 'short' ? 0.028 : 0.022);
  const baseRx = isHooded ? 0.214 : 0.238;
  const baseRz = isHooded ? 0.232 : 0.244;

  // 4개의 수직 단면 링 (0: 볼 상단 테두리, 1: 턱선 외곽, 2: 턱 하단 끝, 3: 턱밑 내측 마감)
  const rows = 4;
  const outerGrid = [];
  const innerGrid = [];

  for (let r = 0; r < rows; r++) {
    const oRow = [];
    const iRow = [];
    for (let c = 0; c <= segs; c++) {
      const u = (c / segs) * 2 - 1; // -1 .. +1
      const phi = u * maxPhi;
      const absU = Math.abs(u);
      const centerW = Math.cos(u * Math.PI * 0.5); // 1 at chin center, 0 at cheek ends

      let y, radScale, zBoost;
      if (r === 0) {
        // 상단 경계: 입 아래는 내려가고 볼 옆쪽은 구레나룻까지 자연스럽게 연결
        y = -0.162 + absU * absU * 0.155;
        radScale = 0.96 - (1 - absU) * 0.04;
        zBoost = 0.010 * centerW;
      } else if (r === 1) {
        // 턱 모서리 외곽 볼륨
        y = -0.224 + absU * absU * 0.072;
        radScale = 0.92 - (1 - absU) * 0.06;
        zBoost = (0.016 + thick * 0.45) * centerW;
      } else if (r === 2) {
        // 턱 끝 (부드러운 둥근 곡선 턱수염)
        y = chinDrop + absU * absU * (Math.abs(chinDrop) - 0.188);
        radScale = 0.72 + absU * 0.10;
        zBoost = (0.010 + thick * 0.32) * centerW;
      } else {
        // 턱밑 내측 수납
        y = chinDrop + 0.055 + absU * absU * 0.04;
        radScale = 0.44;
        zBoost = -0.025;
      }

      let ox = Math.sin(phi) * (baseRx * radScale + (r < 3 ? thick * 0.45 : 0));
      let oz = Math.cos(phi) * (baseRz * radScale + (r < 3 ? thick * 0.45 : 0)) + zBoost;

      // 두건 착용 시 턱수염이 두건 안쪽 벽을 절대 넘지 않도록 엄격 클램프
      if (isHooded) {
        ox = Math.max(-0.214, Math.min(0.214, ox));
        oz = Math.max(0.055, oz);
      }

      const ix = ox * 0.78;
      const iz = oz * 0.78 - 0.015;
      oRow.push([ox, y, oz]);
      iRow.push([ix, y + 0.008, iz]);
    }
    outerGrid.push(oRow);
    innerGrid.push(iRow);
  }

  const v = [];
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < segs; c++) {
      pushQuad(v, outerGrid[r][c], outerGrid[r + 1][c], outerGrid[r + 1][c + 1], outerGrid[r][c + 1]);
      pushQuad(v, innerGrid[r][c], innerGrid[r][c + 1], innerGrid[r + 1][c + 1], innerGrid[r + 1][c]);
    }
  }
  // 상단 테두리 마감
  for (let c = 0; c < segs; c++) {
    pushQuad(v, innerGrid[0][c], outerGrid[0][c], outerGrid[0][c + 1], innerGrid[0][c + 1]);
  }
  // 좌·우 볼 끝단 마감
  for (let r = 0; r < rows - 1; r++) {
    pushQuad(v, innerGrid[r][0], innerGrid[r + 1][0], outerGrid[r + 1][0], outerGrid[r][0]);
    pushQuad(v, outerGrid[r][segs], outerGrid[r + 1][segs], innerGrid[r + 1][segs], innerGrid[r][segs]);
  }

  const geo = markCachedGeo(buildBufferGeoFromTriangles(v));
  _softBeardGeoCache[key] = geo;
  return geo;
}

let _softStacheWingGeoL = null;
let _softStacheWingGeoR = null;
function getSoftStacheWingGeo(isLeft) {
  if (isLeft && _softStacheWingGeoL) return _softStacheWingGeoL;
  if (!isLeft && _softStacheWingGeoR) return _softStacheWingGeoR;
  const side = isLeft ? -1 : 1;
  const geo = new THREE.CylinderGeometry(0.016, 0.024, 0.115, 5);
  geo.rotateZ(side * (Math.PI / 2 - 0.34));
  geo.rotateY(side * 0.28);
  geo.scale(1.0, 0.92, 0.72);
  const finalGeo = markCachedGeo(geo.toNonIndexed());
  finalGeo.computeVertexNormals();
  if (isLeft) _softStacheWingGeoL = finalGeo;
  else _softStacheWingGeoR = finalGeo;
  return finalGeo;
}

function createSoftLowPolyBeardGroup(style = 'short', beardHex = '#2b1d12', isHooded = false) {
  const grp = new THREE.Group();
  grp.name = 'beard';
  const jawMesh = createLowPolyMesh(getSoftBeardGeo(style, isHooded), beardHex, 0, 0, 0);
  const zSt = isHooded ? 0.232 : 0.242;
  const stL = createLowPolyMesh(getSoftStacheWingGeo(true),  beardHex, -0.048, -0.098, zSt, false);
  const stR = createLowPolyMesh(getSoftStacheWingGeo(false), beardHex,  0.048, -0.098, zSt, false);
  grp.add(jawMesh, stL, stR);
  return grp;
}

// 2-3f) 두건 미착용 남자 캐릭터용 둥근 소프트 로우 폴리곤 헤어 (귀 노출 + 둥근 뒤통수 마감)
const _softMaleHairCapGeoCache = {};
function getSoftMaleHairCapGeo(styleIdx = 0) {
  const key = `M_${styleIdx % 2}`;
  if (_softMaleHairCapGeoCache[key]) return _softMaleHairCapGeoCache[key];

  // 14방위 x 5위도 링으로 이마·귀 위 아치·목덜미까지 정확히 조각한 두툼한 폐곡면 헤어 캡
  const cols = 14;
  const rows = 5;
  const seed = styleIdx * 1.9 + 0.5;
  const isCurly = (styleIdx % 2 === 1);

  const outerRings = [];
  const innerRings = [];

  const apexOut = [Math.sin(seed) * 0.012, 0.348 + (isCurly ? 0.014 : 0), -0.018];
  const apexIn  = [0, 0.260, -0.010];

  for (let r = 1; r <= rows; r++) {
    const oRow = [];
    const iRow = [];
    const vFrac = r / rows;
    for (let c = 0; c < cols; c++) {
      const phi = (c / cols) * Math.PI * 2;
      const sinP = Math.sin(phi);
      const cosP = Math.cos(phi);

      const frontMask = Math.max(0, cosP);
      const backMask  = Math.max(0, -cosP);
      // 귀 바로 위 영역만 정밀 아치 절개, 귀 앞 관자놀이와 귀 뒤 목덜미는 풍성하게 감쌈
      const earZone   = Math.exp(-Math.pow((cosP + 0.02) / 0.28, 2)) * Math.pow(Math.abs(sinP), 2.5);

      let thetaMax = 1.02 * frontMask + (isCurly ? 2.34 : 2.28) * backMask + 1.54 * (1 - frontMask - backMask);
      thetaMax -= earZone * 0.40;
      thetaMax += Math.sin(phi * 2 + seed) * 0.042 * frontMask;

      const theta = vFrac * thetaMax;
      const sinT = Math.sin(theta);
      const cosT = Math.cos(theta);

      const wave = (isCurly ? 0.018 : 0.011) * Math.sin(phi * (isCurly ? 6 : 4) + r * 0.9 + seed)
                 + (isCurly ? 0.012 : 0.008) * Math.cos(phi * 3 - r * 1.1);
      const thick = (0.040 + (isCurly ? 0.014 : 0.006)) * (0.72 + 0.35 * Math.sin(vFrac * Math.PI)) + wave;

      const rx = 0.264 + thick;
      const ry = 0.292 + thick * 0.92;
      const rz = 0.264 + thick;

      let ox = sinP * sinT * rx;
      let oy = cosT * ry + 0.020;
      let oz = cosP * sinT * rz - 0.010;

      if (r === rows && backMask > 0.2) {
        ox *= 0.90;
        oz += 0.026 * backMask;
      }

      const inScale = (r === rows) ? 0.84 : 0.86;
      const ix = ox * inScale;
      const iy = (oy - 0.016) * 0.90 + 0.016;
      const iz = oz * inScale;

      oRow.push([ox, oy, oz]);
      iRow.push([ix, iy, iz]);
    }
    outerRings.push(oRow);
    innerRings.push(iRow);
  }

  const v = [];
  for (let c = 0; c < cols; c++) {
    const cn = (c + 1) % cols;
    pushTriangle(v, apexOut, outerRings[0][c], outerRings[0][cn]);
    pushTriangle(v, apexIn, innerRings[0][cn], innerRings[0][c]);
  }
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols; c++) {
      const cn = (c + 1) % cols;
      pushQuad(v, outerRings[r][c], outerRings[r + 1][c], outerRings[r + 1][cn], outerRings[r][cn]);
      pushQuad(v, innerRings[r][c], innerRings[r][cn], innerRings[r + 1][cn], innerRings[r + 1][c]);
    }
  }
  const lastR = rows - 1;
  for (let c = 0; c < cols; c++) {
    const cn = (c + 1) % cols;
    pushQuad(v, outerRings[lastR][c], innerRings[lastR][c], innerRings[lastR][cn], outerRings[lastR][cn]);
  }

  const geo = markCachedGeo(buildBufferGeoFromTriangles(v));
  _softMaleHairCapGeoCache[key] = geo;
  return geo;
}

function createSoftMaleHairGroup(hairHex, styleIdx = 0) {
  const hairGrp = new THREE.Group();
  hairGrp.name = 'hair';

  const capMesh = createLowPolyMesh(getSoftMaleHairCapGeo(styleIdx), hairHex, 0, 0, 0);
  hairGrp.add(capMesh);

  if (styleIdx % 2 === 0) {
    // 스타일 0: 자연스러운 옆가르마 웨이브 앞머리
    const swoop1 = createLowPolyMesh(new THREE.DodecahedronGeometry(0.115, 0), hairHex, -0.095, 0.255, 0.165);
    swoop1.scale.set(1.35, 0.68, 0.92);
    swoop1.rotation.set(0.18, 0.25, 0.22);

    const swoop2 = createLowPolyMesh(new THREE.DodecahedronGeometry(0.105, 0), hairHex, 0.085, 0.260, 0.155);
    swoop2.scale.set(1.22, 0.64, 0.88);
    swoop2.rotation.set(0.14, -0.22, -0.26);

    const bangTip = createLowPolyMesh(new THREE.ConeGeometry(0.055, 0.135, 5), hairHex, -0.155, 0.190, 0.212, false);
    bangTip.rotation.set(0.32, 0.20, 0.62);

    const crownTuft = createLowPolyMesh(new THREE.DodecahedronGeometry(0.11, 0), hairHex, 0.02, 0.325, 0.04);
    crownTuft.scale.set(1.35, 0.52, 1.15);
    crownTuft.rotation.y = 0.4;

    hairGrp.add(swoop1, swoop2, bangTip, crownTuft);
  } else {
    // 스타일 1: 풍성하고 둥근 갈릴리 웨이브/곱슬 텍스처 헤어
    const curls = [
      { x: -0.11, y: 0.255, z: 0.175, r: 0.095, sx: 1.15, sy: 0.72, sz: 0.95, rx: 0.1, ry: 0.3, rz: 0.2 },
      { x:  0.02, y: 0.268, z: 0.192, r: 0.092, sx: 1.18, sy: 0.68, sz: 0.88, rx: 0.2, ry: -0.2, rz: -0.1 },
      { x:  0.14, y: 0.245, z: 0.160, r: 0.090, sx: 1.10, sy: 0.72, sz: 0.92, rx: 0.1, ry: -0.4, rz: -0.25 },
      { x: -0.19, y: 0.220, z: 0.085, r: 0.088, sx: 0.95, sy: 0.85, sz: 1.10, rx: 0.0, ry: 0.5, rz: 0.15 },
      { x:  0.19, y: 0.220, z: 0.085, r: 0.088, sx: 0.95, sy: 0.85, sz: 1.10, rx: 0.0, ry: -0.5, rz: -0.15 },
      { x: -0.05, y: 0.325, z: -0.02, r: 0.115, sx: 1.30, sy: 0.56, sz: 1.15, rx: -0.1, ry: 0.7, rz: 0.08 }
    ];
    curls.forEach(c => {
      const m = createLowPolyMesh(new THREE.DodecahedronGeometry(c.r, 0), hairHex, c.x, c.y, c.z);
      m.scale.set(c.sx, c.sy, c.sz);
      m.rotation.set(c.rx, c.ry, c.rz);
      hairGrp.add(m);
    });
  }

  // 귀 앞 관자놀이~구레나룻: 윗머리와 턱수염을 자연스럽게 이어주며 입체 귀는 완벽히 개방
  const sbGeo = new THREE.CylinderGeometry(0.028, 0.018, 0.195, 5);
  sbGeo.scale(0.85, 1.0, 1.15);
  const sbNonIdx = sbGeo.toNonIndexed();
  sbNonIdx.computeVertexNormals();
  const sideburnL = createLowPolyMesh(sbNonIdx, hairHex, -0.232, 0.055, 0.084, false);
  sideburnL.rotation.set(0.08, 0, -0.05);
  const sideburnR = createLowPolyMesh(sbNonIdx, hairHex,  0.232, 0.055, 0.084, false);
  sideburnR.rotation.set(0.08, 0,  0.05);
  hairGrp.add(sideburnL, sideburnR);

  return hairGrp;
}

// 2-3g) 두건 안쪽 머리카락 (개방된 앞 얼굴 창 상단 헤어라인에 밀착 수납 → 두건 밖 돌출 0%)
const _hoodedHairCurtainCache = {};
function getHoodedHairCurtainGeo(isFemale = false) {
  const key = isFemale ? 'F' : 'M';
  if (_hoodedHairCurtainCache[key]) return _hoodedHairCurtainCache[key];

  // 이마 곡면(x ∈ [-0.205, +0.205])을 따라 부드럽게 아치형(/ \)으로 흐르는 일체형 가르마 앞머리
  const segs = 6;
  const maxPhi = isFemale ? 0.94 : 0.78;
  const baseRx = isFemale ? 0.210 : 0.214;
  const baseRz = isFemale ? 0.228 : 0.232;

  const topOut = [], botOut = [], topIn = [], botIn = [];
  for (let c = 0; c <= segs; c++) {
    const u = (c / segs) * 2 - 1; // -1 .. +1
    const absU = Math.abs(u);
    const phi = u * maxPhi;

    // 상단선: 두건 이마 아치 바로 안쪽(y <= 0.215)에 수납
    const yTop = isFemale
      ? (0.212 - absU * absU * 0.048)
      : (0.214 - absU * absU * 0.032);
    // 하단선: 중앙 5:5 가르마는 높게 열리고 양옆 관자놀이로 부드럽게 내려오는 우아한 아치형(/ \)
    const yBot = isFemale
      ? (0.194 - Math.pow(absU, 1.35) * 0.095)
      : (0.188 - Math.pow(absU, 1.40) * 0.046 + (u < 0 ? -0.010 * (1 - absU) : 0));

    const ox = Math.sin(phi) * baseRx;
    const oz = Math.cos(phi) * baseRz;
    const ix = ox * 0.84;
    const iz = oz * 0.84 - 0.012;

    topOut.push([ox, yTop, oz - 0.008]);
    botOut.push([ox, yBot, oz + 0.004]);
    topIn.push([ix, yTop, iz]);
    botIn.push([ix, yBot, iz]);
  }

  const v = [];
  for (let c = 0; c < segs; c++) {
    pushQuad(v, topOut[c], botOut[c], botOut[c + 1], topOut[c + 1]);
    pushQuad(v, botOut[c], botIn[c],  botIn[c + 1],  botOut[c + 1]);
    pushQuad(v, topIn[c],  topOut[c], topOut[c + 1], topIn[c + 1]);
  }
  pushQuad(v, topIn[0], botIn[0], botOut[0], topOut[0]);
  pushQuad(v, topOut[segs], botOut[segs], botIn[segs], topIn[segs]);

  const geo = markCachedGeo(buildBufferGeoFromTriangles(v));
  _hoodedHairCurtainCache[key] = geo;
  return geo;
}

function createHoodedInnerHairGroup(hairHex, isFemale = false) {
  const grp = new THREE.Group();
  grp.name = 'innerHair';

  const curtain = createLowPolyMesh(getHoodedHairCurtainGeo(isFemale), hairHex, 0, 0, 0, false);
  grp.add(curtain);

  if (isFemale) {
    // 뺨 옆 잔머리: 관자놀이에서 볼 옆으로 얇게 밀착 (두건 내측 벽 |x|>=0.25 안쪽에 엄격 수납)
    const wGeo = new THREE.CylinderGeometry(0.022, 0.012, 0.185, 5);
    wGeo.scale(0.82, 1.0, 0.65);
    const g = wGeo.toNonIndexed();
    g.computeVertexNormals();
    const wispL = createLowPolyMesh(g, hairHex, -0.194, 0.032, 0.162, false);
    wispL.rotation.set(-0.06, -0.22,  0.08);
    const wispR = createLowPolyMesh(g, hairHex,  0.194, 0.032, 0.162, false);
    wispR.rotation.set(-0.06,  0.22, -0.08);
    grp.add(wispL, wispR);
  }

  return grp;
}

// 2-4) 비정형 유기적 천 주름을 가진 일체형 전면 개방(Open-Front) 소프트 로우 폴리곤 두건 생성기
//      - 둥글고 유기적인 왕관 돔 + 목선 허리 굴곡 + 자연스러운 어깨 천 주름 (직각 박스·원기둥 완전 탈피!)
//      - 내부 두상·머리카락·수염 대비 최소 +0.035~0.08 여유 공간 보장 (돌출 0%)
const _HOOD_PHI_TABLE = [
   0.00,  0.44,  0.88,  1.44,  2.02,  2.58,
   Math.PI,
  -2.58, -2.02, -1.44, -0.88, -0.44
];
const _organicHoodDataCache = {};

function getOrganicHoodProfileData(isFemale = false, styleSeed = 0) {
  const seedIdx = Math.abs(Math.round(styleSeed)) % 3;
  const key = `${isFemale ? 'F' : 'M'}_${seedIdx}`;
  if (_organicHoodDataCache[key]) return _organicHoodDataCache[key];

  const s = seedIdx * 1.73 + (isFemale ? 0.85 : 0.35);
  const cols = _HOOD_PHI_TABLE.length; // 12

  // 비정형 천 실루엣용 자연스러운 비대칭 중심 오프셋
  const crownOffX = Math.sin(s * 1.4) * 0.022;
  const crownOffZ = -0.048 + Math.cos(s * 1.1) * 0.012;

  // 행별 기본 반경·높이·두께: 둥근 유기적 돔 -> 부드러운 광대 감쌈 -> 목선 살짝 잘록 드레이프 -> 어깨로 풍성히 흘러내림
  const apexOut = [crownOffX, isFemale ? 0.422 : 0.432, crownOffZ];
  const apexIn  = [crownOffX * 0.5, isFemale ? 0.318 : 0.326, crownOffZ * 0.6];

  const rowSpecs = [
    null, // r=0 apex
    { y: isFemale ? 0.348 : 0.356, rx: isFemale ? 0.254 : 0.262, rz: isFemale ? 0.244 : 0.252, cz: -0.032, thick: 0.046 },
    { y: isFemale ? 0.224 : 0.232, rx: isFemale ? 0.334 : 0.342, rz: isFemale ? 0.316 : 0.324, cz: -0.022, thick: 0.042 },
    { y: 0.068,                    rx: isFemale ? 0.352 : 0.358, rz: isFemale ? 0.334 : 0.340, cz: -0.020, thick: 0.042 },
    { y: -0.104,                   rx: isFemale ? 0.328 : 0.338, rz: isFemale ? 0.318 : 0.326, cz: -0.020, thick: 0.040 },
    { y: isFemale ? -0.250 : -0.256, rx: isFemale ? 0.328 : 0.354, rz: isFemale ? 0.318 : 0.336, cz: -0.022, thick: 0.038 },
    { y: isFemale ? -0.388 : -0.384, rx: isFemale ? 0.362 : 0.388, rz: isFemale ? 0.342 : 0.356, cz: -0.024, thick: 0.038 }
  ];

  const P_out = [null];
  const P_in  = [null];

  for (let r = 1; r <= 6; r++) {
    const sp = rowSpecs[r];
    const oRow = [];
    const iRow = [];
    const drapeT = Math.max(0, (r - 2) / 4);

    for (let c = 0; c < cols; c++) {
      const phi = _HOOD_PHI_TABLE[c];
      const sinP = Math.sin(phi);
      const cosP = Math.cos(phi);
      const isFrontFaceCol = (c === 0 || c === 1 || c === 11);
      const isEdgeCol      = (c === 2 || c === 10);

      // 비정형 천 주름 & 입체 드레이프 굴곡 (내부 두상 침범 방지를 위해 양수 여유 편향 적용)
      const crownOrg = (r <= 2)
        ? (0.018 * Math.sin(phi * 2.0 + s) + 0.012 * Math.cos(phi * 3.0 - s * 1.2) + 0.010)
        : 0;
      const drapeFold = drapeT * (
        0.028 * Math.sin(phi * 3.0 + s * 1.5 + r * 0.48) +
        0.016 * Math.cos(phi * 5.0 - s * 1.1) +
        0.016
      );
      const orgRadial = Math.max(-0.003, crownOrg + drapeFold);

      let ox = sinP * (sp.rx + orgRadial) + (r === 1 ? crownOffX * 0.55 : 0);
      let oz = cosP * (sp.rz + orgRadial) + sp.cz + (r === 1 ? crownOffZ * 0.35 : 0);
      let oy = sp.y;

      if (r === 1) {
        oy += -0.020 * cosP + 0.014 * Math.sin(phi * 2.0 + s);
      } else if (r === 2) {
        if (c === 0) {
          oy = isFemale ? 0.232 : 0.240;
          oz = isFemale ? 0.274 : 0.282;
          ox += Math.sin(s) * 0.007;
        } else if (c === 1 || c === 11) {
          oy = (isFemale ? 0.216 : 0.224) + (c === 1 ? 0.006 : -0.005) * Math.sin(s);
          oz = isFemale ? 0.254 : 0.262;
        } else if (isEdgeCol) {
          oy = isFemale ? 0.172 : 0.178;
          oz = isFemale ? 0.210 : 0.218;
          ox = Math.sign(sinP) * (isFemale ? 0.286 : 0.296);
        } else {
          oy += 0.016 * Math.sin(phi * 2.0 - s * 0.8);
        }
      } else if (r >= 3 && r <= 4) {
        if (isEdgeCol) {
          const edgeR = isFemale
            ? (r === 3 ? 0.284 : 0.264)
            : (r === 3 ? 0.294 : 0.286);
          ox = Math.sign(sinP) * (edgeR + (c === 2 ? 0.006 : -0.004) * Math.cos(s));
          oz = (r === 3 ? 0.200 : 0.180) + (isFemale ? 0.006 : 0.0);
        }
        oy += 0.012 * Math.cos(phi * 2.0 + s);
      } else if (r === 5) {
        if (isFemale && isFrontFaceCol) {
          // 여성 턱 아래를 빈틈없이 포근하게 감싸는 일체형 턱 스카프(Wimple)
          if (c === 0) {
            ox = Math.sin(s) * 0.006;
            oy = -0.244;
            oz = 0.206;
          } else {
            ox = Math.sign(sinP) * 0.140;
            oy = -0.236 + (c === 1 ? 0.004 : -0.004);
            oz = 0.200;
          }
        } else if (isEdgeCol) {
          ox = Math.sign(sinP) * (isFemale ? 0.270 : 0.312);
          oz = isFemale ? 0.178 : 0.170;
        }
      } else if (r === 6) {
        // 어깨 위 자연스럽게 출렁이는 비정형 천 밑단
        oy += 0.024 * Math.sin(phi * 2.0 + s * 1.3) + 0.012 * Math.cos(phi * 3.0 - s);
        if (isFemale && isFrontFaceCol) {
          if (c === 0) {
            ox = Math.sin(s) * 0.010;
            oy = -0.422;
            oz = 0.228;
          } else {
            ox = Math.sign(sinP) * 0.172;
            oy = -0.392 + (c === 1 ? -0.007 : 0.005);
            oz = 0.218;
          }
        } else if (isEdgeCol) {
          ox = Math.sign(sinP) * (isFemale ? 0.298 : 0.336);
          oz = isFemale ? 0.180 : 0.168;
        }
      }

      // 내측 안감 좌표 계산 (모든 방향에서 내부 두상·머리카락·수염보다 엄격히 외측 유지!)
      const th = isEdgeCol ? sp.thick * 0.78 : sp.thick;
      const distXZ = Math.hypot(ox, oz - sp.cz) || 1;
      const dirX = ox / distXZ;
      const dirZ = (oz - sp.cz) / distXZ;

      let ix = ox - dirX * th;
      let iz = oz - dirZ * th;
      let iy = oy;

      if (r === 1) {
        iy = Math.max(0.285, oy - 0.052);
      } else if (r === 2 && isFrontFaceCol) {
        iy = oy - 0.010;
        iz = oz - 0.036;
      } else if (isFemale && r === 5 && isFrontFaceCol) {
        iy = oy - 0.008;
        iz = oz - 0.036;
      } else if (isFemale && r === 6 && isFrontFaceCol) {
        iz = oz - 0.036;
      }

      if (!isFrontFaceCol) {
        const minSideX = isFemale ? 0.242 : 0.250;
        if (Math.abs(sinP) > 0.65 && Math.abs(ix) < minSideX) {
          ix = Math.sign(ix || sinP) * minSideX;
        }
        if (cosP < -0.55 && iz > -0.218) {
          iz = -0.218;
        }
      }

      oRow.push([ox, oy, oz]);
      iRow.push([ix, iy, iz]);
    }
    P_out.push(oRow);
    P_in.push(iRow);
  }

  // 일체형 두건 폐곡면 지오메트리 조립
  const v = [];
  for (let c = 0; c < cols; c++) {
    const cn = (c + 1) % cols;
    pushTriangle(v, apexOut, P_out[1][c], P_out[1][cn]);
    pushTriangle(v, apexIn,  P_in[1][cn], P_in[1][c]);
  }
  for (let c = 0; c < cols; c++) {
    const cn = (c + 1) % cols;
    pushQuad(v, P_out[1][c], P_out[2][c], P_out[2][cn], P_out[1][cn]);
    pushQuad(v, P_in[1][c],  P_in[1][cn], P_in[2][cn],  P_in[2][c]);
  }
  for (let r = 2; r <= 4; r++) {
    for (let c = 2; c <= 9; c++) {
      const cn = c + 1;
      pushQuad(v, P_out[r][c], P_out[r + 1][c], P_out[r + 1][cn], P_out[r][cn]);
      pushQuad(v, P_in[r][c],  P_in[r][cn],     P_in[r + 1][cn],  P_in[r + 1][c]);
    }
  }
  if (isFemale) {
    for (let c = 0; c < cols; c++) {
      const cn = (c + 1) % cols;
      pushQuad(v, P_out[5][c], P_out[6][c], P_out[6][cn], P_out[5][cn]);
      pushQuad(v, P_in[5][c],  P_in[5][cn], P_in[6][cn],  P_in[6][c]);
    }
  } else {
    for (let c = 2; c <= 9; c++) {
      const cn = c + 1;
      pushQuad(v, P_out[5][c], P_out[6][c], P_out[6][cn], P_out[5][cn]);
      pushQuad(v, P_in[5][c],  P_in[5][cn], P_in[6][cn],  P_in[6][c]);
    }
  }

  const browCols = [10, 11, 0, 1];
  for (let i = 0; i < browCols.length; i++) {
    const c = browCols[i];
    const cn = (c + 1) % cols;
    pushQuad(v, P_out[2][c], P_in[2][c], P_in[2][cn], P_out[2][cn]);
  }
  const sideEndRow = isFemale ? 5 : 6;
  for (let r = 2; r < sideEndRow; r++) {
    pushQuad(v, P_out[r][2], P_in[r][2], P_in[r + 1][2], P_out[r + 1][2]);
    pushQuad(v, P_out[r][10], P_out[r + 1][10], P_in[r + 1][10], P_in[r][10]);
  }
  if (isFemale) {
    for (let i = 0; i < browCols.length; i++) {
      const c = browCols[i];
      const cn = (c + 1) % cols;
      pushQuad(v, P_out[5][c], P_out[5][cn], P_in[5][cn], P_in[5][c]);
    }
  }
  if (isFemale) {
    for (let c = 0; c < cols; c++) {
      const cn = (c + 1) % cols;
      pushQuad(v, P_out[6][c], P_in[6][c], P_in[6][cn], P_out[6][cn]);
    }
  } else {
    for (let c = 2; c <= 9; c++) {
      const cn = c + 1;
      pushQuad(v, P_out[6][c], P_in[6][c], P_in[6][cn], P_out[6][cn]);
    }
  }

  const shellGeo = markCachedGeo(buildBufferGeoFromTriangles(v));
  const data = { shellGeo, P_out, P_in, s };
  _organicHoodDataCache[key] = data;
  return data;
}

// 비정형 두건 외피에 100% 밀착하는 오가닉 로프/밴드 생성기 (뜸 현상 및 천 뚫림 방지)
const _conformalBandGeoCache = {};
function getConformalHoodBandGeo(isFemale, styleSeed, tBand, halfH, radialOut) {
  const seedIdx = Math.abs(Math.round(styleSeed)) % 3;
  const key = `${isFemale ? 'F' : 'M'}_${seedIdx}_${tBand}_${halfH}_${radialOut}`;
  if (_conformalBandGeoCache[key]) return _conformalBandGeoCache[key];

  const data = getOrganicHoodProfileData(isFemale, seedIdx);
  const P1 = data.P_out[1];
  const P2 = data.P_out[2];
  const cols = _HOOD_PHI_TABLE.length;
  const s = data.s;

  const outTop = [], outBot = [], inTop = [], inBot = [];
  for (let c = 0; c < cols; c++) {
    const tTop = Math.max(0.05, tBand - halfH * 1.6);
    const tBot = Math.min(0.95, tBand + halfH * 1.6);

    const samplePt = (t) => [
      P1[c][0] + (P2[c][0] - P1[c][0]) * t,
      P1[c][1] + (P2[c][1] - P1[c][1]) * t,
      P1[c][2] + (P2[c][2] - P1[c][2]) * t
    ];

    const ptT = samplePt(tTop);
    const ptB = samplePt(tBot);
    const ripple = Math.sin(c * 1.8 + s) * 0.005;

    const pushOut = (pt, dr, dy) => {
      const dXZ = Math.hypot(pt[0], pt[2] + 0.025) || 1;
      const nx = pt[0] / dXZ;
      const nz = (pt[2] + 0.025) / dXZ;
      return [pt[0] + nx * dr, pt[1] + dy, pt[2] + nz * dr];
    };

    outTop.push(pushOut(ptT, radialOut,  0.005 + ripple));
    outBot.push(pushOut(ptB, radialOut, -0.005 + ripple));
    inTop.push(pushOut(ptT, -0.018,  0.002 + ripple));
    inBot.push(pushOut(ptB, -0.018, -0.002 + ripple));
  }

  const v = [];
  for (let c = 0; c < cols; c++) {
    const cn = (c + 1) % cols;
    pushQuad(v, outTop[c], outBot[c], outBot[cn], outTop[cn]);
    pushQuad(v, inTop[c], outTop[c], outTop[cn], inTop[cn]);
    pushQuad(v, outBot[c], inBot[c], inBot[cn], outBot[cn]);
  }

  const geo = markCachedGeo(buildBufferGeoFromTriangles(v));
  _conformalBandGeoCache[key] = geo;
  return geo;
}

function createOpenFrontHoodGroup(hoodColor, isFemale = false, agal1 = null, agal2 = null, veilBand = null, styleSeed = 0) {
  const hoodGrp = new THREE.Group();
  hoodGrp.name = 'hood';

  const data = getOrganicHoodProfileData(isFemale, styleSeed);
  const hoodShell = createLowPolyMesh(data.shellGeo, hoodColor, 0, 0, 0);
  hoodShell.name = 'hoodShell';
  hoodGrp.add(hoodShell);

  if (isFemale) {
    if (veilBand) {
      const vBand = createLowPolyMesh(
        getConformalHoodBandGeo(true, styleSeed, 0.68, 0.062, 0.018),
        veilBand, 0, 0, 0
      );
      vBand.name = 'hoodBand';
      hoodGrp.add(vBand);
    }
  } else {
    if (agal1) {
      const agalUpper = createLowPolyMesh(
        getConformalHoodBandGeo(false, styleSeed, 0.52, 0.068, 0.022),
        agal1, 0, 0, 0
      );
      agalUpper.name = 'hoodBand';
      hoodGrp.add(agalUpper);
    }
    if (agal2) {
      const agalLower = createLowPolyMesh(
        getConformalHoodBandGeo(false, styleSeed, 0.78, 0.064, 0.021),
        agal2, 0, 0, 0
      );
      agalLower.name = 'hoodBand';
      hoodGrp.add(agalLower);
    }
  }

  return hoodGrp;
}

// -------------------------------------------------------------------------
// 3. [예수님 캐릭터 전용 소프트 로우 폴리곤 5:5 웨이브 장발 & 대각선 붉은 숄]
// -------------------------------------------------------------------------
let _jesusHairShellGeo = null;
function getJesusHairShellGeo() {
  if (_jesusHairShellGeo) return _jesusHairShellGeo;

  const cols = 12;
  const phis = _HOOD_PHI_TABLE;
  const P_out = [null];
  const P_in  = [null];

  const apexOut = [0, 0.382, -0.022];
  const apexIn  = [0, 0.265, -0.015];

  const rowSpecs = [
    null,
    { y: 0.318, rx: 0.256, rz: 0.252, cz: -0.018 },
    { y: 0.206, rx: 0.312, rz: 0.300, cz: -0.016 },
    { y: 0.055, rx: 0.334, rz: 0.318, cz: -0.018 },
    { y: -0.115, rx: 0.348, rz: 0.326, cz: -0.020 },
    { y: -0.275, rx: 0.336, rz: 0.314, cz: -0.022 },
    { y: -0.396, rx: 0.296, rz: 0.278, cz: -0.024 }
  ];

  for (let r = 1; r <= 6; r++) {
    const sp = rowSpecs[r];
    const oRow = [];
    const iRow = [];
    for (let c = 0; c < cols; c++) {
      const phi = phis[c];
      const sinP = Math.sin(phi);
      const cosP = Math.cos(phi);
      const isEdge = (c === 2 || c === 10);

      const waveX = (r >= 3) ? Math.sin(r * 1.45 + Math.abs(phi) * 1.8) * 0.018 : 0;
      const partDip = (r <= 2 && c === 0) ? -0.022 : 0;
      const crownSwell = (r === 1 && (c === 1 || c === 11 || c === 2 || c === 10)) ? 0.018 : 0;

      let ox = sinP * (sp.rx + waveX + crownSwell);
      let oz = cosP * (sp.rz + waveX * 0.7) + sp.cz;
      let oy = sp.y + partDip + crownSwell * 0.5;

      if (r === 2) {
        if (c === 0) { oy = 0.218; oz = 0.238; }
        else if (c === 1 || c === 11) { oy = 0.204; oz = 0.244; }
        else if (isEdge) { oy = 0.162; ox = Math.sign(sinP) * 0.278; oz = 0.205; }
      } else if (r >= 3 && isEdge) {
        const edgeW = (r === 4) ? 0.312 : (r === 5 ? 0.302 : (r === 6 ? 0.264 : 0.292));
        ox = Math.sign(sinP) * edgeW;
        oz = (r === 3 ? 0.172 : (r === 4 ? 0.155 : (r === 5 ? 0.135 : 0.105)));
      }
      if (r === 6) {
        oy += Math.sin(phi * 4.0) * 0.020;
      }

      const th = (r === 6) ? 0.024 : 0.042;
      const dXZ = Math.hypot(ox, oz - sp.cz) || 1;
      const ix = ox - (ox / dXZ) * th;
      const iz = oz - ((oz - sp.cz) / dXZ) * th;
      const iy = (r === 1) ? oy - 0.045 : oy;

      oRow.push([ox, oy, oz]);
      iRow.push([ix, iy, iz]);
    }
    P_out.push(oRow);
    P_in.push(iRow);
  }

  const v = [];
  for (let c = 0; c < cols; c++) {
    const cn = (c + 1) % cols;
    pushTriangle(v, apexOut, P_out[1][c], P_out[1][cn]);
    pushTriangle(v, apexIn,  P_in[1][cn], P_in[1][c]);
  }
  for (let c = 0; c < cols; c++) {
    const cn = (c + 1) % cols;
    pushQuad(v, P_out[1][c], P_out[2][c], P_out[2][cn], P_out[1][cn]);
    pushQuad(v, P_in[1][c],  P_in[1][cn], P_in[2][cn],  P_in[2][c]);
  }
  for (let r = 2; r <= 5; r++) {
    for (let c = 2; c <= 9; c++) {
      const cn = c + 1;
      pushQuad(v, P_out[r][c], P_out[r + 1][c], P_out[r + 1][cn], P_out[r][cn]);
      pushQuad(v, P_in[r][c],  P_in[r][cn],     P_in[r + 1][cn],  P_in[r + 1][c]);
    }
  }
  const browCols = [10, 11, 0, 1];
  for (let i = 0; i < browCols.length; i++) {
    const c = browCols[i], cn = (c + 1) % cols;
    pushQuad(v, P_out[2][c], P_in[2][c], P_in[2][cn], P_out[2][cn]);
  }
  for (let r = 2; r < 6; r++) {
    pushQuad(v, P_out[r][2],  P_in[r][2],      P_in[r + 1][2],  P_out[r + 1][2]);
    pushQuad(v, P_out[r][10], P_out[r + 1][10], P_in[r + 1][10], P_in[r][10]);
  }
  for (let c = 2; c <= 9; c++) {
    const cn = c + 1;
    pushQuad(v, P_out[6][c], P_in[6][c], P_in[6][cn], P_out[6][cn]);
  }

  _jesusHairShellGeo = markCachedGeo(buildBufferGeoFromTriangles(v));
  return _jesusHairShellGeo;
}

function createJesusFacetedHairGroup(hairHex = '#4e2f1e') {
  const hairGrp = new THREE.Group();
  hairGrp.name = 'jesusHair';

  const shellMesh = createLowPolyMesh(getJesusHairShellGeo(), hairHex, 0, 0, 0);
  hairGrp.add(shellMesh);

  // 부드러운 5:5 커튼 앞머리 (좌·우 관자놀이 방향으로 우아하게 아치형(/ \) 흘러내림)
  const bangGeo = new THREE.CylinderGeometry(0.024, 0.034, 0.195, 5);
  bangGeo.scale(1.0, 1.0, 0.60);
  const bangNonIdx = bangGeo.toNonIndexed();
  bangNonIdx.computeVertexNormals();

  const bangL = createLowPolyMesh(bangNonIdx, hairHex, -0.118, 0.196, 0.214, false);
  bangL.rotation.set(0.14, -0.32, -1.16);
  const bangR = createLowPolyMesh(bangNonIdx, hairHex,  0.118, 0.196, 0.214, false);
  bangR.rotation.set(0.14,  0.32,  1.16);

  hairGrp.add(bangL, bangR);
  return hairGrp;
}

function createJesusDiagonalRedSashGroup(sashHex = '#c83228', foldHex = '#ad261d') {
  const sashGrp = new THREE.Group();

  const shoulderPad = createLowPolyMesh(new THREE.BoxGeometry(0.22, 0.10, 0.30), sashHex, 0.19, 1.50, 0.0);
  shoulderPad.rotation.z = -0.18;
  sashGrp.add(shoulderPad);

  const strips = 4;
  for (let i = 0; i < strips; i++) {
    const offset = (i - 1.5) * 0.052;
    const col = (i % 2 === 0) ? sashHex : foldHex;
    const zProtrude = (i % 2 === 0) ? 0.012 : 0.0;

    const fStart = new THREE.Vector3(0.19 + offset * 0.7, 1.48 - offset * 0.3, 0.165 + zProtrude);
    const fMid   = new THREE.Vector3(0.01 + offset * 0.8, 0.98,                0.215 + zProtrude);
    const fEnd   = new THREE.Vector3(-0.26 + offset * 0.7, 0.36 + offset * 0.4, 0.295 + zProtrude);

    const fUpper = createBranchSegmentMesh(fMid, fStart, 0.042, 0.040, col);
    fUpper.scale.z = 0.45;
    const fLower = createBranchSegmentMesh(fEnd, fMid,   0.046, 0.042, col);
    fLower.scale.z = 0.45;

    const bStart = new THREE.Vector3(0.19 + offset * 0.7, 1.48 - offset * 0.3, -0.165 - zProtrude);
    const bMid   = new THREE.Vector3(0.01 + offset * 0.8, 0.98,                -0.210 - zProtrude);
    const bEnd   = new THREE.Vector3(-0.26 + offset * 0.7, 0.36 + offset * 0.4, -0.285 - zProtrude);

    const bUpper = createBranchSegmentMesh(bMid, bStart, 0.042, 0.040, col);
    bUpper.scale.z = 0.45;
    const bLower = createBranchSegmentMesh(bEnd, bMid,   0.046, 0.042, col);
    bLower.scale.z = 0.45;

    sashGrp.add(fUpper, fLower, bUpper, bLower);
  }

  const rightSideWrap = createLowPolyMesh(new THREE.CylinderGeometry(0.32, 0.38, 0.28, 8, 1, true, Math.PI * 1.15, Math.PI * 0.70), sashHex, -0.02, 0.46, 0);
  rightSideWrap.scale.set(1.02, 1.0, 0.78);
  sashGrp.add(rightSideWrap);

  return sashGrp;
}

function createJesusBellSleeveArm(isLeft, robeHex = '#e8e6e2', cuffHex = '#d8d5d0', skinHex = '#f2cfb4') {
  const side = isLeft ? -1 : 1;
  const armGrp = new THREE.Group();
  armGrp.position.set(side * 0.26, 1.45, 0.0);

  const pivot = new THREE.Group();
  pivot.rotation.z = side * 0.24;

  const shCap = createLowPolyMesh(new THREE.DodecahedronGeometry(0.135, 0), robeHex, 0, 0.01, 0);
  pivot.add(shCap);

  const sleeveLen = 0.48;
  const sGeo = new THREE.CylinderGeometry(0.125, 0.21, sleeveLen, 6, 1, false);
  sGeo.translate(0, -sleeveLen * 0.5, 0);
  sGeo.rotateY(Math.PI / 6);
  const sMesh = createLowPolyMesh(sGeo.toNonIndexed(), robeHex, 0, 0, 0);
  pivot.add(sMesh);

  const innerCuff = createLowPolyMesh(new THREE.CylinderGeometry(0.095, 0.105, 0.08, 6), cuffHex, 0, -0.50, 0);
  const palm = createLowPolyMesh(new THREE.BoxGeometry(0.10, 0.12, 0.12), skinHex, 0, -0.58, 0.01);
  const fingers = createLowPolyMesh(new THREE.BoxGeometry(0.09, 0.08, 0.10), skinHex, -side * 0.015, -0.65, 0.01);
  fingers.rotation.z = -side * 0.24;
  const thumb = createLowPolyMesh(new THREE.BoxGeometry(0.045, 0.075, 0.055), skinHex, -side * 0.05, -0.59, 0.065, false);
  thumb.rotation.x = 0.3;

  pivot.add(innerCuff, palm, fingers, thumb);
  armGrp.add(pivot);
  return armGrp;
}

// =========================================================================
// [ep4_miracle_assets.js - 파트 2/3]
// 4. 일반 캐릭터용 숄, 술 패널, 소매, 허리띠 빌더
// 5. 남성 3종 · 여성 3종 변형 팔레트 (머리카락 노출) 및 LOD 적용 캐릭터 팩토리
// =========================================================================

// -------------------------------------------------------------------------
// 4. 일반 캐릭터용 숄, 술 패널, 소매, 허리띠 빌더
// -------------------------------------------------------------------------
function createCleanIsraeliteMantleGroup(shawlHex, stripe1Hex, stripe2Hex, isFemale) {
  const mantleGrp = new THREE.Group();

  const shoulderYoke = createLowPolyMesh(new THREE.CylinderGeometry(0.19, 0.34, 0.16, 8), shawlHex, 0, 1.49, -0.01);
  shoulderYoke.scale.set(1.10, 1.0, 0.72);
  mantleGrp.add(shoulderYoke);

  const chestBandGeo = new THREE.BoxGeometry(0.145, 0.50, 0.055);
  const frontBandL = createLowPolyMesh(chestBandGeo, shawlHex, -0.155, 1.25, 0.165);
  frontBandL.rotation.z = -0.05;
  frontBandL.rotation.x = -0.04;
  const frontBandR = createLowPolyMesh(chestBandGeo, shawlHex,  0.155, 1.25, 0.165);
  frontBandR.rotation.z =  0.05;
  frontBandR.rotation.x = -0.04;
  mantleGrp.add(frontBandL, frontBandR);

  const backGeo = new THREE.BoxGeometry(0.74, 0.50, 0.05, 2, 2, 1);
  const bPos = backGeo.attributes.position;
  for (let i = 0; i < bPos.count; i++) {
    let bx = bPos.getX(i), by = bPos.getY(i), bz = bPos.getZ(i);
    if (by < -0.1) {
      if (bx > 0.1) { by -= 0.14; bx += 0.08; }
      else if (bx < -0.1) { by += 0.10; bx -= 0.04; }
      else { by -= 0.02; }
    }
    if (Math.abs(bx) < 0.08 && Math.abs(by) < 0.1 && bz < 0) {
      bz -= 0.035;
    }
    bPos.setXYZ(i, bx, by, bz);
  }
  const finalBackGeo = backGeo.toNonIndexed();
  finalBackGeo.computeVertexNormals();
  const backCapeMesh = createLowPolyMesh(finalBackGeo, shawlHex, 0.02, 1.28, -0.165);
  mantleGrp.add(backCapeMesh);

  const leftPanel = createContouredFrontShawlPanel(0.175, 0.41, shawlHex, stripe1Hex, stripe2Hex);
  leftPanel.position.set(-0.145, 0.97, 0.195);
  leftPanel.rotation.x = -0.18;
  leftPanel.rotation.z = -0.04;

  const rightPanel = createContouredFrontShawlPanel(0.185, 0.49, shawlHex, stripe1Hex, stripe2Hex);
  rightPanel.position.set(0.135, 0.97, 0.205);
  rightPanel.rotation.x = -0.18;
  rightPanel.rotation.z =  0.06;

  mantleGrp.add(leftPanel, rightPanel);
  return mantleGrp;
}

function createContouredFrontShawlPanel(width, length, shawlHex, stripe1Hex, stripe2Hex) {
  const panelGrp = new THREE.Group();
  const mainBody = createLowPolyMesh(new THREE.BoxGeometry(width, length, 0.032), shawlHex, 0, -length * 0.5, 0);
  panelGrp.add(mainBody);

  if (stripe1Hex && stripe2Hex) {
    const sY = -length + 0.038;
    panelGrp.add(
      createLowPolyMesh(new THREE.BoxGeometry(width + 0.004, 0.018, 0.038), stripe2Hex, 0, sY + 0.132, 0.002, false),
      createLowPolyMesh(new THREE.BoxGeometry(width + 0.004, 0.045, 0.038), stripe1Hex, 0, sY + 0.086, 0.002, false),
      createLowPolyMesh(new THREE.BoxGeometry(width + 0.004, 0.042, 0.038), stripe2Hex, 0, sY + 0.036, 0.002, false),
      createLowPolyMesh(new THREE.BoxGeometry(width + 0.004, 0.016, 0.038), stripe2Hex, 0, sY + 0.002, 0.002, false)
    );
  }

  const fringeCount = 7;
  const fringeH = 0.088;
  const gapBacking = createLowPolyMesh(
    new THREE.BoxGeometry(width * 0.96, fringeH, 0.020),
    '#2b1d12',
    0,
    -length - fringeH * 0.5,
    0,
    false
  );
  panelGrp.add(gapBacking);

  const fWidth = (width / fringeCount) * 0.66;
  for (let i = 0; i < fringeCount; i++) {
    const fx = -width * 0.5 + (i + 0.5) * (width / fringeCount);
    const tassel = createLowPolyMesh(
      new THREE.BoxGeometry(fWidth, fringeH, 0.036),
      shawlHex,
      fx,
      -length - fringeH * 0.5,
      0.002,
      false
    );
    panelGrp.add(tassel);
  }
  return panelGrp;
}

function createSeamlessPonchoArm(isLeft, shawlHex, stripe1Hex, stripe2Hex, innerSleeveHex, skinHex) {
  const side = isLeft ? -1 : 1;
  const armGrp = new THREE.Group();
  armGrp.position.set(side * 0.27, 1.46, 0.0);

  const sleevePivot = new THREE.Group();
  sleevePivot.rotation.z = side * 0.28;

  const shoulderCap = createLowPolyMesh(new THREE.DodecahedronGeometry(0.145, 0), shawlHex, 0, 0.01, 0);
  shoulderCap.scale.set(1.0, 0.85, 0.95);
  sleevePivot.add(shoulderCap);

  const shawlLen = 0.42;
  const shawlGeo = new THREE.CylinderGeometry(0.135, 0.215, shawlLen, 6, 1, false);
  shawlGeo.translate(0, -shawlLen * 0.5, 0);
  shawlGeo.rotateY(Math.PI / 6);
  const shawlMesh = createLowPolyMesh(shawlGeo.toNonIndexed(), shawlHex, 0, 0.01, 0);
  sleevePivot.add(shawlMesh);

  if (stripe1Hex && stripe2Hex) {
    const addBand = (yTop, yBot, colHex) => {
      const h = yTop - yBot;
      const tTop = Math.abs(yTop) / shawlLen;
      const tBot = Math.abs(yBot) / shawlLen;
      const rTop = THREE.MathUtils.lerp(0.135, 0.215, tTop) + 0.004;
      const rBot = THREE.MathUtils.lerp(0.135, 0.215, tBot) + 0.004;
      const bGeo = new THREE.CylinderGeometry(rTop, rBot, h, 6, 1, false);
      bGeo.rotateY(Math.PI / 6);
      const bMesh = createLowPolyMesh(bGeo.toNonIndexed(), colHex, 0, (yTop + yBot) * 0.5 + 0.01, 0, false);
      sleevePivot.add(bMesh);
    };
    addBand(-0.24, -0.260, stripe2Hex);
    addBand(-0.272, -0.320, stripe1Hex);
    addBand(-0.330, -0.376, stripe2Hex);
    addBand(-0.386, -0.404, stripe2Hex);
  }

  const lowerArmGrp = new THREE.Group();
  lowerArmGrp.position.set(0, -0.38, 0);
  lowerArmGrp.rotation.z = -side * 0.15;

  const innerGeo = new THREE.CylinderGeometry(0.092, 0.112, 0.18, 6, 1, false);
  const innerSleeve = createLowPolyMesh(innerGeo.toNonIndexed(), innerSleeveHex, 0, -0.08, 0);
  lowerArmGrp.add(innerSleeve);

  const palm = createLowPolyMesh(new THREE.BoxGeometry(0.10, 0.12, 0.12), skinHex, 0, -0.22, 0.01);
  const fingers = createLowPolyMesh(new THREE.BoxGeometry(0.09, 0.08, 0.10), skinHex, -side * 0.015, -0.29, 0.01);
  fingers.rotation.z = -side * 0.24;
  const thumb = createLowPolyMesh(new THREE.BoxGeometry(0.045, 0.075, 0.055), skinHex, -side * 0.05, -0.23, 0.065, false);
  thumb.rotation.x = 0.3;

  lowerArmGrp.add(palm, fingers, thumb);
  sleevePivot.add(lowerArmGrp);
  armGrp.add(sleevePivot);
  return armGrp;
}

function createEllipticalDoubleRopeBelt(beltHex, knotHex, withFrontTassels = true) {
  const beltGrp = new THREE.Group();

  const upperRope = createLowPolyMesh(new THREE.CylinderGeometry(0.255, 0.26, 0.060, 10), beltHex, 0, 1.03, 0);
  upperRope.scale.set(1.0, 1.0, 0.72);
  const lowerRope = createLowPolyMesh(new THREE.CylinderGeometry(0.26, 0.265, 0.060, 10), knotHex, 0, 0.97, 0);
  lowerRope.scale.set(1.0, 1.0, 0.72);
  beltGrp.add(upperRope, lowerRope);

  if (withFrontTassels) {
    const frontKnot = createLowPolyMesh(new THREE.DodecahedronGeometry(0.070, 0), knotHex, 0.06, 1.00, 0.195, false);
    const fStrap1 = createLowPolyMesh(new THREE.BoxGeometry(0.052, 0.35, 0.040), beltHex, 0.03, 0.80, 0.225, false);
    fStrap1.rotation.x = -0.15;
    fStrap1.rotation.z = 0.08;
    const fTip1   = createLowPolyMesh(new THREE.ConeGeometry(0.046, 0.08, 4), knotHex, 0.045, 0.61, 0.25, false);
    fTip1.rotation.y = Math.PI / 4;

    const fStrap2 = createLowPolyMesh(new THREE.BoxGeometry(0.052, 0.29, 0.040), knotHex, 0.10, 0.83, 0.215, false);
    fStrap2.rotation.x = -0.15;
    fStrap2.rotation.z = -0.07;
    const fTip2   = createLowPolyMesh(new THREE.ConeGeometry(0.046, 0.08, 4), beltHex, 0.09, 0.67, 0.235, false);
    fTip2.rotation.y = Math.PI / 4;

    const backKnot = createLowPolyMesh(new THREE.DodecahedronGeometry(0.062, 0), knotHex, 0, 0.98, -0.185, false);
    const bCord1 = createLowPolyMesh(new THREE.BoxGeometry(0.046, 0.15, 0.040), beltHex, -0.036, 0.88, -0.205, false);
    bCord1.rotation.x = 0.15;
    bCord1.rotation.z = 0.12;
    const bTassel1 = createLowPolyMesh(new THREE.ConeGeometry(0.046, 0.095, 4), knotHex, -0.048, 0.77, -0.225, false);
    bTassel1.rotation.y = Math.PI / 4;

    const bCord2 = createLowPolyMesh(new THREE.BoxGeometry(0.046, 0.19, 0.040), knotHex,  0.036, 0.86, -0.205, false);
    bCord2.rotation.x = 0.15;
    bCord2.rotation.z = -0.08;
    const bTassel2 = createLowPolyMesh(new THREE.ConeGeometry(0.046, 0.095, 4), beltHex,  0.044, 0.73, -0.225, false);
    bTassel2.rotation.y = Math.PI / 4;

    beltGrp.add(frontKnot, fStrap1, fTip1, fStrap2, fTip2, backKnot, bCord1, bTassel1, bCord2, bTassel2);
  }
  return beltGrp;
}

// -------------------------------------------------------------------------
// 5. 남성 3종 · 여성 3종 변형 팔레트 및 메인 캐릭터 생성 함수
// -------------------------------------------------------------------------
const ISRAELITE_MALE_VARIANTS = [
  {
    robe: '#8d6649', sleeve: '#8d6649', shawl: '#ece6d8',
    stripe1: '#4a80a8', stripe2: '#1b263b',
    headcloth: '#ece6d8', agal1: '#d1c3aa', agal2: '#b8a689',
    belt: '#a68e71', beltSub: '#8c7355',
    hair: '#221a15', skin: '#eccab0', sandal: '#3b2416',
    beardStyle: 'full', headwear: 'sudra_double'
  },
  {
    robe: '#5c6446', sleeve: '#5c6446', shawl: '#f0e8d5',
    stripe1: '#b45309', stripe2: '#7f1d1d',
    headcloth: null, agal1: null, agal2: null,
    belt: '#926c44', beltSub: '#785230',
    hair: '#2b1d12', skin: '#e8c3a5', sandal: '#3b2212',
    beardStyle: 'short', headwear: 'none' // 머리카락 노출
  },
  {
    robe: '#3f5166', sleeve: '#3f5166', shawl: '#f4efe6',
    stripe1: '#d97706', stripe2: '#4c1d95',
    headcloth: null, agal1: null, agal2: null,
    belt: '#b48a58', beltSub: '#8c663b',
    hair: '#1e1b18', skin: '#f0cfb4', sandal: '#29180e',
    beardStyle: 'trimmed', headwear: 'none' // 머리카락 노출
  }
];

const ISRAELITE_FEMALE_VARIANTS = [
  {
    skirt: '#4e2f1e', bodice: '#f2f2f0', sleeve: '#4e2f1e',
    veil: '#f4f4f2', shawl: '#f4f4f2',
    stripe1: null, stripe2: null, veilBand: null,
    belt: '#8c7051', beltSub: '#70563b',
    hair: '#4a2c18', skin: '#f0cfb4', shoe: '#222022'
  },
  {
    skirt: '#6b2c2e', bodice: '#f7f0e4', sleeve: '#6b2c2e',
    veil: '#f7f0e4', shawl: '#f7f0e4',
    stripe1: '#be185d', stripe2: '#78350f', veilBand: '#d97706',
    belt: '#9c7a54', beltSub: '#7c5d3b',
    hair: '#3b2212', skin: '#f3d4ba', shoe: '#2b1d16'
  },
  {
    skirt: '#2c4257', bodice: '#eef4f8', sleeve: '#2c4257',
    veil: '#f0f4f8', shawl: '#f0f4f8',
    stripe1: '#38bdf8', stripe2: '#1e3a8a', veilBand: '#0284c7',
    belt: '#94785b', beltSub: '#735a40',
    hair: '#29170b', skin: '#f0cfb4', shoe: '#1e242b'
  }
];

window.createLowPolyPersonMesh = function (preset = 'disciple', idx = 0) {
  const lodGroup = new THREE.LOD();

  let isFemale = false;
  let cfg = null;
  let sc = 1.0;

  if (preset === 'jesus') {
    cfg = ISRAELITE_MALE_VARIANTS[0];
  } else if (preset === 'woman' || preset.startsWith('female_')) {
    isFemale = true;
    const fIdx = preset.startsWith('female_') ? parseInt(preset.split('_')[1], 10) : (idx % 3);
    cfg = { ...ISRAELITE_FEMALE_VARIANTS[fIdx % 3] };
    sc = 0.96;
  } else if (preset === 'villager') {
    if (idx % 2 === 1) {
      isFemale = true;
      cfg = { ...ISRAELITE_FEMALE_VARIANTS[Math.floor(idx / 2) % 3] };
      sc = 0.96;
    } else {
      isFemale = false;
      cfg = { ...ISRAELITE_MALE_VARIANTS[Math.floor(idx / 2) % 3] };
    }
  } else if (preset === 'hero') {
    isFemale = false;
    cfg = { ...ISRAELITE_MALE_VARIANTS[0] };
    sc = 1.0;
  } else if (preset === 'zacchaeus') {
    isFemale = false;
    cfg = {
      ...ISRAELITE_MALE_VARIANTS[2],
      robe: '#581c87', sleeve: '#581c87', shawl: '#f5efe6',
      stripe1: '#eab308', stripe2: '#7e22ce',
      beardStyle: 'trimmed', headwear: 'none'
    };
    sc = 0.82;
  } else if (preset === 'child') {
    isFemale = (idx % 2 === 1);
    cfg = isFemale
      ? { ...ISRAELITE_FEMALE_VARIANTS[idx % 3] }
      : { ...ISRAELITE_MALE_VARIANTS[idx % 3], beardStyle: 'none' };
    sc = 0.72;
  } else if (preset === 'soldier') {
    isFemale = false;
    cfg = {
      ...ISRAELITE_MALE_VARIANTS[0],
      robe: '#991b1b', sleeve: '#991b1b', shawl: '#64748b',
      stripe1: '#eab308', stripe2: '#451a03',
      beardStyle: 'none', headwear: 'helmet'
    };
    sc = 1.04;
  } else if (preset === 'angel') {
    isFemale = false;
    cfg = {
      ...ISRAELITE_MALE_VARIANTS[0],
      robe: '#ffffff', sleeve: '#ffffff', shawl: '#fef9c3',
      stripe1: '#facc15', stripe2: '#eab308',
      headcloth: null, agal1: null, agal2: null,
      hair: '#e8b931',
      browColor: '#9c7224',
      beardStyle: 'none', headwear: 'none', hasHalo: false, hasWings: true
    };
    sc = 1.05;
  } else {
    isFemale = false;
    cfg = { ...ISRAELITE_MALE_VARIANTS[idx % 3] };
  }

  // ----------------------------------------------------
  // 고해상도(근거리용) 모델 (gHigh) 조립
  // ----------------------------------------------------
  const gHigh = new THREE.Group();

  if (preset === 'jesus') {
    const robeCol   = '#e8e6e2';
    const skinCol   = '#f2cfb4';
    const hairCol   = '#4e2f1e';
    const beardCol  = '#6b4732';
    const sandalCol = '#3b2416';
    const beltCol   = '#9c846b';
    const sashCol   = '#c83228';
    const foldCol   = '#ad261d';

    const buildJesusLeg = (isLeft) => {
      const legGrp = new THREE.Group();
      legGrp.position.set(isLeft ? -0.15 : 0.15, 0.52, 0);
      const ankle = createLowPolyMesh(new THREE.CylinderGeometry(0.085, 0.075, 0.34, 6), skinCol, 0, -0.18, 0);
      const sole = createLowPolyMesh(new THREE.BoxGeometry(0.21, 0.065, 0.36), sandalCol, 0, -0.43, 0.05);
      const foot = createLowPolyMesh(new THREE.BoxGeometry(0.17, 0.085, 0.26), skinCol, 0, -0.37, 0.05);
      const strapFront = createLowPolyMesh(new THREE.BoxGeometry(0.22, 0.075, 0.11), sandalCol, 0, -0.37, 0.11, false);
      const strapHeel  = createLowPolyMesh(new THREE.BoxGeometry(0.21, 0.095, 0.075), sandalCol, 0, -0.36, -0.08, false);
      legGrp.add(ankle, sole, foot, strapFront, strapHeel);
      return legGrp;
    };
    const lLeg = buildJesusLeg(true);
    const rLeg = buildJesusLeg(false);

    const skirtMesh  = createLowPolyMesh(getPleatedAlineSkirtGeo(), robeCol, 0, 0.58, 0);
    const bodiceMesh = createLowPolyMesh(getAnatomicalUpperTorsoGeo(), robeCol, 0, 1.24, 0);
    const collarYoke = createLowPolyMesh(new THREE.CylinderGeometry(0.17, 0.27, 0.10, 8), robeCol, 0, 1.49, 0);
    collarYoke.scale.set(1.04, 1.0, 0.68);
    const neck = createLowPolyMesh(new THREE.CylinderGeometry(0.092, 0.112, 0.24, 8), skinCol, 0, 1.63, 0, false);

    const beltGrp = createEllipticalDoubleRopeBelt(beltCol, '#826b54', false);
    const redSashGrp = createJesusDiagonalRedSashGroup(sashCol, foldCol);

    const lArm = createJesusBellSleeveArm(true, robeCol, '#d8d5d0', skinCol);
    const rArm = createJesusBellSleeveArm(false, robeCol, '#d8d5d0', skinCol);

    const head = new THREE.Group();
    head.position.set(0, 1.92, 0);

    const faceMesh = createLowPolyMesh(getSoftLowPolyHeadGeo(false, false), skinCol, 0, 0, 0);
    faceMesh.name = 'headBase';
    const facialFeatures = createSoftFacialFeaturesGroup(skinCol, hairCol, false, false);
    const beardGroup = createSoftLowPolyBeardGroup('jesus', beardCol, false);
    const hairGroup = createJesusFacetedHairGroup(hairCol);

    head.add(faceMesh, facialFeatures, beardGroup, hairGroup);

    gHigh.add(lLeg, rLeg, skirtMesh, bodiceMesh, collarYoke, neck, beltGrp, redSashGrp, lArm, rArm, head);
  } else {
    const buildLeg = (isLeft) => {
      const legGrp = new THREE.Group();
      legGrp.position.set(isLeft ? -0.15 : 0.15, 0.52, 0);
      const ankle = createLowPolyMesh(new THREE.CylinderGeometry(0.085, 0.075, 0.34, 6), cfg.skin, 0, -0.18, 0);
      legGrp.add(ankle);

      if (isFemale) {
        const shoe = createLowPolyMesh(new THREE.BoxGeometry(0.20, 0.12, 0.34), cfg.shoe, 0, -0.40, 0.04);
        const shoeFront = createLowPolyMesh(new THREE.BoxGeometry(0.18, 0.10, 0.15), cfg.shoe, 0, -0.41, 0.17);
        legGrp.add(shoe, shoeFront);
      } else {
        const sole = createLowPolyMesh(new THREE.BoxGeometry(0.21, 0.065, 0.36), cfg.sandal, 0, -0.43, 0.05);
        const foot = createLowPolyMesh(new THREE.BoxGeometry(0.17, 0.085, 0.26), cfg.skin, 0, -0.37, 0.05);
        const strapFront = createLowPolyMesh(new THREE.BoxGeometry(0.22, 0.075, 0.11), cfg.sandal, 0, -0.37, 0.11, false);
        const strapHeel  = createLowPolyMesh(new THREE.BoxGeometry(0.21, 0.095, 0.075), cfg.sandal, 0, -0.36, -0.08, false);
        legGrp.add(sole, foot, strapFront, strapHeel);
      }
      return legGrp;
    };
    const lLeg = buildLeg(true);
    const rLeg = buildLeg(false);

    const skirtCol  = isFemale ? cfg.skirt : cfg.robe;
    const bodiceCol = isFemale ? cfg.bodice : cfg.robe;

    const skirtMesh  = createLowPolyMesh(getPleatedAlineSkirtGeo(), skirtCol, 0, 0.58, 0);
    const bodiceMesh = createLowPolyMesh(getAnatomicalUpperTorsoGeo(), bodiceCol, 0, 1.24, 0);
    const neck       = createLowPolyMesh(new THREE.CylinderGeometry(0.092, 0.112, 0.24, 8), cfg.skin, 0, 1.63, 0, false);

    const mantleGroup = createCleanIsraeliteMantleGroup(cfg.shawl, cfg.stripe1, cfg.stripe2, isFemale);
    const beltGroup   = createEllipticalDoubleRopeBelt(cfg.belt, cfg.beltSub, true);

    const lArm = createSeamlessPonchoArm(true, cfg.shawl, cfg.stripe1, cfg.stripe2, cfg.sleeve, cfg.skin);
    const rArm = createSeamlessPonchoArm(false, cfg.shawl, cfg.stripe1, cfg.stripe2, cfg.sleeve, cfg.skin);

    const head = new THREE.Group();
    head.position.set(0, 1.92, 0);

    const isHelmet = (!isFemale && cfg.headwear === 'helmet');
    const isHooded = isFemale || (cfg.headwear !== 'none' && !isHelmet);

    const faceMesh = createLowPolyMesh(getSoftLowPolyHeadGeo(isHooded || isHelmet, isFemale), cfg.skin, 0, 0, 0);
    faceMesh.name = 'headBase';
    const facialFeatures = createSoftFacialFeaturesGroup(cfg.skin, cfg.hair, isFemale, isHooded || isHelmet, cfg.browColor || null);
    head.add(faceMesh, facialFeatures);

    // 두건을 쓰지 않은 남자(및 투구 병사)는 입체 귀 장착 (두건 착용 시 귀는 두건 내부 수납으로 돌출 방지)
    if (!isHooded) {
      const earX = isHelmet ? 0.228 : 0.236;
      const earL = createLowPolyMesh(getSculptedEarGeo(true),  cfg.skin, -earX, -0.008, -0.012, false);
      const earR = createLowPolyMesh(getSculptedEarGeo(false), cfg.skin,  earX, -0.008, -0.012, false);
      earL.name = 'ear';
      earR.name = 'ear';
      head.add(earL, earR);
    }

    if (isHelmet) {
      const helmDome = createLowPolyMesh(
        new THREE.SphereGeometry(0.285, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.56).toNonIndexed(),
        '#64748b', 0, 0.145, -0.018
      );
      helmDome.scale.set(1.04, 0.92, 1.06);
      const helmRim = createLowPolyMesh(new THREE.CylinderGeometry(0.295, 0.305, 0.046, 10), '#475569', 0, 0.175, -0.018);
      helmRim.scale.set(1.04, 1.0, 1.06);
      const neckGuard = createLowPolyMesh(
        new THREE.CylinderGeometry(0.265, 0.305, 0.16, 8, 1, false, Math.PI * 0.65, Math.PI * 0.70).toNonIndexed(),
        '#475569', 0, 0.085, -0.035
      );
      const crest = createLowPolyMesh(new THREE.BoxGeometry(0.10, 0.22, 0.48), '#dc2626', 0, 0.425, -0.03);
      head.add(helmDome, helmRim, neckGuard, crest);
    } else if (isHooded) {
      const hoodSeed = (preset === 'hero') ? 0 : idx;
      const openHood = createOpenFrontHoodGroup(
        isFemale ? cfg.veil : cfg.headcloth,
        isFemale,
        cfg.agal1,
        cfg.headwear === 'sudra_double' ? cfg.agal2 : null,
        cfg.veilBand,
        hoodSeed
      );
      head.add(openHood);
    }

    if (isFemale) {
      head.add(createHoodedInnerHairGroup(cfg.hair, true));
    } else {
      if (cfg.headwear === 'none') {
        const hairStyleIdx = (cfg.beardStyle === 'trimmed') ? 1 : (cfg.beardStyle === 'short' ? 0 : (idx % 2));
        head.add(createSoftMaleHairGroup(cfg.hair, hairStyleIdx));
      } else {
        head.add(createHoodedInnerHairGroup(cfg.hair, false));
      }

      if (cfg.beardStyle && cfg.beardStyle !== 'none') {
        head.add(createSoftLowPolyBeardGroup(cfg.beardStyle, cfg.hair, isHooded));
      }
    }

    if (cfg.hasHalo) {
      const haloRing = new THREE.Mesh(
        new THREE.RingGeometry(0.50, 0.65, 16),
        new THREE.MeshBasicMaterial({ color: 0xfef08a, side: THREE.DoubleSide, transparent: true, opacity: 0.80 })
      );
      haloRing.position.set(0, 0.14, -0.40);
      head.add(haloRing);
    }
    gHigh.add(lLeg, rLeg, skirtMesh, bodiceMesh, neck, mantleGroup, beltGroup, lArm, rArm, head);

    if (cfg.hasWings) {
      const wingL = createLowPolyMesh(new THREE.ConeGeometry(0.36, 1.25, 4), '#fef9c3', -0.44, 1.38, -0.32, false);
      wingL.rotation.z =  0.68;
      wingL.scale.set(0.45, 1.0, 1.0);
      const wingR = createLowPolyMesh(new THREE.ConeGeometry(0.36, 1.25, 4), '#fef9c3',  0.44, 1.38, -0.32, false);
      wingR.rotation.z = -0.68;
      wingR.scale.set(0.45, 1.0, 1.0);
      gHigh.add(wingL, wingR);
    }
  }

  // ----------------------------------------------------
  // [개선된 1-Draw-Call 사람 실루엣 LOD] 원거리용 통합 소프트 로우폴리 모델 (gLow)
  // - 기존 7개 박스(7 draw calls, 네모 형태)를 단일 버텍스 컬러 메쉬(1 draw call)로 통합!
  // - 둥근 머리·헤어/두건·어깨·A라인 로브·양팔·발·날개 윤곽이 또렷하면서도 모바일 FPS 대폭 향상
  // ----------------------------------------------------
  const gLow = new THREE.Group();
  const lowSilhouetteMesh = new THREE.Mesh(
    getMergedLowPolySilhouetteGeo(preset, cfg, isFemale),
    getSharedLowPolySilhouetteMat()
  );
  lowSilhouetteMesh.castShadow = false;
  lowSilhouetteMesh.receiveShadow = false;
  gLow.add(lowSilhouetteMesh);

  lodGroup.addLevel(gHigh, 0);
  const lodSwitchDist = miracleSunSystem.isMobile ? 20 : 32;
  lodGroup.addLevel(gLow, lodSwitchDist);

  lodGroup.scale.set(sc, sc, sc);

  // High Mesh 기준으로 관절 제어 포인터 맵핑 (업데이트 함수용)
  lodGroup.userData = {
    lLeg: preset === 'jesus' ? gHigh.children[0] : gHigh.children[0],
    rLeg: preset === 'jesus' ? gHigh.children[1] : gHigh.children[1],
    lArm: preset === 'jesus' ? gHigh.children[8] : gHigh.children[7],
    rArm: preset === 'jesus' ? gHigh.children[9] : gHigh.children[8],
    head: preset === 'jesus' ? gHigh.children[10] : gHigh.children[9],
    walkPhase: idx * 0.9
  };
  return lodGroup;
};

let _sharedLowPolySilhouetteMat = null;
function getSharedLowPolySilhouetteMat() {
  if (!_sharedLowPolySilhouetteMat) {
    _sharedLowPolySilhouetteMat = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      vertexColors: true,
      flatShading: true
    });
    _sharedLowPolySilhouetteMat.userData = { _cached: true };
  }
  return _sharedLowPolySilhouetteMat;
}

const _lowPolySilhouetteGeoCache = {};
function getMergedLowPolySilhouetteGeo(preset, cfg, isFemale) {
  const isJesus = (preset === 'jesus');
  const isHelmet = (!isJesus && !isFemale && cfg.headwear === 'helmet');
  const isHooded = (!isJesus && !isHelmet) && (isFemale || cfg.headwear !== 'none');

  const skinCol   = isJesus ? '#f2cfb4' : cfg.skin;
  const hairCol   = isJesus ? '#4e2f1e' : cfg.hair;
  const hoodCol   = isHooded ? (isFemale ? cfg.veil : cfg.headcloth) : '';
  const bodiceCol = isJesus ? '#e8e6e2' : (isFemale ? cfg.bodice : cfg.robe);
  const skirtCol  = isJesus ? '#e8e6e2' : (isFemale ? cfg.skirt : cfg.robe);
  const shawlCol  = isJesus ? '#c83228' : cfg.shawl;
  const sleeveCol = isJesus ? '#e8e6e2' : cfg.shawl;
  const beltCol   = isJesus ? '#9c846b' : cfg.belt;
  const shoeCol   = isJesus ? '#3b2416' : (isFemale ? cfg.shoe : cfg.sandal);
  const hasWings  = Boolean(cfg.hasWings);

  const key = [
    isJesus ? 'J' : (isFemale ? 'F' : 'M'),
    isHooded ? 'H' : (isHelmet ? 'K' : 'U'),
    hasWings ? 'W' : 'N',
    skinCol, hairCol, hoodCol, bodiceCol, skirtCol, shawlCol, beltCol, shoeCol
  ].join('|');

  if (_lowPolySilhouetteGeoCache[key]) return _lowPolySilhouetteGeoCache[key];

  const positions = [];
  const colors = [];
  const tmpColor = new THREE.Color();
  const tmpMat = new THREE.Matrix4();
  const tmpPos = new THREE.Vector3();
  const tmpQuat = new THREE.Quaternion();
  const tmpEuler = new THREE.Euler();
  const tmpScale = new THREE.Vector3();
  const tmpV = new THREE.Vector3();

  const appendPart = (rawGeo, hexColor, tx, ty, tz, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0) => {
    const g = rawGeo.index ? rawGeo.toNonIndexed() : rawGeo;
    tmpColor.set(hexColor);
    tmpPos.set(tx, ty, tz);
    tmpEuler.set(rx, ry, rz);
    tmpQuat.setFromEuler(tmpEuler);
    tmpScale.set(sx, sy, sz);
    tmpMat.compose(tmpPos, tmpQuat, tmpScale);

    const attr = g.attributes.position;
    for (let i = 0; i < attr.count; i++) {
      tmpV.set(attr.getX(i), attr.getY(i), attr.getZ(i)).applyMatrix4(tmpMat);
      positions.push(tmpV.x, tmpV.y, tmpV.z);
      colors.push(tmpColor.r, tmpColor.g, tmpColor.b);
    }
    if (g !== rawGeo) g.dispose();
    rawGeo.dispose();
  };

  // 1) 둥근 로우폴리 머리 & 목 (두건 착용 시에도 정면 얼굴이 선명히 드러나도록 살짝 전방 배치)
  appendPart(new THREE.IcosahedronGeometry(0.242, 0), skinCol, 0, 1.92, isHooded ? 0.055 : 0.015, 0.98, 1.10, 0.96);
  appendPart(new THREE.CylinderGeometry(0.088, 0.112, 0.18, 5), skinCol, 0, 1.63, 0);

  // 2) 머리 위 헤어 / 두건 / 투구 윤곽
  if (isJesus) {
    appendPart(new THREE.IcosahedronGeometry(0.285, 0), hairCol, 0, 1.97, -0.04, 1.10, 1.12, 1.08);
    appendPart(new THREE.CylinderGeometry(0.26, 0.28, 0.40, 6), hairCol, 0, 1.72, -0.06, 1.05, 1.0, 0.88);
  } else if (isHelmet) {
    appendPart(new THREE.IcosahedronGeometry(0.29, 0), '#64748b', 0, 2.02, -0.02, 1.04, 0.92, 1.08);
    appendPart(new THREE.BoxGeometry(0.09, 0.18, 0.42), '#dc2626', 0, 2.28, -0.03);
  } else if (isHooded) {
    // 두건이 얼굴을 덮지 않고 머리 뒤·위·양옆을 감싸는 자연스러운 윤곽
    appendPart(new THREE.IcosahedronGeometry(0.295, 0), hoodCol, 0, 2.01, -0.095, 1.08, 1.12, 0.96);
    appendPart(new THREE.CylinderGeometry(0.27, 0.34, 0.38, 6), hoodCol, 0, 1.73, -0.105, 1.08, 1.0, 0.86);
  } else {
    appendPart(new THREE.IcosahedronGeometry(0.268, 0), hairCol, 0, 2.01, -0.03, 1.06, 0.95, 1.06);
  }

  // 3) 슬림한 어깨·상체 + 숄/붉은 띠 + 허리띠 + A라인 롱 로브
  appendPart(new THREE.CylinderGeometry(0.265, 0.21, 0.56, 6), bodiceCol, 0, 1.28, 0, 1.12, 1.0, 0.66);
  if (isJesus) {
    appendPart(new THREE.CylinderGeometry(0.085, 0.105, 0.88, 5), shawlCol, 0.0, 1.16, 0.15, 1.0, 1.0, 0.45, 0, 0, -0.44);
  } else {
    appendPart(new THREE.CylinderGeometry(0.19, 0.35, 0.22, 6), shawlCol, 0, 1.46, -0.01, 1.08, 1.0, 0.72);
  }
  appendPart(new THREE.CylinderGeometry(0.24, 0.25, 0.09, 6), beltCol, 0, 0.98, 0, 1.02, 1.0, 0.72);
  appendPart(new THREE.CylinderGeometry(0.23, 0.41, 0.88, 7), skirtCol, 0, 0.54, 0, 1.0, 1.0, 0.74);

  // 4) 자연스럽게 내려온 양팔 & 손
  appendPart(new THREE.CylinderGeometry(0.098, 0.068, 0.56, 5), sleeveCol, -0.32, 1.25, 0, 1, 1, 1, 0, 0, -0.20);
  appendPart(new THREE.CylinderGeometry(0.098, 0.068, 0.56, 5), sleeveCol,  0.32, 1.25, 0, 1, 1, 1, 0, 0,  0.20);
  appendPart(new THREE.IcosahedronGeometry(0.062, 0), skinCol, -0.38, 0.94, 0.02);
  appendPart(new THREE.IcosahedronGeometry(0.062, 0), skinCol,  0.38, 0.94, 0.02);

  // 5) 두 발(샌들)
  appendPart(new THREE.BoxGeometry(0.16, 0.11, 0.26), shoeCol, -0.14, 0.07, 0.04);
  appendPart(new THREE.BoxGeometry(0.16, 0.11, 0.26), shoeCol,  0.14, 0.07, 0.04);

  // 6) 천사 날개 실루엣
  if (hasWings) {
    appendPart(new THREE.ConeGeometry(0.34, 1.20, 4), '#fef9c3', -0.44, 1.38, -0.30, 0.45, 1.0, 1.0, 0, 0,  0.68);
    appendPart(new THREE.ConeGeometry(0.34, 1.20, 4), '#fef9c3',  0.44, 1.38, -0.30, 0.45, 1.0, 1.0, 0, 0, -0.68);
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  merged.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  merged.computeVertexNormals();
  markCachedGeo(merged);
  _lowPolySilhouetteGeoCache[key] = merged;
  return merged;
}

// 플레이어 캐릭터 생성기 (항상 고해상도(LOD 0) 강제 추출 유지)
window.createMiracleHeroMesh = function () {
  const g = window.createLowPolyPersonMesh('hero', 0);
  const heroGrp = g.levels[0].object.clone();
  heroGrp.scale.copy(g.scale);
  const u = {
    lLeg: heroGrp.children[0], rLeg: heroGrp.children[1],
    lArm: heroGrp.children[7], rArm: heroGrp.children[8], head: heroGrp.children[9]
  };
  const toolGrp = new THREE.Group();
  toolGrp.add(createLowPolyMesh(new THREE.CylinderGeometry(0.20, 0.15, 0.24, 7), '#d97706', 0, -0.66, 0.22, false));
  toolGrp.visible = false;
  u.lArm.add(toolGrp);
  carriedBlockGroup = new THREE.Group();
  carriedBlockGroup.position.set(0, 1.22, -0.36);
  heroGrp.add(carriedBlockGroup);
  playerLimbs = { lLeg: u.lLeg, rLeg: u.rLeg, lArm: u.lArm, rArm: u.rArm, axeTool: toolGrp };
  heroGrp.userData = u;
  return heroGrp;
};

// =========================================================================
// [ep4_miracle_assets.js - 파트 3/3] 에피소드 4 전용 소프트 로우 폴리곤 에셋
// 8. 소프트 로우폴리 동물(사슴·양·나귀·물고기) & 다중 가지 수관 나무·야생화
// - 선인장 몸통 비정형 왜곡 및 끝부분(Tip) 위치 밀착 보정 완료
// =========================================================================

// -------------------------------------------------------------------------
// 8. 소프트 로우폴리 동물(사슴·양·나귀·물고기) & 다중 가지 나무·야생화
// -------------------------------------------------------------------------
function createSculptedLimbGeo(topR, botR, length, sides = 5, bendZ = 0) {
  const geo = new THREE.CylinderGeometry(topR, botR, length, sides, 2);
  geo.translate(0, -length * 0.5, 0);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const t = Math.abs(y) / length;
    if (t > 0.35 && t < 0.65) { z += bendZ; x *= 0.92; }
    pos.setXYZ(i, x, y, z);
  }
  const finalGeo = geo.toNonIndexed();
  finalGeo.computeVertexNormals();
  return finalGeo;
}

function createSculptedTorsoGeo(rx, ry, rz) {
  const geo = new THREE.IcosahedronGeometry(1.0, 1);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i) * rx, y = pos.getY(i) * ry, z = pos.getZ(i) * rz;
    if (z > 0) { y += (z / rz) * 0.08 * ry; }
    else { x *= 0.90; y -= (Math.abs(z) / rz) * 0.05 * ry; }
    if (y > ry * 0.65) { y = ry * 0.65 + (y - ry * 0.65) * 0.45; }
    pos.setXYZ(i, x, y, z);
  }
  const finalGeo = geo.toNonIndexed();
  finalGeo.computeVertexNormals();
  return finalGeo;
}

function createFlattenedFoliagePadGeo(radius, height, detail = 1) {
  const geo = new THREE.IcosahedronGeometry(radius, detail);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const normY = y / radius;
    if (normY > 0.25) {
      y = height * (0.35 + (normY - 0.25) * 0.35);
      x *= 1.12; z *= 1.12;
    } else {
      y = height * normY * 0.55;
    }
    pos.setXYZ(i, x, y, z);
  }
  const finalGeo = geo.toNonIndexed();
  finalGeo.computeVertexNormals();
  return finalGeo;
}

function createLowPolyAnimalMesh(kind = 'sheep', scale = 1.0) {
  const g = new THREE.Group();

  if (kind === 'deer') {
    const coatCol = '#8c532b', bellyCol = '#c68b59', darkCol = '#3b2212';
    const body = createLowPolyMesh(createSculptedTorsoGeo(0.32, 0.30, 0.62), coatCol, 0, 0.78, 0);
    const chest = createLowPolyMesh(createSculptedTorsoGeo(0.26, 0.28, 0.28), bellyCol, 0, 0.80, 0.40);
    const neck = createLowPolyMesh(createSculptedLimbGeo(0.11, 0.17, 0.52, 5, 0.04), coatCol, 0, 1.24, 0.56);
    neck.rotation.x = -0.35;

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.26, 0.60);
    const skull = createLowPolyMesh(createSculptedTorsoGeo(0.15, 0.14, 0.22), coatCol, 0, 0, 0);
    const snout = createLowPolyMesh(new THREE.ConeGeometry(0.11, 0.28, 5), coatCol, 0, -0.03, 0.22);
    snout.rotation.x = Math.PI / 2 + 0.15;
    const nose = createLowPolyMesh(new THREE.DodecahedronGeometry(0.045, 0), darkCol, 0, -0.04, 0.35, false);

    const earGeo = new THREE.ConeGeometry(0.065, 0.24, 4);
    const earL = createLowPolyMesh(earGeo, coatCol, -0.13, 0.16, -0.06, false); earL.rotation.set(-0.3, 0, 0.55);
    const earR = createLowPolyMesh(earGeo, coatCol,  0.13, 0.16, -0.06, false); earR.rotation.set(-0.3, 0, -0.55);
    headGroup.add(skull, snout, nose, earL, earR);

    const tail = createLowPolyMesh(new THREE.ConeGeometry(0.07, 0.22, 4), bellyCol, 0, 0.86, -0.62, false);
    tail.rotation.x = -0.8;

    const legGeoF = createSculptedLimbGeo(0.09, 0.045, 0.72, 5, 0.03);
    const legGeoB = createSculptedLimbGeo(0.11, 0.045, 0.74, 5, -0.04);
    const flLeg = createLowPolyMesh(legGeoF, darkCol, -0.17, 0.72,  0.38);
    const frLeg = createLowPolyMesh(legGeoF, darkCol,  0.17, 0.72,  0.38);
    const blLeg = createLowPolyMesh(legGeoB, darkCol, -0.18, 0.74, -0.38);
    const brLeg = createLowPolyMesh(legGeoB, darkCol,  0.18, 0.74, -0.38);

    g.add(body, chest, neck, headGroup, tail, flLeg, frLeg, blLeg, brLeg);
    g.scale.set(scale, scale, scale);
    g.traverse(ch => { if (ch.isMesh) { ch.castShadow = true; ch.receiveShadow = true; } });
    g.userData = { flLeg, frLeg, blLeg, brLeg, headGroup, walkPhase: Math.random() * 6.28 };
    return g;
  }

  if (kind === 'donkey') {
    const furCol = '#7c7267', bellyCol = '#b8afa6', darkCol = '#3f3a34';
    const body = createLowPolyMesh(createSculptedTorsoGeo(0.38, 0.36, 0.68), furCol, 0, 0.84, 0);
    const neck = createLowPolyMesh(createSculptedLimbGeo(0.16, 0.22, 0.56, 5, 0.03), furCol, 0, 1.32, 0.55);
    neck.rotation.x = -0.42;

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.32, 0.62);
    const skull = createLowPolyMesh(createSculptedTorsoGeo(0.18, 0.17, 0.24), furCol, 0, 0, 0);
    const muzzle = createLowPolyMesh(createSculptedTorsoGeo(0.13, 0.12, 0.18), bellyCol, 0, -0.05, 0.22);
    const earGeo = new THREE.ConeGeometry(0.075, 0.38, 4);
    const earL = createLowPolyMesh(earGeo, darkCol, -0.14, 0.24, -0.05); earL.rotation.set(-0.2, 0, 0.38);
    const earR = createLowPolyMesh(earGeo, darkCol,  0.14, 0.24, -0.05); earR.rotation.set(-0.2, 0, -0.38);
    headGroup.add(skull, muzzle, earL, earR);

    const mane = createLowPolyMesh(new THREE.ConeGeometry(0.08, 0.48, 4), darkCol, 0, 1.15, 0.36, false); mane.rotation.x = -0.42;
    const tail = createLowPolyMesh(new THREE.ConeGeometry(0.06, 0.38, 4), darkCol, 0, 0.72, -0.68, false); tail.rotation.x = 2.6;

    const packL = createLowPolyMesh(new THREE.DodecahedronGeometry(0.26, 0), '#c26d38', -0.36, 1.02, 0.02); packL.scale.set(0.85, 1.1, 1.25);
    const packR = createLowPolyMesh(new THREE.DodecahedronGeometry(0.26, 0), '#b45309',  0.36, 1.02, 0.02); packR.scale.set(0.85, 1.1, 1.25);
    const blanket = createLowPolyMesh(createFlattenedFoliagePadGeo(0.42, 0.18, 0), '#991b1b', 0, 1.12, 0.02);

    const legGeo = createSculptedLimbGeo(0.11, 0.065, 0.74, 5, 0.02);
    const flLeg = createLowPolyMesh(legGeo, darkCol, -0.20, 0.74,  0.40);
    const frLeg = createLowPolyMesh(legGeo, darkCol,  0.20, 0.74,  0.40);
    const blLeg = createLowPolyMesh(legGeo, darkCol, -0.20, 0.74, -0.40);
    const brLeg = createLowPolyMesh(legGeo, darkCol,  0.20, 0.74, -0.40);

    g.add(body, neck, headGroup, mane, tail, blanket, packL, packR, flLeg, frLeg, blLeg, brLeg);
    g.scale.set(scale, scale, scale);
    g.traverse(ch => { if (ch.isMesh) { ch.castShadow = true; ch.receiveShadow = true; } });
    g.userData = { flLeg, frLeg, blLeg, brLeg, headGroup, walkPhase: Math.random() * 6.28 };
    return g;
  }

  const woolMain = '#f8fafc', woolSub = '#e2e8f0', skinCol = '#334155';
  const woolGroup = new THREE.Group();
  const puffs = [
    { x:  0.0, y: 0.68, z:  0.0,  r: 0.44, sx: 1.05, sy: 0.90, sz: 1.25, c: woolMain },
    { x: -0.22, y: 0.66, z: 0.12, r: 0.32, sx: 1.0,  sy: 0.95, sz: 1.1,  c: woolSub },
    { x:  0.22, y: 0.66, z: 0.12, r: 0.32, sx: 1.0,  sy: 0.95, sz: 1.1,  c: woolMain },
    { x:  0.0, y: 0.76, z:  0.28, r: 0.34, sx: 1.05, sy: 0.95, sz: 1.0,  c: woolMain },
    { x:  0.0, y: 0.64, z: -0.34, r: 0.32, sx: 1.0,  sy: 0.90, sz: 1.0,  c: woolSub }
  ];
  puffs.forEach((p, idx) => {
    const m = createLowPolyMesh(new THREE.IcosahedronGeometry(p.r, 0), p.c, p.x, p.y, p.z);
    m.scale.set(p.sx, p.sy, p.sz);
    m.rotation.set(idx * 0.4, idx * 0.7, 0);
    woolGroup.add(m);
  });

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.88, 0.56);
  const skull = createLowPolyMesh(createSculptedTorsoGeo(0.18, 0.17, 0.24), skinCol, 0, 0, 0);
  const crownWool = createLowPolyMesh(new THREE.IcosahedronGeometry(0.17, 0), woolMain, 0, 0.12, -0.04); crownWool.scale.set(1.1, 0.75, 1.0);
  const earGeo = new THREE.ConeGeometry(0.06, 0.20, 4);
  const earL = createLowPolyMesh(earGeo, skinCol, -0.20, 0.02, -0.02, false); earL.rotation.z = 1.15;
  const earR = createLowPolyMesh(earGeo, skinCol,  0.20, 0.02, -0.02, false); earR.rotation.z = -1.15;
  headGroup.add(skull, crownWool, earL, earR);

  const legGeo = createSculptedLimbGeo(0.085, 0.05, 0.54, 5, 0.02);
  const flLeg = createLowPolyMesh(legGeo, skinCol, -0.18, 0.54,  0.28);
  const frLeg = createLowPolyMesh(legGeo, skinCol,  0.18, 0.54,  0.28);
  const blLeg = createLowPolyMesh(legGeo, skinCol, -0.18, 0.54, -0.28);
  const brLeg = createLowPolyMesh(legGeo, skinCol,  0.18, 0.54, -0.28);

  g.add(woolGroup, headGroup, flLeg, frLeg, blLeg, brLeg);
  g.scale.set(scale, scale, scale);
  g.traverse(ch => { if (ch.isMesh) { ch.castShadow = true; ch.receiveShadow = true; } });
  g.userData = { flLeg, frLeg, blLeg, brLeg, headGroup, walkPhase: Math.random() * 6.28 };
  return g;
}

window.createLowPolyDonkey = function (x, z, rotY = 0) {
  const by = typeof getMiracleOpenWorldGroundHeight === 'function' ? getMiracleOpenWorldGroundHeight(x, z) : 0;
  const donkey = createLowPolyAnimalMesh('donkey', 1.0);
  donkey.position.set(x, by, z);
  donkey.rotation.y = rotY;
  worldGroup.add(donkey);
  colliders.push({ minX: x - 0.65, maxX: x + 0.65, minZ: z - 0.75, maxZ: z + 0.75 });
  return donkey;
};

function createLowPolyFishMesh(colorHex = '#f97316', scale = 1.0) {
  const fGrp = new THREE.Group();
  const body = createLowPolyMesh(createSculptedTorsoGeo(0.14 * scale, 0.22 * scale, 0.42 * scale), colorHex, 0, 0, 0, false);
  const tail = createLowPolyMesh(new THREE.ConeGeometry(0.18 * scale, 0.28 * scale, 3), '#fef08a', 0, 0, -0.45 * scale, false);
  tail.rotation.x = Math.PI / 2;
  tail.scale.set(0.35, 1.0, 1.0);
  fGrp.add(body, tail);
  return fGrp;
}

function createBranchSegmentMesh(p1, p2, rBottom, rTop, colorHex) {
  const dir = new THREE.Vector3().subVectors(p2, p1);
  const len = dir.length();
  const geo = new THREE.CylinderGeometry(rTop, rBottom, len, 5);
  geo.translate(0, len * 0.5, 0);
  const finalGeo = geo.toNonIndexed();
  finalGeo.computeVertexNormals();

  const mesh = createLowPolyMesh(finalGeo, colorHex, p1.x, p1.y, p1.z, true);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  return mesh;
}

function addLowPolyCanopyTree(x, z, scale = 1.0, addCol = true) {
  const by = typeof getMiracleOpenWorldGroundHeight === 'function' ? getMiracleOpenWorldGroundHeight(x, z) : 0;
  const grp = new THREE.Group();
  const barkCol = '#6b442a', leafDark = '#527324', leafMid = '#6d9432', leafLite = '#8ab340';

  const baseP = new THREE.Vector3(0, 0, 0);
  const forkP = new THREE.Vector3(0, 1.8 * scale, 0);
  const mainTrunk = createBranchSegmentMesh(baseP, forkP, 0.52 * scale, 0.36 * scale, barkCol);
  grp.add(mainTrunk);
  wallMeshes.push(mainTrunk);

  const branches = [
    { mid: [-1.4, 3.0,  0.5], tip: [-3.1, 4.1,  0.9], padR: 2.1, padH: 1.0, col: leafMid },
    { mid: [ 1.5, 2.9,  0.4], tip: [ 3.3, 4.0,  0.7], padR: 2.2, padH: 1.0, col: leafLite },
    { mid: [-0.8, 3.2, -1.2], tip: [-2.1, 4.4, -2.4], padR: 2.0, padH: 0.95, col: leafDark },
    { mid: [ 1.0, 3.3, -1.1], tip: [ 2.3, 4.5, -2.2], padR: 2.1, padH: 1.0, col: leafMid },
    { mid: [ 0.0, 3.5,  0.1], tip: [ 0.1, 4.9,  0.2], padR: 2.5, padH: 1.1, col: leafLite }
  ];

  branches.forEach((b, idx) => {
    const mP = new THREE.Vector3(b.mid[0] * scale, b.mid[1] * scale, b.mid[2] * scale);
    const tP = new THREE.Vector3(b.tip[0] * scale, b.tip[1] * scale, b.tip[2] * scale);
    const b1 = createBranchSegmentMesh(forkP, mP, 0.26 * scale, 0.18 * scale, barkCol);
    const b2 = createBranchSegmentMesh(mP, tP, 0.18 * scale, 0.10 * scale, barkCol);

    const padGeo = createFlattenedFoliagePadGeo(b.padR * scale, b.padH * scale, 1);
    const padMesh = createLowPolyMesh(padGeo, b.col, tP.x, tP.y + 0.15 * scale, tP.z, true);
    padMesh.rotation.y = idx * 1.1;

    grp.add(b1, b2, padMesh);
    wallMeshes.push(b1, b2, padMesh);
  });

  grp.position.set(x, by, z);
  worldGroup.add(grp);
  if (addCol) {
    colliders.push({ minX: x - 0.75 * scale, maxX: x + 0.75 * scale, minZ: z - 0.75 * scale, maxZ: z + 0.75 * scale });
  }
  return grp;
}

window.addLowPolyOliveTree = function (x, z, scale = 1.0, addCol = true) {
  if (Math.abs(Math.round(x * 3 + z * 5)) % 4 === 0) {
    return addLowPolyCanopyTree(x, z, scale * 0.88, addCol);
  }

  const by = typeof getMiracleOpenWorldGroundHeight === 'function' ? getMiracleOpenWorldGroundHeight(x, z) : 0;
  const grp = new THREE.Group();
  const barkCol = '#7c4d2b';

  const p0 = new THREE.Vector3(0, 0, 0);
  const p1 = new THREE.Vector3(0.18 * scale, 1.45 * scale, -0.08 * scale);
  const p2 = new THREE.Vector3(-0.08 * scale, 2.85 * scale, 0.10 * scale);
  const pBranchL = new THREE.Vector3(-1.05 * scale, 2.35 * scale, 0.25 * scale);
  const pBranchR = new THREE.Vector3( 1.05 * scale, 2.55 * scale, -0.20 * scale);

  const t1 = createBranchSegmentMesh(p0, p1, 0.30 * scale, 0.22 * scale, barkCol);
  const t2 = createBranchSegmentMesh(p1, p2, 0.22 * scale, 0.13 * scale, barkCol);
  const bL = createBranchSegmentMesh(p1, pBranchL, 0.15 * scale, 0.08 * scale, barkCol);
  const bR = createBranchSegmentMesh(p1, pBranchR, 0.15 * scale, 0.08 * scale, barkCol);

  const padTop = createLowPolyMesh(createFlattenedFoliagePadGeo(1.55 * scale, 0.85 * scale, 1), '#759636', p2.x, p2.y + 0.15 * scale, p2.z, true);
  const padL   = createLowPolyMesh(createFlattenedFoliagePadGeo(1.15 * scale, 0.68 * scale, 0), '#5c7a29', pBranchL.x, pBranchL.y + 0.1 * scale, pBranchL.z, true);
  const padR   = createLowPolyMesh(createFlattenedFoliagePadGeo(1.20 * scale, 0.72 * scale, 0), '#8ab340', pBranchR.x, pBranchR.y + 0.1 * scale, pBranchR.z, true);

  grp.add(t1, t2, bL, bR, padTop, padL, padR);
  grp.position.set(x, by, z);
  worldGroup.add(grp);
  wallMeshes.push(t1, t2, padTop, padL, padR);

  if (addCol) {
    colliders.push({ minX: x - 0.55 * scale, maxX: x + 0.55 * scale, minZ: z - 0.55 * scale, maxZ: z + 0.55 * scale });
  }
  return grp;
};

window.addLowPolyCypressPineTree = function (x, z, scale = 1.0, addCol = true) {
  const by = typeof getMiracleOpenWorldGroundHeight === 'function' ? getMiracleOpenWorldGroundHeight(x, z) : 0;
  const grp = new THREE.Group();

  const p0 = new THREE.Vector3(0, 0, 0);
  const p1 = new THREE.Vector3(0, 1.8 * scale, 0);
  const trunk = createBranchSegmentMesh(p0, p1, 0.24 * scale, 0.14 * scale, '#5c3a21');

  const gemGeo = new THREE.IcosahedronGeometry(1.15 * scale, 0);
  const crown1 = createLowPolyMesh(gemGeo, '#2d4c1e', 0, 2.85 * scale, 0, true);
  crown1.scale.set(0.78, 1.55, 0.78);
  crown1.rotation.y = (x + z) * 0.5;

  const crown2 = createLowPolyMesh(new THREE.IcosahedronGeometry(0.85 * scale, 0), '#3f6212', 0, 4.15 * scale, 0, true);
  crown2.scale.set(0.72, 1.35, 0.72);
  crown2.rotation.y = (x - z) * 0.7;

  grp.add(trunk, crown1, crown2);
  grp.position.set(x, by, z);
  worldGroup.add(grp);
  wallMeshes.push(trunk, crown1, crown2);

  if (addCol) {
    colliders.push({ minX: x - 0.5 * scale, maxX: x + 0.5 * scale, minZ: z - 0.5 * scale, maxZ: z + 0.5 * scale });
  }
  return grp;
};

function addLowPolyWildflowerCluster(x, z, scale = 1.0) {
  const by = typeof getMiracleOpenWorldGroundHeight === 'function' ? getMiracleOpenWorldGroundHeight(x, z) : 0;
  if (by < -0.1) return null;
  const grp = new THREE.Group();
  const flowerCols = ['#ef4444', '#facc15', '#ffffff', '#14b8a6', '#fb7185'];
  const stemCol = '#3f6212', leafCol = '#65a30d';

  const count = 2 + (Math.abs(Math.round(x + z)) % 3);
  for (let i = 0; i < count; i++) {
    const ox = (i - 1) * 0.45 * scale + Math.sin(i * 2.1) * 0.15;
    const oz = Math.cos(i * 1.7) * 0.35 * scale;
    const h = (0.55 + (i % 2) * 0.22) * scale;

    const stem = createBranchSegmentMesh(
      new THREE.Vector3(ox, 0, oz),
      new THREE.Vector3(ox + 0.06, h, oz),
      0.035 * scale,
      0.025 * scale,
      stemCol
    );
    const blossom = createLowPolyMesh(
      new THREE.DodecahedronGeometry(0.14 * scale, 0),
      flowerCols[Math.abs(Math.round(x + z + i)) % flowerCols.length],
      ox + 0.06,
      h + 0.06 * scale,
      oz,
      true
    );
    blossom.scale.set(0.9, 1.15, 0.9);

    const bladeL = createLowPolyMesh(new THREE.ConeGeometry(0.06 * scale, 0.36 * scale, 3), leafCol, ox - 0.08, 0.16 * scale, oz, false);
    bladeL.rotation.z = 0.48;
    const bladeR = createLowPolyMesh(new THREE.ConeGeometry(0.06 * scale, 0.32 * scale, 3), leafCol, ox + 0.12, 0.15 * scale, oz, false);
    bladeR.rotation.z = -0.45;

    grp.add(stem, blossom, bladeL, bladeR);
  }

  grp.position.set(x, by, z);
  worldGroup.add(grp);
  return grp;
}

// -------------------------------------------------------------------------
// 가지런하면서도 비정형 조각감이 살아있는 소프트 로우 폴리곤 선인장 (화분 없음)
// - 일체형 8각 다면체 줄기 + 자연스럽게 꺾여 올라가는 좌·우 팔 + 다면체 돔 마감
// - 3종 미세 변형 지오메트리 캐싱으로 VRAM 절약
// -------------------------------------------------------------------------
const _sculptedCactusGeoCache = {};

function createSculptedCactusTubeGeo(spinePts, radii, apexPt, sides = 8, seed = 0) {
  const rings = [];
  const V = [0, 0, -1]; // XY 평면 굽힘 기준 수직 벡터 (U × V = T 보장)

  for (let r = 0; r < spinePts.length; r++) {
    const p = spinePts[r];
    let tx, ty, tz;
    if (r === 0) {
      tx = spinePts[1][0] - p[0];
      ty = spinePts[1][1] - p[1];
      tz = spinePts[1][2] - p[2];
    } else if (r === spinePts.length - 1) {
      tx = p[0] - spinePts[r - 1][0];
      ty = p[1] - spinePts[r - 1][1];
      tz = p[2] - spinePts[r - 1][2];
    } else {
      const a0 = p[0] - spinePts[r - 1][0], a1 = p[1] - spinePts[r - 1][1], a2 = p[2] - spinePts[r - 1][2];
      const aL = Math.hypot(a0, a1, a2) || 1;
      const b0 = spinePts[r + 1][0] - p[0], b1 = spinePts[r + 1][1] - p[1], b2 = spinePts[r + 1][2] - p[2];
      const bL = Math.hypot(b0, b1, b2) || 1;
      tx = a0 / aL + b0 / bL;
      ty = a1 / aL + b1 / bL;
      tz = a2 / aL + b2 / bL;
    }
    const tL = Math.hypot(tx, ty, tz) || 1;
    tx /= tL; ty /= tL; tz /= tL;

    // U = V × T (V = (0, 0, -1)) => (ty, -tx, 0)
    let ux = ty, uy = -tx, uz = 0;
    const uL = Math.hypot(ux, uy, uz) || 1;
    ux /= uL; uy /= uL; uz /= uL;

    const ring = [];
    const baseR = radii[r];
    for (let s = 0; s < sides; s++) {
      const ang = (s / sides) * Math.PI * 2 + (seed * 0.23);
      const ca = Math.cos(ang);
      const sa = Math.sin(ang);
      // 가지런하면서도 손으로 깎은 듯한 미세 비정형 면 변조 (±4.8%)
      const organic = 1.0 + Math.sin(ang * 3 + r * 1.15 + seed * 1.7) * 0.034
                          + Math.cos(ang * 2 - r * 0.85 + seed * 0.9) * 0.018;
      const rad = baseR * organic;
      const yRipple = (r > 0 && r < spinePts.length - 1)
        ? Math.sin(ang * 2 + r * 1.4 + seed) * 0.016
        : 0;
      ring.push([
        p[0] + (ca * ux + sa * V[0]) * rad + tx * yRipple,
        p[1] + (ca * uy + sa * V[1]) * rad + ty * yRipple,
        p[2] + (ca * uz + sa * V[2]) * rad + tz * yRipple
      ]);
    }
    rings.push(ring);
  }

  const v = [];
  // 측면 링 연결
  for (let r = 0; r < rings.length - 1; r++) {
    for (let s = 0; s < sides; s++) {
      const sn = (s + 1) % sides;
      pushQuad(v, rings[r][s], rings[r][sn], rings[r + 1][sn], rings[r + 1][s]);
    }
  }
  // 상단 다면체 돔 캡 마감 (외향 노멀)
  const topRing = rings[rings.length - 1];
  for (let s = 0; s < sides; s++) {
    const sn = (s + 1) % sides;
    pushTriangle(v, topRing[s], topRing[sn], apexPt);
  }
  // 하단 바닥 마감
  const botCenter = spinePts[0];
  for (let s = 0; s < sides; s++) {
    const sn = (s + 1) % sides;
    pushTriangle(v, botCenter, rings[0][sn], rings[0][s]);
  }

  return buildBufferGeoFromTriangles(v);
}

function getSculptedCactusGeos(variantIdx = 0) {
  const key = Math.abs(Math.round(variantIdx)) % 3;
  if (_sculptedCactusGeoCache[key]) return _sculptedCactusGeoCache[key];

  const s = key * 1.37 + 0.4;
  const leanX = (key - 1) * 0.025;

  // 1) 중심 8각 통통한 본체 줄기 (아래가 좁고 상단이 통통하며 깔끔한 다면체 돔으로 마무리)
  const mainSpine = [
    [0.00,          -0.08, 0.00],
    [leanX * 0.3,    0.34, 0.00],
    [leanX * 0.7,    0.84, 0.01],
    [leanX * 1.0,    1.34, 0.00],
    [leanX * 0.8,    1.68, 0.00]
  ];
  const mainRadii = [0.215, 0.268, 0.326, 0.346, 0.304];
  const mainApex  = [leanX * 0.7, 1.92, 0.00];

  // 2) 왼쪽 팔 (낮고 아담하게 대각선으로 뻗다 부드럽게 위로 치솟는 일체형 팔)
  const armLSpine = [
    [-0.12, 0.60, 0.00],
    [-0.40, 0.70, 0.01],
    [-0.56, 0.89, 0.01],
    [-0.64, 1.18, 0.00],
    [-0.66, 1.32, 0.00]
  ];
  const armLRadii = [0.148, 0.160, 0.174, 0.178, 0.146];
  const armLApex  = [-0.67, 1.44, 0.00];

  // 3) 오른쪽 팔 (살짝 더 높고 길게 우아하게 꺾여 올라가는 일체형 팔)
  const armRSpine = [
    [0.14, 0.72,  0.00],
    [0.46, 0.84, -0.01],
    [0.65, 1.05, -0.01],
    [0.75, 1.40,  0.00],
    [0.77, 1.56,  0.00]
  ];
  const armRRadii = [0.158, 0.172, 0.186, 0.192, 0.154];
  const armRApex  = [0.78, 1.70, 0.00];

  const geos = {
    stem: markCachedGeo(createSculptedCactusTubeGeo(mainSpine, mainRadii, mainApex, 8, s)),
    armL: markCachedGeo(createSculptedCactusTubeGeo(armLSpine, armLRadii, armLApex, 7, s + 1.1)),
    armR: markCachedGeo(createSculptedCactusTubeGeo(armRSpine, armRRadii, armRApex, 7, s + 2.2))
  };
  _sculptedCactusGeoCache[key] = geos;
  return geos;
}

window.addLowPolyCactusAndScrub = function (x, z, scale = 1.0) {
  const by = typeof getMiracleOpenWorldGroundHeight === 'function' ? getMiracleOpenWorldGroundHeight(x, z) : 0;
  const grp = new THREE.Group();
  const variantIdx = Math.abs(Math.round(x * 3 + z * 5)) % 3;
  const cactusCols = ['#5c8d36', '#62943a', '#538231'];
  const cCol = cactusCols[variantIdx];
  const geos = getSculptedCactusGeos(variantIdx);

  const stem = createLowPolyMesh(geos.stem, cCol, 0, 0, 0, true);
  const armL = createLowPolyMesh(geos.armL, cCol, 0, 0, 0, true);
  const armR = createLowPolyMesh(geos.armR, cCol, 0, 0, 0, true);

  grp.add(stem, armL, armR);
  grp.scale.set(scale, scale, scale);
  grp.rotation.y = ((Math.abs(x * 1.37 + z * 2.11)) % (Math.PI * 2));
  grp.position.set(x, by, z);
  worldGroup.add(grp);
  colliders.push({ minX: x - 0.52 * scale, maxX: x + 0.52 * scale, minZ: z - 0.52 * scale, maxZ: z + 0.52 * scale });
  return grp;
};
