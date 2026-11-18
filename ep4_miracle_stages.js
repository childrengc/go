// =========================================================================
// [ep4_miracle_stages.js - 파트 1/2] 에피소드 4 : 메인 스테이지 1 · 2 · 3
// - 오픈월드 각 스테이지 시작 지점의 지형·해안선·마을 전경·외곽 낮은 언덕·태양 그림자를 그대로 이어받아 구성
// - 스테이지 3(십자가 사건): 넓어진 골고다 언덕 정상 고원과 세 십자가 등장 연출 적용
// =========================================================================

let miracleStageObjects = [];
let miracleStageCutscene = { active: false, timer: 0, stageNum: 0 };

// 스테이지 내부 머리 위 태그 근접 표시 기준 거리
const MIRACLE_STAGE_TAG_DIST = 11.5;

// 스테이지별 지형 고도 계산기 (오픈월드 각 시작 지점의 경사와 높이를 그대로 반영)
window.getMiracleGroundHeight = function (x, z, st) {
  if (miracleSubMode === 'openworld') {
    return window.getMiracleOpenWorldGroundHeight(x, z);
  }
  if (miracleSubMode === 'main2_loaves') {
    // 동북쪽 외곽 오병이어 전망 언덕: 남쪽 마을 입구(z = 32, y = 0.5)에서 북쪽 언덕 정상(z = -26, y = 13.5)으로 완만하게 융기
    const hillT = Math.max(0, Math.min(1, (32 - z) / 62));
    const bump = Math.sin(x * 0.14) * Math.cos(z * 0.14) * 0.38;
    return Number((0.4 + hillT * hillT * (3 - 2 * hillT) * 13.2 + hillT * bump).toFixed(3));
  }
  if (miracleSubMode === 'main3_cross') {
    // 예루살렘 평지 돌길(z > -8)에서 넓어진 골고다 언덕 정상 고원(z <= -46, y = 9.4)으로 이어지는 오르막 지형
    if (z <= -8) {
      const climbT = Math.max(0, Math.min(1, (-8 - z) / 38));
      const smoothClimb = climbT * climbT * (3 - 2 * climbT);
      const bump = Math.sin(x * 0.14) * Math.cos(z * 0.14) * 0.25;
      return Number((smoothClimb * 9.4 + climbT * bump).toFixed(3));
    }
    return 0;
  }
  if (miracleSubMode === 'ascension') {
    // 감람산 승천 언덕 정상부 완만한 구릉 지형
    const dist = Math.hypot(x / 32, (z + 4) / 32);
    const dome = Math.max(0, 1.0 - dist * dist) * 2.2;
    return Number(dome.toFixed(3));
  }
  return 0;
};

// -------------------------------------------------------------------------
// 1. 오픈월드 스팟 -> 본 스테이지 화면 전환 진입기
// -------------------------------------------------------------------------
function enterMiracleMainStage(stageNum) {
  const wf = document.getElementById('white-fade');
  if (wf) wf.style.opacity = '0.92';
  playSfx('dove');

  setTimeout(() => {
    currentStage = stageNum;
    miracleStageCutscene.active = false;
    miracleStageObjects = [];

    if (currentMode === 'timeattack') {
      timeRemaining = stageNum === 1 ? 42.0 : (stageNum === 2 ? 48.0 : (stageNum === 3 ? 45.0 : 46.0));
      timeAttackFirstRechargeUsed = false;
      isTimeAttackActive = true;
      const timerBox = document.getElementById('hud-timer-box');
      if (timerBox) { timerBox.classList.remove('hidden'); timerBox.classList.add('flex'); }
    } else {
      isTimeAttackActive = false;
    }

    if (stageNum === 1) buildMiracleMainStage1Galilee();
    else if (stageNum === 2) buildMiracleMainStage2Loaves();
    else if (stageNum === 3 && typeof buildMiracleMainStage3Cross === 'function') buildMiracleMainStage3Cross();
    else if (stageNum === 4 && typeof buildMiracleMainStage4Tomb === 'function') buildMiracleMainStage4Tomb();

    updateMiracleNotebookHudBadge();
    updateStageHUD();
    startStageBgm(stageNum);

    setTimeout(() => {
      if (wf) wf.style.opacity = '0';
    }, 280);
  }, 420);
}

function resetMiracleBoatRockingTransform() {
  if (worldGroup) {
    worldGroup.rotation.set(0, 0, 0);
    worldGroup.position.set(0, 0, 0);
  }
  if (playerGroup) {
    playerGroup.rotation.x = 0;
    playerGroup.rotation.z = 0;
  }
}

// -------------------------------------------------------------------------
// 2. [메인 스테이지 1] 갈릴리 바다 (오픈월드 서쪽 해안 선착장 지형과 직접 연결)
// -------------------------------------------------------------------------
function buildMiracleMainStage1Galilee() {
  clearWorld();
  resetMiracleBoatRockingTransform();
  miracleSubMode = 'main1_galilee';
  miracleStageObjects = [];

  if (typeof setupMiracleDynamicSunAndShadows === 'function') {
    setupMiracleDynamicSunAndShadows();
  }

  scene.background = new THREE.Color(0x38bdf8);
  scene.fog = new THREE.Fog(0x7dd3fc, 65, 230);

  const isKinder = (currentMode === 'kinder');
  const reqFish = isKinder ? 3 : 5;
  const reqBails = isKinder ? 4 : 6;

  miracleActiveMiniState = {
    phase: 'catch_fish',
    fishCaught: 0,
    reqFish,
    bailsDone: 0,
    reqBails,
    waterLevel: 20,
    rockPhase: 'calm',
    rockDir: 1,
    rockTimer: 1.8,
    rockAngle: 0,
    rockTarget: 0,
    jesusMesh: null,
    jesusLabel: null,
    peterMesh: null,
    waterSlabMesh: null,
    waves: [],
    skyClouds: []
  };

  const deckHalfW = 6.2;
  const deckHalfD = 12.0;
  currentMapRectBounds = {
    minX: -deckHalfW + 0.6,
    maxX:  deckHalfW - 0.6,
    minZ: -deckHalfD + 1.2,
    maxZ:  deckHalfD - 1.2
  };

  // 1) 갈릴리 바다 수면
  const seaMat = new THREE.MeshLambertMaterial({ color: 0x0284c7, flatShading: true });
  const seaFloor = new THREE.Mesh(new THREE.PlaneGeometry(380, 380, 32, 32), seaMat);
  seaFloor.rotation.x = -Math.PI / 2;
  seaFloor.position.y = -1.2;
  seaFloor.receiveShadow = true;
  worldGroup.add(seaFloor);

  // 2) 배 동쪽(x = 18 ~ 130) 모래사장 없는 완만한 초원 해안 경사 & 선착장 & 마을 원경
  const shoreGeo = new THREE.PlaneGeometry(120, 260, 28, 44);
  shoreGeo.rotateX(-Math.PI / 2);
  const sPos = shoreGeo.attributes.position;
  const sCols = [];
  const cCoastHerb = new THREE.Color('#86b049');
  const cMeadow    = new THREE.Color('#9ec164');
  const cHill      = new THREE.Color('#7ca344');

  for (let i = 0; i < sPos.count; i++) {
    const lx = sPos.getX(i);
    const lz = sPos.getZ(i);
    const distFromWater = Math.max(0, (lx + 60) / 120);
    const sy = -1.3 + Math.pow(distFromWater, 0.85) * 14.5 + Math.sin(lx * 0.08) * Math.cos(lz * 0.06) * 0.65;
    sPos.setY(i, sy);

    const col = distFromWater < 0.25
      ? cCoastHerb.clone().lerp(cMeadow, distFromWater * 4)
      : (sy > 6.5 ? cHill.clone() : cMeadow.clone());
    sCols.push(col.r, col.g, col.b);
  }
  shoreGeo.setAttribute('color', new THREE.Float32BufferAttribute(sCols, 3));
  shoreGeo.computeVertexNormals();
  const shoreMesh = new THREE.Mesh(shoreGeo, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
  shoreMesh.position.set(76, 0, 0);
  shoreMesh.receiveShadow = true;
  worldGroup.add(shoreMesh);

  worldGroup.add(
    createLowPolyMesh(new THREE.BoxGeometry(12.5, 0.35, 3.8), '#92400e', 20, 0.25, 0),
    createLowPolyMesh(new THREE.CylinderGeometry(0.22, 0.22, 2.4, 6), '#5c2d0c', 15.5, -0.5, -1.4),
    createLowPolyMesh(new THREE.CylinderGeometry(0.22, 0.22, 2.4, 6), '#5c2d0c', 15.5, -0.5,  1.4)
  );
  addJudeanRoadsideBuilding(42, -18, 1, -Math.PI / 2, 0.95, false);
  addJudeanRoadsideBuilding(46,  14, 0, -Math.PI / 2, 0.95, false);
  addJudeanRoadsideBuilding(58,  -2, 2, -Math.PI / 2, 1.00, false);
  addLowPolyPalmTree(28, -12, 1.1, false);
  addLowPolyPalmTree(30,  10, 1.1, false);
  addLowPolyOliveTree(38, -28, 1.2, false);
  addLowPolyOliveTree(40,  26, 1.2, false);

  if (typeof createBumpyLowPolyHillMesh === 'function') {
    createBumpyLowPolyHillMesh(88, -55, 26, 13.5, 24, '#7ca344', 11, false);
    createBumpyLowPolyHillMesh(92,   5, 24,  8.5, 22, '#84a955', 22, false);
    createBumpyLowPolyHillMesh(86,  55, 25,  9.0, 22, '#789c4a', 33, false);
    createBumpyLowPolyHillMesh(15, -95, 28,  7.5, 20, '#84a955', 44, false);
  }

  const cloudSpots = [
    [-36, 24, -45, 1.3], [32, 26, -40, 1.4], [-42, 22, 15, 1.2],
    [40, 25, 22, 1.3], [0, 28, -55, 1.5], [0, 26, 48, 1.25]
  ];
  cloudSpots.forEach(([cx, cy, cz, sc]) => {
    const cl = createLowPolyCloudGroup(sc, false);
    cl.position.set(cx, cy, cz);
    worldGroup.add(cl);
    miracleActiveMiniState.skyClouds.push(cl);
  });

  for (let i = 0; i < 44; i++) {
    const ang = (i / 44) * Math.PI * 2;
    const dist = 18 + (i % 5) * 8;
    const wx = Math.cos(ang) * dist;
    const wz = Math.sin(ang) * dist;
    if (wx > 14) continue;
    const waveMesh = createLowPolyMesh(new THREE.DodecahedronGeometry(1.4, 0), '#38bdf8', wx, -0.9, wz, false);
    waveMesh.scale.set(2.2, 0.35, 0.8);
    worldGroup.add(waveMesh);
    miracleActiveMiniState.waves.push({ mesh: waveMesh, baseY: -0.9, phase: i * 0.6 });
  }

  // 3) 대형 갈릴리 어선 갑판과 난간
  const deckFloor = createLowPolyMesh(new THREE.BoxGeometry(deckHalfW * 2, 1.2, deckHalfD * 2), '#b45309', 0, -0.6, 0);
  const bowCone = createLowPolyMesh(new THREE.ConeGeometry(deckHalfW, 6.5, 6), '#92400e', 0, -0.2, -deckHalfD - 2.8);
  bowCone.rotation.x = -Math.PI / 2;
  bowCone.scale.set(1.0, 1.0, 0.35);
  const sternCone = createLowPolyMesh(new THREE.ConeGeometry(deckHalfW, 5.5, 6), '#92400e', 0, -0.2, deckHalfD + 2.4);
  sternCone.rotation.x = Math.PI / 2;
  sternCone.scale.set(1.0, 1.0, 0.35);

  const railL = createLowPolyMesh(new THREE.BoxGeometry(0.55, 1.1, deckHalfD * 2), '#78350f', -deckHalfW, 0.55, 0);
  const railR = createLowPolyMesh(new THREE.BoxGeometry(0.55, 1.1, deckHalfD * 2), '#78350f',  deckHalfW, 0.55, 0);
  const railF = createLowPolyMesh(new THREE.BoxGeometry(deckHalfW * 2, 1.1, 0.55), '#78350f', 0, 0.55, -deckHalfD);
  const railB = createLowPolyMesh(new THREE.BoxGeometry(deckHalfW * 2, 1.1, 0.55), '#78350f', 0, 0.55,  deckHalfD);

  const mast = createLowPolyMesh(new THREE.CylinderGeometry(0.32, 0.42, 11.5, 7), '#5c2d0c', 0, 5.75, -1.5);
  const sail = createLowPolyMesh(new THREE.BoxGeometry(8.6, 6.2, 0.25), '#fef3c7', 0, 6.8, -1.2, true);
  worldGroup.add(deckFloor, bowCone, sternCone, railL, railR, railF, railB, mast, sail);
  wallMeshes.push(mast, sail);
  colliders.push({ minX: -0.65, maxX: 0.65, minZ: -2.15, maxZ: -0.85 });

  const waterSlab = new THREE.Mesh(
    new THREE.BoxGeometry(deckHalfW * 1.85, 0.2, deckHalfD * 1.85),
    new THREE.MeshBasicMaterial({ color: 0x0284c7, transparent: true, opacity: 0.65 })
  );
  waterSlab.position.set(0, 0.05, 0);
  waterSlab.visible = false;
  worldGroup.add(waterSlab);
  miracleActiveMiniState.waterSlabMesh = waterSlab;

  const jesusMesh = createLowPolyPersonMesh('jesus', 0);
  jesusMesh.position.set(0, 0, 9.4);
  jesusMesh.rotation.y = Math.PI;
  worldGroup.add(jesusMesh);
  miracleActiveMiniState.jesusMesh = jesusMesh;
  miracleActiveMiniState.jesusLabel = createWorldLabel('✨ 배 고물에 계신 예수님');
  miracleActiveMiniState.jesusLabel.style.opacity = '0';

  const peterMesh = createLowPolyPersonMesh('disciple', 1);
  peterMesh.position.set(-2.8, 0, -7.5);
  worldGroup.add(peterMesh);
  miracleActiveMiniState.peterMesh = peterMesh;

  const fishSpots = [
    [-4.8, -8.0], [4.8, -8.0], [-4.8, -1.5], [4.8, -1.5], [0, -9.8]
  ];
  for (let i = 0; i < reqFish; i++) {
    const [fx, fz] = fishSpots[i % fishSpots.length];
    const fGrp = new THREE.Group();
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.1, 1.55, 20),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.08;

    for (let k = 0; k < 3; k++) {
      const fish = (typeof createLowPolyFishMesh === 'function')
        ? createLowPolyFishMesh(k % 2 === 0 ? '#f97316' : '#38bdf8', 0.9)
        : createLowPolyMesh(new THREE.ConeGeometry(0.24, 0.75, 5), k % 2 === 0 ? '#f97316' : '#38bdf8', 0, 0, 0, false);
      fish.position.set((k - 1) * 0.45, 0.45 + k * 0.15, 0);
      fish.rotation.y = (k - 1) * 0.6;
      fGrp.add(fish);
    }
    fGrp.add(ring);
    fGrp.position.set(fx, 0, fz);
    worldGroup.add(fGrp);

    const lbl = createWorldLabel(`🐟 물고기 떼 그물 당기기! (${i + 1}/${reqFish})`);
    lbl.style.opacity = '0';
    miracleStageObjects.push({
      kind: 'fish_spot',
      mesh: fGrp,
      pos: new THREE.Vector3(fx, 0.5, fz),
      done: false,
      phase: i * 0.8,
      label: lbl
    });
  }

  playerPos.set(0, 0, 2.0);
  lastGroundedY = 0;
  playerVelY = 0;
  isGrounded = true;
  playerFacing = Math.PI;
  cameraYaw = 0;
  cameraTargetYaw = 0;
  snapCameraToPlayer();

  showToast(`🐟 [1단계] 갈릴리 바다에서 그물을 던져 물고기 떼 ${reqFish}곳을 모두 잡아 올리세요!`);
}

