// =========================================================================
// [ep4_mp_village.js] 에피소드 4 온라인 마을 통합 모듈 (개발본 v3.14.1 · 1~2단계 통합)
// - CRDT 무충돌 방 동기화(contribs/{playerKey} + atomic POST news + footprints + decorations + farm + pull-before-push)
// - 1단계: 2층 계단/실내 진입 [반석 위의 집] · 4대 상점 건축 · 4탭 [마을 일지] · 중앙 게시판
// - 2단계: 갈릴리 낚시 · 우물 연동 5단계 농사 · 양떼 목장 · 상점 납품/NPC 손님 판매(달란트) · 5단계 성전 건축 · 마을 꾸미기 4종
// =========================================================================
window.__GAME_BUILD_VERSIONS__ = window.__GAME_BUILD_VERSIONS__ || {};
window.__GAME_BUILD_VERSIONS__.ep4_mp_village = '3.14.1';

(function () {
  const MAX_NEWS_ITEMS = 20;
  const TEMPLE_TARGET_TALENTS = 300;
  const TEMPLE_STEP_TALENTS = 60;

  const PROJECTS = {
    rock_house: {
      id: 'rock_house',
      order: 0,
      kind: 'house',
      name: '반석 위의 집',
      icon: '🏗️',
      desc: '계단으로 2층까지 오르고 1·2층 실내에 들어갈 수 있는 대형 공동 회관',
      pos: { x: 63.0, z: 18.0 },
      teleportPos: { x: 52.5, z: 22.0 },
      yaw: 0,
      deliverRadius: 11.5,
      woodReq: 20,
      stoneReq: 20,
      stages: 5,
      awningColor: '#eab308',
      awningTrim: '#b45309',
      verseRef: '마태복음 7장 24~25절',
      verseText: '"그러므로 누구든지 나의 이 말을 듣고 행하는 자는 그 집을 반석 위에 지은 지혜로운 사람 같으리니 비가 내리고 창수가 나고 바람이 불어 그 집에 부딪치되 무너지지 아니하나니 이는 주추를 반석 위에 놓은 까닭이요"',
      note: '친구들과 힘을 모아 1층 교제실과 동쪽 계단, 2층 다락방까지 오를 수 있는 든든한 반석 위의 집을 완성했어요!',
      stage2Hint: '1층 회관과 2층 다락방을 자유롭게 구경하며 친구들과 교제해 보세요!'
    },
    shop_milk: {
      id: 'shop_milk',
      order: 1,
      kind: 'shop',
      name: '양젖 가게',
      icon: '🥛',
      desc: '신선한 양젖과 치즈를 나누는 마을 첫 번째 가게',
      pos: { x: -15.5, z: -22.0 },
      teleportPos: { x: -9.5, z: -22.0 },
      yaw: Math.PI * 0.5,
      deliverRadius: 6.4,
      woodReq: 8,
      stoneReq: 6,
      stages: 3,
      awningColor: '#38bdf8',
      awningTrim: '#0284c7',
      shopkeeperPreset: 'woman',
      shopkeeperIdx: 12,
      verseRef: '베드로전서 2장 2절',
      verseText: '"갓난 아기들 같이 순전하고 신령한 젖을 사모하라 이는 그로 말미암아 너희로 구원에 이르도록 자라게 하려 함이라"',
      note: '사랑과 정성으로 양젖 가게를 완공했어요!',
      stage2Hint: '갈릴리 양떼 목장에서 🥛 양젖을 짜서 양젖 가게에 납품할 수 있어요!'
    },
    shop_fish: {
      id: 'shop_fish',
      order: 2,
      kind: 'shop',
      name: '생선 가게',
      icon: '🐟',
      desc: '갈릴리 바다의 싱싱한 물고기를 나누는 가게',
      pos: { x: 15.5, z: -20.5 },
      teleportPos: { x: 9.5, z: -20.5 },
      yaw: -Math.PI * 0.5,
      deliverRadius: 6.4,
      woodReq: 8,
      stoneReq: 6,
      stages: 3,
      awningColor: '#0284c7',
      awningTrim: '#0369a1',
      shopkeeperPreset: 'peter',
      shopkeeperIdx: 0,
      verseRef: '마태복음 4장 19절',
      verseText: '"말씀하시되 나를 따라오라 내가 너희를 사람을 낚는 어부가 되게 하리라 하시니"',
      note: '기쁜 마음으로 갈릴리 생선 가게를 완공했어요!',
      stage2Hint: '갈릴리 선착장 낚시터가 해금되었어요! 잡은 🐟 물고기를 가게에 납품해 보세요!'
    },
    shop_grain: {
      id: 'shop_grain',
      order: 3,
      kind: 'shop',
      name: '곡물 가게',
      icon: '🌾',
      desc: '정성껏 키운 황금 밀과 따뜻한 빵을 나누는 가게',
      pos: { x: -15.5, z: 10.5 },
      teleportPos: { x: -9.5, z: 10.5 },
      yaw: Math.PI * 0.5,
      deliverRadius: 6.4,
      woodReq: 8,
      stoneReq: 6,
      stages: 3,
      awningColor: '#d97706',
      awningTrim: '#92400e',
      shopkeeperPreset: 'villager',
      shopkeeperIdx: 15,
      verseRef: '요한복음 6장 35절',
      verseText: '"예수께서 이르시되 나는 생명의 떡이니 내게 오는 자는 결코 주리지 아니할 터이요 나를 믿는 자는 영원히 목마르지 아니하리라"',
      note: '풍성한 곡식을 나누는 곡물 가게를 함께 지었어요!',
      stage2Hint: '야곱의 우물 연동 5단계 농사가 해금되었어요! 수확한 🌾 밀단을 납품해 보세요!'
    },
    shop_cloth: {
      id: 'shop_cloth',
      order: 4,
      kind: 'shop',
      name: '옷가게',
      icon: '👕',
      desc: '포근한 양털로 고운 옷을 지어 입히는 가게',
      pos: { x: 15.5, z: 10.5 },
      teleportPos: { x: 9.5, z: 10.5 },
      yaw: -Math.PI * 0.5,
      deliverRadius: 6.4,
      woodReq: 8,
      stoneReq: 6,
      stages: 3,
      awningColor: '#e11d48',
      awningTrim: '#9f1239',
      shopkeeperPreset: 'female_1',
      shopkeeperIdx: 1,
      verseRef: '골로새서 3장 12절',
      verseText: '"그러므로 너희는 하나님이 택하사 거룩하고 사랑 받는 자처럼 긍휼과 자비와 겸손과 온유와 오래 참음을 옷 입고"',
      note: '이웃에게 따뜻한 옷을 지어 줄 옷가게를 완공했어요!',
      stage2Hint: '갈릴리 양떼 목장에서 포근한 🧶 양털을 깎아 옷가게에 납품해 보세요!'
    }
  };

  const PROJECT_ORDER = ['rock_house', 'shop_milk', 'shop_fish', 'shop_grain', 'shop_cloth'];
  const SHOPS_ORDER = ['shop_milk', 'shop_fish', 'shop_grain', 'shop_cloth'];
  const BULLETIN_POS = { x: 0.0, z: -6.0, teleportPos: { x: 0.0, z: -10.5 } };

  const GOODS_META = {
    milk:  { id: 'milk',  shopId: 'shop_milk',  name: '양젖',   icon: '🥛', price: 15, maxCarry: 8 },
    fish:  { id: 'fish',  shopId: 'shop_fish',  name: '물고기', icon: '🐟', price: 12, maxCarry: 8 },
    wheat: { id: 'wheat', shopId: 'shop_grain', name: '밀단',   icon: '🌾', price: 20, maxCarry: 8 },
    wool:  { id: 'wool',  shopId: 'shop_cloth', name: '양털',   icon: '🧶', price: 15, maxCarry: 8 }
  };
  const GOODS_ORDER = ['milk', 'fish', 'wheat', 'wool'];
  const SHOP_TO_GOOD = {
    shop_milk: 'milk',
    shop_fish: 'fish',
    shop_grain: 'wheat',
    shop_cloth: 'wool'
  };

  const ACTIVITY_SPOTS = {
    fishing: {
      id: 'fishing',
      name: '갈릴리 선착장 낚시터',
      icon: '🎣',
      reqShop: 'shop_fish',
      pos: { x: -94.0, z: -68.0 },
      teleportPos: { x: -86.0, z: -68.0 }
    },
    farm: {
      id: 'farm',
      name: '우물 연동 5단계 농사 밭',
      icon: '🌱',
      reqShop: 'shop_grain',
      pos: { x: -32.0, z: 4.0 },
      teleportPos: { x: -25.5, z: 4.0 }
    },
    well: {
      id: 'well',
      name: '야곱의 우물 (물 긷기)',
      icon: '💧',
      reqShop: 'shop_grain',
      pos: { x: -32.0, z: -12.0 },
      teleportPos: { x: -27.5, z: -12.0 }
    },
    seed_bush: {
      id: 'seed_bush',
      name: '들판 씨앗 수풀',
      icon: '🌾',
      reqShop: 'shop_grain',
      positions: [{ x: -38.0, z: 1.5 }, { x: -26.0, z: 1.5 }]
    },
    pasture: {
      id: 'pasture',
      name: '갈릴리 양떼 목장',
      icon: '🐑',
      reqShop: 'shop_milk',
      pos: { x: 32.0, z: -30.0 },
      teleportPos: { x: 25.0, z: -30.0 }
    },
    temple: {
      id: 'temple',
      name: '예루살렘 성전 건축 터',
      icon: '⛪',
      pos: { x: 0.0, z: 72.0 },
      offerPos: { x: 0.0, z: 54.0 },
      teleportPos: { x: 0.0, z: 50.0 }
    }
  };

  const TEMPLE_META = {
    id: 'temple',
    name: '예루살렘 성전',
    icon: '⛪',
    targetTalents: TEMPLE_TARGET_TALENTS,
    verseRef: '학개 1장 8절',
    verseText: '"너희는 산에 올라가서 나무를 가져다가 성전을 건축하라 그리하면 내가 그것으로 말미암아 기뻐하고 또 영광을 얻으리라 여호와가 말하였느니라"',
    note: '우리 방 친구들이 상점에서 일하고 정성껏 모은 달란트 헌금으로 아름다운 예루살렘 성전을 완공했어요!'
  };

  const DECORATIONS = {
    decor_braziers: {
      id: 'decor_braziers',
      order: 0,
      name: '따뜻한 마을 화로 거리',
      icon: '🔥',
      cost: 30,
      desc: '밤에도 마을 길을 환하고 따뜻하게 비추는 청동 화로 6기',
      teleportPos: { x: 0.0, z: -16.0 },
      verseRef: '마태복음 5장 14~16절',
      verseText: '"너희는 세상의 빛이라 산 위에 있는 동네가 숨겨지지 못할 것이요 이같이 너희 빛이 사람 앞에 비치게 하여 그들로 너희 착한 행실을 보고 하늘에 계신 너희 아버지께 영광을 돌리게 하라"',
      note: '따뜻한 빛으로 마을 골목을 밝히는 청동 화로 거리를 꾸몄어요!'
    },
    decor_flowers: {
      id: 'decor_flowers',
      order: 1,
      name: '갈릴리 꽃길 정원',
      icon: '🌸',
      cost: 40,
      desc: '중앙 광장과 상점 골목을 화사하게 수놓는 알록달록 꽃길',
      teleportPos: { x: 0.0, z: -2.0 },
      verseRef: '마태복음 6장 28~29절',
      verseText: '"들의 백합화가 어떻게 자라는가 생각하여 보라 수고도 아니하고 길쌈도 아니하느니라 그러나 내가 너희에게 말하노니 솔로몬의 모든 영광으로도 입은 것이 이 꽃 하나만 같지 못하였느니라"',
      note: '하나님이 가꾸시는 들꽃처럼 아름다운 갈릴리 꽃길 정원을 만들었어요!'
    },
    decor_fountain: {
      id: 'decor_fountain',
      order: 2,
      name: '은혜의 광장 쉼터 분수',
      icon: '⛲',
      cost: 50,
      desc: '시원한 물줄기가 솟아오르는 중앙 광장 석조 분수와 나무 벤치',
      teleportPos: { x: 0.0, z: -1.5 },
      verseRef: '요한복음 4장 14절',
      verseText: '"내가 주는 물을 마시는 자는 영원히 목마르지 아니하리니 내가 주는 물은 그 속에서 영생하도록 솟아나는 샘물이 되리라"',
      note: '친구들이 모여 쉬며 교제할 수 있는 시원한 광장 분수를 세웠어요!'
    },
    decor_party: {
      id: 'decor_party',
      order: 3,
      name: '기쁨의 마을 축제 파티장',
      icon: '🎉',
      cost: 70,
      desc: '만국기 가랜드 · 잔칫상 · 등불이 어우러진 모두의 축제 광장',
      teleportPos: { x: 10.5, z: -4.0 },
      verseRef: '시편 133편 1절',
      verseText: '"보라 형제가 연합하여 동거함이 어찌 그리 선하고 아름다운고"',
      note: '모두가 한마음으로 기뻐하며 잔치를 여는 축제의 파티장을 완성했어요!'
    }
  };
  const DECOR_ORDER = ['decor_braziers', 'decor_flowers', 'decor_fountain', 'decor_party'];

  const FOOTPRINT_ORDER = [
    'rock_house', 'shop_milk', 'shop_fish', 'shop_grain', 'shop_cloth',
    'temple',
    'decor_braziers', 'decor_flowers', 'decor_fountain', 'decor_party'
  ];

  const FARM_STEPS = [
    { step: 0, key: 'clear_rocks',   label: '1단계: 돌 골라내기',  icon: '🪨', reqHits: 3 },
    { step: 1, key: 'clear_vines',   label: '2단계: 넝쿨 치우기',  icon: '🌿', reqHits: 3 },
    { step: 2, key: 'plant_seeds',   label: '3~4단계: 씨앗 찾기/뿌리기', icon: '🌱', reqHits: 3 },
    { step: 3, key: 'water_crops',   label: '5단계: 우물 물주기',  icon: '💧', reqHits: 3 },
    { step: 4, key: 'harvest_wheat', label: '수확: 황금 밀 거두기', icon: '🌾', reqHits: 1 }
  ];

  const PRAISE_BADGES = [
    {
      id: 'architect_1',
      icon: '🏗️',
      title: '든든한 건축가',
      desc: '반석과 상점에 나무·돌 재료를 1회 이상 쌓았어요!',
      check: (st) => (st.actions.build || 0) >= 1
    },
    {
      id: 'architect_2',
      icon: '🏛️',
      title: '지혜로운 반석 장인',
      desc: '반석과 마을 건물에 10번 넘게 정성껏 재료를 쌓았어요!',
      check: (st) => (st.actions.build || 0) >= 10
    },
    {
      id: 'market_pioneer',
      icon: '🏪',
      title: '따뜻한 시장 개척자',
      desc: '양젖·생선·곡물·옷가게 중 1곳 이상 건축에 참여했어요!',
      check: (st) => st.shopBuildContribCount >= 1
    },
    {
      id: 'village_helper',
      icon: '🤝',
      title: '다정한 마을 일꾼',
      desc: '우리 방 친구들을 위해 부지런히 5회 이상 섬겼어요!',
      check: (st) => st.totalActions >= 5
    },
    {
      id: 'stage2_farmer',
      icon: '🌾',
      title: '부지런한 농부',
      desc: '우물 연동 5단계 정성으로 밀 농사를 돕고 수확했어요!',
      check: (st) => (st.actions.farm || 0) >= 1
    },
    {
      id: 'stage2_fisher',
      icon: '🎣',
      title: '갈릴리 어부',
      desc: '갈릴리 선착장에서 싱싱한 물고기를 낚아 올렸어요!',
      check: (st) => (st.actions.fish || 0) >= 1
    },
    {
      id: 'stage2_shepherd',
      icon: '🐑',
      title: '다정한 목자',
      desc: '양떼 목장에서 양젖짜기나 양털깎기로 양들을 돌보았어요!',
      check: (st) => (st.actions.livestock || 0) >= 1
    },
    {
      id: 'stage2_merchant',
      icon: '🛒',
      title: '기쁨의 상인',
      desc: '완공된 상점에 자원을 납품해 손님들에게 나누었어요!',
      check: (st) => (st.actions.deliver || 0) >= 1
    },
    {
      id: 'temple_offerer',
      icon: '⛪',
      title: '성전 건축 헌금자',
      desc: '모은 공동기금 달란트를 예루살렘 성전 건축에 봉헌했어요!',
      check: (st) => (st.actions.offer || 0) >= 1
    },
    {
      id: 'village_decorator',
      icon: '🎨',
      title: '마을 꾸미기 디자이너',
      desc: '공동기금으로 화로·꽃길·분수·파티장 꾸미기에 함께했어요!',
      check: (st) => (st.actions.decor || 0) >= 1
    }
  ];

  function _disposeObjSafe(obj) {
    if (!obj) return;
    if (typeof disposeObject3DResources === 'function') {
      try { disposeObject3DResources(obj); return; } catch (e) {}
    }
    if (typeof obj.traverse === 'function') {
      obj.traverse(ch => {
        if (!ch || !ch.isMesh) return;
        if (ch.geometry && !(ch.geometry.userData && ch.geometry.userData._cached) && typeof ch.geometry.dispose === 'function') {
          try { ch.geometry.dispose(); } catch (e) {}
        }
      });
    }
  }

  function _drawCanvasLabelTexture(titleText, subText, opts = {}) {
    if (typeof document === 'undefined' || typeof THREE === 'undefined' || typeof THREE.CanvasTexture !== 'function') return null;
    try {
      const cv = document.createElement('canvas');
      cv.width = opts.width || 256;
      cv.height = opts.height || 128;
      const ctx = cv.getContext('2d');
      if (!ctx) return null;
      ctx.fillStyle = opts.bg || '#5c3317';
      ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.strokeStyle = opts.border || '#fbbf24';
      ctx.lineWidth = 6;
      ctx.strokeRect(4, 4, cv.width - 8, cv.height - 8);
      ctx.textAlign = 'center';
      ctx.fillStyle = opts.titleColor || '#fef3c7';
      ctx.font = opts.titleFont || 'bold 34px "Malgun Gothic", sans-serif';
      ctx.fillText(String(titleText || ''), cv.width * 0.5, cv.height * 0.48);
      if (subText) {
        ctx.fillStyle = opts.subColor || '#fde68a';
        ctx.font = opts.subFont || 'bold 20px "Malgun Gothic", sans-serif';
        ctx.fillText(String(subText), cv.width * 0.5, cv.height * 0.78);
      }
      const tex = new THREE.CanvasTexture(cv);
      tex.needsUpdate = true;
      return tex;
    } catch (e) {
      return null;
    }
  }

  const MiracleMpVillage = {
    PROJECTS,
    PROJECT_ORDER,
    SHOPS_ORDER,
    BULLETIN_POS,
    GOODS_META,
    GOODS_ORDER,
    SHOP_TO_GOOD,
    ACTIVITY_SPOTS,
    TEMPLE_TARGET_TALENTS,
    TEMPLE_STEP_TALENTS,
    TEMPLE_META,
    DECORATIONS,
    DECOR_ORDER,
    FOOTPRINT_ORDER,
    FARM_STEPS,
    PRAISE_BADGES,

    roomId: '광릉내1방',
    resetEpoch: 0,
    firebaseHydrated: false,
    lastCloudSyncAt: 0,
    contribDirty: false,
    activeFocusBuildId: 'rock_house',
    currentJournalTab: 'coop',
    selectedFootprintId: null,

    contribs: {},
    footprints: {},
    decorations: {},
    farm: { cycle: 0, step: 0, subProgress: 0, updatedAt: 0 },
    news: [],
    treasury: { talents: 0, totalEarned: 0, offeredToTemple: 0, spentOnDecor: 0 },

    bag: {
      wood: 0,
      stone: 0,
      fish: 0,
      wheat: 0,
      milk: 0,
      wool: 0,
      seed: 0,
      waterBucket: 0
    },
    maxCarryWood: 8,
    maxCarryStone: 8,
    maxCarryGoods: 8,
    maxCarrySeed: 6,
    maxCarryWater: 3,
    fishingHits: 0,

    // 3D 런타임 참조 & 동적 물리 추적 배열
    houseSiteGroup: null,
    houseGroup: null,
    houseRing: null,
    houseLabel: null,
    houseBuiltStage: -1,
    _houseDynPlatforms: [],
    _houseDynColliders: [],
    _houseDynWallMeshes: [],

    shopRefs: {},
    _shopDynColliders: {},

    bulletinGroup: null,
    bulletinLabel: null,
    bulletinTexture: null,
    bulletinCanvas: null,
    _bulletinSig: '',

    // 2단계 3D 런타임 참조
    fishingGroup: null,
    fishingBobber: null,
    fishingRing: null,
    fishingLabel: null,
    _fishingUnlockState: null,

    farmGroup: null,
    farmModelGroup: null,
    farmLabel: null,
    wellLabel: null,
    seedBushes: [],
    _farmRenderSig: '',
    _farmWheatMeshes: [],

    pastureGroup: null,
    pastureSheep: [],
    pastureLabel: null,
    _pastureSig: '',

    customerNpcs: [],
    _customerSaleTimers: {},

    templeGroup: null,
    templeModelGroup: null,
    templeOfferBoxGroup: null,
    templeOfferRing: null,
    templeLabel: null,
    templeOfferLabel: null,
    templeBuiltStage: -1,
    _templeDynColliders: [],
    _templeDynWallMeshes: [],
    _templeFireProps: [],

    decorRootGroup: null,
    decorBraziers: [],
    decorFountainDrops: [],
    decorFountainGroup: null,
    _decorDynColliders: [],
    _decorBuiltSig: '',

    sanitizeFirebaseKey(raw) {
      const cleaned = String(raw || '').trim()
        .replace(/[.#$\[\]/\s]+/g, '_')
        .replace(/^_+|_+$/g, '');
      return cleaned.slice(0, 48) || 'anon_player';
    },

    getMyPlayerName() {
      if (typeof explorerDisplayName !== 'undefined' && explorerDisplayName) return String(explorerDisplayName).trim();
      if (window.explorerName) return String(window.explorerName).replace(/\([^)]*\)$/, '').trim() || String(window.explorerName);
      return '대원';
    },

    getMyPlayerKey() {
      const rawId = (window.explorerName && String(window.explorerName).trim())
        || (window.MiracleMultiplayer && window.MiracleMultiplayer.peerId)
        || 'player';
      return this.sanitizeFirebaseKey(rawId);
    },

    getRoomStorageKey() {
      return 'ep4_mp_village_v1_' + encodeURIComponent(this.roomId || 'default');
    },

    getBagStorageKey() {
      return 'ep4_mp_bag_v1_' + encodeURIComponent(this.roomId || 'default') + '_' + this.getMyPlayerKey();
    },

    _createEmptyContrib(name) {
      return {
        name: name || this.getMyPlayerName(),
        resetEpoch: this.resetEpoch,
        builds: {
          rock_house: { wood: 0, stone: 0 },
          shop_milk:  { wood: 0, stone: 0 },
          shop_fish:  { wood: 0, stone: 0 },
          shop_grain: { wood: 0, stone: 0 },
          shop_cloth: { wood: 0, stone: 0 }
        },
        delivered: { milk: 0, fish: 0, wheat: 0, wool: 0 },
        sold: { milk: 0, fish: 0, wheat: 0, wool: 0 },
        offeredTalents: 0,
        actions: { build: 0, farm: 0, fish: 0, livestock: 0, deliver: 0, offer: 0, decor: 0 },
        updatedAt: Date.now()
      };
    },

    _ensureContribRecord(key, displayName) {
      if (!this.contribs[key] || typeof this.contribs[key] !== 'object') {
        this.contribs[key] = this._createEmptyContrib(displayName || key);
      }
      const rec = this.contribs[key];
      if (!rec.builds || typeof rec.builds !== 'object') rec.builds = {};
      PROJECT_ORDER.forEach(pid => {
        if (!rec.builds[pid] || typeof rec.builds[pid] !== 'object') {
          rec.builds[pid] = { wood: 0, stone: 0 };
        }
        rec.builds[pid].wood = Math.max(0, Number(rec.builds[pid].wood) || 0);
        rec.builds[pid].stone = Math.max(0, Number(rec.builds[pid].stone) || 0);
      });
      if (!rec.delivered || typeof rec.delivered !== 'object') rec.delivered = {};
      if (!rec.sold || typeof rec.sold !== 'object') rec.sold = {};
      GOODS_ORDER.forEach(gid => {
        rec.delivered[gid] = Math.max(0, Number(rec.delivered[gid]) || 0);
        rec.sold[gid] = Math.max(0, Number(rec.sold[gid]) || 0);
      });
      rec.offeredTalents = Math.max(0, Number(rec.offeredTalents) || 0);
      if (!rec.actions || typeof rec.actions !== 'object') rec.actions = {};
      ['build', 'farm', 'fish', 'livestock', 'deliver', 'offer', 'decor'].forEach(ak => {
        rec.actions[ak] = Math.max(0, Number(rec.actions[ak]) || 0);
      });
      if (typeof rec.resetEpoch !== 'number') rec.resetEpoch = this.resetEpoch;
      if (displayName) rec.name = displayName;
      return rec;
    },

    _farmTupleVal(f) {
      if (!f || typeof f !== 'object') return 0;
      const c = Math.max(0, Number(f.cycle) || 0);
      const s = Math.max(0, Math.min(4, Number(f.step) || 0));
      const p = Math.max(0, Number(f.subProgress) || 0);
      return c * 100 + s * 10 + p;
    },

    initRoom(roomId) {
      this.roomId = String(roomId || '광릉내1방').trim().slice(0, 16) || '광릉내1방';
      this.resetEpoch = 0;
      this.firebaseHydrated = false;
      this.lastCloudSyncAt = 0;
      this.contribDirty = false;
      this.contribs = {};
      this.footprints = {};
      this.decorations = {};
      this.farm = { cycle: 0, step: 0, subProgress: 0, updatedAt: Date.now() };
      this.news = [];
      this.treasury = { talents: 0, totalEarned: 0, offeredToTemple: 0, spentOnDecor: 0 };
      this.bag = { wood: 0, stone: 0, fish: 0, wheat: 0, milk: 0, wool: 0, seed: 0, waterBucket: 0 };
      this.fishingHits = 0;
      this.selectedFootprintId = null;
      this._customerSaleTimers = {};

      this.loadLocalState();
      this._ensureContribRecord(this.getMyPlayerKey(), this.getMyPlayerName());
      this.getEconomySummary();
      this._syncLegacyMpMissionFields();

      if (window.MiracleMultiplayer && window.MP_FIREBASE_DB_URL && typeof fetch === 'function') {
        this.hydrateFromFirebase();
      }
    },

    loadLocalState() {
      try {
        const raw = localStorage.getItem(this.getRoomStorageKey());
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            this.resetEpoch = Math.max(0, Number(parsed.resetEpoch) || 0);
            if (parsed.contribs && typeof parsed.contribs === 'object') {
              Object.keys(parsed.contribs).forEach(ck => {
                const c = parsed.contribs[ck];
                if (!c || typeof c !== 'object') return;
                const rec = this._ensureContribRecord(ck, c.name);
                rec.resetEpoch = Number(c.resetEpoch) || 0;
                if (c.builds) {
                  PROJECT_ORDER.forEach(pid => {
                    if (c.builds[pid]) {
                      rec.builds[pid].wood = Math.max(0, Number(c.builds[pid].wood) || 0);
                      rec.builds[pid].stone = Math.max(0, Number(c.builds[pid].stone) || 0);
                    }
                  });
                }
                if (c.delivered) {
                  GOODS_ORDER.forEach(gid => {
                    rec.delivered[gid] = Math.max(0, Number(c.delivered[gid]) || 0);
                  });
                }
                if (c.sold) {
                  GOODS_ORDER.forEach(gid => {
                    rec.sold[gid] = Math.max(0, Number(c.sold[gid]) || 0);
                  });
                }
                rec.offeredTalents = Math.max(0, Number(c.offeredTalents) || 0);
                if (c.actions) {
                  Object.keys(rec.actions).forEach(ak => {
                    rec.actions[ak] = Math.max(0, Number(c.actions[ak]) || 0);
                  });
                }
                rec.updatedAt = Number(c.updatedAt) || Date.now();
              });
            }
            if (parsed.footprints && typeof parsed.footprints === 'object') {
              this.footprints = Object.assign({}, parsed.footprints);
            }
            if (parsed.decorations && typeof parsed.decorations === 'object') {
              this.decorations = Object.assign({}, parsed.decorations);
            }
            if (parsed.farm && typeof parsed.farm === 'object') {
              this.farm = {
                cycle: Math.max(0, Number(parsed.farm.cycle) || 0),
                step: Math.max(0, Math.min(4, Number(parsed.farm.step) || 0)),
                subProgress: Math.max(0, Number(parsed.farm.subProgress) || 0),
                updatedAt: Number(parsed.farm.updatedAt) || Date.now()
              };
            }
            if (Array.isArray(parsed.news)) {
              this.news = parsed.news.slice(0, MAX_NEWS_ITEMS);
            }
          }
        } else {
          // 구버전 ep4_mp_room_state_{roomId} 마이그레이션
          const legacyRaw = localStorage.getItem('ep4_mp_room_state_' + encodeURIComponent(this.roomId || 'default'));
          if (legacyRaw) {
            const ld = JSON.parse(legacyRaw);
            if (ld && (typeof ld.wood === 'number' || typeof ld.stone === 'number')) {
              const leg = this._ensureContribRecord('_legacy_rock', '초기 대원');
              leg.builds.rock_house.wood = Math.min(20, Math.max(0, ld.wood || 0));
              leg.builds.rock_house.stone = Math.min(20, Math.max(0, ld.stone || 0));
              if (leg.builds.rock_house.wood >= 20 && leg.builds.rock_house.stone >= 20) {
                this.footprints.rock_house = { id: 'rock_house', completedAt: ld.updatedAt || Date.now(), completedBy: '마을 친구들' };
              }
            }
          }
        }
      } catch (e) {}

      try {
        const bRaw = localStorage.getItem(this.getBagStorageKey());
        if (bRaw) {
          const bd = JSON.parse(bRaw);
          if (bd && typeof bd === 'object') {
            this.bag.wood = Math.min(this.maxCarryWood, Math.max(0, Number(bd.wood) || 0));
            this.bag.stone = Math.min(this.maxCarryStone, Math.max(0, Number(bd.stone) || 0));
            GOODS_ORDER.forEach(k => {
              this.bag[k] = Math.min(this.maxCarryGoods, Math.max(0, Number(bd[k]) || 0));
            });
            this.bag.seed = Math.min(this.maxCarrySeed, Math.max(0, Number(bd.seed) || 0));
            this.bag.waterBucket = Math.min(this.maxCarryWater, Math.max(0, Number(bd.waterBucket) || 0));
          }
        }
      } catch (e) {}

      this.getEconomySummary();
      this._recomputeCompletedFootprintsLocal();
    },

    saveLocalState() {
      this.getEconomySummary();
      try {
        localStorage.setItem(this.getRoomStorageKey(), JSON.stringify({
          resetEpoch: this.resetEpoch,
          contribs: this.contribs,
          footprints: this.footprints,
          decorations: this.decorations,
          farm: this.farm,
          news: this.news.slice(0, MAX_NEWS_ITEMS),
          treasury: this.treasury,
          updatedAt: Date.now()
        }));
      } catch (e) {}
      this.saveBagLocal();

      // 하위 호환용 레거시 방 키 동기화
      const rh = this.getBuildProgress('rock_house');
      try {
        localStorage.setItem('ep4_mp_room_state_' + encodeURIComponent(this.roomId || 'default'), JSON.stringify({
          stone: rh.stone,
          wood: rh.wood,
          completed: rh.completed,
          updatedAt: Date.now()
        }));
      } catch (e) {}
    },

    saveBagLocal() {
      this._syncLegacyMpMissionFields();
      try {
        localStorage.setItem(this.getBagStorageKey(), JSON.stringify(Object.assign({ updatedAt: Date.now() }, this.bag)));
      } catch (e) {}
    },

    _syncLegacyMpMissionFields() {
      if (!window.MiracleMultiplayer || !window.MiracleMultiplayer.mission) return;
      const m = window.MiracleMultiplayer.mission;
      const rh = this.getBuildProgress('rock_house');
      m.stoneDeposited = rh.stone;
      m.woodDeposited = rh.wood;
      m.completed = rh.completed;
      m.carryWood = this.bag.wood;
      m.carryStone = this.bag.stone;
      m.maxCarryEach = this.maxCarryWood;
    },

    getBuildProgress(buildId) {
      const proj = PROJECTS[buildId];
      if (!proj) return { wood: 0, stone: 0, woodReq: 1, stoneReq: 1, pct: 0, stage: 0, completed: false };
      let woodSum = 0;
      let stoneSum = 0;
      const ep = this.resetEpoch;
      Object.keys(this.contribs).forEach(ck => {
        const rec = this.contribs[ck];
        if (!rec || (Number(rec.resetEpoch) || 0) !== ep) return;
        const b = rec.builds && rec.builds[buildId];
        if (!b) return;
        woodSum += Math.max(0, Number(b.wood) || 0);
        stoneSum += Math.max(0, Number(b.stone) || 0);
      });
      const wood = Math.min(proj.woodReq, woodSum);
      const stone = Math.min(proj.stoneReq, stoneSum);
      const total = wood + stone;
      const totalReq = proj.woodReq + proj.stoneReq;
      const completed = (wood >= proj.woodReq && stone >= proj.stoneReq);
      const pct = Math.min(100, Math.round((total / totalReq) * 100));
      let stage = 0;
      if (proj.kind === 'house') {
        stage = completed ? 5 : (total >= 32 ? 4 : (total >= 22 ? 3 : (total >= 12 ? 2 : (total >= 4 ? 1 : 0))));
      } else {
        stage = completed ? 3 : (pct >= 68 ? 2 : (pct >= 22 ? 1 : 0));
      }
      return { wood, stone, woodReq: proj.woodReq, stoneReq: proj.stoneReq, pct, stage, completed };
    },

    getEconomySummary() {
      let totalEarned = 0;
      let rawOffered = 0;
      const stockByShop = { shop_milk: 0, shop_fish: 0, shop_grain: 0, shop_cloth: 0 };
      const ep = this.resetEpoch;
      Object.keys(this.contribs).forEach(ck => {
        const rec = this.contribs[ck];
        if (!rec || (Number(rec.resetEpoch) || 0) !== ep) return;
        if (rec.delivered && rec.sold) {
          GOODS_ORDER.forEach(gid => {
            const meta = GOODS_META[gid];
            const del = Math.max(0, Number(rec.delivered[gid]) || 0);
            const sol = Math.min(del, Math.max(0, Number(rec.sold[gid]) || 0));
            totalEarned += sol * meta.price;
            stockByShop[meta.shopId] += (del - sol);
          });
        }
        rawOffered += Math.max(0, Number(rec.offeredTalents) || 0);
      });

      let spentOnDecor = 0;
      DECOR_ORDER.forEach(did => {
        if (this.decorations && this.decorations[did]) {
          spentOnDecor += DECORATIONS[did].cost;
        }
      });

      const offeredToTemple = Math.min(TEMPLE_TARGET_TALENTS, rawOffered);
      const availableTalents = Math.max(0, totalEarned - rawOffered - spentOnDecor);
      const templeStage = (offeredToTemple >= TEMPLE_TARGET_TALENTS)
        ? 5
        : Math.min(4, Math.floor(offeredToTemple / TEMPLE_STEP_TALENTS));
      const templePct = Math.min(100, Math.round((offeredToTemple / TEMPLE_TARGET_TALENTS) * 100));
      const templeCompleted = (offeredToTemple >= TEMPLE_TARGET_TALENTS);

      this.treasury = {
        talents: availableTalents,
        totalEarned,
        offeredToTemple,
        spentOnDecor
      };

      return {
        totalEarned,
        offeredToTemple,
        rawOffered,
        spentOnDecor,
        availableTalents,
        stockByShop,
        templeStage,
        templePct,
        templeCompleted
      };
    },

    isActivityUnlocked(kind) {
      if (kind === 'fishing' || kind === 'fish') return this.getBuildProgress('shop_fish').completed;
      if (kind === 'farm' || kind === 'well' || kind === 'seed_bush' || kind === 'wheat') return this.getBuildProgress('shop_grain').completed;
      if (kind === 'milk') return this.getBuildProgress('shop_milk').completed;
      if (kind === 'wool') return this.getBuildProgress('shop_cloth').completed;
      if (kind === 'pasture') return this.getBuildProgress('shop_milk').completed || this.getBuildProgress('shop_cloth').completed;
      return true;
    },

    _recomputeCompletedFootprintsLocal() {
      const newlyUnlocked = [];
      PROJECT_ORDER.forEach(pid => {
        const pr = this.getBuildProgress(pid);
        if (pr.completed && !this.footprints[pid]) {
          this.footprints[pid] = {
            id: pid,
            completedAt: Date.now(),
            completedBy: this.getMyPlayerName()
          };
          newlyUnlocked.push(pid);
        }
      });
      const econ = this.getEconomySummary();
      if (econ.templeCompleted && !this.footprints.temple) {
        this.footprints.temple = {
          id: 'temple',
          completedAt: Date.now(),
          completedBy: this.getMyPlayerName()
        };
        newlyUnlocked.push('temple');
      }
      DECOR_ORDER.forEach(did => {
        if (this.decorations[did] && !this.footprints[did]) {
          this.footprints[did] = {
            id: did,
            completedAt: this.decorations[did].unlockedAt || Date.now(),
            completedBy: this.decorations[did].unlockedBy || this.getMyPlayerName()
          };
          newlyUnlocked.push(did);
        }
      });
      return newlyUnlocked;
    },

    getUnlockedFootprintCount() {
      return FOOTPRINT_ORDER.filter(fid => Boolean(this.footprints[fid])).length;
    },

    getTotalActiveFootprints() {
      return FOOTPRINT_ORDER.length;
    },

    areAllBuildsCompleted() {
      return PROJECT_ORDER.every(pid => this.getBuildProgress(pid).completed);
    },

    getNextIncompleteBuildId() {
      const cur = this.activeFocusBuildId;
      if (cur && PROJECTS[cur] && !this.getBuildProgress(cur).completed) return cur;
      for (let i = 0; i < PROJECT_ORDER.length; i++) {
        if (!this.getBuildProgress(PROJECT_ORDER[i]).completed) return PROJECT_ORDER[i];
      }
      return 'rock_house';
    },

    getMyStats() {
      const myKey = this.getMyPlayerKey();
      const rec = this._ensureContribRecord(myKey, this.getMyPlayerName());
      const ep = (Number(rec.resetEpoch) || 0) === this.resetEpoch;
      const act = ep ? rec.actions : { build: 0, farm: 0, fish: 0, livestock: 0, deliver: 0, offer: 0, decor: 0 };
      let shopBuildContribCount = 0;
      let totalWoodContrib = 0;
      let totalStoneContrib = 0;
      let totalGoodsDelivered = 0;
      let totalGoodsSold = 0;
      if (ep && rec.builds) {
        PROJECT_ORDER.forEach(pid => {
          const b = rec.builds[pid];
          if (!b) return;
          totalWoodContrib += Math.max(0, Number(b.wood) || 0);
          totalStoneContrib += Math.max(0, Number(b.stone) || 0);
          if (PROJECTS[pid].kind === 'shop' && ((b.wood || 0) > 0 || (b.stone || 0) > 0)) {
            shopBuildContribCount++;
          }
        });
        GOODS_ORDER.forEach(gid => {
          totalGoodsDelivered += Math.max(0, Number(rec.delivered && rec.delivered[gid]) || 0);
          totalGoodsSold += Math.max(0, Number(rec.sold && rec.sold[gid]) || 0);
        });
      }
      const totalActions = Object.keys(act).reduce((s, k) => s + (Number(act[k]) || 0), 0);
      return {
        name: this.getMyPlayerName(),
        actions: act,
        totalWoodContrib,
        totalStoneContrib,
        totalGoodsDelivered,
        totalGoodsSold,
        offeredTalents: ep ? (Number(rec.offeredTalents) || 0) : 0,
        shopBuildContribCount,
        totalActions
      };
    },

    getSyncStatusText() {
      if (window.MP_FIREBASE_DB_URL && this.firebaseHydrated && this.lastCloudSyncAt > 0) {
        return '☁️ 방 클라우드 자동 저장됨';
      }
      return '💾 로컬 자동 저장됨';
    },

    async hydrateFromFirebase() {
      const base = String(window.MP_FIREBASE_DB_URL || '').replace(/\/+$/, '');
      if (!base || typeof fetch !== 'function') {
        this.firebaseHydrated = true;
        return;
      }
      const roomKey = encodeURIComponent(this.roomId);
      try {
        const res = await fetch(`${base}/mp_rooms/${roomKey}.json`);
        if (res && res.ok) {
          const data = await res.json();
          this.firebaseHydrated = true;
          this.lastCloudSyncAt = Date.now();
          if (data) {
            this.applyRoomSnapshot(data, { fromCloud: true });
          }
        } else {
          this.firebaseHydrated = true;
        }
      } catch (e) {
        this.firebaseHydrated = true;
      }
      if (this.contribDirty) {
        this.syncMyContribToCloud();
      }
    },

    applyRoomSnapshot(data, opts = {}) {
      if (!data || typeof data !== 'object') return false;
      const fromCloud = Boolean(opts.fromCloud);
      if (fromCloud) {
        this.firebaseHydrated = true;
        this.lastCloudSyncAt = Date.now();
      }

      const prevStages = {};
      PROJECT_ORDER.forEach(pid => { prevStages[pid] = this.getBuildProgress(pid).stage; });
      const prevCompleted = {};
      PROJECT_ORDER.forEach(pid => { prevCompleted[pid] = this.getBuildProgress(pid).completed; });
      const prevEcon = this.getEconomySummary();
      const prevTempleStage = prevEcon.templeStage;
      const prevTempleDone = prevEcon.templeCompleted;
      const prevFarmSig = `${this.farm.cycle}|${this.farm.step}|${this.farm.subProgress}`;
      const prevDecorSig = DECOR_ORDER.map(d => (this.decorations[d] ? '1' : '0')).join(',');

      // 1) Epoch 확인 (높은 resetEpoch 우선)
      const incomingEpoch = (data.meta && typeof data.meta.resetEpoch === 'number')
        ? data.meta.resetEpoch
        : (typeof data.resetEpoch === 'number' ? data.resetEpoch : this.resetEpoch);

      let changed = false;
      if (incomingEpoch > this.resetEpoch) {
        this.resetEpoch = incomingEpoch;
        this.contribs = {};
        this.footprints = {};
        this.decorations = {};
        this.farm = { cycle: 0, step: 0, subProgress: 0, updatedAt: Date.now() };
        this.news = [];
        this._ensureContribRecord(this.getMyPlayerKey(), this.getMyPlayerName());
        changed = true;
      } else if (incomingEpoch < this.resetEpoch) {
        // 오래된 스냅샷 무시
        return false;
      }

      // 2) 구버전 mission 필드 호환 마이그레이션 (epoch 0인 경우)
      if (this.resetEpoch === 0 && data.mission && !data.mission.reset && (typeof data.mission.stone === 'number' || typeof data.mission.wood === 'number')) {
        const leg = this._ensureContribRecord('_legacy_rock', '선발 대원');
        const nw = Math.min(20, Math.max(leg.builds.rock_house.wood, Number(data.mission.wood) || 0));
        const ns = Math.min(20, Math.max(leg.builds.rock_house.stone, Number(data.mission.stone) || 0));
        if (nw !== leg.builds.rock_house.wood || ns !== leg.builds.rock_house.stone) {
          leg.builds.rock_house.wood = nw;
          leg.builds.rock_house.stone = ns;
          changed = true;
        }
      }

      // 3) 참여자별 기여 원장 무손실 Math.max 병합 (1단계 건축 + 2단계 납품·판매·헌금)
      if (data.contribs && typeof data.contribs === 'object') {
        Object.keys(data.contribs).forEach(ck => {
          const inc = data.contribs[ck];
          if (!inc || typeof inc !== 'object') return;
          const incEp = Number(inc.resetEpoch) || 0;
          if (incEp !== this.resetEpoch) return;
          const rec = this._ensureContribRecord(ck, inc.name);
          if (inc.builds) {
            PROJECT_ORDER.forEach(pid => {
              const ib = inc.builds[pid];
              if (!ib) return;
              const mw = Math.max(rec.builds[pid].wood, Number(ib.wood) || 0);
              const ms = Math.max(rec.builds[pid].stone, Number(ib.stone) || 0);
              if (mw !== rec.builds[pid].wood || ms !== rec.builds[pid].stone) {
                rec.builds[pid].wood = mw;
                rec.builds[pid].stone = ms;
                changed = true;
              }
            });
          }
          if (inc.delivered) {
            GOODS_ORDER.forEach(gid => {
              const md = Math.max(rec.delivered[gid], Number(inc.delivered[gid]) || 0);
              if (md !== rec.delivered[gid]) {
                rec.delivered[gid] = md;
                changed = true;
              }
            });
          }
          if (inc.sold) {
            GOODS_ORDER.forEach(gid => {
              const ms = Math.max(rec.sold[gid], Number(inc.sold[gid]) || 0);
              if (ms !== rec.sold[gid]) {
                rec.sold[gid] = ms;
                changed = true;
              }
            });
          }
          const mOff = Math.max(rec.offeredTalents, Number(inc.offeredTalents) || 0);
          if (mOff !== rec.offeredTalents) {
            rec.offeredTalents = mOff;
            changed = true;
          }
          if (inc.actions) {
            Object.keys(rec.actions).forEach(ak => {
              const mv = Math.max(rec.actions[ak], Number(inc.actions[ak]) || 0);
              if (mv !== rec.actions[ak]) {
                rec.actions[ak] = mv;
                changed = true;
              }
            });
          }
          rec.updatedAt = Math.max(rec.updatedAt || 0, Number(inc.updatedAt) || 0);
        });
      }

      // 4) 발자취 합집합 병합
      if (data.footprints && typeof data.footprints === 'object') {
        Object.keys(data.footprints).forEach(fid => {
          const fp = data.footprints[fid];
          if (fp && typeof fp === 'object' && !this.footprints[fid]) {
            this.footprints[fid] = fp;
            changed = true;
          }
        });
      }

      // 5) 공동기금 마을 꾸미기 합집합 병합
      if (data.decorations && typeof data.decorations === 'object') {
        DECOR_ORDER.forEach(did => {
          const dc = data.decorations[did];
          if (dc && typeof dc === 'object' && !this.decorations[did]) {
            this.decorations[did] = dc;
            changed = true;
          }
        });
      }

      // 6) 농사 진행도 단조 병합 (cycle > step > subProgress)
      if (data.farm && typeof data.farm === 'object') {
        const incEp = (typeof data.farm.resetEpoch === 'number') ? data.farm.resetEpoch : this.resetEpoch;
        if (incEp === this.resetEpoch && this._farmTupleVal(data.farm) > this._farmTupleVal(this.farm)) {
          this.farm = {
            cycle: Math.max(0, Number(data.farm.cycle) || 0),
            step: Math.max(0, Math.min(4, Number(data.farm.step) || 0)),
            subProgress: Math.max(0, Number(data.farm.subProgress) || 0),
            updatedAt: Number(data.farm.updatedAt) || Date.now()
          };
          changed = true;
        }
      }

      // 7) 뉴스 병합 (id 기준 중복 제거, 시간순 최신 20건 유지)
      const incomingNewsList = Array.isArray(data.news)
        ? data.news
        : (data.news && typeof data.news === 'object' ? Object.values(data.news) : []);
      if (incomingNewsList.length > 0) {
        const byId = new Map();
        this.news.forEach(it => { if (it && it.id) byId.set(it.id, it); });
        let addedNews = false;
        incomingNewsList.forEach(it => {
          if (it && it.id && !byId.has(it.id)) {
            byId.set(it.id, it);
            addedNews = true;
          }
        });
        if (addedNews) {
          this.news = Array.from(byId.values())
            .sort((a, b) => (b.ts || 0) - (a.ts || 0))
            .slice(0, MAX_NEWS_ITEMS);
          changed = true;
        }
      }

      const afterEcon = this.getEconomySummary();
      const newFp = this._recomputeCompletedFootprintsLocal();
      if (newFp.length > 0) changed = true;

      if (changed) {
        this._syncLegacyMpMissionFields();
        this.saveLocalState();
        this.rebuildAllVisualsIfStageChanged(prevStages, prevTempleStage, prevDecorSig, prevFarmSig);
        this.updateBulletinBoardTexture();
        if (window.MiracleMultiplayer && typeof window.MiracleMultiplayer.syncHUD === 'function') {
          window.MiracleMultiplayer.syncHUD();
        }
        if (typeof updateMiracleNotebookHudBadge === 'function') {
          updateMiracleNotebookHudBadge();
        }
        this.refreshOpenModalsIfVisible();

        PROJECT_ORDER.forEach(pid => {
          if (!prevCompleted[pid] && this.getBuildProgress(pid).completed) {
            const p = PROJECTS[pid];
            if (typeof showToast === 'function') showToast(`🎉 ${p.icon} ${p.name}이(가) 모두의 협력으로 완공되었어요!`);
          }
        });
        if (!prevTempleDone && afterEcon.templeCompleted) {
          if (typeof showToast === 'function') showToast('⛪✨ 예루살렘 성전이 모두의 헌금으로 마침내 완공되었어요!');
        }
      }
      return changed;
    },

    async syncMyContribToCloud() {
      const base = String(window.MP_FIREBASE_DB_URL || '').replace(/\/+$/, '');
      if (!base || typeof fetch !== 'function' || !this.firebaseHydrated) return;
      const roomKey = encodeURIComponent(this.roomId);
      const myKey = this.getMyPlayerKey();
      const rec = this._ensureContribRecord(myKey, this.getMyPlayerName());
      rec.resetEpoch = this.resetEpoch;
      rec.updatedAt = Date.now();
      this.contribDirty = false;
      try {
        await fetch(`${base}/mp_rooms/${roomKey}/contribs/${myKey}.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(rec)
        });
        this.lastCloudSyncAt = Date.now();
      } catch (e) {
        this.contribDirty = true;
      }
    },

    async _pushFootprintToCloud(fpId, fpObj) {
      const base = String(window.MP_FIREBASE_DB_URL || '').replace(/\/+$/, '');
      if (!base || typeof fetch !== 'function' || !this.firebaseHydrated) return;
      const roomKey = encodeURIComponent(this.roomId);
      try {
        await fetch(`${base}/mp_rooms/${roomKey}/footprints/${encodeURIComponent(fpId)}.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fpObj)
        });
      } catch (e) {}
    },

    async _pushDecorationToCloud(decorId, obj) {
      const base = String(window.MP_FIREBASE_DB_URL || '').replace(/\/+$/, '');
      if (!base || typeof fetch !== 'function' || !this.firebaseHydrated) return;
      const roomKey = encodeURIComponent(this.roomId);
      try {
        await fetch(`${base}/mp_rooms/${roomKey}/decorations/${encodeURIComponent(decorId)}.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(obj)
        });
      } catch (e) {}
    },

    async _pushFarmToCloud() {
      const base = String(window.MP_FIREBASE_DB_URL || '').replace(/\/+$/, '');
      if (!base || typeof fetch !== 'function' || !this.firebaseHydrated) return;
      const roomKey = encodeURIComponent(this.roomId);
      try {
        await fetch(`${base}/mp_rooms/${roomKey}/farm.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(Object.assign({ resetEpoch: this.resetEpoch }, this.farm))
        });
      } catch (e) {}
    },

    postNewsItem(icon, text, actorOverride) {
      const item = {
        id: 'n_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
        ts: Date.now(),
        actor: actorOverride || this.getMyPlayerName(),
        icon: icon || '💬',
        text: String(text || '')
      };
      this.news.unshift(item);
      if (this.news.length > MAX_NEWS_ITEMS) this.news.length = MAX_NEWS_ITEMS;
      this.saveLocalState();
      this.updateBulletinBoardTexture();
      this.refreshOpenModalsIfVisible();

      if (window.MiracleMultiplayer && window.MiracleMultiplayer.active) {
        window.MiracleMultiplayer.broadcastMessage({
          type: 'village_news',
          peerId: window.MiracleMultiplayer.peerId,
          item
        });
      }

      const base = String(window.MP_FIREBASE_DB_URL || '').replace(/\/+$/, '');
      if (base && typeof fetch === 'function') {
        const roomKey = encodeURIComponent(this.roomId);
        try {
          fetch(`${base}/mp_rooms/${roomKey}/news.json`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
          }).catch(() => {});
        } catch (e) {}
      }
      return item;
    },

    recordDeposit(buildId, rawWood, rawStone) {
      const proj = PROJECTS[buildId];
      if (!proj) return { addWood: 0, addStone: 0, justCompleted: false };
      const curProg = this.getBuildProgress(buildId);
      const addWood = Math.min(Math.max(0, rawWood || 0), Math.max(0, proj.woodReq - curProg.wood));
      const addStone = Math.min(Math.max(0, rawStone || 0), Math.max(0, proj.stoneReq - curProg.stone));
      if (addWood <= 0 && addStone <= 0) {
        return { addWood: 0, addStone: 0, justCompleted: false };
      }

      const wasCompleted = curProg.completed;
      const myKey = this.getMyPlayerKey();
      const myName = this.getMyPlayerName();
      const rec = this._ensureContribRecord(myKey, myName);
      rec.resetEpoch = this.resetEpoch;
      rec.builds[buildId].wood += addWood;
      rec.builds[buildId].stone += addStone;
      rec.actions.build = (rec.actions.build || 0) + 1;
      rec.updatedAt = Date.now();

      this.bag.wood = Math.max(0, this.bag.wood - addWood);
      this.bag.stone = Math.max(0, this.bag.stone - addStone);
      this.activeFocusBuildId = buildId;

      const afterProg = this.getBuildProgress(buildId);
      const justCompleted = (!wasCompleted && afterProg.completed);
      if (justCompleted && !this.footprints[buildId]) {
        const fpObj = { id: buildId, completedAt: Date.now(), completedBy: myName };
        this.footprints[buildId] = fpObj;
        this._pushFootprintToCloud(buildId, fpObj);
      }

      this._syncLegacyMpMissionFields();
      this.saveLocalState();
      this.contribDirty = true;

      // 소식 등록
      const matParts = [];
      if (addWood > 0) matParts.push(`🪵나무 ${addWood}개`);
      if (addStone > 0) matParts.push(`🪨돌 ${addStone}개`);
      this.postNewsItem(proj.icon, `${myName}님이 ${proj.name}에 ${matParts.join(' · ')}를 쌓았어요!`, myName);
      if (justCompleted) {
        this.postNewsItem('🎉', `${proj.icon} [${proj.name}]이(가) 모두의 힘으로 완공되었어요!`, myName);
      }

      // 3D 비주얼 즉시 갱신
      if (buildId === 'rock_house') {
        this.rebuildGrandRockHouseVisuals();
      } else {
        this.rebuildShopVisuals(buildId);
        if (justCompleted) {
          if (buildId === 'shop_fish') this.rebuildFishingSpotVisuals();
          if (buildId === 'shop_grain') this.rebuildFarmVisuals();
          if (buildId === 'shop_milk' || buildId === 'shop_cloth') this.rebuildPastureVisuals();
        }
      }
      this._syncAfterLocalMutation({ footprints: this.footprints });

      if (justCompleted) {
        this.showCompletionVerseDialog(buildId);
      }
      return { addWood, addStone, justCompleted };
    },

    _syncAfterLocalMutation(extraBroadcast = {}) {
      this._syncLegacyMpMissionFields();
      this.saveLocalState();
      this.updateAllWorldLabels();
      this.updateBulletinBoardTexture();
      const myKey = this.getMyPlayerKey();
      const rec = this._ensureContribRecord(myKey, this.getMyPlayerName());
      if (window.MiracleMultiplayer && window.MiracleMultiplayer.active) {
        window.MiracleMultiplayer.broadcastMessage(Object.assign({
          type: 'village_sync',
          peerId: window.MiracleMultiplayer.peerId,
          resetEpoch: this.resetEpoch,
          contribs: { [myKey]: rec },
          footprints: this.footprints
        }, extraBroadcast));
        window.MiracleMultiplayer.syncHUD();
      }
      if (typeof updateMiracleNotebookHudBadge === 'function') {
        updateMiracleNotebookHudBadge();
      }
      this.syncMyContribToCloud();
      this.refreshOpenModalsIfVisible();
    },

    showVerseDialogCard(opts) {
      if (typeof playSfx === 'function') playSfx('clear');
      if (typeof openMiracleDialog === 'function') {
        openMiracleDialog({
          speaker: opts.speaker || '📖 말씀',
          category: 'word',
          badgeLabel: opts.badgeLabel || `📖 완료 말씀 · ${opts.verseRef}`,
          text: `${opts.verseText} (${opts.verseRef})${opts.extraHint ? '\n\n💡 ' + opts.extraHint : ''}`,
          btnText: opts.btnText || '🙌 아멘!'
        });
      }
    },

    showCompletionVerseDialog(buildId) {
      const proj = PROJECTS[buildId];
      if (!proj) return;
      if (buildId === 'rock_house') {
        const safeX = proj.teleportPos.x, safeZ = proj.teleportPos.z;
        const dist = (typeof playerPos !== 'undefined' && playerPos) ? Math.hypot(playerPos.x - proj.pos.x, playerPos.z - proj.pos.z) : 99;
        if (dist < 7.5 && typeof playerPos !== 'undefined' && playerPos) {
          const sy = (typeof getMiracleOpenWorldGroundHeight === 'function') ? getMiracleOpenWorldGroundHeight(safeX, safeZ) : 0.25;
          playerPos.set(safeX, sy, safeZ);
          if (typeof playerGroup !== 'undefined' && playerGroup) playerGroup.position.copy(playerPos);
          if (typeof snapCameraToPlayer === 'function') snapCameraToPlayer();
        }
      }
      this.showVerseDialogCard({
        speaker: `${proj.icon} ${proj.name} 완공!`,
        badgeLabel: `📖 협동 건축 완료 말씀 · ${proj.verseRef}`,
        verseRef: proj.verseRef,
        verseText: proj.verseText,
        extraHint: proj.stage2Hint,
        btnText: buildId === 'rock_house' ? '🙌 아멘! 2층 반석의 집 둘러보기' : `🙌 아멘! ${proj.name} 활동 시작!`
      });
    },

    // =========================================================================
    // 2단계 액션 (갈릴리 낚시 · 우물 5단계 농사 · 목축 · 납품 · NPC 구매 · 성전 헌금 · 꾸미기)
    // =========================================================================
    performFishingAction() {
      if (!this.isActivityUnlocked('fishing')) {
        if (typeof playSfx === 'function') playSfx('wrong');
        if (typeof showToast === 'function') showToast('🔒 먼저 마을의 [🐟 생선 가게]를 완공해야 낚시가 열려요!');
        return { ok: false, reason: 'locked' };
      }
      if (this.bag.fish >= GOODS_META.fish.maxCarry) {
        if (typeof playSfx === 'function') playSfx('wrong');
        if (typeof showToast === 'function') showToast(`🎒 물고기를 가득(${GOODS_META.fish.maxCarry}마리) 잡았어요! 생선 가게에 납품해 보세요!`);
        return { ok: false, reason: 'bag_full' };
      }
      this.fishingHits = (Number(this.fishingHits) || 0) + 1;
      if (this.fishingHits < 3) {
        if (typeof playSfx === 'function') playSfx('switch');
        if (typeof showToast === 'function') showToast(`🎣 찌가 흔들려요! (${this.fishingHits}/3)`);
        return { ok: true, caught: false, hits: this.fishingHits };
      }
      this.fishingHits = 0;
      this.bag.fish += 1;
      const rec = this._ensureContribRecord(this.getMyPlayerKey(), this.getMyPlayerName());
      rec.resetEpoch = this.resetEpoch;
      rec.actions.fish = (rec.actions.fish || 0) + 1;
      rec.updatedAt = Date.now();
      this.contribDirty = true;
      this._syncAfterLocalMutation();
      if (typeof playSfx === 'function') playSfx('rescue');
      if (typeof showToast === 'function') showToast(`🐟 싱싱한 갈릴리 물고기 1마리 낚시 성공! (가방 🐟${this.bag.fish}/${GOODS_META.fish.maxCarry})`);
      return { ok: true, caught: true, fish: this.bag.fish };
    },

    performWellWaterAction() {
      if (!this.isActivityUnlocked('well')) {
        if (typeof playSfx === 'function') playSfx('wrong');
        if (typeof showToast === 'function') showToast('🔒 먼저 [🌾 곡물 가게]를 완공하면 농사용 우물 물을 길을 수 있어요!');
        return { ok: false, reason: 'locked' };
      }
      if (this.bag.waterBucket >= this.maxCarryWater) {
        if (typeof showToast === 'function') showToast(`💧 이미 양동이에 물이 가득(${this.maxCarryWater}통) 담겨 있어요! 밭으로 가보세요!`);
        return { ok: false, reason: 'full' };
      }
      this.bag.waterBucket = this.maxCarryWater;
      this.saveBagLocal();
      this.refreshOpenModalsIfVisible();
      if (typeof playSfx === 'function') playSfx('rescue');
      if (typeof showToast === 'function') showToast(`💧 야곱의 우물에서 맑은 물 ${this.maxCarryWater}통을 길었어요!`);
      return { ok: true, waterBucket: this.bag.waterBucket };
    },

    performFindSeedAction() {
      if (!this.isActivityUnlocked('seed_bush')) {
        if (typeof playSfx === 'function') playSfx('wrong');
        if (typeof showToast === 'function') showToast('🔒 먼저 [🌾 곡물 가게]를 완공해 주세요!');
        return { ok: false, reason: 'locked' };
      }
      if (this.bag.seed >= this.maxCarrySeed) {
        if (typeof showToast === 'function') showToast(`🌱 이미 밀 씨앗을 ${this.bag.seed}개 가지고 있어요!`);
        return { ok: false, reason: 'full' };
      }
      this.bag.seed = Math.min(this.maxCarrySeed, this.bag.seed + 3);
      this.saveBagLocal();
      this.refreshOpenModalsIfVisible();
      if (typeof playSfx === 'function') playSfx('rescue');
      if (typeof showToast === 'function') showToast(`🌱 수풀에서 튼튼한 밀 씨앗 3개를 찾았어요! (보유 ${this.bag.seed}개)`);
      return { ok: true, seed: this.bag.seed };
    },

    performFarmAction() {
      if (!this.isActivityUnlocked('farm')) {
        if (typeof playSfx === 'function') playSfx('wrong');
        if (typeof showToast === 'function') showToast('🔒 먼저 [🌾 곡물 가게]를 완공해야 5단계 농사가 열려요!');
        return { ok: false, reason: 'locked' };
      }
      const myName = this.getMyPlayerName();
      const rec = this._ensureContribRecord(this.getMyPlayerKey(), myName);
      rec.resetEpoch = this.resetEpoch;
      const step = this.farm.step || 0;

      if (step === 0 || step === 1) {
        // 1단계 돌 골라내기(0) / 2단계 넝쿨 치우기(1)
        this.farm.subProgress = (this.farm.subProgress || 0) + 1;
        this.farm.updatedAt = Date.now();
        if (this.farm.subProgress >= 3) {
          this.farm.step = step + 1;
          this.farm.subProgress = 0;
          if (typeof playSfx === 'function') playSfx('boost');
          if (typeof showToast === 'function') {
            showToast(step === 0
              ? '🪨 밭의 돌을 모두 골라냈어요! 다음은 🌿 가시 넝쿨을 치워 볼까요?'
              : '🌿 넝쿨을 깔끔히 치웠어요! 이제 곁 수풀에서 🌱 씨앗을 찾아 뿌려 주세요!');
          }
        } else {
          if (typeof playSfx === 'function') playSfx(step === 0 ? 'hammer' : 'axe');
          if (typeof showToast === 'function') {
            showToast(step === 0
              ? `🪨 밭 돌 골라내기 (${this.farm.subProgress}/3)`
              : `🌿 가시 넝쿨 치우기 (${this.farm.subProgress}/3)`);
          }
        }
        this.rebuildFarmVisuals();
        this._syncAfterLocalMutation({ farm: Object.assign({ resetEpoch: this.resetEpoch }, this.farm) });
        this._pushFarmToCloud();
        return { ok: true, step: this.farm.step, subProgress: this.farm.subProgress };
      }

      if (step === 2) {
        // 3~4단계 씨앗 찾기 후 씨앗 뿌리기
        if (this.bag.seed <= 0) {
          if (typeof playSfx === 'function') playSfx('wrong');
          if (typeof showToast === 'function') showToast('🔍 먼저 밭 양옆 수풀에서 🌱 밀 씨앗을 찾아와야 심을 수 있어요!');
          return { ok: false, reason: 'need_seed' };
        }
        this.bag.seed = Math.max(0, this.bag.seed - 1);
        this.farm.subProgress = (this.farm.subProgress || 0) + 1;
        this.farm.updatedAt = Date.now();
        if (this.farm.subProgress >= 3) {
          this.farm.step = 3;
          this.farm.subProgress = 0;
          if (typeof playSfx === 'function') playSfx('boost');
          if (typeof showToast === 'function') showToast('🌱 고랑마다 씨앗을 모두 뿌렸어요! 이제 💧 야곱의 우물에서 물을 길어 와 주세요!');
        } else {
          if (typeof playSfx === 'function') playSfx('count');
          if (typeof showToast === 'function') showToast(`🌱 밭에 씨앗 뿌리기 (${this.farm.subProgress}/3)`);
        }
        this.rebuildFarmVisuals();
        this._syncAfterLocalMutation({ farm: Object.assign({ resetEpoch: this.resetEpoch }, this.farm) });
        this._pushFarmToCloud();
        return { ok: true, step: this.farm.step, subProgress: this.farm.subProgress };
      }

      if (step === 3) {
        // 5단계 우물 물주기
        if (this.bag.waterBucket <= 0) {
          if (typeof playSfx === 'function') playSfx('wrong');
          if (typeof showToast === 'function') showToast('💧 우물 물이 부족해요! 북쪽 [-32, -12] 야곱의 우물에서 물을 길어 오세요!');
          return { ok: false, reason: 'need_water' };
        }
        this.bag.waterBucket = Math.max(0, this.bag.waterBucket - 1);
        this.farm.subProgress = (this.farm.subProgress || 0) + 1;
        this.farm.updatedAt = Date.now();
        if (this.farm.subProgress >= 3) {
          this.farm.step = 4;
          this.farm.subProgress = 0;
          this.postNewsItem('💧', `${myName}님이 야곱의 우물 물로 밭을 적셔 황금 밀이 무르익었어요!`, myName);
          if (typeof playSfx === 'function') playSfx('boost');
          if (typeof showToast === 'function') showToast('✨ 우물 물을 먹고 황금 밀이 활짝 자랐어요! 지금 바로 수확해 보세요!');
        } else {
          if (typeof playSfx === 'function') playSfx('switch');
          if (typeof showToast === 'function') showToast(`💧 밭에 우물 물주기 (${this.farm.subProgress}/3)`);
        }
        this.rebuildFarmVisuals();
        this._syncAfterLocalMutation({ farm: Object.assign({ resetEpoch: this.resetEpoch }, this.farm) });
        this._pushFarmToCloud();
        return { ok: true, step: this.farm.step, subProgress: this.farm.subProgress };
      }

      // 수확 단계 (step === 4)
      if (this.bag.wheat >= GOODS_META.wheat.maxCarry) {
        if (typeof playSfx === 'function') playSfx('wrong');
        if (typeof showToast === 'function') showToast(`🎒 밀단이 가득(${GOODS_META.wheat.maxCarry}단) 찼어요! 곡물 가게에 먼저 납품해 주세요!`);
        return { ok: false, reason: 'bag_full' };
      }
      const gain = Math.min(2, GOODS_META.wheat.maxCarry - this.bag.wheat);
      this.bag.wheat += gain;
      rec.actions.farm = (rec.actions.farm || 0) + 1;
      rec.updatedAt = Date.now();
      this.contribDirty = true;

      this.farm.cycle = (this.farm.cycle || 0) + 1;
      this.farm.step = 0;
      this.farm.subProgress = 0;
      this.farm.updatedAt = Date.now();

      this.postNewsItem('🌾', `${myName}님이 5단계 정성으로 튼실한 밀단 ${gain}단을 수확했어요!`, myName);
      this.rebuildFarmVisuals();
      this._syncAfterLocalMutation({ farm: Object.assign({ resetEpoch: this.resetEpoch }, this.farm) });
      this._pushFarmToCloud();
      if (typeof playSfx === 'function') playSfx('rescue');
      if (typeof showToast === 'function') showToast(`🌾 황금 밀단 ${gain}단 수확 완료! 곡물 가게에 납품하면 🪙 달란트가 모여요!`);
      return { ok: true, harvested: gain, wheat: this.bag.wheat };
    },

    performPastureAction(sheepObj) {
      const sheep = sheepObj || (this.pastureSheep && this.pastureSheep[0]);
      if (!sheep) return { ok: false, reason: 'none' };
      const kind = (sheep.careKind === 'wool') ? 'wool' : 'milk';
      if (!this.isActivityUnlocked(kind)) {
        if (typeof playSfx === 'function') playSfx('wrong');
        if (typeof showToast === 'function') {
          showToast(kind === 'milk'
            ? '🔒 먼저 [🥛 양젖 가게]를 완공해야 양젖짜기가 열려요!'
            : '🔒 먼저 [👕 옷가게]를 완공해야 양털깎기가 열려요!');
        }
        return { ok: false, reason: 'locked' };
      }
      if ((sheep.cooldown || 0) > 0) {
        if (typeof showToast === 'function') {
          showToast(`🐑 양이 잠깐 쉬고 있어요 (${Math.ceil(sheep.cooldown)}초 뒤 다시 가능)!`);
        }
        return { ok: false, reason: 'cooldown' };
      }
      const meta = GOODS_META[kind];
      if (this.bag[kind] >= meta.maxCarry) {
        if (typeof playSfx === 'function') playSfx('wrong');
        if (typeof showToast === 'function') showToast(`🎒 ${meta.name}이 가득(${meta.maxCarry}개) 찼어요! ${PROJECTS[meta.shopId].name}에 납품해 주세요!`);
        return { ok: false, reason: 'bag_full' };
      }
      this.bag[kind] += 1;
      sheep.cooldown = (kind === 'milk') ? 10.0 : 14.0;
      if (kind === 'wool' && sheep.mesh && sheep.mesh.children && sheep.mesh.children[0]) {
        sheep.mesh.children[0].scale.setScalar(0.62);
      }

      const rec = this._ensureContribRecord(this.getMyPlayerKey(), this.getMyPlayerName());
      rec.resetEpoch = this.resetEpoch;
      rec.actions.livestock = (rec.actions.livestock || 0) + 1;
      rec.updatedAt = Date.now();
      this.contribDirty = true;
      this._syncAfterLocalMutation();
      if (typeof playSfx === 'function') playSfx('rescue');
      if (typeof showToast === 'function') {
        showToast(kind === 'milk'
          ? `🥛 신선한 양젖 1병을 짰어요! (가방 🥛${this.bag.milk}/${meta.maxCarry})`
          : `🧶 포근한 양털 1뭉치를 깎았어요! (가방 🧶${this.bag.wool}/${meta.maxCarry})`);
      }
      return { ok: true, kind, qty: this.bag[kind] };
    },

    deliverGoodsToShop(shopId) {
      const goodId = SHOP_TO_GOOD[shopId];
      const meta = GOODS_META[goodId];
      const proj = PROJECTS[shopId];
      if (!meta || !proj || !this.getBuildProgress(shopId).completed) {
        return { ok: false, qty: 0, reason: 'not_built' };
      }
      const qty = Math.max(0, Number(this.bag[goodId]) || 0);
      if (qty <= 0) {
        if (typeof showToast === 'function') showToast(`🎒 납품할 ${meta.icon} ${meta.name}이(가) 가방에 없어요!`);
        return { ok: false, qty: 0, reason: 'empty' };
      }

      const myName = this.getMyPlayerName();
      const rec = this._ensureContribRecord(this.getMyPlayerKey(), myName);
      rec.resetEpoch = this.resetEpoch;
      rec.delivered[goodId] = (rec.delivered[goodId] || 0) + qty;
      rec.actions.deliver = (rec.actions.deliver || 0) + 1;
      rec.updatedAt = Date.now();
      this.bag[goodId] = 0;
      this.contribDirty = true;

      this.postNewsItem(meta.icon, `${myName}님이 ${proj.name}에 ${meta.name} ${qty}개를 정성껏 진열했어요!`, myName);
      this._syncAfterLocalMutation();
      if (typeof playSfx === 'function') playSfx('build');
      if (typeof showToast === 'function') {
        showToast(`🛒 ${proj.name}에 ${meta.icon} ${meta.name} ${qty}개 납품 완료! 곧 마을 손님들이 사러 올 거예요!`);
      }
      return { ok: true, qty, goodId };
    },

    processNpcShopPurchase(shopId) {
      const goodId = SHOP_TO_GOOD[shopId];
      const meta = GOODS_META[goodId];
      const proj = PROJECTS[shopId];
      if (!meta || !proj || !this.getBuildProgress(shopId).completed) return { sold: false };
      const myName = this.getMyPlayerName();
      const rec = this._ensureContribRecord(this.getMyPlayerKey(), myName);
      const del = Math.max(0, Number(rec.delivered && rec.delivered[goodId]) || 0);
      const sol = Math.max(0, Number(rec.sold && rec.sold[goodId]) || 0);
      if (del <= sol) return { sold: false };

      rec.resetEpoch = this.resetEpoch;
      rec.sold[goodId] = sol + 1;
      rec.updatedAt = Date.now();
      this.contribDirty = true;

      this.postNewsItem('🪙', `마을 손님이 ${proj.name}에서 ${meta.name} 1개를 사갔어요! +${meta.price} 달란트`, myName);
      this._syncAfterLocalMutation();
      if (typeof playSfx === 'function') playSfx('rescue');
      if (typeof showToast === 'function') {
        showToast(`🛍️ 마을 손님이 ${proj.icon} ${proj.name}에서 ${meta.name}을 사갔어요! (+🪙${meta.price} 달란트 · 공동기금 ${this.treasury.talents})`);
      }
      return { sold: true, earned: meta.price, availableTalents: this.treasury.talents };
    },

    offerTalentsToTemple(maxAmount) {
      const econ = this.getEconomySummary();
      const remainingNeed = Math.max(0, TEMPLE_TARGET_TALENTS - econ.offeredToTemple);
      if (remainingNeed <= 0) {
        if (typeof showToast === 'function') showToast('⛪✨ 예루살렘 성전 건축이 이미 100% 완공되었어요!');
        return { offered: 0, templeCompleted: true };
      }
      if (econ.availableTalents <= 0) {
        if (typeof playSfx === 'function') playSfx('wrong');
        if (typeof showToast === 'function') showToast('🪙 성전에 헌금할 공동기금 달란트가 부족해요! 상점에 물건을 납품해 보세요!');
        return { offered: 0, reason: 'no_talents' };
      }
      const cap = (typeof maxAmount === 'number' && maxAmount > 0) ? Math.floor(maxAmount) : econ.availableTalents;
      const offerAmt = Math.min(econ.availableTalents, remainingNeed, cap);
      if (offerAmt <= 0) return { offered: 0 };

      const prevStage = econ.templeStage;
      const myName = this.getMyPlayerName();
      const rec = this._ensureContribRecord(this.getMyPlayerKey(), myName);
      rec.resetEpoch = this.resetEpoch;
      rec.offeredTalents = (rec.offeredTalents || 0) + offerAmt;
      rec.actions.offer = (rec.actions.offer || 0) + 1;
      rec.updatedAt = Date.now();
      this.contribDirty = true;

      const afterEcon = this.getEconomySummary();
      const justCompleted = afterEcon.templeCompleted;
      if (justCompleted && !this.footprints.temple) {
        const fpObj = { id: 'temple', completedAt: Date.now(), completedBy: myName };
        this.footprints.temple = fpObj;
        this._pushFootprintToCloud('temple', fpObj);
      }

      this.postNewsItem('⛪', `${myName}님이 성전 건축 헌금으로 🪙${offerAmt} 달란트를 봉헌했어요! (${afterEcon.offeredToTemple}/${TEMPLE_TARGET_TALENTS})`, myName);
      if (justCompleted) {
        this.postNewsItem('👑', '⛪✨ 모두의 정성으로 5단계 예루살렘 성전이 마침내 완공되었어요!', myName);
      }

      this.rebuildTempleVisuals();
      this._syncAfterLocalMutation({ footprints: this.footprints });

      if (justCompleted) {
        this.showVerseDialogCard({
          speaker: '⛪ 예루살렘 성전 완공!',
          badgeLabel: `📖 성전 건축 완료 말씀 · ${TEMPLE_META.verseRef}`,
          verseRef: TEMPLE_META.verseRef,
          verseText: TEMPLE_META.verseText,
          extraHint: '청동 화로 불꽃이 타오르는 아름다운 성전을 구경하고, 남은 달란트로 마을도 예쁘게 꾸며 보세요!',
          btnText: '🙌 아멘! 성전 감상하기'
        });
      } else if (afterEcon.templeStage > prevStage) {
        if (typeof playSfx === 'function') playSfx('boost');
        if (typeof showToast === 'function') showToast(`⛪ 성전 건축 ${afterEcon.templeStage}/5단계 완성! (${afterEcon.offeredToTemple}/${TEMPLE_TARGET_TALENTS} 달란트)`);
      } else {
        if (typeof playSfx === 'function') playSfx('build');
        if (typeof showToast === 'function') showToast(`🪙 성전 건축에 ${offerAmt} 달란트를 기쁨으로 봉헌했어요!`);
      }
      return { offered: offerAmt, offeredTotal: afterEcon.offeredToTemple, templeStage: afterEcon.templeStage, justCompleted };
    },

    purchaseDecoration(decorId) {
      const decor = DECORATIONS[decorId];
      if (!decor) return { ok: false, reason: 'invalid' };
      if (this.decorations[decorId]) {
        if (typeof showToast === 'function') showToast(`✅ [${decor.name}]은(는) 이미 우리 마을에 설치되어 있어요!`);
        return { ok: false, reason: 'already_unlocked' };
      }
      const econ = this.getEconomySummary();
      if (econ.availableTalents < decor.cost) {
        if (typeof playSfx === 'function') playSfx('wrong');
        if (typeof showToast === 'function') showToast(`🪙 ${decor.name} 설치에 ${decor.cost} 달란트가 필요해요! (현재 ${econ.availableTalents} 달란트)`);
        return { ok: false, reason: 'no_talents' };
      }

      const myName = this.getMyPlayerName();
      const obj = { id: decorId, cost: decor.cost, unlockedAt: Date.now(), unlockedBy: myName };
      this.decorations[decorId] = obj;
      if (!this.footprints[decorId]) {
        const fpObj = { id: decorId, completedAt: obj.unlockedAt, completedBy: myName };
        this.footprints[decorId] = fpObj;
        this._pushFootprintToCloud(decorId, fpObj);
      }
      const rec = this._ensureContribRecord(this.getMyPlayerKey(), myName);
      rec.resetEpoch = this.resetEpoch;
      rec.actions.decor = (rec.actions.decor || 0) + 1;
      rec.updatedAt = Date.now();
      this.contribDirty = true;

      this.postNewsItem(decor.icon, `${myName}님이 공동기금 🪙${decor.cost} 달란트로 [${decor.name}]을(를) 꾸몄어요!`, myName);
      this.rebuildDecorationsVisuals();
      this._pushDecorationToCloud(decorId, obj);
      this._syncAfterLocalMutation({ decorations: this.decorations, footprints: this.footprints });

      this.showVerseDialogCard({
        speaker: `${decor.icon} ${decor.name} 완성!`,
        badgeLabel: `📖 마을 꾸미기 말씀 · ${decor.verseRef}`,
        verseRef: decor.verseRef,
        verseText: decor.verseText,
        extraHint: '우리 방 친구들 모두의 화면에 새 꾸미기가 함께 나타났어요!',
        btnText: '🙌 아멘! 마을 구경하기'
      });
      return { ok: true, decorId, availableTalents: this.treasury.talents };
    },

    resetRoomVillage() {
      this.resetEpoch = (Number(this.resetEpoch) || 0) + 1;
      this.contribs = {};
      this.footprints = {};
      this.decorations = {};
      this.farm = { cycle: 0, step: 0, subProgress: 0, updatedAt: Date.now() };
      this.news = [];
      this.treasury = { talents: 0, totalEarned: 0, offeredToTemple: 0, spentOnDecor: 0 };
      this.bag = { wood: 0, stone: 0, fish: 0, wheat: 0, milk: 0, wool: 0, seed: 0, waterBucket: 0 };
      this.fishingHits = 0;
      const myKey = this.getMyPlayerKey();
      this._ensureContribRecord(myKey, this.getMyPlayerName());
      this._syncLegacyMpMissionFields();
      this.saveLocalState();
      this.rebuildGrandRockHouseVisuals();
      SHOPS_ORDER.forEach(sid => this.rebuildShopVisuals(sid));
      this.rebuildTempleVisuals();
      this.rebuildDecorationsVisuals();
      this.rebuildFarmVisuals();
      this.rebuildFishingSpotVisuals();
      this.rebuildPastureVisuals();
      this.updateAllWorldLabels();
      this.updateBulletinBoardTexture();
      if (typeof updateMiracleNotebookHudBadge === 'function') updateMiracleNotebookHudBadge();
      if (window.MiracleMultiplayer && typeof window.MiracleMultiplayer.syncHUD === 'function') {
        window.MiracleMultiplayer.syncHUD();
      }
      this.refreshOpenModalsIfVisible();

      if (window.MiracleMultiplayer && window.MiracleMultiplayer.active) {
        window.MiracleMultiplayer.broadcastMessage({
          type: 'village_sync',
          peerId: window.MiracleMultiplayer.peerId,
          resetEpoch: this.resetEpoch,
          contribs: this.contribs,
          footprints: {},
          decorations: {},
          farm: this.farm,
          news: []
        });
      }
      const base = String(window.MP_FIREBASE_DB_URL || '').replace(/\/+$/, '');
      if (base && typeof fetch === 'function') {
        const roomKey = encodeURIComponent(this.roomId);
        try {
          fetch(`${base}/mp_rooms/${roomKey}/meta.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resetEpoch: this.resetEpoch, ts: Date.now() })
          }).catch(() => {});
          fetch(`${base}/mp_rooms/${roomKey}/footprints.json`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: '{}' }).catch(() => {});
          fetch(`${base}/mp_rooms/${roomKey}/decorations.json`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: '{}' }).catch(() => {});
          fetch(`${base}/mp_rooms/${roomKey}/farm.json`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.assign({ resetEpoch: this.resetEpoch }, this.farm)) }).catch(() => {});
          fetch(`${base}/mp_rooms/${roomKey}/news.json`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: '{}' }).catch(() => {});
        } catch (e) {}
        this.syncMyContribToCloud();
      }
      if (typeof showToast === 'function') showToast('🔄 온라인 마을 건축·경제 미션을 새로 시작해요!');
    },

    // =========================================================================
    // 3D 건축물 & 동적 플랫폼/벽체/충돌체 관리
    // =========================================================================
    _clearColliderList(list) {
      if (typeof colliders !== 'undefined' && Array.isArray(colliders) && Array.isArray(list) && list.length) {
        list.forEach(item => {
          const idx = colliders.indexOf(item);
          if (idx >= 0) colliders.splice(idx, 1);
        });
      }
      if (Array.isArray(list)) list.length = 0;
    },

    _clearHouseDynamicPhysics() {
      if (typeof platforms !== 'undefined' && Array.isArray(platforms) && this._houseDynPlatforms.length) {
        this._houseDynPlatforms.forEach(item => {
          const idx = platforms.indexOf(item);
          if (idx >= 0) platforms.splice(idx, 1);
        });
      }
      this._houseDynPlatforms = [];
      this._clearColliderList(this._houseDynColliders);

      if (typeof wallMeshes !== 'undefined' && Array.isArray(wallMeshes) && this._houseDynWallMeshes.length) {
        this._houseDynWallMeshes.forEach(item => {
          const idx = wallMeshes.indexOf(item);
          if (idx >= 0) wallMeshes.splice(idx, 1);
        });
      }
      this._houseDynWallMeshes = [];
    },

    _clearShopDynamicColliders(shopId) {
      this._clearColliderList(this._shopDynColliders[shopId]);
      this._shopDynColliders[shopId] = [];
    },

    _clearTempleDynamicColliders() {
      this._clearColliderList(this._templeDynColliders);
      this._templeDynColliders = [];
      if (typeof wallMeshes !== 'undefined' && Array.isArray(wallMeshes) && this._templeDynWallMeshes.length) {
        this._templeDynWallMeshes.forEach(item => {
          const idx = wallMeshes.indexOf(item);
          if (idx >= 0) wallMeshes.splice(idx, 1);
        });
      }
      this._templeDynWallMeshes = [];
    },

    _clearDecorDynamicColliders() {
      this._clearColliderList(this._decorDynColliders);
      this._decorDynColliders = [];
    },

    onOpenWorldBuilt() {
      this._houseDynPlatforms = [];
      this._houseDynColliders = [];
      this._houseDynWallMeshes = [];
      this.houseBuiltStage = -1;
      this.shopRefs = {};
      this._shopDynColliders = {};
      this._templeDynColliders = [];
      this._templeDynWallMeshes = [];
      this._templeFireProps = [];
      this.templeBuiltStage = -1;
      this._decorDynColliders = [];
      this.decorBraziers = [];
      this.decorFountainDrops = [];
      this.decorFountainGroup = null;
      this._decorBuiltSig = '';
      this._farmRenderSig = '';
      this._farmWheatMeshes = [];
      this.seedBushes = [];
      this._pastureSig = '';
      this.pastureSheep = [];
      this._fishingUnlockState = null;
      this.customerNpcs = [];
      this._customerSaleTimers = {};

      if (this.bulletinTexture && typeof this.bulletinTexture.dispose === 'function') {
        try { this.bulletinTexture.dispose(); } catch (e) {}
      }
      this.bulletinTexture = null;
      this.bulletinCanvas = null;
      this._bulletinSig = '';

      this.buildGrandRockHouseSite();
      SHOPS_ORDER.forEach(sid => this.buildShopSite(sid));
      this.buildVillageBulletinBoard();
      this.buildFishingSpot();
      this.buildFarmSite();
      this.buildPastureSite();
      this.buildCustomerNpcs();
      this.buildTempleSite();
      this.buildDecorationsRoot();
      this.updateAllWorldLabels();
      this.updateBulletinBoardTexture();
    },

    rebuildAllVisualsIfStageChanged(prevStages, prevTempleStage, prevDecorSig, prevFarmSig) {
      let shopDoneChanged = false;
      if (!prevStages || prevStages.rock_house !== this.getBuildProgress('rock_house').stage) {
        this.rebuildGrandRockHouseVisuals();
      }
      SHOPS_ORDER.forEach(sid => {
        const curSt = this.getBuildProgress(sid).stage;
        if (!prevStages || prevStages[sid] !== curSt) {
          this.rebuildShopVisuals(sid);
          shopDoneChanged = true;
        }
      });
      if (shopDoneChanged) {
        this.rebuildFishingSpotVisuals();
        this.rebuildFarmVisuals();
        this.rebuildPastureVisuals();
      }
      if (typeof prevTempleStage !== 'number' || prevTempleStage !== this.getEconomySummary().templeStage) {
        this.rebuildTempleVisuals();
      }
      const curDecorSig = DECOR_ORDER.map(d => (this.decorations[d] ? '1' : '0')).join(',');
      if (prevDecorSig !== curDecorSig) {
        this.rebuildDecorationsVisuals();
      }
      const curFarmSig = `${this.farm.cycle}|${this.farm.step}|${this.farm.subProgress}`;
      if (prevFarmSig !== curFarmSig) {
        this.rebuildFarmVisuals();
      }
      this.updateAllWorldLabels();
    },

    buildGrandRockHouseSite() {
      const proj = PROJECTS.rock_house;
      const cx = proj.pos.x, cz = proj.pos.z;
      const by = (typeof getMiracleOpenWorldGroundHeight === 'function') ? getMiracleOpenWorldGroundHeight(cx, cz) : 0.25;

      const siteGrp = new THREE.Group();
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(7.2, 8.0, 32),
        new THREE.MeshBasicMaterial({ color: 0x34d399, side: THREE.DoubleSide, transparent: true, opacity: 0.80 })
      );
      ring.rotation.x = -Math.PI * 0.5;
      ring.position.y = 0.86;
      siteGrp.add(ring);

      const houseGrp = new THREE.Group();
      houseGrp.position.y = 0.80; // createWideBedrockFormation 상단 대지 높이와 정확히 정합!
      siteGrp.add(houseGrp);

      siteGrp.position.set(cx, by, cz);
      if (typeof worldGroup !== 'undefined' && worldGroup) worldGroup.add(siteGrp);

      if (this.houseLabel) {
        try { this.houseLabel.remove(); } catch (e) {}
      }
      const lbl = (typeof createWorldLabel === 'function') ? createWorldLabel('') : null;

      this.houseSiteGroup = siteGrp;
      this.houseGroup = houseGrp;
      this.houseRing = ring;
      this.houseLabel = lbl;
      this.houseBuiltStage = -1;

      this.rebuildGrandRockHouseVisuals();
    },

    rebuildGrandRockHouseVisuals() {
      const hGrp = this.houseGroup;
      if (!hGrp) return;
      const pr = this.getBuildProgress('rock_house');
      const stage = pr.stage;
      if (stage === this.houseBuiltStage) return;
      this.houseBuiltStage = stage;

      this._clearHouseDynamicPhysics();
      while (hGrp.children.length > 0) {
        const ch = hGrp.children[0];
        hGrp.remove(ch);
        _disposeObjSafe(ch);
      }

      const proj = PROJECTS.rock_house;
      const cx = proj.pos.x, cz = proj.pos.z;
      const by = (typeof getMiracleOpenWorldGroundHeight === 'function') ? getMiracleOpenWorldGroundHeight(cx, cz) : 0.25;
      const yBase = by + 0.80; // 반석 상단 대지 Y (world coords)

      const w = 11.2, d = 8.4, h1 = 4.0, wallT = 0.62;
      const doorHalfW = 1.6;
      const sideW = (w * 0.5) - doorHalfW;
      const floor1H = 0.25;
      const floor1Y = yBase + floor1H; // 1층 실내 바닥 높이 = by + 1.05
      const ceilLocalY = floor1H + h1; // 4.25m above bedrock plateau
      const y2 = yBase + ceilLocalY;   // 2층 테라스/다락 바닥 높이 = by + 5.05

      const seed = 910;
      const wallCol = '#ead8b8';
      const trimCol = '#caa06c';
      const brickCol1 = '#d5a870';
      const brickCol2 = '#c09058';
      const woodCol = '#6b4226';

      const mkOrg = (bw, bh, bd, col, x, y, z, sd, cast = true) => {
        const geo = (typeof createOrganicBoxGeo === 'function')
          ? createOrganicBoxGeo(bw, bh, bd, sd, 0.045, 0.98, 2)
          : new THREE.BoxGeometry(bw, bh, bd);
        return createLowPolyMesh(geo, col, x, y, z, cast);
      };

      const pushDynPlatform = (pObj) => {
        if (typeof platforms !== 'undefined' && Array.isArray(platforms)) {
          platforms.push(pObj);
          this._houseDynPlatforms.push(pObj);
        }
      };

      // Stage 0: 반석 위 빈 건축 터 표시
      if (stage === 0) {
        const markerPts = [[-5.0, -3.6], [5.0, -3.6], [-5.0, 3.6], [5.0, 3.6]];
        markerPts.forEach(([mx, mz], i) => {
          const stake = createLowPolyMesh(new THREE.CylinderGeometry(0.11, 0.14, 1.35, 6), woodCol, mx, 0.68, mz, true);
          const cap = createLowPolyMesh(new THREE.DodecahedronGeometry(0.18, 0), '#facc15', mx, 1.42, mz, false);
          hGrp.add(stake, cap);
        });
        const sign = createLowPolyMesh(createOrganicBoxGeo(2.8, 0.72, 0.14, 902, 0.04, 0.98, 1), '#7c4722', 0, 1.15, d * 0.5 + 0.3, false);
        hGrp.add(sign);
        return;
      }

      // Stage 1+: 넓은 석조 바닥 기단 + 남측 진입 계단 + 4모서리 석조 기둥
      const staticGrp = new THREE.Group();
      staticGrp.add(mkOrg(w + 0.3, floor1H + 0.15, d + 0.3, '#b8a993', 0, floor1H * 0.5, 0, seed + 1));
      staticGrp.add(mkOrg(3.4, 0.14, 0.90, '#c6aa80', 0, 0.07, d * 0.5 + 0.45, seed + 2));
      [[-w * 0.48, -d * 0.46], [w * 0.48, -d * 0.46], [-w * 0.48, d * 0.46], [w * 0.48, d * 0.46]].forEach(([px, pz], i) => {
        staticGrp.add(mkOrg(0.86, 2.6, 0.86, trimCol, px, floor1H + 1.3, pz, seed + 10 + i));
      });
      pushDynPlatform({
        minX: cx - w * 0.5,
        maxX: cx + w * 0.5,
        minZ: cz - d * 0.5,
        maxZ: cz + d * 0.5,
        topY: floor1Y
      });
      pushDynPlatform({
        minX: cx - 1.7,
        maxX: cx + 1.7,
        minZ: cz + d * 0.5,
        maxZ: cz + d * 0.5 + 0.95,
        topY: yBase + 0.14
      });

      // Stage 2+: 1층 대형 개방형 회관 실내 (남쪽 3.2m 아치 출입구 개방 · 실내 판석 · 양탄자 · 화덕 · 긴 식탁)
      if (stage >= 2) {
        // 북 / 서 / 동 외벽
        staticGrp.add(
          mkOrg(w, h1, wallT, wallCol, 0, floor1H + h1 * 0.5, -d * 0.5 + wallT * 0.5, seed + 20),
          mkOrg(wallT, h1, d, wallCol, -w * 0.5 + wallT * 0.5, floor1H + h1 * 0.5, 0, seed + 21),
          mkOrg(wallT, h1, d, wallCol,  w * 0.5 - wallT * 0.5, floor1H + h1 * 0.5, 0, seed + 22)
        );
        // 남쪽 정면벽: 중앙 3.2m(x in [-1.6, +1.6]) 완전 개방 + 좌/우 벽체 + 아치 상인방
        staticGrp.add(
          mkOrg(sideW, h1, wallT, wallCol, -(doorHalfW + sideW * 0.5), floor1H + h1 * 0.5, d * 0.5 - wallT * 0.5, seed + 23),
          mkOrg(sideW, h1, wallT, wallCol,  (doorHalfW + sideW * 0.5), floor1H + h1 * 0.5, d * 0.5 - wallT * 0.5, seed + 24),
          mkOrg(doorHalfW * 2 + 0.4, h1 - 2.95, wallT + 0.10, trimCol, 0, floor1H + 2.95 + (h1 - 2.95) * 0.5, d * 0.5 - wallT * 0.5, seed + 25),
          mkOrg(0.36, 3.05, wallT + 0.24, trimCol, -doorHalfW, floor1H + 1.52, d * 0.5 - wallT * 0.42, seed + 26),
          mkOrg(0.36, 3.05, wallT + 0.24, trimCol,  doorHalfW, floor1H + 1.52, d * 0.5 - wallT * 0.42, seed + 27)
        );
        // 정면 아치 홍예석 + 따뜻한 창문
        for (let i = 0; i < 5; i++) {
          const ang = Math.PI * (0.14 + (i / 4) * 0.72);
          const archSt = mkOrg(0.62, 0.28, 0.34, brickCol2, Math.cos(ang) * (doorHalfW + 0.06), floor1H + 2.76 + Math.sin(ang) * 0.56, d * 0.5 + 0.06, seed + 30 + i, false);
          archSt.rotation.z = ang - Math.PI * 0.5;
          staticGrp.add(archSt);
        }
        [-w * 0.34, w * 0.34].forEach((wx, wi) => {
          const pane = createLowPolyMesh(new THREE.BoxGeometry(1.05, 1.05, 0.20), '#f59e0b', wx, floor1H + 2.25, d * 0.5 + 0.04, false);
          pane.userData._emissiveGlow = true;
          staticGrp.add(pane, mkOrg(1.36, 0.18, 0.28, woodCol, wx, floor1H + 2.84, d * 0.5 + 0.08, seed + 40 + wi, false));
        });

        // 1층 실내 바닥 디딤석 · 대형 직조 양탄자 · 북벽 아치 화덕 · 서측 긴 교제 식탁
        staticGrp.add(
          mkOrg(4.8, 0.05, 3.6, '#9a3412', 0.1, floor1H + 0.03, 0.4, seed + 50, false),
          mkOrg(3.8, 0.06, 2.7, '#d97706', 0.1, floor1H + 0.04, 0.4, seed + 51, false),
          mkOrg(2.2, 0.06, 1.4, '#fde68a', 0.1, floor1H + 0.05, 0.4, seed + 52, false)
        );
        // 북벽 화덕 (z = -3.15)
        const hz = -d * 0.5 + wallT + 0.42;
        staticGrp.add(
          mkOrg(1.8, 0.34, 0.85, '#b89872', 0, floor1H + 0.18, hz, seed + 55, false),
          mkOrg(0.32, 1.25, 0.72, '#d6b68c', -0.68, floor1H + 0.92, hz, seed + 56, false),
          mkOrg(0.32, 1.25, 0.72, '#d6b68c',  0.68, floor1H + 0.92, hz, seed + 57, false),
          mkOrg(1.85, 0.48, 0.80, trimCol,   0, floor1H + 1.72, hz, seed + 58, false)
        );
        const hCoal = createLowPolyMesh(new THREE.DodecahedronGeometry(0.32, 0), '#f97316', 0, floor1H + 0.46, hz + 0.06, false);
        hCoal.scale.set(1.4, 0.45, 0.95);
        hCoal.userData._emissiveGlow = true;
        staticGrp.add(hCoal);

        // 서쪽 벽 곁 긴 교제 식탁 (x = -3.55, z = 0)
        const tx = -3.55;
        staticGrp.add(mkOrg(1.20, 0.16, 3.6, '#854d0e', tx, floor1H + 0.78, 0, seed + 60));
        [[-0.45, -1.4], [0.45, -1.4], [-0.45, 1.4], [0.45, 1.4]].forEach(([lx, lz]) => {
          staticGrp.add(createLowPolyMesh(new THREE.CylinderGeometry(0.06, 0.075, 0.76, 6), '#5c2d0c', tx + lx, floor1H + 0.38, lz, false));
        });
        const loaf = createLowPolyMesh(new THREE.DodecahedronGeometry(0.24, 0), '#d97706', tx, floor1H + 0.96, -0.5, false);
        loaf.scale.set(1.1, 0.55, 1.45);
        const chalice = createLowPolyMesh(new THREE.CylinderGeometry(0.10, 0.07, 0.28, 6), '#facc15', tx, floor1H + 1.00, 0.45, false);
        staticGrp.add(loaf, chalice);

        // 동쪽 실내 항아리 선반
        if (typeof createBuildingAmphoraProp === 'function') {
          const amp1 = createBuildingAmphoraProp(0.92, '#c26533', '#8f471e');
          amp1.position.set(w * 0.5 - wallT - 0.48, floor1H, -2.5);
          staticGrp.add(amp1);
        }

        // 1층 외벽 충돌 등록 (남쪽 출입구 [cx - 1.6, cx + 1.6]은 열려 있음! 동측 외부 계단 통과 안 막도록 동벽 maxX=cx+5.50)
        const wallTop1 = y2 - 0.08;
        [
          { minX: cx - w * 0.5, maxX: cx + w * 0.5, minZ: cz - d * 0.5 - 0.05, maxZ: cz - d * 0.5 + wallT + 0.05, topY: wallTop1, wallOnly: true },
          { minX: cx - w * 0.5 - 0.05, maxX: cx - w * 0.5 + wallT + 0.05, minZ: cz - d * 0.5, maxZ: cz + d * 0.5, topY: wallTop1, wallOnly: true },
          { minX: cx + w * 0.5 - wallT - 0.05, maxX: cx + w * 0.5 - 0.10, minZ: cz - d * 0.5, maxZ: cz + d * 0.5, topY: wallTop1, wallOnly: true },
          { minX: cx - w * 0.5, maxX: cx - doorHalfW - 0.05, minZ: cz + d * 0.5 - wallT - 0.05, maxZ: cz + d * 0.5 + 0.05, topY: wallTop1, wallOnly: true },
          { minX: cx + doorHalfW + 0.05, maxX: cx + w * 0.5 - 0.10, minZ: cz + d * 0.5 - wallT - 0.05, maxZ: cz + d * 0.5 + 0.05, topY: wallTop1, wallOnly: true }
        ].forEach(wp => pushDynPlatform(wp));
      }

      // Stage 3+: 동측(+X) 9단 외부 돌계단 (걸어서 2층 등반!) + 2층 바닥 테라스 + 난간
      if (stage >= 3) {
        const stairW = 2.05;
        const stairLocalX = w * 0.5 + 1.15; // cx + 6.75 (x: +5.72 ~ +7.78 — 동벽과 겹침 0!)
        const railLocalX = stairLocalX + stairW * 0.5 + 0.10;
        const stepCount = 9;
        const stairSpanD = d * 0.84; // 7.056m
        const stepDepth = stairSpanD / stepCount; // ~0.784m

        for (let s = 1; s <= stepCount; s++) {
          const sh = (ceilLocalY / stepCount) * s; // 4.25 / 9 = 0.472m per step
          const sz = (d * 0.46) - (s - 0.5) * stepDepth;
          staticGrp.add(
            mkOrg(stairW, sh, stepDepth + 0.08, s % 2 === 0 ? '#c6aa80' : '#d6b98c', stairLocalX, sh * 0.5, sz, seed + 80 + s),
            mkOrg(0.24, sh + 0.48, stepDepth + 0.08, trimCol, railLocalX, (sh + 0.48) * 0.5, sz, seed + 100 + s, false)
          );
          pushDynPlatform({
            minX: cx + stairLocalX - stairW * 0.55,
            maxX: cx + stairLocalX + stairW * 0.55,
            minZ: cz + sz - stepDepth * 0.72,
            maxZ: cz + sz + stepDepth * 0.72,
            topY: yBase + sh
          });
        }
        // 계단 최상단 → 2층 테라스 연결 착지 패드 (Step 8 위치와 겹치지 않도록 북측 d*0.5+1.25까지만 등록)
        staticGrp.add(mkOrg(stairW + 0.5, 0.30, 1.7, trimCol, stairLocalX - 0.25, ceilLocalY - 0.15, -d * 0.5 + 0.58, seed + 120));
        pushDynPlatform({
          minX: cx + w * 0.5 - 0.4,
          maxX: cx + stairLocalX + stairW * 0.55,
          minZ: cz - d * 0.5 - 0.15,
          maxZ: cz - d * 0.5 + 1.25,
          topY: y2
        });

        // 2층 테라스 남쪽/동남 난간 (북동쪽 계단 진입부는 개방!)
        staticGrp.add(
          mkOrg(w, 0.68, 0.30, wallCol, 0, ceilLocalY + 0.34, d * 0.5 - 0.15, seed + 125),
          mkOrg(0.30, 0.68, d * 0.58, wallCol, w * 0.5 - 0.15, ceilLocalY + 0.34, d * 0.21, seed + 126)
        );
        // 1층 천장(=2층 바닥) 별도 그룹으로 병합해 1층 실내 진입 시 자동 반투명 투과!
        const roof1Grp = new THREE.Group();
        roof1Grp.add(mkOrg(w + 0.36, 0.30, d + 0.36, trimCol, 0, ceilLocalY - 0.12, 0, seed + 130));
        for (let b = -4; b <= 4; b++) {
          const beam = createLowPolyMesh(new THREE.CylinderGeometry(0.12, 0.13, d + 0.4, 5), woodCol, b * 1.22, ceilLocalY - 0.34, 0, false);
          beam.rotation.x = Math.PI * 0.5;
          roof1Grp.add(beam);
        }
        const wallStart1 = Array.isArray(wallMeshes) ? wallMeshes.length : 0;
        if (typeof mergeStaticLowPolyGroupToVertexColor === 'function') {
          mergeStaticLowPolyGroupToVertexColor(roof1Grp, { registerWall: true, castShadow: true });
        }
        if (Array.isArray(wallMeshes)) {
          for (let wi = wallStart1; wi < wallMeshes.length; wi++) {
            this._houseDynWallMeshes.push(wallMeshes[wi]);
          }
        }
        hGrp.add(roof1Grp);

        // 2층 바닥 플랫폼 (passUnderY 지정 → 1층에서는 통과, 2층 테라스에서는 단단히 착지!)
        pushDynPlatform({
          minX: cx - w * 0.5 - 0.2,
          maxX: cx + w * 0.5 + 0.2,
          minZ: cz - d * 0.5 - 0.2,
          maxZ: cz + d * 0.5 + 0.2,
          topY: y2,
          passUnderY: y2 - 0.72
        });
      }

      // Stage 4+: 2층 개방형 다락방 실내 (동쪽 테라스 방향 2.8m 출입구 개방 + 아마포 차양 + 2층 지붕 투과)
      if (stage >= 4) {
        const rCx = -1.6;
        const rW = 7.0, rH = 3.2, rD = 6.2, rT = 0.50;
        const doorHalfZ = 1.4;
        const sideZ = (rD * 0.5) - doorHalfZ;
        staticGrp.add(
          mkOrg(rW, rH, rT, '#f3e5cb', rCx, ceilLocalY + rH * 0.5, -rD * 0.5 + rT * 0.5, seed + 140),
          mkOrg(rW, rH, rT, '#f3e5cb', rCx, ceilLocalY + rH * 0.5,  rD * 0.5 - rT * 0.5, seed + 141),
          mkOrg(rT, rH, rD, '#f3e5cb', rCx - rW * 0.5 + rT * 0.5, ceilLocalY + rH * 0.5, 0, seed + 142),
          mkOrg(rT, rH, sideZ, '#f3e5cb', rCx + rW * 0.5 - rT * 0.5, ceilLocalY + rH * 0.5, -(doorHalfZ + sideZ * 0.5), seed + 143),
          mkOrg(rT, rH, sideZ, '#f3e5cb', rCx + rW * 0.5 - rT * 0.5, ceilLocalY + rH * 0.5,  (doorHalfZ + sideZ * 0.5), seed + 144),
          mkOrg(rT + 0.14, rH - 2.35, doorHalfZ * 2 + 0.24, trimCol, rCx + rW * 0.5 - rT * 0.5, ceilLocalY + 2.35 + (rH - 2.35) * 0.5, 0, seed + 145)
        );
        // 2층 실내 러그 · 좌식 탁자 · 두루마리 · 테라스 차양 & 벤치
        staticGrp.add(
          createLowPolyMesh(new THREE.BoxGeometry(3.8, 0.05, 3.4), '#1d4ed8', rCx - 0.1, ceilLocalY + 0.04, 0, false),
          mkOrg(1.1, 0.42, 2.8, woodCol, rCx - 1.8, ceilLocalY + 0.24, 0, seed + 150)
        );
        if (typeof createOrganicLinenAwningGroup === 'function') {
          const awn = createOrganicLinenAwningGroup(3.2, 2.2, { main: '#f3e7d0', trim: '#b45309' }, woodCol, seed + 155, 0.18, true, 2.3);
          awn.position.set(rCx + rW * 0.5 + 1.4, ceilLocalY + 2.55, 0.6);
          staticGrp.add(awn);
        }
        if (typeof createOrganicTerraceBench === 'function') {
          const tb = createOrganicTerraceBench(woodCol, seed + 158);
          tb.rotation.y = Math.PI * 0.5;
          tb.position.set(w * 0.5 - 0.9, ceilLocalY, d * 0.24);
          staticGrp.add(tb);
        }

        // 2층 외벽 플랫폼 (passUnderY 지정 → 1층 및 2층 문 [cz-1.4, cz+1.4] 방해 안 함!)
        const wPass2 = y2 - 0.35;
        const wTop2 = y2 + rH - 0.05;
        const rMinX = cx + rCx - rW * 0.5, rMaxX = cx + rCx + rW * 0.5;
        const rMinZ = cz - rD * 0.5, rMaxZ = cz + rD * 0.5;
        [
          { minX: rMinX, maxX: rMaxX, minZ: rMinZ - 0.05, maxZ: rMinZ + rT, topY: wTop2, wallOnly: true, passUnderY: wPass2 },
          { minX: rMinX, maxX: rMaxX, minZ: rMaxZ - rT, maxZ: rMaxZ + 0.05, topY: wTop2, wallOnly: true, passUnderY: wPass2 },
          { minX: rMinX - 0.05, maxX: rMinX + rT, minZ: rMinZ, maxZ: rMaxZ, topY: wTop2, wallOnly: true, passUnderY: wPass2 },
          { minX: rMaxX - rT, maxX: rMaxX + 0.05, minZ: rMinZ, maxZ: cz - doorHalfZ - 0.05, topY: wTop2, wallOnly: true, passUnderY: wPass2 },
          { minX: rMaxX - rT, maxX: rMaxX + 0.05, minZ: cz + doorHalfZ + 0.05, maxZ: rMaxZ, topY: wTop2, wallOnly: true, passUnderY: wPass2 }
        ].forEach(wp => pushDynPlatform(wp));

        // 2층 지붕 그룹 (wallMeshes 자동 투과)
        const roof2Grp = new THREE.Group();
        roof2Grp.add(mkOrg(rW + 0.36, 0.28, rD + 0.36, trimCol, rCx, ceilLocalY + rH + 0.12, 0, seed + 165));
        if (stage >= 5) {
          roof2Grp.add(mkOrg(rW + 0.56, 0.24, rD + 0.56, '#eab308', rCx, ceilLocalY + rH + 0.34, 0, seed + 170));
        }
        const wallStart2 = Array.isArray(wallMeshes) ? wallMeshes.length : 0;
        if (typeof mergeStaticLowPolyGroupToVertexColor === 'function') {
          mergeStaticLowPolyGroupToVertexColor(roof2Grp, { registerWall: true, castShadow: true });
        }
        if (Array.isArray(wallMeshes)) {
          for (let wi = wallStart2; wi < wallMeshes.length; wi++) {
            this._houseDynWallMeshes.push(wallMeshes[wi]);
          }
        }
        hGrp.add(roof2Grp);

        pushDynPlatform({
          minX: rMinX,
          maxX: rMaxX,
          minZ: rMinZ,
          maxZ: rMaxZ,
          topY: y2 + rH + 0.26,
          passUnderY: y2 + rH - 0.65
        });
      }

      // Stage 5: 완공 장식(정면 화분 · 횃불 기둥 · 황금 바닥 링)
      if (stage >= 5) {
        [-3.6, 3.6].forEach((lx) => {
          staticGrp.add(
            createLowPolyMesh(new THREE.CylinderGeometry(0.32, 0.24, 0.48, 6), '#b86232', lx, 0.24, d * 0.5 + 0.55, false),
            createLowPolyMesh(new THREE.DodecahedronGeometry(0.45, 0), '#4d7c0f', lx, 0.70, d * 0.5 + 0.55, false)
          );
        });
        if (this.houseRing && this.houseRing.material) {
          this.houseRing.material.color.setHex(0xfacc15);
        }
      } else if (this.houseRing && this.houseRing.material) {
        this.houseRing.material.color.setHex(0x34d399);
      }

      // staticGrp 병합 및 등록 (벽체는 platforms wallOnly로 관리하므로 registerWall:false)
      if (typeof mergeStaticLowPolyGroupToVertexColor === 'function') {
        mergeStaticLowPolyGroupToVertexColor(staticGrp, { registerWall: false, castShadow: true });
      }
      hGrp.add(staticGrp);
    },

    buildShopSite(shopId) {
      const proj = PROJECTS[shopId];
      if (!proj) return;
      const sx = proj.pos.x, sz = proj.pos.z;
      const sy = (typeof getMiracleOpenWorldGroundHeight === 'function') ? getMiracleOpenWorldGroundHeight(sx, sz) : 0.25;

      const root = new THREE.Group();
      root.position.set(sx, sy, sz);
      root.rotation.y = proj.yaw || 0;

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(3.4, 3.9, 28),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide, transparent: true, opacity: 0.78 })
      );
      ring.rotation.x = -Math.PI * 0.5;
      ring.position.y = 0.08;
      root.add(ring);

      const modelGrp = new THREE.Group();
      root.add(modelGrp);
      if (typeof worldGroup !== 'undefined' && worldGroup) worldGroup.add(root);

      const lbl = (typeof createWorldLabel === 'function') ? createWorldLabel('') : null;
      this.shopRefs[shopId] = { root, ring, modelGrp, label: lbl, builtStage: -1, pos: new THREE.Vector3(sx, sy + 2.4, sz), npc: null };
      this._shopDynColliders[shopId] = [];
      this.rebuildShopVisuals(shopId);
    },

    rebuildShopVisuals(shopId) {
      const ref = this.shopRefs[shopId];
      const proj = PROJECTS[shopId];
      if (!ref || !proj) return;
      const pr = this.getBuildProgress(shopId);
      const stage = pr.stage;
      if (stage === ref.builtStage) return;
      ref.builtStage = stage;

      this._clearShopDynamicColliders(shopId);
      while (ref.modelGrp.children.length > 0) {
        const ch = ref.modelGrp.children[0];
        ref.modelGrp.remove(ch);
        _disposeObjSafe(ch);
      }
      ref.npc = null;

      const grp = ref.modelGrp;
      const woodCol = '#6b4226';
      const stoneCol = '#d6cfc2';
      const mkBox = (w, h, d, col, x, y, z, sd, cast = true) => {
        const geo = (typeof createOrganicBoxGeo === 'function')
          ? createOrganicBoxGeo(w, h, d, sd, 0.04, 0.97, 1)
          : new THREE.BoxGeometry(w, h, d);
        return createLowPolyMesh(geo, col, x, y, z, cast);
      };

      // Stage 0: 상점 터 비움 + 말뚝/로프/안내 표지판 (미션 표시 · 충돌 0)
      if (stage === 0) {
        grp.add(mkBox(5.8, 0.10, 4.4, '#c4a47c', 0, 0.04, 0, 300 + proj.order * 10, false));
        [[-2.6, -1.9], [2.6, -1.9], [-2.6, 1.9], [2.6, 1.9]].forEach(([px, pz]) => {
          grp.add(createLowPolyMesh(new THREE.CylinderGeometry(0.08, 0.11, 1.05, 6), woodCol, px, 0.52, pz, true));
        });
        // 앞쪽 건축 미션 안내 팻말
        grp.add(createLowPolyMesh(new THREE.CylinderGeometry(0.07, 0.09, 1.4, 5), woodCol, 0, 0.70, 1.8, true));
        const signTex = _drawCanvasLabelTexture(`${proj.icon} ${proj.name} 터`, `🪵0/${proj.woodReq} · 🪨0/${proj.stoneReq}`, {
          bg: '#451a03', border: proj.awningColor, titleFont: 'bold 30px "Malgun Gothic", sans-serif'
        });
        const signMat = signTex
          ? new THREE.MeshBasicMaterial({ map: signTex })
          : new THREE.MeshBasicMaterial({ color: 0xfde68a });
        const signBoard = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.95, 0.12), signMat);
        signBoard.position.set(0, 1.48, 1.82);
        grp.add(signBoard);
        if (ref.ring && ref.ring.material) ref.ring.material.color.setHex(0x38bdf8);
        return;
      }

      // Stage 1+: 석조 단상 + 목재 기둥 + 카운터 틀
      const staticShop = new THREE.Group();
      staticShop.add(mkBox(5.6, 0.24, 4.2, stoneCol, 0, 0.12, 0, 400 + proj.order * 20));
      [[-2.4, -1.7], [2.4, -1.7], [-2.4, 1.6], [2.4, 1.6]].forEach(([px, pz]) => {
        staticShop.add(createLowPolyMesh(new THREE.CylinderGeometry(0.11, 0.13, 2.85, 6), woodCol, px, 1.54, pz, true));
      });
      staticShop.add(mkBox(4.2, 0.92, 0.85, '#8a4f1e', 0, 0.68, 0.85, 405 + proj.order * 20));

      // Stage 2+: 후면/측면 반개방 벽체 + 지붕 서까래
      if (stage >= 2) {
        staticShop.add(
          mkBox(5.2, 2.55, 0.38, '#ebd0a9', 0, 1.50, -1.72, 410 + proj.order * 20),
          mkBox(0.35, 1.65, 3.6, '#ebd0a9', -2.42, 1.05, 0, 411 + proj.order * 20),
          mkBox(0.35, 1.65, 3.6, '#ebd0a9',  2.42, 1.05, 0, 412 + proj.order * 20),
          mkBox(5.6, 0.22, 4.1, '#a16207', 0, 2.95, -0.05, 413 + proj.order * 20)
        );
      }

      // Stage 3: 완공된 상점 (스트라이프 아마포 차양 + 간판 + 3D 테마 진열품 + 상인 NPC)
      if (stage >= 3) {
        if (typeof createOrganicLinenAwningGroup === 'function') {
          const canopy = createOrganicLinenAwningGroup(5.4, 2.2, { main: '#fef3c7', trim: proj.awningColor }, woodCol, 420 + proj.order, 0.20, true, 2.4, { striped: true });
          canopy.position.set(0, 2.95, 1.45);
          staticShop.add(canopy);
        }
        const shopTex = _drawCanvasLabelTexture(`${proj.icon} ${proj.name}`, '납품 환영 · NPC 판매 중!', {
          bg: '#78350f', border: proj.awningColor, titleFont: 'bold 34px "Malgun Gothic", sans-serif', subFont: 'bold 16px "Malgun Gothic", sans-serif'
        });
        if (shopTex) {
          const bMat = new THREE.MeshBasicMaterial({ map: shopTex });
          const board = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.85, 0.14), bMat);
          board.position.set(0, 3.55, 1.65);
          grp.add(board);
        }

        // 상점별 테마 3D 상품 진열
        if (shopId === 'shop_milk') {
          [-1.3, -0.45, 0.45].forEach((jx, ji) => {
            staticShop.add(createLowPolyMesh(new THREE.CylinderGeometry(0.18, 0.24, 0.46, 7), '#f8fafc', jx, 1.38, 0.86, false));
            staticShop.add(createLowPolyMesh(new THREE.CylinderGeometry(0.28, 0.28, 0.16, 8), '#fde047', 1.2 + ji * 0.05, 1.24 + ji * 0.17, 0.85, false));
          });
        } else if (shopId === 'shop_fish') {
          staticShop.add(mkBox(2.8, 0.24, 0.82, '#38bdf8', -0.2, 1.24, 0.85, 430, false));
          for (let fi = 0; fi < 5; fi++) {
            const fishMesh = (typeof window.createLowPolyFishMesh === 'function')
              ? window.createLowPolyFishMesh(fi % 2 === 0 ? '#38bdf8' : '#93c5fd', 0.56, fi)
              : createLowPolyMesh(new THREE.DodecahedronGeometry(0.18, 0), '#60a5fa', 0, 0, 0, false);
            fishMesh.position.set(-1.3 + fi * 0.56, 1.44, 0.84 + (fi % 2) * 0.12);
            fishMesh.rotation.y = fi * 0.5;
            grp.add(fishMesh);
          }
        } else if (shopId === 'shop_grain') {
          [-1.4, -0.6, 0.2].forEach((gx, gi) => {
            const sack = createLowPolyMesh(new THREE.IcosahedronGeometry(0.32, 0), gi % 2 === 0 ? '#eab308' : '#d6bc90', gx, 1.36, 0.86, false);
            sack.scale.set(1.0, 0.85, 1.0);
            staticShop.add(sack);
          });
          for (let bi = 0; bi < 3; bi++) {
            const bread = createLowPolyMesh(new THREE.DodecahedronGeometry(0.22, 0), '#d97706', 1.15 + (bi - 1) * 0.26, 1.28, 0.85, false);
            bread.scale.set(1.1, 0.55, 1.3);
            staticShop.add(bread);
          }
        } else if (shopId === 'shop_cloth') {
          const clothCols = ['#ef4444', '#3b82f6', '#facc15', '#10b981', '#a855f7'];
          clothCols.forEach((cc, ci) => {
            const roll = createLowPolyMesh(new THREE.CylinderGeometry(0.14, 0.14, 0.65, 7), cc, -1.4 + ci * 0.68, 1.28, 0.86, false);
            roll.rotation.z = Math.PI * 0.5;
            staticShop.add(roll);
          });
        }

        // 상점 앞 상인 NPC
        if (typeof window.createLowPolyPersonMesh === 'function') {
          const keeper = window.createLowPolyPersonMesh(proj.shopkeeperPreset || 'villager', proj.shopkeeperIdx || 1);
          keeper.position.set(0, 0.24, -0.2);
          grp.add(keeper);
          ref.npc = keeper;
        }
        if (ref.ring && ref.ring.material) ref.ring.material.color.setHex(0xfacc15);
      } else if (ref.ring && ref.ring.material) {
        ref.ring.material.color.setHex(0x34d399);
      }

      if (typeof mergeStaticLowPolyGroupToVertexColor === 'function') {
        mergeStaticLowPolyGroupToVertexColor(staticShop, { registerWall: false, castShadow: true });
      }
      grp.add(staticShop);

      // Stage 1+ 회전 고려 충돌 박스 (도로 비침해)
      const yaw = proj.yaw || 0;
      const ac = Math.abs(Math.cos(yaw)), as = Math.abs(Math.sin(yaw));
      const hw = 2.6 * ac + 1.8 * as;
      const hd = 2.6 * as + 1.8 * ac;
      const colBox = { minX: proj.pos.x - hw, maxX: proj.pos.x + hw, minZ: proj.pos.z - hd, maxZ: proj.pos.z + hd };
      if (typeof colliders !== 'undefined' && Array.isArray(colliders)) {
        colliders.push(colBox);
        this._shopDynColliders[shopId].push(colBox);
      }
    },

    buildVillageBulletinBoard() {
      const bx = BULLETIN_POS.x, bz = BULLETIN_POS.z;
      const by = (typeof getMiracleOpenWorldGroundHeight === 'function') ? getMiracleOpenWorldGroundHeight(bx, bz) : 0.25;
      const grp = new THREE.Group();
      const woodCol = '#5c3114';

      const base = createLowPolyMesh(new THREE.CylinderGeometry(1.85, 2.05, 0.22, 10), '#cbd5e1', 0, 0.11, 0, true);
      const postL = createLowPolyMesh(new THREE.CylinderGeometry(0.12, 0.15, 3.0, 6), woodCol, -1.25, 1.5, 0, true);
      const postR = createLowPolyMesh(new THREE.CylinderGeometry(0.12, 0.15, 3.0, 6), woodCol,  1.25, 1.5, 0, true);
      const frame = createLowPolyMesh(new THREE.BoxGeometry(2.65, 1.72, 0.20), '#78350f', 0, 1.95, 0, true);
      const roof = createLowPolyMesh(new THREE.ConeGeometry(2.05, 0.72, 4), '#92400e', 0, 3.22, 0, true);
      roof.rotation.y = Math.PI * 0.25;
      roof.scale.set(1.25, 1.0, 0.55);

      // 양옆 등불 장식
      [-1.42, 1.42].forEach(lx => {
        const lan = createLowPolyMesh(new THREE.DodecahedronGeometry(0.18, 0), '#fde047', lx, 2.68, 0, false);
        lan.userData._emissiveGlow = true;
        grp.add(lan);
      });

      const canvas = (typeof document !== 'undefined') ? document.createElement('canvas') : null;
      if (canvas) {
        canvas.width = 512;
        canvas.height = 320;
        this.bulletinCanvas = canvas;
        if (typeof THREE.CanvasTexture === 'function') {
          this.bulletinTexture = new THREE.CanvasTexture(canvas);
        }
      }
      const faceMat = this.bulletinTexture
        ? new THREE.MeshBasicMaterial({ map: this.bulletinTexture })
        : new THREE.MeshBasicMaterial({ color: 0xfef3c7 });
      const frontBoard = new THREE.Mesh(new THREE.PlaneGeometry(2.42, 1.52), faceMat);
      frontBoard.position.set(0, 1.95, 0.11);
      const backBoard = new THREE.Mesh(new THREE.PlaneGeometry(2.42, 1.52), faceMat);
      backBoard.rotation.y = Math.PI;
      backBoard.position.set(0, 1.95, -0.11);

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(2.3, 2.75, 24),
        new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide, transparent: true, opacity: 0.76 })
      );
      ring.rotation.x = -Math.PI * 0.5;
      ring.position.y = 0.08;

      grp.add(base, postL, postR, frame, roof, frontBoard, backBoard, ring);
      grp.position.set(bx, by, bz);
      if (typeof worldGroup !== 'undefined' && worldGroup) worldGroup.add(grp);

      if (typeof colliders !== 'undefined' && Array.isArray(colliders)) {
        colliders.push({ minX: bx - 1.65, maxX: bx + 1.65, minZ: bz - 0.65, maxZ: bz + 0.65 });
      }
      if (this.bulletinLabel) {
        try { this.bulletinLabel.remove(); } catch (e) {}
      }
      this.bulletinLabel = (typeof createWorldLabel === 'function') ? createWorldLabel('📌 마을 중앙 게시판 (실시간 소식)') : null;
      this.bulletinGroup = grp;
    },

    // =========================================================================
    // 2단계 3D 현장 빌더 (갈릴리 낚시 · 우물 5단계 농사 · 양떼 목장 · 손님 NPC · 성전 5단계 · 꾸미기 4종)
    // =========================================================================
    buildFishingSpot() {
      const sp = ACTIVITY_SPOTS.fishing;
      const fx = sp.pos.x, fz = sp.pos.z;
      const grp = new THREE.Group();
      grp.position.set(fx, 0, fz);

      // 선착장 위 나무 낚시 거치대 & 어망 바구니
      const py = 0.36;
      const rack = createLowPolyMesh(new THREE.BoxGeometry(1.1, 0.14, 0.45), '#78350f', 1.2, py + 0.58, 1.35, true);
      const post1 = createLowPolyMesh(new THREE.CylinderGeometry(0.06, 0.07, 0.62, 5), '#5c3114', 0.8, py + 0.31, 1.35, true);
      const post2 = createLowPolyMesh(new THREE.CylinderGeometry(0.06, 0.07, 0.62, 5), '#5c3114', 1.6, py + 0.31, 1.35, true);
      const basket = createLowPolyMesh(new THREE.CylinderGeometry(0.36, 0.28, 0.42, 7), '#b45309', 2.2, py + 0.21, 1.15, true);
      const rod = createLowPolyMesh(new THREE.CylinderGeometry(0.025, 0.045, 3.2, 5), '#92400e', -0.4, py + 1.05, 0.85, false);
      rod.rotation.z = 0.85;

      // 물 위 낚시 찌 & 파동 링
      const bobber = createLowPolyMesh(new THREE.DodecahedronGeometry(0.18, 0), '#ef4444', -2.8, -0.34, 0.0, false);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide, transparent: true, opacity: 0.82 });
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.8, 1.35, 24), ringMat);
      ring.rotation.x = -Math.PI * 0.5;
      ring.position.set(-2.8, -0.36, 0.0);

      grp.add(rack, post1, post2, basket, rod, bobber, ring);
      if (typeof worldGroup !== 'undefined' && worldGroup) worldGroup.add(grp);

      if (this.fishingLabel) {
        try { this.fishingLabel.remove(); } catch (e) {}
      }
      this.fishingLabel = (typeof createWorldLabel === 'function') ? createWorldLabel('') : null;
      this.fishingGroup = grp;
      this.fishingBobber = bobber;
      this.fishingRing = ring;
      this._fishingUnlockState = null;
      this.rebuildFishingSpotVisuals();
    },

    rebuildFishingSpotVisuals() {
      const unlocked = this.isActivityUnlocked('fishing');
      if (this._fishingUnlockState === unlocked) return;
      this._fishingUnlockState = unlocked;
      if (this.fishingRing && this.fishingRing.material) {
        this.fishingRing.material.color.setHex(unlocked ? 0xfacc15 : 0x64748b);
        this.fishingRing.material.opacity = unlocked ? 0.88 : 0.45;
      }
      if (this.fishingBobber && this.fishingBobber.material) {
        this.fishingBobber.material.color.setHex(unlocked ? 0xf97316 : 0x94a3b8);
      }
    },

    buildFarmSite() {
      const sp = ACTIVITY_SPOTS.farm;
      const fx = sp.pos.x, fz = sp.pos.z;
      const fy = (typeof getMiracleOpenWorldGroundHeight === 'function') ? getMiracleOpenWorldGroundHeight(fx, fz) : 0.25;

      const root = new THREE.Group();
      root.position.set(fx, fy, fz);

      // 밭 테두리 나무 울타리 낮음 (보행 막지 않음)
      const railCol = '#78350f';
      const soil = createLowPolyMesh(new THREE.BoxGeometry(9.4, 0.14, 7.0), '#6b4226', 0, 0.05, 0, false);
      const borderN = createLowPolyMesh(new THREE.BoxGeometry(9.7, 0.20, 0.22), railCol, 0, 0.14, -3.55, true);
      const borderS = createLowPolyMesh(new THREE.BoxGeometry(9.7, 0.20, 0.22), railCol, 0, 0.14,  3.55, true);
      const borderW = createLowPolyMesh(new THREE.BoxGeometry(0.22, 0.20, 7.2), railCol, -4.75, 0.14, 0, true);
      const borderE = createLowPolyMesh(new THREE.BoxGeometry(0.22, 0.20, 7.2), railCol,  4.75, 0.14, 0, true);
      root.add(soil, borderN, borderS, borderW, borderE);

      const modelGrp = new THREE.Group();
      root.add(modelGrp);
      if (typeof worldGroup !== 'undefined' && worldGroup) worldGroup.add(root);

      // 밭 양쪽 씨앗 수풀 2곳
      this.seedBushes = [];
      ACTIVITY_SPOTS.seed_bush.positions.forEach((bp, idx) => {
        const by = (typeof getMiracleOpenWorldGroundHeight === 'function') ? getMiracleOpenWorldGroundHeight(bp.x, bp.z) : 0.25;
        const bGrp = new THREE.Group();
        bGrp.position.set(bp.x, by, bp.z);
        for (let i = 0; i < 4; i++) {
          const ang = (i / 4) * Math.PI * 2;
          const leaf = createLowPolyMesh(new THREE.DodecahedronGeometry(0.48, 0), i % 2 === 0 ? '#15803d' : '#16a34a', Math.cos(ang) * 0.35, 0.36, Math.sin(ang) * 0.35, true);
          bGrp.add(leaf);
        }
        const berry = createLowPolyMesh(new THREE.DodecahedronGeometry(0.18, 0), '#facc15', 0, 0.65, 0, false);
        const sRing = new THREE.Mesh(
          new THREE.RingGeometry(1.15, 1.50, 20),
          new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide, transparent: true, opacity: 0.0 })
        );
        sRing.rotation.x = -Math.PI * 0.5;
        sRing.position.y = 0.09;
        bGrp.add(berry, sRing);
        if (typeof worldGroup !== 'undefined' && worldGroup) worldGroup.add(bGrp);
        this.seedBushes.push({ group: bGrp, ring: sRing, x: bp.x, z: bp.z, idx });
      });

      if (this.farmLabel) try { this.farmLabel.remove(); } catch (e) {}
      if (this.wellLabel) try { this.wellLabel.remove(); } catch (e) {}
      this.farmLabel = (typeof createWorldLabel === 'function') ? createWorldLabel('') : null;
      this.wellLabel = (typeof createWorldLabel === 'function') ? createWorldLabel('') : null;
      this.farmGroup = root;
      this.farmModelGroup = modelGrp;
      this._farmRenderSig = '';
      this.rebuildFarmVisuals();
    },

    rebuildFarmVisuals() {
      const mGrp = this.farmModelGroup;
      if (!mGrp) return;
      const unlocked = this.isActivityUnlocked('farm');
      const step = this.farm.step || 0;
      const sub = this.farm.subProgress || 0;
      const sig = `${unlocked}|${step}|${sub}|${this.farm.cycle}`;
      if (sig === this._farmRenderSig) return;
      this._farmRenderSig = sig;

      while (mGrp.children.length > 0) {
        const ch = mGrp.children[0];
        mGrp.remove(ch);
        _disposeObjSafe(ch);
      }
      this._farmWheatMeshes = [];

      // 이랑 3줄 바탕
      [-2.0, 0, 2.0].forEach(rz => {
        mGrp.add(createLowPolyMesh(new THREE.BoxGeometry(8.2, 0.10, 0.95), step >= 2 ? '#451a03' : '#78350f', 0, 0.14, rz, false));
      });

      if (step === 0) {
        // 1단계: 돌 골라내기 (남은 돌 개수 6 - sub * 2)
        const rockPts = [[-3.1, -2.0], [0.2, -1.9], [3.0, -2.0], [-2.5, 0.1], [1.4, 2.0], [-0.4, 2.0]];
        const rem = Math.max(0, 6 - sub * 2);
        for (let i = 0; i < rem; i++) {
          const [rx, rz] = rockPts[i];
          const geo = (typeof createIrregularFieldstoneGeo === 'function')
            ? createIrregularFieldstoneGeo(0.85, 0.56, 0.72, 200 + i * 17)
            : new THREE.DodecahedronGeometry(0.45, 0);
          mGrp.add(createLowPolyMesh(geo, i % 2 === 0 ? '#94a3b8' : '#78716c', rx, 0.34, rz, true));
        }
      } else if (step === 1) {
        // 2단계: 넝쿨 치우기 (남은 넝쿨 6 - sub * 2)
        const vinePts = [[-3.0, -2.0], [0.5, -2.0], [2.9, 0.0], [-2.2, 0.1], [-1.0, 2.0], [2.6, 2.0]];
        const rem = Math.max(0, 6 - sub * 2);
        for (let i = 0; i < rem; i++) {
          const [vx, vz] = vinePts[i];
          const knot = createLowPolyMesh(new THREE.TorusGeometry(0.44, 0.11, 5, 7), i % 2 === 0 ? '#166534' : '#3f6212', vx, 0.28, vz, false);
          knot.rotation.x = Math.PI * 0.45;
          knot.rotation.z = i * 0.8;
          mGrp.add(knot);
        }
      } else if (step === 2) {
        // 3~4단계: 씨앗 뿌리기 진행 표식
        const seededRows = Math.min(3, sub);
        for (let r = 0; r < seededRows; r++) {
          const rz = -2.0 + r * 2.0;
          for (let k = -3; k <= 3; k++) {
            mGrp.add(createLowPolyMesh(new THREE.DodecahedronGeometry(0.11, 0), '#fde047', k * 1.1, 0.24, rz, false));
          }
        }
      } else if (step === 3) {
        // 5단계: 물주기 (자라나는 초록 새싹 15개)
        const sproutH = 0.28 + sub * 0.14;
        [-2.0, 0, 2.0].forEach(rz => {
          for (let k = -2; k <= 2; k++) {
            const spr = createLowPolyMesh(new THREE.ConeGeometry(0.14, sproutH, 5), '#22c55e', k * 1.5, 0.18 + sproutH * 0.5, rz, false);
            mGrp.add(spr);
          }
        });
      } else if (step === 4) {
        // 황금 밀 수확 준비 완료!
        [-2.0, 0, 2.0].forEach((rz, ri) => {
          for (let k = -3; k <= 3; k++) {
            const stalk = createLowPolyMesh(new THREE.ConeGeometry(0.22, 1.15, 5), (k + ri) % 2 === 0 ? '#eab308' : '#facc15', k * 1.15, 0.72, rz, false);
            mGrp.add(stalk);
            this._farmWheatMeshes.push({ mesh: stalk, phase: (k + ri) * 0.7 });
          }
        });
      }
    },

    buildPastureSite() {
      const sp = ACTIVITY_SPOTS.pasture;
      const px = sp.pos.x, pz = sp.pos.z;
      const py = (typeof getMiracleOpenWorldGroundHeight === 'function') ? getMiracleOpenWorldGroundHeight(px, pz) : 0.25;

      const root = new THREE.Group();
      root.position.set(px, py, pz);

      const woodCol = '#78350f';
      const w = 11.2, d = 9.2;
      const addFenceSeg = (cx, cz, len, isZ) => {
        const g = new THREE.Group();
        const beam1 = createLowPolyMesh(new THREE.BoxGeometry(isZ ? 0.14 : len, 0.12, isZ ? len : 0.14), woodCol, 0, 0.92, 0, true);
        const beam2 = createLowPolyMesh(new THREE.BoxGeometry(isZ ? 0.14 : len, 0.12, isZ ? len : 0.14), woodCol, 0, 0.48, 0, true);
        g.add(beam1, beam2);
        const posts = Math.max(2, Math.round(len / 2.2) + 1);
        for (let i = 0; i < posts; i++) {
          const offset = -len * 0.5 + (i / (posts - 1)) * len;
          g.add(createLowPolyMesh(new THREE.CylinderGeometry(0.08, 0.10, 1.18, 5), '#5c3114', isZ ? 0 : offset, 0.59, isZ ? offset : 0, true));
        }
        g.position.set(cx, 0, cz);
        root.add(g);
      };
      // 북·남·동 울타리 + 서쪽 입구(z in [-2.5, +2.5]) 개방!
      addFenceSeg(0, -d * 0.5, w, false);
      addFenceSeg(0,  d * 0.5, w, false);
      addFenceSeg(w * 0.5, 0, d, true);
      addFenceSeg(-w * 0.5, -3.55, 2.1, true);
      addFenceSeg(-w * 0.5,  3.55, 2.1, true);

      // 건초 더미 & 물통
      const hay = createLowPolyMesh(new THREE.DodecahedronGeometry(1.15, 0), '#eab308', 3.4, 0.55, -2.5, true);
      hay.scale.set(1.2, 0.72, 1.0);
      const trough = createLowPolyMesh(new THREE.BoxGeometry(2.2, 0.45, 0.85), '#6b4226', -2.2, 0.22, -2.8, true);
      const troughWater = createLowPolyMesh(new THREE.BoxGeometry(1.9, 0.08, 0.62), '#0284c7', -2.2, 0.42, -2.8, false);
      root.add(hay, trough, troughWater);

      // 울타리 충돌 박스 (서쪽 문 개방 유지)
      if (typeof colliders !== 'undefined' && Array.isArray(colliders)) {
        colliders.push(
          { minX: px - w * 0.5, maxX: px + w * 0.5, minZ: pz - d * 0.5 - 0.35, maxZ: pz - d * 0.5 + 0.35 },
          { minX: px - w * 0.5, maxX: px + w * 0.5, minZ: pz + d * 0.5 - 0.35, maxZ: pz + d * 0.5 + 0.35 },
          { minX: px + w * 0.5 - 0.35, maxX: px + w * 0.5 + 0.35, minZ: pz - d * 0.5, maxZ: pz + d * 0.5 },
          { minX: px - w * 0.5 - 0.35, maxX: px - w * 0.5 + 0.35, minZ: pz - d * 0.5, maxZ: pz - 2.5 },
          { minX: px - w * 0.5 - 0.35, maxX: px - w * 0.5 + 0.35, minZ: pz + 2.5, maxZ: pz + d * 0.5 }
        );
      }
      if (typeof worldGroup !== 'undefined' && worldGroup) worldGroup.add(root);

      // 양 4마리 (젖양 2 · 털양 2)
      this.pastureSheep = [];
      const sheepSpecs = [
        { careKind: 'milk', rx: -2.2, rz:  1.4, collar: '#38bdf8' },
        { careKind: 'milk', rx:  1.6, rz: -0.6, collar: '#38bdf8' },
        { careKind: 'wool', rx: -1.0, rz: -1.8, collar: '#f43f5e' },
        { careKind: 'wool', rx:  2.4, rz:  2.0, collar: '#f43f5e' }
      ];
      sheepSpecs.forEach((ss, idx) => {
        const sx = px + ss.rx, sz = pz + ss.rz;
        const sy = (typeof getMiracleOpenWorldGroundHeight === 'function') ? getMiracleOpenWorldGroundHeight(sx, sz) : py;
        const sm = (typeof createLowPolyAnimalMesh === 'function')
          ? createLowPolyAnimalMesh('sheep', 1.05)
          : ((typeof window.createLowPolyAnimalMesh === 'function')
            ? window.createLowPolyAnimalMesh('sheep', 1.05)
            : new THREE.Group());
        const collar = createLowPolyMesh(new THREE.TorusGeometry(0.24, 0.05, 5, 8), ss.collar, 0, 0.78, 0.42, false);
        sm.add(collar);
        sm.position.set(sx, sy, sz);
        sm.rotation.y = idx * 1.4;
        if (typeof worldGroup !== 'undefined' && worldGroup) worldGroup.add(sm);
        this.pastureSheep.push({
          id: `sheep_${idx}`,
          careKind: ss.careKind,
          mesh: sm,
          homeX: sx,
          homeZ: sz,
          targetX: sx,
          targetZ: sz,
          cooldown: 0,
          waitTimer: idx * 0.7,
          phase: idx * 1.5
        });
      });

      if (this.pastureLabel) try { this.pastureLabel.remove(); } catch (e) {}
      this.pastureLabel = (typeof createWorldLabel === 'function') ? createWorldLabel('') : null;
      this.pastureGroup = root;
      this._pastureSig = '';
      this.rebuildPastureVisuals();
    },

    rebuildPastureVisuals() {
      const mOk = this.isActivityUnlocked('milk');
      const wOk = this.isActivityUnlocked('wool');
      const sig = `${mOk}|${wOk}`;
      this._pastureSig = sig;
    },

    buildCustomerNpcs() {
      this.customerNpcs = [];
      const specs = [
        { preset: 'woman',    idx: 5,  hx: -5.5, hz: -14.0 },
        { preset: 'villager', idx: 11, hx:  5.5, hz: -12.0 },
        { preset: 'child',    idx: 2,  hx:  4.5, hz:   6.0 }
      ];
      specs.forEach((sp, i) => {
        const gy = (typeof getMiracleOpenWorldGroundHeight === 'function') ? getMiracleOpenWorldGroundHeight(sp.hx, sp.hz) : 0.25;
        const mesh = (typeof window.createLowPolyPersonMesh === 'function')
          ? window.createLowPolyPersonMesh(sp.preset, sp.idx)
          : new THREE.Group();
        mesh.position.set(sp.hx, gy, sp.hz);
        if (typeof worldGroup !== 'undefined' && worldGroup) worldGroup.add(mesh);
        this.customerNpcs.push({
          mesh,
          homeX: sp.hx,
          homeZ: sp.hz,
          targetShopId: null,
          phase: i * 2.1,
          hopTimer: 0
        });
      });
    },

    updateCustomerNpcs(dt, now) {
      const econ = this.getEconomySummary();
      const stockedShops = SHOPS_ORDER.filter(sid => (econ.stockByShop[sid] || 0) > 0 && this.getBuildProgress(sid).completed);

      // 1) 재고 있는 상점마다 3.6초 주기로 NPC 손님 구매 확정 처리
      SHOPS_ORDER.forEach(sid => {
        if ((econ.stockByShop[sid] || 0) > 0 && this.getBuildProgress(sid).completed) {
          this._customerSaleTimers[sid] = (this._customerSaleTimers[sid] || 0) + dt;
          if (this._customerSaleTimers[sid] >= 3.6) {
            this._customerSaleTimers[sid] = 0;
            this.processNpcShopPurchase(sid);
          }
        } else {
          this._customerSaleTimers[sid] = 0;
        }
      });

      // 2) 3D 손님 NPC 상점 앞 이동 및 걷기 애니메이션
      this.customerNpcs.forEach((npc, idx) => {
        const assignedShop = stockedShops.length > 0 ? stockedShops[idx % stockedShops.length] : null;
        const tgt = assignedShop
          ? (PROJECTS[assignedShop].teleportPos || { x: npc.homeX, z: npc.homeZ })
          : { x: npc.homeX + Math.sin((now || 0) * 0.0007 + npc.phase) * 3.5, z: npc.homeZ + Math.cos((now || 0) * 0.0006 + npc.phase) * 3.5 };
        const dx = tgt.x - npc.mesh.position.x;
        const dz = tgt.z - npc.mesh.position.z;
        const d = Math.hypot(dx, dz);
        const speed = assignedShop ? 2.6 : 1.1;
        if (d > 0.35) {
          npc.mesh.position.x += (dx / d) * Math.min(d, speed * dt);
          npc.mesh.position.z += (dz / d) * Math.min(d, speed * dt);
          npc.mesh.position.y = (typeof getMiracleOpenWorldGroundHeight === 'function')
            ? getMiracleOpenWorldGroundHeight(npc.mesh.position.x, npc.mesh.position.z)
            : 0.25;
          npc.mesh.rotation.y = Math.atan2(dx, dz);
          if (typeof window.applyMiracleNpcLimbAnimation === 'function') {
            window.applyMiracleNpcLimbAnimation(npc.mesh, { speed, isMoving: true, strideFactor: 1.4, legAmp: 0.58, armAmp: 0.50 }, dt);
          }
        } else {
          if (assignedShop) {
            const sp = PROJECTS[assignedShop].pos;
            npc.mesh.rotation.y = Math.atan2(sp.x - npc.mesh.position.x, sp.z - npc.mesh.position.z);
          }
          if (typeof window.applyMiracleNpcLimbAnimation === 'function') {
            window.applyMiracleNpcLimbAnimation(npc.mesh, { speed: 0, isMoving: false, strideFactor: 1.4, legAmp: 0.58, armAmp: 0.50 }, dt);
          }
        }
      });
    },

    buildTempleSite() {
      const cx = 0.0, cz = 72.0;
      const by = (typeof getMiracleOpenWorldGroundHeight === 'function') ? getMiracleOpenWorldGroundHeight(cx, cz) : 0.25;
      const root = new THREE.Group();
      root.position.set(cx, by, cz);
      const modelGrp = new THREE.Group();
      root.add(modelGrp);
      if (typeof worldGroup !== 'undefined' && worldGroup) worldGroup.add(root);

      // 상설 [예루살렘 성전 건축 헌금함] (x=0, z=54)
      const ox = ACTIVITY_SPOTS.temple.offerPos.x;
      const oz = ACTIVITY_SPOTS.temple.offerPos.z;
      const oy = (typeof getMiracleOpenWorldGroundHeight === 'function') ? getMiracleOpenWorldGroundHeight(ox, oz) : 0.25;
      const boxGrp = new THREE.Group();
      boxGrp.position.set(ox, oy, oz);
      const ped = createLowPolyMesh(new THREE.BoxGeometry(1.45, 0.95, 1.05), '#d6cfc2', 0, 0.47, 0, true);
      const chest = createLowPolyMesh(new THREE.BoxGeometry(0.95, 0.56, 0.68), '#78350f', 0, 1.22, 0, true);
      const trim = createLowPolyMesh(new THREE.BoxGeometry(1.02, 0.14, 0.74), '#facc15', 0, 1.48, 0, false);
      const oRing = new THREE.Mesh(
        new THREE.RingGeometry(1.6, 2.05, 24),
        new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
      );
      oRing.rotation.x = -Math.PI * 0.5;
      oRing.position.y = 0.09;
      boxGrp.add(ped, chest, trim, oRing);
      if (typeof worldGroup !== 'undefined' && worldGroup) worldGroup.add(boxGrp);
      if (typeof colliders !== 'undefined' && Array.isArray(colliders)) {
        colliders.push({ minX: ox - 0.9, maxX: ox + 0.9, minZ: oz - 0.7, maxZ: oz + 0.7 });
      }

      if (this.templeLabel) try { this.templeLabel.remove(); } catch (e) {}
      if (this.templeOfferLabel) try { this.templeOfferLabel.remove(); } catch (e) {}
      this.templeLabel = (typeof createWorldLabel === 'function') ? createWorldLabel('') : null;
      this.templeOfferLabel = (typeof createWorldLabel === 'function') ? createWorldLabel('') : null;

      this.templeGroup = root;
      this.templeModelGroup = modelGrp;
      this.templeOfferBoxGroup = boxGrp;
      this.templeOfferRing = oRing;
      this.templeBuiltStage = -1;
      this.rebuildTempleVisuals();
    },

    rebuildTempleVisuals() {
      const mGrp = this.templeModelGroup;
      if (!mGrp) return;
      const econ = this.getEconomySummary();
      const stage = econ.templeStage;
      if (stage === this.templeBuiltStage) return;
      this.templeBuiltStage = stage;

      this._clearTempleDynamicColliders();
      this._templeFireProps = [];
      while (mGrp.children.length > 0) {
        const ch = mGrp.children[0];
        mGrp.remove(ch);
        _disposeObjSafe(ch);
      }

      const cSandBase   = '#dfc79e';
      const cSandDark   = '#cfa972';
      const cCourtWall  = '#ebd6b0';
      const cWhiteWarm  = '#f7f4ec';
      const cWhiteShade = '#e8e0d2';
      const cGoldMain   = '#eab308';
      const cGoldBright = '#facc15';
      const cBronze     = '#92400e';
      const cCrimson    = '#991b1b';
      const cDarkVoid   = '#23170f';

      const mkOrg = (target, w, h, d, col, x, y, z, seed, cast = true) => {
        const geo = (typeof createOrganicBoxGeo === 'function')
          ? createOrganicBoxGeo(w, h, d, seed, 0.032, 0.96, 2)
          : new THREE.BoxGeometry(w, h, d);
        const m = createLowPolyMesh(geo, col, x, y, z, cast);
        target.add(m);
        return m;
      };
      const pushCol = (cBox) => {
        if (typeof colliders !== 'undefined' && Array.isArray(colliders)) {
          colliders.push(cBox);
          this._templeDynColliders.push(cBox);
        }
      };

      // Stage 0: 예루살렘 성전 터 말뚝 & 설계 표지판
      if (stage === 0) {
        [[-8.2, -7.2], [8.2, -7.2], [-8.2, 7.2], [8.2, 7.2]].forEach(([px, pz]) => {
          mGrp.add(createLowPolyMesh(new THREE.CylinderGeometry(0.14, 0.18, 1.5, 6), '#a16207', px, 0.75, pz, true));
          mGrp.add(createLowPolyMesh(new THREE.DodecahedronGeometry(0.24, 0), cGoldBright, px, 1.60, pz, false));
        });
        const signTex = _drawCanvasLabelTexture('⛪ 예루살렘 성전 터', '헌금함(앞쪽)에 달란트를 모아 건축해요!', {
          bg: '#78350f', border: cGoldBright, titleFont: 'bold 28px "Malgun Gothic", sans-serif', subFont: 'bold 15px "Malgun Gothic", sans-serif'
        });
        const signMat = signTex ? new THREE.MeshBasicMaterial({ map: signTex }) : new THREE.MeshBasicMaterial({ color: 0xfef3c7 });
        const sb = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.0, 0.14), signMat);
        sb.position.set(0, 1.45, -7.8);
        mGrp.add(sb);
        return;
      }

      const by = (typeof getMiracleOpenWorldGroundHeight === 'function') ? getMiracleOpenWorldGroundHeight(0, 72) : 0.25;
      const gateY = (typeof getMiracleOpenWorldGroundHeight === 'function') ? getMiracleOpenWorldGroundHeight(0, 46) : 0.25;
      const staticGrp = new THREE.Group();

      // Stage 1+: 사암 기단 + 전면 돌계단 + 외곽 성문 (z=46 -> local z=-26, 중앙 [-2.6, +2.6] 개방!)
      mkOrg(staticGrp, 18.2, 1.25, 16.2, cSandBase, 0, 0.62, 0, 701);
      mkOrg(staticGrp, 15.6, 0.56, 13.6, cSandDark, 0, 1.48, 0.1, 702);
      for (let s = 0; s < 3; s++) {
        const sh = 0.40 * (s + 1);
        const sd = 2.6 - s * 0.68;
        mkOrg(staticGrp, 8.0 - s * 0.35, sh, sd, s % 2 === 0 ? cSandDark : cSandBase, 0, sh * 0.5, -8.5 + s * 0.34, 710 + s);
      }
      // 외곽 성문 기둥 (z=46 => local z = -26, y delta = gateY - by)
      const gz = -26.0, gyOff = gateY - by;
      [-4.0, 4.0].forEach((tx, idx) => {
        mkOrg(staticGrp, 2.55, 5.2, 2.55, cCourtWall, tx, gyOff + 2.6, gz, 610 + idx);
        mkOrg(staticGrp, 2.75, 0.44, 2.75, cSandDark, tx, gyOff + 5.34, gz, 614 + idx);
      });
      mkOrg(staticGrp, 6.0, 0.96, 1.90, cSandDark, 0, gyOff + 4.55, gz, 630);
      mkOrg(staticGrp, 3.3, 0.40, 2.02, cGoldMain, 0, gyOff + 4.58, gz, 631);
      [-7.4, 7.4].forEach((wx, idx) => {
        mkOrg(staticGrp, 4.5, 3.85, 1.65, cSandBase, wx, gyOff + 1.92, gz, 640 + idx);
      });
      pushCol({ minX: -11.8, maxX: -2.6, minZ: 42.4, maxZ: 47.8 });
      pushCol({ minX:   2.6, maxX: 11.8, minZ: 42.4, maxZ: 47.8 });
      pushCol({ minX: -9.3, maxX: 9.3, minZ: 72 - 8.2, maxZ: 72 + 8.3 });
      pushCol({ minX: -4.2, maxX: 4.2, minZ: 72 - 10.0, maxZ: 72 - 7.9 });

      // Stage 2+: 안뜰 성벽 + 아치 문틀 + 4모서리 망루
      if (stage >= 2) {
        const wH = 2.75, wT = 0.85;
        mkOrg(staticGrp, 5.5, wH, wT, cCourtWall, -4.7, 1.2 + wH * 0.5, -6.5, 720);
        mkOrg(staticGrp, 5.5, wH, wT, cCourtWall,  4.7, 1.2 + wH * 0.5, -6.5, 721);
        mkOrg(staticGrp, 4.4, 0.92, wT + 0.14, cSandDark, 0, 1.2 + wH - 0.35, -6.5, 722);
        mkOrg(staticGrp, 15.2, wH, wT, cCourtWall, 0, 1.2 + wH * 0.5, 6.5, 723);
        mkOrg(staticGrp, wT, wH, 13.0, cCourtWall, -7.3, 1.2 + wH * 0.5, 0, 724);
        mkOrg(staticGrp, wT, wH, 13.0, cCourtWall,  7.3, 1.2 + wH * 0.5, 0, 725);
        [[-7.3, -6.5], [7.3, -6.5], [-7.3, 6.5], [7.3, 6.5]].forEach(([tx, tz], idx) => {
          mkOrg(staticGrp, 2.35, 4.1, 2.35, cCourtWall, tx, 1.2 + 2.05, tz, 750 + idx);
          mkOrg(staticGrp, 2.55, 0.44, 2.55, cSandDark, tx, 1.2 + 4.18, tz, 755 + idx);
        });
      }

      // Stage 3+: 니카노르 성문 현관 + 순백색 성소 본관
      const sBaseY = 1.68, sH = 8.6;
      if (stage >= 3) {
        mkOrg(staticGrp, 5.6, 3.6, 1.75, cCourtWall, 0, 1.65 + 1.80, -2.55, 780);
        mkOrg(staticGrp, 6.1, 0.44, 2.05, cSandDark,  0, 1.65 + 3.72, -2.55, 781);
        mkOrg(staticGrp, 11.0, sH, 3.0, cWhiteWarm, 0, sBaseY + sH * 0.5, 0.15, 800);
        mkOrg(staticGrp,  9.6, sH, 6.0, cWhiteWarm, 0, sBaseY + sH * 0.5, 2.85, 801);
      }

      // Stage 4+: 황금 성소 포털 · 붉은 성소 휘장 · 야긴과 보아스 청동 기둥 · 외벽 조각 기둥
      if (stage >= 4) {
        mkOrg(staticGrp, 4.5, 6.2, 0.50, cWhiteShade, 0, sBaseY + 3.1, -1.28, 810);
        mkOrg(staticGrp, 4.8, 0.42, 0.62, cGoldMain,  0, sBaseY + 6.32, -1.32, 814);
        staticGrp.add(
          createLowPolyMesh(new THREE.BoxGeometry(3.2, 5.3, 0.18), cDarkVoid, 0, sBaseY + 2.65, -1.42, false),
          createLowPolyMesh(new THREE.BoxGeometry(1.75, 4.95, 0.18), cGoldMain, 0, sBaseY + 2.52, -1.52, true),
          createLowPolyMesh(new THREE.BoxGeometry(0.76, 5.15, 0.24), cCrimson, -1.16, sBaseY + 2.62, -1.60, true),
          createLowPolyMesh(new THREE.BoxGeometry(0.76, 5.15, 0.24), cCrimson,  1.16, sBaseY + 2.62, -1.60, true),
          createLowPolyMesh(new THREE.BoxGeometry(3.25, 0.56, 0.26), cCrimson, 0, sBaseY + 5.12, -1.62, true)
        );
        [-2.45, 2.45].forEach(px => {
          staticGrp.add(
            createLowPolyMesh(new THREE.CylinderGeometry(0.46, 0.54, 0.55, 8), cSandDark, px, sBaseY + 0.28, -1.68, true),
            createLowPolyMesh(new THREE.CylinderGeometry(0.32, 0.38, 5.4, 8), cBronze, px, sBaseY + 3.2, -1.68, true),
            createLowPolyMesh(new THREE.CylinderGeometry(0.56, 0.34, 0.72, 8), cGoldBright, px, sBaseY + 6.15, -1.68, true)
          );
        });
      }

      // Stage 5: 상단 이중 황금 프리즈 · 황금 왕관 뿔 · 성소 청동 화로 불꽃
      if (stage >= 5) {
        const topY = sBaseY + sH;
        mkOrg(staticGrp, 11.4, 0.58, 3.35, cGoldMain,   0, topY - 0.55, 0.15, 850);
        mkOrg(staticGrp, 10.0, 0.58, 6.25, cGoldMain,   0, topY - 0.55, 2.85, 851);
        mkOrg(staticGrp, 11.7, 0.34, 3.65, cGoldBright, 0, topY + 0.45, 0.15, 854);
        mkOrg(staticGrp, 10.3, 0.34, 6.55, cGoldBright, 0, topY + 0.45, 2.85, 855);
        const spikeGeo = new THREE.ConeGeometry(0.28, 0.80, 4);
        for (let i = -5; i <= 5; i++) {
          const sp = createLowPolyMesh(spikeGeo, cGoldBright, i * 1.02, topY + 0.98, -1.48, false);
          sp.rotation.y = Math.PI * 0.25;
          staticGrp.add(sp);
        }
        // 성문·성소 앞 타오르는 청동 화로 4기
        [
          { lx: -2.65, ly: gyOff + 1.15, lz: gz - 1.55, wx: -2.65, wy: gateY + 1.15, wz: 44.45 },
          { lx:  2.65, ly: gyOff + 1.15, lz: gz - 1.55, wx:  2.65, wy: gateY + 1.15, wz: 44.45 },
          { lx: -4.10, ly: 1.56,         lz: -9.20,     wx: -4.10, wy: by + 1.56,    wz: 62.80 },
          { lx:  4.10, ly: 1.56,         lz: -9.20,     wx:  4.10, wy: by + 1.56,    wz: 62.80 }
        ].forEach((b, idx) => {
          const bowl = createLowPolyMesh(new THREE.CylinderGeometry(0.36, 0.22, 0.42, 7), cBronze, b.lx, b.ly, b.lz, false);
          const flame = createLowPolyMesh(new THREE.ConeGeometry(0.24, 0.58, 5), '#f97316', b.lx, b.ly + 0.36, b.lz, false);
          flame.userData._emissiveGlow = true;
          staticGrp.add(bowl);
          mGrp.add(flame);
          this._templeFireProps.push({ mesh: flame, phase: idx * 1.1 });
          if (window.MiracleDayNight && typeof window.MiracleDayNight.registerNightLightSource === 'function') {
            window.MiracleDayNight.registerNightLightSource({
              pos: new THREE.Vector3(b.wx, b.wy, b.wz),
              yOffset: 0.45,
              color: 0xff8c2b,
              intensity: 2.4,
              distance: 16.0,
              phase: idx * 1.1,
              isActive: () => Boolean(window.MiracleDayNight && window.MiracleDayNight.nightFactor > 0.12)
            });
          }
        });
      }

      const wallStartT = (typeof wallMeshes !== 'undefined' && Array.isArray(wallMeshes)) ? wallMeshes.length : 0;
      if (typeof mergeStaticLowPolyGroupToVertexColor === 'function') {
        mergeStaticLowPolyGroupToVertexColor(staticGrp, { registerWall: true, castShadow: true });
      }
      if (typeof wallMeshes !== 'undefined' && Array.isArray(wallMeshes)) {
        for (let wi = wallStartT; wi < wallMeshes.length; wi++) {
          this._templeDynWallMeshes.push(wallMeshes[wi]);
        }
      }
      mGrp.add(staticGrp);
    },

    buildDecorationsRoot() {
      if (this.decorRootGroup && typeof worldGroup !== 'undefined' && worldGroup) {
        worldGroup.remove(this.decorRootGroup);
      }
      const root = new THREE.Group();
      if (typeof worldGroup !== 'undefined' && worldGroup) worldGroup.add(root);
      this.decorRootGroup = root;
      this._decorBuiltSig = '';
      this.rebuildDecorationsVisuals();
    },

    rebuildDecorationsVisuals() {
      const root = this.decorRootGroup;
      if (!root) return;
      const sig = DECOR_ORDER.map(d => (this.decorations[d] ? '1' : '0')).join(',');
      if (sig === this._decorBuiltSig) return;
      this._decorBuiltSig = sig;

      this._clearDecorDynamicColliders();
      this.decorBraziers = [];
      this.decorFountainDrops = [];
      this.decorFountainGroup = null;
      while (root.children.length > 0) {
        const ch = root.children[0];
        root.remove(ch);
        _disposeObjSafe(ch);
      }

      const pushDecorCol = (cBox) => {
        if (typeof colliders !== 'undefined' && Array.isArray(colliders)) {
          colliders.push(cBox);
          this._decorDynColliders.push(cBox);
        }
      };

      // 1) 따뜻한 마을 화로 거리 (6기)
      if (this.decorations.decor_braziers) {
        [[-7.2, -18.0], [7.2, -18.0], [-7.2, -6.0], [7.2, -6.0], [-7.2, 6.0], [7.2, 6.0]].forEach(([bx, bz], idx) => {
          const by = (typeof getMiracleOpenWorldGroundHeight === 'function') ? getMiracleOpenWorldGroundHeight(bx, bz) : 0.25;
          if (typeof window.createTempleBrazierProp === 'function') {
            const br = window.createTempleBrazierProp(0.92);
            br.group.position.set(bx, by, bz);
            root.add(br.group);
            this.decorBraziers.push({ prop: br, phase: idx * 0.9 });
          } else {
            const bGrp = new THREE.Group();
            bGrp.position.set(bx, by, bz);
            const ped = createLowPolyMesh(new THREE.CylinderGeometry(0.32, 0.42, 0.85, 6), '#d6cbb5', 0, 0.42, 0, false);
            const flm = createLowPolyMesh(new THREE.ConeGeometry(0.26, 0.56, 5), '#f97316', 0, 1.15, 0, false);
            bGrp.add(ped, flm);
            root.add(bGrp);
            this.decorBraziers.push({ flameMesh: flm, phase: idx * 0.9 });
          }
          pushDecorCol({ minX: bx - 0.5, maxX: bx + 0.5, minZ: bz - 0.5, maxZ: bz + 0.5 });
          if (window.MiracleDayNight && typeof window.MiracleDayNight.registerNightLightSource === 'function') {
            window.MiracleDayNight.registerNightLightSource({
              pos: new THREE.Vector3(bx, by, bz),
              yOffset: 1.35,
              color: 0xff8c2b,
              intensity: 2.2,
              distance: 15.0,
              phase: idx * 0.9,
              isActive: () => Boolean(window.MiracleDayNight && window.MiracleDayNight.nightFactor > 0.10)
            });
          }
        });
      }

      // 2) 갈릴리 꽃길 정원 (중앙 가로수/꽃밭 24송이 군락)
      if (this.decorations.decor_flowers) {
        const flowerCols = ['#f43f5e', '#facc15', '#a855f7', '#fb923c', '#38bdf8', '#ec4899'];
        const fGrp = new THREE.Group();
        for (let i = 0; i < 12; i++) {
          const z = -22.0 + i * 3.1;
          [-5.6, 5.6].forEach((fx, sideIdx) => {
            const fy = (typeof getMiracleOpenWorldGroundHeight === 'function') ? getMiracleOpenWorldGroundHeight(fx, z) : 0.25;
            const bed = createLowPolyMesh(new THREE.DodecahedronGeometry(0.42, 0), '#15803d', fx, fy + 0.14, z, false);
            bed.scale.set(1.3, 0.55, 1.3);
            fGrp.add(bed);
            for (let k = 0; k < 3; k++) {
              const col = flowerCols[(i + k + sideIdx) % flowerCols.length];
              const ox = ((k - 1) * 0.26);
              const oz = ((k % 2) * 0.24 - 0.12);
              fGrp.add(createLowPolyMesh(new THREE.DodecahedronGeometry(0.14, 0), col, fx + ox, fy + 0.36, z + oz, false));
            }
          });
        }
        root.add(fGrp);
      }

      // 3) 은혜의 광장 쉼터 분수 (x=0, z=3.0 · 양옆 5m+ 도로 보행 완전 개방)
      if (this.decorations.decor_fountain) {
        const fx = 0.0, fz = 3.0;
        const fy = (typeof getMiracleOpenWorldGroundHeight === 'function') ? getMiracleOpenWorldGroundHeight(fx, fz) : 0.25;
        const ftn = new THREE.Group();
        ftn.position.set(fx, fy, fz);
        ftn.add(
          createLowPolyMesh(new THREE.CylinderGeometry(1.95, 2.15, 0.45, 10), '#e2e8f0', 0, 0.22, 0, true),
          createLowPolyMesh(new THREE.CylinderGeometry(1.70, 1.70, 0.12, 10), '#0ea5e9', 0, 0.42, 0, false),
          createLowPolyMesh(new THREE.CylinderGeometry(0.35, 0.48, 1.35, 8), '#cbd5e1', 0, 0.90, 0, true),
          createLowPolyMesh(new THREE.CylinderGeometry(0.85, 0.52, 0.32, 8), '#e2e8f0', 0, 1.55, 0, true),
          createLowPolyMesh(new THREE.CylinderGeometry(0.18, 0.24, 0.72, 6), '#cbd5e1', 0, 2.02, 0, false)
        );
        for (let d = 0; d < 6; d++) {
          const drop = createLowPolyMesh(new THREE.DodecahedronGeometry(0.10, 0), '#7dd3fc', 0, 2.45, 0, false);
          ftn.add(drop);
          this.decorFountainDrops.push({ mesh: drop, angle: (d / 6) * Math.PI * 2, phase: d * 0.9 });
        }
        [-2.8, 2.8].forEach((bx, bi) => {
          const bench = createLowPolyMesh(new THREE.BoxGeometry(0.55, 0.40, 1.65), '#78350f', bx, 0.20, 0, true);
          ftn.add(bench);
        });
        root.add(ftn);
        this.decorFountainGroup = ftn;
        pushDecorCol({ minX: fx - 2.0, maxX: fx + 2.0, minZ: fz - 2.0, maxZ: fz + 2.0 });
      }

      // 4) 기쁨의 마을 축제 파티장 (x=+16.5, z=-4.0)
      if (this.decorations.decor_party) {
        const px = 16.5, pz = -4.0;
        const py = (typeof getMiracleOpenWorldGroundHeight === 'function') ? getMiracleOpenWorldGroundHeight(px, pz) : 0.25;
        const pGrp = new THREE.Group();
        pGrp.position.set(px, py, pz);
        pGrp.add(createLowPolyMesh(new THREE.BoxGeometry(9.2, 0.08, 8.2), '#fef3c7', 0, 0.04, 0, false));
        const corners = [[-4.2, -3.7], [4.2, -3.7], [-4.2, 3.7], [4.2, 3.7]];
        corners.forEach(([cx, cz]) => {
          pGrp.add(createLowPolyMesh(new THREE.CylinderGeometry(0.10, 0.12, 3.6, 6), '#78350f', cx, 1.8, cz, true));
          const lan = createLowPolyMesh(new THREE.DodecahedronGeometry(0.22, 0), '#fde047', cx, 3.65, cz, false);
          lan.userData._emissiveGlow = true;
          pGrp.add(lan);
        });
        // 대각선 만국기 가랜드
        const flagCols = ['#ef4444', '#facc15', '#22c55e', '#38bdf8', '#a855f7'];
        for (let fi = 0; fi < 7; fi++) {
          const t = -0.78 + fi * 0.26;
          const sag = (1 - t * t) * -0.45;
          const col1 = flagCols[fi % flagCols.length];
          const col2 = flagCols[(fi + 2) % flagCols.length];
          const f1 = createLowPolyMesh(new THREE.ConeGeometry(0.18, 0.34, 3), col1, t * 4.2, 3.45 + sag, t * 3.7, false);
          f1.rotation.z = Math.PI;
          const f2 = createLowPolyMesh(new THREE.ConeGeometry(0.18, 0.34, 3), col2, t * 4.2, 3.45 + sag, -t * 3.7, false);
          f2.rotation.z = Math.PI;
          pGrp.add(f1, f2);
        }
        // 중앙 잔칫상 & 과일·빵·포도주스 잔 & 의자 2개
        pGrp.add(
          createLowPolyMesh(new THREE.BoxGeometry(3.2, 0.72, 1.35), '#854d0e', 0, 0.40, 0, true),
          createLowPolyMesh(new THREE.BoxGeometry(3.0, 0.06, 1.15), '#f8fafc', 0, 0.78, 0, false),
          createLowPolyMesh(new THREE.DodecahedronGeometry(0.24, 0), '#d97706', -0.8, 0.94, 0, false),
          createLowPolyMesh(new THREE.DodecahedronGeometry(0.20, 0), '#ef4444',  0.0, 0.92, 0.15, false),
          createLowPolyMesh(new THREE.CylinderGeometry(0.10, 0.08, 0.26, 6), '#facc15', 0.85, 0.94, -0.1, false),
          createLowPolyMesh(new THREE.BoxGeometry(2.6, 0.38, 0.45), '#78350f', 0, 0.19, -1.25, true),
          createLowPolyMesh(new THREE.BoxGeometry(2.6, 0.38, 0.45), '#78350f', 0, 0.19,  1.25, true)
        );
        root.add(pGrp);
        pushDecorCol({ minX: px - 1.6, maxX: px + 1.6, minZ: pz - 0.75, maxZ: pz + 0.75 });
      }
    },

    updateBulletinBoardTexture() {
      const cv = this.bulletinCanvas;
      if (!cv) return;
      const doneCnt = this.getUnlockedFootprintCount();
      const totalCnt = this.getTotalActiveFootprints();
      const econ = this.getEconomySummary();
      const topNews = this.news.slice(0, 3);
      const sig = `${doneCnt}|${econ.availableTalents}|${econ.templePct}|${topNews.map(n => n.id).join(',')}`;
      if (sig === this._bulletinSig) return;
      this._bulletinSig = sig;

      const ctx = cv.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#fffbeb';
      ctx.fillRect(0, 0, 512, 320);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(0, 0, 512, 60);
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 6;
      ctx.strokeRect(3, 3, 506, 314);

      ctx.fillStyle = '#fef3c7';
      ctx.font = 'bold 25px "Malgun Gothic", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`📌 [${this.roomId}] 마을 소식판`, 18, 40);

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 17px "Malgun Gothic", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`완공 ${doneCnt}/${totalCnt} · 🪙${econ.availableTalents} · ⛪${econ.templePct}%`, 494, 38);

      ctx.textAlign = 'left';
      if (topNews.length === 0) {
        ctx.fillStyle = '#475569';
        ctx.font = 'bold 20px "Malgun Gothic", sans-serif';
        ctx.fillText('🌿 반석 위의 집과 상점 4곳을 지어 보세요!', 26, 128);
        ctx.fillText('🪙 상점 수익으로 성전 건축·마을 꾸미기 시작!', 26, 165);
        ctx.fillStyle = '#0369a1';
        ctx.fillText('📖 첫 번째 소식이 여기에 기록됩니다.', 26, 218);
      } else {
        topNews.forEach((n, idx) => {
          const y = 104 + idx * 66;
          ctx.fillStyle = idx % 2 === 0 ? '#fef3c7' : '#f1f5f9';
          ctx.fillRect(16, y - 28, 480, 54);
          ctx.fillStyle = '#1e293b';
          ctx.font = 'bold 18px "Malgun Gothic", sans-serif';
          const line = `${n.icon || '💬'} ${n.text || ''}`;
          ctx.fillText(line.length > 29 ? line.slice(0, 28) + '…' : line, 26, y + 5);
        });
      }
      if (this.bulletinTexture) this.bulletinTexture.needsUpdate = true;
    },

    updateAllWorldLabels() {
      const econ = this.getEconomySummary();
      if (this.houseLabel) {
        const pr = this.getBuildProgress('rock_house');
        this.houseLabel.innerHTML = pr.completed
          ? '🏠✨ [완공] 대형 2층 반석 위의 집 (계단·실내 입장!)'
          : `🏗️ [협동] 반석 위의 집 (🪨${pr.stone}/${pr.stoneReq} · 🪵${pr.wood}/${pr.woodReq})`;
      }
      SHOPS_ORDER.forEach(sid => {
        const ref = this.shopRefs[sid];
        const proj = PROJECTS[sid];
        if (!ref || !ref.label || !proj) return;
        const pr = this.getBuildProgress(sid);
        const good = GOODS_META[SHOP_TO_GOOD[sid]];
        const stock = econ.stockByShop[sid] || 0;
        ref.label.innerHTML = pr.completed
          ? `✅ ${proj.icon} ${proj.name} · 진열 ${good.icon}${stock}개 (개당 🪙${good.price})`
          : `🏗️ [${proj.name} 터] 🪵${pr.wood}/${pr.woodReq} · 🪨${pr.stone}/${pr.stoneReq}`;
      });
      if (this.fishingLabel) {
        this.fishingLabel.innerHTML = this.isActivityUnlocked('fishing')
          ? '🎣 [갈릴리 낚시터] 물고기 낚기!'
          : '🔒 [갈릴리 낚시터] 생선 가게 완공 시 해금';
      }
      if (this.farmLabel) {
        const stInfo = FARM_STEPS[this.farm.step || 0] || FARM_STEPS[0];
        this.farmLabel.innerHTML = this.isActivityUnlocked('farm')
          ? `🌱 [우물 5단계 농사] ${stInfo.icon} ${stInfo.label}`
          : '🔒 [5단계 농사 밭] 곡물 가게 완공 시 해금';
      }
      if (this.wellLabel) {
        this.wellLabel.innerHTML = this.isActivityUnlocked('well')
          ? `💧 [야곱의 우물] 농사 물 긷기 (보유 ${this.bag.waterBucket}/${this.maxCarryWater})`
          : '💧 야곱의 우물';
      }
      if (this.pastureLabel) {
        const mOk = this.isActivityUnlocked('milk');
        const wOk = this.isActivityUnlocked('wool');
        if (!mOk && !wOk) {
          this.pastureLabel.innerHTML = '🔒 [갈릴리 양떼 목장] 양젖/옷가게 완공 시 해금';
        } else {
          this.pastureLabel.innerHTML = `🐑 [양떼 목장] ${mOk ? '🥛양젖 ' : ''}${wOk ? '🧶양털' : ''} 채집 가능!`;
        }
      }
      if (this.templeLabel) {
        this.templeLabel.innerHTML = econ.templeCompleted
          ? '⛪✨ [완공] 예루살렘 성전 (5/5단계)'
          : `⛪ [성전 건축 터 ${econ.templeStage}/5단계] 🪙${econ.offeredToTemple}/${TEMPLE_TARGET_TALENTS} 달란트`;
      }
      if (this.templeOfferLabel) {
        this.templeOfferLabel.innerHTML = econ.templeCompleted
          ? '⛪✨ 성전 건축 완공 기념 헌금함'
          : `🪙 [성전 헌금함] 보유 공동기금 ${econ.availableTalents} 달란트 봉헌하기`;
      }
    },

    findNearestActionTarget() {
      if (typeof playerPos === 'undefined' || !playerPos) return null;
      // 1) 중앙 게시판 근접 우선 (4.5m 이내)
      const dBull = Math.hypot(playerPos.x - BULLETIN_POS.x, playerPos.z - BULLETIN_POS.z);
      if (dBull < 4.5) {
        return { kind: 'bulletin', dist: dBull };
      }
      // 2) 미완공 1단계 건물 건축 재료 전달
      if (this.bag.wood > 0 || this.bag.stone > 0) {
        let bestBuild = null;
        let bestBD = Infinity;
        for (let i = 0; i < PROJECT_ORDER.length; i++) {
          const pid = PROJECT_ORDER[i];
          const proj = PROJECTS[pid];
          const pr = this.getBuildProgress(pid);
          if (pr.completed) continue;
          const canAddWood = this.bag.wood > 0 && pr.wood < pr.woodReq;
          const canAddStone = this.bag.stone > 0 && pr.stone < pr.stoneReq;
          if (!canAddWood && !canAddStone) continue;
          const d = Math.hypot(playerPos.x - proj.pos.x, playerPos.z - proj.pos.z);
          if (d < (proj.deliverRadius || 7.0) && d < bestBD) {
            bestBD = d;
            bestBuild = { kind: 'deliver_build', buildId: pid, project: proj, dist: d };
          }
        }
        if (bestBuild) return bestBuild;
      }
      // 3) 완공된 상점 앞 상품 납품 (양젖/물고기/밀단/양털)
      for (let i = 0; i < SHOPS_ORDER.length; i++) {
        const sid = SHOPS_ORDER[i];
        const proj = PROJECTS[sid];
        const pr = this.getBuildProgress(sid);
        const goodId = SHOP_TO_GOOD[sid];
        const qty = this.bag[goodId] || 0;
        if (!pr.completed || qty <= 0) continue;
        const d = Math.hypot(playerPos.x - proj.pos.x, playerPos.z - proj.pos.z);
        if (d < (proj.deliverRadius || 6.4)) {
          return { kind: 'deliver_goods', shopId: sid, goodId, project: proj, good: GOODS_META[goodId], qty, dist: d };
        }
      }
      // 4) 예루살렘 성전 헌금함 (0, 54)
      const oPos = ACTIVITY_SPOTS.temple.offerPos;
      const dOffer = Math.hypot(playerPos.x - oPos.x, playerPos.z - oPos.z);
      if (dOffer < 5.5) {
        const econ = this.getEconomySummary();
        return {
          kind: 'offer_temple',
          availableTalents: econ.availableTalents,
          templeCompleted: econ.templeCompleted,
          canOffer: econ.availableTalents > 0 && !econ.templeCompleted,
          dist: dOffer
        };
      }
      // 5) 갈릴리 선착장 낚시터 (-94, -68)
      const fPos = ACTIVITY_SPOTS.fishing.pos;
      const dFish = Math.hypot(playerPos.x - fPos.x, playerPos.z - fPos.z);
      if (dFish < 5.5) {
        return { kind: 'fish_spot', unlocked: this.isActivityUnlocked('fishing'), hits: this.fishingHits || 0, dist: dFish };
      }
      // 6) 야곱의 우물 물 긷기 (-32, -12)
      const wPos = ACTIVITY_SPOTS.well.pos;
      const dWell = Math.hypot(playerPos.x - wPos.x, playerPos.z - wPos.z);
      if (dWell < 5.5) {
        return { kind: 'draw_water', unlocked: this.isActivityUnlocked('well'), dist: dWell };
      }
      // 7) 씨앗 수풀 (밭 step===2 & 보유 씨앗 여유)
      if (this.isActivityUnlocked('seed_bush') && (this.farm.step || 0) === 2 && this.bag.seed < this.maxCarrySeed) {
        for (let i = 0; i < ACTIVITY_SPOTS.seed_bush.positions.length; i++) {
          const bp = ACTIVITY_SPOTS.seed_bush.positions[i];
          const db = Math.hypot(playerPos.x - bp.x, playerPos.z - bp.z);
          if (db < 3.6) {
            return { kind: 'find_seed', bushPos: bp, dist: db };
          }
        }
      }
      // 8) 5단계 농사 밭 (-32, 4)
      const fmPos = ACTIVITY_SPOTS.farm.pos;
      const dFarm = Math.hypot(playerPos.x - fmPos.x, playerPos.z - fmPos.z);
      if (dFarm < 6.0) {
        return { kind: 'farm_plot', unlocked: this.isActivityUnlocked('farm'), step: this.farm.step || 0, subProgress: this.farm.subProgress || 0, dist: dFarm };
      }
      // 9) 양떼 목장 양 돌보기
      let bestSheep = null;
      let bestSD = 3.8;
      for (let i = 0; i < this.pastureSheep.length; i++) {
        const sh = this.pastureSheep[i];
        if (!sh || !sh.mesh) continue;
        const d = Math.hypot(playerPos.x - sh.mesh.position.x, playerPos.z - sh.mesh.position.z);
        if (d < bestSD) {
          bestSD = d;
          bestSheep = { kind: 'sheep_care', sheep: sh, careKind: sh.careKind, unlocked: this.isActivityUnlocked(sh.careKind), dist: d };
        }
      }
      if (bestSheep) return bestSheep;
      return null;
    },

    updateFrame(dt, now) {
      if (typeof playerPos === 'undefined' || !playerPos) return;
      const tNow = now || 0;
      if (this.houseLabel && typeof updateWorldLabelPos === 'function') {
        const p = PROJECTS.rock_house.pos;
        const sy = (typeof getMiracleOpenWorldGroundHeight === 'function') ? getMiracleOpenWorldGroundHeight(p.x, p.z) : 0.25;
        const dist = Math.hypot(playerPos.x - p.x, playerPos.z - p.z);
        updateWorldLabelPos(this.houseLabel, new THREE.Vector3(p.x, sy + 2.6, p.z), dist < 34.0);
      }
      SHOPS_ORDER.forEach(sid => {
        const ref = this.shopRefs[sid];
        if (!ref) return;
        const dist = Math.hypot(playerPos.x - ref.pos.x, playerPos.z - ref.pos.z);
        if (ref.label && typeof updateWorldLabelPos === 'function') {
          updateWorldLabelPos(ref.label, ref.pos, dist < 24.0);
        }
        if (ref.npc && dist < 8.0) {
          const ang = Math.atan2(playerPos.x - ref.pos.x, playerPos.z - ref.pos.z) - (PROJECTS[sid].yaw || 0);
          ref.npc.rotation.y = (typeof lerpAngle === 'function') ? lerpAngle(ref.npc.rotation.y, ang, dt * 6.0) : ang;
        }
      });
      if (this.bulletinLabel && typeof updateWorldLabelPos === 'function') {
        const by = (typeof getMiracleOpenWorldGroundHeight === 'function') ? getMiracleOpenWorldGroundHeight(BULLETIN_POS.x, BULLETIN_POS.z) : 0.25;
        const dist = Math.hypot(playerPos.x - BULLETIN_POS.x, playerPos.z - BULLETIN_POS.z);
        updateWorldLabelPos(this.bulletinLabel, new THREE.Vector3(BULLETIN_POS.x, by + 3.2, BULLETIN_POS.z), dist < 22.0);
      }

      // 낚시터 찌 찰랑임 & 라벨
      if (this.fishingBobber) {
        this.fishingBobber.position.y = -0.34 + Math.sin(tNow * 0.004) * 0.05;
      }
      if (this.fishingLabel && typeof updateWorldLabelPos === 'function') {
        const fp = ACTIVITY_SPOTS.fishing.pos;
        const dist = Math.hypot(playerPos.x - fp.x, playerPos.z - fp.z);
        updateWorldLabelPos(this.fishingLabel, new THREE.Vector3(fp.x - 1.0, 2.1, fp.z), dist < 24.0);
      }

      // 5단계 밭 · 씨앗 수풀 반짝임 · 야곱의 우물 라벨
      if (this.farmLabel && typeof updateWorldLabelPos === 'function') {
        const fm = ACTIVITY_SPOTS.farm.pos;
        const fy = (typeof getMiracleOpenWorldGroundHeight === 'function') ? getMiracleOpenWorldGroundHeight(fm.x, fm.z) : 0.25;
        const dist = Math.hypot(playerPos.x - fm.x, playerPos.z - fm.z);
        updateWorldLabelPos(this.farmLabel, new THREE.Vector3(fm.x, fy + 2.5, fm.z), dist < 26.0);
      }
      if (this.wellLabel && typeof updateWorldLabelPos === 'function') {
        const wp = ACTIVITY_SPOTS.well.pos;
        const wy = (typeof getMiracleOpenWorldGroundHeight === 'function') ? getMiracleOpenWorldGroundHeight(wp.x, wp.z) : 0.25;
        const dist = Math.hypot(playerPos.x - wp.x, playerPos.z - wp.z);
        updateWorldLabelPos(this.wellLabel, new THREE.Vector3(wp.x, wy + 3.8, wp.z), dist < 22.0);
      }
      const needSeedHighlight = this.isActivityUnlocked('seed_bush') && (this.farm.step || 0) === 2 && this.bag.seed < this.maxCarrySeed;
      this.seedBushes.forEach(sb => {
        if (sb.ring && sb.ring.material) {
          sb.ring.material.opacity = needSeedHighlight ? (0.55 + Math.sin(tNow * 0.006 + sb.idx) * 0.25) : 0.0;
        }
      });
      this._farmWheatMeshes.forEach(wm => {
        if (wm && wm.mesh) wm.mesh.rotation.z = Math.sin(tNow * 0.003 + wm.phase) * 0.08;
      });

      // 양떼 목장 양 배회 & 쿨다운·양털 복구
      if (this.pastureLabel && typeof updateWorldLabelPos === 'function') {
        const pp = ACTIVITY_SPOTS.pasture.pos;
        const py = (typeof getMiracleOpenWorldGroundHeight === 'function') ? getMiracleOpenWorldGroundHeight(pp.x, pp.z) : 0.25;
        const dist = Math.hypot(playerPos.x - pp.x, playerPos.z - pp.z);
        updateWorldLabelPos(this.pastureLabel, new THREE.Vector3(pp.x, py + 2.8, pp.z), dist < 26.0);
      }
      this.pastureSheep.forEach(sh => {
        if (sh.cooldown > 0) {
          sh.cooldown = Math.max(0, sh.cooldown - dt);
          if (sh.cooldown <= 0 && sh.careKind === 'wool' && sh.mesh && sh.mesh.children && sh.mesh.children[0]) {
            sh.mesh.children[0].scale.setScalar(1.0);
          }
        }
        if (sh.mesh) {
          const dx = sh.targetX - sh.mesh.position.x;
          const dz = sh.targetZ - sh.mesh.position.z;
          const d = Math.hypot(dx, dz);
          if (d > 0.22) {
            sh.mesh.position.x += (dx / d) * Math.min(d, 0.9 * dt);
            sh.mesh.position.z += (dz / d) * Math.min(d, 0.9 * dt);
            sh.mesh.position.y = (typeof getMiracleOpenWorldGroundHeight === 'function')
              ? getMiracleOpenWorldGroundHeight(sh.mesh.position.x, sh.mesh.position.z)
              : 0.25;
            sh.mesh.rotation.y = Math.atan2(dx, dz);
            const u = sh.mesh.userData || {};
            const sw = Math.sin(tNow * 0.008 + sh.phase) * 0.35;
            if (u.flLeg) u.flLeg.rotation.x = sw;
            if (u.frLeg) u.frLeg.rotation.x = -sw;
            if (u.blLeg) u.blLeg.rotation.x = -sw;
            if (u.brLeg) u.brLeg.rotation.x = sw;
          } else {
            const u = sh.mesh.userData || {};
            if (u.flLeg) u.flLeg.rotation.x *= 0.85;
            if (u.frLeg) u.frLeg.rotation.x *= 0.85;
            if (u.blLeg) u.blLeg.rotation.x *= 0.85;
            if (u.brLeg) u.brLeg.rotation.x *= 0.85;
            sh.waitTimer -= dt;
            if (sh.waitTimer <= 0) {
              sh.waitTimer = 2.0 + Math.random() * 2.5;
              sh.targetX = sh.homeX + (Math.random() - 0.5) * 2.4;
              sh.targetZ = sh.homeZ + (Math.random() - 0.5) * 2.2;
            }
          }
        }
      });

      // 성전 & 헌금함 라벨 & 성전 화로 불꽃
      if (this.templeLabel && typeof updateWorldLabelPos === 'function') {
        const tp = ACTIVITY_SPOTS.temple.pos;
        const ty = (typeof getMiracleOpenWorldGroundHeight === 'function') ? getMiracleOpenWorldGroundHeight(tp.x, tp.z) : 0.25;
        const dist = Math.hypot(playerPos.x - tp.x, playerPos.z - tp.z);
        updateWorldLabelPos(this.templeLabel, new THREE.Vector3(tp.x, ty + 8.5, tp.z), dist < 44.0);
      }
      if (this.templeOfferLabel && typeof updateWorldLabelPos === 'function') {
        const op = ACTIVITY_SPOTS.temple.offerPos;
        const oy = (typeof getMiracleOpenWorldGroundHeight === 'function') ? getMiracleOpenWorldGroundHeight(op.x, op.z) : 0.25;
        const dist = Math.hypot(playerPos.x - op.x, playerPos.z - op.z);
        updateWorldLabelPos(this.templeOfferLabel, new THREE.Vector3(op.x, oy + 2.4, op.z), dist < 24.0);
      }
      this._templeFireProps.forEach(tf => {
        if (tf && tf.mesh) {
          tf.mesh.scale.set(1, 1 + Math.sin(tNow * 0.008 + tf.phase) * 0.16, 1);
        }
      });

      // 마을 꾸미기 화로 & 분수 물방울 애니메이션
      this.decorBraziers.forEach(db => {
        if (db.prop && typeof db.prop.setLit === 'function') {
          db.prop.setLit(true, tNow, db.phase);
        } else if (db.flameMesh) {
          db.flameMesh.scale.set(1, 1 + Math.sin(tNow * 0.008 + db.phase) * 0.16, 1);
        }
      });
      this.decorFountainDrops.forEach(fd => {
        if (!fd.mesh) return;
        const cycle = ((tNow * 0.0014 + fd.phase) % 1.0);
        const rad = 0.22 + cycle * 0.92;
        fd.mesh.position.set(Math.cos(fd.angle) * rad, 2.35 + Math.sin(cycle * Math.PI) * 0.72 - cycle * 1.15, Math.sin(fd.angle) * rad);
      });

      // 마을 손님 NPC 구매 루프
      this.updateCustomerNpcs(dt, tNow);
    },

    teleportToActivity(targetId) {
      const target = (targetId === 'bulletin')
        ? BULLETIN_POS
        : (PROJECTS[targetId] || ACTIVITY_SPOTS[targetId] || DECORATIONS[targetId]);
      if (!target) return;
      if (PROJECTS[targetId]) this.activeFocusBuildId = targetId;
      const tp = target.teleportPos || target.offerPos || target.pos || { x: 0, z: -12 };
      const ty = (typeof getMiracleOpenWorldGroundHeight === 'function') ? getMiracleOpenWorldGroundHeight(tp.x, tp.z) : 0.25;
      if (typeof playerPos !== 'undefined' && playerPos) {
        playerPos.set(tp.x, ty, tp.z);
        if (typeof playerGroup !== 'undefined' && playerGroup) playerGroup.position.copy(playerPos);
        if (typeof snapCameraToPlayer === 'function') snapCameraToPlayer();
      }
      this.closeJournalModal();
      this.closeBulletinModal();
      if (window.MiracleMultiplayer && typeof window.MiracleMultiplayer.syncHUD === 'function') {
        window.MiracleMultiplayer.syncHUD();
      }
      if (typeof playSfx === 'function') playSfx('jump');
      if (typeof showToast === 'function') {
        showToast(targetId === 'bulletin'
          ? '📌 마을 중앙 게시판 앞으로 이동했어요!'
          : `📍 ${target.icon || '📌'} [${target.name}] 현장으로 이동했어요!`);
      }
    },

    teleportToProject(targetId) {
      this.teleportToActivity(targetId);
    },

    // =========================================================================
    // [마을 일지] 4탭 공유 모달 & 중앙 게시판 모달
    // =========================================================================
    ensureModals() {
      let jModal = document.getElementById('mp-village-journal-modal');
      if (!jModal) {
        jModal = document.createElement('div');
        jModal.id = 'mp-village-journal-modal';
        jModal.style.zIndex = '142';
        jModal.className = 'hidden pointer-events-auto fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4';
        jModal.innerHTML = `
          <div class="mp-journal-card mc-card modal-scroll w-full max-w-3xl rounded-3xl p-3 sm:p-5 flex flex-col gap-2.5 max-h-[90dvh] overflow-hidden">
            <div class="mp-journal-header flex items-center justify-between gap-2 border-b-2 border-amber-300 pb-2 shrink-0">
              <div class="flex items-center gap-2 min-w-0">
                <span class="text-2xl shrink-0">📖</span>
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-1.5">
                    <h2 class="font-jua text-base sm:text-xl text-amber-950 leading-none">마을 일지</h2>
                    <span id="mp-journal-room-pill" class="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-950 font-jua text-[10px]">광릉내1방</span>
                    <span id="mp-journal-prog-pill" class="px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 font-jua text-[11px]">0 / 10 완공</span>
                    <span id="mp-journal-talents-pill" class="px-2 py-0.5 rounded-full bg-yellow-300 text-amber-950 font-jua text-[11px]">🪙 0 달란트</span>
                    <span id="mp-journal-save-pill" class="px-2 py-0.5 rounded-full bg-sky-100 text-sky-900 font-bold text-[10px]">💾 자동 저장</span>
                  </div>
                  <p class="mp-journal-sub text-[11px] text-slate-600 mt-0.5 truncate">방 친구들이 함께 지어가는 우리 성경 마을의 실시간 공동 기록판이에요!</p>
                </div>
              </div>
              <button type="button" onclick="window.MiracleMpVillage.closeJournalModal()"
                      class="mc-btn px-3 py-1 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-jua text-xs shrink-0">닫기 ✕</button>
            </div>

            <div id="mp-journal-tabs" class="mp-journal-tabs flex flex-wrap gap-1.5 shrink-0">
              <button type="button" data-vtab="coop" onclick="window.MiracleMpVillage.openJournalModal('coop')" class="mc-btn px-2.5 py-1 rounded-xl font-jua text-xs">📋 오늘의 협동</button>
              <button type="button" data-vtab="footprints" onclick="window.MiracleMpVillage.openJournalModal('footprints')" class="mc-btn px-2.5 py-1 rounded-xl font-jua text-xs">🏘️ 마을 발자취</button>
              <button type="button" data-vtab="service" onclick="window.MiracleMpVillage.openJournalModal('service')" class="mc-btn px-2.5 py-1 rounded-xl font-jua text-xs">🎒 나의 섬김</button>
              <button type="button" data-vtab="news" onclick="window.MiracleMpVillage.openJournalModal('news')" class="mc-btn px-2.5 py-1 rounded-xl font-jua text-xs">💬 실시간 마을 소식</button>
            </div>

            <div id="mp-journal-body" class="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2.5 text-left"></div>
          </div>
        `;
        document.body.appendChild(jModal);
      }

      let bModal = document.getElementById('mp-bulletin-modal');
      if (!bModal) {
        bModal = document.createElement('div');
        bModal.id = 'mp-bulletin-modal';
        bModal.style.zIndex = '143';
        bModal.className = 'hidden pointer-events-auto fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4';
        bModal.innerHTML = `
          <div class="mc-card modal-scroll w-full max-w-xl rounded-3xl p-4 sm:p-5 flex flex-col gap-3 max-h-[88dvh] overflow-hidden">
            <div class="flex items-center justify-between gap-2 border-b-2 border-amber-300 pb-2 shrink-0">
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-xl">📌</span>
                  <h2 class="font-jua text-base sm:text-xl text-amber-950 truncate">마을 중앙 게시판</h2>
                  <span id="mp-bulletin-talents-pill" class="px-2 py-0.5 rounded-full bg-amber-300 text-amber-950 font-jua text-[11px]">🪙 0 달란트</span>
                </div>
                <p id="mp-bulletin-sub" class="text-[11px] text-slate-600 mt-0.5 truncate">마을 친구들의 따끈한 소식과 공동 목표 현황판이에요!</p>
              </div>
              <button type="button" onclick="window.MiracleMpVillage.closeBulletinModal()"
                      class="mc-btn px-3 py-1 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-jua text-xs shrink-0">닫기 ✕</button>
            </div>
            <div id="mp-bulletin-body" class="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2 text-left"></div>
            <div class="flex items-center justify-between gap-2 pt-1 shrink-0">
              <span id="mp-bulletin-save-text" class="text-[11px] font-bold text-sky-800">💾 자동 저장됨</span>
              <button type="button" onclick="window.MiracleMpVillage.closeBulletinModal(); window.MiracleMpVillage.openJournalModal('coop');"
                      class="mc-btn px-4 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-jua text-xs sm:text-sm">📖 마을 일지 전체 열기</button>
            </div>
          </div>
        `;
        document.body.appendChild(bModal);
      }
      return { jModal, bModal };
    },

    openJournalModal(tabKey) {
      const mapped = (tabKey === 'all' || !tabKey) ? (this.currentJournalTab || 'coop') : tabKey;
      this.currentJournalTab = ['coop', 'footprints', 'service', 'news'].includes(mapped) ? mapped : 'coop';
      if (typeof setHudMenuOpen === 'function') setHudMenuOpen(false);
      const { jModal } = this.ensureModals();
      if (!jModal) return;
      if (typeof playSfx === 'function') playSfx('switch');
      jModal.classList.remove('hidden');
      if (typeof window.syncOverlayModalBodyClass === 'function') window.syncOverlayModalBodyClass();
      this.renderJournalContent();
    },

    closeJournalModal() {
      const jModal = document.getElementById('mp-village-journal-modal');
      if (jModal) jModal.classList.add('hidden');
      if (typeof window.syncOverlayModalBodyClass === 'function') window.syncOverlayModalBodyClass();
    },

    openBulletinModal() {
      if (typeof setHudMenuOpen === 'function') setHudMenuOpen(false);
      const { bModal } = this.ensureModals();
      if (!bModal) return;
      if (typeof playSfx === 'function') playSfx('switch');
      bModal.classList.remove('hidden');
      if (typeof window.syncOverlayModalBodyClass === 'function') window.syncOverlayModalBodyClass();
      this.renderBulletinContent();
    },

    closeBulletinModal() {
      const bModal = document.getElementById('mp-bulletin-modal');
      if (bModal) bModal.classList.add('hidden');
      if (typeof window.syncOverlayModalBodyClass === 'function') window.syncOverlayModalBodyClass();
    },

    refreshOpenModalsIfVisible() {
      const jModal = document.getElementById('mp-village-journal-modal');
      if (jModal && !jModal.classList.contains('hidden')) this.renderJournalContent();
      const bModal = document.getElementById('mp-bulletin-modal');
      if (bModal && !bModal.classList.contains('hidden')) this.renderBulletinContent();
    },

    renderJournalContent() {
      const jModal = document.getElementById('mp-village-journal-modal');
      if (!jModal) return;
      const econ = this.getEconomySummary();
      const roomPill = document.getElementById('mp-journal-room-pill');
      const progPill = document.getElementById('mp-journal-prog-pill');
      const talPill = document.getElementById('mp-journal-talents-pill');
      const savePill = document.getElementById('mp-journal-save-pill');
      const tabsEl = document.getElementById('mp-journal-tabs');
      const bodyEl = document.getElementById('mp-journal-body');

      if (roomPill) roomPill.textContent = `🏠 ${this.roomId}`;
      if (progPill) progPill.textContent = `${this.getUnlockedFootprintCount()} / ${this.getTotalActiveFootprints()} 완공`;
      if (talPill) talPill.textContent = `🪙 ${econ.availableTalents} 달란트`;
      if (savePill) savePill.textContent = this.getSyncStatusText();

      if (tabsEl) {
        Array.from(tabsEl.querySelectorAll('button[data-vtab]')).forEach(btn => {
          const isAct = btn.dataset.vtab === this.currentJournalTab;
          btn.className = isAct
            ? 'mc-btn px-2.5 py-1 rounded-xl font-jua text-xs bg-amber-500 text-slate-950 shadow'
            : 'mc-btn px-2.5 py-1 rounded-xl font-jua text-xs bg-amber-100 hover:bg-amber-200 text-amber-950';
        });
      }
      if (!bodyEl) return;

      if (this.currentJournalTab === 'coop') {
        const templeCard = `
          <div class="p-3 rounded-2xl ${econ.templeCompleted ? 'bg-amber-50 border-2 border-amber-400' : 'bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300'} shadow-sm flex flex-col gap-1.5">
            <div class="flex items-center justify-between gap-2">
              <div class="min-w-0">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="font-jua text-sm sm:text-base text-amber-950">⛪ 예루살렘 성전 건축</span>
                  <span class="px-2 py-0.5 rounded-full ${econ.templeCompleted ? 'bg-emerald-200 text-emerald-950' : 'bg-amber-300 text-amber-950'} font-jua text-[10px]">
                    ${econ.templeCompleted ? '✅ 5/5단계 완공!' : `${econ.templeStage}/5단계 (${econ.templePct}%)`}
                  </span>
                </div>
                <p class="text-[11px] text-slate-700">상점 수입 공동기금 🪙<b>${econ.availableTalents} 달란트</b> 보유 · 헌금 누적 🪙<b>${econ.offeredToTemple}/${TEMPLE_TARGET_TALENTS}</b></p>
              </div>
              <div class="flex items-center gap-1 shrink-0">
                ${(!econ.templeCompleted && econ.availableTalents > 0) ? `<button type="button" data-offer-temple="all" onclick="window.MiracleMpVillage.offerTalentsToTemple()" class="mc-btn px-2.5 py-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-jua text-xs">🪙 헌금</button>` : ''}
                <button type="button" data-tp-activity="temple" onclick="window.MiracleMpVillage.teleportToActivity('temple')" class="mc-btn px-2.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-jua text-xs">📍 이동</button>
              </div>
            </div>
            <div class="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
              <div class="h-full bg-gradient-to-r from-amber-400 to-yellow-500" style="width:${econ.templePct}%"></div>
            </div>
          </div>
        `;

        const decorRows = DECOR_ORDER.map(did => {
          const d = DECORATIONS[did];
          const owned = Boolean(this.decorations[did]);
          const canBuy = !owned && econ.availableTalents >= d.cost;
          return `
            <div class="p-2.5 rounded-2xl ${owned ? 'bg-emerald-50 border-2 border-emerald-400' : 'bg-white border-2 border-amber-200'} flex items-center justify-between gap-2">
              <div class="min-w-0">
                <div class="flex items-center gap-1.5">
                  <span class="font-jua text-xs sm:text-sm text-amber-950">${d.icon} ${d.name}</span>
                  <span class="px-1.5 py-0.5 rounded-full font-jua text-[10px] ${owned ? 'bg-emerald-200 text-emerald-950' : 'bg-amber-100 text-amber-900'}">
                    ${owned ? '✅ 설치됨' : `🪙 ${d.cost}`}
                  </span>
                </div>
                <p class="text-[10px] text-slate-600 truncate">${d.desc}</p>
              </div>
              <div class="flex items-center gap-1 shrink-0">
                ${owned
                  ? `<button type="button" onclick="window.MiracleMpVillage.teleportToActivity('${did}')" class="mc-btn px-2 py-1 rounded-xl bg-amber-300 text-slate-950 font-jua text-[11px]">📍 이동</button>`
                  : `<button type="button" data-buy-decor="${did}" onclick="window.MiracleMpVillage.purchaseDecoration('${did}')" class="mc-btn px-2 py-1 rounded-xl ${canBuy ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950' : 'bg-slate-200 text-slate-500'} font-jua text-[11px]">🪙 설치</button>`}
              </div>
            </div>
          `;
        }).join('');

        const farmStepInfo = FARM_STEPS[this.farm.step || 0] || FARM_STEPS[0];
        const gatheringCard = `
          <div class="p-3 rounded-2xl bg-sky-50 border-2 border-sky-200 space-y-2">
            <div class="flex items-center justify-between gap-2 flex-wrap">
              <span class="font-jua text-sm text-sky-950">🌾 2단계 자원 채집 & 상점 진열 현황</span>
              <span class="text-[11px] font-bold text-amber-900">총 상점 수익 🪙${econ.totalEarned} 달란트</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-xs">
              <div class="p-2 rounded-xl bg-white border border-sky-200 flex items-center justify-between gap-1">
                <div><div class="font-jua text-sky-950">🎣 선착장 낚시</div><div class="text-[10px] text-slate-600">${this.isActivityUnlocked('fishing') ? `진열 🐟${econ.stockByShop.shop_fish}개` : '🔒 생선가게 필요'}</div></div>
                <button type="button" onclick="window.MiracleMpVillage.teleportToActivity('fishing')" class="mc-btn px-2 py-1 rounded-lg bg-sky-200 text-sky-950 font-jua text-[10px]">📍 이동</button>
              </div>
              <div class="p-2 rounded-xl bg-white border border-sky-200 flex items-center justify-between gap-1">
                <div><div class="font-jua text-emerald-950">🌱 5단계 농사</div><div class="text-[10px] text-slate-600">${this.isActivityUnlocked('farm') ? farmStepInfo.label : '🔒 곡물가게 필요'}</div></div>
                <button type="button" onclick="window.MiracleMpVillage.teleportToActivity('farm')" class="mc-btn px-2 py-1 rounded-lg bg-emerald-200 text-emerald-950 font-jua text-[10px]">📍 이동</button>
              </div>
              <div class="p-2 rounded-xl bg-white border border-sky-200 flex items-center justify-between gap-1">
                <div><div class="font-jua text-amber-950">🐑 양떼 목장</div><div class="text-[10px] text-slate-600">${this.isActivityUnlocked('pasture') ? `🥛${econ.stockByShop.shop_milk} · 🧶${econ.stockByShop.shop_cloth}` : '🔒 양젖/옷가게'}</div></div>
                <button type="button" onclick="window.MiracleMpVillage.teleportToActivity('pasture')" class="mc-btn px-2 py-1 rounded-lg bg-amber-200 text-amber-950 font-jua text-[10px]">📍 이동</button>
              </div>
            </div>
          </div>
        `;

        const buildCards = PROJECT_ORDER.map(pid => {
          const proj = PROJECTS[pid];
          const pr = this.getBuildProgress(pid);
          const statusBadge = pr.completed
            ? '<span class="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-950 font-jua text-[10px]">✅ 완공 완료!</span>'
            : `<span class="px-2 py-0.5 rounded-full bg-amber-200 text-amber-950 font-jua text-[10px]">진행 ${pr.pct}%</span>`;
          return `
            <div class="p-2.5 rounded-2xl ${pr.completed ? 'bg-emerald-50/90 border-2 border-emerald-400' : 'bg-white border-2 border-amber-300'} shadow-sm flex flex-col gap-1">
              <div class="flex items-center justify-between gap-2">
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="font-jua text-sm text-amber-950">${proj.icon} ${proj.name}</span>
                    ${statusBadge}
                  </div>
                  <p class="text-[10px] text-slate-600 truncate">${proj.desc}</p>
                </div>
                <button type="button" data-tp-project="${pid}" onclick="window.MiracleMpVillage.teleportToProject('${pid}')"
                        class="mc-btn px-2.5 py-1 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-jua text-xs shrink-0">📍 현장 이동</button>
              </div>
              <div class="flex items-center gap-3 text-[11px] font-jua">
                <span class="text-amber-800">🪵 나무 ${pr.wood}/${pr.woodReq}</span>
                <span class="text-slate-700">🪨 돌 ${pr.stone}/${pr.stoneReq}</span>
              </div>
              <div class="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                <div class="h-full ${pr.completed ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-400 to-emerald-400'}" style="width:${pr.pct}%"></div>
              </div>
            </div>
          `;
        }).join('');

        bodyEl.innerHTML = `
          ${templeCard}
          <div class="p-2.5 rounded-2xl bg-amber-50/70 border border-amber-300 space-y-1.5">
            <div class="font-jua text-xs sm:text-sm text-amber-950">🎨 공동기금 마을 꾸미기 (보유 🪙${econ.availableTalents} 달란트)</div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">${decorRows}</div>
          </div>
          ${gatheringCard}
          <div class="space-y-1.5">${buildCards}</div>
        `;
      } else if (this.currentJournalTab === 'footprints') {
        const activeSel = this.selectedFootprintId;
        const getMetaForFootprint = (fid) => PROJECTS[fid] || (fid === 'temple' ? TEMPLE_META : DECORATIONS[fid]);
        const cards = FOOTPRINT_ORDER.map(fid => {
          const item = getMetaForFootprint(fid);
          if (!item) return '';
          const fp = this.footprints[fid];
          if (fp) {
            const isExpanded = (activeSel === fid);
            return `
              <button type="button" data-fp-card="${fid}" onclick="window.MiracleMpVillage.selectFootprint('${fid}')"
                      class="w-full text-left p-3 rounded-2xl bg-amber-50 hover:bg-amber-100/80 border-2 ${isExpanded ? 'border-emerald-500 ring-2 ring-emerald-300' : 'border-amber-400'} shadow-sm transition">
                <div class="flex items-center justify-between gap-2 mb-1">
                  <span class="font-jua text-sm text-amber-950">${item.icon} ${item.name}</span>
                  <span class="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-950 font-jua text-[10px]">📖 ${item.verseRef}</span>
                </div>
                <p class="text-xs text-slate-700">${item.note}</p>
                ${isExpanded ? `
                  <div class="mt-2 p-2.5 rounded-xl bg-white border border-amber-300 text-xs text-slate-800 space-y-1">
                    <div class="font-jua text-emerald-800">📜 ${item.verseRef}</div>
                    <div class="leading-relaxed">${item.verseText}</div>
                    <div class="text-[10px] text-slate-500 pt-0.5">🙌 [${this.roomId}] 친구들과 함께 달성 (${fp.completedBy || '우리 방'})</div>
                  </div>
                ` : '<div class="text-[10px] font-bold text-amber-700 mt-1">👆 눌러서 성경 말씀과 완료 기념 문구 보기</div>'}
              </button>
            `;
          }
          return `
            <div class="p-3 rounded-2xl bg-slate-100 border-2 border-slate-300 opacity-80">
              <div class="flex items-center justify-between gap-2 mb-0.5">
                <span class="font-jua text-sm text-slate-600">🔒 ${item.icon} ${item.name}</span>
                <span class="px-2 py-0.5 rounded-full bg-slate-300 text-slate-700 font-jua text-[10px]">함께 도전 중</span>
              </div>
              <p class="text-[11px] text-slate-500">우리 방 친구들과 완성하면 기념 카드와 성경 말씀이 해금돼요!</p>
            </div>
          `;
        }).join('');

        bodyEl.innerHTML = `<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">${cards}</div>`;
      } else if (this.currentJournalTab === 'service') {
        const st = this.getMyStats();
        const bagItems = [
          { icon: '🪵', name: '나무', val: `${this.bag.wood}/${this.maxCarryWood}` },
          { icon: '🪨', name: '돌', val: `${this.bag.stone}/${this.maxCarryStone}` },
          { icon: '🐟', name: '물고기', val: `${this.bag.fish}/${this.maxCarryGoods}` },
          { icon: '🌾', name: '밀단', val: `${this.bag.wheat}/${this.maxCarryGoods}` },
          { icon: '🥛', name: '양젖', val: `${this.bag.milk}/${this.maxCarryGoods}` },
          { icon: '🧶', name: '양털', val: `${this.bag.wool}/${this.maxCarryGoods}` },
          { icon: '🌱', name: '씨앗', val: `${this.bag.seed}/${this.maxCarrySeed}` },
          { icon: '💧', name: '우물물', val: `${this.bag.waterBucket}/${this.maxCarryWater}` }
        ];
        const bagHtml = bagItems.map(bi => `
          <div class="p-2 rounded-xl bg-amber-50 border border-amber-300 text-center">
            <div class="text-lg leading-none">${bi.icon}</div>
            <div class="font-jua text-[11px] text-amber-950 mt-0.5">${bi.name}</div>
            <div class="font-jua text-xs text-emerald-800">${bi.val}</div>
          </div>
        `).join('');

        const praiseHtml = PRAISE_BADGES.map(pb => {
          const earned = Boolean(pb.check(st));
          return `
            <div class="p-2.5 rounded-2xl border-2 ${earned ? 'bg-amber-50 border-amber-400' : 'bg-slate-100 border-slate-200 opacity-75'}">
              <div class="flex items-center justify-between gap-1">
                <span class="font-jua text-xs text-amber-950">${pb.icon} ${pb.title}</span>
                <span class="px-1.5 py-0.5 rounded-full font-jua text-[9px] ${earned ? 'bg-emerald-200 text-emerald-950' : 'bg-slate-200 text-slate-600'}">
                  ${earned ? '획득!' : '도전 가능'}
                </span>
              </div>
              <p class="text-[10px] text-slate-600 mt-0.5">${pb.desc}</p>
            </div>
          `;
        }).join('');

        bodyEl.innerHTML = `
          <div class="p-3 rounded-2xl bg-white border-2 border-amber-300">
            <div class="font-jua text-sm text-amber-950 mb-2">🎒 내 가방</div>
            <div class="grid grid-cols-4 sm:grid-cols-8 gap-1.5">${bagHtml}</div>
          </div>
          <div class="p-3 rounded-2xl bg-emerald-50/90 border-2 border-emerald-300 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div class="font-jua text-sm text-emerald-950">🙌 ${st.name}님의 섬김 기록 (경쟁 없이 모두가 주인공!)</div>
              <div class="text-xs text-slate-700 mt-0.5">
                건축 <b>${st.actions.build}회</b> (🪵${st.totalWoodContrib}·🪨${st.totalStoneContrib}) · 낚시 <b>${st.actions.fish}</b> · 농사 <b>${st.actions.farm}</b> · 목축 <b>${st.actions.livestock}</b> · 납품 <b>${st.totalGoodsDelivered}개</b> · 성전헌금 <b>🪙${st.offeredTalents}</b>
              </div>
            </div>
          </div>
          <div class="p-3 rounded-2xl bg-white border-2 border-amber-200">
            <div class="font-jua text-sm text-amber-950 mb-2">🏅 나의 분야별 칭찬 배지 (${PRAISE_BADGES.filter(pb => pb.check(st)).length}/${PRAISE_BADGES.length})</div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">${praiseHtml}</div>
          </div>
        `;
      } else {
        if (!this.news || this.news.length === 0) {
          bodyEl.innerHTML = `
            <div class="p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-center text-sm font-jua text-amber-900">
              💬 아직 소식이 없어요! 나무·돌을 쌓거나 물건을 납품해 첫 소식을 만들어 보세요!
            </div>
          `;
        } else {
          bodyEl.innerHTML = this.news.map(n => `
            <div class="p-2.5 rounded-2xl bg-white border border-amber-300 flex items-center justify-between gap-2 shadow-sm">
              <div class="flex items-center gap-2 min-w-0">
                <span class="text-lg shrink-0">${n.icon || '💬'}</span>
                <span class="text-xs sm:text-sm font-bold text-slate-800">${n.text}</span>
              </div>
              <span class="text-[10px] text-slate-500 whitespace-nowrap shrink-0">${this._formatRelativeTime(n.ts)}</span>
            </div>
          `).join('');
        }
      }
    },

    selectFootprint(pid) {
      this.selectedFootprintId = (this.selectedFootprintId === pid) ? null : pid;
      if (typeof playSfx === 'function') playSfx('switch');
      this.renderJournalContent();
    },

    _formatRelativeTime(ts) {
      if (!ts) return '방금 전';
      const diff = Math.max(0, Math.floor((Date.now() - ts) / 1000));
      if (diff < 15) return '방금 전';
      if (diff < 60) return `${diff}초 전`;
      const mins = Math.floor(diff / 60);
      if (mins < 60) return `${mins}분 전`;
      return `${Math.floor(mins / 60)}시간 전`;
    },

    renderBulletinContent() {
      const econ = this.getEconomySummary();
      const tPill = document.getElementById('mp-bulletin-talents-pill');
      const sTxt = document.getElementById('mp-bulletin-save-text');
      const body = document.getElementById('mp-bulletin-body');
      if (tPill) tPill.textContent = `🪙 ${econ.availableTalents} 달란트 (누적 ${econ.totalEarned})`;
      if (sTxt) sTxt.textContent = this.getSyncStatusText();
      if (!body) return;

      const buildChips = PROJECT_ORDER.map(pid => {
        const p = PROJECTS[pid], pr = this.getBuildProgress(pid);
        return `<span class="px-2 py-0.5 rounded-full text-[11px] font-jua ${pr.completed ? 'bg-emerald-200 text-emerald-950' : 'bg-amber-100 text-amber-950'}">${p.icon} ${p.name} ${pr.completed ? '완료' : pr.pct + '%'}</span>`;
      }).join('');
      const templeChip = `<span class="px-2 py-0.5 rounded-full text-[11px] font-jua ${econ.templeCompleted ? 'bg-yellow-300 text-amber-950' : 'bg-sky-100 text-sky-950'}">⛪ 성전 ${econ.templeStage}/5 (${econ.templePct}%)</span>`;
      const decorChips = DECOR_ORDER.map(did => {
        const d = DECORATIONS[did];
        const ok = Boolean(this.decorations[did]);
        return `<span class="px-2 py-0.5 rounded-full text-[10px] font-jua ${ok ? 'bg-emerald-200 text-emerald-950' : 'bg-slate-200 text-slate-600'}">${d.icon} ${ok ? '완성' : d.cost + '🪙'}</span>`;
      }).join('');

      const newsList = (this.news.length === 0)
        ? '<div class="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-center text-xs font-jua text-amber-900">🌿 아직 등록된 마을 소식이 없어요. 건축·낚시·농사·납품으로 첫 소식을 만들어 보세요!</div>'
        : this.news.map(n => `
          <div class="p-2 rounded-xl bg-white border border-amber-200 flex items-center justify-between gap-2">
            <span class="text-xs font-bold text-slate-800">${n.icon || '💬'} ${n.text}</span>
            <span class="text-[10px] text-slate-500 shrink-0">${this._formatRelativeTime(n.ts)}</span>
          </div>
        `).join('');

      body.innerHTML = `
        <div class="p-2.5 rounded-2xl bg-amber-50/90 border border-amber-300 flex flex-wrap gap-1.5">${buildChips}${templeChip}${decorChips}</div>
        <div class="space-y-1.5">${newsList}</div>
      `;
    }
  };

  window.MiracleMpVillage = MiracleMpVillage;
})();
