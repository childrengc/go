// =========================================================================
// [ep3_david_st3_end.js - 전반부 (1/2)] 에피소드 3 : 스테이지 3 (다윗성 월드·건물 벽 질감·랜덤 자원)
// - ep3_david_base.js의 전역 상태 변수를 공유하며 중복 카메라 시점 훅 제거 완료
// - 건물 외벽 석조·회벽 캔버스 텍스처(makeDavidBuildingWallTex) 및 처마 서까래·입체 창틀 적용
// - 퀘스트 완료로 지어진 건물(상가·새 집) 관통 방지 충돌 활성화(lockCompletedQuestBuilding)
// - 좌측 상단 초소형 퀘스트 배지, 퀘스트 수락 시 자원 0 초기화, 난이도별 랜덤 자원 스폰
// =========================================================================

// -------------------------------------------------------------------------
// 1. 진행 중인 퀘스트 초소형 코너 배지 UI (좌측 상단 구석 배치)
// -------------------------------------------------------------------------
function ensureDavidStage3QuestTrackerUI() {
  const uiRoot = ensureDavidCustomUI();
  let tracker = document.getElementById('david-st3-quest-tracker');
  if (!tracker) {
    tracker = document.createElement('div');
    tracker.id = 'david-st3-quest-tracker';
    tracker.className =
      'hidden fixed top-20 left-3 z-20 px-2.5 py-1.5 rounded-xl bg-slate-900/75 backdrop-blur-sm border border-amber-400/80 text-white shadow-md flex flex-col gap-0.5 pointer-events-none';
    tracker.innerHTML = `
      <div class="flex items-center gap-1.5">
        <span id="david-st3-quest-title" class="text-[11px] font-jua text-amber-300 leading-none">📜 퀘스트</span>
      </div>
      <div id="david-st3-quest-reqs" class="text-[11px] font-bold text-emerald-300 leading-tight"></div>
    `;
    uiRoot.appendChild(tracker);
  }
  return tracker;
}

function updateDavidStage3QuestTrackerUI() {
  const tracker = ensureDavidStage3QuestTrackerUI();
  if (
    currentEpisode !== 'david' ||
    currentStage !== 3 ||
    !davidCurrentActiveQuestNpc ||
    davidCurrentActiveQuestNpc.completed
  ) {
    tracker.classList.add('hidden');
    return;
  }

  const npc = davidCurrentActiveQuestNpc;
  tracker.classList.remove('hidden');

  const titleEl = document.getElementById('david-st3-quest-title');
  const reqsEl = document.getElementById('david-st3-quest-reqs');

  if (titleEl) titleEl.textContent = `📜 ${npc.roleTitle}`;

  if (npc.req && reqsEl) {
    const parts = [];
    if (npc.req.wood > 0) {
      const wDone = davidInventory.wood >= npc.req.wood;
      parts.push(`<span class="${wDone ? 'text-emerald-300' : 'text-amber-200'}">🪵${Math.min(davidInventory.wood, npc.req.wood)}/${npc.req.wood}</span>`);
    }
    if (npc.req.stone > 0) {
      const sDone = davidInventory.stone >= npc.req.stone;
      parts.push(`<span class="${sDone ? 'text-emerald-300' : 'text-sky-200'}">🪨${Math.min(davidInventory.stone, npc.req.stone)}/${npc.req.stone}</span>`);
    }
    if (npc.req.iron > 0) {
      const iDone = davidInventory.iron >= npc.req.iron;
      parts.push(`<span class="${iDone ? 'text-emerald-300' : 'text-orange-200'}">⚙️${Math.min(davidInventory.iron, npc.req.iron)}/${npc.req.iron}</span>`);
    }

    const allMet =
      davidInventory.wood >= npc.req.wood &&
      davidInventory.stone >= npc.req.stone &&
      davidInventory.iron >= npc.req.iron;

    reqsEl.innerHTML = allMet
      ? `<span class="text-yellow-300 animate-pulse">✅ 완료! ${npc.roleTitle}에게 이동</span>`
      : parts.join(' · ');
  }
}

