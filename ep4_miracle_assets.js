// =========================================================================
// [ep4_miracle_assets.js - 파트 1/3] 에피소드 4 전용 소프트 로우 폴리곤 에셋 & 태양 그림자 엔진
// 1. 실시간 태양 궤도 이동(Dynamic Sun), 태양 플레어 효과 및 그림자 시스템
// 2. 하늘을 나는 작은 새 모델링 추가
// 3. 인체 비례 의복 & 전면 개방형(Open-Front Arch) 다면체 후드·장발 구조
// =========================================================================

window.__GAME_BUILD_VERSIONS__ = window.__GAME_BUILD_VERSIONS__ || {};
window.__GAME_BUILD_VERSIONS__.ep4_assets = '20261125_v48';

const _miracleDoubleSideMatCache = {};
function matLowPolyDouble(hexColor) {
  if (!_miracleDoubleSideMatCache[hexColor]) {
    const m = new THREE.MeshPhongMaterial({
      color: hexColor,
      flatShading: true,
      shininess: 0,
      specular: 0x000000,
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
// 1. [낮 6 : 밤 4 순환 + 모바일 최적화] 에피소드 4 낮/밤 순환, 해·달 궤도, 별·유성, 점광원 풀 시스템
//    - FULL_DAY_SECONDS: 1일 전체 길이(초) / DAY_RATIO: 0.60 (낮 60% : 밤 40%)
// -------------------------------------------------------------------------
const EP4_DAY_NIGHT_CONFIG = {
  FULL_DAY_SECONDS: 1800,           // 30분(1,800초) 전체 1일 순환
  DAY_END: 20 / 30,                 // 0.0000 ~ 0.6667 (20분 낮)
  SUNSET_END: 22 / 30,              // 0.6667 ~ 0.7333 (2분 일몰)
  NIGHT_END: 28 / 30,               // 0.7333 ~ 0.9333 (6분 밤)
  SUNRISE_END: 1.0,                 // 0.9333 ~ 1.0000 (2분 일출)
  DAY_RATIO: 20 / 30,
  INITIAL_TIME: 0.28,
  SPEED_PRESETS: [1, 2, 4],
  STAR_COUNT_DESKTOP: 3400,
  STAR_COUNT_MOBILE: 1700,
  METEOR_COUNT: 6,
  SKY_DOME_RADIUS: 650,
  STAR_RADIUS_MIN: 560,
  STAR_RADIUS_MAX: 625,
  POINT_LIGHT_POOL_DESKTOP: 6,
  POINT_LIGHT_POOL_MOBILE: 4,
  POINT_SHADOW_POOL_DESKTOP: 2,
  POINT_SHADOW_POOL_MOBILE: 1,
  POINT_SHADOW_MAP_DESKTOP: 512,
  POINT_SHADOW_MAP_MOBILE: 256
};
window.EP4_DAY_NIGHT_CONFIG = EP4_DAY_NIGHT_CONFIG;

// 20분(낮) -> 2분(일몰) -> 6분(밤) -> 2분(일출) 하늘·안개·구름 색상 키프레임
const EP4_SKY_KEYFRAMES = [
  { t: 0.0000, bg: new THREE.Color('#7dd3fc'), fog: new THREE.Color('#bae6fd'), cloud: new THREE.Color('#ffffff') },
  { t: 0.6350, bg: new THREE.Color('#7dd3fc'), fog: new THREE.Color('#bae6fd'), cloud: new THREE.Color('#ffffff') },
  { t: 0.6667, bg: new THREE.Color('#f59e0b'), fog: new THREE.Color('#fed7aa'), cloud: new THREE.Color('#ffedd5') },
  { t: 0.7000, bg: new THREE.Color('#dc531e'), fog: new THREE.Color('#fb923c'), cloud: new THREE.Color('#fdba74') },
  { t: 0.7333, bg: new THREE.Color('#0d1c42'), fog: new THREE.Color('#1b325c'), cloud: new THREE.Color('#5c77a6') },
  { t: 0.7600, bg: new THREE.Color('#081432'), fog: new THREE.Color('#1a315e'), cloud: new THREE.Color('#6987b8') },
  { t: 0.9050, bg: new THREE.Color('#081432'), fog: new THREE.Color('#1a315e'), cloud: new THREE.Color('#6987b8') },
  { t: 0.9333, bg: new THREE.Color('#1c2a56'), fog: new THREE.Color('#4a3c66'), cloud: new THREE.Color('#7b93b8') },
  { t: 0.9667, bg: new THREE.Color('#f97316'), fog: new THREE.Color('#fdba74'), cloud: new THREE.Color('#fed7aa') },
  { t: 1.0000, bg: new THREE.Color('#7dd3fc'), fog: new THREE.Color('#bae6fd'), cloud: new THREE.Color('#ffffff') }
];

const _dnColorTmpA = new THREE.Color();
const _dnColorTmpB = new THREE.Color();
const _dnColorTmpC = new THREE.Color();
const _dnStormBgCol = new THREE.Color('#060c1f');
const _dnStormFogCol = new THREE.Color('#0f1a36');
const _dnStormCloudCol = new THREE.Color('#334155');
const _dnMeteorDir = new THREE.Vector3();
const _dnMeteorQuat = new THREE.Quaternion();
const _dnZAxis = new THREE.Vector3(0, 0, 1);
const _dnLightDirVec = new THREE.Vector3();
const _dnCamFwdVec = new THREE.Vector3();
const _dnWarmFillTint = new THREE.Color('#ffd59e');
const _dnMoonWarmCol = new THREE.Color('#ffe4b5');
const _dnMoonCoolCol = new THREE.Color('#ffffff');
const _dnCullBoxTmp = new THREE.Box3();
const _dnCullCenterTmp = new THREE.Vector3();
const _dnCullSizeTmp = new THREE.Vector3();

function ep4Smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0 || 1e-6)));
  return t * t * (3 - 2 * t);
}

function sampleEp4SkyGradient(t, outBg, outFog, outCloud) {
  const ct = ((t % 1) + 1) % 1;
  for (let i = 0; i < EP4_SKY_KEYFRAMES.length - 1; i++) {
    const k0 = EP4_SKY_KEYFRAMES[i];
    const k1 = EP4_SKY_KEYFRAMES[i + 1];
    if (ct >= k0.t && ct <= k1.t) {
      const a = (ct - k0.t) / Math.max(1e-6, k1.t - k0.t);
      outBg.copy(k0.bg).lerp(k1.bg, a);
      outFog.copy(k0.fog).lerp(k1.fog, a);
      if (outCloud) outCloud.copy(k0.cloud).lerp(k1.cloud, a);
      return;
    }
  }
  outBg.copy(EP4_SKY_KEYFRAMES[0].bg);
  outFog.copy(EP4_SKY_KEYFRAMES[0].fog);
  if (outCloud) outCloud.copy(EP4_SKY_KEYFRAMES[0].cloud);
}

function computeEp4TimeFactors(t) {
  const ct = ((t % 1) + 1) % 1;
  const dayEnd = EP4_DAY_NIGHT_CONFIG.DAY_END;       // 20/30 = 0.6667
  const sunsetEnd = EP4_DAY_NIGHT_CONFIG.SUNSET_END; // 22/30 = 0.7333
  const nightEnd = EP4_DAY_NIGHT_CONFIG.NIGHT_END;   // 28/30 = 0.9333

  let nightFactor = 0;
  if (ct >= 0.690 && ct < 0.742) {
    nightFactor = ep4Smoothstep(0.690, 0.742, ct);
  } else if (ct >= 0.742 && ct <= 0.925) {
    nightFactor = 1.0;
  } else if (ct > 0.925 && ct <= 0.975) {
    nightFactor = 1.0 - ep4Smoothstep(0.925, 0.975, ct);
  }

  let sunsetFactor = 0;
  if (ct >= 0.640 && ct <= 0.750) {
    const peak = (dayEnd + sunsetEnd) * 0.5; // 0.7000
    const span = ct <= peak ? (ct - 0.640) / (peak - 0.640) : 1.0 - (ct - peak) / (0.750 - peak);
    sunsetFactor = Math.max(0, Math.min(1, span));
  }

  let sunriseFactor = 0;
  if (ct >= 0.920) {
    const peak = (nightEnd + 1.0) * 0.5; // 0.9667
    const span = ct <= peak ? (ct - 0.920) / (peak - 0.920) : 1.0 - (ct - peak) / (1.015 - peak);
    sunriseFactor = Math.max(0, Math.min(1, span));
  } else if (ct <= 0.015) {
    sunriseFactor = Math.max(0, 1.0 - ct / 0.015) * 0.45;
  }

  // 새 활동 비율: 낮=1.0, 일몰(20~22분)=1->0 점점 감소, 밤(22~28분)=0.0, 일출(28~30분)=0->1 점점 증가
  let birdRatio = 1.0;
  if (ct >= dayEnd && ct < sunsetEnd) {
    birdRatio = 1.0 - (ct - dayEnd) / (sunsetEnd - dayEnd);
  } else if (ct >= sunsetEnd && ct < nightEnd) {
    birdRatio = 0.0;
  } else if (ct >= nightEnd) {
    birdRatio = (ct - nightEnd) / (1.0 - nightEnd);
  }
  birdRatio = Math.max(0, Math.min(1, birdRatio));

  return { nightFactor, sunsetFactor, sunriseFactor, birdRatio };
}

const MiracleDayNight = {
  time: EP4_DAY_NIGHT_CONFIG.INITIAL_TIME,
  speedMultiplier: 1,
  paused: false,
  stageControlled: false,
  freezeForNightMission: false,
  stormDarkness: 0,
  nightFactor: 0,
  sunsetFactor: 0,
  sunriseFactor: 0,
  birdRatio: 1,
  lightSources: [],
  pointLightPool: [],
  pointShadowPool: [],
  pointShadowFillPool: [],
  activeShadowFires: [],
  _hudSyncTimer: 0,
  isNight() {
    return (this.time >= EP4_DAY_NIGHT_CONFIG.SUNSET_END - 0.008 && this.time <= EP4_DAY_NIGHT_CONFIG.NIGHT_END + 0.012) || this.nightFactor > 0.35;
  },
  getBirdActivityRatio() {
    return this.birdRatio;
  },
  getPhaseInfo() {
    const t = ((this.time % 1) + 1) % 1;
    let key = 'day', label = '낮', icon = '☀️';
    if (t >= EP4_DAY_NIGHT_CONFIG.NIGHT_END) {
      key = 'dawn'; label = '일출'; icon = '🌄';
    } else if (t >= EP4_DAY_NIGHT_CONFIG.DAY_END && t < EP4_DAY_NIGHT_CONFIG.SUNSET_END) {
      key = 'sunset'; label = '일몰'; icon = '🌅';
    } else if (t >= EP4_DAY_NIGHT_CONFIG.SUNSET_END && t < EP4_DAY_NIGHT_CONFIG.NIGHT_END) {
      key = 'night'; label = '밤'; icon = '🌙';
    }
    return {
      key,
      label,
      icon,
      percent: Math.round(t * 100),
      nightFactor: this.nightFactor,
      sunsetFactor: this.sunsetFactor,
      sunriseFactor: this.sunriseFactor,
      birdRatio: +this.birdRatio.toFixed(3),
      speedMultiplier: this.paused ? 0 : this.speedMultiplier
    };
  },
  getNightFactor() {
    return computeEp4TimeFactors(this.time).nightFactor;
  },
  setTime(newTime) {
    this.time = ((Number(newTime) || 0) % 1 + 1) % 1;
    const f = computeEp4TimeFactors(this.time);
    this.nightFactor = f.nightFactor;
    this.sunsetFactor = f.sunsetFactor;
    this.sunriseFactor = f.sunriseFactor;
    this.birdRatio = f.birdRatio;
    if ((typeof currentEpisode === 'undefined' || currentEpisode === 'miracle') && typeof updateMiracleDynamicSun === 'function' && miracleSunSystem && miracleSunSystem.light) {
      updateMiracleDynamicSun(0, typeof performance !== 'undefined' ? performance.now() : 0);
    }
    if (typeof window.syncMiracleTimeHUD === 'function') window.syncMiracleTimeHUD();
  },
  jumpToPhase(phase) {
    const map = { morning: 0.9667, sunrise: 0.9667, dawn: 0.9667, noon: 0.28, day: 0.28, sunset: 0.70, night: 0.83 };
    this.setTime(map[phase] !== undefined ? map[phase] : 0.28);
    return this.getPhaseInfo();
  },
  cyclePhase() {
    const t = ((this.time % 1) + 1) % 1;
    if (t < EP4_DAY_NIGHT_CONFIG.DAY_END - 0.02) return this.jumpToPhase('sunset');
    if (t < EP4_DAY_NIGHT_CONFIG.SUNSET_END - 0.01) return this.jumpToPhase('night');
    if (t < EP4_DAY_NIGHT_CONFIG.NIGHT_END - 0.01) return this.jumpToPhase('sunrise');
    return this.jumpToPhase('day');
  },
  cycleSpeed(step = 1) {
    const presets = EP4_DAY_NIGHT_CONFIG.SPEED_PRESETS;
    const curVal = this.paused ? 1 : this.speedMultiplier;
    let idx = presets.indexOf(curVal);
    if (idx < 0) idx = 0;
    const nextIdx = (idx + step + presets.length) % presets.length;
    this.paused = false;
    this.speedMultiplier = presets[nextIdx];
    if (typeof window.syncMiracleTimeHUD === 'function') window.syncMiracleTimeHUD();
    return this.speedMultiplier;
  },
  clearNightLightSources() {
    this.lightSources = [];
    this.activeShadowFires = [];
  },
  disposeLightPools() {
    const pools = [this.pointShadowPool, this.pointShadowFillPool, this.pointLightPool];
    for (let p = 0; p < pools.length; p++) {
      const arr = pools[p];
      if (!Array.isArray(arr)) continue;
      for (let i = 0; i < arr.length; i++) {
        const pl = arr[i];
        if (pl && pl.shadow && pl.shadow.map && typeof pl.shadow.map.dispose === 'function') {
          try { pl.shadow.map.dispose(); } catch (e) {}
          pl.shadow.map = null;
        }
      }
    }
    this.pointShadowPool = [];
    this.pointShadowFillPool = [];
    this.pointLightPool = [];
    this.activeShadowFires = [];
  },
  registerNightLightSource(src) {
    if (src) this.lightSources.push(src);
    return src;
  }
};
window.MiracleDayNight = MiracleDayNight;

let miracleSunSystem = {
  light: null,
  lightTarget: null,
  sunVisualGroup: null,
  sunCoreMat: null,
  sunHaloMats: [],
  moonVisualGroup: null,
  moonCoreMat: null,
  moonHaloMats: [],
  nightSkyGroup: null,
  meteorGroup: null,
  starLayers: [],
  meteors: [],
  meteorShowerState: null,
  sunCoronaMesh: null,
  sunRaysGroup: null,
  flareGroup: null,
  angle: 0.52,
  angularSpeed: 0.35 / 180.0,
  cullTimer: 0,
  cullEntries: [],
  cullBuilt: false,
  lastSunDir: new THREE.Vector3(0, 0.5, -0.866),
  lastLightDir: new THREE.Vector3(0, 0.5, -0.866),
  lastMoonElevDeg: 0,
  lastMoonScale: 0,
  lastVisibleClouds: 0,
  lastCloudOpacity: 1,
  flareEls: null,
  isMobile: /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (Math.min(window.innerWidth, window.innerHeight) <= 760)
};

const _sunDirVec = new THREE.Vector3();
const _sunCamDirVec = new THREE.Vector3();
const _sunProjVec = new THREE.Vector3();

function ensureMiracleSunFlareOverlay() {
  const stale = document.getElementById('miracle-sun-flare-layer');
  if (stale && stale.parentNode) stale.parentNode.removeChild(stale);
  miracleSunSystem.flareEls = null;
  return null;
}

function updateMiracleSunScreenFlare() {}

function buildMiracleShadowCullCache() {
  miracleSunSystem.cullEntries = [];
  if (!worldGroup) return;

  const isMob = miracleSunSystem.isMobile;

  worldGroup.children.forEach(rootObj => {
    if (
      !rootObj ||
      rootObj === miracleSunSystem.sunVisualGroup ||
      rootObj === miracleSunSystem.moonVisualGroup ||
      rootObj === miracleSunSystem.nightSkyGroup ||
      rootObj === miracleSunSystem.meteorGroup
    ) return;
    if (
      (rootObj.userData && rootObj.userData._isGroundSurface) ||
      (rootObj.isMesh && rootObj.geometry && rootObj.geometry.type === 'PlaneGeometry')
    ) {
      rootObj.traverse(ch => {
        if (ch.isMesh) {
          ch.castShadow = false;
          ch.receiveShadow = true;
        }
      });
      return;
    }

    // 화롯불·모닥불 자체 구조물은 점광원 셀프 섀도우 방지를 위해 그림자 투사 제외
    if (rootObj.userData && rootObj.userData._isNightFireProp) {
      rootObj.traverse(ch => {
        if (ch.isMesh) ch.castShadow = false;
      });
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
      let cx = rootObj.position.x;
      let cz = rootObj.position.z;
      let rad = 2.0;
      let isDynamic = false;
      try {
        rootObj.updateMatrixWorld(true);
        _dnCullBoxTmp.setFromObject(rootObj);
        if (!_dnCullBoxTmp.isEmpty()) {
          _dnCullBoxTmp.getCenter(_dnCullCenterTmp);
          _dnCullBoxTmp.getSize(_dnCullSizeTmp);
          cx = _dnCullCenterTmp.x;
          cz = _dnCullCenterTmp.z;
          rad = Math.max(1.5, Math.hypot(_dnCullSizeTmp.x, _dnCullSizeTmp.z) * 0.5);
          // 이동하는 NPC·군인 등은 매 체크마다 position 기준으로 갱신
          isDynamic = rad < 4.5 && (Math.hypot(cx - rootObj.position.x, cz - rootObj.position.z) < 2.2);
        }
      } catch (e) {}
      miracleSunSystem.cullEntries.push({
        root: rootObj,
        meshes: shadowMeshes,
        cx,
        cz,
        rad,
        isDynamic,
        active: true
      });
    }
  });

  miracleSunSystem.cullBuilt = true;
}

function updateMiracleShadowDistanceCulling(focusX, focusZ, nightFactor = 0) {
  if (!miracleSunSystem.cullBuilt) {
    buildMiracleShadowCullCache();
  }
  const maxShadowDist = miracleSunSystem.isMobile ? 28.0 : 58.0;
  const isNightNoGlobalShadow = nightFactor >= 0.70;
  const activeFires = isNightNoGlobalShadow ? (MiracleDayNight.activeShadowFires || []) : null;
  const entries = miracleSunSystem.cullEntries;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (!entry.root || !entry.root.parent) continue;
    const rx = entry.isDynamic ? entry.root.position.x : entry.cx;
    const rz = entry.isDynamic ? entry.root.position.z : entry.cz;

    let shouldCast = false;
    if (!isNightNoGlobalShadow) {
      shouldCast = (Math.hypot(rx - focusX, rz - focusZ) - entry.rad) <= maxShadowDist;
    } else if (activeFires && activeFires.length > 0) {
      for (let f = 0; f < activeFires.length; f++) {
        const af = activeFires[f];
        if ((Math.hypot(rx - af.x, rz - af.z) - entry.rad) <= (af.dist + 4.5)) {
          shouldCast = true;
          break;
        }
      }
    }

    if (entry.active !== shouldCast) {
      entry.active = shouldCast;
      const mList = entry.meshes;
      for (let j = 0; j < mList.length; j++) {
        mList[j].castShadow = shouldCast;
      }
    }
  }
}

const _ep4MoonHaloTexCache = {};
function getEp4MoonHaloGradientTexture(kind) {
  if (_ep4MoonHaloTexCache[kind]) return _ep4MoonHaloTexCache[kind];
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 124);
  if (kind === 'inner') {
    g.addColorStop(0.00, 'rgba(255, 255, 255, 0.95)');
    g.addColorStop(0.38, 'rgba(248, 252, 255, 0.78)');
    g.addColorStop(0.62, 'rgba(219, 234, 254, 0.34)');
    g.addColorStop(0.84, 'rgba(186, 220, 255, 0.09)');
    g.addColorStop(1.00, 'rgba(186, 220, 255, 0.00)');
  } else {
    g.addColorStop(0.00, 'rgba(219, 234, 254, 0.75)');
    g.addColorStop(0.35, 'rgba(191, 219, 254, 0.48)');
    g.addColorStop(0.65, 'rgba(147, 197, 253, 0.18)');
    g.addColorStop(0.86, 'rgba(147, 197, 253, 0.04)');
    g.addColorStop(1.00, 'rgba(147, 197, 253, 0.00)');
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  _ep4MoonHaloTexCache[kind] = tex;
  return tex;
}

function createMiracleMoonVisualGroup() {
  const moonGrp = new THREE.Group();
  // 낮의 태양(겉보기 각지름 기준)보다 +20% 큰 은백색 다면체 달
  const rawGeo = new THREE.IcosahedronGeometry(9.5, 2);
  const geo = rawGeo.index ? rawGeo.toNonIndexed() : rawGeo;
  if (geo !== rawGeo && typeof rawGeo.dispose === 'function') rawGeo.dispose();

  const cPos = geo.attributes.position;
  const colCenter = new THREE.Color('#ffffff');
  const colMid = new THREE.Color('#f2f8ff');
  const colRim = new THREE.Color('#cfe2ff');
  const colMare = new THREE.Color('#b8c9e4');
  const tmpCol = new THREE.Color();
  const fCols = new Float32Array(cPos.count * 3);

  // 달 표면 크레이터(바다) 패치 4개 (밝기 보존을 위해 은은한 농도로 적용)
  const marePatches = [
    { x: -0.34, y:  0.26, z: 0.90, r: 0.44, w: 0.22 },
    { x:  0.28, y:  0.14, z: 0.94, r: 0.36, w: 0.18 },
    { x: -0.10, y: -0.32, z: 0.94, r: 0.32, w: 0.16 },
    { x:  0.42, y: -0.22, z: 0.88, r: 0.26, w: 0.14 }
  ];

  for (let i = 0; i + 2 < cPos.count; i += 3) {
    const mx = (cPos.getX(i) + cPos.getX(i + 1) + cPos.getX(i + 2)) / 3;
    const my = (cPos.getY(i) + cPos.getY(i + 1) + cPos.getY(i + 2)) / 3;
    const mz = (cPos.getZ(i) + cPos.getZ(i + 1) + cPos.getZ(i + 2)) / 3;
    const len = Math.hypot(mx, my, mz) || 1;
    const nx = mx / len, ny = my / len, nz = mz / len;
    const radialT = Math.max(0, Math.min(1, Math.hypot(mx, my) / len));
    if (radialT < 0.52) {
      tmpCol.copy(colCenter).lerp(colMid, radialT / 0.52);
    } else {
      tmpCol.copy(colMid).lerp(colRim, Math.min(1, (radialT - 0.52) / 0.48));
    }

    let mareMix = 0;
    for (let p = 0; p < marePatches.length; p++) {
      const mp = marePatches[p];
      const d = Math.hypot(nx - mp.x, ny - mp.y, nz - mp.z);
      if (d < mp.r) {
        const k = 1.0 - d / mp.r;
        mareMix = Math.max(mareMix, k * k * mp.w);
      }
    }
    if (mareMix > 0.005) {
      tmpCol.lerp(colMare, mareMix);
    }

    const facetVar = 0.96 + (((Math.floor(i / 3) * 19) % 7) / 6) * 0.06;
    for (let k = 0; k < 3; k++) {
      fCols[(i + k) * 3] = Math.min(1, tmpCol.r * facetVar);
      fCols[(i + k) * 3 + 1] = Math.min(1, tmpCol.g * facetVar);
      fCols[(i + k) * 3 + 2] = Math.min(1, tmpCol.b * facetVar);
    }
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(fCols, 3));
  geo.computeVertexNormals();

  const moonMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    vertexColors: true,
    transparent: true,
    opacity: 1.0,
    depthTest: true,
    depthWrite: false,
    fog: false
  });
  const moonMesh = new THREE.Mesh(geo, moonMat);
  moonMesh.renderOrder = -5;
  moonMesh.frustumCulled = false;

  // 2단계 부드러운 방사형 그라데이션 달무리 (태양 해무리와 동일한 2단계 수준)
  const haloMats = [];
  const haloSpecs = [
    { kind: 'inner', r: 14.2, op: 0.36, z: -1.4 },
    { kind: 'outer', r: 19.8, op: 0.16, z: -2.8 }
  ];
  haloSpecs.forEach(hs => {
    const hMat = new THREE.MeshBasicMaterial({
      map: getEp4MoonHaloGradientTexture(hs.kind),
      color: 0xffffff,
      transparent: true,
      opacity: hs.op,
      depthTest: true,
      depthWrite: false,
      fog: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    const hGeo = new THREE.PlaneGeometry(hs.r * 2, hs.r * 2);
    const hMesh = new THREE.Mesh(hGeo, hMat);
    hMesh.position.z = hs.z;
    hMesh.renderOrder = -6;
    hMesh.frustumCulled = false;
    moonGrp.add(hMesh);
    haloMats.push({ mat: hMat, baseOp: hs.op });
  });

  moonGrp.add(moonMesh);
  moonGrp.scale.setScalar(2.45);
  moonGrp.userData.baseScale = 2.45;
  moonGrp.renderOrder = -5;
  moonGrp.visible = false;
  miracleSunSystem.moonCoreMat = moonMat;
  miracleSunSystem.moonHaloMats = haloMats;
  miracleSunSystem.lastMoonScale = 2.45;
  return moonGrp;
}

let _ep4CrispStarTex = null;
function getEp4CrispStarTexture() {
  if (_ep4CrispStarTex) return _ep4CrispStarTex;
  const c = document.createElement('canvas');
  c.width = 32;
  c.height = 32;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0.0, 'rgba(255,255,255,1.0)');
  g.addColorStop(0.28, 'rgba(255,255,255,0.92)');
  g.addColorStop(0.62, 'rgba(255,255,255,0.28)');
  g.addColorStop(1.0, 'rgba(255,255,255,0.0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 32, 32);
  _ep4CrispStarTex = new THREE.CanvasTexture(c);
  return _ep4CrispStarTex;
}

function createMiracleNightSkyGroup(isMob) {
  const skyGrp = new THREE.Group();

  // 1) 레퍼런스 스타일 깊은 남색 밤하늘 그라데이션 돔 (반지름 650m > 맵 외곽 산맥, depthTest: true로 산 뒤로 완전 가림)
  const domeRadius = EP4_DAY_NIGHT_CONFIG.SKY_DOME_RADIUS || 650;
  const domeGeo = new THREE.SphereGeometry(domeRadius, 30, 18);
  const dPos = domeGeo.attributes.position;
  const dCols = new Float32Array(dPos.count * 3);
  const cHorizon = new THREE.Color('#1f457a'); // 지평선·산맥 뒤 은은한 깊은 로열 네이비
  const cMidSky  = new THREE.Color('#0a1b42'); // 중천 사파이어 네이비
  const cZenith  = new THREE.Color('#03091c'); // 천정 짙은 밤하늘
  const cDomeTmp = new THREE.Color();
  for (let i = 0; i < dPos.count; i++) {
    const ny = Math.max(0, dPos.getY(i) / domeRadius);
    if (ny < 0.28) {
      cDomeTmp.copy(cHorizon).lerp(cMidSky, ep4Smoothstep(0.0, 0.28, ny));
    } else {
      cDomeTmp.copy(cMidSky).lerp(cZenith, ep4Smoothstep(0.28, 0.65, ny));
    }
    dCols[i * 3] = cDomeTmp.r;
    dCols[i * 3 + 1] = cDomeTmp.g;
    dCols[i * 3 + 2] = cDomeTmp.b;
  }
  domeGeo.setAttribute('color', new THREE.Float32BufferAttribute(dCols, 3));
  const domeMat = new THREE.MeshBasicMaterial({
    vertexColors: true,
    side: THREE.BackSide,
    transparent: true,
    opacity: 0,
    depthTest: true,
    depthWrite: false,
    fog: false
  });
  const skyDomeMesh = new THREE.Mesh(domeGeo, domeMat);
  skyDomeMesh.renderOrder = -10;
  skyGrp.add(skyDomeMesh);

  // 2) 작고 촘촘한 4색 별하늘 (흰색 #FFFFFF, 노란색 #FFE89E, 붉은색 #FF9E80, 푸른색 #A6D1FF)
  //    반지름 r = 560..625m (맵 최외곽 산맥 뒤편) + depthTest: true 로 원경 산/건물 앞쪽으로 절대 뚫고 보이지 않음!
  const totalStars = isMob ? EP4_DAY_NIGHT_CONFIG.STAR_COUNT_MOBILE : EP4_DAY_NIGHT_CONFIG.STAR_COUNT_DESKTOP;
  const starLayers = [];
  const paletteCols = [
    new THREE.Color('#FFFFFF'), // 흰색 (55%)
    new THREE.Color('#FFE89E'), // 노란색 (20%)
    new THREE.Color('#FF9E80'), // 붉은색 (10%)
    new THREE.Color('#A6D1FF')  // 푸른색 (15%)
  ];
  const layerSizes = [isMob ? 1.8 : 1.6, isMob ? 2.6 : 2.3, isMob ? 3.5 : 3.2];
  const perLayer = Math.max(250, Math.floor(totalStars / 3));
  const starTex = getEp4CrispStarTexture();
  const rMin = EP4_DAY_NIGHT_CONFIG.STAR_RADIUS_MIN || 560;
  const rSpan = (EP4_DAY_NIGHT_CONFIG.STAR_RADIUS_MAX || 625) - rMin;

  for (let l = 0; l < 3; l++) {
    const positions = new Float32Array(perLayer * 3);
    const colors = new Float32Array(perLayer * 3);
    const colTmp = new THREE.Color();
    for (let i = 0; i < perLayer; i++) {
      const theta = Math.random() * Math.PI * 2;
      const upU = 0.012 + Math.pow(Math.random(), 1.15) * 0.988; // 지평선~천정 전체 고르게
      const sinPhi = Math.sqrt(Math.max(0, 1 - upU * upU));
      const r = rMin + ((i * 7 + l * 3) % 13) / 12 * rSpan;
      positions[i * 3] = sinPhi * Math.cos(theta) * r;
      positions[i * 3 + 1] = upU * r;
      positions[i * 3 + 2] = sinPhi * Math.sin(theta) * r;

      const roll = Math.random();
      let baseCol = paletteCols[0];
      if (roll >= 0.55 && roll < 0.75) baseCol = paletteCols[1];
      else if (roll >= 0.75 && roll < 0.85) baseCol = paletteCols[2];
      else if (roll >= 0.85) baseCol = paletteCols[3];

      const lum = (l === 2 ? 0.85 : 0.68) + Math.random() * 0.30;
      colTmp.copy(baseCol).multiplyScalar(Math.min(1.0, lum));
      colors[i * 3] = colTmp.r;
      colors[i * 3 + 1] = colTmp.g;
      colors[i * 3 + 2] = colTmp.b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({
      map: starTex,
      size: layerSizes[l],
      sizeAttenuation: false,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      alphaTest: 0.02,
      depthTest: true,
      depthWrite: false,
      fog: false,
      blending: THREE.AdditiveBlending
    });
    const pts = new THREE.Points(geo, mat);
    pts.renderOrder = -8;
    skyGrp.add(pts);
    starLayers.push({ pts, mat, speed: 1.4 + l * 0.85, phase: l * 2.15 });
  }

  skyGrp.renderOrder = -10;
  skyGrp.visible = false;
  miracleSunSystem.skyDomeMesh = skyDomeMesh;
  miracleSunSystem.skyDomeMat = domeMat;
  miracleSunSystem.starLayers = starLayers;
  return skyGrp;
}

// 별도 비회전 원경 별똥별 그룹 (카메라 전방 시야 기준 스폰 + 단발/2~3개 연속 유성우)
function createMiracleMeteorGroup() {
  const metRoot = new THREE.Group();
  const meteors = [];
  const count = EP4_DAY_NIGHT_CONFIG.METEOR_COUNT || 6;

  // 꼬리 원뿔: 굵은 밑면이 머리(z=0), 뾰족한 끝이 꼬리 뒤쪽(z=-L)을 향하도록 정렬
  const innerTailGeo = new THREE.ConeGeometry(1.15, 46.0, 5);
  innerTailGeo.rotateX(-Math.PI * 0.5);
  innerTailGeo.translate(0, 0, -23.0);

  const outerTailGeo = new THREE.ConeGeometry(2.35, 78.0, 6);
  outerTailGeo.rotateX(-Math.PI * 0.5);
  outerTailGeo.translate(0, 0, -39.0);

  const headCoreGeo = new THREE.OctahedronGeometry(2.3, 0);
  const headHaloGeo = new THREE.OctahedronGeometry(4.5, 0);

  for (let m = 0; m < count; m++) {
    const mGrp = new THREE.Group();
    const headMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthTest: true,
      depthWrite: false,
      fog: false,
      blending: THREE.AdditiveBlending
    });
    const headHaloMat = new THREE.MeshBasicMaterial({
      color: 0xe0f2fe,
      transparent: true,
      opacity: 0,
      depthTest: true,
      depthWrite: false,
      fog: false,
      blending: THREE.AdditiveBlending
    });
    const innerTailMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthTest: true,
      depthWrite: false,
      fog: false,
      blending: THREE.AdditiveBlending
    });
    const tailMat = new THREE.MeshBasicMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0,
      depthTest: true,
      depthWrite: false,
      fog: false,
      blending: THREE.AdditiveBlending
    });

    const head = new THREE.Mesh(headCoreGeo, headMat);
    const headHalo = new THREE.Mesh(headHaloGeo, headHaloMat);
    const innerTail = new THREE.Mesh(innerTailGeo, innerTailMat);
    const outerTail = new THREE.Mesh(outerTailGeo, tailMat);
    head.renderOrder = -7;
    headHalo.renderOrder = -7;
    innerTail.renderOrder = -7;
    outerTail.renderOrder = -7;

    mGrp.add(outerTail, innerTail, headHalo, head);
    mGrp.renderOrder = -7;
    mGrp.visible = false;
    metRoot.add(mGrp);
    meteors.push({
      grp: mGrp,
      headMat,
      headHaloMat,
      innerTailMat,
      tailMat,
      active: false,
      age: 0,
      maxDur: 1.05,
      pos: new THREE.Vector3(),
      vel: new THREE.Vector3()
    });
  }

  metRoot.renderOrder = -7;
  metRoot.visible = false;
  miracleSunSystem.meteorGroup = metRoot;
  miracleSunSystem.meteors = meteors;
  miracleSunSystem.meteorShowerState = {
    nextEventTimer: 1.3 + Math.random() * 1.1,
    burstRemaining: 0,
    burstGapTimer: 0,
    burstBaseAzim: 0,
    burstBaseElev: 0.27,
    burstSlopeSign: 1,
    burstCountTotal: 0
  };
  return metRoot;
}

