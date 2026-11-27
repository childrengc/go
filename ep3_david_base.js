// =========================================================================
// [ep3_david_base.js - 파일 1/3] 에피소드 3 : 다윗 이야기 (공통 베이스·1분 하프 BGM·UI·모델링)
// - 성우 MP3 내레이션 시스템(DAVID_MALE_VOICE_AUDIO_MAP) 및 암전 시네마틱 연출 100% 유지
// - 스테이지 1 & 3 공통: 현재 하프 멜로디 기반 1분(60초, 192박자) 연속 연주 및 자연스러운 무한 루프
// - 스테이지 2 골리앗 격파 후 웅장하고 힘찬 승리 팡파르 행진곡 BGM 탑재
// - 조준창 골리앗 놋투구·청동 비늘갑옷 픽셀 디테일 강화
// =========================================================================

window.__GAME_BUILD_VERSIONS__ = window.__GAME_BUILD_VERSIONS__ || {};
window.__GAME_BUILD_VERSIONS__.ep3_base = '3.12.3';

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
    desc: '시냇가에서 물맷돌 5개를 모두 모으고 골리앗의 놋투구 위 우상 장식을 무너뜨려 믿음으로 승리했어요!',
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
// 1. 에피소드 3 전체 공유 상태 변수 선언 (파일 분할 시 참조 오류 원천 방지)
// -------------------------------------------------------------------------
const DAVID_WALL_REQ_PER_TIER = 7;
const DAVID_CAMP_HALF_W = 7.4;
const DAVID_CAMP_HALF_D = 5.6;
const DAVID_HILL_TOP_Y = 11.0;
const DAVID_HILL_SLOPE_SOUTH_Z = -8;
const DAVID_HILL_SLOPE_NORTH_Z = -34;

// 스테이지 1 상태 변수
let davidStage1Phase = 'find_sheep';
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
let davidActionCooldown = 0;

// 스테이지 2 상태 변수
let davidGoliathObj = null;
let davidSlingStones = [];
let davidHeldStones = 0;
let davidMaxStones = 5;
let davidStonesUnlockedAim = false; // 물맷돌 5개를 모두 모아야 조준창이 열리도록 관리하는 플래그
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
  duration: 1.45,
  startPos: new THREE.Vector3(),
  endPos: new THREE.Vector3(),
  isHit: false
};
let davidIdolShards = [];
let davidStage2Dialogue = {
  active: false,
  step: 0,
  timer: 0,
  typingTimer: null,
  autoNextTimer: null
};

// 스테이지 3 & 엔딩 상태 변수
let davidCityNpcs = [];
let davidCityResources = [];
let davidRetainers = [];
let davidCityShopkeepers = [];
let davidCityPedestrians = [];
let davidCityBuildingBoxes = [];
let davidInventory = { wood: 0, stone: 0, iron: 0 };
let davidCurrentActiveQuestNpc = null;
let davidActiveNearNpc = null;
let davidDialogTargetNpc = null;
let davidNpcAutoDialogCooldown = 0;
let davidProphetUnlocked = false;
let davidCityBuildings = {
  marketGroup: null,
  houseGroup: null,
  gateGroup: null
};
let davidThroneEnding = {
  throneGroup: null,
  arrowGroup: null,
  seated: false,
  seatTimer: 0,
  modalShown: false
};

// 오프닝·컷신 상태 변수
let davidOpeningState = { active: false, timers: [] };
let davidAnointCutscene = { active: false, timer: 0, phase: 0, samuelMesh: null, sparkles: [], houseZ: -46 };
let davidStage2Cutscene = { active: false, timer: 0, phase: 0 };
let davidStage3Cutscene = { active: false, timer: 0, phase: 0 };

// -------------------------------------------------------------------------
// 2. [스테이지 1 & 3 요청사항] 현재 하프 멜로디 기반 1분(60초, 192박자) 연속 BGM
// - 기존 24박자 하프 멜로디를 바탕으로 8개 악장(192박자, 약 60초)을 구성하며,
//   마지막 192번째 박자가 딸림7화음(G7)으로 끝나 첫 박자 으뜸화음(C)으로 자연스럽게 이어짐
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

