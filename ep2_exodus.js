// =========================================================================
// [ep2_exodus.js - 파트 1/2] 에피소드 2 : 출애굽과 시내산 언약 (다리 미완성 구간만 투명 표시, 스테이지 1·2 랜덤 스폰)
// =========================================================================

EPISODE_SCRIPTURE.exodus = {
  1: {
    title: '스테이지 1 클리어! 홍해 바다 앞에 도착했어요!',
    desc: '통나무를 모으고 나무를 도끼질해 다리를 놓아 백성 6명과 함께 홍해 앞에 섰어요!',
    verse: '"모세가 백성에게 이르되 너희는 두려워하지 말고 가만히 서서 여호와께서 오늘 너희를 위하여 행하시는 구원을 보라" (출애굽기 14장 13절)',
    btnText: '🌊 홍해 바다가 갈라지는 기적 보기! ▶',
    quiz: { q: '퀴즈! 홍해 앞에서 두려워하는 백성에게 모세는 무엇을 보라고 했나요?', opts: ['여호와께서 행하시는 구원', '애굽의 화려한 병거', '광야의 높은 피라미드'], ans: 0 }
  },
  2: {
    title: '스테이지 2 클리어! 추격하던 병사들을 따돌렸어요!',
    desc: '이스라엘 백성이 다 건너자 거센 파도와 함께 바닷물이 다시 합쳐져 애굽 군대를 덮었어요!',
    verse: '"이스라엘 자손이 바다 가운데를 육지로 걸어가고 물은 그들의 좌우에 벽이 되니" (출애굽기 14장 22절)',
    btnText: '⛰️ 시내산 십계명 언약 받으러 가기 (스테이지 3) ▶',
    quiz: { q: '퀴즈! 이스라엘 백성이 마른 땅으로 바다를 건널 때 좌우의 바닷물은 어떻게 되었나요?', opts: ['얼음 빙하로 얼어붙었다', '좌우에 높은 물벽이 되었다', '모두 증발해 사라졌다'], ans: 1 }
  },
  3: {
    title: '스테이지 3 클리어! 밝은 빛 가운데 십계명을 받았어요!',
    desc: '시내산 맨 꼭대기 정상에 올라 찬란한 빛 가운데서 하나님이 친히 쓰신 십계명 두 돌판을 받았어요!',
    verse: '"여호와께서 시내 산 위에서 모세에게 이르시기를 마치실 때에 증겁판 둘을 모세에게 주시니 이는 돌판이요 하나님이 친히 쓰신 것이더라" (출애굽기 31장 18절)',
    btnText: '🌴 구원의 오아시스 언덕으로 나가기! ▶',
    quiz: { q: '퀴즈! 모세가 시내산 정상에서 하나님께 받은 열 가지 계명이 새겨진 것은 무엇인가요?', opts: ['십계명 두 돌판', '황금 지팡이', '양피지 두루마리'], ans: 0 }
  }
};

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// -------------------------------------------------------------------------
// 1. 이집트 피라미드 배경, 점프 가능한 4종 바위, 산호초·해저바위, 백성·병사 모델링
// -------------------------------------------------------------------------
function buildEgyptianPyramidBackdrop(southZ, baseY, scale = 1.0) {
  const sandstone1 = matVoxel('#eab308', '#ca8a04');
  const sandstone2 = matVoxel('#d97706', '#b45309');
  const goldCap = matVoxel('#fde047');

  const pyramidSpecs = [
    { cx: -38 * scale, cz: southZ + 26 * scale, layers: 10, stepSize: 4.0 * scale },
    { cx: 0,           cz: southZ + 36 * scale, layers: 14, stepSize: 4.4 * scale },
    { cx: 38 * scale,  cz: southZ + 26 * scale, layers: 9,  stepSize: 3.8 * scale }
  ];
  pyramidSpecs.forEach(p => {
    for (let l = 0; l < p.layers; l++) {
      const w = (p.layers - l) * p.stepSize, h = 2.5 * scale;
      const m = (l === p.layers - 1) ? goldCap : (l % 2 === 0 ? sandstone1 : sandstone2);
      worldGroup.add(createBox(w, h, w, m, p.cx, baseY + l * h + h / 2 - 1, p.cz, false));
    }
  });

  [-15 * scale, 15 * scale].forEach(ox => {
    worldGroup.add(
      createBox(2.6 * scale, 12.0 * scale, 2.6 * scale, sandstone2, ox, baseY + 6.0 * scale, southZ + 8, false),
      createBox(1.8 * scale, 2.4 * scale, 1.8 * scale, goldCap, ox, baseY + 13.0 * scale, southZ + 8, false)
    );
  });

  const sx = -20 * scale, sz = southZ + 15 * scale;
  worldGroup.add(
    createBox(4.8 * scale, 3.0 * scale, 9.0 * scale, sandstone1, sx, baseY + 1.5 * scale, sz, false),
    createBox(1.5 * scale, 1.5 * scale, 3.6 * scale, sandstone2, sx - 1.6 * scale, baseY + 0.75 * scale, sz - 5.4 * scale, false),
    createBox(1.5 * scale, 1.5 * scale, 3.6 * scale, sandstone2, sx + 1.6 * scale, baseY + 0.75 * scale, sz - 5.4 * scale, false),
    createBox(3.6 * scale, 3.0 * scale, 3.4 * scale, sandstone2, sx, baseY + 4.0 * scale, sz - 2.6 * scale, false),
    createBox(4.6 * scale, 2.6 * scale, 2.8 * scale, matVoxel('#1d4ed8', '#facc15'), sx, baseY + 4.1 * scale, sz - 2.8 * scale, false)
  );
}

function addVariedRockObstacle(x, z, variant = 0) {
  const by = getBaseGroundHeight(x, z);
  const m1 = matVoxel('#78716c', '#57534e'), m2 = matVoxel('#a8a29e', '#78716c'), m3 = matVoxel('#57534e', '#44403c');
  const grp = new THREE.Group();

  if (variant % 4 === 0) {
    grp.add(createBox(2.8, 1.1, 2.4, m1, 0, 0.55, 0), createBox(2.0, 1.0, 1.8, m2, -0.2, 1.6, 0.1), createBox(1.2, 0.7, 1.2, m3, 0.1, 2.4, 0));
    platforms.push(
      { minX: x - 1.5, maxX: x + 1.5, minZ: z - 1.3, maxZ: z + 1.3, topY: by + 1.1 },
      { minX: x - 1.1, maxX: x + 0.9, minZ: z - 0.9, maxZ: z + 1.1, topY: by + 2.1 }
    );
  } else if (variant % 4 === 1) {
    grp.add(createBox(2.4, 1.2, 2.4, m3, 0, 0.6, 0), createBox(1.5, 1.1, 1.5, m1, 0, 1.75, 0), createBox(1.8, 0.9, 1.6, m2, 0.9, 0.45, 0.3));
    platforms.push(
      { minX: x - 1.3, maxX: x + 1.8, minZ: z - 1.3, maxZ: z + 1.3, topY: by + 1.2 },
      { minX: x - 0.85, maxX: x + 0.85, minZ: z - 0.85, maxZ: z + 0.85, topY: by + 2.3 }
    );
  } else if (variant % 4 === 2) {
    grp.add(createBox(3.2, 1.15, 2.6, m2, -0.2, 0.58, 0), createBox(2.2, 1.65, 2.0, m1, 0.6, 0.82, -0.2));
    platforms.push(
      { minX: x - 1.8, maxX: x + 1.5, minZ: z - 1.4, maxZ: z + 1.4, topY: by + 1.15 },
      { minX: x - 0.5, maxX: x + 1.7, minZ: z - 1.2, maxZ: z + 0.8, topY: by + 1.65 }
    );
  } else {
    grp.add(createBox(2.5, 1.15, 2.2, m1, -0.3, 0.58, 0), createBox(2.0, 1.85, 1.8, m3, 0.5, 0.92, 0.2));
    platforms.push(
      { minX: x - 1.6, maxX: x + 1.4, minZ: z - 1.2, maxZ: z + 1.2, topY: by + 1.15 },
      { minX: x - 0.5, maxX: x + 1.5, minZ: z - 0.8, maxZ: z + 1.2, topY: by + 1.85 }
    );
  }

  grp.position.set(x, by, z);
  worldGroup.add(grp);
  grp.children.forEach(ch => wallMeshes.push(ch));
}

function createDetailedCoralHurdle(cx, rz, width = 4.4, idx = 0) {
  const cBy = getBaseGroundHeight(cx, rz);
  const grp = new THREE.Group();
  const palettes = [
    { main: '#f43f5e', sub: '#fda4af', tip: '#fef08a', reef: '#64748b' },
    { main: '#ec4899', sub: '#f9a8d4', tip: '#a7f3d0', reef: '#475569' },
    { main: '#a855f7', sub: '#d8b4fe', tip: '#fde047', reef: '#57534e' },
    { main: '#fb923c', sub: '#fdba74', tip: '#fef3c7', reef: '#64748b' }
  ];
  const pal = palettes[idx % palettes.length];
  const reefMat = matVoxel(pal.reef, '#334155');
  const mainMat = matVoxel(pal.main);
  const subMat = matVoxel(pal.sub);
  const tipMat = matVoxel(pal.tip);
  const seaWeedMat = matVoxel('#10b981', '#059669');

  grp.add(
    createBox(width, 0.55, 1.9, reefMat, 0, 0.28, 0),
    createBox(width * 0.85, 0.45, 1.5, mainMat, 0, 0.72, 0)
  );

  const branchCount = Math.max(3, Math.floor(width / 1.25));
  for (let b = 0; b < branchCount; b++) {
    const bx = -width * 0.4 + (b / Math.max(1, branchCount - 1)) * (width * 0.8);
    const bh = 0.65 + ((b + idx) % 2) * 0.32;
    const pillar = createBox(0.45, bh, 0.45, (b % 2 === 0 ? mainMat : subMat), bx, 0.9 + bh / 2, (b % 2 === 0 ? 0.18 : -0.18));
    const armL = createBox(0.32, 0.35, 0.32, subMat, bx - 0.28, 0.95 + bh * 0.65, 0);
    const armR = createBox(0.32, 0.35, 0.32, mainMat, bx + 0.28, 0.95 + bh * 0.75, 0);
    const glowTip = createBox(0.28, 0.18, 0.28, tipMat, bx, 0.95 + bh + 0.08, (b % 2 === 0 ? 0.18 : -0.18));
    grp.add(pillar, armL, armR, glowTip);
  }

  grp.add(
    createBox(0.26, 0.95, 0.26, seaWeedMat, -width * 0.44, 0.65, 0.45),
    createBox(0.26, 0.85, 0.26, seaWeedMat, width * 0.44, 0.6, -0.45),
    createBox(0.55, 0.24, 0.52, matVoxel('#fef3c7', '#fde68a'), 0, 0.62, 0.72)
  );

  grp.position.set(cx, cBy, rz);
  worldGroup.add(grp);
  platforms.push({ minX: cx - width / 2 - 0.15, maxX: cx + width / 2 + 0.15, minZ: rz - 1.05, maxZ: rz + 1.05, topY: cBy + 1.35 });
  stage2JumpObstacles.push({ x: cx, z: rz, halfW: width / 2 + 0.2, halfD: 1.2 });
}

function createDetailedSeaRockHurdle(cx, rz, width = 6.0, idx = 0) {
  const rBy = getBaseGroundHeight(cx, rz);
  const grp = new THREE.Group();
  const darkRock = matVoxel('#475569', '#334155');
  const midRock = matVoxel('#64748b', '#475569');
  const lightRock = matVoxel('#94a3b8', '#64748b');
  const mossMat = matVoxel('#15803d', '#166534');
  const coralSpot = matVoxel('#fb7185');
  const barnacleMat = matVoxel('#e2e8f0');

  grp.add(
    createBox(width, 0.65, 2.1, darkRock, 0, 0.32, 0),
    createBox(width * 0.88, 0.55, 1.75, midRock, -0.15, 0.88, 0.05),
    createBox(width * 0.62, 0.38, 1.35, lightRock, 0.2, 1.25, -0.05)
  );

  const segs = Math.max(3, Math.floor(width / 1.7));
  for (let s = 0; s < segs; s++) {
    const sx = -width * 0.38 + (s / Math.max(1, segs - 1)) * (width * 0.76);
    grp.add(
      createBox(0.95, 0.16, 0.95, mossMat, sx, 1.18 + (s % 2) * 0.22, 0),
      createBox(0.32, 0.28, 0.32, barnacleMat, sx + 0.35, 0.68, 0.85)
    );
    if ((s + idx) % 2 === 0) {
      grp.add(createBox(0.38, 0.48, 0.38, coralSpot, sx - 0.25, 1.42, 0.2));
    }
  }

  grp.position.set(cx, rBy, rz);
  worldGroup.add(grp);
  platforms.push({ minX: cx - width / 2 - 0.15, maxX: cx + width / 2 + 0.15, minZ: rz - 1.1, maxZ: rz + 1.1, topY: rBy + 1.35 });
  stage2JumpObstacles.push({ x: cx, z: rz, halfW: width / 2 + 0.2, halfD: 1.25 });
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

  const hammerTool = new THREE.Group();
  hammerTool.add(
    createBox(0.1, 0.65, 0.1, matVoxel('#78350f'), 0, -0.5, 0.25, false),
    createBox(0.28, 0.24, 0.48, matVoxel('#64748b', '#334155'), 0, -0.78, 0.25, false)
  );
  hammerTool.visible = false;
  rArm.add(hammerTool);

  g.add(lLeg, rLeg, torso, sash, head, scarf, lEye, rEye, lArm, rArm);
  g.userData = { lLeg, rLeg, lArm, rArm, head, hammerTool, walkPhase: idx * 1.1 };
  return g;
}

