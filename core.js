// =========================================================================
// [core.js - 파트 1/2] 출발! 탐험대! - 공통 3D 엔진, 인디아나 존스 풍 1분 모험 테마 BGM, 구글 시트 개인 기록 해금 시스템
// - 에피소드 1 엔딩: 방주 내부 진입(passUnderY 물리 판정) 및 미로 탐험·다단 자연 바위 등반 연동
// - 전체 에피소드 공통: 2회차/재선택 엔딩에서 제단·왕좌 접근 시 [월드맵으로 이동하기] 선택창 출력
// =========================================================================

window.__GAME_BUILD_VERSIONS__ = window.__GAME_BUILD_VERSIONS__ || {};
window.__GAME_BUILD_VERSIONS__.core = '3.12.3';

function installEp4MattePhongSpecGuard() {
  if (typeof THREE !== 'undefined' && THREE.ShaderChunk && THREE.ShaderChunk.lights_phong_pars_fragment) {
    if (!THREE.ShaderChunk.lights_phong_pars_fragment.includes('__EP4_MATTE_SPEC_GUARD__')) {
      THREE.ShaderChunk.lights_phong_pars_fragment = THREE.ShaderChunk.lights_phong_pars_fragment.replace(
        'reflectedLight.directSpecular +=',
        '/* __EP4_MATTE_SPEC_GUARD__ */ float _ep4SpecOn = step(0.0005, material.specularShininess + material.specularColor.r + material.specularColor.g + material.specularColor.b);\n\treflectedLight.directSpecular += _ep4SpecOn *'
      );
    }
  }
}
installEp4MattePhongSpecGuard();

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
let bgmPausedByBackground = false;
let isMenuBgmActive = false;
let currentEpisode = 'noah'; // 'noah' | 'exodus' | 'david' | 'miracle'
const EPISODE_SCRIPTURE = {};
const EPISODE_REGISTRY = {};
let lastSpokenStageKey = '';

// 현재 진행 중인 플레이에서 엔딩 인증서를 출력할 수 있는지 여부
let currentRunCanIssueCert = false;
let certShownInCurrentRun = false;
let enteredFromMapStageSelect = false;
let enteredEndingDirectlyFromMap = false;

// =========================================================================
// [관리자 마스터 잠금 스위치]
// - 현재 요청에 따라 에피소드 2(exodus), 3(david), 4(miracle)는 true(잠금) 상태입니다.
// - 추후 오픈할 에피소드를 false로 변경하면, 구글 시트 개인 기록에 따라
//   (에피소드1 클리어 -> 에피소드2 해금 -> 에피소드3 해금 -> 에피소드4 해금) 자동으로 열립니다!
// =========================================================================
const EPISODE_MASTER_ADMIN_LOCK = {
  noah: false,    // 에피소드 1: 오픈
  exodus: false,  // 에피소드 2: 전체 잠금 해제
  david: false,   // 에피소드 3: 전체 잠금 해제
  miracle: false  // 에피소드 4: 전체 잠금 해제
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
  const isDocHidden = (typeof document !== 'undefined' && Boolean(document.hidden));
  if (audioCtx && audioCtx.state === 'suspended' && !isDocHidden) {
    try { audioCtx.resume(); } catch (e) {}
  }
  return audioCtx;
}

function playSfx(type) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const now = ctx.currentTime;

  // [모험의 증표 인증 카드 등장 전용] 화려하게 빛나며 등장하는 "빠밤~!" 팡파레 효과음
  if (type === 'card_reveal') {
    const playTone = (freq, startOffset, dur, wave, vol) => {
      const osc = ctx.createOscillator(), g = ctx.createGain();
      const st = now + startOffset;
      osc.type = wave;
      osc.frequency.setValueAtTime(freq, st);
      g.gain.setValueAtTime(0.001, st);
      g.gain.linearRampToValueAtTime(vol, st + 0.018);
      g.gain.exponentialRampToValueAtTime(0.001, st + dur);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(st); osc.stop(st + dur + 0.02);
    };
    // "빠-" (힘찬 1타 팡파레 화음)
    playTone(392.0, 0.00, 0.14, 'triangle', 0.18);
    playTone(523.25, 0.00, 0.14, 'sawtooth', 0.10);
    playTone(659.25, 0.00, 0.14, 'triangle', 0.14);
    // "-밤~!" (웅장하게 퍼지는 장조 해결 화음)
    playTone(523.25, 0.14, 0.62, 'triangle', 0.20);
    playTone(659.25, 0.14, 0.62, 'triangle', 0.16);
    playTone(783.99, 0.14, 0.62, 'sawtooth', 0.11);
    playTone(1046.5, 0.15, 0.68, 'triangle', 0.22);
    // 반짝이는 빛무리 차임 아르페지오
    playTone(1318.5, 0.28, 0.22, 'sine', 0.12);
    playTone(1568.0, 0.36, 0.26, 'sine', 0.12);
    playTone(2093.0, 0.45, 0.36, 'sine', 0.14);
    return;
  }

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
  if (!bgmEnabled || bgmPausedByBackground || (typeof document !== 'undefined' && document.hidden)) return;
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
  const ep4VideoPlaying = Boolean(window.__ep4OpeningVideoActive || window.__ep4EndingVideoActive);
  // 영상 재생 중(__ep4OpeningVideoActive / __ep4EndingVideoActive)일 때도 오픈월드 BGM을 확실히 정지
  if (typeof window.stopMiracleOpenWorldOgg === 'function' && (!isPlaying || isMenuBgmActive || !bgmEnabled || ep4VideoPlaying)) {
    window.stopMiracleOpenWorldOgg(isMenuBgmActive || !isPlaying || ep4VideoPlaying);
  }
}

let _coreBgmVisibilityBound = false;
function bindCoreBgmVisibilityHandlers() {
  if (_coreBgmVisibilityBound) return;
  _coreBgmVisibilityBound = true;

  const pauseCoreBgmForBackground = () => {
    const shouldResumeLater = Boolean(bgmEnabled && (isPlaying || isMenuBgmActive));
    if (bgmTimeout) {
      clearTimeout(bgmTimeout);
      bgmTimeout = null;
    }
    if (shouldResumeLater) {
      bgmPausedByBackground = true;
    }
    if (audioCtx && audioCtx.state === 'running' && typeof audioCtx.suspend === 'function') {
      try { audioCtx.suspend().catch(() => {}); } catch (e) {}
    }
    if (typeof window.stopAllEp4VoiceAudio === 'function') {
      window.stopAllEp4VoiceAudio();
    } else {
      ['__activeNpcAudio', '__activeVerseAudio', '__activeEndingAudio'].forEach(k => {
        if (window[k]) {
          try { window[k].pause(); } catch (e) {}
          window[k] = null;
        }
      });
      if (typeof window.speechSynthesis !== 'undefined' && window.speechSynthesis) {
        try { window.speechSynthesis.cancel(); } catch (e) {}
      }
    }
  };

  const resumeCoreBgmFromBackground = () => {
    if (typeof document !== 'undefined' && document.hidden) return;
    if (!bgmPausedByBackground) return;
    bgmPausedByBackground = false;
    if (!bgmEnabled) return;
    if (audioCtx && audioCtx.state === 'suspended' && typeof audioCtx.resume === 'function') {
      try { audioCtx.resume().catch(() => {}); } catch (e) {}
    }
    if ((isPlaying || isMenuBgmActive) && !bgmTimeout && !window.__ep4OpeningVideoActive && !window.__ep4EndingVideoActive) {
      scheduleNextBgmBeat();
    }
  };

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) pauseCoreBgmForBackground();
      else resumeCoreBgmFromBackground();
    });
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', pauseCoreBgmForBackground);
    window.addEventListener('blur', () => {
      if (typeof document !== 'undefined' && document.hidden) pauseCoreBgmForBackground();
    });
    window.addEventListener('pageshow', resumeCoreBgmFromBackground);
    window.addEventListener('focus', resumeCoreBgmFromBackground);
  }
}
bindCoreBgmVisibilityHandlers();

// 탐험수첩·퀴즈·인증서·모험의 증표 등 오버레이 모달이 열렸을 때 조이스틱·점프·카메라 버튼을 확실히 숨겨 최상위 레이어 보장
function syncOverlayModalBodyClass() {
  if (typeof document === 'undefined' || !document.body) return false;
  const fullModalIds = [
    'miracle-notebook-modal',
    'stage-modal',
    'retry-modal',
    'ending-modal',
    'adventure-badges-modal',
    'ending-map-choice-modal',
    'game-exit-confirm-modal',
    'game-closed-screen'
  ];
  let anyOpen = fullModalIds.some(id => {
    const el = document.getElementById(id);
    return Boolean(el && !el.classList.contains('hidden'));
  });
  if (!anyOpen) {
    const dlg = document.getElementById('miracle-dialog-overlay');
    if (dlg && !dlg.classList.contains('hidden') && dlg.classList.contains('is-quiz-overlay')) {
      anyOpen = true;
    }
  }
  document.body.classList.toggle('overlay-modal-open', anyOpen);
  return anyOpen;
}
window.syncOverlayModalBodyClass = syncOverlayModalBodyClass;

function syncHudMenuInfo() {
  const playerTag = document.getElementById('hud-player-tag');
  if (playerTag) {
    playerTag.textContent = explorerDisplayName || explorerName || '대원';
  }
  const levelBadge = document.getElementById('hud-level-badge');
  if (levelBadge && typeof MODE_META !== 'undefined' && MODE_META[currentMode]) {
    levelBadge.textContent = MODE_META[currentMode].badge;
  }
  const badgesCountEl = document.getElementById('hud-badges-count');
  if (badgesCountEl && typeof getCollectedAdventureCertCount === 'function') {
    const epCnt = getCollectedAdventureCertCount();
    const fpCnt = typeof getCollectedFootstepsCertCount === 'function' ? getCollectedFootstepsCertCount() : 0;
    const fpTotal = typeof FOOTSTEPS_CARD_ORDER !== 'undefined' ? FOOTSTEPS_CARD_ORDER.length : 5;
    badgesCountEl.textContent = `${epCnt + fpCnt} / ${EPISODE_ORDER.length + fpTotal}`;
  }
  const bgmBtn = document.getElementById('bgm-btn');
  if (bgmBtn) {
    bgmBtn.textContent = bgmEnabled ? '🎵 음악 끄기' : '🔇 음악 켜기';
  }
  const fsBtn = document.getElementById('fullscreen-btn');
  if (fsBtn) {
    const isFs = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
    fsBtn.textContent = isFs ? '🗗 창모드' : '⛶ 전체화면';
  }
}
window.syncHudMenuInfo = syncHudMenuInfo;

let isHudMenuOpen = false;
function setHudMenuOpen(open) {
  isHudMenuOpen = Boolean(open);
  const dd = document.getElementById('hud-menu-dropdown');
  const btn = document.getElementById('hud-menu-btn');
  const chev = document.getElementById('hud-menu-chevron');
  if (btn) btn.setAttribute('aria-expanded', isHudMenuOpen ? 'true' : 'false');
  if (chev) chev.style.transform = isHudMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)';
  if (!dd) return;
  if (dd._hideTimer) { clearTimeout(dd._hideTimer); dd._hideTimer = null; }
  if (isHudMenuOpen) {
    if (typeof window.setMiracleTimeExpanded === 'function') {
      window.setMiracleTimeExpanded(false);
    }
    syncHudMenuInfo();
    dd.classList.remove('hidden');
    void dd.offsetWidth;
    dd.classList.remove('menu-closed');
    dd.classList.add('menu-open');
  } else {
    dd.classList.remove('menu-open');
    dd.classList.add('menu-closed');
    dd._hideTimer = setTimeout(() => {
      if (!isHudMenuOpen) dd.classList.add('hidden');
    }, 180);
  }
}
window.setHudMenuOpen = setHudMenuOpen;

function toggleHudMenu() {
  if (typeof playSfx === 'function') playSfx('switch');
  setHudMenuOpen(!isHudMenuOpen);
}
window.toggleHudMenu = toggleHudMenu;

if (typeof document !== 'undefined') {
  document.addEventListener('pointerdown', (e) => {
    if (!isHudMenuOpen) return;
    const wrap = document.getElementById('hud-menu-wrap');
    if (wrap && !wrap.contains(e.target)) {
      setHudMenuOpen(false);
    }
  });
  document.addEventListener('fullscreenchange', syncHudMenuInfo);
  document.addEventListener('webkitfullscreenchange', syncHudMenuInfo);
}

