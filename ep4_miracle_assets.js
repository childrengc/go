// =========================================================================
// [ep4_miracle_assets.js - 파트 1/2] 에피소드 4 전용 소프트 로우 폴리곤 에셋 & 태양 그림자 엔진
// 1. 실시간 태양 궤도 이동(Dynamic Sun) 및 전 객체(사람·동물·나무·건물) 그림자 시스템
// 2. 전면 개방형(Open-Front Arch) 다면체 후드·장발 구조 적용 — 얼굴 가림 및 살색 돌출 현상 완벽 해결
// =========================================================================

const _miracleDoubleSideMatCache = {};
function matLowPolyDouble(hexColor) {
  if (!_miracleDoubleSideMatCache[hexColor]) {
    _miracleDoubleSideMatCache[hexColor] = new THREE.MeshLambertMaterial({
      color: hexColor,
      flatShading: true,
      side: THREE.DoubleSide
    });
  }
  return _miracleDoubleSideMatCache[hexColor];
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

// -------------------------------------------------------------------------
// 1. 실시간 태양 이동 광원(Dynamic Sun) & 전 객체 그림자(Shadow) 시스템
// -------------------------------------------------------------------------
let miracleSunSystem = {
  light: null,
  lightTarget: null,
  sunVisualGroup: null,
  angle: 0.45
};

function setupMiracleDynamicSunAndShadows() {
  if (!scene || !renderer) return;

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

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

  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 2.0;
  dirLight.shadow.camera.far = 320.0;
  const d = 75;
  dirLight.shadow.camera.left = -d;
  dirLight.shadow.camera.right = d;
  dirLight.shadow.camera.top = d;
  dirLight.shadow.camera.bottom = -d;
  dirLight.shadow.bias = -0.0005;
  if (dirLight.shadow.normalBias !== undefined) {
    dirLight.shadow.normalBias = 0.02;
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

  if (worldGroup) {
    const sunGrp = new THREE.Group();
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const coronaMat = new THREE.MeshBasicMaterial({ color: 0xfde047, transparent: true, opacity: 0.40 });
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(7.0, 1), coreMat);
    const corona = new THREE.Mesh(new THREE.IcosahedronGeometry(10.0, 1), coronaMat);
    sunGrp.add(core, corona);
    worldGroup.add(sunGrp);
    miracleSunSystem.sunVisualGroup = sunGrp;
  }
}

function updateMiracleDynamicSun(dt, now) {
  if (!miracleSunSystem.light) {
    setupMiracleDynamicSunAndShadows();
  }
  const light = miracleSunSystem.light;
  if (!light) return;

  miracleSunSystem.angle += dt * 0.04;
  const azim = Math.sin(miracleSunSystem.angle) * 1.18;
  const elev = 0.76 + Math.cos(miracleSunSystem.angle * 2.0) * 0.22;

  const sunDist = 95.0;
  const offsetX = Math.sin(azim) * Math.cos(elev) * sunDist;
  const offsetY = Math.sin(elev) * sunDist;
  const offsetZ = Math.cos(azim) * Math.cos(elev) * sunDist * 0.75 + 20.0;

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
      focusX + offsetX * 2.2,
      focusY + offsetY * 2.2,
      focusZ + offsetZ * 2.2
    );
    miracleSunSystem.sunVisualGroup.rotation.y += dt * 0.35;
  }
}

// -------------------------------------------------------------------------
// 2. 인체 비례 의복 & 전면 개방형(Open-Front) 헤드/후드 빌더
// -------------------------------------------------------------------------

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

  const finalGeo = geo.toNonIndexed();
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

  const finalGeo = geo.toNonIndexed();
  finalGeo.computeVertexNormals();
  _anatomicalUpperTorsoGeo = finalGeo;
  return finalGeo;
}

// 2-3) 다면체 얼굴 본체 (후드 안쪽에 완전히 수납되면서 정면 얼굴은 평평하게 노출)
let _chamferedFaceGeo = null;
function getChamferedFaceGeo() {
  if (_chamferedFaceGeo) return _chamferedFaceGeo;

  // 가로 0.52(±0.26), 세로 0.50(±0.25), 깊이 0.42(-0.18 ~ +0.24)
  const w = 0.52, h = 0.50, d = 0.42;
  const geo = new THREE.BoxGeometry(w, h, d, 2, 2, 2);
  const pos = geo.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);

    // 턱 아래 모서리를 살짝 갸름하게 다듬음
    if (y < -0.20) {
      x *= 0.88;
      if (z > 0.15) z = 0.22;
    }
    // 정면 얼굴 평면(z = +0.22) 고정
    if (z > 0.18 && y >= -0.20) {
      z = 0.23;
    }
    // 뒤통수와 정수리 모서리는 안쪽으로 오므려 두건 밖 돌출 원천 방지
    if (z < -0.10) {
      x *= 0.82;
      y *= 0.85;
    }
    pos.setXYZ(i, x, y, z);
  }

  const finalGeo = geo.toNonIndexed();
  finalGeo.computeVertexNormals();
  _chamferedFaceGeo = finalGeo;
  return finalGeo;
}

