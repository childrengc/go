// =========================================================================
// [ep3_david_st1_2.js - 전반부 (1/2)] 에피소드 3 : 스테이지 1 (베들레헴 언덕과 사무엘의 기름부음)
// - 타임어택 보너스: 양 발견 시(+3.5초), 목초지 합류 시(마리당 +4.5초), 풀 획득 시(+3.5초), 양에게 먹일 시(+4.0초) 즉시 부여
// - 에피소드 3 암전 오프닝 내레이션 & 성경절(사도행전 13:22) 낭독 및 1분 하프 BGM 루프 연동
// - 좌측 세로형 가변 배부름 게이지(height%) 및 디펜스 시작 시 배부름 게이지 즉시 숨김
// =========================================================================

function getDavidStage1GroundHeight(x, z) {
  if (z >= DAVID_HILL_SLOPE_SOUTH_Z) return DAVID_HILL_TOP_Y;
  if (z <= DAVID_HILL_SLOPE_NORTH_Z) return 0.0;
  const t = (z - DAVID_HILL_SLOPE_NORTH_Z) / (DAVID_HILL_SLOPE_SOUTH_Z - DAVID_HILL_SLOPE_NORTH_Z);
  const smooth = t * t * (3 - 2 * t);
  return smooth * DAVID_HILL_TOP_Y;
}

function getDavidHillRoadCenterX(z) {
  if (z >= DAVID_HILL_SLOPE_SOUTH_Z || z <= DAVID_HILL_SLOPE_NORTH_Z) return 0;
  const norm = (z - DAVID_HILL_SLOPE_NORTH_Z) / (DAVID_HILL_SLOPE_SOUTH_Z - DAVID_HILL_SLOPE_NORTH_Z);
  return Math.sin(norm * Math.PI * 2.0) * 3.6;
}

function addDavidHillTree(x, z, scale = 1, registerTransparent = true, addCollider = true, customBaseY = null) {
  const by = (customBaseY !== null) ? customBaseY : getDavidStage1GroundHeight(x, z);
  const trunkH = 2.4 * scale;
  const trunk = createBox(0.75 * scale, trunkH, 0.75 * scale, matVoxel('#78350f', '#451a03').clone(), x, by + trunkH / 2, z);
  const leaves1 = createBox(2.8 * scale, 1.6 * scale, 2.8 * scale, matVoxel('#16a34a', '#15803d').clone(), x, by + trunkH + 0.6 * scale, z);
  const leaves2 = createBox(1.9 * scale, 1.3 * scale, 1.9 * scale, matVoxel('#22c55e', '#16a34a').clone(), x, by + trunkH + 1.7 * scale, z);
  worldGroup.add(trunk, leaves1, leaves2);
  if (registerTransparent) wallMeshes.push(trunk, leaves1, leaves2);
  if (addCollider) colliders.push({ minX: x - 0.55, maxX: x + 0.55, minZ: z - 0.55, maxZ: z + 0.55 });
}

function addDavidStage1Rock(x, z, w, h, d) {
  const by = getDavidStage1GroundHeight(x, z);
  const mat = matVoxel('#64748b', '#475569').clone();
  const rockMesh = createBox(w, h, d, mat, x, by + h / 2, z);
  worldGroup.add(rockMesh);
  wallMeshes.push(rockMesh);
  platforms.push({ minX: x - w / 2 - 0.12, maxX: x + w / 2 + 0.12, minZ: z - d / 2 - 0.12, maxZ: z + d / 2 + 0.12, topY: by + h });
}

// -------------------------------------------------------------------------
// 1. 스테이지 1 월드 빌더 (언덕 위 목초지, S자 내리막길, 언덕 아래 이새의 집, 강 건너 원경)
// -------------------------------------------------------------------------
function buildGrazedRectangularPasture(cx, cz) {
  const by = getDavidStage1GroundHeight(cx, cz);
  const grp = new THREE.Group();
  const w = DAVID_CAMP_HALF_W * 2;
  const d = DAVID_CAMP_HALF_D * 2;

  const grazedGrassMat = matDavidCached('#84cc16', '#65a30d');
  const soilPatchMat1 = matDavidCached('#d9a05b', '#b45309');
  const soilPatchMat2 = matDavidCached('#ca8a04', '#92400e');
  const freshTuftMat = matDavidCached('#22c55e', '#15803d');

  const baseRect = createBox(w, 0.06, d, grazedGrassMat, cx, by + 0.03, cz, false);
  baseRect.receiveShadow = true;
  grp.add(baseRect);

  const chewedPatches = [
    [-4.6, -3.2, 3.2, 2.4, 0], [-1.2, -3.6, 2.8, 2.0, 1], [3.4, -3.0, 3.4, 2.5, 0],
    [-5.0,  0.2, 2.6, 2.8, 1], [ 0.4, -0.4, 3.8, 2.6, 0], [4.4,  0.5, 2.8, 2.4, 1],
    [-3.4,  3.1, 3.6, 2.2, 0], [ 1.2,  3.4, 3.0, 2.2, 1], [4.8,  3.2, 2.4, 2.0, 0],
    [-1.8,  1.4, 2.2, 1.8, 1], [ 2.6, -1.8, 2.0, 1.8, 1]
  ];
  chewedPatches.forEach(([ox, oz, pw, pd, kind]) => {
    const pMat = (kind === 0) ? soilPatchMat1 : soilPatchMat2;
    const patch = createBox(pw, 0.07, pd, pMat, cx + ox, by + 0.04, cz + oz, false);
    patch.receiveShadow = true;
    grp.add(patch);
  });

  [
    [-5.8, -4.2], [-2.8, -1.8], [1.8, -4.0], [5.5, -1.5],
    [-5.6,  2.4], [-0.4,  2.2], [3.2,  1.8], [5.8,  4.0]
  ].forEach(([tx, tz]) => {
    grp.add(
      createBox(0.45, 0.22, 0.45, freshTuftMat, cx + tx, by + 0.14, cz + tz, false),
      createBox(0.28, 0.30, 0.28, freshTuftMat, cx + tx + 0.15, by + 0.18, cz + tz - 0.1, false)
    );
  });

  worldGroup.add(grp);

  davidBaseFlock = [];
  const baseSheepSpots = [
    [-4.8, -3.2, 0.6],  [-2.0, -3.5, 2.1],  [1.4, -3.2, -0.8], [4.2, -2.8, -1.5],
    [-5.2,  0.2, 1.2],  [-1.6,  0.4, -2.4], [2.2,  0.1,  0.4], [4.8,  0.6, -2.0],
    [-3.2,  3.0, 0.3],  [ 2.8,  3.1, -0.5]
  ];
  baseSheepSpots.forEach(([ox, oz, rotY], idx) => {
    const sMesh = createSingleAnimal('sheep');
    sMesh.position.set(cx + ox, by, cz + oz);
    sMesh.rotation.y = rotY;
    worldGroup.add(sMesh);
    davidBaseFlock.push({
      mesh: sMesh,
      baseX: cx + ox,
      baseY: by,
      baseZ: cz + oz,
      baseRotY: rotY,
      phase: idx * 0.75,
      lost: false
    });
  });
}

function buildDistantPlainAndRiverVista(houseZ) {
  const plainMat = new THREE.MeshLambertMaterial({ map: makeGrassFieldTex() });
  const fieldMat1 = matDavidCached('#84cc16', '#65a30d');
  const fieldMat2 = matDavidCached('#eab308', '#ca8a04');
  const lowMoundMat = matDavidCached('#4ade80', '#22c55e');
  const bankMat = matDavidCached('#fde68a', '#d9a05b');
  const waterTex = makeFlowingWaterWallTex();
  const riverMat = new THREE.MeshLambertMaterial({ map: waterTex, transparent: true, opacity: 0.90 });
  const bridgeMat = matDavidCached('#94a3b8', '#64748b');

  const plainFloor = createBox(360, 2.0, 220, plainMat, 0, -1.05, houseZ - 72, false);
  plainFloor.receiveShadow = true;
  worldGroup.add(plainFloor);

  [
    [-48, houseZ - 22, 32, 16, fieldMat1],
    [ 46, houseZ - 24, 34, 18, fieldMat2],
    [-55, houseZ - 66, 38, 20, fieldMat2],
    [ 52, houseZ - 68, 40, 22, fieldMat1],
    [  0, houseZ - 72, 44, 18, fieldMat1]
  ].forEach(([px, pz, pw, pd, m]) => {
    worldGroup.add(createBox(pw, 0.12, pd, m, px, 0.04, pz, false));
  });

  const riverBaseZ = houseZ - 40;
  for (let rx = -150; rx <= 150; rx += 6) {
    const curveZ = riverBaseZ + Math.sin(rx * 0.035) * 7.5;
    worldGroup.add(
      createBox(6.5, 0.18, 16.5, bankMat, rx, 0.02, curveZ, false),
      createBox(6.5, 0.22, 12.2, riverMat, rx, 0.08, curveZ, false)
    );
  }

  const bridgeZ = riverBaseZ;
  worldGroup.add(
    createBox(6.4, 0.8, 15.5, bridgeMat, 0, 0.55, bridgeZ, false),
    createBox(0.5, 1.2, 15.5, bridgeMat, -2.9, 1.15, bridgeZ, false),
    createBox(0.5, 1.2, 15.5, bridgeMat,  2.9, 1.15, bridgeZ, false)
  );

  [-84, -68, -52, -38, -22, 18, 34, 50, 66, 82].forEach((tx, idx) => {
    const tz = riverBaseZ + Math.sin(tx * 0.035) * 7.5 + (idx % 2 === 0 ? 10.0 : -10.0);
    addDavidHillTree(tx, tz, 0.72 + (idx % 3) * 0.1, false, false, 0);
  });

  // [요청사항] 멀리 보이는 북쪽·동쪽·서쪽 맵 가장자리를 아기자기한 작은 언덕들과 나무 숲으로 가득 채우기
  const smallHillMat1 = matDavidCached('#4ade80', '#22c55e');
  const smallHillMat2 = matDavidCached('#22c55e', '#16a34a');
  const smallHillMat3 = matDavidCached('#65a30d', '#4d7c0f');
  const addDistantSmallHill = (hx, hz, w, h, d, baseY = 0, matIdx = 0, treeCount = 2) => {
    const mA = matIdx % 3 === 0 ? smallHillMat1 : (matIdx % 3 === 1 ? smallHillMat2 : smallHillMat3);
    const mB = matIdx % 2 === 0 ? smallHillMat2 : smallHillMat3;
    worldGroup.add(
      createBox(w, h, d, mA, hx, baseY + h * 0.5, hz, false),
      createBox(w * 0.66, h * 0.62, d * 0.66, mB, hx + ((matIdx % 2) ? 1.2 : -1.2), baseY + h + h * 0.31, hz - 0.6, false)
    );
    const topY = baseY + h + h * 0.62;
    for (let t = 0; t < treeCount; t++) {
      const ox = (t - (treeCount - 1) * 0.5) * (w * 0.24);
      const oz = ((t % 2 === 0) ? 1 : -1) * (d * 0.14);
      const sc = 0.68 + ((Math.abs(Math.round(hx + hz)) + t) % 3) * 0.12;
      addDavidHillTree(hx + ox, hz + oz, sc, false, false, t === 0 ? topY : baseY + h);
    }
  };

  // 북쪽 원경 1·2·3열 작은 언덕과 나무 능선
  for (let x = -154; x <= 154; x += 18) {
    const idx = Math.abs(Math.round(x / 18));
    const h1 = 2.4 + (idx % 3) * 0.85;
    const z1 = houseZ - 88 + ((idx * 5) % 9) - 4;
    addDistantSmallHill(x, z1, 20, h1, 16, 0, idx, 2);

    const h2 = 4.0 + ((idx + 1) % 3) * 1.15;
    const z2 = houseZ - 110 + ((idx * 7) % 10) - 5;
    addDistantSmallHill(x + 8, z2, 24, h2, 18, 0, idx + 1, 2);

    const h3 = 5.4 + ((idx + 2) % 3) * 1.3;
    const z3 = houseZ - 134 + ((idx * 3) % 8) - 4;
    addDistantSmallHill(x - 4, z3, 28, h3, 22, 0, idx + 2, 3);
  }

  for (let row = 0; row < 3; row++) {
    const baseZ = houseZ - 64 - row * 16;
    for (let x = -132; x <= 132; x += 10) {
      const jitterX = x + ((row * 3 + x) % 5) - 2;
      const jitterZ = baseZ + ((x * 7) % 6) - 3;
      const smallScale = 0.60 + ((Math.abs(x + row * 11)) % 4) * 0.09;
      addDavidHillTree(jitterX, jitterZ, smallScale, false, false, 0);
    }
  }

  // 북동·북서 외곽 계곡 가장자리 작은 언덕과 나무 숲
  for (let z = houseZ - 74; z <= houseZ - 10; z += 16) {
    [-112, -88, 88, 112].forEach((x, idx) => {
      const h = 2.6 + ((Math.abs(z) + idx * 3) % 4) * 0.75;
      addDistantSmallHill(x + (idx % 2) * 4, z, 20, h, 16, 0, idx + Math.abs(z), 2);
    });
  }

  [
    [-55, 22, houseZ - 75, 1.3],
    [  0, 25, houseZ - 85, 1.5],
    [ 58, 23, houseZ - 72, 1.35],
    [-25, 20, houseZ - 48, 1.15],
    [ 32, 21, houseZ - 52, 1.2]
  ].forEach(([cx, cy, cz, sc]) => {
    const cl = createFluffyCloudGroup(sc, false);
    cl.position.set(cx, cy, cz);
    worldGroup.add(cl);
  });
}

function buildHilltopAndWindingRoadTerrain(mapLimit, houseZ) {
  const grassMat = new THREE.MeshLambertMaterial({ map: makeGrassFieldTex() });
  const cliffDirtMat = matDavidCached('#92400e', '#78350f');
  const roadStoneMat = matDavidCached('#e5c494', '#d9a05b');
  const roadBorderMat = matDavidCached('#a8a29e', '#78716c');
  const postMat = matDavidCached('#5c2d0c', '#451a03');

  const plateauDepth = (mapLimit + 24) - DAVID_HILL_SLOPE_SOUTH_Z;
  const plateauCenterZ = (mapLimit + 24 + DAVID_HILL_SLOPE_SOUTH_Z) * 0.5;
  const plateauBox = createBox(mapLimit * 2.6, DAVID_HILL_TOP_Y + 2.0, plateauDepth, grassMat, 0, (DAVID_HILL_TOP_Y - 2.0) * 0.5, plateauCenterZ, false);
  plateauBox.receiveShadow = true;
  worldGroup.add(plateauBox);
  worldGroup.add(createBox(mapLimit * 2.6, DAVID_HILL_TOP_Y, 2.0, cliffDirtMat, 0, DAVID_HILL_TOP_Y * 0.5 - 0.1, DAVID_HILL_SLOPE_SOUTH_Z, false));

  for (let z = DAVID_HILL_SLOPE_SOUTH_Z; z >= DAVID_HILL_SLOPE_NORTH_Z; z -= 1.0) {
    const midZ = z - 0.5;
    const h = Math.max(0.4, getDavidStage1GroundHeight(0, midZ));
    const slice = createBox(mapLimit * 2.4, h + 1.5, 1.12, grassMat, 0, (h - 1.5) * 0.5, midZ, false);
    slice.receiveShadow = true;
    worldGroup.add(slice);

    const roadX = getDavidHillRoadCenterX(midZ);
    const roadTile = createBox(5.6, 0.14, 1.18, roadStoneMat, roadX, h + 0.04, midZ, false);
    const curbL = createBox(0.45, 0.24, 1.18, roadBorderMat, roadX - 2.9, h + 0.09, midZ, false);
    const curbR = createBox(0.45, 0.24, 1.18, roadBorderMat, roadX + 2.9, h + 0.09, midZ, false);
    worldGroup.add(roadTile, curbL, curbR);
  }

  worldGroup.add(
    createBox(5.2, 0.10, 14.0, roadStoneMat, 0, DAVID_HILL_TOP_Y + 0.04, -1.0, false),
    createBox(5.6, 0.10, 14.0, roadStoneMat, 0, 0.05, DAVID_HILL_SLOPE_NORTH_Z - 6.0, false)
  );

  [-11, -17, -23, -29].forEach((rz, idx) => {
    const rx = getDavidHillRoadCenterX(rz);
    const ry = getDavidStage1GroundHeight(rx, rz);
    worldGroup.add(
      createBox(0.32, 1.3, 0.32, postMat, rx - 3.2, ry + 0.65, rz),
      createBox(0.32, 1.3, 0.32, postMat, rx + 3.2, ry + 0.65, rz)
    );
    if (idx % 2 === 0) {
      addWallTorch(rx - 3.2, 1.35, rz);
      addWallTorch(rx + 3.2, 1.35, rz);
    }
  });

  const step = 10;
  const baseC1 = matVoxel('#22c55e', '#16a34a');
  const baseC2 = matVoxel('#15803d', '#166534');
  const baseRockMtn = matVoxel('#64748b', '#475569');

  let stepCounter = 0;
  for (let z = houseZ - 10; z <= mapLimit + 20; z += step) {
    stepCounter++;
    [[-mapLimit - 6, -1], [mapLimit + 6, 1]].forEach(([bx, sideDir]) => {
      const baseY = getDavidStage1GroundHeight(bx, z);
      const h1 = 5 + ((stepCounter * 3) % 4);
      const h2 = h1 + 5;
      const h3 = h2 + 5;

      const hill1 = createBox(step + 2, h1 + baseY, step - 0.08, baseC1.clone(), bx, (h1 + baseY) / 2, z);
      const hill2 = createBox(step + 4, h2 + baseY, step - 0.08, baseC2.clone(), bx + sideDir * 6.5, (h2 + baseY) / 2, z);
      const peak3 = createBox(step + 6, h3 + baseY, step + 1.5, baseRockMtn.clone(), bx + sideDir * 14.0, (h3 + baseY) / 2 - 1, z, false);
      worldGroup.add(hill1, hill2, peak3);
      wallMeshes.push(hill1, hill2);

      addDavidHillTree(
        bx - sideDir * 1.2,
        z + ((stepCounter % 2 === 0) ? 1.8 : -1.8),
        0.95 + (stepCounter % 3) * 0.12,
        true,
        false,
        h1 + baseY
      );
      if (z >= -6 && z <= mapLimit - 2) {
        addDavidHillTree(bx - sideDir * 5.2, z - 2.2, 1.05, true, false);
      }
    });
  }

  for (let x = -mapLimit - 10; x <= mapLimit + 10; x += step) {
    const bz = mapLimit + 6;
    const h1 = 5 + (Math.abs(Math.round(x)) % 4);
    const h2 = h1 + 5;
    const h3 = h2 + 6;

    const sHill1 = createBox(step - 0.08, h1 + DAVID_HILL_TOP_Y, step + 2, baseC1.clone(), x, (h1 + DAVID_HILL_TOP_Y) / 2, bz);
    const sHill2 = createBox(step - 0.08, h2 + DAVID_HILL_TOP_Y, step + 4, baseC2.clone(), x, (h2 + DAVID_HILL_TOP_Y) / 2, bz + 6.5);
    const sPeak3 = createBox(step + 1.5, h3 + DAVID_HILL_TOP_Y, step + 6, baseRockMtn.clone(), x, (h3 + DAVID_HILL_TOP_Y) / 2 - 1, bz + 14.0, false);
    worldGroup.add(sHill1, sHill2, sPeak3);
    wallMeshes.push(sHill1, sHill2);

    addDavidHillTree(x, bz - 1.0, 1.05, true, false, h1 + DAVID_HILL_TOP_Y);
    if (Math.abs(x) <= mapLimit - 4) {
      addDavidHillTree(x + 2.0, mapLimit - 1.5, 1.0, true, false);
    }
  }

  // [요청사항] 동·서·남쪽 멀리 보이는 맵 가장자리 외곽에도 완만한 작은 언덕과 나무 능선 추가
  const outerHillMatA = matDavidCached('#4ade80', '#22c55e');
  const outerHillMatB = matDavidCached('#16a34a', '#15803d');
  for (let z = houseZ - 8; z <= mapLimit + 42; z += 14) {
    [[-mapLimit - 26, -1], [mapLimit + 26, 1], [-mapLimit - 42, -1], [mapLimit + 42, 1]].forEach(([ox, side], idx) => {
      const baseY = getDavidStage1GroundHeight(ox, z);
      const h = 3.2 + ((Math.abs(z) + idx * 5) % 4) * 1.1;
      const hill = createBox(18, h + baseY, 15, (idx % 2 === 0 ? outerHillMatA : outerHillMatB), ox, (h + baseY) * 0.5, z, false);
      worldGroup.add(hill);
      addDavidHillTree(ox - side * 2.5, z + ((idx % 2 === 0) ? 2.2 : -2.2), 0.85 + (idx % 3) * 0.12, false, false, h + baseY);
      addDavidHillTree(ox + side * 2.2, z - ((idx % 2 === 0) ? 2.5 : -2.5), 0.78 + (idx % 2) * 0.14, false, false, h + baseY);
    });
  }
  for (let x = -mapLimit - 34; x <= mapLimit + 34; x += 16) {
    const idx = Math.abs(Math.round(x / 16));
    const sz1 = mapLimit + 28 + (idx % 3) * 3;
    const h1 = 4.5 + (idx % 4) * 1.2;
    worldGroup.add(createBox(18, h1 + DAVID_HILL_TOP_Y, 16, (idx % 2 === 0 ? outerHillMatA : outerHillMatB), x, (h1 + DAVID_HILL_TOP_Y) * 0.5, sz1, false));
    addDavidHillTree(x - 2.6, sz1 - 1.4, 0.90, false, false, h1 + DAVID_HILL_TOP_Y);
    addDavidHillTree(x + 3.0, sz1 + 1.8, 0.82, false, false, h1 + DAVID_HILL_TOP_Y);
  }
}