let _exitModalWasPlaying = false;
function openGameExitConfirmModal() {
  setHudMenuOpen(false);
  if (typeof playSfx === 'function') playSfx('switch');
  _exitModalWasPlaying = Boolean(isPlaying);
  isPlaying = false;
  joyX = 0; joyY = 0; currentMoveSpeed = 0;
  if (typeof keys !== 'undefined' && keys) Object.keys(keys).forEach(k => { keys[k] = false; });
  const modal = document.getElementById('game-exit-confirm-modal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }
  syncOverlayModalBodyClass();
}
window.openGameExitConfirmModal = openGameExitConfirmModal;

function closeGameExitConfirmModal() {
  const modal = document.getElementById('game-exit-confirm-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
  if (_exitModalWasPlaying) {
    isPlaying = true;
    _exitModalWasPlaying = false;
  }
  syncOverlayModalBodyClass();
}
window.closeGameExitConfirmModal = closeGameExitConfirmModal;

function confirmExitBibleAdventureGame() {
  const modal = document.getElementById('game-exit-confirm-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
  _exitModalWasPlaying = false;
  isPlaying = false;
  isTimeAttackActive = false;
  joyX = 0; joyY = 0; currentMoveSpeed = 0;
  if (typeof keys !== 'undefined' && keys) Object.keys(keys).forEach(k => { keys[k] = false; });

  try {
    if (typeof saveMiracleNotebookProgress === 'function') saveMiracleNotebookProgress({ skipSheetSync: true });
    if (typeof saveLocalPlayerProgress === 'function' && typeof explorerName !== 'undefined' && explorerName) {
      saveLocalPlayerProgress(explorerName);
    }
    if (typeof schedulePlayerProfileSheetSync === 'function' && typeof explorerName !== 'undefined' && explorerName) {
      schedulePlayerProfileSheetSync('exit', true);
    }
  } catch (e) {}

  try {
    if (typeof stopStageBgm === 'function') stopStageBgm();
    if (typeof window.stopMiracleOpenWorldOgg === 'function') window.stopMiracleOpenWorldOgg(true);
    if (typeof window.stopAllEp4VoiceAudio === 'function') {
      window.stopAllEp4VoiceAudio();
    } else {
      ['__activeNpcAudio', '__activeVerseAudio', '__activeEndingAudio'].forEach(k => {
        if (window[k]) {
          try { window[k].pause(); } catch (e) {}
          window[k] = null;
        }
      });
      if (typeof window.speechSynthesis !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
    }
  } catch (e) {}

  try {
    if (window.MiracleMultiplayer && window.MiracleMultiplayer.active && typeof window.MiracleMultiplayer.leaveRoom === 'function') {
      window.MiracleMultiplayer.leaveRoom();
    }
  } catch (e) {}

  try {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    } else if (document.webkitFullscreenElement && document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  } catch (e) {}

  try {
    if (window.Android && typeof window.Android.closeApp === 'function') {
      window.Android.closeApp();
    } else if (window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === 'function') {
      window.ReactNativeWebView.postMessage('EXIT_APP');
    }
    window.close();
    window.open('', '_self');
    window.close();
  } catch (e) {}

  setTimeout(() => {
    if (!window.closed) {
      const closedEl = document.getElementById('game-closed-screen');
      if (closedEl) {
        closedEl.classList.remove('hidden');
        closedEl.classList.add('flex');
        syncOverlayModalBodyClass();
      }
    }
  }, 260);
}
window.confirmExitBibleAdventureGame = confirmExitBibleAdventureGame;

function toggleBgm() {
  bgmEnabled = !bgmEnabled;
  syncHudMenuInfo();
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

// =========================================================================
// [전체 에피소드 공통] 정중앙 타이핑 말풍선 안내 & 우측 상단 구석 발광 [미션 안내] 버튼
// (에피소드 4의 팝업·타이핑·버튼 흡수 애니메이션을 에피소드 1~4 전체에 동일하게 적용)
// =========================================================================
const MiracleGuideUI = {
  isBubbleOpen: false,
  isTyping: false,
  isSucking: false,
  openedAt: 0,
  onCloseCallbacks: [],
  activeFieldInfo: null,
  activeStageInfo: null,
  lastAutoKey: '',
  fullText: '',
  typedIdx: 0,
  typeTimerId: null,
  autoCloseTimerId: null,
  suckTimerId: null,
  suppressedDuringIntro: false
};
window.MiracleGuideUI = MiracleGuideUI;

function _clearMiracleGuideTimers() {
  if (MiracleGuideUI.typeTimerId) { clearInterval(MiracleGuideUI.typeTimerId); MiracleGuideUI.typeTimerId = null; }
  if (MiracleGuideUI.autoCloseTimerId) { clearTimeout(MiracleGuideUI.autoCloseTimerId); MiracleGuideUI.autoCloseTimerId = null; }
  if (MiracleGuideUI.suckTimerId) { clearTimeout(MiracleGuideUI.suckTimerId); MiracleGuideUI.suckTimerId = null; }
}

function _flushMiracleGuideCloseCallbacks(clearOnly = false) {
  const cbs = Array.isArray(MiracleGuideUI.onCloseCallbacks) ? MiracleGuideUI.onCloseCallbacks.splice(0) : [];
  if (clearOnly || cbs.length === 0) return;
  cbs.forEach(fn => {
    if (typeof fn === 'function') {
      try { fn(); } catch (e) {}
    }
  });
}

window.isMissionGuideBubbleBlockingAction = function () {
  if (window.isMiracleMultiplayerMode) return false;
  if (!MiracleGuideUI.isBubbleOpen) return false;
  const bubble = document.getElementById('miracle-guide-bubble');
  if (!bubble || bubble.classList.contains('hidden')) {
    _clearMiracleGuideTimers();
    MiracleGuideUI.isBubbleOpen = false;
    MiracleGuideUI.isTyping = false;
    MiracleGuideUI.isSucking = false;
    _flushMiracleGuideCloseCallbacks(false);
    return false;
  }
  if (MiracleGuideUI.isSucking && !MiracleGuideUI.suckTimerId) {
    _clearMiracleGuideTimers();
    bubble.classList.add('hidden');
    bubble.style.pointerEvents = '';
    bubble.style.transition = 'none';
    bubble.style.transform = 'translate(-50%, -50%) scale(1)';
    bubble.style.opacity = '1';
    MiracleGuideUI.isBubbleOpen = false;
    MiracleGuideUI.isTyping = false;
    MiracleGuideUI.isSucking = false;
    _flushMiracleGuideCloseCallbacks(false);
    return false;
  }
  if (
    !MiracleGuideUI.isTyping &&
    !MiracleGuideUI.isSucking &&
    !MiracleGuideUI.autoCloseTimerId &&
    MiracleGuideUI.openedAt > 0 &&
    (performance.now() - MiracleGuideUI.openedAt) > 12000
  ) {
    window.dismissMiracleGuideBubbleToButton();
  }
  return true;
};

window.runAfterMissionGuideBubble = function (cb) {
  if (typeof cb !== 'function') return;
  if (!window.isMissionGuideBubbleBlockingAction()) {
    cb();
    return;
  }
  MiracleGuideUI.onCloseCallbacks.push(cb);
};

function positionMiracleGuideButton() {
  // 우측 상단 구석(#hud-top-right 내부)에 정식 배치되었으므로 멀티플레이 HUD 간격만 동기화
  if (typeof window.positionMultiplayerRightHud === 'function') {
    window.positionMultiplayerRightHud();
  }
}
window.positionMiracleGuideButton = positionMiracleGuideButton;

function setInGameHudControlsVisible(visible) {
  const hudTop = document.getElementById('hud-top');
  const joy = document.getElementById('joystick-zone');
  const camBar = document.getElementById('cam-bottom-bar');
  const actZone = document.getElementById('action-zone');
  if (!visible) {
    setHudMenuOpen(false);
    if (typeof window.setMiracleTimeExpanded === 'function') window.setMiracleTimeExpanded(false);
    hideMissionGuideBubbleImmediately();
    if (hudTop) hudTop.classList.add('hidden');
    if (joy) joy.style.display = 'none';
    if (camBar) camBar.style.display = 'none';
    if (actZone) actZone.style.display = 'none';
    ['miracle-hud-left', 'miracle-time-anchor', 'miracle-mini-nav', 'miracle-guide-btn', 'miracle-return-openworld-btn', 'david-st1-panel', 'david-st3-quest-tracker'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    });
    joyX = 0; joyY = 0; keys = {}; currentMoveSpeed = 0;
  } else {
    if (hudTop) hudTop.classList.remove('hidden');
    if (joy) joy.style.display = 'block';
    if (camBar) camBar.style.display = 'flex';
    if (actZone) actZone.style.display = 'flex';
    syncHudMenuInfo();
    updateMiracleGuideButtonVisibility();
    if (currentEpisode === 'miracle' && typeof updateMiracleNotebookHudBadge === 'function') {
      updateMiracleNotebookHudBadge();
    } else {
      const retBtn = document.getElementById('miracle-return-openworld-btn');
      if (retBtn) retBtn.classList.add('hidden');
    }
    if (typeof window.syncMiracleTimeHUD === 'function') window.syncMiracleTimeHUD();
    if (currentEpisode === 'david') {
      if (currentStage === 1 && typeof updateDavidStage1UI === 'function') updateDavidStage1UI();
      if (currentStage === 3 && typeof updateDavidStage3QuestTrackerUI === 'function') updateDavidStage3QuestTrackerUI();
    }
  }
}
window.setInGameHudControlsVisible = setInGameHudControlsVisible;

function isAnyGlobalIntroOrCutsceneBlockingGuide() {
  if (window.__isBuildingOpeningPreview) return true;
  if (window.isUiTutorialActive) return true;
  if (typeof pausedGameSession !== 'undefined' && pausedGameSession && pausedGameSession.active) return true;
  const hudTopEl = document.getElementById('hud-top');
  if (!hudTopEl || hudTopEl.classList.contains('hidden')) return true;
  if (currentEpisode === 'exodus' && typeof stage2CountdownActive !== 'undefined' && stage2CountdownActive) return true;
  if (currentEpisode === 'noah' && typeof doveCutscene !== 'undefined' && doveCutscene && doveCutscene.active) return true;
  if (currentEpisode === 'exodus' && typeof pillarCutscene !== 'undefined' && pillarCutscene && pillarCutscene.active) return true;
  if (currentEpisode === 'exodus' && typeof seaPartingCutscene !== 'undefined' && seaPartingCutscene && seaPartingCutscene.active) return true;
  if (currentEpisode === 'exodus' && typeof sinaiCutscene !== 'undefined' && sinaiCutscene && sinaiCutscene.active) return true;
  if (currentEpisode === 'david' && typeof davidOpeningState !== 'undefined' && davidOpeningState && davidOpeningState.active) return true;
  if (currentEpisode === 'david' && typeof davidStage2Dialogue !== 'undefined' && davidStage2Dialogue && davidStage2Dialogue.active) return true;
  if (currentEpisode === 'david' && typeof davidAnointCutscene !== 'undefined' && davidAnointCutscene && davidAnointCutscene.active) return true;
  if (currentEpisode === 'david' && typeof davidStage2Cutscene !== 'undefined' && davidStage2Cutscene && davidStage2Cutscene.active) return true;
  if (currentEpisode === 'david' && typeof davidStage3Cutscene !== 'undefined' && davidStage3Cutscene && davidStage3Cutscene.active) return true;
  if (currentEpisode === 'miracle' && typeof miracleStageCutscene !== 'undefined' && miracleStageCutscene && miracleStageCutscene.active) return true;
  if (currentEpisode === 'miracle' && typeof window.__ep4OpeningVideoActive !== 'undefined' && window.__ep4OpeningVideoActive) return true;
  if (currentEpisode === 'miracle' && typeof window.__ep4EndingVideoActive !== 'undefined' && window.__ep4EndingVideoActive) return true;
  if (currentEpisode === 'miracle' && typeof miracleAscensionState !== 'undefined' && miracleAscensionState && miracleAscensionState.active) return true;
  if (currentEpisode === 'miracle' && window.miracleOpenWorldIntroFlyover && window.miracleOpenWorldIntroFlyover.active) return true;
  if (currentEpisode === 'miracle' && typeof miracleDialogState !== 'undefined' && miracleDialogState && miracleDialogState.active) return true;
  if (
    currentEpisode === 'miracle' &&
    typeof miracleSubMode !== 'undefined' && miracleSubMode === 'main1_galilee' &&
    typeof miracleActiveMiniState !== 'undefined' && miracleActiveMiniState &&
    (
      miracleActiveMiniState.phase === 'intro_jesus' ||
      miracleActiveMiniState.phase === 'intro_peter' ||
      miracleActiveMiniState.phase === 'fish_gathering' ||
      miracleActiveMiniState.phase === 'call_partners' ||
      miracleActiveMiniState.phase === 'boats_full_celebration' ||
      miracleActiveMiniState.phase === 'beach_calling' ||
      miracleActiveMiniState.phase === 'beach_follow_narration' ||
      miracleActiveMiniState.phase === 'white_out'
    )
  ) return true;
  if (
    currentEpisode === 'miracle' &&
    typeof miracleSubMode !== 'undefined' && miracleSubMode === 'main2_loaves' &&
    typeof miracleActiveMiniState !== 'undefined' && miracleActiveMiniState &&
    miracleActiveMiniState.introFlyover && miracleActiveMiniState.introFlyover.active
  ) return true;
  if (MiracleGuideUI.suppressedDuringIntro) return true;
  const bf = document.getElementById('black-fade');
  if (bf && parseFloat(bf.style.opacity || '0') > 0.25) return true;
  return false;
}

function updateMiracleGuideButtonVisibility() {
  const btn = document.getElementById('miracle-guide-btn');
  if (!btn) return;
  const hudTop = document.getElementById('hud-top');
  const isHudVisible = Boolean(hudTop && !hudTop.classList.contains('hidden'));
  const showBtn = isHudVisible && !window.isMiracleMultiplayerMode;
  if (!showBtn) {
    btn.classList.add('hidden');
    positionMiracleGuideButton();
    return;
  }
  btn.classList.remove('hidden');
  const lbl = document.getElementById('miracle-guide-btn-label');
  if (lbl) {
    lbl.textContent = (currentEpisode === 'miracle' && MiracleGuideUI.activeFieldInfo) ? '진행 미션' : '미션 안내';
  }
  positionMiracleGuideButton();
}
window.updateMiracleGuideButtonVisibility = updateMiracleGuideButtonVisibility;

function hideMissionGuideBubbleImmediately(opts = {}) {
  _clearMiracleGuideTimers();
  MiracleGuideUI.isBubbleOpen = false;
  MiracleGuideUI.isTyping = false;
  MiracleGuideUI.isSucking = false;
  MiracleGuideUI.openedAt = 0;
  const bubble = document.getElementById('miracle-guide-bubble');
  if (bubble) {
    bubble.classList.add('hidden');
    bubble.style.pointerEvents = '';
    bubble.style.transition = 'none';
    bubble.style.transform = 'translate(-50%, -50%) scale(1)';
    bubble.style.opacity = '1';
  }
  _flushMiracleGuideCloseCallbacks(!(opts && opts.runCallbacks));
}
window.hideMissionGuideBubbleImmediately = hideMissionGuideBubbleImmediately;

window.showMiracleGuideBubble = function (opts = {}) {
  if (window.isMiracleMultiplayerMode) return;
  const bubble = document.getElementById('miracle-guide-bubble');
  const titleEl = document.getElementById('miracle-guide-bubble-title');
  const textEl = document.getElementById('miracle-guide-bubble-text');
  const cursorEl = document.getElementById('miracle-guide-cursor');
  const progRow = document.getElementById('miracle-guide-bubble-progress-row');
  const progEl = document.getElementById('miracle-guide-bubble-progress');
  const extraEl = document.getElementById('miracle-guide-bubble-extra');
  const cancelBtn = document.getElementById('miracle-guide-bubble-cancel-btn');
  if (!bubble || !textEl) return;

  _clearMiracleGuideTimers();
  updateMiracleGuideButtonVisibility();

  const title = opts.title || '✨ 탐험 안내';
  const text = String(opts.text || '').trim() || '목표를 향해 모험을 시작해 보세요!';
  const toastBox = document.getElementById('toast-box');
  if (
    toastBox &&
    toastBox.style.opacity === '1' &&
    ((performance.now() - _lastToastAt) < 400 || _isToastDuplicateOfGuideBubble(_lastToastText, text))
  ) {
    hideToastImmediately();
  }
  const progressText = opts.progressText || '';
  const extraText = opts.extraText || '';
  const canCancel = Boolean(opts.canCancel);
  const autoCloseMs = (typeof opts.autoCloseMs === 'number' && opts.autoCloseMs > 0) ? opts.autoCloseMs : 2500;

  if (titleEl) titleEl.textContent = title;
  if (progRow) {
    const showProg = Boolean(progressText || extraText);
    progRow.classList.toggle('hidden', !showProg);
    if (progEl) progEl.textContent = progressText;
    if (extraEl) extraEl.textContent = extraText;
  }
  if (cancelBtn) cancelBtn.classList.toggle('hidden', !canCancel);

  // 우측 상단 미션안내 버튼에서 정중앙으로 튀어나오는(팝업) 탄성 애니메이션 시작점 계산
  const btn = document.getElementById('miracle-guide-btn');
  let dx = Math.round((window.innerWidth || 1000) * 0.42);
  let dy = -Math.round((window.innerHeight || 700) * 0.38);

  try {
    const tr = (btn && !btn.classList.contains('hidden')) ? btn.getBoundingClientRect() : null;
    if (tr && tr.width > 0) {
      const bubbleCenterX = window.innerWidth * 0.5;
      const bubbleCenterY = window.innerHeight * 0.46; // 말풍선 CSS 기준 (left: 50%, top: 46%)
      dx = (tr.left + tr.width * 0.5) - bubbleCenterX;
      dy = (tr.top + tr.height * 0.5) - bubbleCenterY;
    }
  } catch (e) {}

  bubble.style.pointerEvents = '';
  bubble.style.transition = 'none';
  bubble.style.transform = `translate(calc(-50% + ${dx.toFixed(1)}px), calc(-50% + ${dy.toFixed(1)}px)) scale(0.08) rotate(10deg)`;
  bubble.style.opacity = '0';
  bubble.classList.remove('hidden');

  void bubble.offsetWidth;

  bubble.style.transition = 'transform 0.45s cubic-bezier(0.22, 1.15, 0.36, 1), opacity 0.35s ease-out';
  bubble.style.transform = 'translate(-50%, -50%) scale(1) rotate(0deg)';
  bubble.style.opacity = '1';

  MiracleGuideUI.isBubbleOpen = true;
  MiracleGuideUI.isSucking = false;
  MiracleGuideUI.isTyping = true;
  MiracleGuideUI.openedAt = performance.now();
  MiracleGuideUI.fullText = text;
  MiracleGuideUI.typedIdx = 0;
  if (typeof joyX !== 'undefined') joyX = 0;
  if (typeof joyY !== 'undefined') joyY = 0;
  if (typeof currentMoveSpeed !== 'undefined') currentMoveSpeed = 0;
  textEl.textContent = '';
  if (cursorEl) cursorEl.classList.remove('hidden');

  const scheduleAutoSuck = () => {
    MiracleGuideUI.isTyping = false;
    if (cursorEl) cursorEl.classList.add('hidden');
    if (autoCloseMs > 0) {
      MiracleGuideUI.autoCloseTimerId = setTimeout(() => {
        window.dismissMiracleGuideBubbleToButton();
      }, autoCloseMs);
    }
  };

  MiracleGuideUI.typeTimerId = setInterval(() => {
    MiracleGuideUI.typedIdx = Math.min(text.length, MiracleGuideUI.typedIdx + 2);
    textEl.textContent = text.slice(0, MiracleGuideUI.typedIdx);
    if (MiracleGuideUI.typedIdx >= text.length) {
      clearInterval(MiracleGuideUI.typeTimerId);
      MiracleGuideUI.typeTimerId = null;
      scheduleAutoSuck();
    }
  }, 26);
};

window.onMiracleGuideBubbleClick = function () {
  if (!MiracleGuideUI.isBubbleOpen || MiracleGuideUI.isSucking) return;
  if (MiracleGuideUI.isTyping) {
    if (MiracleGuideUI.typeTimerId) { clearInterval(MiracleGuideUI.typeTimerId); MiracleGuideUI.typeTimerId = null; }
    const textEl = document.getElementById('miracle-guide-bubble-text');
    const cursorEl = document.getElementById('miracle-guide-cursor');
    if (textEl) textEl.textContent = MiracleGuideUI.fullText;
    if (cursorEl) cursorEl.classList.add('hidden');
    MiracleGuideUI.isTyping = false;
    MiracleGuideUI.typedIdx = MiracleGuideUI.fullText.length;
    if (MiracleGuideUI.autoCloseTimerId) clearTimeout(MiracleGuideUI.autoCloseTimerId);
    MiracleGuideUI.autoCloseTimerId = setTimeout(() => {
      window.dismissMiracleGuideBubbleToButton();
    }, 900);
  } else {
    window.dismissMiracleGuideBubbleToButton();
  }
};

window.dismissMiracleGuideBubbleToButton = function () {
  const bubble = document.getElementById('miracle-guide-bubble');
  const btn = document.getElementById('miracle-guide-btn');
  if (!bubble || bubble.classList.contains('hidden')) {
    _clearMiracleGuideTimers();
    MiracleGuideUI.isBubbleOpen = false;
    MiracleGuideUI.isTyping = false;
    MiracleGuideUI.isSucking = false;
    _flushMiracleGuideCloseCallbacks(false);
    return;
  }
  if (MiracleGuideUI.isSucking) return;

  _clearMiracleGuideTimers();
  MiracleGuideUI.isTyping = false;
  MiracleGuideUI.isSucking = true;
  bubble.style.pointerEvents = 'none';

  let dx = Math.round((window.innerWidth || 1000) * 0.42);
  let dy = -Math.round((window.innerHeight || 700) * 0.38);
  try {
    const br = bubble.getBoundingClientRect();
    const tr = (btn && !btn.classList.contains('hidden')) ? btn.getBoundingClientRect() : null;
    if (br && br.width > 0 && tr && tr.width > 0) {
      dx = (tr.left + tr.width * 0.5) - (br.left + br.width * 0.5);
      dy = (tr.top + tr.height * 0.5) - (br.top + br.height * 0.5);
    }
  } catch (e) {}

  bubble.style.transition = 'transform 0.30s cubic-bezier(0.45, -0.15, 0.85, 0.35), opacity 0.26s ease-in';
  bubble.style.transform = `translate(calc(-50% + ${dx.toFixed(1)}px), calc(-50% + ${dy.toFixed(1)}px)) scale(0.08) rotate(10deg)`;
  bubble.style.opacity = '0';

  MiracleGuideUI.suckTimerId = setTimeout(() => {
    MiracleGuideUI.suckTimerId = null;
    bubble.classList.add('hidden');
    bubble.style.pointerEvents = '';
    bubble.style.transition = 'none';
    bubble.style.transform = 'translate(-50%, -50%) scale(1)';
    bubble.style.opacity = '1';
    MiracleGuideUI.isBubbleOpen = false;
    MiracleGuideUI.isSucking = false;
    if (btn && !btn.classList.contains('hidden')) {
      btn.classList.remove('absorb-pop');
      void btn.offsetWidth;
      btn.classList.add('absorb-pop');
    }
    _flushMiracleGuideCloseCallbacks(false);
  }, 320);
};

window.syncStageHudCounter = function (counterText) {
  const txt = String(counterText == null ? '' : counterText);
  const countEl = document.getElementById('hud-counter-text');
  if (countEl) countEl.textContent = txt;
  if (MiracleGuideUI && MiracleGuideUI.activeStageInfo) {
    MiracleGuideUI.activeStageInfo.badge = txt;
  }
  if (
    MiracleGuideUI &&
    MiracleGuideUI.isBubbleOpen &&
    !(currentEpisode === 'miracle' && MiracleGuideUI.activeFieldInfo)
  ) {
    const progRow = document.getElementById('miracle-guide-bubble-progress-row');
    const progEl = document.getElementById('miracle-guide-bubble-progress');
    const extraEl = document.getElementById('miracle-guide-bubble-extra');
    if (progEl) progEl.textContent = txt;
    if (progRow) {
      const hasExtra = Boolean(extraEl && String(extraEl.textContent || '').trim());
      progRow.classList.toggle('hidden', !Boolean(txt || hasExtra));
    }
  }
};

window.openMiracleGuideFromButton = function () {
  setHudMenuOpen(false);
  if (typeof playSfx === 'function') playSfx('switch');
  if (currentEpisode === 'miracle' && MiracleGuideUI.activeFieldInfo) {
    const f = MiracleGuideUI.activeFieldInfo;
    window.showMiracleGuideBubble({
      title: f.title || '✨ 진행중인 미션',
      text: f.goal || '',
      progressText: f.progressText || '',
      extraText: f.extraText || '',
      canCancel: true,
      autoCloseMs: 4200
    });
  } else if (MiracleGuideUI.activeStageInfo) {
    const s = MiracleGuideUI.activeStageInfo;
    const liveCounterEl = document.getElementById('hud-counter-text');
    const liveCounter = liveCounterEl ? String(liveCounterEl.textContent || '').trim() : '';
    const progressText = (currentEpisode !== 'miracle' && liveCounter) ? liveCounter : (s.badge || liveCounter || '');
    window.showMiracleGuideBubble({
      title: `💬 ${s.title || '현재 목표'}`,
      text: s.text || '',
      progressText,
      canCancel: false,
      autoCloseMs: 3600
    });
  } else {
    const fallbackText = (document.getElementById('hud-mission-text') || {}).textContent || '목표를 향해 모험을 시작해 보세요!';
    const fallbackTitle = (document.getElementById('hud-stage-badge') || {}).textContent || '탐험 안내';
    window.showMiracleGuideBubble({
      title: `💬 ${fallbackTitle}`,
      text: fallbackText,
      canCancel: false,
      autoCloseMs: 3000
    });
  }
};

window.syncMiracleStageGuideFromHUD = function (stageTitle, missionText, counterText) {
  if (window.isMiracleMultiplayerMode) return;
  const sub = (currentEpisode === 'miracle' && typeof miracleSubMode !== 'undefined') ? miracleSubMode : `st${currentStage}`;
  const normalizedMission = String(missionText || '')
    .replace(/\s*\(현재\s*\d+\/\d+개\)/g, '')
    .replace(/\d+\/(\d+개)/g, 'N/$1');
  const key = `stage|${currentEpisode}|${sub}|${normalizedMission}`;
  MiracleGuideUI.activeStageInfo = {
    key,
    title: stageTitle || '탐험 안내',
    text: missionText || '',
    badge: counterText || ''
  };
  updateMiracleGuideButtonVisibility();

  // 인트로 영상·플라이오버·암전·대화창·카운트다운·컷신 진행 중에는 자동 팝업 보류 (종료 직후 노출!)
  if (isAnyGlobalIntroOrCutsceneBlockingGuide()) return;
  if (currentEpisode === 'miracle' && MiracleGuideUI.activeFieldInfo) return;

  if (missionText && MiracleGuideUI.lastAutoKey !== key) {
    MiracleGuideUI.lastAutoKey = key;
    window.showMiracleGuideBubble({
      title: `💬 ${stageTitle || '현재 목표'}`,
      text: missionText,
      progressText: counterText || '',
      canCancel: false,
      autoCloseMs: 2500
    });
  }
};

// =========================================================================
// [인터페이스 튜토리얼] 아기자기한 움직이는 화살표 화면 안내 시스템
// - 에피소드 1(최초 1회차), 에피소드 4(최초 1회차) 맵 시작 시 자동 안내 (2회차부터 미노출)
// - 좌측 상단 메뉴 내부 [❓ 화면 안내] 버튼으로 현재 스테이지 인터페이스를 언제든 다시 안내
// =========================================================================
window.isUiTutorialActive = false;
let currentRunIsFirstEpEntry = false;
const UiTutorialState = {
  active: false,
  steps: [],
  idx: 0,
  prevPlaying: false,
  prevTimeAttack: false,
  isAutoStart: false,
  epKey: ''
};
window.UiTutorialState = UiTutorialState;

function _getUiTutorialSeenStorageKey(epKey) {
  const who = encodeURIComponent(String(explorerName || explorerDisplayName || 'guest').trim());
  return `ui_tutorial_seen_v1_${who}_${epKey}`;
}

function hasSeenUiTutorial(epKey) {
  try {
    return localStorage.getItem(_getUiTutorialSeenStorageKey(epKey)) === '1';
  } catch (e) {
    return false;
  }
}
window.hasSeenUiTutorial = hasSeenUiTutorial;

function markUiTutorialSeen(epKey) {
  if (!epKey) return;
  try {
    localStorage.setItem(_getUiTutorialSeenStorageKey(epKey), '1');
  } catch (e) {}
}
window.markUiTutorialSeen = markUiTutorialSeen;

function shouldAutoShowInterfaceTutorial(epKey) {
  if (epKey !== 'noah' && epKey !== 'miracle') return false;
  if (window.__isBuildingOpeningPreview || window.isMiracleMultiplayerMode) return false;
  if (enteredFromMapStageSelect) return false;
  if (hasSeenUiTutorial(epKey)) return false;
  if (!currentRunIsFirstEpEntry) return false;
  const epProg = (playerProgressData && playerProgressData[epKey]) ? playerProgressData[epKey] : null;
  if (epProg && (epProg.completed || (epProg.maxClearedStage || 0) >= 1)) return false;
  return true;
}
window.shouldAutoShowInterfaceTutorial = shouldAutoShowInterfaceTutorial;

function _isTutorialTargetVisible(id) {
  let el = document.getElementById(id);
  if (!el) return false;
  while (el) {
    if (el.classList && el.classList.contains('hidden')) return false;
    if (el.style && el.style.display === 'none') return false;
    el = el.parentElement || el.parentNode;
  }
  return true;
}

function _getStageProgressTutorialDesc() {
  if (currentEpisode === 'noah') {
    if (currentStage === 2) return '방주 안에서 진행 중인 비둘기 탐색 목표 상태를 보여줘요!';
    if (currentStage === 4) return '에피소드 완주 상태를 표시해 줘요!';
    return '모은 동물 쌍(0/7쌍) 등 지금 스테이지의 진행 상황을 한눈에 보여줘요!';
  }
  if (currentEpisode === 'exodus') {
    if (currentStage === 1) return '완성한 다리 개수 등 현재 진행 상황을 한눈에 보여줘요!';
    if (currentStage === 2) return '애굽 병사 추격전에서 남은 기회를 실시간으로 보여줘요!';
    if (currentStage === 3) return '시내산 정상까지의 등반 진행률(%)을 보여줘요!';
    return '출애굽 여정 완주 상태를 표시해 줘요!';
  }
  if (currentEpisode === 'david') {
    if (currentStage === 1) return '찾은 양의 수, 배부름, 담장 쌓기 등 현재 단계 진행 상황을 보여줘요!';
    if (currentStage === 2) return '골리앗 놋투구 우상 타격 횟수를 실시간으로 보여줘요!';
    if (currentStage === 3) return '다윗성 백성들의 민원 해결 현황(0/3)을 보여줘요!';
    return '다윗왕 보좌 완주 상태를 표시해 줘요!';
  }
  if (currentEpisode === 'miracle') {
    if (typeof miracleSubMode !== 'undefined' && miracleSubMode === 'openworld') {
      return '클리어한 주요사건(0/4) 진행 현황을 실시간으로 보여줘요!';
    }
    return '현재 진행 중인 복음서 스테이지의 목표 달성 현황을 보여줘요!';
  }
  return '현재 스테이지의 목표 진행 상황을 한눈에 보여줘요!';
}

function buildUiTutorialSteps(isManual = false) {
  const steps = [];

  if (_isTutorialTargetVisible('hud-menu-btn')) {
    steps.push({
      id: 'hud-menu-btn',
      title: '☰ 메뉴 버튼',
      desc: '내 이름이 적힌 메뉴 버튼을 누르면 현재 맵·레벨 확인, 월드맵 이동, 모험의 증표, 화면안내, 음악 끄기·전체화면, 게임 종료를 열 수 있어요!',
      shape: 'pill'
    });
    if (document.getElementById('hud-badges-btn')) {
      steps.push({
        id: 'hud-badges-btn',
        openMenu: true,
        title: '🏅 모험의 증표',
        desc: '에피소드마다 완주해 모은 입체 인증 카드를 횡스크롤로 모아볼 수 있어요! 카드를 터치하면 앞면 그림과 뒷면 인증서·누적 클리어 레벨이 뒤집혀 보입니다.',
        shape: 'pill'
      });
    }
  }

  if (_isTutorialTargetVisible('hud-progress-box')) {
    steps.push({
      id: 'hud-progress-box',
      title: '📊 현재 진행 창',
      desc: _getStageProgressTutorialDesc(),
      shape: 'pill'
    });
  }

  if (_isTutorialTargetVisible('miracle-guide-btn')) {
    steps.push({
      id: 'miracle-guide-btn',
      title: '💬 미션 안내 버튼',
      desc: '화면 가운데 떴던 미션 말풍선이 여기 쏙 들어가 저장돼요! 목표가 궁금할 때 언제든 눌러 다시 볼 수 있어요.',
      shape: 'pill'
    });
  }

  if (_isTutorialTargetVisible('miracle-notebook-btn')) {
    const nbTotal = (typeof getMiracleNotebookTotalCount === 'function') ? getMiracleNotebookTotalCount() : 37;
    steps.push({
      id: 'miracle-notebook-btn',
      title: '📖 탐험 수첩',
      desc: `오픈월드를 걸으며 들은 소문, 직접 목격한 기적과 비유, 예수님의 말씀을 모아 읽어보고 수집 개수(0/${nbTotal})도 바로 확인할 수 있어요!`,
      shape: 'box'
    });
  }

  if (isManual && _isTutorialTargetVisible('miracle-mini-nav')) {
    steps.push({
      id: 'miracle-mini-nav',
      title: '🧭 방향 내비게이터',
      desc: '다음 목표 지점이 어느 방향에, 얼마나 떨어져 있는지 화살표와 거리로 알려줘요!',
      shape: 'pill'
    });
  }

  if (isManual && _isTutorialTargetVisible('david-st3-quest-tracker')) {
    steps.push({
      id: 'david-st3-quest-tracker',
      title: '📜 진행 중인 퀘스트',
      desc: '지금 수락한 백성의 요청 자재와 모은 개수를 바로 확인할 수 있어요!',
      shape: 'box'
    });
  }

  if (isManual && _isTutorialTargetVisible('david-defense-row')) {
    steps.push({
      id: 'david-defense-row',
      title: '🛡️ 양 지키기 디펜스',
      desc: '남은 방어 시간과 사라진 양의 수, 현재 담장 건설 현황을 보여줘요!',
      shape: 'box'
    });
  }

  if (_isTutorialTargetVisible('joystick-zone')) {
    steps.push({
      id: 'joystick-zone',
      title: '🕹️ 이동 조이스틱',
      desc: '반투명 동그란 스틱을 손가락으로 밀어서 캐릭터를 원하는 방향으로 자유롭게 움직여 보세요!',
      shape: 'circle'
    });
  }

  if (_isTutorialTargetVisible('cam-bottom-bar')) {
    steps.push({
      id: 'cam-bottom-bar',
      title: '🎥 시점 · 회전 버튼',
      desc: '좌·우 회전으로 화면 방향을 돌리고, 가운데 시점 버튼으로 [기본·내려봄·올려봄·1인칭] 시점을 바꿀 수 있어요!',
      shape: 'pill'
    });
  }

  if (_isTutorialTargetVisible('jump-action-btn')) {
    steps.push({
      id: 'jump-action-btn',
      title: '🦘 점프 버튼',
      desc: '바위나 계단, 장애물을 뛰어넘을 때 눌러 보세요! 조이스틱으로 이동하면서 동시에 누를 수도 있어요.',
      shape: 'circle'
    });
  }

  return steps;
}

function positionUiTutorialStep() {
  if (!UiTutorialState.active) return;
  const step = UiTutorialState.steps[UiTutorialState.idx];
  if (!step) return;

  const target = document.getElementById(step.id);
  const spot = document.getElementById('ui-tut-spotlight');
  const arrow = document.getElementById('ui-tut-arrow');
  const arrowSvg = document.getElementById('ui-tut-arrow-svg');
  const card = document.getElementById('ui-tut-card');
  if (!spot || !arrow || !card) return;

  const vw = window.innerWidth || 1000;
  const vh = window.innerHeight || 700;
  const pad = step.shape === 'circle' ? 5 : 6;

  let rect = { left: vw * 0.5 - 40, top: vh * 0.5 - 20, right: vw * 0.5 + 40, bottom: vh * 0.5 + 20, width: 80, height: 40 };
  if (target && typeof target.getBoundingClientRect === 'function') {
    const r = target.getBoundingClientRect();
    if (r && r.width > 0 && r.height > 0) rect = r;
  }

  const sLeft = Math.max(2, rect.left - pad);
  const sTop = Math.max(2, rect.top - pad);
  const sW = Math.min(vw - sLeft - 2, rect.width + pad * 2);
  const sH = Math.min(vh - sTop - 2, rect.height + pad * 2);

  spot.style.left = `${Math.round(sLeft)}px`;
  spot.style.top = `${Math.round(sTop)}px`;
  spot.style.width = `${Math.round(sW)}px`;
  spot.style.height = `${Math.round(sH)}px`;
  spot.style.borderRadius = step.shape === 'circle' ? '9999px' : '16px';

  const cx = sLeft + sW * 0.5;
  const cy = sTop + sH * 0.5;
  const isShortLandscape = (vh <= 460 && vw > vh);
  const arrowSize = isShortLandscape ? 36 : 44;

  // 카드 크기 추정 (최소화·화면 밖 잘림 방지)
  const cardRect = card.getBoundingClientRect ? card.getBoundingClientRect() : null;
  const cardW = (cardRect && cardRect.width > 60) ? cardRect.width : Math.min(vw * 0.86, 316);
  const cardH = (cardRect && cardRect.height > 60) ? cardRect.height : 148;

  let dir = (cy < vh * 0.48) ? 'up' : 'down';
  // 가로형 저높이 화면에서 좌측 탐험수첩/퀘스트 배지 강조 시 우측 배치로 가림 방지
  if (isShortLandscape && cx < vw * 0.28 && cy > 45 && cy < vh * 0.65) {
    dir = 'left';
  }

  arrow.classList.remove('dir-up', 'dir-down', 'dir-left', 'dir-right');
  arrow.classList.add(`dir-${dir}`);

  let rotDeg = 0;
  let ax = cx;
  let ay = sTop + sH + 6;
  let cardLeft = cx - cardW * 0.5;
  let cardTop = ay + arrowSize + 6;

  if (dir === 'up') {
    rotDeg = 0;
    ax = Math.max(26, Math.min(vw - 26, cx));
    ay = sTop + sH + 6;
    cardLeft = Math.max(10, Math.min(vw - cardW - 10, cx - cardW * 0.5));
    cardTop = Math.min(vh - cardH - 10, ay + arrowSize + 6);
  } else if (dir === 'down') {
    rotDeg = 180;
    ax = Math.max(26, Math.min(vw - 26, cx));
    ay = Math.max(10, sTop - arrowSize - 6);
    cardLeft = Math.max(10, Math.min(vw - cardW - 10, cx - cardW * 0.5));
    cardTop = Math.max(10, ay - cardH - 6);
  } else if (dir === 'left') {
    rotDeg = -90;
    ax = sLeft + sW + 6;
    ay = Math.max(36, Math.min(vh - 36, cy));
    cardLeft = Math.min(vw - cardW - 10, ax + arrowSize + 8);
    cardTop = Math.max(10, Math.min(vh - cardH - 10, cy - cardH * 0.5));
  }

  if (arrowSvg) {
    arrowSvg.style.transform = `rotate(${rotDeg}deg)`;
  }
  arrow.style.left = `${Math.round(ax)}px`;
  arrow.style.top = `${Math.round(ay)}px`;
  card.style.left = `${Math.round(cardLeft)}px`;
  card.style.top = `${Math.round(cardTop)}px`;
}
window.positionUiTutorialStep = positionUiTutorialStep;

function renderUiTutorialStep() {
  if (!UiTutorialState.active) return;
  const total = UiTutorialState.steps.length;
  const step = UiTutorialState.steps[UiTutorialState.idx];
  if (!step) {
    closeUiTutorial(true);
    return;
  }

  if (typeof setHudMenuOpen === 'function') {
    setHudMenuOpen(Boolean(step.openMenu));
  }

  const badgeEl = document.getElementById('ui-tut-badge');
  const titleEl = document.getElementById('ui-tut-title');
  const descEl = document.getElementById('ui-tut-desc');
  const dotsEl = document.getElementById('ui-tut-dots');
  const prevBtn = document.getElementById('ui-tut-prev-btn');
  const nextBtn = document.getElementById('ui-tut-next-btn');

  if (badgeEl) badgeEl.textContent = `${UiTutorialState.idx + 1} / ${total}`;
  if (titleEl) titleEl.textContent = step.title;
  if (descEl) descEl.textContent = step.desc;
  if (prevBtn) prevBtn.classList.toggle('hidden', UiTutorialState.idx <= 0);
  if (nextBtn) {
    const isLast = UiTutorialState.idx >= total - 1;
    nextBtn.textContent = isLast
      ? (UiTutorialState.isAutoStart ? '🎉 탐험 시작!' : '🎉 완료!')
      : '다음 ▶';
  }
  if (dotsEl) {
    dotsEl.innerHTML = UiTutorialState.steps.map((_, i) => {
      const isCur = i === UiTutorialState.idx;
      return `<span class="inline-block rounded-full transition-all ${isCur ? 'w-4 h-2 bg-amber-600' : 'w-2 h-2 bg-amber-300'}"></span>`;
    }).join('');
  }

  positionUiTutorialStep();
  setTimeout(positionUiTutorialStep, 30);
  if (step.openMenu) {
    setTimeout(positionUiTutorialStep, 210);
  }
}

function openInterfaceTutorial(opts = {}) {
  const isAuto = Boolean(opts.isAuto);
  const steps = buildUiTutorialSteps(!isAuto);
  if (!steps.length) return false;

  const overlay = document.getElementById('ui-tutorial-overlay');
  if (!overlay) return false;

  setHudMenuOpen(false);
  hideMissionGuideBubbleImmediately();

  UiTutorialState.prevPlaying = (opts.resumePlaying !== undefined) ? Boolean(opts.resumePlaying) : Boolean(isPlaying);
  UiTutorialState.prevTimeAttack = (opts.resumeTimeAttack !== undefined) ? Boolean(opts.resumeTimeAttack) : Boolean(isTimeAttackActive);
  UiTutorialState.active = true;
  UiTutorialState.steps = steps;
  UiTutorialState.idx = 0;
  UiTutorialState.isAutoStart = isAuto;
  UiTutorialState.epKey = opts.epKey || currentEpisode;
  window.isUiTutorialActive = true;

  isPlaying = false;
  isTimeAttackActive = false;
  joyX = 0; joyY = 0; keys = {}; currentMoveSpeed = 0;

  overlay.classList.remove('hidden');
  renderUiTutorialStep();
  if (typeof playSfx === 'function') playSfx('switch');
  return true;
}
window.openInterfaceTutorial = openInterfaceTutorial;

function maybeStartAutoInterfaceTutorial(epKey, opts = {}) {
  if (!shouldAutoShowInterfaceTutorial(epKey)) return false;
  markUiTutorialSeen(epKey);
  return openInterfaceTutorial(Object.assign({ isAuto: true, epKey }, opts));
}
window.maybeStartAutoInterfaceTutorial = maybeStartAutoInterfaceTutorial;

function openInterfaceTutorialFromMenu() {
  setHudMenuOpen(false);
  openInterfaceTutorial({ isAuto: false, epKey: currentEpisode });
}
window.openInterfaceTutorialFromMenu = openInterfaceTutorialFromMenu;

function nextUiTutorialStep() {
  if (!UiTutorialState.active) return;
  if (typeof playSfx === 'function') playSfx('switch');
  if (UiTutorialState.idx < UiTutorialState.steps.length - 1) {
    UiTutorialState.idx++;
    renderUiTutorialStep();
  } else {
    closeUiTutorial(true);
  }
}
window.nextUiTutorialStep = nextUiTutorialStep;

function prevUiTutorialStep() {
  if (!UiTutorialState.active) return;
  if (UiTutorialState.idx > 0) {
    if (typeof playSfx === 'function') playSfx('switch');
    UiTutorialState.idx--;
    renderUiTutorialStep();
  }
}
window.prevUiTutorialStep = prevUiTutorialStep;

function closeUiTutorial(resumeGame = true) {
  const wasActive = UiTutorialState.active;
  const wasAuto = UiTutorialState.isAutoStart;
  const prevPlay = UiTutorialState.prevPlaying;
  const prevTA = UiTutorialState.prevTimeAttack;

  UiTutorialState.active = false;
  UiTutorialState.steps = [];
  UiTutorialState.idx = 0;
  UiTutorialState.isAutoStart = false;
  window.isUiTutorialActive = false;

  if (typeof setHudMenuOpen === 'function') {
    setHudMenuOpen(false);
  }

  const overlay = document.getElementById('ui-tutorial-overlay');
  if (overlay) overlay.classList.add('hidden');

  if (wasActive && resumeGame) {
    isPlaying = prevPlay;
    isTimeAttackActive = prevTA;
    if (wasAuto && typeof updateStageHUD === 'function') {
      updateStageHUD();
    }
    if (typeof playSfx === 'function') playSfx('rescue');
  }
}
window.closeUiTutorial = closeUiTutorial;

if (typeof window !== 'undefined') {
  window.addEventListener('resize', () => {
    if (UiTutorialState.active) positionUiTutorialStep();
  });
  window.addEventListener('orientationchange', () => {
    if (UiTutorialState.active) setTimeout(positionUiTutorialStep, 120);
  });
}

// 성경 약어 및 장:절 표기(예: '막 10:13', '마 7:24~27')를 자연스러운 한국어 TTS 발음('마가복음 십장 십삼절')으로 변환
const KOREAN_BIBLE_BOOK_MAP = {
  // 구약 39권 약어 + 정식 명칭
  '창': '창세기', '창세기': '창세기',
  '출': '출애굽기', '출애굽기': '출애굽기',
  '레': '레위기', '레위기': '레위기',
  '민': '민수기', '민수기': '민수기',
  '신': '신명기', '신명기': '신명기',
  '수': '여호수아', '여호수아': '여호수아',
  '삿': '사사기', '사사기': '사사기',
  '룻': '룻기', '룻기': '룻기',
  '삼상': '사무엘상', '사무엘상': '사무엘상',
  '삼하': '사무엘하', '사무엘하': '사무엘하',
  '왕상': '열왕기상', '열왕기상': '열왕기상',
  '왕하': '열왕기하', '열왕기하': '열왕기하',
  '대상': '역대상', '역대상': '역대상',
  '대하': '역대하', '역대하': '역대하',
  '스': '에스라', '에스라': '에스라',
  '느': '느헤미야', '느헤미야': '느헤미야',
  '에': '에스더', '에스더': '에스더',
  '욥': '욥기', '욥기': '욥기',
  '시': '시편', '시편': '시편',
  '잠': '잠언', '잠언': '잠언',
  '전': '전도서', '전도서': '전도서',
  '아': '아가', '아가': '아가',
  '사': '이사야', '이사야': '이사야',
  '렘': '예레미야', '예레미야': '예레미야',
  '애': '예레미야애가', '예레미야애가': '예레미야애가',
  '겔': '에스겔', '에스겔': '에스겔',
  '단': '다니엘', '다니엘': '다니엘',
  '호': '호세아', '호세아': '호세아',
  '욜': '요엘', '요엘': '요엘',
  '암': '아모스', '아모스': '아모스',
  '옵': '오바댜', '오바댜': '오바댜',
  '욘': '요나', '요나': '요나',
  '미': '미가', '미가': '미가',
  '나': '나훔', '나훔': '나훔',
  '합': '하박국', '하박국': '하박국',
  '습': '스바냐', '스바냐': '스바냐',
  '학': '학개', '학개': '학개',
  '슥': '스가랴', '스가랴': '스가랴',
  '말': '말라기', '말라기': '말라기',
  // 신약 27권 약어 + 정식 명칭
  '마': '마태복음', '마태복음': '마태복음',
  '막': '마가복음', '마가복음': '마가복음',
  '눅': '누가복음', '누가복음': '누가복음',
  '요': '요한복음', '요한복음': '요한복음',
  '행': '사도행전', '사도행전': '사도행전',
  '롬': '로마서', '로마서': '로마서',
  '고전': '고린도전서', '고린도전서': '고린도전서',
  '고후': '고린도후서', '고린도후서': '고린도후서',
  '갈': '갈라디아서', '갈라디아서': '갈라디아서',
  '엡': '에베소서', '에베소서': '에베소서',
  '빌': '빌립보서', '빌립보서': '빌립보서',
  '골': '골로새서', '골로새서': '골로새서',
  '살전': '데살로니가전서', '데살로니가전서': '데살로니가전서',
  '살후': '데살로니가후서', '데살로니가후서': '데살로니가후서',
  '딤전': '디모데전서', '디모데전서': '디모데전서',
  '딤후': '디모데후서', '디모데후서': '디모데후서',
  '딛': '디도서', '디도서': '디도서',
  '몬': '빌레몬서', '빌레몬서': '빌레몬서',
  '히': '히브리서', '히브리서': '히브리서',
  '약': '야고보서', '야고보서': '야고보서',
  '벧전': '베드로전서', '베드로전서': '베드로전서',
  '벧후': '베드로후서', '베드로후서': '베드로후서',
  '요일': '요한일서', '요한일서': '요한일서',
  '요이': '요한이서', '요한이서': '요한이서',
  '요삼': '요한삼서', '요한삼서': '요한삼서',
  '유': '유다서', '유다서': '유다서',
  '계': '요한계시록', '요한계시록': '요한계시록'
};

const _KOREAN_BIBLE_BOOK_KEYS_PATTERN = Object.keys(KOREAN_BIBLE_BOOK_MAP)
  .sort((a, b) => b.length - a.length)
  .join('|');
const _KOREAN_BIBLE_COLON_REGEX = new RegExp(
  `(^|[^가-힣])(${_KOREAN_BIBLE_BOOK_KEYS_PATTERN})\\s*(\\d+)\\s*:\\s*(\\d+)(?:\\s*[-~～]\\s*(\\d+))?`,
  'g'
);
const _KOREAN_BIBLE_CHAPTER_WORD_REGEX = new RegExp(
  `(^|[^가-힣])(${_KOREAN_BIBLE_BOOK_KEYS_PATTERN})\\s*(\\d+)\\s*(장|편)(?:\\s*(\\d+)\\s*절(?:\\s*[-~～]\\s*(\\d+)\\s*절?)?)?`,
  'g'
);

function toSinoKoreanBibleNum(n) {
  const num = parseInt(n, 10);
  if (!Number.isFinite(num) || num <= 0 || num >= 1000) return String(n);
  const digits = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
  const h = Math.floor(num / 100);
  const t = Math.floor((num % 100) / 10);
  const o = num % 10;
  let out = '';
  if (h > 0) out += (h === 1 ? '백' : digits[h] + '백');
  if (t > 0) out += (t === 1 ? '십' : digits[t] + '십');
  if (o > 0) out += digits[o];
  return out || String(num);
}

function formatKoreanBibleTextForTTS(text) {
  if (!text) return '';
  let out = String(text);
  // 1) '막 10:13', '마 7:24~27', '시 23:1' -> '마가복음 십장 십삼절', '마태복음 칠장 이십사절에서 이십칠절', '시편 이십삼편 일절'
  out = out.replace(_KOREAN_BIBLE_COLON_REGEX, (match, prefix, bookKey, ch, vStart, vEnd) => {
    const fullBook = KOREAN_BIBLE_BOOK_MAP[bookKey] || bookKey;
    const chUnit = (fullBook === '시편') ? '편' : '장';
    const chStr = toSinoKoreanBibleNum(ch);
    const vStartStr = toSinoKoreanBibleNum(vStart);
    if (vEnd) {
      const vEndStr = toSinoKoreanBibleNum(vEnd);
      return `${prefix}${fullBook} ${chStr}${chUnit} ${vStartStr}절에서 ${vEndStr}절`;
    }
    return `${prefix}${fullBook} ${chStr}${chUnit} ${vStartStr}절`;
  });
  // 2) '막 10장 13절'처럼 이미 장/절로 표기된 약어도 전체 성경책 이름과 한자어 숫자로 교정
  out = out.replace(_KOREAN_BIBLE_CHAPTER_WORD_REGEX, (match, prefix, bookKey, ch, unit, vStart, vEnd) => {
    const fullBook = KOREAN_BIBLE_BOOK_MAP[bookKey] || bookKey;
    const chUnit = (fullBook === '시편') ? '편' : unit;
    const chStr = toSinoKoreanBibleNum(ch);
    if (vStart) {
      const vStartStr = toSinoKoreanBibleNum(vStart);
      if (vEnd) {
        return `${prefix}${fullBook} ${chStr}${chUnit} ${vStartStr}절에서 ${toSinoKoreanBibleNum(vEnd)}절`;
      }
      return `${prefix}${fullBook} ${chStr}${chUnit} ${vStartStr}절`;
    }
    return `${prefix}${fullBook} ${chStr}${chUnit}`;
  });
  return out;
}
window.formatKoreanBibleTextForTTS = formatKoreanBibleTextForTTS;

function stripEmojisAndSymbolsForTTS(text) {
  if (!text) return '';
  let out = String(text);
  out = out
    .replace(/&/g, '과')
    .replace(/[→➡➜➔➤⇒]/g, ', ')
    .replace(/·/g, ' ')
    .replace(/\[([^\]]+)\]/g, '$1, ');
  // 키캡 이모티콘(1️⃣ 등), 국기(지역 코드 쌍), 결합자·변이선택자 제거
  out = out
    .replace(/[0-9#*]\uFE0F?\u20E3/g, ' ')
    .replace(/[\uD83C][\uDDE6-\uDDFF]/g, ' ')
    .replace(/[\u200D\u20E3\uFE0E\uFE0F]/g, '');
  // 유니코드 확장 그림문자(📖, ✨, 🌈 등 모든 이모티콘) 일괄 제거
  try {
    out = out.replace(/\p{Extended_Pictographic}/gu, ' ');
  } catch (e) {}
  // 보조 영역(U+1F000~) 및 화살표·도형·원문자·딩뱃 기호 제거 (한글·영문·숫자·기본 문장부호 유지)
  out = out
    .replace(/[\uD83C-\uDBFF][\uDC00-\uDFFF]/g, ' ')
    .replace(/[\u2190-\u2BFF]/g, ' ')
    .replace(/\(\s*\)/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,!?])/g, '$1')
    .replace(/,\s*,+/g, ',')
    .replace(/^[\s,·•\-]+/, '')
    .trim();
  return out;
}
window.stripEmojisAndSymbolsForTTS = stripEmojisAndSymbolsForTTS;

let melodyTimer = null;
function speakText(text, onEndOrOpts) {
  const onEnd = (typeof onEndOrOpts === 'function')
    ? onEndOrOpts
    : (onEndOrOpts && typeof onEndOrOpts.onEnd === 'function' ? onEndOrOpts.onEnd : null);
  const onStart = (onEndOrOpts && typeof onEndOrOpts.onStart === 'function') ? onEndOrOpts.onStart : null;
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    if (window.__activeUtterance) window.__activeUtterance = null;
    if (onEnd) {
      try { onEnd(); } catch (e) {}
    }
  };
  if (!text) { finish(); return; }
  const formattedText = formatKoreanBibleTextForTTS(text);
  const cleanText = stripEmojisAndSymbolsForTTS(formattedText);
  if (!cleanText) { finish(); return; }
  if (melodyTimer) { clearInterval(melodyTimer); melodyTimer = null; }
  let ttsWorked = false;
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(cleanText);
      u.lang = 'ko-KR'; u.rate = 0.95; u.pitch = 1.08;
      u.volume = 0.22;
      if (onStart) u.onstart = () => { try { onStart(); } catch (e) {} };
      u.onend = finish;
      u.onerror = finish;
      // 모바일/크롬에서 Utterance가 GC되어 onend가 누락되는 현상 방지
      window.__activeUtterance = u;
      window.speechSynthesis.speak(u);
      ttsWorked = true;
    } catch (e) { ttsWorked = false; }
  }
  if (!ttsWorked) {
    let idx = 0;
    const scale = [440, 493.8, 523.2, 587.3, 659.2, 784];
    const totalNotes = Math.min(cleanText.length, 16);
    melodyTimer = setInterval(() => {
      if (idx >= totalNotes) {
        clearInterval(melodyTimer);
        melodyTimer = null;
        finish();
        return;
      }
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
  const el = document.getElementById('hud-mission-text');
  if (el) speakText(el.textContent);
}

let _lastToastText = '';
let _lastToastAt = 0;

function _normalizeGuideDedupText(str) {
  return String(str || '')
    .replace(/\[[^\]]*단계[^\]]*\]/g, ' ')
    .replace(/[^\uAC00-\uD7A3a-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function _isToastDuplicateOfGuideBubble(toastMsg, bubbleText) {
  const a = _normalizeGuideDedupText(toastMsg);
  const b = _normalizeGuideDedupText(bubbleText);
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.length >= 6 && b.length >= 6 && (a.includes(b) || b.includes(a))) return true;
  const aTokens = new Set(a.split(' ').filter(w => w.length >= 2));
  const bTokens = new Set(b.split(' ').filter(w => w.length >= 2));
  if (aTokens.size === 0 || bTokens.size === 0) return false;
  let overlap = 0;
  aTokens.forEach(w => { if (bTokens.has(w)) overlap++; });
  return overlap >= 2 && (overlap / Math.min(aTokens.size, bTokens.size)) >= 0.45;
}

function hideToastImmediately() {
  const box = document.getElementById('toast-box');
  if (box) {
    clearTimeout(box._t);
    box.style.opacity = '0';
  }
  _lastToastText = '';
  _lastToastAt = 0;
}
window.hideToastImmediately = hideToastImmediately;

function showToast(msg) {
  if (
    typeof MiracleGuideUI !== 'undefined' &&
    MiracleGuideUI &&
    (MiracleGuideUI.isBubbleOpen || (MiracleGuideUI.openedAt > 0 && (performance.now() - MiracleGuideUI.openedAt) < 900)) &&
    _isToastDuplicateOfGuideBubble(msg, MiracleGuideUI.fullText)
  ) {
    return;
  }
  const box = document.getElementById('toast-box');
  const textEl = document.getElementById('toast-text');
  if (!box || !textEl) return;
  _lastToastText = String(msg || '');
  _lastToastAt = performance.now();
  textEl.textContent = _lastToastText;
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

// 에피소드 4에서는 타임어택도 시간 제한 없이 소년반(senior)과 동일한 구성으로 운영
function isEffectiveSeniorMode(ep = currentEpisode, mode = currentMode) {
  return mode === 'senior' || (ep === 'miracle' && mode === 'timeattack');
}
window.isEffectiveSeniorMode = isEffectiveSeniorMode;

const MODE_CLEAR_ORDER = ['kinder', 'junior', 'senior', 'timeattack'];

const EPISODE_CARD_META = (typeof window !== 'undefined' && window.BIBLE_GAME_CATALOG && window.BIBLE_GAME_CATALOG.episodeCardMeta)
  ? window.BIBLE_GAME_CATALOG.episodeCardMeta
  : {
  noah: {
    epNum: 1,
    epLabel: 'EPISODE 01',
    icon: '🛶',
    shortTitle: '노아의 방주',
    subtitle: '무지개 언약의 새 세상',
    badge: '🌈 에피소드 1 : 노아의 방주 완주!',
    title: '무지개 언약의 새 세상!',
    verse: '"내가 내 무지개를 구름 속에 두었나니 이것이 나와 세상 사이의 언약의 증거니라" (창세기 9:13)',
    mission: '노아의 방주 3단계 탐험 완주',
    prefix: 'ARK-',
    silhouetteHint: '방주와 동물 친구들, 무지개 언약의 이야기',
    gradTop: '#0ea5e9',
    gradBot: '#15803d',
    accentHex: '#f59e0b'
  },
  exodus: {
    epNum: 2,
    epLabel: 'EPISODE 02',
    icon: '🌊',
    shortTitle: '출애굽과 시내산',
    subtitle: '갈라진 홍해와 십계명 언약',
    badge: '🌊 에피소드 2 : 출애굽과 시내산 십계명 완주!',
    title: '홍해를 건너 시내산 언약의 백성으로!',
    verse: '"너희가 내 말을 잘 듣고 내 언약을 지키면 너희는 모든 민족 중에서 내 소유가 되겠고" (출애굽기 19:5)',
    mission: '홍해 도하 및 시내산 십계명 수직 등반 완주',
    prefix: 'EXO-',
    silhouetteHint: '갈라진 홍해 바다와 시내산 십계명 돌판',
    gradTop: '#1d4ed8',
    gradBot: '#0f172a',
    accentHex: '#38bdf8'
  },
  david: {
    epNum: 3,
    epLabel: 'EPISODE 03',
    icon: '👑',
    shortTitle: '다윗과 골리앗',
    subtitle: '믿음의 목동에서 이스라엘 왕으로',
    badge: '👑 에피소드 3 : 믿음의 목동 다윗왕 완주!',
    title: '양을 지키던 목동에서 백성을 섬기는 왕으로!',
    verse: '"보라 날이 이르리니 내가 다윗에게 한 의로운 가지를 일으킬 것이라 그가 왕이 되어 지혜롭게 다스리며" (예레미야 23:5)',
    mission: '베들레헴 양 떼 수호, 엘라 골짜기 승리 및 다윗성 백성 섬김 완주',
    prefix: 'DAV-',
    silhouetteHint: '청동 갑옷 거인과 물맷돌, 황금 왕관의 이야기',
    gradTop: '#b45309',
    gradBot: '#451a03',
    accentHex: '#facc15'
  },
  miracle: {
    epNum: 4,
    epLabel: 'EPISODE 04',
    icon: '🕊️',
    shortTitle: '예수님의 기적',
    subtitle: '갈릴리에서 감람산 승천까지',
    badge: '🕊️ 에피소드 4 : 예수님의 기적과 부활·재림 언약 완주!',
    title: '갈릴리에서 감람산까지, 다시 오실 예수님을 기다려요!',
    verse: '"하늘로 올려지신 이 예수는 하늘로 가심을 본 그대로 오시리라" (사도행전 1:11)',
    mission: '갈릴리 바다·오병이어·십자가의 길·빈 무덤 부활 및 복음서 오픈월드 완주',
    prefix: 'JES-',
    silhouetteHint: '예수님과 제자들이 함께한 기적과 부활의 여정',
    gradTop: '#2563eb',
    gradBot: '#065f46',
    accentHex: '#fde047'
  }
};

function getEpisodeCardMeta(epKey) {
  const base = EPISODE_CARD_META[epKey] || EPISODE_CARD_META.noah;
  const plugin = EPISODE_REGISTRY[epKey];
  if (plugin && plugin.certMeta) {
    return Object.assign({}, base, plugin.certMeta);
  }
  return base;
}

let adventureCertsData = {};

function getAdventureCertsStorageKey(uniquePlayerId) {
  return 'bible_adventure_certs_v1_' + (uniquePlayerId || 'guest');
}

function formatAdventureCertDate(dateObj = new Date()) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
}

function normalizeClearedModesList(list) {
  const set = new Set();
  (Array.isArray(list) ? list : []).forEach(m => {
    if (MODE_META[m]) set.add(m);
  });
  return MODE_CLEAR_ORDER.filter(m => set.has(m));
}

function mapModeTextToKey(rawText) {
  const s = String(rawText || '').trim().toLowerCase();
  if (!s) return '';
  if (s === 'kinder' || s.includes('유치')) return 'kinder';
  if (s === 'junior' || s.includes('유년')) return 'junior';
  if (s === 'senior' || s.includes('소년')) return 'senior';
  if (s === 'timeattack' || s.includes('타임')) return 'timeattack';
  return '';
}

function getCollectedAdventureCertCount() {
  return EPISODE_ORDER.filter(ep => Boolean(adventureCertsData[ep])).length;
}
window.getCollectedAdventureCertCount = getCollectedAdventureCertCount;

function saveAdventureCerts(uniquePlayerId) {
  try {
    localStorage.setItem(getAdventureCertsStorageKey(uniquePlayerId || explorerName), JSON.stringify(adventureCertsData));
  } catch (e) {}
  if (!window.__suppressProfileSheetSync && typeof schedulePlayerProfileSheetSync === 'function') {
    schedulePlayerProfileSheetSync('cert', true);
  }
}

function loadAdventureCerts(uniquePlayerId) {
  adventureCertsData = {};
  const pid = uniquePlayerId || explorerName || 'guest';
  try {
    const raw = localStorage.getItem(getAdventureCertsStorageKey(pid));
    if (raw) {
      const parsed = JSON.parse(raw);
      EPISODE_ORDER.forEach(ep => {
        const entry = parsed && parsed[ep];
        if (entry && entry.code) {
          adventureCertsData[ep] = {
            epId: ep,
            code: String(entry.code),
            playerName: String(entry.playerName || explorerName || '믿음의용사'),
            issuedAt: String(entry.issuedAt || formatAdventureCertDate()),
            updatedAt: String(entry.updatedAt || entry.issuedAt || formatAdventureCertDate()),
            clearedModes: normalizeClearedModesList(entry.clearedModes)
          };
        }
      });
    }
  } catch (e) {}

  // 기존 v19 이전 클리어 기록(playerProgressData[ep].certIssued)이 있는 대원의 인증서 자동 승계
  let backfilled = false;
  EPISODE_ORDER.forEach(ep => {
    const prog = playerProgressData[ep];
    if (prog && prog.certIssued && !adventureCertsData[ep]) {
      const meta = getEpisodeCardMeta(ep);
      const todayStr = formatAdventureCertDate();
      adventureCertsData[ep] = {
        epId: ep,
        code: meta.prefix + Math.floor(100 + Math.random() * 900),
        playerName: explorerName || explorerDisplayName || '믿음의용사',
        issuedAt: todayStr,
        updatedAt: todayStr,
        clearedModes: normalizeClearedModesList([currentMode || 'junior'])
      };
      backfilled = true;
    }
  });
  if (backfilled) {
    saveAdventureCerts(pid);
  }
  loadFootstepsCerts(pid);
  if (typeof syncHudMenuInfo === 'function') syncHudMenuInfo();
  return adventureCertsData;
}

// 에피소드당 인증서 1장만 발급·보존하고, 다른 레벨을 추가 클리어할 때 해당 레벨을 누적 표기
function upsertEpisodeAdventureCert(epKey, modeKey = currentMode, preferredCode = null) {
  if (!EPISODE_ORDER.includes(epKey)) return null;
  const meta = getEpisodeCardMeta(epKey);
  const validMode = MODE_META[modeKey] ? modeKey : (MODE_META[currentMode] ? currentMode : 'junior');
  const todayStr = formatAdventureCertDate();
  const displayName = explorerName || explorerDisplayName || '믿음의용사';

  const existing = adventureCertsData[epKey];
  if (!existing) {
    const code = (preferredCode && preferredCode !== '-' && preferredCode.length >= 4)
      ? String(preferredCode)
      : (meta.prefix + Math.floor(100 + Math.random() * 900));
    const cert = {
      epId: epKey,
      code,
      playerName: displayName,
      issuedAt: todayStr,
      updatedAt: todayStr,
      clearedModes: [validMode]
    };
    adventureCertsData[epKey] = cert;
    saveAdventureCerts(explorerName);
    if (typeof syncHudMenuInfo === 'function') syncHudMenuInfo();
    return { cert, isNewCert: true, isNewLevel: true };
  }

  const prevModes = normalizeClearedModesList(existing.clearedModes);
  const isNewLevel = !prevModes.includes(validMode);
  existing.clearedModes = normalizeClearedModesList(prevModes.concat([validMode]));
  existing.playerName = displayName;
  existing.updatedAt = todayStr;
  if ((!existing.code || existing.code === '-') && preferredCode && preferredCode !== '-') {
    existing.code = String(preferredCode);
  }
  saveAdventureCerts(explorerName);
  if (typeof syncHudMenuInfo === 'function') syncHudMenuInfo();
  return { cert: existing, isNewCert: false, isNewLevel };
}
window.upsertEpisodeAdventureCert = upsertEpisodeAdventureCert;

function renderClearedLevelPillsHTML(clearedModes) {
  const list = normalizeClearedModesList(clearedModes);
  const effective = list.length ? list : [MODE_META[currentMode] ? currentMode : 'junior'];
  const pillStyleMap = {
    kinder: 'bg-pink-100 text-pink-900 border-pink-300',
    junior: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    senior: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    timeattack: 'bg-amber-100 text-amber-950 border-amber-400'
  };
  return effective.map(mk => {
    const label = MODE_META[mk] ? MODE_META[mk].badge : mk;
    const cls = pillStyleMap[mk] || 'bg-slate-100 text-slate-800 border-slate-300';
    return `<span class="cert-level-pill inline-flex items-center px-1.5 py-0.5 rounded-full border font-jua text-[9.5px] leading-none ${cls}">${label}</span>`;
  }).join('');
}

// =========================================================================
// [에피소드 4 공통] 예수님의 발자취 카드 시스템 (game_catalog.js 우선 로드 + 폴백)
// =========================================================================
const FOOTSTEPS_CARD_ORDER = (typeof window !== 'undefined' && window.BIBLE_GAME_CATALOG && Array.isArray(window.BIBLE_GAME_CATALOG.footstepsOrder))
  ? window.BIBLE_GAME_CATALOG.footstepsOrder.slice()
  : ['fp_1', 'fp_2', 'fp_3', 'fp_4', 'fp_5'];
const FOOTSTEPS_CARD_META = (typeof window !== 'undefined' && window.BIBLE_GAME_CATALOG && window.BIBLE_GAME_CATALOG.footstepsMeta)
  ? window.BIBLE_GAME_CATALOG.footstepsMeta
  : {
  fp_1: {
    id: 'fp_1',
    stageNum: 1,
    stageLabel: '1단계',
    requiredCount: 3,
    isAllClear: false,
    title: '갈릴리의 길벗',
    borderColor: '#c87a32',
    innerBorder: '#f7d7a8',
    badgeBg: '#9a4f16',
    backGrad: 'linear-gradient(165deg, #fff8ed 0%, #fce8cc 54%, #efc896 100%)',
    gradTop: '#d97706',
    gradBot: '#78350f',
    symbolKey: 'leaf',
    symbolName: '나뭇잎',
    symbolIcon: '🍃',
    prefix: 'GLB-',
    desc: '예수님의 이야기를 따라 갈릴리 마을과 바닷가의 첫 발걸음을 내디딘 다정한 길벗이에요.'
  },
  fp_2: {
    id: 'fp_2',
    stageNum: 2,
    stageLabel: '2단계',
    requiredCount: 5,
    isAllClear: false,
    title: '기적의 목격자',
    borderColor: '#38bdf8',
    innerBorder: '#e0f2fe',
    badgeBg: '#0284c7',
    backGrad: 'linear-gradient(165deg, #f0f9ff 0%, #e0f2fe 52%, #bae6fd 100%)',
    gradTop: '#0ea5e9',
    gradBot: '#0369a1',
    symbolKey: 'wave',
    symbolName: '빛나는 물결',
    symbolIcon: '🌊',
    prefix: 'MRW-',
    desc: '물이 포도주가 되고 거센 폭풍우가 잠잠해지는 놀라운 표적을 두 눈으로 직접 목격했어요.'
  },
  fp_3: {
    id: 'fp_3',
    stageNum: 3,
    stageLabel: '3단계',
    requiredCount: 7,
    isAllClear: false,
    title: '말씀을 품은 제자',
    borderColor: '#22c55e',
    innerBorder: '#dcfce7',
    badgeBg: '#15803d',
    backGrad: 'linear-gradient(165deg, #f0fdf4 0%, #dcfce7 52%, #bbf7d0 100%)',
    gradTop: '#16a34a',
    gradBot: '#14532d',
    symbolKey: 'seed',
    symbolName: '황금 씨앗',
    symbolIcon: '🌾',
    prefix: 'WRD-',
    desc: '씨 뿌리는 비유와 잃어버린 양 이야기를 통해 예수님의 따뜻한 마음을 깊이 깨달았어요.'
  },
  fp_4: {
    id: 'fp_4',
    stageNum: 4,
    stageLabel: '4단계',
    requiredCount: 10,
    isAllClear: false,
    title: '신실한 동행자',
    borderColor: '#7c3aed',
    innerBorder: '#ede9fe',
    badgeBg: '#5b21b6',
    backGrad: 'linear-gradient(165deg, #faf5ff 0%, #ede9fe 52%, #ddd6fe 100%)',
    gradTop: '#6d28d9',
    gradBot: '#3b0764',
    symbolKey: 'olive',
    symbolName: '올리브 가지',
    symbolIcon: '🌿',
    prefix: 'FTH-',
    desc: '이웃을 돌보고 예루살렘과 십자가의 길까지 포기하지 않고 예수님 곁을 지킨 동행자예요.'
  },
  fp_5: {
    id: 'fp_5',
    stageNum: 5,
    stageLabel: '5단계',
    requiredCount: 22,
    isAllClear: true,
    title: '부활의 기쁜 증인',
    borderColor: '#f59e0b',
    innerBorder: '#fef9c3',
    badgeBg: '#b45309',
    backGrad: 'linear-gradient(165deg, #fffbeb 0%, #fef3c7 48%, #fde047 100%)',
    gradTop: '#f59e0b',
    gradBot: '#78350f',
    symbolKey: 'crown',
    symbolName: '빛나는 왕관',
    symbolIcon: '👑',
    prefix: 'RES-',
    desc: '다시 살아나신 예수님을 만나 세상 끝까지 기쁜 소식을 전하는 최고의 성경 탐험가예요!'
  }
};

let footstepsCertsData = {};
let pendingFootstepsAwardQueue = [];
let _footstepsModalPrevPlaying = false;

function getFootstepsCertsStorageKey(uniquePlayerId) {
  return 'bible_ep4_footsteps_v1_' + (uniquePlayerId || 'guest');
}

function getFootstepsRequiredCount(tierId, totalMissions) {
  const meta = FOOTSTEPS_CARD_META[tierId];
  if (!meta) return 3;
  if (meta.isAllClear) {
    const resolvedTotal = totalMissions || (typeof window.getMiracleTotalMissionCount === 'function' ? window.getMiracleTotalMissionCount() : 22);
    return Math.max(11, resolvedTotal || 22);
  }
  return meta.requiredCount;
}

function getCollectedFootstepsCertCount() {
  return FOOTSTEPS_CARD_ORDER.filter(id => Boolean(footstepsCertsData[id])).length;
}
window.getCollectedFootstepsCertCount = getCollectedFootstepsCertCount;

function saveFootstepsCerts(uniquePlayerId) {
  try {
    localStorage.setItem(getFootstepsCertsStorageKey(uniquePlayerId || explorerName), JSON.stringify(footstepsCertsData));
  } catch (e) {}
  if (!window.__suppressProfileSheetSync && typeof schedulePlayerProfileSheetSync === 'function') {
    schedulePlayerProfileSheetSync('footsteps', true);
  }
}

function _collectOrderedKeys(baseOrder, ...objects) {
  const seen = new Set();
  const out = [];
  (Array.isArray(baseOrder) ? baseOrder : []).forEach(k => {
    const clean = String(k || '').trim();
    if (clean && !seen.has(clean)) {
      seen.add(clean);
      out.push(clean);
    }
  });
  const extras = [];
  objects.forEach(obj => {
    if (!obj || typeof obj !== 'object') return;
    Object.keys(obj).forEach(k => {
      const clean = String(k || '').trim();
      if (clean && !seen.has(clean)) {
        seen.add(clean);
        extras.push(clean);
      }
    });
  });
  extras.sort();
  return out.concat(extras);
}

function loadFootstepsCerts(uniquePlayerId) {
  footstepsCertsData = {};
  const pid = uniquePlayerId || explorerName || 'guest';
  try {
    const raw = localStorage.getItem(getFootstepsCertsStorageKey(pid));
    if (raw) {
      const parsed = JSON.parse(raw);
      const keys = _collectOrderedKeys(FOOTSTEPS_CARD_ORDER, parsed);
      keys.forEach(tierId => {
        const entry = parsed && parsed[tierId];
        if (entry && entry.code) {
          footstepsCertsData[tierId] = {
            tierId,
            code: String(entry.code),
            playerName: String(entry.playerName || explorerName || '믿음의용사'),
            issuedAt: String(entry.issuedAt || formatAdventureCertDate()),
            completedCount: Math.max(0, parseInt(entry.completedCount || 0, 10)),
            totalCount: Math.max(1, parseInt(entry.totalCount || 22, 10))
          };
        }
      });
    }
  } catch (e) {}
  return footstepsCertsData;
}

function syncFootstepsMilestonesFromCount(completedCount, totalCount, opts = {}) {
  const count = Math.max(0, parseInt(completedCount || 0, 10));
  const total = Math.max(11, parseInt(totalCount || (typeof window.getMiracleTotalMissionCount === 'function' ? window.getMiracleTotalMissionCount() : 22), 10));
  const todayStr = formatAdventureCertDate();
  const displayName = explorerName || explorerDisplayName || '믿음의용사';
  const newlyAwarded = [];

  FOOTSTEPS_CARD_ORDER.forEach(tierId => {
    const meta = FOOTSTEPS_CARD_META[tierId];
    const req = getFootstepsRequiredCount(tierId, total);
    if (count >= req && !footstepsCertsData[tierId]) {
      footstepsCertsData[tierId] = {
        tierId,
        code: meta.prefix + Math.floor(100 + Math.random() * 900),
        playerName: displayName,
        issuedAt: todayStr,
        completedCount: count,
        totalCount: total
      };
      newlyAwarded.push(tierId);
    }
  });

  if (newlyAwarded.length > 0) {
    saveFootstepsCerts(explorerName);
    if (typeof syncHudMenuInfo === 'function') syncHudMenuInfo();
  }
  return newlyAwarded;
}
window.syncFootstepsMilestonesFromCount = syncFootstepsMilestonesFromCount;

function flushPendingFootstepsCardAward() {
  if (!Array.isArray(pendingFootstepsAwardQueue) || pendingFootstepsAwardQueue.length === 0) {
    return false;
  }
  const blockingIds = [
    'stage-modal',
    'ending-modal',
    'adventure-badges-modal',
    'retry-modal',
    'miracle-notebook-modal',
    'miracle-dialog-overlay',
    'episode-stage-select-modal',
    'ending-map-choice-modal'
  ];
  const isBlocked = blockingIds.some(id => {
    const el = document.getElementById(id);
    return Boolean(el && !el.classList.contains('hidden'));
  });
  if (isBlocked) return false;

  const nextTierId = pendingFootstepsAwardQueue.shift();
  if (!nextTierId || !FOOTSTEPS_CARD_META[nextTierId]) return false;
  showFootstepsCardAwardModal(nextTierId);
  return true;
}
window.flushPendingFootstepsCardAward = flushPendingFootstepsCardAward;

function checkAndQueueFootstepsAwards(completedCount, totalCount, opts = {}) {
  const newlyAwarded = syncFootstepsMilestonesFromCount(completedCount, totalCount, opts);
  if (newlyAwarded.length === 0) return [];
  if (!opts.silent) {
    newlyAwarded.forEach(tierId => {
      if (!pendingFootstepsAwardQueue.includes(tierId)) {
        pendingFootstepsAwardQueue.push(tierId);
      }
    });
    if (!opts.deferPopup) {
      flushPendingFootstepsCardAward();
    }
  }
  return newlyAwarded;
}
window.checkAndQueueFootstepsAwards = checkAndQueueFootstepsAwards;

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
          const isMiracle = (ep === 'miracle');
          playerProgressData[ep].maxClearedStage = Math.max(0, parseInt(parsed[ep].maxClearedStage || 0, 10));
          playerProgressData[ep].completed = isMiracle
            ? Boolean(parsed[ep].completed || parsed[ep].certIssued)
            : Boolean(parsed[ep].completed || playerProgressData[ep].maxClearedStage >= 3);
          playerProgressData[ep].certIssued = isMiracle
            ? Boolean(parsed[ep].certIssued)
            : Boolean(parsed[ep].certIssued || playerProgressData[ep].maxClearedStage >= 4);
          playerProgressData[ep].attempts = Math.max(0, parseInt(parsed[ep].attempts || 0, 10));
        }
      });
    }
  } catch (e) {}
  const prevSuppress = Boolean(window.__suppressProfileSheetSync);
  window.__suppressProfileSheetSync = true;
  try {
    loadAdventureCerts(uniquePlayerId);
    if (typeof loadMiracleNotebookProgress === 'function') {
      loadMiracleNotebookProgress();
    }
  } finally {
    window.__suppressProfileSheetSync = prevSuppress;
  }
}

