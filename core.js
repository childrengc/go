// =========================================================================
// [core.js] 출발! 탐험대! - 공통 3D 엔진, 사운드, 컨트롤러, 캐릭터·동물·기둥 팩토리
// =========================================================================

let audioCtx = null, bgmTimeout = null, bgmEnabled = true, bgmStep = 0;
let currentEpisode = 'noah'; // 'noah' | 'exodus'
const EPISODE_SCRIPTURE = {};
let hasSpokenInitialMission = false;

function getAudioCtx() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) audioCtx = new AC();
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playSfx(type) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const notes = {
    step: [[220, 0.04, 'triangle', 0.04]],
    jump: [[300, 0.07, 'sine', 0.12], [480, 0.1, 'sine', 0.12]],
    count: [[440, 0.12, 'triangle', 0.18]],
    go: [[587, 0.1, 'triangle', 0.2], [880, 0.25, 'triangle', 0.24]],
    build: [[196, 0.06, 'square', 0.12], [293, 0.07, 'triangle', 0.15], [440, 0.12, 'triangle', 0.18]],
    hammer: [
      [180, 0.06, 'square', 0.22], [110, 0.05, 'sawtooth', 0.18],
      [190, 0.06, 'square', 0.22], [115, 0.05, 'sawtooth', 0.18],
      [205, 0.07, 'square', 0.24], [120, 0.06, 'sawtooth', 0.20]
    ],
    boost: [[523, 0.05, 'sine', 0.18], [784, 0.06, 'triangle', 0.2], [1046, 0.12, 'sine', 0.22]],
    clock: [[880, 0.06, 'sine', 0.18], [1174, 0.08, 'sine', 0.2], [1318, 0.14, 'triangle', 0.22]],
    switch: [[440, 0.08, 'sine', 0.15], [659, 0.09, 'sine', 0.16], [880, 0.18, 'triangle', 0.2]],
    rescue: [[523, 0.08, 'triangle', 0.16], [659, 0.08, 'triangle', 0.16], [784, 0.12, 'triangle', 0.16], [1046, 0.22, 'triangle', 0.18]],
    dove: [[587, 0.1, 'sine', 0.15], [740, 0.1, 'sine', 0.15], [880, 0.12, 'sine', 0.15], [1174, 0.28, 'sine', 0.18]],
    clear: [[523, 0.1, 'triangle', 0.18], [659, 0.1, 'triangle', 0.18], [784, 0.1, 'triangle', 0.18], [1046, 0.35, 'triangle', 0.2]],
    thunder: [[110, 0.14, 'sawtooth', 0.05], [75, 0.22, 'triangle', 0.04], [55, 0.28, 'sine', 0.03]],
    crumble: [[260, 0.06, 'sawtooth', 0.12], [190, 0.08, 'sawtooth', 0.12], [130, 0.12, 'square', 0.14]],
    hit: [[160, 0.14, 'sawtooth', 0.22], [115, 0.24, 'square', 0.2]],
    wrong: [[240, 0.14, 'sawtooth', 0.12], [180, 0.2, 'sawtooth', 0.12]]
  }[type] || [[440, 0.08, 'sine', 0.1]];

  let t = now;
  notes.forEach(([freq, dur, wave, vol]) => {
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = wave; osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(t); osc.stop(t + dur);
    t += dur * 0.85;
  });
}

function playRainOrSeaSound(duration = 5.6, isSeaParting = false) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const sampleRate = ctx.sampleRate;
  const frameCount = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(1, frameCount, sampleRate);
  const data = buffer.getChannelData(0);

  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < frameCount; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.997 * b0 + white * 0.029;
    b1 = 0.985 * b1 + white * 0.032;
    b2 = 0.950 * b2 + white * 0.048;
    const surge = isSeaParting ? Math.sin((i / sampleRate) * 2.2) * 0.25 : 0;
    const droplet = (Math.random() > 0.985) ? (Math.random() * 0.65) : 0;
    data[i] = (b0 + b1 + b2 + white * 0.18 + droplet + surge);
  }

  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = buffer;
  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.setValueAtTime(isSeaParting ? 520 : 1050, now);
  if (isSeaParting) {
    bandpass.frequency.exponentialRampToValueAtTime(1400, now + duration * 0.5);
    bandpass.frequency.exponentialRampToValueAtTime(380, now + duration);
  }
  bandpass.Q.setValueAtTime(0.65, now);

  const lowpass = ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.setValueAtTime(isSeaParting ? 1800 : 2600, now);

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0.001, now);
  gainNode.gain.linearRampToValueAtTime(0.34, now + 0.45);
  gainNode.gain.setValueAtTime(0.34, now + Math.max(0.6, duration - 0.65));
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

  noiseSource.connect(bandpass);
  bandpass.connect(lowpass);
  lowpass.connect(gainNode);
  gainNode.connect(ctx.destination);
  noiseSource.start(now);
  noiseSource.stop(now + duration);
}

const NOAH_THEME_INTERVALS = [0, 2, 4, 7, 9, 7, 4, 2, 0, 4, 7, 12, 9, 7, 4, 0];
const NOAH_BASS_INTERVALS  = [-12, -12, -5, -5, -3, -3, -5, -5, -12, -12, -7, -7, -3, -5, -7, -12];

const EXODUS_EPIC_MELODY   = [0, 0, 7, 7, 8, 7, 5, 3, 5, 5, 12, 12, 10, 8, 7, 7];
const EXODUS_EPIC_HARMONY  = [7, 7, 12, 12, 12, 12, 8, 7, 8, 8, 15, 15, 14, 12, 11, 12];
const EXODUS_EPIC_BASS     = [-12, -12, -12, -5, -4, -4, -5, -7, -7, -7, -12, -12, -2, -4, -5, -12];
const EXODUS_RHYTHM_MULT   = [1.3, 0.7, 1.3, 0.7, 1.0, 1.0, 1.0, 1.0, 1.3, 0.7, 1.3, 0.7, 1.0, 1.0, 1.5, 0.5];

const STAGE_BGM_STYLE = {
  1: { rootMidi: 60, wave: 'triangle', subWave: 'sine',     baseMs: 420, vol: 0.042, minorMode: false, shimmer: false },
  2: { rootMidi: 57, wave: 'sine',     subWave: 'triangle', baseMs: 450, vol: 0.045, minorMode: true,  shimmer: false },
  3: { rootMidi: 62, wave: 'triangle', subWave: 'triangle', baseMs: 360, vol: 0.045, minorMode: false, shimmer: true },
  4: { rootMidi: 65, wave: 'sine',     subWave: 'sine',     baseMs: 430, vol: 0.048, minorMode: false, shimmer: true }
};

const EXODUS_BGM_STYLE = {
  1: { rootMidi: 53, wave: 'sawtooth', subWave: 'triangle', baseMs: 360, vol: 0.038 },
  2: { rootMidi: 55, wave: 'sawtooth', subWave: 'square',   baseMs: 220, vol: 0.042 },
  3: { rootMidi: 52, wave: 'sawtooth', subWave: 'triangle', baseMs: 300, vol: 0.040 },
  4: { rootMidi: 60, wave: 'triangle', subWave: 'sine',     baseMs: 380, vol: 0.046 }
};

function midiToFreq(m) { return 440 * Math.pow(2, (m - 69) / 12); }

function scheduleNextBgmBeat() {
  if (!bgmEnabled) return;
  const ctx = getAudioCtx();

  if (currentEpisode === 'exodus') {
    const style = EXODUS_BGM_STYLE[currentStage] || EXODUS_BGM_STYLE[1];
    const idx = bgmStep % EXODUS_EPIC_MELODY.length;
    const rhythmFactor = EXODUS_RHYTHM_MULT[idx] || 1.0;
    let stepMs = Math.round(style.baseMs * rhythmFactor);

    if (currentMode === 'timeattack' && isPlaying && currentStage <= 3) {
      stepMs = (timeRemaining < 4.0) ? Math.round(stepMs * 0.48) : Math.round(stepMs * 0.68);
    }

    if (ctx) {
      const now = ctx.currentTime;
      const dur = (stepMs / 1000) * 1.15;
      const leadFreq = midiToFreq(style.rootMidi + EXODUS_EPIC_MELODY[idx]);
      const harmFreq = midiToFreq(style.rootMidi + EXODUS_EPIC_HARMONY[idx]);
      const bassFreq = midiToFreq(style.rootMidi + EXODUS_EPIC_BASS[idx]);

      const osc1 = ctx.createOscillator(), g1 = ctx.createGain();
      osc1.type = style.wave;
      osc1.frequency.setValueAtTime(leadFreq, now);
      g1.gain.setValueAtTime(0.001, now);
      g1.gain.linearRampToValueAtTime(style.vol, now + 0.04);
      g1.gain.exponentialRampToValueAtTime(0.001, now + dur);
      osc1.connect(g1); g1.connect(ctx.destination);
      osc1.start(now); osc1.stop(now + dur + 0.02);

      const osc2 = ctx.createOscillator(), g2 = ctx.createGain();
      osc2.type = style.subWave;
      osc2.frequency.setValueAtTime(harmFreq, now);
      g2.gain.setValueAtTime(0.001, now);
      g2.gain.linearRampToValueAtTime(style.vol * 0.6, now + 0.05);
      g2.gain.exponentialRampToValueAtTime(0.001, now + dur);
      osc2.connect(g2); g2.connect(ctx.destination);
      osc2.start(now); osc2.stop(now + dur + 0.02);

      const osc3 = ctx.createOscillator(), g3 = ctx.createGain();
      osc3.type = 'triangle';
      osc3.frequency.setValueAtTime(bassFreq, now);
      g3.gain.setValueAtTime(0.001, now);
      g3.gain.linearRampToValueAtTime(style.vol * 0.85, now + 0.02);
      g3.gain.exponentialRampToValueAtTime(0.001, now + dur * 0.9);
      osc3.connect(g3); g3.connect(ctx.destination);
      osc3.start(now); osc3.stop(now + dur);

      bgmStep++;
    }
    bgmTimeout = setTimeout(scheduleNextBgmBeat, stepMs);
    return;
  }

  const style = STAGE_BGM_STYLE[currentStage] || STAGE_BGM_STYLE[1];
  let stepMs = style.baseMs;
  if (currentMode === 'timeattack' && isPlaying && currentStage <= 3) {
    stepMs = (timeRemaining < 4.0) ? Math.round(stepMs * 0.45) : Math.round(stepMs * 0.62);
  }

  if (ctx) {
    const idx = bgmStep % NOAH_THEME_INTERVALS.length;
    let semi = NOAH_THEME_INTERVALS[idx];
    if (style.minorMode && (semi === 4 || semi === 9)) semi -= 1;

    const leadFreq = midiToFreq(style.rootMidi + semi);
    const bassFreq = midiToFreq(style.rootMidi + NOAH_BASS_INTERVALS[idx]);
    const now = ctx.currentTime;
    const dur = (stepMs / 1000) * 1.32;

    const osc1 = ctx.createOscillator(), g1 = ctx.createGain();
    osc1.type = style.wave;
    osc1.frequency.setValueAtTime(leadFreq, now);
    g1.gain.setValueAtTime(0.001, now);
    g1.gain.linearRampToValueAtTime(style.vol, now + 0.03);
    g1.gain.exponentialRampToValueAtTime(0.0008, now + dur);
    osc1.connect(g1); g1.connect(ctx.destination);
    osc1.start(now); osc1.stop(now + dur + 0.02);

    if (idx % 2 === 0 || currentMode === 'timeattack') {
      const osc2 = ctx.createOscillator(), g2 = ctx.createGain();
      osc2.type = style.subWave;
      osc2.frequency.setValueAtTime(style.shimmer ? leadFreq * 1.5 : bassFreq, now);
      g2.gain.setValueAtTime(0.001, now);
      g2.gain.linearRampToValueAtTime(style.vol * 0.52, now + 0.04);
      g2.gain.exponentialRampToValueAtTime(0.0008, now + dur);
      osc2.connect(g2); g2.connect(ctx.destination);
      osc2.start(now); osc2.stop(now + dur + 0.02);
    }
    bgmStep++;
  }
  bgmTimeout = setTimeout(scheduleNextBgmBeat, stepMs);
}

function startStageBgm(st) {
  stopStageBgm();
  if (!bgmEnabled) return;
  bgmStep = 0;
  scheduleNextBgmBeat();
}

function stopStageBgm() {
  if (bgmTimeout) { clearTimeout(bgmTimeout); bgmTimeout = null; }
}

function toggleBgm() {
  bgmEnabled = !bgmEnabled;
  document.getElementById('bgm-btn').textContent = bgmEnabled ? '🎵' : '🔇';
  if (bgmEnabled) startStageBgm(currentStage); else stopStageBgm();
}

// [공통 요청사항] 목소리 안내 볼륨을 더 줄임 (volume = 0.25, 멜로디 백업 볼륨 = 0.012)
let melodyTimer = null;
function speakText(text) {
  if (melodyTimer) { clearInterval(melodyTimer); melodyTimer = null; }
  let ttsWorked = false;
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'ko-KR'; u.rate = 0.95; u.pitch = 1.08;
      u.volume = 0.25;
      window.speechSynthesis.speak(u);
      ttsWorked = true;
    } catch (e) { ttsWorked = false; }
  }
  if (!ttsWorked) {
    let idx = 0;
    const scale = [440, 493.8, 523.2, 587.3, 659.2, 784];
    melodyTimer = setInterval(() => {
      if (idx >= Math.min(text.length, 16)) { clearInterval(melodyTimer); return; }
      const ctx = getAudioCtx();
      if (ctx) {
        const osc = ctx.createOscillator(), g = ctx.createGain();
        osc.type = 'sine'; osc.frequency.setValueAtTime(scale[idx % scale.length], ctx.currentTime);
        g.gain.setValueAtTime(0.012, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0005, ctx.currentTime + 0.06);
        osc.connect(g); g.connect(ctx.destination);
        osc.start(); osc.stop(ctx.currentTime + 0.06);
      }
      idx++;
    }, 90);
  }
}