function setupMiracleDynamicSunAndShadows() {
  if (!scene || !renderer) return;

  miracleSunSystem.isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (Math.min(window.innerWidth, window.innerHeight) <= 760);
  const isMob = miracleSunSystem.isMobile;

  if (isMob && renderer.setPixelRatio) {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
  }

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = isMob ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = true;
  renderer.shadowMap.needsUpdate = true;

  let dirLight = window.coreDirLight || null;
  if (!dirLight) {
    scene.traverse(obj => {
      if (obj.isDirectionalLight && !dirLight) dirLight = obj;
    });
  }
  if (!dirLight) {
    dirLight = new THREE.DirectionalLight(0xfff8dc, 0.88);
    scene.add(dirLight);
  }

  dirLight.color.setHex(0xfff8dc);
  dirLight.intensity = 0.88;
  dirLight.castShadow = true;

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
  dirLight.shadow.bias = -0.00035;
  if (dirLight.shadow.normalBias !== undefined) {
    dirLight.shadow.normalBias = 0.025;
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
    const rawCoreGeo = new THREE.IcosahedronGeometry(8.6, 1);
    const coreGeo = rawCoreGeo.index ? rawCoreGeo.toNonIndexed() : rawCoreGeo;
    if (coreGeo !== rawCoreGeo && typeof rawCoreGeo.dispose === 'function') rawCoreGeo.dispose();
    const cPos = coreGeo.attributes.position;
    const colCore = new THREE.Color('#fffef2');
    const colMid  = new THREE.Color('#fde047');
    const colRim  = new THREE.Color('#ee8f12');
    const tmpCol  = new THREE.Color();
    const fCols = new Float32Array(cPos.count * 3);
    for (let i = 0; i + 2 < cPos.count; i += 3) {
      const mx = (cPos.getX(i) + cPos.getX(i + 1) + cPos.getX(i + 2)) / 3;
      const my = (cPos.getY(i) + cPos.getY(i + 1) + cPos.getY(i + 2)) / 3;
      const mz = (cPos.getZ(i) + cPos.getZ(i + 1) + cPos.getZ(i + 2)) / 3;
      const len = Math.hypot(mx, my, mz) || 1;
      const radialT = Math.max(0, Math.min(1, Math.hypot(mx, my) / len));
      if (radialT < 0.48) {
        tmpCol.copy(colCore).lerp(colMid, radialT / 0.48);
      } else {
        tmpCol.copy(colMid).lerp(colRim, Math.min(1, (radialT - 0.48) / 0.52));
      }
      const facetVar = 0.945 + (((Math.floor(i / 3) * 17) % 7) / 6) * 0.095;
      for (let k = 0; k < 3; k++) {
        fCols[(i + k) * 3]     = Math.min(1, tmpCol.r * facetVar);
        fCols[(i + k) * 3 + 1] = Math.min(1, tmpCol.g * facetVar);
        fCols[(i + k) * 3 + 2] = Math.min(1, tmpCol.b * facetVar);
      }
    }
    coreGeo.setAttribute('color', new THREE.Float32BufferAttribute(fCols, 3));
    coreGeo.computeVertexNormals();
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
      depthTest: true,
      depthWrite: false,
      fog: false
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.userData.sunStyle = 'radial_polygonal_core';
    core.renderOrder = -6;

    const flareGrp = new THREE.Group();
    flareGrp.renderOrder = -6;
    const sunHaloMats = [];
    const haloSpecs = [
      { r: 12.8, col: 0xfef08a, sunsetCol: 0xfb923c, op: 0.30, z: -1.6 },
      { r: 17.8, col: 0xfde68a, sunsetCol: 0xf97316, op: 0.14, z: -3.2 }
    ];
    haloSpecs.forEach(hs => {
      const hMat = new THREE.MeshBasicMaterial({
        color: hs.col,
        transparent: true,
        opacity: hs.op,
        depthTest: true,
        depthWrite: false,
        fog: false,
        side: THREE.DoubleSide
      });
      const hMesh = new THREE.Mesh(new THREE.CircleGeometry(hs.r, 10), hMat);
      hMesh.rotation.z = Math.PI / 10;
      hMesh.position.z = hs.z;
      hMesh.renderOrder = -7;
      flareGrp.add(hMesh);
      sunHaloMats.push({ mat: hMat, baseCol: new THREE.Color(hs.col), sunsetCol: new THREE.Color(hs.sunsetCol), baseOp: hs.op });
    });

    sunGrp.add(core, flareGrp);
    sunGrp.scale.setScalar(2.45);
    sunGrp.renderOrder = -6;
    worldGroup.add(sunGrp);
    miracleSunSystem.sunVisualGroup = sunGrp;
    miracleSunSystem.sunCoreMat = coreMat;
    miracleSunSystem.sunHaloMats = sunHaloMats;
    miracleSunSystem.sunCoronaMesh = null;
    miracleSunSystem.sunRaysGroup = null;
    miracleSunSystem.flareGroup = flareGrp;

    // 달(Supermoon) + 밤하늘 별 + 비회전 별똥별 그룹 + 점광원/그림자 풀 초기화
    const moonGrp = createMiracleMoonVisualGroup();
    worldGroup.add(moonGrp);
    miracleSunSystem.moonVisualGroup = moonGrp;

    const nightSkyGrp = createMiracleNightSkyGroup(isMob);
    worldGroup.add(nightSkyGrp);
    miracleSunSystem.nightSkyGroup = nightSkyGrp;

    const meteorGrp = createMiracleMeteorGroup();
    worldGroup.add(meteorGrp);
    miracleSunSystem.meteorGroup = meteorGrp;

    if (typeof MiracleDayNight.disposeLightPools === 'function') {
      MiracleDayNight.disposeLightPools();
    }
    MiracleDayNight.pointShadowPool = [];
    MiracleDayNight.pointShadowFillPool = [];
    MiracleDayNight.pointLightPool = [];
    MiracleDayNight.activeShadowFires = [];

    const shadowPoolSize = isMob ? (EP4_DAY_NIGHT_CONFIG.POINT_SHADOW_POOL_MOBILE || 1) : (EP4_DAY_NIGHT_CONFIG.POINT_SHADOW_POOL_DESKTOP || 2);
    const shadowMapRes = isMob ? (EP4_DAY_NIGHT_CONFIG.POINT_SHADOW_MAP_MOBILE || 256) : (EP4_DAY_NIGHT_CONFIG.POINT_SHADOW_MAP_DESKTOP || 512);
    for (let i = 0; i < shadowPoolSize; i++) {
      const spl = new THREE.PointLight(0xff9a3c, 0, 1.0, 1.55);
      spl.castShadow = true;
      spl.shadow.mapSize.width = shadowMapRes;
      spl.shadow.mapSize.height = shadowMapRes;
      spl.shadow.camera.near = 0.75;
      spl.shadow.camera.far = 1.0;
      spl.shadow.bias = -0.0024;
      if (spl.shadow.normalBias !== undefined) spl.shadow.normalBias = 0.035;
      spl.shadow.camera.updateProjectionMatrix();
      spl.position.set(0, -300, 0);
      worldGroup.add(spl);
      MiracleDayNight.pointShadowPool.push(spl);

      // 같은 위치의 따뜻한 난반사 보조 점광원(castShadow=false)으로 그림자 내부가 시커멓지 않고 밝고 따뜻하게 표현
      const fpl = new THREE.PointLight(0xffbe6b, 0, 1.0, 1.55);
      fpl.castShadow = false;
      fpl.position.set(0, -300, 0);
      worldGroup.add(fpl);
      MiracleDayNight.pointShadowFillPool.push(fpl);
    }

    const poolSize = isMob ? EP4_DAY_NIGHT_CONFIG.POINT_LIGHT_POOL_MOBILE : EP4_DAY_NIGHT_CONFIG.POINT_LIGHT_POOL_DESKTOP;
    for (let i = 0; i < poolSize; i++) {
      const pl = new THREE.PointLight(0xff9a3c, 0, 15, 1.65);
      pl.castShadow = false;
      pl.position.set(0, -100, 0);
      worldGroup.add(pl);
      MiracleDayNight.pointLightPool.push(pl);
    }
  }
}

function updateMiraclePooledNightLights(focusX, focusZ, nightFactor, now) {
  const pool = MiracleDayNight.pointLightPool;
  const shadowPool = MiracleDayNight.pointShadowPool || [];
  const fillPool = MiracleDayNight.pointShadowFillPool || [];
  MiracleDayNight.activeShadowFires = [];

  const parkShadowSlot = (idx) => {
    const spl = shadowPool[idx];
    if (spl) {
      spl.intensity = 0;
      spl.distance = 1.0;
      spl.position.set(0, -300, 0);
      if (spl.shadow && spl.shadow.camera && Math.abs(spl.shadow.camera.far - 1.0) > 0.1) {
        spl.shadow.camera.far = 1.0;
        spl.shadow.camera.updateProjectionMatrix();
      }
    }
    const fpl = fillPool[idx];
    if (fpl) {
      fpl.intensity = 0;
      fpl.distance = 1.0;
      fpl.position.set(0, -300, 0);
    }
  };

  if (nightFactor <= 0.06 || !MiracleDayNight.lightSources || MiracleDayNight.lightSources.length === 0) {
    for (let i = 0; i < shadowPool.length; i++) parkShadowSlot(i);
    if (pool) {
      for (let i = 0; i < pool.length; i++) pool[i].intensity = 0;
    }
    return;
  }

  const maxRangeSq = 48 * 48;
  const candidates = [];
  const list = MiracleDayNight.lightSources;
  for (let i = 0; i < list.length; i++) {
    const src = list[i];
    if (!src) continue;
    if (typeof src.isActive === 'function' && !src.isActive()) continue;
    const pos = typeof src.getPos === 'function' ? src.getPos() : src.pos;
    if (!pos) continue;
    const dx = pos.x - focusX;
    const dz = pos.z - focusZ;
    const dSq = dx * dx + dz * dz;
    if (dSq > maxRangeSq) continue;
    candidates.push({ src, pos, dSq, dist: Math.sqrt(dSq) });
  }

  // 거리 우선 + 밝은 불(화롯불·모닥불) 우선 보정 정렬
  candidates.sort((a, b) => (a.dist - (a.src.intensity || 1.5) * 1.1) - (b.dist - (b.src.intensity || 1.5) * 1.1));
  const tNow = now * 0.0075;
  const usedForShadow = new Set();

  // 1) 가장 가까운 활성 불빛 1~2기에 실시간 그림자 + 따뜻한 밝은 난반사 보조광 할당
  let sIdx = 0;
  for (let i = 0; i < candidates.length && sIdx < shadowPool.length; i++) {
    const c = candidates[i];
    const lightDist = c.src.distance || 14;
    if (c.src.castShadow === false) continue;
    if (c.dist > lightDist + 16.0) continue;

    const phase = c.src.phase || (i * 1.7);
    const flicker = 0.89 + Math.sin(tNow + phase) * 0.07 + Math.cos(tNow * 1.9 + phase * 1.3) * 0.04;
    const baseIntensity = c.src.intensity || 1.8;
    const totalInt = baseIntensity * nightFactor * flicker;

    // 밝은 불(화롯불/대형 모닥불)일수록 넓은 범위·선명한 그림자 + 풍부한 따뜻한 밝은 난반사
    const brightNorm = THREE.MathUtils.clamp((baseIntensity - 0.9) / 2.5, 0.0, 1.0);
    const shadowShare = THREE.MathUtils.lerp(0.56, 0.72, brightNorm);
    const fillShare = 1.0 - shadowShare;

    const px = c.pos.x;
    const py = (c.pos.y !== undefined ? c.pos.y : 0) + (c.src.yOffset !== undefined ? c.src.yOffset : 1.25);
    const pz = c.pos.z;

    const spl = shadowPool[sIdx];
    spl.color.setHex(c.src.color || 0xff9a3c);
    spl.distance = lightDist;
    spl.intensity = totalInt * shadowShare;
    spl.position.set(px, py, pz);
    if (spl.shadow && spl.shadow.camera && Math.abs(spl.shadow.camera.far - lightDist) > 0.35) {
      spl.shadow.camera.far = lightDist;
      spl.shadow.camera.updateProjectionMatrix();
    }

    const fpl = fillPool[sIdx];
    if (fpl) {
      fpl.color.setHex(c.src.color || 0xff9a3c).lerp(_dnWarmFillTint, 0.28 + brightNorm * 0.14);
      fpl.distance = lightDist * 1.08;
      fpl.intensity = totalInt * fillShare;
      fpl.position.set(px, py, pz);
    }

    MiracleDayNight.activeShadowFires.push({ x: px, z: pz, dist: lightDist, intensity: totalInt });
    usedForShadow.add(i);
    sIdx++;
  }
  for (let i = sIdx; i < shadowPool.length; i++) {
    parkShadowSlot(i);
  }

  // 2) 나머지 근접 불빛은 일반 점광원 풀(비그림자)로 처리
  if (pool && pool.length > 0) {
    let pIdx = 0;
    for (let i = 0; i < candidates.length && pIdx < pool.length; i++) {
      if (usedForShadow.has(i)) continue;
      const c = candidates[i];
      const pl = pool[pIdx];
      const phase = c.src.phase || (i * 1.7);
      const flicker = 0.88 + Math.sin(tNow + phase) * 0.08 + Math.cos(tNow * 1.9 + phase * 1.3) * 0.05;
      pl.color.setHex(c.src.color || 0xff9a3c);
      pl.distance = c.src.distance || 14;
      pl.intensity = (c.src.intensity || 1.8) * nightFactor * flicker;
      pl.position.set(c.pos.x, (c.pos.y !== undefined ? c.pos.y : 0) + (c.src.yOffset !== undefined ? c.src.yOffset : 1.0), c.pos.z);
      pIdx++;
    }
    for (let i = pIdx; i < pool.length; i++) {
      pool[i].intensity = 0;
    }
  }
}

let _ep4CloudDepthPrepassMat = null;
function getEp4CloudDepthPrepassMat() {
  if (!_ep4CloudDepthPrepassMat) {
    _ep4CloudDepthPrepassMat = new THREE.MeshBasicMaterial({
      colorWrite: false,
      depthWrite: true,
      depthTest: true,
      transparent: true,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1
    });
  }
  return _ep4CloudDepthPrepassMat;
}

function tintMiracleCloudCollection(list, targetCol, isRawMeshList = false, nightFactor = 0, stormDarkness = 0) {
  const res = { visibleCount: 0, maxVisibleOp: 0 };
  if (!Array.isArray(list) || list.length === 0) return res;

  let totalClouds = 0;
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    const mesh = isRawMeshList ? item : (item && item.kind === 'cloud' ? item.mesh : null);
    if (mesh) totalClouds++;
  }
  if (totalClouds === 0) return res;

  const nf = Math.max(0, Math.min(1, nightFactor || 0));
  const sd = Math.max(0, Math.min(1, stormDarkness || 0));
  const calmNight = nf * (1.0 - sd * 0.75);
  const baseNightOp = THREE.MathUtils.lerp(1.0, 0.54, ep4Smoothstep(0.05, 0.72, nf));
  const stormAwareOp = THREE.MathUtils.lerp(baseNightOp, 0.80, sd);

  let cloudIdx = 0;
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    const mesh = isRawMeshList ? item : (item && item.kind === 'cloud' ? item.mesh : null);
    if (!mesh) continue;

    let keepAtNight;
    if (!isRawMeshList && typeof item.keepAtNight === 'boolean') {
      keepAtNight = item.keepAtNight;
    } else if (mesh.userData && typeof mesh.userData.keepAtNight === 'boolean') {
      keepAtNight = mesh.userData.keepAtNight;
    } else if (totalClouds <= 3) {
      keepAtNight = true;
    } else if (totalClouds <= 6) {
      keepAtNight = (cloudIdx % 2 === 0);
    } else {
      keepAtNight = (cloudIdx % 3 === 0);
    }
    cloudIdx++;

    mesh.renderOrder = -3;
    const holder = isRawMeshList ? mesh : item;
    const matsValid = Array.isArray(holder._cloudMats) && holder._cloudMats.length > 0 && holder._cloudMats.every(m => m && m._isCloudMatCloned);
    if (!matsValid || !Array.isArray(holder._cloudDepthMeshes)) {
      const puffMeshes = [];
      mesh.traverse(ch => {
        if (ch.isMesh && ch.material && !(ch.userData && ch.userData._isCloudDepthPrepass)) {
          puffMeshes.push(ch);
        }
      });
      const cMats = [];
      const dMeshes = [];
      for (let p = 0; p < puffMeshes.length; p++) {
        const ch = puffMeshes[p];
        if (!ch.material._isCloudMatCloned) {
          const clonedMat = ch.material.clone();
          clonedMat._isCloudMatCloned = true;
          ch.material = clonedMat;
        }
        ch.renderOrder = -2;
        cMats.push(ch.material);

        let dp = ch.userData ? ch.userData._depthPrepassMesh : null;
        if (!dp && ch.parent) {
          dp = new THREE.Mesh(ch.geometry, getEp4CloudDepthPrepassMat());
          dp.position.copy(ch.position);
          dp.rotation.copy(ch.rotation);
          dp.scale.copy(ch.scale);
          dp.userData._isCloudDepthPrepass = true;
          dp.renderOrder = -3;
          dp.frustumCulled = ch.frustumCulled;
          dp.visible = false;
          ch.parent.add(dp);
          ch.userData._depthPrepassMesh = dp;
        }
        if (dp) dMeshes.push(dp);
      }
      holder._cloudMats = cMats;
      holder._cloudDepthMeshes = dMeshes;
    }

    const cullFade = keepAtNight ? 1.0 : (1.0 - ep4Smoothstep(0.14, 0.76, calmNight));
    const finalOp = stormAwareOp * cullFade;
    if (finalOp <= 0.015) {
      mesh.visible = false;
      continue;
    }

    mesh.visible = true;
    res.visibleCount++;
    if (finalOp > res.maxVisibleOp) res.maxVisibleOp = finalOp;

    const isTranslucent = finalOp < 0.99;
    const mats = holder._cloudMats;
    for (let j = 0; j < mats.length; j++) {
      const m = mats[j];
      m.color.copy(targetCol);
      if (m.emissive) {
        m.emissive.setHex(0x3a5485);
        m.emissiveIntensity = calmNight * 0.52;
      }
      if (m.transparent !== isTranslucent) {
        m.transparent = isTranslucent;
        m.needsUpdate = true;
      }
      m.opacity = finalOp;
      m.depthWrite = !isTranslucent;
      m.depthFunc = isTranslucent ? THREE.LessEqualDepth : THREE.LessDepth;
    }
    const dMeshes = holder._cloudDepthMeshes;
    for (let j = 0; j < dMeshes.length; j++) {
      dMeshes[j].visible = isTranslucent;
    }
  }
  return res;
}