const DAVID_HARP_1MIN_SUITE = (function buildOneMinuteDavidHarpSuite() {
  const m = [], c1 = [], c2 = [], b = [], r = [];
  const addSection = (mel, ch1, ch2, bass, rhy) => {
    for (let i = 0; i < 24; i++) {
      m.push(mel[i]);
      c1.push(ch1[i]);
      c2.push(ch2[i]);
      b.push(bass[i]);
      r.push(rhy[i]);
    }
  };

  // 제1악장 (0~23박, 0~7.5초): 원곡 메인 하프 테마 (베들레헴의 평화로운 아침)
  addSection(DAVID_HARP_MELODY, DAVID_HARP_CHORD1, DAVID_HARP_CHORD2, DAVID_HARP_BASS, DAVID_HARP_RHYTHM);

  // 제2악장 (24~47박, 7.5~15초): 원곡 테마의 고음역 변주 (푸른 초장과 쉴 만한 물가)
  addSection(
    [7, 12, 16, 19, 17, 16, 14, 12, 9, 12, 17, 21, 19, 16, 14, 12, 7, 11, 14, 19, 17, 14, 11, 12],
    [12, 16, 19, 24, 21, 19, 17, 16, 12, 17, 21, 24, 24, 19, 17, 16, 11, 14, 19, 23, 21, 17, 14, 16],
    [16, 19, 24, 28, 24, 24, 21, 19, 17, 21, 24, 28, 28, 24, 21, 19, 14, 19, 23, 26, 24, 21, 17, 19],
    [-12, -12, -8, -8, -5, -5, -8, -12, -7, -7, -5, -5, -12, -12, -7, -12, -5, -5, -5, -5, -7, -5, -5, -12],
    DAVID_HARP_RHYTHM
  );

  // 제3악장 (48~71박, 15~22.5초): 서정적인 부주제 아르페지오 (양 떼를 돌보는 목자의 노래)
  addSection(
    [9, 12, 16, 21, 19, 16, 12, 9, 5, 9, 12, 17, 16, 12, 9, 7, 2, 5, 9, 14, 12, 11, 9, 7],
    [12, 16, 21, 24, 24, 19, 16, 12, 9, 12, 17, 21, 19, 16, 12, 11, 5, 9, 14, 17, 16, 14, 12, 11],
    [16, 21, 24, 28, 28, 24, 19, 16, 12, 17, 21, 24, 24, 19, 16, 14, 9, 14, 17, 21, 19, 17, 16, 14],
    [-3, -3, -3, -3, -8, -8, -3, -3, -7, -7, -7, -7, -12, -12, -7, -5, -10, -10, -10, -10, -5, -5, -7, -5],
    [
      1.35, 0.55, 0.90, 1.40, 0.55, 0.95,
      1.45, 0.50, 0.50, 0.55, 1.35, 0.55,
      1.40, 0.55, 0.95, 1.30, 0.48, 0.48,
      1.40, 0.55, 0.95, 1.60, 0.55, 1.15
    ]
  );

  // 제4악장 (72~95박, 22.5~30초): 다윗의 언약과 소망 테마 (따뜻하고 기품 있는 화음 진행)
  addSection(
    [4, 7, 12, 16, 14, 12, 11, 9, 7, 11, 14, 19, 17, 16, 14, 12, 5, 9, 12, 16, 14, 11, 7, 12],
    [7, 12, 16, 19, 17, 16, 14, 12, 11, 14, 19, 23, 21, 19, 17, 16, 9, 12, 16, 19, 17, 14, 11, 16],
    [12, 16, 19, 24, 21, 19, 17, 16, 14, 19, 23, 26, 24, 24, 21, 19, 12, 16, 19, 24, 21, 17, 14, 19],
    [-12, -12, -8, -8, -7, -7, -3, -3, -5, -5, -5, -5, -8, -8, -10, -12, -7, -7, -7, -7, -5, -5, -5, -12],
    DAVID_HARP_RHYTHM
  );

  // 제5악장 (96~119박, 30~37.5초): 원곡 메인 테마 재현 및 화성 강화
  addSection(
    [0, 4, 7, 12, 14, 12, 9, 7, 5, 9, 12, 17, 16, 14, 12, 9, 7, 11, 14, 17, 16, 14, 12, 7],
    [4, 7, 12, 16, 17, 16, 12, 11, 9, 12, 17, 21, 19, 17, 16, 12, 11, 14, 17, 21, 19, 17, 16, 11],
    [7, 12, 16, 19, 21, 19, 16, 14, 12, 17, 21, 24, 24, 21, 19, 16, 14, 17, 21, 24, 24, 21, 19, 14],
    [-12, -12, -12, -5, -3, -3, -5, -5, -7, -7, -7, -2, -12, -12, -3, -3, -5, -5, -5, -5, -12, -8, -5, -5],
    DAVID_HARP_RHYTHM
  );

  // 제6악장 (120~143박, 37.5~45초): 예루살렘의 별빛 (감미로운 하행 시퀀스)
  addSection(
    [14, 17, 21, 17, 16, 14, 12, 11, 12, 16, 19, 16, 14, 12, 11, 9, 11, 14, 17, 14, 12, 11, 9, 7],
    [17, 21, 24, 21, 19, 17, 16, 14, 16, 19, 24, 19, 17, 16, 14, 12, 14, 17, 21, 17, 16, 14, 12, 11],
    [21, 24, 28, 24, 24, 21, 19, 17, 19, 24, 28, 24, 21, 19, 17, 16, 17, 21, 24, 21, 19, 17, 16, 14],
    [-10, -10, -10, -10, -5, -5, -7, -5, -12, -12, -12, -12, -3, -3, -5, -3, -10, -10, -5, -5, -12, -8, -10, -5],
    [
      1.40, 0.50, 0.90, 1.35, 0.55, 0.95,
      1.45, 0.50, 0.50, 0.55, 1.35, 0.55,
      1.40, 0.55, 0.95, 1.30, 0.48, 0.48,
      1.40, 0.55, 0.95, 1.65, 0.55, 1.12
    ]
  );

  // 제7악장 (144~167박, 45~52.5초): 찬양의 클라이맥스 (화려한 고음 수금 연주)
  addSection(
    [12, 16, 19, 24, 23, 21, 19, 16, 17, 21, 24, 21, 19, 16, 14, 12, 14, 17, 19, 23, 21, 19, 16, 14],
    [16, 19, 24, 28, 26, 24, 24, 19, 21, 24, 28, 24, 24, 19, 17, 16, 17, 21, 23, 26, 24, 24, 19, 17],
    [19, 24, 28, 31, 29, 28, 28, 24, 24, 28, 31, 28, 28, 24, 21, 19, 21, 24, 26, 29, 28, 28, 24, 21],
    [-12, -12, -8, -8, -3, -3, -5, -5, -7, -7, -5, -5, -12, -12, -8, -12, -10, -10, -5, -5, -12, -8, -10, -5],
    DAVID_HARP_RHYTHM
  );

  // 제8악장 (168~191박, 52.5~60초): 종결 및 자연스러운 무한 루프 브릿지 (끝부분이 G7 화음으로 끝나 첫 음 C로 자연스럽게 연결)
  addSection(
    [12, 9, 7, 4, 5, 9, 12, 9, 7, 4, 0, 4, 2, 5, 9, 12, 11, 9, 7, 4, 2, 5, 11, 7],
    [16, 12, 11, 7, 9, 12, 16, 12, 11, 7, 4, 7, 5, 9, 12, 16, 14, 12, 11, 7, 5, 9, 14, 11],
    [19, 16, 14, 12, 12, 16, 19, 16, 14, 12, 7, 12, 9, 12, 17, 19, 17, 16, 14, 11, 9, 14, 17, 14],
    [-12, -12, -8, -8, -7, -7, -7, -7, -12, -12, -3, -3, -10, -10, -10, -10, -5, -5, -5, -5, -5, -7, -5, -5],
    DAVID_HARP_RHYTHM
  );

  return { melody: m, chord1: c1, chord2: c2, bass: b, rhythm: r };
})();