function saveLocalPlayerProgress(uniquePlayerId) {
  try {
    localStorage.setItem(getLocalProgressStorageKey(uniquePlayerId), JSON.stringify(playerProgressData));
  } catch (e) {}
}

function recordPlayerStageClear(epKey, stageNum, opts = {}) {
  if (!playerProgressData[epKey]) {
    playerProgressData[epKey] = { maxClearedStage: 0, completed: false, certIssued: false, attempts: 0 };
  }
  const wasCompleted = Boolean(playerProgressData[epKey].completed);
  if (stageNum > playerProgressData[epKey].maxClearedStage) {
    playerProgressData[epKey].maxClearedStage = stageNum;
  }
  if (epKey === 'miracle' && opts && opts.fromStageClearModal) {
    // 에피소드 4는 메인 스테이지 4 이후 감람산 승천 완료 시에만 완주·인증서 발급 처리
  } else if (epKey === 'miracle') {
    if (stageNum >= 4) {
      playerProgressData[epKey].completed = true;
      playerProgressData[epKey].certIssued = true;
      upsertEpisodeAdventureCert(epKey, currentMode);
    }
  } else {
    if (stageNum >= 3) {
      playerProgressData[epKey].completed = true;
    }
    if (stageNum >= 4) {
      playerProgressData[epKey].certIssued = true;
      upsertEpisodeAdventureCert(epKey, currentMode);
    }
  }
  if (!wasCompleted && playerProgressData[epKey].completed) {
    const epIdx = EPISODE_ORDER.indexOf(epKey);
    if (epIdx >= 0 && epIdx + 1 < EPISODE_ORDER.length) {
      const nextKey = EPISODE_ORDER[epIdx + 1];
      const nextMeta = EPISODE_META_INFO[nextKey];
      const lockInfo = getEpisodeLockState(nextKey);
      if (nextMeta && !lockInfo.locked && typeof showToast === 'function') {
        showToast(`🔓 다음 에피소드 [${nextMeta.title}]이(가) 월드맵에 열렸어요!`);
      }
    }
  }
  saveLocalPlayerProgress(explorerName);
  updateWorldMapEpisodePinsUI();
  if (!window.__suppressProfileSheetSync && typeof schedulePlayerProfileSheetSync === 'function') {
    schedulePlayerProfileSheetSync('stage_clear', true);
  }
}

// 현재 플레이에서 인증서 출력이 허용되는지 확인
// (월드맵의 엔딩 세상 직접 재진입만 제외하고, 최초 완주 또는 미보유 새 레벨 클리어 시 발급·갱신 허용)
function canShowCertificateForCurrentRun() {
  if (enteredEndingDirectlyFromMap) return false;
  if (!currentRunCanIssueCert) return false;
  const existingCert = adventureCertsData[currentEpisode];
  if (!existingCert) return true;
  const modes = normalizeClearedModesList(existingCert.clearedModes);
  if (MODE_META[currentMode] && !modes.includes(currentMode)) {
    return true;
  }
  return false;
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
          <button type="button" onclick="closeEndingWorldMapChoiceModal(); openAdventureBadgesModal();" class="mc-btn w-full py-2.5 rounded-2xl bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-400 hover:brightness-105 text-amber-950 font-jua text-sm sm:text-base">
            🏅 모험의 증표 카드첩 보기
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
  joyX = 0; joyY = 0; keys = {}; currentMoveSpeed = 0;
  const knobEl = document.getElementById('joystick-knob');
  if (knobEl) knobEl.style.transform = 'translate(0,0)';
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
      descEl.innerHTML = '무지개 언약의 제단에 도착했어요!<br/>월드맵으로 나가거나 뒤편 방주와 새 세상을 계속 둘러볼 수 있어요.';
    } else if (currentEpisode === 'miracle') {
      descEl.innerHTML = '예수님께서 하늘로 승천하신 감람산 자리예요!<br/>오픈월드로 돌아가거나 월드맵 이동, 엔딩 세상 계속 둘러보기를 선택할 수 있어요.';
    } else {
      descEl.innerHTML = '엔딩 제단(왕좌)에 도착했어요!<br/>월드맵으로 이동하거나 엔딩 세상을 자유롭게 더 둘러볼 수 있어요.';
    }
  }

  playSfx('switch');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  syncOverlayModalBodyClass();
}

function closeEndingWorldMapChoiceModal(showLookAroundToast = false) {
  const modal = document.getElementById('ending-map-choice-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
  syncOverlayModalBodyClass();
  if (showLookAroundToast) {
    const landmarkWord = (currentEpisode === 'exodus')
      ? '십계명으로'
      : (currentEpisode === 'miracle' ? '승천 장소로' : '제단으로');
    showToast(`🌈 엔딩 세상을 자유롭게 둘러보세요! (다시 ${landmarkWord} 다가오면 이동 창이 열려요)`);
  }
}

// =========================================================================
// [통합 구글 시트 동기화] 에피소드 진행·인증서 + 탐험수첩 + 발자취 5단계
// =========================================================================
let _profileSyncTimer = null;
let _profileSyncInFlight = false;
let _profileSyncPendingResync = false;

function getProfileSyncMetaKey(uniquePlayerId) {
  return 'bible_profile_sync_meta_v1_' + (uniquePlayerId || 'guest');
}

function loadProfileSyncMeta(uniquePlayerId) {
  const pid = uniquePlayerId || explorerName || 'guest';
  try {
    const raw = localStorage.getItem(getProfileSyncMetaKey(pid));
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        revision: Math.max(0, parseInt(parsed.revision || 0, 10) || 0),
        appliedAdminRev: Math.max(0, parseInt(parsed.appliedAdminRev || 0, 10) || 0),
        lastSyncedAt: String(parsed.lastSyncedAt || '')
      };
    }
  } catch (e) {}
  return { revision: 0, appliedAdminRev: 0, lastSyncedAt: '' };
}

function saveProfileSyncMeta(uniquePlayerId, meta) {
  const pid = uniquePlayerId || explorerName || 'guest';
  try {
    localStorage.setItem(getProfileSyncMetaKey(pid), JSON.stringify({
      revision: Math.max(0, parseInt((meta && meta.revision) || 0, 10) || 0),
      appliedAdminRev: Math.max(0, parseInt((meta && meta.appliedAdminRev) || 0, 10) || 0),
      lastSyncedAt: String((meta && meta.lastSyncedAt) || '')
    }));
  } catch (e) {}
}

function _readNotebookStateForProfile(pid) {
  if (typeof window.exportMiracleNotebookState === 'function') {
    return window.exportMiracleNotebookState();
  }
  const fallback = {
    collected: [],
    completedMissions: [],
    clearedStages: { 1: false, 2: false, 3: false, 4: false },
    postResurrection: false,
    ascensionSeen: false
  };
  try {
    const raw = localStorage.getItem('bible_ep4_notebook_' + (pid || 'guest'));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        fallback.collected = parsed.filter(Boolean).map(String);
      } else if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.collected)) fallback.collected = parsed.collected.filter(Boolean).map(String);
        if (Array.isArray(parsed.completedMissions)) fallback.completedMissions = parsed.completedMissions.filter(Boolean).map(String);
        if (parsed.clearedStages && typeof parsed.clearedStages === 'object') {
          [1, 2, 3, 4].forEach(n => { fallback.clearedStages[n] = Boolean(parsed.clearedStages[n]); });
        }
        fallback.postResurrection = Boolean(parsed.postResurrection);
        fallback.ascensionSeen = Boolean(parsed.ascensionSeen);
      }
    }
  } catch (e) {}
  return fallback;
}

function buildPlayerProfileSnapshot(uniquePlayerId) {
  const pid = String(uniquePlayerId || explorerName || '').trim();
  const meta = loadProfileSyncMeta(pid);
  const progressCopy = {};
  _collectOrderedKeys(EPISODE_ORDER, playerProgressData).forEach(ep => {
    const p = (playerProgressData && playerProgressData[ep]) || {};
    progressCopy[ep] = {
      maxClearedStage: Math.max(0, parseInt(p.maxClearedStage || 0, 10) || 0),
      completed: Boolean(p.completed),
      certIssued: Boolean(p.certIssued),
      attempts: Math.max(0, parseInt(p.attempts || 0, 10) || 0)
    };
  });
  const certsCopy = {};
  _collectOrderedKeys(EPISODE_ORDER, adventureCertsData).forEach(ep => {
    const c = adventureCertsData && adventureCertsData[ep];
    if (c && c.code) {
      certsCopy[ep] = {
        epId: ep,
        code: String(c.code),
        playerName: String(c.playerName || pid),
        issuedAt: String(c.issuedAt || formatAdventureCertDate()),
        updatedAt: String(c.updatedAt || c.issuedAt || formatAdventureCertDate()),
        clearedModes: normalizeClearedModesList(c.clearedModes)
      };
    }
  });
  const footstepsCopy = {};
  _collectOrderedKeys(FOOTSTEPS_CARD_ORDER, footstepsCertsData).forEach(tierId => {
    const f = footstepsCertsData && footstepsCertsData[tierId];
    if (f && f.code) {
      footstepsCopy[tierId] = {
        tierId,
        code: String(f.code),
        playerName: String(f.playerName || pid),
        issuedAt: String(f.issuedAt || formatAdventureCertDate()),
        completedCount: Math.max(0, parseInt(f.completedCount || 0, 10) || 0),
        totalCount: Math.max(1, parseInt(f.totalCount || 22, 10) || 22)
      };
    }
  });
  const notebookState = _readNotebookStateForProfile(pid);
  return {
    playerId: pid,
    updatedAt: typeof getKoreanNowTimestamp === 'function' ? getKoreanNowTimestamp() : new Date().toISOString(),
    revision: meta.revision,
    adminOverrideRev: meta.appliedAdminRev,
    lastModifiedBy: 'player',
    episodes: {
      progress: progressCopy,
      certs: certsCopy
    },
    notebook: notebookState,
    footsteps: footstepsCopy
  };
}
window.buildPlayerProfileSnapshot = buildPlayerProfileSnapshot;

function applyServerPlayerProfile(serverProfile) {
  if (!serverProfile || typeof serverProfile !== 'object') {
    return { mode: 'none', localHadExtra: false };
  }
  const pid = String(explorerName || serverProfile.playerId || '').trim() || 'guest';
  const localMeta = loadProfileSyncMeta(pid);
  const serverRev = Math.max(0, parseInt(serverProfile.revision || 0, 10) || 0);
  const serverAdminRev = Math.max(0, parseInt(serverProfile.adminOverrideRev || 0, 10) || 0);
  const isAdminOverwrite = serverAdminRev > localMeta.appliedAdminRev;
  let localHadExtra = false;

  const sEp = serverProfile.episodes || {};
  const sProg = sEp.progress || {};
  const sCerts = sEp.certs || {};
  const sNotebook = serverProfile.notebook || {};
  const sFootsteps = serverProfile.footsteps || {};

  window.__suppressProfileSheetSync = true;
  try {
    if (isAdminOverwrite) {
      playerProgressData = {
        noah:    { maxClearedStage: 0, completed: false, certIssued: false, attempts: 0 },
        exodus:  { maxClearedStage: 0, completed: false, certIssued: false, attempts: 0 },
        david:   { maxClearedStage: 0, completed: false, certIssued: false, attempts: 0 },
        miracle: { maxClearedStage: 0, completed: false, certIssued: false, attempts: 0 }
      };
      _collectOrderedKeys(EPISODE_ORDER, sProg).forEach(ep => {
        const sp = sProg[ep];
        if (sp) {
          const isMiracle = (ep === 'miracle');
          const mc = Math.max(0, parseInt(sp.maxClearedStage || 0, 10) || 0);
          playerProgressData[ep] = {
            maxClearedStage: mc,
            completed: isMiracle ? Boolean(sp.completed || sp.certIssued) : Boolean(sp.completed || mc >= 3),
            certIssued: isMiracle ? Boolean(sp.certIssued) : Boolean(sp.certIssued || mc >= 4),
            attempts: Math.max(0, parseInt(sp.attempts || 0, 10) || 0)
          };
        }
      });

      adventureCertsData = {};
      _collectOrderedKeys(EPISODE_ORDER, sCerts).forEach(ep => {
        const sc = sCerts[ep];
        if (sc && sc.code) {
          adventureCertsData[ep] = {
            epId: ep,
            code: String(sc.code),
            playerName: String(sc.playerName || pid),
            issuedAt: String(sc.issuedAt || formatAdventureCertDate()),
            updatedAt: String(sc.updatedAt || sc.issuedAt || formatAdventureCertDate()),
            clearedModes: normalizeClearedModesList(sc.clearedModes)
          };
        }
      });

      footstepsCertsData = {};
      _collectOrderedKeys(FOOTSTEPS_CARD_ORDER, sFootsteps).forEach(tierId => {
        const sf = sFootsteps[tierId];
        if (sf && sf.code) {
          footstepsCertsData[tierId] = {
            tierId,
            code: String(sf.code),
            playerName: String(sf.playerName || pid),
            issuedAt: String(sf.issuedAt || formatAdventureCertDate()),
            completedCount: Math.max(0, parseInt(sf.completedCount || 0, 10) || 0),
            totalCount: Math.max(1, parseInt(sf.totalCount || 22, 10) || 22)
          };
        }
      });

      if (typeof window.applyMiracleNotebookState === 'function') {
        window.applyMiracleNotebookState(sNotebook, 'overwrite');
      } else {
        try {
          localStorage.setItem('bible_ep4_notebook_' + pid, JSON.stringify({
            collected: Array.isArray(sNotebook.collected) ? sNotebook.collected : [],
            completedMissions: Array.isArray(sNotebook.completedMissions) ? sNotebook.completedMissions : [],
            clearedStages: sNotebook.clearedStages || { 1: false, 2: false, 3: false, 4: false },
            postResurrection: Boolean(sNotebook.postResurrection),
            ascensionSeen: Boolean(sNotebook.ascensionSeen)
          }));
        } catch (e) {}
      }
    } else {
      // 기기 간 일반 접속: 합집합(Union) 병합
      _collectOrderedKeys(EPISODE_ORDER, playerProgressData, sProg, adventureCertsData, sCerts).forEach(ep => {
        const lp = playerProgressData[ep] || { maxClearedStage: 0, completed: false, certIssued: false, attempts: 0 };
        const sp = sProg[ep] || { maxClearedStage: 0, completed: false, certIssued: false, attempts: 0 };
        const lMax = Math.max(0, parseInt(lp.maxClearedStage || 0, 10) || 0);
        const sMax = Math.max(0, parseInt(sp.maxClearedStage || 0, 10) || 0);
        if (lMax > sMax || (lp.completed && !sp.completed) || (lp.certIssued && !sp.certIssued)) {
          localHadExtra = true;
        }
        const isMiracle = (ep === 'miracle');
        const mergedMax = Math.max(lMax, sMax);
        playerProgressData[ep] = {
          maxClearedStage: mergedMax,
          completed: isMiracle
            ? Boolean(lp.completed || sp.completed || lp.certIssued || sp.certIssued)
            : Boolean(lp.completed || sp.completed || mergedMax >= 3),
          certIssued: isMiracle
            ? Boolean(lp.certIssued || sp.certIssued)
            : Boolean(lp.certIssued || sp.certIssued || mergedMax >= 4),
          attempts: Math.max(parseInt(lp.attempts || 0, 10) || 0, parseInt(sp.attempts || 0, 10) || 0)
        };

        const lc = adventureCertsData[ep];
        const sc = sCerts[ep];
        if (lc && !sc) localHadExtra = true;
        if (sc && sc.code) {
          const lModes = lc ? normalizeClearedModesList(lc.clearedModes) : [];
          const sModes = normalizeClearedModesList(sc.clearedModes);
          if (lModes.some(m => !sModes.includes(m))) localHadExtra = true;
          const mergedModes = normalizeClearedModesList(lModes.concat(sModes));
          adventureCertsData[ep] = {
            epId: ep,
            code: (lc && lc.code && lc.code !== '-') ? String(lc.code) : String(sc.code),
            playerName: String((lc && lc.playerName) || sc.playerName || pid),
            issuedAt: String((lc && lc.issuedAt) || sc.issuedAt || formatAdventureCertDate()),
            updatedAt: String(sc.updatedAt || (lc && lc.updatedAt) || formatAdventureCertDate()),
            clearedModes: mergedModes
          };
        }
      });

      _collectOrderedKeys(FOOTSTEPS_CARD_ORDER, footstepsCertsData, sFootsteps).forEach(tierId => {
        const lf = footstepsCertsData[tierId];
        const sf = sFootsteps[tierId];
        if (lf && !sf) localHadExtra = true;
        if (sf && sf.code && !lf) {
          footstepsCertsData[tierId] = {
            tierId,
            code: String(sf.code),
            playerName: String(sf.playerName || pid),
            issuedAt: String(sf.issuedAt || formatAdventureCertDate()),
            completedCount: Math.max(0, parseInt(sf.completedCount || 0, 10) || 0),
            totalCount: Math.max(1, parseInt(sf.totalCount || 22, 10) || 22)
          };
        }
      });

      const localNb = _readNotebookStateForProfile(pid);
      const sCollectedSet = new Set(Array.isArray(sNotebook.collected) ? sNotebook.collected.map(String) : []);
      const sMissionsSet = new Set(Array.isArray(sNotebook.completedMissions) ? sNotebook.completedMissions.map(String) : []);
      if (localNb.collected.some(id => !sCollectedSet.has(id))) localHadExtra = true;
      if (localNb.completedMissions.some(id => !sMissionsSet.has(id))) localHadExtra = true;
      if ((localNb.postResurrection && !sNotebook.postResurrection) || (localNb.ascensionSeen && !sNotebook.ascensionSeen)) {
        localHadExtra = true;
      }

      if (typeof window.applyMiracleNotebookState === 'function') {
        window.applyMiracleNotebookState(sNotebook, 'merge');
      } else {
        try {
          const mergedCollected = Array.from(new Set([...localNb.collected, ...Array.from(sCollectedSet)]));
          const mergedMissions = Array.from(new Set([...localNb.completedMissions, ...Array.from(sMissionsSet)]));
          const mergedStages = {};
          [1, 2, 3, 4].forEach(n => {
            mergedStages[n] = Boolean((localNb.clearedStages && localNb.clearedStages[n]) || (sNotebook.clearedStages && sNotebook.clearedStages[n]));
          });
          localStorage.setItem('bible_ep4_notebook_' + pid, JSON.stringify({
            collected: mergedCollected,
            completedMissions: mergedMissions,
            clearedStages: mergedStages,
            postResurrection: Boolean(localNb.postResurrection || sNotebook.postResurrection),
            ascensionSeen: Boolean(localNb.ascensionSeen || sNotebook.ascensionSeen)
          }));
        } catch (e) {}
      }
    }

    saveLocalPlayerProgress(pid);
    saveAdventureCerts(pid);
    saveFootstepsCerts(pid);
  } finally {
    window.__suppressProfileSheetSync = false;
  }

  saveProfileSyncMeta(pid, {
    revision: serverRev,
    appliedAdminRev: Math.max(localMeta.appliedAdminRev, serverAdminRev),
    lastSyncedAt: typeof getKoreanNowTimestamp === 'function' ? getKoreanNowTimestamp() : ''
  });

  if (typeof updateWorldMapEpisodePinsUI === 'function') updateWorldMapEpisodePinsUI();
  if (typeof syncHudMenuInfo === 'function') syncHudMenuInfo();
  if (typeof updateMiracleNotebookHudBadge === 'function') updateMiracleNotebookHudBadge();
  if (playerProgressData.miracle && (playerProgressData.miracle.completed || playerProgressData.miracle.certIssued)) {
    if (typeof markEp4EndingCompletedForLogo === 'function') markEp4EndingCompletedForLogo(pid);
  }

  return { mode: isAdminOverwrite ? 'overwrite' : 'merge', localHadExtra };
}
window.applyServerPlayerProfile = applyServerPlayerProfile;