// -------------------------------------------------------------------------
// 2. 도시 바닥 석조 텍스처 & 건물 외벽 디테일 질감 텍스처 생성기
// -------------------------------------------------------------------------
let _davidCityStoneTex = null;
function makeDavidCityStoneTex() {
  if (_davidCityStoneTex) return _davidCityStoneTex;
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#d6c3a5';
  ctx.fillRect(0, 0, 128, 128);

  const stonePalette = ['#e5d5bc', '#cbb492', '#decbb0', '#c2a882', '#dfd0b8'];
  const tileW = 32, tileH = 16;

  for (let row = 0; row < 8; row++) {
    const offsetX = (row % 2) * 16;
    for (let col = -1; col < 5; col++) {
      const x = col * tileW + offsetX;
      const y = row * tileH;
      ctx.fillStyle = stonePalette[(row * 3 + col + 10) % stonePalette.length];
      ctx.fillRect(x + 1, y + 1, tileW - 2, tileH - 2);

      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(x + 2, y + 2, tileW - 4, 2);
      ctx.fillStyle = 'rgba(87,65,42,0.22)';
      ctx.fillRect(x + 1, y + tileH - 3, tileW - 2, 2);
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(36, 36);
  _davidCityStoneTex = tex;
  return tex;
}

const _davidWallTexCache = {};
function makeDavidBuildingWallTex(variant = 0) {
  const key = `wall_v_${variant % 4}`;
  if (_davidWallTexCache[key]) return _davidWallTexCache[key];

  const schemes = [
    { bg: '#e8d0a7', b1: '#f5e1be', b2: '#dabb8a', b3: '#cfa972', mortar: '#9c784c', frieze: '#b45309' },
    { bg: '#e6c29f', b1: '#f3d4b6', b2: '#d9ae86', b3: '#c8986c', mortar: '#8c5832', frieze: '#9a3412' },
    { bg: '#ece0b9', b1: '#f7eed0', b2: '#dfd0a0', b3: '#cfc08e', mortar: '#8f7e4f', frieze: '#a16207' },
    { bg: '#dcd6ce', b1: '#eae5df', b2: '#cdc5ba', b3: '#beb5a8', mortar: '#78716c', frieze: '#57534e' }
  ];
  const sc = schemes[variant % schemes.length];

  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d');

  ctx.fillStyle = sc.mortar;
  ctx.fillRect(0, 0, 128, 128);

  const bricks = [sc.b1, sc.b2, sc.b3, sc.bg];
  const rowH = 16;
  const colW = 32;

  for (let r = 0; r < 8; r++) {
    const offX = (r % 2) * 16;
    for (let col = -1; col < 5; col++) {
      const bx = col * colW + offX;
      const by = r * rowH;
      ctx.fillStyle = bricks[(r * 5 + col + 8) % bricks.length];
      ctx.fillRect(bx + 1, by + 1, colW - 2, rowH - 2);

      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.fillRect(bx + 2, by + 2, colW - 4, 2);
      ctx.fillStyle = 'rgba(60,35,15,0.18)';
      ctx.fillRect(bx + 2, by + rowH - 3, colW - 4, 2);

      ctx.fillStyle = 'rgba(90,60,30,0.14)';
      ctx.fillRect(bx + 6 + ((r * 7) % 14), by + 6, 3, 3);
      ctx.fillRect(bx + 18 + ((col * 5) % 8), by + 9, 2, 2);
    }
  }

  ctx.fillStyle = sc.frieze;
  ctx.fillRect(0, 0, 128, 6);
  ctx.fillRect(0, 120, 128, 8);
  for (let x = 4; x < 128; x += 16) {
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(x, 2, 6, 3);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  _davidWallTexCache[key] = tex;
  return tex;
}

function makeDetailedBuildingWallMat(variant = 0) {
  return new THREE.MeshLambertMaterial({ map: makeDavidBuildingWallTex(variant) });
}

function registerCitySolidBox(cx, cz, w, d, topY, pad = 0.30) {
  const minX = cx - w / 2 - pad;
  const maxX = cx + w / 2 + pad;
  const minZ = cz - d / 2 - pad;
  const maxZ = cz + d / 2 + pad;
  colliders.push({ minX, maxX, minZ, maxZ });
  platforms.push({ minX, maxX, minZ, maxZ, topY });
  davidCityBuildingBoxes.push({ minX, maxX, minZ, maxZ, topY });
}

function lockCompletedQuestBuilding(cx, cz, w, d, topY, completedGroup) {
  registerCitySolidBox(cx, cz, w, d, topY, 0.28);
  if (completedGroup) {
    completedGroup.traverse(child => {
      if (child.isMesh && !wallMeshes.includes(child)) {
        wallMeshes.push(child);
      }
    });
  }
  resolvePlayerOutOfCityBuildings();
}

function isCityFloorSpotClear(x, z, pad = 1.35) {
  for (const b of davidCityBuildingBoxes) {
    if (x + pad > b.minX && x - pad < b.maxX && z + pad > b.minZ && z - pad < b.maxZ) {
      return false;
    }
  }
  return true;
}

function resolvePlayerOutOfCityBuildings() {
  for (const b of davidCityBuildingBoxes) {
    if (playerPos.y >= b.topY - 0.55) continue;

    if (
      playerPos.x > b.minX && playerPos.x < b.maxX &&
      playerPos.z > b.minZ && playerPos.z < b.maxZ
    ) {
      const dLeft = playerPos.x - b.minX;
      const dRight = b.maxX - playerPos.x;
      const dNorth = playerPos.z - b.minZ;
      const dSouth = b.maxZ - playerPos.z;
      const minSide = Math.min(dLeft, dRight, dNorth, dSouth);

      if (minSide === dLeft) playerPos.x = b.minX - 0.18;
      else if (minSide === dRight) playerPos.x = b.maxX + 0.18;
      else if (minSide === dNorth) playerPos.z = b.minZ - 0.18;
      else playerPos.z = b.maxZ + 0.18;
    }
  }
}

// -------------------------------------------------------------------------
// 3. 맵 가장자리 성벽(석조 텍스처 + 반투명 시야 보장) 및 성벽 밖 곧은 길 생성
// -------------------------------------------------------------------------
function buildDavidCastleWallPerimeter(limit, withSouthGate = true) {
  const wallTrimMat = matVoxel('#b45309', '#78350f');
  const wallH = 8.2;
  const wallThick = 3.4;
  const segLen = 12.0;

  const addTransparentWallSegment = (w, h, d, x, y, z, isTrim = false, v = 0) => {
    const mat = isTrim ? wallTrimMat.clone() : makeDetailedBuildingWallMat(v);
    const box = createBox(w, h, d, mat, x, y, z);
    worldGroup.add(box);
    wallMeshes.push(box);
    return box;
  };

  for (let x = -limit; x <= limit; x += segLen) {
    addTransparentWallSegment(segLen + 0.15, wallH, wallThick, x, wallH / 2, -limit, false, 0);
    addTransparentWallSegment(segLen + 0.35, 0.55, wallThick + 0.4, x, wallH + 0.25, -limit, true);
    [-3.6, 0, 3.6].forEach(ox => {
      addTransparentWallSegment(2.0, 1.2, wallThick + 0.2, x + ox, wallH + 1.1, -limit, false, 3);
    });

    if (withSouthGate && Math.abs(x) < 12.5) continue;
    addTransparentWallSegment(segLen + 0.15, wallH, wallThick, x, wallH / 2, limit, false, 0);
    addTransparentWallSegment(segLen + 0.35, 0.55, wallThick + 0.4, x, wallH + 0.25, limit, true);
    [-3.6, 0, 3.6].forEach(ox => {
      addTransparentWallSegment(2.0, 1.2, wallThick + 0.2, x + ox, wallH + 1.1, limit, false, 3);
    });
  }

  for (let z = -limit; z <= limit; z += segLen) {
    addTransparentWallSegment(wallThick, wallH, segLen + 0.15, -limit, wallH / 2, z, false, 0);
    addTransparentWallSegment(wallThick + 0.4, 0.55, segLen + 0.35, -limit, wallH + 0.25, z, true);
    [-3.6, 0, 3.6].forEach(oz => {
      addTransparentWallSegment(wallThick + 0.2, 1.2, 2.0, -limit, wallH + 1.1, z + oz, false, 3);
    });

    addTransparentWallSegment(wallThick, wallH, segLen + 0.15, limit, wallH / 2, z, false, 0);
    addTransparentWallSegment(wallThick + 0.4, 0.55, segLen + 0.35, limit, wallH + 0.25, z, true);
    [-3.6, 0, 3.6].forEach(oz => {
      addTransparentWallSegment(wallThick + 0.2, 1.2, 2.0, limit, wallH + 1.1, z + oz, false, 3);
    });
  }

  const towerCoords = [
    [-limit, -limit], [limit, -limit], [-limit, limit], [limit, limit],
    [-limit, 0], [limit, 0], [0, -limit]
  ];
  towerCoords.forEach(([tx, tz]) => {
    const tBody = createBox(6.8, wallH + 3.2, 6.8, makeDetailedBuildingWallMat(3), tx, (wallH + 3.2) / 2, tz);
    const tRoof = createBox(7.4, 0.7, 7.4, wallTrimMat.clone(), tx, wallH + 3.55, tz);
    worldGroup.add(tBody, tRoof);
    wallMeshes.push(tBody, tRoof);
  });

  for (let i = -limit + 16; i <= limit - 16; i += 24) {
    addWallTorch(i, 3.5, -limit + 2.0);
    if (!withSouthGate || Math.abs(i) > 14) addWallTorch(i, 3.5, limit - 2.0);
    addWallTorch(-limit + 2.0, 3.5, i);
    addWallTorch( limit - 2.0, 3.5, i);
  }

  if (withSouthGate) {
    const outGrassMat = new THREE.MeshLambertMaterial({ map: makeGrassFieldTex() });
    const highwayMat = matDavidCached('#e5c494', '#c29b61');
    const curbMat = matDavidCached('#94a3b8', '#64748b');

    const outerGround = createBox(limit * 3.0, 1.2, 130, outGrassMat, 0, -0.58, limit + 64, false);
    outerGround.receiveShadow = true;
    worldGroup.add(outerGround);

    const roadLen = 125;
    const roadCenterZ = limit + roadLen / 2 - 2;
    worldGroup.add(
      createBox(8.6, 0.14, roadLen, highwayMat, 0, 0.06, roadCenterZ, false),
      createBox(0.65, 0.28, roadLen, curbMat, -4.6, 0.14, roadCenterZ, false),
      createBox(0.65, 0.28, roadLen, curbMat,  4.6, 0.14, roadCenterZ, false)
    );

    for (let rz = limit + 12; rz <= limit + 108; rz += 16) {
      addPalmTree(-9.5, rz, 1.15, false);
      addPalmTree( 9.5, rz, 1.15, false);
      worldGroup.add(
        createBox(0.45, 1.6, 0.45, curbMat, -5.2, 0.8, rz, false),
        createBox(0.45, 1.6, 0.45, curbMat,  5.2, 0.8, rz, false)
      );
    }
  }
}

// -------------------------------------------------------------------------
// 4. 디테일한 인물(상인·건축가·경비병·왕궁 전령) & 신하 2명 & 하늘 원통 빛기둥 모델링
// -------------------------------------------------------------------------
function createNpcSkyBeacon(colorHex) {
  const beaconGrp = new THREE.Group();
  const cylGeo = new THREE.CylinderGeometry(0.95, 0.95, 62, 20, 1, true);
  const cylMat = new THREE.MeshBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: 0.26,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const outerCyl = new THREE.Mesh(cylGeo, cylMat);
  outerCyl.position.y = 31.0;

  const coreGeo = new THREE.CylinderGeometry(0.35, 0.35, 62, 12, 1, true);
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.38,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const innerCyl = new THREE.Mesh(coreGeo, coreMat);
  innerCyl.position.y = 31.0;

  beaconGrp.add(outerCyl, innerCyl);
  beaconGrp.userData = { outerCyl, innerCyl };
  return beaconGrp;
}

function createDetailedCityNpcMesh(roleId) {
  const g = new THREE.Group();
  const skin = matDavidCached('#fed7aa', '#fdba74');
  const darkSkin = matDavidCached('#f59e0b', '#d97706');
  const eyeWhite = matDavidCached('#ffffff');
  const pupilMat = matDavidCached('#0f172a');
  const sandalMat = matDavidCached('#451a03');
  const goldMat = matDavidCached('#facc15', '#ca8a04');

  let robePrimary, robeSecondary, sashMat, hairColor;
  if (roleId === 'merchant') {
    robePrimary = matDavidCached('#7e22ce', '#581c87');
    robeSecondary = matDavidCached('#f59e0b', '#d97706');
    sashMat = matDavidCached('#ef4444', '#b91c1c');
    hairColor = matDavidCached('#334155');
  } else if (roleId === 'architect') {
    robePrimary = matDavidCached('#0369a1', '#075985');
    robeSecondary = matDavidCached('#b45309', '#78350f');
    sashMat = matDavidCached('#fde047', '#ca8a04');
    hairColor = matDavidCached('#78350f');
  } else if (roleId === 'guard') {
    robePrimary = matDavidCached('#991b1b', '#7f1d1d');
    robeSecondary = matDavidCached('#d97706', '#92400e');
    sashMat = matDavidCached('#475569', '#1e293b');
    hairColor = matDavidCached('#1e293b');
  } else {
    robePrimary = matDavidCached('#1d4ed8', '#1e3a8a');
    robeSecondary = matDavidCached('#f8fafc', '#e2e8f0');
    sashMat = goldMat;
    hairColor = matDavidCached('#451a03');
  }

  const lLeg = new THREE.Group(); lLeg.position.set(-0.22, 0.7, 0);
  lLeg.add(
    createBox(0.32, 0.52, 0.32, skin, 0, -0.26, 0),
    createBox(0.36, 0.16, 0.42, sandalMat, 0, -0.60, 0.03)
  );
  const rLeg = new THREE.Group(); rLeg.position.set(0.22, 0.7, 0);
  rLeg.add(
    createBox(0.32, 0.52, 0.32, skin, 0, -0.26, 0),
    createBox(0.36, 0.16, 0.42, sandalMat, 0, -0.60, 0.03)
  );

  const torso = createBox(0.88, 1.08, 0.48, robePrimary, 0, 1.22, 0);
  const robeCoatL = createBox(0.28, 1.06, 0.54, robeSecondary, -0.29, 1.22, 0);
  const robeCoatR = createBox(0.28, 1.06, 0.54, robeSecondary,  0.29, 1.22, 0);
  const collar = createBox(0.62, 0.16, 0.54, goldMat, 0, 1.70, 0.02);
  const belt = createBox(0.94, 0.18, 0.56, sashMat, 0, 0.96, 0);
  const buckle = createBox(0.22, 0.20, 0.60, goldMat, 0, 0.96, 0);

  const head = createBox(0.76, 0.76, 0.76, skin, 0, 2.12, 0);
  const nose = createBox(0.12, 0.16, 0.12, darkSkin, 0, 2.08, 0.40);
  const lEyeW = createBox(0.18, 0.12, 0.05, eyeWhite, -0.18, 2.16, 0.38);
  const rEyeW = createBox(0.18, 0.12, 0.05, eyeWhite,  0.18, 2.16, 0.38);
  const lPupil = createBox(0.10, 0.10, 0.06, pupilMat, -0.16, 2.16, 0.39);
  const rPupil = createBox(0.10, 0.10, 0.06, pupilMat,  0.16, 2.16, 0.39);
  const lBrow = createBox(0.20, 0.06, 0.06, hairColor, -0.18, 2.26, 0.39);
  const rBrow = createBox(0.20, 0.06, 0.06, hairColor,  0.18, 2.26, 0.39);
  const beard = createBox(0.78, 0.28, 0.26, hairColor, 0, 1.84, 0.30);
  const mustache = createBox(0.46, 0.08, 0.12, hairColor, 0, 1.96, 0.39);

  g.add(
    lLeg, rLeg, torso, robeCoatL, robeCoatR, collar, belt, buckle,
    head, nose, lEyeW, rEyeW, lPupil, rPupil, lBrow, rBrow, beard, mustache
  );

  if (roleId === 'merchant') {
    g.add(
      createBox(0.92, 0.34, 0.92, matDavidCached('#fde047', '#eab308'), 0, 2.52, 0),
      createBox(0.78, 0.22, 0.78, matDavidCached('#9333ea'), 0, 2.74, 0),
      createBox(0.18, 0.22, 0.14, matDavidCached('#ef4444'), 0, 2.58, 0.45),
      createBox(0.42, 0.38, 0.26, matDavidCached('#d97706'), -0.44, 0.88, 0.18)
    );
  } else if (roleId === 'architect') {
    g.add(
      createBox(0.86, 0.26, 0.86, matDavidCached('#f8fafc', '#cbd5e1'), 0, 2.50, 0),
      createBox(0.90, 0.10, 0.90, matDavidCached('#0284c7'), 0, 2.40, 0),
      createBox(0.56, 0.58, 0.08, robeSecondary, 0, 0.95, 0.28)
    );
  } else if (roleId === 'guard') {
    g.add(
      createBox(0.88, 0.32, 0.88, goldMat, 0, 2.50, 0),
      createBox(0.14, 0.36, 0.86, goldMat, -0.40, 2.22, 0),
      createBox(0.14, 0.36, 0.86, goldMat,  0.40, 2.22, 0),
      createBox(0.18, 0.42, 0.58, matDavidCached('#ef4444', '#b91c1c'), 0, 2.82, 0),
      createBox(0.96, 1.15, 0.12, matDavidCached('#7f1d1d'), 0, 1.18, -0.28)
    );
  } else {
    g.add(
      createBox(0.86, 0.24, 0.86, matDavidCached('#1e3a8a'), 0, 2.50, 0),
      createBox(0.90, 0.14, 0.90, goldMat, 0, 2.42, 0),
      createBox(0.16, 0.36, 0.16, matDavidCached('#38bdf8'), 0, 2.72, 0.36)
    );
  }

  const lArm = new THREE.Group(); lArm.position.set(-0.60, 1.56, 0);
  lArm.add(createBox(0.30, 0.66, 0.30, robePrimary, 0, -0.28, 0), createBox(0.24, 0.20, 0.24, skin, 0, -0.68, 0));

  const rArm = new THREE.Group(); rArm.position.set(0.60, 1.56, 0);
  rArm.add(createBox(0.30, 0.66, 0.30, robePrimary, 0, -0.28, 0), createBox(0.24, 0.20, 0.24, skin, 0, -0.68, 0));

  if (roleId === 'merchant') {
    rArm.add(
      createBox(0.08, 0.42, 0.08, goldMat, 0, -0.68, 0.30, false),
      createBox(0.46, 0.06, 0.06, goldMat, 0, -0.48, 0.30, false),
      createBox(0.16, 0.06, 0.16, goldMat, -0.20, -0.65, 0.30, false),
      createBox(0.16, 0.06, 0.16, goldMat,  0.20, -0.65, 0.30, false)
    );
  } else if (roleId === 'architect') {
    lArm.add(createBox(0.42, 0.16, 0.16, matDavidCached('#fef9c3', '#fde047'), 0, -0.68, 0.26, false));
    rArm.add(
      createBox(0.08, 0.48, 0.08, goldMat, 0, -0.65, 0.28, false),
      createBox(0.32, 0.08, 0.08, goldMat, -0.12, -0.85, 0.28, false)
    );
  } else if (roleId === 'guard') {
    lArm.add(
      createBox(0.62, 0.88, 0.12, goldMat, -0.14, -0.35, 0.26),
      createBox(0.46, 0.70, 0.14, matDavidCached('#991b1b'), -0.14, -0.35, 0.28)
    );
    rArm.add(
      createBox(0.10, 2.35, 0.10, sandalMat, 0.05, 0.15, 0.28),
      createBox(0.22, 0.48, 0.10, matDavidCached('#cbd5e1', '#64748b'), 0.05, 1.42, 0.28)
    );
  } else {
    rArm.add(
      createBox(0.10, 0.10, 0.55, goldMat, 0, -0.68, 0.36, false),
      createBox(0.24, 0.24, 0.14, goldMat, 0, -0.68, 0.65, false)
    );
  }

  g.add(lArm, rArm);
  g.userData = { lLeg, rLeg, lArm, rArm };
  return g;
}

function createDavidRetainerMesh(retainerIdx) {
  const g = new THREE.Group();
  const isFirst = (retainerIdx === 0);
  const tunicMat = isFirst ? matDavidCached('#f8fafc', '#e2e8f0') : matDavidCached('#eff6ff', '#dbeafe');
  const cloakMat = isFirst ? matDavidCached('#0284c7', '#0369a1') : matDavidCached('#059669', '#047857');
  const goldMat = matDavidCached('#facc15', '#ca8a04');
  const skin = matDavidCached('#fed7aa', '#fdba74');
  const hairMat = matDavidCached('#451a03');
  const eyeWhite = matDavidCached('#ffffff');
  const eyeMat = matDavidCached('#0f172a');

  const lLeg = new THREE.Group(); lLeg.position.set(-0.20, 0.68, 0);
  lLeg.add(createBox(0.30, 0.52, 0.30, skin, 0, -0.26, 0), createBox(0.34, 0.15, 0.38, hairMat, 0, -0.58, 0.02));
  const rLeg = new THREE.Group(); rLeg.position.set(0.20, 0.68, 0);
  rLeg.add(createBox(0.30, 0.52, 0.30, skin, 0, -0.26, 0), createBox(0.34, 0.15, 0.38, hairMat, 0, -0.58, 0.02));

  const torso = createBox(0.82, 1.00, 0.46, tunicMat, 0, 1.16, 0);
  const sash = createBox(0.32, 1.02, 0.50, cloakMat, isFirst ? -0.22 : 0.22, 1.16, 0);
  const belt = createBox(0.86, 0.14, 0.50, goldMat, 0, 0.92, 0);

  const head = createBox(0.70, 0.70, 0.70, skin, 0, 2.02, 0);
  const hair = createBox(0.76, 0.26, 0.76, hairMat, 0, 2.34, 0);
  const headband = createBox(0.78, 0.10, 0.78, goldMat, 0, 2.24, 0);
  const lEyeW = createBox(0.16, 0.11, 0.04, eyeWhite, -0.15, 2.06, 0.35);
  const rEyeW = createBox(0.16, 0.11, 0.04, eyeWhite,  0.15, 2.06, 0.35);
  const lEye = createBox(0.09, 0.09, 0.05, eyeMat, -0.15, 2.06, 0.36);
  const rEye = createBox(0.09, 0.09, 0.05, eyeMat,  0.15, 2.06, 0.36);

  const lArm = new THREE.Group(); lArm.position.set(-0.54, 1.50, 0);
  lArm.add(createBox(0.26, 0.62, 0.26, tunicMat, 0, -0.26, 0), createBox(0.22, 0.18, 0.22, skin, 0, -0.62, 0));

  const rArm = new THREE.Group(); rArm.position.set(0.54, 1.50, 0);
  rArm.add(createBox(0.26, 0.62, 0.26, tunicMat, 0, -0.26, 0), createBox(0.22, 0.18, 0.22, skin, 0, -0.62, 0));

  const packGroup = new THREE.Group();
  packGroup.position.set(0, 1.18, -0.42);
  g.add(packGroup);

  g.add(lLeg, rLeg, torso, sash, belt, head, hair, headband, lEyeW, rEyeW, lEye, rEye, lArm, rArm);
  g.userData = { lLeg, rLeg, lArm, rArm, packGroup };
  return g;
}

// -------------------------------------------------------------------------
// 5. 벽돌·회벽 질감과 서까래·창틀 디테일이 적용된 다윗성 건축물 빌더
// -------------------------------------------------------------------------
function buildDavidCityPalace(cx, cz) {
  const cedarMat = matVoxel('#78350f', '#451a03');
  const goldMat = matDavidCached('#facc15', '#ca8a04');
  const colMat = matVoxel('#f8fafc', '#cbd5e1');

  const base = createBox(20, 1.2, 14, makeDetailedBuildingWallMat(3), cx, 0.6, cz);
  const mainHall = createBox(18, 6.5, 11, makeDetailedBuildingWallMat(0), cx, 4.4, cz);
  const cedarRoof = createBox(19.2, 0.9, 12.2, cedarMat.clone(), cx, 8.0, cz);
  const upperTower = createBox(10, 4.2, 7, makeDetailedBuildingWallMat(2), cx, 10.5, cz - 1.0);
  const crownRoof = createBox(11.0, 0.7, 8.0, goldMat, cx, 12.9, cz - 1.0);
  worldGroup.add(base, mainHall, cedarRoof, upperTower, crownRoof);
  wallMeshes.push(mainHall, cedarRoof, upperTower);

  [-6.5, -2.5, 2.5, 6.5].forEach(ox => {
    const col = createBox(1.1, 6.2, 1.1, colMat.clone(), cx + ox, 4.2, cz + 6.0);
    worldGroup.add(col);
    wallMeshes.push(col);
  });
  addWallTorch(cx - 4.5, 3.2, cz + 6.8);
  addWallTorch(cx + 4.5, 3.2, cz + 6.8);

  registerCitySolidBox(cx, cz, 20.0, 14.0, 12.5, 0.35);
}

function buildDavidCityTabernacle(cx, cz) {
  const tentWhite = matVoxel('#f8fafc', '#e2e8f0').clone();
  const tentBlue = matVoxel('#1d4ed8', '#1e3a8a').clone();
  const tentPurple = matVoxel('#7e22ce', '#581c87').clone();
  const goldMat = matDavidCached('#facc15', '#ca8a04');

  const platform = createBox(16, 0.8, 12, matDavidCached('#cbd5e1', '#94a3b8'), cx, 0.4, cz);
  const tentBody = createBox(12, 5.2, 8.5, tentWhite, cx, 3.4, cz);
  const roofBlue = createBox(12.8, 0.8, 9.2, tentBlue, cx, 6.3, cz);
  const roofTop = createBox(10.5, 0.7, 7.5, tentPurple, cx, 7.0, cz);
  worldGroup.add(platform, tentBody, roofBlue, roofTop);
  wallMeshes.push(tentBody, roofBlue, roofTop);

  const arkBox = createBox(2.2, 1.3, 1.3, goldMat, cx, 1.45, cz + 3.2);
  const cherubL = createBox(0.5, 0.7, 0.5, goldMat, cx - 0.65, 2.4, cz + 3.2);
  const cherubR = createBox(0.5, 0.7, 0.5, goldMat, cx + 0.65, 2.4, cz + 3.2);
  worldGroup.add(arkBox, cherubL, cherubR);
  addWallTorch(cx - 4.8, 2.5, cz + 5.2);
  addWallTorch(cx + 4.8, 2.5, cz + 5.2);

  registerCitySolidBox(cx, cz - 0.3, 12.6, 9.0, 7.2, 0.35);
}

function buildClimbableTwoStoryHouse(cx, cz, stairSide = 'east', colorVariant = 0) {
  const wallMat = makeDetailedBuildingWallMat(colorVariant);
  const trimMat = matVoxel('#92400e', '#5c2d0c').clone();
  const stairMat = matVoxel('#cbd5e1', '#64748b').clone();
  const awningMat = matVoxel(colorVariant % 2 === 0 ? '#0284c7' : '#16a34a', '#0f172a').clone();
  const frameMat = matDavidCached('#78350f', '#451a03');
  const winMat = matDavidCached('#1e293b');

  const w = 9.0, h1 = 3.6, d = 7.4;

  const body1F = createBox(w, h1, d, wallMat, cx, h1 / 2, cz);
  const slab2F = createBox(w + 0.4, 0.30, d + 0.4, trimMat, cx, h1 - 0.12, cz);
  const door1F = createBox(1.6, 2.4, 0.25, trimMat, cx, 1.2, cz + d / 2 + 0.08);
  const lintel1F = createBox(2.1, 0.28, 0.34, frameMat, cx, 2.52, cz + d / 2 + 0.10);
  worldGroup.add(body1F, slab2F, door1F, lintel1F);
  wallMeshes.push(body1F, slab2F);

  [-2.6, 2.6].forEach(ox => {
    worldGroup.add(
      createBox(1.3, 1.2, 0.22, frameMat, cx + ox, 2.1, cz + d / 2 + 0.06),
      createBox(0.95, 0.95, 0.26, winMat, cx + ox, 2.1, cz + d / 2 + 0.08)
    );
  });
  for (let bx = -w / 2 + 0.8; bx <= w / 2 - 0.8; bx += 1.8) {
    worldGroup.add(createBox(0.24, 0.22, d + 0.7, frameMat, cx + bx, h1 - 0.28, cz));
  }

  platforms.push({
    minX: cx - w / 2 - 0.25,
    maxX: cx + w / 2 + 0.25,
    minZ: cz - d / 2 - 0.25,
    maxZ: cz + d / 2 + 0.25,
    topY: h1
  });
  davidCityBuildingBoxes.push({
    minX: cx - w / 2 - 0.25,
    maxX: cx + w / 2 + 0.25,
    minZ: cz - d / 2 - 0.25,
    maxZ: cz + d / 2 + 0.25,
    topY: h1
  });

  const roomW = 3.6, roomH = 2.6, roomD = 4.0;
  const roomX = cx + (stairSide === 'east' ? -2.2 : 2.2);
  const roomZ = cz - 1.2;
  const body2F = createBox(roomW, roomH, roomD, makeDetailedBuildingWallMat(colorVariant + 1), roomX, h1 + roomH / 2, roomZ);
  const roof2F = createBox(roomW + 0.4, 0.36, roomD + 0.4, awningMat, roomX, h1 + roomH + 0.18, roomZ);
  worldGroup.add(body2F, roof2F);
  wallMeshes.push(body2F, roof2F);
  registerCitySolidBox(roomX, roomZ, roomW, roomD, h1 + roomH, 0.20);

  const dir = (stairSide === 'east') ? 1 : -1;
  const stairW = 2.6;
  const stairX = cx + dir * (w / 2 + stairW / 2 - 0.30);
  const stepDepth = 1.24;
  const startZ = cz + d / 2 - 0.4;

  for (let s = 1; s <= 6; s++) {
    const stepTopY = s * 0.6;
    const sz = startZ - (s - 1) * stepDepth;
    const boxD = (s === 6) ? (stepDepth + 0.65) : (stepDepth + 0.18);
    const boxZ = (s === 6) ? (sz - 0.20) : sz;
    const stepBox = createBox(stairW, stepTopY, boxD, stairMat.clone(), stairX, stepTopY / 2, boxZ);
    worldGroup.add(stepBox);
    wallMeshes.push(stepBox);

    const pMinX = Math.min(stairX - stairW / 2 - 0.15, cx + dir * (w / 2 - 0.3));
    const pMaxX = Math.max(stairX + stairW / 2 + 0.15, cx + dir * (w / 2 - 0.3));
    platforms.push({
      minX: pMinX,
      maxX: pMaxX,
      minZ: boxZ - boxD * 0.55,
      maxZ: boxZ + boxD * 0.55,
      topY: stepTopY
    });
  }
}

function buildOpenShopBuildingWithKeeper(cx, cz, w, d, facing = 'south', shopType = 'fruit', idx = 0) {
  const woodMat = matVoxel('#78350f', '#451a03');
  const awningCol1 = (shopType === 'fruit') ? '#16a34a' : (shopType === 'pottery' ? '#ea580c' : (shopType === 'cloth' ? '#9333ea' : '#0284c7'));
  const awningMat = matVoxel(awningCol1, '#0f172a').clone();
  const h = 4.5;

  const isNS = (facing === 'south' || facing === 'north');
  const fSign = (facing === 'south' || facing === 'east') ? 1 : -1;

  const roofBox = createBox(w + 0.4, 0.55, d + 0.4, woodMat.clone(), cx, h + 0.25, cz);
  const signAwning = createBox(
    isNS ? w + 0.6 : 1.8,
    0.45,
    isNS ? 1.8 : d + 0.6,
    awningMat,
    cx + (isNS ? 0 : fSign * (w / 2 + 0.6)),
    h - 0.35,
    cz + (isNS ? fSign * (d / 2 + 0.6) : 0)
  );
  worldGroup.add(roofBox, signAwning);
  wallMeshes.push(roofBox, signAwning);

  if (isNS) {
    const backWall = createBox(w, h, 0.8, makeDetailedBuildingWallMat(idx), cx, h / 2, cz - fSign * (d / 2 - 0.4));
    const sideL = createBox(0.8, h, d, makeDetailedBuildingWallMat(idx), cx - w / 2 + 0.4, h / 2, cz);
    const sideR = createBox(0.8, h, d, makeDetailedBuildingWallMat(idx), cx + w / 2 - 0.4, h / 2, cz);
    const counter = createBox(w - 2.0, 1.15, 1.1, woodMat.clone(), cx, 0.58, cz + fSign * (d / 2 - 1.3));
    worldGroup.add(backWall, sideL, sideR, counter);
    wallMeshes.push(backWall, sideL, sideR);

    const itemCols = ['#ef4444', '#facc15', '#22c55e', '#a855f7'];
    [-1.8, 0, 1.8].forEach((ox, i) => {
      worldGroup.add(createBox(0.75, 0.48, 0.65, matDavidCached(itemCols[(idx + i) % itemCols.length]), cx + ox, 1.38, cz + fSign * (d / 2 - 1.3)));
    });

    const keeper = createDetailedCityNpcMesh(idx % 2 === 0 ? 'merchant' : 'architect');
    keeper.position.set(cx, 0, cz - fSign * 0.4);
    keeper.rotation.y = (fSign === 1) ? 0 : Math.PI;
    worldGroup.add(keeper);
    davidCityShopkeepers.push({ mesh: keeper, phase: idx * 1.1 });
  } else {
    const backWall = createBox(0.8, h, d, makeDetailedBuildingWallMat(idx), cx - fSign * (w / 2 - 0.4), h / 2, cz);
    const sideN = createBox(w, h, 0.8, makeDetailedBuildingWallMat(idx), cx, h / 2, cz - d / 2 + 0.4);
    const sideS = createBox(w, h, 0.8, makeDetailedBuildingWallMat(idx), cx, h / 2, cz + d / 2 - 0.4);
    const counter = createBox(1.1, 1.15, d - 2.0, woodMat.clone(), cx + fSign * (w / 2 - 1.3), 0.58, cz);
    worldGroup.add(backWall, sideN, sideS, counter);
    wallMeshes.push(backWall, sideN, sideS);

    const itemCols = ['#f97316', '#38bdf8', '#fde047', '#ec4899'];
    [-1.8, 0, 1.8].forEach((oz, i) => {
      worldGroup.add(createBox(0.65, 0.48, 0.75, matDavidCached(itemCols[(idx + i) % itemCols.length]), cx + fSign * (w / 2 - 1.3), 1.38, cz + oz));
    });

    const keeper = createDetailedCityNpcMesh(idx % 2 === 0 ? 'merchant' : 'architect');
    keeper.position.set(cx - fSign * 0.4, 0, cz);
    keeper.rotation.y = (fSign === 1) ? (Math.PI / 2) : (-Math.PI / 2);
    worldGroup.add(keeper);
    davidCityShopkeepers.push({ mesh: keeper, phase: idx * 1.1 });
  }

  registerCitySolidBox(cx, cz, w, d, h + 0.4, 0.30);
}

function buildSolidCityBuildingBlock(cx, cz, w, h, d, variant = 0) {
  const wallMat = makeDetailedBuildingWallMat(variant);
  const roofMat = matVoxel('#92400e', '#5c2d0c').clone();
  const beamMat = matDavidCached('#78350f', '#451a03');
  const winFrameMat = matDavidCached('#b45309', '#78350f');
  const winMat = matDavidCached('#1e293b');
  const doorMat = matDavidCached('#451a03');
  const stoneQuoinMat = matDavidCached('#d6d3d1', '#a8a29e');

  const body = createBox(w, h, d, wallMat, cx, h / 2, cz);
  const roof = createBox(w + 0.45, 0.45, d + 0.45, roofMat, cx, h + 0.22, cz);
  const plinth = createBox(w + 0.22, 0.36, d + 0.22, stoneQuoinMat, cx, 0.18, cz);
  worldGroup.add(body, roof, plinth);
  wallMeshes.push(body, roof);

  if (w >= d) {
    const count = Math.max(1, Math.floor(w / 7.5));
    for (let i = 0; i < count; i++) {
      const ox = -w / 2 + (i + 0.5) * (w / count);
      worldGroup.add(
        createBox(1.4, 2.3, 0.18, doorMat, cx + ox, 1.15, cz + d / 2 + 0.06),
        createBox(1.8, 0.24, 0.28, beamMat, cx + ox, 2.40, cz + d / 2 + 0.08),
        createBox(1.35, 1.35, 0.16, winFrameMat, cx + ox + 1.85, 2.65, cz + d / 2 + 0.05),
        createBox(1.05, 1.05, 0.20, winMat, cx + ox + 1.85, 2.65, cz + d / 2 + 0.07),
        createBox(1.35, 1.35, 0.16, winFrameMat, cx + ox - 1.85, 2.65, cz - d / 2 - 0.05),
        createBox(1.05, 1.05, 0.20, winMat, cx + ox - 1.85, 2.65, cz - d / 2 - 0.07)
      );
    }
    for (let bx = -w / 2 + 1.2; bx <= w / 2 - 1.2; bx += 2.6) {
      worldGroup.add(createBox(0.22, 0.22, d + 0.72, beamMat, cx + bx, h - 0.22, cz));
    }
  } else {
    const count = Math.max(1, Math.floor(d / 7.5));
    for (let i = 0; i < count; i++) {
      const oz = -d / 2 + (i + 0.5) * (d / count);
      worldGroup.add(
        createBox(0.18, 2.3, 1.4, doorMat, cx + w / 2 + 0.06, 1.15, cz + oz),
        createBox(0.28, 0.24, 1.8, beamMat, cx + w / 2 + 0.08, 2.40, cz + oz),
        createBox(0.16, 1.35, 1.35, winFrameMat, cx + w / 2 + 0.05, 2.65, cz + oz + 1.85),
        createBox(0.20, 1.05, 1.05, winMat, cx + w / 2 + 0.07, 2.65, cz + oz + 1.85),
        createBox(0.16, 1.35, 1.35, winFrameMat, cx - w / 2 - 0.05, 2.65, cz + oz - 1.85),
        createBox(0.20, 1.05, 1.05, winMat, cx - w / 2 - 0.07, 2.65, cz + oz - 1.85)
      );
    }
    for (let bz = -d / 2 + 1.2; bz <= d / 2 - 1.2; bz += 2.6) {
      worldGroup.add(createBox(w + 0.72, 0.22, 0.22, beamMat, cx, h - 0.22, cz + bz));
    }
  }

  registerCitySolidBox(cx, cz, w, d, h + 0.4, 0.30);
}

function buildDenseMazeCityAndStreets() {
  davidCityShopkeepers = [];
  davidCityPedestrians = [];

  const twoStorySpecs = [
    { x: -42, z: -26, side: 'east', var: 0 },
    { x: -42, z:  22, side: 'east', var: 1 },
    { x:  42, z: -26, side: 'west', var: 0 },
    { x:  42, z:  22, side: 'west', var: 1 },
    { x: -20, z: -34, side: 'east', var: 1 },
    { x:  20, z:  30, side: 'west', var: 0 },
    { x: -54, z: -48, side: 'east', var: 2 },
    { x:  54, z:  48, side: 'west', var: 3 }
  ];
  twoStorySpecs.forEach(sp => {
    buildClimbableTwoStoryHouse(sp.x, sp.z, sp.side, sp.var);
  });

  const shopSpecs = [
    { x: -17, z:  18, w: 8.5, d: 6.5, facing: 'north', type: 'fruit' },
    { x:  17, z:  18, w: 8.5, d: 6.5, facing: 'north', type: 'pottery' },
    { x: -18, z:  -2, w: 8.5, d: 6.5, facing: 'south', type: 'cloth' },
    { x:  18, z:  -2, w: 8.5, d: 6.5, facing: 'south', type: 'bakery' },
    { x: -32, z:  -2, w: 8.0, d: 6.5, facing: 'south', type: 'fruit' },
    { x:  32, z:  -2, w: 8.0, d: 6.5, facing: 'south', type: 'pottery' },
    { x: -46, z:  36, w: 8.5, d: 6.5, facing: 'north', type: 'cloth' },
    { x:  46, z: -38, w: 8.5, d: 6.5, facing: 'south', type: 'bakery' }
  ];
  shopSpecs.forEach((sh, idx) => {
    buildOpenShopBuildingWithKeeper(sh.x, sh.z, sh.w, sh.d, sh.facing, sh.type, idx);
  });

  const cityMazeBlocks = [
    { x: -60, z: -26, w: 7.5, h: 4.9, d: 28.0, v: 0 },
    { x: -36, z: -60, w: 30.0, h: 4.8, d: 7.5, v: 1 },
    { x: -36, z: -48, w: 20.0, h: 4.6, d: 7.5, v: 2 },
    { x: -28, z: -36, w: 7.5, h: 4.5, d: 16.0, v: 3 },
    { x: -30, z: -15, w: 15.0, h: 4.7, d: 7.5, v: 0 },
    { x: -58, z:  -4, w: 8.5, h: 4.7, d: 14.0, v: 1 },
    { x: -16, z: -20, w: 7.5, h: 4.8, d: 14.0, v: 2 },
    { x: -16, z: -56, w: 12.0, h: 4.7, d: 7.5, v: 0 },

    { x:  60, z: -26, w: 7.5, h: 4.9, d: 28.0, v: 1 },
    { x:  36, z: -60, w: 30.0, h: 4.8, d: 7.5, v: 0 },
    { x:  34, z: -48, w: 18.0, h: 4.6, d: 7.5, v: 3 },
    { x:  28, z: -36, w: 7.5, h: 4.5, d: 16.0, v: 2 },
    { x:  30, z: -15, w: 15.0, h: 4.7, d: 7.5, v: 1 },
    { x:  58, z:  -4, w: 8.5, h: 4.7, d: 14.0, v: 0 },
    { x:  16, z: -20, w: 7.5, h: 4.8, d: 14.0, v: 3 },
    { x:  20, z: -34, w: 8.5, h: 4.6, d: 7.5, v: 2 },
    { x:  16, z: -56, w: 12.0, h: 4.7, d: 7.5, v: 1 },

    { x: -60, z:  16, w: 7.5, h: 4.8, d: 22.0, v: 2 },
    { x: -42, z:   8, w: 8.5, h: 4.5, d: 12.0, v: 0 },
    { x: -60, z:  46, w: 7.5, h: 4.8, d: 24.0, v: 1 },
    { x: -40, z:  60, w: 28.0, h: 4.8, d: 7.5, v: 3 },
    { x: -34, z:  48, w: 18.0, h: 4.6, d: 7.5, v: 0 },
    { x: -29, z:  32, w: 8.0, h: 4.6, d: 18.0, v: 2 },
    { x: -17, z:  31, w: 9.0, h: 4.5, d: 12.0, v: 1 },
    { x: -18, z:  46, w: 10.0, h: 4.8, d: 7.5, v: 3 },
    { x: -18, z:  59, w: 10.0, h: 4.8, d: 7.5, v: 0 },

    { x:  60, z:  16, w: 7.5, h: 4.8, d: 22.0, v: 3 },
    { x:  42, z:   8, w: 8.5, h: 4.5, d: 12.0, v: 1 },
    { x:  60, z:  46, w: 7.5, h: 4.8, d: 24.0, v: 0 },
    { x:  40, z:  60, w: 28.0, h: 4.8, d: 7.5, v: 2 },
    { x:  34, z:  48, w: 18.0, h: 4.6, d: 7.5, v: 1 },
    { x:  31, z:  32, w: 8.0, h: 4.6, d: 18.0, v: 3 },
    { x:  30, z:  20, w: 10.0, h: 4.5, d: 7.0, v: 0 },
    { x:  18, z:  46, w: 10.0, h: 4.8, d: 7.5, v: 2 },
    { x:  18, z:  59, w: 10.0, h: 4.8, d: 7.5, v: 1 }
  ];

  cityMazeBlocks.forEach(b => {
    buildSolidCityBuildingBlock(b.x, b.z, b.w, b.h, b.d, b.v);
  });

  const wellMat = matDavidCached('#94a3b8', '#64748b');
  const woodMat = matDavidCached('#451a03');
  worldGroup.add(
    createBox(3.4, 1.1, 3.4, wellMat, 0, 0.55, 8),
    createBox(2.4, 0.2, 2.4, new THREE.MeshBasicMaterial({ color: 0x0284c7 }), 0, 0.95, 8, false),
    createBox(0.28, 2.6, 0.28, woodMat, -1.3, 2.1, 8),
    createBox(0.28, 2.6, 0.28, woodMat,  1.3, 2.1, 8),
    createBox(3.4, 0.35, 1.4, woodMat, 0, 3.4, 8)
  );
  registerCitySolidBox(0, 8, 3.4, 3.4, 3.5, 0.25);

  const pedestrianRoutes = [
    { x1: -10, z1:   8, x2:  10, z2:   8, spd: 2.3 },
    { x1:  12, z1:   6, x2: -12, z2:   6, spd: 2.1 },
    { x1:  -3, z1:  14, x2:  -3, z2:  52, spd: 2.4 },
    { x1:   3, z1:  52, x2:   3, z2:  14, spd: 2.2 },
    { x1: -34, z1:  -6, x2: -34, z2: -22, spd: 2.0 },
    { x1:  34, z1:  -6, x2:  34, z2: -22, spd: 2.1 },
    { x1: -50, z1: -36, x2: -50, z2:  -6, spd: 2.2 },
    { x1:  50, z1: -36, x2:  50, z2:  -6, spd: 2.2 },
    { x1: -23, z1:  16, x2: -23, z2:  40, spd: 2.3 },
    { x1:  24, z1:  12, x2:  50, z2:  12, spd: 2.1 },
    { x1: -50, z1:  54, x2: -26, z2:  54, spd: 2.0 },
    { x1:  26, z1:  54, x2:  50, z2:  54, spd: 2.0 },
    { x1: -50, z1: -54, x2: -24, z2: -54, spd: 2.1 },
    { x1:  24, z1: -54, x2:  50, z2: -54, spd: 2.1 }
  ];

  pedestrianRoutes.forEach((rt, idx) => {
    const pedMesh = (typeof createFollowerPersonMesh === 'function')
      ? createFollowerPersonMesh(idx)
      : createDetailedCityNpcMesh(idx % 2 === 0 ? 'merchant' : 'architect');
    pedMesh.position.set(rt.x1, 0, rt.z1);
    worldGroup.add(pedMesh);
    davidCityPedestrians.push({
      mesh: pedMesh,
      x1: rt.x1, z1: rt.z1,
      x2: rt.x2, z2: rt.z2,
      targetX: rt.x2, targetZ: rt.z2,
      forward: true,
      speed: rt.spd,
      heading: Math.atan2(rt.x2 - rt.x1, rt.z2 - rt.z1),
      phase: idx * 0.8
    });
  });
}

function buildQuestBuildableStructures(mapLimit = 68) {
  const marketRoot = new THREE.Group();
  marketRoot.position.set(-28, 0, 8);
  const basePad = createBox(8.5, 0.2, 6.0, matDavidCached('#d9a05b', '#92400e'), 0, 0.1, 0, false);
  const unfinishedFrame = createBox(8.2, 0.25, 5.8, new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35 }), 0, 0.25, 0, false);
  const completedMarket = new THREE.Group();
  const woodMat = matDavidCached('#78350f', '#451a03');
  const awning1 = matVoxel('#ef4444', '#b91c1c').clone();
  const awning2 = matVoxel('#fef08a', '#eab308').clone();
  completedMarket.add(
    createBox(8.2, 3.8, 0.7, makeDetailedBuildingWallMat(0), 0, 1.9, -2.5),
    createBox(0.45, 3.8, 0.45, woodMat, -3.6, 1.9, -2.4),
    createBox(0.45, 3.8, 0.45, woodMat,  3.6, 1.9, -2.4),
    createBox(0.45, 3.8, 0.45, woodMat, -3.6, 1.9,  2.4),
    createBox(0.45, 3.8, 0.45, woodMat,  3.6, 1.9,  2.4),
    createBox(8.6, 0.5, 3.1, awning1, 0, 4.0, -1.3),
    createBox(8.6, 0.5, 3.1, awning2, 0, 3.8,  1.3),
    createBox(6.8, 1.15, 1.6, woodMat, 0, 0.65, 0.4),
    createBox(1.2, 0.6, 1.0, matDavidCached('#f97316'), -1.8, 1.45, 0.4),
    createBox(1.2, 0.6, 1.0, matDavidCached('#22c55e'),  0.0, 1.45, 0.4),
    createBox(1.2, 0.6, 1.0, matDavidCached('#a855f7'),  1.8, 1.45, 0.4)
  );
  completedMarket.visible = false;
  marketRoot.add(basePad, unfinishedFrame, completedMarket);
  marketRoot.userData = { unfinishedFrame, completedMarket, cx: -28, cz: 8, w: 8.5, d: 6.0, topY: 4.3 };
  worldGroup.add(marketRoot);
  davidCityBuildings.marketGroup = marketRoot;

  const houseRoot = new THREE.Group();
  houseRoot.position.set(28, 0, 8);
  const hPad = createBox(9.0, 0.25, 7.0, matDavidCached('#94a3b8', '#64748b'), 0, 0.12, 0, false);
  const hUnfinished = createBox(8.6, 0.3, 6.6, new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35 }), 0, 0.28, 0, false);
  const completedHouse = new THREE.Group();
  const stoneWall = makeDetailedBuildingWallMat(1);
  const woodBeam = matVoxel('#78350f', '#451a03').clone();
  completedHouse.add(
    createBox(8.4, 4.6, 6.4, stoneWall, 0, 2.3, 0),
    createBox(8.8, 0.5, 6.8, woodBeam, 0, 4.8, 0),
    createBox(4.8, 2.5, 4.4, makeDetailedBuildingWallMat(2), 1.2, 6.2, -0.5),
    createBox(5.2, 0.4, 4.8, woodBeam, 1.2, 7.6, -0.5),
    createBox(1.6, 2.8, 0.3, woodBeam, -1.2, 1.4, 3.25),
    createBox(1.3, 1.3, 0.25, matDavidCached('#1e293b'), 2.0, 2.6, 3.25)
  );
  completedHouse.visible = false;
  houseRoot.add(hPad, hUnfinished, completedHouse);
  houseRoot.userData = { unfinishedFrame: hUnfinished, completedHouse, cx: 28, cz: 8, w: 8.8, d: 6.8, topY: 7.8 };
  worldGroup.add(houseRoot);
  davidCityBuildings.houseGroup = houseRoot;

  const gateZ = mapLimit;
  const gateRoot = new THREE.Group();
  gateRoot.position.set(0, 0, gateZ);
  const towerMat = makeDetailedBuildingWallMat(0);
  const ironMat = matDavidCached('#475569', '#1e293b');
  const goldStud = matDavidCached('#facc15');

  const tL = createBox(7.2, 10.5, 5.8, towerMat, -7.8, 5.25, 0);
  const tR = createBox(7.2, 10.5, 5.8, makeDetailedBuildingWallMat(0),  7.8, 5.25, 0);
  const tTop = createBox(22.8, 2.4, 5.8, makeDetailedBuildingWallMat(1), 0, 10.2, 0);
  gateRoot.add(tL, tR, tTop);
  wallMeshes.push(tL, tR, tTop);

  registerCitySolidBox(-7.8, gateZ, 7.2, 5.8, 10.5, 0.20);
  registerCitySolidBox( 7.8, gateZ, 7.2, 5.8, 10.5, 0.20);
  registerCitySolidBox( 0.0, gateZ - 0.4, 8.6, 2.2, 10.5, 0.15);

  const brokenGate = new THREE.Group();
  const bDoorL = createBox(3.6, 6.5, 0.5, matDavidCached('#78350f'), -2.4, 3.0, 0);
  bDoorL.rotation.z = -0.28;
  const bDoorR = createBox(3.6, 6.0, 0.5, matDavidCached('#78350f'),  2.5, 2.6, 0.8);
  bDoorR.rotation.x = 0.35;
  brokenGate.add(bDoorL, bDoorR);

  const repairedGate = new THREE.Group();
  repairedGate.add(
    createBox(3.8, 7.4, 0.65, ironMat, -2.1, 3.7, 0),
    createBox(3.8, 7.4, 0.65, ironMat,  2.1, 3.7, 0),
    createBox(3.2, 0.4, 0.72, goldStud, -2.1, 5.4, 0),
    createBox(3.2, 0.4, 0.72, goldStud,  2.1, 5.4, 0),
    createBox(3.2, 0.4, 0.72, goldStud, -2.1, 2.2, 0),
    createBox(3.2, 0.4, 0.72, goldStud,  2.1, 2.2, 0)
  );
  repairedGate.visible = false;

  gateRoot.add(brokenGate, repairedGate);
  gateRoot.userData = { brokenGate, repairedGate };
  worldGroup.add(gateRoot);
  davidCityBuildings.gateGroup = gateRoot;
}

