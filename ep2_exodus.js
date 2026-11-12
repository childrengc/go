// =========================================================================
// [ep2_exodus.js] 에피소드 2 : 출애굽 홍해의 기적 (스테이지 1~3, 스피드런, 바다 갈라짐 컷신)
// =========================================================================

EPISODE_SCRIPTURE.exodus = {
  1: {
    title: '스테이지 1 클리어! 홍해 바다 앞에 도착했어요!',
    desc: '험한 낭떠러지에 다리를 놓고 백성 6명과 함께 홍해 바다 앞 포인트에 섰어요!',
    verse: '"모세가 백성에게 이르되 너희는 두려워하지 말고 가만히 서서 여호와께서 오늘 너희를 위하여 행하시는 구원을 보라" (출애굽기 14장 13절)',
    btnText: '🌊 홍해 바다가 갈라지는 기적 보기! ▶',
    quiz: { q: '퀴즈! 홍해 앞에서 두려워하는 백성에게 모세는 무엇을 보라고 했나요?', opts: ['여호와께서 행하시는 구원', '애굽의 화려한 병거', '광야의 높은 피라미드'], ans: 0 }
  },
  2: {
    title: '스테이지 2 클리어! 추격하던 병사들을 따돌렸어요!',
    desc: '하나님께서 바닷물을 벽이 되게 하시고 구름기둥과 불기둥으로 이스라엘 백성을 지켜 주셨어요!',
    verse: '"이스라엘 자손이 바다 가운데를 육지로 걸어가고 물은 그들의 좌우에 벽이 되니" (출애굽기 14장 22절)',
    btnText: '홍해 탈출 계단 만들러 가기 (스테이지 3) ▶',
    quiz: { q: '퀴즈! 이스라엘 백성이 마른 땅으로 바다를 건널 때 좌우의 바닷물은 어떻게 되었나요?', opts: ['얼음 빙하로 얼어붙었다', '좌우에 높은 물벽이 되었다', '모두 증발해 사라졌다'], ans: 1 }
  },
  3: {
    title: '스테이지 3 클리어! 홍해 바닷길 도하 성공!',
    desc: '언약의 돌 7개로 탈출 계단을 완성해 모든 양떼와 함께 안전하게 바다를 건넜어요!',
    verse: '"그 날에 여호와께서 이같이 이스라엘을 애굽 사람의 손에서 구원하시매 이스라엘이 여호와께서 행하신 그 큰 능력을 보았으므로 백성이 여호와를 경외하며 여호와와 그의 종 모세를 믿었더라" (출애굽기 14장 30~31절)',
    btnText: '🌴 구원의 오아시스 언덕으로 나가기! ▶',
    quiz: { q: '퀴즈! 홍해의 큰 기적을 본 이스라엘 백성들은 어떤 마음을 갖게 되었나요?', opts: ['여호와를 경외하며 믿었다', '다시 애굽으로 돌아갔다', '기적을 금방 잊어버렸다'], ans: 0 }
  }
};

// -------------------------------------------------------------------------
// 1. 이집트 피라미드 배경, 4종 바위 장애물, 6명 백성(2열) 및 추격 병사 모델링
// -------------------------------------------------------------------------
function buildEgyptianPyramidBackdrop(southZ, baseY) {
  const sandstone1 = matVoxel('#eab308', '#ca8a04');
  const sandstone2 = matVoxel('#d97706', '#b45309');
  const goldCap = matVoxel('#fde047');

  const pyramidSpecs = [
    { cx: -32, cz: southZ + 28, layers: 9, stepSize: 3.4 },
    { cx: 0,   cz: southZ + 36, layers: 12, stepSize: 3.8 },
    { cx: 34,  cz: southZ + 28, layers: 8, stepSize: 3.2 }
  ];
  pyramidSpecs.forEach(p => {
    for (let l = 0; l < p.layers; l++) {
      const w = (p.layers - l) * p.stepSize, h = 2.2;
      const m = (l === p.layers - 1) ? goldCap : (l % 2 === 0 ? sandstone1 : sandstone2);
      worldGroup.add(createBox(w, h, w, m, p.cx, baseY + l * h + h / 2 - 1, p.cz, false));
    }
  });

  [-14, 14].forEach(ox => {
    worldGroup.add(
      createBox(2.4, 11.0, 2.4, sandstone2, ox, baseY + 5.5, southZ + 8, false),
      createBox(1.6, 2.2, 1.6, goldCap, ox, baseY + 12.1, southZ + 8, false)
    );
  });

  const sx = -18, sz = southZ + 15;
  worldGroup.add(
    createBox(4.5, 2.8, 8.5, sandstone1, sx, baseY + 1.4, sz, false),
    createBox(1.4, 1.4, 3.5, sandstone2, sx - 1.5, baseY + 0.7, sz - 5.2, false),
    createBox(1.4, 1.4, 3.5, sandstone2, sx + 1.5, baseY + 0.7, sz - 5.2, false),
    createBox(3.4, 2.8, 3.2, sandstone2, sx, baseY + 3.8, sz - 2.6, false),
    createBox(4.4, 2.4, 2.6, matVoxel('#1d4ed8', '#facc15'), sx, baseY + 3.9, sz - 2.8, false)
  );
}

function addVariedRockObstacle(x, z, variant = 0) {
  const by = getBaseGroundHeight(x, z);
  const m1 = matVoxel('#78716c', '#57534e'), m2 = matVoxel('#a8a29e', '#78716c'), m3 = matVoxel('#57534e', '#44403c');
  const grp = new THREE.Group();
  let colRadius = 1.6;

  if (variant % 4 === 0) {
    grp.add(createBox(2.8, 1.2, 2.4, m1, 0, 0.6, 0), createBox(2.0, 1.1, 1.8, m2, -0.3, 1.7, 0.2), createBox(1.1, 0.8, 1.1, m3, 0.2, 2.5, -0.1));
    colRadius = 1.55;
  } else if (variant % 4 === 1) {
    grp.add(createBox(2.1, 2.8, 2.1, m3, 0, 1.4, 0), createBox(1.3, 1.6, 1.3, m1, 0, 3.4, 0), createBox(1.6, 1.1, 1.4, m2, 0.9, 0.55, 0.4));
    colRadius = 1.45;
  } else if (variant % 4 === 2) {
    grp.add(createBox(3.3, 1.3, 2.6, m2, -0.2, 0.65, 0), createBox(2.2, 1.7, 2.0, m1, 0.7, 0.85, -0.3));
    colRadius = 1.75;
  } else {
    const b1 = createBox(2.2, 2.1, 2.0, m1, -0.4, 1.05, 0); b1.rotation.y = 0.4;
    const b2 = createBox(1.8, 1.5, 1.8, m3, 0.8, 0.75, 0.5); b2.rotation.y = -0.5;
    const b3 = createBox(1.4, 2.5, 1.4, m2, 0.2, 1.25, -0.6);
    grp.add(b1, b2, b3);
    colRadius = 1.65;
  }

  grp.position.set(x, by, z);
  worldGroup.add(grp);
  grp.children.forEach(ch => wallMeshes.push(ch));
  colliders.push({ minX: x - colRadius, maxX: x + colRadius, minZ: z - colRadius, maxZ: z + colRadius });
}

function createFollowerPersonMesh(idx) {
  const g = new THREE.Group();
  const robeColors = ['#fef3c7', '#e0f2fe', '#dcfce7', '#fce7f3', '#ffedd5', '#f3e8ff'];
  const shawlColors = ['#92400e', '#0369a1', '#15803d', '#9d174d', '#b45309', '#5b21b6'];
  const robeMat = matVoxel(robeColors[idx % 6]), shawlMat = matVoxel(shawlColors[idx % 6]);
  const skinMat = matVoxel('#fed7aa', '#fdba74'), eyeMat = matVoxel('#0f172a');
  const lLeg = new THREE.Group(); lLeg.position.set(-0.18, 0.55, 0); lLeg.add(createBox(0.28, 0.5, 0.28, skinMat, 0, -0.25, 0));
  const rLeg = new THREE.Group(); rLeg.position.set(0.18, 0.55, 0); rLeg.add(createBox(0.28, 0.5, 0.28, skinMat, 0, -0.25, 0));
  const torso = createBox(0.74, 0.95, 0.44, robeMat, 0, 1.02, 0), sash = createBox(0.78, 0.22, 0.48, shawlMat, 0, 0.95, 0);
  const head = createBox(0.64, 0.64, 0.64, skinMat, 0, 1.82, 0), scarf = createBox(0.72, 0.28, 0.72, shawlMat, 0, 2.08, -0.02);
  const lEye = createBox(0.1, 0.1, 0.05, eyeMat, -0.14, 1.86, 0.33), rEye = createBox(0.1, 0.1, 0.05, eyeMat, 0.14, 1.86, 0.33);
  const lArm = new THREE.Group(); lArm.position.set(-0.5, 1.38, 0); lArm.add(createBox(0.26, 0.62, 0.26, robeMat, 0, -0.26, 0));
  const rArm = new THREE.Group(); rArm.position.set(0.5, 1.38, 0); rArm.add(createBox(0.26, 0.62, 0.26, robeMat, 0, -0.26, 0));
  g.add(lLeg, rLeg, torso, sash, head, scarf, lEye, rEye, lArm, rArm);
  g.userData = { lLeg, rLeg, lArm, rArm, walkPhase: idx * 1.1 };
  return g;
}