const DAVID_TENSION_MELODY = [0, 0, 7, 8,  7, 5, 3, 2,  0, 0, 3, 6,  7, 8, 7, 3];
const DAVID_TENSION_BASS   = [-12, -12, -5, -4, -5, -7, -9, -10, -12, -12, -9, -6, -5, -4, -5, -12];
const DAVID_TENSION_RHYTHM = [
  0.55, 0.55, 1.25, 0.65,
  0.55, 0.55, 1.15, 0.75,
  0.50, 0.50, 1.30, 0.70,
  0.55, 0.55, 1.40, 0.50
];

// 스테이지 2 골리앗을 쓰러뜨린 뒤 울려 퍼지는 웅장하고 힘찬 승리 팡파르 행진곡
const DAVID_VICTORY_MELODY  = [0, 4, 7, 12, 12, 14, 16, 12, 14, 11, 7, 11, 12, 16, 19, 19];
const DAVID_VICTORY_HARMONY = [4, 7, 12, 16, 16, 17, 19, 16, 17, 14, 11, 14, 16, 19, 24, 24];
const DAVID_VICTORY_BASS    = [-12, -12, -5, -5, -12, -7, -5, -12, -7, -7, -2, -7, -12, -5, -12, -12];
const DAVID_VICTORY_RHYTHM  = [
  0.65, 0.45, 0.65, 1.25,
  0.65, 0.65, 0.85, 0.85,
  0.65, 0.45, 0.65, 1.15,
  0.65, 0.65, 1.35, 0.95
];

// 에피소드 3 오프닝 및 엔딩 암전 내레이션용 오리지널 한국어 남성 성우 음성(MP3) 매핑
const DAVID_MALE_VOICE_AUDIO_MAP = {
  '내가 이새의 아들 다윗을 만나니': 'assets/voice/ep3_open_1.mp3',
  '내 마음에 맞는 사람이라 내 뜻을 다 이루리라': 'assets/voice/ep3_open_2.mp3',
  '보라 날이 이르리니 내가 다윗에게 한 의로운 가지를 일으킬 것이라 그가 왕이 되어 지혜롭게 다스리며 세상에서 정의와 공의를 행할 것이며': 'assets/voice/ep3_end_1.mp3',
  '아브라함과 다윗의 자손 예수 그리스도의 계보라': 'assets/voice/ep3_end_2.mp3'
};

const _maleVoiceRawBufferCache = {};
const _maleVoiceDecodedBufferCache = {};
let _activeMaleVoiceSource = null;
let _activeMaleVoiceHtmlAudio = null;
let _isMaleVoicePlaying = false;

function preloadDavidMaleVoiceAssets() {
  Object.values(DAVID_MALE_VOICE_AUDIO_MAP).forEach(url => {
    if (_maleVoiceRawBufferCache[url]) return;
    _maleVoiceRawBufferCache[url] = fetch(url)
      .then(res => (res.ok ? res.arrayBuffer() : null))
      .catch(() => null);
  });
}
preloadDavidMaleVoiceAssets();

function stopActiveMaleVoiceAudio() {
  _isMaleVoicePlaying = false;
  if (_activeMaleVoiceSource) {
    try {
      _activeMaleVoiceSource.onended = null;
      _activeMaleVoiceSource.stop();
    } catch (e) {}
    _activeMaleVoiceSource = null;
  }
  if (_activeMaleVoiceHtmlAudio) {
    try {
      _activeMaleVoiceHtmlAudio.onended = null;
      _activeMaleVoiceHtmlAudio.onerror = null;
      _activeMaleVoiceHtmlAudio.pause();
      _activeMaleVoiceHtmlAudio.currentTime = 0;
    } catch (e) {}
    _activeMaleVoiceHtmlAudio = null;
  }
}

function isMaleVoiceAudioPlaying() {
  return _isMaleVoicePlaying;
}

function speakMaleVoiceNarration(spokenText, onFinish) {
  let finishedCalled = false;
  const finishOnce = () => {
    if (finishedCalled) return;
    finishedCalled = true;
    _isMaleVoicePlaying = false;
    if (typeof onFinish === 'function') onFinish();
  };

  stopActiveMaleVoiceAudio();
  try {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  } catch (e) {}

  const key = (spokenText || '').trim();
  const audioUrl = DAVID_MALE_VOICE_AUDIO_MAP[key];

  if (audioUrl) {
    _isMaleVoicePlaying = true;
    const playViaHtmlAudio = () => {
      try {
        const audio = new Audio(audioUrl);
        audio.volume = 1.0;
        _activeMaleVoiceHtmlAudio = audio;
        audio.onended = () => {
          if (_activeMaleVoiceHtmlAudio === audio) _activeMaleVoiceHtmlAudio = null;
          finishOnce();
        };
        audio.onerror = () => {
          if (_activeMaleVoiceHtmlAudio === audio) _activeMaleVoiceHtmlAudio = null;
          finishOnce();
        };
        const p = audio.play();
        if (p && typeof p.catch === 'function') {
          p.catch(() => finishOnce());
        }
      } catch (e) {
        finishOnce();
      }
    };

    const ctx = typeof getAudioCtx === 'function' ? getAudioCtx() : null;
    if (ctx) {
      const startBufferPlayback = (audioBuffer) => {
        if (!audioBuffer || finishedCalled) {
          if (!finishedCalled) playViaHtmlAudio();
          return;
        }
        try {
          if (ctx.state === 'suspended') ctx.resume();
          const source = ctx.createBufferSource();
          const gainNode = ctx.createGain();
          gainNode.gain.value = 1.15;
          source.buffer = audioBuffer;
          source.connect(gainNode);
          gainNode.connect(ctx.destination);
          _activeMaleVoiceSource = source;
          source.onended = () => {
            if (_activeMaleVoiceSource === source) _activeMaleVoiceSource = null;
            finishOnce();
          };
          source.start(0);
        } catch (e) {
          playViaHtmlAudio();
        }
      };

      if (_maleVoiceDecodedBufferCache[audioUrl]) {
        startBufferPlayback(_maleVoiceDecodedBufferCache[audioUrl]);
        return;
      }

      const rawPromise = _maleVoiceRawBufferCache[audioUrl] || fetch(audioUrl).then(r => (r.ok ? r.arrayBuffer() : null)).catch(() => null);
      _maleVoiceRawBufferCache[audioUrl] = rawPromise;
      rawPromise
        .then(rawBuf => {
          if (!rawBuf) return null;
          return ctx.decodeAudioData(rawBuf.slice(0));
        })
        .then(decoded => {
          if (decoded) _maleVoiceDecodedBufferCache[audioUrl] = decoded;
          startBufferPlayback(decoded);
        })
        .catch(() => {
          playViaHtmlAudio();
        });
      return;
    }

    playViaHtmlAudio();
    return;
  }

  finishOnce();
}