// 2-4) [핵심 해결책] 얼굴 정면을 절대 가리지 않는 4분할 전면 개방형(Open-Front Arch) 다면체 후드 생성기
//      - 원통 정점을 당기지 않고, ① 상단 돔(y > 0.20) + ② 좌우 날개(|x| > 0.25) + ③ 뒷자락(z < -0.14)으로 분리 조립!
function createOpenFrontHoodGroup(hoodColor, isFemale = false, agal1 = null, agal2 = null, veilBand = null) {
  const hoodGrp = new THREE.Group();

  // ① 상단 돔 지붕 (얼굴 위쪽 y = +0.20 ~ +0.46 만 덮음 -> 눈과 이마를 절대 가리지 않음!)
  const topDomeGeo = new THREE.CylinderGeometry(0.28, 0.39, 0.24, 8, 1, false);
  topDomeGeo.scale(1.04, 1.0, 0.88);
  const topDome = createLowPolyMesh(topDomeGeo.toNonIndexed(), hoodColor, 0, 0.33, -0.02);
  hoodGrp.add(topDome);

  // 이마 위 전면 드리우기 챙 (y = +0.22, 얼굴 정면 위쪽 테두리만 깔끔하게 마감)
  const frontBrim = createLowPolyMesh(new THREE.BoxGeometry(0.62, 0.07, 0.16), hoodColor, 0, 0.22, 0.22);
  hoodGrp.add(frontBrim);

  // ② 좌·우 측면 두건 날개 (|x| = 0.25 ~ 0.39 구간에만 위치 -> 얼굴 중앙 x ∈ [-0.25, +0.25] 은 100% 뚫려 있음!)
  const sideWingGeo = new THREE.BoxGeometry(0.14, 0.62, 0.46, 1, 2, 2);
  const sPos = sideWingGeo.attributes.position;
  for (let i = 0; i < sPos.count; i++) {
    let sx = sPos.getX(i), sy = sPos.getY(i), sz = sPos.getZ(i);
    // 아래로 내려갈수록 살짝 넓어지다 맨 아래 끝단은 안쪽으로 접힘
    if (sy < -0.20) {
      sx *= 0.85;
      sz *= 0.90;
    } else if (sy < 0.05) {
      sx *= 1.08;
    }
    sPos.setXYZ(i, sx, sy, sz);
  }
  const finalSideGeo = sideWingGeo.toNonIndexed();
  finalSideGeo.computeVertexNormals();

  const wingL = createLowPolyMesh(finalSideGeo, hoodColor, -0.31, -0.06, 0.01);
  wingL.rotation.z = 0.08;
  const wingR = createLowPolyMesh(finalSideGeo, hoodColor,  0.31, -0.06, 0.01);
  wingR.rotation.z = -0.08;
  hoodGrp.add(wingL, wingR);

  // ③ 후면 두건 뒷자락 (얼굴 뒤쪽 z = -0.14 ~ -0.32 만 감싸는 다면체 뒷벽)
  const backGeo = new THREE.BoxGeometry(0.72, 0.62, 0.18, 3, 2, 1);
  const bPos = backGeo.attributes.position;
  for (let i = 0; i < bPos.count; i++) {
    let bx = bPos.getX(i), by = bPos.getY(i), bz = bPos.getZ(i);
    // 뒷모습 중앙은 볼록하고 양옆과 하단은 다면체로 깎인 형태 (타깃 이미지 우측 뒷모습 완벽 재현)
    if (Math.abs(bx) > 0.25) {
      bz += 0.04;
      bx *= 0.94;
    }
    if (by < -0.20) {
      bx *= 0.86;
      bz += 0.05;
    }
    bPos.setXYZ(i, bx, by, bz);
  }
  const finalBackGeo = backGeo.toNonIndexed();
  finalBackGeo.computeVertexNormals();
  const backCurtain = createLowPolyMesh(finalBackGeo, hoodColor, 0, -0.06, -0.22);
  hoodGrp.add(backCurtain);

  // ④ 여성 전용: 턱 아래(y = -0.32)로 좌우 베일을 매끄럽게 이어주는 단일 턱 스카프
  if (isFemale) {
    const chinScarf = createLowPolyMesh(new THREE.BoxGeometry(0.62, 0.11, 0.28), hoodColor, 0, -0.31, 0.10);
    const chinVPoint = createLowPolyMesh(new THREE.ConeGeometry(0.22, 0.14, 4), hoodColor, 0, -0.40, 0.17);
    chinVPoint.rotation.x = Math.PI;
    chinVPoint.rotation.y = Math.PI / 4;
    chinVPoint.scale.set(1.15, 1.0, 0.45);
    hoodGrp.add(chinScarf, chinVPoint);

    if (veilBand) {
      const vBand = createLowPolyMesh(new THREE.CylinderGeometry(0.39, 0.40, 0.048, 8), veilBand, 0, 0.26, -0.02);
      vBand.scale.set(1.04, 1.0, 0.88);
      hoodGrp.add(vBand);
    }
  } else {
    // 남성 전용: 상단 돔 둘레를 감싸는 베이지 머리끈(Agal)
    if (agal1) {
      const agalUpper = createLowPolyMesh(new THREE.CylinderGeometry(0.395, 0.405, 0.055, 8), agal1, 0, 0.29, -0.02);
      agalUpper.scale.set(1.04, 1.0, 0.88);
      hoodGrp.add(agalUpper);
    }
    if (agal2) {
      const agalLower = createLowPolyMesh(new THREE.CylinderGeometry(0.405, 0.415, 0.052, 8), agal2, 0, 0.23, -0.02);
      agalLower.scale.set(1.04, 1.0, 0.88);
      hoodGrp.add(agalLower);
    }
  }

  return hoodGrp;
}