function spawnMosesFollowers(startX, startZ) {
  exodusFollowers = []; mosesTrailHistory = [];
  for (let step = 0; step < 60; step++) {
    const hz = startZ + step * 0.35;
    mosesTrailHistory.push({ x: startX, y: getBaseGroundHeight(startX, hz), z: hz, facing: Math.PI });
  }
  for (let i = 0; i < 6; i++) {
    const mesh = createFollowerPersonMesh(i), row = Math.floor(i / 2), col = (i % 2 === 0) ? -1 : 1;
    const fx = startX + col * 0.95, fz = startZ + 1.8 + row * 1.65, fy = getBaseGroundHeight(fx, fz);
    mesh.position.set(fx, fy, fz); mesh.rotation.y = Math.PI;
    worldGroup.add(mesh);
    exodusFollowers.push({ mesh, row, col });
  }
}

function updateMosesFollowers(dt, now) {
  if (exodusFollowers.length === 0) return;
  const head = mosesTrailHistory[0];
  if (!head || Math.hypot(playerPos.x - head.x, playerPos.z - head.z) > 0.24) {
    mosesTrailHistory.unshift({ x: playerPos.x, y: playerPos.y, z: playerPos.z, facing: playerFacing });
    if (mosesTrailHistory.length > 140) mosesTrailHistory.pop();
  }
  const speedRatio = Math.max(1.0, currentMoveSpeed / 7.5);
  const followGain = (currentStage === 2 ? 12.5 : 8.5) * speedRatio;

  exodusFollowers.forEach((f) => {
    const histIdx = Math.min(mosesTrailHistory.length - 1, (f.row + 1) * 4);
    const anchor = mosesTrailHistory[histIdx] || { x: playerPos.x, y: playerPos.y, z: playerPos.z, facing: playerFacing };
    const perpX = Math.cos(anchor.facing) * (f.col * 0.95), perpZ = -Math.sin(anchor.facing) * (f.col * 0.95);
    const backX = -Math.sin(anchor.facing) * (0.85 + f.row * 0.65), backZ = -Math.cos(anchor.facing) * (0.85 + f.row * 0.65);
    const targetX = anchor.x + perpX + backX, targetZ = anchor.z + perpZ + backZ;
    const dx = targetX - f.mesh.position.x, dz = targetZ - f.mesh.position.z, dist = Math.hypot(dx, dz);

    if (dist > 0.06) {
      f.mesh.position.x += dx * Math.min(1, dt * followGain);
      f.mesh.position.z += dz * Math.min(1, dt * followGain);
      f.mesh.rotation.y = lerpAngle(f.mesh.rotation.y, Math.atan2(dx, dz), dt * 12);
      const cyc = now * (0.013 * speedRatio) + f.mesh.userData.walkPhase;
      f.mesh.userData.lLeg.rotation.x = Math.sin(cyc) * 0.65; f.mesh.userData.rLeg.rotation.x = -Math.sin(cyc) * 0.65;
      f.mesh.userData.lArm.rotation.x = -Math.sin(cyc) * 0.55; f.mesh.userData.rArm.rotation.x = Math.sin(cyc) * 0.55;
    } else {
      f.mesh.userData.lLeg.rotation.x = 0; f.mesh.userData.rLeg.rotation.x = 0;
      f.mesh.userData.lArm.rotation.x = 0; f.mesh.userData.rArm.rotation.x = 0;
    }
    const supportY = getSupportHeight(f.mesh.position.x, f.mesh.position.z, f.mesh.position.y + 0.8);
    f.mesh.position.y = THREE.MathUtils.lerp(f.mesh.position.y, supportY, 0.38);
  });
}

function createEgyptianSoldierMesh() {
  const g = new THREE.Group();
  const skin = matVoxel('#d97706', '#b45309'), kilt = matVoxel('#f8fafc', '#e2e8f0');
  const armor = matVoxel('#ca8a04', '#a16207'), nemes = matVoxel('#1e3a8a', '#facc15');
  const spearMat = matVoxel('#451a03'), bladeMat = matVoxel('#cbd5e1'), eyeMat = matVoxel('#0f172a');

  const lLeg = new THREE.Group(); lLeg.position.set(-0.2, 0.65, 0); lLeg.add(createBox(0.32, 0.6, 0.32, skin, 0, -0.3, 0));
  const rLeg = new THREE.Group(); rLeg.position.set(0.2, 0.65, 0); rLeg.add(createBox(0.32, 0.6, 0.32, skin, 0, -0.3, 0));
  const torso = createBox(0.84, 0.96, 0.46, armor, 0, 1.15, 0), skirt = createBox(0.88, 0.42, 0.5, kilt, 0, 0.72, 0);
  const head = createBox(0.7, 0.7, 0.7, skin, 0, 1.98, 0), headdress = createBox(0.86, 0.58, 0.82, nemes, 0, 2.08, -0.05);
  const lEye = createBox(0.1, 0.1, 0.05, eyeMat, -0.15, 2.02, 0.36), rEye = createBox(0.1, 0.1, 0.05, eyeMat, 0.15, 2.02, 0.36);

  const lArm = new THREE.Group(); lArm.position.set(-0.56, 1.5, 0);
  lArm.add(createBox(0.28, 0.64, 0.28, skin, 0, -0.28, 0), createBox(0.12, 0.85, 0.65, armor, -0.18, -0.25, 0.15));
  const rArm = new THREE.Group(); rArm.position.set(0.56, 1.5, 0);
  rArm.add(createBox(0.28, 0.64, 0.28, skin, 0, -0.28, 0), createBox(0.1, 2.2, 0.1, spearMat, 0.05, -0.1, 0.35), createBox(0.16, 0.35, 0.16, bladeMat, 0.05, 1.1, 0.35));

  g.add(lLeg, rLeg, torso, skirt, head, headdress, lEye, rEye, lArm, rArm);
  g.userData = { lLeg, rLeg, lArm, rArm };
  return g;
}

// -------------------------------------------------------------------------
// 2. 스테이지 1: 낭떠러지 다리 분할 건설 & 내리막 홍해 월드
// -------------------------------------------------------------------------
function spawnCollectibleBlock(x, z, blockLabel = '🪵 조각목 다리 블록') {
  const by = getBaseGroundHeight(x, z);
  const grp = new THREE.Group();
  const box = createBox(0.95, 0.95, 0.95, matVoxel('#f59e0b', '#b45309'), 0, 0.75, 0);
  const band = createBox(1.02, 0.22, 1.02, matVoxel('#fde047'), 0, 0.75, 0, false);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.25, 20), new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.06;
  grp.add(box, band, ring);
  grp.position.set(x, by, z);
  worldGroup.add(grp);
  const lbl = createWorldLabel(`${blockLabel} ${currentMode === 'timeattack' ? '(+5초!)' : '(최대 2개 소지)'}`);
  collectibleBlocks.push({ group: grp, boxMesh: box, pos: new THREE.Vector3(x, by + 0.5, z), collected: false, label: lbl });
}

function generateFarthestBlockSpots(count, minX, maxX, minZ, maxZ) {
  const candidates = [];
  for (let x = minX; x <= maxX; x += 3.5) {
    for (let z = minZ; z <= maxZ; z += 3.5) {
      if (isSpawnSpotClear(x, z, 2.0)) candidates.push([x, z]);
    }
  }
  if (candidates.length === 0) return [[0, (minZ + maxZ) * 0.5]];
  const selected = [candidates[0]];
  while (selected.length < count && selected.length < candidates.length) {
    let bestPt = candidates[0], bestMinDist = -1;
    for (const cand of candidates) {
      let minDistToSel = Infinity;
      for (const sel of selected) {
        const d = Math.hypot(cand[0] - sel[0], cand[1] - sel[1]);
        if (d < minDistToSel) minDistToSel = d;
      }
      if (minDistToSel > bestMinDist) { bestMinDist = minDistToSel; bestPt = cand; }
    }
    selected.push(bestPt);
  }
  return selected;
}