function spawnMosesFollowers(startX, startZ) {
  exodusFollowers = []; mosesTrailHistory = [];
  for (let step = 0; step < 60; step++) {
    const hz = startZ + step * 0.25;
    mosesTrailHistory.push({ x: startX, y: getBaseGroundHeight(startX, hz), z: hz, facing: Math.PI });
  }
  for (let i = 0; i < 6; i++) {
    const mesh = createFollowerPersonMesh(i), row = Math.floor(i / 2), col = (i % 2 === 0) ? -1 : 1;
    const histIdx = (row + 1) * 4;
    const anchor = mosesTrailHistory[histIdx];
    const fx = anchor.x - col * 0.95;
    const fz = anchor.z + (0.85 + row * 0.65);
    const fy = getBaseGroundHeight(fx, fz);
    mesh.position.set(fx, fy, fz);
    mesh.rotation.y = Math.PI;
    worldGroup.add(mesh);
    exodusFollowers.push({ mesh, row, col });
  }
}

function updateMosesFollowers(dt, now) {
  if (exodusFollowers.length === 0) return;
  if (hammerAnimTimer > 0) hammerAnimTimer -= dt;

  const head = mosesTrailHistory[0];
  if (!head || Math.hypot(playerPos.x - head.x, playerPos.z - head.z) > 0.24) {
    mosesTrailHistory.unshift({ x: playerPos.x, y: playerPos.y, z: playerPos.z, facing: playerFacing });
    if (mosesTrailHistory.length > 140) mosesTrailHistory.pop();
  }
  const speedRatio = Math.max(1.0, currentMoveSpeed / 7.5);
  const followGain = (currentStage === 2 ? 12.5 : 8.5) * speedRatio;

  exodusFollowers.forEach((f, idx) => {
    const isHammeringWorker = (currentStage === 1 && hammerAnimTimer > 0 && hammerTargetPos && idx < 2);
    if (f.mesh.userData.hammerTool) {
      f.mesh.userData.hammerTool.visible = isHammeringWorker;
    }

    if (isHammeringWorker) {
      const workX = hammerTargetPos.x + (idx === 0 ? -1.35 : 1.35);
      const workZ = hammerTargetPos.z + 1.2;
      f.mesh.position.x = THREE.MathUtils.lerp(f.mesh.position.x, workX, dt * 12);
      f.mesh.position.z = THREE.MathUtils.lerp(f.mesh.position.z, workZ, dt * 12);
      f.mesh.rotation.y = Math.PI;
      const supportY = getSupportHeight(f.mesh.position.x, f.mesh.position.z, f.mesh.position.y + 0.8);
      f.mesh.position.y = THREE.MathUtils.lerp(f.mesh.position.y, supportY, 0.4);

      const hammerSwing = Math.sin(now * 0.045 + idx * 1.5);
      f.mesh.userData.rArm.rotation.x = -1.6 + hammerSwing * 1.1;
      f.mesh.userData.lArm.rotation.x = -0.8 - hammerSwing * 0.4;
      f.mesh.userData.lLeg.rotation.x = 0.2;
      f.mesh.userData.rLeg.rotation.x = -0.2;
      return;
    }

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
// 2. 스테이지 1: 통나무 건축물 및 벌목 나무 완전 랜덤 스폰 & 다리 미완성 구간만 투명 표시
// -------------------------------------------------------------------------
function pickRandomStage1Spot(zoneBounds, existingSpots, minSpacing, checkEntryExitFn) {
  const scales = [1.0, 0.78, 0.58, 0.4];
  for (const sc of scales) {
    const reqDist = minSpacing * sc;
    for (let att = 0; att < 90; att++) {
      const rx = zoneBounds.minX + Math.random() * (zoneBounds.maxX - zoneBounds.minX);
      const rz = zoneBounds.minZ + Math.random() * (zoneBounds.maxZ - zoneBounds.minZ);
      if (checkEntryExitFn && checkEntryExitFn(rx, rz)) continue;
      if (!isSpawnSpotClear(rx, rz, 1.5)) continue;
      if (existingSpots.some(pt => Math.hypot(rx - pt[0], rz - pt[1]) < reqDist)) continue;
      return [rx, rz];
    }
  }
  const fallbackX = zoneBounds.minX + 2.0 + Math.random() * Math.max(2.0, zoneBounds.maxX - zoneBounds.minX - 4.0);
  const fallbackZ = zoneBounds.minZ + 2.0 + Math.random() * Math.max(2.0, zoneBounds.maxZ - zoneBounds.minZ - 4.0);
  return [fallbackX, fallbackZ];
}

function spawnCollectibleBlock(x, z, zoneBounds = null, blockLabel = '🪵 통나무 건축물') {
  const by = getBaseGroundHeight(x, z);
  const grp = new THREE.Group();
  const logMesh = createLogBlockMesh(1.18, 0.74, 0.88);
  logMesh.position.set(0, 0.65, 0);

  const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.25, 20), new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.06;
  grp.add(logMesh, ring);
  grp.position.set(x, by, z);
  worldGroup.add(grp);

  const isRolling = (currentMode === 'senior');
  const randAng = Math.random() * Math.PI * 2;
  const rollSpd = 3.2 + Math.random() * 1.8;

  const lbl = createWorldLabel(`${blockLabel} ${currentMode === 'timeattack' ? '(+5초!)' : (isRolling ? '💨굴러다님!' : '(최대 2개)')}`);
  collectibleBlocks.push({
    group: grp, boxMesh: logMesh, pos: new THREE.Vector3(x, by + 0.5, z),
    collected: false, label: lbl,
    rolling: isRolling,
    vx: isRolling ? Math.cos(randAng) * rollSpd : 0,
    vz: isRolling ? Math.sin(randAng) * rollSpd : 0,
    bounds: zoneBounds
  });
}

function spawnChoppableTree(x, z) {
  const by = getBaseGroundHeight(x, z);
  const grp = new THREE.Group();
  const treePivot = new THREE.Group();

  const trunkMat = new THREE.MeshLambertMaterial({ map: makeLogBarkTex() });
  const leafMat1 = matVoxel('#15803d', '#166534');
  const leafMat2 = matVoxel('#22c55e', '#15803d');

  const trunk = createBox(0.92, 3.4, 0.92, trunkMat, 0, 1.7, 0);
  const leaves1 = createBox(3.4, 1.2, 3.4, leafMat1, 0, 3.5, 0);
  const leaves2 = createBox(2.2, 1.0, 2.2, leafMat2, 0, 4.4, 0);
  treePivot.add(trunk, leaves1, leaves2);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(1.25, 1.7, 24),
    new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.08;

  grp.add(treePivot, ring);
  grp.position.set(x, by, z);
  worldGroup.add(grp);

  const reqHits = (currentMode === 'senior' || currentMode === 'timeattack') ? 4 : 2;
  const colRef = { minX: x - 0.65, maxX: x + 0.65, minZ: z - 0.65, maxZ: z + 0.65 };
  colliders.push(colRef);

  const lbl = createWorldLabel(`🪓 벌목용 조각목 나무 (0/${reqHits}회 도끼질)`);
  choppingTrees.push({
    group: grp,
    treePivot,
    ring,
    pos: new THREE.Vector3(x, by + 0.5, z),
    reqHits,
    hits: 0,
    chopped: false,
    fallTimer: 0,
    shakeTimer: 0,
    autoChopCooldown: 0,
    colliderRef: colRef,
    label: lbl
  });
}

function performTreeChop(tr) {
  if (!tr || tr.chopped) return;
  if (heldBlocks >= EXODUS_STAGE1_MAX_CARRY) {
    playSfx('wrong');
    showToast(`🪵 통나무는 최대 ${EXODUS_STAGE1_MAX_CARRY}개까지만 지닐 수 있어요! 다리에 먼저 놓아주세요!`);
    return;
  }

  tr.hits++;
  tr.shakeTimer = 0.25;
  playerChopAnimTimer = 0.38;
  playerFacing = Math.atan2(tr.pos.x - playerPos.x, tr.pos.z - playerPos.z);
  playSfx('axe');

  if (tr.hits >= tr.reqHits) {
    tr.chopped = true;
    tr.fallTimer = 0.01;
    if (tr.ring) tr.ring.visible = false;
    if (tr.colliderRef) { tr.colliderRef.minX = 9999; tr.colliderRef.maxX = 9999; }
    tr.label.style.opacity = '0';

    heldBlocks++;
    updateCarriedBlocksVisual();
    playSfx('rescue');
    if (currentMode === 'timeattack') {
      timeRemaining += 5.0;
      showToast(`🪓 나무 벌목 성공! 통나무 획득! (보유 ${heldBlocks}개 · +5초 연장!)`);
    } else {
      showToast(`🪓 나무를 베어 통나무를 얻었어요! (현재 보유: ${heldBlocks}/${EXODUS_STAGE1_MAX_CARRY}개)`);
    }
    updateStageHUD();
  } else {
    const remain = tr.reqHits - tr.hits;
    tr.label.innerHTML = `🪓 벌목용 조각목 나무 (${tr.hits}/${tr.reqHits}회 · ${remain}번 더!)`;
    showToast(`🪓 쿵! 도끼질 (${tr.hits}/${tr.reqHits}) · ${remain}번 더 찍으면 쓰러져요!`);
  }
}

function createChasmWithBridgePuzzle(zCenter, trenchDepthW, halfMapW, bridgeConfigs, isCliffChasm = false) {
  const zSouthEdge = zCenter + trenchDepthW / 2, zNorthEdge = zCenter - trenchDepthW / 2;
  const ySouth = getBaseGroundHeight(0, zSouthEdge), yNorth = getBaseGroundHeight(0, zNorthEdge), yMid = (ySouth + yNorth) * 0.5;
  const slopeAngle = Math.atan2(yNorth - ySouth, trenchDepthW);

  if (isCliffChasm) {
    const cliffWallMat = matVoxel('#78350f', '#451a03');
    const sideCanyonMat = matVoxel('#92400e', '#78350f');
    const abyssMat = matVoxel('#1c1917', '#0c0a09');
    worldGroup.add(
      createBox(halfMapW * 2 - 0.2, 36, 0.8, cliffWallMat, 0, ySouth - 18.08, zSouthEdge + 0.4),
      createBox(halfMapW * 2 - 0.2, 36, 0.8, cliffWallMat, 0, yNorth - 18.08, zNorthEdge - 0.4),
      createBox(halfMapW * 2 + 52, 6, trenchDepthW + 8, abyssMat, 0, yMid - 15.0, zCenter, false),
      createBox(16, 40, trenchDepthW + 1.4, sideCanyonMat, -(halfMapW + 8.2), yMid - 6.5, zCenter),
      createBox(16, 40, trenchDepthW + 1.4, sideCanyonMat, (halfMapW + 8.2), yMid - 6.5, zCenter)
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
    const solidGroup = new THREE.Group();
    worldGroup.add(bpGroup, solidGroup);

    const reqCount = cfg.reqBlocks || 2;
    const lbl = createWorldLabel(`🪵 ${cfg.title} (0/${reqCount}개 · 통나무 모아 건설)`);
    const zoneObj = {
      id: cfg.id, title: cfg.title, x: cfg.x, w: cfg.w, zCenter, zSouthEdge, zNorthEdge, ySouth, yNorth, yMid, trenchDepthW,
      pos: new THREE.Vector3(cfg.x, ySouth + 0.5, zSouthEdge + 1.4), centerPos: new THREE.Vector3(cfg.x, yMid + 0.5, zCenter),
      reqBlocks: reqCount, placedBlocks: 0, built: false, colliderRef: bridgeCollider, bpGroup, solidGroup, label: lbl,
      rebuildBridgeMesh: function () {
        while (this.solidGroup.children.length > 0) this.solidGroup.remove(this.solidGroup.children[0]);
        while (this.bpGroup.children.length > 0) this.bpGroup.remove(this.bpGroup.children[0]);

        const ratio = Math.min(1, Math.max(0, this.placedBlocks / this.reqBlocks));

        // 1) 지어진 구간은 불투명 통나무 다리로 생성
        let builtNorthZ = this.zSouthEdge;
        if (ratio > 0) {
          const builtLen = (this.trenchDepthW + 0.8) * ratio;
          const curCenterZ = (this.zSouthEdge + 0.4) - builtLen / 2;
          builtNorthZ = (this.zSouthEdge + 0.4) - builtLen;
          const curY = THREE.MathUtils.lerp(this.ySouth, this.yNorth, ratio * 0.5);
          const plankMat = new THREE.MeshLambertMaterial({ map: makeLogBarkTex() });
          const railMat = matVoxel('#5c2d0c', '#451a03');
          const plank = createBox(this.w, 0.48, builtLen, plankMat, this.x, curY - 0.1, curCenterZ);
          const railL = createBox(0.32, 0.65, builtLen, railMat, this.x - this.w / 2 + 0.18, curY + 0.28, curCenterZ);
          const railR = createBox(0.32, 0.65, builtLen, railMat, this.x + this.w / 2 - 0.18, curY + 0.28, curCenterZ);
          plank.rotation.x = slopeAngle; railL.rotation.x = slopeAngle; railR.rotation.x = slopeAngle;
          this.solidGroup.add(plank, railL, railR);
        }

        // 2) 미완성 구간만 반투명 청사진 박스로 표시 (지어진 부분은 투명 영역 제거)
        if (ratio < 1) {
          this.bpGroup.visible = true;
          const remSouthZ = (ratio > 0) ? Math.min(this.zSouthEdge, builtNorthZ) : this.zSouthEdge;
          const remLen = Math.max(0.2, remSouthZ - this.zNorthEdge);
          const remCenterZ = (remSouthZ + this.zNorthEdge) * 0.5;
          const tCenter = THREE.MathUtils.clamp((this.zSouthEdge - remCenterZ) / this.trenchDepthW, 0, 1);
          const remY = THREE.MathUtils.lerp(this.ySouth, this.yNorth, tCenter);

          const bpMesh = createBox(
            this.w, 0.35, remLen,
            new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.38 }),
            this.x, remY + 0.12, remCenterZ, false
          );
          const edgeGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(this.w + 0.06, 0.38, remLen + 0.06));
          const bpOutline = new THREE.LineSegments(edgeGeo, new THREE.LineBasicMaterial({ color: 0xe0f2fe }));
          bpOutline.position.set(this.x, remY + 0.12, remCenterZ);
          bpMesh.rotation.x = slopeAngle;
          bpOutline.rotation.x = slopeAngle;
          this.bpGroup.add(bpMesh, bpOutline);
        } else {
          this.bpGroup.visible = false;
        }
      }
    };
    zoneObj.rebuildBridgeMesh();
    buildZones.push(zoneObj);
  });
  if (halfMapW > curX + 0.5) colliders.push({ minX: curX, maxX: halfMapW, minZ: zNorthEdge - 0.4, maxZ: zSouthEdge + 0.4 });
}

