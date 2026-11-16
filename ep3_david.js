// =========================================================================
// [ep3_david.js - 파트 1/4] 에피소드 3 : 다윗 이야기
// - 공통: 6/8박자 스윙 하프 BGM (골리앗 격파 후 퀴즈까지 평온한 음악 유지), 양 울음소리, 애니멀리즈 효과음
// - UI: 16비트 도트 픽셀아트 스타일 물맷돌 집중 조준 캔버스 렌더러 & 양 배부름 상태(😢~😊)
// - 스테이지 1 월드: 강 건너 하늘이 보이는 작은 나무 숲 원경, 언덕 위 목장 & 언덕 아래 다윗의 집
// =========================================================================

const DAVID_SCRIPTURE = {
  1: {
    title: '스테이지 1 클리어! 양 떼를 지키고 기름부음을 받았어요!',
    desc: '언덕 위 목장에서 양을 찾아 먹이고 튼튼한 돌담까지 쌓아 맹수를 막아낸 뒤, 언덕 아래 집으로 내려가 사무엘 선지자에게 기름부음을 받았어요!',
    verse: '"사무엘이 기름 뿔병을 가져다가 그의 형제 중에서 그에게 부었더니 이 날 이후로 다윗이 여호와의 영에게 크게 감동되니라" (사무엘상 16장 13절)',
    btnText: '⛰️ 엘라 골짜기로 출발하기 (스테이지 2) ▶',
    quiz: { q: '퀴즈! 양을 성실히 돌보고 돌아온 다윗에게 사무엘 선지자가 부은 것은 무엇인가요?', opts: ['기름 뿔병의 기름', '시냇가의 맑은 물', '포도주 한 항아리'], ans: 0 }
  },
  2: {
    title: '스테이지 2 클리어! 만군의 여호와의 이름으로 승리했어요!',
    desc: '시냇가에서 물맷돌을 고르고 골리앗 투구 위의 우상 장식을 무너뜨려 믿음으로 승리했어요!',
    verse: '"너는 칼과 창과 단창으로 내게 나아오거니와 나는 만군의 여호와의 이름 곧 네가 모욕하는 이스라엘 군대의 하나님의 이름으로 네게 나아가노라" (사무엘상 17장 45절)',
    btnText: '🏰 다윗성으로 나아가기 (스테이지 3) ▶',
    quiz: { q: '퀴즈! 다윗은 골리앗 앞에 나아갈 때 누구의 이름으로 나아간다고 선포했나요?', opts: ['만군의 여호와의 이름', '사울 왕의 이름', '자신의 힘과 무기'], ans: 0 }
  },
  3: {
    title: '스테이지 3 클리어! 백성을 섬기는 왕에게 영원한 언약을 주셨어요!',
    desc: '다윗성 백성들의 어려움을 돌보고 나단 선지자를 통해 하나님의 영원한 언약을 들었어요!',
    verse: '"네 집과 네 나라가 내 앞에서 영원히 보전되고 네 왕위가 영원히 견고하리라 하셨다 하라" (사무엘하 7장 16절)',
    btnText: '👑 다윗왕의 왕좌 엔딩으로 나가기! ▶',
    quiz: { q: '퀴즈! 하나님께서 선지자를 통해 다윗에게 무엇이 영원히 견고하리라고 약속하셨나요?', opts: ['다윗의 집과 나라와 왕위', '높은 바벨탑', '애굽의 화려한 병거'], ans: 0 }
  }
};

// 에피소드 3 전용 정적 재질 캐시
const davidStaticMatCache = {};
function matDavidCached(baseHex, noiseHex) {
  const key = noiseHex ? `${baseHex}_${noiseHex}` : baseHex;
  if (!davidStaticMatCache[key]) {
    davidStaticMatCache[key] = matVoxel(baseHex, noiseHex);
  }
  return davidStaticMatCache[key];
}

// -------------------------------------------------------------------------
// 1. [공통 사운드] 6/8박자 스윙·스트럼 하프 BGM, 양 울음소리(매에~), 애니멀리즈 사운드
// -------------------------------------------------------------------------
const DAVID_HARP_MELODY   = [0, 4, 7, 12, 11, 9, 7, 4, 5, 9, 12, 16, 14, 12, 9, 7, 4, 7, 11, 14, 12, 9, 7, 4];
const DAVID_HARP_CHORD1   = [4, 7, 12, 16, 14, 12, 11, 7, 9, 12, 16, 19, 17, 16, 12, 11, 7, 11, 14, 17, 16, 12, 11, 7];
const DAVID_HARP_CHORD2   = [7, 12, 16, 19, 19, 16, 14, 12, 12, 16, 19, 24, 21, 19, 16, 14, 11, 14, 19, 21, 19, 16, 14, 12];
const DAVID_HARP_BASS     = [-12, -12, -12, -5, -5, -5, -3, -3, -7, -7, -7, -2, -5, -5, -5, -12, -8, -8, -5, -5, -12, -7, -5, -12];
const DAVID_HARP_RHYTHM   = [
  1.45, 0.52, 0.95,  1.35, 0.55, 0.95,
  1.50, 0.48, 0.48, 0.52,  1.35, 0.55,
  1.45, 0.52, 0.95,  1.30, 0.45, 0.45,
  1.40, 0.55, 0.95,  1.65, 0.55, 1.10
];

const DAVID_TENSION_MELODY = [0, 0, 7, 8,  7, 5, 3, 2,  0, 0, 3, 6,  7, 8, 7, 3];
const DAVID_TENSION_BASS   = [-12, -12, -5, -4, -5, -7, -9, -10, -12, -12, -9, -6, -5, -4, -5, -12];
const DAVID_TENSION_RHYTHM = [
  0.55, 0.55, 1.25, 0.65,
  0.55, 0.55, 1.15, 0.75,
  0.50, 0.50, 1.30, 0.70,
  0.55, 0.55, 1.40, 0.50
];

// [스테이지 2 요청사항 3] 골리앗이 무너지면(davidIdolHits >= davidReqIdolHits) 컷신과 퀴즈 풀 때까지 평온한 음악 유지!
function isDavidTensionActive() {
  if (currentEpisode !== 'david') return false;
  if (currentStage === 1 && davidStage1Phase === 'defend_sheep') return true;
  if (
    currentStage === 2 &&
    !davidStage2Cutscene.active &&
    (typeof davidIdolHits === 'undefined' || davidIdolHits < davidReqIdolHits)
  ) {
    return true;
  }
  return false;
}

function playHarpPluckNote(ctx, freq, startTime, dur, vol, isTension = false) {
  if (!ctx || startTime < ctx.currentTime - 0.05) return;
  const t0 = Math.max(ctx.currentTime, startTime);
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  osc1.type = isTension ? 'triangle' : 'sine';
  osc2.type = isTension ? 'sawtooth' : 'triangle';
  osc1.frequency.setValueAtTime(freq, t0);
  osc2.frequency.setValueAtTime(freq * (isTension ? 1.004 : 2.0), t0);

  gain.gain.setValueAtTime(0.001, t0);
  gain.gain.linearRampToValueAtTime(vol, t0 + 0.016);
  gain.gain.exponentialRampToValueAtTime(vol * 0.26, t0 + dur * 0.34);
  gain.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);

  const subGain = ctx.createGain();
  subGain.gain.setValueAtTime(isTension ? 0.34 : 0.22, t0);

  osc1.connect(gain);
  osc2.connect(subGain);
  subGain.connect(gain);
  gain.connect(ctx.destination);

  osc1.start(t0); osc1.stop(t0 + dur + 0.02);
  osc2.start(t0); osc2.stop(t0 + dur + 0.02);
}

function scheduleDavidBgmBeat(ctx, step, st, mode, playing, timeRem, toFreq) {
  if (isDavidTensionActive()) {
    const idx = step % DAVID_TENSION_MELODY.length;
    const rhythmMult = DAVID_TENSION_RHYTHM[idx] || 1.0;
    let stepMs = Math.round((st === 2 ? 220 : 235) * rhythmMult);
    if (mode === 'timeattack' && playing && st <= 3) {
      stepMs = (timeRem < 4.0) ? Math.round(stepMs * 0.62) : Math.round(stepMs * 0.82);
    }
    if (!ctx) return stepMs;

    const now = ctx.currentTime;
    const dur = (stepMs / 1000) * 1.15;
    const rootMidi = (st === 2) ? 50 : 52;
    const leadFreq = toFreq(rootMidi + DAVID_TENSION_MELODY[idx]);
    const bassFreq = toFreq(rootMidi + DAVID_TENSION_BASS[idx]);

    playHarpPluckNote(ctx, leadFreq, now, dur, 0.045, true);
    if (idx % 4 === 2) {
      playHarpPluckNote(ctx, leadFreq * 1.5, now + 0.035, dur * 0.85, 0.032, true);
    }

    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bassOsc.type = (idx % 4 === 2) ? 'sawtooth' : 'triangle';
    bassOsc.frequency.setValueAtTime(bassFreq, now);
    bassGain.gain.setValueAtTime(0.001, now);
    bassGain.gain.linearRampToValueAtTime(idx % 4 === 2 ? 0.055 : 0.038, now + 0.015);
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + dur * 0.85);
    bassOsc.connect(bassGain);
    bassGain.connect(ctx.destination);
    bassOsc.start(now); bassOsc.stop(now + dur);
    return stepMs;
  }

  const idx = step % DAVID_HARP_MELODY.length;
  const rhythmMult = DAVID_HARP_RHYTHM[idx] || 1.0;
  const baseTempo = st === 3 ? 290 : (st === 4 ? 305 : 315);
  let stepMs = Math.round(baseTempo * rhythmMult);
  if (mode === 'timeattack' && playing && st <= 3) {
    stepMs = (timeRem < 4.0) ? Math.round(stepMs * 0.62) : Math.round(stepMs * 0.82);
  }
  if (!ctx) return stepMs;

  const now = ctx.currentTime;
  const dur = (stepMs / 1000) * 1.55;
  const rootMidi = st === 3 ? 62 : (st === 4 ? 65 : 60);
  const leadFreq = toFreq(rootMidi + DAVID_HARP_MELODY[idx]);
  const ch1Freq  = toFreq(rootMidi + DAVID_HARP_CHORD1[idx]);
  const ch2Freq  = toFreq(rootMidi + DAVID_HARP_CHORD2[idx]);
  const bassFreq = toFreq(rootMidi + DAVID_HARP_BASS[idx]);

  if (rhythmMult >= 1.25) {
    playHarpPluckNote(ctx, bassFreq, now, dur * 1.35, 0.038, false);
    playHarpPluckNote(ctx, leadFreq, now + 0.035, dur, 0.046, false);
    playHarpPluckNote(ctx, ch1Freq,  now + 0.075, dur * 0.9, 0.030, false);
    playHarpPluckNote(ctx, ch2Freq,  now + 0.115, dur * 0.8, 0.024, false);
  } else {
    playHarpPluckNote(ctx, leadFreq, now, dur, 0.040, false);
    if (idx % 2 === 1) {
      playHarpPluckNote(ctx, ch1Freq, now + 0.04, dur * 0.75, 0.024, false);
    }
  }
  return stepMs;
}

// 귀여운 양 울음소리("매에~") 합성기
function playSheepBaaSound(pitchScale = 1.0, vol = 0.09) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const dur = 0.44;

  const osc = ctx.createOscillator();
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  const baseFreq = 410 * pitchScale;
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(baseFreq * 0.92, now);
  osc.frequency.linearRampToValueAtTime(baseFreq * 1.06, now + 0.09);
  osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.84, now + dur);

  lfo.type = 'sine';
  lfo.frequency.setValueAtTime(22, now);
  lfoGain.gain.setValueAtTime(16 * pitchScale, now);
  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);

  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1180 * pitchScale, now);
  filter.Q.setValueAtTime(1.8, now);

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(vol, now + 0.04);
  gain.gain.setValueAtTime(vol * 0.85, now + 0.24);
  gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  lfo.start(now);
  osc.stop(now + dur + 0.02);
  lfo.stop(now + dur + 0.02);
}

let animaleseTimer = null;
function playAnimaleseSpeech(text, voicePitch = 1.0, onCharStep = null) {
  if (animaleseTimer) { clearInterval(animaleseTimer); animaleseTimer = null; }
  const clean = (text || '').replace(/[^\uAC00-\uD7A3a-zA-Z0-9]/g, '');
  let idx = 0;
  const maxSteps = Math.min(clean.length, 28);

  animaleseTimer = setInterval(() => {
    if (idx >= maxSteps) {
      clearInterval(animaleseTimer);
      animaleseTimer = null;
      return;
    }
    const ctx = getAudioCtx();
    if (ctx) {
      const now = ctx.currentTime;
      const charCode = clean.charCodeAt(idx) || 44032;
      const baseFreq = (340 + (charCode % 13) * 26) * voicePitch;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.18, now + 0.045);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(baseFreq * 2.2, now);
      filter.Q.setValueAtTime(2.4, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.075, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.058);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.062);
    }
    if (onCharStep) onCharStep(idx);
    idx++;
  }, 68);
}

// -------------------------------------------------------------------------
// 2. 에피소드 3 전용 전역 상태 변수, 지형 고도 함수 및 픽셀아트 조준 UI
// -------------------------------------------------------------------------
const DAVID_WALL_REQ_PER_TIER = 7;
const DAVID_CAMP_HALF_W = 7.4;
const DAVID_CAMP_HALF_D = 5.6;
const DAVID_HILL_TOP_Y = 11.0;       // 언덕 위 목장 높이 (11m)
const DAVID_HILL_SLOPE_SOUTH_Z = -8; // 언덕 내리막 시작 Z
const DAVID_HILL_SLOPE_NORTH_Z = -34;// 언덕 내리막 끝(평지 마을 시작) Z

let davidStage1Phase = 'find_sheep'; // 'find_sheep' | 'feed_sheep' | 'defend_sheep' | 'go_home'
let davidBaseFlock = [];
let davidSheepList = [];
let davidFollowingSheep = [];
let davidGatheredSheepCount = 0;
let davidHungerGauge = 0;
let davidSheepEatingAnimTimer = 0;
let davidSheepEatParticles = [];
let davidVanishingSheepAnims = [];
let davidLostSheepCount = 0;
let davidMaxAllowedLost = 2;
let davidAmbientBaaTimer = 3.5;

let davidFeedItems = [];
let davidHeldFeed = 0;
let davidMaxCarryFeed = 2;
let davidCampCenter = new THREE.Vector3(0, DAVID_HILL_TOP_Y, 12);
let davidCampLabel = null;

// 디펜스 & 사각형 담장 7구간별 단계(0: 미완성, 1: 흙담, 2: 나무담, 3: 돌담)
let davidDefenseTimer = 0;
let davidDefenseDuration = 95;
let davidWallSectionTiers = [0, 0, 0, 0, 0, 0, 0];
let davidWallPanelPlatforms = [];
let davidWallTier = 0;
let davidPlacedWallMat = 0;
let davidMaxWallTier = 3;
let davidWallGroup = null;
let davidWallMaterials = [];
let davidHeldWallMat = 0;
let davidMaxCarryWallMat = 4;
let davidPredators = [];
let davidActivePredatorIdx = 0;
let davidPredatorTurnCooldown = 0;
let davidBrothers = [];
let davidJesseHouseGroup = null;
let davidHouseGateBlocker = null;
let davidHouseBlockerCollider = null;
let davidStaffWaveTimer = 0;
let davidStaffWaveMesh = null;
let davidTrailHistory = [];
let davidActionCooldown = 0;

let davidAnointCutscene = {
  active: false, timer: 0, phase: 0,
  samuelMesh: null, sparkles: [], houseZ: -46
};
let davidStage2Cutscene = {
  active: false, timer: 0, phase: 0
};
let davidStage3Cutscene = {
  active: false, timer: 0, phase: 0
};

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