// -------------------------------------------------------------------------
// 3. [예수님 캐릭터 전용 오픈-프론트 5:5 장발 & 대각선 붉은 숄]
//    - 예수님의 머리카락도 얼굴 정면 창을 절대 침범하지 않는 4분할 다면체 구조로 조립!
// -------------------------------------------------------------------------
function createJesusFacetedHairGroup(hairHex = '#4e2f1e') {
  const hairGrp = new THREE.Group();

  // 1) 정수리 5:5 가르마 볼륨 (좌·우 다면체 윗머리 2조각 -> 가운데 가르마 골 표현)
  const topCrownL = createLowPolyMesh(new THREE.BoxGeometry(0.34, 0.18, 0.56), hairHex, -0.16, 0.30, -0.01);
  topCrownL.rotation.z = 0.12;
  const topCrownR = createLowPolyMesh(new THREE.BoxGeometry(0.34, 0.18, 0.56), hairHex,  0.16, 0.30, -0.01);
  topCrownR.rotation.z = -0.12;

  // 2) 이마 양옆으로 갈라지는 5:5 앞머리 (y = +0.22 이상에만 위치하여 눈·눈썹을 절대 가리지 않음)
  const bangL = createLowPolyMesh(new THREE.BoxGeometry(0.24, 0.10, 0.12), hairHex, -0.15, 0.22, 0.24);
  bangL.rotation.z = 0.28;
  const bangR = createLowPolyMesh(new THREE.BoxGeometry(0.24, 0.10, 0.12), hairHex,  0.15, 0.22, 0.24);
  bangR.rotation.z = -0.28;

  // 3) 얼굴 양옆 바깥(|x| = 0.26 ~ 0.38)으로 물결치며 내려오는 3단 웨이브 옆머리
  const wave1L = createLowPolyMesh(new THREE.BoxGeometry(0.13, 0.26, 0.24), hairHex, -0.31, 0.10, 0.14);
  wave1L.rotation.z = 0.10;
  const wave1R = createLowPolyMesh(new THREE.BoxGeometry(0.13, 0.26, 0.24), hairHex,  0.31, 0.10, 0.14);
  wave1R.rotation.z = -0.10;

  const wave2L = createLowPolyMesh(new THREE.BoxGeometry(0.14, 0.26, 0.24), hairHex, -0.33, -0.12, 0.12);
  wave2L.rotation.z = -0.08;
  const wave2R = createLowPolyMesh(new THREE.BoxGeometry(0.14, 0.26, 0.24), hairHex,  0.33, -0.12, 0.12);
  wave2R.rotation.z =  0.08;

  const wave3L = createLowPolyMesh(new THREE.ConeGeometry(0.11, 0.22, 5), hairHex, -0.31, -0.32, 0.12);
  wave3L.rotation.x = Math.PI;
  const wave3R = createLowPolyMesh(new THREE.ConeGeometry(0.11, 0.22, 5), hairHex,  0.31, -0.32, 0.12);
  wave3R.rotation.x = Math.PI;

  // 4) 뒷모습 다면체 장발 뒷머리 (z = -0.14 ~ -0.32 구간에서 뒤통수와 목 뒤를 풍성하게 덮음)
  const backHairGeo = new THREE.BoxGeometry(0.72, 0.68, 0.18, 3, 2, 1);
  const bPos = backHairGeo.attributes.position;
  for (let i = 0; i < bPos.count; i++) {
    let bx = bPos.getX(i), by = bPos.getY(i), bz = bPos.getZ(i);
    if (Math.abs(bx) > 0.25) bz += 0.04;
    if (by < -0.25) {
      bx *= 0.88;
      bz += 0.04;
    }
    bPos.setXYZ(i, bx, by, bz);
  }
  const finalBackHairGeo = backHairGeo.toNonIndexed();
  finalBackHairGeo.computeVertexNormals();
  const backHairMesh = createLowPolyMesh(finalBackHairGeo, hairHex, 0, -0.04, -0.21);

  hairGrp.add(topCrownL, topCrownR, bangL, bangR, wave1L, wave1R, wave2L, wave2R, wave3L, wave3R, backHairMesh);
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
    headcloth: '#e6dec8', agal1: '#854d0e', agal2: '#5c3418',
    belt: '#926c44', beltSub: '#785230',
    hair: '#2b1d12', skin: '#e8c3a5', sandal: '#3b2212',
    beardStyle: 'trimmed', headwear: 'sudra_double'
  },
  {
    robe: '#3f5166', sleeve: '#3f5166', shawl: '#f4efe6',
    stripe1: '#d97706', stripe2: '#4c1d95',
    headcloth: '#f4efe6', agal1: '#a16207', agal2: '#713f12',
    belt: '#b48a58', beltSub: '#8c663b',
    hair: '#1e1b18', skin: '#f0cfb4', sandal: '#29180e',
    beardStyle: 'short', headwear: 'sudra_single'
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
  const g = new THREE.Group();

  // [A] 예수님 전용 모델링 (5:5 장발 + 밝은 주름 로브 + 대각선 붉은 숄)
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
    const neck = createLowPolyMesh(new THREE.CylinderGeometry(0.09, 0.105, 0.18, 6), skinCol, 0, 1.56, 0, false);

    const beltGrp = createEllipticalDoubleRopeBelt(beltCol, '#826b54', false);
    const redSashGrp = createJesusDiagonalRedSashGroup(sashCol, foldCol);

    const lArm = createJesusBellSleeveArm(true, robeCol, '#d8d5d0', skinCol);
    const rArm = createJesusBellSleeveArm(false, robeCol, '#d8d5d0', skinCol);

    const head = new THREE.Group();
    head.position.set(0, 2.02, 0);

    const faceMesh = createLowPolyMesh(getChamferedFaceGeo(), skinCol, 0, 0, 0);
    const eyeCol = '#1e1815';
    const eyeL = createLowPolyMesh(new THREE.BoxGeometry(0.068, 0.13, 0.025), eyeCol, -0.115, 0.03, 0.238, false);
    const eyeR = createLowPolyMesh(new THREE.BoxGeometry(0.068, 0.13, 0.025), eyeCol,  0.115, 0.03, 0.238, false);

    const browL = createLowPolyMesh(new THREE.BoxGeometry(0.115, 0.034, 0.025), hairCol, -0.115, 0.135, 0.240, false);
    browL.rotation.z = 0.06;
    const browR = createLowPolyMesh(new THREE.BoxGeometry(0.115, 0.034, 0.025), hairCol,  0.115, 0.135, 0.240, false);
    browR.rotation.z = -0.06;

    const nose = createLowPolyMesh(new THREE.ConeGeometry(0.042, 0.115, 3), skinCol, 0, -0.01, 0.255, false);
    nose.rotation.y = Math.PI;
    const smileMouth = createLowPolyMesh(new THREE.BoxGeometry(0.095, 0.030, 0.025), '#b57c68', 0, -0.145, 0.242, false);

    // 턱선을 감싸는 다면체 갈색 수염과 콧수염
    const chinBeard = createLowPolyMesh(new THREE.BoxGeometry(0.52, 0.14, 0.26), beardCol, 0, -0.24, 0.14);
    const chinPoint = createLowPolyMesh(new THREE.ConeGeometry(0.15, 0.10, 4), beardCol, 0, -0.32, 0.18);
    chinPoint.rotation.x = Math.PI;
    chinPoint.rotation.y = Math.PI / 4;
    chinPoint.scale.set(1.1, 1.0, 0.65);

    const sideBeardL = createLowPolyMesh(new THREE.BoxGeometry(0.065, 0.30, 0.12), beardCol, -0.235, -0.04, 0.19);
    const sideBeardR = createLowPolyMesh(new THREE.BoxGeometry(0.065, 0.30, 0.12), beardCol,  0.235, -0.04, 0.19);
    const stacheTop  = createLowPolyMesh(new THREE.BoxGeometry(0.22, 0.040, 0.030), beardCol, 0, -0.095, 0.245, false);
    const stacheL    = createLowPolyMesh(new THREE.BoxGeometry(0.045, 0.11, 0.030), beardCol, -0.10, -0.145, 0.245, false);
    stacheL.rotation.z = 0.16;
    const stacheR    = createLowPolyMesh(new THREE.BoxGeometry(0.045, 0.11, 0.030), beardCol,  0.10, -0.145, 0.245, false);
    stacheR.rotation.z = -0.16;

    const hairGroup = createJesusFacetedHairGroup(hairCol);

    head.add(
      faceMesh, eyeL, eyeR, browL, browR, nose, smileMouth,
      chinBeard, chinPoint, sideBeardL, sideBeardR, stacheTop, stacheL, stacheR,
      hairGroup
    );

    g.add(lLeg, rLeg, skirtMesh, bodiceMesh, collarYoke, neck, beltGrp, redSashGrp, lArm, rArm, head);
    g.scale.set(1.05, 1.05, 1.05);
    g.traverse(ch => {
      if (ch.isMesh && ch.material && !ch.material.transparent) {
        ch.castShadow = true;
        ch.receiveShadow = true;
      }
    });
    g.userData = { lLeg, rLeg, lArm, rArm, head, walkPhase: 0 };
    return g;
  }

  // [B] 일반 인물 (남성 3종 · 여성 3종 · 주인공 · 삭개오 · 아이 · 병사 · 천사)
  let isFemale = false;
  let cfg = null;
  let sc = 1.0;

  if (preset === 'woman' || preset === 'female_0' || preset === 'female_1' || preset === 'female_2') {
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
      beardStyle: 'trimmed', headwear: 'sudra_double'
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
      headcloth: '#ffffff', agal1: '#fde047', agal2: '#facc15',
      beardStyle: 'none', headwear: 'sudra_single', hasHalo: true, hasWings: true
    };
    sc = 1.05;
  } else {
    isFemale = false;
    cfg = { ...ISRAELITE_MALE_VARIANTS[idx % 3] };
  }

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
  const neck       = createLowPolyMesh(new THREE.CylinderGeometry(0.09, 0.105, 0.18, 6), cfg.skin, 0, 1.56, 0, false);

  g.add(lLeg, rLeg, skirtMesh, bodiceMesh, neck);

  const mantleGroup = createCleanIsraeliteMantleGroup(cfg.shawl, cfg.stripe1, cfg.stripe2, isFemale);
  const beltGroup   = createEllipticalDoubleRopeBelt(cfg.belt, cfg.beltSub, true);
  g.add(mantleGroup, beltGroup);

  const lArm = createSeamlessPonchoArm(true, cfg.shawl, cfg.stripe1, cfg.stripe2, cfg.sleeve, cfg.skin);
  const rArm = createSeamlessPonchoArm(false, cfg.shawl, cfg.stripe1, cfg.stripe2, cfg.sleeve, cfg.skin);
  g.add(lArm, rArm);

  // 머리(Head) : 전면 개방형 아치 후드 적용으로 얼굴 가림/깨짐 100% 해결!
  const head = new THREE.Group();
  head.position.set(0, 2.02, 0);

  const faceMesh = createLowPolyMesh(getChamferedFaceGeo(), cfg.skin, 0, 0, 0);
  const eyeCol = '#1e1815';
  const eyeL = createLowPolyMesh(new THREE.BoxGeometry(0.068, 0.13, 0.025), eyeCol, -0.115, 0.03, 0.238, false);
  const eyeR = createLowPolyMesh(new THREE.BoxGeometry(0.068, 0.13, 0.025), eyeCol,  0.115, 0.03, 0.238, false);

  const browL = createLowPolyMesh(new THREE.BoxGeometry(0.115, 0.034, 0.025), cfg.hair, -0.115, 0.135, 0.240, false);
  browL.rotation.z = 0.06;
  const browR = createLowPolyMesh(new THREE.BoxGeometry(0.115, 0.034, 0.025), cfg.hair,  0.115, 0.135, 0.240, false);
  browR.rotation.z = -0.06;

  const nose = createLowPolyMesh(new THREE.ConeGeometry(0.042, 0.115, 3), cfg.skin, 0, -0.01, 0.255, false);
  nose.rotation.y = Math.PI;
  const smileMouth = createLowPolyMesh(new THREE.BoxGeometry(0.095, 0.030, 0.025), '#b57c68', 0, -0.145, 0.242, false);

  head.add(faceMesh, eyeL, eyeR, browL, browR, nose, smileMouth);

  const hoodColor = isFemale ? cfg.veil : cfg.headcloth;
  if (cfg.headwear === 'helmet') {
    const helm = createLowPolyMesh(new THREE.DodecahedronGeometry(0.42, 0), '#64748b', 0, 0.18, -0.02);
    helm.scale.set(1.06, 0.85, 1.06);
    const crest = createLowPolyMesh(new THREE.BoxGeometry(0.13, 0.26, 0.56), '#dc2626', 0, 0.44, -0.02);
    head.add(helm, crest);
  } else {
    const openHood = createOpenFrontHoodGroup(
      hoodColor,
      isFemale,
      cfg.agal1,
      cfg.headwear === 'sudra_double' ? cfg.agal2 : null,
      cfg.veilBand
    );
    head.add(openHood);
  }

  if (isFemale) {
    // 여성 5:5 가르마 앞머리 (z = +0.242 로 얼굴면 위에 깔끔히 배치)
    const partedHairL = createLowPolyMesh(new THREE.BoxGeometry(0.20, 0.08, 0.04), cfg.hair, -0.11, 0.185, 0.242, false);
    partedHairL.rotation.z = 0.28;
    const partedHairR = createLowPolyMesh(new THREE.BoxGeometry(0.20, 0.08, 0.04), cfg.hair,  0.11, 0.185, 0.242, false);
    partedHairR.rotation.z = -0.28;
    const sideHairL   = createLowPolyMesh(new THREE.BoxGeometry(0.045, 0.34, 0.06), cfg.hair, -0.23, 0.01, 0.238, false);
    const sideHairR   = createLowPolyMesh(new THREE.BoxGeometry(0.045, 0.34, 0.06), cfg.hair,  0.23, 0.01, 0.238, false);
    head.add(partedHairL, partedHairR, sideHairL, sideHairR);
  } else {
    // 남성 앞머리 두 가닥 & 턱수염
    const bang1 = createLowPolyMesh(new THREE.BoxGeometry(0.11, 0.045, 0.03), cfg.hair, -0.09, 0.18, 0.242, false);
    bang1.rotation.z = 0.25;
    const bang2 = createLowPolyMesh(new THREE.BoxGeometry(0.08, 0.040, 0.03), cfg.hair, -0.01, 0.185, 0.242, false);
    bang2.rotation.z = 0.18;
    head.add(bang1, bang2);

    if (cfg.beardStyle && cfg.beardStyle !== 'none') {
      const bHeight = (cfg.beardStyle === 'full') ? 0.15 : 0.12;
      const chinBeard  = createLowPolyMesh(new THREE.BoxGeometry(0.50, bHeight, 0.24), cfg.hair, 0, -0.24, 0.14);
      const sideBeardL = createLowPolyMesh(new THREE.BoxGeometry(0.06, 0.30, 0.10), cfg.hair, -0.23, -0.04, 0.20);
      const sideBeardR = createLowPolyMesh(new THREE.BoxGeometry(0.06, 0.30, 0.10), cfg.hair,  0.23, -0.04, 0.20);
      const stacheTop  = createLowPolyMesh(new THREE.BoxGeometry(0.21, 0.038, 0.03), cfg.hair, 0, -0.095, 0.245, false);
      const stacheL    = createLowPolyMesh(new THREE.BoxGeometry(0.042, 0.10, 0.03), cfg.hair, -0.095, -0.145, 0.245, false);
      stacheL.rotation.z = 0.15;
      const stacheR    = createLowPolyMesh(new THREE.BoxGeometry(0.042, 0.10, 0.03), cfg.hair,  0.095, -0.145, 0.245, false);
      stacheR.rotation.z = -0.15;
      head.add(chinBeard, sideBeardL, sideBeardR, stacheTop, stacheL, stacheR);
    }
  }

  if (cfg.hasHalo) {
    const haloRing = new THREE.Mesh(
      new THREE.RingGeometry(0.50, 0.65, 16),
      new THREE.MeshBasicMaterial({ color: 0xfef08a, side: THREE.DoubleSide, transparent: true, opacity: 0.80 })
    );
    haloRing.position.set(0, 0.14, -0.34);
    head.add(haloRing);
  }
  if (cfg.hasWings) {
    const wingL = createLowPolyMesh(new THREE.ConeGeometry(0.36, 1.25, 4), '#fef9c3', -0.44, 1.38, -0.32, false);
    wingL.rotation.z =  0.68;
    wingL.scale.set(0.45, 1.0, 1.0);
    const wingR = createLowPolyMesh(new THREE.ConeGeometry(0.36, 1.25, 4), '#fef9c3',  0.44, 1.38, -0.32, false);
    wingR.rotation.z = -0.68;
    wingR.scale.set(0.45, 1.0, 1.0);
    g.add(wingL, wingR);
  }

  g.add(head);
  g.scale.set(sc, sc, sc);

  g.traverse(ch => {
    if (ch.isMesh && ch.material && !ch.material.transparent) {
      ch.castShadow = true;
      ch.receiveShadow = true;
    }
  });

  g.userData = { lLeg, rLeg, lArm, rArm, head, walkPhase: idx * 0.9 };
  return g;
};