async function flushPlayerProfileSheetSync(reason = 'auto', opts = {}) {
  if (typeof GOOGLE_SHEET_WEBAPP_URL === 'undefined' || !GOOGLE_SHEET_WEBAPP_URL || GOOGLE_SHEET_WEBAPP_URL.includes('여기에_')) {
    return;
  }
  const pid = String(explorerName || '').trim();
  if (!pid || pid === 'guest' || window.__suppressProfileSheetSync) return;

  if (_profileSyncInFlight && !opts.keepalive) {
    _profileSyncPendingResync = true;
    return;
  }

  _profileSyncInFlight = true;
  try {
    const snapshot = buildPlayerProfileSnapshot(pid);
    const meta = loadProfileSyncMeta(pid);
    const bodyStr = JSON.stringify({
      action: 'sync_profile',
      reason,
      time: snapshot.updatedAt,
      playerId: pid,
      appliedAdminRev: meta.appliedAdminRev,
      profile: snapshot
    });
    const res = await fetch(GOOGLE_SHEET_WEBAPP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: bodyStr,
      keepalive: Boolean(opts.keepalive)
    });
    const txt = await res.text();
    try {
      const data = JSON.parse(txt);
      if (data && data.adminOverride && data.profile) {
        applyServerPlayerProfile(data.profile);
      } else if (data && data.ok && typeof data.revision === 'number') {
        saveProfileSyncMeta(pid, {
          revision: data.revision,
          appliedAdminRev: Math.max(meta.appliedAdminRev, parseInt(data.adminOverrideRev || 0, 10) || 0),
          lastSyncedAt: snapshot.updatedAt
        });
      }
    } catch (e) {}
  } catch (e) {
  } finally {
    _profileSyncInFlight = false;
    if (_profileSyncPendingResync) {
      _profileSyncPendingResync = false;
      schedulePlayerProfileSheetSync('queued_resync', false);
    }
  }
}

function schedulePlayerProfileSheetSync(reason = 'auto', immediate = false) {
  if (typeof GOOGLE_SHEET_WEBAPP_URL === 'undefined' || !GOOGLE_SHEET_WEBAPP_URL || GOOGLE_SHEET_WEBAPP_URL.includes('여기에_')) {
    return;
  }
  const pid = String(explorerName || '').trim();
  if (!pid || pid === 'guest' || window.__suppressProfileSheetSync) return;

  if (_profileSyncTimer) {
    clearTimeout(_profileSyncTimer);
    _profileSyncTimer = null;
  }
  if (immediate) {
    flushPlayerProfileSheetSync(reason, { keepalive: reason === 'pagehide' || reason === 'exit' || reason === 'hidden' });
    return;
  }
  _profileSyncTimer = setTimeout(() => {
    _profileSyncTimer = null;
    flushPlayerProfileSheetSync(reason, { keepalive: false });
  }, 1500);
}
window.schedulePlayerProfileSheetSync = schedulePlayerProfileSheetSync;

if (typeof window !== 'undefined' && !window.__profileSyncLifecycleBound) {
  window.__profileSyncLifecycleBound = true;
  window.addEventListener('pagehide', () => {
    if (typeof explorerName !== 'undefined' && explorerName) {
      schedulePlayerProfileSheetSync('pagehide', true);
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && typeof explorerName !== 'undefined' && explorerName) {
      schedulePlayerProfileSheetSync('hidden', true);
    }
  });
}

