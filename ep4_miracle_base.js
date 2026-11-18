// =========================================================================
// [ep4_miracle_base.js] 에피소드 4 : 예수님의 기적과 부활
// - 확장된 오픈월드(반경 168, 380x380 규모), 외곽 오병이어 전망 언덕, 서쪽 완만한 초원 해안 지형 계산기
// - 고대 유대 건축물(5종 변형) 팩토리, 복음서 수첩 DB(36종), 1분 갈릴리 어쿠스틱 BGM
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
// 1. 에피소드 4 전역 상태 변수 선언 (맵 반경 168 -> 약 380x380 광활한 오픈월드)
// -------------------------------------------------------------------------
const MIRACLE_WORLD_LIMIT = 168;

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
    { id: 'rumor_loaves',    region: '갈릴리',   title: '도시락 하나로 먹은 무리들',   text: '"동북쪽 바깥 높은 벳새다 언덕에 모인 수천 명의 사람들이 어린아이의 작은 도시락 하나로 다 배불리 먹었대!"', unlocksEvent: 'main_2' },
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
// 3. [1분(60초, 192박자) 갈릴리 복음서 BGM & 폭풍우/십자가 긴장 테마 BGM]
// -------------------------------------------------------------------------
const MIRACLE_BASE_RHYTHM = [
  1.35, 0.55, 0.90, 1.40, 0.55, 0.95,
  1.45, 0.50, 0.50, 0.55, 1.35, 0.55,
  1.40, 0.55, 0.95, 1.30, 0.48, 0.48,
  1.40, 0.55, 0.95, 1.60, 0.55, 1.15
];