function ensureDavidCustomUI() {
  let uiRoot = document.getElementById('david-custom-ui');
  if (!uiRoot) {
    uiRoot = document.createElement('div');
    uiRoot.id = 'david-custom-ui';
    uiRoot.className = 'fixed inset-0 pointer-events-none z-20 flex flex-col items-center';
    uiRoot.innerHTML = `
      <!-- 스테이지 1: 양 배부름 상태(0% 😢 ~ 100% 😊) & 디펜스 타이머 패널 -->
      <div id="david-st1-panel" class="hidden mt-16 mc-panel px-4 py-2 rounded-2xl bg-slate-900/85 border-2 border-amber-400 text-white shadow-xl flex flex-col gap-1.5 min-w-[290px]">
        <div id="david-hunger-row" class="flex flex-col gap-1">
          <div class="flex justify-between text-xs font-jua text-amber-300">
            <span>🐑 양 배부름 상태</span>
            <span id="david-hunger-text">0%</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="text-base leading-none select-none" title="0% 배고픔">😢</span>
            <div class="flex-1 h-3.5 bg-slate-700 rounded-full overflow-hidden border border-slate-500">
              <div id="david-hunger-bar" class="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-200" style="width:0%"></div>
            </div>
            <span class="text-base leading-none select-none" title="100% 배부름">😊</span>
          </div>
        </div>
        <div id="david-defense-row" class="hidden flex-col gap-1 pt-1 border-t border-slate-700">
          <div class="flex justify-between text-xs font-jua text-rose-300">
            <span id="david-defense-title">🛡️ 맹수 디펜스 남은 시간</span>
            <span id="david-defense-timer">95.0초</span>
          </div>
          <div id="david-sheep-loss-badge" class="text-[11px] font-bold text-amber-200 text-center">사라진 양: 0마리 (허용 한도: 2마리)</div>
          <div id="david-wall-tier-badge" class="text-[11px] font-bold text-sky-300 text-center">사각형 흙담 시공: 0/7개</div>
        </div>
      </div>

      <!-- 스테이지 2: 16비트 도트 픽셀아트 스타일 물맷돌 집중 조준 모달 -->
      <div id="david-aim-overlay" class="hidden pointer-events-auto fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-4">
        <div class="mc-panel bg-slate-900/95 border-4 border-amber-400 rounded-3xl p-5 max-w-sm w-full flex flex-col items-center gap-3 text-white shadow-2xl">
          <div class="flex items-center justify-between w-full px-1">
            <span class="text-amber-300 font-jua text-lg">🎯 골리앗 투구 위 우상 조준!</span>
            <span id="david-aim-lock-badge" class="px-2 py-0.5 rounded bg-slate-800 border border-slate-600 text-[11px] font-mono font-bold text-sky-300">AIMING...</span>
          </div>
          <p class="text-xs text-slate-200 text-center">픽셀 십자선이 <span class="text-amber-300 font-bold">투구 위 황금·보라 우상 중앙</span>에 겹칠 때 발사하세요!</p>
          <div class="relative w-64 h-44 rounded-xl border-4 border-slate-700 overflow-hidden shadow-inner bg-slate-950">
            <canvas id="david-aim-canvas" width="128" height="88" class="w-full h-full block" style="image-rendering: pixelated;"></canvas>
          </div>
          <div class="flex gap-2 w-full">
            <button type="button" onclick="fireDavidSlingAtIdol()" class="mc-btn flex-1 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-jua text-base shadow-lg">🪨 물맷돌 발사!</button>
            <button type="button" onclick="closeDavidAimOverlay()" class="mc-btn px-4 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-jua text-sm">피하기</button>
          </div>
        </div>
      </div>

      <!-- 스테이지 3: 동물의 숲 스타일 NPC 말풍선 대화창 -->
      <div id="david-npc-dialog" class="hidden pointer-events-auto mt-auto mb-28 mc-panel bg-amber-50/95 border-4 border-amber-700 rounded-3xl p-4 max-w-md w-[92%] text-slate-900 shadow-2xl flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <span id="david-npc-name" class="px-3 py-0.5 rounded-full bg-amber-700 text-amber-100 font-jua text-sm">NPC 이름</span>
          <span class="text-[11px] font-bold text-amber-800">🔊 또로롱 말풍선 사운드</span>
        </div>
        <p id="david-npc-text" class="font-bold text-sm leading-relaxed min-h-[42px] text-slate-800"></p>
        <div class="flex justify-end gap-2">
          <button id="david-npc-action-btn" type="button" onclick="confirmDavidNpcDialog()" class="mc-btn px-5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-jua text-sm">알겠습니다!</button>
        </div>
      </div>
    `;
    document.body.appendChild(uiRoot);
  }
  return uiRoot;
}

// [스테이지 2 요청사항 5] 도트 픽셀아트 스타일로 골리앗의 투구, 비늘갑옷, 우상 장식, 조준 십자선을 정교하게 렌더링
function renderDavidPixelAimScreen(retX, retY, tgtX, tgtY, now) {
  const cvs = document.getElementById('david-aim-canvas');
  if (!cvs) return;
  const ctx = cvs.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // 256x176 기준 좌표를 128x88 도트 그리드로 변환
  const gx = Math.round((tgtX + 24) * 0.5); // 우상 중심 X (약 64)
  const gy = Math.round((tgtY + 24) * 0.5); // 우상 중심 Y (약 29)
  const rx = Math.round((retX + 20) * 0.5); // 조준점 중심 X
  const ry = Math.round((retY + 20) * 0.5); // 조준점 중심 Y

  const px = (x, y, w, h, col) => {
    ctx.fillStyle = col;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };

  // 1) 픽셀 밤하늘/노을 그라데이션 배경 및 도트 구름·절벽
  px(0, 0, 128, 22, '#0c4a6e');
  px(0, 22, 128, 22, '#0369a1');
  px(0, 44, 128, 22, '#0284c7');
  px(0, 66, 128, 22, '#78350f');

  // 도트 구름
  const clOff = Math.round((now * 0.008) % 140) - 20;
  px(clOff, 10, 18, 4, '#bae6fd');
  px(clOff + 3, 8, 12, 2, '#e0f2fe');
  px(105 - (clOff * 0.5), 16, 16, 3, '#bae6fd');

  // 골짜기 사막 언덕 도트 실루엣
  for (let i = 0; i < 128; i += 8) {
    const ch = 12 + ((i * 7) % 10);
    px(i, 68 - ch, 8, ch, '#92400e');
    px(i, 68 - ch, 8, 2, '#b45309');
  }

  // 2) 골리앗의 거대한 어깨(비늘 갑옷) & 얼굴 & 청동 투구 픽셀아트 (우상 X좌표와 연동)
  const hx = gx;
  const hy = gy + 26; // 투구 중심 Y (약 55)

  // 비늘 갑옷 어깨
  px(hx - 34, hy + 14, 68, 20, '#854d0e');
  px(hx - 30, hy + 12, 60, 4, '#ca8a04');
  for (let sx = hx - 30; sx <= hx + 26; sx += 6) {
    for (let sy = hy + 16; sy <= hy + 28; sy += 4) {
      px(sx + ((sy % 8 === 0) ? 2 : 0), sy, 4, 2, '#facc15');
    }
  }

  // 골리앗 얼굴 & 검은 수염 & 붉은 눈빛
  px(hx - 16, hy - 2, 32, 16, '#b45309');
  px(hx - 16, hy + 8, 32, 8, '#1e293b'); // 턱수염
  px(hx - 10, hy + 2, 5, 3, '#ef4444');  // 왼눈
  px(hx + 5,  hy + 2, 5, 3, '#ef4444');  // 오른눈
  px(hx - 8,  hy + 2, 2, 2, '#fef08a');  // 눈 하이라이트
  px(hx + 7,  hy + 2, 2, 2, '#fef08a');

  // 청동 투구 돔 & 코보호대 & 볼가리개
  px(hx - 20, hy - 12, 40, 12, '#b45309');
  px(hx - 17, hy - 16, 34, 5,  '#d97706');
  px(hx - 12, hy - 19, 24, 3,  '#f59e0b');
  px(hx - 22, hy - 4,  44, 3,  '#78350f'); // 투구 테두리 챙
  px(hx - 2,  hy - 4,  4,  9,  '#d97706'); // 코 보호대
  px(hx - 20, hy - 1,  5,  10, '#92400e'); // 좌측 볼가리개
  px(hx + 15, hy - 1,  5,  10, '#92400e'); // 우측 볼가리개
  // 투구 리벳 도트
  [-15, -8, 0, 8, 15].forEach(ox => px(hx + ox, hy - 6, 2, 2, '#fde047'));

  // 3) 투구 꼭대기의 우상(Idol) 조각상 픽셀아트 (조준 타깃: gx, gy)
  const pulse = Math.floor(now * 0.01) % 2 === 0;
  // 황금 받침대
  px(gx - 10, gy + 6, 20, 4, '#ca8a04');
  px(gx - 8,  gy + 4, 16, 2, '#facc15');
  // 우상 양 날개 (황금 도트)
  px(gx - 15, gy - 6, 6, 8, '#eab308');
  px(gx - 17, gy - 9, 4, 5, '#fde047');
  px(gx + 9,  gy - 6, 6, 8, '#eab308');
  px(gx + 13, gy - 9, 4, 5, '#fde047');
  // 우상 몸통 (보랏빛 석상)
  px(gx - 8,  gy - 10, 16, 14, '#581c87');
  px(gx - 6,  gy - 8,  12, 10, '#7e22ce');
  // 우상 양 뿔
  px(gx - 7,  gy - 16, 3, 6, '#facc15');
  px(gx - 8,  gy - 18, 3, 3, '#fef08a');
  px(gx + 4,  gy - 16, 3, 6, '#facc15');
  px(gx + 5,  gy - 18, 3, 3, '#fef08a');
  // 우상 중앙 붉은 보석 코어 & 눈
  px(gx - 3,  gy - 4, 6, 6, pulse ? '#f43f5e' : '#e11d48');
  px(gx - 1,  gy - 2, 2, 2, '#ffffff');
  px(gx - 4,  gy - 8, 2, 2, '#fde047');
  px(gx + 2,  gy - 8, 2, 2, '#fde047');

  // 우상 타깃 외곽 점선 브래킷
  const brkCol = pulse ? '#fde047' : '#f59e0b';
  px(gx - 18, gy - 19, 5, 2, brkCol); px(gx - 18, gy - 19, 2, 5, brkCol);
  px(gx + 13, gy - 19, 5, 2, brkCol); px(gx + 16, gy - 19, 2, 5, brkCol);
  px(gx - 18, gy + 8,  5, 2, brkCol); px(gx - 18, gy + 5,  2, 5, brkCol);
  px(gx + 13, gy + 8,  5, 2, brkCol); px(gx + 16, gy + 5,  2, 5, brkCol);

  // 4) 다윗의 물맷돌 픽셀 조준 십자선 (Reticle: rx, ry)
  const dist = Math.hypot((retX + 20) - (tgtX + 24), (retY + 20) - (tgtY + 24));
  const hitThreshold = (currentMode === 'kinder') ? 46 : (currentMode === 'junior' ? 38 : 34);
  const isLockedOn = (dist <= hitThreshold);
  const retCol = isLockedOn ? '#4ade80' : '#38bdf8';
  const retSub = isLockedOn ? '#fef08a' : '#e0f2fe';

  // 조준 사각 테두리 코너
  px(rx - 11, ry - 11, 6, 2, retCol); px(rx - 11, ry - 11, 2, 6, retCol);
  px(rx + 5,  ry - 11, 6, 2, retCol); px(rx + 9,  ry - 11, 2, 6, retCol);
  px(rx - 11, ry + 9,  6, 2, retCol); px(rx - 11, ry + 5,  2, 6, retCol);
  px(rx + 5,  ry + 9,  6, 2, retCol); px(rx + 9,  ry + 5,  2, 6, retCol);

  // 십자선 및 중앙 도트
  px(rx - 14, ry - 1, 6, 2, retSub);
  px(rx + 8,  ry - 1, 6, 2, retSub);
  px(rx - 1,  ry - 14, 2, 6, retSub);
  px(rx - 1,  ry + 8,  2, 6, retSub);
  px(rx - 2,  ry - 2,  4, 4, isLockedOn ? '#ef4444' : '#ffffff');

  const badge = document.getElementById('david-aim-lock-badge');
  if (badge) {
    badge.textContent = isLockedOn ? '🎯 LOCK ON! 발사!' : 'AIMING...';
    badge.className = isLockedOn
      ? 'px-2 py-0.5 rounded bg-emerald-600 border border-emerald-300 text-[11px] font-mono font-bold text-white animate-pulse'
      : 'px-2 py-0.5 rounded bg-slate-800 border border-slate-600 text-[11px] font-mono font-bold text-sky-300';
  }
}

function hideAllDavidCustomUI() {
  const st1 = document.getElementById('david-st1-panel');
  const aim = document.getElementById('david-aim-overlay');
  const dlg = document.getElementById('david-npc-dialog');
  if (st1) st1.classList.add('hidden');
  if (aim) aim.classList.add('hidden');
  if (dlg) dlg.classList.add('hidden');
  if (animaleseTimer) { clearInterval(animaleseTimer); animaleseTimer = null; }
}

function openDavidSheepLostRetryModal() {
  isPlaying = false;
  isTimeAttackActive = false;
  playSfx('wrong');
  document.getElementById('retry-modal-icon').textContent = '🐑';
  document.getElementById('retry-modal-title').textContent = `양을 ${davidLostSheepCount}마리 잃어버렸어요!`;
  document.getElementById('retry-modal-desc').innerHTML =
    `이 레벨에서는 양이 최대 <b>${davidMaxAllowedLost}마리</b>까지만 사라져도 괜찮지만,<br/>${davidLostSheepCount}마리가 사라져 게임 오버가 되었어요.<br/>담장이 없는 쪽으로 오는 맹수를 지팡이로 쫓아내고 담장을 쌓아 다시 도전해 볼까요?`;
  const rm = document.getElementById('retry-modal');
  rm.classList.remove('hidden');
  rm.classList.add('flex');
}

// -------------------------------------------------------------------------
// 3. 다윗(수금·물매·왕관), 늑대, 사무엘 선지자 3D 모델링
// -------------------------------------------------------------------------
function createDavidHeroMesh() {
  const g = new THREE.Group();
  const isKingStage = (currentStage === 3 || currentStage === 4);
  const tunic = isKingStage ? matDavidCached('#991b1b', '#7f1d1d') : matDavidCached('#fef3c7', '#fde68a');
  const vest = isKingStage ? matDavidCached('#facc15', '#ca8a04') : matDavidCached('#b45309', '#78350f');
  const beltMat = matDavidCached('#78350f');
  const skin = matDavidCached('#fed7aa', '#fdba74');
  const hairMat = matDavidCached('#92400e', '#78350f');
  const pouchMat = matDavidCached('#d97706', '#92400e');
  const eyeMat = matDavidCached('#0f172a');
  const goldMat = matDavidCached('#facc15', '#ca8a04');

  const lLeg = new THREE.Group(); lLeg.position.set(-0.22, 0.7, 0);
  lLeg.add(createBox(0.34, 0.55, 0.34, skin, 0, -0.28, 0), createBox(0.38, 0.16, 0.42, beltMat, 0, -0.62, 0.03));
  const rLeg = new THREE.Group(); rLeg.position.set(0.22, 0.7, 0);
  rLeg.add(createBox(0.34, 0.55, 0.34, skin, 0, -0.28, 0), createBox(0.38, 0.16, 0.42, beltMat, 0, -0.62, 0.03));

  const torso = createBox(0.88, 1.05, 0.50, tunic, 0, 1.20, 0);
  const shepherdVestL = createBox(0.28, 1.02, 0.54, vest, -0.28, 1.22, 0);
  const shepherdVestR = createBox(0.28, 1.02, 0.54, vest, 0.28, 1.22, 0);
  const belt = createBox(0.94, 0.16, 0.56, beltMat, 0, 0.98, 0);
  const slingBag = createBox(0.36, 0.42, 0.28, pouchMat, -0.46, 0.92, 0.12);

  if (isKingStage) {
    g.add(createBox(0.98, 1.18, 0.14, matDavidCached('#7f1d1d'), 0, 1.18, -0.30));
  }

  const head = createBox(0.78, 0.78, 0.78, skin, 0, 2.12, 0);
  const hairTop = createBox(0.86, 0.28, 0.86, hairMat, 0, 2.48, 0);
  const hairBack = createBox(0.84, 0.52, 0.24, hairMat, 0, 2.18, -0.34);
  const lEye = createBox(0.12, 0.12, 0.06, eyeMat, -0.18, 2.18, 0.40);
  const rEye = createBox(0.12, 0.12, 0.06, eyeMat, 0.18, 2.18, 0.40);

  if (isKingStage) {
    g.add(
      createBox(0.90, 0.18, 0.90, goldMat, 0, 2.58, 0),
      createBox(0.18, 0.22, 0.18, goldMat, -0.30, 2.74, 0.34),
      createBox(0.20, 0.28, 0.18, matDavidCached('#38bdf8'), 0, 2.76, 0.36),
      createBox(0.18, 0.22, 0.18, goldMat, 0.30, 2.74, 0.34)
    );
  } else {
    g.add(createBox(0.88, 0.12, 0.88, matDavidCached('#0284c7'), 0, 2.38, 0));
  }

  const lArm = new THREE.Group(); lArm.position.set(-0.62, 1.58, 0);
  lArm.add(createBox(0.32, 0.68, 0.32, tunic, 0, -0.30, 0), createBox(0.26, 0.20, 0.26, skin, 0, -0.70, 0));

  const harpTool = new THREE.Group();
  harpTool.add(
    createBox(0.46, 0.10, 0.10, goldMat, 0, -0.58, 0.32, false),
    createBox(0.10, 0.50, 0.10, goldMat, -0.18, -0.35, 0.32, false),
    createBox(0.10, 0.40, 0.10, goldMat, 0.18, -0.38, 0.32, false),
    createBox(0.42, 0.08, 0.08, goldMat, 0, -0.16, 0.32, false),
    createBox(0.03, 0.38, 0.03, matDavidCached('#ffffff'), -0.06, -0.36, 0.32, false),
    createBox(0.03, 0.38, 0.03, matDavidCached('#ffffff'), 0.06, -0.36, 0.32, false)
  );
  harpTool.visible = true;
  lArm.add(harpTool);

  const rArm = new THREE.Group(); rArm.position.set(0.62, 1.58, 0);
  const staffMat = matDavidCached('#5c2d0c', '#451a03');
  const crookTip = matDavidCached('#d97706');
  rArm.add(
    createBox(0.32, 0.68, 0.32, tunic, 0, -0.30, 0),
    createBox(0.26, 0.20, 0.26, skin, 0, -0.70, 0)
  );
  if (currentStage !== 2) {
    rArm.add(
      createBox(0.12, 2.25, 0.12, staffMat, 0.04, -0.35, 0.32),
      createBox(0.12, 0.28, 0.36, crookTip, 0.04, 0.82, 0.44),
      createBox(0.12, 0.24, 0.12, crookTip, 0.04, 0.68, 0.58)
    );
  } else {
    rArm.add(
      createBox(0.08, 0.75, 0.08, beltMat, 0.04, -0.95, 0.32, false),
      createBox(0.28, 0.22, 0.28, matDavidCached('#cbd5e1'), 0.04, -1.32, 0.32, false)
    );
  }

  carriedBlockGroup = new THREE.Group();
  carriedBlockGroup.position.set(0, 1.22, -0.48);
  g.add(carriedBlockGroup);

  g.add(
    lLeg, rLeg, torso, shepherdVestL, shepherdVestR, belt, slingBag,
    head, hairTop, hairBack, lEye, rEye, lArm, rArm
  );
  playerLimbs = { lLeg, rLeg, lArm, rArm, axeTool: harpTool };
  return g;
}

