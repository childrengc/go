// =========================================================================
// [ep4_miracle_base.js - 파트 1/2] 에피소드 4 : 예수님의 기적과 부활
// - 성경 말씀/퀴즈 DB, 나의 복음서 수첩(36종), 1분(60초) 갈릴리 복음서 BGM
// - 확장된 오픈월드 지형 고도 계산기(넓어진 골고다 언덕 포함) 및 소프트 로우 폴리곤 자연물 팩토리
// =========================================================================
window.__GAME_BUILD_VERSIONS__ = window.__GAME_BUILD_VERSIONS__ || {};
window.__GAME_BUILD_VERSIONS__.ep4_base = '20261120_v13';

const MIRACLE_SCRIPTURE = {
  1: {
    title: '메인 스테이지 1 클리어! 바람과 바다도 순종하는 분!',
    desc: '갈릴리 바다에 그물을 던져 물고기를 가득 잡고, 거센 풍랑 속에서 배의 균형을 잡으며 주무시던 예수님을 깨워 바람과 바다를 잠잠하게 하시는 기적을 목격했어요!',
    verse: '"예수께서 깨어 바람을 꾸짖으시며 바다더러 이르시되 잠잠하라 고요하라 하시니 바람이 그치고 아주 잔잔하여지더라" (마가복음 4장 39절)',
    btnText: '🗺️ 갈릴리 오픈월드로 돌아가기 ▶',
    quiz: {
      q: '퀴즈! 거센 폭풍우가 몰아치던 갈릴리 바다를 예수님은 어떻게 잠잠하게 하셨나요?',
      opts: ['말씀으로 바람을 꾸짖으시며 잠잠하라 하셨다', '제자들에게 노를 더 빨리 저으라고 하셨다', '비가 그칠 때까지 며칠을 기다리셨다'],
      ans: 0
    }
  },
  2: {
    title: '메인 스테이지 2 클리어! 오병이어로 오천 명을 먹이셨어요!',
    desc: '벳새다 언덕에서 어린아이의 보리떡 5개와 물고기 2마리를 찾아 예수님께 드리고, 모두가 배불리 먹은 뒤 남은 조각 열두 광주리를 거두었어요!',
    verse: '"예수께서 떡을 가져 축사하신 후에 앉아 있는 자들에게 나눠 주시고 물고기도 그렇게 그들의 원대로 주시니라" (요한복음 6장 11절)',
    btnText: '🗺️ 오픈월드로 나가 다음 여정 찾기 ▶',
    quiz: {
      q: '퀴즈! 오병이어 기적에서 어린아이가 예수님께 드린 도시락은 무엇이었나요?',
      opts: ['보리떡 다섯 개와 물고기 두 마리', '포도주 여섯 항아리와 무화과', '만나와 메추라기 열두 광주리'],
      ans: 0
    }
  },
  3: {
    title: '메인 스테이지 3 클리어! 예수님과 함께 걸은 십자가의 길!',
    desc: '예루살렘 거리에서 예수님이 가시는 길을 찾아내고, 지치신 예수님을 대신하여 골고다 언덕까지 십자가를 함께 지고 올라갔어요!',
    verse: '"마침 알렉산더와 루포의 아버지인 구레네 사람 시몬이 시골로부터 와서 지나가는데 그들이 그를 억지로 같이 가게 하여 예수의 십자가를 지우고" (마가복음 15장 21절)',
    btnText: '🌅 새벽의 빈 무덤 찾으러 가기 ▶',
    quiz: {
      q: '퀴즈! 골고다 언덕으로 가는 길에 예수님의 십자가를 대신 지고 걸어간 사람은 누구인가요?',
      opts: ['구레네 사람 시몬', '여리고의 세리장 삭개오', '다메섹의 사울'],
      ans: 0
    }
  },
  4: {
    title: '메인 스테이지 4 클리어! 예수님이 다시 살아나셨어요!',
    desc: '안개 낀 새벽 마을 미로에서 사람들의 단서를 모아 무덤을 찾아내고, 돌문이 열린 빈 무덤에서 부활의 기쁜 소식을 들었어요!',
    verse: '"천사가 여자들에게 말하여 이르되 너희는 무서워하지 말라 십자가에 못 박히신 예수를 너희가 찾는 줄을 내가 아노라 그가 여기 계시지 않고 그가 말씀하시던 대로 살아나셨느니라" (마태복음 28장 5~6절)',
    btnText: '✨ 부활 이후의 오픈월드 체험하기! ▶',
    quiz: {
      q: '퀴즈! 빈 무덤에 있던 천사는 예수님이 어떻게 되셨다고 알려주었나요?',
      opts: ['말씀하시던 대로 다시 살아나셨다', '다른 나라로 여행을 떠나셨다', '무덤 깊은 곳에 숨어 계신다'],
      ans: 0
    }
  }
};

// -------------------------------------------------------------------------
// 1. 에피소드 4 전역 상태 변수 선언
// -------------------------------------------------------------------------
const MIRACLE_WORLD_LIMIT = 152;
window.MIRACLE_EXP_LIMIT = 152;

let miracleSubMode = 'openworld'; // 'openworld' | 'main1_galilee' | 'main2_loaves' | 'main3_cross' | 'main4_tomb' | 'minigame' | 'ascension'
let miracleActiveMinigameId = null;
let miracleSavedOpenWorldPos = new THREE.Vector3(0, 0, -55);
let miracleSavedOpenWorldYaw = 0;

let miracleMainStagesCleared = { 1: false, 2: false, 3: false, 4: false };
let miracleIsPostResurrection = false;
let miracleAscensionSeen = false;
window.miracleBuildingBounds = [];
window.miracleWorldTreePositions = [];
window.miracleZacchaeusGroveTrees = [];
window.miracleRooftopSpawnSpots = [];

let miracleStageSpots = [];
let miracleEventSpots = [];
let miracleRumorNpcs = [];
let miracleAmbientProps = [];
let miracleActiveMiniState = {};
let miracleDialogState = {
  active: false,
  npc: null,
  activeSource: null,
  lastClosedAt: 0,
  title: '',
  category: 'rumor',
  text: '',
  quiz: null,
  onConfirm: null,
  onCancel: null,
  onReplay: null,
  typingTimer: null
};

// -------------------------------------------------------------------------
// 2. [나의 복음서 수첩] 데이터베이스 (총 36개)
// -------------------------------------------------------------------------
const MIRACLE_NOTEBOOK_DB = {
  rumors: [
    { id: 'rumor_cana',      region: '갈릴리',   title: '가나 혼인잔치의 포도주 소동', text: '"가나 마을 혼인잔치에 포도주가 다 떨어져서 큰일이 났대! 하인들이 물항아리를 찾고 있다던데?"', unlocksEvent: 'ev_cana' },
    { id: 'rumor_paralytic', region: '갈릴리',   title: '지붕으로 올라간 네 친구',     text: '"가버나움 집에 사람이 너무 많아서, 친구 네 명이 중풍병자를 들것에 메고 지붕으로 올라갔대!"', unlocksEvent: 'ev_paralytic' },
    { id: 'rumor_storm',     region: '갈릴리',   title: '바람과 바다를 꾸짖으신 분',   text: '"갈릴리 바다의 무서운 폭풍우도 그분 말씀 한마디에 거울처럼 잠잠해졌대!"', unlocksEvent: 'main_1' },
    { id: 'rumor_loaves',    region: '갈릴리',   title: '도시락 하나로 먹은 무리들',   text: '"벳새다 언덕에 모인 수천 명의 사람들이 어린아이의 작은 도시락 하나로 다 배불리 먹었대!"', unlocksEvent: 'main_2' },
    { id: 'rumor_children',  region: '갈릴리',   title: '어린이를 안아주시는 선생님',  text: '"제자들은 아이들을 꾸짖었지만, 예수님은 어린아이들이 내게 오는 것을 막지 말라고 하셨대!"', unlocksEvent: 'ev_children' },
    { id: 'rumor_well',      region: '사마리아', title: '수가성 우물가의 대화',        text: '"정오의 뜨거운 햇살 아래 우물가에서 한 여인이 물동이를 버려두고 마을로 달려가 외쳤대!"', unlocksEvent: 'ev_well' },
    { id: 'rumor_zacchaeus', region: '여리고',   title: '뽕나무 위로 올라간 세리장',   text: '"여리고의 키 작은 세리장 삭개오가 예수님을 보려고 앞길 돌무화과나무 위로 올라갔대!"', unlocksEvent: 'ev_zacchaeus' },
    { id: 'rumor_samaritan', region: '유대광야', title: '길가에 쓰러진 여행자 이야기', text: '"예수님이 진정한 이웃이 누구인지 알려주시려고 강도 만난 여행자 이야기를 들려주셨대!"', unlocksEvent: 'ev_samaritan' },
    { id: 'rumor_lepers',    region: '사마리아', title: '돌아와 감사한 한 사람',       text: '"열 명의 나병환자가 깨끗함을 받았는데, 사마리아 사람 한 명만 돌아와 하나님께 영광을 돌렸대!"', unlocksEvent: 'ev_lepers' },
    { id: 'rumor_palm',      region: '예루살렘', title: '나귀를 타신 평화의 왕',       text: '"예수님이 어린 나귀를 타고 예루살렘에 입성하실 때 사람들이 종려나무 가지를 흔들며 호산나 외쳤대!"', unlocksEvent: 'ev_palm' },
    { id: 'rumor_widow',     region: '예루살렘', title: '가난한 과부의 작은 동전 두 개', text: '"부자들은 많은 돈을 넣었지만, 예수님은 두 렙돈을 넣은 가난한 과부가 가장 많이 넣었다고 칭찬하셨대!"', unlocksEvent: 'ev_widow' },
    { id: 'rumor_identity',  region: '갈릴리',   title: '사람들이 말하는 그분은 누구?', text: '"어떤 사람은 선지자라 하고, 베드로는 주는 그리스도시요 살아 계신 하나님의 아들이시라고 고백했대!"', unlocksEvent: 'ev_washfeet' }
  ],
  miracles: [
    { id: 'mir_cana',      title: '물이 변하여 포도주가 되다',       verse: '요한복음 2:1~11',   desc: '가나 혼인잔치에서 여섯 돌항아리에 채운 물이 가장 좋은 포도주로 변한 첫 번째 표적.' },
    { id: 'mir_storm',     title: '폭풍우를 잠잠하게 하시다',         verse: '마가복음 4:35~41',  desc: '갈릴리 바다의 거센 광풍과 파도를 "잠잠하라 고요하라" 말씀으로 잔잔하게 하신 기적.' },
    { id: 'mir_paralytic', title: '네 친구의 믿음과 중풍병자 치유',   verse: '마가복음 2:1~12',   desc: '지붕을 뜯고 달아 내린 친구들의 믿음을 보시고 죄 사함과 고침을 주신 사건.' },
    { id: 'mir_loaves',    title: '오병이어로 오천 명을 먹이시다',     verse: '요한복음 6:1~13',   desc: '보리떡 5개와 물고기 2마리로 오천 명을 배불리 먹이고 열두 광주리를 남기신 기적.' },
    { id: 'mir_lepers',    title: '열 명의 나병환자를 깨끗하게 하시다', verse: '누가복음 17:11~19', desc: '제사장에게 보이라 하신 말씀에 순종해 가던 중 열 명이 모두 깨끗함을 받은 기적.' },
    { id: 'mir_fish',      title: '깊은 데로 가서 그물을 내리라',     verse: '누가복음 5:4~7',    desc: '밤새 한 마리도 못 잡았으나 말씀에 의지해 그물을 내리자 배에 가득 차게 잡힌 기적.' },
    { id: 'mir_resurrect', title: '사망을 이기시고 부활하시다',       verse: '마태복음 28:5~6',   desc: '십자가에서 죽으신 지 사흘 만에 돌무덤을 열고 말씀하신 대로 다시 살아나신 최고의 기적.' }
  ],
  parables: [
    { id: 'par_sower',   title: '[비유] 씨 뿌리는 사람의 네 가지 땅', verse: '마태복음 13:1~9',  desc: '길가, 돌밭, 가시떨기, 좋은 땅에 떨어진 씨앗을 통해 하나님의 말씀을 듣는 마음가짐을 가르쳐 주신 비유.' },
    { id: 'par_sheep',   title: '[비유] 잃어버린 양 한 마리',         verse: '누가복음 15:3~7',  desc: '아흔아홉 마리를 두고 잃어버린 한 마리 양을 끝까지 찾아 기뻐하는 목자의 사랑을 알려주신 비유.' },
    { id: 'par_builder', title: '[비유] 반석 위에 집을 지은 지혜로운 사람', verse: '마태복음 7:24~27', desc: '예수님의 말씀을 듣고 행하는 사람은 비바람이 불어도 무너지지 않는 반석 위의 집과 같다는 비유.' },
    { id: 'par_mustard', title: '[비유] 가장 작은 겨자씨 한 알의 성장', verse: '마태복음 13:31~32', desc: '씨앗 중 가장 작지만 자라나면 큰 나무가 되어 새들이 깃드는 천국의 비밀을 알려주신 비유.' }
  ],
  words: [
    { id: 'wd_john316',  title: '세상을 이처럼 사랑하사',           verse: '"하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니 이는 그를 믿는 자마다 멸망하지 않고 영생을 얻게 하려 하심이라" (요 3:16)' },
    { id: 'wd_john146',  title: '길이요 진리요 생명',               verse: '"내가 곧 길이요 진리요 생명이니 나로 말미암지 않고는 아버지께로 올 자가 없느니라" (요 14:6)' },
    { id: 'wd_mark1014', title: '어린아이들이 내게 오는 것',         verse: '"어린아이들이 내게 오는 것을 용납하고 금하지 말라 하나님의 나라가 이런 자의 것이니라" (막 10:14)' },
    { id: 'wd_john414',  title: '영원히 목마르지 아니하는 샘물',     verse: '"내가 주는 물을 마시는 자는 영원히 목마르지 아니하리니 내가 주는 물은 그 속에서 영생하도록 솟아나는 샘물이 되리라" (요 4:14)' },
    { id: 'wd_luke1910', title: '잃어버린 자를 찾아 구원하려 함',    verse: '"인자가 온 것은 잃어버린 자를 찾아 구원하려 함이니라" (눅 19:10)' },
    { id: 'wd_luke1037', title: '가서 너도 이와 같이 하라',         verse: '"자비를 베푼 자니이다 예수께서 이르시되 가서 너도 이와 같이 하라 하시니라" (눅 10:37)' },
    { id: 'wd_john1314', title: '서로 발을 씻어 주는 섬김',         verse: '"내가 주와 또는 선생이 되어 너희 발을 씻었으니 너희도 서로 발을 씻어 주는 것이 옳으니라" (요 13:14)' },
    { id: 'wd_mark1243', title: '마음을 다해 드린 두 렙돈',         verse: '"이 가난한 과부는 헌금함에 넣는 모든 사람보다 많이 넣었도다" (막 12:43)' },
    { id: 'wd_matt1128', title: '수고하고 무거운 짐 진 자들아',      verse: '"수고하고 무거운 짐 진 자들아 다 내게로 오라 내가 너희를 쉬게 하리라" (마 11:28)' },
    { id: 'wd_matt2820', title: '세상 끝날까지 너희와 항상 함께',    verse: '"볼지어다 내가 세상 끝날까지 너희와 항상 함께 있으리라 하시니라" (마 28:20)' }
  ],
  testimonies: [
    { id: 'test_emmaus',    title: '엠마오로 가는 두 제자의 뜨거워진 가슴', verse: '누가복음 24:13~35', desc: '부활하신 예수님과 동행하며 성경 말씀을 듣고, 떡을 떼실 때 눈이 밝아져 예수님을 알아본 증언.' },
    { id: 'test_thomas',    title: '도마의 고백: 나의 주님이시요 나의 하나님', verse: '요한복음 20:24~29', desc: '부활하신 예수님의 손과 옆구리를 확인한 도마의 고백과 "보지 못하고 믿는 자들은 복되도다" 하신 약속.' },
    { id: 'test_breakfast', title: '갈릴리 바닷가의 숯불 아침 식사와 사명',  verse: '요한복음 21:1~19',  desc: '부활하신 예수님이 조반을 준비해 먹이시고 베드로에게 "내 양을 먹이라" 사명을 맡기신 증언.' }
  ]
};

let miracleCollectedIds = new Set();

function getMiracleNotebookStorageKey() {
  return 'bible_ep4_notebook_' + (explorerName || 'guest');
}

function loadMiracleNotebookProgress() {
  miracleCollectedIds = new Set();
  miracleMainStagesCleared = { 1: false, 2: false, 3: false, 4: false };
  miracleIsPostResurrection = false;
  miracleAscensionSeen = false;
  try {
    const raw = localStorage.getItem(getMiracleNotebookStorageKey());
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach(id => miracleCollectedIds.add(id));
      } else if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.collected)) {
          parsed.collected.forEach(id => miracleCollectedIds.add(id));
        }
        if (parsed.clearedStages && typeof parsed.clearedStages === 'object') {
          [1, 2, 3, 4].forEach(n => {
            if (parsed.clearedStages[n]) miracleMainStagesCleared[n] = true;
          });
        }
        if (parsed.postResurrection) miracleIsPostResurrection = true;
        if (parsed.ascensionSeen) miracleAscensionSeen = true;
      }
    }
  } catch (e) {}
  // core.js 플레이어 진도와도 동기화 (이미 완주한 2회차 플레이어 해금 유지)
  if (typeof playerProgressData !== 'undefined' && playerProgressData.miracle) {
    const mp = playerProgressData.miracle;
    const mc = mp.maxClearedStage || 0;
    if (mc >= 1) miracleMainStagesCleared[1] = true;
    if (mc >= 2) miracleMainStagesCleared[2] = true;
    if (mc >= 3) miracleMainStagesCleared[3] = true;
    if (mc >= 4 || mp.completed) {
      miracleMainStagesCleared[1] = true;
      miracleMainStagesCleared[2] = true;
      miracleMainStagesCleared[3] = true;
      miracleMainStagesCleared[4] = true;
      miracleIsPostResurrection = true;
    }
    if (mp.completed) miracleAscensionSeen = true;
  }
  updateMiracleNotebookHudBadge();
}

function saveMiracleNotebookProgress() {
  try {
    const payload = {
      collected: Array.from(miracleCollectedIds),
      clearedStages: miracleMainStagesCleared,
      postResurrection: miracleIsPostResurrection,
      ascensionSeen: miracleAscensionSeen
    };
    localStorage.setItem(getMiracleNotebookStorageKey(), JSON.stringify(payload));
  } catch (e) {}
  updateMiracleNotebookHudBadge();
}

// 4개 메인 스테이지를 모두 해금(클리어)한 플레이어는 2회차부터 모든 스테이지에 자유 접근
function isMiracleAllStagesUnlocked() {
  const allCleared = Boolean(
    miracleMainStagesCleared[1] &&
    miracleMainStagesCleared[2] &&
    miracleMainStagesCleared[3] &&
    miracleMainStagesCleared[4]
  );
  if (allCleared || miracleAscensionSeen) return true;
  if (typeof playerProgressData !== 'undefined' && playerProgressData.miracle) {
    const mp = playerProgressData.miracle;
    if (mp.completed || (mp.maxClearedStage || 0) >= 4) return true;
  }
  return false;
}
window.isMiracleAllStagesUnlocked = isMiracleAllStagesUnlocked;

function unlockMiracleNotebookEntry(entryId, silent = false) {
  if (!entryId || miracleCollectedIds.has(entryId)) return false;
  miracleCollectedIds.add(entryId);
  saveMiracleNotebookProgress();

  if (!silent) {
    let foundItem = null;
    let catLabel = '📖 복음서 수첩';
    const categories = [
      ['rumors', '🟡 소문 기록'],
      ['miracles', '✨ 기적 목격'],
      ['parables', '🌱 비유 체험'],
      ['words', '📜 말씀 수집'],
      ['testimonies', '🕊️ 부활 증언']
    ];
    for (const [key, label] of categories) {
      const hit = MIRACLE_NOTEBOOK_DB[key].find(x => x.id === entryId);
      if (hit) { foundItem = hit; catLabel = label; break; }
    }
    if (foundItem) {
      playSfx('clock');
      showToast(`${catLabel} 추가! [${foundItem.title}] (수첩 ${miracleCollectedIds.size}/36)`);
    }
  }
  return true;
}

function getMiracleNotebookTotalCount() {
  return (
    MIRACLE_NOTEBOOK_DB.rumors.length +
    MIRACLE_NOTEBOOK_DB.miracles.length +
    MIRACLE_NOTEBOOK_DB.parables.length +
    MIRACLE_NOTEBOOK_DB.words.length +
    MIRACLE_NOTEBOOK_DB.testimonies.length
  );
}

// -------------------------------------------------------------------------
// 3. [자동 폴백 & 화면 진단 포함] 오픈월드 BGM 오디오 시스템
// -------------------------------------------------------------------------
let _miracleOpenWorldOgg = null;
let _miracleOggUnlockBound = false;
let _miracleOggCandidateIdx = 0;

// 숨겨진 이중 확장자나 대소문자, 대체 포맷까지 자동으로 순서대로 시도
const MIRACLE_BGM_CANDIDATES = [
  'assets/music/miracle01.ogg',
  'assets/music/miracle01.ogg.mp3',
  'assets/music/miracle01.mp3',
  'assets/music/miracle01.wav',
  'assets/music/Miracle01.ogg'
];

function canPlayMiracleOpenWorldOgg() {
  if (typeof currentEpisode !== 'undefined' && currentEpisode !== 'miracle') return false;
  if (miracleSubMode !== 'openworld') return false;
  if (typeof isPlaying !== 'undefined' && !isPlaying) return false;
  if (typeof isMenuBgmActive !== 'undefined' && isMenuBgmActive) return false;
  if (typeof bgmEnabled !== 'undefined' && !bgmEnabled) return false;
  return true;
}

function getMiracleOpenWorldOgg() {
  if (!_miracleOpenWorldOgg) {
    _miracleOggCandidateIdx = 0;
    _miracleOpenWorldOgg = new Audio(MIRACLE_BGM_CANDIDATES[0]);
    _miracleOpenWorldOgg.loop = true;
    _miracleOpenWorldOgg.preload = 'auto';
    _miracleOpenWorldOgg.volume = 0.65;

    _miracleOpenWorldOgg.addEventListener('error', () => {
      const failedPath = MIRACLE_BGM_CANDIDATES[_miracleOggCandidateIdx];
      const errCode = _miracleOpenWorldOgg.error ? _miracleOpenWorldOgg.error.code : 0;
      console.warn(`[EP4 BGM] 로드 실패 (${failedPath}), 에러코드: ${errCode}`);

      // 다음 후보 파일 경로가 있으면 자동으로 재시도
      if (_miracleOggCandidateIdx + 1 < MIRACLE_BGM_CANDIDATES.length) {
        _miracleOggCandidateIdx++;
        _miracleOpenWorldOgg.src = MIRACLE_BGM_CANDIDATES[_miracleOggCandidateIdx];
        _miracleOpenWorldOgg.load();
        if (canPlayMiracleOpenWorldOgg()) {
          _miracleOpenWorldOgg.play().catch(() => {});
        }
      } else {
        // 모든 후보 경로가 실패했을 때 인게임 화면에 정확한 원인 표시
        const reason = (errCode === 3 || errCode === 4)
          ? '파일이 없거나(404) 정식 Ogg 코덱이 아닙니다(확장자만 바꾼 파일인지 확인)'
          : `오디오 에러코드 ${errCode}`;
        if (typeof showToast === 'function' && canPlayMiracleOpenWorldOgg()) {
          showToast(`⚠️ BGM 재생 실패: ${reason} [assets/music/miracle01.ogg]`);
        }
      }
    });
  }
  return _miracleOpenWorldOgg;
}

function bindMiracleOggUserGestureUnlock() {
  if (_miracleOggUnlockBound) return;
  _miracleOggUnlockBound = true;

  const unlockHandler = () => {
    if (canPlayMiracleOpenWorldOgg()) {
      playMiracleOpenWorldOgg();
    } else {
      stopMiracleOpenWorldOgg(false);
    }
  };

  window.addEventListener('pointerdown', unlockHandler, { passive: true });
  window.addEventListener('touchstart', unlockHandler, { passive: true });
  window.addEventListener('keydown', unlockHandler, { passive: true });
  window.addEventListener('click', unlockHandler, { passive: true });
}

function playMiracleOpenWorldOgg() {
  bindMiracleOggUserGestureUnlock();

  if (!canPlayMiracleOpenWorldOgg()) {
    stopMiracleOpenWorldOgg(false);
    return;
  }

  const audio = getMiracleOpenWorldOgg();
  if (audio.paused) {
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.debug('[EP4 BGM] 터치 후 재생 대기:', err.name);
      });
    }
  }
}

function stopMiracleOpenWorldOgg(resetTime = false) {
  if (!_miracleOpenWorldOgg) return;
  if (!_miracleOpenWorldOgg.paused) {
    _miracleOpenWorldOgg.pause();
  }
  if (resetTime) {
    _miracleOpenWorldOgg.currentTime = 0;
  }
}
window.playMiracleOpenWorldOgg = playMiracleOpenWorldOgg;
window.stopMiracleOpenWorldOgg = stopMiracleOpenWorldOgg;

// 스테이지(1~4) 및 감람산 엔딩 전용 코드 기반 BGM 노트 데이터
const MIRACLE_STAGE_MELODY = [
  4, 7, 12, 16, 14, 12, 11, 7,  9, 12, 16, 19, 16, 12, 11, 7,  5, 9, 12, 17, 16, 12, 14, 7,
  7, 12, 16, 19, 21, 19, 16, 12, 14, 17, 21, 24, 23, 19, 17, 14, 16, 19, 24, 19, 17, 16, 14, 12
];
const MIRACLE_STAGE_CHORD1 = [
  0, 4, 7, 12, 11, 7, 7, 4,     4, 9, 12, 16, 12, 7, 7, 4,     0, 5, 9, 12, 12, 7, 9, 2,
  4, 7, 12, 16, 17, 16, 12, 7,   9, 12, 17, 21, 19, 14, 12, 11,  12, 16, 19, 16, 14, 12, 11, 7
];
const MIRACLE_STAGE_BASS = [
  -12,-12,-12,-5, -1,-1,-3,-3,  -3,-3,-3,-8, -8,-8,-5,-5,      -7,-7,-7,-12, -12,-12,-10,-5,
  -12,-12,-8,-8, -7,-7,-12,-12, -10,-10,-7,-7, -5,-5,-8,-10,   -12,-12,-3,-3, -7,-5,-5,-12
];
const MIRACLE_BASE_RHYTHM = [
  1.35, 0.55, 0.90, 1.40, 0.55, 0.95,
  1.45, 0.50, 0.50, 0.55, 1.35, 0.55,
  1.40, 0.55, 0.95, 1.30, 0.48, 0.48,
  1.40, 0.55, 0.95, 1.60, 0.55, 1.15
];

function scheduleMiracleBgmBeat(ctx, step, st, mode, playing, timeRem, toFreq) {
  // ✅ [핵심] 오픈월드에서는 Web Audio 오실레이터를 전혀 생성하지 않고 .ogg 스트리밍만 유지!
  if (miracleSubMode === 'openworld') {
    if (!playing || !canPlayMiracleOpenWorldOgg()) {
      stopMiracleOpenWorldOgg(false);
    } else {
      playMiracleOpenWorldOgg();
    }
    // 2500ms(2.5초)를 반환하여 BGM 타이머 콜백 자체가 거의 깨어나지 않도록 휴면 처리
    return 2500;
  }

  // 오픈월드가 아닌 스테이지에 들어오면 .ogg 재생을 즉시 멈추고 기존 코드 음원 재생
  stopMiracleOpenWorldOgg(false);

  // 1-A) 골고다 십자가의 길(스테이지 3): 십자가를 지고 올라갈 때 잔잔하고 애절한 단조 선율 (D단조 서정 애가)
  if (miracleSubMode === 'main3_cross') {
    const isCarrying = Boolean(miracleActiveMiniState && miracleActiveMiniState.phase === 'carry');
    // 애절하게 하강하며 호소하는 잔잔한 D단조 멜로디 (24스텝)
    const sadMelody = [
      7, 5, 3, 2,   0, 2, 3, 0,   -2, 0, 2, 3,   2, 0, -2, -5,
      3, 5, 7, 10,  8, 7, 5, 3,    5, 3, 2, 0,   2, 0, -2, 0
    ];
    const sadHarm = [
      3, 2, 0, -2, -5, -2, 0, -5, -5, -4, -2, 0, -2, -5, -5, -9,
      0, 2, 3, 7,   5, 3, 2, 0,    2, 0, -2, -5, -2, -5, -5, -5
    ];
    const sadBass = [
      -12,-12,-12,-12, -12,-12,-12,-12, -14,-14,-14,-14, -17,-17,-17,-17,
      -9,-9,-9,-9,     -7,-7,-7,-7,     -14,-14,-14,-14, -17,-17,-12,-12
    ];
    const sadRhy = [
      1.35, 0.90, 1.15, 1.55,  1.25, 0.85, 1.10, 1.65,
      1.30, 0.85, 1.15, 1.45,  1.25, 0.95, 1.20, 1.85,
      1.30, 0.90, 1.25, 1.55,  1.15, 0.90, 1.15, 1.55,
      1.30, 0.95, 1.15, 1.50,  1.20, 1.00, 1.35, 2.00
    ];
    const idx = step % sadMelody.length;
    const baseBeat = isCarrying ? 560 : 480;
    const stepMs = Math.round(baseBeat * sadRhy[idx]);
    if (!ctx) return stepMs;

    const now = ctx.currentTime;
    const dur = (stepMs / 1000) * 1.55;
    const rootMidi = 57; // A3 기반의 따뜻하고 깊은 애절한 단조 음역
    const leadFreq = toFreq(rootMidi + sadMelody[idx]);
    const harmFreq = toFreq(rootMidi + sadHarm[idx]);
    const bassFreq = toFreq(rootMidi + sadBass[idx]);

    const playSoftSorrow = (freq, startT, duration, peakVol, wave = 'sine') => {
      const osc = ctx.createOscillator();
      const lpf = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      osc.type = wave;
      osc.frequency.setValueAtTime(freq, startT);
      lpf.type = 'lowpass';
      lpf.frequency.setValueAtTime(wave === 'sine' ? 1400 : 820, startT);
      gain.gain.setValueAtTime(0.0005, startT);
      gain.gain.linearRampToValueAtTime(peakVol, startT + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0005, startT + duration);
      osc.connect(lpf);
      lpf.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startT);
      osc.stop(startT + duration + 0.04);
    };

    // 잔잔하고 여운이 긴 서정적 플루트/현악 패드 음색 (거친 사각파/톱니파 배제)
    playSoftSorrow(leadFreq, now, dur, isCarrying ? 0.036 : 0.032, 'sine');
    if (idx % 2 === 0) {
      playSoftSorrow(harmFreq, now + 0.04, dur * 1.15, 0.018, 'triangle');
    }
    if (idx % 4 === 0) {
      playSoftSorrow(bassFreq, now, dur * 1.85, 0.024, 'triangle');
    }
    return stepMs;
  }

  // 1-B) 갈릴리 바다 폭풍우(스테이지 1) 긴장 테마
  const isStormTension =
    (miracleSubMode === 'main1_galilee' &&
      (miracleActiveMiniState.phase === 'storm' || miracleActiveMiniState.phase === 'storm_balance'));

  if (isStormTension) {
    const tensionNotes = [0, 0, 3, 7, 8, 7, 5, 3, 0, 0, 5, 8, 7, 5, 3, 2];
    const tensionBass  = [-12, -12, -9, -5, -4, -5, -7, -9, -12, -12, -7, -4, -5, -7, -9, -10];
    const idx = step % tensionNotes.length;
    const stepMs = 210;
    if (!ctx) return stepMs;

    const now = ctx.currentTime;
    const dur = (stepMs / 1000) * 1.15;
    const rootMidi = 53;
    const leadFreq = toFreq(rootMidi + tensionNotes[idx]);
    const bassFreq = toFreq(rootMidi + tensionBass[idx]);

    const osc1 = ctx.createOscillator(), g1 = ctx.createGain();
    osc1.type = 'triangle'; osc1.frequency.setValueAtTime(leadFreq, now);
    g1.gain.setValueAtTime(0.001, now); g1.gain.linearRampToValueAtTime(0.045, now + 0.02);
    g1.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc1.connect(g1); g1.connect(ctx.destination);
    osc1.start(now); osc1.stop(now + dur + 0.02);

    const osc2 = ctx.createOscillator(), g2 = ctx.createGain();
    osc2.type = 'sawtooth'; osc2.frequency.setValueAtTime(bassFreq, now);
    g2.gain.setValueAtTime(0.001, now); g2.gain.linearRampToValueAtTime(0.042, now + 0.015);
    g2.gain.exponentialRampToValueAtTime(0.001, now + dur * 0.9);
    osc2.connect(g2); g2.connect(ctx.destination);
    osc2.start(now); osc2.stop(now + dur);
    return stepMs;
  }

  // 2) 일반 스테이지(갈릴리 맑은 날 · 오병이어 · 십자가 단서 · 빈 무덤 · 감람산) 코드 기반 BGM
  const idx = step % MIRACLE_STAGE_MELODY.length;
  const rhythmMult = MIRACLE_BASE_RHYTHM[idx % MIRACLE_BASE_RHYTHM.length] || 1.0;
  let stepMs = Math.round(340 * rhythmMult);
  if (mode === 'timeattack' && playing) {
    stepMs = (timeRem < 5.0) ? Math.round(stepMs * 0.68) : Math.round(stepMs * 0.85);
  }
  if (!ctx) return stepMs;

  const now = ctx.currentTime;
  const dur = (stepMs / 1000) * 1.45;
  const rootMidi = (miracleSubMode === 'ascension') ? 62 : 60;
  const leadFreq = toFreq(rootMidi + MIRACLE_STAGE_MELODY[idx]);
  const ch1Freq  = toFreq(rootMidi + MIRACLE_STAGE_CHORD1[idx]);
  const bassFreq = toFreq(rootMidi + MIRACLE_STAGE_BASS[idx]);

  const playTone = (freq, startT, duration, vol, wave = 'sine') => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, startT);
    gain.gain.setValueAtTime(0.001, startT);
    gain.gain.linearRampToValueAtTime(vol, startT + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0008, startT + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startT);
    osc.stop(startT + duration + 0.02);
  };

  if (rhythmMult >= 1.25) {
    playTone(bassFreq, now, dur * 1.25, 0.038, 'triangle');
    playTone(leadFreq, now + 0.02, dur, 0.045, 'sine');
    playTone(ch1Freq,  now + 0.06, dur * 0.85, 0.025, 'triangle');
  } else {
    playTone(leadFreq, now, dur, 0.038, 'sine');
  }
  return stepMs;
}

// -------------------------------------------------------------------------
// 4. 소프트 로우 폴리곤 재질 캐시 및 확장 지형 고도 계산기 (골고다 언덕 확장 포함)
// -------------------------------------------------------------------------
const miracleLowPolyMatCache = {};
function matLowPoly(hexColor, isEmissive = false, opacity = 1.0) {
  const key = `${hexColor}_${isEmissive ? 1 : 0}_${opacity}`;
  if (!miracleLowPolyMatCache[key]) {
    const params = {
      color: hexColor,
      flatShading: true
    };
    if (isEmissive) {
      params.emissive = hexColor;
      params.emissiveIntensity = 0.25;
    }
    if (opacity < 1.0) {
      params.transparent = true;
      params.opacity = opacity;
    }
    const m = new THREE.MeshLambertMaterial(params);
    m.userData = { _cached: true };
    miracleLowPolyMatCache[key] = m;
  }
  return miracleLowPolyMatCache[key];
}

// 서쪽 해안선 X 좌표 계산기 (갈릴리 선착장 -92 유지 → 비유2·골고다 언덕을 부드럽게 감싸고 두 언덕 사이는 돌출 없이 완만한 만 곡선 유지!)
window.getMiracleWestShoreLineX = function (z) {
  const smooth01 = (a, b, v) => {
    const t = Math.max(0, Math.min(1, (v - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  const gentleWave  = Math.sin((z + 68) * 0.020) * 2.2;
  const expandSouth = smooth01(-48, 8, z) * 16.5 + smooth01(48, 86, z) * 9.5;
  // 비유2 언덕(z=12)과 십자가 언덕(z=78) 사이(z≈43) 해변 돌출을 완만하게 만(Bay) 곡선으로 조정
  const midBayRecess = Math.exp(-Math.pow((z - 43) / 18.0, 2)) * 5.5;
  return -92.0 + gentleWave - expandSouth + midBayRecess;
};

function getMiracleOpenWorldGroundHeight(x, z) {
  const smooth01 = (a, b, v) => {
    const t = Math.max(0, Math.min(1, (v - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };

  const shoreLineX = window.getMiracleWestShoreLineX(z);
  let h = 0.25;

  // 1) 서쪽 해안선 단차·경사(Image 1 레퍼런스 스타일):
  //    내륙 풀밭(0.25) → 해안 둑 약간의 단차(d ∈ [4.2, 6.4], 0.25 → -0.10) → 완만하게 경사진 모래 물가(d ∈ [-0.8, 4.2], -0.10 → -0.50) → 얕은 해저
  const dShore = x - shoreLineX;
  if (dShore < 6.4) {
    if (dShore >= 4.2) {
      // 약간의 해안 둑 단차 (35cm 부드러운 로우폴리 경사 턱)
      const bankT = smooth01(4.2, 6.4, dShore);
      h = -0.10 + bankT * 0.35;
    } else if (dShore >= -0.8) {
      // 물가로 완만하게 기울어져 내려가는 모래 해변 경사면
      const beachT = smooth01(-0.8, 4.2, dShore);
      h = -0.50 + beachT * 0.40;
    } else {
      // 얕은 바닷속 해저 경사 (돌과 물고기가 비쳐 보이는 완만한 수심)
      h = -0.50 + (dShore + 0.8) * 0.085;
    }
  }
  const inlandHillBlend = smooth01(shoreLineX + 5.5, shoreLineX + 19.5, x);

  // 2) 동북쪽 외곽 '오병이어 전망 언덕' (x = 88, z = -82, 정상 높이 +14.5)
  const bethDist = Math.hypot((x - 88) / 46, (z - (-82)) / 42);
  if (bethDist < 1.0) {
    const t = 1.0 - bethDist;
    const bump = Math.sin(x * 0.14) * Math.cos(z * 0.14) * 0.45;
    h += (t * t * (3 - 2 * t) * 14.2 + t * bump) * inlandHillBlend;
  }

  // 3) [확장] 잃어버린 양(비유 미니게임 2)의 유대 광야 바위 언덕 (x = -68, z = 12, 십자가 언덕 사이 해변이 튀어나오지 않도록 깔끔하게 분리)
  const wildDist = Math.hypot((x - (-68)) / 30, (z - 12) / 26);
  if (wildDist < 1.0) {
    const clampedW = Math.max(0, (wildDist - 0.30) / 0.70);
    const t = 1.0 - Math.min(1.0, clampedW);
    const bump = Math.sin(x * 0.14 + 1.1) * Math.cos(z * 0.14) * 0.20;
    h += (t * t * (3 - 2 * t) * 5.6 + t * bump) * inlandHillBlend;
  }

  // 4) [확장] 넓고 웅장한 골고다 십자가 언덕 (x = -62, z = 78, 세 십자가 모두 안착하는 넓은 정상 고원)
  const golgothaDist = Math.hypot((x - (-62)) / 42, (z - 78) / 36);
  if (golgothaDist < 1.0) {
    const clampedD = Math.max(0, (golgothaDist - 0.34) / 0.66);
    const t = 1.0 - Math.min(1.0, clampedD);
    const bump = Math.sin(x * 0.12) * Math.cos(z * 0.12) * 0.20;
    h += (t * t * (3 - 2 * t) * 9.2 + t * bump) * inlandHillBlend;
  }

  // 5) 감람산 승천 언덕 (남동쪽 외곽: x = 88, z = 74)
  const oliveDist = Math.hypot((x - 88) / 34, (z - 74) / 32);
  if (oliveDist < 1.0) {
    const t = 1.0 - oliveDist;
    const bump = Math.sin(x * 0.16) * Math.cos(z * 0.16) * 0.40;
    h += (t * t * (3 - 2 * t) * 9.6 + t * bump) * inlandHillBlend;
  }

  // 6) 북·동·남 3면 가장자리 낮은 구릉 융기
  const eastEdge = Math.max(0, (x - 108) / 28);
  const northEdge = Math.max(0, (-108 - z) / 28);
  const southEdge = Math.max(0, (z - 108) / 28);
  const edgeFactor = Math.max(eastEdge, northEdge, southEdge);
  if (edgeFactor > 0) {
    const edgeBump = Math.sin(x * 0.10) * Math.cos(z * 0.10) * 0.75;
    h += (edgeFactor * edgeFactor * 4.5 + edgeFactor * edgeBump) * inlandHillBlend;
  }

  // 7) 마을 도로 주변 평탄화 및 초원 잔물결
  const centerRoadClearance = Math.min(1.0, Math.abs(x - Math.sin(z * 0.03) * 6.0) / 15.0);
  const gentleWave = (Math.sin(x * 0.045) * Math.cos(z * 0.045) * 0.40) * centerRoadClearance * inlandHillBlend;
  h += gentleWave;

  return Number(h.toFixed(3));
}

function getMiracleGroundHeight(x, z, st) {
  if (miracleSubMode === 'openworld' || miracleSubMode === 'ascension') {
    return getMiracleOpenWorldGroundHeight(x, z);
  }
  if (miracleSubMode === 'main2_loaves') {
    const hillT = Math.max(0, Math.min(1, (32 - z) / 62));
    const bump = Math.sin(x * 0.14) * Math.cos(z * 0.14) * 0.38;
    return Number((0.4 + hillT * hillT * (3 - 2 * hillT) * 13.2 + hillT * bump).toFixed(3));
  }
  if (miracleSubMode === 'main3_cross') {
    if (z <= -8) {
      const climbT = Math.max(0, Math.min(1, (-8 - z) / 46));
      const bump = Math.sin(x * 0.16) * Math.cos(z * 0.16) * 0.28;
      return Number((climbT * (9.4 + bump)).toFixed(3));
    }
    return 0;
  }
  if (miracleSubMode === 'minigame' && miracleActiveMinigameId === 'par_sheep') {
    return Math.sin(x * 0.09) * Math.cos(z * 0.09) * 1.6 + Math.max(0, (18 - z) * 0.12);
  }
  return 0;
}

// -------------------------------------------------------------------------
// 5. 소프트 로우 폴리곤 자연물 팩토리 (구름 · 바위 · 나무 · 갈릴리 배)
// -------------------------------------------------------------------------
function createLowPolyMesh(geo, hexColor, x = 0, y = 0, z = 0, castShadow = true) {
  const m = new THREE.Mesh(geo, matLowPoly(hexColor));
  m.position.set(x, y, z);
  if (castShadow) {
    m.castShadow = true;
    m.receiveShadow = true;
  }
  return m;
}

function createLowPolyCloudGroup(scale = 1.0, isDarkStorm = false) {
  const grp = new THREE.Group();
  const mainHex = isDarkStorm ? '#475569' : '#ffffff';
  const subHex  = isDarkStorm ? '#334155' : '#f1f5f9';
  const warmHex = isDarkStorm ? '#1e293b' : '#fef3c7';

  const puffSpecs = [
    { x:  0.0, y: 0.45, z:  0.0, r: 2.35, sx: 1.35, sy: 0.92, sz: 1.05, col: mainHex, rx: 0.2, ry: 0.4 },
    { x: -2.4, y: 0.10, z:  0.2, r: 1.85, sx: 1.25, sy: 0.85, sz: 0.95, col: subHex,  rx: 0.5, ry: 1.1 },
    { x:  2.5, y: 0.15, z: -0.2, r: 1.95, sx: 1.25, sy: 0.88, sz: 1.00, col: mainHex, rx: 0.3, ry: 2.0 },
    { x: -1.1, y: 1.05, z: -0.3, r: 1.65, sx: 1.15, sy: 0.95, sz: 0.95, col: mainHex, rx: 0.7, ry: 0.8 },
    { x:  1.2, y: 0.95, z:  0.3, r: 1.55, sx: 1.10, sy: 0.90, sz: 0.92, col: warmHex, rx: 0.4, ry: 1.5 },
    { x: -4.2, y: -0.15, z: 0.1, r: 1.15, sx: 1.20, sy: 0.78, sz: 0.88, col: subHex,  rx: 0.1, ry: 0.6 },
    { x:  4.3, y: -0.10, z:-0.1, r: 1.20, sx: 1.18, sy: 0.80, sz: 0.90, col: subHex,  rx: 0.6, ry: 1.2 }
  ];

  puffSpecs.forEach(p => {
    const geo = new THREE.IcosahedronGeometry(p.r * scale, 0);
    const mesh = createLowPolyMesh(geo, p.col, p.x * scale, p.y * scale, p.z * scale, false);
    mesh.scale.set(p.sx, p.sy, p.sz);
    mesh.rotation.set(p.rx, p.ry, 0);
    grp.add(mesh);
  });

  return grp;
}

function addLowPolyRock(x, z, radius = 1.6, heightScale = 0.75, colorHex = '#94a3b8', registerPlatform = true) {
  const by = getBaseGroundHeight(x, z);
  const grp = new THREE.Group();

  const mainGeo = new THREE.DodecahedronGeometry(radius, 0);
  const mainMesh = createLowPolyMesh(mainGeo, colorHex, 0, radius * heightScale * 0.55, 0, true);
  mainMesh.scale.set(1.15, heightScale, 0.98);
  mainMesh.rotation.set(0.15, (x + z) * 0.7, -0.1);

  const subCol = colorHex === '#94a3b8' ? '#cbd5e1' : '#a8a29e';
  const subGeo = new THREE.DodecahedronGeometry(radius * 0.62, 0);
  const subMesh = createLowPolyMesh(subGeo, subCol, radius * 0.68, radius * heightScale * 0.34, radius * 0.32, true);
  subMesh.scale.set(1.1, heightScale * 0.85, 0.95);
  subMesh.rotation.y = (x - z) * 0.5;

  const tuft1 = createLowPolyMesh(new THREE.ConeGeometry(0.18, 0.48, 4), '#4d7c0f', -radius * 0.72, 0.22, radius * 0.45, false);
  tuft1.rotation.z = 0.25;
  const tuft2 = createLowPolyMesh(new THREE.ConeGeometry(0.15, 0.38, 4), '#65a30d', -radius * 0.58, 0.18, radius * 0.55, false);
  tuft2.rotation.z = -0.22;

  grp.add(mainMesh, subMesh, tuft1, tuft2);
  grp.position.set(x, by, z);
  worldGroup.add(grp);
  wallMeshes.push(mainMesh, subMesh);

  if (registerPlatform) {
    const topY = by + radius * heightScale * 1.02;
    platforms.push({
      minX: x - radius * 0.85,
      maxX: x + radius * 0.95,
      minZ: z - radius * 0.85,
      maxZ: z + radius * 0.85,
      topY
    });
  }
  return grp;
}

function recordMiracleWorldTree(x, z, type, scale) {
  if (miracleSubMode !== 'openworld') return;
  if (!Array.isArray(window.miracleWorldTreePositions)) window.miracleWorldTreePositions = [];
  window.miracleWorldTreePositions.push({ x, z, type, scale });
}

function addLowPolyOliveTree(x, z, scale = 1.0, addCol = true) {
  recordMiracleWorldTree(x, z, 'olive', scale);
  const by = getBaseGroundHeight(x, z);
  const grp = new THREE.Group();
  const trunkH = 2.4 * scale;

  const trunk = createLowPolyMesh(new THREE.CylinderGeometry(0.20 * scale, 0.38 * scale, trunkH, 6), '#6b4226', 0, trunkH * 0.5, 0, true);
  const branchL = createLowPolyMesh(new THREE.CylinderGeometry(0.10 * scale, 0.16 * scale, 1.1 * scale, 5), '#6b4226', -0.42 * scale, trunkH * 0.78, 0.12 * scale, true);
  branchL.rotation.z = 0.65;
  const branchR = createLowPolyMesh(new THREE.CylinderGeometry(0.10 * scale, 0.16 * scale, 1.0 * scale, 5), '#6b4226',  0.42 * scale, trunkH * 0.74, -0.12 * scale, true);
  branchR.rotation.z = -0.62;

  const c1 = createLowPolyMesh(new THREE.IcosahedronGeometry(1.48 * scale, 0), '#557a2b', 0, trunkH + 0.72 * scale, 0, true);
  c1.scale.set(1.22, 0.82, 1.18);
  c1.rotation.y = (x + z) * 0.4;
  const c2 = createLowPolyMesh(new THREE.IcosahedronGeometry(1.08 * scale, 0), '#6b9336', -0.85 * scale, trunkH + 0.35 * scale, 0.42 * scale, true);
  c2.scale.set(1.15, 0.80, 1.10);
  const c3 = createLowPolyMesh(new THREE.IcosahedronGeometry(1.05 * scale, 0), '#7ca440',  0.85 * scale, trunkH + 0.42 * scale, -0.35 * scale, true);
  c3.scale.set(1.12, 0.82, 1.12);

  grp.add(trunk, branchL, branchR, c1, c2, c3);
  grp.position.set(x, by, z);
  worldGroup.add(grp);
  wallMeshes.push(trunk, c1, c2, c3);

  if (addCol) {
    colliders.push({ minX: x - 0.55 * scale, maxX: x + 0.55 * scale, minZ: z - 0.55 * scale, maxZ: z + 0.55 * scale });
  }
  return grp;
}

function addLowPolyCypressPineTree(x, z, scale = 1.0, addCol = true) {
  recordMiracleWorldTree(x, z, 'cypress', scale);
  const by = getBaseGroundHeight(x, z);
  const grp = new THREE.Group();
  const trunkH = 2.6 * scale;

  const trunk = createLowPolyMesh(new THREE.CylinderGeometry(0.16 * scale, 0.34 * scale, trunkH, 6), '#7c4728', 0, trunkH * 0.5, 0, true);
  const cone1 = createLowPolyMesh(new THREE.ConeGeometry(1.35 * scale, 2.5 * scale, 6), '#365314', 0, trunkH + 0.35 * scale, 0, true);
  const cone2 = createLowPolyMesh(new THREE.ConeGeometry(1.05 * scale, 2.2 * scale, 6), '#3f6212', 0, trunkH + 1.55 * scale, 0, true);
  cone2.rotation.y = 0.5;
  const cone3 = createLowPolyMesh(new THREE.ConeGeometry(0.72 * scale, 1.7 * scale, 6), '#4d7c0f', 0, trunkH + 2.60 * scale, 0, true);

  grp.add(trunk, cone1, cone2, cone3);
  grp.position.set(x, by, z);
  worldGroup.add(grp);
  wallMeshes.push(trunk, cone1, cone2, cone3);

  if (addCol) {
    colliders.push({ minX: x - 0.5 * scale, maxX: x + 0.5 * scale, minZ: z - 0.5 * scale, maxZ: z + 0.5 * scale });
  }
  return grp;
}

function addLowPolyPalmTree(x, z, scale = 1.0, addCol = true) {
  recordMiracleWorldTree(x, z, 'palm', scale);
  const by = getBaseGroundHeight(x, z);
  const grp = new THREE.Group();
  const trunkH = 3.5 * scale;
  const trunkGeo = new THREE.CylinderGeometry(0.18 * scale, 0.34 * scale, trunkH, 6);
  const trunk = createLowPolyMesh(trunkGeo, '#854d0e', 0, trunkH * 0.5, 0, true);
  trunk.rotation.z = 0.05;

  const coco1 = createLowPolyMesh(new THREE.DodecahedronGeometry(0.22 * scale, 0), '#451a03', 0.15 * scale, trunkH - 0.15 * scale, 0.15 * scale, false);
  const coco2 = createLowPolyMesh(new THREE.DodecahedronGeometry(0.20 * scale, 0), '#5c2d0c', -0.15 * scale, trunkH - 0.18 * scale, -0.12 * scale, false);
  grp.add(trunk, coco1, coco2);

  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2;
    const leafGeo = new THREE.ConeGeometry(0.48 * scale, 2.35 * scale, 4);
    const leaf = createLowPolyMesh(
      leafGeo,
      i % 2 === 0 ? '#4d7c0f' : '#65a30d',
      Math.cos(ang) * 0.98 * scale,
      trunkH - 0.05 * scale,
      Math.sin(ang) * 0.98 * scale,
      true
    );
    leaf.rotation.z = -Math.cos(ang) * 1.18;
    leaf.rotation.x = Math.sin(ang) * 1.18;
    grp.add(leaf);
    wallMeshes.push(leaf);
  }

  grp.position.set(x, by, z);
  worldGroup.add(grp);
  wallMeshes.push(trunk);
  if (addCol) {
    colliders.push({ minX: x - 0.5 * scale, maxX: x + 0.5 * scale, minZ: z - 0.5 * scale, maxZ: z + 0.5 * scale });
  }
  return grp;
}

function addLowPolyCactusAndScrub(x, z, scale = 1.0) {
  const by = getBaseGroundHeight(x, z);
  const grp = new THREE.Group();
  const cCol = '#4d7c0f';

  const stem = createLowPolyMesh(new THREE.CylinderGeometry(0.22 * scale, 0.26 * scale, 1.9 * scale, 6), cCol, 0, 0.95 * scale, 0, true);
  const armL = createLowPolyMesh(new THREE.CylinderGeometry(0.15 * scale, 0.17 * scale, 0.75 * scale, 6), cCol, -0.38 * scale, 1.15 * scale, 0, true);
  const armR = createLowPolyMesh(new THREE.CylinderGeometry(0.15 * scale, 0.17 * scale, 0.65 * scale, 6), cCol,  0.38 * scale, 0.95 * scale, 0, true);
  const jointL = createLowPolyMesh(new THREE.CylinderGeometry(0.14 * scale, 0.14 * scale, 0.42 * scale, 5), cCol, -0.22 * scale, 0.85 * scale, 0, true);
  jointL.rotation.z = Math.PI / 2;
  const jointR = createLowPolyMesh(new THREE.CylinderGeometry(0.14 * scale, 0.14 * scale, 0.42 * scale, 5), cCol,  0.22 * scale, 0.70 * scale, 0, true);
  jointR.rotation.z = Math.PI / 2;

  const flower = createLowPolyMesh(new THREE.DodecahedronGeometry(0.14 * scale, 0), '#f43f5e', 0, 1.96 * scale, 0, false);
  const rockSub = createLowPolyMesh(new THREE.DodecahedronGeometry(0.45 * scale, 0), '#d97706', 0.55 * scale, 0.22 * scale, 0.35 * scale, true);

  grp.add(stem, armL, armR, jointL, jointR, flower, rockSub);
  grp.position.set(x, by, z);
  worldGroup.add(grp);
  colliders.push({ minX: x - 0.45 * scale, maxX: x + 0.45 * scale, minZ: z - 0.45 * scale, maxZ: z + 0.45 * scale });
  return grp;
}

function createLowPolySycamoreTree(x, z, scale = 1.45) {
  recordMiracleWorldTree(x, z, 'sycamore', scale);
  const by = getBaseGroundHeight(x, z);
  const grp = new THREE.Group();
  const trunkH = 3.6 * scale;
  const trunk = createLowPolyMesh(new THREE.CylinderGeometry(0.42 * scale, 0.68 * scale, trunkH, 7), '#5c2d0c', 0, trunkH * 0.5, 0, true);

  const branch = createLowPolyMesh(new THREE.CylinderGeometry(0.18 * scale, 0.24 * scale, 2.6 * scale, 6), '#5c2d0c', 1.1 * scale, trunkH * 0.72, 0.4 * scale, true);
  branch.rotation.z = -1.25;

  const mainCrown = createLowPolyMesh(new THREE.IcosahedronGeometry(2.3 * scale, 0), '#3f6212', 0, trunkH + 0.8 * scale, 0, true);
  mainCrown.scale.set(1.25, 0.72, 1.25);
  const subCrown1 = createLowPolyMesh(new THREE.IcosahedronGeometry(1.5 * scale, 0), '#4d7c0f', 1.6 * scale, trunkH + 0.35 * scale, 0.5 * scale, true);
  const subCrown2 = createLowPolyMesh(new THREE.IcosahedronGeometry(1.4 * scale, 0), '#65a30d', -1.4 * scale, trunkH + 0.45 * scale, -0.4 * scale, true);

  grp.add(trunk, branch, mainCrown, subCrown1, subCrown2);
  grp.position.set(x, by, z);
  worldGroup.add(grp);
  wallMeshes.push(trunk, mainCrown, subCrown1, subCrown2);
  colliders.push({ minX: x - 0.95 * scale, maxX: x + 0.95 * scale, minZ: z - 0.95 * scale, maxZ: z + 0.95 * scale });
  return grp;
}

// [디테일 강화] 소프트 로우 폴리곤 갈릴리 고대 목조 어선 (타기 전 정박 어선 & 공용)
function createLowPolyGalileeBoat(scale = 1.0) {
  const boatGrp = new THREE.Group();
  const s = scale;
  const cHullDark = '#6b3410';
  const cHullMid  = '#8c4819';
  const cPlank    = '#b46224';
  const cTrim     = '#4a2107';
  const cSail     = '#fef6e0';
  const cSailEdge = '#e8d5b0';
  const cRope     = '#d6b782';
  const cNet      = '#cbd5e1';

  // 1) 다단 곡선 선체(Curved Multi-Section Hull): 뱃머리·선미가 우아하게 좁아지며 솟아오르는 고대 갈릴리 어선
  const zStations = [-3.9, -2.8, -1.4, 0.0, 1.4, 2.8, 3.9];
  const halfW     = [0.18, 1.35, 2.02, 2.15, 2.02, 1.38, 0.28];
  const keelY     = [0.65, 0.12, 0.02, 0.00, 0.02, 0.14, 0.72];
  const gunwaleY  = [1.72, 1.38, 1.24, 1.20, 1.24, 1.42, 1.82];

  const hullVerts = [];
  const pushTri = (a, b, c) => hullVerts.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
  const pushQ = (a, b, c, d) => { pushTri(a, b, c); pushTri(a, c, d); };

  const rings = zStations.map((z, i) => {
    const w = halfW[i] * s;
    const ky = keelY[i] * s;
    const gy = gunwaleY[i] * s;
    const my = (ky + gy) * 0.48;
    const mw = w * 0.88;
    const zs = z * s;
    return [
      [-w, gy, zs],       // 0: 좌측 뱃전(외)
      [-mw, my, zs],      // 1: 좌측 선측 중부
      [0, ky, zs],        // 2: 용골(바닥)
      [mw, my, zs],       // 3: 우측 선측 중부
      [w, gy, zs],        // 4: 우측 뱃전(외)
      [w * 0.86, gy, zs], // 5: 우측 뱃전(내)
      [0, ky + 0.30 * s, zs], // 6: 선창 바닥
      [-w * 0.86, gy, zs] // 7: 좌측 뱃전(내)
    ];
  });

  for (let i = 0; i < rings.length - 1; i++) {
    const r0 = rings[i], r1 = rings[i + 1];
    // 외벽(0->1->2->3->4)
    for (let k = 0; k < 4; k++) pushQ(r0[k], r0[k + 1], r1[k + 1], r1[k]);
    // 뱃전 상단 테두리 (좌: 7->0, 우: 4->5)
    pushQ(r0[7], r0[0], r1[0], r1[7]);
    pushQ(r0[4], r0[5], r1[5], r1[4]);
    // 내벽(5->6->7)
    pushQ(r0[5], r0[6], r1[6], r1[5]);
    pushQ(r0[6], r0[7], r1[7], r1[6]);
  }
  const hullGeo = new THREE.BufferGeometry();
  hullGeo.setAttribute('position', new THREE.Float32BufferAttribute(hullVerts, 3));
  hullGeo.computeVertexNormals();
  const hull = createLowPolyMesh(hullGeo, cHullDark, 0, 0, 0, true);
  boatGrp.add(hull);

  // 2) 갑판 널빤지 & 선측 늑골(Ribs) & 이물/고물 장식 기둥
  for (let p = -3; p <= 3; p++) {
    const pz = p * 0.85 * s;
    const pw = (2.8 - Math.abs(p) * 0.42) * s;
    const plank = createLowPolyMesh(
      new THREE.BoxGeometry(pw, 0.10 * s, 0.72 * s),
      p % 2 === 0 ? cPlank : cHullMid,
      0, 0.52 * s, pz, true
    );
    boatGrp.add(plank);
  }
  // 3개의 노 젓는 가로 의자(Thwarts) + 고물 베개/방석
  [-1.6, 0.0, 1.6].forEach(bz => {
    const bw = (bz === 0 ? 3.55 : 2.95) * s;
    const bench = createLowPolyMesh(new THREE.BoxGeometry(bw, 0.14 * s, 0.44 * s), cPlank, 0, 1.04 * s, bz * s, true);
    boatGrp.add(bench);
  });
  // 고물(뒤편) 나무 갑판 및 붉은 베개(예수님 쉬시는 자리)
  const sternDeck = createLowPolyMesh(new THREE.BoxGeometry(2.1 * s, 0.16 * s, 1.35 * s), cPlank, 0, 1.14 * s, 2.75 * s, true);
  const sternPillow = createLowPolyMesh(new THREE.DodecahedronGeometry(0.36 * s, 0), '#dc2626', 0, 1.34 * s, 2.95 * s, false);
  sternPillow.scale.set(1.4, 0.55, 0.9);
  boatGrp.add(sternDeck, sternPillow);

  // 이물(선수) & 고물(선미) 솟아오른 목재 장식 기둥
  const prowPost = createLowPolyMesh(new THREE.CylinderGeometry(0.11 * s, 0.18 * s, 1.25 * s, 6), cTrim, 0, 2.05 * s, -3.95 * s, true);
  prowPost.rotation.x = -0.35;
  const sternPost = createLowPolyMesh(new THREE.CylinderGeometry(0.12 * s, 0.20 * s, 1.35 * s, 6), cTrim, 0, 2.15 * s, 3.95 * s, true);
  sternPost.rotation.x = 0.32;
  // 방향타(Rudder)
  const rudder = createLowPolyMesh(new THREE.BoxGeometry(0.12 * s, 1.65 * s, 0.48 * s), cTrim, 0.65 * s, 0.72 * s, 3.45 * s, true);
  rudder.rotation.x = 0.28;
  boatGrp.add(prowPost, sternPost, rudder);

  // 3) 돛대(Mast) · 사선 활대(Lateen Yard) · 곡면 삼각/사각 부푼 돛(Billowing Sail) · 밧줄(Rigging)
  const mast = createLowPolyMesh(new THREE.CylinderGeometry(0.10 * s, 0.17 * s, 5.9 * s, 6), cTrim, 0, 3.45 * s, -0.35 * s, true);
  const yard = createLowPolyMesh(new THREE.CylinderGeometry(0.065 * s, 0.08 * s, 5.2 * s, 6), cHullDark, 0, 5.05 * s, -0.25 * s, true);
  yard.rotation.z = Math.PI / 2 - 0.22;

  // 바람을 머금고 부드럽게 부푼 소프트 로우폴리 돛
  const sailGeo = new THREE.PlaneGeometry(4.4 * s, 3.3 * s, 4, 3);
  const sp = sailGeo.attributes.position;
  for (let i = 0; i < sp.count; i++) {
    const sx = sp.getX(i), sy = sp.getY(i);
    const nx = sx / (2.2 * s), ny = sy / (1.65 * s);
    const billow = (1 - nx * nx * 0.75) * (1 - ny * ny * 0.65) * 0.68 * s;
    sp.setZ(i, billow);
  }
  const sailNonIdx = sailGeo.toNonIndexed();
  sailNonIdx.computeVertexNormals();
  const sailMat = (typeof matLowPolyDouble === 'function') ? matLowPolyDouble(cSail) : matLowPoly(cSail);
  const sail = new THREE.Mesh(sailNonIdx, sailMat);
  sail.position.set(0, 3.65 * s, -0.15 * s);
  sail.castShadow = true;
  sail.receiveShadow = true;
  // 돛 하단 장식 띠
  const sailStripe = createLowPolyMesh(new THREE.BoxGeometry(4.2 * s, 0.22 * s, 0.14 * s), cSailEdge, 0, 2.15 * s, 0.12 * s, false);
  boatGrp.add(mast, yard, sail, sailStripe);

  // 돛대 밧줄(앞·뒤·양옆)
  const addBoatRope = (p1, p2) => {
    const dir = new THREE.Vector3().subVectors(p2, p1);
    const len = dir.length();
    const rg = new THREE.CylinderGeometry(0.03 * s, 0.03 * s, len, 4);
    rg.translate(0, len * 0.5, 0);
    const rm = createLowPolyMesh(rg, cRope, p1.x, p1.y, p1.z, false);
    rm.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    boatGrp.add(rm);
  };
  const mastTop = new THREE.Vector3(0, 6.1 * s, -0.35 * s);
  addBoatRope(mastTop, new THREE.Vector3(0, 1.75 * s, -3.7 * s));
  addBoatRope(mastTop, new THREE.Vector3(0, 1.85 * s,  3.6 * s));
  addBoatRope(mastTop, new THREE.Vector3(-1.85 * s, 1.25 * s, -0.4 * s));
  addBoatRope(mastTop, new THREE.Vector3( 1.85 * s, 1.25 * s, -0.4 * s));

  // 4) 어선 소품: 좌·우 나무 노(Oars), 말아둔 그물 뭉치, 물고기 광주리, 고물 등불(Lantern)
  [-1, 1].forEach(side => {
    const oarShaft = createLowPolyMesh(new THREE.CylinderGeometry(0.045 * s, 0.055 * s, 2.8 * s, 5), cHullMid, side * 1.92 * s, 1.18 * s, 0.45 * s, false);
    oarShaft.rotation.x = Math.PI / 2 - 0.12;
    oarShaft.rotation.z = side * 0.22;
    boatGrp.add(oarShaft);
  });
  const rolledNet = createLowPolyMesh(new THREE.DodecahedronGeometry(0.45 * s, 0), cNet, -1.05 * s, 0.85 * s, -1.95 * s, true);
  rolledNet.scale.set(1.4, 0.72, 1.2);
  const fishBasket = createLowPolyMesh(new THREE.CylinderGeometry(0.42 * s, 0.32 * s, 0.46 * s, 7), '#d97706', 0.95 * s, 0.82 * s, 0.85 * s, true);
  const lanternGlow = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.20 * s, 0),
    new THREE.MeshBasicMaterial({ color: 0xfef08a })
  );
  lanternGlow.position.set(0, 2.65 * s, 3.65 * s);
  boatGrp.add(rolledNet, fishBasket, lanternGlow);

  boatGrp.userData = { hull, deck: sternDeck, sail };
  return boatGrp;
}
// =========================================================================
// [ep4_miracle_base.js - 파트 2/2]
// 6. 비정형(Organic Low-Poly) 고대 유대 건축물 팩토리
//    - 2층 벽면 돌출 벽돌 위치 오프셋 보정 (공중 부양 해결)
//    - 회전된 모든 건물의 외벽 계단 물리 발판 생성 & 옆 건물 2층/옥상 점프 이동 지원
// 7. 나의 복음서 수첩 UI 및 대화창 (미션 거절 버튼 & 완료 미션 [🔄 미션 다시하기] 버튼 포함)
// =========================================================================

function _organicHash(n) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

// 직육면체가 아닌 비정형(Organic) 다면체 박스 지오메트리 생성기
function createOrganicBoxGeo(w, h, d, seed = 1, irregularity = 0.055, topTaper = 0.96, segs = 2) {
  const geo = new THREE.BoxGeometry(w, h, d, segs, segs, segs);
  const pos = geo.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    let vx = pos.getX(i);
    let vy = pos.getY(i);
    let vz = pos.getZ(i);

    const nx = vx / (w * 0.5);
    const ny = vy / (h * 0.5);
    const nz = vz / (d * 0.5);

    const heightRatio = (ny + 1.0) * 0.5;
    const taper = 1.0 - heightRatio * (1.0 - topTaper);
    vx *= taper;
    vz *= taper;

    const key = Math.round((nx + 2) * 17) * 100 + Math.round((ny + 2) * 17) * 10 + Math.round((nz + 2) * 17);
    const jx = (_organicHash(seed * 13.7 + key) - 0.5) * irregularity * w;
    const jy = (_organicHash(seed * 29.3 + key) - 0.5) * irregularity * h;
    const jz = (_organicHash(seed * 47.1 + key) - 0.5) * irregularity * d;

    vx += jx;
    if (ny > -0.92) {
      vy += jy * 0.75;
    }
    vz += jz;

    pos.setXYZ(i, vx, vy, vz);
  }

  const finalGeo = geo.toNonIndexed();
  finalGeo.computeVertexNormals();
  return finalGeo;
}

// 벽면에 튀어나온 비정형 돌출 벽돌 (그림자 생성 활성화)
function createIrregularWallBrickMesh(bw, bh, bd, colorHex, seed = 1) {
  const geo = new THREE.BoxGeometry(bw, bh, bd, 1, 1, 1);
  const pos = geo.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);

    const cKey = (x > 0 ? 1 : 0) * 4 + (y > 0 ? 1 : 0) * 2 + (z > 0 ? 1 : 0);
    const sx = 0.78 + _organicHash(seed * 11.3 + cKey) * 0.38;
    const sy = 0.74 + _organicHash(seed * 23.7 + cKey) * 0.42;
    x *= sx;
    y *= sy;

    if (z > 0) {
      x *= 0.88;
      y *= 0.86;
    }
    pos.setXYZ(i, x, y, z);
  }

  const finalGeo = geo.toNonIndexed();
  finalGeo.computeVertexNormals();

  const mesh = createLowPolyMesh(finalGeo, colorHex, 0, 0, 0, true);
  mesh.rotation.z = (_organicHash(seed * 37.9) - 0.5) * 0.14;
  return mesh;
}

// [버그 수정 완료] offsetX, offsetZ 파라미터를 추가하여 2층 방 벽면에도 정확히 밀착되도록 수정!
function addScatteredIrregularBricksToWall(
  parentGrp,
  wallW,
  wallH,
  wallD,
  baseY,
  brickHex1,
  brickHex2,
  seedBase,
  offsetX = 0,
  offsetZ = 0
) {
  // 상단 테이퍼링(위로 갈수록 좁아지는 벽면 기울기)에 맞춰 벽돌 부착 깊이 자동 보정
  const fbPositions = [
    [-wallW * 0.32, wallH * 0.70, 1],
    [-wallW * 0.22, wallH * 0.58, 1],
    [ wallW * 0.26, wallH * 0.72, 1],
    [ wallW * 0.32, wallH * 0.32, 1],
    [-wallW * 0.30, wallH * 0.26, 1],
    [-wallW * 0.24, wallH * 0.70, -1],
    [ wallW * 0.18, wallH * 0.60, -1],
    [ wallW * 0.28, wallH * 0.28, -1],
    [-wallW * 0.14, wallH * 0.34, -1]
  ];

  fbPositions.forEach(([bx, by, zSide], idx) => {
    // 정면 출입문 영역과 겹치는 벽돌 제외 (밝은 벽돌이 문에 겹쳐 보이는 현상 방지)
    if (zSide === 1 && baseY < 0.5 && Math.abs(bx - (-wallW * 0.12)) < 1.35 && by < 2.85) return;
    const s = seedBase + idx * 7.3;
    const bw = 0.46 + _organicHash(s) * 0.32;
    const bh = 0.20 + _organicHash(s + 1) * 0.13;
    const bd = 0.15 + _organicHash(s + 2) * 0.06;
    const col = (idx % 2 === 0) ? brickHex1 : brickHex2;
    const brick = createIrregularWallBrickMesh(bw, bh, bd, col, s);

    const taperAtY = 1.0 - (by / wallH) * 0.04;
    const surfaceZ = (wallD * 0.5) * taperAtY;
    brick.position.set(offsetX + bx * taperAtY, baseY + by, offsetZ + zSide * (surfaceZ + bd * 0.22));
    if (zSide < 0) brick.rotation.y = Math.PI;
    parentGrp.add(brick);
  });

  const lrPositions = [
    [-1, wallH * 0.68, -wallD * 0.24],
    [-1, wallH * 0.30,  wallD * 0.20],
    [-1, wallH * 0.52,  wallD * 0.04],
    [ 1, wallH * 0.66,  wallD * 0.22],
    [ 1, wallH * 0.56, -wallD * 0.16],
    [ 1, wallH * 0.26, -wallD * 0.22]
  ];

  lrPositions.forEach(([xSide, by, bz], idx) => {
    const s = seedBase + 100 + idx * 9.1;
    const bw = 0.44 + _organicHash(s) * 0.30;
    const bh = 0.20 + _organicHash(s + 1) * 0.13;
    const bd = 0.15 + _organicHash(s + 2) * 0.06;
    const col = (idx % 2 === 0) ? brickHex2 : brickHex1;
    const brick = createIrregularWallBrickMesh(bw, bh, bd, col, s);

    const taperAtY = 1.0 - (by / wallH) * 0.04;
    const surfaceX = (wallW * 0.5) * taperAtY;
    brick.rotation.y = xSide > 0 ? Math.PI / 2 : -Math.PI / 2;
    brick.position.set(offsetX + xSide * (surfaceX + bd * 0.22), baseY + by, offsetZ + bz * taperAtY);
    parentGrp.add(brick);
  });
}

// 비정형(Organic) 창틀과 창문 조립기 (외벽 비정형 돌출과 겹치지 않도록 전면 여유 확보)
function createOrganicWindowGroup(winW, winH, frameHex, sillHex, voidHex, seed = 1) {
  const winGrp = new THREE.Group();

  const paneVoid = createLowPolyMesh(new THREE.BoxGeometry(winW, winH, 0.20), voidHex, 0, 0, 0.04, false);
  const mullionV = createLowPolyMesh(createOrganicBoxGeo(0.08, winH, 0.22, seed + 1, 0.08, 0.95, 1), frameHex, 0, 0, 0.07, true);
  winGrp.add(paneVoid, mullionV);

  const topLintel = createLowPolyMesh(
    createOrganicBoxGeo(winW + 0.42, 0.22, 0.34, seed + 2, 0.12, 0.92, 2),
    frameHex,
    (_organicHash(seed) - 0.5) * 0.05,
    winH * 0.5 + 0.08,
    0.04,
    true
  );
  topLintel.rotation.z = (_organicHash(seed + 3) - 0.5) * 0.07;

  const botSill = createLowPolyMesh(
    createOrganicBoxGeo(winW + 0.38, 0.18, 0.36, seed + 4, 0.12, 1.04, 2),
    sillHex,
    (_organicHash(seed + 5) - 0.5) * 0.04,
    -winH * 0.5 - 0.07,
    0.05,
    true
  );
  botSill.rotation.z = (_organicHash(seed + 6) - 0.5) * 0.06;

  const leftJamb = createLowPolyMesh(
    createOrganicBoxGeo(0.18, winH + 0.16, 0.30, seed + 7, 0.12, 0.94, 2),
    sillHex,
    -winW * 0.5 - 0.07,
    0,
    0.03,
    true
  );
  leftJamb.rotation.z = 0.03;

  const rightJamb = createLowPolyMesh(
    createOrganicBoxGeo(0.18, winH + 0.16, 0.30, seed + 8, 0.12, 0.94, 2),
    sillHex,
    winW * 0.5 + 0.07,
    0,
    0.03,
    true
  );
  rightJamb.rotation.z = -0.03;

  winGrp.add(topLintel, botSill, leftJamb, rightJamb);
  return winGrp;
}

// 1층 깊은 아치형 입구(Deep Arched Alcove) — 비정형 벽면이 문 위로 튀어나와 밝게 겹치지 않도록 앞쪽 여유·깊은 문틀 보정
function createOrganicArchedEntranceGroup(archW, archH, frameHex, darkHex, doorWoodHex, seed = 1) {
  const archGrp = new THREE.Group();

  const recessVoid = createLowPolyMesh(new THREE.BoxGeometry(archW * 0.84, archH * 0.92, 0.28), darkHex, 0, archH * 0.46, 0.06, false);
  const innerDoor  = createLowPolyMesh(createOrganicBoxGeo(archW * 0.74, archH * 0.84, 0.16, seed, 0.04, 0.99, 2), doorWoodHex, 0, archH * 0.42, 0.15, true);
  archGrp.add(recessVoid, innerDoor);

  [-0.25, 0, 0.25].forEach((ox) => {
    const plankBar = createLowPolyMesh(new THREE.BoxGeometry(0.05, archH * 0.80, 0.18), '#4a2c18', ox * archW, archH * 0.42, 0.17, true);
    archGrp.add(plankBar);
  });

  const pierH = archH * 0.62;
  const pierL = createLowPolyMesh(
    createOrganicBoxGeo(0.36, pierH, 0.58, seed + 10, 0.08, 0.95, 2),
    frameHex,
    -archW * 0.5,
    pierH * 0.5,
    0.04,
    true
  );
  const pierR = createLowPolyMesh(
    createOrganicBoxGeo(0.36, pierH, 0.58, seed + 11, 0.08, 0.95, 2),
    frameHex,
    archW * 0.5,
    pierH * 0.5,
    0.04,
    true
  );
  archGrp.add(pierL, pierR);

  const archSegs = 5;
  const radius = archW * 0.5;
  for (let i = 0; i < archSegs; i++) {
    const t0 = (i / archSegs) * Math.PI;
    const t1 = ((i + 1) / archSegs) * Math.PI;
    const midT = (t0 + t1) * 0.5;
    const ax = -Math.cos(midT) * radius;
    const ay = pierH + Math.sin(midT) * (archH - pierH) * 0.92;
    const stoneLen = (Math.PI * radius) / archSegs + 0.14;

    const archStone = createLowPolyMesh(
      createOrganicBoxGeo(0.36, stoneLen, 0.60, seed + 20 + i, 0.09, 0.94, 1),
      frameHex,
      ax,
      ay,
      0.05,
      true
    );
    archStone.rotation.z = midT - Math.PI * 0.5;
    archGrp.add(archStone);
  }

  return archGrp;
}

// 2층 방 전용 비정형 나무 출입문 & 깊은 돌출 문틀 (벽 겹침 방지)
function createOrganicUpperDoorGroup(doorW, doorH, frameHex, woodHex, seed = 1) {
  const dGrp = new THREE.Group();

  const backVoid  = createLowPolyMesh(new THREE.BoxGeometry(doorW + 0.04, doorH + 0.04, 0.16), '#23170f', 0, doorH * 0.5, 0.04, false);
  const plankDoor = createLowPolyMesh(createOrganicBoxGeo(doorW, doorH, 0.14, seed, 0.04, 0.99, 2), woodHex, 0, doorH * 0.5, 0.12, true);
  const jambL = createLowPolyMesh(createOrganicBoxGeo(0.22, doorH + 0.14, 0.40, seed + 1, 0.09, 0.95, 2), frameHex, -doorW * 0.5 - 0.08, doorH * 0.5, 0.04, true);
  const jambR = createLowPolyMesh(createOrganicBoxGeo(0.22, doorH + 0.14, 0.40, seed + 2, 0.09, 0.95, 2), frameHex,  doorW * 0.5 + 0.08, doorH * 0.5, 0.04, true);
  const lintel = createLowPolyMesh(createOrganicBoxGeo(doorW + 0.54, 0.24, 0.42, seed + 3, 0.10, 0.92, 2), frameHex, 0, doorH + 0.10, 0.05, true);
  lintel.rotation.z = (_organicHash(seed + 4) - 0.5) * 0.06;

  dGrp.add(backVoid, plankDoor, jambL, jambR, lintel);
  return dGrp;
}

// 비정형 서까래 돌출목 (벽면에서 바깥으로 정확히 이어지도록 중심 배치)
function createOrganicRoofBeamMesh(length = 0.68, woodHex = '#6b4226', seed = 1) {
  const geo = new THREE.CylinderGeometry(0.11, 0.13, length, 6, 1, false);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    if (y > 0) {
      x += (_organicHash(seed + i) - 0.5) * 0.04;
      z += (_organicHash(seed + i + 5) - 0.5) * 0.04;
    }
    pos.setXYZ(i, x, y, z);
  }
  const finalGeo = geo.toNonIndexed();
  finalGeo.computeVertexNormals();

  return createLowPolyMesh(finalGeo, woodHex, 0, 0, 0, true);
}

// 2층 테라스 비정형 나무 벤치
function createOrganicTerraceBench(woodHex = '#7c4d2b', seed = 1) {
  const bGrp = new THREE.Group();
  const seat = createLowPolyMesh(createOrganicBoxGeo(1.65, 0.12, 0.52, seed, 0.08, 0.98, 2), woodHex, 0, 0.42, 0, true);
  const legL = createLowPolyMesh(createOrganicBoxGeo(0.16, 0.40, 0.44, seed + 1, 0.08, 0.92, 1), woodHex, -0.62, 0.20, 0, true);
  const legR = createLowPolyMesh(createOrganicBoxGeo(0.16, 0.40, 0.44, seed + 2, 0.08, 0.92, 1), woodHex,  0.62, 0.20, 0, true);
  bGrp.add(seat, legL, legR);
  return bGrp;
}

function createJudeanClayPotMesh(scale = 1.0, colorHex = '#b86232') {
  const potGrp = new THREE.Group();
  const belly = createLowPolyMesh(new THREE.DodecahedronGeometry(0.34 * scale, 0), colorHex, 0, 0.30 * scale, 0, true);
  belly.scale.set(0.96, 1.28, 0.96);
  const neck = createLowPolyMesh(new THREE.CylinderGeometry(0.20 * scale, 0.15 * scale, 0.22 * scale, 6), '#8f471e', 0, 0.60 * scale, 0, true);
  potGrp.add(belly, neck);
  return potGrp;
}

// -------------------------------------------------------------------------
// 건물·성전용 정적 소프트 로우 폴리곤 정점 색상(Vertex Color) 병합기 & 아마포 차양 팩토리
// - 모바일 성능 최적화를 위해 수십~백여 개 정적 장식 메시를 1~2개 드로우콜로 통합!
// -------------------------------------------------------------------------
const MIRACLE_LINEN_SHADES = [
  { main: '#f3ead8', trim: '#e4d6bc' }, // 1. 밝은 표백 아마포
  { main: '#e8dbc2', trim: '#d7c6a6' }, // 2. 따뜻한 생아마포
  { main: '#dccaa9', trim: '#cab58f' }, // 3. 부드러운 오트밀 아마포
  { main: '#cfb991', trim: '#bca378' }, // 4. 구운 밀빛 아마포
  { main: '#c1a77c', trim: '#ae9164' }, // 5. 짙은 원사 아마포
  { main: '#b29568', trim: '#9c7f53' }  // 6. 깊은 황마·아마포
];

const _miracleMergedVColorMats = {};
function getMiracleMergedVColorMat(bucket) {
  if (!_miracleMergedVColorMats[bucket]) {
    let m;
    if (bucket === 'emissive') {
      m = new THREE.MeshLambertMaterial({
        color: 0xffffff,
        emissive: 0x452c08,
        vertexColors: true,
        flatShading: true
      });
    } else if (bucket === 'doubleSide') {
      m = new THREE.MeshLambertMaterial({
        color: 0xffffff,
        vertexColors: true,
        flatShading: true,
        side: THREE.DoubleSide
      });
    } else {
      m = new THREE.MeshLambertMaterial({
        color: 0xffffff,
        vertexColors: true,
        flatShading: true
      });
    }
    m.userData = { _cached: true };
    _miracleMergedVColorMats[bucket] = m;
  }
  return _miracleMergedVColorMats[bucket];
}

function mergeStaticLowPolyGroupToVertexColor(rootGrp, opts = {}) {
  if (!rootGrp) return rootGrp;
  const registerWall = Boolean(opts.registerWall);
  const castShadow = opts.castShadow !== false;

  const buckets = { opaque: [], emissive: [], doubleSide: [] };
  const disposableGeos = new Set();

  const getLocalMat = (obj) => {
    if (typeof obj.updateMatrix === 'function') {
      obj.updateMatrix();
      if (obj.matrix && obj.matrix.elements) return obj.matrix;
    }
    if (typeof obj.getLocalMatrix === 'function') return obj.getLocalMatrix();
    return new THREE.Matrix4();
  };

  const getDet3 = (m) => {
    if (typeof m.determinant === 'function') return m.determinant();
    const e = m.elements;
    return e[0] * (e[5] * e[10] - e[6] * e[9])
         - e[4] * (e[1] * e[10] - e[2] * e[9])
         + e[8] * (e[1] * e[6]  - e[2] * e[5]);
  };

  const walk = (obj, parentMat) => {
    if (!obj || obj.visible === false) return;
    for (let i = 0; i < obj.children.length; i++) {
      const ch = obj.children[i];
      if (!ch || ch.visible === false) continue;
      const relMat = new THREE.Matrix4().multiplyMatrices(parentMat, getLocalMat(ch));
      if (ch.isMesh && ch.geometry) {
        const mat = Array.isArray(ch.material) ? ch.material[0] : ch.material;
        if (mat) {
          let bKey = 'opaque';
          if (ch.userData && ch.userData._emissiveGlow) bKey = 'emissive';
          else if (mat.side === THREE.DoubleSide) bKey = 'doubleSide';
          buckets[bKey].push({ mesh: ch, mat, relMat });
          if (!(ch.geometry.userData && ch.geometry.userData._cached)) {
            disposableGeos.add(ch.geometry);
          }
        }
      }
      if (ch.children && ch.children.length > 0) walk(ch, relMat);
    }
  };
  walk(rootGrp, new THREE.Matrix4());

  const mergedMeshes = [];
  const tmpV = new THREE.Vector3();
  const tmpCol = new THREE.Color();
  let totalTris = 0;

  ['opaque', 'doubleSide', 'emissive'].forEach(bKey => {
    const items = buckets[bKey];
    if (items.length === 0) return;

    let totalVerts = 0;
    const prepared = [];
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const src = it.mesh.geometry;
      const g = (src.index && typeof src.toNonIndexed === 'function') ? src.toNonIndexed() : src;
      const pos = g.attributes && g.attributes.position;
      if (!pos || pos.count < 3) {
        if (g !== src && typeof g.dispose === 'function') g.dispose();
        continue;
      }
      totalVerts += pos.count;
      prepared.push({ g, owned: (g !== src), mat: it.mat, relMat: it.relMat, flip: getDet3(it.relMat) < 0 });
    }
    if (totalVerts < 3) return;

    const positions = new Float32Array(totalVerts * 3);
    const colors = new Float32Array(totalVerts * 3);
    let offset = 0;

    for (let p = 0; p < prepared.length; p++) {
      const item = prepared[p];
      const posAttr = item.g.attributes.position;
      const colAttr = item.g.attributes.color;
      if (item.mat.color) tmpCol.copy(item.mat.color);
      else tmpCol.setRGB(1, 1, 1);
      const mr = tmpCol.r, mg = tmpCol.g, mb = tmpCol.b;
      const cnt = posAttr.count;
      const m = item.relMat;

      for (let v = 0; v + 2 < cnt; v += 3) {
        const i0 = v;
        const i1 = item.flip ? v + 2 : v + 1;
        const i2 = item.flip ? v + 1 : v + 2;
        const triIdx = [i0, i1, i2];
        for (let k = 0; k < 3; k++) {
          const vi = triIdx[k];
          tmpV.set(posAttr.getX(vi), posAttr.getY(vi), posAttr.getZ(vi)).applyMatrix4(m);
          positions[offset]     = tmpV.x;
          positions[offset + 1] = tmpV.y;
          positions[offset + 2] = tmpV.z;
          if (colAttr) {
            colors[offset]     = colAttr.getX(vi) * mr;
            colors[offset + 1] = colAttr.getY(vi) * mg;
            colors[offset + 2] = colAttr.getZ(vi) * mb;
          } else {
            colors[offset]     = mr;
            colors[offset + 1] = mg;
            colors[offset + 2] = mb;
          }
          offset += 3;
        }
      }
      if (item.owned && typeof item.g.dispose === 'function') item.g.dispose();
    }

    const mergedGeo = new THREE.BufferGeometry();
    mergedGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions.subarray(0, offset), 3));
    mergedGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors.subarray(0, offset), 3));
    if (typeof mergedGeo.computeVertexNormals === 'function') mergedGeo.computeVertexNormals();
    if (typeof mergedGeo.computeBoundingSphere === 'function') mergedGeo.computeBoundingSphere();

    const mergedMesh = new THREE.Mesh(mergedGeo, getMiracleMergedVColorMat(bKey));
    if (bKey !== 'emissive' && castShadow) {
      mergedMesh.castShadow = true;
      mergedMesh.receiveShadow = true;
    }
    if (bKey === 'opaque' && registerWall && Array.isArray(wallMeshes)) {
      wallMeshes.push(mergedMesh);
    }
    mergedMeshes.push(mergedMesh);
    totalTris += Math.floor(offset / 9);
  });

  // 기존 개별 메시 제거 및 임시 지오메트리 즉시 해제
  while (rootGrp.children.length > 0) rootGrp.remove(rootGrp.children[0]);
  disposableGeos.forEach(g => { try { if (typeof g.dispose === 'function') g.dispose(); } catch (e) {} });

  mergedMeshes.forEach(m => rootGrp.add(m));
  rootGrp.userData._mergedDrawCalls = mergedMeshes.length;
  rootGrp.userData._mergedTris = totalTris;
  return rootGrp;
}

// 비정형 아마포(린넨) 차양막 생성기 — 줄무늬 없이 자연스러운 천 처짐·주름·앞단 처마 표현
function createOrganicLinenAwningGroup(awW, awD, linenSpec, woodHex, seed = 1, tiltX = 0.22, withPosts = true, postH = 2.48) {
  const grp = new THREE.Group();
  const mainCol = (linenSpec && linenSpec.main) ? linenSpec.main : '#e8dbc2';
  const trimCol = (linenSpec && linenSpec.trim) ? linenSpec.trim : '#d7c6a6';

  // 1) 처짐과 천 주름이 살아있는 단색 아마포 캐노피 지오메트리
  const clothGeo = new THREE.BoxGeometry(awW, 0.085, awD, 5, 1, 3);
  const pos = clothGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    // 좌·우·중앙 목재 서까래 사이로 천이 부드럽게 처지는 주름
    const nx = x / (awW * 0.5);
    const nz = z / (awD * 0.5);
    const baySag = Math.abs(Math.sin(nx * Math.PI)) * 0.075 * (1 - Math.abs(nz) * 0.25);
    const fold = Math.sin(x * 3.1 + z * 2.4 + seed) * 0.022;
    pos.setXYZ(i, x, y - baySag + fold, z);
  }
  const clothNon = clothGeo.toNonIndexed();
  clothNon.computeVertexNormals();
  clothGeo.dispose();

  const tiltPivot = new THREE.Group();
  tiltPivot.rotation.x = tiltX;

  const clothMesh = createLowPolyMesh(clothNon, mainCol, 0, 0.04, 0, true);
  tiltPivot.add(clothMesh);

  // 2) 앞쪽 끝단에 자연스럽게 늘어진 아마포 처마 주름(같은 아마포 계열 살짝 짙은 톤)
  const valGeo = new THREE.BoxGeometry(awW + 0.04, 0.24, 0.06, 5, 1, 1);
  const vPos = valGeo.attributes.position;
  for (let i = 0; i < vPos.count; i++) {
    const vx = vPos.getX(i), vy = vPos.getY(i), vz = vPos.getZ(i);
    if (vy < 0) {
      const scallop = Math.sin((vx / (awW * 0.5)) * Math.PI * 2.5 + seed) * 0.045;
      vPos.setXYZ(i, vx, vy + scallop, vz + 0.015);
    }
  }
  const valNon = valGeo.toNonIndexed();
  valNon.computeVertexNormals();
  valGeo.dispose();
  const valance = createLowPolyMesh(valNon, trimCol, 0, -0.10, awD * 0.5 - 0.01, false);
  tiltPivot.add(valance);

  // 3) 천 아래 목재 지지대 가로보 & 3개 서까래
  const frontBar = createLowPolyMesh(new THREE.CylinderGeometry(0.055, 0.060, awW + 0.16, 5), woodHex, 0, -0.05, awD * 0.44, false);
  frontBar.rotation.z = Math.PI / 2;
  tiltPivot.add(frontBar);
  [-awW * 0.44, 0, awW * 0.44].forEach(rx => {
    const raf = createLowPolyMesh(new THREE.CylinderGeometry(0.045, 0.052, awD, 5), woodHex, rx, -0.04, 0, false);
    raf.rotation.x = Math.PI / 2;
    tiltPivot.add(raf);
  });

  grp.add(tiltPivot);

  // 4) 앞쪽 수직 목재 기둥 (옵션)
  if (withPosts) {
    const dropY = Math.sin(tiltX) * (awD * 0.44);
    const p1 = createLowPolyMesh(new THREE.CylinderGeometry(0.085, 0.105, postH, 6), woodHex, -awW * 0.44, -dropY - postH * 0.5, awD * 0.42, true);
    const p2 = createLowPolyMesh(new THREE.CylinderGeometry(0.085, 0.105, postH, 6), woodHex,  awW * 0.44, -dropY - postH * 0.5, awD * 0.42, true);
    grp.add(p1, p2);
  }
  return grp;
}

// 양손잡이 토기 암포라(항아리) 공용 생성기
function createBuildingAmphoraProp(scale = 1.0, bodyHex = '#c26533', rimHex = '#8f471e') {
  const g = new THREE.Group();
  const s = scale;
  const foot = createLowPolyMesh(new THREE.CylinderGeometry(0.11 * s, 0.14 * s, 0.12 * s, 6), rimHex, 0, 0.06 * s, 0, false);
  const belly = createLowPolyMesh(new THREE.DodecahedronGeometry(0.30 * s, 0), bodyHex, 0, 0.36 * s, 0, true);
  belly.scale.set(0.92, 1.32, 0.92);
  const neck = createLowPolyMesh(new THREE.CylinderGeometry(0.11 * s, 0.15 * s, 0.24 * s, 6), bodyHex, 0, 0.68 * s, 0, false);
  const rim = createLowPolyMesh(new THREE.TorusGeometry(0.13 * s, 0.036 * s, 4, 7), rimHex, 0, 0.80 * s, 0, false);
  rim.rotation.x = Math.PI / 2;
  [-1, 1].forEach(side => {
    const hdl = createLowPolyMesh(new THREE.TorusGeometry(0.11 * s, 0.026 * s, 4, 6, Math.PI), rimHex, side * 0.18 * s, 0.56 * s, 0, false);
    hdl.rotation.z = side * (-Math.PI * 0.42);
    g.add(hdl);
  });
  g.add(foot, belly, neck, rim);
  return g;
}

// 비정형 돌벽돌 조적 외벽 생성기 (건물 전체를 손다듬 비정형 석재·점토 벽돌 단층으로 쌓아 올림)
function buildIrregularStackedBrickWallShell(parentGrp, w, h, d, baseY, seed, offsetX = 0, offsetZ = 0, doorCutoutX = null) {
  const mortarCore = createLowPolyMesh(
    new THREE.BoxGeometry(w - 0.16, h, d - 0.16),
    '#8f7553',
    offsetX, baseY + h * 0.5, offsetZ,
    true
  );
  parentGrp.add(mortarCore);

  const brickPalette = ['#ecd5b0', '#e0c496', '#d2b180', '#f3e1c2', '#c6a270', '#d9bb8c'];
  const courses = Math.max(4, Math.round(h / 0.54));
  const courseH = h / courses;
  const bh = courseH * 0.90;

  const layFace = (spanLen, fixedHalf, isZFace, sideSign) => {
    for (let row = 0; row < courses; row++) {
      const cy = baseY + (row + 0.5) * courseH;
      const taper = 1.0 - ((row + 0.5) / courses) * 0.03;
      const effSpan = spanLen * taper;
      const surf = fixedHalf * taper;
      const stagger = (row % 2 === 0) ? 0 : 0.52;
      let cursor = -effSpan * 0.5 + stagger;
      let colIdx = 0;

      // 홀수 줄 좌측 모서리 마감 반벽돌
      if (stagger > 0.05) {
        const bw0 = stagger - 0.03;
        const bc0 = -effSpan * 0.5 + bw0 * 0.5;
        const skipDoor0 = (isZFace && sideSign === 1 && doorCutoutX !== null && Math.abs(bc0 - doorCutoutX) < 1.05 && (cy - baseY) < 2.60);
        if (!skipDoor0 && bw0 > 0.20) {
          const s0 = seed + row * 31 + (isZFace ? 1 : 9) * 13 + sideSign * 7;
          const bd0 = 0.24 + _organicHash(s0) * 0.08;
          const m0 = createLowPolyMesh(
            createOrganicBoxGeo(isZFace ? bw0 : bd0, bh, isZFace ? bd0 : bw0, s0, 0.06, 0.96, 1),
            brickPalette[Math.abs(Math.floor(_organicHash(s0 + 2) * brickPalette.length)) % brickPalette.length],
            offsetX + (isZFace ? bc0 : sideSign * (surf - bd0 * 0.18)),
            cy,
            offsetZ + (isZFace ? sideSign * (surf - bd0 * 0.18) : bc0),
            false
          );
          parentGrp.add(m0);
        }
      }

      while (cursor < effSpan * 0.5 - 0.15) {
        const s = seed + row * 53 + colIdx * 11 + (isZFace ? 100 : 300) + sideSign * 19;
        const remain = effSpan * 0.5 - cursor;
        const rawW = 0.96 + _organicHash(s) * 0.44;
        const bw = (remain < 1.35) ? remain : Math.min(rawW, remain - 0.04);
        const bc = cursor + bw * 0.5;
        cursor += bw + 0.035;
        colIdx++;

        // 정면 아치 문 영역은 벽돌을 비워 문이 깔끔하게 들어가도록 처리
        if (isZFace && sideSign === 1 && doorCutoutX !== null && Math.abs(bc - doorCutoutX) < 1.05 && (cy - baseY) < 2.60) {
          continue;
        }
        const bd = 0.24 + _organicHash(s + 3) * 0.09;
        const bCol = brickPalette[(row * 3 + colIdx * 2 + Math.abs(seed)) % brickPalette.length];
        const bMesh = createLowPolyMesh(
          createOrganicBoxGeo(isZFace ? bw : bd, bh * (0.94 + _organicHash(s + 5) * 0.10), isZFace ? bd : bw, s, 0.06, 0.96, 1),
          bCol,
          offsetX + (isZFace ? bc : sideSign * (surf - bd * 0.18)),
          cy + (_organicHash(s + 7) - 0.5) * 0.02,
          offsetZ + (isZFace ? sideSign * (surf - bd * 0.18) : bc),
          false
        );
        parentGrp.add(bMesh);
      }
    }
  };

  layFace(w, d * 0.5, true,  1);
  layFace(w, d * 0.5, true, -1);
  layFace(d, w * 0.5, false,  1);
  layFace(d, w * 0.5, false, -1);
}

// -------------------------------------------------------------------------
// 메인 빌딩 생성 함수 (`addLowPolyVillageHouse`)
// - 기존 장식 100% 유지 + 허브화분창·러그·퍼걸러·아마포 차양(건물별 농도 배리에이션) 보완
// - `masonryStyle = 'stonebrick'` 지정 시 비정형 벽돌로 쌓아 올린 석조 가옥 구성
// - 최종적으로 정점 색상 병합(2 드로우콜)하여 모바일 렌더링 성능을 대폭 개선!
// -------------------------------------------------------------------------
function addLowPolyVillageHouse(
  cx,
  cz,
  w = 7.8,
  h = 4.0,
  d = 6.6,
  wallHex = '#e6be8a',
  roofHex = '#cfa36e',
  withRoofStairs = false,
  variant = 0,
  facingYaw = 0,
  masonryStyle = 'plaster'
) {
  if (typeof miracleSunSystem !== 'undefined' && miracleSunSystem.light && miracleSunSystem.light.shadow) {
    miracleSunSystem.light.shadow.bias = -0.00018;
  }

  const by = getBaseGroundHeight(cx, cz);
  const houseGrp = new THREE.Group();
  const seed = Math.abs(Math.round(cx * 13 + cz * 29)) + variant * 17 + 1;
  const isStoneBrick = (masonryStyle === 'stonebrick');

  const wallCol   = wallHex || '#e6be8a';
  const trimCol   = roofHex || '#cfa36e';
  const brickCol1 = '#c99860';
  const brickCol2 = '#b8844c';
  const woodCol   = '#6b4226';
  const darkVoid  = '#23170f';

  // 건물마다 서로 다른 농도의 자연 아마포(린넨) 색상 배리에이션 부여
  const linenIdx  = Math.abs(Math.round(cx * 3 + cz * 7) + variant * 2) % MIRACLE_LINEN_SHADES.length;
  const linenSpec = MIRACLE_LINEN_SHADES[linenIdx];

  const hasSecondFloorRoom = (variant === 1 || variant === 3);
  const showExteriorStairs = withRoofStairs || hasSecondFloorRoom || (variant === 0);
  const stairSide = withRoofStairs ? 1 : ((variant % 2 === 0) ? -1 : 1);

  const cosYaw = Math.cos(facingYaw);
  const sinYaw = Math.sin(facingYaw);
  const toWorldXZ = (lx, lz) => ({
    wx: cx + lx * cosYaw + lz * sinYaw,
    wz: cz - lx * sinYaw + lz * cosYaw
  });

  const doorX = -w * 0.12;

  // [A] 1층 본채 (일반 회벽 또는 비정형 벽돌 조적 외벽) & 기초석 & 상단 띠장 & 옥상 파라펫 난간
  const foundationPlinth = createLowPolyMesh(new THREE.BoxGeometry(w + 0.14, 1.4, d + 0.14), trimCol, 0, -0.68, 0, false);
  houseGrp.add(foundationPlinth);

  if (isStoneBrick) {
    buildIrregularStackedBrickWallShell(houseGrp, w, h, d, 0, seed, 0, 0, doorX);
  } else {
    const mainBodyGeo = createOrganicBoxGeo(w, h, d, seed, 0.036, 0.96, 2);
    const mainBody = createLowPolyMesh(mainBodyGeo, wallCol, 0, h * 0.5, 0, true);
    houseGrp.add(mainBody);
  }

  const roofSlab = createLowPolyMesh(createOrganicBoxGeo(w - 0.24, 0.20, d - 0.24, seed + 1, 0.03, 1.0, 2), trimCol, 0, h + 0.04, 0, true);
  const beltCourse = createLowPolyMesh(createOrganicBoxGeo(w + 0.34, 0.24, d + 0.34, seed + 2, 0.04, 1.0, 2), trimCol, 0, h - 0.06, 0, true);
  houseGrp.add(roofSlab, beltCourse);

  // 옥상 테두리(난간): 걸어서는 통과할 수 없지만 점프하면 난간 너머로 뛰어넘어 나갈 수 있는 높이(by + h + 0.78)로 설정!
  const pH = 0.72, pT = 0.38;
  const paraCol = isStoneBrick ? '#d6c3a4' : wallCol;
  const paraBack = createLowPolyMesh(createOrganicBoxGeo(w + 0.10, pH, pT, seed + 3, 0.06, 0.94, 2), paraCol, 0, h + pH * 0.5, -d * 0.5 + pT * 0.5, true);
  const paraFront = createLowPolyMesh(createOrganicBoxGeo(w + 0.10, pH, pT, seed + 4, 0.06, 0.94, 2), paraCol, 0, h + pH * 0.5,  d * 0.5 - pT * 0.5, true);
  houseGrp.add(paraBack, paraFront);

  const addRooftopParapetCollider = (lx0, lz0, lx1, lz1, thick = 0.44) => {
    const p0 = toWorldXZ(lx0, lz0);
    const p1 = toWorldXZ(lx1, lz1);
    const halfT = thick * 0.5;
    const isAxisAligned = (Math.abs(sinYaw) < 0.05 || Math.abs(cosYaw) < 0.05);
    if (isAxisAligned) {
      platforms.push({
        minX: Math.min(p0.wx, p1.wx) - halfT,
        maxX: Math.max(p0.wx, p1.wx) + halfT,
        minZ: Math.min(p0.wz, p1.wz) - halfT,
        maxZ: Math.max(p0.wz, p1.wz) + halfT,
        topY: by + h + 0.78,
        passUnderY: by + h - 0.55,
        wallOnly: true
      });
    } else {
      const segs = 4;
      for (let i = 0; i < segs; i++) {
        const t = (i + 0.5) / segs;
        const sx = p0.wx + (p1.wx - p0.wx) * t;
        const sz = p0.wz + (p1.wz - p0.wz) * t;
        const segR = Math.max(halfT, Math.hypot(p1.wx - p0.wx, p1.wz - p0.wz) / (segs * 1.8));
        platforms.push({
          minX: sx - segR,
          maxX: sx + segR,
          minZ: sz - segR,
          maxZ: sz + segR,
          topY: by + h + 0.78,
          passUnderY: by + h - 0.55,
          wallOnly: true
        });
      }
    }
  };

  addRooftopParapetCollider(-w * 0.5, -d * 0.5 + pT * 0.5, w * 0.5, -d * 0.5 + pT * 0.5, pT + 0.16);
  addRooftopParapetCollider(-w * 0.5,  d * 0.5 - pT * 0.5, w * 0.5,  d * 0.5 - pT * 0.5, pT + 0.16);

  [-1, 1].forEach(sideDir => {
    const sideX = sideDir * (w * 0.5 - pT * 0.5);
    if (showExteriorStairs && sideDir === stairSide) {
      const closedLen = d * 0.52;
      const closedCenterZ = d * 0.5 - closedLen * 0.5;
      const sideParaPart = createLowPolyMesh(
        createOrganicBoxGeo(pT, pH, closedLen, seed + 5 + sideDir, 0.06, 0.94, 2),
        paraCol, sideX, h + pH * 0.5, closedCenterZ, true
      );
      houseGrp.add(sideParaPart);
      addRooftopParapetCollider(sideX, d * 0.5 - closedLen, sideX, d * 0.5, pT + 0.16);
    } else {
      const sideParaFull = createLowPolyMesh(
        createOrganicBoxGeo(pT, pH, d, seed + 7 + sideDir, 0.06, 0.94, 2),
        paraCol, sideX, h + pH * 0.5, 0, true
      );
      houseGrp.add(sideParaFull);
      addRooftopParapetCollider(sideX, -d * 0.5, sideX, d * 0.5, pT + 0.16);
    }
  });

  // 1층 외벽 비정형 돌출 벽돌 배치 (조적 건물은 이미 전 벽이 벽돌이므로 회벽 건물에만 배치)
  if (!isStoneBrick) {
    addScatteredIrregularBricksToWall(houseGrp, w * 0.96, h, d * 0.96, 0, brickCol1, brickCol2, seed + 20, 0, 0);
  }

  // [B] 1층 정면 아치형 입구 (벽면과 겹치지 않도록 전면 여유 확보) + 석조 디딤돌 + 비정형 창문/화분 + 토기 항아리 (외벽 전등 삭제)
  const archedEntrance = createOrganicArchedEntranceGroup(1.85, 2.55, trimCol, darkVoid, woodCol, seed + 40);
  archedEntrance.position.set(doorX, 0, d * 0.5 + 0.08);
  houseGrp.add(archedEntrance);

  const stepStone = createLowPolyMesh(createOrganicBoxGeo(2.20, 0.22, 0.74, seed + 41, 0.08, 0.96, 1), '#b89a70', doorX, 0.11, d * 0.5 + 0.42, true);
  const doorAmphora = createBuildingAmphoraProp(0.92, '#c26533', '#8f471e');
  doorAmphora.position.set(doorX - 1.38, 0, d * 0.5 + 0.54);
  houseGrp.add(stepStone, doorAmphora);

  // 정면 1층 따뜻한 빛 비치는 나무 덧문 창문 + 테라코타 허브 화분 (벽 겹침 방지용 Z 오프셋 보정)
  const winW = (variant === 2) ? 0.78 : 0.92;
  const winX = (variant === 2) ? (-w * 0.36) : (w * 0.26);
  const winY = h * 0.56;
  if (w >= 6.4) {
    const warmPane = createLowPolyMesh(new THREE.BoxGeometry(winW, 1.00, 0.22), '#f59e0b', winX, winY, d * 0.5 + 0.06, false);
    warmPane.userData._emissiveGlow = true;
    const shutW = (variant === 2) ? 0.22 : 0.27;
    const shutOff = winW * 0.5 + shutW * 0.52;
    const shutL = createLowPolyMesh(createOrganicBoxGeo(shutW, 1.02, 0.12, seed + 42, 0.06, 0.98, 1), '#7c4318', winX - shutOff, winY, d * 0.5 + 0.14, false);
    const shutR = createLowPolyMesh(createOrganicBoxGeo(shutW, 1.02, 0.12, seed + 43, 0.06, 0.98, 1), '#7c4318', winX + shutOff, winY, d * 0.5 + 0.14, false);
    const winTop = createLowPolyMesh(createOrganicBoxGeo(winW + shutW * 1.8, 0.19, 0.30, seed + 44, 0.09, 0.94, 1), '#b8844c', winX, winY + 0.58, d * 0.5 + 0.10, false);
    const planter = createLowPolyMesh(createOrganicBoxGeo(winW + 0.16, 0.23, 0.34, seed + 45, 0.08, 0.90, 1), '#b86232', winX, winY - 0.62, d * 0.5 + 0.20, false);
    const herb1 = createLowPolyMesh(new THREE.DodecahedronGeometry(0.17, 0), '#65a30d', winX - winW * 0.24, winY - 0.43, d * 0.5 + 0.22, false);
    const herb2 = createLowPolyMesh(new THREE.DodecahedronGeometry(0.15, 0), '#84cc16', winX + winW * 0.22, winY - 0.45, d * 0.5 + 0.24, false);
    houseGrp.add(warmPane, shutL, shutR, winTop, planter, herb1, herb2);
  }

  const sideWin1 = createOrganicWindowGroup(0.95, 1.10, brickCol1, trimCol, darkVoid, seed + 50);
  sideWin1.rotation.y = -stairSide * (Math.PI / 2);
  sideWin1.position.set(-stairSide * (w * 0.5 + 0.06), h * 0.58, 0.4);
  houseGrp.add(sideWin1);

  if (!hasSecondFloorRoom) {
    const beamCnt = 4;
    for (let b = 0; b < beamCnt; b++) {
      const bx = -w * 0.34 + (b / (beamCnt - 1)) * (w * 0.68);
      const rafter = createOrganicRoofBeamMesh(0.68, woodCol, seed + 60 + b);
      rafter.rotation.x = Math.PI / 2 + 0.05;
      rafter.position.set(bx, h - 0.35, d * 0.5 + 0.14);
      houseGrp.add(rafter);
    }
    const matX = -stairSide * (w * 0.16);
    const matRoof = createLowPolyMesh(createOrganicBoxGeo(2.2, 0.09, 1.7, seed + 66, 0.06, 0.98, 1), linenSpec.trim, matX, h + 0.17, -0.25, false);
    const grainPile = createLowPolyMesh(new THREE.DodecahedronGeometry(0.42, 0), '#eab308', matX, h + 0.32, -0.25, false);
    grainPile.scale.set(1.25, 0.44, 1.1);
    houseGrp.add(matRoof, grainPile);

    if (variant !== 2) {
      const sideCanopy = createOrganicLinenAwningGroup(2.15, 1.15, linenSpec, woodCol, seed + 68, 0.28, false, 0);
      sideCanopy.rotation.y = -stairSide * (Math.PI / 2);
      sideCanopy.position.set(-stairSide * (w * 0.5 + 0.56), h * 0.78, 0.4);
      houseGrp.add(sideCanopy);
    }
  }

  const pot1 = createJudeanClayPotMesh(1.05, '#b86232');
  pot1.position.set(-w * 0.42, 0, d * 0.5 + 0.52);
  const pot2 = createJudeanClayPotMesh(0.82, '#9e4f24');
  pot2.position.set(-w * 0.32, 0, d * 0.5 + 0.66);
  const pot3 = createJudeanClayPotMesh(0.90, '#b86232');
  pot3.position.set(doorX + 1.25, 0, d * 0.5 + 0.56);
  houseGrp.add(pot1, pot2, pot3);

  // [C] 2층 방(Upper Chamber) & 테라스 벤치 & 서까래 & 아마포 측면 차양 & 퍼걸러/러그/굴뚝 (variant 1, 3)
  if (hasSecondFloorRoom) {
    const uW = w * 0.58;
    const uH = 3.10;
    const uD = d * 0.62;
    const uX = -stairSide * (w * 0.16);
    const uZ = -d * 0.12;

    if (isStoneBrick) {
      buildIrregularStackedBrickWallShell(houseGrp, uW, uH, uD, h, seed + 70, uX, uZ, -uW * 0.20);
    } else {
      const upperBody = createLowPolyMesh(createOrganicBoxGeo(uW, uH, uD, seed + 70, 0.036, 0.96, 2), wallCol, uX, h + uH * 0.5, uZ, true);
      houseGrp.add(upperBody);
    }
    const upperRoofSlab = createLowPolyMesh(createOrganicBoxGeo(uW - 0.22, 0.16, uD - 0.22, seed + 71, 0.03, 1.0, 1), trimCol, uX, h + uH - 0.08, uZ, true);
    const upH = 0.38, upT = 0.28;
    const upParaF = createLowPolyMesh(createOrganicBoxGeo(uW + 0.06, upH, upT, seed + 72, 0.06, 0.95, 1), trimCol, uX, h + uH + upH * 0.4, uZ + uD * 0.5 - upT * 0.5, true);
    const upParaB = createLowPolyMesh(createOrganicBoxGeo(uW + 0.06, upH, upT, seed + 73, 0.06, 0.95, 1), trimCol, uX, h + uH + upH * 0.4, uZ - uD * 0.5 + upT * 0.5, true);
    const upParaL = createLowPolyMesh(createOrganicBoxGeo(upT, upH, uD, seed + 74, 0.06, 0.95, 1), trimCol, uX - uW * 0.5 + upT * 0.5, h + uH + upH * 0.4, uZ, true);
    const upParaR = createLowPolyMesh(createOrganicBoxGeo(upT, upH, uD, seed + 75, 0.06, 0.95, 1), trimCol, uX + uW * 0.5 - upT * 0.5, h + uH + upH * 0.4, uZ, true);
    houseGrp.add(upperRoofSlab, upParaF, upParaB, upParaL, upParaR);

    if (!isStoneBrick) {
      addScatteredIrregularBricksToWall(houseGrp, uW * 0.95, uH, uD * 0.95, h, brickCol1, brickCol2, seed + 80, uX, uZ);
    }

    const upperDoor = createOrganicUpperDoorGroup(1.12, 2.10, trimCol, woodCol, seed + 90);
    upperDoor.position.set(uX - uW * 0.20, h, uZ + uD * 0.5 + 0.06);
    houseGrp.add(upperDoor);

    const upperFrontWin = createOrganicWindowGroup(0.80, 0.96, brickCol1, trimCol, darkVoid, seed + 95);
    upperFrontWin.position.set(uX + uW * 0.22, h + 1.35, uZ + uD * 0.5 + 0.06);
    houseGrp.add(upperFrontWin);

    const upperSideWin = createOrganicWindowGroup(0.80, 0.96, brickCol1, trimCol, darkVoid, seed + 98);
    upperSideWin.rotation.y = stairSide * (Math.PI / 2);
    upperSideWin.position.set(uX + stairSide * (uW * 0.5 + 0.06), h + 1.35, uZ + 0.12);
    houseGrp.add(upperSideWin);

    const upperBackWin = createOrganicWindowGroup(0.76, 0.90, brickCol1, trimCol, darkVoid, seed + 99);
    upperBackWin.rotation.y = Math.PI;
    upperBackWin.position.set(uX + 0.35, h + 1.35, uZ - uD * 0.5 - 0.06);
    houseGrp.add(upperBackWin);

    for (let b = 0; b < 4; b++) {
      const bx = uX - uW * 0.34 + (b / 3) * (uW * 0.68);
      const backBeam = createOrganicRoofBeamMesh(0.68, woodCol, seed + 110 + b);
      backBeam.rotation.x = Math.PI / 2 - 0.05;
      backBeam.position.set(bx, h + uH - 0.40, uZ - uD * 0.5 - 0.12);
      houseGrp.add(backBeam);
    }
    for (let b = 0; b < 3; b++) {
      const bz = uZ - uD * 0.28 + (b / 2) * (uD * 0.56);
      const sideBeam = createOrganicRoofBeamMesh(0.66, woodCol, seed + 120 + b);
      sideBeam.rotation.z = Math.PI / 2;
      sideBeam.position.set(uX - stairSide * (uW * 0.5 + 0.12), h + uH - 0.40, bz);
      houseGrp.add(sideBeam);
    }

    const terraceBench = createOrganicTerraceBench(woodCol, seed + 130);
    terraceBench.position.set(uX + uW * 0.18, h, uZ + uD * 0.5 + 0.58);
    const terracePot = createJudeanClayPotMesh(0.85, '#b86232');
    terracePot.position.set(stairSide * (w * 0.32), h, -d * 0.32);
    houseGrp.add(terraceBench, terracePot);

    const rugX = stairSide * (w * 0.20);
    const rugMain = createLowPolyMesh(createOrganicBoxGeo(1.52, 0.88, 0.14, seed + 131, 0.08, 0.96, 2), '#b91c1c', rugX, h + 0.40, d * 0.5 + 0.04, false);
    const rugBand1 = createLowPolyMesh(new THREE.BoxGeometry(1.55, 0.16, 0.17), '#eab308', rugX, h + 0.18, d * 0.5 + 0.05, false);
    const rugBand2 = createLowPolyMesh(new THREE.BoxGeometry(1.55, 0.14, 0.17), linenSpec.main, rugX, h + 0.55, d * 0.5 + 0.05, false);

    const pBaseX = stairSide * (w * 0.295);
    const pBaseZ = d * 0.14;
    const pHalfW = Math.min(0.84, w * 0.10);
    const pHalfD = Math.min(0.86, d * 0.13);
    const pp1 = createLowPolyMesh(new THREE.CylinderGeometry(0.075, 0.095, 2.35, 5), woodCol, pBaseX - pHalfW, h + 1.18, pBaseZ + pHalfD, false);
    const pp2 = createLowPolyMesh(new THREE.CylinderGeometry(0.075, 0.095, 2.35, 5), woodCol, pBaseX + pHalfW, h + 1.18, pBaseZ + pHalfD, false);
    const pp3 = createLowPolyMesh(new THREE.CylinderGeometry(0.075, 0.095, 2.35, 5), woodCol, pBaseX + stairSide * pHalfW, h + 1.18, pBaseZ - pHalfD, false);
    const pBeamF = createLowPolyMesh(new THREE.CylinderGeometry(0.075, 0.085, pHalfW * 2.25, 5), '#5c2d0c', pBaseX, h + 2.35, pBaseZ + pHalfD, false);
    pBeamF.rotation.z = Math.PI / 2;
    const pBeamB = createLowPolyMesh(new THREE.CylinderGeometry(0.075, 0.085, pHalfW * 2.25, 5), '#5c2d0c', pBaseX, h + 2.35, pBaseZ - pHalfD, false);
    pBeamB.rotation.z = Math.PI / 2;
    for (let r = 0; r < 4; r++) {
      const rx = pBaseX - pHalfW * 0.85 + (r / 3) * (pHalfW * 1.70);
      const slat = createLowPolyMesh(new THREE.CylinderGeometry(0.050, 0.055, pHalfD * 2.30, 5), '#78350f', rx, h + 2.44, pBaseZ, false);
      slat.rotation.x = Math.PI / 2;
      houseGrp.add(slat);
    }
    [[-0.45, 0.55], [0.22, 0.42], [0.58, -0.05], [-0.15, -0.35]].forEach(([vx, vz], idx) => {
      const vine = createLowPolyMesh(new THREE.IcosahedronGeometry(0.38 + (idx % 2) * 0.09, 0), idx % 2 === 0 ? '#65a30d' : '#4d7c0f', pBaseX + vx * pHalfW, h + 2.57, pBaseZ + vz * pHalfD, false);
      vine.scale.set(1.25, 0.50, 1.10);
      houseGrp.add(vine);
    });

    const chimney = createLowPolyMesh(new THREE.CylinderGeometry(0.26, 0.36, 0.82, 7), trimCol, uX - stairSide * (uW * 0.22), h + uH + 0.36, uZ - uD * 0.18, false);
    houseGrp.add(rugMain, rugBand1, rugBand2, pp1, pp2, pp3, pBeamF, pBeamB, chimney);

    const awW = 3.1, awD = 1.85;
    const sideLinenAwning = createOrganicLinenAwningGroup(awW, awD, linenSpec, woodCol, seed + 140, 0.18, true, h * 0.65);
    sideLinenAwning.rotation.y = -stairSide * (Math.PI / 2);
    sideLinenAwning.position.set(-stairSide * (w * 0.5 + awD * 0.44), h * 0.72, -0.4);
    houseGrp.add(sideLinenAwning);

    const uWorld = toWorldXZ(uX, uZ);
    const uEffW = (uW * 0.5 * Math.abs(cosYaw)) + (uD * 0.5 * Math.abs(sinYaw)) + 0.18;
    const uEffD = (uW * 0.5 * Math.abs(sinYaw)) + (uD * 0.5 * Math.abs(cosYaw)) + 0.18;
    platforms.push({
      minX: uWorld.wx - uEffW,
      maxX: uWorld.wx + uEffW,
      minZ: uWorld.wz - uEffD,
      maxZ: uWorld.wz + uEffD,
      topY: by + h + uH
    });
  }

  // [D] 시장 상점형 가옥(variant === 2) — 자연 아마포 차양막(건물별 농도 배리에이션) & 시장 진열대
  if (variant === 2) {
    const awW = 3.25, awD = 1.95;
    const awX = w * 0.22, awZ = d * 0.5 + awD * 0.5;
    const frontLinenAwning = createOrganicLinenAwningGroup(awW, awD, linenSpec, woodCol, seed + 150, 0.22, true, 2.48);
    frontLinenAwning.position.set(awX, 2.82, awZ);
    const crate = createLowPolyMesh(createOrganicBoxGeo(1.45, 0.65, 0.95, seed + 151, 0.06, 0.96, 1), '#b45309', awX, 0.33, awZ, true);
    const fruit1 = createLowPolyMesh(new THREE.DodecahedronGeometry(0.28, 0), '#facc15', awX - 0.3, 0.78, awZ, true);
    const fruit2 = createLowPolyMesh(new THREE.DodecahedronGeometry(0.26, 0), '#4ade80', awX + 0.3, 0.78, awZ, true);
    const sackShop = createLowPolyMesh(new THREE.IcosahedronGeometry(0.36, 0), linenSpec.trim, awX + 1.12, 0.28, awZ + 0.12, true);
    sackShop.scale.set(1.0, 0.82, 1.1);
    houseGrp.add(frontLinenAwning, crate, fruit1, fruit2, sackShop);
  }

  // [E] 외벽 돌계단 + 계단 외벽과 바닥부터 일체화된 돌벽 난간(들뜸 완전 해결) & 물리 발판 등록
  if (showExteriorStairs) {
    const stairW = 1.68;
    const stairLocalX = stairSide * (w * 0.5 + stairW * 0.5 - 0.06);
    const railLocalX  = stairSide * (w * 0.5 + stairW - 0.16);
    const stepCount = 9;
    const stairSpanD = d * 0.88;
    const stepDepth = stairSpanD / stepCount;

    for (let s = 1; s <= stepCount; s++) {
      const sh = (h / stepCount) * s;
      const sz = (d * 0.5) - (s - 0.5) * stepDepth;
      const stepGeo = createOrganicBoxGeo(stairW, sh, stepDepth + 0.06, seed + 200 + s, 0.035, 0.98, 1);
      const stepMesh = createLowPolyMesh(stepGeo, trimCol, stairLocalX, sh * 0.5, sz, true);
      houseGrp.add(stepMesh);

      // 계단 바깥쪽 돌벽 난간을 바닥(y=0)부터 계단 단차 위(+0.46)까지 빈틈없이 계단과 일체로 부착!
      const railTop = sh + 0.46;
      const railMesh = createLowPolyMesh(
        createOrganicBoxGeo(0.24, railTop, stepDepth + 0.08, seed + 220 + s, 0.03, 0.98, 1),
        isStoneBrick ? '#cbb796' : trimCol,
        railLocalX,
        railTop * 0.5,
        sz,
        false
      );
      houseGrp.add(railMesh);

      const stWorld = toWorldXZ(stairLocalX, sz);
      const padR = Math.max(stairW, stepDepth) * 0.58;
      platforms.push({
        minX: stWorld.wx - padR,
        maxX: stWorld.wx + padR,
        minZ: stWorld.wz - padR,
        maxZ: stWorld.wz + padR,
        topY: by + sh
      });
    }

    const topLandWorld = toWorldXZ(stairSide * (w * 0.45), -d * 0.25);
    platforms.push({
      minX: topLandWorld.wx - 1.25,
      maxX: topLandWorld.wx + 1.25,
      minZ: topLandWorld.wz - 1.25,
      maxZ: topLandWorld.wz + 1.25,
      topY: by + h + 0.05
    });
  }

  // [성능 최적화 핵심] 집 전체의 정적 장식 메시를 정점 색상 2개 메시(불투명 1 + 발광 창문 1)로 병합!
  mergeStaticLowPolyGroupToVertexColor(houseGrp, { registerWall: true, castShadow: true });

  houseGrp.position.set(cx, by, cz);
  houseGrp.rotation.y = facingYaw;
  worldGroup.add(houseGrp);

  const absCos = Math.abs(cosYaw);
  const absSin = Math.abs(sinYaw);
  const effHalfW = (w * 0.5 * absCos) + (d * 0.5 * absSin) + 0.22;
  const effHalfD = (w * 0.5 * absSin) + (d * 0.5 * absCos) + 0.22;

  platforms.push({
    minX: cx - effHalfW,
    maxX: cx + effHalfW,
    minZ: cz - effHalfD,
    maxZ: cz + effHalfD,
    topY: by + h + 0.05
  });

  // 건물 영역(외부 계단 포함)을 기록하여 랜덤 스폰 아이템이 건물 안/위에 겹치지 않도록 보장
  if (Array.isArray(window.miracleBuildingBounds)) {
    const stairMargin = showExteriorStairs ? 2.4 : 0.9;
    window.miracleBuildingBounds.push({
      minX: cx - effHalfW - stairMargin,
      maxX: cx + effHalfW + stairMargin,
      minZ: cz - effHalfD - stairMargin,
      maxZ: cz + effHalfD + stairMargin,
      cx, cz
    });
  }

  // 외부 계단이 연결되어 올라갈 수 있는 건물 2층(옥상)의 사물 없는 안전 구역을 미션 아이템 2층 스폰 후보로 등록!
  if (showExteriorStairs && Array.isArray(window.miracleRooftopSpawnSpots) && miracleSubMode === 'openworld') {
    const roofLocalSpots = hasSecondFloorRoom
      // 2층 방(uX = -stairSide*w*0.16, uZ = -d*0.12), 퍼걸러 기둥(±0.84), 테라스 벤치, 토기를 모두 피한 개방 테라스 정중앙
      ? [[stairSide * (w * 0.295), d * 0.12]]
      // 옥상 건조 돗자리(matX = -stairSide*w*0.16, z = -0.25)와 난간·계단 입구를 피한 앞쪽 빈 옥상
      : [[stairSide * (w * 0.22), d * 0.24], [-stairSide * (w * 0.22), d * 0.24]];
    roofLocalSpots.forEach(([lx, lz]) => {
      const wp = toWorldXZ(lx, lz);
      window.miracleRooftopSpawnSpots.push({
        x: wp.wx,
        y: by + h + 0.08,
        z: wp.wz,
        houseCx: cx,
        houseCz: cz
      });
    });
  }

  return houseGrp;
}

function addJudeanRoadsideBuilding(cx, cz, variant = 0, facingYaw = 0, scale = 1.0, withRoofStairs = false, masonryStyle = 'plaster') {
  const palettes = [
    { wall: '#e8c391', roof: '#cfa46e', w: 7.4, h: 3.9, d: 6.2 },
    { wall: '#e5b56d', roof: '#c9954c', w: 8.4, h: 4.1, d: 6.8 },
    { wall: '#dfa860', roof: '#c28840', w: 7.6, h: 3.8, d: 6.0 },
    { wall: '#ebd0a9', roof: '#d1b288', w: 8.6, h: 4.1, d: 6.6 },
    { wall: '#edd6b4', roof: '#d4ba94', w: 6.8, h: 3.7, d: 5.8 }
  ];
  const p = palettes[Math.abs(variant) % palettes.length];
  return addLowPolyVillageHouse(
    cx,
    cz,
    p.w * scale,
    p.h * scale,
    p.d * scale,
    p.wall,
    p.roof,
    withRoofStairs,
    Math.abs(variant) % 5,
    facingYaw,
    masonryStyle
  );
}

// -------------------------------------------------------------------------
// 6-A2. [실내 진입 가능 건물 & 미션 전용 3D 에셋 팩토리]
// - 선한 사마리아인 여관(1층 진입 + 내부 병상 & 다친 이웃)
// - 마가의 다락방 2층 실내 진입 가능 가옥 (외부 계단 → 2층 방 내부 물대야/탁자)
// - 구급상자, 물 채운 항아리, 접힌 수건, 종려나무 가지, 오라, 넓은 반석 터
// -------------------------------------------------------------------------
function addWalkableJerichoInn(cx, cz) {
  const by = getBaseGroundHeight(cx, cz);
  const w = 9.4, h = 4.4, d = 7.6, t = 0.64;
  const seed = Math.abs(Math.round(cx * 17 + cz * 31)) + 77;
  const wallCol = '#ebd0a9';
  const trimCol = '#caa06c';
  const brickCol1 = '#d8b684';
  const brickCol2 = '#c9a370';
  const woodCol = '#6b4226';
  const linenSpec = MIRACLE_LINEN_SHADES[1];

  const innGrp = new THREE.Group();
  const staticGrp = new THREE.Group();

  // 기초석 & 비정형 소프트 로우폴리 실내 석재 바닥 + 손다듬 판석 타일
  const foundationPlinth = createLowPolyMesh(new THREE.BoxGeometry(w + 0.16, 1.4, d + 0.16), trimCol, 0, -0.68, 0, false);
  const floorMesh = createLowPolyMesh(
    createOrganicBoxGeo(w - 0.3, 0.22, d - 0.3, seed + 1, 0.04, 0.99, 2),
    '#d9c6a5', 0, 0.08, 0, false
  );
  staticGrp.add(foundationPlinth, floorMesh);

  // 바닥을 채우는 따뜻한 비정형 디딤 판석 6개 (실내 질감 보강)
  const flagCoords = [
    [-2.8, 1.85, 1.35, 1.12, '#cbb48e'], [0.0, 2.05, 1.55, 1.05, '#d4be98'],
    [2.75, 1.65, 1.32, 1.18, '#c5ad86'], [-2.6, 0.25, 1.25, 1.08, '#d4be98'],
    [2.85, 0.25, 1.28, 1.10, '#cbb48e'], [0.15, -0.55, 1.45, 1.10, '#c8b08a']
  ];
  flagCoords.forEach(([fx, fz, fw, fd, fc], idx) => {
    const fl = createLowPolyMesh(
      createOrganicBoxGeo(fw, 0.07, fd, seed + 200 + idx, 0.08, 0.94, 1),
      fc, fx, 0.18, fz, false
    );
    fl.rotation.y = ((idx % 3) - 1) * 0.09;
    staticGrp.add(fl);
  });

  // 비정형 소프트 로우폴리 수직조 양탄자(Woven Patchwork Rug) + 테두리 술 장식
  const rugBase = createLowPolyMesh(createOrganicBoxGeo(3.55, 0.06, 2.55, seed + 210, 0.06, 0.96, 2), '#9a3412', -0.35, 0.215, 0.95, false);
  const rugMid  = createLowPolyMesh(createOrganicBoxGeo(2.82, 0.06, 1.92, seed + 211, 0.05, 0.97, 2), '#d97706', -0.35, 0.225, 0.95, false);
  const rugCore = createLowPolyMesh(createOrganicBoxGeo(1.72, 0.06, 1.08, seed + 212, 0.06, 0.96, 1), '#fde68a', -0.35, 0.235, 0.95, false);
  rugBase.rotation.y = 0.04;
  rugMid.rotation.y  = 0.04;
  rugCore.rotation.y = 0.04;
  staticGrp.add(rugBase, rugMid, rugCore);
  for (let f = -3; f <= 3; f++) {
    const fz = 0.95 + f * 0.34;
    staticGrp.add(
      createLowPolyMesh(createOrganicBoxGeo(0.24, 0.04, 0.14, seed + 215 + f, 0.08, 0.92, 1), '#f5ead6', -2.22, 0.21, fz, false),
      createLowPolyMesh(createOrganicBoxGeo(0.24, 0.04, 0.14, seed + 225 + f, 0.08, 0.92, 1), '#f5ead6',  1.52, 0.21, fz, false)
    );
  }

  // 북/서/동 3면 외벽 + 상단 띠장
  const northWall = createLowPolyMesh(createOrganicBoxGeo(w, h, t, seed + 2, 0.05, 0.98, 2), wallCol, 0, h * 0.5, -d * 0.5 + t * 0.5, true);
  const westWall  = createLowPolyMesh(createOrganicBoxGeo(t, h, d, seed + 3, 0.05, 0.98, 2), wallCol, -w * 0.5 + t * 0.5, h * 0.5, 0, true);
  const eastWall  = createLowPolyMesh(createOrganicBoxGeo(t, h, d, seed + 4, 0.05, 0.98, 2), wallCol,  w * 0.5 - t * 0.5, h * 0.5, 0, true);
  const beltCourse = createLowPolyMesh(createOrganicBoxGeo(w + 0.34, 0.24, d + 0.34, seed + 11, 0.04, 1.0, 2), trimCol, 0, h - 0.06, 0, true);
  staticGrp.add(northWall, westWall, eastWall, beltCourse);

  // 남(+Z) 정면벽: 중앙 3.0m 개방 출입구 + 좌/우 벽 + 아치 석조 프레임 (십자가 마크 없음!)
  const doorHalfW = 1.5;
  const sideW = (w * 0.5) - doorHalfW;
  const southL = createLowPolyMesh(createOrganicBoxGeo(sideW, h, t, seed + 5, 0.05, 0.98, 2), wallCol, -(doorHalfW + sideW * 0.5), h * 0.5, d * 0.5 - t * 0.5, true);
  const southR = createLowPolyMesh(createOrganicBoxGeo(sideW, h, t, seed + 6, 0.05, 0.98, 2), wallCol,  (doorHalfW + sideW * 0.5), h * 0.5, d * 0.5 - t * 0.5, true);
  const doorHeaderH = h - 2.95;
  const southTop = createLowPolyMesh(createOrganicBoxGeo(doorHalfW * 2 + 0.35, doorHeaderH, t + 0.08, seed + 7, 0.04, 0.98, 1), trimCol, 0, 2.95 + doorHeaderH * 0.5, d * 0.5 - t * 0.5, true);
  const jambL = createLowPolyMesh(createOrganicBoxGeo(0.36, 3.05, t + 0.28, seed + 8, 0.06, 0.96, 1), trimCol, -doorHalfW, 1.52, d * 0.5 - t * 0.42, true);
  const jambR = createLowPolyMesh(createOrganicBoxGeo(0.36, 3.05, t + 0.28, seed + 9, 0.06, 0.96, 1), trimCol,  doorHalfW, 1.52, d * 0.5 - t * 0.42, true);
  staticGrp.add(southL, southR, southTop, jambL, jambR);

  // 아치형 출입구 석조 홍예석(5개) + 석조 디딤돌 + 여관 목재 현판(기름병 문양, 십자가 없음)
  for (let i = 0; i < 5; i++) {
    const tArch = i / 4;
    const ang = Math.PI * (0.14 + tArch * 0.72);
    const ax = Math.cos(ang) * (doorHalfW + 0.06);
    const ay = 2.74 + Math.sin(ang) * 0.56;
    const archStone = createLowPolyMesh(createOrganicBoxGeo(0.62, 0.28, 0.34, seed + 12 + i, 0.08, 0.94, 1), brickCol2, ax, ay, d * 0.5 + 0.08, false);
    archStone.rotation.z = ang - Math.PI * 0.5;
    staticGrp.add(archStone);
  }
  const stepStone = createLowPolyMesh(createOrganicBoxGeo(3.45, 0.20, 0.82, seed + 17, 0.07, 0.96, 1), '#b89a70', 0, 0.10, d * 0.5 + 0.44, true);
  const innPlaque = createLowPolyMesh(createOrganicBoxGeo(1.70, 0.50, 0.14, seed + 18, 0.05, 0.98, 1), '#7c4722', 0, 3.74, d * 0.5 + 0.18, false);
  const plaqueJar = createLowPolyMesh(new THREE.DodecahedronGeometry(0.14, 0), '#f59e0b', 0, 3.74, d * 0.5 + 0.28, false);
  plaqueJar.scale.set(0.85, 1.15, 0.45);
  staticGrp.add(stepStone, innPlaque, plaqueJar);

  // 외벽 비정형 돌출 벽돌 (다른 마을 건물과 동일한 로우폴리 질감; 출입구 영역 자동 회피)
  const innBricks = [
    [-w * 0.44, 0.95, d * 0.5 + 0.02, 0.76, 0.34, 0.16],
    [-w * 0.36, 3.45, d * 0.5 + 0.02, 0.68, 0.30, 0.16],
    [ w * 0.42, 1.15, d * 0.5 + 0.02, 0.74, 0.34, 0.16],
    [ w * 0.34, 3.55, d * 0.5 + 0.02, 0.64, 0.30, 0.16],
    [-w * 0.5 - 0.02, 1.25, -1.8, 0.16, 0.36, 0.80],
    [-w * 0.5 - 0.02, 3.15,  1.6, 0.16, 0.34, 0.74],
    [ w * 0.5 + 0.02, 1.35,  1.9, 0.16, 0.36, 0.80],
    [ w * 0.5 + 0.02, 3.35, -1.7, 0.16, 0.34, 0.74],
    [-2.4, 1.4, -d * 0.5 - 0.02, 0.86, 0.36, 0.16],
    [ 2.1, 2.9, -d * 0.5 - 0.02, 0.82, 0.34, 0.16],
    [ 0.2, 0.8, -d * 0.5 - 0.02, 0.78, 0.34, 0.16]
  ];
  innBricks.forEach((b, idx) => {
    staticGrp.add(createLowPolyMesh(
      createOrganicBoxGeo(b[3], b[4], b[5], seed + 140 + idx, 0.08, 0.94, 1),
      idx % 2 === 0 ? brickCol1 : brickCol2,
      b[0], b[1], b[2], false
    ));
  });

  // 정면 입구 아마포 차양 & 좌우 따뜻한 덧문 창문 + 테라코타 허브 화분
  const awning = createOrganicLinenAwningGroup(4.5, 1.85, linenSpec, woodCol, seed + 15, 0.20, true, 2.68);
  awning.position.set(0, 3.18, d * 0.5 + 0.90);
  staticGrp.add(awning);

  [-w * 0.345, w * 0.345].forEach((wx, idx) => {
    const wy = 2.38;
    const warmPane = createLowPolyMesh(new THREE.BoxGeometry(0.84, 0.94, 0.22), '#f59e0b', wx, wy, d * 0.5 + 0.04, false);
    warmPane.userData._emissiveGlow = true;
    const shutL = createLowPolyMesh(createOrganicBoxGeo(0.24, 0.96, 0.12, seed + 160 + idx * 4, 0.06, 0.98, 1), '#7c4318', wx - 0.54, wy, d * 0.5 + 0.12, false);
    const shutR = createLowPolyMesh(createOrganicBoxGeo(0.24, 0.96, 0.12, seed + 161 + idx * 4, 0.06, 0.98, 1), '#7c4318', wx + 0.54, wy, d * 0.5 + 0.12, false);
    const winTop = createLowPolyMesh(createOrganicBoxGeo(1.26, 0.18, 0.28, seed + 162 + idx * 4, 0.08, 0.94, 1), '#b8844c', wx, wy + 0.54, d * 0.5 + 0.08, false);
    const planter = createLowPolyMesh(createOrganicBoxGeo(0.98, 0.22, 0.32, seed + 163 + idx * 4, 0.08, 0.90, 1), '#b86232', wx, wy - 0.58, d * 0.5 + 0.18, false);
    const herb1 = createLowPolyMesh(new THREE.DodecahedronGeometry(0.16, 0), '#65a30d', wx - 0.20, wy - 0.40, d * 0.5 + 0.20, false);
    const herb2 = createLowPolyMesh(new THREE.DodecahedronGeometry(0.14, 0), '#84cc16', wx + 0.18, wy - 0.42, d * 0.5 + 0.22, false);
    staticGrp.add(warmPane, shutL, shutR, winTop, planter, herb1, herb2);
  });

  // 전면/후면 노출 목재 서까래 + 입구 토기 항아리·화분 장식
  for (let b = 0; b < 5; b++) {
    const bx = -w * 0.38 + (b / 4) * (w * 0.76);
    const rafF = createOrganicRoofBeamMesh(0.68, woodCol, seed + 180 + b);
    rafF.rotation.x = Math.PI * 0.5 + 0.05;
    rafF.position.set(bx, h - 0.32, d * 0.5 + 0.14);
    const rafB = createOrganicRoofBeamMesh(0.68, woodCol, seed + 190 + b);
    rafB.rotation.x = Math.PI * 0.5 - 0.05;
    rafB.position.set(bx, h - 0.32, -d * 0.5 - 0.14);
    staticGrp.add(rafF, rafB);
  }
  const frontAmphora = createBuildingAmphoraProp(0.96, '#c26533', '#8f471e');
  frontAmphora.position.set(-w * 0.41, 0, d * 0.5 + 0.58);
  const frontPot1 = createJudeanClayPotMesh(0.95, '#b86232');
  frontPot1.position.set(w * 0.38, 0, d * 0.5 + 0.56);
  const frontPot2 = createJudeanClayPotMesh(0.76, '#9e4f24');
  frontPot2.position.set(w * 0.45, 0, d * 0.5 + 0.78);
  staticGrp.add(frontAmphora, frontPot1, frontPot2);

  // 측면 비정형 창문 + 서쪽 아마포 측면 차양
  const winW = createOrganicWindowGroup(0.95, 1.05, brickCol1, trimCol, '#23170f', seed + 22);
  winW.rotation.y = -Math.PI * 0.5;
  winW.position.set(-w * 0.5 - 0.04, 2.38, 0.2);
  const winE = createOrganicWindowGroup(0.95, 1.05, brickCol1, trimCol, '#23170f', seed + 25);
  winE.rotation.y = Math.PI * 0.5;
  winE.position.set(w * 0.5 + 0.04, 2.38, 0.2);
  const sideCanopyW = createOrganicLinenAwningGroup(2.2, 1.15, MIRACLE_LINEN_SHADES[0], woodCol, seed + 27, 0.26, false, 0);
  sideCanopyW.rotation.y = -Math.PI * 0.5;
  sideCanopyW.position.set(-w * 0.5 - 0.56, 3.35, 0.2);
  staticGrp.add(winW, winE, sideCanopyW);

  // [실내 건축 디테일] 비정형 모서리 원목 기둥 + 천장 목재 들보(까치발) + 북벽 아치형 흙화덕 + 서쪽 벽 선반 & 곡식자루·항아리
  const inHalfW = w * 0.5 - t - 0.18;
  const inHalfD = d * 0.5 - t - 0.18;
  [[-inHalfW, -inHalfD], [inHalfW, -inHalfD], [-inHalfW, inHalfD], [inHalfW, inHalfD]].forEach(([px, pz], idx) => {
    const col = createLowPolyMesh(new THREE.CylinderGeometry(0.14, 0.18, h - 0.12, 6), '#6b3f1d', px, h * 0.5, pz, false);
    col.rotation.y = idx * 0.5;
    const baseSt = createLowPolyMesh(createOrganicBoxGeo(0.44, 0.24, 0.44, seed + 240 + idx, 0.08, 0.92, 1), '#b89a70', px, 0.22, pz, false);
    staticGrp.add(col, baseSt);
  });
  // 실내 상단 노출 목재 들보 2개 (지붕 투과 시 고대 여관의 따뜻한 목조 감성 연출)
  [-1.55, 1.35].forEach((bz, bi) => {
    const beam = createLowPolyMesh(createOrganicBoxGeo(w - t * 2, 0.22, 0.24, seed + 250 + bi, 0.06, 0.96, 2), '#5c3317', 0, h - 0.26, bz, false);
    staticGrp.add(beam);
  });

  // 북벽 중앙 아치형 흙벽 화덕(Clay Hearth) + 은은한 장작 숯불 + 흙냄비
  const hearthX = -0.35, hearthZ = -d * 0.5 + t + 0.34;
  const hearthBase = createLowPolyMesh(createOrganicBoxGeo(1.48, 0.32, 0.82, seed + 255, 0.08, 0.94, 1), '#b89872', hearthX, 0.28, hearthZ, false);
  const hearthPillarL = createLowPolyMesh(createOrganicBoxGeo(0.28, 1.18, 0.68, seed + 256, 0.08, 0.94, 1), '#d6b68c', hearthX - 0.56, 0.98, hearthZ - 0.04, false);
  const hearthPillarR = createLowPolyMesh(createOrganicBoxGeo(0.28, 1.18, 0.68, seed + 257, 0.08, 0.94, 1), '#d6b68c', hearthX + 0.56, 0.98, hearthZ - 0.04, false);
  const hearthHood = createLowPolyMesh(createOrganicBoxGeo(1.56, 0.46, 0.78, seed + 258, 0.08, 0.86, 2), '#c9a678', hearthX, 1.72, hearthZ - 0.06, false);
  const hearthFlue = createLowPolyMesh(createOrganicBoxGeo(0.76, 1.85, 0.54, seed + 259, 0.07, 0.88, 2), '#d8be98', hearthX, 2.82, hearthZ - 0.14, false);
  const hearthCoal = createLowPolyMesh(new THREE.DodecahedronGeometry(0.26, 0), '#f97316', hearthX, 0.52, hearthZ + 0.04, false);
  hearthCoal.scale.set(1.35, 0.45, 0.95);
  hearthCoal.userData._emissiveGlow = true;
  const hearthLog1 = createLowPolyMesh(new THREE.CylinderGeometry(0.06, 0.07, 0.68, 5), '#451a03', hearthX - 0.06, 0.48, hearthZ + 0.08, false);
  hearthLog1.rotation.set(0.15, 0.3, Math.PI * 0.48);
  const hearthPot = createLowPolyMesh(new THREE.DodecahedronGeometry(0.24, 0), '#9a4f25', hearthX + 0.24, 0.62, hearthZ + 0.05, false);
  hearthPot.scale.set(1.0, 0.86, 1.0);
  staticGrp.add(hearthBase, hearthPillarL, hearthPillarR, hearthHood, hearthFlue, hearthCoal, hearthLog1, hearthPot);

  // 서쪽 벽면 목재 선반 + 토기 약병들 + 서남 구석 곡식 자루·항아리 (출입 통로와 겹치지 않게 서벽에 밀착!)
  const shelfX = -w * 0.5 + t + 0.30;
  const wallShelf = createLowPolyMesh(createOrganicBoxGeo(0.46, 0.10, 1.85, seed + 262, 0.06, 0.96, 1), '#7c4722', shelfX, 2.02, -0.35, false);
  const shelfBrk1 = createLowPolyMesh(createOrganicBoxGeo(0.36, 0.24, 0.12, seed + 263, 0.07, 0.92, 1), '#5c2d0c', shelfX - 0.04, 1.86, -1.02, false);
  const shelfBrk2 = createLowPolyMesh(createOrganicBoxGeo(0.36, 0.24, 0.12, seed + 264, 0.07, 0.92, 1), '#5c2d0c', shelfX - 0.04, 1.86,  0.32, false);
  const shelfPot1 = createLowPolyMesh(new THREE.DodecahedronGeometry(0.16, 0), '#c26533', shelfX + 0.02, 2.22, -0.82, false);
  shelfPot1.scale.set(0.85, 1.15, 0.85);
  const shelfPot2 = createLowPolyMesh(new THREE.DodecahedronGeometry(0.14, 0), '#d97706', shelfX + 0.04, 2.20, -0.34, false);
  const shelfPot3 = createLowPolyMesh(new THREE.CylinderGeometry(0.10, 0.13, 0.32, 6), '#9a4f25', shelfX + 0.02, 2.23,  0.16, false);
  const cornerSack1 = createLowPolyMesh(new THREE.IcosahedronGeometry(0.44, 0), '#d6bc90', -w * 0.5 + t + 0.58, 0.44, 1.55, true);
  cornerSack1.scale.set(1.05, 0.82, 1.18);
  cornerSack1.rotation.y = 0.4;
  const cornerSack2 = createLowPolyMesh(new THREE.IcosahedronGeometry(0.34, 0), '#c6a574', -w * 0.5 + t + 0.54, 0.38, 0.78, true);
  cornerSack2.scale.set(0.95, 0.78, 1.10);
  const cornerAmph = createBuildingAmphoraProp(0.82, '#b86232', '#8f471e');
  cornerAmph.position.set(-w * 0.5 + t + 0.56, 0.16, 2.25);
  staticGrp.add(wallShelf, shelfBrk1, shelfBrk2, shelfPot1, shelfPot2, shelfPot3, cornerSack1, cornerSack2, cornerAmph);

  // [실내 가구 1] 비정형 소프트 로우폴리 나무 병상(Sickbed) & 간병인 둥근 나무 의자 — 북동쪽 실내 (lx = +1.75, lz = -1.25)
  const bedX = 1.75, bedZ = -1.25;
  const bedFrame = createLowPolyMesh(createOrganicBoxGeo(2.48, 0.34, 1.34, seed + 30, 0.07, 0.96, 2), '#7c4722', bedX, 0.46, bedZ, true);
  [[-1.08, -0.52], [1.08, -0.52], [-1.08, 0.52], [1.08, 0.52]].forEach(([lx, lz], li) => {
    const leg = createLowPolyMesh(new THREE.CylinderGeometry(0.085, 0.11, 0.46, 6), '#5c2d0c', bedX + lx, 0.24, bedZ + lz, false);
    leg.rotation.y = li * 0.5;
    staticGrp.add(leg);
  });
  const headBoard = createLowPolyMesh(createOrganicBoxGeo(0.20, 1.02, 1.40, seed + 31, 0.08, 0.92, 2), '#6b3818', bedX + 1.18, 0.78, bedZ, true);
  const headCap   = createLowPolyMesh(createOrganicBoxGeo(0.24, 0.18, 1.46, seed + 271, 0.09, 0.90, 1), '#854d0e', bedX + 1.18, 1.32, bedZ, false);
  const footBoard = createLowPolyMesh(createOrganicBoxGeo(0.16, 0.56, 1.34, seed + 272, 0.08, 0.94, 1), '#6b3818', bedX - 1.18, 0.58, bedZ, true);
  const mattress  = createLowPolyMesh(createOrganicBoxGeo(2.26, 0.22, 1.18, seed + 32, 0.07, 0.96, 2), '#f5ead6', bedX - 0.04, 0.69, bedZ, false);
  const pillow    = createLowPolyMesh(new THREE.IcosahedronGeometry(0.30, 0), '#fffbeb', bedX + 0.78, 0.86, bedZ, false);
  pillow.scale.set(0.88, 0.46, 1.58);
  pillow.rotation.y = 0.15;
  const blanket   = createLowPolyMesh(createOrganicBoxGeo(1.44, 0.26, 1.22, seed + 33, 0.09, 0.95, 2), '#c2410c', bedX - 0.42, 0.87, bedZ, false);
  const blanketFold = createLowPolyMesh(createOrganicBoxGeo(0.28, 0.24, 1.24, seed + 273, 0.08, 0.96, 1), '#ea580c', bedX + 0.26, 0.88, bedZ, false);
  staticGrp.add(bedFrame, headBoard, headCap, footBoard, mattress, pillow, blanket, blanketFold);

  // 병상 옆 비정형 둥근 간병 의자(Stool) + 바구니
  const stoolX = 1.65, stoolZ = 0.05;
  const stoolTop = createLowPolyMesh(new THREE.CylinderGeometry(0.36, 0.33, 0.10, 7), '#8a4f1e', stoolX, 0.52, stoolZ, false);
  for (let sl = 0; sl < 3; sl++) {
    const a = (sl / 3) * Math.PI * 2 + 0.3;
    const sLeg = createLowPolyMesh(new THREE.CylinderGeometry(0.045, 0.055, 0.50, 5), '#5c2d0c', stoolX + Math.cos(a) * 0.20, 0.25, stoolZ + Math.sin(a) * 0.20, false);
    sLeg.rotation.z = -Math.cos(a) * 0.14;
    sLeg.rotation.x =  Math.sin(a) * 0.14;
    staticGrp.add(sLeg);
  }
  const bedSideBasket = createLowPolyMesh(new THREE.CylinderGeometry(0.28, 0.21, 0.32, 7), '#b45309', 2.85, 0.34, 0.18, false);
  const bedSideHerb = createLowPolyMesh(new THREE.DodecahedronGeometry(0.20, 0), '#65a30d', 2.85, 0.54, 0.18, false);
  bedSideHerb.scale.set(1.1, 0.65, 1.1);
  staticGrp.add(stoolTop, bedSideBasket, bedSideHerb);

  // [실내 가구 2] 비정형 소프트 로우폴리 간호용 나무 탁자 · 물병 · 붕대 꾸러미 · 등불 (lx = -2.35, lz = -1.75)
  const tblX = -2.35, tblZ = -1.75;
  const tblTop = createLowPolyMesh(createOrganicBoxGeo(1.62, 0.15, 0.98, seed + 35, 0.08, 0.95, 2), '#854d0e', tblX, 0.95, tblZ, true);
  [[-0.65, -0.35], [0.65, -0.35], [-0.65, 0.35], [0.65, 0.35]].forEach(([lx, lz]) => {
    staticGrp.add(createLowPolyMesh(new THREE.CylinderGeometry(0.06, 0.075, 0.92, 6), '#5c2d0c', tblX + lx, 0.46, tblZ + lz, false));
  });
  const tblStretch = createLowPolyMesh(createOrganicBoxGeo(1.32, 0.07, 0.10, seed + 275, 0.06, 0.96, 1), '#6b3818', tblX, 0.34, tblZ, false);
  const jug = createBuildingAmphoraProp(0.62, '#c26533', '#8f471e');
  jug.position.set(tblX - 0.42, 1.02, tblZ - 0.06);
  const linenRoll = createLowPolyMesh(new THREE.CylinderGeometry(0.11, 0.11, 0.38, 7), '#f8f5ee', tblX + 0.02, 1.12, tblZ + 0.14, false);
  linenRoll.rotation.z = Math.PI * 0.48;
  linenRoll.rotation.y = 0.25;
  const herbBowl = createLowPolyMesh(new THREE.CylinderGeometry(0.20, 0.13, 0.14, 7), '#9a4f25', tblX + 0.04, 1.09, tblZ - 0.20, false);
  const herbMound = createLowPolyMesh(new THREE.DodecahedronGeometry(0.14, 0), '#65a30d', tblX + 0.04, 1.18, tblZ - 0.20, false);
  herbMound.scale.set(1.1, 0.65, 1.1);
  const lampBase = createLowPolyMesh(new THREE.DodecahedronGeometry(0.18, 0), '#d97706', tblX + 0.46, 1.08, tblZ + 0.05, false);
  lampBase.scale.set(1.2, 0.58, 1.0);
  const lampFlame = createLowPolyMesh(new THREE.OctahedronGeometry(0.14, 0), '#fde047', tblX + 0.46, 1.28, tblZ + 0.05, false);
  lampFlame.userData._emissiveGlow = true;
  staticGrp.add(tblTop, tblStretch, jug, linenRoll, herbBowl, herbMound, lampBase, lampFlame);

  mergeStaticLowPolyGroupToVertexColor(staticGrp, { registerWall: true, castShadow: true });
  innGrp.add(staticGrp);

  // 지붕 + 옥상 파라펫 난간 + 건조 돗자리를 하나의 별도 정점색 병합 메시로 묶어 wallMeshes 등록 → 실내 진입 시 자동 반투명 투과!
  const roofGrp = new THREE.Group();
  const roofSlab = createLowPolyMesh(createOrganicBoxGeo(w + 0.26, 0.32, d + 0.26, seed + 40, 0.03, 0.99, 1), trimCol, 0, h + 0.12, 0, true);
  const rpH = 0.64, rpT = 0.36;
  const rParaN = createLowPolyMesh(createOrganicBoxGeo(w + 0.10, rpH, rpT, seed + 41, 0.06, 0.94, 2), wallCol, 0, h + rpH * 0.5, -d * 0.5 + rpT * 0.5, true);
  const rParaS = createLowPolyMesh(createOrganicBoxGeo(w + 0.10, rpH, rpT, seed + 42, 0.06, 0.94, 2), wallCol, 0, h + rpH * 0.5,  d * 0.5 - rpT * 0.5, true);
  const rParaW = createLowPolyMesh(createOrganicBoxGeo(rpT, rpH, d, seed + 43, 0.06, 0.94, 2), wallCol, -w * 0.5 + rpT * 0.5, h + rpH * 0.5, 0, true);
  const rParaE = createLowPolyMesh(createOrganicBoxGeo(rpT, rpH, d, seed + 44, 0.06, 0.94, 2), wallCol,  w * 0.5 - rpT * 0.5, h + rpH * 0.5, 0, true);
  const rMat = createLowPolyMesh(createOrganicBoxGeo(2.3, 0.08, 1.7, seed + 45, 0.05, 0.98, 1), linenSpec.trim, -1.6, h + 0.30, -0.4, false);
  const rChimney = createLowPolyMesh(new THREE.CylinderGeometry(0.26, 0.35, 0.78, 7), trimCol, 2.5, h + 0.60, -1.9, false);
  roofGrp.add(roofSlab, rParaN, rParaS, rParaW, rParaE, rMat, rChimney);
  mergeStaticLowPolyGroupToVertexColor(roofGrp, { registerWall: true, castShadow: true });
  innGrp.add(roofGrp);

  // [실내 다친 이웃 NPC] 병상 위에 머리(베개 +X)와 발(담요 -X), 얼굴(하늘 +Y)이 정확히 중앙에 눕도록 배치 (+ 머리 붕대)
  const patientWrap = new THREE.Group();
  const patient = createLowPolyPersonMesh('villager_m', 37);
  patient.scale.set(0.84, 0.84, 0.84);
  patient.rotation.x = -Math.PI * 0.5;
  patient.position.set(0, 0.12, 0.90);
  if (patient.userData && patient.userData.head) {
    const bandage = createLowPolyMesh(new THREE.CylinderGeometry(0.28, 0.28, 0.14, 8), '#f8fafc', 0, 0.10, 0, false);
    patient.userData.head.add(bandage);
  }
  patientWrap.rotation.y = -Math.PI * 0.5;
  patientWrap.add(patient);
  patientWrap.position.set(bedX, 0.78, bedZ);
  innGrp.add(patientWrap);

  innGrp.position.set(cx, by, cz);
  worldGroup.add(innGrp);

  // 충돌 벽체: 남쪽 정면 출입구(x ∈ [cx - 1.5, cx + 1.5])만 완벽 개방
  colliders.push(
    { minX: cx - w * 0.5 - 0.15, maxX: cx + w * 0.5 + 0.15, minZ: cz - d * 0.5 - 0.15, maxZ: cz - d * 0.5 + t + 0.12 }, // 북벽
    { minX: cx - w * 0.5 - 0.15, maxX: cx - w * 0.5 + t + 0.12, minZ: cz - d * 0.5 - 0.15, maxZ: cz + d * 0.5 + 0.15 }, // 서벽
    { minX: cx + w * 0.5 - t - 0.12, maxX: cx + w * 0.5 + 0.15, minZ: cz - d * 0.5 - 0.15, maxZ: cz + d * 0.5 + 0.15 }, // 동벽
    { minX: cx - w * 0.5 - 0.15, maxX: cx - doorHalfW + 0.05, minZ: cz + d * 0.5 - t - 0.12, maxZ: cz + d * 0.5 + 0.15 }, // 남좌벽
    { minX: cx + doorHalfW - 0.05, maxX: cx + w * 0.5 + 0.15, minZ: cz + d * 0.5 - t - 0.12, maxZ: cz + d * 0.5 + 0.15 }  // 남우벽
  );

  // 지붕 플랫폼: passUnderY 지정으로 실내 바닥에서 걸어 들어갈 수 있음!
  platforms.push({
    minX: cx - w * 0.5,
    maxX: cx + w * 0.5,
    minZ: cz - d * 0.5,
    maxZ: cz + d * 0.5,
    topY: by + h + 0.25,
    passUnderY: by + h - 0.65
  });

  if (Array.isArray(window.miracleBuildingBounds)) {
    window.miracleBuildingBounds.push({
      minX: cx - w * 0.5 - 1.2,
      maxX: cx + w * 0.5 + 1.2,
      minZ: cz - d * 0.5 - 1.2,
      maxZ: cz + d * 0.5 + 2.4,
      cx, cz
    });
  }

  return {
    group: innGrp,
    bedWorldPos: new THREE.Vector3(cx + bedX - 0.6, by, cz + bedZ + 0.9),
    doorWorldPos: new THREE.Vector3(cx, by, cz + d * 0.5 + 1.4),
    patientWrap
  };
}

// 2층 다락방 내부에 직접 들어가 수건을 배달할 수 있는 [마가의 다락방] 개방형 2층 가옥
function addWalkableUpperRoomHouse(cx, cz) {
  const by = getBaseGroundHeight(cx, cz);
  const w = 9.4, h1 = 3.85, d = 7.4;
  const seed = Math.abs(Math.round(cx * 23 + cz * 19)) + 141;
  const wallCol = '#e6be8a';
  const trimCol = '#c89b66';
  const brickCol1 = '#d5a870';
  const brickCol2 = '#c09058';
  const woodCol = '#6b4226';
  const linenSpec = MIRACLE_LINEN_SHADES[2];

  const grp = new THREE.Group();
  const staticGrp = new THREE.Group();

  // 1) 1층 기초석 · 본체 · 상단 띠장 · 비정형 돌출 벽돌 · 장식 아치 입구 · 아마포 차양 · 창문/화분 · 항아리
  const foundationPlinth = createLowPolyMesh(new THREE.BoxGeometry(w + 0.16, 1.4, d + 0.16), trimCol, 0, -0.68, 0, false);
  const baseBody = createLowPolyMesh(createOrganicBoxGeo(w, h1, d, seed + 1, 0.05, 0.98, 2), wallCol, 0, h1 * 0.5, 0, true);
  const belt1F = createLowPolyMesh(createOrganicBoxGeo(w + 0.34, 0.24, d + 0.34, seed + 10, 0.04, 1.0, 2), trimCol, 0, h1 - 0.08, 0, true);
  const floor2Slab = createLowPolyMesh(createOrganicBoxGeo(w + 0.24, 0.26, d + 0.24, seed + 2, 0.03, 0.99, 1), trimCol, 0, h1 + 0.04, 0, true);
  const arch1F = createOrganicArchedEntranceGroup(1.85, 2.45, trimCol, '#23170f', woodCol, seed + 3);
  arch1F.position.set(-1.15, 0, d * 0.5 + 0.08);
  const stepStone1F = createLowPolyMesh(createOrganicBoxGeo(2.25, 0.22, 0.76, seed + 11, 0.07, 0.96, 1), '#b89a70', -1.15, 0.11, d * 0.5 + 0.44, true);
  const awning1F = createOrganicLinenAwningGroup(3.7, 1.70, linenSpec, woodCol, seed + 4, 0.20, true, 2.55);
  awning1F.position.set(-1.15, 2.95, d * 0.5 + 0.86);
  staticGrp.add(foundationPlinth, baseBody, belt1F, floor2Slab, arch1F, stepStone1F, awning1F);

  addScatteredIrregularBricksToWall(staticGrp, w * 0.96, h1, d * 0.96, 0, brickCol1, brickCol2, seed + 15, 0, 0);

  // 1층 정면 우측 따뜻한 빛 비치는 나무 덧문 창문 + 테라코타 허브 화분
  const win1X = w * 0.27, win1Y = h1 * 0.56;
  const warmPane1 = createLowPolyMesh(new THREE.BoxGeometry(0.92, 0.98, 0.22), '#f59e0b', win1X, win1Y, d * 0.5 + 0.06, false);
  warmPane1.userData._emissiveGlow = true;
  const shut1L = createLowPolyMesh(createOrganicBoxGeo(0.26, 1.00, 0.12, seed + 18, 0.06, 0.98, 1), '#7c4318', win1X - 0.60, win1Y, d * 0.5 + 0.14, false);
  const shut1R = createLowPolyMesh(createOrganicBoxGeo(0.26, 1.00, 0.12, seed + 19, 0.06, 0.98, 1), '#7c4318', win1X + 0.60, win1Y, d * 0.5 + 0.14, false);
  const win1Top = createLowPolyMesh(createOrganicBoxGeo(1.42, 0.18, 0.28, seed + 20, 0.08, 0.94, 1), '#b8844c', win1X, win1Y + 0.56, d * 0.5 + 0.10, false);
  const planter1 = createLowPolyMesh(createOrganicBoxGeo(1.06, 0.22, 0.34, seed + 21, 0.08, 0.90, 1), '#b86232', win1X, win1Y - 0.60, d * 0.5 + 0.20, false);
  const herb1a = createLowPolyMesh(new THREE.DodecahedronGeometry(0.16, 0), '#65a30d', win1X - 0.22, win1Y - 0.42, d * 0.5 + 0.22, false);
  const herb1b = createLowPolyMesh(new THREE.DodecahedronGeometry(0.15, 0), '#84cc16', win1X + 0.20, win1Y - 0.44, d * 0.5 + 0.24, false);
  staticGrp.add(warmPane1, shut1L, shut1R, win1Top, planter1, herb1a, herb1b);

  // 1층 서쪽 측면 창문 & 아마포 차양 + 1층 전면 토기 항아리/화분 + 노출 서까래
  const sideWin1F = createOrganicWindowGroup(0.95, 1.08, brickCol1, trimCol, '#23170f', seed + 24);
  sideWin1F.rotation.y = -Math.PI * 0.5;
  sideWin1F.position.set(-w * 0.5 - 0.06, h1 * 0.56, 0.35);
  const sideAwning1F = createOrganicLinenAwningGroup(2.9, 1.55, MIRACLE_LINEN_SHADES[0], woodCol, seed + 26, 0.20, true, 2.38);
  sideAwning1F.rotation.y = -Math.PI * 0.5;
  sideAwning1F.position.set(-w * 0.5 - 0.72, h1 * 0.72, 0.35);
  const amp1F = createBuildingAmphoraProp(0.95, '#c26533', '#8f471e');
  amp1F.position.set(-w * 0.38, 0, d * 0.5 + 0.58);
  const pot1a = createJudeanClayPotMesh(0.92, '#b86232');
  pot1a.position.set(0.32, 0, d * 0.5 + 0.56);
  const pot1b = createJudeanClayPotMesh(0.74, '#9e4f24');
  pot1b.position.set(0.98, 0, d * 0.5 + 0.68);
  staticGrp.add(sideWin1F, sideAwning1F, amp1F, pot1a, pot1b);

  for (let b = 0; b < 4; b++) {
    const bx = -w * 0.36 + (b / 3) * (w * 0.72);
    const raf1 = createOrganicRoofBeamMesh(0.66, woodCol, seed + 30 + b);
    raf1.rotation.x = Math.PI * 0.5 + 0.05;
    raf1.position.set(bx, h1 - 0.30, d * 0.5 + 0.14);
    staticGrp.add(raf1);
  }

  // 2) 동쪽(+X) 외부 돌계단 (1층 → 2층 테라스 직결)
  const stairW = 2.05;
  const stairLocalX = w * 0.5 + stairW * 0.5 - 0.08;
  const railLocalX = stairLocalX + stairW * 0.5 + 0.08;
  const stepCount = 9;
  const stairSpanD = d * 0.88;
  const stepDepth = stairSpanD / stepCount;
  for (let s = 1; s <= stepCount; s++) {
    const sh = (h1 / stepCount) * s;
    const sz = (d * 0.5) - (s - 0.5) * stepDepth;
    const stepMesh = createLowPolyMesh(createOrganicBoxGeo(stairW, sh, stepDepth + 0.06, seed + 50 + s, 0.03, 0.98, 1), trimCol, stairLocalX, sh * 0.5, sz, true);
    const railTop = sh + 0.46;
    const railMesh = createLowPolyMesh(createOrganicBoxGeo(0.24, railTop, stepDepth + 0.06, seed + 70 + s, 0.03, 0.98, 1), trimCol, railLocalX, railTop * 0.5, sz, false);
    staticGrp.add(stepMesh, railMesh);
    const padR = Math.max(stairW, stepDepth) * 0.58;
    platforms.push({
      minX: cx + stairLocalX - padR,
      maxX: cx + stairLocalX + padR,
      minZ: cz + sz - padR,
      maxZ: cz + sz + padR,
      topY: by + sh
    });
  }
  // 2층 계단 최상단 착지 패드
  platforms.push({
    minX: cx + w * 0.5 - 0.6,
    maxX: cx + w * 0.5 + stairW + 0.2,
    minZ: cz - d * 0.5 - 0.2,
    maxZ: cz - d * 0.5 + 2.4,
    topY: by + h1 + 0.16
  });

  // 3) 2층 개방형 다락방 실내 (서쪽·중앙에 배치, 동쪽 테라스 쪽으로 2.7m 넓은 아치 출입구 개방!)
  const y2 = h1 + 0.16;
  const rCx = -1.25;
  const rW = 6.5, rH = 3.35, rD = 6.2, rT = 0.52;
  const doorHalfZ = 1.35;
  const sideZ = (rD * 0.5) - doorHalfZ;

  // 2층 다락방 북/남/서 외벽 + 동쪽 출입구 좌우벽 & 상단 인방 + 비정형 돌출 벽돌 & 2층 창문 · 노출 서까래
  const w2N = createLowPolyMesh(createOrganicBoxGeo(rW, rH, rT, seed + 90, 0.04, 0.98, 1), '#edd3ae', rCx, y2 + rH * 0.5, -rD * 0.5 + rT * 0.5, true);
  const w2S = createLowPolyMesh(createOrganicBoxGeo(rW, rH, rT, seed + 91, 0.04, 0.98, 1), '#edd3ae', rCx, y2 + rH * 0.5,  rD * 0.5 - rT * 0.5, true);
  const w2W = createLowPolyMesh(createOrganicBoxGeo(rT, rH, rD, seed + 92, 0.04, 0.98, 1), '#edd3ae', rCx - rW * 0.5 + rT * 0.5, y2 + rH * 0.5, 0, true);
  const w2EL = createLowPolyMesh(createOrganicBoxGeo(rT, rH, sideZ, seed + 93, 0.04, 0.98, 1), '#edd3ae', rCx + rW * 0.5 - rT * 0.5, y2 + rH * 0.5, -(doorHalfZ + sideZ * 0.5), true);
  const w2ER = createLowPolyMesh(createOrganicBoxGeo(rT, rH, sideZ, seed + 94, 0.04, 0.98, 1), '#edd3ae', rCx + rW * 0.5 - rT * 0.5, y2 + rH * 0.5,  (doorHalfZ + sideZ * 0.5), true);
  const w2ETop = createLowPolyMesh(createOrganicBoxGeo(rT + 0.14, rH - 2.45, doorHalfZ * 2 + 0.24, seed + 95, 0.04, 0.98, 1), trimCol, rCx + rW * 0.5 - rT * 0.5, y2 + 2.45 + (rH - 2.45) * 0.5, 0, true);
  const w2JambN = createLowPolyMesh(createOrganicBoxGeo(rT + 0.18, 2.55, 0.28, seed + 96, 0.05, 0.96, 1), trimCol, rCx + rW * 0.5 - rT * 0.45, y2 + 1.28, -doorHalfZ, false);
  const w2JambS = createLowPolyMesh(createOrganicBoxGeo(rT + 0.18, 2.55, 0.28, seed + 97, 0.05, 0.96, 1), trimCol, rCx + rW * 0.5 - rT * 0.45, y2 + 1.28,  doorHalfZ, false);
  staticGrp.add(w2N, w2S, w2W, w2EL, w2ER, w2ETop, w2JambN, w2JambS);

  // 2층 다락방 외부 비정형 창문(남/북/서) & 서까래 & 돌출 벽돌
  const win2S = createOrganicWindowGroup(0.84, 0.96, brickCol1, trimCol, '#23170f', seed + 131);
  win2S.position.set(rCx + 0.4, y2 + 1.55, rD * 0.5 + 0.05);
  const win2N = createOrganicWindowGroup(0.80, 0.92, brickCol1, trimCol, '#23170f', seed + 132);
  win2N.rotation.y = Math.PI;
  win2N.position.set(rCx - 0.3, y2 + 1.55, -rD * 0.5 - 0.05);
  const win2W = createOrganicWindowGroup(0.82, 0.94, brickCol1, trimCol, '#23170f', seed + 133);
  win2W.rotation.y = -Math.PI * 0.5;
  win2W.position.set(rCx - rW * 0.5 - 0.05, y2 + 1.55, 0.2);
  staticGrp.add(win2S, win2N, win2W);

  [
    [rCx - 1.8, y2 + 0.95, rD * 0.5 + 0.02, 0.72, 0.30, 0.15],
    [rCx + 1.9, y2 + 2.45, rD * 0.5 + 0.02, 0.68, 0.28, 0.15],
    [rCx + 1.4, y2 + 1.15, -rD * 0.5 - 0.02, 0.74, 0.30, 0.15],
    [rCx - rW * 0.5 - 0.02, y2 + 2.2, -1.6, 0.15, 0.30, 0.72]
  ].forEach((b, idx) => {
    staticGrp.add(createLowPolyMesh(
      createOrganicBoxGeo(b[3], b[4], b[5], seed + 145 + idx, 0.08, 0.94, 1),
      idx % 2 === 0 ? brickCol1 : brickCol2,
      b[0], b[1], b[2], false
    ));
  });

  for (let b = 0; b < 4; b++) {
    const bx = rCx - rW * 0.34 + (b / 3) * (rW * 0.68);
    const bBeam = createOrganicRoofBeamMesh(0.64, woodCol, seed + 150 + b);
    bBeam.rotation.x = Math.PI * 0.5 - 0.05;
    bBeam.position.set(bx, y2 + rH - 0.36, -rD * 0.5 - 0.12);
    staticGrp.add(bBeam);
  }
  for (let b = 0; b < 3; b++) {
    const bz = -rD * 0.28 + (b / 2) * (rD * 0.56);
    const sBeam = createOrganicRoofBeamMesh(0.62, woodCol, seed + 158 + b);
    sBeam.rotation.z = Math.PI * 0.5;
    sBeam.position.set(rCx - rW * 0.5 - 0.12, y2 + rH - 0.36, bz);
    staticGrp.add(sBeam);
  }

  // 2층 실내 러그 · 낮은 상 · 발 씻기는 청동 물대야 · 물동이 · 촛대
  const rug2 = createLowPolyMesh(new THREE.BoxGeometry(4.2, 0.05, 3.8), '#1d4ed8', rCx - 0.1, y2 + 0.03, 0, false);
  const rug2In = createLowPolyMesh(new THREE.BoxGeometry(3.5, 0.06, 3.1), '#93c5fd', rCx - 0.1, y2 + 0.035, 0, false);
  const lowTable = createLowPolyMesh(createOrganicBoxGeo(1.15, 0.44, 3.2, seed + 100, 0.04, 0.98, 1), '#7c4722', rCx - 1.65, y2 + 0.24, 0, true);
  const breadLoaf = createLowPolyMesh(new THREE.DodecahedronGeometry(0.24, 0), '#d97706', rCx - 1.65, y2 + 0.56, -0.45, false);
  breadLoaf.scale.set(1.2, 0.55, 1.5);
  const cup = createLowPolyMesh(new THREE.CylinderGeometry(0.10, 0.07, 0.26, 6), '#facc15', rCx - 1.65, y2 + 0.58, 0.35, false);

  // 발 씻기는 청동 물대야(수건 놓는 자리 중심)
  const basinX = rCx + 0.45, basinZ = 0;
  const basinRim = createLowPolyMesh(new THREE.CylinderGeometry(0.68, 0.48, 0.32, 8), '#b45309', basinX, y2 + 0.18, basinZ, true);
  const basinWater = createLowPolyMesh(new THREE.CylinderGeometry(0.58, 0.54, 0.06, 8), '#38bdf8', basinX, y2 + 0.32, basinZ, false);
  const pitcher = createBuildingAmphoraProp(0.70, '#c26533', '#8f471e');
  pitcher.position.set(basinX - 0.15, y2 + 0.02, basinZ - 0.95);
  staticGrp.add(rug2, rug2In, lowTable, breadLoaf, cup, basinRim, basinWater, pitcher);

  // 2층 테라스 안전 난간 + 걸친 태피스트리 러그 + 테라스 벤치 & 토기 (계단 진입 북동쪽 끝부분만 개방)
  const railS = createLowPolyMesh(createOrganicBoxGeo(w, 0.68, 0.30, seed + 110, 0.05, 0.96, 2), wallCol, 0, y2 + 0.34, d * 0.5 - 0.15, true);
  const railEF = createLowPolyMesh(createOrganicBoxGeo(0.30, 0.68, d * 0.56, seed + 111, 0.05, 0.96, 2), wallCol, w * 0.5 - 0.15, y2 + 0.34, d * 0.22, true);
  const rugHang = createLowPolyMesh(createOrganicBoxGeo(1.48, 0.84, 0.14, seed + 112, 0.08, 0.96, 2), '#b91c1c', w * 0.28, y2 + 0.24, d * 0.5 + 0.05, false);
  const rugBand = createLowPolyMesh(new THREE.BoxGeometry(1.50, 0.16, 0.17), '#eab308', w * 0.28, y2 + 0.04, d * 0.5 + 0.06, false);
  const tBench = createOrganicTerraceBench(woodCol, seed + 114);
  tBench.rotation.y = Math.PI * 0.5;
  tBench.position.set(w * 0.5 - 0.85, y2, d * 0.22);
  const tPot = createJudeanClayPotMesh(0.84, '#b86232');
  tPot.position.set(w * 0.34, y2, d * 0.38);
  staticGrp.add(railS, railEF, rugHang, rugBand, tBench, tPot);

  mergeStaticLowPolyGroupToVertexColor(staticGrp, { registerWall: true, castShadow: true });
  grp.add(staticGrp);

  // 2층 다락방 지붕 + 상부 파라펫 + 굴뚝을 하나의 병합 메시로 wallMeshes 등록 (2층 실내 진입 시 자동 반투명 처리!)
  const roof2Grp = new THREE.Group();
  const roof2Slab = createLowPolyMesh(createOrganicBoxGeo(rW + 0.24, 0.26, rD + 0.24, seed + 120, 0.03, 0.99, 1), trimCol, rCx, y2 + rH + 0.10, 0, true);
  const upH = 0.40, upT = 0.28;
  const upN = createLowPolyMesh(createOrganicBoxGeo(rW + 0.08, upH, upT, seed + 121, 0.05, 0.95, 1), trimCol, rCx, y2 + rH + upH * 0.45, -rD * 0.5 + upT * 0.5, true);
  const upS = createLowPolyMesh(createOrganicBoxGeo(rW + 0.08, upH, upT, seed + 122, 0.05, 0.95, 1), trimCol, rCx, y2 + rH + upH * 0.45,  rD * 0.5 - upT * 0.5, true);
  const upW = createLowPolyMesh(createOrganicBoxGeo(upT, upH, rD, seed + 123, 0.05, 0.95, 1), trimCol, rCx - rW * 0.5 + upT * 0.5, y2 + rH + upH * 0.45, 0, true);
  const upE = createLowPolyMesh(createOrganicBoxGeo(upT, upH, rD, seed + 124, 0.05, 0.95, 1), trimCol, rCx + rW * 0.5 - upT * 0.5, y2 + rH + upH * 0.45, 0, true);
  const upChimney = createLowPolyMesh(new THREE.CylinderGeometry(0.24, 0.34, 0.78, 7), trimCol, rCx - 1.6, y2 + rH + 0.46, -1.4, false);
  roof2Grp.add(roof2Slab, upN, upS, upW, upE, upChimney);
  mergeStaticLowPolyGroupToVertexColor(roof2Grp, { registerWall: true, castShadow: true });
  grp.add(roof2Grp);

  // 2층 실내 대기 제자 NPC
  const disc = createLowPolyPersonMesh('disciple', 11);
  disc.position.set(rCx - 1.35, y2, 1.95);
  disc.rotation.y = Math.PI * 0.45;
  grp.add(disc);

  grp.position.set(cx, by, cz);
  worldGroup.add(grp);

  // 1층 본체 지붕 플랫폼 (= 2층 다락방 & 테라스 바닥)
  platforms.push({
    minX: cx - w * 0.5 - 0.2,
    maxX: cx + w * 0.5 + 0.2,
    minZ: cz - d * 0.5 - 0.2,
    maxZ: cz + d * 0.5 + 0.2,
    topY: by + y2
  });

  // 2층 다락방 벽체 (passUnderY 지정으로 1층 이동은 무관, 2층에서만 방 벽으로 작동!)
  const wPass = by + y2 - 0.35;
  const wTop = by + y2 + rH + 0.5;
  const rMinX = cx + rCx - rW * 0.5;
  const rMaxX = cx + rCx + rW * 0.5;
  const rMinZ = cz - rD * 0.5;
  const rMaxZ = cz + rD * 0.5;
  platforms.push(
    { minX: rMinX, maxX: rMaxX, minZ: rMinZ - 0.1, maxZ: rMinZ + rT, topY: wTop, wallOnly: true, passUnderY: wPass }, // 2F 북벽
    { minX: rMinX, maxX: rMaxX, minZ: rMaxZ - rT, maxZ: rMaxZ + 0.1, topY: wTop, wallOnly: true, passUnderY: wPass }, // 2F 남벽
    { minX: rMinX - 0.1, maxX: rMinX + rT, minZ: rMinZ, maxZ: rMaxZ, topY: wTop, wallOnly: true, passUnderY: wPass }, // 2F 서벽
    { minX: rMaxX - rT, maxX: rMaxX + 0.1, minZ: rMinZ, maxZ: cz - doorHalfZ, topY: wTop, wallOnly: true, passUnderY: wPass }, // 2F 동북벽
    { minX: rMaxX - rT, maxX: rMaxX + 0.1, minZ: cz + doorHalfZ, maxZ: rMaxZ, topY: wTop, wallOnly: true, passUnderY: wPass }  // 2F 동남벽
  );

  // 2층 다락방 지붕 (2층 실내에서는 머리 위로 통과 가능!)
  platforms.push({
    minX: rMinX,
    maxX: rMaxX,
    minZ: rMinZ,
    maxZ: rMaxZ,
    topY: by + y2 + rH + 0.22,
    passUnderY: by + y2 + rH - 0.65
  });

  if (Array.isArray(window.miracleBuildingBounds)) {
    window.miracleBuildingBounds.push({
      minX: cx - w * 0.5 - 1.4,
      maxX: cx + w * 0.5 + stairW + 1.4,
      minZ: cz - d * 0.5 - 1.4,
      maxZ: cz + d * 0.5 + 2.2,
      cx, cz
    });
  }

  return {
    group: grp,
    upperRoomCenter: new THREE.Vector3(cx + basinX, by + y2, cz + basinZ),
    stairBasePos: new THREE.Vector3(cx + stairLocalX, by, cz + d * 0.5 + 1.2)
  };
}

// [가버나움 중풍병자 집] 기존 외관을 그대로 유지하되, 정면 아치 문이 활짝 열려 있어
// 안쪽에서 말씀을 가르치시는 예수님과 빼곡히 둘러앉은 사람들을 바깥에서 볼 수 있는 전용 가옥!
function addCapernaumParalyticHouse(cx, cz) {
  const by = getBaseGroundHeight(cx, cz);
  const w = 8.8, h = 4.0, d = 7.0, t = 0.56;
  const seed = Math.abs(Math.round(cx * 37 + cz * 53)) + 19;
  const wallCol = '#ead7b7';
  const trimCol = '#c89654';
  const brickCol1 = '#d8b684';
  const brickCol2 = '#c59960';
  const woodCol = '#6b4226';
  const linenSpec = MIRACLE_LINEN_SHADES[0];
  const stairSide = 1;
  const doorX = -w * 0.12;
  const doorHalfW = 1.12;
  const doorH = 2.88;

  const houseGrp = new THREE.Group();
  const staticGrp = new THREE.Group();

  // 기초석 & 실내 바닥 + 따뜻한 실내 카펫
  const foundationPlinth = createLowPolyMesh(new THREE.BoxGeometry(w + 0.14, 1.4, d + 0.14), trimCol, 0, -0.68, 0, false);
  const interiorFloor = createLowPolyMesh(createOrganicBoxGeo(w - 0.35, 0.18, d - 0.35, seed + 1, 0.02, 0.99, 1), '#d6c19e', 0, 0.08, 0, false);
  const interiorRug = createLowPolyMesh(new THREE.BoxGeometry(4.4, 0.05, 3.2), '#9a3412', doorX + 0.25, 0.19, -0.45, false);
  const interiorRugIn = createLowPolyMesh(new THREE.BoxGeometry(3.6, 0.06, 2.5), '#d97706', doorX + 0.25, 0.195, -0.45, false);
  staticGrp.add(foundationPlinth, interiorFloor, interiorRug, interiorRugIn);

  // 북/서/동 3면 외벽 (내부가 비어 있어 열린 문 너머로 실내가 보임!)
  const northWall = createLowPolyMesh(createOrganicBoxGeo(w, h, t, seed + 2, 0.04, 0.98, 2), wallCol, 0, h * 0.5, -d * 0.5 + t * 0.5, true);
  const westWall  = createLowPolyMesh(createOrganicBoxGeo(t, h, d, seed + 3, 0.04, 0.98, 2), wallCol, -w * 0.5 + t * 0.5, h * 0.5, 0, true);
  const eastWall  = createLowPolyMesh(createOrganicBoxGeo(t, h, d, seed + 4, 0.04, 0.98, 2), wallCol,  w * 0.5 - t * 0.5, h * 0.5, 0, true);
  staticGrp.add(northWall, westWall, eastWall);

  // 남(+Z) 정면벽: 아치 출입구(doorX ± doorHalfW)만 완벽히 개방!
  const leftEdge = -w * 0.5;
  const rightEdge = w * 0.5;
  const doorMinX = doorX - doorHalfW;
  const doorMaxX = doorX + doorHalfW;
  const southLW = doorMinX - leftEdge;
  const southRW = rightEdge - doorMaxX;
  const southL = createLowPolyMesh(createOrganicBoxGeo(southLW, h, t, seed + 5, 0.04, 0.98, 2), wallCol, leftEdge + southLW * 0.5, h * 0.5, d * 0.5 - t * 0.5, true);
  const southR = createLowPolyMesh(createOrganicBoxGeo(southRW, h, t, seed + 6, 0.04, 0.98, 2), wallCol, doorMaxX + southRW * 0.5, h * 0.5, d * 0.5 - t * 0.5, true);
  const hdrH = h - doorH;
  const southTop = createLowPolyMesh(createOrganicBoxGeo(doorHalfW * 2 + 0.30, hdrH, t + 0.06, seed + 7, 0.04, 0.98, 1), wallCol, doorX, doorH + hdrH * 0.5, d * 0.5 - t * 0.5, true);
  staticGrp.add(southL, southR, southTop);

  // 아치형 출입구 석조 틀 + 안쪽으로 활짝 열린 나무 문짝!
  const jambL = createLowPolyMesh(createOrganicBoxGeo(0.28, doorH + 0.06, t + 0.24, seed + 8, 0.06, 0.96, 1), trimCol, doorMinX, doorH * 0.5, d * 0.5 - t * 0.38, true);
  const jambR = createLowPolyMesh(createOrganicBoxGeo(0.28, doorH + 0.06, t + 0.24, seed + 9, 0.06, 0.96, 1), trimCol, doorMaxX, doorH * 0.5, d * 0.5 - t * 0.38, true);
  staticGrp.add(jambL, jambR);
  for (let i = 0; i < 5; i++) {
    const tA = i / 4;
    const ang = Math.PI * (0.12 + tA * 0.76);
    const ax = doorX + Math.cos(ang) * (doorHalfW + 0.02);
    const ay = doorH - 0.18 + Math.sin(ang) * 0.44;
    const archStone = createLowPolyMesh(createOrganicBoxGeo(0.50, 0.24, 0.34, seed + 12 + i, 0.08, 0.94, 1), trimCol, ax, ay, d * 0.5 + 0.06, false);
    archStone.rotation.z = ang - Math.PI * 0.5;
    staticGrp.add(archStone);
  }
  // 안쪽 왼쪽으로 활짝 열린 나무 문짝 (열린 문 느낌을 확실하게 전달)
  const openDoorLeaf = createLowPolyMesh(createOrganicBoxGeo(1.02, doorH - 0.14, 0.14, seed + 18, 0.03, 0.98, 1), woodCol, 0.52, doorH * 0.48, 0, true);
  const doorPivot = new THREE.Group();
  doorPivot.position.set(doorMinX + 0.14, 0.08, d * 0.5 - t + 0.08);
  doorPivot.rotation.y = Math.PI * 0.62;
  doorPivot.add(openDoorLeaf);
  staticGrp.add(doorPivot);

  // 실내 따뜻한 벽걸이 등불(내부 예수님과 사람들이 잘 보이도록 밝게 조명 연출)
  [[-1.8, -d * 0.5 + t + 0.28], [2.2, -d * 0.5 + t + 0.28]].forEach(([lx, lz]) => {
    const lampShelf = createLowPolyMesh(new THREE.BoxGeometry(0.45, 0.12, 0.34), '#78350f', lx, 2.05, lz, false);
    const lampBowl = createLowPolyMesh(new THREE.CylinderGeometry(0.16, 0.10, 0.12, 6), '#b45309', lx, 2.16, lz, false);
    const lampGlow = createLowPolyMesh(new THREE.OctahedronGeometry(0.18, 0), '#fde047', lx, 2.38, lz, false);
    lampGlow.userData._emissiveGlow = true;
    staticGrp.add(lampShelf, lampBowl, lampGlow);
  });

  // 지붕 슬래브 + 상단 띠장 + 옥상 파라펫 난간 (동쪽 계단 입구만 개방, 기존 가버나움 집과 동일!)
  const roofSlab = createLowPolyMesh(createOrganicBoxGeo(w - 0.24, 0.22, d - 0.24, seed + 20, 0.03, 1.0, 2), trimCol, 0, h + 0.04, 0, true);
  const beltCourse = createLowPolyMesh(createOrganicBoxGeo(w + 0.34, 0.24, d + 0.34, seed + 21, 0.04, 1.0, 2), trimCol, 0, h - 0.06, 0, true);
  const pH = 0.72, pT = 0.38;
  const paraBack = createLowPolyMesh(createOrganicBoxGeo(w + 0.10, pH, pT, seed + 22, 0.06, 0.94, 2), wallCol, 0, h + pH * 0.5, -d * 0.5 + pT * 0.5, true);
  const paraFront = createLowPolyMesh(createOrganicBoxGeo(w + 0.10, pH, pT, seed + 23, 0.06, 0.94, 2), wallCol, 0, h + pH * 0.5,  d * 0.5 - pT * 0.5, true);
  const paraLeft = createLowPolyMesh(createOrganicBoxGeo(pT, pH, d, seed + 24, 0.06, 0.94, 2), wallCol, -w * 0.5 + pT * 0.5, h + pH * 0.5, 0, true);
  const closedLen = d * 0.52;
  const paraRightPart = createLowPolyMesh(createOrganicBoxGeo(pT, pH, closedLen, seed + 25, 0.06, 0.94, 2), wallCol, w * 0.5 - pT * 0.5, h + pH * 0.5, d * 0.5 - closedLen * 0.5, true);
  staticGrp.add(roofSlab, beltCourse, paraBack, paraFront, paraLeft, paraRightPart);

  // 외벽 비정형 돌출 벽돌 (열린 정면 출입구 영역을 피해 배치)
  [
    [-w * 0.40, 1.15, d * 0.5 + 0.02, 0.70, 0.32, 0.15],
    [-w * 0.36, 3.25, d * 0.5 + 0.02, 0.66, 0.30, 0.15],
    [ w * 0.38, 1.05, d * 0.5 + 0.02, 0.72, 0.32, 0.15],
    [ w * 0.34, 3.30, d * 0.5 + 0.02, 0.64, 0.30, 0.15],
    [-w * 0.5 - 0.02, 1.30, -1.6, 0.15, 0.34, 0.78],
    [-w * 0.5 - 0.02, 3.05,  1.5, 0.15, 0.32, 0.74],
    [ w * 0.5 + 0.02, 1.40,  1.8, 0.15, 0.34, 0.78],
    [-2.0, 1.35, -d * 0.5 - 0.02, 0.80, 0.34, 0.15],
    [ 2.2, 2.85, -d * 0.5 - 0.02, 0.78, 0.32, 0.15]
  ].forEach((b, idx) => {
    staticGrp.add(createLowPolyMesh(
      createOrganicBoxGeo(b[3], b[4], b[5], seed + 30 + idx, 0.08, 0.94, 1),
      idx % 2 === 0 ? brickCol1 : brickCol2,
      b[0], b[1], b[2], false
    ));
  });

  // 기존 외관과 동일한 1층 정면 디딤돌, 우측 덧문 창문+화분, 측면 창문+차양, 노출 서까래, 토기 항아리들
  const stepStone = createLowPolyMesh(createOrganicBoxGeo(2.40, 0.20, 0.74, seed + 41, 0.07, 0.96, 1), '#b89a70', doorX, 0.10, d * 0.5 + 0.42, true);
  const doorAmphora = createBuildingAmphoraProp(0.92, '#c26533', '#8f471e');
  doorAmphora.position.set(doorX - 1.48, 0, d * 0.5 + 0.54);
  const winX = w * 0.27, winY = h * 0.56;
  const warmPane = createLowPolyMesh(new THREE.BoxGeometry(0.92, 1.00, 0.22), '#f59e0b', winX, winY, d * 0.5 + 0.06, false);
  warmPane.userData._emissiveGlow = true;
  const shutL = createLowPolyMesh(createOrganicBoxGeo(0.26, 1.02, 0.12, seed + 42, 0.06, 0.98, 1), '#7c4318', winX - 0.60, winY, d * 0.5 + 0.14, false);
  const shutR = createLowPolyMesh(createOrganicBoxGeo(0.26, 1.02, 0.12, seed + 43, 0.06, 0.98, 1), '#7c4318', winX + 0.60, winY, d * 0.5 + 0.14, false);
  const winTop = createLowPolyMesh(createOrganicBoxGeo(1.42, 0.19, 0.30, seed + 44, 0.09, 0.94, 1), '#b8844c', winX, winY + 0.58, d * 0.5 + 0.10, false);
  const planter = createLowPolyMesh(createOrganicBoxGeo(1.08, 0.23, 0.34, seed + 45, 0.08, 0.90, 1), '#b86232', winX, winY - 0.62, d * 0.5 + 0.20, false);
  const herb1 = createLowPolyMesh(new THREE.DodecahedronGeometry(0.17, 0), '#65a30d', winX - 0.22, winY - 0.43, d * 0.5 + 0.22, false);
  const herb2 = createLowPolyMesh(new THREE.DodecahedronGeometry(0.15, 0), '#84cc16', winX + 0.20, winY - 0.45, d * 0.5 + 0.24, false);
  const sideWin = createOrganicWindowGroup(0.95, 1.10, brickCol1, trimCol, '#23170f', seed + 50);
  sideWin.rotation.y = -Math.PI * 0.5;
  sideWin.position.set(-w * 0.5 - 0.06, h * 0.58, 0.4);
  const sideCanopy = createOrganicLinenAwningGroup(2.15, 1.15, linenSpec, woodCol, seed + 54, 0.28, false, 0);
  sideCanopy.rotation.y = -Math.PI * 0.5;
  sideCanopy.position.set(-w * 0.5 - 0.56, h * 0.78, 0.4);
  const pot1 = createJudeanClayPotMesh(1.02, '#b86232');
  pot1.position.set(-w * 0.42, 0, d * 0.5 + 0.52);
  const pot2 = createJudeanClayPotMesh(0.84, '#9e4f24');
  pot2.position.set(w * 0.36, 0, d * 0.5 + 0.56);
  staticGrp.add(stepStone, doorAmphora, warmPane, shutL, shutR, winTop, planter, herb1, herb2, sideWin, sideCanopy, pot1, pot2);

  for (let b = 0; b < 4; b++) {
    const bx = -w * 0.34 + (b / 3) * (w * 0.68);
    const rafter = createOrganicRoofBeamMesh(0.68, woodCol, seed + 60 + b);
    rafter.rotation.x = Math.PI * 0.5 + 0.05;
    rafter.position.set(bx, h - 0.35, d * 0.5 + 0.14);
    staticGrp.add(rafter);
  }
  // 옥상 서쪽 모서리에 건조 돗자리 (옥상 중앙 중풍병자 지붕 뚫기 지점을 비워둠)
  const matRoof = createLowPolyMesh(createOrganicBoxGeo(1.9, 0.09, 1.5, seed + 66, 0.06, 0.98, 1), linenSpec.trim, -2.55, h + 0.17, -1.65, false);
  staticGrp.add(matRoof);

  // 동쪽(+X) 외부 돌계단 (옥상 연결, 기존 가버나움 집과 동일!)
  const stairW = 1.68;
  const stairLocalX = stairSide * (w * 0.5 + stairW * 0.5 - 0.06);
  const railLocalX  = stairSide * (w * 0.5 + stairW - 0.16);
  const stepCount = 9;
  const stairSpanD = d * 0.88;
  const stepDepth = stairSpanD / stepCount;
  for (let s = 1; s <= stepCount; s++) {
    const sh = (h / stepCount) * s;
    const sz = (d * 0.5) - (s - 0.5) * stepDepth;
    const stepMesh = createLowPolyMesh(createOrganicBoxGeo(stairW, sh, stepDepth + 0.06, seed + 200 + s, 0.035, 0.98, 1), trimCol, stairLocalX, sh * 0.5, sz, true);
    const railTop = sh + 0.46;
    const railMesh = createLowPolyMesh(createOrganicBoxGeo(0.24, railTop, stepDepth + 0.08, seed + 220 + s, 0.03, 0.98, 1), trimCol, railLocalX, railTop * 0.5, sz, false);
    staticGrp.add(stepMesh, railMesh);
    const padR = Math.max(stairW, stepDepth) * 0.58;
    platforms.push({
      minX: cx + stairLocalX - padR,
      maxX: cx + stairLocalX + padR,
      minZ: cz + sz - padR,
      maxZ: cz + sz + padR,
      topY: by + sh
    });
  }
  platforms.push({
    minX: cx + w * 0.45 - 1.25,
    maxX: cx + w * 0.45 + 1.25,
    minZ: cz - d * 0.25 - 1.25,
    maxZ: cz - d * 0.25 + 1.25,
    topY: by + h + 0.05
  });

  mergeStaticLowPolyGroupToVertexColor(staticGrp, { registerWall: true, castShadow: true });
  houseGrp.add(staticGrp);

  // [실내 장면] 열린 문 너머로 보이는 예수님과 말씀을 듣는 사람들!
  const insideJesus = createLowPolyPersonMesh('jesus', 0);
  insideJesus.position.set(doorX + 0.08, 0.18, -1.62);
  insideJesus.rotation.y = 0; // 남쪽 열린 문을 향해 말씀을 전하심
  if (insideJesus.userData && insideJesus.userData.rArm) {
    insideJesus.userData.rArm.rotation.x = -0.78;
    insideJesus.userData.rArm.rotation.z = -0.18;
  }
  if (insideJesus.userData && insideJesus.userData.lArm) {
    insideJesus.userData.lArm.rotation.x = -0.32;
  }
  houseGrp.add(insideJesus);

  // 예수님 주변에 둘러선/앉은 실내 청중 6명 + 문 앞쪽 바깥에서 안을 들여다보는 사람 2명
  const listeners = [
    { preset: 'disciple',   x: doorX - 1.55, z: -0.75, rotY:  1.15, scale: 0.92 },
    { preset: 'villager_f', x: doorX + 1.55, z: -0.80, rotY: -1.15, scale: 0.90 },
    { preset: 'pharisee',   x: doorX + 1.95, z:  0.45, rotY: -2.05, scale: 0.94 },
    { preset: 'villager_m', x: doorX - 1.75, z:  0.65, rotY:  2.10, scale: 0.92 },
    { preset: 'child_boy',  x: doorX - 0.88, z:  0.95, rotY:  2.65, scale: 0.85 },
    { preset: 'villager_f', x: doorX + 1.02, z:  1.05, rotY: -2.60, scale: 0.90 },
    // 문 앞 바깥 좌우에서 안을 들여다보는 주민들 (열린 문 시야 중앙은 비워둠!)
    { preset: 'villager_m', x: doorX - 1.50, z:  d * 0.5 + 0.95, rotY:  2.55, scale: 0.94 },
    { preset: 'villager_f', x: doorX + 1.48, z:  d * 0.5 + 0.98, rotY: -2.55, scale: 0.92 }
  ];
  const insideCrowd = [];
  listeners.forEach((l, i) => {
    const p = createLowPolyPersonMesh(l.preset, 40 + i * 3);
    p.position.set(l.x, l.z < d * 0.5 ? 0.18 : 0, l.z);
    p.rotation.y = l.rotY;
    p.scale.set(l.scale, l.scale, l.scale);
    houseGrp.add(p);
    insideCrowd.push(p);
  });

  houseGrp.position.set(cx, by, cz);
  worldGroup.add(houseGrp);

  // 옥상 플랫폼 & 난간 물리 충돌 (기존 가버나움 집과 동일하게 계단으로 옥상에 올라갈 수 있고 정면 문으로는 뚫고 들어가지 않음)
  const effHalfW = w * 0.5 + 0.22;
  const effHalfD = d * 0.5 + 0.22;
  platforms.push({
    minX: cx - effHalfW,
    maxX: cx + effHalfW,
    minZ: cz - effHalfD,
    maxZ: cz + effHalfD,
    topY: by + h + 0.05
  });
  const halfT = (pT + 0.16) * 0.5;
  platforms.push(
    { minX: cx - w * 0.5 - halfT, maxX: cx + w * 0.5 + halfT, minZ: cz - d * 0.5 + pT * 0.5 - halfT, maxZ: cz - d * 0.5 + pT * 0.5 + halfT, topY: by + h + 0.78, passUnderY: by + h - 0.55, wallOnly: true },
    { minX: cx - w * 0.5 - halfT, maxX: cx + w * 0.5 + halfT, minZ: cz + d * 0.5 - pT * 0.5 - halfT, maxZ: cz + d * 0.5 - pT * 0.5 + halfT, topY: by + h + 0.78, passUnderY: by + h - 0.55, wallOnly: true },
    { minX: cx - w * 0.5 + pT * 0.5 - halfT, maxX: cx - w * 0.5 + pT * 0.5 + halfT, minZ: cz - d * 0.5 - halfT, maxZ: cz + d * 0.5 + halfT, topY: by + h + 0.78, passUnderY: by + h - 0.55, wallOnly: true },
    { minX: cx + w * 0.5 - pT * 0.5 - halfT, maxX: cx + w * 0.5 - pT * 0.5 + halfT, minZ: cz + d * 0.5 - closedLen - halfT, maxZ: cz + d * 0.5 + halfT, topY: by + h + 0.78, passUnderY: by + h - 0.55, wallOnly: true }
  );

  if (Array.isArray(window.miracleBuildingBounds)) {
    window.miracleBuildingBounds.push({
      minX: cx - effHalfW - 2.4,
      maxX: cx + effHalfW + 2.4,
      minZ: cz - effHalfD - 2.4,
      maxZ: cz + effHalfD + 2.4,
      cx, cz
    });
  }

  return {
    group: houseGrp,
    insideJesus,
    insideCrowd,
    roofTopY: by + h + 0.05,
    doorWorldPos: new THREE.Vector3(cx + doorX, by, cz + d * 0.5 + 1.2)
  };
}

// [미션 아이템 1] 선한 사마리아인용 1세기 성경 시대 치료 꾸러미 (갈대 바구니 + 올리브 기름병 + 포도주병 + 아마포 붕대 + 약초)
function createFirstAidKitMesh(scale = 1.0) {
  const g = new THREE.Group();
  const s = scale;

  // 갈대·버들가지로 엮은 1세기 시대풍 바구니 본체 + 테두리 + 가죽 손잡이
  const basket = createLowPolyMesh(new THREE.CylinderGeometry(0.46 * s, 0.34 * s, 0.38 * s, 8), '#b8844c', 0, 0.20 * s, 0, true);
  const rim = createLowPolyMesh(new THREE.CylinderGeometry(0.49 * s, 0.46 * s, 0.09 * s, 8), '#8f5d2c', 0, 0.39 * s, 0, false);
  const weaveBand = createLowPolyMesh(new THREE.CylinderGeometry(0.42 * s, 0.38 * s, 0.08 * s, 8), '#d4a36a', 0, 0.22 * s, 0, false);
  const hdlL = createLowPolyMesh(new THREE.BoxGeometry(0.06 * s, 0.36 * s, 0.06 * s), '#78350f', -0.43 * s, 0.56 * s, 0, false);
  const hdlR = createLowPolyMesh(new THREE.BoxGeometry(0.06 * s, 0.36 * s, 0.06 * s), '#78350f',  0.43 * s, 0.56 * s, 0, false);
  const hdlTop = createLowPolyMesh(new THREE.BoxGeometry(0.92 * s, 0.065 * s, 0.08 * s), '#78350f', 0, 0.74 * s, 0, false);
  g.add(basket, rim, weaveBand, hdlL, hdlR, hdlTop);

  // 1) 황금빛 올리브 기름 토기병 (누가복음 10:34 "기름과 포도주를 붓고")
  const oilBody = createLowPolyMesh(new THREE.DodecahedronGeometry(0.17 * s, 0), '#d97706', -0.17 * s, 0.46 * s, 0.06 * s, true);
  oilBody.scale.set(0.92, 1.25, 0.92);
  const oilNeck = createLowPolyMesh(new THREE.CylinderGeometry(0.055 * s, 0.075 * s, 0.16 * s, 6), '#f59e0b', -0.17 * s, 0.66 * s, 0.06 * s, false);
  const oilCork = createLowPolyMesh(new THREE.CylinderGeometry(0.045 * s, 0.045 * s, 0.06 * s, 5), '#78350f', -0.17 * s, 0.75 * s, 0.06 * s, false);

  // 2) 진한 자주빛 포도주 작은 호리병
  const wineBody = createLowPolyMesh(new THREE.DodecahedronGeometry(0.16 * s, 0), '#881337', 0.16 * s, 0.45 * s, 0.08 * s, true);
  wineBody.scale.set(0.95, 1.18, 0.95);
  const wineNeck = createLowPolyMesh(new THREE.CylinderGeometry(0.052 * s, 0.072 * s, 0.15 * s, 6), '#9f1239', 0.16 * s, 0.63 * s, 0.08 * s, false);
  const wineCork = createLowPolyMesh(new THREE.CylinderGeometry(0.042 * s, 0.042 * s, 0.06 * s, 5), '#d4a36a', 0.16 * s, 0.72 * s, 0.08 * s, false);

  // 3) 돌돌 만 아마포 붕대 2롤 + 가죽끈
  const band1 = createLowPolyMesh(new THREE.CylinderGeometry(0.105 * s, 0.105 * s, 0.24 * s, 8), '#f5efe0', -0.02 * s, 0.48 * s, -0.17 * s, false);
  band1.rotation.z = Math.PI * 0.5;
  const band2 = createLowPolyMesh(new THREE.CylinderGeometry(0.095 * s, 0.095 * s, 0.22 * s, 8), '#ebe1cc',  0.14 * s, 0.44 * s, -0.15 * s, false);
  band2.rotation.x = Math.PI * 0.45;
  const bandTie = createLowPolyMesh(new THREE.BoxGeometry(0.05 * s, 0.22 * s, 0.22 * s), '#b45309', -0.02 * s, 0.48 * s, -0.17 * s, false);

  // 4) 초록빛 치료용 허브(약초) 잎사귀 다발
  const herb1 = createLowPolyMesh(new THREE.DodecahedronGeometry(0.11 * s, 0), '#4d7c0f', -0.22 * s, 0.46 * s, -0.14 * s, false);
  const herb2 = createLowPolyMesh(new THREE.DodecahedronGeometry(0.09 * s, 0), '#65a30d', -0.14 * s, 0.52 * s, -0.20 * s, false);

  g.add(oilBody, oilNeck, oilCork, wineBody, wineNeck, wineCork, band1, band2, bandTie, herb1, herb2);
  g.userData.itemStyle = 'biblical_healing_basket';
  return g;
}

// [미션 아이템 1-B] 씨 뿌리는 비유 미니게임용 황금 씨앗 바구니 3D 에셋
function createSeedBasketMesh(scale = 1.0) {
  const g = new THREE.Group();
  const s = scale;
  const body = createLowPolyMesh(new THREE.CylinderGeometry(0.44 * s, 0.30 * s, 0.40 * s, 8), '#c28b4e', 0, 0.20 * s, 0, true);
  const rim = createLowPolyMesh(new THREE.CylinderGeometry(0.47 * s, 0.43 * s, 0.08 * s, 8), '#925e29', 0, 0.40 * s, 0, false);
  const strap = createLowPolyMesh(new THREE.CylinderGeometry(0.39 * s, 0.35 * s, 0.07 * s, 8), '#78350f', 0, 0.21 * s, 0, false);
  const seedMound = createLowPolyMesh(new THREE.DodecahedronGeometry(0.34 * s, 0), '#eab308', 0, 0.44 * s, 0, true);
  seedMound.scale.set(1.12, 0.48, 1.12);
  g.add(body, rim, strap, seedMound);
  // 바구니 위 반짝이는 밀·보리 씨앗 알갱이들
  [[-0.14, 0.08], [0.14, -0.06], [0.02, 0.14], [-0.08, -0.12], [0.12, 0.12]].forEach(([sx, sz], i) => {
    const grain = createLowPolyMesh(
      new THREE.OctahedronGeometry(0.07 * s, 0),
      i % 2 === 0 ? '#fde047' : '#ca8a04',
      sx * s, 0.54 * s + (i % 2) * 0.03 * s, sz * s, false
    );
    g.add(grain);
  });
  // 바구니 손잡이
  const hL = createLowPolyMesh(new THREE.BoxGeometry(0.055 * s, 0.30 * s, 0.055 * s), '#78350f', -0.40 * s, 0.54 * s, 0, false);
  const hR = createLowPolyMesh(new THREE.BoxGeometry(0.055 * s, 0.30 * s, 0.055 * s), '#78350f',  0.40 * s, 0.54 * s, 0, false);
  const hTop = createLowPolyMesh(new THREE.BoxGeometry(0.86 * s, 0.055 * s, 0.07 * s), '#78350f', 0, 0.69 * s, 0, false);
  g.add(hL, hR, hTop);
  return g;
}

// [미션 아이템 2] 가나 혼인잔치용 물이 가득 채워진 돌항아리 3D 에셋
function createWaterFilledAmphoraMesh(scale = 1.0) {
  const g = new THREE.Group();
  const s = scale;
  const foot = createLowPolyMesh(new THREE.CylinderGeometry(0.22 * s, 0.28 * s, 0.18 * s, 7), '#9a5b32', 0, 0.09 * s, 0, false);
  const belly = createLowPolyMesh(new THREE.DodecahedronGeometry(0.50 * s, 0), '#c8733e', 0, 0.56 * s, 0, true);
  belly.scale.set(0.95, 1.24, 0.95);
  const neck = createLowPolyMesh(new THREE.CylinderGeometry(0.28 * s, 0.24 * s, 0.34 * s, 7), '#b45f2c', 0, 1.04 * s, 0, true);
  const rim = createLowPolyMesh(new THREE.TorusGeometry(0.30 * s, 0.055 * s, 5, 8), '#8f471e', 0, 1.20 * s, 0, false);
  rim.rotation.x = Math.PI * 0.5;
  // 항아리 입구에 반짝이는 맑은 물 수면
  const waterMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const waterDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.27 * s, 0.27 * s, 0.06 * s, 8), waterMat);
  waterDisc.position.set(0, 1.19 * s, 0);
  const sparkle = new THREE.Mesh(new THREE.OctahedronGeometry(0.09 * s, 0), new THREE.MeshBasicMaterial({ color: 0xe0f2fe }));
  sparkle.position.set(0.06 * s, 1.28 * s, 0.04 * s);
  [-1, 1].forEach(side => {
    const hdl = createLowPolyMesh(new THREE.TorusGeometry(0.18 * s, 0.036 * s, 4, 6, Math.PI), '#8f471e', side * 0.34 * s, 0.86 * s, 0, false);
    hdl.rotation.z = side * (-Math.PI * 0.42);
    g.add(hdl);
  });
  g.add(foot, belly, neck, rim, waterDisc, sparkle);
  return g;
}

// [미션 아이템 3] 다락방 제자 미션용 접힌 아마포 수건 3D 에셋
function createFoldedTowelMesh(scale = 1.0) {
  const g = new THREE.Group();
  const s = scale;
  const bot = createLowPolyMesh(createOrganicBoxGeo(0.92 * s, 0.18 * s, 0.66 * s, 511, 0.04, 0.98, 1), '#f8f5ee', 0, 0.10 * s, 0, true);
  const mid = createLowPolyMesh(createOrganicBoxGeo(0.86 * s, 0.17 * s, 0.62 * s, 512, 0.04, 0.98, 1), '#ede4d3', 0, 0.27 * s, 0, true);
  const top = createLowPolyMesh(createOrganicBoxGeo(0.80 * s, 0.16 * s, 0.58 * s, 513, 0.04, 0.98, 1), '#ffffff', 0, 0.43 * s, 0, true);
  // 수건 끝단 파란/금색 직조 줄무늬 포인트
  const stripe1 = createLowPolyMesh(new THREE.BoxGeometry(0.82 * s, 0.04 * s, 0.10 * s), '#2563eb', 0, 0.51 * s, 0.18 * s, false);
  const stripe2 = createLowPolyMesh(new THREE.BoxGeometry(0.82 * s, 0.04 * s, 0.06 * s), '#f59e0b', 0, 0.51 * s, 0.06 * s, false);
  const stripe3 = createLowPolyMesh(new THREE.BoxGeometry(0.82 * s, 0.04 * s, 0.10 * s), '#2563eb', 0, 0.51 * s, -0.18 * s, false);
  g.add(bot, mid, top, stripe1, stripe2, stripe3);
  return g;
}

// [미션 아이템 4] 호산나 입성용 소프트 로우폴리 종려나무 가지 3D 에셋
function createPalmBranchMesh(scale = 1.0) {
  const g = new THREE.Group();
  const s = scale;
  // 휘어진 중앙 줄기
  const stem = createLowPolyMesh(new THREE.CylinderGeometry(0.035 * s, 0.065 * s, 2.05 * s, 5), '#65a30d', 0, 0.26 * s, 0, true);
  stem.rotation.x = Math.PI * 0.46;
  g.add(stem);
  // 양쪽으로 펼쳐진 10장의 종려 잎사귀
  const leafCols = ['#22c55e', '#16a34a', '#4d7c0f', '#65a30d'];
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    const lz = -0.68 * s + t * 1.35 * s;
    const ly = 0.22 * s + Math.sin(t * Math.PI) * 0.14 * s;
    const leafLen = (0.82 - Math.abs(t - 0.45) * 0.42) * s;
    [-1, 1].forEach(side => {
      const leaf = createLowPolyMesh(
        new THREE.ConeGeometry(0.14 * s, leafLen, 4),
        leafCols[(i + (side > 0 ? 1 : 0)) % leafCols.length],
        side * (leafLen * 0.44), ly, lz, false
      );
      leaf.rotation.z = side * (-Math.PI * 0.44);
      leaf.rotation.y = side * (-0.36);
      leaf.scale.set(1.0, 1.0, 0.35);
      g.add(leaf);
    });
  }
  // 끝단 중앙 잎
  const tip = createLowPolyMesh(new THREE.ConeGeometry(0.13 * s, 0.58 * s, 4), '#22c55e', 0, 0.26 * s, 1.08 * s, false);
  tip.rotation.x = Math.PI * 0.48;
  tip.scale.set(1.0, 1.0, 0.35);
  g.add(tip);
  return g;
}

// [공용 소프트 로우폴리 수면] 비정형 삼각 면 분할 + 얕은 청록~깊은 갈릴리 바다색 그라데이션 수면 생성기
function createIrregularLowPolyWaterMesh(width, depth, segsX = 36, segsZ = 54, seed = 13, opts = {}) {
  const indexed = new THREE.PlaneGeometry(width, depth, segsX, segsZ);
  indexed.rotateX(-Math.PI / 2);

  const hash2 = (x, z) => {
    const s = Math.sin(x * 12.9898 + z * 78.233 + seed * 37.7) * 43758.5453;
    return s - Math.floor(s);
  };

  const stepX = width / Math.max(1, segsX);
  const stepZ = depth / Math.max(1, segsZ);
  const posIdx = indexed.attributes.position;
  for (let i = 0; i < posIdx.count; i++) {
    let vx = posIdx.getX(i);
    let vz = posIdx.getZ(i);
    const onBorder = (Math.abs(vx) > width * 0.485 || Math.abs(vz) > depth * 0.485);
    if (!onBorder) {
      vx += (hash2(vx, vz) - 0.5) * stepX * 0.54;
      vz += (hash2(vz + 19.3, vx - 7.1) - 0.5) * stepZ * 0.54;
    }
    const waveY = (Math.sin(vx * 0.14 + vz * 0.11 + seed) * 0.12)
      + (Math.cos(vx * 0.24 - vz * 0.19) * 0.07)
      + (hash2(vx * 0.7, vz * 0.7) - 0.5) * 0.08;
    posIdx.setXYZ(i, vx, waveY, vz);
  }

  const geo = indexed.toNonIndexed();
  indexed.dispose();

  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshLambertMaterial({
      vertexColors: true,
      flatShading: true,
      transparent: true,
      opacity: opts.opacity !== undefined ? opts.opacity : 0.84
    })
  );
  mesh.receiveShadow = true;
  mesh.userData = {
    waterStyle: 'irregular_soft_lowpoly',
    width,
    depth,
    seed,
    shoreRightEdgeX: opts.shoreRightEdgeX !== undefined ? opts.shoreRightEdgeX : (width * 0.5),
    shallowBandW: opts.shallowBandW || 38.0
  };
  tintIrregularLowPolyWater(mesh, Boolean(opts.isStorm));
  return mesh;
}
window.createIrregularLowPolyWaterMesh = createIrregularLowPolyWaterMesh;

function tintIrregularLowPolyWater(waterMesh, isStorm = false) {
  if (!waterMesh || !waterMesh.geometry || !waterMesh.geometry.attributes || !waterMesh.geometry.attributes.position) return;
  const geo = waterMesh.geometry;
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const u = waterMesh.userData || {};
  const seed = u.seed || 13;
  const shoreX = u.shoreRightEdgeX !== undefined ? u.shoreRightEdgeX : 150;
  const shallowW = u.shallowBandW || 38.0;

  const hash2 = (x, z) => {
    const s = Math.sin(x * 15.73 + z * 63.17 + seed * 19.1) * 43758.5453;
    return s - Math.floor(s);
  };

  // Image 1 스타일의 맑은 연청록 물가 → 청량한 갈릴리 옥색/코발트 블루 (폭풍 시 깊은 청회색 바다)
  const cShallow = new THREE.Color(isStorm ? '#2b5870' : '#73c7c8');
  const cMid     = new THREE.Color(isStorm ? '#1d445c' : '#2ea3c2');
  const cDeep    = new THREE.Color(isStorm ? '#0f283b' : '#0b7ab0');
  const cFoam    = new THREE.Color(isStorm ? '#4b748a' : '#bce6e6');
  const fCol     = new THREE.Color();

  for (let i = 0; i + 2 < pos.count; i += 3) {
    const mx = (pos.getX(i) + pos.getX(i + 1) + pos.getX(i + 2)) / 3;
    const my = (pos.getY(i) + pos.getY(i + 1) + pos.getY(i + 2)) / 3;
    const mz = (pos.getZ(i) + pos.getZ(i + 1) + pos.getZ(i + 2)) / 3;

    const distFromShore = Math.max(0, shoreX - mx);
    const tShore = Math.min(1.0, distFromShore / shallowW);
    if (tShore < 0.36) {
      fCol.copy(cShallow).lerp(cMid, tShore / 0.36);
    } else {
      fCol.copy(cMid).lerp(cDeep, (tShore - 0.36) / 0.64);
    }
    // 물결 마루/해안 포말 하이라이트 + 삼각형 면별 명도 대비로 소프트 로우폴리 질감 극대화
    if (my > 0.11 || (tShore < 0.10 && hash2(mx, mz) > 0.55)) {
      fCol.lerp(cFoam, isStorm ? 0.18 : 0.28);
    }
    const facetTone = (hash2(mx * 0.9 + i * 0.01, mz * 0.9) - 0.5) * 0.14;
    const scaleLum = 1.0 + facetTone;
    fCol.r = Math.max(0, Math.min(1, fCol.r * scaleLum));
    fCol.g = Math.max(0, Math.min(1, fCol.g * scaleLum));
    fCol.b = Math.max(0, Math.min(1, fCol.b * scaleLum));

    for (let k = 0; k < 3; k++) {
      colors[(i + k) * 3]     = fCol.r;
      colors[(i + k) * 3 + 1] = fCol.g;
      colors[(i + k) * 3 + 2] = fCol.b;
    }
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  if (geo.attributes.color) geo.attributes.color.needsUpdate = true;
  geo.computeVertexNormals();
}
window.tintIrregularLowPolyWater = tintIrregularLowPolyWater;

// [Image 1 레퍼런스] 바닷가 물가 갈대·부들(Cattail) 수초 다발
function createShorelineCattailCluster(scale = 1.0) {
  const g = new THREE.Group();
  const s = scale;
  const leafCols = ['#5c8d36', '#72a142', '#4d7c2b', '#86b049'];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.3;
    const bladeH = (0.75 + (i % 3) * 0.26) * s;
    const blade = createLowPolyMesh(new THREE.ConeGeometry(0.065 * s, bladeH, 4), leafCols[i % leafCols.length], Math.cos(a) * 0.16 * s, bladeH * 0.45, Math.sin(a) * 0.16 * s, false);
    blade.rotation.z = -Math.cos(a) * 0.26;
    blade.rotation.x =  Math.sin(a) * 0.26;
    g.add(blade);
  }
  // 갈색 부들 이삭 2개
  [[-0.08, 0.06, 1.32, 0.08], [0.10, -0.05, 1.10, -0.10]].forEach(([sx, sz, h, tilt]) => {
    const stem = createLowPolyMesh(new THREE.CylinderGeometry(0.018 * s, 0.024 * s, h * s, 4), '#4d7c2b', sx * s, h * 0.5 * s, sz * s, false);
    stem.rotation.z = tilt;
    const head = createLowPolyMesh(new THREE.CylinderGeometry(0.052 * s, 0.056 * s, 0.30 * s, 6), '#6b3818', (sx - Math.sin(tilt) * h * 0.35) * s, h * 0.86 * s, sz * s, false);
    head.rotation.z = tilt;
    g.add(stem, head);
  });
  return g;
}

// [Image 1 레퍼런스] 바닷가 낚시용 둥근 대바구니 + 토기 그릇
function createWickerBasketMesh(scale = 1.0) {
  const g = new THREE.Group();
  const s = scale;
  const body = createLowPolyMesh(new THREE.CylinderGeometry(0.32 * s, 0.28 * s, 0.48 * s, 8), '#c49a5c', 0, 0.26 * s, 0, true);
  const belly = createLowPolyMesh(new THREE.DodecahedronGeometry(0.36 * s, 0), '#b4874a', 0, 0.25 * s, 0, true);
  belly.scale.set(1.04, 0.72, 1.04);
  const rim = createLowPolyMesh(new THREE.TorusGeometry(0.30 * s, 0.048 * s, 5, 9), '#9a6b35', 0, 0.50 * s, 0, false);
  rim.rotation.x = Math.PI * 0.5;
  const inside = createLowPolyMesh(new THREE.CylinderGeometry(0.26 * s, 0.24 * s, 0.06 * s, 8), '#5c3818', 0, 0.47 * s, 0, false);
  const bowl = createLowPolyMesh(new THREE.CylinderGeometry(0.18 * s, 0.12 * s, 0.16 * s, 7), '#b86232', 0.48 * s, 0.08 * s, 0.18 * s, true);
  g.add(body, belly, rim, inside, bowl);
  return g;
}

// [미션 아이템 5 - Image 1 레퍼런스] 마디가 있는 곡선 대나무 장대 낚싯대 + 정확한 끝점(tipNode) 앵커
function createFishingRodMesh(scale = 1.0) {
  const g = new THREE.Group();
  const s = scale;
  const segSpecs = [
    { rBot: 0.054, rTop: 0.046, len: 0.82, bendX: 0.02, col: '#b89452' },
    { rBot: 0.046, rTop: 0.038, len: 0.85, bendX: 0.08, col: '#cfb06e' },
    { rBot: 0.038, rTop: 0.030, len: 0.84, bendX: 0.16, col: '#c5a25e' },
    { rBot: 0.030, rTop: 0.022, len: 0.80, bendX: 0.26, col: '#d6ba7a' },
    { rBot: 0.022, rTop: 0.014, len: 0.72, bendX: 0.38, col: '#c9a966' }
  ];

  // 손잡이 삼베끈 감개
  const grip = createLowPolyMesh(new THREE.CylinderGeometry(0.058 * s, 0.064 * s, 0.44 * s, 6), '#6b4226', 0, 0.20 * s, 0, false);
  g.add(grip);

  // 관절식으로 자연스럽게 휘어지는 5단 대나무 마디 체인 구축 → 끝점에 tipNode 고정!
  let curParent = g;
  let attachY = 0.05 * s;
  segSpecs.forEach((sp, idx) => {
    const piv = new THREE.Group();
    piv.position.set(0, attachY, 0);
    piv.rotation.x = idx === 0 ? sp.bendX : (sp.bendX - segSpecs[idx - 1].bendX);

    const cyl = createLowPolyMesh(
      new THREE.CylinderGeometry(sp.rTop * s, sp.rBot * s, sp.len * s, 6),
      sp.col, 0, sp.len * 0.5 * s, 0, true
    );
    const nodeRing = createLowPolyMesh(
      new THREE.CylinderGeometry((sp.rTop + 0.010) * s, (sp.rTop + 0.010) * s, 0.055 * s, 6),
      '#8a6838', 0, sp.len * s, 0, false
    );
    piv.add(cyl, nodeRing);
    curParent.add(piv);
    curParent = piv;
    attachY = sp.len * s;
  });

  // 대나무 끝단 낚시줄 매듭(삼베끈 감개) + 정확한 월드 좌표 추출용 tipNode!
  const tipLash = createLowPolyMesh(new THREE.CylinderGeometry(0.026 * s, 0.028 * s, 0.11 * s, 6), '#855828', 0, attachY - 0.04 * s, 0, false);
  const tipNode = new THREE.Object3D();
  tipNode.position.set(0, attachY, 0);
  curParent.add(tipLash, tipNode);

  g.userData.tipNode = tipNode;
  g.userData.rodStyle = 'curved_bamboo_v11';
  return g;
}

// [미션 아이템 6] 디테일 소프트 로우폴리 갈릴리 바닷가 모닥불 (활활 타는 숯불 vs 영구 불꺼진 숯나무·재)
function createGalileeCampfireMesh(extinguished = false, scale = 1.0) {
  const g = new THREE.Group();
  const s = scale;

  // 1) 2중 비정형 바닷가 자연석 화덕 돌 테두리 (큰 돌 11개 + 틈새 쐐기 조약돌 7개)
  for (let i = 0; i < 11; i++) {
    const a = (i / 11) * Math.PI * 2;
    const r = (1.02 + (i % 2) * 0.09) * s;
    const stGeo = (typeof createIrregularFieldstoneGeo === 'function')
      ? createIrregularFieldstoneGeo((0.46 + (i % 3) * 0.06) * s, (0.30 + (i % 2) * 0.07) * s, 0.38 * s, 700 + i)
      : new THREE.DodecahedronGeometry(0.28 * s, 0);
    const col = i % 3 === 0 ? '#94a3b8' : (i % 2 === 0 ? '#78716c' : '#b2aaa0');
    const st = createLowPolyMesh(stGeo, col, Math.cos(a) * r, 0.15 * s, Math.sin(a) * r, true);
    st.rotation.set(((i % 3) - 1) * 0.08, a + 0.45, ((i % 2) - 0.5) * 0.08);
    g.add(st);
  }
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + 0.28;
    const r = 1.24 * s;
    const peb = createLowPolyMesh(new THREE.DodecahedronGeometry(0.15 * s, 0), i % 2 === 0 ? '#cbd5e1' : '#a8a29e', Math.cos(a) * r, 0.08 * s, Math.sin(a) * r, false);
    peb.scale.set(1.25, 0.58, 1.05);
    g.add(peb);
  }

  if (extinguished) {
    // [디테일 불꺼진 모닥불: 다층 회색 잿더미 + 재가 묻은 까만 숯 장작 + 숯덩이 + 그을린 Y자 꼬치 기둥]
    const ashBase = createLowPolyMesh(new THREE.DodecahedronGeometry(0.84 * s, 0), '#9ca3af', 0, 0.08 * s, 0, false);
    ashBase.scale.set(1.18, 0.24, 1.15);
    const ashMid = createLowPolyMesh(new THREE.DodecahedronGeometry(0.60 * s, 0), '#6b7280', 0.06 * s, 0.14 * s, -0.05 * s, false);
    ashMid.scale.set(1.15, 0.30, 1.10);
    const ashTop = createLowPolyMesh(new THREE.DodecahedronGeometry(0.36 * s, 0), '#d1d5db', -0.08 * s, 0.19 * s, 0.06 * s, false);
    ashTop.scale.set(1.10, 0.26, 1.05);
    g.add(ashBase, ashMid, ashTop);

    const burntLogs = [
      { x: -0.10, y: 0.20, z:  0.05, rx: 0.20, ry:  0.35, rz: Math.PI * 0.45, len: 1.26, col: '#1c1917' },
      { x:  0.14, y: 0.22, z: -0.09, rx: -0.24, ry: 1.48, rz: Math.PI * 0.44, len: 1.20, col: '#292524' },
      { x:  0.02, y: 0.26, z:  0.14, rx: 0.28, ry:  2.55, rz: Math.PI * 0.42, len: 1.08, col: '#111827' },
      { x: -0.24, y: 0.17, z: -0.18, rx: -0.14, ry: 0.92, rz: Math.PI * 0.47, len: 0.96, col: '#374151' },
      { x:  0.22, y: 0.18, z:  0.18, rx: 0.16, ry:  2.05, rz: Math.PI * 0.46, len: 0.88, col: '#1f2937' }
    ];
    burntLogs.forEach((lg) => {
      const m = createLowPolyMesh(new THREE.CylinderGeometry(0.075 * s, 0.108 * s, lg.len * s, 6), lg.col, lg.x * s, lg.y * s, lg.z * s, true);
      m.rotation.set(lg.rx, lg.ry, lg.rz);
      g.add(m);
    });
    for (let c = 0; c < 9; c++) {
      const a = (c / 9) * Math.PI * 2 + 0.4;
      const r = (0.18 + (c % 3) * 0.20) * s;
      const coal = createLowPolyMesh(new THREE.DodecahedronGeometry((0.09 + (c % 2) * 0.03) * s, 0), c % 3 === 0 ? '#111827' : (c % 2 === 0 ? '#27272a' : '#4b5563'), Math.cos(a) * r, 0.17 * s, Math.sin(a) * r, false);
      coal.scale.set(1.22, 0.62, 0.95);
      g.add(coal);
    }
    // 그을려 남은 양옆 Y자 나무 말뚝
    [-0.95, 0.95].forEach((fx) => {
      const stake = createLowPolyMesh(new THREE.CylinderGeometry(0.036 * s, 0.052 * s, 0.85 * s, 5), '#3f2e21', fx * s, 0.42 * s, 0, true);
      stake.rotation.z = fx < 0 ? 0.08 : -0.08;
      g.add(stake);
    });
    g.userData.extinguished = true;
    g.userData.campfireStyle = 'detailed_soft_lowpoly_v11';
    return g;
  }

  // [디테일 활활 타오르는 바닷가 숯불 모닥불]
  // 2) 다층 숯불 바닥(어두운 숯층 + 붉은 잔불 + 밝은 황금 잉걸불 덩어리들)
  const coalBed = createLowPolyMesh(new THREE.DodecahedronGeometry(0.74 * s, 0), '#3b1808', 0, 0.10 * s, 0, false);
  coalBed.scale.set(1.16, 0.28, 1.14);
  const emberBed = createLowPolyMesh(new THREE.DodecahedronGeometry(0.50 * s, 0), '#c2410c', 0, 0.16 * s, 0, false);
  emberBed.scale.set(1.12, 0.34, 1.08);
  emberBed.userData._emissiveGlow = true;
  g.add(coalBed, emberBed);

  for (let e = 0; e < 7; e++) {
    const a = (e / 7) * Math.PI * 2;
    const r = (0.20 + (e % 2) * 0.22) * s;
    const hotCoal = createLowPolyMesh(new THREE.DodecahedronGeometry(0.11 * s, 0), e % 2 === 0 ? '#f97316' : '#facc15', Math.cos(a) * r, 0.20 * s, Math.sin(a) * r, false);
    hotCoal.scale.set(1.15, 0.65, 1.0);
    hotCoal.userData._emissiveGlow = true;
    g.add(hotCoal);
  }

  // 3) 입체적으로 교차 적층된 쪼갠 장작 6개 + 옆에 쌓아둔 여분 장작 더미
  for (let l = 0; l < 6; l++) {
    const a = (l / 6) * Math.PI * 2 + 0.15;
    const log = createLowPolyMesh(new THREE.CylinderGeometry(0.085 * s, 0.115 * s, 1.32 * s, 6), l % 2 === 0 ? '#5c2d0c' : '#3f1d0b', Math.cos(a) * 0.30 * s, 0.26 * s, Math.sin(a) * 0.30 * s, true);
    log.rotation.z = Math.PI * 0.36;
    log.rotation.y = a;
    g.add(log);
  }
  // 화덕 뒤편 여분 장작 3개 묶음
  [[0.15, 0.10, -1.52], [-0.14, 0.10, -1.54], [0.0, 0.24, -1.53]].forEach(([lx, ly, lz], idx) => {
    const spare = createLowPolyMesh(new THREE.CylinderGeometry(0.078 * s, 0.086 * s, 0.96 * s, 6), idx === 2 ? '#78350f' : '#5c2d0c', lx * s, ly * s, lz * s, true);
    spare.rotation.z = Math.PI * 0.5;
    spare.rotation.y = 0.12 * (idx - 1);
    g.add(spare);
  });

  // 4) 5겹 소프트 로우폴리 불꽃 혀(Flame Tongues) + 피어오르는 불똥 스파크 7개
  const flames = [];
  const flameSpecs = [
    { r: 0.44, h: 1.15, col: 0xea580c, x:  0.00, z:  0.00, op: 0.90 },
    { r: 0.34, h: 0.96, col: 0xf97316, x: -0.16, z:  0.11, op: 0.92 },
    { r: 0.30, h: 0.88, col: 0xfacc15, x:  0.15, z: -0.09, op: 0.94 },
    { r: 0.22, h: 0.78, col: 0xfef08a, x:  0.03, z:  0.06, op: 0.96 },
    { r: 0.20, h: 0.68, col: 0xfbbf24, x: -0.08, z: -0.14, op: 0.92 }
  ];
  flameSpecs.forEach((fs, idx) => {
    const fMat = new THREE.MeshBasicMaterial({ color: fs.col, transparent: true, opacity: fs.op });
    const fMesh = new THREE.Mesh(new THREE.ConeGeometry(fs.r * s, fs.h * s, 5), fMat);
    fMesh.position.set(fs.x * s, (0.28 + fs.h * 0.44) * s, fs.z * s);
    fMesh.rotation.y = idx * 1.15;
    g.add(fMesh);
    flames.push({ mesh: fMesh, baseY: fMesh.position.y, phase: idx * 1.7 });
  });

  const sparks = [];
  for (let sp = 0; sp < 7; sp++) {
    const spMat = new THREE.MeshBasicMaterial({ color: sp % 2 === 0 ? 0xfde047 : 0xf97316, transparent: true, opacity: 0.9 });
    const spMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.055 * s, 0), spMat);
    g.add(spMesh);
    sparks.push({ mesh: spMesh, mat: spMat, angle: sp * 1.1, phase: sp / 7, rad: (0.15 + (sp % 3) * 0.14) * s });
  }

  // 5) 삼베끈으로 묶은 Y자 나무 꼬치 지지대 + 가로 꼬치 + 소프트 로우폴리 구이 물고기!
  [-1, 1].forEach((side) => {
    const fx = side * 0.96 * s;
    const pole = createLowPolyMesh(new THREE.CylinderGeometry(0.042 * s, 0.058 * s, 1.32 * s, 5), '#6b4226', fx, 0.64 * s, 0, true);
    const prongA = createLowPolyMesh(new THREE.CylinderGeometry(0.025 * s, 0.036 * s, 0.34 * s, 5), '#7c4722', fx, 1.32 * s, -0.09 * s, false);
    prongA.rotation.x = -0.45;
    const prongB = createLowPolyMesh(new THREE.CylinderGeometry(0.025 * s, 0.036 * s, 0.34 * s, 5), '#7c4722', fx, 1.32 * s,  0.09 * s, false);
    prongB.rotation.x =  0.45;
    const lash = createLowPolyMesh(new THREE.CylinderGeometry(0.058 * s, 0.058 * s, 0.11 * s, 6), '#d6b685', fx, 1.18 * s, 0, false);
    g.add(pole, prongA, prongB, lash);
  });
  const spitRod = createLowPolyMesh(new THREE.CylinderGeometry(0.028 * s, 0.028 * s, 2.22 * s, 5), '#92400e', 0, 1.24 * s, 0, false);
  spitRod.rotation.z = Math.PI * 0.5;
  g.add(spitRod);

  const roastFishGrp = new THREE.Group();
  const roastFishMat = new THREE.MeshLambertMaterial({ color: 0x93c5fd, flatShading: true });
  const fishBody = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28 * s, 0), roastFishMat);
  fishBody.scale.set(1.75, 0.72, 0.46);
  const fishHead = new THREE.Mesh(new THREE.ConeGeometry(0.16 * s, 0.32 * s, 5), roastFishMat);
  fishHead.rotation.z = -Math.PI * 0.5;
  fishHead.position.set(0.46 * s, 0, 0);
  const fishDorsal = new THREE.Mesh(new THREE.ConeGeometry(0.11 * s, 0.28 * s, 4), roastFishMat);
  fishDorsal.rotation.z = 0.55;
  fishDorsal.scale.set(1.3, 1.0, 0.28);
  fishDorsal.position.set(-0.04 * s, 0.22 * s, 0);
  const fishTailUp = new THREE.Mesh(new THREE.ConeGeometry(0.11 * s, 0.30 * s, 4), roastFishMat);
  fishTailUp.rotation.z = Math.PI * 0.35;
  fishTailUp.scale.set(1.0, 1.0, 0.28);
  fishTailUp.position.set(-0.56 * s, 0.09 * s, 0);
  const fishTailLo = new THREE.Mesh(new THREE.ConeGeometry(0.11 * s, 0.28 * s, 4), roastFishMat);
  fishTailLo.rotation.z = Math.PI * 0.65;
  fishTailLo.scale.set(1.0, 1.0, 0.28);
  fishTailLo.position.set(-0.56 * s, -0.09 * s, 0);
  roastFishGrp.add(fishBody, fishHead, fishDorsal, fishTailUp, fishTailLo);
  roastFishGrp.position.set(0, 1.24 * s, 0);
  roastFishGrp.visible = false;
  g.add(roastFishGrp);

  // 연기/김 파티클 5개 (노릇할 땐 하얀 김, 타면 검은 연기!)
  const smokePuffs = [];
  for (let p = 0; p < 5; p++) {
    const sMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc, transparent: true, opacity: 0.45 });
    const sMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.15 * s, 0), sMat);
    sMesh.position.set((p - 2) * 0.14 * s, 1.32 * s, 0);
    sMesh.visible = false;
    g.add(sMesh);
    smokePuffs.push({ mesh: sMesh, mat: sMat, phase: p * 0.22 });
  }

  g.userData.extinguished = false;
  g.userData.campfireStyle = 'detailed_soft_lowpoly_v11';
  g.userData.flames = flames;
  g.userData.sparks = sparks;
  g.userData.roastFishGrp = roastFishGrp;
  g.userData.roastFishMat = roastFishMat;
  g.userData.smokePuffs = smokePuffs;
  return g;
}

// [미션 아이템 7] 엠마오 마을 예수님과 떡을 떼는 소프트 로우폴리 식탁 3D 에셋
function createEmmausTableMesh(scale = 1.0) {
  const g = new THREE.Group();
  const s = scale;
  const top = createLowPolyMesh(createOrganicBoxGeo(1.75 * s, 0.14 * s, 1.10 * s, 771, 0.06, 0.96, 2), '#854d0e', 0, 0.88 * s, 0, true);
  const runner = createLowPolyMesh(createOrganicBoxGeo(1.20 * s, 0.04 * s, 0.64 * s, 772, 0.05, 0.97, 1), '#f5ead6', 0, 0.97 * s, 0, false);
  [[-0.72, -0.40], [0.72, -0.40], [-0.72, 0.40], [0.72, 0.40]].forEach(([lx, lz]) => {
    g.add(createLowPolyMesh(new THREE.CylinderGeometry(0.055 * s, 0.070 * s, 0.86 * s, 6), '#5c2d0c', lx * s, 0.43 * s, lz * s, false));
  });
  // 축사하시고 떼어 주시는 둥근 떡(빵) & 황금 잔
  const breadL = createLowPolyMesh(new THREE.DodecahedronGeometry(0.22 * s, 0), '#d97706', -0.14 * s, 1.09 * s, 0.02 * s, false);
  breadL.scale.set(1.15, 0.62, 0.95);
  const breadR = createLowPolyMesh(new THREE.DodecahedronGeometry(0.20 * s, 0), '#b45309',  0.18 * s, 1.08 * s, -0.02 * s, false);
  breadR.scale.set(1.05, 0.58, 0.92);
  const cup = createLowPolyMesh(new THREE.CylinderGeometry(0.11 * s, 0.07 * s, 0.24 * s, 7), '#eab308', 0.48 * s, 1.11 * s, 0.12 * s, false);
  // 양옆 낮은 나무 의자 2개
  [-1.25, 1.25].forEach((sx) => {
    const st = createLowPolyMesh(new THREE.CylinderGeometry(0.30 * s, 0.28 * s, 0.10 * s, 7), '#78350f', sx * s, 0.48 * s, 0, false);
    const sb = createLowPolyMesh(new THREE.CylinderGeometry(0.16 * s, 0.22 * s, 0.44 * s, 6), '#5c2d0c', sx * s, 0.22 * s, 0, false);
    g.add(st, sb);
  });
  g.add(top, runner, breadL, breadR, cup);
  return g;
}

// [미션 공통] NPC 주변 무릎 높이(y ≤ ~0.95m) 파형(웨이브) + 반짝이는 상승 파티클 오라 그룹
function createGoldenAuraGroup(colorHex = 0xfde047, radius = 1.65) {
  const auraGrp = new THREE.Group();

  // 1) 무릎 높이 파도 치는 웨이브 커튼(외측/내측 2중 파형 스커트)
  const makeWaveSkirt = (rTop, rBot, h, amp, lobes, opacity) => {
    const geo = new THREE.CylinderGeometry(rTop, rBot, h, 24, 1, true);
    if (geo.attributes && geo.attributes.position) {
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const vx = pos.getX(i), vy = pos.getY(i), vz = pos.getZ(i);
        if (vy > 0) {
          const ang = Math.atan2(vz, vx);
          const waveY = vy + Math.sin(ang * lobes) * amp;
          pos.setY(i, waveY);
        }
      }
      if (typeof geo.computeVertexNormals === 'function') geo.computeVertexNormals();
    }
    const mat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const m = new THREE.Mesh(geo, mat);
    m.position.y = h * 0.5 + 0.04;
    return m;
  };

  const outerWave = makeWaveSkirt(radius * 0.88, radius * 0.72, 0.68, 0.16, 5, 0.34);
  const innerWave = makeWaveSkirt(radius * 0.64, radius * 0.50, 0.48, 0.12, 4, 0.28);
  auraGrp.add(outerWave, innerWave);

  // 2) 바닥에서 바깥으로 퍼져나가는 3중 파동(Ripple Wave) 링
  const ripples = [];
  for (let i = 0; i < 3; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color: i === 1 ? 0xffffff : colorHex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65,
      depthWrite: false
    });
    const ring = new THREE.Mesh(new THREE.RingGeometry(radius * 0.42, radius * 0.56, 24), mat);
    ring.rotation.x = -Math.PI * 0.5;
    ring.position.y = 0.06 + i * 0.015;
    auraGrp.add(ring);
    ripples.push({ mesh: ring, mat, offset: i / 3 });
  }

  // 3) 발끝에서 무릎 높이(0.08 ~ 0.94m)까지만 피어오르는 빛 파티클 14개
  const particles = [];
  for (let i = 0; i < 14; i++) {
    const pCol = (i % 3 === 0) ? 0xffffff : colorHex;
    const pMat = new THREE.MeshBasicMaterial({ color: pCol, transparent: true, opacity: 0.90 });
    const pMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.072 + (i % 3) * 0.014, 0), pMat);
    auraGrp.add(pMesh);
    particles.push({
      mesh: pMesh,
      mat: pMat,
      angle: (i / 14) * Math.PI * 2,
      radFrac: 0.45 + (i % 4) * 0.14,
      speed: 0.75 + (i % 3) * 0.22,
      phase: (i * 0.37) % 1.0
    });
  }

  auraGrp.userData.style = 'knee_wave_particles';
  auraGrp.userData.maxHeight = 0.95;
  auraGrp.userData.animate = (t) => {
    outerWave.rotation.y = t * 0.95;
    innerWave.rotation.y = -t * 1.35;
    const wPulse = 1 + Math.sin(t * 3.2) * 0.08;
    outerWave.scale.set(wPulse, 0.94 + Math.sin(t * 4.0) * 0.08, wPulse);
    innerWave.scale.set(1 + Math.cos(t * 3.6) * 0.07, 0.92 + Math.cos(t * 4.5) * 0.08, 1 + Math.cos(t * 3.6) * 0.07);

    ripples.forEach((rp) => {
      const cyc = (t * 0.55 + rp.offset) % 1.0;
      const sc = 0.78 + cyc * 1.25;
      rp.mesh.scale.set(sc, sc, 1);
      rp.mat.opacity = Math.max(0.04, (1.0 - cyc) * 0.72);
    });

    particles.forEach((pt, idx) => {
      const cyc = (t * pt.speed * 0.65 + pt.phase) % 1.0;
      const a = pt.angle + t * (idx % 2 === 0 ? 1.15 : -0.95);
      const r = radius * pt.radFrac * (0.92 + Math.sin(cyc * Math.PI) * 0.22);
      const y = 0.08 + cyc * 0.86; // 무릎 높이(최대 ~0.94m)까지만 상승!
      pt.mesh.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
      const sc = Math.sin(cyc * Math.PI) * 1.15 + 0.15;
      pt.mesh.scale.set(sc, sc, sc);
      pt.mesh.rotation.y = t * 3.2 + idx;
      pt.mat.opacity = Math.sin(cyc * Math.PI) * 0.95;
    });
  };
  return auraGrp;
}

// [반석 위의 집 확장형] 멀티플레이 협동 건축까지 수용하는 초대형 다단 소프트 로우폴리 반석 부지 (~18m × 16m)
function createWideBedrockFormation(cx, cz) {
  const by = getBaseGroundHeight(cx, cz);
  const grp = new THREE.Group();
  const rockCols = ['#94a3b8', '#cbd5e1', '#78716c', '#a8a29e', '#b8b0a4', '#8b95a5'];

  // 1) 하단 넓은 암반 기층(Lower Terraced Bedrock Apron)
  const lowerSlabs = [
    { x:  0.0, z:  0.0, w: 15.6, h: 0.56, d: 13.8, col: '#8b95a5', rot: 0.04 },
    { x: -6.2, z:  2.8, w:  6.4, h: 0.46, d:  5.8, col: '#94a3b8', rot: -0.22 },
    { x:  6.4, z: -2.6, w:  6.6, h: 0.48, d:  5.8, col: '#a8a29e', rot: 0.28 },
    { x: -5.4, z: -4.4, w:  6.2, h: 0.44, d:  5.2, col: '#78716c', rot: 0.36 },
    { x:  5.6, z:  4.2, w:  6.0, h: 0.44, d:  5.2, col: '#b8b0a4', rot: -0.32 },
    { x:  0.2, z: -6.2, w:  8.8, h: 0.40, d:  4.0, col: '#94a3b8', rot: 0.08 },
    { x: -0.3, z:  6.3, w:  8.6, h: 0.38, d:  4.0, col: '#a8a29e', rot: -0.06 }
  ];
  lowerSlabs.forEach((sl, i) => {
    const m = createLowPolyMesh(createOrganicBoxGeo(sl.w, sl.h, sl.d, 800 + i * 19, 0.11, 0.86, 2), sl.col, sl.x, sl.h * 0.38, sl.z, true);
    m.rotation.y = sl.rot;
    grp.add(m);
  });

  // 2) 중앙 단단한 반석 대지(Upper Flat Foundation Plateau) + 4모서리 다듬은 주춧돌 받침
  const upperPlateau = createLowPolyMesh(createOrganicBoxGeo(11.8, 0.52, 10.2, 860, 0.07, 0.92, 2), '#cbd5e1', 0, 0.54, 0, true);
  upperPlateau.rotation.y = 0.02;
  grp.add(upperPlateau);

  [[-4.8, -4.1], [4.8, -4.1], [-4.8, 4.1], [4.8, 4.1]].forEach(([px, pz], pi) => {
    const plinth = createLowPolyMesh(createOrganicBoxGeo(1.45, 0.32, 1.45, 870 + pi, 0.08, 0.92, 1), '#d6cfc2', px, 0.88, pz, true);
    plinth.rotation.y = pi * 0.15;
    grp.add(plinth);
  });

  // 3) 서쪽·남쪽 반석 오르막 석재 디딤계단(자연석 3단)
  for (let s = 0; s < 3; s++) {
    const stW = createLowPolyMesh(createOrganicBoxGeo(1.15, 0.24, 3.6 - s * 0.3, 880 + s, 0.08, 0.94, 1), s % 2 === 0 ? '#d6cfc2' : '#b8b0a4', -6.8 + s * 0.72, 0.16 + s * 0.22, 0.2, false);
    const stS = createLowPolyMesh(createOrganicBoxGeo(3.8 - s * 0.3, 0.24, 1.15, 885 + s, 0.08, 0.94, 1), s % 2 === 0 ? '#d6cfc2' : '#b8b0a4', 0, 0.16 + s * 0.22, 6.2 - s * 0.72, false);
    grp.add(stW, stS);
  }

  // 4) 반석 외곽을 감싸는 웅장한 비정형 바위 덩어리(18개) + 바위 틈 이끼/풀포기(10개)
  for (let i = 0; i < 18; i++) {
    const ang = (i / 18) * Math.PI * 2 + 0.18;
    // 서쪽(-X) 및 남쪽(+Z) 계단 진입구 비워두기
    if (Math.abs(Math.cos(ang) + 1) < 0.12 || Math.abs(Math.sin(ang) - 1) < 0.12) continue;
    const radX = 8.4 + (i % 3) * 1.05;
    const radZ = 7.4 + ((i + 1) % 3) * 0.95;
    const boulder = createLowPolyMesh(
      new THREE.DodecahedronGeometry(0.85 + (i % 3) * 0.28, 0),
      rockCols[i % rockCols.length],
      Math.cos(ang) * radX, 0.32 + (i % 2) * 0.16, Math.sin(ang) * radZ, true
    );
    boulder.scale.set(1.38, 0.62, 1.18);
    boulder.rotation.set((i % 3) * 0.12, ang, 0);
    grp.add(boulder);

    if (i % 2 === 0) {
      const tuft = createLowPolyMesh(new THREE.DodecahedronGeometry(0.32, 0), '#65a30d', Math.cos(ang) * (radX - 1.1), 0.34, Math.sin(ang) * (radZ - 1.0), false);
      tuft.scale.set(1.2, 0.55, 1.1);
      grp.add(tuft);
    }
  }

  mergeStaticLowPolyGroupToVertexColor(grp, { registerWall: false, castShadow: true });
  grp.traverse(ch => { if (ch.isMesh) ch.receiveShadow = true; });
  grp.position.set(cx, by - 0.06, cz);
  grp.userData.bedrockRadius = 9.2;
  grp.userData.bedrockStyle = 'expanded_grand_v11';
  worldGroup.add(grp);
  // 멀티플레이 공동 건설 반석 터 & 건축 구역 전체를 단단한 충돌체로 등록해 캐릭터 통과 원천 차단!
  if (typeof colliders !== 'undefined' && Array.isArray(colliders)) {
    colliders.push({
      minX: cx - 6.8,
      maxX: cx + 6.8,
      minZ: cz - 6.0,
      maxZ: cz + 6.0,
      isBedrockFoundation: true
    });
  }
  return grp;
}

// [개인 기본 오픈월드용] 원래 크기의 단단한 소형 소프트 로우폴리 반석 부지 (~7.5m × 6.5m)
function createCompactBedrockFormation(cx, cz) {
  const by = getBaseGroundHeight(cx, cz);
  const grp = new THREE.Group();
  const rockCols = ['#94a3b8', '#cbd5e1', '#78716c', '#a8a29e'];

  const lowerSlab = createLowPolyMesh(createOrganicBoxGeo(7.4, 0.44, 6.4, 710, 0.10, 0.88, 2), '#8b95a5', 0, 0.18, 0, true);
  lowerSlab.rotation.y = 0.05;
  const upperSlab = createLowPolyMesh(createOrganicBoxGeo(5.6, 0.36, 4.8, 715, 0.07, 0.92, 2), '#cbd5e1', 0, 0.44, 0, true);
  grp.add(lowerSlab, upperSlab);

  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2 + 0.22;
    const radX = 3.7 + (i % 2) * 0.45;
    const radZ = 3.2 + ((i + 1) % 2) * 0.40;
    const boulder = createLowPolyMesh(
      new THREE.DodecahedronGeometry(0.55 + (i % 3) * 0.14, 0),
      rockCols[i % rockCols.length],
      Math.cos(ang) * radX, 0.22, Math.sin(ang) * radZ, true
    );
    boulder.scale.set(1.3, 0.58, 1.12);
    boulder.rotation.set(0.08, ang, 0);
    grp.add(boulder);
  }

  mergeStaticLowPolyGroupToVertexColor(grp, { registerWall: false, castShadow: true });
  grp.traverse(ch => { if (ch.isMesh) ch.receiveShadow = true; });
  grp.position.set(cx, by - 0.06, cz);
  grp.userData.bedrockRadius = 4.2;
  grp.userData.bedrockStyle = 'compact_single_v12';
  worldGroup.add(grp);
  // 반석 기반에 몸이 통과하지 않도록 단단한 충돌 영역 등록!
  if (typeof colliders !== 'undefined' && Array.isArray(colliders)) {
    colliders.push({
      minX: cx - 3.4,
      maxX: cx + 3.4,
      minZ: cz - 3.0,
      maxZ: cz + 3.0,
      isBedrockFoundation: true
    });
  }
  return grp;
}
window.createCompactBedrockFormation = createCompactBedrockFormation;

// [비정형 소프트 로우폴리 십자가 팩토리] 거친 손도끼 가공 통나무·밧줄 결속·나무 쐐기·명패·돌무더기 받침
function createOrganicLowPolyCrossMesh(scale = 1.0, opts = {}) {
  const grp = new THREE.Group();
  const s = scale;
  const seed = opts.seed || 301;
  const withBase = opts.withBase !== false;
  const withPlaque = Boolean(opts.withPlaque);

  const mkOrg = (w, h, d, col, x, y, z, sd, irr = 0.09, taper = 0.90, seg = 2) => {
    const geo = (typeof createOrganicBoxGeo === 'function')
      ? createOrganicBoxGeo(w, h, d, sd, irr, taper, seg)
      : new THREE.BoxGeometry(w, h, d);
    return createLowPolyMesh(geo, col, x, y, z, true);
  };

  // 1) 비정형 손도끼 가공 세로 원목 기둥 (하단 굵고 상단으로 갈수록 자연스럽게 가늘어짐 + 옹이 텍스처 조각)
  const vLower = mkOrg(0.42 * s, 3.1 * s, 0.38 * s, '#562b10', 0, 1.45 * s, 0, seed + 1, 0.10, 0.90, 2);
  vLower.rotation.y = 0.08;
  const vUpper = mkOrg(0.36 * s, 2.7 * s, 0.34 * s, '#633315', 0.02 * s, 4.10 * s, 0, seed + 2, 0.11, 0.88, 2);
  vUpper.rotation.z = -0.022;
  const knot1 = createLowPolyMesh(new THREE.DodecahedronGeometry(0.14 * s, 0), '#47220b', 0.16 * s, 2.15 * s, 0.12 * s, false);
  knot1.scale.set(0.85, 1.3, 0.72);
  grp.add(vLower, vUpper, knot1);

  // 2) 비정형 가로 들보 (끝단이 거칠게 다듬어진 통나무 + 살짝 비대칭 자연 기울기)
  const hBeam = mkOrg(3.35 * s, 0.34 * s, 0.30 * s, '#6e3a18', 0, 3.92 * s, 0.04 * s, seed + 5, 0.11, 0.94, 3);
  hBeam.rotation.z = 0.024;
  hBeam.rotation.y = -0.04;
  grp.add(hBeam);

  // 3) 교차점 나무 쐐기(Mortise) + 대각선 밧줄 결속 매듭
  const wedge = mkOrg(0.46 * s, 0.44 * s, 0.38 * s, '#4a230b', 0, 3.92 * s, 0.03 * s, seed + 9, 0.09, 0.96, 1);
  const ropeCol = '#ccb082';
  const strapA = mkOrg(0.54 * s, 0.11 * s, 0.44 * s, ropeCol, 0, 3.92 * s, 0.04 * s, seed + 11, 0.07, 0.96, 1);
  strapA.rotation.z = 0.76;
  const strapB = mkOrg(0.54 * s, 0.11 * s, 0.44 * s, ropeCol, 0, 3.92 * s, 0.04 * s, seed + 12, 0.07, 0.96, 1);
  strapB.rotation.z = -0.76;
  const ropeTie = mkOrg(0.46 * s, 0.10 * s, 0.42 * s, '#b89866', 0, 3.68 * s, 0.03 * s, seed + 13, 0.07, 0.96, 1);
  grp.add(wedge, strapA, strapB, ropeTie);

  // 4) 하단 목재 지지 쐐기 & 골고다 비정형 돌무더기 받침
  if (withBase) {
    const braceL = mkOrg(0.16 * s, 0.72 * s, 0.18 * s, '#4a230b', -0.28 * s, 0.48 * s, 0.05 * s, seed + 15, 0.10, 0.88, 1);
    braceL.rotation.z = -0.38;
    const braceR = mkOrg(0.16 * s, 0.68 * s, 0.18 * s, '#562b10', 0.28 * s, 0.46 * s, -0.04 * s, seed + 16, 0.10, 0.88, 1);
    braceR.rotation.z = 0.36;
    grp.add(braceL, braceR);

    const stoneCols = ['#78716c', '#94a3b8', '#a8a29e', '#64748b', '#8b8378'];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.3;
      const rad = (0.48 + (i % 2) * 0.28) * s;
      const st = createLowPolyMesh(
        new THREE.DodecahedronGeometry((0.46 + (i % 3) * 0.14) * s, 0),
        stoneCols[i % stoneCols.length],
        Math.cos(a) * rad, (0.12 + (i % 2) * 0.12) * s, Math.sin(a) * rad, true
      );
      st.scale.set(1.28, 0.62, 1.14);
      st.rotation.set(0.12 * i, a, -0.08 * (i % 3));
      grp.add(st);
    }
  }

  // 5) 중앙 십자가 상단 비정형 나무 명패
  if (withPlaque) {
    const plaque = mkOrg(0.76 * s, 0.34 * s, 0.08 * s, '#e2cfa8', 0.02 * s, 4.78 * s, 0.20 * s, seed + 21, 0.09, 0.95, 1);
    plaque.rotation.z = -0.07;
    const inkLine1 = createLowPolyMesh(new THREE.BoxGeometry(0.46 * s, 0.04 * s, 0.03 * s), '#451a03', 0.02 * s, 4.82 * s, 0.24 * s, false);
    const inkLine2 = createLowPolyMesh(new THREE.BoxGeometry(0.34 * s, 0.04 * s, 0.03 * s), '#451a03', 0.02 * s, 4.73 * s, 0.24 * s, false);
    inkLine1.rotation.z = -0.07;
    inkLine2.rotation.z = -0.07;
    grp.add(plaque, inkLine1, inkLine2);
  }

  grp.userData.crossStyle = 'organic_soft_lowpoly_v13';
  return grp;
}
window.createOrganicLowPolyCrossMesh = createOrganicLowPolyCrossMesh;

// [비정형 소프트 로우폴리 예수님의 동산 무덤 팩토리]
// - 다층 비정형 석회암 바위 절벽·처마 돌출바위·조각 석조 아치 문틀·내부 돌 침상과 개어진 세마포·굴려진 비정형 둥근 돌문 & 홈통·동산 백합꽃
function createDetailedOrganicTombGroup(opts = {}) {
  const grp = new THREE.Group();
  const s = opts.scale || 1.0;
  const openGlow = Boolean(opts.openGlow);
  const seed = opts.seed || 740;

  const mkRock = (rx, ry, rz, col, x, y, z, sd, rotX = 0, rotY = 0, rotZ = 0) => {
    const geo = (typeof createIrregularFieldstoneGeo === 'function')
      ? createIrregularFieldstoneGeo(rx * s, ry * s, rz * s, sd)
      : new THREE.DodecahedronGeometry(rx * 0.55 * s, 0);
    const m = createLowPolyMesh(geo, col, x * s, y * s, z * s, true);
    m.rotation.set(rotX, rotY, rotZ);
    return m;
  };
  const mkOrg = (w, h, d, col, x, y, z, sd, irr = 0.07, taper = 0.94, seg = 2) => {
    const geo = (typeof createOrganicBoxGeo === 'function')
      ? createOrganicBoxGeo(w * s, h * s, d * s, sd, irr, taper, seg)
      : new THREE.BoxGeometry(w * s, h * s, d * s);
    return createLowPolyMesh(geo, col, x * s, y * s, z * s, true);
  };

  // 입구 방향은 +Z(오픈월드: 북쪽에서 남쪽을 봄은 rotY = Math.PI로 회전, 스테이지4: +Z 남쪽을 정면으로 봄!)
  // 1) 다층 비정형 바위 절벽 몸체 (입구 중앙 x ∈ [-1.65, +1.65], z > 0 공간은 완전히 비워 방해 바위 0%)
  const backMain  = mkRock(9.6, 5.4, 5.8, '#8f9bb0',  0.0, 2.55, -4.4, seed + 1,  0.04, 0.08, -0.03);
  const backCrest = mkRock(7.4, 3.2, 4.4, '#a2aec2', -0.4, 4.75, -3.6, seed + 2, -0.05, 0.22,  0.04);
  const leftMass  = mkRock(5.4, 4.6, 5.4, '#8492a6', -4.7, 2.15, -1.3, seed + 3,  0.06, 0.35, -0.08);
  const rightMass = mkRock(5.4, 4.6, 5.4, '#8492a6',  4.7, 2.15, -1.3, seed + 4, -0.04, -0.28, 0.07);
  const leftFlank = mkRock(3.6, 2.6, 3.8, '#94a3b8', -6.6, 1.15,  0.4, seed + 5,  0.08, 0.52, -0.10);
  const rightFlank= mkRock(3.6, 2.6, 3.8, '#94a3b8',  6.6, 1.15,  0.4, seed + 6, -0.06, -0.46, 0.09);
  const browTop   = mkRock(6.8, 2.2, 4.2, '#9aa8bc',  0.1, 4.65, -0.8, seed + 7,  0.07, 0.10, -0.04);
  const browRidgeL= mkRock(3.2, 1.5, 2.6, '#b0bccd', -2.6, 4.25, -0.1, seed + 8,  0.05, 0.42,  0.14);
  const browRidgeR= mkRock(3.2, 1.5, 2.6, '#b0bccd',  2.7, 4.18, -0.1, seed + 9, -0.04, -0.38, -0.12);
  grp.add(backMain, backCrest, leftMass, rightMass, leftFlank, rightFlank, browTop, browRidgeL, browRidgeR);

  // 2) 비정형 손으로 깎아낸 석조 아치 문틀 (좌·우 기둥 + 인방보 + 쐐기돌 + 디딤 문턱)
  const jambL   = mkOrg(0.82, 3.25, 1.55, '#bfb4a2', -1.68, 1.62, 0.85, seed + 11, 0.07, 0.94, 2);
  const jambR   = mkOrg(0.82, 3.25, 1.55, '#bfb4a2',  1.68, 1.62, 0.85, seed + 12, 0.07, 0.94, 2);
  const lintel  = mkOrg(4.55, 0.78, 1.78, '#cfc5b4',  0.00, 3.42, 0.92, seed + 13, 0.08, 0.95, 2);
  const keystone= mkOrg(1.05, 0.62, 1.92, '#d8d0c2',  0.00, 3.68, 1.02, seed + 14, 0.09, 0.88, 1);
  const sill    = mkOrg(4.25, 0.24, 1.65, '#a89f91',  0.00, 0.12, 1.05, seed + 15, 0.06, 0.98, 1);
  grp.add(jambL, jambR, lintel, keystone, sill);

  // 3) 무덤 내부 공간 + 깎아 만든 돌 침상(Burial Bench) + 정갈히 개어진 흰 세마포 천!
  const chamberBackCol = openGlow ? '#fef08a' : '#1e293b';
  const chamberFloorCol = openGlow ? '#fde68a' : '#334155';
  const chamberBack = createLowPolyMesh(new THREE.BoxGeometry(2.65 * s, 3.05 * s, 0.30 * s), chamberBackCol, 0, 1.62 * s, -0.55 * s, false);
  if (openGlow) chamberBack.userData._emissiveGlow = true;
  const chamberFloor = createLowPolyMesh(new THREE.BoxGeometry(2.70 * s, 0.14 * s, 2.2 * s), chamberFloorCol, 0, 0.16 * s, 0.25 * s, false);
  // 내부 돌 침상 & 흰 세마포 + 갠 수건
  const bench = mkOrg(1.85, 0.62, 0.92, openGlow ? '#e2d9c8' : '#64748b', 0.15, 0.48, -0.05, seed + 18, 0.05, 0.96, 1);
  const linenBody = mkOrg(1.10, 0.16, 0.66, '#f8fafc', -0.05, 0.86, -0.05, seed + 19, 0.08, 0.94, 1);
  const linenNapkin = mkOrg(0.42, 0.20, 0.42, '#e2e8f0', 0.68, 0.88, -0.04, seed + 20, 0.10, 0.90, 1);
  if (openGlow) {
    linenBody.userData._emissiveGlow = true;
    linenNapkin.userData._emissiveGlow = true;
  }
  grp.add(chamberBack, chamberFloor, bench, linenBody, linenNapkin);

  // 4) 굴려진 비정형 둥근 돌문 (돌문 홈통 트랙 + 다면체 원반 바위)
  const grooveTrack = mkOrg(6.6, 0.22, 0.72, '#9a9285', 1.2, 0.11, 2.02, seed + 22, 0.05, 0.98, 2);
  const wheelGeoIdx = new THREE.CylinderGeometry(1.78 * s, 1.84 * s, 0.74 * s, 11, 2);
  const wPos = wheelGeoIdx.attributes.position;
  for (let i = 0; i < wPos.count; i++) {
    const vx = wPos.getX(i), vy = wPos.getY(i), vz = wPos.getZ(i);
    const n = (Math.sin(vx * 4.3 + vz * 5.7 + seed) * 0.09) + (Math.cos(vy * 6.1 - vx * 3.1) * 0.05);
    wPos.setXYZ(i, vx * (1 + n), vy * (1 + n * 0.5), vz * (1 + n));
  }
  const wheelGeo = wheelGeoIdx.toNonIndexed();
  wheelGeo.computeVertexNormals();
  wheelGeoIdx.dispose();
  const rolledStone = new THREE.Mesh(wheelGeo, matLowPoly('#cbd5e1'));
  rolledStone.position.set(3.45 * s, 1.78 * s, 2.02 * s);
  rolledStone.rotation.set(Math.PI * 0.5, 0.08, 0.16);
  rolledStone.castShadow = true;
  rolledStone.receiveShadow = true;
  const stoneChock = mkRock(0.95, 0.52, 0.85, '#78716c', 4.65, 0.22, 2.15, seed + 25, 0.1, 0.4, 0);
  grp.add(grooveTrack, rolledStone, stoneChock);

  // 5) 바위 틈 이끼 덩굴 + 동산 백합꽃 + 입구 디딤돌 3개
  [[-3.6, 3.15, 0.3], [2.9, 3.55, 0.2], [-1.8, 4.45, 0.1], [4.5, 2.95, 0.6], [-5.2, 1.95, 1.1]].forEach(([mx, my, mz], mi) => {
    const moss = createLowPolyMesh(new THREE.DodecahedronGeometry((0.52 + (mi % 2) * 0.18) * s, 0), mi % 2 === 0 ? '#65a30d' : '#4d7c0f', mx * s, my * s, mz * s, false);
    moss.scale.set(1.45, 0.48, 1.15);
    grp.add(moss);
  });
  [[-2.8, 2.35], [-3.4, 2.95], [2.2, 2.85]].forEach(([fx, fz], fi) => {
    const stem = createLowPolyMesh(new THREE.CylinderGeometry(0.04 * s, 0.05 * s, 0.55 * s, 4), '#4d7c0f', fx * s, 0.28 * s, fz * s, false);
    const bloom = createLowPolyMesh(new THREE.DodecahedronGeometry(0.16 * s, 0), fi === 1 ? '#fef08a' : '#f8fafc', fx * s, 0.58 * s, fz * s, false);
    grp.add(stem, bloom);
  });
  [[0, 2.85], [-0.45, 4.10], [0.35, 5.25]].forEach(([sx, sz], si) => {
    const stepStone = mkOrg(1.45, 0.14, 0.92, si % 2 === 0 ? '#cfc5b4' : '#b8afa0', sx, 0.06, sz, seed + 30 + si, 0.09, 0.94, 1);
    stepStone.rotation.y = (si - 1) * 0.22;
    grp.add(stepStone);
  });

  grp.userData.tombStyle = 'detailed_organic_soft_lowpoly_v13';
  grp.userData.wallRocks = [backMain, leftMass, rightMass];
  return grp;
}
window.createDetailedOrganicTombGroup = createDetailedOrganicTombGroup;

// -------------------------------------------------------------------------
// 6-B. 공용 비정형 소프트 로우폴리 갈릴리 선착장 다리 & 스테이지 공용 로우폴리 지형/돌담/벽돌포장 팩토리
// -------------------------------------------------------------------------
function createOrganicGalileePierGroup(length = 12.8, width = 3.8, seed = 41) {
  const grp = new THREE.Group();
  const hash1 = (v) => {
    const s = Math.sin(v * 127.1 + 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
  const plankCols = ['#8e4c1d', '#9b5826', '#7b4017', '#a76530', '#85461b'];
  const postCols  = ['#5c2d0c', '#4a2308', '#6b3612'];
  const ropeCol   = '#d6b685';
  const stoneCols = ['#94a3b8', '#a8a29e', '#78716c'];

  const halfL = length * 0.5;
  const halfW = width * 0.5;

  // 1) 물가 쪽 자연스러운 비정형 돌받침(Shoreline Abutment — +X 쪽이 육지, -X 쪽이 바다)
  for (let i = 0; i < 6; i++) {
    const s = seed + i * 11;
    const rx = halfL - 0.5 + (hash1(s) - 0.5) * 1.1;
    const rz = -halfW * 0.92 + (i / 5) * (width * 0.92) + (hash1(s + 1) - 0.5) * 0.35;
    const rad = 0.55 + hash1(s + 2) * 0.34;
    const st = createLowPolyMesh(new THREE.DodecahedronGeometry(rad, 0), stoneCols[i % stoneCols.length], rx, -0.08 + hash1(s + 3) * 0.12, rz, true);
    st.scale.set(1.25, 0.62, 1.08);
    st.rotation.set(hash1(s + 4) * 0.3, hash1(s + 5) * 3.1, 0);
    grp.add(st);
  }

  // 2) 좌·우 비정형 측면 장선(Stringers) — 3개 구간으로 나누어 살짝 굽어지고 들쭉날쭉한 고목 느낌
  const segs = 3;
  const segL = length / segs;
  [-1, 1].forEach((side, si) => {
    for (let k = 0; k < segs; k++) {
      const sx = -halfL + (k + 0.5) * segL;
      const waveZ = Math.sin((k + 0.5) * 1.4 + si) * 0.10;
      const beam = createLowPolyMesh(
        createOrganicBoxGeo(segL + 0.25, 0.24, 0.26, seed + 30 + si * 7 + k, 0.06, 0.95, 1),
        '#6b3813',
        sx, 0.04, side * (halfW * 0.78) + waveZ, false
      );
      beam.rotation.y = (hash1(seed + 40 + k + si * 5) - 0.5) * 0.05;
      grp.add(beam);
    }
  });

  // 3) 비정형 들쭉날쭉 목재 판자 데크(19개) — 판자마다 길이·너비·높이·기울기 미세 변형
  const plankCount = 19;
  const stepX = length / plankCount;
  for (let i = 0; i < plankCount; i++) {
    const s = seed + 100 + i * 13;
    const px = -halfL + (i + 0.5) * stepX;
    // 바다 끝(-X) 쪽으로 갈수록 살짝 넓어졌다 좁아지는 자연스러운 비정형 실루엣
    const tEnd = i / (plankCount - 1);
    const organicWave = Math.sin(tEnd * Math.PI * 2.3 + 0.4) * 0.24;
    const pLenZ = width * (0.93 + hash1(s) * 0.18) + organicWave;
    const pWidX = stepX * (0.84 + hash1(s + 1) * 0.12);
    const pThickY = 0.16 + hash1(s + 2) * 0.05;
    const zShift = (hash1(s + 3) - 0.5) * 0.28 + Math.sin(tEnd * Math.PI * 1.6) * 0.14;
    const col = plankCols[Math.floor(hash1(s + 4) * plankCols.length) % plankCols.length];

    const plank = createLowPolyMesh(
      createOrganicBoxGeo(pWidX, pThickY, pLenZ, s, 0.07, 0.96, 1),
      col,
      px, 0.24 + (hash1(s + 5) - 0.5) * 0.035, zShift, true
    );
    plank.rotation.y = (hash1(s + 6) - 0.5) * 0.055;
    plank.rotation.z = (hash1(s + 7) - 0.5) * 0.025;
    grp.add(plank);
  }

  // 4) 4쌍의 비정형 통나무 말뚝(Pilings) & 계류용 밧줄 고리(Bollards) & 수중 가로 버팀목
  const pileXs = [-halfL + 0.7, -halfL + 4.3, -halfL + 8.1, halfL - 1.3];
  pileXs.forEach((px, pi) => {
    const s = seed + 300 + pi * 19;
    const crossBeam = createLowPolyMesh(
      createOrganicBoxGeo(0.24, 0.22, width * 0.96, s, 0.06, 0.96, 1),
      '#5c2d0c', px, -0.06, 0, false
    );
    grp.add(crossBeam);

    [-1, 1].forEach((side, si) => {
      const ps = s + si * 7;
      const isFrontBollard = (pi <= 1);
      const pileH = isFrontBollard ? 3.25 : 2.75;
      const topY = isFrontBollard ? 0.92 : 0.48;
      const pz = side * (halfW * 0.88 + (hash1(ps) - 0.5) * 0.18);
      const radTop = 0.18 + hash1(ps + 1) * 0.05;
      const radBot = radTop + 0.07;

      const pile = createLowPolyMesh(
        new THREE.CylinderGeometry(radTop, radBot, pileH, 6),
        postCols[(pi + si) % postCols.length],
        px + (hash1(ps + 2) - 0.5) * 0.16,
        topY - pileH * 0.5,
        pz, true
      );
      pile.rotation.x = (hash1(ps + 3) - 0.5) * 0.09;
      pile.rotation.z = (hash1(ps + 4) - 0.5) * 0.09;
      grp.add(pile);

      // 계류용 밧줄 감김 표현
      if (isFrontBollard) {
        const ropeRing = createLowPolyMesh(
          new THREE.TorusGeometry(radTop + 0.04, 0.045, 5, 7),
          ropeCol,
          pile.position.x, topY - 0.24, pz, false
        );
        ropeRing.rotation.x = Math.PI / 2 + 0.1;
        grp.add(ropeRing);
      }
    });
  });

  // 5) 선착장 위 소소한 어부 소품 (나무 상자 + 감긴 밧줄 + 토기 항아리, 통행 방해 없도록 가장자리 배치)
  const crate = createLowPolyMesh(createOrganicBoxGeo(0.82, 0.52, 0.68, seed + 410, 0.07, 0.95, 1), '#a16207', halfL - 2.6, 0.58, halfW * 0.62, true);
  crate.rotation.y = 0.28;
  const ropeCoil = createLowPolyMesh(new THREE.TorusGeometry(0.28, 0.08, 5, 8), ropeCol, -halfL + 1.8, 0.36, -halfW * 0.58, false);
  ropeCoil.rotation.x = Math.PI / 2;
  grp.add(crate, ropeCoil);

  if (typeof mergeStaticLowPolyGroupToVertexColor === 'function') {
    mergeStaticLowPolyGroupToVertexColor(grp, { registerWall: false, castShadow: true });
    grp.traverse(ch => { if (ch.isMesh) ch.receiveShadow = true; });
  }
  return grp;
}

// 스테이지 공용: 오픈월드와 동일한 비인덱스 플랫 로우 폴리곤 지형 빌더
function createCrispLowPolyFacetedTerrain(width, depth, segX, segZ, heightFn, colorFn, jitterAmt = 0.72) {
  const indexedGeo = new THREE.PlaneGeometry(width, depth, segX, segZ);
  indexedGeo.rotateX(-Math.PI / 2);

  const hash2 = (x, z) => {
    const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
    return s - Math.floor(s);
  };

  const halfW = width * 0.48;
  const halfD = depth * 0.48;
  const posIdx = indexedGeo.attributes.position;
  for (let i = 0; i < posIdx.count; i++) {
    let vx = posIdx.getX(i);
    let vz = posIdx.getZ(i);
    if (jitterAmt > 0 && Math.abs(vx) < halfW && Math.abs(vz) < halfD) {
      vx += (hash2(vx, vz) - 0.5) * jitterAmt;
      vz += (hash2(vz + 17.3, vx - 9.1) - 0.5) * jitterAmt;
    }
    const vy = heightFn(vx, vz);
    posIdx.setXYZ(i, vx, vy, vz);
  }

  const geo = indexedGeo.toNonIndexed();
  indexedGeo.dispose();

  const posAttr = geo.attributes.position;
  const colors = new Float32Array(posAttr.count * 3);
  const vA = new THREE.Vector3(), vB = new THREE.Vector3(), vC = new THREE.Vector3();
  const e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), nrm = new THREE.Vector3();
  const fCol = new THREE.Color();

  for (let i = 0; i + 2 < posAttr.count; i += 3) {
    vA.set(posAttr.getX(i),     posAttr.getY(i),     posAttr.getZ(i));
    vB.set(posAttr.getX(i + 1), posAttr.getY(i + 1), posAttr.getZ(i + 1));
    vC.set(posAttr.getX(i + 2), posAttr.getY(i + 2), posAttr.getZ(i + 2));

    const mx = (vA.x + vB.x + vC.x) / 3;
    const my = (vA.y + vB.y + vC.y) / 3;
    const mz = (vA.z + vB.z + vC.z) / 3;

    e1.subVectors(vB, vA);
    e2.subVectors(vC, vA);
    nrm.crossVectors(e1, e2).normalize();
    const slopeFlat = Math.abs(nrm.y);

    colorFn(mx, my, mz, slopeFlat, hash2, fCol);

    const faceTone = (hash2(mx * 1.7 + i * 0.01, mz * 1.9) - 0.5) * 0.068;
    fCol.offsetHSL(0, 0, faceTone);

    for (let k = 0; k < 3; k++) {
      colors[(i + k) * 3]     = fCol.r;
      colors[(i + k) * 3 + 1] = fCol.g;
      colors[(i + k) * 3 + 2] = fCol.b;
    }
  }

  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
  mesh.receiveShadow = true;
  mesh.userData._isGroundSurface = true;
  return mesh;
}

// 첨부 레퍼런스 돌담 스타일: 모서리가 깎이고 둥근 다면체 비정형 자연석(Fieldstone) 지오메트리 생성기
// - 직사각형 벽돌 대신 십이면체 기반 베벨 쿠션(Superellipsoid) + 정점별 비정형 요철 변형으로 자연스럽게 맞물리는 돌담 구현!
function createIrregularFieldstoneGeo(bw = 0.85, bh = 0.44, bd = 1.15, seed = 1) {
  const raw = new THREE.DodecahedronGeometry(1.0, 0);
  const geo = raw.index ? raw.toNonIndexed() : raw;
  if (geo !== raw && typeof raw.dispose === 'function') raw.dispose();
  const pos = geo.attributes.position;
  const h3 = (x, y, z, s) => {
    const v = Math.sin(Math.round(x * 100) * 12.9898 + Math.round(y * 100) * 78.233 + Math.round(z * 100) * 37.719 + s * 19.3) * 43758.5453;
    return v - Math.floor(v);
  };
  const spow = (v, p) => (v < 0 ? -Math.pow(-v, p) : Math.pow(v, p));
  for (let i = 0; i < pos.count; i++) {
    const ox = pos.getX(i), oy = pos.getY(i), oz = pos.getZ(i);
    // 다면체 꼭짓점을 부드럽게 각진 자연석 쿠션 형태로 다듬기
    let x = spow(ox, 0.76);
    let y = spow(oy, 0.72);
    let z = spow(oz, 0.76);
    // 윗면·아랫면을 살짝 평평하게 눌러 돌담끼리 안정적으로 포개져 쌓이도록 보정
    if (Math.abs(y) > 0.72) y = Math.sign(y) * (0.72 + (Math.abs(y) - 0.72) * 0.45);
    const jx = (h3(ox, oy, oz, seed + 1) - 0.5) * 0.22;
    const jy = (h3(ox, oy, oz, seed + 2) - 0.5) * 0.16;
    const jz = (h3(ox, oy, oz, seed + 3) - 0.5) * 0.22;
    pos.setXYZ(
      i,
      (x + jx) * (bw * 0.62),
      (y + jy) * (bh * 0.74),
      (z + jz) * (bd * 0.62)
    );
  }
  if (typeof geo.computeVertexNormals === 'function') geo.computeVertexNormals();
  return geo;
}
window.createIrregularFieldstoneGeo = createIrregularFieldstoneGeo;

// 스테이지 공용: 언덕 계단식 비정형 자연석 돌담 빌더 (전체 1 드로우콜 병합)
function buildStageDryStoneTerraceWalls(curves, heightFn, seedBase = 700) {
  const stoneWallGrp = new THREE.Group();
  const stoneCols = ['#ede0c8', '#e1cda9', '#d4bc94', '#c6aa80', '#f2e7d3', '#baa078'];
  const hash1 = (v) => {
    const s = Math.sin(v * 127.1 + 311.7) * 43758.5453;
    return s - Math.floor(s);
  };

  curves.forEach((curve, ci) => {
    const pts = curve.pts || curve;
    const courses = curve.courses || 3;
    for (let p = 0; p < pts.length - 1; p++) {
      const [x0, z0] = pts[p];
      const [x1, z1] = pts[p + 1];
      const segLen = Math.hypot(x1 - x0, z1 - z0);
      if (segLen < 0.5) continue;
      const yaw = Math.atan2(x1 - x0, z1 - z0);
      const stepCount = Math.max(2, Math.round(segLen / 0.88));

      for (let row = 0; row < courses; row++) {
        const stagger = (row % 2 === 0) ? 0.0 : 0.48;
        for (let k = 0; k < stepCount; k++) {
          const s = seedBase + ci * 137 + p * 43 + row * 29 + k * 7;
          const t = (k + 0.5 + stagger * 0.42 + (hash1(s + 9) - 0.5) * 0.10) / stepCount;
          if (t < 0.01 || t > 0.995) continue;
          const sx = x0 + (x1 - x0) * t;
          const sz = z0 + (z1 - z0) * t;
          const gy = heightFn(sx, sz);
          const isCapstone = (row === courses - 1);
          const bw = (isCapstone ? 0.88 : 0.82) + hash1(s) * 0.24;
          const bh = (isCapstone ? 0.36 : 0.40) + hash1(s + 1) * 0.14;
          const bd = 0.86 + hash1(s + 2) * 0.38;
          const col = stoneCols[Math.floor(hash1(s + 3) * stoneCols.length) % stoneCols.length];
          const geo = createIrregularFieldstoneGeo(bw, bh, bd, s);
          const by = gy - 0.10 + row * 0.31 + (hash1(s + 4) - 0.5) * 0.04;
          const stone = createLowPolyMesh(geo, col, sx, by, sz, true);
          stone.rotation.y = yaw + (hash1(s + 5) - 0.5) * 0.18;
          stone.rotation.z = (hash1(s + 6) - 0.5) * 0.08;
          stone.rotation.x = (hash1(s + 7) - 0.5) * 0.06;
          stoneWallGrp.add(stone);
        }
      }
    }
  });

  if (typeof mergeStaticLowPolyGroupToVertexColor === 'function') {
    mergeStaticLowPolyGroupToVertexColor(stoneWallGrp, { registerWall: false, castShadow: true });
  }
  worldGroup.add(stoneWallGrp);
  return stoneWallGrp;
}

// 스테이지 공용: 성전·마을 거리용 비정형 큰벽돌 포장 바닥 빌더 (전체 1 드로우콜 병합)
function buildStageIrregularStonePavement(rectSpecs, heightFn, seedBase = 900) {
  const paverGrp = new THREE.Group();
  const paverCols = ['#e7dcc6', '#dacbb0', '#cebd9f', '#efe5d2', '#c4b192', '#dfd2ba'];
  const hash1 = (v) => {
    const s = Math.sin(v * 91.7 + 157.3) * 43758.5453;
    return s - Math.floor(s);
  };

  let pSeed = seedBase;
  rectSpecs.forEach(rect => {
    const stepX = rect.stepX || 2.05;
    const stepZ = rect.stepZ || 1.72;
    let rowIdx = 0;
    for (let pz = rect.minZ; pz <= rect.maxZ; pz += stepZ) {
      rowIdx++;
      const stagger = (rowIdx % 2 === 0) ? 0.0 : stepX * 0.46;
      for (let px = rect.minX + stagger; px <= rect.maxX; px += stepX) {
        if (typeof rect.skipFn === 'function' && rect.skipFn(px, pz)) continue;
        const gy = heightFn(px, pz);
        const gx1 = heightFn(px + 0.8, pz);
        const gz1 = heightFn(px, pz + 0.8);
        const pw = stepX * (0.78 + hash1(pSeed) * 0.16);
        const pd = stepZ * (0.76 + hash1(pSeed + 2) * 0.17);
        const col = paverCols[Math.floor(hash1(pSeed + 3) * paverCols.length) % paverCols.length];
        const geo = createOrganicBoxGeo(pw, 0.22, pd, pSeed, 0.07, 0.95, 1);
        const slab = createLowPolyMesh(
          geo, col,
          px + (hash1(pSeed + 4) - 0.5) * 0.16,
          gy - 0.06 + (hash1(pSeed + 5) - 0.5) * 0.02,
          pz + (hash1(pSeed + 6) - 0.5) * 0.16,
          false
        );
        slab.rotation.y = (hash1(pSeed + 7) - 0.5) * 0.14;
        slab.rotation.z = Math.atan2(gx1 - gy, 0.8) * 0.65;
        slab.rotation.x = -Math.atan2(gz1 - gy, 0.8) * 0.65;
        paverGrp.add(slab);
        pSeed += 7;
      }
    }
  });

  if (typeof mergeStaticLowPolyGroupToVertexColor === 'function') {
    mergeStaticLowPolyGroupToVertexColor(paverGrp, { registerWall: false, castShadow: false });
    paverGrp.traverse(ch => { if (ch.isMesh) { ch.castShadow = false; ch.receiveShadow = true; } });
  }
  paverGrp.userData._isGroundSurface = true;
  worldGroup.add(paverGrp);
  return paverGrp;
}

// -------------------------------------------------------------------------
// 7. 기본 캐릭터 폴백 (ep4_miracle_assets.js 로드 시 정밀 버전으로 자동 대체됨)
// -------------------------------------------------------------------------
function createLowPolyPersonMesh(preset = 'disciple', idx = 0) {
  const g = new THREE.Group();
  const lLeg = new THREE.Group(); lLeg.position.set(-0.15, 0.52, 0);
  const rLeg = new THREE.Group(); rLeg.position.set( 0.15, 0.52, 0);
  const lArm = new THREE.Group(); lArm.position.set(-0.27, 1.46, 0);
  const rArm = new THREE.Group(); rArm.position.set( 0.27, 1.46, 0);
  const head = new THREE.Group(); head.position.set(0, 2.02, 0);
  const body = createLowPolyMesh(new THREE.CylinderGeometry(0.24, 0.42, 1.35, 10), '#8d6649', 0, 0.85, 0, true);
  head.add(createLowPolyMesh(new THREE.BoxGeometry(0.50, 0.50, 0.42), '#eccab0', 0, 0, 0, true));
  g.add(lLeg, rLeg, body, lArm, rArm, head);
  g.userData = { lLeg, rLeg, lArm, rArm, head, walkPhase: idx * 0.9 };
  return g;
}

function createMiracleHeroMesh() {
  const g = createLowPolyPersonMesh('hero', 0);
  const u = g.userData;
  const toolGrp = new THREE.Group();
  toolGrp.visible = false;
  u.lArm.add(toolGrp);
  carriedBlockGroup = new THREE.Group();
  carriedBlockGroup.position.set(0, 1.22, -0.36);
  g.add(carriedBlockGroup);
  playerLimbs = { lLeg: u.lLeg, rLeg: u.rLeg, lArm: u.lArm, rArm: u.rArm, axeTool: toolGrp };
  return g;
}

// -------------------------------------------------------------------------
// 8. 에피소드 4 전용 커스텀 UI ('나의 복음서 수첩' & 미션 거절 + [🔄 미션 다시하기] 대화창)
// -------------------------------------------------------------------------
let currentNotebookTab = 'all';

function ensureMiracleCustomUI() {
  let uiRoot = document.getElementById('miracle-custom-ui');
  if (!uiRoot) {
    uiRoot = document.createElement('div');
    uiRoot.id = 'miracle-custom-ui';
    uiRoot.className = 'fixed inset-0 pointer-events-none z-20 flex flex-col items-center';
    uiRoot.innerHTML = `
      <div id="miracle-hud-left" class="hidden fixed left-2 sm:left-3 z-20 flex flex-col items-start gap-2 pointer-events-auto" style="top: 86px;">
        <!-- 가죽 양장 책 모양 + 디바이스 가변형 크기 복음서 수첩 버튼 -->
        <button id="miracle-notebook-btn" type="button" onclick="openMiracleNotebookModal('all')" aria-label="나의 복음서 수첩 열기"
                class="miracle-book-btn font-jua">
          <svg class="book-emblem" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="2" width="18" height="20" rx="2.5" stroke="#fde68a" stroke-width="1.8" fill="rgba(251,191,36,0.14)"/>
            <path d="M12 6.5V17.5M8.5 10H15.5" stroke="#fde047" stroke-width="2.2" stroke-linecap="round"/>
          </svg>
          <span class="book-title">복음서 수첩</span>
          <span id="miracle-notebook-badge-text" class="book-count">0/36</span>
        </button>

        <!-- [소년반 전용] 초슬림 미니 나침반/거리 내비게이터 (모바일 세로·가로형 화면 가림 최소화) -->
        <div id="miracle-mini-nav" class="hidden miracle-mini-nav" title="목표 방향과 거리 안내">
          <div class="nav-dial">
            <svg id="miracle-nav-arrow" class="nav-arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 2L18.5 19.5L12 15.5L5.5 19.5L12 2Z" fill="#fde047" stroke="#92400e" stroke-width="1.4" stroke-linejoin="round"/>
            </svg>
          </div>
          <span id="miracle-nav-target" class="font-jua text-[10px] sm:text-[11px] text-amber-100 truncate flex-1">목표 탐색</span>
          <span id="miracle-nav-dist" class="font-jua text-[10px] sm:text-[11px] text-emerald-300 shrink-0">0m</span>
        </div>

        <div id="miracle-parable-banner" class="hidden px-2.5 py-1 rounded-xl bg-emerald-900/90 border border-emerald-300 text-emerald-100 font-jua text-[11px] shadow">
          🌱 예수님이 들려주신 비유 체험
        </div>

        <!-- 진행중인 오픈월드 미션 실시간 상태창 -->
        <div id="miracle-mission-status-box" class="hidden w-[224px] sm:w-[258px] p-2.5 rounded-2xl bg-slate-900/88 border-2 border-amber-300 text-white shadow-xl backdrop-blur-sm">
          <div class="flex items-center justify-between gap-1.5 mb-1">
            <span id="miracle-ms-title" class="font-jua text-xs sm:text-sm text-amber-300 truncate">✨ 미션 진행중</span>
            <button type="button" onclick="if (typeof window.cancelActiveMiracleFieldEvent === 'function') window.cancelActiveMiracleFieldEvent();"
                    class="px-1.5 py-0.5 rounded-lg bg-rose-500/85 hover:bg-rose-500 text-[10px] font-jua text-white shrink-0">
              포기 ✕
            </button>
          </div>
          <p id="miracle-ms-goal" class="text-[11px] sm:text-xs text-slate-100 leading-snug mb-1.5"></p>
          <div class="flex items-center justify-between gap-2">
            <span id="miracle-ms-progress" class="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-jua text-[11px]">0 / 1</span>
            <span id="miracle-ms-extra" class="text-[10px] font-bold text-sky-200 truncate"></span>
          </div>
          <div id="miracle-ms-dist-wrap" class="hidden mt-1.5">
            <div class="w-full h-1.5 rounded-full bg-slate-700 overflow-hidden">
              <div id="miracle-ms-dist-bar" class="h-full bg-emerald-400 transition-all duration-100" style="width: 100%;"></div>
            </div>
          </div>
        </div>

        <button id="miracle-return-openworld-btn" type="button" onclick="returnToMiracleOpenWorld()"
                class="hidden mc-btn px-3 py-1 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-jua text-xs shadow">
          🗺️ 오픈월드로 돌아가기
        </button>
      </div>

      <!-- [씨 뿌리기 미니게임 전용] 좋은 땅 완성 시 등장하는 씨앗 뿌리기 버튼 -->
      <div id="miracle-sower-btn-wrap" class="hidden fixed bottom-24 sm:bottom-28 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
        <button id="miracle-sower-sow-btn" type="button" onclick="if (typeof window.triggerMiracleSowerPlant === 'function') window.triggerMiracleSowerPlant();"
                class="mc-btn px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 border-4 border-amber-300 text-white font-jua text-base sm:text-lg shadow-2xl animate-bounce">
          🌱 좋은 땅에 씨앗 뿌리기!
        </button>
      </div>

      <!-- [부활 이후 갈릴리 바닷가 아침식사 전용] 낚시(힘 조절 투척 + 랜덤 입질 게이지) & 모닥불 생선 굽기 UI -->
      <div id="miracle-breakfast-ui" class="hidden fixed bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 z-30 pointer-events-auto w-[92%] max-w-[348px] bg-slate-900/90 border-2 border-amber-300 rounded-2xl p-3 text-white shadow-2xl backdrop-blur-sm flex flex-col gap-2">
        <div class="flex items-center justify-between gap-2">
          <span id="miracle-bf-phase" class="font-jua text-xs sm:text-sm text-amber-300">🎣 갈릴리 바닷가 낚시</span>
          <span id="miracle-bf-count" class="px-2 py-0.5 rounded-full bg-sky-500 text-slate-950 font-jua text-[11px]">🐟 0 / 3</span>
        </div>
        <p id="miracle-bf-hint" class="text-[11px] sm:text-xs text-slate-100 leading-snug text-center">버튼을 길게 누를수록 멀리 던져 물고기가 더 잘 잡혀요!</p>

        <!-- 1단계: 투척 힘 게이지 바 -->
        <div id="miracle-bf-cast-wrap" class="flex flex-col gap-1">
          <div class="w-full h-4 rounded-full bg-slate-800 border border-slate-500 overflow-hidden relative">
            <div id="miracle-bf-power-bar" class="h-full bg-gradient-to-r from-sky-400 via-emerald-400 to-amber-400" style="width: 0%;"></div>
            <span id="miracle-bf-power-label" class="absolute inset-0 flex items-center justify-center font-jua text-[10px] text-white drop-shadow">힘 0%</span>
          </div>
          <div class="flex justify-between text-[10px] text-slate-300 px-1">
            <span>가까이 (느린 입질)</span>
            <span class="text-amber-300 font-bold">멀리 던질수록 잘 잡혀요! 🌊</span>
          </div>
        </div>

        <!-- 2단계: 입질 타이밍 게이지 바 (랜덤 구간 + 랜덤 이동 속도) -->
        <div id="miracle-bf-bite-wrap" class="hidden flex flex-col gap-1">
          <div class="w-full h-6 rounded-full bg-slate-800 border-2 border-amber-300 overflow-hidden relative">
            <div id="miracle-bf-zone" class="absolute top-0 bottom-0 bg-emerald-400/85 border-x-2 border-white" style="left: 35%; width: 24%;"></div>
            <div id="miracle-bf-needle" class="absolute top-0 bottom-0 w-2 -ml-1 bg-rose-500 border border-white rounded-full shadow" style="left: 10%;"></div>
          </div>
          <div class="text-[10px] text-center text-emerald-300 font-jua">⚡ 빨간 바늘이 초록 구간에 들어왔을 때 버튼을 누르세요!</div>
        </div>

        <!-- 3단계: 모닥불 물고기 굽기 게이지 바 (너무 오래 두면 타버림!) -->
        <div id="miracle-bf-cook-wrap" class="hidden flex flex-col gap-1">
          <div class="w-full h-5 rounded-full bg-slate-800 border border-amber-300 overflow-hidden relative">
            <div class="absolute inset-y-0 left-0 bg-sky-400/35" style="width: 44%;"></div>
            <div class="absolute inset-y-0 bg-emerald-400/65 border-x border-amber-200" style="left: 44%; width: 46%;"></div>
            <div class="absolute inset-y-0 right-0 bg-rose-600/75" style="width: 10%;"></div>
            <div id="miracle-bf-cook-bar" class="h-full bg-gradient-to-r from-amber-300 via-orange-500 to-rose-600 transition-none" style="width: 0%;"></div>
            <span id="miracle-bf-cook-label" class="absolute inset-0 flex items-center justify-center font-jua text-[10px] text-white drop-shadow">굽기 준비</span>
          </div>
          <div class="flex justify-between text-[10px] px-1">
            <span class="text-sky-300">덜 익음</span>
            <span class="text-emerald-300 font-bold">✨ 노릇노릇 (꺼내기!)</span>
            <span class="text-rose-400 font-bold">🔥 탄다!</span>
          </div>
        </div>

        <button id="miracle-bf-action-btn" type="button"
                onpointerdown="if (typeof window.miracleBreakfastPointerDown === 'function') window.miracleBreakfastPointerDown(event);"
                onpointerup="if (typeof window.miracleBreakfastPointerUp === 'function') window.miracleBreakfastPointerUp(event);"
                onpointercancel="if (typeof window.miracleBreakfastPointerUp === 'function') window.miracleBreakfastPointerUp(event);"
                onclick="if (typeof window.miracleBreakfastClickFallback === 'function') window.miracleBreakfastClickFallback(event);"
                class="mc-btn w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 border-2 border-white text-slate-950 font-jua text-sm sm:text-base shadow-lg select-none touch-none">
          🎣 꾹 눌러서 낚시줄 던지기
        </button>
      </div>

      <div id="miracle-notebook-modal" class="hidden pointer-events-auto fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-40 flex items-center justify-center p-3">
        <div class="mc-card modal-scroll w-full max-w-2xl rounded-3xl p-4 sm:p-6 flex flex-col gap-3 max-h-[88dvh]">
          <div class="flex items-center justify-between border-b-2 border-amber-300 pb-2">
            <div class="flex items-center gap-2">
              <span class="text-2xl">📖</span>
              <div>
                <h2 class="font-jua text-lg sm:text-xl text-amber-950 leading-none">나의 복음서 수첩</h2>
                <p class="text-[11px] text-slate-600 mt-0.5">길을 걸으며 들은 소문, 직접 목격한 기적과 비유, 예수님의 말씀을 기록해요!</p>
              </div>
            </div>
            <button type="button" onclick="closeMiracleNotebookModal()" class="mc-btn px-3 py-1 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-jua text-xs">
              닫기 ✕
            </button>
          </div>

          <div class="flex flex-wrap gap-1.5" id="miracle-notebook-tabs">
            <button type="button" onclick="openMiracleNotebookModal('all')" data-tab="all" class="mc-btn px-2.5 py-1 rounded-xl font-jua text-xs bg-amber-500 text-slate-950">전체 보기</button>
            <button type="button" onclick="openMiracleNotebookModal('rumors')" data-tab="rumors" class="mc-btn px-2.5 py-1 rounded-xl font-jua text-xs bg-amber-100 text-amber-950">🟡 소문 (12)</button>
            <button type="button" onclick="openMiracleNotebookModal('miracles')" data-tab="miracles" class="mc-btn px-2.5 py-1 rounded-xl font-jua text-xs bg-amber-100 text-amber-950">✨ 기적 (7)</button>
            <button type="button" onclick="openMiracleNotebookModal('parables')" data-tab="parables" class="mc-btn px-2.5 py-1 rounded-xl font-jua text-xs bg-amber-100 text-amber-950">🌱 비유 (4)</button>
            <button type="button" onclick="openMiracleNotebookModal('words')" data-tab="words" class="mc-btn px-2.5 py-1 rounded-xl font-jua text-xs bg-amber-100 text-amber-950">📜 말씀 (10)</button>
            <button type="button" onclick="openMiracleNotebookModal('testimonies')" data-tab="testimonies" class="mc-btn px-2.5 py-1 rounded-xl font-jua text-xs bg-amber-100 text-amber-950">🕊️ 부활증언 (3)</button>
          </div>

          <div id="miracle-notebook-list" class="grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-y-auto pr-1 max-h-[54dvh]"></div>
        </div>
      </div>

      <!-- [하단 대화창: 거절 버튼 + 완료 미션 다시하기 버튼 지원] -->
      <div id="miracle-dialog-modal" class="hidden pointer-events-auto mt-auto mb-28 mc-panel bg-amber-50/95 border-4 border-amber-700 rounded-3xl p-4 max-w-md w-[92%] text-slate-900 shadow-2xl flex flex-col gap-2">
        <div class="flex items-center justify-between gap-2">
          <span id="miracle-dialog-speaker" class="px-3 py-0.5 rounded-full bg-amber-800 text-amber-100 font-jua text-xs sm:text-sm">주민</span>
          <span id="miracle-dialog-cat-badge" class="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-950 font-jua text-[11px]">🟡 소문</span>
        </div>
        <p id="miracle-dialog-text" class="font-bold text-xs sm:text-sm leading-relaxed min-h-[40px] text-slate-800"></p>
        <div id="miracle-dialog-quiz-box" class="hidden flex-col gap-1.5 mt-1"></div>
        <div class="flex flex-wrap justify-end gap-2 mt-1">
          <button id="miracle-dialog-replay-btn" type="button" onclick="replayMiracleDialogMission()" class="hidden mc-btn px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-jua text-xs sm:text-sm">
            🔄 미션 다시하기
          </button>
          <button id="miracle-dialog-cancel-btn" type="button" onclick="cancelMiracleDialog()" class="hidden mc-btn px-3.5 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-jua text-xs sm:text-sm">
            거절 (나중에 하기) ✕
          </button>
          <button id="miracle-dialog-confirm-btn" type="button" onclick="confirmMiracleDialog()" class="mc-btn px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-jua text-xs sm:text-sm">
            확인 ▶
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(uiRoot);
  }
  return uiRoot;
}

function positionMiracleLeftHudBelowTopBar() {
  const leftHud = document.getElementById('miracle-hud-left');
  if (!leftHud || leftHud.classList.contains('hidden')) return;
  const missionBox = document.getElementById('hud-mission-box');
  const hudTop = document.getElementById('hud-top');
  let safeY = 86;
  if (missionBox && !missionBox.classList.contains('hidden')) {
    const r = missionBox.getBoundingClientRect();
    if (r && r.bottom > 0) safeY = Math.max(safeY, Math.ceil(r.bottom) + 8);
  } else if (hudTop && !hudTop.classList.contains('hidden')) {
    const r = hudTop.getBoundingClientRect();
    if (r && r.bottom > 0) safeY = Math.max(safeY, Math.ceil(r.bottom) + 8);
  }
  leftHud.style.top = `${safeY}px`;
}

function updateMiracleNotebookHudBadge() {
  ensureMiracleCustomUI();
  const leftHud = document.getElementById('miracle-hud-left');
  const badgeText = document.getElementById('miracle-notebook-badge-text');
  const parBanner = document.getElementById('miracle-parable-banner');
  const retBtn = document.getElementById('miracle-return-openworld-btn');

  if (currentEpisode !== 'miracle') {
    if (leftHud) leftHud.classList.add('hidden');
    return;
  }

  if (leftHud) leftHud.classList.remove('hidden');
  positionMiracleLeftHudBelowTopBar();

  const total = getMiracleNotebookTotalCount();
  if (badgeText) {
    badgeText.textContent = `${miracleCollectedIds.size}/${total}`;
  }
  const nbBtn = document.getElementById('miracle-notebook-btn');
  if (nbBtn) {
    nbBtn.setAttribute('aria-label', `나의 복음서 수첩 (${miracleCollectedIds.size}/${total})`);
  }

  const isParableMode =
    miracleSubMode === 'minigame' &&
    miracleActiveMinigameId &&
    miracleActiveMinigameId.startsWith('par_');

  if (parBanner) {
    parBanner.classList.toggle('hidden', !isParableMode);
  }
  if (retBtn) {
    // 엔딩 세상(ascension)에서도 오픈월드로 돌아가 남은 미션·수첩을 채울 수 있도록 버튼 표시!
    retBtn.classList.toggle('hidden', miracleSubMode === 'openworld');
    retBtn.textContent = (miracleSubMode === 'ascension')
      ? '🌿 오픈월드로 돌아가기 (미션·수첩)'
      : '🗺️ 오픈월드로 돌아가기';
  }
}

window.updateMiracleMissionStatusUI = function (info) {
  ensureMiracleCustomUI();
  const box = document.getElementById('miracle-mission-status-box');
  if (!box) return;
  if (!info) {
    box.classList.add('hidden');
    return;
  }
  box.classList.remove('hidden');
  const titleEl = document.getElementById('miracle-ms-title');
  const goalEl = document.getElementById('miracle-ms-goal');
  const progEl = document.getElementById('miracle-ms-progress');
  const extraEl = document.getElementById('miracle-ms-extra');
  const distWrap = document.getElementById('miracle-ms-dist-wrap');
  const distBar = document.getElementById('miracle-ms-dist-bar');
  if (titleEl) titleEl.textContent = info.title || '✨ 미션 진행중';
  if (goalEl) goalEl.textContent = info.goal || '';
  if (progEl) progEl.textContent = info.progressText || '';
  if (extraEl) {
    extraEl.textContent = info.extraText || '';
    extraEl.className = info.warn
      ? 'text-[10px] font-bold text-rose-300 animate-pulse truncate'
      : 'text-[10px] font-bold text-sky-200 truncate';
  }
  if (distWrap && distBar) {
    if (typeof info.ratio === 'number') {
      distWrap.classList.remove('hidden');
      const pct = Math.max(0, Math.min(100, Math.round(info.ratio * 100)));
      distBar.style.width = `${pct}%`;
      distBar.className = pct < 32
        ? 'h-full bg-rose-500 transition-all duration-100'
        : (pct < 60 ? 'h-full bg-amber-400 transition-all duration-100' : 'h-full bg-emerald-400 transition-all duration-100');
    } else {
      distWrap.classList.add('hidden');
    }
  }
  positionMiracleLeftHudBelowTopBar();
};

window.hideMiracleMissionStatusUI = function () {
  const box = document.getElementById('miracle-mission-status-box');
  if (box) box.classList.add('hidden');
};

window.updateMiracleMiniNavigatorUI = function (info) {
  ensureMiracleCustomUI();
  const nav = document.getElementById('miracle-mini-nav');
  if (!nav) return;
  if (!info || !info.visible) {
    nav.classList.add('hidden');
    return;
  }
  nav.classList.remove('hidden');
  const arrowEl = document.getElementById('miracle-nav-arrow');
  const targetEl = document.getElementById('miracle-nav-target');
  const distEl = document.getElementById('miracle-nav-dist');
  if (arrowEl && typeof info.deg === 'number') {
    arrowEl.style.transform = `rotate(${Math.round(info.deg)}deg)`;
  }
  if (targetEl) targetEl.textContent = info.label || '목표 지점';
  if (distEl) distEl.textContent = info.distText || '';
};

window.openMiracleNotebookModal = function (tabKey = 'all') {
  ensureMiracleCustomUI();
  currentNotebookTab = tabKey;
  const modal = document.getElementById('miracle-notebook-modal');
  const listEl = document.getElementById('miracle-notebook-list');
  const tabsEl = document.getElementById('miracle-notebook-tabs');
  if (!modal || !listEl) return;

  playSfx('switch');
  modal.classList.remove('hidden');

  if (tabsEl) {
    Array.from(tabsEl.querySelectorAll('button')).forEach(btn => {
      const isSelected = btn.dataset.tab === tabKey;
      btn.className = isSelected
        ? 'mc-btn px-2.5 py-1 rounded-xl font-jua text-xs bg-amber-500 text-slate-950'
        : 'mc-btn px-2.5 py-1 rounded-xl font-jua text-xs bg-amber-100 text-amber-950';
    });
  }

  const groups = [
    { key: 'rumors',      badge: '🟡 소문',     items: MIRACLE_NOTEBOOK_DB.rumors },
    { key: 'miracles',    badge: '✨ 기적',     items: MIRACLE_NOTEBOOK_DB.miracles },
    { key: 'parables',    badge: '🌱 비유',     items: MIRACLE_NOTEBOOK_DB.parables },
    { key: 'words',       badge: '📜 말씀',     items: MIRACLE_NOTEBOOK_DB.words },
    { key: 'testimonies', badge: '🕊️ 부활증언', items: MIRACLE_NOTEBOOK_DB.testimonies }
  ];

  const cardsHtml = [];
  groups.forEach(grp => {
    if (tabKey !== 'all' && tabKey !== grp.key) return;
    grp.items.forEach(item => {
      const collected = miracleCollectedIds.has(item.id);
      if (collected) {
        cardsHtml.push(`
          <div class="p-3 rounded-2xl bg-white border-2 border-amber-400 text-left shadow-sm">
            <div class="flex items-center justify-between mb-1">
              <span class="px-2 py-0.5 rounded-full bg-amber-200 text-amber-950 font-jua text-[10px]">${grp.badge}</span>
              <span class="text-[10px] font-bold text-emerald-700">${item.verse || item.region || '기록 완료'}</span>
            </div>
            <div class="font-jua text-sm text-amber-950 mb-0.5">${item.title}</div>
            <p class="text-xs text-slate-700 leading-snug">${item.text || item.desc || item.verse}</p>
          </div>
        `);
      } else {
        cardsHtml.push(`
          <div class="p-3 rounded-2xl bg-slate-100 border-2 border-slate-300 text-left opacity-75">
            <div class="flex items-center justify-between mb-1">
              <span class="px-2 py-0.5 rounded-full bg-slate-300 text-slate-700 font-jua text-[10px]">${grp.badge} · 미발견</span>
              <span class="text-[10px] text-slate-500">${item.region ? item.region + ' 지역' : '탐험 중 발견 가능'}</span>
            </div>
            <div class="font-jua text-sm text-slate-500">❓ 아직 기록되지 않은 이야기</div>
            <p class="text-[11px] text-slate-400 mt-0.5">오픈월드의 사람들과 대화하거나 사건을 체험하면 수첩에 기록됩니다.</p>
          </div>
        `);
      }
    });
  });

  listEl.innerHTML = cardsHtml.join('');
};

window.closeMiracleNotebookModal = function () {
  const modal = document.getElementById('miracle-notebook-modal');
  if (modal) modal.classList.add('hidden');
};

function openMiracleDialog(options) {
  ensureMiracleCustomUI();
  const modal = document.getElementById('miracle-dialog-modal');
  const speakerEl = document.getElementById('miracle-dialog-speaker');
  const badgeEl = document.getElementById('miracle-dialog-cat-badge');
  const textEl = document.getElementById('miracle-dialog-text');
  const quizBox = document.getElementById('miracle-dialog-quiz-box');
  const confirmBtn = document.getElementById('miracle-dialog-confirm-btn');
  const cancelBtn = document.getElementById('miracle-dialog-cancel-btn');
  const replayBtn = document.getElementById('miracle-dialog-replay-btn');
  if (!modal) return;

  const catMeta = {
    rumor:      { label: '🟡 소문 (다른 사람에게 들은 이야기)', cls: 'bg-amber-200 text-amber-950' },
    eyewitness: { label: '🔵 목격담 (직접 경험한 증언)',         cls: 'bg-sky-200 text-sky-950' },
    word:       { label: '🟣 말씀 (예수님의 직접 가르침)',       cls: 'bg-purple-200 text-purple-950' },
    parable:    { label: '🌱 비유 (예수님이 들려주신 교훈 이야기)', cls: 'bg-emerald-200 text-emerald-950' },
    story:      { label: '✨ 복음서 사건 체험',                  cls: 'bg-rose-200 text-rose-950' },
    greeting:   { label: '😊 반가운 인사 (완료한 여정)',         cls: 'bg-emerald-200 text-emerald-950' }
  }[options.category || 'rumor'];

  miracleDialogState.active = true;
  miracleDialogState.activeSource = options.sourceRef || null;
  miracleDialogState.onConfirm = options.onConfirm || null;
  miracleDialogState.onCancel = options.onCancel || null;
  miracleDialogState.onReplay = options.onReplay || null;

  if (options.notebookId) {
    unlockMiracleNotebookEntry(options.notebookId, false);
  }

  speakerEl.textContent = options.speaker || '갈릴리 주민';
  badgeEl.textContent = options.badgeLabel || catMeta.label;
  badgeEl.className = `px-2.5 py-0.5 rounded-full font-jua text-[11px] ${options.badgeCls || catMeta.cls}`;
  textEl.textContent = options.text || '';
  speakText(options.text || '');

  // 완료된 미션의 인사 대화창일 때 [🔄 미션 다시하기] 버튼 표시
  if (replayBtn) {
    if (typeof options.onReplay === 'function') {
      replayBtn.classList.remove('hidden');
      replayBtn.textContent = options.replayText || '🔄 미션 다시하기';
    } else {
      replayBtn.classList.add('hidden');
    }
  }

  // 신규 미션/스테이지 수락 창일 때 [거절 (나중에 하기)] 버튼 표시
  if (cancelBtn) {
    if (typeof options.onConfirm === 'function' || options.showCancel) {
      cancelBtn.classList.remove('hidden');
      cancelBtn.textContent = options.cancelText || '거절 (나중에 하기) ✕';
    } else {
      cancelBtn.classList.add('hidden');
    }
  }

  if (options.quiz && Array.isArray(options.quiz.opts)) {
    quizBox.classList.remove('hidden');
    quizBox.classList.add('flex');
    quizBox.innerHTML = `<p class="font-jua text-xs text-amber-900 mt-1">💡 ${options.quiz.q}</p>`;
    confirmBtn.classList.add('hidden');

    const shuffledList = (typeof shuffleQuizOptions === 'function')
      ? shuffleQuizOptions(options.quiz.opts, options.quiz.ans)
      : options.quiz.opts.map((text, i) => ({ text, isCorrect: i === options.quiz.ans }));

    shuffledList.forEach((item, idx) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'mc-btn w-full py-1.5 px-3 rounded-xl bg-amber-100 hover:bg-amber-200 text-slate-900 font-bold text-xs text-left';
      b.textContent = `${idx + 1}. ${item.text}`;
      b.onclick = () => {
        if (item.isCorrect) {
          playSfx('rescue');
          b.className = 'mc-btn w-full py-1.5 px-3 rounded-xl bg-emerald-500 text-white font-bold text-xs text-left';
          confirmBtn.classList.remove('hidden');
          showToast('⭕ 정답이에요! 복음의 의미를 정확히 깨달았어요!');
        } else {
          playSfx('wrong');
          showToast('❌ 다시 한 번 생각해 볼까요?');
        }
      };
      quizBox.appendChild(b);
    });
  } else {
    quizBox.classList.add('hidden');
    quizBox.classList.remove('flex');
    confirmBtn.classList.remove('hidden');
  }

  confirmBtn.textContent = options.btnText || '확인 ▶';
  modal.classList.remove('hidden');
  playSfx('switch');
}

function stampMiracleDialogClosedCooldown() {
  const closedAt = performance.now();
  miracleDialogState.lastClosedAt = closedAt;
  const src = miracleDialogState.activeSource;
  if (src) {
    src._prompted = closedAt;
    src._requireLeaveZone = true;
  }
  miracleDialogState.activeSource = null;
}

window.confirmMiracleDialog = function () {
  const modal = document.getElementById('miracle-dialog-modal');
  if (modal) modal.classList.add('hidden');
  miracleDialogState.active = false;
  stampMiracleDialogClosedCooldown();
  const cb = miracleDialogState.onConfirm;
  miracleDialogState.onConfirm = null;
  miracleDialogState.onCancel = null;
  miracleDialogState.onReplay = null;
  if (typeof cb === 'function') cb();
};

window.cancelMiracleDialog = function () {
  const modal = document.getElementById('miracle-dialog-modal');
  if (modal) modal.classList.add('hidden');
  miracleDialogState.active = false;
  stampMiracleDialogClosedCooldown();
  const cancelCb = miracleDialogState.onCancel;
  miracleDialogState.onConfirm = null;
  miracleDialogState.onCancel = null;
  miracleDialogState.onReplay = null;
  playSfx('step');
  if (typeof cancelCb === 'function') {
    cancelCb();
  } else {
    showToast('✋ 미션을 거절했어요. 준비되면 언제든 다시 찾아오세요!');
  }
};

window.replayMiracleDialogMission = function () {
  const modal = document.getElementById('miracle-dialog-modal');
  if (modal) modal.classList.add('hidden');
  miracleDialogState.active = false;
  stampMiracleDialogClosedCooldown();
  const replayCb = miracleDialogState.onReplay;
  miracleDialogState.onConfirm = null;
  miracleDialogState.onCancel = null;
  miracleDialogState.onReplay = null;
  playSfx('switch');
  if (typeof replayCb === 'function') {
    replayCb();
  }
};

function hideAllMiracleCustomUI() {
  const leftHud = document.getElementById('miracle-hud-left');
  const msBox = document.getElementById('miracle-mission-status-box');
  const miniNav = document.getElementById('miracle-mini-nav');
  const nbModal = document.getElementById('miracle-notebook-modal');
  const dlgModal = document.getElementById('miracle-dialog-modal');
  const s1Ui = document.getElementById('miracle-s1-ui');
  const sowerWrap = document.getElementById('miracle-sower-btn-wrap');
  const bfUi = document.getElementById('miracle-breakfast-ui');
  const flareLayer = document.getElementById('miracle-sun-flare-layer');
  if (leftHud) leftHud.classList.add('hidden');
  if (msBox) msBox.classList.add('hidden');
  if (miniNav) miniNav.classList.add('hidden');
  if (nbModal) nbModal.classList.add('hidden');
  if (dlgModal) dlgModal.classList.add('hidden');
  if (s1Ui) s1Ui.classList.add('hidden');
  if (sowerWrap) sowerWrap.classList.add('hidden');
  if (bfUi) bfUi.classList.add('hidden');
  if (flareLayer) {
    flareLayer.style.opacity = '0';
    flareLayer.style.display = 'none';
  }
  miracleDialogState.active = false;
}