const MIRACLE_GOSPEL_1MIN_SUITE = (function buildOneMinuteGalileeGospelSuite() {
  const m = [], c1 = [], c2 = [], b = [], r = [];
  const addSection = (mel, ch1, ch2, bass) => {
    for (let i = 0; i < 24; i++) {
      m.push(mel[i]); c1.push(ch1[i]); c2.push(ch2[i]); b.push(bass[i]);
      r.push(MIRACLE_BASE_RHYTHM[i]);
    }
  };

  addSection(
    [4, 7, 12, 16, 14, 12, 11, 7,  9, 12, 16, 19, 16, 12, 11, 7,  5, 9, 12, 17, 16, 12, 14, 7],
    [0, 4, 7, 12, 11, 7, 7, 4,     4, 9, 12, 16, 12, 7, 7, 4,     0, 5, 9, 12, 12, 7, 9, 2],
    [7, 12, 16, 19, 19, 16, 14, 11, 12, 16, 19, 24, 19, 16, 14, 11, 9, 12, 17, 21, 19, 16, 17, 11],
    [-12,-12,-12,-5, -1,-1,-3,-3,  -3,-3,-3,-8, -8,-8,-5,-5,      -7,-7,-7,-12, -12,-12,-10,-5]
  );

  addSection(
    [7, 12, 16, 19, 21, 19, 16, 12, 14, 17, 21, 24, 23, 19, 17, 14, 16, 19, 24, 19, 17, 16, 14, 12],
    [4, 7, 12, 16, 17, 16, 12, 7,   9, 12, 17, 21, 19, 14, 12, 11,  12, 16, 19, 16, 14, 12, 11, 7],
    [12,16,19,24, 24,24,19,16,      17,21,24,28, 26,23,21,17,       19,24,28,24, 21,19,17,16],
    [-12,-12,-8,-8, -7,-7,-12,-12,  -10,-10,-7,-7, -5,-5,-8,-10,    -12,-12,-3,-3, -7,-5,-5,-12]
  );

  addSection(
    [12, 11, 9, 7, 9, 12, 16, 12,  14, 12, 11, 7, 11, 14, 19, 14,  16, 14, 12, 9, 5, 9, 12, 14],
    [7, 7, 4, 4, 5, 9, 12, 9,      11, 7, 7, 2, 7, 11, 14, 11,     12, 11, 9, 4, 0, 5, 9, 11],
    [16,14,12,11, 12,16,19,16,     17,16,14,11, 14,17,23,17,       19,17,16,12, 9,12,16,17],
    [-12,-8,-3,-5, -7,-7,-12,-12,  -5,-5,-8,-10, -5,-5,-2,-5,      -3,-3,-8,-3, -7,-7,-10,-5]
  );

  addSection(
    [9, 12, 16, 21, 19, 16, 14, 12, 5, 9, 12, 17, 16, 14, 12, 9,  7, 11, 14, 19, 17, 16, 14, 12],
    [4, 9, 12, 16, 16, 12, 11, 7,   0, 5, 9, 12, 12, 11, 7, 4,    2, 7, 11, 14, 14, 12, 11, 7],
    [12,16,21,24, 23,19,17,16,      9,12,17,21, 19,17,16,12,      11,14,19,23, 21,19,17,16],
    [-3,-3,-3,-3, -8,-8,-12,-12,    -7,-7,-7,-7, -12,-12,-3,-3,   -5,-5,-5,-5, -7,-5,-5,-12]
  );

  addSection(
    [0, 4, 7, 12, 14, 16, 17, 16,  14, 12, 9, 12, 16, 19, 17, 14,  12, 16, 19, 24, 21, 19, 17, 16],
    [0, 0, 4, 7, 9, 12, 12, 12,    9, 7, 5, 9, 12, 16, 14, 11,     7, 12, 16, 19, 17, 16, 14, 12],
    [7,12,16,19, 17,19,21,19,      17,16,12,16, 19,24,21,17,       16,19,24,28, 24,24,21,19],
    [-12,-12,-8,-12, -7,-7,-5,-7,  -10,-10,-7,-7, -12,-12,-5,-5,   -12,-8,-5,-12, -7,-7,-5,-12]
  );

  addSection(
    [16, 14, 12, 11, 9, 12, 16, 14, 12, 11, 9, 7, 5, 9, 14, 12,   11, 12, 14, 17, 16, 14, 12, 11],
    [12, 11, 7, 7, 4, 9, 12, 11,    7, 7, 4, 4, 0, 5, 9, 7,       7, 7, 11, 14, 12, 11, 7, 7],
    [19,17,16,14, 12,16,19,17,      16,14,12,11, 9,12,17,16,      14,16,17,21, 19,17,16,14],
    [-12,-8,-3,-3, -7,-7,-5,-5,     -12,-8,-3,-3, -7,-7,-10,-12,  -5,-5,-2,-5, -12,-8,-10,-5]
  );

  addSection(
    [12, 16, 19, 24, 23, 21, 19, 16, 17, 21, 24, 21, 19, 16, 14, 12, 14, 17, 19, 23, 24, 21, 19, 16],
    [7, 12, 16, 19, 19, 17, 16, 12,  12, 17, 21, 17, 16, 12, 11, 7,  11, 14, 16, 19, 19, 17, 16, 12],
    [16,19,24,28, 26,24,24,19,       21,24,28,24, 24,19,17,16,       17,21,23,26, 28,24,24,19],
    [-12,-12,-8,-8, -3,-3,-5,-5,     -7,-7,-5,-5, -12,-12,-8,-12,    -10,-10,-5,-5, -12,-7,-8,-12]
  );

  addSection(
    [17, 16, 14, 12, 9, 12, 16, 12,  14, 12, 11, 7, 5, 9, 12, 9,  7, 4, 2, 5, 7, 11, 14, 7],
    [12, 12, 11, 7, 4, 9, 12, 7,     11, 7, 7, 2, 0, 5, 9, 5,     4, 0, -1, 2, 2, 7, 11, 2],
    [21,19,17,16, 12,16,19,16,       17,16,14,11, 9,12,16,12,     12,7, 5, 9, 11,14,17,11],
    [-7,-7,-5,-5, -3,-3,-8,-8,       -5,-5,-8,-10, -7,-7,-10,-10, -12,-12,-5,-5, -5,-2,-5,-5]
  );

  return { melody: m, chord1: c1, chord2: c2, bass: b, rhythm: r };
})();

function scheduleMiracleBgmBeat(ctx, step, st, mode, playing, timeRem, toFreq) {
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

  const suiteLen = MIRACLE_GOSPEL_1MIN_SUITE.melody.length;
  const idx = step % suiteLen;
  const rhythmMult = MIRACLE_GOSPEL_1MIN_SUITE.rhythm[idx] || 1.0;
  let stepMs = Math.round((miracleIsPostResurrection ? 335 : 350) * rhythmMult);
  if (mode === 'timeattack' && playing && miracleSubMode !== 'openworld') {
    stepMs = (timeRem < 5.0) ? Math.round(stepMs * 0.68) : Math.round(stepMs * 0.85);
  }
  if (!ctx) return stepMs;

  const now = ctx.currentTime;
  const dur = (stepMs / 1000) * 1.48;
  const rootMidi = miracleIsPostResurrection ? 62 : 60;
  const leadFreq = toFreq(rootMidi + MIRACLE_GOSPEL_1MIN_SUITE.melody[idx]);
  const ch1Freq  = toFreq(rootMidi + MIRACLE_GOSPEL_1MIN_SUITE.chord1[idx]);
  const ch2Freq  = toFreq(rootMidi + MIRACLE_GOSPEL_1MIN_SUITE.chord2[idx]);
  const bassFreq = toFreq(rootMidi + MIRACLE_GOSPEL_1MIN_SUITE.bass[idx]);

  const playWarmTone = (freq, startT, duration, vol, wave = 'sine') => {
    const osc = ctx.createOscillator();
    const sub = ctx.createOscillator();
    const gain = ctx.createGain();
    const subGain = ctx.createGain();

    osc.type = wave;
    sub.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startT);
    sub.frequency.setValueAtTime(freq * 2.0, startT);

    gain.gain.setValueAtTime(0.001, startT);
    gain.gain.linearRampToValueAtTime(vol, startT + 0.02);
    gain.gain.exponentialRampToValueAtTime(vol * 0.3, startT + duration * 0.4);
    gain.gain.exponentialRampToValueAtTime(0.0008, startT + duration);

    subGain.gain.setValueAtTime(0.18, startT);
    osc.connect(gain);
    sub.connect(subGain);
    subGain.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startT); osc.stop(startT + duration + 0.02);
    sub.start(startT); sub.stop(startT + duration + 0.02);
  };

  if (rhythmMult >= 1.25) {
    playWarmTone(bassFreq, now, dur * 1.3, 0.038, 'triangle');
    playWarmTone(leadFreq, now + 0.03, dur, 0.046, 'sine');
    playWarmTone(ch1Freq,  now + 0.07, dur * 0.9, 0.028, 'sine');
    playWarmTone(ch2Freq,  now + 0.11, dur * 0.8, 0.022, 'triangle');
  } else {
    playWarmTone(leadFreq, now, dur, 0.040, 'sine');
    if (idx % 2 === 1) {
      playWarmTone(ch1Freq, now + 0.035, dur * 0.75, 0.024, 'triangle');
    }
  }
  return stepMs;
}