function speakCurrentMission() {
  speakText(document.getElementById('hud-mission-text').textContent);
}

function showToast(msg) {
  const box = document.getElementById('toast-box');
  document.getElementById('toast-text').textContent = msg;
  box.style.opacity = '1';
  clearTimeout(box._t);
  box._t = setTimeout(() => { box.style.opacity = '0'; }, 2300);
}

function triggerDamageFlash() {
  const df = document.getElementById('damage-flash');
  if (!df) return;
  df.style.opacity = '0.85';
  clearTimeout(df._t);
  df._t = setTimeout(() => { df.style.opacity = '0'; }, 360);
}

// =========================================================================
// 2. 화면 제어 및 에피소드 런처
// =========================================================================
let explorerName = '';
let currentMode = 'junior';
const MODE_META = {
  kinder: { badge: '🐣 유치반', dept: '🐣 유치반(미취학)', quizCount: 0 },
  junior: { badge: '🌱 유년반', dept: '🌱 유년반(초등 1-3학년)', quizCount: 1 },
  senior: { badge: '🍎 소년반', dept: '🍎 소년반(초등 4-6학년)', quizCount: 2 },
  timeattack: { badge: '⚡ 타임어택', dept: '⚡ 타임어택(스피드 도전)', quizCount: 1 }
};

function openScreen(screenId) {
  ['screen-opening', 'screen-class', 'screen-map'].forEach(id => {
    const el = document.getElementById(id);
    if (id === screenId) { el.classList.remove('hidden'); el.classList.add('flex'); }
    else { el.classList.add('hidden'); el.classList.remove('flex'); }
  });
  if (screenId) {
    isTimeAttackActive = false;
    isPlaying = false;
    stage2CountdownActive = false;
    if (stage2CountdownTimer) { clearInterval(stage2CountdownTimer); stage2CountdownTimer = null; }
    const cdOverlay = document.getElementById('stage2-countdown-overlay');
    if (cdOverlay) cdOverlay.style.display = 'none';
    doveCutscene.active = false;
    pillarCutscene.active = false;
    seaPartingCutscene.active = false;
    sinaiCutscene.active = false;
    document.getElementById('hud-top').classList.add('hidden');
    document.getElementById('joystick-zone').style.display = 'none';
    document.getElementById('cam-bottom-bar').style.display = 'none';
    document.getElementById('action-zone').style.display = 'none';
    document.getElementById('ending-modal').classList.add('hidden');
    document.getElementById('ending-modal').classList.remove('flex');
    document.getElementById('retry-modal').classList.add('hidden');
    document.getElementById('retry-modal').classList.remove('flex');
  }
}

function goToClassSelect() {
  const val = document.getElementById('opening-name-input').value.trim();
  explorerName = val || '믿음의용사';
  document.getElementById('class-hello-name').textContent = `🙌 ${explorerName} 대원님, 환영해요!`;
  playSfx('rescue');
  openScreen('screen-class');
}

function selectClassAndShowMap(mode) {
  currentMode = mode;
  document.getElementById('map-selected-badge').textContent = `${MODE_META[mode].badge} · ${explorerName}`;
  playSfx('jump');
  openScreen('screen-map');
}

function launchEpisode(ep) {
  currentEpisode = ep;
  openScreen(null);
  startVoxelGame(currentMode);
}

// =========================================================================
// 3. 전역 3D 상태 변수 & 텍스처·모델링 팩토리
// =========================================================================
const EXODUS_STAGE1_MAX_CARRY = 2;
const EXODUS_STAGE1_BRIDGE_BLOCKS = 6;

let scene, camera, renderer, worldGroup, playerGroup, guideArrowGroup, carriedBlockGroup;
let playerLimbs = {};
let currentStage = 1;
let isPlaying = false;
let playerPos = new THREE.Vector3(0, 0, 14);
let playerVelY = 0, isGrounded = true, playerFacing = 0, walkCycle = 0;
let currentMoveSpeed = 0;
let playerSpeedBoostTimer = 0;

let currentMapBounds = null;
let currentMapRectBounds = null;
let exodusStage1SlopeMeta = null;
let exodusStage2SlopeMeta = null;
let cameraYaw = 0, cameraTargetYaw = 0;
let mazeRunCount = 0;

let colliders = [], platforms = [], wallMeshes = [], fadedMaterials = [], torchFlames = [];
let stageAnimals = [], arkFriends = [], followingAnimals = [], endingAnimalPairs = [];
let exodusFollowers = [], mosesTrailHistory = [], exodusSeagulls = [];
let endingCelebrationPeople = [];
let targetObject = null, endingDovePivot = null;
let rescuedPairs = 0;
let timeRemaining = 10.0, isTimeAttackActive = false;
let timeAttackFirstRechargeUsed = false;
let certAutoShown = false;

let heldBlocks = 0;
let collectibleBlocks = [];
let buildZones = [];
let pillarSwitches = [];
let activeBuildTarget = null;
let stage3StairMeshes = [];
let hammerAnimTimer = 0;
let hammerTargetPos = null;

// 스테이지 2 추격전 & 진주 아이템 & 불기둥/구름기둥 상태 변수
let stage2CountdownActive = false;
let stage2CountdownTimer = null;
let egyptianSoldiers = [];
let soldierHitCount = 0;
let soldierDamageCooldown = 0;
let stage2Puddles = [];
let stage2JumpObstacles = [];
let stage2Pearls = [];
let seaWallFishes = [];
let flowingWaterTextures = [];
let blazingPillars = [];

// 스테이지 3 시내산 등반 & 시계 아이템 상태 변수
let sinaiCrumbles = [];
let sinaiMagmaBlocks = [];
let sinaiHazardZones = [];
let sinaiCloudLayers = [];
let sinaiStormTopClouds = [];
let sinaiWaitingPeople = [];
let sinaiSafeCheckpoints = [];
let sinaiClocks = [];
let summitSparkles = [];
let sinaiLastCheckpoint = new THREE.Vector3(0, 0, 29);

let doveCutscene = { active: false, timer: 0, phase: 0, doveX: 0, goalZ: 0, winZ: 0 };
let pillarCutscene = {
  active: false, timer: 0, phase: 0, pillarGroup: null, goalZ: 0,
  leftClosingWall: null, rightClosingWall: null
};
let seaPartingCutscene = {
  active: false, timer: 0, phase: 0, shoreY: 0, shoreZ: 0,
  leftSeaGroup: null, rightSeaGroup: null, leftWaterWall: null, rightWaterWall: null
};
let sinaiCutscene = {
  active: false, timer: 0, phase: 0,
  beamMesh: null, innerBeamMesh: null, tabletsMesh: null,
  summitY: 19.2, summitZ: -36.5
};

const texCache = {};
function makePixelTex(baseHex, noiseHex, size = 8) {
  const key = 'px_' + baseHex + '_' + noiseHex;
  if (texCache[key]) return texCache[key];
  const c = document.createElement('canvas'); c.width = size; c.height = size;
  const ctx = c.getContext('2d');
  ctx.fillStyle = baseHex; ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = noiseHex;
  for (let i = 0; i < (size * size) / 3; i++) {
    ctx.fillRect((i * 7) % size, (i * 13) % size, 1, 1);
  }
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
  texCache[key] = t;
  return t;
}

function makeLogBarkTex() {
  const key = 'log_bark_tex_pure';
  if (texCache[key]) return texCache[key];
  const c = document.createElement('canvas'); c.width = 16; c.height = 16;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#78350f'; ctx.fillRect(0, 0, 16, 16);
  const barkCols = ['#451a03', '#92400e', '#5c2d0c'];
  for (let x = 0; x < 16; x += 2) {
    ctx.fillStyle = barkCols[(x / 2) % barkCols.length];
    ctx.fillRect(x, 0, 1, 16);
    ctx.fillRect(x + 1, (x * 3) % 12, 1, 4);
  }
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
  texCache[key] = t;
  return t;
}

function makeLogTopTex() {
  const key = 'log_top_rings_tex_pure';
  if (texCache[key]) return texCache[key];
  const c = document.createElement('canvas'); c.width = 16; c.height = 16;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#5c2d0c'; ctx.fillRect(0, 0, 16, 16);
  ctx.fillStyle = '#d9a05b'; ctx.fillRect(1, 1, 14, 14);
  ctx.fillStyle = '#b45309'; ctx.fillRect(3, 3, 10, 10);
  ctx.fillStyle = '#e5c494'; ctx.fillRect(5, 5, 6, 6);
  ctx.fillStyle = '#78350f'; ctx.fillRect(7, 7, 2, 2);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
  texCache[key] = t;
  return t;
}

function createLogBlockMesh(w = 1.15, h = 0.72, d = 0.85) {
  const barkMat = new THREE.MeshLambertMaterial({ map: makeLogBarkTex() });
  const ringMat = new THREE.MeshLambertMaterial({ map: makeLogTopTex() });
  const materials = [ringMat, ringMat, barkMat, barkMat, barkMat, barkMat];
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), materials);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function createFluffyCloudGroup(scale = 1.0, isSemiTransparent = false) {
  const grp = new THREE.Group();
  const matMain = isSemiTransparent
    ? new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.82 })
    : matVoxel('#ffffff', '#f8fafc');
  const matSub = isSemiTransparent
    ? new THREE.MeshBasicMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.72 })
    : matVoxel('#f1f5f9', '#e2e8f0');

  grp.add(
    createBox(10.0 * scale, 1.4 * scale, 5.2 * scale, matMain, 0, 0, 0, false),
    createBox(7.2 * scale, 1.3 * scale, 4.0 * scale, matMain, -0.8 * scale, 1.1 * scale, 0.3 * scale, false),
    createBox(5.5 * scale, 1.2 * scale, 3.6 * scale, matSub, 1.8 * scale, 0.9 * scale, -0.4 * scale, false),
    createBox(4.2 * scale, 1.0 * scale, 3.0 * scale, matMain, 0.2 * scale, 1.8 * scale, 0, false),
    createBox(6.8 * scale, 1.0 * scale, 3.4 * scale, matSub, -2.4 * scale, 0.4 * scale, 0.8 * scale, false),
    createBox(6.4 * scale, 1.0 * scale, 3.4 * scale, matSub, 2.6 * scale, 0.3 * scale, 0.6 * scale, false)
  );
  return grp;
}

function makeZebraStripeTex() {
  const key = 'zebra_vertical_only';
  if (texCache[key]) return texCache[key];
  const c = document.createElement('canvas'); c.width = 16; c.height = 16;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, 16, 16);
  ctx.fillStyle = '#0f172a';
  for (let x = 1; x < 16; x += 4) ctx.fillRect(x, 0, 2, 16);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
  texCache[key] = t;
  return t;
}