function spawnExodusSkyCloudsAndGulls(northZ) {
  [[-65, 24, northZ - 35], [-25, 27, northZ - 55], [20, 25, northZ - 40], [68, 28, northZ - 50], [-45, 30, northZ - 85], [40, 29, northZ - 90], [0, 32, northZ - 110]].forEach(([cx, cy, cz], idx) => {
    const cGrp = createFluffyCloudGroup(1.1 + (idx % 3) * 0.2, false);
    cGrp.position.set(cx, cy, cz);
    worldGroup.add(cGrp);
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
  scene.fog = new THREE.Fog(0x38bdf8, 80, 240);

  const isKinder = (currentMode === 'kinder');
  const isExtended = !isKinder;
  const halfW = isExtended ? 34 : 26, southZ = isExtended ? 88 : 42, northZ = isExtended ? -80 : -34;
  const topHillY = isExtended ? 15.0 : 8.5, bottomShoreY = 0.6;

  exodusStage1SlopeMeta = { northZ, southZ, topY: topHillY, bottomY: bottomShoreY };
  currentMapRectBounds = { minX: -halfW + 1.8, maxX: halfW - 1.8, minZ: northZ + 1.5, maxZ: southZ - 1.5 };

  buildEgyptianPyramidBackdrop(southZ, topHillY, 1.0);

  const cliffDefinitions = isExtended
    ? [
        { id: 'cliff1', z: 42, depth: 9.2, x: (currentMode === 'senior' ? -10 : 0), req: EXODUS_STAGE1_BRIDGE_BLOCKS, title: '첫 번째 협곡 다리' },
        { id: 'cliff2', z: -2, depth: 9.2, x: (currentMode === 'senior' ? 11 : 0),  req: EXODUS_STAGE1_BRIDGE_BLOCKS, title: '두 번째 협곡 다리' },
        { id: 'cliff3', z: -46, depth: 9.2, x: (currentMode === 'senior' ? -8 : 0), req: EXODUS_STAGE1_BRIDGE_BLOCKS, title: '세 번째 협곡 다리' }
      ]
    : [ { id: 'cliff1', z: -2, depth: 5.4, x: 0, req: 8, title: '광야 협곡 통나무다리' } ];

  const sandMat = new THREE.MeshLambertMaterial({ map: makeDesertSandTex() });
  for (let z = southZ + 22; z > northZ; z -= 2.0) {
    const midZ = z - 1.0;
    if (cliffDefinitions.some(c => midZ <= c.z + c.depth / 2 + 0.85 && midZ >= c.z - c.depth / 2 - 0.85)) continue;
    worldGroup.add(createBox(halfW * 2, 18.0, 1.98, sandMat, 0, getBaseGroundHeight(0, midZ) - 9.0, midZ));
  }

  cliffDefinitions.forEach(c => {
    createChasmWithBridgePuzzle(c.z, c.depth, halfW, [{ id: c.id, x: c.x, w: 6.4, reqBlocks: c.req, title: c.title }], true);
  });

  if (guideArrowGroup) guideArrowGroup.visible = (currentMode !== 'senior');

  const zoneEdges = [southZ - 3.5];
  cliffDefinitions.forEach(c => { zoneEdges.push(c.z + c.depth / 2 - 2.2, c.z - c.depth / 2 + 2.2); });
  zoneEdges.push(northZ + 8);

  for (let zIdx = 0; zIdx <= cliffDefinitions.length; zIdx++) {
    const zMax = zoneEdges[zIdx * 2], zMin = zoneEdges[zIdx * 2 + 1];
    if (zMax === undefined || zMin === undefined || zMax <= zMin) continue;
    const cliff = cliffDefinitions[Math.min(zIdx, cliffDefinitions.length - 1)];
    const zoneBounds = { minX: -halfW + 4.5, maxX: halfW - 4.5, minZ: zMin + 1.8, maxZ: zMax - 1.8 };

    const isChoppingZone = (isExtended && zIdx === 1);
    const isMixedLastZone = (isExtended && zIdx === 2);
    const rockCount = isExtended ? 10 : 3;
    const treeCount = isExtended ? ((isChoppingZone || isMixedLastZone) ? 12 : 20) : 4;
    const placedObstacles = [];

    const isNearEntryOrExit = (tx, tz) => {
      if (Math.hypot(tx, tz - (southZ - 6)) < 6.2 || Math.hypot(tx, tz - (northZ + 4.5)) < 6.2) return true;
      return cliffDefinitions.some(cd =>
        Math.hypot(tx - cd.x, tz - (cd.z + cd.depth / 2)) < 5.8 ||
        Math.hypot(tx - cd.x, tz - (cd.z - cd.depth / 2)) < 5.8
      );
    };

    if (zIdx < cliffDefinitions.length) {
      let itemTypes = [];
      if (isKinder) {
        itemTypes = shuffleArray(['block', 'block', 'block', 'block', 'tree', 'tree', 'tree', 'tree']);
      } else if (isChoppingZone) {
        itemTypes = Array(cliff.req).fill('tree');
      } else if (isMixedLastZone) {
        itemTypes = shuffleArray(['block', 'block', 'block', 'block', 'tree', 'tree']);
      } else {
        itemTypes = Array(cliff.req).fill('block');
      }

      const itemSpacing = isKinder ? 5.2 : 6.0;
      itemTypes.forEach(kind => {
        const [bx, bz] = pickRandomStage1Spot(zoneBounds, placedObstacles, itemSpacing, isNearEntryOrExit);
        placedObstacles.push([bx, bz]);
        if (kind === 'tree') spawnChoppableTree(bx, bz);
        else spawnCollectibleBlock(bx, bz, zoneBounds, '🪵 통나무 건축물');
      });
    }

    for (let r = 0; r < rockCount; r++) {
      for (let att = 0; att < 45; att++) {
        const rx = zoneBounds.minX + Math.random() * (zoneBounds.maxX - zoneBounds.minX);
        const rz = zoneBounds.minZ + Math.random() * (zoneBounds.maxZ - zoneBounds.minZ);
        if (isNearEntryOrExit(rx, rz)) continue;
        if (placedObstacles.some(p => Math.hypot(rx - p[0], rz - p[1]) < 4.4)) continue;
        placedObstacles.push([rx, rz]);
        addVariedRockObstacle(rx, rz, Math.floor(Math.random() * 4));
        break;
      }
    }

    for (let t = 0; t < treeCount; t++) {
      for (let att = 0; att < 45; att++) {
        const tx = zoneBounds.minX + Math.random() * (zoneBounds.maxX - zoneBounds.minX);
        const tz = zoneBounds.minZ + Math.random() * (zoneBounds.maxZ - zoneBounds.minZ);
        if (isNearEntryOrExit(tx, tz)) continue;
        if (placedObstacles.some(p => Math.hypot(tx - p[0], tz - p[1]) < 3.4)) continue;
        placedObstacles.push([tx, tz]);
        addPalmTree(tx, tz, 0.85 + Math.random() * 0.45, true);
        break;
      }
    }
  }

  let hillStepIdx = 0;
  for (let z = northZ - 8; z <= southZ + 16; z += 10) {
    hillStepIdx++;
    const by = getBaseGroundHeight(0, z);
    const xJitter = (hillStepIdx % 2 === 0) ? 0.25 : 0;
    [-(halfW + 7.5 + xJitter), (halfW + 7.5 + xJitter)].forEach(bx => {
      const h1 = 6 + (Math.abs(Math.round(bx + z)) % 4);
      const hill = createBox(14.5, h1 + 36, 9.8, matVoxel('#d97706', '#92400e'), bx, by + h1 / 2 - 14, z);
      worldGroup.add(hill);
      const treeClusters = isExtended ? 3 : 1;
      for (let tc = 0; tc < treeClusters; tc++) {
        const rx = bx + (bx < 0 ? 2 : -2) + (Math.random() - 0.5) * 4.5;
        const rz = z + (Math.random() - 0.5) * 7.5;
        addPalmTree(rx, rz, 1.0 + Math.random() * 0.35, true);
      }
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
  lastGroundedY = startY;
  playerVelY = 0; isGrounded = true; playerFacing = Math.PI; cameraYaw = 0; cameraTargetYaw = 0;
  spawnMosesFollowers(0, startZ);
  snapCameraToPlayer();
  updateStageHUD();
}

// -------------------------------------------------------------------------
// 3. 스테이지 2: 반별 공간 차별화 + 장애물 위치 매번 랜덤 스폰 + 타임어택 진주 1초 가속
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

  [
    [-28, 24, northZ - 18], [0, 27, northZ - 22], [28, 25, northZ - 18],
    [-15, 31, northZ - 35], [16, 30, northZ - 35],
    [-42, 26, 20], [42, 28, 25], [-35, 29, 85], [35, 27, 90], [0, 32, 130]
  ].forEach(([cx, cy, cz], i) => {
    const cl = createFluffyCloudGroup(1.15 + (i % 3) * 0.2, false);
    cl.position.set(cx, endHighY + cy, cz);
    worldGroup.add(cl);
  });
}

function spawnSpeedPearl(x, z) {
  const by = getBaseGroundHeight(x, z);
  const grp = new THREE.Group();
  const shellMat = matVoxel('#fbcfe8', '#f472b6');
  const pearlMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const glowMat = new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.55 });

  const shellBot = createBox(1.1, 0.2, 1.1, shellMat, 0, 0.12, 0, false);
  const pearlCore = new THREE.Mesh(new THREE.SphereGeometry(0.38, 12, 12), pearlMat);
  pearlCore.position.set(0, 0.55, 0);
  const pearlAura = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 12), glowMat);
  pearlAura.position.set(0, 0.55, 0);

  grp.add(shellBot, pearlCore, pearlAura);
  grp.position.set(x, by, z);
  worldGroup.add(grp);

  const lbl = createWorldLabel('🦪 바다 진주 (먹으면 1초 초고속 가속!⚡)');
  stage2Pearls.push({ group: grp, core: pearlCore, pos: new THREE.Vector3(x, by + 0.5, z), collected: false, label: lbl });
}

function startStage2Countdown() {
  isPlaying = false;
  isTimeAttackActive = false;
  stage2CountdownActive = true;
  if (stage2CountdownTimer) { clearInterval(stage2CountdownTimer); stage2CountdownTimer = null; }

  const overlay = document.getElementById('stage2-countdown-overlay');
  const numEl = document.getElementById('stage2-countdown-num');
  if (overlay && numEl) {
    overlay.style.display = 'flex';
    let count = 3;
    numEl.textContent = '3';
    playSfx('count');

    stage2CountdownTimer = setInterval(() => {
      count--;
      numEl.classList.remove('count-anim');
      void numEl.offsetWidth;
      numEl.classList.add('count-anim');

      if (count > 0) {
        numEl.textContent = String(count);
        playSfx('count');
      } else if (count === 0) {
        numEl.textContent = '출발! 🏃';
        playSfx('go');
      } else {
        clearInterval(stage2CountdownTimer);
        stage2CountdownTimer = null;
        overlay.style.display = 'none';
        stage2CountdownActive = false;
        isPlaying = true;
        if (currentMode === 'timeattack') {
          timeRemaining = 22.0;
          timeAttackFirstRechargeUsed = false;
          isTimeAttackActive = true;
        }
        showToast(
          currentMode === 'timeattack'
            ? '⚡ 출발! 진주를 먹으면 1초간 속도가 빨라져요! 불기둥까지 달리세요!'
            : '⚡ 출발! 산호초와 바위는 점프하고 물구덩이는 피해 불기둥까지 달리세요!'
        );
      }
    }, 950);
  } else {
    stage2CountdownActive = false;
    isPlaying = true;
  }
}