// 플레이어 캐릭터 생성기 (남성 디자인 + 오른손 지팡이 제거)
window.createMiracleHeroMesh = function () {
  const g = window.createLowPolyPersonMesh('hero', 0);
  const u = g.userData;

  const toolGrp = new THREE.Group();
  const bucketGeo = new THREE.CylinderGeometry(0.20, 0.15, 0.24, 7);
  toolGrp.add(createLowPolyMesh(bucketGeo, '#d97706', 0, -0.66, 0.22, false));
  toolGrp.visible = false;
  u.lArm.add(toolGrp);

  carriedBlockGroup = new THREE.Group();
  carriedBlockGroup.position.set(0, 1.22, -0.36);
  g.add(carriedBlockGroup);

  playerLimbs = {
    lLeg: u.lLeg,
    rLeg: u.rLeg,
    lArm: u.lArm,
    rArm: u.rArm,
    axeTool: toolGrp
  };
  return g;
};
// =========================================================================
// [ep4_miracle_assets.js - 파트 2/2]
// 4. 확장된 오픈월드 지형 고도 계산기 (침수 방지 + 서쪽 완만한 바다 경사 + 외곽 오병이어 전망 언덕)
// 5. 낮고 울퉁불퉁한 외곽 언덕(Bumpy Hills) + 소프트 로우폴리 동물(사슴·양·나귀·물고기)·나무·야생화
// =========================================================================