function makeGrassFieldTex() {
  const key = 'grass_field_rich';
  if (texCache[key]) return texCache[key];
  const c = document.createElement('canvas'); c.width = 64; c.height = 64;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#4ade80'; ctx.fillRect(0, 0, 64, 64);
  const shades = ['#22c55e', '#16a34a', '#86efac', '#15803d'];
  for (let i = 0; i < 180; i++) {
    ctx.fillStyle = shades[i % shades.length];
    const gx = (i * 19) % 62, gy = (i * 31) % 60;
    ctx.fillRect(gx, gy, 2, 4);
    ctx.fillRect(gx + 1, gy - 1, 1, 3);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(22, 22);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
  texCache[key] = t;
  return t;
}

function makeDesertSandTex() {
  const key = 'desert_sand_rich_fixed';
  if (texCache[key]) return texCache[key];
  const c = document.createElement('canvas'); c.width = 64; c.height = 64;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#f6d379'; ctx.fillRect(0, 0, 64, 64);
  const shades = ['#eab308', '#d97706', '#fde68a', '#ca8a04'];
  for (let i = 0; i < 140; i++) {
    ctx.fillStyle = shades[i % shades.length];
    const gx = (i * 23) % 60, gy = (i * 29) % 60;
    ctx.fillRect(gx, gy, 3, 3);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(12, 1);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
  texCache[key] = t;
  return t;
}

function makeWetMudTex() {
  const key = 'wet_mud_natural_fixed';
  if (texCache[key]) return texCache[key];
  const c = document.createElement('canvas'); c.width = 64; c.height = 64;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#6b4226'; ctx.fillRect(0, 0, 64, 64);
  const mudShades = ['#5c361e', '#7c4d2b', '#4a2c18', '#855834', '#3b2212'];
  for (let i = 0; i < 260; i++) {
    ctx.fillStyle = mudShades[i % mudShades.length];
    const mx = (i * 17 + 5) % 60, my = (i * 31 + 9) % 60;
    ctx.fillRect(mx, my, 2 + (i % 4), 2 + ((i * 3) % 4));
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(6, 2);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
  texCache[key] = t;
  return t;
}

function makeFlowingWaterWallTex() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 64;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0284c7'; ctx.fillRect(0, 0, 64, 64);
  const waveCols = ['#0369a1', '#38bdf8', '#7dd3fc', '#075985'];
  for (let y = 0; y < 64; y += 8) {
    ctx.fillStyle = waveCols[(y / 8) % waveCols.length];
    ctx.fillRect(0, y, 64, 3);
    ctx.fillStyle = '#bae6fd';
    ctx.fillRect((y * 5) % 52, y + 1, 10, 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(16, 3);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
  flowingWaterTextures.push(t);
  return t;
}

function makeArkFloorTex(baseHex, lineHex) {
  const key = 'fl_' + baseHex + '_' + lineHex;
  if (texCache[key]) return texCache[key];
  const c = document.createElement('canvas'); c.width = 64; c.height = 64;
  const ctx = c.getContext('2d');
  ctx.fillStyle = baseHex; ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = lineHex;
  for (let y = 0; y < 64; y += 16) {
    ctx.fillRect(0, y, 64, 3);
    ctx.fillRect((y * 2) % 64, y, 3, 16);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(14, 18);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
  texCache[key] = t;
  return t;
}

function makeArkWallTex(panelHex, frameHex) {
  const key = 'wl_' + panelHex + '_' + frameHex;
  if (texCache[key]) return texCache[key];
  const c = document.createElement('canvas'); c.width = 32; c.height = 32;
  const ctx = c.getContext('2d');
  ctx.fillStyle = panelHex; ctx.fillRect(0, 0, 32, 32);
  ctx.fillStyle = frameHex;
  ctx.fillRect(0, 0, 32, 4); ctx.fillRect(0, 28, 32, 4);
  ctx.fillRect(0, 0, 3, 32); ctx.fillRect(15, 0, 2, 32); ctx.fillRect(29, 0, 3, 32);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
  texCache[key] = t;
  return t;
}

function matVoxel(baseHex, noiseHex) {
  if (!noiseHex) return new THREE.MeshLambertMaterial({ color: baseHex });
  return new THREE.MeshLambertMaterial({ map: makePixelTex(baseHex, noiseHex) });
}

function createBox(w, h, d, mat, x, y, z, shadow = true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  if (shadow) { m.castShadow = true; m.receiveShadow = true; }
  return m;
}

function getBaseGroundHeight(x, z) {
  if (currentEpisode === 'exodus') {
    if (currentStage === 1 && exodusStage1SlopeMeta) {
      const { northZ, southZ, topY, bottomY } = exodusStage1SlopeMeta;
      const clampedZ = Math.max(northZ, Math.min(southZ, z));
      const t = (clampedZ - northZ) / Math.max(1, (southZ - northZ));
      return bottomY + t * (topY - bottomY);
    }
    if (currentStage === 2 && exodusStage2SlopeMeta) {
      const { northZ, southZ, startHighY, midLowY, endHighY } = exodusStage2SlopeMeta;
      const midZ = (southZ + northZ) * 0.5;
      const halfLen = Math.max(1, (southZ - northZ) * 0.5);
      const norm = Math.max(-1, Math.min(1, (z - midZ) / halfLen));
      const curve = norm * norm;
      return norm >= 0
        ? midLowY + curve * (startHighY - midLowY)
        : midLowY + curve * (endHighY - midLowY);
    }
  }
  return 0;
}

function createHeroMesh(isMoses = false) {
  const g = new THREE.Group();
  const robe = isMoses ? matVoxel('#991b1b', '#7f1d1d') : matVoxel('#78350f', '#92400e');
  const cloak = isMoses ? matVoxel('#1e3a8a', '#172554') : matVoxel('#5c2d0c', '#451a03');
  const innerTunic = matVoxel('#fef3c7', '#fde68a');
  const beltMat = matVoxel('#b45309'), buckleMat = matVoxel('#facc15');
  const skin = matVoxel('#fed7aa', '#fdba74');
  const beard = isMoses ? matVoxel('#cbd5e1', '#94a3b8') : matVoxel('#f8fafc', '#e2e8f0');

  const lLeg = new THREE.Group(); lLeg.position.set(-0.22, 0.7, 0);
  lLeg.add(createBox(0.38, 0.55, 0.38, innerTunic, 0, -0.28, 0), createBox(0.4, 0.16, 0.44, cloak, 0, -0.62, 0.03));
  const rLeg = new THREE.Group(); rLeg.position.set(0.22, 0.7, 0);
  rLeg.add(createBox(0.38, 0.55, 0.38, innerTunic, 0, -0.28, 0), createBox(0.4, 0.16, 0.44, cloak, 0, -0.62, 0.03));

  const torso = createBox(0.92, 1.08, 0.52, robe, 0, 1.22, 0);
  const tunicFront = createBox(0.34, 1.06, 0.55, innerTunic, 0, 1.22, 0);
  const robeHem = createBox(0.98, 0.34, 0.58, cloak, 0, 0.72, 0);
  const belt = createBox(0.98, 0.18, 0.58, beltMat, 0, 1.05, 0);
  const buckle = createBox(0.24, 0.22, 0.61, buckleMat, 0, 1.05, 0);
  const sash = createBox(0.18, 0.42, 0.6, beltMat, 0.18, 0.82, 0);
  const shoulderMantle = createBox(1.12, 0.24, 0.62, cloak, 0, 1.68, 0);
  const backCape = createBox(0.96, 1.15, 0.12, cloak, 0, 1.18, -0.3);

  const head = createBox(0.8, 0.8, 0.8, skin, 0, 2.15, 0);
  const bMesh = createBox(0.84, 0.45, 0.3, beard, 0, 1.9, 0.35);
  const hair = createBox(0.88, 0.3, 0.88, isMoses ? innerTunic : beard, 0, 2.5, 0);
  const headBand = createBox(0.92, 0.12, 0.92, isMoses ? robe : beltMat, 0, 2.42, 0);
  const eyeMat = matVoxel('#0f172a');
  const lEye = createBox(0.12, 0.12, 0.06, eyeMat, -0.18, 2.22, 0.41);
  const rEye = createBox(0.12, 0.12, 0.06, eyeMat, 0.18, 2.22, 0.41);

  const lArm = new THREE.Group(); lArm.position.set(-0.66, 1.62, 0);
  lArm.add(createBox(0.34, 0.72, 0.34, robe, 0, -0.32, 0), createBox(0.38, 0.2, 0.38, cloak, 0, -0.58, 0), createBox(0.26, 0.18, 0.26, skin, 0, -0.74, 0));

  const rArm = new THREE.Group(); rArm.position.set(0.66, 1.62, 0);
  rArm.add(
    createBox(0.34, 0.72, 0.34, robe, 0, -0.32, 0), createBox(0.38, 0.2, 0.38, cloak, 0, -0.58, 0), createBox(0.26, 0.18, 0.26, skin, 0, -0.74, 0),
    createBox(0.13, 2.35, 0.13, matVoxel('#451a03'), 0.04, -0.38, 0.32),
    createBox(0.26, 0.24, 0.26, matVoxel(isMoses ? '#38bdf8' : '#d97706'), 0.04, 0.82, 0.32)
  );

  carriedBlockGroup = new THREE.Group();
  carriedBlockGroup.position.set(0, 1.25, -0.52);
  g.add(carriedBlockGroup);

  g.add(lLeg, rLeg, torso, tunicFront, robeHem, belt, buckle, sash, shoulderMantle, backCape, head, bMesh, hair, headBand, lEye, rEye, lArm, rArm);
  playerLimbs = { lLeg, rLeg, lArm, rArm };
  return g;
}

function updateCarriedBlocksVisual() {
  if (!carriedBlockGroup) return;
  while (carriedBlockGroup.children.length > 0) carriedBlockGroup.remove(carriedBlockGroup.children[0]);
  for (let i = 0; i < Math.min(heldBlocks, 6); i++) {
    const logItem = createLogBlockMesh(0.58, 0.32, 0.42);
    logItem.position.set(0, i * 0.36, 0);
    carriedBlockGroup.add(logItem);
  }
  const hudBox = document.getElementById('hud-block-box');
  if (currentEpisode === 'exodus' && currentStage === 1) {
    hudBox.classList.remove('hidden'); hudBox.classList.add('flex');
    document.getElementById('hud-block-text').textContent = `통나무 ${heldBlocks}/${EXODUS_STAGE1_MAX_CARRY}개`;
  } else {
    hudBox.classList.add('hidden'); hudBox.classList.remove('flex');
  }
}

function createGuideArrowMesh() {
  const g = new THREE.Group();
  const m = new THREE.MeshBasicMaterial({ color: 0xfde047 });
  g.add(createBox(0.28, 0.22, 0.75, m, 0, 0, -0.1, false));
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.6, 4), m);
  tip.rotation.x = Math.PI / 2; tip.position.set(0, 0, 0.45);
  g.add(tip);
  g.position.set(0, 3.35, 0);
  return g;
}

function rebuildPlayerAppearance() {
  if (playerGroup) scene.remove(playerGroup);
  playerGroup = createHeroMesh(currentEpisode === 'exodus');
  guideArrowGroup = createGuideArrowMesh();
  guideArrowGroup.visible = (currentMode !== 'senior');
  playerGroup.add(guideArrowGroup);
  playerGroup.position.copy(playerPos);
  scene.add(playerGroup);
  document.getElementById('hud-avatar-icon').textContent = (currentEpisode === 'exodus') ? '🪄' : '🧔🏻';
}

// =========================================================================
// 불기둥(Pillar of Fire) & 역동적인 구름기둥(Pillar of Cloud) 팩토리
// =========================================================================
function createBlazingPillarOfFire(x, y, z, scale = 1.0) {
  const pGroup = new THREE.Group();
  const baseMat = matVoxel('#fde047', '#ca8a04');
  const outerFireMat = new THREE.MeshBasicMaterial({ color: 0xea580c, transparent: true, opacity: 0.82 });
  const midFireMat = new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.9 });
  const innerFireMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  const cloudMat = matVoxel('#f8fafc', '#e2e8f0');

  const altarBase = createBox(4.2 * scale, 0.9 * scale, 4.2 * scale, baseMat, 0, 0.45 * scale, 0);
  const outerCore = createBox(2.5 * scale, 8.5 * scale, 2.5 * scale, outerFireMat, 0, 4.8 * scale, 0, false);
  const midCore = createBox(1.85 * scale, 9.2 * scale, 1.85 * scale, midFireMat, 0, 5.1 * scale, 0, false);
  const innerCore = createBox(1.15 * scale, 9.8 * scale, 1.15 * scale, innerFireMat, 0, 5.4 * scale, 0, false);

  const cloudRing1 = createBox(3.4 * scale, 1.2 * scale, 3.4 * scale, cloudMat, 0, 2.2 * scale, 0, false);
  const cloudRing2 = createBox(3.0 * scale, 1.0 * scale, 3.0 * scale, cloudMat, 0, 5.6 * scale, 0, false);

  pGroup.add(altarBase, outerCore, midCore, innerCore, cloudRing1, cloudRing2);

  const embers = [];
  const emberColors = [0xfef08a, 0xfde047, 0xf97316, 0xef4444, 0xfb923c];
  for (let i = 0; i < 24; i++) {
    const eMat = new THREE.MeshBasicMaterial({ color: emberColors[i % emberColors.length] });
    const sz = (0.32 + (i % 3) * 0.16) * scale;
    const ember = createBox(sz, sz * 1.4, sz, eMat, 0, 1.0, 0, false);
    const angle = (i / 24) * Math.PI * 2;
    const radius = (0.9 + (i % 4) * 0.38) * scale;
    pGroup.add(ember);
    embers.push({
      mesh: ember, angle, radius,
      speedY: (3.2 + (i % 5) * 0.85) * scale,
      yOffset: (i / 24) * 9.0 * scale,
      maxH: 9.8 * scale,
      phase: i * 0.7
    });
  }

  pGroup.position.set(x, y, z);
  pGroup.userData = { fireCore: midCore, outerCore, innerCore, cloudRing: cloudRing1, cloudRing2, embers, scale };
  worldGroup.add(pGroup);
  blazingPillars.push(pGroup);
  return pGroup;
}

function createSwirlingPillarOfCloud(x, y, z, scale = 1.0) {
  const pGroup = new THREE.Group();
  const baseMat = matVoxel('#cbd5e1', '#94a3b8');
  const outerCloudMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.78 });
  const midCloudMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc, transparent: true, opacity: 0.9 });
  const innerGlowMat = new THREE.MeshBasicMaterial({ color: 0xbae6fd });
  const puffMat = matVoxel('#ffffff', '#e0f2fe');

  const altarBase = createBox(4.2 * scale, 0.9 * scale, 4.2 * scale, baseMat, 0, 0.45 * scale, 0);
  const outerCore = createBox(2.7 * scale, 8.8 * scale, 2.7 * scale, outerCloudMat, 0, 4.9 * scale, 0, false);
  const midCore = createBox(2.0 * scale, 9.4 * scale, 2.0 * scale, midCloudMat, 0, 5.2 * scale, 0, false);
  const innerCore = createBox(1.2 * scale, 10.0 * scale, 1.2 * scale, innerGlowMat, 0, 5.5 * scale, 0, false);

  const cloudRing1 = createBox(3.7 * scale, 1.3 * scale, 3.7 * scale, puffMat, 0, 2.4 * scale, 0, false);
  const cloudRing2 = createBox(3.3 * scale, 1.2 * scale, 3.3 * scale, puffMat, 0, 6.0 * scale, 0, false);

  pGroup.add(altarBase, outerCore, midCore, innerCore, cloudRing1, cloudRing2);

  const embers = [];
  const cloudColors = [0xffffff, 0xf8fafc, 0xe0f2fe, 0xbae6fd, 0xcbd5e1];
  for (let i = 0; i < 24; i++) {
    const cMat = new THREE.MeshBasicMaterial({ color: cloudColors[i % cloudColors.length], transparent: true, opacity: 0.9 });
    const sz = (0.42 + (i % 3) * 0.18) * scale;
    const puff = createBox(sz * 1.3, sz, sz * 1.3, cMat, 0, 1.0, 0, false);
    const angle = (i / 24) * Math.PI * 2;
    const radius = (1.05 + (i % 4) * 0.42) * scale;
    pGroup.add(puff);
    embers.push({
      mesh: puff, angle, radius,
      speedY: (2.8 + (i % 5) * 0.75) * scale,
      yOffset: (i / 24) * 9.2 * scale,
      maxH: 10.0 * scale,
      phase: i * 0.8
    });
  }

  pGroup.position.set(x, y, z);
  pGroup.userData = { fireCore: midCore, outerCore, innerCore, cloudRing: cloudRing1, cloudRing2, embers, scale };
  worldGroup.add(pGroup);
  blazingPillars.push(pGroup);
  return pGroup;
}

