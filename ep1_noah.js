// =========================================================================
// [ep1_noah.js] 에피소드 1 : 노아의 방주 (월드 생성, 비둘기 컷신, 스테이지 진행 로직)
// =========================================================================

EPISODE_SCRIPTURE.noah = {
  1: {
    title: '스테이지 1 클리어! 동물 7쌍 방주 탑승!',
    desc: '하나님께서 명하신 대로 모든 동물들을 방주 위에 안전하게 태웠어요!',
    verse: '"노아가 여호와께서 자기에게 명하신 대로 다 준행하였더라" (창세기 6장 22절)',
    btnText: '🌧️ 방주 안으로 들어가기 (스테이지 2) ▶',
    quiz: { q: '퀴즈! 노아는 하나님의 말씀에 어떻게 순종했나요?', opts: ['자기 마음대로 고쳤다', '명하신 대로 다 준행하였다', '절반만 만들고 포기했다'], ans: 1 }
  },
  2: {
    title: '스테이지 2 클리어! 감람나무 새 잎사귀!',
    desc: '창문으로 날려 보낸 하얀 비둘기가 저녁때에 감람나무 새 잎사귀를 물고 돌아왔어요!',
    verse: '"저녁때에 비둘기가 그에게로 돌아왔는데 그 입에 감람나무 새 잎사귀가 있는지라 이에 노아가 땅에 물이 줄어든 줄을 알았으며" (창세기 8장 11절)',
    btnText: '방주 출구 찾으러 가기 (스테이지 3) ▶',
    quiz: { q: '퀴즈! 비둘기가 입에 물고 돌아온 것은 무엇인가요?', opts: ['감람나무 새 잎사귀', '사과나무 열매', '황금 나뭇가지'], ans: 0 }
  },
  3: {
    title: '스테이지 3 클리어! 방주 문이 활짝 열렸어요!',
    desc: '노아를 졸졸 따라온 동물 7쌍과 함께 환한 빛을 지나 무지개 세상으로 나가요!',
    verse: '"내가 내 무지개를 구름 속에 두었나니 이것이 나와 세상 사이의 언약의 증거니라" (창세기 9장 13절)',
    btnText: '🌈 환한 빛을 지나 무지개 세상으로 나가기! ▶',
    quiz: { q: '퀴즈! 하나님께서 다시는 물로 심판하지 않겠다고 약속하시며 구름 속에 두신 증거는?', opts: ['일곱 빛깔 무지개', '번개와 구름', '황금 별자리'], ans: 0 }
  }
};