function buildExodusStage2World() {
  clearWorld();
  scene.background = new THREE.Color(0x38bdf8);
  scene.fog = new THREE.Fog(0x38bdf8, 160, 720);

  const isKinder = (currentMode === 'kinder');
  const isJunior = (currentMode === 'junior');
  const isSenior = (currentMode === 'senior' || currentMode === 'timeattack');

  const halfW = 16.5;
  const southZ = isKinder ? 90 : (isSenior ? 165 : 135);
  const northZ = isKinder ? -90 : (isSenior ? -165 : -135);
  const startHighY = 11.5, midLowY = 0.0, endHighY = 11.5;

  exodusStage2SlopeMeta = { northZ, southZ, startHighY, midLowY, endHighY };
  currentMapRectBounds = { minX: -halfW + 2.2, maxX: halfW - 2.2, minZ: northZ + 2.0, maxZ: southZ - 2.0 };

  buildEgyptianPyramidBackdrop(southZ, startHighY, isKinder ? 1.4 : 1.85);
  buildStage2DestinationMountainsAndSky(northZ, endHighY);

  const mudMat = new THREE.MeshLambertMaterial({ map: makeWetMudTex() });
  for (let z = southZ + 26; z >= northZ - 16; z -= 3.0) {
    const midZ = z - 1.5;
    worldGroup.add(createBox(halfW * 2, 6.0, 3.15, mudMat, 0, getBaseGroundHeight(0, midZ) - 3.0, midZ));
  }

  const waterTex = makeFlowingWaterWallTex();
  const seaWallMat = new THREE.MeshLambertMaterial({ map: waterTex, transparent: true, opacity: 0.85 });
  const seaTopMat = matVoxel('#0284c7', '#0369a1');
  const waveCrestMat = matVoxel('#38bdf8', '#7dd3fc');
  const wallLen = (southZ - northZ) + 16, wallH = 22.0;

  worldGroup.add(
    createBox(3.2, wallH, wallLen, seaWallMat, -(halfW + 1.6), wallH / 2 - 1, 0, false),
    createBox(3.2, wallH, wallLen, seaWallMat, (halfW + 1.6), wallH / 2 - 1, 0, false),
    createBox(3.4, 0.8, wallLen, seaTopMat, -(halfW + 1.6), wallH - 0.8, 0, false),
    createBox(3.4, 0.8, wallLen, seaTopMat, (halfW + 1.6), wallH - 0.8, 0, false)
  );

  const closingStartZ = northZ + 9.5;
  const closingEndZ = southZ + 8.5;
  const closingLen = closingEndZ - closingStartZ;
  const closingCenterZ = (closingStartZ + closingEndZ) * 0.5;
  const closingHalfW = halfW + 1.5;

  const leftClosingWall = new THREE.Group();
  leftClosingWall.add(
    createBox(closingHalfW, wallH, closingLen, seaWallMat, 0, wallH / 2 - 1, closingCenterZ, false),
    createBox(closingHalfW + 0.2, 1.1, closingLen, seaTopMat, 0, wallH - 0.9, closingCenterZ, false)
  );
  const rightClosingWall = new THREE.Group();
  rightClosingWall.add(
    createBox(closingHalfW, wallH, closingLen, seaWallMat, 0, wallH / 2 - 1, closingCenterZ, false),
    createBox(closingHalfW + 0.2, 1.1, closingLen, seaTopMat, 0, wallH - 0.9, closingCenterZ, false)
  );

  for (let wz = closingStartZ + 6; wz <= closingEndZ - 6; wz += 12) {
    const lw1 = createBox(closingHalfW * 0.9, 1.5, 4.2, seaTopMat, 0, wallH + 0.1, wz, false);
    const lw2 = createBox(3.2, 1.8, 5.5, waveCrestMat, closingHalfW * 0.38, wallH + 0.3, wz + 2, false);
    leftClosingWall.add(lw1, lw2);
    seaClosingWaves.push({ mesh1: lw1, mesh2: lw2, baseY: wallH + 0.1, phase: wz * 0.2 });

    const rw1 = createBox(closingHalfW * 0.9, 1.5, 4.2, seaTopMat, 0, wallH + 0.1, wz + 4, false);
    const rw2 = createBox(3.2, 1.8, 5.5, waveCrestMat, -closingHalfW * 0.38, wallH + 0.3, wz + 1, false);
    rightClosingWall.add(rw1, rw2);
    seaClosingWaves.push({ mesh1: rw1, mesh2: rw2, baseY: wallH + 0.1, phase: wz * 0.2 + 1.5 });
  }

  leftClosingWall.position.x = -(halfW + closingHalfW * 0.5);
  leftClosingWall.visible = false;
  rightClosingWall.position.x = (halfW + closingHalfW * 0.5);
  rightClosingWall.visible = false;

  worldGroup.add(leftClosingWall, rightClosingWall);
  pillarCutscene.leftClosingWall = leftClosingWall;
  pillarCutscene.rightClosingWall = rightClosingWall;

  const fishColors = ['#f97316', '#fde047', '#f43f5e', '#a855f7', '#22d3ee', '#4ade80'];
  for (let f = 0; f < 36; f++) {
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

  const rowStep = isKinder ? 16 : (isSenior ? 10.5 : 13);
  let rowIdx = 0;
  let lastPattern = -1;

  for (let rz = southZ - 26; rz >= northZ + 20; rz -= rowStep) {
    let pattern = Math.floor(Math.random() * 4);
    if (pattern === lastPattern) pattern = (pattern + 1 + Math.floor(Math.random() * 3)) % 4;
    lastPattern = pattern;

    const xShift = (Math.random() - 0.5) * (isKinder ? 2.4 : (isJunior ? 1.8 : 1.0));
    const flipDir = (Math.random() < 0.5) ? 1 : -1;
    const palSeed = Math.floor(Math.random() * 16);

    if (pattern === 0) {
      const coralW = isKinder ? 5.2 : (isJunior ? 7.6 : 10.6);
      const puddleW = isKinder ? 5.6 : (isJunior ? 8.2 : 11.8);
      const rockW = isKinder ? 5.6 : (isJunior ? 8.2 : 12.8);
      const sideX = isKinder ? 10.6 : 11.4;

      createDetailedCoralHurdle(-sideX + xShift * 0.5, rz, coralW, palSeed);
      createDetailedCoralHurdle(sideX + xShift * 0.5, rz, coralW, palSeed + 1);
      const pudX = xShift * 0.6;
      const pudBy = getBaseGroundHeight(pudX, rz);
      worldGroup.add(createBox(puddleW, 0.16, 4.6, new THREE.MeshBasicMaterial({ color: 0x0284c7 }), pudX, pudBy + 0.08, rz, false));
      stage2Puddles.push({ x: pudX, z: rz, rx: puddleW / 2, rz: 2.3 });
      createDetailedSeaRockHurdle(-xShift * 0.7, rz - 3.6, rockW, palSeed + 2);
    } else if (pattern === 1) {
      const centerRockW = isKinder ? 6.0 : (isJunior ? 8.6 : 13.2);
      const sidePuddleW = isKinder ? 4.8 : (isJunior ? 6.8 : 9.8);
      const sideCoralW = isKinder ? 5.0 : (isJunior ? 7.4 : 10.6);
      const sideX = isKinder ? 10.6 : 11.4;

      createDetailedSeaRockHurdle(xShift * 0.7, rz, centerRockW, palSeed);
      [-sideX, sideX].forEach((px, pIdx) => {
        const adjX = px + xShift * 0.35;
        const pBy = getBaseGroundHeight(adjX, rz);
        worldGroup.add(createBox(sidePuddleW, 0.16, 4.5, new THREE.MeshBasicMaterial({ color: 0x0284c7 }), adjX, pBy + 0.08, rz, false));
        stage2Puddles.push({ x: adjX, z: rz, rx: sidePuddleW / 2, rz: 2.25 });
        createDetailedCoralHurdle(adjX, rz - 3.5, sideCoralW, palSeed + pIdx + 1);
      });
    } else if (pattern === 2) {
      const tripleW = isKinder ? 4.8 : (isJunior ? 7.2 : 11.2);
      const pudW = isKinder ? 4.2 : (isJunior ? 5.4 : 6.8);
      const sideX = isKinder ? 10.5 : 11.2;

      if (Math.random() < 0.5) {
        createDetailedSeaRockHurdle(-sideX + xShift * 0.3, rz, tripleW, palSeed);
        createDetailedCoralHurdle(xShift * 0.6, rz + 1.4, tripleW, palSeed + 1);
        createDetailedSeaRockHurdle(sideX + xShift * 0.3, rz, tripleW, palSeed + 2);
      } else {
        createDetailedCoralHurdle(-sideX + xShift * 0.3, rz + 1.2, tripleW, palSeed);
        createDetailedSeaRockHurdle(xShift * 0.6, rz, tripleW, palSeed + 1);
        createDetailedCoralHurdle(sideX + xShift * 0.3, rz + 1.2, tripleW, palSeed + 2);
      }
      [-5.6, 5.6].forEach(px => {
        const adjX = px + xShift * 0.4;
        const pBy = getBaseGroundHeight(adjX, rz - 3.4);
        worldGroup.add(createBox(pudW, 0.16, 4.2, new THREE.MeshBasicMaterial({ color: 0x0284c7 }), adjX, pBy + 0.08, rz - 3.4, false));
        stage2Puddles.push({ x: adjX, z: rz - 3.4, rx: pudW / 2, rz: 2.1 });
      });
    } else {
      const staggeredW = isKinder ? 6.4 : (isJunior ? 10.2 : 18.0);
      const staggerX = (isKinder ? 9.5 : (isJunior ? 8.8 : 7.8)) * flipDir;
      const pudW = isKinder ? 5.2 : (isJunior ? 6.8 : 8.5);

      createDetailedCoralHurdle(-staggerX, rz, staggeredW, palSeed);
      createDetailedSeaRockHurdle(staggerX, rz - 2.4, staggeredW, palSeed + 1);
      const pudX = xShift * 0.8;
      const pBy = getBaseGroundHeight(pudX, rz + 2.2);
      worldGroup.add(createBox(pudW, 0.16, 4.2, new THREE.MeshBasicMaterial({ color: 0x0284c7 }), pudX, pBy + 0.08, rz + 2.2, false));
      stage2Puddles.push({ x: pudX, z: rz + 2.2, rx: pudW / 2, rz: 2.1 });
    }

    if (currentMode === 'timeattack' && rowIdx % 2 === 0) {
      const pearlX = (Math.random() - 0.5) * 20.0;
      spawnSpeedPearl(pearlX, rz + rowStep * 0.48);
    }
    rowIdx++;
  }

  const goalZ = northZ + 7.5, goalY = getBaseGroundHeight(0, goalZ);
  const pGroup = createBlazingPillarOfFire(0, goalY, goalZ, 1.15);

  targetObject = {
    type: 'pillar_of_fire', mesh: pGroup,
    pos: new THREE.Vector3(0, goalY + 1.5, goalZ),
    label: createWorldLabel('🔥 구원의 언덕 목적지 (타오르는 불기둥!)'),
    triggered: false
  };

  const startZ = southZ - 14.0, startY = getBaseGroundHeight(0, startZ);
  playerPos.set(0, startY, startZ);
  lastGroundedY = startY;
  playerVelY = 0; isGrounded = true; playerFacing = Math.PI; cameraYaw = 0; cameraTargetYaw = 0;
  spawnMosesFollowers(0, startZ);

  const baseSoldierSpd = (currentMode === 'timeattack') ? 9.9 : (isKinder ? 6.6 : (isSenior ? 8.1 : 7.4));
  [[-2.6, 11.5], [2.6, 11.5], [-1.3, 14.5], [1.3, 14.5]].forEach(([sx, szOff], sIdx) => {
    const sMesh = createEgyptianSoldierMesh(), sz = startZ + szOff, sy = getBaseGroundHeight(sx, sz);
    sMesh.position.set(sx, sy, sz); sMesh.rotation.y = Math.PI;
    worldGroup.add(sMesh);
    egyptianSoldiers.push({
      mesh: sMesh, laneOffset: sx, zRowOffset: (sIdx >= 2 ? 2.6 : 0),
      velY: 0, isGrounded: true,
      speed: baseSoldierSpd + (currentMode === 'timeattack' ? 0 : (sIdx % 2) * 0.18),
      walkPhase: sIdx * 1.4
    });
  });

  if (guideArrowGroup) guideArrowGroup.visible = (currentMode !== 'senior');
  snapCameraToPlayer();
  updateStageHUD();
  startStage2Countdown();
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

  stage2Pearls.forEach(pr => {
    if (pr.collected) return;
    pr.core.position.y = 0.55 + Math.sin(now * 0.008 + pr.pos.z) * 0.15;
    const d = Math.hypot(playerPos.x - pr.pos.x, playerPos.z - pr.pos.z);
    updateWorldLabelPos(pr.label, pr.pos, d < 24);
    if (d < 2.2) {
      pr.collected = true;
      pr.group.visible = false;
      pr.label.style.opacity = '0';
      playerSpeedBoostTimer = 1.0;
      playSfx('boost');
      if (currentMode === 'timeattack') timeRemaining += 3.0;
      showToast('🦪 진주 획득! 1초 동안 초고속으로 달립니다! 💨');
    }
  });

  if (!isPlaying || stage2CountdownActive) return;
  if (soldierDamageCooldown > 0) soldierDamageCooldown -= dt;

  const startWaitZ = (exodusStage2SlopeMeta ? exodusStage2SlopeMeta.southZ : 135) - 15.2;
  const hasPlayerStartedMoving = (playerPos.z < startWaitZ || currentMoveSpeed > 0.2);

  egyptianSoldiers.forEach((sol) => {
    const sp = sol.mesh.position;
    let desiredX = THREE.MathUtils.clamp(playerPos.x + sol.laneOffset, -13.5, 13.5);

    if (hasPlayerStartedMoving) {
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
      const catchupBoost = (currentMode === 'timeattack') ? 0 : (distBehindMoses > 20 ? 1.5 : (distBehindMoses < 5.5 ? -0.8 : 0));
      const curSpd = (sol.speed + catchupBoost) * (inPuddle ? 0.68 : 1.0);

      const minAllowedZ = playerPos.z + 1.35 + (sol.zRowOffset || 0);
      sp.z = Math.max(minAllowedZ, sp.z - curSpd * dt);
      sp.x += (desiredX - sp.x) * Math.min(1, dt * 4.5);
    }

    sol.velY -= 24 * dt;
    sp.y += sol.velY * dt;
    const supportY = getSupportHeight(sp.x, sp.z, sp.y + 0.6);
    if (sp.y <= supportY) { sp.y = supportY; sol.velY = 0; sol.isGrounded = true; }

    sol.mesh.rotation.y = Math.PI + (desiredX - sp.x) * 0.08;
    const cyc = now * 0.016 + sol.walkPhase;
    if (hasPlayerStartedMoving) {
      sol.mesh.userData.lLeg.rotation.x = Math.sin(cyc) * 0.7; sol.mesh.userData.rLeg.rotation.x = -Math.sin(cyc) * 0.7;
      sol.mesh.userData.lArm.rotation.x = -Math.sin(cyc) * 0.5; sol.mesh.userData.rArm.rotation.x = Math.sin(cyc) * 0.5;
    } else {
      sol.mesh.userData.lLeg.rotation.x = 0; sol.mesh.userData.rLeg.rotation.x = 0;
      sol.mesh.userData.lArm.rotation.x = 0; sol.mesh.userData.rArm.rotation.x = 0;
    }

    if (hasPlayerStartedMoving && soldierDamageCooldown <= 0) {
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
        else showToast(`⚠️ 이집트 병사에게 잡혔어요! (${soldierHitCount}/3회 · 남은 기회 ❤️x${3 - soldierHitCount})`);
      }
    }
  });
}
// =========================================================================
// [ep2_exodus.js - 파트 2/2] 스테이지 3 시내산 등반(정상 바위 아래 칸부터 구름바다 배치, 소년반 연속 3개 장애물 방지, 물주머니 +5초) 및 컷신
// =========================================================================