function updateBlazingPillars(dt, now) {
  blazingPillars.forEach(pg => {
    const u = pg.userData;
    if (!u) return;
    const pulse = 1 + Math.sin(now * 0.015) * 0.14;
    u.outerCore.rotation.y += dt * 2.6;
    u.fireCore.rotation.y -= dt * 3.8;
    u.innerCore.rotation.y += dt * 5.2;
    u.outerCore.scale.set(pulse, 1 + Math.cos(now * 0.012) * 0.08, pulse);
    u.fireCore.scale.set(1 / pulse, 1 + Math.sin(now * 0.018) * 0.12, 1 / pulse);

    u.cloudRing.rotation.y -= dt * 1.8;
    u.cloudRing.position.y = (2.2 + Math.sin(now * 0.005) * 0.45) * u.scale;
    if (u.cloudRing2) {
      u.cloudRing2.rotation.y += dt * 2.2;
      u.cloudRing2.position.y = (5.6 + Math.cos(now * 0.006) * 0.55) * u.scale;
    }

    if (u.embers) {
      u.embers.forEach(e => {
        e.yOffset += e.speedY * dt;
        if (e.yOffset > e.maxH) e.yOffset = 0.8 * u.scale;
        const prog = e.yOffset / e.maxH;
        const curAngle = e.angle + now * 0.004 + prog * 2.5;
        const curRad = e.radius * (1 - prog * 0.35) + Math.sin(now * 0.01 + e.phase) * 0.25;
        e.mesh.position.set(Math.cos(curAngle) * curRad, e.yOffset, Math.sin(curAngle) * curRad);
        const s = Math.max(0.2, 1.15 - prog * 0.85);
        e.mesh.scale.set(s, s, s);
        e.mesh.rotation.y += dt * 6;
        e.mesh.rotation.x += dt * 4;
      });
    }
  });
}

const ANIMAL_SPECS = {
  lion:     { name: '사자', icon: '🦁', col: '#d97706', sub: '#92400e', b:[0.9,0.65,1.2,0.58], h:[0.68,0.68,0.68,0.98,0.65], mane:true },
  sheep:    { name: '양',   icon: '🐑', col: '#f8fafc', sub: '#fbcfe8', b:[0.92,0.72,1.15,0.62], h:[0.56,0.56,0.6,0.95,0.65] },
  elephant: { name: '코끼리', icon: '🐘', col: '#94a3b8', sub: '#64748b', b:[1.15,0.9,1.35,0.72], h:[0.78,0.78,0.78,1.2,0.72], trunk:true },
  giraffe:  { name: '기린', icon: '🦒', col: '#facc15', sub: '#ca8a04', b:[0.85,0.68,1.15,0.62], h:[0.54,0.52,0.62,2.15,0.58], neck:true },
  panda:    { name: '판다', icon: '🐼', col: '#f8fafc', sub: '#1e293b', b:[0.98,0.75,1.2,0.62], h:[0.68,0.64,0.68,1.0,0.65], ears:true },
  rabbit:   { name: '토끼', icon: '🐰', col: '#fce7f3', sub: '#f472b6', b:[0.62,0.5,0.8,0.45], h:[0.5,0.5,0.5,0.78,0.45], longEars:true },
  deer:     { name: '사슴', icon: '🦌', col: '#b45309', sub: '#fde68a', b:[0.8,0.65,1.15,0.6], h:[0.54,0.56,0.6,1.12,0.62], antlers:true, ears:true },
  zebra:    { name: '얼룩말', icon: '🦓', col: '#f8fafc', sub: '#0f172a', b:[0.86,0.68,1.24,0.62], h:[0.56,0.6,0.68,1.1,0.68], stripes:true },
  penguin:  { name: '펭귄', icon: '🐧', col: '#1e293b', sub: '#facc15', b:[0.58,0.85,0.52,0.52], h:[0.52,0.5,0.52,1.12,0.06], beak:true },
  turtle:   { name: '거북이', icon: '🐢', col: '#15803d', sub: '#4ade80', b:[0.95,0.45,1.05,0.38], h:[0.44,0.4,0.48,0.48,0.68] },
  fox:      { name: '여우', icon: '🦊', col: '#ea580c', sub: '#fed7aa', b:[0.72,0.52,1.05,0.48], h:[0.56,0.52,0.6,0.82,0.58], ears:true },
  pig:      { name: '아기돼지', icon: '🐷', col: '#f472b6', sub: '#db2777', b:[0.82,0.6,1.0,0.5], h:[0.62,0.58,0.58,0.78,0.55] },
  duck:     { name: '오리', icon: '🦆', col: '#fde047', sub: '#f97316', b:[0.58,0.5,0.75,0.42], h:[0.46,0.46,0.46,0.8,0.38], beak:true },
  bear:     { name: '곰돌이', icon: '🐻', col: '#78350f', sub: '#451a03', b:[1.05,0.82,1.25,0.65], h:[0.74,0.68,0.7,1.08,0.68], ears:true },
  koala:    { name: '코알라', icon: '🐨', col: '#64748b', sub: '#e2e8f0', b:[0.76,0.62,0.9,0.52], h:[0.62,0.58,0.58,0.88,0.5], ears:true }
};

function createSingleAnimal(type) {
  const s = ANIMAL_SPECS[type] || ANIMAL_SPECS.sheep;
  const g = new THREE.Group();
  const mMain = s.stripes ? new THREE.MeshLambertMaterial({ map: makeZebraStripeTex() }) : matVoxel(s.col);
  const mSub = matVoxel(s.sub), mEye = matVoxel('#0f172a');
  const [bw, bh, bd, by] = s.b, [hw, hh, hd, hy, hz] = s.h;
  g.add(createBox(bw, bh, bd, mMain, 0, by, 0), createBox(hw, hh, hd, mMain, 0, hy, hz));

  if (s.stripes) {
    [-0.36, -0.08, 0.2, 0.44].forEach(sz => g.add(createBox(bw + 0.04, bh + 0.03, 0.13, mSub, 0, by, sz)));
    g.add(createBox(0.14, 0.32, 0.55, mSub, 0, hy + hh * 0.45, hz - 0.12), createBox(hw * 0.7, hh * 0.45, 0.14, mSub, 0, hy - 0.08, hz + hd / 2 + 0.02));
  }

  const eyeX = hw * 0.28, eyeY = hy + hh * 0.08, eyeZ = hz + hd / 2 + 0.04;
  g.add(createBox(0.1, 0.1, 0.05, mEye, -eyeX, eyeY, eyeZ), createBox(0.1, 0.1, 0.05, mEye, eyeX, eyeY, eyeZ));
  [[-bw*0.3, -bd*0.32], [bw*0.3, -bd*0.32], [-bw*0.3, bd*0.32], [bw*0.3, bd*0.32]].forEach(([lx, lz]) => {
    g.add(createBox(0.22, by, 0.22, s.stripes ? mMain : mSub, lx, by/2, lz));
  });

  if (s.mane) g.add(createBox(hw+0.2, hh+0.2, 0.42, mSub, 0, hy, hz-0.12));
  if (s.trunk) {
    g.add(createBox(0.22, 0.62, 0.22, mSub, 0, hy - 0.28, eyeZ + 0.12), createBox(0.18, 0.55, 0.45, mSub, -hw * 0.58, hy, hz), createBox(0.18, 0.55, 0.45, mSub, hw * 0.58, hy, hz));
  }
  if (s.neck) {
    g.add(createBox(0.34, 1.15, 0.34, mMain, 0, 1.35, 0.48));
    const lEar = createBox(0.26, 0.15, 0.14, mSub, -hw * 0.65, hy + hh * 0.22, hz - 0.04); lEar.rotation.z = 0.28;
    const rEar = createBox(0.26, 0.15, 0.14, mSub, hw * 0.65, hy + hh * 0.22, hz - 0.04); rEar.rotation.z = -0.28;
    g.add(lEar, rEar, createBox(0.09, 0.24, 0.09, mSub, -0.13, hy + hh * 0.62, hz - 0.02), createBox(0.09, 0.24, 0.09, mSub, 0.13, hy + hh * 0.62, hz - 0.02));
  }
  if (s.ears) g.add(createBox(0.2, 0.2, 0.15, mSub, -hw*0.38, hy+hh*0.55, hz), createBox(0.2, 0.2, 0.15, mSub, hw*0.38, hy+hh*0.55, hz));
  if (s.longEars) g.add(createBox(0.14, 0.48, 0.14, mSub, -0.15, hy+hh*0.7, hz), createBox(0.14, 0.48, 0.14, mSub, 0.15, hy+hh*0.7, hz));
  if (s.beak) g.add(createBox(0.22, 0.14, 0.24, mSub, 0, hy-0.05, eyeZ+0.08));
  if (s.antlers) {
    g.add(createBox(0.1, 0.45, 0.1, mSub, -0.2, hy+hh*0.72, hz), createBox(0.1, 0.45, 0.1, mSub, 0.2, hy+hh*0.72, hz), createBox(0.22, 0.1, 0.1, mSub, -0.26, hy+hh*0.82, hz), createBox(0.22, 0.1, 0.1, mSub, 0.26, hy+hh*0.82, hz));
  }
  return g;
}