// -------------------------------------------------------------------------
// 4. 소프트 로우 폴리곤 재질 캐시 및 확장 지형 고도 계산기
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
  let h = 0.0;

  // 1) 서쪽 끝(West, x < -84): 모래사장 없이 초원에서 넓은 바다(shoreLineX ≈ -112)까지 완만하게 내려가는 해안 경사
  //    (내륙의 골고다 언덕·수가성 우물·광야가 절대 물에 잠기지 않도록 해안선을 x = -112로 배치)
  const shoreLineX = -112 + Math.sin(z * 0.028) * 6.5 + Math.cos(z * 0.06) * 3.0;
  if (x < shoreLineX + 28) {
    const t = Math.max(0, (shoreLineX + 28 - x) / 28);
    const smoothSlope = t * t * (3 - Math.min(2.0, 2 * t));
    h -= smoothSlope * 1.40;
    if (x < shoreLineX) {
      h -= (shoreLineX - x) * 0.07;
    }
    return Number(h.toFixed(3));
  }

  // 2) [핵심 요청사항] 맵 바깥쪽 근처(동북쪽 외곽 x = 110, z = -95)에 마을 전체가 한눈에 내려다보이는 높은 '오병이어 언덕' (정상 높이 19.5)
  const bethDist = Math.hypot((x - 110) / 54, (z - (-95)) / 48);
  if (bethDist < 1.0) {
    const t = 1.0 - bethDist;
    // 정상 부근(bethDist < 0.22)은 플레이어와 군중들이 걷기 좋게 완만한 평탄면 형성
    const plateauT = Math.min(1.0, t * 1.18);
    const smoothHill = plateauT * plateauT * (3 - 2 * plateauT);
    const bump = Math.sin(x * 0.14) * Math.cos(z * 0.14) * 0.55 * (1.0 - plateauT * 0.7);
    h += smoothHill * 19.2 + t * bump;
  }

  // 3) 잃어버린 양의 유대 광야 바위 언덕 (서중부 내륙: x = -56, z = 18)
  const wildDist = Math.hypot((x - (-56)) / 30, (z - 18) / 28);
  if (wildDist < 1.0) {
    const t = 1.0 - wildDist;
    const bump = Math.sin(x * 0.18 + 1.2) * Math.cos(z * 0.18) * 0.45;
    h += t * t * (3 - 2 * t) * 5.8 + t * bump;
  }

  // 4) 골고다 십자가 언덕 (남서쪽 내륙: x = -54, z = 92 — 바다와 멀리 떨어진 안전한 육지 언덕)
  const golgothaDist = Math.hypot((x - (-54)) / 30, (z - 92) / 28);
  if (golgothaDist < 1.0) {
    const t = 1.0 - golgothaDist;
    const bump = Math.sin(x * 0.18) * Math.cos(z * 0.18) * 0.45;
    h += t * t * (3 - 2 * t) * 8.5 + t * bump;
  }

  // 5) 감람산 승천 언덕 (남동쪽 외곽 근처: x = 96, z = 84)
  const oliveDist = Math.hypot((x - 96) / 36, (z - 84) / 34);
  if (oliveDist < 1.0) {
    const t = 1.0 - oliveDist;
    const bump = Math.sin(x * 0.16) * Math.cos(z * 0.16) * 0.45;
    h += t * t * (3 - 2 * t) * 10.5 + t * bump;
  }

  // 6) 북·동·남 3면 가장자리 낮은 구릉 융기 (가장자리 산을 낮춰 시야를 시원하게 개방)
  const eastEdge  = Math.max(0, (x - 138) / 32);
  const northEdge = Math.max(0, (-138 - z) / 32);
  const southEdge = Math.max(0, (z - 138) / 32);
  const edgeFactor = Math.max(eastEdge, northEdge, southEdge);
  if (edgeFactor > 0) {
    const edgeBump = Math.sin(x * 0.10) * Math.cos(z * 0.10) * 0.85;
    h += edgeFactor * edgeFactor * 3.8 + edgeFactor * edgeBump;
  }

  // 7) 평지 구릉 잔물결 (중앙 순례길과 마을 주변은 평탄하게 유지)
  const centerRoadClearance = Math.min(1.0, Math.abs(x - Math.sin(z * 0.025) * 8.0) / 16.0);
  const gentleWave = (Math.sin(x * 0.04) * Math.cos(z * 0.04) * 0.42) * centerRoadClearance;
  h += gentleWave;

  return Number(h.toFixed(3));
}

