// =========================================================================
// [ep4_miracle_world.js - 파트 1/3] 에피소드 4 : 확장된 소프트 로우 폴리곤 오픈월드 지형·외곽 언덕·길가 마을·생태계
// - 가장자리 언덕 내부 진입 완벽 차단 (연속 충돌벽 Colliders + 경계 제한)
// - 계단으로 건물 2층 등반 후 인접한 옆 건물 옥상·2층으로 점프 이동할 수 있는 근접 마을 배치
// =========================================================================
window.__GAME_BUILD_VERSIONS__ = window.__GAME_BUILD_VERSIONS__ || {};
window.__GAME_BUILD_VERSIONS__.ep4_world = '20261126_v50';

window.miracleOpenWorldIntroFlyover = {
  active: false,
  timer: 0,
  duration: 5.4,
  doneCallback: null
};

window.startMiracleOpenWorldTopViewFlyover = function (onFinish) {
  const watchedCount = window.getEp4OpeningVideoWatchCount();
  if (typeof setInGameHudControlsVisible === 'function') setInGameHudControlsVisible(false);
  
  window.miracleOpenWorldIntroFlyover = {
    active: true,
    timer: 0,
    duration: 8.5, // 270도 회전에 맞춰 시간 연장
    doneCallback: (typeof onFinish === 'function') ? onFinish : null
  };
  
  // 2회차 이상(영상 시청 기록 있음)일 때만 건너뛰기 버튼 노출!
  if (watchedCount >= 1) {
    const skipWrap = document.getElementById('ep4-flyover-skip-wrap');
    if (skipWrap) skipWrap.classList.remove('hidden');
  }
  
  if (typeof applyCoreCameraByMode === 'function') applyCoreCameraByMode();
};

window.skipMiracleOpenWorldFlyover = function () {
  if (window.miracleOpenWorldIntroFlyover && window.miracleOpenWorldIntroFlyover.active) {
    // 시간을 끝까지 강제로 당겨 부드럽게 즉시 착륙하도록 처리
    window.miracleOpenWorldIntroFlyover.timer = window.miracleOpenWorldIntroFlyover.duration; 
    const skipWrap = document.getElementById('ep4-flyover-skip-wrap');
    if (skipWrap) skipWrap.classList.add('hidden');
  }
};

let miracleWorldMissionObjects = [];
let miracleActiveFieldEvent = null;
let miracleWanderingActors = []; // 자연스럽게 걸어 다니는 마을 주민 & 초원 동물(사슴·양) 배열
let miracleGolgothaCrossesGroup = null; // 스테이지 3(예수님 십자가 사건)부터 등장하는 골고다 세 십자가 그룹
let miracleOpenWorldTombGroup = null; // 스테이지 3 클리어 후 모습을 드러내는 동산 돌 무덤 그룹
let miracleTombCoverGroup = null; // 스테이지 3 클리어 전까지 돌 무덤을 가려주는 풀·덤불 위장막
window.miracleSkyBirds = []; // 하늘을 날아다니는 소프트 로우 폴리곤 새 배열
window.miracleGrowingFields = []; // 씨 뿌리기 미션 완료 후 시간이 지남에 따라 실시간으로 자라나는 곡식 밭 배열
window.miracleSowerHistory = window.miracleSowerHistory || []; // 모든 단계 완료 시에만 저장되는 파종 이력
window.miracleMustardShrubs = []; // 겨자씨 미션 완료 후 시간이 지남에 따라 굵은 줄기·넓은 잎·노란 꽃 관목으로 자라나는 식물 배열
window.miracleMustardHistory = window.miracleMustardHistory || []; // 모든 단계 완료 시에만 저장되는 겨자씨 파종 이력
window.miracleBurntCampfires = window.miracleBurntCampfires || []; // 아침식사 미션 완료 후 영구 유지되는 불꺼진 모닥불(숯나무) 좌표
window.miracleBurntCampfireMeshes = [];
window.miracleReturningNpcs = []; // 미션 완료 후 제자리로 직접 걸어 돌아가는 NPC 목록(수가성 여인·엠마오 제자)
window.miracleHarvestNodes = []; // 멀티플레이 미션 1(반석위의 집 확장형) 채집용 나무·외곽 바위 목록
window.MIRACLE_GRAND_BEDROCK_POS = { x: 63, z: 18 };

function registerMiracleHarvestNode(kind, x, z, mesh, scale = 1.0) {
  if (!mesh) return null;
  if (!Array.isArray(window.miracleHarvestNodes)) window.miracleHarvestNodes = [];
  const id = `${kind}_${window.miracleHarvestNodes.length}_${Math.round(x)}_${Math.round(z)}`;
  const by = getMiracleOpenWorldGroundHeight(x, z);
  const node = {
    id,
    kind, // 'wood' | 'stone'
    x,
    y: by,
    z,
    mesh,
    baseScaleX: mesh.scale ? mesh.scale.x : 1,
    baseScaleY: mesh.scale ? mesh.scale.y : 1,
    baseScaleZ: mesh.scale ? mesh.scale.z : 1,
    hp: 5,
    maxHp: 5,
    depleted: false,
    respawnTimer: 0
  };
  window.miracleHarvestNodes.push(node);
  return node;
}
window.registerMiracleHarvestNode = registerMiracleHarvestNode;

// 씨 뿌리기 곡식 완전 성장 소요 시간 (초) — 타임스탬프 기반이라 300초(5분)든 3600초(1시간)든 추가 자원 소모 거의 없음!
const MIRACLE_SOWER_GROW_DURATION_SEC = 300;
window.MIRACLE_SOWER_GROW_DURATION_SEC = MIRACLE_SOWER_GROW_DURATION_SEC;
const MIRACLE_SOWER_STORAGE_KEY = 'ep4_sower_planted_v1';
const MIRACLE_CAMPFIRE_STORAGE_KEY = 'ep4_burnt_campfires_v1';

// 산기슭 씨 뿌리기 밭 후보 3곳 (이 반경 안에는 나무·바위 배치를 금지하여 겹침 원천 차단!)
const MIRACLE_SOWER_FARM_CANDIDATES = [
  { x: -42, z: -90, areaName: '북쪽 산기슭' },
  { x:  42, z: -90, areaName: '북동쪽 산기슭' },
  { x:  86, z: -26, areaName: '동쪽 산기슭' }
];
window.MIRACLE_SOWER_FARM_CANDIDATES = MIRACLE_SOWER_FARM_CANDIDATES;

function isNearSowerFarmPlot(x, z, pad = 9.0) {
  for (let i = 0; i < MIRACLE_SOWER_FARM_CANDIDATES.length; i++) {
    const p = MIRACLE_SOWER_FARM_CANDIDATES[i];
    if (Math.hypot(x - p.x, z - p.z) < pad) return true;
  }
  return false;
}
window.isNearSowerFarmPlot = isNearSowerFarmPlot;

function loadMiracleSowerHistoryFromStorage() {
  try {
    const raw = localStorage.getItem(MIRACLE_SOWER_STORAGE_KEY);
    if (!raw) return;
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) {
      window.miracleSowerHistory = arr.filter(it => it && it.allStepsCompleted === true && typeof it.x === 'number' && typeof it.z === 'number');
    }
  } catch (e) {}
}

function saveMiracleSowerHistoryToStorage() {
  try {
    const valid = (window.miracleSowerHistory || []).filter(it => it && it.allStepsCompleted === true);
    if (valid.length === 0) localStorage.removeItem(MIRACLE_SOWER_STORAGE_KEY);
    else localStorage.setItem(MIRACLE_SOWER_STORAGE_KEY, JSON.stringify(valid));
  } catch (e) {}
}

function clearAllMiracleGrowingFields() {
  if (Array.isArray(window.miracleGrowingFields)) {
    window.miracleGrowingFields.forEach(f => {
      if (f && f.group && typeof worldGroup !== 'undefined' && worldGroup) {
        worldGroup.remove(f.group);
      }
    });
  }
  window.miracleGrowingFields = [];
  window.miracleSowerHistory = [];
  saveMiracleSowerHistoryToStorage();
}
window.clearAllMiracleGrowingFields = clearAllMiracleGrowingFields;

// 겨자씨 관목 완전 성장 소요 시간 (초) — 타임스탬프 기반 300초(5분) 실시간 성장
const MIRACLE_MUSTARD_GROW_DURATION_SEC = 300;
window.MIRACLE_MUSTARD_GROW_DURATION_SEC = MIRACLE_MUSTARD_GROW_DURATION_SEC;
const MIRACLE_MUSTARD_STORAGE_KEY = 'ep4_mustard_planted_v1';
const MIRACLE_MUSTARD_PLOT_POS = { x: 46, z: -20 };
window.MIRACLE_MUSTARD_PLOT_POS = MIRACLE_MUSTARD_PLOT_POS;

function isNearMustardPlot(x, z, pad = 6.0) {
  return Math.hypot(x - MIRACLE_MUSTARD_PLOT_POS.x, z - MIRACLE_MUSTARD_PLOT_POS.z) < pad;
}
window.isNearMustardPlot = isNearMustardPlot;

function loadMiracleMustardHistoryFromStorage() {
  try {
    const raw = localStorage.getItem(MIRACLE_MUSTARD_STORAGE_KEY);
    if (!raw) return;
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) {
      window.miracleMustardHistory = arr.filter(it => it && it.allStepsCompleted === true && typeof it.x === 'number' && typeof it.z === 'number');
    }
  } catch (e) {}
}

function saveMiracleMustardHistoryToStorage() {
  try {
    const valid = (window.miracleMustardHistory || []).filter(it => it && it.allStepsCompleted === true);
    if (valid.length === 0) localStorage.removeItem(MIRACLE_MUSTARD_STORAGE_KEY);
    else localStorage.setItem(MIRACLE_MUSTARD_STORAGE_KEY, JSON.stringify(valid));
  } catch (e) {}
}

function clearAllMiracleMustardShrubs() {
  if (Array.isArray(window.miracleMustardShrubs)) {
    window.miracleMustardShrubs.forEach(s => {
      if (s && s.group && typeof worldGroup !== 'undefined' && worldGroup) {
        worldGroup.remove(s.group);
      }
    });
  }
  window.miracleMustardShrubs = [];
  window.miracleMustardHistory = [];
  window.miracleMustardTreeGrown = false;
  saveMiracleMustardHistoryToStorage();
}
window.clearAllMiracleMustardShrubs = clearAllMiracleMustardShrubs;

function loadMiracleBurntCampfiresFromStorage() {
  try {
    const raw = localStorage.getItem(MIRACLE_CAMPFIRE_STORAGE_KEY);
    if (!raw) return;
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) {
      window.miracleBurntCampfires = arr.filter(it => it && typeof it.x === 'number' && typeof it.z === 'number');
    }
  } catch (e) {}
}

function saveMiracleBurntCampfiresToStorage() {
  try {
    localStorage.setItem(MIRACLE_CAMPFIRE_STORAGE_KEY, JSON.stringify(window.miracleBurntCampfires || []));
  } catch (e) {}
}

// 머리 위 태그(.world-label) 근접 표시 거리 상수 (가까이 다가갔을 때만 표시)
const MIRACLE_TAG_DIST_SPOT = 13.0;
const MIRACLE_TAG_DIST_NPC  = 11.0;
const MIRACLE_TAG_DIST_ITEM = 11.5;

function getMiracleMainRoadCenterX(z) {
  return Math.sin(z * 0.03) * 6.0;
}

// -------------------------------------------------------------------------
// 1. 비정형 소프트 로우 폴리곤 길가 소품 팩토리 (디테일 나무 짐수레 · 시장 항아리·곡식자루·나무상자)
// -------------------------------------------------------------------------
function createOrganicAmphoraProp(scale = 1.0, hexBody = '#b86232', hexNeck = '#8f471e') {
  const g = new THREE.Group();
  const belly = createLowPolyMesh(new THREE.IcosahedronGeometry(0.30 * scale, 0), hexBody, 0, 0.34 * scale, 0, true);
  belly.scale.set(0.92, 1.32, 0.92);
  const foot = createLowPolyMesh(new THREE.CylinderGeometry(0.14 * scale, 0.17 * scale, 0.14 * scale, 6), hexNeck, 0, 0.07 * scale, 0, false);
  const neck = createLowPolyMesh(new THREE.CylinderGeometry(0.13 * scale, 0.10 * scale, 0.24 * scale, 6), hexNeck, 0, 0.68 * scale, 0, false);
  const rim  = createLowPolyMesh(new THREE.CylinderGeometry(0.18 * scale, 0.14 * scale, 0.08 * scale, 7), hexBody, 0, 0.80 * scale, 0, false);
  const handleGeo = new THREE.CylinderGeometry(0.032 * scale, 0.032 * scale, 0.24 * scale, 4);
  const hL = createLowPolyMesh(handleGeo, hexNeck, -0.17 * scale, 0.62 * scale, 0, false);
  hL.rotation.z = 0.42;
  const hR = createLowPolyMesh(handleGeo, hexNeck,  0.17 * scale, 0.62 * scale, 0, false);
  hR.rotation.z = -0.42;
  g.add(belly, foot, neck, rim, hL, hR);
  return g;
}

function createSpokedWoodenWheel(radius = 0.54, woodHex = '#5c2d0c', rimHex = '#3f2210') {
  const wg = new THREE.Group();
  // 8각 다면체 바퀴 테두리 (속이 비어 바큇살이 또렷하게 보이는 소프트 로우폴리 수레바퀴)
  const segs = 8;
  const segLen = 2 * radius * Math.sin(Math.PI / segs) + 0.04;
  for (let i = 0; i < segs; i++) {
    const ang = (i / segs) * Math.PI * 2;
    const rimSeg = createLowPolyMesh(
      new THREE.BoxGeometry(0.11, 0.10, segLen),
      i % 2 === 0 ? rimHex : woodHex,
      0, Math.cos(ang) * radius, Math.sin(ang) * radius, false
    );
    rimSeg.rotation.x = ang;
    wg.add(rimSeg);
  }
  // 중앙 바퀴축 허브 & 6개 바큇살
  const hub = createLowPolyMesh(new THREE.CylinderGeometry(0.13, 0.14, 0.20, 6), '#451a03', 0, 0, 0, false);
  hub.rotation.z = Math.PI / 2;
  wg.add(hub);
  for (let s = 0; s < 3; s++) {
    const spoke = createLowPolyMesh(new THREE.CylinderGeometry(0.035, 0.035, radius * 1.92, 4), '#78350f', 0, 0, 0, false);
    spoke.rotation.x = (s / 3) * Math.PI;
    wg.add(spoke);
  }
  return wg;
}

function createLowPolyWoodenCart(x, z, rotY = 0) {
  const by = (typeof getBaseGroundHeight === 'function') ? getBaseGroundHeight(x, z) : getMiracleOpenWorldGroundHeight(x, z);
  const seed = Math.abs(Math.round(x * 7 + z * 11)) + 3;
  const grp = new THREE.Group();
  const makeBox = (w, h, d, s) => (typeof createOrganicBoxGeo === 'function')
    ? createOrganicBoxGeo(w, h, d, s, 0.06, 0.96, 2)
    : new THREE.BoxGeometry(w, h, d);

  // 1) 손으로 깎은 듯한 비정형 나무 짐칸 바닥 + 바깥으로 살짝 벌어진 목재 난간 측면 + 가로 보강목
  const bed = createLowPolyMesh(makeBox(1.78, 0.20, 2.55, seed), '#8a4f18', 0, 0.68, 0);
  const axle = createLowPolyMesh(new THREE.CylinderGeometry(0.08, 0.08, 2.18, 6), '#451a03', 0, 0.54, -0.10, false);
  axle.rotation.z = Math.PI / 2;

  const railL = createLowPolyMesh(makeBox(0.13, 0.56, 2.52, seed + 1), '#713f12', -0.84, 1.02, 0);
  railL.rotation.z = 0.10;
  const railR = createLowPolyMesh(makeBox(0.13, 0.56, 2.52, seed + 2), '#713f12',  0.84, 1.02, 0);
  railR.rotation.z = -0.10;
  const railBack = createLowPolyMesh(makeBox(1.66, 0.52, 0.13, seed + 3), '#78350f', 0, 1.00, -1.22);
  railBack.rotation.x = -0.08;
  const railFront = createLowPolyMesh(makeBox(1.62, 0.36, 0.12, seed + 4), '#78350f', 0, 0.92, 1.22);

  // 난간 수직 목재 기둥 4개 (둥근 지붕·활대 없는 개방형 고대 목재 수레)
  [[-0.86, -0.85], [-0.86, 0.85], [0.86, -0.85], [0.86, 0.85]].forEach(([px, pz]) => {
    const post = createLowPolyMesh(new THREE.CylinderGeometry(0.05, 0.06, 0.72, 5), '#5c2d0c', px, 1.05, pz, false);
    grp.add(post);
  });

  // 2) 바큇살이 보이는 소프트 로우폴리 수레바퀴 좌·우
  const wheelL = createSpokedWoodenWheel(0.54);
  wheelL.position.set(-1.02, 0.54, -0.10);
  const wheelR = createSpokedWoodenWheel(0.54);
  wheelR.position.set( 1.02, 0.54, -0.10);

  // 3) 짐칸 안에 실린 곡식 자루, 양손잡이 토기 항아리, 과일/빵 바구니
  const sack1 = createLowPolyMesh(new THREE.IcosahedronGeometry(0.36, 0), '#d6b98c', -0.34, 1.02, -0.42, false);
  sack1.scale.set(1.05, 0.78, 1.35);
  sack1.rotation.y = 0.25;
  const sack2 = createLowPolyMesh(new THREE.IcosahedronGeometry(0.32, 0), '#c8a675',  0.28, 1.00, -0.52, false);
  sack2.scale.set(1.00, 0.80, 1.25);
  sack2.rotation.y = -0.30;
  const cartJar = createOrganicAmphoraProp(0.88, '#c26533', '#8f471e');
  cartJar.position.set(0.34, 0.78, 0.42);
  cartJar.rotation.z = 0.08;
  const basket = createLowPolyMesh(new THREE.CylinderGeometry(0.30, 0.22, 0.30, 7), '#a16207', -0.32, 0.92, 0.48, false);
  const goods  = createLowPolyMesh(new THREE.DodecahedronGeometry(0.24, 0), '#f59e0b', -0.32, 1.10, 0.48, false);
  goods.scale.set(1.1, 0.65, 1.1);

  // 4) 앞쪽 손잡이 끌채 & 지지대 다리
  const shaftL = createLowPolyMesh(new THREE.CylinderGeometry(0.045, 0.065, 1.65, 5), '#5c2d0c', -0.48, 0.64, 1.88, false);
  shaftL.rotation.x = Math.PI / 2 + 0.16;
  const shaftR = createLowPolyMesh(new THREE.CylinderGeometry(0.045, 0.065, 1.65, 5), '#5c2d0c',  0.48, 0.64, 1.88, false);
  shaftR.rotation.x = Math.PI / 2 + 0.16;
  const yokeBar = createLowPolyMesh(new THREE.CylinderGeometry(0.042, 0.042, 1.06, 5), '#6b4226', 0, 0.50, 2.58, false);
  yokeBar.rotation.z = Math.PI / 2;
  const standL = createLowPolyMesh(new THREE.CylinderGeometry(0.04, 0.045, 0.66, 4), '#451a03', -0.52, 0.33, 1.15, false);
  const standR = createLowPolyMesh(new THREE.CylinderGeometry(0.04, 0.045, 0.66, 4), '#451a03',  0.52, 0.33, 1.15, false);

  grp.add(bed, axle, railL, railR, railBack, railFront, wheelL, wheelR, sack1, sack2, cartJar, basket, goods, shaftL, shaftR, yokeBar, standL, standR);
  if (typeof mergeStaticLowPolyGroupToVertexColor === 'function') {
    mergeStaticLowPolyGroupToVertexColor(grp, { registerWall: true, castShadow: true });
  } else {
    wallMeshes.push(bed);
  }
  grp.position.set(x, by, z);
  grp.rotation.y = rotY;
  worldGroup.add(grp);
  colliders.push({ minX: x - 1.25, maxX: x + 1.25, minZ: z - 1.45, maxZ: z + 1.45 });
  return grp;
}

// 건물 앞·골목 어귀를 풍성하게 꾸며주는 비정형 소프트 로우폴리 시장 소품 묶음 (항아리·곡식자루·나무상자·다양한 과일 바구니)
function createOrganicStreetPropCluster(x, z, rotY = 0, seed = 1) {
  const by = (typeof getBaseGroundHeight === 'function') ? getBaseGroundHeight(x, z) : getMiracleOpenWorldGroundHeight(x, z);
  const grp = new THREE.Group();
  const makeBox = (w, h, d, s) => (typeof createOrganicBoxGeo === 'function')
    ? createOrganicBoxGeo(w, h, d, s, 0.07, 0.95, 1)
    : new THREE.BoxGeometry(w, h, d);

  const crate = createLowPolyMesh(makeBox(1.05, 0.62, 0.82, seed), '#9a5b25', -0.45, 0.31, 0, true);
  const crateLid = createLowPolyMesh(makeBox(1.12, 0.10, 0.88, seed + 1), '#78350f', -0.45, 0.64, 0, false);
  const basket = createLowPolyMesh(new THREE.CylinderGeometry(0.32, 0.24, 0.34, 7), '#b45309', -0.45, 0.86, 0.04, false);
  const fruitCols = ['#dc2626', '#eab308', '#84cc16', '#f97316'];
  for (let k = 0; k < 4; k++) {
    const ang = (k / 4) * Math.PI * 2 + seed;
    const fruit = createLowPolyMesh(
      new THREE.DodecahedronGeometry(0.14, 0),
      fruitCols[(seed + k) % fruitCols.length],
      -0.45 + Math.cos(ang) * 0.12,
      1.04 + (k === 0 ? 0.06 : 0),
      0.04 + Math.sin(ang) * 0.12,
      false
    );
    grp.add(fruit);
  }

  const jar1 = createOrganicAmphoraProp(1.05, '#b86232', '#8f471e');
  jar1.position.set(0.45, 0, -0.18);
  const jar2 = createOrganicAmphoraProp(0.76, '#c27442', '#9a4f25');
  jar2.position.set(0.84, 0, 0.22);
  jar2.rotation.z = -0.12;

  const sack = createLowPolyMesh(new THREE.IcosahedronGeometry(0.36, 0), '#d6c19c', 0.12, 0.28, 0.42, true);
  sack.scale.set(1.1, 0.78, 0.95);
  sack.rotation.y = seed * 0.7;

  const basket2 = createLowPolyMesh(new THREE.CylinderGeometry(0.28, 0.21, 0.28, 7), '#c48334', -0.96, 0.14, 0.36, false);
  const spicePile = createLowPolyMesh(new THREE.ConeGeometry(0.24, 0.24, 6), seed % 2 === 0 ? '#eab308' : '#c2410c', -0.96, 0.36, 0.36, false);

  grp.add(crate, crateLid, basket, jar1, jar2, sack, basket2, spicePile);
  grp.position.set(x, by, z);
  grp.rotation.y = rotY;
  worldGroup.add(grp);
  colliders.push({ minX: x - 1.15, maxX: x + 1.15, minZ: z - 0.90, maxZ: z + 0.90 });
  return grp;
}

// 길가 독립 시장 가판대(스트라이프/린넨 천막 + 4종 다채로운 진열 상품 + 목재 기둥)
function createStandaloneMarketStall(x, z, rotY = 0, themeIdx = 0, striped = true, seed = 101) {
  const by = (typeof getBaseGroundHeight === 'function') ? getBaseGroundHeight(x, z) : getMiracleOpenWorldGroundHeight(x, z);
  const grp = new THREE.Group();
  const woodCol = '#6b4226';
  const linenList = (typeof MIRACLE_LINEN_SHADES !== 'undefined') ? MIRACLE_LINEN_SHADES : [{ main: '#e8dbc2', trim: '#d7c6a6' }];
  const linenSpec = linenList[Math.abs(seed) % linenList.length];

  // 뒤쪽 2개 목재 기둥 + 경사진 스트라이프/아마포 천막
  const backPostL = createLowPolyMesh(new THREE.CylinderGeometry(0.085, 0.105, 2.95, 6), woodCol, -1.55, 1.48, -0.78, true);
  const backPostR = createLowPolyMesh(new THREE.CylinderGeometry(0.085, 0.105, 2.95, 6), woodCol,  1.55, 1.48, -0.78, true);
  const backCross = createLowPolyMesh(new THREE.CylinderGeometry(0.055, 0.060, 3.30, 5), woodCol, 0, 2.84, -0.78, false);
  backCross.rotation.z = Math.PI / 2;
  grp.add(backPostL, backPostR, backCross);

  if (typeof createOrganicLinenAwningGroup === 'function') {
    const canopy = createOrganicLinenAwningGroup(3.55, 2.05, linenSpec, woodCol, seed, 0.22, true, 2.48, { striped });
    canopy.position.set(0, 2.74, 0.15);
    grp.add(canopy);
  }
  if (typeof window.createRichMarketDisplayGroup === 'function') {
    const wares = window.createRichMarketDisplayGroup(themeIdx, seed + 17, linenSpec);
    wares.position.set(0, 0, 0.05);
    grp.add(wares);
  }

  if (typeof mergeStaticLowPolyGroupToVertexColor === 'function') {
    mergeStaticLowPolyGroupToVertexColor(grp, { registerWall: true, castShadow: true });
  }
  grp.position.set(x, by, z);
  grp.rotation.y = rotY;
  worldGroup.add(grp);

  const absCos = Math.abs(Math.cos(rotY));
  const absSin = Math.abs(Math.sin(rotY));
  const hw = 1.85 * absCos + 1.05 * absSin;
  const hd = 1.85 * absSin + 1.05 * absCos;
  colliders.push({ minX: x - hw, maxX: x + hw, minZ: z - hd, maxZ: z + hd });
  return grp;
}

// -------------------------------------------------------------------------
// 2. 북·동·남 3면 가장자리 낮은 울퉁불퉁 다면체 언덕 2중 배치 & 내부 진입 차단벽
//    - 닫힌 다면체 언덕을 겹쳐 배치해 틈새를 없애고, 안쪽 경계선을 따라 연속 충돌벽을 세워 언덕 속 진입을 원천 차단!
// -------------------------------------------------------------------------
function buildLowPolyPerimeterMountainRange() {
  if (typeof createBumpyLowPolyHillMesh !== 'function') return;

  // 기존 따뜻한 올리브 톤과 싱그러운 초록색을 자연스럽게 혼합한 외곽 산맥 팔레트
  const hillCols = ['#529336', '#6da344', '#428329', '#7fa650', '#5e9b3c', '#3c7a26'];

  // 1) 북쪽(North) 가장자리 겹침 언덕 (z = -122 ~ -140)
  for (let i = 0; i < 15; i++) {
    const hx = -82 + i * 15.0;
    const hz1 = -122 - (i % 2) * 5;
    const hz2 = -138 - ((i + 1) % 2) * 6;
    createBumpyLowPolyHillMesh(hx, hz1, 19 + (i % 3) * 3, 6.2 + (i % 3) * 1.6, 17, hillCols[i % hillCols.length], i + 1, true);
    createBumpyLowPolyHillMesh(hx + 7, hz2, 24 + (i % 2) * 4, 9.2 + (i % 4) * 2.0, 20, hillCols[(i + 2) % hillCols.length], i + 20, true);
  }

  // 2) 동쪽(East) 가장자리 겹침 언덕 (x = +122 ~ +140)
  for (let i = 0; i < 17; i++) {
    const hz = -120 + i * 15.0;
    const hx1 = 122 + (i % 2) * 5;
    const hx2 = 138 + ((i + 1) % 2) * 6;
    createBumpyLowPolyHillMesh(hx1, hz, 17, 6.4 + (i % 3) * 1.6, 19 + (i % 3) * 3, hillCols[i % hillCols.length], i + 40, true);
    createBumpyLowPolyHillMesh(hx2, hz + 6, 24, 9.6 + (i % 3) * 2.2, 22, hillCols[(i + 1) % hillCols.length], i + 60, true);
  }

  // 3) 남쪽(South) 가장자리 겹침 언덕 (확장된 서남부 골고다 해변까지 자연스럽게 이어지도록 서쪽 확장)
  for (let i = 0; i < 18; i++) {
    const hx = -114 + i * 14.5;
    const hz1 = 122 + (i % 2) * 5;
    const hz2 = 138 + ((i + 1) % 2) * 6;
    createBumpyLowPolyHillMesh(hx, hz1, 19 + (i % 3) * 3, 6.3 + (i % 3) * 1.6, 17, hillCols[(i + 1) % hillCols.length], i + 80, true);
    createBumpyLowPolyHillMesh(hx - 6, hz2, 24 + (i % 2) * 4, 9.5 + (i % 4) * 2.0, 20, hillCols[(i + 3) % hillCols.length], i + 100, true);
  }

  // 4) [언덕 내부 진입 원천 차단] 북·동·남 언덕 기슭 바로 앞(±106.0)에 빈틈없는 연속 충돌벽 등록
  colliders.push(
    { minX: -145, maxX:  160, minZ: -170, maxZ: -106.0 }, // 북쪽 언덕 차단벽
    { minX: -145, maxX:  160, minZ:  106.0, maxZ: 170 },  // 남쪽 언덕 차단벽
    { minX:  106.0, maxX: 170, minZ: -170, maxZ:  170 }   // 동쪽 언덕 차단벽
  );
}

// -------------------------------------------------------------------------
// 3-A. 언덕 중턱 계단식 비정형 자연석 돌담(Retaining Fieldstone Walls) 생성기
//      (전체 1 드로우콜 병합 + 걸어서 통과 불가 / 점프로 뛰어넘기 가능 물리 등록!)
// -------------------------------------------------------------------------
function buildHillsideStoneTerraceWalls() {
  const stoneWallGrp = new THREE.Group();
  const stoneCols = ['#ede0c8', '#e1cda9', '#d4bc94', '#c6aa80', '#f2e7d3', '#baa078'];
  const hash1 = (v) => {
    const s = Math.sin(v * 127.1 + 311.7) * 43758.5453;
    return s - Math.floor(s);
  };

  const addDryStoneWallCurve = (pts, courses = 3, seedBase = 1) => {
    if (typeof window.registerJumpableStoneWallColliders === 'function') {
      window.registerJumpableStoneWallColliders(pts, courses, getMiracleOpenWorldGroundHeight);
    }
    for (let p = 0; p < pts.length - 1; p++) {
      const [x0, z0] = pts[p];
      const [x1, z1] = pts[p + 1];
      const segLen = Math.hypot(x1 - x0, z1 - z0);
      if (segLen < 0.5) continue;
      const yaw = Math.atan2(x1 - x0, z1 - z0);
      const stepCount = Math.max(2, Math.round(segLen / 0.88));

      for (let row = 0; row < courses; row++) {
        const stagger = (row % 2 === 0) ? 0.0 : 0.48;
        for (let k = 0; k < stepCount; k++) {
          const s = seedBase + p * 71 + row * 31 + k * 7;
          const t = (k + 0.5 + stagger * 0.42 + (hash1(s + 9) - 0.5) * 0.10) / stepCount;
          if (t < 0.01 || t > 0.995) continue;
          const sx = x0 + (x1 - x0) * t;
          const sz = z0 + (z1 - z0) * t;
          const gy = getMiracleOpenWorldGroundHeight(sx, sz);
          const isCapstone = (row === courses - 1);
          const bw = (isCapstone ? 0.88 : 0.82) + hash1(s) * 0.24;
          const bh = (isCapstone ? 0.38 : 0.42) + hash1(s + 1) * 0.14;
          const bd = 0.86 + hash1(s + 2) * 0.38;
          const col = stoneCols[Math.floor(hash1(s + 3) * stoneCols.length) % stoneCols.length];
          const geo = (typeof createIrregularFieldstoneGeo === 'function')
            ? createIrregularFieldstoneGeo(bw, bh, bd, s)
            : createOrganicBoxGeo(bw, bh, bd, s, 0.08, 0.94, 1);
          // 경사면에서도 떠 보이지 않도록 0번 줄을 지면 아래 묻고 자연석들이 빈틈없이 맞물려 쌓이도록 배치
          const by = gy - 0.06 + row * 0.35 + (hash1(s + 4) - 0.5) * 0.04;
          const stone = createLowPolyMesh(geo, col, sx, by, sz, true);
          stone.rotation.y = yaw + (hash1(s + 5) - 0.5) * 0.18;
          stone.rotation.z = (hash1(s + 6) - 0.5) * 0.08;
          stone.rotation.x = (hash1(s + 7) - 0.5) * 0.06;
          stoneWallGrp.add(stone);
        }
      }
    }
  };

  // 1) 동북부 벳새다 언덕(x=88, z=-82) 중턱 2단 계단식 돌담 (등반 길 제외)
  addDryStoneWallCurve([[56, -74], [64, -64], [76, -56], [90, -52]], 3, 101);
  addDryStoneWallCurve([[66, -84], [74, -73], [86, -65], [98, -62]], 3, 141);
  addDryStoneWallCurve([[52, -92], [60, -86], [68, -94]], 2, 181);

  // 2) 동남부 감람산 언덕(x=88, z=74) 중턱 2단 계단식 돌담
  addDryStoneWallCurve([[62, 64], [70, 56], [82, 50], [96, 50]], 3, 221);
  addDryStoneWallCurve([[68, 76], [76, 66], [88, 60], [100, 62]], 3, 261);

  // 3) 서남부 골고다 십자가 언덕(x=-62, z=78) 중턱 돌담 (십자가 진입로 개방 유지)
  addDryStoneWallCurve([[-84, 62], [-74, 54], [-60, 50], [-46, 52]], 3, 301);
  addDryStoneWallCurve([[-40, 66], [-34, 76], [-36, 88]], 3, 341);

  // 4) 중서부 비유2 광야 언덕(x=-68, z=12) 중턱 돌담
  addDryStoneWallCurve([[-82, 0], [-70, -4], [-56, -2], [-48, 8]], 3, 381);
  addDryStoneWallCurve([[-52, 22], [-62, 28], [-76, 26]], 2, 421);

  // 5) 마을 언덕길 가장자리 낮은 장식 돌담 (레퍼런스 이미지 스타일 — 여리고 여관 진입로 여유 확보)
  addDryStoneWallCurve([[-24, -66], [-19, -58], [-20, -46]], 2, 461);
  addDryStoneWallCurve([[32, 14], [36, 22], [38, 32]], 2, 501);

  if (typeof mergeStaticLowPolyGroupToVertexColor === 'function') {
    mergeStaticLowPolyGroupToVertexColor(stoneWallGrp, { registerWall: false, castShadow: true });
  }
  worldGroup.add(stoneWallGrp);
}

// -------------------------------------------------------------------------
// 3-B. 예루살렘 성전 주변 광장 & 입구 길 일정 구간 비정형 큰벽돌 바닥 (전체 1 드로우콜 병합)
// -------------------------------------------------------------------------
function buildTempleIrregularStonePavement() {
  const paverGrp = new THREE.Group();
  const paverCols = ['#e7dcc6', '#dacbb0', '#cebd9f', '#efe5d2', '#c4b192', '#dfd2ba'];
  const hash1 = (v) => {
    const s = Math.sin(v * 91.7 + 157.3) * 43758.5453;
    return s - Math.floor(s);
  };

  const placePaver = (px, pz, pw, pd, yaw, seed) => {
    const gy = getMiracleOpenWorldGroundHeight(px, pz);
    const gx1 = getMiracleOpenWorldGroundHeight(px + 0.8, pz);
    const gz1 = getMiracleOpenWorldGroundHeight(px, pz + 0.8);
    const col = paverCols[Math.floor(hash1(seed) * paverCols.length) % paverCols.length];
    const geo = (typeof createOrganicBoxGeo === 'function')
      ? createOrganicBoxGeo(pw, 0.24, pd, seed, 0.07, 0.95, 1)
      : new THREE.BoxGeometry(pw, 0.24, pd);
    const slab = createLowPolyMesh(geo, col, px, gy - 0.065 + (hash1(seed + 1) - 0.5) * 0.025, pz, false);
    slab.rotation.y = yaw + (hash1(seed + 2) - 0.5) * 0.14;
    slab.rotation.z = Math.atan2(gx1 - gy, 0.8) * 0.65;
    slab.rotation.x = -Math.atan2(gz1 - gy, 0.8) * 0.65;
    paverGrp.add(slab);
  };

  let pSeed = 11;
  // 1) 성전 입구 길 일정 구간(z = 22 ~ 45.5): 순례길을 따라 넓게 깔린 비정형 큰벽돌 포장 도로
  let rowIdx = 0;
  for (let pz = 22.0; pz <= 45.5; pz += 1.65) {
    rowIdx++;
    const roadCx = getMiracleMainRoadCenterX(pz);
    const nextCx = getMiracleMainRoadCenterX(pz + 1.65);
    const roadYaw = Math.atan2(nextCx - roadCx, 1.65);
    const halfSpan = (pz > 38.5) ? 5.8 + (pz - 38.5) * 0.65 : 4.8;
    const stagger = (rowIdx % 2 === 0) ? 0.0 : 0.85;
    for (let ox = -halfSpan + stagger; ox <= halfSpan - 0.5; ox += 1.95) {
      const pw = 1.58 + hash1(pSeed) * 0.34;
      const pd = 1.28 + hash1(pSeed + 3) * 0.30;
      placePaver(roadCx + ox, pz + (hash1(pSeed + 5) - 0.5) * 0.18, pw, pd, roadYaw, pSeed);
      pSeed += 7;
    }
  }

  // 2) 예루살렘 성전 외곽뜰 & 성전 본관 주변 광장 전체(x ∈ [-20.5, +20.5], z ∈ [46.5, 85.5])
  let gRow = 0;
  for (let pz = 46.8; pz <= 85.5; pz += 1.78) {
    gRow++;
    const stagger = (gRow % 2 === 0) ? 0.0 : 0.98;
    for (let px = -20.2 + stagger; px <= 20.2; px += 2.10) {
      // 성전 본관 거대 기단 내부(x ∈ [-8.2, 8.2], z ∈ [64.8, 79.4])는 가려지므로 생략해 폴리곤 절약
      if (Math.abs(px) < 8.2 && pz > 64.8 && pz < 79.4) continue;
      // 외곽 성문 좌·우 벽체 내부 생략
      if (Math.abs(px) > 3.2 && Math.abs(px) < 11.2 && pz > 45.2 && pz < 47.2) continue;
      const pw = 1.72 + hash1(pSeed) * 0.34;
      const pd = 1.42 + hash1(pSeed + 2) * 0.30;
      placePaver(px + (hash1(pSeed + 4) - 0.5) * 0.18, pz + (hash1(pSeed + 6) - 0.5) * 0.18, pw, pd, 0, pSeed);
      pSeed += 7;
    }
  }

  if (typeof mergeStaticLowPolyGroupToVertexColor === 'function') {
    mergeStaticLowPolyGroupToVertexColor(paverGrp, { registerWall: false, castShadow: false });
    paverGrp.traverse(ch => { if (ch.isMesh) { ch.castShadow = false; ch.receiveShadow = true; } });
  }
  paverGrp.userData._isGroundSurface = true;
  worldGroup.add(paverGrp);
}

// -------------------------------------------------------------------------
// 3. 확장된 크리스프 로우 폴리곤 오픈월드 지형 & 짧은 해변 모래 가장자리 & 언덕 돌담 & 성전 벽돌 광장
// -------------------------------------------------------------------------
function buildSoftLowPolyWorldTerrain() {
  if (typeof setupMiracleDynamicSunAndShadows === 'function') {
    setupMiracleDynamicSunAndShadows();
  }

  const worldRad = window.MIRACLE_EXP_LIMIT || 152;
  const size = worldRad * 2.35;
  // 굵고 또렷한 삼각형 면이 살아나는 로우 폴리곤 지형 격자 (88x88 + 비정형 수평 정점 왜곡)
  const segs = 88;
  const indexedGeo = new THREE.PlaneGeometry(size, size, segs, segs);
  indexedGeo.rotateX(-Math.PI / 2);

  const hash2 = (x, z) => {
    const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
    return s - Math.floor(s);
  };

  const posIdx = indexedGeo.attributes.position;
  for (let i = 0; i < posIdx.count; i++) {
    let vx = posIdx.getX(i);
    let vz = posIdx.getZ(i);
    const roadCenterX = getMiracleMainRoadCenterX(vz);
    const shoreLineX = (typeof window.getMiracleWestShoreLineX === 'function')
      ? window.getMiracleWestShoreLineX(vz)
      : -92.0;

    // 도로·선착장·가장자리 부근을 제외한 일반 대지에 비정형 삼각 분할 느낌의 수평 정점 지터 적용
    const nearRoad = Math.min(1, Math.max(0, (Math.abs(vx - roadCenterX) - 4.5) / 6.0));
    const nearPier = (Math.abs(vz + 68) < 9 && vx < -72) ? 0 : 1;
    const nearEdge = (Math.abs(vx) > size * 0.48 || Math.abs(vz) > size * 0.48) ? 0 : 1;
    const jitterScale = nearRoad * nearPier * nearEdge * 0.85;
    if (jitterScale > 0.02) {
      vx += (hash2(vx, vz) - 0.5) * 1.45 * jitterScale;
      vz += (hash2(vz + 17.3, vx - 9.1) - 0.5) * 1.45 * jitterScale;
    }

    const vy = getMiracleOpenWorldGroundHeight(vx, vz);
    posIdx.setXYZ(i, vx, vy, vz);
  }

  // Non-indexed 변환 후 삼각형 1면당 단일 플랫 색상을 부여하여 각진 로우 폴리곤 면 대비를 극대화!
  const geo = indexedGeo.toNonIndexed();
  indexedGeo.dispose();

  const posAttr = geo.attributes.position;
  const colors = new Float32Array(posAttr.count * 3);

  const cDeepSeaBed   = new THREE.Color('#0369a1');
  const cShoreSand    = new THREE.Color('#e6d09c'); // 해변 가장자리 짧은 모래색 (모래사장 아님)
  const cCoastalEarth = new THREE.Color('#c9b372');
  const cWarmMeadow   = new THREE.Color('#b6b968'); // 따뜻한 지중해 연두-황토 로우폴리 대지
  const cSunlitOchre  = new THREE.Color('#d8b674'); // 레퍼런스 이미지 스타일 따뜻한 황토 평원
  const cSlopeOchre   = new THREE.Color('#cf9f60'); // 기존 산·언덕 사암/황토 면
  const cSlopeGreen   = new THREE.Color('#5a983e'); // 산 사면에 혼합되는 싱그러운 초록 면
  const cHillOlive    = new THREE.Color('#6a9b43'); // 기존 올리브와 초록색을 혼합한 산 중턱
  const cHillGreen    = new THREE.Color('#478932'); // 진한 초록 산 능선
  const cHillTopGrass = new THREE.Color('#569438'); // 산 정상 초록+올리브 혼합 그린
  const cDirtRoad     = new THREE.Color('#dfb984'); // 햇살 받은 밝은 모래흙 길
  const cRoadEdge     = new THREE.Color('#d4ac76');
  const cPlazaBed     = new THREE.Color('#c7baa4'); // 성전 큰벽돌 바닥 하부 석재 줄눈층
  const cGolgotha     = new THREE.Color('#9e907c');

  const vA = new THREE.Vector3(), vB = new THREE.Vector3(), vC = new THREE.Vector3();
  const e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), nrm = new THREE.Vector3();
  const fCol = new THREE.Color();
  const cTmpMeadow = new THREE.Color();
  const cTmpHill = new THREE.Color();
  const cTmpSlope = new THREE.Color();
  const cTmpTop = new THREE.Color();
  const smoothBlend01 = (v) => {
    const c = Math.max(0, Math.min(1, v));
    return c * c * (3 - 2 * c);
  };

  for (let i = 0; i + 2 < posAttr.count; i += 3) {
    vA.set(posAttr.getX(i),     posAttr.getY(i),     posAttr.getZ(i));
    vB.set(posAttr.getX(i + 1), posAttr.getY(i + 1), posAttr.getZ(i + 1));
    vC.set(posAttr.getX(i + 2), posAttr.getY(i + 2), posAttr.getZ(i + 2));

    const mx = (vA.x + vB.x + vC.x) / 3;
    const my = (vA.y + vB.y + vC.y) / 3;
    const mz = (vA.z + vB.z + vC.z) / 3;

    e1.subVectors(vB, vA);
    e2.subVectors(vC, vA);
    nrm.crossVectors(e1, e2).normalize();
    const slopeFlat = Math.abs(nrm.y);

    const roadCenterX = getMiracleMainRoadCenterX(mz);
    const distFromMainRoad = Math.abs(mx - roadCenterX);

    const bethRoadTargetZ = -52 - Math.max(0, Math.min(1, (mx - 6) / 82)) * 30 + Math.sin(mx * 0.08) * 3.2;
    const onBethsaidaHillTrail = (mx >= 2 && mx <= 90 && Math.abs(mz - bethRoadTargetZ) < 3.6);
    const onGalileePierTrail = (mx >= -88 && mx <= roadCenterX + 2 && Math.abs(mz - (-68 + Math.sin(mx * 0.06) * 2.5)) < 3.5);
    const onJerichoBranch = (mz > -12 && mz < 6 && mx > -34 && mx < 56);
    const onGolgothaTrail = (mz > 52 && mz < 82 && Math.abs(mx - (-8 - (mz - 52) * 1.8)) < 4.0);
    const onOliveMountTrail = (mx >= 10 && mx <= 90 && Math.abs(mz - (58 + (mx - 10) * 0.2)) < 3.6);

    const shoreLineX = (typeof window.getMiracleWestShoreLineX === 'function')
      ? window.getMiracleWestShoreLineX(mz)
      : -92.0;
    const distFromShore = mx - shoreLineX;

    if (distFromShore < -4.2) {
      fCol.copy(cDeepSeaBed);
    } else if (distFromShore < -0.6) {
      // 얕은 물속 모래 바닥 (투명한 소프트 로우폴리 수면 아래로 비쳐 보이는 연청·모래 톤)
      const subT = Math.max(0, Math.min(1, (distFromShore + 4.2) / 3.6));
      fCol.copy(cDeepSeaBed).lerp(cShoreSand, 0.35 + subT * 0.45);
    } else if (distFromShore < 4.2 && my < 1.35 && !onGalileePierTrail) {
      // 완만히 경사진 밝은 모래 물가 경사면 (Image 1 스타일)
      const sandT = Math.max(0, Math.min(1, (distFromShore + 0.6) / 4.8));
      fCol.copy(cShoreSand).lerp(cCoastalEarth, sandT * 0.22);
    } else if (distFromShore < 6.5 && my < 1.45 && !onGalileePierTrail) {
      // 풀밭에서 모래 물가로 한 단 내려오는 약간의 해안 둑 단차 경사면 (따뜻한 황토-사암 턱)
      const bankT = Math.max(0, Math.min(1, (distFromShore - 4.2) / 2.3));
      fCol.copy(cCoastalEarth).lerp(cWarmMeadow, bankT * 0.45);
    } else if (
      (Math.abs(mx) < 22.5 && mz > 44 && mz < 87) ||
      (mz >= 21 && mz <= 46 && distFromMainRoad < 5.4)
    ) {
      fCol.copy(cPlazaBed);
    } else if (
      distFromMainRoad < 4.4 ||
      onBethsaidaHillTrail ||
      onGalileePierTrail ||
      onJerichoBranch ||
      onGolgothaTrail ||
      onOliveMountTrail
    ) {
      fCol.copy(cDirtRoad);
    } else if (distFromMainRoad < 6.4) {
      fCol.copy(cRoadEdge);
    } else {
      // [자연스러운 외곽 경계 블렌딩] 직선/계단식 경계선 없이 삼각형 단위 도메인 워프·랜덤 혼합 적용
      const nCoarse = hash2(Math.floor(mx * 0.11) + 1.9, Math.floor(mz * 0.11) - 2.3);
      const nFine   = hash2(Math.floor(mx * 0.31) + i * 0.03, Math.floor(mz * 0.31) - i * 0.02);
      const patch   = hash2(Math.floor(mx * 0.14), Math.floor(mz * 0.14));
      const mtnMix  = hash2(Math.floor(mx * 0.16) + 3.1, Math.floor(mz * 0.16) - 1.7);
      const midMix  = hash2(Math.floor(mx * 0.15) + 7.3, Math.floor(mz * 0.15));
      const topMix  = hash2(Math.floor(mx * 0.18) - 2.1, Math.floor(mz * 0.18) + 4.7);

      const elevNoise = (nCoarse - 0.5) * 2.1 + (nFine - 0.5) * 1.15;
      const effH = my + elevNoise;

      // 평원 기본 황토·연두 혼합색
      cTmpMeadow.copy(cWarmMeadow).lerp(cSunlitOchre, 0.24 + patch * 0.54);
      // 산기슭/능선 올리브-초록 혼합색
      cTmpHill.copy(cHillOlive).lerp(cHillGreen, 0.18 + midMix * 0.44);
      // 고지대 능선 혼합색
      cTmpTop.copy(cHillTopGrass).lerp(cHillGreen, 0.25 + topMix * 0.48);
      // 사면 사암/황토-초록 혼합색
      cTmpSlope.copy(cSlopeOchre).lerp(cSlopeGreen, 0.30 + mtnMix * 0.48);

      // 외곽 산맥 가장자리 거리도 굴곡/랜덤 오프셋으로 서서히 혼합 (직선 경계 차단)
      const rimWave = Math.sin(mx * 0.075 + mz * 0.065) * 5.5 + (nCoarse - 0.5) * 9.0;
      const rimDist = Math.max(mx - (96 + rimWave), (-96 + rimWave) - mz, mz - (96 + rimWave));
      const rimFactor = smoothBlend01(rimDist / 26.0);

      const hillT = smoothBlend01((effH - 1.1) / 3.8);
      const topT  = smoothBlend01((effH - 5.6) / 4.0);
      const slopeT = smoothBlend01((0.96 - slopeFlat) / 0.11) * smoothBlend01((effH - 0.8) / 2.6);

      fCol.copy(cTmpMeadow).lerp(cTmpHill, Math.max(hillT, rimFactor * (0.45 + nFine * 0.45)));
      fCol.lerp(cTmpTop, topT * 0.82);
      fCol.lerp(cTmpSlope, slopeT * 0.72);

      // 외곽 산 영역의 단조로움을 없애는 삼각형 단위 이스라엘 석회암·세이지 랜덤 블렌딩
      if (rimFactor > 0.05) {
        const scrubRoll = hash2(mx * 0.43 + 11.7, mz * 0.43 - 5.9);
        if (scrubRoll < 0.28) {
          fCol.lerp(cSunlitOchre, rimFactor * (0.20 + scrubRoll));
        } else if (scrubRoll > 0.72) {
          fCol.lerp(cSlopeOchre, rimFactor * 0.26);
        }
      }

      // 서남부 골고다 바위 언덕도 사각형 직선 경계 없이 원형/노이즈 감쇠로 자연스럽게 혼합
      const golgD = Math.hypot((mx + 62) / 38, (mz - 78) / 34) + (nCoarse - 0.5) * 0.24;
      const golgT = (1.0 - smoothBlend01((golgD - 0.35) / 0.65)) * smoothBlend01((effH - 1.5) / 2.5);
      if (golgT > 0.02) {
        fCol.lerp(cGolgotha, golgT * 0.86);
      }
    }

    // 삼각형 면마다 고유한 명도 차이를 부여해 각진 폴리곤 실루엣을 선명하게 살림
    const faceTone = (hash2(mx * 1.7 + i * 0.01, mz * 1.9) - 0.5) * 0.068;
    fCol.offsetHSL(0, 0, faceTone);

    for (let k = 0; k < 3; k++) {
      colors[(i + k) * 3]     = fCol.r;
      colors[(i + k) * 3 + 1] = fCol.g;
      colors[(i + k) * 3 + 2] = fCol.b;
    }
  }

  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const terrainMat = new THREE.MeshPhongMaterial({
    vertexColors: true,
    flatShading: true,
    shininess: 0,
    specular: 0x000000
  });
  const terrainMesh = new THREE.Mesh(geo, terrainMat);
  terrainMesh.receiveShadow = true;
  terrainMesh.userData._isGroundSurface = true;
  worldGroup.add(terrainMesh);

  buildLowPolyPerimeterMountainRange();
  buildHillsideStoneTerraceWalls();
  buildTempleIrregularStonePavement();

  // [Image 1 스타일] 비정형 삼각 분할 소프트 로우폴리 갈릴리 바닷물 (얕은 물가 청록 → 깊은 바다 코발트)
  const wideWestSea = (typeof createIrregularLowPolyWaterMesh === 'function')
    ? createIrregularLowPolyWaterMesh(320, 580, 40, 64, 29, { shoreRightEdgeX: 150, shallowBandW: 44, opacity: 0.84, isStorm: false })
    : (() => {
        const g = new THREE.PlaneGeometry(310, 580, 34, 64); g.rotateX(-Math.PI / 2);
        return new THREE.Mesh(g, new THREE.MeshPhongMaterial({ color: 0x0284c7, transparent: true, opacity: 0.84, flatShading: true, shininess: 0, specular: 0x000000 }));
      })();
  wideWestSea.position.set(-242, -0.40, 0);
  wideWestSea.receiveShadow = true;
  worldGroup.add(wideWestSea);
  window.miracleOpenWorldSeaMesh = wideWestSea;

  // [Image 1 스타일] 해안 단차 턱·경사진 모래 물가·얕은 물속을 꾸며주는 소프트 로우폴리 해변 돌 & 부들(갈대) 수초 (1 드로우콜 병합)
  const coastDecorGrp = new THREE.Group();
  const coastStoneCols = ['#d6cfc2', '#cbd5e1', '#a8a29e', '#b8b0a4', '#94a3b8'];
  for (let z = -96; z <= 96; z += 4.6) {
    // 선착장(-73..-63)과 아침식사 낚시터(-82..-74) 정면은 깔끔히 비워둠
    if ((z > -73 && z < -63) || (z > -82 && z < -74)) continue;
    const sX = (typeof window.getMiracleWestShoreLineX === 'function') ? window.getMiracleWestShoreLineX(z) : -92.0;
    const idx = Math.abs(Math.round(z));
    // 1) 물가/얕은 물속 반쯤 잠긴 둥근 다면체 조약돌
    const wetX = sX - 0.6 + (idx % 4) * 1.1;
    const wetY = getMiracleOpenWorldGroundHeight(wetX, z);
    const wetRad = 0.42 + (idx % 3) * 0.22;
    const wetStone = createLowPolyMesh(new THREE.DodecahedronGeometry(wetRad, 0), coastStoneCols[idx % coastStoneCols.length], wetX, wetY + wetRad * 0.28, z, false);
    wetStone.scale.set(1.32, 0.56, 1.12);
    wetStone.rotation.y = idx * 0.8;
    coastDecorGrp.add(wetStone);

    // 2) 해안 둑 단차 아래/위 바위 & 부들(갈대) 수초 군락
    if (idx % 2 === 0) {
      const bankX = sX + 4.3 + (idx % 3) * 0.7;
      const bankY = getMiracleOpenWorldGroundHeight(bankX, z + 1.1);
      if (typeof createShorelineCattailCluster === 'function') {
        const cat = createShorelineCattailCluster(0.88 + (idx % 3) * 0.14);
        cat.position.set(bankX, bankY - 0.04, z + 1.1);
        cat.rotation.y = idx * 0.65;
        coastDecorGrp.add(cat);
      }
    }
    if (idx % 3 === 1) {
      const dryX = sX + 2.4 + (idx % 2) * 1.2;
      const dryY = getMiracleOpenWorldGroundHeight(dryX, z - 1.2);
      const drySt = createLowPolyMesh(new THREE.DodecahedronGeometry(0.32 + (idx % 2) * 0.14, 0), coastStoneCols[(idx + 2) % coastStoneCols.length], dryX, dryY + 0.12, z - 1.2, false);
      drySt.scale.set(1.25, 0.52, 1.05);
      coastDecorGrp.add(drySt);
    }
  }
  if (typeof mergeStaticLowPolyGroupToVertexColor === 'function') {
    mergeStaticLowPolyGroupToVertexColor(coastDecorGrp, { registerWall: false, castShadow: false });
  }
  worldGroup.add(coastDecorGrp);

  // 확장된 서쪽 해변(곡선 해안선 판정은 canMoveTo에서 정밀 연동)을 포함한 안전 이동 경계
  currentMapRectBounds = {
    minX: -120.0,
    maxX:  105.5,
    minZ: -105.5,
    maxZ:  105.5
  };

  // 서쪽 바다 해안 비정형 소프트 로우폴리 선착장 다리(부두, x = -90, z = -68) 및 정박된 갈릴리 목선
  const pierGrp = (typeof createOrganicGalileePierGroup === 'function')
    ? createOrganicGalileePierGroup(12.8, 3.8, 41)
    : (() => {
        const g = new THREE.Group();
        g.add(createLowPolyMesh(new THREE.BoxGeometry(12.5, 0.35, 3.8), '#92400e', 0, 0.22, 0));
        return g;
      })();
  pierGrp.position.set(-90, 0.0, -68);
  worldGroup.add(pierGrp);
  platforms.push({ minX: -96.5, maxX: -83.5, minZ: -70.0, maxZ: -66.0, topY: 0.36 });

  const dockedBoat = createLowPolyGalileeBoat(0.95);
  dockedBoat.position.set(-99.5, -0.38, -68.0);
  dockedBoat.rotation.y = Math.PI * 0.15;
  worldGroup.add(dockedBoat);
  miracleAmbientProps.push({ kind: 'boat', mesh: dockedBoat, baseY: -0.38, phase: 0.5 });

  // 북부~중부 순례길 위 돌판석 장식 (z = 22부터는 성전 입구 큰벽돌 포장이 이어짐)
  for (let pz = -96; pz < 21; pz += 9) {
    const rx = getMiracleMainRoadCenterX(pz);
    const ry = getMiracleOpenWorldGroundHeight(rx, pz);
    for (let k = -1; k <= 1; k++) {
      const stone = createLowPolyMesh(
        new THREE.BoxGeometry(1.1, 0.06, 0.75),
        (pz + k) % 2 === 0 ? '#d6ccc2' : '#bfb3a2',
        rx + k * 1.35 + ((pz % 3) - 1) * 0.2,
        ry + 0.03,
        pz + (k * 0.4),
        false
      );
      stone.rotation.y = (pz * 0.15);
      worldGroup.add(stone);
    }
  }
}

// -------------------------------------------------------------------------
// 4. 길가 고대 유대 건축물 행렬 (인접 건물 옥상·2층 점프 이동이 가능한 클러스터 포함) & 생태계 스폰
// -------------------------------------------------------------------------
function buildMiracleRoadsideVillagesAndForests() {
  miracleWanderingActors = [];

  // 건물 간 최소 보행 통로(2.4m 이상)를 확보하여 건물 사이에 끼는 현상을 방지하고,
  // 예루살렘 성전 주변 건물은 충분히 뒤로 물러나 현실적인 광장 공간을 형성하도록 배치
  const roadsideBuildingSpecs = [
    // [클러스터 1: 북부 가나 서쪽 가옥 구간]
    { x: -16.5, z: -89.0, v: 1, yaw:  Math.PI / 2, sc: 0.98, m: 'stonebrick' },
    { x: -16.5, z: -79.2, v: 0, yaw:  Math.PI / 2, sc: 0.96 },
    // [클러스터 2: 북부 가나 동쪽 가옥 구간 — 외벽 계단 간 충분한 여유 간격 확보]
    { x:  13.5, z: -91.2, v: 3, yaw: -Math.PI / 2, sc: 0.98 },
    { x:  13.5, z: -79.2, v: 2, yaw: -Math.PI / 2, sc: 0.96, m: 'stonebrick' },
    { x:  13.5, z: -67.2, v: 0, yaw: -Math.PI / 2, sc: 0.95 },
    // [클러스터 3: 갈릴리 서쪽 길가 가옥]
    { x: -15.5, z: -57.5, v: 3, yaw:  Math.PI / 2, sc: 0.96, m: 'stonebrick' },
    { x: -15.5, z: -47.6, v: 0, yaw:  Math.PI / 2, sc: 0.96 },
    // [클러스터 4: 가버나움 중풍병자 집(22, -52) 주변 (넓은 골목 간격 확보)]
    { x:  11.6, z: -52.0, v: 2, yaw:  0.0,         sc: 0.94 },
    { x:  35.5, z: -46.0, v: 1, yaw: -0.25,        sc: 0.98, m: 'stonebrick' },
    // [클러스터 5: 중북부 순례길 양옆 가옥 — 동측 계단끼리 겹치지 않도록 간격 확장]
    { x: -15.0, z: -32.2, v: 1, yaw:  Math.PI / 2, sc: 0.98 },
    { x: -15.0, z: -22.2, v: 4, yaw:  Math.PI / 2, sc: 0.95, m: 'stonebrick' },
    { x:  15.0, z: -33.8, v: 3, yaw: -Math.PI / 2, sc: 0.98 },
    { x:  15.0, z: -20.2, v: 0, yaw: -Math.PI / 2, sc: 0.96 },
    // [클러스터 6: 사마리아 · 여리고 입구 가옥 — 계단 겹침 해소]
    { x:  16.0, z:  -9.2, v: 0, yaw: -Math.PI / 2, sc: 0.96, m: 'stonebrick' },
    { x:  16.0, z:   1.2, v: 3, yaw: -Math.PI / 2, sc: 0.98 },
    { x:  52.5, z: -11.8, v: 1, yaw: -Math.PI / 2, sc: 0.98 },
    { x:  52.5, z:   1.6, v: 0, yaw: -Math.PI / 2, sc: 0.96, m: 'stonebrick' },
    // [기본맵 vs 멀티플레이 맵 구분]
    // 개인 기본맵에서는 원래 있던 인근 가옥 2채((52.5, 11.4), (72.0, 8.0))를 그대로 복구하고,
    // 온라인 멀티플레이 맵에서만 두 채를 비워 확장형 대형 반석 부지(63, 18)를 확보!
    ...(window.isMiracleMultiplayerMode ? [] : [
      { x: 52.5, z: 11.4, v: 2, yaw: -Math.PI / 2, sc: 0.95 },
      { x: 72.0, z:  8.0, v: 1, yaw: -1.15,        sc: 0.96, m: 'stonebrick' }
    ]),
    // [클러스터 7: 유대 광야 ~ 예루살렘 성문 앞 가옥 — 계단 겹침 해소]
    { x: -15.0, z:  10.6, v: 0, yaw:  Math.PI / 2, sc: 0.96 },
    { x: -15.0, z:  24.2, v: 3, yaw:  Math.PI / 2, sc: 0.98, m: 'stonebrick' },
    { x: -15.0, z:  36.6, v: 1, yaw:  Math.PI / 2, sc: 0.96 },
    { x:  15.5, z:  32.0, v: 2, yaw: -Math.PI / 2, sc: 0.95 },
    // [클러스터 8: 예루살렘 성전 외곽 거리 — 성전에서 충분히 뒤로 물러나 배치]
    { x: -24.5, z:  42.5, v: 0, yaw:  Math.PI / 2, sc: 0.96, m: 'stonebrick' },
    { x:  28.0, z:  44.0, v: 1, yaw: -Math.PI / 2, sc: 0.98 },
    { x:  29.0, z:  55.2, v: 3, yaw: -Math.PI / 2, sc: 0.98, m: 'stonebrick' },
    { x:  35.5, z:  68.5, v: 4, yaw: -Math.PI / 2, sc: 0.96 },
    { x:  35.5, z:  79.2, v: 1, yaw: -Math.PI / 2, sc: 0.98 },

    // [신규 추가: 넓은 공터에 배치한 비정형 벽돌 조적 건물들]
    { x: -36.0, z: -72.0, v: 1, yaw:  0.45,        sc: 0.96, m: 'stonebrick' },
    { x: -52.0, z: -66.0, v: 2, yaw:  0.85,        sc: 0.94, m: 'stonebrick' },
    { x:  40.0, z: -60.0, v: 0, yaw: -0.60,        sc: 0.96, m: 'stonebrick' },
    { x:  64.0, z: -44.0, v: 3, yaw: -0.95,        sc: 0.96, m: 'stonebrick' },
    { x: -30.0, z: -32.0, v: 2, yaw:  0.55,        sc: 0.95, m: 'stonebrick' },
    { x: -44.0, z:  -8.0, v: 0, yaw:  1.15,        sc: 0.95, m: 'stonebrick' },
    { x:  70.0, z:  -8.0, v: 1, yaw: -1.35,        sc: 0.96, m: 'stonebrick' },
    { x: -28.0, z:  30.0, v: 4, yaw:  0.75,        sc: 0.95, m: 'stonebrick' },
    { x:  48.0, z:  44.0, v: 1, yaw: -0.80,        sc: 0.96, m: 'stonebrick' }
  ];

  roadsideBuildingSpecs.forEach(b => {
    addJudeanRoadsideBuilding(b.x, b.z, b.v, b.yaw, b.sc, false, b.m || 'plaster');
  });

  createLowPolyWoodenCart(-9.5, -48, 0.25);
  createLowPolyWoodenCart( 9.8,  -8, -0.35);
  createLowPolyWoodenCart(-9.2,  30, 0.18);
  createOrganicStreetPropCluster(-10.8, -82.0,  0.4, 11);
  createOrganicStreetPropCluster(  8.8, -74.0, -0.5, 22);
  createOrganicStreetPropCluster(-10.4, -26.5,  0.2, 33);
  createOrganicStreetPropCluster( 10.6, -24.5, -0.3, 44);
  createOrganicStreetPropCluster(-10.4,  20.0,  0.5, 55);
  createOrganicStreetPropCluster( 23.0,  49.0, -0.4, 66);
  // 레퍼런스 이미지 스타일의 활기찬 길가 시장 가판대(일부 농도차 스트라이프 천막 + 과일·향신료·토기·직물 진열)
  createStandaloneMarketStall(-9.6, -63.0,  Math.PI * 0.5,  0, true,  301); // 청과·과일 상점 (스트라이프)
  createStandaloneMarketStall( 9.8, -40.5, -Math.PI * 0.5,  1, false, 317); // 곡식·향신료 상점 (아마포)
  createStandaloneMarketStall(-9.6,   2.5,  Math.PI * 0.5,  2, true,  333); // 토기·올리브유 상점 (스트라이프)
  createStandaloneMarketStall(10.0,  19.0, -Math.PI * 0.5,  3, true,  349); // 빵·직물 상점 (스트라이프)
  // 짐을 실은 당나귀들은 정지 프롭이 아니라 마을 길가를 살아 움직이며 순찰하도록 wanderingConfigs로 이동 배치!

  if (typeof addLowPolyCanopyTree === 'function') {
    [[74, -92, 1.35], [98, -76, 1.35], [-48, -32, 1.25], [58, -22, 1.25], [94, 68, 1.30]].forEach(([tx, tz, sc]) => {
      if (isNearSowerFarmPlot(tx, tz, 9.0)) return;
      if (isNearMustardPlot(tx, tz, 6.5)) return;
      const m = addLowPolyCanopyTree(tx, tz, sc, true);
      if (typeof recordMiracleWorldTree === 'function') recordMiracleWorldTree(tx, tz, 'canopy', sc);
      registerMiracleHarvestNode('wood', tx, tz, m, sc);
    });
  }

  const oliveSpots = [
    [-42, -88], [-26, -88], [26, -84], [48, -88], [66, -98], [100, -92],
    [56, -54],  [96, -58],  [82, -100],[44, -72], [28, -66], [100, -72],
    [-38, -42], [28, -40],  [52, -36], [76, -40], [94, -28], [-56, -28],
    [-64, -16], [28, -18],  [68, -18], [92,  -4], [84,  18], [-48,   4],
    [-54,  28], [-38,  36], [36,  38], [62,  42], [94,  46], [ 98,  66],
    [68,   82], [92,   88], [76,  96], [48,  94], [-48, 92], [-32,  98],
    [-82,  48], [-86,  66], [-38, 60], [32,  98], [  4, 98],
    // [멀티플레이 자원 채집용 추가 외곽 나무 숲]
    [-62, -92], [-22, -96], [18, -96], [56, -96], [92, -84], [96, -44],
    [96,  -16], [96,    8], [95,  28], [96,  56], [88,  96], [62,  98],
    [22,   98], [-64,  96], [-86, 26], [-84, -46], [82,  36], [42,  60]
  ];
  oliveSpots.forEach(([tx, tz], i) => {
    // 예수님 동산 무덤(-22, 91) 반경 13m, 씨 뿌리기 산기슭 밭 반경 9m, 확장 반석 부지(63, 18) 반경 12m 이내에는 배치 금지
    if (Math.hypot(tx + 22, tz - 91) < 13.0) return;
    if (isNearSowerFarmPlot(tx, tz, 9.0)) return;
    if (isNearMustardPlot(tx, tz, 6.2)) return;
    if (Math.hypot(tx - 63, tz - 18) < 12.5) return;
    const sc = 1.0 + (i % 3) * 0.18;
    const m = addLowPolyOliveTree(tx, tz, sc, true);
    registerMiracleHarvestNode('wood', tx, tz, m, sc);
  });

  const cypressSpots = [
    [-32, -98], [-12, -100], [ 8, -98], [28, -98], [64, -100], [98, -98],
    [-78, -36], [-72,  -22], [-80, -4], [-78, 26], [-82,  42],
    [-82,  72], [-78,   90], [-56, 96], [-40, 98], [-10, 100],
    [ 98,  28], [100,   48], [ 98, 82], [ 58, 98], [ 38, -88], [46, -94],
    // [멀티플레이 자원 채집용 추가 외곽 측백/소나무]
    [-58, -98], [-2, -99], [76, -98], [99, -62], [99, -10], [99, 14],
    [99,   38], [96,  72], [82,  99], [40,  99], [14,  99], [-68, 98]
  ];
  cypressSpots.forEach(([cx, cz], i) => {
    if (Math.hypot(cx + 22, cz - 91) < 13.0) return;
    if (isNearSowerFarmPlot(cx, cz, 9.0)) return;
    if (isNearMustardPlot(cx, cz, 6.2)) return;
    if (Math.hypot(cx - 63, cz - 18) < 12.5) return;
    const sc = 0.95 + (i % 3) * 0.22;
    const m = addLowPolyCypressPineTree(cx, cz, sc, true);
    registerMiracleHarvestNode('wood', cx, cz, m, sc);
  });

  const palmSpots = [
    [-76, -72], [-72, -82], [-68, -56], [-74, -40], [-76, -14],
    [ 62,   2], [ 36,  14], [ -8,  42], [  8,  42]
  ];
  palmSpots.forEach(([px, pz], i) => {
    if (Math.hypot(px + 22, pz - 91) < 13.0) return;
    if (isNearSowerFarmPlot(px, pz, 9.0)) return;
    if (isNearMustardPlot(px, pz, 6.2)) return;
    if (Math.hypot(px - 63, pz - 18) < 12.5) return;
    const sc = 1.05 + (i % 2) * 0.18;
    const m = addLowPolyPalmTree(px, pz, sc, true);
    registerMiracleHarvestNode('wood', px, pz, m, sc);
  });

  const cactusSpots = [
    [-54, -8], [-60,  2], [-56, 18], [-74,  8], [-64, 28],
    [ -4, 18], [ 28, 28], [ 48, 30], [-42, 24], [ 72, 26]
  ];
  cactusSpots.forEach(([sx, sz], i) => {
    if (isNearSowerFarmPlot(sx, sz, 8.0)) return;
    if (isNearMustardPlot(sx, sz, 6.0)) return;
    if (Math.hypot(sx - 63, sz - 18) < 12.0) return;
    addLowPolyCactusAndScrub(sx, sz, 0.9 + (i % 3) * 0.15);
  });

  const rockSpots = [
    [66, -88, 1.7], [96, -68, 2.0], [-36, -48, 1.5], [34, -26, 1.6],
    [-44, -16, 1.8], [-58,  8, 2.1], [-74, 18, 1.9], [88, -14, 2.0],
    [12,  14, 1.6], [48,  18, 1.8], [-48, 72, 2.2], [-76, 74, 2.0],
    [72,  62, 1.7], [94,  68, 1.9], [-30, 88, 1.8]
  ];
  rockSpots.forEach(([rx, rz, rad], idx) => {
    if (isNearSowerFarmPlot(rx, rz, 8.0)) return;
    if (isNearMustardPlot(rx, rz, 6.0)) return;
    if (Math.hypot(rx - 63, rz - 18) < 12.0) return;
    if (Math.abs(rx - getMiracleMainRoadCenterX(rz)) < 7.2) return;
    if (Math.hypot(rx - 10.0, rz - 19.0) < 6.0 || Math.hypot(rx + 9.6, rz - 2.5) < 5.5) return;
    const m = addLowPolyRock(rx, rz, rad, 0.78, idx % 2 === 0 ? '#94a3b8' : '#8c8275', true);
    registerMiracleHarvestNode('stone', rx, rz, m, rad);
  });

  // [멀티플레이 돌 채집용 오픈월드 외곽 큼직한 바위 26개 추가 배치 (산기슭·외곽 능선)]
  const outerGiantBoulders = [
    [-68, -96, 2.6], [-54, -98, 2.4], [-18, -99, 2.5], [14, -99, 2.6], [30, -96, 2.3],
    [60, -96, 2.7],  [78, -96, 2.5],  [98, -86, 2.8],  [98, -62, 2.6], [96, -42, 2.7],
    [98, -14, 2.6],  [96,   2, 2.8],  [96,  20, 2.5],  [95,  36, 2.7], [96,  54, 2.6],
    [96,  78, 2.8],  [84,  96, 2.6],  [66,  96, 2.5],  [46,  98, 2.7], [24,  96, 2.4],
    [ -2, 98, 2.5],  [-44, 96, 2.7],  [-62, 96, 2.5],  [-86, 56, 2.4], [-86, -24, 2.3],
    [ 84,  28, 2.4]
  ];
  outerGiantBoulders.forEach(([bx, bz, brad], idx) => {
    if (isNearSowerFarmPlot(bx, bz, 9.5)) return;
    if (isNearMustardPlot(bx, bz, 6.2)) return;
    if (Math.hypot(bx + 22, bz - 91) < 13.0) return;
    if (Math.hypot(bx - 63, bz - 18) < 12.5) return;
    const col = idx % 3 === 0 ? '#94a3b8' : (idx % 3 === 1 ? '#78716c' : '#a8a29e');
    const m = addLowPolyRock(bx, bz, brad, 0.88, col, true);
    registerMiracleHarvestNode('stone', bx, bz, m, brad);
  });

  if (typeof addLowPolyWildflowerCluster === 'function') {
    for (let f = 0; f < 60; f++) {
      const fx = -74 + ((f * 41) % 170);
      const fz = -96 + ((f * 59) % 192);
      if (Math.abs(fx - getMiracleMainRoadCenterX(fz)) < 5.5) continue;
      addLowPolyWildflowerCluster(fx, fz, 0.95 + (f % 3) * 0.18);
    }
  }

  const wanderingConfigs = [
    { kind: 'person', preset: 'villager', x:  -2, z: -74, rad: 10.0, spd: 1.9 },
    { kind: 'person', preset: 'woman',    x:   5, z: -52, rad: 9.0,  spd: 1.8 },
    { kind: 'person', preset: 'villager', x:  22, z: -60, rad: 8.5,  spd: 1.9 },
    { kind: 'person', preset: 'child',    x:  28, z: -42, rad: 7.0,  spd: 2.3 },
    { kind: 'person', preset: 'villager', x:  58, z: -70, rad: 9.0,  spd: 1.8 },
    { kind: 'person', preset: 'woman',    x:  78, z: -76, rad: 8.0,  spd: 1.7 },
    { kind: 'person', preset: 'villager', x:  -3, z: -22, rad: 10.0, spd: 2.0 },
    { kind: 'person', preset: 'villager', x:   2, z:   0, rad: 9.5,  spd: 1.9 },
    { kind: 'person', preset: 'woman',    x: -22, z:  -6, rad: 8.0,  spd: 1.8 },
    { kind: 'person', preset: 'villager', x:  34, z:   2, rad: 8.5,  spd: 2.0 },
    { kind: 'person', preset: 'villager', x:  -2, z:  26, rad: 9.5,  spd: 1.9 },
    { kind: 'person', preset: 'woman',    x:   4, z:  56, rad: 9.0,  spd: 1.8 },
    { kind: 'person', preset: 'villager', x: -10, z:  66, rad: 8.5,  spd: 1.9 },
    { kind: 'person', preset: 'child',    x:  12, z:  60, rad: 7.0,  spd: 2.2 },
    { kind: 'deer',   x: -56, z: -52, rad: 9.0, spd: 2.1 },
    { kind: 'deer',   x:  64, z: -86, rad: 9.0, spd: 2.1 },
    { kind: 'deer',   x:  92, z: -66, rad: 8.5, spd: 2.0 },
    { kind: 'deer',   x: -42, z: -24, rad: 8.5, spd: 2.0 },
    { kind: 'deer',   x:  72, z:  42, rad: 9.0, spd: 2.1 },
    { kind: 'deer',   x:  82, z:  84, rad: 8.5, spd: 2.0 },
    { kind: 'sheep',  x: -54, z:   4, rad: 8.0, spd: 1.6 },
    { kind: 'sheep',  x: -60, z:  18, rad: 8.0, spd: 1.6 },
    { kind: 'sheep',  x:  48, z: -58, rad: 7.5, spd: 1.5 },
    { kind: 'sheep',  x:  76, z: -90, rad: 7.5, spd: 1.5 },
    { kind: 'sheep',  x: -46, z:  44, rad: 7.5, spd: 1.6 },
    { kind: 'sheep',  x:  56, z:  64, rad: 7.5, spd: 1.6 },
    // 짐을 실은 당나귀 4마리: 마을 길가·시장·성전 앞 거리를 실제로 걸어 다니며 짐을 나름!
    { kind: 'donkey', x:   6.8, z: -24.0, rad: 10.5, spd: 1.75 },
    { kind: 'donkey', x:  -7.2, z:  16.0, rad: 10.5, spd: 1.65 },
    { kind: 'donkey', x:   8.0, z:  54.0, rad:  9.5, spd: 1.60 },
    { kind: 'donkey', x:  -6.8, z: -40.0, rad: 10.0, spd: 1.70 }
  ];

  wanderingConfigs.forEach((wc, idx) => {
    const by = getMiracleOpenWorldGroundHeight(wc.x, wc.z);
    let mesh;
    if (wc.kind === 'person') {
      mesh = createLowPolyPersonMesh(wc.preset, idx + 20);
    } else if (typeof createLowPolyAnimalMesh === 'function') {
      mesh = createLowPolyAnimalMesh(wc.kind, 1.0);
    } else {
      mesh = createSingleAnimal('sheep');
    }
    mesh.position.set(wc.x, by, wc.z);
    worldGroup.add(mesh);

    let oilLamp = null;
    if (wc.kind === 'person' && wc.preset !== 'child' && (idx % 3 !== 0) && typeof window.createAncientOilLampProp === 'function') {
      const rArm = mesh.userData ? mesh.userData.rArm : null;
      if (rArm) {
        oilLamp = window.createAncientOilLampProp(0.95);
        oilLamp.group.position.set(0.02, -0.44, 0.14);
        oilLamp.group.rotation.x = 0.72;
        oilLamp.group.visible = false;
        rArm.add(oilLamp.group);
        if (window.MiracleDayNight && typeof window.MiracleDayNight.registerNightLightSource === 'function') {
          window.MiracleDayNight.registerNightLightSource({
            getPos: () => mesh.position,
            yOffset: 1.25,
            color: 0xffb347,
            intensity: 1.15,
            distance: 9.0,
            phase: idx * 0.9,
            isActive: () => Boolean(oilLamp && oilLamp.group.visible)
          });
        }
      }
    }

    miracleWanderingActors.push({
      kind: wc.kind,
      isAnimal: wc.kind !== 'person',
      isPackDonkey: wc.kind === 'donkey',
      mesh,
      oilLamp,
      homeX: wc.x,
      homeZ: wc.z,
      targetX: wc.x + (Math.random() - 0.5) * wc.rad,
      targetZ: wc.z + (Math.random() - 0.5) * wc.rad,
      radius: wc.rad,
      speed: wc.spd,
      heading: Math.random() * Math.PI * 2,
      waitTimer: wc.kind === 'donkey' ? 0 : (idx % 3) * 0.8,
      phase: idx * 0.9
    });
  });

  if (typeof buildMiracleOuterMountainIsraelFlora === 'function') {
    buildMiracleOuterMountainIsraelFlora();
  }
}

// -------------------------------------------------------------------------
// 4-B. [외곽 산 경계 자연화] 북·동·남 외곽 산맥 및 전이 구릉에 1세기 이스라엘 식생 6종 식재
//      (올리브나무 · 무화과나무 · 대추야자 · 우슬초 · 아네모네 · 케이퍼/거친 풀)
// -------------------------------------------------------------------------
function buildMiracleOuterMountainIsraelFlora() {
  if (typeof window.createIsraelOliveTreeGroup !== 'function') return;

  const floraGrp = new THREE.Group();
  const hashF = (a, b) => {
    const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
    return v - Math.floor(v);
  };

  const canPlaceFlora = (x, z) => {
    const shoreX = (typeof window.getMiracleWestShoreLineX === 'function') ? window.getMiracleWestShoreLineX(z) : -92.0;
    if (x < shoreX + 8.5) return false;
    if (Math.abs(x - getMiracleMainRoadCenterX(z)) < 8.5) return false;
    if (Math.abs(x) < 26 && z > 42 && z < 92) return false; // 예루살렘 성전 광장
    if (Math.hypot(x + 22, z - 92) < 15.0) return false;   // 빈 무덤
    if (Math.hypot(x - 88, z + 82) < 8.0) return false;    // 벳새다 언덕 정상 비움
    if (Math.hypot(x - 88, z - 74) < 8.5) return false;    // 감람산 승천 정상 비움
    if (Math.hypot(x + 62, z - 78) < 11.5) return false;   // 골고다 세 십자가 주변
    if (Math.hypot(x - 63, z - 18) < 13.5) return false;   // 반석 건축지
    if (typeof isNearSowerFarmPlot === 'function' && isNearSowerFarmPlot(x, z, 10.5)) return false;
    if (typeof isNearMustardPlot === 'function' && isNearMustardPlot(x, z, 6.2)) return false;
    const bethZ = -52 - Math.max(0, Math.min(1, (x - 6) / 82)) * 30 + Math.sin(x * 0.08) * 3.2;
    if (x >= 2 && x <= 92 && Math.abs(z - bethZ) < 5.2) return false;
    if (x >= 10 && x <= 92 && Math.abs(z - (58 + (x - 10) * 0.2)) < 5.2) return false;
    return true;
  };

  const spawnSpecimen = (kind, fx, fz, sc, seed) => {
    if (!canPlaceFlora(fx, fz)) return;
    const fy = getMiracleOpenWorldGroundHeight(fx, fz);
    if (fy < 0.25) return;

    let item = null;
    if (kind === 'olive') item = window.createIsraelOliveTreeGroup(sc, seed);
    else if (kind === 'fig') item = window.createIsraelFigTreeGroup(sc, seed);
    else if (kind === 'palm' && typeof window.createIsraelDatePalmGroup === 'function') item = window.createIsraelDatePalmGroup(sc, seed);
    else if (kind === 'hyssop' && typeof window.createIsraelHyssopShrubGroup === 'function') item = window.createIsraelHyssopShrubGroup(sc, seed);
    else if (kind === 'anemone' && typeof window.createIsraelAnemoneClusterGroup === 'function') item = window.createIsraelAnemoneClusterGroup(sc, seed);
    else if (typeof window.createIsraelCaperAndGrassGroup === 'function') item = window.createIsraelCaperAndGrassGroup(sc, seed);

    if (!item) return;
    item.position.set(fx, fy - 0.08, fz);
    item.rotation.y = hashF(seed, 19.3) * Math.PI * 2;
    floraGrp.add(item);

    // 플레이어가 걸어 들어갈 수 있는 경계(±104.5) 안쪽 큰 나무만 충돌체 등록
    const isTree = (kind === 'olive' || kind === 'fig' || kind === 'palm');
    if (isTree && Math.abs(fx) <= 104.5 && Math.abs(fz) <= 104.5) {
      colliders.push({ minX: fx - 0.55 * sc, maxX: fx + 0.55 * sc, minZ: fz - 0.55 * sc, maxZ: fz + 0.55 * sc });
    }
  };

  let seedCounter = 700;
  const pickEdgeKind = (r) => {
    if (r < 0.24) return 'olive';
    if (r < 0.40) return 'fig';
    if (r < 0.50) return 'palm';
    if (r < 0.68) return 'hyssop';
    if (r < 0.82) return 'anemone';
    return 'caper';
  };
  const pickTransitionUnderstory = (r) => {
    if (r < 0.36) return 'hyssop';
    if (r < 0.66) return 'anemone';
    if (r < 0.90) return 'caper';
    return 'olive';
  };

  // 1) 동쪽 외곽 산맥 및 전이 능선 (x: 94 ~ 142, z: -132 ~ +132)
  for (let i = 0; i < 64; i++) {
    seedCounter += 13;
    const t = i / 63;
    const fz = -128 + t * 256 + (hashF(i, 3.1) - 0.5) * 9.0;
    const band = (i % 3);
    const fx = (band === 0 ? 96 : band === 1 ? 112 : 128) + (hashF(i, 7.7) - 0.5) * 14.0;
    const kind = (band === 0 && hashF(i, 11.2) > 0.35)
      ? pickTransitionUnderstory(hashF(i, 13.7))
      : pickEdgeKind(hashF(i, 17.9));
    const sc = (kind === 'olive' || kind === 'fig' || kind === 'palm')
      ? 0.92 + hashF(i, 21.1) * 0.42
      : 0.90 + hashF(i, 23.3) * 0.45;
    spawnSpecimen(kind, fx, fz, sc, seedCounter);
  }

  // 2) 북쪽 외곽 산맥 및 전이 능선 (x: -74 ~ +118, z: -96 ~ -142)
  for (let i = 0; i < 52; i++) {
    seedCounter += 17;
    const t = i / 51;
    const fx = -72 + t * 188 + (hashF(i, 4.3) - 0.5) * 8.5;
    const band = (i % 3);
    const fz = (band === 0 ? -97 : band === 1 ? -113 : -130) - (hashF(i, 8.9) - 0.5) * 12.0;
    const kind = (band === 0 && hashF(i, 12.4) > 0.35)
      ? pickTransitionUnderstory(hashF(i, 15.1))
      : pickEdgeKind(hashF(i, 19.7));
    const sc = (kind === 'olive' || kind === 'fig' || kind === 'palm')
      ? 0.92 + hashF(i, 25.3) * 0.42
      : 0.90 + hashF(i, 27.1) * 0.45;
    spawnSpecimen(kind, fx, fz, sc, seedCounter);
  }

  // 3) 남쪽 외곽 산맥 및 전이 능선 (x: -98 ~ +118, z: +96 ~ +142)
  for (let i = 0; i < 54; i++) {
    seedCounter += 19;
    const t = i / 53;
    const fx = -96 + t * 212 + (hashF(i, 5.7) - 0.5) * 8.5;
    const band = (i % 3);
    const fz = (band === 0 ? 97 : band === 1 ? 113 : 130) + (hashF(i, 9.3) - 0.5) * 12.0;
    const kind = (band === 0 && hashF(i, 14.2) > 0.35)
      ? pickTransitionUnderstory(hashF(i, 16.5))
      : pickEdgeKind(hashF(i, 22.9));
    const sc = (kind === 'olive' || kind === 'fig' || kind === 'palm')
      ? 0.92 + hashF(i, 29.1) * 0.42
      : 0.90 + hashF(i, 31.7) * 0.45;
    spawnSpecimen(kind, fx, fz, sc, seedCounter);
  }

  // 4) 내륙 산기슭 경계 언덕 사면 관목·야생화 포켓 보강 (자연스러운 연결감)
  const foothillPockets = [
    [78, -62], [68, -74], [84, -42], [86, 48], [72, 68], [58, 84],
    [-46, 52], [-42, 72], [-76, 56], [-32, -88], [32, -88], [46, -86]
  ];
  foothillPockets.forEach(([px, pz], idx) => {
    for (let k = 0; k < 3; k++) {
      seedCounter += 23;
      const ox = (hashF(idx * 3 + k, 1.7) - 0.5) * 10.5;
      const oz = (hashF(idx * 3 + k, 6.1) - 0.5) * 10.5;
      const kind = pickTransitionUnderstory(hashF(idx + k, 9.8));
      spawnSpecimen(kind, px + ox, pz + oz, 0.88 + hashF(k, idx) * 0.36, seedCounter);
    }
  });

  if (typeof mergeStaticLowPolyGroupToVertexColor === 'function') {
    mergeStaticLowPolyGroupToVertexColor(floraGrp, { registerWall: false, castShadow: true });
  }
  worldGroup.add(floraGrp);
}
// =========================================================================
// [ep4_miracle_world.js - 파트 2/3] 랜드마크(새 예루살렘 성전 단지 통합) · 순차 빛기둥(1→2→3) · 무릎 높이 빛의 원 · 17종 이벤트
// =========================================================================

// -------------------------------------------------------------------------
// 4-0. [리디자인] 소프트 로우 폴리곤 비정형 예루살렘 성전 복합 단지 (z = 46 외곽 성문 ~ z = 72 성소 본관)
//      - 비정형 테이퍼드 석조 매스 · 아치형 성문 · 성가퀴 망루 · 야긴/보아스 기둥 · 붉은 성소 휘장
//      - 정점 색상 병합(Merge)으로 전체 성전 단지 드로우콜을 112+ → ~4개로 최적화!
// -------------------------------------------------------------------------
function buildLowPolyJerusalemTempleComplex() {
  const cSandBase   = '#dfc79e'; // 하단 사암 기단
  const cSandDark   = '#cfa972'; // 단차 몰딩·계단·어두운 사암
  const cCourtWall  = '#ebd6b0'; // 안뜰 성벽·망루
  const cWhiteWarm  = '#f7f4ec'; // 성소 본관 순백색 외벽
  const cWhiteShade = '#e8e0d2'; // 본관 기둥·부조 음영
  const cGoldMain   = '#eab308'; // 황금 문·프리즈·기둥머리
  const cGoldBright = '#facc15'; // 지붕 황금 왕관 뿔·연꽃 주두
  const cBronze     = '#92400e'; // 야긴/보아스 청동 기둥·화로
  const cCrimson    = '#991b1b'; // 성소 붉은 휘장
  const cDarkVoid   = '#23170f'; // 어두운 아치·총안 내부

  const makeOrgBox = (target, w, h, d, col, x, y, z, seed, irr = 0.032, taper = 0.96, seg = 2) => {
    const geo = (typeof createOrganicBoxGeo === 'function')
      ? createOrganicBoxGeo(w, h, d, seed, irr, taper, seg)
      : new THREE.BoxGeometry(w, h, d);
    const m = createLowPolyMesh(geo, col, x, y, z, true);
    target.add(m);
    return m;
  };

  // =======================================================================
  // [A] 남부 초입 외곽 성문 & 전면 양측 계단 성벽 (z = 46 라인)
  //     - 중앙(x = -2.8 ~ +2.8)은 플레이어가 성전 바깥뜰로 걸어 들어가는 개방형 아치 성문 통로
  // =======================================================================
  const gateY = getMiracleOpenWorldGroundHeight(0, 46);
  const outerGateGrp = new THREE.Group();

  // 좌·우 성문 안쪽 비정형 테이퍼드 망루 + 꼭대기 4모서리 성가퀴 + 총안 창
  [-4.0, 4.0].forEach((tx, idx) => {
    makeOrgBox(outerGateGrp, 2.55, 5.2, 2.55, cCourtWall, tx, 2.6, 0, 610 + idx, 0.038, 0.89, 2);
    makeOrgBox(outerGateGrp, 2.75, 0.44, 2.75, cSandDark, tx, 5.34, 0, 614 + idx, 0.04, 0.96, 1);
    [[-0.95, -0.95], [0.95, -0.95], [-0.95, 0.95], [0.95, 0.95]].forEach(([mx, mz], mi) => {
      makeOrgBox(outerGateGrp, 0.46, 0.50, 0.46, cCourtWall, tx + mx, 5.76, mz, 620 + idx * 4 + mi, 0.08, 0.86, 1);
    });
    const slit = createLowPolyMesh(new THREE.BoxGeometry(0.42, 1.05, 2.62), cDarkVoid, tx, 3.25, 0, false);
    outerGateGrp.add(slit);
  });

  // 중앙 개방 통로 상단 아치형 석조 인방보 & 황금 쐐기돌 장식 + 양측 청동 화로
  makeOrgBox(outerGateGrp, 6.0, 0.96, 1.90, cSandDark, 0, 4.55, 0, 630, 0.036, 0.96, 2);
  makeOrgBox(outerGateGrp, 3.3, 0.40, 2.02, cGoldMain, 0, 4.58, 0, 631, 0.04, 0.96, 1);
  [-2.65, 2.65].forEach((bx, bi) => {
    makeOrgBox(outerGateGrp, 0.68, 1.05, 0.68, cSandBase, bx, 0.52, -1.55, 634 + bi, 0.05, 0.92, 1);
    const br = createLowPolyMesh(new THREE.CylinderGeometry(0.32, 0.20, 0.36, 7), cBronze, bx, 1.22, -1.55, false);
    outerGateGrp.add(br);
  });

  // 좌·우 날개 성벽 & 바깥쪽 테이퍼드 망루
  [-7.4, 7.4].forEach((wx, idx) => {
    makeOrgBox(outerGateGrp, 4.5, 3.85, 1.65, cSandBase, wx, 1.92, 0, 640 + idx, 0.034, 0.94, 2);
  });
  [-10.2, 10.2].forEach((ox, idx) => {
    makeOrgBox(outerGateGrp, 2.40, 4.85, 2.40, cCourtWall, ox, 2.42, 0, 645 + idx, 0.038, 0.89, 2);
    makeOrgBox(outerGateGrp, 2.62, 0.42, 2.62, cSandDark, ox, 4.96, 0, 648 + idx, 0.04, 0.96, 1);
    [[-0.88, -0.88], [0.88, -0.88], [-0.88, 0.88], [0.88, 0.88]].forEach(([mx, mz], mi) => {
      makeOrgBox(outerGateGrp, 0.44, 0.48, 0.44, cCourtWall, ox + mx, 5.36, mz, 652 + idx * 4 + mi, 0.08, 0.86, 1);
    });
  });

  // 성벽 위 비정형 성가퀴(Merlons) & 전면 양측 장식 돌계단
  [-8.6, -7.4, -6.2, 6.2, 7.4, 8.6].forEach((bx, bi) => {
    makeOrgBox(outerGateGrp, 0.56, 0.54, 0.64, cSandDark, bx, 4.08, -0.45, 665 + bi, 0.08, 0.88, 1);
  });
  [-7.4, 7.4].forEach((sx, si) => {
    for (let s = 0; s < 4; s++) {
      const sh = 0.45 * (s + 1);
      const sd = 2.8 - s * 0.6;
      makeOrgBox(outerGateGrp, 3.6, sh, sd, s % 2 === 0 ? cSandDark : cSandBase, sx, sh * 0.5, -1.8 + s * 0.3, 675 + si * 4 + s, 0.035, 0.97, 1);
    }
  });

  if (typeof mergeStaticLowPolyGroupToVertexColor === 'function') {
    mergeStaticLowPolyGroupToVertexColor(outerGateGrp, { registerWall: true, castShadow: true });
  }
  outerGateGrp.position.set(0, gateY, 46);
  worldGroup.add(outerGateGrp);

  // 외곽 성문 좌·우 벽체 및 전면 계단 포함 충돌 박스 (중앙 x = -2.6 ~ +2.6 통로만 개방)
  colliders.push(
    { minX: -11.8, maxX: -2.6, minZ: 42.4, maxZ: 47.8 },
    { minX:   2.6, maxX: 11.8, minZ: 42.4, maxZ: 47.8 }
  );

  // =======================================================================
  // [B] 중앙 예루살렘 성전 본관 단지 (x = 0, z = 72)
  // =======================================================================
  const cx = 0, cz = 72;
  const by = getMiracleOpenWorldGroundHeight(cx, cz);
  const templeGrp = new THREE.Group();

  // 1) 비정형 다단 사암 기단 + 3단 손다듬 광장 계단 + 양측 석조 난간 & 청동 화로
  makeOrgBox(templeGrp, 18.2, 1.25, 16.2, cSandBase, 0, 0.62, 0, 701, 0.028, 0.95, 2);
  makeOrgBox(templeGrp, 15.6, 0.56, 13.6, cSandDark, 0, 1.48, 0.1, 702, 0.025, 0.97, 2);
  for (let s = 0; s < 3; s++) {
    const sh = 0.40 * (s + 1);
    const sd = 2.6 - s * 0.68;
    makeOrgBox(templeGrp, 8.0 - s * 0.35, sh, sd, s % 2 === 0 ? cSandDark : cSandBase, 0, sh * 0.5, -8.5 + s * 0.34, 710 + s, 0.035, 0.97, 1);
  }
  [-4.1, 4.1].forEach((sx, idx) => {
    makeOrgBox(templeGrp, 0.75, 1.35, 2.75, cCourtWall, sx, 0.68, -8.4, 715 + idx, 0.04, 0.92, 1);
    const brazier = createLowPolyMesh(new THREE.CylinderGeometry(0.36, 0.22, 0.42, 7), cBronze, sx, 1.56, -9.2, false);
    templeGrp.add(brazier);
  });

  // 2) 비정형 경사(Battered) 안뜰 성벽 + 아치형 외곽 성문 + 성가퀴 돌장식
  const wH = 2.75, wT = 0.85;
  makeOrgBox(templeGrp, 5.5, wH, wT, cCourtWall, -4.7, 1.2 + wH * 0.5, -6.5, 720, 0.032, 0.94, 2);
  makeOrgBox(templeGrp, 5.5, wH, wT, cCourtWall,  4.7, 1.2 + wH * 0.5, -6.5, 721, 0.032, 0.94, 2);
  makeOrgBox(templeGrp, 4.4, 0.92, wT + 0.14, cSandDark, 0, 1.2 + wH - 0.35, -6.5, 722, 0.035, 0.95, 2);
  makeOrgBox(templeGrp, 15.2, wH, wT, cCourtWall, 0, 1.2 + wH * 0.5, 6.5, 723, 0.030, 0.94, 2);
  makeOrgBox(templeGrp, wT, wH, 13.0, cCourtWall, -7.3, 1.2 + wH * 0.5, 0, 724, 0.030, 0.94, 2);
  makeOrgBox(templeGrp, wT, wH, 13.0, cCourtWall,  7.3, 1.2 + wH * 0.5, 0, 725, 0.030, 0.94, 2);

  if (typeof createOrganicArchedEntranceGroup === 'function') {
    const outerArch = createOrganicArchedEntranceGroup(2.15, 2.35, cSandDark, cDarkVoid, cGoldMain, 728);
    outerArch.position.set(0, 1.22, -6.55);
    outerArch.rotation.y = Math.PI;
    templeGrp.add(outerArch);
  }
  [-5.8, -4.4, -3.0, 3.0, 4.4, 5.8].forEach((mx, i) => {
    makeOrgBox(templeGrp, 0.58, 0.48, 0.58, cSandDark, mx, 1.2 + wH + 0.22, -6.5, 730 + i, 0.08, 0.88, 1);
  });
  [-1, 1].forEach(side => {
    [-2.4, 2.4].forEach((dz, i) => {
      makeOrgBox(templeGrp, 0.92, 1.48, 0.95, cGoldMain, side * 7.3, 1.2 + 0.74, dz, 740 + i, 0.03, 0.95, 1);
      makeOrgBox(templeGrp, 1.10, 0.56, 1.35, cSandDark, side * 8.0, 1.2 + 0.28, dz, 745 + i, 0.05, 0.94, 1);
    });
  });

  // 3) 4모서리 비정형 테이퍼드 석조 망루 + 성가퀴 뿔 + 총안 창
  [[-7.3, -6.5], [7.3, -6.5], [-7.3, 6.5], [7.3, 6.5]].forEach(([tx, tz], idx) => {
    makeOrgBox(templeGrp, 2.35, 4.1, 2.35, cCourtWall, tx, 1.2 + 2.05, tz, 750 + idx, 0.038, 0.88, 2);
    makeOrgBox(templeGrp, 2.55, 0.44, 2.55, cSandDark, tx, 1.2 + 4.18, tz, 755 + idx, 0.04, 0.96, 1);
    [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]].forEach(([mx, mz], ci) => {
      makeOrgBox(templeGrp, 0.46, 0.52, 0.46, cCourtWall, tx + mx, 1.2 + 4.62, tz + mz, 760 + idx * 4 + ci, 0.08, 0.85, 1);
    });
    const sl = createLowPolyMesh(new THREE.BoxGeometry(0.42, 0.92, 2.48), cDarkVoid, tx, 1.2 + 2.75, tz, false);
    templeGrp.add(sl);
  });

  // 4) 내부 성문 현관(Nicanor Porch) — 황금 쐐기돌 아치 문 & 반원형 다면체 계단
  makeOrgBox(templeGrp, 5.6, 3.6, 1.75, cCourtWall, 0, 1.65 + 1.80, -2.55, 780, 0.032, 0.94, 2);
  makeOrgBox(templeGrp, 6.1, 0.44, 2.05, cSandDark,  0, 1.65 + 3.72, -2.55, 781, 0.04, 0.96, 1);
  if (typeof createOrganicArchedEntranceGroup === 'function') {
    const innerArch = createOrganicArchedEntranceGroup(2.1, 2.55, cGoldMain, cDarkVoid, cBronze, 782);
    innerArch.position.set(0, 1.65, -3.40);
    innerArch.rotation.y = Math.PI;
    templeGrp.add(innerArch);
  }
  const semi1 = createLowPolyMesh(new THREE.CylinderGeometry(2.05, 2.38, 0.36, 9), cWhiteShade, 0, 1.65 + 0.18, -3.75, true);
  const semi2 = createLowPolyMesh(new THREE.CylinderGeometry(1.42, 1.72, 0.36, 9), cWhiteWarm,  0, 1.65 + 0.52, -3.55, true);
  templeGrp.add(semi1, semi2);

  // 5) 중앙 순백색 성소 본관 (비정형 테이퍼드 석조 매스 + 황금 성소문 + 붉은 성소 휘장 + 야긴·보아스 청동 기둥)
  const sBaseY = 1.68, sH = 8.6;
  makeOrgBox(templeGrp, 11.0, sH, 3.0, cWhiteWarm, 0, sBaseY + sH * 0.5, 0.15, 800, 0.022, 0.96, 2);
  makeOrgBox(templeGrp,  9.6, sH, 6.0, cWhiteWarm, 0, sBaseY + sH * 0.5, 2.85, 801, 0.022, 0.96, 2);

  if (typeof addScatteredIrregularBricksToWall === 'function') {
    addScatteredIrregularBricksToWall(templeGrp, 10.6, sH * 0.85, 2.8, sBaseY + 0.4, '#ebe4d8', '#dfd6c5', 805, 0, 0.15);
  }

  // 정면 대형 성소 포털 + 황금 문 + 붉은 성소 휘장
  makeOrgBox(templeGrp, 4.5, 6.2, 0.50, cWhiteShade, 0, sBaseY + 3.1, -1.28, 810, 0.03, 0.97, 2);
  makeOrgBox(templeGrp, 4.8, 0.42, 0.62, cGoldMain,  0, sBaseY + 6.32, -1.32, 814, 0.04, 0.96, 1);
  const voidBox    = createLowPolyMesh(new THREE.BoxGeometry(3.2, 5.3, 0.18), cDarkVoid, 0, sBaseY + 2.65, -1.42, false);
  const goldDoor   = createLowPolyMesh(createOrganicBoxGeo(1.75, 4.95, 0.18, 813, 0.03, 0.98, 2), cGoldMain, 0, sBaseY + 2.52, -1.52, true);
  const curtainL   = createLowPolyMesh(createOrganicBoxGeo(0.76, 5.15, 0.24, 811, 0.08, 0.92, 2), cCrimson, -1.16, sBaseY + 2.62, -1.60, true);
  const curtainR   = createLowPolyMesh(createOrganicBoxGeo(0.76, 5.15, 0.24, 812, 0.08, 0.92, 2), cCrimson,  1.16, sBaseY + 2.62, -1.60, true);
  const curtainTop = createLowPolyMesh(createOrganicBoxGeo(3.25, 0.56, 0.26, 815, 0.06, 0.96, 2), cCrimson, 0, sBaseY + 5.12, -1.62, true);
  templeGrp.add(voidBox, goldDoor, curtainL, curtainR, curtainTop);

  // 야긴과 보아스 (성소 문 양옆 독립 8각 청동 원기둥 & 황금 연꽃 기둥머리)
  [-2.45, 2.45].forEach(px => {
    const colBase  = createLowPolyMesh(new THREE.CylinderGeometry(0.46, 0.54, 0.55, 8), cSandDark, px, sBaseY + 0.28, -1.68, true);
    const colShaft = createLowPolyMesh(new THREE.CylinderGeometry(0.32, 0.38, 5.4, 8), cBronze, px, sBaseY + 3.2, -1.68, true);
    const colCap   = createLowPolyMesh(new THREE.CylinderGeometry(0.56, 0.34, 0.72, 8), cGoldBright, px, sBaseY + 6.15, -1.68, true);
    templeGrp.add(colBase, colShaft, colCap);
  });

  // 정면·측면·후면 6각 다면체 조각 기둥(Pilasters) & 황금 기둥머리
  const pilH = sH - 1.4;
  [-4.5, -3.2, 3.2, 4.5].forEach((px, i) => {
    const pil = createLowPolyMesh(new THREE.CylinderGeometry(0.28, 0.34, pilH, 6), cWhiteShade, px, sBaseY + pilH * 0.5, -1.34, true);
    makeOrgBox(templeGrp, 0.78, 0.44, 0.52, cGoldMain, px, sBaseY + pilH + 0.16, -1.34, 820 + i, 0.06, 1.08, 1);
    templeGrp.add(pil);
  });
  [-1, 1].forEach(side => {
    [0.6, 2.1, 3.6, 5.1].forEach((pz, i) => {
      const px = side * 4.80;
      const pil = createLowPolyMesh(new THREE.CylinderGeometry(0.26, 0.32, pilH, 6), cWhiteShade, px, sBaseY + pilH * 0.5, pz, true);
      makeOrgBox(templeGrp, 0.52, 0.44, 0.72, cGoldMain, px, sBaseY + pilH + 0.16, pz, 830 + i, 0.06, 1.08, 1);
      templeGrp.add(pil);
    });
  });
  [-3.4, -1.1, 1.1, 3.4].forEach((px, i) => {
    const pil = createLowPolyMesh(new THREE.CylinderGeometry(0.26, 0.32, pilH, 6), cWhiteShade, px, sBaseY + pilH * 0.5, 5.82, true);
    makeOrgBox(templeGrp, 0.72, 0.44, 0.50, cGoldMain, px, sBaseY + pilH + 0.16, 5.82, 840 + i, 0.06, 1.08, 1);
    templeGrp.add(pil);
  });

  // 6) 상단 비정형 이중 황금 프리즈 & 다면체 황금 왕관 뿔
  const topY = sBaseY + sH;
  makeOrgBox(templeGrp, 11.4, 0.58, 3.35, cGoldMain,   0, topY - 0.55, 0.15, 850, 0.03, 1.02, 2);
  makeOrgBox(templeGrp, 10.0, 0.58, 6.25, cGoldMain,   0, topY - 0.55, 2.85, 851, 0.03, 1.02, 2);
  makeOrgBox(templeGrp, 11.6, 0.48, 3.55, cWhiteShade, 0, topY + 0.06, 0.15, 852, 0.03, 1.01, 2);
  makeOrgBox(templeGrp, 10.2, 0.48, 6.45, cWhiteShade, 0, topY + 0.06, 2.85, 853, 0.03, 1.01, 2);
  makeOrgBox(templeGrp, 11.7, 0.34, 3.65, cGoldBright, 0, topY + 0.45, 0.15, 854, 0.03, 1.00, 1);
  makeOrgBox(templeGrp, 10.3, 0.34, 6.55, cGoldBright, 0, topY + 0.45, 2.85, 855, 0.03, 1.00, 1);

  const spikeGeo = new THREE.ConeGeometry(0.28, 0.80, 4);
  const addSpike = (sx, sz) => {
    const sp = createLowPolyMesh(spikeGeo, cGoldBright, sx, topY + 0.98, sz, false);
    sp.rotation.y = Math.PI / 4;
    templeGrp.add(sp);
  };
  for (let i = -5; i <= 5; i++) addSpike(i * 1.02, -1.48);
  for (let i = -4; i <= 4; i++) addSpike(i * 1.08,  5.82);
  for (let i = 0; i <= 5; i++) {
    const sz = -0.8 + i * 1.26;
    const sx = (i <= 1) ? 5.52 : 4.90;
    addSpike(-sx, sz);
    addSpike( sx, sz);
  }

  // 성전 본관 전체를 2개 드로우콜(불투명 석조/황금 1 + 화로 발광 1)로 정점 색상 병합!
  if (typeof mergeStaticLowPolyGroupToVertexColor === 'function') {
    mergeStaticLowPolyGroupToVertexColor(templeGrp, { registerWall: true, castShadow: true });
  }

  templeGrp.position.set(cx, by, cz);
  worldGroup.add(templeGrp);

  // 성전 기단 가장자리(좌·우 측면 계단 포함) 및 전면 3단 돌계단 관통 완전 차단
  colliders.push(
    {
      minX: cx - 9.3,
      maxX: cx + 9.3,
      minZ: cz - 8.2,
      maxZ: cz + 8.3
    },
    {
      minX: cx - 4.2,
      maxX: cx + 4.2,
      minZ: cz - 10.0,
      maxZ: cz - 7.9
    }
  );

  return templeGrp;
}

// -------------------------------------------------------------------------
// 4. 오픈월드 3대 권역 핵심 성경 랜드마크 & 외곽 오병이어 전망 언덕 배치
// -------------------------------------------------------------------------
function buildMiracleRegionalLandmarks() {
  // [A. 북부 갈릴리 권역]
  // 1) 가나 혼인잔치 집 (x = -4, z = -78)
  addLowPolyVillageHouse(-4, -78, 9.2, 4.2, 7.2, '#f5e6c8', '#d97706', false, 1, 0);
  worldGroup.add(
    createLowPolyMesh(new THREE.BoxGeometry(8.6, 0.22, 4.2), '#b45309', -4, 3.5, -72.2),
    createLowPolyMesh(new THREE.CylinderGeometry(0.15, 0.16, 3.5, 6), '#6b4226', -7.8, 1.75, -70.4),
    createLowPolyMesh(new THREE.CylinderGeometry(0.15, 0.16, 3.5, 6), '#6b4226', -0.2, 1.75, -70.4)
  );

  // 2) 가버나움 중풍병자 치유 집 — 기존 외관 유지 + 열린 정면 문 안으로 예수님과 사람들이 보임 + 옥상 외벽 돌계단 (x = 22, z = -52)
  if (typeof addCapernaumParalyticHouse === 'function') {
    window.miracleParalyticHouseInfo = addCapernaumParalyticHouse(22, -52);
  } else {
    addLowPolyVillageHouse(22, -52, 8.8, 4.0, 7.0, '#ead7b7', '#c89654', true, 0, 0);
  }

  // 3) 동북쪽 외곽 '오병이어 전망 언덕' (x = 88, z = -82, 높이 약 14.5m — 마을과 바다가 한눈에 내려다보이는 언덕)
  const bethTopY = getMiracleOpenWorldGroundHeight(88, -82);
  addLowPolyRock(88, -86, 2.2, 0.65, '#cbd5e1', true);
  for (let i = 0; i < 10; i++) {
    const ang = (i / 10) * Math.PI * 1.2 + Math.PI * 0.4;
    const rad = 7.0 + (i % 2) * 3.5;
    const px = 88 + Math.cos(ang) * rad;
    const pz = -82 + Math.sin(ang) * rad;
    const py = getMiracleOpenWorldGroundHeight(px, pz);
    const listener = createLowPolyPersonMesh(i % 3 === 0 ? 'woman' : (i % 4 === 0 ? 'child' : 'villager'), i + 30);
    listener.position.set(px, py, pz);
    listener.lookAt(88, bethTopY + 1.0, -82);
    worldGroup.add(listener);
  }

  // [B. 중부 사마리아 · 여리고 · 광야 권역]
  // 1) 수가성 야곱의 우물 (x = -32, z = -12) — 비정형 자연석 테두리·비정형 소프트 로우폴리 목재 기둥/지붕·물레·두레박·토기 항아리
  const wellY = getMiracleOpenWorldGroundHeight(-32, -12);
  const wellGrp = new THREE.Group();
  const wellHash = (n) => {
    const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
  const wellStoneCols = ['#cbd5e1', '#b7c0cc', '#a8a29e', '#d6cfc2', '#94a3b8', '#bfb7ab'];
  const mkWellStone = (w, h, d, sd) => (typeof createIrregularFieldstoneGeo === 'function')
    ? createIrregularFieldstoneGeo(w, h, d, sd)
    : new THREE.DodecahedronGeometry(Math.max(w, d) * 0.45, 0);

  // 내부 어두운 석조 우물 내벽(약간 비정형 9각) + 수면
  const wellInner = createLowPolyMesh(new THREE.CylinderGeometry(1.66, 1.82, 0.92, 9), '#64748b', 0, 0.42, 0, false);
  wellInner.scale.set(1.04, 1.0, 0.96);
  const wellWater = createLowPolyMesh(new THREE.CylinderGeometry(1.56, 1.56, 0.08, 9), '#0284c7', 0, 0.88, 0, false);
  wellWater.scale.set(1.03, 1.0, 0.95);
  const wellRipple = createLowPolyMesh(new THREE.RingGeometry(0.45, 0.78, 7), '#38bdf8', 0.12, 0.94, -0.08, false);
  wellRipple.rotation.x = -Math.PI / 2;
  wellGrp.add(wellInner, wellWater, wellRipple);

  // 우물 외벽 & 상단 테두리: 2단으로 엇갈리게 쌓은 비정형 다면체 자연석 링(약간 비정형 타원형 궤적)
  for (let row = 0; row < 2; row++) {
    const cnt = row === 0 ? 11 : 10;
    const baseY = row === 0 ? 0.30 : 0.84;
    const radBase = row === 0 ? 2.02 : 1.94;
    for (let s = 0; s < cnt; s++) {
      const sd = 910 + row * 47 + s * 13;
      const a = ((s + (row === 1 ? 0.48 : 0)) / cnt) * Math.PI * 2 + (wellHash(sd) - 0.5) * 0.10;
      const organicEllip = 1.0 + Math.cos(a * 2 + 0.4) * 0.055 + Math.sin(a * 3 - 0.3) * 0.04;
      const r = radBase * organicEllip + (wellHash(sd + 1) - 0.5) * 0.14;
      const sw = (row === 0 ? 0.88 : 0.84) + wellHash(sd + 2) * 0.28;
      const sh = (row === 0 ? 0.58 : 0.46) + wellHash(sd + 3) * 0.16;
      const sdDepth = (row === 0 ? 0.72 : 0.66) + wellHash(sd + 4) * 0.18;
      const col = wellStoneCols[Math.floor(wellHash(sd + 5) * wellStoneCols.length) % wellStoneCols.length];
      const stone = createLowPolyMesh(mkWellStone(sw, sh, sdDepth, sd), col, Math.cos(a) * r, baseY + (wellHash(sd + 6) - 0.5) * 0.06, Math.sin(a) * r, true);
      stone.rotation.set(
        (wellHash(sd + 7) - 0.5) * 0.12,
        -a + Math.PI * 0.5 + (wellHash(sd + 8) - 0.5) * 0.22,
        (wellHash(sd + 9) - 0.5) * 0.10
      );
      wellGrp.add(stone);
    }
  }
  // 우물 바닥 주위 비정형 디딤돌 & 이끼 돌 5개
  [[-2.25, 0.95], [2.15, -1.05], [-0.45, 2.38], [1.42, 1.92], [-1.72, -1.65]].forEach(([cx, cz], ci) => {
    const cob = createLowPolyMesh(mkWellStone(0.82, 0.24, 0.66, 970 + ci * 11), ci % 2 === 0 ? '#a8a29e' : '#b7c0cc', cx, 0.08, cz, false);
    cob.rotation.y = ci * 0.9;
    wellGrp.add(cob);
  });

  // 비정형 소프트 로우폴리 나무 기둥(뿌리 플레어 + 자연스러운 휘어짐) & 사선 버팀목(까치발) & 물레
  const mkWellTimber = (p1, p2, rB, rT, col, sd, flare = false) => {
    if (typeof window.createOrganicWoodSegmentMesh === 'function') {
      return window.createOrganicWoodSegmentMesh(p1, p2, rB, rT, col, sd, 0.12, flare);
    }
    const dir = new THREE.Vector3().subVectors(p2, p1);
    const len = dir.length();
    const g = new THREE.CylinderGeometry(rT, rB, len, 6);
    g.translate(0, len * 0.5, 0);
    const m = createLowPolyMesh(g, col, p1.x, p1.y, p1.z, true);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    return m;
  };

  const postL = mkWellTimber(new THREE.Vector3(-1.74, 0.55, 0.04), new THREE.Vector3(-1.66, 3.36, -0.03), 0.19, 0.13, '#5c3114', 921, true);
  const postR = mkWellTimber(new THREE.Vector3( 1.74, 0.55, -0.04), new THREE.Vector3( 1.66, 3.36, 0.03), 0.19, 0.13, '#653818', 927, true);
  const braceL = mkWellTimber(new THREE.Vector3(-1.68, 2.52, 0), new THREE.Vector3(-1.02, 3.18, 0), 0.10, 0.08, '#6e3f1d', 931, false);
  const braceR = mkWellTimber(new THREE.Vector3( 1.68, 2.52, 0), new THREE.Vector3( 1.02, 3.18, 0), 0.10, 0.08, '#6e3f1d', 937, false);
  const tieBeam = mkWellTimber(new THREE.Vector3(-1.95, 3.18, 0), new THREE.Vector3(1.95, 3.18, 0), 0.12, 0.11, '#582e12', 941, false);
  const roller = mkWellTimber(new THREE.Vector3(-1.72, 2.48, 0), new THREE.Vector3(1.72, 2.48, 0), 0.13, 0.12, '#854d0e', 947, false);
  const crankHandle = mkWellTimber(new THREE.Vector3(1.88, 2.48, 0), new THREE.Vector3(2.14, 2.74, 0.16), 0.055, 0.045, '#451a03', 953, false);
  const rope = mkWellTimber(new THREE.Vector3(0, 2.45, 0), new THREE.Vector3(0.04, 1.56, 0.02), 0.038, 0.032, '#d6b685', 959, false);
  const bucket = createLowPolyMesh(new THREE.CylinderGeometry(0.28, 0.21, 0.38, 7), '#92400e', 0.04, 1.42, 0.02, true);
  const bucketRim = createLowPolyMesh(new THREE.TorusGeometry(0.26, 0.028, 4, 7), '#5c2d0c', 0.04, 1.58, 0.02, false);
  bucketRim.rotation.x = Math.PI / 2;

  // 비정형 소프트 로우폴리 우물 박공 지붕 (서까래 + 각기 미세하게 엇갈린 비정형 목재 널빤지/지붕판 + 울퉁불퉁 용마루 통나무)
  const roofGrp = new THREE.Group();
  const ridgeLog = mkWellTimber(new THREE.Vector3(-2.22, 3.92, 0), new THREE.Vector3(2.22, 3.92, 0), 0.13, 0.12, '#4e270e', 963, false);
  roofGrp.add(ridgeLog);

  const plankCols = ['#9a4f25', '#8a431d', '#a85a2d', '#7c3a17', '#924a22'];
  const mkOrgBox = (w, h, d, sd) => (typeof createOrganicBoxGeo === 'function')
    ? createOrganicBoxGeo(w, h, d, sd, 0.09, 0.94, 1)
    : new THREE.BoxGeometry(w, h, d);
  [-1, 1].forEach((sideZ, si) => {
    // 3개 비정형 서까래
    [-1.62, 0, 1.62].forEach((rx, ri) => {
      const rafter = mkWellTimber(
        new THREE.Vector3(rx, 3.90, 0),
        new THREE.Vector3(rx, 3.04, sideZ * 1.48),
        0.085, 0.072, '#5c2d0c', 971 + si * 20 + ri * 7, false
      );
      roofGrp.add(rafter);
    });
    // 각 지붕면을 6장의 비정형 소프트 로우폴리 목재 지붕판으로 분할 배치(자연스러운 요철 & 처마 라인)
    const plankCount = 6;
    const totalSpan = 4.25;
    const pw = totalSpan / plankCount;
    for (let k = 0; k < plankCount; k++) {
      const sd = 980 + si * 50 + k * 9;
      const px = -totalSpan * 0.5 + (k + 0.5) * pw;
      const lenVar = 1.64 + (wellHash(sd) - 0.5) * 0.18;
      const thkVar = 0.13 + wellHash(sd + 1) * 0.05;
      const col = plankCols[(k + si * 2) % plankCols.length];
      const plank = createLowPolyMesh(mkOrgBox(pw + 0.06, thkVar, lenVar, sd), col, px, 3.52 + (wellHash(sd + 2) - 0.5) * 0.04, sideZ * 0.72, true);
      plank.rotation.x = sideZ * (0.50 + (wellHash(sd + 3) - 0.5) * 0.05);
      plank.rotation.z = (wellHash(sd + 4) - 0.5) * 0.04;
      roofGrp.add(plank);
    }
  });
  // 양쪽 박공 삼각 나무판(비정형 삼각 장식)
  [-1.66, 1.66].forEach((gx, gi) => {
    const gable = createLowPolyMesh(new THREE.ConeGeometry(0.95, 0.72, 4), '#783c1c', gx, 3.54, 0, false);
    gable.rotation.y = Math.PI * 0.25;
    gable.scale.set(0.18, 1.0, 1.35);
    roofGrp.add(gable);
  });

  const wellJar = createOrganicAmphoraProp(0.95, '#b86232', '#8f471e');
  wellJar.position.set(1.98, 0, 1.48);
  const wellJar2 = createOrganicAmphoraProp(0.72, '#c97844', '#8f471e');
  wellJar2.position.set(-1.95, 0, 1.56);
  wellJar2.rotation.z = 0.14;
  wellGrp.add(postL, postR, braceL, braceR, tieBeam, roller, crankHandle, rope, bucket, bucketRim, roofGrp, wellJar, wellJar2);
  wellGrp.position.set(-32, wellY, -12);
  worldGroup.add(wellGrp);
  colliders.push({ minX: -34.5, maxX: -29.5, minZ: -14.5, maxZ: -9.5 });

  // 2) 여리고 거리와 삭개오의 돌무화과나무 숲(6그루 군락 — 여러 나무 중 랜덤한 나무 위에 삭개오가 숨어 있음!)
  window.miracleZacchaeusGroveTrees = [];
  const zacTrees = [
    { x: 31, z: -11, sc: 1.48 },
    { x: 39, z: -12, sc: 1.56 },
    { x: 45, z:  -5, sc: 1.50 },
    { x: 38, z:  -2, sc: 1.60 },
    { x: 30, z:   1, sc: 1.45 },
    { x: 43, z:   4, sc: 1.52 }
  ];
  zacTrees.forEach(zt => {
    createLowPolySycamoreTree(zt.x, zt.z, zt.sc);
    window.miracleZacchaeusGroveTrees.push({ x: zt.x, z: zt.z, scale: zt.sc });
  });

  // 3) 선한 사마리아인의 여리고 주막(실내 진입 가능 + 병상과 다친 이웃 배치) (x = 24, z = 24)
  if (typeof addWalkableJerichoInn === 'function') {
    window.miracleJerichoInnInfo = addWalkableJerichoInn(24, 24);
  } else {
    addLowPolyVillageHouse(24, 24, 8.4, 4.0, 6.6, '#f2e3c9', '#ea580c', false, 2, 0);
  }

  // 3-B) [기본맵 vs 멀티플레이 맵 구분]
  // - 온라인 멀티플레이 맵: 넓은 초대형 다단 반석(63, 18)에 돌20+나무20 협동 큰 집 건설
  // - 개인 기본맵: 원래대로 작은 반석 영역(57, 21)에 보통 집 건설
  if (window.isMiracleMultiplayerMode && typeof createWideBedrockFormation === 'function') {
    window.miracleCurrentBedrockMesh = createWideBedrockFormation(63, 18);
  } else if (typeof createCompactBedrockFormation === 'function') {
    window.miracleCurrentBedrockMesh = createCompactBedrockFormation(57, 21);
  } else if (typeof createWideBedrockFormation === 'function') {
    window.miracleCurrentBedrockMesh = createWideBedrockFormation(57, 21);
  }

  // [C. 남부 예루살렘 · 성전 · 다락방 · 골고다 · 빈 무덤 · 감람산 권역]
  // 1) & 2) 예루살렘 외곽 계단 성문(z = 46) + 예루살렘 성전 복합 단지(z = 72) 통합 빌드
  buildLowPolyJerusalemTempleComplex();
  if (Array.isArray(window.miracleBuildingBounds)) {
    window.miracleBuildingBounds.push(
      { minX: -12.5, maxX: 12.5, minZ: 42.0, maxZ: 48.2, cx: 0, cz: 46 },  // 외곽 성문
      { minX: -11.5, maxX: 11.5, minZ: 60.5, maxZ: 82.0, cx: 0, cz: 72 },  // 성전 본관
      { minX: -34.6, maxX: -29.4, minZ: -14.6, maxZ: -9.4, cx: -32, cz: -12 }, // 야곱의 우물
      { minX: -30.5, maxX: -13.2, minZ: 87.0, maxZ: 98.0, cx: -22, cz: 92 }    // 동산 무덤 (좌·우 가장자리 바위 포함)
    );
  }

  // 3) 마가의 다락방 2층 실내 진입 가능 가옥 (x = -24, z = 58)
  if (typeof addWalkableUpperRoomHouse === 'function') {
    window.miracleUpperRoomInfo = addWalkableUpperRoomHouse(-24, 58);
  } else {
    addLowPolyVillageHouse(-24, 58, 8.8, 4.3, 7.0, '#f2e3c9', '#c89654', true, 1, 0);
  }

  // 4) 넓어진 골고다 언덕(x = -62, z = 78) 위의 비정형 소프트 로우폴리 세 십자가 — 스테이지 3 클리어 후 등장!
  const isStage3Cleared = Boolean(miracleMainStagesCleared[3] || miracleMainStagesCleared[4] || miracleIsPostResurrection);
  miracleGolgothaCrossesGroup = new THREE.Group();
  [[-62, 78, 1.38, 0.0], [-68.5, 79.5, 1.05, 0.22], [-55.5, 79.5, 1.05, -0.20]].forEach(([cx, cz, sc, ry], ci) => {
    const cy = getMiracleOpenWorldGroundHeight(cx, cz);
    if (typeof createOrganicLowPolyCrossMesh === 'function') {
      const cMesh = createOrganicLowPolyCrossMesh(sc, { seed: 310 + ci * 27, withBase: true, withPlaque: ci === 0 });
      cMesh.position.set(cx, cy - 0.14 * sc, cz);
      cMesh.rotation.y = ry;
      miracleGolgothaCrossesGroup.add(cMesh);
    } else {
      const mound = createLowPolyMesh(new THREE.DodecahedronGeometry(1.05 * sc, 0), '#78716c', cx, cy + 0.14 * sc, cz);
      mound.scale.set(1.30, 0.58, 1.30);
      const vBeam = createLowPolyMesh(new THREE.CylinderGeometry(0.20 * sc, 0.24 * sc, 5.7 * sc, 6), '#5c2d0c', cx, cy + 2.55 * sc, cz);
      const hBeam = createLowPolyMesh(new THREE.CylinderGeometry(0.16 * sc, 0.16 * sc, 3.2 * sc, 6), '#5c2d0c', cx, cy + 3.85 * sc, cz);
      hBeam.rotation.z = Math.PI / 2;
      miracleGolgothaCrossesGroup.add(mound, vBeam, hBeam);
    }
  });
  miracleGolgothaCrossesGroup.visible = isStage3Cleared;
  worldGroup.add(miracleGolgothaCrossesGroup);

  // 5) 동산의 빈 무덤 — 디테일 비정형 소프트 로우폴리 석회암 바위굴·아치 문틀·내부 돌침상/세마포·굴려진 비정형 돌문 (x = -22, z = 92)
  //    - 스테이지 3 클리어 전까지는 풀·덤불 위장막으로 가려지고, 클리어 시 돌 무덤이 공개됨!
  const tombY = getMiracleOpenWorldGroundHeight(-22, 92);

  miracleOpenWorldTombGroup = new THREE.Group();
  if (typeof createDetailedOrganicTombGroup === 'function') {
    const tombDetail = createDetailedOrganicTombGroup({ scale: 0.96, openGlow: false, seed: 740 });
    tombDetail.position.set(-21.8, tombY - 0.08, 90.2);
    tombDetail.rotation.y = Math.PI; // 입구가 북쪽 마을 길(-Z) 방향을 바라보도록 배치
    miracleOpenWorldTombGroup.add(tombDetail);
    miracleOpenWorldTombGroup.userData.tombStyle = tombDetail.userData.tombStyle;
    if (Array.isArray(tombDetail.userData.wallRocks)) {
      wallMeshes.push(...tombDetail.userData.wallRocks);
    }
  } else {
    const tombMoundBack = createLowPolyMesh(new THREE.DodecahedronGeometry(4.8, 0), '#94a3b8', -22, tombY + 2.4, 94.0);
    tombMoundBack.scale.set(1.42, 0.90, 0.85);
    miracleOpenWorldTombGroup.add(tombMoundBack);
    wallMeshes.push(tombMoundBack);
  }
  miracleOpenWorldTombGroup.visible = isStage3Cleared;
  worldGroup.add(miracleOpenWorldTombGroup);
  // 무덤 본체·뒷절벽·좌우 가장자리 바위(leftFlank/rightFlank)·문틀 기둥·굴려진 돌문 전체를 빈틈없이 차단하여 가장자리 바위 통과 원천 봉쇄!
  colliders.push(
    { minX: -29.8, maxX: -13.8, minZ: 89.2, maxZ: 97.6 }, // 무덤 본체 및 뒷절벽 바위 전체
    { minX: -19.8, maxX: -13.4, minZ: 87.5, maxZ: 93.8 }, // 동쪽 가장자리 바위(leftFlank/jambL)
    { minX: -30.2, maxX: -23.1, minZ: 87.3, maxZ: 93.8 }  // 서쪽 가장자리 바위(rightFlank/jambR) 및 굴려진 돌문
  );

  // 무덤 위장용 우거진 풀·관목·야생 수풀 (스테이지 3 클리어 전까지 무덤 자리에 배치)
  miracleTombCoverGroup = new THREE.Group();
  const coverBushes = [
    { x: -22.0, z: 91.5, r: 4.1, sx: 1.50, sy: 0.92, sz: 1.25, c: '#4d7c0f' },
    { x: -25.4, z: 90.2, r: 3.1, sx: 1.15, sy: 0.95, sz: 1.15, c: '#5c8d36' },
    { x: -18.6, z: 90.0, r: 3.2, sx: 1.20, sy: 0.95, sz: 1.15, c: '#3f6212' },
    { x: -21.8, z: 87.8, r: 2.6, sx: 1.35, sy: 0.88, sz: 1.05, c: '#65a30d' },
    { x: -18.5, z: 87.9, r: 2.1, sx: 1.15, sy: 0.85, sz: 1.05, c: '#527324' },
    { x: -24.5, z: 88.2, r: 2.2, sx: 1.10, sy: 0.85, sz: 1.00, c: '#4d7c0f' },
    { x: -22.0, z: 94.8, r: 3.3, sx: 1.30, sy: 0.92, sz: 1.10, c: '#3f6212' }
  ];
  coverBushes.forEach((b, idx) => {
    const gy = getMiracleOpenWorldGroundHeight(b.x, b.z);
    const bush = createLowPolyMesh(new THREE.IcosahedronGeometry(b.r, 1), b.c, b.x, gy + b.r * b.sy * 0.52, b.z, true);
    bush.scale.set(b.sx, b.sy, b.sz);
    bush.rotation.set(idx * 0.3, idx * 0.9, 0);
    miracleTombCoverGroup.add(bush);
  });
  // 앞쪽을 자연스럽게 가리는 소프트 로우폴리 큰 풀포기 다발
  for (let g = 0; g < 16; g++) {
    const gx = -26.8 + (g % 8) * 1.45 + Math.sin(g * 2.3) * 0.35;
    const gz = 86.6 + Math.floor(g / 8) * 1.7 + Math.cos(g * 1.9) * 0.35;
    const gy = getMiracleOpenWorldGroundHeight(gx, gz);
    const grassBlade = createLowPolyMesh(
      new THREE.ConeGeometry(0.45 + (g % 3) * 0.12, 1.35 + (g % 2) * 0.45, 4),
      g % 2 === 0 ? '#65a30d' : '#4d7c0f',
      gx, gy + 0.65, gz, false
    );
    grassBlade.rotation.set((g % 3 - 1) * 0.18, g * 0.7, ((g + 1) % 3 - 1) * 0.20);
    miracleTombCoverGroup.add(grassBlade);
  }
  miracleTombCoverGroup.visible = !isStage3Cleared;
  worldGroup.add(miracleTombCoverGroup);

  // 6) 외곽 숲, 하늘 구름 22개, 그리고 하늘을 자유롭게 날아다니는 소프트 로우폴리 새 16마리 배치
  for (let i = 0; i < 48; i++) {
    const ang = (i / 48) * Math.PI * 2;
    const rad = 100 - (i % 3) * 4.0;
    const tx = Math.cos(ang) * rad;
    const tz = Math.sin(ang) * rad;
    if (tx < -76) continue;
    // 예수님 동산 무덤(-22, 91) 반경 13m, 씨 뿌리기 산기슭 밭 반경 9.5m, 확장 반석 부지(63, 18) 반경 13m 이내 스킵
    if (Math.hypot(tx + 22, tz - 91) < 13.0) continue;
    if (isNearSowerFarmPlot(tx, tz, 9.5)) continue;
    if (isNearMustardPlot(tx, tz, 6.2)) continue;
    if (Math.hypot(tx - 63, tz - 18) < 13.0) continue;
    let outerTree = null;
    if (i % 3 === 0) outerTree = addLowPolyCypressPineTree(tx, tz, 1.15, true);
    else if (i % 4 === 0) outerTree = addLowPolyPalmTree(tx, tz, 1.15, true);
    else outerTree = addLowPolyOliveTree(tx, tz, 1.2, true);
    if (outerTree) registerMiracleHarvestNode('wood', tx, tz, outerTree, 1.15);
  }

  for (let c = 0; c < 22; c++) {
    const cx = -105 + (c * 37) % 210;
    const cz = -105 + (c * 53) % 210;
    const cl = createLowPolyCloudGroup(1.15 + (c % 3) * 0.28, false);
    cl.position.set(cx, 28 + (c % 4) * 2.5, cz);
    worldGroup.add(cl);
    miracleAmbientProps.push({ kind: 'cloud', mesh: cl, baseX: cx, speed: 0.35 + (c % 3) * 0.12, keepAtNight: (c % 3 === 0) });
  }

  window.miracleSkyBirds = [];
  if (typeof window.createFlyingBirdMesh === 'function') {
    const birdPalettes = [
      ['#f8fafc', '#cbd5e1'], // 흰 갈매기/비둘기
      ['#f1f5f9', '#94a3b8'], // 회백색 바닷새
      ['#e2e8f0', '#64748b'], // 연회색 산새
      ['#f8fafc', '#475569']  // 제비/갈매기
    ];
    for (let b = 0; b < 16; b++) {
      const pal = birdPalettes[b % birdPalettes.length];
      const sc = 0.85 + (b % 4) * 0.18;
      const mesh = window.createFlyingBirdMesh(pal[0], pal[1], sc);
      // 갈릴리 바다, 마을 상공, 예루살렘 성전, 감람산 등 전역에 고르게 비행 궤도 분배
      const cx = -65 + ((b * 43) % 140);
      const cz = -78 + ((b * 59) % 156);
      const radX = 18 + (b % 5) * 7.5;
      const radZ = 15 + ((b + 2) % 4) * 8.0;
      const baseY = 15.5 + (b % 5) * 3.2;
      const dir = (b % 2 === 0) ? 1 : -1;
      const speed = (0.20 + (b % 4) * 0.055) * dir;
      const angle = (b / 16) * Math.PI * 2;
      mesh.position.set(cx + Math.cos(angle) * radX, baseY, cz + Math.sin(angle) * radZ);
      worldGroup.add(mesh);
      window.miracleSkyBirds.push({
        mesh,
        cx,
        cz,
        radX,
        radZ,
        baseY,
        angle,
        speed,
        bobAmp: 0.8 + (b % 3) * 0.45,
        flapSpeed: 8.5 + (b % 4) * 1.4,
        phase: b * 1.17
      });
    }
  }
}

// -------------------------------------------------------------------------
// 5. 메인 스테이지 순차 빛기둥(1→2→3→4) 및 비유·사건 무릎 높이 빛의 원 마커 생성기
// -------------------------------------------------------------------------
function createMiracleSpotMarker(x, z, colorHex, iconTitle, npcPreset = 'disciple', useTallBeam = true) {
  const by = getMiracleOpenWorldGroundHeight(x, z);
  const grp = new THREE.Group();

  let beam = null;
  let ring = null;
  let kneeAura = null;

  if (useTallBeam) {
    const beamGeo = new THREE.CylinderGeometry(1.08, 1.08, 48, 16, 1, true);
    beamGeo.translate(0, 24, 0);
    const beamMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.30,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.set(0, 0.02, 0);

    ring = new THREE.Mesh(
      new THREE.RingGeometry(1.35, 1.95, 24),
      new THREE.MeshBasicMaterial({ color: colorHex, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(0, 0.06, 0);
    grp.add(beam, ring);
  } else {
    if (typeof createIrregularKneeLightAura === 'function') {
      kneeAura = createIrregularKneeLightAura(colorHex, Math.abs(Math.round(x * 7 + z * 13)));
      grp.add(kneeAura);
    } else {
      ring = new THREE.Mesh(
        new THREE.RingGeometry(1.15, 1.65, 20),
        new THREE.MeshBasicMaterial({ color: colorHex, side: THREE.DoubleSide })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(0, 0.06, 0);
      grp.add(ring);
    }
  }

  const guideNpc = createLowPolyPersonMesh(npcPreset, Math.abs(Math.round(x + z)));
  guideNpc.position.set(0, 0, 0);
  grp.add(guideNpc);

  grp.position.set(x, by, z);
  worldGroup.add(grp);

  const lbl = createWorldLabel(iconTitle);
  lbl.style.opacity = '0';

  return {
    group: grp,
    beam,
    ring,
    kneeAura,
    npcMesh: guideNpc,
    pos: new THREE.Vector3(x, by + 0.5, z),
    label: lbl
  };
}

function getNextActiveMainStageNumber() {
  if (!miracleMainStagesCleared[1]) return 1;
  if (!miracleMainStagesCleared[2]) return 2;
  if (!miracleMainStagesCleared[3]) return 3;
  if (!miracleMainStagesCleared[4]) return 4;
  return 5;
}

function syncMiracleMainStageSequentialBeams() {
  const allUnlocked = (typeof isMiracleAllStagesUnlocked === 'function' && isMiracleAllStagesUnlocked());
  const activeStageNum = getNextActiveMainStageNumber();
  const missionRunning = Boolean(miracleActiveFieldEvent);

  miracleStageSpots.forEach(sp => {
    const isCleared = Boolean(miracleMainStagesCleared[sp.stageNum]);
    sp.cleared = isCleared;

    const isCurrentTurn = (sp.stageNum === activeStageNum);
    const isAccessible = allUnlocked || isCurrentTurn || isCleared;

    if (sp.beam) {
      sp.beam.visible = !missionRunning && (isCurrentTurn || (allUnlocked && sp.stageNum === 5));
    }
    if (sp.ring && sp.ring.material) {
      sp.ring.material.color.setHex(isCleared ? 0x10b981 : (isAccessible ? sp.color : 0x64748b));
      sp.ring.visible = !missionRunning && isAccessible;
    }
    if (sp.label) {
      if (sp.stageNum === 5 && miracleAscensionSeen) {
        sp.label.innerHTML = '☁️ [감람산 언덕] 승천하신 주님을 바라보는 제자들 (다가가면 엔딩 세상)';
      } else if (isCleared) {
        sp.label.innerHTML = `✅ ${sp.title}${allUnlocked ? ' (자유 입장)' : ''}`;
      } else if (isAccessible) {
        sp.label.innerHTML = `✨ ${sp.title}`;
      } else {
        sp.label.innerHTML = `🔒 ${sp.title} (스테이지 ${sp.stageNum - 1} 완료 후 진행)`;
      }
    }
  });

  const isStage3Cleared = Boolean(allUnlocked || miracleMainStagesCleared[3] || miracleMainStagesCleared[4] || miracleIsPostResurrection);
  if (miracleGolgothaCrossesGroup) {
    // 십자가 언덕의 세 십자가는 십자가 스테이지(스테이지 3) 해결 후에만 등장!
    miracleGolgothaCrossesGroup.visible = isStage3Cleared;
  }
  if (miracleOpenWorldTombGroup) {
    miracleOpenWorldTombGroup.visible = isStage3Cleared;
  }
  if (miracleTombCoverGroup) {
    miracleTombCoverGroup.visible = !isStage3Cleared;
  }
}

// 미션 진행 중에는 다른 모든 미션·스테이지의 발 주변 원형(kneeAura/ring/beam)을 일시 숨기고 종료 시 복원
function syncMiracleSpotMarkersForActiveMission() {
  const missionRunning = Boolean(miracleActiveFieldEvent);
  const isNight = Boolean(window.MiracleDayNight && typeof window.MiracleDayNight.isNight === 'function' && window.MiracleDayNight.isNight());
  syncMiracleMainStageSequentialBeams();
  miracleEventSpots.forEach(ev => {
    const allowedTime = !ev.isNightOnly || isNight;
    if (ev.group) ev.group.visible = allowedTime;
    const showMarker = !missionRunning && allowedTime;
    if (ev.kneeAura) ev.kneeAura.visible = showMarker;
    if (ev.ring) ev.ring.visible = showMarker;
    if (ev.beam) ev.beam.visible = showMarker;
  });
}

function spawnMiracleMainStageSpots() {
  miracleStageSpots = [];
  const allUnlocked = (typeof isMiracleAllStagesUnlocked === 'function' && isMiracleAllStagesUnlocked());

  const mainConfigs = [
    {
      stageNum: 1,
      subModeKey: 'main1_galilee',
      x: -82, z: -68,
      color: 0x38bdf8,
      npcPreset: 'disciple',
      title: '⛵ [메인 스테이지 1] 갈릴리 바다: 물고기 잡기와 폭풍우',
      introSpeaker: '어부 시몬 베드로',
      introText: '"선생님께서 배에 오르셨네! 함께 갈릴리 바다 깊은 곳으로 나가 그물을 내리고 항해를 시작해 볼까?"',
      audioUrl: 'assets/voice/ep4_stage01_petro01.mp3',
      greetingText: '"할렐루야! 그때 거센 폭풍우를 말씀 한마디로 잠잠하게 하신 예수님의 권능은 정말 놀라웠어! 다음 여정도 힘내서 다녀오게!"',
      greetingAudioUrl: 'assets/voice/ep4_stage01_petro02.mp3',
      verseAudioUrl: 'assets/voice/ep4_stage01_bible.mp3'
    },
    {
      stageNum: 2,
      subModeKey: 'main2_loaves',
      x: 88, z: -82,
      color: 0xfacc15,
      npcPreset: 'disciple',
      title: '🍞 [메인 스테이지 2] 오병이어 사건: 마을이 내려다보이는 벳새다 언덕',
      introSpeaker: '제자 빌립과 안드레',
      introText: '"이 높은 언덕 위에서 내려다보니 마을과 갈릴리 바다가 한눈에 보이는구나! 예수님의 말씀을 들으러 모인 큰 무리를 먹이시는 오병이어 기적을 시작해 볼까?"',
      audioUrl: 'assets/voice/ep4_stage02_philip01.mp3',
      greetingText: '"반가워! 어린아이의 작은 도시락 하나로 오천 명이 배불리 먹고 열두 광주리나 남았던 기적을 우리 모두 잊지 못할 거야!"',
      greetingAudioUrl: 'assets/voice/ep4_stage02_philip02.mp3',
      verseAudioUrl: 'assets/voice/ep4_stage02_bible.mp3'
    },
    {
      stageNum: 3,
      subModeKey: 'main3_cross',
      x: -36, z: 68,
      color: 0xf43f5e,
      npcPreset: 'soldier',
      title: '✝️ [메인 스테이지 3] 십자가 사건: 골고다로 가는 길',
      introSpeaker: '예루살렘 여인들',
      introText: '"예수님께서 무거운 십자가를 지고 골고다 언덕으로 가고 계셔! 어서 그분이 가시는 길을 찾아가 도와드리자!"',
      audioUrl: 'assets/voice/ep4_stage03_girls01.mp3',
      greetingText: '"구레네 시몬처럼 예수님과 함께 골고다 언덕까지 십자가를 지고 올라가 주어서 정말 고마워요! 우리를 향한 예수님의 크신 사랑을 기억해요."',
      greetingAudioUrl: 'assets/voice/ep4_stage03_girls02.mp3',
      verseAudioUrl: 'assets/voice/ep4_stage03_bible.mp3'
    },
    {
      stageNum: 4,
      subModeKey: 'main4_tomb',
      x: -16, z: 84,
      color: 0xa855f7,
      npcPreset: 'woman',
      title: '🌅 [메인 스테이지 4] 빈 무덤 찾기: 안식일 후 첫날 새벽',
      introSpeaker: '막달라 마리아',
      introText: '"안식일이 지나고 새벽이 밝았어요! 마을 사람들의 단서를 따라 예수님이 묻히신 동산 무덤을 찾아가요!"',
      audioUrl: 'assets/voice/ep4_stage04_maria01.mp3',
      greetingText: '"예수님께서 말씀하시던 대로 다시 살아나셨어요! 이제 부활하신 예수님의 증언들을 만나고 동남쪽 감람산으로 올라가 보세요!"',
      greetingAudioUrl: 'assets/voice/ep4_stage04_maria02.mp3',
      verseAudioUrl: 'assets/voice/ep4_stage04_bible.mp3'
    }
  ];

  mainConfigs.forEach(cfg => {
    const cleared = Boolean(miracleMainStagesCleared[cfg.stageNum]);
    const marker = createMiracleSpotMarker(
      cfg.x,
      cfg.z,
      cleared ? 0x22c55e : cfg.color,
      cfg.title,
      cfg.npcPreset,
      true
    );
    miracleStageSpots.push({
      ...cfg,
      ...marker,
      cleared,
      _requireLeaveZone: false
    });
  });

  if (miracleIsPostResurrection || allUnlocked) {
    const isPostAsc = Boolean(miracleAscensionSeen);
    const ascMarker = createMiracleSpotMarker(
      88, 74, 0xfef08a,
      isPostAsc
        ? '☁️ [감람산 언덕] 승천하신 주님을 바라보는 제자들 (다가가면 엔딩 세상)'
        : '👑 [최종 엔딩] 감람산 : 예수님의 승천과 재림의 약속',
      isPostAsc ? 'disciple' : 'jesus',
      true
    );
    // 승천 이후 다시 감람산 언덕에 올라오면 예수님은 없고 제자들이 모여 하늘을 바라보는 모습 표현!
    if (isPostAsc && ascMarker.group) {
      if (ascMarker.npcMesh && ascMarker.npcMesh.userData && ascMarker.npcMesh.userData.head) {
        ascMarker.npcMesh.userData.head.rotation.x = -0.38;
      }
      [[-1.8, -0.7, 0.3], [1.8, -0.6, -0.35], [-0.9, 1.5, 0.15], [1.1, 1.4, -0.2]].forEach(([dx, dz, ry], di) => {
        const dMesh = createLowPolyPersonMesh('disciple', 50 + di);
        dMesh.position.set(dx, 0, dz);
        dMesh.rotation.y = ry;
        if (dMesh.userData && dMesh.userData.head) dMesh.userData.head.rotation.x = -0.35;
        ascMarker.group.add(dMesh);
      });
    }

    miracleStageSpots.push({
      stageNum: 5,
      subModeKey: 'ascension',
      x: 88, z: 74,
      color: 0xfef08a,
      title: isPostAsc
        ? '☁️ [감람산 언덕] 승천하신 주님을 바라보는 제자들'
        : '👑 [최종 엔딩] 감람산 : 예수님의 승천과 재림의 약속',
      introSpeaker: isPostAsc ? '감람산의 제자들' : '부활하신 예수님',
      introText: isPostAsc
        ? '"예수님께서 구름을 타고 하늘로 승천하셨어요! 천사들이 \'하늘로 가심을 본 그대로 다시 오시리라\'고 약속해 주었답니다. 승천 이후의 감람산 엔딩 세상으로 가보시겠어요?"'
        : '"하늘과 땅의 모든 권세를 내게 주셨으니, 그러므로 너희는 가서 모든 민족을 제자로 삼으라! 볼지어다 내가 세상 끝날까지 너희와 항상 함께 있으리라!"',
      audioUrl: isPostAsc
        ? 'assets/voice/ep4_stage05_diciples.mp3'
        : 'assets/voice/ep4_stage05_jesus01.mp3',
      greetingText: '"볼지어다 내가 세상 끝날까지 너희와 항상 함께 있으리라!"',
      greetingAudioUrl: 'assets/voice/ep4_stage05_greeting.mp3',
      ...ascMarker,
      cleared: false,
      _requireLeaveZone: false
    });
  }

  syncMiracleMainStageSequentialBeams();
}

function spawnMiracleRumorNpcs() {
  miracleRumorNpcs = [];

  const rumorConfigs = [
    { x: -12, z: -64, cat: 'rumor',      nbId: 'rumor_cana',      speaker: '가나 마을 이웃',   text: '"가나 혼인잔치에 포도주가 떨어졌대! 북쪽 잔치집 하인들에게 물항아리 6개를 날라주면 놀라운 일을 볼 수 있을 거야!"' },
    { x:  14, z: -46, cat: 'rumor',      nbId: 'rumor_paralytic', speaker: '가버나움 청년',    text: '"가버나움 집에 사람이 가득해서 들어갈 수가 없대! 네 친구가 중풍병자 들것을 메고 지붕 계단으로 올라가려나 봐!"' },
    { x: -48, z: -66, cat: 'eyewitness', nbId: 'rumor_storm',     speaker: '갈릴리 늙은 어부', text: '"내가 서쪽 바닷가에서 똑똑히 봤소! 그분이 바람과 바다를 꾸짖으시니 거센 풍랑이 즉시 잠잠해졌다오!"' },
    { x:  48, z: -62, cat: 'rumor',      nbId: 'rumor_loaves',    speaker: '벳새다 목동',      text: '"동북쪽 저 높은 오병이어 언덕 위로 올라가 봐! 마을 전체가 내려다보이는 곳에서 보리떡 다섯 개와 물고기 두 마리로 오천 명을 먹이셨대!"' },
    { x:   4, z: -34, cat: 'word',       nbId: 'wd_john316',      speaker: '갈릴리 서기관',    text: '"예수님께서 밤에 찾아온 니고데모에게 \'하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니...\'라고 말씀하셨다네."' },
    { x:  28, z: -30, cat: 'rumor',      nbId: 'rumor_children',  speaker: '갈릴리 어머니',    text: '"예수님이 아이들을 안으시고 축복해 주신대요! 동쪽 올리브 숲 근처의 아이들을 예수님께 안내해 주세요!"' },

    { x: -18, z: -12, cat: 'eyewitness', nbId: 'rumor_well',      speaker: '수가성 마을 주민', text: '"우물가에 갔던 여인이 물동이를 버려두고 달려와서 \'내가 행한 모든 일을 알아맞히신 그리스도를 보라!\'고 외쳤어요!"' },
    { x:  24, z:  -4, cat: 'rumor',      nbId: 'rumor_zacchaeus', speaker: '여리고 상인',      text: '"세리장 삭개오가 키가 작아서 예수님을 보려고 동쪽 길가 커다란 뽕나무(돌무화과나무) 위로 올라갔대!"' },
    { x:   8, z:  16, cat: 'rumor',      nbId: 'rumor_samaritan', speaker: '광야 순례자',      text: '"여리고로 내려가는 바위 길가에 다친 여행자가 쓰러져 있대! 누가 진정한 이웃이 되어 도와줄 수 있을까?"' },
    { x: -24, z:  22, cat: 'eyewitness', nbId: 'rumor_lepers',    speaker: '사마리아 나그네',  text: '"열 명의 나병환자가 고침을 받았는데, 오직 사마리아 사람 한 명만 돌아와 큰 소리로 하나님께 감사드렸대요!"' },
    { x: -10, z:   4, cat: 'word',       nbId: 'wd_matt1128',     speaker: '쉼을 얻은 여행자', text: '"예수님이 \'수고하고 무거운 짐 진 자들아 다 내게로 오라 내가 너희를 쉬게 하리라\' 하신 말씀이 제 마음에 큰 위로가 되었어요."' },

    { x:   0, z:  34, cat: 'rumor',      nbId: 'rumor_palm',      speaker: '예루살렘 청년',    text: '"예수님이 어린 나귀를 타고 성문으로 오신대요! 길가의 종려나무 가지를 모아 환영 행렬 길을 준비해요!"' },
    { x:  12, z:  60, cat: 'eyewitness', nbId: 'rumor_widow',     speaker: '성전 문지기',      text: '"성전 헌금함 앞에서 예수님이 부자들보다 두 렙돈을 넣은 가난한 과부를 가장 크게 칭찬하셨소!"' },
    { x: -14, z:  54, cat: 'word',       nbId: 'wd_john146',      speaker: '다락방 제자',      text: '"예수님께서 저희의 발을 직접 씻겨 주시며 \'내가 곧 길이요 진리요 생명이니\'라고 말씀하셨습니다."' },
    // 성전 전면 계단 앞 바깥뜰 광장(x: -5.5, z: 59.5)에 배치하여 성전 기단과 겹치지 않게 보정
    { x: -5.5, z: 59.5, cat: 'rumor',    nbId: 'rumor_identity',  speaker: '예루살렘 순례객',  text: '"어떤 사람은 세례 요한이나 선지자라 하지만, 베드로는 \'주는 그리스도시요 살아 계신 하나님의 아들이시니이다\'라고 고백했대!"',
      quiz: {
        q: '시몬 베드로가 고백한 예수님은 누구이신가요?',
        opts: ['그리스도시요 살아 계신 하나님의 아들', '로마 제국의 장군', '애굽의 지혜로운 학자'],
        ans: 0
      }
    }
  ];

  const getRumorNpcLabelHtml = (cat, speaker, collected) => {
    if (collected) {
      if (cat === 'word') return `✅ 수집한 말씀 · ${speaker}`;
      if (cat === 'eyewitness') return `✅ 수집한 목격담 · ${speaker}`;
      return `✅ 수집한 소문 · ${speaker}`;
    }
    const catBadge = cat === 'eyewitness' ? '🔵목격담' : (cat === 'word' ? '🟣말씀' : '🟡소문');
    return `${catBadge} · ${speaker}`;
  };

  rumorConfigs.forEach((rc, idx) => {
    const by = getMiracleOpenWorldGroundHeight(rc.x, rc.z);
    const mesh = createLowPolyPersonMesh('villager', idx);
    mesh.position.set(rc.x, by, rc.z);
    worldGroup.add(mesh);

    const alreadyCollected = Boolean(rc.nbId && miracleCollectedIds.has(rc.nbId));
    const lbl = createWorldLabel(getRumorNpcLabelHtml(rc.cat, rc.speaker, alreadyCollected));
    lbl.style.opacity = '0';

    miracleRumorNpcs.push({
      ...rc,
      mesh,
      homeX: rc.x,
      homeZ: rc.z,
      targetX: rc.x + (Math.random() - 0.5) * 6.0,
      targetZ: rc.z + (Math.random() - 0.5) * 6.0,
      radius: 5.5,
      speed: 1.75,
      heading: Math.random() * Math.PI * 2,
      waitTimer: (idx % 3) * 0.7,
      pos: new THREE.Vector3(rc.x, by + 0.5, rc.z),
      talked: alreadyCollected,
      _prompted: 0,
      _requireLeaveZone: false,
      phase: idx * 1.1,
      label: lbl
    });
  });
}

// -------------------------------------------------------------------------
// 6. 선택형 이벤트(10종) + 비유 미니게임(4종) + 부활 이후 이벤트(3종) 카탈로그
// -------------------------------------------------------------------------
function getMiracleOptionalEventsCatalog() {
  return [
    {
      id: 'ev_cana',
      category: 'story',
      title: '🏺 ① 가나 혼인잔치: 물 채운 항아리 6개 찾기',
      x: -4, z: -69,
      color: 0xe11d48,
      npcPreset: 'woman',
      speaker: '혼인잔치 하인',
      introText: '"잔치 포도주가 다 떨어졌어요! 오픈월드 곳곳에 흩어져 있는 [물이 채워진 돌항아리] 6개를 찾아 잔치집으로 가져다주세요!"',
      greetingText: '"샬롬! 아까 물이 채워진 돌항아리 6개를 모아 주신 덕분에 잔치에 가장 향기로운 포도주가 넘쳐났답니다. 정말 고마워요!"',
      missionType: 'collect_deliver',
      itemStyle: 'water_amphora',
      spawnMode: 'openworld_wide',
      allowRooftopSpawn: true,
      itemCount: 6,
      itemColor: '#38bdf8',
      itemLabel: '🏺 물 채운 돌항아리',
      targetOffset: { x: 0, z: -2.2 },
      targetLabel: '🏺 가나 잔치집 (물항아리 전달)',
      completeSpeaker: '연회장',
      completeText: '"놀랍도다! 하인들이 떠다 준 물이 가장 향기롭고 좋은 포도주로 변하였도다! 예수님이 첫 표적을 행하시매 제자들이 그를 믿으니라." (요 2:1~11)',
      unlockNotebookIds: ['rumor_cana', 'mir_cana'],
      quiz: {
        q: '가나 혼인잔치에서 하인들이 예수님의 말씀에 순종해 돌항아리에 채운 것은 무엇인가요?',
        opts: ['맑은 물', '감람유 기름', '달콤한 꿀'],
        ans: 0
      }
    },
    {
      id: 'ev_paralytic',
      category: 'story',
      title: '🛏️ ② 네 친구와 중풍병자: 지붕 들것 협동 운반',
      x: 22, z: -43,
      color: 0x0284c7,
      npcPreset: 'disciple',
      speaker: '중풍병자의 네 친구',
      introText: '"열린 문 너머로 예수님이 말씀을 가르치고 계시지만 사람들이 가득해 들어갈 수가 없어요! 먼저 올라가 옥상에서 기다리는 두 친구에게 갈 수 있도록, 저희 두 사람과 함께 들것을 메고 오른쪽 외벽 돌계단으로 올라가 주세요!"',
      greetingText: '"평안하신가요! 함께 지붕 위로 들것을 옮겨 주신 덕분에 우리 친구가 죄 사함을 받고 건강하게 걸어서 집으로 돌아갔어요!"',
      missionType: 'escort_guide',
      escortType: 'stretcher',
      noRooftopJesus: true,
      goalPos: { x: 22, y: 4.0, z: -52 },
      goalLabel: '🏠 가버나움 집 평지붕 위 (지붕 뚫고 내리기)',
      completeSpeaker: '예수님',
      completeText: '"예수께서 그들의 믿음을 보시고 중풍병자에게 이르시되 작은 자야 네 죄 사함을 받았느니라... 일어나 네 상을 가지고 집으로 가라!" (막 2:1~12)',
      unlockNotebookIds: ['rumor_paralytic', 'mir_paralytic'],
      quiz: {
        q: '지붕을 뜯고 중풍병자를 달아 내린 친구들에게서 예수님은 무엇을 보셨나요?',
        opts: ['그들의 믿음', '그들의 많은 재물', '그들의 화려한 옷'],
        ans: 0
      }
    },
    {
      id: 'ev_children',
      category: 'story',
      title: '👧 ④ 어린이들을 축복하시는 예수님: 나무 아래 예수님께 인도',
      x: 34, z: -38,
      color: 0xfacc15,
      npcPreset: 'child',
      speaker: '갈릴리 어린이들',
      introText: '"예수님을 꼭 만나고 싶은데 길을 모르겠어요! 멀리 있는 나무 아래에서 기다리시는 예수님께 우리를 인도해 주세요!"',
      greetingText: '"안녕! 예수님께서 우리를 품에 안아 주시고 머리 위에 손을 얹어 축복해 주셨어! 정말 따뜻하고 기뻤어!"',
      missionType: 'escort_guide',
      escortType: 'children',
      randomTreeGoal: true,
      goalPos: { x: 42, y: 0, z: -48 },
      goalLabel: '✨ 나무 아래 계신 예수님',
      completeSpeaker: '예수님',
      completeText: '"어린아이들이 내게 오는 것을 용납하고 금하지 말라 하나님의 나라가 이런 자의 것이니라 하시고 그들을 안고 안수하사 축복하시니라." (막 10:13~16)',
      unlockNotebookIds: ['rumor_children', 'wd_mark1014'],
      quiz: {
        q: '예수님은 어린아이들이 다가올 때 어떻게 하셨나요?',
        opts: ['안으시고 안수하며 축복해 주셨다', '어른이 될 때까지 오지 말라고 하셨다', '멀리서만 바라보게 하셨다'],
        ans: 0
      }
    },
    {
      id: 'ev_well',
      category: 'eyewitness',
      title: '⛲ ③ 수가성 우물가의 여인: 기쁜 소식 전파 동행',
      x: -29, z: -12,
      color: 0x0ea5e9,
      npcPreset: 'woman',
      speaker: '수가성 여인',
      introText: '"우물가에서 메시아를 만났어요! 제가 마을 사람 3명에게 달려가 기쁜 소식을 전할 때 너무 멀어지지 않게 꼭 따라와 주세요!"',
      greetingText: '"반가워요! 예수님께서 주신 영생하도록 솟아나는 샘물 덕분에 제 마음의 목마름이 완전히 사라졌답니다!"',
      missionType: 'follow_messenger',
      itemCount: 3,
      maxFollowDist: 15.0,
      completeSpeaker: '수가성 마을 주민들',
      completeText: '"이제 우리가 믿는 것은 네 말로 인함이 아니니 이는 우리가 친히 듣고 그가 참으로 세상의 구주신 줄 앎이라!" (요 4:4~42)',
      unlockNotebookIds: ['rumor_well', 'wd_john414'],
      quiz: {
        q: '예수님이 우물가의 여인에게 주겠다고 하신 것은 무엇인가요?',
        opts: ['영원히 목마르지 아니하는 생수', '황금 두루마리', '은화 서른 개'],
        ans: 0
      }
    },
    {
      id: 'ev_zacchaeus',
      category: 'story',
      title: '🌳 ⑤ 삭개오를 찾아라: 여리고 나무 숲 속 삭개오 찾기',
      x: 27, z: -5,
      color: 0x8b5cf6,
      npcPreset: 'villager',
      speaker: '여리고 주민',
      introText: '"예수님과 많은 군중이 여리고 나무 숲길로 오셨어요! 키 작은 세리장 삭개오가 돌무화과나무 위에 올라가 있으니 숲을 살펴 찾아보세요!"',
      greetingText: '"할렐루야! 예수님께서 오늘 삭개오의 집에 머무시며 구원이 이 집에 이르렀다고 선포하셨어요!"',
      missionType: 'find_observe',
      zacchaeusGrove: true,
      findTargetPos: { x: 38, y: 3.0, z: -2 },
      findTargetLabel: '🌳 나무 위에 올라간 삭개오 발견!',
      completeSpeaker: '예수님과 삭개오',
      completeText: '"오늘 이 집은 구원 받았습니다. 오늘 당신의 집에서 머물겠어요" (눅 19:1~10)',
      unlockNotebookIds: ['rumor_zacchaeus', 'wd_luke1910'],
      quiz: {
        q: '예수님을 만난 삭개오는 어떻게 변화되었나요?',
        opts: ['소유의 절반을 가난한 자들에게 나누고 잘못을 갚겠다고 회개했다', '더 많은 세금을 거두기로 했다', '문을 잠그고 숨었다'],
        ans: 0
      }
    },
    {
      id: 'ev_samaritan',
      category: 'parable',
      title: '🏺 ⑥ [비유 체험] 선한 사마리아인: 치료 꾸러미 찾아 여관에 전달',
      x: 15, z: 20,
      color: 0x10b981,
      npcPreset: 'disciple',
      speaker: '선한 사마리아인 (예수님의 비유 체험)',
      introText: '"[📖 예수님이 들려주신 비유] 다친 이웃을 여관 안 병상에 눕혀 두었어요! 마을 곳곳과 건물 2층을 돌아다니며 기름·포도주·붕대가 담긴 치료 꾸러미 3개를 찾아 여관 안 병상 옆으로 가져다주세요!"',
      greetingText: '"평안하시길! 다친 이웃을 불쌍히 여기고 자비를 베푸는 사람이야말로 예수님이 말씀하신 진정한 이웃이랍니다!"',
      missionType: 'collect_deliver',
      itemStyle: 'first_aid',
      spawnMode: 'town_random',
      allowRooftopSpawn: true,
      deliverToInnBed: true,
      itemCount: 3,
      itemColor: '#d97706',
      itemLabel: '🏺 치료용 기름·붕대 꾸러미',
      targetOffset: { x: 10.1, z: 3.6 },
      targetLabel: '🛏️ 여관 안 병상 (다친 이웃 치료)',
      completeSpeaker: '예수님',
      completeText: '"네 생각에는 이 세 사람 중에 누가 강도 만난 자의 이웃이 되겠느냐? 이르되 자비를 베푼 자니이다. 예수께서 이르시되 가서 너도 이와 같이 하라!" (눅 10:25~37)',
      unlockNotebookIds: ['rumor_samaritan', 'wd_luke1037'],
      quiz: {
        q: '선한 사마리아인의 비유에서 강도 만난 사람의 진정한 이웃은 누구였나요?',
        opts: ['불쌍히 여겨 상처를 치료하고 돌보아 준 사마리아 사람', '그냥 지나쳐 간 제사장', '모른 척 피해서 간 레위인'],
        ans: 0
      }
    },
    {
      id: 'ev_lepers',
      category: 'story',
      title: '🙏 ⑦ 열 명의 나병환자: 마을 골목에 숨은 감사한 한 사람',
      x: -28, z: 16,
      color: 0xf59e0b,
      npcPreset: 'disciple',
      speaker: '고침 받은 나병환자',
      introText: '"예수님께서 저희 열 명을 모두 고쳐 주셨어요! 그중 하나님께 영광을 돌리러 돌아온 사마리아인이 마을 건물 사이 어딘가에 있다고 해요! 찾아가 보세요!"',
      greetingText: '"감사합니다! 예수님께 돌아와 하나님께 영광을 돌릴 때 \'네 믿음이 너를 구원하였다\'는 귀한 말씀을 들었답니다!"',
      missionType: 'find_observe',
      alleyRandomAura: true,
      findTargetPos: { x: -18, y: 0, z: 22 },
      findTargetLabel: '🙏 돌아와 감사드린 사마리아인',
      completeSpeaker: '예수님',
      completeText: '"열 사람이 다 깨끗함을 받지 아니하였느냐 그 아홉은 어디 있느냐? 이 이방인 외에는 하나님께 영광을 돌리러 돌아온 자가 없느냐 하시고, 네 믿음이 너를 구원하였느니라 하시니라." (눅 17:11~19)',
      unlockNotebookIds: ['rumor_lepers', 'mir_lepers'],
      quiz: {
        q: '고침 받은 열 명의 나병환자 중 몇 명이 예수님께 돌아와 감사했나요?',
        opts: ['오직 한 명 (사마리아 사람)', '열 명 모두', '다섯 명'],
        ans: 0
      }
    },
    {
      id: 'ev_palm',
      category: 'story',
      title: '🌿 ⑧ 호산나 입성: 산 쪽 종려나무 가지 주워 성문 앞에 깔기',
      x: 0, z: 39,
      color: 0x22c55e,
      npcPreset: 'disciple',
      speaker: '예루살렘 환영 무리',
      introText: '"예수님이 나귀를 타시고 예루살렘 성문으로 오십니다! 동·서쪽 산기슭에 있는 종려나무 가지 5개를 주워와 예루살렘 성문 앞 길에 펼쳐 깔아주세요!"',
      greetingText: '"호산나 다윗의 자손이여! 주의 이름으로 오시는 평화의 왕을 함께 맞이할 수 있어 참 기뻤습니다!"',
      missionType: 'collect_deliver',
      itemStyle: 'palm_branch',
      spawnMode: 'mountain_slopes',
      multiRandomLaySpots: true,
      itemCount: 5,
      itemColor: '#22c55e',
      itemLabel: '🌿 종려나무 가지',
      targetOffset: { x: 0, z: 3.5 },
      targetLabel: '🚪 예루살렘 성문 앞 길 (종려가지 깔기)',
      completeSpeaker: '예루살렘 군중',
      completeText: '"호산나 다윗의 자손이여! 찬송하리로다 주의 이름으로 오시는 이여 가장 높은 곳에서 호산나 하더라!" (마 21:1~11)',
      unlockNotebookIds: ['rumor_palm'],
      quiz: {
        q: '예수님이 예루살렘에 입성하실 때 군중들이 길에 펴고 흔든 나뭇가지는 무엇인가요?',
        opts: ['종려나무 가지', '단풍나무 가지', '소나무 가지'],
        ans: 0
      }
    },
    {
      id: 'ev_washfeet',
      category: 'story',
      title: '🧺 ⑨ 섬김의 다락방: 수건 찾아 2층 다락방에 갖다두기',
      x: -24, z: 51,
      color: 0x38bdf8,
      npcPreset: 'disciple',
      speaker: '사도 요한',
      introText: '"예수님께서 제자들의 발을 씻겨 주시려고 해요! 주변 건물 사이에 흩어진 [깨끗한 아마포 수건] 3개를 찾아 저 건물 외벽 계단으로 올라가 2층 다락방 안에 갖다두어 주세요!"',
      greetingText: '"예수님께서 친히 우리의 발을 씻겨 주시며 보여 주신 겸손과 사랑의 새 계명을 평생 마음에 새기겠습니다!"',
      missionType: 'collect_deliver',
      itemStyle: 'folded_towel',
      spawnMode: 'nearby_buildings',
      allowRooftopSpawn: true,
      deliverToUpperRoom: true,
      itemCount: 3,
      itemColor: '#f8fafc',
      itemLabel: '🧺 깨끗한 아마포 수건',
      targetOffset: { x: 0, z: 7.0 },
      targetLabel: '🏠 2층 다락방 안 물대야 옆 (수건 두기)',
      completeSpeaker: '예수님',
      completeText: '"내가 주와 또는 선생이 되어 너희 발을 씻었으니 너희도 서로 발을 씻어 주는 것이 옳으니라. 내가 너희에게 행한 것 같이 너희도 행하게 하려 하여 본을 보였노라." (요 13:1~15)',
      unlockNotebookIds: ['wd_john1314'],
      quiz: {
        q: '예수님이 제자들의 발을 직접 씻겨 주신 이유는 무엇인가요?',
        opts: ['서로 사랑하고 겸손히 섬기는 본을 보여 주시기 위해', '발이 가장 더러웠기 때문에', '신발을 새로 사주시기 위해'],
        ans: 0
      }
    },
    {
      id: 'ev_widow',
      category: 'story',
      title: '🪙 ⑩ 두 렙돈을 드린 과부: 성전 헌금함 관찰',
      x: 10.4, z: 61.0,
      color: 0xeab308,
      npcPreset: 'woman',
      speaker: '성전 앞 제자',
      introText: '"예수님께서 성전 헌금함 맞은편에 앉아 사람들이 어떻게 헌금하는지 보고 계세요. 성전 동쪽 헌금함 앞에 다가가 가난한 과부가 두 렙돈을 넣는 장면을 지켜보세요!"',
      greetingText: '"하나님은 겉모습이나 금액의 많고 적음이 아니라, 마음을 다해 드리는 중심을 가장 귀하게 보신다는 것을 배웠어요!"',
      missionType: 'find_observe',
      widowCutscene: true,
      findTargetPos: { x: 11.8, y: 0, z: 69.5 },
      findTargetLabel: '🪙 성전 헌금함 앞 가난한 과부 (다가가서 관찰)',
      completeSpeaker: '예수님',
      completeText: '"내가 진실로 너희에게 이르노니 이 가난한 과부는 헌금함에 넣는 모든 사람보다 많이 넣었도다. 그들은 다 풍족한 중에서 넣었거니와 이 과부는 그 가난한 중에서 자기의 모든 소유 곧 생활비 전부를 넣었느니라." (막 12:41~44)',
      unlockNotebookIds: ['rumor_widow', 'wd_mark1243'],
      quiz: {
        q: '예수님이 두 렙돈(작은 동전 두 개)을 넣은 과부를 칭찬하신 이유는 무엇인가요?',
        opts: ['금액의 크기보다 마음을 다해 자신의 전부를 드렸기 때문에', '동전이 황금으로 만들어졌기 때문에', '가장 큰 소리로 자랑하며 넣었기 때문에'],
        ans: 0
      }
    },
    {
      id: 'par_sower',
      category: 'parable',
      title: '🌱 [비유 미니게임 1] 씨 뿌리는 사람: 좋은 땅 만들기',
      x: -46, z: -28,
      color: 0x4ade80,
      npcPreset: 'disciple',
      speaker: '예수님의 비유 이야기',
      introText: '"[📖 예수님이 들려주신 비유] 산 근처의 거친 밭을 부드러운 좋은 땅(옥토)으로 가꿔 볼까요? 먼저 산기슭 밭 구역을 찾고 → 씨앗 바구니를 모은 뒤 → 돌과 가시덤불·잡초를 제거하고 땅을 고르게 정돈해 씨앗을 뿌려 보세요!"',
      greetingText: '"반가워요! 정성껏 가꾼 좋은 땅에 뿌린 씨앗이 햇살을 받으며 무럭무럭 자라나 30배, 60배, 100배의 열매를 맺고 있어요!"',
      missionType: 'sower_farm',
      itemStyle: 'seed_basket',
      allowRooftopSpawn: true,
      itemCount: 3,
      itemColor: '#fde047',
      itemLabel: '🧺 말씀의 씨앗 바구니',
      targetLabel: '🟫 산기슭 좋은 땅 밭',
      completeSpeaker: '예수님',
      completeText: '"좋은 땅에 뿌려졌다는 것은 말씀을 듣고 깨닫는 자니 결실하여 어떤 것은 백 배, 어떤 것은 육십 배, 어떤 것은 삼십 배가 되느니라!" (마 13:1~9)',
      unlockNotebookIds: ['par_sower'],
      quiz: {
        q: '씨 뿌리는 비유에서 30배, 60배, 100배의 열매를 맺은 땅은 어떤 땅인가요?',
        opts: ['말씀을 듣고 깨닫는 좋은 땅(옥토)', '새들이 먹어버린 길가', '뿌리가 말라버린 돌밭'],
        ans: 0
      }
    },
    {
      id: 'par_sheep',
      category: 'parable',
      title: '🐑 [비유 미니게임 2] 잃어버린 양: 언덕 아래 어린양 잡기',
      x: -66, z: 12,
      color: 0x38bdf8,
      npcPreset: 'disciple',
      speaker: '선한 목자 비유',
      introText: '"[📖 예수님이 들려주신 비유] 아흔아홉 마리 양을 두고 언덕 아래 광야에서 길을 잃은 어린양 한 마리를 찾아 잡아 주세요! 가까이 가면 놀라서 빠르게 도망칠 수 있으니 끝까지 쫓아가 보세요!"',
      greetingText: '"고마워요! 잃어버린 양 한 마리까지 끝까지 찾아내어 어깨에 메고 기뻐하시는 선한 목자 예수님의 사랑을 늘 기억해요!"',
      missionType: 'chase_sheep',
      findTargetLabel: '🐑 놀라 도망치는 잃어버린 어린양!',
      completeSpeaker: '예수님',
      completeText: '"찾아내면 즐거워 어깨에 메고 집에 와서 벗과 이웃을 불러 모으고 말하되 나와 함께 즐기자 나의 잃은 양을 찾아내었노라 하리라!" (눅 15:3~7)',
      unlockNotebookIds: ['par_sheep'],
      quiz: {
        q: '잃어버린 양 비유에서 목자는 양 한 마리를 잃어버렸을 때 어떻게 했나요?',
        opts: ['찾아낼 때까지 끝까지 찾아가 기뻐하며 어깨에 메고 왔다', '아흔아홉 마리가 있으니 포기했다', '양이 스스로 돌아올 때까지 잠을 잤다'],
        ans: 0
      }
    },
    {
      id: 'par_builder',
      category: 'parable',
      title: '🪨 [비유 미니게임 3] 반석 위에 세운 지혜로운 집',
      x: 52, z: 24,
      color: 0x60a5fa,
      npcPreset: 'disciple',
      speaker: '지혜로운 건축자 비유',
      introText: '"[📖 예수님이 들려주신 비유] 비가 내리고 창수가 나도 무너지지 않도록, 주변에 흩어진 주춧돌 4개를 모아 넓은 반석 바위 터 위에 집을 세워 보세요!"',
      greetingText: '"든든한 반석 위에 멋진 집이 세워졌어요! 예수님의 말씀을 듣고 행하는 지혜로운 삶을 살아가요!"',
      missionType: 'collect_deliver',
      spawnMode: 'builder_random',
      allowRooftopSpawn: true,
      itemCount: 4,
      itemColor: '#94a3b8',
      itemLabel: '🪨 든든한 반석 주춧돌',
      targetOffset: { x: 5, z: -3 },
      targetLabel: '⛰️ 단단한 반석 바위 터',
      completeSpeaker: '예수님',
      completeText: '"누구든지 나의 이 말을 듣고 행하는 자는 그 집을 반석 위에 지은 지혜로운 사람 같으리니 비가 내리고 창수가 나고 바람이 불어 그 집에 부딪치되 무너지지 아니하나니 이는 주추를 반석 위에 놓은 까닭이요!" (마 7:24~27)',
      unlockNotebookIds: ['par_builder'],
      quiz: {
        q: '반석 위에 집을 지은 지혜로운 사람은 누구를 가리키나요?',
        opts: ['예수님의 말씀을 듣고 그대로 실천(행)하는 사람', '말씀을 듣고도 행하지 않는 사람', '모래 위에 높게만 집을 짓는 사람'],
        ans: 0
      }
    },
    {
      id: 'par_mustard',
      category: 'parable',
      title: '🌼 [비유 미니게임 4] 겨자씨 비유: 작은 씨앗의 성장',
      x: 42, z: -20,
      color: 0xa3e635,
      npcPreset: 'child',
      speaker: '천국 겨자씨 비유',
      introText: '"[📖 예수님이 들려주신 비유] 모든 씨보다 아주 작은 겨자씨 한 알을 찾아 흙밭에 심고, 맑은 물 항아리를 찾아 물을 부어 주세요! 시간이 지나면 굵은 줄기와 넓은 잎, 노란 꽃이 달린 풍성한 관목으로 자라날 거예요!"',
      greetingText: '"아주 작은 겨자씨 한 알이 이렇게 굵고 단단한 줄기와 넓은 잎, 노란 꽃이 가득한 풍성한 관목으로 자라났어요! 우리 마음속 천국의 믿음도 이렇게 무럭무럭 자라날 거예요!"',
      missionType: 'mustard_grow',
      itemCount: 1,
      itemColor: '#facc15',
      itemLabel: '🔍 아주 작은 겨자씨',
      targetOffset: { x: 4, z: 0 },
      targetLabel: '🌱 겨자씨 흙밭',
      completeSpeaker: '예수님',
      completeText: '"천국은 마치 사람이 자기 밭에 갖다 심은 겨자씨 한 알 같으니 이는 모든 씨보다 작은 것이로되 자란 후에는 풀보다 커서 나무가 되매 공중의 새들이 와서 그 가지에 깃들이느니라!" (마 13:31~32)',
      unlockNotebookIds: ['par_mustard'],
      quiz: {
        q: '가장 작은 겨자씨가 자라나면 어떻게 되나요?',
        opts: ['큰 나무가 되어 공중의 새들이 와서 가지에 깃든다', '작은 풀잎으로 끝난다', '모래 속으로 사라진다'],
        ans: 0
      }
    },
    {
      id: 'ev_nicodemus',
      isNightOnly: true,
      category: 'miracle',
      title: '🌙 [밤 전용] 니고데모: 밤중에 찾아간 예수님',
      x: 20.5, z: 40.5,
      color: 0xfbbf24,
      npcPreset: 'pharisee',
      speaker: '바리새인 관원 니고데모',
      introText: '"쉬잇! 낮에는 사람들의 시선과 로마 군인 때문에 도저히 만날 수가 없어 밤이 되길 기다렸소... 로마 군인의 횃불 순찰을 피해 길목의 성경 두루마리 3개를 모아서 서쪽 비밀 집의 예수님께 가 주시오!"',
      greetingText: '"밤중에 찾아온 나에게 물과 성령으로 거듭나는 하늘의 진리를 들려주신 예수님을 잊을 수 없소! 오늘 밤도 순찰을 조심하시오!"',
      missionType: 'nicodemus_stealth',
      itemCount: 3,
      itemColor: '#fde047',
      itemLabel: '📜 성경 두루마리',
      scrollPositions: [
        { x: 8.5, z: 36.0 },
        { x: -4.5, z: 39.5 },
        { x: -16.0, z: 34.5 }
      ],
      goalPos: { x: -24.5, y: 0, z: 36.5 },
      goalLabel: '🕯️ 비밀 집의 예수님',
      completeSpeaker: '예수님과 니고데모',
      completeText: '"사람이 물과 성령으로 나지 아니하면 하나님의 나라에 들어갈 수 없느니라. 하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니 이는 그를 믿는 자마다 멸망하지 않고 영생을 얻게 하려 하심이라!" (요 3:3~16)',
      unlockNotebookIds: ['mir_nicodemus', 'wd_john316'],
      quiz: {
        q: '예수님이 밤에 찾아온 니고데모에게 들려주신 하나님의 사랑 말씀은?',
        opts: [
          '하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니 이는 그를 믿는 자마다 영생을 얻게 하려 하심이라',
          '로마 군인의 순찰을 피해 평생 숨어 지내야 한다',
          '율법의 책만 많이 가지면 천국에 들어간다'
        ],
        ans: 0
      }
    }
  ];
}

function getMiraclePostResurrectionEventsCatalog() {
  return [
    {
      id: 'post_emmaus',
      category: 'story',
      title: '🚶 ⑪ [부활 이후] 엠마오로 가는 두 제자와의 동행',
      x: -48, z: 42,
      color: 0xfef08a,
      npcPreset: 'disciple',
      speaker: '엠마오로 가는 글로바와 친구',
      introText: '"슬픈 기색으로 엠마오로 내려가던 저희에게 한 나그네가 다가와 성경을 풀어주셨어요! 저희와 함께 마을 어딘가의 엠마오 식탁에서 기다리시는 예수님께 동행해 주세요!"',
      greetingText: '"길에서 우리에게 말씀하시고 성경을 풀어 주실 때에 우리 속에서 마음이 뜨겁지 아니하더냐! 주님이 참으로 살아나셨습니다!"',
      missionType: 'escort_guide',
      escortType: 'emmaus',
      randomEmmausGoal: true,
      goalPos: { x: -58, y: 0, z: 32 },
      goalLabel: '🍞 엠마오 식탁의 부활하신 예수님',
      completeSpeaker: '엠마오의 두 제자',
      completeText: '"그들과 함께 음식 잡수실 때에 떡을 가지사 축사하시고 떼어 그들에게 주시니 그들의 눈이 밝아져 그인 줄 알아보더니... 길에서 우리에게 말씀하시고 우리에게 성경을 풀어 주실 때에 우리 속에서 마음이 뜨겁지 아니하더냐!" (눅 24:13~35)',
      unlockNotebookIds: ['test_emmaus'],
      quiz: {
        q: '엠마오로 가던 두 제자는 언제 부활하신 예수님을 알아보았나요?',
        opts: ['함께 식사하며 예수님이 떡을 가져 축사하시고 떼어 주실 때', '성문 밖에서 말을 타실 때', '성전에서 돈을 바꾸실 때'],
        ans: 0
      }
    },
    {
      id: 'post_thomas',
      category: 'story',
      title: '🙌 ⑫ [부활 이후] 도마와 예수님: 손의 못자국 확인하기',
      x: -14.5, z: 60,
      color: 0x38bdf8,
      npcPreset: 'disciple',
      targetPreset: 'jesus',
      thomasCutscene: true,
      randomJesusSpawn: true,
      speaker: '사도 도마',
      introText: '"다른 제자들이 주님을 보았다고 했지만, 나는 그 손의 못 자국을 보고 내 손가락을 넣어 보지 않고는 믿지 못하겠소... 마을 어딘가에 나타나신 부활의 예수님을 찾아 손의 못 자국을 직접 확인해 보세요!"',
      greetingText: '"나의 주님이시요 나의 하나님이시니이다! 보지 못하고 믿는 자들에게 주시는 예수님의 복이 함께하시길 바랍니다!"',
      missionType: 'find_observe',
      findTargetPos: { x: -16.0, y: 0, z: 53.0 },
      findTargetLabel: '✨ 손의 못자국을 보여주시는 부활의 예수님',
      completeSpeaker: '예수님과 도마',
      completeText: '"도마가 대답하여 이르되 나의 주님이시요 나의 하나님이시니이다! 예수께서 이르시되 너는 나를 본 고로 믿느냐 보지 못하고 믿는 자들은 복되도다 하시니라." (요 20:24~29)',
      unlockNotebookIds: ['test_thomas'],
      quiz: {
        q: '부활하신 예수님을 만난 도마는 어떻게 고백했나요?',
        opts: ['나의 주님이시요 나의 하나님이시니이다', '당신은 훌륭한 선지자입니다', '다음에 다시 믿겠습니다'],
        ans: 0
      }
    },
    {
      id: 'post_breakfast',
      category: 'story',
      title: '🎣 ⑬ [부활 이후] 갈릴리 바닷가 낚시와 모닥불 아침 식사',
      x: -76, z: -76,
      color: 0xf97316,
      npcPreset: 'jesus',
      speaker: '바닷가에 서신 예수님',
      introText: '"얘들아, 갈릴리 바닷가에서 장대 낚시줄을 멀리 던져 물고기를 잡아 오렴! 잡은 물고기를 모닥불 숯불에 타지 않게 노릇노릇 구워 함께 아침 식사를 나누자!"',
      greetingText: '"내가 너희를 사랑한 것 같이 너희도 서로 사랑하고 내 어린 양을 먹이라!"',
      missionType: 'breakfast_fish_cook',
      itemCount: 3,
      itemColor: '#38bdf8',
      itemLabel: '🐟 갈릴리 물고기',
      targetOffset: { x: -7, z: 0 },
      targetLabel: '🔥 바닷가 숯불 모닥불',
      completeSpeaker: '예수님과 베드로',
      completeText: '"요한의 아들 시몬아 네가 이 사람들보다 나를 더 사랑하느냐? 주님 그러하나이다 내가 주님을 사랑하는 줄 주님께서 아시나이다. 예수께서 이르시되 내 어린 양을 먹이라!" (요 21:1~19)',
      unlockNotebookIds: ['test_breakfast', 'mir_fish'],
      quiz: {
        q: '갈릴리 바닷가에서 아침 식사를 마친 뒤 예수님이 베드로에게 세 번 당부하신 사명은 무엇인가요?',
        opts: ['내 양을 먹이라 (내 양을 치라)', '더 큰 고깃배를 만들어라', '로마로 가서 군대를 모아라'],
        ans: 0
      }
    }
  ];
}
// =========================================================================
// [ep4_miracle_world.js - 파트 3/3] 필드 이벤트 실행기 · 무릎 빛의 원 반짝임 · 완료 미션 인사/다시하기 · 오픈월드 루프
// - 반석 위에 지은 집 갇힘 방지 안전 텔레포트 적용
// - 중풍병자 들것 환자 모델링 및 지붕 뚫기 컷신(망치질, 하강 연출) 적용
// - 이전 스테이지 클리어 시 다음 스테이지 해금 동기화 확인
// - 대화창 활성화 시 캐릭터 이동 잠금 처리 적용 확인
// =========================================================================

// -------------------------------------------------------------------------
// [대화 중 이동 잠금 처리]
// NPC 대화창이 활성화되면 플레이어의 입력을 원천 차단하여 조작할 수 없게 만듭니다.
// -------------------------------------------------------------------------
const _origIsPlayerMovementLocked = window.isPlayerMovementLocked;
window.isPlayerMovementLocked = function() {
  let locked = false;
  if (typeof _origIsPlayerMovementLocked === 'function') {
    locked = _origIsPlayerMovementLocked();
  }
  return locked || 
         (miracleActiveFieldEvent && (miracleActiveFieldEvent.cutsceneActive || miracleActiveFieldEvent.type === 'breakfast_fish_cook')) || 
         (miracleDialogState && miracleDialogState.active) ||
         Boolean(window.__ep4OpeningVideoActive) ||
         Boolean(window.miracleOpenWorldIntroFlyover && window.miracleOpenWorldIntroFlyover.active);
};

function spawnMiracleOptionalEventSpots() {
  miracleEventSpots = [];
  const allCatalog = [...getMiracleOptionalEventsCatalog()];
  const showPostRes = Boolean(
    miracleIsPostResurrection ||
    (typeof isMiracleAllStagesUnlocked === 'function' && isMiracleAllStagesUnlocked())
  );
  if (showPostRes) {
    allCatalog.push(...getMiraclePostResurrectionEventsCatalog());
  }

  allCatalog.forEach(ev => {
    // 멀티플레이 맵에서는 확장형 반석 위의 집 협동 미션(mp_rock_house)이 해당 구역을 담당하므로 개인용 par_builder 마커는 중복 배치 제외
    if (window.isMiracleMultiplayerMode && ev.id === 'par_builder') return;
    const isCompleted =
      (typeof miracleCompletedMissionIds !== 'undefined' && miracleCompletedMissionIds.has(ev.id)) ||
      (ev.id !== 'ev_palm' && ev.unlockNotebookIds && ev.unlockNotebookIds.every(id => miracleCollectedIds.has(id)));
    // useTallBeam = false 로 설정하여 긴 빛기둥 대신 무릎 높이의 불규칙 빛의 원(kneeAura) 적용
    const marker = createMiracleSpotMarker(
      ev.x,
      ev.z,
      isCompleted ? 0x10b981 : ev.color,
      isCompleted ? `✅ ${ev.title} (인사·다시하기)` : ev.title,
      ev.npcPreset,
      false
    );

    // 엠마오 두 제자(글로바와 친구)는 나란히 서 있는 2명의 제자로 표시!
    if (ev.id === 'post_emmaus' && marker && marker.group) {
      const friendNpc = createLowPolyPersonMesh('disciple', 19);
      friendNpc.position.set(1.05, 0, -0.25);
      friendNpc.rotation.y = -0.35;
      marker.group.add(friendNpc);
      marker.companionNpc = friendNpc;
    }

    // [밤 전용] 니고데모: 밤 시간대에만 등잔을 들고 등장!
    let nightOilLamp = null;
    if (ev.isNightOnly && marker && marker.group) {
      const rArm = marker.npcMesh && marker.npcMesh.userData ? marker.npcMesh.userData.rArm : null;
      if (rArm && typeof window.createAncientOilLampProp === 'function') {
        nightOilLamp = window.createAncientOilLampProp(1.0);
        nightOilLamp.group.position.set(0.02, -0.44, 0.14);
        nightOilLamp.group.rotation.x = 0.72;
        rArm.rotation.x = -0.75;
        rArm.add(nightOilLamp.group);
        if (window.MiracleDayNight && typeof window.MiracleDayNight.registerNightLightSource === 'function') {
          window.MiracleDayNight.registerNightLightSource({
            pos: marker.pos,
            yOffset: 1.25,
            color: 0xffb347,
            intensity: 1.35,
            distance: 10.5,
            phase: 2.3,
            isActive: () => Boolean(marker.group.visible && window.MiracleDayNight && window.MiracleDayNight.isNight())
          });
        }
      }
      const initialNight = Boolean(window.MiracleDayNight && typeof window.MiracleDayNight.isNight === 'function' && window.MiracleDayNight.isNight());
      marker.group.visible = initialNight;
      if (marker.kneeAura) marker.kneeAura.visible = initialNight;
      if (marker.ring) marker.ring.visible = initialNight;
    }

    miracleEventSpots.push({
      ...ev,
      ...marker,
      nightOilLamp,
      isNightOnly: Boolean(ev.isNightOnly),
      completed: isCompleted,
      _requireLeaveZone: false
    });
  });
}

// -------------------------------------------------------------------------
// 7. 오픈월드 안전 야외 랜덤 스폰 헬퍼 & 필드 이벤트 실행기 (전면 고도화)
// -------------------------------------------------------------------------
function isPointOutsideAllBuildings(x, z, pad = 1.65) {
  if (x > 99.5 || z < -99.5 || z > 99.5) return false;
  const shoreX = (typeof window.getMiracleWestShoreLineX === 'function')
    ? window.getMiracleWestShoreLineX(z)
    : -92.0;
  if (x < shoreX + 4.0) return false;

  const gy = getMiracleOpenWorldGroundHeight(x, z);
  if (gy < -0.15) return false;

  const bList = Array.isArray(window.miracleBuildingBounds) ? window.miracleBuildingBounds : [];
  for (let i = 0; i < bList.length; i++) {
    const b = bList[i];
    if (x >= b.minX - pad && x <= b.maxX + pad && z >= b.minZ - pad && z <= b.maxZ + pad) return false;
  }

  const cPad = Math.max(0.85, pad * 0.72);
  for (let i = 0; i < colliders.length; i++) {
    const c = colliders[i];
    if (x >= c.minX - cPad && x <= c.maxX + cPad && z >= c.minZ - cPad && z <= c.maxZ + cPad) return false;
  }

  for (let i = 0; i < platforms.length; i++) {
    const p = platforms[i];
    if (p.topY > gy + 0.85 && x >= p.minX - 0.8 && x <= p.maxX + 0.8 && z >= p.minZ - 0.8 && z <= p.maxZ + 0.8) {
      return false;
    }
  }
  return true;
}
window.isPointOutsideAllBuildings = isPointOutsideAllBuildings;

function findSafeOpenWorldOutdoorPos(opts = {}) {
  const cx = (opts.cx !== undefined) ? opts.cx : 0;
  const cz = (opts.cz !== undefined) ? opts.cz : 0;
  const minDist = opts.minDist || 0;
  const maxDist = opts.maxDist || 45;
  const avoidList = opts.avoidList || [];
  const minSpacing = opts.minSpacing || 6.0;
  const pad = opts.pad || 1.65;
  const bList = Array.isArray(window.miracleBuildingBounds) ? window.miracleBuildingBounds : [];

  const isSpaced = (x, z, sp) => {
    for (let i = 0; i < avoidList.length; i++) {
      if (Math.hypot(x - avoidList[i].x, z - avoidList[i].z) < (avoidList[i].r || sp)) return false;
    }
    return true;
  };

  for (let attempt = 0; attempt < 180; attempt++) {
    let tx, tz;
    if (opts.nearBuildings && bList.length > 0 && attempt < 110) {
      const b = bList[Math.floor(Math.random() * bList.length)];
      const side = Math.floor(Math.random() * 4);
      const off = 2.4 + Math.random() * 3.8;
      if (side === 0) { tx = b.minX - off; tz = b.minZ + Math.random() * (b.maxZ - b.minZ); }
      else if (side === 1) { tx = b.maxX + off; tz = b.minZ + Math.random() * (b.maxZ - b.minZ); }
      else if (side === 2) { tx = b.minX + Math.random() * (b.maxX - b.minX); tz = b.minZ - off; }
      else { tx = b.minX + Math.random() * (b.maxX - b.minX); tz = b.maxZ + off; }
      const d = Math.hypot(tx - cx, tz - cz);
      if (d < minDist || d > maxDist) continue;
    } else if (opts.mountainSlopes) {
      // 동쪽·서남쪽·남쪽·동북쪽 산기슭 영역 중에서 무작위 선택
      const zone = Math.floor(Math.random() * 4);
      if (zone === 0) { tx = 62 + Math.random() * 34; tz = -88 + Math.random() * 172; }
      else if (zone === 1) { tx = -86 + Math.random() * 32; tz = 48 + Math.random() * 44; }
      else if (zone === 2) { tx = -55 + Math.random() * 135; tz = 82 + Math.random() * 16; }
      else { tx = 58 + Math.random() * 38; tz = -96 + Math.random() * 42; }
    } else if (opts.xMin !== undefined && opts.xMax !== undefined && opts.zMin !== undefined && opts.zMax !== undefined) {
      tx = opts.xMin + Math.random() * (opts.xMax - opts.xMin);
      tz = opts.zMin + Math.random() * (opts.zMax - opts.zMin);
      if (minDist > 0 && Math.hypot(tx - cx, tz - cz) < minDist) continue;
    } else {
      const ang = Math.random() * Math.PI * 2;
      const rad = minDist + Math.random() * Math.max(2.0, maxDist - minDist);
      tx = cx + Math.cos(ang) * rad;
      tz = cz + Math.sin(ang) * rad;
    }

    if (!isPointOutsideAllBuildings(tx, tz, attempt > 120 ? 1.15 : pad)) continue;
    const gy = getMiracleOpenWorldGroundHeight(tx, tz);
    if (opts.minY !== undefined && gy < opts.minY && attempt < 110) continue;
    if (opts.maxY !== undefined && gy > opts.maxY && attempt < 130) continue;
    const curSp = attempt > 110 ? minSpacing * 0.55 : minSpacing;
    if (!isSpaced(tx, tz, curSp)) continue;
    return { x: tx, y: gy, z: tz };
  }

  // 안전 야외 폴백 (중앙 순례길 근처 빈 야외 공간 탐색)
  for (let r = 6; r <= 48; r += 3) {
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      const fx = cx + Math.cos(a) * r;
      const fz = cz + Math.sin(a) * r;
      if (isPointOutsideAllBuildings(fx, fz, 1.1) && isSpaced(fx, fz, 3.0)) {
        return { x: fx, y: getMiracleOpenWorldGroundHeight(fx, fz), z: fz };
      }
    }
  }
  const rx = getMiracleMainRoadCenterX(cz);
  return { x: rx, y: getMiracleOpenWorldGroundHeight(rx, cz), z: Math.max(-90, Math.min(90, cz)) };
}
window.findSafeOpenWorldOutdoorPos = findSafeOpenWorldOutdoorPos;

// 계단으로 올라갈 수 있는 건물 2층(옥상)의 사물 없는 안전 지점을 랜덤 선택 (중복·겹침 방지)
function pickSafeRooftopSpawnSpot(opts = {}) {
  const pool = Array.isArray(window.miracleRooftopSpawnSpots) ? window.miracleRooftopSpawnSpots : [];
  if (pool.length === 0) return null;
  const cx = (opts.cx !== undefined) ? opts.cx : 0;
  const cz = (opts.cz !== undefined) ? opts.cz : 0;
  const minDist = opts.minDist || 4;
  const maxDist = opts.maxDist || 72;
  const avoidList = opts.avoidList || [];
  const usedHouses = opts.usedHouses || new Set();

  const candidates = pool.filter(sp => {
    const hKey = `${Math.round(sp.houseCx)}_${Math.round(sp.houseCz)}`;
    if (usedHouses.has(hKey)) return false;
    const d = Math.hypot(sp.x - cx, sp.z - cz);
    if (d < minDist || d > maxDist) return false;
    if (opts.xMin !== undefined && (sp.x < opts.xMin || sp.x > opts.xMax)) return false;
    if (opts.zMin !== undefined && (sp.z < opts.zMin || sp.z > opts.zMax)) return false;
    for (let i = 0; i < avoidList.length; i++) {
      if (Math.hypot(sp.x - avoidList[i].x, sp.z - avoidList[i].z) < 5.0) return false;
    }
    return true;
  });

  if (candidates.length === 0) return null;
  const chosen = candidates[Math.floor(Math.random() * candidates.length)];
  usedHouses.add(`${Math.round(chosen.houseCx)}_${Math.round(chosen.houseCz)}`);
  return { x: chosen.x, y: chosen.y, z: chosen.z, isRooftop: true };
}
window.pickSafeRooftopSpawnSpot = pickSafeRooftopSpawnSpot;

// [씨 뿌리기 미니게임 완료 후] 시간이 지나면서 싹 → 푸른 줄기 → 이삭 → 황금빛 수확 곡식으로 자라나는 영구 밭 생성기
function spawnPersistentSowerGrowingField(fx, fz, initialAgeSec = 0) {
  const by = getMiracleOpenWorldGroundHeight(fx, fz);
  // 동일 좌표 중복 방지
  if (Array.isArray(window.miracleGrowingFields)) {
    for (let i = window.miracleGrowingFields.length - 1; i >= 0; i--) {
      const old = window.miracleGrowingFields[i];
      if (Math.hypot(old.x - fx, old.z - fz) < 3.5) {
        if (old.group) worldGroup.remove(old.group);
        window.miracleGrowingFields.splice(i, 1);
      }
    }
  }

  const grp = new THREE.Group();
  // 기름진 좋은 땅(옥토) 베이스 + 정돈된 4개 이랑 + 낮은 목재 울타리 말뚝
  const soilBed = createLowPolyMesh(
    createOrganicBoxGeo(7.6, 0.24, 6.4, 910, 0.03, 0.99, 1),
    '#5c3a1e', 0, 0.08, 0, false
  );
  grp.add(soilBed);

  const furrowZList = [-2.0, -0.68, 0.68, 2.0];
  furrowZList.forEach((rz, fi) => {
    const ridge = createLowPolyMesh(
      createOrganicBoxGeo(6.4, 0.16, 0.72, 920 + fi, 0.03, 0.96, 1),
      '#4a2e16', 0, 0.20, rz, false
    );
    grp.add(ridge);
  });

  // 네 모서리 나무 울타리 말뚝
  [[-3.7, -3.1], [3.7, -3.1], [-3.7, 3.1], [3.7, 3.1]].forEach(([px, pz]) => {
    grp.add(createLowPolyMesh(new THREE.CylinderGeometry(0.11, 0.14, 0.92, 5), '#78350f', px, 0.44, pz, true));
  });

  // 24그루 로우폴리 곡식(밀/보리) 줄기 — 4개 이랑 × 6포기
  const stalks = [];
  furrowZList.forEach((rz, fi) => {
    for (let c = 0; c < 6; c++) {
      const sx = -2.5 + c * 1.0 + ((fi % 2) * 0.14 - 0.07);
      const sz = rz + ((c % 2) * 0.12 - 0.06);
      const stalkGrp = new THREE.Group();
      stalkGrp.position.set(sx, 0.26, sz);

      const stemMat = new THREE.MeshPhongMaterial({ color: 0x84cc16, flatShading: true, shininess: 0, specular: 0x000000 });
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.052, 1.05, 5), stemMat);
      stem.position.y = 0.52;

      const leafMat = new THREE.MeshPhongMaterial({ color: 0x4ade80, flatShading: true, shininess: 0, specular: 0x000000 });
      const leafL = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.44, 4), leafMat);
      leafL.position.set(-0.14, 0.46, 0);
      leafL.rotation.z = 0.72;
      const leafR = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.44, 4), leafMat);
      leafR.position.set(0.14, 0.56, 0.06);
      leafR.rotation.z = -0.68;

      const earMat = new THREE.MeshPhongMaterial({ color: 0xfacc15, flatShading: true, shininess: 0, specular: 0x000000 });
      const ear = new THREE.Mesh(new THREE.DodecahedronGeometry(0.16, 0), earMat);
      ear.position.set(0, 1.08, 0);
      ear.scale.set(0.75, 1.85, 0.75);
      ear.visible = false;

      stalkGrp.add(stem, leafL, leafR, ear);
      stalkGrp.scale.set(0.12, 0.10, 0.12);
      grp.add(stalkGrp);

      stalks.push({
        group: stalkGrp,
        stemMat,
        leafMat,
        ear,
        earMat,
        phase: fi * 1.1 + c * 0.7,
        heightVar: 0.88 + ((fi * 7 + c * 3) % 5) * 0.08
      });
    }
  });

  grp.position.set(fx, by, fz);
  worldGroup.add(grp);

  const fieldObj = {
    x: fx,
    y: by,
    z: fz,
    group: grp,
    stalks,
    age: initialAgeSec,
    plantedAt: Date.now() - initialAgeSec * 1000,
    stage: 0,
    matureAnnounced: initialAgeSec >= (MIRACLE_SOWER_GROW_DURATION_SEC - 1)
  };
  if (!Array.isArray(window.miracleGrowingFields)) window.miracleGrowingFields = [];
  window.miracleGrowingFields.push(fieldObj);
  updateMiracleGrowingFields(0.016, performance.now());
  return fieldObj;
}
window.spawnPersistentSowerGrowingField = spawnPersistentSowerGrowingField;

function updateMiracleGrowingFields(dt, now) {
  if (!Array.isArray(window.miracleGrowingFields) || window.miracleGrowingFields.length === 0) return;
  const tSec = now * 0.001;
  const growDur = Math.max(10, Number(window.MIRACLE_SOWER_GROW_DURATION_SEC) || MIRACLE_SOWER_GROW_DURATION_SEC);
  const colSprout = new THREE.Color('#84cc16');
  const colGreen  = new THREE.Color('#22c55e');
  const colGold   = new THREE.Color('#eab308');
  const colRipe   = new THREE.Color('#facc15');
  const nowWallMs = Date.now();

  window.miracleGrowingFields.forEach(field => {
    // 타임스탬프 기반 경과 시간 + 프레임 dt 동기화 (1시간 등 장시간 설정 시에도 추가 자원 소모 거의 없음!)
    const wallElapsed = field.plantedAt ? Math.max(0, (nowWallMs - field.plantedAt) / 1000) : 0;
    field.age = Math.max(field.age + dt, wallElapsed);
    const g = Math.min(1.0, field.age / growDur);
    const newStage = g < 0.25 ? 1 : (g < 0.58 ? 2 : (g < 0.86 ? 3 : 4));
    if (newStage > field.stage) {
      field.stage = newStage;
      if (newStage === 4 && !field.matureAnnounced) {
        field.matureAnnounced = true;
        if (typeof showToast === 'function' && miracleSubMode === 'openworld') {
          showToast('🌾✨ 좋은 땅에 뿌린 씨앗이 시간이 지나며 100배의 황금빛 곡식으로 무럭무럭 익었어요!');
        }
      }
    }

    field.stalks.forEach(st => {
      const sx = 0.22 + g * 0.88;
      const sy = (0.14 + g * 1.18) * st.heightVar;
      st.group.scale.set(sx, sy, sx);

      // 바람에 살랑이는 황금 물결
      const swayAmp = 0.04 + g * 0.10;
      st.group.rotation.z = Math.sin(tSec * 2.1 + st.phase) * swayAmp;
      st.group.rotation.x = Math.cos(tSec * 1.7 + st.phase) * swayAmp * 0.6;

      if (g < 0.55) {
        st.stemMat.color.copy(colSprout).lerp(colGreen, g / 0.55);
        st.leafMat.color.copy(colSprout).lerp(colGreen, g / 0.55);
        st.ear.visible = false;
      } else {
        const ripen = Math.min(1, (g - 0.55) / 0.45);
        st.stemMat.color.copy(colGreen).lerp(colGold, ripen);
        st.leafMat.color.copy(colGreen).lerp(colGold, ripen * 0.75);
        st.ear.visible = true;
        const es = 0.25 + ripen * 0.95;
        st.ear.scale.set(0.75 * es, 1.85 * es, 0.75 * es);
        st.earMat.color.copy(colGreen).lerp(colRipe, ripen);
      }
    });
  });
}

// [겨자씨 비유 미니게임 완료 후] 시간이 지나면서 작은 새싹 → 굵고 단단한 다줄기 → 넓은 잎 → 노란 꽃 풍성한 관목으로 자라나는 영구 식물 생성기
function spawnPersistentMustardShrub(fx = 46, fz = -20, initialAgeSec = 0) {
  const by = getMiracleOpenWorldGroundHeight(fx, fz);
  if (Array.isArray(window.miracleMustardShrubs)) {
    for (let i = window.miracleMustardShrubs.length - 1; i >= 0; i--) {
      const old = window.miracleMustardShrubs[i];
      if (Math.hypot(old.x - fx, old.z - fz) < 3.5) {
        if (old.group && typeof worldGroup !== 'undefined' && worldGroup) worldGroup.remove(old.group);
        window.miracleMustardShrubs.splice(i, 1);
      }
    }
  }

  const grp = new THREE.Group();

  // 1) 돌멩이 테두리가 있는 촉촉한 원형 흙밭
  const soilMound = createLowPolyMesh(
    new THREE.CylinderGeometry(1.42, 1.66, 0.24, 10),
    '#4a2e16', 0, 0.11, 0, false
  );
  grp.add(soilMound);

  for (let p = 0; p < 10; p++) {
    const ang = (p / 10) * Math.PI * 2 + 0.18;
    const pr = 1.56 + (p % 2) * 0.07;
    const stone = createLowPolyMesh(
      new THREE.DodecahedronGeometry(0.22 + (p % 3) * 0.03, 0),
      p % 2 === 0 ? '#94a3b8' : '#a8a29e',
      Math.cos(ang) * pr, 0.12, Math.sin(ang) * pr, false
    );
    stone.scale.set(1.22, 0.56, 0.95);
    stone.rotation.y = ang + p * 0.4;
    grp.add(stone);
  }

  const shrubRoot = new THREE.Group();
  shrubRoot.position.set(0, 0.18, 0);
  grp.add(shrubRoot);

  // 2) 초기 작은 새싹 (떡잎 2장)
  const sproutGrp = new THREE.Group();
  const sStem = createLowPolyMesh(new THREE.CylinderGeometry(0.035, 0.055, 0.42, 5), '#84cc16', 0, 0.21, 0, false);
  const cotL = createLowPolyMesh(new THREE.DodecahedronGeometry(0.18, 0), '#4ade80', -0.15, 0.36, 0, false);
  cotL.scale.set(1.45, 0.32, 0.95);
  cotL.rotation.z = 0.28;
  const cotR = createLowPolyMesh(new THREE.DodecahedronGeometry(0.18, 0), '#84cc16', 0.15, 0.36, 0.02, false);
  cotR.scale.set(1.45, 0.32, 0.95);
  cotR.rotation.z = -0.28;
  sproutGrp.add(sStem, cotL, cotR);
  shrubRoot.add(sproutGrp);

  // 3) 굵고 단단한 다줄기 목질 관목 뼈대
  const woodyGrp = new THREE.Group();
  shrubRoot.add(woodyGrp);

  const makeWoodBranch = (p1Arr, p2Arr, rBot, rTop, colHex, seed, flare = false) => {
    const p1 = new THREE.Vector3(p1Arr[0], p1Arr[1], p1Arr[2]);
    const p2 = new THREE.Vector3(p2Arr[0], p2Arr[1], p2Arr[2]);
    if (typeof createOrganicWoodSegmentMesh === 'function') {
      return createOrganicWoodSegmentMesh(p1, p2, rBot, rTop, colHex, seed, 0.15, flare);
    }
    const dir = new THREE.Vector3().subVectors(p2, p1);
    const len = Math.max(0.1, dir.length());
    const cyl = createLowPolyMesh(new THREE.CylinderGeometry(rTop, rBot, len, 6), colHex, 0, 0, 0, true);
    cyl.position.copy(p1).addScaledVector(dir, 0.5);
    cyl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    return cyl;
  };

  const barkCols = ['#5c3a21', '#6b4423', '#4d311a', '#714928'];
  woodyGrp.add(makeWoodBranch([0, -0.02, 0], [0.05, 1.38, -0.04], 0.28, 0.16, barkCols[0], 701, true));
  woodyGrp.add(makeWoodBranch([0.05, 1.32, -0.04], [-0.08, 2.42, 0.07], 0.16, 0.085, barkCols[1], 702, false));

  const leafAnchorNodes = [];
  const flowerAnchorNodes = [];
  const birdPerchSpots = [];

  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2 + 0.22;
    const baseY = 0.22 + (i % 3) * 0.14;
    const rMid = 0.72 + (i % 2) * 0.16;
    const yMid = 1.15 + (i % 3) * 0.18;
    const rTip = 1.35 + (i % 2) * 0.24;
    const yTip = 1.62 + (i % 3) * 0.22;

    const pStart = [Math.cos(ang) * 0.06, baseY, Math.sin(ang) * 0.06];
    const pMid = [Math.cos(ang) * rMid, yMid, Math.sin(ang) * rMid];
    const pTip = [Math.cos(ang + 0.12) * rTip, yTip, Math.sin(ang + 0.12) * rTip];

    woodyGrp.add(makeWoodBranch(pStart, pMid, 0.17, 0.105, barkCols[(i + 1) % barkCols.length], 710 + i * 7, false));
    woodyGrp.add(makeWoodBranch(pMid, pTip, 0.105, 0.058, barkCols[(i + 2) % barkCols.length], 730 + i * 7, false));

    // 2차 상단 관목 가지 (사방으로 풍성하게 퍼지며 올라감)
    const ang2 = ang - 0.26;
    const rUp = 1.48 + ((i + 1) % 2) * 0.30;
    const yUp = 2.38 + (i % 3) * 0.24;
    const pUp = [Math.cos(ang2) * rUp, yUp, Math.sin(ang2) * rUp];
    woodyGrp.add(makeWoodBranch(pMid, pUp, 0.095, 0.048, barkCols[i % barkCols.length], 760 + i * 11, false));

    leafAnchorNodes.push(
      { pos: pMid, ang, scale: 1.05 },
      { pos: pTip, ang: ang + 0.12, scale: 1.18 },
      { pos: pUp, ang: ang2, scale: 1.12 }
    );
    flowerAnchorNodes.push(
      { pos: [pTip[0], pTip[1] + 0.18, pTip[2]], ang: ang + 0.12 },
      { pos: [pUp[0], pUp[1] + 0.20, pUp[2]], ang: ang2 },
      { pos: [pUp[0] * 0.85, pUp[1] + 0.34, pUp[2] * 0.85], ang: ang2 + 0.3 }
    );
    if (i % 2 === 0 && birdPerchSpots.length < 3) {
      birdPerchSpots.push({ pos: [pUp[0] * 0.92, pUp[1] + 0.08, pUp[2] * 0.92], rotY: ang2 + Math.PI * 0.7 });
    }
  }

  // 상단 중앙 왕관 가지 3개
  for (let c = 0; c < 3; c++) {
    const cAng = (c / 3) * Math.PI * 2 + 0.6;
    const cBase = [0.02, 1.45 + c * 0.12, 0.02];
    const cTip = [Math.cos(cAng) * 0.78, 2.75 + (c % 2) * 0.26, Math.sin(cAng) * 0.78];
    woodyGrp.add(makeWoodBranch(cBase, cTip, 0.105, 0.052, barkCols[c % barkCols.length], 800 + c * 13, false));
    leafAnchorNodes.push({ pos: cTip, ang: cAng, scale: 1.15 });
    flowerAnchorNodes.push(
      { pos: [cTip[0], cTip[1] + 0.22, cTip[2]], ang: cAng },
      { pos: [cTip[0] * 0.65, cTip[1] + 0.36, cTip[2] * 0.65], ang: cAng + 0.5 }
    );
  }
  leafAnchorNodes.push({ pos: [-0.08, 2.55, 0.07], ang: 0.4, scale: 1.24 });
  flowerAnchorNodes.push(
    { pos: [-0.08, 2.88, 0.07], ang: 0.4 },
    { pos: [0.22, 2.76, -0.18], ang: 1.9 },
    { pos: [-0.28, 2.72, -0.16], ang: 3.1 }
  );

  // 4) 넓고 풍성한 초록 잎 (단순 공 덩어리가 아닌 넓게 펼쳐진 관목 잎사귀 패드)
  const leafClusters = [];
  const leafCols = ['#2f7d32', '#3f9142', '#4d7c0f', '#65a30d', '#3a873d'];
  leafAnchorNodes.forEach((node, idx) => {
    const lHolder = new THREE.Group();
    lHolder.position.set(node.pos[0], node.pos[1], node.pos[2]);
    lHolder.rotation.y = node.ang;

    const mainBlade = createLowPolyMesh(
      new THREE.DodecahedronGeometry(0.56, 0),
      leafCols[idx % leafCols.length], 0.18, 0.05, 0, true
    );
    mainBlade.scale.set(1.58, 0.34, 1.24);
    mainBlade.rotation.z = -0.16;

    const subBlade = createLowPolyMesh(
      new THREE.DodecahedronGeometry(0.44, 0),
      leafCols[(idx + 2) % leafCols.length], -0.16, 0.12, 0.22, false
    );
    subBlade.scale.set(1.42, 0.32, 1.15);
    subBlade.rotation.y = 0.72;
    subBlade.rotation.x = 0.18;

    lHolder.add(mainBlade, subBlade);
    lHolder.scale.setScalar(0.01);
    lHolder.visible = false;
    woodyGrp.add(lHolder);

    leafClusters.push({
      group: lHolder,
      targetScale: node.scale,
      growStart: 0.14 + (idx % 6) * 0.045,
      growEnd: 0.62 + (idx % 5) * 0.06
    });
  });

  // 5) 하단 기저부 넓은 잎 4쌍 (땅 가까이부터 풍성한 관목 실루엣)
  for (let b = 0; b < 4; b++) {
    const bAng = (b / 4) * Math.PI * 2 + 0.55;
    const bHolder = new THREE.Group();
    bHolder.position.set(Math.cos(bAng) * 0.62, 0.62 + (b % 2) * 0.14, Math.sin(bAng) * 0.62);
    bHolder.rotation.y = bAng;
    const bLeaf = createLowPolyMesh(new THREE.DodecahedronGeometry(0.48, 0), leafCols[(b + 1) % leafCols.length], 0.14, 0, 0, false);
    bLeaf.scale.set(1.52, 0.32, 1.18);
    bLeaf.rotation.z = -0.22;
    bHolder.add(bLeaf);
    bHolder.scale.setScalar(0.01);
    bHolder.visible = false;
    woodyGrp.add(bHolder);
    leafClusters.push({
      group: bHolder,
      targetScale: 0.96,
      growStart: 0.18 + b * 0.04,
      growEnd: 0.55 + b * 0.05
    });
  }

  // 6) 가지 끝과 잎 위로 만개하는 노란 겨자꽃 송이들
  const flowerClusters = [];
  const flowerCols = ['#facc15', '#fde047', '#eab308'];
  flowerAnchorNodes.forEach((fn, idx) => {
    const fGrp = new THREE.Group();
    fGrp.position.set(fn.pos[0], fn.pos[1], fn.pos[2]);
    fGrp.rotation.y = fn.ang;

    const pedicel = createLowPolyMesh(new THREE.CylinderGeometry(0.022, 0.030, 0.24, 4), '#65a30d', 0, 0.11, 0, false);
    fGrp.add(pedicel);

    const floretOffsets = [[0, 0.26, 0], [0.13, 0.21, 0.08], [-0.12, 0.22, 0.09], [0.02, 0.20, -0.13]];
    floretOffsets.forEach(([ox, oy, oz], fi) => {
      const petal = createLowPolyMesh(
        new THREE.DodecahedronGeometry(fi === 0 ? 0.135 : 0.105, 0),
        flowerCols[(idx + fi) % flowerCols.length],
        ox, oy, oz, false
      );
      petal.scale.set(1.18, 0.84, 1.18);
      fGrp.add(petal);
    });

    fGrp.scale.setScalar(0.01);
    fGrp.visible = false;
    woodyGrp.add(fGrp);

    flowerClusters.push({
      group: fGrp,
      bloomStart: 0.52 + (idx % 7) * 0.045,
      bloomSpan: 0.24
    });
  });

  // 7) 다 자란 가지에 앉는 공중의 작은 새 3마리 (마 13:32)
  const perchedBirds = [];
  if (typeof window.createFlyingBirdMesh === 'function') {
    const birdPalettes = [
      ['#fef3c7', '#b45309'],
      ['#f8fafc', '#94a3b8'],
      ['#e0f2fe', '#64748b']
    ];
    birdPerchSpots.forEach((ps, bi) => {
      const bMesh = window.createFlyingBirdMesh(birdPalettes[bi][0], birdPalettes[bi][1], 1.0);
      if (bMesh.userData && bMesh.userData.wingL && bMesh.userData.wingR) {
        bMesh.userData.wingL.rotation.z = -0.35;
        bMesh.userData.wingR.rotation.z = 0.35;
      }
      const bHolder = new THREE.Group();
      bHolder.position.set(ps.pos[0], ps.pos[1], ps.pos[2]);
      bHolder.rotation.y = ps.rotY;
      bHolder.add(bMesh);
      bHolder.visible = false;
      bHolder.scale.setScalar(0.01);
      woodyGrp.add(bHolder);
      perchedBirds.push({
        group: bHolder,
        baseRotY: ps.rotY,
        baseScale: 0.64 + (bi % 2) * 0.08,
        phase: bi * 1.9
      });
    });
  }

  grp.position.set(fx, by, fz);
  worldGroup.add(grp);

  const shrubObj = {
    x: fx,
    y: by,
    z: fz,
    group: grp,
    shrubRoot,
    sproutGrp,
    woodyGrp,
    leafClusters,
    flowerClusters,
    perchedBirds,
    age: initialAgeSec,
    plantedAt: Date.now() - initialAgeSec * 1000,
    stage: 0,
    matureAnnounced: initialAgeSec >= (MIRACLE_MUSTARD_GROW_DURATION_SEC - 1)
  };
  if (!Array.isArray(window.miracleMustardShrubs)) window.miracleMustardShrubs = [];
  window.miracleMustardShrubs.push(shrubObj);
  window.miracleMustardTreeGrown = true;
  if (typeof miracleSunSystem !== 'undefined' && miracleSunSystem) {
    miracleSunSystem.cullBuilt = false;
  }
  updateMiracleMustardShrubs(0.016, performance.now());
  return shrubObj;
}
window.spawnPersistentMustardShrub = spawnPersistentMustardShrub;

function updateMiracleMustardShrubs(dt, now) {
  if (!Array.isArray(window.miracleMustardShrubs) || window.miracleMustardShrubs.length === 0) return;
  const tSec = now * 0.001;
  const growDur = Math.max(10, Number(window.MIRACLE_MUSTARD_GROW_DURATION_SEC) || MIRACLE_MUSTARD_GROW_DURATION_SEC);
  const nowWallMs = Date.now();

  window.miracleMustardShrubs.forEach((shrub, sIdx) => {
    const wallElapsed = shrub.plantedAt ? Math.max(0, (nowWallMs - shrub.plantedAt) / 1000) : 0;
    shrub.age = Math.max(shrub.age + dt, wallElapsed);
    const g = Math.min(1.0, shrub.age / growDur);
    const newStage = g < 0.22 ? 1 : (g < 0.55 ? 2 : (g < 0.85 ? 3 : 4));
    if (newStage > shrub.stage) {
      shrub.stage = newStage;
    }
    if (g >= 0.995 && !shrub.matureAnnounced) {
      shrub.matureAnnounced = true;
      if (typeof showToast === 'function' && miracleSubMode === 'openworld') {
        showToast('🌼✨ 작은 겨자씨가 굵은 줄기와 넓은 잎, 노란 꽃이 가득한 풍성한 관목으로 자라나 새들이 깃들었어요!');
      }
    }

    // 1) 초기 새싹
    if (shrub.sproutGrp) {
      if (g < 0.42) {
        shrub.sproutGrp.visible = true;
        const spScale = g < 0.16 ? (0.45 + (g / 0.16) * 0.70) : Math.max(0.25, 1.15 - ((g - 0.16) / 0.26) * 0.90);
        shrub.sproutGrp.scale.setScalar(spScale);
      } else {
        shrub.sproutGrp.visible = false;
      }
    }

    // 2) 굵고 단단한 목질 줄기 성장
    if (shrub.woodyGrp) {
      const wRatio = Math.min(1.0, g / 0.90);
      const wXZ = 0.08 + wRatio * 0.92;
      const wY = 0.06 + wRatio * 0.94;
      shrub.woodyGrp.scale.set(wXZ, wY, wXZ);
    }

    // 3) 넓은 잎 성장
    if (Array.isArray(shrub.leafClusters)) {
      shrub.leafClusters.forEach(lc => {
        const lt = Math.max(0, Math.min(1, (g - lc.growStart) / Math.max(0.05, lc.growEnd - lc.growStart)));
        if (lt <= 0.02) {
          lc.group.visible = false;
        } else {
          lc.group.visible = true;
          lc.group.scale.setScalar((0.12 + lt * 0.88) * lc.targetScale);
        }
      });
    }

    // 4) 노란 겨자꽃 송이 개화
    if (Array.isArray(shrub.flowerClusters)) {
      shrub.flowerClusters.forEach(fc => {
        const ft = Math.max(0, Math.min(1, (g - fc.bloomStart) / fc.bloomSpan));
        if (ft <= 0.02) {
          fc.group.visible = false;
        } else {
          fc.group.visible = true;
          fc.group.scale.setScalar(0.10 + ft * 0.90);
        }
      });
    }

    // 5) 만개한 관목 가지 위 작은 새
    if (Array.isArray(shrub.perchedBirds)) {
      shrub.perchedBirds.forEach(pb => {
        const bt = Math.max(0, Math.min(1, (g - 0.85) / 0.12));
        if (bt <= 0.02) {
          pb.group.visible = false;
        } else {
          pb.group.visible = true;
          pb.group.scale.setScalar((0.15 + bt * 0.85) * pb.baseScale);
          pb.group.rotation.y = pb.baseRotY + Math.sin(tSec * 1.4 + pb.phase) * 0.28;
          pb.group.rotation.x = Math.sin(tSec * 2.6 + pb.phase) * 0.08;
        }
      });
    }

    // 6) 바람에 살랑이는 관목 흔들림
    if (shrub.shrubRoot) {
      const swayAmp = 0.014 + g * 0.024;
      shrub.shrubRoot.rotation.z = Math.sin(tSec * 1.5 + sIdx) * swayAmp;
      shrub.shrubRoot.rotation.x = Math.cos(tSec * 1.2 + sIdx) * swayAmp * 0.65;
    }
  });
}

// [아침식사 미션 완료 후] 불꺼진 모닥불(숯이 된 까만 나무 장작 + 회색 재)을 오픈월드에 영구 배치
function spawnPersistentBurntCampfire(cx, cz, saveToHistory = true) {
  if (typeof createGalileeCampfireMesh !== 'function') return null;
  if (!Array.isArray(window.miracleBurntCampfireMeshes)) window.miracleBurntCampfireMeshes = [];
  for (let i = window.miracleBurntCampfireMeshes.length - 1; i >= 0; i--) {
    const old = window.miracleBurntCampfireMeshes[i];
    if (Math.hypot(old.x - cx, old.z - cz) < 2.6) {
      if (old.mesh && typeof worldGroup !== 'undefined' && worldGroup) worldGroup.remove(old.mesh);
      window.miracleBurntCampfireMeshes.splice(i, 1);
    }
  }
  const by = getMiracleOpenWorldGroundHeight(cx, cz);
  const burntMesh = createGalileeCampfireMesh(true, 1.08);
  burntMesh.position.set(cx, by, cz);
  worldGroup.add(burntMesh);
  const entry = { x: cx, y: by, z: cz, mesh: burntMesh };
  window.miracleBurntCampfireMeshes.push(entry);

  if (saveToHistory) {
    if (!Array.isArray(window.miracleBurntCampfires)) window.miracleBurntCampfires = [];
    const idx = window.miracleBurntCampfires.findIndex(it => Math.hypot(it.x - cx, it.z - cz) < 2.6);
    const rec = { x: cx, z: cz, extinguishedAt: Date.now() };
    if (idx >= 0) window.miracleBurntCampfires[idx] = rec;
    else window.miracleBurntCampfires.push(rec);
    saveMiracleBurntCampfiresToStorage();
  }
  return entry;
}
window.spawnPersistentBurntCampfire = spawnPersistentBurntCampfire;

// [부활 이후 갈릴리 바닷가 아침식사] 낚시(투척 힘 + 랜덤 입질 게이지) & 모닥불 생선 굽기 컨트롤러
let _miracleBfHandledPointer = false;

function syncMiracleBreakfastUI() {
  const ui = document.getElementById('miracle-breakfast-ui');
  if (!ui) return;
  if (!miracleActiveFieldEvent || miracleActiveFieldEvent.type !== 'breakfast_fish_cook' || !miracleActiveFieldEvent.breakfastState) {
    ui.classList.add('hidden');
    return;
  }
  const bs = miracleActiveFieldEvent.breakfastState;
  const camBar = document.getElementById('cam-bottom-bar');
  if (camBar && camBar.style.display !== 'none') {
    if (bs._prevCamBarDisplay === undefined) bs._prevCamBarDisplay = camBar.style.display || 'flex';
    camBar.style.display = 'none';
  }
  ui.classList.remove('hidden');

  const phaseEl = document.getElementById('miracle-bf-phase');
  const countEl = document.getElementById('miracle-bf-count');
  const hintEl = document.getElementById('miracle-bf-hint');
  const castWrap = document.getElementById('miracle-bf-cast-wrap');
  const biteWrap = document.getElementById('miracle-bf-bite-wrap');
  const cookWrap = document.getElementById('miracle-bf-cook-wrap');
  const powerBar = document.getElementById('miracle-bf-power-bar');
  const powerLbl = document.getElementById('miracle-bf-power-label');
  const zoneEl = document.getElementById('miracle-bf-zone');
  const needleEl = document.getElementById('miracle-bf-needle');
  const cookBar = document.getElementById('miracle-bf-cook-bar');
  const cookLbl = document.getElementById('miracle-bf-cook-label');
  const btn = document.getElementById('miracle-bf-action-btn');

  if (countEl) countEl.textContent = `🐟 ${bs.caughtCount} / ${bs.reqFish}`;

  const isCastPhase = (bs.phase === 'cast_ready' || bs.phase === 'charging' || bs.phase === 'casting' || bs.phase === 'waiting_bite' || bs.phase === 'fish_caught');
  const isBitePhase = (bs.phase === 'bite_timing');
  const isCookPhase = (bs.phase === 'cook_ready' || bs.phase === 'roasting' || bs.phase === 'eating');

  if (castWrap) castWrap.classList.toggle('hidden', !isCastPhase);
  if (biteWrap) biteWrap.classList.toggle('hidden', !isBitePhase);
  if (cookWrap) cookWrap.classList.toggle('hidden', !isCookPhase);

  if (isCastPhase) {
    const pPct = Math.round(Math.max(0, Math.min(1, bs.power)) * 100);
    if (powerBar) powerBar.style.width = `${pPct}%`;
    if (powerLbl) powerLbl.textContent = bs.phase === 'waiting_bite'
      ? `🌊 ${bs.castDist.toFixed(1)}m 투척 완료! 입질 기다리는 중...`
      : `투척 힘 ${pPct}% (${(6 + bs.power * 16).toFixed(1)}m)`;
  }

  if (bs.phase === 'cast_ready') {
    if (phaseEl) phaseEl.textContent = '🎣 갈릴리 바닷가 낚시';
    if (hintEl) hintEl.textContent = '버튼을 길게 누를수록 멀리 던져 물고기가 더 빨리·잘 잡혀요!';
    if (btn) {
      btn.disabled = false;
      btn.textContent = '🎣 꾹 눌러서 낚시줄 던지기';
      btn.className = 'mc-btn w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 border-2 border-white text-slate-950 font-jua text-sm sm:text-base shadow-lg select-none touch-none';
    }
  } else if (bs.phase === 'charging') {
    if (phaseEl) phaseEl.textContent = '💪 투척 힘 모으는 중...';
    if (hintEl) hintEl.textContent = '게이지가 높을 때 손가락(또는 스페이스바)을 떼어 멀리 던지세요!';
    if (btn) {
      btn.disabled = false;
      btn.textContent = '🌊 지금 떼어서 던지기!';
      btn.className = 'mc-btn w-full py-2.5 rounded-xl bg-amber-400 border-2 border-white text-slate-950 font-jua text-sm sm:text-base shadow-lg select-none touch-none';
    }
  } else if (bs.phase === 'casting' || bs.phase === 'waiting_bite') {
    if (phaseEl) phaseEl.textContent = '🌊 입질 기다리는 중...';
    if (hintEl) {
      hintEl.textContent = bs.power >= 0.72
        ? `✨ ${bs.castDist.toFixed(1)}m 깊은 바다에 투척! 대어가 곧 물어요!`
        : `🌊 ${bs.castDist.toFixed(1)}m 지점에서 찌가 흔들리기를 기다리는 중...`;
    }
    if (btn) {
      btn.disabled = true;
      btn.textContent = '⏳ 찌가 흔들리길 기다리는 중...';
      btn.className = 'mc-btn w-full py-2.5 rounded-xl bg-slate-600 border-2 border-slate-400 text-slate-200 font-jua text-sm sm:text-base shadow select-none touch-none opacity-80';
    }
  } else if (bs.phase === 'bite_timing') {
    if (phaseEl) phaseEl.textContent = '❗ 입질이다!! 타이밍을 맞추세요!';
    if (hintEl) hintEl.textContent = '움직이는 바늘이 초록 구간 안에 들어올 때 버튼을 누르세요!';
    if (zoneEl) {
      zoneEl.style.left = `${bs.zoneLeft.toFixed(1)}%`;
      zoneEl.style.width = `${bs.zoneWidth.toFixed(1)}%`;
    }
    if (needleEl) needleEl.style.left = `${bs.needlePos.toFixed(1)}%`;
    if (btn) {
      btn.disabled = false;
      btn.textContent = '⚡ 지금 당기기! (물고기 잡기)';
      btn.className = 'mc-btn w-full py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 border-2 border-white text-slate-950 font-jua text-sm sm:text-base shadow-lg select-none touch-none animate-pulse';
    }
  } else if (bs.phase === 'fish_caught') {
    if (phaseEl) phaseEl.textContent = '🐟✨ 월척! 물고기를 잡았어요!';
    if (hintEl) hintEl.textContent = bs.caughtCount >= bs.reqFish
      ? '필요한 물고기를 다 잡았어요! 예수님과 모닥불로 이동합니다!'
      : `멋져요! 남은 물고기 ${bs.reqFish - bs.caughtCount}마리를 마저 잡아 보세요!`;
    if (btn) {
      btn.disabled = true;
      btn.textContent = '🎉 물고기 획득!';
      btn.className = 'mc-btn w-full py-2.5 rounded-xl bg-emerald-500 border-2 border-amber-200 text-white font-jua text-sm sm:text-base shadow select-none touch-none';
    }
  } else if (bs.phase === 'cook_ready') {
    if (phaseEl) phaseEl.textContent = '🔥 예수님과 모닥불 생선 굽기';
    if (hintEl) hintEl.textContent = '예수님과 모닥불 옆에 앉았어요! 물고기를 숯불 위에 올려 구워 볼까요?';
    if (cookBar) cookBar.style.width = '0%';
    if (cookLbl) cookLbl.textContent = '물고기를 불에 올릴 준비 완료';
    if (btn) {
      btn.disabled = false;
      btn.textContent = '🐟 숯불 위에 물고기 올리기';
      btn.className = 'mc-btn w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 border-2 border-amber-200 text-white font-jua text-sm sm:text-base shadow-lg select-none touch-none';
    }
  } else if (bs.phase === 'roasting') {
    const pct = Math.min(100, (bs.roastElapsed / bs.roastBurnTime) * 100);
    const isCooked = bs.roastElapsed >= bs.roastCookMin;
    const isDanger = bs.roastElapsed >= bs.roastBurnTime - 1.45;
    if (phaseEl) phaseEl.textContent = isDanger ? '🚨 타기 직전!! 어서 꺼내세요!' : (isCooked ? '✨ 노릇노릇 잘 익었어요!' : '🔥 지글지글 굽는 중...');
    if (hintEl) {
      hintEl.textContent = isDanger
        ? '조금만 더 두면 까맣게 타서 못 먹어요! 지금 당장 꺼내세요!'
        : (isCooked ? '황금빛으로 맛있게 익었어요! 타기 전에 불에서 꺼내세요!' : '아직 덜 익었어요! 노릇노릇 초록 구간이 될 때까지 기다리세요!');
    }
    if (cookBar) cookBar.style.width = `${pct.toFixed(1)}%`;
    if (cookLbl) {
      const remain = Math.max(0, bs.roastBurnTime - bs.roastElapsed).toFixed(1);
      cookLbl.textContent = isCooked ? `✨ 꺼내기 가능! (타기까지 ${remain}초)` : `굽는 중... ${bs.roastElapsed.toFixed(1)}초`;
    }
    if (btn) {
      btn.disabled = false;
      btn.textContent = isCooked ? '🍽️ 노릇한 물고기 지금 꺼내기!' : '⏳ 아직 덜 익었어요 (기다리기)';
      btn.className = isDanger
        ? 'mc-btn w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 border-2 border-amber-200 text-white font-jua text-sm sm:text-base shadow-lg select-none touch-none animate-bounce'
        : (isCooked
          ? 'mc-btn w-full py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 border-2 border-white text-slate-950 font-jua text-sm sm:text-base shadow-lg select-none touch-none animate-pulse'
          : 'mc-btn w-full py-2.5 rounded-xl bg-amber-600/80 border-2 border-amber-300 text-amber-100 font-jua text-sm sm:text-base shadow select-none touch-none');
    }
  } else if (bs.phase === 'eating') {
    if (phaseEl) phaseEl.textContent = '🐟💛 예수님과 행복한 아침 식사';
    if (hintEl) hintEl.textContent = '모닥불 옆에서 예수님과 맛있게 구운 물고기를 나누어 먹고 있어요!';
    if (cookBar) cookBar.style.width = '70%';
    if (cookLbl) cookLbl.textContent = '✨ 완벽하게 구워졌어요!';
    if (btn) {
      btn.disabled = true;
      btn.textContent = '😋 예수님과 맛있게 먹는 중...';
      btn.className = 'mc-btn w-full py-2.5 rounded-xl bg-amber-400 border-2 border-white text-slate-950 font-jua text-sm sm:text-base shadow select-none touch-none';
    }
  }
}

window.miracleBreakfastCastStart = function () {
  if (!miracleActiveFieldEvent || miracleActiveFieldEvent.type !== 'breakfast_fish_cook') return;
  const bs = miracleActiveFieldEvent.breakfastState;
  if (!bs || bs.phase !== 'cast_ready') return;
  bs.phase = 'charging';
  bs.isCharging = true;
  bs.power = 0.06;
  bs.powerDir = 1;
  playSfx('switch');
  syncMiracleBreakfastUI();
};

window.miracleBreakfastCastRelease = function (forcedPower) {
  if (!miracleActiveFieldEvent || miracleActiveFieldEvent.type !== 'breakfast_fish_cook') return;
  const bs = miracleActiveFieldEvent.breakfastState;
  if (!bs || (bs.phase !== 'charging' && forcedPower === undefined)) return;
  bs.isCharging = false;
  if (typeof forcedPower === 'number') {
    bs.power = Math.max(0.05, Math.min(1.0, forcedPower));
  }
  // 힘(0..1)에 따라 6m ~ 22m까지 투척! 멀리 던질수록 입질 대기 시간이 크게 짧아지고 잘 잡힘!
  bs.castDist = 6.0 + bs.power * 16.0;
  bs.castTargetX = bs.standPos.x - bs.castDist;
  bs.castTargetZ = bs.standPos.z + (Math.random() - 0.5) * 2.4;
  bs.castAnimTimer = 0;
  bs.phase = 'casting';

  // 멀리 던질수록 입질이 훨씬 빠르고 잘 옴!
  if (bs.power >= 0.72) {
    bs.biteWaitTimer = 0.95 + Math.random() * 0.95; // 원거리 대어 입질 (약 1~1.9초)
  } else if (bs.power >= 0.38) {
    bs.biteWaitTimer = 2.0 + Math.random() * 1.3;   // 중거리 입질 (약 2~3.3초)
  } else {
    bs.biteWaitTimer = 3.6 + Math.random() * 1.8;   // 근거리 느린 입질 (약 3.6~5.4초)
  }

  playSfx('jump');
  syncMiracleBreakfastUI();
};

window.miracleBreakfastAction = function () {
  if (!miracleActiveFieldEvent || miracleActiveFieldEvent.type !== 'breakfast_fish_cook') return;
  const bs = miracleActiveFieldEvent.breakfastState;
  if (!bs) return;

  if (bs.phase === 'bite_timing') {
    const inZone = (bs.needlePos >= bs.zoneLeft && bs.needlePos <= (bs.zoneLeft + bs.zoneWidth));
    if (inZone) {
      bs.caughtCount++;
      bs.phase = 'fish_caught';
      bs.catchAnimTimer = 0;
      if (bs.bobberGrp) bs.bobberGrp.visible = false;
      if (bs.lineMesh) bs.lineMesh.visible = false;
      if (bs.leapFish) {
        bs.leapFish.visible = true;
        bs.leapFish.position.set(bs.castTargetX, -0.25, bs.castTargetZ);
      }
      playSfx('rescue');
      showToast(`🐟✨ 월척!! 갈릴리 물고기 잡기 성공! (${bs.caughtCount}/${bs.reqFish})`);
      syncMiracleBreakfastUI();
      syncMiracleMissionStatusPanel();
    } else {
      playSfx('wrong');
      bs.phase = 'cast_ready';
      bs.power = 0;
      if (bs.bobberGrp) bs.bobberGrp.visible = false;
      if (bs.lineMesh) bs.lineMesh.visible = false;
      showToast('💨 앗, 바늘이 초록 구간을 벗어나 물고기가 도망쳤어요! 다시 던져 보세요!');
      syncMiracleBreakfastUI();
    }
    return;
  }

  if (bs.phase === 'cook_ready') {
    bs.phase = 'roasting';
    bs.roastElapsed = 0;
    if (bs.campfire && bs.campfire.userData && bs.campfire.userData.roastFishGrp) {
      bs.campfire.userData.roastFishGrp.visible = true;
      if (bs.campfire.userData.roastFishMat) bs.campfire.userData.roastFishMat.color.setHex(0x93c5fd);
    }
    playSfx('build');
    showToast('🔥 숯불 위에 물고기를 올렸어요! 노릇노릇 익으면 타기 전에 꺼내세요!');
    syncMiracleBreakfastUI();
    syncMiracleMissionStatusPanel();
    return;
  }

  if (bs.phase === 'roasting') {
    if (bs.roastElapsed < bs.roastCookMin) {
      playSfx('step');
      showToast('🔥 아직 덜 익었어요! 노릇노릇 초록 구간이 될 때까지 조금 더 구워 주세요!');
      return;
    }
    // 황금빛 적정 시간(3.5~7.5초) 안에 꺼내기 성공 → 예수님과 맛있게 먹기!
    bs.phase = 'eating';
    bs.eatTimer = 0;
    if (bs.campfire && bs.campfire.userData && bs.campfire.userData.roastFishGrp) {
      bs.campfire.userData.roastFishGrp.visible = false;
    }
    if (bs.mealPlatterGrp) bs.mealPlatterGrp.visible = true;
    playSfx('clear');
    showToast('🐟✨ 노릇노릇 완벽하게 구웠어요! 예수님과 모닥불 옆에서 맛있게 아침 식사를 나누어요!');
    syncMiracleBreakfastUI();
    syncMiracleMissionStatusPanel();
  }
};

window.miracleBreakfastPointerDown = function (ev) {
  if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();
  _miracleBfHandledPointer = true;
  if (!miracleActiveFieldEvent || miracleActiveFieldEvent.type !== 'breakfast_fish_cook') return;
  const bs = miracleActiveFieldEvent.breakfastState;
  if (!bs) return;
  if (bs.phase === 'cast_ready') {
    window.miracleBreakfastCastStart();
  } else {
    window.miracleBreakfastAction();
  }
};

window.miracleBreakfastPointerUp = function (ev) {
  if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();
  if (!miracleActiveFieldEvent || miracleActiveFieldEvent.type !== 'breakfast_fish_cook') return;
  const bs = miracleActiveFieldEvent.breakfastState;
  if (bs && bs.phase === 'charging') {
    window.miracleBreakfastCastRelease();
  }
};

window.miracleBreakfastClickFallback = function () {
  if (_miracleBfHandledPointer) {
    _miracleBfHandledPointer = false;
    return;
  }
  if (!miracleActiveFieldEvent || miracleActiveFieldEvent.type !== 'breakfast_fish_cook') return;
  const bs = miracleActiveFieldEvent.breakfastState;
  if (!bs) return;
  if (bs.phase === 'cast_ready') {
    window.miracleBreakfastCastStart();
    window.miracleBreakfastCastRelease(0.65);
  } else if (bs.phase === 'charging') {
    window.miracleBreakfastCastRelease();
  } else {
    window.miracleBreakfastAction();
  }
};

if (!window.__miracleBreakfastKeyBound) {
  window.__miracleBreakfastKeyBound = true;
  window.addEventListener('keydown', (e) => {
    if (e.code !== 'Space' || e.repeat) return;
    if (!miracleActiveFieldEvent || miracleActiveFieldEvent.type !== 'breakfast_fish_cook') return;
    if (miracleDialogState && miracleDialogState.active) return;
    const bs = miracleActiveFieldEvent.breakfastState;
    if (!bs) return;
    e.preventDefault();
    if (bs.phase === 'cast_ready') window.miracleBreakfastCastStart();
    else window.miracleBreakfastAction();
  });
  window.addEventListener('keyup', (e) => {
    if (e.code !== 'Space') return;
    if (!miracleActiveFieldEvent || miracleActiveFieldEvent.type !== 'breakfast_fish_cook') return;
    const bs = miracleActiveFieldEvent.breakfastState;
    if (bs && bs.phase === 'charging') {
      e.preventDefault();
      window.miracleBreakfastCastRelease();
    }
  });
}

window.triggerMiracleSowerPlant = function () {
  if (!miracleActiveFieldEvent || miracleActiveFieldEvent.type !== 'sower_farm') return;
  const sf = miracleActiveFieldEvent.sowerState;
  if (!sf || sf.phase !== 'ready_to_sow') return;

  const btnWrap = document.getElementById('miracle-sower-btn-wrap');
  if (btnWrap) btnWrap.classList.add('hidden');

  sf.phase = 'sowing';
  sf.sowTimer = 0;
  playSfx('clear');

  // 밭 위로 흩뿌려지는 황금 씨앗 파티클 28개 생성
  sf.seedParticles = [];
  for (let i = 0; i < 28; i++) {
    const sm = createLowPolyMesh(
      new THREE.OctahedronGeometry(0.11, 0),
      i % 2 === 0 ? '#fde047' : '#f59e0b',
      sf.fx + (Math.random() - 0.5) * 5.8,
      sf.fy + 2.2 + Math.random() * 1.6,
      sf.fz + (Math.random() - 0.5) * 4.8,
      false
    );
    worldGroup.add(sm);
    miracleWorldMissionObjects.push({ mesh: sm });
    sf.seedParticles.push({
      mesh: sm,
      vy: -(1.8 + Math.random() * 1.6),
      targetY: sf.fy + 0.24
    });
  }
  syncMiracleMissionStatusPanel();
};

// =========================================================================
// [삭개오 7단계 미션] 3D 돈주머니 · 컷신 자막/버튼/게이지 UI · 드래그 금화 뿌리기 컨트롤러
// =========================================================================
function createZacchaeusMoneyPouchMesh() {
  const grp = new THREE.Group();
  const bagMat = new THREE.MeshStandardMaterial({ color: '#87522D', emissive: '#6D3F20', emissiveIntensity: 0.28, roughness: 0.80, flatShading: true });
  const rimMat = new THREE.MeshStandardMaterial({ color: '#6D3F20', emissive: '#4d2a13', emissiveIntensity: 0.24, roughness: 0.84, flatShading: true });
  const cordMat = new THREE.MeshStandardMaterial({ color: '#eab308', emissive: '#a16207', emissiveIntensity: 0.35, roughness: 0.55, flatShading: true });
  const coinMat = new THREE.MeshStandardMaterial({ color: '#fde047', emissive: '#ca8a04', emissiveIntensity: 0.45, roughness: 0.35, metalness: 0.25, flatShading: true });

  const sackGeo = new THREE.DodecahedronGeometry(0.42, 0);
  const sack = new THREE.Mesh(sackGeo, bagMat);
  sack.position.y = 0.34;
  sack.scale.set(1.12, 0.88, 1.08);
  sack.castShadow = true;

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.24, 0.22, 8), rimMat);
  neck.position.y = 0.68;
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.195, 0.195, 0.065, 8), cordMat);
  cord.position.y = 0.67;
  const flare = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.16, 0.16, 8), bagMat);
  flare.position.y = 0.80;

  const coinHeap = new THREE.Group();
  coinHeap.position.y = 0.84;
  [
    [0, 0.03, 0], [-0.09, 0.01, 0.06], [0.09, 0.02, 0.05],
    [-0.07, 0.02, -0.07], [0.08, 0.01, -0.06], [0.02, 0.07, 0.01]
  ].forEach(([cx, cy, cz], idx) => {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.082, 0.028, 8), coinMat);
    c.position.set(cx, cy, cz);
    c.rotation.set(0.25 * (idx % 2), idx * 0.8, 0.3 * ((idx % 3) - 1));
    coinHeap.add(c);
  });

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.54, 0.74, 24),
    new THREE.MeshBasicMaterial({ color: 0xfde047, side: THREE.DoubleSide, transparent: true, opacity: 0.82 })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.06;

  grp.add(sack, neck, cord, flare, coinHeap, ring);
  grp.userData.coinHeap = coinHeap;
  grp.userData.ring = ring;
  return grp;
}

function syncMiracleZacchaeusOverlayUI(fe) {
  const ui = document.getElementById('miracle-zacchaeus-ui');
  const dragLayer = document.getElementById('miracle-zac-drag-layer');
  const pouchHud = document.getElementById('miracle-zac-pouch-hud');
  const speechBox = document.getElementById('miracle-zac-speech-box');
  const speakerEl = document.getElementById('miracle-zac-speaker');
  const textEl = document.getElementById('miracle-zac-speech-text');
  const descendBtn = document.getElementById('miracle-zac-descend-btn');
  const pctEl = document.getElementById('miracle-zac-gauge-pct');
  const barEl = document.getElementById('miracle-zac-gauge-bar');
  const lblEl = document.getElementById('miracle-zac-gauge-label');
  const hintEl = document.getElementById('miracle-zac-drag-hint');
  if (!ui) return;

  if (!fe || !fe.cutsceneActive || fe.cutsceneType !== 'zacchaeus_story') {
    ui.classList.add('hidden');
    if (dragLayer) dragLayer.classList.add('hidden');
    return;
  }
  ui.classList.remove('hidden');

  const ph = fe.cutscenePhase;
  const zd = fe.zacchaeusData || {};

  if (ph === 'jesus_calls') {
    if (speechBox) speechBox.classList.remove('hidden');
    if (speakerEl) speakerEl.textContent = '✨ 예수님';
    if (textEl) textEl.textContent = '"삭개오씨, 어서 내려오세요"';
    if (descendBtn) descendBtn.classList.add('hidden');
    if (pouchHud) pouchHud.classList.add('hidden');
    if (dragLayer) dragLayer.classList.add('hidden');
  } else if (ph === 'zacchaeus_ready_descend') {
    if (speechBox) speechBox.classList.add('hidden');
    if (descendBtn) descendBtn.classList.remove('hidden');
    if (pouchHud) pouchHud.classList.add('hidden');
    if (dragLayer) dragLayer.classList.add('hidden');
  } else if (ph === 'descending') {
    if (speechBox) speechBox.classList.add('hidden');
    if (descendBtn) descendBtn.classList.add('hidden');
    if (pouchHud) pouchHud.classList.add('hidden');
    if (dragLayer) dragLayer.classList.add('hidden');
  } else if (ph === 'zacchaeus_confess') {
    if (speechBox) speechBox.classList.remove('hidden');
    if (speakerEl) speakerEl.textContent = '🌳 삭개오';
    if (textEl) textEl.textContent = '"소유의 절반을 가난한 자들에게 주겠습니다."';
    if (descendBtn) descendBtn.classList.add('hidden');
    if (pouchHud) pouchHud.classList.add('hidden');
    if (dragLayer) dragLayer.classList.add('hidden');
  } else if (ph === 'coin_drag_minigame') {
    if (speechBox) speechBox.classList.add('hidden');
    if (descendBtn) descendBtn.classList.add('hidden');
    if (pouchHud) pouchHud.classList.remove('hidden');
    if (dragLayer) dragLayer.classList.remove('hidden');

    const gPct = Math.max(50, Math.min(100, zd.gaugePct !== undefined ? zd.gaugePct : 100));
    const remToss = Math.max(0, Math.round((gPct - 50) / 10));
    if (pctEl) pctEl.textContent = `${gPct}%`;
    if (barEl) barEl.style.width = `${gPct}%`;
    if (lblEl) lblEl.textContent = remToss > 0 ? `남은 나눔: ${remToss}회` : '🎉 소유의 절반(50%) 달성!';
    if (hintEl) {
      hintEl.textContent = remToss > 0
        ? '돈주머니를 눌러 군중 쪽으로 드래그해서 나누어 주세요!'
        : '✨ 가난한 이웃들과 기쁘게 나누었어요!';
    }
  } else if (ph === 'jesus_blessing') {
    if (speechBox) speechBox.classList.remove('hidden');
    if (speakerEl) speakerEl.textContent = '✨ 예수님';
    if (textEl) textEl.textContent = '"오늘 이 집은 구원 받았습니다. 오늘 당신의 집에서 머물겠어요"';
    if (descendBtn) descendBtn.classList.add('hidden');
    if (pouchHud) pouchHud.classList.add('hidden');
    if (dragLayer) dragLayer.classList.add('hidden');
  }
}

function getZacchaeusDragWorldPoint(clientX, clientY, planeY, zd) {
  const vw = Math.max(1, window.innerWidth || 1280);
  const vh = Math.max(1, window.innerHeight || 720);
  if (typeof camera !== 'undefined' && camera && typeof THREE.Raycaster === 'function') {
    const ndc = new THREE.Vector2((clientX / vw) * 2 - 1, -(clientY / vh) * 2 + 1);
    const rc = new THREE.Raycaster();
    rc.setFromCamera(ndc, camera);
    if (rc.ray.direction.y < -0.05) {
      const t = (planeY - rc.ray.origin.y) / rc.ray.direction.y;
      if (t > 0 && t < 90) {
        return new THREE.Vector3(
          rc.ray.origin.x + rc.ray.direction.x * t,
          planeY,
          rc.ray.origin.z + rc.ray.direction.z * t
        );
      }
    }
  }
  const start = zd.dragStart || { x: vw * 0.5, y: vh * 0.5 };
  const sdx = clientX - start.x;
  const sdy = clientY - start.y;
  const slen = Math.hypot(sdx, sdy) || 1;
  const fwd = new THREE.Vector3();
  if (camera && typeof camera.getWorldDirection === 'function') camera.getWorldDirection(fwd);
  fwd.y = 0;
  if (fwd.lengthSq() < 1e-4) fwd.set(0, 0, -1);
  fwd.normalize();
  const right = new THREE.Vector3(-fwd.z, 0, fwd.x);
  const center = zd.confessPos || new THREE.Vector3();
  return center.clone()
    .addScaledVector(right, (sdx / slen) * 3.8)
    .addScaledVector(fwd, (-sdy / slen) * 3.8);
}

function launchZacchaeusGoldCoinToss(fe, aimWorldPt) {
  const zd = fe.zacchaeusData;
  if (!zd || zd.reachedHalf) return;

  const center = zd.confessPos || zd.zacGroup.position;
  const dxAim = aimWorldPt.x - center.x;
  const dzAim = aimWorldPt.z - center.z;
  const aimAng = Math.atan2(dxAim, dzAim);

  // 방향에 가장 가까운 군중 3명 선별 (군중 방향으로 자연스럽게 날아가도록)
  const list = Array.isArray(zd.crowdMembers) ? zd.crowdMembers.slice() : [];
  list.sort((a, b) => {
    const da = Math.hypot(a.mesh.position.x - aimWorldPt.x, a.mesh.position.z - aimWorldPt.z);
    const db = Math.hypot(b.mesh.position.x - aimWorldPt.x, b.mesh.position.z - aimWorldPt.z);
    return da - db;
  });
  const chosenTargets = list.slice(0, 3);

  const origin = zd.pouchPos ? zd.pouchPos.clone() : center.clone();
  origin.y += 0.82;

  for (let i = 0; i < 7; i++) {
    const cMesh = createLowPolyMesh(new THREE.CylinderGeometry(0.115, 0.115, 0.034, 8), '#fde047', origin.x, origin.y, origin.z, false);
    if (cMesh.material && cMesh.material.emissive) {
      cMesh.material.emissive.set('#ca8a04');
      cMesh.material.emissiveIntensity = 0.45;
    }
    worldGroup.add(cMesh);

    let destPt;
    let targetMember = null;
    if (chosenTargets.length > 0 && i < 6) {
      targetMember = chosenTargets[i % chosenTargets.length];
      destPt = new THREE.Vector3(
        targetMember.mesh.position.x + (Math.random() - 0.5) * 0.55,
        targetMember.mesh.position.y + 0.95,
        targetMember.mesh.position.z + (Math.random() - 0.5) * 0.55
      );
    } else {
      const spAng = aimAng + (Math.random() - 0.5) * 0.55;
      const rad = 2.8 + Math.random() * 1.4;
      const tx = center.x + Math.sin(spAng) * rad;
      const tz = center.z + Math.cos(spAng) * rad;
      destPt = new THREE.Vector3(tx, getMiracleOpenWorldGroundHeight(tx, tz) + 0.75, tz);
    }

    zd.flyingCoins.push({
      mesh: cMesh,
      startPos: origin.clone(),
      endPos: destPt,
      targetMember,
      elapsed: -i * 0.035,
      duration: 0.56 + (i % 3) * 0.08,
      arcHeight: 1.55 + Math.random() * 0.75,
      done: false
    });
  }

  zd.throwTargetYaw = aimAng;
  zd.throwAnimTimer = 0.58;
  zd.tossCount = (zd.tossCount || 0) + 1;
  zd.gaugePct = Math.max(50, (zd.gaugePct || 100) - 10);

  if (zd.pouchMesh) {
    const s = THREE.MathUtils.lerp(0.76, 1.08, (zd.gaugePct - 50) / 50);
    zd.pouchMesh.scale.set(s * 1.12, s * 0.85, s * 1.12);
  }
  if (zd.gaugePct <= 50) {
    zd.reachedHalf = true;
    zd.finishDelay = 0.95;
  }

  playSfx('clock');
  syncMiracleZacchaeusOverlayUI(fe);
  syncMiracleMissionStatusPanel();
}

function bindMiracleZacchaeusDragEvents() {
  if (window.__miracleZacDragEventsBound) return;
  window.__miracleZacDragEventsBound = true;

  const layer = document.getElementById('miracle-zac-drag-layer');
  if (!layer) return;

  const clearVisual = () => {
    const svg = document.getElementById('miracle-zac-drag-svg');
    const coinEl = document.getElementById('miracle-zac-drag-coin');
    if (svg) svg.innerHTML = '';
    if (coinEl) coinEl.classList.add('hidden');
  };

  const renderVisual = (startPt, currPt) => {
    const svg = document.getElementById('miracle-zac-drag-svg');
    const coinEl = document.getElementById('miracle-zac-drag-coin');
    const vw = Math.max(1, window.innerWidth || 1280);
    const vh = Math.max(1, window.innerHeight || 720);
    if (svg) {
      svg.setAttribute('viewBox', `0 0 ${vw} ${vh}`);
      const midX = (startPt.x + currPt.x) * 0.5;
      const arcLift = Math.min(95, Math.hypot(currPt.x - startPt.x, currPt.y - startPt.y) * 0.28 + 24);
      const midY = (startPt.y + currPt.y) * 0.5 - arcLift;
      svg.innerHTML = `
        <path d="M ${startPt.x.toFixed(1)} ${startPt.y.toFixed(1)} Q ${midX.toFixed(1)} ${midY.toFixed(1)} ${currPt.x.toFixed(1)} ${currPt.y.toFixed(1)}"
              stroke="#facc15" stroke-width="5" stroke-dasharray="10 7" fill="none" stroke-linecap="round" opacity="0.92"/>
        <circle cx="${currPt.x.toFixed(1)}" cy="${currPt.y.toFixed(1)}" r="20"
                stroke="#fef08a" stroke-width="3" fill="rgba(250,204,21,0.24)"/>
      `;
    }
    if (coinEl) {
      coinEl.style.left = `${currPt.x}px`;
      coinEl.style.top = `${currPt.y}px`;
      coinEl.classList.remove('hidden');
    }
  };

  layer.addEventListener('pointerdown', (e) => {
    const fe = (typeof miracleActiveFieldEvent !== 'undefined') ? miracleActiveFieldEvent : null;
    if (!fe || !fe.cutsceneActive || fe.cutsceneType !== 'zacchaeus_story' || fe.cutscenePhase !== 'coin_drag_minigame') return;
    const zd = fe.zacchaeusData;
    if (!zd || zd.reachedHalf || zd.dragging) return;

    const pScreen = zd.pouchScreenPos || { x: window.innerWidth * 0.5, y: window.innerHeight * 0.55 };
    const dist = Math.hypot(e.clientX - pScreen.x, e.clientY - pScreen.y);
    if (dist > 155) {
      const anc = document.getElementById('miracle-zac-pouch-anchor');
      if (anc) {
        anc.style.transform = 'translate(-50%, -50%) scale(1.16)';
        setTimeout(() => { if (anc) anc.style.transform = 'translate(-50%, -50%) scale(1)'; }, 180);
      }
      return;
    }

    e.preventDefault();
    zd.dragging = true;
    zd.dragPointerId = e.pointerId;
    zd.dragStart = { x: pScreen.x, y: pScreen.y };
    zd.dragCurr = { x: e.clientX, y: e.clientY };
    try { layer.setPointerCapture(e.pointerId); } catch (err) {}
    renderVisual(zd.dragStart, zd.dragCurr);
  });

  window.addEventListener('pointermove', (e) => {
    const fe = (typeof miracleActiveFieldEvent !== 'undefined') ? miracleActiveFieldEvent : null;
    if (!fe || fe.cutsceneType !== 'zacchaeus_story' || !fe.zacchaeusData) return;
    const zd = fe.zacchaeusData;
    if (!zd.dragging || e.pointerId !== zd.dragPointerId) return;
    e.preventDefault();
    zd.dragCurr = { x: e.clientX, y: e.clientY };
    renderVisual(zd.dragStart, zd.dragCurr);
  }, { passive: false });

  const endDrag = (e) => {
    const fe = (typeof miracleActiveFieldEvent !== 'undefined') ? miracleActiveFieldEvent : null;
    if (!fe || fe.cutsceneType !== 'zacchaeus_story' || !fe.zacchaeusData) return;
    const zd = fe.zacchaeusData;
    if (!zd.dragging || e.pointerId !== zd.dragPointerId) return;
    zd.dragging = false;
    zd.dragPointerId = null;
    clearVisual();

    if (fe.cutscenePhase === 'coin_drag_minigame' && !zd.reachedHalf) {
      const dx = e.clientX - zd.dragStart.x;
      const dy = e.clientY - zd.dragStart.y;
      if (Math.hypot(dx, dy) >= 34) {
        const planeY = ((zd.confessPos ? zd.confessPos.y : 0) + 0.65);
        const aimPt = getZacchaeusDragWorldPoint(e.clientX, e.clientY, planeY, zd);
        launchZacchaeusGoldCoinToss(fe, aimPt);
      }
    }
  };
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);

  window.addEventListener('keydown', (e) => {
    const fe = (typeof miracleActiveFieldEvent !== 'undefined') ? miracleActiveFieldEvent : null;
    if (!fe || !fe.cutsceneActive || fe.cutsceneType !== 'zacchaeus_story') return;
    if (fe.cutscenePhase === 'zacchaeus_ready_descend' && (e.code === 'Space' || e.code === 'Enter')) {
      e.preventDefault();
      if (typeof window.triggerMiracleZacchaeusDescend === 'function') window.triggerMiracleZacchaeusDescend();
    }
  });
}

window.triggerMiracleZacchaeusDescend = function () {
  if (!miracleActiveFieldEvent || miracleActiveFieldEvent.cutsceneType !== 'zacchaeus_story') return;
  if (miracleActiveFieldEvent.cutscenePhase !== 'zacchaeus_ready_descend') return;
  miracleActiveFieldEvent.cutscenePhase = 'descending';
  miracleActiveFieldEvent.cutsceneTimer = 0;
  const zd = miracleActiveFieldEvent.zacchaeusData;
  if (zd) {
    const jPos = zd.jesusPos;
    const pPos = zd.perchPos;
    const tx = pPos.x - jPos.x;
    const tz = pPos.z - jPos.z;
    const len = Math.hypot(tx, tz) || 1;
    const cx = jPos.x + (tx / len) * 1.95;
    const cz = jPos.z + (tz / len) * 1.95;
    zd.confessPos = new THREE.Vector3(cx, getMiracleOpenWorldGroundHeight(cx, cz), cz);
    const cd = zd.perchTree && zd.perchTree.climbDownWorldPos
      ? zd.perchTree.climbDownWorldPos.clone()
      : new THREE.Vector3((pPos.x + cx) * 0.5, getMiracleOpenWorldGroundHeight((pPos.x + cx) * 0.5, (pPos.z + cz) * 0.5), (pPos.z + cz) * 0.5);
    cd.y = getMiracleOpenWorldGroundHeight(cd.x, cd.z);
    zd.climbDownPos = cd;
  }
  playSfx('jump');
  syncMiracleZacchaeusOverlayUI(miracleActiveFieldEvent);
  syncMiracleMissionStatusPanel();
};

function setFlatYawToward(obj, targetX, targetZ) {
  if (!obj || !obj.position) return 0;
  const yaw = Math.atan2(targetX - obj.position.x, targetZ - obj.position.z);
  obj.rotation.set(0, yaw, 0);
  return yaw;
}

function startZacchaeusStoryCutscene(fe) {
  if (!fe || fe.cutsceneActive) return;
  const zd = fe.zacchaeusData;
  if (!zd) {
    finishMiracleFieldEvent(fe.spot);
    return;
  }
  ensureMiracleCustomUI();
  bindMiracleZacchaeusDragEvents();
  if (typeof hideMissionGuideBubbleImmediately === 'function') hideMissionGuideBubbleImmediately();

  const joyEl = document.getElementById('joystick-zone');
  const camBar = document.getElementById('cam-bottom-bar');
  const actEl = document.getElementById('action-zone');
  zd._savedHud = {
    joy: (joyEl && joyEl.style.display && joyEl.style.display !== 'none') ? joyEl.style.display : 'block',
    camBar: (camBar && camBar.style.display && camBar.style.display !== 'none') ? camBar.style.display : 'flex',
    act: (actEl && actEl.style.display && actEl.style.display !== 'none') ? actEl.style.display : 'flex'
  };
  if (joyEl) joyEl.style.display = 'none';
  if (camBar) camBar.style.display = 'none';
  if (actEl) actEl.style.display = 'none';
  zd._cutsceneEntered = true;

  if (typeof joyX !== 'undefined') joyX = 0;
  if (typeof joyY !== 'undefined') joyY = 0;
  if (typeof currentMoveSpeed !== 'undefined') currentMoveSpeed = 0;
  if (typeof keys !== 'undefined' && keys) Object.keys(keys).forEach(k => { keys[k] = false; });

  // 플레이어 캐릭터가 예수님-나무 사이 및 카메라 촬영 전면(+stageSide)을 가리지 않도록 반대편 배경으로 이동
  const midX = (zd.jesusPos.x + zd.perchPos.x) * 0.5;
  const midZ = (zd.jesusPos.z + zd.perchPos.z) * 0.5;
  if (typeof playerPos !== 'undefined' && playerPos) {
    const dirX = zd.perchPos.x - zd.jesusPos.x;
    const dirZ = zd.perchPos.z - zd.jesusPos.z;
    const dLen = Math.hypot(dirX, dirZ) || 1;
    const sSign = zd.stageSideSign || 1;
    const bgSideX = -(dirZ / dLen) * sSign;
    const bgSideZ = (dirX / dLen) * sSign;
    const pxNew = zd.jesusPos.x - (dirX / dLen) * 2.4 + bgSideX * 2.8;
    const pzNew = zd.jesusPos.z - (dirZ / dLen) * 2.4 + bgSideZ * 2.8;
    playerPos.set(pxNew, getMiracleOpenWorldGroundHeight(pxNew, pzNew), pzNew);
    if (typeof playerGroup !== 'undefined' && playerGroup) {
      playerGroup.position.copy(playerPos);
      const lookYaw = setFlatYawToward(playerGroup, midX, midZ);
      if (typeof playerFacing !== 'undefined') playerFacing = lookYaw;
    }
  }

  if (fe.targetZone && fe.targetZone.label) fe.targetZone.label.style.opacity = '0';

  fe.cutsceneActive = true;
  fe.cutsceneCameraActive = true;
  fe.cutsceneType = 'zacchaeus_story';
  fe.cutscenePhase = 'jesus_calls';
  fe.cutsceneTimer = 0;

  playSfx('switch');
  if (typeof speakText === 'function') speakText('삭개오씨, 어서 내려오세요');
  syncMiracleZacchaeusOverlayUI(fe);
  syncMiracleMissionStatusPanel();
}

// 컷신 카메라 ↔ 대상 직선 시야 통로에 군중·플레이어가 들어오면 배경 쪽으로 비켜 세우는 실시간 시야 보정
function keepZacchaeusCameraLineClear(camPos, targetPos, zd, dt, snapInstant = false) {
  if (!camPos || !targetPos || !zd) return;
  const dx = targetPos.x - camPos.x;
  const dz = targetPos.z - camPos.z;
  const abLenSq = dx * dx + dz * dz;
  if (abLenSq < 0.04) return;

  const jPos = zd.jesusPos;
  const pPos = zd.perchPos;
  const fx = pPos.x - jPos.x;
  const fz = pPos.z - jPos.z;
  const fLen = Math.hypot(fx, fz) || 1;
  const sSign = zd.stageSideSign || 1;
  // 촬영 전면(+stageSide)의 정반대인 배경(-stageSide) + 예수님 뒤쪽 방향
  const escX = (-(fz / fLen) * sSign) * 0.85 - (fx / fLen) * 0.52;
  const escZ = ((fx / fLen) * sSign) * 0.85 - (fz / fLen) * 0.52;
  const escLen = Math.hypot(escX, escZ) || 1;
  const ex = escX / escLen;
  const ez = escZ / escLen;

  const stepAlpha = snapInstant ? 1.0 : Math.min(1, (dt || 0.016) * 11.0);
  const crowd = Array.isArray(zd.crowdMembers) ? zd.crowdMembers : [];

  crowd.forEach(cm => {
    if (!cm || !cm.mesh) return;
    const m = cm.mesh;
    const px = m.position.x;
    const pz = m.position.z;
    const dCam = Math.hypot(px - camPos.x, pz - camPos.z);
    const t = ((px - camPos.x) * dx + (pz - camPos.z) * dz) / abLenSq;
    const cx = camPos.x + t * dx;
    const cz = camPos.z + t * dz;
    const perpDist = Math.hypot(px - cx, pz - cz);

    if ((t > -0.15 && t < 1.08 && perpDist < 1.48) || dCam < 1.95) {
      let nx = cx + ex * 2.25;
      let nz = cz + ez * 2.25;
      if (Math.hypot(nx - targetPos.x, nz - targetPos.z) < 2.15) {
        nx = targetPos.x + ex * 2.75;
        nz = targetPos.z + ez * 2.75;
      }
      m.position.x = THREE.MathUtils.lerp(px, nx, stepAlpha);
      m.position.z = THREE.MathUtils.lerp(pz, nz, stepAlpha);
      m.position.y = getMiracleOpenWorldGroundHeight(m.position.x, m.position.z);
    }
  });
}

function syncMiracleMissionStatusPanel() {
  if (typeof window.updateMiracleMissionStatusUI !== 'function') return;
  if (!miracleActiveFieldEvent) {
    if (typeof window.hideMiracleMissionStatusUI === 'function') window.hideMiracleMissionStatusUI();
    return;
  }
  const fe = miracleActiveFieldEvent;
  const ev = fe.spot;
  const shortTitle = (ev.title || '미션 진행중').replace(/^[^\s]+\s*/, '');

  if (fe.type === 'collect_deliver') {
    const foundTotal = fe.collected + fe.carrying;
    const goalText = fe.carrying > 0
      ? (ev.deliverToUpperRoom
        ? '외벽 계단으로 올라가 2층 다락방 안에 수건을 두세요!'
        : (ev.deliverToInnBed
          ? '여관 안으로 들어가 병상 옆 다친 이웃에게 전달하세요!'
          : (ev.multiRandomLaySpots
            ? '예루살렘 성문 앞 표시된 자리에 종려가지를 까세요!'
            : `${ev.targetLabel || '목표 지점'}에 가져다주세요!`)))
      : (ev.allowRooftopSpawn
        ? `마을·건물 2층 옥상 곳곳에서 ${ev.itemLabel || '물품'}을(를) 찾으세요!`
        : `마을·야외 곳곳에서 ${ev.itemLabel || '물품'}을(를) 찾으세요!`);
    window.updateMiracleMissionStatusUI({
      title: `✨ ${shortTitle}`,
      goal: goalText,
      progressText: `찾음 ${foundTotal}/${fe.required} · 완료 ${fe.collected}/${fe.required}`,
      extraText: fe.carrying > 0 ? `🎒 들고 있음 ${fe.carrying}개` : `🔍 남은 개수 ${Math.max(0, fe.required - foundTotal)}개`
    });
  } else if (fe.type === 'sower_farm' && fe.sowerState) {
    const sf = fe.sowerState;
    let goal = '';
    let progressText = '';
    let extraText = '';
    if (sf.phase === 'find_field') {
      const fd = Math.round(Math.hypot(playerPos.x - sf.fx, playerPos.z - sf.fz));
      goal = `⛰️ ${sf.areaName} 근처의 밭 구역을 찾아가세요!`;
      progressText = '1단계: 산 근처 밭 찾기';
      extraText = `거리 ${fd}m`;
    } else if (sf.phase === 'collect_seeds') {
      goal = `🧺 주변과 건물 2층 옥상에서 씨앗 바구니 ${sf.seedTotal}개를 모으세요!`;
      progressText = `2단계: 씨앗 바구니 ${sf.seedsCollected}/${sf.seedTotal}`;
      extraText = `🔍 남은 바구니 ${Math.max(0, sf.seedTotal - sf.seedsCollected)}개`;
    } else if (sf.phase === 'clear_rocks') {
      goal = '🪨 밭으로 돌아가 돌멩이를 가까이 걸어가 모두 치우세요!';
      progressText = `3단계: 돌 제거 ${sf.rocksCleared}/${sf.rocks.length}`;
      extraText = '밭 안의 바위를 치우는 중';
    } else if (sf.phase === 'clear_thorns') {
      goal = '🌿 밭 안의 가시덤불과 잡초를 모두 뽑아 제거하세요!';
      progressText = `4단계: 가시·잡초 ${sf.thornsCleared}/${sf.thorns.length}`;
      extraText = '거친 가시덤불을 제거 중';
    } else if (sf.phase === 'level_soil') {
      goal = '🪴 울퉁불퉁한 흙덩이를 밟아 부드러운 좋은 땅으로 고르세요!';
      progressText = `5단계: 땅 고르기 ${sf.moundsLeveled}/${sf.mounds.length}`;
      extraText = '부드러운 옥토 이랑 만드는 중';
    } else if (sf.phase === 'ready_to_sow') {
      goal = '🌱 좋은 땅이 완성되었어요! 아래 [씨앗 뿌리기] 버튼을 누르세요!';
      progressText = '6단계: 씨앗 뿌리기 준비 완료!';
      extraText = '👇 하단 초록 버튼을 클릭!';
    } else {
      goal = '🌱✨ 좋은 땅에 말씀의 씨앗을 뿌리고 있어요!';
      progressText = '파종 중...';
      extraText = '🌾 곧 곡식이 자라납니다!';
    }
    window.updateMiracleMissionStatusUI({
      title: `🌱 ${shortTitle}`,
      goal,
      progressText,
      extraText
    });
  } else if (fe.type === 'mustard_grow' && fe.mustardState) {
    const ms = fe.mustardState;
    let goal = '';
    let progressText = '';
    let extraText = '';
    if (ms.phase === 'find_seed') {
      const sd = ms.seedObj ? Math.round(Math.hypot(playerPos.x - ms.seedObj.pos.x, playerPos.z - ms.seedObj.pos.z)) : 0;
      goal = '🔍 반짝이는 황금 빛 표시를 따라 아주 작은 겨자씨 한 알을 주우세요!';
      progressText = '1단계: 아주 작은 겨자씨 찾기';
      extraText = `거리 ${sd}m`;
    } else if (ms.phase === 'plant_seed') {
      const pd = Math.round(Math.hypot(playerPos.x - ms.fx, playerPos.z - ms.fz));
      goal = '🌱 주운 겨자씨를 돌 테두리 흙밭에 가까이 가서 심으세요!';
      progressText = '2단계: 흙밭에 겨자씨 심기';
      extraText = `거리 ${pd}m`;
    } else if (ms.phase === 'find_water') {
      const wd = ms.waterObj ? Math.round(Math.hypot(playerPos.x - ms.waterObj.pos.x, playerPos.z - ms.waterObj.pos.z)) : 0;
      goal = '💧 심은 겨자씨에 부어줄 맑은 물 항아리를 찾으세요!';
      progressText = '3단계: 맑은 물 찾기';
      extraText = `거리 ${wd}m`;
    } else if (ms.phase === 'pour_water') {
      const pd = Math.round(Math.hypot(playerPos.x - ms.fx, playerPos.z - ms.fz));
      goal = '💧 맑은 물 항아리를 들고 흙밭으로 돌아가 물을 부어 주세요!';
      progressText = '4단계: 겨자씨에 물 붓기';
      extraText = `🎒 물 항아리 들고 있음 · 거리 ${pd}m`;
    } else {
      goal = '💧✨ 심은 겨자씨에 맑은 물을 듬뿍 붓고 있어요!';
      progressText = '물 주는 중...';
      extraText = '🌼 5분 동안 풍성한 관목으로 자라납니다!';
    }
    window.updateMiracleMissionStatusUI({
      title: `🌼 ${shortTitle}`,
      goal,
      progressText,
      extraText
    });
  } else if (fe.type === 'escort_guide') {
    const td = fe.targetZone ? Math.round(Math.hypot(playerPos.x - fe.targetZone.pos.x, playerPos.z - fe.targetZone.pos.z)) : 0;
    window.updateMiracleMissionStatusUI({
      title: `👣 ${shortTitle}`,
      goal: ev.id === 'ev_paralytic'
        ? '두 친구와 들것을 메고 오른쪽 외벽 계단으로 올라가 옥상 친구들과 합류하세요!'
        : (ev.randomTreeGoal ? '멀리 있는 나무 아래 계신 예수님께 아이들을 인도하세요!' : `${ev.goalLabel}까지 동행하세요!`),
      progressText: `남은 거리 ${td}m`,
      extraText: fe.cutsceneActive ? '🎬 컷신 진행 중...' : '👣 일행과 동행 중'
    });
  } else if (fe.type === 'follow_messenger') {
    const maxD = ev.maxFollowDist || 15.0;
    const curD = fe.messenger ? Math.hypot(playerPos.x - fe.messenger.mesh.position.x, playerPos.z - fe.messenger.mesh.position.z) : 0;
    const ratio = Math.max(0, 1 - curD / maxD);
    window.updateMiracleMissionStatusUI({
      title: `⛲ ${shortTitle}`,
      goal: '수가성 여인이 주민 3명에게 소식을 전할 때 가까이 따라가세요!',
      progressText: `전달 ${fe.deliveredCount || 0} / ${fe.required}명`,
      extraText: curD > maxD * 0.7 ? `⚠️ 멀어지면 실패! (${curD.toFixed(1)}m)` : `거리 ${curD.toFixed(1)}m / ${maxD}m`,
      ratio,
      warn: curD > maxD * 0.7
    });
  } else if (fe.type === 'chase_sheep') {
    const sd = fe.sheepState ? Math.round(Math.hypot(playerPos.x - fe.sheepState.mesh.position.x, playerPos.z - fe.sheepState.mesh.position.z)) : 0;
    const isBurst = Boolean(fe.sheepState && fe.sheepState.burstTimer > 0);
    window.updateMiracleMissionStatusUI({
      title: `🐑 ${shortTitle}`,
      goal: '언덕 아래 광야의 잃어버린 어린양을 쫓아가 붙잡으세요!',
      progressText: `양까지 거리 ${sd}m`,
      extraText: isBurst ? '⚡ 놀라서 빠르게 도망치는 중!' : '🔍 가까이 접근해 보세요',
      warn: isBurst
    });
  } else if (fe.type === 'find_observe') {
    let goal = '';
    let progressText = fe.cutsceneActive ? '🎬 컷신 감상 중' : '탐색 중 (0/1)';
    let extraText = '';
    if (ev.zacchaeusGrove) {
      const zd = fe.zacchaeusData;
      if (fe.cutsceneActive && fe.cutsceneType === 'zacchaeus_story') {
        if (fe.cutscenePhase === 'jesus_calls') {
          goal = '예수님께서 나무 위 삭개오를 부르고 계세요!';
          progressText = '2단계: 예수님의 부르심';
          extraText = '✨ 컷신 진행 중';
        } else if (fe.cutscenePhase === 'zacchaeus_ready_descend') {
          goal = '화면 아래 [내려오기] 버튼을 눌러 삭개오가 내려오게 하세요!';
          progressText = '2단계: 내려오기 대기';
          extraText = '⬇️ 버튼을 누르세요!';
        } else if (fe.cutscenePhase === 'descending') {
          goal = '삭개오가 기뻐하며 나무에서 내려오고 있어요!';
          progressText = '3단계: 내려오는 중';
          extraText = '🏃 예수님 앞으로 이동';
        } else if (fe.cutscenePhase === 'zacchaeus_confess') {
          goal = '삭개오가 예수님께 회개의 고백을 드리고 있어요!';
          progressText = '3단계: 회개 고백';
          extraText = '🙏 진심 어린 고백';
        } else if (fe.cutscenePhase === 'coin_drag_minigame') {
          const gPct = zd ? zd.gaugePct : 100;
          goal = '돈주머니에서 돈을 드래그해 군중에게 나누어 주세요!';
          progressText = `돈주머니 ${gPct}% (목표 50%)`;
          extraText = '💰 주머니 → 군중 드래그!';
        } else {
          goal = '예수님께서 오늘의 구원을 선포하고 계세요!';
          progressText = '6단계: 구원 선포';
          extraText = '✨ 잠시 후 퀴즈!';
        }
      } else {
        goal = '여리고 나무 숲 속 여러 나무 중 삭개오가 올라간 나무를 찾으세요!';
        extraText = '🌳 나무 위를 잘 살펴보세요!';
      }
    } else if (ev.alleyRandomAura) {
      goal = '마을 건물 사이에 있는 감사한 사마리아인을 찾으세요!';
    } else if (ev.thomasCutscene) {
      goal = '마을 어딘가에 나타나신 부활의 예수님을 찾아 손의 못자국을 확인하세요!';
    } else if (ev.widowCutscene) {
      goal = '성전 헌금함 앞 가난한 과부에게 다가가 관찰하세요!';
    } else {
      goal = `${ev.findTargetLabel}을(를) 찾으세요!`;
    }
    window.updateMiracleMissionStatusUI({
      title: `🔍 ${shortTitle}`,
      goal,
      progressText,
      extraText
    });
  } else if (fe.type === 'breakfast_fish_cook' && fe.breakfastState) {
    const bs = fe.breakfastState;
    const isCook = (bs.phase === 'cook_ready' || bs.phase === 'roasting' || bs.phase === 'eating');
    window.updateMiracleMissionStatusUI({
      title: `🎣 ${shortTitle}`,
      goal: isCook
        ? '예수님과 모닥불 옆에서 물고기가 타지 않게 노릇노릇 구워 드세요!'
        : `바닷가에서 장대 낚시줄을 멀리 던져 물고기 ${bs.reqFish}마리를 잡으세요!`,
      progressText: isCook ? (bs.phase === 'eating' ? '🍽️ 식사 중!' : '🔥 생선 굽기 단계') : `물고기 ${bs.caughtCount} / ${bs.reqFish}마리`,
      extraText: bs.phase === 'roasting' ? `굽기 ${bs.roastElapsed.toFixed(1)}초 / ${bs.roastBurnTime}초` : (bs.phase === 'bite_timing' ? '⚡ 입질! 지금 당기기!' : '🌊 멀리 던질수록 잘 잡혀요!'),
      warn: bs.phase === 'roasting' && bs.roastElapsed >= bs.roastBurnTime - 1.5
    });
  } else if (fe.type === 'nicodemus_stealth') {
    const need = fe.required || 3;
    const got = fe.collected || 0;
    const allGot = got >= need;
    window.updateMiracleMissionStatusUI({
      title: `🌙 ${shortTitle}`,
      goal: allGot
        ? '두루마리를 모두 모았습니다! 로마 군인을 피해 서쪽 비밀 집의 예수님께 가세요!'
        : `로마 군인의 횃불과 시야를 피해 성경 두루마리 ${need}개를 모으세요!`,
      progressText: `두루마리 ${got} / ${need}`,
      extraText: '🚨 발각 시 압수 및 처음부터 초기화!'
    });
  }
}

// -------------------------------------------------------------------------
// [공용 2D 격자 A* 길찾기 + 직선 스무딩 NPC 보행 AI & 제자리 귀가 시스템]
// - 건물·우물·성전 충돌 구역을 사전에 완벽히 우회하는 최단 경로를 1회 계산해
//   수가성 여인 등이 특정 구간에서 앞뒤로 반복 정체하는 오류를 원천 차단!
// -------------------------------------------------------------------------
function isMiracleNpcPointClear(tx, tz, pad = 0.62) {
  if (tx > 100.0 || tz < -100.0 || tz > 100.0) return false;
  const shoreX = (typeof window.getMiracleWestShoreLineX === 'function')
    ? window.getMiracleWestShoreLineX(tz)
    : -92.0;
  if (tx < shoreX + 4.1) return false;
  const gy = getMiracleOpenWorldGroundHeight(tx, tz);
  if (gy < -0.15) return false;
  const bList = Array.isArray(window.miracleBuildingBounds) ? window.miracleBuildingBounds : [];
  for (let i = 0; i < bList.length; i++) {
    const b = bList[i];
    if (tx >= b.minX - pad && tx <= b.maxX + pad && tz >= b.minZ - pad && tz <= b.maxZ + pad) return false;
  }
  const cPad = Math.max(0.28, pad * 0.45);
  if (typeof colliders !== 'undefined' && Array.isArray(colliders)) {
    for (let i = 0; i < colliders.length; i++) {
      const c = colliders[i];
      if (tx >= c.minX - cPad && tx <= c.maxX + cPad && tz >= c.minZ - cPad && tz <= c.maxZ + cPad) return false;
    }
  }
  return true;
}

function isMiracleNpcLineClear(x1, z1, x2, z2, pad = 0.66) {
  const dist = Math.hypot(x2 - x1, z2 - z1);
  if (dist < 0.05) return true;
  const steps = Math.max(2, Math.ceil(dist / 0.72));
  for (let s = 1; s < steps; s++) {
    const t = s / steps;
    if (!isMiracleNpcPointClear(x1 + (x2 - x1) * t, z1 + (z2 - z1) * t, pad)) return false;
  }
  return true;
}

function computeMiracleNpcAStarPath(startX, startZ, goalX, goalZ, pad = 0.66) {
  // 직선 경로가 완전히 열려 있으면 즉시 단일 목표 반환 (0.01ms)
  if (isMiracleNpcLineClear(startX, startZ, goalX, goalZ, pad)) {
    return [{ x: goalX, z: goalZ }];
  }

  const CELL = 2.0;
  const margin = 26.0;
  const minX = Math.max(-96.0, Math.floor((Math.min(startX, goalX) - margin) / CELL) * CELL);
  const maxX = Math.min( 98.0, Math.ceil((Math.max(startX, goalX) + margin) / CELL) * CELL);
  const minZ = Math.max(-98.0, Math.floor((Math.min(startZ, goalZ) - margin) / CELL) * CELL);
  const maxZ = Math.min( 98.0, Math.ceil((Math.max(startZ, goalZ) + margin) / CELL) * CELL);
  const cols = Math.max(4, Math.floor((maxX - minX) / CELL) + 1);
  const rows = Math.max(4, Math.floor((maxZ - minZ) / CELL) + 1);
  const total = cols * rows;

  const toGX = (wx) => Math.max(0, Math.min(cols - 1, Math.round((wx - minX) / CELL)));
  const toGZ = (wz) => Math.max(0, Math.min(rows - 1, Math.round((wz - minZ) / CELL)));
  const toWX = (gx) => minX + gx * CELL;
  const toWZ = (gz) => minZ + gz * CELL;

  const blocked = new Uint8Array(total);
  for (let gz = 0; gz < rows; gz++) {
    const wz = toWZ(gz);
    for (let gx = 0; gx < cols; gx++) {
      if (!isMiracleNpcPointClear(toWX(gx), wz, pad)) {
        blocked[gz * cols + gx] = 1;
      }
    }
  }

  const snapWalkable = (gx0, gz0) => {
    if (!blocked[gz0 * cols + gx0]) return [gx0, gz0];
    for (let r = 1; r <= 5; r++) {
      for (let dz = -r; dz <= r; dz++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.abs(dx) !== r && Math.abs(dz) !== r) continue;
          const nx = gx0 + dx, nz = gz0 + dz;
          if (nx >= 0 && nx < cols && nz >= 0 && nz < rows && !blocked[nz * cols + nx]) {
            return [nx, nz];
          }
        }
      }
    }
    return [gx0, gz0];
  };

  const [sx, sz] = snapWalkable(toGX(startX), toGZ(startZ));
  const [ex, ez] = snapWalkable(toGX(goalX), toGZ(goalZ));
  const sIdx = sz * cols + sx;
  const eIdx = ez * cols + ex;
  blocked[sIdx] = 0;
  blocked[eIdx] = 0;

  const gScore = new Float32Array(total);
  const fScore = new Float32Array(total);
  const parent = new Int32Array(total);
  const stateArr = new Uint8Array(total); // 0=unvisited, 1=open, 2=closed
  for (let i = 0; i < total; i++) { gScore[i] = 1e9; fScore[i] = 1e9; parent[i] = -1; }

  const octile = (ax, az, bx, bz) => {
    const dx = Math.abs(ax - bx), dz = Math.abs(az - bz);
    return (dx + dz) + (1.4142 - 2.0) * Math.min(dx, dz);
  };

  // 경량 바이너리 힙 (Open Set)
  const heap = [sIdx];
  const heapPush = (idx) => {
    heap.push(idx);
    let pos = heap.length - 1;
    while (pos > 0) {
      const p = (pos - 1) >> 1;
      if (fScore[heap[pos]] < fScore[heap[p]]) {
        const tmp = heap[pos]; heap[pos] = heap[p]; heap[p] = tmp; pos = p;
      } else break;
    }
  };
  const heapPop = () => {
    const top = heap[0];
    const last = heap.pop();
    if (heap.length > 0) {
      heap[0] = last;
      let pos = 0;
      const n = heap.length;
      while (true) {
        const l = pos * 2 + 1, r = l + 1;
        let sm = pos;
        if (l < n && fScore[heap[l]] < fScore[heap[sm]]) sm = l;
        if (r < n && fScore[heap[r]] < fScore[heap[sm]]) sm = r;
        if (sm !== pos) {
          const tmp = heap[pos]; heap[pos] = heap[sm]; heap[sm] = tmp; pos = sm;
        } else break;
      }
    }
    return top;
  };

  gScore[sIdx] = 0;
  fScore[sIdx] = octile(sx, sz, ex, ez);
  stateArr[sIdx] = 1;

  const dirs = [
    [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
    [1, 1, 1.4142], [1, -1, 1.4142], [-1, 1, 1.4142], [-1, -1, 1.4142]
  ];

  let found = false;
  let bestFallbackIdx = sIdx;
  let bestFallbackH = octile(sx, sz, ex, ez);
  let iter = 0;
  const maxIter = 2600;

  while (heap.length > 0 && iter < maxIter) {
    iter++;
    const cur = heapPop();
    if (stateArr[cur] === 2) continue;
    stateArr[cur] = 2;

    if (cur === eIdx) { found = true; break; }
    const cx = cur % cols, cz = (cur - cx) / cols;
    const hCur = octile(cx, cz, ex, ez);
    if (hCur < bestFallbackH) { bestFallbackH = hCur; bestFallbackIdx = cur; }

    for (let d = 0; d < 8; d++) {
      const dx = dirs[d][0], dz = dirs[d][1], cost = dirs[d][2];
      const nx = cx + dx, nz = cz + dz;
      if (nx < 0 || nx >= cols || nz < 0 || nz >= rows) continue;
      const nIdx = nz * cols + nx;
      if (blocked[nIdx] || stateArr[nIdx] === 2) continue;
      // 대각선 코너 뚫기 방지: 양쪽 직교 인접 칸도 모두 통과 가능해야 허용!
      if (dx !== 0 && dz !== 0) {
        if (blocked[cz * cols + nx] || blocked[nz * cols + cx]) continue;
      }
      const tentG = gScore[cur] + cost;
      if (tentG < gScore[nIdx]) {
        parent[nIdx] = cur;
        gScore[nIdx] = tentG;
        fScore[nIdx] = tentG + octile(nx, nz, ex, ez);
        stateArr[nIdx] = 1;
        heapPush(nIdx);
      }
    }
  }

  const endNode = found ? eIdx : bestFallbackIdx;
  const rawPts = [];
  let trace = endNode;
  let guard = 0;
  while (trace >= 0 && trace !== sIdx && guard < 400) {
    guard++;
    const tx = trace % cols, tz = (trace - tx) / cols;
    rawPts.push({ x: toWX(tx), z: toWZ(tz) });
    trace = parent[trace];
  }
  rawPts.reverse();
  const goalSafe = isMiracleNpcPointClear(goalX, goalZ, pad * 0.85);
  const finalX = goalSafe ? goalX : toWX(ex);
  const finalZ = goalSafe ? goalZ : toWZ(ez);
  if (rawPts.length === 0 || Math.hypot(rawPts[rawPts.length - 1].x - finalX, rawPts[rawPts.length - 1].z - finalZ) > 0.8) {
    rawPts.push({ x: finalX, z: finalZ });
  }

  // 직선 시야 스무딩(String-Pulling): 불필요한 지그재그 경유지를 제거해 자연스럽고 매끄러운 곡선 길 생성!
  const smoothed = [];
  let anchorX = startX, anchorZ = startZ;
  let idx = 0;
  while (idx < rawPts.length) {
    let farthest = idx;
    for (let j = rawPts.length - 1; j > idx; j--) {
      if (isMiracleNpcLineClear(anchorX, anchorZ, rawPts[j].x, rawPts[j].z, pad)) {
        farthest = j;
        break;
      }
    }
    const chosen = rawPts[farthest];
    smoothed.push(chosen);
    anchorX = chosen.x;
    anchorZ = chosen.z;
    idx = farthest + 1;
  }
  return smoothed.length > 0 ? smoothed : [{ x: finalX, z: finalZ }];
}
window.computeMiracleNpcAStarPath = computeMiracleNpcAStarPath;

function stepMiracleNpcTowardTarget(state, targetX, targetZ, dt, now) {
  const m = state.mesh;
  if (!m) return 999;
  const dxGoal = targetX - m.position.x;
  const dzGoal = targetZ - m.position.z;
  const dTarget = Math.hypot(dxGoal, dzGoal);
  if (dTarget < 0.05) return dTarget;

  const spd = state.speed || 4.0;
  const step = Math.min(dTarget, spd * dt);
  if (state.curHeading === undefined) state.curHeading = Math.atan2(dxGoal, dzGoal);

  // 1) 목표별 A* 우회 경로를 1회 계산해 캐시 (일정 구간 앞뒤 반복 루프 원천 차단!)
  const pathKey = `${Math.round(targetX * 2)},${Math.round(targetZ * 2)}`;
  if (!Array.isArray(state.navPath) || state.navPath.length === 0 || state.navPathKey !== pathKey) {
    state.navPath = computeMiracleNpcAStarPath(m.position.x, m.position.z, targetX, targetZ, 0.66);
    state.navPathKey = pathKey;
    state.navPathIdx = 0;
    state.bestTargetDist = dTarget;
    state.noProgressTimer = 0;
    state.recomputeCount = 0;
  }

  // 2) 목표까지 실제 순거리 진척 감시 (반복 정체 발생 시 즉시 여유폭을 넓혀 재탐색!)
  if (typeof state.bestTargetDist !== 'number') state.bestTargetDist = dTarget;
  if (dTarget < state.bestTargetDist - 0.45) {
    state.bestTargetDist = dTarget;
    state.noProgressTimer = 0;
  } else {
    state.noProgressTimer = (state.noProgressTimer || 0) + dt;
    if (state.noProgressTimer >= 2.2) {
      state.noProgressTimer = 0;
      state.recomputeCount = (state.recomputeCount || 0) + 1;
      if (state.recomputeCount <= 2) {
        state.navPath = computeMiracleNpcAStarPath(m.position.x, m.position.z, targetX, targetZ, 0.80);
        state.navPathIdx = 0;
      } else if (state.navPath && state.navPathIdx < state.navPath.length - 1) {
        state.navPathIdx++;
      }
      state.bestTargetDist = dTarget;
    }
  }

  // 3) 현재 경유지 도달 시 다음 경유지로 즉시 전진 (뒤로 돌아가지 않음!)
  while (state.navPathIdx < state.navPath.length - 1) {
    const wp = state.navPath[state.navPathIdx];
    const dWp = Math.hypot(wp.x - m.position.x, wp.z - m.position.z);
    const nextWp = state.navPath[state.navPathIdx + 1];
    if (dWp < 1.35 || (dWp < 3.2 && isMiracleNpcLineClear(m.position.x, m.position.z, nextWp.x, nextWp.z, 0.68))) {
      state.navPathIdx++;
    } else {
      break;
    }
  }

  const activeWp = state.navPath[Math.min(state.navPathIdx, state.navPath.length - 1)] || { x: targetX, z: targetZ };
  const wpDx = activeWp.x - m.position.x;
  const wpDz = activeWp.z - m.position.z;
  const dWp = Math.hypot(wpDx, wpDz);
  const wpAng = Math.atan2(wpDx, wpDz);
  const moveStep = Math.min(dWp, step);

  let chosenAng = wpAng;
  const candX = m.position.x + Math.sin(wpAng) * moveStep;
  const candZ = m.position.z + Math.cos(wpAng) * moveStep;
  if (!isMiracleNpcPointClear(candX, candZ, 0.56)) {
    // 경유지 직선 중 미세 소품/모서리 접촉 시만 가장 가까운 전방 통과 각도로 살짝 미끄러짐
    let foundSlip = null;
    const slipOffsets = [0.28, -0.28, 0.58, -0.58, 0.92, -0.92, 1.30, -1.30];
    for (let i = 0; i < slipOffsets.length; i++) {
      const a = wpAng + slipOffsets[i];
      if (isMiracleNpcPointClear(m.position.x + Math.sin(a) * moveStep, m.position.z + Math.cos(a) * moveStep, 0.52)) {
        foundSlip = a;
        break;
      }
    }
    if (foundSlip !== null) {
      chosenAng = foundSlip;
    } else {
      // 코너에 딱 걸렸으면 즉시 A* 경로 재계산
      state.navPath = computeMiracleNpcAStarPath(m.position.x, m.position.z, targetX, targetZ, 0.78);
      state.navPathIdx = 0;
      chosenAng = null;
    }
  }

  if (chosenAng !== null && moveStep > 0.001) {
    const prevX = m.position.x, prevZ = m.position.z;
    const nx = prevX + Math.sin(chosenAng) * moveStep;
    const nz = prevZ + Math.cos(chosenAng) * moveStep;
    const ny = (typeof window.getMiracleNpcSupportY === 'function')
      ? window.getMiracleNpcSupportY(nx, nz, m.position.y, 1.35)
      : getMiracleOpenWorldGroundHeight(nx, nz);
    const safeDt = Math.min(0.06, Math.max(0.001, dt || 0.016));
    const smoothY = (Math.abs(ny - m.position.y) > 2.2) ? ny : THREE.MathUtils.damp(m.position.y, ny, 16, safeDt);
    m.position.set(nx, smoothY, nz);
    state.curHeading = lerpAngle(state.curHeading, chosenAng, Math.min(1, safeDt * 10.0));
    m.rotation.y = state.curHeading;
    const actualSpd = Math.hypot(nx - prevX, nz - prevZ) / safeDt;
    if (typeof window.applyMiracleNpcLimbAnimation === 'function') {
      window.applyMiracleNpcLimbAnimation(m, { speed: actualSpd, isMoving: actualSpd > 0.16, strideFactor: 1.65 }, dt);
    }
  } else if (typeof window.applyMiracleNpcLimbAnimation === 'function') {
    window.applyMiracleNpcLimbAnimation(m, { speed: 0, isMoving: false }, dt);
  }
  return Math.hypot(targetX - m.position.x, targetZ - m.position.z);
}

function enqueueMiracleNpcWalkHome(mesh, origParent, origLocalPos, origRotY, homeWorldX, homeWorldZ, speed = 4.2) {
  if (!mesh || !origParent) return;
  if (!Array.isArray(window.miracleReturningNpcs)) window.miracleReturningNpcs = [];
  // 동일 NPC 중복 등록 제거
  for (let i = window.miracleReturningNpcs.length - 1; i >= 0; i--) {
    if (window.miracleReturningNpcs[i].mesh === mesh) window.miracleReturningNpcs.splice(i, 1);
  }
  const wp = new THREE.Vector3();
  if (typeof mesh.getWorldPosition === 'function') mesh.getWorldPosition(wp);
  else wp.copy(mesh.position);
  worldGroup.add(mesh);
  mesh.position.set(wp.x, getMiracleOpenWorldGroundHeight(wp.x, wp.z), wp.z);
  window.miracleReturningNpcs.push({
    mesh,
    origParent,
    origLocalPos: origLocalPos ? origLocalPos.clone() : new THREE.Vector3(0, 0, 0),
    origRotY: origRotY || 0,
    homeX: homeWorldX,
    homeZ: homeWorldZ,
    speed,
    avoidSide: 0,
    avoidHoldTimer: 0,
    curHeading: mesh.rotation.y || 0,
    phase: Math.random() * 6.28
  });
}

function reclaimReturningNpc(mesh) {
  if (!mesh || !Array.isArray(window.miracleReturningNpcs)) return;
  for (let i = window.miracleReturningNpcs.length - 1; i >= 0; i--) {
    const item = window.miracleReturningNpcs[i];
    if (item.mesh === mesh) {
      if (item.origParent) {
        item.origParent.add(mesh);
        mesh.position.copy(item.origLocalPos);
        mesh.rotation.y = item.origRotY;
      }
      const u = mesh.userData || {};
      if (u.lLeg && u.rLeg) { u.lLeg.rotation.x = 0; u.rLeg.rotation.x = 0; }
      if (u.lArm && u.rArm) {
        u.lArm.rotation.x = 0; u.rArm.rotation.x = 0;
        u.lArm.rotation.z = 0; u.rArm.rotation.z = 0;
      }
      if (u.head) u.head.rotation.x = 0;
      u._limbAnim = null;
      window.miracleReturningNpcs.splice(i, 1);
    }
  }
}

function updateMiracleReturningNpcs(dt, now) {
  if (!Array.isArray(window.miracleReturningNpcs) || window.miracleReturningNpcs.length === 0) return;
  for (let i = window.miracleReturningNpcs.length - 1; i >= 0; i--) {
    const rn = window.miracleReturningNpcs[i];
    if (!rn || !rn.mesh) {
      window.miracleReturningNpcs.splice(i, 1);
      continue;
    }
    const rem = stepMiracleNpcTowardTarget(rn, rn.homeX, rn.homeZ, dt, now);
    if (rem < 1.15) {
      if (rn.origParent) {
        rn.origParent.add(rn.mesh);
        rn.mesh.position.copy(rn.origLocalPos);
        rn.mesh.rotation.y = rn.origRotY;
      }
      const u = rn.mesh.userData || {};
      if (u.lLeg && u.rLeg) { u.lLeg.rotation.x = 0; u.rLeg.rotation.x = 0; }
      if (u.lArm && u.rArm) {
        u.lArm.rotation.x = 0; u.rArm.rotation.x = 0;
        u.lArm.rotation.z = 0; u.rArm.rotation.z = 0;
      }
      if (u.head) u.head.rotation.x = 0;
      u._limbAnim = null;
      window.miracleReturningNpcs.splice(i, 1);
    }
  }
}

function clearMiracleFieldEventObjects() {
  // 우물가 여인: 미션 완료 시 직접 제자리(야곱의 우물)까지 걸어 귀가, 포기/실패 시 제자리 복귀!
  if (miracleActiveFieldEvent && miracleActiveFieldEvent.messenger && miracleActiveFieldEvent.messenger.reusedSpotNpc) {
    const ms = miracleActiveFieldEvent.messenger;
    const npc = ms.mesh;
    if (npc) {
      if (ms.ringMesh && ms.ringMesh.parent === npc) npc.remove(ms.ringMesh);
      if (ms.walkHomeOnClear && ms.origParent) {
        enqueueMiracleNpcWalkHome(npc, ms.origParent, ms.origLocalPos, ms.origRotY, ms.homeWorldX, ms.homeWorldZ, 4.3);
      } else {
        if (ms.origParent) {
          ms.origParent.add(npc);
          npc.position.copy(ms.origLocalPos || new THREE.Vector3(0, 0, 0));
          npc.rotation.y = ms.origRotY || 0;
        }
        const u = npc.userData || {};
        if (u.lLeg && u.rLeg) { u.lLeg.rotation.x = 0; u.rLeg.rotation.x = 0; }
        if (u.lArm && u.rArm) {
          u.lArm.rotation.x = 0; u.rArm.rotation.x = 0;
          u.lArm.rotation.z = 0; u.rArm.rotation.z = 0;
        }
        if (u.head) u.head.rotation.x = 0;
        u._limbAnim = null;
      }
    }
  }
  // 엠마오 두 제자 & 사도 도마: 원래 서 있던 NPC 본인을 미션 완료 시 제자리까지 함께 걸어 귀가, 포기 시 제자리 복귀!
  if (miracleActiveFieldEvent && Array.isArray(miracleActiveFieldEvent.reusedEscortNpcs)) {
    const walkHome = Boolean(miracleActiveFieldEvent.walkHomeEscortOnClear);
    miracleActiveFieldEvent.reusedEscortNpcs.forEach((entry, idx) => {
      const npc = entry.mesh;
      if (!npc) return;
      npc.visible = true;
      if (walkHome && entry.origParent) {
        enqueueMiracleNpcWalkHome(npc, entry.origParent, entry.origLocalPos, entry.origRotY, entry.homeWorldX, entry.homeWorldZ, 4.1 + idx * 0.15);
      } else {
        if (entry.origParent) {
          entry.origParent.add(npc);
          npc.position.copy(entry.origLocalPos || new THREE.Vector3(0, 0, 0));
          npc.rotation.y = entry.origRotY || 0;
        }
        const u = npc.userData || {};
        if (u.lLeg && u.rLeg) { u.lLeg.rotation.x = 0; u.rLeg.rotation.x = 0; }
        if (u.lArm && u.rArm) {
          u.lArm.rotation.x = 0; u.rArm.rotation.x = 0;
          u.lArm.rotation.z = 0; u.rArm.rotation.z = 0;
        }
        if (u.head) u.head.rotation.x = 0;
        u._limbAnim = null;
      }
    });
  }
  // 숨겼던 기존 NPC 복원 (중풍병자·낚시 등 미션 공통)
  if (miracleActiveFieldEvent && miracleActiveFieldEvent.hiddenSpotNpc) {
    miracleActiveFieldEvent.hiddenSpotNpc.visible = true;
  }
  // 아침식사 낚시·모닥불 미션 정리: 낚싯대 제거, 플레이어 착석 자세 복원, 숨겼던 불꺼진 모닥불·카메라바 복원
  let needCamSnap = false;
  if (miracleActiveFieldEvent && miracleActiveFieldEvent.breakfastState) {
    const bs = miracleActiveFieldEvent.breakfastState;
    needCamSnap = true;
    if (bs.rodMesh && bs.rodMesh.parent) bs.rodMesh.parent.remove(bs.rodMesh);
    const camBar = document.getElementById('cam-bottom-bar');
    if (camBar && bs._prevCamBarDisplay !== undefined) {
      camBar.style.display = bs._prevCamBarDisplay;
    }
    if (playerLimbs) {
      if (playerLimbs.lLeg) playerLimbs.lLeg.rotation.x = 0;
      if (playerLimbs.rLeg) playerLimbs.rLeg.rotation.x = 0;
      if (playerLimbs.lArm) {
        playerLimbs.lArm.rotation.x = 0;
        playerLimbs.lArm.rotation.z = 0;
      }
      if (playerLimbs.rArm) {
        playerLimbs.rArm.rotation.x = 0;
        playerLimbs.rArm.rotation.z = 0;
      }
      if (playerLimbs.lElbow) playerLimbs.lElbow.rotation.x = 0;
      if (playerLimbs.rElbow) playerLimbs.rElbow.rotation.x = 0;
    }
    if (bs.returnPos) {
      playerPos.copy(bs.returnPos);
      playerPos.y = getMiracleOpenWorldGroundHeight(playerPos.x, playerPos.z);
      if (typeof playerGroup !== 'undefined' && playerGroup) playerGroup.position.copy(playerPos);
    }
    if (Array.isArray(window.miracleBurntCampfireMeshes)) {
      window.miracleBurntCampfireMeshes.forEach(cf => { if (cf.mesh) cf.mesh.visible = true; });
    }
  }
  // 삭개오 미션 컷신/드래그 UI·돈주머니·동전·컨트롤 복원
  if (miracleActiveFieldEvent && miracleActiveFieldEvent.zacchaeusData) {
    const zd = miracleActiveFieldEvent.zacchaeusData;
    if (zd._cutsceneEntered) needCamSnap = true;
    if (typeof playerGroup !== 'undefined' && playerGroup) {
      playerGroup.rotation.x = 0;
      playerGroup.rotation.z = 0;
    }
    zd.dragging = false;
    zd.dragPointerId = null;
    if (zd._savedHud) {
      const joyEl = document.getElementById('joystick-zone');
      const camBar = document.getElementById('cam-bottom-bar');
      const actEl = document.getElementById('action-zone');
      if (joyEl) joyEl.style.display = zd._savedHud.joy || 'block';
      if (camBar) camBar.style.display = zd._savedHud.camBar || 'flex';
      if (actEl) actEl.style.display = zd._savedHud.act || 'flex';
    }
    if (zd.pouchMesh) worldGroup.remove(zd.pouchMesh);
    if (zd.blessingAura) worldGroup.remove(zd.blessingAura);
    if (Array.isArray(zd.flyingCoins)) {
      zd.flyingCoins.forEach(fc => { if (fc && fc.mesh) worldGroup.remove(fc.mesh); });
      zd.flyingCoins = [];
    }
    if (Array.isArray(zd.sparkles)) {
      zd.sparkles.forEach(sp => { if (sp && sp.mesh) worldGroup.remove(sp.mesh); });
      zd.sparkles = [];
    }
  }
  ['miracle-zacchaeus-ui', 'miracle-zac-drag-layer', 'miracle-zac-pouch-hud', 'miracle-zac-speech-box', 'miracle-zac-descend-btn', 'miracle-zac-pouch-anchor', 'miracle-zac-drag-coin'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });
  const zacSvg = document.getElementById('miracle-zac-drag-svg');
  if (zacSvg) zacSvg.innerHTML = '';
  miracleWorldMissionObjects.forEach(obj => {
    if (obj.mesh && !obj.keepInWorld) worldGroup.remove(obj.mesh);
    if (obj.label) obj.label.remove();
    if (obj.collider && Array.isArray(colliders)) {
      const ci = colliders.indexOf(obj.collider);
      if (ci >= 0) colliders.splice(ci, 1);
    }
    if (Array.isArray(obj.wallMeshes) && Array.isArray(wallMeshes)) {
      obj.wallMeshes.forEach(wm => {
        const wi = wallMeshes.indexOf(wm);
        if (wi >= 0) wallMeshes.splice(wi, 1);
      });
    }
  });
  miracleWorldMissionObjects = [];
  miracleActiveFieldEvent = null;
  if (typeof carriedBlockGroup !== 'undefined' && carriedBlockGroup) {
    while (carriedBlockGroup.children.length > 0) {
      carriedBlockGroup.remove(carriedBlockGroup.children[0]);
    }
  }
  if (window.MiracleDayNight) {
    window.MiracleDayNight.freezeForNightMission = false;
  }
  const sowerWrap = document.getElementById('miracle-sower-btn-wrap');
  if (sowerWrap) sowerWrap.classList.add('hidden');
  const bfUi = document.getElementById('miracle-breakfast-ui');
  if (bfUi) bfUi.classList.add('hidden');
  if (typeof window.hideMiracleMissionStatusUI === 'function') {
    window.hideMiracleMissionStatusUI();
  }
  syncMiracleSpotMarkersForActiveMission();
  if (needCamSnap && typeof snapCameraToPlayer === 'function') {
    snapCameraToPlayer();
  }
}

window.cancelActiveMiracleFieldEvent = function () {
  if (!miracleActiveFieldEvent) return;
  const evSpot = miracleActiveFieldEvent.spot;
  clearMiracleFieldEventObjects();
  if (evSpot) {
    evSpot._requireLeaveZone = true;
    evSpot._prompted = performance.now();
  }
  playSfx('step');
  showToast('✋ 진행 중인 미션을 포기했어요. 다른 미션이나 스테이지를 자유롭게 선택할 수 있어요!');
};

function createMissionItemMeshByStyle(evSpot) {
  if (evSpot.itemStyle === 'first_aid' && typeof createFirstAidKitMesh === 'function') {
    return createFirstAidKitMesh(1.08);
  }
  if (evSpot.itemStyle === 'seed_basket' && typeof createSeedBasketMesh === 'function') {
    return createSeedBasketMesh(1.12);
  }
  if (evSpot.itemStyle === 'water_amphora' && typeof createWaterFilledAmphoraMesh === 'function') {
    return createWaterFilledAmphoraMesh(0.95);
  }
  if (evSpot.itemStyle === 'folded_towel' && typeof createFoldedTowelMesh === 'function') {
    return createFoldedTowelMesh(1.12);
  }
  if (evSpot.itemStyle === 'palm_branch' && typeof createPalmBranchMesh === 'function') {
    return createPalmBranchMesh(1.08);
  }
  return createLowPolyMesh(new THREE.DodecahedronGeometry(0.44, 0), evSpot.itemColor || '#38bdf8', 0, 0.44, 0);
}

function startMiracleFieldEvent(evSpot) {
  if (miracleActiveFieldEvent && miracleActiveFieldEvent.spot !== evSpot) {
    if (typeof showToast === 'function') showToast('⚠️ 진행 중인 미션을 먼저 완료해 주세요!');
    return;
  }
  clearMiracleFieldEventObjects();
  evSpot._requireLeaveZone = true;

  miracleActiveFieldEvent = {
    spot: evSpot,
    type: evSpot.missionType,
    collected: 0,
    required: evSpot.itemCount || 1,
    carrying: 0,
    items: [],
    laySpots: [],
    targetZone: null,
    escortGroup: null,
    escortFollowers: [],
    crowdGroup: null,
    auraGroup: null,
    messenger: null,
    sheepState: null,
    deliveredCount: 0,
    cutsceneActive: false,
    cutsceneCameraActive: false,
    cutsceneType: null,
    cutscenePhase: null,
    cutsceneTimer: 0,
    cutsceneProps: null
  };

  // 미션 진행 중 다른 모든 미션·스테이지의 발 주변 원형(kneeAura/ring/beam)을 즉시 끔!
  syncMiracleSpotMarkersForActiveMission();

  const cx = evSpot.x;
  const cz = evSpot.z;

  if (evSpot.missionType === 'nicodemus_stealth') {
    if (window.MiracleDayNight) {
      window.MiracleDayNight.freezeForNightMission = true;
    }
    const safeFind = (typeof window.findSafeOpenWorldOutdoorPoint === 'function')
      ? window.findSafeOpenWorldOutdoorPoint
      : ((x, z) => ({ x, z }));

    const rawScrolls = Array.isArray(evSpot.scrollPositions)
      ? evSpot.scrollPositions
      : [{ x: 8.5, z: 36.0 }, { x: -4.5, z: 39.5 }, { x: -16.0, z: 34.5 }];

    rawScrolls.forEach((spPos, idx) => {
      const p = safeFind(spPos.x, spPos.z, 1.15);
      const py = getMiracleOpenWorldGroundHeight(p.x, p.z);
      const grp = (typeof window.createBibleScrollProp === 'function')
        ? window.createBibleScrollProp(1.08)
        : createLowPolyMesh(new THREE.DodecahedronGeometry(0.45, 0), '#fde047', 0, 0, 0);
      grp.position.set(p.x, py + 0.65, p.z);
      worldGroup.add(grp);

      const lbl = createWorldLabel(`📜 성경 두루마리 ${idx + 1}`);
      lbl.style.fontSize = '11px';
      miracleActiveFieldEvent.items.push({
        mesh: grp,
        label: lbl,
        pos: new THREE.Vector3(p.x, py + 0.65, p.z),
        baseY: py + 0.65,
        phase: idx * 1.3,
        done: false
      });
      miracleWorldMissionObjects.push({ mesh: grp, label: lbl });
    });

    const gRaw = evSpot.goalPos || { x: -24.5, z: 36.5 };
    const gp = safeFind(gRaw.x, gRaw.z, 1.35);
    const gy = getMiracleOpenWorldGroundHeight(gp.x, gp.z);
    const goalGrp = new THREE.Group();
    goalGrp.position.set(gp.x, gy, gp.z);

    const jesusNpc = createLowPolyPersonMesh('jesus', 0);
    let jesusLamp = null;
    if (jesusNpc && jesusNpc.userData && jesusNpc.userData.rArm && typeof window.createAncientOilLampProp === 'function') {
      jesusLamp = window.createAncientOilLampProp(1.05);
      jesusLamp.group.position.set(0.02, -0.44, 0.14);
      jesusLamp.group.rotation.x = 0.72;
      jesusNpc.userData.rArm.rotation.x = -0.78;
      jesusNpc.userData.rArm.add(jesusLamp.group);
    }
    const goalRing = new THREE.Mesh(
      new THREE.RingGeometry(1.15, 1.48, 22),
      new THREE.MeshBasicMaterial({ color: 0xfbbf24, side: THREE.DoubleSide, transparent: true, opacity: 0.75 })
    );
    goalRing.rotation.x = -Math.PI * 0.5;
    goalRing.position.y = 0.08;
    goalGrp.add(jesusNpc, goalRing);
    worldGroup.add(goalGrp);

    const goalLbl = createWorldLabel(evSpot.goalLabel || '🕯️ 비밀 집의 예수님');
    goalLbl.style.fontSize = '12px';
    miracleActiveFieldEvent.targetZone = {
      mesh: goalGrp,
      npcMesh: jesusNpc,
      oilLamp: jesusLamp,
      label: goalLbl,
      pos: new THREE.Vector3(gp.x, gy + 0.5, gp.z)
    };
    miracleWorldMissionObjects.push({ mesh: goalGrp, label: goalLbl });

    syncMiracleMissionStatusPanel();
    return;
  }

  if (evSpot.missionType === 'collect_deliver') {
    const count = evSpot.itemCount || 4;
    const usedSpots = [{ x: cx, z: cz, r: 5.5 }];
    const usedRoofHouses = new Set();
    const maxRoofItems = evSpot.allowRooftopSpawn ? Math.max(1, Math.min(2, Math.floor(count / 2))) : 0;
    let roofItemsPlaced = 0;

    for (let i = 0; i < count; i++) {
      let spawnOpts;
      if (evSpot.spawnMode === 'openworld_wide') {
        spawnOpts = { cx: 0, cz: -20, xMin: -62, xMax: 68, zMin: -88, zMax: 38, minDist: 10, minSpacing: 15.0, avoidList: usedSpots };
      } else if (evSpot.spawnMode === 'town_random') {
        spawnOpts = { cx: 12, cz: 22, minDist: 12, maxDist: 46, minSpacing: 10.5, avoidList: usedSpots };
      } else if (evSpot.spawnMode === 'nearby_buildings') {
        spawnOpts = { cx: -20, cz: 48, minDist: 8, maxDist: 34, minSpacing: 7.5, nearBuildings: true, avoidList: usedSpots };
      } else if (evSpot.spawnMode === 'mountain_slopes') {
        spawnOpts = { cx: 0, cz: 39, mountainSlopes: true, minDist: 28, minSpacing: 14.0, minY: 0.35, avoidList: usedSpots };
      } else if (evSpot.spawnMode === 'builder_random') {
        spawnOpts = { cx: 58, cz: 22, minDist: 9, maxDist: 30, minSpacing: 7.5, avoidList: usedSpots };
      } else {
        spawnOpts = { cx, cz, minDist: 6.5, maxDist: 16.0, minSpacing: 5.0, avoidList: usedSpots };
      }

      // 건물 2층(옥상) 사물 없는 구역에도 미션 아이템 스폰 허용 (계단으로 올라가 획득 가능!)
      let pos = null;
      if (roofItemsPlaced < maxRoofItems && typeof pickSafeRooftopSpawnSpot === 'function') {
        pos = pickSafeRooftopSpawnSpot({
          cx: spawnOpts.cx,
          cz: spawnOpts.cz,
          minDist: 5,
          maxDist: Math.max(46, spawnOpts.maxDist || 56),
          xMin: spawnOpts.xMin,
          xMax: spawnOpts.xMax,
          zMin: spawnOpts.zMin,
          zMax: spawnOpts.zMax,
          avoidList: usedSpots,
          usedHouses: usedRoofHouses
        });
        if (pos) roofItemsPlaced++;
      }
      if (!pos) {
        pos = findSafeOpenWorldOutdoorPos(spawnOpts);
      }
      usedSpots.push({ x: pos.x, z: pos.z, r: spawnOpts.minSpacing || 6.0 });

      const itemGrp = new THREE.Group();
      const itemMesh = createMissionItemMeshByStyle(evSpot);
      const itemRing = new THREE.Mesh(
        new THREE.RingGeometry(0.70, 1.02, 16),
        new THREE.MeshBasicMaterial({ color: 0xfef08a, side: THREE.DoubleSide })
      );
      itemRing.rotation.x = -Math.PI / 2;
      itemRing.position.y = 0.06;
      itemGrp.add(itemMesh, itemRing);
      itemGrp.position.set(pos.x, pos.y, pos.z);
      worldGroup.add(itemGrp);

      const baseLblText = evSpot.itemLabel || '✨ 미션 물품';
      const lbl = createWorldLabel(pos.isRooftop ? `${baseLblText} (2층 옥상)` : baseLblText);
      lbl.style.opacity = '0';
      const itemObj = {
        mesh: itemGrp,
        pos: new THREE.Vector3(pos.x, pos.y + 0.4, pos.z),
        baseY: pos.y,
        isRooftop: Boolean(pos.isRooftop),
        done: false,
        label: lbl
      };
      miracleWorldMissionObjects.push(itemObj);
      miracleActiveFieldEvent.items.push(itemObj);
    }

    // 배달 목표 지점 설정 (여관 안 병상 / 2층 다락방 실내 / 성문 앞 랜덤 5개 깔기 지점 / 일반)
    if (evSpot.multiRandomLaySpots) {
      const layAvoid = [];
      for (let k = 0; k < count; k++) {
        const lpos = findSafeOpenWorldOutdoorPos({
          cx: 0, cz: 37.5,
          xMin: -8.5, xMax: 8.5, zMin: 31.5, zMax: 42.0,
          minSpacing: 2.5, pad: 1.0, avoidList: layAvoid
        });
        layAvoid.push({ x: lpos.x, z: lpos.z, r: 2.5 });
        const sGrp = new THREE.Group();
        const sRing = new THREE.Mesh(
          new THREE.RingGeometry(0.95, 1.38, 20),
          new THREE.MeshBasicMaterial({ color: 0x4ade80, side: THREE.DoubleSide })
        );
        sRing.rotation.x = -Math.PI / 2;
        sRing.position.y = 0.08;
        sGrp.add(sRing);
        sGrp.position.set(lpos.x, lpos.y, lpos.z);
        worldGroup.add(sGrp);
        const sLbl = createWorldLabel(`🌿 종려가지 놓는 곳 #${k + 1}`);
        sLbl.style.opacity = '0';
        const spotObj = { mesh: sGrp, ring: sRing, pos: new THREE.Vector3(lpos.x, lpos.y + 0.4, lpos.z), label: sLbl, laid: false };
        miracleWorldMissionObjects.push(spotObj);
        miracleActiveFieldEvent.laySpots.push(spotObj);
      }
      miracleActiveFieldEvent.targetZone = miracleActiveFieldEvent.laySpots[0];
    } else {
      let tx, ty, tz, requireYMatch = false;
      if (evSpot.deliverToInnBed && window.miracleJerichoInnInfo && window.miracleJerichoInnInfo.bedWorldPos) {
        const bp = window.miracleJerichoInnInfo.bedWorldPos;
        tx = bp.x; ty = bp.y; tz = bp.z;
      } else if (evSpot.deliverToUpperRoom && window.miracleUpperRoomInfo && window.miracleUpperRoomInfo.upperRoomCenter) {
        const up = window.miracleUpperRoomInfo.upperRoomCenter;
        tx = up.x; ty = up.y; tz = up.z;
        requireYMatch = true;
      } else {
        tx = cx + (evSpot.targetOffset ? evSpot.targetOffset.x : 0);
        tz = cz + (evSpot.targetOffset ? evSpot.targetOffset.z : -3);
        ty = getMiracleOpenWorldGroundHeight(tx, tz);
      }

      const tGrp = new THREE.Group();
      const tRing = new THREE.Mesh(
        new THREE.RingGeometry(1.35, 1.95, 24),
        new THREE.MeshBasicMaterial({ color: 0x4ade80, side: THREE.DoubleSide })
      );
      tRing.rotation.x = -Math.PI / 2;
      tRing.position.y = 0.08;
      tGrp.add(tRing);
      tGrp.position.set(tx, ty, tz);
      worldGroup.add(tGrp);

      const tLbl = createWorldLabel(`${evSpot.targetLabel} (0/${count})`);
      tLbl.style.opacity = '0';
      const targetObj = { mesh: tGrp, pos: new THREE.Vector3(tx, ty + 0.5, tz), label: tLbl, goalY: ty, requireYMatch };
      miracleWorldMissionObjects.push(targetObj);
      miracleActiveFieldEvent.targetZone = targetObj;
    }
  } else if (evSpot.missionType === 'sower_farm') {
    // [씨 뿌리기 미니게임: 좋은 땅 만들기]
    // 미션을 다시 시작할 때는 이전에 다 자란 곡식 밭을 모두 초기화하여 처음부터 새로 가꾸도록 처리!
    clearAllMiracleGrowingFields();

    // 1) 산 근처 밭 구역 찾기 → 2) 씨앗 바구니 모으기(레벨별 수량) → 3) 돌 제거 → 4) 가시덤불·잡초 제거 → 5) 땅 고르게 정돈 → 6) 씨앗 뿌리기 버튼!
    const treeList = Array.isArray(window.miracleWorldTreePositions) ? window.miracleWorldTreePositions : [];
    const clearPlots = MIRACLE_SOWER_FARM_CANDIDATES.filter(p =>
      treeList.every(t => Math.hypot(t.x - p.x, t.z - p.z) >= 6.5)
    );
    const plotPool = clearPlots.length > 0 ? clearPlots : MIRACLE_SOWER_FARM_CANDIDATES;
    const pickedPlot = plotPool[Math.floor(Math.random() * plotPool.length)];
    const fx = pickedPlot.x;
    const fz = pickedPlot.z;
    const fy = getMiracleOpenWorldGroundHeight(fx, fz);

    // 반(레벨)별 씨앗 바구니 수량 차별화: 유치부(2) · 유년부(3) · 소년부/타임어택(4)
    const modeKey = (typeof currentMode !== 'undefined') ? currentMode : 'junior';
    const seedTotal = (modeKey === 'kinder') ? 2 : (modeKey === 'junior' ? 3 : 4);
    miracleActiveFieldEvent.required = seedTotal;

    const plotGrp = new THREE.Group();
    const soilMat = new THREE.MeshPhongMaterial({ color: 0xa68a64, flatShading: true, shininess: 0, specular: 0x000000 });
    const soilBed = new THREE.Mesh(createOrganicBoxGeo(7.6, 0.22, 6.4, 881, 0.04, 0.99, 1), soilMat);
    soilBed.position.set(0, 0.08, 0);
    soilBed.receiveShadow = true;
    plotGrp.add(soilBed);

    // 밭 네 모서리 나무 울타리 말뚝 + 탐색용 은은한 빛 링
    [[-3.7, -3.1], [3.7, -3.1], [-3.7, 3.1], [3.7, 3.1]].forEach(([px, pz]) => {
      plotGrp.add(createLowPolyMesh(new THREE.CylinderGeometry(0.11, 0.14, 0.92, 5), '#78350f', px, 0.44, pz, true));
    });
    const beaconRing = new THREE.Mesh(
      new THREE.RingGeometry(4.0, 4.75, 28),
      new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide, transparent: true, opacity: 0.78 })
    );
    beaconRing.rotation.x = -Math.PI * 0.5;
    beaconRing.position.y = 0.12;
    plotGrp.add(beaconRing);

    // 밭 안의 돌 5개
    const rocks = [];
    const rockCoords = [[-2.4, -1.9], [2.1, -2.0], [-0.2, 0.1], [-2.2, 1.8], [2.3, 1.6]];
    rockCoords.forEach(([rx, rz], i) => {
      const rMesh = createLowPolyMesh(
        new THREE.DodecahedronGeometry(0.46 + (i % 2) * 0.10, 0),
        i % 2 === 0 ? '#94a3b8' : '#78716c',
        rx, 0.34, rz, true
      );
      rMesh.scale.set(1.2, 0.78, 1.05);
      rMesh.rotation.y = i * 1.1;
      plotGrp.add(rMesh);
      rocks.push({ mesh: rMesh, wx: fx + rx, wz: fz + rz, cleared: false });
    });

    // 밭 안의 가시덤불과 잡초 6개
    const thorns = [];
    const thornCoords = [[-1.3, -2.2], [0.9, -1.4], [-2.7, 0.2], [2.7, -0.3], [-1.0, 2.2], [1.4, 2.1]];
    thornCoords.forEach(([tx, tz], i) => {
      const tGrp = new THREE.Group();
      const bush = createLowPolyMesh(new THREE.DodecahedronGeometry(0.42, 0), i % 2 === 0 ? '#3f6212' : '#4d7c0f', 0, 0.32, 0, true);
      bush.scale.set(1.15, 0.85, 1.15);
      const spike1 = createLowPolyMesh(new THREE.ConeGeometry(0.10, 0.62, 4), '#713f12', -0.16, 0.52, 0.08, false);
      spike1.rotation.z = 0.38;
      const spike2 = createLowPolyMesh(new THREE.ConeGeometry(0.09, 0.56, 4), '#854d0e', 0.18, 0.48, -0.10, false);
      spike2.rotation.z = -0.42;
      const weed = createLowPolyMesh(new THREE.ConeGeometry(0.13, 0.55, 4), '#65a30d', 0.02, 0.44, 0.14, false);
      tGrp.add(bush, spike1, spike2, weed);
      tGrp.position.set(tx, 0.12, tz);
      plotGrp.add(tGrp);
      thorns.push({ mesh: tGrp, wx: fx + tx, wz: fz + tz, cleared: false });
    });

    // 울퉁불퉁한 흙덩이 4줄(밟아서 정돈하면 고운 옥토 이랑으로 변신!)
    const mounds = [];
    const furrowZList = [-2.0, -0.68, 0.68, 2.0];
    furrowZList.forEach((mz, i) => {
      const mx = (i % 2 === 0 ? -0.4 : 0.4);
      const roughGrp = new THREE.Group();
      for (let b = -2; b <= 2; b++) {
        const lump = createLowPolyMesh(
          new THREE.DodecahedronGeometry(0.32 + Math.abs(b % 2) * 0.08, 0),
          '#8c6d46', b * 1.1, 0.24, (b % 2) * 0.14, false
        );
        lump.scale.set(1.2, 0.62, 1.0);
        roughGrp.add(lump);
      }
      roughGrp.position.set(0, 0.08, mz);
      plotGrp.add(roughGrp);

      // 정돈 완료 후 드러나는 고운 옥토 이랑
      const neatRidge = createLowPolyMesh(
        createOrganicBoxGeo(6.4, 0.18, 0.72, 960 + i, 0.03, 0.96, 1),
        '#4a2e16', 0, 0.20, mz, false
      );
      neatRidge.visible = false;
      plotGrp.add(neatRidge);

      mounds.push({ roughGrp, neatRidge, wx: fx + mx, wz: fz + mz, leveled: false });
    });

    plotGrp.position.set(fx, fy, fz);
    worldGroup.add(plotGrp);

    const plotLbl = createWorldLabel(`⛰️ ${pickedPlot.areaName} 밭 구역 (다가가 확인!)`);
    plotLbl.style.opacity = '0';
    const plotObj = { mesh: plotGrp, pos: new THREE.Vector3(fx, fy + 0.9, fz), label: plotLbl };
    miracleWorldMissionObjects.push(plotObj);

    // 2단계에서 표시될 씨앗 바구니들 사전 배치 (건물 2층 옥상 스폰 포함!)
    const seedBaskets = [];
    const usedSeedSpots = [{ x: fx, z: fz, r: 9.0 }, { x: cx, z: cz, r: 5.5 }];
    const usedSeedHouses = new Set();
    let roofSeedPlaced = 0;

    for (let s = 0; s < seedTotal; s++) {
      let spos = null;
      if (roofSeedPlaced < 1 && typeof pickSafeRooftopSpawnSpot === 'function') {
        spos = pickSafeRooftopSpawnSpot({
          cx: fx * 0.5,
          cz: fz * 0.5,
          minDist: 6,
          maxDist: 68,
          avoidList: usedSeedSpots,
          usedHouses: usedSeedHouses
        });
        if (spos) roofSeedPlaced++;
      }
      if (!spos) {
        spos = findSafeOpenWorldOutdoorPos({
          cx: fx,
          cz: fz,
          minDist: 10,
          maxDist: 44,
          minSpacing: 8.5,
          avoidList: usedSeedSpots
        });
      }
      usedSeedSpots.push({ x: spos.x, z: spos.z, r: 8.0 });

      const bGrp = new THREE.Group();
      const bMesh = (typeof createSeedBasketMesh === 'function')
        ? createSeedBasketMesh(1.12)
        : createLowPolyMesh(new THREE.DodecahedronGeometry(0.45, 0), '#fde047', 0, 0.45, 0);
      const bRing = new THREE.Mesh(
        new THREE.RingGeometry(0.70, 1.02, 16),
        new THREE.MeshBasicMaterial({ color: 0xfde047, side: THREE.DoubleSide })
      );
      bRing.rotation.x = -Math.PI * 0.5;
      bRing.position.y = 0.06;
      bGrp.add(bMesh, bRing);
      bGrp.position.set(spos.x, spos.y, spos.z);
      bGrp.visible = false; // 1단계(밭 찾기) 완료 후 활성화!
      worldGroup.add(bGrp);

      const bLbl = createWorldLabel(spos.isRooftop ? '🧺 씨앗 바구니 (2층 옥상)' : '🧺 씨앗 바구니');
      bLbl.style.opacity = '0';
      const bObj = {
        mesh: bGrp,
        pos: new THREE.Vector3(spos.x, spos.y + 0.45, spos.z),
        baseY: spos.y,
        isRooftop: Boolean(spos.isRooftop),
        done: false,
        label: bLbl
      };
      miracleWorldMissionObjects.push(bObj);
      seedBaskets.push(bObj);
    }

    miracleActiveFieldEvent.sowerState = {
      phase: 'find_field',
      areaName: pickedPlot.areaName,
      fx, fy, fz,
      plotGrp,
      soilMat,
      beaconRing,
      plotLbl,
      seedTotal,
      seedsCollected: 0,
      seedBaskets,
      rocks,
      rocksCleared: 0,
      thorns,
      thornsCleared: 0,
      mounds,
      moundsLeveled: 0,
      sowTimer: 0,
      seedParticles: []
    };
    miracleActiveFieldEvent.targetZone = plotObj;
  } else if (evSpot.missionType === 'mustard_grow') {
    // [겨자씨 비유 미니게임: 아주 작은 겨자씨 찾기 → 심기 → 물 찾아 붓기 → 5분 관목 성장]
    clearAllMiracleMustardShrubs();
    evSpot._treeGrown = false;

    const fx = cx + (evSpot.targetOffset ? evSpot.targetOffset.x : 4);
    const fz = cz + (evSpot.targetOffset ? evSpot.targetOffset.z : 0);
    const fy = getMiracleOpenWorldGroundHeight(fx, fz);

    // 1) 돌 테두리 흙밭 생성
    const plotGrp = new THREE.Group();
    const soilMat = new THREE.MeshPhongMaterial({ color: 0xa68a64, flatShading: true, shininess: 0, specular: 0x000000 });
    const soilMound = new THREE.Mesh(new THREE.CylinderGeometry(1.42, 1.66, 0.24, 10), soilMat);
    soilMound.position.set(0, 0.11, 0);
    soilMound.receiveShadow = true;
    plotGrp.add(soilMound);

    for (let p = 0; p < 10; p++) {
      const ang = (p / 10) * Math.PI * 2 + 0.18;
      const pr = 1.56 + (p % 2) * 0.07;
      const stone = createLowPolyMesh(
        new THREE.DodecahedronGeometry(0.22 + (p % 3) * 0.03, 0),
        p % 2 === 0 ? '#94a3b8' : '#a8a29e',
        Math.cos(ang) * pr, 0.12, Math.sin(ang) * pr, false
      );
      stone.scale.set(1.22, 0.56, 0.95);
      stone.rotation.y = ang + p * 0.4;
      plotGrp.add(stone);
    }

    const beaconRing = new THREE.Mesh(
      new THREE.RingGeometry(1.75, 2.25, 24),
      new THREE.MeshBasicMaterial({ color: 0xa3e635, side: THREE.DoubleSide, transparent: true, opacity: 0.45 })
    );
    beaconRing.rotation.x = -Math.PI * 0.5;
    beaconRing.position.y = 0.08;
    plotGrp.add(beaconRing);

    const plantedSeedMesh = createLowPolyMesh(new THREE.IcosahedronGeometry(0.085, 0), '#5c3a14', 0, 0.25, 0, false);
    plantedSeedMesh.visible = false;
    plotGrp.add(plantedSeedMesh);

    const tinySproutGrp = new THREE.Group();
    tinySproutGrp.position.set(0, 0.22, 0);
    const spStem = createLowPolyMesh(new THREE.CylinderGeometry(0.03, 0.045, 0.34, 5), '#84cc16', 0, 0.17, 0, false);
    const spLeafL = createLowPolyMesh(new THREE.DodecahedronGeometry(0.14, 0), '#4ade80', -0.11, 0.30, 0, false);
    spLeafL.scale.set(1.4, 0.32, 0.9);
    spLeafL.rotation.z = 0.26;
    const spLeafR = createLowPolyMesh(new THREE.DodecahedronGeometry(0.14, 0), '#84cc16', 0.11, 0.30, 0.02, false);
    spLeafR.scale.set(1.4, 0.32, 0.9);
    spLeafR.rotation.z = -0.26;
    tinySproutGrp.add(spStem, spLeafL, spLeafR);
    tinySproutGrp.scale.setScalar(0.01);
    tinySproutGrp.visible = false;
    plotGrp.add(tinySproutGrp);

    plotGrp.position.set(fx, fy, fz);
    worldGroup.add(plotGrp);

    const plotLbl = createWorldLabel('🌱 겨자씨를 심을 흙밭');
    plotLbl.style.opacity = '0';
    const plotObj = { mesh: plotGrp, pos: new THREE.Vector3(fx, fy + 0.8, fz), label: plotLbl };
    miracleWorldMissionObjects.push(plotObj);

    // 2) 아주 작은 겨자씨 1알 + 찾기 쉬운 주변 황금빛 강조 표식 생성
    const seedPos = findSafeOpenWorldOutdoorPos({
      cx, cz, minDist: 10, maxDist: 26, minSpacing: 5.5,
      avoidList: [{ x: cx, z: cz, r: 5.0 }, { x: fx, z: fz, r: 6.5 }]
    });
    const seedGrp = new THREE.Group();
    const basePad = createLowPolyMesh(new THREE.CylinderGeometry(0.18, 0.22, 0.035, 7), '#e7dcc8', 0, 0.02, 0, false);
    const tinySeed = createLowPolyMesh(new THREE.IcosahedronGeometry(0.075, 0), '#5c3a14', 0, 0.095, 0, false);
    const seedInnerRing = new THREE.Mesh(
      new THREE.RingGeometry(0.45, 0.64, 24),
      new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide })
    );
    seedInnerRing.rotation.x = -Math.PI * 0.5;
    seedInnerRing.position.y = 0.055;

    const seedOuterRing = new THREE.Mesh(
      new THREE.RingGeometry(0.86, 1.08, 24),
      new THREE.MeshBasicMaterial({ color: 0xfef08a, side: THREE.DoubleSide, transparent: true, opacity: 0.72 })
    );
    seedOuterRing.rotation.x = -Math.PI * 0.5;
    seedOuterRing.position.y = 0.045;

    const seedBeam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.50, 4.8, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xfde047, transparent: true, opacity: 0.24, side: THREE.DoubleSide, depthWrite: false })
    );
    seedBeam.position.y = 2.4;

    const seedPointer = new THREE.Group();
    seedPointer.position.y = 1.55;
    const pCone = new THREE.Mesh(
      new THREE.ConeGeometry(0.24, 0.46, 4),
      new THREE.MeshBasicMaterial({ color: 0xfacc15 })
    );
    pCone.rotation.x = Math.PI;
    const pHalo = new THREE.Mesh(
      new THREE.TorusGeometry(0.32, 0.045, 5, 12),
      new THREE.MeshBasicMaterial({ color: 0xfef08a })
    );
    pHalo.rotation.x = Math.PI * 0.5;
    pHalo.position.y = 0.14;
    seedPointer.add(pCone, pHalo);

    const seedSparkles = [];
    for (let k = 0; k < 5; k++) {
      const spMesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.085, 0),
        new THREE.MeshBasicMaterial({ color: k % 2 === 0 ? 0xfef08a : 0xfacc15 })
      );
      seedGrp.add(spMesh);
      seedSparkles.push({ mesh: spMesh, phase: (k / 5) * Math.PI * 2 });
    }

    seedGrp.add(basePad, tinySeed, seedInnerRing, seedOuterRing, seedBeam, seedPointer);
    seedGrp.position.set(seedPos.x, seedPos.y, seedPos.z);
    worldGroup.add(seedGrp);

    const seedLbl = createWorldLabel('🔍 아주 작은 겨자씨 (여기 있어요!)');
    seedLbl.style.opacity = '0';
    const seedObj = {
      mesh: seedGrp,
      pos: new THREE.Vector3(seedPos.x, seedPos.y + 0.55, seedPos.z),
      baseY: seedPos.y,
      done: false,
      label: seedLbl
    };
    miracleWorldMissionObjects.push(seedObj);

    // 3) 맑은 물 항아리 생성 (2단계 심기 완료 시 활성화)
    const waterPos = findSafeOpenWorldOutdoorPos({
      cx: fx, cz: fz, minDist: 12, maxDist: 30, minSpacing: 6.5,
      avoidList: [
        { x: cx, z: cz, r: 5.5 },
        { x: fx, z: fz, r: 7.0 },
        { x: seedPos.x, z: seedPos.z, r: 7.0 }
      ]
    });
    const waterGrp = new THREE.Group();
    const wJar = (typeof createWaterFilledAmphoraMesh === 'function')
      ? createWaterFilledAmphoraMesh(1.08)
      : createLowPolyMesh(new THREE.DodecahedronGeometry(0.45, 0), '#38bdf8', 0, 0.45, 0);
    const wRing = new THREE.Mesh(
      new THREE.RingGeometry(0.75, 1.08, 20),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide })
    );
    wRing.rotation.x = -Math.PI * 0.5;
    wRing.position.y = 0.06;
    const wBeam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.26, 0.44, 3.8, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false })
    );
    wBeam.position.y = 1.9;
    waterGrp.add(wJar, wRing, wBeam);
    waterGrp.position.set(waterPos.x, waterPos.y, waterPos.z);
    waterGrp.visible = false;
    worldGroup.add(waterGrp);

    const waterLbl = createWorldLabel('💧 맑은 물 항아리');
    waterLbl.style.opacity = '0';
    const waterObj = {
      mesh: waterGrp,
      pos: new THREE.Vector3(waterPos.x, waterPos.y + 0.65, waterPos.z),
      baseY: waterPos.y,
      done: false,
      label: waterLbl
    };
    miracleWorldMissionObjects.push(waterObj);

    miracleActiveFieldEvent.mustardState = {
      phase: 'find_seed',
      fx, fy, fz,
      plotGrp,
      soilMat,
      beaconRing,
      plotLbl,
      plantedSeedMesh,
      tinySproutGrp,
      seedObj,
      seedSparkles,
      seedOuterRing,
      seedPointer,
      waterObj,
      pourTimer: 0,
      pourJarMesh: null,
      waterParticles: []
    };
    miracleActiveFieldEvent.targetZone = plotObj;
  } else if (evSpot.missionType === 'escort_guide') {
    const eGrp = new THREE.Group();
    const startZ = cz + 1.5;
    const startY = (typeof window.getMiracleNpcSupportY === 'function')
      ? window.getMiracleNpcSupportY(cx, startZ, getMiracleOpenWorldGroundHeight(cx, startZ) + 0.6, 1.35)
      : getMiracleOpenWorldGroundHeight(cx, startZ);
    miracleActiveFieldEvent.escortFollowers = [];

    if (evSpot.escortType === 'stretcher') {
      // 시작 지점 NPC는 운반 컷신 중복 방지를 위해 미션 중 임시 숨김
      if (evSpot.npcMesh) {
        miracleActiveFieldEvent.hiddenSpotNpc = evSpot.npcMesh;
        evSpot.npcMesh.visible = false;
      }

      // 2인 앞·뒤 1열 들것 운반 (좁은 외벽 돌계단 통과 최적화)
      const poleL = createLowPolyMesh(new THREE.CylinderGeometry(0.052, 0.052, 3.55, 6), '#78350f', -0.46, 0.66, 0, false);
      poleL.rotation.x = Math.PI * 0.5;
      const poleR = createLowPolyMesh(new THREE.CylinderGeometry(0.052, 0.052, 3.55, 6), '#78350f',  0.46, 0.66, 0, false);
      poleR.rotation.x = Math.PI * 0.5;
      const bedPad = createLowPolyMesh(new THREE.BoxGeometry(0.98, 0.14, 1.96), '#b45309', 0, 0.66, 0, true);
      const sheet  = createLowPolyMesh(new THREE.BoxGeometry(0.86, 0.06, 1.78), '#f5ead6', 0, 0.75, 0, false);
      const pillow = createLowPolyMesh(new THREE.DodecahedronGeometry(0.20, 0), '#fffbeb', 0, 0.82, -0.72, false);
      pillow.scale.set(1.35, 0.45, 0.80);

      // 앞 1명(z=+1.45), 뒤 1명(z=-1.45) — 서로 다른 보행 위상으로 자연스러운 보행 연출
      const fBack  = createLowPolyPersonMesh('disciple', 1); fBack.position.set(0, 0, -1.45);
      const fFront = createLowPolyPersonMesh('disciple', 2); fFront.position.set(0, 0,  1.45);
      if (fBack.userData) fBack.userData.walkPhase = 0;
      if (fFront.userData) fFront.userData.walkPhase = Math.PI * 0.35;

      // 발바닥 원점(y=0) → rotation.x = -PI/2 시 들것 중앙에 맞춰 누운 중풍병자
      const patient = createLowPolyPersonMesh('villager', 5);
      patient.scale.set(0.78, 0.78, 0.78);
      patient.rotation.x = -Math.PI * 0.5;
      patient.position.set(0, 0.82, 0.78);

      const stretcherOnly = new THREE.Group();
      stretcherOnly.add(poleL, poleR, bedPad, sheet, pillow, patient);
      [[-0.46, -1.05], [0.46, -1.05], [-0.46, 1.05], [0.46, 1.05]].forEach(([kx, kz]) => {
        const knot = createLowPolyMesh(new THREE.CylinderGeometry(0.088, 0.088, 0.11, 7), '#d9b87c', kx, 0.66, kz, false);
        knot.rotation.x = Math.PI * 0.5;
        stretcherOnly.add(knot);
      });
      stretcherOnly.position.y = 0.22;
      eGrp.add(stretcherOnly, fBack, fFront);

      const friendSpecs = [
        { mesh: fBack,  fb: -1, cutSide: -1, cutFb: 1 },
        { mesh: fFront, fb:  1, cutSide:  1, cutFb: 1 }
      ];
      if (fBack.userData) {
        if (fBack.userData.lArm) { fBack.userData.lArm.rotation.x = -0.62; fBack.userData.lArm.rotation.z = -0.14; }
        if (fBack.userData.rArm) { fBack.userData.rArm.rotation.x = -0.62; fBack.userData.rArm.rotation.z =  0.14; }
      }
      if (fFront.userData) {
        if (fFront.userData.lArm) { fFront.userData.lArm.rotation.x = 0.34; fFront.userData.lArm.rotation.z = -0.14; }
        if (fFront.userData.rArm) { fFront.userData.rArm.rotation.x = 0.34; fFront.userData.rArm.rotation.z =  0.14; }
      }

      eGrp.userData = {
        stretcherOnly,
        friends: [fBack, fFront],
        friendSpecs,
        patient,
        raiseBlend: 0,
        curHeading: 0,
        curStretchY: 0.22,
        curStretchPitch: 0,
        smoothSpd: 0,
        isMoving: false
      };
    } else if (evSpot.escortType === 'children') {
      const addChildFollower = (idx, sideOff, backOff, startDist, stopDist) => {
        const ch = createLowPolyPersonMesh('child', idx);
        const fx = cx + sideOff;
        const fz = startZ + (idx === 1 ? 0 : 0.2);
        const fy = (typeof window.getMiracleNpcSupportY === 'function')
          ? window.getMiracleNpcSupportY(fx, fz, startY + 0.6, 1.35)
          : getMiracleOpenWorldGroundHeight(fx, fz);
        ch.position.set(fx, fy, fz);
        worldGroup.add(ch);
        miracleWorldMissionObjects.push({ mesh: ch });
        miracleActiveFieldEvent.escortFollowers.push({
          mesh: ch,
          sideOff,
          backOff,
          strideFactor: 2.05,
          legAmp: 0.68,
          armAmp: 0.60,
          startDist,
          stopDist,
          curHeading: 0,
          isWalking: false
        });
      };
      addChildFollower(1, -0.74, 1.72, 1.00, 0.42);
      addChildFollower(2,  0.74, 2.22, 1.05, 0.45);
    } else if (evSpot.escortType === 'emmaus' && evSpot.npcMesh) {
      // [엠마오 제자 미션] 원래 서 있던 두 제자(글로바 + 친구) 본인이 독립 접지·보행으로 동행하고 완료 후 제자리로 걸어 귀가!
      const reusedList = [];
      const attachOriginal = (npcMesh, fx, fz, sideOff, backOff, homeX, homeZ) => {
        if (!npcMesh) return;
        reclaimReturningNpc(npcMesh);
        reusedList.push({
          mesh: npcMesh,
          origParent: npcMesh.parent,
          origLocalPos: npcMesh.position.clone(),
          origRotY: npcMesh.rotation.y,
          homeWorldX: homeX,
          homeWorldZ: homeZ
        });
        const fy = (typeof window.getMiracleNpcSupportY === 'function')
          ? window.getMiracleNpcSupportY(fx, fz, startY + 0.6, 1.35)
          : getMiracleOpenWorldGroundHeight(fx, fz);
        worldGroup.add(npcMesh);
        npcMesh.position.set(fx, fy, fz);
        npcMesh.rotation.y = 0;
        miracleActiveFieldEvent.escortFollowers.push({
          mesh: npcMesh,
          sideOff,
          backOff,
          strideFactor: 1.65,
          legAmp: 0.60,
          armAmp: 0.52,
          startDist: 1.15,
          stopDist: 0.50,
          curHeading: 0,
          isWalking: false
        });
      };
      attachOriginal(evSpot.npcMesh, cx - 0.65, startZ, -0.78, 1.85, cx, cz);
      if (evSpot.companionNpc) {
        attachOriginal(evSpot.companionNpc, cx + 0.65, startZ - 0.15, 0.78, 2.35, cx + 1.05, cz - 0.25);
      } else {
        const d2 = createLowPolyPersonMesh('disciple', 4);
        const fx = cx + 0.65;
        const fy = (typeof window.getMiracleNpcSupportY === 'function')
          ? window.getMiracleNpcSupportY(fx, startZ, startY + 0.6, 1.35)
          : getMiracleOpenWorldGroundHeight(fx, startZ);
        d2.position.set(fx, fy, startZ);
        worldGroup.add(d2);
        miracleWorldMissionObjects.push({ mesh: d2 });
        miracleActiveFieldEvent.escortFollowers.push({
          mesh: d2,
          sideOff: 0.78,
          backOff: 2.35,
          strideFactor: 1.65,
          legAmp: 0.60,
          armAmp: 0.52,
          startDist: 1.15,
          stopDist: 0.50,
          curHeading: 0,
          isWalking: false
        });
      }
      miracleActiveFieldEvent.reusedEscortNpcs = reusedList;
    } else {
      [-0.74, 0.74].forEach((sideOff, idx) => {
        const d = createLowPolyPersonMesh('disciple', 3 + idx);
        const fx = cx + sideOff;
        const fy = (typeof window.getMiracleNpcSupportY === 'function')
          ? window.getMiracleNpcSupportY(fx, startZ, startY + 0.6, 1.35)
          : getMiracleOpenWorldGroundHeight(fx, startZ);
        d.position.set(fx, fy, startZ);
        worldGroup.add(d);
        miracleWorldMissionObjects.push({ mesh: d });
        miracleActiveFieldEvent.escortFollowers.push({
          mesh: d,
          sideOff,
          backOff: idx === 0 ? 1.85 : 2.35,
          strideFactor: 1.65,
          legAmp: 0.60,
          armAmp: 0.52,
          startDist: 1.10,
          stopDist: 0.45,
          curHeading: 0,
          isWalking: false
        });
      });
    }

    eGrp.position.set(cx, startY, startZ);
    worldGroup.add(eGrp);
    const eLbl = createWorldLabel('👣 동행 중 (목적지까지 함께 걸어가세요!)');
    miracleWorldMissionObjects.push({ mesh: eGrp, label: eLbl });
    miracleActiveFieldEvent.escortGroup = { mesh: eGrp, label: eLbl };

    let gx = evSpot.goalPos.x;
    let gz = evSpot.goalPos.z;
    let gy = evSpot.goalPos.y
      ? (getMiracleOpenWorldGroundHeight(gx, gz) + evSpot.goalPos.y)
      : getMiracleOpenWorldGroundHeight(gx, gz);

    // [어린이 인도 미션] 매번 멀리 있는 실제 나무 중 랜덤 1그루 아래에 예수님 + 빛나는 오라 배치!
    if (evSpot.randomTreeGoal && Array.isArray(window.miracleWorldTreePositions) && window.miracleWorldTreePositions.length > 0) {
      const candidates = window.miracleWorldTreePositions.filter(t => {
        const dist = Math.hypot(t.x - cx, t.z - cz);
        if (dist < 28 || dist > 92) return false;
        const shoreX = (typeof window.getMiracleWestShoreLineX === 'function') ? window.getMiracleWestShoreLineX(t.z) : -92;
        if (t.x < shoreX + 6 || t.x > 96 || Math.abs(t.z) > 95) return false;
        return true;
      });
      const pool = candidates.length > 0 ? candidates : window.miracleWorldTreePositions;
      let picked = null;
      for (let tries = 0; tries < 25; tries++) {
        const tree = pool[Math.floor(Math.random() * pool.length)];
        // 나무 줄기 옆 1.75m 그늘 아래 야외 자리 탐색
        for (let aIdx = 0; aIdx < 8; aIdx++) {
          const ang = (aIdx / 8) * Math.PI * 2;
          const ox = tree.x + Math.cos(ang) * 1.85;
          const oz = tree.z + Math.sin(ang) * 1.85;
          if (isPointOutsideAllBuildings(ox, oz, 0.9)) {
            picked = { x: ox, z: oz, y: getMiracleOpenWorldGroundHeight(ox, oz) };
            break;
          }
        }
        if (picked) break;
      }
      if (picked) {
        gx = picked.x; gz = picked.z; gy = picked.y;
      }
    }

    // [엠마오 두 제자 미션] 매번 안전한 야외 랜덤 위치에 부활하신 예수님과 엠마오 식탁 배치!
    if (evSpot.randomEmmausGoal) {
      const emPos = findSafeOpenWorldOutdoorPos({
        cx: -42, cz: 36,
        minDist: 18, maxDist: 48,
        pad: 2.2
      });
      gx = emPos.x;
      gz = emPos.z;
      gy = emPos.y;
    }

    const gGrp = new THREE.Group();
    if ((evSpot.randomTreeGoal || evSpot.randomEmmausGoal) && typeof createGoldenAuraGroup === 'function') {
      const aura = createGoldenAuraGroup(0xfde047, 2.05);
      gGrp.add(aura);
      miracleActiveFieldEvent.auraGroup = aura;
    } else {
      const gRing = new THREE.Mesh(
        new THREE.RingGeometry(1.6, 2.3, 24),
        new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide })
      );
      gRing.rotation.x = -Math.PI / 2;
      gRing.position.y = 0.1;
      gGrp.add(gRing);
    }
    if (!evSpot.noRooftopJesus) {
      const jesusMesh = createLowPolyPersonMesh('jesus', 0);
      gGrp.add(jesusMesh);
    }
    if (evSpot.randomEmmausGoal && typeof createEmmausTableMesh === 'function') {
      const emTable = createEmmausTableMesh(0.92);
      emTable.position.set(1.55, 0, 0.35);
      gGrp.add(emTable);
    }
    gGrp.position.set(gx, gy, gz);
    worldGroup.add(gGrp);

    const gLbl = createWorldLabel(evSpot.goalLabel);
    gLbl.style.opacity = '0';
    const targetObj = { mesh: gGrp, pos: new THREE.Vector3(gx, gy + 0.5, gz), label: gLbl, goalY: gy };
    miracleWorldMissionObjects.push(targetObj);
    miracleActiveFieldEvent.targetZone = targetObj;

    // [중풍병자 미션] 옥상에서 기다리는 2명의 친구 미리 배치 (총 4명 = 아래 2명 운반 + 옥상 2명 대기)
    if (evSpot.id === 'ev_paralytic') {
      const holeX = gx - 1.2;
      const holeZ = gz - 0.8;
      const roofFriends = [];
      [
        { x: holeX - 1.08, z: holeZ - 1.48, side: -1, idx: 3, phase: 0.4 },
        { x: holeX + 1.08, z: holeZ - 1.48, side:  1, idx: 4, phase: 1.7 }
      ].forEach(spec => {
        const rfY = (typeof window.getMiracleNpcSupportY === 'function')
          ? window.getMiracleNpcSupportY(spec.x, spec.z, gy + 0.5, 1.5)
          : gy;
        const rfMesh = createLowPolyPersonMesh('disciple', spec.idx);
        rfMesh.position.set(spec.x, rfY, spec.z);
        rfMesh.rotation.y = Math.atan2(1.5, 2.8); // 계단 입구 방향을 바라보며 대기
        worldGroup.add(rfMesh);
        miracleWorldMissionObjects.push({ mesh: rfMesh });
        roofFriends.push({
          mesh: rfMesh,
          side: spec.side,
          slotX: spec.x,
          slotZ: spec.z,
          baseY: rfY,
          heading: rfMesh.rotation.y,
          phase: spec.phase
        });
      });
      miracleActiveFieldEvent.rooftopFriends = roofFriends;
    }
  } else if (evSpot.missionType === 'follow_messenger') {
    // [우물가의 여인] 마을 캐릭터 3명을 매번 랜덤 선택 → 여인이 3명에게 소식을 전하러 걸어갈 때 따라가기!
    const allHumanCandidates = [];
    miracleRumorNpcs.forEach(rn => {
      const d = Math.hypot(rn.pos.x - cx, rn.pos.z - cz);
      if (d >= 12 && d <= 72) allHumanCandidates.push({ x: rn.pos.x, z: rn.pos.z, name: rn.speaker || '마을 주민' });
    });
    miracleWanderingActors.forEach((wa, wi) => {
      if (!wa.isAnimal && wa.mesh) {
        const d = Math.hypot(wa.mesh.position.x - cx, wa.mesh.position.z - cz);
        if (d >= 12 && d <= 72) allHumanCandidates.push({ x: wa.mesh.position.x, z: wa.mesh.position.z, name: `마을 이웃 ${wi + 1}` });
      }
    });

    // 무작위 셔플 후 서로 10m 이상 떨어진 3명 선정
    for (let i = allHumanCandidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allHumanCandidates[i], allHumanCandidates[j]] = [allHumanCandidates[j], allHumanCandidates[i]];
    }
    const recipients = [];
    for (let i = 0; i < allHumanCandidates.length && recipients.length < 3; i++) {
      const cand = allHumanCandidates[i];
      if (recipients.every(r => Math.hypot(r.x - cand.x, r.z - cand.z) >= 10.0)) {
        const safePos = findSafeOpenWorldOutdoorPos({ cx: cand.x, cz: cand.z, minDist: 0.5, maxDist: 5.5, pad: 1.15 });
        if (isMiracleNpcPointClear(safePos.x, safePos.z, 0.85)) {
          recipients.push({ x: safePos.x, y: safePos.y, z: safePos.z, name: cand.name, told: false });
        }
      }
    }
    let fallbackTries = 0;
    while (recipients.length < 3 && fallbackTries < 24) {
      fallbackTries++;
      const p = findSafeOpenWorldOutdoorPos({ cx, cz, minDist: 14, maxDist: 42, minSpacing: 12, pad: 1.15, avoidList: recipients });
      if (isMiracleNpcPointClear(p.x, p.z, 0.85) || fallbackTries >= 18) {
        recipients.push({ x: p.x, y: p.y, z: p.z, name: `수가성 주민 ${recipients.length + 1}`, told: false });
      }
    }
    // 여인의 출발점에서 가장 가까운 순서대로 자연스러운 이동 경로 정렬
    const ordered = [];
    let curPt = { x: cx, z: cz };
    while (recipients.length > 0) {
      let bestIdx = 0, bestD = Infinity;
      for (let i = 0; i < recipients.length; i++) {
        const d = Math.hypot(recipients[i].x - curPt.x, recipients[i].z - curPt.z);
        if (d < bestD) { bestD = d; bestIdx = i; }
      }
      const next = recipients.splice(bestIdx, 1)[0];
      ordered.push(next);
      curPt = next;
    }

    // 3명의 소식 대상 NPC 마커 생성
    ordered.forEach((rec, idx) => {
      const rGrp = new THREE.Group();
      const recNpc = createLowPolyPersonMesh(idx === 1 ? 'woman' : 'villager', 60 + idx);
      const rRing = new THREE.Mesh(
        new THREE.RingGeometry(1.1, 1.55, 20),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide })
      );
      rRing.rotation.x = -Math.PI / 2;
      rRing.position.y = 0.08;
      rGrp.add(recNpc, rRing);
      rGrp.position.set(rec.x, rec.y, rec.z);
      worldGroup.add(rGrp);
      const rLbl = createWorldLabel(`🗣️ 소식 들을 주민 #${idx + 1}`);
      rLbl.style.opacity = '0';
      rec.group = rGrp;
      rec.ring = rRing;
      rec.label = rLbl;
      miracleWorldMissionObjects.push({ mesh: rGrp, label: rLbl });
    });

    // 원래 우물가에 서 있던 여인 NPC 본인을 직접 이동시켜 복제 없이 자연스럽게 따라가기 구현!
    let wMesh = null;
    let reusedSpotNpc = false;
    let origParent = null;
    let origLocalPos = null;
    let origRotY = 0;
    let startWX = cx, startWZ = cz;
    if (!isPointOutsideAllBuildings(startWX, startWZ, 0.72)) {
      const clearStart = findSafeOpenWorldOutdoorPos({ cx: cx + 1.2, cz, minDist: 0.2, maxDist: 4.0, pad: 0.85 });
      startWX = clearStart.x;
      startWZ = clearStart.z;
    }
    const wy = getMiracleOpenWorldGroundHeight(startWX, startWZ);
    if (evSpot.npcMesh) {
      reclaimReturningNpc(evSpot.npcMesh);
      wMesh = evSpot.npcMesh;
      reusedSpotNpc = true;
      origParent = wMesh.parent;
      origLocalPos = wMesh.position.clone();
      origRotY = wMesh.rotation.y;
      worldGroup.add(wMesh);
      wMesh.position.set(startWX, wy, startWZ);
    } else {
      wMesh = createLowPolyPersonMesh('woman', 88);
      wMesh.position.set(startWX, wy, startWZ);
      worldGroup.add(wMesh);
    }
    const wRing = new THREE.Mesh(
      new THREE.RingGeometry(0.85, 1.15, 18),
      new THREE.MeshBasicMaterial({ color: 0x0ea5e9, side: THREE.DoubleSide })
    );
    wRing.rotation.x = -Math.PI / 2;
    wRing.position.y = 0.07;
    wMesh.add(wRing);
    const wLbl = createWorldLabel('🏃‍♀️ 수가성 여인 (15m 안에 따라오세요!)');
    miracleWorldMissionObjects.push({ mesh: wMesh, label: wLbl, keepInWorld: reusedSpotNpc });

    miracleActiveFieldEvent.messenger = {
      mesh: wMesh,
      ringMesh: wRing,
      reusedSpotNpc,
      origParent,
      origLocalPos,
      origRotY,
      homeWorldX: cx,
      homeWorldZ: cz,
      walkHomeOnClear: false,
      label: wLbl,
      recipients: ordered,
      targetIdx: 0,
      pauseTimer: 0.6,
      speed: 4.1,
      targetSpeed: 4.3,
      speedTimer: 1.8 + Math.random() * 1.4,
      isSprinting: false,
      avoidSide: 0,
      avoidHoldTimer: 0,
      curHeading: 0,
      progressAnchor: null,
      phase: 0
    };
    miracleActiveFieldEvent.targetZone = { pos: wMesh.position };
  } else if (evSpot.missionType === 'chase_sheep') {
    // [잃어버린 어린양] 언덕 아래(낮은 지형 maxY <= 2.2) 야외 랜덤 위치 스폰!
    const sPos = findSafeOpenWorldOutdoorPos({
      cx: -40, cz: 14,
      xMin: -54, xMax: -18, zMin: -6, zMax: 36,
      maxY: 2.2, minDist: 6.0, pad: 1.6
    });
    const sGrp = new THREE.Group();
    const sheepMesh = (typeof createLowPolyAnimalMesh === 'function')
      ? createLowPolyAnimalMesh('sheep', 1.1)
      : createSingleAnimal('sheep');
    const sRing = new THREE.Mesh(
      new THREE.RingGeometry(0.95, 1.35, 18),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide })
    );
    sRing.rotation.x = -Math.PI / 2;
    sRing.position.y = 0.08;
    sGrp.add(sheepMesh, sRing);
    sGrp.position.set(sPos.x, sPos.y, sPos.z);
    worldGroup.add(sGrp);

    const sLbl = createWorldLabel(evSpot.findTargetLabel || '🐑 언덕 아래 잃어버린 어린양!');
    sLbl.style.opacity = '0';
    miracleWorldMissionObjects.push({ mesh: sGrp, label: sLbl });
    miracleActiveFieldEvent.sheepState = {
      mesh: sGrp,
      animal: sheepMesh,
      label: sLbl,
      heading: Math.random() * Math.PI * 2,
      burstTimer: 0,
      cooldownTimer: 0,
      wanderTimer: 0,
      wanderAng: Math.random() * Math.PI * 2
    };
    miracleActiveFieldEvent.targetZone = { mesh: sGrp, pos: sGrp.position, label: sLbl };
  } else if (evSpot.missionType === 'find_observe') {
    let fx = evSpot.findTargetPos.x;
    let fz = evSpot.findTargetPos.z;
    let fy = getMiracleOpenWorldGroundHeight(fx, fz);

    if (evSpot.zacchaeusGrove) {
      // [삭개오 미션] 여리고 미션 구역 내 랜덤 위치에 삭개오가 앉아있는 전용 돌무화과나무 스폰 + 군중(12명)·예수님 등장!
      const grove = Array.isArray(window.miracleZacchaeusGroveTrees) ? window.miracleZacchaeusGroveTrees : [];
      const bBounds = Array.isArray(window.miracleBuildingBounds) ? window.miracleBuildingBounds : [];
      const isClearForZacTree = (cx, cz, minTreeDist = 3.8) => {
        for (let i = 0; i < grove.length; i++) {
          if (Math.hypot(cx - grove[i].x, cz - grove[i].z) < minTreeDist) return false;
        }
        for (let i = 0; i < bBounds.length; i++) {
          const b = bBounds[i];
          if (cx >= b.minX - 2.6 && cx <= b.maxX + 2.6 && cz >= b.minZ - 2.6 && cz <= b.maxZ + 2.6) return false;
        }
        return true;
      };

      const candidateZones = [
        { x: 27.6, z: -6.2 },
        { x: 34.4, z: -13.6 },
        { x: 43.2, z: -10.8 },
        { x: 47.2, z: -1.4 },
        { x: 34.0, z:  4.6 },
        { x: 41.2, z:  0.6 },
        { x: 34.8, z: -3.2 },
        { x: 40.6, z: -6.8 }
      ].filter(pt => isClearForZacTree(pt.x, pt.z, 3.6));

      let treeX = 34.8, treeZ = -3.2;
      if (candidateZones.length > 0) {
        const picked = candidateZones[Math.floor(Math.random() * candidateZones.length)];
        // 후보지 주변 미세 랜덤 오프셋으로 매번 새로운 위치감 부여
        const jx = picked.x + (Math.random() - 0.5) * 1.4;
        const jz = picked.z + (Math.random() - 0.5) * 1.4;
        if (isClearForZacTree(jx, jz, 3.4)) {
          treeX = jx;
          treeZ = jz;
        } else {
          treeX = picked.x;
          treeZ = picked.z;
        }
      }

      // 예수님과 군중 위치: 전용 나무에서 5.8~7.2m 거리이며 숲 나무/건물과 겹치지 않는 안전 지점 선정
      let jesusX = 36.2, jesusZ = -5.8;
      if (!isClearForZacTree(jesusX, jesusZ, 3.4) || Math.hypot(treeX - jesusX, treeZ - jesusZ) < 5.6) {
        let foundJ = false;
        const baseAng = Math.atan2(jesusX - treeX, jesusZ - treeZ) || 0.8;
        for (let ai = 0; ai < 12; ai++) {
          const ang = baseAng + (ai * Math.PI * 2) / 12;
          const cxJ = Math.max(28.5, Math.min(45.5, treeX + Math.sin(ang) * 6.4));
          const czJ = Math.max(-13.0, Math.min(4.2, treeZ + Math.cos(ang) * 6.4));
          if (isClearForZacTree(cxJ, czJ, 3.2)) {
            jesusX = cxJ;
            jesusZ = czJ;
            foundJ = true;
            break;
          }
        }
        if (!foundJ) {
          const awayAng = Math.atan2(jesusX - treeX, jesusZ - treeZ) || 0.8;
          jesusX = Math.max(29.0, Math.min(44.5, treeX + Math.sin(awayAng) * 6.4));
          jesusZ = Math.max(-11.5, Math.min(3.0, treeZ + Math.cos(awayAng) * 6.4));
        }
      }

      // 삭개오 전용 돌무화과나무 생성 (턴어라운드 기반 노출 주 가지 + 높은 올리브그린 수관)
      const zacTreeScale = 1.32;
      const perchTree = (typeof window.createZacchaeusPerchSycamoreTree === 'function')
        ? window.createZacchaeusPerchSycamoreTree(treeX, treeZ, zacTreeScale, jesusX, jesusZ)
        : null;

      if (perchTree) {
        fx = perchTree.perchWorldPos.x;
        fy = perchTree.perchWorldPos.y;
        fz = perchTree.perchWorldPos.z;
        miracleWorldMissionObjects.push({
          mesh: perchTree.group,
          collider: perchTree.trunkCollider,
          wallMeshes: perchTree.registeredWallMeshes
        });
      } else {
        fx = treeX + 1.4;
        fz = treeZ + 0.5;
        fy = getMiracleOpenWorldGroundHeight(treeX, treeZ) + 2.6;
      }

      // 카메라 시야가 가장 트인 무대 측면(stageSideSign) 선정 + 군중은 예수님 뒤·반대편 반원 배경에 배치해 가림 원천 차단!
      const toTreeDx = treeX - jesusX;
      const toTreeDz = treeZ - jesusZ;
      const toTreeLen = Math.hypot(toTreeDx, toTreeDz) || 1;
      const fwdX = toTreeDx / toTreeLen;
      const fwdZ = toTreeDz / toTreeLen;
      const sideX = fwdZ;
      const sideZ = -fwdX;
      const scoreStageSide = (s) => {
        const ax = jesusX + fwdX * 1.4 + sideX * s * 3.4;
        const az = jesusZ + fwdZ * 1.4 + sideZ * s * 3.4;
        const bx = jesusX + fwdX * 2.55 + sideX * s * 1.25;
        const bz = jesusZ + fwdZ * 2.55 + sideZ * s * 1.25;
        let minD = 999;
        grove.forEach(gt => {
          minD = Math.min(minD, Math.hypot(ax - gt.x, az - gt.z), Math.hypot(bx - gt.x, bz - gt.z));
        });
        for (let bi = 0; bi < bBounds.length; bi++) {
          const b = bBounds[bi];
          if (ax >= b.minX - 1.5 && ax <= b.maxX + 1.5 && az >= b.minZ - 1.5 && az <= b.maxZ + 1.5) minD -= 5;
        }
        return minD;
      };
      const stageSideSign = (scoreStageSide(1) >= scoreStageSide(-1)) ? 1 : -1;

      const crowdGrp = new THREE.Group();
      const jesusY = getMiracleOpenWorldGroundHeight(jesusX, jesusZ);
      const jesusNpc = createLowPolyPersonMesh('jesus', 0);
      jesusNpc.position.set(jesusX, jesusY, jesusZ);
      setFlatYawToward(jesusNpc, fx, fz);
      crowdGrp.add(jesusNpc);

      // 군중(11명)은 카메라 전면(+stageSide) 및 나무-예수님 사이(fwd)를 피해 뒤·반대편 반원에 배치!
      const crowdCenterX = -fwdX * 0.72 - sideX * stageSideSign * 0.68;
      const crowdCenterZ = -fwdZ * 0.72 - sideZ * stageSideSign * 0.68;
      const crowdArcCenter = Math.atan2(crowdCenterX, crowdCenterZ);
      const crowdMembers = [];
      for (let ci = 0; ci < 11; ci++) {
        const frac = (ci / 10) * 2 - 1; // -1 .. +1
        const ang = crowdArcCenter + frac * 1.30;
        const rad = 2.55 + (ci % 3) * 0.85;
        const px = jesusX + Math.sin(ang) * rad;
        const pz = jesusZ + Math.cos(ang) * rad;
        if (Math.hypot(px - treeX, pz - treeZ) < 2.6 || !isClearForZacTree(px, pz, 2.0)) continue;
        const py = getMiracleOpenWorldGroundHeight(px, pz);
        const preset = ci % 3 === 0 ? 'woman' : (ci % 4 === 0 ? 'child' : 'villager');
        const cNpc = createLowPolyPersonMesh(preset, 70 + ci);
        cNpc.position.set(px, py, pz);
        setFlatYawToward(cNpc, jesusX, jesusZ);
        crowdGrp.add(cNpc);
        crowdMembers.push({
          mesh: cNpc,
          homePos: new THREE.Vector3(px, py, pz),
          ringPos: null,
          blessingPos: null,
          cheerTimer: 0,
          phase: ci * 0.85
        });
      }
      worldGroup.add(crowdGrp);
      miracleWorldMissionObjects.push({ mesh: crowdGrp });
      miracleActiveFieldEvent.crowdGroup = crowdGrp;
      miracleActiveFieldEvent.crowdCenter = { x: jesusX, z: jesusZ };

      const fGrp = new THREE.Group();
      // 키가 매우 작은 삭개오 모델 (createLowPolyPersonMesh 내부 uniform scale = 0.66 그대로 유지)
      const zacMesh = createLowPolyPersonMesh('zacchaeus', 5);
      // 턴어라운드 이미지 포즈: 두 다리 앞으로 굽혀 내리고, 왼손(+X rArm)으로 중앙 기둥을 짚고 오른손(-X lArm)은 가지 짚기
      if (zacMesh.userData) {
        const zu = zacMesh.userData;
        if (zu.lLeg && zu.rLeg) {
          zu.lLeg.rotation.x = -1.35;
          zu.rLeg.rotation.x = -1.35;
        }
        if (zu.lKnee && zu.rKnee) {
          zu.lKnee.rotation.x = 1.32;
          zu.rKnee.rotation.x = 1.32;
        }
        if (zu.rArm) {
          zu.rArm.rotation.x = -0.52;
          zu.rArm.rotation.z = 0.72;
          if (zu.rElbow) zu.rElbow.rotation.x = -0.48;
        }
        if (zu.lArm) {
          zu.lArm.rotation.x = -0.22;
          zu.lArm.rotation.z = -0.18;
          if (zu.lElbow) zu.lElbow.rotation.x = -0.26;
        }
      }
      // 앉은 자세에서 엉덩이가 나뭇가지 윗면 바로 위에 안정적으로 놓이도록 미세 높이 보정
      zacMesh.position.y = -0.42;
      fGrp.add(zacMesh);
      fGrp.position.set(fx, fy, fz);
      setFlatYawToward(fGrp, jesusX, jesusZ);
      worldGroup.add(fGrp);

      const fLbl = createWorldLabel(evSpot.findTargetLabel);
      fLbl.style.opacity = '0';
      const targetObj = {
        mesh: fGrp,
        pos: new THREE.Vector3(fx, fy + 0.95, fz),
        label: fLbl,
        treePos: { x: treeX, z: treeZ },
        perchTree
      };
      miracleWorldMissionObjects.push(targetObj);
      miracleActiveFieldEvent.targetZone = targetObj;
      miracleActiveFieldEvent.zacchaeusData = {
        zacGroup: fGrp,
        zacMesh,
        jesusNpc,
        jesusPos: new THREE.Vector3(jesusX, jesusY, jesusZ),
        stageSideSign,
        perchTree,
        perchPos: new THREE.Vector3(fx, fy, fz),
        treePos: new THREE.Vector3(treeX, getMiracleOpenWorldGroundHeight(treeX, treeZ), treeZ),
        crowdMembers,
        confessPos: null,
        pouchPos: null,
        pouchMesh: null,
        blessingAura: null,
        gaugePct: 100,
        tossCount: 0,
        reachedHalf: false,
        finishDelay: 0,
        throwAnimTimer: 0,
        throwTargetYaw: null,
        flyingCoins: [],
        sparkles: [],
        dragging: false,
        dragPointerId: null,
        dragStart: { x: 0, y: 0 },
        dragCurr: { x: 0, y: 0 },
        pouchScreenPos: null,
        highCamYaw: 0.45,
        _cutsceneEntered: false,
        _savedHud: null
      };
    } else if (evSpot.alleyRandomAura) {
      // [10명 중 돌아온 1명] 마을 건물 사이 랜덤 골목 + 빛나는 오라!
      const aPos = findSafeOpenWorldOutdoorPos({
        cx: -8, cz: 10, minDist: 16, maxDist: 58, nearBuildings: true, pad: 1.5
      });
      fx = aPos.x; fy = aPos.y; fz = aPos.z;
      const fGrp = new THREE.Group();
      const samMesh = createLowPolyPersonMesh('disciple', 29);
      fGrp.add(samMesh);
      if (typeof createGoldenAuraGroup === 'function') {
        const aura = createGoldenAuraGroup(0xf59e0b, 1.75);
        fGrp.add(aura);
        miracleActiveFieldEvent.auraGroup = aura;
      }
      fGrp.position.set(fx, fy, fz);
      worldGroup.add(fGrp);

      const fLbl = createWorldLabel(evSpot.findTargetLabel);
      fLbl.style.opacity = '0';
      const targetObj = { mesh: fGrp, pos: new THREE.Vector3(fx, fy + 0.5, fz), label: fLbl };
      miracleWorldMissionObjects.push(targetObj);
      miracleActiveFieldEvent.targetZone = targetObj;
    } else if (evSpot.widowCutscene) {
      // [두 렙돈 과부] 성전 청동 헌금함 + 가난한 과부 배치 (접근 시 동전 2개 넣는 컷신 실행!)
      const fGrp = new THREE.Group();
      const widowMesh = createLowPolyPersonMesh('woman', 44);
      widowMesh.position.set(-0.95, 0, 0);
      widowMesh.rotation.y = Math.PI * 0.5;

      // 성전 나팔형 청동 헌금함(Treasury Box)
      const boxPed = createLowPolyMesh(createOrganicBoxGeo(0.95, 0.95, 0.95, 610, 0.04, 0.96, 1), '#b8a27c', 0.45, 0.48, 0, true);
      const chest  = createLowPolyMesh(createOrganicBoxGeo(0.76, 0.62, 0.76, 611, 0.04, 0.96, 1), '#92400e', 0.45, 1.24, 0, true);
      const funnel = createLowPolyMesh(new THREE.CylinderGeometry(0.28, 0.12, 0.42, 8), '#eab308', 0.45, 1.74, 0, true);
      const slot   = createLowPolyMesh(new THREE.CylinderGeometry(0.16, 0.14, 0.06, 8), '#1c1917', 0.45, 1.94, 0, false);

      const fRing = new THREE.Mesh(
        new THREE.RingGeometry(1.4, 1.95, 24),
        new THREE.MeshBasicMaterial({ color: 0xfef08a, side: THREE.DoubleSide })
      );
      fRing.rotation.x = -Math.PI / 2;
      fRing.position.y = 0.08;
      fGrp.add(widowMesh, boxPed, chest, funnel, slot, fRing);
      fGrp.position.set(fx, fy, fz);
      worldGroup.add(fGrp);

      const fLbl = createWorldLabel(evSpot.findTargetLabel);
      fLbl.style.opacity = '0';
      const targetObj = {
        mesh: fGrp,
        pos: new THREE.Vector3(fx, fy + 0.5, fz),
        label: fLbl,
        widowMesh,
        boxSlotWorldPos: new THREE.Vector3(fx + 0.45, fy + 1.95, fz)
      };
      miracleWorldMissionObjects.push(targetObj);
      miracleActiveFieldEvent.targetZone = targetObj;
    } else if (evSpot.thomasCutscene) {
      // [부활 이후 도마 미션] 사도 도마 본인이 플레이어를 따라 걸어오고, 미션 완료 후 제자리로 걸어 귀가!
      if (evSpot.npcMesh) {
        reclaimReturningNpc(evSpot.npcMesh);
        const origParent = evSpot.npcMesh.parent;
        const origLocalPos = evSpot.npcMesh.position.clone();
        const origRotY = evSpot.npcMesh.rotation.y;
        const wp = new THREE.Vector3();
        if (typeof evSpot.npcMesh.getWorldPosition === 'function') evSpot.npcMesh.getWorldPosition(wp);
        else wp.set(evSpot.x, getMiracleOpenWorldGroundHeight(evSpot.x, evSpot.z), evSpot.z);
        worldGroup.add(evSpot.npcMesh);
        evSpot.npcMesh.position.set(wp.x, getMiracleOpenWorldGroundHeight(wp.x, wp.z), wp.z);
        evSpot.npcMesh.visible = true;
        miracleActiveFieldEvent.thomasFollower = {
          mesh: evSpot.npcMesh,
          origParent,
          origLocalPos,
          origRotY,
          homeWorldX: evSpot.x,
          homeWorldZ: evSpot.z,
          speed: 7.4,
          curHeading: evSpot.npcMesh.rotation.y || 0,
          phase: 0.7,
          navPath: null,
          navPathIdx: 0
        };
        miracleActiveFieldEvent.reusedEscortNpcs = [{
          mesh: evSpot.npcMesh,
          origParent,
          origLocalPos,
          origRotY,
          homeWorldX: evSpot.x,
          homeWorldZ: evSpot.z
        }];
      }

      // 예수님 위치를 매번 안전한 야외 랜덤 좌표로 스폰! + 무릎 높이 파형·파티클 오라 + 양손 못자국 컷신
      if (evSpot.randomJesusSpawn) {
        const tPos = findSafeOpenWorldOutdoorPos({
          cx: -14.5, cz: 56,
          minDist: 14, maxDist: 46,
          pad: 2.0
        });
        fx = tPos.x;
        fy = tPos.y;
        fz = tPos.z;
      }
      const fGrp = new THREE.Group();
      const jesusMesh = createLowPolyPersonMesh('jesus', 0);
      jesusMesh.position.set(0, 0, 0);
      jesusMesh.rotation.y = 0;

      // 예수님 둥근 소프트 로우폴리 양손바닥 중앙에 선명한 십자가 못자국(Wound Mark) + 미세한 빛 고리 추가
      const woundMarks = [];
      if (jesusMesh.userData) {
        [jesusMesh.userData.lArm, jesusMesh.userData.rArm].forEach((armGrp) => {
          if (!armGrp) return;
          const handAnchor = (armGrp.userData && armGrp.userData.handPivot) ? armGrp.userData.handPivot : armGrp;
          const wound = createLowPolyMesh(new THREE.DodecahedronGeometry(0.038, 0), '#881337', 0, -0.595, 0.052, false);
          wound.scale.set(1.0, 1.0, 0.45);
          const woundHalo = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.088, 0),
            new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.72 })
          );
          woundHalo.position.set(0, -0.595, 0.068);
          woundHalo.visible = false;
          handAnchor.add(wound, woundHalo);
          woundMarks.push({ wound, woundHalo });
        });
      }

      // 컷신 시작 시 걸어 나와 못자국을 확인하고 무릎 꿇을 도마 캐릭터
      const thomasMesh = createLowPolyPersonMesh('disciple', 23);
      thomasMesh.position.set(0, 0, 1.95);
      thomasMesh.rotation.y = Math.PI;
      thomasMesh.visible = false;

      fGrp.add(jesusMesh, thomasMesh);
      if (typeof createGoldenAuraGroup === 'function') {
        const aura = createGoldenAuraGroup(0x38bdf8, 1.75);
        fGrp.add(aura);
        miracleActiveFieldEvent.auraGroup = aura;
      }

      fGrp.position.set(fx, fy, fz);
      worldGroup.add(fGrp);

      const fLbl = createWorldLabel(evSpot.findTargetLabel);
      fLbl.style.opacity = '0';
      const targetObj = {
        mesh: fGrp,
        pos: new THREE.Vector3(fx, fy + 0.5, fz),
        label: fLbl,
        jesusMesh,
        thomasMesh,
        woundMarks
      };
      miracleWorldMissionObjects.push(targetObj);
      miracleActiveFieldEvent.targetZone = targetObj;
    } else {
      const fGrp = new THREE.Group();
      const targetPerson = createLowPolyPersonMesh(evSpot.targetPreset || evSpot.npcPreset || 'disciple', 5);
      const fRing = new THREE.Mesh(
        new THREE.RingGeometry(1.2, 1.75, 24),
        new THREE.MeshBasicMaterial({ color: 0xfef08a, side: THREE.DoubleSide })
      );
      fRing.rotation.x = -Math.PI / 2;
      fRing.position.y = 0.08;
      fGrp.add(targetPerson, fRing);
      fGrp.position.set(fx, fy, fz);
      worldGroup.add(fGrp);

      const fLbl = createWorldLabel(evSpot.findTargetLabel);
      fLbl.style.opacity = '0';
      const targetObj = { mesh: fGrp, pos: new THREE.Vector3(fx, fy + 0.5, fz), label: fLbl };
      miracleWorldMissionObjects.push(targetObj);
      miracleActiveFieldEvent.targetZone = targetObj;
    }
  } else if (evSpot.missionType === 'breakfast_fish_cook') {
    // =========================================================================
    // [부활 이후 갈릴리 바닷가 아침식사] 4단계 미니게임
    // 1) 힘 조절 장대 낚시줄 투척 (멀리 던질수록 입질이 빠르고 잘 잡힘!)
    // 2) 입질 시 랜덤 속도 & 랜덤 초록 구간 타이밍 게이지
    // 3) 예수님과 바닷가 모닥불 옆에 둘러앉아 물고기 굽기 & 먹기
    // 4) 제한시간 초과 시 타서 실패! 완료 시 불꺼진 숯 모닥불 영구 보존!
    // =========================================================================
    const modeKey = (typeof currentMode !== 'undefined') ? currentMode : 'junior';
    const reqFish = (modeKey === 'kinder') ? 2 : (modeKey === 'junior' ? 3 : 4);
    miracleActiveFieldEvent.required = reqFish;
    miracleActiveFieldEvent.cutsceneCameraActive = true;

    const shoreZ = -78.0;
    const shoreX = (typeof window.getMiracleWestShoreLineX === 'function')
      ? window.getMiracleWestShoreLineX(shoreZ)
      : -92.4;
    const standX = shoreX + 4.4;
    const standZ = shoreZ;
    const standY = getMiracleOpenWorldGroundHeight(standX, standZ);
    const fireX = shoreX + 9.4;
    const fireZ = -76.2;
    const fireY = getMiracleOpenWorldGroundHeight(fireX, fireZ);

    // 같은 자리에 이미 남아있던 불꺼진 모닥불과 이벤트 시작점 예수님 NPC는 미션 진행 중 임시 숨김 (중복 방지)
    if (Array.isArray(window.miracleBurntCampfireMeshes)) {
      window.miracleBurntCampfireMeshes.forEach(cf => {
        if (cf.mesh && Math.hypot(cf.x - fireX, cf.z - fireZ) < 4.5) cf.mesh.visible = false;
      });
    }
    let hiddenSpotNpc = null;
    if (evSpot.npcMesh) {
      hiddenSpotNpc = evSpot.npcMesh;
      hiddenSpotNpc.visible = false;
    }

    const returnPos = playerPos.clone();
    playerPos.set(standX, standY, standZ);
    playerFacing = -Math.PI * 0.5; // 서쪽 갈릴리 바다를 정면으로 바라봄
    if (typeof playerGroup !== 'undefined' && playerGroup) {
      playerGroup.position.copy(playerPos);
      playerGroup.rotation.y = playerFacing;
    }

    // [Image 1 레퍼런스] 곡선 마디 대나무 낚싯대 부착 + 바닷가 대바구니/토기 그릇 배치!
    const rodMesh = (typeof createFishingRodMesh === 'function')
      ? createFishingRodMesh(0.95)
      : createLowPolyMesh(new THREE.CylinderGeometry(0.03, 0.05, 3.2, 5), '#92400e', 0, 1.6, 0, false);
    rodMesh.position.set(0.02, -0.45, 0.14);
    rodMesh.rotation.x = 0.85;
    if (playerLimbs && playerLimbs.rArm) {
      playerLimbs.rArm.add(rodMesh);
      playerLimbs.rArm.rotation.x = -0.85;
    } else {
      rodMesh.position.set(standX - 0.5, standY + 1.2, standZ);
      rodMesh.rotation.z = Math.PI * 0.35;
      worldGroup.add(rodMesh);
      miracleWorldMissionObjects.push({ mesh: rodMesh });
    }
    const rodTipNode = (rodMesh.userData && rodMesh.userData.tipNode) ? rodMesh.userData.tipNode : rodMesh;

    // 바닷가 모래 위 대바구니 & 토기 그릇(Image 1 스타일 소품)
    if (typeof createWickerBasketMesh === 'function') {
      const beachBasket = createWickerBasketMesh(0.95);
      const bx = standX + 1.15, bz = standZ - 1.25;
      beachBasket.position.set(bx, getMiracleOpenWorldGroundHeight(bx, bz), bz);
      worldGroup.add(beachBasket);
      miracleWorldMissionObjects.push({ mesh: beachBasket });
    }

    // 바다 위 빨간/하얀 낚시 찌(Bobber) + 돌추·황금 바늘(Image 1 디테일) + 수면 파동 링 + 낚시줄 메시
    const bobberGrp = new THREE.Group();
    const bobTop = createLowPolyMesh(new THREE.DodecahedronGeometry(0.16, 0), '#ef4444', 0, 0.14, 0, false);
    const bobBot = createLowPolyMesh(new THREE.DodecahedronGeometry(0.14, 0), '#f8fafc', 0, -0.04, 0, false);
    const sinkerStone = createLowPolyMesh(new THREE.DodecahedronGeometry(0.12, 0), '#94a3b8', 0, -0.28, 0, false);
    const hookMesh = createLowPolyMesh(new THREE.ConeGeometry(0.05, 0.18, 4), '#eab308', 0.08, -0.24, 0, false);
    hookMesh.rotation.z = 0.7;
    const bobRipple = new THREE.Mesh(
      new THREE.RingGeometry(0.32, 0.56, 18),
      new THREE.MeshBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.78, side: THREE.DoubleSide })
    );
    bobRipple.rotation.x = -Math.PI * 0.5;
    bobRipple.position.y = 0.02;
    bobberGrp.add(bobTop, bobBot, sinkerStone, hookMesh, bobRipple);
    bobberGrp.visible = true;
    worldGroup.add(bobberGrp);
    miracleWorldMissionObjects.push({ mesh: bobberGrp });

    const lineMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 1.0, 4),
      new THREE.MeshBasicMaterial({ color: 0xfef3c7 })
    );
    lineMesh.visible = true;
    worldGroup.add(lineMesh);
    miracleWorldMissionObjects.push({ mesh: lineMesh });

    // 잡힌 순간 물 위로 뛰어오르는 소프트 로우폴리 갈릴리 물고기 3D 메시
    const leapFish = (typeof createLowPolyFishMesh === 'function')
      ? createLowPolyFishMesh(null, 1.05, 1)
      : (() => {
          const g = new THREE.Group();
          g.add(createLowPolyMesh(new THREE.DodecahedronGeometry(0.28, 0), '#38bdf8', 0, 0, 0, false));
          return g;
        })();
    leapFish.visible = false;
    worldGroup.add(leapFish);
    miracleWorldMissionObjects.push({ mesh: leapFish });

    // 바닷가 활활 타는 숯불 모닥불 + 앉을 자리(나무 둥치/방석) + 모닥불 옆 예수님 + 식사 접시(먹기 단계 시 표시)
    const campGrp = new THREE.Group();
    const campfire = (typeof createGalileeCampfireMesh === 'function')
      ? createGalileeCampfireMesh(false, 1.08)
      : createLowPolyMesh(new THREE.ConeGeometry(0.5, 1.0, 5), '#f97316', 0, 0.5, 0, false);
    campGrp.add(campfire);

    // 예수님 & 플레이어가 모닥불 옆에 나란히 앉을 소프트 로우폴리 통나무 의자 2개
    const seatJesus = createLowPolyMesh(new THREE.CylinderGeometry(0.46, 0.50, 0.34, 7), '#78350f', 1.55, 0.17, 0.55, true);
    const seatPlayer = createLowPolyMesh(new THREE.CylinderGeometry(0.46, 0.50, 0.34, 7), '#78350f', -1.55, 0.17, 0.75, true);
    campGrp.add(seatJesus, seatPlayer);

    const jesusByFire = createLowPolyPersonMesh('jesus', 0);
    jesusByFire.position.set(1.55, 0.16, 0.55);
    jesusByFire.rotation.y = Math.atan2(-1.55, -0.55);
    if (jesusByFire.userData && jesusByFire.userData.lLeg && jesusByFire.userData.rLeg) {
      jesusByFire.userData.lLeg.rotation.x = -1.20;
      jesusByFire.userData.rLeg.rotation.x = -1.20;
    }
    campGrp.add(jesusByFire);

    // 맛있게 구운 생선 & 떡이 담긴 식사 쟁반 (먹기 단계에 등장!)
    const mealPlatterGrp = new THREE.Group();
    const platter = createLowPolyMesh(new THREE.CylinderGeometry(0.58, 0.50, 0.08, 8), '#92400e', 0, 0.24, 1.15, false);
    const cookedF1 = createLowPolyMesh(new THREE.DodecahedronGeometry(0.20, 0), '#d97706', -0.16, 0.34, 1.12, false);
    cookedF1.scale.set(1.55, 0.55, 0.55);
    const cookedF2 = createLowPolyMesh(new THREE.DodecahedronGeometry(0.18, 0), '#b45309',  0.18, 0.34, 1.24, false);
    cookedF2.scale.set(1.45, 0.52, 0.52);
    const mealBread = createLowPolyMesh(new THREE.DodecahedronGeometry(0.18, 0), '#f59e0b', 0.04, 0.36, 0.92, false);
    mealBread.scale.set(1.15, 0.60, 0.95);
    mealPlatterGrp.add(platter, cookedF1, cookedF2, mealBread);
    mealPlatterGrp.visible = false;
    campGrp.add(mealPlatterGrp);

    campGrp.position.set(fireX, fireY, fireZ);
    worldGroup.add(campGrp);
    miracleWorldMissionObjects.push({ mesh: campGrp });

    miracleActiveFieldEvent.breakfastState = {
      phase: 'cast_ready',
      reqFish,
      caughtCount: 0,
      power: 0,
      powerDir: 1,
      isCharging: false,
      castDist: 0,
      castTargetX: standX - 10,
      castTargetZ: standZ,
      castAnimTimer: 0,
      biteWaitTimer: 0,
      zoneLeft: 35,
      zoneWidth: (modeKey === 'kinder') ? 28 : (modeKey === 'junior' ? 24 : 20),
      needlePos: 15,
      needleDir: 1,
      needleSpeed: 80,
      biteTimeout: 0,
      catchAnimTimer: 0,
      roastElapsed: 0,
      roastCookMin: 3.5,
      roastBurnTime: 7.5,
      eatTimer: 0,
      standPos: new THREE.Vector3(standX, standY, standZ),
      firePos: new THREE.Vector3(fireX, fireY, fireZ),
      returnPos,
      hiddenSpotNpc,
      rodMesh,
      rodTipNode,
      bobberGrp,
      bobRipple,
      lineMesh,
      leapFish,
      campGrp,
      campfire,
      jesusByFire,
      mealPlatterGrp
    };
    miracleActiveFieldEvent.targetZone = { pos: new THREE.Vector3(fireX, fireY, fireZ) };
    syncMiracleBreakfastUI();
  }

  syncMiracleMissionStatusPanel();
}

function spawnPersistentRockHouse(cx = 57, cz = 21) {
  if (window.miracleRockHouseBuilt) return window.miracleRockHouseMesh || null;
  let houseGrp = null;
  if (typeof addJudeanRoadsideBuilding === 'function') {
    houseGrp = addJudeanRoadsideBuilding(cx, cz, 1, 0, 0.92, false);
  }
  window.miracleRockHouseBuilt = true;
  window.miracleRockHouseMesh = houseGrp;

  if (window.MiracleDayNight && typeof window.MiracleDayNight.registerNightLightSource === 'function') {
    const gy = getMiracleOpenWorldGroundHeight(cx, cz);
    window.MiracleDayNight.registerNightLightSource({
      pos: new THREE.Vector3(cx + 1.8, gy + 2.1, cz + 3.6),
      yOffset: 0,
      color: 0xffb347,
      intensity: 1.55,
      distance: 13.5,
      phase: 4.1,
      isActive: () => Boolean(window.MiracleDayNight && window.MiracleDayNight.nightFactor > 0.12)
    });
  }
  if (typeof miracleSunSystem !== 'undefined' && miracleSunSystem) {
    miracleSunSystem.cullBuilt = false;
  }
  return houseGrp;
}

function spawnPersistentMustardTree(cx = 46, cz = -20) {
  return spawnPersistentMustardShrub(cx, cz, MIRACLE_MUSTARD_GROW_DURATION_SEC);
}

function finishMiracleFieldEvent(evSpot) {
  if (miracleActiveFieldEvent) {
    if (miracleActiveFieldEvent.messenger) miracleActiveFieldEvent.messenger.walkHomeOnClear = true;
    if (Array.isArray(miracleActiveFieldEvent.reusedEscortNpcs) && miracleActiveFieldEvent.reusedEscortNpcs.length > 0) {
      miracleActiveFieldEvent.walkHomeEscortOnClear = true;
    }
  }
  clearMiracleFieldEventObjects();
  evSpot.completed = true;
  evSpot._requireLeaveZone = true;
  evSpot._prompted = performance.now();

  // 반석 위에 집 짓기 미션 후 갇힘 방지 안전 텔레포트 + 집 건축
  if (evSpot.id === 'par_builder' && !evSpot._houseBuilt) {
    evSpot._houseBuilt = true;
    const safeX = evSpot.x - 6.0;
    const safeZ = evSpot.z - 2.5;
    playerPos.set(safeX, getMiracleOpenWorldGroundHeight(safeX, safeZ), safeZ);
    if (typeof playerGroup !== 'undefined' && playerGroup) playerGroup.position.copy(playerPos);
    if (typeof snapCameraToPlayer === 'function') snapCameraToPlayer();

    const rx = evSpot.x + (evSpot.targetOffset ? evSpot.targetOffset.x : 5);
    const rz = evSpot.z + (evSpot.targetOffset ? evSpot.targetOffset.z : -3);
    spawnPersistentRockHouse(rx, rz);
  }

  if (evSpot.ring && evSpot.ring.material) evSpot.ring.material.color.setHex(0x10b981);
  if (evSpot.kneeAura && evSpot.kneeAura.userData) {
    const ku = evSpot.kneeAura.userData;
    if (ku.outerMat) ku.outerMat.color.setHex(0x10b981);
    if (ku.groundRing && ku.groundRing.material) ku.groundRing.material.color.setHex(0x10b981);
  }
  if (evSpot.label) evSpot.label.innerHTML = `✅ ${evSpot.title} (인사·다시하기)`;

  if (Array.isArray(evSpot.unlockNotebookIds)) {
    evSpot.unlockNotebookIds.forEach(id => unlockMiracleNotebookEntry(id, false));
  }
  if (typeof window.recordMiracleMissionCompleted === 'function') {
    window.recordMiracleMissionCompleted(evSpot.id, { deferPopup: true });
  }

  playSfx('clear');
  openMiracleDialog({
    speaker: evSpot.completeSpeaker || '예수님',
    category: evSpot.category || 'story',
    text: evSpot.completeText,
    quiz: (currentMode === 'kinder') ? null : evSpot.quiz,
    btnText: '📖 탐험수첩에 기록 완료!',
    hideCancel: true,
    onConfirm: () => {
      if (typeof window.flushPendingFootstepsCardAward === 'function') {
        setTimeout(() => window.flushPendingFootstepsCardAward(), 220);
      }
    }
  });
}

function updateMiracleFieldEventFrame(dt, now) {
  if (!miracleActiveFieldEvent) return;
  const fe = miracleActiveFieldEvent;
  const evSpot = fe.spot;
  const tSec = now * 0.001;

  if (fe.auraGroup && fe.auraGroup.userData && typeof fe.auraGroup.userData.animate === 'function') {
    fe.auraGroup.userData.animate(tSec);
  }

  // [밤 전용 스텔스 미션] 니고데모: 성경 두루마리 수집 → 비밀 집 예수님 만나기
  if (fe.type === 'nicodemus_stealth') {
    if (Array.isArray(fe.items)) {
      fe.items.forEach(it => {
        if (!it || it.done) return;
        it.mesh.position.y = it.baseY + Math.sin(tSec * 2.6 + it.phase) * 0.14;
        it.mesh.rotation.y += dt * 1.45;
        const dItem = Math.hypot(playerPos.x - it.pos.x, playerPos.z - it.pos.z);
        updateWorldLabelPos(it.label, it.pos, dItem < 34);
        if (dItem < 2.2) {
          it.done = true;
          it.mesh.visible = false;
          if (it.label) it.label.remove();
          fe.collected = (fe.collected || 0) + 1;
          if (typeof carriedBlockGroup !== 'undefined' && carriedBlockGroup) {
            const miniScroll = (typeof window.createBibleScrollProp === 'function')
              ? window.createBibleScrollProp(0.45)
              : createLowPolyMesh(new THREE.BoxGeometry(0.32, 0.14, 0.14), '#fde047', 0, 0, 0);
            miniScroll.position.set((fe.collected - 2) * 0.16, (fe.collected - 1) * 0.08, 0);
            carriedBlockGroup.add(miniScroll);
          }
          playSfx('clock');
          syncMiracleMissionStatusPanel();
          if (fe.collected < fe.required) {
            showToast(`📜 성경 두루마리 획득! (${fe.collected} / ${fe.required}) — 로마 군인 순찰을 주의하세요!`);
          }
        }
      });
    }
    if (fe.targetZone) {
      if (fe.targetZone.oilLamp) {
        fe.targetZone.oilLamp.setLit(true, now, 1.5);
      }
      if (fe.targetZone.npcMesh) {
        const ang = Math.atan2(playerPos.x - fe.targetZone.pos.x, playerPos.z - fe.targetZone.pos.z);
        fe.targetZone.npcMesh.rotation.y = lerpAngle(fe.targetZone.npcMesh.rotation.y, ang, dt * 4.5);
      }
      const dGoal = Math.hypot(playerPos.x - fe.targetZone.pos.x, playerPos.z - fe.targetZone.pos.z);
      updateWorldLabelPos(fe.targetZone.label, fe.targetZone.pos, (fe.collected >= fe.required) || dGoal < 24);
      if (fe.collected >= fe.required && dGoal < 2.7) {
        finishMiracleFieldEvent(evSpot);
      }
    }
    return;
  }

  // =========================================================================
  // [전용 컷신 1] 중풍병자 옥상 망치질 → 옥상 파편 부서짐 → 4명 합류 4줄 밧줄 하강 컷신
  // =========================================================================
  if (fe.cutsceneActive && fe.cutsceneType === 'paralytic_roof') {
    fe.cutsceneTimer += dt;
    const eg = fe.escortGroup ? fe.escortGroup.mesh : null;
    const holeX = evSpot.goalPos.x - 1.2;
    const holeZ = evSpot.goalPos.z - 0.8;
    const roofY = fe.cutsceneProps ? fe.cutsceneProps.roofY : playerPos.y;
    const rfList = Array.isArray(fe.rooftopFriends) ? fe.rooftopFriends : [];

    const alignFriendToHoleCorner = (spMesh, targetX, targetZ, rate = 6.5) => {
      if (!spMesh) return;
      const faceKnot = Math.atan2(targetX - spMesh.position.x, targetZ - spMesh.position.z);
      spMesh.rotation.y = lerpAngle(spMesh.rotation.y, faceKnot, Math.min(1, dt * rate));
    };

    const getNpcHandWorldPos = (npc, isLeft, outVec) => {
      if (!npc) return outVec.set(holeX, roofY + 1.0, holeZ);
      const grip = npc.getObjectByName(isLeft ? 'handGripL' : 'handGripR');
      if (grip) {
        grip.getWorldPosition(outVec);
        return outVec;
      }
      const arm = npc.userData ? (isLeft ? npc.userData.lArm : npc.userData.rArm) : null;
      if (arm) {
        outVec.set(0, -0.60, 0.04).applyMatrix4(arm.matrixWorld);
        return outVec;
      }
      npc.getWorldPosition(outVec);
      outVec.y += 1.05;
      return outVec;
    };

    const orientRopeBetween = (mesh, pA, pB) => {
      if (!mesh || !pA || !pB) return;
      if (!window._paralyticRopeDirTmp) {
        window._paralyticRopeDirTmp = new THREE.Vector3();
        window._paralyticRopeUpVec = new THREE.Vector3(0, 1, 0);
      }
      const dir = window._paralyticRopeDirTmp.subVectors(pB, pA);
      const dist = dir.length();
      if (dist < 0.006) {
        mesh.visible = false;
        return;
      }
      mesh.visible = true;
      mesh.position.addVectors(pA, pB).multiplyScalar(0.5);
      mesh.scale.set(1, dist, 1);
      dir.divideScalar(dist);
      mesh.quaternion.setFromUnitVectors(window._paralyticRopeUpVec, dir);
    };

    if (fe.cutscenePhase === 'hammer') {
      // 측면 드라마틱 클로즈업 앵글
      const camX = holeX + 5.8 + Math.sin(fe.cutsceneTimer * 0.5) * 0.8;
      const camZ = holeZ + 5.6;
      camera.position.lerp(new THREE.Vector3(camX, roofY + 4.0, camZ), Math.min(1, dt * 4.0));
      camera.lookAt(holeX, roofY + 0.7, holeZ);

      if (eg) {
        eg.position.lerp(new THREE.Vector3(holeX, roofY, holeZ), dt * 3.5);
        eg.rotation.y = lerpAngle(eg.rotation.y, 0, dt * 3.5);
        const eud = eg.userData || {};
        if (eud.stretcherOnly) {
          eud.stretcherOnly.position.y = THREE.MathUtils.damp(eud.stretcherOnly.position.y, 0, 8, dt);
          eud.stretcherOnly.rotation.x = THREE.MathUtils.damp(eud.stretcherOnly.rotation.x, 0, 8, dt);
        }
        // 들것을 올린 2명의 친구 → 구멍 남쪽 테두리 두 모서리(±1.08, +1.48)로 이동해 담당 들것 매듭을 바라봄
        if (Array.isArray(eud.friendSpecs)) {
          eud.friendSpecs.forEach(sp => {
            if (!sp.mesh) return;
            const sSide = (sp.cutSide !== undefined ? sp.cutSide : (sp.side || 1));
            const destX = sSide * 1.08;
            const destZ = 1.48;
            const distRem = Math.hypot(destX - sp.mesh.position.x, destZ - sp.mesh.position.z);
            sp.mesh.position.x = THREE.MathUtils.damp(sp.mesh.position.x, destX, 5.5, dt);
            sp.mesh.position.z = THREE.MathUtils.damp(sp.mesh.position.z, destZ, 5.5, dt);
            sp.mesh.position.y = THREE.MathUtils.damp(sp.mesh.position.y, 0, 8, dt);
            alignFriendToHoleCorner(sp.mesh, sSide * 0.46, 1.05, 6.5);
            if (typeof window.applyMiracleNpcLimbAnimation === 'function') {
              window.applyMiracleNpcLimbAnimation(sp.mesh, {
                speed: distRem > 0.14 ? 2.4 : 0,
                isMoving: distRem > 0.14,
                lArmX: -0.35, rArmX: -0.35, lArmZ: 0.18, rArmZ: -0.18, dampRate: 10
              }, dt);
            }
          });
        }
      }
      // 옥상 대기 2명의 친구 → 구멍 북쪽 테두리 두 모서리(±1.08, -1.48)로 자리 잡고 담당 들것 매듭을 바라봄
      rfList.forEach(rf => {
        const m = rf.mesh;
        if (!m) return;
        const distRem = Math.hypot(rf.slotX - m.position.x, rf.slotZ - m.position.z);
        m.position.x = THREE.MathUtils.damp(m.position.x, rf.slotX, 5.5, dt);
        m.position.z = THREE.MathUtils.damp(m.position.z, rf.slotZ, 5.5, dt);
        m.position.y = THREE.MathUtils.damp(m.position.y, rf.baseY !== undefined ? rf.baseY : roofY, 8, dt);
        const knotX = holeX + (rf.side || -1) * 0.46;
        const knotZ = holeZ - 1.05;
        const faceKnot = Math.atan2(knotX - m.position.x, knotZ - m.position.z);
        rf.heading = lerpAngle(rf.heading || m.rotation.y, faceKnot, dt * 6.5);
        m.rotation.y = rf.heading;
        if (typeof window.applyMiracleNpcLimbAnimation === 'function') {
          window.applyMiracleNpcLimbAnimation(m, {
            speed: distRem > 0.14 ? 2.2 : 0,
            isMoving: distRem > 0.14,
            lArmX: -0.32, rArmX: -0.32, lArmZ: 0.18, rArmZ: -0.18, dampRate: 10
          }, dt);
        }
      });

      if (typeof playerChopAnimTimer !== 'undefined') playerChopAnimTimer = 0.2;
      if (playerLimbs && playerLimbs.lArm) {
        playerLimbs.lArm.rotation.x = -1.25 + Math.sin(now * 0.042) * 0.9;
      }

      // 망치질 타격마다 균열·먼지 조각 튀어오름
      const hitIdx = Math.floor(fe.cutsceneTimer / 0.52);
      if (hitIdx > (fe.cutsceneProps.lastHitIdx || -1)) {
        fe.cutsceneProps.lastHitIdx = hitIdx;
        playSfx('hammer');
        for (let k = 0; k < 4; k++) {
          const dust = createLowPolyMesh(new THREE.DodecahedronGeometry(0.18 + Math.random() * 0.14, 0), k % 2 === 0 ? '#d6bfa0' : '#a88c66', holeX + (Math.random() - 0.5) * 1.4, roofY + 0.15, holeZ + (Math.random() - 0.5) * 1.8, false);
          worldGroup.add(dust);
          miracleWorldMissionObjects.push({ mesh: dust });
          fe.cutsceneProps.debris.push({
            mesh: dust,
            vx: (Math.random() - 0.5) * 3.2,
            vy: 2.2 + Math.random() * 2.4,
            vz: (Math.random() - 0.5) * 3.2
          });
        }
      }

      if (fe.cutsceneTimer > 2.4) {
        fe.cutscenePhase = 'shatter';
        fe.cutsceneTimer = 0;
        playSfx('crumble');
        showToast('💥 와장창! 옥상 지붕이 부서지며 아래 예수님이 계신 방이 열렸어요!');

        // 부서진 옥상 구멍(따뜻한 실내 불빛이 올라오는 구멍) + 14개 지붕 파편 폭발!
        const holeFrame = new THREE.Group();
        const darkHole = createLowPolyMesh(new THREE.BoxGeometry(2.0, 0.08, 2.9), '#1c1917', 0, 0.04, 0, false);
        const warmGlow = new THREE.Mesh(
          new THREE.PlaneGeometry(1.75, 2.65),
          new THREE.MeshBasicMaterial({ color: 0xfde68a, transparent: true, opacity: 0.42, side: THREE.DoubleSide })
        );
        warmGlow.rotation.x = -Math.PI * 0.5;
        warmGlow.position.y = 0.09;
        for (let e = 0; e < 10; e++) {
          const ang = (e / 10) * Math.PI * 2;
          const rim = createLowPolyMesh(new THREE.DodecahedronGeometry(0.24, 0), '#bfa47c', Math.cos(ang) * 1.15, 0.12, Math.sin(ang) * 1.55, false);
          rim.scale.set(1.2, 0.5, 1.0);
          holeFrame.add(rim);
        }
        holeFrame.add(darkHole, warmGlow);
        holeFrame.position.set(holeX, roofY + 0.02, holeZ);
        worldGroup.add(holeFrame);
        miracleWorldMissionObjects.push({ mesh: holeFrame });

        for (let d = 0; d < 14; d++) {
          const ang = (d / 14) * Math.PI * 2;
          const chunk = createLowPolyMesh(
            new THREE.DodecahedronGeometry(0.26 + (d % 3) * 0.10, 0),
            d % 2 === 0 ? '#cfa36e' : '#8c5e34',
            holeX + Math.cos(ang) * 0.5, roofY + 0.25, holeZ + Math.sin(ang) * 0.7, false
          );
          worldGroup.add(chunk);
          miracleWorldMissionObjects.push({ mesh: chunk });
          fe.cutsceneProps.debris.push({
            mesh: chunk,
            vx: Math.cos(ang) * (2.8 + Math.random() * 2.5),
            vy: 3.4 + Math.random() * 2.8,
            vz: Math.sin(ang) * (2.8 + Math.random() * 2.5)
          });
        }
      }
    } else if (fe.cutscenePhase === 'shatter') {
      camera.position.lerp(new THREE.Vector3(holeX + 4.2, roofY + 6.4, holeZ + 4.4), Math.min(1, dt * 3.2));
      camera.lookAt(holeX, roofY + 0.1, holeZ);

      if (eg && eg.userData && Array.isArray(eg.userData.friendSpecs)) {
        eg.userData.friendSpecs.forEach(sp => {
          if (!sp.mesh) return;
          const sSide = (sp.cutSide !== undefined ? sp.cutSide : (sp.side || 1));
          sp.mesh.position.x = THREE.MathUtils.damp(sp.mesh.position.x, sSide * 1.08, 7.0, dt);
          sp.mesh.position.z = THREE.MathUtils.damp(sp.mesh.position.z, 1.48, 7.0, dt);
          alignFriendToHoleCorner(sp.mesh, sSide * 0.46, 1.05, 8.0);
        });
      }
      rfList.forEach(rf => {
        if (!rf || !rf.mesh) return;
        rf.mesh.position.x = THREE.MathUtils.damp(rf.mesh.position.x, rf.slotX, 7.0, dt);
        rf.mesh.position.z = THREE.MathUtils.damp(rf.mesh.position.z, rf.slotZ, 7.0, dt);
        const knotX = holeX + (rf.side || -1) * 0.46;
        const knotZ = holeZ - 1.05;
        const faceKnot = Math.atan2(knotX - rf.mesh.position.x, knotZ - rf.mesh.position.z);
        rf.heading = lerpAngle(rf.heading || rf.mesh.rotation.y, faceKnot, dt * 8.0);
        rf.mesh.rotation.y = rf.heading;
      });

      if (fe.cutsceneTimer > 1.55) {
        fe.cutscenePhase = 'lower';
        fe.cutsceneTimer = 0;
        showToast('🪢 네 친구가 모두 모여 밧줄 4줄로 중풍병자 들것을 예수님 앞으로 조심스레 내립니다!');

        if (eg) {
          eg.position.set(holeX, roofY, holeZ);
          eg.rotation.y = 0;
        }
        const eud = (eg && eg.userData) ? eg.userData : {};
        const fSpecs = Array.isArray(eud.friendSpecs) ? eud.friendSpecs : [];
        const ropeSegGeo = new THREE.CylinderGeometry(0.032, 0.032, 1.0, 6);
        const coilGeo = new THREE.TorusGeometry(0.16, 0.042, 5, 10);
        const cornerPairs = [];
        if (rfList[0] && rfList[0].mesh) cornerPairs.push({ friend: rfList[0].mesh, isInEg: false, slotX: rfList[0].slotX, slotZ: rfList[0].slotZ, rx: -0.46, rz: -1.05, sideX: -1, sideZ: -1 });
        if (rfList[1] && rfList[1].mesh) cornerPairs.push({ friend: rfList[1].mesh, isInEg: false, slotX: rfList[1].slotX, slotZ: rfList[1].slotZ, rx:  0.46, rz: -1.05, sideX:  1, sideZ: -1 });
        fSpecs.forEach(sp => {
          if (!sp || !sp.mesh) return;
          const sSide = (sp.cutSide !== undefined ? sp.cutSide : (sp.side || 1));
          cornerPairs.push({ friend: sp.mesh, isInEg: true, slotX: sSide * 1.08, slotZ: 1.48, rx: sSide * 0.46, rz: 1.05, sideX: sSide, sideZ: 1 });
        });

        const ropes = cornerPairs.map((cpItem, idx) => {
          const mainMesh = createLowPolyMesh(ropeSegGeo, '#e5c687', holeX + cpItem.rx, roofY, holeZ + cpItem.rz, false);
          const gripMesh = createLowPolyMesh(ropeSegGeo, '#edd299', holeX + cpItem.rx, roofY + 1.0, holeZ + cpItem.rz, false);
          const tailMesh = createLowPolyMesh(ropeSegGeo, '#d9b87c', holeX + cpItem.rx, roofY + 0.5, holeZ + cpItem.rz, false);
          const worldBaseX = cpItem.isInEg ? (holeX + cpItem.slotX) : cpItem.slotX;
          const worldBaseZ = cpItem.isInEg ? (holeZ + cpItem.slotZ) : cpItem.slotZ;
          const coilPos = new THREE.Vector3(
            worldBaseX + cpItem.sideX * 0.24,
            roofY + 0.04,
            worldBaseZ + cpItem.sideZ * 0.16
          );
          const coilMesh = createLowPolyMesh(coilGeo, '#cfa96b', coilPos.x, coilPos.y, coilPos.z, false);
          coilMesh.rotation.x = Math.PI * 0.5;
          worldGroup.add(mainMesh, gripMesh, tailMesh, coilMesh);
          miracleWorldMissionObjects.push({ mesh: mainMesh }, { mesh: gripMesh }, { mesh: tailMesh }, { mesh: coilMesh });
          return {
            ...cpItem,
            idx,
            mainMesh,
            gripMesh,
            tailMesh,
            coilMesh,
            coilPos
          };
        });
        fe.cutsceneProps.ropes = ropes;
      }
    } else if (fe.cutscenePhase === 'lower') {
      // 하이앵글 하강 전용 시네마틱 카메라 (4명 친구 손에 직접 닿는 밧줄이 아래 들것까지 연결!)
      const p = Math.min(1, fe.cutsceneTimer / 3.2);
      const camAng = 0.55 + p * 0.65;
      camera.position.lerp(new THREE.Vector3(holeX + Math.cos(camAng) * 5.2, roofY + 5.8 - p * 0.8, holeZ + Math.sin(camAng) * 5.2), Math.min(1, dt * 3.5));
      camera.lookAt(holeX, roofY - p * 1.4, holeZ);

      const dropDepth = p * 3.1;
      if (eg) {
        eg.position.set(holeX, roofY, holeZ);
        eg.rotation.y = 0;
        if (eg.userData && eg.userData.stretcherOnly) {
          eg.userData.stretcherOnly.position.y = -dropDepth;
        } else {
          eg.position.y = roofY - dropDepth;
        }
      }

      const ropes = (fe.cutsceneProps && Array.isArray(fe.cutsceneProps.ropes)) ? fe.cutsceneProps.ropes : [];
      ropes.forEach((rp, idx) => {
        const fr = rp.friend;
        if (!fr || !fr.userData) return;

        if (rp.isInEg) {
          fr.position.set(rp.slotX, 0, rp.slotZ);
          fr.rotation.y = Math.atan2(rp.rx - rp.slotX, rp.rz - rp.slotZ);
        } else {
          fr.position.set(rp.slotX, roofY, rp.slotZ);
          fr.rotation.y = Math.atan2((holeX + rp.rx) - rp.slotX, (holeZ + rp.rz) - rp.slotZ);
        }

        const phaseOff = idx * 1.15;
        if (typeof window.applyMiracleNpcLimbAnimation === 'function') {
          window.applyMiracleNpcLimbAnimation(fr, {
            speed: 0,
            isMoving: false,
            lArmX: -0.92 + Math.sin(tSec * 4.8 + phaseOff) * 0.25,
            rArmX: -0.92 - Math.sin(tSec * 4.8 + phaseOff) * 0.25,
            lArmZ: 0.48,
            rArmZ: -0.48,
            dampRate: 14
          }, dt);
        }
        if (fr.userData.head) {
          fr.userData.head.rotation.x = THREE.MathUtils.damp(fr.userData.head.rotation.x, 0.46, 8, dt);
        }
      });

      if (eg) eg.updateMatrixWorld(true);
      const lHand = new THREE.Vector3();
      const rHand = new THREE.Vector3();
      const knotPos = new THREE.Vector3();
      ropes.forEach(rp => {
        if (!rp.friend) return;
        if (!rp.isInEg) rp.friend.updateMatrixWorld(true);
        getNpcHandWorldPos(rp.friend, true, lHand);
        getNpcHandWorldPos(rp.friend, false, rHand);
        const upperHand = (lHand.y >= rHand.y) ? lHand : rHand;
        const lowerHand = (lHand.y >= rHand.y) ? rHand : lHand;
        knotPos.set(holeX + rp.rx, roofY + 0.66 - dropDepth, holeZ + rp.rz);

        orientRopeBetween(rp.mainMesh, lowerHand, knotPos);
        orientRopeBetween(rp.gripMesh, upperHand, lowerHand);
        orientRopeBetween(rp.tailMesh, upperHand, rp.coilPos);
        if (rp.coilMesh) {
          const coilSc = Math.max(0.65, 1.0 - p * 0.30);
          rp.coilMesh.scale.set(coilSc, coilSc, 1);
        }
      });

      if (fe.cutsceneTimer > 3.5) {
        fe.cutsceneActive = false;
        fe.cutsceneCameraActive = false;
        finishMiracleFieldEvent(evSpot);
        return;
      }
    }

    // 날아간 파편 물리 업데이트
    if (fe.cutsceneProps && Array.isArray(fe.cutsceneProps.debris)) {
      fe.cutsceneProps.debris.forEach(db => {
        db.vy -= 9.5 * dt;
        db.mesh.position.x += db.vx * dt;
        db.mesh.position.y = Math.max(roofY - 3.6, db.mesh.position.y + db.vy * dt);
        db.mesh.position.z += db.vz * dt;
        db.mesh.rotation.x += dt * 4.5;
        db.mesh.rotation.z += dt * 3.8;
      });
    }
    syncMiracleMissionStatusPanel();
    return;
  }

  // =========================================================================
  // [전용 컷신 2] 두 렙돈 넣은 과부 — 성전 헌금함에 동전 두 개를 차례로 넣는 컷신
  // =========================================================================
  if (fe.cutsceneActive && fe.cutsceneType === 'widow_mites') {
    fe.cutsceneTimer += dt;
    const tz = fe.targetZone;
    const cp = fe.cutsceneProps;
    const fx = tz.mesh.position.x;
    const fy = tz.mesh.position.y;
    const fz = tz.mesh.position.z;

    // 따뜻한 클로즈업 시네마틱 카메라 (과부와 청동 헌금함이 한눈에 담기는 앵글)
    camera.position.lerp(new THREE.Vector3(fx + 0.2, fy + 2.35, fz - 4.1), Math.min(1, dt * 4.2));
    camera.lookAt(fx + 0.05, fy + 1.45, fz);

    const wMesh = tz.widowMesh;
    const slotX = fx + 0.45, slotY = fy + 1.94, slotZ = fz;
    const handX = fx - 0.55, handY = fy + 1.52, handZ = fz;

    const animCoin = (coinObj, localT) => {
      if (!coinObj) return;
      if (localT < 0 || localT > 1.35) {
        coinObj.mesh.visible = false;
        return;
      }
      coinObj.mesh.visible = true;
      const u = Math.min(1, localT / 1.1);
      // 포물선 궤적으로 손에서 청동 헌금함 입구로 톡 떨어짐
      const cx2 = THREE.MathUtils.lerp(handX, slotX, u);
      const cy2 = THREE.MathUtils.lerp(handY, slotY, u) + Math.sin(u * Math.PI) * 0.65 - (u > 0.85 ? (u - 0.85) * 1.4 : 0);
      const cz2 = THREE.MathUtils.lerp(handZ, slotZ, u);
      coinObj.mesh.position.set(cx2, cy2, cz2);
      coinObj.mesh.rotation.y += dt * 11;
      coinObj.mesh.rotation.x += dt * 7;
      if (u >= 0.92 && !coinObj.clinked) {
        coinObj.clinked = true;
        playSfx('clock');
        showToast(coinObj.idx === 1 ? '🪙 첫 번째 렙돈을 정성껏 헌금함에 넣었어요...' : '🪙✨ 두 번째 렙돈까지 자신의 생활비 전부를 드렸어요!');
      }
    };

    // 과부 팔을 들어 정성껏 넣는 모션
    if (wMesh && wMesh.userData && wMesh.userData.rArm) {
      const lift = (fe.cutsceneTimer < 3.6) ? (-0.95 - Math.sin(fe.cutsceneTimer * 3.1) * 0.35) : -0.25;
      wMesh.userData.rArm.rotation.x = lift;
    }
    animCoin(cp.coin1, fe.cutsceneTimer - 0.45);
    animCoin(cp.coin2, fe.cutsceneTimer - 2.05);

    // 두 번째 동전이 들어간 후 헌금함 위 황금빛 광채 상승
    if (cp.glowHalo) {
      const showGlow = fe.cutsceneTimer > 3.1;
      cp.glowHalo.visible = showGlow;
      if (showGlow) {
        const gProg = Math.min(1, (fe.cutsceneTimer - 3.1) / 1.4);
        const gs = 0.6 + gProg * 0.8;
        cp.glowHalo.scale.set(gs, gs, gs);
        cp.glowHalo.position.y = slotY + 0.25 + gProg * 0.55;
        cp.glowHalo.rotation.y += dt * 2.5;
      }
    }

    if (fe.cutsceneTimer > 4.6) {
      fe.cutsceneActive = false;
      fe.cutsceneCameraActive = false;
      finishMiracleFieldEvent(evSpot);
      return;
    }
    syncMiracleMissionStatusPanel();
    return;
  }

  // =========================================================================
  // [전용 컷신 3] 부활하신 예수님과 도마 — 예수님 양손의 못자국 확인 컷신
  // =========================================================================
  if (fe.cutsceneActive && fe.cutsceneType === 'thomas_wounds') {
    fe.cutsceneTimer += dt;
    const tz = fe.targetZone;
    const cp = fe.cutsceneProps || {};
    const fx = tz.mesh.position.x;
    const fy = tz.mesh.position.y;
    const fz = tz.mesh.position.z;
    const jMesh = tz.jesusMesh;
    const tMesh = tz.thomasMesh;

    if (tMesh) tMesh.visible = true;

    // 예수님이 두 팔을 앞으로 내밀어 양손의 못자국을 보여주심
    const armProgress = Math.min(1, fe.cutsceneTimer / 1.1);
    if (jMesh && jMesh.userData) {
      if (jMesh.userData.lArm) {
        jMesh.userData.lArm.rotation.x = -1.26 * armProgress;
        jMesh.userData.lArm.rotation.z = 0.22 * armProgress;
      }
      if (jMesh.userData.rArm) {
        jMesh.userData.rArm.rotation.x = -1.26 * armProgress;
        jMesh.userData.rArm.rotation.z = -0.22 * armProgress;
      }
    }
    // 양손 못자국 주변 성스러운 반짝임
    if (Array.isArray(tz.woundMarks)) {
      tz.woundMarks.forEach((wm, idx) => {
        if (wm.woundHalo) {
          wm.woundHalo.visible = fe.cutsceneTimer > 0.55;
          const sc = 0.85 + Math.sin(tSec * 6.0 + idx) * 0.25;
          wm.woundHalo.scale.set(sc, sc, sc);
          wm.woundHalo.rotation.y = tSec * 3.5;
        }
      });
    }

    if (fe.cutsceneTimer < 1.8) {
      // 클로즈업 1단계: 예수님이 내미신 양손 못자국 클로즈업
      camera.position.lerp(new THREE.Vector3(fx + 1.55, fy + 1.78, fz + 2.15), Math.min(1, dt * 4.5));
      camera.lookAt(fx, fy + 1.32, fz + 0.48);
      if (tMesh) {
        tMesh.position.set(0, 0, THREE.MathUtils.lerp(2.05, 1.48, fe.cutsceneTimer / 1.8));
      }
      if (!cp.step1Shown) {
        cp.step1Shown = true;
        showToast('✨ "네 손가락을 이리 내밀어 내 손을 보고, 믿음 없는 자가 되지 말고 믿는 자가 되라!"');
      }
    } else if (fe.cutsceneTimer < 3.3) {
      // 클로즈업 2단계: 도마가 가까이 다가가 손을 뻗어 예수님 손의 못자국을 확인!
      const u = (fe.cutsceneTimer - 1.8) / 1.5;
      camera.position.lerp(new THREE.Vector3(fx - 1.55, fy + 1.65, fz + 1.55), Math.min(1, dt * 4.2));
      camera.lookAt(fx, fy + 1.32, fz + 0.52);
      if (tMesh) {
        tMesh.position.set(0, 0, THREE.MathUtils.lerp(1.48, 1.12, Math.min(1, u * 1.4)));
        if (tMesh.userData && tMesh.userData.rArm) {
          tMesh.userData.rArm.rotation.x = -1.12 * Math.sin(Math.min(1, u) * Math.PI * 0.72);
        }
      }
      if (!cp.step2Shown) {
        cp.step2Shown = true;
        playSfx('rescue');
        showToast('🙌 도마가 예수님 손의 선명한 못자국을 가까이서 확인했어요!');
      }
    } else {
      // 클로즈업 3단계: 도마가 경외심에 무릎 꿇고 "나의 주님이시요 나의 하나님이시니이다!" 고백
      const u = Math.min(1, (fe.cutsceneTimer - 3.3) / 1.2);
      camera.position.lerp(new THREE.Vector3(fx + 2.45, fy + 2.25, fz + 2.85), Math.min(1, dt * 3.8));
      camera.lookAt(fx, fy + 1.15, fz + 0.55);
      if (tMesh) {
        tMesh.position.set(0, -0.38 * u, 1.22);
        if (tMesh.userData) {
          if (tMesh.userData.lLeg) tMesh.userData.lLeg.rotation.x = -1.15 * u;
          if (tMesh.userData.rLeg) tMesh.userData.rLeg.rotation.x = -1.15 * u;
          if (tMesh.userData.lArm) tMesh.userData.lArm.rotation.x = -0.75 * u;
          if (tMesh.userData.rArm) tMesh.userData.rArm.rotation.x = -0.75 * u;
        }
      }
      if (!cp.step3Shown) {
        cp.step3Shown = true;
        playSfx('clear');
        showToast('🙏 "나의 주님이시요 나의 하나님이시니이다!"');
      }
    }

    if (fe.cutsceneTimer > 4.8) {
      fe.cutsceneActive = false;
      fe.cutsceneCameraActive = false;
      if (fe.thomasFollower && fe.thomasFollower.mesh) {
        fe.thomasFollower.mesh.visible = true;
      }
      finishMiracleFieldEvent(evSpot);
      return;
    }
    syncMiracleMissionStatusPanel();
    return;
  }

  // =========================================================================
  // [전용 컷신 4] 삭개오 7단계 스토리 & 하이앵글 돈주머니 드래그 나눔 미니게임
  // =========================================================================
  if (fe.cutsceneActive && fe.cutsceneType === 'zacchaeus_story' && fe.zacchaeusData) {
    fe.cutsceneTimer += dt;
    const zd = fe.zacchaeusData;
    const zGrp = zd.zacGroup;
    const zMesh = zd.zacMesh;
    const zu = (zMesh && zMesh.userData) ? zMesh.userData : {};
    const jNpc = zd.jesusNpc;
    const ju = (jNpc && jNpc.userData) ? jNpc.userData : {};
    const jPos = zd.jesusPos;
    const pPos = zd.perchPos;

    // 일시정지 복귀 시에도 컷신 중 이동 버튼/조이스틱 재노출 방지
    const joyEl = document.getElementById('joystick-zone');
    const camBar = document.getElementById('cam-bottom-bar');
    const actEl = document.getElementById('action-zone');
    if (joyEl && joyEl.style.display !== 'none') joyEl.style.display = 'none';
    if (camBar && camBar.style.display !== 'none') camBar.style.display = 'none';
    if (actEl && actEl.style.display !== 'none') actEl.style.display = 'none';

    const dirX = pPos.x - jPos.x;
    const dirZ = pPos.z - jPos.z;
    const dirLen = Math.hypot(dirX, dirZ) || 1;
    const fwdX = dirX / dirLen;
    const fwdZ = dirZ / dirLen;
    const sideX = fwdZ;
    const sideZ = -fwdX;
    const sSign = zd.stageSideSign || 1;
    const camSideX = sideX * sSign;
    const camSideZ = sideZ * sSign;

    if (fe.cutscenePhase === 'jesus_calls') {
      // 2-A단계: 카메라가 예수님께로 이동 ("삭개오씨, 어서 내려오세요") — 군중 없는 전면/측면에서 클로즈업
      if (jNpc) setFlatYawToward(jNpc, pPos.x, pPos.z);
      if (ju.head) ju.head.rotation.x = THREE.MathUtils.damp(ju.head.rotation.x, -0.22, 8, dt);
      if (ju.rArm) {
        ju.rArm.rotation.x = THREE.MathUtils.damp(ju.rArm.rotation.x, -1.42 + Math.sin(tSec * 4.5) * 0.16, 10, dt);
        ju.rArm.rotation.z = THREE.MathUtils.damp(ju.rArm.rotation.z, 0.25, 10, dt);
      }
      if (ju.lArm) {
        ju.lArm.rotation.x = THREE.MathUtils.damp(ju.lArm.rotation.x, -0.35, 10, dt);
      }

      const targetCam = new THREE.Vector3(
        jPos.x + fwdX * 2.55 + camSideX * 1.25,
        jPos.y + 1.82,
        jPos.z + fwdZ * 2.55 + camSideZ * 1.25
      );
      keepZacchaeusCameraLineClear(targetCam, jPos, zd, dt, fe.cutsceneTimer < 0.08);
      camera.position.lerp(targetCam, Math.min(1, dt * 4.8));
      camera.lookAt(jPos.x, jPos.y + 1.50, jPos.z);

      if (fe.cutsceneTimer >= 3.2) {
        fe.cutscenePhase = 'zacchaeus_ready_descend';
        fe.cutsceneTimer = 0;
        playSfx('switch');
        syncMiracleZacchaeusOverlayUI(fe);
        syncMiracleMissionStatusPanel();
      }
    } else if (fe.cutscenePhase === 'zacchaeus_ready_descend') {
      // 2-B단계: 카메라가 나무 위 삭개오로 옮겨지고 [내려오기] 버튼 생성
      const targetCam = new THREE.Vector3(
        pPos.x - fwdX * 3.15 + camSideX * 0.85,
        pPos.y + 0.62,
        pPos.z - fwdZ * 3.15 + camSideZ * 0.85
      );
      keepZacchaeusCameraLineClear(targetCam, pPos, zd, dt, false);
      camera.position.lerp(targetCam, Math.min(1, dt * 4.8));
      camera.lookAt(pPos.x, pPos.y + 0.32, pPos.z);

      // 기뻐하며 다리 흔들고 한쪽 손 흔드는 착석 대기 모션
      if (zu.lKnee && zu.rKnee) {
        zu.lKnee.rotation.x = 1.32 + Math.sin(tSec * 5.2) * 0.14;
        zu.rKnee.rotation.x = 1.32 - Math.sin(tSec * 5.2) * 0.14;
      }
      if (zu.lArm) {
        zu.lArm.rotation.x = THREE.MathUtils.damp(zu.lArm.rotation.x, -0.75, 8, dt);
        zu.lArm.rotation.z = THREE.MathUtils.damp(zu.lArm.rotation.z, -0.42 + Math.sin(tSec * 6.5) * 0.25, 10, dt);
      }
    } else if (fe.cutscenePhase === 'descending') {
      // 3-A단계: 삭개오 하강 → 예수님 앞으로 이동
      const totalDur = 2.25;
      const p = Math.min(1, fe.cutsceneTimer / totalDur);
      const confessPos = zd.confessPos || new THREE.Vector3(jPos.x + fwdX * 1.95, jPos.y, jPos.z + fwdZ * 1.95);
      const midTrunk = (zd.perchTree && zd.perchTree.trunkMidWorldPos) ? zd.perchTree.trunkMidWorldPos : pPos.clone().lerp(confessPos, 0.35);
      const climbGround = zd.climbDownPos || pPos.clone().lerp(confessPos, 0.55);

      if (p < 0.42) {
        const u = p / 0.42;
        if (u < 0.5) {
          const k = u / 0.5;
          zGrp.position.lerpVectors(pPos, midTrunk, k);
        } else {
          const k = (u - 0.5) / 0.5;
          zGrp.position.lerpVectors(midTrunk, climbGround, k);
        }
        zMesh.position.y = THREE.MathUtils.lerp(-0.42, 0.0, u);
        if (zu.lLeg && zu.rLeg) {
          zu.lLeg.rotation.x = THREE.MathUtils.lerp(-1.35, 0.0, u);
          zu.rLeg.rotation.x = THREE.MathUtils.lerp(-1.35, 0.0, u);
        }
        if (zu.lKnee && zu.rKnee) {
          zu.lKnee.rotation.x = THREE.MathUtils.lerp(1.32, 0.0, u);
          zu.rKnee.rotation.x = THREE.MathUtils.lerp(1.32, 0.0, u);
        }
        if (zu.lArm && zu.rArm) {
          zu.lArm.rotation.z = THREE.MathUtils.damp(zu.lArm.rotation.z, -0.35, 8, dt);
          zu.rArm.rotation.z = THREE.MathUtils.damp(zu.rArm.rotation.z,  0.35, 8, dt);
          zu.lArm.rotation.x = THREE.MathUtils.damp(zu.lArm.rotation.x, -0.45, 8, dt);
          zu.rArm.rotation.x = THREE.MathUtils.damp(zu.rArm.rotation.x, -0.45, 8, dt);
        }
        if (zu.lElbow && zu.rElbow) {
          zu.lElbow.rotation.x = THREE.MathUtils.damp(zu.lElbow.rotation.x, -0.15, 8, dt);
          zu.rElbow.rotation.x = THREE.MathUtils.damp(zu.rElbow.rotation.x, -0.15, 8, dt);
        }
        setFlatYawToward(zGrp, jPos.x, jPos.z);
      } else {
        const u = (p - 0.42) / 0.58;
        zGrp.position.lerpVectors(climbGround, confessPos, u);
        zGrp.position.y = getMiracleOpenWorldGroundHeight(zGrp.position.x, zGrp.position.z);
        zMesh.position.y = 0;
        if (zu.lKnee && zu.rKnee) { zu.lKnee.rotation.x = 0; zu.rKnee.rotation.x = 0; }
        setFlatYawToward(zGrp, confessPos.x, confessPos.z);
        if (typeof window.applyMiracleNpcLimbAnimation === 'function') {
          window.applyMiracleNpcLimbAnimation(zMesh, { speed: 4.5, isMoving: true, strideFactor: 1.85 }, dt);
        }
      }

      if (jNpc) {
        setFlatYawToward(jNpc, zGrp.position.x, zGrp.position.z);
        if (ju.head) ju.head.rotation.x = THREE.MathUtils.damp(ju.head.rotation.x, 0.08, 6, dt);
        if (ju.rArm) ju.rArm.rotation.x = THREE.MathUtils.damp(ju.rArm.rotation.x, -0.25, 6, dt);
      }

      const lookMid = new THREE.Vector3(
        (zGrp.position.x + jPos.x) * 0.5,
        Math.max(jPos.y + 0.9, zGrp.position.y + 0.7),
        (zGrp.position.z + jPos.z) * 0.5
      );
      const targetCam = new THREE.Vector3(
        lookMid.x + camSideX * 4.35 + fwdX * 0.45,
        lookMid.y + 1.55,
        lookMid.z + camSideZ * 4.35 + fwdZ * 0.45
      );
      keepZacchaeusCameraLineClear(targetCam, lookMid, zd, dt, false);
      camera.position.lerp(targetCam, Math.min(1, dt * 4.5));
      camera.lookAt(lookMid);

      if (p >= 1) {
        zGrp.position.copy(confessPos);
        setFlatYawToward(zGrp, jPos.x, jPos.z);
        if (zu.lKnee && zu.rKnee) { zu.lKnee.rotation.x = 0; zu.rKnee.rotation.x = 0; }
        if (zu.lElbow && zu.rElbow) { zu.lElbow.rotation.x = 0; zu.rElbow.rotation.x = 0; }
        fe.cutscenePhase = 'zacchaeus_confess';
        fe.cutsceneTimer = 0;
        playSfx('rescue');
        if (typeof speakText === 'function') speakText('소유의 절반을 가난한 자들에게 주겠습니다.');
        syncMiracleZacchaeusOverlayUI(fe);
        syncMiracleMissionStatusPanel();
      }
    } else if (fe.cutscenePhase === 'zacchaeus_confess') {
      // 3-B단계: 삭개오의 고백 ("소유의 절반을 가난한 자들에게 주겠습니다.") — 가림 없는 +camSide 투샷
      const confessPos = zd.confessPos || zGrp.position;
      setFlatYawToward(zGrp, jPos.x, jPos.z);
      if (jNpc) setFlatYawToward(jNpc, confessPos.x, confessPos.z);

      if (typeof window.applyMiracleNpcLimbAnimation === 'function') {
        window.applyMiracleNpcLimbAnimation(zMesh, {
          speed: 0, isMoving: false,
          lArmX: -0.78, rArmX: -0.78, lArmZ: 0.24, rArmZ: -0.24, dampRate: 10
        }, dt);
      }
      if (zu.lElbow && zu.rElbow) {
        zu.lElbow.rotation.x = THREE.MathUtils.damp(zu.lElbow.rotation.x, -0.58, 10, dt);
        zu.rElbow.rotation.x = THREE.MathUtils.damp(zu.rElbow.rotation.x, -0.58, 10, dt);
      }
      if (zu.head) zu.head.rotation.x = THREE.MathUtils.damp(zu.head.rotation.x, -0.26, 8, dt);
      if (ju.head) ju.head.rotation.x = THREE.MathUtils.damp(ju.head.rotation.x, 0.16, 8, dt);

      const midX = confessPos.x * 0.56 + jPos.x * 0.44;
      const midZ = confessPos.z * 0.56 + jPos.z * 0.44;
      const targetCam = new THREE.Vector3(
        midX + camSideX * 3.15 + fwdX * 0.35,
        confessPos.y + 1.60,
        midZ + camSideZ * 3.15 + fwdZ * 0.35
      );
      keepZacchaeusCameraLineClear(targetCam, new THREE.Vector3(midX, confessPos.y + 1.0, midZ), zd, dt, fe.cutsceneTimer < 0.08);
      camera.position.lerp(targetCam, Math.min(1, dt * 4.8));
      camera.lookAt(midX, confessPos.y + 1.04, midZ);

      if (fe.cutsceneTimer >= 3.6) {
        // 4단계 진입 준비: 나무 가림 없는 highCamYaw 선정 → 말굽형 군중 정렬 → 돈주머니 생성
        fe.cutscenePhase = 'coin_drag_minigame';
        fe.cutsceneTimer = 0;

        const jesusAngFromConf = Math.atan2(jPos.x - confessPos.x, jPos.z - confessPos.z);
        const crowdList = zd.crowdMembers || [];
        const grove = Array.isArray(window.miracleZacchaeusGroveTrees) ? window.miracleZacchaeusGroveTrees : [];

        // 1) 하이앵글 카메라 각도 먼저 선정 (예수님 + 촬영 전면 측 선호, 나무 간섭 회피)
        let bestAng = jesusAngFromConf + sSign * 0.40;
        let bestScore = -1e9;
        for (let ai = 0; ai < 8; ai++) {
          const testAng = (jesusAngFromConf + (ai * Math.PI * 2) / 8);
          const camTX = confessPos.x + Math.sin(testAng) * 6.2;
          const camTZ = confessPos.z + Math.cos(testAng) * 6.2;
          let minTreeD = Math.hypot(camTX - zd.treePos.x, camTZ - zd.treePos.z);
          grove.forEach(gt => { minTreeD = Math.min(minTreeD, Math.hypot(camTX - gt.x, camTZ - gt.z)); });
          const jBonus = Math.cos(testAng - (jesusAngFromConf + sSign * 0.35)) * 2.4;
          const score = Math.min(6.2, minTreeD) + jBonus;
          if (score > bestScore) { bestScore = score; bestAng = testAng; }
        }
        zd.highCamYaw = bestAng;

        // 2) 카메라 정반대 말굽형 반원에 군중 정렬 (카메라 전방 시야 통로 확보)
        const farCenterAng = zd.highCamYaw + Math.PI;
        crowdList.forEach((cm, idx) => {
          const frac = crowdList.length > 1 ? ((idx / (crowdList.length - 1)) * 2 - 1) : 0;
          const ang = farCenterAng + frac * 1.82;
          let rad = (idx % 2 === 0) ? 3.25 : 4.05;
          let rx = confessPos.x + Math.sin(ang) * rad;
          let rz = confessPos.z + Math.cos(ang) * rad;
          if (Math.hypot(rx - jPos.x, rz - jPos.z) < 1.55) {
            rad = 3.65;
            rx = confessPos.x + Math.sin(ang + 0.25 * (frac >= 0 ? 1 : -1)) * rad;
            rz = confessPos.z + Math.cos(ang + 0.25 * (frac >= 0 ? 1 : -1)) * rad;
          }
          if (Math.hypot(rx - zd.treePos.x, rz - zd.treePos.z) < 2.15 ||
              grove.some(gt => Math.hypot(rx - gt.x, rz - gt.z) < 2.15)) {
            rad = 2.65;
            rx = confessPos.x + Math.sin(ang) * rad;
            rz = confessPos.z + Math.cos(ang) * rad;
          }
          cm.ringPos = new THREE.Vector3(rx, getMiracleOpenWorldGroundHeight(rx, rz), rz);
        });

        // 3) 삭개오 앞(군중 말굽 중심 방향)에 3D 돈주머니 생성
        const px = confessPos.x + Math.sin(farCenterAng) * 0.80;
        const pz = confessPos.z + Math.cos(farCenterAng) * 0.80;
        zd.pouchPos = new THREE.Vector3(px, getMiracleOpenWorldGroundHeight(px, pz), pz);
        if (zd.pouchMesh) worldGroup.remove(zd.pouchMesh);
        zd.pouchMesh = createZacchaeusMoneyPouchMesh();
        zd.pouchMesh.position.copy(zd.pouchPos);
        zd.pouchMesh.scale.set(1.12, 0.88, 1.12);
        worldGroup.add(zd.pouchMesh);

        zd.gaugePct = 100;
        zd.reachedHalf = false;
        zd.dragging = false;

        syncMiracleZacchaeusOverlayUI(fe);
        syncMiracleMissionStatusPanel();
      }
    } else if (fe.cutscenePhase === 'coin_drag_minigame') {
      // 4~5단계: 하이앵글 카메라 + 돈주머니 드래그로 군중에게 뿌리기 (100% → 50%)
      const confessPos = zd.confessPos || zGrp.position;
      const vw = Math.max(1, window.innerWidth || 1280);
      const vh = Math.max(1, window.innerHeight || 720);
      const aspect = Math.max(0.45, Math.min(2.2, vw / vh));
      const distScale = aspect < 1.0 ? Math.min(1.42, 0.92 + 0.36 / aspect) : 1.0;

      const camDist = 5.9 * distScale;
      const camH = 8.8 * distScale;
      const targetCam = new THREE.Vector3(
        confessPos.x + Math.sin(zd.highCamYaw) * camDist,
        confessPos.y + camH,
        confessPos.z + Math.cos(zd.highCamYaw) * camDist
      );
      camera.position.lerp(targetCam, Math.min(1, dt * 4.2));
      camera.lookAt(confessPos.x, confessPos.y + 0.72, confessPos.z);

      // 군중 원형 이동 + 돈 받은 사람 환호 점프 애니메이션
      (zd.crowdMembers || []).forEach(cm => {
        if (!cm || !cm.mesh) return;
        const m = cm.mesh;
        if (cm.ringPos) {
          m.position.x = THREE.MathUtils.damp(m.position.x, cm.ringPos.x, 5.5, dt);
          m.position.z = THREE.MathUtils.damp(m.position.z, cm.ringPos.z, 5.5, dt);
        }
        const gY = getMiracleOpenWorldGroundHeight(m.position.x, m.position.z);
        const faceZac = Math.atan2(confessPos.x - m.position.x, confessPos.z - m.position.z);
        m.rotation.y = lerpAngle(m.rotation.y, faceZac, Math.min(1, dt * 6.0));
        if (cm.cheerTimer > 0) {
          cm.cheerTimer = Math.max(0, cm.cheerTimer - dt);
          const hop = Math.abs(Math.sin(tSec * 10.5 + cm.phase)) * 0.24;
          m.position.y = gY + hop;
          if (typeof window.applyMiracleNpcLimbAnimation === 'function') {
            window.applyMiracleNpcLimbAnimation(m, {
              speed: 0, isMoving: false,
              lArmX: -2.45 + Math.sin(tSec * 11 + cm.phase) * 0.25,
              rArmX: -2.45 - Math.sin(tSec * 11 + cm.phase) * 0.25,
              lArmZ: -0.35, rArmZ: 0.35, dampRate: 14
            }, dt);
          }
        } else {
          m.position.y = THREE.MathUtils.damp(m.position.y, gY, 10, dt);
          if (typeof window.applyMiracleNpcLimbAnimation === 'function') {
            window.applyMiracleNpcLimbAnimation(m, { speed: 0, isMoving: false }, dt);
          }
        }
      });

      // 삭개오 돈주머니 펄스 및 3D→2D 화면 투영 좌표 갱신
      if (zd.pouchMesh) {
        if (zd.pouchMesh.userData && zd.pouchMesh.userData.ring) {
          const rp = 0.94 + Math.sin(tSec * 5.0) * 0.10;
          zd.pouchMesh.userData.ring.scale.set(rp, rp, 1);
        }
        const proj = zd.pouchMesh.position.clone().add(new THREE.Vector3(0, 0.42, 0)).project(camera);
        const sx = (proj.x * 0.5 + 0.5) * vw;
        const sy = (-proj.y * 0.5 + 0.5) * vh;
        zd.pouchScreenPos = { x: sx, y: sy };
        const anc = document.getElementById('miracle-zac-pouch-anchor');
        if (anc) {
          if (!zd.reachedHalf && !zd.dragging && proj.z < 1) {
            anc.style.left = `${sx.toFixed(1)}px`;
            anc.style.top = `${sy.toFixed(1)}px`;
            anc.classList.remove('hidden');
          } else {
            anc.classList.add('hidden');
          }
        }
      }

      // 삭개오 투척/대기 포즈
      if (zd.dragging && zd.dragCurr) {
        const aimPt = getZacchaeusDragWorldPoint(zd.dragCurr.x, zd.dragCurr.y, confessPos.y + 0.65, zd);
        const aimAng = Math.atan2(aimPt.x - confessPos.x, aimPt.z - confessPos.z);
        zGrp.rotation.y = lerpAngle(zGrp.rotation.y, aimAng, Math.min(1, dt * 10));
        if (typeof window.applyMiracleNpcLimbAnimation === 'function') {
          window.applyMiracleNpcLimbAnimation(zMesh, {
            speed: 0, isMoving: false, lArmX: -1.15, lArmZ: -0.45, rArmX: -0.42, dampRate: 12
          }, dt);
        }
      } else if (zd.throwAnimTimer > 0) {
        zd.throwAnimTimer = Math.max(0, zd.throwAnimTimer - dt);
        const pT = 1.0 - (zd.throwAnimTimer / 0.58);
        if (zd.throwTargetYaw !== null) {
          zGrp.rotation.y = lerpAngle(zGrp.rotation.y, zd.throwTargetYaw, Math.min(1, dt * 12));
        }
        const fling = Math.sin(pT * Math.PI);
        if (typeof window.applyMiracleNpcLimbAnimation === 'function') {
          window.applyMiracleNpcLimbAnimation(zMesh, {
            speed: 0, isMoving: false,
            lArmX: -0.6 - fling * 1.65,
            rArmX: -0.5 - fling * 0.85,
            lArmZ: -0.25 - fling * 0.35,
            dampRate: 18
          }, dt);
        }
      } else {
        if (zd.pouchPos) {
          const pouchAng = Math.atan2(zd.pouchPos.x - confessPos.x, zd.pouchPos.z - confessPos.z);
          zGrp.rotation.y = lerpAngle(zGrp.rotation.y, pouchAng, Math.min(1, dt * 6.5));
        }
        if (typeof window.applyMiracleNpcLimbAnimation === 'function') {
          window.applyMiracleNpcLimbAnimation(zMesh, { speed: 0, isMoving: false, lArmX: -0.35, rArmX: -0.35, dampRate: 8 }, dt);
        }
      }
      if (zu.lElbow && zu.rElbow) {
        const targetEl = zd.dragging ? -0.45 : (zd.throwAnimTimer > 0 ? -0.18 : -0.15);
        zu.lElbow.rotation.x = THREE.MathUtils.damp(zu.lElbow.rotation.x, targetEl, 12, dt);
        zu.rElbow.rotation.x = THREE.MathUtils.damp(zu.rElbow.rotation.x, -0.15, 10, dt);
      }

      // 날아가는 3D 금화 포물선 업데이트 + 도착 반짝임 & 군중 환호 트리거
      for (let ci = zd.flyingCoins.length - 1; ci >= 0; ci--) {
        const fc = zd.flyingCoins[ci];
        fc.elapsed += dt;
        if (fc.elapsed < 0) {
          fc.mesh.visible = false;
          continue;
        }
        fc.mesh.visible = true;
        const u = Math.min(1, fc.elapsed / fc.duration);
        fc.mesh.position.x = THREE.MathUtils.lerp(fc.startPos.x, fc.endPos.x, u);
        fc.mesh.position.z = THREE.MathUtils.lerp(fc.startPos.z, fc.endPos.z, u);
        fc.mesh.position.y = THREE.MathUtils.lerp(fc.startPos.y, fc.endPos.y, u) + Math.sin(u * Math.PI) * fc.arcHeight;
        fc.mesh.rotation.y += dt * 14;
        fc.mesh.rotation.x += dt * 9;

        if (u >= 1) {
          if (fc.targetMember) fc.targetMember.cheerTimer = 1.35;
          for (let si = 0; si < 2; si++) {
            const sp = createLowPolyMesh(new THREE.OctahedronGeometry(0.11, 0), si % 2 === 0 ? '#fef08a' : '#f59e0b', fc.endPos.x, fc.endPos.y + 0.1, fc.endPos.z, false);
            worldGroup.add(sp);
            zd.sparkles.push({
              mesh: sp,
              vx: (Math.random() - 0.5) * 1.6,
              vy: 1.4 + Math.random() * 1.4,
              vz: (Math.random() - 0.5) * 1.6,
              life: 0.6
            });
          }
          playSfx('rescue');
          worldGroup.remove(fc.mesh);
          zd.flyingCoins.splice(ci, 1);
        }
      }

      for (let si = zd.sparkles.length - 1; si >= 0; si--) {
        const sp = zd.sparkles[si];
        sp.life -= dt;
        if (sp.life <= 0) {
          worldGroup.remove(sp.mesh);
          zd.sparkles.splice(si, 1);
          continue;
        }
        sp.mesh.position.x += sp.vx * dt;
        sp.mesh.position.y += sp.vy * dt;
        sp.mesh.position.z += sp.vz * dt;
        const sSc = Math.max(0.1, sp.life * 1.6);
        sp.mesh.scale.set(sSc, sSc, sSc);
      }

      // 50% 달성 시 잠시 환호 감상 후 6단계 예수님 축복 컷신으로 전환 (군중을 배경 -camSide 반원으로 정돈)
      if (zd.reachedHalf) {
        zd.finishDelay -= dt;
        if (zd.finishDelay <= 0) {
          fe.cutscenePhase = 'jesus_blessing';
          fe.cutsceneTimer = 0;
          if (zd.pouchMesh) {
            worldGroup.remove(zd.pouchMesh);
            zd.pouchMesh = null;
          }
          const grove = Array.isArray(window.miracleZacchaeusGroveTrees) ? window.miracleZacchaeusGroveTrees : [];
          const bgCenterAng = Math.atan2(-camSideX * 0.85 - fwdX * 0.45, -camSideZ * 0.85 - fwdZ * 0.45);
          const crowdList = zd.crowdMembers || [];
          crowdList.forEach((cm, idx) => {
            const frac = crowdList.length > 1 ? ((idx / (crowdList.length - 1)) * 2 - 1) : 0;
            const ang = bgCenterAng + frac * 1.25;
            let rad = 3.55 + (idx % 2) * 0.85;
            let bx = jPos.x + Math.sin(ang) * rad;
            let bz = jPos.z + Math.cos(ang) * rad;
            if (Math.hypot(bx - zd.treePos.x, bz - zd.treePos.z) < 2.2 ||
                grove.some(gt => Math.hypot(bx - gt.x, bz - gt.z) < 2.2)) {
              rad = 3.0;
              bx = jPos.x + Math.sin(ang) * rad;
              bz = jPos.z + Math.cos(ang) * rad;
            }
            cm.blessingPos = new THREE.Vector3(bx, getMiracleOpenWorldGroundHeight(bx, bz), bz);
          });
          if (typeof createGoldenAuraGroup === 'function') {
            zd.blessingAura = createGoldenAuraGroup(0xfde047, 1.45);
            zd.blessingAura.position.copy(jPos);
            worldGroup.add(zd.blessingAura);
          }
          playSfx('clear');
          if (typeof speakText === 'function') speakText('오늘 이 집은 구원 받았습니다. 오늘 당신의 집에서 머물겠어요');
          syncMiracleZacchaeusOverlayUI(fe);
          syncMiracleMissionStatusPanel();
        }
      }
    } else if (fe.cutscenePhase === 'jesus_blessing') {
      // 6단계: 예수님의 구원 선포 클로즈업 (군중은 -camSide 배경에서 환호, +camSide 카메라 전면 100% 개방)
      const confessPos = zd.confessPos || zGrp.position;
      if (jNpc) setFlatYawToward(jNpc, confessPos.x, confessPos.z);
      setFlatYawToward(zGrp, jPos.x, jPos.z);

      (zd.crowdMembers || []).forEach(cm => {
        if (!cm || !cm.mesh) return;
        const m = cm.mesh;
        if (cm.blessingPos) {
          m.position.x = THREE.MathUtils.damp(m.position.x, cm.blessingPos.x, 7.0, dt);
          m.position.z = THREE.MathUtils.damp(m.position.z, cm.blessingPos.z, 7.0, dt);
        }
        m.position.y = getMiracleOpenWorldGroundHeight(m.position.x, m.position.z);
        const lookP = Math.atan2(jPos.x - m.position.x, jPos.z - m.position.z);
        m.rotation.y = lerpAngle(m.rotation.y, lookP, Math.min(1, dt * 6));
        if (typeof window.applyMiracleNpcLimbAnimation === 'function') {
          window.applyMiracleNpcLimbAnimation(m, {
            speed: 0, isMoving: false,
            lArmX: -1.45 + Math.sin(tSec * 6.5 + cm.phase) * 0.22,
            rArmX: -1.45 - Math.sin(tSec * 6.5 + cm.phase) * 0.22,
            lArmZ: -0.25, rArmZ: 0.25, dampRate: 10
          }, dt);
        }
      });

      if (zd.blessingAura && zd.blessingAura.userData && typeof zd.blessingAura.userData.animate === 'function') {
        zd.blessingAura.userData.animate(tSec);
      }

      if (ju.lArm && ju.rArm) {
        ju.lArm.rotation.x = THREE.MathUtils.damp(ju.lArm.rotation.x, -0.88, 8, dt);
        ju.lArm.rotation.z = THREE.MathUtils.damp(ju.lArm.rotation.z, -0.34, 8, dt);
        ju.rArm.rotation.x = THREE.MathUtils.damp(ju.rArm.rotation.x, -0.88, 8, dt);
        ju.rArm.rotation.z = THREE.MathUtils.damp(ju.rArm.rotation.z,  0.34, 8, dt);
      }
      if (ju.head) ju.head.rotation.x = THREE.MathUtils.damp(ju.head.rotation.x, 0.14, 8, dt);

      if (typeof window.applyMiracleNpcLimbAnimation === 'function') {
        window.applyMiracleNpcLimbAnimation(zMesh, {
          speed: 0, isMoving: false,
          lArmX: -1.15 + Math.sin(tSec * 6) * 0.18,
          rArmX: -1.15 - Math.sin(tSec * 6) * 0.18,
          dampRate: 10
        }, dt);
      }
      if (zu.lElbow && zu.rElbow) {
        zu.lElbow.rotation.x = THREE.MathUtils.damp(zu.lElbow.rotation.x, -0.16, 10, dt);
        zu.rElbow.rotation.x = THREE.MathUtils.damp(zu.rElbow.rotation.x, -0.16, 10, dt);
      }
      if (zu.head) zu.head.rotation.x = THREE.MathUtils.damp(zu.head.rotation.x, -0.22, 8, dt);

      const midX = jPos.x * 0.56 + confessPos.x * 0.44;
      const midZ = jPos.z * 0.56 + confessPos.z * 0.44;
      const lookTgt = new THREE.Vector3(midX, jPos.y + 1.22, midZ);
      const targetCam = new THREE.Vector3(
        midX + camSideX * 3.05 + fwdX * 0.55,
        jPos.y + 1.76,
        midZ + camSideZ * 3.05 + fwdZ * 0.55
      );
      keepZacchaeusCameraLineClear(targetCam, lookTgt, zd, dt, fe.cutsceneTimer < 0.08);
      camera.position.lerp(targetCam, Math.min(1, dt * 4.2));
      camera.lookAt(lookTgt);

      if (fe.cutsceneTimer >= 4.2) {
        fe.cutsceneActive = false;
        fe.cutsceneCameraActive = false;
        finishMiracleFieldEvent(evSpot);
        return;
      }
    }
    return;
  }

  // =========================================================================
  // 기본 수집 및 배달 미션 업데이트 (가나·선한사마리아인·반석·다락방·호산나·겨자씨 등)
  // =========================================================================
  if (fe.type === 'collect_deliver') {
    fe.items.forEach(it => {
      if (it.done) return;
      it.mesh.rotation.y += dt * 2.1;
      const d = Math.hypot(playerPos.x - it.pos.x, playerPos.z - it.pos.z);
      const itY = (it.baseY !== undefined) ? it.baseY : (it.pos.y - 0.4);
      const dy = Math.abs(playerPos.y - itY);
      updateWorldLabelPos(it.label, it.pos, d < MIRACLE_TAG_DIST_ITEM);

      if (d < 2.35 && dy < 1.85) {
        it.done = true;
        it.mesh.visible = false;
        it.label.style.opacity = '0';
        const wasCarrying = fe.carrying;
        fe.carrying++;
        playSfx('rescue');
        if (wasCarrying > 0) {
          showToast(`✨ ${evSpot.itemLabel} 획득! (${fe.collected + fe.carrying}/${fe.required}) · 목표 지점으로 가져가세요!`);
        }
        syncMiracleMissionStatusPanel();
      }
    });

    if (evSpot.multiRandomLaySpots && fe.laySpots.length > 0) {
      // 호산나 입성: 성문 앞 랜덤 5개 자리에 종려나무 가지를 직접 까는 로직
      let nextOpenSpot = null;
      for (let i = 0; i < fe.laySpots.length; i++) {
        const ls = fe.laySpots[i];
        if (ls.laid) {
          ls.label.style.opacity = '0';
          continue;
        }
        if (!nextOpenSpot) nextOpenSpot = ls;
        const td = Math.hypot(playerPos.x - ls.pos.x, playerPos.z - ls.pos.z);
        updateWorldLabelPos(ls.label, ls.pos, td < MIRACLE_TAG_DIST_SPOT);
        if (td < 2.6 && fe.carrying > 0) {
          ls.laid = true;
          ls.label.style.opacity = '0';
          if (ls.ring && ls.ring.material) ls.ring.material.color.setHex(0x10b981);
          // 성문 앞 길에 푸른 종려나무 가지 3D 배치!
          if (typeof createPalmBranchMesh === 'function') {
            const laidFrond = createPalmBranchMesh(1.18);
            laidFrond.position.set(0, 0.04, 0);
            laidFrond.rotation.y = (i * 0.9) - 0.5;
            ls.mesh.add(laidFrond);
          }
          fe.carrying--;
          fe.collected++;
          playSfx('build');
          syncMiracleMissionStatusPanel();
          if (fe.collected >= fe.required) {
            finishMiracleFieldEvent(evSpot);
            return;
          } else {
            showToast(`🌿 성문 앞 길에 종려나무 가지를 깔았어요! (${fe.collected}/${fe.required})`);
          }
        }
      }
      fe.targetZone = nextOpenSpot || fe.laySpots[0];
    } else if (fe.targetZone) {
      const tz = fe.targetZone;
      const td = Math.hypot(playerPos.x - tz.pos.x, playerPos.z - tz.pos.z);
      const dy = tz.requireYMatch ? Math.abs(playerPos.y - (tz.goalY || 0)) : 0;
      updateWorldLabelPos(tz.label, tz.pos, td < MIRACLE_TAG_DIST_SPOT);

      const deliverRad = (evSpot.id === 'par_builder') ? 5.6 : 3.1;
      if (td < deliverRad && dy < 2.2 && fe.carrying > 0) {
        fe.collected += fe.carrying;
        fe.carrying = 0;
        playSfx('build');
        tz.label.innerHTML = `${evSpot.targetLabel} (${fe.collected}/${fe.required})`;
        syncMiracleMissionStatusPanel();
        if (fe.collected >= fe.required) {
          finishMiracleFieldEvent(evSpot);
          return;
        } else {
          showToast(`🙌 전달 완료! (${fe.collected}/${fe.required}) · 남은 물품을 마저 옮겨 주세요!`);
        }
      }
    }
  } else if (fe.type === 'sower_farm' && fe.sowerState) {
    // [씨 뿌리기 미니게임: 좋은 땅 만들기 6단계 상태 머신]
    const sf = fe.sowerState;
    const distField = Math.hypot(playerPos.x - sf.fx, playerPos.z - sf.fz);
    if (sf.beaconRing) {
      const bp = 1.0 + Math.sin(tSec * 3.5) * 0.08;
      sf.beaconRing.scale.set(bp, bp, 1);
    }
    updateWorldLabelPos(sf.plotLbl, new THREE.Vector3(sf.fx, sf.fy + 1.1, sf.fz), distField < 32.0);

    if (sf.phase === 'find_field') {
      if (distField < 5.4) {
        sf.phase = 'collect_seeds';
        sf.seedBaskets.forEach(b => { b.mesh.visible = true; });
        if (sf.beaconRing && sf.beaconRing.material) sf.beaconRing.material.color.setHex(0x38bdf8);
        sf.plotLbl.innerHTML = `🧺 씨앗 바구니를 모은 뒤 돌아오세요! (0/${sf.seedTotal})`;
        playSfx('rescue');
      }
    } else if (sf.phase === 'collect_seeds') {
      sf.seedBaskets.forEach(b => {
        if (b.done) return;
        b.mesh.rotation.y += dt * 2.2;
        const bd = Math.hypot(playerPos.x - b.pos.x, playerPos.z - b.pos.z);
        const byDiff = Math.abs(playerPos.y - b.baseY);
        updateWorldLabelPos(b.label, b.pos, bd < MIRACLE_TAG_DIST_ITEM + 4.0);
        if (bd < 2.35 && byDiff < 1.85) {
          b.done = true;
          b.mesh.visible = false;
          b.label.style.opacity = '0';
          sf.seedsCollected++;
          playSfx('rescue');
          sf.plotLbl.innerHTML = `🧺 씨앗 바구니 수집 (${sf.seedsCollected}/${sf.seedTotal})`;
          if (sf.seedsCollected < sf.seedTotal) {
            showToast(`🧺 씨앗 바구니 획득! (${sf.seedsCollected}/${sf.seedTotal})`);
          }
        }
      });
      if (sf.seedsCollected >= sf.seedTotal) {
        sf.phase = 'clear_rocks';
        if (sf.beaconRing && sf.beaconRing.material) sf.beaconRing.material.color.setHex(0xf97316);
        sf.plotLbl.innerHTML = `🪨 밭의 돌을 모두 치우세요! (0/${sf.rocks.length})`;
        playSfx('build');
      }
    } else if (sf.phase === 'clear_rocks') {
      sf.rocks.forEach(r => {
        if (r.cleared) return;
        const rd = Math.hypot(playerPos.x - r.wx, playerPos.z - r.wz);
        if (rd < 2.05) {
          r.cleared = true;
          r.mesh.visible = false;
          sf.rocksCleared++;
          playSfx('hammer');
          sf.plotLbl.innerHTML = `🪨 밭의 돌 제거 중 (${sf.rocksCleared}/${sf.rocks.length})`;
          if (sf.rocksCleared < sf.rocks.length) {
            showToast(`🪨 돌을 치웠어요! (${sf.rocksCleared}/${sf.rocks.length})`);
          }
        }
      });
      if (sf.rocksCleared >= sf.rocks.length) {
        sf.phase = 'clear_thorns';
        if (sf.beaconRing && sf.beaconRing.material) sf.beaconRing.material.color.setHex(0x84cc16);
        sf.plotLbl.innerHTML = `🌿 가시덤불과 잡초 제거 (0/${sf.thorns.length})`;
        playSfx('rescue');
      }
    } else if (sf.phase === 'clear_thorns') {
      sf.thorns.forEach(th => {
        if (th.cleared) return;
        const td = Math.hypot(playerPos.x - th.wx, playerPos.z - th.wz);
        if (td < 2.05) {
          th.cleared = true;
          th.mesh.visible = false;
          sf.thornsCleared++;
          playSfx('step');
          sf.plotLbl.innerHTML = `🌿 가시·잡초 제거 중 (${sf.thornsCleared}/${sf.thorns.length})`;
          if (sf.thornsCleared < sf.thorns.length) {
            showToast(`🌿 가시덤불·잡초 제거! (${sf.thornsCleared}/${sf.thorns.length})`);
          }
        }
      });
      if (sf.thornsCleared >= sf.thorns.length) {
        sf.phase = 'level_soil';
        if (sf.beaconRing && sf.beaconRing.material) sf.beaconRing.material.color.setHex(0x4ade80);
        sf.plotLbl.innerHTML = `🪴 울퉁불퉁한 흙을 고르게 정돈하세요! (0/${sf.mounds.length})`;
        playSfx('rescue');
      }
    } else if (sf.phase === 'level_soil') {
      sf.mounds.forEach(m => {
        if (m.leveled) return;
        const onStrip = (Math.abs(playerPos.z - m.wz) < 1.10 && Math.abs(playerPos.x - sf.fx) < 3.9)
          || Math.hypot(playerPos.x - m.wx, playerPos.z - m.wz) < 2.25;
        if (onStrip) {
          m.leveled = true;
          m.roughGrp.visible = false;
          m.neatRidge.visible = true;
          sf.moundsLeveled++;
          playSfx('build');
          const ratio = sf.moundsLeveled / sf.mounds.length;
          sf.soilMat.color.copy(new THREE.Color('#a68a64')).lerp(new THREE.Color('#5c3a1e'), ratio);
          sf.plotLbl.innerHTML = `🪴 땅 고르기 정돈 중 (${sf.moundsLeveled}/${sf.mounds.length})`;
          if (sf.moundsLeveled < sf.mounds.length) {
            showToast(`🪴 좋은 땅 이랑 완성! (${sf.moundsLeveled}/${sf.mounds.length})`);
          }
        }
      });
      if (sf.moundsLeveled >= sf.mounds.length) {
        sf.phase = 'ready_to_sow';
        sf.plotLbl.innerHTML = '🌱 좋은 땅 완성! [씨앗 뿌리기] 버튼을 누르세요!';
        const btnWrap = document.getElementById('miracle-sower-btn-wrap');
        if (btnWrap) btnWrap.classList.remove('hidden');
        playSfx('rescue');
      }
    } else if (sf.phase === 'sowing') {
      sf.sowTimer += dt;
      sf.seedParticles.forEach(sp => {
        sp.mesh.position.y = Math.max(sp.targetY, sp.mesh.position.y + sp.vy * dt);
        sp.mesh.rotation.y += dt * 7;
      });
      if (sf.sowTimer >= 1.35) {
        const plantedX = sf.fx;
        const plantedZ = sf.fz;
        // 모든 6단계(밭 찾기→씨앗 모으기→돌 제거→가시·잡초 제거→땅 고르기→씨앗 뿌리기) 완료 시에만 파종 이력 저장!
        if (!Array.isArray(window.miracleSowerHistory)) window.miracleSowerHistory = [];
        const existingIdx = window.miracleSowerHistory.findIndex(h => Math.hypot(h.x - plantedX, h.z - plantedZ) < 3.5);
        const rec = { x: plantedX, z: plantedZ, plantedAt: Date.now(), allStepsCompleted: true };
        if (existingIdx >= 0) window.miracleSowerHistory[existingIdx] = rec;
        else window.miracleSowerHistory.push(rec);
        saveMiracleSowerHistoryToStorage();

        finishMiracleFieldEvent(evSpot);
        // 미션 정리 후 천천히 자라나는 영구 곡식 밭 배치!
        spawnPersistentSowerGrowingField(plantedX, plantedZ, 0);
        return;
      }
    }
  } else if (fe.type === 'mustard_grow' && fe.mustardState) {
    // [겨자씨 비유 미니게임: 아주 작은 겨자씨 줍기 → 흙밭 심기 → 물 항아리 찾기 → 물 붓기 → 5분 관목 성장]
    const ms = fe.mustardState;
    const distPlot = Math.hypot(playerPos.x - ms.fx, playerPos.z - ms.fz);
    if (ms.beaconRing) {
      const bp = 1.0 + Math.sin(tSec * 3.5) * 0.08;
      ms.beaconRing.scale.set(bp, bp, 1);
    }
    updateWorldLabelPos(ms.plotLbl, new THREE.Vector3(ms.fx, ms.fy + 1.05, ms.fz), distPlot < 32.0);

    if (ms.phase === 'find_seed' && ms.seedObj && !ms.seedObj.done) {
      const sObj = ms.seedObj;
      if (ms.seedOuterRing) {
        const sp = 1.0 + Math.sin(tSec * 4.2) * 0.16;
        ms.seedOuterRing.scale.set(sp, sp, 1);
      }
      if (ms.seedPointer) {
        ms.seedPointer.position.y = 1.45 + Math.sin(tSec * 4.5) * 0.22;
        ms.seedPointer.rotation.y += dt * 2.4;
      }
      if (Array.isArray(ms.seedSparkles)) {
        ms.seedSparkles.forEach((sp, si) => {
          const ang = tSec * 2.2 + sp.phase;
          sp.mesh.position.set(
            Math.cos(ang) * 0.55,
            0.28 + ((tSec * 0.8 + si * 0.2) % 0.65),
            Math.sin(ang) * 0.55
          );
          sp.mesh.rotation.y += dt * 4.5;
        });
      }

      const dSeed = Math.hypot(playerPos.x - sObj.pos.x, playerPos.z - sObj.pos.z);
      const dySeed = Math.abs(playerPos.y - sObj.baseY);
      updateWorldLabelPos(sObj.label, sObj.pos, dSeed < 44.0);
      if (dSeed < 2.25 && dySeed < 2.1) {
        sObj.done = true;
        sObj.mesh.visible = false;
        sObj.label.style.opacity = '0';
        ms.phase = 'plant_seed';
        if (ms.beaconRing && ms.beaconRing.material) {
          ms.beaconRing.material.color.setHex(0xfacc15);
          ms.beaconRing.material.opacity = 0.85;
        }
        ms.plotLbl.innerHTML = '🌱 다가가서 아주 작은 겨자씨를 심으세요!';
        if (typeof carriedBlockGroup !== 'undefined' && carriedBlockGroup) {
          while (carriedBlockGroup.children.length > 0) carriedBlockGroup.remove(carriedBlockGroup.children[0]);
          const handSeed = new THREE.Group();
          const saucer = createLowPolyMesh(new THREE.CylinderGeometry(0.16, 0.12, 0.04, 7), '#e7dcc8', 0, 0, 0, false);
          const tinyHold = createLowPolyMesh(new THREE.IcosahedronGeometry(0.065, 0), '#5c3a14', 0, 0.045, 0, false);
          const glowOrb = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.10, 0),
            new THREE.MeshBasicMaterial({ color: 0xfde047, transparent: true, opacity: 0.65 })
          );
          glowOrb.position.y = 0.06;
          handSeed.add(saucer, tinyHold, glowOrb);
          carriedBlockGroup.add(handSeed);
        }
        playSfx('rescue');
        showToast('✨ 아주 작은 겨자씨 한 알을 주웠어요! 흙밭으로 가서 심어 볼까요?');
        syncMiracleMissionStatusPanel();
      }
    } else if (ms.phase === 'plant_seed') {
      if (distPlot < 2.85 && Math.abs(playerPos.y - ms.fy) < 2.4) {
        if (typeof carriedBlockGroup !== 'undefined' && carriedBlockGroup) {
          while (carriedBlockGroup.children.length > 0) carriedBlockGroup.remove(carriedBlockGroup.children[0]);
        }
        if (ms.plantedSeedMesh) ms.plantedSeedMesh.visible = true;
        if (ms.waterObj && ms.waterObj.mesh) ms.waterObj.mesh.visible = true;
        ms.phase = 'find_water';
        if (ms.beaconRing && ms.beaconRing.material) {
          ms.beaconRing.material.color.setHex(0x38bdf8);
          ms.beaconRing.material.opacity = 0.55;
        }
        ms.plotLbl.innerHTML = '💧 맑은 물 항아리를 찾아오세요!';
        playSfx('build');
        showToast('🌱 흙밭에 아주 작은 겨자씨를 심었어요! 이제 맑은 물 항아리를 찾아오세요!');
        syncMiracleMissionStatusPanel();
      }
    } else if (ms.phase === 'find_water' && ms.waterObj && !ms.waterObj.done) {
      const wObj = ms.waterObj;
      wObj.mesh.rotation.y += dt * 1.6;
      const dWater = Math.hypot(playerPos.x - wObj.pos.x, playerPos.z - wObj.pos.z);
      const dyWater = Math.abs(playerPos.y - wObj.baseY);
      updateWorldLabelPos(wObj.label, wObj.pos, dWater < 38.0);
      if (dWater < 2.35 && dyWater < 2.1) {
        wObj.done = true;
        wObj.mesh.visible = false;
        wObj.label.style.opacity = '0';
        ms.phase = 'pour_water';
        if (ms.beaconRing && ms.beaconRing.material) {
          ms.beaconRing.material.color.setHex(0x38bdf8);
          ms.beaconRing.material.opacity = 0.90;
        }
        ms.plotLbl.innerHTML = '💧 흙밭에 다가가 물을 부어 주세요!';
        if (typeof carriedBlockGroup !== 'undefined' && carriedBlockGroup) {
          while (carriedBlockGroup.children.length > 0) carriedBlockGroup.remove(carriedBlockGroup.children[0]);
          const miniJar = (typeof createWaterFilledAmphoraMesh === 'function')
            ? createWaterFilledAmphoraMesh(0.46)
            : createLowPolyMesh(new THREE.DodecahedronGeometry(0.24, 0), '#38bdf8', 0, 0, 0, false);
          carriedBlockGroup.add(miniJar);
        }
        playSfx('rescue');
        showToast('💧 맑은 물 항아리를 찾았어요! 흙밭으로 돌아가 겨자씨에 물을 부어 주세요!');
        syncMiracleMissionStatusPanel();
      }
    } else if (ms.phase === 'pour_water') {
      if (distPlot < 2.85 && Math.abs(playerPos.y - ms.fy) < 2.4) {
        ms.phase = 'pouring';
        ms.pourTimer = 0;
        if (typeof carriedBlockGroup !== 'undefined' && carriedBlockGroup) {
          while (carriedBlockGroup.children.length > 0) carriedBlockGroup.remove(carriedBlockGroup.children[0]);
        }

        const pourJar = (typeof createWaterFilledAmphoraMesh === 'function')
          ? createWaterFilledAmphoraMesh(0.74)
          : createLowPolyMesh(new THREE.DodecahedronGeometry(0.32, 0), '#38bdf8', 0, 0, 0, false);
        pourJar.position.set(ms.fx + 0.56, ms.fy + 1.38, ms.fz);
        pourJar.rotation.z = 0.95;
        worldGroup.add(pourJar);
        miracleWorldMissionObjects.push({ mesh: pourJar });
        ms.pourJarMesh = pourJar;

        ms.waterParticles = [];
        for (let i = 0; i < 24; i++) {
          const drop = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.085, 0),
            new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0x38bdf8 : 0xbae6fd })
          );
          const ox = (Math.random() - 0.5) * 0.45;
          const oz = (Math.random() - 0.5) * 0.45;
          drop.position.set(ms.fx + ox * 0.4, ms.fy + 1.22 + Math.random() * 0.35, ms.fz + oz * 0.4);
          worldGroup.add(drop);
          miracleWorldMissionObjects.push({ mesh: drop });
          ms.waterParticles.push({
            mesh: drop,
            ox, oz,
            vy: -(1.9 + Math.random() * 1.4),
            targetY: ms.fy + 0.24
          });
        }

        ms.plotLbl.innerHTML = '💧✨ 심은 겨자씨에 물을 붓고 있어요!';
        playSfx('clear');
        showToast('💧✨ 겨자씨에 맑은 물을 듬뿍 부어 주었어요!');
        syncMiracleMissionStatusPanel();
      }
    } else if (ms.phase === 'pouring') {
      ms.pourTimer += dt;
      const pRatio = Math.min(1.0, ms.pourTimer / 1.45);
      if (ms.pourJarMesh) {
        ms.pourJarMesh.rotation.z = 0.85 + Math.sin(pRatio * Math.PI) * 0.48;
      }
      ms.waterParticles.forEach(wp => {
        wp.mesh.position.y += wp.vy * dt;
        if (wp.mesh.position.y <= wp.targetY) {
          if (pRatio < 0.80) {
            wp.mesh.position.set(ms.fx + wp.ox * 0.35, ms.fy + 1.18 + Math.random() * 0.16, ms.fz + wp.oz * 0.35);
          } else {
            wp.mesh.position.y = wp.targetY;
            wp.mesh.visible = false;
          }
        }
      });
      if (ms.soilMat) {
        ms.soilMat.color.copy(new THREE.Color('#a68a64')).lerp(new THREE.Color('#4a2e16'), Math.min(1, pRatio * 1.25));
      }
      if (ms.tinySproutGrp && pRatio > 0.35) {
        if (ms.plantedSeedMesh) ms.plantedSeedMesh.visible = false;
        ms.tinySproutGrp.visible = true;
        ms.tinySproutGrp.scale.setScalar(0.10 + ((pRatio - 0.35) / 0.65) * 0.90);
      }

      if (ms.pourTimer >= 1.45) {
        const plantedX = ms.fx;
        const plantedZ = ms.fz;
        if (!Array.isArray(window.miracleMustardHistory)) window.miracleMustardHistory = [];
        const existingIdx = window.miracleMustardHistory.findIndex(h => Math.hypot(h.x - plantedX, h.z - plantedZ) < 3.5);
        const rec = { x: plantedX, z: plantedZ, plantedAt: Date.now(), allStepsCompleted: true };
        if (existingIdx >= 0) window.miracleMustardHistory[existingIdx] = rec;
        else window.miracleMustardHistory.push(rec);
        saveMiracleMustardHistoryToStorage();

        finishMiracleFieldEvent(evSpot);
        spawnPersistentMustardShrub(plantedX, plantedZ, 0);
        return;
      }
    }
  } else if (fe.type === 'escort_guide') {
    const safeDt = Math.min(0.06, Math.max(0.001, dt || 0.016));

    if (Array.isArray(fe.escortFollowers) && fe.escortFollowers.length > 0) {
      // [어린이 인도 · 엠마오 제자 등 동행 NPC] 개별 지면/계단 접지 + 이동 속도 비례 팔·다리 보행/대기 보간
      const playerTerrainY = getMiracleOpenWorldGroundHeight(playerPos.x, playerPos.z);
      const playerOnRaised = playerPos.y > playerTerrainY + 0.35;
      let sumX = 0, sumY = 0, sumZ = 0, cnt = 0;

      fe.escortFollowers.forEach(fl => {
        const m = fl.mesh;
        if (!m) return;
        const prevX = m.position.x, prevZ = m.position.z;
        const tx = playerPos.x - Math.sin(playerFacing) * fl.backOff + Math.cos(playerFacing) * fl.sideOff;
        const tz = playerPos.z - Math.cos(playerFacing) * fl.backOff - Math.sin(playerFacing) * fl.sideOff;
        const dx = tx - prevX;
        const dz = tz - prevZ;
        const distSlot = Math.hypot(dx, dz);
        const distPlayer = Math.hypot(playerPos.x - prevX, playerPos.z - prevZ);

        if (!fl.isWalking && (distSlot > fl.startDist || distPlayer > 4.1)) fl.isWalking = true;
        if (fl.isWalking && distSlot < fl.stopDist && distPlayer < 3.5) fl.isWalking = false;

        let actualSpd = 0;
        if (fl.isWalking && distSlot > 0.04) {
          const desiredSpd = distSlot > 10.0 ? 8.2 : Math.min(7.2, 4.4 + distSlot * 0.55);
          const step = Math.min(distSlot, desiredSpd * safeDt);
          const dirAng = Math.atan2(dx, dz);
          let moveAng = dirAng;

          if (!playerOnRaised && typeof isMiracleNpcPointClear === 'function') {
            const offsets = [0, 0.36, -0.36, 0.72, -0.72, 1.08, -1.08];
            let found = null;
            for (let oi = 0; oi < offsets.length; oi++) {
              const candA = dirAng + offsets[oi];
              const cxCand = prevX + Math.sin(candA) * step;
              const czCand = prevZ + Math.cos(candA) * step;
              if (isMiracleNpcPointClear(cxCand, czCand, 0.42)) {
                found = candA;
                break;
              }
            }
            if (found !== null) moveAng = found;
          }

          const nx = prevX + Math.sin(moveAng) * step;
          const nz = prevZ + Math.cos(moveAng) * step;
          const ny = (typeof window.getMiracleNpcSupportY === 'function')
            ? window.getMiracleNpcSupportY(nx, nz, m.position.y, 1.45)
            : getMiracleOpenWorldGroundHeight(nx, nz);
          const smoothY = (Math.abs(ny - m.position.y) > 2.2) ? ny : THREE.MathUtils.damp(m.position.y, ny, 16, safeDt);
          m.position.set(nx, smoothY, nz);
          actualSpd = Math.hypot(nx - prevX, nz - prevZ) / safeDt;

          if (actualSpd > 0.12) {
            const walkFace = Math.atan2(nx - prevX, nz - prevZ);
            fl.curHeading = lerpAngle(fl.curHeading || 0, walkFace, Math.min(1, safeDt * 11.0));
            m.rotation.y = fl.curHeading;
          }
        } else {
          const ny = (typeof window.getMiracleNpcSupportY === 'function')
            ? window.getMiracleNpcSupportY(prevX, prevZ, m.position.y, 1.45)
            : getMiracleOpenWorldGroundHeight(prevX, prevZ);
          m.position.y = (Math.abs(ny - m.position.y) > 2.2) ? ny : THREE.MathUtils.damp(m.position.y, ny, 16, safeDt);
          const facePlayerAng = Math.atan2(playerPos.x - prevX, playerPos.z - prevZ);
          fl.curHeading = lerpAngle(fl.curHeading || 0, facePlayerAng, Math.min(1, safeDt * 8.0));
          m.rotation.y = fl.curHeading;
        }

        if (typeof window.applyMiracleNpcLimbAnimation === 'function') {
          window.applyMiracleNpcLimbAnimation(m, {
            speed: actualSpd,
            isMoving: actualSpd > 0.20,
            strideFactor: fl.strideFactor || 1.65,
            legAmp: fl.legAmp || 0.62,
            armAmp: fl.armAmp || 0.54,
            dampRate: 14
          }, safeDt);
        }

        sumX += m.position.x; sumY += m.position.y; sumZ += m.position.z; cnt++;
      });

      if (fe.escortGroup && cnt > 0) {
        const eg = fe.escortGroup.mesh;
        if (eg) eg.position.set(sumX / cnt, sumY / cnt, sumZ / cnt);
        const ed = Math.hypot(playerPos.x - sumX / cnt, playerPos.z - sumZ / cnt);
        updateWorldLabelPos(fe.escortGroup.label, new THREE.Vector3(sumX / cnt, sumY / cnt, sumZ / cnt), ed < MIRACLE_TAG_DIST_NPC);
      }
    } else if (fe.escortGroup) {
      // [중풍병자 2인 앞·뒤 1열 들것 운반] 개별 계단/지면 접지 · 자연스러운 보행 · 계단 들것 수평 유지 + 옥상 대기 2인 손인사
      const eg = fe.escortGroup.mesh;
      const ud = eg.userData || {};
      const prevX = eg.position.x, prevZ = eg.position.z;
      let targetX = playerPos.x - Math.sin(playerFacing) * 2.15;
      let targetZ = playerPos.z - Math.cos(playerFacing) * 2.15;

      const sb = (window.miracleParalyticHouseInfo && window.miracleParalyticHouseInfo.stairBounds)
        ? window.miracleParalyticHouseInfo.stairBounds
        : null;
      const inSbRect = (px, pz) => Boolean(sb && px >= sb.minX && px <= sb.maxX && pz >= sb.minZ && pz <= sb.maxZ);
      const onStairCorridor = Boolean(
        sb && (inSbRect(prevX, prevZ) || inSbRect(playerPos.x, playerPos.z) || inSbRect(targetX, targetZ))
        && (playerPos.y > sb.baseY + 0.14 || eg.position.y > sb.baseY + 0.14)
      );

      if (onStairCorridor && sb) {
        targetX = THREE.MathUtils.lerp(targetX, sb.centerX, 0.86);
      }

      const dxT = targetX - prevX;
      const dzT = targetZ - prevZ;
      const dTarget = Math.hypot(dxT, dzT);
      if (!ud.isMoving && dTarget > 0.72) ud.isMoving = true;
      if (ud.isMoving && dTarget < 0.25) ud.isMoving = false;

      if (ud.isMoving && dTarget > 0.02) {
        const moveSpd = Math.min(7.4, 4.6 + dTarget * 0.65);
        const step = Math.min(dTarget, moveSpd * safeDt);
        eg.position.x = prevX + (dxT / dTarget) * step;
        eg.position.z = prevZ + (dzT / dTarget) * step;
      }

      const rawBaseY = (typeof window.getMiracleNpcSupportY === 'function')
        ? window.getMiracleNpcSupportY(eg.position.x, eg.position.z, eg.position.y, 1.50)
        : getMiracleOpenWorldGroundHeight(eg.position.x, eg.position.z);
      eg.position.y = (Math.abs(rawBaseY - eg.position.y) > 2.2) ? rawBaseY : THREE.MathUtils.damp(eg.position.y, rawBaseY, 16, safeDt);

      const actualSpd = Math.hypot(eg.position.x - prevX, eg.position.z - prevZ) / safeDt;
      ud.smoothSpd = THREE.MathUtils.damp(ud.smoothSpd || 0, actualSpd, 8.5, safeDt);

      let targetYaw = playerFacing;
      if (onStairCorridor && sb && (eg.position.y < sb.topY - 0.35 || inSbRect(eg.position.x, eg.position.z))) {
        // 동쪽 좁은 돌계단 오르내릴 때 들것 방향을 계단 통로(-Z/+Z)와 나란히 유지해 벽면 관통 방지
        const dzDir = (playerPos.z - prevZ);
        targetYaw = (dzDir <= 0.15) ? Math.PI : 0;
      } else if (actualSpd > 0.25) {
        targetYaw = Math.atan2(eg.position.x - prevX, eg.position.z - prevZ);
      }
      ud.curHeading = lerpAngle(ud.curHeading || 0, targetYaw, Math.min(1, safeDt * 7.5));
      eg.rotation.y = ud.curHeading;

      if (Array.isArray(ud.friendSpecs) && ud.stretcherOnly && ud.friendSpecs.length >= 2) {
        const sinH = Math.sin(ud.curHeading);
        const cosH = Math.cos(ud.curHeading);
        const friendYs = [];

        for (let fi = 0; fi < ud.friendSpecs.length; fi++) {
          const sp = ud.friendSpecs[fi];
          const lz = sp.fb * 1.45;
          const wx = eg.position.x + lz * sinH;
          const wz = eg.position.z + lz * cosH;
          const fy = (typeof window.getMiracleNpcSupportY === 'function')
            ? window.getMiracleNpcSupportY(wx, wz, eg.position.y + 0.70, 1.65)
            : getMiracleOpenWorldGroundHeight(wx, wz);
          friendYs.push(fy);
        }

        const backY = friendYs[0];
        const frontY = friendYs[1];
        const avgFY = (backY + frontY) * 0.5;
        const slopeDiff = frontY - backY;
        const shouldRaise = onStairCorridor || Math.abs(slopeDiff) > 0.25;
        ud.raiseBlend = THREE.MathUtils.damp(ud.raiseBlend || 0, shouldRaise ? 1.0 : 0.0, 6.2, safeDt);

        const lowPoleY = avgFY + 0.86;
        const highPoleY = Math.max(backY, frontY) + 0.96;
        const desiredPoleWorldY = THREE.MathUtils.lerp(lowPoleY, highPoleY, ud.raiseBlend);
        const desiredPitch = THREE.MathUtils.clamp(-Math.atan2(slopeDiff, 2.9) * 0.14, -0.14, 0.14);

        ud.curStretchY = THREE.MathUtils.damp(ud.curStretchY !== undefined ? ud.curStretchY : 0.22, desiredPoleWorldY - eg.position.y - 0.66, 10, safeDt);
        ud.curStretchPitch = THREE.MathUtils.damp(ud.curStretchPitch || 0, desiredPitch, 10, safeDt);

        let avgBob = 0;
        for (let fi = 0; fi < ud.friendSpecs.length; fi++) {
          const sp = ud.friendSpecs[fi];
          const fr = sp.mesh;
          if (!fr) continue;
          fr.position.x = THREE.MathUtils.damp(fr.position.x, 0, 12, safeDt);
          fr.position.z = THREE.MathUtils.damp(fr.position.z, sp.fb * 1.45, 12, safeDt);
          fr.rotation.y = THREE.MathUtils.damp(fr.rotation.y, 0, 12, safeDt);
          const localY = friendYs[fi] - eg.position.y;
          fr.position.y = (Math.abs(localY - fr.position.y) > 2.0) ? localY : THREE.MathUtils.damp(fr.position.y, localY, 16, safeDt);

          const poleYAtFriend = (ud.curStretchY + 0.66) - Math.sin(ud.curStretchPitch) * (sp.fb * 0.98);
          let armX;
          if (sp.fb < 0) {
            // 뒤쪽 친구: 양팔을 앞으로 뻗어 들것 뒷손잡이를 자연스럽게 잡음
            armX = THREE.MathUtils.clamp(-0.62 - Math.max(-0.2, (poleYAtFriend - fr.position.y - 0.88) * 1.15), -1.45, -0.45);
          } else {
            // 앞쪽 친구: 양팔을 뒤로 내려 들것 앞손잡이를 안정감 있게 잡음
            armX = THREE.MathUtils.clamp(0.36 - Math.max(0, (poleYAtFriend - (fr.position.y + 0.88)) * 0.35), 0.14, 0.44);
          }

          if (typeof window.applyMiracleNpcLimbAnimation === 'function') {
            const animRes = window.applyMiracleNpcLimbAnimation(fr, {
              speed: ud.smoothSpd,
              isMoving: ud.smoothSpd > 0.14,
              strideFactor: 1.55,
              legAmp: 0.54,
              lArmX: armX,
              rArmX: armX,
              lArmZ: -0.13,
              rArmZ: 0.13,
              dampRate: 12
            }, safeDt);
            avgBob += animRes.bobY;
          }
        }
        avgBob /= ud.friendSpecs.length;
        ud.stretcherOnly.position.y = ud.curStretchY + avgBob * 0.35;
        ud.stretcherOnly.rotation.x = ud.curStretchPitch;
      }

      // 옥상에서 기다리는 2명의 친구: 플레이어 쪽을 바라보며 반갑게 손짓하며 대기
      if (Array.isArray(fe.rooftopFriends)) {
        fe.rooftopFriends.forEach(rf => {
          const m = rf && rf.mesh;
          if (!m) return;
          const faceAng = Math.atan2(playerPos.x - m.position.x, playerPos.z - m.position.z);
          rf.heading = lerpAngle(rf.heading !== undefined ? rf.heading : m.rotation.y, faceAng, safeDt * 4.5);
          m.rotation.y = rf.heading;
          const distP = Math.hypot(playerPos.x - m.position.x, playerPos.z - m.position.z);
          const waveNear = distP < 22.0;
          if (typeof window.applyMiracleNpcLimbAnimation === 'function') {
            window.applyMiracleNpcLimbAnimation(m, {
              speed: 0,
              isMoving: false,
              rArmX: waveNear ? (-2.15 + Math.sin(tSec * 5.2 + (rf.phase || 0)) * 0.35) : undefined,
              rArmZ: waveNear ? 0.25 : 0.04,
              lArmZ: -0.04,
              dampRate: 10
            }, safeDt);
          }
        });
      }

      const ed = Math.hypot(playerPos.x - eg.position.x, playerPos.z - eg.position.z);
      updateWorldLabelPos(fe.escortGroup.label, eg.position, ed < MIRACLE_TAG_DIST_NPC);
    }

    if (fe.targetZone) {
      const tz = fe.targetZone;
      const td = Math.hypot(playerPos.x - tz.pos.x, playerPos.z - tz.pos.z);
      const expectedY = (tz.goalY !== undefined) ? tz.goalY : (evSpot.goalPos.y || 0);
      const dy = Math.abs(playerPos.y - expectedY);
      updateWorldLabelPos(tz.label, tz.pos, td < MIRACLE_TAG_DIST_SPOT);

      if (td < 3.3 && dy < 2.4) {
        if (evSpot.id === 'ev_paralytic' && !fe.cutsceneActive) {
          fe.cutsceneActive = true;
          fe.cutsceneCameraActive = true;
          fe.cutsceneType = 'paralytic_roof';
          fe.cutscenePhase = 'hammer';
          fe.cutsceneTimer = 0;
          fe.cutsceneProps = { roofY: playerPos.y, debris: [], ropes: [], lastHitIdx: -1 };
          showToast('🔨 옥상에서 기다리던 두 친구와 합류했어요! 망치로 지붕을 뚫기 시작합니다!');
        } else if (!fe.cutsceneActive) {
          if (evSpot.escortType === 'emmaus') {
            fe.walkHomeEscortOnClear = true;
          }
          finishMiracleFieldEvent(evSpot);
          return;
        }
      }
    }
  } else if (fe.type === 'follow_messenger' && fe.messenger) {
    // [우물가의 여인] 3명의 랜덤 주민에게 걸어가는 여인을 따라다니기 — 랜덤 속도(갑작스런 질주!) + 무떨림 건물 우회 + 완료 시 걸어서 귀가!
    const ms = fe.messenger;
    const wm = ms.mesh;
    const maxD = evSpot.maxFollowDist || 15.0;
    const distToPlayer = Math.hypot(playerPos.x - wm.position.x, playerPos.z - wm.position.z);

    updateWorldLabelPos(ms.label, wm.position, true);
    ms.recipients.forEach(rec => {
      const rd = Math.hypot(playerPos.x - rec.x, playerPos.z - rec.z);
      updateWorldLabelPos(rec.label, new THREE.Vector3(rec.x, rec.y + 0.5, rec.z), !rec.told && rd < 22);
    });

    if (distToPlayer > maxD) {
      // 일정 거리(15m) 벗어나면 미션 실패!
      playSfx('wrong');
      clearMiracleFieldEventObjects();
      evSpot._requireLeaveZone = true;
      evSpot._prompted = performance.now();
      openMiracleDialog({
        sourceRef: evSpot,
        speaker: '수가성 여인',
        category: 'eyewitness',
        text: '"앗, 저와 너무 멀어져서 기쁜 소식을 함께 전하지 못했어요! 다시 우물가에서 출발해 가까이 따라와 주실래요?"',
        btnText: '닫기',
        replayText: '🔄 다시 따라가기 도전!',
        onReplay: () => startMiracleFieldEvent(evSpot)
      });
      return;
    }

    const curRec = ms.recipients[ms.targetIdx];
    if (!curRec) {
      ms.walkHomeOnClear = true;
      finishMiracleFieldEvent(evSpot);
      return;
    }

    if (ms.pauseTimer > 0) {
      ms.pauseTimer -= dt;
      if (typeof window.applyMiracleNpcLimbAnimation === 'function') {
        window.applyMiracleNpcLimbAnimation(wm, { speed: 0, isMoving: false }, dt);
      } else {
        const u = wm.userData || {};
        if (u.lLeg && u.rLeg) { u.lLeg.rotation.x = 0; u.rLeg.rotation.x = 0; }
        if (u.lArm && u.rArm) { u.lArm.rotation.x = 0; u.rArm.rotation.x = 0; }
      }
    } else {
      // 랜덤 가변 보행 속도(갑자기 신나서 빠르게 걷기·뛰기 포함!)
      ms.speedTimer = (ms.speedTimer || 0) - dt;
      if (ms.speedTimer <= 0) {
        const roll = Math.random();
        if (roll < 0.34) {
          ms.targetSpeed = 5.9 + Math.random() * 1.3; // 갑작스런 빠른 걸음/달리기!
          ms.speedTimer = 1.6 + Math.random() * 1.1;
          if (!ms.isSprinting) {
            ms.isSprinting = true;
            if (ms.label) ms.label.innerHTML = '⚡🏃‍♀️ 수가성 여인이 갑자기 빠르게 달려가요!';
            showToast('⚡ 수가성 여인이 기쁜 소식을 전하러 갑자기 빠르게 걸어가요! 놓치지 마세요!');
          }
        } else if (roll < 0.74) {
          ms.targetSpeed = 4.1 + Math.random() * 0.9;
          ms.speedTimer = 2.0 + Math.random() * 1.3;
          ms.isSprinting = false;
          if (ms.label) ms.label.innerHTML = '🏃‍♀️ 수가성 여인 (15m 안에 따라오세요!)';
        } else {
          ms.targetSpeed = 2.8 + Math.random() * 0.7;
          ms.speedTimer = 1.7 + Math.random() * 1.1;
          ms.isSprinting = false;
          if (ms.label) ms.label.innerHTML = '🏃‍♀️ 수가성 여인 (15m 안에 따라오세요!)';
        }
      }
      ms.speed = THREE.MathUtils.lerp(ms.speed || 4.1, ms.targetSpeed || 4.1, Math.min(1, dt * 4.5));

      const dTarget = Math.hypot(curRec.x - wm.position.x, curRec.z - wm.position.z);
      if (dTarget < 2.2) {
        curRec.told = true;
        if (curRec.ring && curRec.ring.material) curRec.ring.material.color.setHex(0x10b981);
        if (curRec.label) curRec.label.style.opacity = '0';
        fe.deliveredCount = (fe.deliveredCount || 0) + 1;
        ms.targetIdx++;
        ms.pauseTimer = 1.45;
        ms.navPath = null;
        ms.navPathKey = '';
        ms.navPathIdx = 0;
        ms.bestTargetDist = Infinity;
        ms.noProgressTimer = 0;
        ms.recomputeCount = 0;
        playSfx('rescue');
        if (ms.targetIdx >= ms.recipients.length) {
          showToast('🎉 세 명의 마을 주민 모두에게 메시아의 기쁜 소식을 전했어요! 수가성 여인이 우물가로 돌아갑니다!');
          ms.walkHomeOnClear = true;
          finishMiracleFieldEvent(evSpot);
          return;
        } else {
          showToast(`🗣️ ${fe.deliveredCount}번째 주민에게 소식 전달 완료! 다음 주민에게 함께 가요!`);
        }
      } else {
        stepMiracleNpcTowardTarget(ms, curRec.x, curRec.z, dt, now);
      }
    }
  } else if (fe.type === 'chase_sheep' && fe.sheepState) {
    // [잃어버린 어린양] 언덕 아래 어린양 — 가까이(9.5m 이내) 다가가면 놀라 순간 속도 급상승!
    const ss = fe.sheepState;
    const sm = ss.mesh;
    const dxFromPlayer = sm.position.x - playerPos.x;
    const dzFromPlayer = sm.position.z - playerPos.z;
    const dist = Math.hypot(dxFromPlayer, dzFromPlayer);

    updateWorldLabelPos(ss.label, sm.position, dist < 18.0);

    if (dist < 2.35) {
      playSfx('rescue');
      showToast('🐑✨ 잃어버린 어린양을 무사히 품에 안았어요!');
      finishMiracleFieldEvent(evSpot);
      return;
    }

    if (ss.cooldownTimer > 0) ss.cooldownTimer -= dt;
    if (ss.burstTimer > 0) ss.burstTimer -= dt;

    let moveAng = ss.wanderAng;
    let speed = 2.0;

    if (dist < 9.5) {
      // 플레이어가 가까이 오면 순간 속도가 빨라지며 반대 방향(+살짝 지그재그)으로 도망!
      if (ss.burstTimer <= 0 && ss.cooldownTimer <= 0) {
        ss.burstTimer = 1.35;
        ss.cooldownTimer = 2.35;
        playSfx('jump');
        showToast('🐑⚡ 어린양이 놀라서 빠르게 도망쳐요! 끝까지 쫓아가 잡아보세요!');
      }
      const fleeBase = Math.atan2(dxFromPlayer, dzFromPlayer);
      moveAng = fleeBase + Math.sin(tSec * 2.8) * 0.42;
      speed = (ss.burstTimer > 0) ? 7.35 : 4.15;
    } else {
      ss.wanderTimer -= dt;
      if (ss.wanderTimer <= 0) {
        ss.wanderTimer = 1.6 + Math.random() * 1.5;
        ss.wanderAng = Math.random() * Math.PI * 2;
      }
    }

    // 언덕 아래 광야 안전 구역(건물·바다·산 제외) 내에서 이동 시도, 막히면 측면 회피
    let moved = false;
    const tryAngles = [moveAng, moveAng + 0.75, moveAng - 0.75, moveAng + 1.5, moveAng - 1.5, moveAng + Math.PI];
    for (let k = 0; k < tryAngles.length; k++) {
      const a = tryAngles[k];
      const nx = sm.position.x + Math.sin(a) * speed * dt;
      const nz = sm.position.z + Math.cos(a) * speed * dt;
      const ny = getMiracleOpenWorldGroundHeight(nx, nz);
      if (nx > -64 && nx < 36 && nz > -35 && nz < 52 && ny < 3.6 && isPointOutsideAllBuildings(nx, nz, 1.25)) {
        const hopY = (ss.burstTimer > 0) ? Math.abs(Math.sin(now * 0.024)) * 0.34 : 0;
        sm.position.set(nx, ny + hopY, nz);
        ss.heading = lerpAngle(ss.heading, a, dt * 10.0);
        sm.rotation.y = ss.heading;
        moved = true;
        break;
      }
    }
    if (!moved) ss.wanderAng += 1.4;

    const u = ss.animal && ss.animal.userData ? ss.animal.userData : {};
    const sw = Math.sin(now * (ss.burstTimer > 0 ? 0.026 : 0.012)) * 0.65;
    if (u.flLeg && u.frLeg && u.blLeg && u.brLeg) {
      u.flLeg.rotation.x = sw; u.brLeg.rotation.x = sw;
      u.frLeg.rotation.x = -sw; u.blLeg.rotation.x = -sw;
    }
  } else if (fe.type === 'find_observe') {
    // [부활 이후 도마 미션] 사도 도마가 플레이어를 따라 이동 (히스테리시스로 떨림 방지 + damp 대기/보행 보간 + 플랫폼 접지)
    if (fe.thomasFollower && fe.thomasFollower.mesh && !fe.cutsceneActive) {
      const tf = fe.thomasFollower;
      const tm = tf.mesh;
      tm.visible = true;
      const distToPlayer = Math.hypot(playerPos.x - tm.position.x, playerPos.z - tm.position.z);
      if (!tf.isFollowing && distToPlayer > 2.55) tf.isFollowing = true;
      if (tf.isFollowing && distToPlayer < 1.85) tf.isFollowing = false;

      if (tf.isFollowing) {
        tf.speed = distToPlayer > 7.0 ? 8.2 : 6.4;
        stepMiracleNpcTowardTarget(tf, playerPos.x, playerPos.z, dt, now);
      } else {
        const ny = (typeof window.getMiracleNpcSupportY === 'function')
          ? window.getMiracleNpcSupportY(tm.position.x, tm.position.z, tm.position.y, 1.35)
          : getMiracleOpenWorldGroundHeight(tm.position.x, tm.position.z);
        const safeDt = Math.min(0.06, Math.max(0.001, dt || 0.016));
        tm.position.y = (Math.abs(ny - tm.position.y) > 2.2) ? ny : THREE.MathUtils.damp(tm.position.y, ny, 16, safeDt);
        const faceAng = Math.atan2(playerPos.x - tm.position.x, playerPos.z - tm.position.z);
        tf.curHeading = lerpAngle(tf.curHeading || 0, faceAng, Math.min(1, safeDt * 8.0));
        tm.rotation.y = tf.curHeading;
        if (typeof window.applyMiracleNpcLimbAnimation === 'function') {
          window.applyMiracleNpcLimbAnimation(tm, { speed: 0, isMoving: false }, dt);
        }
      }
    }

    if (fe.targetZone) {
      const tz = fe.targetZone;
      const distPerch = Math.hypot(playerPos.x - tz.pos.x, playerPos.z - tz.pos.z);
      const distTree = (evSpot.zacchaeusGrove && tz.treePos)
        ? Math.hypot(playerPos.x - tz.treePos.x, playerPos.z - tz.treePos.z)
        : distPerch;
      const horizD = Math.min(distPerch, distTree);
      updateWorldLabelPos(tz.label, tz.pos, horizD < (evSpot.zacchaeusGrove ? 5.6 : MIRACLE_TAG_DIST_SPOT));

      const triggerDist = (evSpot.widowCutscene || evSpot.zacchaeusGrove) ? 4.2 : 3.7;
      if (horizD < triggerDist) {
        if (evSpot.widowCutscene && !fe.cutsceneActive) {
          // 두 렙돈 넣은 과부 전용 컷신 시작!
          fe.cutsceneActive = true;
          fe.cutsceneCameraActive = true;
          fe.cutsceneType = 'widow_mites';
          fe.cutsceneTimer = 0;

          const makeCoin = (idx) => {
            const cMesh = createLowPolyMesh(new THREE.CylinderGeometry(0.11, 0.11, 0.032, 10), '#d97706', 0, -10, 0, false);
            cMesh.visible = false;
            worldGroup.add(cMesh);
            miracleWorldMissionObjects.push({ mesh: cMesh });
            return { mesh: cMesh, idx, clinked: false };
          };
          const glowHalo = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.32, 0),
            new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.85 })
          );
          glowHalo.visible = false;
          glowHalo.position.copy(tz.boxSlotWorldPos);
          worldGroup.add(glowHalo);
          miracleWorldMissionObjects.push({ mesh: glowHalo });

          fe.cutsceneProps = { coin1: makeCoin(1), coin2: makeCoin(2), glowHalo };
          showToast('👀 가난한 과부가 성전 헌금함 앞에 조용히 다가섰어요...');
          syncMiracleMissionStatusPanel();
          return;
        }

        if (evSpot.thomasCutscene && !fe.cutsceneActive) {
          // 부활하신 예수님과 도마 — 양손 못자국 확인 컷신 시작!
          // (컷신 중 중복 표시 방지: 따라온 도마를 예수님 앞 위치에 대기시키고 임시 숨김, 컷신 종료 후 여기서 걸어 귀가!)
          if (fe.thomasFollower && fe.thomasFollower.mesh) {
            const tm = fe.thomasFollower.mesh;
            const tx0 = tz.mesh.position.x;
            const tz0 = tz.mesh.position.z + 1.35;
            tm.position.set(tx0, getMiracleOpenWorldGroundHeight(tx0, tz0), tz0);
            tm.visible = false;
          }
          fe.cutsceneActive = true;
          fe.cutsceneCameraActive = true;
          fe.cutsceneType = 'thomas_wounds';
          fe.cutsceneTimer = 0;
          fe.cutsceneProps = { step1Shown: false, step2Shown: false, step3Shown: false };
          playSfx('switch');
          syncMiracleMissionStatusPanel();
          return;
        }

        if (evSpot.zacchaeusGrove) {
          if (!fe.cutsceneActive) {
            startZacchaeusStoryCutscene(fe);
          }
          return;
        }

        finishMiracleFieldEvent(evSpot);
        return;
      }
    }
  } else if (fe.type === 'breakfast_fish_cook' && fe.breakfastState) {
    // =========================================================================
    // [부활 이후 갈릴리 바닷가 아침식사] 낚시 & 모닥불 굽기 실시간 루프
    // =========================================================================
    const bs = fe.breakfastState;
    const cf = bs.campfire;

    // 1) 타오르는 모닥불 5겹 불꽃 + 피어오르는 불똥 스파크 + 연기/김 애니메이션
    if (cf && cf.userData) {
      if (Array.isArray(cf.userData.flames)) {
        cf.userData.flames.forEach((fl, idx) => {
          const flick = 0.84 + Math.sin(tSec * (8.5 + idx * 2.1) + fl.phase) * 0.20;
          fl.mesh.scale.set(0.92 + Math.cos(tSec * 7 + fl.phase) * 0.11, flick, 0.92 + Math.sin(tSec * 6 + fl.phase) * 0.11);
          fl.mesh.position.y = fl.baseY + (flick - 1) * 0.13;
        });
      }
      if (Array.isArray(cf.userData.sparks)) {
        cf.userData.sparks.forEach((sp, idx) => {
          const cyc = (tSec * 0.72 + sp.phase) % 1.0;
          const a = sp.angle + tSec * 1.4;
          sp.mesh.position.set(
            Math.cos(a) * sp.rad * (1 + cyc * 0.9),
            0.35 + cyc * 1.85,
            Math.sin(a) * sp.rad * (1 + cyc * 0.9)
          );
          const sc = Math.max(0.1, (1 - cyc) * 1.15);
          sp.mesh.scale.set(sc, sc, sc);
          sp.mat.opacity = Math.max(0.05, (1 - cyc) * 0.92);
        });
      }
      if (Array.isArray(cf.userData.smokePuffs)) {
        const showSmoke = (bs.phase === 'roasting');
        const isHot = (bs.roastElapsed >= bs.roastBurnTime - 1.5);
        cf.userData.smokePuffs.forEach((sp, idx) => {
          sp.mesh.visible = showSmoke;
          if (!showSmoke) return;
          const cyc = (tSec * 0.95 + sp.phase) % 1.0;
          sp.mesh.position.set(
            Math.sin(tSec * 2.2 + idx) * 0.28,
            1.32 + cyc * 1.45,
            Math.cos(tSec * 1.8 + idx) * 0.22
          );
          const sc = 0.55 + cyc * 1.15;
          sp.mesh.scale.set(sc, sc, sc);
          sp.mat.color.setHex(isHot ? 0x374151 : 0xf8fafc);
          sp.mat.opacity = Math.max(0.05, (1.0 - cyc) * (isHot ? 0.78 : 0.45));
        });
      }
    }

    // 2) [정밀 연결] 대나무 낚싯대 실제 끝점(rodTipNode) 월드 좌표 ↔ 찌 상단 고리까지 끊김 없이 100% 연결!
    const getLiveRodTipWorldPos = () => {
      if (typeof playerGroup !== 'undefined' && playerGroup && typeof playerGroup.updateMatrixWorld === 'function') {
        playerGroup.updateMatrixWorld(true);
      }
      const tipV = new THREE.Vector3(bs.standPos.x - 2.35, bs.standPos.y + 3.65, bs.standPos.z);
      if (bs.rodTipNode && typeof bs.rodTipNode.getWorldPosition === 'function') {
        bs.rodTipNode.getWorldPosition(tipV);
      }
      bs.lastTipWorldPos = tipV.clone();
      return tipV;
    };

    const syncFishingLine = (bobX, bobY, bobZ) => {
      if (!bs.lineMesh) return;
      const tipV = getLiveRodTipWorldPos();
      const targetY = bobY + 0.14;
      const dx = bobX - tipV.x, dy = targetY - tipV.y, dz = bobZ - tipV.z;
      const len = Math.max(0.15, Math.hypot(dx, dy, dz));
      bs.lineMesh.visible = true;
      bs.lineMesh.position.set((tipV.x + bobX) * 0.5, (tipV.y + targetY) * 0.5, (tipV.z + bobZ) * 0.5);
      bs.lineMesh.scale.set(1, len, 1);
      if (typeof bs.lineMesh.quaternion !== 'undefined' && typeof bs.lineMesh.quaternion.setFromUnitVectors === 'function') {
        const dirV = new THREE.Vector3(dx / len, dy / len, dz / len);
        bs.lineMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dirV);
      }
    };

    const isFishingPhase = (
      bs.phase === 'cast_ready' || bs.phase === 'charging' || bs.phase === 'casting' ||
      bs.phase === 'waiting_bite' || bs.phase === 'bite_timing' || bs.phase === 'fish_caught'
    );
    window.__ep4SkipArmAnimThisFrame = true;

    const setBreakfastArmsPose = (rArmX, lArmX = -0.40, rElbowX = -0.25, lElbowX = -0.20) => {
      if (!playerLimbs) return;
      if (playerLimbs.rArm) {
        playerLimbs.rArm.rotation.x = rArmX;
        playerLimbs.rArm.rotation.z = 0;
      }
      if (playerLimbs.lArm) {
        playerLimbs.lArm.rotation.x = lArmX;
        playerLimbs.lArm.rotation.z = 0;
      }
      if (playerLimbs.rElbow) playerLimbs.rElbow.rotation.x = rElbowX;
      if (playerLimbs.lElbow) playerLimbs.lElbow.rotation.x = lElbowX;
    };

    const aspect = window.innerWidth / Math.max(1, window.innerHeight);
    const isLandscape = aspect >= 1.15;

    if (isFishingPhase) {
      // 바닷가 낚시 시네마틱 카메라 (가로모드에서도 플레이어·낚싯대 스윙·찌·뛰어오르는 물고기가 하단 UI 위로 온전히 보이도록 프레이밍)
      const camTargetPos = isLandscape
        ? new THREE.Vector3(bs.standPos.x + 6.4, bs.standPos.y + 4.8, bs.standPos.z + 8.6)
        : new THREE.Vector3(bs.standPos.x + 6.8, bs.standPos.y + 5.6, bs.standPos.z + 7.2);
      const lookX = (bs.phase === 'waiting_bite' || bs.phase === 'bite_timing')
        ? (isLandscape ? (bs.standPos.x - Math.min(7.8, bs.castDist * 0.42)) : (bs.standPos.x + bs.castTargetX) * 0.5)
        : (isLandscape ? (bs.standPos.x - 3.2) : (bs.standPos.x - 6.0));
      const lookY = isLandscape
        ? ((bs.phase === 'waiting_bite' || bs.phase === 'bite_timing') ? (bs.standPos.y + 0.95) : (bs.standPos.y + 1.30))
        : (bs.standPos.y + 0.6);
      camera.position.lerp(camTargetPos, Math.min(1, dt * 4.5));
      camera.lookAt(lookX, lookY, bs.standPos.z);

      if (bs.phase === 'cast_ready') {
        setBreakfastArmsPose(-0.88 + Math.sin(tSec * 2.2) * 0.03, -0.46, -0.22, -0.18);
        // 대기 중에도 낚싯대 끝에서 낚시줄과 찌가 아래로 자연스럽게 드리워져 연결 유지!
        const tipV = getLiveRodTipWorldPos();
        const hangX = tipV.x - 0.15;
        const hangY = Math.max(-0.22, tipV.y - 1.55 + Math.sin(tSec * 2.5) * 0.05);
        const hangZ = tipV.z + Math.cos(tSec * 2.0) * 0.06;
        if (bs.bobberGrp) {
          bs.bobberGrp.visible = true;
          bs.bobberGrp.position.set(hangX, hangY, hangZ);
        }
        syncFishingLine(hangX, hangY, hangZ);
      } else if (bs.phase === 'charging') {
        bs.power += bs.powerDir * dt * 1.15;
        if (bs.power >= 1.0) { bs.power = 1.0; bs.powerDir = -1; }
        else if (bs.power <= 0.05) { bs.power = 0.05; bs.powerDir = 1; }
        // 힘을 모을수록 장대를 뒤로 크게 젖히는 준비 자세
        setBreakfastArmsPose(-0.88 - bs.power * 1.18, -0.50 - bs.power * 0.38, -0.35 - bs.power * 0.25, -0.22);
        const tipV = getLiveRodTipWorldPos();
        const hangX = tipV.x + 0.25 * bs.power;
        const hangY = Math.max(-0.15, tipV.y - 1.25);
        if (bs.bobberGrp) {
          bs.bobberGrp.visible = true;
          bs.bobberGrp.position.set(hangX, hangY, tipV.z);
        }
        syncFishingLine(hangX, hangY, tipV.z);
      } else if (bs.phase === 'casting') {
        bs.castAnimTimer += dt;
        const u = Math.min(1, bs.castAnimTimer / 0.55);
        const easeU = 1 - Math.pow(1 - u, 3);
        setBreakfastArmsPose(
          THREE.MathUtils.lerp(-2.02, -0.45, easeU),
          THREE.MathUtils.lerp(-0.85, -0.35, easeU),
          THREE.MathUtils.lerp(-0.55, -0.15, easeU),
          -0.18
        );
        const tipV = getLiveRodTipWorldPos();
        const bx = THREE.MathUtils.lerp(tipV.x, bs.castTargetX, u);
        const bz = THREE.MathUtils.lerp(tipV.z, bs.castTargetZ, u);
        const by = THREE.MathUtils.lerp(tipV.y, -0.34, u) + Math.sin(u * Math.PI) * (1.8 + bs.power * 2.2);
        if (bs.bobberGrp) {
          bs.bobberGrp.visible = true;
          bs.bobberGrp.position.set(bx, by, bz);
        }
        syncFishingLine(bx, by, bz);
        if (u >= 1) {
          bs.phase = 'waiting_bite';
          playSfx('step');
          syncMiracleBreakfastUI();
        }
      } else if (bs.phase === 'waiting_bite') {
        setBreakfastArmsPose(-0.78 + Math.sin(tSec * 2.1) * 0.04, -0.42, -0.24, -0.18);
        bs.biteWaitTimer -= dt;
        const bobY = -0.34 + Math.sin(tSec * 3.8) * 0.06;
        if (bs.bobberGrp) {
          bs.bobberGrp.visible = true;
          bs.bobberGrp.position.set(bs.castTargetX, bobY, bs.castTargetZ);
        }
        if (bs.bobRipple) {
          const rs = 0.9 + ((tSec * 0.8) % 1.0) * 1.4;
          bs.bobRipple.scale.set(rs, rs, 1);
        }
        syncFishingLine(bs.castTargetX, bobY, bs.castTargetZ);

        if (bs.biteWaitTimer <= 0) {
          // 입질 발생! 매번 랜덤 속도 & 랜덤 초록 구간 생성!
          const modeKey = (typeof currentMode !== 'undefined') ? currentMode : 'junior';
          bs.zoneWidth = (modeKey === 'kinder') ? 28 : (modeKey === 'junior' ? 24 : 20);
          bs.zoneLeft = 10 + Math.random() * (80 - bs.zoneWidth);
          const minSpd = (modeKey === 'kinder') ? 55 : (modeKey === 'junior' ? 72 : 90);
          const maxSpd = (modeKey === 'kinder') ? 88 : (modeKey === 'junior' ? 116 : 150);
          bs.needleSpeed = minSpd + Math.random() * (maxSpd - minSpd);
          bs.needlePos = Math.random() < 0.5 ? 4 : 96;
          bs.needleDir = bs.needlePos < 50 ? 1 : -1;
          bs.biteTimeout = 7.5;
          bs.phase = 'bite_timing';
          playSfx('clock');
          showToast('❗ 입질이 왔어요!! 초록 구간에 바늘이 올 때 당기세요!');
          syncMiracleBreakfastUI();
        }
      } else if (bs.phase === 'bite_timing') {
        setBreakfastArmsPose(-0.86 + Math.sin(tSec * 24.0) * 0.16, -0.52 + Math.cos(tSec * 20.0) * 0.08, -0.30, -0.22);
        bs.biteTimeout -= dt;
        bs.needlePos += bs.needleDir * bs.needleSpeed * dt;
        if (bs.needlePos >= 98) { bs.needlePos = 98; bs.needleDir = -1; }
        else if (bs.needlePos <= 2) { bs.needlePos = 2; bs.needleDir = 1; }

        // 입질 중 찌가 물속으로 격렬하게 흔들림
        const plungeY = -0.48 + Math.sin(tSec * 22.0) * 0.14;
        if (bs.bobberGrp) bs.bobberGrp.position.set(bs.castTargetX, plungeY, bs.castTargetZ);
        if (bs.bobRipple) {
          const rs = 1.2 + Math.abs(Math.sin(tSec * 8)) * 1.5;
          bs.bobRipple.scale.set(rs, rs, 1);
        }
        syncFishingLine(bs.castTargetX, plungeY, bs.castTargetZ);

        if (bs.biteTimeout <= 0) {
          playSfx('wrong');
          bs.phase = 'cast_ready';
          bs.power = 0;
          if (bs.bobberGrp) bs.bobberGrp.visible = false;
          if (bs.lineMesh) bs.lineMesh.visible = false;
          showToast('💨 물고기가 미끼만 먹고 도망쳤어요! 다시 낚시줄을 던져 보세요!');
        }
      } else if (bs.phase === 'fish_caught') {
        bs.catchAnimTimer += dt;
        const u = Math.min(1, bs.catchAnimTimer / 1.05);
        const liftU = Math.min(1, u * 2.2);
        setBreakfastArmsPose(
          THREE.MathUtils.lerp(-0.86, -1.92, liftU),
          THREE.MathUtils.lerp(-0.52, -1.10, liftU),
          -0.36, -0.25
        );
        if (bs.leapFish) {
          const fx = THREE.MathUtils.lerp(bs.castTargetX, bs.standPos.x, u);
          const fz = THREE.MathUtils.lerp(bs.castTargetZ, bs.standPos.z, u);
          const fy = THREE.MathUtils.lerp(-0.2, bs.standPos.y + 1.2, u) + Math.sin(u * Math.PI) * 3.4;
          bs.leapFish.position.set(fx, fy, fz);
          bs.leapFish.rotation.z = Math.sin(tSec * 16) * 0.4;
          bs.leapFish.rotation.y += dt * 5;
        }
        if (u >= 1) {
          if (bs.leapFish) bs.leapFish.visible = false;
          if (bs.caughtCount >= bs.reqFish) {
            // 낚시 목표 달성 → 예수님과 모닥불 옆에 나란히 착석!
            bs.phase = 'cook_ready';
            if (bs.rodMesh) bs.rodMesh.visible = false;
            const seatWorldX = bs.firePos.x - 1.55;
            const seatWorldZ = bs.firePos.z + 0.75;
            playerPos.set(seatWorldX, bs.firePos.y + 0.16, seatWorldZ);
            playerFacing = Math.atan2(bs.firePos.x - seatWorldX, bs.firePos.z - seatWorldZ);
            if (typeof playerGroup !== 'undefined' && playerGroup) {
              playerGroup.position.copy(playerPos);
              playerGroup.rotation.y = playerFacing;
            }
            if (playerLimbs) {
              if (playerLimbs.lLeg) playerLimbs.lLeg.rotation.x = -1.20;
              if (playerLimbs.rLeg) playerLimbs.rLeg.rotation.x = -1.20;
            }
            setBreakfastArmsPose(-0.35, -0.20, -0.25, -0.20);
            playSfx('rescue');
          } else {
            bs.phase = 'cast_ready';
            bs.power = 0;
            setBreakfastArmsPose(-0.88, -0.46, -0.22, -0.18);
          }
        }
      }
    } else {
      // 3) 모닥불 굽기 & 예수님과 아침식사 시네마틱 카메라
      const camFirePos = isLandscape
        ? new THREE.Vector3(bs.firePos.x + 0.2, bs.firePos.y + 3.1, bs.firePos.z + 6.4)
        : new THREE.Vector3(bs.firePos.x + 0.2, bs.firePos.y + 3.4, bs.firePos.z + 5.8);
      camera.position.lerp(camFirePos, Math.min(1, dt * 4.2));
      camera.lookAt(bs.firePos.x, bs.firePos.y + (isLandscape ? 1.05 : 0.95), bs.firePos.z + 0.25);
      setBreakfastArmsPose(-0.35, -0.22, -0.24, -0.18);

      if (bs.phase === 'roasting') {
        bs.roastElapsed += dt;
        // 굽는 물고기 색상 실시간 변화: 생선 은청색 → 황금 노릇(3.5~7.5s) → 새까맣게 탐(7.5s+)
        if (cf && cf.userData && cf.userData.roastFishMat && cf.userData.roastFishGrp) {
          cf.userData.roastFishGrp.rotation.x = Math.sin(tSec * 2.5) * 0.22;
          const colRaw = new THREE.Color('#93c5fd');
          const colGold = new THREE.Color('#d97706');
          const colDark = new THREE.Color('#78350f');
          const colBurnt = new THREE.Color('#1c1917');
          if (bs.roastElapsed < bs.roastCookMin) {
            const p = bs.roastElapsed / bs.roastCookMin;
            cf.userData.roastFishMat.color.copy(colRaw).lerp(colGold, p);
          } else if (bs.roastElapsed < bs.roastBurnTime - 1.2) {
            const p = (bs.roastElapsed - bs.roastCookMin) / Math.max(0.5, bs.roastBurnTime - 1.2 - bs.roastCookMin);
            cf.userData.roastFishMat.color.copy(colGold).lerp(colDark, p * 0.65);
          } else {
            const p = Math.min(1, (bs.roastElapsed - (bs.roastBurnTime - 1.2)) / 1.2);
            cf.userData.roastFishMat.color.copy(colDark).lerp(colBurnt, p);
          }
        }

        // 제한 시간(7.5초) 초과 → 물고기가 까맣게 타서 못 먹게 되어 미션 실패!
        if (bs.roastElapsed >= bs.roastBurnTime) {
          playSfx('wrong');
          clearMiracleFieldEventObjects();
          evSpot._requireLeaveZone = true;
          evSpot._prompted = performance.now();
          openMiracleDialog({
            sourceRef: evSpot,
            speaker: '바닷가의 예수님',
            category: 'story',
            text: '"앗! 숯불 위에 너무 오래 두어서 물고기가 새까맣게 타버렸구나! 아쉽지만 타버린 물고기는 먹을 수 없으니 다시 바닷가에서 잡아 정성껏 구워 볼까?"',
            btnText: '닫기',
            replayText: '🔄 다시 낚시·굽기 도전하기!',
            onReplay: () => startMiracleFieldEvent(evSpot)
          });
          return;
        }
      } else if (bs.phase === 'eating') {
        bs.eatTimer += dt;
        // 예수님과 플레이어가 함께 맛있게 먹으며 고개를 끄덕이는 따뜻한 모션
        setBreakfastArmsPose(-0.75 + Math.sin(tSec * 7.5) * 0.35, -0.30, -0.45 + Math.sin(tSec * 7.5) * 0.15, -0.20);
        if (bs.jesusByFire && bs.jesusByFire.userData && bs.jesusByFire.userData.rArm) {
          bs.jesusByFire.userData.rArm.rotation.x = -0.70 + Math.cos(tSec * 6.5) * 0.30;
        }
        if (bs.eatTimer >= 2.35) {
          const burntX = bs.firePos.x;
          const burntZ = bs.firePos.z;
          // 미션 완료 후 불꺼진 모닥불(숯이 된 나무·재)을 오픈월드에 영구 배치!
          spawnPersistentBurntCampfire(burntX, burntZ, true);
          finishMiracleFieldEvent(evSpot);
          showToast('🔥 식사를 마친 모닥불 자리에 불꺼진 숯 나무와 재가 남았어요!');
          return;
        }
      }
    }

    syncMiracleBreakfastUI();
  }

  syncMiracleMissionStatusPanel();
}

// -------------------------------------------------------------------------
// 8. 사람·동물 자연스러운 2D 보행 AI 헬퍼
// -------------------------------------------------------------------------
function updateMiracleActorWalkAI(actor, dt, now, stopNearPlayerDist = 3.2) {
  const m = actor.mesh;
  if (!m) return;
  const u = m.userData || {};
  const curX = m.position.x;
  const curZ = m.position.z;
  const dToPlayer = Math.hypot(playerPos.x - curX, playerPos.z - curZ);

  const nf = (window.MiracleDayNight) ? window.MiracleDayNight.nightFactor : 0;
  const lampLit = Boolean(actor.oilLamp && nf > 0.15);
  if (actor.oilLamp) {
    actor.oilLamp.group.visible = lampLit;
    if (lampLit) actor.oilLamp.setLit(true, now, actor.phase || 0);
  }

  if (dToPlayer < stopNearPlayerDist) {
    const facePlayerAng = Math.atan2(playerPos.x - curX, playerPos.z - curZ);
    actor.heading = lerpAngle(actor.heading || 0, facePlayerAng, dt * 8.0);
    m.rotation.y = actor.heading;
    if (typeof window.applyMiracleNpcLimbAnimation === 'function') {
      window.applyMiracleNpcLimbAnimation(m, {
        speed: 0, isMoving: false, rArmX: lampLit ? -0.76 : undefined
      }, dt);
    }
    return;
  }

  if (actor.waitTimer > 0) {
    actor.waitTimer -= dt;
    if (typeof window.applyMiracleNpcLimbAnimation === 'function') {
      window.applyMiracleNpcLimbAnimation(m, {
        speed: 0, isMoving: false, rArmX: lampLit ? -0.76 : undefined
      }, dt);
    }
    if (u.headGroup) u.headGroup.rotation.y = Math.sin(now * 0.003 + actor.phase) * 0.25;
    return;
  }

  const dx = actor.targetX - curX;
  const dz = actor.targetZ - curZ;
  const dist = Math.hypot(dx, dz);

  const pickNewTarget = (shortWait = false) => {
    const ang = Math.random() * Math.PI * 2;
    const r = (0.35 + Math.random() * 0.65) * (actor.radius || 7.0);
    actor.targetX = actor.homeX + Math.cos(ang) * r;
    actor.targetZ = actor.homeZ + Math.sin(ang) * r;
    actor.waitTimer = shortWait ? 0.15 : (0.7 + Math.random() * 1.4);
  };

  if (dist < 0.45) {
    pickNewTarget(false);
    return;
  }

  const step = Math.min(dist, (actor.speed || 1.8) * dt);
  const nx = curX + (dx / dist) * step;
  const nz = curZ + (dz / dist) * step;
  const ny = getMiracleOpenWorldGroundHeight(nx, nz);

  if (ny < -0.25 || nx > 103 || nz < -103 || nz > 103 || !isSpawnSpotClear(nx, nz, 0.55) || (actor.isPackDonkey && !isMiracleNpcPointClear(nx, nz, 0.55))) {
    pickNewTarget(true);
    return;
  }

  m.position.set(nx, ny, nz);
  const desiredAng = Math.atan2(dx, dz);
  actor.heading = lerpAngle(actor.heading || desiredAng, desiredAng, dt * 8.5);
  m.rotation.y = actor.heading;

  const actualSpd = Math.hypot(nx - curX, nz - curZ) / Math.max(0.001, dt);
  if (typeof window.applyMiracleNpcLimbAnimation === 'function') {
    window.applyMiracleNpcLimbAnimation(m, {
      speed: actualSpd,
      isMoving: actualSpd > 0.12,
      strideFactor: 1.65,
      rArmX: lampLit ? (-0.76 + Math.sin(now * 0.012 + (actor.phase || 0)) * 0.08) : undefined
    }, dt);
  }
}

// -------------------------------------------------------------------------
// 8-5. [낮/밤 환경 소품·로마 군인 야간 순찰·스텔스 발각 리셋 시스템]
// -------------------------------------------------------------------------
window.miracleNightFireProps = window.miracleNightFireProps || [];
window.miracleNightPatrolSoldiers = window.miracleNightPatrolSoldiers || [];

function findSafeOpenWorldOutdoorPoint(tx, tz, pad = 1.25) {
  const clampX = Math.max(-88, Math.min(96, tx));
  const clampZ = Math.max(-96, Math.min(96, tz));
  if (typeof isMiracleNpcPointClear === 'function' && isMiracleNpcPointClear(clampX, clampZ, pad)) {
    return { x: clampX, z: clampZ };
  }
  for (let r = 1.5; r <= 12.0; r += 1.5) {
    for (let a = 0; a < 12; a++) {
      const ang = (a / 12) * Math.PI * 2;
      const nx = Math.max(-88, Math.min(96, clampX + Math.cos(ang) * r));
      const nz = Math.max(-96, Math.min(96, clampZ + Math.sin(ang) * r));
      if (typeof isMiracleNpcPointClear === 'function' && isMiracleNpcPointClear(nx, nz, pad)) {
        return { x: nx, z: nz };
      }
    }
  }
  return { x: clampX, z: clampZ };
}
window.findSafeOpenWorldOutdoorPoint = findSafeOpenWorldOutdoorPoint;

function createTempleBowlFlameProp(scale = 0.82) {
  const grp = new THREE.Group();
  const outerMat = new THREE.MeshBasicMaterial({ color: 0xea580c, transparent: true, opacity: 0.92, fog: false });
  const coreMat = new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.98, fog: false });
  const f1 = new THREE.Mesh(new THREE.ConeGeometry(0.24 * scale, 0.58 * scale, 5), outerMat);
  f1.position.y = 0.28 * scale;
  const f2 = new THREE.Mesh(new THREE.ConeGeometry(0.14 * scale, 0.38 * scale, 5), coreMat);
  f2.position.y = 0.22 * scale;
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0xff9a3c,
    transparent: true,
    opacity: 0.26,
    depthWrite: false,
    fog: false,
    blending: THREE.AdditiveBlending
  });
  const glow = new THREE.Mesh(new THREE.DodecahedronGeometry(0.75 * scale, 0), glowMat);
  glow.position.y = 0.22 * scale;
  grp.add(f1, f2, glow);
  grp.visible = false;
  return {
    group: grp,
    setLit(lit, now = 0, phase = 0) {
      grp.visible = Boolean(lit);
      if (lit) {
        const t = now * 0.009 + phase;
        f1.scale.set(1, 1 + Math.sin(t) * 0.14, 1);
        f2.scale.set(1, 0.94 + Math.cos(t * 1.7) * 0.16, 1);
        glowMat.opacity = 0.22 + Math.sin(t * 1.3) * 0.06;
      }
    }
  };
}

function buildMiracleNightEnvironmentProps() {
  window.miracleNightFireProps = [];
  const registerFire = (prop, x, y, z, colHex, intensity, distance, phase, yOffset = 1.22) => {
    window.miracleNightFireProps.push({ prop, phase });
    if (prop && prop.group) {
      prop.group.userData = prop.group.userData || {};
      prop.group.userData._isNightFireProp = true;
    }
    if (window.MiracleDayNight && typeof window.MiracleDayNight.registerNightLightSource === 'function') {
      window.MiracleDayNight.registerNightLightSource({
        pos: new THREE.Vector3(x, y, z),
        yOffset,
        color: colHex,
        intensity,
        distance,
        phase,
        isActive: () => Boolean(window.MiracleDayNight && window.MiracleDayNight.nightFactor > 0.12)
      });
    }
  };

  // 1) 예루살렘 성전 외곽 성문·본관 청동 화로 불꽃 4기 + 성전 주변 독립 화롯대 6기 (총 10기)
  const gateY = getMiracleOpenWorldGroundHeight(0, 46);
  const templeY = getMiracleOpenWorldGroundHeight(0, 72);
  const mountedBowls = [
    { x: -2.65, y: gateY + 1.38, z: 44.45 },
    { x:  2.65, y: gateY + 1.38, z: 44.45 },
    { x: -4.10, y: templeY + 1.74, z: 62.80 },
    { x:  4.10, y: templeY + 1.74, z: 62.80 }
  ];
  mountedBowls.forEach((b, idx) => {
    const fl = createTempleBowlFlameProp(0.95);
    fl.group.position.set(b.x, b.y, b.z);
    worldGroup.add(fl.group);
    registerFire(fl, b.x, b.y, b.z, 0xff8c2b, 2.50, 16.5, idx * 1.1, 0.55);
  });

  const standaloneBraziers = [
    [-6.0, 39.5], [6.0, 39.5],
    [-13.5, 45.5], [13.5, 45.5],
    [-12.5, 56.0], [12.5, 56.0]
  ];
  standaloneBraziers.forEach(([bx, bz], idx) => {
    if (typeof window.createTempleBrazierProp !== 'function') return;
    const sp = findSafeOpenWorldOutdoorPoint(bx, bz, 0.75);
    const py = getMiracleOpenWorldGroundHeight(sp.x, sp.z);
    const br = window.createTempleBrazierProp(1.05);
    br.group.position.set(sp.x, py, sp.z);
    worldGroup.add(br.group);
    colliders.push({ minX: sp.x - 0.48, maxX: sp.x + 0.48, minZ: sp.z - 0.48, maxZ: sp.z + 0.48 });
    registerFire(br, sp.x, py, sp.z, 0xff8c2b, 2.75, 17.5, (idx + 4) * 1.15, 1.58);
  });

  // 2) 마을 집 앞마당 모닥불 8기 (낮에는 장작, 밤에만 활활 타오름)
  const villageCampCoords = [
    [-28, 12], [-44, 24], [-18, 22], [28, 18],
    [42, 8], [-36, -12], [24, -22], [-20, 44]
  ];
  villageCampCoords.forEach(([cx, cz], idx) => {
    if (typeof window.createVillageCampfireProp !== 'function') return;
    const sp = findSafeOpenWorldOutdoorPoint(cx, cz, 1.55);
    const py = getMiracleOpenWorldGroundHeight(sp.x, sp.z);
    const cf = window.createVillageCampfireProp(1.02);
    cf.group.position.set(sp.x, py, sp.z);
    worldGroup.add(cf.group);
    colliders.push({ minX: sp.x - 0.58, maxX: sp.x + 0.58, minZ: sp.z - 0.58, maxZ: sp.z + 0.58 });
    registerFire(cf, sp.x, py, sp.z, 0xff7b24, 2.20, 15.0, idx * 1.45, 1.22);
  });
}

function buildMiracleNightPatrolSoldiers() {
  window.miracleNightPatrolSoldiers = [];
  if (typeof window.createRomanSoldierMesh !== 'function') return;

  // 예루살렘 성전 전용 경비 병력 4명 (외곽 성문 앞 1명 + 성전 본관 동·서·남 벽 각 1명)
  const routeSpecs = [
    {
      role: 'temple_gate',
      post: { x: 3.5, z: 37.6 },
      postHeading: Math.PI, // 북쪽(-Z, 성문 밖) 경계
      speed: 3.25,
      waypoints: [
        { x: 9.5, z: 37.6 },
        { x: -7.5, z: 37.6 }
      ]
    },
    {
      role: 'temple_east_wall',
      post: { x: 15.0, z: 71.5 },
      postHeading: Math.PI * 0.5, // 동쪽(+X) 경계
      speed: 3.15,
      waypoints: [
        { x: 15.0, z: 60.0 },
        { x: 15.0, z: 83.0 }
      ]
    },
    {
      role: 'temple_west_wall',
      post: { x: -14.0, z: 71.5 },
      postHeading: -Math.PI * 0.5, // 서쪽(-X) 경계
      speed: 3.15,
      waypoints: [
        { x: -14.0, z: 82.5 },
        { x: -14.0, z: 60.0 }
      ]
    },
    {
      role: 'temple_south_wall',
      post: { x: 0.0, z: 84.2 },
      postHeading: 0, // 남쪽(+Z) 경계
      speed: 3.15,
      waypoints: [
        { x: -11.0, z: 84.2 },
        { x: 11.0, z: 84.2 }
      ]
    }
  ];

  routeSpecs.forEach((spec, idx) => {
    const safePost = findSafeOpenWorldOutdoorPoint(spec.post.x, spec.post.z, 0.90);
    const rawSafeWps = spec.waypoints.map(wp => findSafeOpenWorldOutdoorPoint(wp.x, wp.z, 0.90));

    // 인접 웨이포인트 구간이 건물·벽·소품과 겹치면 A* 우회 경유지를 자동 확장해 경로상 관통 차단
    const safeWps = [];
    for (let i = 0; i < rawSafeWps.length; i++) {
      const a = rawSafeWps[i];
      const b = rawSafeWps[(i + 1) % rawSafeWps.length];
      safeWps.push(a);
      if (
        typeof isMiracleNpcLineClear === 'function' &&
        !isMiracleNpcLineClear(a.x, a.z, b.x, b.z, 0.70) &&
        typeof computeMiracleNpcAStarPath === 'function'
      ) {
        const detour = computeMiracleNpcAStarPath(a.x, a.z, b.x, b.z, 0.72);
        for (let j = 0; j < detour.length - 1; j++) {
          safeWps.push(detour[j]);
        }
      }
    }

    const py = getMiracleOpenWorldGroundHeight(safePost.x, safePost.z);

    const mesh = window.createRomanSoldierMesh(idx);
    mesh.position.set(safePost.x, py, safePost.z);
    mesh.rotation.y = spec.postHeading;

    // 시야 범위 바닥 경고 부채꼴 (+Z 방향 정면 ±0.52 rad) — 니고데모 미션 중에만 표시
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.24,
      side: THREE.DoubleSide,
      depthWrite: false,
      fog: false
    });
    const coneMesh = new THREE.Mesh(
      new THREE.CircleGeometry(9.2, 14, Math.PI * 0.5 - 0.52, 1.04),
      coneMat
    );
    coneMesh.rotation.x = Math.PI * 0.5;
    coneMesh.position.y = 0.08;
    coneMesh.visible = false;
    mesh.add(coneMesh);

    worldGroup.add(mesh);

    if (window.MiracleDayNight && typeof window.MiracleDayNight.registerNightLightSource === 'function') {
      window.MiracleDayNight.registerNightLightSource({
        getPos: () => mesh.position,
        yOffset: 1.55,
        color: 0xff7a1a,
        intensity: 2.35,
        distance: 15.0,
        phase: idx * 1.7,
        isActive: () => Boolean(window.MiracleDayNight && window.MiracleDayNight.nightFactor > 0.15)
      });
    }

    window.miracleNightPatrolSoldiers.push({
      idx,
      role: spec.role,
      mesh,
      coneMesh,
      coneMat,
      postPos: safePost,
      postHeading: spec.postHeading,
      waypoints: safeWps,
      wpIdx: 0,
      speed: spec.speed,
      heading: spec.postHeading,
      pauseTimer: 0,
      navPath: null,
      navPathKey: '',
      navPathIdx: 0,
      bestTargetDist: Infinity,
      noProgressTimer: 0,
      recomputeCount: 0,
      phase: idx * 1.35
    });
  });
}

function stepMiraclePatrolSoldier(s, targetX, targetZ, dt) {
  const m = s && s.mesh;
  if (!m) return { distToTarget: 999, movedSpeed: 0 };

  const safeDt = Math.min(0.06, Math.max(0.001, dt || 0.016));
  const curX = m.position.x;
  const curZ = m.position.z;
  const dTarget = Math.hypot(targetX - curX, targetZ - curZ);
  if (dTarget < 0.05) return { distToTarget: dTarget, movedSpeed: 0 };

  const pathKey = `${Math.round(targetX * 2)},${Math.round(targetZ * 2)}`;
  if (!Array.isArray(s.navPath) || s.navPath.length === 0 || s.navPathKey !== pathKey) {
    s.navPath = (typeof computeMiracleNpcAStarPath === 'function')
      ? computeMiracleNpcAStarPath(curX, curZ, targetX, targetZ, 0.70)
      : [{ x: targetX, z: targetZ }];
    s.navPathKey = pathKey;
    s.navPathIdx = 0;
    s.bestTargetDist = dTarget;
    s.noProgressTimer = 0;
    s.recomputeCount = 0;
  }

  if (typeof s.bestTargetDist !== 'number') s.bestTargetDist = dTarget;
  if (dTarget < s.bestTargetDist - 0.35) {
    s.bestTargetDist = dTarget;
    s.noProgressTimer = 0;
  } else {
    s.noProgressTimer = (s.noProgressTimer || 0) + safeDt;
    if (s.noProgressTimer >= 2.0) {
      s.noProgressTimer = 0;
      s.recomputeCount = (s.recomputeCount || 0) + 1;
      if (s.recomputeCount <= 2 && typeof computeMiracleNpcAStarPath === 'function') {
        s.navPath = computeMiracleNpcAStarPath(curX, curZ, targetX, targetZ, 0.82);
        s.navPathIdx = 0;
      } else if (s.navPath && s.navPathIdx < s.navPath.length - 1) {
        s.navPathIdx++;
      }
      s.bestTargetDist = dTarget;
    }
  }

  while (s.navPathIdx < s.navPath.length - 1) {
    const wp = s.navPath[s.navPathIdx];
    const dWp = Math.hypot(wp.x - curX, wp.z - curZ);
    const nextWp = s.navPath[s.navPathIdx + 1];
    if (
      dWp < 1.15 ||
      (dWp < 2.6 && typeof isMiracleNpcLineClear === 'function' && isMiracleNpcLineClear(curX, curZ, nextWp.x, nextWp.z, 0.70))
    ) {
      s.navPathIdx++;
    } else {
      break;
    }
  }

  const activeWp = s.navPath[Math.min(s.navPathIdx, s.navPath.length - 1)] || { x: targetX, z: targetZ };
  const wpDx = activeWp.x - curX;
  const wpDz = activeWp.z - curZ;
  const dWp = Math.hypot(wpDx, wpDz);
  if (dWp < 0.001) return { distToTarget: dTarget, movedSpeed: 0 };

  const wpAng = Math.atan2(wpDx, wpDz);
  const moveStep = Math.min(dWp, (s.speed || 3.2) * safeDt);
  let chosenAng = wpAng;

  const candX = curX + Math.sin(wpAng) * moveStep;
  const candZ = curZ + Math.cos(wpAng) * moveStep;
  if (typeof isMiracleNpcPointClear === 'function' && !isMiracleNpcPointClear(candX, candZ, 0.62)) {
    let foundSlip = null;
    const slipOffsets = [0.32, -0.32, 0.65, -0.65, 1.0, -1.0];
    for (let i = 0; i < slipOffsets.length; i++) {
      const a = wpAng + slipOffsets[i];
      if (isMiracleNpcPointClear(curX + Math.sin(a) * moveStep, curZ + Math.cos(a) * moveStep, 0.56)) {
        foundSlip = a;
        break;
      }
    }
    if (foundSlip !== null) {
      chosenAng = foundSlip;
    } else {
      if (typeof computeMiracleNpcAStarPath === 'function') {
        s.navPath = computeMiracleNpcAStarPath(curX, curZ, targetX, targetZ, 0.82);
        s.navPathIdx = 0;
      }
      return { distToTarget: dTarget, movedSpeed: 0 };
    }
  }

  const nx = curX + Math.sin(chosenAng) * moveStep;
  const nz = curZ + Math.cos(chosenAng) * moveStep;
  const ny = getMiracleOpenWorldGroundHeight(nx, nz);
  m.position.set(nx, ny, nz);
  s.heading = lerpAngle(s.heading, chosenAng, Math.min(1, safeDt * 8.0));
  m.rotation.y = s.heading;

  return {
    distToTarget: Math.hypot(targetX - nx, targetZ - nz),
    movedSpeed: Math.hypot(nx - curX, nz - curZ) / safeDt
  };
}

function isMiraclePatrolSightBlocked(x1, z1, x2, z2) {
  const bList = Array.isArray(window.miracleBuildingBounds) ? window.miracleBuildingBounds : [];
  if (bList.length === 0) return false;

  const rects = [];
  for (let i = 0; i < bList.length; i++) {
    const b = bList[i];
    if (!b) continue;
    // 외곽 성문(cx=0, cz=46)은 중앙 아치 통로(x ∈ [-2.6, +2.6])를 개방하고 좌·우 벽체만 시야 차폐로 반영
    if (b.cx === 0 && b.cz === 46) {
      rects.push(
        { minX: -11.8, maxX: -2.6, minZ: 42.4, maxZ: 47.8 },
        { minX:   2.6, maxX: 11.8, minZ: 42.4, maxZ: 47.8 }
      );
    } else {
      rects.push({ minX: b.minX, maxX: b.maxX, minZ: b.minZ, maxZ: b.maxZ });
    }
  }
  if (rects.length === 0) return false;

  const dist = Math.hypot(x2 - x1, z2 - z1);
  if (dist < 0.05) return false;
  const steps = Math.max(6, Math.ceil(dist / 0.65));
  for (let s = 1; s < steps; s++) {
    const t = s / steps;
    const px = x1 + (x2 - x1) * t;
    const pz = z1 + (z2 - z1) * t;
    for (let i = 0; i < rects.length; i++) {
      const r = rects[i];
      if (px >= r.minX && px <= r.maxX && pz >= r.minZ && pz <= r.maxZ) return true;
    }
  }
  return false;
}

function showStealthDetectionAlertFlash() {
  let el = document.getElementById('miracle-stealth-alert');
  if (!el) {
    el = document.createElement('div');
    el.id = 'miracle-stealth-alert';
    el.className = 'fixed inset-0 pointer-events-none z-50 flex items-start justify-center pt-20 transition-opacity duration-300';
    el.style.background = 'radial-gradient(circle, rgba(239,68,68,0.08) 25%, rgba(185,28,28,0.48) 100%)';
    el.innerHTML = `<div class="px-5 py-3 rounded-2xl bg-rose-950/92 border-2 border-rose-400 text-rose-100 font-jua text-sm sm:text-base shadow-2xl text-center">🚨 로마 군인 순찰에 발각되었습니다!<br><span class="text-xs text-amber-200">획득한 성경 두루마리를 압수당하고 니고데모 미션이 처음부터 초기화됩니다!</span></div>`;
    document.body.appendChild(el);
  }
  el.style.opacity = '1';
  if (el._hideTimer) clearTimeout(el._hideTimer);
  el._hideTimer = setTimeout(() => {
    el.style.opacity = '0';
  }, 2100);
}

function resetActiveNightMissionOnDetection(evSpot, now) {
  if (!evSpot || evSpot.id !== 'ev_nicodemus') return;

  window._miracleNightDetectGraceUntil = now + 2600;
  playSfx('crumble');
  showStealthDetectionAlertFlash();
  if (typeof showToast === 'function') {
    showToast('🚨 로마 군인에게 발각! 획득한 성경 두루마리를 압수당하고 니고데모 미션이 처음부터 초기화됩니다!');
  }

  // 니고데모 미션 수집 두루마리 압수 및 미션 오브젝트 정리
  clearMiracleFieldEventObjects();

  // 시작 지점(니고데모 NPC 곁 안전한 야외)으로 플레이어 복귀 후 0부터 미션 재시작
  const startPt = findSafeOpenWorldOutdoorPoint(evSpot.x, evSpot.z + 3.2, 1.0);
  const gy = getMiracleOpenWorldGroundHeight(startPt.x, startPt.z);
  playerPos.set(startPt.x, gy, startPt.z);
  lastGroundedY = gy;
  if (typeof playerVelY !== 'undefined') playerVelY = 0;
  if (typeof playerGroup !== 'undefined' && playerGroup) {
    playerGroup.position.copy(playerPos);
  }
  if (typeof snapCameraToPlayer === 'function') snapCameraToPlayer();
  startMiracleFieldEvent(evSpot);
}

function updateMiracleNightPatrolSoldiers(dt, now) {
  const list = window.miracleNightPatrolSoldiers;
  if (!Array.isArray(list) || list.length === 0) return;

  const nf = (window.MiracleDayNight) ? window.MiracleDayNight.nightFactor : 0;
  const isNight = nf > 0.15;

  // 발각 모드 및 빨간 시야 부채꼴은 오직 니고데모 미션(ev_nicodemus) 진행 중에만 적용
  const isNicodemusMissionActive = Boolean(
    miracleActiveFieldEvent &&
    miracleActiveFieldEvent.type === 'nicodemus_stealth' &&
    miracleActiveFieldEvent.spot &&
    miracleActiveFieldEvent.spot.id === 'ev_nicodemus' &&
    !miracleDialogState.active &&
    !miracleActiveFieldEvent.cutsceneActive
  );
  const activeNicodemusEv = isNicodemusMissionActive ? miracleActiveFieldEvent.spot : null;

  for (let i = 0; i < list.length; i++) {
    const s = list[i];
    const m = s.mesh;
    if (!m) continue;
    const u = m.userData || {};

    if (!isNight) {
      // 낮: 담당 초소로 안전하게 복귀해 창을 들고 대기 (횃불 OFF, 경고 콘 OFF)
      if (u.spearGrp) u.spearGrp.visible = true;
      if (u.torchProp) {
        u.torchProp.group.visible = false;
        u.torchProp.setLit(false, now, s.phase);
      }
      if (s.coneMesh) s.coneMesh.visible = false;
      s.pauseTimer = 0;

      const distToPost = Math.hypot(s.postPos.x - m.position.x, s.postPos.z - m.position.z);
      if (distToPost > 0.35) {
        const res = stepMiraclePatrolSoldier(s, s.postPos.x, s.postPos.z, dt);
        if (res.movedSpeed > 0.12) {
          const swing = Math.sin(now * 0.011 + s.phase) * 0.52;
          if (u.lLeg && u.rLeg) { u.lLeg.rotation.x = swing; u.rLeg.rotation.x = -swing; }
          if (u.lArm && u.rArm) { u.lArm.rotation.x = -swing * 0.45; u.rArm.rotation.x = -0.35; }
        } else {
          if (u.lLeg && u.rLeg) { u.lLeg.rotation.x = 0; u.rLeg.rotation.x = 0; }
          if (u.lArm && u.rArm) { u.lArm.rotation.x = 0; u.rArm.rotation.x = -0.35; }
        }
      } else {
        const py = getMiracleOpenWorldGroundHeight(s.postPos.x, s.postPos.z);
        m.position.set(s.postPos.x, py, s.postPos.z);
        s.navPath = null;
        s.navPathKey = '';
        s.heading = lerpAngle(s.heading, s.postHeading || 0, Math.min(1, dt * 6.0));
        m.rotation.y = s.heading;
        if (u.lLeg && u.rLeg) { u.lLeg.rotation.x = 0; u.rLeg.rotation.x = 0; }
        if (u.lArm && u.rArm) { u.lArm.rotation.x = 0; u.rArm.rotation.x = -0.35; }
      }
      continue;
    }

    // 밤: 횃불 순찰 모드
    if (u.spearGrp) u.spearGrp.visible = false;
    if (u.torchProp) {
      u.torchProp.group.visible = true;
      u.torchProp.setLit(true, now, s.phase);
    }
    if (s.coneMesh) {
      s.coneMesh.visible = Boolean(activeNicodemusEv);
      if (activeNicodemusEv && s.coneMat) {
        s.coneMat.opacity = 0.24 + Math.sin(now * 0.008 + s.phase) * 0.05;
      }
    }

    let isWalking = false;
    if (s.pauseTimer > 0) {
      s.pauseTimer -= dt;
    } else {
      const wp = s.waypoints[s.wpIdx % s.waypoints.length];
      const dWp = Math.hypot(wp.x - m.position.x, wp.z - m.position.z);
      if (dWp < 0.65) {
        s.wpIdx = (s.wpIdx + 1) % s.waypoints.length;
        s.navPath = null;
        s.navPathKey = '';
        s.pauseTimer = 0.55;
      } else {
        const res = stepMiraclePatrolSoldier(s, wp.x, wp.z, dt);
        isWalking = res.movedSpeed > 0.12;
      }
    }

    if (isWalking) {
      const swing = Math.sin(now * 0.011 + s.phase) * 0.58;
      if (u.lLeg && u.rLeg) {
        u.lLeg.rotation.x = swing;
        u.rLeg.rotation.x = -swing;
      }
      if (u.lArm && u.rArm) {
        u.lArm.rotation.x = -swing * 0.52;
        u.rArm.rotation.x = -0.88 + Math.sin(now * 0.009 + s.phase) * 0.06;
      }
    } else {
      if (u.lLeg && u.rLeg) { u.lLeg.rotation.x = 0; u.rLeg.rotation.x = 0; }
      if (u.lArm && u.rArm) {
        u.lArm.rotation.x = 0;
        u.rArm.rotation.x = -0.88 + Math.sin(now * 0.009 + s.phase) * 0.06;
      }
    }

    // 오직 니고데모 미션 진행 중일 때만 발각 판정 (밀착 반경 3.1m 또는 정면 시야 부채꼴 9.1m / 건물 차폐 판정)
    if (activeNicodemusEv && now >= (window._miracleNightDetectGraceUntil || 0)) {
      const pdx = playerPos.x - m.position.x;
      const pdz = playerPos.z - m.position.z;
      const pDist = Math.hypot(pdx, pdz);
      let detected = false;
      if (pDist < 3.1) {
        if (!isMiraclePatrolSightBlocked(m.position.x, m.position.z, playerPos.x, playerPos.z)) {
          detected = true;
        }
      } else if (pDist < 9.1) {
        const fwdX = Math.sin(m.rotation.y);
        const fwdZ = Math.cos(m.rotation.y);
        const dot = (pdx / pDist) * fwdX + (pdz / pDist) * fwdZ;
        if (dot > Math.cos(0.52)) {
          if (!isMiraclePatrolSightBlocked(m.position.x, m.position.z, playerPos.x, playerPos.z)) {
            detected = true;
          }
        }
      }
      if (detected) {
        resetActiveNightMissionOnDetection(activeNicodemusEv, now);
        break;
      }
    }
  }
}

// -------------------------------------------------------------------------
// 9. 오픈월드 메인 진입 & 프레임 업데이트 루프
// -------------------------------------------------------------------------
function saveSafeOpenWorldReturnPosition(spotX, spotZ) {
  let dx = playerPos.x - spotX;
  let dz = playerPos.z - spotZ;
  const len = Math.hypot(dx, dz);
  if (len < 0.1) {
    dx = 0;
    dz = 1;
  } else {
    dx /= len;
    dz /= len;
  }
  const safeDist = 5.2;
  const rx = THREE.MathUtils.clamp(spotX + dx * safeDist, -114.0, 103.0);
  const rz = THREE.MathUtils.clamp(spotZ + dz * safeDist, -103.0, 103.0);
  const ry = getMiracleOpenWorldGroundHeight(rx, rz);
  miracleSavedOpenWorldPos.set(rx, ry, rz);
  miracleSavedOpenWorldYaw = cameraYaw;
}

function buildMiracleOpenWorld(restoreSavedPos = false) {
  clearWorld();
  if (window.MiracleDayNight) {
    window.MiracleDayNight.stageControlled = false;
    window.MiracleDayNight.freezeForNightMission = false;
    window.MiracleDayNight.stormDarkness = 0;
    window.MiracleDayNight.clearNightLightSources();
  }
  ensureMiracleCustomUI();
  const wf = document.getElementById('white-fade');
  const bf = document.getElementById('black-fade');
  const s1Ui = document.getElementById('miracle-s1-ui');
  if (wf) wf.style.opacity = '0';
  if (bf) bf.style.opacity = '0';
  if (s1Ui) s1Ui.classList.add('hidden');
  loadMiracleNotebookProgress();
  miracleSubMode = 'openworld';
  miracleActiveMinigameId = null;
  miracleActiveFieldEvent = null;
  miracleAmbientProps = [];
  window.miracleBuildingBounds = [];
  window.miracleRooftopSpawnSpots = [];
  window.miracleGrowingFields = [];
  window.miracleMustardShrubs = [];
  window.miracleWorldTreePositions = [];
  window.miracleZacchaeusGroveTrees = [];
  window.miracleReturningNpcs = [];
  window.miracleHarvestNodes = [];
  window.miracleRockHouseBuilt = false;
  window.miracleRockHouseMesh = null;
  window.miracleMustardTreeGrown = false;
  if (window.miracleOpenWorldIntroFlyover) {
    window.miracleOpenWorldIntroFlyover.active = false;
    window.miracleOpenWorldIntroFlyover.timer = 0;
    window.miracleOpenWorldIntroFlyover.doneCallback = null;
  }
  if (typeof window.hideMiracleMissionStatusUI === 'function') window.hideMiracleMissionStatusUI();

  scene.background = new THREE.Color(miracleIsPostResurrection ? 0x60a5fa : 0x7dd3fc);
  scene.fog = new THREE.Fog(miracleIsPostResurrection ? 0xbae6fd : 0xbae6fd, 125, 360);

  buildSoftLowPolyWorldTerrain();
  buildMiracleRegionalLandmarks();
  buildMiracleRoadsideVillagesAndForests();
  buildMiracleNightEnvironmentProps();
  buildMiracleNightPatrolSoldiers();
  spawnMiracleMainStageSpots();
  spawnMiracleOptionalEventSpots();
  spawnMiracleRumorNpcs();
  if (typeof window.syncMiracleTimeHUD === 'function') window.syncMiracleTimeHUD();

  // 씨 뿌리기 미션 모든 단계 완료 후 심은 곡식 밭만 복원 (미완료 시 자동 성장 방지!)
  loadMiracleSowerHistoryFromStorage();
  if (Array.isArray(window.miracleSowerHistory) && window.miracleSowerHistory.length > 0) {
    window.miracleSowerHistory.forEach(item => {
      if (item && item.allStepsCompleted === true) {
        const elapsedSec = Math.max(0, (Date.now() - (item.plantedAt || Date.now())) / 1000);
        spawnPersistentSowerGrowingField(item.x, item.z, elapsedSec);
      }
    });
  }

  // 부활 이후 갈릴리 바닷가 아침식사 미션 완료 후 남은 불꺼진 모닥불(숯이 된 나무·재) 영구 복원!
  window.miracleBurntCampfireMeshes = [];
  loadMiracleBurntCampfiresFromStorage();
  if (Array.isArray(window.miracleBurntCampfires) && window.miracleBurntCampfires.length > 0) {
    window.miracleBurntCampfires.forEach(cf => {
      spawnPersistentBurntCampfire(cf.x, cf.z, false);
    });
  }

  // 반석 위의 집(par_builder) · 겨자씨 나무(par_mustard) 영구 복원 (스테이지 밤 전환·재입장 후에도 유지!)
  const hasBuilderDone =
    (typeof miracleCompletedMissionIds !== 'undefined' && miracleCompletedMissionIds.has('par_builder')) ||
    (typeof miracleCollectedIds !== 'undefined' && miracleCollectedIds.has('par_builder'));
  if (!window.isMiracleMultiplayerMode && hasBuilderDone) {
    const bSpot = Array.isArray(miracleEventSpots) ? miracleEventSpots.find(s => s && s.id === 'par_builder') : null;
    const rx = (bSpot ? bSpot.x : 52) + (bSpot && bSpot.targetOffset ? bSpot.targetOffset.x : 5);
    const rz = (bSpot ? bSpot.z : 24) + (bSpot && bSpot.targetOffset ? bSpot.targetOffset.z : -3);
    spawnPersistentRockHouse(rx, rz);
    if (bSpot) bSpot._houseBuilt = true;
  }

  // 겨자씨 비유(par_mustard) 실시간 성장 관목 영구 복원 (타임스탬프 기반 · 구버전 클리어 데이터 하위 호환)
  loadMiracleMustardHistoryFromStorage();
  const hasMustardDone =
    (typeof miracleCompletedMissionIds !== 'undefined' && miracleCompletedMissionIds.has('par_mustard')) ||
    (typeof miracleCollectedIds !== 'undefined' && miracleCollectedIds.has('par_mustard'));
  if (Array.isArray(window.miracleMustardHistory) && window.miracleMustardHistory.length > 0) {
    window.miracleMustardHistory.forEach(item => {
      if (item && item.allStepsCompleted === true) {
        const elapsedSec = Math.max(0, (Date.now() - (item.plantedAt || Date.now())) / 1000);
        spawnPersistentMustardShrub(item.x, item.z, elapsedSec);
      }
    });
  } else if (hasMustardDone) {
    const mSpot = Array.isArray(miracleEventSpots) ? miracleEventSpots.find(s => s && s.id === 'par_mustard') : null;
    const mx = (mSpot ? mSpot.x : 42) + (mSpot && mSpot.targetOffset ? mSpot.targetOffset.x : 4);
    const mz = (mSpot ? mSpot.z : -20) + (mSpot && mSpot.targetOffset ? mSpot.targetOffset.z : 0);
    spawnPersistentMustardShrub(mx, mz, MIRACLE_MUSTARD_GROW_DURATION_SEC);
  }
  if (hasMustardDone) {
    const mSpot = Array.isArray(miracleEventSpots) ? miracleEventSpots.find(s => s && s.id === 'par_mustard') : null;
    if (mSpot) mSpot._treeGrown = true;
  }

  currentMapRectBounds = {
    minX: -120.0,
    maxX:  105.5,
    minZ: -105.5,
    maxZ:  105.5
  };

  if (restoreSavedPos && miracleSavedOpenWorldPos) {
    playerPos.copy(miracleSavedOpenWorldPos);
    playerPos.y = getMiracleOpenWorldGroundHeight(playerPos.x, playerPos.z);
    cameraYaw = miracleSavedOpenWorldYaw;
    cameraTargetYaw = miracleSavedOpenWorldYaw;
  } else {
    const startX = 0, startZ = -56;
    playerPos.set(startX, getMiracleOpenWorldGroundHeight(startX, startZ), startZ);
    cameraYaw = 0;
    cameraTargetYaw = 0;
  }

  const nowTs = performance.now();
  miracleStageSpots.forEach(sp => {
    const d = Math.hypot(playerPos.x - sp.pos.x, playerPos.z - sp.pos.z);
    if (d < 4.8) {
      sp._requireLeaveZone = true;
      sp._prompted = nowTs;
    }
  });
  miracleEventSpots.forEach(ev => {
    const d = Math.hypot(playerPos.x - ev.pos.x, playerPos.z - ev.pos.z);
    if (d < 4.8) {
      ev._requireLeaveZone = true;
      ev._prompted = nowTs;
    }
  });

  lastGroundedY = playerPos.y;
  playerVelY = 0;
  isGrounded = true;
  playerFacing = Math.PI;
  rebuildPlayerAppearance();
  snapCameraToPlayer();
  if (typeof updateMiracleDynamicSun === 'function') {
    updateMiracleDynamicSun(0, performance.now());
  }
  if (Array.isArray(window.miracleSkyBirds) && window.MiracleDayNight && typeof window.MiracleDayNight.getBirdActivityRatio === 'function') {
    const ratio = window.MiracleDayNight.getBirdActivityRatio();
    const total = window.miracleSkyBirds.length;
    for (let i = 0; i < total; i++) {
      const b = window.miracleSkyBirds[i];
      if (!b || !b.mesh) continue;
      if (b.baseScale == null) b.baseScale = b.mesh.scale.x || 1;
      b.mesh.visible = ratio > (i + 0.5) / total;
    }
  }
  updateMiracleNotebookHudBadge();
  updateStageHUD();

  isTimeAttackActive = false;
  const owTimerBox = document.getElementById('hud-timer-box');
  if (owTimerBox) { owTimerBox.classList.add('hidden'); owTimerBox.classList.remove('flex'); }

  if (typeof playMiracleOpenWorldOgg === 'function') {
    playMiracleOpenWorldOgg();
  }
  if (window.MiracleMultiplayer && typeof window.MiracleMultiplayer.onOpenWorldBuilt === 'function') {
    window.MiracleMultiplayer.onOpenWorldBuilt();
  }
}

window.returnToMiracleOpenWorld = function () {
  isTimeAttackActive = false;
  const timerBox = document.getElementById('hud-timer-box');
  if (timerBox) timerBox.classList.add('hidden');
  const wf = document.getElementById('white-fade');
  const bf = document.getElementById('black-fade');
  const s1Ui = document.getElementById('miracle-s1-ui');
  if (wf) wf.style.opacity = '0';
  if (bf) bf.style.opacity = '0';
  if (s1Ui) s1Ui.classList.add('hidden');
  buildMiracleOpenWorld(true);
  startStageBgm(currentStage);
  if (typeof playMiracleOpenWorldOgg === 'function') playMiracleOpenWorldOgg();
};

function updateMiracleOpenWorldFrame(dt, now) {
  positionMiracleLeftHudBelowTopBar();

  // [오프닝 영상 직후] 탑뷰 전체 조망 → 마을 상공 비행 → 캐릭터 시선 하강 플라이오버 진행
  if (window.miracleOpenWorldIntroFlyover && window.miracleOpenWorldIntroFlyover.active) {
    window.miracleOpenWorldIntroFlyover.timer += dt;
    if (typeof applyCoreCameraByMode === 'function') applyCoreCameraByMode();
    
    // 기본 시간을 5.4초에서 8.5초로 변경
    if (window.miracleOpenWorldIntroFlyover.timer >= (window.miracleOpenWorldIntroFlyover.duration || 8.5)) {
      const doneCb = window.miracleOpenWorldIntroFlyover.doneCallback;
      window.miracleOpenWorldIntroFlyover.active = false;
      window.miracleOpenWorldIntroFlyover.doneCallback = null;
      
      // 연출이 자연스럽게 종료되면 SKIP 버튼도 함께 숨김 처리
      const skipWrap = document.getElementById('ep4-flyover-skip-wrap');
      if (skipWrap) skipWrap.classList.add('hidden');

      if (typeof snapCameraToPlayer === 'function') snapCameraToPlayer();
      if (typeof doneCb === 'function') doneCb();
    }
  }

  if (typeof updateMiracleDynamicSun === 'function') {
    updateMiracleDynamicSun(dt, now);
  }

  const nightFactorNow = (window.MiracleDayNight) ? window.MiracleDayNight.nightFactor : 0;
  const firesLit = nightFactorNow > 0.12;
  if (Array.isArray(window.miracleNightFireProps)) {
    for (let i = 0; i < window.miracleNightFireProps.length; i++) {
      const f = window.miracleNightFireProps[i];
      if (f && f.prop && typeof f.prop.setLit === 'function') {
        f.prop.setLit(firesLit, now, f.phase || 0);
      }
    }
  }
  updateMiracleNightPatrolSoldiers(dt, now);

  const worldRad = window.MIRACLE_EXP_LIMIT || 152;
  miracleAmbientProps.forEach(p => {
    if (p.kind === 'boat' && p.mesh) {
      p.mesh.position.y = p.baseY + Math.sin(now * 0.003 + p.phase) * 0.14;
      p.mesh.rotation.z = Math.sin(now * 0.0025 + p.phase) * 0.05;
    } else if (p.kind === 'cloud' && p.mesh) {
      p.mesh.position.x += p.speed * dt;
      if (p.mesh.position.x > worldRad + 25) {
        p.mesh.position.x = -worldRad - 25;
      }
    }
  });

  miracleWanderingActors.forEach(actor => {
    updateMiracleActorWalkAI(actor, dt, now, 2.8);
  });

  if (typeof updateIrregularKneeLightAura === 'function') {
    miracleEventSpots.forEach((ev, idx) => {
      if (ev.kneeAura) {
        updateIrregularKneeLightAura(ev.kneeAura, now, idx);
      }
    });
  }

  // 하늘을 날아다니는 소프트 로우 폴리곤 새 비행 & 날갯짓 시뮬레이션 (낮 100%, 일몰 점진 감소, 밤 0%, 새벽 점진 증가)
  if (Array.isArray(window.miracleSkyBirds) && window.miracleSkyBirds.length > 0) {
    const tSec = now * 0.001;
    const dn = window.MiracleDayNight;
    const birdRatio = (dn && typeof dn.getBirdActivityRatio === 'function') ? dn.getBirdActivityRatio() : 1.0;
    const totalBirds = window.miracleSkyBirds.length;
    for (let i = 0; i < totalBirds; i++) {
      const b = window.miracleSkyBirds[i];
      if (!b || !b.mesh) continue;
      if (b.baseScale == null) b.baseScale = b.mesh.scale.x || 1;
      const threshold = (i + 0.5) / totalBirds;
      if (birdRatio <= threshold || birdRatio <= 0.001) {
        b.mesh.visible = false;
        continue;
      }
      b.mesh.visible = true;
      const birdScale = b.baseScale * Math.min(1.0, Math.max(0.28, (birdRatio - threshold) / 0.08));
      b.mesh.scale.setScalar(birdScale);

      b.angle += dt * b.speed;
      const nx = b.cx + Math.cos(b.angle) * b.radX;
      const nz = b.cz + Math.sin(b.angle) * b.radZ;
      const ny = b.baseY + Math.sin(b.angle * 2.0 + b.phase) * b.bobAmp;
      // 진행 접선 벡터로 정확한 기수(머리) 방향 계산
      const vx = -Math.sin(b.angle) * b.radX * b.speed;
      const vz =  Math.cos(b.angle) * b.radZ * b.speed;
      b.mesh.position.set(nx, ny, nz);
      b.mesh.rotation.y = Math.atan2(vx, vz);
      // 선회 방향에 맞춘 자연스러운 날개 기울기(Bank)
      b.mesh.rotation.z = (b.speed > 0 ? -0.16 : 0.16) + Math.sin(tSec * 1.4 + b.phase) * 0.06;

      // 몇 번 퍼덕인 뒤 잠시 활공하는 자연스러운 날갯짓 사이클
      const glideMod = Math.sin(tSec * 1.1 + b.phase) > -0.35 ? 1.0 : 0.18;
      const flap = Math.sin(tSec * b.flapSpeed + b.phase) * 0.58 * glideMod;
      if (b.mesh.userData && b.mesh.userData.wingL && b.mesh.userData.wingR) {
        b.mesh.userData.wingL.rotation.z = flap;
        b.mesh.userData.wingR.rotation.z = -flap;
      }
    }
  }

  // 씨 뿌리기 미션 완료 후 시간이 지나며 점점 자라나는 곡식 실시간 업데이트
  updateMiracleGrowingFields(dt, now);
  // 겨자씨 미션 완료 후 시간이 지나며 굵은 줄기·넓은 잎·노란 꽃 관목으로 자라나는 식물 실시간 업데이트
  updateMiracleMustardShrubs(dt, now);

  // 미션 완료 후 제자리로 직접 걸어 돌아가는 NPC(수가성 여인·엠마오 제자) 실시간 보행 업데이트
  updateMiracleReturningNpcs(dt, now);

  // 온라인 멀티플레이 동기화 & 협동 반석위의 집 채집/건축 업데이트
  if (window.MiracleMultiplayer && typeof window.MiracleMultiplayer.updateFrame === 'function') {
    window.MiracleMultiplayer.updateFrame(dt, now);
  }

  // 대화창이 열려있으면 필드 이벤트 진행 중지
  if (miracleDialogState.active) return;

  if (miracleActiveFieldEvent) {
    updateMiracleFieldEventFrame(dt, now);
  }

  // 대화창을 닫은 직후(1.8초 이내)에는 다른/같은 캐릭터 대화가 곧바로 다시 열리지 않도록 전역 쿨타임 보호
  const dialogGraceReady = (now - (miracleDialogState.lastClosedAt || 0)) >= 1800;

  const allUnlocked = (typeof isMiracleAllStagesUnlocked === 'function' && isMiracleAllStagesUnlocked());
  const activeStageNum = getNextActiveMainStageNumber();
  const isStage3Cleared = Boolean(allUnlocked || miracleMainStagesCleared[3] || miracleMainStagesCleared[4] || miracleIsPostResurrection);
  const isFieldMissionActive = Boolean(miracleActiveFieldEvent);
  let currentActiveStageSpot = null;

  // [이전 스테이지 클리어 확인 동기화 보완 + 미션 중 타 스테이지 진입 불가 & 머리 위 태그 일시 해제 + 2회차 전체 해금]
  miracleStageSpots.forEach((sp, idx) => {
    if (sp.beam && sp.beam.visible) {
      const pulse = 1.0 + Math.sin(now * 0.004 + idx) * 0.15;
      sp.beam.scale.set(pulse, 1, pulse);
    }

    if (sp.stageNum === activeStageNum) {
      currentActiveStageSpot = sp;
    }

    const d = Math.hypot(playerPos.x - sp.pos.x, playerPos.z - sp.pos.z);

    if (sp.npcMesh && d < 9.0) {
      const targetAng = Math.atan2(playerPos.x - sp.pos.x, playerPos.z - sp.pos.z);
      sp.npcMesh.rotation.y = lerpAngle(sp.npcMesh.rotation.y, targetAng, dt * 6.0);
    }

    // 오픈월드 미션 진행 중일 때는 모든 메인 스테이지 머리 위 태그 일시 해제 & 진입 차단
    if (isFieldMissionActive) {
      if (sp.label) sp.label.style.opacity = '0';
      return;
    }

    // 스테이지 4 무덤 앞을 지키는 여인(막달라 마리아) 머리 위 태그는 스테이지 3 클리어(또는 2회차 전체해금) 시 표시
    if (sp.stageNum === 4 && !isStage3Cleared) {
      if (sp.label) sp.label.style.opacity = '0';
    } else {
      updateWorldLabelPos(sp.label, sp.pos, d < MIRACLE_TAG_DIST_SPOT);
    }

    if (sp._requireLeaveZone) {
      if (d > 4.4) sp._requireLeaveZone = false;
      return;
    }

    if (dialogGraceReady && d < 3.3 && (!sp._prompted || now - sp._prompted > 6500)) {
      sp._prompted = now;
      sp._requireLeaveZone = true;

      const launchThisStage = () => {
        saveSafeOpenWorldReturnPosition(sp.x, sp.z);
        if (sp.stageNum === 5 && typeof startMiracleAscensionEnding === 'function') {
          startMiracleAscensionEnding();
        } else if (typeof enterMiracleMainStage === 'function') {
          enterMiracleMainStage(sp.stageNum);
        }
      };

      // 승천 이후 다시 감람산 언덕(제자들)에 다가온 경우 → 승천 이후 상태의 엔딩 세상 열기!
      if (sp.stageNum === 5 && miracleAscensionSeen) {
        openMiracleDialog({
          sourceRef: sp,
          speaker: sp.introSpeaker,
          category: 'story',
          text: sp.introText,
          audioUrl: sp.audioUrl,
          showCancel: true,
          cancelText: '오픈월드 계속 둘러보기 ✕',
          btnText: '☁️ 승천 이후 엔딩 세상 보기 ▶',
          onConfirm: launchThisStage
        });
      } else if (sp.cleared) {
        openMiracleDialog({
          sourceRef: sp,
          speaker: sp.introSpeaker,
          category: 'greeting',
          text: sp.greetingText || `"반가워요! 함께 완수했던 메인 스테이지 ${sp.stageNum}의 감동이 아직도 생생하네요!"`,
          audioUrl: sp.greetingAudioUrl,
          btnText: '반갑게 인사 나누기 👋',
          replayText: `🔄 스테이지 ${sp.stageNum} 다시하기`,
          onReplay: launchThisStage
        });
      } else if (!allUnlocked && sp.stageNum > activeStageNum) {
        openMiracleDialog({
          sourceRef: sp,
          speaker: sp.introSpeaker,
          category: 'story',
          text: `"아직 앞선 여정이 남아 있어요! 먼저 빛기둥이 비추고 있는 [메인 스테이지 ${activeStageNum}]을(를) 순서대로 완료하고 오세요!"`,
          btnText: '네, 순서대로 다녀올게요! ▶'
        });
      } else {
        openMiracleDialog({
          sourceRef: sp,
          speaker: sp.introSpeaker,
          category: 'story',
          text: sp.introText,
          audioUrl: sp.audioUrl,
          showCancel: true,
          cancelText: '거절 (나중에 하기) ✕',
          btnText: sp.stageNum === 5 ? '👑 감람산 승천·재림 언약 보기 ▶' : `🚀 메인 스테이지 ${sp.stageNum} 시작하기 ▶`,
          onConfirm: launchThisStage,
          onCancel: () => {
            sp._prompted = performance.now();
            showToast('✋ 스테이지 입장을 보류했어요. 오픈월드를 더 둘러본 뒤 언제든 다시 오세요!');
          }
        });
      }
    }
  });

  const isNightTimeNow = Boolean(window.MiracleDayNight && typeof window.MiracleDayNight.isNight === 'function' && window.MiracleDayNight.isNight());
  miracleEventSpots.forEach((ev) => {
    if (ev.isNightOnly) {
      const keepVisible = isNightTimeNow || (isFieldMissionActive && miracleActiveFieldEvent.spot === ev);
      if (ev.group) ev.group.visible = keepVisible;
      if (ev.nightOilLamp) {
        ev.nightOilLamp.group.visible = keepVisible;
        if (keepVisible) ev.nightOilLamp.setLit(true, now, 2.3);
      }
      if (!isFieldMissionActive) {
        if (ev.kneeAura) ev.kneeAura.visible = keepVisible;
        if (ev.ring) ev.ring.visible = keepVisible;
      }
      if (!keepVisible) {
        if (ev.label) ev.label.style.opacity = '0';
        return;
      }
    }

    const d = Math.hypot(playerPos.x - ev.pos.x, playerPos.z - ev.pos.z);

    const isWalkingHomeNpc = Array.isArray(window.miracleReturningNpcs) && window.miracleReturningNpcs.some(rn => rn.mesh === ev.npcMesh);
    const isRunningMessenger = Boolean(
      isFieldMissionActive &&
      miracleActiveFieldEvent.spot === ev &&
      ((miracleActiveFieldEvent.messenger && miracleActiveFieldEvent.messenger.reusedSpotNpc) ||
       (Array.isArray(miracleActiveFieldEvent.reusedEscortNpcs) && miracleActiveFieldEvent.reusedEscortNpcs.length > 0))
    );
    if (ev.npcMesh && !isRunningMessenger && !isWalkingHomeNpc && d < 8.5) {
      const targetAng = Math.atan2(playerPos.x - ev.pos.x, playerPos.z - ev.pos.z);
      ev.npcMesh.rotation.y = lerpAngle(ev.npcMesh.rotation.y, targetAng, dt * 6.0);
    }

    // 미션 진행 중일 때는 다른 모든 미션 NPC의 머리 위 태그 일시 해제 & 진입 차단
    if (isFieldMissionActive && miracleActiveFieldEvent.spot !== ev) {
      if (ev.label) ev.label.style.opacity = '0';
      return;
    }

    updateWorldLabelPos(ev.label, ev.pos, !isFieldMissionActive && d < MIRACLE_TAG_DIST_SPOT);

    if (ev._requireLeaveZone) {
      if (d > 4.4) ev._requireLeaveZone = false;
      return;
    }

    if (
      dialogGraceReady &&
      !isFieldMissionActive &&
      d < 3.0 &&
      (!ev._prompted || now - ev._prompted > 6500)
    ) {
      ev._prompted = now;
      ev._requireLeaveZone = true;

      if (ev.completed) {
        openMiracleDialog({
          sourceRef: ev,
          speaker: ev.speaker,
          category: 'greeting',
          text: ev.greetingText || `"샬롬! 아까 함께 나누었던 은혜로운 이야기를 기억하고 계시군요! 반가워요!"`,
          btnText: '반갑게 인사 나누기 👋',
          replayText: '🔄 미션 다시하기',
          onReplay: () => {
            startMiracleFieldEvent(ev);
          }
        });
      } else {
        openMiracleDialog({
          sourceRef: ev,
          speaker: ev.speaker,
          category: ev.category,
          text: ev.introText,
          showCancel: true,
          cancelText: '거절 (나중에 하기) ✕',
          btnText: '🙌 미션 수락하기!',
          onConfirm: () => {
            startMiracleFieldEvent(ev);
          },
          onCancel: () => {
            ev._prompted = performance.now();
            showToast('✋ 미션을 거절했어요. 준비되면 언제든 다시 말을 걸어 주세요!');
          }
        });
      }
    }
  });

  miracleRumorNpcs.forEach((rn) => {
    updateMiracleActorWalkAI(rn, dt, now, 3.4);
    rn.pos.set(rn.mesh.position.x, rn.mesh.position.y + 0.5, rn.mesh.position.z);

    const d = Math.hypot(playerPos.x - rn.pos.x, playerPos.z - rn.pos.z);
    // 수첩 수집 상태가 다른 이벤트로 갱신된 경우에도 머리 위 라벨을 [수집한 소문/말씀/목격담]으로 즉시 동기화
    const isAlreadyCollected = Boolean(rn.talked || (rn.nbId && miracleCollectedIds.has(rn.nbId)));
    if (isAlreadyCollected && !rn._collectedLabelApplied) {
      rn._collectedLabelApplied = true;
      rn.talked = true;
      if (rn.label) {
        const prefix = rn.cat === 'word' ? '✅ 수집한 말씀' : (rn.cat === 'eyewitness' ? '✅ 수집한 목격담' : '✅ 수집한 소문');
        rn.label.innerHTML = `${prefix} · ${rn.speaker}`;
      }
    }

    // 미션 진행 중에는 소문/말씀 NPC 태그도 일시 해제하여 혼란 방지
    if (isFieldMissionActive) {
      if (rn.label) rn.label.style.opacity = '0';
      return;
    }

    updateWorldLabelPos(rn.label, rn.pos, d < MIRACLE_TAG_DIST_NPC);

    if (rn._requireLeaveZone) {
      if (d > 4.2) rn._requireLeaveZone = false;
      return;
    }

    // 대화 종료 후 충분한 쿨타임(9초) + 일정 거리 이상 이탈 후 다시 다가왔을 때만 대화 재오픈
    if (dialogGraceReady && d < 2.5 && (!rn._prompted || now - rn._prompted > 9000)) {
      rn._prompted = now;
      rn._requireLeaveZone = true;
      const wasCollected = isAlreadyCollected;
      rn.talked = true;
      rn._collectedLabelApplied = true;

      const collectedBadgeText = rn.cat === 'word'
        ? '✅ 수집한 말씀 (탐험수첩에 기록됨)'
        : (rn.cat === 'eyewitness' ? '✅ 수집한 목격담 (탐험수첩에 기록됨)' : '✅ 수집한 소문 (탐험수첩에 기록됨)');
      if (rn.label) {
        const prefix = rn.cat === 'word' ? '✅ 수집한 말씀' : (rn.cat === 'eyewitness' ? '✅ 수집한 목격담' : '✅ 수집한 소문');
        rn.label.innerHTML = `${prefix} · ${rn.speaker}`;
      }

      openMiracleDialog({
        sourceRef: rn,
        speaker: rn.speaker,
        category: rn.cat,
        badgeLabel: wasCollected ? collectedBadgeText : undefined,
        badgeCls: wasCollected ? 'bg-emerald-200 text-emerald-950' : undefined,
        notebookId: rn.nbId,
        text: rn.text,
        quiz: (wasCollected || currentMode === 'kinder') ? null : rn.quiz,
        btnText: wasCollected ? '✅ 확인 (수첩에 보관됨) ▶' : '📖 수첩에 적어두기'
      });
    }
  });

  // 현재 목표 좌표(가장 가까운 미수집 아이템 · 미션 목적지 · 다음 메인 스테이지) 계산 → 화살표 & 소년반 미니 나침반 연동!
  let guideTarget = null;
  let navLabel = '';
  let navIs2F = false;
  if (miracleActiveFieldEvent) {
    const fe = miracleActiveFieldEvent;
    const ev = fe.spot;
    const pickNearest = (list) => {
      let best = null, bestD = Infinity;
      for (let i = 0; i < list.length; i++) {
        const it = list[i];
        if (!it || it.done) continue;
        const dd = Math.hypot(it.pos.x - playerPos.x, it.pos.z - playerPos.z);
        if (dd < bestD) { bestD = dd; best = it; }
      }
      return best;
    };
    if (fe.type === 'nicodemus_stealth') {
      const nearestScroll = (fe.items && (fe.collected || 0) < (fe.required || 3)) ? pickNearest(fe.items) : null;
      if (nearestScroll) {
        guideTarget = nearestScroll.pos;
        navLabel = '성경 두루마리';
      } else if (fe.targetZone) {
        guideTarget = fe.targetZone.pos;
        navLabel = '비밀 집 예수님';
      }
    } else if (fe.type === 'collect_deliver') {
      const nearestItem = (fe.items && fe.carrying === 0) ? pickNearest(fe.items) : null;
      if (nearestItem) {
        guideTarget = nearestItem.pos;
        navLabel = (ev.itemLabel || '미션 물품').replace(/^[^\s]+\s*/, '');
        navIs2F = Boolean(nearestItem.isRooftop);
      } else if (fe.targetZone) {
        guideTarget = fe.targetZone.pos;
        navLabel = ev.deliverToUpperRoom ? '2층 다락방' : (ev.deliverToInnBed ? '여관 병상' : '전달 지점');
        navIs2F = Boolean(ev.deliverToUpperRoom);
      }
    } else if (fe.type === 'sower_farm' && fe.sowerState) {
      const sf = fe.sowerState;
      if (sf.phase === 'collect_seeds') {
        const nearestSeed = pickNearest(sf.seedBaskets || []);
        if (nearestSeed) {
          guideTarget = nearestSeed.pos;
          navLabel = '씨앗 바구니';
          navIs2F = Boolean(nearestSeed.isRooftop);
        }
      }
      if (!guideTarget) {
        guideTarget = new THREE.Vector3(sf.fx, sf.fy, sf.fz);
        navLabel = sf.areaName || '산기슭 밭';
      }
    } else if (fe.type === 'mustard_grow' && fe.mustardState) {
      const ms = fe.mustardState;
      if (ms.phase === 'find_seed' && ms.seedObj) {
        guideTarget = ms.seedObj.pos;
        navLabel = '아주 작은 겨자씨';
      } else if (ms.phase === 'find_water' && ms.waterObj) {
        guideTarget = ms.waterObj.pos;
        navLabel = '맑은 물 항아리';
      } else {
        guideTarget = new THREE.Vector3(ms.fx, ms.fy, ms.fz);
        navLabel = '겨자씨 흙밭';
      }
    } else if (fe.type === 'follow_messenger' && fe.messenger && fe.messenger.mesh) {
      guideTarget = fe.messenger.mesh.position;
      navLabel = '수가성 여인';
    } else if (fe.type === 'chase_sheep' && fe.sheepState && fe.sheepState.mesh) {
      guideTarget = fe.sheepState.mesh.position;
      navLabel = '잃어버린 양';
    } else if (fe.type === 'breakfast_fish_cook') {
      guideTarget = fe.targetZone ? fe.targetZone.pos : null;
      navLabel = '바닷가 모닥불';
    } else if (fe.targetZone) {
      guideTarget = fe.targetZone.pos;
      navLabel = (ev.id === 'ev_paralytic')
        ? '집 지붕 위'
        : (ev.randomTreeGoal
          ? '나무 아래'
          : (ev.randomEmmausGoal
            ? '엠마오 식탁'
            : (ev.thomasCutscene ? '부활의 예수님' : '미션 목표')));
      navIs2F = (ev.id === 'ev_paralytic');
    }
  }
  if (!guideTarget && currentActiveStageSpot) {
    guideTarget = currentActiveStageSpot.pos;
    navLabel = `스테이지 ${currentActiveStageSpot.stageNum}`;
  } else if (!guideTarget && miracleStageSpots.length > 0) {
    const lastSp = miracleStageSpots[miracleStageSpots.length - 1];
    guideTarget = lastSp.pos;
    navLabel = `스테이지 ${lastSp.stageNum}`;
  }

  const isMpMode = Boolean(window.isMiracleMultiplayerMode);
  if (isMpMode) {
    // [멀티플레이 전용] 머리 위 3D 화살표는 숨기고 소년반 내비게이터(방향 나침반 + 거리)를 적용!
    if (guideArrowGroup) guideArrowGroup.visible = false;
    if (window.MiracleMultiplayer && typeof window.MiracleMultiplayer.getNavigatorTarget === 'function') {
      const mpNav = window.MiracleMultiplayer.getNavigatorTarget();
      if (mpNav && mpNav.pos) {
        guideTarget = mpNav.pos;
        navLabel = mpNav.label || '반석 집터';
        navIs2F = false;
      }
    }
  }

  if (!isMpMode && guideArrowGroup && guideArrowGroup.visible && guideTarget) {
    const baseFacing = (window.globalCameraViewMode === 'fps') ? (cameraYaw + Math.PI) : playerFacing;
    guideArrowGroup.rotation.y = Math.atan2(guideTarget.x - playerPos.x, guideTarget.z - playerPos.z) - baseFacing;
  }

  // [소년반(senior)·타임어택(에피소드4 소년반 동일 구성) 및 멀티플레이 전용 초슬림 미니 나침반/거리 내비게이터]
  if (typeof window.updateMiracleMiniNavigatorUI === 'function') {
    const isSeniorEquiv = (typeof isEffectiveSeniorMode === 'function')
      ? isEffectiveSeniorMode('miracle', currentMode)
      : (currentMode === 'senior' || currentMode === 'timeattack');
    const showMiniNav = ((isSeniorEquiv || isMpMode) && miracleSubMode === 'openworld' && Boolean(guideTarget));
    if (showMiniNav) {
      const dx = guideTarget.x - playerPos.x;
      const dz = guideTarget.z - playerPos.z;
      const distM = Math.round(Math.hypot(dx, dz));
      // cameraYaw 기준 정면(-sinY, -cosY), 우측(+cosY, -sinY) 대비 목표 상대 각도 (0° = 화면 정면 위쪽!)
      const fwdX = -Math.sin(cameraYaw), fwdZ = -Math.cos(cameraYaw);
      const rightX = Math.cos(cameraYaw), rightZ = -Math.sin(cameraYaw);
      const dotFwd = dx * fwdX + dz * fwdZ;
      const dotRight = dx * rightX + dz * rightZ;
      const relDeg = Math.atan2(dotRight, dotFwd) * (180 / Math.PI);
      window.updateMiracleMiniNavigatorUI({
        visible: true,
        deg: relDeg,
        label: navIs2F ? `${navLabel}·2층` : navLabel,
        distText: `${distM}m`
      });
    } else {
      window.updateMiracleMiniNavigatorUI({ visible: false });
    }
  }
}