function startGalileeStormPhase() {
  const st = miracleActiveMiniState;
  st.phase = 'storm';
  st.bailsDone = 0;
  st.waterLevel = 25;

  scene.background = new THREE.Color(0x1e293b);
  scene.fog = new THREE.Fog(0x1e293b, 28, 110);
  if (st.waterSlabMesh) st.waterSlabMesh.visible = true;
  if (st.skyClouds) {
    st.skyClouds.forEach(cl => {
      cl.traverse(ch => {
        if (ch.isMesh) ch.material = matLowPoly('#334155');
      });
    });
  }
  playRainOrSeaSound(5.0, true);
  playSfx('thunder');
  startStageBgm(1);

  const puddleSpots = [
    [-3.6, -6.5], [3.6, -6.5], [-3.6, 1.5], [3.6, 1.5], [0, -4.5], [0, 4.2]
  ];
  for (let i = 0; i < st.reqBails; i++) {
    const [px, pz] = puddleSpots[i % puddleSpots.length];
    const pGrp = new THREE.Group();
    const puddle = createLowPolyMesh(new THREE.CylinderGeometry(1.35, 1.35, 0.14, 12), '#0284c7', 0, 0.08, 0, false);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.2, 1.6, 20),
      new THREE.MeshBasicMaterial({ color: 0xf43f5e, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.16;
    pGrp.add(puddle, ring);
    pGrp.position.set(px, 0, pz);
    worldGroup.add(pGrp);

    const lbl = createWorldLabel('🪣 차오른 바닷물 퍼내기! (다가가기)');
    lbl.style.opacity = '0';
    miracleStageObjects.push({
      kind: 'bail_spot',
      mesh: pGrp,
      pos: new THREE.Vector3(px, 0.4, pz),
      done: false,
      label: lbl
    });
  }

  updateStageHUD();
  showToast('⛈️ [2단계] 갑자기 큰 폭풍우가 몰아쳐 배에 물이 차오릅니다! 흔들리는 배 위에서 물웅덩이를 빠르게 퍼내세요!');
}

function updateMiracleMainStage1Frame(dt, now) {
  if (typeof updateMiracleDynamicSun === 'function') {
    updateMiracleDynamicSun(dt, now);
  }
  const st = miracleActiveMiniState;

  if (st.waves) {
    const amp = (st.phase === 'storm') ? 0.85 : 0.22;
    const spd = (st.phase === 'storm') ? 0.009 : 0.003;
    st.waves.forEach(w => {
      w.mesh.position.y = w.baseY + Math.sin(now * spd + w.phase) * amp;
    });
  }

  if (st.peterMesh && st.peterMesh.userData) {
    const pu = st.peterMesh.userData;
    const pSway = Math.sin(now * 0.004) * 1.4;
    st.peterMesh.position.x = -2.8 + pSway;
    const walkSw = Math.cos(now * 0.012) * 0.45;
    if (pu.lLeg && pu.rLeg) { pu.lLeg.rotation.x = walkSw; pu.rLeg.rotation.x = -walkSw; }
    if (pu.lArm && pu.rArm) { pu.lArm.rotation.x = -0.6 + walkSw * 0.5; pu.rArm.rotation.x = -0.6 - walkSw * 0.5; }
  }

  if (miracleStageCutscene.active) {
    miracleStageCutscene.timer += dt;
    const t = miracleStageCutscene.timer;
    resetMiracleBoatRockingTransform();
    camera.position.lerp(new THREE.Vector3(0, 4.8, 2.5), 0.08);
    camera.lookAt(0, 1.8, 9.4);

    if (st.jesusMesh && st.jesusMesh.userData.rArm) {
      st.jesusMesh.userData.rArm.rotation.x = -2.2 + Math.sin(now * 0.008) * 0.2;
    }
    if (t >= 3.4) {
      miracleStageCutscene.active = false;
      miracleMainStagesCleared[1] = true;
      unlockMiracleNotebookEntry('mir_storm', true);
      unlockMiracleNotebookEntry('mir_fish', true);
      openStageClearModal(1);
    }
    return;
  }

  let nextGuidePos = null;

  if (st.phase === 'catch_fish') {
    miracleStageObjects.forEach(obj => {
      if (obj.kind !== 'fish_spot' || obj.done) return;
      obj.mesh.position.y = Math.abs(Math.sin(now * 0.008 + obj.phase)) * 0.35;
      const d = Math.hypot(playerPos.x - obj.pos.x, playerPos.z - obj.pos.z);
      updateWorldLabelPos(obj.label, obj.pos, d < MIRACLE_STAGE_TAG_DIST);
      if (!nextGuidePos) nextGuidePos = obj.pos;

      if (d < 2.3) {
        obj.done = true;
        obj.mesh.visible = false;
        obj.label.style.opacity = '0';
        st.fishCaught++;
        playerChopAnimTimer = 0.35;
        playSfx('rescue');
        if (currentMode === 'timeattack') timeRemaining += 5.0;

        if (st.fishCaught >= st.reqFish) {
          startGalileeStormPhase();
        } else {
          updateStageHUD();
          showToast(`🐟 만선의 그물! 물고기를 끌어올렸어요! (${st.fishCaught}/${st.reqFish})`);
        }
      }
    });
  }

  if (st.phase === 'storm' || st.phase === 'wake_jesus') {
    st.rockTimer -= dt;
    if (st.rockTimer <= 0) {
      if (st.rockPhase === 'calm') {
        st.rockPhase = 'tilt';
        st.rockTarget = st.rockDir * (0.048 + Math.random() * 0.02);
        st.rockDir *= -1;
        st.rockTimer = 1.8 + Math.random() * 1.2;
      } else {
        st.rockPhase = 'calm';
        st.rockTarget = 0;
        st.rockTimer = 2.0 + Math.random() * 1.8;
      }
    }
    st.rockAngle = THREE.MathUtils.lerp(st.rockAngle, st.rockTarget, dt * 2.0);

    if (Math.abs(st.rockAngle) > 0.008) {
      const slideVx = -Math.sin(st.rockAngle) * 20.0;
      const nx = playerPos.x + slideVx * dt;
      if (canMoveTo(nx, playerPos.z, playerPos.y, true)) playerPos.x = nx;
    }

    if (worldGroup) {
      const cosT = Math.cos(st.rockAngle);
      const sinT = Math.sin(st.rockAngle);
      worldGroup.rotation.z = st.rockAngle;
      worldGroup.position.x = playerPos.x - (playerPos.x * cosT - playerPos.y * sinT);
      worldGroup.position.y = playerPos.y - (playerPos.x * sinT + playerPos.y * cosT);
    }
    if (playerGroup) {
      playerGroup.rotation.z = st.rockAngle;
    }
  }

  if (st.phase === 'storm') {
    miracleStageObjects.forEach(obj => {
      if (obj.kind !== 'bail_spot' || obj.done) return;
      const d = Math.hypot(playerPos.x - obj.pos.x, playerPos.z - obj.pos.z);
      updateWorldLabelPos(obj.label, obj.pos, d < MIRACLE_STAGE_TAG_DIST);
      if (!nextGuidePos) nextGuidePos = obj.pos;

      if (d < 2.2) {
        obj.done = true;
        obj.mesh.visible = false;
        obj.label.style.opacity = '0';
        st.bailsDone++;
        playerChopAnimTimer = 0.4;
        playSfx('switch');
        if (currentMode === 'timeattack') timeRemaining += 5.0;

        if (st.bailsDone >= st.reqBails) {
          st.phase = 'wake_jesus';
          if (st.jesusLabel) {
            st.jesusLabel.innerHTML = '🙏 주무시는 예수님 깨우기! ("주여, 우리가 죽겠나이다!")';
          }
          updateStageHUD();
          showToast('🙏 물을 모두 퍼냈어요! 이제 배 뒤쪽(고물)에 계신 예수님께 달려가 도움을 구하세요!');
        } else {
          updateStageHUD();
          showToast(`🪣 바가지로 바닷물을 퍼냈어요! (${st.bailsDone}/${st.reqBails})`);
        }
      }
    });
  }

  if (st.jesusMesh && st.jesusLabel) {
    const jd = Math.hypot(playerPos.x - st.jesusMesh.position.x, playerPos.z - st.jesusMesh.position.z);
    const showJesusTag = (st.phase === 'wake_jesus') ? (jd < 14.0) : (jd < 9.5);
    updateWorldLabelPos(st.jesusLabel, st.jesusMesh.position, showJesusTag);

    if (st.phase === 'wake_jesus') {
      nextGuidePos = st.jesusMesh.position;
      if (jd < 3.0) {
        st.phase = 'calm';
        isTimeAttackActive = false;
        resetMiracleBoatRockingTransform();
        if (st.waterSlabMesh) st.waterSlabMesh.visible = false;
        if (st.jesusLabel) st.jesusLabel.style.opacity = '0';

        const wf = document.getElementById('white-fade');
        if (wf) wf.style.opacity = '0.85';
        setTimeout(() => {
          scene.background = new THREE.Color(0x38bdf8);
          scene.fog = new THREE.Fog(0xbae6fd, 50, 180);
          if (st.skyClouds) {
            st.skyClouds.forEach(cl => {
              cl.traverse(ch => {
                if (ch.isMesh) ch.material = matLowPoly('#ffffff');
              });
            });
          }
          if (wf) wf.style.opacity = '0';
        }, 350);

        miracleStageCutscene.active = true;
        miracleStageCutscene.timer = 0;
        miracleStageCutscene.stageNum = 1;
        startStageBgm(1);
        playSfx('clear');
        showToast('✨ 예수께서 바람을 꾸짖으시며 "잠잠하라! 고요하라!" 하시니 바람이 그치고 아주 잔잔하여졌습니다!');
      }
    }
  }

  if (nextGuidePos && guideArrowGroup && guideArrowGroup.visible) {
    const baseFacing = (window.globalCameraViewMode === 'fps') ? (cameraYaw + Math.PI) : playerFacing;
    guideArrowGroup.rotation.y = Math.atan2(nextGuidePos.x - playerPos.x, nextGuidePos.z - playerPos.z) - baseFacing;
  }
}

// -------------------------------------------------------------------------
// 3. [메인 스테이지 2] 오병이어 사건 (오픈월드 동북쪽 외곽 전망 언덕 지형 그대로 연동)
// -------------------------------------------------------------------------
function buildMiracleMainStage2Loaves() {
  clearWorld();
  resetMiracleBoatRockingTransform();
  miracleSubMode = 'main2_loaves';
  miracleStageObjects = [];

  if (typeof setupMiracleDynamicSunAndShadows === 'function') {
    setupMiracleDynamicSunAndShadows();
  }

  scene.background = new THREE.Color(0x38bdf8);
  scene.fog = new THREE.Fog(0xbae6fd, 90, 290);

  const isKinder = (currentMode === 'kinder');
  const reqBaskets = isKinder ? 8 : 12;

  miracleActiveMiniState = {
    phase: 'climb_hill',
    helpedCount: 0,
    reqHelp: 2,
    boyFound: false,
    basketsGathered: 0,
    reqBaskets,
    jesusPos: new THREE.Vector3(0, getMiracleGroundHeight(0, -24, 2), -24),
    jesusLabel: null,
    crowdList: []
  };

  currentMapRectBounds = { minX: -32, maxX: 32, minZ: -38, maxZ: 34 };

  const hillGeo = new THREE.PlaneGeometry(180, 180, 56, 56);
  hillGeo.rotateX(-Math.PI / 2);
  const posAttr = hillGeo.attributes.position;
  const cols = [];
  const cGrassLow  = new THREE.Color('#9ec164');
  const cGrassMid  = new THREE.Color('#82a84d');
  const cGrassHigh = new THREE.Color('#6b9436');
  const cPath      = new THREE.Color('#c89d6c');

  for (let i = 0; i < posAttr.count; i++) {
    const vx = posAttr.getX(i);
    const vz = posAttr.getZ(i);
    let vy = getMiracleGroundHeight(vx, vz, 2);
    if (vz > 34) {
      vy = Math.max(-0.3, 0.4 - (vz - 34) * 0.03);
    }
    posAttr.setY(i, vy);

    const onTrail = Math.abs(vx - Math.sin(vz * 0.08) * 4.5) < 3.8 && vz > -24 && vz < 55;
    const c = onTrail
      ? cPath.clone()
      : (vy > 8.5 ? cGrassHigh.clone() : (vy > 3.5 ? cGrassMid.clone() : cGrassLow.clone()));
    cols.push(c.r, c.g, c.b);
  }
  hillGeo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  hillGeo.computeVertexNormals();
  const hillMesh = new THREE.Mesh(hillGeo, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
  hillMesh.receiveShadow = true;
  worldGroup.add(hillMesh);

  const distantSea = new THREE.Mesh(
    new THREE.PlaneGeometry(180, 260),
    new THREE.MeshLambertMaterial({ color: 0x0284c7, transparent: true, opacity: 0.86, flatShading: true })
  );
  distantSea.rotation.x = -Math.PI / 2;
  distantSea.position.set(-115, -0.35, 30);
  worldGroup.add(distantSea);

  const villageVistaHouses = [
    { x: -16, z: 28, v: 0, yaw:  Math.PI / 2 - 0.15, sc: 0.96 },
    { x:  16, z: 28, v: 2, yaw: -Math.PI / 2 + 0.15, sc: 0.96 },
    { x: -18, z: 14, v: 1, yaw:  Math.PI / 2 - 0.10, sc: 0.94 },
    { x:  18, z: 14, v: 4, yaw: -Math.PI / 2 + 0.10, sc: 0.94 },
    { x: -24, z: 46, v: 3, yaw:  0.2,  sc: 0.95 },
    { x:  -8, z: 52, v: 1, yaw: -0.1,  sc: 0.98 },
    { x:  14, z: 48, v: 2, yaw: -0.25, sc: 0.95 },
    { x: -38, z: 58, v: 0, yaw:  0.3,  sc: 0.92 }
  ];
  villageVistaHouses.forEach(vh => {
    addJudeanRoadsideBuilding(vh.x, vh.z, vh.v, vh.yaw, vh.sc, false);
  });

  if (typeof createBumpyLowPolyHillMesh === 'function') {
    for (let i = 0; i < 6; i++) {
      createBumpyLowPolyHillMesh(-40 + i * 18, -52 - (i % 2) * 5, 18, 6.8 + (i % 2) * 1.5, 16, '#7ca344', i + 10, true);
    }
    for (let i = 0; i < 5; i++) {
      createBumpyLowPolyHillMesh(48 + (i % 2) * 5, -36 + i * 18, 17, 6.5 + (i % 2) * 1.5, 17, '#84a955', i + 30, true);
    }
  }

  if (typeof addLowPolyCanopyTree === 'function') {
    addLowPolyCanopyTree(-20, -26, 1.25, true);
    addLowPolyCanopyTree( 20, -28, 1.25, true);
  }

  [
    [-22, 2], [22, 2], [-24, -8], [24, -8], [-22, -22], [22, -22],
    [-16, -34], [16, -34], [-26, -16], [26, -16]
  ].forEach(([tx, tz], i) => {
    if (i % 3 === 0) addLowPolyCypressPineTree(tx, tz, 1.15, true);
    else addLowPolyOliveTree(tx, tz, 1.15 + (i % 2) * 0.15, true);
  });

  if (typeof addLowPolyWildflowerCluster === 'function') {
    [[-10, 18], [10, 16], [-12, 4], [12, 6], [-14, -10], [14, -8], [-8, -28], [8, -28]].forEach(([fx, fz]) => {
      addLowPolyWildflowerCluster(fx, fz, 1.0);
    });
  }
  if (typeof createLowPolyAnimalMesh === 'function') {
    const deer = createLowPolyAnimalMesh('deer', 0.95);
    deer.position.set(-15, getMiracleGroundHeight(-15, -4, 2), -4);
    deer.rotation.y = 0.8;
    worldGroup.add(deer);
  }

  addLowPolyRock(-12, 6, 1.5, 0.75, '#94a3b8', true);
  addLowPolyRock( 14, -4, 1.7, 0.80, '#8c8275', true);

  [[-24, 28, -20, 1.25], [22, 30, -15, 1.35], [0, 32, -38, 1.4], [-18, 26, 18, 1.15]].forEach(([cx, cy, cz, sc]) => {
    const cl = createLowPolyCloudGroup(sc, false);
    cl.position.set(cx, cy, cz);
    worldGroup.add(cl);
  });

  const jY = getMiracleGroundHeight(0, -24, 2);
  const jesusMesh = createLowPolyPersonMesh('jesus', 0);
  jesusMesh.position.set(0, jY, -24);
  worldGroup.add(jesusMesh);
  miracleActiveMiniState.jesusLabel = createWorldLabel('✨ 무리를 불쌍히 여기시는 예수님');
  miracleActiveMiniState.jesusLabel.style.opacity = '0';

  for (let i = 0; i < 24; i++) {
    const ang = (i / 24) * Math.PI * 1.4 - Math.PI * 0.2;
    const rad = 7.5 + (i % 3) * 3.8;
    const cx = Math.cos(ang) * rad;
    const cz = -22 + Math.sin(ang) * rad * 0.8;
    const cy = getMiracleGroundHeight(cx, cz, 2);
    const pMesh = createLowPolyPersonMesh(i % 4 === 0 ? 'woman' : 'villager', i);
    pMesh.position.set(cx, cy, cz);
    pMesh.lookAt(0, jY, -24);
    worldGroup.add(pMesh);
    miracleActiveMiniState.crowdList.push({ mesh: pMesh, baseX: cx, baseZ: cz, phase: i * 0.7 });
  }

  const helpEvents = [
    { x: -4.5, z: 14, title: '💧 지친 할아버지께 시원한 물 드리기 (다가가기)', msg: '🙌 지친 할아버지께 시원한 물을 드려 힘을 얻게 해드렸어요!' },
    { x:  4.8, z:  2, title: '👧 엄마를 찾는 아이 손잡아 안내하기 (다가가기)', msg: '🙌 길을 잃을 뻔한 아이를 언덕길로 안전하게 안내해 주었어요!' }
  ];
  helpEvents.forEach((he, idx) => {
    const hy = getMiracleGroundHeight(he.x, he.z, 2);
    const hGrp = new THREE.Group();
    const npc = createLowPolyPersonMesh(idx === 1 ? 'child' : 'villager', idx + 10);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.1, 1.6, 20),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.08;
    hGrp.add(npc, ring);
    hGrp.position.set(he.x, hy, he.z);
    worldGroup.add(hGrp);

    const lbl = createWorldLabel(he.title);
    lbl.style.opacity = '0';
    miracleStageObjects.push({
      kind: 'hill_help',
      mesh: hGrp,
      pos: new THREE.Vector3(he.x, hy + 0.5, he.z),
      msg: he.msg,
      done: false,
      label: lbl
    });
  });

  const boyX = 13.5, boyZ = -18.5;
  const boyY = getMiracleGroundHeight(boyX, boyZ, 2);
  const boyGrp = new THREE.Group();
  const boyMesh = createLowPolyPersonMesh('child', 7);
  const basketMesh = createLowPolyMesh(new THREE.CylinderGeometry(0.35, 0.28, 0.36, 8), '#d97706', 0, 0.85, 0.42);
  const boyRing = new THREE.Mesh(
    new THREE.RingGeometry(1.2, 1.7, 20),
    new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide })
  );
  boyRing.rotation.x = -Math.PI / 2;
  boyRing.position.y = 0.08;
  boyGrp.add(boyMesh, basketMesh, boyRing);
  boyGrp.position.set(boyX, boyY, boyZ);
  boyGrp.visible = false;
  worldGroup.add(boyGrp);

  const boyLbl = createWorldLabel('🍱 보리떡 5개와 물고기 2마리 도시락을 가진 꼬마!');
  boyLbl.style.opacity = '0';
  miracleStageObjects.push({
    kind: 'lunch_boy',
    mesh: boyGrp,
    pos: new THREE.Vector3(boyX, boyY + 0.5, boyZ),
    done: false,
    label: boyLbl
  });

  playerPos.set(0, getMiracleGroundHeight(0, 26, 2), 26);
  lastGroundedY = playerPos.y;
  playerVelY = 0;
  isGrounded = true;
  playerFacing = Math.PI;
  cameraYaw = 0;
  cameraTargetYaw = 0;
  snapCameraToPlayer();

  showToast('⛰️ [1단계] 마을이 내려다보이는 오병이어 언덕길에서 이웃 2명을 도우며 정상으로 올라가세요!');
}