function createChasmWithBridgePuzzle(zCenter, trenchDepthW, halfMapW, bridgeConfigs, isCliffChasm = false) {
  const zSouthEdge = zCenter + trenchDepthW / 2, zNorthEdge = zCenter - trenchDepthW / 2;
  const ySouth = getBaseGroundHeight(0, zSouthEdge), yNorth = getBaseGroundHeight(0, zNorthEdge), yMid = (ySouth + yNorth) * 0.5;

  if (isCliffChasm) {
    const cliffWallMat = matVoxel('#78350f', '#451a03'), abyssMat = matVoxel('#1c1917', '#0c0a09');
    worldGroup.add(
      createBox(halfMapW * 2, 22, 1.4, cliffWallMat, 0, ySouth - 11, zSouthEdge + 0.5),
      createBox(halfMapW * 2, 22, 1.4, cliffWallMat, 0, yNorth - 11, zNorthEdge - 0.5),
      createBox(halfMapW * 2, 2, trenchDepthW + 2, abyssMat, 0, yMid - 21, zCenter, false)
    );
  }

  const sorted = [...bridgeConfigs].sort((a, b) => a.x - b.x);
  let curX = -halfMapW;
  sorted.forEach((cfg) => {
    const bLeft = cfg.x - cfg.w / 2, bRight = cfg.x + cfg.w / 2;
    if (bLeft > curX + 0.5) colliders.push({ minX: curX, maxX: bLeft, minZ: zNorthEdge - 0.4, maxZ: zSouthEdge + 0.4 });
    curX = bRight;

    const bridgeCollider = { minX: bLeft - 0.2, maxX: bRight + 0.2, minZ: zNorthEdge - 0.4, maxZ: zSouthEdge + 0.4, active: true };
    colliders.push(bridgeCollider);

    const bpGroup = new THREE.Group();
    bpGroup.add(createBox(cfg.w, 0.35, trenchDepthW, new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.38 }), cfg.x, yMid + 0.1, zCenter, false));
    const solidGroup = new THREE.Group();
    worldGroup.add(bpGroup, solidGroup);

    const reqCount = cfg.reqBlocks || 2;
    const lbl = createWorldLabel(`🧱 ${cfg.title} (0/${reqCount}개 · 블록 모아 건설)`);
    buildZones.push({
      id: cfg.id, title: cfg.title, x: cfg.x, w: cfg.w, zCenter, zSouthEdge, zNorthEdge, ySouth, yNorth, yMid, trenchDepthW,
      isStone: !!cfg.isStone, pos: new THREE.Vector3(cfg.x, ySouth + 0.5, zSouthEdge + 1.4), centerPos: new THREE.Vector3(cfg.x, yMid + 0.5, zCenter),
      reqBlocks: reqCount, placedBlocks: 0, built: false, colliderRef: bridgeCollider, bpGroup, solidGroup, label: lbl,
      rebuildBridgeMesh: function () {
        while (this.solidGroup.children.length > 0) this.solidGroup.remove(this.solidGroup.children[0]);
        if (this.placedBlocks <= 0) return;
        const ratio = Math.min(1, this.placedBlocks / this.reqBlocks);
        const builtLen = (this.trenchDepthW + 0.8) * ratio;
        const curCenterZ = (this.zSouthEdge + 0.4) - builtLen / 2;
        const curY = THREE.MathUtils.lerp(this.ySouth, this.yNorth, ratio * 0.5);
        const plankMat = this.isStone ? matVoxel('#cbd5e1', '#94a3b8') : matVoxel('#b45309', '#78350f'), railMat = matVoxel('#f59e0b');
        const plank = createBox(this.w, 0.48, builtLen, plankMat, this.x, curY - 0.1, curCenterZ);
        const railL = createBox(0.25, 0.82, builtLen, railMat, this.x - this.w / 2 + 0.15, curY + 0.35, curCenterZ);
        const railR = createBox(0.25, 0.82, builtLen, railMat, this.x + this.w / 2 - 0.15, curY + 0.35, curCenterZ);
        const slopeAngle = Math.atan2(this.yNorth - this.ySouth, this.trenchDepthW);
        plank.rotation.x = slopeAngle; railL.rotation.x = slopeAngle; railR.rotation.x = slopeAngle;
        this.solidGroup.add(plank, railL, railR);
      }
    });
  });
  if (halfMapW > curX + 0.5) colliders.push({ minX: curX, maxX: halfMapW, minZ: zNorthEdge - 0.4, maxZ: zSouthEdge + 0.4 });
}

function spawnExodusSkyCloudsAndGulls(northZ) {
  const cloudMat = matVoxel('#ffffff', '#f1f5f9');
  [[-65, 24, northZ - 35], [-25, 27, northZ - 55], [20, 25, northZ - 40], [68, 28, northZ - 50], [-45, 30, northZ - 85], [40, 29, northZ - 90], [0, 32, northZ - 110]].forEach(([cx, cy, cz], idx) => {
    const cw = 14 + (idx % 3) * 5;
    worldGroup.add(createBox(cw, 2.6, 7.5, cloudMat, cx, cy, cz, false), createBox(cw * 0.65, 2.0, 5.5, cloudMat, cx + 2, cy + 1.8, cz + 1, false));
  });
  const wingMat = matVoxel('#ffffff', '#e2e8f0'), beakMat = matVoxel('#f59e0b');
  for (let i = 0; i < 10; i++) {
    const gull = new THREE.Group();
    const lWing = createBox(1.15, 0.1, 0.38, wingMat, -0.62, 0.06, 0, false), rWing = createBox(1.15, 0.1, 0.38, wingMat, 0.62, 0.06, 0, false);
    gull.add(createBox(0.35, 0.25, 0.85, wingMat, 0, 0, 0, false), createBox(0.16, 0.12, 0.28, beakMat, 0, 0.02, 0.52, false), lWing, rWing);
    const gx = -55 + i * 12, gy = 11 + (i % 3) * 2.5, gz = northZ - 18 - (i % 4) * 16;
    gull.position.set(gx, gy, gz);
    gull.userData = { baseX: gx, baseY: gy, baseZ: gz, phase: i * 0.85, lWing, rWing };
    worldGroup.add(gull);
    exodusSeagulls.push(gull);
  }
}