function buildHiddenJesseHouseInLowerValley(houseZ) {
  davidJesseHouseGroup = new THREE.Group();
  const wallMat = matVoxel('#fde68a', '#eab308').clone();
  const trimMat = matVoxel('#b45309', '#78350f').clone();
  const floorMat = matDavidCached('#e5c494', '#d9a05b');

  const yard = createBox(20, 0.12, 12, floorMat, 0, 0.06, houseZ + 5.5, false);
  const mainHouse = createBox(14, 5.2, 6.5, wallMat, 0, 2.6, houseZ);
  const roofTrim = createBox(14.6, 0.55, 7.1, trimMat, 0, 5.45, houseZ);
  const upperRoom = createBox(6.2, 2.5, 4.4, wallMat, -2.4, 6.7, houseZ - 0.4);
  const door = createBox(2.2, 3.4, 0.3, matDavidCached('#5c2d0c'), 0, 1.7, houseZ + 3.26);
  davidJesseHouseGroup.add(yard, mainHouse, roofTrim, upperRoom, door);
  wallMeshes.push(mainHouse, roofTrim, upperRoom);
  colliders.push({ minX: -7.4, maxX: 7.4, minZ: houseZ - 3.6, maxZ: houseZ + 3.5 });

  [-15, 15].forEach(hx => {
    const subHouse = createBox(7.5, 4.2, 5.5, wallMat.clone(), hx, 2.1, houseZ + 2.0);
    const subRoof = createBox(8.0, 0.45, 6.0, trimMat.clone(), hx, 4.4, houseZ + 2.0);
    davidJesseHouseGroup.add(subHouse, subRoof);
    wallMeshes.push(subHouse, subRoof);
  });

  davidBrothers = [];
  [-4.2, -2.4, 2.8].forEach((bx, idx) => {
    const broMesh = (typeof createFollowerPersonMesh === 'function')
      ? createFollowerPersonMesh(idx + 1)
      : createSingleAnimal('sheep');
    broMesh.position.set(bx, 0, houseZ + 5.8);
    davidJesseHouseGroup.add(broMesh);
    davidBrothers.push({ mesh: broMesh, phase: idx * 0.9 });
  });

  const samuel = createSamuelMesh();
  samuel.position.set(0, 0, houseZ + 5.2);
  davidJesseHouseGroup.add(samuel);
  davidAnointCutscene.samuelMesh = samuel;

  const samuelRing = new THREE.Mesh(
    new THREE.RingGeometry(1.4, 1.95, 24),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide })
  );
  samuelRing.rotation.x = -Math.PI / 2;
  samuelRing.position.set(0, 0.08, houseZ + 7.4);
  samuelRing.visible = false;
  davidJesseHouseGroup.add(samuelRing);

  davidJesseHouseGroup.visible = false;
  worldGroup.add(davidJesseHouseGroup);

  const gateZ = DAVID_HILL_SLOPE_SOUTH_Z + 0.8;
  const gateY = DAVID_HILL_TOP_Y;
  const rockMat1 = matVoxel('#64748b', '#475569');
  const rockMat2 = matVoxel('#78716c', '#57534e');

  [-18, -11.5, 11.5, 18].forEach((rx, idx) => {
    const r1 = createBox(6.8, 4.2, 4.2, (idx % 2 === 0 ? rockMat1 : rockMat2).clone(), rx, gateY + 2.1, gateZ);
    worldGroup.add(r1);
    wallMeshes.push(r1);
    colliders.push({ minX: rx - 3.4, maxX: rx + 3.4, minZ: gateZ - 2.2, maxZ: gateZ + 2.2 });
    addDavidHillTree(rx + (rx < 0 ? -1.5 : 1.5), gateZ + 2.4, 1.25, true);
  });

  davidHouseGateBlocker = new THREE.Group();
  const cRock1 = createBox(5.2, 4.6, 3.6, rockMat1.clone(), -2.4, gateY + 2.3, gateZ);
  const cRock2 = createBox(5.2, 4.8, 3.6, rockMat2.clone(),  2.4, gateY + 2.4, gateZ);
  const cRock3 = createBox(4.4, 5.6, 3.2, rockMat1.clone(),  0.0, gateY + 2.8, gateZ - 0.3);
  davidHouseGateBlocker.add(cRock1, cRock2, cRock3);
  wallMeshes.push(cRock1, cRock2, cRock3);

  [-2.8, 0, 2.8].forEach(tx => {
    const tH = 3.0;
    const tTrunk = createBox(0.85, tH, 0.85, matVoxel('#78350f', '#451a03').clone(), tx, gateY + tH / 2, gateZ + 2.0);
    const tLeaf  = createBox(3.2, 2.0, 3.2, matVoxel('#15803d', '#166534').clone(), tx, gateY + tH + 0.7, gateZ + 2.0);
    davidHouseGateBlocker.add(tTrunk, tLeaf);
    wallMeshes.push(tTrunk, tLeaf);
  });
  worldGroup.add(davidHouseGateBlocker);

  davidHouseBlockerCollider = { minX: -8.2, maxX: 8.2, minZ: gateZ - 2.2, maxZ: gateZ + 2.5 };
  colliders.push(davidHouseBlockerCollider);

  targetObject = {
    type: 'samuel_anoint',
    mesh: samuel,
    spotRing: samuelRing,
    pos: new THREE.Vector3(0, 1.2, houseZ + 7.4),
    label: createWorldLabel('🏠 언덕 아래 아버지 이새의 집 (사무엘 선지자 만나기!)'),
    triggered: false
  };
  if (targetObject.label) targetObject.label.style.opacity = '0';
}