function getMiracleGroundHeight(x, z, st) {
  if (miracleSubMode === 'openworld' || miracleSubMode === 'ascension') {
    return getMiracleOpenWorldGroundHeight(x, z);
  }
  if (miracleSubMode === 'main2_loaves') {
    const hillT = Math.max(0, Math.min(1, (28 - z) / 64));
    return hillT * hillT * (3 - 2 * hillT) * 7.5;
  }
  if (miracleSubMode === 'main3_cross') {
    if (z <= -10) {
      const climbT = Math.max(0, Math.min(1, (-10 - z) / 52));
      return climbT * 9.2;
    }
    return 0;
  }
  if (miracleSubMode === 'minigame' && miracleActiveMinigameId === 'par_sheep') {
    return Math.sin(x * 0.09) * Math.cos(z * 0.09) * 1.6 + Math.max(0, (18 - z) * 0.12);
  }
  return 0;
}

// -------------------------------------------------------------------------
// 5. 소프트 로우 폴리곤 기본 메쉬·구름·바위·고대 유대 건축물(5종 변형) 팩토리
//    (※ 캐릭터·동물·나무·야생화·태양광원은 ep4_miracle_assets.js에서 전담하여 중복 충돌 원천 방지)
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
  const mainMesh = createLowPolyMesh(mainGeo, colorHex, 0, radius * heightScale * 0.55, 0);
  mainMesh.scale.set(1.15, heightScale, 0.98);
  mainMesh.rotation.set(0.15, (x + z) * 0.7, -0.1);

  const subCol = colorHex === '#94a3b8' ? '#cbd5e1' : '#a8a29e';
  const subGeo = new THREE.DodecahedronGeometry(radius * 0.62, 0);
  const subMesh = createLowPolyMesh(subGeo, subCol, radius * 0.68, radius * heightScale * 0.34, radius * 0.32);
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