function buildExodusStage1World() {
  clearWorld();
  scene.background = new THREE.Color(0x38bdf8);
  scene.fog = new THREE.Fog(0x38bdf8, 80, 230);

  const isExtended = (currentMode !== 'kinder');
  const halfW = isExtended ? 34 : 24, southZ = isExtended ? 88 : 34, northZ = isExtended ? -80 : -34;
  const topHillY = isExtended ? 15.0 : 8.5, bottomShoreY = 0.6;

  exodusStage1SlopeMeta = { northZ, southZ, topY: topHillY, bottomY: bottomShoreY };
  currentMapRectBounds = { minX: -halfW + 1.8, maxX: halfW - 1.8, minZ: northZ + 1.5, maxZ: southZ - 1.5 };

  buildEgyptianPyramidBackdrop(southZ, topHillY);

  const cliffDefinitions = isExtended
    ? [
        { id: 'cliff1', z: 42, depth: 9.2, x: (currentMode === 'senior' ? -10 : 0), req: EXODUS_STAGE1_BRIDGE_BLOCKS, title: '첫 번째 협곡 다리' },
        { id: 'cliff2', z: -2, depth: 9.2, x: (currentMode === 'senior' ? 11 : 0),  req: EXODUS_STAGE1_BRIDGE_BLOCKS, title: '두 번째 협곡 다리' },
        { id: 'cliff3', z: -46, depth: 9.2, x: (currentMode === 'senior' ? -8 : 0), req: EXODUS_STAGE1_BRIDGE_BLOCKS, title: '세 번째 협곡 다리' }
      ]
    : [ { id: 'cliff1', z: 2, depth: 5.2, x: 0, req: 2, title: '광야 협곡 나무다리' } ];

  const sandMat = new THREE.MeshLambertMaterial({ map: makeDesertSandTex() });
  for (let z = southZ + 22; z > northZ; z -= 2.0) {
    const midZ = z - 1.0;
    if (cliffDefinitions.some(c => midZ <= c.z + c.depth / 2 && midZ >= c.z - c.depth / 2)) continue;
    worldGroup.add(createBox(halfW * 2, 8.0, 2.15, sandMat, 0, getBaseGroundHeight(0, midZ) - 4.0, midZ));
  }

  cliffDefinitions.forEach(c => {
    createChasmWithBridgePuzzle(c.z, c.depth, halfW, [{ id: c.id, x: c.x, w: 6.4, reqBlocks: c.req, title: c.title, isStone: false }], true);
  });

  if (guideArrowGroup) guideArrowGroup.visible = (currentMode !== 'senior');

  const zoneEdges = [southZ - 3.5];
  cliffDefinitions.forEach(c => { zoneEdges.push(c.z + c.depth / 2 - 2.2, c.z - c.depth / 2 + 2.2); });
  zoneEdges.push(northZ + 8);

  for (let zIdx = 0; zIdx <= cliffDefinitions.length; zIdx++) {
    const zMax = zoneEdges[zIdx * 2], zMin = zoneEdges[zIdx * 2 + 1];
    if (zMax === undefined || zMin === undefined || zMax <= zMin) continue;
    const cliff = cliffDefinitions[Math.min(zIdx, cliffDefinitions.length - 1)];

    const cols = (currentMode === 'senior') ? 6 : (isExtended ? 4 : 2);
    const rows = (currentMode === 'senior') ? 4 : (isExtended ? 3 : 2);
    const cellW = ((halfW - 4.5) * 2) / cols, cellD = (zMax - zMin) / rows;
    let vIdx = zIdx * 7;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        vIdx++;
        if (currentMode !== 'senior' && (r + c + zIdx) % 3 === 0) continue;
        const jx = (((vIdx * 37) % 100) / 100 - 0.5) * (cellW * 0.55);
        const jz = (((vIdx * 53) % 100) / 100 - 0.5) * (cellD * 0.55);
        const ox = -(halfW - 4.5) + (c + 0.5) * cellW + jx, oz = zMin + (r + 0.5) * cellD + jz;

        if (Math.hypot(ox, oz - (southZ - 6)) < 6.5 || Math.hypot(ox, oz - (northZ + 4.5)) < 6.5) continue;
        if (cliffDefinitions.some(cd => Math.hypot(ox - cd.x, oz - (cd.z + cd.depth / 2)) < 6.0 || Math.hypot(ox - cd.x, oz - (cd.z - cd.depth / 2)) < 6.0)) continue;
        if (!isSpawnSpotClear(ox, oz, 2.2)) continue;

        if (vIdx % 2 === 0) addVariedRockObstacle(ox, oz, vIdx % 4);
        else addPalmTree(ox, oz, 0.95 + (vIdx % 3) * 0.16, true);
      }
    }

    if (zIdx < cliffDefinitions.length) {
      generateFarthestBlockSpots(cliff.req, -halfW + 4.0, halfW - 4.0, zMin + 1.5, zMax - 1.5).forEach(([bx, bz]) => {
        spawnCollectibleBlock(bx, bz, '🪵 조각목 다리 블록');
      });
    }
  }

  for (let z = northZ; z <= southZ + 12; z += 12) {
    const by = getBaseGroundHeight(0, z);
    [-(halfW + 7), (halfW + 7)].forEach(bx => {
      const h1 = 5 + (Math.abs(bx + z) % 4);
      const hill = createBox(12, h1 + 14, 12, matVoxel('#d97706', '#92400e').clone(), bx, by + h1 / 2 - 4, z);
      worldGroup.add(hill); wallMeshes.push(hill);
      addPalmTree(bx + (bx < 0 ? 3 : -3), z, 1.2, true);
    });
  }

  const seaWidth = 320, seaDepth = 160, seaCenterZ = northZ - seaDepth / 2, halfSeaW = seaWidth / 2;
  worldGroup.add(createBox(36, 1.0, seaDepth, matVoxel('#fde047', '#ca8a04'), 0, bottomShoreY - 0.8, seaCenterZ, false));

  const seaSurfaceMat = matVoxel('#0284c7', '#0369a1'), seaWallMat = new THREE.MeshLambertMaterial({ map: makeArkWallTex('#0284c7', '#38bdf8') }), foamMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe });
  const leftSeaGroup = new THREE.Group(), rightSeaGroup = new THREE.Group();
  leftSeaGroup.add(createBox(halfSeaW, 3.2, seaDepth, seaSurfaceMat, -halfSeaW / 2, bottomShoreY - 1.5, seaCenterZ, false));
  rightSeaGroup.add(createBox(halfSeaW, 3.2, seaDepth, seaSurfaceMat, halfSeaW / 2, bottomShoreY - 1.5, seaCenterZ, false));

  const leftWaterWall = createBox(2.4, 1.0, seaDepth, seaWallMat, -1.2, bottomShoreY - 0.2, seaCenterZ, false);
  leftWaterWall.add(createBox(2.6, 0.35, seaDepth, foamMat, -1.2, bottomShoreY + 0.4, seaCenterZ, false)); leftWaterWall.visible = false;
  const rightWaterWall = createBox(2.4, 1.0, seaDepth, seaWallMat, 1.2, bottomShoreY - 0.2, seaCenterZ, false);
  rightWaterWall.add(createBox(2.6, 0.35, seaDepth, foamMat, 1.2, bottomShoreY + 0.4, seaCenterZ, false)); rightWaterWall.visible = false;

  leftSeaGroup.add(leftWaterWall); rightSeaGroup.add(rightWaterWall);
  worldGroup.add(leftSeaGroup, rightSeaGroup);
  Object.assign(seaPartingCutscene, { leftSeaGroup, rightSeaGroup, leftWaterWall, rightWaterWall });

  spawnExodusSkyCloudsAndGulls(northZ);

  const goalZ = northZ + 4.5, goalY = getBaseGroundHeight(0, goalZ);
  const pointPad = createBox(3.6, 0.22, 3.6, matVoxel('#fde047', '#f59e0b'), 0, goalY + 0.11, goalZ, false);
  const pointRing = new THREE.Mesh(new THREE.RingGeometry(2.1, 2.7, 28), new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide }));
  pointRing.rotation.x = -Math.PI / 2; pointRing.position.set(0, goalY + 0.16, goalZ);
  worldGroup.add(pointPad, pointRing);
  addWallTorch(-3.4, 0.5, goalZ); addWallTorch(3.4, 0.5, goalZ);

  targetObject = { type: 'part_sea', pos: new THREE.Vector3(0, goalY + 0.2, goalZ), label: createWorldLabel('🌊 홍해 바다 앞 도착 포인트 (지팡이 들어 바다 가르기!)'), triggered: false };

  const startZ = southZ - 6.0, startY = getBaseGroundHeight(0, startZ);
  playerPos.set(0, startY, startZ);
  playerVelY = 0; isGrounded = true; playerFacing = Math.PI; cameraYaw = 0; cameraTargetYaw = 0;
  spawnMosesFollowers(0, startZ);
  snapCameraToPlayer();
  updateStageHUD();
}

// -------------------------------------------------------------------------
// 3. 스테이지 2: U자형 경사 진흙 바닷길 + 움직이는 바다벽·물고기 + 이집트 병사 추격 스피드런
// -------------------------------------------------------------------------
function buildStage2DestinationMountainsAndSky(northZ, endHighY) {
  const mtnMat1 = matVoxel('#15803d', '#166534'), mtnMat2 = matVoxel('#64748b', '#475569'), snowCap = matVoxel('#f8fafc', '#e2e8f0');
  [
    { x: -34, z: northZ - 26, w: 26, h: 24 },
    { x: 0,   z: northZ - 34, w: 34, h: 32 },
    { x: 34,  z: northZ - 26, w: 26, h: 24 },
    { x: -18, z: northZ - 22, w: 20, h: 18 },
    { x: 18,  z: northZ - 22, w: 20, h: 18 }
  ].forEach((p, idx) => {
    worldGroup.add(
      createBox(p.w, p.h, p.w, (idx % 2 === 0) ? mtnMat1 : mtnMat2, p.x, endHighY + p.h / 2 - 2, p.z, false),
      createBox(p.w * 0.55, p.h * 0.35, p.w * 0.55, snowCap, p.x, endHighY + p.h - 1, p.z, false)
    );
  });

  const cloudMat = matVoxel('#ffffff', '#e0f2fe');
  [[-28, 24, northZ - 18], [0, 27, northZ - 22], [28, 25, northZ - 18], [-15, 31, northZ - 35], [16, 30, northZ - 35]].forEach(([cx, cy, cz], i) => {
    worldGroup.add(
      createBox(14 + (i % 2) * 5, 2.8, 7.0, cloudMat, cx, endHighY + cy, cz, false),
      createBox(10, 2.2, 5.5, cloudMat, cx + 2, endHighY + cy + 1.8, cz + 1, false)
    );
  });
}

