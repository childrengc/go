// =========================================================================
// [ep4_miracle_world.js - 파트 1/3] 에피소드 4 : 확장된 소프트 로우 폴리곤 오픈월드 지형·외곽 언덕·길가 마을·생태계
// - 가장자리 언덕 내부 진입 완벽 차단 (연속 충돌벽 Colliders + 경계 제한)
// - 계단으로 건물 2층 등반 후 인접한 옆 건물 옥상·2층으로 점프 이동할 수 있는 근접 마을 배치
// =========================================================================
window.__GAME_BUILD_VERSIONS__ = window.__GAME_BUILD_VERSIONS__ || {};
window.__GAME_BUILD_VERSIONS__.ep4_world = '20261120_v13';

let miracleWorldMissionObjects = [];
let miracleActiveFieldEvent = null;
let miracleWanderingActors = []; // 자연스럽게 걸어 다니는 마을 주민 & 초원 동물(사슴·양) 배열
let miracleGolgothaCrossesGroup = null; // 스테이지 3(예수님 십자가 사건)부터 등장하는 골고다 세 십자가 그룹
let miracleOpenWorldTombGroup = null; // 스테이지 3 클리어 후 모습을 드러내는 동산 돌 무덤 그룹
let miracleTombCoverGroup = null; // 스테이지 3 클리어 전까지 돌 무덤을 가려주는 풀·덤불 위장막
window.miracleSkyBirds = []; // 하늘을 날아다니는 소프트 로우 폴리곤 새 배열
window.miracleGrowingFields = []; // 씨 뿌리기 미션 완료 후 시간이 지남에 따라 실시간으로 자라나는 곡식 밭 배열
window.miracleSowerHistory = window.miracleSowerHistory || []; // 모든 단계 완료 시에만 저장되는 파종 이력
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
  const by = getMiracleOpenWorldGroundHeight(x, z);
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