function spawnTwelveLeftoverBaskets(count) {
  for (let i = 0; i < count; i++) {
    const ang = (i / count) * Math.PI * 2;
    const rad = 6.5 + (i % 3) * 4.2;
    const bx = Math.cos(ang) * rad;
    const bz = -18 + Math.sin(ang) * (rad * 0.75);
    const by = getMiracleGroundHeight(bx, bz, 2);

    const bGrp = new THREE.Group();
    const basket = createLowPolyMesh(new THREE.CylinderGeometry(0.48, 0.36, 0.45, 8), '#d97706', 0, 0.25, 0);
    const breadCap = createLowPolyMesh(new THREE.IcosahedronGeometry(0.38, 0), '#fde047', 0, 0.52, 0, false);
    breadCap.scale.set(1.1, 0.6, 1.1);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.85, 1.25, 18),
      new THREE.MeshBasicMaterial({ color: 0x4ade80, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.06;
    bGrp.add(basket, breadCap, ring);
    bGrp.position.set(bx, by, bz);
    worldGroup.add(bGrp);

    const lbl = createWorldLabel(`🧺 남은 떡 광주리 (${i + 1}/${count})`);
    lbl.style.opacity = '0';
    miracleStageObjects.push({
      kind: 'leftover_basket',
      mesh: bGrp,
      pos: new THREE.Vector3(bx, by + 0.4, bz),
      done: false,
      label: lbl
    });
  }
}

function updateMiracleMainStage2Frame(dt, now) {
  if (typeof updateMiracleDynamicSun === 'function') {
    updateMiracleDynamicSun(dt, now);
  }
  const st = miracleActiveMiniState;
  let nextGuidePos = null;

  if (st.crowdList) {
    st.crowdList.forEach(c => {
      const u = c.mesh.userData;
      if (u && u.lArm && u.rArm) {
        const wave = Math.sin(now * 0.005 + c.phase) * 0.25;
        u.lArm.rotation.x = -0.35 + wave;
        u.rArm.rotation.x = -0.35 - wave;
      }
    });
  }

  if (st.phase === 'climb_hill') {
    miracleStageObjects.forEach(obj => {
      if (obj.kind !== 'hill_help' || obj.done) return;
      const d = Math.hypot(playerPos.x - obj.pos.x, playerPos.z - obj.pos.z);
      updateWorldLabelPos(obj.label, obj.pos, d < MIRACLE_STAGE_TAG_DIST);
      if (!nextGuidePos) nextGuidePos = obj.pos;

      if (d < 2.4) {
        obj.done = true;
        obj.label.style.opacity = '0';
        st.helpedCount++;
        playSfx('rescue');
        if (currentMode === 'timeattack') timeRemaining += 6.0;

        if (st.helpedCount >= st.reqHelp) {
          st.phase = 'find_boy';
          const boyObj = miracleStageObjects.find(x => x.kind === 'lunch_boy');
          if (boyObj) boyObj.mesh.visible = true;
          updateStageHUD();
          showToast('🍱 [2단계] 언덕 정상에 도착했어요! 무리 오른쪽에서 도시락을 가진 꼬마를 찾아보세요!');
        } else {
          updateStageHUD();
          showToast(obj.msg);
        }
      }
    });
  } else if (st.phase === 'find_boy') {
    const boyObj = miracleStageObjects.find(x => x.kind === 'lunch_boy');
    if (boyObj && !boyObj.done) {
      const d = Math.hypot(playerPos.x - boyObj.pos.x, playerPos.z - boyObj.pos.z);
      updateWorldLabelPos(boyObj.label, boyObj.pos, d < MIRACLE_STAGE_TAG_DIST);
      nextGuidePos = boyObj.pos;

      if (d < 2.6) {
        boyObj.done = true;
        boyObj.mesh.visible = false;
        boyObj.label.style.opacity = '0';
        st.phase = 'bring_to_jesus';
        playSfx('rescue');
        if (currentMode === 'timeattack') timeRemaining += 7.0;
        if (st.jesusLabel) st.jesusLabel.innerHTML = '🍞 예수님께 어린아이의 오병이어 도시락 드리기!';
        updateStageHUD();
        showToast('🍞 어린아이의 보리떡 5개와 물고기 2마리를 받았어요! 언덕 위 예수님께 가져다드리세요!');
      }
    }
  } else if (st.phase === 'bring_to_jesus') {
    nextGuidePos = st.jesusPos;
    const jd = Math.hypot(playerPos.x - st.jesusPos.x, playerPos.z - st.jesusPos.z);
    if (st.jesusLabel) updateWorldLabelPos(st.jesusLabel, st.jesusPos, jd < MIRACLE_STAGE_TAG_DIST);

    if (jd < 3.0) {
      st.phase = 'gather_baskets';
      if (st.jesusLabel) st.jesusLabel.style.opacity = '0';
      spawnTwelveLeftoverBaskets(st.reqBaskets);
      playSfx('clear');
      if (currentMode === 'timeattack') timeRemaining += 8.0;
      updateStageHUD();
      showToast(`🧺 [3단계] 예수님이 축사하시자 모두가 배불리 먹었습니다! 남은 조각 ${st.reqBaskets}광주리를 모두 거두세요!`);
    }
  } else if (st.phase === 'gather_baskets') {
    miracleStageObjects.forEach(obj => {
      if (obj.kind !== 'leftover_basket' || obj.done) return;
      obj.mesh.rotation.y += dt * 1.8;
      const d = Math.hypot(playerPos.x - obj.pos.x, playerPos.z - obj.pos.z);
      updateWorldLabelPos(obj.label, obj.pos, d < MIRACLE_STAGE_TAG_DIST);
      if (!nextGuidePos) nextGuidePos = obj.pos;

      if (d < 2.3) {
        obj.done = true;
        obj.mesh.visible = false;
        obj.label.style.opacity = '0';
        st.basketsGathered++;
        playSfx('rescue');
        if (currentMode === 'timeattack') timeRemaining += 4.0;

        if (st.basketsGathered >= st.reqBaskets) {
          miracleMainStagesCleared[2] = true;
          unlockMiracleNotebookEntry('mir_loaves', true);
          openStageClearModal(2);
          return;
        } else {
          updateStageHUD();
          showToast(`🧺 남은 조각 광주리 수거! (${st.basketsGathered}/${st.reqBaskets})`);
        }
      }
    });
  }

  if (nextGuidePos && guideArrowGroup && guideArrowGroup.visible) {
    const baseFacing = (window.globalCameraViewMode === 'fps') ? (cameraYaw + Math.PI) : playerFacing;
    guideArrowGroup.rotation.y = Math.atan2(nextGuidePos.x - playerPos.x, nextGuidePos.z - playerPos.z) - baseFacing;
  }
}

// -------------------------------------------------------------------------
// 4. [메인 스테이지 3] 십자가 사건: 넓어진 골고다 언덕과 세 십자가 등장 연출
//    - 골고다 언덕 정상부를 넓게(x: -28 ~ +28, z: -42 ~ -64) 확장하고,
//      예수님과 함께 십자가를 지고 올라가는 골고다 언덕 정상 위에 세 십자가가 우뚝 서 있도록 구현!
// -------------------------------------------------------------------------
function buildMiracleMainStage3Cross() {
  clearWorld();
  resetMiracleBoatRockingTransform();
  miracleSubMode = 'main3_cross';
  miracleStageObjects = [];

  if (typeof setupMiracleDynamicSunAndShadows === 'function') {
    setupMiracleDynamicSunAndShadows();
  }

  scene.background = new THREE.Color(0x94a3b8);
  scene.fog = new THREE.Fog(0x94a3b8, 55, 195);

  miracleActiveMiniState = {
    phase: 'find_jesus',
    cluesFound: 0,
    reqClues: 2,
    jesusMesh: null,
    jesusLabel: null,
    crossProp: null,
    goalRing: null,
    goalPos: new THREE.Vector3(0, getMiracleGroundHeight(0, -50, 3), -50),
    goalLabel: null,
    summitCrossesGrp: null
  };

  // 넓어진 골고다 언덕을 자유롭게 오를 수 있도록 좌우 경계 확장 (-26 ~ +26)
  currentMapRectBounds = { minX: -26, maxX: 26, minZ: -60, maxZ: 34 };

  // 1) 예루살렘 광장 돌길(z = 48 ~ -8) + 넓어진 골고다 언덕 고원(z = -8 ~ -72) 연속 지형
  const roadGeo = new THREE.PlaneGeometry(130, 140, 44, 56);
  roadGeo.rotateX(-Math.PI / 2);
  const posAttr = roadGeo.attributes.position;
  const cols = [];
  const cStreet   = new THREE.Color('#d6ccc2');
  const cRoadMain = new THREE.Color('#c89d6c');
  const cMeadow   = new THREE.Color('#9ec164');
  const cGolgotha = new THREE.Color('#8c8275');

  for (let i = 0; i < posAttr.count; i++) {
    const vx = posAttr.getX(i);
    const vz = posAttr.getZ(i);
    const vy = getMiracleGroundHeight(vx, vz, 3);
    posAttr.setY(i, vy);
    const onCenterRoad = Math.abs(vx) < 5.2 && vz > -50;
    const c = onCenterRoad
      ? cRoadMain
      : (vz < -8 ? (Math.abs(vx) < 28 ? cGolgotha : cMeadow) : cStreet);
    cols.push(c.r, c.g, c.b);
  }
  roadGeo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  roadGeo.computeVertexNormals();
  const roadMesh = new THREE.Mesh(roadGeo, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
  roadMesh.receiveShadow = true;
  worldGroup.add(roadMesh);

  // [핵심 요청사항] 넓어진 골고다 언덕 정상(z = -54)에 세워진 세 개의 십자가!
  const summitCrossesGrp = new THREE.Group();
  [
    [ 0.0, -54.5, 1.42, 0.0],   // 중앙 큰 십자가
    [-7.2, -53.0, 1.08,  0.18], // 좌측 십자가
    [ 7.2, -53.0, 1.08, -0.18]  // 우측 십자가
  ].forEach(([cx, cz, sc, rotY]) => {
    const cy = getMiracleGroundHeight(cx, cz, 3);
    const singleCross = new THREE.Group();
    const rockBase = createLowPolyMesh(new THREE.DodecahedronGeometry(1.05 * sc, 0), '#78716c', 0, 0.35 * sc, 0, true);
    rockBase.scale.set(1.25, 0.55, 1.25);
    const vBeam = createLowPolyMesh(new THREE.CylinderGeometry(0.20 * sc, 0.25 * sc, 5.5 * sc, 6), '#5c2d0c', 0, 2.75 * sc, 0, true);
    const hBeam = createLowPolyMesh(new THREE.CylinderGeometry(0.16 * sc, 0.16 * sc, 3.3 * sc, 6), '#5c2d0c', 0, 4.0 * sc, 0, true);
    hBeam.rotation.z = Math.PI / 2;
    singleCross.add(rockBase, vBeam, hBeam);
    singleCross.position.set(cx, cy, cz);
    singleCross.rotation.y = rotY;
    summitCrossesGrp.add(singleCross);
  });
  worldGroup.add(summitCrossesGrp);
  miracleActiveMiniState.summitCrossesGrp = summitCrossesGrp;

  // 출발지 바로 뒤편(z = 38) 예루살렘 황금 성문과 성전
  const gateTowerL = createLowPolyMesh(new THREE.CylinderGeometry(3.4, 3.8, 8.5, 8), '#e8d8be', -7.2, 4.25, 38);
  const gateTowerR = createLowPolyMesh(new THREE.CylinderGeometry(3.4, 3.8, 8.5, 8), '#e8d8be',  7.2, 4.25, 38);
  const gateArch   = createLowPolyMesh(new THREE.BoxGeometry(10.5, 2.2, 3.6), '#d6c3a5', 0, 7.4, 38);
  const gateDomeL  = createLowPolyMesh(new THREE.IcosahedronGeometry(3.2, 0), '#eab308', -7.2, 8.8, 38);
  const gateDomeR  = createLowPolyMesh(new THREE.IcosahedronGeometry(3.2, 0), '#eab308',  7.2, 8.8, 38);
  gateDomeL.scale.set(1, 0.6, 1); gateDomeR.scale.set(1, 0.6, 1);
  const templeMain = createLowPolyMesh(new THREE.BoxGeometry(16, 7.5, 11), '#f8f4ec', 0, 3.75, 52);
  const templeRoof = createLowPolyMesh(new THREE.CylinderGeometry(0.8, 9.5, 2.4, 4), '#facc15', 0, 8.7, 52);
  templeRoof.rotation.y = Math.PI / 4;
  worldGroup.add(gateTowerL, gateTowerR, gateArch, gateDomeL, gateDomeR, templeMain, templeRoof);

  const streetHouses = [
    { x: -14, z: 26, v: 0, yaw:  Math.PI / 2 },
    { x:  14, z: 26, v: 1, yaw: -Math.PI / 2 },
    { x: -14, z: 18, v: 2, yaw:  Math.PI / 2 },
    { x:  14, z: 18, v: 3, yaw: -Math.PI / 2 },
    { x: -14, z:  4, v: 1, yaw:  Math.PI / 2 },
    { x:  14, z:  4, v: 0, yaw: -Math.PI / 2 },
    { x: -14, z: -4, v: 4, yaw:  Math.PI / 2 },
    { x:  14, z: -4, v: 2, yaw: -Math.PI / 2 }
  ];
  streetHouses.forEach(sh => {
    addJudeanRoadsideBuilding(sh.x, sh.z, sh.v, sh.yaw, 0.98, false);
  });

  if (typeof createBumpyLowPolyHillMesh === 'function') {
    createBumpyLowPolyHillMesh(-44, -28, 18, 7.5, 18, '#7ca344', 5, true);
    createBumpyLowPolyHillMesh( 44, -28, 18, 7.5, 18, '#84a955', 6, true);
    createBumpyLowPolyHillMesh(  0, -78, 28, 9.5, 18, '#8c8275', 7, true);
  }

  [[-3.4, -20], [3.6, -28], [-3.0, -36], [3.2, -42], [-12.5, -24], [12.5, -34], [-14.0, -48], [14.0, -48]].forEach(([rx, rz], i) => {
    addLowPolyRock(rx, rz, 1.45, 0.75, i % 2 === 0 ? '#78716c' : '#94a3b8', true);
  });
  [[-19, -22], [19, -22], [-20, -36], [20, -36], [-18, -52], [18, -52]].forEach(([tx, tz], i) => {
    if (i % 2 === 0) addLowPolyCypressPineTree(tx, tz, 1.15, true);
    else addLowPolyOliveTree(tx, tz, 1.15, true);
  });

  [[-18, 22, -25, 1.2], [18, 24, -30, 1.3], [0, 26, -55, 1.4]].forEach(([cx, cy, cz, sc]) => {
    const cl = createLowPolyCloudGroup(sc, false);
    cl.position.set(cx, cy, cz);
    worldGroup.add(cl);
  });

  const clueSpecs = [
    { x: -5.5, z: 18, title: '😢 울고 있는 예루살렘 여인 (단서 1/2)', msg: '"로마 병사들이 예수님을 끌고 북쪽 성문 골목으로 지나갔어요! 어서 앞쪽 거리로 가보세요!"' },
    { x:  5.5, z:  4, title: '🗣️ 안타까워하는 시골 행인 (단서 2/2)', msg: '"저기 성문 앞 오르막길 입구에서 예수님이 무거운 십자가 때문에 쓰러지셨어요! 달려가 도와드리세요!"' }
  ];
  clueSpecs.forEach((cs, idx) => {
    const cy = getMiracleGroundHeight(cs.x, cs.z, 3);
    const grp = new THREE.Group();
    const npc = createLowPolyPersonMesh(idx === 0 ? 'woman' : 'villager', idx + 3);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.1, 1.55, 20),
      new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.08;
    grp.add(npc, ring);
    grp.position.set(cs.x, cy, cs.z);
    worldGroup.add(grp);

    const lbl = createWorldLabel(cs.title);
    lbl.style.opacity = '0';
    miracleStageObjects.push({
      kind: 'cross_clue',
      mesh: grp,
      pos: new THREE.Vector3(cs.x, cy + 0.5, cs.z),
      msg: cs.msg,
      done: false,
      label: lbl
    });
  });

  const jY = getMiracleGroundHeight(0, -10, 3);
  const jGrp = new THREE.Group();
  const jesusMesh = createLowPolyPersonMesh('jesus', 0);
  const crossMesh = new THREE.Group();
  const beam1 = createLowPolyMesh(new THREE.CylinderGeometry(0.14, 0.14, 3.6, 6), '#5c2d0c', 0, 1.2, -0.5);
  beam1.rotation.x = 0.65;
  const beam2 = createLowPolyMesh(new THREE.CylinderGeometry(0.12, 0.12, 2.2, 6), '#5c2d0c', 0, 1.6, -0.8);
  beam2.rotation.z = Math.PI / 2;
  crossMesh.add(beam1, beam2);

  const jRing = new THREE.Mesh(
    new THREE.RingGeometry(1.4, 2.0, 24),
    new THREE.MeshBasicMaterial({ color: 0xf43f5e, side: THREE.DoubleSide })
  );
  jRing.rotation.x = -Math.PI / 2;
  jRing.position.y = 0.08;
  jGrp.add(jesusMesh, crossMesh, jRing);
  jGrp.position.set(0, jY, -10);
  jGrp.visible = false;
  worldGroup.add(jGrp);

  miracleActiveMiniState.jesusMesh = jGrp;
  miracleActiveMiniState.crossProp = crossMesh;
  miracleActiveMiniState.jesusLabel = createWorldLabel('✝️ 지치신 예수님 대신 십자가 지고 가기!');
  miracleActiveMiniState.jesusLabel.style.opacity = '0';

  const gY = getMiracleGroundHeight(0, -50, 3);
  const gRing = new THREE.Mesh(
    new THREE.RingGeometry(2.2, 3.1, 28),
    new THREE.MeshBasicMaterial({ color: 0xfef08a, side: THREE.DoubleSide })
  );
  gRing.rotation.x = -Math.PI / 2;
  gRing.position.set(0, gY + 0.12, -50);
  gRing.visible = false;
  worldGroup.add(gRing);
  miracleActiveMiniState.goalRing = gRing;
  miracleActiveMiniState.goalLabel = createWorldLabel('⛰️ 골고다 언덕 정상 세 십자가 앞 목적지');
  miracleActiveMiniState.goalLabel.style.opacity = '0';

  playerPos.set(0, 0, 28);
  lastGroundedY = 0;
  playerVelY = 0;
  isGrounded = true;
  playerFacing = Math.PI;
  cameraYaw = 0;
  cameraTargetYaw = 0;
  snapCameraToPlayer();

  showToast('😢 [1단계] 예루살렘 거리에서 사람들의 단서(2곳)를 듣고 예수님이 십자가를 지고 가시는 곳을 찾으세요!');
}

function attachCrossToPlayerBack() {
  if (!carriedBlockGroup) return;
  while (carriedBlockGroup.children.length > 0) carriedBlockGroup.remove(carriedBlockGroup.children[0]);
  const crossGrp = new THREE.Group();
  const vBeam = createLowPolyMesh(new THREE.CylinderGeometry(0.12, 0.12, 3.2, 6), '#5c2d0c', 0, 0.6, -0.2, false);
  vBeam.rotation.x = 0.52;
  const hBeam = createLowPolyMesh(new THREE.CylinderGeometry(0.10, 0.10, 2.0, 6), '#5c2d0c', 0, 1.1, -0.45, false);
  hBeam.rotation.z = Math.PI / 2;
  crossGrp.add(vBeam, hBeam);
  carriedBlockGroup.add(crossGrp);
}

function updateMiracleMainStage3Frame(dt, now) {
  if (typeof updateMiracleDynamicSun === 'function') {
    updateMiracleDynamicSun(dt, now);
  }
  const st = miracleActiveMiniState;
  let nextGuidePos = null;

  if (st.phase === 'find_jesus') {
    miracleStageObjects.forEach(obj => {
      if (obj.kind !== 'cross_clue' || obj.done) return;
      const d = Math.hypot(playerPos.x - obj.pos.x, playerPos.z - obj.pos.z);
      updateWorldLabelPos(obj.label, obj.pos, d < MIRACLE_STAGE_TAG_DIST);
      if (!nextGuidePos) nextGuidePos = obj.pos;

      if (d < 2.5) {
        obj.done = true;
        obj.label.style.opacity = '0';
        st.cluesFound++;
        playSfx('switch');
        if (currentMode === 'timeattack') timeRemaining += 6.0;

        if (st.cluesFound >= st.reqClues) {
          if (st.jesusMesh) st.jesusMesh.visible = true;
          updateStageHUD();
          showToast('✝️ 앞쪽 골목 입구에서 예수님을 찾았어요! 예수님께 다가가 대신 십자가를 지고 올라가세요!');
        } else {
          updateStageHUD();
          showToast(obj.msg);
        }
      }
    });

    if (st.cluesFound >= st.reqClues && st.jesusMesh) {
      nextGuidePos = st.jesusMesh.position;
      const jd = Math.hypot(playerPos.x - st.jesusMesh.position.x, playerPos.z - st.jesusMesh.position.z);
      updateWorldLabelPos(st.jesusLabel, st.jesusMesh.position, jd < MIRACLE_STAGE_TAG_DIST);

      if (jd < 2.8) {
        st.phase = 'carry';
        if (st.crossProp) st.crossProp.visible = false;
        if (st.jesusLabel) st.jesusLabel.innerHTML = '✨ 함께 걸으시는 예수님';
        if (st.goalRing) st.goalRing.visible = true;
        attachCrossToPlayerBack();
        startStageBgm(3);
        playSfx('build');
        if (currentMode === 'timeattack') timeRemaining += 10.0;
        updateStageHUD();
        showToast('✝️ [2단계] 구레네 시몬처럼 예수님의 십자가를 대신 짊어졌어요! 세 십자가가 서 있는 넓은 골고다 언덕 정상까지 올라가세요!');
      }
    }
  } else if (st.phase === 'carry') {
    nextGuidePos = st.goalPos;

    if (st.jesusMesh) {
      const targetJX = playerPos.x + 1.4;
      const targetJZ = playerPos.z - 0.6;
      st.jesusMesh.position.x = THREE.MathUtils.lerp(st.jesusMesh.position.x, targetJX, dt * 5.0);
      st.jesusMesh.position.z = THREE.MathUtils.lerp(st.jesusMesh.position.z, targetJZ, dt * 5.0);
      st.jesusMesh.position.y = getMiracleGroundHeight(st.jesusMesh.position.x, st.jesusMesh.position.z, 3);
      st.jesusMesh.rotation.y = playerFacing;
      updateWorldLabelPos(st.jesusLabel, st.jesusMesh.position, true);
    }

    const gd = Math.hypot(playerPos.x - st.goalPos.x, playerPos.z - st.goalPos.z);
    if (st.goalLabel) updateWorldLabelPos(st.goalLabel, st.goalPos, gd < 14.0);

    if (gd < 3.6) {
      st.phase = 'golgotha_arrived';
      if (carriedBlockGroup) {
        while (carriedBlockGroup.children.length > 0) carriedBlockGroup.remove(carriedBlockGroup.children[0]);
      }
      if (st.goalLabel) st.goalLabel.style.opacity = '0';
      if (st.jesusLabel) st.jesusLabel.style.opacity = '0';
      miracleMainStagesCleared[3] = true;
      openStageClearModal(3);
      return;
    }
  }

  if (nextGuidePos && guideArrowGroup && guideArrowGroup.visible) {
    const baseFacing = (window.globalCameraViewMode === 'fps') ? (cameraYaw + Math.PI) : playerFacing;
    guideArrowGroup.rotation.y = Math.atan2(nextGuidePos.x - playerPos.x, nextGuidePos.z - playerPos.z) - baseFacing;
  }
}
// =========================================================================
// [ep4_miracle_stages.js - 파트 2/2] 메인 스테이지 4(빈 무덤 마을 미로) · 감람산 승천/재림 엔딩 및 플러그인 등록
// - 스테이지 4 서쪽 원경에 넓어진 골고다 언덕과 세 십자가 연동
// - 외곽 닫힌 다면체 언덕 내부 진입 차단 및 스테이지 종료 후 오픈월드 안전 복귀 연동
// =========================================================================

// -------------------------------------------------------------------------
// 5. [메인 스테이지 4] 빈 무덤 찾기 (오픈월드 남부 예루살렘 마을 ~ 동산 무덤 지형 연동)
// -------------------------------------------------------------------------
function buildMiracleMainStage4Tomb() {
  clearWorld();
  resetMiracleBoatRockingTransform();
  miracleSubMode = 'main4_tomb';
  miracleStageObjects = [];

  if (typeof setupMiracleDynamicSunAndShadows === 'function') {
    setupMiracleDynamicSunAndShadows();
  }

  scene.background = new THREE.Color(0x64748b);
  scene.fog = new THREE.Fog(0x94a3b8, 48, 185);

  const isKinder = (currentMode === 'kinder');
  const reqClues = isKinder ? 2 : 3;

  miracleActiveMiniState = {
    phase: 'maze_clues', // 'maze_clues' | 'go_tomb' | 'angel_met'
    cluesFound: 0,
    reqClues,
    gateBlockerMesh: null,
    gateCollider: null,
    angelMesh: null,
    tombPos: new THREE.Vector3(0, 0.5, -38),
    tombLabel: null
  };

  const halfW = 28, halfD = 48;
  currentMapRectBounds = { minX: -halfW + 1.5, maxX: halfW - 1.5, minZ: -halfD + 2.0, maxZ: halfD - 2.0 };

  // 1) 예루살렘 마을 바닥과 북쪽 동산 정원, 서쪽의 넓어진 골고다 언덕이 이어진 연속 지형
  const terrainGeo = new THREE.PlaneGeometry(150, 140, 44, 40);
  terrainGeo.rotateX(-Math.PI / 2);
  const tPos = terrainGeo.attributes.position;
  const tCols = [];
  const cVillage  = new THREE.Color('#dfc49a');
  const cGarden   = new THREE.Color('#82a84d');
  const cGolgotha = new THREE.Color('#8c8275');

  for (let i = 0; i < tPos.count; i++) {
    const vx = tPos.getX(i);
    const vz = tPos.getZ(i);
    let vy = 0;

    // 서쪽 외곽(vx < -30)에는 스테이지 3에서 올랐던 넓은 골고다 언덕이 솟아 있음
    const golDist = Math.hypot((vx - (-50)) / 28, (vz - (-10)) / 28);
    if (golDist < 1.0 && Math.abs(vx) > halfW + 1.0) {
      const clampedD = Math.max(0, (golDist - 0.25) / 0.75);
      const gt = 1.0 - Math.min(1.0, clampedD);
      vy = gt * gt * (3 - 2 * gt) * 9.0;
    }
    tPos.setY(i, vy);

    const col = (golDist < 0.95 && vx < -30)
      ? cGolgotha.clone()
      : (vz < -22 ? cGarden.clone() : cVillage.clone());
    tCols.push(col.r, col.g, col.b);
  }
  terrainGeo.setAttribute('color', new THREE.Float32BufferAttribute(tCols, 3));
  terrainGeo.computeVertexNormals();
  const terrainMesh = new THREE.Mesh(terrainGeo, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
  terrainMesh.receiveShadow = true;
  worldGroup.add(terrainMesh);

  // 서쪽 골고다 언덕 정상 고원 위의 세 십자가 원경 배치
  [[-50, -10, 1.32], [-55, -8.5, 1.00], [-45, -8.5, 1.00]].forEach(([cx, cz, sc]) => {
    const cy = 8.6;
    const vBeam = createLowPolyMesh(new THREE.CylinderGeometry(0.18 * sc, 0.22 * sc, 5.0 * sc, 6), '#5c2d0c', cx, cy + 2.5 * sc, cz);
    const hBeam = createLowPolyMesh(new THREE.CylinderGeometry(0.15 * sc, 0.15 * sc, 3.0 * sc, 6), '#5c2d0c', cx, cy + 3.6 * sc, cz);
    hBeam.rotation.z = Math.PI / 2;
    worldGroup.add(vBeam, hBeam);
  });

  // 주변 가장자리 닫힌 다면체 언덕 배치 (충돌 판정 활성화)
  if (typeof createBumpyLowPolyHillMesh === 'function') {
    createBumpyLowPolyHillMesh( 45, -25, 18, 7.0, 18, '#7ca344', 12, true);
    createBumpyLowPolyHillMesh( 46,  18, 18, 6.5, 18, '#84a955', 15, true);
    createBumpyLowPolyHillMesh(-22, -62, 22, 7.5, 16, '#7ca344', 18, true);
    createBumpyLowPolyHillMesh( 22, -62, 22, 7.5, 16, '#84a955', 21, true);
  }

  // 마을 외곽 양옆에 배치된 고대 유대 석조 가옥들 (인접 건물 점프가 가능한 간격 포함)
  [
    [-23,  34, 0,  Math.PI / 2],
    [-23,  26, 1,  Math.PI / 2],
    [ 23,  34, 1, -Math.PI / 2],
    [ 23,  26, 2, -Math.PI / 2],
    [-23,  10, 2,  Math.PI / 2],
    [ 23,  10, 3, -Math.PI / 2],
    [-23, -12, 1,  Math.PI / 2],
    [ 23, -12, 0, -Math.PI / 2]
  ].forEach(([hx, hz, v, yaw]) => {
    addJudeanRoadsideBuilding(hx, hz, v, yaw, 0.88, false);
  });

  // 소프트 로우 폴리곤 사암 담장 미로 생성 헬퍼
  const addGardenMazeWall = (x, z, w, d) => {
    const wallH = 3.8;
    const wMesh = createLowPolyMesh(new THREE.BoxGeometry(w, wallH, d), '#ead7b7', x, wallH * 0.5, z);
    const topCap = createLowPolyMesh(new THREE.BoxGeometry(w + 0.2, 0.35, d + 0.2), '#c89654', x, wallH + 0.18, z, false);
    worldGroup.add(wMesh, topCap);
    wallMeshes.push(wMesh, topCap);
    colliders.push({ minX: x - w * 0.5 - 0.35, maxX: x + w * 0.5 + 0.35, minZ: z - d * 0.5 - 0.35, maxZ: z + d * 0.5 + 0.35 });
  };

  addGardenMazeWall(-14,  24, 18, 1.6);
  addGardenMazeWall( 16,  24, 16, 1.6);
  addGardenMazeWall(  0,  10, 20, 1.6);
  addGardenMazeWall(-14,  -2, 14, 1.6);
  addGardenMazeWall( 14,  -2, 14, 1.6);
  addGardenMazeWall(-10, -14,  1.6, 16);
  addGardenMazeWall( 10, -14,  1.6, 16);
  addGardenMazeWall(-16, -24, 22, 1.6);
  addGardenMazeWall( 16, -24, 22, 1.6);

  // 단서 수집 전까지 동산 입구를 막고 있는 나무 성문
  const gateBlocker = createLowPolyMesh(new THREE.BoxGeometry(10.2, 3.8, 1.1), '#78350f', 0, 1.9, -24);
  worldGroup.add(gateBlocker);
  wallMeshes.push(gateBlocker);
  const gateCol = { minX: -5.2, maxX: 5.2, minZ: -25.0, maxZ: -23.0 };
  colliders.push(gateCol);
  miracleActiveMiniState.gateBlockerMesh = gateBlocker;
  miracleActiveMiniState.gateCollider = gateCol;

  // 2) 마을 미로 곳곳에서 무덤의 단서를 알려주는 NPC 3명 (무릎 높이 불규칙 빛의 원 적용)
  const clueNpcSpots = [
    { x: -15, z: 32, preset: 'woman',    title: '🏺 향품을 준비한 살로메',   msg: '"아리마대 요셉의 새 돌무덤은 북쪽 성문 너머 감람나무 동산 안에 있어요!"' },
    { x:  15, z: 14, preset: 'woman',    title: '🌿 새벽에 길을 나선 요안나', msg: '"무덤 입구를 막았던 커다란 돌이 이미 굴러가 버렸대요! 어서 북쪽 동산으로 가보세요!"' },
    { x:   0, z: -8, preset: 'disciple', title: '🏃 달려가는 요한과 베드로',  msg: '"동산 문이 열렸어요! 무덤 안에 세마포만 놓여 있고 빛나는 천사가 앉아 있어요!"' }
  ];
  for (let i = 0; i < reqClues; i++) {
    const cs = clueNpcSpots[i];
    const grp = new THREE.Group();
    const npc = createLowPolyPersonMesh(cs.preset, i + 4);
    const aura = (typeof createIrregularKneeLightAura === 'function')
      ? createIrregularKneeLightAura(0x38bdf8, i + 10)
      : new THREE.Mesh(new THREE.RingGeometry(1.1, 1.6, 20), new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide }));
    if (!aura.userData || !aura.userData.outerCrown) {
      aura.rotation.x = -Math.PI / 2;
      aura.position.y = 0.08;
    }
    grp.add(npc, aura);
    grp.position.set(cs.x, 0, cs.z);
    worldGroup.add(grp);

    const lbl = createWorldLabel(`${cs.title} (단서 ${i + 1}/${reqClues})`);
    lbl.style.opacity = '0';
    miracleStageObjects.push({
      kind: 'tomb_clue',
      mesh: grp,
      npcMesh: npc,
      kneeAura: aura,
      baseX: cs.x,
      baseZ: cs.z,
      pos: new THREE.Vector3(cs.x, 0.5, cs.z),
      msg: cs.msg,
      done: false,
      phase: i * 1.1,
      label: lbl
    });
  }

  // 3) 북쪽 끝 동산(z = -44)의 열린 다면체 바위 무덤과 굴러간 돌문, 빛나는 천사
  const tombHill = createLowPolyMesh(new THREE.DodecahedronGeometry(6.4, 0), '#94a3b8', 0, 3.2, -45.5);
  tombHill.scale.set(1.55, 0.92, 1.05);
  const openCave = createLowPolyMesh(new THREE.BoxGeometry(3.2, 3.6, 1.2), '#fef08a', 0, 1.8, -40.2, false);
  const rolledStone = createLowPolyMesh(new THREE.CylinderGeometry(2.1, 2.1, 0.82, 10), '#cbd5e1', 3.5, 2.0, -39.5);
  rolledStone.rotation.x = Math.PI / 2;

  const angelMesh = createLowPolyPersonMesh('angel', 0);
  angelMesh.position.set(-1.6, 0.1, -39.2);
  worldGroup.add(tombHill, openCave, rolledStone, angelMesh);
  wallMeshes.push(tombHill);

  const tombRing = new THREE.Mesh(
    new THREE.RingGeometry(1.8, 2.5, 24),
    new THREE.MeshBasicMaterial({ color: 0xfef08a, side: THREE.DoubleSide })
  );
  tombRing.rotation.x = -Math.PI / 2;
  tombRing.position.set(0, 0.15, -38.0);
  worldGroup.add(tombRing);

  miracleActiveMiniState.angelMesh = angelMesh;
  miracleActiveMiniState.tombPos.set(0, 0.5, -38.0);
  miracleActiveMiniState.tombLabel = createWorldLabel('🔒 동산의 빈 무덤 (단서를 모두 모으면 열려요!)');
  miracleActiveMiniState.tombLabel.style.opacity = '0';

  if (typeof addLowPolyCanopyTree === 'function') {
    addLowPolyCanopyTree(-18, -36, 1.2, true);
    addLowPolyCanopyTree( 18, -36, 1.2, true);
  }
  [[-14, -30], [14, -30], [-12, -42], [12, -42]].forEach(([tx, tz], i) => {
    if (i % 2 === 0) addLowPolyOliveTree(tx, tz, 1.2, true);
    else addLowPolyCypressPineTree(tx, tz, 1.2, true);
  });

  if (typeof addLowPolyWildflowerCluster === 'function') {
    [[-8, -32], [8, -32], [-6, -38], [6, -38]].forEach(([fx, fz]) => {
      addLowPolyWildflowerCluster(fx, fz, 1.0);
    });
  }

  [[-18, 24, -35, 1.2], [18, 26, -32, 1.3], [0, 28, 10, 1.25]].forEach(([cx, cy, cz, sc]) => {
    const cl = createLowPolyCloudGroup(sc, false);
    cl.position.set(cx, cy, cz);
    worldGroup.add(cl);
  });

  playerPos.set(0, 0, 40);
  lastGroundedY = 0;
  playerVelY = 0;
  isGrounded = true;
  playerFacing = Math.PI;
  cameraYaw = 0;
  cameraTargetYaw = 0;
  snapCameraToPlayer();

  showToast(`🌅 [1단계] 마을 미로에서 사람들에게 단서 ${reqClues}개를 찾아 예수님의 빈 무덤으로 나아가세요!`);
}