function addLowPolyPalmTree(x, z, scale = 1.0, addCol = true) {
  const by = getBaseGroundHeight(x, z);
  const grp = new THREE.Group();
  const trunkH = 3.5 * scale;
  const trunkGeo = new THREE.CylinderGeometry(0.18 * scale, 0.34 * scale, trunkH, 6);
  const trunk = createLowPolyMesh(trunkGeo, '#854d0e', 0, trunkH * 0.5, 0);
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
      Math.sin(ang) * 0.98 * scale
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

  const stem = createLowPolyMesh(new THREE.CylinderGeometry(0.22 * scale, 0.26 * scale, 1.9 * scale, 6), cCol, 0, 0.95 * scale, 0);
  const armL = createLowPolyMesh(new THREE.CylinderGeometry(0.15 * scale, 0.17 * scale, 0.75 * scale, 6), cCol, -0.38 * scale, 1.15 * scale, 0);
  const armR = createLowPolyMesh(new THREE.CylinderGeometry(0.15 * scale, 0.17 * scale, 0.65 * scale, 6), cCol,  0.38 * scale, 0.95 * scale, 0);
  const jointL = createLowPolyMesh(new THREE.CylinderGeometry(0.14 * scale, 0.14 * scale, 0.42 * scale, 5), cCol, -0.22 * scale, 0.85 * scale, 0);
  jointL.rotation.z = Math.PI / 2;
  const jointR = createLowPolyMesh(new THREE.CylinderGeometry(0.14 * scale, 0.14 * scale, 0.42 * scale, 5), cCol,  0.22 * scale, 0.70 * scale, 0);
  jointR.rotation.z = Math.PI / 2;

  const flower = createLowPolyMesh(new THREE.DodecahedronGeometry(0.14 * scale, 0), '#f43f5e', 0, 1.96 * scale, 0, false);
  const rockSub = createLowPolyMesh(new THREE.DodecahedronGeometry(0.45 * scale, 0), '#d97706', 0.55 * scale, 0.22 * scale, 0.35 * scale, false);

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
  const trunk = createLowPolyMesh(new THREE.CylinderGeometry(0.42 * scale, 0.68 * scale, trunkH, 7), '#5c2d0c', 0, trunkH * 0.5, 0);

  const branch = createLowPolyMesh(new THREE.CylinderGeometry(0.18 * scale, 0.24 * scale, 2.6 * scale, 6), '#5c2d0c', 1.1 * scale, trunkH * 0.72, 0.4 * scale);
  branch.rotation.z = -1.25;

  const mainCrown = createLowPolyMesh(new THREE.IcosahedronGeometry(2.3 * scale, 0), '#3f6212', 0, trunkH + 0.8 * scale, 0);
  mainCrown.scale.set(1.25, 0.72, 1.25);
  const subCrown1 = createLowPolyMesh(new THREE.IcosahedronGeometry(1.5 * scale, 0), '#4d7c0f', 1.6 * scale, trunkH + 0.35 * scale, 0.5 * scale);
  const subCrown2 = createLowPolyMesh(new THREE.IcosahedronGeometry(1.4 * scale, 0), '#65a30d', -1.4 * scale, trunkH + 0.45 * scale, -0.4 * scale);

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
  const hull = createLowPolyMesh(hullGeo, '#78350f', 0, 0.75 * scale, 0);
  hull.rotation.x = Math.PI / 2;
  hull.scale.set(1.0, 1.0, 0.48);

  const deckGeo = new THREE.BoxGeometry(3.4 * scale, 0.22 * scale, 6.8 * scale);
  const deck = createLowPolyMesh(deckGeo, '#b45309', 0, 1.12 * scale, 0);

  const mast = createLowPolyMesh(new THREE.CylinderGeometry(0.12 * scale, 0.16 * scale, 5.8 * scale, 6), '#451a03', 0, 3.8 * scale, -0.4 * scale);
  const yard = createLowPolyMesh(new THREE.CylinderGeometry(0.08 * scale, 0.08 * scale, 4.2 * scale, 6), '#5c2d0c', 0, 5.2 * scale, -0.4 * scale);
  yard.rotation.z = Math.PI / 2;

  const sailGeo = new THREE.ConeGeometry(2.4 * scale, 3.6 * scale, 4);
  const sail = createLowPolyMesh(sailGeo, '#fef3c7', 0, 3.9 * scale, 0.05 * scale, false);
  sail.scale.set(1.1, 1.0, 0.22);
  sail.rotation.y = Math.PI / 4;

  boatGrp.add(hull, deck, mast, yard, sail);
  boatGrp.userData = { hull, deck, sail };
  return boatGrp;
}

function createJudeanClayPotMesh(scale = 1.0, colorHex = '#c26d38') {
  const potGrp = new THREE.Group();
  const belly = createLowPolyMesh(new THREE.DodecahedronGeometry(0.32 * scale, 0), colorHex, 0, 0.28 * scale, 0, false);
  belly.scale.set(0.95, 1.25, 0.95);
  const neck = createLowPolyMesh(new THREE.CylinderGeometry(0.18 * scale, 0.14 * scale, 0.22 * scale, 6), '#9a4e22', 0, 0.56 * scale, 0, false);
  potGrp.add(belly, neck);
  return potGrp;
}