// 기존(118)보다 훨씬 넓어진 오픈월드 반경 상수 (총 304 x 304 규모)
window.MIRACLE_EXP_LIMIT = 152;

// -------------------------------------------------------------------------
// 4. [지형 고도 계산기 오버라이드]
//    - 서쪽 해안선을 x = -92 로 이동하여 골고다 언덕(-66, 78) 등 내륙 지형 침수 완벽 해결
//    - 동북쪽 맵 바깥 근처(x = 88, z = -82)에 마을 전체가 내려다보이는 높은 오병이어 언덕(높이 14.5) 생성
//    - 북·동·남 가장자리는 낮고 완만한 구릉 능선으로 처리
// -------------------------------------------------------------------------
window.getMiracleOpenWorldGroundHeight = function (x, z) {
  let h = 0.25; // 기본 내륙 지면 고도를 수면(-0.35)보다 높은 +0.25로 유지해 내륙 침수 원천 방지

  // 1) 서쪽(West, x < -72): 모래사장 없이 초원에서 넓은 바다(x < -92)까지 완만하게 내려가는 해안 경사
  const shoreLineX = -92 + Math.sin(z * 0.03) * 6.0 + Math.cos(z * 0.07) * 2.5;
  if (x < shoreLineX + 22) {
    const t = Math.max(0, (shoreLineX + 22 - x) / 22);
    const smoothSlope = t * t * (3 - Math.min(2.0, 2 * t));
    h = 0.25 - smoothSlope * 0.65; // 해안선(shoreLineX)에서 정확히 수면(-0.40)과 만남
    if (x < shoreLineX) {
      h -= (shoreLineX - x) * 0.08;
    }
    return Number(h.toFixed(3));
  }

  // 2) [핵심 요청사항] 맵 동북쪽 바깥 근처의 웅장한 '오병이어 전망 언덕' (중심: x = 88, z = -82, 반경 46, 정상 높이 +14.5)
  //    - 완만한 S자 경사로 걸어 올라갈 수 있으며, 정상에서 마을과 갈릴리 바다가 한눈에 내려다보임
  const bethDist = Math.hypot((x - 88) / 46, (z - (-82)) / 42);
  if (bethDist < 1.0) {
    const t = 1.0 - bethDist;
    const bump = Math.sin(x * 0.14) * Math.cos(z * 0.14) * 0.45;
    h += t * t * (3 - 2 * t) * 14.2 + t * bump;
  }

  // 3) 잃어버린 양의 유대 광야 바위 언덕 (서중부 내륙: x = -66, z = 12 — 침수 없이 높이 +5.6 유지)
  const wildDist = Math.hypot((x - (-66)) / 24, (z - 12) / 24);
  if (wildDist < 1.0) {
    const t = 1.0 - wildDist;
    const bump = Math.sin(x * 0.20 + 1.1) * Math.cos(z * 0.20) * 0.38;
    h += t * t * (3 - 2 * t) * 5.6 + t * bump;
  }

  // 4) 골고다 십자가 언덕 (남서쪽 내륙: x = -66, z = 78 — 침수 없이 높이 +8.4 유지)
  const golgothaDist = Math.hypot((x - (-66)) / 26, (z - 78) / 24);
  if (golgothaDist < 1.0) {
    const t = 1.0 - golgothaDist;
    const bump = Math.sin(x * 0.18) * Math.cos(z * 0.18) * 0.42;
    h += t * t * (3 - 2 * t) * 8.4 + t * bump;
  }

  // 5) 감람산 승천 언덕 (남동쪽 외곽: x = 88, z = 74, 높이 +9.6)
  const oliveDist = Math.hypot((x - 88) / 32, (z - 74) / 30);
  if (oliveDist < 1.0) {
    const t = 1.0 - oliveDist;
    const bump = Math.sin(x * 0.16) * Math.cos(z * 0.16) * 0.40;
    h += t * t * (3 - 2 * t) * 9.6 + t * bump;
  }

  // 6) 북·동·남 3면 가장자리 낮은 구릉 융기 (기존보다 낮고 부드럽게 처리)
  const eastEdge = Math.max(0, (x - 122) / 30);
  const northEdge = Math.max(0, (-122 - z) / 30);
  const southEdge = Math.max(0, (z - 122) / 30);
  const edgeFactor = Math.max(eastEdge, northEdge, southEdge);
  if (edgeFactor > 0) {
    const edgeBump = Math.sin(x * 0.10) * Math.cos(z * 0.10) * 0.85;
    h += edgeFactor * edgeFactor * 4.2 + edgeFactor * edgeBump;
  }

  // 7) 마을 도로 주변은 평탄하게, 초원은 부드러운 구릉 기복 유지
  const centerRoadClearance = Math.min(1.0, Math.abs(x - Math.sin(z * 0.03) * 6.0) / 15.0);
  const gentleWave = (Math.sin(x * 0.045) * Math.cos(z * 0.045) * 0.42) * centerRoadClearance;
  h += gentleWave;

  return Number(h.toFixed(3));
};