let davidWarSfxTimer = null;
function playWarBattleCrySfx(mode = 'battle') {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const now = ctx.currentTime;

  if (mode === 'battle') {
    [110, 165, 220].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq * 0.94, now + i * 0.08);
      osc.frequency.linearRampToValueAtTime(freq, now + 0.45);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.045, now + 0.25);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 2.45);
    });

    const bufferSize = ctx.sampleRate * 2.2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(520, now);
    filter.frequency.linearRampToValueAtTime(680, now + 1.0);
    filter.Q.setValueAtTime(2.2, now);

    const roarGain = ctx.createGain();
    roarGain.gain.setValueAtTime(0.001, now);
    roarGain.gain.linearRampToValueAtTime(0.09, now + 0.3);
    roarGain.gain.setValueAtTime(0.08, now + 1.4);
    roarGain.gain.exponentialRampToValueAtTime(0.001, now + 2.15);

    whiteNoise.connect(filter);
    filter.connect(roarGain);
    roarGain.connect(ctx.destination);
    whiteNoise.start(now);
    whiteNoise.stop(now + 2.2);

    [0.25, 0.75, 1.25, 1.75].forEach(tOff => {
      const clang = ctx.createOscillator();
      const cGain = ctx.createGain();
      clang.type = 'square';
      clang.frequency.setValueAtTime(1480 + (tOff * 300), now + tOff);
      clang.frequency.exponentialRampToValueAtTime(620, now + tOff + 0.14);
      cGain.gain.setValueAtTime(0.05, now + tOff);
      cGain.gain.exponentialRampToValueAtTime(0.001, now + tOff + 0.15);
      clang.connect(cGain);
      cGain.connect(ctx.destination);
      clang.start(now + tOff);
      clang.stop(now + tOff + 0.16);
    });
  } else if (mode === 'giant_steps') {
    [0.1, 0.95, 1.85].forEach(tOff => {
      const thud = ctx.createOscillator();
      const tGain = ctx.createGain();
      thud.type = 'sine';
      thud.frequency.setValueAtTime(95, now + tOff);
      thud.frequency.exponentialRampToValueAtTime(28, now + tOff + 0.42);
      tGain.gain.setValueAtTime(0.14, now + tOff);
      tGain.gain.exponentialRampToValueAtTime(0.001, now + tOff + 0.45);
      thud.connect(tGain);
      tGain.connect(ctx.destination);
      thud.start(now + tOff);
      thud.stop(now + tOff + 0.46);
    });
  }
}

function isDavidTensionActive() {
  if (currentEpisode !== 'david') return false;
  if (davidOpeningState.active) return false;
  if (currentStage === 1 && davidStage1Phase === 'defend_sheep') return true;
  if (
    currentStage === 2 &&
    !davidStage2Cutscene.active &&
    davidIdolHits < davidReqIdolHits
  ) {
    return true;
  }
  return false;
}

function isDavidStage2VictoryMusicActive() {
  return (
    currentEpisode === 'david' &&
    currentStage === 2 &&
    (davidStage2Cutscene.active || davidIdolHits >= davidReqIdolHits)
  );
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
  if (davidOpeningState.active) return 300;

  // 1) [스테이지 2 골리앗 격파 후] 웅장하고 힘찬 승리 팡파르 행진곡!
  if (isDavidStage2VictoryMusicActive()) {
    const idx = step % DAVID_VICTORY_MELODY.length;
    const rhythmMult = DAVID_VICTORY_RHYTHM[idx] || 1.0;
    const stepMs = Math.round(230 * rhythmMult);
    if (!ctx) return stepMs;

    const now = ctx.currentTime;
    const dur = (stepMs / 1000) * 1.15;
    const rootMidi = 62;
    const leadFreq = toFreq(rootMidi + DAVID_VICTORY_MELODY[idx]);
    const harmFreq = toFreq(rootMidi + DAVID_VICTORY_HARMONY[idx]);
    const bassFreq = toFreq(rootMidi + DAVID_VICTORY_BASS[idx]);

    const brassOsc = ctx.createOscillator();
    const brassFilter = ctx.createBiquadFilter();
    const brassGain = ctx.createGain();
    brassOsc.type = 'sawtooth';
    brassOsc.frequency.setValueAtTime(leadFreq, now);
    brassFilter.type = 'lowpass';
    brassFilter.frequency.setValueAtTime(2200, now);
    brassGain.gain.setValueAtTime(0.001, now);
    brassGain.gain.linearRampToValueAtTime(0.055, now + 0.02);
    brassGain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    brassOsc.connect(brassFilter);
    brassFilter.connect(brassGain);
    brassGain.connect(ctx.destination);
    brassOsc.start(now); brassOsc.stop(now + dur + 0.02);

    playHarpPluckNote(ctx, harmFreq, now + 0.01, dur * 0.95, 0.042, false);

    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bassOsc.type = 'triangle';
    bassOsc.frequency.setValueAtTime(bassFreq, now);
    bassGain.gain.setValueAtTime(0.001, now);
    bassGain.gain.linearRampToValueAtTime(0.065, now + 0.015);
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + dur * 0.9);
    bassOsc.connect(bassGain);
    bassGain.connect(ctx.destination);
    bassOsc.start(now); bassOsc.stop(now + dur);
    return stepMs;
  }

  // 2) 디펜스 및 골리앗 대결 중 긴장감 넘치는 전투 BGM
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

  // 3) [스테이지 1 & 3 요청사항] 1분(60초, 192박자) 다윗의 수금(하프) 모음곡 무한 반복
  const suiteLen = DAVID_HARP_1MIN_SUITE.melody.length; // 192박자
  const idx = step % suiteLen;
  const rhythmMult = DAVID_HARP_1MIN_SUITE.rhythm[idx] || 1.0;
  const baseTempo = st === 3 ? 348 : (st === 4 ? 340 : 354);
  let stepMs = Math.round(baseTempo * rhythmMult);
  if (mode === 'timeattack' && playing && st <= 3) {
    stepMs = (timeRem < 4.0) ? Math.round(stepMs * 0.68) : Math.round(stepMs * 0.86);
  }
  if (!ctx) return stepMs;

  const now = ctx.currentTime;
  const dur = (stepMs / 1000) * 1.55;
  const rootMidi = st === 3 ? 62 : (st === 4 ? 65 : 60);
  const leadFreq = toFreq(rootMidi + DAVID_HARP_1MIN_SUITE.melody[idx]);
  const ch1Freq  = toFreq(rootMidi + DAVID_HARP_1MIN_SUITE.chord1[idx]);
  const ch2Freq  = toFreq(rootMidi + DAVID_HARP_1MIN_SUITE.chord2[idx]);
  const bassFreq = toFreq(rootMidi + DAVID_HARP_1MIN_SUITE.bass[idx]);

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
  const maxSteps = Math.min(clean.length, 36);

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
// 3. [오프닝 & 엔딩 암전 시네마틱 시퀀서]
// -------------------------------------------------------------------------
function clearDavidOpeningTimers() {
  davidOpeningState.timers.forEach(t => clearTimeout(t));
  davidOpeningState.timers = [];
  if (davidWarSfxTimer) { clearInterval(davidWarSfxTimer); davidWarSfxTimer = null; }
  stopActiveMaleVoiceAudio();
  try {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  } catch (e) {}
}