async function syncPlayerProgressFromSheet() {
  loadLocalPlayerProgress(explorerName);
  updateWorldMapEpisodePinsUI();

  if (typeof GOOGLE_SHEET_WEBAPP_URL === 'undefined' || !GOOGLE_SHEET_WEBAPP_URL || GOOGLE_SHEET_WEBAPP_URL.includes('여기에_')) {
    return;
  }

  try {
    const pid = String(explorerName || '').trim();
    const targetId = pid.toLowerCase();
    if (!targetId) return;

    const querySep = GOOGLE_SHEET_WEBAPP_URL.includes('?') ? '&' : '?';
    const url = `${GOOGLE_SHEET_WEBAPP_URL}${querySep}mode=player&name=${encodeURIComponent(pid)}`;
    const res = await fetch(url, { redirect: 'follow' });
    const data = await res.json();

    let mergeResult = { mode: 'none', localHadExtra: false };
    let adminHasOverridden = false;
    if (data && data.profile && typeof data.profile === 'object') {
      mergeResult = applyServerPlayerProfile(data.profile);
      adminHasOverridden = Number(data.profile.adminOverrideRev || 0) > 0;
    }

    const list = (data && data.list) ? data.list : [];
    let updated = false;
    const sheetAttemptCounts = { noah: 0, exodus: 0, david: 0, miracle: 0 };

    if (!adminHasOverridden) {
      window.__suppressProfileSheetSync = true;
      try {
        list.forEach(row => {
          const rowName = String(row.name || '').trim().toLowerCase();
          if (rowName !== targetId) return;

          const ep = String(row.episode || 'noah').trim();
          if (!playerProgressData[ep]) return;

          const statusStr = String(row.status || '');
          const stNum = parseInt(row.stage || 0, 10);
          const certStr = String(row.certCode || '-').trim();
          const rowModeKey = mapModeTextToKey(row.mode || row.dept || row.level || '');

          if (statusStr.includes('게임시작') || statusStr.includes('재도전') || statusStr.includes('바로진입')) {
            sheetAttemptCounts[ep] = (sheetAttemptCounts[ep] || 0) + 1;
          }

          const isCertOrEndingRow =
            statusStr.includes('완주') ||
            (certStr !== '-' && certStr.length >= 4) ||
            (ep !== 'miracle' && stNum >= 4);

          if (isCertOrEndingRow) {
            if (playerProgressData[ep].maxClearedStage < 4 || !playerProgressData[ep].completed || !playerProgressData[ep].certIssued) {
              playerProgressData[ep].maxClearedStage = 4;
              playerProgressData[ep].completed = true;
              playerProgressData[ep].certIssued = true;
              updated = true;
            }
            upsertEpisodeAdventureCert(ep, rowModeKey || currentMode || 'junior', certStr);
          } else if (statusStr.includes('클리어') && stNum >= 1 && stNum <= 4) {
            if (stNum > playerProgressData[ep].maxClearedStage) {
              playerProgressData[ep].maxClearedStage = stNum;
              updated = true;
            }
            if (ep !== 'miracle' && stNum >= 3 && !playerProgressData[ep].completed) {
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
        if (playerProgressData.miracle && (playerProgressData.miracle.completed || playerProgressData.miracle.certIssued)) {
          if (typeof markEp4EndingCompletedForLogo === 'function') {
            markEp4EndingCompletedForLogo(explorerName);
          }
        }
      } finally {
        window.__suppressProfileSheetSync = false;
      }
    }

    if (data && data.profileSupported && (!data.profile || mergeResult.localHadExtra || updated)) {
      schedulePlayerProfileSheetSync('initial_backfill', false);
    }
  } catch (e) {}
}

function isEpisodeClearedForUnlock(epKey) {
  const prog = playerProgressData && playerProgressData[epKey];
  const cert = adventureCertsData && adventureCertsData[epKey];
  if (cert && cert.code) return true;
  if (!prog) return false;
  if (prog.completed || prog.certIssued) return true;
  return epKey !== 'miracle' && (prog.maxClearedStage || 0) >= 3;
}

function getEpisodeLockState(epKey) {
  if (EPISODE_MASTER_ADMIN_LOCK && EPISODE_MASTER_ADMIN_LOCK[epKey]) {
    return {
      locked: true,
      reason: 'admin_lock',
      message: '🔒 아직 오픈 준비 중인 에피소드예요! 곧 열릴 예정입니다.'
    };
  }
  const idx = EPISODE_ORDER.indexOf(epKey);
  if (idx <= 0) {
    return { locked: false, reason: 'unlocked', message: '' };
  }
  const prevKey = EPISODE_ORDER[idx - 1];
  if (!isEpisodeClearedForUnlock(prevKey)) {
    const prevMeta = EPISODE_META_INFO[prevKey] || { num: idx, title: prevKey };
    return {
      locked: true,
      reason: 'prev_not_cleared',
      message: `🔒 먼저 에피소드 ${prevMeta.num} [${prevMeta.title}]을(를) 클리어해야 열려요!`
    };
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
    const isEpCleared = isEpisodeClearedForUnlock(epKey);

    if (lockState.locked) {
      if (lockState.reason === 'prev_not_cleared') {
        badgeEl.className = 'inline-block px-1.5 py-0.2 rounded bg-amber-600 text-white font-jua text-[8px] sm:text-[9px] leading-tight';
        badgeEl.textContent = `EP ${meta.num} · 🔒이전단계필요`;
      } else {
        badgeEl.className = 'inline-block px-1.5 py-0.2 rounded bg-slate-600 text-white font-jua text-[8px] sm:text-[9px] leading-tight';
        badgeEl.textContent = `EP ${meta.num} · 🔒잠김`;
      }
      if (pinEl && epKey !== 'noah') {
        pinEl.classList.remove('opacity-92');
        pinEl.classList.add('opacity-75');
      }
    } else {
      if (pinEl) {
        pinEl.classList.remove('opacity-92', 'opacity-75');
      }
      if (isEpCleared) {
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

window.HIDDEN_STAGE_LAUNCHERS = window.HIDDEN_STAGE_LAUNCHERS || {};
function isAllEpisodesThroughEp4Completed() {
  if (typeof isEpisodeClearedForUnlock === 'function') {
    if (isEpisodeClearedForUnlock('miracle')) return true;
  } else {
    const prog = (typeof playerProgressData !== 'undefined' && playerProgressData) ? playerProgressData.miracle : null;
    const cert = (typeof adventureCertsData !== 'undefined' && adventureCertsData) ? adventureCertsData.miracle : null;
    if ((cert && cert.code) || (prog && (prog.completed || prog.certIssued))) return true;
  }
  if (typeof miracleAscensionSeen !== 'undefined' && miracleAscensionSeen) return true;
  if (typeof isMiracleAllStagesUnlocked === 'function' && isMiracleAllStagesUnlocked()) return true;
  return false;
}
function openEpisodeHiddenStage(epKey) {
  const launcher = window.HIDDEN_STAGE_LAUNCHERS && window.HIDDEN_STAGE_LAUNCHERS[epKey];
  if (typeof launcher === 'function') {
    closeEpisodeStageSelectModal();
    launcher();
    return;
  }
  const meta = EPISODE_META_INFO[epKey] || { num: 1, title: '성경 탐험' };
  playSfx('switch');
  showToast(`✨ 에피소드 ${meta.num} 숨겨진 스테이지는 곧 업데이트될 예정이에요!`);
}
function appendEpisodeHiddenStageButton(btnsEl, epKey) {
  if (!btnsEl || !isAllEpisodesThroughEp4Completed()) return;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'stage-select-hidden-btn mc-btn w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white border border-amber-300/60 font-jua text-sm flex items-center justify-between';
  btn.innerHTML = `
    <span>✨ 숨겨진 스테이지</span>
    <span class="text-xs px-2 py-0.5 rounded-full bg-amber-300 text-slate-950">🚧 준비 중</span>
  `;
  btn.onclick = () => openEpisodeHiddenStage(epKey);
  btnsEl.appendChild(btn);
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
  const allMiracleUnlocked = Boolean(
    epKey === 'miracle' &&
    (prog.completed || prog.certIssued || (typeof miracleAscensionSeen !== 'undefined' && miracleAscensionSeen))
  );
  const maxSelectableStage = (prog.completed || prog.certIssued)
    ? 4
    : Math.min(3, (prog.maxClearedStage || 0) + 1);

  if (iconEl) iconEl.textContent = meta.icon;
  if (titleEl) titleEl.textContent = `에피소드 ${meta.num} : ${meta.title}`;
  if (descEl) {
    descEl.textContent = (epKey === 'miracle' && allMiracleUnlocked)
      ? `${explorerDisplayName || explorerName} 대원님! 2회차 자유 모드가 열렸어요. 오픈월드와 모든 스테이지를 자유롭게 선택하세요!`
      : `${explorerDisplayName || explorerName} 대원님이 클리어한 스테이지를 선택해 바로 출발하세요!`;
  }

  btnsEl.innerHTML = '';
  if (epKey === 'miracle') {
    const nightStormCleared = Boolean(
      (typeof miracleCollectedIds !== 'undefined' && miracleCollectedIds && typeof miracleCollectedIds.has === 'function' && miracleCollectedIds.has('mir_storm')) ||
      allMiracleUnlocked
    );
    const miracleItems = [
      { id: 'openworld', label: '🌿 오픈월드 탐험 시작', stageNum: 0, isEnding: false, unlocked: true, cleared: allMiracleUnlocked },
      { id: 'main1_galilee', label: '⛵ 스테이지 1 : 깊은 곳으로!', stageNum: 1, isEnding: false, unlocked: true, cleared: (prog.maxClearedStage >= 1) || allMiracleUnlocked },
      { id: 'main1_storm_night', label: '🌙 스테이지 1 (야간) : 갈릴리 밤 풍랑', stageNum: 1, isEnding: false, isNightVariant: true, unlocked: true, cleared: nightStormCleared },
      { id: 'main2_loaves', label: '🐟 스테이지 2 : 오병이어의 기적', stageNum: 2, isEnding: false, unlocked: allMiracleUnlocked || (prog.maxClearedStage >= 1), cleared: (prog.maxClearedStage >= 2) || allMiracleUnlocked },
      { id: 'main3_cross', label: '✝️ 스테이지 3 : 십자가의 길', stageNum: 3, isEnding: false, unlocked: allMiracleUnlocked || (prog.maxClearedStage >= 2), cleared: (prog.maxClearedStage >= 3) || allMiracleUnlocked },
      { id: 'main4_tomb', label: '🌅 스테이지 4 : 빈 무덤 부활', stageNum: 4, isEnding: false, unlocked: allMiracleUnlocked || (prog.maxClearedStage >= 3), cleared: (prog.maxClearedStage >= 4) || allMiracleUnlocked },
      { id: 'ascension', label: '☁️ 엔딩 세상 : 감람산 승천', stageNum: 5, isEnding: true, unlocked: allMiracleUnlocked || prog.completed, cleared: prog.completed || allMiracleUnlocked }
    ];
    miracleItems.forEach((item) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      if (item.unlocked) {
        btn.className = item.isEnding
          ? 'mc-btn w-full py-2 px-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-jua text-sm flex items-center justify-between'
          : (item.id === 'openworld'
            ? 'mc-btn w-full py-2 px-4 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-jua text-sm flex items-center justify-between'
            : (item.isNightVariant
              ? 'mc-btn w-full py-2 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-jua text-sm flex items-center justify-between'
              : 'mc-btn w-full py-2 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-jua text-sm flex items-center justify-between'));
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
    appendEpisodeHiddenStageButton(btnsEl, epKey);
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
    const isUnlocked = st <= maxSelectableStage;
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
  appendEpisodeHiddenStageButton(btnsEl, epKey);

  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

let pausedGameSession = { active: false };
window.pausedGameSession = pausedGameSession;

function updateMapReturnButtonVisibility() {
  const btn = document.getElementById('map-return-game-btn');
  if (!btn) return;
  btn.classList.toggle('hidden', !pausedGameSession.active);
}
window.updateMapReturnButtonVisibility = updateMapReturnButtonVisibility;

function discardPausedGameSession(runPluginCleanup = true) {
  const wasActive = Boolean(pausedGameSession.active);
  const wasMp = Boolean(pausedGameSession.wasMultiplayer);
  const prevEpisode = pausedGameSession.episode;
  pausedGameSession.active = false;
  pausedGameSession.episode = null;
  pausedGameSession.wasMultiplayer = false;
  updateMapReturnButtonVisibility();

  const labelsEl = document.getElementById('labels-container');
  if (labelsEl) labelsEl.style.visibility = '';

  if (wasActive && runPluginCleanup) {
    const epPlugin = (prevEpisode && EPISODE_REGISTRY[prevEpisode]) ? EPISODE_REGISTRY[prevEpisode] : getActiveEpisodePlugin();
    if (epPlugin && typeof epPlugin.onCloseScreen === 'function') epPlugin.onCloseScreen();
    if (wasMp && window.MiracleMultiplayer && typeof window.MiracleMultiplayer.leaveRoom === 'function') {
      window.MiracleMultiplayer.leaveRoom();
    }
  }
}
window.discardPausedGameSession = discardPausedGameSession;

function openWorldMapFromGame() {
  setHudMenuOpen(false);
  closeUiTutorial(false);
  hideMissionGuideBubbleImmediately();

  const hudTop = document.getElementById('hud-top');
  const inGameHudVisible = Boolean(hudTop && !hudTop.classList.contains('hidden'));
  const hasBlockingCutscene = Boolean(
    (currentEpisode === 'exodus' && stage2CountdownActive) ||
    (currentEpisode === 'noah' && doveCutscene.active) ||
    (currentEpisode === 'exodus' && (pillarCutscene.active || seaPartingCutscene.active || sinaiCutscene.active)) ||
    (currentEpisode === 'david' && (
      (typeof davidOpeningState !== 'undefined' && davidOpeningState && davidOpeningState.active) ||
      (typeof davidStage2Dialogue !== 'undefined' && davidStage2Dialogue && davidStage2Dialogue.active) ||
      (typeof davidAnointCutscene !== 'undefined' && davidAnointCutscene && davidAnointCutscene.active) ||
      (typeof davidStage2Cutscene !== 'undefined' && davidStage2Cutscene && davidStage2Cutscene.active) ||
      (typeof davidStage3Cutscene !== 'undefined' && davidStage3Cutscene && davidStage3Cutscene.active)
    )) ||
    (currentEpisode === 'miracle' && (
      (typeof miracleStageCutscene !== 'undefined' && miracleStageCutscene && miracleStageCutscene.active) ||
      window.__ep4OpeningVideoActive ||
      (window.miracleOpenWorldIntroFlyover && window.miracleOpenWorldIntroFlyover.active)
    ))
  );

  // 진행 중인 실제 플레이가 아니거나 컷신/오프닝 중이면 기본 월드맵 전환 사용
  if (!inGameHudVisible || hasBlockingCutscene) {
    openScreen('screen-map');
    return;
  }

  // 열려 있던 인게임 팝업/대화창/조준창은 안전하게 닫고 상태 보존
  if (typeof window.closeDavidAimOverlay === 'function') window.closeDavidAimOverlay();
  const davidDlg = document.getElementById('david-npc-dialog');
  if (davidDlg) davidDlg.classList.add('hidden');
  if (typeof davidDialogTargetNpc !== 'undefined') davidDialogTargetNpc = null;
  if (typeof window.closeMiracleNotebookModal === 'function') window.closeMiracleNotebookModal();
  const mDlgOv = document.getElementById('miracle-dialog-overlay');
  if (mDlgOv) mDlgOv.classList.add('hidden');
  const mDlg = document.getElementById('miracle-dialog-modal');
  if (mDlg) mDlg.classList.add('hidden');
  if (typeof miracleDialogState !== 'undefined' && miracleDialogState) miracleDialogState.active = false;

  const isElVisible = (id) => {
    const el = document.getElementById(id);
    return Boolean(el && !el.classList.contains('hidden'));
  };

  pausedGameSession = {
    active: true,
    episode: currentEpisode,
    stage: currentStage,
    mode: currentMode,
    wasPlaying: isPlaying,
    wasTimeAttackActive: isTimeAttackActive,
    wasMultiplayer: Boolean(window.isMiracleMultiplayerMode),
    playerPos: playerPos.clone(),
    playerFacing,
    cameraYaw,
    cameraTargetYaw,
    miracleActiveFieldInfo: MiracleGuideUI.activeFieldInfo ? Object.assign({}, MiracleGuideUI.activeFieldInfo) : null,
    miracleActiveStageInfo: MiracleGuideUI.activeStageInfo ? Object.assign({}, MiracleGuideUI.activeStageInfo) : null,
    vis: {
      timerBox: isElVisible('hud-timer-box'),
      blockBox: isElVisible('hud-block-box'),
      certBtn: isElVisible('cert-open-btn'),
      puzzleBtn: isElVisible('puzzle-build-btn'),
      contextBtn: isElVisible('context-action-btn'),
      miracleLeft: isElVisible('miracle-hud-left'),
      miracleS1: isElVisible('miracle-s1-ui'),
      miracleSower: isElVisible('miracle-sower-btn-wrap'),
      miracleBreakfast: isElVisible('miracle-breakfast-ui'),
      miracleZacchaeus: isElVisible('miracle-zacchaeus-ui'),
      miracleZacDrag: isElVisible('miracle-zac-drag-layer'),
      miracleMiniNav: isElVisible('miracle-mini-nav'),
      davidSt1Panel: isElVisible('david-st1-panel'),
      davidSt3Tracker: isElVisible('david-st3-quest-tracker'),
      mpOnlineBadge: isElVisible('mp-online-badge'),
      mpHud: isElVisible('miracle-mp-hud'),
      mpHarvest: isElVisible('mp-harvest-btn-wrap')
    }
  };
  window.pausedGameSession = pausedGameSession;

  // 게임 진행 및 타이머 일시정지 (3D 월드와 오브젝트 상태는 그대로 유지!)
  isPlaying = false;
  isTimeAttackActive = false;
  joyX = 0; joyY = 0; keys = {}; currentMoveSpeed = 0;

  if (typeof window.stopMiracleOpenWorldOgg === 'function') {
    window.stopMiracleOpenWorldOgg(false);
  }
  stopStageBgm();

  // 인게임 HUD 및 3D 라벨 임시 숨김
  hudTop.classList.add('hidden');
  document.getElementById('joystick-zone').style.display = 'none';
  document.getElementById('cam-bottom-bar').style.display = 'none';
  document.getElementById('action-zone').style.display = 'none';
  const labelsEl = document.getElementById('labels-container');
  if (labelsEl) labelsEl.style.visibility = 'hidden';

  [
    'miracle-hud-left', 'miracle-time-anchor', 'miracle-s1-ui', 'miracle-sower-btn-wrap', 'miracle-breakfast-ui',
    'miracle-zacchaeus-ui', 'miracle-zac-drag-layer',
    'david-st1-panel', 'david-st3-quest-tracker',
    'mp-online-badge', 'miracle-mp-hud', 'mp-harvest-btn-wrap', 'mp-local-bubble'
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });
  if (typeof window.setMiracleTimeExpanded === 'function') window.setMiracleTimeExpanded(false);

  // 월드맵 화면 표시 & [◀ 돌아가기] 버튼 활성화
  ['screen-opening', 'screen-class', 'screen-map'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (id === 'screen-map') { el.classList.remove('hidden'); el.classList.add('flex'); }
    else { el.classList.add('hidden'); el.classList.remove('flex'); }
  });
  closeEpisodeStageSelectModal();
  closeEndingWorldMapChoiceModal();
  const mapBadge = document.getElementById('map-selected-badge');
  if (mapBadge && MODE_META[currentMode]) {
    mapBadge.textContent = `${MODE_META[currentMode].badge} · ${explorerDisplayName || explorerName}`;
  }
  updateWorldMapEpisodePinsUI();
  updateMapReturnButtonVisibility();
  if (typeof schedulePlayerProfileSheetSync === 'function') {
    schedulePlayerProfileSheetSync('worldmap', true);
  }
  playSfx('switch');
  startMenuAdventureBgm();
}
window.openWorldMapFromGame = openWorldMapFromGame;

function resumeGameFromWorldMap() {
  if (!pausedGameSession || !pausedGameSession.active) return;
  const snap = pausedGameSession;
  pausedGameSession = { active: false };
  window.pausedGameSession = pausedGameSession;
  updateMapReturnButtonVisibility();

  // 월드맵 및 관련 모달 숨김
  ['screen-opening', 'screen-class', 'screen-map'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.classList.add('hidden'); el.classList.remove('flex'); }
  });
  closeEpisodeStageSelectModal();
  closeEndingWorldMapChoiceModal();

  // HUD 및 3D 라벨 복원
  const labelsEl = document.getElementById('labels-container');
  if (labelsEl) labelsEl.style.visibility = '';
  const hudTop = document.getElementById('hud-top');
  if (hudTop) hudTop.classList.remove('hidden');
  document.getElementById('joystick-zone').style.display = 'block';
  document.getElementById('cam-bottom-bar').style.display = 'flex';
  document.getElementById('action-zone').style.display = 'flex';
  setHudMenuOpen(false);

  // 플레이어 위치·시점 및 게임 루프 재개
  isMenuBgmActive = false;
  joyX = 0; joyY = 0; keys = {}; currentMoveSpeed = 0;
  if (snap.playerPos) playerPos.copy(snap.playerPos);
  playerFacing = snap.playerFacing;
  cameraYaw = snap.cameraYaw;
  cameraTargetYaw = snap.cameraTargetYaw;
  isPlaying = snap.wasPlaying;
  isTimeAttackActive = snap.wasTimeAttackActive;
  if (playerGroup) {
    playerGroup.position.copy(playerPos);
    playerGroup.rotation.y = (window.globalCameraViewMode === 'fps') ? (cameraYaw + Math.PI) : playerFacing;
  }
  snapCameraToPlayer();

  // 저장해 둔 보조 UI 가시성 복원
  const v = snap.vis || {};
  const restoreVis = (id, show, flexMode = false) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('hidden', !show);
    if (flexMode) el.classList.toggle('flex', Boolean(show));
  };
  restoreVis('hud-timer-box', v.timerBox, true);
  restoreVis('hud-block-box', v.blockBox, true);
  restoreVis('cert-open-btn', v.certBtn);
  restoreVis('puzzle-build-btn', v.puzzleBtn);
  restoreVis('context-action-btn', v.contextBtn);
  restoreVis('miracle-mini-nav', v.miracleMiniNav);

  MiracleGuideUI.activeFieldInfo = snap.miracleActiveFieldInfo || null;
  MiracleGuideUI.activeStageInfo = snap.miracleActiveStageInfo || MiracleGuideUI.activeStageInfo;

  if (snap.episode === 'miracle') {
    restoreVis('miracle-hud-left', v.miracleLeft);
    restoreVis('miracle-s1-ui', v.miracleS1);
    restoreVis('miracle-sower-btn-wrap', v.miracleSower);
    restoreVis('miracle-breakfast-ui', v.miracleBreakfast);
    restoreVis('miracle-zacchaeus-ui', v.miracleZacchaeus);
    restoreVis('miracle-zac-drag-layer', v.miracleZacDrag);
    if (typeof updateMiracleNotebookHudBadge === 'function') updateMiracleNotebookHudBadge();
    if (typeof window.syncMiracleTimeHUD === 'function') window.syncMiracleTimeHUD();
    if (snap.wasMultiplayer) {
      restoreVis('mp-online-badge', v.mpOnlineBadge);
      restoreVis('miracle-mp-hud', v.mpHud);
      restoreVis('mp-harvest-btn-wrap', v.mpHarvest);
      if (window.MiracleMultiplayer && typeof window.MiracleMultiplayer.syncHUD === 'function') {
        window.MiracleMultiplayer.syncHUD();
      }
    }
  } else if (snap.episode === 'david') {
    const retBtn = document.getElementById('miracle-return-openworld-btn');
    if (retBtn) retBtn.classList.add('hidden');
    if (snap.stage === 1 && typeof updateDavidStage1UI === 'function') {
      updateDavidStage1UI();
    } else {
      restoreVis('david-st1-panel', v.davidSt1Panel);
    }
    if (snap.stage === 3 && typeof updateDavidStage3QuestTrackerUI === 'function') {
      updateDavidStage3QuestTrackerUI();
    } else {
      restoreVis('david-st3-quest-tracker', v.davidSt3Tracker);
    }
  } else {
    const retBtn = document.getElementById('miracle-return-openworld-btn');
    if (retBtn) retBtn.classList.add('hidden');
  }

  syncHudMenuInfo();
  updateMiracleGuideButtonVisibility();
  if (typeof window.positionMultiplayerRightHud === 'function') window.positionMultiplayerRightHud();

  // 해당 스테이지 BGM 재개
  if (bgmEnabled) {
    if (
      snap.episode === 'miracle' &&
      typeof miracleSubMode !== 'undefined' &&
      miracleSubMode === 'openworld' &&
      typeof window.playMiracleOpenWorldOgg === 'function'
    ) {
      window.playMiracleOpenWorldOgg();
    } else {
      startStageBgm(currentStage);
    }
  }
  playSfx('rescue');
  showToast('▶ 이전 탐험으로 돌아왔어요!');
}
window.resumeGameFromWorldMap = resumeGameFromWorldMap;

function openScreen(screenId) {
  setHudMenuOpen(false);
  closeUiTutorial(false);
  hideMissionGuideBubbleImmediately();
  if (typeof clearEndingCardFlipTimer === 'function') clearEndingCardFlipTimer();
  const badgesModal = document.getElementById('adventure-badges-modal');
  if (badgesModal) { badgesModal.classList.add('hidden'); badgesModal.classList.remove('flex'); }

  ['screen-opening', 'screen-class', 'screen-map'].forEach(id => {
    const el = document.getElementById(id);
    if (id === screenId) { el.classList.remove('hidden'); el.classList.add('flex'); }
    else { el.classList.add('hidden'); el.classList.remove('flex'); }
  });
  closeEpisodeStageSelectModal();
  closeEndingWorldMapChoiceModal();

  if (screenId) {
    discardPausedGameSession(false);
    pendingFootstepsAwardQueue = [];
    _footstepsModalPrevPlaying = false;
    window.__endingModalMode = 'episode';
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
    if (typeof window.stopAllEp4VoiceAudio === 'function') {
      window.stopAllEp4VoiceAudio();
    } else {
      ['__activeNpcAudio', '__activeVerseAudio', '__activeEndingAudio'].forEach(k => {
        if (window[k]) {
          try { window[k].pause(); } catch (e) {}
          window[k] = null;
        }
      });
      if (typeof window.speechSynthesis !== 'undefined' && window.speechSynthesis) {
        try { window.speechSynthesis.cancel(); } catch (e) {}
      }
    }
    if (window.MiracleMultiplayer && typeof window.MiracleMultiplayer.leaveRoom === 'function') {
      window.MiracleMultiplayer.leaveRoom();
    }
    document.getElementById('hud-top').classList.add('hidden');
    if (typeof window.setMiracleTimeExpanded === 'function') window.setMiracleTimeExpanded(false);
    const timeAnchor = document.getElementById('miracle-time-anchor');
    if (timeAnchor) timeAnchor.classList.add('hidden');
    const guideBtn = document.getElementById('miracle-guide-btn');
    if (guideBtn) guideBtn.classList.add('hidden');
    const miniNav = document.getElementById('miracle-mini-nav');
    if (miniNav) miniNav.classList.add('hidden');
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
        updateMapReturnButtonVisibility();
      }
    } else if (screenId === 'screen-opening') {
      isMenuBgmActive = false;
      stopStageBgm();
      if (typeof updateOpeningLogoState === 'function') updateOpeningLogoState(false);
    }
  }
  syncOverlayModalBodyClass();
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

// =========================================================================
// [오프닝 로고 자동 전환] 에피소드 4 완주 전 '출발! 성경 탐험대!' ↔ 완주 후 '약속의 여정' 스페셜 연출
// =========================================================================
const OPENING_LOGO_DEFAULT_SRC = 'assets/img/logo_bible_adventure.png?v=32';
const OPENING_LOGO_PROMISE_SRC = 'assets/img/logo_promise_journey.png?v=32';
const EP4_PROMISE_LOGO_DEVICE_KEY = 'bible_ep4_promise_logo_unlocked_v1';
const EP4_ENDING_VIDEO_WATCHED_KEY = 'bible_ep4_ending_video_watched_v1';
let _lastOpeningLogoCompletedState = null;

function getPlayerPromiseLogoStorageKey(uniquePlayerId) {
  return 'bible_ep4_promise_logo_player_v1_' + (uniquePlayerId || 'guest');
}

function hasStoredEp4CompletionForPlayer(playerId) {
  const id = String(playerId || '').trim();
  if (!id) return false;
  try {
    if (localStorage.getItem(getPlayerPromiseLogoStorageKey(id)) === '1') return true;
    const progRaw = localStorage.getItem(getLocalProgressStorageKey(id));
    if (progRaw) {
      const parsed = JSON.parse(progRaw);
      const mp = parsed && parsed.miracle;
      if (mp && (mp.completed || mp.certIssued || (parseInt(mp.maxClearedStage || 0, 10) >= 4))) return true;
    }
    const certRaw = localStorage.getItem(getAdventureCertsStorageKey(id));
    if (certRaw) {
      const certs = JSON.parse(certRaw);
      if (certs && certs.miracle && certs.miracle.code) return true;
    }
    const nbRaw = localStorage.getItem('bible_ep4_notebook_' + id);
    if (nbRaw) {
      const nb = JSON.parse(nbRaw);
      if (nb && nb.ascensionSeen) return true;
    }
  } catch (e) {}
  return false;
}

function hasAnyDeviceEp4Completion() {
  if (isEpisode4CompletedForMultiplayer()) return true;
  try {
    if (localStorage.getItem(EP4_PROMISE_LOGO_DEVICE_KEY) === '1') return true;
    if (Math.max(0, parseInt(localStorage.getItem(EP4_ENDING_VIDEO_WATCHED_KEY) || '0', 10) || 0) >= 1) return true;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) || '';
      if (k.startsWith('bible_ep4_promise_logo_player_v1_') && localStorage.getItem(k) === '1') return true;
      if (k.startsWith('bible_progress_v2_')) {
        const parsed = JSON.parse(localStorage.getItem(k) || 'null');
        const mp = parsed && parsed.miracle;
        if (mp && (mp.completed || mp.certIssued || (parseInt(mp.maxClearedStage || 0, 10) >= 4))) return true;
      } else if (k.startsWith('bible_adventure_certs_v1_')) {
        const certs = JSON.parse(localStorage.getItem(k) || 'null');
        if (certs && certs.miracle && certs.miracle.code) return true;
      } else if (k.startsWith('bible_ep4_notebook_')) {
        const nb = JSON.parse(localStorage.getItem(k) || 'null');
        if (nb && nb.ascensionSeen) return true;
      }
    }
  } catch (e) {}
  return false;
}

function shouldShowPromiseJourneyLogo() {
  const nameInput = document.getElementById('opening-name-input');
  const birthInput = document.getElementById('opening-birth-input');
  const rawName = nameInput ? nameInput.value.trim() : '';
  const rawBirth = birthInput ? birthInput.value.replace(/[^0-9]/g, '').trim() : '';
  if (rawName && rawBirth.length === 4) {
    const typedId = `${rawName}(${rawBirth})`;
    if (typedId === explorerName && isEpisode4CompletedForMultiplayer()) return true;
    return hasStoredEp4CompletionForPlayer(typedId);
  }
  return hasAnyDeviceEp4Completion();
}

function markEp4EndingCompletedForLogo(playerId = '') {
  const pid = String(playerId || (typeof explorerName !== 'undefined' ? explorerName : '') || '').trim();
  try {
    localStorage.setItem(EP4_PROMISE_LOGO_DEVICE_KEY, '1');
    if (pid) {
      localStorage.setItem(getPlayerPromiseLogoStorageKey(pid), '1');
    }
  } catch (e) {}
  updateOpeningLogoState(false);
}
window.markEp4EndingCompletedForLogo = markEp4EndingCompletedForLogo;

function updateOpeningLogoState(animateIfChanged = false) {
  const screenEl = document.getElementById('screen-opening');
  if (!screenEl) return false;
  const isCompleted = shouldShowPromiseJourneyLogo();
  screenEl.classList.toggle('opening-completed', isCompleted);

  const auraEl = document.getElementById('opening-logo-aura');
  if (auraEl) auraEl.classList.toggle('hidden', !isCompleted);
  const sparklesEl = document.getElementById('opening-logo-sparkles');
  if (sparklesEl) sparklesEl.classList.toggle('hidden', !isCompleted);

  const imgEl = document.getElementById('opening-logo-img');
  const fbEl = document.getElementById('opening-logo-fallback');
  if (fbEl) {
    fbEl.textContent = isCompleted ? '약속의 여정' : '출발! 성경 탐험대!';
    fbEl.classList.add('hidden');
  }
  if (imgEl) {
    const targetSrc = isCompleted ? OPENING_LOGO_PROMISE_SRC : OPENING_LOGO_DEFAULT_SRC;
    const targetAlt = isCompleted ? '약속의 여정' : '출발! 성경 탐험대!';
    imgEl.style.display = '';
    if ((imgEl.getAttribute('src') || '') !== targetSrc) {
      imgEl.src = targetSrc;
      if (animateIfChanged && _lastOpeningLogoCompletedState !== null && _lastOpeningLogoCompletedState !== isCompleted) {
        imgEl.classList.remove('opening-logo-swap-anim');
        void imgEl.offsetWidth;
        imgEl.classList.add('opening-logo-swap-anim');
      }
    }
    imgEl.alt = targetAlt;
  }

  const badgeEl = document.getElementById('opening-badge');
  if (badgeEl) {
    badgeEl.textContent = isCompleted ? '👑 완주 기념 · 약속의 여정' : '✨ 3D 바이블 어드벤처';
  }
  const subEl = document.getElementById('opening-sub');
  if (subEl) {
    subEl.textContent = isCompleted
      ? '말씀의 약속을 완주한 탐험가! 새로운 여정을 이어가요!'
      : '말씀 속 주인공이 되어 믿음의 모험을 떠나요!';
  }

  _lastOpeningLogoCompletedState = isCompleted;
  return isCompleted;
}
window.updateOpeningLogoState = updateOpeningLogoState;

window.handleOpeningIdentityInput = function () {
  updateOpeningLogoState(true);
};

function launchEpisode(ep) {
  const lockState = getEpisodeLockState(ep);
  if (lockState.locked) {
    playSfx('wrong');
    showToast(lockState.message);
    return;
  }

  playSfx('switch');
  openEpisodeStageSelectModal(ep);
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

let _guideArrowGeoCache = null;
const _guideArrowWorldTmp = new THREE.Vector3();

function getGuideArrowChevronGeos() {
  if (_guideArrowGeoCache) return _guideArrowGeoCache;

  const buildChevronGeo = (pts, depth, bevelSize, bevelThick) => {
    const sh = new THREE.Shape();
    sh.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) sh.lineTo(pts[i][0], pts[i][1]);
    sh.closePath();
    const geo = new THREE.ExtrudeGeometry(sh, {
      depth,
      bevelEnabled: bevelSize > 0,
      bevelThickness: bevelThick,
      bevelSize,
      bevelSegments: 1,
      curveSegments: 1
    });
    geo.translate(0, 0, -depth * 0.5);
    geo.rotateX(Math.PI * 0.5);
    geo.computeVertexNormals();
    return geo;
  };

  // 외곽 진한 주황 림 (넓은 V자 쉐브론 + 꼬리 노치, 뒤에서 봐도 사각형 뭉개짐 0%)
  const rimPts = [
    [ 0.00,  0.62],
    [-0.56, -0.14],
    [-0.18, -0.02],
    [-0.14, -0.44],
    [ 0.00, -0.30],
    [ 0.14, -0.44],
    [ 0.18, -0.02],
    [ 0.56, -0.14]
  ];
  // 내부 밝은 골드 코어 (상·하로 +0.02m 도드라져 360° 고대비 2톤 입체 실루엣 형성)
  const corePts = [
    [ 0.00,  0.50],
    [-0.41, -0.07],
    [-0.12,  0.03],
    [-0.09, -0.33],
    [ 0.00, -0.22],
    [ 0.09, -0.33],
    [ 0.12,  0.03],
    [ 0.41, -0.07]
  ];
  // 상면 화살촉 하이라이트 팁
  const tipPts = [
    [ 0.00,  0.46],
    [-0.16,  0.18],
    [ 0.00,  0.25],
    [ 0.16,  0.18]
  ];

  _guideArrowGeoCache = {
    rimGeo:  buildChevronGeo(rimPts,  0.11, 0.022, 0.022),
    coreGeo: buildChevronGeo(corePts, 0.165, 0.015, 0.015),
    tipGeo:  buildChevronGeo(tipPts,  0.016, 0, 0)
  };
  return _guideArrowGeoCache;
}

function createGuideArrowMesh() {
  const g = new THREE.Group();
  const geos = getGuideArrowChevronGeos();

  // [안 A] 카메라 경사 자동 보정 나침반 프레임 (YXZ: 카메라 방위 정렬 후 카메라 쪽 틸트 → 정면=↑, 후면=↓, 좌=←, 우=→)
  const tiltCarrier = new THREE.Group();
  tiltCarrier.rotation.order = 'YXZ';

  const arrowSpin = new THREE.Group();
  const pulseGroup = new THREE.Group();

  const rimMat = new THREE.MeshLambertMaterial({
    color: 0xea580c,
    emissive: 0xb45309,
    emissiveIntensity: 0.38,
    flatShading: true
  });
  const coreMat = new THREE.MeshLambertMaterial({
    color: 0xfde047,
    emissive: 0xfacc15,
    emissiveIntensity: 0.48,
    flatShading: true
  });
  const tipMat = new THREE.MeshBasicMaterial({ color: 0xfef9c3 });

  const rimMesh  = new THREE.Mesh(geos.rimGeo, rimMat);
  const coreMesh = new THREE.Mesh(geos.coreGeo, coreMat);
  const tipTop   = new THREE.Mesh(geos.tipGeo, tipMat);
  tipTop.position.y = 0.104;

  pulseGroup.add(rimMesh, coreMesh, tipTop);
  arrowSpin.add(pulseGroup);
  tiltCarrier.add(arrowSpin);
  g.add(tiltCarrier);

  g.userData.tiltCarrier = tiltCarrier;
  g.userData.arrowSpin = arrowSpin;
  g.userData.pulseGroup = pulseGroup;
  g.position.set(0, 3.35, 0);
  return g;
}

function updateGuideArrowVisuals(now) {
  if (!guideArrowGroup) return;
  // [필수 보호] 소년반(EP1~EP4 senior, EP4 timeattack) · EP4 스테이지1(주간/야간) · 멀티플레이에서는 절대 미표시!
  const isSeniorHidden = (typeof isEffectiveSeniorMode === 'function')
    ? isEffectiveSeniorMode(currentEpisode, currentMode)
    : (currentMode === 'senior');
  const isMiracleNoArrow = (currentEpisode === 'miracle') && (
    Boolean(window.isMiracleMultiplayerMode) ||
    (typeof miracleSubMode !== 'undefined' && (miracleSubMode === 'main1_galilee' || miracleSubMode === 'main1_storm_night')) ||
    (typeof miracleDialogState !== 'undefined' && miracleDialogState && miracleDialogState.active)
  );
  if (isSeniorHidden || isMiracleNoArrow) {
    guideArrowGroup.visible = false;
    return;
  }
  if (!guideArrowGroup.visible || !camera || !playerGroup) return;

  const tiltCarrier = guideArrowGroup.userData && guideArrowGroup.userData.tiltCarrier;
  const arrowSpin   = guideArrowGroup.userData && guideArrowGroup.userData.arrowSpin;
  const pulseGroup  = guideArrowGroup.userData && guideArrowGroup.userData.pulseGroup;
  if (!tiltCarrier || !arrowSpin || !pulseGroup) return;

  guideArrowGroup.updateWorldMatrix(true, false);
  guideArrowGroup.getWorldPosition(_guideArrowWorldTmp);

  const toCamX = camera.position.x - _guideArrowWorldTmp.x;
  const toCamY = camera.position.y - _guideArrowWorldTmp.y;
  const toCamZ = camera.position.z - _guideArrowWorldTmp.z;
  const horizD = Math.hypot(toCamX, toCamZ);
  const camAz  = (horizD > 0.001) ? Math.atan2(toCamX, toCamZ) : (typeof cameraYaw === 'number' ? cameraYaw : 0);
  const camElev = Math.atan2(toCamY, Math.max(0.001, horizD));

  // 저각 default 카메라(고도각 ~2.8°)에서는 +29° 자동 기울임, 고각 topdown(고도각 ~24°)에서는 +8°로 완화 → 항상 약 32°의 최적 시인 각도 유지
  const tiltX = Math.max(0.0, Math.min(0.52, 0.56 - camElev));
  const worldArrowYaw = (playerGroup.rotation.y || 0) + (guideArrowGroup.rotation.y || 0);

  tiltCarrier.rotation.set(tiltX, camAz - worldArrowYaw, 0);
  arrowSpin.rotation.y = worldArrowYaw - camAz;

  // 목표 방향(+Z)으로 부드럽게 왕복하는 추진 펄스 + 미세 상하 부유
  const t = (now || performance.now()) * 0.001;
  pulseGroup.position.z = Math.sin(t * 5.2) * 0.085;
  pulseGroup.position.y = Math.cos(t * 3.4) * 0.04;
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
  const isMiracleStage1Hide = (currentEpisode === 'miracle') && (
    Boolean(window.isMiracleMultiplayerMode) ||
    (typeof miracleSubMode !== 'undefined' && (miracleSubMode === 'main1_galilee' || miracleSubMode === 'main1_storm_night'))
  );
  guideArrowGroup.visible = !isEffectiveSeniorMode(currentEpisode, currentMode) && !isMiracleStage1Hide;
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

function resetCoreSceneLighting() {
  if (window.coreAmbientLight) {
    window.coreAmbientLight.color.setHex(0xffffff);
    window.coreAmbientLight.intensity = 0.62;
  }
  if (window.coreHemiLight) {
    window.coreHemiLight.color.setHex(0x87ceeb);
    window.coreHemiLight.groundColor.setHex(0xb89c6e);
    window.coreHemiLight.intensity = 0.0;
  }
  if (window.coreDirLight) {
    const dl = window.coreDirLight;
    dl.color.setHex(0xfffbeb);
    dl.intensity = 0.72;
    dl.position.set(25, 45, 25);
    dl.castShadow = true;
    if (window.coreDirLightDefaultTarget) {
      window.coreDirLightDefaultTarget.position.set(0, 0, 0);
      window.coreDirLightDefaultTarget.updateMatrixWorld();
      dl.target = window.coreDirLightDefaultTarget;
    }
    if (dl.shadow) {
      if (dl.shadow.camera) {
        dl.shadow.camera.left = -5;
        dl.shadow.camera.right = 5;
        dl.shadow.camera.top = 5;
        dl.shadow.camera.bottom = -5;
        dl.shadow.camera.near = 0.5;
        dl.shadow.camera.far = 500;
        dl.shadow.camera.updateProjectionMatrix();
      }
      dl.shadow.bias = 0;
      if (dl.shadow.normalBias !== undefined) {
        dl.shadow.normalBias = 0;
      }
    }
  }
  if (typeof renderer !== 'undefined' && renderer && renderer.shadowMap) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.needsUpdate = true;
  }
}
window.resetCoreSceneLighting = resetCoreSceneLighting;

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
  if (typeof noahEndingCamCutscene !== 'undefined') noahEndingCamCutscene.active = false;
  if (typeof noahEndingArkFadeMats !== 'undefined') noahEndingArkFadeMats = [];
  if (typeof noahEndingArkIsFaded !== 'undefined') noahEndingArkIsFaded = false;
  if (typeof noahEndingArkOpacity !== 'undefined') noahEndingArkOpacity = 1.0;
  if (typeof noahEndingArkTransparentApplied !== 'undefined') noahEndingArkTransparentApplied = false;

  Object.values(EPISODE_REGISTRY).forEach(plugin => {
    if (plugin && typeof plugin.clearState === 'function') plugin.clearState();
  });
  resetCoreSceneLighting();

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
    if (allowCert && currentEpisode !== 'noah') certBtn.classList.remove('hidden');
    else certBtn.classList.add('hidden');
  }
}

const GOOGLE_SHEET_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbxAcGwFLUxFM-BLZGQpUjWMRhQklklXFXdGILvD-SbMgvGulElPgJ0ynyabd-tsC5ex/exec';

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
    
    // 현재 모드에 맞춰 버튼 아이콘과 텍스트 동적으로 생성
    if (window.globalCameraViewMode === 'default') {
      btn.innerHTML = '<span class="text-sm leading-none">🎥</span><span id="global-camera-view-label" class="text-[9px] text-sky-200 mt-0.5 leading-none">기본</span>';
    } else if (window.globalCameraViewMode === 'topdown') {
      btn.innerHTML = '<span class="text-sm leading-none">🚁</span><span id="global-camera-view-label" class="text-[9px] text-indigo-300 mt-0.5 leading-none">내려봄</span>';
    } else if (window.globalCameraViewMode === 'fps') {
      btn.innerHTML = '<span class="text-sm leading-none">👀</span><span id="global-camera-view-label" class="text-[9px] text-emerald-300 mt-0.5 leading-none">1인칭</span>';
    } else {
      btn.innerHTML = '<span class="text-sm leading-none">🌤️</span><span id="global-camera-view-label" class="text-[9px] text-amber-300 mt-0.5 leading-none">올려봄</span>';
    }
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
    window.noahArkCeilingGroup.visible = window.globalCameraViewMode !== 'topdown';
  }
  if (!playerGroup) return;
  playerGroup.children.forEach(child => {
    if (child === guideArrowGroup) {
      const hideForStage1OrDialog = (currentEpisode === 'miracle') && (
        Boolean(window.isMiracleMultiplayerMode) ||
        (typeof miracleSubMode !== 'undefined' && (miracleSubMode === 'main1_galilee' || miracleSubMode === 'main1_storm_night')) ||
        (typeof miracleDialogState !== 'undefined' && miracleDialogState && miracleDialogState.active)
      );
      child.visible = !isEffectiveSeniorMode(currentEpisode, currentMode) && !hideForStage1OrDialog;
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

window.setGlobalCameraViewMode = function (mode = 'default') {
  const valid = (mode === 'default' || mode === 'topdown' || mode === 'fps' || mode === 'lookup') ? mode : 'default';
  window.globalCameraViewMode = valid;
  const btn = ensureGlobalCameraViewToggleUI();
  if (btn) {
    if (valid === 'default') {
      btn.innerHTML = '<span class="text-sm leading-none">🎥</span><span id="global-camera-view-label" class="text-[9px] text-sky-200 mt-0.5 leading-none">기본</span>';
    } else if (valid === 'topdown') {
      btn.innerHTML = '<span class="text-sm leading-none">🚁</span><span id="global-camera-view-label" class="text-[9px] text-indigo-300 mt-0.5 leading-none">내려봄</span>';
    } else if (valid === 'fps') {
      btn.innerHTML = '<span class="text-sm leading-none">👀</span><span id="global-camera-view-label" class="text-[9px] text-emerald-300 mt-0.5 leading-none">1인칭</span>';
    } else {
      btn.innerHTML = '<span class="text-sm leading-none">🌤️</span><span id="global-camera-view-label" class="text-[9px] text-amber-300 mt-0.5 leading-none">올려봄</span>';
    }
  }
  setPlayerMeshVisibilityForCamera(valid === 'fps');
};

window.cycleGlobalCameraViewMode = function () {
  // 에피소드 4 스테이지 1·2·3에서는 항상 기본 시점 카메라로 고정!
  const isMiracleLockedDefaultCam = (
    currentEpisode === 'miracle' &&
    typeof miracleSubMode !== 'undefined' &&
    (miracleSubMode === 'main1_galilee' || miracleSubMode === 'main1_storm_night' || miracleSubMode === 'main2_loaves' || miracleSubMode === 'main3_cross')
  );
  if (isMiracleLockedDefaultCam) {
    window.globalCameraViewMode = 'default';
    const btnLocked = ensureGlobalCameraViewToggleUI();
    if (btnLocked) {
      btnLocked.innerHTML =
        '<span class="text-sm leading-none">🎥</span><span id="global-camera-view-label" class="text-[9px] text-sky-200 mt-0.5 leading-none">기본</span>';
    }
    setPlayerMeshVisibilityForCamera(false);
    showToast('🎥 이 스테이지에서는 기본 시점 카메라로 고정돼요!');
    snapCameraToPlayer();
    return;
  }

  if (window.globalCameraViewMode === 'default') {
    window.globalCameraViewMode = 'topdown';
  } else if (window.globalCameraViewMode === 'topdown') {
    window.globalCameraViewMode = 'fps';
  } else if (window.globalCameraViewMode === 'fps') {
    window.globalCameraViewMode = 'lookup';
  } else {
    window.globalCameraViewMode = 'default';
  }

  const btn = ensureGlobalCameraViewToggleUI();
  if (window.globalCameraViewMode === 'default') {
    btn.innerHTML = '<span class="text-sm leading-none">🎥</span><span id="global-camera-view-label" class="text-[9px] text-sky-200 mt-0.5 leading-none">기본</span>';
    setPlayerMeshVisibilityForCamera(false);
    showToast('🎥 카메라: [기본 시점]');
  } else if (window.globalCameraViewMode === 'topdown') {
    btn.innerHTML = '<span class="text-sm leading-none">🚁</span><span id="global-camera-view-label" class="text-[9px] text-indigo-300 mt-0.5 leading-none">내려봄</span>';
    setPlayerMeshVisibilityForCamera(false);
    showToast('🚁 카메라: [내려봄 시점]');
  } else if (window.globalCameraViewMode === 'fps') {
    btn.innerHTML = '<span class="text-sm leading-none">👀</span><span id="global-camera-view-label" class="text-[9px] text-emerald-300 mt-0.5 leading-none">1인칭</span>';
    setPlayerMeshVisibilityForCamera(true);
    showToast('👀 카메라: [1인칭 시점]');
  } else {
    btn.innerHTML = '<span class="text-sm leading-none">🌤️</span><span id="global-camera-view-label" class="text-[9px] text-amber-300 mt-0.5 leading-none">올려봄</span>';
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

  // [에피소드 4 스테이지 1 시점 고정 & 반응형 시네마틱 카메라 (주간 깊은 곳으로! & 야간 풍랑)]
  const isMiracleBoatStage = (
    currentEpisode === 'miracle' &&
    typeof miracleSubMode !== 'undefined' &&
    (miracleSubMode === 'main1_galilee' || miracleSubMode === 'main1_storm_night')
  );
  if (isMiracleBoatStage) {
    setPlayerMeshVisibilityForCamera(false);
    const vw = Math.max(1, window.innerWidth || 1280);
    const vh = Math.max(1, window.innerHeight || 720);
    const aspect = Math.max(0.45, Math.min(2.2, vw / vh));
    if (typeof window.applyMiracleStage1Camera === 'function' && window.applyMiracleStage1Camera(camera, aspect)) {
      return;
    }
    const stormScale = aspect < 1.0
      ? Math.min(1.52, 0.92 + 0.40 / aspect)
      : (aspect < 1.3 ? 1.10 : 1.0);
    camera.position.set(4.8 * stormScale, 5.8 + 2.8 * stormScale, 11.6 + 9.2 * stormScale);
    camera.lookAt(0, 1.05, 3.6);
    return;
  }

  // [에피소드 4 스테이지 2·3 기본 시점 고정 + 스테이지 2 시작 버드뷰 언덕 스윕 인트로]
  const isMiracleStage2Or3Locked = (
        currentEpisode === 'miracle' &&
        typeof miracleSubMode !== 'undefined' &&
        (miracleSubMode === 'main2_loaves' || miracleSubMode === 'main3_cross')
      );
      if (isMiracleStage2Or3Locked) {
        const st = (typeof miracleActiveMiniState !== 'undefined') ? miracleActiveMiniState : null;

        if (miracleSubMode === 'main2_loaves' && st && st.introFlyover && st.introFlyover.active) {
          setPlayerMeshVisibilityForCamera(false);
          
          // 착륙할 목표점(새로운 기본 카메라 좌표) 계산
          const aspect = window.innerWidth / Math.max(1, window.innerHeight);
          const isPortrait = aspect < 1.0;
          const distMult = isPortrait ? 1.0 : 0.85;
          const hMult = isPortrait ? 0.55 : 0.45;
          const finalDist = 11.5 * distMult;
          const finalH = 8.5 * hMult;

          const targetLookY = playerPos.y + 2.4;
          const defCamX = playerPos.x + sinY * finalDist;
          const defCamY = playerPos.y + finalH;
          const defCamZ = playerPos.z + cosY * finalDist;

          const dur = Math.max(0.1, st.introFlyover.duration || 3.4);
          const u = Math.max(0, Math.min(1, (st.introFlyover.timer || 0) / dur));
          const ease = (x) => x * x * (3 - 2 * x);
          
          if (u < 0.62) {
            // 1구간: 높은 버드뷰로 벳새다 언덕 훑어보기
            const s = ease(u / 0.62);
            const angle = -0.65 + s * 1.30;
            const bx = Math.sin(angle) * 20.0;
            const by = 30.0 - s * 4.5;
            const bz = -10.0 + Math.cos(angle) * 22.0;
            camera.position.set(bx, by, bz);
            camera.lookAt(0, 4.5 + s * 2.5, -16.0 - s * 4.0);
          } else {
            // 2구간: 버드뷰 종료점에서 새로운 기본 시점 카메라로 매끄럽게 하강 착륙!
            const d = ease((u - 0.62) / 0.38);
            const endAngle = 0.65;
            const startBx = Math.sin(endAngle) * 20.0;
            const startBy = 25.5;
            const startBz = -10.0 + Math.cos(endAngle) * 22.0;
            camera.position.set(
              startBx + (defCamX - startBx) * d,
              startBy + (defCamY - startBy) * d,
              startBz + (defCamZ - startBz) * d
            );
            camera.lookAt(
              playerPos.x * d,
              7.0 + (targetLookY - 7.0) * d,
              -20.0 + (playerPos.z - (-20.0)) * d
            );
          }
          return; // 인트로 컷신 중일 때만 여기서 종료
        }
        
        // 인트로가 끝나거나 스테이지 3일 경우, 과거 시점 고정 코드를 타지 않고
        // 자연스럽게 함수 하단의 '새로운 기본 카메라' 로직으로 연결되도록 통과시킵니다.
      }

  // [에피소드 4 오픈월드 시작 시네마틱 탑뷰 조망 → 마을 상공 270도 회전 → 캐릭터 시선 하강 연출]
  const isMiracleOwFlyover = (
    currentEpisode === 'miracle' &&
    typeof miracleSubMode !== 'undefined' &&
    miracleSubMode === 'openworld' &&
    window.miracleOpenWorldIntroFlyover &&
    window.miracleOpenWorldIntroFlyover.active
  );
  if (isMiracleOwFlyover) {
    setPlayerMeshVisibilityForCamera(false);
    const fl = window.miracleOpenWorldIntroFlyover;
    const dur = Math.max(0.1, fl.duration || 8.5); // 270도 회전에 맞춰 시간 연장
    const u = Math.max(0, Math.min(1, (fl.timer || 0) / dur));
    
    // 시작과 끝을 극도로 부드럽게 가감속하는 Cubic Easing 함수 적용
    const easeInOutCubic = (x) => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

    // 최종 도착할 캐릭터 시점 목표 좌표 계산
    let endCamX, endCamY, endCamZ, endLookX, endLookY, endLookZ;
    if (window.globalCameraViewMode === 'fps') {
      endCamX = playerPos.x - sinY * 0.15;
      endCamY = playerPos.y + 2.15;
      endCamZ = playerPos.z - cosY * 0.15;
      endLookX = endCamX - sinY * 18.0;
      endLookY = playerPos.y + 2.12;
      endLookZ = endCamZ - cosY * 18.0;
    } else if (window.globalCameraViewMode === 'lookup') {
      const lowDist = 6.2;
      endCamX = playerPos.x + sinY * lowDist;
      endCamZ = playerPos.z + cosY * lowDist;
      const gH = Math.max(playerPos.y, getBaseGroundHeight(endCamX, endCamZ));
      endCamY = Math.max(playerPos.y + 1.45, gH + 1.15);
      endLookX = playerPos.x - sinY * 8.0;
      endLookY = playerPos.y + 5.2;
      endLookZ = playerPos.z - cosY * 8.0;
    } else if (window.globalCameraViewMode === 'topdown') {
      endCamX = playerPos.x + sinY * 11.5;
      endCamZ = playerPos.z + cosY * 11.5;
      const gEndTop = (typeof getBaseGroundHeight === 'function') ? getBaseGroundHeight(endCamX, endCamZ) : 0;
      endCamY = Math.max(playerPos.y + 8.5, gEndTop + 1.85);
      endLookX = playerPos.x;
      endLookY = playerPos.y + 1.5;
      endLookZ = playerPos.z;
    } else {
      const aspect = window.innerWidth / Math.max(1, window.innerHeight);
      const isPortrait = aspect < 1.0;
      const distMult = isPortrait ? 1.0 : 0.85;
      const hMult = isPortrait ? 0.55 : 0.45;
      endCamX = playerPos.x + sinY * (11.5 * distMult);
      endCamZ = playerPos.z + cosY * (11.5 * distMult);
      const gEndDef = (typeof getBaseGroundHeight === 'function') ? getBaseGroundHeight(endCamX, endCamZ) : 0;
      endCamY = Math.max(playerPos.y + (8.5 * hMult), gEndDef + 1.85);
      endLookX = playerPos.x;
      endLookY = playerPos.y + 2.4;
      endLookZ = playerPos.z;
    }

    // 270도(1.5 Pi) 나선형 비행 궤적 연산 (구간 끊김 없는 완벽한 곡선)
    const s = easeInOutCubic(u);
    
    // 시작 각도 설정: 270도를 시계방향으로 돌며 캐릭터 등 뒤 방향으로 일치시킴
    const startAngle = Math.PI * 1.5; 
    const revolveAngle = startAngle - (1.5 * Math.PI) * s; 
    
    // 비행 반경: 상공 65m 반경에서 캐릭터 중심점으로 서서히 좁혀짐
    const radius = 65 * (1 - s); 
    const flyY = playerPos.y + 55 * (1 - s) + endCamY * s;
    
    // 궤적의 중심점을 마을 중앙(0, -15)에서 캐릭터 현재 위치로 자연스럽게 이동
    const centerX = 0 * (1 - s) + playerPos.x * s;
    const centerZ = -15 * (1 - s) + playerPos.z * s;
    
    const flyX = centerX + Math.cos(revolveAngle) * radius;
    const flyZ = centerZ + Math.sin(revolveAngle) * radius;

    // 카메라를 부드럽게 최종 좌표로 수렴 (s가 1에 가까워질수록 목표 카메라 좌표에 100% 일치)
    camera.position.set(
      flyX * (1 - s) + endCamX * s,
      flyY,
      flyZ * (1 - s) + endCamZ * s
    );

    // 시선 처리: 마을 중앙을 넓게 내려다보다가 서서히 플레이어의 머리 방향으로 시선 고정
    const lookX = 0 * (1 - s) + endLookX * s;
    const lookY = 2.0 * (1 - s) + endLookY * s;
    const lookZ = -15 * (1 - s) + endLookZ * s;
    
    camera.lookAt(lookX, lookY, lookZ);

    // 플라이오버가 완전히 종료되었을 때 SKIP 버튼 숨김 처리
    if (u >= 1) {
      const skipWrap = document.getElementById('ep4-flyover-skip-wrap');
      if (skipWrap) skipWrap.classList.add('hidden');
    }
    return;
  }

  // 언덕 내리막길에서 카메라가 뒷편 지형 속으로 파고들어 땅이 하늘색으로 비치는(백페이스 컬링) 현상을 원천 차단하는 지형 안전 고도 계산기
  const computeTerrainSafeCamY = (lookY, targetCamX, targetCamZ, baseCamY) => {
    if (typeof getBaseGroundHeight !== 'function') return { safeY: baseCamY, camGroundMax: -999 };
    const pad = 0.75;
    const gC  = getBaseGroundHeight(targetCamX, targetCamZ);
    const gL  = getBaseGroundHeight(targetCamX - pad, targetCamZ);
    const gR  = getBaseGroundHeight(targetCamX + pad, targetCamZ);
    const gF  = getBaseGroundHeight(targetCamX, targetCamZ + pad);
    const gB  = getBaseGroundHeight(targetCamX, targetCamZ - pad);
    const camGroundMax = Math.max(gC, gL, gR, gF, gB);

    let requiredY = Math.max(baseCamY, camGroundMax + 1.85);
    const raySamples = [0.28, 0.50, 0.72, 0.88];
    for (let i = 0; i < raySamples.length; i++) {
      const t = raySamples[i];
      const sx = playerPos.x + (targetCamX - playerPos.x) * t;
      const sz = playerPos.z + (targetCamZ - playerPos.z) * t;
      const sg = getBaseGroundHeight(sx, sz);
      const neededForSight = lookY + ((sg + 0.90) - lookY) / t;
      if (neededForSight > requiredY) requiredY = neededForSight;
    }
    const cappedY = Math.min(requiredY, baseCamY + 14.5);
    return { safeY: Math.max(cappedY, camGroundMax + 1.60), camGroundMax };
  };

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
    const camY = Math.max(playerPos.y + 1.45, groundH + 1.35);

    camera.position.set(camX, camY, camZ);
    camera.lookAt(playerPos.x - sinY * 8.0, playerPos.y + 5.2, playerPos.z - cosY * 8.0);
    
  } else if (window.globalCameraViewMode === 'topdown') {
    // [변경 전 원본 카메라] 에피소드 1~3에서 기본으로 사용되는 예전 구도 (언덕 지형 관통 방지 포함)
    setPlayerMeshVisibilityForCamera(false);
    const camDist = (currentStage === 1 || currentStage === 4) ? 11.5 : (currentEpisode === 'exodus' ? 11.2 : 8.4);
    const camH = (currentStage === 1 || currentStage === 4) ? 8.5 : (currentEpisode === 'exodus' ? 8.0 : 7.0);
    const topX = playerPos.x + sinY * camDist;
    const topZ = playerPos.z + cosY * camDist;
    const isTopIndoor = (currentStage === 2 || currentStage === 3) && currentEpisode !== 'miracle';
    let topY = playerPos.y + camH;
    if (!isTopIndoor) {
      topY = computeTerrainSafeCamY(playerPos.y + 1.5, topX, topZ, topY).safeY;
    }
    camera.position.set(topX, topY, topZ);
    camera.lookAt(playerPos.x, playerPos.y + 1.5, playerPos.z);
    
  } else {
    // [새로운 입체형 기본 카메라] 에피소드 4 기본 시점 (야외 반투명 연동 + 언덕 내리막 지형 관통 원천 차단 + 실내 벽 보정)
    setPlayerMeshVisibilityForCamera(false);

    const aspect = window.innerWidth / Math.max(1, window.innerHeight);
    const isPortrait = aspect < 1.0;
    const isIndoor = (currentStage === 2 || currentStage === 3) && currentEpisode !== 'miracle';

    // 에피소드 4는 스테이지에 상관없이 통합된 11.5 / 8.5 기준 거리를 사용하도록 수정
    const baseDist = (currentEpisode === 'miracle') ? 11.5 : ((currentStage === 1 || currentStage === 4) ? 11.5 : (currentEpisode === 'exodus' ? 11.2 : 8.4));
    const baseH = (currentEpisode === 'miracle') ? 8.5 : ((currentStage === 1 || currentStage === 4) ? 8.5 : (currentEpisode === 'exodus' ? 8.0 : 7.0));

    let distMult = 1.0, hMult = 1.0;

    if (isPortrait) {
      if (isIndoor) { distMult = 0.7; hMult = 0.45; }
      else { distMult = 1.0; hMult = 0.55; }
    } else {
      distMult = 0.85; hMult = 0.45;
    }

    const finalDist = baseDist * distMult;
    const finalH = baseH * hMult;

    const lookTarget = new THREE.Vector3(playerPos.x, playerPos.y + 2.4, playerPos.z);
    const idealCamPos = new THREE.Vector3(
      playerPos.x + sinY * finalDist,
      playerPos.y + finalH,
      playerPos.z + cosY * finalDist
    );

    const dirToCam = new THREE.Vector3().subVectors(idealCamPos, lookTarget);
    const fullTargetDist = dirToCam.length();
    dirToCam.normalize();

    let desiredDist = fullTargetDist;

    // 좁은 실내(방주 내부 등)에서만 벽 충돌 보정을 적용하고, 야외 오픈월드는 기존 반투명(updateWallTransparency)에 맡겨 떨림을 원천 차단
    if (isIndoor && typeof raycaster !== 'undefined' && typeof wallMeshes !== 'undefined' && wallMeshes.length > 0) {
      raycaster.set(lookTarget, dirToCam);
      raycaster.far = fullTargetDist;
      const hits = raycaster.intersectObjects(wallMeshes, true);

      let closestDist = fullTargetDist;
      for (let i = 0; i < hits.length; i++) {
        if (hits[i].distance < closestDist && !(hits[i].object.userData && hits[i].object.userData._isGroundSurface)) {
          closestDist = hits[i].distance;
        }
      }

      if (closestDist < fullTargetDist) {
        desiredDist = Math.max(1.2, closestDist - 0.35);
      }
    } else if (!isIndoor && typeof getBaseGroundHeight === 'function') {
      // 가파른 언덕을 내려갈 때 뒤쪽 경사가 높으면 카메라 거리를 살짝 당겨 시야를 편안하게 유지
      const rearGroundH = getBaseGroundHeight(idealCamPos.x, idealCamPos.z);
      const slopeBehind = rearGroundH - playerPos.y;
      if (slopeBehind > 1.2) {
        const pullFactor = Math.max(0.76, 1.0 - (slopeBehind - 1.2) * 0.045);
        desiredDist = fullTargetDist * pullFactor;
      }
    }

    // 거리 변화 시 순간 이동 대신 부드러운 보간 적용
    if (typeof window._smoothDefaultCamDist !== 'number' || window._smoothDefaultCamDist <= 0) {
      window._smoothDefaultCamDist = desiredDist;
    } else {
      const lerpRate = desiredDist < window._smoothDefaultCamDist ? 0.32 : 0.14;
      window._smoothDefaultCamDist += (desiredDist - window._smoothDefaultCamDist) * lerpRate;
    }

    const placedPos = lookTarget.clone().add(dirToCam.clone().multiplyScalar(window._smoothDefaultCamDist));

    // 야외 언덕 내리막 시 카메라가 지형 아래로 내려가 땅이 하늘색으로 뚫려 보이는 현상 완전 차단!
    if (!isIndoor) {
      const { safeY, camGroundMax } = computeTerrainSafeCamY(lookTarget.y, placedPos.x, placedPos.z, placedPos.y);
      const targetLift = Math.max(0, safeY - placedPos.y);
      if (typeof window._smoothDefaultCamLift !== 'number' || !Number.isFinite(window._smoothDefaultCamLift)) {
        window._smoothDefaultCamLift = targetLift;
      } else {
        const liftRate = targetLift > window._smoothDefaultCamLift ? 0.58 : 0.14;
        window._smoothDefaultCamLift += (targetLift - window._smoothDefaultCamLift) * liftRate;
      }
      placedPos.y = Math.max(placedPos.y + window._smoothDefaultCamLift, camGroundMax + 1.55);
    }

    if (isIndoor && currentEpisode === 'noah' && (currentStage === 2 || currentStage === 3)) {
      placedPos.y = Math.min(placedPos.y, 5.75);
    }

    camera.position.copy(placedPos);
    camera.lookAt(lookTarget);
  }
}

function snapCameraToPlayer() {
  if (!playerGroup || !camera) return;
  window._smoothDefaultCamDist = null;
  window._smoothDefaultCamLift = null;
  ensureGlobalCameraViewToggleUI();
  playerGroup.position.copy(playerPos);
  applyCoreCameraByMode();
}

function startVoxelGame(mode, targetStage = 1, fromMapSelect = false) {
  discardPausedGameSession(true);
  setHudMenuOpen(false);
  closeUiTutorial(false);
  hideMissionGuideBubbleImmediately();
  MiracleGuideUI.lastAutoKey = '';
  MiracleGuideUI.activeFieldInfo = null;
  MiracleGuideUI.suppressedDuringIntro = false;
  const miniNavEl = document.getElementById('miracle-mini-nav');
  if (miniNavEl) miniNavEl.classList.add('hidden');
  const retOwBtn = document.getElementById('miracle-return-openworld-btn');
  if (retOwBtn) retOwBtn.classList.add('hidden');

  isMenuBgmActive = false;
  currentMode = mode; currentStage = targetStage; isPlaying = true;
  lastSpokenStageKey = '';
  certShownInCurrentRun = false;
  pendingFootstepsAwardQueue = [];
  _footstepsModalPrevPlaying = false;
  window.__endingModalMode = 'episode';
  if (typeof clearEndingCardFlipTimer === 'function') clearEndingCardFlipTimer();
  delete document.getElementById('cert-code').dataset.generated;
  ['ending-modal', 'adventure-badges-modal', 'stage-modal', 'retry-modal'].forEach(mid => {
    const mel = document.getElementById(mid);
    if (mel) { mel.classList.add('hidden'); mel.classList.remove('flex'); }
  });
  closeEndingWorldMapChoiceModal();
  syncOverlayModalBodyClass();

  if (!playerProgressData[currentEpisode]) {
    playerProgressData[currentEpisode] = { maxClearedStage: 0, completed: false, certIssued: false, attempts: 0 };
  }
  const epProg = playerProgressData[currentEpisode];
  enteredFromMapStageSelect = Boolean(fromMapSelect || targetStage === 4);
  enteredEndingDirectlyFromMap = Boolean(targetStage === 4);

  // 최초 1회차 플레이어 여부 기록 (튜토리얼 자동 노출 판정용: 2회차부터는 자동 노출 안 함!)
  currentRunIsFirstEpEntry = Boolean(
    !enteredEndingDirectlyFromMap &&
    targetStage === 1 &&
    (epProg.attempts || 0) === 0 &&
    !epProg.completed &&
    (epProg.maxClearedStage || 0) === 0
  );

  // 월드맵의 '엔딩 세상 둘러보기'로 직접 재진입한 경우만 제외하고,
  // 정상 플레이(재도전·새로고침·스테이지 1~3 이어하기/새 레벨 도전 포함)는 인증서 발급·갱신 허용!
  currentRunCanIssueCert = !enteredEndingDirectlyFromMap;

  epProg.attempts = (epProg.attempts || 0) + 1;
  saveLocalPlayerProgress(explorerName);

  rebuildPlayerAppearance();
  
  // 에피소드 4 전체 및 에피소드 3 스테이지 3은 '기본', 그 외 에피소드 1~3은 '내려봄' 시점으로 자동 설정
  const initialCamMode = (currentEpisode === 'miracle' || (currentEpisode === 'david' && targetStage === 3)) ? 'default' : 'topdown';
  window.setGlobalCameraViewMode(initialCamMode);

  const runEp4Opening = (
    currentEpisode === 'miracle' &&
    targetStage === 1 &&
    !window.isMiracleMultiplayerMode &&
    typeof window.runEp4OpeningSequence === 'function'
  );
  const hasDavidIntro = (currentEpisode === 'david' && (targetStage === 1 || targetStage === 2));
  const hasMiracleSt2Flyover = (currentEpisode === 'miracle' && targetStage === 2);
  const deferHudForIntro = Boolean(runEp4Opening || hasDavidIntro || hasMiracleSt2Flyover);

  // 인트로 음성·영상·하늘 조망 중에는 조이스틱·메뉴·정보창 숨김 (본격 맵 시작 시 함께 표시!)
  setInGameHudControlsVisible(!deferHudForIntro);

  const epPlugin = getActiveEpisodePlugin();
  const timerBox = document.getElementById('hud-timer-box');
  const useTimeAttackTimer = (mode === 'timeattack' && targetStage <= 3 && currentEpisode !== 'miracle');
  if (useTimeAttackTimer) {
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

  const hideGuideForSenior = isEffectiveSeniorMode(currentEpisode, mode);
  guideArrowGroup.visible = !hideGuideForSenior;
  const compassHintEl = document.getElementById('hud-compass-hint');
  if (compassHintEl) compassHintEl.classList.toggle('hidden', hideGuideForSenior);

  if (runEp4Opening && window.MiracleGuideUI) {
    window.MiracleGuideUI.suppressedDuringIntro = true;
    window.MiracleGuideUI.lastAutoKey = '';
  }

  // 에피소드 1 최초 시작 시 튜토리얼이 말풍선과 겹치지 않도록 빌드 전 잠깐 보류 후 직후 튜토리얼 실행!
  const willShowEp1Tutorial = Boolean(
    currentEpisode === 'noah' &&
    targetStage === 1 &&
    shouldAutoShowInterfaceTutorial('noah')
  );
  if (willShowEp1Tutorial) {
    window.isUiTutorialActive = true;
  }

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

  if (willShowEp1Tutorial) {
    window.isUiTutorialActive = false;
    const opened = maybeStartAutoInterfaceTutorial('noah', {
      resumePlaying: true,
      resumeTimeAttack: isTimeAttackActive
    });
    if (!opened) updateStageHUD();
  }

  if (runEp4Opening) {
    window.runEp4OpeningSequence();
  } else {
    startStageBgm(targetStage);
  }
  getAndIncrementPlayCount(explorerName);
  sendGameLogToSheet(targetStage === 1 ? '▶ 게임시작' : `🚀 스테이지${targetStage} 바로진입`, targetStage, '-');
}

function openTimeAttackRetryModal() {
  isPlaying = false; isTimeAttackActive = false; playSfx('wrong');
  setHudMenuOpen(false);
  closeUiTutorial(false);
  hideMissionGuideBubbleImmediately();
  document.getElementById('retry-modal-icon').textContent = '⏰';
  document.getElementById('retry-modal-title').textContent = '시간이 모두 끝났어요!';
  document.getElementById('retry-modal-desc').innerHTML = '아쉽게도 제한 시간 안에 미션을 완료하지 못했어요.<br/>다시 한 번 힘을 내서 도전해 볼까요?';
  const rm = document.getElementById('retry-modal');
  rm.classList.remove('hidden'); rm.classList.add('flex');
  syncOverlayModalBodyClass();
}

function openSoldierCaughtRetryModal() {
  isPlaying = false; isTimeAttackActive = false; playSfx('wrong');
  setHudMenuOpen(false);
  closeUiTutorial(false);
  hideMissionGuideBubbleImmediately();
  document.getElementById('retry-modal-icon').textContent = '🛡️';
  document.getElementById('retry-modal-title').textContent = '이집트 병사에게 3번 잡혔어요!';
  document.getElementById('retry-modal-desc').innerHTML = '바위와 산호초는 점프(🦘)로 뛰어넘고,<br/>물구덩이는 좌우로 피해서 빠르게 달려보세요!';
  const rm = document.getElementById('retry-modal');
  rm.classList.remove('hidden'); rm.classList.add('flex');
  syncOverlayModalBodyClass();
}

function retryCurrentStage() {
  const rm = document.getElementById('retry-modal');
  rm.classList.add('hidden'); rm.classList.remove('flex');
  syncOverlayModalBodyClass();
  lastSpokenStageKey = '';
  MiracleGuideUI.lastAutoKey = '';
  hideMissionGuideBubbleImmediately();

  currentRunCanIssueCert = !enteredEndingDirectlyFromMap;
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
  isTimeAttackActive = (currentMode === 'timeattack' && currentEpisode !== 'miracle' && !pauseAtStart);
  const timerBox = document.getElementById('hud-timer-box');
  if (timerBox && currentEpisode === 'miracle') {
    timerBox.classList.add('hidden');
    timerBox.classList.remove('flex');
  }
  isPlaying = !pauseAtStart;

  if (currentEpisode === 'miracle') {
    const sub = (typeof miracleSubMode !== 'undefined') ? miracleSubMode : 'openworld';
    if (sub === 'main1_storm_night' && typeof buildMiracleMainStage1NightStorm === 'function') buildMiracleMainStage1NightStorm();
    else if ((sub === 'main1_galilee' || sub === 'main1_boat') && typeof buildMiracleMainStage1Galilee === 'function') buildMiracleMainStage1Galilee();
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
  const missionBox = document.getElementById('hud-mission-box');
  if (missionBox) {
    // [전체 에피소드 공통] 상단 상시 안내창 대신 정중앙 말풍선 + 우측 상단 발광 [미션 안내] 버튼으로 통합!
    missionBox.classList.add('hidden');
  }
  syncHudMenuInfo();
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
        ? '🌈 새 세상을 걷고 방주를 둘러보거나 제단으로 가보세요!'
        : '🌈 방주를 둘러보거나 무지개 언약의 제단으로 가보세요!';
    }
  } else {
    if (currentStage === 1) {
      countIcon.textContent = '🌉';
      const builtCnt = buildZones.filter(b => b.built).length;
      badge.textContent = '홍해 · 스테이지 1'; countText.textContent = `다리 ${builtCnt}/${buildZones.length}`;
      missionText.textContent = '🪵 모세가 백성들을 데리고 이집트를 탈출했어요. 나무를 구해서 다리를 짓고 서둘러 홍해바다 앞으로 가세요.';
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

  // 모든 에피소드(1~4)의 스테이지 시작/전환 미션 메시지를 정중앙 말풍선 → 우측 상단 미션안내 버튼으로 동기화!
  if (typeof window.syncMiracleStageGuideFromHUD === 'function') {
    window.syncMiracleStageGuideFromHUD(
      badge ? badge.textContent : '',
      missionText ? missionText.textContent : '',
      countText ? countText.textContent : ''
    );
  }

  const isHudVisible = !document.getElementById('hud-top').classList.contains('hidden');
  const stageKey = `${currentEpisode}_${currentStage}`;
  const isBlocked = isAnyGlobalIntroOrCutsceneBlockingGuide();

  // 인트로·암전·카운트다운·대화창이 모두 끝났을 때만 음성을 출력하도록 조건 통합
  // (에피소드 4 주간 스테이지 1 "깊은 곳으로!"는 전용 녹음 MP3 음성만 사용하므로 HUD 자동 TTS 억제)
  const suppressStage1HudTts = (
    currentEpisode === 'miracle' &&
    typeof miracleSubMode !== 'undefined' &&
    miracleSubMode === 'main1_galilee'
  );
  if (isHudVisible && lastSpokenStageKey !== stageKey && !isBlocked) {
    lastSpokenStageKey = stageKey;
    if (!suppressStage1HudTts) {
      speakText(missionText.textContent);
    }
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
    const m = new THREE.MeshPhongMaterial({
      color: origMat.color.getHex(),
      flatShading: Boolean(origMat.flatShading),
      vertexColors: Boolean(origMat.vertexColors),
      shininess: 0,
      specular: 0x000000,
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
  const isNoahEndingStage = (currentEpisode === 'noah' && currentStage === 4);
  const _tmpWPos = new THREE.Vector3();
  for (let i = 0; i < wallMeshes.length; i++) {
    const wm = wallMeshes[i];
    if (!wm || !wm.visible || !wm.parent) continue;
    if (isNoahEndingStage && wm.userData && wm.userData.isNoahEndingArk) continue;
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
  setHudMenuOpen(false);
  closeUiTutorial(false);
  hideMissionGuideBubbleImmediately();
  recordPlayerStageClear(currentEpisode, st, { fromStageClearModal: true });

  document.getElementById('hud-mission-box').classList.add('hidden');
  const epData = EPISODE_SCRIPTURE[currentEpisode] || EPISODE_SCRIPTURE.noah;
  const info = (currentEpisode === 'miracle' && st === 1 && typeof miracleSubMode !== 'undefined' && miracleSubMode === 'main1_storm_night' && epData['1_night'])
    ? epData['1_night']
    : epData[st];
  document.getElementById('modal-title').textContent = info.title;
  document.getElementById('modal-desc').textContent = info.desc;
  document.getElementById('modal-scripture-text').textContent = info.verse;
  if (currentEpisode === 'noah') {
    speakText(info.verse);
  } else if (currentEpisode === 'miracle' && (info.verseAudioUrl || info.audioUrl)) {
    if (window.__activeVerseAudio) {
      try { window.__activeVerseAudio.pause(); } catch (e) {}
      window.__activeVerseAudio = null;
    }
    if (typeof window.speechSynthesis !== 'undefined' && window.speechSynthesis) {
      try { window.speechSynthesis.cancel(); } catch (e) {}
    }
    const targetAudioUrl = info.verseAudioUrl || info.audioUrl;
    window.__activeVerseAudio = new Audio(targetAudioUrl);
    window.__activeVerseAudio.volume = window.EP4_VOICE_VOLUME ?? 0.75;
    window.__activeVerseAudio.play().catch(() => {
      if (typeof speakText === 'function' && info.verse) {
        speakText(info.verse);
      }
    });
  } else if (currentEpisode === 'miracle') {
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
  syncOverlayModalBodyClass();

  sendGameLogToSheet(`🎉 스테이지${st} 클리어`, st, '-');
}

function proceedNextStage() {
  const modal = document.getElementById('stage-modal');
  modal.classList.add('hidden'); modal.classList.remove('flex');
  // 모달이 닫힐 때 성경절 오디오 및 TTS 재생 중단
  if (window.__activeVerseAudio) {
    try { window.__activeVerseAudio.pause(); } catch (e) {}
    window.__activeVerseAudio = null;
  }
  if (typeof window.speechSynthesis !== 'undefined' && window.speechSynthesis) {
    try { window.speechSynthesis.cancel(); } catch (e) {}
  }
  syncOverlayModalBodyClass();
  setHudMenuOpen(false);
  hideMissionGuideBubbleImmediately();

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
      setTimeout(() => {
        bf.style.opacity = '0';
        updateStageHUD();
      }, 250);
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
        setTimeout(() => {
          bf.style.opacity = '0';
          updateStageHUD();
        }, 250);
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
    setHudMenuOpen(false);
    hideMissionGuideBubbleImmediately();
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
    setHudMenuOpen(false);
    hideMissionGuideBubbleImmediately();
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
    setHudMenuOpen(false);
    hideMissionGuideBubbleImmediately();
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

// =========================================================================
// [공통: 모험의 증표] 인게임 3D 그래픽 활용 에피소드 카드 앞면 일러스트 렌더러
// =========================================================================
window.__certCardArtCache = window.__certCardArtCache || {};
let _endingCardAutoFlipTimer = null;
let _lastSentCertSheetKey = '';

function clearEndingCardFlipTimer() {
  if (_endingCardAutoFlipTimer) {
    clearTimeout(_endingCardAutoFlipTimer);
    _endingCardAutoFlipTimer = null;
  }
}

function _buildEpisodeCardDioramaScene(epId) {
  const cardScene = new THREE.Scene();
  const cardCam = new THREE.PerspectiveCamera(42, 360 / 480, 0.1, 120);

  const amb = new THREE.AmbientLight(0xffffff, 0.78);
  const hemi = new THREE.HemisphereLight(0xfef9c3, 0x334155, 0.52);
  const sun = new THREE.DirectionalLight(0xfff7ed, 1.05);
  sun.position.set(6, 12, 9);
  const rim = new THREE.DirectionalLight(0xfde047, 0.45);
  rim.position.set(-7, 6, -6);
  cardScene.add(amb, hemi, sun, rim);

  if (epId === 'noah') {
    cardScene.background = new THREE.Color(0x38bdf8);
    // 푸른 언덕 & 맑은 물가
    const hill = new THREE.Mesh(
      new THREE.CylinderGeometry(8.5, 10.5, 2.2, 24),
      new THREE.MeshLambertMaterial({ color: 0x4ade80 })
    );
    hill.position.set(0, -1.1, 0);
    cardScene.add(hill);

    // 배경 노아의 방주 선체
    const arkGrp = new THREE.Group();
    const hullDark = new THREE.MeshLambertMaterial({ color: 0x78350f });
    const hullMid = new THREE.MeshLambertMaterial({ color: 0x92400e });
    const roofMat = new THREE.MeshLambertMaterial({ color: 0xb45309 });
    const winMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const hullBase = new THREE.Mesh(new THREE.BoxGeometry(5.8, 1.65, 2.5), hullDark);
    hullBase.position.set(0, 0.85, 0);
    const hullUpper = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.9, 2.7), hullMid);
    hullUpper.position.set(0, 2.0, 0);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.05, 1.85), roofMat);
    cabin.position.set(0, 2.85, 0);
    const roofRidge = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.25, 2.15), hullDark);
    roofRidge.position.set(0, 3.45, 0);
    const arkWin = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.45, 0.12), winMat);
    arkWin.position.set(0, 2.9, 0.94);
    arkGrp.add(hullBase, hullUpper, cabin, roofRidge, arkWin);
    arkGrp.position.set(0.15, -0.05, -3.55);
    arkGrp.rotation.y = 0.24;
    cardScene.add(arkGrp);

    // 7색 무지개 아치
    const rainbowColors = [0xef4444, 0xf97316, 0xfacc15, 0x22c55e, 0x3b82f6, 0x6366f1, 0xa855f7];
    rainbowColors.forEach((col, i) => {
      const rMesh = new THREE.Mesh(
        new THREE.TorusGeometry(4.95 - i * 0.18, 0.10, 8, 36, Math.PI),
        new THREE.MeshBasicMaterial({ color: col })
      );
      rMesh.position.set(0, 1.15, -5.6);
      cardScene.add(rMesh);
    });

    // 노아 캐릭터 (인게임 3D 모델)
    const noah = createHeroMesh(false);
    noah.position.set(-0.22, 0, 0.55);
    noah.rotation.y = 0.12;
    if (playerLimbs && playerLimbs.rArm) playerLimbs.rArm.rotation.x = -0.9;
    cardScene.add(noah);

    // 동물 친구들 (인게임 3D 모델: 기린·사자·양·코끼리)
    if (typeof createSingleAnimal === 'function') {
      const giraffe = createSingleAnimal('giraffe');
      giraffe.position.set(-1.95, 0, -0.55);
      giraffe.rotation.y = 0.55;
      giraffe.scale.setScalar(0.88);
      cardScene.add(giraffe);

      const lion = createSingleAnimal('lion');
      lion.position.set(1.52, 0, 0.42);
      lion.rotation.y = -0.45;
      lion.scale.setScalar(0.86);
      cardScene.add(lion);

      const sheep = createSingleAnimal('sheep');
      sheep.position.set(-1.45, 0, 1.55);
      sheep.rotation.y = 0.35;
      sheep.scale.setScalar(0.84);
      cardScene.add(sheep);

      const elephant = createSingleAnimal('elephant');
      elephant.position.set(1.92, 0, -1.05);
      elephant.rotation.y = -0.55;
      elephant.scale.setScalar(0.76);
      cardScene.add(elephant);
    }

    // 올리브 잎을 문 비둘기
    if (typeof createDoveMesh === 'function') {
      const dove = createDoveMesh(true);
      dove.position.set(1.25, 3.25, -0.5);
      dove.rotation.y = -0.65;
      dove.scale.setScalar(0.95);
      cardScene.add(dove);
    }

    cardCam.position.set(0.1, 2.55, 7.2);
    cardCam.lookAt(0, 1.85, -0.8);
  } else if (epId === 'exodus') {
    cardScene.background = new THREE.Color(0x1d4ed8);
    // 홍해 바닥 황금 모래길
    const path = new THREE.Mesh(
      new THREE.BoxGeometry(5.6, 0.6, 16),
      new THREE.MeshLambertMaterial({ color: 0xeab308 })
    );
    path.position.set(0, -0.3, -2.5);
    cardScene.add(path);

    // 양옆으로 높이 솟은 갈라진 홍해 물벽 & 하얀 파도 거품
    const seaWallMat = new THREE.MeshLambertMaterial({ color: 0x0284c7, transparent: true, opacity: 0.88 });
    const seaDeepMat = new THREE.MeshLambertMaterial({ color: 0x0369a1 });
    const foamMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe });
    [-1, 1].forEach(side => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(3.2, 5.6, 15), seaWallMat);
      wall.position.set(side * 3.7, 2.5, -2.8);
      wall.rotation.z = side * -0.14;
      cardScene.add(wall);

      const innerWave = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.35, 14.5, 10), seaDeepMat);
      innerWave.rotation.x = Math.PI / 2;
      innerWave.position.set(side * 2.55, 3.85, -2.8);
      cardScene.add(innerWave);

      for (let k = 0; k < 6; k++) {
        const foam = new THREE.Mesh(new THREE.DodecahedronGeometry(0.52, 0), foamMat);
        foam.position.set(side * (2.15 + (k % 2) * 0.28), 4.75 + (k % 3) * 0.2, 2.2 - k * 1.9);
        cardScene.add(foam);
      }
    });

    // 하나님의 영광 빛기둥
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(1.35, 2.1, 11, 16, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.28, side: THREE.DoubleSide })
    );
    beam.position.set(0, 4.4, -2.4);
    cardScene.add(beam);

    // 십계명 두 돌판 (빛나는 황금 계명 각인)
    const tabletMat = new THREE.MeshLambertMaterial({ color: 0x94a3b8 });
    const runeMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });
    [-0.68, 0.68].forEach(tx => {
      const tab = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.48, 0.22), tabletMat);
      const arch = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.22, 14), tabletMat);
      arch.rotation.x = Math.PI / 2;
      arch.position.y = 0.72;
      tab.add(body, arch);
      for (let ln = 0; ln < 5; ln++) {
        const line = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.08, 0.04), runeMat);
        line.position.set(0, 0.45 - ln * 0.24, 0.12);
        tab.add(line);
      }
      tab.position.set(tx, 3.35, -1.85);
      tab.rotation.y = tx < 0 ? 0.14 : -0.14;
      cardScene.add(tab);
    });

    // 지팡이를 높이 든 모세 (인게임 3D 모델)
    const moses = createHeroMesh(true);
    moses.position.set(0, 0, 0.95);
    if (playerLimbs && playerLimbs.rArm) playerLimbs.rArm.rotation.x = -2.25;
    if (playerLimbs && playerLimbs.lArm) playerLimbs.lArm.rotation.x = -0.35;
    cardScene.add(moses);

    cardCam.position.set(0, 2.45, 6.75);
    cardCam.lookAt(0, 2.05, -0.8);
  } else if (epId === 'david') {
    cardScene.background = new THREE.Color(0xd97706);
    // 엘라 골짜기 햇살 들판과 시냇물
    const meadow = new THREE.Mesh(
      new THREE.CylinderGeometry(8.8, 10.5, 2.0, 24),
      new THREE.MeshLambertMaterial({ color: 0x65a30d })
    );
    meadow.position.set(0, -1.0, 0);
    cardScene.add(meadow);

    const brook = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.08, 9.0),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    brook.position.set(-0.2, 0.02, 0.5);
    brook.rotation.y = 0.25;
    cardScene.add(brook);

    // 청동 비늘 갑옷과 놋투구 거인 골리앗 (인게임 3D 모델)
    if (typeof createGiantGoliathMesh === 'function') {
      const goliath = createGiantGoliathMesh();
      goliath.scale.setScalar(0.37);
      goliath.position.set(1.38, 0, -1.45);
      goliath.rotation.y = -0.36;
      cardScene.add(goliath);
    }

    // 믿음의 목동 다윗 (인게임 3D 모델)
    if (typeof createDavidHeroMesh === 'function') {
      currentStage = 2;
      const david = createDavidHeroMesh();
      david.position.set(-1.12, 0, 1.05);
      david.rotation.y = 0.34;
      if (playerLimbs && playerLimbs.rArm) playerLimbs.rArm.rotation.x = -1.65;
      cardScene.add(david);
    }

    // 찬란한 황금 왕관 (다윗왕의 상징)
    const crownGrp = new THREE.Group();
    const goldMat = new THREE.MeshLambertMaterial({ color: 0xfacc15, emissive: 0x854d0e, emissiveIntensity: 0.35 });
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.58, 0.34, 16), goldMat);
    crownGrp.add(band);
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      const prong = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.48, 4), goldMat);
      prong.position.set(Math.cos(ang) * 0.58, 0.36, Math.sin(ang) * 0.58);
      crownGrp.add(prong);
      const jewel = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.11, 0),
        new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0xef4444 : 0x38bdf8 })
      );
      jewel.position.set(Math.cos(ang) * 0.66, 0.0, Math.sin(ang) * 0.66);
      crownGrp.add(jewel);
    }
    const crownHalo = new THREE.Mesh(
      new THREE.RingGeometry(0.72, 1.08, 24),
      new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.45, side: THREE.DoubleSide })
    );
    crownHalo.position.set(0, 0.12, -0.3);
    crownGrp.add(crownHalo);
    crownGrp.position.set(-0.75, 3.65, -0.2);
    crownGrp.rotation.x = 0.24;
    crownGrp.rotation.z = -0.1;
    cardScene.add(crownGrp);

    cardCam.position.set(0, 2.35, 6.65);
    cardCam.lookAt(0.05, 1.85, -0.45);
  } else {
    // Ep4 ('miracle'): 예수님과 제자들 + 갈릴리 언덕·하늘 구름·황금 후광
    cardScene.background = new THREE.Color(0x38bdf8);
    const mount = new THREE.Mesh(
      new THREE.CylinderGeometry(7.8, 9.8, 2.0, 20),
      new THREE.MeshLambertMaterial({ color: 0x4ade80 })
    );
    mount.position.set(0, -1.0, 0);
    cardScene.add(mount);

    const seaBack = new THREE.Mesh(
      new THREE.PlaneGeometry(36, 12),
      new THREE.MeshBasicMaterial({ color: 0x0284c7 })
    );
    seaBack.rotation.x = -Math.PI / 2;
    seaBack.position.set(0, -0.08, -8.5);
    cardScene.add(seaBack);

    // 하늘 위 포근한 저폴리곤 구름
    if (typeof createLowPolyCloudGroup === 'function') {
      const c1 = createLowPolyCloudGroup(0.75, false);
      c1.position.set(-2.3, 4.3, -3.5);
      const c2 = createLowPolyCloudGroup(0.85, false);
      c2.position.set(2.2, 4.6, -4.2);
      cardScene.add(c1, c2);
    }

    // 예수님 뒤편 따뜻한 황금 빛무리
    const aura = new THREE.Mesh(
      new THREE.CircleGeometry(1.75, 28),
      new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.45, side: THREE.DoubleSide })
    );
    aura.position.set(0, 1.65, -0.45);
    cardScene.add(aura);

    if (typeof window.createLowPolyPersonMesh === 'function') {
      const jesus = window.createLowPolyPersonMesh('jesus', 0);
      jesus.position.set(0, 0.16, 0.25);
      jesus.scale.setScalar(1.08);
      if (jesus.userData && jesus.userData.lArm && jesus.userData.rArm) {
        jesus.userData.lArm.rotation.z = 0.42;
        jesus.userData.rArm.rotation.z = -0.42;
        jesus.userData.lArm.rotation.x = -0.35;
        jesus.userData.rArm.rotation.x = -0.35;
      }
      cardScene.add(jesus);

      const d1 = window.createLowPolyPersonMesh('disciple', 0);
      d1.position.set(-1.55, 0, 0.72);
      d1.rotation.y = 0.42;
      cardScene.add(d1);

      const d2 = window.createLowPolyPersonMesh('disciple', 1);
      d2.position.set(1.55, 0, 0.65);
      d2.rotation.y = -0.42;
      cardScene.add(d2);

      const d3 = window.createLowPolyPersonMesh('disciple', 2);
      d3.position.set(-0.98, 0.05, -1.05);
      d3.rotation.y = 0.22;
      cardScene.add(d3);

      const d4 = window.createLowPolyPersonMesh('disciple', 3);
      d4.position.set(0.98, 0.05, -1.05);
      d4.rotation.y = -0.22;
      cardScene.add(d4);
    }

    cardCam.position.set(0, 2.25, 6.25);
    cardCam.lookAt(0, 1.55, -0.1);
  }

  return { cardScene, cardCam };
}