function updateMiracleDynamicSun(rawDt, now) {
  if (!miracleSunSystem.light) {
    setupMiracleDynamicSunAndShadows();
  }
  const light = miracleSunSystem.light;
  if (!light) return;

  const dt = Math.min(Math.max(rawDt || 0, 0), 0.05);
  const focusX = playerPos ? playerPos.x : 0;
  const focusY = playerPos ? playerPos.y : 0;
  const focusZ = playerPos ? playerPos.z : 0;

  const sub = (typeof miracleSubMode !== 'undefined') ? miracleSubMode : '';
  const isEp4 = (typeof currentEpisode !== 'undefined' && currentEpisode === 'miracle') || Boolean(sub);
  const isOpenWorld = (sub === 'openworld');
  const isDayNightActive = isEp4 || isOpenWorld || MiracleDayNight.stageControlled;

  if (!isDayNightActive) {
    MiracleDayNight.nightFactor = 0;
    MiracleDayNight.sunsetFactor = 0;
    MiracleDayNight.sunriseFactor = 0;
    MiracleDayNight.birdRatio = 1;
    if (typeof window.updateHeroClayEmissiveForNight === 'function') window.updateHeroClayEmissiveForNight(0);
    if (miracleSunSystem.moonVisualGroup) miracleSunSystem.moonVisualGroup.visible = false;
    if (miracleSunSystem.nightSkyGroup) miracleSunSystem.nightSkyGroup.visible = false;
    if (miracleSunSystem.meteorGroup) miracleSunSystem.meteorGroup.visible = false;
    if (miracleSunSystem.sunVisualGroup) miracleSunSystem.sunVisualGroup.visible = true;
    updateMiraclePooledNightLights(focusX, focusZ, 0, now);

    miracleSunSystem.angle += dt * miracleSunSystem.angularSpeed;
    const azim = Math.sin(miracleSunSystem.angle) * 1.18;
    const elev = 0.44 + Math.cos(miracleSunSystem.angle * 2.0) * 0.08;

    _sunDirVec.set(
      Math.sin(azim) * Math.cos(elev),
      Math.sin(elev),
      -Math.cos(azim) * Math.cos(elev)
    ).normalize();
    miracleSunSystem.lastSunDir.copy(_sunDirVec);
    miracleSunSystem.lastLightDir.copy(_sunDirVec);

    const sunDist = 85.0;
    light.color.setHex(0xfff8dc);
    light.intensity = 0.88;
    light.position.set(
      focusX + _sunDirVec.x * sunDist,
      focusY + _sunDirVec.y * sunDist,
      focusZ + _sunDirVec.z * sunDist
    );
    if (miracleSunSystem.lightTarget) {
      miracleSunSystem.lightTarget.position.set(focusX, focusY, focusZ);
      miracleSunSystem.lightTarget.updateMatrixWorld();
    }
    if (miracleSunSystem.sunVisualGroup) {
      const visDist = 420.0;
      miracleSunSystem.sunVisualGroup.position.set(
        focusX + _sunDirVec.x * visDist,
        focusY + _sunDirVec.y * visDist,
        focusZ + _sunDirVec.z * visDist
      );
      if (camera) miracleSunSystem.sunVisualGroup.lookAt(camera.position);
    }
  } else {
    // 30분(1,800초) 에피소드 4 전역 낮/일몰/밤/일출 순환 (20 : 2 : 6 : 2)
    const stMini = (typeof miracleActiveMiniState !== 'undefined') ? miracleActiveMiniState : null;
    const isScriptedSunset = (sub === 'main1_galilee' && stMini && stMini.phase === 'sunset_to_night');
    const freezeTime = Boolean(isOpenWorld && MiracleDayNight.freezeForNightMission);
    if (!MiracleDayNight.paused && !freezeTime && !isScriptedSunset && MiracleDayNight.speedMultiplier > 0 && dt > 0) {
      MiracleDayNight.time = (MiracleDayNight.time + (dt * MiracleDayNight.speedMultiplier) / EP4_DAY_NIGHT_CONFIG.FULL_DAY_SECONDS) % 1.0;
    }

    const t = MiracleDayNight.time;
    const factors = computeEp4TimeFactors(t);
    MiracleDayNight.nightFactor = factors.nightFactor;
    MiracleDayNight.sunsetFactor = factors.sunsetFactor;
    MiracleDayNight.sunriseFactor = factors.sunriseFactor;
    MiracleDayNight.birdRatio = factors.birdRatio;
    const nf = factors.nightFactor;
    const sf = factors.sunsetFactor;
    const rf = factors.sunriseFactor;
    const warmFactor = Math.max(sf, rf);

    // 1) 해 궤도 (일출 28분 -> 낮 0~20분 -> 일몰 22분: 동(+X) -> 북쪽 하늘(-Z) -> 서(-X) 단일 방향 벡터)
    const riseStart = EP4_DAY_NIGHT_CONFIG.NIGHT_END; // 0.9333
    const setEnd = EP4_DAY_NIGHT_CONFIG.SUNSET_END;   // 0.7333
    const sunSpan = (1.0 - riseStart) + setEnd;       // 0.8000
    let uSun = -1;
    if (t >= riseStart) uSun = (t - riseStart) / sunSpan;
    else if (t <= setEnd) uSun = (t + (1.0 - riseStart)) / sunSpan;
    const uSunClamped = Math.max(0, Math.min(1, uSun < 0 ? 0.5 : uSun));
    const sunElev = Math.sin(uSunClamped * Math.PI) * 0.72 - 0.04; // -2.3° ~ +38.9°
    const sunAzim = (1.0 - uSunClamped * 2.0) * 1.24;

    _sunDirVec.set(
      Math.sin(sunAzim) * Math.cos(sunElev),
      Math.sin(sunElev),
      -Math.cos(sunAzim) * Math.cos(sunElev)
    ).normalize();
    miracleSunSystem.lastSunDir.copy(_sunDirVec);

    // 2) 초대형 판타지 슈퍼문 궤도 (낮의 해와 동일한 동(+X)->북(-Z)->서(-X) 아치 패턴, 정점 고도 +28.6°)
    const moonStart = EP4_DAY_NIGHT_CONFIG.DAY_END; // 20/30 = 0.6667 (일몰 시작)
    const moonSpan = 1.0 - moonStart;               // 10/30 = 0.3333 (정점 = 자정 0.8333)
    const vMoon = THREE.MathUtils.clamp((t - moonStart) / moonSpan, 0, 1);
    const moonElev = Math.sin(vMoon * Math.PI) * 0.52 - 0.02; // -1.1° -> 자정 +28.6° -> -1.1°
    const moonAzim = (1.0 - vMoon * 2.0) * 1.24;              // 해와 동일: 동(+71°) -> 북(0°) -> 서(-71°)
    miracleSunSystem.lastMoonElevDeg = +(moonElev * 180 / Math.PI).toFixed(1);

    // 해/달은 산맥보다 뒤쪽(r = 415~450m)에 배치해 원경 지형을 가리지 않도록 처리
    const visDist = 450.0;
    const sunVisY = _sunDirVec.y * visDist;
    if (miracleSunSystem.sunVisualGroup) {
      const sunVisible = (uSun >= 0 && uSun <= 1.0) && (sunVisY > -36);
      miracleSunSystem.sunVisualGroup.visible = sunVisible;
      if (sunVisible) {
        miracleSunSystem.sunVisualGroup.position.set(
          focusX + _sunDirVec.x * visDist,
          focusY + sunVisY,
          focusZ + _sunDirVec.z * visDist
        );
        if (camera) miracleSunSystem.sunVisualGroup.lookAt(camera.position);
        if (miracleSunSystem.sunCoreMat) {
          _dnColorTmpA.setHex(0xffffff);
          _dnColorTmpB.setHex(0xff8c42);
          miracleSunSystem.sunCoreMat.color.copy(_dnColorTmpA).lerp(_dnColorTmpB, warmFactor);
          miracleSunSystem.sunCoreMat.opacity = Math.max(0, Math.min(1, (sunVisY + 26) / 60)) * (1.0 - nf * 0.85);
        }
        if (miracleSunSystem.sunHaloMats) {
          const opScale = Math.max(0, Math.min(1, (sunVisY + 26) / 60)) * (1.0 - nf * 0.85);
          miracleSunSystem.sunHaloMats.forEach(hm => {
            hm.mat.color.copy(hm.baseCol).lerp(hm.sunsetCol, warmFactor);
            hm.mat.opacity = hm.baseOp * opScale * (1.0 + warmFactor * 0.45);
          });
        }
      }
    }

    const moonDist = 415.0;
    const moonVisY = Math.sin(moonElev) * moonDist;
    if (miracleSunSystem.moonVisualGroup) {
      const twilightVis = Math.max(nf, sf * 0.55, rf * 0.55);
      const moonVisible = (t >= moonStart && t <= 1.0) && (moonVisY > -28) && (twilightVis > 0.04);
      miracleSunSystem.moonVisualGroup.visible = moonVisible;
      if (moonVisible) {
        miracleSunSystem.moonVisualGroup.position.set(
          focusX + Math.sin(moonAzim) * Math.cos(moonElev) * moonDist,
          focusY + moonVisY,
          focusZ - Math.cos(moonAzim) * Math.cos(moonElev) * moonDist
        );
        if (camera) miracleSunSystem.moonVisualGroup.lookAt(camera.position);
        const horizonElevFade = ep4Smoothstep(-0.02, 0.08, moonElev);
        const moonFade = ep4Smoothstep(0.04, 0.30, twilightVis) * horizonElevFade;
        const horizonWarm = 1.0 - ep4Smoothstep(0.02, 0.18, moonElev);
        if (miracleSunSystem.moonCoreMat) {
          miracleSunSystem.moonCoreMat.color.copy(_dnMoonCoolCol).lerp(_dnMoonWarmCol, horizonWarm * 0.28);
          miracleSunSystem.moonCoreMat.opacity = moonFade;
        }
        if (miracleSunSystem.moonHaloMats) {
          miracleSunSystem.moonHaloMats.forEach(hm => {
            hm.mat.opacity = hm.baseOp * moonFade;
          });
        }
      }
    }

    // 3) DirectionalLight (원본 낮 조명 색감/선명도 완전 복원 + 밤에는 강도 0으로 전역 그림자 제거)
    const sunDist = 88.0;
    const minDayElevY = THREE.MathUtils.lerp(0.48, 0.24, Math.max(warmFactor, nf));
    const lightElevY = Math.max(minDayElevY, _sunDirVec.y);
    const sunHorizLen = Math.max(0.0001, Math.hypot(_sunDirVec.x, _sunDirVec.z));
    const lightHorizLen = Math.sqrt(Math.max(0.0001, 1.0 - lightElevY * lightElevY));
    _dnLightDirVec.set(
      (_sunDirVec.x / sunHorizLen) * lightHorizLen,
      lightElevY,
      (_sunDirVec.z / sunHorizLen) * lightHorizLen
    ).normalize();
    miracleSunSystem.lastLightDir.copy(_dnLightDirVec);

    light.position.set(
      focusX + _dnLightDirVec.x * sunDist,
      focusY + _dnLightDirVec.y * sunDist,
      focusZ + _dnLightDirVec.z * sunDist
    );
    if (miracleSunSystem.lightTarget) {
      miracleSunSystem.lightTarget.position.set(focusX, focusY, focusZ);
      miracleSunSystem.lightTarget.updateMatrixWorld();
    }

    _dnColorTmpA.setHex(0xfff8dc);
    _dnColorTmpB.setHex(0xfb923c);
    _dnColorTmpA.lerp(_dnColorTmpB, warmFactor * 0.88);
    _dnColorTmpC.setHex(0x93c5fd);
    light.color.copy(_dnColorTmpA).lerp(_dnColorTmpC, nf * 0.5);
    const stormScale = 1.0 - (MiracleDayNight.stormDarkness || 0) * 0.45;
    // 낮에는 원본과 동일한 0.88 밝기 유지, 밤(nf >= 0.72)에는 평행광 강도 0으로 전역 그림자 제거
    const sunShadowFade = 1.0 - ep4Smoothstep(0.42, 0.72, nf);
    const baseDirInt = THREE.MathUtils.lerp(0.88, 0.72, warmFactor);
    light.intensity = baseDirInt * sunShadowFade * stormScale;

    if (window.coreAmbientLight) {
      _dnColorTmpA.setHex(0xffffff);
      _dnColorTmpB.setHex(0xfed7aa);
      _dnColorTmpA.lerp(_dnColorTmpB, warmFactor * 0.72);
      _dnColorTmpC.setHex(0x2c406c);
      window.coreAmbientLight.color.copy(_dnColorTmpA).lerp(_dnColorTmpC, nf);
      const dayAmb = THREE.MathUtils.lerp(0.62, 0.42, warmFactor);
      window.coreAmbientLight.intensity = THREE.MathUtils.lerp(dayAmb, 0.25, nf) * (1.0 - (MiracleDayNight.stormDarkness || 0) * 0.25);
    }

    if (window.coreHemiLight) {
      _dnColorTmpA.setHex(0x87ceeb);
      _dnColorTmpB.setHex(0xfb923c);
      _dnColorTmpA.lerp(_dnColorTmpB, warmFactor * 0.78);
      _dnColorTmpC.setHex(0x284a8a);
      window.coreHemiLight.color.copy(_dnColorTmpA).lerp(_dnColorTmpC, nf);

      _dnColorTmpA.setHex(0xc4ae72);
      _dnColorTmpB.setHex(0x9a5a32);
      _dnColorTmpA.lerp(_dnColorTmpB, warmFactor * 0.72);
      _dnColorTmpC.setHex(0x121b2e);
      window.coreHemiLight.groundColor.copy(_dnColorTmpA).lerp(_dnColorTmpC, nf);

      // 낮(nf=0, warmFactor=0)에는 반구광 0.0으로 원본 순백 채도 유지, 일몰/밤에만 자연스럽게 활성화
      const dayHemi = THREE.MathUtils.lerp(0.0, 0.18, warmFactor);
      window.coreHemiLight.intensity = THREE.MathUtils.lerp(dayHemi, 0.44, nf) * (1.0 - (MiracleDayNight.stormDarkness || 0) * 0.28);
    }

    // 4) 하늘 배경, 안개, 구름 색조 보간 (오픈월드·모든 스테이지 공용)
    sampleEp4SkyGradient(t, _dnColorTmpA, _dnColorTmpB, _dnColorTmpC);
    if (nf < 0.01 && warmFactor < 0.01 && typeof miracleIsPostResurrection !== 'undefined' && miracleIsPostResurrection) {
      _dnColorTmpA.setHex(0x60a5fa);
    }
    if (MiracleDayNight.stormDarkness > 0.01) {
      const sd = Math.min(1, MiracleDayNight.stormDarkness);
      _dnColorTmpA.lerp(_dnStormBgCol, sd * 0.65);
      _dnColorTmpB.lerp(_dnStormFogCol, sd * 0.65);
      _dnColorTmpC.lerp(_dnStormCloudCol, sd * 0.70);
    }
    if (scene.background && scene.background.isColor) {
      scene.background.copy(_dnColorTmpA);
    } else {
      scene.background = _dnColorTmpA.clone();
    }
    if (scene.fog && scene.fog.color) {
      scene.fog.color.copy(_dnColorTmpB);
    }

    const sdCloud = MiracleDayNight.stormDarkness || 0;
    const ambRes = tintMiracleCloudCollection(miracleAmbientProps, _dnColorTmpC, false, nf, sdCloud);
    let totalVisClouds = ambRes ? ambRes.visibleCount : 0;
    let maxCloudOp = ambRes ? ambRes.maxVisibleOp : 0;
    if (stMini && Array.isArray(stMini.skyClouds)) {
      const stageRes = tintMiracleCloudCollection(stMini.skyClouds, _dnColorTmpC, true, nf, sdCloud);
      if (stageRes) {
        totalVisClouds += stageRes.visibleCount;
        if (stageRes.maxVisibleOp > maxCloudOp) maxCloudOp = stageRes.maxVisibleOp;
      }
    }
    miracleSunSystem.lastVisibleClouds = totalVisClouds;
    miracleSunSystem.lastCloudOpacity = totalVisClouds > 0 ? maxCloudOp : 0;

    // 5) 밤하늘 그라데이션 돔 + 4색 촘촘한 별 반짝임 (산/맵 외곽 뒤 r=560..650)
    const showSky = nf > 0.08;
    const starVis = ep4Smoothstep(0.12, 0.52, nf) * (1.0 - (MiracleDayNight.stormDarkness || 0) * 0.45);
    if (miracleSunSystem.nightSkyGroup) {
      miracleSunSystem.nightSkyGroup.visible = showSky;
      miracleSunSystem.nightSkyGroup.position.set(focusX, focusY * 0.2, focusZ);
      if (showSky) {
        if (miracleSunSystem.skyDomeMat) {
          const domeOp = ep4Smoothstep(0.08, 0.56, nf) * (1.0 - (MiracleDayNight.stormDarkness || 0) * 0.35);
          miracleSunSystem.skyDomeMat.opacity = Math.max(0, Math.min(1, domeOp));
        }
        const layers = miracleSunSystem.starLayers || [];
        for (let l = 0; l < layers.length; l++) {
          const ly = layers[l];
          const twinkle = 0.72 + 0.28 * Math.sin(now * 0.0022 * ly.speed + ly.phase);
          ly.mat.opacity = Math.max(0, Math.min(1, starVis * twinkle));
        }
        miracleSunSystem.nightSkyGroup.rotation.y = (now * 0.000010) % (Math.PI * 2);
      }
    }

    // 5-B) 카메라 전방 시야 별똥별 + 2~3개 연속 유성우 버스트 (비회전 그룹)
    if (miracleSunSystem.meteorGroup) {
      miracleSunSystem.meteorGroup.visible = showSky;
      miracleSunSystem.meteorGroup.position.set(focusX, focusY * 0.2, focusZ);
      if (showSky) {
        const meteors = miracleSunSystem.meteors || [];
        const ms = miracleSunSystem.meteorShowerState;
        const canSpawnMeteor = (nf > 0.28) && ((MiracleDayNight.stormDarkness || 0) < 0.65);

        const spawnSingleMeteor = (baseAzim, baseElev, slopeSign, isBurstMember) => {
          let slot = null;
          for (let m = 0; m < meteors.length; m++) {
            if (!meteors[m].active) { slot = meteors[m]; break; }
          }
          if (!slot) return false;

          const az = baseAzim + (isBurstMember ? (Math.random() - 0.5) * 0.18 : 0);
          const el = THREE.MathUtils.clamp(baseElev + (isBurstMember ? (Math.random() - 0.5) * 0.065 : 0), 0.17, 0.58);
          const rad = 415 + Math.random() * 40;
          const cosEl = Math.cos(el);
          slot.pos.set(
            Math.sin(az) * cosEl * rad,
            Math.sin(el) * rad,
            Math.cos(az) * cosEl * rad
          );

          // 하늘을 가로질러 대각선 아래로 낙하하는 접선 속도 (연속 유성우는 평행 궤적 공유)
          const tangX = Math.cos(az) * slopeSign;
          const tangZ = -Math.sin(az) * slopeSign;
          const hSpeed = 235 + Math.random() * 75;
          const vDrop = -(66 + Math.random() * 38);
          slot.vel.set(tangX * hSpeed, vDrop, tangZ * hSpeed);

          _dnMeteorDir.copy(slot.vel).normalize();
          _dnMeteorQuat.setFromUnitVectors(_dnZAxis, _dnMeteorDir);
          slot.grp.quaternion.copy(_dnMeteorQuat);
          slot.grp.position.copy(slot.pos);

          const trailPalette = [0x93c5fd, 0xc4b5fd, 0xfef08a, 0xbae6fd];
          const trailCol = trailPalette[Math.floor(Math.random() * trailPalette.length)];
          slot.tailMat.color.setHex(trailCol);
          slot.headHaloMat.color.setHex(trailCol);

          slot.active = true;
          slot.age = 0;
          slot.maxDur = 0.85 + Math.random() * 0.45;
          slot.grp.visible = true;
          return true;
        };

        if (canSpawnMeteor && ms && dt > 0) {
          if (ms.burstRemaining > 0) {
            ms.burstGapTimer -= dt;
            if (ms.burstGapTimer <= 0) {
              spawnSingleMeteor(ms.burstBaseAzim, ms.burstBaseElev, ms.burstSlopeSign, true);
              ms.burstRemaining--;
              ms.burstGapTimer = 0.18 + Math.random() * 0.24;
            }
          } else {
            ms.nextEventTimer -= dt;
            if (ms.nextEventTimer <= 0) {
              let camAzim = Math.PI; // 기본 북쪽(-Z)
              let camPitch = 0;
              if (camera && typeof camera.getWorldDirection === 'function') {
                camera.getWorldDirection(_dnCamFwdVec);
                camAzim = Math.atan2(_dnCamFwdVec.x, _dnCamFwdVec.z);
                camPitch = Math.asin(THREE.MathUtils.clamp(_dnCamFwdVec.y, -0.9, 0.9));
              }
              const baseAzim = camAzim + (Math.random() - 0.5) * 1.45;
              const baseElev = camPitch > 0.14
                ? THREE.MathUtils.clamp(camPitch + 0.06 + Math.random() * 0.22, 0.22, 0.55)
                : (0.20 + Math.random() * 0.14); // 11.5° ~ 19.5° (기본 카메라 상단 시야 최적화)
              const slopeSign = Math.random() < 0.5 ? 1 : -1;

              // 45% 확률로 2~3개 연달아 떨어지는 연속 유성우 버스트, 55% 확률로 단발 별똥별
              const isBurst = Math.random() < 0.45;
              const burstTotal = isBurst ? (Math.random() < 0.52 ? 2 : 3) : 1;
              ms.burstBaseAzim = baseAzim;
              ms.burstBaseElev = baseElev;
              ms.burstSlopeSign = slopeSign;
              ms.burstCountTotal = burstTotal;

              spawnSingleMeteor(baseAzim, baseElev, slopeSign, false);
              ms.burstRemaining = burstTotal - 1;
              ms.burstGapTimer = 0.18 + Math.random() * 0.24;
              ms.nextEventTimer = isBurst ? (3.8 + Math.random() * 3.2) : (2.6 + Math.random() * 3.2);
            }
          }
        }

        for (let m = 0; m < meteors.length; m++) {
          const mt = meteors[m];
          if (!mt.active) continue;
          mt.age += dt;
          if (mt.age >= mt.maxDur) {
            mt.active = false;
            mt.grp.visible = false;
            mt.headMat.opacity = 0;
            mt.headHaloMat.opacity = 0;
            mt.innerTailMat.opacity = 0;
            mt.tailMat.opacity = 0;
          } else {
            mt.pos.addScaledVector(mt.vel, dt);
            mt.grp.position.copy(mt.pos);
            const prog = mt.age / mt.maxDur;
            const lifeFade = Math.sin(prog * Math.PI) * Math.max(0.35, starVis);
            mt.headMat.opacity = Math.min(1, lifeFade * 1.15);
            mt.headHaloMat.opacity = lifeFade * 0.52;
            mt.innerTailMat.opacity = lifeFade * 0.92;
            mt.tailMat.opacity = lifeFade * 0.68;
          }
        }
      }
    }

    // 6) 점토 캐릭터 자가발광 밤 보정 + 점광원/그림자 풀 갱신 + HUD 동기화
    if (typeof window.updateHeroClayEmissiveForNight === 'function') {
      window.updateHeroClayEmissiveForNight(nf);
    }
    updateMiraclePooledNightLights(focusX, focusZ, nf, now);
    MiracleDayNight._hudSyncTimer += dt;
    if (MiracleDayNight._hudSyncTimer >= 0.12) {
      MiracleDayNight._hudSyncTimer = 0;
      if (typeof window.syncMiracleTimeHUD === 'function') window.syncMiracleTimeHUD();
    }
  }

  const curNf = isDayNightActive ? MiracleDayNight.nightFactor : 0;
  if (!miracleSunSystem.cullBuilt) {
    updateMiracleShadowDistanceCulling(focusX, focusZ, curNf);
  } else {
    miracleSunSystem.cullTimer += dt;
    if (miracleSunSystem.cullTimer >= 0.25) {
      miracleSunSystem.cullTimer = 0;
      updateMiracleShadowDistanceCulling(focusX, focusZ, curNf);
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

  const innerCuff = createLowPolyMesh(new THREE.CylinderGeometry(0.095, 0.105, 0.08, 8), cuffHex, 0, -0.50, 0);
  // 둥글고 부드러운 소프트 로우 폴리곤 예수님 손 (손목 + 둥근 손바닥 + 자연스럽게 모인 손가락 + 둥근 엄지)
  const wrist = createLowPolyMesh(new THREE.CylinderGeometry(0.056, 0.052, 0.06, 8), skinHex, 0, -0.535, 0.005, false);
  const palm = createLowPolyMesh(new THREE.IcosahedronGeometry(0.072, 1), skinHex, 0, -0.59, 0.012);
  palm.scale.set(0.95, 1.12, 0.56);
  const fingers = createLowPolyMesh(new THREE.DodecahedronGeometry(0.056, 0), skinHex, -side * 0.008, -0.665, 0.018);
  fingers.scale.set(0.92, 1.08, 0.44);
  fingers.rotation.x = 0.16;
  fingers.rotation.z = -side * 0.14;
  const fingerTips = createLowPolyMesh(new THREE.DodecahedronGeometry(0.044, 0), skinHex, -side * 0.012, -0.71, 0.028, false);
  fingerTips.scale.set(0.88, 0.72, 0.42);
  const thumb = createLowPolyMesh(new THREE.DodecahedronGeometry(0.036, 0), skinHex, -side * 0.058, -0.60, 0.042, false);
  thumb.scale.set(0.75, 1.38, 0.72);
  thumb.rotation.z = side * 0.42;
  thumb.rotation.x = 0.25;

  pivot.add(innerCuff, wrist, palm, fingers, fingerTips, thumb);
  armGrp.add(pivot);
  armGrp.userData.handStyle = 'soft_lowpoly_rounded';
  armGrp.userData.handPivot = pivot;
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

  const handGrip = new THREE.Object3D();
  handGrip.name = isLeft ? 'handGripL' : 'handGripR';
  handGrip.position.set(0, -0.24, 0.03);

  lowerArmGrp.add(palm, fingers, thumb, handGrip);
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

// 온라인 멀티플레이 전용 어린이 대원(패스파인더 · 어드벤처러) 오른팔 어깨 로고 텍스처 · 패치 캐시
const CLUB_SHOULDER_LOGO_URLS = {
  pathfinder: 'assets/img/pathfinder_logo.png?v=21',
  adventurer: 'assets/img/adventurer_logo.png?v=21'
};
const CLUB_SHOULDER_LOGO_FALLBACK_DATA_URIS = {
  pathfinder: 'data:image/png;base64,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',
  adventurer: 'data:image/png;base64,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'
};
const _clubShoulderLogoMatCache = {};
const _clubShoulderPatchGeoCache = {};

function getClubShoulderLogoMaterial(clubKey) {
  if (!CLUB_SHOULDER_LOGO_URLS[clubKey]) return null;
  if (_clubShoulderLogoMatCache[clubKey]) return _clubShoulderLogoMatCache[clubKey];

  let blankCanvas = null;
  if (typeof document !== 'undefined') {
    blankCanvas = document.createElement('canvas');
    blankCanvas.width = 1;
    blankCanvas.height = 1;
  }
  const tex = new THREE.Texture(blankCanvas);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 4;
  if (blankCanvas) tex.needsUpdate = true;
  tex.userData = { _cached: true };

  const mat = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    map: tex,
    emissive: new THREE.Color(0x2e2e2e),
    emissiveMap: tex,
    shininess: 0,
    specular: 0x000000,
    transparent: true,
    alphaTest: 0.15,
    side: THREE.FrontSide,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2
  });
  mat.userData = { _cached: true };

  const applyDataUriFallback = () => {
    const uri = CLUB_SHOULDER_LOGO_FALLBACK_DATA_URIS[clubKey];
    if (!uri || uri.startsWith('__')) return;
    const img = new Image();
    img.onload = () => {
      tex.image = img;
      tex.needsUpdate = true;
      mat.needsUpdate = true;
    };
    img.src = uri;
  };

  if (typeof location !== 'undefined' && location.protocol === 'file:') {
    applyDataUriFallback();
  } else {
    const loader = new THREE.TextureLoader();
    loader.load(
      CLUB_SHOULDER_LOGO_URLS[clubKey],
      (loadedTex) => {
        tex.image = loadedTex.image;
        tex.needsUpdate = true;
        mat.needsUpdate = true;
        loadedTex.dispose();
      },
      undefined,
      applyDataUriFallback
    );
  }

  _clubShoulderLogoMatCache[clubKey] = mat;
  return mat;
}

function getClubShoulderPatchGeo(clubKey) {
  if (_clubShoulderPatchGeoCache[clubKey]) return _clubShoulderPatchGeoCache[clubKey];
  const isAdv = (clubKey === 'adventurer');
  const patchH = isAdv ? 0.172 : 0.162;
  const thetaLength = isAdv ? 1.274 : 1.20;
  const thetaStart = Math.PI * 1.5 - thetaLength * 0.5;
  const geo = new THREE.CylinderGeometry(0.133, 0.137, patchH, 12, 1, true, thetaStart, thetaLength);
  markCachedGeo(geo);
  _clubShoulderPatchGeoCache[clubKey] = geo;
  return geo;
}

// 온라인 멀티플레이 전용 어린이 대원(패스파인더 · 어드벤처러) 소프트 로우폴리 반팔 팔 빌더
function createKidShortSleeveArm(isLeft, shirtHex, cuffHex, skinHex, clubLogoKey = null) {
  const side = isLeft ? -1 : 1;
  const armGrp = new THREE.Group();
  armGrp.position.set(side * 0.27, 1.46, 0.0);

  const sleevePivot = new THREE.Group();
  sleevePivot.rotation.z = side * 0.20;

  // 반팔 소매 어깨 캡 & 짧은 통소매
  const shoulderCap = createLowPolyMesh(new THREE.DodecahedronGeometry(0.128, 0), shirtHex, 0, 0.01, 0);
  shoulderCap.scale.set(1.0, 0.88, 0.96);
  const shortSleeve = createLowPolyMesh(new THREE.CylinderGeometry(0.115, 0.132, 0.24, 7), shirtHex, 0, -0.11, 0);
  const sleeveCuff = createLowPolyMesh(new THREE.CylinderGeometry(0.134, 0.136, 0.036, 7), cuffHex, 0, -0.22, 0, false);
  sleevePivot.add(shoulderCap, shortSleeve, sleeveCuff);

  // 캐릭터가 +Z 정면을 향하므로 isLeft(side=-1, x=-0.27)이 해부학적 오른팔 — 오른쪽 어깨 소매 외측에 대원 로고 패치 부착!
  if (isLeft && (clubLogoKey === 'pathfinder' || clubLogoKey === 'adventurer')) {
    const logoMat = getClubShoulderLogoMaterial(clubLogoKey);
    const logoGeo = getClubShoulderPatchGeo(clubLogoKey);
    if (logoMat && logoGeo) {
      const logoPatch = new THREE.Mesh(logoGeo, logoMat);
      logoPatch.name = 'clubShoulderLogo';
      logoPatch.position.set(0, -0.098, 0);
      logoPatch.castShadow = false;
      logoPatch.receiveShadow = false;
      sleevePivot.add(logoPatch);
    }
  }

  // 반팔 아래 드러난 맨팔(전완)과 소프트 로우폴리 손
  const lowerArmGrp = new THREE.Group();
  lowerArmGrp.position.set(0, -0.23, 0);
  lowerArmGrp.rotation.z = -side * 0.10;

  const bareArm = createLowPolyMesh(new THREE.CylinderGeometry(0.076, 0.068, 0.30, 6), skinHex, 0, -0.15, 0);
  const palm = createLowPolyMesh(new THREE.BoxGeometry(0.095, 0.11, 0.11), skinHex, 0, -0.34, 0.01);
  const fingers = createLowPolyMesh(new THREE.BoxGeometry(0.084, 0.075, 0.095), skinHex, -side * 0.014, -0.41, 0.01);
  fingers.rotation.z = -side * 0.22;
  const thumb = createLowPolyMesh(new THREE.BoxGeometry(0.042, 0.07, 0.05), skinHex, -side * 0.048, -0.35, 0.06, false);
  thumb.rotation.x = 0.28;

  lowerArmGrp.add(bareArm, palm, fingers, thumb);
  sleevePivot.add(lowerArmGrp);
  armGrp.add(sleevePivot);
  return armGrp;
}

// -------------------------------------------------------------------------
// 4B. [에피소드 4 플레이어 전용] 디테일 소프트 로우 폴리곤(Soft Low-Poly) 모델 · 재질 빌더
// - 무광 점토/목각 인형 질감(flatShading + 높은 roughness + 낮은 metalness)
// - 약 4~4.5등신 소년 체형, 층이 진 뾰족한 헤어, 크림 아이보리 튜닉(청록·금색 띠),
//   청록 망토 & 우측 가슴 금색 브로치, 가죽 벨트 & 크로스백 파우치, 아대 & 스트랩 샌들
// -------------------------------------------------------------------------
const HERO_CLAY_PALETTE = {
  hair: '#4A3222',
  brow: '#3B2516',
  skin: '#F2D3B8',
  eye: '#1E1815',
  mouth: '#C97A6B',
  tunic: '#EFE9D8',
  tunicTeal: '#1F6E7A',
  tunicGold: '#C59B43',
  cape: '#1E6F7D',
  capeInner: '#175763',
  broochGold: '#D4A843',
  broochInset: '#9A7222',
  buckleGold: '#C89B3C',
  beltLeather: '#7A4E2D',
  pouchLeather: '#855632',
  bracerLeather: '#633E24',
  soleLeather: '#4E311B'
};

// [턴어라운드 레퍼런스 기반] 세리장 삭개오 전용 소프트 로우폴리 클레이 팔레트
const ZACCHAEUS_CLAY_PALETTE = {
  skin: '#EFC09F',
  hair: '#6E4226',
  beard: '#5D361E',
  brow: '#4D2C18',
  eye: '#221712',
  mouth: '#B86B58',
  tunic: '#ECE3CD',
  tunicTrim: '#DFD4B8',
  tunicHem: '#C9A45C',
  belt: '#7C4D2D',
  pouch: '#87522D',
  pouchFlap: '#6D3F20',
  pouchStud: '#D4A843',
  bracer: '#6E4124',
  bracerTrim: '#59341C',
  sandalStrap: '#734427',
  sandalSole: '#A6774E'
};

// PBR MeshStandardMaterial이 환경맵 없는 에피소드4 조명 아래에서 칙칙하게 죽지 않도록 따뜻한 자가 발광 보정 적용
const HERO_CLAY_EMISSIVE = {
  '#F2D3B8': 0.34,
  '#EFE9D8': 0.34,
  '#4A3222': 0.24,
  '#3B2516': 0.16,
  '#1E1815': 0.06,
  '#C97A6B': 0.28,
  '#1E6F7D': 0.24,
  '#1F6E7A': 0.24,
  '#175763': 0.20,
  '#D4A843': 0.28,
  '#C89B3C': 0.28,
  '#C59B43': 0.28,
  '#9A7222': 0.20,
  '#7A4E2D': 0.24,
  '#855632': 0.24,
  '#633E24': 0.22,
  '#4E311B': 0.20,
  '#EFC09F': 0.34,
  '#6E4226': 0.24,
  '#5D361E': 0.22,
  '#4D2C18': 0.18,
  '#221712': 0.06,
  '#B86B58': 0.28,
  '#ECE3CD': 0.34,
  '#DFD4B8': 0.32,
  '#C9A45C': 0.28,
  '#7C4D2D': 0.24,
  '#87522D': 0.24,
  '#6D3F20': 0.22,
  '#6E4124': 0.22,
  '#59341C': 0.20,
  '#734427': 0.22,
  '#A6774E': 0.24
};

const _heroSoftClayMatCache = {};
function matHeroClay(hexColor, roughness = 0.86, metalness = 0.04, side = THREE.FrontSide, emissiveIntensity = null) {
  const emi = (emissiveIntensity !== null && emissiveIntensity !== undefined)
    ? emissiveIntensity
    : (HERO_CLAY_EMISSIVE[hexColor] !== undefined ? HERO_CLAY_EMISSIVE[hexColor] : 0.24);
  const key = `${hexColor}_${roughness}_${metalness}_${side}_${emi}`;
  if (!_heroSoftClayMatCache[key]) {
    const m = new THREE.MeshStandardMaterial({
      color: hexColor,
      emissive: hexColor,
      emissiveIntensity: emi,
      flatShading: true,
      roughness,
      metalness,
      side
    });
    m.userData = { _cached: true, _baseEmissive: emi };
    _heroSoftClayMatCache[key] = m;
  }
  return _heroSoftClayMatCache[key];
}

function updateHeroClayEmissiveForNight(nightFactor) {
  const nf = Math.max(0, Math.min(1, nightFactor || 0));
  const mult = 1.0 - nf * 0.64;
  for (const key in _heroSoftClayMatCache) {
    const mat = _heroSoftClayMatCache[key];
    if (mat && mat.userData && typeof mat.userData._baseEmissive === 'number') {
      mat.emissiveIntensity = mat.userData._baseEmissive * mult;
    }
  }
}
window.updateHeroClayEmissiveForNight = updateHeroClayEmissiveForNight;

function createHeroClayMesh(geo, hexColor, x = 0, y = 0, z = 0, opts = {}) {
  const {
    roughness = 0.86,
    metalness = 0.04,
    side = THREE.FrontSide,
    emissiveIntensity = null,
    castShadow = true
  } = opts;
  const m = new THREE.Mesh(geo, matHeroClay(hexColor, roughness, metalness, side, emissiveIntensity));
  m.position.set(x, y, z);
  if (castShadow) {
    m.castShadow = true;
    m.receiveShadow = true;
  }
  return m;
}

function heroSkirtProfile(t) {
  const k = Math.pow(Math.max(0, Math.min(1, t)), 0.92);
  return {
    y: 1.04 - t * 0.60,
    rx: 0.248 + k * 0.124,
    rz: 0.190 + k * 0.112
  };
}

let _heroBoyHeadGeo = null;
function getHeroBoyHeadGeo() {
  if (_heroBoyHeadGeo) return _heroBoyHeadGeo;

  // 10-각 다면체 역오각형 소년 두상 (넓은 이마·광대 -> 각진 턱선 -> 부드럽고 좁은 턱끝)
  const colProfile = [
    [ 0.00,  1.00], // 0: 정면 중앙
    [ 0.56,  0.93], // 1: 정면 좌측 안면 코너
    [ 0.96,  0.48], // 2: 좌측 광대/관자놀이
    [ 1.00, -0.12], // 3: 좌측 귀 뿌리
    [ 0.72, -0.76], // 4: 좌측 후두부
    [ 0.00, -1.00], // 5: 후면 중앙
    [-0.72, -0.76], // 6: 우측 후두부
    [-1.00, -0.12], // 7: 우측 귀 뿌리
    [-0.96,  0.48], // 8: 우측 광대/관자놀이
    [-0.56,  0.93]  // 9: 정면 우측 안면 코너
  ];

  const ringSpecs = [
    { y:  0.235, rx: 0.232, rz: 0.228, zOff: -0.012 }, // 0: 상부 정수리
    { y:  0.135, rx: 0.284, rz: 0.252, zOff: -0.002 }, // 1: 넓은 이마·관자
    { y:  0.005, rx: 0.286, rz: 0.254, zOff:  0.000 }, // 2: 눈·중안면 최대폭
    { y: -0.085, rx: 0.276, rz: 0.248, zOff:  0.004 }, // 3: 광대 코너 (역오각형 꺾임)
    { y: -0.175, rx: 0.186, rz: 0.198, zOff:  0.022 }, // 4: 턱선 급격 테이퍼
    { y: -0.242, rx: 0.082, rz: 0.118, zOff:  0.046 }  // 5: 좁고 부드러운 턱끝
  ];

  const cols = colProfile.length;
  const rings = [];
  for (let r = 0; r < ringSpecs.length; r++) {
    const sp = ringSpecs[r];
    const row = [];
    for (let c = 0; c < cols; c++) {
      row.push([
        colProfile[c][0] * sp.rx,
        sp.y,
        colProfile[c][1] * sp.rz + sp.zOff
      ]);
    }
    rings.push(row);
  }

  const apexTop = [0, 0.282, -0.015];
  const apexBot = [0, -0.248, 0.025];
  const v = [];

  for (let c = 0; c < cols; c++) {
    const cn = (c + 1) % cols;
    pushTriangle(v, apexTop, rings[0][c], rings[0][cn]);
    pushTriangle(v, apexBot, rings[ringSpecs.length - 1][cn], rings[ringSpecs.length - 1][c]);
  }
  for (let r = 0; r < ringSpecs.length - 1; r++) {
    for (let c = 0; c < cols; c++) {
      const cn = (c + 1) % cols;
      pushQuad(v, rings[r][c], rings[r + 1][c], rings[r + 1][cn], rings[r][cn]);
    }
  }

  _heroBoyHeadGeo = markCachedGeo(buildBufferGeoFromTriangles(v));
  return _heroBoyHeadGeo;
}

let _heroEyeGeo = null;
function getHeroEyeGeo() {
  if (_heroEyeGeo) return _heroEyeGeo;
  const geo = new THREE.CylinderGeometry(0.025, 0.025, 0.026, 6);
  geo.rotateX(Math.PI / 2);
  geo.scale(0.98, 1.92, 1.0);
  const finalGeo = markCachedGeo(geo.toNonIndexed());
  finalGeo.computeVertexNormals();
  geo.dispose();
  _heroEyeGeo = finalGeo;
  return _heroEyeGeo;
}

let _heroBrowGeoL = null;
let _heroBrowGeoR = null;
function getHeroBrowGeo(isLeft = false) {
  if (isLeft && _heroBrowGeoL) return _heroBrowGeoL;
  if (!isLeft && _heroBrowGeoR) return _heroBrowGeoR;

  // 바깥쪽이 사선으로 깎여 내려가는 두꺼운 사다리꼴 사각형 눈썹 (#3B2516, 턴어라운드 레퍼런스 대칭형)
  const side = isLeft ? -1 : 1;
  const fA = [side * (-0.044),  0.020,  0.013]; // 안쪽 상단
  const fB = [side * ( 0.022),  0.020,  0.013]; // 바깥쪽 상단 (윗변이 짧아 외곽이 바깥쪽으로 경사짐)
  const fC = [side * ( 0.056), -0.020,  0.013]; // 바깥쪽 하단 (눈 바깥까지 뻗은 경사각)
  const fD = [side * (-0.048), -0.014,  0.013]; // 안쪽 하단

  const bA = [fA[0], fA[1], -0.014];
  const bB = [fB[0], fB[1], -0.014];
  const bC = [fC[0], fC[1], -0.014];
  const bD = [fD[0], fD[1], -0.014];

  const v = [];
  const emitQuad = (a, b, c, d) => {
    if (side > 0) pushQuad(v, a, b, c, d);
    else pushQuad(v, a, d, c, b);
  };
  emitQuad(fA, fD, fC, fB); // 정면 (+Z)
  emitQuad(bA, bB, bC, bD); // 후면 (-Z)
  emitQuad(bA, fA, fB, bB); // 윗면 (+Y)
  emitQuad(bB, fB, fC, bC); // 바깥쪽 사선 경사면
  emitQuad(bC, fC, fD, bD); // 아랫면 (-Y)
  emitQuad(bD, fD, fA, bA); // 안쪽 미간면

  const geo = markCachedGeo(buildBufferGeoFromTriangles(v));
  if (isLeft) _heroBrowGeoL = geo;
  else _heroBrowGeoR = geo;
  return geo;
}

let _heroSmileGeo = null;
function getHeroSmileGeo() {
  if (_heroSmileGeo) return _heroSmileGeo;
  // 작고 부드러운 역삼각형/미소 입 (#C97A6B, 치아 없이 자연스러운 입매)
  const segs = 6;
  const w = 0.052;
  const v = [];
  const topPts = [];
  const botPts = [];
  const backTop = [];
  const backBot = [];

  for (let i = 0; i <= segs; i++) {
    const u = (i / segs) * 2 - 1;
    const x = u * w;
    const zCurve = -u * u * 0.008;
    const yTop = 0.011 - u * u * 0.004;
    const yBot = -0.020 + u * u * 0.027;
    topPts.push([x, yTop, zCurve + 0.009]);
    botPts.push([x, yBot, zCurve + 0.009]);
    backTop.push([x * 0.92, yTop, zCurve - 0.014]);
    backBot.push([x * 0.92, yBot, zCurve - 0.014]);
  }
  for (let i = 0; i < segs; i++) {
    pushQuad(v, topPts[i], botPts[i], botPts[i + 1], topPts[i + 1]);
    pushQuad(v, backTop[i], topPts[i], topPts[i + 1], backTop[i + 1]);
    pushQuad(v, botPts[i], backBot[i], backBot[i + 1], botPts[i + 1]);
    pushQuad(v, backBot[i], backTop[i], backTop[i + 1], backBot[i + 1]);
  }
  pushQuad(v, backTop[0], backBot[0], botPts[0], topPts[0]);
  pushQuad(v, topPts[segs], botPts[segs], backBot[segs], backTop[segs]);

  _heroSmileGeo = markCachedGeo(buildBufferGeoFromTriangles(v));
  return _heroSmileGeo;
}

let _heroBoyHairCapGeo = null;
function getHeroBoyHairCapGeo() {
  if (_heroBoyHairCapGeo) return _heroBoyHairCapGeo;

  const cols = 14;
  const rows = 5;
  const outerRings = [];
  const innerRings = [];

  const apexOut = [-0.012, 0.376, -0.022];
  const apexIn  = [0, 0.245, -0.014];

  for (let r = 1; r <= rows; r++) {
    const oRow = [];
    const iRow = [];
    const vFrac = r / rows;
    for (let c = 0; c < cols; c++) {
      const phi = (c / cols) * Math.PI * 2;
      const sinP = Math.sin(phi);
      const cosP = Math.cos(phi);

      const frontMask = Math.pow(Math.max(0, cosP), 1.45);
      const backMask  = Math.max(0, -cosP);
      const sideMask  = Math.max(0, 1 - frontMask - backMask);

      // 오른쪽 이마(phi≈2π-0.42) 가르마 부근만 자연스럽게 열어주고 좌우 측두·귀 위는 깊게 덮어 피부 틈 차단
      const dPart = Math.atan2(Math.sin(phi + 0.42), Math.cos(phi + 0.42));
      const partNotch = Math.exp(-Math.pow(dPart / 0.30, 2)) * 0.14;

      let thetaMax = 1.16 * frontMask + 2.24 * backMask + 1.72 * sideMask;
      thetaMax -= partNotch * frontMask;
      thetaMax += 0.035 * Math.cos(phi * 4) * backMask;

      const theta = vFrac * thetaMax;
      const sinT = Math.sin(theta);
      const cosT = Math.cos(theta);

      const ridge = 0.008 * Math.sin(phi * 5 + r * 0.85) + 0.006 * Math.cos(phi * 3 - r * 1.1);
      const backVol = backMask * Math.sin(vFrac * Math.PI) * 0.064;
      const thick = 0.042 * (0.78 + 0.30 * Math.sin(vFrac * Math.PI)) + ridge;
      // 귀 주변 하단은 두피에 밀착시켜 귀 윗선과 구레나룻이 틈 없이 이어지도록 보정
      const earTuck = (r >= rows - 1)
        ? Math.exp(-Math.pow((cosP + 0.06) / 0.24, 2)) * Math.pow(Math.abs(sinP), 3.0) * (r === rows ? 0.036 : 0.016)
        : 0;

      const rx = 0.308 + thick - earTuck;
      const ry = 0.304 + thick * 0.90;
      const rz = 0.272 + thick + backVol;

      let ox = sinP * sinT * rx;
      let oy = cosT * ry + 0.010;
      let oz = cosP * sinT * rz - 0.012;

      if (r === rows && backMask > 0.25) {
        ox *= 0.86;
        oz += 0.032 * backMask;
      }

      const inScale = (r === rows) ? 0.82 : 0.84;
      oRow.push([ox, oy, oz]);
      iRow.push([ox * inScale, (oy - 0.010) * 0.88 + 0.010, oz * inScale]);
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

  _heroBoyHairCapGeo = markCachedGeo(buildBufferGeoFromTriangles(v));
  return _heroBoyHairCapGeo;
}

let _heroHairSpikeGeo = null;
function getHeroHairSpikeGeo() {
  if (_heroHairSpikeGeo) return _heroHairSpikeGeo;
  const bN = [ 0.00, 0.00,  0.56];
  const bE = [ 0.62, 0.00,  0.00];
  const bS = [ 0.00, 0.00, -0.56];
  const bW = [-0.62, 0.00,  0.00];

  const mN = [ 0.00, 0.56,  0.46];
  const mE = [ 0.48, 0.56,  0.06];
  const mS = [ 0.00, 0.56, -0.34];
  const mW = [-0.48, 0.56,  0.06];

  const tip = [0.00, 1.00, 0.12];

  const v = [];
  pushQuad(v, bN, bW, bS, bE);
  pushQuad(v, bN, bE, mE, mN);
  pushQuad(v, bE, bS, mS, mE);
  pushQuad(v, bS, bW, mW, mS);
  pushQuad(v, bW, bN, mN, mW);
  pushTriangle(v, mN, mE, tip);
  pushTriangle(v, mE, mS, tip);
  pushTriangle(v, mS, mW, tip);
  pushTriangle(v, mW, mN, tip);

  _heroHairSpikeGeo = markCachedGeo(buildBufferGeoFromTriangles(v));
  return _heroHairSpikeGeo;
}

let _heroBangChunkGeo = null;
function getHeroBangChunkGeo() {
  if (_heroBangChunkGeo) return _heroBangChunkGeo;
  // 위(y=0)에서 아래(y=-1.0)로 흘러내리는 굵직한 6각 로우폴리 앞머리·뒷머리 가닥
  const top = [
    [ 0.00, 0.00,  0.46],
    [ 0.46, 0.00,  0.14],
    [ 0.52, 0.00, -0.22],
    [ 0.00, 0.00, -0.44],
    [-0.52, 0.00, -0.22],
    [-0.46, 0.00,  0.14]
  ];
  const mid = [
    [ 0.00, -0.54,  0.52],
    [ 0.44, -0.54,  0.16],
    [ 0.48, -0.54, -0.20],
    [ 0.00, -0.54, -0.38],
    [-0.48, -0.54, -0.20],
    [-0.44, -0.54,  0.16]
  ];
  const topC = [0.00,  0.05, 0.00];
  const tip  = [0.00, -1.00, 0.04];

  const v = [];
  const cols = top.length;
  for (let c = 0; c < cols; c++) {
    const cn = (c + 1) % cols;
    pushTriangle(v, topC, top[c], top[cn]);
    pushQuad(v, top[c], mid[c], mid[cn], top[cn]);
    pushTriangle(v, mid[c], tip, mid[cn]);
  }
  _heroBangChunkGeo = markCachedGeo(buildBufferGeoFromTriangles(v));
  return _heroBangChunkGeo;
}

let _heroSideburnGeo = null;
function getHeroSideburnGeo() {
  if (_heroSideburnGeo) return _heroSideburnGeo;
  // 윗머리 캡 내부(y=+0.185)에 깊숙이 뿌리를 내리고 귀 앞뿌리를 여유 있게 덮어(-0.065..+0.062) 피부 틈을 0%로 막는 관자·구레나룻 블록
  const rings = [
    [
      [ 0.000,  0.185,  0.060],
      [ 0.046,  0.185,  0.024],
      [ 0.048,  0.185, -0.036],
      [ 0.000,  0.185, -0.065],
      [-0.048,  0.185, -0.036],
      [-0.046,  0.185,  0.024]
    ],
    [
      [ 0.000,  0.025,  0.062],
      [ 0.048,  0.025,  0.026],
      [ 0.048,  0.025, -0.038],
      [ 0.000,  0.025, -0.065],
      [-0.048,  0.025, -0.038],
      [-0.048,  0.025,  0.026]
    ],
    [
      [ 0.000, -0.065,  0.038],
      [ 0.034, -0.065,  0.014],
      [ 0.034, -0.065, -0.024],
      [ 0.000, -0.065, -0.042],
      [-0.034, -0.065, -0.024],
      [-0.034, -0.065,  0.014]
    ]
  ];
  const topC = [0.000,  0.200, -0.002];
  const tip  = [0.000, -0.112, -0.004];

  const v = [];
  const cols = 6;
  for (let c = 0; c < cols; c++) {
    const cn = (c + 1) % cols;
    pushTriangle(v, topC, rings[0][c], rings[0][cn]);
    pushQuad(v, rings[0][c], rings[1][c], rings[1][cn], rings[0][cn]);
    pushQuad(v, rings[1][c], rings[2][c], rings[2][cn], rings[1][cn]);
    pushTriangle(v, rings[2][c], tip, rings[2][cn]);
  }
  _heroSideburnGeo = markCachedGeo(buildBufferGeoFromTriangles(v));
  return _heroSideburnGeo;
}

function createHeroBoyHairGroup() {
  const hairGrp = new THREE.Group();
  hairGrp.name = 'hair';

  const hCol = HERO_CLAY_PALETTE.hair;
  hairGrp.add(createHeroClayMesh(getHeroBoyHairCapGeo(), hCol, 0, 0, 0, { roughness: 0.88, metalness: 0.03 }));

  const spikeGeo = getHeroHairSpikeGeo();
  const bangGeo  = getHeroBangChunkGeo();
  const sideGeo  = getHeroSideburnGeo();

  const addMesh = (geo, x, y, z, sx, sy, sz, rx, ry, rz, shadow = true) => {
    const m = createHeroClayMesh(geo, hCol, x, y, z, { roughness: 0.88, metalness: 0.03, castShadow: shadow });
    m.scale.set(sx, sy, sz);
    m.rotation.set(rx, ry, rz);
    hairGrp.add(m);
  };

  // 1) 비대칭 가르마 앞머리 (캐릭터 우측 이마 -X 에서 갈라져 좌측 +X 로 풍성하고 길게 겹쳐 내려옴)
  addMesh(bangGeo, -0.238, 0.258, 0.195, 0.135, 0.195, 0.088, -0.24,  0.48, -0.18); // 우측 관자 프레이밍 가닥
  addMesh(bangGeo, -0.165, 0.285, 0.214, 0.132, 0.160, 0.084, -0.28,  0.24, -0.22); // 가르마 우측 짧은 앞머리 (삼각형 이마 여백 연출)
  addMesh(bangGeo, -0.082, 0.305, 0.208, 0.175, 0.235, 0.094, -0.34,  0.10,  0.42); // 가르마 메인 1 (우->좌 사선)
  addMesh(bangGeo,  0.022, 0.308, 0.216, 0.188, 0.242, 0.102, -0.34, -0.04,  0.38); // 가르마 메인 2 (중앙->좌 길게)
  addMesh(bangGeo,  0.138, 0.294, 0.212, 0.186, 0.224, 0.104, -0.30, -0.26,  0.32); // 좌측 이마 사선 겹침
  addMesh(bangGeo,  0.218, 0.274, 0.182, 0.162, 0.218, 0.106, -0.24, -0.46,  0.18); // 좌측 관자·구레나룻 연결

  // 2) 정수리·상부 실루엣 다각형 볼륨 (뿔처럼 뾰족하게 튀어나오지 않는 둥근-각진 소년 헤어 실루엣)
  addMesh(spikeGeo, -0.075, 0.315,  0.020, 0.245, 0.110, 0.215,  0.08,  0.28,  0.30);
  addMesh(spikeGeo,  0.082, 0.312, -0.020, 0.235, 0.108, 0.210, -0.14, -0.24, -0.28);
  addMesh(spikeGeo,  0.000, 0.305, -0.125, 0.245, 0.108, 0.195, -0.52,  0.00,  0.00);
  addMesh(spikeGeo, -0.225, 0.245,  0.060, 0.145, 0.145, 0.115,  0.12,  0.20,  0.96);

  // 3) 뒤통수 & 목선 위 다각형 뒷머리 (후두부 곡선을 따라 아래·목덜미 안쪽으로 자연스럽게 감싸 내려옴)
  addMesh(bangGeo, -0.135, 0.245, -0.275, 0.185, 0.215, 0.095,  0.22,  0.38, -0.10);
  addMesh(bangGeo,  0.000, 0.255, -0.292, 0.205, 0.225, 0.100,  0.22,  0.00,  0.00);
  addMesh(bangGeo,  0.135, 0.245, -0.275, 0.185, 0.215, 0.095,  0.22, -0.38,  0.10);

  addMesh(bangGeo, -0.175, 0.055, -0.290, 0.148, 0.195, 0.084, -0.44,  0.42, -0.08, false);
  addMesh(bangGeo, -0.062, 0.048, -0.318, 0.160, 0.205, 0.088, -0.46,  0.14, -0.03, false);
  addMesh(bangGeo,  0.062, 0.048, -0.318, 0.160, 0.205, 0.088, -0.46, -0.14,  0.03, false);
  addMesh(bangGeo,  0.175, 0.055, -0.290, 0.148, 0.195, 0.084, -0.44, -0.42,  0.08, false);

  // 4) 귀 앞 구레나룻 & 귀 뒤 연결 모발 (양쪽 모두 윗머리 캡과 귀 뿌리를 빈틈없이 연결)
  addMesh(sideGeo, -0.282,  0.042,  0.056, 1.00, 1.00, 1.00,  0.02, 0.0,  0.03, false);
  addMesh(sideGeo,  0.282,  0.042,  0.056, 1.00, 1.00, 1.00,  0.02, 0.0, -0.03, false);
  addMesh(sideGeo, -0.268, -0.010, -0.095, 0.95, 1.08, 1.12, -0.06, 0.0,  0.04, false);
  addMesh(sideGeo,  0.268, -0.010, -0.095, 0.95, 1.08, 1.12, -0.06, 0.0, -0.04, false);

  return hairGrp;
}

let _heroTunicSkirtGeo = null;
function getHeroTunicSkirtGeo() {
  if (_heroTunicSkirtGeo) return _heroTunicSkirtGeo;

  const cols = 16;
  const rows = 5;
  const thick = 0.024;
  const outerRings = [];
  const innerRings = [];

  for (let r = 0; r <= rows; r++) {
    const t = r / rows;
    const p = heroSkirtProfile(t);
    const oRow = [];
    const iRow = [];
    for (let c = 0; c < cols; c++) {
      const phi = (c / cols) * Math.PI * 2;
      const pleat = t * (0.008 * Math.cos(phi * 4) + 0.004 * Math.cos(phi * 8));
      const ox = Math.sin(phi) * (p.rx + pleat);
      const oz = Math.cos(phi) * (p.rz + pleat);
      const ix = Math.sin(phi) * Math.max(0.05, p.rx + pleat - thick);
      const iz = Math.cos(phi) * Math.max(0.05, p.rz + pleat - thick);
      oRow.push([ox, p.y, oz]);
      iRow.push([ix, p.y, iz]);
    }
    outerRings.push(oRow);
    innerRings.push(iRow);
  }

  const v = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cn = (c + 1) % cols;
      pushQuad(v, outerRings[r][c], outerRings[r + 1][c], outerRings[r + 1][cn], outerRings[r][cn]);
      pushQuad(v, innerRings[r][c], innerRings[r][cn], innerRings[r + 1][cn], innerRings[r + 1][c]);
    }
  }
  for (let c = 0; c < cols; c++) {
    const cn = (c + 1) % cols;
    pushQuad(v, innerRings[0][c], outerRings[0][c], outerRings[0][cn], innerRings[0][cn]);
    pushQuad(v, outerRings[rows][c], innerRings[rows][c], innerRings[rows][cn], outerRings[rows][cn]);
  }

  _heroTunicSkirtGeo = markCachedGeo(buildBufferGeoFromTriangles(v));
  return _heroTunicSkirtGeo;
}

const _heroSkirtBandGeoCache = {};
function getHeroSkirtBandGeo(tTop, tBot, outPad = 0.007) {
  const key = `${tTop}_${tBot}_${outPad}`;
  if (_heroSkirtBandGeoCache[key]) return _heroSkirtBandGeoCache[key];

  const cols = 16;
  const pTop = heroSkirtProfile(tTop);
  const pBot = heroSkirtProfile(tBot);
  const inPad = -0.005;

  const outT = [], outB = [], inT = [], inB = [];
  for (let c = 0; c < cols; c++) {
    const phi = (c / cols) * Math.PI * 2;
    const sP = Math.sin(phi), cP = Math.cos(phi);
    const wave = 0.008 * Math.cos(phi * 4) + 0.004 * Math.cos(phi * 8);
    const plT = tTop * wave;
    const plB = tBot * wave;

    outT.push([sP * (pTop.rx + plT + outPad), pTop.y, cP * (pTop.rz + plT + outPad)]);
    outB.push([sP * (pBot.rx + plB + outPad), pBot.y, cP * (pBot.rz + plB + outPad)]);
    inT.push( [sP * (pTop.rx + plT + inPad),  pTop.y, cP * (pTop.rz + plT + inPad)]);
    inB.push( [sP * (pBot.rx + plB + inPad),  pBot.y, cP * (pBot.rz + plB + inPad)]);
  }

  const v = [];
  for (let c = 0; c < cols; c++) {
    const cn = (c + 1) % cols;
    pushQuad(v, outT[c], outB[c], outB[cn], outT[cn]);
    pushQuad(v, inT[c], outT[c], outT[cn], inT[cn]);
    pushQuad(v, outB[c], inB[c], inB[cn], outB[cn]);
  }

  const geo = markCachedGeo(buildBufferGeoFromTriangles(v));
  _heroSkirtBandGeoCache[key] = geo;
  return geo;
}

let _heroTunicBodiceGeo = null;
function getHeroTunicBodiceGeo() {
  if (_heroTunicBodiceGeo) return _heroTunicBodiceGeo;

  const cols = 16;
  const rows = [
    { y: 0.990, rx: 0.242, rz: 0.184 },
    { y: 1.120, rx: 0.252, rz: 0.190 },
    { y: 1.310, rx: 0.276, rz: 0.198 },
    { y: 1.440, rx: 0.245, rz: 0.176 },
    { y: 1.515, rx: 0.130, rz: 0.105 }
  ];
  const rings = [];
  for (let r = 0; r < rows.length; r++) {
    const sp = rows[r];
    const row = [];
    for (let c = 0; c < cols; c++) {
      const phi = (c / cols) * Math.PI * 2;
      row.push([Math.sin(phi) * sp.rx, sp.y, Math.cos(phi) * sp.rz]);
    }
    rings.push(row);
  }

  const v = [];
  for (let r = 0; r < rows.length - 1; r++) {
    for (let c = 0; c < cols; c++) {
      const cn = (c + 1) % cols;
      pushQuad(v, rings[r + 1][c], rings[r][c], rings[r][cn], rings[r + 1][cn]);
    }
  }
  const topC = [0, 1.515, 0];
  const botC = [0, 0.990, 0];
  for (let c = 0; c < cols; c++) {
    const cn = (c + 1) % cols;
    pushTriangle(v, topC, rings[rows.length - 1][c], rings[rows.length - 1][cn]);
    pushTriangle(v, botC, rings[0][cn], rings[0][c]);
  }

  _heroTunicBodiceGeo = markCachedGeo(buildBufferGeoFromTriangles(v));
  return _heroTunicBodiceGeo;
}

// 청록 망토 상단 카울·어깨 케이플릿 & 하단 등/측면 망토 (내부 안감·외부 이중 폐곡면)
function buildHeroClosedClothShell(outerGrid, innerGrid, wrapClosed = true) {
  const rows = outerGrid.length;
  const cols = outerGrid[0].length;
  const vOut = [];
  const vIn = [];

  const colCount = wrapClosed ? cols : (cols - 1);
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < colCount; c++) {
      const cn = wrapClosed ? ((c + 1) % cols) : (c + 1);
      pushQuad(vOut, outerGrid[r][c], outerGrid[r + 1][c], outerGrid[r + 1][cn], outerGrid[r][cn]);
      pushQuad(vIn,  innerGrid[r][c], innerGrid[r][cn], innerGrid[r + 1][cn], innerGrid[r + 1][c]);
    }
  }
  // 상단·하단 테두리 마감 (외부 색상과 연결)
  for (let c = 0; c < colCount; c++) {
    const cn = wrapClosed ? ((c + 1) % cols) : (c + 1);
    pushQuad(vOut, innerGrid[0][c], outerGrid[0][c], outerGrid[0][cn], innerGrid[0][cn]);
    pushQuad(vOut, outerGrid[rows - 1][c], innerGrid[rows - 1][c], innerGrid[rows - 1][cn], outerGrid[rows - 1][cn]);
  }
  if (!wrapClosed) {
    for (let r = 0; r < rows - 1; r++) {
      pushQuad(vOut, innerGrid[r][0], innerGrid[r + 1][0], outerGrid[r + 1][0], outerGrid[r][0]);
      pushQuad(vOut, outerGrid[r][cols - 1], outerGrid[r + 1][cols - 1], innerGrid[r + 1][cols - 1], innerGrid[r][cols - 1]);
    }
  }
  return {
    outerGeo: markCachedGeo(buildBufferGeoFromTriangles(vOut)),
    innerGeo: markCachedGeo(buildBufferGeoFromTriangles(vIn))
  };
}

