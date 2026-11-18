// =========================================================================
// [ep4_miracle_base.js - 파트 1/2] 에피소드 4 : 예수님의 기적과 부활
// - 성경 말씀/퀴즈 DB, 나의 복음서 수첩(36종), 1분(60초) 갈릴리 복음서 BGM
// - 확장된 오픈월드 지형 고도 계산기(넓어진 골고다 언덕 포함) 및 소프트 로우 폴리곤 자연물 팩토리
// =========================================================================

const MIRACLE_SCRIPTURE = {
  1: {
    title: '메인 스테이지 1 클리어! 바람과 바다도 순종하는 분!',
    desc: '갈릴리 바다에서 고기를 잡고, 거센 폭풍우 속에서 물을 퍼내며 버틴 끝에 예수님이 바람과 파도를 잠잠하게 하시는 기적을 목격했어요!',
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

let miracleStageSpots = [];
let miracleEventSpots = [];
let miracleRumorNpcs = [];
let miracleAmbientProps = [];
let miracleActiveMiniState = {};
let miracleDialogState = {
  active: false,
  npc: null,
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
  try {
    const raw = localStorage.getItem(getMiracleNotebookStorageKey());
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) arr.forEach(id => miracleCollectedIds.add(id));
    }
  } catch (e) {}
  updateMiracleNotebookHudBadge();
}

function saveMiracleNotebookProgress() {
  try {
    localStorage.setItem(getMiracleNotebookStorageKey(), JSON.stringify(Array.from(miracleCollectedIds)));
  } catch (e) {}
  updateMiracleNotebookHudBadge();
}

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
// 3. [초경량 오디오 시스템]
//    - 오픈월드(openworld): 'assets/music/miracle01.ogg' 하드웨어 디코딩 루프 재생 (CPU 연산 부하 0)
//    - 메인 스테이지(1~4) 및 엔딩: 기존 Web Audio API 코드 음원 재생
// -------------------------------------------------------------------------
let _miracleOpenWorldOgg = null;

function getMiracleOpenWorldOgg() {
  if (!_miracleOpenWorldOgg) {
    // 웹 표준 경로 슬래시(/) 적용
    _miracleOpenWorldOgg = new Audio('assets/music/miracle01.ogg');
    _miracleOpenWorldOgg.loop = true;
    _miracleOpenWorldOgg.preload = 'auto';
    _miracleOpenWorldOgg.volume = 0.55;
  }
  return _miracleOpenWorldOgg;
}

function playMiracleOpenWorldOgg() {
  if (typeof currentEpisode !== 'undefined' && currentEpisode !== 'miracle') return;
  if (miracleSubMode !== 'openworld') return;

  const isMuted =
    (typeof isBgmMuted !== 'undefined' && isBgmMuted) ||
    (typeof bgmMuted !== 'undefined' && bgmMuted) ||
    (typeof isMuted !== 'undefined' && isMuted);

  const audio = getMiracleOpenWorldOgg();
  if (isMuted) {
    if (!audio.paused) audio.pause();
    return;
  }

  if (audio.paused) {
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // 모바일 브라우저 자동재생 정책 대기 시 첫 터치에 자동 재생
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
    playMiracleOpenWorldOgg();
    // 2500ms(2.5초)를 반환하여 BGM 타이머 콜백 자체가 거의 깨어나지 않도록 휴면 처리
    return 2500;
  }

  // 오픈월드가 아닌 스테이지에 들어오면 .ogg 재생을 즉시 멈추고 기존 코드 음원 재생
  stopMiracleOpenWorldOgg(false);

  // 1) 갈릴리 바다 폭풍우(스테이지 1) 또는 골고다 십자가 운반(스테이지 3) 긴장 테마
  const isStormOrCrossTension =
    (miracleSubMode === 'main1_galilee' && miracleActiveMiniState.phase === 'storm') ||
    (miracleSubMode === 'main3_cross' && miracleActiveMiniState.phase === 'carry');

  if (isStormOrCrossTension) {
    const tensionNotes = [0, 0, 3, 7, 8, 7, 5, 3, 0, 0, 5, 8, 7, 5, 3, 2];
    const tensionBass  = [-12, -12, -9, -5, -4, -5, -7, -9, -12, -12, -7, -4, -5, -7, -9, -10];
    const idx = step % tensionNotes.length;
    const stepMs = (miracleSubMode === 'main1_galilee') ? 210 : 320;
    if (!ctx) return stepMs;

    const now = ctx.currentTime;
    const dur = (stepMs / 1000) * 1.15;
    const rootMidi = (miracleSubMode === 'main1_galilee') ? 53 : 50;
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
    miracleLowPolyMatCache[key] = new THREE.MeshLambertMaterial(params);
  }
  return miracleLowPolyMatCache[key];
}