function runDavidBlackoutSequence(slides, onComplete) {
  ensureDavidCustomUI();
  clearDavidOpeningTimers();

  const overlay = document.getElementById('david-cinematic-overlay');
  const textWrap = document.getElementById('david-cinematic-text-wrap');
  const iconEl = document.getElementById('david-cinematic-icon');
  const mainText = document.getElementById('david-cinematic-main-text');
  const subText = document.getElementById('david-cinematic-sub-text');
  if (!overlay || !textWrap || !mainText || !subText) {
    if (onComplete) onComplete();
    return;
  }

  davidOpeningState.active = true;
  const prevTimeAttack = isTimeAttackActive;
  isPlaying = false;
  isTimeAttackActive = false;
  if (typeof setInGameHudControlsVisible === 'function') setInGameHudControlsVisible(false);

  overlay.classList.remove('hidden');
  overlay.classList.add('flex');
  overlay.style.opacity = '1';

  const registerTimer = (fn, ms) => {
    const t = setTimeout(fn, ms);
    davidOpeningState.timers.push(t);
    return t;
  };

  const finishSequence = () => {
    overlay.style.opacity = '0';
    registerTimer(() => {
      overlay.classList.add('hidden');
      overlay.classList.remove('flex');
      davidOpeningState.active = false;
      clearDavidOpeningTimers();
      if (onComplete) onComplete(prevTimeAttack);
    }, 650);
  };

  const playSlideAt = (idx) => {
    if (!davidOpeningState.active) return;
    if (idx >= slides.length) {
      finishSequence();
      return;
    }

    const slide = slides[idx];
    let minTimeElapsed = false;
    let voiceDone = !slide.voiceText;
    let advanced = false;

    const tryAdvanceSlide = () => {
      if (advanced || !davidOpeningState.active) return;
      if (!minTimeElapsed || !voiceDone) return;
      advanced = true;
      textWrap.style.opacity = '0';
      registerTimer(() => {
        playSlideAt(idx + 1);
      }, 650);
    };

    textWrap.style.opacity = '0';
    registerTimer(() => {
      if (!davidOpeningState.active) return;
      if (iconEl) {
        iconEl.textContent = slide.icon || '✨';
        iconEl.className = 'text-6xl mb-4 drop-shadow-lg';
      }
      mainText.innerHTML = slide.html || '';
      subText.textContent = slide.sub || '';
      subText.className = slide.sub ? 'text-amber-300 font-jua text-base sm:text-xl mt-4 tracking-wide' : 'hidden';
      textWrap.style.opacity = '1';

      if (slide.voiceText) {
        speakMaleVoiceNarration(slide.voiceText, () => {
          registerTimer(() => {
            voiceDone = true;
            tryAdvanceSlide();
          }, 450);
        });
        registerTimer(() => {
          voiceDone = true;
          tryAdvanceSlide();
        }, Math.max(slide.durationMs + 4500, 14500));
      }
      if (slide.sfxMode) {
        playWarBattleCrySfx(slide.sfxMode);
      }
    }, 280);

    registerTimer(() => {
      minTimeElapsed = true;
      try {
        if (!isMaleVoiceAudioPlaying() && (!('speechSynthesis' in window) || !window.speechSynthesis.speaking)) {
          voiceDone = true;
        }
      } catch (e) {
        voiceDone = true;
      }
      tryAdvanceSlide();
    }, Math.max(800, slide.durationMs - 650));
  };

  playSlideAt(0);
}

function startDavidStage1Opening(onDone) {
  runDavidBlackoutSequence(
    [
      {
        icon: '🐑',
        html: '"내가 이새의 아들 다윗을 만나니... "',
        sub: '',
        voiceText: '내가 이새의 아들 다윗을 만나니',
        durationMs: 5400
      },
      {
        icon: '🪉',
        html: '"내 마음에 맞는 사람이라 내 뜻을 다 이루리라 "',
        sub: '- 사도행전 13:22 -',
        voiceText: '내 마음에 맞는 사람이라 내 뜻을 다 이루리라',
        durationMs: 6500
      }
    ],
    () => {
      isPlaying = true;
      if (currentMode === 'timeattack') isTimeAttackActive = true;
      startStageBgm(1);
      if (onDone) onDone();
    }
  );
}