let _heroCapeUpperGeos = null;
function getHeroCapeUpperGeos() {
  if (_heroCapeUpperGeos) return _heroCapeUpperGeos;

  const cols = 16;
  const rows = 4;
  const outerGrid = [];
  const innerGrid = [];

  for (let r = 0; r < rows; r++) {
    const oRow = [];
    const iRow = [];
    const vFrac = r / (rows - 1); // 0: 목 카울, 1: 어깨·가슴·등 케이프 끝선
    for (let c = 0; c < cols; c++) {
      const phi = (c / cols) * Math.PI * 2;
      const sP = Math.sin(phi);
      const cP = Math.cos(phi);
      const frontMask = Math.max(0, cP);
      const backMask  = Math.max(0, -cP);
      const sideMask  = Math.pow(Math.abs(sP), 1.6);

      // 비대칭 앞가슴 사선 여밈 (우측 가슴 phi≈-0.55 브로치에서 만나며 양 어깨를 포근히 덮음)
      const broochDip = Math.exp(-Math.pow((phi + 0.55) / 0.65, 2));
      const foldWave = 0.012 * Math.cos(phi * 5 + 0.4) * vFrac;

      let y, rx, rz, thick;
      if (r === 0) {
        y = 1.595 - frontMask * 0.025 + backMask * 0.018;
        rx = 0.148;
        rz = 0.134;
        thick = 0.022;
      } else if (r === 1) {
        y = 1.515 - frontMask * 0.048 - broochDip * 0.020;
        rx = 0.345;
        rz = 0.226;
        thick = 0.022;
      } else if (r === 2) {
        y = 1.405 + frontMask * 0.004 - backMask * 0.085 - sideMask * 0.025 - broochDip * 0.022;
        rx = 0.442;
        rz = 0.264;
        thick = 0.022;
      } else {
        // 끝단: 양 어깨 소매 상단을 여유롭게 감싸 덮되 후면 대각선 모서리가 보행 시 소매 띠와 겹치지 않도록 곡선 보정
        y = 1.365 + frontMask * 0.028 - sideMask * 0.095 - Math.pow(backMask, 2.0) * 0.165 - broochDip * 0.018 + foldWave * 0.35;
        rx = 0.476 + foldWave * 0.35;
        rz = 0.286 + foldWave * 0.35;
        thick = 0.020;
      }

      const ox = sP * rx;
      const oz = cP * rz - backMask * 0.014;
      const dXZ = Math.hypot(ox, oz) || 1;
      const ix = ox - (ox / dXZ) * thick;
      const iz = oz - (oz / dXZ) * thick;
      const iy = (r === 0) ? (y - 0.012) : y;

      oRow.push([ox, y, oz]);
      iRow.push([ix, iy, iz]);
    }
    outerGrid.push(oRow);
    innerGrid.push(iRow);
  }

  _heroCapeUpperGeos = buildHeroClosedClothShell(outerGrid, innerGrid, true);
  return _heroCapeUpperGeos;
}

let _heroCapeLowerGeos = null;
function getHeroCapeLowerGeos() {
  if (_heroCapeLowerGeos) return _heroCapeLowerGeos;

  const cols = 13;
  const rows = 5;
  const outerGrid = [];
  const innerGrid = [];

  for (let r = 0; r < rows; r++) {
    const oRow = [];
    const iRow = [];
    const u = r / (rows - 1); // 0: 상단(등 카울 아래), 1: 하단 끝선
    // 허리 높이에서는 벨트·파우치 뒤쪽(phiMin≈88도)으로 들어가고 아래로 내려오며 양옆(phiMin≈54도)으로 넓게 펼쳐짐
    const phiSpanHalf = THREE.MathUtils.lerp(Math.PI * 0.52, Math.PI * 0.74, Math.pow(u, 0.85));
    const phiStart = Math.PI - phiSpanHalf;
    const phiEnd   = Math.PI + phiSpanHalf;

    for (let c = 0; c < cols; c++) {
      const cFrac = c / (cols - 1);
      const phi = THREE.MathUtils.lerp(phiStart, phiEnd, cFrac);
      const sP = Math.sin(phi);
      const cP = Math.cos(phi);
      const edgeT = Math.abs(cFrac * 2 - 1); // 0: 등 중앙, 1: 좌·우 앞자락 날개

      // 튜닉 치마 프로필 대비 항상 바깥(+0.042~+0.056)에 배치해 클리핑·Z-fighting 원천 차단
      const baseY = THREE.MathUtils.lerp(1.30, 0.595, u);
      const wingDrop = u * u * Math.pow(edgeT, 1.5) * 0.115; // 앞쪽 양옆 자락이 0.48까지 내려와 튜닉 좌우 프레이밍
      const fold = u * (0.016 * Math.cos(phi * 5) + 0.008 * Math.cos(phi * 9));

      const tSkirt = Math.max(-0.35, Math.min(1.0, (1.04 - (baseY - wingDrop)) / 0.60));
      const rxBase = (tSkirt < 0)
        ? THREE.MathUtils.lerp(0.248, 0.278, -tSkirt / 0.35)
        : heroSkirtProfile(tSkirt).rx;
      const rzBase = (tSkirt < 0)
        ? THREE.MathUtils.lerp(0.190, 0.204, -tSkirt / 0.35)
        : heroSkirtProfile(tSkirt).rz;

      const pad = 0.046 + u * 0.012;
      const ox = sP * (rxBase + pad + fold);
      const oz = cP * (rzBase + pad + fold) - 0.012 * (1 - edgeT);
      const oy = baseY - wingDrop;

      const thick = 0.022;
      const dXZ = Math.hypot(ox, oz) || 1;
      const ix = ox - (ox / dXZ) * thick;
      const iz = oz - (oz / dXZ) * thick;

      oRow.push([ox, oy, oz]);
      iRow.push([ix, oy, iz]);
    }
    outerGrid.push(oRow);
    innerGrid.push(iRow);
  }

  _heroCapeLowerGeos = buildHeroClosedClothShell(outerGrid, innerGrid, false);
  return _heroCapeLowerGeos;
}

function createHeroCapeGroup() {
  const capeGrp = new THREE.Group();
  capeGrp.name = 'cape';

  const upGeos = getHeroCapeUpperGeos();
  const loGeos = getHeroCapeLowerGeos();

  capeGrp.add(
    createHeroClayMesh(loGeos.outerGeo, HERO_CLAY_PALETTE.cape,      0, 0, 0, { roughness: 0.87, metalness: 0.03 }),
    createHeroClayMesh(loGeos.innerGeo, HERO_CLAY_PALETTE.capeInner, 0, 0, 0, { roughness: 0.90, metalness: 0.02, castShadow: false }),
    createHeroClayMesh(upGeos.outerGeo, HERO_CLAY_PALETTE.cape,      0, 0, 0, { roughness: 0.87, metalness: 0.03 }),
    createHeroClayMesh(upGeos.innerGeo, HERO_CLAY_PALETTE.capeInner, 0, 0, 0, { roughness: 0.90, metalness: 0.02, castShadow: false })
  );

  // 우측 가슴(x < 0, z > 0) 원형 금색 브로치 (#D4A843)
  const broochGrp = new THREE.Group();
  broochGrp.position.set(-0.152, 1.438, 0.228);
  broochGrp.rotation.set(-0.16, -0.40, 0.08);
  const rimRing = createHeroClayMesh(new THREE.CylinderGeometry(0.072, 0.076, 0.022, 10), HERO_CLAY_PALETTE.broochGold, 0, 0, 0, { roughness: 0.44, metalness: 0.24, castShadow: false });
  rimRing.rotation.x = Math.PI / 2;
  const groove = createHeroClayMesh(new THREE.CylinderGeometry(0.052, 0.052, 0.025, 10), HERO_CLAY_PALETTE.broochInset, 0, 0, 0.002, { roughness: 0.58, metalness: 0.16, castShadow: false });
  groove.rotation.x = Math.PI / 2;
  const centerBoss = createHeroClayMesh(new THREE.CylinderGeometry(0.038, 0.044, 0.028, 10), HERO_CLAY_PALETTE.broochGold, 0, 0, 0.006, { roughness: 0.42, metalness: 0.25, castShadow: false });
  centerBoss.rotation.x = Math.PI / 2;
  broochGrp.add(rimRing, groove, centerBoss);
  capeGrp.add(broochGrp);

  return capeGrp;
}

let _heroBeltGeo = null;
function getHeroBeltGeo() {
  if (_heroBeltGeo) return _heroBeltGeo;
  const cols = 16;
  const yT = 1.110, yB = 1.005;
  const rxOut = 0.266, rzOut = 0.208;
  const rxIn  = 0.244, rzIn  = 0.186;

  const outT = [], outB = [], inT = [], inB = [];
  for (let c = 0; c < cols; c++) {
    const phi = (c / cols) * Math.PI * 2;
    const sP = Math.sin(phi), cP = Math.cos(phi);
    outT.push([sP * rxOut, yT, cP * rzOut]);
    outB.push([sP * rxOut, yB, cP * rzOut]);
    inT.push( [sP * rxIn,  yT, cP * rzIn]);
    inB.push( [sP * rxIn,  yB, cP * rzIn]);
  }
  const v = [];
  for (let c = 0; c < cols; c++) {
    const cn = (c + 1) % cols;
    pushQuad(v, outT[c], outB[c], outB[cn], outT[cn]);
    pushQuad(v, inT[c],  outT[c], outT[cn], inT[cn]);
    pushQuad(v, outB[c], inB[c],  inB[cn],  outB[cn]);
    pushQuad(v, inB[c],  inT[c],  inT[cn],  inB[cn]);
  }
  _heroBeltGeo = markCachedGeo(buildBufferGeoFromTriangles(v));
  return _heroBeltGeo;
}

let _heroCrossStrapGeo = null;
function getHeroCrossStrapGeo() {
  if (_heroCrossStrapGeo) return _heroCrossStrapGeo;

  // 오른쪽 가슴 브로치(-X) → 앞가슴 사선 → 왼쪽 허리 파우치(+X) → 등 뒤 망토 위 사선 → 오른쪽 어깨 → 브로치 폐곡선 끈
  const anchors = [
    { pos: [-0.158, 1.452,  0.204], nrm: [-0.42,  0.16,  0.89] },
    { pos: [-0.070, 1.355,  0.198], nrm: [-0.20,  0.10,  0.97] },
    { pos: [ 0.045, 1.245,  0.196], nrm: [ 0.14,  0.04,  0.99] },
    { pos: [ 0.165, 1.135,  0.180], nrm: [ 0.45, -0.02,  0.89] },
    { pos: [ 0.256, 1.060,  0.112], nrm: [ 0.78, -0.04,  0.62] },
    { pos: [ 0.278, 1.045,  0.015], nrm: [ 0.99, -0.02,  0.08] },
    { pos: [ 0.254, 1.072, -0.155], nrm: [ 0.76,  0.00, -0.65] },
    { pos: [ 0.148, 1.180, -0.276], nrm: [ 0.40,  0.06, -0.91] },
    { pos: [ 0.000, 1.300, -0.294], nrm: [ 0.00,  0.12, -0.99] },
    { pos: [-0.128, 1.430, -0.272], nrm: [-0.36,  0.20, -0.91] },
    { pos: [-0.195, 1.535, -0.155], nrm: [-0.48,  0.65, -0.59] },
    { pos: [-0.192, 1.580, -0.015], nrm: [-0.36,  0.93, -0.06] },
    { pos: [-0.176, 1.535,  0.118], nrm: [-0.38,  0.72,  0.58] }
  ];

  const halfW = 0.036;
  const outOff = 0.018;
  const inOff  = -0.006;

  const rings = [];
  const count = anchors.length;
  for (let i = 0; i < count; i++) {
    const prev = anchors[(i - 1 + count) % count].pos;
    const curr = anchors[i].pos;
    const next = anchors[(i + 1) % count].pos;

    const tan = new THREE.Vector3(next[0] - prev[0], next[1] - prev[1], next[2] - prev[2]).normalize();
    const nrm = new THREE.Vector3(anchors[i].nrm[0], anchors[i].nrm[1], anchors[i].nrm[2]).normalize();
    const side = new THREE.Vector3().crossVectors(tan, nrm).normalize();

    const pC = new THREE.Vector3(curr[0], curr[1], curr[2]);
    const pOL = pC.clone().addScaledVector(nrm, outOff).addScaledVector(side, -halfW);
    const pOR = pC.clone().addScaledVector(nrm, outOff).addScaledVector(side,  halfW);
    const pIL = pC.clone().addScaledVector(nrm, inOff).addScaledVector(side, -halfW);
    const pIR = pC.clone().addScaledVector(nrm, inOff).addScaledVector(side,  halfW);

    rings.push({
      ol: [pOL.x, pOL.y, pOL.z],
      or: [pOR.x, pOR.y, pOR.z],
      il: [pIL.x, pIL.y, pIL.z],
      ir: [pIR.x, pIR.y, pIR.z]
    });
  }

  const v = [];
  for (let i = 0; i < count; i++) {
    const j = (i + 1) % count;
    pushQuad(v, rings[i].ol, rings[i].or, rings[j].or, rings[j].ol);
    pushQuad(v, rings[i].or, rings[i].ir, rings[j].ir, rings[j].or);
    pushQuad(v, rings[i].ir, rings[i].il, rings[j].il, rings[j].ir);
    pushQuad(v, rings[i].il, rings[i].ol, rings[j].ol, rings[j].il);
  }

  _heroCrossStrapGeo = markCachedGeo(buildBufferGeoFromTriangles(v));
  return _heroCrossStrapGeo;
}

let _heroPouchBagGeo = null;
function getHeroPouchBagGeo() {
  if (_heroPouchBagGeo) return _heroPouchBagGeo;
  const bagGeo = new THREE.BoxGeometry(0.136, 0.205, 0.198, 1, 2, 1);
  const bagPos = bagGeo.attributes.position;
  for (let i = 0; i < bagPos.count; i++) {
    let bx = bagPos.getX(i), by = bagPos.getY(i), bz = bagPos.getZ(i);
    if (by < -0.02) {
      bx *= 1.12;
      bz *= 1.06;
    } else if (by > 0.05) {
      bx *= 0.88;
    }
    bagPos.setXYZ(i, bx, by, bz);
  }
  const bagFinal = markCachedGeo(bagGeo.toNonIndexed());
  bagFinal.computeVertexNormals();
  bagGeo.dispose();
  _heroPouchBagGeo = bagFinal;
  return _heroPouchBagGeo;
}

function createHeroGearGroup() {
  const gearGrp = new THREE.Group();
  gearGrp.name = 'gear';

  // 1) 갈색 가죽 허리 벨트 + 사각 금색 프레임 버클
  gearGrp.add(createHeroClayMesh(getHeroBeltGeo(), HERO_CLAY_PALETTE.beltLeather, 0, 0, 0, { roughness: 0.80, metalness: 0.05 }));

  const buckleGrp = new THREE.Group();
  buckleGrp.position.set(0, 1.058, 0.214);
  const bGold = HERO_CLAY_PALETTE.buckleGold;
  const bOpt = { roughness: 0.44, metalness: 0.24, castShadow: false };
  buckleGrp.add(
    createHeroClayMesh(new THREE.BoxGeometry(0.132, 0.022, 0.032), bGold,  0.000,  0.054, 0.000, bOpt),
    createHeroClayMesh(new THREE.BoxGeometry(0.132, 0.022, 0.032), bGold,  0.000, -0.054, 0.000, bOpt),
    createHeroClayMesh(new THREE.BoxGeometry(0.024, 0.130, 0.032), bGold, -0.054,  0.000, 0.000, bOpt),
    createHeroClayMesh(new THREE.BoxGeometry(0.024, 0.130, 0.032), bGold,  0.054,  0.000, 0.000, bOpt),
    createHeroClayMesh(new THREE.BoxGeometry(0.016, 0.052, 0.022), bGold,  0.000,  0.020, 0.006, bOpt)
  );
  gearGrp.add(buckleGrp);

  // 2) 대각선 가죽 크로스 끈 (우측 가슴 브로치 -> 좌측 골반)
  gearGrp.add(createHeroClayMesh(getHeroCrossStrapGeo(), HERO_CLAY_PALETTE.beltLeather, 0, 0, 0, { roughness: 0.80, metalness: 0.05 }));

  // 3) 왼쪽 허리춤(+X) 가죽 파우치 & 금색 잠금장치 (벨트에 가죽 고리로 물리적 연결)
  const pouchGrp = new THREE.Group();
  pouchGrp.position.set(0.305, 0.890, 0.055);
  pouchGrp.rotation.set(0.04, 0.24, 0.12);

  const lOpt = { roughness: 0.80, metalness: 0.05 };
  // 벨트 연결 가죽 고리 2개
  pouchGrp.add(
    createHeroClayMesh(new THREE.BoxGeometry(0.044, 0.120, 0.038), HERO_CLAY_PALETTE.bracerLeather, -0.028, 0.132, -0.042, lOpt),
    createHeroClayMesh(new THREE.BoxGeometry(0.044, 0.120, 0.038), HERO_CLAY_PALETTE.bracerLeather, -0.028, 0.132,  0.042, lOpt)
  );
  // 파우치 본체 (살짝 아래로 넓어지는 입체 로우폴리 가방)
  pouchGrp.add(createHeroClayMesh(getHeroPouchBagGeo(), HERO_CLAY_PALETTE.pouchLeather, 0, 0, 0, lOpt));

  // 덮개 플랩 + 측면 파이핑
  const flapTop = createHeroClayMesh(new THREE.BoxGeometry(0.146, 0.052, 0.208), HERO_CLAY_PALETTE.beltLeather, 0.008, 0.092, 0, lOpt);
  const flapFront = createHeroClayMesh(new THREE.BoxGeometry(0.034, 0.125, 0.206), HERO_CLAY_PALETTE.beltLeather, 0.068, 0.038, 0, lOpt);
  flapFront.rotation.z = 0.08;
  const strapTip = createHeroClayMesh(new THREE.BoxGeometry(0.026, 0.068, 0.042), HERO_CLAY_PALETTE.bracerLeather, 0.078, -0.020, 0, { roughness: 0.82, metalness: 0.05, castShadow: false });
  // 금색 잠금장치 (#D4A843)
  const clasp = createHeroClayMesh(new THREE.BoxGeometry(0.028, 0.048, 0.046), HERO_CLAY_PALETTE.broochGold, 0.084, -0.015, 0, bOpt);

  pouchGrp.add(flapTop, flapFront, strapTip, clasp);
  gearGrp.add(pouchGrp);

  return gearGrp;
}

function createHeroBoyArm(isLeft) {
  const side = isLeft ? -1 : 1;
  const armGrp = new THREE.Group();
  armGrp.position.set(side * 0.285, 1.375, 0.0);

  const pivot = new THREE.Group();
  pivot.rotation.z = side * 0.16;

  // 1) 크림 아이보리 반팔 소매 (#EFE9D8) + 끝단 금색(#C59B43) & 청록(#1F6E7A) 띠 (상단 어깨 돔을 망토 안으로 깊게 수납)
  const shCap = createHeroClayMesh(new THREE.DodecahedronGeometry(0.068, 0), HERO_CLAY_PALETTE.tunic, -side * 0.018, -0.032, 0);
  shCap.scale.set(0.88, 0.78, 0.88);
  const sleeve = createHeroClayMesh(new THREE.CylinderGeometry(0.074, 0.098, 0.220, 8), HERO_CLAY_PALETTE.tunic, 0, -0.132, 0);
  const goldBand = createHeroClayMesh(new THREE.CylinderGeometry(0.093, 0.096, 0.028, 8), HERO_CLAY_PALETTE.tunicGold, 0, -0.185, 0, { roughness: 0.78, metalness: 0.10, castShadow: false });
  const tealBand = createHeroClayMesh(new THREE.CylinderGeometry(0.096, 0.101, 0.042, 8), HERO_CLAY_PALETTE.tunicTeal, 0, -0.220, 0, { roughness: 0.86, metalness: 0.03, castShadow: false });
  pivot.add(shCap, sleeve, goldBand, tealBand);

  // 2) 소매 아래 맨팔 + 손목 가죽 아대 (#633E24) + 로우폴리 손
  const lowerArmGrp = new THREE.Group();
  lowerArmGrp.position.set(0, -0.232, 0);
  lowerArmGrp.rotation.z = -side * 0.08;

  const bareArm = createHeroClayMesh(new THREE.CylinderGeometry(0.072, 0.060, 0.27, 8), HERO_CLAY_PALETTE.skin, 0, -0.135, 0, { roughness: 0.84, metalness: 0.02 });
  const bracer  = createHeroClayMesh(new THREE.CylinderGeometry(0.074, 0.069, 0.086, 8), HERO_CLAY_PALETTE.bracerLeather, 0, -0.195, 0, { roughness: 0.82, metalness: 0.05 });

  const palm    = createHeroClayMesh(new THREE.CylinderGeometry(0.062, 0.058, 0.098, 6), HERO_CLAY_PALETTE.skin, 0, -0.295, 0.008, { roughness: 0.84, metalness: 0.02 });
  palm.scale.set(0.86, 1.0, 1.05);
  const fingers = createHeroClayMesh(new THREE.BoxGeometry(0.078, 0.066, 0.092), HERO_CLAY_PALETTE.skin, -side * 0.012, -0.358, 0.012, { roughness: 0.84, metalness: 0.02 });
  fingers.rotation.z = -side * 0.18;
  const thumb   = createHeroClayMesh(new THREE.BoxGeometry(0.042, 0.068, 0.048), HERO_CLAY_PALETTE.skin, -side * 0.048, -0.305, 0.052, { roughness: 0.84, metalness: 0.02, castShadow: false });
  thumb.rotation.x = 0.26;
  thumb.rotation.z = side * 0.14;

  lowerArmGrp.name = 'elbowPivot';
  lowerArmGrp.add(bareArm, bracer, palm, fingers, thumb);
  pivot.add(lowerArmGrp);
  armGrp.add(pivot);
  return armGrp;
}

let _heroFootGeo = null;
function getHeroFootGeo() {
  if (_heroFootGeo) return _heroFootGeo;
  const footGeo = new THREE.BoxGeometry(0.148, 0.088, 0.268, 1, 1, 2);
  const fPos = footGeo.attributes.position;
  for (let i = 0; i < fPos.count; i++) {
    let fx = fPos.getX(i), fy = fPos.getY(i), fz = fPos.getZ(i);
    if (fz > 0.04) {
      if (fy > 0) fy *= 0.62;
      fx *= 0.90;
    }
    fPos.setXYZ(i, fx, fy, fz);
  }
  const footFinal = markCachedGeo(footGeo.toNonIndexed());
  footFinal.computeVertexNormals();
  footGeo.dispose();
  _heroFootGeo = footFinal;
  return _heroFootGeo;
}

function createHeroBoyLeg(isLeft) {
  const legGrp = new THREE.Group();
  legGrp.position.set(isLeft ? -0.135 : 0.135, 0.72, 0);

  const skinOpt  = { roughness: 0.84, metalness: 0.02 };
  const strapOpt = { roughness: 0.80, metalness: 0.05 };
  const soleOpt  = { roughness: 0.88, metalness: 0.04 };

  // 1) 윗다리(허벅지) — 무릎 피벗 상단까지 0.02m 겹쳐 굽혀도 틈이 생기지 않도록 설계
  const thigh = createHeroClayMesh(new THREE.CylinderGeometry(0.078, 0.068, 0.34, 8), HERO_CLAY_PALETTE.skin, 0, -0.17, 0, skinOpt);

  // 2) 무릎 피벗(kneePivot) & 아랫다리/발목/샌들 일체 그룹
  const kneePivot = new THREE.Group();
  kneePivot.name = 'kneePivot';
  kneePivot.position.set(0, -0.32, 0);

  const shin = createHeroClayMesh(new THREE.CylinderGeometry(0.068, 0.060, 0.31, 8), HERO_CLAY_PALETTE.skin, 0, -0.135, 0, skinOpt);

  // 발목 가죽 스트랩 (#7A4E2D) & 앞정강이 연결 가죽끈
  const ankleStrap = createHeroClayMesh(new THREE.CylinderGeometry(0.073, 0.071, 0.076, 8), HERO_CLAY_PALETTE.beltLeather, 0, -0.105, 0, strapOpt);
  const shinTie = createHeroClayMesh(new THREE.BoxGeometry(0.036, 0.175, 0.024), HERO_CLAY_PALETTE.beltLeather, 0, -0.195, 0.060, { ...strapOpt, castShadow: false });
  shinTie.rotation.x = -0.09;

  // 발 (깔끔히 깎인 앞코 볼륨)
  const foot = createHeroClayMesh(getHeroFootGeo(), HERO_CLAY_PALETTE.skin, 0, -0.310, 0.048, skinOpt);

  // 어두운 밑창 (#4E311B) — 하단 바닥이 정확히 world y = 0.000 에 안착! (0.72 - 0.32 - 0.376 - 0.024 = 0.000)
  const sole = createHeroClayMesh(new THREE.BoxGeometry(0.188, 0.048, 0.342), HERO_CLAY_PALETTE.soleLeather, 0, -0.376, 0.046, soleOpt);

  // 고대풍 샌들 가죽 스트랩 (#7A4E2D)
  const foreStrap  = createHeroClayMesh(new THREE.BoxGeometry(0.174, 0.056, 0.056), HERO_CLAY_PALETTE.beltLeather, 0, -0.326,  0.126, { ...strapOpt, castShadow: false });
  const midStrap   = createHeroClayMesh(new THREE.BoxGeometry(0.172, 0.066, 0.054), HERO_CLAY_PALETTE.beltLeather, 0, -0.312,  0.030, { ...strapOpt, castShadow: false });
  const tBridge    = createHeroClayMesh(new THREE.BoxGeometry(0.042, 0.046, 0.140), HERO_CLAY_PALETTE.beltLeather, 0, -0.290,  0.082, { ...strapOpt, castShadow: false });
  tBridge.rotation.x = 0.24;
  const heelStrap  = createHeroClayMesh(new THREE.BoxGeometry(0.172, 0.074, 0.054), HERO_CLAY_PALETTE.beltLeather, 0, -0.316, -0.074, { ...strapOpt, castShadow: false });

  kneePivot.add(shin, ankleStrap, shinTie, foot, sole, foreStrap, midStrap, tBridge, heelStrap);
  legGrp.add(thigh, kneePivot);
  return legGrp;
}