function spawnSinaiWaterPouchItem(x, y, z) {
  const grp = new THREE.Group();
  const leatherMat = matVoxel('#b45309', '#78350f');
  const darkLeatherMat = matVoxel('#78350f', '#451a03');
  const corkMat = matVoxel('#fde68a', '#ca8a04');
  const waterDropMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const waterHighlightMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe });

  const lowerBelly = createBox(0.86, 0.58, 0.48, leatherMat, 0, 0.58, 0);
  const upperBody = createBox(0.66, 0.38, 0.40, leatherMat, 0, 0.98, 0);
  const neck = createBox(0.28, 0.22, 0.28, darkLeatherMat, 0, 1.24, 0, false);
  const stopper = createBox(0.22, 0.16, 0.22, corkMat, 0, 1.40, 0, false);
  const sideStrapL = createBox(0.10, 0.68, 0.14, darkLeatherMat, -0.44, 0.72, 0, false);
  const sideStrapR = createBox(0.10, 0.68, 0.14, darkLeatherMat, 0.44, 0.72, 0, false);

  const dropFront = createBox(0.32, 0.38, 0.52, waterDropMat, 0, 0.65, 0, false);
  const dropTop = createBox(0.18, 0.16, 0.53, waterHighlightMat, 0, 0.88, 0, false);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.75, 1.05, 20),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.06;

  grp.add(lowerBelly, upperBody, neck, stopper, sideStrapL, sideStrapR, dropFront, dropTop, ring);
  grp.position.set(x, y, z);
  worldGroup.add(grp);

  const lbl = createWorldLabel('💧 고대 물주머니 (마시면 +5초 연장!)');
  sinaiClocks.push({ group: grp, pos: new THREE.Vector3(x, y + 0.8, z), collected: false, label: lbl });
}

function createSinaiSnakeMesh() {
  const snakeGrp = new THREE.Group();
  const bodyMat = matVoxel('#15803d', '#166534');
  const patternMat = matVoxel('#fde047', '#ca8a04');
  const headMat = matVoxel('#166534', '#14532d');
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  const tongueMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });

  const tailSeg = createBox(0.34, 0.24, 0.65, bodyMat, -0.32, 0.12, -0.52);
  const midSeg1 = createBox(0.72, 0.28, 0.38, patternMat, 0.0, 0.14, -0.22);
  const midSeg2 = createBox(0.38, 0.30, 0.68, bodyMat, 0.28, 0.15, 0.12);
  const neckSeg = createBox(0.34, 0.42, 0.34, patternMat, 0.05, 0.26, 0.38);
  const headBox = createBox(0.46, 0.30, 0.48, headMat, 0.05, 0.46, 0.56);
  const lEye = createBox(0.09, 0.09, 0.06, eyeMat, -0.11, 0.52, 0.78, false);
  const rEye = createBox(0.09, 0.09, 0.06, eyeMat, 0.21, 0.52, 0.78, false);
  const tongue = createBox(0.14, 0.04, 0.28, tongueMat, 0.05, 0.42, 0.90, false);

  snakeGrp.add(tailSeg, midSeg1, midSeg2, neckSeg, headBox, lEye, rEye, tongue);
  snakeGrp.userData = { headBox, tongue };
  return snakeGrp;
}

function createZigzagLightningBolt() {
  const boltGroup = new THREE.Group();
  const outerMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.95 });
  const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const sparkMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

  const segSpecs = [
    { x: -0.55, y: 9.8, h: 3.4, rotZ: -0.32 },
    { x:  0.45, y: 7.0, h: 3.4, rotZ:  0.36 },
    { x: -0.42, y: 4.2, h: 3.4, rotZ: -0.34 },
    { x:  0.18, y: 1.5, h: 3.2, rotZ:  0.24 }
  ];
  segSpecs.forEach(s => {
    const segHolder = new THREE.Group();
    segHolder.position.set(s.x, s.y, 0);
    segHolder.rotation.z = s.rotZ;
    segHolder.add(
      createBox(0.56, s.h, 0.42, outerMat, 0, 0, 0, false),
      createBox(0.26, s.h + 0.1, 0.48, coreMat, 0, 0, 0, false)
    );
    boltGroup.add(segHolder);
  });

  const impact1 = createBox(2.4, 0.28, 0.45, sparkMat, 0, 0.18, 0, false);
  const impact2 = createBox(0.45, 0.28, 2.4, sparkMat, 0, 0.18, 0, false);
  boltGroup.add(impact1, impact2);

  return boltGroup;
}

function relocateSinaiPlayerOnHit(stepIdx, nodeIdx, msgPrefix = '⚠️ 장애물에 닿아') {
  if (currentMode === 'timeattack' && sinaiStepNodes.length > 0) {
    const backIdx = Math.max(0, (nodeIdx || 1) - 1);
    const backNode = sinaiStepNodes[backIdx] || sinaiStepNodes[0];
    sinaiLastCheckpoint.set(backNode.x, backNode.y, backNode.z);
    playerPos.set(backNode.x, backNode.y + 0.12, backNode.z);
    lastGroundedY = backNode.y;
    playerVelY = 0;
    isGrounded = true;
    showToast(`${msgPrefix} 바로 뒤 칸 바위로 이동했어요!`);
  } else {
    const targetRowIdx = Math.max(0, (stepIdx || 1) - 1);
    const fallbackPt = sinaiSafeCheckpoints[targetRowIdx] || sinaiSafeCheckpoints[0];
    sinaiLastCheckpoint.copy(fallbackPt);
    playerPos.set(fallbackPt.x, fallbackPt.y + 0.12, fallbackPt.z);
    lastGroundedY = fallbackPt.y;
    playerVelY = 0;
    isGrounded = true;
    showToast(`${msgPrefix} 한 줄 아래 바위로 내려왔어요!`);
  }
}