function createWolfMesh() {
  const g = new THREE.Group();
  const mainFur = matDavidCached('#475569', '#334155');
  const darkFur = matDavidCached('#1e293b', '#0f172a');
  const bellyFur = matDavidCached('#94a3b8');
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
  const noseMat = matDavidCached('#0f172a');

  const body = createBox(0.82, 0.62, 1.28, mainFur, 0, 0.58, 0);
  const chest = createBox(0.86, 0.66, 0.52, darkFur, 0, 0.64, 0.42);
  const belly = createBox(0.68, 0.18, 1.05, bellyFur, 0, 0.32, 0, false);
  const head = createBox(0.64, 0.58, 0.64, mainFur, 0, 0.98, 0.72);
  const snout = createBox(0.36, 0.28, 0.42, bellyFur, 0, 0.88, 1.15);
  const nose = createBox(0.16, 0.12, 0.12, noseMat, 0, 0.96, 1.36, false);

  const lEar = createBox(0.18, 0.28, 0.14, darkFur, -0.20, 1.35, 0.66);
  const rEar = createBox(0.18, 0.28, 0.14, darkFur, 0.20, 1.35, 0.66);
  const lEye = createBox(0.10, 0.10, 0.05, eyeMat, -0.16, 1.05, 1.05, false);
  const rEye = createBox(0.10, 0.10, 0.05, eyeMat, 0.16, 1.05, 1.05, false);
  const tail = createBox(0.22, 0.22, 0.65, darkFur, 0, 0.62, -0.82);
  tail.rotation.x = -0.35;

  [[-0.26, -0.44], [0.26, -0.44], [-0.26, 0.44], [0.26, 0.44]].forEach(([lx, lz]) => {
    g.add(createBox(0.22, 0.52, 0.22, darkFur, lx, 0.26, lz));
  });

  g.add(body, chest, belly, head, snout, nose, lEar, rEar, lEye, rEye, tail);
  return g;
}

function createSamuelMesh() {
  const g = new THREE.Group();
  const robeMat = matDavidCached('#f8fafc', '#e2e8f0');
  const ephodMat = matDavidCached('#1e3a8a', '#172554');
  const goldTrim = matDavidCached('#facc15', '#ca8a04');
  const skinMat = matDavidCached('#fed7aa', '#fdba74');
  const beardMat = matDavidCached('#f1f5f9', '#cbd5e1');
  const eyeMat = matDavidCached('#0f172a');

  const torso = createBox(0.88, 1.25, 0.52, robeMat, 0, 0.85, 0);
  const ephod = createBox(0.92, 0.85, 0.56, ephodMat, 0, 1.05, 0);
  const breastplate = createBox(0.42, 0.42, 0.60, goldTrim, 0, 1.18, 0);
  const head = createBox(0.72, 0.72, 0.72, skinMat, 0, 1.88, 0);
  const beard = createBox(0.76, 0.48, 0.32, beardMat, 0, 1.62, 0.32);
  const hair = createBox(0.80, 0.32, 0.80, beardMat, 0, 2.22, 0);
  const lEye = createBox(0.10, 0.10, 0.05, eyeMat, -0.15, 1.92, 0.37);
  const rEye = createBox(0.10, 0.10, 0.05, eyeMat, 0.15, 1.92, 0.37);

  const lArm = new THREE.Group(); lArm.position.set(-0.56, 1.42, 0);
  lArm.add(createBox(0.28, 0.68, 0.28, robeMat, 0, -0.28, 0));

  const rArm = new THREE.Group(); rArm.position.set(0.56, 1.42, 0);
  rArm.add(createBox(0.28, 0.68, 0.28, robeMat, 0, -0.28, 0));

  const hornGroup = new THREE.Group();
  hornGroup.add(
    createBox(0.18, 0.45, 0.18, matDavidCached('#fde68a', '#ca8a04'), 0, -0.45, 0.32, false),
    createBox(0.22, 0.16, 0.22, goldTrim, 0, -0.62, 0.42, false)
  );
  hornGroup.rotation.x = 0.4;
  rArm.add(hornGroup);

  g.add(torso, ephod, breastplate, head, beard, hair, lEye, rEye, lArm, rArm);
  g.userData = { lArm, rArm, hornGroup };
  return g;
}

// -------------------------------------------------------------------------
// 4. [스테이지 1 월드] 언덕 위 목장 + 내리막 오솔길 + 언덕 아래 집 + 강 건너 작은 나무 원경
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

// [스테이지 1 요청사항 1] 강 건너 먼 배경의 거대 산맥을 제거해 하늘이 시원하게 보이도록 하고, 외곽을 작은 나무들로 채움!
function buildDistantPlainAndRiverVista(houseZ) {
  const plainMat = new THREE.MeshLambertMaterial({ map: makeGrassFieldTex() });
  const fieldMat1 = matDavidCached('#84cc16', '#65a30d');
  const fieldMat2 = matDavidCached('#eab308', '#ca8a04');
  const lowMoundMat = matDavidCached('#4ade80', '#22c55e');
  const bankMat = matDavidCached('#fde68a', '#d9a05b');
  const waterTex = makeFlowingWaterWallTex();
  const riverMat = new THREE.MeshLambertMaterial({ map: waterTex, transparent: true, opacity: 0.90 });
  const bridgeMat = matDavidCached('#94a3b8', '#64748b');

  const plainFloor = createBox(280, 2.0, 160, plainMat, 0, -1.05, houseZ - 55, false);
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

  // 유유히 흐르는 강줄기
  const riverBaseZ = houseZ - 40;
  for (let rx = -130; rx <= 130; rx += 6) {
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

  // 강변 작은 나무들
  [-84, -68, -52, -38, -22, 18, 34, 50, 66, 82].forEach((tx, idx) => {
    const tz = riverBaseZ + Math.sin(tx * 0.035) * 7.5 + (idx % 2 === 0 ? 10.0 : -10.0);
    addDavidHillTree(tx, tz, 0.72 + (idx % 3) * 0.1, false, false, 0);
  });

  // 강 건너 먼 배경 외곽: 하늘을 가리지 않는 완만한 잔디 둔덕(높이 1.2~2.2m)과 촘촘한 작은 나무 숲(scale 0.55~0.85)
  for (let x = -120; x <= 120; x += 18) {
    const moundZ = houseZ - 92 + (Math.abs(x) % 12);
    worldGroup.add(createBox(22, 1.6, 16, lowMoundMat, x, 0.8, moundZ, false));
  }

  // 강 건너편 평야 외곽을 가득 채우는 작은 나무 군락 (하늘이 탁 트여 보이도록 작은 스케일 적용)
  for (let row = 0; row < 3; row++) {
    const baseZ = houseZ - 64 - row * 16;
    for (let x = -116; x <= 116; x += 9) {
      const jitterX = x + ((row * 3 + x) % 5) - 2;
      const jitterZ = baseZ + ((x * 7) % 6) - 3;
      const smallScale = 0.55 + ((Math.abs(x + row * 11)) % 4) * 0.08; // 0.55 ~ 0.79 작은 나무
      addDavidHillTree(jitterX, jitterZ, smallScale, false, false, 0);
    }
  }

  // 강 건너 좌우 평야 외곽 작은 나무들
  for (let z = houseZ - 56; z <= houseZ - 12; z += 10) {
    [-96, -84, 84, 96].forEach((x, idx) => {
      addDavidHillTree(x + (idx % 2) * 3, z, 0.65 + (idx % 2) * 0.12, false, false, 0);
    });
  }

  // 탁 트인 하늘 위에 떠 있는 구름들
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
  davidTrailHistory = [];
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
  if (typeof initDavidFencePlatforms === 'function') {
    initDavidFencePlatforms();
  }

  davidCampLabel = createWorldLabel('🐑 언덕 위 다윗의 목초지 (바위 뒤에 숨은 양 5마리를 찾아 데려오세요!)');

  buildHiddenJesseHouseInLowerValley(houseZ);

  davidStaffWaveMesh = new THREE.Mesh(
    new THREE.RingGeometry(0.6, 1.2, 28),
    new THREE.MeshBasicMaterial({ color: 0xfef08a, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
  );
  davidStaffWaveMesh.rotation.x = -Math.PI / 2;
  davidStaffWaveMesh.visible = false;
  worldGroup.add(davidStaffWaveMesh);

  // 4) 양이 숨어 있을 큰 바위 은신처 5곳 생성 (바위와 나무 사이에 좁은 틈이 생기지 않도록 나무 간격을 넉넉히 띄움)
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
    // 나무를 바위에서 4.6m 이상 넉넉히 띄워 양이 바위와 나무 사이에 절대 끼이지 않도록 배치
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
  playerVelY = 0; isGrounded = true; playerFacing = 0;
  cameraYaw = 0; cameraTargetYaw = 0;
  for (let s = 0; s < 40; s++) davidTrailHistory.push({ x: 0, z: 20.0 + s * 0.2 });

  if (guideArrowGroup) guideArrowGroup.visible = (currentMode !== 'senior');
  snapCameraToPlayer();
  if (typeof updateDavidStage1UI === 'function') updateDavidStage1UI();
  updateStageHUD();
  playSheepBaaSound(1.05, 0.08);
  showToast('🐑 언덕 위 초원에서 바위 뒤에 숨어 있는 양 5마리를 찾아 목초지로 데려오세요!');
}
// =========================================================================
// [ep3_david.js - 파트 2/5] 에피소드 3 : 스테이지 1 진행 로직
// - 디펜스 시작 시 '양 배부름 상태' 게이지 즉시 숨김 처리
// - 먹이를 먹은 양 머리 위 3D 복셀 하트(❤️) 연출 & 바위·나무 연속 접선 슬라이딩 추종 물리
// - 사각형 반투명 울타리(흙담 7 -> 나무담 7 -> 돌담 7) 점프 넘기 및 맹수 교차 디펜스
// =========================================================================

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

  // 북쪽 변 (8칸: 0~7)
  for (let i = 0; i < 8; i++) {
    const px = (cx - halfW) + (i + 0.5) * ((halfW * 2) / 8);
    panels.push({ x: px, z: cz - halfD, w: (halfW * 2) / 8 - 0.06, d: 0.68 });
  }
  // 동쪽 변 (6칸: 8~13)
  for (let i = 0; i < 6; i++) {
    const pz = (cz - halfD) + (i + 0.5) * ((halfD * 2) / 6);
    panels.push({ x: cx + halfW, z: pz, w: 0.68, d: (halfD * 2) / 6 - 0.06 });
  }
  // 남쪽 변 (8칸: 14~21)
  for (let i = 7; i >= 0; i--) {
    const px = (cx - halfW) + (i + 0.5) * ((halfW * 2) / 8);
    panels.push({ x: px, z: cz + halfD, w: (halfW * 2) / 8 - 0.06, d: 0.68 });
  }
  // 서쪽 변 (6칸: 22~27)
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
      ? `${nextSpec.fullTitle} 완성! (점프로 담장을 넘나들 수 있어요!)`
      : `${nextSpec.fullTitle} 시공: ${davidPlacedWallMat}/${DAVID_WALL_REQ_PER_TIER}개 (지어진 담은 점프로 넘기!)`;
  }
}

// 양 머리 위로 떠오르는 3D 복셀 하트(❤️) 메쉬 생성
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

// -------------------------------------------------------------------------
// 바위·나무에 끼이거나 흔들리지 않는 연속 접선 슬라이딩 추종 물리
// -------------------------------------------------------------------------
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

// [스테이지 1 요청사항 1] 디펜스가 시작되면(defend_sheep) '양 배부름 상태' 게이지 행(#david-hunger-row)을 숨김!
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
    // 디펜스 단계에서는 배부름 상태를 숨기고 디펜스 타이머·상태만 표시
    if (hungerRow) hungerRow.classList.add('hidden');
    defRow.classList.remove('hidden', 'border-t', 'pt-1');
    defRow.classList.add('flex');
    defTimer.textContent = `${Math.max(0, davidDefenseTimer).toFixed(1)}초`;
    if (lossBadge) {
      lossBadge.textContent = `🐑 사라진 양: ${davidLostSheepCount}마리 (허용 한도: ${davidMaxAllowedLost}마리)`;
      lossBadge.className = davidLostSheepCount >= davidMaxAllowedLost
        ? 'text-[11px] font-bold text-rose-400 text-center'
        : 'text-[11px] font-bold text-amber-200 text-center';
    }
  } else {
    // 먹이 주기 단계에서는 배부름 상태 게이지만 표시
    if (hungerRow) hungerRow.classList.remove('hidden');
    hungerText.textContent = `${Math.round(davidHungerGauge)}%`;
    hungerBar.style.width = `${Math.min(100, Math.round(davidHungerGauge))}%`;
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
      collected: false, label: createWorldLabel('🌿 신선한 양 먹이 풀단')
    });
  }

  davidCampLabel.innerHTML = '🌿 주변에서 먹이를 찾아 양을 배부르게 해주세요! (0% 😢)';
  updateDavidStage1UI();
  updateStageHUD();
  playSheepBaaSound(1.12, 0.09);
  showToast('🌿 주변에서 먹이를 찾아 양을 배부르게 해주세요!');
}