window.getMiracleGroundHeight = function (x, z, st) {
  if (miracleSubMode === 'openworld' || miracleSubMode === 'ascension') {
    return window.getMiracleOpenWorldGroundHeight(x, z);
  }
  if (miracleSubMode === 'main2_loaves') {
    const hillT = Math.max(0, Math.min(1, (28 - z) / 64));
    return hillT * hillT * (3 - 2 * hillT) * 7.5;
  }
  if (miracleSubMode === 'main3_cross') {
    if (z <= -10) {
      const climbT = Math.max(0, Math.min(1, (-10 - z) / 52));
      return climbT * 9.2;
    }
    return 0;
  }
  if (miracleSubMode === 'minigame' && miracleActiveMinigameId === 'par_sheep') {
    return Math.sin(x * 0.09) * Math.cos(z * 0.09) * 1.6 + Math.max(0, (18 - z) * 0.12);
  }
  return 0;
};

// -------------------------------------------------------------------------
// 5. [가장자리 낮은 울퉁불퉁 다면체 언덕(Low Bumpy Hill) 생성기]
//    - 뾰족하고 높은 산 대신, 낮고 둥글납작하면서 표면이 울퉁불퉁한 로우폴리 언덕을 겹쳐 배치
// -------------------------------------------------------------------------
function createBumpyLowPolyHillMesh(x, z, radiusX = 24, height = 7.5, radiusZ = 22, colorHex = '#84a955', seed = 0, addCollider = true) {
  const by = window.getMiracleOpenWorldGroundHeight(x, z);
  const geo = new THREE.IcosahedronGeometry(1.0, 2);
  const pos = geo.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    let vx = pos.getX(i);
    let vy = pos.getY(i);
    let vz = pos.getZ(i);

    if (vy < -0.05) {
      vy = -0.25;
      vx *= 1.12;
      vz *= 1.12;
    } else {
      // 꼭대기를 완만하게 눌러 낮추고 표면에 울퉁불퉁한 다면체 굴곡 부여
      const domeY = Math.pow(vy, 0.78) * 0.82;
      const n1 = Math.sin(vx * 3.6 + seed * 1.7) * Math.cos(vz * 3.4 - seed * 1.3) * 0.15;
      const n2 = Math.cos(vx * 5.8 - vz * 5.2 + seed) * 0.08;
      vy = Math.max(0.10, domeY + n1 + n2);
      vx *= (1.0 + n1 * 0.40);
      vz *= (1.0 - n1 * 0.30 + n2 * 0.30);
    }

    pos.setXYZ(i, vx * radiusX, vy * height, vz * radiusZ);
  }

  const finalGeo = geo.toNonIndexed();
  finalGeo.computeVertexNormals();

  const mesh = createLowPolyMesh(finalGeo, colorHex, x, by - 0.4, z, true);
  worldGroup.add(mesh);

  if (addCollider) {
    colliders.push({
      minX: x - radiusX * 0.76,
      maxX: x + radiusX * 0.76,
      minZ: z - radiusZ * 0.76,
      maxZ: z + radiusZ * 0.76
    });
  }
  return mesh;
}

// -------------------------------------------------------------------------
// 6. 사각·원통형을 배제한 소프트 로우 폴리곤 동물(사슴·양·나귀·물고기) & 다중 가지 나무·야생화
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
  const by = window.getMiracleOpenWorldGroundHeight(x, z);
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
  const by = getBaseGroundHeight(x, z);
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

  const by = getBaseGroundHeight(x, z);
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
  const by = getBaseGroundHeight(x, z);
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
  const by = getBaseGroundHeight(x, z);
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