function _drawCardFallbackIllustration(ctx, W, H, meta, epId) {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, meta.gradTop || '#0ea5e9');
  grad.addColorStop(1, meta.gradBot || '#0f172a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // 따뜻한 빛무리
  const rad = ctx.createRadialGradient(W * 0.5, H * 0.40, 16, W * 0.5, H * 0.40, W * 0.48);
  rad.addColorStop(0, 'rgba(254, 240, 138, 0.62)');
  rad.addColorStop(1, 'rgba(254, 240, 138, 0)');
  ctx.fillStyle = rad;
  ctx.fillRect(0, 0, W, H);

  // 상징 이모지 조합 일러스트
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const motifs = {
    noah: ['🌈', '🛶', '🦒🦁🐑'],
    exodus: ['🌊', '📜', '⛰️✨'],
    david: ['👑', '🪨', '🛡️⚔️'],
    miracle: ['✨', '🕊️', '🍞🐟🌿']
  }[epId] || ['✨', meta.icon || '🏅', '📖'];
  ctx.font = '68px sans-serif';
  ctx.fillText(motifs[0], W * 0.5, H * 0.26);
  ctx.font = '94px sans-serif';
  ctx.fillText(motifs[1], W * 0.5, H * 0.47);
  ctx.font = '44px sans-serif';
  ctx.fillText(motifs[2], W * 0.5, H * 0.65);
}

function _paintCardOverlayFrame(ctx, W, H, meta) {
  // 하단 가독성 그라데이션 비네트
  const botGrad = ctx.createLinearGradient(0, H * 0.62, 0, H);
  botGrad.addColorStop(0, 'rgba(15, 23, 42, 0)');
  botGrad.addColorStop(0.55, 'rgba(15, 23, 42, 0.68)');
  botGrad.addColorStop(1, 'rgba(15, 23, 42, 0.94)');
  ctx.fillStyle = botGrad;
  ctx.fillRect(0, H * 0.62, W, H * 0.38);

  // 상단 살짝 비네트
  const topGrad = ctx.createLinearGradient(0, 0, 0, 76);
  topGrad.addColorStop(0, 'rgba(15, 23, 42, 0.52)');
  topGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, W, 76);

  // 황금 이중 액자 테두리
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, W - 20, H - 20);
  ctx.strokeStyle = 'rgba(254, 243, 199, 0.8)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(17, 17, W - 34, H - 34);

  // 상단 좌측 EPISODE 배지
  ctx.fillStyle = 'rgba(15, 23, 42, 0.80)';
  ctx.fillRect(24, 24, 126, 28);
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(24, 24, 126, 28);
  ctx.fillStyle = '#fde68a';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`★ ${meta.epLabel}`, 34, 38);

  // 상단 우측 별 엠블럼
  ctx.fillStyle = 'rgba(245, 158, 11, 0.92)';
  ctx.beginPath();
  ctx.arc(W - 40, 38, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fffbeb';
  ctx.font = 'bold 17px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('★', W - 40, 39);

  // 하단 에피소드 타이틀 배너
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fde68a';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('출발! 탐험대! · 모험의 증표', W * 0.5, H - 102);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px "Jua", sans-serif';
  ctx.fillText(`${meta.icon} ${meta.shortTitle}`, W * 0.5, H - 68);

  ctx.fillStyle = '#fef3c7';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText(meta.subtitle || '', W * 0.5, H - 40);
}

function _hasValidRenderedCardPixels(pixels, W, H) {
  if (!pixels || pixels.length < W * H * 4) return false;
  const step = 12;
  let totalSamples = 0;
  let visibleSamples = 0;
  let minLum = 255;
  let maxLum = 0;
  for (let y = 24; y < H - 24; y += step) {
    for (let x = 24; x < W - 24; x += step) {
      const idx = (y * W + x) * 4;
      const r = pixels[idx];
      const g = pixels[idx + 1];
      const b = pixels[idx + 2];
      const a = pixels[idx + 3];
      totalSamples++;
      if (a > 20 && (r + g + b) > 24) {
        visibleSamples++;
      }
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      if (lum < minLum) minLum = lum;
      if (lum > maxLum) maxLum = lum;
    }
  }
  if (totalSamples === 0) return false;
  return (visibleSamples / totalSamples) >= 0.15 && (maxLum - minLum) >= 12;
}

function _renderDioramaSceneToCanvas(ctx, W, H, buildSceneFn) {
  if (
    typeof THREE === 'undefined' ||
    typeof renderer === 'undefined' ||
    !renderer ||
    typeof renderer.readRenderTargetPixels !== 'function' ||
    typeof THREE.WebGLRenderTarget !== 'function'
  ) {
    return false;
  }
  const gl = typeof renderer.getContext === 'function' ? renderer.getContext() : null;
  if (gl && typeof gl.isContextLost === 'function' && gl.isContextLost()) {
    return false;
  }

  const savedCarried = carriedBlockGroup;
  const savedLimbs = playerLimbs;
  const savedStage = currentStage;
  const savedRT = typeof renderer.getRenderTarget === 'function' ? renderer.getRenderTarget() : null;
  const savedShadow = renderer.shadowMap ? renderer.shadowMap.enabled : false;
  const savedClearCol = new THREE.Color();
  if (typeof renderer.getClearColor === 'function') renderer.getClearColor(savedClearCol);
  const savedClearAlpha = typeof renderer.getClearAlpha === 'function' ? renderer.getClearAlpha() : 1;

  let rt = null;
  try {
    const built = buildSceneFn();
    if (!built || !built.cardScene || !built.cardCam) return false;
    rt = new THREE.WebGLRenderTarget(W, H, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat
    });
    if (renderer.shadowMap) renderer.shadowMap.enabled = false;
    renderer.setRenderTarget(rt);
    renderer.clear(true, true, true);
    renderer.render(built.cardScene, built.cardCam);

    const pixels = new Uint8Array(W * H * 4);
    renderer.readRenderTargetPixels(rt, 0, 0, W, H, pixels);
    if (!_hasValidRenderedCardPixels(pixels, W, H)) {
      return false;
    }

    const imgData = ctx.createImageData(W, H);
    for (let row = 0; row < H; row++) {
      const srcRow = (H - 1 - row) * W * 4;
      const dstRow = row * W * 4;
      imgData.data.set(pixels.subarray(srcRow, srcRow + W * 4), dstRow);
    }
    ctx.putImageData(imgData, 0, 0);
    return true;
  } catch (err) {
    return false;
  } finally {
    carriedBlockGroup = savedCarried;
    playerLimbs = savedLimbs;
    currentStage = savedStage;
    try {
      renderer.setRenderTarget(savedRT || null);
      if (renderer.shadowMap) renderer.shadowMap.enabled = savedShadow;
      if (typeof renderer.setClearColor === 'function') renderer.setClearColor(savedClearCol, savedClearAlpha);
      if (rt && typeof rt.dispose === 'function') rt.dispose();
    } catch (e) {}
  }
}

function renderEpisodeCardFrontDataURL(epId) {
  const key = EPISODE_ORDER.includes(epId) ? epId : 'noah';
  if (window.__certCardArtCache[key]) return window.__certCardArtCache[key];

  const meta = getEpisodeCardMeta(key);
  const W = 360, H = 480;
  let canvas = null;
  try {
    canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
  } catch (e) {
    return '';
  }
  const ctx = canvas && typeof canvas.getContext === 'function' ? canvas.getContext('2d') : null;
  if (!ctx) return '';

  const rendered3D = _renderDioramaSceneToCanvas(ctx, W, H, () => _buildEpisodeCardDioramaScene(key));
  if (!rendered3D) {
    _drawCardFallbackIllustration(ctx, W, H, meta, key);
  }
  _paintCardOverlayFrame(ctx, W, H, meta);

  try {
    const dataUrl = canvas.toDataURL('image/png');
    if (dataUrl) window.__certCardArtCache[key] = dataUrl;
    return dataUrl;
  } catch (e) {
    return '';
  }
}
window.renderEpisodeCardFrontDataURL = renderEpisodeCardFrontDataURL;