function updateMiracleMainStage4Frame(dt, now) {
  if (typeof updateMiracleDynamicSun === 'function') {
    updateMiracleDynamicSun(dt, now);
  }
  const st = miracleActiveMiniState;
  let nextGuidePos = null;

  if (st.phase === 'maze_clues') {
    miracleStageObjects.forEach((obj, idx) => {
      if (obj.kind !== 'tomb_clue' || obj.done) return;

      if (obj.kneeAura && typeof updateIrregularKneeLightAura === 'function') {
        updateIrregularKneeLightAura(obj.kneeAura, now, idx);
      }

      const swayX = Math.sin(now * 0.003 + obj.phase) * 1.4;
      const prevX = obj.mesh.position.x;
      obj.mesh.position.x = obj.baseX + swayX;
      obj.pos.x = obj.mesh.position.x;

      if (obj.npcMesh && obj.npcMesh.userData) {
        const u = obj.npcMesh.userData;
        const dirSign = (obj.mesh.position.x >= prevX) ? 1 : -1;
        obj.npcMesh.rotation.y = lerpAngle(obj.npcMesh.rotation.y, dirSign * (Math.PI * 0.5), dt * 6.0);
        const w = Math.cos(now * 0.012 + obj.phase) * 0.48;
        if (u.lLeg && u.rLeg) { u.lLeg.rotation.x = w; u.rLeg.rotation.x = -w; }
        if (u.lArm && u.rArm) { u.lArm.rotation.x = -w * 0.5; u.rArm.rotation.x = w * 0.5; }
      }

      const d = Math.hypot(playerPos.x - obj.pos.x, playerPos.z - obj.pos.z);
      updateWorldLabelPos(obj.label, obj.pos, d < MIRACLE_STAGE_TAG_DIST);
      if (!nextGuidePos) nextGuidePos = obj.pos;

      if (d < 2.5) {
        obj.done = true;
        obj.label.style.opacity = '0';
        st.cluesFound++;
        playSfx('rescue');
        if (currentMode === 'timeattack') timeRemaining += 6.0;

        if (st.cluesFound >= st.reqClues) {
          st.phase = 'go_tomb';
          if (st.gateBlockerMesh) st.gateBlockerMesh.visible = false;
          if (st.gateCollider) { st.gateCollider.minX = 9999; st.gateCollider.maxX = 9999; }
          if (st.tombLabel) st.tombLabel.innerHTML = '✨ 돌문이 굴러간 빈 무덤! (천사에게 가기)';
          scene.background = new THREE.Color(0x38bdf8);
          scene.fog = new THREE.Fog(0xbae6fd, 55, 200);
          updateStageHUD();
          showToast('🌅 단서를 모두 모아 북쪽 동산 문이 열렸어요! 빛나는 천사가 있는 빈 무덤 앞으로 달려가세요!');
        } else {
          updateStageHUD();
          showToast(obj.msg);
        }
      }
    });
  } else if (st.phase === 'go_tomb') {
    nextGuidePos = st.tombPos;
    const td = Math.hypot(playerPos.x - st.tombPos.x, playerPos.z - st.tombPos.z);
    if (st.tombLabel) updateWorldLabelPos(st.tombLabel, st.tombPos, td < 12.5);

    if (td < 3.2) {
      st.phase = 'angel_met';
      isTimeAttackActive = false;
      if (st.tombLabel) st.tombLabel.style.opacity = '0';
      miracleMainStagesCleared[4] = true;
      miracleIsPostResurrection = true;
      unlockMiracleNotebookEntry('mir_resurrect', true);
      openStageClearModal(4);
      return;
    }
  }

  if (nextGuidePos && guideArrowGroup && guideArrowGroup.visible) {
    const baseFacing = (window.globalCameraViewMode === 'fps') ? (cameraYaw + Math.PI) : playerFacing;
    guideArrowGroup.rotation.y = Math.atan2(nextGuidePos.x - playerPos.x, nextGuidePos.z - playerPos.z) - baseFacing;
  }
}