function createAnimalPairGroup(type, withRingColor = null) {
  const pairGroup = new THREE.Group();
  const a1 = createSingleAnimal(type); a1.position.set(-0.68, 0, 0);
  const a2 = createSingleAnimal(type); a2.position.set(0.68, 0, 0.15);
  pairGroup.add(a1, a2);
  let ring = null;
  if (withRingColor !== null) {
    ring = new THREE.Mesh(new THREE.RingGeometry(1.35, 1.72, 20), new THREE.MeshBasicMaterial({ color: withRingColor, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.06;
    pairGroup.add(ring);
  }
  pairGroup.userData = { ring, a1, a2 };
  return pairGroup;
}

function createDoveMesh(hasLeaf = true) {
  const g = new THREE.Group();
  const w = matVoxel('#ffffff'), b = matVoxel('#f97316'), eyeM = matVoxel('#0f172a');
  const leafMat = matVoxel('#22c55e'), stemMat = matVoxel('#15803d');
  g.add(createBox(0.55, 0.42, 0.75, w, 0, 0.4, 0), createBox(0.42, 0.42, 0.42, w, 0, 0.72, 0.32), createBox(0.08, 0.08, 0.05, eyeM, -0.14, 0.76, 0.53), createBox(0.08, 0.08, 0.05, eyeM, 0.14, 0.76, 0.53), createBox(0.16, 0.12, 0.25, b, 0, 0.7, 0.6));
  const leafGroup = new THREE.Group();
  leafGroup.add(createBox(0.32, 0.07, 0.08, stemMat, 0.08, 0.68, 0.74), createBox(0.42, 0.12, 0.26, leafMat, 0.22, 0.71, 0.78), createBox(0.28, 0.12, 0.22, leafMat, 0.38, 0.76, 0.84));
  leafGroup.visible = hasLeaf;
  const lWing = createBox(0.68, 0.1, 0.46, w, -0.52, 0.5, 0), rWing = createBox(0.68, 0.1, 0.46, w, 0.52, 0.5, 0);
  g.add(leafGroup, lWing, rWing);
  g.userData = { lWing, rWing, leaf: leafGroup };
  return g;
}

function createArkWallWindow() {
  const winGroup = new THREE.Group();
  const frameMat = matVoxel('#5c2d0c', '#451a03'), goldTrim = matVoxel('#f59e0b');
  const skyGlowMat = new THREE.MeshBasicMaterial({ color: 0xbae6fd }), shutterMat = matVoxel('#b45309', '#78350f');
  winGroup.add(createBox(3.6, 2.8, 0.18, skyGlowMat, 0, 0, 0, false), createBox(4.4, 0.4, 0.45, frameMat, 0, 1.5, 0.1), createBox(4.4, 0.4, 0.45, frameMat, 0, -1.5, 0.1), createBox(0.4, 3.4, 0.45, frameMat, -2.0, 0, 0.1), createBox(0.4, 3.4, 0.45, frameMat, 2.0, 0, 0.1));
  const lShutter = new THREE.Group(); lShutter.position.set(-1.8, 0, 0.22);
  lShutter.add(createBox(1.8, 2.7, 0.2, shutterMat, 0.9, 0, 0), createBox(0.22, 0.45, 0.28, goldTrim, 1.55, 0, 0.04));
  const rShutter = new THREE.Group(); rShutter.position.set(1.8, 0, 0.22);
  rShutter.add(createBox(1.8, 2.7, 0.2, shutterMat, -0.9, 0, 0), createBox(0.22, 0.45, 0.28, goldTrim, -1.55, 0, 0.04));
  winGroup.add(lShutter, rShutter);
  winGroup.userData = { lShutter, rShutter };
  return winGroup;
}

function addWallTorch(x, y, z) {
  const by = getBaseGroundHeight(x, z);
  const stick = createBox(0.18, 0.68, 0.18, matVoxel('#5c2d0c'), x, by + y, z, false);
  const flame = createBox(0.28, 0.32, 0.28, new THREE.MeshBasicMaterial({ color: 0xfde047 }), x, by + y + 0.45, z, false);
  const core = createBox(0.34, 0.2, 0.34, new THREE.MeshBasicMaterial({ color: 0xf97316 }), x, by + y + 0.36, z, false);
  worldGroup.add(stick, flame, core);
  torchFlames.push(flame);
}

function addHayBaleCluster(x, z) {
  const by = getBaseGroundHeight(x, z);
  const hayMat = matVoxel('#eab308', '#ca8a04'), ropeMat = matVoxel('#92400e');
  worldGroup.add(
    createBox(1.5, 1.0, 1.2, hayMat, x - 0.65, by + 0.5, z), createBox(1.54, 0.14, 1.24, ropeMat, x - 0.65, by + 0.5, z, false),
    createBox(1.4, 1.0, 1.2, hayMat, x + 0.7, by + 0.5, z + 0.2), createBox(1.44, 0.14, 1.24, ropeMat, x + 0.7, by + 0.5, z + 0.2, false),
    createBox(1.3, 0.9, 1.1, hayMat, x, by + 1.45, z + 0.1), createBox(1.34, 0.14, 1.14, ropeMat, x, by + 1.45, z + 0.1, false)
  );
  platforms.push({ minX: x - 1.5, maxX: x + 1.5, minZ: z - 0.9, maxZ: z + 1.1, topY: by + 1.9 });
}

function addJumpRock(x, z, w, h, d, isWood = false) {
  const by = getBaseGroundHeight(x, z);
  const mat = isWood ? matVoxel('#b45309', '#78350f') : matVoxel('#64748b', '#475569');
  worldGroup.add(createBox(w, h, d, mat, x, by + h / 2, z));
  platforms.push({ minX: x - w/2 - 0.35, maxX: x + w/2 + 0.35, minZ: z - d/2 - 0.35, maxZ: z + d/2 + 0.35, topY: by + h });
}

function addTree(x, z, scale = 1, registerTransparent = true) {
  const trunkH = 2.4 * scale;
  const trunk = createBox(0.75 * scale, trunkH, 0.75 * scale, matVoxel('#78350f', '#451a03').clone(), x, trunkH / 2, z);
  const leaves1 = createBox(2.8 * scale, 1.6 * scale, 2.8 * scale, matVoxel('#16a34a', '#15803d').clone(), x, trunkH + 0.6 * scale, z);
  const leaves2 = createBox(1.9 * scale, 1.3 * scale, 1.9 * scale, matVoxel('#22c55e', '#16a34a').clone(), x, trunkH + 1.7 * scale, z);
  worldGroup.add(trunk, leaves1, leaves2);
  if (registerTransparent) wallMeshes.push(trunk, leaves1, leaves2);
  colliders.push({ minX: x - 0.6, maxX: x + 0.6, minZ: z - 0.6, maxZ: z + 0.6 });
}

function addPalmTree(x, z, scale = 1, registerTransparent = true) {
  const by = getBaseGroundHeight(x, z), trunkH = 3.2 * scale;
  const trunk = createBox(0.65 * scale, trunkH, 0.65 * scale, matVoxel('#92400e', '#78350f').clone(), x, by + trunkH / 2, z);
  const crown = createBox(1.2 * scale, 0.6 * scale, 1.2 * scale, matVoxel('#15803d').clone(), x, by + trunkH + 0.2, z);
  const leafL = createBox(3.4 * scale, 0.35 * scale, 0.9 * scale, matVoxel('#22c55e', '#16a34a').clone(), x, by + trunkH + 0.35, z);
  const leafFB = createBox(0.9 * scale, 0.35 * scale, 3.4 * scale, matVoxel('#22c55e', '#16a34a').clone(), x, by + trunkH + 0.35, z);
  worldGroup.add(trunk, crown, leafL, leafFB);
  if (registerTransparent) wallMeshes.push(trunk, crown, leafL, leafFB);
  colliders.push({ minX: x - 0.55, maxX: x + 0.55, minZ: z - 0.55, maxZ: z + 0.55 });
}

function scatterMeadowGrassTufts(limit) {
  const bladeMat1 = new THREE.MeshLambertMaterial({ color: 0x16a34a }), bladeMat2 = new THREE.MeshLambertMaterial({ color: 0x22c55e });
  const flowerColors = [0xfef08a, 0xfbcfe8, 0xffffff, 0xfde047];
  const tuftCount = limit > 40 ? 220 : 110;
  for (let i = 0; i < tuftCount; i++) {
    const gx = ((i * 37 + 13) % (limit * 1.92)) - limit * 0.96, gz = ((i * 53 + 29) % (limit * 1.92)) - limit * 0.96;
    if (Math.abs(gx) < 11 && gz < -10) continue;
    worldGroup.add(createBox(0.18, 0.45, 0.18, bladeMat1, gx, 0.22, gz, false), createBox(0.16, 0.35, 0.16, bladeMat2, gx + 0.22, 0.18, gz + 0.14, false));
    if (i % 3 === 0) worldGroup.add(createBox(0.22, 0.22, 0.22, new THREE.MeshBasicMaterial({ color: flowerColors[i % flowerColors.length] }), gx + 0.1, 0.42, gz - 0.1, false));
  }
}

function buildGrassAndTreeBorders(limit, isDesert = false) {
  currentMapBounds = limit - 2.0;
  const step = 10;
  for (let i = -limit - 20; i <= limit + 20; i += step) {
    [[-limit - 8, i], [limit + 8, i], [i, -limit - 8], [i, limit + 8]].forEach(([bx, bz]) => {
      const h1 = 4 + (Math.abs(bx + bz) % 4), h2 = h1 + 4;
      const c1 = isDesert ? matVoxel('#f59e0b', '#d97706').clone() : matVoxel('#22c55e', '#16a34a').clone();
      const c2 = isDesert ? matVoxel('#b45309', '#92400e').clone() : matVoxel('#15803d', '#166534').clone();
      const hill1 = createBox(step + 2, h1, step + 2, c1, bx, h1 / 2, bz);
      const hill2 = createBox(step + 4, h2, step + 4, c2, bx * 1.12, h2 / 2, bz * 1.12);
      worldGroup.add(hill1, hill2);
      wallMeshes.push(hill1, hill2);
      if (isDesert) addPalmTree(bx + ((i % 3) - 1), bz, 1.2, true);
      else addTree(bx + ((i % 3) - 1), bz, 1.25, true);
    });
  }
}

function lerpAngle(current, target, t) {
  let diff = target - current;
  while (diff < -Math.PI) diff += Math.PI * 2;
  while (diff > Math.PI) diff -= Math.PI * 2;
  return current + diff * Math.min(1, t);
}

function isSpawnSpotClear(x, z, radius = 1.65) {
  for (const c of colliders) {
    if (x + radius > c.minX && x - radius < c.maxX && z + radius > c.minZ && z - radius < c.maxZ) return false;
  }
  for (const p of platforms) {
    if (x + radius > p.minX && x - radius < p.maxX && z + radius > p.minZ && z - radius < p.maxZ) return false;
  }
  return true;
}

function findRandomSafeSpot(bounds, existingSpots, minSpacing, avoidPos, avoidRadius = 7.0) {
  for (let attempt = 0; attempt < 160; attempt++) {
    const rx = bounds.minX + Math.random() * (bounds.maxX - bounds.minX);
    const rz = bounds.minZ + Math.random() * (bounds.maxZ - bounds.minZ);
    if (avoidPos && Math.hypot(rx - avoidPos.x, rz - avoidPos.z) < avoidRadius) continue;
    if (!isSpawnSpotClear(rx, rz, 1.65)) continue;
    let tooClose = false;
    for (const pt of existingSpots) {
      if (Math.hypot(rx - pt[0], rz - pt[1]) < minSpacing) { tooClose = true; break; }
    }
    if (!tooClose) return [rx, rz];
  }
  return [(bounds.minX + bounds.maxX) * 0.5, (bounds.minZ + bounds.maxZ) * 0.5];
}

function clearWorld() {
  if (worldGroup) scene.remove(worldGroup);
  worldGroup = new THREE.Group();
  scene.add(worldGroup);
  colliders = []; platforms = []; wallMeshes = []; fadedMaterials = [];
  torchFlames = []; stageAnimals = []; arkFriends = []; followingAnimals = []; endingAnimalPairs = [];
  collectibleBlocks = []; buildZones = []; pillarSwitches = []; stage3StairMeshes = [];
  exodusFollowers = []; mosesTrailHistory = []; exodusSeagulls = [];
  endingCelebrationPeople = [];
  egyptianSoldiers = []; stage2Puddles = []; stage2JumpObstacles = []; stage2Pearls = [];
  seaWallFishes = []; flowingWaterTextures = []; blazingPillars = [];
  sinaiCrumbles = []; sinaiMagmaBlocks = []; sinaiHazardZones = []; sinaiCloudLayers = [];
  sinaiStormTopClouds = []; sinaiWaitingPeople = []; sinaiSafeCheckpoints = []; sinaiClocks = [];
  summitSparkles = [];
  hammerAnimTimer = 0; hammerTargetPos = null;
  playerSpeedBoostTimer = 0;
  stage2CountdownActive = false;
  if (stage2CountdownTimer) { clearInterval(stage2CountdownTimer); stage2CountdownTimer = null; }
  const cdOverlay = document.getElementById('stage2-countdown-overlay');
  if (cdOverlay) cdOverlay.style.display = 'none';
  soldierHitCount = 0; soldierDamageCooldown = 0;
  exodusStage1SlopeMeta = null; exodusStage2SlopeMeta = null;
  currentMapBounds = null; currentMapRectBounds = null;
  heldBlocks = 0; activeBuildTarget = null;
  targetObject = null; endingDovePivot = null;
  doveCutscene.active = false; pillarCutscene.active = false; seaPartingCutscene.active = false; sinaiCutscene.active = false;
  document.getElementById('labels-container').innerHTML = '';
  document.getElementById('context-action-btn').classList.add('hidden');
  document.getElementById('puzzle-build-btn').classList.add('hidden');
  document.getElementById('cert-open-btn').classList.add('hidden');
  updateCarriedBlocksVisual();
}

// =========================================================================
// [엔딩 월드] 에피소드 2: 회색 돌판 십계명 + 20명 점프 + 구름·불기둥 + 반대편 높은 시내산 + 스테이지 1 하늘 구름
// =========================================================================
function buildEndingWorld() {
  clearWorld();
  currentStage = 4; certAutoShown = false; startStageBgm(4);
  const isExodus = (currentEpisode === 'exodus');
  scene.background = new THREE.Color(isExodus ? 0x38bdf8 : 0x60a5fa);
  scene.fog = new THREE.Fog(isExodus ? 0x38bdf8 : 0x60a5fa, 55, 165);

  const groundMat = new THREE.MeshLambertMaterial({ map: isExodus ? makeDesertSandTex() : makeGrassFieldTex() });
  worldGroup.add(createBox(120, 1, 120, groundMat, 0, -0.5, 0));
  scatterMeadowGrassTufts(32);
  buildGrassAndTreeBorders(34, isExodus);

  [[-18, 12], [18, 12], [-22, -4], [22, -4], [-16, -18], [16, -18], [-24, 20], [24, 20]].forEach(([tx, tz]) => {
    if (isExodus) addPalmTree(tx, tz, 1.2, true);
    else addTree(tx, tz, 1.15, true);
  });

  if (!isExodus) {
    const rainbowColors = ['#ef4444', '#f97316', '#fde047', '#22c55e', '#3b82f6', '#4f46e5', '#a855f7'];
    rainbowColors.forEach((hex, idx) => {
      const radius = 26 - idx * 1.15, mat = new THREE.MeshBasicMaterial({ color: hex });
      for (let a = 0; a <= Math.PI; a += 0.08) {
        worldGroup.add(createBox(1.5, 1.5, 1.5, mat, Math.cos(a) * radius, Math.sin(a) * radius, -24, false));
      }
    });

    worldGroup.add(createBox(4.2, 1.2, 4.2, matVoxel('#94a3b8', '#64748b'), 0, 0.6, -6), createBox(2.8, 0.9, 2.8, matVoxel('#cbd5e1'), 0, 1.5, -6));
    addWallTorch(-1.6, 1.8, -4.4); addWallTorch(1.6, 1.8, -4.4);
    colliders.push({ minX: -2.55, maxX: 2.55, minZ: -8.55, maxZ: -3.45 });

    targetObject = { type: 'altar', pos: new THREE.Vector3(0, 1.8, -6), label: createWorldLabel('🪨 감사의 제단 (다가가면 인증서가 열려요!)'), triggered: false };

    endingDovePivot = new THREE.Group(); endingDovePivot.position.set(0, 5.5, -6);
    const skyDove = createDoveMesh(true); skyDove.scale.set(1.5, 1.5, 1.5); skyDove.position.set(5.5, 0, 0); skyDove.rotation.y = Math.PI;
    endingDovePivot.add(skyDove); endingDovePivot.userData = { dove: skyDove };
    worldGroup.add(endingDovePivot);

    const pairKeys = ['lion', 'sheep', 'elephant', 'giraffe', 'panda', 'rabbit', 'deer', 'penguin', 'fox', 'koala'];
    pairKeys.forEach((t, i) => {
      const ang = (i / pairKeys.length) * Math.PI * 2, pairGrp = createAnimalPairGroup(t, null);
      pairGrp.position.set(Math.cos(ang) * 12.0, 0, -6 + Math.sin(ang) * 12.0); pairGrp.lookAt(0, 0, -6);
      worldGroup.add(pairGrp); endingAnimalPairs.push({ group: pairGrp, phase: i * 0.75 });
    });
  } else {
    // 북쪽 오아시스 호수 (z = -28)
    worldGroup.add(createBox(70, 0.8, 18, matVoxel('#0284c7', '#38bdf8'), 0, 0.1, -28, false));

    // 엔딩 하늘에도 스테이지 1의 구름 배치
    if (typeof spawnExodusSkyCloudsAndGulls === 'function') {
      spawnExodusSkyCloudsAndGulls(-10);
    }

    // 뒤편 역동적인 구름기둥(좌)과 불기둥(우)
    createSwirlingPillarOfCloud(-6.5, 0, -14.5, 1.25);
    createBlazingPillarOfFire(6.5, 0, -14.5, 1.25);

    // 중앙 십계명 제단의 두 돌판 (회색 암석 질감)
    const stoneTabletMat = matVoxel('#94a3b8', '#64748b');
    const stoneEngraveMat = matVoxel('#475569');
    worldGroup.add(
      createBox(4.6, 1.2, 4.6, matVoxel('#fde047', '#ca8a04'), 0, 0.6, -6),
      createBox(3.2, 0.9, 3.2, matVoxel('#fef08a'), 0, 1.5, -6),
      createBox(1.05, 1.6, 0.28, stoneTabletMat, -0.6, 2.6, -6),
      createBox(1.05, 1.6, 0.28, stoneTabletMat, 0.6, 2.6, -6),
      createBox(0.75, 0.12, 0.31, stoneEngraveMat, -0.6, 2.9, -6, false),
      createBox(0.75, 0.12, 0.31, stoneEngraveMat, -0.6, 2.5, -6, false),
      createBox(0.75, 0.12, 0.31, stoneEngraveMat, 0.6, 2.9, -6, false),
      createBox(0.75, 0.12, 0.31, stoneEngraveMat, 0.6, 2.5, -6, false)
    );
    addWallTorch(-1.9, 1.8, -4.2); addWallTorch(1.9, 1.8, -4.2);
    colliders.push({ minX: -2.6, maxX: 2.6, minZ: -8.6, maxZ: -3.4 });

    // 오아시스 반대편 빈 공간(남쪽 z = +24 ~ +46)에 높은 시내산 연출
    const mtnRock1 = matVoxel('#d97706', '#b45309');
    const mtnRock2 = matVoxel('#b45309', '#78350f');
    const mtnCliff = matVoxel('#78716c', '#57534e');
    const sinaiPeaks = [
      { x: 0,   z: 35, w1: 30, h1: 12, w2: 22, h2: 24, w3: 14, h3: 34 },
      { x: -20, z: 32, w1: 20, h1: 10, w2: 14, h2: 19, w3: 8,  h3: 26 },
      { x: 20,  z: 32, w1: 20, h1: 10, w2: 14, h2: 19, w3: 8,  h3: 26 }
    ];
    sinaiPeaks.forEach((pk) => {
      const g1 = createBox(pk.w1, pk.h1, 14, mtnRock2, pk.x, pk.h1 / 2, pk.z);
      const g2 = createBox(pk.w2, pk.h2, 11, mtnRock1, pk.x, pk.h2 / 2, pk.z + 1.5);
      const g3 = createBox(pk.w3, pk.h3, 8,  mtnCliff, pk.x, pk.h3 / 2, pk.z + 2.5);
      worldGroup.add(g1, g2, g3);
      wallMeshes.push(g1, g2, g3);
    });
    const peakCloud1 = createFluffyCloudGroup(1.1, true);
    peakCloud1.position.set(-6, 26, 33);
    const peakCloud2 = createFluffyCloudGroup(1.2, true);
    peakCloud2.position.set(5, 29, 34);
    worldGroup.add(peakCloud1, peakCloud2);
    colliders.push({ minX: -32, maxX: 32, minZ: 25, maxZ: 46 });

    targetObject = { type: 'altar', pos: new THREE.Vector3(0, 1.8, -6), label: createWorldLabel('📜 시내산 십계명 언약의 제단 (다가가면 달란트 인증서!)'), triggered: false };

    if (typeof createFollowerPersonMesh === 'function') {
      for (let i = 0; i < 20; i++) {
        const ang = (i / 20) * Math.PI * 2;
        const radius = (i % 2 === 0) ? 8.8 : 11.2;
        const px = Math.cos(ang) * radius;
        const pz = -6 + Math.sin(ang) * radius;
        const person = createFollowerPersonMesh(i);
        person.position.set(px, 0, pz);
        person.lookAt(0, 0, -6);
        worldGroup.add(person);
        endingCelebrationPeople.push({ mesh: person, phase: i * 0.65 });
      }
    }
  }

  playerPos.set(0, 0, 9); playerFacing = Math.PI; cameraYaw = 0; cameraTargetYaw = 0;
  snapCameraToPlayer(); updateStageHUD();
  document.getElementById('cert-open-btn').classList.remove('hidden');
  showToast(isExodus ? '🌴 홍해와 시내산을 모두 통과했어요! 기뻐 뛰는 백성들 가운데 제단으로 가보세요!' : '🌈 엔딩 세상에 도착했어요! 제단으로 가거나 [🏆 인증서 보기]를 눌러주세요!');
}

function createWorldLabel(html) {
  const div = document.createElement('div');
  div.className = 'world-label mc-panel px-2 py-0.5 rounded-full text-[11px] font-jua text-amber-300 shadow-md whitespace-nowrap';
  div.innerHTML = html;
  document.getElementById('labels-container').appendChild(div);
  return div;
}

// =========================================================================
// 4. 게임 흐름, HUD, 모달, 카메라 및 물리 엔진
// =========================================================================
function rotateCameraDeg(deg) { cameraTargetYaw += (deg * Math.PI) / 180; playSfx('step'); }

function startVoxelGame(mode) {
  currentMode = mode; currentStage = 1; isPlaying = true;
  hasSpokenInitialMission = false;
  delete document.getElementById('cert-code').dataset.generated;
  rebuildPlayerAppearance();

  document.getElementById('hud-top').classList.remove('hidden');
  document.getElementById('hud-player-tag').textContent = `${explorerName}`;
  document.getElementById('hud-mode-btn').textContent = `${MODE_META[mode].badge} · 🗺️맵`;
  document.getElementById('joystick-zone').style.display = 'block';
  document.getElementById('cam-bottom-bar').style.display = 'flex';
  document.getElementById('action-zone').style.display = 'flex';

  const timerBox = document.getElementById('hud-timer-box');
  if (mode === 'timeattack') {
    timeRemaining = (currentEpisode === 'exodus') ? 10.0 : 7.5;
    timeAttackFirstRechargeUsed = false; isTimeAttackActive = true;
    timerBox.classList.remove('hidden'); timerBox.classList.add('flex');
  } else {
    isTimeAttackActive = false;
    timerBox.classList.add('hidden'); timerBox.classList.remove('flex');
  }

  guideArrowGroup.visible = (mode !== 'senior');
  document.getElementById('hud-compass-hint').classList.toggle('hidden', mode === 'senior');

  if (currentEpisode === 'exodus' && typeof buildExodusStage1World === 'function') buildExodusStage1World();
  else if (typeof buildNoahStage1World === 'function') buildNoahStage1World();
  startStageBgm(1);
}

function openTimeAttackRetryModal() {
  isPlaying = false; isTimeAttackActive = false; playSfx('wrong');
  document.getElementById('retry-modal-icon').textContent = '⏰';
  document.getElementById('retry-modal-title').textContent = '시간이 모두 끝났어요!';
  document.getElementById('retry-modal-desc').innerHTML = '아쉽게도 제한 시간 안에 미션을 완료하지 못했어요.<br/>다시 한 번 힘을 내서 도전해 볼까요?';
  const rm = document.getElementById('retry-modal');
  rm.classList.remove('hidden'); rm.classList.add('flex');
}

function openSoldierCaughtRetryModal() {
  isPlaying = false; isTimeAttackActive = false; playSfx('wrong');
  document.getElementById('retry-modal-icon').textContent = '🛡️';
  document.getElementById('retry-modal-title').textContent = '이집트 병사에게 3번 잡혔어요!';
  document.getElementById('retry-modal-desc').innerHTML = '바위와 산호초는 점프(🦘)로 뛰어넘고,<br/>물구덩이는 좌우로 피해서 빠르게 달려보세요!';
  const rm = document.getElementById('retry-modal');
  rm.classList.remove('hidden'); rm.classList.add('flex');
}

function retryCurrentStage() {
  const rm = document.getElementById('retry-modal');
  rm.classList.add('hidden'); rm.classList.remove('flex');
  if (currentEpisode === 'exodus') {
    timeRemaining = (currentStage === 1) ? 10.0 : (currentStage === 2 ? 18.0 : 10.0);
  } else {
    timeRemaining = (currentStage === 1) ? 7.5 : 10.0;
  }
  timeAttackFirstRechargeUsed = false;
  isTimeAttackActive = (currentMode === 'timeattack' && !(currentEpisode === 'exodus' && currentStage === 2));
  isPlaying = !(currentEpisode === 'exodus' && currentStage === 2);

  if (currentEpisode === 'exodus') {
    if (currentStage === 1) buildExodusStage1World();
    else if (currentStage === 2) buildExodusStage2World();
    else if (currentStage === 3) buildExodusStage3World();
  } else {
    if (currentStage === 1) buildNoahStage1World();
    else if (currentStage === 2) buildNoahArkInteriorMaze(2);
    else if (currentStage === 3) buildNoahArkInteriorMaze(3);
  }
  startStageBgm(currentStage);
  if (isPlaying) showToast('🔥 다시 도전합니다! 화이팅!');
}

function closeRetryAndOpenClass() {
  const rm = document.getElementById('retry-modal');
  rm.classList.add('hidden'); rm.classList.remove('flex');
  openScreen('screen-map');
}

function updateStageHUD() {
  const badge = document.getElementById('hud-stage-badge');
  const countIcon = document.getElementById('hud-counter-icon');
  const countText = document.getElementById('hud-counter-text');
  const missionText = document.getElementById('hud-mission-text');
  document.getElementById('hud-mission-box').classList.remove('hidden');
  updateCarriedBlocksVisual();

  if (currentEpisode === 'noah') {
    countIcon.textContent = '🐾';
    if (currentStage === 1) {
      badge.textContent = '방주 · 스테이지 1'; countText.textContent = `${rescuedPairs}/7쌍`;
      missionText.textContent = currentMode === 'timeattack' ? '⚡ 동물 7쌍을 찾아 방주 위로 태우세요! (+5초 연장)' : '초원의 동물 7쌍을 모두 찾아 방주 위로 태우세요!';
    } else if (currentStage === 2) {
      badge.textContent = '방주 · 스테이지 2'; countText.textContent = '비둘기 탐색';
      missionText.textContent = '방주 미로를 지나 창문 앞에서 날고 있는 비둘기를 만나세요!';
    } else if (currentStage === 3) {
      badge.textContent = '방주 · 스테이지 3'; countText.textContent = `${rescuedPairs}/7쌍`;
      missionText.textContent = '방주 안 동물 7쌍을 모아 함께 북쪽 출구 문으로 나가세요!';
    } else {
      badge.textContent = '무지개 세상'; countText.textContent = '완주 🌈';
      missionText.textContent = '🌈 새 세상을 걷고 제단이나 [인증서 보기]를 누르세요!';
    }
    speakText(missionText.textContent);
  } else {
    if (currentStage === 1) {
      countIcon.textContent = '🌉';
      const builtCnt = buildZones.filter(b => b.built).length;
      badge.textContent = '홍해 · 스테이지 1'; countText.textContent = `다리 ${builtCnt}/${buildZones.length}`;
      missionText.textContent = '🪵 통나무(최대 2개 소지)를 모아 낭떠러지 다리를 짓고 홍해 바다 앞으로 가세요!';
    } else if (currentStage === 2) {
      countIcon.textContent = '❤️';
      const remainLives = Math.max(0, 3 - soldierHitCount);
      badge.textContent = '홍해 · 스피드런 2'; countText.textContent = `기회 ${remainLives}/3`;
      missionText.textContent = currentMode === 'timeattack'
        ? '⚡ 병사가 추격해요! 진주를 먹으면 가속! 산호초는 점프하고 물구덩이는 피하세요!'
        : '⚡ 애굽 병사가 추격해요! 산호초·바위는 점프하고 물구덩이는 피해 불기둥으로 달리세요!';
    } else if (currentStage === 3) {
      countIcon.textContent = '⛰️';
      badge.textContent = '시내산 · 스테이지 3';
      const maxH = (sinaiCutscene && sinaiCutscene.summitY) ? sinaiCutscene.summitY : 19.2;
      const pct = Math.min(100, Math.max(0, Math.round((playerPos.y / maxH) * 100)));
      countText.textContent = `등반 ${pct}%`;
      missionText.textContent = '⛰️ 경사진 일반 돌을 따라 함정 돌을 밟고 위쪽 줄로 올라가 정상 십계명으로 가세요!';
    } else {
      countIcon.textContent = '🌴';
      badge.textContent = '구원의 언덕'; countText.textContent = '완주 🌊';
      missionText.textContent = '🌴 구름기둥·불기둥 아래 기뻐 뛰는 백성들과 함께 제단으로 가보세요!';
    }
    if (!hasSpokenInitialMission && currentStage === 1) {
      hasSpokenInitialMission = true;
      speakText(missionText.textContent);
    }
  }
}

function snapCameraToPlayer() {
  if (!playerGroup || !camera) return;
  playerGroup.position.copy(playerPos);
  const dist = (currentStage === 1 || currentStage === 4) ? 11.5 : (currentEpisode === 'exodus' ? 11.2 : 8.4);
  const height = (currentStage === 1 || currentStage === 4) ? 8.5 : (currentEpisode === 'exodus' ? 8.0 : 7.0);
  camera.position.set(playerPos.x + Math.sin(cameraYaw) * dist, playerPos.y + height, playerPos.z + Math.cos(cameraYaw) * dist);
  camera.lookAt(playerPos.x, playerPos.y + 1.5, playerPos.z);
}

const raycaster = new THREE.Raycaster();
function updateWallTransparency() {
  fadedMaterials.forEach(m => { m.transparent = false; m.opacity = 1.0; });
  fadedMaterials = [];
  if (wallMeshes.length === 0) return;
  const focusPos = doveCutscene.active ? new THREE.Vector3(doveCutscene.doveX, 2.8, doveCutscene.goalZ) : new THREE.Vector3(playerPos.x, playerPos.y + 1.5, playerPos.z);
  const dir = focusPos.clone().sub(camera.position), dist = dir.length();
  raycaster.set(camera.position, dir.normalize());
  raycaster.intersectObjects(wallMeshes, false).forEach(hit => {
    if (hit.distance < dist - 0.5 && hit.object.material) {
      hit.object.material.transparent = true; hit.object.material.opacity = 0.22;
      fadedMaterials.push(hit.object.material);
    }
  });
}

function openStageClearModal(st) {
  isPlaying = false; isTimeAttackActive = false; playSfx('clear');
  document.getElementById('hud-mission-box').classList.add('hidden');
  const epData = EPISODE_SCRIPTURE[currentEpisode] || EPISODE_SCRIPTURE.noah;
  const info = epData[st];
  document.getElementById('modal-title').textContent = info.title;
  document.getElementById('modal-desc').textContent = info.desc;
  document.getElementById('modal-scripture-text').textContent = info.verse;
  if (currentEpisode !== 'exodus') {
    speakText(info.verse);
  }

  const qBox = document.getElementById('modal-quiz-box'), nextBtn = document.getElementById('modal-next-btn');
  nextBtn.textContent = info.btnText;

  if (currentMode === 'kinder') {
    qBox.classList.add('hidden'); nextBtn.classList.remove('hidden');
  } else {
    qBox.classList.remove('hidden'); nextBtn.classList.add('hidden');
    document.getElementById('modal-quiz-q').textContent = info.quiz.q;
    const optsEl = document.getElementById('modal-quiz-opts'), fbEl = document.getElementById('modal-quiz-feedback');
    fbEl.classList.add('hidden'); optsEl.innerHTML = '';
    info.quiz.opts.forEach((optText, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mc-btn w-full py-2 px-3 rounded-lg bg-amber-100 hover:bg-amber-200 text-slate-900 font-bold text-xs text-left';
      btn.textContent = `${idx + 1}. ${optText}`;
      btn.onclick = () => {
        fbEl.classList.remove('hidden');
        if (idx === info.quiz.ans) {
          playSfx('rescue');
          btn.className = 'mc-btn w-full py-2 px-3 rounded-lg bg-emerald-500 text-white font-bold text-xs text-left';
          fbEl.textContent = '⭕ 정답이에요! 말씀 박사님이네요!';
          fbEl.className = 'text-xs font-bold mt-2 text-emerald-700';
          nextBtn.classList.remove('hidden');
        } else {
          playSfx('wrong');
          fbEl.textContent = '❌ 위 오늘의 말씀을 다시 읽고 골라볼까요?';
          fbEl.className = 'text-xs font-bold mt-2 text-rose-600';
        }
      };
      optsEl.appendChild(btn);
    });
  }
  const modal = document.getElementById('stage-modal');
  modal.classList.remove('hidden'); modal.classList.add('flex');
}

function proceedNextStage() {
  const modal = document.getElementById('stage-modal');
  modal.classList.add('hidden'); modal.classList.remove('flex');

  if (currentStage === 1) {
    stopStageBgm();
    if (currentEpisode === 'exodus' && seaPartingCutscene.leftSeaGroup) {
      isPlaying = false;
      seaPartingCutscene.active = true; seaPartingCutscene.timer = 0; seaPartingCutscene.phase = 1;
      seaPartingCutscene.shoreZ = targetObject ? targetObject.pos.z : -75;
      seaPartingCutscene.shoreY = getBaseGroundHeight(0, seaPartingCutscene.shoreZ);
      playerPos.set(0, seaPartingCutscene.shoreY, seaPartingCutscene.shoreZ);
      playerFacing = Math.PI; playerGroup.position.copy(playerPos); playerGroup.rotation.y = playerFacing;
      if (playerLimbs.rArm) playerLimbs.rArm.rotation.x = -2.4;
      playRainOrSeaSound(5.2, true);
      showToast('🌊 모세가 지팡이를 내밀자 큰 동풍이 불며 홍해 바다가 좌우로 갈라집니다!');
      return;
    }
    const bf = document.getElementById('black-fade');
    document.getElementById('black-fade-icon').textContent = '🌧️';
    document.getElementById('black-fade-title').textContent = '"사십 주야를 비가 땅에 쏟아졌더라..."';
    document.getElementById('black-fade-sub').textContent = '방주 문이 닫히고 세상에 큰 비가 내립니다';
    playRainOrSeaSound(5.6, false);
    bf.style.opacity = '1';

    setTimeout(() => {
      currentStage = 2; isPlaying = true;
      if (currentMode === 'timeattack') { timeRemaining = 10.0; timeAttackFirstRechargeUsed = false; isTimeAttackActive = true; }
      buildNoahArkInteriorMaze(2); startStageBgm(2);
      setTimeout(() => { bf.style.opacity = '0'; }, 250);
    }, 5350);
  } else if (currentStage === 2) {
    currentStage = 3; isPlaying = true;
    if (currentMode === 'timeattack') {
      timeRemaining = 10.0;
      timeAttackFirstRechargeUsed = false;
      isTimeAttackActive = true;
    }
    if (currentEpisode === 'exodus') buildExodusStage3World();
    else buildNoahArkInteriorMaze(3);
    startStageBgm(3);
  } else if (currentStage === 3) {
    const wf = document.getElementById('white-fade');
    wf.style.opacity = '1'; playSfx('dove');
    setTimeout(() => {
      isPlaying = true; isTimeAttackActive = false;
      document.getElementById('hud-timer-box').classList.add('hidden');
      buildEndingWorld();
      setTimeout(() => { wf.style.opacity = '0'; }, 350);
    }, 700);
  }
}

function triggerContextAction() {
  if (!targetObject || targetObject.triggered) return;
  if (currentEpisode === 'exodus' && currentStage === 1 && buildZones.some(b => !b.built)) {
    playSfx('wrong');
    showToast('🌉 먼저 광야의 낭떠러지 다리를 모두 완성해 주세요!');
    return;
  }
  if (currentEpisode === 'noah' && currentStage === 3 && rescuedPairs < 7) {
    playSfx('wrong');
    showToast(`🐾 먼저 방주 안의 동물 7쌍을 모두 찾아주세요! (${rescuedPairs}/7쌍)`);
    return;
  }
  targetObject.triggered = true; playSfx('dove');

  if (currentEpisode === 'noah' && currentStage === 2) {
    isTimeAttackActive = false;
    document.getElementById('context-action-btn').classList.add('hidden');
    document.getElementById('hud-mission-box').classList.add('hidden');
    if (targetObject.label) targetObject.label.style.opacity = '0';
    if (targetObject.spotRing) targetObject.spotRing.visible = false;
    playerFacing = Math.PI; playerGroup.rotation.y = playerFacing;
    doveCutscene = { active: true, timer: 0, phase: 1, doveX: targetObject.baseX, goalZ: targetObject.baseZ, winZ: -targetObject.halfD + 0.85 };
    showToast('🪟 방주 창문이 열리고 비둘기가 바깥 세상으로 날아갑니다!');
  } else if (currentEpisode === 'exodus' && currentStage === 2) {
    isPlaying = false;
    isTimeAttackActive = false;
    document.getElementById('context-action-btn').classList.add('hidden');
    document.getElementById('hud-mission-box').classList.add('hidden');
    if (targetObject.label) targetObject.label.style.opacity = '0';
    pillarCutscene.active = true;
    pillarCutscene.timer = 0;
    pillarCutscene.phase = 1;
    pillarCutscene.pillarGroup = targetObject.mesh;
    pillarCutscene.goalZ = targetObject.pos.z;
    if (pillarCutscene.leftClosingWall && pillarCutscene.rightClosingWall) {
      pillarCutscene.leftClosingWall.visible = true;
      pillarCutscene.rightClosingWall.visible = true;
    }
    playRainOrSeaSound(3.6, true);
    showToast('🌊 홍해 바닷물이 양쪽 벽의 높이로 다시 덮이며 애굽 군대를 막습니다!');
  } else if (currentEpisode === 'exodus' && currentStage === 3) {
    isPlaying = false;
    isTimeAttackActive = false;
    document.getElementById('context-action-btn').classList.add('hidden');
    document.getElementById('hud-mission-box').classList.add('hidden');
    if (targetObject.label) targetObject.label.style.opacity = '0';

    sinaiCutscene.active = true;
    sinaiCutscene.timer = 0;
    sinaiCutscene.phase = 1;
    playerPos.set(0, sinaiCutscene.summitY, sinaiCutscene.summitZ + 1.8);
    playerFacing = Math.PI;
    playerGroup.position.copy(playerPos);
    playerGroup.rotation.y = playerFacing;
    if (playerLimbs.lArm) playerLimbs.lArm.rotation.x = -2.4;
    if (playerLimbs.rArm) playerLimbs.rArm.rotation.x = -2.4;

    if (sinaiCutscene.beamMesh) sinaiCutscene.beamMesh.visible = true;
    if (sinaiCutscene.innerBeamMesh) sinaiCutscene.innerBeamMesh.visible = true;

    const wf = document.getElementById('white-fade');
    wf.style.opacity = '0.85';
    setTimeout(() => {
      scene.background = new THREE.Color(0x38bdf8);
      scene.fog = new THREE.Fog(0xe0f2fe, 55, 220);
      sinaiHazardZones.forEach(hz => { hz.warnRing.visible = false; hz.boltMesh.visible = false; hz.rockFallGroup.visible = false; });
      wf.style.opacity = '0';
    }, 420);

    playSfx('clear');
    showToast('✨ 찬란한 영광의 빛 가운데서 모세가 하나님께 십계명 두 돌판을 받습니다!');
  } else if (currentStage === 3) {
    const wf = document.getElementById('white-fade');
    wf.style.opacity = '0.92';
    setTimeout(() => { wf.style.opacity = '0'; openStageClearModal(3); }, 520);
  } else {
    openStageClearModal(currentStage);
  }
}

function showEndingCertificate() {
  playSfx('clear');
  document.getElementById('cert-name-display').textContent = explorerName || '믿음의용사';
  document.getElementById('cert-dept').textContent = MODE_META[currentMode].dept;
  const isExodus = (currentEpisode === 'exodus');
  document.getElementById('ending-ep-badge').textContent = isExodus ? '🌊 에피소드 2 : 출애굽과 시내산 십계명 완주!' : '🌈 에피소드 1 : 노아의 방주 완주!';
  document.getElementById('ending-main-title').textContent = isExodus ? '홍해를 건너 시내산 언약의 백성으로!' : '무지개 언약의 새 세상!';
  document.getElementById('ending-main-verse').textContent = isExodus ? '"너희가 내 말을 잘 듣고 내 언약을 지키면 너희는 모든 민족 중에서 내 소유가 되겠고" (출애굽기 19:5)' : '"내가 내 무지개를 구름 속에 두었나니 이것이 나와 세상 사이의 언약의 증거니라" (창세기 9:13)';
  document.getElementById('cert-mission-display').textContent = isExodus ? '홍해 도하 및 시내산 십계명 수직 등반 완주' : '노아의 방주 3단계 탐험 완주';

  if (!document.getElementById('cert-code').dataset.generated) {
    document.getElementById('cert-code').textContent = (isExodus ? 'EXO-' : 'ARK-') + Math.floor(100 + Math.random() * 900);
    document.getElementById('cert-code').dataset.generated = '1';
  }
  const em = document.getElementById('ending-modal');
  em.classList.remove('hidden'); em.classList.add('flex');
}

function closeEndingToLookAround() {
  const em = document.getElementById('ending-modal');
  em.classList.add('hidden'); em.classList.remove('flex');
  showToast('🌈 엔딩 세상을 자유롭게 걸어보세요!');
}

let joyX = 0, joyY = 0, keys = {};
function setupControls() {
  const zone = document.getElementById('joystick-zone'), knob = document.getElementById('joystick-knob');
  let joyPointerId = null, cx = 0, cy = 0, camPointerId = null, lastCamX = 0;

  function handleJoyMove(clientX, clientY) {
    let dx = clientX - cx, dy = clientY - cy;
    const dist = Math.hypot(dx, dy), maxR = 33;
    if (dist > maxR) { dx = (dx / dist) * maxR; dy = (dy / dist) * maxR; }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    joyX = dx / maxR; joyY = dy / maxR;
  }

  zone.addEventListener('pointerdown', e => {
    e.preventDefault(); e.stopPropagation();
    joyPointerId = e.pointerId;
    const r = zone.getBoundingClientRect();
    cx = r.left + r.width / 2; cy = r.top + r.height / 2;
    handleJoyMove(e.clientX, e.clientY);
  });

  document.getElementById('canvas-container').addEventListener('pointerdown', e => {
    if (!isPlaying || doveCutscene.active || pillarCutscene.active || seaPartingCutscene.active || sinaiCutscene.active) return;
    camPointerId = e.pointerId; lastCamX = e.clientX;
  });

  window.addEventListener('pointermove', e => {
    if (e.pointerId === joyPointerId) handleJoyMove(e.clientX, e.clientY);
    else if (e.pointerId === camPointerId && isPlaying && !doveCutscene.active && !pillarCutscene.active && !seaPartingCutscene.active && !sinaiCutscene.active) {
      const dx = e.clientX - lastCamX; lastCamX = e.clientX;
      cameraTargetYaw -= dx * 0.0075;
    }
  });

  function endPointer(e) {
    if (e.pointerId === joyPointerId) { joyPointerId = null; joyX = 0; joyY = 0; knob.style.transform = 'translate(0,0)'; }
    if (e.pointerId === camPointerId) camPointerId = null;
  }
  window.addEventListener('pointerup', endPointer);
  window.addEventListener('pointercancel', endPointer);
  window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'Space') { e.preventDefault(); playerJump(); }
    if (e.code === 'KeyQ') rotateCameraDeg(-15);
    if (e.code === 'KeyE') rotateCameraDeg(15);
  });
  window.addEventListener('keyup', e => { keys[e.code] = false; });
}