// -------------------------------------------------------------------------
// 6. 난이도별 맞춤형 랜덤 자원 스폰 & 퀘스트 수락 시 보유 자원 0 초기화
// -------------------------------------------------------------------------
function spawnDavidCityResourceNode(kind, x, z, baseY = 0) {
  const grp = new THREE.Group();
  let visualMesh, ringCol, title;

  if (kind === 'wood') {
    visualMesh = createLogBlockMesh(1.15, 0.72, 0.85);
    visualMesh.position.y = 0.55;
    ringCol = 0x22c55e;
    title = '🪵 백향목 나무 자재';
  } else if (kind === 'stone') {
    visualMesh = new THREE.Group();
    visualMesh.add(
      createBox(1.05, 0.75, 0.95, matDavidCached('#cbd5e1', '#64748b'), 0, 0.45, 0),
      createBox(0.75, 0.45, 0.75, matDavidCached('#f8fafc', '#94a3b8'), 0, 0.85, 0)
    );
    ringCol = 0x38bdf8;
    title = '🪨 다듬은 건축용 돌';
  } else {
    visualMesh = new THREE.Group();
    visualMesh.add(
      createBox(0.95, 0.72, 0.95, matDavidCached('#334155', '#0f172a'), 0, 0.42, 0),
      createBox(0.45, 0.45, 0.45, matDavidCached('#38bdf8', '#0284c7'), -0.22, 0.78, 0.15, false),
      createBox(0.38, 0.38, 0.38, matDavidCached('#facc15'), 0.24, 0.72, -0.15, false)
    );
    ringCol = 0xf59e0b;
    title = '⚙️ 단단한 철광석';
  }

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.9, 1.28, 20),
    new THREE.MeshBasicMaterial({ color: ringCol, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.06;

  grp.add(visualMesh, ring);
  grp.position.set(x, baseY, z);
  worldGroup.add(grp);

  const floorTag = baseY > 1.5 ? ' (2층 옥상)' : '';
  davidCityResources.push({
    kind,
    title: `${title}${floorTag}`,
    group: grp,
    mesh: visualMesh,
    baseY,
    pos: new THREE.Vector3(x, baseY + 0.5, z),
    beingPickedUp: false,
    pickupTimer: 0,
    assignedRetainerIdx: 0,
    collected: false,
    respawnTimer: 0,
    label: createWorldLabel(`${title}${floorTag}`)
  });
}

function spawnRandomizedStage3Resources() {
  davidCityResources.forEach(res => {
    if (res.group) worldGroup.remove(res.group);
    if (res.label) res.label.remove();
  });
  davidCityResources = [];

  davidRetainers.forEach(ret => {
    ret.fetchingRes = null;
    ret.pickupAnimTimer = 0;
  });

  const easyPools = {
    wood: [
      [-14, 8, 0], [-19, 4, 0], [-12, 14, 0], [-25, 16, 0], [-8, -2, 0], [-15, -8, 0], [8, 14, 0], [-6, 20, 0]
    ],
    stone: [
      [14, 8, 0], [19, 4, 0], [12, 14, 0], [25, 16, 0], [8, -2, 0], [15, -8, 0], [6, 20, 0], [18, 24, 0]
    ],
    iron: [
      [-6, 30, 0], [6, 30, 0], [-4, 46, 0], [4, 46, 0], [0, 24, 0], [-8, 38, 0], [8, 38, 0], [0, 50, 0]
    ]
  };

  const mediumPools = {
    wood: [
      [-34, -8, 0], [34, -8, 0], [-24, -22, 0], [24, -22, 0],
      [-40.5, -24.5, 3.6], [40.5, -24.5, 3.6], [-34, 14, 0], [-24, -38, 0], [24, -38, 0]
    ],
    stone: [
      [34, 12, 0], [24, 24, 0], [38, 28, 0], [40.5, 23.5, 3.6],
      [18.5, 31.5, 3.6], [48, 8, 0], [24, 40, 0], [36, -18, 0]
    ],
    iron: [
      [-34, 18, 0], [-24, 26, 0], [-24, 42, 0], [-40.5, 23.5, 3.6],
      [-18.5, -32.5, 3.6], [-48, 8, 0], [-36, 38, 0], [8, 48, 0]
    ]
  };

  const hardPools = {
    wood: [
      [-52.5, -46.5, 3.6], [-40.5, -24.5, 3.6], [40.5, -24.5, 3.6],
      [-46, -54, 0], [46, -54, 0], [-52, -32, 0], [52, -32, 0], [-35, -42, 0], [35, -42, 0]
    ],
    stone: [
      [52.5, 49.5, 3.6], [40.5, 23.5, 3.6], [18.5, 31.5, 3.6],
      [48, 54, 0], [52, 26, 0], [52, -16, 0], [38, 42, 0], [48, -42, 0]
    ],
    iron: [
      [-40.5, 23.5, 3.6], [-18.5, -32.5, 3.6],
      [-48, 54, 0], [-52, 28, 0], [-52, -16, 0], [-38, 42, 0], [-48, -42, 0], [46, 54, 0]
    ]
  };

  const isKinder = (currentMode === 'kinder');
  const isHard = (currentMode === 'senior' || currentMode === 'timeattack');
  const selectedPools = isKinder ? easyPools : (isHard ? hardPools : mediumPools);
  const spawnCountPerKind = isKinder ? 6 : 5;

  ['wood', 'stone', 'iron'].forEach(kind => {
    const shuffled = [...selectedPools[kind]].sort(() => Math.random() - 0.5);
    const chosen = shuffled.slice(0, spawnCountPerKind);

    chosen.forEach(([bx, bz, by]) => {
      let fx = bx;
      let fz = bz;
      if (by === 0) {
        for (let attempt = 0; attempt < 5; attempt++) {
          const candX = bx + (Math.random() - 0.5) * 3.2;
          const candZ = bz + (Math.random() - 0.5) * 3.2;
          if (isCityFloorSpotClear(candX, candZ, 1.25)) {
            fx = candX;
            fz = candZ;
            break;
          }
        }
      }
      spawnDavidCityResourceNode(kind, fx, fz, by);
    });
  });
}

function resetDavidStage3InventoryAndRespawnResources() {
  davidInventory.wood = 0;
  davidInventory.stone = 0;
  davidInventory.iron = 0;
  spawnRandomizedStage3Resources();
  updateDavidStage3InventoryHUD();
  updateDavidStage3QuestTrackerUI();
}

function updateDavidStage3InventoryHUD() {
  if (carriedBlockGroup) {
    while (carriedBlockGroup.children.length > 0) carriedBlockGroup.remove(carriedBlockGroup.children[0]);
  }

  const items = [];
  for (let i = 0; i < davidInventory.wood; i++) items.push('#78350f');
  for (let i = 0; i < davidInventory.stone; i++) items.push('#94a3b8');
  for (let i = 0; i < davidInventory.iron; i++) items.push('#38bdf8');

  davidRetainers.forEach((ret, rIdx) => {
    const pack = ret.mesh.userData.packGroup;
    if (!pack) return;
    while (pack.children.length > 0) pack.remove(pack.children[0]);
    const myItems = items.filter((_, idx) => (idx % 2) === rIdx);
    myItems.slice(0, 4).forEach((hex, sIdx) => {
      pack.add(createBox(0.56, 0.28, 0.42, matDavidCached(hex), 0, sIdx * 0.30, 0, false));
    });
  });

  const hudBox = document.getElementById('hud-block-box');
  if (currentEpisode === 'david' && currentStage === 3) {
    hudBox.classList.remove('hidden'); hudBox.classList.add('flex');
    document.getElementById('hud-block-text').textContent =
      `🪵${davidInventory.wood} · 🪨${davidInventory.stone} · ⚙️${davidInventory.iron}`;
  }
  updateDavidStage3QuestTrackerUI();
}

function buildDavidStage3World() {
  clearWorld();
  ensureDavidCustomUI();
  ensureDavidStage3QuestTrackerUI();
  hideAllDavidCustomUI();

  scene.background = new THREE.Color(0x38bdf8);
  scene.fog = new THREE.Fog(0xbae6fd, 95, 270);

  const mapLimit = 68;
  const isKinder = (currentMode === 'kinder');
  const isHard = (currentMode === 'senior' || currentMode === 'timeattack');

  currentMapRectBounds = {
    minX: -mapLimit + 2.4,
    maxX:  mapLimit - 2.4,
    minZ: -mapLimit + 2.4,
    maxZ:  mapLimit - 2.2
  };

  davidCityNpcs = [];
  davidCityResources = [];
  davidRetainers = [];
  davidCityShopkeepers = [];
  davidCityPedestrians = [];
  davidCityBuildingBoxes = [];
  davidInventory = { wood: 0, stone: 0, iron: 0 };
  davidCurrentActiveQuestNpc = null;
  davidActiveNearNpc = null;
  davidDialogTargetNpc = null;
  davidNpcAutoDialogCooldown = 0;
  davidProphetUnlocked = false;
  davidStage3Cutscene.active = false;

  if (currentMode === 'timeattack') {
    timeRemaining = 32.0;
  }

  const cityStoneMat = new THREE.MeshLambertMaterial({ map: makeDavidCityStoneTex() });
  const royalRoadMat = matDavidCached('#e5c494', '#c29b61');
  const plazaMat = matDavidCached('#cbd5e1', '#94a3b8');

  const baseGround = createBox(mapLimit * 2.2, 1, mapLimit * 2.2, cityStoneMat, 0, -0.5, 0, false);
  baseGround.receiveShadow = true;
  worldGroup.add(baseGround);

  worldGroup.add(
    createBox(8.2, 0.06, mapLimit * 2, royalRoadMat, 0, 0.03, 0, false),
    createBox(mapLimit * 2, 0.06, 7.4, royalRoadMat, 0, 0.03, 8, false),
    createBox(22, 0.08, 18, plazaMat, 0, 0.04, 8, false)
  );

  buildDavidCastleWallPerimeter(mapLimit, true);
  buildDavidCityPalace(0, -14);
  buildDavidCityTabernacle(0, -50);
  buildDenseMazeCityAndStreets();
  buildQuestBuildableStructures(mapLimit);

  spawnRandomizedStage3Resources();

  const reqWood1 = isKinder ? 1 : 2;
  const reqStone2 = isKinder ? 1 : (isHard ? 2 : 1);
  const reqWood2 = isKinder ? 1 : (isHard ? 2 : 1);
  const reqIron3 = isKinder ? 1 : 2;

  const npcConfigs = [
    {
      id: 'merchant',
      roleTitle: '🏪 상인',
      x: -22.5, z: 11.5,
      rotY: 0,
      pitch: 1.15,
      beaconColor: 0xfacc15,
      req: { wood: reqWood1, stone: 0, iron: 0 },
      questLine: `"왕이시여, 상가를 지어야 하는데 나무가 필요합니다! 지금부터 성 안의 나무 ${reqWood1}개를 새로 구해주시옵소서!"`,
      thanksLine: `"오오! 다윗 왕이시여 감사합니다! 왕께서 주신 나무로 멋진 상가를 세웠습니다!"`
    },
    {
      id: 'architect',
      roleTitle: '📐 건축가',
      x: 22.5, z: 11.5,
      rotY: 0,
      pitch: 0.92,
      beaconColor: 0x38bdf8,
      req: { wood: reqWood2, stone: reqStone2, iron: 0 },
      questLine: `"왕이시여, 집을 지어야 하는데 돌과 나무가 필요합니다! 지금부터 돌 ${reqStone2}개와 나무 ${reqWood2}개를 새로 찾아주시옵소서!"`,
      thanksLine: `"찬양받으소서 다윗 왕이시여! 튼튼한 돌과 나무 덕분에 백성들의 집이 완성되었습니다!"`
    },
    {
      id: 'guard',
      roleTitle: '🛡️ 경비병',
      x: -2.5, z: mapLimit - 9.5,
      rotY: Math.PI,
      pitch: 0.78,
      beaconColor: 0xf97316,
      req: { wood: 0, stone: 0, iron: reqIron3 },
      questLine: `"왕이시여, 성벽 대성문이 고장나 성문을 고쳐야 합니다! 지금부터 철 ${reqIron3}개를 새로 찾아 갖다주시옵소서!"`,
      thanksLine: `"충성! 왕께서 가져다주신 철로 다윗성의 남쪽 대성문을 완벽히 고쳤습니다!"`
    },
    {
      id: 'herald',
      roleTitle: '📯 왕궁 전령',
      x: 0, z: -4.5,
      rotY: 0,
      pitch: 1.25,
      beaconColor: 0xa855f7,
      req: null,
      questLine: `"왕이시여! 성 안의 상인, 건축가, 경비병의 요청을 한 분씩 차례대로 해결해 주시옵소서!"`,
      thanksLine: `"왕이시여! 온 백성이 왕의 지혜를 칭송하고 있습니다! 이제 북쪽 끝 언약의 성막 앞에 계신 선지자님께 가보시옵소서!"`
    }
  ];

  npcConfigs.forEach(cfg => {
    const npcGrp = new THREE.Group();
    const mesh = createDetailedCityNpcMesh(cfg.id);
    if (cfg.rotY) mesh.rotation.y = cfg.rotY;
    const beacon = createNpcSkyBeacon(cfg.beaconColor);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.3, 1.8, 28),
      new THREE.MeshBasicMaterial({ color: cfg.beaconColor, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.06;

    npcGrp.add(mesh, beacon, ring);
    npcGrp.position.set(cfg.x, 0, cfg.z);
    worldGroup.add(npcGrp);

    const lbl = createWorldLabel(`💬 ${cfg.roleTitle}`);
    davidCityNpcs.push({
      ...cfg,
      group: npcGrp,
      mesh,
      beacon,
      ring,
      pos: new THREE.Vector3(cfg.x, 0.5, cfg.z),
      started: false,
      completed: false,
      autoPromptedInZone: false,
      label: lbl
    });
  });

  const prophetGrp = new THREE.Group();
  const prophetMesh = createSamuelMesh();
  const prophetBeacon = createNpcSkyBeacon(0x22d3ee);
  prophetBeacon.visible = false;
  prophetGrp.add(prophetMesh, prophetBeacon);
  prophetGrp.position.set(0, 0, -42.5);
  worldGroup.add(prophetGrp);

  const prophetRing = new THREE.Mesh(
    new THREE.RingGeometry(1.5, 2.1, 28),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide })
  );
  prophetRing.rotation.x = -Math.PI / 2;
  prophetRing.position.set(0, 0.07, -40.5);
  prophetRing.visible = false;
  worldGroup.add(prophetRing);

  targetObject = {
    type: 'nathan_prophet',
    mesh: prophetMesh,
    beacon: prophetBeacon,
    spotRing: prophetRing,
    pos: new THREE.Vector3(0, 1.2, -40.5),
    label: createWorldLabel('✨ 나단 선지자 (백성들의 민원을 모두 마친 뒤 오세요!)'),
    triggered: false
  };

  const retainerNames = ['왕실 보좌관', '왕실 서기관'];
  [-1.4, 1.4].forEach((ox, rIdx) => {
    const rMesh = createDavidRetainerMesh(rIdx);
    rMesh.position.set(ox, 0, 16.2);
    rMesh.rotation.y = Math.PI;
    worldGroup.add(rMesh);
    davidRetainers.push({
      index: rIdx,
      name: retainerNames[rIdx],
      mesh: rMesh,
      heading: Math.PI,
      fetchingRes: null,
      pickupAnimTimer: 0
    });
  });

  playerPos.set(0, 0, 14.0);
  lastGroundedY = 0;
  playerVelY = 0; isGrounded = true; playerFacing = Math.PI;
  cameraYaw = 0; cameraTargetYaw = 0;
  rebuildPlayerAppearance();
  if (playerGroup) playerGroup.rotation.y = Math.PI;
  if (guideArrowGroup) guideArrowGroup.visible = (currentMode !== 'senior');
  snapCameraToPlayer();
  updateStageHUD();
  updateDavidStage3QuestTrackerUI();
  showToast('👑 빛기둥 아래 백성에게 다가가 퀘스트를 받으세요! (각도 버튼 사이에서 시점도 전환할 수 있어요)');
}
// =========================================================================
// [ep3_david_st3_end.js - 후반부 (2/2)] 에피소드 3 : 스테이지 3 진행 로직, 암전 성경절 엔딩 및 플러그인 등록
// - 스테이지 2 시작 대화 버튼 연동 및 스테이지 3 단일 퀘스트 잠금·수락 시 자원 0 초기화
// - 스테이지 3 퀘스트 완료 후 지어진 건물(상가·새 집) 관통 방지 충돌 잠금(lockCompletedQuestBuilding)
// - 엔딩: 빈 왕좌 착석 -> 암전 후 메시아 성경절 화면 표시 및 남자 성우 음성 낭독 -> 인증서 자동 오픈
// =========================================================================