// -------------------------------------------------------------------------
// [스테이지 1] 초원 월드 & 동물 7쌍 랜덤 스폰
// -------------------------------------------------------------------------
function buildNoahStage1World() {
  clearWorld();
  scene.background = new THREE.Color(0x7dd3fc);
  scene.fog = new THREE.Fog(0x7dd3fc, 52, 135);

  const isWide = (currentMode !== 'kinder');
  const mapLimit = isWide ? 52 : 34;

  const groundMat = new THREE.MeshLambertMaterial({ map: makeGrassFieldTex() });
  worldGroup.add(createBox(mapLimit * 2.5, 1, mapLimit * 2.5, groundMat, 0, -0.5, 0));
  scatterMeadowGrassTufts(mapLimit);
  buildGrassAndTreeBorders(mapLimit, false);

  const arkZ = -19;
  const arkHull = createBox(18, 6.2, 9.5, matVoxel('#92400e', '#78350f').clone(), 0, 3.1, arkZ);
  const arkDeck = createBox(18.6, 0.4, 10.0, matVoxel('#d97706').clone(), 0, 6.4, arkZ);
  const arkCabin = createBox(14, 2.3, 4.2, matVoxel('#b45309', '#92400e').clone(), 0, 7.75, arkZ - 1.8);
  const ramp = createBox(4.2, 0.4, 6, matVoxel('#d97706'), 0, 0.3, arkZ + 6.8);
  worldGroup.add(arkHull, arkDeck, arkCabin, ramp);
  wallMeshes.push(arkHull, arkCabin);
  colliders.push({ minX: -9.8, maxX: 9.8, minZ: arkZ - 5.5, maxZ: arkZ + 7.5 });

  const rockSpots = isWide
    ? [[-13, 3], [13, 3], [-19, -6], [19, -6], [0, 21], [-24, 17], [24, 17], [-35, 6], [35, 6], [-28, 34], [28, 34]]
    : [[-13, 3], [13, 3], [-19, -6], [19, -6], [0, 21], [-24, 17], [24, 17]];
  rockSpots.forEach(([rx, rz]) => {
    addJumpRock(rx, rz, 4.2, 1.15, 4.2);
    addJumpRock(rx, rz, 2.5, 2.25, 2.5);
  });

  const innerTrees = [
    [-9, 11], [9, 11], [-16, 15], [16, 15], [-21, 2], [21, 2],
    [-14, -12], [14, -12], [-27, 9], [27, 9], [0, 29],
    [-6, 24], [6, 24], [-18, 24], [18, 24], [-25, -4], [25, -4]
  ];
  innerTrees.forEach(([tx, tz]) => {
    if (Math.abs(tx) < mapLimit - 3 && Math.abs(tz) < mapLimit - 3) addTree(tx, tz, 1.1, true);
  });

  if (isWide) {
    const outerEdgeTrees = [
      [-34, -22], [-42, -16], [-38, -6], [-45, 4], [-35, 14], [-44, 22], [-36, 30], [-45, 38], [-38, 45],
      [34, -22],  [42, -16],  [38, -6],  [45, 4],  [35, 14],  [44, 22],  [36, 30],  [45, 38],  [38, 45],
      [-28, 38], [-20, 44], [-12, 37], [-4, 45], [5, 44], [13, 37], [21, 45], [29, 39],
      [-24, 47], [0, 38], [24, 47], [-10, 47], [10, 47],
      [-44, -28], [-35, -34], [-26, -28], [-18, -36], [-28, -43], [-16, -45], [-42, -40],
      [44, -28],  [35, -34],  [26, -28],  [18, -36],  [28, -43],  [16, -45],  [42, -40],
      [-6, -35], [6, -35], [0, -43], [-8, -45], [8, -45]
    ];
    outerEdgeTrees.forEach(([tx, tz], idx) => {
      const jx = tx + ((idx % 3) - 1) * 1.2, jz = tz + (((idx * 2) % 3) - 1) * 1.2;
      if (Math.abs(jx) < mapLimit - 3.2 && Math.abs(jz) < mapLimit - 3.2 && isSpawnSpotClear(jx, jz, 1.4)) {
        addTree(jx, jz, 1.05 + (idx % 3) * 0.14, true);
      }
    });
  }

  const types = ['lion', 'sheep', 'elephant', 'giraffe', 'panda', 'rabbit', 'deer'];
  const spawnRange = isWide ? (mapLimit - 7) : 20;
  const spawnBounds = { minX: -spawnRange, maxX: spawnRange, minZ: -9, maxZ: spawnRange };
  const chosenSpots = [];
  const startPos = { x: 0, z: 6 };

  rescuedPairs = 0;
  types.forEach((type, i) => {
    const [ax, az] = findRandomSafeSpot(spawnBounds, chosenSpots, isWide ? 8.5 : 5.5, startPos, 7.0);
    chosenSpots.push([ax, az]);
    const pairGroup = createAnimalPairGroup(type, 0xfde047);
    pairGroup.position.set(ax, 0, az);
    worldGroup.add(pairGroup);

    const initHeading = Math.random() * Math.PI * 2;
    const lbl = createWorldLabel(`${ANIMAL_SPECS[type].icon} ${ANIMAL_SPECS[type].name} 한 쌍`);
    stageAnimals.push({
      type, index: i, group: pairGroup, rescued: false, onArkDeck: false, label: lbl,
      heading: initHeading, targetHeading: initHeading, avoidTimer: 0, fleeState: false, limit: mapLimit - 6
    });
  });

  playerPos.set(0, 0, 6);
  playerVelY = 0; isGrounded = true; playerFacing = 0;
  cameraYaw = 0; cameraTargetYaw = 0;
  snapCameraToPlayer();
  updateStageHUD();
}