function startDavidStage1DefensePhase() {
  davidStage1Phase = 'defend_sheep';
  davidWallSectionTiers = [0, 0, 0, 0, 0, 0, 0];
  davidWallTier = 0;
  davidPlacedWallMat = 0;
  davidHeldWallMat = 0;
  davidCampLabel.innerHTML = '🛡️ 사각형 울타리 방어 진영 (자원 7개를 모아 담을 쌓고 맹수를 막으세요!)';

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
  showToast('🐺 맹수가 천천히 번갈아 습격합니다! 지팡이로 쫓아내며 자원 7개를 모아 사각형 담장을 쌓으세요!');
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
        davidCampLabel.innerHTML = `🌿 주변에서 먹이를 찾아 양을 배부르게 해주세요! (${Math.round(davidHungerGauge)}%)`;
        updateDavidStage1UI();
        updateStageHUD();
        showToast(`❤️ 양들이 맛있게 먹고 머리 위로 하트가 떠올라요! (양 배부름 상태 ${Math.round(davidHungerGauge)}%)`);
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

  // 1) 바위 뒤에 숨어 있는 양 5마리 탐색 및 체인 추종
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

      if (davidStage1Phase === 'find_sheep' && d < 3.0) {
        sh.state = 'following';
        sh.ring.material.color.setHex(0x38bdf8);
        sh.label.innerHTML = `🐑 ${sh.name} (목초지로 데려가세요!)`;
        davidFollowingSheep.push(sh);
        playSfx('rescue');
        playSheepBaaSound(1.0 + idx * 0.06, 0.10);
        showToast(`🐑 바위 뒤에 숨어 있던 ${sh.name}을(를) 찾았어요! 언덕 위 목초지로 데려가세요!`);
      }
    }
  });

  for (let fIdx = 0; fIdx < davidFollowingSheep.length; fIdx++) {
    const sh = davidFollowingSheep[fIdx];
    moveDavidFollowingSheepSafely(sh, fIdx, dt, now);
    updateWorldLabelPos(sh.label, sh.group.position, true);
  }

  if (davidFollowingSheep.length > 0 && isNearDavidRectangularFence(playerPos.x, playerPos.z, 0.8)) {
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
      if (currentMode === 'timeattack') timeRemaining += 4.5;
    }
    playSfx('rescue');
    playSheepBaaSound(1.15, 0.09);

    if (davidGatheredSheepCount >= 5) {
      startDavidStage1FeedPhase();
    } else {
      updateStageHUD();
      showToast(`🐑 양이 사각형 목초지 무리에 합류했어요! (${davidGatheredSheepCount}/5마리)`);
    }
  }

  // 2) 먹이 주기 단계 업데이트
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
        showToast(`🌿 양 먹이 획득! (보유 ${davidHeldFeed}개 · 중앙 목초지로 가져가세요!)`);
      }
    });
  }

  // 3) 맹수 교차 디펜스 & 사각형 반투명 울타리 시공 업데이트
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

  // 4) 하단 액션 버튼 표시 제어
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

  // 5) 언덕 아래 집 사무엘 선지자 조우 및 가이드 화살표
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
      guideArrowGroup.rotation.y = Math.atan2(guidePos.x - playerPos.x, guidePos.z - playerPos.z) - playerFacing;
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
// [ep3_david.js - 파트 3/4] 에피소드 3 : 스테이지 2
// - 골리앗 주변 군인 20명 & 다윗 뒤편 아군 20명, 다윗 뒤쪽 평야·산맥 원경, S자 곡선 하천
// - 조준 영역 진입 시 픽셀아트 조준창 자동 오픈 & 골리앗 격파 후 평온한 하프 BGM 유지
// =========================================================================

let davidGoliathObj = null;
let davidSlingStones = [];
let davidHeldStones = 0;
let davidMaxStones = 5;
let davidIdolHits = 0;
let davidReqIdolHits = 2;
let davidGoliathHazards = [];
let davidPhilistineSoldiers = [];
let davidIsraelSoldiers = [];
let davidAimAutoCooldown = 0;
let davidAimState = {
  active: false,
  phase: 0,
  reticleX: 104,
  reticleY: 38,
  targetX: 104,
  targetY: 34
};
let davidFlyingStone = {
  active: false,
  mesh: null,
  timer: 0,
  duration: 0.55,
  startPos: new THREE.Vector3(),
  endPos: new THREE.Vector3(),
  isHit: false
};
let davidIdolShards = [];

// 엘라 골짜기 S자 곡선 하천의 중심 Z좌표 계산 함수
function getElahStreamCenterZ(x) {
  return 4.8 + Math.sin(x * 0.14) * 2.6 + Math.cos(x * 0.07) * 1.1;
}

// -------------------------------------------------------------------------
// 1. 거대 골리앗(투구 위 우상) & 블레셋·이스라엘 군인(각 20명) 3D 모델링
// -------------------------------------------------------------------------
function createGiantGoliathMesh() {
  const g = new THREE.Group();
  const s = 3.2;

  const skinMat = matDavidCached('#d97706', '#b45309');
  const bronzeMat = matDavidCached('#b45309', '#78350f');
  const darkBronze = matDavidCached('#78350f', '#451a03');
  const scaleArmor = matDavidCached('#ca8a04', '#854d0e');
  const kiltMat = matDavidCached('#7f1d1d', '#450a0a');
  const ironMat = matDavidCached('#64748b', '#334155');
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

  const lLeg = new THREE.Group(); lLeg.position.set(-0.26 * s, 0.75 * s, 0);
  lLeg.add(
    createBox(0.38 * s, 0.72 * s, 0.38 * s, bronzeMat, 0, -0.36 * s, 0),
    createBox(0.42 * s, 0.22 * s, 0.46 * s, darkBronze, 0, -0.68 * s, 0.04 * s)
  );
  const rLeg = new THREE.Group(); rLeg.position.set(0.26 * s, 0.75 * s, 0);
  rLeg.add(
    createBox(0.38 * s, 0.72 * s, 0.38 * s, bronzeMat, 0, -0.36 * s, 0),
    createBox(0.42 * s, 0.22 * s, 0.46 * s, darkBronze, 0, -0.68 * s, 0.04 * s)
  );

  const torso = createBox(1.12 * s, 1.18 * s, 0.62 * s, scaleArmor, 0, 1.32 * s, 0);
  const chestPlate = createBox(1.18 * s, 0.65 * s, 0.68 * s, bronzeMat, 0, 1.48 * s, 0);
  const skirt = createBox(1.16 * s, 0.46 * s, 0.66 * s, kiltMat, 0, 0.78 * s, 0);
  const belt = createBox(1.20 * s, 0.20 * s, 0.70 * s, darkBronze, 0, 0.98 * s, 0);

  const head = createBox(0.76 * s, 0.76 * s, 0.76 * s, skinMat, 0, 2.28 * s, 0);
  const beard = createBox(0.80 * s, 0.42 * s, 0.35 * s, matDavidCached('#1e293b'), 0, 2.04 * s, 0.32 * s);
  const lEye = createBox(0.12 * s, 0.10 * s, 0.06 * s, eyeMat, -0.18 * s, 2.32 * s, 0.39 * s, false);
  const rEye = createBox(0.12 * s, 0.10 * s, 0.06 * s, eyeMat,  0.18 * s, 2.32 * s, 0.39 * s, false);

  const helmetGroup = new THREE.Group();
  helmetGroup.position.set(0, 2.58 * s, 0);
  helmetGroup.add(
    createBox(0.88 * s, 0.42 * s, 0.88 * s, bronzeMat, 0, 0, 0),
    createBox(0.92 * s, 0.14 * s, 0.94 * s, darkBronze, 0, -0.16 * s, 0.04 * s),
    createBox(0.16 * s, 0.45 * s, 0.88 * s, bronzeMat, -0.42 * s, -0.32 * s, 0),
    createBox(0.16 * s, 0.45 * s, 0.88 * s, bronzeMat,  0.42 * s, -0.32 * s, 0)
  );

  // 투구 위에 세워진 우상(Idol) 모양 장식
  const idolGroup = new THREE.Group();
  idolGroup.position.set(0, 0.52 * s, 0);
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

  const lArm = new THREE.Group(); lArm.position.set(-0.78 * s, 1.68 * s, 0);
  lArm.add(
    createBox(0.36 * s, 0.78 * s, 0.36 * s, skinMat, 0, -0.36 * s, 0),
    createBox(0.95 * s, 1.45 * s, 0.18 * s, bronzeMat, -0.22 * s, -0.45 * s, 0.38 * s),
    createBox(0.75 * s, 1.25 * s, 0.22 * s, darkBronze, -0.22 * s, -0.45 * s, 0.40 * s)
  );

  const rArm = new THREE.Group(); rArm.position.set(0.78 * s, 1.68 * s, 0);
  rArm.add(
    createBox(0.36 * s, 0.78 * s, 0.36 * s, skinMat, 0, -0.36 * s, 0),
    createBox(0.14 * s, 2.85 * s, 0.14 * s, darkBronze, 0.08 * s, -0.15 * s, 0.42 * s),
    createBox(0.26 * s, 0.65 * s, 0.26 * s, ironMat, 0.08 * s, 1.42 * s, 0.42 * s)
  );

  g.add(lLeg, rLeg, torso, chestPlate, skirt, belt, head, beard, lEye, rEye, helmetGroup, lArm, rArm);
  g.userData = {
    scale: s,
    lArm, rArm, helmetGroup, idolGroup,
    idolParts: [idolHornL, idolHornR, idolWingL, idolWingR, idolBody, idolCore],
    targetRing
  };
  return g;
}

// 블레셋 군인(20명) 및 이스라엘 아군 군인(20명) 생성 함수
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
// 2. 곡선 하천, 시냇가 물맷돌, 양 진영 40명 군대, 다윗 뒤편 평야·산맥 생성
// -------------------------------------------------------------------------
function spawnBrookSlingStones(count) {
  davidSlingStones.forEach(st => {
    if (st.group) worldGroup.remove(st.group);
    if (st.label) st.label.remove();
  });
  davidSlingStones = [];

  const isMovingStream = (currentMode === 'senior' || currentMode === 'timeattack');
  const stoneColors = ['#e2e8f0', '#bae6fd', '#fef08a', '#cbd5e1', '#f8fafc'];

  for (let i = 0; i < count; i++) {
    const sx = -15 + (i / Math.max(1, count - 1)) * 30 + (Math.random() - 0.5) * 2.0;
    const zOffset = ((i % 3) - 1) * 1.35;
    const sz = getElahStreamCenterZ(sx) + zOffset;

    const grp = new THREE.Group();
    const stoneMat = matDavidCached(stoneColors[i % stoneColors.length], '#94a3b8');
    const core = createBox(0.68, 0.48, 0.68, stoneMat, 0, 0.32, 0);
    const topCap = createBox(0.46, 0.22, 0.46, matDavidCached('#ffffff'), 0, 0.60, 0, false);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.75, 1.1, 20),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.08;

    grp.add(core, topCap, ring);
    grp.position.set(sx, 0, sz);
    worldGroup.add(grp);

    const vx = isMovingStream ? ((i % 2 === 0 ? 1 : -1) * (2.5 + (i % 3) * 0.55)) : 0;
    const lbl = createWorldLabel(`🪨 매끄러운 물맷돌 ${isMovingStream ? '(곡선 물살에 흘러감!)' : ''}`);
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

function updateDavidCarriedStonesVisual() {
  if (!carriedBlockGroup) return;
  while (carriedBlockGroup.children.length > 0) carriedBlockGroup.remove(carriedBlockGroup.children[0]);
  const sMat = matDavidCached('#e2e8f0', '#94a3b8');
  for (let i = 0; i < Math.min(davidHeldStones, 5); i++) {
    const st = createBox(0.44, 0.28, 0.44, sMat, 0, i * 0.30, 0, false);
    carriedBlockGroup.add(st);
  }
  const hudBox = document.getElementById('hud-block-box');
  if (currentEpisode === 'david' && currentStage === 2) {
    hudBox.classList.remove('hidden'); hudBox.classList.add('flex');
    document.getElementById('hud-block-text').textContent = `물맷돌 ${davidHeldStones}/5개`;
  }
}

// [스테이지 2 요청사항 6] 다윗 뒤쪽(남쪽) 배경에 펼쳐진 평야와 들판, 나무, 원경 산맥 생성
function buildStage2SouthPlainAndMountains() {
  const grassMat = new THREE.MeshLambertMaterial({ map: makeGrassFieldTex() });
  const fieldMat1 = matDavidCached('#84cc16', '#65a30d');
  const fieldMat2 = matDavidCached('#eab308', '#ca8a04');
  const mtnMat1 = matDavidCached('#64748b', '#475569');
  const mtnMat2 = matDavidCached('#15803d', '#166534');
  const mtnMat3 = matDavidCached('#475569', '#334155');

  // 다윗 뒤편(z = 34 ~ 145)으로 넓게 펼쳐지는 초원 평야 바닥
  const southPlain = createBox(220, 2.0, 120, grassMat, 0, -1.02, 92, false);
  southPlain.receiveShadow = true;
  worldGroup.add(southPlain);

  // 평야 들판 패치
  [
    [-38, 52, 28, 16, fieldMat1],
    [ 38, 54, 30, 16, fieldMat2],
    [  0, 68, 36, 18, fieldMat1],
    [-46, 82, 34, 20, fieldMat2],
    [ 46, 84, 34, 20, fieldMat1]
  ].forEach(([px, pz, pw, pd, m]) => {
    worldGroup.add(createBox(pw, 0.12, pd, m, px, 0.04, pz, false));
  });

  // 평야 곳곳의 나무와 종려나무 숲
  [
    [-32, 42], [-18, 46], [18, 46], [32, 42],
    [-44, 60], [-24, 62], [24, 62], [44, 60],
    [-36, 76], [0, 78], [36, 76], [-52, 48], [52, 48]
  ].forEach(([tx, tz], idx) => {
    if (idx % 3 === 0) addPalmTree(tx, tz, 1.15, false);
    else addTree(tx, tz, 1.05 + (idx % 2) * 0.2, false);
  });

  // 남쪽 지평선 원경 다층 산맥과 구름
  [
    [-85, 122, 44, 26],
    [-42, 128, 48, 32],
    [  0, 132, 52, 36],
    [ 42, 128, 48, 32],
    [ 85, 122, 44, 26]
  ].forEach(([mx, mz, mw, mh], idx) => {
    worldGroup.add(
      createBox(mw, mh, 24, idx % 2 === 0 ? mtnMat1 : mtnMat3, mx, mh / 2 - 1, mz, false),
      createBox(mw * 0.75, mh * 0.6, 18, mtnMat2, mx + (idx % 2 === 0 ? 5 : -5), (mh * 0.6) / 2 - 1, mz - 12, false)
    );
  });

  [
    [-45, 26, 85, 1.3],
    [  0, 29, 98, 1.45],
    [ 48, 27, 88, 1.35]
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
  scene.fog = new THREE.Fog(0xbae6fd, 85, 240);

  const isKinder = (currentMode === 'kinder');
  const isJunior = (currentMode === 'junior');
  const halfW = 24;
  currentMapRectBounds = { minX: -halfW + 2.0, maxX: halfW - 2.0, minZ: -12.5, maxZ: 30.0 };

  davidHeldStones = 0;
  davidMaxStones = 5;
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

  if (currentMode === 'timeattack') {
    timeRemaining = 22.0;
  }

  // 1) 엘라 골짜기 기본 지형 & 다윗 뒤쪽(남쪽) 평야·산맥 배경
  const sandMat = new THREE.MeshLambertMaterial({ map: makeDesertSandTex() });
  const valleyGround = createBox(halfW * 2 + 24, 2, 72, sandMat, 0, -1.0, 8, false);
  valleyGround.receiveShadow = true;
  worldGroup.add(valleyGround);

  buildStage2SouthPlainAndMountains();

  // 2) [스테이지 2 요청사항 7] 골리앗과 다윗 사이를 S자 곡선으로 흐르는 시냇가 생성
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

  // 양옆 엘라 골짜기 절벽 산맥
  const cliffMat1 = matDavidCached('#d97706', '#92400e');
  const cliffMat2 = matDavidCached('#b45309', '#78350f');
  for (let z = -26; z <= 32; z += 9) {
    [-halfW - 6, halfW + 6].forEach((bx, sIdx) => {
      const h = 10 + (Math.abs(z + sIdx * 5) % 6);
      worldGroup.add(createBox(12, h, 9.2, (sIdx % 2 === 0 ? cliffMat1 : cliffMat2), bx, h / 2 - 0.5, z, false));
    });
  }

  // 3) 북쪽 블레셋 언덕 & 거대 골리앗 + [요청사항 1] 골리앗 주변 군인 20명 배치
  const northHillMat = matDavidCached('#78350f', '#451a03');
  worldGroup.add(
    createBox(halfW * 2 + 12, 3.2, 14, northHillMat, 0, 1.6, -21, false),
    createBox(halfW * 2 + 16, 7.5, 12, cliffMat2, 0, 3.75, -30, false)
  );

  const goliath = createGiantGoliathMesh();
  goliath.position.set(0, 3.1, -17.5);
  worldGroup.add(goliath);
  davidGoliathObj = goliath;

  // 골리앗 좌우 언덕 위에 블레셋 군인 20명 (좌측 10명, 우측 10명, 2열 진형)
  const philistineXList = [-21.5, -18.0, -14.5, -11.0, -7.5, 7.5, 11.0, 14.5, 18.0, 21.5];
  [-16.5, -20.2].forEach((rowZ, rIdx) => {
    philistineXList.forEach((px, cIdx) => {
      const idx = rIdx * 10 + cIdx;
      const pSol = createArmySoldierMesh(true, idx);
      pSol.position.set(px + (rIdx % 2 === 1 ? 0.6 : -0.6), 3.1, rowZ);
      pSol.rotation.y = 0; // 남쪽(다윗 쪽)을 바라봄
      worldGroup.add(pSol);
      davidPhilistineSoldiers.push({ mesh: pSol, phase: idx * 0.55 });
    });
  });

  // 4) [요청사항 2] 다윗 뒤쪽 남쪽 진영에 아군 이스라엘 군인 20명 배치 (2열 진형)
  const israelXList = [-20.5, -16.5, -12.5, -8.5, -4.5, 4.5, 8.5, 12.5, 16.5, 20.5];
  [30.5, 34.0].forEach((rowZ, rIdx) => {
    israelXList.forEach((ix, cIdx) => {
      const idx = rIdx * 10 + cIdx;
      const iSol = createArmySoldierMesh(false, idx);
      iSol.position.set(ix + (rIdx % 2 === 1 ? 0.5 : -0.5), 0, rowZ);
      iSol.rotation.y = Math.PI; // 북쪽(골리앗 쪽)을 바라봄
      worldGroup.add(iSol);
      davidIsraelSoldiers.push({ mesh: iSol, phase: idx * 0.55 });
    });
  });

  // 발사된 물맷돌 메쉬
  const projMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 10, 10),
    new THREE.MeshBasicMaterial({ color: 0xfef08a })
  );
  projMesh.visible = false;
  worldGroup.add(projMesh);
  davidFlyingStone.mesh = projMesh;

  // 5) 물맷돌 조준·발사 영역 (z = -6.5, 들어가면 자동으로 조준창 오픈)
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
    label: createWorldLabel(`🎯 물맷돌 자동 조준 영역 (투구 위 우상 ${davidIdolHits}/${davidReqIdolHits} 타격)`),
    triggered: false
  };

  // 6) 곡선 시냇가 물맷돌 5개 스폰
  spawnBrookSlingStones(5);

  // 7) 골리앗이 던지는 낙석/충격파 위험 구역 생성
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
  if (guideArrowGroup) guideArrowGroup.visible = (currentMode !== 'senior');
  snapCameraToPlayer();
  updateStageHUD();
  showToast('🪨 곡선 시냇가에서 물맷돌을 주운 뒤, 골리앗 앞 노란 조준 영역에 들어가면 자동으로 조준창이 열립니다!');
}