// -------------------------------------------------------------------------
// 1. NPC 말풍선 대화창 (단일 퀘스트 잠금, 수락 시 자원 0 초기화, 완공 건물 충돌 잠금)
// -------------------------------------------------------------------------
function syncCityNpcBeaconsForActiveQuest() {
  davidCityNpcs.forEach(n => {
    if (!n.beacon) return;
    if (n.completed) {
      n.beacon.visible = false;
    } else if (davidCurrentActiveQuestNpc) {
      n.beacon.visible = (n === davidCurrentActiveQuestNpc);
    } else {
      const allThreeDone = davidCityNpcs.filter(x => x.id !== 'herald').every(x => x.completed);
      n.beacon.visible = (n.id === 'herald') ? allThreeDone : true;
    }
  });
}

function openDavidNpcDialog(npc) {
  ensureDavidCustomUI();
  ensureDavidStage3QuestTrackerUI();
  const dlg = document.getElementById('david-npc-dialog');
  const nameEl = document.getElementById('david-npc-name');
  const textEl = document.getElementById('david-npc-text');
  const btnEl = document.getElementById('david-npc-action-btn');
  if (!dlg || !npc) return;

  if (!dlg.classList.contains('hidden')) return;

  davidDialogTargetNpc = npc;
  npc.autoPromptedInZone = true;
  dlg.classList.remove('hidden');
  nameEl.textContent = npc.roleTitle;

  let fullLine = '';
  let canCompleteNow = false;
  let canAcceptNewQuest = false;

  if (
    davidCurrentActiveQuestNpc &&
    davidCurrentActiveQuestNpc !== npc &&
    !davidCurrentActiveQuestNpc.completed
  ) {
    fullLine = `"왕이시여! 지금은 먼저 약속하신 [${davidCurrentActiveQuestNpc.roleTitle}]의 요청을 진행 중이십니다. 그 일을 먼저 마친 뒤에 찾아주시옵소서!"`;
    btnEl.textContent = '먼저 해결하고 오겠네';
  } else if (npc.id === 'herald') {
    const allThreeDone = davidCityNpcs.filter(n => n.id !== 'herald').every(n => n.completed);
    npc.started = true;
    if (allThreeDone) {
      fullLine = npc.thanksLine;
      btnEl.textContent = '✨ 선지자님께 가겠네!';
      canCompleteNow = true;
    } else {
      fullLine = npc.questLine;
      btnEl.textContent = '해결해주겠네';
    }
  } else if (npc.completed) {
    fullLine = npc.thanksLine;
    btnEl.textContent = '평안하길 바라네!';
  } else if (davidCurrentActiveQuestNpc === npc) {
    const hasEnough =
      davidInventory.wood >= npc.req.wood &&
      davidInventory.stone >= npc.req.stone &&
      davidInventory.iron >= npc.req.iron;

    npc._hadEnoughWhenOpened = hasEnough;
    if (hasEnough) {
      fullLine = npc.thanksLine;
      btnEl.textContent = '🔨 자재 건네주고 완성하기!';
      canCompleteNow = true;
    } else {
      fullLine = npc.questLine;
      btnEl.textContent = '계속 찾아보겠네';
    }
  } else {
    canAcceptNewQuest = true;
    npc._hadEnoughWhenOpened = false;
    fullLine = npc.questLine;
    btnEl.textContent = '해결해주겠네';
  }

  npc._pendingAcceptNewQuest = canAcceptNewQuest;
  npc._pendingComplete = canCompleteNow;
  textEl.textContent = '';

  if (npc._typingTimer) clearInterval(npc._typingTimer);
  let shownLen = 0;
  npc._typingTimer = setInterval(() => {
    shownLen += 2;
    textEl.textContent = fullLine.slice(0, shownLen);
    if (shownLen >= fullLine.length) {
      clearInterval(npc._typingTimer);
      npc._typingTimer = null;
    }
  }, 35);

  playAnimaleseSpeech(fullLine, npc.pitch || 1.0);
}