function buildDavidStage1World() {
  clearWorld();
  ensureDavidCustomUI();
  hideAllDavidCustomUI();

  scene.background = new THREE.Color(0x7dd3fc);
  scene.fog = new THREE.Fog(0x7dd3fc, 125, 340);

  const isKinder = (currentMode === 'kinder');
  const isJunior = (currentMode === 'junior');
  const isHard = (currentMode === 'senior' || currentMode === 'timeattack');
  const mapLimit = isKinder ? 38 : (isHard ? 50 : 44);
  const houseZ = -46;

  davidStage1Phase = 'find_sheep';
  davidBaseFlock = [];
  davidSheepList = [];
  davidFollowingSheep = [];
  davidGatheredSheepCount = 0;
  davidHungerGauge = 0;
  davidSheepEatingAnimTimer = 0;
  davidSheepEatParticles = [];
  davidVanishingSheepAnims = [];
  davidLostSheepCount = 0;
  davidMaxAllowedLost = isKinder ? 5 : (isJunior ? 4 : 2);
  davidAmbientBaaTimer = 3.0;

  davidFeedItems = [];
  davidHeldFeed = 0;
  davidMaxCarryFeed = isKinder ? 3 : 2;

  davidDefenseDuration = isKinder ? 40.0 : (isJunior ? 65.0 : 95.0);
  davidDefenseTimer = davidDefenseDuration;
  davidWallSectionTiers = [0, 0, 0, 0, 0, 0, 0];
  davidWallTier = 0;
  davidPlacedWallMat = 0;
  davidMaxWallTier = isKinder ? 1 : (isJunior ? 2 : 3);
  davidHeldWallMat = 0;
  davidMaxCarryWallMat = 4;
  davidWallMaterials = [];
  davidPredators = [];
  davidActivePredatorIdx = 0;
  davidPredatorTurnCooldown = 0;
  davidBrothers = [];
  davidActionCooldown = 0;

  if (currentMode === 'timeattack') {
    timeRemaining = 26.0;
  }

  currentMapRectBounds = {
    minX: -mapLimit + 2.5,
    maxX:  mapLimit - 2.5,
    minZ:  houseZ + 3.8,
    maxZ:  mapLimit - 2.5
  };

  davidAnointCutscene.houseZ = houseZ;
  buildDistantPlainAndRiverVista(houseZ);
  buildHilltopAndWindingRoadTerrain(mapLimit, houseZ);

  davidCampCenter.set(0, DAVID_HILL_TOP_Y, 12);
  buildGrazedRectangularPasture(davidCampCenter.x, davidCampCenter.z);

  davidWallGroup = new THREE.Group();
  worldGroup.add(davidWallGroup);
  initDavidFencePlatforms();

  davidCampLabel = createWorldLabel('🐑 언덕 위 다윗의 목초지 (바위 뒤에 숨은 양 5마리를 찾아 데려오세요!)');

  buildHiddenJesseHouseInLowerValley(houseZ);

  davidStaffWaveMesh = new THREE.Mesh(
    new THREE.RingGeometry(0.6, 1.2, 28),
    new THREE.MeshBasicMaterial({ color: 0xfef08a, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
  );
  davidStaffWaveMesh.rotation.x = -Math.PI / 2;
  davidStaffWaveMesh.visible = false;
  worldGroup.add(davidStaffWaveMesh);

  const hidingSpotCandidates = isHard
    ? [
        [-32,  2], [32,  2], [-36, 26], [36, 26], [0, 40],
        [-26, 38], [26, 38], [-34, 14], [34, 14]
      ]
    : (isKinder
      ? [[-18,  2], [18,  2], [-20, 22], [20, 22], [0, 30], [-14, 28], [14, 28]]
      : [[-24,  2], [24,  2], [-26, 24], [26, 24], [0, 35], [-20, 32], [20, 32]]);

  const shuffledHiding = [...hidingSpotCandidates].sort(() => Math.random() - 0.5);
  const chosenHidingRocks = shuffledHiding.slice(0, 5);
  const sheepNames = ['첫째 양', '둘째 양', '셋째 양', '넷째 양', '다섯째 양'];

  chosenHidingRocks.forEach(([rx, rz], i) => {
    addDavidStage1Rock(rx, rz, 4.0, 1.45, 3.4);
    addDavidStage1Rock(rx + 0.3, rz - 0.1, 2.5, 2.55, 2.3);
    const treeSide = (rx >= 0 ? 1 : -1);
    addDavidHillTree(rx + treeSide * 4.8, rz + 1.2, 1.15, true);

    const dirAng = Math.atan2(rx - davidCampCenter.x, rz - davidCampCenter.z);
    const sx = rx + Math.sin(dirAng) * 3.6;
    const sz = rz + Math.cos(dirAng) * 3.6;
    const sy = getDavidStage1GroundHeight(sx, sz);

    const sGrp = new THREE.Group();
    const sMesh = createSingleAnimal('sheep');
    const sRing = new THREE.Mesh(
      new THREE.RingGeometry(0.95, 1.3, 20),
      new THREE.MeshBasicMaterial({ color: 0xfde047, side: THREE.DoubleSide })
    );
    sRing.rotation.x = -Math.PI / 2;
    sRing.position.y = 0.06;
    sGrp.add(sMesh, sRing);
    sGrp.position.set(sx, sy, sz);
    sGrp.rotation.y = dirAng + Math.PI * 0.5;
    worldGroup.add(sGrp);

    const lbl = createWorldLabel(`🐑 바위 뒤에 숨은 ${sheepNames[i]}`);
    davidSheepList.push({
      index: i,
      name: sheepNames[i],
      group: sGrp,
      mesh: sMesh,
      ring: sRing,
      state: 'wild',
      heading: dirAng + Math.PI * 0.5,
      homeX: sx,
      homeY: sy,
      homeZ: sz,
      rockX: rx,
      rockZ: rz,
      orbitSign: (rx >= 0 ? -1 : 1),
      lost: false,
      label: lbl
    });
  });

  const extraRockSpots = [
    [-15, 22], [15, 22], [-18,  0], [18,  0], [-12, 30], [12, 30],
    [-25, 12], [25, 12], [-30, 18], [30, 18], [-40, 14], [40, 14],
    [-38,  0], [38,  0], [-18, 40], [18, 40]
  ];
  extraRockSpots.forEach(([rx, rz], idx) => {
    if (Math.abs(rx) < mapLimit - 4.5 && rz >= -4 && rz < mapLimit - 4.5) {
      if (isSpawnSpotClear(rx, rz, 3.2)) {
        addDavidStage1Rock(rx, rz, 3.6 + (idx % 2) * 0.6, 1.15 + (idx % 3) * 0.35, 3.4);
        if (idx % 2 === 0) addDavidStage1Rock(rx + 0.3, rz, 2.2, 2.1, 2.2);
      }
    }
  });

  const extraTreeSpots = [
    [-11, 20], [11, 20], [-13,  0], [13,  0], [-20, 18], [20, 18],
    [-20,  6], [20,  6], [-10, 26], [10, 26], [-24, 28], [24, 28],
    [-28,  0], [28,  0], [-32, 30], [32, 30], [-8,  34], [8,  34],
    [-42, 22], [42, 22], [-32, 40], [32, 40], [-12, 44], [12, 44],
    [-12, -16], [12, -16], [-16, -24], [16, -24], [-14, -32], [14, -32]
  ];
  extraTreeSpots.forEach(([tx, tz], idx) => {
    if (Math.abs(tx) < mapLimit - 3.5 && tz < mapLimit - 3.5) {
      if (isSpawnSpotClear(tx, tz, 2.5)) {
        addDavidHillTree(tx, tz, 1.0 + (idx % 3) * 0.16, true);
      }
    }
  });

  playerPos.set(0, DAVID_HILL_TOP_Y, 20.0);
  lastGroundedY = DAVID_HILL_TOP_Y;
  playerVelY = 0; isGrounded = true; playerFacing = Math.PI;
  cameraYaw = 0; cameraTargetYaw = 0;
  rebuildPlayerAppearance();
  if (playerGroup) playerGroup.rotation.y = playerFacing;

  if (guideArrowGroup) guideArrowGroup.visible = (currentMode !== 'senior');
  snapCameraToPlayer();
  updateDavidStage1UI();
  if (!window.__isBuildingOpeningPreview) {
    davidOpeningState.active = true;
    updateStageHUD();

    startDavidStage1Opening(() => {
      if (typeof setInGameHudControlsVisible === 'function') setInGameHudControlsVisible(true);
      updateStageHUD();
      playSheepBaaSound(1.05, 0.08);
    });
  }
}

// -------------------------------------------------------------------------
// 2. 스테이지 1 진행 로직 (세로형 배부름 게이지, 3D 하트, 접선 슬라이딩 추종, 디펜스)
// -------------------------------------------------------------------------
function getDavidTierVisualSpec(tier) {
  if (tier === 1) {
    return {
      name: '흙담',
      fullTitle: '🧱 1단계 흙담',
      wallMat: matDavidCached('#b45309', '#78350f'),
      topMat: matDavidCached('#d97706'),
      bpColor: 0xf59e0b,
      wallH: 1.05,
      jumpTopY: 1.05
    };
  }
  if (tier === 2) {
    return {
      name: '나무담',
      fullTitle: '🪵 2단계 나무담',
      wallMat: new THREE.MeshLambertMaterial({ map: makeLogBarkTex() }),
      topMat: matDavidCached('#92400e', '#5c2d0c'),
      bpColor: 0x38bdf8,
      wallH: 1.42,
      jumpTopY: 1.40
    };
  }
  return {
    name: '돌담',
    fullTitle: '🏰 3단계 돌담',
    wallMat: matDavidCached('#64748b', '#475569'),
    topMat: matDavidCached('#94a3b8', '#64748b'),
    bpColor: 0xe2e8f0,
    wallH: 1.78,
    jumpTopY: 1.72
  };
}

function getDavidFencePanelsLayout() {
  const cx = davidCampCenter.x;
  const cz = davidCampCenter.z;
  const halfW = DAVID_CAMP_HALF_W;
  const halfD = DAVID_CAMP_HALF_D;
  const panels = [];

  for (let i = 0; i < 8; i++) {
    const px = (cx - halfW) + (i + 0.5) * ((halfW * 2) / 8);
    panels.push({ x: px, z: cz - halfD, w: (halfW * 2) / 8 - 0.06, d: 0.68 });
  }
  for (let i = 0; i < 6; i++) {
    const pz = (cz - halfD) + (i + 0.5) * ((halfD * 2) / 6);
    panels.push({ x: cx + halfW, z: pz, w: 0.68, d: (halfD * 2) / 6 - 0.06 });
  }
  for (let i = 7; i >= 0; i--) {
    const px = (cx - halfW) + (i + 0.5) * ((halfW * 2) / 8);
    panels.push({ x: px, z: cz + halfD, w: (halfW * 2) / 8 - 0.06, d: 0.68 });
  }
  for (let i = 5; i >= 0; i--) {
    const pz = (cz - halfD) + (i + 0.5) * ((halfD * 2) / 6);
    panels.push({ x: cx - halfW, z: pz, w: 0.68, d: (halfD * 2) / 6 - 0.06 });
  }
  return panels;
}

function initDavidFencePlatforms() {
  davidWallPanelPlatforms = [];
  const panels = getDavidFencePanelsLayout();
  panels.forEach(p => {
    const platObj = {
      minX: p.x - p.w / 2 - 0.12,
      maxX: p.x + p.w / 2 + 0.12,
      minZ: p.z - p.d / 2 - 0.12,
      maxZ: p.z + p.d / 2 + 0.12,
      topY: -999,
      isDavidFence: true
    };
    platforms.push(platObj);
    davidWallPanelPlatforms.push(platObj);
  });
}

function syncDavidWallTierCounts() {
  const minT = Math.min(...davidWallSectionTiers);
  davidWallTier = Math.min(davidMaxWallTier, minT);
  if (davidWallTier >= davidMaxWallTier) {
    davidPlacedWallMat = DAVID_WALL_REQ_PER_TIER;
  } else {
    const targetT = davidWallTier + 1;
    davidPlacedWallMat = davidWallSectionTiers.filter(t => t >= targetT).length;
  }
}

function rebuildDavidDefenseWallMesh() {
  if (!davidWallGroup) return;
  while (davidWallGroup.children.length > 0) davidWallGroup.remove(davidWallGroup.children[0]);

  syncDavidWallTierCounts();
  const badgeEl = document.getElementById('david-wall-tier-badge');
  const baseY = DAVID_HILL_TOP_Y;

  if (davidStage1Phase !== 'defend_sheep' && davidWallSectionTiers.every(t => t === 0)) {
    davidWallPanelPlatforms.forEach(pl => { pl.topY = -999; });
    return;
  }

  const panels = getDavidFencePanelsLayout();
  const isAllFinished = (davidWallTier >= davidMaxWallTier);
  const nextTargetTier = isAllFinished ? davidMaxWallTier : (davidWallTier + 1);
  const nextSpec = getDavidTierVisualSpec(nextTargetTier);

  const bpMat = new THREE.MeshBasicMaterial({
    color: nextSpec.bpColor,
    transparent: true,
    opacity: 0.34
  });
  const bpLineMat = new THREE.LineBasicMaterial({ color: 0xffffff });

  panels.forEach((p, idx) => {
    const secIdx = Math.floor(idx / 4);
    const secTier = davidWallSectionTiers[secIdx] || 0;
    const platRef = davidWallPanelPlatforms[idx];

    if (secTier > 0) {
      const spec = getDavidTierVisualSpec(secTier);
      const h = spec.wallH;
      const wBox = createBox(p.w, h, p.d, spec.wallMat, p.x, baseY + h / 2, p.z);
      const tBox = createBox(p.w + 0.06, 0.18, p.d + 0.06, spec.topMat, p.x, baseY + h + 0.09, p.z, false);
      davidWallGroup.add(wBox, tBox);

      if (platRef) platRef.topY = baseY + spec.jumpTopY;
    } else if (platRef) {
      platRef.topY = -999;
    }

    if (secTier < nextTargetTier && !isAllFinished) {
      const bh = nextSpec.wallH;
      const bpBox = createBox(p.w, bh, p.d, bpMat, p.x, baseY + bh / 2, p.z, false);
      const edgeGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(p.w + 0.03, bh + 0.02, p.d + 0.03));
      const outline = new THREE.LineSegments(edgeGeo, bpLineMat);
      outline.position.set(p.x, baseY + bh / 2, p.z);
      davidWallGroup.add(bpBox, outline);
    }
  });

  if (badgeEl) {
    badgeEl.textContent = isAllFinished
      ? `${nextSpec.fullTitle} 완성!`
      : `${nextSpec.name}: ${davidPlacedWallMat}/${DAVID_WALL_REQ_PER_TIER}개`;
  }
}

function createFloatingHeartMesh(isPink = false) {
  const g = new THREE.Group();
  const hMat = new THREE.MeshBasicMaterial({ color: isPink ? 0xfb7185 : 0xf43f5e });
  const shineMat = new THREE.MeshBasicMaterial({ color: 0xffe4e6 });
  g.add(
    createBox(0.16, 0.14, 0.12, hMat,  0.00, 0.00, 0, false),
    createBox(0.34, 0.14, 0.12, hMat,  0.00, 0.13, 0, false),
    createBox(0.48, 0.16, 0.12, hMat,  0.00, 0.27, 0, false),
    createBox(0.18, 0.12, 0.12, hMat, -0.13, 0.40, 0, false),
    createBox(0.18, 0.12, 0.12, hMat,  0.13, 0.40, 0, false),
    createBox(0.08, 0.08, 0.14, shineMat, -0.14, 0.30, 0, false)
  );
  return g;
}

function triggerSheepHappyEatingEffect() {
  davidSheepEatingAnimTimer = 2.5;
  playSheepBaaSound(1.08, 0.09);
  setTimeout(() => {
    if (currentEpisode === 'david' && currentStage === 1) playSheepBaaSound(1.22, 0.08);
  }, 180);

  const allActiveSheep = [
    ...davidBaseFlock.filter(s => !s.lost).map(s => s.mesh.position),
    ...davidSheepList.filter(s => s.state === 'penned' && !s.lost).map(s => s.group.position)
  ];

  allActiveSheep.forEach((pos, idx) => {
    const heartMesh = createFloatingHeartMesh(idx % 2 === 1);
    heartMesh.position.set(pos.x, DAVID_HILL_TOP_Y + 1.45 + (idx % 3) * 0.12, pos.z);
    worldGroup.add(heartMesh);
    davidSheepEatParticles.push({
      mesh: heartMesh,
      isHeart: true,
      baseX: pos.x,
      vy: 1.15 + (idx % 3) * 0.2,
      swayPhase: idx * 0.9,
      timer: 0,
      maxLife: 1.65
    });

    const leafMat = new THREE.MeshBasicMaterial({ color: idx % 2 === 0 ? 0x4ade80 : 0x22c55e });
    const leafMesh = createBox(0.18, 0.18, 0.18, leafMat, pos.x, DAVID_HILL_TOP_Y + 0.85, pos.z + 0.32, false);
    worldGroup.add(leafMesh);
    davidSheepEatParticles.push({
      mesh: leafMesh,
      isHeart: false,
      vx: (Math.random() - 0.5) * 1.4,
      vy: 1.6 + Math.random() * 0.8,
      vz: (Math.random() - 0.5) * 1.4,
      timer: 0,
      maxLife: 0.75
    });
  });
}

function loseOneSheepByPredator(predatorTitle) {
  let targetMesh = null;
  const availableRescued = davidSheepList.filter(s => s.state === 'penned' && !s.lost);
  const availableBase = davidBaseFlock.filter(s => !s.lost);

  if (availableBase.length > 0) {
    const targetSheep = availableBase[availableBase.length - 1];
    targetSheep.lost = true;
    targetMesh = targetSheep.mesh;
  } else if (availableRescued.length > 0) {
    const targetSheep = availableRescued[availableRescued.length - 1];
    targetSheep.lost = true;
    targetMesh = targetSheep.group;
  }

  davidLostSheepCount++;
  triggerDamageFlash();
  playSfx('hit');
  playSheepBaaSound(1.35, 0.11);

  if (targetMesh) {
    const sx = targetMesh.position.x;
    const sy = targetMesh.position.y;
    const sz = targetMesh.position.z;
    const puffPuffs = [];
    for (let i = 0; i < 10; i++) {
      const col = (i % 3 === 0) ? 0xef4444 : 0xffffff;
      const pBox = createBox(0.32, 0.32, 0.32, new THREE.MeshBasicMaterial({ color: col }), sx, sy + 0.6, sz, false);
      worldGroup.add(pBox);
      const ang = (i / 10) * Math.PI * 2;
      puffPuffs.push({
        mesh: pBox,
        vx: Math.cos(ang) * 2.5,
        vy: 2.2 + (i % 3) * 0.8,
        vz: Math.sin(ang) * 2.5
      });
    }
    davidVanishingSheepAnims.push({
      sheepMesh: targetMesh,
      puffs: puffPuffs,
      timer: 0
    });
  }

  updateDavidStage1UI();
  updateStageHUD();

  if (davidLostSheepCount > davidMaxAllowedLost) {
    setTimeout(() => {
      if (currentEpisode === 'david' && currentStage === 1) {
        openDavidSheepLostRetryModal();
      }
    }, 380);
  } else {
    const remainAllowance = davidMaxAllowedLost - davidLostSheepCount;
    showToast(
      `⚠️ 담장이 없는 쪽으로 ${predatorTitle}가 들어와 양 1마리가 사라졌어요! (사라진 양 ${davidLostSheepCount}/${davidMaxAllowedLost}마리 · ${remainAllowance}마리 더 잃으면 위험!)`
    );
  }
}

function getFenceSectionIndexAtPos(x, z) {
  const panels = getDavidFencePanelsLayout();
  let bestIdx = 0;
  let minD = 9999;
  panels.forEach((p, idx) => {
    const d = Math.hypot(x - p.x, z - p.z);
    if (d < minD) {
      minD = d;
      bestIdx = idx;
    }
  });
  return Math.floor(bestIdx / 4);
}

function getDavidStage1ObstacleBoxes() {
  const list = [];
  for (const c of colliders) {
    if (c.minX > 9000) continue;
    list.push(c);
  }
  for (const p of platforms) {
    if (p.topY < -100 || p.isDavidFence) continue;
    list.push(p);
  }
  return list;
}

function resolveSheepObstaclePushOut(x, z, radius = 0.46) {
  let nx = x;
  let nz = z;
  let touched = false;
  let avgNormalX = 0;
  let avgNormalZ = 0;
  const boxes = getDavidStage1ObstacleBoxes();

  for (let iter = 0; iter < 2; iter++) {
    for (const b of boxes) {
      if (nx + radius <= b.minX || nx - radius >= b.maxX || nz + radius <= b.minZ || nz - radius >= b.maxZ) {
        continue;
      }
      const clampedX = Math.max(b.minX, Math.min(b.maxX, nx));
      const clampedZ = Math.max(b.minZ, Math.min(b.maxZ, nz));
      const dx = nx - clampedX;
      const dz = nz - clampedZ;
      const dist = Math.hypot(dx, dz);

      if (dist < radius) {
        touched = true;
        if (dist > 0.0001) {
          const push = radius - dist;
          const ux = dx / dist;
          const uz = dz / dist;
          nx += ux * push;
          nz += uz * push;
          avgNormalX += ux;
          avgNormalZ += uz;
        } else {
          const cx = (b.minX + b.maxX) * 0.5;
          const cz = (b.minZ + b.maxZ) * 0.5;
          const outAng = Math.atan2(nx - cx, nz - cz);
          nx += Math.sin(outAng) * radius;
          nz += Math.cos(outAng) * radius;
          avgNormalX += Math.sin(outAng);
          avgNormalZ += Math.cos(outAng);
        }
      }
    }
  }
  return { x: nx, z: nz, touched, normalX: avgNormalX, normalZ: avgNormalZ };
}

function moveDavidFollowingSheepSafely(sh, fIdx, dt, now) {
  const leaderPos = (fIdx === 0) ? playerPos : davidFollowingSheep[fIdx - 1].group.position;
  const keepDist = (fIdx === 0) ? 1.55 : 1.35;

  const curX = sh.group.position.x;
  const curZ = sh.group.position.z;
  const dx = leaderPos.x - curX;
  const dz = leaderPos.z - curZ;
  const dist = Math.hypot(dx, dz);

  const groundY = getDavidStage1GroundHeight(curX, curZ);
  const rowPhase = (fIdx % 2) * (Math.PI * 0.5);
  sh.group.position.y = groundY + Math.abs(Math.sin(now * 0.007 + rowPhase)) * 0.32;

  if (dist <= keepDist) return;

  const moveSpd = Math.min(11.5, Math.max(7.2, (dist - keepDist) * 5.2));
  const stepDist = Math.min(dist - keepDist + 0.05, moveSpd * dt);
  const dirX = dx / dist;
  const dirZ = dz / dist;

  const orbit = sh.orbitSign || 1;
  const boxes = getDavidStage1ObstacleBoxes();

  let avoidX = 0;
  let avoidZ = 0;
  const probeX = curX + dirX * 1.1;
  const probeZ = curZ + dirZ * 1.1;

  for (const b of boxes) {
    const cx = (b.minX + b.maxX) * 0.5;
    const cz = (b.minZ + b.maxZ) * 0.5;
    const halfW = (b.maxX - b.minX) * 0.5 + 0.85;
    const halfD = (b.maxZ - b.minZ) * 0.5 + 0.85;

    if (Math.abs(probeX - cx) < halfW && Math.abs(probeZ - cz) < halfD) {
      const fromObsX = curX - cx;
      const fromObsZ = curZ - cz;
      const len = Math.hypot(fromObsX, fromObsZ) || 1;
      const nx = fromObsX / len;
      const nz = fromObsZ / len;
      avoidX += nx * 0.7 + (-nz * orbit) * 1.35;
      avoidZ += nz * 0.7 + ( nx * orbit) * 1.35;
    }
  }

  let moveX = dirX + avoidX;
  let moveZ = dirZ + avoidZ;
  const moveLen = Math.hypot(moveX, moveZ) || 1;
  moveX /= moveLen;
  moveZ /= moveLen;

  let nextX = curX + moveX * stepDist;
  let nextZ = curZ + moveZ * stepDist;

  const resolved = resolveSheepObstaclePushOut(nextX, nextZ, 0.46);
  nextX = resolved.x;
  nextZ = resolved.z;

  if (resolved.touched) {
    const nLen = Math.hypot(resolved.normalX, resolved.normalZ) || 1;
    const tx = (-resolved.normalZ / nLen) * orbit;
    const tz = ( resolved.normalX / nLen) * orbit;
    const slideRes = resolveSheepObstaclePushOut(nextX + tx * stepDist * 0.65, nextZ + tz * stepDist * 0.65, 0.46);
    nextX = slideRes.x;
    nextZ = slideRes.z;
  }

  sh.group.position.x = nextX;
  sh.group.position.z = nextZ;

  const actualDx = nextX - curX;
  const actualDz = nextZ - curZ;
  if (Math.hypot(actualDx, actualDz) > 0.015) {
    const targetHeading = Math.atan2(actualDx, actualDz);
    sh.heading = lerpAngle(sh.heading, targetHeading, dt * 8.5);
    sh.group.rotation.y = sh.heading;
  }
}

function spawnDavidWallUpgradeMaterials() {
  davidWallMaterials.forEach(m => {
    if (m.group) worldGroup.remove(m.group);
    if (m.label) m.label.remove();
  });
  davidWallMaterials = [];

  syncDavidWallTierCounts();
  if (davidWallTier >= davidMaxWallTier) return;

  const nextTier = davidWallTier + 1;
  const neededCount = DAVID_WALL_REQ_PER_TIER - davidPlacedWallMat;
  if (neededCount <= 0) return;

  const matInfo = nextTier === 1
    ? { name: '🧱 흙담용 흙덩이', col: '#b45309', sub: '#78350f', ring: 0xf59e0b }
    : (nextTier === 2
      ? { name: '🪵 나무담용 통나무', col: '#78350f', sub: '#451a03', ring: 0x38bdf8 }
      : { name: '🪨 돌담용 성돌', col: '#64748b', sub: '#334155', ring: 0xe2e8f0 });

  for (let i = 0; i < neededCount; i++) {
    const ang = (i / Math.max(1, neededCount)) * Math.PI * 2 + 0.35;
    const dist = 11.8 + (i % 2) * 2.8;
    const mx = davidCampCenter.x + Math.cos(ang) * dist;
    const mz = Math.max(DAVID_HILL_SLOPE_SOUTH_Z + 2.5, davidCampCenter.z + Math.sin(ang) * dist);
    const my = getDavidStage1GroundHeight(mx, mz);

    const grp = new THREE.Group();
    const box = createBox(0.96, 0.68, 0.82, matDavidCached(matInfo.col, matInfo.sub), 0, 0.42, 0);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.8, 1.15, 20),
      new THREE.MeshBasicMaterial({ color: matInfo.ring, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.06;
    grp.add(box, ring);
    grp.position.set(mx, my, mz);
    worldGroup.add(grp);

    const lbl = createWorldLabel(`${matInfo.name}`);
    davidWallMaterials.push({
      group: grp,
      box,
      pos: new THREE.Vector3(mx, my + 0.5, mz),
      collected: false,
      label: lbl
    });
  }
}

function updateDavidStage1UI() {
  ensureDavidCustomUI();
  const st1Panel = document.getElementById('david-st1-panel');
  const hungerRow = document.getElementById('david-hunger-row');
  const hungerText = document.getElementById('david-hunger-text');
  const hungerBar = document.getElementById('david-hunger-bar');
  const defRow = document.getElementById('david-defense-row');
  const defTimer = document.getElementById('david-defense-timer');
  const lossBadge = document.getElementById('david-sheep-loss-badge');

  if (
    currentEpisode !== 'david' ||
    currentStage !== 1 ||
    davidStage1Phase === 'find_sheep' ||
    davidStage1Phase === 'go_home'
  ) {
    if (st1Panel) st1Panel.classList.add('hidden');
    return;
  }

  st1Panel.classList.remove('hidden');

  if (davidStage1Phase === 'defend_sheep') {
    if (hungerRow) hungerRow.classList.add('hidden');
    defRow.classList.remove('hidden');
    defRow.classList.add('flex');
    const menuBtn = document.getElementById('hud-menu-btn');
    if (menuBtn) {
      const r = menuBtn.getBoundingClientRect();
      if (r && r.bottom > 0) defRow.style.top = `${Math.max(42, Math.ceil(r.bottom) + 8)}px`;
    }
    defTimer.textContent = `${Math.max(0, davidDefenseTimer).toFixed(1)}초`;
    if (lossBadge) {
      lossBadge.textContent = `🐑 사라진 양: ${davidLostSheepCount}/${davidMaxAllowedLost}마리`;
      lossBadge.className = davidLostSheepCount >= davidMaxAllowedLost
        ? 'text-[10px] font-bold text-rose-400'
        : 'text-[10px] font-bold text-amber-200';
    }
  } else {
    if (hungerRow) hungerRow.classList.remove('hidden');
    const pct = Math.min(100, Math.round(davidHungerGauge));
    hungerText.textContent = `${pct}%`;
    hungerBar.style.height = `${pct}%`;
    defRow.classList.add('hidden');
    defRow.classList.remove('flex');
  }
}

function startDavidStage1FeedPhase() {
  davidStage1Phase = 'feed_sheep';
  davidHungerGauge = 0;
  davidHeldFeed = 0;
  const isKinder = (currentMode === 'kinder');
  const isHard = (currentMode === 'senior' || currentMode === 'timeattack');
  const mapLimit = isKinder ? 38 : (isHard ? 50 : 44);
  const feedCount = isKinder ? 3 : 5;

  const bounds = { minX: -mapLimit + 7, maxX: mapLimit - 7, minZ: -4, maxZ: mapLimit - 7 };
  const chosen = [[davidCampCenter.x, davidCampCenter.z]];
  const gMat1 = matDavidCached('#22c55e', '#15803d');
  const gMat2 = matDavidCached('#4ade80', '#16a34a');

  for (let i = 0; i < feedCount; i++) {
    const [fx, fz] = findRandomSafeSpot(bounds, chosen, 8.5, { x: davidCampCenter.x, z: davidCampCenter.z }, 10.5);
    chosen.push([fx, fz]);
    const fy = getDavidStage1GroundHeight(fx, fz);
    const grp = new THREE.Group();
    const bMesh = new THREE.Group();
    bMesh.add(createBox(0.85, 0.55, 0.85, gMat1, 0, 0.35, 0), createBox(0.65, 0.45, 0.65, gMat2, 0, 0.68, 0));
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.85, 1.2, 20), new THREE.MeshBasicMaterial({ color: 0x4ade80, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.06;
    grp.add(bMesh, ring);
    grp.position.set(fx, fy, fz);
    worldGroup.add(grp);

    davidFeedItems.push({
      group: grp, bundleMesh: bMesh, pos: new THREE.Vector3(fx, fy + 0.5, fz),
      collected: false, label: createWorldLabel(`🌿 신선한 양 먹이 풀단 ${currentMode === 'timeattack' ? '(+3.5초!)' : ''}`)
    });
  }

  davidCampLabel.innerHTML = '🌿 양을 배부르게 해주세요! (0%)';
  updateDavidStage1UI();
  updateStageHUD();
  playSheepBaaSound(1.12, 0.09);
}

function startDavidStage1DefensePhase() {
  davidStage1Phase = 'defend_sheep';
  davidWallSectionTiers = [0, 0, 0, 0, 0, 0, 0];
  davidWallTier = 0;
  davidPlacedWallMat = 0;
  davidHeldWallMat = 0;
  davidCampLabel.innerHTML = '🛡️ 사각형 울타리 방어 진영 (자원 7개를 모아 담을 쌓으세요!)';

  startStageBgm(1);

  const isKinder = (currentMode === 'kinder');
  const isJunior = (currentMode === 'junior');

  const specs = [
    { kind: 'wolf', ang:  0.0,         dist: 26, spd: isKinder ? 2.15 : (isJunior ? 2.65 : 3.20) },
    { kind: 'lion', ang:  Math.PI / 2, dist: 28, spd: isKinder ? 2.20 : (isJunior ? 2.75 : 3.30) },
    { kind: 'wolf', ang: -0.9,         dist: 26, spd: isKinder ? 2.15 : (isJunior ? 2.70 : 3.25) },
    { kind: 'lion', ang: -Math.PI / 2, dist: 28, spd: isKinder ? 2.25 : (isJunior ? 2.80 : 3.35) }
  ];

  specs.forEach((sp) => {
    const px = davidCampCenter.x + Math.sin(sp.ang) * sp.dist;
    const pz = Math.max(DAVID_HILL_SLOPE_SOUTH_Z + 2.0, davidCampCenter.z + Math.cos(sp.ang) * sp.dist);
    const py = getDavidStage1GroundHeight(px, pz);

    const pGrp = new THREE.Group();
    const pMesh = (sp.kind === 'wolf') ? createWolfMesh() : createSingleAnimal('lion');
    const warnRing = new THREE.Mesh(
      new THREE.RingGeometry(1.25, 1.65, 24),
      new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide, transparent: true, opacity: 0.75 })
    );
    warnRing.rotation.x = -Math.PI / 2; warnRing.position.y = 0.06;
    pGrp.add(pMesh, warnRing);
    pGrp.position.set(px, py, pz);
    worldGroup.add(pGrp);

    const title = (sp.kind === 'wolf') ? '🐺 사나운 늑대' : '🦁 배고픈 사자';
    davidPredators.push({
      kind: sp.kind,
      title,
      group: pGrp,
      mesh: pMesh,
      warnRing,
      homeX: px,
      homeY: py,
      homeZ: pz,
      spawnDist: sp.dist,
      speed: sp.spd,
      heading: Math.atan2(davidCampCenter.x - px, davidCampCenter.z - pz),
      fleeTimer: 0,
      fleeAngle: 0,
      label: createWorldLabel(`${title} (지팡이로 쫓아내기!)`)
    });
  });

  davidActivePredatorIdx = 0;
  davidPredatorTurnCooldown = 1.8;

  rebuildDavidDefenseWallMesh();
  spawnDavidWallUpgradeMaterials();

  updateDavidStage1UI();
  updateStageHUD();
}

function advancePredatorTurn() {
  if (davidPredators.length === 0) return;
  davidActivePredatorIdx = (davidActivePredatorIdx + 1) % davidPredators.length;
  davidPredatorTurnCooldown = 2.6;
}

function isNearDavidRectangularFence(x, z, pad = 2.6) {
  const dx = Math.abs(x - davidCampCenter.x);
  const dz = Math.abs(z - davidCampCenter.z);
  return (dx <= DAVID_CAMP_HALF_W + pad && dz <= DAVID_CAMP_HALF_D + pad);
}

function performDavidStage1Action() {
  if (davidActionCooldown > 0) return;

  if (davidStage1Phase === 'defend_sheep') {
    let hitCnt = 0;
    davidPredators.forEach((pr, idx) => {
      if (pr.fleeTimer > 0) return;
      const dToDavid = Math.hypot(pr.group.position.x - playerPos.x, pr.group.position.z - playerPos.z);
      const dToCamp = Math.hypot(pr.group.position.x - davidCampCenter.x, pr.group.position.z - davidCampCenter.z);
      if (dToDavid < 8.8 || (idx === davidActivePredatorIdx && dToCamp < 12.0 && dToDavid < 11.5)) {
        pr.fleeTimer = 4.5;
        pr.fleeAngle = Math.atan2(pr.group.position.x - davidCampCenter.x, pr.group.position.z - davidCampCenter.z);
        hitCnt++;
        if (idx === davidActivePredatorIdx) {
          advancePredatorTurn();
        }
      }
    });
    if (hitCnt > 0) {
      davidActionCooldown = 0.38;
      playerChopAnimTimer = 0.4;
      davidStaffWaveTimer = 0.45;
      playSfx('switch');
      if (currentMode === 'timeattack') timeRemaining += 2.0;
      const nextPr = davidPredators[davidActivePredatorIdx];
      showToast(`🪄 목자의 지팡이로 맹수를 물리쳤어요! (다음 습격: ${nextPr ? nextPr.title : '맹수'})`);
      return;
    }
  }

  if (davidStage1Phase === 'defend_sheep' && davidHeldWallMat > 0 && davidWallTier < davidMaxWallTier) {
    if (isNearDavidRectangularFence(playerPos.x, playerPos.z, 3.0)) {
      const targetTier = davidWallTier + 1;
      let builtNow = 0;

      while (davidHeldWallMat > 0) {
        const panels = getDavidFencePanelsLayout();
        let bestSec = -1;
        let bestDist = 9999;
        for (let s = 0; s < 7; s++) {
          if (davidWallSectionTiers[s] < targetTier) {
            const pRef = panels[s * 4 + 1];
            const d = Math.hypot(playerPos.x - pRef.x, playerPos.z - pRef.z);
            if (d < bestDist) {
              bestDist = d;
              bestSec = s;
            }
          }
        }
        if (bestSec === -1) break;
        davidWallSectionTiers[bestSec] = targetTier;
        davidHeldWallMat--;
        builtNow++;
      }

      if (builtNow > 0) {
        const prevTier = davidWallTier;
        rebuildDavidDefenseWallMesh();
        updateDavidCarriedItemsVisual();
        playSfx('hammer');
        if (currentMode === 'timeattack') timeRemaining += builtNow * 1.5;

        const curSpec = getDavidTierVisualSpec(targetTier);
        if (davidWallTier > prevTier) {
          playSfx('rescue');
          if (davidWallTier < davidMaxWallTier) {
            const nextSpec = getDavidTierVisualSpec(davidWallTier + 1);
            spawnDavidWallUpgradeMaterials();
            showToast(`🎉 ${curSpec.fullTitle}(7/7) 완성! 이어서 ${nextSpec.name} 자원 7개를 모아 업그레이드하세요!`);
          } else {
            showToast(`🏰 ${curSpec.fullTitle}(7/7) 최종 완성! 점프로 담장을 넘나들며 끝까지 지켜내세요!`);
          }
        } else {
          const rem = DAVID_WALL_REQ_PER_TIER - davidPlacedWallMat;
          showToast(`🔨 사각형 ${curSpec.name} 시공! (${davidPlacedWallMat}/7개 완료 · ${rem}개 더 필요)`);
          const uncollectedCnt = davidWallMaterials.filter(m => !m.collected).length;
          if (uncollectedCnt + davidHeldWallMat < rem) {
            spawnDavidWallUpgradeMaterials();
          }
        }
        updateDavidStage1UI();
        updateStageHUD();
        return;
      }
    }
  }

  // [스테이지 1 요청사항] 목초지에서 양에게 풀을 먹일 때도 시간(+4.0초) 부여
  if (davidStage1Phase === 'feed_sheep' && davidHeldFeed > 0) {
    if (isNearDavidRectangularFence(playerPos.x, playerPos.z, 2.2)) {
      const perFeed = (currentMode === 'kinder') ? 34 : 20;
      const gain = davidHeldFeed * perFeed;
      davidHeldFeed = 0;
      davidHungerGauge = Math.min(100, davidHungerGauge + gain);
      updateDavidCarriedItemsVisual();
      triggerSheepHappyEatingEffect();
      playSfx('rescue');
      if (currentMode === 'timeattack') timeRemaining += 4.0;

      if (davidHungerGauge >= 100) {
        davidFeedItems.forEach(f => { f.group.visible = false; f.label.style.opacity = '0'; });
        startDavidStage1DefensePhase();
      } else {
        davidCampLabel.innerHTML = `🌿 양을 배부르게 해주세요! (${Math.round(davidHungerGauge)}%)`;
        updateDavidStage1UI();
        updateStageHUD();
        showToast(
          currentMode === 'timeattack'
            ? `❤️ 양들이 맛있게 먹고 +4.0초 시간이 연장되었어요! (배부름 ${Math.round(davidHungerGauge)}%)`
            : `❤️ 양들이 맛있게 먹고 머리 위로 하트가 떠올라요! (배부름 ${Math.round(davidHungerGauge)}%)`
        );
      }
    }
  }
}

function updateDavidCarriedItemsVisual() {
  if (!carriedBlockGroup) return;
  while (carriedBlockGroup.children.length > 0) carriedBlockGroup.remove(carriedBlockGroup.children[0]);

  const count = (davidStage1Phase === 'feed_sheep') ? davidHeldFeed : davidHeldWallMat;
  const col = (davidStage1Phase === 'feed_sheep')
    ? '#22c55e'
    : (davidWallTier === 0 ? '#b45309' : (davidWallTier === 1 ? '#78350f' : '#64748b'));

  for (let i = 0; i < Math.min(count, 5); i++) {
    const item = createBox(0.62, 0.28, 0.44, matDavidCached(col), 0, i * 0.30, 0, false);
    carriedBlockGroup.add(item);
  }
}

function updateDavidStage1Frame(dt, now) {
  if (davidOpeningState.active) return;
  if (davidActionCooldown > 0) davidActionCooldown -= dt;
  if (davidSheepEatingAnimTimer > 0) davidSheepEatingAnimTimer -= dt;
  updateDavidStage1UI();

  davidAmbientBaaTimer -= dt;
  if (davidAmbientBaaTimer <= 0 && davidStage1Phase !== 'go_home') {
    davidAmbientBaaTimer = 5.5 + Math.random() * 4.0;
    const dToPasture = Math.hypot(playerPos.x - davidCampCenter.x, playerPos.z - davidCampCenter.z);
    if (dToPasture < 22 || davidFollowingSheep.length > 0) {
      playSheepBaaSound(0.92 + Math.random() * 0.25, 0.065);
    }
  }

  flowingWaterTextures.forEach(tex => {
    tex.offset.x = (tex.offset.x + dt * 0.25) % 1;
  });

  const isHappyEating = (davidSheepEatingAnimTimer > 0);

  davidBaseFlock.forEach((bs, idx) => {
    if (bs.lost) return;
    if (isHappyEating) {
      bs.mesh.position.y = bs.baseY + Math.abs(Math.sin(now * 0.024 + idx * 0.7)) * 0.48;
      bs.mesh.rotation.x = Math.sin(now * 0.035 + idx) * 0.28;
      bs.mesh.rotation.y = bs.baseRotY + Math.sin(now * 0.02 + idx) * 0.45;
    } else {
      const nod = Math.sin(now * 0.005 + bs.phase);
      bs.mesh.position.y = bs.baseY + Math.abs(Math.sin(now * 0.004 + bs.phase)) * 0.12;
      bs.mesh.rotation.x = 0;
      bs.mesh.rotation.y = bs.baseRotY + nod * 0.18;
    }
  });

  for (let i = davidSheepEatParticles.length - 1; i >= 0; i--) {
    const pt = davidSheepEatParticles[i];
    pt.timer += dt;
    if (pt.isHeart) {
      pt.mesh.position.y += pt.vy * dt;
      pt.mesh.position.x = pt.baseX + Math.sin(pt.timer * 5.0 + pt.swayPhase) * 0.22;
      pt.mesh.rotation.y = Math.sin(pt.timer * 3.5 + pt.swayPhase) * 0.45;
      const lifeRatio = pt.timer / pt.maxLife;
      const sc = lifeRatio < 0.2 ? (lifeRatio / 0.2) * 1.15 : Math.max(0.05, (1 - lifeRatio) * 1.15);
      pt.mesh.scale.set(sc, sc, sc);
    } else {
      pt.mesh.position.x += pt.vx * dt;
      pt.mesh.position.y += (pt.vy - 4.5 * pt.timer) * dt;
      pt.mesh.position.z += pt.vz * dt;
      pt.mesh.rotation.y += dt * 6;
    }
    if (pt.timer >= pt.maxLife) {
      worldGroup.remove(pt.mesh);
      davidSheepEatParticles.splice(i, 1);
    }
  }

  for (let i = davidVanishingSheepAnims.length - 1; i >= 0; i--) {
    const va = davidVanishingSheepAnims[i];
    va.timer += dt;
    const sc = Math.max(0.01, 1 - va.timer * 2.2);
    va.sheepMesh.scale.set(sc, sc, sc);
    va.sheepMesh.position.y += dt * 2.5;
    va.sheepMesh.rotation.y += dt * 14;
    va.puffs.forEach(pf => {
      pf.mesh.position.x += pf.vx * dt;
      pf.mesh.position.y += (pf.vy - 6.0 * va.timer) * dt;
      pf.mesh.position.z += pf.vz * dt;
      const pSc = Math.max(0.01, 1 - va.timer * 2.0);
      pf.mesh.scale.set(pSc, pSc, pSc);
    });
    if (va.timer >= 0.5) {
      va.sheepMesh.visible = false;
      va.puffs.forEach(pf => worldGroup.remove(pf.mesh));
      davidVanishingSheepAnims.splice(i, 1);
    }
  }

  if (davidStaffWaveTimer > 0 && davidStaffWaveMesh) {
    davidStaffWaveTimer -= dt;
    davidStaffWaveMesh.visible = true;
    const prog = 1 - (davidStaffWaveTimer / 0.45);
    const sc = 1.0 + prog * 4.8;
    davidStaffWaveMesh.position.set(playerPos.x, playerPos.y + 0.25, playerPos.z);
    davidStaffWaveMesh.scale.set(sc, sc, 1);
    davidStaffWaveMesh.material.opacity = Math.max(0, 0.9 * (1 - prog));
    if (davidStaffWaveTimer <= 0) davidStaffWaveMesh.visible = false;
  }

  let nearestTarget = null, minTargetDist = 999;
  davidSheepList.forEach((sh, idx) => {
    if (sh.lost) return;
    if (sh.state === 'penned') {
      if (isHappyEating) {
        sh.group.position.y = DAVID_HILL_TOP_Y + Math.abs(Math.sin(now * 0.025 + idx)) * 0.50;
        sh.mesh.rotation.x = Math.sin(now * 0.036 + idx) * 0.30;
        sh.group.rotation.y = Math.sin(now * 0.02 + idx) * 0.45;
      } else {
        const rowPhase = (idx % 2) * (Math.PI * 0.5);
        sh.group.position.y = DAVID_HILL_TOP_Y + Math.abs(Math.sin(now * 0.0065 + rowPhase)) * 0.26;
        sh.mesh.rotation.x = 0;
      }
      return;
    }
    if (sh.state === 'wild') {
      const peekOffset = Math.sin(now * 0.0035 + idx * 1.3) * 0.35;
      sh.group.position.x = sh.homeX + Math.cos(sh.heading) * peekOffset;
      sh.group.position.z = sh.homeZ - Math.sin(sh.heading) * peekOffset;
      sh.group.rotation.y = sh.heading + Math.sin(now * 0.005 + idx) * 0.22;
      sh.group.position.y = sh.homeY + Math.abs(Math.sin(now * 0.006 + idx)) * 0.12;

      const d = Math.hypot(playerPos.x - sh.group.position.x, playerPos.z - sh.group.position.z);
      if (davidStage1Phase === 'find_sheep' && d < minTargetDist) {
        minTargetDist = d; nearestTarget = sh.group.position;
      }
      updateWorldLabelPos(sh.label, sh.group.position, d < 24 && davidStage1Phase === 'find_sheep');

      // [스테이지 1 요청사항] 바위 뒤에 숨은 양을 만나는 순간에도 타임어택 시간(+3.5초) 즉시 부여!
      if (davidStage1Phase === 'find_sheep' && d < 3.0) {
        sh.state = 'following';
        sh.ring.material.color.setHex(0x38bdf8);
        sh.label.innerHTML = `🐑 ${sh.name} (목초지로!)`;
        davidFollowingSheep.push(sh);
        playSfx('rescue');
        playSheepBaaSound(1.0 + idx * 0.06, 0.10);
        if (currentMode === 'timeattack') {
          timeRemaining += 3.5;
          showToast(`🐑 바위 뒤에 숨어 있던 ${sh.name} 발견! (+3.5초 연장! 목초지로 데려가세요!)`);
        } else {
          showToast(`🐑 바위 뒤에 숨어 있던 ${sh.name}을(를) 찾았어요! 언덕 위 목초지로 데려가세요!`);
        }
      }
    }
  });

  for (let fIdx = 0; fIdx < davidFollowingSheep.length; fIdx++) {
    const sh = davidFollowingSheep[fIdx];
    moveDavidFollowingSheepSafely(sh, fIdx, dt, now);
    updateWorldLabelPos(sh.label, sh.group.position, true);
  }

  // [스테이지 1 요청사항] 양을 목초지에 데려다 줄 때도 마리당 +4.5초 시간 부여!
  if (davidFollowingSheep.length > 0 && isNearDavidRectangularFence(playerPos.x, playerPos.z, 0.8)) {
    let deliveredNow = 0;
    while (davidFollowingSheep.length > 0) {
      const sh = davidFollowingSheep.shift();
      sh.state = 'penned';
      sh.ring.visible = false;
      sh.label.style.opacity = '0';

      const slotX = -4.5 + (davidGatheredSheepCount % 5) * 2.25;
      const slotZ = davidCampCenter.z + (davidGatheredSheepCount % 2 === 0 ? -1.5 : 1.8);
      sh.group.position.set(slotX, DAVID_HILL_TOP_Y, slotZ);
      sh.group.rotation.y = 0;
      davidGatheredSheepCount++;
      deliveredNow++;
      if (currentMode === 'timeattack') timeRemaining += 4.5;
    }
    playSfx('rescue');
    playSheepBaaSound(1.15, 0.09);

    if (davidGatheredSheepCount >= 5) {
      startDavidStage1FeedPhase();
    } else {
      updateStageHUD();
      const bonusMsg = (currentMode === 'timeattack') ? ` (+${(deliveredNow * 4.5).toFixed(1)}초 시간 연장!)` : '';
      showToast(`🐑 양이 사각형 목초지 무리에 합류했어요! (${davidGatheredSheepCount}/5마리)${bonusMsg}`);
    }
  }

  // [스테이지 1 요청사항] 초원에서 풀(양 먹이)을 줍는 순간에도 타임어택 시간(+3.5초) 즉시 부여!
  if (davidStage1Phase === 'feed_sheep') {
    davidFeedItems.forEach(fi => {
      if (fi.collected) return;
      fi.bundleMesh.rotation.y += dt * 2.0;
      const d = Math.hypot(playerPos.x - fi.pos.x, playerPos.z - fi.pos.z);
      if (d < minTargetDist) { minTargetDist = d; nearestTarget = fi.pos; }
      updateWorldLabelPos(fi.label, fi.pos, d < 28);

      if (d < 2.2) {
        if (davidHeldFeed >= davidMaxCarryFeed) {
          if (!fi._warn || now - fi._warn > 1500) {
            fi._warn = now; playSfx('wrong');
            showToast(`🌿 먹이는 한 번에 ${davidMaxCarryFeed}개까지만 들 수 있어요! 양들에게 먼저 먹여주세요!`);
          }
          return;
        }
        fi.collected = true;
        fi.group.visible = false;
        fi.label.style.opacity = '0';
        davidHeldFeed++;
        updateDavidCarriedItemsVisual();
        playSfx('rescue');
        if (currentMode === 'timeattack') {
          timeRemaining += 3.5;
          showToast(`🌿 양 먹이 풀 획득! (+3.5초 연장! 보유 ${davidHeldFeed}개 · 중앙 목초지로 가져가세요!)`);
        } else {
          showToast(`🌿 양 먹이 획득! (보유 ${davidHeldFeed}개 · 중앙 목초지로 가져가세요!)`);
        }
      }
    });
  }

  let nearestThreat = null, minThreatDist = 999;
  if (davidStage1Phase === 'defend_sheep') {
    davidDefenseTimer -= dt;
    if (davidPredatorTurnCooldown > 0) davidPredatorTurnCooldown -= dt;

    const remainingToFinishTier = DAVID_WALL_REQ_PER_TIER - davidPlacedWallMat;
    davidWallMaterials.forEach(wm => {
      if (wm.collected) return;
      wm.box.rotation.y += dt * 2.2;
      const d = Math.hypot(playerPos.x - wm.pos.x, playerPos.z - wm.pos.z);
      if (davidHeldWallMat < Math.min(davidMaxCarryWallMat, remainingToFinishTier) && d < minTargetDist) {
        minTargetDist = d; nearestTarget = wm.pos;
      }
      updateWorldLabelPos(wm.label, wm.pos, d < 26);

      if (d < 2.25) {
        if (davidHeldWallMat >= davidMaxCarryWallMat || davidHeldWallMat >= remainingToFinishTier) {
          if (!wm._warnAt || now - wm._warnAt > 1500) {
            wm._warnAt = now;
            showToast('🔨 자재를 충분히 들었어요! 사각형 반투명 울타리로 가서 담을 쌓으세요!');
          }
          return;
        }
        wm.collected = true;
        wm.group.visible = false;
        wm.label.style.opacity = '0';
        davidHeldWallMat++;
        updateDavidCarriedItemsVisual();
        playSfx('build');
        const curSpec = getDavidTierVisualSpec(davidWallTier + 1);
        showToast(`🔨 ${curSpec.name} 자재 획득! (보유 ${davidHeldWallMat}개 · 사각형 반투명 울타리에 쌓으세요!)`);
      }
    });

    if (davidHeldWallMat > 0 && davidWallTier < davidMaxWallTier && isNearDavidRectangularFence(playerPos.x, playerPos.z, 1.8)) {
      performDavidStage1Action();
    }

    davidPredators.forEach((pr, idx) => {
      const px = pr.group.position.x, pz = pr.group.position.z;
      const py = getDavidStage1GroundHeight(px, pz);

      if (pr.fleeTimer > 0) {
        pr.fleeTimer -= dt;
        pr.warnRing.visible = false;
        const nx = px + Math.sin(pr.fleeAngle) * (pr.speed * 1.95) * dt;
        const nz = Math.max(DAVID_HILL_SLOPE_SOUTH_Z + 1.5, pz + Math.cos(pr.fleeAngle) * (pr.speed * 1.95) * dt);
        const dFromCamp = Math.hypot(nx - davidCampCenter.x, nz - davidCampCenter.z);
        if (dFromCamp < pr.spawnDist + 2.0) {
          pr.group.position.x = nx;
          pr.group.position.z = nz;
        }
        pr.group.rotation.y = pr.fleeAngle;
        pr.group.position.y = getDavidStage1GroundHeight(pr.group.position.x, pr.group.position.z) + Math.abs(Math.sin(now * 0.018 + idx)) * 0.24;
        updateWorldLabelPos(pr.label, pr.group.position, false);
        return;
      }

      const isMyTurn = (idx === davidActivePredatorIdx && davidPredatorTurnCooldown <= 0);
      if (!isMyTurn) {
        pr.warnRing.visible = false;
        const dHome = Math.hypot(pr.homeX - px, pr.homeZ - pz);
        if (dHome > 1.5) {
          const toHome = Math.atan2(pr.homeX - px, pr.homeZ - pz);
          pr.group.position.x += Math.sin(toHome) * (pr.speed * 0.85) * dt;
          pr.group.position.z += Math.cos(toHome) * (pr.speed * 0.85) * dt;
          pr.group.rotation.y = toHome;
        } else {
          pr.group.rotation.y = Math.atan2(davidCampCenter.x - px, davidCampCenter.z - pz) + Math.sin(now * 0.003 + idx) * 0.3;
        }
        pr.group.position.y = py;
        updateWorldLabelPos(pr.label, pr.group.position, false);
        return;
      }

      pr.warnRing.visible = true;
      const panels = getDavidFencePanelsLayout();
      let aimX = davidCampCenter.x;
      let aimZ = davidCampCenter.z;

      let nearestOpenSec = -1;
      let minOpenDist = 9999;
      for (let s = 0; s < 7; s++) {
        if (davidWallSectionTiers[s] === 0) {
          const pRef = panels[s * 4 + 1];
          const d = Math.hypot(px - pRef.x, pz - pRef.z);
          if (d < minOpenDist) {
            minOpenDist = d;
            nearestOpenSec = s;
          }
        }
      }
      if (nearestOpenSec !== -1) {
        const openPanel = panels[nearestOpenSec * 4 + 1];
        aimX = openPanel.x;
        aimZ = openPanel.z;
      }

      const toTargetAng = Math.atan2(aimX - px, aimZ - pz);
      pr.heading = lerpAngle(pr.heading, toTargetAng, dt * 4.8);

      const nx = px + Math.sin(pr.heading) * pr.speed * dt;
      const nz = pz + Math.cos(pr.heading) * pr.speed * dt;

      const hitRectFence =
        Math.abs(nx - davidCampCenter.x) <= DAVID_CAMP_HALF_W + 0.55 &&
        Math.abs(nz - davidCampCenter.z) <= DAVID_CAMP_HALF_D + 0.55;

      if (!hitRectFence) {
        pr.group.position.x = nx;
        pr.group.position.z = nz;
      } else {
        const hitSecIdx = getFenceSectionIndexAtPos(nx, nz);
        const secTier = davidWallSectionTiers[hitSecIdx] || 0;

        pr.fleeTimer = 4.5;
        pr.fleeAngle = Math.atan2(px - davidCampCenter.x, pz - davidCampCenter.z);
        advancePredatorTurn();

        if (secTier === 0) {
          loseOneSheepByPredator(pr.title);
          if (!isPlaying) return;
        } else if (secTier >= davidMaxWallTier || secTier >= 3) {
          playSfx('build');
          showToast(`🏰 든든한 사각형 담장이 ${pr.title}를 완벽히 막아냈어요!`);
        } else {
          playSfx('hammer');
          if (currentMode === 'senior' || currentMode === 'timeattack') {
            davidWallSectionTiers[hitSecIdx] = Math.max(0, secTier - 1);
            rebuildDavidDefenseWallMesh();
            spawnDavidWallUpgradeMaterials();
            showToast(`🧱 담장이 ${pr.title}를 막아 양을 지켰지만 담장 일부가 부서졌어요! 다시 보수하고 업그레이드하세요!`);
          } else {
            showToast(`🧱 사각형 담장이 ${pr.title}의 침입을 든든히 막아냈어요!`);
          }
        }
      }

      pr.group.rotation.y = pr.heading;
      pr.group.position.y = getDavidStage1GroundHeight(pr.group.position.x, pr.group.position.z) + Math.abs(Math.sin(now * 0.012 + idx)) * 0.16;

      const dDavid = Math.hypot(playerPos.x - pr.group.position.x, playerPos.z - pr.group.position.z);
      updateWorldLabelPos(pr.label, pr.group.position, true);
      if (dDavid < 8.8 && dDavid < minThreatDist) {
        minThreatDist = dDavid;
        nearestThreat = pr;
      }
      if (dDavid < 2.35) {
        performDavidStage1Action();
      }
    });

    if (davidDefenseTimer <= 0 && isPlaying) {
      davidStage1Phase = 'go_home';
      davidHeldWallMat = 0;
      updateDavidCarriedItemsVisual();
      davidPredators.forEach(pr => { pr.group.visible = false; pr.label.style.opacity = '0'; });
      davidWallMaterials.forEach(wm => { wm.group.visible = false; wm.label.style.opacity = '0'; });
      if (davidCampLabel) davidCampLabel.style.opacity = '0';

      if (davidJesseHouseGroup) davidJesseHouseGroup.visible = true;
      if (davidHouseGateBlocker) davidHouseGateBlocker.visible = false;
      if (davidHouseBlockerCollider) {
        davidHouseBlockerCollider.minX = 9999;
        davidHouseBlockerCollider.maxX = 9999;
      }
      if (targetObject && targetObject.spotRing) targetObject.spotRing.visible = true;
      if (targetObject && targetObject.label) {
        targetObject.label.innerHTML = '📯 언덕 아래 아버지 이새의 집 (내리막길을 따라 사무엘 선지자에게 가세요!)';
        targetObject.label.style.opacity = '1';
      }

      startStageBgm(1);
      updateDavidStage1UI();
      updateStageHUD();
      playSfx('clear');
      playSheepBaaSound(1.18, 0.09);

      if (davidLostSheepCount === 0) {
        DAVID_SCRIPTURE[1].title = '스테이지 1 클리어! 단 한 마리도 잃지 않고 완벽히 지켰어요!';
        DAVID_SCRIPTURE[1].desc = '단 한 마리의 양도 잃지 않고 맹수로부터 양 떼를 완벽히 막아냈어요! 언덕 아래 집으로 내려가 사무엘 선지자에게 기름부음을 받았어요!';
        showToast('🎉 단 한 마리의 양도 잃지 않고 완벽히 막아냈어요! 북쪽 내리막길을 따라 언덕 아래 집으로 내려가세요!');
      } else {
        DAVID_SCRIPTURE[1].title = '스테이지 1 클리어! 끝까지 버텨 양 떼를 지켜냈어요!';
        DAVID_SCRIPTURE[1].desc = `맹수의 습격에 사라진 양(${davidLostSheepCount}마리)이 있어 아쉽지만, 끝까지 포기하지 않고 양 떼를 지켜내어 이겼어요! 언덕 아래 집으로 내려가 사무엘 선지자에게 기름부음을 받았어요!`;
        showToast(`🛡️ 사라진 양(${davidLostSheepCount}마리)이 있어 아쉽지만 끝까지 버텨 이겼어요! 언덕 아래 집으로 내려가세요!`);
      }
    }
  }

  const pBtn = document.getElementById('puzzle-build-btn');
  const nearFence = isNearDavidRectangularFence(playerPos.x, playerPos.z, 2.8);

  if (davidStage1Phase === 'defend_sheep' && nearestThreat) {
    pBtn.classList.remove('hidden');
    pBtn.textContent = `🪄 목자의 지팡이로 ${nearestThreat.title} 쫓아내기!`;
  } else if (davidStage1Phase === 'defend_sheep' && davidHeldWallMat > 0 && nearFence && davidWallTier < davidMaxWallTier) {
    const curSpec = getDavidTierVisualSpec(davidWallTier + 1);
    pBtn.classList.remove('hidden');
    pBtn.textContent = `🔨 사각형 ${curSpec.name} 쌓기! (${davidPlacedWallMat}/${DAVID_WALL_REQ_PER_TIER})`;
  } else if (davidStage1Phase === 'feed_sheep' && davidHeldFeed > 0 && nearFence) {
    pBtn.classList.remove('hidden');
    pBtn.textContent = `🌿 양 떼에게 먹이 주기! (보유 ${davidHeldFeed}개)`;
    if (isNearDavidRectangularFence(playerPos.x, playerPos.z, 1.5)) performDavidStage1Action();
  } else {
    pBtn.classList.add('hidden');
  }

  const dCamp = Math.hypot(playerPos.x - davidCampCenter.x, playerPos.z - davidCampCenter.z);
  if (davidCampLabel && davidStage1Phase !== 'go_home') {
    updateWorldLabelPos(davidCampLabel, davidCampCenter, dCamp < 30);
  }

  if (targetObject && !targetObject.triggered) {
    const td = Math.hypot(playerPos.x - targetObject.pos.x, playerPos.z - targetObject.pos.z);
    updateWorldLabelPos(targetObject.label, targetObject.pos, davidStage1Phase === 'go_home' && td < 55);

    const ctxBtn = document.getElementById('context-action-btn');
    if (davidStage1Phase === 'go_home' && td < 4.5 && Math.abs(playerPos.y - targetObject.pos.y) < 3.0) {
      ctxBtn.classList.remove('hidden');
      ctxBtn.textContent = '📯 사무엘 선지자에게 기름부음 받기!';
      if (td < 2.6) triggerContextAction();
    } else {
      ctxBtn.classList.add('hidden');
    }

    if (guideArrowGroup && guideArrowGroup.visible) {
      let guidePos = targetObject.pos;
      const baseFacing = (window.globalCameraViewMode === 'fps') ? (cameraYaw + Math.PI) : playerFacing;
      if (davidStage1Phase === 'find_sheep') {
        guidePos = (davidFollowingSheep.length > 0) ? davidCampCenter : (nearestTarget || davidCampCenter);
      } else if (davidStage1Phase === 'feed_sheep') {
        guidePos = (davidHeldFeed > 0) ? davidCampCenter : (nearestTarget || davidCampCenter);
      } else if (davidStage1Phase === 'defend_sheep') {
        guidePos = (davidHeldWallMat > 0) ? davidCampCenter : (nearestTarget || davidCampCenter);
      } else if (davidStage1Phase === 'go_home') {
        if (playerPos.z > DAVID_HILL_SLOPE_NORTH_Z + 2.0) {
          const nextZ = Math.max(DAVID_HILL_SLOPE_NORTH_Z, playerPos.z - 6.0);
          guidePos = { x: getDavidHillRoadCenterX(nextZ), z: nextZ };
        } else {
          guidePos = targetObject.pos;
        }
      }
      guideArrowGroup.rotation.y = Math.atan2(guidePos.x - playerPos.x, guidePos.z - playerPos.z) - baseFacing;
    }
  }
}

function startDavidStage1AnointCutscene() {
  isPlaying = false;
  isTimeAttackActive = false;
  hideAllDavidCustomUI();
  document.getElementById('context-action-btn').classList.add('hidden');
  document.getElementById('puzzle-build-btn').classList.add('hidden');
  document.getElementById('hud-mission-box').classList.add('hidden');
  if (typeof hideMissionGuideBubbleImmediately === 'function') hideMissionGuideBubbleImmediately();
  if (targetObject && targetObject.label) targetObject.label.style.opacity = '0';
  if (targetObject && targetObject.spotRing) targetObject.spotRing.visible = false;

  const hz = davidAnointCutscene.houseZ;
  playerPos.set(0, 0, hz + 7.0);
  playerFacing = Math.PI;
  playerGroup.position.copy(playerPos);
  playerGroup.rotation.y = playerFacing;

  davidAnointCutscene.sparkles.forEach(s => worldGroup.remove(s.mesh));
  davidAnointCutscene.sparkles = [];
  const colors = [0xfef08a, 0xfacc15, 0xf59e0b, 0xffffff];
  for (let i = 0; i < 24; i++) {
    const spMat = new THREE.MeshBasicMaterial({ color: colors[i % colors.length] });
    const spMesh = createBox(0.24, 0.24, 0.24, spMat, 0, 3.2, hz + 7.0, false);
    worldGroup.add(spMesh);
    davidAnointCutscene.sparkles.push({
      mesh: spMesh, ang: (i / 24) * Math.PI * 2, rad: 0.55 + (i % 4) * 0.35, yOff: (i / 24) * 3.5
    });
  }

  davidAnointCutscene.active = true;
  davidAnointCutscene.timer = 0;
  davidAnointCutscene.phase = 1;
  playSfx('clear');
  showToast('📯 언덕 아래 아버지 이새의 집에서 사무엘 선지자가 다윗에게 기름을 붓습니다! (삼상 16:13)');
}

function updateDavidAnointCutsceneFrame(dt, now) {
  if (!davidAnointCutscene.active) return false;
  davidAnointCutscene.timer += dt;
  const t = davidAnointCutscene.timer;
  const hz = davidAnointCutscene.houseZ;

  camera.position.lerp(new THREE.Vector3(2.8, 3.6, hz + 11.8), 0.12);
  camera.lookAt(0, 1.8, hz + 6.0);

  if (davidAnointCutscene.samuelMesh && davidAnointCutscene.samuelMesh.userData.rArm) {
    davidAnointCutscene.samuelMesh.userData.rArm.rotation.x = -1.85 + Math.sin(t * 4.0) * 0.15;
  }

  davidAnointCutscene.sparkles.forEach(sp => {
    const curY = 4.2 - ((t * 1.8 + sp.yOff) % 3.4);
    const curAng = sp.ang + now * 0.005;
    sp.mesh.position.set(Math.cos(curAng) * sp.rad, curY, hz + 7.0 + Math.sin(curAng) * sp.rad);
    sp.mesh.rotation.y += dt * 5;
  });

  davidBrothers.forEach(b => {
    b.mesh.position.y = Math.abs(Math.sin(now * 0.01 + b.phase)) * 0.35;
  });

  if (t >= 3.6) {
    davidAnointCutscene.active = false;
    davidAnointCutscene.sparkles.forEach(s => { s.mesh.visible = false; });
    openStageClearModal(1);
  }
  return true;
}
// =========================================================================
// [ep3_david_st1_2.js - 후반부 (2/2)] 에피소드 3 : 스테이지 2 (엘라 골짜기와 골리앗)
// - 골리앗 3D 모델링: 청동 조각을 비늘처럼 겹쳐 만든 청동 갑옷(어린갑)·청동 견갑·청동 경갑 및 놋투구 디테일 구현
// - 물맷돌 5개를 모두 수집(5/5개)해야 조준창이 열리도록 조건 강화
// - 다윗 대화 시선 고정, 이스라엘 군사 뒤편 엘라 골짜기 산맥, 승리 팡파르 행진곡 연동 유지
// =========================================================================

// 엘라 골짜기 시냇물의 중심 Z좌표 계산 함수
function getElahStreamCenterZ(x) {
  return 4.8 + Math.sin(x * 0.14) * 2.6 + Math.cos(x * 0.07) * 1.1;
}

// -------------------------------------------------------------------------
// 1. 비늘처럼 청동 조각을 겹쳐 만든 청동 갑옷 텍스처 & 거대 골리앗(놋투구·청동갑옷) 3D 모델링
// -------------------------------------------------------------------------
let _goliathBronzeScaleTex = null;
function makeGoliathBronzeScaleTex() {
  if (_goliathBronzeScaleTex) return _goliathBronzeScaleTex;
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d');

  // 어두운 청동 가죽 밑바탕
  ctx.fillStyle = '#3b1906';
  ctx.fillRect(0, 0, 128, 128);

  const rows = 8;
  const cols = 8;
  const cellW = 128 / cols;
  const cellH = 128 / rows;

  for (let r = 0; r < rows; r++) {
    const offsetX = (r % 2) * (cellW * 0.5);
    const y = r * cellH;

    for (let col = -1; col <= cols; col++) {
      const x = col * cellW + offsetX;

      // 청동 비늘 외곽 어두운 테두리 (겹침 그림자)
      ctx.fillStyle = '#451a03';
      ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 1);

      // 청동 조각 본체 (따뜻한 황동·청동 그라데이션 톤)
      ctx.fillStyle = (r + col) % 2 === 0 ? '#b45309' : '#a16207';
      ctx.fillRect(x + 2, y + 2, cellW - 4, cellH - 4);

      // 비늘 아랫부분 둥근 금속판 느낌 강조
      ctx.fillStyle = '#d97706';
      ctx.fillRect(x + 3, y + 3, cellW - 6, cellH - 6);

      // 청동 비늘 상단 금속 반사광 하이라이트
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(x + 4, y + 3, cellW - 8, 2);

      // 비늘 고정용 작은 청동 리벳 점
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(x + cellW * 0.5 - 1, y + 4, 2, 2);

      // 비늘 하단 겹침 음영
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x + 3, y + cellH - 4, cellW - 6, 2);
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  _goliathBronzeScaleTex = tex;
  return tex;
}

function createGiantGoliathMesh() {
  const g = new THREE.Group();
  const s = 3.2;

  const skinMat = matDavidCached('#c27838', '#9a5822');
  // 놋(청동) 투구 및 갑옷용 금속 재질 팔레트
  const bronzeMat = matDavidCached('#b45309', '#78350f');
  const brightBronzeMat = matDavidCached('#d97706', '#b45309');
  const polishedBrassMat = matDavidCached('#f59e0b', '#d97706');
  const darkBronze = matDavidCached('#78350f', '#451a03');
  const scaleArmorMat = new THREE.MeshLambertMaterial({ map: makeGoliathBronzeScaleTex() });
  const kiltMat = matDavidCached('#7f1d1d', '#450a0a');
  const ironMat = matDavidCached('#64748b', '#334155');
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

  // 1) 다리 & 놋 경갑(청동 정강이 보호대와 발등 청동 판금)
  const lLeg = new THREE.Group(); lLeg.position.set(-0.26 * s, 0.75 * s, 0);
  lLeg.add(
    createBox(0.38 * s, 0.72 * s, 0.38 * s, bronzeMat, 0, -0.36 * s, 0),
    createBox(0.41 * s, 0.56 * s, 0.12 * s, brightBronzeMat, 0, -0.36 * s, 0.17 * s),
    createBox(0.42 * s, 0.12 * s, 0.42 * s, polishedBrassMat, 0, -0.10 * s, 0.02 * s),
    createBox(0.42 * s, 0.22 * s, 0.46 * s, darkBronze, 0, -0.68 * s, 0.04 * s)
  );
  const rLeg = new THREE.Group(); rLeg.position.set(0.26 * s, 0.75 * s, 0);
  rLeg.add(
    createBox(0.38 * s, 0.72 * s, 0.38 * s, bronzeMat, 0, -0.36 * s, 0),
    createBox(0.41 * s, 0.56 * s, 0.12 * s, brightBronzeMat, 0, -0.36 * s, 0.17 * s),
    createBox(0.42 * s, 0.12 * s, 0.42 * s, polishedBrassMat, 0, -0.10 * s, 0.02 * s),
    createBox(0.42 * s, 0.22 * s, 0.46 * s, darkBronze, 0, -0.68 * s, 0.04 * s)
  );

  // 2) 몸통: 비늘처럼 청동 조각을 겹쳐 만든 어린갑(Scale Armor) 본체 + 입체 겹침 비늘 층
  const torso = createBox(1.14 * s, 1.18 * s, 0.64 * s, scaleArmorMat, 0, 1.32 * s, 0);
  const chestPlate = createBox(1.18 * s, 0.52 * s, 0.68 * s, scaleArmorMat, 0, 1.56 * s, 0);
  const collarGuard = createBox(1.06 * s, 0.14 * s, 0.70 * s, polishedBrassMat, 0, 1.86 * s, 0);
  g.add(lLeg, rLeg, torso, chestPlate, collarGuard);

  // 앞가슴과 등판에 실제로 층층이 겹쳐진 입체 청동 비늘 조각(Scale Lamellae) 배치
  for (let r = 0; r < 5; r++) {
    const rowY = (1.08 + r * 0.16) * s;
    const isEven = (r % 2 === 0);
    const numScales = isEven ? 6 : 5;
    for (let c = 0; c < numScales; c++) {
      const sx = ((c - (numScales - 1) * 0.5) * 0.18) * s;
      const scMat = ((r + c) % 2 === 0) ? brightBronzeMat : bronzeMat;
      const rimMat = ((r + c) % 2 === 0) ? polishedBrassMat : brightBronzeMat;
      // 전면 청동 비늘 조각
      g.add(
        createBox(0.165 * s, 0.145 * s, 0.06 * s, scMat, sx, rowY, 0.345 * s, false),
        createBox(0.145 * s, 0.04 * s, 0.07 * s, rimMat, sx, rowY + 0.045 * s, 0.35 * s, false)
      );
      // 후면 청동 비늘 조각
      g.add(
        createBox(0.165 * s, 0.145 * s, 0.06 * s, scMat, sx, rowY, -0.345 * s, false)
      );
    }
  }

  // 허리 벨트 및 청동 비늘 치마(Tassets)
  const skirt = createBox(1.16 * s, 0.46 * s, 0.66 * s, kiltMat, 0, 0.78 * s, 0);
  const belt = createBox(1.22 * s, 0.20 * s, 0.72 * s, darkBronze, 0, 0.98 * s, 0);
  const beltBuckle = createBox(0.32 * s, 0.24 * s, 0.76 * s, polishedBrassMat, 0, 0.98 * s, 0);
  g.add(skirt, belt, beltBuckle);

  for (let t = -2; t <= 2; t++) {
    const tx = t * 0.22 * s;
    g.add(
      createBox(0.19 * s, 0.34 * s, 0.70 * s, (t % 2 === 0 ? bronzeMat : brightBronzeMat), tx, 0.76 * s, 0),
      createBox(0.16 * s, 0.08 * s, 0.72 * s, polishedBrassMat, tx, 0.88 * s, 0, false)
    );
  }

  // 3) 얼굴과 수염
  const head = createBox(0.76 * s, 0.76 * s, 0.76 * s, skinMat, 0, 2.28 * s, 0);
  const beard = createBox(0.80 * s, 0.42 * s, 0.35 * s, matDavidCached('#1e293b'), 0, 2.04 * s, 0.32 * s);
  const lEye = createBox(0.12 * s, 0.10 * s, 0.06 * s, eyeMat, -0.18 * s, 2.32 * s, 0.39 * s, false);
  const rEye = createBox(0.12 * s, 0.10 * s, 0.06 * s, eyeMat,  0.18 * s, 2.32 * s, 0.39 * s, false);
  g.add(head, beard, lEye, rEye);

  // 4) [요청사항] 골리앗의 디테일한 놋투구(Bronze Helmet: 다단 청동 돔, 리벳 테두리, 코 보호대, 경첩식 볼 가리개, 뒷목 가리개)
  const helmetGroup = new THREE.Group();
  helmetGroup.position.set(0, 2.58 * s, 0);
  helmetGroup.add(
    // 놋투구 하단 메인 바디 & 상단 다단 청동 돔
    createBox(0.90 * s, 0.36 * s, 0.90 * s, bronzeMat, 0, -0.02 * s, 0),
    createBox(0.82 * s, 0.22 * s, 0.82 * s, brightBronzeMat, 0, 0.22 * s, 0),
    createBox(0.70 * s, 0.14 * s, 0.70 * s, polishedBrassMat, 0, 0.36 * s, 0),
    // 투구 중앙 마루(Crest Ridge)
    createBox(0.22 * s, 0.16 * s, 0.92 * s, polishedBrassMat, 0, 0.38 * s, 0),
    // 이마 청동 테두리 밴드 & 챙(Brim)
    createBox(0.95 * s, 0.14 * s, 0.96 * s, darkBronze, 0, -0.16 * s, 0.03 * s),
    createBox(0.97 * s, 0.07 * s, 0.98 * s, polishedBrassMat, 0, -0.12 * s, 0.04 * s),
    // 코 보호대 (Nasal Guard)
    createBox(0.13 * s, 0.36 * s, 0.12 * s, polishedBrassMat, 0, -0.32 * s, 0.45 * s),
    // 좌우 놋투구 뺨 보호대 (비늘/판금 겹침 형태)
    createBox(0.18 * s, 0.50 * s, 0.52 * s, bronzeMat, -0.43 * s, -0.36 * s, 0.16 * s),
    createBox(0.20 * s, 0.38 * s, 0.42 * s, brightBronzeMat, -0.44 * s, -0.36 * s, 0.18 * s),
    createBox(0.18 * s, 0.50 * s, 0.52 * s, bronzeMat,  0.43 * s, -0.36 * s, 0.16 * s),
    createBox(0.20 * s, 0.38 * s, 0.42 * s, brightBronzeMat,  0.44 * s, -0.36 * s, 0.18 * s),
    // 뒷목 청동 비늘 보호대(Neck Guard)
    createBox(0.88 * s, 0.42 * s, 0.18 * s, scaleArmorMat, 0, -0.34 * s, -0.42 * s)
  );
  // 놋투구 둘레 청동 리벳 징 장식
  [-0.34, -0.17, 0, 0.17, 0.34].forEach(rx => {
    helmetGroup.add(createBox(0.06 * s, 0.06 * s, 0.06 * s, polishedBrassMat, rx * s, -0.16 * s, 0.50 * s, false));
  });

  // 놋투구 위 우상 장식 (타격 목표물)
  const idolGroup = new THREE.Group();
  idolGroup.position.set(0, 0.50 * s, 0);
  const idolBaseMat = matDavidCached('#7e22ce', '#581c87');
  const idolGoldMat = matDavidCached('#facc15', '#ca8a04');
  const idolGlowMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });

  const idolPedestal = createBox(0.55 * s, 0.18 * s, 0.55 * s, idolGoldMat, 0, 0.09 * s, 0);
  const idolBody = createBox(0.46 * s, 0.58 * s, 0.42 * s, idolBaseMat, 0, 0.45 * s, 0);
  const idolWingL = createBox(0.38 * s, 0.42 * s, 0.16 * s, idolGoldMat, -0.38 * s, 0.52 * s, 0);
  const idolWingR = createBox(0.38 * s, 0.42 * s, 0.16 * s, idolGoldMat,  0.38 * s, 0.52 * s, 0);
  const idolHornL = createBox(0.14 * s, 0.36 * s, 0.14 * s, idolGoldMat, -0.22 * s, 0.85 * s, 0);
  const idolHornR = createBox(0.14 * s, 0.36 * s, 0.14 * s, idolGoldMat,  0.22 * s, 0.85 * s, 0);
  const idolCore = createBox(0.24 * s, 0.24 * s, 0.48 * s, idolGlowMat, 0, 0.48 * s, 0, false);

  const targetRing = new THREE.Mesh(
    new THREE.RingGeometry(0.55 * s, 0.72 * s, 24),
    new THREE.MeshBasicMaterial({ color: 0xfde047, side: THREE.DoubleSide })
  );
  targetRing.position.set(0, 0.52 * s, 0.28 * s);

  idolGroup.add(idolPedestal, idolBody, idolWingL, idolWingR, idolHornL, idolHornR, idolCore, targetRing);
  helmetGroup.add(idolGroup);

  // 5) 양팔 & 겹겹이 층진 청동 비늘 어깨 견갑(Pauldrons) & 대형 청동 방패와 베틀채 같은 창
  const lArm = new THREE.Group(); lArm.position.set(-0.78 * s, 1.68 * s, 0);
  lArm.add(
    // 3단 겹침 청동 어깨 견갑
    createBox(0.50 * s, 0.26 * s, 0.52 * s, scaleArmorMat, -0.06 * s, 0.08 * s, 0),
    createBox(0.54 * s, 0.12 * s, 0.56 * s, polishedBrassMat, -0.08 * s, -0.02 * s, 0),
    createBox(0.48 * s, 0.12 * s, 0.50 * s, brightBronzeMat, -0.06 * s, -0.14 * s, 0),
    createBox(0.36 * s, 0.78 * s, 0.36 * s, skinMat, 0, -0.38 * s, 0),
    createBox(0.40 * s, 0.36 * s, 0.40 * s, bronzeMat, 0, -0.52 * s, 0),
    // 거대한 청동 방패
    createBox(0.98 * s, 1.48 * s, 0.18 * s, bronzeMat, -0.22 * s, -0.45 * s, 0.38 * s),
    createBox(0.82 * s, 1.30 * s, 0.22 * s, brightBronzeMat, -0.22 * s, -0.45 * s, 0.40 * s),
    createBox(0.32 * s, 0.32 * s, 0.26 * s, polishedBrassMat, -0.22 * s, -0.45 * s, 0.43 * s)
  );

  const rArm = new THREE.Group(); rArm.position.set(0.78 * s, 1.68 * s, 0);
  rArm.add(
    // 3단 겹침 청동 어깨 견갑
    createBox(0.50 * s, 0.26 * s, 0.52 * s, scaleArmorMat, 0.06 * s, 0.08 * s, 0),
    createBox(0.54 * s, 0.12 * s, 0.56 * s, polishedBrassMat, 0.08 * s, -0.02 * s, 0),
    createBox(0.48 * s, 0.12 * s, 0.50 * s, brightBronzeMat, 0.06 * s, -0.14 * s, 0),
    createBox(0.36 * s, 0.78 * s, 0.36 * s, skinMat, 0, -0.38 * s, 0),
    createBox(0.40 * s, 0.36 * s, 0.40 * s, bronzeMat, 0, -0.52 * s, 0),
    // 거대한 창
    createBox(0.14 * s, 2.85 * s, 0.14 * s, darkBronze, 0.08 * s, -0.15 * s, 0.42 * s),
    createBox(0.26 * s, 0.65 * s, 0.26 * s, ironMat, 0.08 * s, 1.42 * s, 0.42 * s)
  );

  g.add(helmetGroup, lArm, rArm);
  g.userData = {
    scale: s,
    lArm, rArm, helmetGroup, idolGroup,
    idolParts: [idolHornL, idolHornR, idolWingL, idolWingR, idolBody, idolCore],
    targetRing
  };
  return g;
}