// -------------------------------------------------------------------------
// [스테이지 2 & 3] 방주 내부 랜덤 미로 생성기
// -------------------------------------------------------------------------
function buildNoahArkInteriorMaze(stageNum) {
  clearWorld();
  mazeRunCount++;
  scene.background = new THREE.Color(0x18130f);
  scene.fog = new THREE.Fog(0x18130f, 38, 105);

  const isHard = (currentMode === 'senior' || currentMode === 'timeattack');
  const halfW = isHard ? 36 : 26, halfD = isHard ? 48 : 34, wallH = 6.2;

  const floorTex = stageNum === 2 ? makeArkFloorTex('#2e1a0f', '#170c06') : makeArkFloorTex('#1f242d', '#0f1318');
  const wallTex = stageNum === 2 ? makeArkWallTex('#d9a05b', '#78350f') : makeArkWallTex('#e5c494', '#7c2d12');
  const floorMat = new THREE.MeshLambertMaterial({ map: floorTex });
  const wallMat = new THREE.MeshLambertMaterial({ map: wallTex });
  const topTrimMat = new THREE.MeshBasicMaterial({ color: stageNum === 2 ? 0xfbbf24 : 0x38bdf8 });

  worldGroup.add(createBox(halfW * 2, 1, halfD * 2, floorMat, 0, -0.5, 0));

  function addMazeWall(x, z, w, d) {
    if (w <= 0.4 || d <= 0.4) return;
    const m = createBox(w, wallH, d, wallMat.clone(), x, wallH / 2, z);
    const trim = createBox(w + 0.06, 0.28, d + 0.06, topTrimMat, x, wallH + 0.14, z, false);
    worldGroup.add(m, trim);
    wallMeshes.push(m);
    colliders.push({ minX: x - w / 2 - 0.38, maxX: x + w / 2 + 0.38, minZ: z - d / 2 - 0.38, maxZ: z + d / 2 + 0.38 });
  }

  addMazeWall(0, -halfD, halfW * 2 + 2, 1.5);
  addMazeWall(0, halfD, halfW * 2 + 2, 1.5);
  addMazeWall(-halfW, 0, 1.5, halfD * 2 + 2);
  addMazeWall(halfW, 0, 1.5, halfD * 2 + 2);

  function addBarrierWithGates(z, gateCenters, gapWidth = 10.4) {
    const sorted = [...gateCenters].sort((a, b) => a - b);
    let curX = -halfW;
    sorted.forEach(gx => {
      const gLeft = Math.max(-halfW + 1.5, gx - gapWidth / 2);
      const gRight = Math.min(halfW - 1.5, gx + gapWidth / 2);
      if (gLeft > curX + 0.8) {
        const segW = gLeft - curX;
        addMazeWall(curX + segW / 2, z, segW, 1.4);
      }
      addWallTorch(gLeft - 0.7, 3.3, z + 0.85);
      addWallTorch(gRight + 0.7, 3.3, z + 0.85);
      curX = Math.max(curX, gRight);
    });
    if (halfW > curX + 0.8) {
      const segW = halfW - curX;
      addMazeWall(curX + segW / 2, z, segW, 1.4);
    }
  }

  const rows = isHard ? 5 : 4;
  const safeStartZ = halfD - 14, safeEndZ = -halfD + 13, spanZ = (safeStartZ - safeEndZ) / rows;
  const laneRatios = [-0.66, -0.33, 0, 0.33, 0.66];
  let prevLaneIdx = 2;

  for (let r = 0; r < rows; r++) {
    const z = safeStartZ - r * spanZ, midZ = z - spanZ * 0.5, subWallD = spanZ * 0.36;
    const candidateLanes = [0, 1, 2, 3, 4].filter(idx => idx !== prevLaneIdx);
    const primaryLane = candidateLanes[(mazeRunCount + r * 2 + Math.floor(Math.random() * candidateLanes.length)) % candidateLanes.length];
    prevLaneIdx = primaryLane;
    const jitter = (Math.random() - 0.5) * (halfW * 0.12);
    const gate1X = laneRatios[primaryLane] * halfW + jitter;

    if (stageNum === 2) {
      if ((r + mazeRunCount) % 3 === 1) {
        const secondLane = (primaryLane + 2 + (mazeRunCount % 2)) % 5;
        addBarrierWithGates(z, [gate1X, laneRatios[secondLane] * halfW], 10.2);
      } else {
        addBarrierWithGates(z, [gate1X], 10.6);
      }
      const chamberPattern = (mazeRunCount + r + Math.floor(Math.random() * 4)) % 4;
      if (chamberPattern === 0) {
        const p1 = -halfW * (0.25 + Math.random() * 0.15), p2 = halfW * (0.25 + Math.random() * 0.15);
        addMazeWall(p1, midZ, 1.4, subWallD); addMazeWall(p2, midZ, 1.4, subWallD);
        addWallTorch(p1, 3.3, midZ); addWallTorch(p2, 3.3, midZ);
      } else if (chamberPattern === 1) {
        const cx = (Math.random() < 0.5 ? -1 : 1) * (halfW * 0.18);
        addMazeWall(cx, midZ, halfW * 0.42, 1.5); addMazeWall(cx, midZ, 1.5, subWallD);
      } else if (chamberPattern === 2) {
        [-0.48, 0, 0.48].forEach(ratio => addMazeWall(ratio * halfW, midZ, 2.2, subWallD));
      } else {
        addMazeWall(-halfW * 0.42, midZ, halfW * 0.32, 1.5); addMazeWall(halfW * 0.42, midZ, halfW * 0.32, 1.5);
      }
    } else {
      const st3Pattern = (mazeRunCount * 2 + r + Math.floor(Math.random() * 4)) % 4;
      if (st3Pattern === 0) {
        const openSide = (primaryLane < 2) ? -1 : 1;
        addBarrierWithGates(z, [openSide * (halfW - 7.2)], 10.6);
        addMazeWall(-openSide * (halfW * 0.15), midZ, halfW * 0.56, 1.8);
      } else if (st3Pattern === 1) {
        addBarrierWithGates(z, [-halfW * 0.52, halfW * 0.52], 10.2);
        addMazeWall(-halfW * 0.24, midZ, 3.2, subWallD); addMazeWall(halfW * 0.24, midZ, 3.2, subWallD);
      } else if (st3Pattern === 2) {
        addBarrierWithGates(z, [jitter], 10.8);
        addMazeWall(-halfW * 0.48, midZ, 2.2, subWallD); addMazeWall(halfW * 0.48, midZ, 2.2, subWallD);
      } else {
        const gA = (r % 2 === 0 ? -0.55 : -0.22) * halfW, gB = (r % 2 === 0 ? 0.22 : 0.55) * halfW;
        addBarrierWithGates(z, [gA, gB], 10.2);
        [-0.36, 0.36].forEach(rt => addMazeWall(rt * halfW, midZ, 2.6, subWallD * 0.9));
      }
    }

    const boxSide = ((r + mazeRunCount) % 2 === 0) ? -1 : 1;
    addJumpRock(boxSide * (halfW - 4.2), midZ, 2.8, 1.2, 2.8, true);
    addHayBaleCluster(-boxSide * (halfW - 3.6), midZ - 1.5);
  }

  addHayBaleCluster(-halfW + 4.5, halfD - 6.5);
  addHayBaleCluster(halfW - 4.5, halfD - 6.5);

  const startPos = { x: 0, z: halfD - 5.0 };
  const allSpawnedInside = [];
  const interiorBounds = { minX: -halfW + 5.5, maxX: halfW - 5.5, minZ: -halfD + 7.5, maxZ: halfD - 11.0 };

  const extraTypes = ['penguin', 'turtle', 'fox', 'pig', 'duck', 'bear', 'koala'];
  const shuffledFriends = [...extraTypes].sort(() => Math.random() - 0.5);
  for (let i = 0; i < rows * 2; i++) {
    const fType = shuffledFriends[i % shuffledFriends.length];
    const [fx, fz] = findRandomSafeSpot(interiorBounds, allSpawnedInside, 6.5, startPos, 7.0);
    allSpawnedInside.push([fx, fz]);

    const fAnimal = createSingleAnimal(fType);
    fAnimal.position.set(fx, 0, fz);
    fAnimal.rotation.y = Math.random() * Math.PI * 2;
    worldGroup.add(fAnimal);
    const flbl = createWorldLabel(`${ANIMAL_SPECS[fType].icon} ${ANIMAL_SPECS[fType].name} ${currentMode === 'timeattack' ? '(+5초!⏱️)' : ''}`);
    arkFriends.push({ group: fAnimal, label: flbl, met: false, baseX: fx, baseZ: fz, phase: i });
  }

  if (stageNum === 2) {
    const doveX = ((mazeRunCount % 3) - 1) * (halfW * 0.28);
    const goalZ = -halfD + 4.8, winZ = -halfD + 0.85;

    const arkWindow = createArkWallWindow();
    arkWindow.position.set(doveX, 3.8, winZ);
    worldGroup.add(arkWindow);
    addWallTorch(doveX - 3.2, 3.8, winZ + 0.6);
    addWallTorch(doveX + 3.2, 3.8, winZ + 0.6);

    const spotRing = new THREE.Mesh(new THREE.RingGeometry(1.3, 1.75, 24), new THREE.MeshBasicMaterial({ color: 0xfde047, side: THREE.DoubleSide }));
    spotRing.rotation.x = -Math.PI / 2; spotRing.position.set(doveX, 0.06, goalZ);
    worldGroup.add(spotRing);

    const dove = createDoveMesh(false);
    dove.scale.set(1.25, 1.25, 1.25);
    dove.position.set(doveX, 2.5, goalZ);
    worldGroup.add(dove);

    const dlbl = createWorldLabel('🕊️ 날고 있는 하얀 비둘기 (다가가서 창문 열기)');
    targetObject = {
      type: 'dove', mesh: dove, windowObj: arkWindow.userData, spotRing: spotRing,
      baseX: doveX, baseZ: goalZ, halfD: halfD, pos: new THREE.Vector3(doveX, 2.5, goalZ), label: dlbl, triggered: false
    };
  } else {
    rescuedPairs = 0;
    const pairTypes = ['lion', 'sheep', 'elephant', 'giraffe', 'panda', 'rabbit', 'deer'];
    const pairSpots = [];
    pairTypes.forEach((type) => {
      const [px, pz] = findRandomSafeSpot(interiorBounds, [...pairSpots, ...allSpawnedInside], 7.5, startPos, 8.0);
      pairSpots.push([px, pz]);
      const pairGroup = createAnimalPairGroup(type, 0x38bdf8);
      pairGroup.position.set(px, 0, pz);
      pairGroup.rotation.y = Math.random() * Math.PI * 2;
      worldGroup.add(pairGroup);

      const bonusTxt = currentMode === 'timeattack' ? ' (+5초!⏱️)' : '';
      const lbl = createWorldLabel(`${ANIMAL_SPECS[type].icon} ${ANIMAL_SPECS[type].name} 한 쌍${bonusTxt}`);
      stageAnimals.push({
        type, group: pairGroup, rescued: false, label: lbl,
        heading: 0, targetHeading: 0, avoidTimer: 0, fleeState: false, limit: halfW - 4
      });
    });

    const wallDoorZ = -halfD + 0.85;
    const doorFrame = new THREE.Group();
    doorFrame.add(
      createBox(1.5, 5.6, 1.4, matVoxel('#fbbf24'), -3.2, 2.8, 0),
      createBox(1.5, 5.6, 1.4, matVoxel('#fbbf24'), 3.2, 2.8, 0),
      createBox(8.0, 1.2, 1.5, matVoxel('#f59e0b'), 0, 5.8, 0),
      createBox(5.0, 5.2, 0.5, new THREE.MeshBasicMaterial({ color: 0xffffff }), 0, 2.6, 0.25, false)
    );
    doorFrame.position.set(0, 0, wallDoorZ);
    worldGroup.add(doorFrame);
    addWallTorch(-4.6, 3.5, wallDoorZ + 0.9);
    addWallTorch(4.6, 3.5, wallDoorZ + 0.9);

    const elbl = createWorldLabel('🚪 방주 출구 문 (동물 7쌍과 함께 나가기!)');
    targetObject = { type: 'door', mesh: doorFrame, pos: new THREE.Vector3(0, 1.5, wallDoorZ + 1.2), label: elbl, triggered: false };
  }

  playerPos.set(0, 0, halfD - 5.0);
  playerVelY = 0; isGrounded = true; playerFacing = 0;
  cameraYaw = 0; cameraTargetYaw = 0;
  snapCameraToPlayer();
  updateStageHUD();
}