function playerJump() {
  if (!isPlaying || stage2CountdownActive || doveCutscene.active || pillarCutscene.active || seaPartingCutscene.active || sinaiCutscene.active) return;
  if (isGrounded || playerPos.y <= getSupportHeight(playerPos.x, playerPos.z, playerPos.y) + 0.18) {
    playerVelY = (currentEpisode === 'exodus' && currentStage === 3) ? 10.6 : 11.5;
    isGrounded = false; playSfx('jump');
  }
}

function canMoveTo(nx, nz, curY, isPlayer = false) {
  if (currentMapRectBounds !== null) {
    if (nx < currentMapRectBounds.minX || nx > currentMapRectBounds.maxX || nz < currentMapRectBounds.minZ || nz > currentMapRectBounds.maxZ) return false;
  } else if (currentMapBounds !== null) {
    if (Math.abs(nx) > currentMapBounds || Math.abs(nz) > currentMapBounds) return false;
  }
  const stepAllowance = (isPlayer && (!isGrounded || playerVelY > 0)) ? 1.25 : 0.65;
  for (const p of platforms) {
    if (nx > p.minX && nx < p.maxX && nz > p.minZ && nz < p.maxZ) {
      if (curY + stepAllowance < p.topY) return false;
      // [스테이지 3 요청사항 4] 아래 줄의 낮은 일반 돌에서는 위쪽 줄의 일반 돌로 높이 차이 때문에 올라갈 수 없으며, 함정 돌(높은 발판) 높이에 도달해야만 올라갈 수 있음
      if (isPlayer && p.minClimbY !== undefined && curY < p.minClimbY) {
        return false;
      }
      if (isPlayer && p.blockFrontAscent && curY < p.topY - 0.35 && playerPos.z >= p.maxZ - 0.4) {
        return false;
      }
    }
  }
  for (const c of colliders) {
    if (nx > c.minX && nx < c.maxX && nz > c.minZ && nz < c.maxZ) return false;
  }
  return true;
}