function createArmySoldierMesh(isPhilistine, idx = 0) {
  const g = new THREE.Group();
  const skin = matDavidCached('#fed7aa', '#fdba74');
  const eyeMat = matDavidCached('#0f172a');
  const woodMat = matDavidCached('#5c2d0c', '#451a03');
  const ironMat = matDavidCached('#94a3b8', '#475569');

  const armorMat = isPhilistine
    ? matDavidCached(idx % 2 === 0 ? '#7f1d1d' : '#991b1b', '#450a0a')
    : matDavidCached(idx % 2 === 0 ? '#1d4ed8' : '#0284c7', '#1e3a8a');
  const helmMat = isPhilistine
    ? matDavidCached('#b45309', '#78350f')
    : matDavidCached('#eab308', '#ca8a04');
  const shieldMat = isPhilistine
    ? matDavidCached('#92400e', '#451a03')
    : matDavidCached('#f8fafc', '#cbd5e1');

  const legs = createBox(0.64, 0.65, 0.34, matDavidCached('#475569'), 0, 0.32, 0);
  const torso = createBox(0.80, 0.95, 0.46, armorMat, 0, 1.10, 0);
  const head = createBox(0.66, 0.66, 0.66, skin, 0, 1.90, 0);
  const helm = createBox(0.74, 0.28, 0.74, helmMat, 0, 2.22, 0);
  const lEye = createBox(0.09, 0.09, 0.05, eyeMat, -0.14, 1.92, 0.34, false);
  const rEye = createBox(0.09, 0.09, 0.05, eyeMat,  0.14, 1.92, 0.34, false);

  const lArm = new THREE.Group(); lArm.position.set(-0.52, 1.45, 0);
  lArm.add(
    createBox(0.26, 0.62, 0.26, armorMat, 0, -0.25, 0),
    createBox(0.52, 0.72, 0.12, shieldMat, -0.12, -0.28, 0.22)
  );

  const rArm = new THREE.Group(); rArm.position.set(0.52, 1.45, 0);
  rArm.add(
    createBox(0.26, 0.62, 0.26, armorMat, 0, -0.25, 0),
    createBox(0.08, 1.85, 0.08, woodMat, 0.04, 0.15, 0.24, false),
    createBox(0.14, 0.32, 0.14, ironMat, 0.04, 1.15, 0.24, false)
  );

  g.add(legs, torso, head, helm, lEye, rEye, lArm, rArm);
  g.userData = { lArm, rArm };
  return g;
}

