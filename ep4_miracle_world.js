// =========================================================================
// [ep4_miracle_world.js - 파트 1/3] 에피소드 4 : 확장된 소프트 로우 폴리곤 오픈월드 지형·외곽 언덕·길가 마을·생태계
// - 가장자리 언덕 내부 진입 완벽 차단 (연속 충돌벽 Colliders + 경계 제한)
// - 계단으로 건물 2층 등반 후 인접한 옆 건물 옥상·2층으로 점프 이동할 수 있는 근접 마을 배치
// =========================================================================

let miracleWorldMissionObjects = [];
let miracleActiveFieldEvent = null;
let miracleWanderingActors = []; // 자연스럽게 걸어 다니는 마을 주민 & 초원 동물(사슴·양) 배열
let miracleGolgothaCrossesGroup = null; // 스테이지 3(예수님 십자가 사건)부터 등장하는 골고다 세 십자가 그룹
let miracleOpenWorldTombGroup = null; // 스테이지 3 클리어 후 모습을 드러내는 동산 돌 무덤 그룹
let miracleTombCoverGroup = null; // 스테이지 3 클리어 전까지 돌 무덤을 가려주는 풀·덤불 위장막
window.miracleSkyBirds = []; // 하늘을 날아다니는 소프트 로우 폴리곤 새 배열

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

  const hillCols = ['#7fa650', '#6d943e', '#8ab058', '#789c4a', '#8c8578'];

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
// 3-A. 언덕 중턱 계단식 비정형 돌담(Retaining Stone Walls) 생성기 (전체 1 드로우콜 병합)
// -------------------------------------------------------------------------
function buildHillsideStoneTerraceWalls() {
  const stoneWallGrp = new THREE.Group();
  const stoneCols = ['#e2d8c5', '#d5c7ae', '#c8b89d', '#ebe3d3', '#baa98d'];
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
      const stepCount = Math.max(2, Math.round(segLen / 1.15));

      for (let row = 0; row < courses; row++) {
        const stagger = (row % 2 === 0) ? 0.0 : 0.45;
        for (let k = 0; k < stepCount; k++) {
          const t = (k + 0.5 + stagger * 0.35) / stepCount;
          if (t > 1.0) continue;
          const sx = x0 + (x1 - x0) * t;
          const sz = z0 + (z1 - z0) * t;
          const gy = getMiracleOpenWorldGroundHeight(sx, sz);
          const s = seedBase + p * 71 + row * 31 + k * 7;
          const bw = 0.72 + hash1(s) * 0.24;
          const bh = 0.36 + hash1(s + 1) * 0.13;
          const bd = 1.02 + hash1(s + 2) * 0.38;
          const col = stoneCols[Math.floor(hash1(s + 3) * stoneCols.length) % stoneCols.length];
          const geo = (typeof createOrganicBoxGeo === 'function')
            ? createOrganicBoxGeo(bw, bh, bd, s, 0.08, 0.94, 1)
            : new THREE.BoxGeometry(bw, bh, bd);
          // 경사면에서도 떠 보이지 않도록 0번 줄을 지면 아래 깊이 묻어 단단히 쌓음
          const by = gy - 0.20 + row * 0.35 + (hash1(s + 4) - 0.5) * 0.04;
          const stone = createLowPolyMesh(geo, col, sx, by, sz, true);
          stone.rotation.y = yaw + (hash1(s + 5) - 0.5) * 0.10;
          stone.rotation.z = (hash1(s + 6) - 0.5) * 0.06;
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

  // 5) 마을 언덕길 가장자리 낮은 장식 돌담 (레퍼런스 이미지 스타일)
  addDryStoneWallCurve([[-24, -66], [-19, -58], [-20, -46]], 2, 461);
  addDryStoneWallCurve([[22, 14], [28, 22], [32, 32]], 2, 501);

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
  const cSlopeOchre   = new THREE.Color('#cf9f60'); // 언덕 경사면 사암/황토 면
  const cHillOlive    = new THREE.Color('#8ea854'); // 언덕 중턱 올리브 잔디 면
  const cHillTopGrass = new THREE.Color('#7c9a45'); // 언덕 정상 올리브 그린
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

    if (distFromShore < -1.2) {
      fCol.copy(cDeepSeaBed);
    } else if (distFromShore < 4.6 && my < 1.35 && !onGalileePierTrail) {
      // 해변 물가 가장자리만 짧게 모래색으로 표현 (넓은 모래사장이 아닌 4.5m 내외 해안 테두리)
      const sandT = Math.max(0, Math.min(1, (distFromShore + 1.2) / 5.8));
      fCol.copy(cShoreSand).lerp(cCoastalEarth, sandT * 0.28);
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
      // 언덕 사면의 따뜻한 사암/황토 로우폴리 층 표현 (레퍼런스 이미지 참고)
      fCol.copy(cSlopeOchre);
    } else if (my > 6.8) {
      fCol.copy(cHillTopGrass);
    } else if (my > 2.2) {
      fCol.copy(cHillOlive);
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

  // 서쪽 바다 수면 (확장된 해변 곡선과 자연스럽게 맞닿도록 서쪽 영역 충분히 확보)
  const seaGeo = new THREE.PlaneGeometry(310, 580, 34, 64);
  seaGeo.rotateX(-Math.PI / 2);
  const seaPos = seaGeo.attributes.position;
  for (let i = 0; i < seaPos.count; i++) {
    const sx = seaPos.getX(i);
    const sz = seaPos.getZ(i);
    seaPos.setY(i, Math.sin(sx * 0.08 + sz * 0.06) * 0.16);
  }
  seaGeo.computeVertexNormals();
  const seaMat = new THREE.MeshLambertMaterial({
    color: 0x0284c7,
    transparent: true,
    opacity: 0.86,
    flatShading: true
  });
  const wideWestSea = new THREE.Mesh(seaGeo, seaMat);
  wideWestSea.position.set(-242, -0.40, 0);
  wideWestSea.receiveShadow = true;
  worldGroup.add(wideWestSea);

  // 확장된 서쪽 해변(곡선 해안선 판정은 canMoveTo에서 정밀 연동)을 포함한 안전 이동 경계
  currentMapRectBounds = {
    minX: -120.0,
    maxX:  105.5,
    minZ: -105.5,
    maxZ:  105.5
  };

  // 서쪽 바다 해안 선착장(부두, x = -90, z = -68) 및 정박된 갈릴리 목선
  const pierGrp = new THREE.Group();
  pierGrp.add(
    createLowPolyMesh(new THREE.BoxGeometry(12.5, 0.35, 3.8), '#92400e', -90, 0.22, -68),
    createLowPolyMesh(new THREE.CylinderGeometry(0.22, 0.22, 2.4, 6), '#5c2d0c', -95.0, -0.5, -66.5),
    createLowPolyMesh(new THREE.CylinderGeometry(0.22, 0.22, 2.4, 6), '#5c2d0c', -95.0, -0.5, -69.5)
  );
  worldGroup.add(pierGrp);
  platforms.push({ minX: -96.5, maxX: -83.5, minZ: -70.0, maxZ: -66.0, topY: 0.40 });

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
    // [클러스터 2: 북부 가나 동쪽 가옥 구간]
    { x:  13.5, z: -88.5, v: 3, yaw: -Math.PI / 2, sc: 0.98 },
    { x:  13.5, z: -78.6, v: 2, yaw: -Math.PI / 2, sc: 0.96, m: 'stonebrick' },
    { x:  13.5, z: -69.0, v: 0, yaw: -Math.PI / 2, sc: 0.95 },
    // [클러스터 3: 갈릴리 서쪽 길가 가옥]
    { x: -15.5, z: -57.5, v: 3, yaw:  Math.PI / 2, sc: 0.96, m: 'stonebrick' },
    { x: -15.5, z: -47.6, v: 0, yaw:  Math.PI / 2, sc: 0.96 },
    // [클러스터 4: 가버나움 중풍병자 집(22, -52) 주변 (넓은 골목 간격 확보)]
    { x:  11.6, z: -52.0, v: 2, yaw:  0.0,         sc: 0.94 },
    { x:  35.5, z: -46.0, v: 1, yaw: -0.25,        sc: 0.98, m: 'stonebrick' },
    // [클러스터 5: 중북부 순례길 양옆 가옥]
    { x: -15.0, z: -32.2, v: 1, yaw:  Math.PI / 2, sc: 0.98 },
    { x: -15.0, z: -22.2, v: 4, yaw:  Math.PI / 2, sc: 0.95, m: 'stonebrick' },
    { x:  15.0, z: -31.2, v: 3, yaw: -Math.PI / 2, sc: 0.98 },
    { x:  15.0, z: -21.2, v: 0, yaw: -Math.PI / 2, sc: 0.96 },
    // [클러스터 6: 사마리아 · 여리고 입구 가옥]
    { x:  16.0, z: -11.2, v: 0, yaw: -Math.PI / 2, sc: 0.96, m: 'stonebrick' },
    { x:  16.0, z:  -1.4, v: 3, yaw: -Math.PI / 2, sc: 0.98 },
    { x:  52.5, z:  -9.2, v: 1, yaw: -Math.PI / 2, sc: 0.98 },
    { x:  52.5, z:   0.6, v: 0, yaw: -Math.PI / 2, sc: 0.96, m: 'stonebrick' },
    { x:  52.5, z:  10.2, v: 2, yaw: -Math.PI / 2, sc: 0.95 },
    // [클러스터 7: 유대 광야 ~ 예루살렘 성문 앞 가옥]
    { x: -15.0, z:  14.2, v: 0, yaw:  Math.PI / 2, sc: 0.96 },
    { x: -15.0, z:  24.0, v: 3, yaw:  Math.PI / 2, sc: 0.98, m: 'stonebrick' },
    { x: -15.0, z:  33.8, v: 1, yaw:  Math.PI / 2, sc: 0.96 },
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
    { x:  72.0, z:   8.0, v: 2, yaw: -1.85,        sc: 0.95, m: 'stonebrick' },
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
  createLowPolyDonkey(10.5, -24, -0.6);
  createLowPolyDonkey(-9.8,  16,  0.8);
  createLowPolyDonkey( 9.5,  54, -1.2);

  if (typeof addLowPolyCanopyTree === 'function') {
    addLowPolyCanopyTree( 74, -92, 1.35, true);
    addLowPolyCanopyTree( 98, -76, 1.35, true);
    addLowPolyCanopyTree(-48, -32, 1.25, true);
    addLowPolyCanopyTree( 58, -22, 1.25, true);
    addLowPolyCanopyTree( 94,  68, 1.30, true);
  }

  const oliveSpots = [
    [-42, -88], [-26, -88], [26, -84], [48, -88], [66, -98], [100, -92],
    [56, -54],  [96, -58],  [82, -100],[44, -72], [28, -66], [100, -72],
    [-38, -42], [28, -40],  [52, -36], [76, -40], [94, -28], [-56, -28],
    [-64, -16], [28, -18],  [68, -18], [92,  -4], [84,  18], [-48,   4],
    [-54,  28], [-38,  36], [36,  38], [62,  42], [94,  46], [ 98,  66],
    [68,   82], [92,   88], [76,  96], [48,  94], [-48, 92], [-32,  98],
    [-82,  48], [-86,  66], [-38, 60], [32,  98], [  4, 98]
  ];
  oliveSpots.forEach(([tx, tz], i) => {
    addLowPolyOliveTree(tx, tz, 1.0 + (i % 3) * 0.18, true);
  });

  const cypressSpots = [
    [-32, -98], [-12, -100], [ 8, -98], [28, -98], [64, -100], [98, -98],
    [-78, -36], [-72,  -22], [-80, -4], [-78, 26], [-82,  42],
    [-82,  72], [-78,   90], [-56, 96], [-40, 98], [-10, 100],
    [ 98,  28], [100,   48], [ 98, 82], [ 58, 98], [ 38, -88], [46, -94]
  ];
  cypressSpots.forEach(([cx, cz], i) => {
    addLowPolyCypressPineTree(cx, cz, 0.95 + (i % 3) * 0.22, true);
  });

  const palmSpots = [
    [-76, -72], [-72, -82], [-68, -56], [-74, -40], [-76, -14],
    [ 30,   4], [ 44,   4], [ 62,   2], [ 36,  14], [ -8,  42], [  8,  42]
  ];
  palmSpots.forEach(([px, pz], i) => {
    addLowPolyPalmTree(px, pz, 1.05 + (i % 2) * 0.18, true);
  });

  const cactusSpots = [
    [-54, -8], [-60,  2], [-56, 18], [-74,  8], [-64, 28],
    [ -4, 18], [ 28, 28], [ 48, 30], [-42, 24], [ 72, 26]
  ];
  cactusSpots.forEach(([sx, sz], i) => {
    addLowPolyCactusAndScrub(sx, sz, 0.9 + (i % 3) * 0.15);
  });

  const rockSpots = [
    [66, -88, 1.7], [96, -68, 2.0], [-36, -48, 1.5], [34, -26, 1.6],
    [-44, -16, 1.8], [-58,  8, 2.1], [-74, 18, 1.9], [ 6,  18, 2.0],
    [12,  14, 1.6], [48,  18, 1.8], [-48, 72, 2.2], [-76, 74, 2.0],
    [72,  62, 1.7], [94,  68, 1.9], [-30, 88, 1.8]
  ];
  rockSpots.forEach(([rx, rz, rad], idx) => {
    addLowPolyRock(rx, rz, rad, 0.78, idx % 2 === 0 ? '#94a3b8' : '#8c8275', true);
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
    { kind: 'sheep',  x:  56, z:  64, rad: 7.5, spd: 1.6 }
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
      isAnimal: wc.kind !== 'person',
      mesh,
      homeX: wc.x,
      homeZ: wc.z,
      targetX: wc.x + (Math.random() - 0.5) * wc.rad,
      targetZ: wc.z + (Math.random() - 0.5) * wc.rad,
      radius: wc.rad,
      speed: wc.spd,
      heading: Math.random() * Math.PI * 2,
      waitTimer: (idx % 3) * 0.8,
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

  // 2) 가버나움 중풍병자 치유 집 — 지붕으로 올라가는 외벽 돌계단 포함 (x = 22, z = -52)
  addLowPolyVillageHouse(22, -52, 8.8, 4.0, 7.0, '#ead7b7', '#c89654', true, 0, 0);

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

  // 2) 여리고 거리와 삭개오의 큰 돌무화과나무(뽕나무) (x = 38, z = -4)
  createLowPolySycamoreTree(38, -4, 1.55);

  // 3) 선한 사마리아인의 여리고 주막(여관) (x = 24, z = 24)
  addLowPolyVillageHouse(24, 24, 8.4, 4.0, 6.6, '#f2e3c9', '#ea580c', false, 2, 0);

  // [C. 남부 예루살렘 · 성전 · 다락방 · 골고다 · 빈 무덤 · 감람산 권역]
  // 1) & 2) 예루살렘 외곽 계단 성문(z = 46) + 예루살렘 성전 복합 단지(z = 72) 통합 빌드
  buildLowPolyJerusalemTempleComplex();

  // 3) 마가의 다락방 복층 석조 건물 (x = -24, z = 58)
  addLowPolyVillageHouse(-24, 58, 8.8, 4.3, 7.0, '#f2e3c9', '#c89654', true, 1, 0);

  // 4) 넓어진 골고다 언덕(x = -62, z = 78) 위의 세 십자가 — 십자가 스테이지(스테이지 3) 클리어 후에만 등장!
  const isStage3Cleared = Boolean(miracleMainStagesCleared[3] || miracleMainStagesCleared[4] || miracleIsPostResurrection);
  miracleGolgothaCrossesGroup = new THREE.Group();
  [[-62, 78, 1.38], [-68.5, 79.5, 1.05], [-55.5, 79.5, 1.05]].forEach(([cx, cz, sc]) => {
    const cy = getMiracleOpenWorldGroundHeight(cx, cz);
    // 바위 받침과 기둥 하단을 지면 아래로 살짝 깊게 심어 경사면에서도 절대 뜨지 않게 밀착!
    const mound = createLowPolyMesh(new THREE.DodecahedronGeometry(1.05 * sc, 0), '#78716c', cx, cy + 0.14 * sc, cz);
    mound.scale.set(1.30, 0.58, 1.30);
    const vBeam = createLowPolyMesh(new THREE.CylinderGeometry(0.20 * sc, 0.24 * sc, 5.7 * sc, 6), '#5c2d0c', cx, cy + 2.55 * sc, cz);
    const hBeam = createLowPolyMesh(new THREE.CylinderGeometry(0.16 * sc, 0.16 * sc, 3.2 * sc, 6), '#5c2d0c', cx, cy + 3.85 * sc, cz);
    hBeam.rotation.z = Math.PI / 2;
    miracleGolgothaCrossesGroup.add(mound, vBeam, hBeam);
  });
  miracleGolgothaCrossesGroup.visible = isStage3Cleared;
  worldGroup.add(miracleGolgothaCrossesGroup);

  // 5) 동산의 빈 무덤 다면체 바위 굴 외관 (x = -22, z = 92)
  //    - 스테이지 3 클리어 전까지는 풀·덤불 위장막으로 가려지고, 클리어 시 돌 무덤이 공개됨!
  const tombY = getMiracleOpenWorldGroundHeight(-22, 92);

  miracleOpenWorldTombGroup = new THREE.Group();
  const tombMound = createLowPolyMesh(new THREE.DodecahedronGeometry(5.2, 0), '#94a3b8', -22, tombY + 2.6, 92);
  tombMound.scale.set(1.38, 0.88, 1.05);
  const tombDarkEntrance = createLowPolyMesh(new THREE.BoxGeometry(2.2, 2.8, 1.2), '#1e293b', -21.5, tombY + 1.4, 87.4, false);
  const rolledStone = createLowPolyMesh(new THREE.CylinderGeometry(1.65, 1.65, 0.72, 10), '#cbd5e1', -18.2, tombY + 1.55, 88.2);
  rolledStone.rotation.x = Math.PI / 2;
  miracleOpenWorldTombGroup.add(tombMound, tombDarkEntrance, rolledStone);
  miracleOpenWorldTombGroup.visible = isStage3Cleared;
  worldGroup.add(miracleOpenWorldTombGroup);
  wallMeshes.push(tombMound);
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
    if (i % 3 === 0) addLowPolyCypressPineTree(tx, tz, 1.15, true);
    else if (i % 4 === 0) addLowPolyPalmTree(tx, tz, 1.15, true);
    else addLowPolyOliveTree(tx, tz, 1.2, true);
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
  const activeStageNum = getNextActiveMainStageNumber();

  miracleStageSpots.forEach(sp => {
    const isCleared = Boolean(miracleMainStagesCleared[sp.stageNum]);
    sp.cleared = isCleared;

    const isCurrentTurn = (sp.stageNum === activeStageNum);
    if (sp.beam) {
      sp.beam.visible = isCurrentTurn;
    }
    if (sp.ring && sp.ring.material) {
      sp.ring.material.color.setHex(isCleared ? 0x10b981 : (isCurrentTurn ? sp.color : 0x64748b));
      sp.ring.visible = isCurrentTurn || isCleared;
    }
    if (sp.label) {
      sp.label.innerHTML = isCleared
        ? `✅ ${sp.title}`
        : (isCurrentTurn ? `✨ ${sp.title}` : `🔒 ${sp.title} (스테이지 ${sp.stageNum - 1} 완료 후 진행)`);
    }
  });

  const isStage3Cleared = Boolean(miracleMainStagesCleared[3] || miracleMainStagesCleared[4] || miracleIsPostResurrection);
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

function spawnMiracleMainStageSpots() {
  miracleStageSpots = [];

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

  if (miracleIsPostResurrection) {
    const ascMarker = createMiracleSpotMarker(
      88, 74, 0xfef08a,
      '👑 [최종 엔딩] 감람산 : 예수님의 승천과 재림의 약속',
      'jesus',
      true
    );
    miracleStageSpots.push({
      stageNum: 5,
      subModeKey: 'ascension',
      x: 88, z: 74,
      color: 0xfef08a,
      title: '👑 [최종 엔딩] 감람산 : 예수님의 승천과 재림의 약속',
      introSpeaker: '부활하신 예수님',
      introText: '"하늘과 땅의 모든 권세를 내게 주셨으니, 그러므로 너희는 가서 모든 민족을 제자로 삼으라! 볼지어다 내가 세상 끝날까지 너희와 항상 함께 있으리라!"',
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

  rumorConfigs.forEach((rc, idx) => {
    const by = getMiracleOpenWorldGroundHeight(rc.x, rc.z);
    const mesh = createLowPolyPersonMesh('villager', idx);
    mesh.position.set(rc.x, by, rc.z);
    worldGroup.add(mesh);

    const catBadge = rc.cat === 'eyewitness' ? '🔵목격담' : (rc.cat === 'word' ? '🟣말씀' : '🟡소문');
    const lbl = createWorldLabel(`${catBadge} · ${rc.speaker}`);
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
      talked: false,
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
      title: '🏺 ① 가나 혼인잔치: 물항아리 6개 배달',
      x: -4, z: -69,
      color: 0xe11d48,
      npcPreset: 'woman',
      speaker: '혼인잔치 하인',
      introText: '"잔치 포도주가 다 떨어졌어요! 예수님께서 저기 있는 돌항아리 6개에 물을 아구까지 채우라고 하셨어요. 주변 우물 물통 6개를 항아리로 옮겨 주세요!"',
      greetingText: '"샬롬! 아까 돌항아리에 물을 가득 채워 주신 덕분에 잔치에 가장 향기로운 포도주가 넘쳐났답니다. 정말 고마워요!"',
      missionType: 'collect_deliver',
      itemCount: 6,
      itemColor: '#38bdf8',
      itemLabel: '💧 맑은 물동이',
      targetOffset: { x: 0, z: -2.2 },
      targetLabel: '🏺 가나 잔치집 돌항아리 (물 채우기)',
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
      introText: '"사람들이 문 앞을 가득 메워 예수님께 갈 수가 없어요! 저희와 함께 들것을 메고 오른쪽 외벽 돌계단을 따라 집 지붕 위로 올라가 주세요!"',
      greetingText: '"평안하신가요! 함께 지붕 위로 들것을 옮겨 주신 덕분에 우리 친구가 죄 사함을 받고 건강하게 걸어서 집으로 돌아갔어요!"',
      missionType: 'escort_guide',
      escortType: 'stretcher',
      goalPos: { x: 22, y: 4.0, z: -52 },
      goalLabel: '🏠 가버나움 집 평지붕 위 (들것 내리기)',
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
      title: '👧 ④ 어린이들을 축복하시는 예수님: 길 안내',
      x: 34, z: -38,
      color: 0xfacc15,
      npcPreset: 'child',
      speaker: '갈릴리 어린이들',
      introText: '"예수님을 꼭 만나고 싶은데 어른들이 많아서 길을 모르겠어요! 저기 감람나무 아래 계신 예수님께 우리를 데려다주세요!"',
      greetingText: '"안녕! 예수님께서 우리를 품에 안아 주시고 머리 위에 손을 얹어 축복해 주셨어! 정말 따뜻하고 기뻤어!"',
      missionType: 'escort_guide',
      escortType: 'children',
      goalPos: { x: 42, y: 0, z: -48 },
      goalLabel: '✨ 어린이를 반기시는 예수님',
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
      title: '⛲ ③ 수가성 우물가의 여인: 생수의 대화와 소문 전달',
      x: -29, z: -12,
      color: 0x0ea5e9,
      npcPreset: 'woman',
      speaker: '수가성 여인',
      introText: '"우물가에서 만난 분이 제게 영원히 목마르지 않는 생수를 주겠다고 하셨어요! 제가 물동이를 두고 저기 수가성 마을 주민 3명에게 달려가 이 소식을 전할 수 있게 함께 가주세요!"',
      greetingText: '"반가워요! 예수님께서 주신 영생하도록 솟아나는 샘물 덕분에 제 마음의 목마름이 완전히 사라졌답니다!"',
      missionType: 'collect_deliver',
      itemCount: 3,
      itemColor: '#38bdf8',
      itemLabel: '🗣️ 마을 주민에게 전할 기쁜 소식',
      targetOffset: { x: -8, z: 4 },
      targetLabel: '🏘️ 수가성 마을 모임터',
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
      title: '🌳 ⑤ 삭개오를 찾아라: 뽕나무 위 숨은 인물 찾기',
      x: 34, z: -4,
      color: 0x8b5cf6,
      npcPreset: 'zacchaeus',
      speaker: '여리고 주민',
      introText: '"예수님이 여리고를 지나가신대요! 키가 작은 세리장 삭개오가 군중 너머 커다란 돌무화과나무(뽕나무) 위로 올라갔는데, 나무 주변으로 다가가 삭개오를 찾아보세요!"',
      greetingText: '"할렐루야! 예수님께서 오늘 삭개오의 집에 머무시며 구원이 이 집에 이르렀다고 선포하셨어요!"',
      missionType: 'find_observe',
      findTargetPos: { x: 39.6, y: 2.8, z: -3.4 },
      findTargetLabel: '🌳 뽕나무 가지 위의 삭개오 발견!',
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
      title: '🩹 ⑥ [비유 체험] 도움이 필요한 여행자: 선한 사마리아인',
      x: 15, z: 20,
      color: 0x10b981,
      npcPreset: 'disciple',
      speaker: '선한 사마리아인 (예수님의 비유 체험)',
      introText: '"[📖 예수님이 들려주신 비유 이야기] 강도를 만나 다친 여행자가 길가에 쓰러져 있어요! 주변에서 치료용 기름·포도주 붕대 3개를 모아 다친 여행자를 싸매고 주막으로 옮겨 주세요!"',
      greetingText: '"평안하시길! 다친 이웃을 불쌍히 여기고 자비를 베푸는 사람이야말로 예수님이 말씀하신 진정한 이웃이랍니다!"',
      missionType: 'collect_deliver',
      itemCount: 3,
      itemColor: '#f43f5e',
      itemLabel: '🩹 상처를 싸매는 구호품',
      targetOffset: { x: 6, z: 3 },
      targetLabel: '🏠 여리고 주막(여관) 입구',
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
      title: '🙏 ⑦ 열 명의 나병환자: 돌아와 감사한 한 사람 찾기',
      x: -28, z: 16,
      color: 0xf59e0b,
      npcPreset: 'disciple',
      speaker: '고침 받은 나병환자',
      introText: '"예수님께서 저희 열 명을 모두 깨끗하게 고쳐 주셨어요! 아홉 명은 그냥 가버렸지만, 예수님 발 앞에 엎드려 감사드린 한 사람을 찾아가 보세요!"',
      greetingText: '"감사합니다! 예수님께 돌아와 하나님께 영광을 돌릴 때 \'네 믿음이 너를 구원하였다\'는 귀한 말씀을 들었답니다!"',
      missionType: 'find_observe',
      findTargetPos: { x: -35, y: 0, z: 12 },
      findTargetLabel: '🙏 돌아와 하나님께 영광을 돌린 사마리아인',
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
      title: '🌿 ⑧ 종려나무 가지를 준비하라: 호산나 입성 행렬',
      x: 0, z: 39,
      color: 0x22c55e,
      npcPreset: 'disciple',
      speaker: '예루살렘 환영 무리',
      introText: '"예수님이 겸손하게 나귀를 타시고 예루살렘 성문으로 오십니다! 주변의 종려나무 가지 5개를 모아 성문 앞 행렬 길에 펼쳐 주세요!"',
      greetingText: '"호산나 다윗의 자손이여! 주의 이름으로 오시는 평화의 왕을 함께 맞이할 수 있어 참 기뻤습니다!"',
      missionType: 'collect_deliver',
      itemCount: 5,
      itemColor: '#22c55e',
      itemLabel: '🌿 푸른 종려나무 가지',
      targetOffset: { x: 0, z: 5 },
      targetLabel: '🚪 예루살렘 성전 외곽 성문 앞 길',
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
      title: '🥣 ⑨ 제자들의 발을 씻기시는 예수님: 섬김의 다락방',
      x: -24, z: 51,
      color: 0x38bdf8,
      npcPreset: 'disciple',
      speaker: '사도 요한',
      introText: '"다락방에서 저녁 잡수시던 자리에서 예수님이 일어나셨어요! 주변에 놓인 [물대야, 깨끗한 물, 수건] 3가지를 모아 예수님 앞 섬김 자리로 가져다주세요!"',
      greetingText: '"예수님께서 친히 우리의 발을 씻겨 주시며 보여 주신 겸손과 사랑의 새 계명을 평생 마음에 새기겠습니다!"',
      missionType: 'collect_deliver',
      itemCount: 3,
      itemColor: '#67e8f9',
      itemLabel: '🥣 섬김의 물대야와 수건',
      targetOffset: { x: 0, z: 3.5 },
      targetLabel: '✨ 다락방 제자들의 자리',
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
      introText: '"예수님께서 성전 헌금함 맞은편에 앉아 사람들이 어떻게 헌금하는지 보고 계세요. 성전 동쪽 측면 황금문 옆에서 조용히 두 렙돈을 드린 과부를 찾아가 보세요!"',
      greetingText: '"하나님은 겉모습이나 금액의 많고 적음이 아니라, 마음을 다해 드리는 중심을 가장 귀하게 보신다는 것을 배웠어요!"',
      missionType: 'find_observe',
      findTargetPos: { x: 11.8, y: 0, z: 69.5 },
      findTargetLabel: '🪙 정성껏 두 렙돈을 넣은 가난한 과부',
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
      title: '🌱 [비유 미니게임 1] 씨 뿌리는 사람: 좋은 땅 찾기',
      x: -46, z: -28,
      color: 0x4ade80,
      npcPreset: 'disciple',
      speaker: '예수님의 비유 이야기',
      introText: '"[📖 예수님이 들려주신 비유] 씨 뿌리는 사람이 씨를 뿌리러 나갔어요! 길가나 돌밭, 가시떨기가 아닌 부드럽고 좋은 옥토 밭에 말씀의 씨앗 4개를 심어 30배, 60배, 100배의 열매를 맺게 해보세요!"',
      greetingText: '"반가워요! 좋은 땅에 심긴 씨앗처럼 하나님의 말씀을 듣고 깨달아 30배, 60배, 100배의 풍성한 열매를 맺어가길 축복해요!"',
      missionType: 'collect_deliver',
      itemCount: 4,
      itemColor: '#fde047',
      itemLabel: '🌾 말씀의 씨앗',
      targetOffset: { x: -5, z: -4 },
      targetLabel: '🟫 부드러운 좋은 땅 (옥토)',
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
      title: '🐑 [비유 미니게임 2] 잃어버린 양: 광야 수색',
      x: -66, z: 12,
      color: 0x38bdf8,
      npcPreset: 'disciple',
      speaker: '선한 목자 비유',
      introText: '"[📖 예수님이 들려주신 비유] 아흔아홉 마리 양을 두고 광야 바위 언덕에서 길을 잃고 떨고 있는 어린 양 한 마리를 찾아 목자의 품으로 데려오세요!"',
      greetingText: '"고마워요! 잃어버린 양 한 마리까지 끝까지 찾아내어 어깨에 메고 기뻐하시는 선한 목자 예수님의 사랑을 늘 기억해요!"',
      missionType: 'find_observe',
      findTargetPos: { x: -73, y: 0, z: 9 },
      findTargetLabel: '🐑 바위 언덕 위 잃어버린 양 한 마리!',
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
      x: 56, z: 24,
      color: 0x60a5fa,
      npcPreset: 'disciple',
      speaker: '지혜로운 건축자 비유',
      introText: '"[📖 예수님이 들려주신 비유] 비가 내리고 창수가 나도 무너지지 않도록, 모래땅이 아닌 든든한 바위(반석) 위로 주춧돌 4개를 옮겨 집을 세워 보세요!"',
      greetingText: '"든든한 반석 위에 멋진 집이 세워졌어요! 예수님의 말씀을 듣고 행하는 지혜로운 삶을 살아가요!"',
      missionType: 'collect_deliver',
      itemCount: 4,
      itemColor: '#94a3b8',
      itemLabel: '🪨 든든한 반석 주춧돌',
      targetOffset: { x: 5, z: -3 },
      targetLabel: '⛰️ 단단한 반석 터 위',
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
      introText: '"슬픈 기색으로 엠마오로 내려가던 저희에게 한 나그네가 다가와 성경을 풀어주셨어요! 저희와 함께 엠마오 마을 식탁까지 동행해 주세요!"',
      greetingText: '"길에서 우리에게 말씀하시고 성경을 풀어 주실 때에 우리 속에서 마음이 뜨겁지 아니하더냐! 주님이 참으로 살아나셨습니다!"',
      missionType: 'escort_guide',
      escortType: 'emmaus',
      goalPos: { x: -58, y: 0, z: 32 },
      goalLabel: '🍞 엠마오 마을 떡을 떼시는 식탁',
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
      title: '🙌 ⑫ [부활 이후] 도마와 제자들: 보지 않고 믿는 복',
      x: -18, z: 58,
      color: 0x38bdf8,
      npcPreset: 'disciple',
      speaker: '사도 도마',
      introText: '"다른 제자들이 주님을 보았다고 했지만 저는 믿지 못했습니다... 그때 닫힌 문들 가운데 서신 예수님께 다가가 증언을 확인해 보세요!"',
      greetingText: '"나의 주님이시요 나의 하나님이시니이다! 보지 못하고 믿는 자들에게 주시는 예수님의 복이 함께하시길 바랍니다!"',
      missionType: 'find_observe',
      findTargetPos: { x: -22, y: 0, z: 54 },
      findTargetLabel: '✨ 평강을 선언하시는 부활의 예수님',
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
      title: '🐟 ⑬ [부활 이후] 갈릴리 바닷가의 숯불 아침 식사',
      x: -76, z: -76,
      color: 0xf97316,
      npcPreset: 'jesus',
      speaker: '바닷가에 서신 예수님',
      introText: '"얘들아, 밤새 고기를 잡느라 수고하였다! 배 오른편에 그물을 던져 잡은 물고기를 가져와 숯불 위에서 함께 아침 조반을 먹자!"',
      greetingText: '"내가 너희를 사랑한 것 같이 너희도 서로 사랑하고 내 어린 양을 먹이라!"',
      missionType: 'collect_deliver',
      itemCount: 3,
      itemColor: '#38bdf8',
      itemLabel: '🐟 갓 잡은 큰 물고기',
      targetOffset: { x: 4, z: -3 },
      targetLabel: '🔥 바닷가 숯불 생선구이 식탁',
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
         (miracleActiveFieldEvent && miracleActiveFieldEvent.cutsceneActive) || 
         (miracleDialogState && miracleDialogState.active);
};

function spawnMiracleOptionalEventSpots() {
  miracleEventSpots = [];
  const allCatalog = [...getMiracleOptionalEventsCatalog()];
  if (miracleIsPostResurrection) {
    allCatalog.push(...getMiraclePostResurrectionEventsCatalog());
  }

  allCatalog.forEach(ev => {
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

    miracleEventSpots.push({
      ...ev,
      ...marker,
      completed: isCompleted,
      _requireLeaveZone: false
    });
  });
}

// -------------------------------------------------------------------------
// 7. 오픈월드 필드 이벤트 실행기 (항아리 배달 · 들것/아이들 동행 · 삭개오/양/과부 관찰 찾기)
// -------------------------------------------------------------------------
function clearMiracleFieldEventObjects() {
  miracleWorldMissionObjects.forEach(obj => {
    if (obj.mesh) worldGroup.remove(obj.mesh);
    if (obj.label) obj.label.remove();
  });
  miracleWorldMissionObjects = [];
  miracleActiveFieldEvent = null;
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
    targetZone: null,
    escortGroup: null,
    cutsceneActive: false // 컷신 상태 초기화
  };

  const cx = evSpot.x;
  const cz = evSpot.z;

  if (evSpot.missionType === 'collect_deliver') {
    const count = evSpot.itemCount || 4;
    for (let i = 0; i < count; i++) {
      const ang = (i / count) * Math.PI * 2 + 0.4;
      const dist = 6.5 + (i % 2) * 2.5;
      const ix = cx + Math.cos(ang) * dist;
      const iz = cz + Math.sin(ang) * dist;
      const iy = getMiracleOpenWorldGroundHeight(ix, iz);

      const itemGrp = new THREE.Group();
      const itemMesh = createLowPolyMesh(new THREE.DodecahedronGeometry(0.42, 0), evSpot.itemColor || '#38bdf8', 0, 0.42, 0);
      const itemRing = new THREE.Mesh(
        new THREE.RingGeometry(0.65, 0.95, 16),
        new THREE.MeshBasicMaterial({ color: 0xfef08a, side: THREE.DoubleSide })
      );
      itemRing.rotation.x = -Math.PI / 2;
      itemRing.position.y = 0.06;
      itemGrp.add(itemMesh, itemRing);
      itemGrp.position.set(ix, iy, iz);
      worldGroup.add(itemGrp);

      const lbl = createWorldLabel(evSpot.itemLabel || '✨ 미션 물품');
      lbl.style.opacity = '0';
      const itemObj = { mesh: itemGrp, pos: new THREE.Vector3(ix, iy + 0.4, iz), done: false, label: lbl };
      miracleWorldMissionObjects.push(itemObj);
      miracleActiveFieldEvent.items.push(itemObj);
    }

    const tx = cx + (evSpot.targetOffset ? evSpot.targetOffset.x : 0);
    const tz = cz + (evSpot.targetOffset ? evSpot.targetOffset.z : -3);
    const ty = getMiracleOpenWorldGroundHeight(tx, tz);
    const tGrp = new THREE.Group();
    const tRing = new THREE.Mesh(
      new THREE.RingGeometry(1.4, 2.0, 24),
      new THREE.MeshBasicMaterial({ color: 0x4ade80, side: THREE.DoubleSide })
    );
    tRing.rotation.x = -Math.PI / 2;
    tRing.position.y = 0.08;
    tGrp.add(tRing);
    tGrp.position.set(tx, ty, tz);
    worldGroup.add(tGrp);

    const tLbl = createWorldLabel(`${evSpot.targetLabel} (0/${count})`);
    tLbl.style.opacity = '0';
    const targetObj = { mesh: tGrp, pos: new THREE.Vector3(tx, ty + 0.5, tz), label: tLbl };
    miracleWorldMissionObjects.push(targetObj);
    miracleActiveFieldEvent.targetZone = targetObj;

    showToast(`🎯 주변에서 [${evSpot.itemLabel}] ${count}개를 모아 지정된 장소로 옮겨 주세요!`);
  } else if (evSpot.missionType === 'escort_guide') {
    const eGrp = new THREE.Group();
    if (evSpot.escortType === 'stretcher') {
      eGrp.add(
        createLowPolyMesh(new THREE.BoxGeometry(1.4, 0.14, 2.4), '#b45309', 0, 0.65, 0), // 들것 본체
        createLowPolyPersonMesh('disciple', 1), // 앞쪽 친구
        createLowPolyPersonMesh('disciple', 2)  // 뒤쪽 친구
      );
      eGrp.children[1].position.set(-0.75, 0, -0.8);
      eGrp.children[2].position.set( 0.75, 0,  0.8);
      
      // [수정점] 누워있는 중풍병자(환자) 모델링 추가
      const patient = createLowPolyPersonMesh('villager', 5);
      patient.position.set(0, 0.85, 0);
      patient.rotation.x = -Math.PI / 2;
      eGrp.add(patient);
    } else if (evSpot.escortType === 'children') {
      const c1 = createLowPolyPersonMesh('child', 1); c1.position.set(-0.6, 0, 0);
      const c2 = createLowPolyPersonMesh('child', 2); c2.position.set( 0.6, 0, 0.2);
      eGrp.add(c1, c2);
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

    const gx = evSpot.goalPos.x;
    const gz = evSpot.goalPos.z;
    const gy = evSpot.goalPos.y
      ? (getMiracleOpenWorldGroundHeight(gx, gz) + evSpot.goalPos.y)
      : getMiracleOpenWorldGroundHeight(gx, gz);
    const gGrp = new THREE.Group();
    const gRing = new THREE.Mesh(
      new THREE.RingGeometry(1.6, 2.3, 24),
      new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide })
    );
    gRing.rotation.x = -Math.PI / 2;
    gRing.position.y = 0.1;
    const jesusMesh = createLowPolyPersonMesh('jesus', 0);
    gGrp.add(gRing, jesusMesh);
    gGrp.position.set(gx, gy, gz);
    worldGroup.add(gGrp);

    const gLbl = createWorldLabel(evSpot.goalLabel);
    gLbl.style.opacity = '0';
    const targetObj = { mesh: gGrp, pos: new THREE.Vector3(gx, gy + 0.5, gz), label: gLbl, goalY: gy };
    miracleWorldMissionObjects.push(targetObj);
    miracleActiveFieldEvent.targetZone = targetObj;

    showToast(`👣 일행과 함께 [${evSpot.goalLabel}] 위치까지 걸어가세요!`);
  } else if (evSpot.missionType === 'find_observe') {
    const fx = evSpot.findTargetPos.x;
    const fz = evSpot.findTargetPos.z;
    const baseGroundY = getMiracleOpenWorldGroundHeight(fx, fz);
    const fy = (evSpot.id === 'ev_zacchaeus' && evSpot.findTargetPos.y)
      ? (baseGroundY + evSpot.findTargetPos.y)
      : baseGroundY;

    const fGrp = new THREE.Group();
    const targetPerson = (evSpot.id === 'par_sheep')
      ? (typeof createLowPolyAnimalMesh === 'function' ? createLowPolyAnimalMesh('sheep', 1.05) : createSingleAnimal('sheep'))
      : createLowPolyPersonMesh(evSpot.npcPreset || 'zacchaeus', 5);
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
}

function finishMiracleFieldEvent(evSpot) {
  clearMiracleFieldEventObjects();
  evSpot.completed = true;
  evSpot._requireLeaveZone = true;
  evSpot._prompted = performance.now();

  // [수정점] 반석 위에 집 짓기 미션 후 갇힘 방지를 위한 텔레포트 적용
  if (evSpot.id === 'par_builder' && !evSpot._houseBuilt) {
    evSpot._houseBuilt = true;
    
    // 집이 지어지는 위치에서 충분히 떨어진 안전 구역으로 캐릭터 이동
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

  // [수정점] 중풍병자 지붕 뚫기 및 하강 컷신 연출
  if (fe.cutsceneActive) {
    fe.cutsceneTimer += dt;
    const eg = fe.escortGroup ? fe.escortGroup.mesh : null;
    
    if (fe.cutscenePhase === 'hammer') {
      cameraYaw = lerpAngle(cameraYaw, Math.PI / 4, dt * 3.0);
      
      if (eg) {
        const targetX = evSpot.goalPos.x - 1.5;
        const targetZ = evSpot.goalPos.z - 1.5;
        eg.position.lerp(new THREE.Vector3(targetX, playerPos.y, targetZ), dt * 3.0);
        eg.rotation.y = lerpAngle(eg.rotation.y, 0, dt * 3.0);
      }
      
      // 플레이어 망치질 애니메이션 (도구 꺼내서 휘두르기)
      if (typeof playerChopAnimTimer !== 'undefined') playerChopAnimTimer = 0.2;
      if (playerLimbs && playerLimbs.lArm) {
        playerLimbs.lArm.rotation.x = -1.2 + Math.sin(now * 0.04) * 0.8;
      }
      
      if (fe.cutsceneTimer % 0.6 < 0.05) playSfx('hammer');
      
      if (fe.cutsceneTimer > 3.5) {
        fe.cutscenePhase = 'break';
        fe.cutsceneTimer = 0;
        playSfx('crumble');
        showToast('🕳️ 지붕이 뚫렸습니다! 밧줄로 중풍병자를 집 안으로 내립니다.');
        
        // 지붕에 뚫린 구멍 표현 (검은색 박스)
        const hole = createLowPolyMesh(new THREE.BoxGeometry(1.8, 0.05, 2.8), '#111111', evSpot.goalPos.x - 1.5, playerPos.y + 0.02, evSpot.goalPos.z - 1.5, false);
        worldGroup.add(hole);
      }
    } else if (fe.cutscenePhase === 'break') {
      // 들것을 집 안쪽으로 서서히 하강시킴
      if (eg) {
        eg.position.y -= dt * 1.5;
      }
      
      if (fe.cutsceneTimer > 3.0) {
        fe.cutsceneActive = false;
        finishMiracleFieldEvent(evSpot);
      }
    }
    return; // 컷신 도중에는 하단 이동 로직 건너뜀
  }

  // 기본 수집 및 배달 미션 업데이트
  if (fe.type === 'collect_deliver') {
    fe.items.forEach(it => {
      if (it.done) return;
      it.mesh.rotation.y += dt * 2.2;
      const d = Math.hypot(playerPos.x - it.pos.x, playerPos.z - it.pos.z);
      updateWorldLabelPos(it.label, it.pos, d < MIRACLE_TAG_DIST_ITEM);

      if (d < 2.2) {
        it.done = true;
        it.mesh.visible = false;
        it.label.style.opacity = '0';
        fe.carrying++;
        playSfx('rescue');
        showToast(`✨ ${evSpot.itemLabel} 획득! (${fe.collected + fe.carrying}/${fe.required}) · 목표 지점으로 가져가세요!`);
      }
    });

    if (fe.targetZone) {
      const tz = fe.targetZone;
      const td = Math.hypot(playerPos.x - tz.pos.x, playerPos.z - tz.pos.z);
      updateWorldLabelPos(tz.label, tz.pos, td < MIRACLE_TAG_DIST_SPOT);

      if (td < 3.0 && fe.carrying > 0) {
        fe.collected += fe.carrying;
        fe.carrying = 0;
        playSfx('build');
        tz.label.innerHTML = `${evSpot.targetLabel} (${fe.collected}/${fe.required})`;
        if (fe.collected >= fe.required) {
          finishMiracleFieldEvent(evSpot);
          return;
        } else {
          showToast(`🙌 전달 완료! (${fe.collected}/${fe.required}) · 남은 물품을 마저 옮겨 주세요!`);
        }
      }
    }
  } else if (fe.type === 'escort_guide') {
    // 플레이어가 계단을 등반하면, 들것 일행도 등 뒤를 바짝 쫓아 지붕으로 따라 올라옴!
    if (fe.escortGroup) {
      const eg = fe.escortGroup.mesh;
      const targetX = playerPos.x - Math.sin(playerFacing) * 1.8;
      const targetZ = playerPos.z - Math.cos(playerFacing) * 1.8;
      eg.position.x = THREE.MathUtils.lerp(eg.position.x, targetX, dt * 6.5);
      eg.position.z = THREE.MathUtils.lerp(eg.position.z, targetZ, dt * 6.5);
      eg.position.y = THREE.MathUtils.lerp(eg.position.y, playerPos.y, dt * 8.0);
      eg.rotation.y = playerFacing;
      const ed = Math.hypot(playerPos.x - eg.position.x, playerPos.z - eg.position.z);
      updateWorldLabelPos(fe.escortGroup.label, eg.position, ed < MIRACLE_TAG_DIST_NPC);
    }

    if (fe.targetZone) {
      const tz = fe.targetZone;
      const td = Math.hypot(playerPos.x - tz.pos.x, playerPos.z - tz.pos.z);
      const expectedY = (tz.goalY !== undefined) ? tz.goalY : (evSpot.goalPos.y || 0);
      const dy = Math.abs(playerPos.y - expectedY);
      updateWorldLabelPos(tz.label, tz.pos, td < MIRACLE_TAG_DIST_SPOT);
      
      if (td < 3.2 && dy < 2.4) {
        if (evSpot.id === 'ev_paralytic' && !fe.cutsceneActive) {
          fe.cutsceneActive = true;
          fe.cutscenePhase = 'hammer';
          fe.cutsceneTimer = 0;
          showToast('🔨 무사히 지붕에 올라왔습니다! 뜯어낼 자리를 찾아 망치질을 시작합니다!');
        } else if (!fe.cutsceneActive) {
          finishMiracleFieldEvent(evSpot);
        }
      }
    }
  } else if (fe.type === 'find_observe') {
    if (fe.targetZone) {
      const tz = fe.targetZone;
      const horizD = Math.hypot(playerPos.x - tz.pos.x, playerPos.z - tz.pos.z);
      updateWorldLabelPos(tz.label, tz.pos, horizD < MIRACLE_TAG_DIST_SPOT);
      if (horizD < 3.5) {
        finishMiracleFieldEvent(evSpot);
      }
    }
  }
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

  if (ny < -0.25 || nx > 103 || nz < -103 || nz > 103 || !isSpawnSpotClear(nx, nz, 0.55)) {
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

  scene.background = new THREE.Color(miracleIsPostResurrection ? 0x60a5fa : 0x7dd3fc);
  scene.fog = new THREE.Fog(miracleIsPostResurrection ? 0xbae6fd : 0xbae6fd, 125, 360);

  buildSoftLowPolyWorldTerrain();
  buildMiracleRegionalLandmarks();
  buildMiracleRoadsideVillagesAndForests();
  spawnMiracleMainStageSpots();
  spawnMiracleOptionalEventSpots();
  spawnMiracleRumorNpcs();

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

  // 대화창이 열려있으면 필드 이벤트 진행 중지
  if (miracleDialogState.active) return;

  if (miracleActiveFieldEvent) {
    updateMiracleFieldEventFrame(dt, now);
  }

  const activeStageNum = getNextActiveMainStageNumber();
  const isStage3Cleared = Boolean(miracleMainStagesCleared[3] || miracleMainStagesCleared[4] || miracleIsPostResurrection);
  const isFieldMissionActive = Boolean(miracleActiveFieldEvent);
  let currentActiveStageSpot = null;

  // [이전 스테이지 클리어 확인 동기화 보완 + 미션 중 타 스테이지 진입 불가 & 머리 위 태그 일시 해제]
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

    // 스테이지 4 무덤 앞을 지키는 여인(막달라 마리아) 머리 위 태그는 스테이지 3 클리어 시에만 표시
    if (sp.stageNum === 4 && !isStage3Cleared) {
      if (sp.label) sp.label.style.opacity = '0';
    } else {
      updateWorldLabelPos(sp.label, sp.pos, d < MIRACLE_TAG_DIST_SPOT);
    }

    if (sp._requireLeaveZone) {
      if (d > 4.3) sp._requireLeaveZone = false;
      return;
    }

    if (d < 3.3 && (!sp._prompted || now - sp._prompted > 5500)) {
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

      if (sp.cleared) {
        openMiracleDialog({
          speaker: sp.introSpeaker,
          category: 'greeting',
          text: sp.greetingText || `"반가워요! 함께 완수했던 메인 스테이지 ${sp.stageNum}의 감동이 아직도 생생하네요!"`,
          btnText: '반갑게 인사 나누기 👋',
          replayText: `🔄 스테이지 ${sp.stageNum} 다시하기`,
          onReplay: launchThisStage
        });
      } else if (sp.stageNum > activeStageNum) {
        openMiracleDialog({
          speaker: sp.introSpeaker,
          category: 'story',
          text: `"아직 앞선 여정이 남아 있어요! 먼저 빛기둥이 비추고 있는 [메인 스테이지 ${activeStageNum}]을(를) 순서대로 완료하고 오세요!"`,
          btnText: '네, 순서대로 다녀올게요! ▶'
        });
      } else {
        openMiracleDialog({
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

    if (ev.npcMesh && d < 8.5) {
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
      if (d > 4.2) ev._requireLeaveZone = false;
      return;
    }

    if (
      !isFieldMissionActive &&
      d < 3.0 &&
      (!ev._prompted || now - ev._prompted > 5500)
    ) {
      ev._prompted = now;
      ev._requireLeaveZone = true;

      if (ev.completed) {
        openMiracleDialog({
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
    updateWorldLabelPos(rn.label, rn.pos, d < MIRACLE_TAG_DIST_NPC);

    if (d < 2.5 && (!rn._prompted || now - rn._prompted > 6500)) {
      rn._prompted = now;
      rn.talked = true;
      rn.label.innerHTML = `✅ ${rn.speaker}`;
      openMiracleDialog({
        speaker: rn.speaker,
        category: rn.cat,
        notebookId: rn.nbId,
        text: rn.text,
        quiz: (currentMode === 'kinder') ? null : rn.quiz,
        btnText: '📖 수첩에 적어두기'
      });
    }
  });

  if (guideArrowGroup && guideArrowGroup.visible) {
    const baseFacing = (window.globalCameraViewMode === 'fps') ? (cameraYaw + Math.PI) : playerFacing;
    let guideTarget = null;
    if (miracleActiveFieldEvent) {
      const fe = miracleActiveFieldEvent;
      const uncollected = fe.items ? fe.items.find(x => !x.done) : null;
      guideTarget = (uncollected && fe.carrying === 0)
        ? uncollected.pos
        : (fe.targetZone ? fe.targetZone.pos : null);
    }
    if (!guideTarget && currentActiveStageSpot) {
      guideTarget = currentActiveStageSpot.pos;
    } else if (!guideTarget && miracleStageSpots.length > 0) {
      guideTarget = miracleStageSpots[miracleStageSpots.length - 1].pos;
    }
    if (guideTarget) {
      guideArrowGroup.rotation.y = Math.atan2(guideTarget.x - playerPos.x, guideTarget.z - playerPos.z) - baseFacing;
    }
  }
}