window.confirmDavidNpcDialog = function () {
  // 스테이지 2 시작 대면 대화 중일 때는 스테이지 2 대화 진행 함수로 연결
  if (
    currentEpisode === 'david' &&
    currentStage === 2 &&
    davidStage2Dialogue.active
  ) {
    window.advanceDavidStage2Dialogue();
    return;
  }

  const dlg = document.getElementById('david-npc-dialog');
  if (dlg) dlg.classList.add('hidden');
  if (animaleseTimer) { clearInterval(animaleseTimer); animaleseTimer = null; }

  davidNpcAutoDialogCooldown = 1.5;

  const npc = davidDialogTargetNpc;
  davidDialogTargetNpc = null;
  if (!npc) return;
  if (npc._typingTimer) { clearInterval(npc._typingTimer); npc._typingTimer = null; }

  npc.autoPromptedInZone = true;

  // 새 퀘스트를 수락하는 순간 보유 자원을 0으로 초기화하고 난이도별 랜덤 위치에 자원 재배치
  if (npc._pendingAcceptNewQuest) {
    npc._pendingAcceptNewQuest = false;
    npc.started = true;
    davidCurrentActiveQuestNpc = npc;

    resetDavidStage3InventoryAndRespawnResources();
    syncCityNpcBeaconsForActiveQuest();
    updateStageHUD();

    playSfx('switch');
    showToast(`📜 [${npc.roleTitle}] 퀘스트 시작! 보유 자원이 0으로 초기화되었으니 지금부터 새로 수집하세요!`);
    return;
  }

  // 퀘스트 완료 처리
  if (npc._pendingComplete) {
    npc._pendingComplete = false;
    if (npc.id === 'herald') {
      npc.completed = true;
      davidCurrentActiveQuestNpc = null;
      syncCityNpcBeaconsForActiveQuest();
      npc.ring.material.color.setHex(0x22c55e);
      npc.label.innerHTML = `✅ ${npc.roleTitle} (북쪽 성막의 선지자님께 가세요!)`;
      davidProphetUnlocked = true;
      if (targetObject && targetObject.spotRing) targetObject.spotRing.visible = true;
      if (targetObject && targetObject.beacon) targetObject.beacon.visible = true;
      if (targetObject && targetObject.label) {
        targetObject.label.innerHTML = '✨ 나단 선지자 (다가가서 하나님의 영원한 언약 듣기!)';
      }
      updateDavidStage3QuestTrackerUI();
      playSfx('clear');
      updateStageHUD();
      showToast('✨ 북쪽 언약의 성막 위로 푸른 빛기둥이 솟아올랐어요! 나단 선지자님께 나아가세요!');
      return;
    }

    davidInventory.wood = 0;
    davidInventory.stone = 0;
    davidInventory.iron = 0;

    npc.completed = true;
    davidCurrentActiveQuestNpc = null;
    syncCityNpcBeaconsForActiveQuest();
    updateDavidStage3InventoryHUD();
    updateDavidStage3QuestTrackerUI();

    npc.ring.material.color.setHex(0x22c55e);
    npc.label.innerHTML = `✅ ${npc.roleTitle} (해결 완료!)`;
    playSfx('hammer');
    playSfx('rescue');
    if (currentMode === 'timeattack') timeRemaining += 6.0;

    // 완성된 상가·새 집 건물을 뚫고 지나갈 수 없도록 충돌 박스 즉시 활성화
    if (npc.id === 'merchant' && davidCityBuildings.marketGroup) {
      const u = davidCityBuildings.marketGroup.userData;
      u.unfinishedFrame.visible = false;
      u.completedMarket.visible = true;
      lockCompletedQuestBuilding(u.cx, u.cz, u.w, u.d, u.topY, u.completedMarket);
      showToast('🏪 상인의 상가가 멋지게 지어졌습니다! 이제 다음 빛기둥의 백성을 만나보세요!');
    } else if (npc.id === 'architect' && davidCityBuildings.houseGroup) {
      const u = davidCityBuildings.houseGroup.userData;
      u.unfinishedFrame.visible = false;
      u.completedHouse.visible = true;
      lockCompletedQuestBuilding(u.cx, u.cz, u.w, u.d, u.topY, u.completedHouse);
      showToast('🏠 건축가의 새 집이 튼튼하게 완성되었습니다! 이제 다음 빛기둥의 백성을 만나보세요!');
    } else if (npc.id === 'guard' && davidCityBuildings.gateGroup) {
      davidCityBuildings.gateGroup.userData.brokenGate.visible = false;
      davidCityBuildings.gateGroup.userData.repairedGate.visible = true;
      showToast('🛡️ 고장났던 다윗성 남쪽 대성문이 철로 단단히 수리되었습니다!');
    }

    const doneCount = davidCityNpcs.filter(n => n.id !== 'herald' && n.completed).length;
    if (doneCount >= 3) {
      const herald = davidCityNpcs.find(n => n.id === 'herald');
      if (herald) {
        herald.autoPromptedInZone = false;
        herald.ring.material.color.setHex(0x38bdf8);
        herald.label.innerHTML = '📯 왕궁 전령 (선지자님 위치를 알려드려요!)';
      }
      syncCityNpcBeaconsForActiveQuest();
      showToast('🎉 백성들의 3가지 요청을 모두 해결했어요! 보랏빛 원통 기둥이 있는 중앙 궁전 앞 [왕궁 전령]에게 가보세요!');
    }
    updateStageHUD();
  }
};