// -------------------------------------------------------------------------
// 2. 전쟁 오프닝(5초·3초·7초) 및 골리앗-다윗 카메라 클로즈업 대화 (다윗 시선 골리앗 고정)
// -------------------------------------------------------------------------
function showStage2PreBattleLine(speakerTitle, fullLine, voicePitch, btnLabel) {
  ensureDavidCustomUI();
  const dlg = document.getElementById('david-npc-dialog');
  const nameEl = document.getElementById('david-npc-name');
  const textEl = document.getElementById('david-npc-text');
  const btnEl = document.getElementById('david-npc-action-btn');
  if (!dlg) return;

  dlg.classList.remove('hidden');
  dlg.classList.add('david-stage2-intro');
  nameEl.textContent = speakerTitle;
  btnEl.textContent = btnLabel;
  textEl.textContent = '';

  if (davidStage2Dialogue.typingTimer) clearInterval(davidStage2Dialogue.typingTimer);
  let shownLen = 0;
  davidStage2Dialogue.typingTimer = setInterval(() => {
    shownLen += 2;
    textEl.textContent = fullLine.slice(0, shownLen);
    if (shownLen >= fullLine.length) {
      clearInterval(davidStage2Dialogue.typingTimer);
      davidStage2Dialogue.typingTimer = null;
    }
  }, 38);

  playAnimaleseSpeech(fullLine, voicePitch);
}