// -------------------------------------------------------------------------
// [컷신 업데이트] 스테이지 2 비둘기 창문 날리기 & 감람나무 잎사귀 귀환 연출
// -------------------------------------------------------------------------
function updateNoahCutsceneFrame(dt, now) {
  if (!doveCutscene.active || !targetObject || targetObject.type !== 'dove') return false;

  doveCutscene.timer += dt;
  const t = doveCutscene.timer, dove = targetObject.mesh, win = targetObject.windowObj;

  if (dove.userData.lWing) {
    const flap = Math.sin(now * 0.028) * 0.6;
    dove.userData.lWing.rotation.z = flap;
    dove.userData.rWing.rotation.z = -flap;
  }

  camera.position.lerp(new THREE.Vector3(doveCutscene.doveX, 4.3, doveCutscene.goalZ + 6.8), 0.14);
  camera.lookAt(doveCutscene.doveX, 3.2, doveCutscene.winZ);
  updateWallTransparency();

  if (t < 1.65) {
    const openRatio = Math.min(1, t / 0.55);
    if (win) {
      win.lShutter.rotation.y = -openRatio * Math.PI * 0.72;
      win.rShutter.rotation.y = openRatio * Math.PI * 0.72;
    }
    if (t > 0.3) {
      const flyOutP = Math.min(1, (t - 0.3) / 1.2);
      dove.rotation.y = lerpAngle(dove.rotation.y, Math.PI, dt * 14);
      dove.position.x = THREE.MathUtils.lerp(dove.position.x, doveCutscene.doveX, 0.25);
      dove.position.y = THREE.MathUtils.lerp(2.5, 3.85, flyOutP);
      dove.position.z = THREE.MathUtils.lerp(doveCutscene.goalZ, doveCutscene.winZ - 3.2, flyOutP);
    }
    if (t >= 1.35 && doveCutscene.phase === 1) {
      doveCutscene.phase = 2;
      document.getElementById('white-fade').style.opacity = '1';
    }
  } else if (t < 2.4) {
    if (t >= 2.1 && doveCutscene.phase === 2) {
      doveCutscene.phase = 3;
      if (dove.userData.leaf) dove.userData.leaf.visible = true;
      dove.rotation.y = 0;
      dove.position.set(doveCutscene.doveX, 3.85, doveCutscene.winZ - 2.6);
      document.getElementById('white-fade').style.opacity = '0';
      playSfx('rescue');
      showToast('🌿 비둘기가 감람나무 새 잎사귀를 물고 창문으로 돌아왔어요!');
    }
  } else if (t < 4.15) {
    const flyInP = Math.min(1, (t - 2.4) / 1.35), easeOut = 1 - Math.pow(1 - flyInP, 3);
    dove.position.x = doveCutscene.doveX;
    dove.position.y = THREE.MathUtils.lerp(3.85, 2.35, easeOut) + Math.sin(now * 0.012) * 0.1;
    dove.position.z = THREE.MathUtils.lerp(doveCutscene.winZ - 2.6, doveCutscene.goalZ, easeOut);
    if (flyInP > 0.8) dove.rotation.y = lerpAngle(dove.rotation.y, -0.45, dt * 6);
  } else {
    doveCutscene.active = false;
    openStageClearModal(2);
  }
  return true;
}

