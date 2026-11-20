// =========================================================================
// [core.js - 파트 1/2] 출발! 탐험대! - 공통 3D 엔진, 인디아나 존스 풍 1분 모험 테마 BGM, 구글 시트 개인 기록 해금 시스템
// - 에피소드 1 엔딩: 방주 내부 진입(passUnderY 물리 판정) 및 미로 탐험·다단 자연 바위 등반 연동
// - 전체 에피소드 공통: 2회차/재선택 엔딩에서 제단·왕좌 접근 시 [월드맵으로 이동하기] 선택창 출력
// =========================================================================

window.__GAME_BUILD_VERSIONS__ = window.__GAME_BUILD_VERSIONS__ || {};
window.__GAME_BUILD_VERSIONS__.core = '20261120_v11';

// 퀴즈 선택지 순서 무작위 셔플 공용 헬퍼 (정답이 항상 1번에 고정되지 않도록 보장)
function shuffleQuizOptions(opts, ansIdx = 0) {
  const list = (opts || []).map((text, idx) => ({ text, isCorrect: idx === ansIdx }));
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = list[i];
    list[i] = list[j];
    list[j] = tmp;
  }
  return list;
}

let audioCtx = null, bgmTimeout = null, bgmEnabled = true, bgmStep = 0;
let isMenuBgmActive = false;
let currentEpisode = 'noah'; // 'noah' | 'exodus' | 'david' | 'miracle'
const EPISODE_SCRIPTURE = {};
const EPISODE_REGISTRY = {};
let lastSpokenStageKey = '';

// 현재 진행 중인 플레이에서 엔딩 인증서를 출력할 수 있는지 여부 (1차 시도 정규 클리어 시에만 true)
let currentRunCanIssueCert = false;
let enteredFromMapStageSelect = false;

// =========================================================================
// [관리자 마스터 잠금 스위치]
// - 현재 요청에 따라 에피소드 2(exodus), 3(david), 4(miracle)는 true(잠금) 상태입니다.
// - 추후 오픈할 에피소드를 false로 변경하면, 구글 시트 개인 기록에 따라
//   (에피소드1 클리어 -> 에피소드2 해금 -> 에피소드3 해금 -> 에피소드4 해금) 자동으로 열립니다!
// =========================================================================
const EPISODE_MASTER_ADMIN_LOCK = {
  noah: false,    // 에피소드 1: 항상 오픈
  exodus: true,   // 에피소드 2: 현재 잠금 (false로 변경 시 에피소드 1 클리어자에게 자동 오픈)
  david: true,    // 에피소드 3: 현재 잠금 (false로 변경 시 에피소드 2 클리어자에게 자동 오픈)
  miracle: true   // 에피소드 4: 현재 잠금 (false로 변경 시 에피소드 3 클리어자에게 자동 오픈)
};

const EPISODE_ORDER = ['noah', 'exodus', 'david', 'miracle'];
const EPISODE_META_INFO = {
  noah:    { num: 1, title: '노아의 방주', icon: '🛶' },
  exodus:  { num: 2, title: '출애굽과 시내산', icon: '🌊' },
  david:   { num: 3, title: '다윗과 골리앗', icon: '🪨' },
  miracle: { num: 4, title: '예수님의 기적', icon: '🍞' }
};

// [신규 에피소드 3·4 전용 플러그인 등록 슬롯]
function REGISTER_EPISODE(epKey, config) {
  EPISODE_REGISTRY[epKey] = config || {};
  if (config && config.scripture) {
    EPISODE_SCRIPTURE[epKey] = config.scripture;
  }
}

function getActiveEpisodePlugin() {
  return EPISODE_REGISTRY[currentEpisode] || null;
}

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
  const epPlugin = getActiveEpisodePlugin();
  const customSfx = (epPlugin && epPlugin.customSfx && epPlugin.customSfx[type]) ? epPlugin.customSfx[type] : null;

  const notes = customSfx || {
    step: [[220, 0.04, 'triangle', 0.04]],
    jump: [[300, 0.07, 'sine', 0.12], [480, 0.1, 'sine', 0.12]],
    count: [[440, 0.12, 'triangle', 0.18]],
    go: [[587, 0.1, 'triangle', 0.2], [880, 0.25, 'triangle', 0.24]],
    build: [[196, 0.06, 'square', 0.12], [293, 0.07, 'triangle', 0.15], [440, 0.12, 'triangle', 0.18]],
    axe: [[150, 0.05, 'sawtooth', 0.24], [95, 0.07, 'square', 0.20]],
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

// =========================================================================
// [공통 요청사항 1] 반선택 & 월드맵 화면용 1분(60초) 오리지널 웅장·경쾌 모험 팡파르 BGM (D장조)
// =========================================================================
const MENU_ADVENTURE_SUITE = (function buildOriginalHeroicAdventureSuite() {
  const m = [], h = [], b = [], r = [];
  const pushPhrase = (mel, harm, bass, rhy) => {
    for (let i = 0; i < mel.length; i++) {
      m.push(mel[i]); h.push(harm[i]); b.push(bass[i]); r.push(rhy[i]);
    }
  };

  // A악장 (32박): 힘찬 5도·옥타브 도약의 오리지널 대탐험 팡파르
  pushPhrase(
    [0, 7, 12, 11,  9, 7, 12, 14,   16, 14, 12, 9,  10, 12, 14, 14,
     12, 16, 19, 16, 14, 12, 11, 9,  12, 14, 16, 19, 14, 11, 12, 12],
    [-5, 4, 7, 7,   5, 4, 7, 9,     12, 9, 7, 5,    7, 7, 9, 7,
     7, 12, 14, 12,  9, 7, 7, 4,     7, 9, 12, 14,   9, 7, 7, 4],
    [-12,-12,-5,-5, -3,-3,-12,-10,  -8,-8,-12,-10,  -2,-2,-5,-5,
     -12,-12,-5,-8, -10,-10,-5,-3,  -7,-7,-5,-5,    -5,-5,-12,-12],
    [0.95,0.55,1.25,0.50, 0.70,0.55,0.85,1.25,  0.80,0.45,0.75,0.65, 0.90,0.55,0.95,1.35,
     0.85,0.50,1.25,0.55, 0.75,0.55,0.75,0.85,  0.75,0.50,0.85,1.20, 0.70,0.60,0.90,1.50]
  );

  // B악장 (32박): 경쾌하고 통통 튀는 탐험대 행진 테마
  pushPhrase(
    [7, 9, 12, 12,  14, 16, 14, 12,  9, 12, 16, 16,  14, 12, 11, 7,
     5, 7, 9, 12,   14, 16, 19, 16,  14, 12, 11, 14, 12, 9, 7, 7],
    [4, 5, 7, 7,    9, 12, 9, 7,     5, 7, 12, 12,   9, 7, 7, 4,
     0, 4, 5, 7,    9, 12, 14, 12,   9, 7, 7, 9,     7, 5, 4, 2],
    [-12,-5,-12,-5, -10,-5,-10,-5,  -7,-3,-7,-3,    -5,-10,-5,-12,
     -7,-12,-7,-3,  -5,-10,-5,-8,   -10,-5,-5,-2,   -12,-8,-5,-5],
    [0.65,0.50,0.95,0.65, 0.65,0.50,0.85,1.05,  0.65,0.50,0.95,0.65, 0.65,0.55,0.85,1.10,
     0.65,0.50,0.80,0.65, 0.70,0.50,1.15,0.65,  0.65,0.55,0.75,0.80, 0.75,0.60,0.85,1.20]
  );

  // C악장 (32박): 드넓은 하늘과 바다를 바라보는 웅장한 서정 테마
  pushPhrase(
    [16, 19, 21, 19,  16, 14, 12, 14,  16, 19, 17, 16,  14, 12, 9, 9,
     10, 12, 14, 17,  16, 14, 12, 9,   11, 12, 14, 16,  19, 16, 14, 14],
    [12, 14, 16, 14,  12, 9, 7, 9,     12, 14, 12, 12,  9, 7, 5, 4,
     5, 7, 10, 12,    12, 9, 7, 5,     7, 9, 11, 12,    14, 12, 9, 11],
    [-12,-12,-8,-8,  -7,-7,-12,-12,   -12,-8,-7,-7,    -10,-10,-3,-3,
     -2,-2,-7,-7,    -12,-12,-8,-8,   -5,-5,-5,-8,     -5,-5,-5,-5],
    [1.05,0.60,1.20,0.65, 0.80,0.60,0.80,1.15,  1.05,0.60,1.10,0.65, 0.80,0.60,0.85,1.20,
     0.95,0.55,1.05,0.70, 0.80,0.60,0.80,1.10,  0.80,0.55,0.85,0.85, 1.15,0.65,0.95,1.35]
  );

  // D악장 (32박): 미지의 땅을 개척하는 박진감 넘치는 모험 브릿지
  pushPhrase(
    [9, 12, 16, 14,  12, 10, 9, 7,   5, 9, 12, 10,   9, 7, 5, 4,
     5, 7, 9, 12,    14, 12, 10, 9,  7, 9, 11, 14,   16, 19, 21, 19],
    [4, 9, 12, 9,    7, 5, 4, 2,     0, 5, 9, 5,     4, 2, 0, -1,
     0, 2, 5, 7,     9, 7, 5, 4,     2, 4, 7, 9,     12, 14, 16, 14],
    [-3,-3,-10,-10, -8,-2,-3,-5,    -7,-7,-12,-10,  -3,-5,-7,-8,
     -7,-7,-3,-3,   -2,-2,-7,-10,   -5,-5,-5,-2,    -5,-5,-5,-5],
    [0.85,0.50,0.95,0.60, 0.70,0.50,0.75,1.05,  0.85,0.50,0.95,0.60, 0.70,0.55,0.75,1.05,
     0.75,0.50,0.80,0.65, 0.85,0.55,0.70,0.95,  0.70,0.50,0.75,0.80, 0.85,0.60,1.05,1.20]
  );

  // E악장 (32박): 고음역으로 웅장하게 치솟는 메인 팡파르 피날레
  pushPhrase(
    [12, 19, 24, 23,  21, 19, 24, 21,  19, 16, 14, 16,  19, 21, 19, 16,
     14, 16, 19, 21,  24, 21, 19, 16,  14, 12, 14, 16,  19, 16, 14, 12],
    [7, 14, 19, 19,   16, 14, 19, 16,  14, 12, 9, 12,   14, 16, 14, 12,
     9, 12, 14, 16,   19, 16, 14, 12,  9, 7, 9, 12,     14, 12, 9, 7],
    [-12,-12,-5,-5,  -3,-3,-12,-8,    -7,-7,-10,-10,   -5,-5,-8,-12,
     -10,-10,-5,-3,  -12,-8,-7,-12,   -10,-10,-5,-5,   -5,-5,-12,-12],
    [0.95,0.55,1.25,0.50, 0.70,0.55,1.05,0.70,  0.80,0.50,0.75,0.60, 0.90,0.55,0.95,1.10,
     0.75,0.50,0.85,0.65, 1.25,0.55,0.80,0.75,  0.70,0.55,0.70,0.85, 1.05,0.65,0.85,1.45]
  );

  // F악장 (24박): 경쾌한 마무리 행진 & 자연스러운 루프 연결
  pushPhrase(
    [12, 14, 16, 19,  21, 19, 16, 14,  12, 16, 19, 24,  21, 19, 16, 12,
     9, 12, 14, 16,   14, 11, 9, 7],
    [7, 9, 12, 14,    16, 14, 12, 9,   7, 12, 14, 19,   16, 14, 12, 7,
     5, 7, 9, 12,     9, 7, 4, 2],
    [-12,-5,-12,-5,  -7,-3,-7,-10,    -12,-8,-5,-12,   -7,-5,-8,-12,
     -7,-7,-5,-5,    -5,-5,-5,-5],
    [0.75,0.50,0.75,1.05, 0.85,0.55,0.75,1.05, 0.75,0.50,0.85,1.25, 0.80,0.55,0.80,1.10,
     0.75,0.55,0.80,0.95, 0.75,0.60,0.65,0.90]
  );

  return { melody: m, harmony: h, bass: b, rhythm: r };
})();

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

  if (isMenuBgmActive && !isPlaying) {
    const totalLen = MENU_ADVENTURE_SUITE.melody.length;
    const idx = bgmStep % totalLen;
    const rhythmMult = MENU_ADVENTURE_SUITE.rhythm[idx] || 1.0;
    const stepMs = Math.round(315 * rhythmMult);

    if (ctx) {
      const now = ctx.currentTime;
      const isShortNote = rhythmMult <= 0.55;
      const dur = (stepMs / 1000) * (isShortNote ? 0.88 : 1.18);
      const rootMidi = 62; // 밝고 웅장한 D장조 대모험 스케일
      const leadFreq = midiToFreq(rootMidi + MENU_ADVENTURE_SUITE.melody[idx]);
      const harmFreq = midiToFreq(rootMidi + MENU_ADVENTURE_SUITE.harmony[idx]);
      const bassFreq = midiToFreq(rootMidi + MENU_ADVENTURE_SUITE.bass[idx]);

      const osc1 = ctx.createOscillator(), f1 = ctx.createBiquadFilter(), g1 = ctx.createGain();
      osc1.type = 'sawtooth'; osc1.frequency.setValueAtTime(leadFreq, now);
      f1.type = 'lowpass';
      f1.frequency.setValueAtTime(1400, now);
      f1.frequency.linearRampToValueAtTime(2600, now + 0.04);
      f1.frequency.exponentialRampToValueAtTime(1200, now + dur);
      g1.gain.setValueAtTime(0.001, now);
      g1.gain.linearRampToValueAtTime(0.052, now + 0.018);
      g1.gain.exponentialRampToValueAtTime(0.001, now + dur);
      osc1.connect(f1); f1.connect(g1); g1.connect(ctx.destination);
      osc1.start(now); osc1.stop(now + dur + 0.02);

      const osc2 = ctx.createOscillator(), g2 = ctx.createGain();
      osc2.type = 'triangle'; osc2.frequency.setValueAtTime(harmFreq, now);
      g2.gain.setValueAtTime(0.001, now);
      g2.gain.linearRampToValueAtTime(0.034, now + 0.025);
      g2.gain.exponentialRampToValueAtTime(0.001, now + dur * 0.95);
      osc2.connect(g2); g2.connect(ctx.destination);
      osc2.start(now); osc2.stop(now + dur + 0.02);

      const osc3 = ctx.createOscillator(), g3 = ctx.createGain();
      osc3.type = (idx % 4 === 0) ? 'sawtooth' : 'triangle';
      osc3.frequency.setValueAtTime(bassFreq, now);
      g3.gain.setValueAtTime(0.001, now);
      g3.gain.linearRampToValueAtTime((idx % 4 === 0) ? 0.054 : 0.038, now + 0.015);
      g3.gain.exponentialRampToValueAtTime(0.001, now + dur * 0.85);
      osc3.connect(g3); g3.connect(ctx.destination);
      osc3.start(now); osc3.stop(now + dur);

      if (idx % 2 === 0 || isShortNote) {
        const drumOsc = ctx.createOscillator(), drumGain = ctx.createGain();
        drumOsc.type = 'triangle';
        drumOsc.frequency.setValueAtTime(idx % 4 === 0 ? 135 : 210, now);
        drumOsc.frequency.exponentialRampToValueAtTime(55, now + 0.065);
        drumGain.gain.setValueAtTime(idx % 4 === 0 ? 0.045 : 0.025, now);
        drumGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        drumOsc.connect(drumGain); drumGain.connect(ctx.destination);
        drumOsc.start(now); drumOsc.stop(now + 0.075);
      }

      bgmStep++;
    }
    bgmTimeout = setTimeout(scheduleNextBgmBeat, stepMs);
    return;
  }

  const epPlugin = getActiveEpisodePlugin();

  if (epPlugin) {
    if (typeof epPlugin.scheduleBgmBeat === 'function') {
      const nextMs = epPlugin.scheduleBgmBeat(ctx, bgmStep, currentStage, currentMode, isPlaying, timeRemaining, midiToFreq);
      bgmStep++;
      bgmTimeout = setTimeout(scheduleNextBgmBeat, nextMs || 340);
      return;
    }
    if (epPlugin.bgmConfig) {
      const cfg = epPlugin.bgmConfig;
      const stStyle = (cfg.stages && cfg.stages[currentStage]) || { rootMidi: 58, wave: 'triangle', subWave: 'sine', baseMs: 360, vol: 0.042 };
      const melody = cfg.melody || NOAH_THEME_INTERVALS;
      const bass = cfg.bass || NOAH_BASS_INTERVALS;
      const idx = bgmStep % melody.length;
      let stepMs = stStyle.baseMs;
      if (currentMode === 'timeattack' && isPlaying && currentStage <= 3) {
        stepMs = (timeRemaining < 4.0) ? Math.round(stepMs * 0.48) : Math.round(stepMs * 0.66);
      }
      if (ctx) {
        const now = ctx.currentTime, dur = (stepMs / 1000) * 1.2;
        const leadFreq = midiToFreq(stStyle.rootMidi + melody[idx]);
        const bassFreq = midiToFreq(stStyle.rootMidi + bass[idx % bass.length]);
        const osc1 = ctx.createOscillator(), g1 = ctx.createGain();
        osc1.type = stStyle.wave; osc1.frequency.setValueAtTime(leadFreq, now);
        g1.gain.setValueAtTime(0.001, now); g1.gain.linearRampToValueAtTime(stStyle.vol, now + 0.03);
        g1.gain.exponentialRampToValueAtTime(0.001, now + dur);
        osc1.connect(g1); g1.connect(ctx.destination); osc1.start(now); osc1.stop(now + dur + 0.02);

        const osc2 = ctx.createOscillator(), g2 = ctx.createGain();
        osc2.type = stStyle.subWave; osc2.frequency.setValueAtTime(bassFreq, now);
        g2.gain.setValueAtTime(0.001, now); g2.gain.linearRampToValueAtTime(stStyle.vol * 0.65, now + 0.04);
        g2.gain.exponentialRampToValueAtTime(0.001, now + dur);
        osc2.connect(g2); g2.connect(ctx.destination); osc2.start(now); osc2.stop(now + dur + 0.02);
        bgmStep++;
      }
      bgmTimeout = setTimeout(scheduleNextBgmBeat, stepMs);
      return;
    }
  }

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
      osc1.type = style.wave; osc1.frequency.setValueAtTime(leadFreq, now);
      g1.gain.setValueAtTime(0.001, now); g1.gain.linearRampToValueAtTime(style.vol, now + 0.04);
      g1.gain.exponentialRampToValueAtTime(0.001, now + dur);
      osc1.connect(g1); g1.connect(ctx.destination); osc1.start(now); osc1.stop(now + dur + 0.02);

      const osc2 = ctx.createOscillator(), g2 = ctx.createGain();
      osc2.type = style.subWave; osc2.frequency.setValueAtTime(harmFreq, now);
      g2.gain.setValueAtTime(0.001, now); g2.gain.linearRampToValueAtTime(style.vol * 0.6, now + 0.05);
      g2.gain.exponentialRampToValueAtTime(0.001, now + dur);
      osc2.connect(g2); g2.connect(ctx.destination); osc2.start(now); osc2.stop(now + dur + 0.02);

      const osc3 = ctx.createOscillator(), g3 = ctx.createGain();
      osc3.type = 'triangle'; osc3.frequency.setValueAtTime(bassFreq, now);
      g3.gain.setValueAtTime(0.001, now); g3.gain.linearRampToValueAtTime(style.vol * 0.85, now + 0.02);
      g3.gain.exponentialRampToValueAtTime(0.001, now + dur * 0.9);
      osc3.connect(g3); g3.connect(ctx.destination); osc3.start(now); osc3.stop(now + dur);

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
    osc1.type = style.wave; osc1.frequency.setValueAtTime(leadFreq, now);
    g1.gain.setValueAtTime(0.001, now); g1.gain.linearRampToValueAtTime(style.vol, now + 0.03);
    g1.gain.exponentialRampToValueAtTime(0.0008, now + dur);
    osc1.connect(g1); g1.connect(ctx.destination); osc1.start(now); osc1.stop(now + dur + 0.02);

    if (idx % 2 === 0 || currentMode === 'timeattack') {
      const osc2 = ctx.createOscillator(), g2 = ctx.createGain();
      osc2.type = style.subWave; osc2.frequency.setValueAtTime(style.shimmer ? leadFreq * 1.5 : bassFreq, now);
      g2.gain.setValueAtTime(0.001, now); g2.gain.linearRampToValueAtTime(style.vol * 0.52, now + 0.04);
      g2.gain.exponentialRampToValueAtTime(0.0008, now + dur);
      osc2.connect(g2); g2.connect(ctx.destination); osc2.start(now); osc2.stop(now + dur + 0.02);
    }
    bgmStep++;
  }
  bgmTimeout = setTimeout(scheduleNextBgmBeat, stepMs);
}

