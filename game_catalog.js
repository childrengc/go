// =========================================================================
// [공통 카탈로그] 에피소드 · 예수님의 발자취 카드 · 미션 · 탐험수첩 통합 정의
// - 게임(index.html / core.js / ep4_miracle_base.js)과 관리자(admin.html) 공용
// - 새 발자취 카드(fp_6, fp_7 등)·미션·수첩 항목 추가 시 이 파일만 수정하면 자동 반영됩니다.
// =========================================================================
window.__GAME_BUILD_VERSIONS__ = window.__GAME_BUILD_VERSIONS__ || {};
window.__GAME_BUILD_VERSIONS__.catalog = '3.12.3';

window.BIBLE_GAME_CATALOG = {
  episodesOrder: ['noah', 'exodus', 'david', 'miracle'],

  episodeCardMeta: {
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
  },

  footstepsOrder: ['fp_1', 'fp_2', 'fp_3', 'fp_4', 'fp_5'],

  footstepsMeta: {
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
  },

  miracleMissions: [
    { id: 'main_1',         group: '메인',   title: '메인1 · 깊은 곳으로 / 풍랑' },
    { id: 'main_2',         group: '메인',   title: '메인2 · 오병이어의 기적' },
    { id: 'main_3',         group: '메인',   title: '메인3 · 골고다 십자가의 길' },
    { id: 'main_4',         group: '메인',   title: '메인4 · 빈 무덤과 부활' },
    { id: 'ev_cana',        group: '사건',   title: '가나 혼인잔치 물항아리' },
    { id: 'ev_paralytic',   group: '사건',   title: '중풍병자 지붕 뚫기' },
    { id: 'ev_children',    group: '사건',   title: '어린아이 축복' },
    { id: 'ev_well',        group: '사건',   title: '수가성 우물가 여인' },
    { id: 'ev_zacchaeus',   group: '사건',   title: '삭개오 돌무화과나무' },
    { id: 'ev_samaritan',   group: '사건',   title: '선한 사마리아인' },
    { id: 'ev_lepers',      group: '사건',   title: '돌아온 한 명의 나병환자' },
    { id: 'ev_palm',        group: '사건',   title: '호산나 예루살렘 입성' },
    { id: 'ev_washfeet',    group: '사건',   title: '제자들의 발을 씻기심' },
    { id: 'ev_widow',       group: '사건',   title: '과부의 두 렙돈 헌금' },
    { id: 'par_sower',      group: '비유',   title: '[비유] 씨 뿌리는 사람' },
    { id: 'par_sheep',      group: '비유',   title: '[비유] 잃어버린 어린양' },
    { id: 'par_builder',    group: '비유',   title: '[비유] 반석 위의 집' },
    { id: 'par_mustard',    group: '비유',   title: '[비유] 겨자씨 한 알' },
    { id: 'ev_nicodemus',   group: '밤미션', title: '🌙 밤에 찾아온 니고데모' },
    { id: 'post_emmaus',    group: '부활후', title: '엠마오로 가는 두 제자' },
    { id: 'post_thomas',    group: '부활후', title: '도마의 부활 신앙 고백' },
    { id: 'post_breakfast', group: '부활후', title: '갈릴리 숯불 아침식사' }
  ],

  miracleNotebookCategories: [
    { key: 'rumors',      label: '🟡 소문',     toastLabel: '🟡 소문 기록' },
    { key: 'miracles',    label: '✨ 기적',     toastLabel: '✨ 기적 목격' },
    { key: 'parables',    label: '🌱 비유',     toastLabel: '🌱 비유 체험' },
    { key: 'words',       label: '📜 말씀',     toastLabel: '📜 말씀 수집' },
    { key: 'testimonies', label: '🕊️ 부활증언', toastLabel: '🕊️ 부활 증언' }
  ],

  miracleNotebookDb: {
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
      { id: 'mir_resurrect', title: '사망을 이기시고 부활하시다',       verse: '마태복음 28:5~6',   desc: '십자가에서 죽으신 지 사흘 만에 돌무덤을 열고 말씀하신 대로 다시 살아나신 최고의 기적.' },
      { id: 'mir_nicodemus', title: '밤에 찾아온 니고데모 (거듭남)',   verse: '요한복음 3:3~16',   desc: '로마 군인의 야간 순찰을 피해 밤중에 예수님을 찾아온 니고데모에게 거듭남과 하나님의 사랑을 들려주신 사건.' }
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
  },

  miracleLegacyMissionNotebookMap: {
    ev_cana: 'mir_cana',
    ev_paralytic: 'mir_paralytic',
    ev_children: 'wd_mark1014',
    ev_well: 'wd_john414',
    ev_zacchaeus: 'wd_luke1910',
    ev_samaritan: 'wd_luke1037',
    ev_lepers: 'mir_lepers',
    ev_washfeet: 'wd_john1314',
    ev_widow: 'wd_mark1243',
    par_sower: 'par_sower',
    par_sheep: 'par_sheep',
    par_builder: 'par_builder',
    par_mustard: 'par_mustard',
    ev_nicodemus: 'mir_nicodemus',
    post_emmaus: 'test_emmaus',
    post_thomas: 'test_thomas',
    post_breakfast: 'test_breakfast'
  }
};