function buildExodusStage3World() {
  clearWorld();
  const isKinder = (currentMode === 'kinder');
  const isJunior = (currentMode === 'junior');
  const isTimeAttack = (currentMode === 'timeattack');
  const isSeniorMap = (currentMode === 'senior' || isTimeAttack);

  if (isTimeAttack) {
    timeRemaining = 12.0;
    const timerValEl = document.getElementById('hud-timer-val');
    if (timerValEl) timerValEl.textContent = '12.0초';
  }

  scene.background = new THREE.Color(0x38bdf8);
  scene.fog = new THREE.Fog(0xbae6fd, 85, 290);

  const halfW = 24;
  const totalRows = isKinder ? 8 : (isSeniorMap ? 12 : 9);
  const colsX = isKinder ? [-6.0, 0.0, 6.0] : (isSeniorMap ? [-9.6, -4.8, 0.0, 4.8, 9.6] : [-7.5, -2.5, 2.5, 7.5]);
  const colW = isKinder ? 6.02 : (isSeniorMap ? 4.82 : 5.02);
  const lateralStepRise = 0.80;
  const rowRise = colsX.length * lateralStepRise;
  const stepDz = 4.5;
  const firstStepZ = 24.0;
  const summitZ = firstStepZ - totalRows * stepDz - 2.0;
  const summitY = Number((totalRows * rowRise + 0.80).toFixed(2));

  const pathHalfLimit = isKinder ? 9.0 : (isSeniorMap ? 12.0 : 10.0);
  currentMapRectBounds = { minX: -pathHalfLimit + 0.2, maxX: pathHalfLimit - 0.2, minZ: summitZ - 5, maxZ: 45 };

  const sandMat = new THREE.MeshLambertMaterial({ map: makeDesertSandTex() });
  const yellowRock1 = matVoxel('#eab308', '#ca8a04');
  const yellowRock2 = matVoxel('#d97706', '#b45309');
  const yellowRock3 = matVoxel('#b45309', '#78350f');
  const cliffStone = matVoxel('#78716c', '#57534e');
  const goldStepMat = matVoxel('#fde047', '#ca8a04');

  // 1) 남쪽 산기슭 출발 베이스캠프 바닥
  worldGroup.add(createBox(halfW * 2 + 16, 4, 34, sandMat, 0, -2, 37));
  sinaiLastCheckpoint.set(0, 0, 29);
  sinaiSafeCheckpoints.push(new THREE.Vector3(0, 0, 29));
  sinaiStepNodes.push({ x: 0, y: 0, z: 29, stepIdx: 0, nodeIdx: 0 });

  // 2) 남쪽 산기슭에서 응원하는 이스라엘 백성들
  const peoplePositions = [
    [-9, 36], [-5.5, 37.5], [-2.2, 36.5], [2.2, 36.5], [5.5, 37.5], [9, 36],
    [-7.5, 40], [-3.8, 40.8], [0, 40.2], [3.8, 40.8], [7.5, 40]
  ];
  peoplePositions.forEach(([px, pz], idx) => {
    const person = createFollowerPersonMesh(idx);
    person.position.set(px, 0, pz);
    person.rotation.y = Math.PI;
    if (person.userData.head) person.userData.head.rotation.x = -0.32;
    worldGroup.add(person);
    sinaiWaitingPeople.push({ mesh: person, phase: idx * 0.8 });
  });

  // 3) 백성들 뒤 배경 바위산 병풍
  const backMtnSpecs = [
    { x: -22, z: 50, w: 18, h: 19, d: 10, m: yellowRock2 },
    { x: -9,  z: 52, w: 16, h: 24, d: 11, m: yellowRock3 },
    { x: 0,   z: 54, w: 20, h: 28, d: 12, m: yellowRock1 },
    { x: 10,  z: 52, w: 16, h: 23, d: 11, m: yellowRock3 },
    { x: 22,  z: 50, w: 18, h: 18, d: 10, m: yellowRock2 }
  ];
  backMtnSpecs.forEach(bm => {
    const m1 = createBox(bm.w, bm.h, bm.d, bm.m, bm.x, bm.h / 2 - 1, bm.z);
    const m2 = createBox(bm.w * 0.65, bm.h + 5, bm.d * 0.7, cliffStone, bm.x, (bm.h + 5) / 2 - 1, bm.z + 2);
    worldGroup.add(m1, m2);
    wallMeshes.push(m1, m2);
  });

  // 4) 양옆을 바위산으로 빈틈없이 막아 옆으로 떨어지지 않게 완전 차폐
  const maxSideMtnH = Math.max(12, summitY - 3.5);
  for (let z = summitZ + 5; z <= 28; z += 4.2) {
    const prog = Math.max(0, Math.min(1, (26 - z) / Math.max(1, 26 - summitZ)));
    const pathYAtZ = prog * (summitY - 2);

    [-1, 1].forEach((sideDir, sIdx) => {
      const baseH = Math.min(maxSideMtnH, pathYAtZ + 5.0 + ((Math.abs(Math.round(z)) + sIdx * 3) % 4));
      const outerH = Math.min(maxSideMtnH + 1.2, baseH + 3.2);
      const cragX = sideDir * (pathHalfLimit + 2.8);
      const outerX = sideDir * (pathHalfLimit + 8.5);

      const b1 = createBox(6.0, baseH, 4.5, (sIdx % 2 === 0 ? yellowRock2 : yellowRock3), cragX, baseH / 2 - 0.5, z);
      const b2 = createBox(4.4, baseH + 1.8, 3.8, cliffStone, cragX + sideDir * 0.5, (baseH + 1.8) / 2 - 0.5, z + 0.6);
      const b3 = createBox(10.0, outerH, 4.5, yellowRock1, outerX, outerH / 2 - 1.0, z);
      worldGroup.add(b1, b2, b3);
      wallMeshes.push(b1, b2, b3);
    });
  }
  colliders.push(
    { minX: -halfW - 12, maxX: -pathHalfLimit + 0.05, minZ: summitZ - 4, maxZ: 26.5 },
    { minX: pathHalfLimit - 0.05, maxX: halfW + 12, minZ: summitZ - 4, maxZ: 26.5 }
  );

  function createMountainRockBlock(bx, bz, bw, bd, by, bType, stepIdx, nodeIdx, minClimbY = undefined) {
    if (bType === 'crumble') {
      const basePillarH = Math.max(0.5, by - 1.4);
      worldGroup.add(createBox(bw, basePillarH, bd, yellowRock3, bx, basePillarH / 2, bz));

      const ledgeH = 1.4;
      const ledgeMesh = new THREE.Group();
      const rockBody = createBox(bw, ledgeH, bd, cliffStone, 0, -ledgeH / 2, 0);
      const crackTop = createBox(bw * 0.88, 0.14, bd * 0.82, matVoxel('#b45309', '#451a03'), 0, 0.04, 0, false);
      ledgeMesh.add(rockBody, crackTop);
      ledgeMesh.position.set(bx, by, bz);
      worldGroup.add(ledgeMesh);

      const shatterGroup = new THREE.Group();
      shatterGroup.position.set(bx, by - 0.5, bz);
      shatterGroup.visible = false;
      const pieces = [];
      for (let p = 0; p < 8; p++) {
        const px = ((p % 4) - 1.5) * (bw * 0.22);
        const pz = (Math.floor(p / 4) - 0.5) * (bd * 0.35);
        const piece = createBox(0.95, 0.65, 0.95, cliffStone, px, 0, pz, false);
        shatterGroup.add(piece);
        pieces.push({
          mesh: piece, ox: px, oz: pz,
          vx: px * 1.8 + (Math.random() - 0.5) * 2,
          vy: 2.5 + Math.random() * 2,
          vz: pz * 1.8 + (Math.random() - 0.5) * 2
        });
      }
      worldGroup.add(shatterGroup);

      const platObj = {
        minX: bx - bw / 2, maxX: bx + bw / 2,
        minZ: bz - bd / 2, maxZ: bz + bd / 2,
        topY: by, minClimbY, stepIdx, nodeIdx
      };
      platforms.push(platObj);

      sinaiCrumbles.push({
        mesh: ledgeMesh, shatterGroup, pieces, platRef: platObj,
        basePos: ledgeMesh.position.clone(), baseTopY: by,
        stepIdx, nodeIdx, state: 'idle', timer: 0
      });
      return;
    }

    const isGold = (bType === 'summit');
    const isTrap = (bType === 'snake' || bType === 'lightning' || bType === 'rockfall');
    const mainMat = isGold ? goldStepMat : (isTrap ? cliffStone : yellowRock1);
    const subMat = isTrap ? yellowRock3 : yellowRock2;

    const mainRock = createBox(bw, by, bd, mainMat, bx, by / 2, bz);
    const frontTrim = createBox(bw * 0.92, Math.max(0.8, by - 0.4), 0.35, subMat, bx, (by - 0.4) / 2, bz + bd / 2 + 0.05);
    worldGroup.add(mainRock, frontTrim);

    platforms.push({
      minX: bx - bw / 2, maxX: bx + bw / 2,
      minZ: bz - bd / 2, maxZ: bz + bd / 2,
      topY: by, minClimbY, stepIdx, nodeIdx
    });

    if (bType === 'snake') {
      const snakeGrp = createSinaiSnakeMesh();
      snakeGrp.position.set(bx, by, bz);
      worldGroup.add(snakeGrp);

      const snakeRing = new THREE.Mesh(
        new THREE.RingGeometry(0.85, 1.18, 24),
        new THREE.MeshBasicMaterial({ color: 0x22c55e, side: THREE.DoubleSide, transparent: true, opacity: 0.48 })
      );
      snakeRing.rotation.x = -Math.PI / 2;
      snakeRing.position.set(bx, by + 0.06, bz);
      worldGroup.add(snakeRing);

      sinaiMagmaBlocks.push({
        mesh: snakeGrp, x: bx, y: by, z: bz,
        radius: 1.15, stepIdx, nodeIdx, phase: nodeIdx * 0.9
      });
    } else if (bType === 'lightning' || bType === 'rockfall') {
      const hKind = bType;
      const sqW = bw - 0.18;
      const sqD = bd - 0.18;

      const warnSquareGroup = new THREE.Group();
      warnSquareGroup.position.set(bx, by + 0.05, bz);

      const warnFillMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.26 });
      const warnFill = createBox(sqW, 0.04, sqD, warnFillMat, 0, 0, 0, false);
      warnSquareGroup.add(warnFill);

      const borderMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const bThick = 0.12;
      warnSquareGroup.add(
        createBox(sqW, 0.06, bThick, borderMat, 0, 0.02, -sqD / 2 + bThick / 2, false),
        createBox(sqW, 0.06, bThick, borderMat, 0, 0.02,  sqD / 2 - bThick / 2, false),
        createBox(bThick, 0.06, sqD, borderMat, -sqW / 2 + bThick / 2, 0.02, 0, false),
        createBox(bThick, 0.06, sqD, borderMat,  sqW / 2 - bThick / 2, 0.02, 0, false)
      );

      const activeXGroup = new THREE.Group();
      const diagLen = Math.hypot(sqW, sqD) * 0.88;
      const diagAng = Math.atan2(sqD, sqW);
      const xMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const bar1 = createBox(diagLen, 0.06, 0.16, xMat, 0, 0.03, 0, false);
      bar1.rotation.y = diagAng;
      const bar2 = createBox(diagLen, 0.06, 0.16, xMat, 0, 0.03, 0, false);
      bar2.rotation.y = -diagAng;
      activeXGroup.add(bar1, bar2);
      activeXGroup.visible = false;
      warnSquareGroup.add(activeXGroup);

      worldGroup.add(warnSquareGroup);

      const boltGroup = createZigzagLightningBolt();
      boltGroup.position.set(bx, by + 11, bz);
      boltGroup.visible = false;
      worldGroup.add(boltGroup);

      const rockFallGroup = new THREE.Group();
      const gravelMat = matVoxel('#a8a29e', '#57534e');
      rockFallGroup.add(
        createBox(1.55, 1.55, 1.55, gravelMat, -0.55, 0, -0.3, false),
        createBox(1.25, 1.25, 1.25, yellowRock2, 0.65, 0.45, 0.4, false),
        createBox(1.10, 1.10, 1.10, cliffStone, 0.1, -0.35, 0.3, false)
      );
      rockFallGroup.position.set(bx, by + 13, bz);
      rockFallGroup.visible = false;
      worldGroup.add(rockFallGroup);

      const interval = isSeniorMap ? (hKind === 'rockfall' ? 3.6 : 3.8) : 4.2;
      sinaiHazardZones.push({
        kind: hKind, x: bx, y: by, z: bz,
        halfW: bw / 2 - 0.04,
        halfD: bd / 2 - 0.04,
        stepIdx, nodeIdx,
        timer: Math.random() * (interval * 0.7),
        interval,
        warnRing: warnSquareGroup,
        warnFill,
        activeXGroup,
        boltMesh: boltGroup,
        boltGroup,
        rockFallGroup
      });
    }
  }

  const allObstacleTypes = ['snake', 'lightning', 'rockfall', 'crumble'];
  const isSkyHazard = (t) => (t === 'lightning' || t === 'rockfall');

  function pickNextObstacleType(prevAdjacentType, lastUsedType) {
    const candidates = shuffleArray(allObstacleTypes);
    for (const c of candidates) {
      if (prevAdjacentType && prevAdjacentType !== 'normal') {
        if (c === prevAdjacentType) continue;
        if (isSkyHazard(c) && isSkyHazard(prevAdjacentType)) continue;
      }
      if (c === lastUsedType) continue;
      return c;
    }
    for (const c of candidates) {
      if (c !== prevAdjacentType) return c;
    }
    return candidates[0];
  }

  let lastGlobalObsType = '';

  for (let r = 0; r < totalRows; r++) {
    const stepIdx = r + 1;
    const sz = firstStepZ - r * stepDz;
    const rowBaseY = r * rowRise;
    const goRight = (r % 2 === 0);
    const orderedCols = goRight ? [...colsX] : [...colsX].reverse();

    const entryX = orderedCols[0];
    const entryY = Number((rowBaseY + lateralStepRise).toFixed(2));
    sinaiSafeCheckpoints.push(new THREE.Vector3(entryX, entryY, sz));

    const rowTypes = Array(orderedCols.length).fill('normal');

    if (isKinder) {
      const rSlot = (Math.random() < 0.5) ? 1 : 2;
      rowTypes[rSlot] = 'crumble';
    } else if (isJunior) {
      const juniorPatterns = [
        [1, 3],
        [2]
      ];
      const chosenSlots = juniorPatterns[Math.floor(Math.random() * juniorPatterns.length)];
      chosenSlots.forEach(slotIdx => {
        const picked = pickNextObstacleType('normal', lastGlobalObsType);
        rowTypes[slotIdx] = picked;
        lastGlobalObsType = picked;
      });
    } else if (isTimeAttack) {
      const taPatterns = [
        [1, 3],
        [2, 4],
        [1, 4]
      ];
      const chosenSlots = taPatterns[Math.floor(Math.random() * taPatterns.length)];
      chosenSlots.forEach(slotIdx => {
        const picked = pickNextObstacleType('normal', lastGlobalObsType);
        rowTypes[slotIdx] = picked;
        lastGlobalObsType = picked;
      });
    } else {
      // [소년반(senior) 요청사항] 연속 3개 장애물 금지: 하나 건너 하나씩 나오거나 최대 2개까지만 연달아 나오도록 배치
      const seniorPatterns = [
        [1, 3],       // 하나 건너 하나씩 (징검다리)
        [2, 4],       // 하나 건너 하나씩 (징검다리)
        [1, 4],       // 양끝 배치
        [1, 2, 4],    // 2개 연속 + 1칸 건너 1개
        [1, 3, 4],    // 1개 + 1칸 건너 2개 연속
        [1, 2],       // 2개 연속
        [2, 3],       // 2개 연속
        [3, 4]        // 2개 연속
      ];
      const chosenSlots = seniorPatterns[Math.floor(Math.random() * seniorPatterns.length)];
      chosenSlots.forEach(slotIdx => {
        const prevAdj = rowTypes[slotIdx - 1];
        const picked = pickNextObstacleType(prevAdj, lastGlobalObsType);
        rowTypes[slotIdx] = picked;
        lastGlobalObsType = picked;
      });
    }

    let waterPouchCol = -1;
    if (isTimeAttack) {
      const normalCols = [];
      for (let k = 1; k < orderedCols.length; k++) {
        if (rowTypes[k] === 'normal') normalCols.push(k);
      }
      waterPouchCol = normalCols.length > 0
        ? normalCols[Math.floor(Math.random() * normalCols.length)]
        : 0;
    }

    orderedCols.forEach((cx, k) => {
      const rockY = Number((rowBaseY + (k + 1) * lateralStepRise).toFixed(2));
      const nodeIdx = sinaiStepNodes.length;
      sinaiStepNodes.push({ x: cx, y: rockY, z: sz, stepIdx, nodeIdx });

      const blockMinClimbY = (r === 0 && k === 0) ? -0.5 : Number((rockY - lateralStepRise - 0.35).toFixed(2));
      const bType = rowTypes[k];

      createMountainRockBlock(cx, sz, colW, 4.56, rockY, bType, stepIdx, nodeIdx, blockMinClimbY);

      if (k === waterPouchCol) {
        spawnSinaiWaterPouchItem(cx, rockY, sz);
      }
    });
  }

  // 맨 꼭대기 정상 제단 층
  const summitNodeIdx = sinaiStepNodes.length;
  sinaiSafeCheckpoints.push(new THREE.Vector3(0, summitY, summitZ));
  sinaiStepNodes.push({ x: 0, y: summitY, z: summitZ, stepIdx: totalRows + 1, nodeIdx: summitNodeIdx });
  const summitMinClimbY = Number((totalRows * rowRise - 0.35).toFixed(2));
  createMountainRockBlock(0, summitZ, pathHalfLimit * 2, 10.5, summitY, 'summit', totalRows + 1, summitNodeIdx, summitMinClimbY);

  // 각 층 바위 바로 위에서 좌우로 움직이는 등반로 구름 (정상 바로 앞 줄은 십계명 시야 확보를 위해 제외)
  const cloudRowStep = isKinder ? 2 : 1;
  for (let r = 0; r < totalRows - 1; r += cloudRowStep) {
    const sz = firstStepZ - r * stepDz;
    const rowTopRockY = (r + 1) * rowRise;
    const cy = rowTopRockY + 1.35;
    const cz = sz + 0.35;
    const cScale = isSeniorMap ? 0.92 : 0.82;
    const cGrp = createFluffyCloudGroup(cScale, true);
    const startX = (r % 2 === 0 ? -1 : 1) * (pathHalfLimit * 0.45);
    cGrp.position.set(startX, cy, cz);
    worldGroup.add(cGrp);
    sinaiCloudLayers.push({
      group: cGrp,
      baseX: 0,
      baseY: cy,
      ampX: pathHalfLimit - 2.6,
      speed: (isSeniorMap ? 1.85 : 1.35) + (r % 3) * 0.3,
      phase: r * 1.4
    });
  }

  // 정상 뒤편 구름을 정상 바위 아래 칸(belowSummitY) 높이부터 채워 십계명이 가려지지 않게 구성
  const belowSummitY = summitY - rowRise;
  const seaOfCloudsGroup = new THREE.Group();
  const cloudSeaBaseMat = new THREE.MeshLambertMaterial({ color: 0xe0f2fe });
  const cloudSeaTopMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  seaOfCloudsGroup.add(
    createBox(190, 5.0, 96, cloudSeaBaseMat, 0, belowSummitY - 6.0, summitZ - 52, false),
    createBox(170, 3.8, 84, cloudSeaTopMat, 0, belowSummitY - 3.4, summitZ - 47, false)
  );
  for (let cz = summitZ - 11; cz >= summitZ - 76; cz -= 9.5) {
    for (let cx = -56; cx <= 56; cx += 14) {
      const jitterX = ((Math.abs(Math.round(cx + cz)) % 5) - 2) * 1.8;
      const jitterZ = ((Math.abs(Math.round(cx * 2 - cz)) % 5) - 2) * 1.2;
      const sc = 1.45 + (Math.abs(Math.round(cx + cz)) % 4) * 0.28;
      const clMound = createFluffyCloudGroup(sc, false);
      const moundY = belowSummitY - 2.2 + ((Math.abs(Math.round(cx * 3 + cz)) % 3) * 0.45);
      clMound.position.set(cx + jitterX, moundY, cz + jitterZ);
      seaOfCloudsGroup.add(clMound);
    }
  }
  worldGroup.add(seaOfCloudsGroup);

  // 계단 및 대기 중인 백성들 쪽(남쪽 하늘)에 떠 있는 구름들
  const southSkyClouds = [
    [-26, summitY * 0.45 + 10, 18, 1.15],
    [ 27, summitY * 0.50 + 11, 14, 1.20],
    [-29, summitY * 0.65 + 9,   2, 1.25],
    [ 28, summitY * 0.70 + 10, -4, 1.15],
    [-25, summitY * 0.85 + 8, -16, 1.30],
    [ 26, summitY * 0.90 + 9, -20, 1.25],
    [-32, 22, 34, 1.25],
    [ 32, 24, 36, 1.20],
    [-16, 27, 44, 1.10],
    [ 18, 26, 46, 1.15],
    [  0, 30, 52, 1.35],
    [-36, 25, 48, 1.15],
    [ 36, 26, 50, 1.20],
    [-24, summitY + 11, summitZ - 26, 1.30],
    [ 24, summitY + 12, summitZ - 24, 1.25],
    [  0, summitY + 15, summitZ - 34, 1.40]
  ];
  southSkyClouds.forEach(([cx, cy, cz, sc]) => {
    const skyCloud = createFluffyCloudGroup(sc, false);
    skyCloud.position.set(cx, cy, cz);
    worldGroup.add(skyCloud);
  });

  sinaiCutscene.summitY = summitY;
  sinaiCutscene.summitZ = summitZ;

  const altarBase = createBox(4.6, 0.9, 3.4, goldStepMat, 0, summitY + 0.45, summitZ);
  worldGroup.add(altarBase);

  // 제단 주변 장식 구름도 정상 바위 아래 칸 높이로 배치하여 십계명 돌판 시야 확보
  [
    [-7.2, -rowRise - 0.8, -6.5, 0.55],
    [ 7.2, -rowRise - 0.8, -6.5, 0.55],
    [-4.8, -rowRise - 0.6, -8.2, 0.60],
    [ 4.8, -rowRise - 0.6, -8.2, 0.60],
    [ 0.0, -rowRise - 0.5, -9.0, 0.65]
  ].forEach(([cx, cy, cz, sc]) => {
    const altarCloud = createFluffyCloudGroup(sc, true);
    altarCloud.position.set(cx, summitY + cy, summitZ + cz);
    worldGroup.add(altarCloud);
  });

  const tabletsGrp = new THREE.Group();
  const stoneTabletMat = matVoxel('#94a3b8', '#64748b');
  const stoneEngraveMat = matVoxel('#475569');
  const tabletL = createBox(1.05, 1.55, 0.26, stoneTabletMat, -0.58, 0.9, 0);
  const tabletR = createBox(1.05, 1.55, 0.26, stoneTabletMat, 0.58, 0.9, 0);
  const lineL1 = createBox(0.72, 0.12, 0.29, stoneEngraveMat, -0.58, 1.2, 0, false);
  const lineL2 = createBox(0.72, 0.12, 0.29, stoneEngraveMat, -0.58, 0.85, 0, false);
  const lineR1 = createBox(0.72, 0.12, 0.29, stoneEngraveMat, 0.58, 1.2, 0, false);
  const lineR2 = createBox(0.72, 0.12, 0.29, stoneEngraveMat, 0.58, 0.85, 0, false);

  const tabRing = new THREE.Mesh(
    new THREE.RingGeometry(1.6, 2.2, 24),
    new THREE.MeshBasicMaterial({ color: 0xfef08a, side: THREE.DoubleSide })
  );
  tabRing.rotation.x = -Math.PI / 2;
  tabRing.position.y = 0.08;
  tabletsGrp.add(tabletL, tabletR, lineL1, lineL2, lineR1, lineR2, tabRing);
  tabletsGrp.position.set(0, summitY + 0.9, summitZ);
  worldGroup.add(tabletsGrp);
  sinaiCutscene.tabletsMesh = tabletsGrp;

  const sparkColors = [0xffffff, 0xfef08a, 0xfde047, 0xe0f2fe];
  for (let s = 0; s < 28; s++) {
    const spMat = new THREE.MeshBasicMaterial({ color: sparkColors[s % sparkColors.length], transparent: true, opacity: 0.9 });
    const sz = 0.22 + (s % 3) * 0.12;
    const spMesh = createBox(sz, sz, sz, spMat, 0, summitY + 2.0, summitZ, false);
    const ang = (s / 28) * Math.PI * 2;
    const rad = 1.2 + (s % 4) * 0.85;
    const baseY = summitY + 0.8 + (s % 5) * 0.75;
    spMesh.position.set(Math.cos(ang) * rad, baseY, summitZ + Math.sin(ang) * rad);
    worldGroup.add(spMesh);
    summitSparkles.push({ mesh: spMesh, ang, rad, baseY, phase: s * 0.6 });
  }

  const beamMat = new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.38 });
  const innerBeamMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.82 });
  const beamMesh = createBox(5.6, 38, 5.6, beamMat, 0, summitY + 19, summitZ, false);
  const innerBeamMesh = createBox(2.6, 38, 2.6, innerBeamMat, 0, summitY + 19, summitZ, false);
  beamMesh.visible = false;
  innerBeamMesh.visible = false;
  worldGroup.add(beamMesh, innerBeamMesh);
  sinaiCutscene.beamMesh = beamMesh;
  sinaiCutscene.innerBeamMesh = innerBeamMesh;

  targetObject = {
    type: 'ten_commandments',
    pos: new THREE.Vector3(0, summitY + 1.0, summitZ),
    label: createWorldLabel('✨ 시내산 정상 빛의 제단 (십계명 돌판 받기!)'),
    triggered: false
  };

  playerPos.set(0, 0, 29);
  lastGroundedY = 0;
  playerVelY = 0; isGrounded = true; playerFacing = Math.PI; cameraYaw = 0; cameraTargetYaw = 0;
  if (guideArrowGroup) guideArrowGroup.visible = (currentMode !== 'senior');
  snapCameraToPlayer();
  updateStageHUD();
  showToast('⛰️ 앞쪽 위층은 높아서 바로 못 올라가요! 옆으로 점프해 계단 바위를 따라 올라가세요!');
}