function buildExodusStage2World() {
  clearWorld();
  mazeRunCount++;
  scene.background = new THREE.Color(0x38bdf8);
  scene.fog = new THREE.Fog(0x38bdf8, 65, 210);

  const halfW = 16.5, southZ = 105, northZ = -105, startHighY = 9.5, midLowY = 0.0, endHighY = 9.5;
  exodusStage2SlopeMeta = { northZ, southZ, startHighY, midLowY, endHighY };
  currentMapRectBounds = { minX: -halfW + 1.6, maxX: halfW - 1.6, minZ: northZ + 2.0, maxZ: southZ - 2.0 };

  buildEgyptianPyramidBackdrop(southZ, startHighY);
  buildStage2DestinationMountainsAndSky(northZ, endHighY);

  const mudMat = new THREE.MeshLambertMaterial({ map: makeWetMudTex() });
  for (let z = southZ + 18; z >= northZ - 12; z -= 3.0) {
    const midZ = z - 1.5;
    worldGroup.add(createBox(halfW * 2, 6.0, 3.25, mudMat, 0, getBaseGroundHeight(0, midZ) - 3.0, midZ));
  }

  const waterTex = makeFlowingWaterWallTex();
  const seaWallMat = new THREE.MeshLambertMaterial({ map: waterTex, transparent: true, opacity: 0.78 });
  const foamMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe });
  const wallLen = (southZ - northZ) + 16, wallH = 22.0;

  worldGroup.add(
    createBox(3.2, wallH, wallLen, seaWallMat, -(halfW + 1.6), wallH / 2 - 1, 0, false),
    createBox(3.2, wallH, wallLen, seaWallMat, (halfW + 1.6), wallH / 2 - 1, 0, false),
    createBox(3.5, 0.55, wallLen, foamMat, -(halfW + 1.6), wallH - 0.8, 0, false),
    createBox(3.5, 0.55, wallLen, foamMat, (halfW + 1.6), wallH - 0.8, 0, false)
  );

  const fishColors = ['#f97316', '#fde047', '#f43f5e', '#a855f7', '#22d3ee', '#4ade80'];
  for (let f = 0; f < 28; f++) {
    const side = (f % 2 === 0) ? -1 : 1, fishGrp = new THREE.Group();
    const body = createBox(0.35, 0.55, 1.1, matVoxel(fishColors[f % fishColors.length]), 0, 0, 0, false);
    const tail = createBox(0.2, 0.45, 0.45, matVoxel('#ffffff'), 0, 0, -0.7, false);
    const eye = createBox(0.4, 0.12, 0.12, matVoxel('#0f172a'), 0, 0.1, 0.35, false);
    fishGrp.add(body, tail, eye);

    const fx = side * (halfW + 0.55 + (f % 3) * 0.45);
    const fz = northZ + 12 + ((f * 17) % (southZ - northZ - 24));
    const fy = getBaseGroundHeight(0, fz) + 2.2 + (f % 5) * 2.1, dir = (f % 3 === 0) ? 1 : -1;
    fishGrp.position.set(fx, fy, fz);
    fishGrp.rotation.y = dir > 0 ? 0 : Math.PI;
    worldGroup.add(fishGrp);
    seaWallFishes.push({ group: fishGrp, tail, baseY: fy, dir, speed: 3.5 + (f % 4) * 1.2, phase: f * 0.9, minZ: northZ + 8, maxZ: southZ - 8 });
  }

  const coralCols = ['#f43f5e', '#ec4899', '#a855f7', '#fb923c'];
  [74, 58, 42, 26, 10, -6, -22, -38, -54, -70, -84].forEach((rz, idx) => {
    const by = getBaseGroundHeight(0, rz), pattern = idx % 3;
    if (pattern === 0) {
      const puddleW = 8.5, puddleD = 5.2;
      worldGroup.add(createBox(puddleW, 0.16, puddleD, new THREE.MeshBasicMaterial({ color: 0x0284c7 }), 0, by + 0.08, rz, false));
      stage2Puddles.push({ x: 0, z: rz, rx: puddleW / 2, rz: puddleD / 2 });

      [-10.2, 10.2].forEach((cx, cIdx) => {
        const cBy = getBaseGroundHeight(cx, rz), cMat = matVoxel(coralCols[(idx + cIdx) % coralCols.length]);
        worldGroup.add(createBox(4.2, 1.25, 1.8, cMat, cx, cBy + 0.62, rz), createBox(2.4, 0.75, 1.2, cMat, cx, cBy + 1.45, rz));
        platforms.push({ minX: cx - 2.2, maxX: cx + 2.2, minZ: rz - 1.0, maxZ: rz + 1.0, topY: cBy + 1.35 });
        stage2JumpObstacles.push({ x: cx, z: rz, halfW: 2.3, halfD: 1.2 });
      });
    } else if (pattern === 1) {
      const rBy = getBaseGroundHeight(0, rz);
      worldGroup.add(
        createBox(9.6, 1.3, 2.0, matVoxel('#64748b', '#475569'), 0, rBy + 0.65, rz),
        createBox(4.5, 0.55, 1.4, matVoxel(coralCols[idx % coralCols.length]), 0, rBy + 1.45, rz)
      );
      platforms.push({ minX: -4.9, maxX: 4.9, minZ: rz - 1.1, maxZ: rz + 1.1, topY: rBy + 1.35 });
      stage2JumpObstacles.push({ x: 0, z: rz, halfW: 5.0, halfD: 1.3 });

      [-11.2, 11.2].forEach(px => {
        const pBy = getBaseGroundHeight(px, rz);
        worldGroup.add(createBox(5.8, 0.16, 4.8, new THREE.MeshBasicMaterial({ color: 0x0284c7 }), px, pBy + 0.08, rz, false));
        stage2Puddles.push({ x: px, z: rz, rx: 2.9, rz: 2.4 });
      });
    } else {
      [-6.2, 6.2].forEach((ox, oIdx) => {
        const oBy = getBaseGroundHeight(ox, rz);
        const mat = (oIdx === 0) ? matVoxel('#78716c', '#57534e') : matVoxel(coralCols[idx % coralCols.length]);
        worldGroup.add(createBox(5.6, 1.3, 1.9, mat, ox, oBy + 0.65, rz));
        platforms.push({ minX: ox - 2.9, maxX: ox + 2.9, minZ: rz - 1.0, maxZ: rz + 1.0, topY: oBy + 1.32 });
        stage2JumpObstacles.push({ x: ox, z: rz, halfW: 3.0, halfD: 1.2 });
      });
      const pSide = (idx % 2 === 0 ? -1 : 1) * 12.0, pBy = getBaseGroundHeight(pSide, rz + 5.5);
      worldGroup.add(createBox(5.5, 0.16, 4.5, new THREE.MeshBasicMaterial({ color: 0x0284c7 }), pSide, pBy + 0.08, rz + 5.5, false));
      stage2Puddles.push({ x: pSide, z: rz + 5.5, rx: 2.75, rz: 2.25 });
    }
  });

  const goalZ = northZ + 7.5, goalY = getBaseGroundHeight(0, goalZ), pGroup = new THREE.Group();
  const fireCore = createBox(1.8, 6.0, 1.8, new THREE.MeshBasicMaterial({ color: 0xf97316 }), 0, 3.6, 0, false);
  const cloudRing = createBox(2.8, 1.3, 2.8, matVoxel('#f8fafc', '#e2e8f0'), 0, 2.3, 0, false);
  pGroup.add(createBox(3.8, 0.9, 3.8, matVoxel('#fde047', '#ca8a04'), 0, 0.45, 0), fireCore, cloudRing);
  pGroup.position.set(0, goalY, goalZ); pGroup.userData = { fireCore, cloudRing };
  worldGroup.add(pGroup);

  targetObject = { type: 'pillar_of_fire', mesh: pGroup, pos: new THREE.Vector3(0, goalY + 1.5, goalZ), label: createWorldLabel('🔥 구원의 언덕 목적지 (구름기둥과 불기둥!)'), triggered: false };

  const startZ = southZ - 14.0, startY = getBaseGroundHeight(0, startZ);
  playerPos.set(0, startY, startZ);
  playerVelY = 0; isGrounded = true; playerFacing = Math.PI; cameraYaw = 0; cameraTargetYaw = 0;
  spawnMosesFollowers(0, startZ);

  const baseSoldierSpd = currentMode === 'kinder' ? 6.6 : (currentMode === 'senior' ? 7.9 : 7.3);
  [[-2.6, 11.5], [2.6, 11.5], [-1.3, 14.5], [1.3, 14.5]].forEach(([sx, szOff], sIdx) => {
    const sMesh = createEgyptianSoldierMesh(), sz = startZ + szOff, sy = getBaseGroundHeight(sx, sz);
    sMesh.position.set(sx, sy, sz); sMesh.rotation.y = Math.PI;
    worldGroup.add(sMesh);
    egyptianSoldiers.push({ mesh: sMesh, laneOffset: sx, velY: 0, isGrounded: true, speed: baseSoldierSpd + (sIdx % 2) * 0.22, walkPhase: sIdx * 1.4 });
  });

  if (guideArrowGroup) guideArrowGroup.visible = (currentMode !== 'senior');
  snapCameraToPlayer(); updateStageHUD();
  showToast('⚡ 이집트 병사들이 뒤쫓아옵니다! 장애물을 점프해 넘고 물구덩이를 피해 달리세요!');
}