// -------------------------------------------------------------------------
// 3. 물맷돌 회전 & 픽셀아트 집중 조준 화면(UI) 제어 및 발사 판정
// -------------------------------------------------------------------------
function openDavidAimOverlay() {
  if (davidAimState.active || davidFlyingStone.active || davidStage2Cutscene.active) return;
  if (davidHeldStones <= 0) {
    playSfx('wrong');
    showToast('🪨 물맷돌이 없어요! 먼저 시냇가에서 매끄러운 물맷돌을 주워오세요!');
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
  if (typeof renderDavidPixelAimScreen === 'function') {
    renderDavidPixelAimScreen(davidAimState.reticleX, davidAimState.reticleY, davidAimState.targetX, davidAimState.targetY, performance.now());
  }
}

window.closeDavidAimOverlay = function () {
  davidAimState.active = false;
  // 피하기 버튼을 눌렀을 때 조준 발판 밖으로 걸어 나갈 수 있도록 2.2초 동안 자동 재오픈 유예
  davidAimAutoCooldown = 2.2;
  const overlay = document.getElementById('david-aim-overlay');
  if (overlay) overlay.classList.add('hidden');
  if (playerLimbs && playerLimbs.rArm) playerLimbs.rArm.rotation.x = 0;
};

window.fireDavidSlingAtIdol = function () {
  if (!davidAimState.active || davidHeldStones <= 0) return;

  davidHeldStones--;
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
  davidAimAutoCooldown = 1.35;

  davidFlyingStone.active = true;
  davidFlyingStone.timer = 0;
  davidFlyingStone.duration = 0.52;
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

function triggerDavidStage2Action(targetObj) {
  openDavidAimOverlay();
}

function updateDavidStage2HUD(badge, countIcon, countText, missionText) {
  updateDavidCarriedStonesVisual();
  badge.textContent = '엘라 골짜기 · 스테이지 2';
  countIcon.textContent = '🗿';
  countText.textContent = `우상 타격 ${davidIdolHits}/${davidReqIdolHits}`;
  missionText.textContent = '곡선 시냇가에서 물맷돌을 모은 뒤 골리앗 앞 노란 조준 영역에 들어가 투구 위 우상을 맞히세요!';
}

// -------------------------------------------------------------------------
// 4. 스테이지 2 프레임 업데이트 & 골리앗 우상 파괴 승리 컷신
// -------------------------------------------------------------------------
function updateDavidStage2Frame(dt, now) {
  if (davidAimAutoCooldown > 0) davidAimAutoCooldown -= dt;

  flowingWaterTextures.forEach(tex => {
    tex.offset.x = (tex.offset.x + dt * 0.38) % 1;
  });

  // 골리앗 주변 블레셋 군인 20명 창 흔들기 모션
  davidPhilistineSoldiers.forEach(s => {
    if (s.mesh.userData && s.mesh.userData.rArm) {
      s.mesh.userData.rArm.rotation.x = -0.35 + Math.sin(now * 0.007 + s.phase) * 0.30;
    }
  });

  // 다윗 뒤편 아군 이스라엘 군인 20명 응원 모션
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

  // 1) 집중 조준 모달이 열려 있을 때: 도트 픽셀아트 조준 캔버스 실시간 렌더링
  if (davidAimState.active) {
    davidAimState.phase += dt;
    if (playerLimbs && playerLimbs.rArm) {
      playerLimbs.rArm.rotation.x = -2.4 + Math.sin(now * 0.035) * 0.85;
    }
    camera.position.lerp(new THREE.Vector3(playerPos.x * 0.4, 7.2, -3.5), 0.12);
    camera.lookAt(0, 12.2, -17.5);

    const isKinder = (currentMode === 'kinder');
    const isHard = (currentMode === 'senior' || currentMode === 'timeattack');
    const spd = isKinder ? 1.8 : (isHard ? 3.4 : 2.5);

    davidAimState.reticleX = 108 + Math.sin(davidAimState.phase * spd) * 82;
    davidAimState.reticleY = isHard
      ? (36 + Math.sin(davidAimState.phase * spd * 2.0) * 22)
      : (36 + Math.cos(davidAimState.phase * spd) * 10);

    davidAimState.targetX = isHard
      ? (104 + Math.cos(davidAimState.phase * 1.9) * 34)
      : (104 + Math.sin(davidAimState.phase * 1.1) * (isKinder ? 0 : 16));
    davidAimState.targetY = 34;

    if (typeof renderDavidPixelAimScreen === 'function') {
      renderDavidPixelAimScreen(
        davidAimState.reticleX,
        davidAimState.reticleY,
        davidAimState.targetX,
        davidAimState.targetY,
        now
      );
    }
    return;
  }

  // 2) 발사된 3D 물맷돌 비행 및 투구 위 우상 타격 처리
  if (davidFlyingStone.active) {
    davidFlyingStone.timer += dt;
    const p = Math.min(1, davidFlyingStone.timer / davidFlyingStone.duration);
    const curPos = new THREE.Vector3().lerpVectors(davidFlyingStone.startPos, davidFlyingStone.endPos, p);
    curPos.y += Math.sin(p * Math.PI) * 3.8;
    if (davidFlyingStone.mesh) {
      davidFlyingStone.mesh.position.copy(curPos);
    }
    camera.lookAt(curPos.x, curPos.y, curPos.z);

    if (p >= 1) {
      davidFlyingStone.active = false;
      if (davidFlyingStone.mesh) davidFlyingStone.mesh.visible = false;

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
            targetObject.label.innerHTML = `🎯 물맷돌 자동 조준 영역 (투구 위 우상 ${davidIdolHits}/${davidReqIdolHits} 타격)`;
          }
          updateStageHUD();
          showToast(`🎯 명중! 골리앗 투구 위의 우상 장식이 금이 갔어요! (${davidIdolHits}/${davidReqIdolHits}회 성공)`);
        }
      } else {
        playSfx('wrong');
        showToast('💦 아깝게 빗나갔어요! 픽셀 십자선이 우상 중앙에 겹칠 때 발사하세요!');
      }
    }
    return;
  }

  // 3) 곡선 시냇가 물맷돌 이동 및 수집
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
          showToast('🪨 물맷돌 주머니(5개)가 가득 찼어요! 앞쪽 노란 조준 영역으로 가세요!');
        }
        return;
      }
      st.collected = true;
      st.respawnTimer = 6.0;
      st.group.visible = false;
      st.label.style.opacity = '0';
      davidHeldStones++;
      updateDavidCarriedStonesVisual();
      playSfx('rescue');
      if (currentMode === 'timeattack') timeRemaining += 3.0;
      showToast(`🪨 매끄러운 물맷돌 획득! (보유 ${davidHeldStones}/5개 · 골리앗 앞 조준 영역으로 가세요!)`);
    }
  });

  // 4) 골리앗의 바위 공격 경고 및 낙하 판정
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
          updateDavidCarriedStonesVisual();
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

  // 5) [스테이지 2 요청사항 4] 골리앗 앞 조준 영역에 들어가면 자동으로 조준창 오픈!
  if (targetObject && !targetObject.triggered) {
    const td = Math.hypot(playerPos.x - targetObject.pos.x, playerPos.z - targetObject.pos.z);
    updateWorldLabelPos(targetObject.label, targetObject.pos, td < 28);

    const ctxBtn = document.getElementById('context-action-btn');
    const pBtn = document.getElementById('puzzle-build-btn');
    pBtn.classList.add('hidden');

    if (td < 3.4) {
      if (davidHeldStones > 0) {
        ctxBtn.classList.remove('hidden');
        ctxBtn.textContent = '🎯 물맷돌 돌려 투구 위 우상 조준하기!';
        // 조준 영역 안에 들어오면 자동으로 조준창 오픈 (피하기 직후 쿨타임 중에는 수동 버튼도 함께 제공)
        if (davidAimAutoCooldown <= 0) {
          openDavidAimOverlay();
          return;
        }
      } else if (davidAimAutoCooldown <= 0) {
        davidAimAutoCooldown = 1.8;
        showToast('🪨 먼저 뒤쪽 곡선 시냇가에서 물맷돌을 주워오세요!');
      }
    } else if (playerPos.z < -1.0 && davidHeldStones > 0) {
      ctxBtn.classList.remove('hidden');
      ctxBtn.textContent = '🎯 여기서 물맷돌 조준하기!';
    } else {
      ctxBtn.classList.add('hidden');
    }

    if (guideArrowGroup && guideArrowGroup.visible) {
      const guidePt = (davidHeldStones > 0) ? targetObject.pos : (nearestStone || targetObject.pos);
      guideArrowGroup.rotation.y = Math.atan2(guidePt.x - playerPos.x, guidePt.z - playerPos.z) - playerFacing;
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
  // [스테이지 2 요청사항 3] 골리앗이 무너지면 즉시 평온한 하프 BGM으로 전환되어 퀴즈 풀 때까지 유지됨
  startStageBgm(2);
  playSfx('clear');
  showToast('✨ 물맷돌이 골리앗 투구 위의 우상 장식을 산산조각 냈습니다! 골리앗이 무너져 내립니다!');
}

function updateDavidStage2CutsceneFrame(dt, now) {
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

  // 골리앗 주변 블레셋 군인 20명은 당황하며 흔들리고, 다윗 뒤편 이스라엘 군인 20명은 기뻐 뛰며 환호!
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
// =========================================================================
// [ep3_david.js - 파트 4/5] 에피소드 3 : 스테이지 3 (다윗성 성벽·확장 건물 미로·난이도별 랜덤 자원·소형 퀘스트 UI)
// - 진행 중인 퀘스트 소형 UI 배지(ensureDavidStage3QuestMiniUI) 및 단일 퀘스트 잠금 상태(davidActiveQuestNpc)
// - 퀘스트 수락 시 자원 0 초기화 및 난이도별(유치: 쉬움 / 유년: 중간 / 소년: 어려움) 랜덤 위치 스폰
// - 외곽 성벽(반투명 시야 보장), 남쪽 성문과 성벽 밖 곧은 길, 2층 건물 8채 및 상가·행인 배치
// =========================================================================

let davidCityNpcs = [];
let davidCityResources = [];
let davidRetainers = [];
let davidCityShopkeepers = [];
let davidCityPedestrians = [];
let davidCityBuildingBoxes = [];
let davidInventory = { wood: 0, stone: 0, iron: 0 };
let davidActiveQuestNpc = null; // 현재 진행 중인 단일 퀘스트 NPC (진행 중엔 다른 NPC 퀘스트 불가)
let davidActiveNearNpc = null;
let davidDialogTargetNpc = null;
let davidNpcAutoDialogCooldown = 0;
let davidProphetUnlocked = false;
let davidCityBuildings = {
  marketGroup: null,
  houseGroup: null,
  gateGroup: null
};

// 엔딩 빈 왕좌 착석 & 메시아 성경절 연출 상태
let davidThroneEnding = {
  throneGroup: null,
  arrowGroup: null,
  seated: false,
  seatTimer: 0,
  modalShown: false
};

// -------------------------------------------------------------------------
// 1. 스테이지 3 전용 소형 퀘스트 UI 창 생성 및 실시간 갱신
// -------------------------------------------------------------------------
function ensureDavidStage3QuestMiniUI() {
  const uiRoot = ensureDavidCustomUI();
  let tracker = document.getElementById('david-st3-quest-tracker');
  if (!tracker) {
    tracker = document.createElement('div');
    tracker.id = 'david-st3-quest-tracker';
    tracker.className =
      'hidden mt-16 mc-panel px-4 py-2 rounded-2xl bg-slate-900/90 border-2 border-amber-400 text-white shadow-xl flex flex-col gap-1 min-w-[240px] max-w-[310px]';
    tracker.innerHTML = `
      <div class="flex items-center justify-between gap-2 border-b border-slate-700 pb-1">
        <span class="text-[11px] font-jua text-amber-300">📜 진행 중인 퀘스트</span>
        <span id="david-st3-quest-npc" class="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-[11px] font-jua text-amber-200">없음</span>
      </div>
      <div id="david-st3-quest-detail" class="text-xs font-bold text-sky-200 text-center py-0.5">
        빛기둥 아래 백성을 만나 요청을 들어보세요!
      </div>
    `;
    uiRoot.insertBefore(tracker, uiRoot.firstChild);
  }
  return tracker;
}

function updateDavidStage3QuestMiniUI() {
  const tracker = ensureDavidStage3QuestMiniUI();
  if (currentEpisode !== 'david' || currentStage !== 3 || davidStage3Cutscene.active) {
    tracker.classList.add('hidden');
    return;
  }

  // 현재 수락하여 진행 중인 퀘스트가 있을 때만 화면에 작게 표시
  if (!davidActiveQuestNpc) {
    if (davidProphetUnlocked) {
      tracker.classList.remove('hidden');
      document.getElementById('david-st3-quest-npc').textContent = '✨ 나단 선지자';
      document.getElementById('david-st3-quest-detail').innerHTML =
        '<span class="text-emerald-300">북쪽 성막 앞 나단 선지자에게 가세요!</span>';
    } else {
      tracker.classList.add('hidden');
    }
    return;
  }

  tracker.classList.remove('hidden');
  const npcBadge = document.getElementById('david-st3-quest-npc');
  const detailEl = document.getElementById('david-st3-quest-detail');
  npcBadge.textContent = davidActiveQuestNpc.roleTitle;

  const req = davidActiveQuestNpc.req;
  if (!req) {
    detailEl.textContent = '요청을 수행하세요!';
    return;
  }

  const parts = [];
  if (req.wood > 0) {
    const done = davidInventory.wood >= req.wood;
    parts.push(`<span class="${done ? 'text-emerald-300' : 'text-amber-200'}">🪵나무 ${Math.min(davidInventory.wood, req.wood)}/${req.wood}</span>`);
  }
  if (req.stone > 0) {
    const done = davidInventory.stone >= req.stone;
    parts.push(`<span class="${done ? 'text-emerald-300' : 'text-sky-200'}">🪨돌 ${Math.min(davidInventory.stone, req.stone)}/${req.stone}</span>`);
  }
  if (req.iron > 0) {
    const done = davidInventory.iron >= req.iron;
    parts.push(`<span class="${done ? 'text-emerald-300' : 'text-orange-200'}">⚙️철 ${Math.min(davidInventory.iron, req.iron)}/${req.iron}</span>`);
  }

  const allCollected =
    davidInventory.wood >= req.wood &&
    davidInventory.stone >= req.stone &&
    davidInventory.iron >= req.iron;

  if (allCollected) {
    detailEl.innerHTML = `${parts.join(' · ')} <div class="text-[11px] text-emerald-300 mt-0.5 animate-pulse">✅ 수집 완료! ${davidActiveQuestNpc.roleTitle}에게 돌아가세요!</div>`;
  } else {
    detailEl.innerHTML = `${parts.join(' · ')} <div class="text-[10px] text-slate-300 mt-0.5">(완료 전까지 다른 퀘스트 진행 불가)</div>`;
  }
}

// -------------------------------------------------------------------------
// 2. 다윗성 전용 석조 타일 바닥 텍스처 & 건물 충돌·끼임 방지 등록 함수
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

function registerCitySolidBox(cx, cz, w, d, topY, pad = 0.30) {
  const minX = cx - w / 2 - pad;
  const maxX = cx + w / 2 + pad;
  const minZ = cz - d / 2 - pad;
  const maxZ = cz + d / 2 + pad;
  colliders.push({ minX, maxX, minZ, maxZ });
  platforms.push({ minX, maxX, minZ, maxZ, topY });
  davidCityBuildingBoxes.push({ minX, maxX, minZ, maxZ, topY });
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

      if (minSide === dLeft) playerPos.x = b.minX - 0.15;
      else if (minSide === dRight) playerPos.x = b.maxX + 0.15;
      else if (minSide === dNorth) playerPos.z = b.minZ - 0.15;
      else playerPos.z = b.maxZ + 0.15;
    }
  }
}