// -------------------------------------------------------------------------
// [프레임 업데이트] 스테이지 1~3 동물 구출, 비둘기 탐색, 대열 추종 및 출구 이동
// -------------------------------------------------------------------------
function updateNoahStageFrame(dt, now) {
  // 스테이지 1: 초원 동물 7쌍 구출 및 방주 갑판 위 탑승
  if (currentStage === 1) {
    let nearest = null, minDist = 999;
    stageAnimals.forEach((a, idx) => {
      if (a.rescued) {
        a.group.position.y = 6.6 + Math.abs(Math.sin(now * 0.006 + idx)) * 0.15;
        return;
      }
      const dxFromNoah = a.group.position.x - playerPos.x, dzFromNoah = a.group.position.z - playerPos.z;
      const d = Math.hypot(dxFromNoah, dzFromNoah);

      if (currentMode === 'senior' || currentMode === 'timeattack') {
        if (a.avoidTimer > 0) a.avoidTimer -= dt;
        const isFleeing = (d < 10.5);
        if (isFleeing && a.avoidTimer <= 0) {
          a.targetHeading = Math.atan2(dxFromNoah, dzFromNoah);
          if (!a.fleeState) {
            a.fleeState = true;
            a.label.innerHTML = `${ANIMAL_SPECS[a.type].icon} ${ANIMAL_SPECS[a.type].name} 💨도망중!`;
          }
        } else if (!isFleeing && a.fleeState) {
          a.fleeState = false;
          a.label.innerHTML = `${ANIMAL_SPECS[a.type].icon} ${ANIMAL_SPECS[a.type].name} 한 쌍`;
        }

        a.heading = lerpAngle(a.heading, a.targetHeading, dt * 6.5);
        const moveSpd = isFleeing ? 5.3 : 3.2;
        const nx = a.group.position.x + Math.sin(a.heading) * moveSpd * dt;
        const nz = a.group.position.z + Math.cos(a.heading) * moveSpd * dt;

        if (!(Math.abs(nx) > a.limit || nz > a.limit || nz < -10.5) && canMoveTo(nx, nz, 0)) {
          a.group.position.x = nx; a.group.position.z = nz;
        } else {
          a.targetHeading = a.heading + 1.9; a.avoidTimer = 0.65;
        }
        a.group.rotation.y = a.heading;
      }

      if (d < minDist) { minDist = d; nearest = a.group.position; }
      updateWorldLabelPos(a.label, a.group.position, d < 30);

      if (d < 2.35) {
        a.rescued = true;
        if (a.group.userData && a.group.userData.ring) a.group.userData.ring.visible = false;
        a.group.position.set(-7.2 + rescuedPairs * 2.4, 6.6, -16.2);
        a.group.rotation.y = 0;
        a.label.style.opacity = '0';
        rescuedPairs++;
        playSfx('rescue');
        if (currentMode === 'timeattack') {
          timeRemaining += 5.0;
          showToast(`🐾 ${ANIMAL_SPECS[a.type].name} 방주 위 탑승! (+5초 연장!)`);
        } else {
          showToast(`🐾 ${ANIMAL_SPECS[a.type].name} 한 쌍이 방주 위로 올라갔어요! (${rescuedPairs}/7)`);
        }
        document.getElementById('hud-counter-text').textContent = `${rescuedPairs}/7쌍`;
        if (rescuedPairs >= 7) openStageClearModal(1);
      }
    });
    if (nearest && guideArrowGroup.visible) {
      guideArrowGroup.rotation.y = Math.atan2(nearest.x - playerPos.x, nearest.z - playerPos.z) - playerFacing;
    }
  }

  // 스테이지 2 & 3: 방주 안 응원 동물 친구들
  if (currentStage === 2 || currentStage === 3) {
    arkFriends.forEach(f => {
      const swayX = f.baseX + Math.sin(now * 0.002 + f.phase) * 1.4;
      if (canMoveTo(swayX, f.baseZ, 0)) f.group.position.x = swayX;
      const d = Math.hypot(playerPos.x - f.group.position.x, playerPos.z - f.group.position.z);
      updateWorldLabelPos(f.label, f.group.position, d < 18 && !f.met);
      if (!f.met && d < 2.2) {
        f.met = true; f.label.style.opacity = '0'; playSfx('rescue');
        if (currentMode === 'timeattack') {
          timeRemaining += 5.0;
          showToast('⏱️ 동물 친구를 만나 +5초 시간이 늘어났어요!');
        } else {
          showToast('🎉 방주 안 동물 친구가 반갑게 노아를 응원해 주었어요!');
        }
      }
    });
  }

  // 스테이지 2: 공중에서 날고 있는 비둘기
  if (currentStage === 2 && targetObject && !targetObject.triggered) {
    const dove = targetObject.mesh, hoverAngle = now * 0.0032;
    dove.position.x = targetObject.baseX + Math.sin(hoverAngle) * 0.95;
    dove.position.z = targetObject.baseZ + Math.cos(hoverAngle) * 0.55;
    dove.position.y = 2.45 + Math.sin(now * 0.007) * 0.32;
    dove.rotation.y = Math.atan2(Math.cos(hoverAngle) * 0.95, -Math.sin(hoverAngle) * 0.55);

    if (dove.userData.lWing) {
      const flap = Math.sin(now * 0.022) * 0.52;
      dove.userData.lWing.rotation.z = flap;
      dove.userData.rWing.rotation.z = -flap;
    }
    targetObject.pos.copy(dove.position);

    const td = Math.hypot(playerPos.x - targetObject.baseX, playerPos.z - targetObject.baseZ);
    updateWorldLabelPos(targetObject.label, targetObject.pos, (currentMode === 'senior') ? (td < 8.5) : (td < 24.0));

    if (guideArrowGroup.visible) {
      guideArrowGroup.rotation.y = Math.atan2(targetObject.baseX - playerPos.x, targetObject.baseZ - playerPos.z) - playerFacing;
    }

    const ctxBtn = document.getElementById('context-action-btn');
    if (td < 3.8) {
      ctxBtn.classList.remove('hidden');
      ctxBtn.textContent = '🕊️ 창문 열고 비둘기 날리기!';
      if (td < 2.2) triggerContextAction();
    } else {
      ctxBtn.classList.add('hidden');
    }
  }

  // 스테이지 3: 동물 7쌍 수집 + 대열 추종 + 북쪽 출구 문
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
        a.label.style.opacity = '0';
        followingAnimals.push(a);
        rescuedPairs++;
        playSfx('rescue');
        if (currentMode === 'timeattack') {
          timeRemaining += 5.0;
          showToast(`🐾 ${ANIMAL_SPECS[a.type].name} 합류! (+5초! ${rescuedPairs}/7)`);
        } else {
          showToast(`🐾 ${ANIMAL_SPECS[a.type].name} 한 쌍이 노아 뒤를 졸졸 따라와요! (${rescuedPairs}/7)`);
        }
        document.getElementById('hud-counter-text').textContent = `${rescuedPairs}/7쌍`;
        if (rescuedPairs === 7) showToast('🎉 동물 7쌍이 모두 뒤따라와요! 북쪽 벽의 출구 문으로 나가세요!');
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
      } else {
        fa.group.position.y = 0;
      }
    });

    if (targetObject && !targetObject.triggered) {
      const td = Math.hypot(playerPos.x - targetObject.pos.x, playerPos.z - targetObject.pos.z);
      targetObject.label.innerHTML = rescuedPairs >= 7 ? '🚪 방주 출구 문 열림! (새 세상으로 나가기!)' : `🔒 방주 출구 문 (동물 ${rescuedPairs}/7쌍 합류)`;
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
      } else {
        ctxBtn.classList.add('hidden');
      }
    }
  }
}