function startMenuAdventureBgm() {
  if (isMenuBgmActive && bgmTimeout) return;
  stopStageBgm();
  isMenuBgmActive = true;
  if (typeof window.stopMiracleOpenWorldOgg === 'function') {
    window.stopMiracleOpenWorldOgg(true);
  }
  if (!bgmEnabled) return;
  bgmStep = 0;
  scheduleNextBgmBeat();
}

function startStageBgm(st) {
  isMenuBgmActive = false;
  stopStageBgm();
  if (!bgmEnabled) return;
  bgmStep = 0;
  scheduleNextBgmBeat();
}

function stopStageBgm() {
  if (bgmTimeout) { clearTimeout(bgmTimeout); bgmTimeout = null; }
  if (typeof window.stopMiracleOpenWorldOgg === 'function' && (!isPlaying || isMenuBgmActive || !bgmEnabled)) {
    window.stopMiracleOpenWorldOgg(isMenuBgmActive || !isPlaying);
  }
}

function toggleBgm() {
  bgmEnabled = !bgmEnabled;
  document.getElementById('bgm-btn').textContent = bgmEnabled ? '🎵' : '🔇';
  if (bgmEnabled) {
    if (isPlaying) startStageBgm(currentStage);
    else startMenuAdventureBgm();
  } else {
    stopStageBgm();
    if (typeof window.stopMiracleOpenWorldOgg === 'function') {
      window.stopMiracleOpenWorldOgg(false);
    }
  }
}