// 건물 앞·골목 어귀를 풍성하게 꾸며주는 비정형 소프트 로우폴리 시장 소품 묶음 (항아리·곡식자루·나무상자·바구니)
function createOrganicStreetPropCluster(x, z, rotY = 0, seed = 1) {
  const by = getMiracleOpenWorldGroundHeight(x, z);
  const grp = new THREE.Group();
  const makeBox = (w, h, d, s) => (typeof createOrganicBoxGeo === 'function')
    ? createOrganicBoxGeo(w, h, d, s, 0.07, 0.95, 1)
    : new THREE.BoxGeometry(w, h, d);

  const crate = createLowPolyMesh(makeBox(1.05, 0.62, 0.82, seed), '#9a5b25', -0.45, 0.31, 0, true);
  const crateLid = createLowPolyMesh(makeBox(1.12, 0.10, 0.88, seed + 1), '#78350f', -0.45, 0.64, 0, false);
  const basket = createLowPolyMesh(new THREE.CylinderGeometry(0.32, 0.24, 0.34, 7), '#b45309', -0.45, 0.86, 0.04, false);
  const fruit = createLowPolyMesh(new THREE.DodecahedronGeometry(0.24, 0), seed % 2 === 0 ? '#eab308' : '#84cc16', -0.45, 1.04, 0.04, false);
  fruit.scale.set(1.1, 0.68, 1.1);

  const jar1 = createOrganicAmphoraProp(1.05, '#b86232', '#8f471e');
  jar1.position.set(0.45, 0, -0.18);
  const jar2 = createOrganicAmphoraProp(0.76, '#c27442', '#9a4f25');
  jar2.position.set(0.84, 0, 0.22);
  jar2.rotation.z = -0.12;

  const sack = createLowPolyMesh(new THREE.IcosahedronGeometry(0.36, 0), '#d6c19c', 0.12, 0.28, 0.42, true);
  sack.scale.set(1.1, 0.78, 0.95);
  sack.rotation.y = seed * 0.7;

  grp.add(crate, crateLid, basket, fruit, jar1, jar2, sack);
  grp.position.set(x, by, z);
  grp.rotation.y = rotY;
  worldGroup.add(grp);
  colliders.push({ minX: x - 1.05, maxX: x + 1.05, minZ: z - 0.85, maxZ: z + 0.85 });
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
// 3-A. 언덕 중턱 계단식 비정형 자연석 돌담(Retaining Fieldstone Walls) 생성기 (전체 1 드로우콜 병합)
// -------------------------------------------------------------------------
function buildHillsideStoneTerraceWalls() {
  const stoneWallGrp = new THREE.Group();
  const stoneCols = ['#ede0c8', '#e1cda9', '#d4bc94', '#c6aa80', '#f2e7d3', '#baa078'];
  const hash1 = (v) => {
    const s = Math.sin(v * 127.1 + 311.7) * 43758.5453;
    return s - Math.floor(s);
  };

  const addDryStoneWallCurve = (pts, courses = 3, seedBase = 1) => {
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
          const bh = (isCapstone ? 0.36 : 0.40) + hash1(s + 1) * 0.14;
          const bd = 0.86 + hash1(s + 2) * 0.38;
          const col = stoneCols[Math.floor(hash1(s + 3) * stoneCols.length) % stoneCols.length];
          const geo = (typeof createIrregularFieldstoneGeo === 'function')
            ? createIrregularFieldstoneGeo(bw, bh, bd, s)
            : createOrganicBoxGeo(bw, bh, bd, s, 0.08, 0.94, 1);
          // 경사면에서도 떠 보이지 않도록 0번 줄을 지면 아래 묻고 자연석들이 빈틈없이 맞물려 쌓이도록 배치
          const by = gy - 0.10 + row * 0.31 + (hash1(s + 4) - 0.5) * 0.04;
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
    } else if (mx < -34 && mz > 48 && my > 1.8) {
      fCol.copy(cGolgotha);
    } else if (my > 2.0 && slopeFlat < 0.945) {
      // 산·언덕 경사면: 기존 사암/황토색과 초록색을 삼각형 패치 단위로 자연스럽게 혼합!
      const mtnMix = hash2(Math.floor(mx * 0.16) + 3.1, Math.floor(mz * 0.16) - 1.7);
      fCol.copy(cSlopeOchre).lerp(cSlopeGreen, 0.34 + mtnMix * 0.42);
    } else if (my > 6.8) {
      const topMix = hash2(Math.floor(mx * 0.18), Math.floor(mz * 0.18));
      fCol.copy(cHillTopGrass).lerp(cHillGreen, 0.25 + topMix * 0.50);
    } else if (my > 2.2) {
      const midMix = hash2(Math.floor(mx * 0.15) + 7.3, Math.floor(mz * 0.15));
      fCol.copy(cHillOlive).lerp(cHillGreen, 0.20 + midMix * 0.42);
    } else {
      // 평원은 따뜻한 황토와 지중해 연두색이 로우 폴리곤 면 단위로 자연스럽게 어우러지도록 패치 배색
      const patch = hash2(Math.floor(mx * 0.14), Math.floor(mz * 0.14));
      fCol.copy(cWarmMeadow).lerp(cSunlitOchre, 0.28 + patch * 0.56);
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

  const terrainMat = new THREE.MeshLambertMaterial({
    vertexColors: true,
    flatShading: true
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
        return new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color: 0x0284c7, transparent: true, opacity: 0.84, flatShading: true }));
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
  // 짐을 실은 당나귀들은 정지 프롭이 아니라 마을 길가를 살아 움직이며 순찰하도록 wanderingConfigs로 이동 배치!

  if (typeof addLowPolyCanopyTree === 'function') {
    [[74, -92, 1.35], [98, -76, 1.35], [-48, -32, 1.25], [58, -22, 1.25], [94, 68, 1.30]].forEach(([tx, tz, sc]) => {
      if (isNearSowerFarmPlot(tx, tz, 9.0)) return;
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
    if (Math.hypot(sx - 63, sz - 18) < 12.0) return;
    addLowPolyCactusAndScrub(sx, sz, 0.9 + (i % 3) * 0.15);
  });

  const rockSpots = [
    [66, -88, 1.7], [96, -68, 2.0], [-36, -48, 1.5], [34, -26, 1.6],
    [-44, -16, 1.8], [-58,  8, 2.1], [-74, 18, 1.9], [ 6,  18, 2.0],
    [12,  14, 1.6], [48,  18, 1.8], [-48, 72, 2.2], [-76, 74, 2.0],
    [72,  62, 1.7], [94,  68, 1.9], [-30, 88, 1.8]
  ];
  rockSpots.forEach(([rx, rz, rad], idx) => {
    if (isNearSowerFarmPlot(rx, rz, 8.0)) return;
    if (Math.hypot(rx - 63, rz - 18) < 12.0) return;
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

    miracleWanderingActors.push({
      kind: wc.kind,
      isAnimal: wc.kind !== 'person',
      isPackDonkey: wc.kind === 'donkey',
      mesh,
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
    const fl = createLowPolyMesh(new THREE.DodecahedronGeometry(0.20, 0), '#fb923c', bx, 1.50, -1.55, false);
    fl.userData._emissiveGlow = true;
    outerGateGrp.add(br, fl);
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
    const flame   = createLowPolyMesh(new THREE.DodecahedronGeometry(0.22, 0), '#fb923c', sx, 1.88, -9.2, false);
    flame.userData._emissiveGlow = true;
    templeGrp.add(brazier, flame);
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
  // 1) 수가성 야곱의 우물 (x = -32, z = -12) — 비정형 석조 테두리·나무 지붕·물레·두레박·토기 항아리 디테일
  const wellY = getMiracleOpenWorldGroundHeight(-32, -12);
  const wellGrp = new THREE.Group();
  const wellBody = createLowPolyMesh(new THREE.CylinderGeometry(2.05, 2.30, 0.94, 9), '#94a3b8', 0, 0.47, 0);
  const wellRim = createLowPolyMesh(new THREE.TorusGeometry(1.78, 0.24, 5, 9), '#78716c', 0, 0.94, 0, false);
  wellRim.rotation.x = Math.PI / 2;
  // 우물 상단 비정형 석조 갓돌(8개 엇갈린 다면체 돌블록)
  for (let s = 0; s < 8; s++) {
    const a = (s / 8) * Math.PI * 2;
    const stone = createLowPolyMesh(
      new THREE.DodecahedronGeometry(0.46 + (s % 2) * 0.05, 0),
      s % 2 === 0 ? '#cbd5e1' : '#a8a29e',
      Math.cos(a) * 1.92, 1.08, Math.sin(a) * 1.92, false
    );
    stone.scale.set(1.25, 0.55, 1.10);
    stone.rotation.y = a;
    wellGrp.add(stone);
  }
  const wellWater = createLowPolyMesh(new THREE.CylinderGeometry(1.58, 1.58, 0.08, 9), '#0284c7', 0, 0.98, 0, false);
  const postL = createLowPolyMesh(new THREE.CylinderGeometry(0.12, 0.15, 2.65, 6), '#5c2d0c', -1.65, 1.85, 0);
  const postR = createLowPolyMesh(new THREE.CylinderGeometry(0.12, 0.15, 2.65, 6), '#5c2d0c',  1.65, 1.85, 0);
  const roller = createLowPolyMesh(new THREE.CylinderGeometry(0.11, 0.11, 3.45, 6), '#854d0e', 0, 2.62, 0, false);
  roller.rotation.z = Math.PI / 2;
  const rope = createLowPolyMesh(new THREE.CylinderGeometry(0.03, 0.03, 1.15, 4), '#d6b685', 0, 2.05, 0, false);
  const bucket = createLowPolyMesh(new THREE.CylinderGeometry(0.24, 0.19, 0.34, 7), '#92400e', 0, 1.48, 0, false);
  // 경사진 소프트 로우폴리 나무 지붕
  const roofL = createLowPolyMesh(new THREE.BoxGeometry(3.95, 0.14, 1.45), '#9a4f25', 0, 3.32, -0.58);
  roofL.rotation.x = -0.46;
  const roofR = createLowPolyMesh(new THREE.BoxGeometry(3.95, 0.14, 1.45), '#8c441e', 0, 3.32,  0.58);
  roofR.rotation.x =  0.46;
  const ridge = createLowPolyMesh(new THREE.CylinderGeometry(0.10, 0.10, 4.05, 5), '#5c2d0c', 0, 3.64, 0, false);
  ridge.rotation.z = Math.PI / 2;
  const wellJar = createOrganicAmphoraProp(0.95, '#b86232', '#8f471e');
  wellJar.position.set(1.95, 0, 1.45);
  wellGrp.add(wellBody, wellRim, wellWater, postL, postR, roller, rope, bucket, roofL, roofR, ridge, wellJar);
  wellGrp.position.set(-32, wellY, -12);
  worldGroup.add(wellGrp);
  colliders.push({ minX: -34.4, maxX: -29.6, minZ: -14.4, maxZ: -9.6 });

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
      { minX: -29.0, maxX: -15.0, minZ: 86.5, maxZ: 98.0, cx: -22, cz: 92 }    // 동산 무덤
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
  colliders.push({ minX: -27.5, maxX: -16.5, minZ: 88.5, maxZ: 96.5 });

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
    miracleAmbientProps.push({ kind: 'cloud', mesh: cl, baseX: cx, speed: 0.35 + (c % 3) * 0.12 });
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
  syncMiracleMainStageSequentialBeams();
  miracleEventSpots.forEach(ev => {
    const showMarker = !missionRunning;
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
      greetingText: '"할렐루야! 그때 거센 폭풍우를 말씀 한마디로 잠잠하게 하신 예수님의 권능은 정말 놀라웠어! 다음 여정도 힘내서 다녀오게!"'
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
      greetingText: '"반가워! 어린아이의 작은 도시락 하나로 오천 명이 배불리 먹고 열두 광주리나 남았던 기적을 우리 모두 잊지 못할 거야!"'
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
      greetingText: '"구레네 시몬처럼 예수님과 함께 골고다 언덕까지 십자가를 지고 올라가 주어서 정말 고마워요! 우리를 향한 예수님의 크신 사랑을 기억해요."'
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
      greetingText: '"예수님께서 말씀하시던 대로 다시 살아나셨어요! 이제 부활하신 예수님의 증언들을 만나고 동남쪽 감람산으로 올라가 보세요!"'
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
      greetingText: '"볼지어다 내가 세상 끝날까지 너희와 항상 함께 있으리라!"',
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
      introText: '"열린 문 너머로 예수님이 말씀을 가르치고 계시지만 사람들이 가득해 들어갈 수가 없어요! 저희와 함께 들것을 메고 오른쪽 외벽 돌계단을 따라 집 지붕 위로 올라가 주세요!"',
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
      npcPreset: 'zacchaeus',
      speaker: '여리고 주민',
      introText: '"예수님과 많은 군중이 여리고 나무 숲길로 오셨어요! 키 작은 세리장 삭개오가 여러 나무 중 한 그루 위에 올라가 숨어 있으니 나무들을 살펴 찾아보세요!"',
      greetingText: '"할렐루야! 예수님께서 오늘 삭개오의 집에 머무시며 구원이 이 집에 이르렀다고 선포하셨어요!"',
      missionType: 'find_observe',
      zacchaeusGrove: true,
      findTargetPos: { x: 38, y: 3.0, z: -2 },
      findTargetLabel: '🌳 나무 위에 올라간 삭개오 발견!',
      completeSpeaker: '예수님과 삭개오',
      completeText: '"삭개오야 속히 내려오라 내가 오늘 네 집에 유하여야 하겠다! ... 주여 보시옵소서 내 소유의 절반을 가난한 자들에게 주겠사오며!" (눅 19:1~10)',
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
      title: '🌳 [비유 미니게임 4] 겨자씨 비유: 작은 씨앗의 성장',
      x: 42, z: -20,
      color: 0xa3e635,
      npcPreset: 'child',
      speaker: '천국 겨자씨 비유',
      introText: '"[📖 예수님이 들려주신 비유] 모든 씨보다 작은 겨자씨 한 알이 자라나 새들이 깃드는 큰 나무가 되도록, 주변의 생명수 물방울 3개를 모아 새싹에 주세요!"',
      greetingText: '"작은 겨자씨 한 알이 이렇게 큰 나무로 자라났어요! 우리 마음속 천국의 믿음도 이렇게 무럭무럭 자라날 거예요!"',
      missionType: 'collect_deliver',
      itemCount: 3,
      itemColor: '#38bdf8',
      itemLabel: '💧 새싹을 키우는 물방울',
      targetOffset: { x: 4, z: 0 },
      targetLabel: '🌱 작은 겨자씨 새싹',
      completeSpeaker: '예수님',
      completeText: '"천국은 마치 사람이 자기 밭에 갖다 심은 겨자씨 한 알 같으니 이는 모든 씨보다 작은 것이로되 자란 후에는 풀보다 커서 나무가 되매 공중의 새들이 와서 그 가지에 깃들이느니라!" (마 13:31~32)',
      unlockNotebookIds: ['par_mustard'],
      quiz: {
        q: '가장 작은 겨자씨가 자라나면 어떻게 되나요?',
        opts: ['큰 나무가 되어 공중의 새들이 와서 가지에 깃든다', '작은 풀잎으로 끝난다', '모래 속으로 사라진다'],
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
         (miracleDialogState && miracleDialogState.active);
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
    const isCompleted = ev.unlockNotebookIds && ev.unlockNotebookIds.every(id => miracleCollectedIds.has(id));
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

    miracleEventSpots.push({
      ...ev,
      ...marker,
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

      const stemMat = new THREE.MeshLambertMaterial({ color: 0x84cc16, flatShading: true });
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.052, 1.05, 5), stemMat);
      stem.position.y = 0.52;

      const leafMat = new THREE.MeshLambertMaterial({ color: 0x4ade80, flatShading: true });
      const leafL = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.44, 4), leafMat);
      leafL.position.set(-0.14, 0.46, 0);
      leafL.rotation.z = 0.72;
      const leafR = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.44, 4), leafMat);
      leafR.position.set(0.14, 0.56, 0.06);
      leafR.rotation.z = -0.68;

      const earMat = new THREE.MeshLambertMaterial({ color: 0xfacc15, flatShading: true });
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
  showToast('🌱✨ 정성껏 가꾼 좋은 땅에 말씀의 씨앗을 흩뿌렸어요! 시간이 지나면 곡식이 자라나요!');

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
  } else if (fe.type === 'escort_guide') {
    const td = fe.targetZone ? Math.round(Math.hypot(playerPos.x - fe.targetZone.pos.x, playerPos.z - fe.targetZone.pos.z)) : 0;
    window.updateMiracleMissionStatusUI({
      title: `👣 ${shortTitle}`,
      goal: ev.id === 'ev_paralytic'
        ? '오른쪽 외벽 계단으로 올라가 지붕 위 목표 지점으로 가세요!'
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
    window.updateMiracleMissionStatusUI({
      title: `🔍 ${shortTitle}`,
      goal: ev.zacchaeusGrove
        ? '여리고 나무 숲 속 여러 나무 중 삭개오가 올라간 나무를 찾으세요!'
        : (ev.alleyRandomAura
          ? '마을 건물 사이에 있는 감사한 사마리아인을 찾으세요!'
          : (ev.thomasCutscene
            ? '마을 어딘가에 나타나신 부활의 예수님을 찾아 손의 못자국을 확인하세요!'
            : (ev.widowCutscene ? '성전 헌금함 앞 가난한 과부에게 다가가 관찰하세요!' : `${ev.findTargetLabel}을(를) 찾으세요!`))),
      progressText: fe.cutsceneActive ? '🎬 컷신 감상 중' : '탐색 중 (0/1)',
      extraText: ev.zacchaeusGrove ? '🌳 나무 위를 잘 살펴보세요!' : ''
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
  }
}

// -------------------------------------------------------------------------
// [공용 무떨림(Zero-Jitter) 건물 우회 NPC 보행 AI & 미션 종료 후 제자리 귀가 시스템]
// - 건물 벽면을 절대 관통하지 않으면서 코너에서 좌우로 떨리며 멈추는 현상을 완전히 차단!
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

function stepMiracleNpcTowardTarget(state, targetX, targetZ, dt, now) {
  const m = state.mesh;
  if (!m) return 999;
  const dx = targetX - m.position.x;
  const dz = targetZ - m.position.z;
  const dTarget = Math.hypot(dx, dz);
  if (dTarget < 0.05) return dTarget;

  const baseAng = Math.atan2(dx, dz);
  const spd = state.speed || 4.0;
  const step = Math.min(dTarget, spd * dt);
  if (state.curHeading === undefined) state.curHeading = baseAng;
  if (state.avoidHoldTimer > 0) state.avoidHoldTimer -= dt;

  // 순이동 진척도 추적 (1.25초 동안 0.9m 미만 이동 시 코너 정체로 판정해 즉시 우회 탈출!)
  if (!state.progressAnchor) {
    state.progressAnchor = { x: m.position.x, z: m.position.z, timer: 0 };
  }
  state.progressAnchor.timer += dt;
  if (state.progressAnchor.timer >= 1.25) {
    const moved = Math.hypot(m.position.x - state.progressAnchor.x, m.position.z - state.progressAnchor.z);
    if (moved < 0.90) {
      // 코너 정체 시 반대쪽 우회 방향 전환 또는 인접 개방 지점으로 부드럽게 슬라이드
      state.avoidSide = state.avoidSide ? -state.avoidSide : 1;
      state.avoidHoldTimer = 1.6;
      state.stallCount = (state.stallCount || 0) + 1;
      if (state.stallCount >= 2) {
        const perpAng = baseAng + state.avoidSide * (Math.PI * 0.5);
        for (let r = 1.4; r <= 4.5; r += 0.9) {
          const ex = m.position.x + Math.sin(perpAng) * r;
          const ez = m.position.z + Math.cos(perpAng) * r;
          if (isMiracleNpcPointClear(ex, ez, 0.72)) {
            m.position.set(ex, getMiracleOpenWorldGroundHeight(ex, ez), ez);
            break;
          }
        }
        state.stallCount = 0;
      }
    } else {
      state.stallCount = 0;
    }
    state.progressAnchor = { x: m.position.x, z: m.position.z, timer: 0 };
  }

  const probeFar = Math.min(dTarget, Math.max(1.5, step + 1.0));
  const probeMid = Math.min(dTarget, Math.max(0.75, step + 0.35));
  const directClear = isMiracleNpcPointClear(m.position.x + Math.sin(baseAng) * step, m.position.z + Math.cos(baseAng) * step)
    && isMiracleNpcPointClear(m.position.x + Math.sin(baseAng) * probeMid, m.position.z + Math.cos(baseAng) * probeMid)
    && isMiracleNpcPointClear(m.position.x + Math.sin(baseAng) * probeFar, m.position.z + Math.cos(baseAng) * probeFar);

  let chosenAng = null;
  // 직선 경로가 완전히 열려있고, 우회 유지 타이머가 끝났을 때만 직진 복귀 (경계선 떨림 원천 차단!)
  if (directClear && (state.avoidHoldTimer || 0) <= 0) {
    chosenAng = baseAng;
    state.avoidSide = 0;
  } else {
    // 최초 우회 방향을 결정론적으로 선택 (좌/우 4m 전방 여유 공간 비교 → 랜덤 플립 제거!)
    if (!state.avoidSide) {
      let scoreL = 0, scoreR = 0;
      [1.4, 2.8, 4.2].forEach((d) => {
        if (isMiracleNpcPointClear(m.position.x + Math.sin(baseAng + 0.95) * d, m.position.z + Math.cos(baseAng + 0.95) * d)) scoreL++;
        if (isMiracleNpcPointClear(m.position.x + Math.sin(baseAng - 0.95) * d, m.position.z + Math.cos(baseAng - 0.95) * d)) scoreR++;
      });
      state.avoidSide = (scoreL >= scoreR) ? 1 : -1;
      state.avoidHoldTimer = 1.15;
    }
    const s = state.avoidSide;
    // 선택된 우회 방향(s)을 우선 탐색하되, 현재 진행각(curHeading)과 연속성 높은 각도에 가산점 부여!
    const candOffsets = [
      0, s * 0.35, s * 0.70, s * 1.05, s * 1.38, s * 1.70,
      -s * 0.45, -s * 0.90, -s * 1.35, s * 2.05, -s * 2.05
    ];
    let bestScore = -1e9;
    for (let i = 0; i < candOffsets.length; i++) {
      const off = candOffsets[i];
      const ang = baseAng + off;
      const cx = m.position.x + Math.sin(ang) * step;
      const cz = m.position.z + Math.cos(ang) * step;
      const px = m.position.x + Math.sin(ang) * probeMid;
      const pz = m.position.z + Math.cos(ang) * probeMid;
      if (!isMiracleNpcPointClear(cx, cz) || !isMiracleNpcPointClear(px, pz)) continue;
      const farOk = isMiracleNpcPointClear(m.position.x + Math.sin(ang) * probeFar, m.position.z + Math.cos(ang) * probeFar) ? 1.2 : 0;
      const goalAlign = Math.cos(off);
      const headingDelta = Math.atan2(Math.sin(ang - state.curHeading), Math.cos(ang - state.curHeading));
      const smoothAlign = Math.cos(headingDelta);
      const sideBias = (off * s >= 0) ? 0.55 : -0.35;
      const sc = goalAlign * 1.15 + smoothAlign * 1.10 + farOk + sideBias;
      if (sc > bestScore) {
        bestScore = sc;
        chosenAng = ang;
      }
    }
    // 전방 probe가 좁은 틈에 걸렸을 때는 즉시 step 통과 가능한 최선 각도 선택
    if (chosenAng === null) {
      for (let i = 0; i < candOffsets.length; i++) {
        const ang = baseAng + candOffsets[i];
        const cx = m.position.x + Math.sin(ang) * step;
        const cz = m.position.z + Math.cos(ang) * step;
        if (isMiracleNpcPointClear(cx, cz, 0.50)) {
          chosenAng = ang;
          break;
        }
      }
    }
  }

  if (chosenAng !== null) {
    const nx = m.position.x + Math.sin(chosenAng) * step;
    const nz = m.position.z + Math.cos(chosenAng) * step;
    const ny = getMiracleOpenWorldGroundHeight(nx, nz);
    m.position.set(nx, ny, nz);
    state.curHeading = lerpAngle(state.curHeading, chosenAng, Math.min(1, dt * 10.0));
    m.rotation.y = state.curHeading;
  }

  // 속도에 비례한 자연스러운 보행/달리기 팔다리 모션
  const u = m.userData || {};
  const animRate = 0.011 + Math.min(0.012, spd * 0.0014);
  const sw = Math.sin(now * animRate + (state.phase || 0)) * Math.min(0.82, 0.42 + spd * 0.055);
  if (u.lLeg && u.rLeg) { u.lLeg.rotation.x = sw; u.rLeg.rotation.x = -sw; }
  if (u.lArm && u.rArm) { u.lArm.rotation.x = -sw * 0.58; u.rArm.rotation.x = sw * 0.58; }
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
      if (u.lArm && u.rArm) { u.lArm.rotation.x = 0; u.rArm.rotation.x = 0; }
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
      if (u.lArm && u.rArm) { u.lArm.rotation.x = 0; u.rArm.rotation.x = 0; }
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
        if (u.lArm && u.rArm) { u.lArm.rotation.x = 0; u.rArm.rotation.x = 0; }
      }
    }
  }
  // 엠마오 두 제자: 원래 서 있던 두 제자를 미션 완료 시 제자리(-48, 42)까지 함께 걸어 귀가!
  if (miracleActiveFieldEvent && Array.isArray(miracleActiveFieldEvent.reusedEscortNpcs)) {
    const walkHome = Boolean(miracleActiveFieldEvent.walkHomeEscortOnClear);
    miracleActiveFieldEvent.reusedEscortNpcs.forEach((entry, idx) => {
      const npc = entry.mesh;
      if (!npc) return;
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
        if (u.lArm && u.rArm) { u.lArm.rotation.x = 0; u.rArm.rotation.x = 0; }
      }
    });
  }
  // 아침식사 낚시·모닥불 미션 정리: 낚싯대 제거, 플레이어 착석 자세 복원, 숨겼던 기존 NPC·불꺼진 모닥불 복원
  let needCamSnap = false;
  if (miracleActiveFieldEvent && miracleActiveFieldEvent.breakfastState) {
    const bs = miracleActiveFieldEvent.breakfastState;
    needCamSnap = true;
    if (bs.rodMesh && bs.rodMesh.parent) bs.rodMesh.parent.remove(bs.rodMesh);
    if (bs.hiddenSpotNpc) bs.hiddenSpotNpc.visible = true;
    if (playerLimbs) {
      if (playerLimbs.lLeg) playerLimbs.lLeg.rotation.x = 0;
      if (playerLimbs.rLeg) playerLimbs.rLeg.rotation.x = 0;
      if (playerLimbs.lArm) playerLimbs.lArm.rotation.x = 0;
      if (playerLimbs.rArm) playerLimbs.rArm.rotation.x = 0;
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
  miracleWorldMissionObjects.forEach(obj => {
    if (obj.mesh && !obj.keepInWorld) worldGroup.remove(obj.mesh);
    if (obj.label) obj.label.remove();
  });
  miracleWorldMissionObjects = [];
  miracleActiveFieldEvent = null;
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

    showToast(`🎯 [${evSpot.itemLabel}] ${count}개를 찾아 목표 장소로 옮겨 주세요!`);
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
    const soilMat = new THREE.MeshLambertMaterial({ color: 0xa68a64, flatShading: true });
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
    showToast(`⛰️ ${pickedPlot.areaName} 근처에 있는 거친 밭 구역을 먼저 찾아가 보세요!`);
  } else if (evSpot.missionType === 'escort_guide') {
    const eGrp = new THREE.Group();
    if (evSpot.escortType === 'stretcher') {
      // 들것 손잡이 막대 2개 + 나무 틀 + 베개 + 들것 영역(z ∈ [-1.2, +1.2]) 안에 정확히 누워 있는 중풍병자!
      const poleL = createLowPolyMesh(new THREE.CylinderGeometry(0.055, 0.055, 3.05, 6), '#78350f', -0.68, 0.66, 0, false);
      poleL.rotation.x = Math.PI * 0.5;
      const poleR = createLowPolyMesh(new THREE.CylinderGeometry(0.055, 0.055, 3.05, 6), '#78350f',  0.68, 0.66, 0, false);
      poleR.rotation.x = Math.PI * 0.5;
      const bedPad = createLowPolyMesh(new THREE.BoxGeometry(1.32, 0.14, 2.35), '#b45309', 0, 0.66, 0, true);
      const sheet  = createLowPolyMesh(new THREE.BoxGeometry(1.18, 0.06, 2.15), '#f5ead6', 0, 0.75, 0, false);
      const pillow = createLowPolyMesh(new THREE.DodecahedronGeometry(0.22, 0), '#fffbeb', 0, 0.82, -0.82, false);
      pillow.scale.set(1.55, 0.45, 0.85);

      const f1 = createLowPolyPersonMesh('disciple', 1); f1.position.set(-0.78, 0, -1.05);
      const f2 = createLowPolyPersonMesh('disciple', 2); f2.position.set( 0.78, 0, -1.05);
      const f3 = createLowPolyPersonMesh('disciple', 3); f3.position.set(-0.78, 0,  1.05);
      const f4 = createLowPolyPersonMesh('disciple', 4); f4.position.set( 0.78, 0,  1.05);

      // 발바닥 원점(y=0) → rotation.x = -PI/2 시 머리가 -Z(-1.68)로 가므로 z=+0.86으로 중앙 정렬 (z ∈ [-0.82, +0.86] ⊂ [-1.2, +1.2]!)
      const patient = createLowPolyPersonMesh('villager', 5);
      patient.scale.set(0.82, 0.82, 0.82);
      patient.rotation.x = -Math.PI * 0.5;
      patient.position.set(0, 0.82, 0.86);

      const stretcherOnly = new THREE.Group();
      stretcherOnly.add(poleL, poleR, bedPad, sheet, pillow, patient);
      eGrp.add(stretcherOnly, f1, f2, f3, f4);
      eGrp.userData = { stretcherOnly, friends: [f1, f2, f3, f4], patient };
    } else if (evSpot.escortType === 'children') {
      const c1 = createLowPolyPersonMesh('child', 1); c1.position.set(-0.6, 0, 0);
      const c2 = createLowPolyPersonMesh('child', 2); c2.position.set( 0.6, 0, 0.2);
      eGrp.add(c1, c2);
    } else if (evSpot.escortType === 'emmaus' && evSpot.npcMesh) {
      // [엠마오 제자 미션] 원래 서 있던 두 제자(글로바 + 친구) 본인이 직접 움직여 동행하고 완료 후 제자리로 걸어 귀가!
      const reusedList = [];
      const attachOriginal = (npcMesh, localX, localZ, homeX, homeZ) => {
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
        eGrp.add(npcMesh);
        npcMesh.position.set(localX, 0, localZ);
        npcMesh.rotation.y = 0;
      };
      attachOriginal(evSpot.npcMesh, -0.62, 0, cx, cz);
      if (evSpot.companionNpc) {
        attachOriginal(evSpot.companionNpc, 0.62, -0.15, cx + 1.05, cz - 0.25);
      } else {
        const d2 = createLowPolyPersonMesh('disciple', 4); d2.position.set(0.62, 0, 0);
        eGrp.add(d2);
      }
      miracleActiveFieldEvent.reusedEscortNpcs = reusedList;
    } else {
      const d1 = createLowPolyPersonMesh('disciple', 3); d1.position.set(-0.65, 0, 0);
      const d2 = createLowPolyPersonMesh('disciple', 4); d2.position.set( 0.65, 0, 0);
      eGrp.add(d1, d2);
    }

    const startY = getMiracleOpenWorldGroundHeight(cx, cz);
    eGrp.position.set(cx, startY, cz + 1.5);
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

    showToast(evSpot.randomTreeGoal
      ? '✨ 멀리 있는 나무 아래 계신 예수님께 어린이들을 인도하세요!'
      : (evSpot.randomEmmausGoal
        ? '🍞 엠마오 두 제자와 함께 마을 어딘가의 식탁에서 기다리시는 예수님을 찾아 동행하세요!'
        : `👣 일행과 함께 [${evSpot.goalLabel}] 위치까지 걸어가세요!`));
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
        const safePos = findSafeOpenWorldOutdoorPos({ cx: cand.x, cz: cand.z, minDist: 0.5, maxDist: 4.5, pad: 1.0 });
        recipients.push({ x: safePos.x, y: safePos.y, z: safePos.z, name: cand.name, told: false });
      }
    }
    while (recipients.length < 3) {
      const p = findSafeOpenWorldOutdoorPos({ cx, cz, minDist: 14, maxDist: 42, minSpacing: 12, avoidList: recipients });
      recipients.push({ x: p.x, y: p.y, z: p.z, name: `수가성 주민 ${recipients.length + 1}`, told: false });
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
    showToast('🏃‍♀️ 수가성 여인이 주민 3명에게 달려가요! 15m 이상 멀어지지 않게 따라가세요!');
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
    showToast('🐑 언덕 아래 광야에 잃어버린 어린양이 있어요! 가까이 가면 빠르게 도망치니 잘 쫓아가 보세요!');
  } else if (evSpot.missionType === 'find_observe') {
    let fx = evSpot.findTargetPos.x;
    let fz = evSpot.findTargetPos.z;
    let fy = getMiracleOpenWorldGroundHeight(fx, fz);

    if (evSpot.zacchaeusGrove) {
      // [삭개오 미션] 6그루 나무 숲 중 랜덤 1그루 위에 삭개오 배치 + 주변에 군중(12명) & 예수님 등장!
      const grove = Array.isArray(window.miracleZacchaeusGroveTrees) && window.miracleZacchaeusGroveTrees.length > 0
        ? window.miracleZacchaeusGroveTrees
        : [{ x: 38, z: -2, scale: 1.55 }];
      const chosenTree = grove[Math.floor(Math.random() * grove.length)];
      fx = chosenTree.x + 1.05 * (chosenTree.scale || 1.5) * 0.72;
      fz = chosenTree.z + 0.38 * (chosenTree.scale || 1.5) * 0.72;
      const tBaseY = getMiracleOpenWorldGroundHeight(chosenTree.x, chosenTree.z);
      fy = tBaseY + 2.55 * (chosenTree.scale || 1.5) * 0.86;

      // 군중(12명) + 예수님 스폰
      const crowdGrp = new THREE.Group();
      const jesusX = 36.2, jesusZ = -5.8;
      const jesusY = getMiracleOpenWorldGroundHeight(jesusX, jesusZ);
      const jesusNpc = createLowPolyPersonMesh('jesus', 0);
      jesusNpc.position.set(jesusX, jesusY, jesusZ);
      jesusNpc.lookAt(chosenTree.x, jesusY, chosenTree.z);
      crowdGrp.add(jesusNpc);

      for (let ci = 0; ci < 12; ci++) {
        const ang = (ci / 12) * Math.PI * 2 + 0.25;
        const rad = 2.6 + (ci % 3) * 1.15;
        const px = jesusX + Math.cos(ang) * rad;
        const pz = jesusZ + Math.sin(ang) * rad;
        const py = getMiracleOpenWorldGroundHeight(px, pz);
        const preset = ci % 3 === 0 ? 'woman' : (ci % 4 === 0 ? 'child' : 'villager');
        const cNpc = createLowPolyPersonMesh(preset, 70 + ci);
        cNpc.position.set(px, py, pz);
        cNpc.lookAt(jesusX, py, jesusZ);
        crowdGrp.add(cNpc);
      }
      worldGroup.add(crowdGrp);
      miracleWorldMissionObjects.push({ mesh: crowdGrp });
      miracleActiveFieldEvent.crowdGroup = crowdGrp;
      miracleActiveFieldEvent.crowdCenter = { x: jesusX, z: jesusZ };

      const fGrp = new THREE.Group();
      const zacMesh = createLowPolyPersonMesh('zacchaeus', 5);
      zacMesh.scale.set(0.84, 0.84, 0.84);
      // 나무 가지 위에 걸터앉은 포즈
      if (zacMesh.userData && zacMesh.userData.lLeg && zacMesh.userData.rLeg) {
        zacMesh.userData.lLeg.rotation.x = -1.1;
        zacMesh.userData.rLeg.rotation.x = -1.1;
      }
      fGrp.add(zacMesh);
      fGrp.position.set(fx, fy, fz);
      fGrp.lookAt(jesusX, fy, jesusZ);
      worldGroup.add(fGrp);

      const fLbl = createWorldLabel(evSpot.findTargetLabel);
      fLbl.style.opacity = '0';
      const targetObj = { mesh: fGrp, pos: new THREE.Vector3(fx, fy + 0.6, fz), label: fLbl, treePos: { x: chosenTree.x, z: chosenTree.z } };
      miracleWorldMissionObjects.push(targetObj);
      miracleActiveFieldEvent.targetZone = targetObj;
      showToast('🌳 예수님과 군중이 여리고 숲길에 모였어요! 여러 나무 중 삭개오가 숨어있는 나무를 찾아보세요!');
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
      showToast('🙏 마을 건물 사이 어딘가에서 하나님께 감사드리는 사마리아인을 찾아보세요!');
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
      showToast('🪙 성전 헌금함 앞에 있는 가난한 과부에게 다가가 보세요!');
    } else if (evSpot.thomasCutscene) {
      // [부활 이후 도마 미션] 예수님 위치를 매번 안전한 야외 랜덤 좌표로 스폰! + 무릎 높이 파형·파티클 오라 + 양손 못자국 컷신
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
      showToast('✨ 마을 어딘가에 나타나신 부활의 예수님을 찾아 손의 못자국을 확인해 보세요!');
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
      showToast(`🔍 주변을 살펴 [${evSpot.findTargetLabel}] 가까이 다가가 보세요!`);
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
    showToast(`🎣 갈릴리 바닷가에서 장대 낚시줄을 멀리 던져 물고기 ${reqFish}마리를 잡아 보세요!`);
  }

  syncMiracleMissionStatusPanel();
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

    if (typeof addJudeanRoadsideBuilding === 'function') {
      addJudeanRoadsideBuilding(evSpot.x + 5, evSpot.z - 3, 1, 0, 0.92, false);
    }
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

  if (evSpot.id === 'par_mustard' && !evSpot._treeGrown) {
    evSpot._treeGrown = true;
    if (typeof addLowPolyCanopyTree === 'function') addLowPolyCanopyTree(evSpot.x + 4, evSpot.z, 1.45, true);
    else createLowPolySycamoreTree(evSpot.x + 4, evSpot.z, 1.65);
  }

  playSfx('clear');
  openMiracleDialog({
    speaker: evSpot.completeSpeaker || '예수님',
    category: evSpot.category || 'story',
    text: evSpot.completeText,
    quiz: (currentMode === 'kinder') ? null : evSpot.quiz,
    btnText: '📖 복음서 수첩에 기록 완료!'
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

  // =========================================================================
  // [전용 컷신 1] 중풍병자 옥상 망치질 → 옥상 파편 부서짐 → 4줄 밧줄 하강 컷신
  // =========================================================================
  if (fe.cutsceneActive && fe.cutsceneType === 'paralytic_roof') {
    fe.cutsceneTimer += dt;
    const eg = fe.escortGroup ? fe.escortGroup.mesh : null;
    const holeX = evSpot.goalPos.x - 1.2;
    const holeZ = evSpot.goalPos.z - 0.8;
    const roofY = fe.cutsceneProps ? fe.cutsceneProps.roofY : playerPos.y;

    if (fe.cutscenePhase === 'hammer') {
      // 측면 드라마틱 클로즈업 앵글
      const camX = holeX + 5.8 + Math.sin(fe.cutsceneTimer * 0.5) * 0.8;
      const camZ = holeZ + 5.6;
      camera.position.lerp(new THREE.Vector3(camX, roofY + 4.0, camZ), Math.min(1, dt * 4.0));
      camera.lookAt(holeX, roofY + 0.7, holeZ);

      if (eg) {
        eg.position.lerp(new THREE.Vector3(holeX, roofY, holeZ), dt * 3.5);
        eg.rotation.y = lerpAngle(eg.rotation.y, 0, dt * 3.5);
      }

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
        // 깨진 가장자리 돌·흙 조각 테두리
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

      if (fe.cutsceneTimer > 1.55) {
        fe.cutscenePhase = 'lower';
        fe.cutsceneTimer = 0;
        showToast('🪢 네 친구가 밧줄 4줄로 중풍병자 들것을 예수님 앞으로 조심스레 내립니다!');

        // 4줄 밧줄(지붕 구멍 네 모서리 ↔ 들것 네 모서리) 생성
        const ropes = [];
        [[-0.68, -1.05], [0.68, -1.05], [-0.68, 1.05], [0.68, 1.05]].forEach(([rx, rz]) => {
          const rMesh = createLowPolyMesh(new THREE.CylinderGeometry(0.032, 0.032, 1.0, 5), '#e5c687', holeX + rx, roofY, holeZ + rz, false);
          worldGroup.add(rMesh);
          miracleWorldMissionObjects.push({ mesh: rMesh });
          ropes.push({ mesh: rMesh, rx, rz });
        });
        fe.cutsceneProps.ropes = ropes;
      }
    } else if (fe.cutscenePhase === 'lower') {
      // 하이앵글 하강 전용 시네마틱 카메라 (지붕 구멍 아래를 내려다봄!)
      const p = Math.min(1, fe.cutsceneTimer / 3.2);
      const camAng = 0.55 + p * 0.65;
      camera.position.lerp(new THREE.Vector3(holeX + Math.cos(camAng) * 5.2, roofY + 5.8 - p * 0.8, holeZ + Math.sin(camAng) * 5.2), Math.min(1, dt * 3.5));
      camera.lookAt(holeX, roofY - p * 1.4, holeZ);

      const dropDepth = p * 3.1;
      if (eg && eg.userData && eg.userData.stretcherOnly) {
        eg.userData.stretcherOnly.position.y = -dropDepth;
        // 네 친구는 옥상 구멍 가장자리에 남아 몸을 앞으로 숙이며 밧줄을 내리는 모션!
        if (Array.isArray(eg.userData.friends)) {
          eg.userData.friends.forEach(fr => {
            if (fr.userData && fr.userData.lArm && fr.userData.rArm) {
              fr.userData.lArm.rotation.x = -0.85 + Math.sin(tSec * 4) * 0.15;
              fr.userData.rArm.rotation.x = -0.85 - Math.sin(tSec * 4) * 0.15;
            }
          });
        }
      } else if (eg) {
        eg.position.y = roofY - dropDepth;
      }

      if (fe.cutsceneProps && Array.isArray(fe.cutsceneProps.ropes)) {
        const len = Math.max(0.15, dropDepth + 0.55);
        fe.cutsceneProps.ropes.forEach(rp => {
          rp.mesh.scale.set(1, len, 1);
          rp.mesh.position.set(holeX + rp.rx, roofY - len * 0.5 + 0.55, holeZ + rp.rz);
        });
      }

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
      finishMiracleFieldEvent(evSpot);
      return;
    }
    syncMiracleMissionStatusPanel();
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
        fe.carrying++;
        playSfx('rescue');
        showToast(`✨ ${evSpot.itemLabel} 획득! (${fe.collected + fe.carrying}/${fe.required}) · 목표 지점으로 가져가세요!`);
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
        showToast(`🌾 ${sf.areaName} 밭 구역을 찾았어요! 주변과 건물 2층 옥상에서 씨앗 바구니 ${sf.seedTotal}개를 찾아오세요!`);
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
          showToast(`🧺 씨앗 바구니 획득! (${sf.seedsCollected}/${sf.seedTotal})`);
        }
      });
      if (sf.seedsCollected >= sf.seedTotal) {
        sf.phase = 'clear_rocks';
        if (sf.beaconRing && sf.beaconRing.material) sf.beaconRing.material.color.setHex(0xf97316);
        sf.plotLbl.innerHTML = `🪨 밭의 돌을 모두 치우세요! (0/${sf.rocks.length})`;
        playSfx('build');
        showToast(`🪨 씨앗 바구니 ${sf.seedTotal}개를 모두 모았어요! 밭으로 돌아가 돌 ${sf.rocks.length}개를 모두 치워 주세요!`);
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
          showToast(`🪨 돌을 치웠어요! (${sf.rocksCleared}/${sf.rocks.length})`);
        }
      });
      if (sf.rocksCleared >= sf.rocks.length) {
        sf.phase = 'clear_thorns';
        if (sf.beaconRing && sf.beaconRing.material) sf.beaconRing.material.color.setHex(0x84cc16);
        sf.plotLbl.innerHTML = `🌿 가시덤불과 잡초 제거 (0/${sf.thorns.length})`;
        playSfx('rescue');
        showToast(`🌿 돌을 모두 치웠어요! 이제 밭 안의 가시덤불과 잡초 ${sf.thorns.length}개를 모두 제거해 주세요!`);
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
          showToast(`🌿 가시덤불·잡초 제거! (${sf.thornsCleared}/${sf.thorns.length})`);
        }
      });
      if (sf.thornsCleared >= sf.thorns.length) {
        sf.phase = 'level_soil';
        if (sf.beaconRing && sf.beaconRing.material) sf.beaconRing.material.color.setHex(0x4ade80);
        sf.plotLbl.innerHTML = `🪴 울퉁불퉁한 흙을 고르게 정돈하세요! (0/${sf.mounds.length})`;
        playSfx('rescue');
        showToast(`🪴 가시덤불과 잡초를 다 뽑았어요! 이제 밭의 울퉁불퉁한 흙 ${sf.mounds.length}줄을 밟아 고르게 정돈해 주세요!`);
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
          showToast(`🪴 좋은 땅 이랑 완성! (${sf.moundsLeveled}/${sf.mounds.length})`);
        }
      });
      if (sf.moundsLeveled >= sf.mounds.length) {
        sf.phase = 'ready_to_sow';
        sf.plotLbl.innerHTML = '🌱 좋은 땅 완성! [씨앗 뿌리기] 버튼을 누르세요!';
        const btnWrap = document.getElementById('miracle-sower-btn-wrap');
        if (btnWrap) btnWrap.classList.remove('hidden');
        playSfx('rescue');
        showToast('🌱✨ 부드러운 좋은 땅(옥토)이 완성되었어요! 아래 [좋은 땅에 씨앗 뿌리기!] 버튼을 눌러 주세요!');
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
  } else if (fe.type === 'escort_guide') {
    if (fe.escortGroup) {
      const eg = fe.escortGroup.mesh;
      const prevX = eg.position.x, prevZ = eg.position.z;
      const targetX = playerPos.x - Math.sin(playerFacing) * 1.9;
      const targetZ = playerPos.z - Math.cos(playerFacing) * 1.9;
      eg.position.x = THREE.MathUtils.lerp(eg.position.x, targetX, dt * 6.5);
      eg.position.z = THREE.MathUtils.lerp(eg.position.z, targetZ, dt * 6.5);
      eg.position.y = THREE.MathUtils.lerp(eg.position.y, playerPos.y, dt * 8.0);
      eg.rotation.y = playerFacing;
      const moveSpeed = Math.hypot(eg.position.x - prevX, eg.position.z - prevZ) / Math.max(0.001, dt);
      // 동행하는 원래 엠마오 두 제자의 보행 팔다리 애니메이션
      if (Array.isArray(fe.reusedEscortNpcs)) {
        fe.reusedEscortNpcs.forEach((entry, idx) => {
          const u = (entry.mesh && entry.mesh.userData) ? entry.mesh.userData : {};
          const sw = moveSpeed > 0.35 ? Math.sin(now * 0.014 + idx * 1.4) * 0.58 : 0;
          if (u.lLeg && u.rLeg) { u.lLeg.rotation.x = sw; u.rLeg.rotation.x = -sw; }
          if (u.lArm && u.rArm) { u.lArm.rotation.x = -sw * 0.52; u.rArm.rotation.x = sw * 0.52; }
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
          showToast('🔨 무사히 지붕에 올라왔어요! 망치로 옥상을 뚫기 시작합니다!');
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
      const u = wm.userData || {};
      if (u.lLeg && u.rLeg) { u.lLeg.rotation.x = 0; u.rLeg.rotation.x = 0; }
      if (u.lArm && u.rArm) { u.lArm.rotation.x = 0; u.rArm.rotation.x = 0; }
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
        ms.avoidSide = 0;
        ms.avoidHoldTimer = 0;
        ms.progressAnchor = null;
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
    if (fe.targetZone) {
      const tz = fe.targetZone;
      const horizD = Math.hypot(playerPos.x - tz.pos.x, playerPos.z - tz.pos.z);
      updateWorldLabelPos(tz.label, tz.pos, horizD < (evSpot.zacchaeusGrove ? 7.5 : MIRACLE_TAG_DIST_SPOT));

      const triggerDist = evSpot.widowCutscene ? 4.2 : 3.7;
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
          // [삭개오 발견 시] 카메라를 군중·예수님이 없는 쪽으로 돌리고 군중·예수님·삭개오 즉시 사라지게 처리!
          const cc = fe.crowdCenter || { x: 36.2, z: -5.8 };
          const awayAngle = Math.atan2(playerPos.x - cc.x, playerPos.z - cc.z);
          cameraYaw = awayAngle;
          cameraTargetYaw = awayAngle;
          playerFacing = awayAngle;
          if (fe.crowdGroup) fe.crowdGroup.visible = false;
          if (tz.mesh) tz.mesh.visible = false;
          if (typeof snapCameraToPlayer === 'function') snapCameraToPlayer();
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

    if (isFishingPhase) {
      // 바닷가 낚시 시네마틱 카메라 (플레이어 + 낚싯대 + 이어진 낚시줄 + 갈릴리 바다 + 찌가 한눈에 담김)
      const camTargetPos = new THREE.Vector3(bs.standPos.x + 6.8, bs.standPos.y + 5.6, bs.standPos.z + 7.2);
      const lookX = bs.phase === 'waiting_bite' || bs.phase === 'bite_timing'
        ? (bs.standPos.x + bs.castTargetX) * 0.5
        : bs.standPos.x - 6.0;
      camera.position.lerp(camTargetPos, Math.min(1, dt * 4.0));
      camera.lookAt(lookX, bs.standPos.y + 0.6, bs.standPos.z);

      if (bs.phase === 'cast_ready') {
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
        if (playerLimbs && playerLimbs.rArm) {
          playerLimbs.rArm.rotation.x = -0.85 - bs.power * 0.72; // 힘을 모을수록 장대를 뒤로 젖힘!
        }
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
        if (playerLimbs && playerLimbs.rArm) {
          playerLimbs.rArm.rotation.x = THREE.MathUtils.lerp(-1.45, -0.55, u);
        }
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
              if (playerLimbs.rArm) playerLimbs.rArm.rotation.x = -0.35;
            }
            playSfx('rescue');
            showToast('🔥 물고기를 모두 잡았어요! 이제 예수님과 모닥불 옆에 앉아 물고기를 구워 먹어요!');
          } else {
            bs.phase = 'cast_ready';
            bs.power = 0;
            if (playerLimbs && playerLimbs.rArm) playerLimbs.rArm.rotation.x = -0.85;
          }
        }
      }
    } else {
      // 3) 모닥불 굽기 & 예수님과 아침식사 시네마틱 카메라
      const camFirePos = new THREE.Vector3(bs.firePos.x + 0.2, bs.firePos.y + 3.4, bs.firePos.z + 5.8);
      camera.position.lerp(camFirePos, Math.min(1, dt * 4.2));
      camera.lookAt(bs.firePos.x, bs.firePos.y + 0.95, bs.firePos.z + 0.25);

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
        if (playerLimbs && playerLimbs.rArm) {
          playerLimbs.rArm.rotation.x = -0.75 + Math.sin(tSec * 7.5) * 0.35;
        }
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

  if (dToPlayer < stopNearPlayerDist) {
    const facePlayerAng = Math.atan2(playerPos.x - curX, playerPos.z - curZ);
    actor.heading = lerpAngle(actor.heading || 0, facePlayerAng, dt * 8.0);
    m.rotation.y = actor.heading;
    if (u.lLeg && u.rLeg) { u.lLeg.rotation.x = 0; u.rLeg.rotation.x = 0; }
    if (u.lArm && u.rArm) { u.lArm.rotation.x = 0; u.rArm.rotation.x = 0; }
    if (u.flLeg && u.frLeg) { u.flLeg.rotation.x = 0; u.frLeg.rotation.x = 0; u.blLeg.rotation.x = 0; u.brLeg.rotation.x = 0; }
    return;
  }

  if (actor.waitTimer > 0) {
    actor.waitTimer -= dt;
    if (u.lLeg && u.rLeg) { u.lLeg.rotation.x = 0; u.rLeg.rotation.x = 0; }
    if (u.lArm && u.rArm) { u.lArm.rotation.x = 0; u.rArm.rotation.x = 0; }
    if (u.flLeg && u.frLeg) { u.flLeg.rotation.x = 0; u.frLeg.rotation.x = 0; u.blLeg.rotation.x = 0; u.brLeg.rotation.x = 0; }
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

  const walkSwing = Math.sin(now * 0.012 + (actor.phase || 0)) * 0.55;
  if (u.lLeg && u.rLeg) {
    u.lLeg.rotation.x = walkSwing;
    u.rLeg.rotation.x = -walkSwing;
  }
  if (u.lArm && u.rArm) {
    u.lArm.rotation.x = -walkSwing * 0.55;
    u.rArm.rotation.x = walkSwing * 0.55;
  }
  if (u.flLeg && u.frLeg && u.blLeg && u.brLeg) {
    u.flLeg.rotation.x = walkSwing * 0.8;
    u.brLeg.rotation.x = walkSwing * 0.8;
    u.frLeg.rotation.x = -walkSwing * 0.8;
    u.blLeg.rotation.x = -walkSwing * 0.8;
  }
  // 짐을 실은 당나귀는 걸을 때 머리 끄덕임과 양옆 짐보따리 흔들림 애니메이션 추가!
  if (u.isPackDonkey) {
    if (u.headGroup) u.headGroup.rotation.x = Math.sin(now * 0.012 + (actor.phase || 0)) * 0.10;
    if (u.packL) u.packL.rotation.z = Math.sin(now * 0.012 + (actor.phase || 0)) * 0.08;
    if (u.packR) u.packR.rotation.z = -Math.sin(now * 0.012 + (actor.phase || 0)) * 0.08;
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
  window.miracleWorldTreePositions = [];
  window.miracleZacchaeusGroveTrees = [];
  window.miracleReturningNpcs = [];
  window.miracleHarvestNodes = [];
  if (typeof window.hideMiracleMissionStatusUI === 'function') window.hideMiracleMissionStatusUI();

  scene.background = new THREE.Color(miracleIsPostResurrection ? 0x60a5fa : 0x7dd3fc);
  scene.fog = new THREE.Fog(miracleIsPostResurrection ? 0xbae6fd : 0xbae6fd, 125, 360);

  buildSoftLowPolyWorldTerrain();
  buildMiracleRegionalLandmarks();
  buildMiracleRoadsideVillagesAndForests();
  spawnMiracleMainStageSpots();
  spawnMiracleOptionalEventSpots();
  spawnMiracleRumorNpcs();

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
  updateMiracleNotebookHudBadge();
  updateStageHUD();

  showToast(
    miracleIsPostResurrection
      ? '✨ 부활 이후의 갈릴리와 예루살렘 오픈월드입니다! 엠마오·도마·바닷가 아침식사를 체험하고 감람산으로 오르세요!'
      : '🗺️ 성경 오픈월드에 오신 것을 환영합니다! 빛기둥이 켜진 순서(1→2→3→4)대로 메인 스테이지를 진행해 보세요!'
  );

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

  if (typeof updateMiracleDynamicSun === 'function') {
    updateMiracleDynamicSun(dt, now);
  }

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

  // 하늘을 날아다니는 소프트 로우 폴리곤 새 비행 & 날갯짓 시뮬레이션
  if (Array.isArray(window.miracleSkyBirds) && window.miracleSkyBirds.length > 0) {
    const tSec = now * 0.001;
    for (let i = 0; i < window.miracleSkyBirds.length; i++) {
      const b = window.miracleSkyBirds[i];
      if (!b || !b.mesh) continue;
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

  miracleEventSpots.forEach((ev) => {
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
        ? '✅ 수집한 말씀 (복음서 수첩에 기록됨)'
        : (rn.cat === 'eyewitness' ? '✅ 수집한 목격담 (복음서 수첩에 기록됨)' : '✅ 수집한 소문 (복음서 수첩에 기록됨)');
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
    if (fe.type === 'collect_deliver') {
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

  // [소년반(senior) 및 멀티플레이 전용 초슬림 미니 나침반/거리 내비게이터]
  if (typeof window.updateMiracleMiniNavigatorUI === 'function') {
    const showMiniNav = ((currentMode === 'senior' || isMpMode) && miracleSubMode === 'openworld' && Boolean(guideTarget));
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