function updateStage3Sinai(dt, now) {
  sinaiWaitingPeople.forEach(p => {
    const wave = Math.sin(now * 0.008 + p.phase) * 0.45;
    p.mesh.userData.lArm.rotation.x = -2.2 + wave;
    p.mesh.userData.rArm.rotation.x = -2.2 - wave;
  });

  summitSparkles.forEach(sp => {
    const curAng = sp.ang + now * 0.0025;
    sp.mesh.position.x = Math.cos(curAng) * sp.rad;
    sp.mesh.position.z = sinaiCutscene.summitZ + Math.sin(curAng) * sp.rad;
    sp.mesh.position.y = sp.baseY + Math.sin(now * 0.006 + sp.phase) * 0.35;
    const sc = 0.4 + Math.abs(Math.sin(now * 0.015 + sp.phase)) * 1.15;
    sp.mesh.scale.set(sc, sc, sc);
    sp.mesh.rotation.y += dt * 4;
    sp.mesh.rotation.x += dt * 3;
  });

  // 타임어택 물주머니 획득 시 +5초 연장
  sinaiClocks.forEach(ck => {
    if (ck.collected) return;
    ck.group.rotation.y += dt * 2.4;
    const d = Math.hypot(playerPos.x - ck.pos.x, playerPos.z - ck.pos.z);
    updateWorldLabelPos(ck.label, ck.pos, d < 22);
    if (d < 2.0 && Math.abs(playerPos.y - ck.pos.y) < 1.8) {
      ck.collected = true;
      ck.group.visible = false;
      ck.label.style.opacity = '0';
      timeRemaining += 5.0;
      playSfx('clock');
      showToast('💧 시원한 물주머니 획득! 제한 시간이 +5초 연장되었어요!');
    }
  });

  sinaiSafeCheckpoints.forEach(cp => {
    if (Math.hypot(playerPos.x - cp.x, playerPos.z - cp.z) < 4.5 && Math.abs(playerPos.y - cp.y) < 0.8) {
      if (cp.y > sinaiLastCheckpoint.y) {
        sinaiLastCheckpoint.copy(cp);
      }
    }
  });

  sinaiCrumbles.forEach(cr => {
    const inXZ = playerPos.x > cr.platRef.minX && playerPos.x < cr.platRef.maxX &&
                 playerPos.z > cr.platRef.minZ && playerPos.z < cr.platRef.maxZ;
    const onPlat = isGrounded && inXZ && Math.abs(playerPos.y - cr.baseTopY) < 0.45;

    if (cr.state === 'idle' && onPlat) {
      cr.state = 'shaking';
      cr.timer = 0;
      playSfx('crumble');
    } else if (cr.state === 'shaking') {
      cr.timer += dt;
      cr.mesh.position.x = cr.basePos.x + Math.sin(now * 0.09) * 0.16;
      if (cr.timer >= 0.85) {
        cr.state = 'shattering';
        cr.timer = 0;
        cr.mesh.position.x = cr.basePos.x;
        cr.mesh.visible = false;
        cr.platRef.topY = -999;
        cr.shatterGroup.visible = true;
        cr.pieces.forEach(p => {
          p.mesh.position.set(p.ox, 0, p.oz);
          p.mesh.scale.set(1, 1, 1);
        });
        playSfx('crumble');

        if (onPlat || (inXZ && Math.abs(playerPos.y - cr.baseTopY) < 1.2)) {
          triggerDamageFlash();
          relocateSinaiPlayerOnHit(cr.stepIdx, cr.nodeIdx, '💥 바위가 부서져 무너졌어요!');
        }
      }
    } else if (cr.state === 'shattering') {
      cr.timer += dt;
      cr.pieces.forEach(p => {
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += (p.vy - 18 * cr.timer) * dt;
        p.mesh.position.z += p.vz * dt;
        p.mesh.rotation.x += dt * 8;
        p.mesh.rotation.z += dt * 6;
        const s = Math.max(0.05, 1 - cr.timer * 1.8);
        p.mesh.scale.set(s, s, s);
      });
      if (inXZ && playerPos.y < cr.baseTopY - 0.25 && playerPos.y > cr.baseTopY - 2.5) {
        triggerDamageFlash();
        relocateSinaiPlayerOnHit(cr.stepIdx, cr.nodeIdx, '💥 무너진 바위 틈으로 떨어져');
      }
      if (cr.timer >= 0.55) {
        cr.state = 'gone';
        cr.timer = 0;
        cr.shatterGroup.visible = false;
      }
    } else if (cr.state === 'gone') {
      cr.timer += dt;
      if (inXZ && playerPos.y < cr.baseTopY - 0.25 && playerPos.y > cr.baseTopY - 2.5) {
        triggerDamageFlash();
        relocateSinaiPlayerOnHit(cr.stepIdx, cr.nodeIdx, '💥 사라진 바위 자리로 발을 헛디뎌');
      }
      if (cr.timer >= 2.0) {
        cr.state = 'idle';
        cr.mesh.visible = true;
        cr.mesh.position.copy(cr.basePos);
        cr.platRef.topY = cr.baseTopY;
      }
    }
  });

  sinaiMagmaBlocks.forEach(mb => {
    const sway = Math.sin(now * 0.007 + (mb.phase || 0));
    mb.mesh.rotation.y = sway * 0.35;
    if (mb.mesh.userData && mb.mesh.userData.tongue) {
      mb.mesh.userData.tongue.scale.z = 0.6 + Math.abs(Math.sin(now * 0.025 + (mb.phase || 0))) * 0.8;
    }
    const hitRad = mb.radius || 1.15;
    if (Math.hypot(playerPos.x - mb.x, playerPos.z - mb.z) < hitRad && Math.abs(playerPos.y - mb.y) < 0.85) {
      triggerDamageFlash();
      playSfx('hit');
      relocateSinaiPlayerOnHit(mb.stepIdx, mb.nodeIdx, '🐍 광야 독사에게 물려');
    }
  });

  const tSec = now * 0.001;
  sinaiCloudLayers.forEach(cl => {
    cl.group.position.x = cl.baseX + Math.sin(tSec * (cl.speed || 1.5) + cl.phase) * (cl.ampX || 6.5);
    if (cl.baseY !== undefined) {
      cl.group.position.y = cl.baseY + Math.cos(tSec * 2.2 + cl.phase) * 0.16;
    }
  });

  sinaiHazardZones.forEach(hz => {
    hz.timer += dt;
    const isRockFall = (hz.kind === 'rockfall');
    const motionDuration = 1.5;
    const remain = hz.interval - hz.timer;

    if (remain <= motionDuration && remain > 0) {
      if (hz.warnFill) {
        hz.warnFill.material.opacity = 0.55 + Math.abs(Math.sin(now * 0.04)) * 0.35;
        hz.warnFill.material.color.setHex(0xef4444);
      }
      if (hz.activeXGroup) hz.activeXGroup.visible = true;

      const dropProg = 1 - (remain / motionDuration);

      if (isRockFall) {
        hz.rockFallGroup.visible = true;
        hz.rockFallGroup.position.y = hz.y + 12.5 * (1 - dropProg);
        hz.rockFallGroup.rotation.x += dt * 8;
        hz.rockFallGroup.rotation.z += dt * 5;
      } else {
        hz.boltGroup.visible = true;
        hz.boltGroup.position.y = hz.y + 10.5 * (1 - dropProg);
        hz.boltGroup.rotation.y = Math.sin(now * 0.06) * 0.25;
      }

      if (!hz._sfxPlayed) {
        hz._sfxPlayed = true;
        if (Math.abs(playerPos.y - hz.y) < 8) {
          playSfx(isRockFall ? 'crumble' : 'thunder');
        }
      }

      const inSquareZone = Math.abs(playerPos.x - hz.x) < hz.halfW &&
                           Math.abs(playerPos.z - hz.z) < hz.halfD &&
                           Math.abs(playerPos.y - hz.y) < 1.25;
      if (inSquareZone && (!hz._hitTriggered || now - hz._hitTriggered > 900)) {
        hz._hitTriggered = now;
        triggerDamageFlash();
        playSfx('hit');
        relocateSinaiPlayerOnHit(
          hz.stepIdx,
          hz.nodeIdx,
          isRockFall ? '🪨 떨어지는 낙석 구역에 닿아' : '⚡ 내리치는 번개 구역에 닿아'
        );
      }
    } else {
      if (hz.warnFill) {
        hz.warnFill.material.opacity = 0.24;
        hz.warnFill.material.color.setHex(0xfacc15);
      }
      if (hz.activeXGroup) hz.activeXGroup.visible = false;
      hz.boltGroup.visible = false;
      hz.rockFallGroup.visible = false;
    }

    if (hz.timer >= hz.interval) {
      hz.timer = 0;
      hz._sfxPlayed = false;
      hz._hitTriggered = 0;
    }
  });

  if (playerPos.z < 26.2) {
    for (const p of platforms) {
      if (p.topY < 0) continue;
      if (playerPos.x >= p.minX && playerPos.x <= p.maxX && playerPos.z >= p.minZ && playerPos.z <= p.maxZ) {
        if (playerPos.y < p.topY - 0.45) {
          if (p.topY - lastGroundedY <= 1.35) {
            playerPos.y = p.topY;
            lastGroundedY = p.topY;
            playerVelY = 0;
            isGrounded = true;
          } else {
            playSfx('hit');
            relocateSinaiPlayerOnHit(p.stepIdx || 1, p.nodeIdx || 1, '⛰️ 발을 헛디뎌');
          }
        }
        break;
      }
    }
  }

  if (sinaiCutscene.tabletsMesh) {
    sinaiCutscene.tabletsMesh.rotation.y += dt * 1.8;
  }

  const pct = Math.min(100, Math.max(0, Math.round((playerPos.y / sinaiCutscene.summitY) * 100)));
  document.getElementById('hud-counter-text').textContent = `등반 ${pct}%`;
}