// =========================================================================
// [삭개오 턴어라운드 전용 조형 파츠]
// - 정밀 비율(전체 신장 ~2.22m 리그)로 조형 후 uniform scale 0.66 으로 매우 작은 키 구현!
// =========================================================================
let _zacBeardGeo = null;
function getZacchaeusBeardGeo() {
  if (_zacBeardGeo) return _zacBeardGeo;
  const rows = 4;
  const segs = 12;
  const maxPhi = Math.PI * 0.56;
  const outerGrid = [];
  const innerGrid = [];

  for (let r = 0; r < rows; r++) {
    const oRow = [];
    const iRow = [];
    for (let c = 0; c <= segs; c++) {
      const u = (c / segs) * 2 - 1;
      const absU = Math.abs(u);
      const phi = u * maxPhi;
      const centerW = Math.cos(u * Math.PI * 0.5);

      let y, rx, rz, zBoost;
      if (r === 0) {
        // 입 아래 ~ 양볼 구레나룻 연결 상단
        y = -0.158 + absU * absU * 0.148;
        rx = 0.278;
        rz = 0.252;
        zBoost = 0.018 * centerW;
      } else if (r === 1) {
        // 턱선 외곽 볼륨
        y = -0.208 + absU * absU * 0.068;
        rx = 0.256;
        rz = 0.238;
        zBoost = 0.028 * centerW;
      } else if (r === 2) {
        // 부드러운 둥근 턱수염 하단
        y = -0.274 + absU * absU * 0.088;
        rx = 0.172;
        rz = 0.194;
        zBoost = 0.030 * centerW;
      } else {
        // 턱밑 내측 수납 마감
        y = -0.232 + absU * absU * 0.042;
        rx = 0.100;
        rz = 0.120;
        zBoost = -0.015;
      }

      const ox = Math.sin(phi) * rx;
      const oz = Math.cos(phi) * rz + zBoost;
      const ix = ox * 0.78;
      const iz = oz * 0.78 - 0.014;
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
  for (let c = 0; c < segs; c++) {
    pushQuad(v, innerGrid[0][c], outerGrid[0][c], outerGrid[0][c + 1], innerGrid[0][c + 1]);
  }
  for (let r = 0; r < rows - 1; r++) {
    pushQuad(v, innerGrid[r][0], innerGrid[r + 1][0], outerGrid[r + 1][0], outerGrid[r][0]);
    pushQuad(v, outerGrid[r][segs], outerGrid[r + 1][segs], innerGrid[r + 1][segs], innerGrid[r][segs]);
  }

  _zacBeardGeo = markCachedGeo(buildBufferGeoFromTriangles(v));
  return _zacBeardGeo;
}

function createZacchaeusBeardGroup() {
  const zp = ZACCHAEUS_CLAY_PALETTE;
  const grp = new THREE.Group();
  grp.name = 'zacBeard';
  const jawMesh = createHeroClayMesh(getZacchaeusBeardGeo(), zp.beard, 0, 0, 0, { roughness: 0.88, metalness: 0.02 });
  const stL = createHeroClayMesh(getSoftStacheWingGeo(true),  zp.beard, -0.048, -0.102, 0.248, { roughness: 0.88, metalness: 0.02, castShadow: false });
  const stR = createHeroClayMesh(getSoftStacheWingGeo(false), zp.beard,  0.048, -0.102, 0.248, { roughness: 0.88, metalness: 0.02, castShadow: false });
  const underLip = createHeroClayMesh(new THREE.OctahedronGeometry(0.026, 0), zp.beard, 0, -0.168, 0.244, { roughness: 0.88, metalness: 0.02, castShadow: false });
  underLip.scale.set(1.15, 0.85, 0.72);
  grp.add(jawMesh, stL, stR, underLip);
  return grp;
}

function createZacchaeusHairGroup() {
  const zp = ZACCHAEUS_CLAY_PALETTE;
  const hairGrp = new THREE.Group();
  hairGrp.name = 'zacHair';
  const hOpt = { roughness: 0.88, metalness: 0.03 };
  hairGrp.add(createHeroClayMesh(getHeroBoyHairCapGeo(), zp.hair, 0, 0, 0, hOpt));

  const spikeGeo = getHeroHairSpikeGeo();
  const bangGeo  = getHeroBangChunkGeo();
  const sideGeo  = getHeroSideburnGeo();
  const addMesh = (geo, x, y, z, sx, sy, sz, rx, ry, rz, shadow = true) => {
    const m = createHeroClayMesh(geo, zp.hair, x, y, z, { roughness: 0.88, metalness: 0.03, castShadow: shadow });
    m.scale.set(sx, sy, sz);
    m.rotation.set(rx, ry, rz);
    hairGrp.add(m);
  };

  // 이마 위로 부드럽게 흐르는 턴어라운드 갈색 헝클어진 앞머리 5가닥
  addMesh(bangGeo, -0.220, 0.265, 0.195, 0.135, 0.185, 0.088, -0.24,  0.42, -0.16);
  addMesh(bangGeo, -0.115, 0.295, 0.214, 0.160, 0.190, 0.092, -0.32,  0.18,  0.28);
  addMesh(bangGeo,  0.005, 0.304, 0.218, 0.178, 0.202, 0.098, -0.34, -0.02,  0.22);
  addMesh(bangGeo,  0.128, 0.292, 0.212, 0.168, 0.192, 0.096, -0.30, -0.24,  0.18);
  addMesh(bangGeo,  0.218, 0.270, 0.185, 0.145, 0.195, 0.096, -0.24, -0.44,  0.14);

  // 정수리·상부 다면체 볼륨
  addMesh(spikeGeo, -0.072, 0.312,  0.020, 0.240, 0.105, 0.210,  0.08,  0.24,  0.26);
  addMesh(spikeGeo,  0.078, 0.310, -0.020, 0.235, 0.105, 0.205, -0.12, -0.22, -0.24);
  addMesh(spikeGeo,  0.000, 0.302, -0.125, 0.245, 0.105, 0.195, -0.50,  0.00,  0.00);

  // 뒤통수 & 목덜미 모발
  addMesh(bangGeo, -0.135, 0.245, -0.275, 0.185, 0.215, 0.095,  0.22,  0.38, -0.10);
  addMesh(bangGeo,  0.000, 0.255, -0.292, 0.205, 0.225, 0.100,  0.22,  0.00,  0.00);
  addMesh(bangGeo,  0.135, 0.245, -0.275, 0.185, 0.215, 0.095,  0.22, -0.38,  0.10);
  addMesh(bangGeo, -0.165, 0.055, -0.288, 0.148, 0.190, 0.084, -0.44,  0.42, -0.08, false);
  addMesh(bangGeo, -0.058, 0.048, -0.314, 0.160, 0.198, 0.088, -0.46,  0.14, -0.03, false);
  addMesh(bangGeo,  0.058, 0.048, -0.314, 0.160, 0.198, 0.088, -0.46, -0.14,  0.03, false);
  addMesh(bangGeo,  0.165, 0.055, -0.288, 0.148, 0.190, 0.084, -0.44, -0.42,  0.08, false);

  // 구레나룻 (턱수염과 자연스럽게 연결)
  addMesh(sideGeo, -0.280, 0.035, 0.056, 1.00, 1.04, 1.00, 0.02, 0.0,  0.03, false);
  addMesh(sideGeo,  0.280, 0.035, 0.056, 1.00, 1.04, 1.00, 0.02, 0.0, -0.03, false);
  return hairGrp;
}

let _zacBeltTailGeoLong = null;
let _zacBeltTailGeoShort = null;
function getZacchaeusBeltTailGeo(len = 0.31, topW = 0.044, botW = 0.058, thick = 0.024) {
  const isLong = len > 0.26;
  if (isLong && _zacBeltTailGeoLong) return _zacBeltTailGeoLong;
  if (!isLong && _zacBeltTailGeoShort) return _zacBeltTailGeoShort;

  const hT = thick * 0.5;
  const rows = [
    { y:  0.00,      w: topW * 0.45, zOff: 0.000 },
    { y: -len * 0.42, w: (topW + botW) * 0.25, zOff: 0.012 },
    { y: -len * 0.86, w: botW * 0.52, zOff: 0.024 }
  ];
  const rings = rows.map(r => [
    [-r.w, r.y,  hT + r.zOff],
    [-r.w, r.y, -hT + r.zOff],
    [ r.w, r.y, -hT + r.zOff],
    [ r.w, r.y,  hT + r.zOff]
  ]);
  const tip = [0.006, -len, 0.026];
  const topC = [0, 0.01, 0];
  const v = [];
  for (let c = 0; c < 4; c++) {
    const cn = (c + 1) % 4;
    pushTriangle(v, topC, rings[0][c], rings[0][cn]);
    pushQuad(v, rings[0][c], rings[1][c], rings[1][cn], rings[0][cn]);
    pushQuad(v, rings[1][c], rings[2][c], rings[2][cn], rings[1][cn]);
    pushTriangle(v, rings[2][c], tip, rings[2][cn]);
  }
  const geo = markCachedGeo(buildBufferGeoFromTriangles(v));
  if (isLong) _zacBeltTailGeoLong = geo;
  else _zacBeltTailGeoShort = geo;
  return geo;
}

function createZacchaeusGearGroup() {
  const zp = ZACCHAEUS_CLAY_PALETTE;
  const gearGrp = new THREE.Group();
  gearGrp.name = 'zacGear';

  // 1) 갈색 가죽 허리띠
  gearGrp.add(createHeroClayMesh(getHeroBeltGeo(), zp.belt, 0, 0, 0, { roughness: 0.80, metalness: 0.05 }));

  // 2) 앞-왼쪽 입체 매듭 + 자연스럽게 휘어 내려오는 다면체 벨트 끈 2갈래
  const knot = createHeroClayMesh(new THREE.DodecahedronGeometry(0.054, 0), zp.belt, 0.105, 1.048, 0.212, { roughness: 0.80, metalness: 0.05, castShadow: false });
  knot.scale.set(1.08, 1.16, 0.86);
  const tailLong = createHeroClayMesh(getZacchaeusBeltTailGeo(0.32, 0.044, 0.058, 0.022), zp.belt, 0.094, 1.032, 0.212, { roughness: 0.82, metalness: 0.04, castShadow: false });
  tailLong.rotation.set(-0.15, 0.16, -0.05);
  const tailShort = createHeroClayMesh(getZacchaeusBeltTailGeo(0.22, 0.040, 0.052, 0.020), zp.pouchFlap, 0.136, 1.035, 0.204, { roughness: 0.82, metalness: 0.04, castShadow: false });
  tailShort.rotation.set(-0.16, 0.34, 0.14);
  gearGrp.add(knot, tailLong, tailShort);

  // 3) 왼쪽 허리춤(+X) 라운드 플랩 가죽 돈주머니 (황동 단추 포함)
  const pouchGrp = new THREE.Group();
  pouchGrp.position.set(0.305, 0.892, 0.055);
  pouchGrp.rotation.set(0.04, 0.24, 0.12);
  const lOpt = { roughness: 0.80, metalness: 0.05 };
  const flapCap = createHeroClayMesh(new THREE.CylinderGeometry(0.088, 0.094, 0.128, 7), zp.pouchFlap, 0.016, 0.068, 0, lOpt);
  flapCap.scale.set(0.95, 0.85, 1.15);
  const pouchBtn = createHeroClayMesh(new THREE.CylinderGeometry(0.022, 0.024, 0.022, 6), zp.pouchStud, 0.088, -0.008, 0, { roughness: 0.45, metalness: 0.22, castShadow: false });
  pouchBtn.rotation.z = Math.PI / 2;
  pouchGrp.add(
    createHeroClayMesh(new THREE.CylinderGeometry(0.024, 0.024, 0.118, 5), zp.bracer, -0.028, 0.130, -0.040, lOpt),
    createHeroClayMesh(new THREE.CylinderGeometry(0.024, 0.024, 0.118, 5), zp.bracer, -0.028, 0.130,  0.040, lOpt),
    createHeroClayMesh(getHeroPouchBagGeo(), zp.pouch, 0, 0, 0, lOpt),
    flapCap,
    pouchBtn
  );
  gearGrp.add(pouchGrp);
  return gearGrp;
}

let _zacFingersGeoL = null;
let _zacFingersGeoR = null;
function getZacchaeusFingersGeo(isLeft) {
  if (isLeft && _zacFingersGeoL) return _zacFingersGeoL;
  if (!isLeft && _zacFingersGeoR) return _zacFingersGeoR;

  const side = isLeft ? -1 : 1;
  const rows = [
    { y:  0.000, rx: 0.042, rz: 0.050, cx: 0.000,         cz: 0.000 },
    { y: -0.042, rx: 0.036, rz: 0.042, cx: -side * 0.006, cz: 0.005 },
    { y: -0.078, rx: 0.024, rz: 0.028, cx: -side * 0.012, cz: 0.008 }
  ];
  const cols = 6;
  const rings = rows.map(r => {
    const arr = [];
    for (let c = 0; c < cols; c++) {
      const phi = (c / cols) * Math.PI * 2;
      arr.push([r.cx + Math.sin(phi) * r.rx, r.y, r.cz + Math.cos(phi) * r.rz]);
    }
    return arr;
  });
  const topC = [0, 0.008, 0];
  const botC = [-side * 0.014, -0.090, 0.009];
  const v = [];
  for (let c = 0; c < cols; c++) {
    const cn = (c + 1) % cols;
    pushTriangle(v, topC, rings[0][c], rings[0][cn]);
    pushQuad(v, rings[0][c], rings[1][c], rings[1][cn], rings[0][cn]);
    pushQuad(v, rings[1][c], rings[2][c], rings[2][cn], rings[1][cn]);
    pushTriangle(v, rings[2][c], botC, rings[2][cn]);
  }
  const geo = markCachedGeo(buildBufferGeoFromTriangles(v));
  if (isLeft) _zacFingersGeoL = geo;
  else _zacFingersGeoR = geo;
  return geo;
}

function createZacchaeusArm(isLeft) {
  const zp = ZACCHAEUS_CLAY_PALETTE;
  const side = isLeft ? -1 : 1;
  const armGrp = new THREE.Group();
  armGrp.position.set(side * 0.285, 1.375, 0.0);

  const pivot = new THREE.Group();
  pivot.rotation.z = side * 0.16;

  // 크림색 단색 반팔 소매 (#ECE3CD) + 소매 끝 얇은 입체 테두리
  const shCap = createHeroClayMesh(new THREE.DodecahedronGeometry(0.068, 0), zp.tunic, -side * 0.018, -0.032, 0);
  shCap.scale.set(0.88, 0.78, 0.88);
  const sleeve = createHeroClayMesh(new THREE.CylinderGeometry(0.074, 0.098, 0.220, 8), zp.tunic, 0, -0.132, 0);
  const cuffTrim = createHeroClayMesh(new THREE.CylinderGeometry(0.095, 0.100, 0.022, 8), zp.tunicTrim, 0, -0.232, 0, { roughness: 0.86, metalness: 0.02, castShadow: false });
  pivot.add(shCap, sleeve, cuffTrim);

  // 맨팔 + 테두리가 살아있는 가죽 아대 + 경사/윤곽 손가락·엄지
  const lowerArmGrp = new THREE.Group();
  lowerArmGrp.name = 'elbowPivot';
  lowerArmGrp.position.set(0, -0.232, 0);
  lowerArmGrp.rotation.z = -side * 0.08;

  const bareArm = createHeroClayMesh(new THREE.CylinderGeometry(0.072, 0.058, 0.27, 8), zp.skin, 0, -0.135, 0, { roughness: 0.84, metalness: 0.02 });
  const bracer  = createHeroClayMesh(new THREE.CylinderGeometry(0.074, 0.068, 0.088, 8), zp.bracer, 0, -0.195, 0, { roughness: 0.82, metalness: 0.05 });
  const brTop   = createHeroClayMesh(new THREE.CylinderGeometry(0.076, 0.075, 0.016, 8), zp.bracerTrim, 0, -0.152, 0, { roughness: 0.82, metalness: 0.05, castShadow: false });
  const brBot   = createHeroClayMesh(new THREE.CylinderGeometry(0.070, 0.069, 0.016, 8), zp.bracerTrim, 0, -0.236, 0, { roughness: 0.82, metalness: 0.05, castShadow: false });

  const palm    = createHeroClayMesh(new THREE.CylinderGeometry(0.060, 0.054, 0.092, 6), zp.skin, 0, -0.292, 0.008, { roughness: 0.84, metalness: 0.02 });
  palm.scale.set(0.84, 1.0, 1.04);
  const fingers = createHeroClayMesh(getZacchaeusFingersGeo(isLeft), zp.skin, 0, -0.326, 0.010, { roughness: 0.84, metalness: 0.02 });
  const thumb   = createHeroClayMesh(new THREE.CylinderGeometry(0.018, 0.024, 0.068, 6), zp.skin, -side * 0.046, -0.304, 0.050, { roughness: 0.84, metalness: 0.02, castShadow: false });
  thumb.rotation.x = 0.28;
  thumb.rotation.z = side * 0.16;

  lowerArmGrp.add(bareArm, bracer, brTop, brBot, palm, fingers, thumb);
  pivot.add(lowerArmGrp);
  armGrp.add(pivot);
  return armGrp;
}

// =========================================================================
// [소프트 로우폴리 발 & 샌들 조형]
// - 발등에서 발가락으로 자연스럽게 경사지며 좁아지는 다면체 발 + 윤곽 맞춤 밑창·아치형 가죽 끈
// =========================================================================
let _zacFootGeo = null;
function getZacchaeusFootGeo() {
  if (_zacFootGeo) return _zacFootGeo;

  const sections = [
    { z: -0.095, rx: 0.056, yBot: -0.044, yTop:  0.036 },
    { z: -0.015, rx: 0.066, yBot: -0.044, yTop:  0.056 },
    { z:  0.052, rx: 0.072, yBot: -0.044, yTop:  0.040 },
    { z:  0.114, rx: 0.076, yBot: -0.044, yTop:  0.015 },
    { z:  0.168, rx: 0.050, yBot: -0.038, yTop: -0.012 }
  ];
  const cols = 8;
  const rings = sections.map(sp => {
    const arr = [];
    for (let c = 0; c < cols; c++) {
      const th = (c / cols) * Math.PI * 2;
      const sT = Math.sin(th);
      const cT = Math.cos(th);
      const x = -sT * sp.rx;
      const y = (cT >= 0)
        ? ((sp.yBot + sp.yTop) * 0.5 + cT * (sp.yTop - sp.yBot) * 0.52)
        : (sp.yBot + (1 + cT) * 0.008);
      arr.push([x, y, sp.z]);
    }
    return arr;
  });

  const apexBack  = [0, -0.006, -0.108];
  const apexFront = [0, -0.026,  0.184];
  const v = [];

  for (let c = 0; c < cols; c++) {
    const cn = (c + 1) % cols;
    pushTriangle(v, rings[0][cn], rings[0][c], apexBack);
    pushTriangle(v, rings[sections.length - 1][c], rings[sections.length - 1][cn], apexFront);
  }
  for (let r = 0; r < sections.length - 1; r++) {
    for (let c = 0; c < cols; c++) {
      const cn = (c + 1) % cols;
      pushQuad(v, rings[r][c], rings[r][cn], rings[r + 1][cn], rings[r + 1][c]);
    }
  }

  _zacFootGeo = markCachedGeo(buildBufferGeoFromTriangles(v));
  return _zacFootGeo;
}

let _zacSandalSoleGeo = null;
function getZacchaeusSandalSoleGeo() {
  if (_zacSandalSoleGeo) return _zacSandalSoleGeo;

  const sections = [
    { z: -0.116, rx: 0.068, yBot: -0.022, yTop: 0.018 },
    { z: -0.018, rx: 0.065, yBot: -0.022, yTop: 0.018 },
    { z:  0.088, rx: 0.090, yBot: -0.022, yTop: 0.018 },
    { z:  0.156, rx: 0.072, yBot: -0.019, yTop: 0.013 },
    { z:  0.194, rx: 0.042, yBot: -0.012, yTop: 0.006 }
  ];
  const cols = 8;
  const rings = sections.map(sp => {
    const arr = [];
    for (let c = 0; c < cols; c++) {
      const th = (c / cols) * Math.PI * 2;
      const x = -Math.sin(th) * sp.rx;
      const y = (Math.cos(th) >= 0) ? sp.yTop : sp.yBot;
      arr.push([x, y, sp.z]);
    }
    return arr;
  });

  const apexBack  = [0, 0.000, -0.128];
  const apexFront = [0, -0.002, 0.204];
  const v = [];

  for (let c = 0; c < cols; c++) {
    const cn = (c + 1) % cols;
    pushTriangle(v, rings[0][cn], rings[0][c], apexBack);
    pushTriangle(v, rings[sections.length - 1][c], rings[sections.length - 1][cn], apexFront);
  }
  for (let r = 0; r < sections.length - 1; r++) {
    for (let c = 0; c < cols; c++) {
      const cn = (c + 1) % cols;
      pushQuad(v, rings[r][c], rings[r][cn], rings[r + 1][cn], rings[r + 1][c]);
    }
  }

  _zacSandalSoleGeo = markCachedGeo(buildBufferGeoFromTriangles(v));
  return _zacSandalSoleGeo;
}

const _zacArchStrapGeoCache = {};
function getZacchaeusArchStrapGeo(halfW = 0.080, archH = 0.036, sideDrop = -0.024, depthZ = 0.046, thick = 0.014) {
  const key = `${halfW}_${archH}_${sideDrop}_${depthZ}_${thick}`;
  if (_zacArchStrapGeoCache[key]) return _zacArchStrapGeoCache[key];

  const xs = [-halfW, -halfW * 0.54, 0, halfW * 0.54, halfW];
  const ys = [sideDrop, archH * 0.68, archH, archH * 0.68, sideDrop];
  const hZ = depthZ * 0.5;
  const outF = [], outB = [], inF = [], inB = [];

  for (let i = 0; i < xs.length; i++) {
    const t = i / (xs.length - 1);
    const nx = (t - 0.5) * 0.72;
    const ny = 1.0 - Math.abs(t - 0.5) * 0.55;
    const nLen = Math.hypot(nx, ny) || 1;
    const ox = (nx / nLen) * thick;
    const oy = (ny / nLen) * thick;
    outF.push([xs[i] + ox, ys[i] + oy,  hZ]);
    outB.push([xs[i] + ox, ys[i] + oy, -hZ]);
    inF.push( [xs[i],      ys[i],       hZ]);
    inB.push( [xs[i],      ys[i],      -hZ]);
  }

  const v = [];
  for (let i = 0; i < xs.length - 1; i++) {
    pushQuad(v, outB[i], outF[i], outF[i + 1], outB[i + 1]); // 상부 아치 외면
    pushQuad(v, inF[i],  inB[i],  inB[i + 1],  inF[i + 1]);  // 하부 아치 내면
    pushQuad(v, outF[i], inF[i],  inF[i + 1],  outF[i + 1]); // 전면 두께
    pushQuad(v, inB[i],  outB[i], outB[i + 1], inB[i + 1]);  // 후면 두께
  }
  pushQuad(v, outB[0], inB[0], inF[0], outF[0]);
  const last = xs.length - 1;
  pushQuad(v, outF[last], inF[last], inB[last], outB[last]);

  const geo = markCachedGeo(buildBufferGeoFromTriangles(v));
  _zacArchStrapGeoCache[key] = geo;
  return geo;
}

function createZacchaeusLeg(isLeft) {
  const zp = ZACCHAEUS_CLAY_PALETTE;
  const legGrp = new THREE.Group();
  legGrp.position.set(isLeft ? -0.135 : 0.135, 0.72, 0);

  const skinOpt  = { roughness: 0.84, metalness: 0.02 };
  const strapOpt = { roughness: 0.80, metalness: 0.05 };
  const soleOpt  = { roughness: 0.88, metalness: 0.04 };

  const thigh = createHeroClayMesh(new THREE.CylinderGeometry(0.078, 0.068, 0.34, 8), zp.skin, 0, -0.17, 0, skinOpt);
  const kneePivot = new THREE.Group();
  kneePivot.name = 'kneePivot';
  kneePivot.position.set(0, -0.32, 0);

  const shin       = createHeroClayMesh(new THREE.CylinderGeometry(0.068, 0.060, 0.31, 8), zp.skin, 0, -0.135, 0, skinOpt);
  const ankleStrap = createHeroClayMesh(new THREE.CylinderGeometry(0.073, 0.070, 0.064, 8), zp.sandalStrap, 0, -0.138, 0, strapOpt);

  // 경사진 발끝(y=-0.312)과 윤곽이 딱 맞는 아담한 소프트 로우폴리 밑창 (bottom: 0.72 - 0.32 - 0.378 - 0.022 = 0.000)
  const foot       = createHeroClayMesh(getZacchaeusFootGeo(), zp.skin, 0, -0.312, 0.048, skinOpt);
  const sole       = createHeroClayMesh(getZacchaeusSandalSoleGeo(), zp.sandalSole, 0, -0.378, 0.048, soleOpt);

  // 발등 경사에 맞춘 곡면 가죽 스트랩
  const foreStrap  = createHeroClayMesh(getZacchaeusArchStrapGeo(0.082, 0.022, -0.022, 0.044, 0.015), zp.sandalStrap, 0, -0.332, 0.168, { ...strapOpt, castShadow: false });
  foreStrap.rotation.x = 0.24;
  const midStrap   = createHeroClayMesh(getZacchaeusArchStrapGeo(0.074, 0.044, -0.024, 0.046, 0.015), zp.sandalStrap, 0, -0.312, 0.068, { ...strapOpt, castShadow: false });
  midStrap.rotation.x = 0.14;
  const tBridge    = createHeroClayMesh(new THREE.CylinderGeometry(0.015, 0.018, 0.135, 5), zp.sandalStrap, 0, -0.258, 0.078, { ...strapOpt, castShadow: false });
  tBridge.rotation.x = 0.42;
  const heelStrap  = createHeroClayMesh(new THREE.CylinderGeometry(0.070, 0.074, 0.068, 8, 1, false, Math.PI * 0.55, Math.PI * 0.90), zp.sandalStrap, 0, -0.326, -0.040, { ...strapOpt, castShadow: false });

  kneePivot.add(shin, ankleStrap, foot, sole, foreStrap, midStrap, tBridge, heelStrap);
  legGrp.add(thigh, kneePivot);
  return legGrp;
}

window.createLowPolyPersonMesh = function (preset = 'disciple', idx = 0) {
  const lodGroup = new THREE.LOD();

  let isFemale = false;
  let cfg = null;
  let sc = 1.0;
  const isClubKid = (preset === 'pathfinder' || preset === 'adventurer');

  if (preset === 'jesus') {
    cfg = ISRAELITE_MALE_VARIANTS[0];
  } else if (preset === 'pathfinder') {
    // [온라인 멀티플레이 전용] 파란색 반팔 티셔츠 어린이 — 패스파인더 대원
    isFemale = false;
    cfg = {
      shirt: '#2563eb', shirtTrim: '#1d4ed8', shorts: '#334155',
      scarf: '#facc15', scarfTrim: '#dc2626', pack: '#1e40af', packFlap: '#38bdf8',
      shoe: '#1e293b', shoeTrim: '#f8fafc', sock: '#f8fafc',
      hair: '#261910', skin: '#f3d0b3',
      robe: '#2563eb', sleeve: '#2563eb', shawl: '#facc15',
      belt: '#1e3a8a', beltSub: '#1d4ed8', sandal: '#1e293b',
      beardStyle: 'none', headwear: 'none', clubBadge: '#facc15'
    };
    sc = 0.78;
  } else if (preset === 'adventurer') {
    // [온라인 멀티플레이 전용] 노란색 반팔 티셔츠 어린이 — 어드벤처러 대원
    isFemale = false;
    cfg = {
      shirt: '#facc15', shirtTrim: '#eab308', shorts: '#1e3a8a',
      scarf: '#b91c1c', scarfTrim: '#fef08a', pack: '#991b1b', packFlap: '#fde047',
      shoe: '#dc2626', shoeTrim: '#f8fafc', sock: '#f8fafc',
      hair: '#3b2314', skin: '#f5d4b8',
      robe: '#facc15', sleeve: '#facc15', shawl: '#b91c1c',
      belt: '#991b1b', beltSub: '#7f1d1d', sandal: '#dc2626',
      beardStyle: 'none', headwear: 'none', clubBadge: '#dc2626'
    };
    sc = 0.78;
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
    // [오픈월드 기본 캐릭터] 턴어라운드 레퍼런스 기반 소프트 로우폴리 소년 모험가
    // (크림 튜닉 · 청록/금색 띠 · 청록 망토 & 우측 가슴 금색 브로치 · 가죽 벨트/크로스백 · 아대/샌들)
    isFemale = false;
    cfg = {
      robe: HERO_CLAY_PALETTE.tunic,
      sleeve: HERO_CLAY_PALETTE.tunic,
      shawl: HERO_CLAY_PALETTE.cape,
      stripe1: HERO_CLAY_PALETTE.tunicTeal,
      stripe2: HERO_CLAY_PALETTE.tunicGold,
      headcloth: null, agal1: null, agal2: null,
      belt: HERO_CLAY_PALETTE.beltLeather,
      beltSub: HERO_CLAY_PALETTE.buckleGold,
      hair: HERO_CLAY_PALETTE.hair,
      skin: HERO_CLAY_PALETTE.skin,
      sandal: HERO_CLAY_PALETTE.soleLeather,
      beardStyle: 'none',
      headwear: 'none',
      hasExplorerSatchel: true
    };
    sc = 1.0;
  } else if (preset === 'zacchaeus') {
    // [턴어라운드 레퍼런스 기반] 매우 작은 키(0.66배)의 여리고 세리장 삭개오
    isFemale = false;
    cfg = {
      robe: ZACCHAEUS_CLAY_PALETTE.tunic,
      sleeve: ZACCHAEUS_CLAY_PALETTE.tunic,
      shawl: ZACCHAEUS_CLAY_PALETTE.tunicHem,
      stripe1: ZACCHAEUS_CLAY_PALETTE.tunicHem,
      stripe2: ZACCHAEUS_CLAY_PALETTE.belt,
      headcloth: null, agal1: null, agal2: null,
      belt: ZACCHAEUS_CLAY_PALETTE.belt,
      beltSub: ZACCHAEUS_CLAY_PALETTE.pouch,
      hair: ZACCHAEUS_CLAY_PALETTE.hair,
      skin: ZACCHAEUS_CLAY_PALETTE.skin,
      sandal: ZACCHAEUS_CLAY_PALETTE.sandalStrap,
      beardStyle: 'full',
      headwear: 'none'
    };
    sc = 0.66;
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

  // High Mesh 기준 관절 포인터 (hero·zacchaeus·jesus·일반 NPC 모두 인덱스 불일치 방지)
  let customUserData = null;
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
  } else if (isClubKid) {
    // [온라인 멀티플레이 전용] 소프트 로우폴리 반팔 티셔츠 어린이 대원 (인덱스 0..9 정확히 유지!)
    const buildKidLeg = (isLeft) => {
      const legGrp = new THREE.Group();
      legGrp.position.set(isLeft ? -0.14 : 0.14, 0.68, 0);
      const shortLeg = createLowPolyMesh(new THREE.CylinderGeometry(0.112, 0.105, 0.22, 6), cfg.shorts, 0, -0.06, 0);
      const calf = createLowPolyMesh(new THREE.CylinderGeometry(0.080, 0.072, 0.30, 6), cfg.skin, 0, -0.30, 0);
      const sock = createLowPolyMesh(new THREE.CylinderGeometry(0.078, 0.076, 0.11, 6), cfg.sock, 0, -0.48, 0, false);
      const shoeBody = createLowPolyMesh(new THREE.BoxGeometry(0.19, 0.13, 0.34), cfg.shoe, 0, -0.58, 0.05);
      const shoeSole = createLowPolyMesh(new THREE.BoxGeometry(0.20, 0.05, 0.36), cfg.shoeTrim, 0, -0.64, 0.05, false);
      const shoeToe  = createLowPolyMesh(new THREE.BoxGeometry(0.16, 0.08, 0.10), cfg.shoeTrim, 0, -0.58, 0.20, false);
      legGrp.add(shortLeg, calf, sock, shoeBody, shoeSole, shoeToe);
      return legGrp;
    };
    const lLeg = buildKidLeg(true);
    const rLeg = buildKidLeg(false);

    // [2] 반바지 골반부
    const shortsHip = createLowPolyMesh(new THREE.CylinderGeometry(0.24, 0.25, 0.28, 8), cfg.shorts, 0, 0.78, 0);
    shortsHip.scale.set(1.02, 1.0, 0.74);

    // [3] 반팔 티셔츠 상의 몸통 + 목선 라운드넥 + 가슴 대원 엠블럼
    const shirtGroup = new THREE.Group();
    const shirtBody = createLowPolyMesh(getAnatomicalUpperTorsoGeo(), cfg.shirt, 0, 1.24, 0);
    const shirtLower = createLowPolyMesh(new THREE.CylinderGeometry(0.245, 0.255, 0.26, 8), cfg.shirt, 0, 0.99, 0);
    shirtLower.scale.set(1.03, 1.0, 0.74);
    const crewNeck = createLowPolyMesh(new THREE.CylinderGeometry(0.145, 0.19, 0.07, 8), cfg.shirtTrim, 0, 1.52, 0, false);
    crewNeck.scale.set(1.02, 1.0, 0.76);
    const chestBadge = createLowPolyMesh(new THREE.OctahedronGeometry(0.068, 0), cfg.clubBadge, -0.10, 1.32, 0.185, false);
    chestBadge.scale.set(1.0, 1.0, 0.35);
    shirtGroup.add(shirtBody, shirtLower, crewNeck, chestBadge);

    // [4] 목
    const neck = createLowPolyMesh(new THREE.CylinderGeometry(0.088, 0.108, 0.22, 8), cfg.skin, 0, 1.63, 0, false);

    // [5] 패스파인더 / 어드벤처러 스카프(항건) & 등 뒤 탐험 배낭
    const clubGearGroup = new THREE.Group();
    const scarfCollar = createLowPolyMesh(new THREE.CylinderGeometry(0.165, 0.22, 0.08, 8), cfg.scarf, 0, 1.50, 0.01, false);
    scarfCollar.scale.set(1.05, 1.0, 0.80);
    const scarfBackTri = createLowPolyMesh(new THREE.ConeGeometry(0.22, 0.36, 4), cfg.scarf, 0, 1.30, -0.18, false);
    scarfBackTri.rotation.x = Math.PI + 0.14;
    scarfBackTri.rotation.y = Math.PI / 4;
    scarfBackTri.scale.set(1.05, 1.0, 0.22);
    const scarfBackTrim = createLowPolyMesh(new THREE.ConeGeometry(0.24, 0.39, 4), cfg.scarfTrim, 0, 1.29, -0.17, false);
    scarfBackTrim.rotation.x = Math.PI + 0.14;
    scarfBackTrim.rotation.y = Math.PI / 4;
    scarfBackTrim.scale.set(1.05, 1.0, 0.16);
    const scarfSlide = createLowPolyMesh(new THREE.CylinderGeometry(0.048, 0.048, 0.07, 6), cfg.scarfTrim, 0, 1.43, 0.175, false);
    const scarfTipL = createLowPolyMesh(new THREE.BoxGeometry(0.065, 0.16, 0.032), cfg.scarf, -0.045, 1.32, 0.182, false);
    scarfTipL.rotation.z = -0.18;
    const scarfTipR = createLowPolyMesh(new THREE.BoxGeometry(0.065, 0.16, 0.032), cfg.scarf,  0.045, 1.32, 0.182, false);
    scarfTipR.rotation.z = 0.18;
    // 등 뒤 앙증맞은 탐험 배낭
    const packBody = createLowPolyMesh(new THREE.BoxGeometry(0.36, 0.42, 0.18), cfg.pack, 0, 1.20, -0.25);
    const packFlap = createLowPolyMesh(new THREE.BoxGeometry(0.38, 0.13, 0.20), cfg.packFlap, 0, 1.38, -0.26, false);
    const packPocket = createLowPolyMesh(new THREE.BoxGeometry(0.24, 0.16, 0.08), cfg.scarf, 0, 1.09, -0.35, false);
    clubGearGroup.add(scarfCollar, scarfBackTrim, scarfBackTri, scarfSlide, scarfTipL, scarfTipR, packBody, packFlap, packPocket);

    // [6] 깔끔한 티셔츠 밑단 & 반바지 허리밴드
    const waistBand = createLowPolyMesh(new THREE.CylinderGeometry(0.252, 0.256, 0.065, 8), cfg.shirtTrim, 0, 0.89, 0, false);
    waistBand.scale.set(1.03, 1.0, 0.75);

    // [7], [8] 반팔 티셔츠 양팔 (캐릭터가 +Z 정면을 향하므로 lArm(x=-0.27)이 캐릭터의 해부학적 오른팔!)
    const lArm = createKidShortSleeveArm(true, cfg.shirt, cfg.shirtTrim, cfg.skin, preset);
    const rArm = createKidShortSleeveArm(false, cfg.shirt, cfg.shirtTrim, cfg.skin, null);

    // [9] 밝고 씩씩한 어린이 머리
    const head = new THREE.Group();
    head.position.set(0, 1.92, 0);
    const faceMesh = createLowPolyMesh(getSoftLowPolyHeadGeo(false, false), cfg.skin, 0, 0, 0);
    faceMesh.name = 'headBase';
    const facialFeatures = createSoftFacialFeaturesGroup(cfg.skin, cfg.hair, false, false);
    const earL = createLowPolyMesh(getSculptedEarGeo(true),  cfg.skin, -0.236, -0.008, -0.012, false);
    const earR = createLowPolyMesh(getSculptedEarGeo(false), cfg.skin,  0.236, -0.008, -0.012, false);
    earL.name = 'ear'; earR.name = 'ear';
    head.add(faceMesh, facialFeatures, earL, earR, createSoftMaleHairGroup(cfg.hair, preset === 'adventurer' ? 1 : 0));

    gHigh.add(lLeg, rLeg, shortsHip, shirtGroup, neck, clubGearGroup, waistBand, lArm, rArm, head);
  } else if (preset === 'hero') {
    // [오픈월드 기본 캐릭터] 소프트 로우폴리 소년 모험가 (자식 인덱스 0..9 엄격 유지: lLeg=0, rLeg=1, lArm=7, rArm=8, head=9)
    const lLeg = createHeroBoyLeg(true);
    const rLeg = createHeroBoyLeg(false);

    // [2] 크림 아이보리 튜닉 하단 치마 + 금색(#C59B43) & 청록(#1F6E7A) 가로 띠
    const tunicSkirtGrp = new THREE.Group();
    tunicSkirtGrp.name = 'heroTunicSkirt';
    tunicSkirtGrp.add(
      createHeroClayMesh(getHeroTunicSkirtGeo(), HERO_CLAY_PALETTE.tunic, 0, 0, 0, { roughness: 0.88, metalness: 0.02 }),
      createHeroClayMesh(getHeroSkirtBandGeo(0.763, 0.825, 0.007), HERO_CLAY_PALETTE.tunicGold, 0, 0, 0, { roughness: 0.78, metalness: 0.10, castShadow: false }),
      createHeroClayMesh(getHeroSkirtBandGeo(0.877, 0.973, 0.007), HERO_CLAY_PALETTE.tunicTeal, 0, 0, 0, { roughness: 0.86, metalness: 0.03, castShadow: false })
    );

    // [3] 크림 아이보리 튜닉 상체
    const tunicBodiceGrp = new THREE.Group();
    tunicBodiceGrp.name = 'heroTunicBodice';
    tunicBodiceGrp.add(
      createHeroClayMesh(getHeroTunicBodiceGeo(), HERO_CLAY_PALETTE.tunic, 0, 0, 0, { roughness: 0.88, metalness: 0.02 })
    );

    // [4] 목 (턱선 아래에서 튜닉·망토 카울 안으로 매끄럽게 연결)
    const neck = createHeroClayMesh(new THREE.CylinderGeometry(0.086, 0.106, 0.22, 10), HERO_CLAY_PALETTE.skin, 0, 1.59, 0, { roughness: 0.84, metalness: 0.02, castShadow: false });

    // [5] 청록 망토(카울·어깨 케이플릿 + 뒤·측면 자락) & 우측 가슴 금색 브로치
    const capeGroup = createHeroCapeGroup();

    // [6] 가죽 벨트 & 금색 사각 버클 & 크로스 끈 & 왼쪽 허리 가죽 파우치
    const gearGroup = createHeroGearGroup();

    // [7], [8] 반팔 튜닉 소매(금·청록 띠) + 손목 가죽 아대 + 손
    const lArm = createHeroBoyArm(true);
    const rArm = createHeroBoyArm(false);

    // [9] 약 4~4.5등신 소년 역오각형 두상 + 이목구비 + 입체 귀 + 비대칭 가르마 헤어스타일
    const head = new THREE.Group();
    head.position.set(0, 1.88, 0);
    const faceMesh = createHeroClayMesh(getHeroBoyHeadGeo(), HERO_CLAY_PALETTE.skin, 0, 0, 0, { roughness: 0.84, metalness: 0.02 });
    faceMesh.name = 'headBase';

    const facialFeatures = new THREE.Group();
    facialFeatures.name = 'facialFeatures';
    const eyeOpt   = { roughness: 0.48, metalness: 0.05, castShadow: false };
    const browOpt  = { roughness: 0.86, metalness: 0.03, castShadow: false };
    const noseOpt  = { roughness: 0.84, metalness: 0.02, castShadow: false };
    const mouthOpt = { roughness: 0.78, metalness: 0.02, castShadow: false };

    const eyeL = createHeroClayMesh(getHeroEyeGeo(), HERO_CLAY_PALETTE.eye, -0.098, -0.028, 0.243, eyeOpt);
    eyeL.rotation.y = -0.11;
    const eyeR = createHeroClayMesh(getHeroEyeGeo(), HERO_CLAY_PALETTE.eye,  0.098, -0.028, 0.243, eyeOpt);
    eyeR.rotation.y =  0.11;

    const browL = createHeroClayMesh(getHeroBrowGeo(true),  HERO_CLAY_PALETTE.brow, -0.102, 0.062, 0.244, browOpt);
    browL.rotation.set(0, -0.11, 0);
    const browR = createHeroClayMesh(getHeroBrowGeo(false), HERO_CLAY_PALETTE.brow,  0.102, 0.062, 0.244, browOpt);
    browR.rotation.set(0,  0.11, 0);

    const nose = createHeroClayMesh(getSculptedNoseGeo(false), HERO_CLAY_PALETTE.skin, 0, -0.068, 0.249, noseOpt);
    nose.scale.set(0.76, 0.66, 0.62);

    const smileMesh = createHeroClayMesh(getHeroSmileGeo(), HERO_CLAY_PALETTE.mouth, 0, -0.140, 0.231, mouthOpt);
    smileMesh.rotation.x = 0.28;
    facialFeatures.add(eyeL, eyeR, browL, browR, nose, smileMesh);

    const earL = createHeroClayMesh(getSculptedEarGeo(true),  HERO_CLAY_PALETTE.skin, -0.282, -0.042, -0.018, { roughness: 0.84, metalness: 0.02, castShadow: false });
    const earR = createHeroClayMesh(getSculptedEarGeo(false), HERO_CLAY_PALETTE.skin,  0.282, -0.042, -0.018, { roughness: 0.84, metalness: 0.02, castShadow: false });
    earL.name = 'ear'; earR.name = 'ear';

    head.add(faceMesh, facialFeatures, earL, earR, createHeroBoyHairGroup());

    gHigh.add(lLeg, rLeg, tunicSkirtGrp, tunicBodiceGrp, neck, capeGroup, gearGroup, lArm, rArm, head);
    customUserData = {
      lLeg, rLeg,
      lKnee: lLeg.getObjectByName('kneePivot') || null,
      rKnee: rLeg.getObjectByName('kneePivot') || null,
      lArm, rArm,
      lElbow: lArm.getObjectByName('elbowPivot') || null,
      rElbow: rArm.getObjectByName('elbowPivot') || null,
      head,
      walkPhase: idx * 0.9
    };
  } else if (preset === 'zacchaeus') {
    const zp = ZACCHAEUS_CLAY_PALETTE;
    const lLeg = createZacchaeusLeg(true);
    const rLeg = createZacchaeusLeg(false);

    // 크림색 무릎 길이 튜닉 치마 + 하단 황토금색 띠
    const tunicSkirtGrp = new THREE.Group();
    tunicSkirtGrp.name = 'zacTunicSkirt';
    tunicSkirtGrp.add(
      createHeroClayMesh(getHeroTunicSkirtGeo(), zp.tunic, 0, 0, 0, { roughness: 0.88, metalness: 0.02 }),
      createHeroClayMesh(getHeroSkirtBandGeo(0.845, 0.985, 0.007), zp.tunicHem, 0, 0, 0, { roughness: 0.80, metalness: 0.06, castShadow: false })
    );

    // 크림색 반팔 튜닉 상체 + 앞목 V자 슬릿 피부 표현
    const tunicBodiceGrp = new THREE.Group();
    tunicBodiceGrp.name = 'zacTunicBodice';
    tunicBodiceGrp.add(
      createHeroClayMesh(getHeroTunicBodiceGeo(), zp.tunic, 0, 0, 0, { roughness: 0.88, metalness: 0.02 })
    );
    const vNeckWedge = createHeroClayMesh(new THREE.ConeGeometry(0.054, 0.142, 3), zp.skin, 0, 1.445, 0.128, { roughness: 0.84, metalness: 0.02, castShadow: false });
    vNeckWedge.rotation.x = Math.PI;
    vNeckWedge.scale.set(1.0, 1.0, 0.55);
    const collarRimL = createHeroClayMesh(new THREE.CylinderGeometry(0.014, 0.016, 0.145, 5), zp.tunicTrim, -0.034, 1.452, 0.156, { roughness: 0.86, metalness: 0.02, castShadow: false });
    collarRimL.rotation.set(0.32, 0, -0.36);
    const collarRimR = createHeroClayMesh(new THREE.CylinderGeometry(0.014, 0.016, 0.145, 5), zp.tunicTrim,  0.034, 1.452, 0.156, { roughness: 0.86, metalness: 0.02, castShadow: false });
    collarRimR.rotation.set(0.32, 0,  0.36);
    tunicBodiceGrp.add(vNeckWedge, collarRimL, collarRimR);

    const neck = createHeroClayMesh(new THREE.CylinderGeometry(0.088, 0.108, 0.22, 10), zp.skin, 0, 1.59, 0, { roughness: 0.84, metalness: 0.02, castShadow: false });
    const gearGroup = createZacchaeusGearGroup();
    const lArm = createZacchaeusArm(true);
    const rArm = createZacchaeusArm(false);

    // 짧은 키(0.66)에서도 이목구비·수염·미소가 돋보이도록 친근한 턴어라운드 비율(머리 ~1.08배)
    const head = new THREE.Group();
    head.position.set(0, 1.85, 0);
    head.scale.set(1.08, 1.04, 1.06);

    const faceMesh = createHeroClayMesh(getHeroBoyHeadGeo(), zp.skin, 0, 0, 0, { roughness: 0.84, metalness: 0.02 });
    faceMesh.name = 'headBase';
    const facialFeatures = new THREE.Group();
    facialFeatures.name = 'facialFeatures';
    const eyeOpt   = { roughness: 0.48, metalness: 0.05, castShadow: false };
    const browOpt  = { roughness: 0.86, metalness: 0.03, castShadow: false };
    const noseOpt  = { roughness: 0.84, metalness: 0.02, castShadow: false };
    const mouthOpt = { roughness: 0.78, metalness: 0.02, castShadow: false };

    const eyeL = createHeroClayMesh(getHeroEyeGeo(), zp.eye, -0.098, -0.028, 0.243, eyeOpt);
    eyeL.rotation.y = -0.11;
    const eyeR = createHeroClayMesh(getHeroEyeGeo(), zp.eye,  0.098, -0.028, 0.243, eyeOpt);
    eyeR.rotation.y =  0.11;
    const browL = createHeroClayMesh(getHeroBrowGeo(true),  zp.brow, -0.102, 0.062, 0.244, browOpt);
    browL.rotation.set(0, -0.11, 0);
    const browR = createHeroClayMesh(getHeroBrowGeo(false), zp.brow,  0.102, 0.062, 0.244, browOpt);
    browR.rotation.set(0,  0.11, 0);
    const nose = createHeroClayMesh(getSculptedNoseGeo(false), zp.skin, 0, -0.068, 0.249, noseOpt);
    nose.scale.set(0.80, 0.68, 0.64);
    const smileMesh = createHeroClayMesh(getHeroSmileGeo(), zp.mouth, 0, -0.140, 0.236, mouthOpt);
    smileMesh.rotation.x = 0.26;
    facialFeatures.add(eyeL, eyeR, browL, browR, nose, smileMesh);

    const earL = createHeroClayMesh(getSculptedEarGeo(true),  zp.skin, -0.282, -0.042, -0.018, { roughness: 0.84, metalness: 0.02, castShadow: false });
    const earR = createHeroClayMesh(getSculptedEarGeo(false), zp.skin,  0.282, -0.042, -0.018, { roughness: 0.84, metalness: 0.02, castShadow: false });
    earL.name = 'ear'; earR.name = 'ear';

    head.add(faceMesh, facialFeatures, earL, earR, createZacchaeusHairGroup(), createZacchaeusBeardGroup());
    gHigh.add(lLeg, rLeg, tunicSkirtGrp, tunicBodiceGrp, neck, gearGroup, lArm, rArm, head);

    customUserData = {
      lLeg, rLeg,
      lKnee: lLeg.getObjectByName('kneePivot') || null,
      rKnee: rLeg.getObjectByName('kneePivot') || null,
      lArm, rArm,
      lElbow: lArm.getObjectByName('elbowPivot') || null,
      rElbow: rArm.getObjectByName('elbowPivot') || null,
      head,
      walkPhase: idx * 0.9
    };
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

    // [오픈월드 기본 캐릭터 전용] 가죽 크로스 탐험 가방 & 말아 넣은 두루마리 (뒤·옆에서 NPC와 즉시 차별화!)
    if (cfg.hasExplorerSatchel) {
      const strapF = createLowPolyMesh(new THREE.BoxGeometry(0.075, 0.68, 0.045), '#78350f', -0.02, 1.25, 0.185, false);
      strapF.rotation.z = -0.62;
      const strapB = createLowPolyMesh(new THREE.BoxGeometry(0.075, 0.68, 0.045), '#78350f', -0.02, 1.25, -0.185, false);
      strapB.rotation.z = -0.62;
      const satchelBody = createLowPolyMesh(new THREE.BoxGeometry(0.20, 0.28, 0.24), '#92400e', 0.27, 0.90, -0.05);
      const satchelFlap = createLowPolyMesh(new THREE.BoxGeometry(0.22, 0.11, 0.26), '#b45309', 0.27, 1.00, -0.05, false);
      const satchelClasp = createLowPolyMesh(new THREE.BoxGeometry(0.06, 0.06, 0.06), '#fbbf24', 0.37, 0.94, -0.05, false);
      const scrollRoll = createLowPolyMesh(new THREE.CylinderGeometry(0.045, 0.045, 0.26, 6), '#fef3c7', 0.26, 1.06, -0.12, false);
      scrollRoll.rotation.x = Math.PI * 0.45;
      const beltBuckle = createLowPolyMesh(new THREE.BoxGeometry(0.11, 0.09, 0.05), '#f59e0b', 0, 1.00, 0.205, false);
      beltGroup.add(strapF, strapB, satchelBody, satchelFlap, satchelClasp, scrollRoll, beltBuckle);
    }

    const lArm = createSeamlessPonchoArm(true, cfg.shawl, cfg.stripe1, cfg.stripe2, cfg.sleeve, cfg.skin);
    const rArm = createSeamlessPonchoArm(false, cfg.shawl, cfg.stripe1, cfg.stripe2, cfg.sleeve, cfg.skin);

    const head = new THREE.Group();
    head.position.set(0, 1.92, 0);

    const isHelmet = (!isFemale && cfg.headwear === 'helmet');
    const isHeadband = (!isFemale && cfg.headwear === 'headband');
    const isHooded = isFemale || (cfg.headwear !== 'none' && !isHelmet && !isHeadband);

    const faceMesh = createLowPolyMesh(getSoftLowPolyHeadGeo(isHooded || isHelmet, isFemale), cfg.skin, 0, 0, 0);
    faceMesh.name = 'headBase';
    const facialFeatures = createSoftFacialFeaturesGroup(cfg.skin, cfg.hair, isFemale, isHooded || isHelmet, cfg.browColor || null);
    head.add(faceMesh, facialFeatures);

    // 두건을 쓰지 않은 남자(및 투구 병사·기본 탐험가)는 입체 귀 장착 (두건 착용 시 귀는 두건 내부 수납으로 돌출 방지)
    if (!isHooded) {
      const earX = isHelmet ? 0.228 : 0.236;
      const earL = createLowPolyMesh(getSculptedEarGeo(true),  cfg.skin, -earX, -0.008, -0.012, false);
      const earR = createLowPolyMesh(getSculptedEarGeo(false), cfg.skin,  earX, -0.008, -0.012, false);
      earL.name = 'ear';
      earR.name = 'ear';
      head.add(earL, earR);
    }

    if (isHelmet) {
      const softHelm = createSoftRomanHelmetGroup('#7c8b9c', '#d4a234', '#dc2626', true);
      head.add(softHelm);
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
      if (cfg.headwear === 'none' || isHeadband) {
        const hairStyleIdx = isHeadband ? 0 : ((cfg.beardStyle === 'trimmed') ? 1 : (cfg.beardStyle === 'short' ? 0 : (idx % 2)));
        head.add(createSoftMaleHairGroup(cfg.hair, hairStyleIdx));
        if (isHeadband) {
          // [오픈월드 기본 캐릭터] 황금빛 탐험가 머리띠 + 뒤쪽 나부끼는 두 갈래 리본 꼬리
          const bandMain = createLowPolyMesh(new THREE.CylinderGeometry(0.272, 0.275, 0.058, 10), '#d97706', 0, 0.145, -0.008, false);
          bandMain.scale.set(1.02, 1.0, 1.04);
          const bandTrim = createLowPolyMesh(new THREE.CylinderGeometry(0.278, 0.280, 0.022, 10), '#fbbf24', 0, 0.145, -0.008, false);
          bandTrim.scale.set(1.02, 1.0, 1.04);
          const knotBack = createLowPolyMesh(new THREE.DodecahedronGeometry(0.056, 0), '#d97706', 0, 0.135, -0.295, false);
          const tailL = createLowPolyMesh(new THREE.BoxGeometry(0.048, 0.22, 0.024), '#f59e0b', -0.048, 0.02, -0.32, false);
          tailL.rotation.set(0.28, 0, -0.22);
          const tailR = createLowPolyMesh(new THREE.BoxGeometry(0.048, 0.19, 0.024), '#06b6d4',  0.048, 0.03, -0.32, false);
          tailR.rotation.set(0.28, 0,  0.22);
          head.add(bandMain, bandTrim, knotBack, tailL, tailR);
        }
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
  lodGroup.userData = customUserData || {
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
    _sharedLowPolySilhouetteMat = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      vertexColors: true,
      flatShading: true,
      shininess: 0,
      specular: 0x000000
    });
    _sharedLowPolySilhouetteMat.userData = { _cached: true };
  }
  return _sharedLowPolySilhouetteMat;
}

const _lowPolySilhouetteGeoCache = {};
function getMergedLowPolySilhouetteGeo(preset, cfg, isFemale) {
  const isJesus = (preset === 'jesus');
  const isHero  = (preset === 'hero');
  const isZac   = (preset === 'zacchaeus');
  const isClubKid = (preset === 'pathfinder' || preset === 'adventurer');
  const isHelmet = (!isJesus && !isFemale && cfg.headwear === 'helmet');
  const isHeadband = (!isJesus && !isFemale && cfg.headwear === 'headband');
  const isHooded = (!isJesus && !isZac && !isHelmet && !isHeadband && !isClubKid) && (isFemale || cfg.headwear !== 'none');

  const skinCol   = isJesus ? '#f2cfb4' : cfg.skin;
  const hairCol   = isJesus ? '#4e2f1e' : cfg.hair;
  const hoodCol   = isHooded ? (isFemale ? cfg.veil : cfg.headcloth) : '';
  const bodiceCol = isJesus ? '#e8e6e2' : (isClubKid ? cfg.shirt : (isFemale ? cfg.bodice : cfg.robe));
  const skirtCol  = isJesus ? '#e8e6e2' : (isClubKid ? cfg.shorts : (isFemale ? cfg.skirt : cfg.robe));
  const shawlCol  = isJesus ? '#c83228' : (isClubKid ? cfg.scarf : cfg.shawl);
  const sleeveCol = isJesus ? '#e8e6e2' : ((isClubKid || isHero || isZac) ? (cfg.shirt || cfg.robe) : cfg.shawl);
  const beltCol   = isJesus ? '#9c846b' : cfg.belt;
  const shoeCol   = isJesus ? '#3b2416' : (isClubKid ? cfg.shoe : (isFemale ? cfg.shoe : cfg.sandal));
  const hasWings  = Boolean(cfg.hasWings);

  const key = [
    isJesus ? 'J' : (isHero ? 'E' : (isZac ? 'Z' : (isClubKid ? 'C' : (isFemale ? 'F' : 'M')))),
    isClubKid ? preset : '',
    isHooded ? 'H' : (isHelmet ? 'K' : (isHeadband ? 'B' : 'U')),
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
  } else if (!isZac) {
    appendPart(new THREE.CylinderGeometry(0.19, 0.35, 0.22, 6), shawlCol, 0, 1.46, -0.01, 1.08, 1.0, 0.72);
  }
  appendPart(new THREE.CylinderGeometry(0.24, 0.25, 0.09, 6), beltCol, 0, 0.98, 0, 1.02, 1.0, 0.72);
  appendPart(new THREE.CylinderGeometry(0.23, 0.41, 0.88, 7), skirtCol, 0, 0.54, 0, 1.0, 1.0, 0.74);
  if (isHero) {
    appendPart(new THREE.BoxGeometry(0.14, 0.20, 0.20), HERO_CLAY_PALETTE.pouchLeather, 0.30, 0.89, 0.05);
    appendPart(new THREE.CylinderGeometry(0.36, 0.42, 0.62, 6, 1, false, Math.PI * 0.55, Math.PI * 0.90), shawlCol, 0, 0.88, -0.05, 1.0, 1.0, 0.85);
  } else if (isZac) {
    appendPart(new THREE.BoxGeometry(0.14, 0.20, 0.20), ZACCHAEUS_CLAY_PALETTE.pouch, 0.30, 0.89, 0.05);
    appendPart(new THREE.IcosahedronGeometry(0.16, 0), ZACCHAEUS_CLAY_PALETTE.beard, 0, 1.72, 0.11);
  }

  // 4) 자연스럽게 내려온 양팔 & 손
  appendPart(new THREE.CylinderGeometry(0.098, 0.068, 0.56, 5), sleeveCol, -0.32, 1.25, 0, 1, 1, 1, 0, 0, -0.20);
  appendPart(new THREE.CylinderGeometry(0.098, 0.068, 0.56, 5), sleeveCol,  0.32, 1.25, 0, 1, 1, 1, 0, 0,  0.20);
  if (isClubKid) {
    appendPart(
      new THREE.IcosahedronGeometry(0.065, 0),
      preset === 'pathfinder' ? '#dc2626' : '#1d4ed8',
      -0.365, 1.37, 0,
      0.35, 1.0, 0.9,
      0, 0, -0.20
    );
  }
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

// 멀티플레이 선택 가능 캐릭터 프리셋 지원 (예수님·천사 원천 차단)
window.selectedMiracleHeroPreset = window.selectedMiracleHeroPreset || { preset: 'hero', idx: 0 };

function createLowPolyHarvestAxeMesh() {
  const g = new THREE.Group();
  const handle = createLowPolyMesh(new THREE.CylinderGeometry(0.036, 0.044, 1.05, 5), '#6b4226', 0, -0.32, 0.16, false);
  handle.rotation.x = Math.PI * 0.42;
  const bind = createLowPolyMesh(new THREE.CylinderGeometry(0.056, 0.056, 0.14, 6), '#92400e', 0, -0.58, 0.52, false);
  bind.rotation.x = Math.PI * 0.42;
  // 도끼날(철/돌) + 반대편 곡괭이 팁 (나무 베기와 돌 캐기 모두 자연스럽게 표현!)
  const axeBlade = createLowPolyMesh(new THREE.ConeGeometry(0.18, 0.34, 4), '#94a3b8', 0, -0.74, 0.56, false);
  axeBlade.rotation.x = Math.PI;
  axeBlade.scale.set(0.35, 1.0, 1.15);
  const pickTip = createLowPolyMesh(new THREE.ConeGeometry(0.08, 0.28, 4), '#cbd5e1', 0, -0.44, 0.54, false);
  pickTip.scale.set(0.55, 1.0, 0.85);
  g.add(handle, bind, axeBlade, pickTip);
  return g;
}

// 플레이어 캐릭터 생성기 (항상 고해상도(LOD 0) 강제 추출 유지 + 멀티플레이 선택 캐릭터 반영)
window.createMiracleHeroMesh = function () {
  const sel = window.selectedMiracleHeroPreset || { preset: 'hero', idx: 0 };
  const rawPreset = String(sel.preset || 'hero');
  const safePreset = (rawPreset === 'jesus' || rawPreset === 'angel') ? 'hero' : rawPreset;
  const safeIdx = Number.isFinite(sel.idx) ? sel.idx : 0;

  const g = window.createLowPolyPersonMesh(safePreset, safeIdx);
  const heroGrp = g.levels[0].object.clone();
  heroGrp.scale.copy(g.scale);
  const u = {
    lLeg: heroGrp.children[0], rLeg: heroGrp.children[1],
    lArm: heroGrp.children[7], rArm: heroGrp.children[8], head: heroGrp.children[9]
  };
  // Object3D.clone()은 userData를 얕은 복사하므로 반드시 복제된 계층에서 이름으로 무릎·팔꿈치 피벗을 다시 탐색!
  const lKnee = u.lLeg ? u.lLeg.getObjectByName('kneePivot') : null;
  const rKnee = u.rLeg ? u.rLeg.getObjectByName('kneePivot') : null;
  const lElbow = u.lArm ? u.lArm.getObjectByName('elbowPivot') : null;
  const rElbow = u.rArm ? u.rArm.getObjectByName('elbowPivot') : null;
  u.lKnee = lKnee; u.rKnee = rKnee; u.lElbow = lElbow; u.rElbow = rElbow;
  u.baseScale = g.scale.clone();

  const toolGrp = createLowPolyHarvestAxeMesh();
  toolGrp.visible = false;
  u.lArm.add(toolGrp);
  carriedBlockGroup = new THREE.Group();
  carriedBlockGroup.position.set(0, 1.22, -0.36);
  heroGrp.add(carriedBlockGroup);
  playerLimbs = {
    lLeg: u.lLeg, rLeg: u.rLeg,
    lArm: u.lArm, rArm: u.rArm,
    lKnee, rKnee, lElbow, rElbow,
    head: u.head,
    axeTool: toolGrp,
    baseScale: g.scale.clone()
  };
  u.episodeHero = 'miracle';
  heroGrp.userData = u;
  if (window.ep4CharacterAnimator) window.ep4CharacterAnimator.reset();
  return heroGrp;
};

// -------------------------------------------------------------------------
// 3-2. 에피소드 4 플레이어 부드러운 상태 머신 애니메이터 (CharacterAnimator)
//      - Idle(대기) / Walk(걷기) / Jump(상승·하강) / Land(0.2초 스쿼시 착지 반동) 가중치 THREE.MathUtils.damp 블렌딩
//      - 탭 전환 등에서 dt 급등 시 관절 꺾임 방지를 위해 Math.min(dt, 0.05) 클램핑 강제
// -------------------------------------------------------------------------
class CharacterAnimator {
  constructor() {
    this.reset();
  }

  reset() {
    this.weights = { idle: 1, walk: 0, jump: 0, land: 0 };
    this.idlePhase = 0;
    this.walkPhase = 0;
    this.landTimer = 0;
    this.landDuration = 0.20;
    this.pose = {
      lLegX: 0, rLegX: 0,
      lKneeX: 0, rKneeX: 0,
      lArmX: 0, rArmX: 0,
      lArmZ: 0, rArmZ: 0,
      lElbowX: 0, rElbowX: 0,
      headX: 0,
      scaleY: 1, scaleXZ: 1
    };
    this.debugState = { activeState: 'idle', weights: this.weights, scaleY: 1, landTimer: 0 };
  }

  update(rawDt, now, state) {
    if (!state || !state.limbs) return;
    const limbs = state.limbs;
    if (!limbs.lLeg || !limbs.rLeg || !limbs.lArm || !limbs.rArm) return;

    // 탭 전환/프레임 드롭 시에도 관절 각도가 튀지 않도록 최대 0.05초로 클램핑
    const dt = Math.min(Math.max(rawDt || 0, 0), 0.05);
    const isGrounded = Boolean(state.isGrounded);
    const prevGrounded = (state.prevGrounded !== undefined) ? Boolean(state.prevGrounded) : isGrounded;
    const velY = Number(state.velY) || 0;
    const prevVelY = Number(state.prevVelY !== undefined ? state.prevVelY : velY) || 0;
    const moveSpeed = Math.max(0, Number(state.moveSpeed) || 0);
    const maxSpeed = Math.max(1, Number(state.maxSpeed) || 9.0);
    const isMoving = Boolean(state.isMoving && moveSpeed > 0.15);

    // 1) 착지 반동 트리거 (공중에서 낙하 후 지면 접촉 순간 0.20초 Land 상태 활성화)
    if (!prevGrounded && isGrounded && prevVelY < -2.2) {
      this.landTimer = this.landDuration;
    }
    if (this.landTimer > 0) {
      this.landTimer = Math.max(0, this.landTimer - dt);
    }

    // 2) 목표 가중치 결정 (Idle / Walk / Jump / Land)
    const speedRatio = isMoving ? Math.min(1, moveSpeed / maxSpeed) : 0;
    const targetJump = isGrounded ? 0 : 1;
    const targetLand = (isGrounded && this.landTimer > 0) ? Math.min(1, (this.landTimer / this.landDuration) * 1.15) : 0;
    const targetWalk = isGrounded ? (isMoving ? Math.max(0.25, speedRatio) * (1 - targetLand * 0.45) : 0) : 0;
    const targetIdle = isGrounded ? Math.max(0, 1 - targetWalk - targetLand * 0.65) : 0;

    // 3) THREE.MathUtils.damp를 이용한 4개 상태 가중치 실시간 보간
    this.weights.jump = THREE.MathUtils.damp(this.weights.jump, targetJump, isGrounded ? 15 : 18, dt);
    this.weights.land = THREE.MathUtils.damp(this.weights.land, targetLand, targetLand > this.weights.land ? 24 : 14, dt);
    this.weights.walk = THREE.MathUtils.damp(this.weights.walk, targetWalk, targetWalk > this.weights.walk ? 13 : 11, dt);
    this.weights.idle = THREE.MathUtils.damp(this.weights.idle, targetIdle, 10, dt);

    const wSum = (this.weights.idle + this.weights.walk + this.weights.jump + this.weights.land) || 1;
    const wIdle = this.weights.idle / wSum;
    const wWalk = this.weights.walk / wSum;
    const wJump = this.weights.jump / wSum;
    const wLand = this.weights.land / wSum;

    // 4) 위상 진행 (Idle 호흡 & Walk 보폭)
    this.idlePhase += dt * 2.3;
    if (isMoving || wWalk > 0.04) {
      const strideSpeed = isMoving ? Math.max(moveSpeed, 1.5) : 3.2 * wWalk;
      this.walkPhase += dt * (strideSpeed * 1.45);
    }

    // --- 상태별 목표 관절/스케일 포즈 ---
    // [Idle] 차분한 호흡 리듬 & 자연스러운 팔 내림
    const breath = Math.sin(this.idlePhase);
    const idlePose = {
      lLegX: 0,
      rLegX: 0,
      lKneeX: 0.02 + Math.max(0, breath) * 0.02,
      rKneeX: 0.02 + Math.max(0, breath) * 0.02,
      lArmX: breath * 0.04,
      rArmX: -breath * 0.04,
      lArmZ: -0.02,
      rArmZ: 0.02,
      lElbowX: -0.10,
      rElbowX: -0.10,
      headX: breath * 0.025,
      scaleY: 1.0 + breath * 0.012,
      scaleXZ: 1.0 - breath * 0.006
    };

    // [Walk] 경쾌한 보행 + 무릎/팔꿈치 굴곡
    const s = Math.sin(this.walkPhase);
    const amp = 0.35 + 0.65 * Math.max(speedRatio, 0.45);
    const walkPose = {
      lLegX: s * 0.64 * amp,
      rLegX: -s * 0.64 * amp,
      lKneeX: Math.max(0, Math.sin(this.walkPhase + 0.72)) * 0.56 * amp,
      rKneeX: Math.max(0, -Math.sin(this.walkPhase + 0.72)) * 0.56 * amp,
      lArmX: -s * 0.56 * amp,
      rArmX: s * 0.56 * amp,
      lArmZ: -0.04,
      rArmZ: 0.04,
      lElbowX: -0.18 - Math.max(0, s) * 0.24 * amp,
      rElbowX: -0.18 - Math.max(0, -s) * 0.24 * amp,
      headX: 0.03 + Math.abs(s) * 0.03,
      scaleY: 1.0 + Math.abs(Math.cos(this.walkPhase)) * 0.02,
      scaleXZ: 1.0 - Math.abs(Math.cos(this.walkPhase)) * 0.01
    };

    // [Jump] 상승 시 만세 자세 + 무릎 굽힘 + Y 스트레치(Stretch), 하강 시 팔 벌림 + 부드러운 착지 대비
    const ascendFactor = THREE.MathUtils.clamp((velY + 1.5) / 6.5, 0, 1);
    const jumpPose = {
      lLegX: THREE.MathUtils.lerp(-0.14, -0.36, ascendFactor),
      rLegX: THREE.MathUtils.lerp(-0.22, -0.44, ascendFactor),
      lKneeX: THREE.MathUtils.lerp(0.32, 0.68, ascendFactor),
      rKneeX: THREE.MathUtils.lerp(0.38, 0.74, ascendFactor),
      lArmX: THREE.MathUtils.lerp(-0.56, -1.42, ascendFactor),
      rArmX: THREE.MathUtils.lerp(-0.56, -1.42, ascendFactor),
      lArmZ: THREE.MathUtils.lerp(-0.46, -0.26, ascendFactor),
      rArmZ: THREE.MathUtils.lerp(0.46, 0.26, ascendFactor),
      lElbowX: THREE.MathUtils.lerp(-0.22, -0.46, ascendFactor),
      rElbowX: THREE.MathUtils.lerp(-0.22, -0.46, ascendFactor),
      headX: THREE.MathUtils.lerp(0.08, -0.08, ascendFactor),
      scaleY: THREE.MathUtils.lerp(1.03, 1.12, ascendFactor),
      scaleXZ: THREE.MathUtils.lerp(0.985, 0.94, ascendFactor)
    };

    // [Land] 0.2초간 무릎을 굽히며 Y축을 살짝 눌렀다 복원하는 스쿼시(Squash) 반동
    const landProgress = this.landDuration > 0 ? Math.max(0, Math.min(1, 1 - this.landTimer / this.landDuration)) : 1;
    const squashPulse = Math.sin(landProgress * Math.PI);
    const landPose = {
      lLegX: -0.42 * squashPulse,
      rLegX: -0.42 * squashPulse,
      lKneeX: 0.78 * squashPulse,
      rKneeX: 0.78 * squashPulse,
      lArmX: 0.16 * squashPulse,
      rArmX: 0.16 * squashPulse,
      lArmZ: -0.38 * squashPulse,
      rArmZ: 0.38 * squashPulse,
      lElbowX: -0.32 * squashPulse,
      rElbowX: -0.32 * squashPulse,
      headX: 0.10 * squashPulse,
      scaleY: 1.0 - 0.15 * squashPulse,
      scaleXZ: 1.0 + 0.09 * squashPulse
    };

    const blend = k => (
      idlePose[k] * wIdle +
      walkPose[k] * wWalk +
      jumpPose[k] * wJump +
      landPose[k] * wLand
    );

    const rotDamp = 16;
    const scaleDamp = 18;
    const p = this.pose;
    p.lLegX = THREE.MathUtils.damp(p.lLegX, blend('lLegX'), rotDamp, dt);
    p.rLegX = THREE.MathUtils.damp(p.rLegX, blend('rLegX'), rotDamp, dt);
    p.lKneeX = THREE.MathUtils.damp(p.lKneeX, blend('lKneeX'), rotDamp, dt);
    p.rKneeX = THREE.MathUtils.damp(p.rKneeX, blend('rKneeX'), rotDamp, dt);
    p.lArmX = THREE.MathUtils.damp(p.lArmX, blend('lArmX'), rotDamp, dt);
    p.rArmX = THREE.MathUtils.damp(p.rArmX, blend('rArmX'), rotDamp, dt);
    p.lArmZ = THREE.MathUtils.damp(p.lArmZ, blend('lArmZ'), rotDamp, dt);
    p.rArmZ = THREE.MathUtils.damp(p.rArmZ, blend('rArmZ'), rotDamp, dt);
    p.lElbowX = THREE.MathUtils.damp(p.lElbowX, blend('lElbowX'), rotDamp, dt);
    p.rElbowX = THREE.MathUtils.damp(p.rElbowX, blend('rElbowX'), rotDamp, dt);
    p.headX = THREE.MathUtils.damp(p.headX, blend('headX'), 12, dt);
    p.scaleY = THREE.MathUtils.damp(p.scaleY, blend('scaleY'), scaleDamp, dt);
    p.scaleXZ = THREE.MathUtils.damp(p.scaleXZ, blend('scaleXZ'), scaleDamp, dt);

    // 관절 적용 (스테이지 고유 팔 동작이나 수중/도끼 모션과 충돌하지 않도록 선택적 스킵 지원)
    limbs.lLeg.rotation.x = p.lLegX;
    limbs.rLeg.rotation.x = p.rLegX;
    if (limbs.lKnee) limbs.lKnee.rotation.x = p.lKneeX;
    if (limbs.rKnee) limbs.rKnee.rotation.x = p.rKneeX;

    if (!state.skipArms) {
      if (!state.isChopping) {
        limbs.lArm.rotation.x = p.lArmX;
        limbs.lArm.rotation.z = p.lArmZ;
        if (limbs.lElbow) limbs.lElbow.rotation.x = p.lElbowX;
      }
      limbs.rArm.rotation.x = p.rArmX;
      limbs.rArm.rotation.z = p.rArmZ;
      if (limbs.rElbow) limbs.rElbow.rotation.x = p.rElbowX;
    }

    if (limbs.head) {
      limbs.head.rotation.x = p.headX;
    }

    if (state.playerGroup && state.playerGroup.scale && !state.skipBodyScale) {
      const bs = limbs.baseScale || (state.playerGroup.userData && state.playerGroup.userData.baseScale);
      const bx = bs ? bs.x : 1;
      const by = bs ? bs.y : 1;
      const bz = bs ? bs.z : 1;
      state.playerGroup.scale.set(bx * p.scaleXZ, by * p.scaleY, bz * p.scaleXZ);
    }

    let dominant = 'idle';
    let bestW = wIdle;
    if (wWalk > bestW) { bestW = wWalk; dominant = 'walk'; }
    if (wJump > bestW) { bestW = wJump; dominant = 'jump'; }
    if (wLand > bestW) { bestW = wLand; dominant = 'land'; }
    this.debugState = {
      activeState: dominant,
      weights: { idle: +wIdle.toFixed(3), walk: +wWalk.toFixed(3), jump: +wJump.toFixed(3), land: +wLand.toFixed(3) },
      scaleY: +p.scaleY.toFixed(3),
      scaleXZ: +p.scaleXZ.toFixed(3),
      landTimer: +this.landTimer.toFixed(3),
      lKneeX: +p.lKneeX.toFixed(3)
    };
  }
}
window.CharacterAnimator = CharacterAnimator;
window.ep4CharacterAnimator = new CharacterAnimator();

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
    g.userData = { flLeg, frLeg, blLeg, brLeg, headGroup, packL, packR, isPackDonkey: true, walkPhase: Math.random() * 6.28 };
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

window.createLowPolyDonkey = function (x, z, rotY = 0, isStatic = false) {
  const by = typeof getMiracleOpenWorldGroundHeight === 'function' ? getMiracleOpenWorldGroundHeight(x, z) : 0;
  const donkey = createLowPolyAnimalMesh('donkey', 1.0);
  donkey.position.set(x, by, z);
  donkey.rotation.y = rotY;
  worldGroup.add(donkey);
  if (isStatic) {
    colliders.push({ minX: x - 0.65, maxX: x + 0.65, minZ: z - 0.75, maxZ: z + 0.75 });
  }
  return donkey;
};

// =========================================================================
// [소프트 로우 폴리곤 로마 군인 전용 지오메트리 빌더]
// - 구/직선 프리미티브를 완전히 배제하고, 에피소드 4 인물들과 조화되는 입체 다면체 조형 적용
//   (갈레아 투구 + 아치형 붉은 말총 볏 + 볼가리개 + 다단 로리카 세그멘타타 갑옷 +
//    적층 견갑 + 주름 튜닉/가죽 프테리게스 + 곡면 스쿠툼 방패 + 드레이프 망토 + 필룸 창)
// =========================================================================
function _ensureOutwardWinding(verts, cx, cy, cz) {
  for (let i = 0; i < verts.length; i += 9) {
    const ax = verts[i],     ay = verts[i + 1], az = verts[i + 2];
    const bx = verts[i + 3], by = verts[i + 4], bz = verts[i + 5];
    const cx0 = verts[i + 6], cy0 = verts[i + 7], cz0 = verts[i + 8];
    const ux = bx - ax, uy = by - ay, uz = bz - az;
    const vx = cx0 - ax, vy = cy0 - ay, vz = cz0 - az;
    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    const mx = (ax + bx + cx0) / 3 - cx;
    const my = (ay + by + cy0) / 3 - cy;
    const mz = (az + bz + cz0) / 3 - cz;
    if (nx * mx + ny * my + nz * mz < 0) {
      verts[i + 3] = cx0; verts[i + 4] = cy0; verts[i + 5] = cz0;
      verts[i + 6] = bx;  verts[i + 7] = by;  verts[i + 8] = bz;
    }
  }
}

let _romanGaleaBowlGeo = null;
function getRomanGaleaBowlGeo() {
  if (_romanGaleaBowlGeo) return _romanGaleaBowlGeo;
  const segs = 10;
  // 5개 단면 링으로 두상에 부드럽게 밀착되고 뒷목 가리개(Neck Guard)가 자연스럽게 펼쳐지는 갈레아 투구 조형
  const rings = [
    { y: 0.305, rx: 0.085, rz: 0.095, cz: -0.015, flareBack: 0.00, browDip: 0.00 },
    { y: 0.258, rx: 0.210, rz: 0.222, cz: -0.018, flareBack: 0.00, browDip: 0.00 },
    { y: 0.172, rx: 0.268, rz: 0.278, cz: -0.020, flareBack: 0.01, browDip: 0.01 },
    { y: 0.092, rx: 0.278, rz: 0.285, cz: -0.022, flareBack: 0.04, browDip: 0.018 },
    { y: 0.036, rx: 0.286, rz: 0.292, cz: -0.026, flareBack: 0.095, browDip: 0.00 }
  ];
  const pts = rings.map((rg, rIdx) => {
    const row = [];
    for (let s = 0; s < segs; s++) {
      const phi = (s / segs) * Math.PI * 2;
      const sinP = Math.sin(phi);
      const cosP = Math.cos(phi);
      let x = sinP * rg.rx;
      let z = cosP * rg.rz + rg.cz;
      let y = rg.y;
      // 이마 쪽(cosP > 0.35) 완만한 아치 컷아웃 + 뒷목 쪽(cosP < -0.25) 로마 투구 특유의 넓게 퍼진 목가리개
      if (rIdx >= 3) {
        if (cosP > 0.35) {
          y += (rIdx === 4 ? 0.072 : 0.024) * ((cosP - 0.35) / 0.65);
          z += rg.browDip * cosP;
        } else if (cosP < -0.20) {
          const backT = (-cosP - 0.20) / 0.80;
          z -= rg.flareBack * backT;
          x *= 1.0 + (rIdx === 4 ? 0.10 * backT : 0.04 * backT);
          y -= (rIdx === 4 ? 0.058 : 0.014) * backT;
        }
      }
      row.push([x, y, z]);
    }
    return row;
  });

  const verts = [];
  const apex = [0, 0.328, -0.015];
  for (let s = 0; s < segs; s++) {
    const sn = (s + 1) % segs;
    pushTriangle(verts, apex, pts[0][s], pts[0][sn]);
  }
  for (let r = 0; r < rings.length - 1; r++) {
    for (let s = 0; s < segs; s++) {
      const sn = (s + 1) % segs;
      pushQuad(verts, pts[r][s], pts[r + 1][s], pts[r + 1][sn], pts[r][sn]);
    }
  }
  _ensureOutwardWinding(verts, 0, 0.12, -0.02);
  _romanGaleaBowlGeo = markCachedGeo(buildBufferGeoFromTriangles(verts));
  return _romanGaleaBowlGeo;
}

let _romanBrowArcGeo = null;
function getRomanBrowArcGeo() {
  if (_romanBrowArcGeo) return _romanBrowArcGeo;
  const steps = 6;
  const verts = [];
  const ringTop = [], ringBot = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const ang = -Math.PI * 0.42 + t * Math.PI * 0.84;
    const archPeak = Math.cos(ang) * 0.018;
    const rOut = 0.298;
    const rIn = 0.268;
    ringTop.push([Math.sin(ang) * rIn,  0.146 + archPeak, Math.cos(ang) * rIn  - 0.016]);
    ringBot.push([Math.sin(ang) * rOut, 0.114 + archPeak * 0.5, Math.cos(ang) * rOut - 0.008]);
  }
  for (let i = 0; i < steps; i++) {
    pushQuad(verts, ringTop[i], ringBot[i], ringBot[i + 1], ringTop[i + 1]);
  }
  _romanBrowArcGeo = markCachedGeo(buildBufferGeoFromTriangles(verts));
  return _romanBrowArcGeo;
}

const _romanCheekGuardGeoCache = {};
function getRomanCheekGuardGeo(isLeft) {
  const key = isLeft ? 'L' : 'R';
  if (_romanCheekGuardGeoCache[key]) return _romanCheekGuardGeoCache[key];
  const side = isLeft ? -1 : 1;
  // 관자놀이에서 턱선으로 부드럽게 휘어지며 감싸는 다면체 볼가리개
  const p0 = [side * 0.256,  0.075, -0.045];
  const p1 = [side * 0.262,  0.088,  0.078];
  const p2 = [side * 0.242, -0.032,  0.125];
  const p3 = [side * 0.186, -0.132,  0.115];
  const p4 = [side * 0.192, -0.115,  0.010];
  const p5 = [side * 0.236, -0.025, -0.052];
  const ridge = [side * 0.258, -0.018, 0.046];
  const verts = [];
  pushTriangle(verts, ridge, p0, p1);
  pushTriangle(verts, ridge, p1, p2);
  pushTriangle(verts, ridge, p2, p3);
  pushTriangle(verts, ridge, p3, p4);
  pushTriangle(verts, ridge, p4, p5);
  pushTriangle(verts, ridge, p5, p0);
  _ensureOutwardWinding(verts, 0, -0.02, 0.02);
  _romanCheekGuardGeoCache[key] = markCachedGeo(buildBufferGeoFromTriangles(verts));
  return _romanCheekGuardGeoCache[key];
}

let _romanCrestPlumeGeo = null;
function getRomanCrestPlumeGeo() {
  if (_romanCrestPlumeGeo) return _romanCrestPlumeGeo;
  // 이마 위에서 정수리를 넘어 뒷목까지 우아하게 휘어지는 부채꼴 소프트 로우폴리 말총 볏(Plume)
  const steps = 8;
  const innerL = [], innerR = [], midL = [], midR = [], outerTop = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const ang = -0.82 + t * 2.18; // 앞쪽 위 -> 정수리 -> 뒷목 아래
    const rBase = 0.272;
    const fanHeight = 0.165 + Math.sin(t * Math.PI) * 0.075;
    const halfWBase = 0.022 + Math.sin(t * Math.PI) * 0.014;
    const halfWMid  = 0.048 + Math.sin(t * Math.PI) * 0.020;
    const cz = -0.022;
    const cy = 0.088;
    const bz = cz - Math.sin(ang) * rBase;
    const by = cy + Math.cos(ang) * rBase;
    const mz = cz - Math.sin(ang) * (rBase + fanHeight * 0.56);
    const my = cy + Math.cos(ang) * (rBase + fanHeight * 0.56);
    const tz = cz - Math.sin(ang) * (rBase + fanHeight);
    const ty = cy + Math.cos(ang) * (rBase + fanHeight);
    innerL.push([-halfWBase, by, bz]);
    innerR.push([ halfWBase, by, bz]);
    midL.push([-halfWMid, my, mz]);
    midR.push([ halfWMid, my, mz]);
    outerTop.push([0, ty, tz]);
  }
  const verts = [];
  for (let i = 0; i < steps; i++) {
    pushQuad(verts, innerL[i], midL[i], midL[i + 1], innerL[i + 1]);
    pushQuad(verts, midL[i], outerTop[i], outerTop[i + 1], midL[i + 1]);
    pushQuad(verts, innerR[i + 1], midR[i + 1], midR[i], innerR[i]);
    pushQuad(verts, midR[i + 1], outerTop[i + 1], outerTop[i], midR[i]);
    pushQuad(verts, innerL[i + 1], innerR[i + 1], innerR[i], innerL[i]);
  }
  // 앞·뒤 캡 닫기
  pushTriangle(verts, innerL[0], innerR[0], midR[0]);
  pushTriangle(verts, innerL[0], midR[0], midL[0]);
  pushTriangle(verts, midL[0], midR[0], outerTop[0]);
  pushTriangle(verts, innerR[steps], innerL[steps], midL[steps]);
  pushTriangle(verts, innerR[steps], midL[steps], midR[steps]);
  pushTriangle(verts, midR[steps], midL[steps], outerTop[steps]);

  _ensureOutwardWinding(verts, 0, 0.36, -0.04);
  _romanCrestPlumeGeo = markCachedGeo(buildBufferGeoFromTriangles(verts));
  return _romanCrestPlumeGeo;
}

// 공용 소프트 로우폴리 로마 갈레아 투구 그룹 (createRomanSoldierMesh 및 오픈월드 백부장 공용!)
function createSoftRomanHelmetGroup(helmHex = '#7c8b9c', trimHex = '#d4a234', plumeHex = '#dc2626', isTransverse = false) {
  const hGrp = new THREE.Group();
  hGrp.name = 'romanGaleaHelmet';

  const bowl = createDoubleSideLowPolyMesh(getRomanGaleaBowlGeo(), helmHex, 0, 0.02, 0, true);
  const brow = createDoubleSideLowPolyMesh(getRomanBrowArcGeo(), trimHex, 0, 0.02, 0, false);
  const cheekL = createDoubleSideLowPolyMesh(getRomanCheekGuardGeo(true), helmHex, 0, 0.01, 0, false);
  const cheekR = createDoubleSideLowPolyMesh(getRomanCheekGuardGeo(false), helmHex, 0, 0.01, 0, false);

  // 정수리 볏 받침대(Crest Holder) & 아치형 말총 볏(Plume)
  const holder = createLowPolyMesh(new THREE.CylinderGeometry(0.036, 0.054, 0.068, 6), trimHex, 0, 0.355, -0.02, false);
  const plume = createLowPolyMesh(getRomanCrestPlumeGeo(), plumeHex, 0, 0.02, 0, true);
  if (isTransverse) {
    plume.rotation.y = Math.PI * 0.5;
    plume.scale.set(0.92, 0.96, 0.88);
  }
  hGrp.add(bowl, brow, cheekL, cheekR, holder, plume);
  return hGrp;
}

let _romanLoricaTorsoGeo = null;
function getRomanLoricaTorsoGeo() {
  if (_romanLoricaTorsoGeo) return _romanLoricaTorsoGeo;
  // 가슴에서 허리로 자연스럽게 조여지는 타원형 다단 로리카 세그멘타타 흉갑
  const segs = 10;
  const rings = [
    { y: 1.54, rx: 0.215, rz: 0.148 },
    { y: 1.44, rx: 0.295, rz: 0.205 },
    { y: 1.32, rx: 0.282, rz: 0.208 },
    { y: 1.22, rx: 0.270, rz: 0.194 },
    { y: 1.12, rx: 0.258, rz: 0.184 },
    { y: 1.00, rx: 0.244, rz: 0.174 }
  ];
  const rows = rings.map((rg, rIdx) => {
    const row = [];
    for (let s = 0; s < segs; s++) {
      const phi = (s / segs) * Math.PI * 2;
      const sinP = Math.sin(phi);
      const cosP = Math.cos(phi);
      // 가슴 전면(cosP > 0)에 입체 흉판 볼륨 + 단차 리지 부여
      const chestPuff = (rIdx === 1 || rIdx === 2) && cosP > 0 ? cosP * 0.022 : 0;
      const ridgeStep = (rIdx % 2 === 1) ? 0.008 : 0.0;
      row.push([sinP * (rg.rx + ridgeStep), rg.y, cosP * (rg.rz + chestPuff + ridgeStep)]);
    }
    return row;
  });
  const verts = [];
  for (let r = 0; r < rings.length - 1; r++) {
    for (let s = 0; s < segs; s++) {
      const sn = (s + 1) % segs;
      pushQuad(verts, rows[r][s], rows[r + 1][s], rows[r + 1][sn], rows[r][sn]);
    }
  }
  const topC = [0, 1.54, 0], botC = [0, 1.00, 0];
  for (let s = 0; s < segs; s++) {
    const sn = (s + 1) % segs;
    pushTriangle(verts, topC, rows[0][s], rows[0][sn]);
    pushTriangle(verts, botC, rows[rings.length - 1][sn], rows[rings.length - 1][s]);
  }
  _ensureOutwardWinding(verts, 0, 1.27, 0);
  _romanLoricaTorsoGeo = markCachedGeo(buildBufferGeoFromTriangles(verts));
  return _romanLoricaTorsoGeo;
}

const _romanPauldronGeoCache = {};
function getRomanPauldronGeo(isLeft) {
  const key = isLeft ? 'L' : 'R';
  if (_romanPauldronGeoCache[key]) return _romanPauldronGeoCache[key];
  const side = isLeft ? -1 : 1;
  // 어깨선을 따라 부드럽게 내려오는 3단 곡면 로리카 견갑(Pauldron)
  const arcSteps = 5;
  const rows = [
    { out: 0.145, y: 1.545, zScale: 0.145 },
    { out: 0.275, y: 1.520, zScale: 0.195 },
    { out: 0.365, y: 1.435, zScale: 0.205 },
    { out: 0.395, y: 1.330, zScale: 0.175 }
  ];
  const grid = rows.map(rg => {
    const r = [];
    for (let i = 0; i <= arcSteps; i++) {
      const u = (i / arcSteps) * 2 - 1; // -1(뒤) .. +1(앞)
      const ang = u * Math.PI * 0.48;
      const x = side * (rg.out * (0.86 + 0.14 * Math.cos(ang)));
      const y = rg.y - (1 - Math.cos(ang)) * 0.028;
      const z = Math.sin(ang) * rg.zScale;
      r.push([x, y, z]);
    }
    return r;
  });
  const verts = [];
  for (let r = 0; r < grid.length - 1; r++) {
    for (let i = 0; i < arcSteps; i++) {
      pushQuad(verts, grid[r][i], grid[r + 1][i], grid[r + 1][i + 1], grid[r][i + 1]);
    }
  }
  _ensureOutwardWinding(verts, side * 0.15, 1.38, 0);
  _romanPauldronGeoCache[key] = markCachedGeo(buildBufferGeoFromTriangles(verts));
  return _romanPauldronGeoCache[key];
}

let _romanTunicSkirtGeo = null;
function getRomanTunicSkirtGeo() {
  if (_romanTunicSkirtGeo) return _romanTunicSkirtGeo;
  // 자연스러운 천 주름(Fluted folds)이 들어간 소프트 로우폴리 로마 튜닉 스커트
  const segs = 12;
  const rings = [
    { y: 1.00, rx: 0.245, rz: 0.178, wave: 0.004 },
    { y: 0.84, rx: 0.285, rz: 0.215, wave: 0.014 },
    { y: 0.68, rx: 0.325, rz: 0.248, wave: 0.022 }
  ];
  const rows = rings.map(rg => {
    const row = [];
    for (let s = 0; s < segs; s++) {
      const phi = (s / segs) * Math.PI * 2;
      const fold = ((s % 2 === 0) ? 1 : -1) * rg.wave;
      row.push([Math.sin(phi) * (rg.rx + fold), rg.y, Math.cos(phi) * (rg.rz + fold * 0.8)]);
    }
    return row;
  });
  const verts = [];
  for (let r = 0; r < rings.length - 1; r++) {
    for (let s = 0; s < segs; s++) {
      const sn = (s + 1) % segs;
      pushQuad(verts, rows[r][s], rows[r + 1][s], rows[r + 1][sn], rows[r][sn]);
    }
  }
  _ensureOutwardWinding(verts, 0, 0.84, 0);
  _romanTunicSkirtGeo = markCachedGeo(buildBufferGeoFromTriangles(verts));
  return _romanTunicSkirtGeo;
}

let _romanFlowingCapeGeo = null;
function getRomanFlowingCapeGeo() {
  if (_romanFlowingCapeGeo) return _romanFlowingCapeGeo;
  // 양어깨에서 등 뒤로 부드럽게 주름지며 흘러내리는 S곡선 소프트 로우폴리 망토(Sagum)
  const cols = 6;
  const rowSpecs = [
    { y: 1.49, halfW: 0.27, zBase: -0.175, foldAmp: 0.010, curveZ: 0.025 },
    { y: 1.24, halfW: 0.31, zBase: -0.235, foldAmp: 0.022, curveZ: 0.032 },
    { y: 0.96, halfW: 0.36, zBase: -0.275, foldAmp: 0.032, curveZ: 0.040 },
    { y: 0.68, halfW: 0.41, zBase: -0.325, foldAmp: 0.040, curveZ: 0.045 },
    { y: 0.46, halfW: 0.45, zBase: -0.385, foldAmp: 0.045, curveZ: 0.050 }
  ];
  const grid = rowSpecs.map((rs, rIdx) => {
    const row = [];
    for (let c = 0; c <= cols; c++) {
      const u = (c / cols) * 2 - 1; // -1 .. +1
      const x = u * rs.halfW;
      const foldZ = Math.cos(c * Math.PI) * rs.foldAmp * (1 - Math.abs(u) * 0.25);
      const wrapZ = (u * u) * rs.curveZ;
      const hemWaveY = (rIdx === rowSpecs.length - 1) ? Math.sin(c * 1.65) * 0.032 : 0;
      row.push([x, rs.y + hemWaveY, rs.zBase + foldZ + wrapZ]);
    }
    return row;
  });
  const verts = [];
  for (let r = 0; r < grid.length - 1; r++) {
    for (let c = 0; c < cols; c++) {
      pushQuad(verts, grid[r][c], grid[r + 1][c], grid[r + 1][c + 1], grid[r][c + 1]);
    }
  }
  _romanFlowingCapeGeo = markCachedGeo(buildBufferGeoFromTriangles(verts));
  return _romanFlowingCapeGeo;
}

let _romanScutumShieldGeo = null;
function getRomanScutumShieldGeo() {
  if (_romanScutumShieldGeo) return _romanScutumShieldGeo;
  // 반원통형으로 자연스럽게 휘어진 로마 제국 곡면 방패(Scutum) - 평면 박스 완전 제거!
  const cols = 6;
  const rows = 4;
  const rad = 0.42;
  const halfH = 0.46;
  const maxAng = 0.72; // 약 82도 아치 곡면
  const thickness = 0.048;

  const frontGrid = [], backGrid = [];
  for (let r = 0; r <= rows; r++) {
    const v = (r / rows) * 2 - 1; // -1(하) .. +1(상)
    const y = v * halfH;
    // 상·하단 모서리를 살짝 둥글게 깎은 소프트 로우폴리 윤곽
    const edgeSoft = 1.0 - (v * v) * 0.07;
    const fRow = [], bRow = [];
    for (let c = 0; c <= cols; c++) {
      const u = (c / cols) * 2 - 1;
      const ang = u * maxAng * edgeSoft;
      // 방패가 왼팔 바깥쪽(-X 방향)을 볼록하게 감싸도록 X-Z 곡면 생성
      const fx = -Math.cos(ang) * rad + rad * 0.74;
      const fz =  Math.sin(ang) * rad;
      const bx = -Math.cos(ang) * (rad - thickness) + rad * 0.74;
      const bz =  Math.sin(ang) * (rad - thickness);
      fRow.push([fx, y, fz]);
      bRow.push([bx, y, bz]);
    }
    frontGrid.push(fRow);
    backGrid.push(bRow);
  }

  const frontVerts = [];
  const backVerts = [];
  const rimVerts = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      pushQuad(frontVerts, frontGrid[r][c], frontGrid[r][c + 1], frontGrid[r + 1][c + 1], frontGrid[r + 1][c]);
      pushQuad(backVerts, backGrid[r][c], backGrid[r + 1][c], backGrid[r + 1][c + 1], backGrid[r][c + 1]);
    }
  }
  // 상·하·좌·우 테두리 마감
  for (let c = 0; c < cols; c++) {
    pushQuad(rimVerts, frontGrid[rows][c], frontGrid[rows][c + 1], backGrid[rows][c + 1], backGrid[rows][c]);
    pushQuad(rimVerts, frontGrid[0][c + 1], frontGrid[0][c], backGrid[0][c], backGrid[0][c + 1]);
  }
  for (let r = 0; r < rows; r++) {
    pushQuad(rimVerts, frontGrid[r][0], frontGrid[r + 1][0], backGrid[r + 1][0], backGrid[r][0]);
    pushQuad(rimVerts, frontGrid[r + 1][cols], frontGrid[r][cols], backGrid[r][cols], backGrid[r + 1][cols]);
  }
  _ensureOutwardWinding(frontVerts, 0.31, 0, 0);
  // 안쪽 면은 원통 중심(+0.31)을 향하도록 외향 반대 방향 정렬
  for (let i = 0; i < backVerts.length; i += 9) {
    const ax = backVerts[i], ay = backVerts[i + 1], az = backVerts[i + 2];
    const bx = backVerts[i + 3], by = backVerts[i + 4], bz = backVerts[i + 5];
    const cx0 = backVerts[i + 6], cy0 = backVerts[i + 7], cz0 = backVerts[i + 8];
    const ux = bx - ax, uy = by - ay, uz = bz - az;
    const vx = cx0 - ax, vy = cy0 - ay, vz = cz0 - az;
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const mx = 0.31 - (ax + bx + cx0) / 3, my = -(ay + by + cy0) / 3, mz = -(az + bz + cz0) / 3;
    if (nx * mx + ny * my + nz * mz < 0) {
      backVerts[i + 3] = cx0; backVerts[i + 4] = cy0; backVerts[i + 5] = cz0;
      backVerts[i + 6] = bx;  backVerts[i + 7] = by;  backVerts[i + 8] = bz;
    }
  }
  const verts = frontVerts.concat(backVerts, rimVerts);
  _romanScutumShieldGeo = markCachedGeo(buildBufferGeoFromTriangles(verts));
  return _romanScutumShieldGeo;
}