let melodyTimer = null;
function speakText(text) {
  if (!text) return;
  const cleanText = text.replace(/⚡/g, '').replace(/&/g, '과').trim();
  if (melodyTimer) { clearInterval(melodyTimer); melodyTimer = null; }
  let ttsWorked = false;
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(cleanText);
      u.lang = 'ko-KR'; u.rate = 0.95; u.pitch = 1.08;
      u.volume = 0.22;
      window.speechSynthesis.speak(u);
      ttsWorked = true;
    } catch (e) { ttsWorked = false; }
  }
  if (!ttsWorked) {
    let idx = 0;
    const scale = [440, 493.8, 523.2, 587.3, 659.2, 784];
    melodyTimer = setInterval(() => {
      if (idx >= Math.min(cleanText.length, 16)) { clearInterval(melodyTimer); return; }
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
// 2. 화면 제어, 생일 기반 고유 ID, 구글 시트 개인 진도 동기화 및 2회차 월드맵 이동 선택창
// =========================================================================
let explorerName = '';
let explorerDisplayName = '';
let explorerBirth = '';
let currentMode = 'junior';
const MODE_META = {
  kinder: { badge: '🐣 유치반', dept: '🐣 유치반(미취학)', quizCount: 0 },
  junior: { badge: '🌱 유년반', dept: '🌱 유년반(초등 1-3학년)', quizCount: 1 },
  senior: { badge: '🍎 소년반', dept: '🍎 소년반(초등 4-6학년)', quizCount: 2 },
  timeattack: { badge: '⚡ 타임어택', dept: '⚡ 타임어택(스피드 도전)', quizCount: 1 }
};

let playerProgressData = {
  noah:    { maxClearedStage: 0, completed: false, certIssued: false, attempts: 0 },
  exodus:  { maxClearedStage: 0, completed: false, certIssued: false, attempts: 0 },
  david:   { maxClearedStage: 0, completed: false, certIssued: false, attempts: 0 },
  miracle: { maxClearedStage: 0, completed: false, certIssued: false, attempts: 0 }
};

function getLocalProgressStorageKey(uniquePlayerId) {
  return 'bible_progress_v2_' + (uniquePlayerId || 'guest');
}

function loadLocalPlayerProgress(uniquePlayerId) {
  playerProgressData = {
    noah:    { maxClearedStage: 0, completed: false, certIssued: false, attempts: 0 },
    exodus:  { maxClearedStage: 0, completed: false, certIssued: false, attempts: 0 },
    david:   { maxClearedStage: 0, completed: false, certIssued: false, attempts: 0 },
    miracle: { maxClearedStage: 0, completed: false, certIssued: false, attempts: 0 }
  };
  try {
    const raw = localStorage.getItem(getLocalProgressStorageKey(uniquePlayerId));
    if (raw) {
      const parsed = JSON.parse(raw);
      EPISODE_ORDER.forEach(ep => {
        if (parsed[ep]) {
          playerProgressData[ep].maxClearedStage = Math.max(0, parseInt(parsed[ep].maxClearedStage || 0, 10));
          playerProgressData[ep].completed = Boolean(parsed[ep].completed || playerProgressData[ep].maxClearedStage >= 3);
          playerProgressData[ep].certIssued = Boolean(parsed[ep].certIssued || playerProgressData[ep].maxClearedStage >= 4);
          playerProgressData[ep].attempts = Math.max(0, parseInt(parsed[ep].attempts || 0, 10));
        }
      });
    }
  } catch (e) {}
}

function saveLocalPlayerProgress(uniquePlayerId) {
  try {
    localStorage.setItem(getLocalProgressStorageKey(uniquePlayerId), JSON.stringify(playerProgressData));
  } catch (e) {}
}

function recordPlayerStageClear(epKey, stageNum) {
  if (!playerProgressData[epKey]) {
    playerProgressData[epKey] = { maxClearedStage: 0, completed: false, certIssued: false, attempts: 0 };
  }
  if (stageNum > playerProgressData[epKey].maxClearedStage) {
    playerProgressData[epKey].maxClearedStage = stageNum;
  }
  if (stageNum >= 3) {
    playerProgressData[epKey].completed = true;
  }
  if (stageNum >= 4) {
    playerProgressData[epKey].certIssued = true;
  }
  saveLocalPlayerProgress(explorerName);
  updateWorldMapEpisodePinsUI();
}

// 현재 플레이에서 인증서 출력이 허용되는지 확인 (맵에서 엔딩 재선택이 아니고, 최초 1차 시도일 때만 true)
function canShowCertificateForCurrentRun() {
  if (enteredFromMapStageSelect) return false;
  const prog = playerProgressData[currentEpisode];
  if (prog && prog.certIssued) return false;
  return Boolean(currentRunCanIssueCert);
}

// [전체 에피소드 공통 요청사항] 2회차/재선택 엔딩에서 제단이나 왕좌에 다가가면 인증서 대신 열리는 [월드맵으로 가기] 선택창
function ensureEndingWorldMapChoiceModal() {
  let modal = document.getElementById('ending-map-choice-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'ending-map-choice-modal';
    modal.className = 'hidden fixed inset-0 z-50 items-center justify-center p-3 bg-slate-950/75 backdrop-blur-sm';
    modal.innerHTML = `
      <div class="mc-card modal-scroll w-full max-w-sm rounded-3xl p-5 text-center">
        <div id="ending-choice-icon" class="text-5xl mb-2">🌈</div>
        <h2 id="ending-choice-title" class="font-jua text-xl sm:text-2xl text-amber-900 mb-1">말씀 탐험 엔딩 세상</h2>
        <p id="ending-choice-desc" class="text-xs sm:text-sm text-slate-700 mb-4 leading-relaxed">
          이미 완주한 에피소드의 엔딩 세상이에요!<br/>월드맵으로 이동하거나 엔딩 세상을 계속 둘러볼 수 있어요.
        </p>
        <div class="flex flex-col gap-2">
          <button id="ending-choice-openworld-btn" type="button" onclick="closeEndingWorldMapChoiceModal(); if (typeof returnToMiracleOpenWorld === 'function') returnToMiracleOpenWorld();" class="hidden mc-btn w-full py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-jua text-base">
            🌿 오픈월드로 돌아가기 (미션·수첩 채우기)
          </button>
          <button type="button" onclick="closeEndingWorldMapChoiceModal(); openScreen('screen-map');" class="mc-btn w-full py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-jua text-base">
            🗺️ 월드맵으로 이동하기
          </button>
          <button type="button" onclick="closeEndingWorldMapChoiceModal(true);" class="mc-btn w-full py-2 rounded-2xl bg-sky-400 hover:bg-sky-300 text-slate-950 font-jua text-xs sm:text-sm">
            👀 엔딩 세상 계속 둘러보기
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  return modal;
}

function showEndingWorldMapChoiceModal() {
  const modal = ensureEndingWorldMapChoiceModal();
  const iconEl = document.getElementById('ending-choice-icon');
  const titleEl = document.getElementById('ending-choice-title');
  const descEl = document.getElementById('ending-choice-desc');
  const owBtn = document.getElementById('ending-choice-openworld-btn');
  const meta = EPISODE_META_INFO[currentEpisode] || { num: 1, title: '노아의 방주', icon: '🌈' };

  if (owBtn) {
    owBtn.classList.toggle('hidden', currentEpisode !== 'miracle');
  }
  if (iconEl) {
    iconEl.textContent = currentEpisode === 'david' ? '👑' : (currentEpisode === 'exodus' ? '🌊' : (currentEpisode === 'miracle' ? '☁️' : '🌈'));
  }
  if (titleEl) {
    titleEl.textContent = currentEpisode === 'miracle'
      ? `${meta.title} · 감람산 승천 이후`
      : `${meta.title} · 엔딩 세상`;
  }
  if (descEl) {
    if (currentEpisode === 'noah') {
      descEl.innerHTML = '무지개 언약의 제단에 도착했어요!<br/>월드맵으로 나가거나 뒤편 방주 내부 미로와 방주 지붕 위를 계속 둘러볼 수 있어요.';
    } else if (currentEpisode === 'miracle') {
      descEl.innerHTML = '예수님께서 하늘로 승천하신 감람산 자리예요!<br/>오픈월드로 돌아가 남은 미션과 수첩을 채우거나, 월드맵·엔딩 세상을 선택할 수 있어요.';
    } else {
      descEl.innerHTML = '엔딩 제단(왕좌)에 도착했어요!<br/>월드맵으로 이동하거나 엔딩 세상을 자유롭게 더 둘러볼 수 있어요.';
    }
  }

  playSfx('switch');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeEndingWorldMapChoiceModal(showLookAroundToast = false) {
  const modal = document.getElementById('ending-map-choice-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
  if (showLookAroundToast) {
    const landmarkWord = (currentEpisode === 'exodus') ? '십계명으로' : '제단으로';
    showToast(`🌈 엔딩 세상을 자유롭게 둘러보세요! (다시 ${landmarkWord} 다가오면 이동 창이 열려요)`);
  }
}

async function syncPlayerProgressFromSheet() {
  loadLocalPlayerProgress(explorerName);
  updateWorldMapEpisodePinsUI();

  if (typeof GOOGLE_SHEET_WEBAPP_URL === 'undefined' || !GOOGLE_SHEET_WEBAPP_URL || GOOGLE_SHEET_WEBAPP_URL.includes('여기에_')) {
    return;
  }

  try {
    const res = await fetch(GOOGLE_SHEET_WEBAPP_URL, { redirect: 'follow' });
    const data = await res.json();
    const list = (data && data.list) ? data.list : [];
    const targetId = (explorerName || '').trim().toLowerCase();
    if (!targetId) return;

    let updated = false;
    const sheetAttemptCounts = { noah: 0, exodus: 0, david: 0, miracle: 0 };

    list.forEach(row => {
      const rowName = String(row.name || '').trim().toLowerCase();
      if (rowName !== targetId) return;

      const ep = String(row.episode || 'noah').trim();
      if (!playerProgressData[ep]) return;

      const statusStr = String(row.status || '');
      const stNum = parseInt(row.stage || 0, 10);
      const certStr = String(row.certCode || '-').trim();

      if (statusStr.includes('게임시작') || statusStr.includes('재도전') || statusStr.includes('바로진입')) {
        sheetAttemptCounts[ep] = (sheetAttemptCounts[ep] || 0) + 1;
      }

      if (statusStr.includes('완주') || stNum >= 4 || (certStr !== '-' && certStr.length >= 4)) {
        if (playerProgressData[ep].maxClearedStage < 4 || !playerProgressData[ep].completed || !playerProgressData[ep].certIssued) {
          playerProgressData[ep].maxClearedStage = 4;
          playerProgressData[ep].completed = true;
          playerProgressData[ep].certIssued = true;
          updated = true;
        }
      } else if (statusStr.includes('클리어') && stNum >= 1 && stNum <= 3) {
        if (stNum > playerProgressData[ep].maxClearedStage) {
          playerProgressData[ep].maxClearedStage = stNum;
          updated = true;
        }
        if (stNum >= 3 && !playerProgressData[ep].completed) {
          playerProgressData[ep].completed = true;
          updated = true;
        }
      }
    });

    EPISODE_ORDER.forEach(ep => {
      if (sheetAttemptCounts[ep] > (playerProgressData[ep].attempts || 0)) {
        playerProgressData[ep].attempts = sheetAttemptCounts[ep];
        updated = true;
      }
    });

    if (updated) {
      saveLocalPlayerProgress(explorerName);
      updateWorldMapEpisodePinsUI();
    }
  } catch (e) {}
}

function getEpisodeLockState(epKey) {
  const plugin = EPISODE_REGISTRY[epKey];

  if (EPISODE_MASTER_ADMIN_LOCK[epKey] || (plugin && plugin.locked)) {
    return {
      locked: true,
      reason: 'admin_locked',
      message: (plugin && plugin.lockedMessage) || '🔒 해당 에피소드는 추후 오픈 예정입니다!'
    };
  }

  if (epKey !== 'noah' && epKey !== 'exodus' && !plugin) {
    return {
      locked: true,
      reason: 'not_implemented',
      message: '🔒 해당 에피소드는 추후 오픈 예정입니다!'
    };
  }

  const orderIdx = EPISODE_ORDER.indexOf(epKey);
  if (orderIdx > 0) {
    const prevEpKey = EPISODE_ORDER[orderIdx - 1];
    const prevProg = playerProgressData[prevEpKey];
    const prevCleared = prevProg && (prevProg.completed || prevProg.maxClearedStage >= 3);
    if (!prevCleared) {
      const prevMeta = EPISODE_META_INFO[prevEpKey];
      return {
        locked: true,
        reason: 'prev_not_cleared',
        message: `🔒 먼저 [에피소드 ${prevMeta.num}: ${prevMeta.title}]을(를) 클리어하면 열립니다!`
      };
    }
  }

  return { locked: false, reason: 'unlocked', message: '' };
}

function updateWorldMapEpisodePinsUI() {
  EPISODE_ORDER.forEach(epKey => {
    const meta = EPISODE_META_INFO[epKey];
    const badgeEl = document.getElementById(`map-badge-${epKey}`);
    const pinEl = document.getElementById(`map-pin-${epKey}`);
    if (!badgeEl) return;

    const lockState = getEpisodeLockState(epKey);
    const prog = playerProgressData[epKey] || { maxClearedStage: 0, completed: false };

    if (lockState.locked) {
      if (lockState.reason === 'prev_not_cleared') {
        badgeEl.className = 'inline-block px-1.5 py-0.2 rounded bg-amber-600 text-white font-jua text-[8px] sm:text-[9px] leading-tight';
        badgeEl.textContent = `EP ${meta.num} · 🔒이전단계필요`;
      } else {
        badgeEl.className = 'inline-block px-1.5 py-0.2 rounded bg-slate-600 text-white font-jua text-[8px] sm:text-[9px] leading-tight';
        badgeEl.textContent = `EP ${meta.num} · 🔒잠김`;
      }
      if (pinEl && epKey !== 'noah') pinEl.classList.add('opacity-92');
    } else {
      if (pinEl) pinEl.classList.remove('opacity-92');
      if (prog.completed || prog.maxClearedStage >= 3) {
        badgeEl.className = 'inline-block px-1.5 py-0.2 rounded bg-emerald-600 text-white font-jua text-[8px] sm:text-[9px] leading-tight';
        badgeEl.textContent = `EP ${meta.num} · 🏅완주(선택가능)`;
      } else if (prog.maxClearedStage > 0) {
        badgeEl.className = 'inline-block px-1.5 py-0.2 rounded bg-sky-600 text-white font-jua text-[8px] sm:text-[9px] leading-tight';
        badgeEl.textContent = `EP ${meta.num} · 🚩ST${prog.maxClearedStage}클리어`;
      } else {
        badgeEl.className = 'inline-block px-1.5 py-0.2 rounded bg-emerald-600 text-white font-jua text-[8px] sm:text-[9px] leading-tight';
        badgeEl.textContent = `EP ${meta.num} · 출발`;
      }
    }
  });
}

function closeEpisodeStageSelectModal() {
  const modal = document.getElementById('episode-stage-select-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

function openEpisodeStageSelectModal(epKey) {
  const modal = document.getElementById('episode-stage-select-modal');
  const iconEl = document.getElementById('ep-select-icon');
  const titleEl = document.getElementById('ep-select-title');
  const descEl = document.getElementById('ep-select-desc');
  const btnsEl = document.getElementById('ep-select-buttons');
  if (!modal || !btnsEl) {
    currentEpisode = epKey;
    openScreen(null);
    startVoxelGame(currentMode, 1, false);
    return;
  }

  const meta = EPISODE_META_INFO[epKey] || { num: 1, title: '성경 탐험', icon: '🛶' };
  const prog = playerProgressData[epKey] || { maxClearedStage: 0, completed: false };
  const allMiracleUnlocked = (epKey === 'miracle') && (
    prog.completed || (prog.maxClearedStage || 0) >= 4 ||
    (typeof isMiracleAllStagesUnlocked === 'function' && isMiracleAllStagesUnlocked())
  );
  const maxSelectableStage = Math.min(4, (prog.maxClearedStage || 0) + 1);

  if (iconEl) iconEl.textContent = meta.icon;
  if (titleEl) titleEl.textContent = `에피소드 ${meta.num} : ${meta.title}`;
  if (descEl) {
    descEl.textContent = allMiracleUnlocked
      ? `${explorerDisplayName || explorerName} 대원님! 2회차 자유 모드가 열렸어요. 오픈월드와 모든 스테이지를 자유롭게 선택하세요!`
      : `${explorerDisplayName || explorerName} 대원님이 클리어한 스테이지를 선택해 바로 출발하세요!`;
  }

  btnsEl.innerHTML = '';
  if (epKey === 'miracle') {
    const miracleItems = [
      { id: 'openworld', label: '🌿 오픈월드 탐험 시작', stageNum: 0, isEnding: false, unlocked: true, cleared: allMiracleUnlocked },
      { id: 'main1_boat', label: '⛵ 스테이지 1 : 갈릴리 바다 풍랑', stageNum: 1, isEnding: false, unlocked: true, cleared: (prog.maxClearedStage >= 1) || allMiracleUnlocked },
      { id: 'main2_loaves', label: '🐟 스테이지 2 : 오병이어의 기적', stageNum: 2, isEnding: false, unlocked: allMiracleUnlocked || (prog.maxClearedStage >= 1), cleared: (prog.maxClearedStage >= 2) || allMiracleUnlocked },
      { id: 'main3_cross', label: '✝️ 스테이지 3 : 십자가의 길', stageNum: 3, isEnding: false, unlocked: allMiracleUnlocked || (prog.maxClearedStage >= 2), cleared: (prog.maxClearedStage >= 3) || allMiracleUnlocked },
      { id: 'main4_tomb', label: '🌅 스테이지 4 : 빈 무덤 부활', stageNum: 4, isEnding: false, unlocked: allMiracleUnlocked || (prog.maxClearedStage >= 3), cleared: (prog.maxClearedStage >= 4) || allMiracleUnlocked },
      { id: 'ascension', label: '☁️ 엔딩 세상 : 감람산 승천', stageNum: 5, isEnding: true, unlocked: allMiracleUnlocked || prog.completed || (prog.maxClearedStage >= 4), cleared: prog.completed || allMiracleUnlocked }
    ];
    miracleItems.forEach((item) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      if (item.unlocked) {
        btn.className = item.isEnding
          ? 'mc-btn w-full py-2 px-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-jua text-sm flex items-center justify-between'
          : (item.id === 'openworld'
            ? 'mc-btn w-full py-2 px-4 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-jua text-sm flex items-center justify-between'
            : 'mc-btn w-full py-2 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-jua text-sm flex items-center justify-between');
        btn.innerHTML = `
          <span>${item.label}</span>
          <span class="text-xs px-2 py-0.5 rounded-full ${item.cleared ? 'bg-white/25 text-white' : 'bg-amber-300 text-slate-950'}">
            ${item.id === 'openworld' ? (allMiracleUnlocked ? '🔓 전체해금' : '🗺️ 탐험') : (item.cleared ? '✅ 클리어' : '🔥 도전')}
          </span>
        `;
        btn.onclick = () => {
          closeEpisodeStageSelectModal();
          currentEpisode = epKey;
          openScreen(null);
          if (item.id === 'openworld') {
            startVoxelGame(currentMode, 1, true);
          } else if (item.id === 'ascension') {
            startVoxelGame(currentMode, 4, true);
          } else if (typeof window.startMiracleDirectSubStage === 'function') {
            window.startMiracleDirectSubStage(item.id);
          } else {
            startVoxelGame(currentMode, Math.min(3, item.stageNum), true);
          }
        };
      } else {
        btn.className = 'mc-btn w-full py-2 px-4 rounded-2xl bg-slate-200 text-slate-400 font-jua text-sm flex items-center justify-between cursor-not-allowed opacity-75';
        btn.innerHTML = `
          <span>🔒 ${item.label.replace(/^[^ ]+\s*/, '')}</span>
          <span class="text-[11px]">이전 스테이지 클리어 필요</span>
        `;
        btn.onclick = () => {
          playSfx('wrong');
          showToast('🔒 먼저 이전 스테이지를 클리어해야 선택할 수 있어요!');
        };
      }
      btnsEl.appendChild(btn);
    });
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    return;
  }

  const stageLabels = {
    1: '스테이지 1 다시 출발하기',
    2: '스테이지 2 바로 시작하기',
    3: '스테이지 3 바로 시작하기',
    4: '🌈 엔딩 세상 둘러보기'
  };

  for (let st = 1; st <= 4; st++) {
    const isUnlocked = prog.completed || (st <= maxSelectableStage) || (st === 4 && prog.completed);
    const isCleared = (st <= prog.maxClearedStage) || (st === 4 && prog.completed);

    const btn = document.createElement('button');
    btn.type = 'button';
    if (isUnlocked) {
      btn.className = st === 4
        ? 'mc-btn w-full py-2.5 px-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-jua text-sm flex items-center justify-between'
        : 'mc-btn w-full py-2.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-jua text-sm flex items-center justify-between';
      btn.innerHTML = `
        <span>${stageLabels[st]}</span>
        <span class="text-xs px-2 py-0.5 rounded-full ${isCleared ? 'bg-white/25 text-white' : 'bg-amber-300 text-slate-950'}">
          ${isCleared ? '✅ 클리어' : '🔥 도전'}
        </span>
      `;
      btn.onclick = () => {
        closeEpisodeStageSelectModal();
        currentEpisode = epKey;
        openScreen(null);
        startVoxelGame(currentMode, st, true);
      };
    } else {
      btn.className = 'mc-btn w-full py-2.5 px-4 rounded-2xl bg-slate-200 text-slate-400 font-jua text-sm flex items-center justify-between cursor-not-allowed opacity-75';
      btn.innerHTML = `
        <span>🔒 스테이지 ${st === 4 ? '엔딩' : st}</span>
        <span class="text-[11px]">스테이지 ${st - 1} 클리어 필요</span>
      `;
      btn.onclick = () => {
        playSfx('wrong');
        showToast(`🔒 먼저 스테이지 ${st - 1}을(를) 클리어해야 선택할 수 있어요!`);
      };
    }
    btnsEl.appendChild(btn);
  }

  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function openScreen(screenId) {
  ['screen-opening', 'screen-class', 'screen-map'].forEach(id => {
    const el = document.getElementById(id);
    if (id === screenId) { el.classList.remove('hidden'); el.classList.add('flex'); }
    else { el.classList.add('hidden'); el.classList.remove('flex'); }
  });
  closeEpisodeStageSelectModal();
  closeEndingWorldMapChoiceModal();

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
    const epPlugin = getActiveEpisodePlugin();
    if (epPlugin && typeof epPlugin.onCloseScreen === 'function') epPlugin.onCloseScreen();
    if (window.MiracleMultiplayer && typeof window.MiracleMultiplayer.leaveRoom === 'function') {
      window.MiracleMultiplayer.leaveRoom();
    }
    document.getElementById('hud-top').classList.add('hidden');
    document.getElementById('joystick-zone').style.display = 'none';
    document.getElementById('cam-bottom-bar').style.display = 'none';
    document.getElementById('action-zone').style.display = 'none';
    document.getElementById('ending-modal').classList.add('hidden');
    document.getElementById('ending-modal').classList.remove('flex');
    document.getElementById('retry-modal').classList.add('hidden');
    document.getElementById('retry-modal').classList.remove('flex');

    if (screenId === 'screen-class' || screenId === 'screen-map') {
      startMenuAdventureBgm();
      if (screenId === 'screen-map') {
        updateWorldMapEpisodePinsUI();
      }
    } else if (screenId === 'screen-opening') {
      isMenuBgmActive = false;
      stopStageBgm();
    }
  }
}

function goToClassSelect() {
  const nameInput = document.getElementById('opening-name-input');
  const birthInput = document.getElementById('opening-birth-input');
  const rawName = nameInput ? nameInput.value.trim() : '';
  const rawBirth = birthInput ? birthInput.value.replace(/[^0-9]/g, '').trim() : '';

  explorerDisplayName = rawName || '믿음의용사';
  explorerBirth = rawBirth;
  explorerName = rawBirth ? `${explorerDisplayName}(${rawBirth})` : explorerDisplayName;
  window.explorerName = explorerName;

  document.getElementById('class-hello-name').textContent =
    `🙌 ${explorerDisplayName}${rawBirth ? ' (' + rawBirth + ')' : ''} 대원님, 환영해요!`;

  playSfx('rescue');
  openScreen('screen-class');
  startMenuAdventureBgm();
  syncPlayerProgressFromSheet();
}

function selectClassAndShowMap(mode) {
  currentMode = mode;
  document.getElementById('map-selected-badge').textContent = `${MODE_META[mode].badge} · ${explorerDisplayName || explorerName}`;
  playSfx('jump');
  openScreen('screen-map');
}

function isEpisode4CompletedForMultiplayer() {
  if (playerProgressData && playerProgressData.miracle) {
    const mp = playerProgressData.miracle;
    if (mp.completed || mp.certIssued || (mp.maxClearedStage || 0) >= 4) return true;
  }
  if (typeof miracleAscensionSeen !== 'undefined' && miracleAscensionSeen) return true;
  if (typeof isMiracleAllStagesUnlocked === 'function' && isMiracleAllStagesUnlocked()) return true;
  return false;
}
window.isEpisode4CompletedForMultiplayer = isEpisode4CompletedForMultiplayer;

function launchEpisode(ep) {
  const lockState = getEpisodeLockState(ep);
  if (lockState.locked) {
    playSfx('wrong');
    showToast(lockState.message);
    return;
  }

  const prog = playerProgressData[ep];
  const miracleUnlockedLocally = (ep === 'miracle' && typeof isMiracleAllStagesUnlocked === 'function' && isMiracleAllStagesUnlocked());
  if (miracleUnlockedLocally || (prog && (prog.maxClearedStage >= 1 || prog.completed))) {
    playSfx('switch');
    openEpisodeStageSelectModal(ep);
    return;
  }

  currentEpisode = ep;
  openScreen(null);
  startVoxelGame(currentMode, 1, false);
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
let lastGroundedY = 0;
let currentMoveSpeed = 0;
let playerSpeedBoostTimer = 0;
let playerChopAnimTimer = 0;

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
let choppingTrees = [];
let buildZones = [];
let activeBuildTarget = null;
let hammerAnimTimer = 0;
let hammerTargetPos = null;

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
let seaClosingWaves = [];

let sinaiCrumbles = [];
let sinaiMagmaBlocks = [];
let sinaiHazardZones = [];
let sinaiCloudLayers = [];
let sinaiWaitingPeople = [];
let sinaiSafeCheckpoints = [];
let sinaiStepNodes = [];
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
  mesh.castShadow = true; mesh.receiveShadow = true;
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
// =========================================================================
// [core.js - 파트 2/2] 3D 캐릭터·자연물 팩토리, 엔딩 방주 배치, 2회차 월드맵 선택창, passUnderY 물리 엔진
// =========================================================================

function getBaseGroundHeight(x, z) {
  const epPlugin = getActiveEpisodePlugin();
  if (epPlugin && typeof epPlugin.getBaseGroundHeight === 'function') {
    return epPlugin.getBaseGroundHeight(x, z, currentStage);
  }
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

  const axeTool = new THREE.Group();
  axeTool.add(
    createBox(0.1, 0.75, 0.1, matVoxel('#78350f'), 0, -0.65, 0.28, false),
    createBox(0.14, 0.36, 0.46, matVoxel('#cbd5e1', '#64748b'), 0, -0.82, 0.42, false)
  );
  axeTool.visible = false;
  lArm.add(axeTool);

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
  playerLimbs = { lLeg, rLeg, lArm, rArm, axeTool };
  return g;
}

function updateCarriedBlocksVisual() {
  if (!carriedBlockGroup) return;
  const keepMiracleCross = (
    currentEpisode === 'miracle' &&
    typeof miracleSubMode !== 'undefined' &&
    miracleSubMode === 'main3_cross' &&
    typeof miracleActiveMiniState !== 'undefined' &&
    miracleActiveMiniState &&
    miracleActiveMiniState.phase === 'carry'
  );
  if (!keepMiracleCross) {
    while (carriedBlockGroup.children.length > 0) carriedBlockGroup.remove(carriedBlockGroup.children[0]);
    for (let i = 0; i < Math.min(heldBlocks, 6); i++) {
      const logItem = createLogBlockMesh(0.58, 0.32, 0.42);
      logItem.position.set(0, i * 0.36, 0);
      carriedBlockGroup.add(logItem);
    }
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
  const epPlugin = getActiveEpisodePlugin();
  if (epPlugin && typeof epPlugin.createHeroMesh === 'function') {
    playerGroup = epPlugin.createHeroMesh();
  } else {
    playerGroup = createHeroMesh(currentEpisode === 'exodus');
  }
  guideArrowGroup = createGuideArrowMesh();
  guideArrowGroup.visible = (currentMode !== 'senior');
  playerGroup.add(guideArrowGroup);
  playerGroup.position.copy(playerPos);
  scene.add(playerGroup);
  document.getElementById('hud-avatar-icon').textContent = (epPlugin && epPlugin.avatarIcon)
    ? epPlugin.avatarIcon
    : ((currentEpisode === 'exodus') ? '🪄' : '🧔🏻');
}

function createBlazingPillarOfFire(x, y, z, scale = 1.0) {
  const pGroup = new THREE.Group();
  const baseMat = matVoxel('#fde047', '#ca8a04');
  const outerFireMat = new THREE.MeshBasicMaterial({ color: 0xea580c, transparent: true, opacity: 0.82 });
  const midFireMat = new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.90 });
  const innerFireMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  const skyCrownMat = new THREE.MeshBasicMaterial({ color: 0xfde047, transparent: true, opacity: 0.72 });
  const cloudMat = matVoxel('#f8fafc', '#e2e8f0');
  const warmCloudMat = matVoxel('#fed7aa', '#fdba74');

  const altarBase = createBox(4.6 * scale, 1.0 * scale, 4.6 * scale, baseMat, 0, 0.5 * scale, 0);
  const outerCore = createBox(3.0 * scale, 54.0 * scale, 3.0 * scale, outerFireMat, 0, 27.5 * scale, 0, false);
  const midCore = createBox(2.15 * scale, 57.0 * scale, 2.15 * scale, midFireMat, 0, 29.0 * scale, 0, false);
  const innerCore = createBox(1.25 * scale, 60.0 * scale, 1.25 * scale, innerFireMat, 0, 30.5 * scale, 0, false);
  const skyCrown = createBox(4.4 * scale, 6.5 * scale, 4.4 * scale, skyCrownMat, 0, 56.0 * scale, 0, false);

  const cloudRing1 = createBox(3.8 * scale, 1.25 * scale, 3.8 * scale, cloudMat, 0, 2.5 * scale, 0, false);
  const cloudRing2 = createBox(3.5 * scale, 1.15 * scale, 3.5 * scale, warmCloudMat, 0, 10.5 * scale, 0, false);
  const cloudRing3 = createBox(3.3 * scale, 1.10 * scale, 3.3 * scale, cloudMat, 0, 20.5 * scale, 0, false);
  const cloudRing4 = createBox(3.6 * scale, 1.20 * scale, 3.6 * scale, warmCloudMat, 0, 32.0 * scale, 0, false);
  const cloudRing5 = createBox(4.2 * scale, 1.35 * scale, 4.2 * scale, cloudMat, 0, 45.0 * scale, 0, false);

  pGroup.add(
    altarBase,
    outerCore,
    midCore,
    innerCore,
    skyCrown,
    cloudRing1,
    cloudRing2,
    cloudRing3,
    cloudRing4,
    cloudRing5
  );

  const extraRings = [
    { mesh: cloudRing2, baseY: 10.5 * scale, dir: 1, spd: 2.2 },
    { mesh: cloudRing3, baseY: 20.5 * scale, dir: -1, spd: 2.5 },
    { mesh: cloudRing4, baseY: 32.0 * scale, dir: 1, spd: 2.0 },
    { mesh: cloudRing5, baseY: 45.0 * scale, dir: -1, spd: 1.7 }
  ];

  const embers = [];
  const emberColors = [0xfef08a, 0xfde047, 0xf97316, 0xef4444, 0xfb923c];
  const emberCount = 44;
  const maxPillarH = 56.0 * scale;
  for (let i = 0; i < emberCount; i++) {
    const eMat = new THREE.MeshBasicMaterial({ color: emberColors[i % emberColors.length] });
    const sz = (0.36 + (i % 3) * 0.18) * scale;
    const ember = createBox(sz, sz * 1.6, sz, eMat, 0, 1.0, 0, false);
    const angle = (i / emberCount) * Math.PI * 2;
    const radius = (1.05 + (i % 4) * 0.45) * scale;
    pGroup.add(ember);
    embers.push({
      mesh: ember, angle, radius,
      speedY: (6.2 + (i % 5) * 1.45) * scale,
      yOffset: (i / emberCount) * maxPillarH,
      maxH: maxPillarH,
      phase: i * 0.7
    });
  }

  pGroup.position.set(x, y, z);
  pGroup.userData = {
    fireCore: midCore,
    outerCore,
    innerCore,
    skyCrown,
    cloudRing: cloudRing1,
    cloudRing2,
    extraRings,
    embers,
    scale
  };
  worldGroup.add(pGroup);
  blazingPillars.push(pGroup);
  return pGroup;
}

function createSwirlingPillarOfCloud(x, y, z, scale = 1.0) {
  const pGroup = new THREE.Group();
  const baseMat = matVoxel('#cbd5e1', '#94a3b8');
  const outerCloudMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.80 });
  const midCloudMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc, transparent: true, opacity: 0.90 });
  const innerGlowMat = new THREE.MeshBasicMaterial({ color: 0xbae6fd });
  const skyCrownMat = new THREE.MeshBasicMaterial({ color: 0xf0f9ff, transparent: true, opacity: 0.76 });
  const puffMat = matVoxel('#ffffff', '#e0f2fe');
  const softSkyCloudMat = matVoxel('#e0f2fe', '#bae6fd');

  const altarBase = createBox(4.6 * scale, 1.0 * scale, 4.6 * scale, baseMat, 0, 0.5 * scale, 0);
  const outerCore = createBox(3.0 * scale, 54.0 * scale, 3.0 * scale, outerCloudMat, 0, 27.5 * scale, 0, false);
  const midCore = createBox(2.15 * scale, 57.0 * scale, 2.15 * scale, midCloudMat, 0, 29.0 * scale, 0, false);
  const innerCore = createBox(1.25 * scale, 60.0 * scale, 1.25 * scale, innerGlowMat, 0, 30.5 * scale, 0, false);
  const skyCrown = createBox(4.6 * scale, 6.5 * scale, 4.6 * scale, skyCrownMat, 0, 56.0 * scale, 0, false);

  const cloudRing1 = createBox(3.9 * scale, 1.30 * scale, 3.9 * scale, puffMat, 0, 2.5 * scale, 0, false);
  const cloudRing2 = createBox(3.6 * scale, 1.20 * scale, 3.6 * scale, softSkyCloudMat, 0, 10.5 * scale, 0, false);
  const cloudRing3 = createBox(3.4 * scale, 1.15 * scale, 3.4 * scale, puffMat, 0, 20.5 * scale, 0, false);
  const cloudRing4 = createBox(3.7 * scale, 1.25 * scale, 3.7 * scale, softSkyCloudMat, 0, 32.0 * scale, 0, false);
  const cloudRing5 = createBox(4.3 * scale, 1.40 * scale, 4.3 * scale, puffMat, 0, 45.0 * scale, 0, false);

  pGroup.add(
    altarBase,
    outerCore,
    midCore,
    innerCore,
    skyCrown,
    cloudRing1,
    cloudRing2,
    cloudRing3,
    cloudRing4,
    cloudRing5
  );

  const extraRings = [
    { mesh: cloudRing2, baseY: 10.5 * scale, dir: -1, spd: 2.0 },
    { mesh: cloudRing3, baseY: 20.5 * scale, dir: 1, spd: 2.3 },
    { mesh: cloudRing4, baseY: 32.0 * scale, dir: -1, spd: 1.9 },
    { mesh: cloudRing5, baseY: 45.0 * scale, dir: 1, spd: 1.6 }
  ];

  const embers = [];
  const cloudColors = [0xffffff, 0xf8fafc, 0xe0f2fe, 0xbae6fd, 0xcbd5e1];
  const puffCount = 44;
  const maxPillarH = 56.0 * scale;
  for (let i = 0; i < puffCount; i++) {
    const cMat = new THREE.MeshBasicMaterial({ color: cloudColors[i % cloudColors.length], transparent: true, opacity: 0.9 });
    const sz = (0.42 + (i % 3) * 0.18) * scale;
    const puff = createBox(sz * 1.35, sz, sz * 1.35, cMat, 0, 1.0, 0, false);
    const angle = (i / puffCount) * Math.PI * 2;
    const radius = (1.08 + (i % 4) * 0.45) * scale;
    pGroup.add(puff);
    embers.push({
      mesh: puff, angle, radius,
      speedY: (5.6 + (i % 5) * 1.35) * scale,
      yOffset: (i / puffCount) * maxPillarH,
      maxH: maxPillarH,
      phase: i * 0.8
    });
  }

  pGroup.position.set(x, y, z);
  pGroup.userData = {
    fireCore: midCore,
    outerCore,
    innerCore,
    skyCrown,
    cloudRing: cloudRing1,
    cloudRing2,
    extraRings,
    embers,
    scale
  };
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
    u.outerCore.scale.set(pulse, 1 + Math.cos(now * 0.012) * 0.05, pulse);
    u.fireCore.scale.set(1 / pulse, 1 + Math.sin(now * 0.018) * 0.07, 1 / pulse);
    if (u.skyCrown) {
      u.skyCrown.rotation.y -= dt * 2.0;
      const crownPulse = 1 + Math.sin(now * 0.01) * 0.18;
      u.skyCrown.scale.set(crownPulse, 1, crownPulse);
    }

    u.cloudRing.rotation.y -= dt * 1.8;
    u.cloudRing.position.y = (2.2 + Math.sin(now * 0.005) * 0.45) * u.scale;
    if (u.extraRings && u.extraRings.length > 0) {
      u.extraRings.forEach((er, idx) => {
        er.mesh.rotation.y += dt * er.spd * er.dir;
        er.mesh.position.y = er.baseY + Math.cos(now * 0.006 + idx * 1.2) * (0.65 * u.scale);
      });
    } else if (u.cloudRing2) {
      u.cloudRing2.rotation.y += dt * 2.2;
      u.cloudRing2.position.y = (5.6 + Math.cos(now * 0.006) * 0.55) * u.scale;
    }

    if (u.embers) {
      u.embers.forEach(e => {
        e.yOffset += e.speedY * dt;
        if (e.yOffset > e.maxH) e.yOffset = 0.8 * u.scale;
        const prog = e.yOffset / e.maxH;
        const curAngle = e.angle + now * 0.004 + prog * 3.2;
        const curRad = e.radius * (1 - prog * 0.22) + Math.sin(now * 0.01 + e.phase) * 0.28;
        e.mesh.position.set(Math.cos(curAngle) * curRad, e.yOffset, Math.sin(curAngle) * curRad);
        const s = Math.max(0.28, 1.2 - prog * 0.75);
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
    if (currentStage === 4 && currentEpisode === 'noah' && Math.abs(gx) < 20 && gz > 10) continue;
    worldGroup.add(createBox(0.18, 0.45, 0.18, bladeMat1, gx, 0.22, gz, false), createBox(0.16, 0.35, 0.16, bladeMat2, gx + 0.22, 0.18, gz + 0.14, false));
    if (i % 3 === 0) worldGroup.add(createBox(0.22, 0.22, 0.22, new THREE.MeshBasicMaterial({ color: flowerColors[i % flowerColors.length] }), gx + 0.1, 0.42, gz - 0.1, false));
  }
}

function buildGrassAndTreeBorders(limit, isDesert = false) {
  currentMapBounds = limit - 2.0;
  const step = 10;
  const spanLen = step - 0.06;

  let stepIdx = 0;
  for (let i = -limit - 20; i <= limit + 20; i += step) {
    stepIdx++;
    const sideSpecs = [
      { bx: -limit - 8, bz: i, isXWall: true },
      { bx:  limit + 8, bz: i, isXWall: true },
      { bx: i, bz: -limit - 8, isXWall: false },
      { bx: i, bz:  limit + 8, isXWall: false }
    ];

    sideSpecs.forEach(({ bx, bz, isXWall }, sIdx) => {
      if (!isXWall && Math.abs(i) > limit) return;

      const h1 = 4 + (Math.abs(Math.round(bx + bz)) % 4) + (stepIdx % 2) * 0.08;
      const h2 = h1 + 4.0;
      const c1 = isDesert ? matVoxel('#f59e0b', '#d97706').clone() : matVoxel('#22c55e', '#16a34a').clone();
      const c2 = isDesert ? matVoxel('#b45309', '#92400e').clone() : matVoxel('#15803d', '#166534').clone();

      const w1 = isXWall ? (step + 1.8) : spanLen;
      const d1 = isXWall ? spanLen : (step + 1.8);
      const w2 = isXWall ? (step + 3.6) : spanLen;
      const d2 = isXWall ? spanLen : (step + 3.6);

      const bx2 = isXWall ? (bx + Math.sign(bx) * 5.5) : bx;
      const bz2 = isXWall ? bz : (bz + Math.sign(bz) * 5.5);

      const hill1 = createBox(w1, h1, d1, c1, bx, h1 / 2 + 0.02, bz);
      const hill2 = createBox(w2, h2, d2, c2, bx2, h2 / 2 - 0.03, bz2);
      worldGroup.add(hill1, hill2);
      wallMeshes.push(hill1, hill2);

      if (isDesert) addPalmTree(bx + ((stepIdx + sIdx) % 3 - 1), bz, 1.2, true);
      else addTree(bx + ((stepIdx + sIdx) % 3 - 1), bz, 1.25, true);
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

function disposeObject3DResources(root) {
  if (!root) return;
  const disposedGeos = new Set();
  const disposedMats = new Set();
  root.traverse(obj => {
    if (obj.geometry && !(obj.geometry.userData && obj.geometry.userData._cached) && !disposedGeos.has(obj.geometry)) {
      disposedGeos.add(obj.geometry);
      try { obj.geometry.dispose(); } catch (e) {}
    }
    if (obj.material) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach(mat => {
        if (!mat || (mat.userData && mat.userData._cached) || disposedMats.has(mat)) return;
        disposedMats.add(mat);
        if (mat.map && !(mat.map.userData && mat.map.userData._cached)) {
          try { mat.map.dispose(); } catch (e) {}
        }
        try { mat.dispose(); } catch (e) {}
      });
    }
  });
}

function clearWorld() {
  if (Array.isArray(fadedMaterials) && fadedMaterials.length > 0) {
    fadedMaterials.forEach(item => {
      if (item && item.mesh && item.origMat) {
        item.mesh.material = item.origMat;
      } else if (item && item.opacity !== undefined) {
        item.transparent = false;
        item.opacity = 1.0;
      }
    });
  }
  if (worldGroup) {
    scene.remove(worldGroup);
    disposeObject3DResources(worldGroup);
  }
  worldGroup = new THREE.Group();
  scene.add(worldGroup);
  colliders = []; platforms = []; wallMeshes = []; fadedMaterials = [];
  torchFlames = []; stageAnimals = []; arkFriends = []; followingAnimals = []; endingAnimalPairs = [];
  collectibleBlocks = []; choppingTrees = []; buildZones = [];
  exodusFollowers = []; mosesTrailHistory = []; exodusSeagulls = [];
  endingCelebrationPeople = [];
  egyptianSoldiers = []; stage2Puddles = []; stage2JumpObstacles = []; stage2Pearls = [];
  seaWallFishes = []; flowingWaterTextures = []; blazingPillars = []; seaClosingWaves = [];
  sinaiCrumbles = []; sinaiMagmaBlocks = []; sinaiHazardZones = []; sinaiCloudLayers = [];
  sinaiWaitingPeople = []; sinaiSafeCheckpoints = []; sinaiStepNodes = []; sinaiClocks = [];
  summitSparkles = [];
  hammerAnimTimer = 0; hammerTargetPos = null;
  playerSpeedBoostTimer = 0; playerChopAnimTimer = 0;
  lastGroundedY = 0;
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

  Object.values(EPISODE_REGISTRY).forEach(plugin => {
    if (plugin && typeof plugin.clearState === 'function') plugin.clearState();
  });

  document.getElementById('labels-container').innerHTML = '';
  document.getElementById('context-action-btn').classList.add('hidden');
  document.getElementById('puzzle-build-btn').classList.add('hidden');
  document.getElementById('cert-open-btn').classList.add('hidden');
  updateCarriedBlocksVisual();
}

function buildEndingWorld() {
  clearWorld();
  currentStage = 4; certAutoShown = false; startStageBgm(4);
  const epPlugin = getActiveEpisodePlugin();
  const allowCert = canShowCertificateForCurrentRun();

  if (epPlugin && typeof epPlugin.buildEndingWorld === 'function') {
    epPlugin.buildEndingWorld();
    snapCameraToPlayer();
    updateStageHUD();
    const certBtn = document.getElementById('cert-open-btn');
    if (certBtn) {
      if (allowCert && currentEpisode !== 'david') certBtn.classList.remove('hidden');
      else certBtn.classList.add('hidden');
    }
    if (epPlugin.endingToast) showToast(epPlugin.endingToast);
    return;
  }
  if (currentEpisode === 'david' && typeof buildDavidEndingWorld === 'function') {
    buildDavidEndingWorld();
    snapCameraToPlayer();
    updateStageHUD();
    const certBtn = document.getElementById('cert-open-btn');
    if (certBtn) certBtn.classList.add('hidden');
    return;
  }
  if (currentEpisode === 'miracle' && typeof buildMiracleEndingWorld === 'function') {
    buildMiracleEndingWorld();
    snapCameraToPlayer();
    updateStageHUD();
    return;
  }

  const isExodus = (currentEpisode === 'exodus');
  scene.background = new THREE.Color(isExodus ? 0x38bdf8 : 0x60a5fa);
  scene.fog = new THREE.Fog(isExodus ? 0x38bdf8 : 0x60a5fa, 55, 165);

  const groundMat = new THREE.MeshLambertMaterial({ map: isExodus ? makeDesertSandTex() : makeGrassFieldTex() });
  worldGroup.add(createBox(120, 1, 120, groundMat, 0, -0.5, 0));
  scatterMeadowGrassTufts(32);
  buildGrassAndTreeBorders(34, isExodus);

  const treeCoords = isExodus
    ? [[-18, 12], [18, 12], [-22, -4], [22, -4], [-16, -18], [16, -18], [-24, 20], [24, 20]]
    : [[-20, 11], [20, 11], [-22, -4], [22, -4], [-16, -18], [16, -18], [-24, 22], [24, 22]];

  treeCoords.forEach(([tx, tz]) => {
    if (isExodus) addPalmTree(tx, tz, 1.2, true);
    else addTree(tx, tz, 1.15, true);
  });

  if (!isExodus) {
    const rainbowColors = ['#ef4444', '#f97316', '#fde047', '#22c55e', '#3b82f6', '#4f46e5', '#a855f7'];
    rainbowColors.forEach((hex, idx) => {
      const radius = 26 - idx * 1.15;
      const mat = new THREE.MeshBasicMaterial({
        color: hex,
        polygonOffset: true,
        polygonOffsetFactor: -idx * 2,
        polygonOffsetUnits: -idx * 2
      });
      const boxSize = 1.5 - idx * 0.012;
      const boxDepth = 1.5 + idx * 0.04;
      const archZ = -24 + idx * 0.035;
      for (let a = 0; a <= Math.PI; a += 0.08) {
        worldGroup.add(createBox(boxSize, boxSize, boxDepth, mat, Math.cos(a) * radius, Math.sin(a) * radius + 0.03, archZ, false));
      }
    });

    // [에피소드 1 엔딩 요청사항] 무지개 반대편 빈 땅(z = 21.0)에 방주(내부 미로 탐험 가능) 및 자연스러운 다단 바위 동산 배치!
    if (typeof buildNoahEndingArkAndSteppingRocks === 'function') {
      buildNoahEndingArkAndSteppingRocks(21.0);
    }

    worldGroup.add(createBox(4.2, 1.2, 4.2, matVoxel('#94a3b8', '#64748b'), 0, 0.6, -6), createBox(2.8, 0.9, 2.8, matVoxel('#cbd5e1'), 0, 1.5, -6));
    addWallTorch(-1.6, 1.8, -4.4); addWallTorch(1.6, 1.8, -4.4);
    colliders.push({ minX: -2.55, maxX: 2.55, minZ: -8.55, maxZ: -3.45 });

    const altarLabelText = allowCert
      ? '🪨 감사의 제단 (다가가면 인증서가 열려요!)'
      : '🪨 감사의 제단 (다가가면 월드맵 이동 선택창이 열려요!)';
    targetObject = { type: 'altar', pos: new THREE.Vector3(0, 1.8, -6), label: createWorldLabel(altarLabelText), triggered: false };

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
    worldGroup.add(createBox(70, 0.8, 18, matVoxel('#0284c7', '#38bdf8'), 0, 0.1, -28, false));

    if (typeof spawnExodusSkyCloudsAndGulls === 'function') {
      spawnExodusSkyCloudsAndGulls(-10);
    }

    createSwirlingPillarOfCloud(-6.5, 0, -14.5, 1.25);
    createBlazingPillarOfFire(6.5, 0, -14.5, 1.25);

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

    const mtnRock1 = matVoxel('#d97706', '#b45309');
    const mtnRock2 = matVoxel('#b45309', '#78350f');
    const mtnCliff = matVoxel('#78716c', '#57534e');
    const sinaiPeaks = [
      { x: 0,   z: 35, w1: 30, h1: 12, w2: 22, h2: 24, w3: 14, h3: 34 },
      { x: -20, z: 32, w1: 20, h1: 10, w2: 14, h2: 19, w3: 8,  h3: 26 },
      { x: 20,  z: 32, w1: 20, h1: 10, w2: 14, h2: 19, w3: 8,  h3: 26 }
    ];
    sinaiPeaks.forEach((pk) => {
      const g1 = createBox(pk.w1, pk.h1, 14, mtnRock2.clone(), pk.x, pk.h1 / 2 + 0.02, pk.z);
      const g2 = createBox(pk.w2, pk.h2, 11, mtnRock1.clone(), pk.x, pk.h2 / 2 + 0.04, pk.z + 1.5);
      const g3 = createBox(pk.w3, pk.h3, 8,  mtnCliff.clone(), pk.x, pk.h3 / 2 + 0.06, pk.z + 2.5);
      worldGroup.add(g1, g2, g3);
      wallMeshes.push(g1, g2, g3);
    });
    const peakCloud1 = createFluffyCloudGroup(1.1, true); peakCloud1.position.set(-6, 26, 33);
    const peakCloud2 = createFluffyCloudGroup(1.2, true); peakCloud2.position.set(5, 29, 34);
    worldGroup.add(peakCloud1, peakCloud2);
    colliders.push({ minX: -32, maxX: 32, minZ: 25, maxZ: 46 });

    const exodusAltarLabel = allowCert
      ? '📜 시내산 십계명 언약의 제단 (다가가면 달란트 인증서!)'
      : '📜 시내산 십계명 언약의 제단 (다가가면 월드맵 이동 선택창!)';
    targetObject = { type: 'altar', pos: new THREE.Vector3(0, 1.8, -6), label: createWorldLabel(exodusAltarLabel), triggered: false };

    if (typeof createFollowerPersonMesh === 'function') {
      for (let i = 0; i < 20; i++) {
        const ang = (i / 20) * Math.PI * 2;
        const radius = (i % 2 === 0) ? 8.8 : 11.2;
        const px = Math.cos(ang) * radius, pz = -6 + Math.sin(ang) * radius;
        const person = createFollowerPersonMesh(i);
        person.position.set(px, 0, pz); person.lookAt(0, 0, -6);
        worldGroup.add(person);
        endingCelebrationPeople.push({ mesh: person, phase: i * 0.65 });
      }
    }
  }

  playerPos.set(0, 0, 9); playerFacing = Math.PI; cameraYaw = 0; cameraTargetYaw = 0;
  snapCameraToPlayer(); updateStageHUD();

  const certBtn = document.getElementById('cert-open-btn');
  if (certBtn) {
    if (allowCert) certBtn.classList.remove('hidden');
    else certBtn.classList.add('hidden');
  }

  if (isExodus) {
    showToast('🌴 홍해와 시내산을 모두 통과했어요! 기뻐 뛰는 백성들 가운데 십계명으로 가보세요!');
  } else {
    showToast(
      allowCert
        ? '🌈 엔딩 세상에 도착했어요! 제단으로 가거나 뒤편의 방주 안 미로와 방주 지붕 위도 구경해 보세요!'
        : '🌈 무지개 언약의 엔딩 세상이에요! 뒤편 방주 안 미로와 바위 동산을 탐험하거나 제단으로 가보세요!'
    );
  }
}

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

function getKoreanNowTimestamp() {
  try {
    const parts = new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false
    }).formatToParts(new Date());
    const get = (t) => (parts.find(p => p.type === t) || {}).value || '00';
    const hh = get('hour') === '24' ? '00' : get('hour');
    return `${get('year')}-${get('month')}-${get('day')} ${hh}:${get('minute')}:${get('second')}`;
  } catch (e) {
    return new Date(Date.now() + 9 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19);
  }
}

function sendGameLogToSheet(status, stageNum, certCode = '-') {
  if (!GOOGLE_SHEET_WEBAPP_URL || GOOGLE_SHEET_WEBAPP_URL.includes('여기에_')) return;
  const payload = {
    time: getKoreanNowTimestamp(),
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

function createWorldLabel(html) {
  const div = document.createElement('div');
  div.className = 'world-label mc-panel px-2 py-0.5 rounded-full text-[11px] font-jua text-amber-300 shadow-md whitespace-nowrap';
  div.innerHTML = html;
  document.getElementById('labels-container').appendChild(div);
  return div;
}

function rotateCameraDeg(deg) {
  cameraTargetYaw += (deg * Math.PI) / 180;
  playSfx('step');
}

// =========================================================================
// [공통 3단계 카메라 시스템] (1)기본시점 -> (2)1인칭 시점 -> (3)위를 보는 시점
// =========================================================================
window.globalCameraViewMode = 'default';

function ensureGlobalCameraViewToggleUI() {
  const camBar = document.getElementById('cam-bottom-bar');
  if (camBar && camBar.dataset.compactStyled !== 'true') {
    camBar.dataset.compactStyled = 'true';
    camBar.style.right = 'auto';
    camBar.style.transform = 'translateX(-50%)';
    camBar.style.width = 'auto';
    camBar.style.padding = '0';
    camBar.style.justifyContent = 'center';
    camBar.style.alignItems = 'center';
    camBar.style.pointerEvents = 'none';

    const existingBtns = Array.from(camBar.querySelectorAll('button')).filter(
      b => b.id !== 'global-camera-view-btn'
    );
    const squareBtnClass =
      'pointer-events-auto mc-btn w-11 h-11 p-0 rounded-xl bg-slate-900/90 hover:bg-slate-800 border-2 border-slate-400 text-white font-jua shadow-lg flex flex-col items-center justify-center leading-none shrink-0 select-none active:scale-95';

    if (existingBtns[0]) {
      existingBtns[0].className = squareBtnClass;
      existingBtns[0].innerHTML =
        '<span class="text-sm leading-none">↺</span><span class="text-[9px] text-slate-200 mt-0.5 leading-none">좌회전</span>';
      existingBtns[0].addEventListener('pointerdown', e => e.stopPropagation());
    }
    if (existingBtns[1]) {
      existingBtns[1].className = squareBtnClass;
      existingBtns[1].innerHTML =
        '<span class="text-sm leading-none">↻</span><span class="text-[9px] text-slate-200 mt-0.5 leading-none">우회전</span>';
      existingBtns[1].addEventListener('pointerdown', e => e.stopPropagation());
    }
  }

  let btn = document.getElementById('global-camera-view-btn');
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'global-camera-view-btn';
    btn.type = 'button';
    btn.addEventListener('pointerdown', e => e.stopPropagation());
    btn.onclick = function (e) {
      if (e) e.stopPropagation();
      window.cycleGlobalCameraViewMode();
    };
    btn.className =
      'pointer-events-auto mc-btn w-12 h-11 p-0 rounded-xl bg-slate-900/90 hover:bg-slate-800 border-2 border-sky-400 text-white font-jua shadow-lg flex flex-col items-center justify-center leading-none shrink-0 select-none active:scale-95';
    btn.innerHTML =
      '<span class="text-sm leading-none">🎥</span><span id="global-camera-view-label" class="text-[9px] text-sky-200 mt-0.5 leading-none">기본</span>';
  }

  if (camBar && btn.parentElement !== camBar) {
    const children = Array.from(camBar.children);
    if (children.length >= 2) {
      camBar.insertBefore(btn, children[1]);
    } else {
      camBar.appendChild(btn);
    }
  }
  return btn;
}

function setPlayerMeshVisibilityForCamera(isFpsMode) {
  if (window.noahArkCeilingGroup) {
    window.noahArkCeilingGroup.visible =
      window.globalCameraViewMode === 'fps' || window.globalCameraViewMode === 'lookup';
  }
  if (!playerGroup) return;
  playerGroup.children.forEach(child => {
    if (child === guideArrowGroup) {
      child.visible = (currentMode !== 'senior');
      if (isFpsMode) {
        child.position.set(0, 1.35, 2.2);
      } else {
        child.position.set(0, 3.35, 0);
      }
    } else {
      child.visible = !isFpsMode;
    }
  });
}

window.cycleGlobalCameraViewMode = function () {
  if (window.globalCameraViewMode === 'default') {
    window.globalCameraViewMode = 'fps';
  } else if (window.globalCameraViewMode === 'fps') {
    window.globalCameraViewMode = 'lookup';
  } else {
    window.globalCameraViewMode = 'default';
  }

  const btn = ensureGlobalCameraViewToggleUI();
  if (window.globalCameraViewMode === 'default') {
    btn.innerHTML =
      '<span class="text-sm leading-none">🎥</span><span id="global-camera-view-label" class="text-[9px] text-sky-200 mt-0.5 leading-none">기본</span>';
    setPlayerMeshVisibilityForCamera(false);
    showToast('🎥 카메라: [기본 시점]');
  } else if (window.globalCameraViewMode === 'fps') {
    btn.innerHTML =
      '<span class="text-sm leading-none">👀</span><span id="global-camera-view-label" class="text-[9px] text-emerald-300 mt-0.5 leading-none">1인칭</span>';
    setPlayerMeshVisibilityForCamera(true);
    showToast('👀 카메라: [1인칭 시점]');
  } else {
    btn.innerHTML =
      '<span class="text-sm leading-none">🌤️</span><span id="global-camera-view-label" class="text-[9px] text-amber-300 mt-0.5 leading-none">올려봄</span>';
    setPlayerMeshVisibilityForCamera(false);
    showToast('🌤️ 카메라: [올려봄 시점]');
  }
  playSfx('switch');
  snapCameraToPlayer();
};

function applyCoreCameraByMode() {
  if (!playerGroup || !camera) return;

  if (typeof davidAimState !== 'undefined' && davidAimState.active) return;
  if (typeof davidFlyingStone !== 'undefined' && davidFlyingStone.active) return;
  if (typeof davidThroneEnding !== 'undefined' && davidThroneEnding.seated && !davidThroneEnding.modalShown) return;
  if (typeof miracleAscensionState !== 'undefined' && miracleAscensionState.active) return;
  if (typeof miracleActiveFieldEvent !== 'undefined' && miracleActiveFieldEvent && miracleActiveFieldEvent.cutsceneCameraActive) return;

  const sinY = Math.sin(cameraYaw);
  const cosY = Math.cos(cameraYaw);

  if (window.globalCameraViewMode === 'fps') {
    setPlayerMeshVisibilityForCamera(true);
    const eyeX = playerPos.x - sinY * 0.15;
    const eyeY = playerPos.y + 2.15;
    const eyeZ = playerPos.z - cosY * 0.15;
    camera.position.set(eyeX, eyeY, eyeZ);
    camera.lookAt(
      playerPos.x - sinY * 12.0,
      playerPos.y + 2.10,
      playerPos.z - cosY * 12.0
    );
  } else if (window.globalCameraViewMode === 'lookup') {
    setPlayerMeshVisibilityForCamera(false);
    const lowDist = 6.2;
    const camX = playerPos.x + sinY * lowDist;
    const camZ = playerPos.z + cosY * lowDist;
    const groundH = Math.max(playerPos.y, getBaseGroundHeight(camX, camZ));
    const camY = Math.max(playerPos.y + 1.45, groundH + 1.15);

    camera.position.set(camX, camY, camZ);
    camera.lookAt(
      playerPos.x - sinY * 8.0,
      playerPos.y + 5.2,
      playerPos.z - cosY * 8.0
    );
  } else {
    setPlayerMeshVisibilityForCamera(false);
    // [에피소드 4 스테이지 1 반응형 카메라] PC·태블릿·모바일(세로/가로) 모든 화면비에서 캐릭터·물고기·예수님이 한눈에 담기도록 자동 보정!
    const isMiracleBoatStage = (
      currentEpisode === 'miracle' &&
      typeof miracleSubMode !== 'undefined' &&
      miracleSubMode === 'main1_galilee'
    );
    if (isMiracleBoatStage) {
      const vw = Math.max(1, window.innerWidth || 1280);
      const vh = Math.max(1, window.innerHeight || 720);
      const aspect = Math.max(0.45, Math.min(2.2, vw / vh));
      const st = (typeof miracleActiveMiniState !== 'undefined') ? miracleActiveMiniState : null;
      const phase = st ? st.phase : 'cast_net';

      if (phase === 'cast_net') {
        // 1단계 그물 던지기: 배 위 플레이어(우측 전경)와 헤엄치는 물고기 떼(좌측 중경)를 동시에 담는 반응형 대각선 뷰!
        const distScale = aspect < 1.0
          ? Math.min(1.58, 0.88 + 0.44 / aspect)
          : (aspect < 1.3 ? 1.10 : 0.98);
        const fx = (st && st.targetFishPos) ? st.targetFishPos.x : -16.5;
        const fz = (st && st.targetFishPos) ? st.targetFishPos.z : -1.5;
        const midX = playerPos.x * 0.40 + fx * 0.60;
        const midZ = playerPos.z * 0.55 + fz * 0.45;
        camera.position.set(
          playerPos.x + 11.4 * distScale,
          playerPos.y + 11.2 * distScale,
          playerPos.z + 14.2 * distScale
        );
        camera.lookAt(midX, 0.25, midZ);
      } else {
        // 2~3단계 폭풍우·예수님 깨우기·잔잔케 하심: 배 위 플레이어와 고물에 누워/일어나신 예수님이 어떤 화면비에서도 모두 보이게 배치!
        const stormScale = aspect < 1.0
          ? Math.min(1.55, 0.92 + 0.42 / aspect)
          : (aspect < 1.3 ? 1.12 : 1.0);
        camera.position.set(
          playerPos.x + 5.2 * stormScale,
          playerPos.y + 7.4 + 3.6 * stormScale,
          playerPos.z - 12.8 * stormScale
        );
        camera.lookAt(0, 0.85, 4.4);
      }
      return;
    }

    const camDist = (currentStage === 1 || currentStage === 4) ? 11.5 : (currentEpisode === 'exodus' ? 11.2 : 8.4);
    const camH = (currentStage === 1 || currentStage === 4) ? 8.5 : (currentEpisode === 'exodus' ? 8.0 : 7.0);
    camera.position.set(
      playerPos.x + sinY * camDist,
      playerPos.y + camH,
      playerPos.z + cosY * camDist
    );
    camera.lookAt(playerPos.x, playerPos.y + 1.5, playerPos.z);
  }
}

function snapCameraToPlayer() {
  if (!playerGroup || !camera) return;
  ensureGlobalCameraViewToggleUI();
  playerGroup.position.copy(playerPos);
  applyCoreCameraByMode();
}

function startVoxelGame(mode, targetStage = 1, fromMapSelect = false) {
  isMenuBgmActive = false;
  currentMode = mode; currentStage = targetStage; isPlaying = true;
  lastSpokenStageKey = '';
  delete document.getElementById('cert-code').dataset.generated;
  closeEndingWorldMapChoiceModal();

  if (!playerProgressData[currentEpisode]) {
    playerProgressData[currentEpisode] = { maxClearedStage: 0, completed: false, certIssued: false, attempts: 0 };
  }
  const epProg = playerProgressData[currentEpisode];
  enteredFromMapStageSelect = Boolean(fromMapSelect || targetStage === 4);

  if (
    !enteredFromMapStageSelect &&
    targetStage === 1 &&
    (epProg.attempts || 0) === 0 &&
    !epProg.certIssued &&
    !epProg.completed
  ) {
    currentRunCanIssueCert = true;
  } else {
    currentRunCanIssueCert = false;
  }

  epProg.attempts = (epProg.attempts || 0) + 1;
  saveLocalPlayerProgress(explorerName);

  rebuildPlayerAppearance();
  ensureGlobalCameraViewToggleUI();

  document.getElementById('hud-top').classList.remove('hidden');
  document.getElementById('hud-player-tag').textContent = `${explorerDisplayName || explorerName}`;
  document.getElementById('hud-mode-btn').textContent = `${MODE_META[mode].badge} · 🗺️맵`;
  document.getElementById('joystick-zone').style.display = 'block';
  document.getElementById('cam-bottom-bar').style.display = 'flex';
  document.getElementById('action-zone').style.display = 'flex';

  const epPlugin = getActiveEpisodePlugin();
  const timerBox = document.getElementById('hud-timer-box');
  if (mode === 'timeattack' && targetStage <= 3) {
    if (epPlugin && typeof epPlugin.getInitialTime === 'function') {
      timeRemaining = epPlugin.getInitialTime(targetStage);
    } else {
      timeRemaining = (currentEpisode === 'exodus')
        ? (targetStage === 2 ? 22.0 : 10.0)
        : (targetStage === 1 ? 7.5 : 10.0);
    }
    timeAttackFirstRechargeUsed = false;
    const pauseTimerAtStart = epPlugin && typeof epPlugin.pauseTimerAtStart === 'function'
      ? epPlugin.pauseTimerAtStart(targetStage)
      : (currentEpisode === 'exodus' && targetStage === 2);
    isTimeAttackActive = !pauseTimerAtStart;
    timerBox.classList.remove('hidden'); timerBox.classList.add('flex');
  } else {
    isTimeAttackActive = false;
    timerBox.classList.add('hidden'); timerBox.classList.remove('flex');
  }

  guideArrowGroup.visible = (mode !== 'senior');
  document.getElementById('hud-compass-hint').classList.toggle('hidden', mode === 'senior');

  // ✅ [수정된 안전 폴백 분기] 에피소드 3(david)과 에피소드 4(miracle)가 에피소드 1로 빠지지 않도록 보완
  if (targetStage === 4) {
    if (currentEpisode === 'david' && typeof buildDavidEndingWorld === 'function' && (!epPlugin || !epPlugin.buildEndingWorld)) {
      buildDavidEndingWorld();
    } else if (currentEpisode === 'miracle' && typeof buildMiracleEndingWorld === 'function' && (!epPlugin || !epPlugin.buildEndingWorld)) {
      buildMiracleEndingWorld();
    } else {
      buildEndingWorld();
    }
  } else if (epPlugin && typeof epPlugin.buildStage === 'function') {
    epPlugin.buildStage(targetStage);
  } else if (currentEpisode === 'david') {
    if (targetStage === 1 && typeof buildDavidStage1World === 'function') buildDavidStage1World();
    else if (targetStage === 2 && typeof buildDavidStage2World === 'function') buildDavidStage2World();
    else if (targetStage === 3 && typeof buildDavidStage3World === 'function') buildDavidStage3World();
    else showToast('⚠️ 에피소드 3 파일을 불러오지 못했습니다.');
  } else if (currentEpisode === 'miracle') {
    if (targetStage === 1 && typeof buildMiracleOpenWorld === 'function') buildMiracleOpenWorld(false);
    else if (targetStage === 2 && typeof buildMiracleMainStage2Loaves === 'function') buildMiracleMainStage2Loaves();
    else if (targetStage === 3 && typeof buildMiracleMainStage3Cross === 'function') buildMiracleMainStage3Cross();
    else showToast('⚠️ 에피소드 4 파일을 불러오지 못했습니다.');
  } else if (currentEpisode === 'exodus') {
    if (targetStage === 1 && typeof buildExodusStage1World === 'function') buildExodusStage1World();
    else if (targetStage === 2 && typeof buildExodusStage2World === 'function') buildExodusStage2World();
    else if (targetStage === 3 && typeof buildExodusStage3World === 'function') buildExodusStage3World();
  } else {
    if (targetStage === 1 && typeof buildNoahStage1World === 'function') buildNoahStage1World();
    else if (targetStage === 2 && typeof buildNoahArkInteriorMaze === 'function') buildNoahArkInteriorMaze(2);
    else if (targetStage === 3 && typeof buildNoahArkInteriorMaze === 'function') buildNoahArkInteriorMaze(3);
  }

  startStageBgm(targetStage);
  getAndIncrementPlayCount(explorerName);
  sendGameLogToSheet(targetStage === 1 ? '▶ 게임시작' : `🚀 스테이지${targetStage} 바로진입`, targetStage, '-');
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
  lastSpokenStageKey = '';

  currentRunCanIssueCert = false;
  if (playerProgressData[currentEpisode]) {
    playerProgressData[currentEpisode].attempts = (playerProgressData[currentEpisode].attempts || 1) + 1;
    saveLocalPlayerProgress(explorerName);
  }

  const epPlugin = getActiveEpisodePlugin();
  if (epPlugin && typeof epPlugin.getInitialTime === 'function') {
    timeRemaining = epPlugin.getInitialTime(currentStage);
  } else if (currentEpisode === 'exodus') {
    timeRemaining = (currentStage === 1) ? 10.0 : (currentStage === 2 ? 22.0 : 10.0);
  } else {
    timeRemaining = (currentStage === 1) ? 7.5 : 10.0;
  }
  timeAttackFirstRechargeUsed = false;

  const pauseAtStart = epPlugin && typeof epPlugin.pauseTimerAtStart === 'function'
    ? epPlugin.pauseTimerAtStart(currentStage)
    : (currentEpisode === 'exodus' && currentStage === 2);
  isTimeAttackActive = (currentMode === 'timeattack' && !pauseAtStart);
  isPlaying = !pauseAtStart;

  if (currentEpisode === 'miracle') {
    const sub = (typeof miracleSubMode !== 'undefined') ? miracleSubMode : 'openworld';
    if ((sub === 'main1_galilee' || sub === 'main1_boat') && typeof buildMiracleMainStage1Galilee === 'function') buildMiracleMainStage1Galilee();
    else if (sub === 'main2_loaves' && typeof buildMiracleMainStage2Loaves === 'function') buildMiracleMainStage2Loaves();
    else if (sub === 'main3_cross' && typeof buildMiracleMainStage3Cross === 'function') buildMiracleMainStage3Cross();
    else if (sub === 'main4_tomb' && typeof buildMiracleMainStage4Tomb === 'function') buildMiracleMainStage4Tomb();
    else if (sub === 'ascension' && typeof buildMiracleEndingWorld === 'function') buildMiracleEndingWorld();
    else if (typeof buildMiracleOpenWorld === 'function') buildMiracleOpenWorld(false);
  } else if (epPlugin && typeof epPlugin.buildStage === 'function') {
    epPlugin.buildStage(currentStage);
  } else if (currentEpisode === 'david') {
    if (currentStage === 1 && typeof buildDavidStage1World === 'function') buildDavidStage1World();
    else if (currentStage === 2 && typeof buildDavidStage2World === 'function') buildDavidStage2World();
    else if (currentStage === 3 && typeof buildDavidStage3World === 'function') buildDavidStage3World();
    else if (currentStage === 4 && typeof buildDavidEndingWorld === 'function') buildDavidEndingWorld();
  } else if (currentEpisode === 'exodus') {
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

  getAndIncrementPlayCount(explorerName);
  sendGameLogToSheet('🔄 재도전', currentStage, '-');
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

  const epPlugin = getActiveEpisodePlugin();
  if (epPlugin && typeof epPlugin.updateHUD === 'function') {
    epPlugin.updateHUD(currentStage, badge, countIcon, countText, missionText);
  } else if (currentEpisode === 'noah') {
    countIcon.textContent = '🐾';
    if (currentStage === 1) {
      badge.textContent = '방주 · 스테이지 1'; countText.textContent = `${rescuedPairs}/7쌍`;
      missionText.textContent = currentMode === 'timeattack' ? '동물 7쌍을 찾아 방주 위로 태우세요! (+5초 연장)' : '초원의 동물 7쌍을 모두 찾아 방주 위로 태우세요!';
    } else if (currentStage === 2) {
      badge.textContent = '방주 · 스테이지 2'; countText.textContent = '비둘기 탐색';
      missionText.textContent = '방주 미로를 지나 창문 앞에서 날고 있는 비둘기를 만나세요!';
    } else if (currentStage === 3) {
      badge.textContent = '방주 · 스테이지 3'; countText.textContent = `${rescuedPairs}/7쌍`;
      missionText.textContent = '방주 안 동물 7쌍을 모아 함께 북쪽 출구 문으로 나가세요!';
    } else {
      badge.textContent = '무지개 세상'; countText.textContent = '완주 🌈';
      missionText.textContent = canShowCertificateForCurrentRun()
        ? '🌈 새 세상을 걷고 제단이나 인증서 보기를 누르세요!'
        : '🌈 뒤편 방주 내부 미로와 바위 동산을 탐험하거나 제단으로 가보세요!';
    }
  } else {
    if (currentStage === 1) {
      countIcon.textContent = '🌉';
      const builtCnt = buildZones.filter(b => b.built).length;
      badge.textContent = '홍해 · 스테이지 1'; countText.textContent = `다리 ${builtCnt}/${buildZones.length}`;
      missionText.textContent = '🪵 통나무 수집과 나무 도끼질로 다리를 짓고 홍해 바다 앞으로 가세요!';
    } else if (currentStage === 2) {
      countIcon.textContent = '❤️';
      const remainLives = Math.max(0, 3 - soldierHitCount);
      badge.textContent = '홍해 · 스피드런 2'; countText.textContent = `기회 ${remainLives}/3`;
      missionText.textContent = currentMode === 'timeattack'
        ? '병사가 추격해요! 진주를 먹으면 1초 가속! 산호초는 점프하고 물구덩이는 피하세요!'
        : '애굽 병사가 추격해요! 산호초와 바위는 점프하고 물구덩이는 피해 불기둥으로 달리세요!';
    } else if (currentStage === 3) {
      countIcon.textContent = '⛰️';
      badge.textContent = '시내산 · 스테이지 3';
      const maxH = (sinaiCutscene && sinaiCutscene.summitY) ? sinaiCutscene.summitY : 19.2;
      const pct = Math.min(100, Math.max(0, Math.round((playerPos.y / maxH) * 100)));
      countText.textContent = `등반 ${pct}%`;
      missionText.textContent = '⛰️ 옆으로 점프해 계단식 바위를 따라 한 칸씩 위층으로 올라가 십계명으로 가세요!';
    } else {
      countIcon.textContent = '🌴';
      badge.textContent = '구원의 언덕'; countText.textContent = '완주 🌊';
      missionText.textContent = '🌴 구름기둥과 불기둥 아래 기뻐 뛰는 백성들과 함께 십계명으로 가보세요!';
    }
  }

  const isHudVisible = !document.getElementById('hud-top').classList.contains('hidden');
  const stageKey = `${currentEpisode}_${currentStage}`;
  if (isHudVisible && lastSpokenStageKey !== stageKey) {
    lastSpokenStageKey = stageKey;
    speakText(missionText.textContent);
  }
}

const raycaster = new THREE.Raycaster();
const _wallFadeMatCache = {};
let _wallFadeFrameTick = 0;
function _getFadedVersionOfMat(origMat) {
  if (!origMat || !origMat.color) return null;
  const sideVal = origMat.side !== undefined ? origMat.side : THREE.FrontSide;
  const key = origMat.color.getHexString() + '_' + (origMat.flatShading ? '1' : '0') + '_' + (origMat.vertexColors ? '1' : '0') + '_' + sideVal;
  if (!_wallFadeMatCache[key]) {
    const m = new THREE.MeshLambertMaterial({
      color: origMat.color.getHex(),
      flatShading: Boolean(origMat.flatShading),
      vertexColors: Boolean(origMat.vertexColors),
      side: sideVal,
      transparent: true,
      opacity: 0.24,
      depthWrite: false
    });
    m.userData = { _cached: true };
    _wallFadeMatCache[key] = m;
  }
  return _wallFadeMatCache[key];
}

function updateWallTransparency() {
  const isMob = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (window.innerWidth <= 900);
  if (isMob && (++_wallFadeFrameTick % 2 !== 0)) return;

  fadedMaterials.forEach(item => {
    if (item && item.mesh && item.origMat) {
      item.mesh.material = item.origMat;
    } else if (item && item.opacity !== undefined) {
      item.transparent = false;
      item.opacity = 1.0;
    }
  });
  fadedMaterials = [];
  if (wallMeshes.length === 0 || window.globalCameraViewMode === 'fps') return;

  // 플레이어 주변 24m 이내 벽면만 레이캐스트 대상에 포함해 모바일 CPU 부하 대폭 절감
  const nearWalls = [];
  const px = playerPos.x, pz = playerPos.z;
  const _tmpWPos = new THREE.Vector3();
  for (let i = 0; i < wallMeshes.length; i++) {
    const wm = wallMeshes[i];
    if (!wm || !wm.visible || !wm.parent) continue;
    wm.getWorldPosition(_tmpWPos);
    const dx = _tmpWPos.x - px, dz = _tmpWPos.z - pz;
    if (dx * dx + dz * dz < 625) nearWalls.push(wm);
  }
  if (nearWalls.length === 0) return;

  const fadeMesh = (mesh) => {
    if (!mesh || !mesh.material) return;
    if (fadedMaterials.some(x => x.mesh === mesh)) return;
    const origMat = mesh.material;
    const fadedMat = _getFadedVersionOfMat(origMat);
    if (fadedMat) {
      mesh.material = fadedMat;
      fadedMaterials.push({ mesh, origMat });
    } else {
      origMat.transparent = true;
      origMat.opacity = 0.24;
      fadedMaterials.push(origMat);
    }
  };

  const targetPoints = doveCutscene.active
    ? [new THREE.Vector3(doveCutscene.doveX, 2.8, doveCutscene.goalZ)]
    : [
        new THREE.Vector3(playerPos.x, playerPos.y + 1.5, playerPos.z),
        new THREE.Vector3(playerPos.x, playerPos.y + 0.65, playerPos.z)
      ];

  targetPoints.forEach(focusPos => {
    const dir = focusPos.clone().sub(camera.position);
    const dist = dir.length();
    if (dist < 0.05) return;
    raycaster.set(camera.position, dir.normalize());
    raycaster.far = dist;
    raycaster.intersectObjects(nearWalls, false).forEach(hit => {
      if (hit.distance < dist - 0.12 && hit.object) {
        fadeMesh(hit.object);
      }
    });
  });
}

function openStageClearModal(st) {
  isPlaying = false; isTimeAttackActive = false; playSfx('clear');
  recordPlayerStageClear(currentEpisode, st);

  document.getElementById('hud-mission-box').classList.add('hidden');
  const epData = EPISODE_SCRIPTURE[currentEpisode] || EPISODE_SCRIPTURE.noah;
  const info = epData[st];
  document.getElementById('modal-title').textContent = info.title;
  document.getElementById('modal-desc').textContent = info.desc;
  document.getElementById('modal-scripture-text').textContent = info.verse;
  if (currentEpisode === 'noah') {
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
    const shuffledOpts = shuffleQuizOptions(info.quiz.opts, info.quiz.ans);
    shuffledOpts.forEach((optItem, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mc-btn w-full py-2 px-3 rounded-lg bg-amber-100 hover:bg-amber-200 text-slate-900 font-bold text-xs text-left';
      btn.textContent = `${idx + 1}. ${optItem.text}`;
      btn.onclick = () => {
        fbEl.classList.remove('hidden');
        if (optItem.isCorrect) {
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

  sendGameLogToSheet(`🎉 스테이지${st} 클리어`, st, '-');
}

function proceedNextStage() {
  const modal = document.getElementById('stage-modal');
  modal.classList.add('hidden'); modal.classList.remove('flex');

  const epPlugin = getActiveEpisodePlugin();
  if (epPlugin && typeof epPlugin.proceedNextStage === 'function') {
    epPlugin.proceedNextStage(currentStage);
    return;
  }

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
    if (currentEpisode === 'exodus') {
      stopStageBgm();
      const bf = document.getElementById('black-fade');
      document.getElementById('black-fade-icon').textContent = '⛰️';
      document.getElementById('black-fade-title').textContent = '"이스라엘 자손이 시내 광야에 이르러 산 앞에 장막을 치니라"';
      document.getElementById('black-fade-sub').textContent = '홍해를 건넌 백성들이 하나님의 산, 시내산 아래에 도착합니다';
      bf.style.opacity = '1';
      setTimeout(() => {
        currentStage = 3; isPlaying = true;
        if (currentMode === 'timeattack') {
          timeRemaining = 10.0;
          timeAttackFirstRechargeUsed = false;
          isTimeAttackActive = true;
        }
        buildExodusStage3World();
        startStageBgm(3);
        setTimeout(() => { bf.style.opacity = '0'; }, 250);
      }, 3600);
      return;
    }
    currentStage = 3; isPlaying = true;
    if (currentMode === 'timeattack') {
      timeRemaining = 10.0;
      timeAttackFirstRechargeUsed = false;
      isTimeAttackActive = true;
    }
    buildNoahArkInteriorMaze(3);
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
  const epPlugin = getActiveEpisodePlugin();
  if (epPlugin && typeof epPlugin.triggerContextAction === 'function') {
    epPlugin.triggerContextAction(currentStage, targetObject);
    return;
  }

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
    showToast('🌊 홍해 바닷물이 역동적인 파도와 함께 다시 합쳐지며 애굽 군대를 덮습니다!');
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
  const alreadyGenerated = document.getElementById('cert-code').dataset.generated;

  // [전체 에피소드 공통 요청사항] 2회차 이상의 시도나 맵 재선택으로 엔딩에 들어온 경우에는
  // 인증서 대신 [월드맵으로 이동하기 / 엔딩 세상 계속 둘러보기] 선택창을 출력!
  if (!alreadyGenerated && !canShowCertificateForCurrentRun()) {
    const certBtn = document.getElementById('cert-open-btn');
    if (certBtn) certBtn.classList.add('hidden');
    showEndingWorldMapChoiceModal();
    return;
  }

  recordPlayerStageClear(currentEpisode, 4);

  playSfx('clear');
  document.getElementById('cert-name-display').textContent = explorerName || '믿음의용사';
  document.getElementById('cert-dept').textContent = MODE_META[currentMode].dept;

  const epPlugin = getActiveEpisodePlugin();
  const isExodus = (currentEpisode === 'exodus');
  const certMeta = (epPlugin && epPlugin.certMeta) ? epPlugin.certMeta : null;

  document.getElementById('ending-ep-badge').textContent = certMeta
    ? certMeta.badge
    : (isExodus ? '🌊 에피소드 2 : 출애굽과 시내산 십계명 완주!' : '🌈 에피소드 1 : 노아의 방주 완주!');
  document.getElementById('ending-main-title').textContent = certMeta
    ? certMeta.title
    : (isExodus ? '홍해를 건너 시내산 언약의 백성으로!' : '무지개 언약의 새 세상!');
  document.getElementById('ending-main-verse').textContent = certMeta
    ? certMeta.verse
    : (isExodus ? '"너희가 내 말을 잘 듣고 내 언약을 지키면 너희는 모든 민족 중에서 내 소유가 되겠고" (출애굽기 19:5)' : '"내가 내 무지개를 구름 속에 두었나니 이것이 나와 세상 사이의 언약의 증거니라" (창세기 9:13)');
  document.getElementById('cert-mission-display').textContent = certMeta
    ? certMeta.mission
    : (isExodus ? '홍해 도하 및 시내산 십계명 수직 등반 완주' : '노아의 방주 3단계 탐험 완주');

  if (!alreadyGenerated) {
    const prefix = certMeta ? certMeta.prefix : (isExodus ? 'EXO-' : 'ARK-');
    const newCode = prefix + Math.floor(100 + Math.random() * 900);
    document.getElementById('cert-code').textContent = newCode;
    document.getElementById('cert-code').dataset.generated = '1';
    sendGameLogToSheet('🏆 완주성공', 4, newCode);
  }
  const em = document.getElementById('ending-modal');
  const owCertBtn = document.getElementById('ending-return-openworld-btn');
  if (owCertBtn) {
    owCertBtn.classList.toggle('hidden', currentEpisode !== 'miracle');
  }
  em.classList.remove('hidden'); em.classList.add('flex');
}

window.openCertificateModal = showEndingCertificate;

function closeEndingToLookAround() {
  const em = document.getElementById('ending-modal');
  em.classList.add('hidden'); em.classList.remove('flex');
  showToast('🌈 엔딩 세상을 자유롭게 걸어보세요!');
}

function closeEndingToReturnMiracleOpenWorld() {
  const em = document.getElementById('ending-modal');
  if (em) { em.classList.add('hidden'); em.classList.remove('flex'); }
  if (typeof returnToMiracleOpenWorld === 'function') {
    returnToMiracleOpenWorld();
  }
}

let joyX = 0, joyY = 0, keys = {};
function setupControls() {
  const zone = document.getElementById('joystick-zone'), knob = document.getElementById('joystick-knob');
  let joyPointerId = null, cx = 0, cy = 0, camPointerId = null, lastCamX = 0;

  ensureGlobalCameraViewToggleUI();

  const actionZone = document.getElementById('action-zone');
  if (actionZone) {
    actionZone.addEventListener('pointerdown', e => {
      e.stopPropagation();
    });
  }

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
    if (e.pointerId === joyPointerId) return;
    camPointerId = e.pointerId; lastCamX = e.clientX;
  });

  window.addEventListener('pointermove', e => {
    if (e.pointerId === joyPointerId) {
      handleJoyMove(e.clientX, e.clientY);
    } else if (e.pointerId === camPointerId && isPlaying && !doveCutscene.active && !pillarCutscene.active && !seaPartingCutscene.active && !sinaiCutscene.active) {
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
  if (typeof window.isPlayerMovementLocked === 'function' && window.isPlayerMovementLocked()) return;
  if (isGrounded || playerPos.y <= getSupportHeight(playerPos.x, playerPos.z, playerPos.y) + 0.18) {
    playerVelY = (currentEpisode === 'exodus' && currentStage === 3) ? 9.6 : 11.5;
    isGrounded = false; playSfx('jump');
  }
}

// [핵심 물리 업데이트] p.passUnderY 속성이 지정된 상부 갑판·지붕 플랫폼은 플레이어가 그 아래 층(curY < p.passUnderY)에 있을 때
// 벽으로 가로막지 않고 그대로 아래로 통과하여 방주 안 미로를 자유롭게 걸어다닐 수 있게 처리!
function canMoveTo(nx, nz, curY, isPlayer = false) {
  if (currentMapRectBounds !== null) {
    if (nx < currentMapRectBounds.minX || nx > currentMapRectBounds.maxX || nz < currentMapRectBounds.minZ || nz > currentMapRectBounds.maxZ) return false;
  } else if (currentMapBounds !== null) {
    if (Math.abs(nx) > currentMapBounds || Math.abs(nz) > currentMapBounds) return false;
  }
  // 에피소드 4 오픈월드: 자연스럽게 확장된 곡선 서쪽 해안선 경계 연동 (선착장 구역은 부두 끝까지 허용)
  if (
    isPlayer &&
    currentEpisode === 'miracle' &&
    typeof miracleSubMode !== 'undefined' &&
    miracleSubMode === 'openworld' &&
    typeof window.getMiracleWestShoreLineX === 'function'
  ) {
    const onGalileePier = (nz >= -70.2 && nz <= -65.8 && nx >= -96.2);
    if (!onGalileePier && nx < window.getMiracleWestShoreLineX(nz) + 1.5) return false;
  }
  const isSinaiStage = (isPlayer && currentEpisode === 'exodus' && currentStage === 3);
  const stepAllowance = isSinaiStage
    ? ((!isGrounded || playerVelY > 0) ? 0.35 : 0.22)
    : ((isPlayer && (!isGrounded || playerVelY > 0)) ? 1.25 : 0.65);
  const wallPad = isSinaiStage ? 0.26 : 0.05;

  for (const p of platforms) {
    if (p.topY < -100) continue;
    if (p.passUnderY !== undefined && curY < p.passUnderY) continue;
    if (nx > p.minX - wallPad && nx < p.maxX + wallPad && nz > p.minZ - wallPad && nz < p.maxZ + wallPad) {
      if (p.wallOnly) {
        // 옥상 난간은 걸어서는 통과할 수 없지만, 난간 상단(p.topY)보다 높게 점프하면 바깥으로 뛰어넘어 나갈 수 있음
        if (curY < p.topY) return false;
        continue;
      }
      if (curY + stepAllowance < p.topY) return false;
      if (isSinaiStage && p.topY - lastGroundedY > 1.35) return false;
      if (isPlayer && p.minClimbY !== undefined && lastGroundedY < p.minClimbY) return false;
    }
  }
  for (const c of colliders) {
    if (nx > c.minX && nx < c.maxX && nz > c.minZ && nz < c.maxZ) return false;
  }
  return true;
}

function getSupportHeight(x, z, curY) {
  let h = getBaseGroundHeight(x, z);
  const isSinaiStage = (currentEpisode === 'exodus' && currentStage === 3);
  const supportPad = isSinaiStage ? 0.34 : 0.25;
  const baseTol = isSinaiStage ? 0.65 : 0.75;
  // 점프 상승 중(playerVelY > 1.5)에는 머리 위·옆 난간/2층 모서리에 걸려 공중에 멈추지 않도록 허용치 축소
  const topTolerance = (playerVelY > 1.5) ? 0.06 : baseTol;

  for (const p of platforms) {
    if (p.topY < -100) continue;
    if (p.wallOnly) continue; // 옥상 테두리(난간) 차단벽은 착지 발판으로 사용하지 않음 (공중 정지 원천 해결!)
    if (p.passUnderY !== undefined && curY < p.passUnderY) continue;
    if (x >= p.minX - supportPad && x <= p.maxX + supportPad && z >= p.minZ - supportPad && z <= p.maxZ + supportPad && curY + topTolerance >= p.topY && p.topY > h) {
      if (isSinaiStage && p.topY - lastGroundedY > 1.35) continue;
      if (p.minClimbY !== undefined && lastGroundedY < p.minClimbY) continue;
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

// 건물·벽·계단 사이에 끼여 갇히는 현상을 원천 방지하는 자동 최소거리 탈출 보정
function resolvePlayerAntiStuckPushOut() {
  if (!playerPos) return;
  const curY = playerPos.y;
  const stepAllow = (!isGrounded || playerVelY > 0) ? 1.25 : 0.65;
  const isSinaiStage = (currentEpisode === 'exodus' && currentStage === 3);
  if (isSinaiStage) return;

  for (let pass = 0; pass < 3; pass++) {
    let pushed = false;
    for (let i = 0; i < colliders.length; i++) {
      const c = colliders[i];
      if (playerPos.x > c.minX && playerPos.x < c.maxX && playerPos.z > c.minZ && playerPos.z < c.maxZ) {
        const dL = playerPos.x - c.minX;
        const dR = c.maxX - playerPos.x;
        const dB = playerPos.z - c.minZ;
        const dF = c.maxZ - playerPos.z;
        const m = Math.min(dL, dR, dB, dF);
        const eps = 0.06;
        if (m === dL) playerPos.x = c.minX - eps;
        else if (m === dR) playerPos.x = c.maxX + eps;
        else if (m === dB) playerPos.z = c.minZ - eps;
        else playerPos.z = c.maxZ + eps;
        pushed = true;
      }
    }
    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i];
      if (p.topY < -100) continue;
      if (p.passUnderY !== undefined && curY < p.passUnderY) continue;
      if (curY + stepAllow >= p.topY) continue;
      if (playerPos.x > p.minX && playerPos.x < p.maxX && playerPos.z > p.minZ && playerPos.z < p.maxZ) {
        const dL = playerPos.x - p.minX;
        const dR = p.maxX - playerPos.x;
        const dB = playerPos.z - p.minZ;
        const dF = p.maxZ - playerPos.z;
        const m = Math.min(dL, dR, dB, dF);
        const eps = 0.08;
        if (m === dL) playerPos.x = p.minX - eps;
        else if (m === dR) playerPos.x = p.maxX + eps;
        else if (m === dB) playerPos.z = p.minZ - eps;
        else playerPos.z = p.maxZ + eps;
        pushed = true;
      }
    }
    if (!pushed) break;
  }
  if (currentMapRectBounds !== null) {
    playerPos.x = Math.max(currentMapRectBounds.minX, Math.min(currentMapRectBounds.maxX, playerPos.x));
    playerPos.z = Math.max(currentMapRectBounds.minZ, Math.min(currentMapRectBounds.maxZ, playerPos.z));
  }
}

let webglContextLostFlag = false;

// 처음 index.html 오픈 시 해금 여부와 무관하게 에피소드 1~4의 모든 대표 맵 중 하나를 무작위로 3D 배경 화면에 띄움!
window.openingPreviewMeta = { id: 'noah_s1', cx: 0, cy: 3, cz: -10, rad: 28, camY: 14 };
function buildRandomOpeningPreviewWorld(forcedId = null) {
  const candidates = [];
  if (typeof buildNoahStage1World === 'function') {
    candidates.push({ id: 'noah_s1', ep: 'noah', stage: 1, cx: 0, cy: 3, cz: -10, rad: 28, camY: 14, build: () => buildNoahStage1World() });
  }
  if (typeof buildExodusStage1World === 'function') {
    candidates.push({ id: 'exodus_s1', ep: 'exodus', stage: 1, cx: 0, cy: 5, cz: 10, rad: 34, camY: 18, build: () => buildExodusStage1World() });
  }
  if (typeof buildExodusStage3World === 'function') {
    candidates.push({ id: 'exodus_s3', ep: 'exodus', stage: 3, cx: 0, cy: 10, cz: -8, rad: 30, camY: 20, build: () => buildExodusStage3World() });
  }
  if (typeof buildDavidStage1World === 'function') {
    candidates.push({ id: 'david_s1', ep: 'david', stage: 1, cx: 0, cy: 4, cz: -8, rad: 30, camY: 15, build: () => buildDavidStage1World() });
  }
  if (typeof buildMiracleOpenWorld === 'function') {
    candidates.push({ id: 'miracle_ow', ep: 'miracle', stage: 1, cx: 0, cy: 5, cz: -18, rad: 44, camY: 22, build: () => buildMiracleOpenWorld(false) });
  }
  if (candidates.length === 0) return null;

  const picked = (forcedId && candidates.find(c => c.id === forcedId))
    || candidates[Math.floor(Math.random() * candidates.length)];

  const prevEp = currentEpisode;
  const prevStage = currentStage;
  const prevPlaying = isPlaying;
  const origToastFn = showToast;
  const origSpeakFn = speakText;
  const origOggFn = window.playMiracleOpenWorldOgg;
  try {
    window.__isBuildingOpeningPreview = true;
    showToast = function () {};
    speakText = function () {};
    if (typeof window.stopMiracleOpenWorldOgg === 'function') window.stopMiracleOpenWorldOgg(true);
    window.playMiracleOpenWorldOgg = function () {};

    currentEpisode = picked.ep;
    currentStage = picked.stage;
    isPlaying = false;
    picked.build();
  } catch (e) {
    if (typeof buildNoahStage1World === 'function') buildNoahStage1World();
  } finally {
    window.__isBuildingOpeningPreview = false;
    showToast = origToastFn;
    speakText = origSpeakFn;
    window.playMiracleOpenWorldOgg = origOggFn;
    if (typeof hideAllMiracleCustomUI === 'function') hideAllMiracleCustomUI();
    const dUi = document.getElementById('david-custom-ui');
    if (dUi) dUi.classList.add('hidden');
    const lblCont = document.getElementById('labels-container');
    if (lblCont) {
      Array.from(lblCont.children).forEach(el => { el.style.opacity = '0'; });
    }
    const toastBox = document.getElementById('toast-box');
    if (toastBox) toastBox.style.opacity = '0';
    currentEpisode = prevEp;
    currentStage = prevStage;
    isPlaying = prevPlaying;
  }

  window.openingPreviewMeta = {
    id: picked.id,
    ep: picked.ep,
    cx: picked.cx,
    cy: picked.cy,
    cz: picked.cz,
    rad: picked.rad,
    camY: picked.camY
  };
  return window.openingPreviewMeta;
}
window.buildRandomOpeningPreviewWorld = buildRandomOpeningPreviewWorld;

function initEngine(skipInitialPreview = false) {
  const container = document.getElementById('canvas-container');
  const isMobDevice = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (Math.min(window.innerWidth, window.innerHeight) <= 768);
  scene = new THREE.Scene(); scene.background = new THREE.Color(0x7dd3fc);
  camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 900);
  renderer = new THREE.WebGLRenderer({
    antialias: true, // 모바일 안티앨리어싱 테스트 가동
    powerPreference: 'high-performance',
    alpha: false
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobDevice ? 1.25 : 2));
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  // 모바일 GPU 메모리 부족 등으로 WebGL 컨텍스트 손실 시 검은/하얀 화면 고착 방지 및 자동 복구
  renderer.domElement.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    webglContextLostFlag = true;
    const wf = document.getElementById('white-fade');
    if (wf) wf.style.opacity = '0';
    if (typeof showToast === 'function') showToast('🔄 모바일 그래픽 메모리를 정리하고 화면을 복구하는 중이에요...');
  }, false);

  renderer.domElement.addEventListener('webglcontextrestored', () => {
    webglContextLostFlag = false;
    const wf = document.getElementById('white-fade');
    if (wf) wf.style.opacity = '0';
    const bf = document.getElementById('black-fade');
    if (bf) bf.style.opacity = '0';
    const mobNow = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (Math.min(window.innerWidth, window.innerHeight) <= 768);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobNow ? 1.15 : 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (currentEpisode === 'miracle' && typeof buildMiracleOpenWorld === 'function') {
      if (typeof miracleSubMode !== 'undefined' && miracleSubMode === 'main1_galilee' && typeof buildMiracleMainStage1Galilee === 'function') buildMiracleMainStage1Galilee();
      else if (typeof miracleSubMode !== 'undefined' && miracleSubMode === 'main2_loaves' && typeof buildMiracleMainStage2Loaves === 'function') buildMiracleMainStage2Loaves();
      else if (typeof miracleSubMode !== 'undefined' && miracleSubMode === 'main3_cross' && typeof buildMiracleMainStage3Cross === 'function') buildMiracleMainStage3Cross();
      else if (typeof miracleSubMode !== 'undefined' && miracleSubMode === 'main4_tomb' && typeof buildMiracleMainStage4Tomb === 'function') buildMiracleMainStage4Tomb();
      else if (typeof miracleSubMode !== 'undefined' && miracleSubMode === 'ascension' && typeof buildMiracleEndingWorld === 'function') buildMiracleEndingWorld();
      else buildMiracleOpenWorld(true);
    } else if (isPlaying) {
      const epPlug = getActiveEpisodePlugin();
      if (currentStage === 4) {
        buildEndingWorld();
      } else if (epPlug && typeof epPlug.buildStage === 'function') {
        epPlug.buildStage(currentStage);
      } else if (currentEpisode === 'david') {
        if (currentStage === 1 && typeof buildDavidStage1World === 'function') buildDavidStage1World();
        else if (currentStage === 2 && typeof buildDavidStage2World === 'function') buildDavidStage2World();
        else if (currentStage === 3 && typeof buildDavidStage3World === 'function') buildDavidStage3World();
      } else if (currentEpisode === 'exodus') {
        if (currentStage === 1 && typeof buildExodusStage1World === 'function') buildExodusStage1World();
        else if (currentStage === 2 && typeof buildExodusStage2World === 'function') buildExodusStage2World();
        else if (currentStage === 3 && typeof buildExodusStage3World === 'function') buildExodusStage3World();
      } else if (currentEpisode === 'noah') {
        if (currentStage === 1 && typeof buildNoahStage1World === 'function') buildNoahStage1World();
        else if (currentStage === 2 && typeof buildNoahArkInteriorMaze === 'function') buildNoahArkInteriorMaze(2);
        else if (currentStage === 3 && typeof buildNoahArkInteriorMaze === 'function') buildNoahArkInteriorMaze(3);
      }
    }
    if (typeof showToast === 'function') showToast('✅ 화면이 정상적으로 복구되었습니다!');
  }, false);

  scene.add(new THREE.AmbientLight(0xffffff, 0.62));
  const dirLight = new THREE.DirectionalLight(0xfffbeb, 0.72);
  dirLight.position.set(25, 45, 25); dirLight.castShadow = true;
  scene.add(dirLight);

  rebuildPlayerAppearance();
  if (!skipInitialPreview) {
    buildRandomOpeningPreviewWorld();
  }
  setupControls();

  const handleViewportResize = () => {
    const mobNow = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (Math.min(window.innerWidth, window.innerHeight) <= 768);
    camera.aspect = window.innerWidth / Math.max(1, window.innerHeight);
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobNow ? 1.25 : 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener('resize', handleViewportResize);
  window.addEventListener('orientationchange', () => setTimeout(handleViewportResize, 120));

  let lastTime = performance.now();
  function animate(now) {
    requestAnimationFrame(animate);
    if (webglContextLostFlag) return;
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    updateBlazingPillars(dt, now);

    if (!isPlaying && !stage2CountdownActive && document.getElementById('hud-top').classList.contains('hidden')) {
      const ang = now * 0.00028;
      const pm = window.openingPreviewMeta || { cx: 0, cy: 3, cz: -10, rad: 28, camY: 14 };
      camera.position.set(pm.cx + Math.sin(ang) * pm.rad, pm.camY, pm.cz + Math.cos(ang) * pm.rad);
      camera.lookAt(pm.cx, pm.cy, pm.cz);
      renderer.render(scene, camera);
      return;
    }

    const epPlugin = getActiveEpisodePlugin();

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
        const baseY = (p.baseY !== undefined) ? p.baseY : 0;
        p.mesh.position.y = baseY + jumpVal * 0.85;
        if (p.mesh.userData && p.mesh.userData.lArm && p.mesh.userData.rArm) {
          p.mesh.userData.lArm.rotation.x = -2.4 + Math.sin(now * 0.015 + p.phase) * 0.4;
          p.mesh.userData.rArm.rotation.x = -2.4 - Math.sin(now * 0.015 + p.phase) * 0.4;
        }
      });
    }

    if (epPlugin && typeof epPlugin.updateCutsceneFrame === 'function' && epPlugin.updateCutsceneFrame(dt, now)) {
      renderer.render(scene, camera); return;
    }
    if (currentEpisode === 'noah' && typeof updateNoahCutsceneFrame === 'function' && updateNoahCutsceneFrame(dt, now)) {
      renderer.render(scene, camera); return;
    }
    if (currentEpisode === 'exodus' && typeof updateExodusCutsceneFrame === 'function' && updateExodusCutsceneFrame(dt, now)) {
      renderer.render(scene, camera); return;
    }

    if (isPlaying) {
      cameraYaw = lerpAngle(cameraYaw, cameraTargetYaw, dt * 12);
      if (keys['Space'] && isGrounded) playerJump();
      playerVelY -= 24 * dt;
      playerPos.y += playerVelY * dt;
      const floorY = getSupportHeight(playerPos.x, playerPos.z, playerPos.y);
      if (playerPos.y <= floorY) {
        playerPos.y = floorY;
        playerVelY = 0;
        isGrounded = true;
        lastGroundedY = floorY;
      }

      let rawX = joyX, rawZ = joyY;
      if (keys['ArrowLeft'] || keys['KeyA']) rawX = -1;
      if (keys['ArrowRight'] || keys['KeyD']) rawX = 1;
      if (keys['ArrowUp'] || keys['KeyW']) rawZ = -1;
      if (keys['ArrowDown'] || keys['KeyS']) rawZ = 1;
      // 잠금 전 원본 방향 입력(조이스틱·키보드)을 보관 → 스테이지 3 넘어짐 후 방향기로 일어나기에 활용
      window.lastRawMoveInput = { x: rawX, z: rawZ, mag: Math.min(1, Math.hypot(rawX, rawZ)) };

      if (typeof window.isPlayerMovementLocked === 'function' && window.isPlayerMovementLocked()) {
        rawX = 0; rawZ = 0;
      }

      if (playerSpeedBoostTimer > 0) playerSpeedBoostTimer -= dt;
      if (playerChopAnimTimer > 0) playerChopAnimTimer -= dt;

      let baseSpeed = (currentEpisode === 'exodus' && currentStage === 2) ? 9.8 : 8.6;
      if (epPlugin && typeof epPlugin.getPlayerMoveSpeed === 'function') {
        baseSpeed = epPlugin.getPlayerMoveSpeed(currentStage, baseSpeed);
      } else if (currentEpisode === 'exodus' && currentStage === 2) {
        if (playerSpeedBoostTimer > 0) {
          baseSpeed = 14.8;
        } else if (isGrounded) {
          for (const pud of stage2Puddles) {
            if (Math.abs(playerPos.x - pud.x) < pud.rx && Math.abs(playerPos.z - pud.z) < pud.rz) { baseSpeed = 4.6; break; }
          }
        }
      } else if (playerSpeedBoostTimer > 0) {
        baseSpeed = 14.0;
      }

      const inputMag = Math.min(1, Math.hypot(rawX, rawZ));
      if (inputMag > 0.08) {
        const len = Math.hypot(rawX, rawZ), nxInput = rawX / len, nzInput = rawZ / len;
        const cosY = Math.cos(cameraYaw), sinY = Math.sin(cameraYaw);
        const worldDirX = nxInput * cosY + nzInput * sinY, worldDirZ = -nxInput * sinY + nzInput * cosY;
        currentMoveSpeed = baseSpeed * inputMag;
        const vx = worldDirX * currentMoveSpeed * dt, vz = worldDirZ * currentMoveSpeed * dt;
        const canX = canMoveTo(playerPos.x + vx, playerPos.z, playerPos.y, true);
        if (canX) playerPos.x += vx;
        const canZ = canMoveTo(playerPos.x, playerPos.z + vz, playerPos.y, true);
        if (canZ) playerPos.z += vz;
        // 건물 모서리나 좁은 틈에 끼였을 때 탈출 보정
        if (!canX && !canZ) {
          resolvePlayerAntiStuckPushOut();
        }
        const postMoveFloorY = getSupportHeight(playerPos.x, playerPos.z, playerPos.y);
        if (isGrounded && postMoveFloorY >= playerPos.y - 0.15) {
          playerPos.y = postMoveFloorY;
          lastGroundedY = postMoveFloorY;
        }

        playerFacing = lerpAngle(playerFacing, Math.atan2(worldDirX, worldDirZ), dt * 14);
        walkCycle += dt * (currentMoveSpeed * 1.45);
        playerLimbs.lLeg.rotation.x = Math.sin(walkCycle) * 0.65; playerLimbs.rLeg.rotation.x = -Math.sin(walkCycle) * 0.65;
        playerLimbs.lArm.rotation.x = -Math.sin(walkCycle) * 0.58; playerLimbs.rArm.rotation.x = Math.sin(walkCycle) * 0.58;
      } else {
        currentMoveSpeed = 0;
        playerLimbs.lLeg.rotation.x = 0; playerLimbs.rLeg.rotation.x = 0;
        playerLimbs.lArm.rotation.x = 0; playerLimbs.rArm.rotation.x = 0;
      }
      resolvePlayerAntiStuckPushOut();

      if (playerLimbs.axeTool) {
        if (playerChopAnimTimer > 0) {
          playerLimbs.axeTool.visible = true;
          playerLimbs.lArm.rotation.x = -1.7 + Math.sin(now * 0.05) * 1.1;
        } else {
          playerLimbs.axeTool.visible = false;
        }
      }

      playerGroup.position.copy(playerPos);
      playerGroup.rotation.y = (window.globalCameraViewMode === 'fps') ? (cameraYaw + Math.PI) : playerFacing;

      if (epPlugin && typeof epPlugin.updateStageFrame === 'function') {
        epPlugin.updateStageFrame(dt, now, currentStage);
      } else if (currentEpisode === 'noah' && typeof updateNoahStageFrame === 'function') {
        updateNoahStageFrame(dt, now);
      } else if (currentEpisode === 'exodus' && typeof updateExodusStageFrame === 'function') {
        updateExodusStageFrame(dt, now);
      }

      playerGroup.position.copy(playerPos);
      applyCoreCameraByMode();
      updateWallTransparency();

      // [전체 에피소드 공통 요청사항] 1차 시도일 때는 인증서를 띄우고, 2회차/재선택 엔딩일 때는 제단 접근 시 월드맵 이동 선택창 오픈!
      if (currentStage === 4 && targetObject && currentEpisode !== 'david') {
        const td = Math.hypot(playerPos.x - targetObject.pos.x, playerPos.z - targetObject.pos.z);
        updateWorldLabelPos(targetObject.label, targetObject.pos, td < 26);
        if (guideArrowGroup.visible) {
          guideArrowGroup.rotation.y = Math.atan2(targetObject.pos.x - playerPos.x, targetObject.pos.z - playerPos.z) - playerGroup.rotation.y;
        }
        if (td < 4.2 && !certAutoShown) {
          certAutoShown = true;
          if (canShowCertificateForCurrentRun()) {
            showEndingCertificate();
          } else {
            showEndingWorldMapChoiceModal();
          }
        } else if (td > 6.2 && !canShowCertificateForCurrentRun()) {
          // 2회차 엔딩에서 [계속 둘러보기] 후 제단에서 멀어졌다가 다시 제단으로 오면 다시 선택창이 열리도록 리셋
          certAutoShown = false;
        }
      }
    }

    renderer.render(scene, camera);
  }
  requestAnimationFrame(animate);
}

function parseAdminDirectJumpParams() {
  const validEps = new Set(['noah', 'exodus', 'david', 'miracle']);
  const validModes = new Set(['kinder', 'junior', 'senior', 'timeattack']);

  const tryExtract = (searchStr) => {
    if (!searchStr) return null;
    const cleaned = searchStr.replace(/^[?#]+/, '');
    if (!cleaned) return null;
    const p = new URLSearchParams(cleaned);
    const ep = (p.get('ep') || '').trim().toLowerCase();
    const mode = (p.get('mode') || '').trim().toLowerCase();
    const stage = parseInt(p.get('stage') || '0', 10);
    const name = (p.get('name') || '관리자').trim() || '관리자';
    if (validEps.has(ep) && validModes.has(mode) && stage >= 1 && stage <= 4) {
      return { ep, mode, stage, name };
    }
    return null;
  };

  let jump = tryExtract(window.location.search) || tryExtract(window.location.hash);

  // 모바일 리다이렉트·bfcache·인앱 브라우저에서 쿼리가 누락된 경우 sessionStorage 백업에서 복원
  try {
    const raw = sessionStorage.getItem('bible_admin_direct_jump');
    if (raw) {
      const saved = JSON.parse(raw);
      sessionStorage.removeItem('bible_admin_direct_jump');
      if (!jump && saved && (Date.now() - (saved.ts || 0)) < 35000) {
        const ep = String(saved.ep || '').trim().toLowerCase();
        const mode = String(saved.mode || '').trim().toLowerCase();
        const stage = parseInt(saved.stage || '0', 10);
        const name = String(saved.name || '관리자').trim() || '관리자';
        if (validEps.has(ep) && validModes.has(mode) && stage >= 1 && stage <= 4) {
          jump = { ep, mode, stage, name };
        }
      }
    }
  } catch (e) {}

  return jump;
}

function applyAdminDirectJump(jump) {
  if (!jump) return;
  explorerName = jump.name;
  explorerDisplayName = jump.name;
  loadLocalPlayerProgress(explorerName);
  currentEpisode = jump.ep;
  currentMode = jump.mode;
  openScreen(null);
  startVoxelGame(jump.mode, jump.stage, jump.stage === 4);
}

window.addEventListener('DOMContentLoaded', () => {
  const jump = parseAdminDirectJumpParams();
  const isDirectJump = Boolean(jump);

  if (isDirectJump) {
    // initEngine 이전에 currentEpisode / currentMode 를 먼저 설정하여 초기 아바타/월드가 에피소드 1로 빠지지 않게 보장
    currentEpisode = jump.ep;
    currentMode = jump.mode;
  }

  initEngine(isDirectJump);

  if (isDirectJump) {
    applyAdminDirectJump(jump);
  }
});

// 모바일 Safari/Chrome 뒤로가기·앞으로가기 bfcache 복원 시 관리자 바로가기 파라미터 재반영
window.addEventListener('pageshow', (event) => {
  if (!event.persisted) return;
  const jump = parseAdminDirectJumpParams();
  if (jump) {
    applyAdminDirectJump(jump);
  }
});