function updateStage2Speedrun(dt, now) {
  flowingWaterTextures.forEach(tex => {
    tex.offset.x = (tex.offset.x + dt * 0.45) % 1;
    tex.offset.y = Math.sin(now * 0.002) * 0.08;
  });

  seaWallFishes.forEach(f => {
    f.group.position.z += f.dir * f.speed * dt;
    f.group.position.y = f.baseY + Math.sin(now * 0.004 + f.phase) * 0.45;
    f.tail.rotation.y = Math.sin(now * 0.02 + f.phase) * 0.45;
    if (f.group.position.z < f.minZ) { f.dir = 1; f.group.rotation.y = 0; }
    else if (f.group.position.z > f.maxZ) { f.dir = -1; f.group.rotation.y = Math.PI; }
  });

  if (soldierDamageCooldown > 0) soldierDamageCooldown -= dt;

  egyptianSoldiers.forEach((sol) => {
    const sp = sol.mesh.position;
    let desiredX = THREE.MathUtils.clamp(playerPos.x + sol.laneOffset, -13.5, 13.5);

    for (const pud of stage2Puddles) {
      const dz = sp.z - pud.z;
      if (dz > -1.0 && dz < pud.rz + 5.5 && Math.abs(sp.x - pud.x) < pud.rx + 1.1) {
        desiredX = (Math.abs(pud.x) < 3.0) ? (sp.x >= 0 ? 1 : -1) * (pud.rx + 2.4) : 0;
        break;
      }
    }

    if (sol.isGrounded) {
      for (const obs of stage2JumpObstacles) {
        const dz = sp.z - obs.z;
        if (dz > 0.2 && dz < obs.halfD + 2.6 && Math.abs(sp.x - obs.x) < obs.halfW + 0.6) {
          sol.velY = 10.8; sol.isGrounded = false; break;
        }
      }
    }

    let inPuddle = false;
    for (const pud of stage2Puddles) {
      if (Math.abs(sp.x - pud.x) < pud.rx && Math.abs(sp.z - pud.z) < pud.rz) { inPuddle = true; break; }
    }

    const distBehindMoses = sp.z - playerPos.z;
    const catchupBoost = distBehindMoses > 18 ? 1.8 : (distBehindMoses < 5.5 ? -0.8 : 0);
    const curSpd = (sol.speed + catchupBoost) * (inPuddle ? 0.65 : 1.0);

    sp.z -= curSpd * dt;
    sp.x += (desiredX - sp.x) * Math.min(1, dt * 4.5);

    sol.velY -= 24 * dt;
    sp.y += sol.velY * dt;
    const supportY = getSupportHeight(sp.x, sp.z, sp.y + 0.6);
    if (sp.y <= supportY) { sp.y = supportY; sol.velY = 0; sol.isGrounded = true; }

    sol.mesh.rotation.y = Math.PI + (desiredX - sp.x) * 0.08;
    const cyc = now * 0.016 + sol.walkPhase;
    sol.mesh.userData.lLeg.rotation.x = Math.sin(cyc) * 0.7; sol.mesh.userData.rLeg.rotation.x = -Math.sin(cyc) * 0.7;
    sol.mesh.userData.lArm.rotation.x = -Math.sin(cyc) * 0.5; sol.mesh.userData.rArm.rotation.x = Math.sin(cyc) * 0.5;

    if (soldierDamageCooldown <= 0) {
      let touched = (Math.hypot(sp.x - playerPos.x, sp.z - playerPos.z) < 1.35);
      if (!touched) {
        for (const fol of exodusFollowers) {
          if (Math.hypot(sp.x - fol.mesh.position.x, sp.z - fol.mesh.position.z) < 1.25) { touched = true; break; }
        }
      }
      if (touched) {
        soldierHitCount++;
        soldierDamageCooldown = 1.6;
        triggerDamageFlash();
        playSfx('hit');
        egyptianSoldiers.forEach(s => { s.mesh.position.z += 5.5; });
        updateStageHUD();

        if (soldierHitCount >= 3) { openSoldierCaughtRetryModal(); return; }
        else showToast(`⚠️ 이집트 병사에게 잡혔어요! (${soldierHitCount}/3회 · ${3 - soldierHitCount}번 더 잡히면 재시도!)`);
      }
    }
  });
}

// -------------------------------------------------------------------------
// 4. 스테이지 3: 언약의 돌과 양떼 7쌍 수집 & 7단 탈출 대계단 완성
// -------------------------------------------------------------------------
function buildExodusStage3World() {
  clearWorld();
  mazeRunCount++;
  scene.background = new THREE.Color(0x0f172a);
  scene.fog = new THREE.Fog(0x0f172a, 38, 105);

  const isHard = (currentMode === 'senior' || currentMode === 'timeattack');
  const halfW = isHard ? 32 : 24, halfD = isHard ? 44 : 34, wallH = 8.0;
  worldGroup.add(createBox(halfW * 2, 1, halfD * 2, new THREE.MeshLambertMaterial({ map: makeArkFloorTex('#eab308', '#a16207') }), 0, -0.5, 0));

  const waterWallMat = new THREE.MeshLambertMaterial({ map: makeArkWallTex('#0369a1', '#38bdf8') }), foamMat = new THREE.MeshBasicMaterial({ color: 0xbae6fd });
  function addSeaMazeWall(x, z, w, d) {
    if (w <= 0.4 || d <= 0.4) return;
    const m = createBox(w, wallH, d, waterWallMat.clone(), x, wallH / 2, z);
    worldGroup.add(m, createBox(w + 0.08, 0.35, d + 0.08, foamMat, x, wallH + 0.18, z, false));
    wallMeshes.push(m);
    colliders.push({ minX: x - w / 2 - 0.38, maxX: x + w / 2 + 0.38, minZ: z - d / 2 - 0.38, maxZ: z + d / 2 + 0.38 });
  }
  addSeaMazeWall(0, -halfD, halfW * 2 + 2, 1.6); addSeaMazeWall(0, halfD, halfW * 2 + 2, 1.6);
  addSeaMazeWall(-halfW, 0, 1.8, halfD * 2 + 2); addSeaMazeWall(halfW, 0, 1.8, halfD * 2 + 2);

  const spanZ = (halfD * 2 - 26) / 3;
  for (let r = 0; r < 3; r++) {
    const z = halfD - 14 - r * spanZ, openSide = ((r + mazeRunCount) % 2 === 0) ? -1 : 1, gapX = openSide * (halfW * 0.42);
    const gLeft = gapX - 5.2, gRight = gapX + 5.2;
    if (gLeft > -halfW + 1) addSeaMazeWall((-halfW + gLeft) / 2, z, gLeft - (-halfW), 1.5);
    if (halfW > gRight + 1) addSeaMazeWall((gRight + halfW) / 2, z, halfW - gRight, 1.5);
    addWallTorch(gLeft - 0.6, 3.2, z + 0.9); addWallTorch(gRight + 0.6, 3.2, z + 0.9);
    addHayBaleCluster(-openSide * (halfW - 4.2), z - spanZ * 0.4);
  }

  const wallDoorZ = -halfD + 1.2, stairBaseZ = wallDoorZ + 7.5;
  stage3StairMeshes = [];
  for (let s = 0; s < 7; s++) {
    const stepM = createBox(6.2, 0.45, 1.4, matVoxel('#fde047', '#ca8a04'), 0, (s + 1) * 0.22, stairBaseZ - s * 0.9);
    stepM.visible = false; worldGroup.add(stepM); stage3StairMeshes.push(stepM);
  }

  const doorFrame = new THREE.Group();
  doorFrame.add(
    createBox(1.5, 5.6, 1.4, matVoxel('#fbbf24'), -3.2, 2.8, 0), createBox(1.5, 5.6, 1.4, matVoxel('#fbbf24'), 3.2, 2.8, 0),
    createBox(8.0, 1.2, 1.5, matVoxel('#f59e0b'), 0, 5.8, 0), createBox(5.0, 5.2, 0.5, new THREE.MeshBasicMaterial({ color: 0xffffff }), 0, 2.6, 0.25, false)
  );
  doorFrame.position.set(0, 0, wallDoorZ); worldGroup.add(doorFrame);
  addWallTorch(-4.6, 3.5, wallDoorZ + 0.9); addWallTorch(4.6, 3.5, wallDoorZ + 0.9);

  rescuedPairs = 0;
  const startPos = { x: 0, z: halfD - 5.0 }, interiorBounds = { minX: -halfW + 5.5, maxX: halfW - 5.5, minZ: -halfD + 10.5, maxZ: halfD - 10.0 }, pairSpots = [];
  ['sheep', 'deer', 'rabbit', 'sheep', 'deer', 'rabbit', 'sheep'].forEach((type, idx) => {
    const [px, pz] = findRandomSafeSpot(interiorBounds, pairSpots, 7.2, startPos, 7.5);
    pairSpots.push([px, pz]);
    const pairGroup = createAnimalPairGroup(type, 0xfde047);
    pairGroup.add(createBox(0.55, 0.85, 0.25, matVoxel('#38bdf8', '#0284c7'), 0, 0.55, 0.45));
    pairGroup.position.set(px, 0, pz); worldGroup.add(pairGroup);
    stageAnimals.push({
      type, group: pairGroup, rescued: false,
      label: createWorldLabel(`🪨 언약의 돌 & 양떼 ${idx + 1}${currentMode === 'timeattack' ? ' (+5초!⏱️)' : ''}`),
      heading: 0, targetHeading: 0, avoidTimer: 0, fleeState: false, limit: halfW - 4
    });
  });

  targetObject = { type: 'door', mesh: doorFrame, pos: new THREE.Vector3(0, 1.5, wallDoorZ + 1.5), label: createWorldLabel('🚪 홍해 언덕 출구 문 (7단 계단 완성 후 나가기!)'), triggered: false };
  playerPos.set(0, 0, halfD - 5.0); playerVelY = 0; isGrounded = true; playerFacing = 0; cameraYaw = 0; cameraTargetYaw = 0;
  snapCameraToPlayer(); updateStageHUD();
}