function getSupportHeight(x, z, curY) {
  let h = getBaseGroundHeight(x, z);
  for (const p of platforms) {
    if (x > p.minX - 0.25 && x < p.maxX + 0.25 && z > p.minZ - 0.25 && z < p.maxZ + 0.25 && curY + 0.75 >= p.topY && p.topY > h) {
      if (p.minClimbY !== undefined && playerPos.y < p.minClimbY) continue;
      if (p.blockFrontAscent && playerPos.y < p.topY - 0.35 && playerPos.z >= p.maxZ - 0.35) continue;
      h = p.topY;
    }
  }
  return h;
}

function updateWorldLabelPos(lbl, worldVec, visible = true) {
  if (!lbl) return;
  if (!visible) { lbl.style.opacity = '0'; return; }
  const v = worldVec.clone(); v.y += 1.65; v.project(camera);
  if (v.z > 1) { lbl.style.opacity = '0'; return; }
  lbl.style.left = `${(v.x * 0.5 + 0.5) * window.innerWidth}px`;
  lbl.style.top = `${(-v.y * 0.5 + 0.5) * window.innerHeight}px`;
  lbl.style.opacity = '1';
}

function initEngine() {
  const container = document.getElementById('canvas-container');
  scene = new THREE.Scene(); scene.background = new THREE.Color(0x7dd3fc);
  camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 750);
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.62));
  const dirLight = new THREE.DirectionalLight(0xfffbeb, 0.72);
  dirLight.position.set(25, 45, 25); dirLight.castShadow = true;
  scene.add(dirLight);

  rebuildPlayerAppearance();
  if (typeof buildNoahStage1World === 'function') buildNoahStage1World();
  setupControls();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  let lastTime = performance.now();
  function animate(now) {
    requestAnimationFrame(animate);
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    updateBlazingPillars(dt, now);

    if (!isPlaying && !stage2CountdownActive && document.getElementById('hud-top').classList.contains('hidden')) {
      const ang = now * 0.0003;
      camera.position.set(Math.sin(ang) * 28, 14, Math.cos(ang) * 28);
      camera.lookAt(0, 3, -10);
      renderer.render(scene, camera);
      return;
    }

    if (isPlaying && isTimeAttackActive && !doveCutscene.active && !pillarCutscene.active && !seaPartingCutscene.active && !sinaiCutscene.active) {
      timeRemaining -= dt;
      if (timeRemaining <= 0) {
        if (!timeAttackFirstRechargeUsed) {
          timeAttackFirstRechargeUsed = true; timeRemaining = 7.0;
          playSfx('wrong'); showToast('⏰ 최초 시간 초과! 보너스 +7초가 충전되었어요!');
        } else {
          timeRemaining = 0;
          document.getElementById('hud-timer-val').textContent = '0.0초';
          openTimeAttackRetryModal();
          renderer.render(scene, camera);
          return;
        }
      }
      document.getElementById('hud-timer-val').textContent = `${timeRemaining.toFixed(1)}초`;
    }

    torchFlames.forEach((f, idx) => { const s = 0.85 + Math.sin(now * 0.012 + idx) * 0.2; f.scale.set(s, s, s); });

    if (endingDovePivot) {
      endingDovePivot.rotation.y += dt * 1.35;
      endingDovePivot.position.y = 5.5 + Math.sin(now * 0.004) * 0.4;
      const dv = endingDovePivot.userData.dove;
      if (dv && dv.userData.lWing) {
        const flap = Math.sin(now * 0.018) * 0.45;
        dv.userData.lWing.rotation.z = flap; dv.userData.rWing.rotation.z = -flap;
      }
    }

    if (endingAnimalPairs.length > 0) {
      endingAnimalPairs.forEach(item => {
        item.group.position.y = Math.abs(Math.sin(now * 0.0065 + item.phase)) * 0.48;
        if (item.group.userData && item.group.userData.a1 && item.group.userData.a2) {
          item.group.userData.a1.position.y = Math.abs(Math.sin(now * 0.009 + item.phase)) * 0.18;
          item.group.userData.a2.position.y = Math.abs(Math.cos(now * 0.009 + item.phase)) * 0.18;
        }
      });
    }

    if (endingCelebrationPeople.length > 0) {
      endingCelebrationPeople.forEach(p => {
        const jumpVal = Math.abs(Math.sin(now * 0.0085 + p.phase));
        p.mesh.position.y = jumpVal * 0.85;
        if (p.mesh.userData && p.mesh.userData.lArm && p.mesh.userData.rArm) {
          p.mesh.userData.lArm.rotation.x = -2.4 + Math.sin(now * 0.015 + p.phase) * 0.4;
          p.mesh.userData.rArm.rotation.x = -2.4 - Math.sin(now * 0.015 + p.phase) * 0.4;
        }
      });
    }

    if (currentEpisode === 'noah' && typeof updateNoahCutsceneFrame === 'function' && updateNoahCutsceneFrame(dt, now)) {
      renderer.render(scene, camera); return;
    }
    if (currentEpisode === 'exodus' && typeof updateExodusCutsceneFrame === 'function' && updateExodusCutsceneFrame(dt, now)) {
      renderer.render(scene, camera); return;
    }

    if (isPlaying) {
      cameraYaw = lerpAngle(cameraYaw, cameraTargetYaw, dt * 10);
      if (keys['Space'] && isGrounded) playerJump();
      playerVelY -= 24 * dt;
      playerPos.y += playerVelY * dt;
      const floorY = getSupportHeight(playerPos.x, playerPos.z, playerPos.y);
      if (playerPos.y <= floorY) { playerPos.y = floorY; playerVelY = 0; isGrounded = true; }

      let rawX = joyX, rawZ = joyY;
      if (keys['ArrowLeft'] || keys['KeyA']) rawX = -1;
      if (keys['ArrowRight'] || keys['KeyD']) rawX = 1;
      if (keys['ArrowUp'] || keys['KeyW']) rawZ = -1;
      if (keys['ArrowDown'] || keys['KeyS']) rawZ = 1;

      if (playerSpeedBoostTimer > 0) playerSpeedBoostTimer -= dt;

      let baseSpeed = (currentEpisode === 'exodus' && currentStage === 2) ? 9.8 : 8.6;
      if (currentEpisode === 'exodus' && currentStage === 2) {
        if (playerSpeedBoostTimer > 0) {
          baseSpeed = 14.8;
        } else if (isGrounded) {
          for (const pud of stage2Puddles) {
            if (Math.abs(playerPos.x - pud.x) < pud.rx && Math.abs(playerPos.z - pud.z) < pud.rz) { baseSpeed = 4.6; break; }
          }
        }
      }

      const inputMag = Math.min(1, Math.hypot(rawX, rawZ));
      if (inputMag > 0.08) {
        const len = Math.hypot(rawX, rawZ), nxInput = rawX / len, nzInput = rawZ / len;
        const cosY = Math.cos(cameraYaw), sinY = Math.sin(cameraYaw);
        const worldDirX = nxInput * cosY + nzInput * sinY, worldDirZ = -nxInput * sinY + nzInput * cosY;
        currentMoveSpeed = baseSpeed * inputMag;
        const vx = worldDirX * currentMoveSpeed * dt, vz = worldDirZ * currentMoveSpeed * dt;
        if (canMoveTo(playerPos.x + vx, playerPos.z, playerPos.y, true)) playerPos.x += vx;
        if (canMoveTo(playerPos.x, playerPos.z + vz, playerPos.y, true)) playerPos.z += vz;
        playerFacing = lerpAngle(playerFacing, Math.atan2(worldDirX, worldDirZ), dt * 14);
        walkCycle += dt * (currentMoveSpeed * 1.45);
        playerLimbs.lLeg.rotation.x = Math.sin(walkCycle) * 0.65; playerLimbs.rLeg.rotation.x = -Math.sin(walkCycle) * 0.65;
        playerLimbs.lArm.rotation.x = -Math.sin(walkCycle) * 0.58; playerLimbs.rArm.rotation.x = Math.sin(walkCycle) * 0.58;
      } else {
        currentMoveSpeed = 0;
        playerLimbs.lLeg.rotation.x = 0; playerLimbs.rLeg.rotation.x = 0;
        playerLimbs.lArm.rotation.x = 0; playerLimbs.rArm.rotation.x = 0;
      }

      playerGroup.position.copy(playerPos); playerGroup.rotation.y = playerFacing;

      const camDist = (currentStage === 1 || currentStage === 4) ? 11.5 : (currentEpisode === 'exodus' ? 11.2 : 8.4);
      const camH = (currentStage === 1 || currentStage === 4) ? 8.5 : (currentEpisode === 'exodus' ? 8.0 : 7.0);
      camera.position.lerp(new THREE.Vector3(playerPos.x + Math.sin(cameraYaw) * camDist, playerPos.y + camH, playerPos.z + Math.cos(cameraYaw) * camDist), 0.18);
      camera.lookAt(playerPos.x, playerPos.y + 1.5, playerPos.z);
      updateWallTransparency();

      if (currentEpisode === 'noah' && typeof updateNoahStageFrame === 'function') updateNoahStageFrame(dt, now);
      else if (currentEpisode === 'exodus' && typeof updateExodusStageFrame === 'function') updateExodusStageFrame(dt, now);

      if (currentStage === 4 && targetObject) {
        const td = Math.hypot(playerPos.x - targetObject.pos.x, playerPos.z - targetObject.pos.z);
        updateWorldLabelPos(targetObject.label, targetObject.pos, td < 26);
        if (guideArrowGroup.visible) {
          guideArrowGroup.rotation.y = Math.atan2(targetObject.pos.x - playerPos.x, targetObject.pos.z - playerPos.z) - playerFacing;
        }
        if (td < 4.2 && !certAutoShown) { certAutoShown = true; showEndingCertificate(); }
      }
    }

    renderer.render(scene, camera);
  }
  requestAnimationFrame(animate);
}