// -------------------------------------------------------------------------
// 3. 맵 가장자리 성벽(반투명 시야 보장) 및 성벽 밖 곧은 길 생성
// -------------------------------------------------------------------------
function buildDavidCastleWallPerimeter(limit, withSouthGate = true) {
  const wallBaseMat = matVoxel('#d6c3a5', '#b89f7a');
  const wallTrimMat = matVoxel('#b45309', '#78350f');
  const towerBaseMat = matVoxel('#cbb492', '#9c825e');
  const wallH = 8.2;
  const wallThick = 3.4;
  const segLen = 12.0;

  const addTransparentWallSegment = (w, h, d, x, y, z, isTrim = false) => {
    const mat = (isTrim ? wallTrimMat : wallBaseMat).clone();
    const box = createBox(w, h, d, mat, x, y, z);
    worldGroup.add(box);
    wallMeshes.push(box);
    return box;
  };

  for (let x = -limit; x <= limit; x += segLen) {
    addTransparentWallSegment(segLen + 0.15, wallH, wallThick, x, wallH / 2, -limit, false);
    addTransparentWallSegment(segLen + 0.35, 0.55, wallThick + 0.4, x, wallH + 0.25, -limit, true);
    [-3.6, 0, 3.6].forEach(ox => {
      addTransparentWallSegment(2.0, 1.2, wallThick + 0.2, x + ox, wallH + 1.1, -limit, false);
    });

    if (withSouthGate && Math.abs(x) < 12.5) continue;
    addTransparentWallSegment(segLen + 0.15, wallH, wallThick, x, wallH / 2, limit, false);
    addTransparentWallSegment(segLen + 0.35, 0.55, wallThick + 0.4, x, wallH + 0.25, limit, true);
    [-3.6, 0, 3.6].forEach(ox => {
      addTransparentWallSegment(2.0, 1.2, wallThick + 0.2, x + ox, wallH + 1.1, limit, false);
    });
  }

  for (let z = -limit; z <= limit; z += segLen) {
    addTransparentWallSegment(wallThick, wallH, segLen + 0.15, -limit, wallH / 2, z, false);
    addTransparentWallSegment(wallThick + 0.4, 0.55, segLen + 0.35, -limit, wallH + 0.25, z, true);
    [-3.6, 0, 3.6].forEach(oz => {
      addTransparentWallSegment(wallThick + 0.2, 1.2, 2.0, -limit, wallH + 1.1, z + oz, false);
    });

    addTransparentWallSegment(wallThick, wallH, segLen + 0.15, limit, wallH / 2, z, false);
    addTransparentWallSegment(wallThick + 0.4, 0.55, segLen + 0.35, limit, wallH + 0.25, z, true);
    [-3.6, 0, 3.6].forEach(oz => {
      addTransparentWallSegment(wallThick + 0.2, 1.2, 2.0, limit, wallH + 1.1, z + oz, false);
    });
  }

  const towerCoords = [
    [-limit, -limit], [limit, -limit], [-limit, limit], [limit, limit],
    [-limit, 0], [limit, 0], [0, -limit]
  ];
  towerCoords.forEach(([tx, tz]) => {
    const tBody = createBox(6.8, wallH + 3.2, 6.8, towerBaseMat.clone(), tx, (wallH + 3.2) / 2, tz);
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
  const lEye = createBox(0.10, 0.10, 0.05, eyeMat, -0.15, 2.06, 0.36);
  const rEye = createBox(0.10, 0.10, 0.05, eyeMat,  0.15, 2.06, 0.36);

  const lArm = new THREE.Group(); lArm.position.set(-0.54, 1.50, 0);
  lArm.add(createBox(0.26, 0.62, 0.26, tunicMat, 0, -0.26, 0), createBox(0.22, 0.18, 0.22, skin, 0, -0.62, 0));

  const rArm = new THREE.Group(); rArm.position.set(0.54, 1.50, 0);
  rArm.add(createBox(0.26, 0.62, 0.26, tunicMat, 0, -0.26, 0), createBox(0.22, 0.18, 0.22, skin, 0, -0.62, 0));

  const packGroup = new THREE.Group();
  packGroup.position.set(0, 1.18, -0.42);
  g.add(packGroup);

  g.add(lLeg, rLeg, torso, sash, belt, head, hair, headband, lEye, rEye, lArm, rArm);
  g.userData = { lLeg, rLeg, lArm, rArm, packGroup };
  return g;
}

// -------------------------------------------------------------------------
// 5. 다윗성 랜드마크, 빈틈없는 2층 건물, 상가 건물, 성벽까지 확장된 건물 미로 빌더
// -------------------------------------------------------------------------
function buildDavidCityPalace(cx, cz) {
  const stoneMat = matVoxel('#fde68a', '#eab308');
  const cedarMat = matVoxel('#78350f', '#451a03');
  const goldMat = matDavidCached('#facc15', '#ca8a04');
  const colMat = matVoxel('#f8fafc', '#cbd5e1');

  const base = createBox(20, 1.2, 14, stoneMat.clone(), cx, 0.6, cz);
  const mainHall = createBox(18, 6.5, 11, stoneMat.clone(), cx, 4.4, cz);
  const cedarRoof = createBox(19.2, 0.9, 12.2, cedarMat.clone(), cx, 8.0, cz);
  const upperTower = createBox(10, 4.2, 7, stoneMat.clone(), cx, 10.5, cz - 1.0);
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
  const wallMat = matVoxel(colorVariant % 2 === 0 ? '#fde68a' : '#fed7aa', '#d97706').clone();
  const trimMat = matVoxel('#92400e', '#5c2d0c').clone();
  const stairMat = matVoxel('#cbd5e1', '#64748b').clone();
  const awningMat = matVoxel(colorVariant % 2 === 0 ? '#0284c7' : '#16a34a', '#0f172a').clone();

  const w = 9.0, h1 = 3.6, d = 7.4;

  const body1F = createBox(w, h1, d, wallMat, cx, h1 / 2, cz);
  const slab2F = createBox(w + 0.4, 0.30, d + 0.4, trimMat, cx, h1 - 0.12, cz);
  const door1F = createBox(1.6, 2.4, 0.25, trimMat, cx, 1.2, cz + d / 2 + 0.08);
  worldGroup.add(body1F, slab2F, door1F);
  wallMeshes.push(body1F, slab2F);

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
  const body2F = createBox(roomW, roomH, roomD, wallMat.clone(), roomX, h1 + roomH / 2, roomZ);
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
  const wallMat = matVoxel(idx % 2 === 0 ? '#fde68a' : '#fed7aa', '#d97706');
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
    const backWall = createBox(w, h, 0.8, wallMat.clone(), cx, h / 2, cz - fSign * (d / 2 - 0.4));
    const sideL = createBox(0.8, h, d, wallMat.clone(), cx - w / 2 + 0.4, h / 2, cz);
    const sideR = createBox(0.8, h, d, wallMat.clone(), cx + w / 2 - 0.4, h / 2, cz);
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
    const backWall = createBox(0.8, h, d, wallMat.clone(), cx - fSign * (w / 2 - 0.4), h / 2, cz);
    const sideN = createBox(w, h, 0.8, wallMat.clone(), cx, h / 2, cz - d / 2 + 0.4);
    const sideS = createBox(w, h, 0.8, wallMat.clone(), cx, h / 2, cz + d / 2 - 0.4);
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
  const palettes = [
    ['#fde68a', '#d97706'],
    ['#fed7aa', '#ea580c'],
    ['#fef08a', '#ca8a04'],
    ['#e7e5e4', '#a8a29e']
  ];
  const [c1, c2] = palettes[variant % palettes.length];
  const wallMat = matVoxel(c1, c2).clone();
  const roofMat = matVoxel('#92400e', '#5c2d0c').clone();
  const winMat = matDavidCached('#1e293b');
  const doorMat = matDavidCached('#451a03');

  const body = createBox(w, h, d, wallMat, cx, h / 2, cz);
  const roof = createBox(w + 0.4, 0.45, d + 0.4, roofMat, cx, h + 0.22, cz);
  worldGroup.add(body, roof);
  wallMeshes.push(body, roof);

  if (w >= d) {
    const count = Math.max(1, Math.floor(w / 7.5));
    for (let i = 0; i < count; i++) {
      const ox = -w / 2 + (i + 0.5) * (w / count);
      worldGroup.add(
        createBox(1.4, 2.3, 0.18, doorMat, cx + ox, 1.15, cz + d / 2 + 0.06),
        createBox(1.1, 1.1, 0.18, winMat, cx + ox + 1.8, 2.6, cz + d / 2 + 0.06),
        createBox(1.1, 1.1, 0.18, winMat, cx + ox - 1.8, 2.6, cz - d / 2 - 0.06)
      );
    }
  } else {
    const count = Math.max(1, Math.floor(d / 7.5));
    for (let i = 0; i < count; i++) {
      const oz = -d / 2 + (i + 0.5) * (d / count);
      worldGroup.add(
        createBox(0.18, 2.3, 1.4, doorMat, cx + w / 2 + 0.06, 1.15, cz + oz),
        createBox(0.18, 1.1, 1.1, winMat, cx + w / 2 + 0.06, 2.6, cz + oz + 1.8),
        createBox(0.18, 1.1, 1.1, winMat, cx - w / 2 - 0.06, 2.6, cz + oz - 1.8)
      );
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
    { x: -54, z: -48, side: 'east', var: 0 },
    { x:  54, z:  48, side: 'west', var: 1 }
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
    { x: -18, z:  59, w: 11.0, h: 4.8, d: 7.5, v: 0 },

    { x:  60, z:  16, w: 7.5, h: 4.8, d: 22.0, v: 3 },
    { x:  42, z:   8, w: 8.5, h: 4.5, d: 12.0, v: 1 },
    { x:  60, z:  46, w: 7.5, h: 4.8, d: 24.0, v: 0 },
    { x:  40, z:  60, w: 28.0, h: 4.8, d: 7.5, v: 2 },
    { x:  34, z:  48, w: 18.0, h: 4.6, d: 7.5, v: 1 },
    { x:  31, z:  32, w: 8.0, h: 4.6, d: 18.0, v: 3 },
    { x:  30, z:  20, w: 10.0, h: 4.5, d: 7.0, v: 0 },
    { x:  18, z:  46, w: 10.0, h: 4.8, d: 7.5, v: 2 },
    { x:  18, z:  59, w: 11.0, h: 4.8, d: 7.5, v: 1 }
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
    { x1: -10, z1:   8, x2:  10, z2:   8,요청하신 **[에피소드 3 : 스테이지 3]**의 3가지 규칙(진행 중 퀘스트 소형 UI 표시 및 타 NPC 퀘스트 잠금, 퀘스트 수락 즉시 보유 자원 0 초기화, 난이도별 맞춤형 랜덤 자원 스폰)은 **파트 4/5**와 **파트 5/5**에 반영됩니다. *(파트 1/5 ~ 파트 3/5은 수정 없이 그대로 유지하시면 됩니다.)*

### 주요 반영 내역
1. **소형 퀘스트 알림창 UI 및 단일 퀘스트 진행 잠금 (`ensureDavidStage3QuestTrackerUI` / `davidCurrentActiveQuestNpc`)**:
   * NPC에게 퀘스트를 받으면 화면 상단에 **현재 진행 중인 퀘스트와 실시간 자원 수집 현황(예: `📜 [🏪 상인] 🪵 나무 0/2개`)을 보여주는 소형 알림창**이 뜹니다.
   * 한 NPC의 퀘스트를 진행하는 동안에는 다른 NPC의 퀘스트를 중복해서 받을 수 없도록 잠기며, 다른 NPC에게 다가가면 현재 맡은 퀘스트를 먼저 해결해 달라고 안내합니다.
2. **퀘스트 수락 순간 보유 자원 초기화 (`resetDavidStage3InventoryAndRespawnResources`)**:
   * 퀘스트를 받기 전이나 이전 과정에서 자원을 미리 많이 모아 두었더라도, **새 NPC의 퀘스트를 받는 순간 보유 자원(`나무·돌·철`)과 신하들의 등짐이 모두 `0`으로 초기화**되어 그 순간부터 새로 수집을 시작합니다.
3. **난이도별(유치·유년·소년) 랜덤 자원 스폰 (`spawnRandomizedStage3Resources`)**:
   * **유치반(`kinder`)**: 중앙 광장과 대로변, 퀘스트 NPC 주변의 넓고 눈에 잘 띄는 1층 길가에 랜덤 스폰됩니다.
   * **유년반(`junior`)**: 중간 미로 골목길과 상가 골목, 일부 2층 건물 옥상에 골고루 섞여 랜덤 스폰됩니다.
   * **소년반·타임어택(`senior` / `timeattack`)**: 성벽 끝 외곽 골목, 건물 미로의 깊은 막다른 길, 2층 건물 옥상 테라스 등 찾기 어려운 은신처 후보지들 중에서 매번 랜덤으로 스폰됩니다.

먼저 **파트 4/5 (`ep3_david.js` - 4/5)** 코드를 출력합니다.

---

### 파트 4 (`ep3_david.js` - 4/5 : 소형 퀘스트 UI, 난이도별 랜덤 자원 스폰, 자원 초기화 및 성벽 미로 도시 월드)

```javascript
// =========================================================================
// [ep3_david.js - 파트 4/5] 에피소드 3 : 스테이지 3 월드, 소형 퀘스트 UI 및 난이도별 랜덤 자원 스폰
// - 소형 진행 퀘스트 표시창(ensureDavidStage3QuestTrackerUI) 및 단일 퀘스트 잠금 상태(davidCurrentActiveQuestNpc)
// - 퀘스트 수락 즉시 보유 자원 0 초기화(resetDavidStage3InventoryAndRespawnResources)
// - 난이도별(유치: 쉬움 / 유년: 중간 / 소년·타임어택: 어려움) 랜덤 자원 스폰 시스템
// =========================================================================

let davidCityNpcs = [];
let davidCityResources = [];
let davidRetainers = [];
let davidCityShopkeepers = [];
let davidCityPedestrians = [];
let davidCityBuildingBoxes = [];
let davidInventory = { wood: 0, stone: 0, iron: 0 };
let davidCurrentActiveQuestNpc = null; // 현재 진행 중인 단일 퀘스트 NPC
let davidActiveNearNpc = null;
let davidDialogTargetNpc = null;
let davidNpcAutoDialogCooldown = 0;
let davidProphetUnlocked = false;
let davidCityBuildings = {
  marketGroup: null,
  houseGroup: null,
  gateGroup: null
};

// 엔딩 빈 왕좌 착석 & 메시아 성경절 연출 상태
let davidThroneEnding = {
  throneGroup: null,
  arrowGroup: null,
  seated: false,
  seatTimer: 0,
  modalShown: false
};

// -------------------------------------------------------------------------
// 1. 진행 중인 퀘스트 소형 UI 표시기 & 도시 석조 바닥 텍스처·충돌 유틸리티
// -------------------------------------------------------------------------
function ensureDavidStage3QuestTrackerUI() {
  const uiRoot = ensureDavidCustomUI();
  let tracker = document.getElementById('david-st3-quest-tracker');
  if (!tracker) {
    tracker = document.createElement('div');
    tracker.id = 'david-st3-quest-tracker';
    tracker.className =
      'hidden mt-16 mc-panel px-4 py-2 rounded-2xl bg-slate-900/90 border-2 border-amber-400 text-white shadow-xl flex flex-col gap-1 min-w-[250px] max-w-[330px]';
    tracker.innerHTML = `
      <div class="flex items-center justify-between gap-3 border-b border-slate-700 pb-1">
        <span id="david-st3-quest-title" class="text-xs font-jua text-amber-300">📜 진행 중인 퀘스트</span>
        <span class="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-[10px] font-bold text-amber-200">진행 중</span>
      </div>
      <div id="david-st3-quest-reqs" class="text-xs font-bold text-emerald-300 text-center py-0.5"></div>
      <div id="david-st3-quest-hint" class="text-[10px] text-slate-300 text-center">완료 전까지 다른 퀘스트는 진행할 수 없어요</div>
    `;
    uiRoot.appendChild(tracker);
  }
  return tracker;
}

function updateDavidStage3QuestTrackerUI() {
  const tracker = ensureDavidStage3QuestTrackerUI();
  if (currentEpisode !== 'david' || currentStage !== 3 || !davidCurrentActiveQuestNpc || davidCurrentActiveQuestNpc.completed) {
    tracker.classList.add('hidden');
    return;
  }

  const npc = davidCurrentActiveQuestNpc;
  tracker.classList.remove('hidden');

  const titleEl = document.getElementById('david-st3-quest-title');
  const reqsEl = document.getElementById('david-st3-quest-reqs');
  const hintEl = document.getElementById('david-st3-quest-hint');

  if (titleEl) titleEl.textContent = `📜 ${npc.roleTitle}의 요청`;

  if (npc.req && reqsEl) {
    const parts = [];
    if (npc.req.wood > 0) {
      const wDone = davidInventory.wood >= npc.req.wood;
      parts.push(`<span class="${wDone ? 'text-emerald-300' : 'text-amber-200'}">🪵 나무 ${Math.min(davidInventory.wood, npc.req.wood)}/${npc.req.wood}</span>`);
    }
    if (npc.req.stone > 0) {
      const sDone = davidInventory.stone >= npc.req.stone;
      parts.push(`<span class="${sDone ? 'text-emerald-300' : 'text-sky-200'}">🪨 돌 ${Math.min(davidInventory.stone, npc.req.stone)}/${npc.req.stone}</span>`);
    }
    if (npc.req.iron > 0) {
      const iDone = davidInventory.iron >= npc.req.iron;
      parts.push(`<span class="${iDone ? 'text-emerald-300' : 'text-orange-200'}">⚙️ 철 ${Math.min(davidInventory.iron, npc.req.iron)}/${npc.req.iron}</span>`);
    }
    reqsEl.innerHTML = parts.join(' &nbsp;·&nbsp; ');

    const allMet =
      davidInventory.wood >= npc.req.wood &&
      davidInventory.stone >= npc.req.stone &&
      davidInventory.iron >= npc.req.iron;

    if (hintEl) {
      hintEl.textContent = allMet
        ? `✅ 자재를 모두 모았어요! ${npc.roleTitle}에게 돌아가세요!`
        : `자재를 모두 모아 ${npc.roleTitle}에게 전달하세요 (타 퀘스트 잠금)`;
      hintEl.className = allMet
        ? 'text-[11px] font-bold text-yellow-300 text-center animate-pulse'
        : 'text-[10px] text-slate-300 text-center';
    }
  }
}

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

function registerCitySolidBox(cx, cz, w, d, topY, pad = 0.30) {
  const minX = cx - w / 2 - pad;
  const maxX = cx + w / 2 + pad;
  const minZ = cz - d / 2 - pad;
  const maxZ = cz + d / 2 + pad;
  colliders.push({ minX, maxX, minZ, maxZ });
  platforms.push({ minX, maxX, minZ, maxZ, topY });
  davidCityBuildingBoxes.push({ minX, maxX, minZ, maxZ, topY });
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

      if (minSide === dLeft) playerPos.x = b.minX - 0.15;
      else if (minSide === dRight) playerPos.x = b.maxX + 0.15;
      else if (minSide === dNorth) playerPos.z = b.minZ - 0.15;
      else playerPos.z = b.maxZ + 0.15;
    }
  }
}

// -------------------------------------------------------------------------
// 2. 맵 가장자리 성벽(반투명 시야 보장) 및 성벽 밖 곧은 길 생성
// -------------------------------------------------------------------------
function buildDavidCastleWallPerimeter(limit, withSouthGate = true) {
  const wallBaseMat = matVoxel('#d6c3a5', '#b89f7a');
  const wallTrimMat = matVoxel('#b45309', '#78350f');
  const towerBaseMat = matVoxel('#cbb492', '#9c825e');
  const wallH = 8.2;
  const wallThick = 3.4;
  const segLen = 12.0;

  const addTransparentWallSegment = (w, h, d, x, y, z, isTrim = false) => {
    const mat = (isTrim ? wallTrimMat : wallBaseMat).clone();
    const box = createBox(w, h, d, mat, x, y, z);
    worldGroup.add(box);
    wallMeshes.push(box);
    return box;
  };

  for (let x = -limit; x <= limit; x += segLen) {
    addTransparentWallSegment(segLen + 0.15, wallH, wallThick, x, wallH / 2, -limit, false);
    addTransparentWallSegment(segLen + 0.35, 0.55, wallThick + 0.4, x, wallH + 0.25, -limit, true);
    [-3.6, 0, 3.6].forEach(ox => {
      addTransparentWallSegment(2.0, 1.2, wallThick + 0.2, x + ox, wallH + 1.1, -limit, false);
    });

    if (withSouthGate && Math.abs(x) < 12.5) continue;
    addTransparentWallSegment(segLen + 0.15, wallH, wallThick, x, wallH / 2, limit, false);
    addTransparentWallSegment(segLen + 0.35, 0.55, wallThick + 0.4, x, wallH + 0.25, limit, true);
    [-3.6, 0, 3.6].forEach(ox => {
      addTransparentWallSegment(2.0, 1.2, wallThick + 0.2, x + ox, wallH + 1.1, limit, false);
    });
  }

  for (let z = -limit; z <= limit; z += segLen) {
    addTransparentWallSegment(wallThick, wallH, segLen + 0.15, -limit, wallH / 2, z, false);
    addTransparentWallSegment(wallThick + 0.4, 0.55, segLen + 0.35, -limit, wallH + 0.25, z, true);
    [-3.6, 0, 3.6].forEach(oz => {
      addTransparentWallSegment(wallThick + 0.2, 1.2, 2.0, -limit, wallH + 1.1, z + oz, false);
    });

    addTransparentWallSegment(wallThick, wallH, segLen + 0.15, limit, wallH / 2, z, false);
    addTransparentWallSegment(wallThick + 0.4, 0.55, segLen + 0.35, limit, wallH + 0.25, z, true);
    [-3.6, 0, 3.6].forEach(oz => {
      addTransparentWallSegment(wallThick + 0.2, 1.2, 2.0, limit, wallH + 1.1, z + oz, false);
    });
  }

  const towerCoords = [
    [-limit, -limit], [limit, -limit], [-limit, limit], [limit, limit],
    [-limit, 0], [limit, 0], [0, -limit]
  ];
  towerCoords.forEach(([tx, tz]) => {
    const tBody = createBox(6.8, wallH + 3.2, 6.8, towerBaseMat.clone(), tx, (wallH + 3.2) / 2, tz);
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
// 3. 디테일한 인물(상인·건축가·경비병·왕궁 전령) & 신하 2명 & 하늘 원통 빛기둥 모델링
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
  const lEye = createBox(0.10, 0.10, 0.05, eyeMat, -0.15, 2.06, 0.36);
  const rEye = createBox(0.10, 0.10, 0.05, eyeMat,  0.15, 2.06, 0.36);

  const lArm = new THREE.Group(); lArm.position.set(-0.54, 1.50, 0);
  lArm.add(createBox(0.26, 0.62, 0.26, tunicMat, 0, -0.26, 0), createBox(0.22, 0.18, 0.22, skin, 0, -0.62, 0));

  const rArm = new THREE.Group(); rArm.position.set(0.54, 1.50, 0);
  rArm.add(createBox(0.26, 0.62, 0.26, tunicMat, 0, -0.26, 0), createBox(0.22, 0.18, 0.22, skin, 0, -0.62, 0));

  const packGroup = new THREE.Group();
  packGroup.position.set(0, 1.18, -0.42);
  g.add(packGroup);

  g.add(lLeg, rLeg, torso, sash, belt, head, hair, headband, lEye, rEye, lArm, rArm);
  g.userData = { lLeg, rLeg, lArm, rArm, packGroup };
  return g;
}

// -------------------------------------------------------------------------
// 4. 다윗성 랜드마크, 빈틈없는 2층 건물, 상가 건물, 성벽까지 확장된 건물 미로 빌더
// -------------------------------------------------------------------------
function buildDavidCityPalace(cx, cz) {
  const stoneMat = matVoxel('#fde68a', '#eab308');
  const cedarMat = matVoxel('#78350f', '#451a03');
  const goldMat = matDavidCached('#facc15', '#ca8a04');
  const colMat = matVoxel('#f8fafc', '#cbd5e1');

  const base = createBox(20, 1.2, 14, stoneMat.clone(), cx, 0.6, cz);
  const mainHall = createBox(18, 6.5, 11, stoneMat.clone(), cx, 4.4, cz);
  const cedarRoof = createBox(19.2, 0.9, 12.2, cedarMat.clone(), cx, 8.0, cz);
  const upperTower = createBox(10, 4.2, 7, stoneMat.clone(), cx, 10.5, cz - 1.0);
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
  const wallMat = matVoxel(colorVariant % 2 === 0 ? '#fde68a' : '#fed7aa', '#d97706').clone();
  const trimMat = matVoxel('#92400e', '#5c2d0c').clone();
  const stairMat = matVoxel('#cbd5e1', '#64748b').clone();
  const awningMat = matVoxel(colorVariant % 2 === 0 ? '#0284c7' : '#16a34a', '#0f172a').clone();

  const w = 9.0, h1 = 3.6, d = 7.4;

  const body1F = createBox(w, h1, d, wallMat, cx, h1 / 2, cz);
  const slab2F = createBox(w + 0.4, 0.30, d + 0.4, trimMat, cx, h1 - 0.12, cz);
  const door1F = createBox(1.6, 2.4, 0.25, trimMat, cx, 1.2, cz + d / 2 + 0.08);
  worldGroup.add(body1F, slab2F, door1F);
  wallMeshes.push(body1F, slab2F);

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
  const body2F = createBox(roomW, roomH, roomD, wallMat.clone(), roomX, h1 + roomH / 2, roomZ);
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
  const wallMat = matVoxel(idx % 2 === 0 ? '#fde68a' : '#fed7aa', '#d97706');
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
    const backWall = createBox(w, h, 0.8, wallMat.clone(), cx, h / 2, cz - fSign * (d / 2 - 0.4));
    const sideL = createBox(0.8, h, d, wallMat.clone(), cx - w / 2 + 0.4, h / 2, cz);
    const sideR = createBox(0.8, h, d, wallMat.clone(), cx + w / 2 - 0.4, h / 2, cz);
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
    const backWall = createBox(0.8, h, d, wallMat.clone(), cx - fSign * (w / 2 - 0.4), h / 2, cz);
    const sideN = createBox(w, h, 0.8, wallMat.clone(), cx, h / 2, cz - d / 2 + 0.4);
    const sideS = createBox(w, h, 0.8, wallMat.clone(), cx, h / 2, cz + d / 2 - 0.4);
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
  const palettes = [
    ['#fde68a', '#d97706'],
    ['#fed7aa', '#ea580c'],
    ['#fef08a', '#ca8a04'],
    ['#e7e5e4', '#a8a29e']
  ];
  const [c1, c2] = palettes[variant % palettes.length];
  const wallMat = matVoxel(c1, c2).clone();
  const roofMat = matVoxel('#92400e', '#5c2d0c').clone();
  const winMat = matDavidCached('#1e293b');
  const doorMat = matDavidCached('#451a03');

  const body = createBox(w, h, d, wallMat, cx, h / 2, cz);
  const roof = createBox(w + 0.4, 0.45, d + 0.4, roofMat, cx, h + 0.22, cz);
  worldGroup.add(body, roof);
  wallMeshes.push(body, roof);

  if (w >= d) {
    const count = Math.max(1, Math.floor(w / 7.5));
    for (let i = 0; i < count; i++) {
      const ox = -w / 2 + (i + 0.5) * (w / count);
      worldGroup.add(
        createBox(1.4, 2.3, 0.18, doorMat, cx + ox, 1.15, cz + d / 2 + 0.06),
        createBox(1.1, 1.1, 0.18, winMat, cx + ox + 1.8, 2.6, cz + d / 2 + 0.06),
        createBox(1.1, 1.1, 0.18, winMat, cx + ox - 1.8, 2.6, cz - d / 2 - 0.06)
      );
    }
  } else {
    const count = Math.max(1, Math.floor(d / 7.5));
    for (let i = 0; i < count; i++) {
      const oz = -d / 2 + (i + 0.5) * (d / count);
      worldGroup.add(
        createBox(0.18, 2.3, 1.4, doorMat, cx + w / 2 + 0.06, 1.15, cz + oz),
        createBox(0.18, 1.1, 1.1, winMat, cx + w / 2 + 0.06, 2.6, cz + oz + 1.8),
        createBox(0.18, 1.1, 1.1, winMat, cx - w / 2 - 0.06, 2.6, cz + oz - 1.8)
      );
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
    { x: -54, z: -48, side: 'east', var: 0 },
    { x:  54, z:  48, side: 'west', var: 1 }
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
    { x: -18, z:  59, w: 11.0, h: 4.8, d: 7.5, v: 0 },

    { x:  60, z:  16, w: 7.5, h: 4.8, d: 22.0, v: 3 },
    { x:  42, z:   8, w: 8.5, h: 4.5, d: 12.0, v: 1 },
    { x:  60, z:  46, w: 7.5, h: 4.8, d: 24.0, v: 0 },
    { x:  40, z:  60, w: 28.0, h: 4.8, d: 7.5, v: 2 },
    { x:  34, z:  48, w: 18.0, h: 4.6, d: 7.5, v: 1 },
    { x:  31, z:  32, w: 8.0, h: 4.6, d: 18.0, v: 3 },
    { x:  30, z:  20, w: 10.0, h: 4.5, d: 7.0, v: 0 },
    { x:  18, z:  46, w: 10.0, h: 4.8, d: 7.5, v: 2 },
    { x:  18, z:  59, w: 11.0, h: 4.8, d: 7.5, v: 1 }
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
    { x1:  -3, z1:  14, x2:  -3, z2:  56, spd: 2.4 },
    { x1:   3, z1:  56, x2:   3, z2:  14, spd: 2.2 },
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
  const awning1 = matDavidCached('#ef4444', '#b91c1c');
  const awning2 = matDavidCached('#fef08a', '#eab308');
  completedMarket.add(
    createBox(0.35, 3.8, 0.35, woodMat, -3.6, 1.9, -2.4),
    createBox(0.35, 3.8, 0.35, woodMat,  3.6, 1.9, -2.4),
    createBox(0.35, 3.8, 0.35, woodMat, -3.6, 1.9,  2.4),
    createBox(0.35, 3.8, 0.35, woodMat,  3.6, 1.9,  2.4),
    createBox(8.4, 0.5, 3.0, awning1, 0, 4.0, -1.3),
    createBox(8.4, 0.5, 3.0, awning2, 0, 3.8,  1.3),
    createBox(6.8, 1.1, 1.6, woodMat, 0, 0.65, 0),
    createBox(1.2, 0.6, 1.0, matDavidCached('#f97316'), -1.8, 1.4, 0),
    createBox(1.2, 0.6, 1.0, matDavidCached('#22c55e'),  0.0, 1.4, 0),
    createBox(1.2, 0.6, 1.0, matDavidCached('#a855f7'),  1.8, 1.4, 0)
  );
  completedMarket.visible = false;
  marketRoot.add(basePad, unfinishedFrame, completedMarket);
  marketRoot.userData = { unfinishedFrame, completedMarket };
  worldGroup.add(marketRoot);
  davidCityBuildings.marketGroup = marketRoot;

  const houseRoot = new THREE.Group();
  houseRoot.position.set(28, 0, 8);
  const hPad = createBox(9.0, 0.25, 7.0, matDavidCached('#94a3b8', '#64748b'), 0, 0.12, 0, false);
  const hUnfinished = createBox(8.6, 0.3, 6.6, new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35 }), 0, 0.28, 0, false);
  const completedHouse = new THREE.Group();
  const stoneWall = matDavidCached('#fde68a', '#d97706');
  const woodBeam = matDavidCached('#78350f', '#451a03');
  completedHouse.add(
    createBox(8.4, 4.6, 6.4, stoneWall, 0, 2.3, 0),
    createBox(8.8, 0.5, 6.8, woodBeam, 0, 4.8, 0),
    createBox(4.8, 2.5, 4.4, stoneWall, 1.2, 6.2, -0.5),
    createBox(5.2, 0.4, 4.8, woodBeam, 1.2, 7.6, -0.5),
    createBox(1.6, 2.8, 0.3, woodBeam, -1.2, 1.4, 3.25)
  );
  completedHouse.visible = false;
  houseRoot.add(hPad, hUnfinished, completedHouse);
  houseRoot.userData = { unfinishedFrame: hUnfinished, completedHouse };
  worldGroup.add(houseRoot);
  davidCityBuildings.houseGroup = houseRoot;

  const gateZ = mapLimit;
  const gateRoot = new THREE.Group();
  gateRoot.position.set(0, 0, gateZ);
  const towerMat = matVoxel('#d97706', '#92400e');
  const ironMat = matDavidCached('#475569', '#1e293b');
  const goldStud = matDavidCached('#facc15');

  const tL = createBox(7.2, 10.5, 6.8, towerMat.clone(), -7.6, 5.25, 0);
  const tR = createBox(7.2, 10.5, 6.8, towerMat.clone(),  7.6, 5.25, 0);
  const tTop = createBox(22.4, 2.4, 5.8, towerMat.clone(), 0, 10.2, 0);
  gateRoot.add(tL, tR, tTop);
  wallMeshes.push(tL, tR, tTop);
  registerCitySolidBox(-7.6, gateZ, 7.2, 6.8, 10.5, 0.25);
  registerCitySolidBox( 7.6, gateZ, 7.2, 6.8, 10.5, 0.25);

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
// 5. [요청사항 2·3] 난이도별 맞춤형 랜덤 자원 스폰 & 퀘스트 수락 시 보유 자원 0 초기화
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

// 난이도별(유치: 쉬움 / 유년: 중간 / 소년·타임어택: 어려움) 후보지 풀에서 매번 랜덤 위치를 뽑아 자원 스폰
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

  // 1) 유치반(kinder) 후보지: 광장과 중앙 십자 대로변, 퀘스트 NPC 근처의 찾기 쉬운 1층 열린 길가
  const easyPools = {
    wood: [
      [-14, 8, 0], [-19, 4, 0], [-12, 14, 0], [-25, 16, 0], [-8, -2, 0], [-15, -8, 0], [8, 14, 0], [-6, 20, 0]
    ],
    stone: [
      [14, 8, 0], [19, 4, 0], [12, 14, 0], [25, 16, 0], [8, -2, 0], [15, -8, 0], [6, 20, 0], [18, 24, 0]
    ],
    iron: [
      [-6, 30, 0], [6, 30, 0], [-4, 46, 0], [4, 46, 0], [0, 24, 0], [-8, 38, 0], [8, 38, 0], [0, 52, 0]
    ]
  };

  // 2) 유년반(junior) 후보지: 중간 미로 골목길 + 가까운 2층 건물 옥상 일부 포함 (중간 난이도)
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
      [-18.5, -32.5, 3.6], [-48, 8, 0], [-36, 38, 0], [10, 52, 0]
    ]
  };

  // 3) 소년반·타임어택(senior / timeattack) 후보지: 성벽 외곽 골목 끝, 깊은 미로 막다른 골목, 2층 건물 옥상 (어려운 난이도)
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
      // 1층 길가 자원은 건물과 겹치지 않는 범위 내에서 매번 미세 랜덤 오프셋(±1.6m)을 더해 위치 변화를 줌
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

// [요청사항 2] NPC에게 새 퀘스트를 받는 순간 보유 자원을 0으로 초기화하고 자원을 랜덤 위치에 새로 배치
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
    maxZ:  mapLimit - 2.4
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

  // 난이도에 맞춰 랜덤 위치에 건축 자재 초기 스폰
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
      pitch: 0.92,
      beaconColor: 0x38bdf8,
      req: { wood: reqWood2, stone: reqStone2, iron: 0 },
      questLine: `"왕이시여, 집을 지어야 하는데 돌과 나무가 필요합니다! 지금부터 돌 ${reqStone2}개와 나무 ${reqWood2}개를 새로 찾아주시옵소서!"`,
      thanksLine: `"찬양받으소서 다윗 왕이시여! 튼튼한 돌과 나무 덕분에 백성들의 집이 완성되었습니다!"`
    },
    {
      id: 'guard',
      roleTitle: '🛡️ 경비병',
      x: -4.5, z: mapLimit - 6.5,
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
  if (guideArrowGroup) guideArrowGroup.visible = (currentMode !== 'senior');
  snapCameraToPlayer();
  updateStageHUD();
  updateDavidStage3QuestTrackerUI();
  showToast('👑 빛기둥 아래 백성에게 다가가 퀘스트를 받으세요! (퀘스트를 받는 순간부터 자원 수집이 시작됩니다)');
}
// =========================================================================
// [ep3_david.js - 파트 5/5] 에피소드 3 : 스테이지 3 진행 로직, 성벽 엔딩 및 플러그인 통합 등록
// - 퀘스트 수락 시 소형 UI 표시, 진행 중 다른 NPC 퀘스트 잠금(davidCurrentActiveQuestNpc)
// - 퀘스트 수락 순간 보유 자원 0 초기화 및 난이도별 랜덤 위치 재스폰
// - 엔딩: 사방 성벽 외곽 + 빈 왕좌 화살표 안내 -> 왕좌 착석 -> 메시아 성경절 모달 -> 인증서 오픈
// =========================================================================

// -------------------------------------------------------------------------
// 1. NPC 말풍선 대화창 (단일 퀘스트 잠금, 수락 시 자원 0 초기화, 완료 처리)
// -------------------------------------------------------------------------
function syncCityNpcBeaconsForActiveQuest() {
  davidCityNpcs.forEach(n => {
    if (!n.beacon) return;
    if (n.completed) {
      n.beacon.visible = false;
    } else if (davidCurrentActiveQuestNpc) {
      // 진행 중인 퀘스트가 있으면 해당 NPC의 빛기둥만 표시하여 헷갈리지 않게 안내
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

  // 이미 대화창이 열려 있으면 중복 실행 방지
  if (!dlg.classList.contains('hidden')) return;

  davidDialogTargetNpc = npc;
  npc.autoPromptedInZone = true;
  dlg.classList.remove('hidden');
  nameEl.textContent = npc.roleTitle;

  let fullLine = '';
  let canCompleteNow = false;
  let canAcceptNewQuest = false;

  // [요청사항 1] 다른 NPC의 퀘스트를 진행 중일 때는 새 퀘스트를 받을 수 없도록 잠금!
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
    // 현재 진행 중인 퀘스트 NPC에게 다시 온 경우
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
    // 아직 진행 중인 퀘스트가 없는 상태에서 새 퀘스트를 받는 경우
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
  const dlg = document.getElementById('david-npc-dialog');
  if (dlg) dlg.classList.add('hidden');
  if (animaleseTimer) { clearInterval(animaleseTimer); animaleseTimer = null; }

  davidNpcAutoDialogCooldown = 1.5;

  const npc = davidDialogTargetNpc;
  davidDialogTargetNpc = null;
  if (!npc) return;
  if (npc._typingTimer) { clearInterval(npc._typingTimer); npc._typingTimer = null; }

  npc.autoPromptedInZone = true;

  // [요청사항 1·2·3] 새 퀘스트를 수락하는 순간: 보유 자원을 모두 0으로 초기화하고 난이도별 랜덤 위치에 자원 재배치!
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

    // 완료 시에도 남는 자원이 다음 퀘스트로 넘어가지 않도록 깔끔하게 차감·정리
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

    if (npc.id === 'merchant' && davidCityBuildings.marketGroup) {
      davidCityBuildings.marketGroup.userData.unfinishedFrame.visible = false;
      davidCityBuildings.marketGroup.userData.completedMarket.visible = true;
      showToast('🏪 상인의 상가가 멋지게 지어졌습니다! 이제 다음 빛기둥의 백성을 만나보세요!');
    } else if (npc.id === 'architect' && davidCityBuildings.houseGroup) {
      davidCityBuildings.houseGroup.userData.unfinishedFrame.visible = false;
      davidCityBuildings.houseGroup.userData.completedHouse.visible = true;
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

        // 현재 진행 중인 퀘스트의 필요 자재를 모두 모았으면 해당 NPC의 자동 대화 잠금을 해제
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

      // 1) 진행 중인 퀘스트가 없을 때 새 NPC 앞에 서면 자동 오픈
      // 2) 진행 중인 퀘스트 NPC에게 자재를 다 모아 돌아왔을 때 자동 오픈
      // 3) 다른 퀘스트 진행 중 다른 NPC에게 갔을 때 안내 대화 1회 오픈
      // 4) 왕궁 전령에게 3개 완료 후 갔을 때 자동 오픈
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

  // 북쪽 성막 나단 선지자 도착 및 가이드 화살표 계산
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
      let guidePt = targetObject.pos;
      if (!davidProphetUnlocked) {
        if (davidCurrentActiveQuestNpc && !davidCurrentActiveQuestNpc.completed) {
          const req = davidCurrentActiveQuestNpc.req;
          let neededKind = null;
          if (req.wood > davidInventory.wood) neededKind = 'wood';
          else if (req.stone > davidInventory.stone) neededKind = 'stone';
          else if (req.iron > davidInventory.iron) neededKind = 'iron';

          if (neededKind) {
            // 현재 플레이어와 가장 가까운 해당 종류의 자원 위치를 가리킴
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
      guideArrowGroup.rotation.y = Math.atan2(guidePt.x - playerPos.x, guidePt.z - playerPos.z) - playerFacing;
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
// 3. [엔딩 월드] 사방 성벽 외곽 + 빈 왕좌 화살표 안내 -> 왕좌 등극 -> 메시아 성경절 모달 -> 인증서 오픈
// -------------------------------------------------------------------------
function createEmptyThroneWithGuideArrow(cx, cz) {
  const root = new THREE.Group();
  const goldMat = matDavidCached('#facc15', '#ca8a04');
  const redVelvet = matDavidCached('#991b1b', '#7f1d1d');
  const stoneStep = matDavidCached('#fde68a', '#d97706');

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

function ensureDavidMessiahModal() {
  let modal = document.getElementById('david-messiah-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'david-messiah-modal';
    modal.className = 'hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm items-center justify-center p-4 pointer-events-auto';
    modal.innerHTML = `
      <div class="mc-panel max-w-md w-full rounded-3xl bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 border-4 border-amber-400 p-6 text-center text-white shadow-2xl space-y-4">
        <div class="text-5xl">👑✨</div>
        <div class="inline-block px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300 text-amber-300 font-jua text-xs">
          다윗의 왕위와 영원한 메시아 언약
        </div>
        <h2 class="font-jua text-2xl text-amber-300 leading-snug">
          메시아가 다윗의 후손으로 오십니다!
        </h2>
        <p class="text-xs sm:text-sm text-slate-200 leading-relaxed">
          양을 지키던 목동 다윗은 이스라엘의 왕이 되었고, 하나님께서는 다윗의 후손을 통해 온 세상을 구원할 영원한 왕 <b class="text-amber-300">메시아(예수 그리스도)</b>를 보내주신다고 약속하셨어요!
        </p>
        <div class="bg-slate-950/80 border-2 border-amber-500/60 rounded-2xl p-4 text-left space-y-2">
          <p class="text-xs sm:text-sm font-bold text-amber-200 leading-relaxed">
            "보라 날이 이르리니 내가 다윗에게 한 의로운 가지를 일으킬 것이라 그가 왕이 되어 지혜롭게 다스리며 세상에서 정의와 공의를 행할 것이며"
            <span class="block text-right text-[11px] text-amber-400 mt-1">- 예레미야 23장 5절 -</span>
          </p>
          <p class="text-xs sm:text-sm font-bold text-sky-200 leading-relaxed pt-2 border-t border-slate-800">
            "아브라함과 다윗의 자손 예수 그리스도의 계보라"
            <span class="block text-right text-[11px] text-sky-400 mt-1">- 마태복음 1장 1절 -</span>
          </p>
        </div>
        <button type="button" onclick="proceedFromMessiahModalToCert()" class="mc-btn w-full py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-jua text-lg shadow-xl">
          🏆 완주 달란트 인증서 보기! ▶
        </button>
      </div>
    `;
    document.body.appendChild(modal);
  }
  return modal;
}

function openDavidMessiahModal() {
  const modal = ensureDavidMessiahModal();
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  playSfx('clear');
}

window.proceedFromMessiahModalToCert = function () {
  const modal = document.getElementById('david-messiah-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
  if (typeof openCertificateModal === 'function') {
    openCertificateModal();
  }
};

function buildDavidEndingWorld() {
  hideAllDavidCustomUI();
  const tracker = document.getElementById('david-st3-quest-tracker');
  if (tracker) tracker.classList.add('hidden');
  const messiahModal = document.getElementById('david-messiah-modal');
  if (messiahModal) { messiahModal.classList.add('hidden'); messiahModal.classList.remove('flex'); }

  const certBtn = document.getElementById('ending-cert-btn');
  if (certBtn) certBtn.classList.add('hidden');

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

  // 엔딩 맵 가장자리도 반투명 시야 처리가 적용된 다윗성 성벽으로 둘러쌈
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
  showToast('👑 다윗왕이 보좌에 올랐습니다! 다윗의 후손으로 오실 메시아 언약 말씀이 펼쳐집니다!');
}

function updateDavidEndingThroneFrame(dt, now) {
  if (!davidThroneEnding.seated) {
    if (davidThroneEnding.arrowGroup) {
      davidThroneEnding.arrowGroup.position.y = 4.2 + Math.sin(now * 0.006) * 0.42;
      davidThroneEnding.arrowGroup.rotation.y += dt * 2.4;
    }
    if (targetObject) {
      const td = Math.hypot(playerPos.x - targetObject.pos.x, playerPos.z - targetObject.pos.z);
      updateWorldLabelPos(targetObject.label, targetObject.pos, td < 30);

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

  if (davidThroneEnding.seatTimer >= 1.15 && !davidThroneEnding.modalShown) {
    davidThroneEnding.modalShown = true;
    const certBtn = document.getElementById('ending-cert-btn');
    if (certBtn) certBtn.classList.remove('hidden');
    openDavidMessiahModal();
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
  locked: false, // 에피소드 선택 맵에서 에피소드 3 선택을 잠그려면 true 로 변경하세요
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
    const messiahModal = document.getElementById('david-messiah-modal');
    if (messiahModal) { messiahModal.classList.add('hidden'); messiahModal.classList.remove('flex'); }
  },
  clearState: function () {
    hideAllDavidCustomUI();
    const tracker = document.getElementById('david-st3-quest-tracker');
    if (tracker) tracker.classList.add('hidden');
    const messiahModal = document.getElementById('david-messiah-modal');
    if (messiahModal) { messiahModal.classList.add('hidden'); messiahModal.classList.remove('flex'); }
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