window.advanceDavidStage2Dialogue = function () {
  if (!davidStage2Dialogue.active) return;
  if (davidStage2Dialogue.typingTimer) {
    clearInterval(davidStage2Dialogue.typingTimer);
    davidStage2Dialogue.typingTimer = null;
  }
  if (davidStage2Dialogue.autoNextTimer) {
    clearTimeout(davidStage2Dialogue.autoNextTimer);
    davidStage2Dialogue.autoNextTimer = null;
  }

  if (davidStage2Dialogue.step === 1) {
    davidStage2Dialogue.step = 2;
    davidStage2Dialogue.timer = 0;
    if (typeof setPlayerMeshVisibilityForCamera === 'function') setPlayerMeshVisibilityForCamera(false);
    playerFacing = Math.PI;
    if (playerGroup) {
      playerGroup.visible = true;
      playerGroup.position.copy(playerPos);
      playerGroup.rotation.y = Math.PI;
    }
    const isLandscape = (typeof window !== 'undefined') && (window.innerWidth > window.innerHeight);
    camera.position.set(
      playerPos.x + (isLandscape ? 1.85 : 1.55),
      playerPos.y + (isLandscape ? 1.92 : 2.08),
      playerPos.z - (isLandscape ? 4.15 : 3.55)
    );
    camera.lookAt(playerPos.x - 0.1, playerPos.y + (isLandscape ? 1.38 : 1.68), playerPos.z);

    const davidLine =
      '"너는 나에게 칼과 큰 창과 작은 창을 가지고 나아오지만, 나는 만군의 여호와의 이름으로 너에게 간다. 여호와는 이스라엘 군대의 하나님이시다. 오늘 여호와께서는 너를 나에게 주실 것이다."';
    showStage2PreBattleLine('🪉 소년 다윗', davidLine, 1.08, '⚔️ 전투 시작하기! ▶');
  } else {
    davidStage2Dialogue.active = false;
    davidStage2Dialogue.step = 0;
    const dlg = document.getElementById('david-npc-dialog');
    if (dlg) {
      dlg.classList.add('hidden');
      dlg.classList.remove('david-stage2-intro');
    }
    if (animaleseTimer) { clearInterval(animaleseTimer); animaleseTimer = null; }

    playerFacing = Math.PI;
    if (playerGroup) playerGroup.rotation.y = Math.PI;
    if (playerLimbs && playerLimbs.rArm) playerLimbs.rArm.rotation.x = 0;

    isPlaying = true;
    if (currentMode === 'timeattack') isTimeAttackActive = true;
    if (typeof setInGameHudControlsVisible === 'function') setInGameHudControlsVisible(true);
    if (typeof setPlayerMeshVisibilityForCamera === 'function') {
      setPlayerMeshVisibilityForCamera(window.globalCameraViewMode === 'fps');
    }
    snapCameraToPlayer();
    updateStageHUD();
    startStageBgm(2);
  }
};

function startDavidStage2PreBattleDialogue() {
  isPlaying = false;
  isTimeAttackActive = false;
  if (typeof setInGameHudControlsVisible === 'function') setInGameHudControlsVisible(false);
  if (typeof setPlayerMeshVisibilityForCamera === 'function') setPlayerMeshVisibilityForCamera(false);
  davidStage2Dialogue.active = true;
  davidStage2Dialogue.step = 1;
  davidStage2Dialogue.timer = 0;

  playerFacing = Math.PI;
  if (playerGroup) {
    playerGroup.visible = true;
    playerGroup.position.copy(playerPos);
    playerGroup.rotation.y = Math.PI;
  }
  if (davidGoliathObj) {
    davidGoliathObj.rotation.y = 0;
  }

  const isLandscape = (typeof window !== 'undefined') && (window.innerWidth > window.innerHeight);
  camera.position.set(isLandscape ? 2.2 : 1.9, isLandscape ? 7.8 : 8.5, isLandscape ? -3.4 : -4.4);
  camera.lookAt(0, isLandscape ? 7.6 : 8.6, -17.5);

  const goliathLine = '"이것이 이스라엘이 보낸 전사란 말이냐? 앳된 애송이 하나뿐이라니"';
  showStage2PreBattleLine('🗿 거인 전사 골리앗', goliathLine, 0.58, '다음 (다윗의 대답) ▶');
}

function startDavidStage2OpeningAndDialogue() {
  runDavidBlackoutSequence(
    [
      {
        icon: '⚔️',
        html: '"블레셋 군대가 유다 땅을 침공했다.<br/>사울 왕이 이끄는 이스라엘과 적군 블레셋은<br/>엘라 골짜기를 사이에 두고 팽팽히 대치했다"',
        sub: '',
        sfxMode: 'battle',
        durationMs: 5000
      },
      {
        icon: '🛡️',
        html: '"블레셋 진영에서 키가 약 3미터에 달하는 거인 전사,<br/>골리앗이 걸어 나왔다."',
        sub: '',
        sfxMode: 'giant_steps',
        durationMs: 3000
      },
      {
        icon: '🪨',
        html: '"모두가 숨죽이던 그때, 형들의 안부를 물으러 전장에 온<br/>베들레헴의 어린 목동 다윗.<br/>살아 계신 하나님을 모욕하는 골리앗의 목소리를 들은 소년은<br/>홀로 전장으로 발걸음을 옮긴다."',
        sub: '',
        sfxMode: 'battle',
        durationMs: 7000
      }
    ],
    () => {
      startDavidStage2PreBattleDialogue();
    }
  );
}