// -------------------------------------------------------------------------
// 6. [최종 엔딩] 감람산 승천 언덕 (오픈월드 남동쪽 외곽 감람산 `x = 88, z = 74` 지형 연동)
// -------------------------------------------------------------------------
let miracleAscensionState = {
  active: false,
  timer: 0,
  jesusCloudGroup: null,
  spotObj: null,
  modalShown: false
};

function startMiracleAscensionEnding() {
  buildEndingWorld();
}

function buildMiracleEndingWorld() {
  clearWorld();
  resetMiracleBoatRockingTransform();
  ensureMiracleCustomUI();
  hideAllMiracleCustomUI();
  miracleSubMode = 'ascension';
  targetObject = null;

  if (typeof setupMiracleDynamicSunAndShadows === 'function') {
    setupMiracleDynamicSunAndShadows();
  }

  scene.background = new THREE.Color(0x38bdf8);
  scene.fog = new THREE.Fog(0xe0f2fe, 75, 250);
  currentMapRectBounds = { minX: -28, maxX: 28, minZ: -28, maxZ: 28 };

  const mountGeo = new THREE.PlaneGeometry(160, 160, 44, 44);
  mountGeo.rotateX(-Math.PI / 2);
  const mPos = mountGeo.attributes.position;
  const mCols = [];
  const cTopGrass = new THREE.Color('#82a84d');
  const cMidGrass = new THREE.Color('#9ec164');
  const cValley   = new THREE.Color('#d8be7d');

  for (let i = 0; i < mPos.count; i++) {
    const vx = mPos.getX(i);
    const vz = mPos.getZ(i);
    let vy = getMiracleGroundHeight(vx, vz, 4);
    if (vx < -28) {
      vy = Math.max(-8.0, (vx + 28) * 0.18);
    }
    mPos.setY(i, vy);
    const col = vx < -32 ? cValley.clone() : (vy > 1.2 ? cTopGrass.clone() : cMidGrass.clone());
    mCols.push(col.r, col.g, col.b);
  }
  mountGeo.setAttribute('color', new THREE.Float32BufferAttribute(mCols, 3));
  mountGeo.computeVertexNormals();
  const mountMesh = new THREE.Mesh(mountGeo, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
  mountMesh.receiveShadow = true;
  worldGroup.add(mountMesh);

  const summitPadY = getMiracleGroundHeight(0, -8, 4);
  const summitPad = createLowPolyMesh(new THREE.CylinderGeometry(7.5, 8.5, 0.35, 16), '#f5e6c8', 0, summitPadY + 0.12, -8);
  worldGroup.add(summitPad);

  addJudeanRoadsideBuilding(-44, -12, 1,  Math.PI / 2, 0.95, false);
  addJudeanRoadsideBuilding(-46,   8, 0,  Math.PI / 2, 0.95, false);
  addJudeanRoadsideBuilding(-56,  -2, 2,  Math.PI / 2, 1.00, false);

  if (typeof createBumpyLowPolyHillMesh === 'function') {
    createBumpyLowPolyHillMesh( 46, -24, 20, 6.5, 18, '#7ca344', 31, true);
    createBumpyLowPolyHillMesh( 48,  16, 20, 6.8, 18, '#84a955', 32, true);
    createBumpyLowPolyHillMesh(  0, -52, 24, 7.2, 18, '#7ca344', 33, true);
  }

  if (typeof addLowPolyCanopyTree === 'function') {
    addLowPolyCanopyTree(-16, -12, 1.25, true);
    addLowPolyCanopyTree( 16, -12, 1.25, true);
  }

  [[-14, 8], [14, 8], [-18, -6], [18, -6], [-12, -18], [12, -18], [-22, 16], [22, 16]].forEach(([tx, tz], i) => {
    if (i % 3 === 0) addLowPolyCypressPineTree(tx, tz, 1.2, true);
    else addLowPolyOliveTree(tx, tz, 1.2 + (i % 2) * 0.15, true);
  });

  if (typeof addLowPolyWildflowerCluster === 'function') {
    [[-8, 4], [8, 4], [-10, -2], [10, -2], [-6, 12], [6, 12]].forEach(([fx, fz]) => {
      addLowPolyWildflowerCluster(fx, fz, 1.0);
    });
  }

  [[-18, 20, -22, 1.2], [18, 22, -20, 1.3], [-24, 18, 8, 1.15], [24, 19, 10, 1.2]].forEach(([cx, cy, cz, sc]) => {
    const cl = createLowPolyCloudGroup(sc, false);
    cl.position.set(cx, cy, cz);
    worldGroup.add(cl);
  });

  const jesusCloudGroup = new THREE.Group();
  const cloudBase = createLowPolyCloudGroup(0.75, false);
  cloudBase.position.set(0, 0.35, 0);
  const jesusMesh = createLowPolyPersonMesh('jesus', 0);
  jesusMesh.position.set(0, 0.95, 0);
  jesusCloudGroup.add(cloudBase, jesusMesh);
  jesusCloudGroup.position.set(0, summitPadY + 0.25, -8.5);
  worldGroup.add(jesusCloudGroup);

  const angelL = createLowPolyPersonMesh('angel', 1); angelL.position.set(-3.8, summitPadY + 0.3, -7.2);
  const angelR = createLowPolyPersonMesh('angel', 2); angelR.position.set( 3.8, summitPadY + 0.3, -7.2);
  worldGroup.add(angelL, angelR);

  for (let i = 0; i < 11; i++) {
    const ang = (i / 10) * Math.PI - Math.PI;
    const dx = Math.cos(ang) * 6.5;
    const dz = -6 + Math.sin(ang) * 4.5;
    if (Math.abs(dx) < 2.2 && dz > -4) continue;
    const dy = getMiracleGroundHeight(dx, dz, 4);
    const dMesh = createLowPolyPersonMesh('disciple', i);
    dMesh.position.set(dx, dy, dz);
    dMesh.lookAt(0, summitPadY + 3.0, -8.5);
    worldGroup.add(dMesh);
    endingCelebrationPeople.push({ mesh: dMesh, phase: i * 0.6 });
  }

  const ringY = getMiracleGroundHeight(0, -5.0, 4);
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(1.8, 2.5, 28),
    new THREE.MeshBasicMaterial({ color: 0xfef08a, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(0, ringY + 0.12, -5.0);
  worldGroup.add(ring);

  const ascLbl = createWorldLabel('👑 감람산 승천 언덕 (다가가서 예수님의 승천과 재림 약속 보기!)');
  ascLbl.style.opacity = '0';

  const spotObj = {
    type: 'mount_olives_ascension',
    pos: new THREE.Vector3(0, ringY + 0.8, -5.0),
    spotRing: ring,
    label: ascLbl,
    triggered: false
  };

  miracleAscensionState = {
    active: false,
    timer: 0,
    jesusCloudGroup,
    spotObj,
    modalShown: false
  };

  const startY = getMiracleGroundHeight(0, 9.0, 4);
  playerPos.set(0, startY, 9.0);
  lastGroundedY = startY;
  playerFacing = Math.PI;
  cameraYaw = 0;
  cameraTargetYaw = 0;
  rebuildPlayerAppearance();
  snapCameraToPlayer();

  setTimeout(() => {
    const certBtn = document.getElementById('cert-open-btn');
    if (certBtn) certBtn.classList.add('hidden');
  }, 0);
}

function triggerMiracleAscensionSequence() {
  if (miracleAscensionState.active) return;
  const sp = miracleAscensionState.spotObj;
  if (miracleAscensionState.modalShown) {
    if (typeof showEndingWorldMapChoiceModal === 'function') {
      showEndingWorldMapChoiceModal();
    } else if (typeof showEndingCertificate === 'function') {
      showEndingCertificate();
    }
    return;
  }

  miracleAscensionState.active = true;
  miracleAscensionState.timer = 0;
  if (sp && sp.label) sp.label.style.opacity = '0';
  if (sp && sp.spotRing) sp.spotRing.visible = false;
  unlockMiracleNotebookEntry('wd_matt2820', true);
  playSfx('clear');
  showToast('☁️ 예수님께서 제자들을 축복하시며 구름을 타고 하늘로 올라가십니다!');
}

function updateMiracleEndingFrame(dt, now) {
  if (typeof updateMiracleDynamicSun === 'function') {
    updateMiracleDynamicSun(dt, now);
  }
  const st = miracleAscensionState;
  const sp = st.spotObj;

  if (!st.active) {
    if (sp) {
      const td = Math.hypot(playerPos.x - sp.pos.x, playerPos.z - sp.pos.z);
      updateWorldLabelPos(sp.label, sp.pos, td < 12.0);
      if (guideArrowGroup && guideArrowGroup.visible) {
        const baseFacing = (window.globalCameraViewMode === 'fps') ? (cameraYaw + Math.PI) : playerFacing;
        guideArrowGroup.rotation.y = Math.atan2(sp.pos.x - playerPos.x, sp.pos.z - playerPos.z) - baseFacing;
      }
      if (td < 2.8 && !sp.triggered) {
        sp.triggered = true;
        triggerMiracleAscensionSequence();
      } else if (td > 4.5 && st.modalShown) {
        sp.triggered = false;
      }
    }
    return;
  }

  st.timer += dt;

  if (st.jesusCloudGroup && st.timer < 4.5) {
    st.jesusCloudGroup.position.y += dt * 3.2;
    camera.position.lerp(new THREE.Vector3(0, 6.2, 3.5), 0.08);
    camera.lookAt(0, Math.min(16, st.jesusCloudGroup.position.y + 1.5), -8.5);
  }

  if (st.timer >= 3.8 && !st.modalShown) {
    st.modalShown = true;
    const bf = document.getElementById('black-fade');
    if (bf) {
      document.getElementById('black-fade-icon').textContent = '☁️';
      document.getElementById('black-fade-title').textContent =
        '"너희 가운데서 하늘로 올려지신 이 예수는 하늘로 가심을 본 그대로 오시리라"';
      document.getElementById('black-fade-sub').textContent =
        '사도행전 1장 11절 · 아멘 주 예수여 오시옵소서 (요한계시록 22:20)';
      bf.style.opacity = '1';
      speakText('너희 가운데서 하늘로 올려지신 이 예수는 하늘로 가심을 본 그대로 오시리라');
    }

    setTimeout(() => {
      if (bf) bf.style.opacity = '0';
      st.active = false;
      setTimeout(() => {
        if (sp && sp.spotRing) sp.spotRing.visible = true;
        if (sp && sp.label) {
          sp.label.innerHTML = '👑 감람산 언약의 자리 (다가가면 월드맵 이동 창이 열려요!)';
        }
      }, 1500);
      if (typeof showEndingCertificate === 'function') {
        showEndingCertificate();
      }
    }, 5200);
  }
}

// -------------------------------------------------------------------------
// 7. 에피소드 4 플러그인 등록 (REGISTER_EPISODE)
// -------------------------------------------------------------------------
if (typeof EPISODE_MASTER_ADMIN_LOCK !== 'undefined') {
  EPISODE_MASTER_ADMIN_LOCK.miracle = false;
}

REGISTER_EPISODE('miracle', {
  locked: false,
  avatarIcon: '🕊️',
  scripture: MIRACLE_SCRIPTURE,
  certMeta: {
    badge: '🕊️ 에피소드 4 : 예수님의 기적과 부활·재림 언약 완주!',
    title: '갈릴리에서 감람산까지, 다시 오실 예수님을 기다려요!',
    verse: '"하늘로 올려지신 이 예수는 하늘로 가심을 본 그대로 오시리라" (사도행전 1:11)',
    mission: '갈릴리 바다·오병이어·십자가의 길·빈 무덤 부활 및 복음서 오픈월드 완주',
    prefix: 'JES-'
  },
  getBaseGroundHeight: function (x, z, st) {
    return window.getMiracleGroundHeight(x, z, st);
  },
  scheduleBgmBeat: function (ctx, step, st, mode, playing, timeRem, toFreq) {
    return scheduleMiracleBgmBeat(ctx, step, st, mode, playing, timeRem, toFreq);
  },
  createHeroMesh: function () {
    return createMiracleHeroMesh();
  },
  onCloseScreen: function () {
    hideAllMiracleCustomUI();
  },
  clearState: function () {
    hideAllMiracleCustomUI();
    clearMiracleFieldEventObjects();
    miracleStageSpots = [];
    miracleEventSpots = [];
    miracleRumorNpcs = [];
    miracleAmbientProps = [];
    miracleStageObjects = [];
    miracleStageCutscene.active = false;
    if (typeof miracleSunSystem !== 'undefined') {
      miracleSunSystem.sunVisualGroup = null;
    }
  },
  getInitialTime: function (st) {
    return st === 1 ? 42.0 : (st === 2 ? 48.0 : 45.0);
  },
  buildStage: function (st) {
    rebuildPlayerAppearance();
    if (st === 1) {
      buildMiracleOpenWorld(false);
    } else if (st === 2) {
      buildMiracleMainStage2Loaves();
    } else if (st === 3) {
      buildMiracleMainStage3Cross();
    }
  },
  buildEndingWorld: function () {
    buildMiracleEndingWorld();
  },
  endingToast: '☁️ 감람산 정상에서 제자들과 함께 예수님의 승천과 다시 오실 재림의 약속을 확인하세요!',
  updateHUD: function (st, badge, countIcon, countText, missionText) {
    updateMiracleNotebookHudBadge();
    if (miracleSubMode === 'openworld') {
      const clearedCnt = Object.values(miracleMainStagesCleared).filter(Boolean).length;
      const nextSt = (typeof getNextActiveMainStageNumber === 'function') ? getNextActiveMainStageNumber() : 1;
      badge.textContent = miracleIsPostResurrection ? '복음서 오픈월드 (부활 후)' : '복음서 오픈월드';
      countIcon.textContent = '📖';
      countText.textContent = `주요사건 ${clearedCnt}/4 · 수첩 ${miracleCollectedIds.size}/36`;
      missionText.textContent = miracleIsPostResurrection
        ? '부활하신 예수님의 증언(엠마오·도마·바닷가 아침식사)을 체험하고 빛기둥이 비추는 감람산 정상으로 오르세요!'
        : `빛기둥이 비추는 [메인 스테이지 ${nextSt}]을(를) 순서대로 진행하고, 반짝이는 빛의 원이 있는 비유·사건을 체험하세요!`;
    } else if (miracleSubMode === 'main1_galilee') {
      const ms = miracleActiveMiniState;
      badge.textContent = '갈릴리 바다 · 스테이지 1';
      countIcon.textContent = ms.phase === 'catch_fish' ? '🐟' : '🪣';
      countText.textContent = ms.phase === 'catch_fish'
        ? `물고기 ${ms.fishCaught}/${ms.reqFish}`
        : (ms.phase === 'storm' ? `물 퍼내기 ${ms.bailsDone}/${ms.reqBails}` : '예수님께로!');
      missionText.textContent = ms.phase === 'catch_fish'
        ? '배 가장자리 물고기 떼 포인트로 다가가 그물을 끌어올리세요!'
        : (ms.phase === 'storm'
          ? '폭풍우로 배가 흔들려요! 차오른 바닷물 웅덩이를 바가지로 모두 퍼내세요!'
          : '배 뒤편(고물)에 계신 예수님께 다가가 풍랑을 잠재워 달라고 도움을 구하세요!');
    } else if (miracleSubMode === 'main2_loaves') {
      const ms = miracleActiveMiniState;
      badge.textContent = '오병이어 · 스테이지 2';
      countIcon.textContent = '🍞';
      countText.textContent = ms.phase === 'gather_baskets'
        ? `광주리 ${ms.basketsGathered}/${ms.reqBaskets}`
        : (ms.phase === 'climb_hill' ? `이웃 도움 ${ms.helpedCount}/${ms.reqHelp}` : '도시락 전달');
      missionText.textContent = ms.phase === 'climb_hill'
        ? '마을이 내려다보이는 언덕길에서 도움이 필요한 이웃 2명을 도우며 정상으로 올라가세요!'
        : (ms.phase === 'find_boy'
          ? '무리 오른쪽에서 보리떡 5개와 물고기 2마리 도시락을 가진 어린아이를 찾으세요!'
          : (ms.phase === 'bring_to_jesus'
            ? '어린아이의 오병이어 도시락을 언덕 위 예수님께 가져다드리세요!'
            : `모두가 배불리 먹었습니다! 언덕 곳곳에 남은 조각 ${ms.reqBaskets}광주리를 모두 거두세요!`));
    } else if (miracleSubMode === 'main3_cross') {
      const ms = miracleActiveMiniState;
      badge.textContent = '십자가의 길 · 스테이지 3';
      countIcon.textContent = '✝️';
      countText.textContent = ms.phase === 'find_jesus' ? `단서 ${ms.cluesFound}/${ms.reqClues}` : '골고다 등반';
      missionText.textContent = ms.phase === 'find_jesus'
        ? '예루살렘 거리에서 사람들의 단서를 듣고 예수님이 십자가를 지고 가시는 곳을 찾으세요!'
        : '지치신 예수님을 대신해 십자가를 메고 세 십자가가 서 있는 넓은 골고다 언덕 정상까지 올라가세요!';
    } else if (miracleSubMode === 'main4_tomb') {
      const ms = miracleActiveMiniState;
      badge.textContent = '빈 무덤 · 스테이지 4';
      countIcon.textContent = '🌅';
      countText.textContent = ms.phase === 'maze_clues' ? `단서 ${ms.cluesFound}/${ms.reqClues}` : '빈 무덤 발견';
      missionText.textContent = ms.phase === 'maze_clues'
        ? `새벽 마을 미로에서 사람들에게 단서 ${ms.reqClues}개를 찾아 동산 무덤 문을 여세요!`
        : '굴러간 돌문 앞 빛나는 천사에게 다가가 예수님의 부활 소식을 들으세요!';
    } else {
      badge.textContent = '감람산 승천 언덕';
      countIcon.textContent = '☁️';
      countText.textContent = '재림의 약속';
      missionText.textContent = '감람산 정상으로 나아가 예수님의 승천과 다시 오실 재림의 약속을 확인하세요!';
    }
  },
  proceedNextStage: function (st) {
    isPlaying = true;
    isTimeAttackActive = false;
    document.getElementById('hud-timer-box').classList.add('hidden');
    // 스테이지 클리어 후 오픈월드 안전 위치로 복귀하며, 스팟 재진입 잠금(_requireLeaveZone)으로 시작 창이 다시 뜨지 않음
    buildMiracleOpenWorld(true);
    if (typeof syncMiracleMainStageSequentialBeams === 'function') {
      syncMiracleMainStageSequentialBeams();
    }
    startStageBgm(st);
  },
  updateStageFrame: function (dt, now, st) {
    if (miracleSubMode === 'openworld') updateMiracleOpenWorldFrame(dt, now);
    else if (miracleSubMode === 'main1_galilee') updateMiracleMainStage1Frame(dt, now);
    else if (miracleSubMode === 'main2_loaves') updateMiracleMainStage2Frame(dt, now);
    else if (miracleSubMode === 'main3_cross') updateMiracleMainStage3Frame(dt, now);
    else if (miracleSubMode === 'main4_tomb') updateMiracleMainStage4Frame(dt, now);
    else if (miracleSubMode === 'ascension' || st === 4) updateMiracleEndingFrame(dt, now);
  }
});