let _romanScutumRimGeo = null;
function getRomanScutumRimGeo() {
  if (_romanScutumRimGeo) return _romanScutumRimGeo;
  // 곡면 스쿠툼 방패 상·하단 곡선을 정확히 따라가는 아치형 황동 테두리(직선 막대 제거!)
  const cols = 6;
  const rad = 0.428;
  const maxAng = 0.72 * 0.93;
  const th = 0.058;
  const rimH = 0.034;
  const verts = [];
  const addCurvedBand = (yCenter) => {
    const fTop = [], fBot = [], bTop = [], bBot = [];
    for (let c = 0; c <= cols; c++) {
      const u = (c / cols) * 2 - 1;
      const ang = u * maxAng;
      const fx = -Math.cos(ang) * rad + 0.42 * 0.74;
      const fz =  Math.sin(ang) * rad;
      const bx = -Math.cos(ang) * (rad - th) + 0.42 * 0.74;
      const bz =  Math.sin(ang) * (rad - th);
      fTop.push([fx, yCenter + rimH * 0.5, fz]);
      fBot.push([fx, yCenter - rimH * 0.5, fz]);
      bTop.push([bx, yCenter + rimH * 0.5, bz]);
      bBot.push([bx, yCenter - rimH * 0.5, bz]);
    }
    for (let c = 0; c < cols; c++) {
      pushQuad(verts, fBot[c], fBot[c + 1], fTop[c + 1], fTop[c]);
      pushQuad(verts, fTop[c], fTop[c + 1], bTop[c + 1], bTop[c]);
      pushQuad(verts, fBot[c + 1], fBot[c], bBot[c], bBot[c + 1]);
    }
  };
  addCurvedBand( 0.462);
  addCurvedBand(-0.462);
  _romanScutumRimGeo = markCachedGeo(buildBufferGeoFromTriangles(verts));
  return _romanScutumRimGeo;
}