function getMiracleOpenWorldGroundHeight(x, z) {
  let h = 0.25;

  // 1) 서쪽(West, x < -70): 모래사장 없이 초원에서 넓은 바다(x < -92)까지 완만하게 내려가는 해안 경사
  const shoreLineX = -92 + Math.sin(z * 0.03) * 6.0 + Math.cos(z * 0.07) * 2.5;
  if (x < shoreLineX + 22) {
    const t = Math.max(0, (shoreLineX + 22 - x) / 22);
    const smoothSlope = t * t * (3 - Math.min(2.0, 2 * t));
    h = 0.25 - smoothSlope * 0.65;
    if (x < shoreLineX) {
      h -= (shoreLineX - x) * 0.08;
    }
    return Number(h.toFixed(3));
  }

  // 2) 동북쪽 외곽 '오병이어 전망 언덕' (x = 88, z = -82, 정상 높이 +14.5)
  const bethDist = Math.hypot((x - 88) / 46, (z - (-82)) / 42);
  if (bethDist < 1.0) {
    const t = 1.0 - bethDist;
    const bump = Math.sin(x * 0.14) * Math.cos(z * 0.14) * 0.45;
    h += t * t * (3 - 2 * t) * 14.2 + t * bump;
  }

  // 3) 잃어버린 양의 유대 광야 바위 언덕 (서중부 내륙: x = -66, z = 12)
  const wildDist = Math.hypot((x - (-66)) / 25, (z - 12) / 25);
  if (wildDist < 1.0) {
    const t = 1.0 - wildDist;
    const bump = Math.sin(x * 0.18 + 1.1) * Math.cos(z * 0.18) * 0.32;
    h += t * t * (3 - 2 * t) * 5.4 + t * bump;
  }

  // 4) [요청사항 반영] 훨씬 넓고 웅장해진 골고다 십자가 언덕 (남서쪽 내륙: x = -62, z = 78, 반경 38x35, 정상 평탄부 확보)
  const golgothaDist = Math.hypot((x - (-62)) / 38, (z - 78) / 35);
  if (golgothaDist < 1.0) {
    // 정상 부근(golgothaDist < 0.35)은 세 십자가가 넉넉히 서도록 완만한 고원 형태로 구성
    const clampedD = Math.max(0, (golgothaDist - 0.22) / 0.78);
    const t = 1.0 - Math.min(1.0, clampedD);
    const bump = Math.sin(x * 0.15) * Math.cos(z * 0.15) * 0.35;
    h += t * t * (3 - 2 * t) * 9.2 + t * bump;
  }

  // 5) 감람산 승천 언덕 (남동쪽 외곽: x = 88, z = 74)
  const oliveDist = Math.hypot((x - 88) / 34, (z - 74) / 32);
  if (oliveDist < 1.0) {
    const t = 1.0 - oliveDist;
    const bump = Math.sin(x * 0.16) * Math.cos(z * 0.16) * 0.40;
    h += t * t * (3 - 2 * t) * 9.6 + t * bump;
  }

  // 6) 북·동·남 3면 가장자리 낮은 구릉 융기
  const eastEdge = Math.max(0, (x - 108) / 28);
  const northEdge = Math.max(0, (-108 - z) / 28);
  const southEdge = Math.max(0, (z - 108) / 28);
  const edgeFactor = Math.max(eastEdge, northEdge, southEdge);
  if (edgeFactor > 0) {
    const edgeBump = Math.sin(x * 0.10) * Math.cos(z * 0.10) * 0.75;
    h += edgeFactor * edgeFactor * 4.5 + edgeFactor * edgeBump;
  }

  // 7) 마을 도로 주변 평탄화 및 초원 잔물결
  const centerRoadClearance = Math.min(1.0, Math.abs(x - Math.sin(z * 0.03) * 6.0) / 15.0);
  const gentleWave = (Math.sin(x * 0.045) * Math.cos(z * 0.045) * 0.40) * centerRoadClearance;
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

function addLowPolyOliveTree(x, z, scale = 1.0, addCol = true) {
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

function createLowPolyGalileeBoat(scale = 1.0) {
  const boatGrp = new THREE.Group();

  const hullGeo = new THREE.CylinderGeometry(2.2 * scale, 1.5 * scale, 7.6 * scale, 8);
  const hull = createLowPolyMesh(hullGeo, '#78350f', 0, 0.75 * scale, 0, true);
  hull.rotation.x = Math.PI / 2;
  hull.scale.set(1.0, 1.0, 0.48);

  const deckGeo = new THREE.BoxGeometry(3.4 * scale, 0.22 * scale, 6.8 * scale);
  const deck = createLowPolyMesh(deckGeo, '#b45309', 0, 1.12 * scale, 0, true);

  const mast = createLowPolyMesh(new THREE.CylinderGeometry(0.12 * scale, 0.16 * scale, 5.8 * scale, 6), '#451a03', 0, 3.8 * scale, -0.4 * scale, true);
  const yard = createLowPolyMesh(new THREE.CylinderGeometry(0.08 * scale, 0.08 * scale, 4.2 * scale, 6), '#5c2d0c', 0, 5.2 * scale, -0.4 * scale, true);
  yard.rotation.z = Math.PI / 2;

  const sailGeo = new THREE.ConeGeometry(2.4 * scale, 3.6 * scale, 4);
  const sail = createLowPolyMesh(sailGeo, '#fef3c7', 0, 3.9 * scale, 0.05 * scale, true);
  sail.scale.set(1.1, 1.0, 0.22);
  sail.rotation.y = Math.PI / 4;

  boatGrp.add(hull, deck, mast, yard, sail);
  boatGrp.userData = { hull, deck, sail };
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

// 비정형(Organic) 창틀과 창문 조립기
function createOrganicWindowGroup(winW, winH, frameHex, sillHex, voidHex, seed = 1) {
  const winGrp = new THREE.Group();

  const paneVoid = createLowPolyMesh(new THREE.BoxGeometry(winW, winH, 0.14), voidHex, 0, 0, 0, false);
  const mullionV = createLowPolyMesh(createOrganicBoxGeo(0.08, winH, 0.18, seed + 1, 0.08, 0.95, 1), frameHex, 0, 0, 0.02, true);
  winGrp.add(paneVoid, mullionV);

  const topLintel = createLowPolyMesh(
    createOrganicBoxGeo(winW + 0.42, 0.22, 0.26, seed + 2, 0.12, 0.92, 2),
    frameHex,
    (_organicHash(seed) - 0.5) * 0.05,
    winH * 0.5 + 0.08,
    0.05,
    true
  );
  topLintel.rotation.z = (_organicHash(seed + 3) - 0.5) * 0.07;

  const botSill = createLowPolyMesh(
    createOrganicBoxGeo(winW + 0.38, 0.18, 0.28, seed + 4, 0.12, 1.04, 2),
    sillHex,
    (_organicHash(seed + 5) - 0.5) * 0.04,
    -winH * 0.5 - 0.07,
    0.06,
    true
  );
  botSill.rotation.z = (_organicHash(seed + 6) - 0.5) * 0.06;

  const leftJamb = createLowPolyMesh(
    createOrganicBoxGeo(0.18, winH + 0.16, 0.22, seed + 7, 0.12, 0.94, 2),
    sillHex,
    -winW * 0.5 - 0.07,
    0,
    0.04,
    true
  );
  leftJamb.rotation.z = 0.03;

  const rightJamb = createLowPolyMesh(
    createOrganicBoxGeo(0.18, winH + 0.16, 0.22, seed + 8, 0.12, 0.94, 2),
    sillHex,
    winW * 0.5 + 0.07,
    0,
    0.04,
    true
  );
  rightJamb.rotation.z = -0.03;

  winGrp.add(topLintel, botSill, leftJamb, rightJamb);
  return winGrp;
}

// 1층 깊은 아치형 입구(Deep Arched Alcove)
function createOrganicArchedEntranceGroup(archW, archH, frameHex, darkHex, doorWoodHex, seed = 1) {
  const archGrp = new THREE.Group();

  const recessVoid = createLowPolyMesh(new THREE.BoxGeometry(archW * 0.82, archH * 0.90, 0.32), darkHex, 0, archH * 0.45, -0.04, false);
  const innerDoor  = createLowPolyMesh(createOrganicBoxGeo(archW * 0.72, archH * 0.84, 0.18, seed, 0.05, 0.98, 2), doorWoodHex, 0, archH * 0.42, 0.02, true);
  archGrp.add(recessVoid, innerDoor);

  [-0.26, 0, 0.26].forEach((ox) => {
    const plankBar = createLowPolyMesh(new THREE.BoxGeometry(0.05, archH * 0.80, 0.22), '#4a2c18', ox * archW, archH * 0.42, 0.03, true);
    archGrp.add(plankBar);
  });

  const pierH = archH * 0.62;
  const pierL = createLowPolyMesh(
    createOrganicBoxGeo(0.34, pierH, 0.44, seed + 10, 0.09, 0.95, 2),
    frameHex,
    -archW * 0.5,
    pierH * 0.5,
    0.09,
    true
  );
  const pierR = createLowPolyMesh(
    createOrganicBoxGeo(0.34, pierH, 0.44, seed + 11, 0.09, 0.95, 2),
    frameHex,
    archW * 0.5,
    pierH * 0.5,
    0.09,
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
    const stoneLen = (Math.PI * radius) / archSegs + 0.12;

    const archStone = createLowPolyMesh(
      createOrganicBoxGeo(0.34, stoneLen, 0.46, seed + 20 + i, 0.10, 0.94, 1),
      frameHex,
      ax,
      ay,
      0.10,
      true
    );
    archStone.rotation.z = midT - Math.PI * 0.5;
    archGrp.add(archStone);
  }

  return archGrp;
}

// 2층 방 전용 비정형 나무 출입문 & 돌출 문틀
function createOrganicUpperDoorGroup(doorW, doorH, frameHex, woodHex, seed = 1) {
  const dGrp = new THREE.Group();

  const plankDoor = createLowPolyMesh(createOrganicBoxGeo(doorW, doorH, 0.16, seed, 0.05, 0.98, 2), woodHex, 0, doorH * 0.5, 0.02, true);
  const jambL = createLowPolyMesh(createOrganicBoxGeo(0.20, doorH + 0.12, 0.26, seed + 1, 0.10, 0.95, 2), frameHex, -doorW * 0.5 - 0.08, doorH * 0.5, 0.05, true);
  const jambR = createLowPolyMesh(createOrganicBoxGeo(0.20, doorH + 0.12, 0.26, seed + 2, 0.10, 0.95, 2), frameHex,  doorW * 0.5 + 0.08, doorH * 0.5, 0.05, true);
  const lintel = createLowPolyMesh(createOrganicBoxGeo(doorW + 0.52, 0.24, 0.30, seed + 3, 0.11, 0.92, 2), frameHex, 0, doorH + 0.10, 0.06, true);
  lintel.rotation.z = (_organicHash(seed + 4) - 0.5) * 0.06;

  dGrp.add(plankDoor, jambL, jambR, lintel);
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
// 메인 빌딩 생성 함수 (`addLowPolyVillageHouse`)
// - 모든 외벽 계단을 실제로 걸어 올라가 2층 테라스 및 옆 건물 옥상으로 점프 이동 가능!
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
  facingYaw = 0
) {
  if (typeof miracleSunSystem !== 'undefined' && miracleSunSystem.light && miracleSunSystem.light.shadow) {
    miracleSunSystem.light.shadow.bias = -0.00018;
  }

  const by = getBaseGroundHeight(cx, cz);
  const houseGrp = new THREE.Group();
  const seed = Math.abs(Math.round(cx * 13 + cz * 29)) + variant * 17 + 1;

  const wallCol   = wallHex || '#e6be8a';
  const trimCol   = roofHex || '#cfa36e';
  const brickCol1 = '#c99860';
  const brickCol2 = '#b8844c';
  const woodCol   = '#6b4226';
  const darkVoid  = '#23170f';

  const registerFadeMesh = (m) => {
    m.castShadow = true;
    m.receiveShadow = true;
    wallMeshes.push(m);
    return m;
  };

  const hasSecondFloorRoom = (variant === 1 || variant === 3);
  const showExteriorStairs = withRoofStairs || hasSecondFloorRoom || (variant === 0);
  const stairSide = withRoofStairs ? 1 : ((variant % 2 === 0) ? -1 : 1);

  const cosYaw = Math.cos(facingYaw);
  const sinYaw = Math.sin(facingYaw);
  const toWorldXZ = (lx, lz) => ({
    wx: cx + lx * cosYaw + lz * sinYaw,
    wz: cz - lx * sinYaw + lz * cosYaw
  });

  // [A] 1층 비정형 본채 & 상단 돌출 띠장 & 옥상 파라펫 난간
  const mainBodyGeo = createOrganicBoxGeo(w, h, d, seed, 0.045, 0.96, 2);
  const mainBody = registerFadeMesh(createLowPolyMesh(mainBodyGeo, wallCol, 0, h * 0.5, 0, true));

  const roofSlab = registerFadeMesh(
    createLowPolyMesh(createOrganicBoxGeo(w - 0.24, 0.20, d - 0.24, seed + 1, 0.03, 1.0, 2), trimCol, 0, h + 0.04, 0, true)
  );
  houseGrp.add(mainBody, roofSlab);

  const beltCourse = registerFadeMesh(
    createLowPolyMesh(createOrganicBoxGeo(w + 0.34, 0.24, d + 0.34, seed + 2, 0.04, 1.0, 2), trimCol, 0, h - 0.06, 0, true)
  );
  houseGrp.add(beltCourse);

  const pH = 0.68, pT = 0.38;
  const paraBack = registerFadeMesh(
    createLowPolyMesh(createOrganicBoxGeo(w + 0.10, pH, pT, seed + 3, 0.06, 0.94, 2), wallCol, 0, h + pH * 0.5, -d * 0.5 + pT * 0.5, true)
  );
  const paraFront = registerFadeMesh(
    createLowPolyMesh(createOrganicBoxGeo(w + 0.10, pH, pT, seed + 4, 0.06, 0.94, 2), wallCol, 0, h + pH * 0.5,  d * 0.5 - pT * 0.5, true)
  );
  houseGrp.add(paraBack, paraFront);

  [-1, 1].forEach(sideDir => {
    if (showExteriorStairs && sideDir === stairSide) {
      const halfD = d * 0.42;
      const sideParaPart = registerFadeMesh(
        createLowPolyMesh(
          createOrganicBoxGeo(pT, pH, halfD, seed + 5 + sideDir, 0.06, 0.94, 2),
          wallCol,
          sideDir * (w * 0.5 - pT * 0.5),
          h + pH * 0.5,
          -d * 0.5 + halfD * 0.5,
          true
        )
      );
      houseGrp.add(sideParaPart);
    } else {
      const sideParaFull = registerFadeMesh(
        createLowPolyMesh(
          createOrganicBoxGeo(pT, pH, d, seed + 7 + sideDir, 0.06, 0.94, 2),
          wallCol,
          sideDir * (w * 0.5 - pT * 0.5),
          h + pH * 0.5,
          0,
          true
        )
      );
      houseGrp.add(sideParaFull);
    }
  });

  // 1층 외벽 비정형 돌출 벽돌 배치 (중심 오프셋 0, 0)
  addScatteredIrregularBricksToWall(houseGrp, w * 0.96, h, d * 0.96, 0, brickCol1, brickCol2, seed + 20, 0, 0);

  // [B] 1층 정면 아치형 입구 & 비정형 창문 & 토기 항아리
  const doorX = -w * 0.12;
  const archedEntrance = createOrganicArchedEntranceGroup(1.85, 2.55, trimCol, darkVoid, woodCol, seed + 40);
  archedEntrance.position.set(doorX, 0, d * 0.5 - 0.04);
  archedEntrance.traverse(ch => { if (ch.isMesh) wallMeshes.push(ch); });
  houseGrp.add(archedEntrance);

  const sideWin1 = createOrganicWindowGroup(0.95, 1.10, brickCol1, trimCol, darkVoid, seed + 50);
  sideWin1.rotation.y = -stairSide * (Math.PI / 2);
  sideWin1.position.set(-stairSide * (w * 0.5 - 0.06), h * 0.58, 0.4);
  houseGrp.add(sideWin1);

  if (!hasSecondFloorRoom) {
    const beamCnt = 4;
    for (let b = 0; b < beamCnt; b++) {
      const bx = -w * 0.34 + (b / (beamCnt - 1)) * (w * 0.68);
      const rafter = createOrganicRoofBeamMesh(0.68, woodCol, seed + 60 + b);
      rafter.rotation.x = Math.PI / 2 + 0.05;
      // 한쪽 끝은 벽면 안쪽에 묻히고 바깥으로만 돌출되도록 위치 보정
      rafter.position.set(bx, h - 0.35, d * 0.5 + 0.12);
      houseGrp.add(rafter);
    }
  }

  const pot1 = createJudeanClayPotMesh(1.05, '#b86232');
  pot1.position.set(-w * 0.42, 0, d * 0.5 + 0.48);
  const pot2 = createJudeanClayPotMesh(0.82, '#9e4f24');
  pot2.position.set(-w * 0.32, 0, d * 0.5 + 0.62);
  const pot3 = createJudeanClayPotMesh(0.90, '#b86232');
  pot3.position.set(doorX + 1.25, 0, d * 0.5 + 0.52);
  houseGrp.add(pot1, pot2, pot3);

  // [C] 2층 방(Upper Chamber) & 테라스 벤치 & 서까래 돌출목 (variant 1, 3)
  if (hasSecondFloorRoom) {
    const uW = w * 0.58;
    const uH = 3.10;
    const uD = d * 0.62;
    const uX = -stairSide * (w * 0.16);
    const uZ = -d * 0.12;

    const upperBody = registerFadeMesh(
      createLowPolyMesh(createOrganicBoxGeo(uW, uH, uD, seed + 70, 0.045, 0.96, 2), wallCol, uX, h + uH * 0.5, uZ, true)
    );
    const upperRoofSlab = registerFadeMesh(
      createLowPolyMesh(createOrganicBoxGeo(uW - 0.22, 0.16, uD - 0.22, seed + 71, 0.03, 1.0, 1), trimCol, uX, h + uH - 0.08, uZ, true)
    );
    const upH = 0.38, upT = 0.28;
    const upParaF = registerFadeMesh(createLowPolyMesh(createOrganicBoxGeo(uW + 0.06, upH, upT, seed + 72, 0.06, 0.95, 1), trimCol, uX, h + uH + upH * 0.4, uZ + uD * 0.5 - upT * 0.5, true));
    const upParaB = registerFadeMesh(createLowPolyMesh(createOrganicBoxGeo(uW + 0.06, upH, upT, seed + 73, 0.06, 0.95, 1), trimCol, uX, h + uH + upH * 0.4, uZ - uD * 0.5 + upT * 0.5, true));
    const upParaL = registerFadeMesh(createLowPolyMesh(createOrganicBoxGeo(upT, upH, uD, seed + 74, 0.06, 0.95, 1), trimCol, uX - uW * 0.5 + upT * 0.5, h + uH + upH * 0.4, uZ, true));
    const upParaR = registerFadeMesh(createLowPolyMesh(createOrganicBoxGeo(upT, upH, uD, seed + 75, 0.06, 0.95, 1), trimCol, uX + uW * 0.5 - upT * 0.5, h + uH + upH * 0.4, uZ, true));
    houseGrp.add(upperBody, upperRoofSlab, upParaF, upParaB, upParaL, upParaR);

    // ✅ [버그 수정 완료] uX, uZ 오프셋을 전달하여 2층 돌출 벽돌이 허공에 뜨지 않고 2층 벽면에 정확히 밀착됨!
    addScatteredIrregularBricksToWall(houseGrp, uW * 0.95, uH, uD * 0.95, h, brickCol1, brickCol2, seed + 80, uX, uZ);

    const upperDoor = createOrganicUpperDoorGroup(1.12, 2.10, trimCol, woodCol, seed + 90);
    upperDoor.position.set(uX - uW * 0.20, h, uZ + uD * 0.5 - 0.04);
    houseGrp.add(upperDoor);

    const upperFrontWin = createOrganicWindowGroup(0.80, 0.96, brickCol1, trimCol, darkVoid, seed + 95);
    upperFrontWin.position.set(uX + uW * 0.22, h + 1.35, uZ + uD * 0.5 - 0.05);
    houseGrp.add(upperFrontWin);

    const upperSideWin = createOrganicWindowGroup(0.80, 0.96, brickCol1, trimCol, darkVoid, seed + 98);
    upperSideWin.rotation.y = stairSide * (Math.PI / 2);
    upperSideWin.position.set(uX + stairSide * (uW * 0.5 - 0.05), h + 1.35, uZ + 0.12);
    houseGrp.add(upperSideWin);

    const upperBackWin = createOrganicWindowGroup(0.76, 0.90, brickCol1, trimCol, darkVoid, seed + 99);
    upperBackWin.rotation.y = Math.PI;
    upperBackWin.position.set(uX + 0.35, h + 1.35, uZ - uD * 0.5 + 0.05);
    houseGrp.add(upperBackWin);

    // 2층 서까래 돌출목 (벽면 안쪽에서부터 바깥으로 연결되어 절대 허공에 뜨지 않음)
    for (let b = 0; b < 4; b++) {
      const bx = uX - uW * 0.34 + (b / 3) * (uW * 0.68);
      const backBeam = createOrganicRoofBeamMesh(0.68, woodCol, seed + 110 + b);
      backBeam.rotation.x = Math.PI / 2 - 0.05;
      backBeam.position.set(bx, h + uH - 0.40, uZ - uD * 0.5 - 0.10);
      houseGrp.add(backBeam);
    }
    for (let b = 0; b < 3; b++) {
      const bz = uZ - uD * 0.28 + (b / 2) * (uD * 0.56);
      const sideBeam = createOrganicRoofBeamMesh(0.66, woodCol, seed + 120 + b);
      sideBeam.rotation.z = Math.PI / 2;
      sideBeam.position.set(uX - stairSide * (uW * 0.5 + 0.10), h + uH - 0.40, bz);
      houseGrp.add(sideBeam);
    }

    const terraceBench = createOrganicTerraceBench(woodCol, seed + 130);
    terraceBench.position.set(uX + uW * 0.18, h, uZ + uD * 0.5 + 0.58);
    const terracePot = createJudeanClayPotMesh(0.85, '#b86232');
    terracePot.position.set(stairSide * (w * 0.32), h, -d * 0.32);
    houseGrp.add(terraceBench, terracePot);

    const awW = 1.80, awD = 3.1;
    const awX = -stairSide * (w * 0.5 + awW * 0.42);
    const sideAwning = registerFadeMesh(
      createLowPolyMesh(createOrganicBoxGeo(awW, 0.14, awD, seed + 140, 0.07, 1.0, 2), woodCol, awX, h * 0.68, -0.4, true)
    );
    sideAwning.rotation.z = stairSide * 0.15;
    const awPost1 = createLowPolyMesh(new THREE.CylinderGeometry(0.09, 0.11, h * 0.66, 6), woodCol, awX - stairSide * (awW * 0.38), h * 0.33, -0.4 - awD * 0.38, true);
    const awPost2 = createLowPolyMesh(new THREE.CylinderGeometry(0.09, 0.11, h * 0.66, 6), woodCol, awX - stairSide * (awW * 0.38), h * 0.33, -0.4 + awD * 0.38, true);
    houseGrp.add(sideAwning, awPost1, awPost2);

    // 2층 방 자체도 플랫폼으로 등록하여, 2층 테라스에서는 벽으로 작용하고 더 높은 곳에서 점프하면 2층 방 지붕 위에도 올라갈 수 있음!
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

  // [D] 시장 상점형 가옥(variant === 2) 전면 나무 차양
  if (variant === 2) {
    const awW = 3.2, awD = 1.9;
    const awX = w * 0.22, awZ = d * 0.5 + awD * 0.5;
    const awning = registerFadeMesh(
      createLowPolyMesh(createOrganicBoxGeo(awW, 0.16, awD, seed + 150, 0.06, 1.0, 2), '#8c4f20', awX, 2.68, awZ, true)
    );
    awning.rotation.x = 0.20;
    const p1 = createLowPolyMesh(new THREE.CylinderGeometry(0.10, 0.11, 2.48, 6), woodCol, awX - awW * 0.44, 1.24, awZ + awD * 0.42, true);
    const p2 = createLowPolyMesh(new THREE.CylinderGeometry(0.10, 0.11, 2.48, 6), woodCol, awX + awW * 0.44, 1.24, awZ + awD * 0.42, true);
    const crate = createLowPolyMesh(createOrganicBoxGeo(1.45, 0.65, 0.95, seed + 151, 0.06, 0.96, 1), '#b45309', awX, 0.33, awZ, true);
    const fruit1 = createLowPolyMesh(new THREE.DodecahedronGeometry(0.28, 0), '#facc15', awX - 0.3, 0.78, awZ, true);
    const fruit2 = createLowPolyMesh(new THREE.DodecahedronGeometry(0.26, 0), '#4ade80', awX + 0.3, 0.78, awZ, true);
    houseGrp.add(awning, p1, p2, crate, fruit1, fruit2);
  }

  // [E] 모든 외벽 돌계단에 회전각(facingYaw)을 반영한 물리 발판 등록 — 걸어서 2층 테라스 및 옥상 등반 가능!
  if (showExteriorStairs) {
    const stairW = 1.68;
    const stairLocalX = stairSide * (w * 0.5 + stairW * 0.5 - 0.06);
    const stepCount = 9;
    const stairSpanD = d * 0.88;
    const stepDepth = stairSpanD / stepCount;

    for (let s = 1; s <= stepCount; s++) {
      const sh = (h / stepCount) * s;
      const sz = (d * 0.5) - (s - 0.5) * stepDepth;
      const stepGeo = createOrganicBoxGeo(stairW, sh, stepDepth + 0.06, seed + 200 + s, 0.035, 0.98, 1);
      const stepMesh = registerFadeMesh(
        createLowPolyMesh(stepGeo, trimCol, stairLocalX, sh * 0.5, sz, true)
      );
      houseGrp.add(stepMesh);

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

    // 계단 맨 위 칸에서 2층 테라스로 자연스럽게 이어지는 상단 랜딩 발판 추가
    const topLandWorld = toWorldXZ(stairSide * (w * 0.45), -d * 0.25);
    platforms.push({
      minX: topLandWorld.wx - 1.25,
      maxX: topLandWorld.wx + 1.25,
      minZ: topLandWorld.wz - 1.25,
      maxZ: topLandWorld.wz + 1.25,
      topY: by + h + 0.05
    });
  }

  houseGrp.position.set(cx, by, cz);
  houseGrp.rotation.y = facingYaw;
  worldGroup.add(houseGrp);

  // [핵심 수정] 무한 높이 colliders 대신 1층 옥상 높이(by + h + 0.05) 플랫폼으로만 등록하여
  // 지상에서는 벽처럼 막히고, 계단으로 올라오거나 옆 건물에서 점프하면 2층 테라스/옥상 위를 자유롭게 활보할 수 있음!
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

  return houseGrp;
}

function addJudeanRoadsideBuilding(cx, cz, variant = 0, facingYaw = 0, scale = 1.0, withRoofStairs = false) {
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
    facingYaw
  );
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
      <div id="miracle-hud-left" class="hidden fixed left-2.5 sm:left-3 z-20 flex flex-col gap-1.5 pointer-events-auto" style="top: 86px;">
        <button id="miracle-notebook-btn" type="button" onclick="openMiracleNotebookModal('all')"
                class="mc-btn px-3 py-1.5 rounded-2xl bg-amber-900/90 hover:bg-amber-800 border-2 border-amber-300 text-amber-100 font-jua text-xs shadow-lg flex items-center gap-1.5">
          <span>📖</span>
          <span id="miracle-notebook-badge-text">나의 복음서 수첩 (0/36)</span>
        </button>

        <div id="miracle-parable-banner" class="hidden px-2.5 py-1 rounded-xl bg-emerald-900/90 border border-emerald-300 text-emerald-100 font-jua text-[11px] shadow">
          🌱 예수님이 들려주신 비유 체험
        </div>

        <button id="miracle-return-openworld-btn" type="button" onclick="returnToMiracleOpenWorld()"
                class="hidden mc-btn px-3 py-1 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-jua text-xs shadow">
          🗺️ 오픈월드로 돌아가기
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
    badgeText.textContent = `나의 복음서 수첩 (${miracleCollectedIds.size}/${total})`;
  }

  const isParableMode =
    miracleSubMode === 'minigame' &&
    miracleActiveMinigameId &&
    miracleActiveMinigameId.startsWith('par_');

  if (parBanner) {
    parBanner.classList.toggle('hidden', !isParableMode);
  }
  if (retBtn) {
    retBtn.classList.toggle('hidden', miracleSubMode === 'openworld' || miracleSubMode === 'ascension');
  }
}

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
  miracleDialogState.onConfirm = options.onConfirm || null;
  miracleDialogState.onCancel = options.onCancel || null;
  miracleDialogState.onReplay = options.onReplay || null;

  if (options.notebookId) {
    unlockMiracleNotebookEntry(options.notebookId, false);
  }

  speakerEl.textContent = options.speaker || '갈릴리 주민';
  badgeEl.textContent = catMeta.label;
  badgeEl.className = `px-2.5 py-0.5 rounded-full font-jua text-[11px] ${catMeta.cls}`;
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

    options.quiz.opts.forEach((optText, idx) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'mc-btn w-full py-1.5 px-3 rounded-xl bg-amber-100 hover:bg-amber-200 text-slate-900 font-bold text-xs text-left';
      b.textContent = `${idx + 1}. ${optText}`;
      b.onclick = () => {
        if (idx === options.quiz.ans) {
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

window.confirmMiracleDialog = function () {
  const modal = document.getElementById('miracle-dialog-modal');
  if (modal) modal.classList.add('hidden');
  miracleDialogState.active = false;
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
  const nbModal = document.getElementById('miracle-notebook-modal');
  const dlgModal = document.getElementById('miracle-dialog-modal');
  if (leftHud) leftHud.classList.add('hidden');
  if (nbModal) nbModal.classList.add('hidden');
  if (dlgModal) dlgModal.classList.add('hidden');
  miracleDialogState.active = false;
}