// -------------------------------------------------------------------------
// 3. 시냇가 물맷돌, 양 진영 40명 군대, 이스라엘 뒤편 짧은 평지 후 엘라 골짜기 산맥 생성
// -------------------------------------------------------------------------
function spawnBrookSlingStones(count) {
  davidSlingStones.forEach(st => {
    if (st.group) worldGroup.remove(st.group);
    if (st.label) st.label.remove();
  });
  davidSlingStones = [];

  const isMovingStream = (currentMode === 'senior' || currentMode === 'timeattack');
  const stoneColors = ['#94a3b8', '#64748b', '#cbd5e1', '#78716c', '#a8a29e'];

  for (let i = 0; i < count; i++) {
    const sx = -15 + (i / Math.max(1, count - 1)) * 30 + (Math.random() - 0.5) * 2.0;
    const zOffset = ((i % 3) - 1) * 1.35;
    const sz = getElahStreamCenterZ(sx) + zOffset;

    const grp = new THREE.Group();
    const stoneMat = matDavidCached(stoneColors[i % stoneColors.length], '#475569');
    const core = createBox(0.68, 0.44, 0.62, stoneMat, 0, 0.28, 0);
    const midFacet = createBox(0.54, 0.34, 0.50, matDavidCached('#94a3b8', '#475569'), 0.04, 0.44, -0.03, false);
    const topCap = createBox(0.38, 0.18, 0.36, matDavidCached('#cbd5e1', '#64748b'), -0.03, 0.58, 0.02, false);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.75, 1.1, 20),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.08;

    grp.add(core, midFacet, topCap, ring);
    grp.position.set(sx, 0, sz);
    worldGroup.add(grp);

    const vx = isMovingStream ? ((i % 2 === 0 ? 1 : -1) * (2.5 + (i % 3) * 0.55)) : 0;
    const lbl = createWorldLabel(`🪨 매끄러운 물맷돌 ${isMovingStream ? '(물살에 흘러감!)' : '(5개 모두 모으기!)'}`);
    davidSlingStones.push({
      group: grp,
      core,
      pos: new THREE.Vector3(sx, 0.5, sz),
      zOffset,
      vx,
      collected: false,
      respawnTimer: 0,
      label: lbl
    });
  }
}

function createDavidSlingStoneProjectileMesh() {
  const stoneGrp = new THREE.Group();
  const baseRockMat = matDavidCached('#64748b', '#334155');
  const midRockMat = matDavidCached('#94a3b8', '#475569');
  const lightRockMat = matDavidCached('#cbd5e1', '#64748b');
  const darkChipMat = matDavidCached('#475569', '#1e293b');

  const polyGeo = new THREE.DodecahedronGeometry(0.46, 0);
  const polyMat = new THREE.MeshLambertMaterial({ color: 0x94a3b8, flatShading: true });
  const polyCore = new THREE.Mesh(polyGeo, polyMat);
  polyCore.scale.set(1.18, 0.84, 1.04);

  const mainSlab = createBox(0.74, 0.44, 0.62, midRockMat, 0, 0, 0, false);
  const upperRidge = createBox(0.54, 0.30, 0.46, lightRockMat, -0.05, 0.22, 0.03, false);
  const lowerBase = createBox(0.58, 0.26, 0.48, baseRockMat, 0.04, -0.20, -0.02, false);
  const sideFacetL = createBox(0.24, 0.30, 0.42, baseRockMat, -0.34, -0.03, 0.02, false);
  const sideFacetR = createBox(0.22, 0.28, 0.38, darkChipMat, 0.34, 0.04, -0.03, false);

  stoneGrp.add(polyCore, mainSlab, upperRidge, lowerBase, sideFacetL, sideFacetR);
  return stoneGrp;
}

function updateDavidCarriedStonesVisual() {
  if (!carriedBlockGroup) return;
  while (carriedBlockGroup.children.length > 0) carriedBlockGroup.remove(carriedBlockGroup.children[0]);
  const sMat = matDavidCached('#94a3b8', '#475569');
  const capMat = matDavidCached('#cbd5e1', '#64748b');
  for (let i = 0; i < Math.min(davidHeldStones, 5); i++) {
    const st = createBox(0.46, 0.22, 0.40, sMat, 0, i * 0.30, 0, false);
    const cap = createBox(0.32, 0.10, 0.28, capMat, 0.02, i * 0.30 + 0.14, 0, false);
    carriedBlockGroup.add(st, cap);
  }
  const hudBox = document.getElementById('hud-block-box');
  if (currentEpisode === 'david' && currentStage === 2) {
    hudBox.classList.remove('hidden'); hudBox.classList.add('flex');
    document.getElementById('hud-block-text').textContent = davidStonesUnlockedAim
      ? `물맷돌 ${davidHeldStones}/5개 (조준가능!)`
      : `물맷돌 ${davidHeldStones}/5개 (5개필수)`;
  }
}

function buildStage2SouthPlainAndMountains() {
  const grassMat = new THREE.MeshLambertMaterial({ map: makeGrassFieldTex() });
  const fieldMat1 = matDavidCached('#84cc16', '#65a30d');
  const fieldMat2 = matDavidCached('#eab308', '#ca8a04');
  const ridgeRock1 = matDavidCached('#b45309', '#78350f');
  const ridgeRock2 = matDavidCached('#92400e', '#5c2d0c');
  const mtnSlate1 = matDavidCached('#64748b', '#475569');
  const mtnSlate2 = matDavidCached('#475569', '#334155');
  const mtnGreen1 = matDavidCached('#15803d', '#166534');
  const mtnGreen2 = matDavidCached('#16a34a', '#15803d');

  const southPlain = createBox(220, 2.0, 90, grassMat, 0, -1.02, 72, false);
  southPlain.receiveShadow = true;
  worldGroup.add(southPlain);

  [
    [-22, 41, 18, 8, fieldMat1],
    [  0, 42, 20, 8, fieldMat2],
    [ 22, 41, 18, 8, fieldMat1]
  ].forEach(([px, pz, pw, pd, m]) => {
    worldGroup.add(createBox(pw, 0.10, pd, m, px, 0.04, pz, false));
  });

  [[-28, 39], [-14, 43], [0, 44], [14, 43], [28, 39], [-36, 42], [36, 42]].forEach(([tx, tz], idx) => {
    if (idx % 3 === 0) addPalmTree(tx, tz, 1.1, false);
    else addTree(tx, tz, 1.0 + (idx % 2) * 0.15, false);
  });

  const frontFoothills = [
    [-64, 52, 22, 11, 14],
    [-44, 51, 20, 10, 12],
    [-25, 52, 20, 12, 14],
    [ -6, 53, 18,  9, 12],
    [ 12, 52, 20, 11, 14],
    [ 31, 51, 20, 10, 12],
    [ 50, 52, 22, 12, 14],
    [ 68, 53, 24, 11, 14]
  ];
  frontFoothills.forEach(([mx, mz, mw, mh, md], idx) => {
    const rMat = (idx % 2 === 0) ? ridgeRock1 : ridgeRock2;
    worldGroup.add(
      createBox(mw, mh, md, rMat, mx, mh / 2 - 0.5, mz, false),
      createBox(mw * 0.82, mh * 0.45, md * 0.82, mtnGreen2, mx, mh + (mh * 0.45) / 2 - 0.8, mz + 1.0, false)
    );
    addTree(mx - 3, mz - md * 0.3, 1.1, false);
    addTree(mx + 4, mz - md * 0.25, 1.0, false);
  });

  const midMountains = [
    [-78, 65, 28, 20, 18],
    [-52, 66, 26, 22, 18],
    [-28, 64, 26, 19, 18],
    [ -4, 66, 26, 23, 18],
    [ 22, 65, 26, 20, 18],
    [ 48, 66, 26, 22, 18],
    [ 74, 65, 28, 21, 18]
  ];
  midMountains.forEach(([mx, mz, mw, mh, md], idx) => {
    const mMat = (idx % 2 === 0) ? mtnSlate1 : ridgeRock1;
    worldGroup.add(
      createBox(mw, mh, md, mMat, mx, mh / 2 - 0.5, mz, false),
      createBox(mw * 0.72, mh * 0.65, md * 0.75, mtnGreen1, mx + (idx % 2 === 0 ? 2 : -2), mh * 0.85, mz - 1.5, false),
      createBox(mw * 0.48, mh * 0.50, md * 0.55, mtnSlate2, mx, mh * 1.15, mz + 1.0, false)
    );
  });

  const highPeaks = [
    [-90, 86, 36, 32, 24],
    [-58, 88, 36, 38, 24],
    [-26, 85, 34, 34, 24],
    [  4, 88, 38, 42, 26],
    [ 34, 86, 34, 35, 24],
    [ 64, 88, 36, 39, 24],
    [ 92, 86, 36, 33, 24]
  ];
  highPeaks.forEach(([mx, mz, mw, mh, md], idx) => {
    worldGroup.add(
      createBox(mw, mh, md, idx % 2 === 0 ? mtnSlate2 : mtnSlate1, mx, mh / 2 - 1.0, mz, false),
      createBox(mw * 0.68, mh * 0.55, md * 0.7, mtnGreen1, mx - 3, mh * 0.48, mz - 8, false),
      createBox(mw * 0.52, mh * 0.42, md * 0.55, ridgeRock2, mx + 3, mh + mh * 0.15, mz + 2, false)
    );
  });

  [32, 42, 52].forEach((sz, idx) => {
    [-38, 38].forEach((sx, sIdx) => {
      const sh = 14 + idx * 3;
      worldGroup.add(
        createBox(18, sh, 12, sIdx === 0 ? ridgeRock1 : ridgeRock2, sx, sh / 2 - 0.5, sz, false),
        createBox(14, sh * 0.5, 10, mtnGreen1, sx, sh + 2.0, sz, false)
      );
    });
  });

  [
    [-42, 28, 72, 1.3],
    [  0, 32, 80, 1.45],
    [ 44, 29, 74, 1.35]
  ].forEach(([cx, cy, cz, sc]) => {
    const cl = createFluffyCloudGroup(sc, false);
    cl.position.set(cx, cy, cz);
    worldGroup.add(cl);
  });
}

function buildDavidStage2World() {
  clearWorld();
  ensureDavidCustomUI();
  hideAllDavidCustomUI();

  scene.background = new THREE.Color(0x38bdf8);
  scene.fog = new THREE.Fog(0xbae6fd, 90, 260);

  const isKinder = (currentMode === 'kinder');
  const isJunior = (currentMode === 'junior');
  const halfW = 24;
  currentMapRectBounds = { minX: -halfW + 2.0, maxX: halfW - 2.0, minZ: -12.5, maxZ: 30.0 };

  davidHeldStones = 0;
  davidMaxStones = 5;
  davidStonesUnlockedAim = false;
  davidIdolHits = 0;
  davidReqIdolHits = isKinder ? 1 : (isJunior ? 2 : 3);
  davidGoliathHazards = [];
  davidPhilistineSoldiers = [];
  davidIsraelSoldiers = [];
  davidIdolShards = [];
  davidAimAutoCooldown = 0;
  davidAimState.active = false;
  davidFlyingStone.active = false;
  davidStage2Cutscene.active = false;
  davidStage2Dialogue.active = false;

  if (currentMode === 'timeattack') {
    timeRemaining = 22.0;
  }

  const sandMat = new THREE.MeshLambertMaterial({ map: makeDesertSandTex() });
  const valleyGround = createBox(halfW * 2 + 24, 2, 72, sandMat, 0, -1.0, 8, false);
  valleyGround.receiveShadow = true;
  worldGroup.add(valleyGround);

  buildStage2SouthPlainAndMountains();

  const waterTex = makeFlowingWaterWallTex();
  const streamMat = new THREE.MeshLambertMaterial({ map: waterTex, transparent: true, opacity: 0.88 });
  const bankMat = matDavidCached('#94a3b8', '#64748b');
  const pebbleMat = matDavidCached('#cbd5e1', '#94a3b8');

  for (let x = -halfW - 6; x <= halfW + 6; x += 1.6) {
    const cz = getElahStreamCenterZ(x);
    worldGroup.add(
      createBox(1.85, 0.15, 6.4, streamMat, x, 0.05, cz, false),
      createBox(1.85, 0.22, 0.75, bankMat, x, 0.11, cz - 3.4, false),
      createBox(1.85, 0.22, 0.75, bankMat, x, 0.11, cz + 3.4, false)
    );
    if (Math.abs(Math.round(x)) % 4 === 0) {
      worldGroup.add(createBox(0.55, 0.18, 0.55, pebbleMat, x + 0.3, 0.14, cz - 3.1, false));
      worldGroup.add(createBox(0.50, 0.18, 0.50, pebbleMat, x - 0.3, 0.14, cz + 3.1, false));
    }
  }

  const cliffMat1 = matDavidCached('#d97706', '#92400e');
  const cliffMat2 = matDavidCached('#b45309', '#78350f');
  for (let z = -26; z <= 36; z += 9) {
    [-halfW - 6, halfW + 6].forEach((bx, sIdx) => {
      const h = 11 + (Math.abs(z + sIdx * 5) % 6);
      worldGroup.add(createBox(12, h, 9.2, (sIdx % 2 === 0 ? cliffMat1 : cliffMat2), bx, h / 2 - 0.5, z, false));
    });
  }

  const northHillMat = matDavidCached('#78350f', '#451a03');
  worldGroup.add(
    createBox(halfW * 2 + 12, 3.2, 14, northHillMat, 0, 1.6, -21, false),
    createBox(halfW * 2 + 24, 9.5, 14, cliffMat2, 0, 4.75, -31, false),
    createBox(halfW * 2 + 40, 18.0, 18, matDavidCached('#64748b', '#475569'), 0, 9.0, -44, false)
  );

  const goliath = createGiantGoliathMesh();
  goliath.position.set(0, 3.1, -17.5);
  worldGroup.add(goliath);
  davidGoliathObj = goliath;

  const philistineXList = [-21.5, -18.0, -14.5, -11.0, -7.5, 7.5, 11.0, 14.5, 18.0, 21.5];
  [-16.5, -20.2].forEach((rowZ, rIdx) => {
    philistineXList.forEach((px, cIdx) => {
      const idx = rIdx * 10 + cIdx;
      const pSol = createArmySoldierMesh(true, idx);
      pSol.position.set(px + (rIdx % 2 === 1 ? 0.6 : -0.6), 3.1, rowZ);
      pSol.rotation.y = 0;
      worldGroup.add(pSol);
      davidPhilistineSoldiers.push({ mesh: pSol, phase: idx * 0.55 });
    });
  });

  const israelXList = [-20.5, -16.5, -12.5, -8.5, -4.5, 4.5, 8.5, 12.5, 16.5, 20.5];
  [30.5, 34.0].forEach((rowZ, rIdx) => {
    israelXList.forEach((ix, cIdx) => {
      const idx = rIdx * 10 + cIdx;
      const iSol = createArmySoldierMesh(false, idx);
      iSol.position.set(ix + (rIdx % 2 === 1 ? 0.5 : -0.5), 0, rowZ);
      iSol.rotation.y = Math.PI;
      worldGroup.add(iSol);
      davidIsraelSoldiers.push({ mesh: iSol, phase: idx * 0.55 });
    });
  });

  const projMesh = createDavidSlingStoneProjectileMesh();
  projMesh.visible = false;
  worldGroup.add(projMesh);
  davidFlyingStone.mesh = projMesh;

  const padMat = matDavidCached('#fde047', '#ca8a04');
  const padRing = new THREE.Mesh(
    new THREE.RingGeometry(2.4, 3.1, 32),
    new THREE.MeshBasicMaterial({ color: 0xfde047, side: THREE.DoubleSide })
  );
  padRing.rotation.x = -Math.PI / 2;
  padRing.position.set(0, 0.14, -6.5);
  worldGroup.add(createBox(4.4, 0.20, 4.4, padMat, 0, 0.10, -6.5, false), padRing);

  const goliathIdolWorldPos = new THREE.Vector3(0, 13.2, -17.5);
  targetObject = {
    type: 'goliath_aim_pad',
    pos: new THREE.Vector3(0, 0.5, -6.5),
    idolPos: goliathIdolWorldPos,
    spotRing: padRing,
    label: createWorldLabel(`🎯 물맷돌 조준 영역 (물맷돌 5개를 모두 모아야 열려요!)`),
    triggered: false
  };

  spawnBrookSlingStones(5);

  const hazardSpots = isKinder
    ? [[-7, 13], [7, 13], [0, -1]]
    : (isJunior
      ? [[-10, 14], [0, 14], [10, 14], [-6, -2], [6, -2]]
      : [[-12, 15], [-4, 15], [4, 15], [12, 15], [-8, 5.0], [8, 5.0], [-6, -2.5], [6, -2.5]]);

  const rockMat = matDavidCached('#57534e', '#44403c');
  hazardSpots.forEach(([hx, hz], idx) => {
    const warnGrp = new THREE.Group();
    warnGrp.position.set(hx, 0.08, hz);
    const fillMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.25 });
    const fillBox = createBox(4.2, 0.04, 4.2, fillMat, 0, 0, 0, false);
    const borderMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    warnGrp.add(
      fillBox,
      createBox(4.2, 0.06, 0.14, borderMat, 0, 0.02, -2.03, false),
      createBox(4.2, 0.06, 0.14, borderMat, 0, 0.02,  2.03, false),
      createBox(0.14, 0.06, 4.2, borderMat, -2.03, 0.02, 0, false),
      createBox(0.14, 0.06, 4.2, borderMat,  2.03, 0.02, 0, false)
    );
    worldGroup.add(warnGrp);

    const boulderGrp = new THREE.Group();
    boulderGrp.add(
      createBox(1.8, 1.8, 1.8, rockMat, 0, 0, 0, false),
      createBox(1.3, 1.3, 1.3, cliffMat2, 0.4, 0.4, 0.3, false)
    );
    boulderGrp.position.set(hx, 15, hz);
    boulderGrp.visible = false;
    worldGroup.add(boulderGrp);

    const interval = isKinder ? 4.8 : (isJunior ? 4.0 : 3.2);
    davidGoliathHazards.push({
      x: hx, z: hz, halfW: 2.1, halfD: 2.1,
      timer: (idx * 0.65) % interval,
      interval,
      warnGrp, fillBox, boulderGrp,
      _sfx: false, _hitAt: 0
    });
  });

  playerPos.set(0, 0, 24.5);
  lastGroundedY = 0;
  playerVelY = 0; isGrounded = true; playerFacing = Math.PI;
  cameraYaw = 0; cameraTargetYaw = 0;
  rebuildPlayerAppearance();
  if (playerGroup) {
    playerGroup.position.copy(playerPos);
    playerGroup.rotation.y = Math.PI;
  }
  if (guideArrowGroup) guideArrowGroup.visible = (currentMode !== 'senior');
  snapCameraToPlayer();
  davidOpeningState.active = true;
  updateStageHUD();

  startDavidStage2OpeningAndDialogue();
}

// -------------------------------------------------------------------------
// 4. [요청사항] 물맷돌 5개를 모두 모아야 열리는 조준 화면 제어
// -------------------------------------------------------------------------
function openDavidAimOverlay() {
  if (davidAimState.active || davidFlyingStone.active || davidStage2Cutscene.active || davidStage2Dialogue.active) return;

  // 물맷돌 5개를 모두 모아 조준 자격이 해금된 상태인지 확인
  if (!davidStonesUnlockedAim || davidHeldStones <= 0) {
    playSfx('wrong');
    showToast(`🪨 시냇가에서 물맷돌 5개를 모두 모아야 조준창이 열려요! (현재 ${davidHeldStones}/5개)`);
    return;
  }

  ensureDavidCustomUI();
  const overlay = document.getElementById('david-aim-overlay');
  if (!overlay) return;

  davidAimState.active = true;
  davidAimState.phase = 0;
  playerFacing = Math.PI;
  if (playerGroup) playerGroup.rotation.y = Math.PI;
  overlay.classList.remove('hidden');
  playSfx('switch');
  renderDavidPixelAimScreen(davidAimState.reticleX, davidAimState.reticleY, davidAimState.targetX, davidAimState.targetY, performance.now());
}

window.closeDavidAimOverlay = function () {
  davidAimState.active = false;
  davidAimAutoCooldown = 2.2;
  const overlay = document.getElementById('david-aim-overlay');
  if (overlay) overlay.classList.add('hidden');
  if (playerLimbs && playerLimbs.rArm) playerLimbs.rArm.rotation.x = 0;
};