// -------------------------------------------------------------------------
// 5. 다리 분할 건설, 홍해 갈라짐·구름기둥 컷신 및 스테이지 프레임 업데이트
// -------------------------------------------------------------------------
function triggerPuzzleBuildOrSwitch() {
  if (!activeBuildTarget) return;
  if (activeBuildTarget.kind === 'build') {
    const bz = activeBuildTarget.ref;
    if (bz.built) return;
    const placed = bz.placedBlocks || 0, needed = bz.reqBlocks - placed;
    if (heldBlocks <= 0) {
      playSfx('wrong');
      showToast(`🧱 블록이 없어요! 주변에서 블록을 모아오세요! (남은 필요 블록: ${needed}개)`);
      return;
    }
    const deposit = Math.min(heldBlocks, needed);
    heldBlocks -= deposit;
    bz.placedBlocks = placed + deposit;
    if (typeof bz.rebuildBridgeMesh === 'function') bz.rebuildBridgeMesh();

    if (bz.placedBlocks >= bz.reqBlocks) {
      bz.built = true; bz.bpGroup.visible = false; bz.solidGroup.visible = true; bz.label.style.opacity = '0';
      if (bz.colliderRef) { bz.colliderRef.minX = 9999; bz.colliderRef.maxX = 9999; }
      if (bz.onBuilt) bz.onBuilt();
      playSfx('build');
      if (currentMode === 'timeattack') {
        timeRemaining += 5.0;
        showToast(`🌉 ${bz.title} 100% 완성! (+5초 시간 연장!)`);
      } else {
        showToast(`🌉 ${bz.title}가 완전히 이어졌어요! 건너가세요!`);
      }
    } else {
      const remain = bz.reqBlocks - bz.placedBlocks;
      bz.label.innerHTML = `🧱 ${bz.title} (${bz.placedBlocks}/${bz.reqBlocks}개 시공됨 · ${remain}개 더 필요)`;
      playSfx('build');
      showToast(`🔨 다리 일부(${bz.placedBlocks}/${bz.reqBlocks})를 지었어요! 블록 ${remain}개를 더 모아 완성하세요!`);
    }
    updateCarriedBlocksVisual();
    updateStageHUD();
  }
}

function updateExodusCutsceneFrame(dt, now) {
  if (exodusSeagulls.length > 0) {
    exodusSeagulls.forEach(gull => {
      const u = gull.userData, ang = now * 0.0018 + u.phase;
      gull.position.x = u.baseX + Math.sin(ang) * 14;
      gull.position.z = u.baseZ + Math.cos(ang) * 7;
      gull.rotation.y = Math.atan2(Math.cos(ang) * 14, -Math.sin(ang) * 7);
      const flap = Math.sin(now * 0.016 + u.phase) * 0.48;
      u.lWing.rotation.z = flap; u.rWing.rotation.z = -flap;
    });
  }

  // 스테이지 1 퀴즈 후 홍해 바다 좌우 갈라짐 컷신
  if (seaPartingCutscene.active) {
    seaPartingCutscene.timer += dt;
    const t = seaPartingCutscene.timer, sy = seaPartingCutscene.shoreY, sz = seaPartingCutscene.shoreZ;
    camera.position.lerp(new THREE.Vector3(0, sy + 9.5, sz + 13.5), 0.12);
    camera.lookAt(0, sy + 1.5, sz - 28);

    const splitProgress = Math.min(1, Math.max(0, (t - 0.4) / 3.2));
    const easeSplit = 1 - Math.pow(1 - splitProgress, 3), openDist = easeSplit * 15.5;
    seaPartingCutscene.leftSeaGroup.position.x = -openDist;
    seaPartingCutscene.rightSeaGroup.position.x = openDist;

    if (t > 0.3) {
      seaPartingCutscene.leftWaterWall.visible = true; seaPartingCutscene.rightWaterWall.visible = true;
      seaPartingCutscene.leftWaterWall.scale.y = 1 + easeSplit * 7.5;
      seaPartingCutscene.rightWaterWall.scale.y = 1 + easeSplit * 7.5;
    }
    if (t >= 2.2 && seaPartingCutscene.phase === 1) {
      seaPartingCutscene.phase = 2;
      showToast('✨ 바닷물이 좌우로 갈라져 마른 땅이 드러났습니다! (출애굽기 14:21)');
    }
    if (t >= 4.7) {
      seaPartingCutscene.active = false; currentStage = 2; isPlaying = true;
      if (currentMode === 'timeattack') { timeRemaining = 18.0; timeAttackFirstRechargeUsed = false; isTimeAttackActive = true; }
      buildExodusStage2World(); startStageBgm(2);
    }
    return true;
  }

  // 스테이지 2 구름기둥·불기둥 승천 컷신
  if (pillarCutscene.active && pillarCutscene.pillarGroup) {
    pillarCutscene.timer += dt;
    const t = pillarCutscene.timer, pg = pillarCutscene.pillarGroup;
    if (pg.userData.fireCore) {
      pg.userData.fireCore.scale.y = 1 + t * 1.4; pg.userData.fireCore.rotation.y += dt * 4.5;
      pg.userData.cloudRing.position.y = 2.2 + Math.sin(t * 5) * 0.8; pg.userData.cloudRing.rotation.y -= dt * 3.0;
    }
    const py = pg.position.y;
    camera.position.lerp(new THREE.Vector3(0, py + 5.5, pillarCutscene.goalZ + 9.5), 0.12);
    camera.lookAt(0, py + 3.0, pillarCutscene.goalZ);
    if (t >= 1.4 && pillarCutscene.phase === 1) {
      pillarCutscene.phase = 2;
      document.getElementById('white-fade').style.opacity = '0.9';
      setTimeout(() => { document.getElementById('white-fade').style.opacity = '0'; }, 400);
    }
    if (t >= 2.6) { pillarCutscene.active = false; openStageClearModal(2); }
    return true;
  }

  return false;
}