// -------------------------------------------------------------------------
// 4. 커스텀 UI 오버레이 & 16비트 픽셀 조준 렌더러 (놋투구·청동 비늘갑옷 디테일 적용)
// -------------------------------------------------------------------------
function ensureDavidCustomUI() {
  let uiRoot = document.getElementById('david-custom-ui');
  if (!uiRoot) {
    uiRoot = document.createElement('div');
    uiRoot.id = 'david-custom-ui';
    uiRoot.className = 'pointer-events-none';
    uiRoot.innerHTML = `
      <!-- [오프닝 & 엔딩 암전 내레이션 오버레이] -->
      <div id="david-cinematic-overlay" class="hidden pointer-events-auto fixed inset-0 bg-black z-50 flex-col items-center justify-center p-6 text-center transition-opacity duration-700" style="opacity:0;">
        <div id="david-cinematic-text-wrap" class="max-w-2xl transition-opacity duration-500 px-4 flex flex-col items-center" style="opacity:0;">
          <div id="david-cinematic-icon" class="text-6xl mb-4 drop-shadow-lg">✨</div>
          <p id="david-cinematic-main-text" class="text-white font-jua text-xl sm:text-3xl leading-relaxed drop-shadow-lg break-keep"></p>
          <p id="david-cinematic-sub-text" class="hidden"></p>
        </div>
      </div>

      <!-- [스테이지 1] 좌측 세로형 가변 배부름 게이지 & 좌측 상단 디펜스 배지 -->
      <div id="david-st1-panel" class="hidden">
        <div id="david-hunger-row" class="fixed left-3 top-1/2 -translate-y-1/2 z-20 mc-panel px-2 py-3 rounded-2xl bg-slate-900/85 border-2 border-amber-400 text-white shadow-xl flex flex-col items-center gap-1.5">
          <span class="text-[10px] font-jua text-amber-300 leading-none">🐑배부름</span>
          <span class="text-base leading-none select-none" title="100% 배부름">😊</span>
          <div class="w-4 h-28 bg-slate-800 rounded-full overflow-hidden border border-slate-500 flex flex-col justify-end p-0.5">
            <div id="david-hunger-bar" class="w-full rounded-full bg-gradient-to-t from-amber-400 to-emerald-400 transition-all duration-200" style="height:0%; width:100%;"></div>
          </div>
          <span class="text-base leading-none select-none" title="0% 배고픔">😢</span>
          <span id="david-hunger-text" class="text-[11px] font-jua text-emerald-300 leading-none">0%</span>
        </div>

        <div id="david-defense-row" class="hidden fixed left-2 z-20 mc-panel px-3 py-1.5 rounded-xl bg-slate-900/85 border border-rose-400 text-white shadow-lg flex-col gap-0.5" style="top: 46px;">
          <div class="flex items-center gap-2 text-xs font-jua text-rose-300">
            <span id="david-defense-title">🛡️ 디펜스</span>
            <span id="david-defense-timer" class="text-white">95.0초</span>
          </div>
          <div id="david-sheep-loss-badge" class="text-[10px] font-bold text-amber-200">사라진 양: 0/2</div>
          <div id="david-wall-tier-badge" class="text-[10px] font-bold text-sky-300">흙담: 0/7</div>
        </div>
      </div>

      <!-- 스테이지 2: 16비트 도트 픽셀아트 스타일 물맷돌 집중 조준 모달 -->
      <div id="david-aim-overlay" class="hidden pointer-events-auto fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-4">
        <div class="mc-panel bg-slate-900/95 border-4 border-amber-400 rounded-3xl p-5 max-w-sm w-full flex flex-col items-center gap-3 text-white shadow-2xl">
          <div class="flex items-center justify-between w-full px-1">
            <span class="text-amber-300 font-jua text-lg">🎯 골리앗 놋투구 위 우상 조준!</span>
            <span id="david-aim-lock-badge" class="px-2 py-0.5 rounded bg-slate-800 border border-slate-600 text-[11px] font-mono font-bold text-sky-300">AIMING...</span>
          </div>
          <p class="text-xs text-slate-200 text-center">픽셀 십자선이 <span class="text-amber-300 font-bold">놋투구 위 황금·보라 우상 중앙</span>에 겹칠 때 발사하세요!</p>
          <div class="relative w-64 h-44 rounded-xl border-4 border-slate-700 overflow-hidden shadow-inner bg-slate-950">
            <canvas id="david-aim-canvas" width="128" height="88" class="w-full h-full block" style="image-rendering: pixelated;"></canvas>
          </div>
          <div class="flex gap-2 w-full">
            <button type="button" onclick="fireDavidSlingAtIdol()" class="mc-btn flex-1 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-jua text-base shadow-lg">🪨 물맷돌 발사!</button>
            <button type="button" onclick="closeDavidAimOverlay()" class="mc-btn px-4 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-jua text-sm">피하기</button>
          </div>
        </div>
      </div>

      <!-- 스테이지 2 & 3: 동물의 숲 스타일 말풍선 대화창 (조이스틱·시점·점프 버튼보다 항상 앞 레이어 보장) -->
      <div id="david-npc-dialog-layer" class="fixed inset-0 pointer-events-none flex flex-col items-center justify-end" style="z-index: 135;">
        <div id="david-npc-dialog"
             onpointerdown="event.stopPropagation()"
             ontouchstart="event.stopPropagation()"
             class="hidden relative pointer-events-auto mb-3 sm:mb-5 mc-panel bg-amber-50/95 backdrop-blur-md border-[3px] border-amber-700/90 rounded-2xl sm:rounded-3xl p-3 sm:p-4 max-w-xl w-[92%] text-slate-900 shadow-2xl flex flex-col gap-1.5 sm:gap-2">
          <div class="flex items-center justify-between gap-2">
            <span id="david-npc-name" class="px-2.5 py-0.5 rounded-full bg-amber-700 text-amber-100 font-jua text-xs sm:text-sm">이름</span>
            <span class="david-dialog-sound-tag text-[10px] sm:text-[11px] font-bold text-amber-900/80">🔊 또로롱 말풍선 사운드</span>
          </div>
          <p id="david-npc-text" class="font-bold text-xs sm:text-sm leading-snug sm:leading-relaxed min-h-[28px] sm:min-h-[38px] text-slate-900"></p>
          <div class="flex justify-end gap-2">
            <button id="david-npc-action-btn" type="button" onclick="confirmDavidNpcDialog()" class="mc-btn px-4 sm:px-5 py-1 sm:py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-jua text-xs sm:text-sm">알겠습니다!</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(uiRoot);
  }
  uiRoot.classList.remove('hidden');
  return uiRoot;
}

function renderDavidPixelAimScreen(retX, retY, tgtX, tgtY, now) {
  const cvs = document.getElementById('david-aim-canvas');
  if (!cvs) return;
  const ctx = cvs.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const gx = Math.round((tgtX + 24) * 0.5);
  const gy = Math.round((tgtY + 24) * 0.5);
  const rx = Math.round((retX + 20) * 0.5);
  const ry = Math.round((retY + 20) * 0.5);

  const px = (x, y, w, h, col) => {
    ctx.fillStyle = col;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };

  px(0, 0, 128, 22, '#0c4a6e');
  px(0, 22, 128, 22, '#0369a1');
  px(0, 44, 128, 22, '#0284c7');
  px(0, 66, 128, 22, '#78350f');

  const clOff = Math.round((now * 0.008) % 140) - 20;
  px(clOff, 10, 18, 4, '#bae6fd');
  px(clOff + 3, 8, 12, 2, '#e0f2fe');
  px(105 - (clOff * 0.5), 16, 16, 3, '#bae6fd');

  for (let i = 0; i < 128; i += 8) {
    const ch = 12 + ((i * 7) % 10);
    px(i, 68 - ch, 8, ch, '#92400e');
    px(i, 68 - ch, 8, 2, '#b45309');
  }

  const hx = gx;
  const hy = gy + 26;

  // 골리앗의 비늘처럼 청동 조각을 겹쳐 만든 청동 갑옷(어린갑) & 청동 견갑 표현
  px(hx - 36, hy + 12, 72, 22, '#451a03');
  px(hx - 34, hy + 11, 68, 3,  '#d97706');
  px(hx - 36, hy + 12, 12, 10, '#b45309');
  px(hx + 24, hy + 12, 12, 10, '#b45309');
  for (let row = 0; row < 5; row++) {
    const sy = hy + 14 + row * 3;
    const rowOff = (row % 2) * 3;
    for (let sx = hx - 30 + rowOff; sx <= hx + 26; sx += 6) {
      px(sx, sy, 5, 3, '#b45309');
      px(sx + 1, sy, 3, 1, '#f59e0b');
      px(sx, sy + 2, 5, 1, '#78350f');
    }
  }

  px(hx - 16, hy - 2, 32, 14, '#c27838');
  px(hx - 16, hy + 7, 32, 6, '#1e293b');
  px(hx - 10, hy + 2, 5, 3, '#ef4444');
  px(hx + 5,  hy + 2, 5, 3, '#ef4444');
  px(hx - 8,  hy + 2, 2, 2, '#fef08a');
  px(hx + 7,  hy + 2, 2, 2, '#fef08a');

  // 골리앗의 놋투구(청동 돔, 코 보호대, 뺨 보호대, 청동 리벳 징)
  px(hx - 21, hy - 12, 42, 11, '#b45309');
  px(hx - 18, hy - 16, 36, 5,  '#d97706');
  px(hx - 13, hy - 19, 26, 3,  '#f59e0b');
  px(hx - 8,  hy - 18, 10, 2,  '#fef08a');
  px(hx - 23, hy - 4,  46, 3,  '#78350f');
  px(hx - 2,  hy - 4,  4,  9,  '#d97706');
  px(hx - 1,  hy - 3,  2,  7,  '#fbbf24');
  px(hx - 21, hy - 1,  6,  11, '#92400e');
  px(hx - 19, hy,      3,  9,  '#d97706');
  px(hx + 15, hy - 1,  6,  11, '#92400e');
  px(hx + 16, hy,      3,  9,  '#d97706');
  [-16, -9, 0, 9, 16].forEach(ox => px(hx + ox, hy - 6, 2, 2, '#fde047'));

  const pulse = Math.floor(now * 0.01) % 2 === 0;
  px(gx - 10, gy + 6, 20, 4, '#ca8a04');
  px(gx - 8,  gy + 4, 16, 2, '#facc15');
  px(gx - 15, gy - 6, 6, 8, '#eab308');
  px(gx - 17, gy - 9, 4, 5, '#fde047');
  px(gx + 9,  gy - 6, 6, 8, '#eab308');
  px(gx + 13, gy - 9, 4, 5, '#fde047');
  px(gx - 8,  gy - 10, 16, 14, '#581c87');
  px(gx - 6,  gy - 8,  12, 10, '#7e22ce');
  px(gx - 7,  gy - 16, 3, 6, '#facc15');
  px(gx - 8,  gy - 18, 3, 3, '#fef08a');
  px(gx + 4,  gy - 16, 3, 6, '#facc15');
  px(gx + 5,  gy - 18, 3, 3, '#fef08a');
  px(gx - 3,  gy - 4, 6, 6, pulse ? '#f43f5e' : '#e11d48');
  px(gx - 1,  gy - 2, 2, 2, '#ffffff');
  px(gx - 4,  gy - 8, 2, 2, '#fde047');
  px(gx + 2,  gy - 8, 2, 2, '#fde047');

  const brkCol = pulse ? '#fde047' : '#f59e0b';
  px(gx - 18, gy - 19, 5, 2, brkCol); px(gx - 18, gy - 19, 2, 5, brkCol);
  px(gx + 13, gy - 19, 5, 2, brkCol); px(gx + 16, gy - 19, 2, 5, brkCol);
  px(gx - 18, gy + 8,  5, 2, brkCol); px(gx - 18, gy + 5,  2, 5, brkCol);
  px(gx + 13, gy + 8,  5, 2, brkCol); px(gx + 16, gy + 5,  2, 5, brkCol);

  const dist = Math.hypot((retX + 20) - (tgtX + 24), (retY + 20) - (tgtY + 24));
  const hitThreshold = (currentMode === 'kinder') ? 46 : (currentMode === 'junior' ? 38 : 34);
  const isLockedOn = (dist <= hitThreshold);
  const retCol = isLockedOn ? '#4ade80' : '#38bdf8';
  const retSub = isLockedOn ? '#fef08a' : '#e0f2fe';

  px(rx - 11, ry - 11, 6, 2, retCol); px(rx - 11, ry - 11, 2, 6, retCol);
  px(rx + 5,  ry - 11, 6, 2, retCol); px(rx + 9,  ry - 11, 2, 6, retCol);
  px(rx - 11, ry + 9,  6, 2, retCol); px(rx - 11, ry + 5,  2, 6, retCol);
  px(rx + 5,  ry + 9,  6, 2, retCol); px(rx + 9,  ry + 5,  2, 6, retCol);

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
  const ov = document.getElementById('david-cinematic-overlay');
  if (st1) st1.classList.add('hidden');
  if (aim) aim.classList.add('hidden');
  if (dlg) dlg.classList.add('hidden');
  if (ov) { ov.classList.add('hidden'); ov.classList.remove('flex'); }
  clearDavidOpeningTimers();
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
// 5. 다윗 캐릭터(눈 흰자·눈동자·눈썹·코·볼·입 디테일), 늑대, 사무엘 3D 모델링
// -------------------------------------------------------------------------
function createDavidHeroMesh() {
  const g = new THREE.Group();
  const isKingStage = (currentStage === 3 || currentStage === 4);
  const tunic = isKingStage ? matDavidCached('#991b1b', '#7f1d1d') : matDavidCached('#fef3c7', '#fde68a');
  const vest = isKingStage ? matDavidCached('#facc15', '#ca8a04') : matDavidCached('#b45309', '#78350f');
  const beltMat = matDavidCached('#78350f');
  const skin = matDavidCached('#fed7aa', '#fdba74');
  const noseMat = matDavidCached('#fdba74', '#f59e0b');
  const hairMat = matDavidCached('#92400e', '#78350f');
  const pouchMat = matDavidCached('#d97706', '#92400e');
  const eyeWhiteMat = matDavidCached('#ffffff');
  const eyePupilMat = matDavidCached('#0f172a');
  const mouthMat = matDavidCached('#be123c');
  const cheekMat = matDavidCached('#fda4af');
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
  const hairSideL = createBox(0.14, 0.38, 0.68, hairMat, -0.38, 2.22, -0.04);
  const hairSideR = createBox(0.14, 0.38, 0.68, hairMat,  0.38, 2.22, -0.04);

  const lEyeWhite = createBox(0.20, 0.14, 0.05, eyeWhiteMat, -0.18, 2.17, 0.39, false);
  const rEyeWhite = createBox(0.20, 0.14, 0.05, eyeWhiteMat,  0.18, 2.17, 0.39, false);
  const lPupil = createBox(0.10, 0.12, 0.06, eyePupilMat, -0.15, 2.17, 0.40, false);
  const rPupil = createBox(0.10, 0.12, 0.06, eyePupilMat,  0.15, 2.17, 0.40, false);
  const lBrow = createBox(0.22, 0.05, 0.06, hairMat, -0.18, 2.28, 0.40, false);
  const rBrow = createBox(0.22, 0.05, 0.06, hairMat,  0.18, 2.28, 0.40, false);
  const nose = createBox(0.10, 0.12, 0.10, noseMat, 0, 2.08, 0.41, false);
  const lCheek = createBox(0.12, 0.07, 0.05, cheekMat, -0.26, 2.04, 0.39, false);
  const rCheek = createBox(0.12, 0.07, 0.05, cheekMat,  0.26, 2.04, 0.39, false);
  const mouthCenter = createBox(0.18, 0.06, 0.06, mouthMat, 0, 1.94, 0.40, false);
  const mouthCornerL = createBox(0.06, 0.06, 0.06, mouthMat, -0.10, 1.97, 0.40, false);
  const mouthCornerR = createBox(0.06, 0.06, 0.06, mouthMat,  0.10, 1.97, 0.40, false);

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
    head, hairTop, hairBack, hairSideL, hairSideR,
    lEyeWhite, rEyeWhite, lPupil, rPupil, lBrow, rBrow, nose, lCheek, rCheek,
    mouthCenter, mouthCornerL, mouthCornerR,
    lArm, rArm
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
  const eyeWhite = matDavidCached('#ffffff');
  const eyeMat = matDavidCached('#0f172a');

  const torso = createBox(0.88, 1.25, 0.52, robeMat, 0, 0.85, 0);
  const ephod = createBox(0.92, 0.85, 0.56, ephodMat, 0, 1.05, 0);
  const breastplate = createBox(0.42, 0.42, 0.60, goldTrim, 0, 1.18, 0);
  const head = createBox(0.72, 0.72, 0.72, skinMat, 0, 1.88, 0);
  const beard = createBox(0.76, 0.48, 0.32, beardMat, 0, 1.62, 0.32);
  const hair = createBox(0.80, 0.32, 0.80, beardMat, 0, 2.22, 0);
  const lEyeW = createBox(0.16, 0.11, 0.04, eyeWhite, -0.15, 1.92, 0.36);
  const rEyeW = createBox(0.16, 0.11, 0.04, eyeWhite,  0.15, 1.92, 0.36);
  const lEye = createBox(0.09, 0.09, 0.05, eyeMat, -0.15, 1.92, 0.37);
  const rEye = createBox(0.09, 0.09, 0.05, eyeMat,  0.15, 1.92, 0.37);

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

  g.add(torso, ephod, breastplate, head, beard, hair, lEyeW, rEyeW, lEye, rEye, lArm, rArm);
  g.userData = { lArm, rArm, hornGroup };
  return g;
}