function updateDavidStage3HUD(badge, countIcon, countText, missionText) {
  updateDavidStage3InventoryHUD();
  const doneCount = davidCityNpcs.filter(n => n.id !== 'herald' && n.completed).length;
  badge.textContent = '다윗성 · 스테이지 3';
  countIcon.textContent = '👑';
  countText.textContent = davidProphetUnlocked ? '선지자 방문' : `민원 ${doneCount}/3 완료`;

  if (davidProphetUnlocked) {
    missionText.textContent = '북쪽 언약의 성막 앞으로 가서 선지자를 통해 하나님의 영원한 언약을 들으세요!';
  } else if (davidCurrentActiveQuestNpc) {
    missionText.textContent = `현재 진행 중: [${davidCurrentActiveQuestNpc.roleTitle}]의 요청 자재를 새로 모아 전달하세요!`;
  } else if (doneCount >= 3) {
    missionText.textContent = '3가지 민원을 모두 해결했어요! 중앙 왕궁 앞 [왕궁 전령]에게 가세요!';
  } else {
    missionText.textContent = '하늘까지 솟은 빛기둥의 백성에게 다가가 한 분씩 차례대로 퀘스트를 받아 해결하세요!';
  }
}

function triggerDavidStage3Action(targetObj) {
  if (!davidProphetUnlocked) {
    playSfx('wrong');
    showToast('👑 먼저 상인·건축가·경비병의 요청을 모두 해결하고 왕궁 전령에게 안내를 받으세요!');
    return;
  }
  targetObj.triggered = true;
  startDavidStage3CovenantCutscene();
}

// -------------------------------------------------------------------------
// 2. 상가 건물 내부 주인(8명), 골목길 행인(14명), 신하(2명) 및 자재 수집 업데이트
// -------------------------------------------------------------------------
function updateCityShopkeepersAndPedestrians(dt, now) {
  davidCityShopkeepers.forEach((sk) => {
    const u = sk.mesh.userData;
    if (u && u.lArm && u.rArm) {
      const w = Math.sin(now * 0.005 + sk.phase) * 0.32;
      u.lArm.rotation.x = -0.5 + w;
      u.rArm.rotation.x = -0.5 - w;
    }
  });

  davidCityPedestrians.forEach((ped, idx) => {
    const u = ped.mesh.userData;
    const dToKing = Math.hypot(playerPos.x - ped.mesh.position.x, playerPos.z - ped.mesh.position.z);

    if (dToKing < 2.3 && Math.abs(playerPos.y) < 1.0) {
      const toKingAng = Math.atan2(playerPos.x - ped.mesh.position.x, playerPos.z - ped.mesh.position.z);
      ped.heading = lerpAngle(ped.heading, toKingAng, dt * 10);
      ped.mesh.rotation.y = ped.heading;
      if (u) {
        if (u.lLeg) u.lLeg.rotation.x = 0;
        if (u.rLeg) u.rLeg.rotation.x = 0;
        if (u.lArm) u.lArm.rotation.x = -0.85;
        if (u.rArm) u.rArm.rotation.x = -0.85;
      }
      return;
    }

    const dx = ped.targetX - ped.mesh.position.x;
    const dz = ped.targetZ - ped.mesh.position.z;
    const dist = Math.hypot(dx, dz);

    if (dist < 0.45) {
      ped.forward = !ped.forward;
      ped.targetX = ped.forward ? ped.x2 : ped.x1;
      ped.targetZ = ped.forward ? ped.z2 : ped.z1;
    } else {
      const step = Math.min(dist, ped.speed * dt);
      ped.mesh.position.x += (dx / dist) * step;
      ped.mesh.position.z += (dz / dist) * step;
      ped.heading = lerpAngle(ped.heading, Math.atan2(dx, dz), dt * 8);
      ped.mesh.rotation.y = ped.heading;

      const swing = Math.sin(now * 0.014 + ped.phase + idx) * 0.55;
      if (u) {
        if (u.lLeg) u.lLeg.rotation.x = swing;
        if (u.rLeg) u.rLeg.rotation.x = -swing;
        if (u.lArm) u.lArm.rotation.x = -swing * 0.65;
        if (u.rArm) u.rArm.rotation.x = swing * 0.65;
      }
    }
  });
}

function updateDavidRetainersAndResources(dt, now) {
  davidCityResources.forEach((res, idx) => {
    if (res.collected) {
      res.respawnTimer -= dt;
      if (res.respawnTimer <= 0) {
        res.collected = false;
        res.beingPickedUp = false;
        res.pickupTimer = 0;
        res.group.visible = true;
        res.group.scale.set(1, 1, 1);
      }
      return;
    }

    res.mesh.rotation.y += dt * 2.0;
    const horizDist = Math.hypot(playerPos.x - res.pos.x, playerPos.z - res.pos.z);
    const heightDiff = Math.abs(playerPos.y - res.baseY);
    updateWorldLabelPos(res.label, res.pos, horizDist < 24);

    if (!res.beingPickedUp && horizDist < 3.8 && heightDiff < 1.8) {
      res.beingPickedUp = true;
      res.pickupTimer = 0;
      const idleRet = davidRetainers.find(r => !r.fetchingRes) || davidRetainers[idx % Math.max(1, davidRetainers.length)];
      if (idleRet) {
        res.assignedRetainerIdx = idleRet.index;
        idleRet.fetchingRes = res;
        idleRet.pickupAnimTimer = 0.55;
      }
      playSfx('build');
    }

    if (res.beingPickedUp) {
      res.pickupTimer += dt;
      const p = Math.min(1, res.pickupTimer / 0.45);
      const sc = Math.max(0.1, 1 - p * 0.85);
      res.group.scale.set(sc, sc, sc);
      res.mesh.rotation.y += dt * 10;

      if (res.pickupTimer >= 0.45) {
        res.beingPickedUp = false;
        res.collected = true;
        res.respawnTimer = 8.5;
        res.group.visible = false;
        res.label.style.opacity = '0';

        const ret = davidRetainers[res.assignedRetainerIdx];
        if (ret && ret.fetchingRes === res) {
          ret.fetchingRes = null;
        }

        davidInventory[res.kind] = (davidInventory[res.kind] || 0) + 1;
        updateDavidStage3InventoryHUD();

        if (davidCurrentActiveQuestNpc && davidCurrentActiveQuestNpc.req) {
          const req = davidCurrentActiveQuestNpc.req;
          const nowEnough =
            davidInventory.wood >= req.wood &&
            davidInventory.stone >= req.stone &&
            davidInventory.iron >= req.iron;
          if (nowEnough && !davidCurrentActiveQuestNpc._hadEnoughWhenOpened) {
            davidCurrentActiveQuestNpc.autoPromptedInZone = false;
          }
        }

        playSfx('rescue');
        if (currentMode === 'timeattack') timeRemaining += 3.0;
        const retName = ret ? ret.name : '신하';
        if (!davidCurrentActiveQuestNpc) {
          showToast(`🙌 ${retName}이(가) ${res.title}을(를) 챙겼습니다! (※ 퀘스트를 받으면 자원이 0으로 초기화됩니다!)`);
        } else {
          showToast(`🙌 ${retName}이(가) ${res.title}을(를) 정성껏 챙겼습니다! (🪵${davidInventory.wood} · 🪨${davidInventory.stone} · ⚙️${davidInventory.iron})`);
        }
      }
    }
  });

  davidRetainers.forEach((ret, rIdx) => {
    const u = ret.mesh.userData;
    let targetX, targetY, targetZ;
    let isPickingUp = false;

    if (ret.fetchingRes && !ret.fetchingRes.collected) {
      isPickingUp = true;
      const offsetAng = (rIdx === 0 ? -0.5 : 0.5);
      targetX = ret.fetchingRes.pos.x + Math.sin(offsetAng) * 0.65;
      targetZ = ret.fetchingRes.pos.z + Math.cos(offsetAng) * 0.65;
      targetY = ret.fetchingRes.baseY;
    } else {
      ret.fetchingRes = null;
      const sideSign = (rIdx === 0 ? -1 : 1);
      const backDist = 1.95;
      const sideDist = 1.15 * sideSign;
      const sinF = Math.sin(playerFacing);
      const cosF = Math.cos(playerFacing);
      targetX = playerPos.x - sinF * backDist + cosF * sideDist;
      targetZ = playerPos.z - cosF * backDist - sinF * sideDist;
      targetY = playerPos.y;
    }

    const dx = targetX - ret.mesh.position.x;
    const dz = targetZ - ret.mesh.position.z;
    const dist = Math.hypot(dx, dz);
    const spd = isPickingUp ? 12.0 : 7.5;

    if (dist > 0.20) {
      const ratio = Math.min(1, spd * dt);
      ret.mesh.position.x += dx * ratio;
      ret.mesh.position.z += dz * ratio;
      ret.heading = lerpAngle(ret.heading, Math.atan2(dx, dz), dt * 12);
      ret.mesh.rotation.y = ret.heading;

      const walkSwing = Math.sin(now * 0.018 + rIdx * 1.5) * 0.65;
      if (u.lLeg && u.rLeg) {
        u.lLeg.rotation.x = walkSwing;
        u.rLeg.rotation.x = -walkSwing;
      }
      if (!isPickingUp && u.lArm && u.rArm) {
        u.lArm.rotation.x = -walkSwing * 0.6;
        u.rArm.rotation.x = walkSwing * 0.6;
      }
    } else {
      if (u.lLeg && u.rLeg) {
        u.lLeg.rotation.x = 0;
        u.rLeg.rotation.x = 0;
      }
      if (!isPickingUp && u.lArm && u.rArm) {
        u.lArm.rotation.x = 0;
        u.rArm.rotation.x = 0;
      }
    }

    ret.mesh.position.y = THREE.MathUtils.lerp(ret.mesh.position.y, targetY, Math.min(1, dt * 10));

    if (ret.pickupAnimTimer > 0) {
      ret.pickupAnimTimer -= dt;
      if (ret.fetchingRes) {
        ret.mesh.rotation.y = Math.atan2(
          ret.fetchingRes.pos.x - ret.mesh.position.x,
          ret.fetchingRes.pos.z - ret.mesh.position.z
        );
      }
      const grabWave = Math.sin(now * 0.045) * 0.75;
      ret.mesh.rotation.x = 0.28;
      if (u.lArm && u.rArm) {
        u.lArm.rotation.x = -1.35 + grabWave;
        u.rArm.rotation.x = -1.35 - grabWave;
      }
    } else {
      ret.mesh.rotation.x = 0;
    }
  });
}