function addLowPolyVillageHouse(
  cx,
  cz,
  w = 7.6,
  h = 4.0,
  d = 6.4,
  wallHex = '#e8d4b4',
  roofHex = '#d6be96',
  withRoofStairs = false,
  variant = 0,
  facingYaw = 0
) {
  const by = getBaseGroundHeight(cx, cz);
  const houseGrp = new THREE.Group();

  const wallCol  = wallHex || '#e8d4b4';
  const trimCol  = roofHex || '#d1b588';
  const woodCol  = '#6b4226';
  const darkVoid = '#1e1b18';
  const archStoneCol = '#c7ad83';

  const registerFadeMesh = (m) => {
    wallMeshes.push(m);
    return m;
  };

  const mainBody = registerFadeMesh(createLowPolyMesh(new THREE.BoxGeometry(w, h, d), wallCol, 0, h * 0.5, 0));
  const roofSlab = registerFadeMesh(createLowPolyMesh(new THREE.BoxGeometry(w - 0.16, 0.18, d - 0.16), trimCol, 0, h + 0.05, 0));
  houseGrp.add(mainBody, roofSlab);

  const pH = 0.48, pT = 0.34;
  const paraN = registerFadeMesh(createLowPolyMesh(new THREE.BoxGeometry(w + 0.08, pH, pT), trimCol, 0, h + pH * 0.5, -d * 0.5 + pT * 0.5));
  const paraS = registerFadeMesh(createLowPolyMesh(new THREE.BoxGeometry(w + 0.08, pH, pT), trimCol, 0, h + pH * 0.5,  d * 0.5 - pT * 0.5));
  const paraW = registerFadeMesh(createLowPolyMesh(new THREE.BoxGeometry(pT, pH, d), trimCol, -w * 0.5 + pT * 0.5, h + pH * 0.5, 0));
  const paraE = registerFadeMesh(createLowPolyMesh(new THREE.BoxGeometry(pT, pH, d), trimCol,  w * 0.5 - pT * 0.5, h + pH * 0.5, 0));
  houseGrp.add(paraN, paraS, paraW, paraE);

  const beamCount = Math.max(3, Math.floor(w / 1.9));
  for (let b = 0; b < beamCount; b++) {
    const bx = -w * 0.38 + (b / Math.max(1, beamCount - 1)) * (w * 0.76);
    const rafter = createLowPolyMesh(new THREE.CylinderGeometry(0.09, 0.10, 0.75, 5), woodCol, bx, h - 0.36, d * 0.5 + 0.22, false);
    rafter.rotation.x = Math.PI / 2;
    houseGrp.add(rafter);
  }

  const doorX = (variant === 1) ? -w * 0.22 : -w * 0.14;
  const doorVoid = createLowPolyMesh(new THREE.BoxGeometry(1.55, 2.35, 0.22), darkVoid, doorX, 1.18, d * 0.5 + 0.02, false);
  const doorPlank = createLowPolyMesh(new THREE.BoxGeometry(1.36, 2.22, 0.18), '#854d0e', doorX, 1.12, d * 0.5 + 0.05, false);
  const doorLogLintel = createLowPolyMesh(new THREE.CylinderGeometry(0.18, 0.20, 2.15, 6), woodCol, doorX, 2.42, d * 0.5 + 0.16, false);
  doorLogLintel.rotation.z = Math.PI / 2;
  const doorArch = createLowPolyMesh(new THREE.CylinderGeometry(0.82, 0.82, 0.26, 7, 1, false, 0, Math.PI), archStoneCol, doorX, 2.22, d * 0.5 + 0.06, false);
  doorArch.rotation.z = -Math.PI / 2;
  doorArch.rotation.y = Math.PI / 2;
  houseGrp.add(doorVoid, doorPlank, doorLogLintel, doorArch);

  const winX = w * 0.24;
  const winVoid = createLowPolyMesh(new THREE.BoxGeometry(1.15, 1.15, 0.20), darkVoid, winX, 2.25, d * 0.5 + 0.02, false);
  const winSill = createLowPolyMesh(new THREE.BoxGeometry(1.42, 0.16, 0.34), archStoneCol, winX, 1.62, d * 0.5 + 0.10, false);
  const winLintel = createLowPolyMesh(new THREE.CylinderGeometry(0.14, 0.15, 1.60, 6), woodCol, winX, 2.88, d * 0.5 + 0.14, false);
  winLintel.rotation.z = Math.PI / 2;
  const shutterL = createLowPolyMesh(new THREE.BoxGeometry(0.36, 1.10, 0.10), '#9a5822', winX - 0.72, 2.25, d * 0.5 + 0.12, false);
  const shutterR = createLowPolyMesh(new THREE.BoxGeometry(0.36, 1.10, 0.10), '#9a5822', winX + 0.72, 2.25, d * 0.5 + 0.12, false);
  houseGrp.add(winVoid, winSill, winLintel, shutterL, shutterR);

  for (let p = 0; p < 3; p++) {
    const paver = createLowPolyMesh(
      new THREE.BoxGeometry(0.85, 0.08, 0.55),
      p % 2 === 0 ? '#cbd5e1' : '#94a3b8',
      doorX + (p % 2 - 0.5) * 0.28,
      0.04,
      d * 0.5 + 0.65 + p * 0.68,
      false
    );
    houseGrp.add(paver);
  }
  const pot1 = createJudeanClayPotMesh(1.0, '#c26d38');
  pot1.position.set(doorX - 1.25, 0, d * 0.5 + 0.45);
  const pot2 = createJudeanClayPotMesh(0.78, '#b45309');
  pot2.position.set(doorX - 1.72, 0, d * 0.5 + 0.55);
  houseGrp.add(pot1, pot2);

  if (variant === 1 || variant === 3) {
    const towerW = w * 0.54;
    const towerH = 2.95;
    const towerD = d * 0.78;
    const towerX = -w * 0.22;
    const towerZ = -d * 0.08;

    const upperBlock = registerFadeMesh(createLowPolyMesh(new THREE.BoxGeometry(towerW, towerH, towerD), wallCol, towerX, h + towerH * 0.5, towerZ));
    const upperParapetF = registerFadeMesh(createLowPolyMesh(new THREE.BoxGeometry(towerW + 0.1, 0.42, 0.30), trimCol, towerX, h + towerH + 0.21, towerZ + towerD * 0.5 - 0.15));
    const upperParapetB = registerFadeMesh(createLowPolyMesh(new THREE.BoxGeometry(towerW + 0.1, 0.42, 0.30), trimCol, towerX, h + towerH + 0.21, towerZ - towerD * 0.5 + 0.15));
    const upperWin = createLowPolyMesh(new THREE.BoxGeometry(0.95, 1.15, 0.18), darkVoid, towerX, h + 1.45, towerZ + towerD * 0.5 + 0.02, false);
    const upperShutterL = createLowPolyMesh(new THREE.BoxGeometry(0.32, 1.12, 0.10), '#b45309', towerX - 0.62, h + 1.45, towerZ + towerD * 0.5 + 0.08, false);
    const upperDoor = createLowPolyMesh(new THREE.BoxGeometry(1.10, 1.95, 0.18), '#78350f', towerX + towerW * 0.5 + 0.02, h + 1.0, towerZ, false);
    houseGrp.add(upperBlock, upperParapetF, upperParapetB, upperWin, upperShutterL, upperDoor);

    const pergolaW = w * 0.46;
    const pergolaD = 2.1;
    const pergX = w * 0.22;
    const pergZ = d * 0.5 + pergolaD * 0.5 - 0.1;
    const pergRoof = registerFadeMesh(createLowPolyMesh(new THREE.BoxGeometry(pergolaW, 0.18, pergolaD), '#b45309', pergX, 2.75, pergZ));
    const postL = createLowPolyMesh(new THREE.CylinderGeometry(0.11, 0.13, 2.75, 6), woodCol, pergX - pergolaW * 0.44, 1.38, pergZ + pergolaD * 0.42);
    const postR = createLowPolyMesh(new THREE.CylinderGeometry(0.11, 0.13, 2.75, 6), woodCol, pergX + pergolaW * 0.44, 1.38, pergZ + pergolaD * 0.42);
    const roofPot = createJudeanClayPotMesh(0.75, '#d97706');
    roofPot.position.set(pergX, 2.84, pergZ);
    houseGrp.add(pergRoof, postL, postR, roofPot);
  }

  if (variant === 2) {
    const awW = 3.2, awD = 1.9;
    const awX = w * 0.22, awZ = d * 0.5 + awD * 0.5;
    const awning = registerFadeMesh(createLowPolyMesh(new THREE.BoxGeometry(awW, 0.16, awD), '#92400e', awX, 2.65, awZ));
    awning.rotation.x = 0.22;
    const p1 = createLowPolyMesh(new THREE.CylinderGeometry(0.10, 0.11, 2.45, 6), woodCol, awX - awW * 0.44, 1.22, awZ + awD * 0.42);
    const p2 = createLowPolyMesh(new THREE.CylinderGeometry(0.10, 0.11, 2.45, 6), woodCol, awX + awW * 0.44, 1.22, awZ + awD * 0.42);
    const crate = createLowPolyMesh(new THREE.BoxGeometry(1.45, 0.65, 0.95), '#b45309', awX, 0.33, awZ, false);
    const fruit1 = createLowPolyMesh(new THREE.DodecahedronGeometry(0.28, 0), '#facc15', awX - 0.3, 0.78, awZ, false);
    const fruit2 = createLowPolyMesh(new THREE.DodecahedronGeometry(0.26, 0), '#4ade80', awX + 0.3, 0.78, awZ, false);
    houseGrp.add(awning, p1, p2, crate, fruit1, fruit2);
  }

  const showVisualStairs = withRoofStairs || (variant === 0) || (variant === 1) || (variant === 3);
  if (showVisualStairs) {
    const stairSide = withRoofStairs ? 1 : ((variant % 2 === 0) ? -1 : 1);
    const stairW = 1.55;
    const stairLocalX = stairSide * (w * 0.5 + stairW * 0.5 - 0.04);
    const stepCount = 6;

    for (let s = 1; s <= stepCount; s++) {
      const sh = (h / stepCount) * s;
      const sz = (d * 0.5) - (s - 0.5) * (d / stepCount);
      const stepMesh = registerFadeMesh(
        createLowPolyMesh(new THREE.BoxGeometry(stairW, sh, d / stepCount + 0.04), archStoneCol, stairLocalX, sh * 0.5, sz)
      );
      houseGrp.add(stepMesh);

      if (withRoofStairs && Math.abs(facingYaw) < 0.05) {
        const worldStairX = cx + stairLocalX;
        const worldStairZ = cz + sz;
        platforms.push({
          minX: worldStairX - stairW * 0.55,
          maxX: worldStairX + stairW * 0.55,
          minZ: worldStairZ - (d / (stepCount * 2)) - 0.15,
          maxZ: worldStairZ + (d / (stepCount * 2)) + 0.15,
          topY: by + sh
        });
      }
    }
  }

  houseGrp.position.set(cx, by, cz);
  houseGrp.rotation.y = facingYaw;
  worldGroup.add(houseGrp);

  const cosY = Math.abs(Math.cos(facingYaw));
  const sinY = Math.abs(Math.sin(facingYaw));
  const effHalfW = (w * 0.5 * cosY) + (d * 0.5 * sinY) + 0.30;
  const effHalfD = (w * 0.5 * sinY) + (d * 0.5 * cosY) + 0.30;

  colliders.push({
    minX: cx - effHalfW,
    maxX: cx + effHalfW,
    minZ: cz - effHalfD,
    maxZ: cz + effHalfD
  });
  platforms.push({
    minX: cx - effHalfW,
    maxX: cx + effHalfW,
    minZ: cz - effHalfD,
    maxZ: cz + effHalfD,
    topY: by + h
  });

  return houseGrp;
}