function _buildFootstepsCardDioramaScene(tierId) {
  const cardScene = new THREE.Scene();
  const cardCam = new THREE.PerspectiveCamera(42, 360 / 480, 0.1, 120);

  const amb = new THREE.AmbientLight(0xffffff, 0.80);
  const hemi = new THREE.HemisphereLight(0xfef9c3, 0x334155, 0.56);
  const sun = new THREE.DirectionalLight(0xfff7ed, 1.05);
  sun.position.set(6, 12, 9);
  const rim = new THREE.DirectionalLight(0xfde047, 0.48);
  rim.position.set(-7, 6, -6);
  cardScene.add(amb, hemi, sun, rim);

  const mkMat = (hex) => new THREE.MeshLambertMaterial({ color: hex });

  const buildMiniVillageHouse = (w, h, d, wallHex, roofHex) => {
    const hg = new THREE.Group();
    const walls = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mkMat(wallHex));
    walls.position.y = h * 0.5;
    const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, 0.24, d + 0.3), mkMat(roofHex));
    roof.position.y = h + 0.12;
    const door = new THREE.Mesh(new THREE.BoxGeometry(w * 0.28, h * 0.56, 0.08), mkMat(0x5c2d0c));
    door.position.set(0, h * 0.28, d * 0.5 + 0.02);
    const win = new THREE.Mesh(new THREE.BoxGeometry(w * 0.20, h * 0.22, 0.08), mkMat(0xfef08a));
    win.position.set(w * 0.28, h * 0.62, d * 0.5 + 0.02);
    hg.add(walls, roof, door, win);
    return hg;
  };

  const buildMiniTree = (scale = 1.0, leafHex = 0x22c55e) => {
    const tg = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14 * scale, 0.22 * scale, 1.35 * scale, 6), mkMat(0x78350f));
    trunk.position.y = 0.68 * scale;
    const c1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.88 * scale, 0), mkMat(leafHex));
    c1.position.set(0, 1.68 * scale, 0);
    c1.scale.set(1.15, 0.85, 1.1);
    const c2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.64 * scale, 0), mkMat(0x4ade80));
    c2.position.set(0.32 * scale, 2.08 * scale, 0.12 * scale);
    tg.add(trunk, c1, c2);
    return tg;
  };

  if (tierId === 'fp_1') {
    // 1단계: 갈릴리의 길벗 (마을, 길, 물항아리, 아이와 친구)
    cardScene.background = new THREE.Color(0x38bdf8);
    const ground = new THREE.Mesh(new THREE.CylinderGeometry(8.5, 10.2, 2.0, 24), mkMat(0x4ade80));
    ground.position.set(0, -1.0, 0);
    const path = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.08, 9.2), mkMat(0xd97706));
    path.position.set(-0.2, 0.03, 0.6);
    path.rotation.y = 0.22;
    const lake = new THREE.Mesh(new THREE.PlaneGeometry(18, 9), new THREE.MeshBasicMaterial({ color: 0x0284c7 }));
    lake.rotation.x = -Math.PI / 2;
    lake.position.set(-3.2, -0.04, -5.8);
    cardScene.add(ground, path, lake);

    const house = buildMiniVillageHouse(2.7, 2.1, 2.3, 0xf5e6c8, 0xd97706);
    house.position.set(1.65, 0, -2.05);
    house.rotation.y = -0.35;
    cardScene.add(house);

    const tree = buildMiniTree(1.05, 0x16a34a);
    tree.position.set(-2.05, 0, -2.25);
    cardScene.add(tree);

    if (typeof createWaterFilledAmphoraMesh === 'function') {
      const jar1 = createWaterFilledAmphoraMesh(0.84);
      jar1.position.set(-1.35, 0, 0.85);
      const jar2 = createWaterFilledAmphoraMesh(0.72);
      jar2.position.set(-0.72, 0, 1.32);
      cardScene.add(jar1, jar2);
    }

    if (typeof window.createLowPolyPersonMesh === 'function') {
      const hero = window.createLowPolyPersonMesh('hero', 0);
      hero.position.set(0.18, 0, 0.72);
      hero.rotation.y = 0.22;
      if (hero.userData && hero.userData.rArm) hero.userData.rArm.rotation.x = -1.25;
      const friend = window.createLowPolyPersonMesh('villager', 0);
      friend.position.set(1.42, 0, 0.88);
      friend.rotation.y = -0.38;
      const child = window.createLowPolyPersonMesh('child', 1);
      child.position.set(-1.28, 0, -0.55);
      child.rotation.y = 0.35;
      cardScene.add(hero, friend, child);
    }

    cardCam.position.set(0.1, 2.28, 6.7);
    cardCam.lookAt(0, 1.4, -0.55);
  } else if (tierId === 'fp_2') {
    // 2단계: 기적의 목격자 (야곱의 우물, 우물가의 여인, 혼인잔치 물항아리, 갈릴리 바다와 어선)
    cardScene.background = new THREE.Color(0x0ea5e9);
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(36, 20), new THREE.MeshBasicMaterial({ color: 0x0284c7 }));
    sea.rotation.x = -Math.PI / 2;
    sea.position.set(-2.5, -0.05, -3.5);
    const shore = new THREE.Mesh(new THREE.CylinderGeometry(5.6, 6.8, 1.6, 20), mkMat(0xeab308));
    shore.position.set(1.5, -0.78, 0.95);
    cardScene.add(sea, shore);

    // 반짝이는 흰 물결 띠
    for (let w = 0; w < 5; w++) {
      const wave = new THREE.Mesh(
        new THREE.BoxGeometry(2.1 - w * 0.18, 0.07, 0.24),
        new THREE.MeshBasicMaterial({ color: 0xe0f2fe })
      );
      wave.position.set(-1.95 + (w % 2) * 0.55, 0.02, -0.6 + w * 0.72);
      wave.rotation.y = -0.18;
      cardScene.add(wave);
    }

    // 수가성 야곱의 우물 (미니어처)
    const well = new THREE.Group();
    const wRing = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.05, 0.72, 10), mkMat(0x94a3b8));
    wRing.position.y = 0.36;
    const wWater = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.78, 0.06, 10), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    wWater.position.y = 0.70;
    const pL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.85, 6), mkMat(0x5c2d0c));
    pL.position.set(-0.82, 1.25, 0);
    const pR = pL.clone();
    pR.position.set(0.82, 1.25, 0);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.9, 6), mkMat(0x78350f));
    beam.rotation.z = Math.PI * 0.5;
    beam.position.set(0, 1.82, 0);
    const roofL = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.1, 0.95), mkMat(0x9a4f25));
    roofL.position.set(0, 2.34, 0.36);
    roofL.rotation.x = 0.48;
    const roofR = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.1, 0.95), mkMat(0x7c3a17));
    roofR.position.set(0, 2.34, -0.36);
    roofR.rotation.x = -0.48;
    const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.24, 6), mkMat(0x92400e));
    bucket.position.set(0, 1.18, 0);
    well.add(wRing, wWater, pL, pR, beam, roofL, roofR, bucket);
    well.position.set(1.15, 0.02, -0.65);
    well.rotation.y = -0.25;
    cardScene.add(well);

    if (typeof createLowPolyGalileeBoat === 'function') {
      const boat = createLowPolyGalileeBoat(0.32);
      boat.position.set(-1.65, 0.0, -1.65);
      boat.rotation.y = 0.45;
      cardScene.add(boat);
    }

    if (typeof createWaterFilledAmphoraMesh === 'function') {
      const jar1 = createWaterFilledAmphoraMesh(0.85);
      jar1.position.set(2.2, 0.02, 0.95);
      const jar2 = createWaterFilledAmphoraMesh(0.72);
      jar2.position.set(1.58, 0.02, 1.48);
      cardScene.add(jar1, jar2);
    }

    if (typeof createLowPolyFishMesh === 'function') {
      const fish = createLowPolyFishMesh('#38bdf8', 0.85, 1);
      fish.position.set(-1.45, 0.38, 1.15);
      fish.rotation.set(-0.35, 0.55, 0);
      cardScene.add(fish);
    }

    if (typeof window.createLowPolyPersonMesh === 'function') {
      const woman = window.createLowPolyPersonMesh('woman', 1);
      woman.position.set(0.15, 0.02, 0.72);
      woman.rotation.y = -0.35;
      cardScene.add(woman);
    }

    cardCam.position.set(0, 2.35, 6.8);
    cardCam.lookAt(0, 1.45, -0.5);
  } else if (tierId === 'fp_3') {
    // 3단계: 말씀을 품은 제자 (씨 뿌리는 밭, 황금 씨앗, 잃어버린 양, 반석 위의 집)
    cardScene.background = new THREE.Color(0x38bdf8);
    const hill = new THREE.Mesh(new THREE.CylinderGeometry(8.6, 10.2, 2.0, 24), mkMat(0x22c55e));
    hill.position.set(0, -1.0, 0);
    cardScene.add(hill);

    // 갈아놓은 비옥한 옥토 밭과 자라난 황금 밀
    const plot = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.14, 2.4), mkMat(0x78350f));
    plot.position.set(-1.35, 0.06, 0.8);
    plot.rotation.y = 0.15;
    cardScene.add(plot);
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 4; c++) {
        const stalk = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.65, 5), mkMat(0xfacc15));
        stalk.position.set(-2.15 + c * 0.52, 0.42, 0.1 + r * 0.65);
        cardScene.add(stalk);
      }
    }

    if (typeof createSeedBasketMesh === 'function') {
      const basket = createSeedBasketMesh(0.95);
      basket.position.set(-1.05, 0.12, 1.72);
      cardScene.add(basket);
    }

    // 반석 바위 위 지혜로운 집
    const bedrock = new THREE.Mesh(new THREE.DodecahedronGeometry(1.75, 0), mkMat(0x94a3b8));
    bedrock.scale.set(1.35, 0.55, 1.2);
    bedrock.position.set(1.55, 0.25, -1.85);
    const rockHouse = buildMiniVillageHouse(2.35, 1.75, 1.95, 0xf5e6c8, 0xb45309);
    rockHouse.position.set(1.55, 0.68, -1.85);
    rockHouse.rotation.y = -0.35;
    cardScene.add(bedrock, rockHouse);

    const mustardTree = buildMiniTree(1.25, 0x16a34a);
    mustardTree.position.set(-1.95, 0, -2.15);
    cardScene.add(mustardTree);

    if (typeof createLowPolyAnimalMesh === 'function') {
      const sheep = createLowPolyAnimalMesh('sheep', 0.96);
      sheep.position.set(0.32, 0, 1.15);
      sheep.rotation.y = -0.55;
      cardScene.add(sheep);
    }
    if (typeof window.createLowPolyPersonMesh === 'function') {
      const shepherd = window.createLowPolyPersonMesh('disciple', 2);
      shepherd.position.set(1.22, 0, 0.65);
      shepherd.rotation.y = -0.45;
      cardScene.add(shepherd);
    }

    cardCam.position.set(0, 2.3, 6.75);
    cardCam.lookAt(0, 1.4, -0.5);
  } else if (tierId === 'fp_4') {
    // 4단계: 신실한 동행자 (중풍병자 들것과 친구들, 사마리아 치료 바구니, 종려가지, 골고다 십자가)
    cardScene.background = new THREE.Color(0x4c1d95);
    const hill = new THREE.Mesh(new THREE.CylinderGeometry(8.6, 10.4, 2.0, 24), mkMat(0x65a30d));
    hill.position.set(0, -1.0, 0);
    const glow = new THREE.Mesh(
      new THREE.CircleGeometry(3.4, 28),
      new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.32, side: THREE.DoubleSide })
    );
    glow.position.set(1.3, 2.5, -3.5);
    cardScene.add(hill, glow);

    const house = buildMiniVillageHouse(2.3, 2.0, 2.0, 0xead7b7, 0xc89654);
    house.position.set(-1.75, 0, -1.55);
    house.rotation.y = 0.35;
    cardScene.add(house);

    if (typeof createOrganicLowPolyCrossMesh === 'function') {
      const cross = createOrganicLowPolyCrossMesh(0.76, { withBase: true, withPlaque: true });
      cross.position.set(1.42, 0.15, -1.85);
      cross.rotation.y = -0.25;
      cardScene.add(cross);
    }

    // 들것 (가로 목재 폴 + 천 + 친구들)
    const stretcher = new THREE.Group();
    const poleL = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.1, 6), mkMat(0x78350f));
    poleL.rotation.x = Math.PI / 2;
    poleL.position.set(-0.42, 0.58, 0);
    const poleR = poleL.clone();
    poleR.position.set(0.42, 0.58, 0);
    const bed = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.12, 1.45), mkMat(0xf8fafc));
    bed.position.set(0, 0.62, 0);
    const patient = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.28, 1.05), mkMat(0x38bdf8));
    patient.position.set(0, 0.78, 0);
    stretcher.add(poleL, poleR, bed, patient);
    stretcher.position.set(-0.55, 0, 0.55);
    stretcher.rotation.y = 0.25;
    cardScene.add(stretcher);

    if (typeof window.createLowPolyPersonMesh === 'function') {
      const f1 = window.createLowPolyPersonMesh('disciple', 0);
      f1.position.set(-1.35, 0, 0.95);
      f1.rotation.y = 0.45;
      const f2 = window.createLowPolyPersonMesh('disciple', 1);
      f2.position.set(0.42, 0, 0.62);
      f2.rotation.y = -0.35;
      cardScene.add(f1, f2);
    }
    if (typeof createFirstAidKitMesh === 'function') {
      const aid = createFirstAidKitMesh(0.92);
      aid.position.set(-0.2, 0, 1.65);
      cardScene.add(aid);
    }
    if (typeof createPalmBranchMesh === 'function') {
      const palm = createPalmBranchMesh(0.9);
      palm.position.set(1.42, 0.06, 1.25);
      palm.rotation.y = -0.6;
      cardScene.add(palm);
    }

    cardCam.position.set(0, 2.35, 6.9);
    cardCam.lookAt(0, 1.65, -0.5);
  } else {
    // 5단계: 부활의 기쁜 증인 (열린 빈 무덤, 부활하신 예수님, 천사, 갈릴리 아침식사 모닥불, 빛나는 왕관)
    cardScene.background = new THREE.Color(0x0284c7);
    const garden = new THREE.Mesh(new THREE.CylinderGeometry(8.6, 10.2, 2.0, 24), mkMat(0x4ade80));
    garden.position.set(0, -1.0, 0);
    const sunriseHalo = new THREE.Mesh(
      new THREE.CircleGeometry(2.6, 28),
      new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.52, side: THREE.DoubleSide })
    );
    sunriseHalo.position.set(0, 2.05, -2.5);
    cardScene.add(garden, sunriseHalo);

    if (typeof createLowPolyCloudGroup === 'function') {
      const cl = createLowPolyCloudGroup(0.65, false);
      cl.position.set(-2.2, 4.4, -4.0);
      cardScene.add(cl);
    }

    if (typeof createDetailedOrganicTombGroup === 'function') {
      const tomb = createDetailedOrganicTombGroup({ scale: 0.36, openGlow: true });
      tomb.position.set(-1.15, 0, -2.05);
      tomb.rotation.y = 0.25;
      cardScene.add(tomb);
    }

    if (typeof window.createLowPolyPersonMesh === 'function') {
      const jesus = window.createLowPolyPersonMesh('jesus', 0);
      jesus.position.set(0, 0.14, 0.1);
      jesus.scale.setScalar(1.06);
      if (jesus.userData && jesus.userData.lArm && jesus.userData.rArm) {
        jesus.userData.lArm.rotation.x = -0.65;
        jesus.userData.rArm.rotation.x = -0.65;
        jesus.userData.lArm.rotation.z = 0.45;
        jesus.userData.rArm.rotation.z = -0.45;
      }
      const angel = window.createLowPolyPersonMesh('angel', 0);
      angel.position.set(-1.62, 0, 0.45);
      angel.rotation.y = 0.48;
      const disciple = window.createLowPolyPersonMesh('disciple', 0);
      disciple.position.set(1.55, 0, 0.45);
      disciple.rotation.y = -0.45;
      cardScene.add(jesus, angel, disciple);
    }

    if (typeof createGalileeCampfireMesh === 'function') {
      const fire = createGalileeCampfireMesh(false, 0.72);
      fire.position.set(1.38, 0, 1.38);
      cardScene.add(fire);
    }
    if (typeof createLowPolyFishMesh === 'function') {
      const fish = createLowPolyFishMesh('#f59e0b', 0.72, 0);
      fish.position.set(0.62, 0.26, 1.55);
      fish.rotation.y = -0.4;
      cardScene.add(fish);
    }

    // 떠 있는 찬란한 황금 왕관
    const crownGrp = new THREE.Group();
    const goldMat = new THREE.MeshLambertMaterial({ color: 0xfacc15, emissive: 0x854d0e, emissiveIntensity: 0.35 });
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.54, 0.32, 16), goldMat);
    crownGrp.add(band);
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      const prong = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.44, 4), goldMat);
      prong.position.set(Math.cos(ang) * 0.54, 0.34, Math.sin(ang) * 0.54);
      const gem = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.095, 0),
        new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0xef4444 : 0x38bdf8 })
      );
      gem.position.set(Math.cos(ang) * 0.62, 0, Math.sin(ang) * 0.62);
      crownGrp.add(prong, gem);
    }
    crownGrp.position.set(0, 3.65, -0.3);
    crownGrp.rotation.x = 0.22;
    cardScene.add(crownGrp);

    cardCam.position.set(0, 2.32, 6.85);
    cardCam.lookAt(0, 1.65, -0.45);
  }

  return { cardScene, cardCam };
}

function _drawFootstepsSymbolEmblem(ctx, cx, cy, r, meta) {
  ctx.save();
  ctx.fillStyle = meta.badgeBg || 'rgba(15, 23, 42, 0.9)';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = meta.innerBorder || '#fef3c7';
  ctx.lineWidth = 2;
  ctx.stroke();

  const key = meta.symbolKey || 'leaf';
  ctx.translate(cx, cy);
  if (key === 'leaf') {
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.moveTo(-7, 6);
    ctx.quadraticCurveTo(-8, -8, 8, -8);
    ctx.quadraticCurveTo(7, 7, -7, 6);
    ctx.fill();
    ctx.strokeStyle = '#9a4f16';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-8, 7);
    ctx.lineTo(5, -5);
    ctx.stroke();
  } else if (key === 'wave') {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    [-4, 2].forEach(oy => {
      ctx.beginPath();
      ctx.moveTo(-9, oy);
      ctx.quadraticCurveTo(-4, oy - 4, 0, oy);
      ctx.quadraticCurveTo(4, oy + 4, 9, oy);
      ctx.stroke();
    });
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(5, -6, 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (key === 'seed') {
    ctx.fillStyle = '#fde047';
    [[-4, 2, -0.4], [0, -3, 0], [4, 2, 0.4]].forEach(([sx, sy, rot]) => {
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.ellipse(0, 0, 3.2, 5.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  } else if (key === 'olive') {
    ctx.strokeStyle = '#dcfce7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, 7);
    ctx.quadraticCurveTo(-1, 0, 8, -7);
    ctx.stroke();
    ctx.fillStyle = '#86efac';
    [[-4, 1, -0.7], [-1, 4, 0.8], [2, -3, -0.6], [5, 0, 0.7]].forEach(([lx, ly, rot]) => {
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.ellipse(0, 0, 2.4, 4.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  } else {
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.moveTo(-8, 5);
    ctx.lineTo(-9, -4);
    ctx.lineTo(-4, 0);
    ctx.lineTo(0, -7);
    ctx.lineTo(4, 0);
    ctx.lineTo(9, -4);
    ctx.lineTo(8, 5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, 1.5, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function _drawFootstepsFallbackIllustration(ctx, W, H, meta) {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, meta.gradTop || '#0ea5e9');
  grad.addColorStop(1, meta.gradBot || '#0f172a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  const rad = ctx.createRadialGradient(W * 0.5, H * 0.38, 16, W * 0.5, H * 0.38, W * 0.48);
  rad.addColorStop(0, 'rgba(254, 240, 138, 0.62)');
  rad.addColorStop(1, 'rgba(254, 240, 138, 0)');
  ctx.fillStyle = rad;
  ctx.fillRect(0, 0, W, H);

  const motifs = {
    fp_1: ['🍃', '🏺', '🏠🌾'],
    fp_2: ['🌊', '⛵', '🏺✨'],
    fp_3: ['🌾', '🐑', '🏠🪨'],
    fp_4: ['🌿', '✝️', '🛏️🩹'],
    fp_5: ['👑', '🕊️', '🌅🔥🐟']
  }[meta.id] || [meta.symbolIcon || '✨', '👣', '📖'];

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '62px sans-serif';
  ctx.fillText(motifs[0], W * 0.5, H * 0.25);
  ctx.font = '90px sans-serif';
  ctx.fillText(motifs[1], W * 0.5, H * 0.47);
  ctx.font = '42px sans-serif';
  ctx.fillText(motifs[2], W * 0.5, H * 0.65);
}

function _paintFootstepsCardOverlayFrame(ctx, W, H, meta) {
  const botGrad = ctx.createLinearGradient(0, H * 0.60, 0, H);
  botGrad.addColorStop(0, 'rgba(15, 23, 42, 0)');
  botGrad.addColorStop(0.55, 'rgba(15, 23, 42, 0.72)');
  botGrad.addColorStop(1, 'rgba(15, 23, 42, 0.95)');
  ctx.fillStyle = botGrad;
  ctx.fillRect(0, H * 0.60, W, H * 0.40);

  const topGrad = ctx.createLinearGradient(0, 0, 0, 76);
  topGrad.addColorStop(0, 'rgba(15, 23, 42, 0.52)');
  topGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, W, 76);

  // 단계별 고유 색상 이중 테두리
  ctx.strokeStyle = meta.borderColor || '#fbbf24';
  ctx.lineWidth = 8;
  ctx.strokeRect(10, 10, W - 20, H - 20);
  ctx.strokeStyle = meta.innerBorder || 'rgba(254, 243, 199, 0.85)';
  ctx.lineWidth = 2;
  ctx.strokeRect(18, 18, W - 36, H - 36);

  // 상단 좌측 단계 배지
  const reqLabel = meta.isAllClear ? '전체 완료' : `누적 ${meta.requiredCount}개`;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.84)';
  ctx.fillRect(24, 24, 152, 28);
  ctx.strokeStyle = meta.borderColor || '#fbbf24';
  ctx.lineWidth = 1.6;
  ctx.strokeRect(24, 24, 152, 28);
  ctx.fillStyle = '#fef3c7';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`★ ${meta.stageLabel} · ${reqLabel}`, 33, 38);

  // 상단 우측 상징 메달리온
  _drawFootstepsSymbolEmblem(ctx, W - 41, 39, 17, meta);

  // 하단 카드 명칭 & 상징 배너
  ctx.textAlign = 'center';
  ctx.fillStyle = meta.innerBorder || '#fde68a';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('예수님의 발자취 · 에피소드 4', W * 0.5, H - 102);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px "Jua", sans-serif';
  ctx.fillText(`${meta.symbolIcon} ${meta.title}`, W * 0.5, H - 68);

  ctx.fillStyle = '#fef3c7';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText(`상징: ${meta.symbolName} · ${reqLabel}`, W * 0.5, H - 40);
}

function renderFootstepsCardFrontDataURL(tierId) {
  const key = FOOTSTEPS_CARD_ORDER.includes(tierId) ? tierId : 'fp_1';
  const cacheKey = `fp_${key}`;
  if (window.__certCardArtCache[cacheKey]) return window.__certCardArtCache[cacheKey];

  const meta = FOOTSTEPS_CARD_META[key];
  const W = 360, H = 480;
  let canvas = null;
  try {
    canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
  } catch (e) {
    return '';
  }
  const ctx = canvas && typeof canvas.getContext === 'function' ? canvas.getContext('2d') : null;
  if (!ctx) return '';

  const rendered3D = _renderDioramaSceneToCanvas(ctx, W, H, () => _buildFootstepsCardDioramaScene(key));
  if (!rendered3D) {
    _drawFootstepsFallbackIllustration(ctx, W, H, meta);
  }
  _paintFootstepsCardOverlayFrame(ctx, W, H, meta);

  try {
    const dataUrl = canvas.toDataURL('image/png');
    if (dataUrl) window.__certCardArtCache[cacheKey] = dataUrl;
    return dataUrl;
  } catch (e) {
    return '';
  }
}
window.renderFootstepsCardFrontDataURL = renderFootstepsCardFrontDataURL;

function setEndingCertCardFlipped(flipped, withSfx = false) {
  const card = document.getElementById('ending-cert-card');
  const hint = document.getElementById('ending-card-flip-hint');
  if (!card) return;
  card.classList.remove('is-dragging');
  card.style.transform = '';
  card.classList.toggle('is-flipped', Boolean(flipped));
  if (hint) {
    if (window.__endingModalMode === 'footsteps') {
      hint.textContent = flipped
        ? '✨ 좌우 스와이프 · 터치해서 앞면 그림 보기 ↻'
        : '✨ 좌우 스와이프 · 터치해서 발자취 카드 보기 ↻';
    } else {
      hint.textContent = flipped
        ? '✨ 좌우 스와이프 · 터치해서 앞면 그림 보기 ↻'
        : '✨ 좌우 스와이프 · 터치해서 뒷면 인증서 보기 ↻';
    }
  }
  if (withSfx) playSfx('switch');
}

function toggleEndingCertCardFlip() {
  if (Date.now() < (window._endingDragSuppressClickUntil || 0)) return;
  clearEndingCardFlipTimer();
  const card = document.getElementById('ending-cert-card');
  if (!card) return;
  const nextFlipped = !card.classList.contains('is-flipped');
  setEndingCertCardFlipped(nextFlipped, true);
}
window.toggleEndingCertCardFlip = toggleEndingCertCardFlip;

function bindEndingCertCardSwipeInteraction() {
  const scene = document.getElementById('ending-cert-scene');
  const card = document.getElementById('ending-cert-card');
  if (!scene || !card || scene._swipeBound) return;
  scene._swipeBound = true;

  let active = false;
  let activePointerId = null;
  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let lastT = 0;
  let vx = 0;
  let baseAngle = 0;
  let movedHoriz = false;

  const finishDrag = (endX) => {
    if (!active) return;
    active = false;
    activePointerId = null;
    card.classList.remove('is-dragging');
    card.style.transform = '';

    const dx = endX - startX;
    if (movedHoriz || Math.abs(dx) > 8) {
      window._endingDragSuppressClickUntil = Date.now() + 360;
      const wasFlipped = card.classList.contains('is-flipped');
      if (Math.abs(dx) > 38 || Math.abs(vx) > 0.32) {
        setEndingCertCardFlipped(!wasFlipped, true);
      } else {
        setEndingCertCardFlipped(wasFlipped, false);
      }
    }
  };

  scene.addEventListener('dragstart', (e) => e.preventDefault());
  scene.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    active = true;
    activePointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    lastX = e.clientX;
    lastT = performance.now();
    vx = 0;
    movedHoriz = false;
    baseAngle = card.classList.contains('is-flipped') ? 180 : 0;
  });

  window.addEventListener('pointermove', (e) => {
    if (!active || (activePointerId !== null && e.pointerId !== activePointerId)) return;
    const now = performance.now();
    const dt = Math.max(8, now - lastT);
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    vx = (e.clientX - lastX) / dt;
    lastX = e.clientX;
    lastT = now;

    if (!movedHoriz && Math.abs(dx) > 6 && Math.abs(dx) >= Math.abs(dy) * 0.75) {
      movedHoriz = true;
      clearEndingCardFlipTimer();
      card.classList.add('is-dragging');
    }
    if (movedHoriz) {
      const rotY = baseAngle + Math.max(-195, Math.min(195, dx * 0.68));
      const tiltX = Math.max(-10, Math.min(10, -dy * 0.12));
      card.style.transform = `rotateY(${rotY.toFixed(1)}deg) rotateX(${tiltX.toFixed(1)}deg)`;
    }
  });

  window.addEventListener('pointerup', (e) => {
    if (!active || (activePointerId !== null && e.pointerId !== activePointerId)) return;
    finishDrag(e.clientX);
  });

  window.addEventListener('pointercancel', (e) => {
    if (!active || (activePointerId !== null && e.pointerId !== activePointerId)) return;
    finishDrag(lastX);
  });
}

function _applyEndingModalVisualMode(mode, footstepsMeta = null) {
  window.__endingModalMode = mode;
  bindEndingCertCardSwipeInteraction();
  const frontFace = document.getElementById('ending-card-front-face');
  const backFace = document.getElementById('ending-card-back-face');
  const frontPill = document.getElementById('ending-card-front-pill');
  const epBody = document.getElementById('ending-cert-episode-body');
  const fpBody = document.getElementById('ending-cert-footsteps-body');
  const epActs = document.getElementById('ending-card-episode-actions');
  const fpActs = document.getElementById('ending-card-footsteps-actions');

  if (mode === 'footsteps' && footstepsMeta) {
    if (epBody) { epBody.classList.add('hidden'); epBody.classList.remove('flex'); }
    if (fpBody) { fpBody.classList.remove('hidden'); fpBody.classList.add('flex'); }
    if (epActs) { epActs.classList.add('hidden'); epActs.classList.remove('flex'); }
    if (fpActs) { fpActs.classList.remove('hidden'); fpActs.classList.add('flex'); }
    if (frontFace) frontFace.style.borderColor = footstepsMeta.borderColor;
    if (backFace) {
      backFace.style.borderColor = footstepsMeta.borderColor;
      backFace.style.background = footstepsMeta.backGrad;
    }
    if (frontPill) frontPill.textContent = '✨ 터치해서 발자취 카드 보기 ↻';
  } else {
    if (fpBody) { fpBody.classList.add('hidden'); fpBody.classList.remove('flex'); }
    if (epBody) { epBody.classList.remove('hidden'); epBody.classList.add('flex'); }
    if (fpActs) { fpActs.classList.add('hidden'); fpActs.classList.remove('flex'); }
    if (epActs) { epActs.classList.remove('hidden'); epActs.classList.add('flex'); }
    if (frontFace) frontFace.style.borderColor = '#f59e0b';
    if (backFace) {
      backFace.style.borderColor = '#f59e0b';
      backFace.style.background = '';
    }
    if (frontPill) frontPill.textContent = '✨ 터치해서 뒷면 인증서 보기 ↻';
  }
}

function showEndingCertificate(opts = {}) {
  setHudMenuOpen(false);
  hideMissionGuideBubbleImmediately();
  clearEndingCardFlipTimer();
  joyX = 0; joyY = 0; keys = {}; currentMoveSpeed = 0;
  const knobEl = document.getElementById('joystick-knob');
  if (knobEl) knobEl.style.transform = 'translate(0,0)';

  const epKey = (opts && opts.episode && EPISODE_ORDER.includes(opts.episode)) ? opts.episode : currentEpisode;
  const forceShow = Boolean(opts && opts.forceShow);

  // [전체 에피소드 공통 요청사항] 2회차 이상의 같은 레벨 재도전/맵 재선택으로 엔딩에 들어온 경우에는
  // 인증서 대신 [월드맵으로 이동하기 / 모험의 증표 보기 / 엔딩 세상 계속 둘러보기] 선택창을 출력!
  if (!forceShow && !certShownInCurrentRun && !canShowCertificateForCurrentRun()) {
    const certBtn = document.getElementById('cert-open-btn');
    if (certBtn) certBtn.classList.add('hidden');
    showEndingWorldMapChoiceModal();
    return;
  }

  certShownInCurrentRun = true;
  const certBtnShown = document.getElementById('cert-open-btn');
  if (certBtnShown) certBtnShown.classList.add('hidden');
  if (epKey === 'noah' && targetObject && targetObject.type === 'altar' && targetObject.label) {
    targetObject.label.innerHTML = '🪨 감사의 제단 (다가가면 월드맵 이동 선택창이 열려요!)';
  }
  _applyEndingModalVisualMode('episode');

  // 에피소드당 1장의 인증서를 발급·보존하고, 이번 클리어 레벨을 누적 추가!
  const upsertResult = upsertEpisodeAdventureCert(epKey, currentMode);
  const cert = upsertResult ? upsertResult.cert : adventureCertsData[epKey];
  recordPlayerStageClear(epKey, 4);

  const meta = getEpisodeCardMeta(epKey);
  const certNameEl = document.getElementById('cert-name-display');
  const certDeptEl = document.getElementById('cert-dept');
  const certLevelsEl = document.getElementById('cert-levels-display');
  const certDateEl = document.getElementById('cert-date-display');
  const certCodeEl = document.getElementById('cert-code');
  const badgeEl = document.getElementById('ending-ep-badge');
  const titleEl = document.getElementById('ending-main-title');
  const verseEl = document.getElementById('ending-main-verse');
  const missionEl = document.getElementById('cert-mission-display');
  const frontImg = document.getElementById('ending-card-front-img');

  if (certNameEl) certNameEl.textContent = (cert && cert.playerName) || explorerName || '믿음의용사';
  if (certDeptEl) certDeptEl.textContent = (MODE_META[currentMode] && MODE_META[currentMode].dept) || '🌱 유년반';
  if (certLevelsEl) certLevelsEl.innerHTML = renderClearedLevelPillsHTML(cert ? cert.clearedModes : [currentMode]);
  if (certDateEl) certDateEl.textContent = (cert && cert.updatedAt) || formatAdventureCertDate();
  if (badgeEl) badgeEl.textContent = meta.badge;
  if (titleEl) titleEl.textContent = meta.title;
  if (verseEl) verseEl.textContent = meta.verse;
  if (missionEl) missionEl.textContent = meta.mission;

  if (certCodeEl && cert) {
    certCodeEl.textContent = cert.code;
    certCodeEl.dataset.generated = '1';
    const sheetKey = `${epKey}:${currentMode}:${cert.code}`;
    if (_lastSentCertSheetKey !== sheetKey) {
      _lastSentCertSheetKey = sheetKey;
      sendGameLogToSheet('🏆 완주성공', 4, cert.code);
    }
  }

  // 앞면 인게임 3D 그래픽 카드 이미지 생성 및 장착
  if (frontImg) {
    const artUrl = renderEpisodeCardFrontDataURL(epKey);
    if (artUrl) frontImg.src = artUrl;
  }

  const em = document.getElementById('ending-modal');
  const owCertBtn = document.getElementById('ending-return-openworld-btn');
  const alreadyInEp4OpenWorld = (epKey === 'miracle' && typeof miracleSubMode !== 'undefined' && miracleSubMode === 'openworld');
  if (owCertBtn) {
    owCertBtn.classList.toggle('hidden', epKey !== 'miracle' || alreadyInEp4OpenWorld);
  }

  // 카드 앞면으로 초기화 후 밝게 빛나며 등장 ("빠밤~!")
  const cardScene = document.getElementById('ending-cert-scene');
  const rays = document.getElementById('ending-reveal-rays');
  setEndingCertCardFlipped(false, false);
  if (cardScene) {
    cardScene.classList.remove('reveal-flash');
    void cardScene.offsetWidth;
    cardScene.classList.add('reveal-flash');
  }
  if (rays) {
    rays.classList.remove('active');
    void rays.offsetWidth;
    rays.classList.add('active');
  }

  em.classList.remove('hidden'); em.classList.add('flex');
  syncOverlayModalBodyClass();
  playSfx('card_reveal');

  // 앞면 카드 일러스트를 빛나며 감상한 뒤 자동으로 뒷면 인증서 내용으로 전환
  _endingCardAutoFlipTimer = setTimeout(() => {
    _endingCardAutoFlipTimer = null;
    if (em && !em.classList.contains('hidden')) {
      setEndingCertCardFlipped(true, true);
    }
  }, 2200);
}

window.openCertificateModal = showEndingCertificate;

function showFootstepsCardAwardModal(tierId) {
  const meta = FOOTSTEPS_CARD_META[tierId];
  if (!meta) return;

  setHudMenuOpen(false);
  hideMissionGuideBubbleImmediately();
  clearEndingCardFlipTimer();

  _footstepsModalPrevPlaying = Boolean(isPlaying);
  isPlaying = false;
  joyX = 0; joyY = 0; keys = {}; currentMoveSpeed = 0;

  let cert = footstepsCertsData[tierId];
  if (!cert) {
    const total = typeof window.getMiracleTotalMissionCount === 'function' ? window.getMiracleTotalMissionCount() : 22;
    const count = typeof window.getMiracleCompletedMissionCount === 'function' ? window.getMiracleCompletedMissionCount() : getFootstepsRequiredCount(tierId, total);
    syncFootstepsMilestonesFromCount(count, total);
    cert = footstepsCertsData[tierId];
  }

  _applyEndingModalVisualMode('footsteps', meta);

  const badgeEl = document.getElementById('ending-fp-badge');
  const titleEl = document.getElementById('ending-fp-title');
  const descEl = document.getElementById('ending-fp-desc');
  const boxEl = document.getElementById('ending-fp-box');
  const nameEl = document.getElementById('fp-name-display');
  const symEl = document.getElementById('fp-symbol-display');
  const mileEl = document.getElementById('fp-milestone-display');
  const codeEl = document.getElementById('fp-code-display');
  const dateEl = document.getElementById('fp-date-display');
  const frontImg = document.getElementById('ending-card-front-img');

  const reqCount = getFootstepsRequiredCount(tierId, cert && cert.totalCount);
  const milestoneText = meta.isAllClear ? `에피소드 4 전체 미션 완료 (${reqCount}개)` : `에피소드 4 누적 ${reqCount}개 미션 완료`;

  if (badgeEl) {
    badgeEl.textContent = `👣 예수님의 발자취 · ${meta.stageLabel}`;
    badgeEl.style.backgroundColor = meta.badgeBg;
  }
  if (titleEl) titleEl.textContent = meta.title;
  if (descEl) descEl.textContent = meta.desc;
  if (boxEl) boxEl.style.borderColor = meta.borderColor;
  if (nameEl) nameEl.textContent = (cert && cert.playerName) || explorerName || '믿음의용사';
  if (symEl) symEl.textContent = `${meta.symbolIcon} ${meta.symbolName}`;
  if (mileEl) mileEl.textContent = milestoneText;
  if (codeEl) codeEl.textContent = (cert && cert.code) || (meta.prefix + '000');
  if (dateEl) dateEl.textContent = (cert && cert.issuedAt) || formatAdventureCertDate();

  if (frontImg) {
    const artUrl = renderFootstepsCardFrontDataURL(tierId);
    if (artUrl) frontImg.src = artUrl;
  }

  const em = document.getElementById('ending-modal');
  const cardScene = document.getElementById('ending-cert-scene');
  const rays = document.getElementById('ending-reveal-rays');
  setEndingCertCardFlipped(false, false);
  if (cardScene) {
    cardScene.classList.remove('reveal-flash');
    void cardScene.offsetWidth;
    cardScene.classList.add('reveal-flash');
  }
  if (rays) {
    rays.classList.remove('active');
    void rays.offsetWidth;
    rays.classList.add('active');
  }

  em.classList.remove('hidden');
  em.classList.add('flex');
  syncOverlayModalBodyClass();
  playSfx('card_reveal');

  _endingCardAutoFlipTimer = setTimeout(() => {
    _endingCardAutoFlipTimer = null;
    if (em && !em.classList.contains('hidden')) {
      setEndingCertCardFlipped(true, true);
    }
  }, 2200);
}
window.showFootstepsCardAwardModal = showFootstepsCardAwardModal;

function closeFootstepsAwardModal() {
  clearEndingCardFlipTimer();
  const em = document.getElementById('ending-modal');
  if (em) { em.classList.add('hidden'); em.classList.remove('flex'); }
  syncOverlayModalBodyClass();
  if (_footstepsModalPrevPlaying) {
    isPlaying = true;
  }
  _footstepsModalPrevPlaying = false;
  setTimeout(() => {
    if (typeof flushPendingFootstepsCardAward === 'function') {
      flushPendingFootstepsCardAward();
    }
  }, 260);
}
window.closeFootstepsAwardModal = closeFootstepsAwardModal;

// =========================================================================
// [공통] 모험의 증표 카드 수집함 (에피소드 / 예수님의 발자취 탭 · 횡스크롤 · 터치 3D 플립)
// =========================================================================
let currentAdventureBadgesTab = 'episodes';

function toggleBadgeGalleryCardFlip(cardDomKey) {
  if (Date.now() < (window._badgeTrackSuppressClickUntil || 0)) return;
  const card = document.getElementById(`badge-gallery-card-${cardDomKey}`);
  if (!card) return;
  card.classList.toggle('is-flipped');
  playSfx('switch');
}
window.toggleBadgeGalleryCardFlip = toggleBadgeGalleryCardFlip;

function bindBadgesTrackSwipeInteraction(track) {
  if (!track || track._swipeBound) return;
  track._swipeBound = true;

  track.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      track.scrollLeft += e.deltaY;
      e.preventDefault();
    }
  }, { passive: false });

  let isDown = false;
  let pointerId = null;
  let startX = 0;
  let startY = 0;
  let startScrollLeft = 0;
  let lastX = 0;
  let lastT = 0;
  let velocity = 0;
  let didDrag = false;
  let momentumRaf = 0;

  const setTrackTilt = (deg) => {
    track.style.setProperty('--swipe-tilt', `${deg.toFixed(1)}deg`);
  };

  const stopMomentum = () => {
    if (momentumRaf) {
      cancelAnimationFrame(momentumRaf);
      momentumRaf = 0;
    }
  };

  const snapToNearestCard = () => {
    const slots = track.querySelectorAll('.badge-gallery-slot');
    if (!slots || slots.length === 0) return;
    const center = track.scrollLeft + track.clientWidth * 0.5;
    let bestTarget = track.scrollLeft;
    let bestDist = Infinity;
    slots.forEach((slot) => {
      const slotCenter = slot.offsetLeft + slot.offsetWidth * 0.5;
      const d = Math.abs(slotCenter - center);
      if (d < bestDist) {
        bestDist = d;
        bestTarget = Math.max(0, slotCenter - track.clientWidth * 0.5);
      }
    });
    track.classList.remove('is-pointer-dragging');
    setTrackTilt(0);
    if (typeof track.scrollTo === 'function') {
      track.scrollTo({ left: bestTarget, behavior: 'smooth' });
    } else {
      track.scrollLeft = bestTarget;
    }
  };

  track.addEventListener('dragstart', (e) => e.preventDefault());
  track.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    stopMomentum();
    isDown = true;
    pointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    lastX = e.clientX;
    lastT = performance.now();
    startScrollLeft = track.scrollLeft;
    velocity = 0;
    didDrag = false;
  });

  window.addEventListener('pointermove', (e) => {
    if (!isDown || (pointerId !== null && e.pointerId !== pointerId)) return;
    const now = performance.now();
    const dt = Math.max(8, now - lastT);
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const stepDx = e.clientX - lastX;
    lastX = e.clientX;
    lastT = now;

    if (!didDrag && Math.abs(dx) > 6 && Math.abs(dx) >= Math.abs(dy) * 0.8) {
      didDrag = true;
      track.classList.add('is-pointer-dragging');
    }
    if (didDrag) {
      track.scrollLeft = startScrollLeft - dx;
      velocity = stepDx / dt;
      setTrackTilt(Math.max(-9, Math.min(9, stepDx * 0.45)));
    }
  });

  const endSwipe = () => {
    if (!isDown) return;
    isDown = false;
    pointerId = null;
    if (!didDrag) {
      setTrackTilt(0);
      return;
    }
    window._badgeTrackSuppressClickUntil = Date.now() + 380;

    let coastV = Math.max(-2.6, Math.min(2.6, velocity)) * 16;
    if (Math.abs(coastV) < 1.2) {
      snapToNearestCard();
      return;
    }
    const tick = () => {
      track.scrollLeft -= coastV;
      setTrackTilt(Math.max(-8, Math.min(8, coastV * 0.35)));
      coastV *= 0.90;
      if (Math.abs(coastV) > 0.65 && track.scrollLeft > 0 && track.scrollLeft < track.scrollWidth - track.clientWidth) {
        momentumRaf = requestAnimationFrame(tick);
      } else {
        momentumRaf = 0;
        snapToNearestCard();
      }
    };
    momentumRaf = requestAnimationFrame(tick);
  };

  window.addEventListener('pointerup', (e) => {
    if (!isDown || (pointerId !== null && e.pointerId !== pointerId)) return;
    endSwipe();
  });
  window.addEventListener('pointercancel', (e) => {
    if (!isDown || (pointerId !== null && e.pointerId !== pointerId)) return;
    endSwipe();
  });

  const badgesModal = document.getElementById('adventure-badges-modal');
  if (badgesModal && !badgesModal._arrowNavBound) {
    badgesModal._arrowNavBound = true;
    document.addEventListener('keydown', (e) => {
      if (badgesModal.classList.contains('hidden')) return;
      if (e.key === 'ArrowRight') {
        track.scrollBy({ left: 230, behavior: 'smooth' });
      } else if (e.key === 'ArrowLeft') {
        track.scrollBy({ left: -230, behavior: 'smooth' });
      }
    });
  }
}