function updateDavidStage3Frame(dt, now) {
  if (davidOpeningState.active) return;
  if (davidNpcAutoDialogCooldown > 0) davidNpcAutoDialogCooldown -= dt;

  resolvePlayerOutOfCityBuildings();
  updateDavidRetainersAndResources(dt, now);
  updateCityShopkeepersAndPedestrians(dt, now);

  const dlgEl = document.getElementById('david-npc-dialog');
  const isDialogHidden = (!dlgEl || dlgEl.classList.contains('hidden'));

  davidActiveNearNpc = null;
  let minNpcD = 999;

  davidCityNpcs.forEach((npc, idx) => {
    if (npc.mesh.userData && npc.mesh.userData.lArm && npc.mesh.userData.rArm) {
      const wave = Math.sin(now * 0.006 + idx) * 0.35;
      npc.mesh.userData.lArm.rotation.x = npc.completed ? (-2.2 + wave) : wave;
      npc.mesh.userData.rArm.rotation.x = npc.completed ? (-2.2 - wave) : -wave;
    }

    if (npc.beacon && npc.beacon.visible) {
      const pulse = 1.0 + Math.sin(now * 0.004 + idx) * 0.14;
      npc.beacon.scale.set(pulse, 1, pulse);
    }

    const d = Math.hypot(playerPos.x - npc.pos.x, playerPos.z - npc.pos.z);
    updateWorldLabelPos(npc.label, npc.pos, d < 32);

    if (d > 4.8) {
      npc.autoPromptedInZone = false;
    }

    if (d < 4.2 && d < minNpcD) {
      minNpcD = d;
      davidActiveNearNpc = npc;
    }

    if (
      d < 3.0 &&
      !npc.autoPromptedInZone &&
      isDialogHidden &&
      davidNpcAutoDialogCooldown <= 0 &&
      Math.abs(playerPos.y) < 1.2
    ) {
      const allThreeDone = davidCityNpcs.filter(n => n.id !== 'herald').every(n => n.completed);
      const hasEnoughForNpc = npc.req
        ? (davidInventory.wood >= npc.req.wood && davidInventory.stone >= npc.req.stone && davidInventory.iron >= npc.req.iron)
        : false;

      const shouldAutoOpen =
        (!davidCurrentActiveQuestNpc && !npc.completed && npc.id !== 'herald') ||
        (davidCurrentActiveQuestNpc === npc && !npc.completed && hasEnoughForNpc) ||
        (davidCurrentActiveQuestNpc && davidCurrentActiveQuestNpc !== npc && !npc.completed) ||
        (npc.id === 'herald' && (!npc.started || (allThreeDone && !npc.completed)));

      if (shouldAutoOpen) {
        openDavidNpcDialog(npc);
      }
    }
  });

  const pBtn = document.getElementById('puzzle-build-btn');
  if (davidActiveNearNpc && isDialogHidden) {
    pBtn.classList.remove('hidden');
    pBtn.textContent = `💬 ${davidActiveNearNpc.roleTitle}와 대화하기!`;
  } else {
    pBtn.classList.add('hidden');
  }

  if (targetObject && !targetObject.triggered) {
    if (targetObject.beacon && targetObject.beacon.visible) {
      const bPulse = 1.0 + Math.sin(now * 0.005) * 0.16;
      targetObject.beacon.scale.set(bPulse, 1, bPulse);
    }

    const td = Math.hypot(playerPos.x - targetObject.pos.x, playerPos.z - targetObject.pos.z);
    updateWorldLabelPos(targetObject.label, targetObject.pos, td < 34);

    const ctxBtn = document.getElementById('context-action-btn');
    if (davidProphetUnlocked && td < 4.5) {
      ctxBtn.classList.remove('hidden');
      ctxBtn.textContent = '✨ 선지자에게 하나님의 언약 듣기!';
      if (td < 2.8) triggerContextAction();
    } else {
      ctxBtn.classList.add('hidden');
    }

    if (guideArrowGroup && guideArrowGroup.visible) {
      const baseFacing = (window.globalCameraViewMode === 'fps') ? (cameraYaw + Math.PI) : playerFacing;
      let guidePt = targetObject.pos;
      if (!davidProphetUnlocked) {
        if (davidCurrentActiveQuestNpc && !davidCurrentActiveQuestNpc.completed) {
          const req = davidCurrentActiveQuestNpc.req;
          let neededKind = null;
          if (req.wood > davidInventory.wood) neededKind = 'wood';
          else if (req.stone > davidInventory.stone) neededKind = 'stone';
          else if (req.iron > davidInventory.iron) neededKind = 'iron';

          if (neededKind) {
            let bestRes = null;
            let bestD = 9999;
            davidCityResources.forEach(r => {
              if (!r.collected && r.kind === neededKind) {
                const distToR = Math.hypot(playerPos.x - r.pos.x, playerPos.z - r.pos.z);
                if (distToR < bestD) {
                  bestD = distToR;
                  bestRes = r;
                }
              }
            });
            guidePt = bestRes ? bestRes.pos : davidCurrentActiveQuestNpc.pos;
          } else {
            guidePt = davidCurrentActiveQuestNpc.pos;
          }
        } else {
          const nextNpc = davidCityNpcs.find(n => n.id !== 'herald' && !n.completed);
          if (!nextNpc) {
            const herald = davidCityNpcs.find(n => n.id === 'herald');
            guidePt = herald ? herald.pos : targetObject.pos;
          } else {
            guidePt = nextNpc.pos;
          }
        }
      }
      guideArrowGroup.rotation.y = Math.atan2(guidePt.x - playerPos.x, guidePt.z - playerPos.z) - baseFacing;
    }
  }
}

function startDavidStage3CovenantCutscene() {
  isPlaying = false;
  isTimeAttackActive = false;
  hideAllDavidCustomUI();
  const tracker = document.getElementById('david-st3-quest-tracker');
  if (tracker) tracker.classList.add('hidden');

  document.getElementById('context-action-btn').classList.add('hidden');
  document.getElementById('puzzle-build-btn').classList.add('hidden');
  document.getElementById('hud-mission-box').classList.add('hidden');
  if (targetObject && targetObject.label) targetObject.label.style.opacity = '0';
  if (targetObject && targetObject.beacon) targetObject.beacon.visible = false;

  playerPos.set(0, 0, -39.5);
  playerFacing = Math.PI;
  if (playerGroup) {
    playerGroup.position.copy(playerPos);
    playerGroup.rotation.y = Math.PI;
  }

  playAnimaleseSpeech('네 집과 네 나라가 내 앞에서 영원히 보전되고 네 왕위가 영원히 견고하리라', 0.88);
  davidStage3Cutscene.active = true;
  davidStage3Cutscene.timer = 0;
  playSfx('clear');
  showToast('✨ 나단 선지자가 다윗왕에게 하나님의 영원한 왕위 언약을 선포합니다! (사무엘하 7:16)');
}

function updateDavidStage3CutsceneFrame(dt, now) {
  if (!davidStage3Cutscene.active) return false;
  davidStage3Cutscene.timer += dt;
  const t = davidStage3Cutscene.timer;

  camera.position.lerp(new THREE.Vector3(3.5, 4.5, -34.0), 0.1);
  camera.lookAt(0, 2.2, -42.5);

  if (targetObject && targetObject.mesh && targetObject.mesh.userData.rArm) {
    targetObject.mesh.userData.rArm.rotation.x = -2.1 + Math.sin(now * 0.01) * 0.25;
  }

  if (t >= 3.6) {
    davidStage3Cutscene.active = false;
    openStageClearModal(3);
  }
  return true;
}