let _romanLegLimbGeo = null;
function getRomanLegLimbGeo() {
  if (_romanLegLimbGeo) return _romanLegLimbGeo;
  // 허벅지-무릎-종아리 곡선이 살아있는 소프트 로우폴리 다리
  const segs = 7;
  const rings = [
    { y:  0.00, r: 0.105 },
    { y: -0.22, r: 0.088 },
    { y: -0.40, r: 0.094 },
    { y: -0.62, r: 0.070 }
  ];
  const rows = rings.map(rg => {
    const row = [];
    for (let s = 0; s < segs; s++) {
      const a = (s / segs) * Math.PI * 2;
      row.push([Math.sin(a) * rg.r, rg.y, Math.cos(a) * rg.r * 1.04]);
    }
    return row;
  });
  const verts = [];
  for (let r = 0; r < rings.length - 1; r++) {
    for (let s = 0; s < segs; s++) {
      const sn = (s + 1) % segs;
      pushQuad(verts, rows[r][s], rows[r + 1][s], rows[r + 1][sn], rows[r][sn]);
    }
  }
  _ensureOutwardWinding(verts, 0, -0.32, 0);
  _romanLegLimbGeo = markCachedGeo(buildBufferGeoFromTriangles(verts));
  return _romanLegLimbGeo;
}

let _romanShinGreaveGeo = null;
function getRomanShinGreaveGeo() {
  if (_romanShinGreaveGeo) return _romanShinGreaveGeo;
  // 정강이 앞면과 무릎뼈를 부드럽게 감싸는 곡면 정강이 갑옷(Ocrea)
  const cols = 4;
  const rows = [
    { y: -0.26, r: 0.106, peakZ: 0.020 },
    { y: -0.38, r: 0.104, peakZ: 0.012 },
    { y: -0.58, r: 0.084, peakZ: 0.008 }
  ];
  const grid = rows.map(rg => {
    const r = [];
    for (let c = 0; c <= cols; c++) {
      const u = (c / cols) * 2 - 1;
      const ang = u * Math.PI * 0.56;
      r.push([Math.sin(ang) * rg.r, rg.y, Math.cos(ang) * rg.r + Math.cos(ang) * rg.peakZ]);
    }
    return r;
  });
  const verts = [];
  for (let r = 0; r < grid.length - 1; r++) {
    for (let c = 0; c < cols; c++) {
      pushQuad(verts, grid[r][c], grid[r + 1][c], grid[r + 1][c + 1], grid[r][c + 1]);
    }
  }
  _romanShinGreaveGeo = markCachedGeo(buildBufferGeoFromTriangles(verts));
  return _romanShinGreaveGeo;
}

let _romanCaligaSandalGeo = null;
function getRomanCaligaSandalGeo() {
  if (_romanCaligaSandalGeo) return _romanCaligaSandalGeo;
  // 앞코가 둥글게 다듬어진 소프트 로우폴리 로마 군화(Caligae)
  const geo = new THREE.CylinderGeometry(0.085, 0.098, 0.28, 7, 2);
  geo.rotateX(Math.PI * 0.5);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    y *= 0.62;
    if (y < 0) y *= 0.72; // 바닥창 평탄화
    if (z > 0.04) {
      x *= 0.88;
      if (y > 0) y *= 0.76; // 둥근 발등 테이퍼
    }
    pos.setXYZ(i, x, y, z);
  }
  const finalGeo = markCachedGeo(geo.toNonIndexed());
  finalGeo.computeVertexNormals();
  _romanCaligaSandalGeo = finalGeo;
  return finalGeo;
}

const ROMAN_SOLDIER_VARIANTS = [
  {
    skin: '#efcaa6', hair: '#2e1d12', brow: '#2e1d12',
    tunic: '#b91c1c', tunicDark: '#991b1b', cape: '#8c1d18',
    armor: '#9aa8b8', armorHi: '#cbd5e1', helm: '#7c8b9c',
    trim: '#d4a234', plume: '#dc2626', leather: '#5c3118', leatherHi: '#7c4320',
    shield: '#9f1c1c', wood: '#6e4526', iron: '#e2e8f0', transverse: false
  },
  {
    skin: '#e8bf9a', hair: '#3b2416', brow: '#3b2416',
    tunic: '#a31c24', tunicDark: '#7f1d1d', cape: '#7c1a1d',
    armor: '#8e9aa8', armorHi: '#bcc7d4', helm: '#728091',
    trim: '#c99327', plume: '#e11d48', leather: '#4d2914', leatherHi: '#6b3b1e',
    shield: '#8f1920', wood: '#633c20', iron: '#dbe4ee', transverse: false
  },
  {
    skin: '#f1cda8', hair: '#241811', brow: '#241811',
    tunic: '#c82323', tunicDark: '#991b1b', cape: '#991b1b',
    armor: '#a7b5c6', armorHi: '#dce5f0', helm: '#8595a8',
    trim: '#eab308', plume: '#ef4444', leather: '#592e14', leatherHi: '#783f1c',
    shield: '#aa1e1e', wood: '#704628', iron: '#f1f5f9', transverse: true
  }
];

// [에피소드 4 스테이지 3 호송 · 스테이지 4 순찰 공용] 소프트 로우폴리 로마 군인
window.createRomanSoldierMesh = function (variantIdx = 0) {
  const pal = ROMAN_SOLDIER_VARIANTS[Math.abs(variantIdx || 0) % ROMAN_SOLDIER_VARIANTS.length];
  const g = new THREE.Group();

  // 1) 다리 (소프트 로우폴리 종아리 + 곡면 정강이 갑옷 Ocrea + 둥근 앞코 로마 군화 Caligae)
  const buildSoldierLeg = (isLeft) => {
    const lg = new THREE.Group();
    lg.position.set(isLeft ? -0.145 : 0.145, 0.74, 0);
    const calf = createLowPolyMesh(getRomanLegLimbGeo(), pal.skin, 0, 0, 0, true);
    const greave = createDoubleSideLowPolyMesh(getRomanShinGreaveGeo(), pal.armor, 0, 0, 0.008, false);
    const greaveTrim = createLowPolyMesh(new THREE.CylinderGeometry(0.106, 0.104, 0.032, 7), pal.trim, 0, -0.26, 0.012, false);
    const sandal = createLowPolyMesh(getRomanCaligaSandalGeo(), pal.leather, 0, -0.695, 0.045, true);
    const strap = createLowPolyMesh(new THREE.CylinderGeometry(0.082, 0.086, 0.09, 7), pal.leatherHi, 0, -0.61, 0.012, false);
    lg.add(calf, greave, greaveTrim, sandal, strap);
    return lg;
  };
  const lLeg = buildSoldierLeg(true);
  const rLeg = buildSoldierLeg(false);

  // 2) 몸통 (주름 튜닉 스커트 + 다단 곡면 로리카 세그멘타타 흉갑 + 가죽 프테리게스 + 적층 견갑 + 드레이프 망토)
  const tunicSkirt = createDoubleSideLowPolyMesh(getRomanTunicSkirtGeo(), pal.tunic, 0, 0, 0, true);
  const loricaTorso = createLowPolyMesh(getRomanLoricaTorsoGeo(), pal.armor, 0, 0, 0, true);

  // 가슴 적층 강판(Segmented Bands) 강조 라인 & 전면 황동 체결 버클
  const chestPlateHi = createLowPolyMesh(new THREE.CylinderGeometry(0.292, 0.282, 0.11, 10), pal.armorHi, 0, 1.38, 0.006, false);
  chestPlateHi.scale.set(1.0, 1.0, 0.72);
  const midPlateBand = createLowPolyMesh(new THREE.CylinderGeometry(0.275, 0.266, 0.075, 10), pal.armorHi, 0, 1.22, 0.005, false);
  midPlateBand.scale.set(1.0, 1.0, 0.72);
  const collarTrim = createLowPolyMesh(new THREE.CylinderGeometry(0.165, 0.225, 0.075, 8), pal.tunicDark, 0, 1.545, 0, false);
  collarTrim.scale.set(1.04, 1.0, 0.76);
  const neck = createLowPolyMesh(new THREE.CylinderGeometry(0.090, 0.110, 0.20, 8), pal.skin, 0, 1.635, 0, false);

  // 적층 곡면 견갑(Pauldrons) + 어깨 망토 황동 브로치(Fibula)
  const pauldronL = createDoubleSideLowPolyMesh(getRomanPauldronGeo(true), pal.armorHi, 0, 0, 0, true);
  const pauldronR = createDoubleSideLowPolyMesh(getRomanPauldronGeo(false), pal.armorHi, 0, 0, 0, true);
  const claspL = createLowPolyMesh(new THREE.OctahedronGeometry(0.044, 0), pal.trim, -0.21, 1.49, 0.135, false);
  claspL.scale.set(1.0, 1.0, 0.52);
  const claspR = createLowPolyMesh(new THREE.OctahedronGeometry(0.044, 0), pal.trim,  0.21, 1.49, 0.135, false);
  claspR.scale.set(1.0, 1.0, 0.52);

  // 허리 가죽 띠(Cingulum) + 황동 버클 + 8갈래 소프트 로우폴리 프테리게스(Pteruges) 가죽 갑편
  const belt = createLowPolyMesh(new THREE.CylinderGeometry(0.258, 0.264, 0.095, 10), pal.leather, 0, 0.99, 0, false);
  belt.scale.set(1.02, 1.0, 0.74);
  const buckle = createLowPolyMesh(new THREE.OctahedronGeometry(0.064, 0), pal.trim, 0, 0.99, 0.198, false);
  buckle.scale.set(1.15, 0.88, 0.45);

  const pterugesGrp = new THREE.Group();
  const stripGeo = new THREE.CylinderGeometry(0.032, 0.024, 0.25, 5);
  stripGeo.scale(1.1, 1.0, 0.42);
  const stripNonIdx = markCachedGeo(stripGeo.toNonIndexed());
  stripNonIdx.computeVertexNormals();
  for (let i = 0; i < 8; i++) {
    const phi = -Math.PI * 0.82 + (i / 7) * Math.PI * 1.64;
    const sx = Math.sin(phi) * 0.265;
    const sz = Math.cos(phi) * 0.198;
    const strip = createLowPolyMesh(stripNonIdx, (i % 2 === 0) ? pal.leather : pal.leatherHi, sx, 0.84, sz, false);
    strip.rotation.y = phi;
    strip.rotation.x = -0.14;
    const stud = createLowPolyMesh(new THREE.OctahedronGeometry(0.018, 0), pal.trim, sx * 1.04, 0.77, sz * 1.06, false);
    pterugesGrp.add(strip, stud);
  }

  // 드레이프 로마 망토(Sagum)
  const cape = createDoubleSideLowPolyMesh(getRomanFlowingCapeGeo(), pal.cape, 0, 0, 0, true);

  // 3) 소프트 로우폴리 두상 & 이목구비 + 갈레아 투구 + 아치형 붉은 말총 볏
  const head = new THREE.Group();
  head.position.set(0, 1.90, 0);
  const faceMesh = createLowPolyMesh(getSoftLowPolyHeadGeo(true, false), pal.skin, 0, 0, 0, true);
  faceMesh.name = 'headBase';
  const facialFeatures = createSoftFacialFeaturesGroup(pal.skin, pal.hair, false, true, pal.brow);
  const earL = createLowPolyMesh(getSculptedEarGeo(true),  pal.skin, -0.228, -0.008, -0.012, false);
  const earR = createLowPolyMesh(getSculptedEarGeo(false), pal.skin,  0.228, -0.008, -0.012, false);
  const helmetGrp = createSoftRomanHelmetGroup(pal.helm, pal.trim, pal.plume, pal.transverse);
  head.add(faceMesh, facialFeatures, earL, earR, helmetGrp);

  // 공용 소프트 로우폴리 팔/손 빌더 (튜닉 소매 + 근육형 팔뚝 + 부드러운 손바닥/손가락)
  const buildSoldierArmCore = (isLeft) => {
    const side = isLeft ? -1 : 1;
    const armGrp = new THREE.Group();
    armGrp.position.set(side * 0.34, 1.44, 0);
    const sleeve = createLowPolyMesh(new THREE.CylinderGeometry(0.102, 0.094, 0.24, 7), pal.tunic, 0, -0.11, 0, true);
    const leatherCuff = createLowPolyMesh(new THREE.CylinderGeometry(0.098, 0.092, 0.045, 7), pal.leather, 0, -0.22, 0, false);
    const forearm = createLowPolyMesh(new THREE.CylinderGeometry(0.078, 0.062, 0.30, 7), pal.skin, 0, -0.37, 0.02, true);
    forearm.rotation.x = -0.10;
    const vambrace = createLowPolyMesh(new THREE.CylinderGeometry(0.076, 0.068, 0.15, 7), pal.leatherHi, 0, -0.42, 0.025, false);
    vambrace.rotation.x = -0.10;
    const handPalm = createLowPolyMesh(new THREE.DodecahedronGeometry(0.062, 0), pal.skin, 0, -0.54, 0.04, false);
    handPalm.scale.set(0.88, 1.08, 0.72);
    armGrp.add(sleeve, leatherCuff, forearm, vambrace, handPalm);
    return armGrp;
  };

  // 4) 왼팔 + 곡면 로마 방패(Scutum) + 곡면 황동 테두리 & 입체 Umbo 보스
  const lArm = buildSoldierArmCore(true);
  const shieldGrp = new THREE.Group();
  shieldGrp.position.set(-0.08, -0.34, 0.14);
  const shieldBody = createDoubleSideLowPolyMesh(getRomanScutumShieldGeo(), pal.shield, 0, 0, 0, true);
  const shieldRims = createDoubleSideLowPolyMesh(getRomanScutumRimGeo(), pal.trim, 0, 0, 0, false);
  // 방패 중앙 볼록 황동 Umbo 보스 & 대각 황금 번개 문양
  const umboBase = createLowPolyMesh(new THREE.CylinderGeometry(0.115, 0.135, 0.045, 8), pal.trim, -0.135, 0, 0, false);
  umboBase.rotation.z = Math.PI * 0.5;
  const umboDome = createLowPolyMesh(new THREE.OctahedronGeometry(0.092, 1), pal.trim, -0.165, 0, 0, false);
  umboDome.scale.set(0.55, 1.0, 1.0);
  const wingUpL = createLowPolyMesh(new THREE.ConeGeometry(0.045, 0.34, 4), pal.trim, -0.11,  0.22,  0.11, false);
  wingUpL.rotation.set(0.45, 0, 0.25);
  const wingUpR = createLowPolyMesh(new THREE.ConeGeometry(0.045, 0.34, 4), pal.trim, -0.11,  0.22, -0.11, false);
  wingUpR.rotation.set(-0.45, 0, 0.25);
  const wingDnL = createLowPolyMesh(new THREE.ConeGeometry(0.045, 0.34, 4), pal.trim, -0.11, -0.22,  0.11, false);
  wingDnL.rotation.set(Math.PI - 0.45, 0, 0.25);
  const wingDnR = createLowPolyMesh(new THREE.ConeGeometry(0.045, 0.34, 4), pal.trim, -0.11, -0.22, -0.11, false);
  wingDnR.rotation.set(Math.PI + 0.45, 0, 0.25);
  shieldGrp.add(shieldBody, shieldRims, umboBase, umboDome, wingUpL, wingUpR, wingDnL, wingDnR);
  lArm.add(shieldGrp);

  // 5) 오른팔 + 소프트 로우폴리 로마 필룸(Pilum) 창
  const rArm = buildSoldierArmCore(false);
  const spearGrp = new THREE.Group();
  spearGrp.position.set(0.03, -0.52, 0.08);
  const shaft = createLowPolyMesh(new THREE.CylinderGeometry(0.028, 0.035, 1.95, 6), pal.wood, 0, 0.46, 0, true);
  const gripWrap = createLowPolyMesh(new THREE.CylinderGeometry(0.038, 0.038, 0.24, 6), pal.leather, 0, 0.02, 0, false);
  const pommel = createLowPolyMesh(new THREE.ConeGeometry(0.036, 0.14, 5), pal.trim, 0, -0.56, 0, false);
  pommel.rotation.x = Math.PI;
  const ironSocket = createLowPolyMesh(new THREE.CylinderGeometry(0.034, 0.046, 0.16, 6), pal.trim, 0, 1.48, 0, false);
  const ironShank = createLowPolyMesh(new THREE.CylinderGeometry(0.018, 0.024, 0.42, 5), pal.iron, 0, 1.75, 0, false);
  const spearHead = createLowPolyMesh(new THREE.OctahedronGeometry(0.068, 0), pal.iron, 0, 2.04, 0, true);
  spearHead.scale.set(0.75, 2.25, 0.48);
  spearGrp.add(shaft, gripWrap, pommel, ironSocket, ironShank, spearHead);
  const torchProp = (typeof window.createBurningTorchProp === 'function') ? window.createBurningTorchProp() : null;
  if (torchProp) {
    torchProp.group.position.set(0.02, -0.50, 0.14);
    torchProp.group.rotation.x = 0.78;
    torchProp.group.visible = false;
    rArm.add(torchProp.group);
  }
  rArm.add(spearGrp);
  rArm.rotation.x = -0.35;

  g.add(
    lLeg, rLeg, tunicSkirt, loricaTorso, chestPlateHi, midPlateBand, collarTrim, neck,
    pauldronL, pauldronR, claspL, claspR, belt, buckle, pterugesGrp, cape, head, lArm, rArm
  );
  g.userData = { lLeg, rLeg, lArm, rArm, head, spearGrp, torchProp, isRomanSoldier: true, variantIdx, style: 'soft_lowpoly_v19' };
  return g;
};

// [레퍼런스 반영] 소프트 로우 폴리곤 다면체 갈릴리 물고기 6종 팩토리 (등·배 투톤, 눈, 등/가슴/배지느러미, V자 갈래 꼬리)
const MIRACLE_FISH_PALETTES = [
  { body: '#f59e0b', belly: '#fde68a', fin: '#fb923c', stripe: '#ea580c' }, // 황금 잉어 (Gold Carp)
  { body: '#6b9e8a', belly: '#d8e6de', fin: '#a3b899', stripe: '#4d7c6b' }, // 갈릴리 베드로 고기 (Tilapia)
  { body: '#7fa67c', belly: '#e2e8e0', fin: '#e69b8a', stripe: '#f2a69c' }, // 무지개 송어 (Trout)
  { body: '#6c9638', belly: '#e9e2b8', fin: '#eab308', stripe: '#3f6212' }, // 줄무늬 농어 (Perch)
  { body: '#c49a6c', belly: '#ede0c8', fin: '#9a7248', stripe: '#855e36' }, // 모래 잉어 (Barbel)
  { body: '#2563eb', belly: '#93c5fd', fin: '#facc15', stripe: '#1e3a8a' }  // 코발트 블루피쉬 (Blue Fish)
];
window.MIRACLE_FISH_PALETTES = MIRACLE_FISH_PALETTES;

function createLowPolyFishMesh(colorHex = '#f97316', scale = 1.0, variant = null) {
  const fGrp = new THREE.Group();
  const s = scale;

  let pal;
  if (typeof variant === 'number' && variant >= 0) {
    pal = MIRACLE_FISH_PALETTES[variant % MIRACLE_FISH_PALETTES.length];
  } else if (colorHex === '#38bdf8' || colorHex === '#0284c7') {
    pal = MIRACLE_FISH_PALETTES[1]; // 갈릴리 청록 베드로 고기
  } else if (colorHex === '#f97316' || colorHex === '#f59e0b') {
    pal = MIRACLE_FISH_PALETTES[0]; // 황금 오렌지 잉어
  } else if (colorHex === '#93c5fd') {
    pal = MIRACLE_FISH_PALETTES[2]; // 은빛 송어
  } else {
    pal = { body: colorHex || '#6b9e8a', belly: '#e2e8f0', fin: '#eab308', stripe: colorHex || '#4d7c6b' };
  }

  // 1) 다면체 유선형 몸통 (앞머리 + 중앙 등/배 + 꼬리자루)
  const mainBody = createLowPolyMesh(new THREE.IcosahedronGeometry(0.30 * s, 0), pal.body, 0, 0.03 * s, 0.04 * s, false);
  mainBody.scale.set(0.56, 0.88, 1.58);

  const belly = createLowPolyMesh(new THREE.IcosahedronGeometry(0.24 * s, 0), pal.belly, 0, -0.07 * s, 0.06 * s, false);
  belly.scale.set(0.52, 0.62, 1.42);

  const snout = createLowPolyMesh(new THREE.ConeGeometry(0.16 * s, 0.34 * s, 5), pal.body, 0, 0.0, 0.48 * s, false);
  snout.rotation.x = Math.PI * 0.5;
  snout.scale.set(0.66, 1.0, 0.96);

  const lip = createLowPolyMesh(new THREE.DodecahedronGeometry(0.065 * s, 0), pal.fin, 0, -0.04 * s, 0.61 * s, false);
  lip.scale.set(0.95, 0.55, 0.72);

  const tailPeduncle = createLowPolyMesh(new THREE.ConeGeometry(0.14 * s, 0.38 * s, 5), pal.stripe, 0, 0.01 * s, -0.44 * s, false);
  tailPeduncle.rotation.x = -Math.PI * 0.5;
  tailPeduncle.scale.set(0.52, 1.0, 0.92);

  // 2) V자 갈래 꼬리지느러미 (상/하 비대칭 다면체 날개 — 헤엄칠 때 tailPivot 흔들림 지원!)
  const tailPivot = new THREE.Group();
  tailPivot.position.set(0, 0.01 * s, -0.56 * s);
  const tailUp = createLowPolyMesh(new THREE.ConeGeometry(0.14 * s, 0.38 * s, 4), pal.fin, 0, 0.11 * s, -0.15 * s, false);
  tailUp.rotation.x = -Math.PI * 0.34;
  tailUp.scale.set(0.26, 1.0, 0.85);
  const tailLo = createLowPolyMesh(new THREE.ConeGeometry(0.13 * s, 0.34 * s, 4), pal.fin, 0, -0.10 * s, -0.14 * s, false);
  tailLo.rotation.x = -Math.PI * 0.66;
  tailLo.scale.set(0.26, 1.0, 0.85);
  tailPivot.add(tailUp, tailLo);

  // 3) 뾰족하게 뻗은 등지느러미 + 양쪽 가슴지느러미 + 아래 배지느러미
  const dorsalMain = createLowPolyMesh(new THREE.ConeGeometry(0.15 * s, 0.36 * s, 4), pal.fin, 0, 0.28 * s, -0.02 * s, false);
  dorsalMain.rotation.x = -0.58;
  dorsalMain.scale.set(0.24, 1.0, 1.45);
  const dorsalRear = createLowPolyMesh(new THREE.ConeGeometry(0.09 * s, 0.22 * s, 4), pal.stripe, 0, 0.21 * s, -0.24 * s, false);
  dorsalRear.rotation.x = -0.68;
  dorsalRear.scale.set(0.22, 1.0, 1.10);

  const pecL = createLowPolyMesh(new THREE.ConeGeometry(0.10 * s, 0.28 * s, 4), pal.fin, -0.17 * s, -0.07 * s, 0.10 * s, false);
  pecL.rotation.set(-0.42, -0.45, 1.08);
  pecL.scale.set(0.25, 1.0, 0.88);
  const pecR = createLowPolyMesh(new THREE.ConeGeometry(0.10 * s, 0.28 * s, 4), pal.fin,  0.17 * s, -0.07 * s, 0.10 * s, false);
  pecR.rotation.set(-0.42,  0.45, -1.08);
  pecR.scale.set(0.25, 1.0, 0.88);

  const pelvic = createLowPolyMesh(new THREE.ConeGeometry(0.08 * s, 0.20 * s, 4), pal.fin, 0, -0.22 * s, -0.14 * s, false);
  pelvic.rotation.x = Math.PI + 0.55;
  pelvic.scale.set(0.24, 1.0, 1.1);

  // 4) 양쪽 또렷한 눈 (금/흰 테두리 + 검은 눈동자)
  [-1, 1].forEach(side => {
    const eyeRing = createLowPolyMesh(new THREE.DodecahedronGeometry(0.052 * s, 0), '#fef9c3', side * 0.115 * s, 0.06 * s, 0.36 * s, false);
    const pupil   = createLowPolyMesh(new THREE.DodecahedronGeometry(0.032 * s, 0), '#111827', side * 0.142 * s, 0.065 * s, 0.375 * s, false);
    fGrp.add(eyeRing, pupil);
  });

  fGrp.add(mainBody, belly, snout, lip, tailPeduncle, tailPivot, dorsalMain, dorsalRear, pecL, pecR, pelvic);
  fGrp.userData = { tailPivot, fishStyle: 'soft_lowpoly_v11', palette: pal };
  return fGrp;
}
window.createLowPolyFishMesh = createLowPolyFishMesh;