// -------------------------------------------------------------------------
// 5. 다리 분할 건설 & 나무 도끼질, 컷신 프레임 및 스테이지 프레임 업데이트
// -------------------------------------------------------------------------
function triggerPuzzleBuildOrSwitch() {
  if (!activeBuildTarget) return;

  if (activeBuildTarget.kind === 'chop') {
    performTreeChop(activeBuildTarget.ref);
    return;
  }

  if (activeBuildTarget.kind === 'build') {
    const bz = activeBuildTarget.ref;
    if (bz.built) return;
    const placed = bz.placedBlocks || 0, needed = bz.reqBlocks - placed;
    if (heldBlocks <= 0) {
      playSfx('wrong');
      showToast(`🪵 통나무가 없어요! 주변에서 통나무를 모아오세요! (남은 필요: ${needed}개)`);
      return;
    }
    const deposit = Math.min(heldBlocks, needed);
    heldBlocks -= deposit;
    bz.placedBlocks = placed + deposit;
    if (typeof bz.rebuildBridgeMesh === 'function') bz.rebuildBridgeMesh();

    playSfx('hammer');
    hammerAnimTimer = 1.25;
    hammerTargetPos = bz.pos.clone();

    if (bz.placedBlocks >= bz.reqBlocks) {
      bz.built = true; bz.bpGroup.visible = false; bz.solidGroup.visible = true; bz.label.style.opacity = '0';
      if (bz.colliderRef) { bz.colliderRef.minX = 9999; bz.colliderRef.maxX = 9999; }
      if (currentMode === 'timeattack') {
        timeRemaining += 2.0;
        showToast(`🌉 ${bz.title} 100% 완성! (+2초 시간 연장!)`);
      } else {
        showToast(`🔨 뚝딱뚝딱! ${bz.title}가 완전히 이어졌어요! 건너가세요!`);
      }
    } else {
      const remain = bz.reqBlocks - bz.placedBlocks;
      bz.label.innerHTML = `🪵 ${bz.title} (${bz.placedBlocks}/${bz.reqBlocks}개 시공됨 · ${remain}개 더 필요)`;
      if (currentMode === 'timeattack') {
        timeRemaining += 2.0;
        showToast(`🔨 다리 시공! (+2초 시간 연장! 남은 통나무 ${remain}개)`);
      } else {
        showToast(`🔨 백성들이 망치질로 다리 일부(${bz.placedBlocks}/${bz.reqBlocks})를 지었어요!`);
      }
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
      seaPartingCutscene.active = false;
      if (playerLimbs.rArm) playerLimbs.rArm.rotation.x = 0;
      currentStage = 2;
      buildExodusStage2World();
      startStageBgm(2);
    }
    return true;
  }

  if (pillarCutscene.active) {
    pillarCutscene.timer += dt;
    const t = pillarCutscene.timer;
    const southZ = exodusStage2SlopeMeta ? exodusStage2SlopeMeta.southZ : 135;
    const northZ = exodusStage2SlopeMeta ? exodusStage2SlopeMeta.northZ : -135;

    flowingWaterTextures.forEach(tex => {
      tex.offset.x = (tex.offset.x + dt * 1.35) % 1;
      tex.offset.y = Math.sin(now * 0.008) * 0.18;
    });

    seaClosingWaves.forEach((w) => {
      const surge = Math.sin(now * 0.012 + w.phase);
      w.mesh1.position.y = w.baseY + surge * 0.85;
      w.mesh2.position.y = w.baseY + 0.25 + Math.cos(now * 0.015 + w.phase) * 1.05;
      w.mesh2.rotation.z = surge * 0.22;
    });

    camera.position.lerp(new THREE.Vector3(0, 26.5, northZ + 10.0), 0.09);
    camera.lookAt(0, 14.0, southZ + 35.0);

    const mergeProg = Math.min(1, t / 2.1);
    const easeMerge = mergeProg * mergeProg;
    if (pillarCutscene.leftClosingWall && pillarCutscene.rightClosingWall) {
      pillarCutscene.leftClosingWall.visible = true;
      pillarCutscene.rightClosingWall.visible = true;
      pillarCutscene.leftClosingWall.position.x = THREE.MathUtils.lerp(-25.5, -8.8, easeMerge);
      pillarCutscene.rightClosingWall.position.x = THREE.MathUtils.lerp(25.5, 8.8, easeMerge);
    }

    if (mergeProg > 0.45) {
      egyptianSoldiers.forEach(s => { s.mesh.position.y -= dt * 6.5; });
    }

    if (t >= 1.8 && pillarCutscene.phase === 1) {
      pillarCutscene.phase = 2;
      showToast('🌊 거센 파도와 함께 양쪽 바닷물이 다시 합쳐져 바닷길을 덮었습니다! (출 14:27)');
    }
    if (t >= 3.6) {
      pillarCutscene.active = false;
      openStageClearModal(2);
    }
    return true;
  }

  if (sinaiCutscene.active) {
    sinaiCutscene.timer += dt;
    const t = sinaiCutscene.timer;
    const sy = sinaiCutscene.summitY, sz = sinaiCutscene.summitZ;

    if (t > 0.45) {
      const wf = document.getElementById('white-fade');
      if (wf && wf.style.opacity !== '0') wf.style.opacity = '0';
    }

    summitSparkles.forEach(sp => {
      const curAng = sp.ang + now * 0.008;
      const closeRad = Math.max(0.8, sp.rad * (1 - Math.min(0.65, t * 0.2)));
      sp.mesh.position.x = Math.cos(curAng) * closeRad;
      sp.mesh.position.z = sz + 0.8 + Math.sin(curAng) * closeRad;
      sp.mesh.position.y = sy + 1.0 + ((sp.baseY - sy + t * 2.5) % 4.5);
      sp.mesh.scale.set(1.6, 1.6, 1.6);
    });

    if (sinaiCutscene.tabletsMesh) {
      sinaiCutscene.tabletsMesh.position.z = THREE.MathUtils.lerp(sz, sz + 1.1, Math.min(1, t / 2.2));
      sinaiCutscene.tabletsMesh.position.y = sy + 2.3 + Math.sin(now * 0.008) * 0.15;
      sinaiCutscene.tabletsMesh.rotation.y = Math.sin(t * 2.0) * 0.25;
    }

    if (sinaiCutscene.beamMesh && sinaiCutscene.innerBeamMesh) {
      const bPulse = 1.15 + Math.sin(now * 0.02) * 0.25;
      sinaiCutscene.beamMesh.scale.set(bPulse, 1, bPulse);
      sinaiCutscene.innerBeamMesh.rotation.y += dt * 3.5;
    }

    const camAngle = Math.sin(t * 0.5) * 2.5;
    camera.position.lerp(new THREE.Vector3(camAngle, sy + 4.2, sz + 7.2), 0.1);
    camera.lookAt(0, sy + 2.0, sz + 0.8);

    if (t >= 3.5) {
      sinaiCutscene.active = false;
      const wf = document.getElementById('white-fade');
      if (wf) wf.style.opacity = '0';
      if (playerLimbs.lArm) playerLimbs.lArm.rotation.x = 0;
      if (playerLimbs.rArm) playerLimbs.rArm.rotation.x = 0;
      openStageClearModal(3);
    }
    return true;
  }

  if (currentStage === 2 && stage2CountdownActive) {
    updateStage2Speedrun(dt, now);
    snapCameraToPlayer();
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

  if (currentStage === 3) {
    updateStage3Sinai(dt, now);
  }

  if (currentStage === 1 || currentStage === 2) {
    let nextGuideTarget = null;
    collectibleBlocks.forEach(cb => {
      if (cb.collected) return;

      if (cb.rolling && cb.bounds) {
        let nx = cb.group.position.x + cb.vx * dt;
        let nz = cb.group.position.z + cb.vz * dt;
        if (nx < cb.bounds.minX || nx > cb.bounds.maxX || !isSpawnSpotClear(nx, cb.group.position.z, 1.1)) {
          cb.vx = -cb.vx;
          nx = cb.group.position.x + cb.vx * dt;
        }
        if (nz < cb.bounds.minZ || nz > cb.bounds.maxZ || !isSpawnSpotClear(cb.group.position.x, nz, 1.1)) {
          cb.vz = -cb.vz;
          nz = cb.group.position.z + cb.vz * dt;
        }
        if (Math.random() < 0.015) {
          const rAng = Math.random() * Math.PI * 2;
          const spd = Math.hypot(cb.vx, cb.vz);
          cb.vx = Math.cos(rAng) * spd;
          cb.vz = Math.sin(rAng) * spd;
        }
        const by = getBaseGroundHeight(nx, nz);
        cb.group.position.set(nx, by, nz);
        cb.pos.set(nx, by + 0.5, nz);
        cb.boxMesh.rotation.x += dt * 4.5;
        cb.boxMesh.rotation.z += dt * 3.2;
      } else {
        cb.boxMesh.rotation.y += dt * 2.2;
        cb.boxMesh.position.y = 0.65 + Math.sin(now * 0.006 + cb.pos.x) * 0.16;
      }

      const d = Math.hypot(playerPos.x - cb.pos.x, playerPos.z - cb.pos.z);
      updateWorldLabelPos(cb.label, cb.pos, d < 28);
      if (d < 2.25) {
        if (currentStage === 1 && heldBlocks >= EXODUS_STAGE1_MAX_CARRY) {
          if (!cb.warnedAt || now - cb.warnedAt > 1800) {
            cb.warnedAt = now; playSfx('wrong');
            showToast(`🪵 통나무는 최대 ${EXODUS_STAGE1_MAX_CARRY}개까지만 지닐 수 있어요! 다리에 먼저 놓아주세요!`);
          }
          return;
        }
        cb.collected = true; cb.group.visible = false; cb.label.style.opacity = '0';
        heldBlocks++; updateCarriedBlocksVisual(); playSfx('rescue');
        if (currentMode === 'timeattack') {
          timeRemaining += 5.0;
          showToast(`🪵 통나무 획득! (보유 ${heldBlocks}개 · +5초 시간 연장!)`);
        } else {
          showToast(`🪵 통나무 건축물을 주웠어요! (현재 보유: ${heldBlocks}/${EXODUS_STAGE1_MAX_CARRY}개)`);
        }
      }
    });

    activeBuildTarget = null;

    choppingTrees.forEach(tr => {
      if (tr.chopped) {
        if (tr.fallTimer > 0 && tr.fallTimer < 1.0) {
          tr.fallTimer += dt * 2.8;
          tr.treePivot.rotation.z = Math.min(1, tr.fallTimer) * (Math.PI / 2);
          if (tr.fallTimer >= 1.0) tr.group.visible = false;
        }
        return;
      }
      if (tr.shakeTimer > 0) {
        tr.shakeTimer -= dt;
        tr.treePivot.rotation.z = Math.sin(now * 0.08) * 0.16;
      } else {
        tr.treePivot.rotation.z = 0;
      }
      if (tr.autoChopCooldown > 0) tr.autoChopCooldown -= dt;

      const d = Math.hypot(playerPos.x - tr.pos.x, playerPos.z - tr.pos.z);
      updateWorldLabelPos(tr.label, tr.pos, d < 28);
      if (d < 3.4) {
        activeBuildTarget = { kind: 'chop', ref: tr };
        if (d < 2.25 && tr.autoChopCooldown <= 0 && heldBlocks < EXODUS_STAGE1_MAX_CARRY) {
          tr.autoChopCooldown = 0.52;
          performTreeChop(tr);
        }
      }
    });

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
      if (activeBuildTarget.kind === 'chop') {
        const tr = activeBuildTarget.ref;
        pBtn.textContent = `🪓 나무 도끼질하기! (${tr.hits}/${tr.reqHits}회)`;
      } else {
        const bz = activeBuildTarget.ref, remain = bz.reqBlocks - (bz.placedBlocks || 0);
        pBtn.textContent = heldBlocks > 0 ? `🔨 ${bz.title} 통나무 놓기! (남은 필요 ${remain}개)` : `🪵 통나무 필요 (남은 수량 ${remain}개)`;
      }
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
        choppingTrees.forEach(tr => {
          if (!tr.chopped) {
            const td = Math.hypot(playerPos.x - tr.pos.x, playerPos.z - tr.pos.z);
            if (td < minBD) { minBD = td; nearB = tr.pos; }
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
        ctxBtn.textContent = currentStage === 1 ? '🌊 지팡이 들어 홍해 가르기!' : '🌊 바닷물 합쳐 애굽 군대 막기!';
        if (td < 2.8) triggerContextAction();
      } else ctxBtn.classList.add('hidden');
    }
  }

  if (currentStage === 3 && targetObject && !targetObject.triggered) {
    const td = Math.hypot(playerPos.x - targetObject.pos.x, playerPos.z - targetObject.pos.z);
    updateWorldLabelPos(targetObject.label, targetObject.pos, td < 36);

    if (guideArrowGroup && guideArrowGroup.visible) {
      let nextStepTarget = targetObject.pos;
      for (let i = 1; i < sinaiStepNodes.length; i++) {
        if (sinaiStepNodes[i].y > lastGroundedY + 0.15) {
          nextStepTarget = sinaiStepNodes[i];
          break;
        }
      }
      guideArrowGroup.rotation.y = Math.atan2(nextStepTarget.x - playerPos.x, nextStepTarget.z - playerPos.z) - playerFacing;
    }

    const ctxBtn = document.getElementById('context-action-btn');
    if (td < 4.2 && Math.abs(playerPos.y - targetObject.pos.y) < 3.2) {
      ctxBtn.classList.remove('hidden');
      ctxBtn.textContent = '✨ 빛 가운데 십계명 돌판 받기!';
      if (td < 2.8) triggerContextAction();
    } else {
      ctxBtn.classList.add('hidden');
    }
  }
}