// -------------------------------------------------------------------------
// 3. [엔딩 월드] 왕좌 착석 -> 암전 후 메시아 성경절 표시 및 남자 성우 음성 낭독 -> 인증서 자동 오픈
// -------------------------------------------------------------------------
function createEmptyThroneWithGuideArrow(cx, cz) {
  const root = new THREE.Group();
  const goldMat = matDavidCached('#facc15', '#ca8a04');
  const redVelvet = matDavidCached('#991b1b', '#7f1d1d');
  const stoneStep = makeDetailedBuildingWallMat(0);

  root.add(
    createBox(7.6, 0.5, 6.8, stoneStep, 0, 0.25, 0.6),
    createBox(6.0, 1.0, 5.2, stoneStep, 0, 0.50, 0.0),
    createBox(4.4, 1.5, 3.8, goldMat,   0, 0.75, -0.5)
  );

  platforms.push(
    { minX: cx - 3.8, maxX: cx + 3.8, minZ: cz - 2.8, maxZ: cz + 4.0, topY: 0.50 },
    { minX: cx - 3.0, maxX: cx + 3.0, minZ: cz - 2.6, maxZ: cz + 2.6, topY: 1.00 },
    { minX: cx - 2.2, maxX: cx + 2.2, minZ: cz - 2.4, maxZ: cz + 1.4, topY: 1.55 }
  );

  root.add(
    createBox(2.4, 0.35, 1.9, redVelvet, 0, 1.65, -0.5),
    createBox(2.6, 3.4,  0.4, goldMat,   0, 3.20, -1.35),
    createBox(2.0, 2.8,  0.45, redVelvet, 0, 3.10, -1.30),
    createBox(0.38, 1.0, 1.9, goldMat,  -1.15, 2.15, -0.5),
    createBox(0.38, 1.0, 1.9, goldMat,   1.15, 2.15, -0.5)
  );
  colliders.push({ minX: cx - 1.5, maxX: cx + 1.5, minZ: cz - 1.8, maxZ: cz - 1.1 });

  const arrowGrp = new THREE.Group();
  const arrowMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  const arrowBorder = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
  arrowGrp.add(
    createBox(0.45, 1.1, 0.35, arrowMat, 0, 0.95, 0, false),
    createBox(1.35, 0.32, 0.38, arrowMat, 0, 0.42, 0, false),
    createBox(0.95, 0.28, 0.38, arrowMat, 0, 0.16, 0, false),
    createBox(0.50, 0.28, 0.38, arrowMat, 0, -0.10, 0, false),
    createBox(0.55, 1.2, 0.25, arrowBorder, 0, 0.95, -0.08, false)
  );
  arrowGrp.position.set(0, 4.2, -0.4);
  root.add(arrowGrp);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(1.1, 1.55, 28),
    new THREE.MeshBasicMaterial({ color: 0xfde047, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(0, 1.85, -0.4);
  root.add(ring);

  root.userData = { arrowGrp, ring };
  return root;
}

function startDavidEndingBlackoutAndCert() {
  runDavidBlackoutSequence(
    [
      {
        html: '"보라 날이 이르리니 내가 다윗에게 한 의로운 가지를 일으킬 것이라<br/>그가 왕이 되어 지혜롭게 다스리며 세상에서 정의와 공의를 행할 것이며"',
        sub: '- 예레미야 23장 5절 -',
        voiceText: '보라 날이 이르리니 내가 다윗에게 한 의로운 가지를 일으킬 것이라 그가 왕이 되어 지혜롭게 다스리며 세상에서 정의와 공의를 행할 것이며',
        durationMs: 7500
      },
      {
        html: '"아브라함과 다윗의 자손 예수 그리스도의 계보라"',
        sub: '- 마태복음 1장 1절 (다윗의 후손으로 오신 구원자 메시아) -',
        voiceText: '아브라함과 다윗의 자손 예수 그리스도의 계보라',
        durationMs: 5500
      }
    ],
    () => {
      isPlaying = true;
      const certOpenBtn = document.getElementById('cert-open-btn');
      if (certOpenBtn) certOpenBtn.classList.remove('hidden');
      if (typeof showEndingCertificate === 'function') {
        showEndingCertificate();
      }
    }
  );
}

function buildDavidEndingWorld() {
  hideAllDavidCustomUI();
  const tracker = document.getElementById('david-st3-quest-tracker');
  if (tracker) tracker.classList.add('hidden');

  scene.background = new THREE.Color(0x38bdf8);
  scene.fog = new THREE.Fog(0xbae6fd, 65, 195);

  const endLimit = 34;
  currentMapRectBounds = {
    minX: -endLimit + 2.4,
    maxX:  endLimit - 2.4,
    minZ: -endLimit + 2.4,
    maxZ:  endLimit - 2.4
  };

  davidThroneEnding.seated = false;
  davidThroneEnding.seatTimer = 0;
  davidThroneEnding.modalShown = false;

  const cityStoneMat = new THREE.MeshLambertMaterial({ map: makeDavidCityStoneTex() });
  const marbleMat = matDavidCached('#f8fafc', '#e2e8f0');
  const carpetMat = matDavidCached('#b91c1c', '#7f1d1d');
  const goldMat = matDavidCached('#facc15', '#ca8a04');

  worldGroup.add(
    createBox(endLimit * 2.4, 1, endLimit * 2.4, cityStoneMat, 0, -0.5, 0, false),
    createBox(26, 0.12, 34, marbleMat, 0, 0.06, -4, false),
    createBox(4.8, 0.16, 28, carpetMat, 0, 0.08, -2, false)
  );

  buildDavidCastleWallPerimeter(endLimit, false);

  [-10.5, 10.5].forEach(px => {
    for (let pz = -14; pz <= 8; pz += 5.5) {
      const col = createBox(1.2, 6.5, 1.2, marbleMat.clone(), px, 3.25, pz);
      const cap = createBox(1.5, 0.45, 1.5, goldMat, px, 6.6, pz);
      worldGroup.add(col, cap);
      wallMeshes.push(col);
    }
  });
  [[-18, 12], [18, 12], [-22, -4], [22, -4], [-18, -18], [18, -18]].forEach(([tx, tz]) => {
    addPalmTree(tx, tz, 1.25, true);
  });

  const throneGrp = createEmptyThroneWithGuideArrow(0, -8);
  throneGrp.position.set(0, 0, -8);
  worldGroup.add(throneGrp);
  davidThroneEnding.throneGroup = throneGrp;
  davidThroneEnding.arrowGroup = throneGrp.userData.arrowGrp;

  addWallTorch(-4.2, 2.2, -5.2);
  addWallTorch( 4.2, 2.2, -5.2);

  if (typeof createFollowerPersonMesh === 'function') {
    for (let i = 0; i < 22; i++) {
      const ang = (i / 22) * Math.PI * 2;
      const rad = (i % 2 === 0) ? 8.8 : 11.4;
      const px = Math.cos(ang) * rad;
      const pz = -5 + Math.sin(ang) * rad;
      if (Math.abs(px) < 3.4 && pz > -5) continue;
      const person = createFollowerPersonMesh(i);
      person.position.set(px, 0, pz);
      person.lookAt(0, 1.8, -8.4);
      worldGroup.add(person);
      endingCelebrationPeople.push({ mesh: person, phase: i * 0.65 });
    }
  }

  targetObject = {
    type: 'david_throne',
    pos: new THREE.Vector3(0, 1.8, -8.4),
    label: createWorldLabel('⬇️ 빈 왕좌 위로 올라가세요! (화살표 위치로 이동)'),
    triggered: false
  };

  playerPos.set(0, 0, 9.5);
  lastGroundedY = 0;
  playerFacing = Math.PI;
  cameraYaw = 0; cameraTargetYaw = 0;
  rebuildPlayerAppearance();
  if (playerGroup) playerGroup.rotation.y = Math.PI;

  // 왕좌에 앉아 메시아 성경절을 먼저 본 뒤에 인증서 버튼이 나타나도록 초기 숨김 처리
  setTimeout(() => {
    const certOpenBtn = document.getElementById('cert-open-btn');
    if (certOpenBtn && !davidThroneEnding.modalShown) {
      certOpenBtn.classList.add('hidden');
    }
  }, 0);
}

function seatDavidOnThroneAndShowMessiahVerse() {
  if (davidThroneEnding.seated) return;
  davidThroneEnding.seated = true;
  davidThroneEnding.seatTimer = 0;
  if (targetObject) targetObject.triggered = true;
  if (targetObject && targetObject.label) targetObject.label.style.opacity = '0';
  if (davidThroneEnding.arrowGroup) davidThroneEnding.arrowGroup.visible = false;
  if (davidThroneEnding.throneGroup && davidThroneEnding.throneGroup.userData.ring) {
    davidThroneEnding.throneGroup.userData.ring.visible = false;
  }
  document.getElementById('context-action-btn').classList.add('hidden');

  if (typeof setPlayerMeshVisibilityForCamera === 'function') {
    setPlayerMeshVisibilityForCamera(false);
  }

  playerPos.set(0, 1.65, -8.45);
  playerFacing = 0;
  if (playerGroup) {
    playerGroup.position.copy(playerPos);
    playerGroup.rotation.y = 0;
  }
  if (playerLimbs) {
    if (playerLimbs.lLeg) playerLimbs.lLeg.rotation.x = -1.25;
    if (playerLimbs.rLeg) playerLimbs.rLeg.rotation.x = -1.25;
    if (playerLimbs.rArm) playerLimbs.rArm.rotation.x = -1.8;
  }

  playSfx('clear');
  showToast('👑 다윗왕이 보좌에 올랐습니다!');
}

function updateDavidEndingThroneFrame(dt, now) {
  if (davidOpeningState.active) return;

  if (!davidThroneEnding.seated) {
    if (davidThroneEnding.arrowGroup) {
      davidThroneEnding.arrowGroup.position.y = 4.2 + Math.sin(now * 0.006) * 0.42;
      davidThroneEnding.arrowGroup.rotation.y += dt * 2.4;
    }
    if (targetObject) {
      const td = Math.hypot(playerPos.x - targetObject.pos.x, playerPos.z - targetObject.pos.z);
      updateWorldLabelPos(targetObject.label, targetObject.pos, td < 30);

      if (guideArrowGroup && guideArrowGroup.visible) {
        const baseFacing = (window.globalCameraViewMode === 'fps') ? (cameraYaw + Math.PI) : playerFacing;
        guideArrowGroup.rotation.y = Math.atan2(targetObject.pos.x - playerPos.x, targetObject.pos.z - playerPos.z) - baseFacing;
      }

      const ctxBtn = document.getElementById('context-action-btn');
      if (td < 3.4) {
        ctxBtn.classList.remove('hidden');
        ctxBtn.textContent = '👑 다윗의 왕좌에 오르기!';
      } else {
        ctxBtn.classList.add('hidden');
      }
      if (td < 1.85 && playerPos.y >= 0.9) {
        seatDavidOnThroneAndShowMessiahVerse();
      }
    }
    return;
  }

  davidThroneEnding.seatTimer += dt;
  playerPos.set(0, 1.65, -8.45);
  playerFacing = 0;
  if (playerGroup) {
    playerGroup.position.copy(playerPos);
    playerGroup.rotation.y = 0;
  }
  if (playerLimbs) {
    if (playerLimbs.lLeg) playerLimbs.lLeg.rotation.x = -1.25;
    if (playerLimbs.rLeg) playerLimbs.rLeg.rotation.x = -1.25;
    if (playerLimbs.rArm) playerLimbs.rArm.rotation.x = -1.8 + Math.sin(now * 0.008) * 0.35;
  }

  camera.position.lerp(new THREE.Vector3(0, 4.8, -1.2), 0.08);
  camera.lookAt(0, 2.5, -8.5);

  if (davidThroneEnding.seatTimer >= 1.10 && !davidThroneEnding.modalShown) {
    davidThroneEnding.modalShown = true;
    startDavidEndingBlackoutAndCert();
  }
}

// -------------------------------------------------------------------------
// 4. 에피소드 3 통합 플러그인 등록 & 액션 버튼 단일 훅 연동
// -------------------------------------------------------------------------
if (!window._davidPuzzleHookRegistered) {
  window._davidPuzzleHookRegistered = true;
  const _origTriggerPuzzleBtn = window.triggerPuzzleBuildOrSwitch;
  window.triggerPuzzleBuildOrSwitch = function () {
    if (currentEpisode === 'david') {
      if (currentStage === 1) {
        performDavidStage1Action();
      } else if (currentStage === 3 && davidActiveNearNpc) {
        openDavidNpcDialog(davidActiveNearNpc);
      }
      return;
    }
    if (typeof _origTriggerPuzzleBtn === 'function') _origTriggerPuzzleBtn();
  };
}

REGISTER_EPISODE('david', {
  locked: false,
  avatarIcon: '🪉',
  scripture: DAVID_SCRIPTURE,
  certMeta: {
    badge: '👑 에피소드 3 : 믿음의 목동 다윗왕 완주!',
    title: '양을 지키던 목동에서 백성을 섬기는 왕으로!',
    verse: '"보라 날이 이르리니 내가 다윗에게 한 의로운 가지를 일으킬 것이라 그가 왕이 되어 지혜롭게 다스리며" (예레미야 23:5)',
    mission: '베들레헴 양 떼 수호, 엘라 골짜기 승리 및 다윗성 백성 섬김 완주',
    prefix: 'DAV-'
  },
  getBaseGroundHeight: function (x, z, st) {
    if (st === 1) return getDavidStage1GroundHeight(x, z);
    return 0;
  },
  scheduleBgmBeat: function (ctx, step, st, mode, playing, timeRem, toFreq) {
    return scheduleDavidBgmBeat(ctx, step, st, mode, playing, timeRem, toFreq);
  },
  createHeroMesh: function () {
    return createDavidHeroMesh();
  },
  onCloseScreen: function () {
    hideAllDavidCustomUI();
    const tracker = document.getElementById('david-st3-quest-tracker');
    if (tracker) tracker.classList.add('hidden');
  },
  clearState: function () {
    hideAllDavidCustomUI();
    const tracker = document.getElementById('david-st3-quest-tracker');
    if (tracker) tracker.classList.add('hidden');
    davidBaseFlock = [];
    davidSheepList = [];
    davidFollowingSheep = [];
    davidPredators = [];
    davidFeedItems = [];
    davidWallMaterials = [];
    davidPlacedWallMat = 0;
    davidWallSectionTiers = [0, 0, 0, 0, 0, 0, 0];
    davidWallPanelPlatforms = [];
    davidSheepEatParticles = [];
    davidVanishingSheepAnims = [];
    davidLostSheepCount = 0;
    davidSlingStones = [];
    davidGoliathHazards = [];
    davidPhilistineSoldiers = [];
    davidIsraelSoldiers = [];
    davidCityNpcs = [];
    davidCityResources = [];
    davidRetainers = [];
    davidCityShopkeepers = [];
    davidCityPedestrians = [];
    davidCityBuildingBoxes = [];
    davidCurrentActiveQuestNpc = null;
    davidThroneEnding.seated = false;
    davidThroneEnding.modalShown = false;
    davidAnointCutscene.active = false;
    davidStage2Cutscene.active = false;
    davidStage3Cutscene.active = false;
    davidStage2Dialogue.active = false;
    davidAimState.active = false;
    davidFlyingStone.active = false;
  },
  getInitialTime: function (st) {
    return st === 1 ? 26.0 : (st === 2 ? 22.0 : 32.0);
  },
  buildStage: function (st) {
    rebuildPlayerAppearance();
    if (st === 1) buildDavidStage1World();
    else if (st === 2) buildDavidStage2World();
    else if (st === 3) buildDavidStage3World();
  },
  buildEndingWorld: function () {
    buildDavidEndingWorld();
  },
  endingToast: '👑 성벽 안 백성들의 환호를 받으며 화살표가 가리키는 빈 왕좌 위로 올라가 보세요!',
  updateHUD: function (st, badge, countIcon, countText, missionText) {
    if (st === 1) {
      updateDavidCarriedItemsVisual();
      badge.textContent = '베들레헴 · 스테이지 1';
      if (davidStage1Phase === 'find_sheep') {
        countIcon.textContent = '🐑';
        countText.textContent = `양 ${davidGatheredSheepCount}/5마리`;
        missionText.textContent = '언덕 위 바위와 나무 뒤에 숨어 있는 양 5마리를 찾아 사각형 목초지로 데려오세요!';
      } else if (davidStage1Phase === 'feed_sheep') {
        countIcon.textContent = '🌿';
        countText.textContent = `배부름 ${Math.round(davidHungerGauge)}%`;
        missionText.textContent = '주변에서 먹이를 찾아 양을 배부르게 해주세요!';
      } else if (davidStage1Phase === 'defend_sheep') {
        countIcon.textContent = '🛡️';
        const curSpec = getDavidTierVisualSpec(Math.min(davidMaxWallTier, davidWallTier + 1));
        countText.textContent = davidWallTier >= davidMaxWallTier
          ? `방어 완료 (${Math.ceil(davidDefenseTimer)}초)`
          : `${curSpec.name} ${davidPlacedWallMat}/7개`;
        missionText.textContent = '담장이 없는 쪽으로 맹수가 오면 양이 사라져요! 지팡이로 쫓아내며 자원 7개씩 모아 담을 쌓으세요!';
      } else {
        countIcon.textContent = '📯';
        countText.textContent = '언덕 아래 집으로';
        missionText.textContent = '북쪽 내리막 오솔길을 따라 언덕 아래 아버지 이새의 집으로 내려가 사무엘 선지자를 만나세요!';
      }
    } else if (st === 2) {
      updateDavidStage2HUD(badge, countIcon, countText, missionText);
    } else if (st === 3) {
      updateDavidStage3HUD(badge, countIcon, countText, missionText);
    } else {
      countIcon.textContent = '👑';
      badge.textContent = '다윗왕의 보좌';
      countText.textContent = '왕좌 등극 👑';
      missionText.textContent = '👑 화살표가 표시된 빈 왕좌 위로 올라가 다윗의 후손 메시아 언약 말씀을 확인하세요!';
    }
  },
  triggerContextAction: function (st, targetObj) {
    if (st === 1) {
      if (davidStage1Phase !== 'go_home') {
        playSfx('wrong');
        showToast('🐑 먼저 언덕 위에서 양 찾기와 먹이 주기, 맹수 디펜스를 모두 마쳐주세요!');
        return;
      }
      targetObj.triggered = true;
      startDavidStage1AnointCutscene();
    } else if (st === 2) {
      triggerDavidStage2Action(targetObj);
    } else if (st === 3) {
      triggerDavidStage3Action(targetObj);
    } else if (st === 4) {
      seatDavidOnThroneAndShowMessiahVerse();
    }
  },
  proceedNextStage: function (st) {
    if (st === 1) {
      currentStage = 2; isPlaying = true;
      if (currentMode === 'timeattack') { timeRemaining = 22.0; timeAttackFirstRechargeUsed = false; isTimeAttackActive = true; }
      rebuildPlayerAppearance();
      buildDavidStage2World();
      startStageBgm(2);
    } else if (st === 2) {
      currentStage = 3; isPlaying = true;
      if (currentMode === 'timeattack') { timeRemaining = 32.0; timeAttackFirstRechargeUsed = false; isTimeAttackActive = true; }
      rebuildPlayerAppearance();
      buildDavidStage3World();
      startStageBgm(3);
    } else {
      const wf = document.getElementById('white-fade');
      if (wf) wf.style.opacity = '1';
      playSfx('dove');
      setTimeout(() => {
        isPlaying = true; isTimeAttackActive = false;
        document.getElementById('hud-timer-box').classList.add('hidden');
        buildEndingWorld();
        setTimeout(() => { if (wf) wf.style.opacity = '0'; }, 350);
      }, 700);
    }
  },
  updateCutsceneFrame: function (dt, now) {
    if (updateDavidAnointCutsceneFrame(dt, now)) return true;
    if (updateDavidStage2CutsceneFrame(dt, now)) return true;
    if (updateDavidStage3CutsceneFrame(dt, now)) return true;
    return false;
  },
  updateStageFrame: function (dt, now, st) {
    if (st === 1) updateDavidStage1Frame(dt, now);
    else if (st === 2) updateDavidStage2Frame(dt, now);
    else if (st === 3) updateDavidStage3Frame(dt, now);
    else if (st === 4) updateDavidEndingThroneFrame(dt, now);
  }
});