window.fireDavidSlingAtIdol = function () {
  if (!davidAimState.active || davidHeldStones <= 0) return;

  davidHeldStones--;
  if (davidHeldStones <= 0) {
    davidStonesUnlockedAim = false;
  }
  updateDavidCarriedStonesVisual();

  if (davidHeldStones === 0 && davidSlingStones.every(s => s.collected)) {
    spawnBrookSlingStones(5);
  }

  const dx = (davidAimState.reticleX + 20) - (davidAimState.targetX + 24);
  const dy = (davidAimState.reticleY + 20) - (davidAimState.targetY + 24);
  const dist = Math.hypot(dx, dy);
  const hitThreshold = (currentMode === 'kinder') ? 46 : (currentMode === 'junior' ? 38 : 34);
  const isSuccess = (dist <= hitThreshold);

  closeDavidAimOverlay();
  davidAimAutoCooldown = 2.1;

  davidFlyingStone.active = true;
  davidFlyingStone.timer = 0;
  davidFlyingStone.duration = 1.45;
  davidFlyingStone.isHit = isSuccess;
  davidFlyingStone.startPos.set(playerPos.x, playerPos.y + 2.2, playerPos.z);

  if (isSuccess) {
    davidFlyingStone.endPos.set(0, 12.6, -17.0);
    playSfx('boost');
  } else {
    davidFlyingStone.endPos.set((dx > 0 ? 4.5 : -4.5), 11.5, -16.5);
    playSfx('jump');
  }
  if (davidFlyingStone.mesh) {
    davidFlyingStone.mesh.visible = true;
    davidFlyingStone.mesh.position.copy(davidFlyingStone.startPos);
  }
};

function triggerDavidStage2Action() {
  openDavidAimOverlay();
}

function updateDavidStage2HUD(badge, countIcon, countText, missionText) {
  updateDavidCarriedStonesVisual();
  badge.textContent = '엘라 골짜기 · 스테이지 2';
  countIcon.textContent = '🗿';
  countText.textContent = `우상 타격 ${davidIdolHits}/${davidReqIdolHits}`;
  missionText.textContent = davidStonesUnlockedAim
    ? '물맷돌 5개를 모두 모았어요! 골리앗 앞 노란 조준 영역에 들어가 놋투구 위 우상을 맞히세요!'
    : `시냇가에서 매끄러운 물맷돌 5개를 모두 모아야 조준창이 열립니다! (현재 ${davidHeldStones}/5개)`;
}

// -------------------------------------------------------------------------
// 5. 스테이지 2 프레임 업데이트 & 대면 대화 카메라 & 승리 팡파르 컷신
// -------------------------------------------------------------------------
function updateDavidStage2Frame(dt, now) {
  if (davidOpeningState.active) return;
  if (davidStage2Dialogue.active) return;
  if (davidAimAutoCooldown > 0) davidAimAutoCooldown -= dt;

  flowingWaterTextures.forEach(tex => {
    tex.offset.x = (tex.offset.x + dt * 0.38) % 1;
  });

  davidPhilistineSoldiers.forEach(s => {
    if (s.mesh.userData && s.mesh.userData.rArm) {
      s.mesh.userData.rArm.rotation.x = -0.35 + Math.sin(now * 0.007 + s.phase) * 0.30;
    }
  });

  davidIsraelSoldiers.forEach(s => {
    if (s.mesh.userData && s.mesh.userData.lArm && s.mesh.userData.rArm) {
      const w = Math.sin(now * 0.008 + s.phase) * 0.38;
      s.mesh.userData.lArm.rotation.x = -1.8 + w;
      s.mesh.userData.rArm.rotation.x = -1.2 - w;
    }
  });

  if (davidGoliathObj && !davidStage2Cutscene.active) {
    const u = davidGoliathObj.userData;
    davidGoliathObj.rotation.y = Math.sin(now * 0.0015) * 0.12;
    if (u.rArm) u.rArm.rotation.x = -0.5 + Math.sin(now * 0.004) * 0.35;
    if (u.targetRing) u.targetRing.rotation.z += dt * 2.5;
  }

  if (davidAimState.active) {
    davidAimState.phase += dt;
    if (playerLimbs && playerLimbs.rArm) {
      playerLimbs.rArm.rotation.x = -2.3 + Math.sin(now * 0.012) * 0.72;
    }
    camera.position.lerp(new THREE.Vector3(playerPos.x * 0.4, 7.2, -3.5), 0.12);
    camera.lookAt(0, 12.2, -17.5);

    const isKinder = (currentMode === 'kinder');
    const isHard = (currentMode === 'senior' || currentMode === 'timeattack');
    const spd = isKinder ? 1.55 : (isHard ? 2.85 : 2.15);

    davidAimState.reticleX = 108 + Math.sin(davidAimState.phase * spd) * 82;
    davidAimState.reticleY = isHard
      ? (36 + Math.sin(davidAimState.phase * spd * 2.0) * 22)
      : (36 + Math.cos(davidAimState.phase * spd) * 10);

    davidAimState.targetX = isHard
      ? (104 + Math.cos(davidAimState.phase * 1.6) * 34)
      : (104 + Math.sin(davidAimState.phase * 1.0) * (isKinder ? 0 : 16));
    davidAimState.targetY = 34;

    renderDavidPixelAimScreen(
      davidAimState.reticleX,
      davidAimState.reticleY,
      davidAimState.targetX,
      davidAimState.targetY,
      now
    );
    return;
  }

  if (davidFlyingStone.active) {
    davidFlyingStone.timer += dt;
    const p = Math.min(1, davidFlyingStone.timer / davidFlyingStone.duration);

    playerFacing = Math.PI;
    if (playerGroup) playerGroup.rotation.y = Math.PI;

    if (playerLimbs && playerLimbs.rArm) {
      if (p < 0.35) {
        const swingP = p / 0.35;
        playerLimbs.rArm.rotation.x = THREE.MathUtils.lerp(-2.8, -0.35, swingP);
      } else {
        playerLimbs.rArm.rotation.x = THREE.MathUtils.lerp(-0.35, 0, (p - 0.35) / 0.65);
      }
    }

    const curPos = new THREE.Vector3().lerpVectors(davidFlyingStone.startPos, davidFlyingStone.endPos, p);
    curPos.y += Math.sin(p * Math.PI) * 5.2;
    if (davidFlyingStone.mesh) {
      davidFlyingStone.mesh.position.copy(curPos);
      davidFlyingStone.mesh.rotation.x += dt * 14.0;
      davidFlyingStone.mesh.rotation.y += dt * 11.0;
      davidFlyingStone.mesh.rotation.z += dt * 8.5;
    }

    camera.position.lerp(new THREE.Vector3(playerPos.x * 0.3 + 2.5, 7.8, -2.0), 0.08);
    camera.lookAt(curPos.x * 0.5, Math.max(8.5, curPos.y), curPos.z);

    if (p >= 1) {
      davidFlyingStone.active = false;
      if (davidFlyingStone.mesh) davidFlyingStone.mesh.visible = false;
      if (playerLimbs && playerLimbs.rArm) playerLimbs.rArm.rotation.x = 0;

      if (davidFlyingStone.isHit) {
        davidIdolHits++;
        playSfx('crumble');
        playSfx('rescue');
        if (currentMode === 'timeattack') timeRemaining += 5.0;

        if (davidGoliathObj && davidGoliathObj.userData.idolParts) {
          const parts = davidGoliathObj.userData.idolParts;
          const hideCnt = Math.floor((davidIdolHits / davidReqIdolHits) * parts.length);
          for (let i = 0; i < hideCnt; i++) {
            if (parts[i]) parts[i].visible = false;
          }
        }

        if (davidIdolHits >= davidReqIdolHits) {
          startDavidStage2VictoryCutscene();
          return;
        } else {
          if (targetObject && targetObject.label) {
            targetObject.label.innerHTML = davidStonesUnlockedAim
              ? `🎯 물맷돌 자동 조준 영역 (놋투구 위 우상 ${davidIdolHits}/${davidReqIdolHits} 타격)`
              : `🎯 물맷돌 조준 영역 (시냇가에서 5개를 모두 모아야 열려요!)`;
          }
          updateStageHUD();
          showToast(`🎯 명중! 골리앗의 놋투구 위 우상 장식이 금이 갔어요! (${davidIdolHits}/${davidReqIdolHits}회 성공)`);
        }
      } else {
        playSfx('wrong');
        if (davidHeldStones <= 0) {
          showToast('💦 물맷돌 5개를 모두 사용했어요! 다시 시냇가에서 5개를 모아오세요!');
        } else {
          showToast(`💦 아깝게 빗나갔어요! 픽셀 십자선이 우상 중앙에 겹칠 때 발사하세요! (남은 돌 ${davidHeldStones}개)`);
        }
      }
    }
    return;
  }

  let nearestStone = null, minStoneDist = 999;
  davidSlingStones.forEach((st, idx) => {
    if (st.collected) {
      st.respawnTimer -= dt;
      if (st.respawnTimer <= 0) {
        st.collected = false;
        st.group.visible = true;
      }
      return;
    }

    if (st.vx !== 0) {
      let nx = st.group.position.x + st.vx * dt;
      if (nx > 19 || nx < -19) {
        st.vx = -st.vx;
        nx = st.group.position.x + st.vx * dt;
      }
      const nz = getElahStreamCenterZ(nx) + (st.zOffset || 0);
      st.group.position.set(nx, 0, nz);
      st.pos.set(nx, 0.5, nz);
    }
    st.core.rotation.y += dt * 2.5;
    st.core.position.y = 0.32 + Math.sin(now * 0.007 + idx) * 0.1;

    const d = Math.hypot(playerPos.x - st.pos.x, playerPos.z - st.pos.z);
    if (d < minStoneDist) { minStoneDist = d; nearestStone = st.pos; }
    updateWorldLabelPos(st.label, st.pos, d < 24);

    if (d < 2.2) {
      if (davidHeldStones >= davidMaxStones) {
        if (!st._warnAt || now - st._warnAt > 1600) {
          st._warnAt = now;
          showToast('🪨 물맷돌 5개를 모두 모았어요! 앞쪽 노란 조준 영역으로 가세요!');
        }
        return;
      }
      st.collected = true;
      st.respawnTimer = 6.0;
      st.group.visible = false;
      st.label.style.opacity = '0';
      davidHeldStones++;
      if (davidHeldStones >= davidMaxStones) {
        davidStonesUnlockedAim = true;
        if (targetObject && targetObject.label) {
          targetObject.label.innerHTML = `🎯 물맷돌 자동 조준 영역 (놋투구 위 우상 ${davidIdolHits}/${davidReqIdolHits} 타격)`;
        }
      }
      updateDavidCarriedStonesVisual();
      updateStageHUD();
      playSfx('rescue');
      if (currentMode === 'timeattack') timeRemaining += 3.0;

      if (davidHeldStones < davidMaxStones) {
        showToast(`🪨 매끄러운 물맷돌 획득! (${davidHeldStones}/5개 · ${5 - davidHeldStones}개 더 모아야 조준창이 열려요!)`);
      }
    }
  });

  davidGoliathHazards.forEach(hz => {
    hz.timer += dt;
    const warnDur = 1.45;
    const rem = hz.interval - hz.timer;

    if (rem <= warnDur && rem > 0) {
      hz.fillBox.material.opacity = 0.45 + Math.abs(Math.sin(now * 0.04)) * 0.35;
      hz.fillBox.material.color.setHex(0xef4444);

      const dropP = 1 - (rem / warnDur);
      hz.boulderGrp.visible = true;
      hz.boulderGrp.position.y = 14.5 * (1 - dropP);
      hz.boulderGrp.rotation.x += dt * 7;
      hz.boulderGrp.rotation.z += dt * 5;

      if (!hz._sfx && dropP > 0.7) {
        hz._sfx = true;
        if (Math.hypot(playerPos.x - hz.x, playerPos.z - hz.z) < 12) playSfx('crumble');
      }

      if (
        dropP > 0.72 &&
        Math.abs(playerPos.x - hz.x) < hz.halfW &&
        Math.abs(playerPos.z - hz.z) < hz.halfD &&
        now - hz._hitAt > 1100
      ) {
        hz._hitAt = now;
        triggerDamageFlash();
        playSfx('hit');
        playerPos.z = Math.min(28, playerPos.z + 3.2);
        if ((currentMode === 'senior' || currentMode === 'timeattack') && davidHeldStones > 0) {
          davidHeldStones--;
          if (davidHeldStones <= 0) davidStonesUnlockedAim = false;
          updateDavidCarriedStonesVisual();
          updateStageHUD();
          showToast('💥 골리앗이 던진 바위 충격파에 물맷돌 1개를 떨어뜨렸어요! 붉은 구역을 피하세요!');
        } else {
          showToast('💥 골리앗의 바위 공격에 닿았어요! 바닥의 경고 구역을 피해 움직이세요!');
        }
      }
    } else {
      hz.fillBox.material.opacity = 0.22;
      hz.fillBox.material.color.setHex(0xfacc15);
      hz.boulderGrp.visible = false;
    }

    if (hz.timer >= hz.interval) {
      hz.timer = 0;
      hz._sfx = false;
    }
  });

  if (targetObject && !targetObject.triggered) {
    const td = Math.hypot(playerPos.x - targetObject.pos.x, playerPos.z - targetObject.pos.z);
    updateWorldLabelPos(targetObject.label, targetObject.pos, td < 28);

    const ctxBtn = document.getElementById('context-action-btn');
    const pBtn = document.getElementById('puzzle-build-btn');
    pBtn.classList.add('hidden');

    if (td < 3.4) {
      if (davidStonesUnlockedAim && davidHeldStones > 0) {
        ctxBtn.classList.remove('hidden');
        ctxBtn.textContent = `🎯 물맷돌 돌려 놋투구 위 우상 조준하기! (${davidHeldStones}발)`;
        if (davidAimAutoCooldown <= 0) {
          openDavidAimOverlay();
          return;
        }
      } else {
        ctxBtn.classList.add('hidden');
        if (davidAimAutoCooldown <= 0) {
          davidAimAutoCooldown = 1.8;
          showToast(`🪨 먼저 시냇가에서 물맷돌 5개를 모두 모아오세요! (현재 ${davidHeldStones}/5개)`);
        }
      }
    } else if (playerPos.z < -1.0 && davidStonesUnlockedAim && davidHeldStones > 0) {
      ctxBtn.classList.remove('hidden');
      ctxBtn.textContent = `🎯 여기서 물맷돌 조준하기! (${davidHeldStones}발)`;
    } else {
      ctxBtn.classList.add('hidden');
    }

    if (guideArrowGroup && guideArrowGroup.visible) {
      const baseFacing = (window.globalCameraViewMode === 'fps') ? (cameraYaw + Math.PI) : playerFacing;
      const guidePt = (davidStonesUnlockedAim && davidHeldStones > 0) ? targetObject.pos : (nearestStone || targetObject.pos);
      guideArrowGroup.rotation.y = Math.atan2(guidePt.x - playerPos.x, guidePt.z - playerPos.z) - baseFacing;
    }
  }
}

function startDavidStage2VictoryCutscene() {
  isPlaying = false;
  isTimeAttackActive = false;
  hideAllDavidCustomUI();
  document.getElementById('context-action-btn').classList.add('hidden');
  document.getElementById('puzzle-build-btn').classList.add('hidden');
  document.getElementById('hud-mission-box').classList.add('hidden');
  if (typeof hideMissionGuideBubbleImmediately === 'function') hideMissionGuideBubbleImmediately();
  if (targetObject && targetObject.label) targetObject.label.style.opacity = '0';

  davidGoliathHazards.forEach(hz => {
    hz.warnGrp.visible = false;
    hz.boulderGrp.visible = false;
  });

  davidIdolShards = [];
  if (davidGoliathObj && davidGoliathObj.userData.idolGroup) {
    davidGoliathObj.userData.idolGroup.visible = false;
  }
  const shardCols = ['#facc15', '#7e22ce', '#f43f5e', '#e2e8f0'];
  for (let i = 0; i < 18; i++) {
    const sMesh = createBox(0.55, 0.55, 0.55, matDavidCached(shardCols[i % shardCols.length]), 0, 12.8, -17.5, false);
    worldGroup.add(sMesh);
    const ang = (i / 18) * Math.PI * 2;
    davidIdolShards.push({
      mesh: sMesh,
      vx: Math.cos(ang) * (4 + (i % 3) * 2),
      vy: 4 + (i % 4) * 1.5,
      vz: Math.sin(ang) * (4 + (i % 3) * 2)
    });
  }

  davidStage2Cutscene.active = true;
  davidStage2Cutscene.timer = 0;
  davidStage2Cutscene.phase = 1;

  startStageBgm(2);
  playSfx('clear');
  showToast('🎺 물맷돌이 골리앗의 놋투구 위 우상 장식을 무너뜨렸습니다! 만군의 여호와의 이름으로 승리했습니다!');
}

function updateDavidStage2CutsceneFrame(dt, now) {
  if (davidStage2Dialogue.active) {
    davidStage2Dialogue.timer += dt;

    playerFacing = Math.PI;
    if (playerGroup) {
      playerGroup.position.copy(playerPos);
      playerGroup.rotation.y = Math.PI;
    }

    // 가로·세로형 모두 하단 반투명 대화창 위쪽에 골리앗(Step 1)과 다윗(Step 2)이 또렷이 담기도록 카메라를 고정·추적!
    const isLandscape = (typeof window !== 'undefined') && (window.innerWidth > window.innerHeight);
    if (davidStage2Dialogue.step === 1) {
      const lookY = isLandscape ? 7.6 : 8.6;
      const camX = (isLandscape ? 2.15 : 1.85) + Math.sin(davidStage2Dialogue.timer * 0.45) * 0.55;
      const camY = isLandscape ? 7.8 : 8.5;
      const camZ = isLandscape ? -3.4 : -4.4;
      camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.10);
      camera.lookAt(0, lookY, -17.5);
      if (davidGoliathObj && davidGoliathObj.userData.rArm) {
        davidGoliathObj.userData.rArm.rotation.x = -0.8 + Math.sin(now * 0.008) * 0.45;
      }
    } else if (davidStage2Dialogue.step === 2) {
      const dLookY = isLandscape ? (playerPos.y + 1.38) : (playerPos.y + 1.68);
      const dCamX = playerPos.x + (isLandscape ? 1.85 : 1.55) + Math.sin(davidStage2Dialogue.timer * 0.55) * 0.25;
      const dCamY = playerPos.y + (isLandscape ? 1.92 : 2.08);
      const dCamZ = playerPos.z - (isLandscape ? 4.15 : 3.55);
      camera.position.lerp(new THREE.Vector3(dCamX, dCamY, dCamZ), 0.14);
      camera.lookAt(playerPos.x - 0.1, dLookY, playerPos.z);
      if (playerLimbs && playerLimbs.rArm) {
        playerLimbs.rArm.rotation.x = -1.6 + Math.sin(now * 0.01) * 0.35;
      }
    }
    return true;
  }

  if (!davidStage2Cutscene.active) return false;
  davidStage2Cutscene.timer += dt;
  const t = davidStage2Cutscene.timer;

  camera.position.lerp(new THREE.Vector3(5.5, 9.5, -4.5), 0.09);
  camera.lookAt(0, 6.5, -17.5);

  davidIdolShards.forEach(sh => {
    sh.mesh.position.x += sh.vx * dt;
    sh.mesh.position.y += (sh.vy - 15 * t) * dt;
    sh.mesh.position.z += sh.vz * dt;
    sh.mesh.rotation.x += dt * 7;
    sh.mesh.rotation.y += dt * 6;
  });

  if (davidGoliathObj && t > 0.4) {
    const fallProg = Math.min(1, (t - 0.4) / 1.6);
    davidGoliathObj.rotation.x = (fallProg * fallProg) * (Math.PI * 0.46);
    davidGoliathObj.position.y = THREE.MathUtils.lerp(3.1, 1.2, fallProg);
  }

  davidPhilistineSoldiers.forEach(s => {
    s.mesh.rotation.y = Math.PI + Math.sin(now * 0.02 + s.phase) * 0.4;
    s.mesh.position.y = 3.1 + Math.abs(Math.sin(now * 0.015 + s.phase)) * 0.25;
  });

  davidIsraelSoldiers.forEach(s => {
    s.mesh.position.y = Math.abs(Math.sin(now * 0.012 + s.phase)) * 0.65;
  });

  if (t >= 3.6) {
    davidStage2Cutscene.active = false;
    davidIdolShards.forEach(sh => { sh.mesh.visible = false; });
    openStageClearModal(2);
  }
  return true;
}