function createBranchSegmentMesh(p1, p2, rBottom, rTop, colorHex, seed = 1, flareRoot = false) {
  if (typeof window.createOrganicWoodSegmentMesh === 'function') {
    return window.createOrganicWoodSegmentMesh(p1, p2, rBottom, rTop, colorHex, seed, flareRoot ? 0.12 : 0.17, flareRoot);
  }
  const dir = new THREE.Vector3().subVectors(p2, p1);
  const len = dir.length();
  const geo = new THREE.CylinderGeometry(rTop, rBottom, len, 6, 3);
  geo.translate(0, len * 0.5, 0);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i), vy = pos.getY(i), vz = pos.getZ(i);
    const t = len > 0.01 ? vy / len : 0;
    const n = Math.sin(t * 7.5 + vx * 5.2 + seed) * 0.10;
    const bend = Math.sin(t * Math.PI) * len * 0.06;
    pos.setXYZ(i, vx * (1 + n) + bend, vy, vz * (1 - n * 0.7));
  }
  const finalGeo = geo.toNonIndexed();
  finalGeo.computeVertexNormals();
  geo.dispose();

  const mesh = createLowPolyMesh(finalGeo, colorHex, p1.x, p1.y, p1.z, true);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  return mesh;
}

function getEp4AssetGroundY(x, z) {
  if (typeof getBaseGroundHeight === 'function') return getBaseGroundHeight(x, z);
  if (typeof getMiracleOpenWorldGroundHeight === 'function') return getMiracleOpenWorldGroundHeight(x, z);
  return 0;
}

function addLowPolyCanopyTree(x, z, scale = 1.0, addCol = true) {
  if (typeof recordMiracleWorldTree === 'function') recordMiracleWorldTree(x, z, 'canopy', scale);
  const by = getEp4AssetGroundY(x, z);
  const grp = new THREE.Group();
  const seed = Math.abs(Math.round(x * 17 + z * 31)) + 9;
  const barkCol = '#6b442a', barkLite = '#7a5032', leafDark = '#527324', leafMid = '#6d9432', leafLite = '#8ab340';
  const leanX = (((seed % 5) - 2) * 0.11) * scale;
  const leanZ = ((((seed >> 2) % 5) - 2) * 0.09) * scale;

  const forkP = new THREE.Vector3(leanX, 1.85 * scale, leanZ);
  let mainTrunk;
  if (typeof window.createOrganicWoodTrunkGeo === 'function') {
    const trunkGeo = window.createOrganicWoodTrunkGeo(
      [
        [0, -0.10 * scale, 0],
        [leanX * 0.45 + 0.12 * scale, 0.65 * scale, leanZ * 0.35 - 0.08 * scale],
        [leanX * 0.85 - 0.08 * scale, 1.30 * scale, leanZ * 0.80 + 0.08 * scale],
        [forkP.x, forkP.y, forkP.z]
      ],
      [0.62 * scale, 0.48 * scale, 0.41 * scale, 0.34 * scale],
      7,
      seed,
      true
    );
    mainTrunk = createLowPolyMesh(trunkGeo, barkCol, 0, 0, 0, true);
  } else {
    mainTrunk = createBranchSegmentMesh(new THREE.Vector3(0, -0.06 * scale, 0), forkP, 0.56 * scale, 0.35 * scale, barkCol, seed, true);
  }
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
    const mP = new THREE.Vector3(b.mid[0] * scale + leanX * 0.4, b.mid[1] * scale, b.mid[2] * scale + leanZ * 0.4);
    const tP = new THREE.Vector3(b.tip[0] * scale + leanX * 0.3, b.tip[1] * scale, b.tip[2] * scale + leanZ * 0.3);
    const bCol = idx % 2 === 0 ? barkCol : barkLite;
    const b1 = createBranchSegmentMesh(forkP, mP, 0.27 * scale, 0.18 * scale, bCol, seed + idx * 13 + 3, false);
    const b2 = createBranchSegmentMesh(mP, tP, 0.18 * scale, 0.095 * scale, bCol, seed + idx * 19 + 7, false);

    const padGeo = createFlattenedFoliagePadGeo(b.padR * scale, b.padH * scale, 1);
    const padMesh = createLowPolyMesh(padGeo, b.col, tP.x, tP.y + 0.15 * scale, tP.z, true);
    padMesh.rotation.y = idx * 1.1 + (seed % 7) * 0.25;

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
  if (typeof recordMiracleWorldTree === 'function') recordMiracleWorldTree(x, z, 'olive', scale);

  const by = getEp4AssetGroundY(x, z);
  const grp = new THREE.Group();
  const seed = Math.abs(Math.round(x * 13 + z * 29)) + 15;
  const barkCol = '#7c4d2b';
  const barkDark = '#683f22';
  const twistSign = (seed % 2 === 0 ? 1 : -1);

  const p1 = new THREE.Vector3(twistSign * 0.24 * scale, 1.48 * scale, -twistSign * 0.10 * scale);
  const p2 = new THREE.Vector3(-twistSign * 0.10 * scale, 2.88 * scale, twistSign * 0.12 * scale);
  const pBranchL = new THREE.Vector3(-1.12 * scale, 2.40 * scale, 0.28 * scale);
  const pBranchR = new THREE.Vector3( 1.10 * scale, 2.58 * scale, -0.24 * scale);

  let mainTrunk;
  if (typeof window.createOrganicWoodTrunkGeo === 'function') {
    const trunkGeo = window.createOrganicWoodTrunkGeo(
      [
        [0, -0.08 * scale, 0],
        [twistSign * 0.18 * scale, 0.78 * scale, -twistSign * 0.08 * scale],
        [p1.x, p1.y, p1.z],
        [p2.x * 0.4 + p1.x * 0.6, 2.18 * scale, p2.z * 0.5],
        [p2.x, p2.y, p2.z]
      ],
      [0.42 * scale, 0.30 * scale, 0.24 * scale, 0.18 * scale, 0.12 * scale],
      6,
      seed,
      true
    );
    mainTrunk = createLowPolyMesh(trunkGeo, barkCol, 0, 0, 0, true);
  } else {
    mainTrunk = createBranchSegmentMesh(new THREE.Vector3(0, -0.06 * scale, 0), p2, 0.36 * scale, 0.14 * scale, barkCol, seed, true);
  }
  const bL = createBranchSegmentMesh(p1, pBranchL, 0.16 * scale, 0.08 * scale, barkDark, seed + 11, false);
  const bR = createBranchSegmentMesh(p1, pBranchR, 0.16 * scale, 0.08 * scale, barkCol, seed + 23, false);

  const padTop = createLowPolyMesh(createFlattenedFoliagePadGeo(1.55 * scale, 0.85 * scale, 1), '#759636', p2.x, p2.y + 0.15 * scale, p2.z, true);
  const padL   = createLowPolyMesh(createFlattenedFoliagePadGeo(1.15 * scale, 0.68 * scale, 0), '#5c7a29', pBranchL.x, pBranchL.y + 0.1 * scale, pBranchL.z, true);
  const padR   = createLowPolyMesh(createFlattenedFoliagePadGeo(1.20 * scale, 0.72 * scale, 0), '#8ab340', pBranchR.x, pBranchR.y + 0.1 * scale, pBranchR.z, true);

  grp.add(mainTrunk, bL, bR, padTop, padL, padR);
  grp.position.set(x, by, z);
  worldGroup.add(grp);
  wallMeshes.push(mainTrunk, padTop, padL, padR);

  if (addCol) {
    colliders.push({ minX: x - 0.55 * scale, maxX: x + 0.55 * scale, minZ: z - 0.55 * scale, maxZ: z + 0.55 * scale });
  }
  return grp;
};

window.addLowPolyCypressPineTree = function (x, z, scale = 1.0, addCol = true) {
  if (typeof recordMiracleWorldTree === 'function') recordMiracleWorldTree(x, z, 'cypress', scale);
  const by = getEp4AssetGroundY(x, z);
  const grp = new THREE.Group();
  const seed = Math.abs(Math.round(x * 19 + z * 11)) + 27;
  const leanX = (((seed % 3) - 1) * 0.09) * scale;
  const leanZ = ((((seed >> 1) % 3) - 1) * 0.08) * scale;

  let trunk;
  if (typeof window.createOrganicWoodTrunkGeo === 'function') {
    const trunkGeo = window.createOrganicWoodTrunkGeo(
      [
        [0, -0.08 * scale, 0],
        [leanX * 0.6 + 0.06 * scale, 0.65 * scale, leanZ * 0.4 - 0.05 * scale],
        [leanX - 0.04 * scale, 1.32 * scale, leanZ + 0.05 * scale],
        [leanX * 0.7, 1.92 * scale, leanZ * 0.7]
      ],
      [0.32 * scale, 0.23 * scale, 0.18 * scale, 0.12 * scale],
      6,
      seed,
      true
    );
    trunk = createLowPolyMesh(trunkGeo, '#5c3a21', 0, 0, 0, true);
  } else {
    trunk = createBranchSegmentMesh(new THREE.Vector3(0, -0.06 * scale, 0), new THREE.Vector3(leanX, 1.85 * scale, leanZ), 0.28 * scale, 0.13 * scale, '#5c3a21', seed, true);
  }

  const gemGeo = new THREE.IcosahedronGeometry(1.15 * scale, 0);
  const crown1 = createLowPolyMesh(gemGeo, '#2d4c1e', leanX * 0.7, 2.85 * scale, leanZ * 0.7, true);
  crown1.scale.set(0.78, 1.55, 0.78);
  crown1.rotation.y = (x + z) * 0.5;

  const crown2 = createLowPolyMesh(new THREE.IcosahedronGeometry(0.85 * scale, 0), '#3f6212', leanX * 0.7, 4.15 * scale, leanZ * 0.7, true);
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
  const by = getEp4AssetGroundY(x, z);
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
  const by = getEp4AssetGroundY(x, z);
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

// -------------------------------------------------------------------------
// 11. 밤 시간대 광원·소품 팩토리 (성전 화롯대, 마을 모닥불, NPC 등잔, 군인 횃불, 두루마리)
// -------------------------------------------------------------------------
function createNightFlameCluster(scale = 1.0) {
  const flameGrp = new THREE.Group();
  const outerMat = new THREE.MeshBasicMaterial({ color: 0xea580c, transparent: true, opacity: 0.90, fog: false });
  const midMat = new THREE.MeshBasicMaterial({ color: 0xfb923c, transparent: true, opacity: 0.94, fog: false });
  const coreMat = new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.98, fog: false });

  const f1 = new THREE.Mesh(new THREE.ConeGeometry(0.28 * scale, 0.72 * scale, 5), outerMat);
  f1.position.set(0, 0.34 * scale, 0);
  const f2 = new THREE.Mesh(new THREE.ConeGeometry(0.20 * scale, 0.56 * scale, 5), midMat);
  f2.position.set(0.06 * scale, 0.28 * scale, -0.04 * scale);
  f2.rotation.z = -0.14;
  const f3 = new THREE.Mesh(new THREE.ConeGeometry(0.14 * scale, 0.42 * scale, 5), coreMat);
  f3.position.set(-0.04 * scale, 0.23 * scale, 0.04 * scale);
  f3.rotation.z = 0.12;
  flameGrp.add(f1, f2, f3);

  const glowMat = new THREE.MeshBasicMaterial({
    color: 0xff9a3c,
    transparent: true,
    opacity: 0.14,
    depthWrite: false,
    fog: false,
    blending: THREE.AdditiveBlending
  });
  const glowMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.62 * scale, 1), glowMat);
  glowMesh.position.y = 0.28 * scale;
  flameGrp.add(glowMesh);

  flameGrp.visible = false;
  return { flameGrp, f1, f2, f3, glowMesh, glowMat };
}

window.createTempleBrazierProp = function (scale = 1.0) {
  const grp = new THREE.Group();
  grp.userData._isNightFireProp = true;
  const pedestal = createHeroClayMesh(new THREE.CylinderGeometry(0.32, 0.44, 0.78, 6), '#d6cbb5', 0, 0.39, 0, { roughness: 0.90, metalness: 0.04, castShadow: false });
  const ring = createHeroClayMesh(new THREE.CylinderGeometry(0.38, 0.34, 0.12, 8), '#c29b58', 0, 0.80, 0, { roughness: 0.55, metalness: 0.28, castShadow: false });
  const bowl = createHeroClayMesh(new THREE.CylinderGeometry(0.56, 0.32, 0.32, 8), '#6b5344', 0, 0.98, 0, { roughness: 0.68, metalness: 0.25, castShadow: false });
  const coals = createHeroClayMesh(new THREE.DodecahedronGeometry(0.36, 0), '#2b2421', 0, 1.08, 0, { roughness: 0.95, metalness: 0.02, castShadow: false });
  coals.scale.set(1.05, 0.36, 1.05);

  const fc = createNightFlameCluster(1.15);
  fc.flameGrp.position.set(0, 1.08, 0);
  grp.add(pedestal, ring, bowl, coals, fc.flameGrp);
  grp.scale.setScalar(scale);

  return {
    group: grp,
    flameGroup: fc.flameGrp,
    glowMesh: fc.glowMesh,
    setLit(lit, now = 0, phase = 0) {
      fc.flameGrp.visible = Boolean(lit);
      if (lit) {
        const t = now * 0.0085 + phase;
        const wob = 1.0 + Math.sin(t) * 0.12 + Math.cos(t * 1.9) * 0.06;
        fc.f1.scale.set(1.0, wob, 1.0);
        fc.f2.scale.set(1.0, 0.92 + Math.cos(t * 1.5) * 0.15, 1.0);
        fc.f3.scale.set(1.0, 0.95 + Math.sin(t * 2.1) * 0.18, 1.0);
        fc.flameGrp.rotation.y = (now * 0.0012 + phase) % (Math.PI * 2);
        fc.glowMat.opacity = 0.22 + Math.sin(t * 1.4) * 0.05;
      }
    }
  };
};

window.createVillageCampfireProp = function (scale = 1.0) {
  const grp = new THREE.Group();
  grp.userData._isNightFireProp = true;
  const stoneCols = ['#94a3b8', '#78716c', '#a8a29e'];
  for (let i = 0; i < 7; i++) {
    const ang = (i / 7) * Math.PI * 2;
    const st = createHeroClayMesh(
      new THREE.DodecahedronGeometry(0.16, 0),
      stoneCols[i % stoneCols.length],
      Math.cos(ang) * 0.50,
      0.10,
      Math.sin(ang) * 0.50,
      { roughness: 0.92, metalness: 0.02, castShadow: false }
    );
    st.scale.set(1.15, 0.72, 0.95);
    st.rotation.y = ang;
    grp.add(st);
  }
  for (let i = 0; i < 4; i++) {
    const ang = (i / 4) * Math.PI * 2 + 0.35;
    const log = createHeroClayMesh(
      new THREE.CylinderGeometry(0.075, 0.088, 0.88, 6),
      '#6b4423',
      Math.cos(ang) * 0.16,
      0.20,
      Math.sin(ang) * 0.16,
      { roughness: 0.88, metalness: 0.02, castShadow: false }
    );
    log.rotation.z = Math.cos(ang) * 1.15;
    log.rotation.x = Math.sin(ang) * 1.15;
    grp.add(log);
  }
  const embers = createHeroClayMesh(new THREE.DodecahedronGeometry(0.32, 0), '#7c2d12', 0, 0.10, 0, { roughness: 0.90, castShadow: false });
  embers.scale.set(1.1, 0.35, 1.1);
  grp.add(embers);

  const fc = createNightFlameCluster(1.0);
  fc.flameGrp.position.set(0, 0.18, 0);
  grp.add(fc.flameGrp);
  grp.scale.setScalar(scale);

  return {
    group: grp,
    flameGroup: fc.flameGrp,
    glowMesh: fc.glowMesh,
    setLit(lit, now = 0, phase = 0) {
      fc.flameGrp.visible = Boolean(lit);
      if (lit) {
        const t = now * 0.009 + phase;
        fc.f1.scale.set(1.0, 1.0 + Math.sin(t) * 0.14, 1.0);
        fc.f2.scale.set(1.0, 0.94 + Math.cos(t * 1.7) * 0.16, 1.0);
        fc.flameGrp.rotation.y = (now * 0.0014 + phase) % (Math.PI * 2);
        fc.glowMat.opacity = 0.24 + Math.sin(t * 1.6) * 0.05;
      }
    }
  };
};

window.createAncientOilLampProp = function (scale = 1.0) {
  const grp = new THREE.Group();
  const body = createHeroClayMesh(new THREE.CylinderGeometry(0.11, 0.09, 0.085, 7), '#b45309', 0, 0, 0, { roughness: 0.82, metalness: 0.08, castShadow: false });
  const rim = createHeroClayMesh(new THREE.CylinderGeometry(0.08, 0.08, 0.025, 7), '#92400e', 0, 0.045, 0, { roughness: 0.84, metalness: 0.08, castShadow: false });
  const spout = createHeroClayMesh(new THREE.ConeGeometry(0.042, 0.14, 5), '#b45309', 0, 0.02, 0.12, { roughness: 0.82, castShadow: false });
  spout.rotation.x = Math.PI * 0.48;
  const handle = createHeroClayMesh(new THREE.TorusGeometry(0.042, 0.015, 4, 7), '#92400e', 0, 0.03, -0.10, { roughness: 0.84, castShadow: false });

  const flameMat = new THREE.MeshBasicMaterial({ color: 0xfef08a, fog: false });
  const flameMesh = new THREE.Mesh(new THREE.ConeGeometry(0.038, 0.13, 5), flameMat);
  flameMesh.position.set(0, 0.105, 0.155);

  const glowMat = new THREE.MeshBasicMaterial({
    color: 0xffb347,
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
    fog: false,
    blending: THREE.AdditiveBlending
  });
  const glowMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 0), glowMat);
  glowMesh.position.set(0, 0.10, 0.15);

  flameMesh.visible = false;
  glowMesh.visible = false;
  grp.add(body, rim, spout, handle, flameMesh, glowMesh);
  grp.scale.setScalar(scale);

  return {
    group: grp,
    flameMesh,
    glowMesh,
    setLit(lit, now = 0, phase = 0) {
      const on = Boolean(lit);
      flameMesh.visible = on;
      glowMesh.visible = on;
      if (on) {
        const s = 0.88 + Math.sin(now * 0.014 + phase) * 0.18;
        flameMesh.scale.set(1.0, s, 1.0);
        glowMat.opacity = 0.28 + Math.sin(now * 0.011 + phase) * 0.08;
      }
    }
  };
};

window.createBurningTorchProp = function (scale = 1.0) {
  const grp = new THREE.Group();
  const shaft = createHeroClayMesh(new THREE.CylinderGeometry(0.032, 0.026, 0.72, 6), '#6b4423', 0, 0.24, 0, { roughness: 0.86, castShadow: false });
  const band = createHeroClayMesh(new THREE.CylinderGeometry(0.044, 0.040, 0.07, 6), '#475569', 0, 0.56, 0, { roughness: 0.55, metalness: 0.35, castShadow: false });
  const head = createHeroClayMesh(new THREE.DodecahedronGeometry(0.075, 0), '#78350f', 0, 0.63, 0, { roughness: 0.90, castShadow: false });
  head.scale.set(1.0, 1.25, 1.0);

  const fc = createNightFlameCluster(0.36);
  fc.flameGrp.position.set(0, 0.68, 0);
  grp.add(shaft, band, head, fc.flameGrp);
  grp.scale.setScalar(scale);

  return {
    group: grp,
    flameGroup: fc.flameGrp,
    glowMesh: fc.glowMesh,
    setLit(lit, now = 0, phase = 0) {
      fc.flameGrp.visible = Boolean(lit);
      if (lit) {
        const t = now * 0.012 + phase;
        fc.f1.scale.set(1.0, 0.94 + Math.sin(t) * 0.20, 1.0);
        fc.f2.scale.set(1.0, 0.92 + Math.cos(t * 1.8) * 0.18, 1.0);
        fc.glowMat.opacity = 0.26 + Math.sin(t * 1.5) * 0.06;
      }
    }
  };
};

window.createBibleScrollProp = function (scale = 1.0) {
  const grp = new THREE.Group();
  const rollMat = new THREE.MeshStandardMaterial({
    color: 0xfef3c7,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.28,
    flatShading: true,
    roughness: 0.78
  });
  const parchment = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.74, 8), rollMat);
  parchment.rotation.z = Math.PI * 0.5;
  parchment.castShadow = true;

  const ribbon = createHeroClayMesh(new THREE.CylinderGeometry(0.152, 0.152, 0.11, 8), '#b91c1c', 0, 0, 0, { roughness: 0.72 });
  ribbon.rotation.z = Math.PI * 0.5;

  [-0.41, 0.41].forEach(rx => {
    const rod = createHeroClayMesh(new THREE.CylinderGeometry(0.036, 0.036, 0.16, 6), '#78350f', rx, 0, 0, { roughness: 0.80 });
    rod.rotation.z = Math.PI * 0.5;
    const knob = createHeroClayMesh(new THREE.DodecahedronGeometry(0.056, 0), '#d4a843', rx + Math.sign(rx) * 0.07, 0, 0, { roughness: 0.45, metalness: 0.28 });
    grp.add(rod, knob);
  });

  const aura = new THREE.Mesh(
    new THREE.RingGeometry(0.45, 0.58, 14),
    new THREE.MeshBasicMaterial({ color: 0xfde047, side: THREE.DoubleSide, transparent: true, opacity: 0.75, depthWrite: false, fog: false })
  );
  aura.rotation.x = -Math.PI * 0.5;
  aura.position.y = -0.32;

  grp.add(parchment, ribbon, aura);
  grp.scale.setScalar(scale);
  return grp;
};

// =========================================================================
// [1세기 이스라엘 고유 식생 로우 폴리곤 에셋 6종] (외곽 산맥·기슭 자연화 식재용)
//   - 올리브나무 · 무화과나무 · 대추야자 · 우슬초 · 아네모네 · 가시덤불 케이퍼 & 거친 풀
// =========================================================================
(function registerIsraelFirstCenturyFloraAssets() {
  function seededRand(seed) {
    const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  function makeWoodenForkedTrunk(grp, trunkPts, radii, barkMain, barkAlt, seed, branches) {
    if (typeof window.createOrganicWoodTrunkGeo === 'function') {
      const geo = window.createOrganicWoodTrunkGeo(trunkPts, radii, 6, seed, true);
      grp.add(createLowPolyMesh(geo, barkMain, 0, 0, 0, true));
    } else {
      for (let i = 0; i < trunkPts.length - 1; i++) {
        const a = trunkPts[i], b = trunkPts[i + 1];
        grp.add(createBranchSegmentMesh(
          new THREE.Vector3(a[0], a[1], a[2]),
          new THREE.Vector3(b[0], b[1], b[2]),
          radii[i], radii[i + 1], i % 2 === 0 ? barkMain : barkAlt, seed + i * 7, i === 0
        ));
      }
    }
    branches.forEach((br, idx) => {
      const seg = createBranchSegmentMesh(
        new THREE.Vector3(br.from[0], br.from[1], br.from[2]),
        new THREE.Vector3(br.to[0], br.to[1], br.to[2]),
        br.r0, br.r1, idx % 2 === 0 ? barkMain : barkAlt, seed + 31 + idx * 11, false
      );
      grp.add(seg);
    });
  }

  // 1) 1세기 이스라엘 올리브나무 (Olea europaea) — 뒤틀린 줄기 + 은빛 세이지 수관 + 작은 올리브 열매
  window.createIsraelOliveTreeGroup = function (scale = 1.0, seed = 101) {
    const grp = new THREE.Group();
    const leanX = (seededRand(seed + 1) - 0.5) * 0.22;
    const forkPt = [leanX * 0.6, 1.38, 0.04];
    makeWoodenForkedTrunk(
      grp,
      [[0, -0.08, 0], [leanX * 0.35, 0.65, -0.04], forkPt],
      [0.34, 0.24, 0.20],
      '#6d4728', '#7d5432', seed,
      [
        { from: forkPt, to: [-0.88, 2.28,  0.34], r0: 0.16, r1: 0.09 },
        { from: forkPt, to: [ 0.92, 2.34, -0.24], r0: 0.15, r1: 0.085 },
        { from: forkPt, to: [-0.14, 2.66, -0.78], r0: 0.14, r1: 0.08 },
        { from: forkPt, to: [ 0.18, 2.60,  0.80], r0: 0.14, r1: 0.08 }
      ]
    );

    const sageCols = ['#8c9e78', '#9bae85', '#778b65', '#a8b895', '#82966e'];
    const pods = [
      [0.02, 2.98, 0.02, 1.06, 0.80, 1.02],
      [-0.98, 2.48, 0.38, 0.86, 0.72, 0.84],
      [ 1.02, 2.52,-0.28, 0.84, 0.72, 0.82],
      [-0.22, 2.74,-0.88, 0.76, 0.68, 0.76],
      [ 0.24, 2.68, 0.88, 0.78, 0.68, 0.78]
    ];
    pods.forEach(([px, py, pz, rx, ry, rz], i) => {
      const m = createLowPolyMesh(new THREE.IcosahedronGeometry(0.95, 0), sageCols[(seed + i) % sageCols.length], px, py, pz, true);
      m.scale.set(rx, ry, rz);
      m.rotation.set(seededRand(seed + i * 3) * 0.4, i * 1.1, seededRand(seed + i * 5) * 0.3);
      grp.add(m);

      for (let t = 0; t < 2; t++) {
        const ang = (i * 1.7 + t * 2.5 + seed * 0.4);
        const olive = createLowPolyMesh(new THREE.DodecahedronGeometry(0.085, 0), (t % 2 === 0 ? '#2b381f' : '#404e2a'), px + Math.cos(ang) * 0.56 * rx, py - 0.32 * ry, pz + Math.sin(ang) * 0.56 * rz, false);
        olive.scale.set(0.85, 1.25, 0.85);
        grp.add(olive);
      }
    });
    grp.scale.setScalar(scale);
    return grp;
  };

  // 2) 무화과나무 (Ficus carica) — 넓게 퍼진 가지 + 풍성한 초록 잎 + 보라빛 무화과 열매
  window.createIsraelFigTreeGroup = function (scale = 1.0, seed = 202) {
    const grp = new THREE.Group();
    const forkPt = [(seededRand(seed) - 0.5) * 0.16, 1.28, 0];
    makeWoodenForkedTrunk(
      grp,
      [[0, -0.08, 0], [forkPt[0] * 0.5, 0.62, 0.04], forkPt],
      [0.36, 0.25, 0.20],
      '#6f4929', '#815734', seed,
      [
        { from: forkPt, to: [-1.18, 2.26,  0.46], r0: 0.17, r1: 0.09 },
        { from: forkPt, to: [ 1.16, 2.30,  0.22], r0: 0.17, r1: 0.09 },
        { from: forkPt, to: [ 0.12, 2.48, -1.12], r0: 0.15, r1: 0.085 },
        { from: forkPt, to: [-0.28, 2.75,  0.15], r0: 0.15, r1: 0.08 }
      ]
    );

    const figLeafCols = ['#5f8a3e', '#719e49', '#4f7832', '#6a9644'];
    const padSpots = [
      [ 0.00, 3.05,  0.00, 1.55, 0.82],
      [-1.25, 2.48,  0.52, 1.18, 0.68],
      [ 1.24, 2.52,  0.28, 1.15, 0.68],
      [ 0.18, 2.66, -1.15, 1.12, 0.66],
      [-0.65, 2.78, -0.62, 1.05, 0.64],
      [ 0.72, 2.76,  0.78, 1.05, 0.64]
    ];
    padSpots.forEach(([px, py, pz, pr, ph], i) => {
      const geo = (typeof createFlattenedFoliagePadGeo === 'function')
        ? createFlattenedFoliagePadGeo(pr, ph, 1)
        : new THREE.IcosahedronGeometry(pr, 0);
      const pad = createLowPolyMesh(geo, figLeafCols[(seed + i) % figLeafCols.length], px, py, pz, true);
      if (typeof createFlattenedFoliagePadGeo !== 'function') pad.scale.set(1.0, 0.56, 1.0);
      pad.rotation.y = (seed + i) * 0.9;
      grp.add(pad);

      if (i > 0) {
        const fig = createLowPolyMesh(new THREE.DodecahedronGeometry(0.11, 0), (i % 2 === 0 ? '#4c1d6e' : '#6b21a8'), px * 0.88, py - 0.36, pz * 0.88, false);
        fig.scale.set(0.85, 1.35, 0.85);
        grp.add(fig);
      }
    });
    grp.scale.setScalar(scale);
    return grp;
  };

  // 3) 대추야자 (Phoenix dactylifera) — 각진 마디 줄기 + 황금 대추열매 송이 + 방사형 야자 잎
  window.createIsraelDatePalmGroup = function (scale = 1.0, seed = 303) {
    const grp = new THREE.Group();
    const leanX = (seededRand(seed) - 0.5) * 0.36;
    const leanZ = (seededRand(seed + 2) - 0.5) * 0.28;
    const segs = 7;
    const hTotal = 4.35;
    let topX = 0, topY = 0, topZ = 0;

    for (let s = 0; s < segs; s++) {
      const t = (s + 0.5) / segs;
      const sx = leanX * Math.pow(t, 1.35);
      const sz = leanZ * Math.pow(t, 1.35);
      const sy = t * hTotal;
      const rB = 0.29 - t * 0.11;
      const seg = createLowPolyMesh(
        new THREE.CylinderGeometry(rB * 1.08, rB * 0.82, (hTotal / segs) * 1.12, 6),
        s % 2 === 0 ? '#7a5432' : '#8e6642',
        sx, sy, sz, true
      );
      grp.add(seg);
      topX = sx; topY = sy + 0.32; topZ = sz;
    }

    // 황금/호박색 대추 열매 송이
    for (let d = 0; d < 4; d++) {
      const ang = (d / 4) * Math.PI * 2 + seed * 0.3;
      const dateCl = createLowPolyMesh(new THREE.DodecahedronGeometry(0.20, 0), (d % 2 === 0 ? '#d97706' : '#e58f24'), topX + Math.cos(ang) * 0.32, topY - 0.22, topZ + Math.sin(ang) * 0.32, false);
      dateCl.scale.set(0.78, 1.45, 0.78);
      grp.add(dateCl);
    }

    // 방사형 아치 야자 잎
    const frondCols = ['#5f8c35', '#73a144', '#4a7328'];
    for (let f = 0; f < 8; f++) {
      const yaw = (f / 8) * Math.PI * 2 + seededRand(seed + f) * 0.25;
      const frondPivot = new THREE.Group();
      frondPivot.position.set(topX, topY + 0.06, topZ);
      frondPivot.rotation.y = yaw;

      const inner = createLowPolyMesh(new THREE.ConeGeometry(0.26, 1.35, 4), frondCols[f % frondCols.length], 0, 0.26, 0.58, true);
      inner.rotation.x = 1.05;
      inner.scale.set(1.25, 1.0, 0.32);

      const outer = createLowPolyMesh(new THREE.ConeGeometry(0.22, 1.40, 4), frondCols[(f + 1) % frondCols.length], 0, 0.08, 1.62, true);
      outer.rotation.x = 1.82;
      outer.scale.set(1.18, 1.0, 0.28);

      frondPivot.add(inner, outer);
      grp.add(frondPivot);
    }
    grp.scale.setScalar(scale);
    return grp;
  };

  // 4) 우슬초 (Origanum syriacum) — 둥근 허브 덤불 + 보라빛 작은 꽃대
  window.createIsraelHyssopShrubGroup = function (scale = 1.0, seed = 404) {
    const grp = new THREE.Group();
    const herbCols = ['#63854c', '#74985a', '#537340'];
    const tufts = [
      [ 0.00, 0.34,  0.00, 0.44],
      [-0.30, 0.26,  0.18, 0.34],
      [ 0.32, 0.27, -0.14, 0.34],
      [-0.12, 0.25, -0.28, 0.32],
      [ 0.16, 0.26,  0.28, 0.32]
    ];
    tufts.forEach(([x, y, z, r], i) => {
      const leaf = createLowPolyMesh(new THREE.IcosahedronGeometry(r, 0), herbCols[(seed + i) % herbCols.length], x, y, z, true);
      leaf.scale.set(1.12, 0.85, 1.12);
      grp.add(leaf);
    });
    for (let s = 0; s < 5; s++) {
      const ang = (s / 5) * Math.PI * 2 + seed * 0.5;
      const rDist = (s === 0 ? 0.05 : 0.26);
      const sx = Math.cos(ang) * rDist;
      const sz = Math.sin(ang) * rDist;
      const spike = createLowPolyMesh(new THREE.DodecahedronGeometry(0.11, 0), (s % 2 === 0 ? '#a78bfa' : '#c4b5fd'), sx, 0.62 + (s % 2) * 0.10, sz, false);
      spike.scale.set(0.85, 1.38, 0.85);
      grp.add(spike);
    }
    grp.scale.setScalar(scale);
    return grp;
  };

  // 5) 붉은 아네모네 군락 (Anemone coronaria) — 햇살 아래 붉은 꽃송이 + 검은 심지
  window.createIsraelAnemoneClusterGroup = function (scale = 1.0, seed = 505) {
    const grp = new THREE.Group();
    const petalCols = ['#dc2626', '#ef4444', '#b91c1c'];
    const baseLeaf = createLowPolyMesh(new THREE.IcosahedronGeometry(0.32, 0), '#4d7c0f', 0, 0.14, 0, false);
    baseLeaf.scale.set(1.35, 0.45, 1.25);
    grp.add(baseLeaf);

    for (let i = 0; i < 4; i++) {
      const ang = (i / 4) * Math.PI * 2 + seed * 0.7;
      const fx = Math.cos(ang) * (0.14 + (i % 2) * 0.16);
      const fz = Math.sin(ang) * (0.14 + (i % 2) * 0.16);
      const fh = 0.48 + (i % 2) * 0.16;
      const stem = createLowPolyMesh(new THREE.CylinderGeometry(0.025, 0.032, fh, 4), '#3f6212', fx, fh * 0.5, fz, false);
      const cup = createLowPolyMesh(new THREE.CylinderGeometry(0.19, 0.07, 0.14, 6), petalCols[(seed + i) % petalCols.length], fx, fh + 0.04, fz, false);
      const center = createLowPolyMesh(new THREE.DodecahedronGeometry(0.06, 0), '#1e1b18', fx, fh + 0.08, fz, false);
      grp.add(stem, cup, center);
    }
    grp.scale.setScalar(scale);
    return grp;
  };

  // 6) 바위 틈 케이퍼 관목 & 거친 풀 (Capparis spinosa & Mediterranean Scrub)
  window.createIsraelCaperAndGrassGroup = function (scale = 1.0, seed = 606) {
    const grp = new THREE.Group();
    const stone = createLowPolyMesh(new THREE.DodecahedronGeometry(0.46, 0), '#a89f91', 0, 0.20, 0, true);
    stone.scale.set(1.35, 0.58, 1.12);
    stone.rotation.y = seed * 0.5;
    grp.add(stone);

    const shrubCols = ['#5d8739', '#719b48', '#88a64d'];
    [[-0.34, 0.24, 0.16], [0.36, 0.22, -0.14], [0.06, 0.28, 0.34], [-0.14, 0.24, -0.32]].forEach(([bx, by, bz], idx) => {
      const bush = createLowPolyMesh(new THREE.IcosahedronGeometry(0.28, 0), shrubCols[(seed + idx) % shrubCols.length], bx, by, bz, false);
      bush.scale.set(1.25, 0.62, 1.18);
      grp.add(bush);
      if (idx < 3) {
        const bloom = createLowPolyMesh(new THREE.DodecahedronGeometry(0.085, 0), '#f5e4f7', bx * 1.08, by + 0.14, bz * 1.08, false);
        grp.add(bloom);
      }
    });

    // 거친 풀잎 칼날
    const grassCols = ['#7d9645', '#9ba856', '#b89f5d'];
    for (let g = 0; g < 6; g++) {
      const ang = (g / 6) * Math.PI * 2 + seed * 0.3;
      const blade = createLowPolyMesh(new THREE.ConeGeometry(0.075, 0.55 + (g % 2) * 0.18, 3), grassCols[g % grassCols.length], Math.cos(ang) * 0.52, 0.22, Math.sin(ang) * 0.52, false);
      blade.rotation.z = -Math.cos(ang) * 0.38;
      blade.rotation.x = Math.sin(ang) * 0.38;
      grp.add(blade);
    }
    grp.scale.setScalar(scale);
    return grp;
  };
})();