function updateExodusStageFrame(dt, now) {
  if (currentStage === 1 || currentStage === 2) {
    updateMosesFollowers(dt, now);
  }

  if (currentStage === 2) {
    updateStage2Speedrun(dt, now);
    if (!isPlaying) return;
  }

  if (currentStage === 1 || currentStage === 2) {
    let nextGuideTarget = null;
    collectibleBlocks.forEach(cb => {
      if (cb.collected) return;
      cb.boxMesh.rotation.y += dt * 2.2;
      cb.boxMesh.position.y = 0.75 + Math.sin(now * 0.006 + cb.pos.x) * 0.18;
      const d = Math.hypot(playerPos.x - cb.pos.x, playerPos.z - cb.pos.z);
      updateWorldLabelPos(cb.label, cb.pos, d < 28);
      if (d < 2.2) {
        if (currentStage === 1 && heldBlocks >= EXODUS_STAGE1_MAX_CARRY) {
          if (!cb.warnedAt || now - cb.warnedAt > 1800) {
            cb.warnedAt = now; playSfx('wrong');
            showToast(`🧱 건축물은 최대 ${EXODUS_STAGE1_MAX_CARRY}개까지만 지닐 수 있어요! 다리에 먼저 놓아주세요!`);
          }
          return;
        }
        cb.collected = true; cb.group.visible = false; cb.label.style.opacity = '0';
        heldBlocks++; updateCarriedBlocksVisual(); playSfx('rescue');
        if (currentMode === 'timeattack') {
          timeRemaining += 5.0; showToast(`🧱 건축 블록 획득! (보유 ${heldBlocks}개 · +5초 연장!)`);
        } else {
          showToast(`🧱 건축 블록을 주웠어요! (현재 보유: ${heldBlocks}/${EXODUS_STAGE1_MAX_CARRY}개)`);
        }
      }
    });

    activeBuildTarget = null;
    buildZones.forEach(bz => {
      if (bz.built) return;
      const minD = Math.min(Math.hypot(playerPos.x - bz.centerPos.x, playerPos.z - bz.centerPos.z), Math.hypot(playerPos.x - bz.pos.x, playerPos.z - bz.pos.z));
      updateWorldLabelPos(bz.label, bz.centerPos, minD < 28);
      if (minD < 5.0) {
        activeBuildTarget = { kind: 'build', ref: bz };
        if (minD < 3.0 && heldBlocks > 0) triggerPuzzleBuildOrSwitch();
      }
    });

    const pBtn = document.getElementById('puzzle-build-btn');
    if (activeBuildTarget) {
      pBtn.classList.remove('hidden');
      const bz = activeBuildTarget.ref, remain = bz.reqBlocks - (bz.placedBlocks || 0);
      pBtn.textContent = heldBlocks > 0 ? `🧱 ${bz.title} 블록 놓기! (남은 필요 ${remain}개)` : `🧱 블록 필요 (남은 수량 ${remain}개)`;
    } else pBtn.classList.add('hidden');

    const nextUnbuilt = buildZones.find(b => !b.built);
    if (nextUnbuilt) {
      const remainNeeded = nextUnbuilt.reqBlocks - (nextUnbuilt.placedBlocks || 0);
      const canDepositNow = (heldBlocks >= remainNeeded) || (currentStage === 1 && heldBlocks >= EXODUS_STAGE1_MAX_CARRY);
      if (!canDepositNow) {
        let nearB = null, minBD = 999;
        collectibleBlocks.forEach(cb => {
          if (!cb.collected) {
            const bd = Math.hypot(playerPos.x - cb.pos.x, playerPos.z - cb.pos.z);
            if (bd < minBD) { minBD = bd; nearB = cb.pos; }
          }
        });
        nextGuideTarget = nearB || nextUnbuilt.centerPos;
      } else nextGuideTarget = nextUnbuilt.centerPos;
    } else if (targetObject) nextGuideTarget = targetObject.pos;

    if (nextGuideTarget && guideArrowGroup.visible) {
      guideArrowGroup.rotation.y = Math.atan2(nextGuideTarget.x - playerPos.x, nextGuideTarget.z - playerPos.z) - playerFacing;
    }

    if (targetObject && !targetObject.triggered) {
      const td = Math.hypot(playerPos.x - targetObject.pos.x, playerPos.z - targetObject.pos.z);
      updateWorldLabelPos(targetObject.label, targetObject.pos, td < 32);
      const ctxBtn = document.getElementById('context-action-btn');
      if (td < 4.2 && Math.abs(playerPos.y - targetObject.pos.y) < 3.2) {
        ctxBtn.classList.remove('hidden');
        ctxBtn.textContent = currentStage === 1 ? '🌊 지팡이 들어 홍해 가르기!' : '🔥 구름기둥·불기둥 세우기!';
        if (td < 2.8) triggerContextAction();
      } else ctxBtn.classList.add('hidden');
    }
  }

  if (currentStage === 3) {
    let nearestTarget = null, minDist = 999;
    stageAnimals.forEach(a => {
      if (a.rescued) return;
      const d = Math.hypot(playerPos.x - a.group.position.x, playerPos.z - a.group.position.z);
      if (d < minDist) { minDist = d; nearestTarget = a.group.position; }
      updateWorldLabelPos(a.label, a.group.position, d < 22);
      if (d < 2.4) {
        a.rescued = true;
        if (a.group.userData && a.group.userData.ring) a.group.userData.ring.visible = false;
        a.label.style.opacity = '0'; followingAnimals.push(a);
        if (stage3StairMeshes[rescuedPairs]) stage3StairMeshes[rescuedPairs].visible = true;
        rescuedPairs++; playSfx('build');
        if (currentMode === 'timeattack') {
          timeRemaining += 5.0; showToast(`🪨 탈출 계단 ${rescuedPairs}단 완성! (+5초! ${rescuedPairs}/7)`);
        } else showToast(`🪨 언약의 돌로 북쪽 탈출 계단 ${rescuedPairs}단이 세워졌어요! (${rescuedPairs}/7)`);
        document.getElementById('hud-counter-text').textContent = `계단 ${rescuedPairs}/7단`;
        if (rescuedPairs === 7) showToast('🎉 7단 황금 탈출 계단이 완성되었어요! 북쪽 출구 문으로 나가세요!');
      }
    });

    followingAnimals.forEach((fa, idx) => {
      const leaderPos = (idx === 0) ? playerPos : followingAnimals[idx - 1].group.position;
      const dx = leaderPos.x - fa.group.position.x, dz = leaderPos.z - fa.group.position.z, dist = Math.hypot(dx, dz);
      const followSpacing = (idx === 0) ? 2.1 : 1.85;
      if (dist > followSpacing) {
        const moveRatio = Math.min(1, (dist - followSpacing) * 5.5 * dt);
        fa.group.position.x += dx * moveRatio; fa.group.position.z += dz * moveRatio;
        fa.heading = lerpAngle(fa.heading, Math.atan2(dx, dz), dt * 10);
        fa.group.rotation.y = fa.heading;
        fa.group.position.y = Math.abs(Math.sin(now * 0.015 + idx)) * 0.22;
      } else fa.group.position.y = 0;
    });

    if (targetObject && !targetObject.triggered) {
      const td = Math.hypot(playerPos.x - targetObject.pos.x, playerPos.z - targetObject.pos.z);
      targetObject.label.innerHTML = rescuedPairs >= 7 ? '🚪 7단 계단 완성! (구원의 언덕으로 나가기!)' : `🔒 홍해 언덕 출구 (계단 ${rescuedPairs}/7단)`;
      updateWorldLabelPos(targetObject.label, targetObject.pos, (rescuedPairs >= 7) ? (td < 28.0) : (td < 10.0));
      const guidePos = (rescuedPairs >= 7) ? targetObject.pos : (nearestTarget || targetObject.pos);
      if (guidePos && guideArrowGroup.visible) {
        guideArrowGroup.rotation.y = Math.atan2(guidePos.x - playerPos.x, guidePos.z - playerPos.z) - playerFacing;
      }
      const ctxBtn = document.getElementById('context-action-btn');
      if (td < 4.5) {
        ctxBtn.classList.remove('hidden');
        ctxBtn.textContent = rescuedPairs >= 7 ? '🚪 출구 문 열고 새 세상으로 나가기!' : `🐾 먼저 7개를 모두 모아주세요 (${rescuedPairs}/7)`;
        if (td < 2.8 && rescuedPairs >= 7) triggerContextAction();
      } else ctxBtn.classList.add('hidden');
    }
  }
}