// =========================================================================
// [5. 구글 스프레드시트 기록 연동 & 관리자 스테이지 바로가기 모듈]
// =========================================================================
const GOOGLE_SHEET_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbzDNecO6FM2ZXkdGwhp_XSR3wJ3fX17a029betjsm8sMOWgqeHWsB2rRMtROmB1NUQ-/exec';

function getAndIncrementPlayCount(playerName) {
  const key = 'bible_game_plays_' + (playerName || 'guest');
  const cnt = parseInt(localStorage.getItem(key) || '0', 10) + 1;
  localStorage.setItem(key, String(cnt));
  return cnt;
}

function getCurrentPlayCount(playerName) {
  const key = 'bible_game_plays_' + (playerName || 'guest');
  return parseInt(localStorage.getItem(key) || '1', 10);
}

function sendGameLogToSheet(status, stageNum, certCode = '-') {
  if (!GOOGLE_SHEET_WEBAPP_URL || GOOGLE_SHEET_WEBAPP_URL.includes('여기에_')) return;
  const payload = {
    name: explorerName || '믿음의용사',
    mode: currentMode || 'junior',
    episode: currentEpisode || 'noah',
    stage: stageNum || currentStage,
    status: status,
    playCount: getCurrentPlayCount(explorerName),
    certCode: certCode
  };
  fetch(GOOGLE_SHEET_WEBAPP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  }).catch(() => {});
}

// 1) 게임 시작 시 플레이 횟수 증가 및 '게임시작' 기록
const _origStartVoxelGame = startVoxelGame;
startVoxelGame = function (mode) {
  _origStartVoxelGame(mode);
  getAndIncrementPlayCount(explorerName);
  sendGameLogToSheet('▶ 게임시작', 1, '-');
};

// 2) 재도전 시 플레이 횟수 증가 및 '재도전' 기록
const _origRetryCurrentStage = retryCurrentStage;
retryCurrentStage = function () {
  _origRetryCurrentStage();
  getAndIncrementPlayCount(explorerName);
  sendGameLogToSheet('🔄 재도전', currentStage, '-');
};

// 3) 각 스테이지 클리어 시 기록
const _origOpenStageClearModal = openStageClearModal;
openStageClearModal = function (st) {
  _origOpenStageClearModal(st);
  sendGameLogToSheet(`🎉 스테이지${st} 클리어`, st, '-');
};

// 4) 최종 엔딩 인증서 발급(완주 성공) 시 기록
const _origShowEndingCertificate = showEndingCertificate;
showEndingCertificate = function () {
  const alreadyLogged = document.getElementById('cert-code').dataset.generated;
  _origShowEndingCertificate();
  if (!alreadyLogged) {
    const code = document.getElementById('cert-code').textContent || '-';
    sendGameLogToSheet('🏆 완주성공', 4, code);
  }
};

// 5) 엔진 초기화 및 관리자 페이지 URL 파라미터(ep, mode, stage, name) 즉시 진입 처리
window.addEventListener('DOMContentLoaded', () => {
  initEngine();
  const params = new URLSearchParams(window.location.search);
  const ep = params.get('ep');
  const mode = params.get('mode');
  const stage = parseInt(params.get('stage') || '0', 10);

  if (ep && mode && stage >= 1) {
    explorerName = params.get('name') || '관리자';
    currentEpisode = ep;
    currentMode = mode;
    openScreen(null);
    startVoxelGame(mode);

    if (stage === 2) {
      currentStage = 2;
      if (ep === 'exodus' && typeof buildExodusStage2World === 'function') buildExodusStage2World();
      else if (typeof buildNoahArkInteriorMaze === 'function') buildNoahArkInteriorMaze(2);
      startStageBgm(2);
    } else if (stage === 3) {
      currentStage = 3;
      if (ep === 'exodus' && typeof buildExodusStage3World === 'function') buildExodusStage3World();
      else if (typeof buildNoahArkInteriorMaze === 'function') buildNoahArkInteriorMaze(3);
      startStageBgm(3);
    } else if (stage === 4) {
      buildEndingWorld();
    }
  }
});