function addJudeanRoadsideBuilding(cx, cz, variant = 0, facingYaw = 0, scale = 1.0, withRoofStairs = false) {
  const palettes = [
    { wall: '#ead7b7', roof: '#d4bc94', w: 7.4, h: 3.9, d: 6.2 },
    { wall: '#f2e3c9', roof: '#dcc7a4', w: 8.4, h: 4.1, d: 6.8 },
    { wall: '#e4b87a', roof: '#c89654', w: 7.6, h: 3.8, d: 6.0 },
    { wall: '#dfc49a', roof: '#c4a474', w: 8.6, h: 4.0, d: 6.6 },
    { wall: '#eee0c5', roof: '#d5c09d', w: 6.8, h: 3.7, d: 5.8 }
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
// 6. 에피소드 4 전용 커스텀 UI ('나의 복음서 수첩' & '미션 거절 버튼 포함 대화창')
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

      <div id="miracle-dialog-modal" class="hidden pointer-events-auto mt-auto mb-28 mc-panel bg-amber-50/95 border-4 border-amber-700 rounded-3xl p-4 max-w-md w-[92%] text-slate-900 shadow-2xl flex flex-col gap-2">
        <div class="flex items-center justify-between gap-2">
          <span id="miracle-dialog-speaker" class="px-3 py-0.5 rounded-full bg-amber-800 text-amber-100 font-jua text-xs sm:text-sm">주민</span>
          <span id="miracle-dialog-cat-badge" class="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-950 font-jua text-[11px]">🟡 소문</span>
        </div>
        <p id="miracle-dialog-text" class="font-bold text-xs sm:text-sm leading-relaxed min-h-[40px] text-slate-800"></p>
        <div id="miracle-dialog-quiz-box" class="hidden flex-col gap-1.5 mt-1"></div>
        <div class="flex justify-end gap-2 mt-1">
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
  if (!modal) return;

  const catMeta = {
    rumor:      { label: '🟡 소문 (다른 사람에게 들은 이야기)', cls: 'bg-amber-200 text-amber-950' },
    eyewitness: { label: '🔵 목격담 (직접 경험한 증언)',         cls: 'bg-sky-200 text-sky-950' },
    word:       { label: '🟣 말씀 (예수님의 직접 가르침)',       cls: 'bg-purple-200 text-purple-950' },
    parable:    { label: '🌱 비유 (예수님이 들려주신 교훈 이야기)', cls: 'bg-emerald-200 text-emerald-950' },
    story:      { label: '✨ 복음서 사건 체험',                  cls: 'bg-rose-200 text-rose-950' }
  }[options.category || 'rumor'];

  miracleDialogState.active = true;
  miracleDialogState.onConfirm = options.onConfirm || null;
  miracleDialogState.onCancel = options.onCancel || null;

  if (options.notebookId) {
    unlockMiracleNotebookEntry(options.notebookId, false);
  }

  speakerEl.textContent = options.speaker || '갈릴리 주민';
  badgeEl.textContent = catMeta.label;
  badgeEl.className = `px-2.5 py-0.5 rounded-full font-jua text-[11px] ${catMeta.cls}`;
  textEl.textContent = options.text || '';
  speakText(options.text || '');

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
  if (typeof cb === 'function') cb();
};

window.cancelMiracleDialog = function () {
  const modal = document.getElementById('miracle-dialog-modal');
  if (modal) modal.classList.add('hidden');
  miracleDialogState.active = false;
  const cancelCb = miracleDialogState.onCancel;
  miracleDialogState.onConfirm = null;
  miracleDialogState.onCancel = null;
  playSfx('step');
  if (typeof cancelCb === 'function') {
    cancelCb();
  } else {
    showToast('✋ 미션을 거절했어요. 준비되면 언제든 다시 찾아오세요!');
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