function setAdventureBadgesTab(tabKey) {
  currentAdventureBadgesTab = (tabKey === 'footsteps') ? 'footsteps' : 'episodes';
  const epBtn = document.getElementById('badges-tab-episodes');
  const fpBtn = document.getElementById('badges-tab-footsteps');
  const activeCls = 'badges-tab-btn mc-btn-slim px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-jua text-xs sm:text-sm';
  const idleCls = 'badges-tab-btn mc-btn-slim px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-jua text-xs sm:text-sm';
  if (epBtn) epBtn.className = currentAdventureBadgesTab === 'episodes' ? activeCls : idleCls;
  if (fpBtn) fpBtn.className = currentAdventureBadgesTab === 'footsteps' ? activeCls : idleCls;

  const footerHint = document.getElementById('badges-modal-footer-hint');
  if (footerHint) {
    footerHint.textContent = currentAdventureBadgesTab === 'footsteps'
      ? '💡 에피소드 4 내에서 미션을 누적 3·5·7·10개 및 전체 완료할 때마다 예수님의 발자취 카드를 받아요!'
      : '💡 에피소드당 1장의 인증서가 발급되며, 다른 레벨을 추가 클리어하면 클리어 레벨이 함께 누적 기록돼요!';
  }

  renderAdventureBadgesGallery();
  const track = document.getElementById('adventure-badges-track');
  if (track) track.scrollLeft = 0;
  playSfx('switch');
}
window.setAdventureBadgesTab = setAdventureBadgesTab;

function _renderEpisodesBadgesHTML() {
  return EPISODE_ORDER.map(epId => {
    const meta = getEpisodeCardMeta(epId);
    const cert = adventureCertsData[epId];

    if (!cert) {
      return `
        <div class="badge-gallery-slot" data-badge-ep="${epId}" data-collected="0">
          <div class="badge-card-frame">
            <div class="badge-card-locked">
              <div class="w-full flex items-center justify-between text-[10px] font-jua text-amber-300/75">
                <span>${meta.epLabel}</span>
                <span>🔒 미획득</span>
              </div>
              <div class="flex flex-col items-center justify-center gap-2 my-auto">
                <div class="relative flex items-center justify-center">
                  <span class="text-5xl sm:text-6xl select-none" style="filter: brightness(0) opacity(0.32);">${meta.icon}</span>
                  <span class="badge-locked-q font-jua absolute">?</span>
                </div>
                <div class="font-jua text-sm sm:text-base text-slate-200 tracking-wide mt-1">???</div>
                <p class="text-[10px] sm:text-[10.5px] text-slate-400 leading-snug px-1">${meta.silhouetteHint}</p>
              </div>
              <div class="w-full px-2 py-1 rounded-xl bg-slate-900/80 border border-slate-700/80 text-[10px] text-amber-200/85 font-jua">
                에피소드 ${meta.epNum} 완주 시 획득!
              </div>
            </div>
          </div>
          <div class="badge-card-below-pill" style="opacity:0.72;">
            ${meta.epLabel} · 미획득
          </div>
        </div>
      `;
    }

    const frontUrl = renderEpisodeCardFrontDataURL(epId);
    const levelPills = renderClearedLevelPillsHTML(cert.clearedModes);
    const modeCount = normalizeClearedModesList(cert.clearedModes).length;
    const domKey = `ep_${epId}`;

    return `
      <div class="badge-gallery-slot" data-badge-ep="${epId}" data-collected="1">
        <div class="badge-card-frame">
          <div class="cert-card-scene w-full h-full" style="width:100%;height:100%;">
            <div id="badge-gallery-card-${domKey}" class="cert-card-inner" role="button" tabindex="0"
                 onclick="toggleBadgeGalleryCardFlip('${domKey}')"
                 onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();toggleBadgeGalleryCardFlip('${domKey}');}"
                 aria-label="${meta.shortTitle} 인증 카드 앞·뒷면 전환">
              <div class="cert-card-face cert-card-front">
                <img src="${frontUrl}" class="cert-card-front-img" alt="${meta.shortTitle} 모험의 증표 앞면" />
                <div class="cert-card-sheen"></div>
              </div>
              <div class="cert-card-face cert-card-back">
                <div>
                  <div class="cert-back-badge inline-block px-2 py-0.5 rounded-full bg-amber-300 text-amber-950 font-jua text-[9.5px] mb-1">
                    ${meta.badge}
                  </div>
                  <h3 class="cert-back-title font-jua text-sm sm:text-base text-amber-900 leading-tight mb-0.5">${meta.title}</h3>
                  <p class="cert-back-verse text-[9px] text-slate-600 leading-snug mb-1.5 line-clamp-2">${meta.verse}</p>
                </div>
                <div class="cert-back-box bg-white/95 border-2 border-amber-400 rounded-xl p-2 text-left text-[10px] space-y-1">
                  <div class="cert-back-row flex justify-between gap-1"><span class="text-slate-500 shrink-0">대원</span><span class="font-bold text-slate-900 truncate">${cert.playerName}</span></div>
                  <div class="pt-0.5 border-t border-amber-100">
                    <div class="cert-back-row text-[9px] text-slate-500 mb-0.5">클리어 레벨 (누적)</div>
                    <div class="flex flex-wrap gap-1">${levelPills}</div>
                  </div>
                  <div class="cert-back-row flex justify-between gap-1 pt-0.5 border-t border-amber-100"><span class="text-slate-500 shrink-0">인증코드</span><span class="cert-back-code font-jua text-xs text-rose-600">${cert.code}</span></div>
                  <div class="cert-back-row flex justify-between gap-1 text-[9px] text-slate-400"><span>획득/갱신</span><span>${cert.updatedAt}</span></div>
                </div>
                <div class="cert-back-footer pt-1 flex items-center justify-between text-[9px] font-jua text-amber-900/80">
                  <span>광릉내 재림교회 어린이부</span>
                  <span class="text-amber-700">↻ 스와이프·터치</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="badge-card-below-pill">
          🏅 ${modeCount}개 레벨 클리어 · 터치 뒤집기 ↻
        </div>
      </div>
    `;
  }).join('');
}

function _renderFootstepsBadgesHTML() {
  const totalMissions = typeof window.getMiracleTotalMissionCount === 'function' ? window.getMiracleTotalMissionCount() : 22;
  const completedMissions = typeof window.getMiracleCompletedMissionCount === 'function' ? window.getMiracleCompletedMissionCount() : 0;

  return FOOTSTEPS_CARD_ORDER.map(tierId => {
    const meta = FOOTSTEPS_CARD_META[tierId];
    const cert = footstepsCertsData[tierId];
    const reqCount = getFootstepsRequiredCount(tierId, totalMissions);
    const reqLabel = meta.isAllClear ? `전체 ${reqCount}개 미션 완료` : `미션 누적 ${reqCount}개 완료`;

    if (!cert) {
      const pct = Math.min(100, Math.round((completedMissions / Math.max(1, reqCount)) * 100));
      return `
        <div class="badge-gallery-slot" data-badge-fp="${tierId}" data-collected="0">
          <div class="badge-card-frame">
            <div class="badge-card-locked" style="border-color: ${meta.borderColor};">
              <div class="w-full flex items-center justify-between text-[10px] font-jua" style="color: ${meta.innerBorder};">
                <span>${meta.stageLabel}</span>
                <span>🔒 미획득</span>
              </div>
              <div class="flex flex-col items-center justify-center gap-1.5 my-auto">
                <div class="relative flex items-center justify-center">
                  <span class="text-5xl sm:text-6xl select-none" style="filter: brightness(0) opacity(0.32);">${meta.symbolIcon}</span>
                  <span class="badge-locked-q font-jua absolute">?</span>
                </div>
                <div class="font-jua text-sm sm:text-base text-slate-200 tracking-wide mt-0.5">???</div>
                <p class="text-[10px] text-slate-300 leading-snug px-1">상징: ${meta.symbolName}</p>
                <div class="w-full px-2 mt-0.5">
                  <div class="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden border border-slate-600/80">
                    <div class="h-full rounded-full" style="width:${pct}%; background-color:${meta.borderColor};"></div>
                  </div>
                  <div class="text-[9.5px] font-bold text-amber-200 mt-0.5">진행도 ${Math.min(completedMissions, reqCount)} / ${reqCount}</div>
                </div>
              </div>
              <div class="w-full px-2 py-1 rounded-xl bg-slate-900/85 border border-slate-700/80 text-[10px] text-amber-200/90 font-jua">
                EP4 ${reqLabel} 시 획득!
              </div>
            </div>
          </div>
          <div class="badge-card-below-pill" style="border-color: ${meta.borderColor}; opacity: 0.78;">
            ${meta.stageLabel} · ${Math.min(completedMissions, reqCount)}/${reqCount}
          </div>
        </div>
      `;
    }

    const frontUrl = renderFootstepsCardFrontDataURL(tierId);
    const domKey = `fp_${tierId}`;
    const milestoneShort = meta.isAllClear ? `전체 ${reqCount}개 완료` : `누적 ${reqCount}개 달성`;

    return `
      <div class="badge-gallery-slot" data-badge-fp="${tierId}" data-collected="1">
        <div class="badge-card-frame">
          <div class="cert-card-scene w-full h-full" style="width:100%;height:100%;">
            <div id="badge-gallery-card-${domKey}" class="cert-card-inner" role="button" tabindex="0"
                 onclick="toggleBadgeGalleryCardFlip('${domKey}')"
                 onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();toggleBadgeGalleryCardFlip('${domKey}');}"
                 aria-label="${meta.title} 발자취 카드 앞·뒷면 전환">
              <div class="cert-card-face cert-card-front" style="border-color: ${meta.borderColor};">
                <img src="${frontUrl}" class="cert-card-front-img" alt="${meta.title} 예수님의 발자취 앞면" />
                <div class="cert-card-sheen"></div>
              </div>
              <div class="cert-card-face cert-card-back" style="border-color: ${meta.borderColor}; background: ${meta.backGrad};">
                <div>
                  <div class="cert-back-badge inline-block px-2 py-0.5 rounded-full text-white font-jua text-[9.5px] mb-1" style="background-color: ${meta.badgeBg};">
                    👣 ${meta.stageLabel} · 예수님의 발자취
                  </div>
                  <h3 class="cert-back-title font-jua text-sm sm:text-base text-slate-900 leading-tight mb-0.5">${meta.title}</h3>
                  <p class="cert-back-verse text-[9px] text-slate-700 leading-snug mb-1.5 line-clamp-2">${meta.desc}</p>
                </div>
                <div class="cert-back-box bg-white/95 border-2 rounded-xl p-2 text-left text-[10px] space-y-1" style="border-color: ${meta.borderColor};">
                  <div class="cert-back-row flex justify-between gap-1"><span class="text-slate-500 shrink-0">대원</span><span class="font-bold text-slate-900 truncate">${cert.playerName}</span></div>
                  <div class="cert-back-row flex justify-between gap-1 pt-0.5 border-t border-slate-100"><span class="text-slate-500 shrink-0">상징</span><span class="font-bold text-amber-800 truncate">${meta.symbolIcon} ${meta.symbolName}</span></div>
                  <div class="cert-back-row flex justify-between gap-1 pt-0.5 border-t border-slate-100"><span class="text-slate-500 shrink-0">달성</span><span class="font-bold text-emerald-700 truncate">${milestoneShort}</span></div>
                  <div class="cert-back-row flex justify-between gap-1 pt-0.5 border-t border-slate-100"><span class="text-slate-500 shrink-0">카드코드</span><span class="cert-back-code font-jua text-xs text-rose-600">${cert.code}</span></div>
                  <div class="cert-back-row flex justify-between gap-1 text-[9px] text-slate-400"><span>획득일</span><span>${cert.issuedAt}</span></div>
                </div>
                <div class="cert-back-footer pt-1 flex items-center justify-between text-[9px] font-jua text-slate-700">
                  <span>광릉내 재림교회 어린이부</span>
                  <span class="text-amber-700">↻ 스와이프·터치</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="badge-card-below-pill" style="border-color: ${meta.borderColor};">
          ${meta.symbolIcon} ${meta.title} · 터치 뒤집기 ↻
        </div>
      </div>
    `;
  }).join('');
}

function renderAdventureBadgesGallery() {
  const track = document.getElementById('adventure-badges-track');
  const countBadge = document.getElementById('badges-modal-count');
  if (countBadge) {
    if (currentAdventureBadgesTab === 'footsteps') {
      const fpCollected = getCollectedFootstepsCertCount();
      countBadge.textContent = `${fpCollected} / ${FOOTSTEPS_CARD_ORDER.length} 수집`;
    } else {
      const collectedCount = getCollectedAdventureCertCount();
      countBadge.textContent = `${collectedCount} / ${EPISODE_ORDER.length} 수집`;
    }
  }
  if (!track) return;

  bindBadgesTrackSwipeInteraction(track);
  track.classList.remove('is-pointer-dragging');
  track.style.setProperty('--swipe-tilt', '0deg');

  track.innerHTML = currentAdventureBadgesTab === 'footsteps'
    ? _renderFootstepsBadgesHTML()
    : _renderEpisodesBadgesHTML();
}

let _badgesModalPrevPlaying = false;
function openAdventureBadgesModal(tabKey = null) {
  setHudMenuOpen(false);
  closeUiTutorial(false);
  hideMissionGuideBubbleImmediately();
  const modal = document.getElementById('adventure-badges-modal');
  if (!modal) return;

  _badgesModalPrevPlaying = Boolean(isPlaying);
  isPlaying = false;
  joyX = 0; joyY = 0; keys = {}; currentMoveSpeed = 0;

  if (tabKey === 'episodes' || tabKey === 'footsteps') {
    currentAdventureBadgesTab = tabKey;
  }
  const epBtn = document.getElementById('badges-tab-episodes');
  const fpBtn = document.getElementById('badges-tab-footsteps');
  const activeCls = 'badges-tab-btn mc-btn-slim px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-jua text-xs sm:text-sm';
  const idleCls = 'badges-tab-btn mc-btn-slim px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-jua text-xs sm:text-sm';
  if (epBtn) epBtn.className = currentAdventureBadgesTab === 'episodes' ? activeCls : idleCls;
  if (fpBtn) fpBtn.className = currentAdventureBadgesTab === 'footsteps' ? activeCls : idleCls;
  const footerHint = document.getElementById('badges-modal-footer-hint');
  if (footerHint) {
    footerHint.textContent = currentAdventureBadgesTab === 'footsteps'
      ? '💡 에피소드 4 내에서 미션을 누적 3·5·7·10개 및 전체 완료할 때마다 예수님의 발자취 카드를 받아요!'
      : '💡 에피소드당 1장의 인증서가 발급되며, 다른 레벨을 추가 클리어하면 클리어 레벨이 함께 누적 기록돼요!';
  }

  renderAdventureBadgesGallery();
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  syncOverlayModalBodyClass();
  playSfx('switch');
}
window.openAdventureBadgesModal = openAdventureBadgesModal;

function openAdventureBadgesModalFromEnding(tabKey = null) {
  clearEndingCardFlipTimer();
  const em = document.getElementById('ending-modal');
  if (em) { em.classList.add('hidden'); em.classList.remove('flex'); }
  const resolvedTab = (tabKey === 'episodes' || tabKey === 'footsteps')
    ? tabKey
    : (window.__endingModalMode === 'footsteps' ? 'footsteps' : 'episodes');
  openAdventureBadgesModal(resolvedTab);
  // 발자취 팝업에서 카드첩을 열었을 때는 _badgesModalPrevPlaying이 _footstepsModalPrevPlaying 이어받도록 보정
  if (window.__endingModalMode === 'footsteps' && _footstepsModalPrevPlaying) {
    _badgesModalPrevPlaying = true;
    _footstepsModalPrevPlaying = false;
  }
}
window.openAdventureBadgesModalFromEnding = openAdventureBadgesModalFromEnding;

function closeAdventureBadgesModal() {
  const modal = document.getElementById('adventure-badges-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
  syncOverlayModalBodyClass();
  const isMenuOpen = ['screen-opening', 'screen-class', 'screen-map'].some(id => {
    const el = document.getElementById(id);
    return el && !el.classList.contains('hidden');
  });
  if (!isMenuOpen && _badgesModalPrevPlaying) {
    isPlaying = true;
  }
  _badgesModalPrevPlaying = false;
  if (!isMenuOpen) {
    setTimeout(() => {
      if (typeof flushPendingFootstepsCardAward === 'function') {
        flushPendingFootstepsCardAward();
      }
    }, 280);
  }
}
window.closeAdventureBadgesModal = closeAdventureBadgesModal;

function showEp4PostCertificateNewMeetingMessage() {
  const msg = '새로운 만남을 찾아보세요!';
  if (typeof window.showMiracleGuideBubble === 'function') {
    window.showMiracleGuideBubble({
      title: '🌿 복음서 오픈월드',
      text: msg,
      progressText: '✨ 새로운 여정',
      canCancel: false,
      autoCloseMs: 4200
    });
  } else {
    showToast(`✨ ${msg}`);
  }
}

function closeEndingToLookAround() {
  clearEndingCardFlipTimer();
  const em = document.getElementById('ending-modal');
  em.classList.add('hidden'); em.classList.remove('flex');
  syncOverlayModalBodyClass();
  if (currentEpisode === 'miracle') {
    if (window.__ep4ShowNewMeetingAfterCert) {
      window.__ep4ShowNewMeetingAfterCert = false;
      showEp4PostCertificateNewMeetingMessage();
    } else if (typeof miracleSubMode !== 'undefined' && miracleSubMode === 'openworld') {
      showEp4PostCertificateNewMeetingMessage();
    } else {
      showToast('🌈 엔딩 세상을 자유롭게 걸어보세요!');
    }
    setTimeout(() => {
      if (typeof flushPendingFootstepsCardAward === 'function') flushPendingFootstepsCardAward();
    }, 320);
    return;
  }
  showToast('🌈 엔딩 세상을 자유롭게 걸어보세요!');
}

function closeEndingToReturnMiracleOpenWorld() {
  clearEndingCardFlipTimer();
  const em = document.getElementById('ending-modal');
  if (em) { em.classList.add('hidden'); em.classList.remove('flex'); }
  syncOverlayModalBodyClass();
  const shouldShowNewMeeting = Boolean(window.__ep4ShowNewMeetingAfterCert);
  window.__ep4ShowNewMeetingAfterCert = false;
  if (typeof returnToMiracleOpenWorld === 'function' && (typeof miracleSubMode === 'undefined' || miracleSubMode !== 'openworld')) {
    returnToMiracleOpenWorld();
  }
  if (shouldShowNewMeeting || currentEpisode === 'miracle') {
    showEp4PostCertificateNewMeetingMessage();
  }
  setTimeout(() => {
    if (typeof flushPendingFootstepsCardAward === 'function') flushPendingFootstepsCardAward();
  }, 320);
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
    if (typeof window.isMissionGuideBubbleBlockingAction === 'function' && window.isMissionGuideBubbleBlockingAction()) {
      if ((performance.now() - (MiracleGuideUI.openedAt || 0)) >= 260) {
        window.dismissMiracleGuideBubbleToButton();
      }
      return;
    }
    joyPointerId = e.pointerId;
    const r = zone.getBoundingClientRect();
    cx = r.left + r.width / 2; cy = r.top + r.height / 2;
    handleJoyMove(e.clientX, e.clientY);
  });

  document.getElementById('canvas-container').addEventListener('pointerdown', e => {
    if (typeof window.isMissionGuideBubbleBlockingAction === 'function' && window.isMissionGuideBubbleBlockingAction()) {
      if ((performance.now() - (MiracleGuideUI.openedAt || 0)) >= 260) {
        window.dismissMiracleGuideBubbleToButton();
      }
      return;
    }
    if (!isPlaying || doveCutscene.active || pillarCutscene.active || seaPartingCutscene.active || sinaiCutscene.active) return;
    if (typeof miracleActiveFieldEvent !== 'undefined' && miracleActiveFieldEvent && miracleActiveFieldEvent.cutsceneActive) return;
    if (e.pointerId === joyPointerId) return;
    camPointerId = e.pointerId; lastCamX = e.clientX;
  });

  window.addEventListener('pointermove', e => {
    if (e.pointerId === joyPointerId) {
      handleJoyMove(e.clientX, e.clientY);
    } else if (e.pointerId === camPointerId && isPlaying && !doveCutscene.active && !pillarCutscene.active && !seaPartingCutscene.active && !sinaiCutscene.active && !(typeof miracleActiveFieldEvent !== 'undefined' && miracleActiveFieldEvent && miracleActiveFieldEvent.cutsceneActive)) {
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
    const activeTag = (document.activeElement && document.activeElement.tagName) ? document.activeElement.tagName.toUpperCase() : '';
    if (activeTag !== 'INPUT' && activeTag !== 'TEXTAREA' && typeof window.isMissionGuideBubbleBlockingAction === 'function' && window.isMissionGuideBubbleBlockingAction()) {
      const elapsed = performance.now() - (MiracleGuideUI.openedAt || 0);
      if (e.code === 'Escape') {
        e.preventDefault();
        window.dismissMiracleGuideBubbleToButton();
        return;
      }
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        if (elapsed >= 180) {
          if (MiracleGuideUI.isTyping) window.onMiracleGuideBubbleClick();
          else window.dismissMiracleGuideBubbleToButton();
        }
        return;
      }
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
        if (elapsed >= 260) window.dismissMiracleGuideBubbleToButton();
        keys[e.code] = false;
        return;
      }
      return;
    }
    keys[e.code] = true;
    if (e.code === 'Space') { e.preventDefault(); playerJump(); }
    if (e.code === 'KeyQ') rotateCameraDeg(-15);
    if (e.code === 'KeyE') rotateCameraDeg(15);
  });
  window.addEventListener('keyup', e => { keys[e.code] = false; });
}

function playerJump() {
  if (typeof window.isMissionGuideBubbleBlockingAction === 'function' && window.isMissionGuideBubbleBlockingAction()) return;
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
    if (typeof hideAllDavidCustomUI === 'function') hideAllDavidCustomUI();
    if (typeof davidOpeningState !== 'undefined' && davidOpeningState) davidOpeningState.active = false;
    hideMissionGuideBubbleImmediately();
    updateMiracleGuideButtonVisibility();
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
  installEp4MattePhongSpecGuard();
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
      if (typeof miracleSubMode !== 'undefined' && miracleSubMode === 'main1_storm_night' && typeof buildMiracleMainStage1NightStorm === 'function') buildMiracleMainStage1NightStorm();
      else if (typeof miracleSubMode !== 'undefined' && miracleSubMode === 'main1_galilee' && typeof buildMiracleMainStage1Galilee === 'function') buildMiracleMainStage1Galilee();
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

  const ambLight = new THREE.AmbientLight(0xffffff, 0.62);
  scene.add(ambLight);
  window.coreAmbientLight = ambLight;
  const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0xb89c6e, 0.0);
  scene.add(hemiLight);
  window.coreHemiLight = hemiLight;
  const dirLight = new THREE.DirectionalLight(0xfffbeb, 0.72);
  dirLight.position.set(25, 45, 25); dirLight.castShadow = true;
  scene.add(dirLight);
  window.coreDirLight = dirLight;
  window.coreDirLightDefaultTarget = dirLight.target;

  rebuildPlayerAppearance();
  if (!skipInitialPreview) {
    buildRandomOpeningPreviewWorld();
  }
  setupControls();

  const handleViewportResize = () => {
    const mobNow = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (Math.min(window.innerWidth, window.innerHeight) <= 768);
    const aspect = window.innerWidth / Math.max(1, window.innerHeight);
    camera.aspect = aspect;
    
    // 세로형(aspect < 1.0)일 때 시야각(FOV)을 +10도 넓혀 거대한 구조물 높이감과 시야 확보
    camera.fov = aspect < 1.0 ? 65 : 55;
    camera.updateProjectionMatrix();
    
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobNow ? 1.25 : 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (typeof window.syncMiracleTimeControllerLayout === 'function') window.syncMiracleTimeControllerLayout();
    if (typeof positionMiracleLeftHudBelowTopBar === 'function') positionMiracleLeftHudBelowTopBar();
    if (typeof positionDavidStage3QuestTrackerBelowHUD === 'function') positionDavidStage3QuestTrackerBelowHUD();
    if (typeof window.positionMultiplayerRightHud === 'function') window.positionMultiplayerRightHud();
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

    const isMenuScreenOpen = ['screen-opening', 'screen-class', 'screen-map'].some(id => {
      const el = document.getElementById(id);
      return el && !el.classList.contains('hidden');
    });
    if (!isPlaying && !stage2CountdownActive && isMenuScreenOpen) {
      if (pausedGameSession && pausedGameSession.active) {
        renderer.render(scene, camera);
        return;
      }
      const ang = now * 0.00028;
      const pm = window.openingPreviewMeta || { cx: 0, cy: 3, cz: -10, rad: 28, camY: 14 };
      camera.position.set(pm.cx + Math.sin(ang) * pm.rad, pm.camY, pm.cz + Math.cos(ang) * pm.rad);
      camera.lookAt(pm.cx, pm.cy, pm.cz);
      renderer.render(scene, camera);
      return;
    }

    const epPlugin = getActiveEpisodePlugin();
    const guideBubblePaused = (typeof window.isMissionGuideBubbleBlockingAction === 'function') && window.isMissionGuideBubbleBlockingAction();

    if (isPlaying && isTimeAttackActive && !guideBubblePaused && !doveCutscene.active && !pillarCutscene.active && !seaPartingCutscene.active && !sinaiCutscene.active) {
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
      if (guideBubblePaused) {
        currentMoveSpeed = 0;
        joyX = 0;
        joyY = 0;
        playerGroup.position.copy(playerPos);
        applyCoreCameraByMode();
        updateWallTransparency();
        renderer.render(scene, camera);
        return;
      }
      cameraYaw = lerpAngle(cameraYaw, cameraTargetYaw, dt * 12);
      const prevGrounded = isGrounded;
      const prevVelY = playerVelY;
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

      const forcedWalkSpd = Number(window.__ep4ForcedWalkSpeed) || 0;
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
        if (!(currentEpisode === 'miracle' && window.ep4CharacterAnimator)) {
          playerLimbs.lLeg.rotation.x = Math.sin(walkCycle) * 0.65; playerLimbs.rLeg.rotation.x = -Math.sin(walkCycle) * 0.65;
          playerLimbs.lArm.rotation.x = -Math.sin(walkCycle) * 0.58; playerLimbs.rArm.rotation.x = Math.sin(walkCycle) * 0.58;
        }
      } else {
        currentMoveSpeed = 0;
        if (!(currentEpisode === 'miracle' && window.ep4CharacterAnimator)) {
          if (forcedWalkSpd > 0.1) {
            walkCycle += dt * (forcedWalkSpd * 1.45);
            playerLimbs.lLeg.rotation.x = Math.sin(walkCycle) * 0.65; playerLimbs.rLeg.rotation.x = -Math.sin(walkCycle) * 0.65;
            playerLimbs.lArm.rotation.x = -Math.sin(walkCycle) * 0.58; playerLimbs.rArm.rotation.x = Math.sin(walkCycle) * 0.58;
          } else {
            playerLimbs.lLeg.rotation.x = 0; playerLimbs.rLeg.rotation.x = 0;
            playerLimbs.lArm.rotation.x = 0; playerLimbs.rArm.rotation.x = 0;
          }
        }
      }
      resolvePlayerAntiStuckPushOut();

      if (currentEpisode === 'miracle' && window.ep4CharacterAnimator) {
        const sub = (typeof miracleSubMode !== 'undefined') ? miracleSubMode : '';
        const stMini = (typeof miracleActiveMiniState !== 'undefined') ? miracleActiveMiniState : null;
        const skipWaterScale = (sub === 'main3_waterwalk' && stMini && stMini.phase && stMini.phase !== 'run' && stMini.phase !== 'walk');
        const effectiveMoveSpeed = forcedWalkSpd > 0.1 ? forcedWalkSpd : currentMoveSpeed;
        const effectiveIsMoving = (forcedWalkSpd > 0.1) || (inputMag > 0.08 && currentMoveSpeed > 0.15);
        window.ep4CharacterAnimator.update(dt, now, {
          isGrounded,
          prevGrounded,
          velY: playerVelY,
          prevVelY,
          moveSpeed: effectiveMoveSpeed,
          maxSpeed: baseSpeed,
          isMoving: effectiveIsMoving,
          playerGroup,
          limbs: playerLimbs,
          skipArms: Boolean(window.__ep4SkipArmAnimThisFrame),
          skipBodyScale: Boolean(window.__ep4SkipBodyScaleThisFrame || skipWaterScale),
          isChopping: playerChopAnimTimer > 0
        });
        window.__ep4SkipArmAnimThisFrame = false;
        window.__ep4SkipBodyScaleThisFrame = false;
      }
      window.__ep4ForcedWalkSpeed = 0;

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
      if (currentEpisode === 'noah' && currentStage === 4 && typeof checkAndFadeEndingArkIfBlocking === 'function') {
        checkAndFadeEndingArkIfBlocking(dt);
      }

      // [전체 에피소드 공통 요청사항] 1차 시도 제단 첫 방문 시에만 인증서를 1회 띄우고, 재방문/2회차부터는 월드맵 이동 선택창 오픈!
      if (currentStage === 4 && targetObject && currentEpisode !== 'david') {
        const td = Math.hypot(playerPos.x - targetObject.pos.x, playerPos.z - targetObject.pos.z);
        updateWorldLabelPos(targetObject.label, targetObject.pos, td < 26);
        if (guideArrowGroup.visible) {
          guideArrowGroup.rotation.y = Math.atan2(targetObject.pos.x - playerPos.x, targetObject.pos.z - playerPos.z) - playerGroup.rotation.y;
        }
        const endingModalEl = document.getElementById('ending-modal');
        const choiceModalEl = document.getElementById('ending-map-choice-modal');
        const isEndingUiOpen = Boolean(
          (endingModalEl && !endingModalEl.classList.contains('hidden')) ||
          (choiceModalEl && !choiceModalEl.classList.contains('hidden'))
        );
        if (!isEndingUiOpen && targetObject.type === 'altar' && Math.abs(playerPos.y) < 3.5) {
          if (td < 4.2 && !certAutoShown) {
            certAutoShown = true;
            if (canShowCertificateForCurrentRun() && !certShownInCurrentRun) {
              showEndingCertificate();
            } else {
              showEndingWorldMapChoiceModal();
            }
          } else if (td > 6.2 && (!canShowCertificateForCurrentRun() || certShownInCurrentRun)) {
            // [세상 둘러보기] 후 제단에서 멀어졌다가 다시 제단으로 오면 월드맵 이동 선택창이 열리도록 리셋
            certAutoShown = false;
          }
        }
      }
      updateGuideArrowVisuals(now);
    }

    renderer.render(scene, camera);
  }
  requestAnimationFrame(animate);
}

function parseAdminDirectJumpParams() {
  const validEps = new Set(['noah', 'exodus', 'david', 'miracle']);
  const validModes = new Set(['kinder', 'junior', 'senior', 'timeattack']);
  const validMiracleSubs = new Set(['openworld', 'main1_galilee', 'main1_boat', 'main1_storm_night', 'main2_loaves', 'main3_cross', 'main4_tomb', 'ascension']);

  const tryExtract = (searchStr) => {
    if (!searchStr) return null;
    const cleaned = searchStr.replace(/^[?#]+/, '');
    if (!cleaned) return null;
    const p = new URLSearchParams(cleaned);
    const mpFlag = (p.get('mp') || '').trim();
    if (mpFlag === '1' || mpFlag.toLowerCase() === 'true') {
      const name = (p.get('name') || '관리자').trim() || '관리자';
      const room = (p.get('room') || '광릉내1방').trim() || '광릉내1방';
      const charId = (p.get('char') || 'hero').trim() || 'hero';
      const autoEnter = (p.get('auto') || '1') !== '0';
      return { isMp: true, ep: 'miracle', mode: 'junior', stage: 1, name, room, charId, autoEnter };
    }
    const ep = (p.get('ep') || '').trim().toLowerCase();
    const mode = (p.get('mode') || '').trim().toLowerCase();
    const stage = parseInt(p.get('stage') || '0', 10);
    const subRaw = (p.get('sub') || '').trim().toLowerCase();
    const sub = validMiracleSubs.has(subRaw) ? subRaw : '';
    const name = (p.get('name') || '관리자').trim() || '관리자';
    if (validEps.has(ep) && validModes.has(mode) && stage >= 1 && stage <= 4) {
      return { ep, mode, stage, sub, name };
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
        if (saved.type === 'mp' || saved.isMp) {
          jump = {
            isMp: true,
            ep: 'miracle',
            mode: 'junior',
            stage: 1,
            name: String(saved.name || '관리자').trim() || '관리자',
            room: String(saved.room || '광릉내1방').trim() || '광릉내1방',
            charId: String(saved.charId || 'hero').trim() || 'hero',
            autoEnter: saved.autoEnter !== false
          };
        } else {
          const ep = String(saved.ep || '').trim().toLowerCase();
          const mode = String(saved.mode || '').trim().toLowerCase();
          const stage = parseInt(saved.stage || '0', 10);
          const subRaw = String(saved.sub || '').trim().toLowerCase();
          const sub = validMiracleSubs.has(subRaw) ? subRaw : '';
          const name = String(saved.name || '관리자').trim() || '관리자';
          if (validEps.has(ep) && validModes.has(mode) && stage >= 1 && stage <= 4) {
            jump = { ep, mode, stage, sub, name };
          }
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
  window.explorerName = jump.name;
  loadLocalPlayerProgress(explorerName);
  currentEpisode = jump.ep;
  currentMode = jump.mode;
  if (jump.isMp) {
    window.__mpAdminBypassUnlock = true;
    if (window.MiracleMultiplayer && typeof window.MiracleMultiplayer.launchFromAdmin === 'function') {
      window.MiracleMultiplayer.launchFromAdmin(jump);
      return;
    }
  }
  openScreen(null);
  if (jump.ep === 'miracle' && jump.sub) {
    if (jump.sub === 'openworld') {
      startVoxelGame(jump.mode, 1, false);
      return;
    }
    if (jump.sub === 'ascension') {
      startVoxelGame(jump.mode, 4, true);
      return;
    }
    if (typeof window.startMiracleDirectSubStage === 'function') {
      isMenuBgmActive = false;
      currentMode = jump.mode;
      isTimeAttackActive = false;
      const timerBox = document.getElementById('hud-timer-box');
      if (timerBox) { timerBox.classList.add('hidden'); timerBox.classList.remove('flex'); }
      rebuildPlayerAppearance();
      window.globalCameraViewMode = 'default';
      ensureGlobalCameraViewToggleUI();
      const isJumpStage1NoArrow = (jump.sub === 'main1_galilee' || jump.sub === 'main1_storm_night');
      if (guideArrowGroup) guideArrowGroup.visible = !isEffectiveSeniorMode('miracle', jump.mode) && !isJumpStage1NoArrow;
      window.startMiracleDirectSubStage(jump.sub);
      return;
    }
  }
  startVoxelGame(jump.mode, jump.stage, jump.stage === 4);
}

window.addEventListener('DOMContentLoaded', () => {
  if (typeof updateOpeningLogoState === 'function') {
    updateOpeningLogoState(false);
  }
  try {
    const _preloadPromiseLogo = new Image();
    _preloadPromiseLogo.src = OPENING_LOGO_PROMISE_SRC;
  } catch (e) {}

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