// =========================================================================
// [ep4_multiplayer.js] 에피소드 4 오픈월드 전용 온라인 멀티플레이 & 협동 미션 1 (반석 위의 집 확장형)
// - 에피소드 4 완료 시 해금 · 캐릭터 선택(예수님·천사 제외) · 방 코드 입장
// - BroadcastChannel / localStorage 즉시 동기화 + 선택적 Firebase Realtime DB 온라인 릴레이 지원
// - 멀티플레이 미션 1: 반석 위의 집 확장형 (돌 20 + 나무 20, 도끼질 5회 / 돌 캐기 5회, 완료 시 말씀 출력)
// =========================================================================
window.__GAME_BUILD_VERSIONS__ = window.__GAME_BUILD_VERSIONS__ || {};
window.__GAME_BUILD_VERSIONS__.ep4_mp = '3.12.6';

// [선택적 온라인 릴레이 설정] 무료 Firebase Realtime Database URL을 넣으면 서로 다른 기기 간 실시간 온라인 접속!
// 예: window.MP_FIREBASE_DB_URL = 'https://your-church-game-default-rtdb.asia-southeast1.firebasedatabase.app';
window.MP_FIREBASE_DB_URL = window.MP_FIREBASE_DB_URL || 'https://gwangneung-bible-game-default-rtdb.asia-southeast1.firebasedatabase.app/';

// 멀티플레이 선택 가능 캐릭터 13종 (베드로·야고보·요한 및 온라인 전용 대원 포함 · 예수님/천사 제외 · 실제 3D 의상 색상 일치)
const MP_FORBIDDEN_PRESETS = ['jesus', 'angel'];
const MP_SELECTABLE_CHARACTERS = [
  { id: 'hero',       preset: 'hero',       idx: 0, icon: '🧭', name: '갈릴리 탐험가',   desc: '청록 망토 · 아이보리 튜닉',   palette: { skyTop: '#3e648c', skyBot: '#5782ab', body: '#efe9d8', accent: '#1e6f7d', hair: '#4a3222' } },
  { id: 'pathfinder', preset: 'pathfinder', idx: 0, icon: '🏕️', name: '패스파인더 대원', desc: '파란 반팔 · 노란 스카프',     palette: { skyTop: '#355a82', skyBot: '#4c79a8', body: '#2563eb', accent: '#facc15', hair: '#261910' } },
  { id: 'adventurer', preset: 'adventurer', idx: 0, icon: '⭐', name: '어드벤처러 대원', desc: '노란 반팔 · 자주 스카프',     palette: { skyTop: '#3c5e84', skyBot: '#567ea8', body: '#facc15', accent: '#b91c1c', hair: '#3b2314' } },
  { id: 'peter',      preset: 'peter',      idx: 0, icon: '⚓', name: '베드로',          desc: '청록 바다색 로브 · 황토 숄',  palette: { skyTop: '#385d82', skyBot: '#527ca6', body: '#46768e', accent: '#b26c2d', hair: '#533522' } },
  { id: 'james',      preset: 'james',      idx: 0, icon: '⛵', name: '야고보',          desc: '올리브 로브 · 베이지 숄',     palette: { skyTop: '#3e6486', skyBot: '#5882a6', body: '#7c8f52', accent: '#e2d3b3', hair: '#6b4328' } },
  { id: 'john',       preset: 'john',       idx: 0, icon: '❤️', name: '요한',            desc: '테라코타 로브 · 아이보리 숄', palette: { skyTop: '#45668a', skyBot: '#5e83a8', body: '#b35a40', accent: '#e8ddc4', hair: '#8c5e3a' } },
  { id: 'disciple_1', preset: 'disciple',   idx: 1, icon: '🎣', name: '어부 제자',       desc: '올리브 로브 · 아이보리 숄',   palette: { skyTop: '#3e6386', skyBot: '#5780a5', body: '#5c6446', accent: '#f0e8d5', hair: '#2b1d12' } },
  { id: 'disciple_2', preset: 'disciple',   idx: 2, icon: '🐑', name: '갈릴리 목자',     desc: '남청색 로브 · 크림 숄',       palette: { skyTop: '#3b5f86', skyBot: '#537ba3', body: '#3f5166', accent: '#f4efe6', hair: '#1e1b18' } },
  { id: 'female_0',   preset: 'female_0',   idx: 0, icon: '👩', name: '갈릴리 자매',     desc: '아이보리 베일 · 밤색 치마',   palette: { skyTop: '#46688d', skyBot: '#5e84ac', body: '#4e2f1e', accent: '#f4f4f2', hair: '#4a2c18' } },
  { id: 'female_1',   preset: 'female_1',   idx: 1, icon: '🌸', name: '베다니 자매',     desc: '버건디 치마 · 크림 베일',     palette: { skyTop: '#3c6285', skyBot: '#557da3', body: '#6b2c2e', accent: '#f7f0e4', hair: '#3b2212' } },
  { id: 'female_2',   preset: 'female_2',   idx: 2, icon: '🧺', name: '나사렛 자매',     desc: '남청색 치마 · 하늘빛 베일',   palette: { skyTop: '#3b6085', skyBot: '#547da6', body: '#2c4257', accent: '#f0f4f8', hair: '#29170b' } },
  { id: 'child_0',    preset: 'child',      idx: 0, icon: '👦', name: '꼬마 탐험가(남)', desc: '황토 로브 · 아이보리 두건',   palette: { skyTop: '#3d638b', skyBot: '#5882ac', body: '#8d6649', accent: '#ece6d8', hair: '#221a15' } },
  { id: 'child_1',    preset: 'child',      idx: 1, icon: '👧', name: '꼬마 탐험가(여)', desc: '버건디 치마 · 크림 베일',     palette: { skyTop: '#46688e', skyBot: '#6086ad', body: '#6b2c2e', accent: '#f7f0e4', hair: '#3b2212' } }
];
window.MP_SELECTABLE_CHARACTERS = MP_SELECTABLE_CHARACTERS;
window.MP_FORBIDDEN_PRESETS = MP_FORBIDDEN_PRESETS;
window.__mpCharPortraitCache = window.__mpCharPortraitCache || {};

window.isMiracleMultiplayerMode = false;

function _getKoreanParticleRo(word) {
  const s = String(word || '').trim();
  if (!s) return '로';
  let lastCode = s.charCodeAt(s.length - 1);
  // 괄호로 끝나는 이름("꼬마 탐험가(남)" 등)은 괄호 앞이나 닫는 글자 기준 처리
  if (s.endsWith(')') && s.length >= 2) {
    lastCode = s.charCodeAt(s.length - 2);
  }
  if (lastCode < 0xac00 || lastCode > 0xd7a3) return '로';
  const jong = (lastCode - 0xac00) % 28;
  return (jong !== 0 && jong !== 8) ? '으로' : '로';
}

const MiracleMultiplayer = {
  active: false,
  peerId: 'mp_' + Math.random().toString(36).slice(2, 10),
  roomId: '광릉내1방',
  selectedCharId: 'hero',
  charViewAngles: {},
  channel: null,
  syncTimer: 0,
  remoteSyncTimer: 0,
  remotePlayers: new Map(), // peerId -> { name, preset, idx, mesh, label, bubble, targetPos, rotY, lastSeen, chopping, emote, emoteTimer, lastEmoteAt }
  particles: [],
  signalRings: [],
  localEmote: { text: '', at: 0, timer: 0 },
  questCollapsed: false,
  harvestCooldown: 0,
  nearestTarget: null, // { kind: 'wood'|'stone'|'deliver', node?, dist }
  mission: {
    id: 'mp_rock_house',
    stoneReq: 20,
    woodReq: 20,
    stoneDeposited: 0,
    woodDeposited: 0,
    carryStone: 0,
    carryWood: 0,
    maxCarryEach: 5,
    completed: false,
    builtStage: 0,
    siteGroup: null,
    houseGroup: null,
    siteRing: null,
    siteLabel: null
  },

  isUnlocked() {
    if (window.__mpAdminBypassUnlock === true) return true;
    if (typeof window.isEpisode4CompletedForMultiplayer === 'function') {
      return window.isEpisode4CompletedForMultiplayer();
    }
    return false;
  },

  launchFromAdmin(opts = {}) {
    window.__mpAdminBypassUnlock = true;
    const room = String(opts.room || '광릉내1방').trim().slice(0, 16) || '광릉내1방';
    const charId = String(opts.charId || 'hero').trim() || 'hero';
    this.selectCharacter(charId, { silent: true });
    const modal = this.ensureEntryModal();
    const roomInput = modal ? modal.querySelector('#mp-room-input') : document.getElementById('mp-room-input');
    if (roomInput) roomInput.value = room;
    if (opts.autoEnter !== false) {
      this.enterMultiplayerWorld(room, this.selectedCharId);
    } else {
      this.openEntryModal();
    }
  },

  getCharConfig(charId) {
    const found = MP_SELECTABLE_CHARACTERS.find(c => c.id === charId);
    if (!found || MP_FORBIDDEN_PRESETS.includes(found.preset)) {
      return MP_SELECTABLE_CHARACTERS[0];
    }
    return found;
  },

  getCharacterViewSide(charId) {
    return this.charViewAngles[charId] === 'back' ? 'back' : 'front';
  },

  buildCharacterShowcaseScene(cfg, viewSide = 'front') {
    if (typeof THREE === 'undefined' || typeof window.createLowPolyPersonMesh !== 'function') return null;

    const cardScene = new THREE.Scene();
    cardScene.background = new THREE.Color(0x4b77a3);
    const cardCam = new THREE.PerspectiveCamera(34, 320 / 400, 0.1, 60);

    // 수집 카드 대비 과도하게 밝지 않도록 차분한 자연광 균형(총합 ~1.48)으로 3점 조명 구성
    const amb = new THREE.AmbientLight(0xfffaf0, 0.40);
    const hemi = new THREE.HemisphereLight(0xdbeafe, 0x64748b, 0.26);
    const keySun = new THREE.DirectionalLight(0xfff5e4, 0.66);
    keySun.position.set(4.5, 8.5, 6.5);
    const rim = new THREE.DirectionalLight(0xfde68a, 0.16);
    rim.position.set(-5.0, 4.5, -5.0);
    cardScene.add(amb, hemi, keySun, rim);

    const tempGeos = [];
    const tempMats = [];

    const stoneGeo = new THREE.CylinderGeometry(0.68, 0.78, 0.22, 12);
    const stoneMat = new THREE.MeshLambertMaterial({ color: 0x7c6d58 });
    const pedestal = new THREE.Mesh(stoneGeo, stoneMat);
    pedestal.position.set(0, -0.11, 0);
    tempGeos.push(stoneGeo);
    tempMats.push(stoneMat);

    const grassGeo = new THREE.CylinderGeometry(0.72, 0.74, 0.05, 12);
    const grassMat = new THREE.MeshLambertMaterial({ color: 0x557a46 });
    const grassRim = new THREE.Mesh(grassGeo, grassMat);
    grassRim.position.set(0, -0.015, 0);
    tempGeos.push(grassGeo);
    tempMats.push(grassMat);

    const shadowGeo = new THREE.CircleGeometry(0.42, 16);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x1e293b, transparent: true, opacity: 0.28 });
    const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.set(0, 0.012, 0);
    tempGeos.push(shadowGeo);
    tempMats.push(shadowMat);

    cardScene.add(pedestal, grassRim, contactShadow);

    // 실제 인게임 3D 캐릭터 고해상도(LOD 0) 모델 그대로 생성
    const lod = window.createLowPolyPersonMesh(cfg.preset, cfg.idx);
    const charGrp = (lod && lod.levels && lod.levels[0] && lod.levels[0].object) ? lod.levels[0].object : lod;
    if (!charGrp) return null;
    if (lod && lod.scale && charGrp !== lod && charGrp.scale) {
      charGrp.scale.copy(lod.scale);
    }
    const sc = (lod && lod.scale && typeof lod.scale.y === 'number') ? lod.scale.y : 1.0;

    charGrp.position.set(0, 0.02, 0);
    // 앞모습(0.32 rad): 패스파인더·어드벤처러 오른팔 어깨 패치가 정면 카메라를 향하도록 3/4 회전
    // 뒷모습(PI + 0.30 rad): 망토·탐험가방·배낭·베일 뒷태가 자연스럽게 보이도록 회전
    charGrp.rotation.y = (viewSide === 'back') ? (Math.PI + 0.30) : 0.32;

    const rig = (lod && lod.userData) ? lod.userData : null;
    if (rig) {
      if (rig.lArm) rig.lArm.rotation.x = 0.08;
      if (rig.rArm) rig.rArm.rotation.x = -0.10;
      if (rig.lElbow) rig.lElbow.rotation.x = -0.18;
      if (rig.rElbow) rig.rElbow.rotation.x = -0.18;
      if (rig.lWrist) rig.lWrist.rotation.x = 0.06;
      if (rig.rWrist) rig.rWrist.rotation.x = 0.06;
      if (rig.lKnee) rig.lKnee.rotation.x = 0.04;
      if (rig.rKnee) rig.rKnee.rotation.x = 0.03;
      if (rig.torsoPivot) rig.torsoPivot.rotation.y = (viewSide === 'back') ? -0.05 : 0.06;
      if (rig.head) rig.head.rotation.y = (viewSide === 'back') ? 0.04 : -0.08;
      if (rig.capePivot) rig.capePivot.rotation.x = 0.06;
    }
    cardScene.add(charGrp);

    const lookY = sc * 1.05;
    const camDist = Math.max(3.45, sc * 4.45);
    cardCam.position.set(0, sc * 1.18, camDist);
    cardCam.lookAt(0, lookY, 0);

    const disposeScene = () => {
      tempGeos.forEach(g => { try { if (g && typeof g.dispose === 'function') g.dispose(); } catch (e) {} });
      tempMats.forEach(m => { try { if (m && typeof m.dispose === 'function') m.dispose(); } catch (e) {} });
      if (typeof charGrp.traverse === 'function') {
        charGrp.traverse(obj => {
          if (!obj || !obj.isMesh) return;
          if (obj.geometry && !(obj.geometry.userData && obj.geometry.userData._cached) && typeof obj.geometry.dispose === 'function') {
            try { obj.geometry.dispose(); } catch (e) {}
          }
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach(m => {
            if (m && !(m.userData && m.userData._cached) && typeof m.dispose === 'function') {
              try { m.dispose(); } catch (e) {}
            }
          });
        });
      }
    };

    return {
      cardScene,
      cardCam,
      lightSum: amb.intensity + hemi.intensity + keySun.intensity + rim.intensity,
      charScale: sc,
      viewSide,
      disposeScene
    };
  },

  _drawCharPortraitFallback(ctx, W, H, cfg, viewSide) {
    const pal = cfg.palette || { skyTop: '#3e648c', skyBot: '#5782ab', body: '#d6ccb4', accent: '#0f766e', hair: '#3b2314' };
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, pal.skyTop);
    grad.addColorStop(0.72, pal.skyBot);
    grad.addColorStop(1, '#334b63');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // 풀/돌 받침대
    ctx.fillStyle = '#557a46';
    ctx.beginPath();
    ctx.ellipse(W * 0.5, H * 0.80, 90, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7c6d58';
    ctx.fillRect(W * 0.5 - 86, H * 0.80, 172, 26);

    // 차분한 캐릭터 실루엣
    ctx.fillStyle = pal.body;
    ctx.beginPath();
    ctx.roundRect(W * 0.5 - 42, H * 0.43, 84, 128, 22);
    ctx.fill();

    ctx.fillStyle = pal.accent;
    ctx.beginPath();
    ctx.roundRect(viewSide === 'back' ? W * 0.5 - 32 : W * 0.5 - 20, H * 0.44, viewSide === 'back' ? 64 : 40, 88, 12);
    ctx.fill();

    ctx.fillStyle = viewSide === 'back' ? pal.hair : '#eac4a2';
    ctx.beginPath();
    ctx.arc(W * 0.5, H * 0.31, 34, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '34px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(cfg.icon || '🧭', W * 0.5, H * 0.20);
  },

  renderCharacterPortraitDataURL(cfg, viewSide = 'front') {
    const side = (viewSide === 'back') ? 'back' : 'front';
    const cacheKey = `${cfg.id}_${side}`;
    if (window.__mpCharPortraitCache[cacheKey]) {
      return window.__mpCharPortraitCache[cacheKey];
    }

    const W = 320;
    const H = 400;
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

    let builtRef = null;
    let rendered3D = false;
    if (typeof _renderDioramaSceneToCanvas === 'function') {
      rendered3D = _renderDioramaSceneToCanvas(ctx, W, H, () => {
        builtRef = this.buildCharacterShowcaseScene(cfg, side);
        return builtRef;
      });
      if (builtRef && typeof builtRef.disposeScene === 'function') {
        builtRef.disposeScene();
      }
    }

    if (!rendered3D) {
      this._drawCharPortraitFallback(ctx, W, H, cfg, side);
    } else {
      // 과도한 밝기 없이 입체감을 살리는 하단 소프트 비네트
      const vig = ctx.createLinearGradient(0, H * 0.65, 0, H);
      vig.addColorStop(0, 'rgba(15, 23, 42, 0)');
      vig.addColorStop(1, 'rgba(15, 23, 42, 0.34)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, H * 0.65, W, H * 0.35);
    }

    try {
      const dataUrl = canvas.toDataURL('image/png');
      if (rendered3D && dataUrl) {
        window.__mpCharPortraitCache[cacheKey] = dataUrl;
      }
      return dataUrl;
    } catch (e) {
      return '';
    }
  },

  refreshAllCharacterPortraits() {
    const track = document.getElementById('mp-char-track');
    if (!track) return;
    MP_SELECTABLE_CHARACTERS.forEach(cfg => {
      const side = this.getCharacterViewSide(cfg.id);
      const img = track.querySelector(`img[data-mp-portrait="${cfg.id}"]`);
      if (img) {
        const src = this.renderCharacterPortraitDataURL(cfg, side);
        if (src) img.src = src;
      }
      const flipBtn = track.querySelector(`button[data-char-flip="${cfg.id}"]`);
      if (flipBtn) {
        flipBtn.textContent = side === 'back' ? '↻ 앞모습' : '↻ 뒷모습';
      }
    });
  },

  refreshPortraitForClubKey(clubKey) {
    if (!clubKey) return;
    delete window.__mpCharPortraitCache[`${clubKey}_front`];
    delete window.__mpCharPortraitCache[`${clubKey}_back`];
    const track = document.getElementById('mp-char-track');
    if (!track) return;
    const cfg = this.getCharConfig(clubKey);
    if (!cfg || cfg.id !== clubKey) return;
    const img = track.querySelector(`img[data-mp-portrait="${cfg.id}"]`);
    if (img) {
      const src = this.renderCharacterPortraitDataURL(cfg, this.getCharacterViewSide(cfg.id));
      if (src) img.src = src;
    }
  },

  toggleCharacterAngle(charId) {
    const cfg = this.getCharConfig(charId);
    const curSide = this.getCharacterViewSide(cfg.id);
    const nextSide = (curSide === 'back') ? 'front' : 'back';
    this.charViewAngles[cfg.id] = nextSide;

    const track = document.getElementById('mp-char-track');
    if (track) {
      const img = track.querySelector(`img[data-mp-portrait="${cfg.id}"]`);
      if (img) {
        const src = this.renderCharacterPortraitDataURL(cfg, nextSide);
        if (src) img.src = src;
      }
      const flipBtn = track.querySelector(`button[data-char-flip="${cfg.id}"]`);
      if (flipBtn) {
        flipBtn.textContent = nextSide === 'back' ? '↻ 앞모습' : '↻ 뒷모습';
      }
    }
    if (cfg.id !== this.selectedCharId) {
      this.selectCharacter(cfg.id, { scroll: true, silent: true });
    }
    if (typeof playSfx === 'function') playSfx('switch');
  },

  scrollToCharacter(charId, instant = false) {
    const track = document.getElementById('mp-char-track');
    if (!track) return;
    const slot = track.querySelector(`.mp-char-slot[data-char-id="${charId}"]`);
    if (!slot) return;
    this._programmaticScrollUntil = Date.now() + (instant ? 250 : 480);
    const targetLeft = Math.max(0, slot.offsetLeft - (track.clientWidth - slot.offsetWidth) * 0.5);
    if (typeof track.scrollTo === 'function') {
      track.scrollTo({ left: targetLeft, behavior: instant ? 'auto' : 'smooth' });
    } else {
      track.scrollLeft = targetLeft;
    }
  },

  stepCharacter(delta) {
    const curIdx = MP_SELECTABLE_CHARACTERS.findIndex(c => c.id === this.selectedCharId);
    const baseIdx = curIdx >= 0 ? curIdx : 0;
    const nextIdx = Math.max(0, Math.min(MP_SELECTABLE_CHARACTERS.length - 1, baseIdx + delta));
    const nextCfg = MP_SELECTABLE_CHARACTERS[nextIdx];
    if (nextCfg) {
      this.selectCharacter(nextCfg.id, { scroll: true });
    }
  },

  selectCharacter(charId, opts = {}) {
    const cfg = this.getCharConfig(charId);
    const prevId = this.selectedCharId;
    this.selectedCharId = cfg.id;
    window.selectedMiracleHeroPreset = { preset: cfg.preset, idx: cfg.idx };

    const charIdx = MP_SELECTABLE_CHARACTERS.findIndex(c => c.id === cfg.id);
    const cards = document.querySelectorAll('#mp-char-track .mp-char-card[data-char-id]');
    cards.forEach(card => {
      const isSel = card.dataset.charId === cfg.id;
      card.classList.toggle('is-selected', isSel);
      card.setAttribute('aria-pressed', isSel ? 'true' : 'false');
    });

    const dots = document.querySelectorAll('#mp-char-dots button[data-char-dot]');
    dots.forEach(dot => {
      const isAct = dot.dataset.charDot === cfg.id;
      dot.className = isAct
        ? 'w-5 h-2 rounded-full bg-amber-600 transition-all'
        : 'w-2 h-2 rounded-full bg-amber-300/80 hover:bg-amber-400 transition-all';
    });

    const idxBadge = document.getElementById('mp-char-index-badge');
    if (idxBadge && charIdx >= 0) {
      idxBadge.textContent = `${charIdx + 1} / ${MP_SELECTABLE_CHARACTERS.length}`;
    }

    const enterBtn = document.getElementById('mp-enter-world-btn');
    if (enterBtn) {
      enterBtn.textContent = `🌐 ${cfg.name}${_getKoreanParticleRo(cfg.name)} 입장하기!`;
    }

    if (opts.scroll !== false) {
      this.scrollToCharacter(cfg.id, Boolean(opts.instant));
    }
    if (!opts.silent && (prevId !== cfg.id || opts.forceSound)) {
      if (typeof playSfx === 'function') playSfx('switch');
    }
  },

  bindCharTrackSwipeInteraction(track) {
    if (!track || track._mpSwipeBound) return;
    track._mpSwipeBound = true;

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
    let scrollSyncTimer = null;

    const setTrackTilt = (deg) => {
      track.style.setProperty('--swipe-tilt', `${deg.toFixed(1)}deg`);
    };

    const stopMomentum = () => {
      if (momentumRaf) {
        cancelAnimationFrame(momentumRaf);
        momentumRaf = 0;
      }
    };

    const findNearestCharId = () => {
      const slots = track.querySelectorAll('.mp-char-slot');
      if (!slots || slots.length === 0) return null;
      const center = track.scrollLeft + track.clientWidth * 0.5;
      let bestId = null;
      let bestDist = Infinity;
      slots.forEach(slot => {
        const slotCenter = slot.offsetLeft + slot.offsetWidth * 0.5;
        const d = Math.abs(slotCenter - center);
        if (d < bestDist) {
          bestDist = d;
          bestId = slot.dataset.charId;
        }
      });
      return bestId;
    };

    const snapAndSelectNearest = () => {
      track.classList.remove('is-pointer-dragging');
      setTrackTilt(0);
      const nearestId = findNearestCharId();
      if (nearestId) {
        this.selectCharacter(nearestId, { scroll: true });
      }
    };

    track.addEventListener('dragstart', (e) => e.preventDefault());
    track.addEventListener('pointerdown', (e) => {
      if (e.target && e.target.closest && e.target.closest('button')) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      stopMomentum();
      if (scrollSyncTimer) { clearTimeout(scrollSyncTimer); scrollSyncTimer = null; }
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
      window._mpCharSuppressClickUntil = Date.now() + 360;

      let coastV = Math.max(-2.6, Math.min(2.6, velocity)) * 16;
      if (Math.abs(coastV) < 1.2) {
        snapAndSelectNearest();
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
          snapAndSelectNearest();
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

    // 모바일 네이티브 관성 터치 스크롤 종료 시에도 중앙 캐릭터 자동 선택
    track.addEventListener('scroll', () => {
      if (isDown || momentumRaf) return;
      if (Date.now() < (this._programmaticScrollUntil || 0)) {
        if (scrollSyncTimer) { clearTimeout(scrollSyncTimer); scrollSyncTimer = null; }
        return;
      }
      if (scrollSyncTimer) clearTimeout(scrollSyncTimer);
      scrollSyncTimer = setTimeout(() => {
        scrollSyncTimer = null;
        if (isDown || momentumRaf || Date.now() < (this._programmaticScrollUntil || 0)) return;
        const nearestId = findNearestCharId();
        if (nearestId && nearestId !== this.selectedCharId) {
          this.selectCharacter(nearestId, { scroll: false });
        }
      }, 115);
    }, { passive: true });

    const modal = document.getElementById('mp-entry-modal');
    if (modal && !modal._mpArrowBound) {
      modal._mpArrowBound = true;
      document.addEventListener('keydown', (e) => {
        if (modal.classList.contains('hidden')) return;
        const activeTag = document.activeElement && document.activeElement.tagName;
        if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          this.stepCharacter(1);
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          this.stepCharacter(-1);
        }
      });
    }
  },

  ensureEntryModal() {
    let modal = document.getElementById('mp-entry-modal');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'mp-entry-modal';
    modal.className = 'hidden fixed inset-0 z-50 items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-sm overflow-hidden';
    const charSlotsHtml = MP_SELECTABLE_CHARACTERS.map(c => `
      <div class="mp-char-slot" data-char-id="${c.id}">
        <div role="button" tabindex="0" data-char-id="${c.id}" aria-label="${c.name} 선택"
             onclick="if(Date.now()<(window._mpCharSuppressClickUntil||0))return; window.MiracleMultiplayer.selectCharacter('${c.id}');"
             onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault(); window.MiracleMultiplayer.selectCharacter('${c.id}');}"
             class="mp-char-card">
          <div class="mp-char-portrait-wrap">
            <img data-mp-portrait="${c.id}" class="mp-char-portrait-img" alt="${c.name} 3D 모습" draggable="false" />
            <span class="mp-char-selected-badge">✓ 선택됨</span>
            <button type="button" data-char-flip="${c.id}" aria-label="${c.name} 앞/뒷모습 전환"
                    onclick="event.stopPropagation(); window.MiracleMultiplayer.toggleCharacterAngle('${c.id}');"
                    class="mp-char-flip-btn">↻ 뒷모습</button>
          </div>
          <div class="mp-char-meta">
            <div class="font-jua text-xs sm:text-sm text-amber-950 truncate">${c.icon} ${c.name}</div>
            <div class="text-[10px] text-slate-600 truncate">${c.desc}</div>
          </div>
        </div>
      </div>
    `).join('');

    const dotsHtml = MP_SELECTABLE_CHARACTERS.map(c => `
      <button type="button" data-char-dot="${c.id}" aria-label="${c.name} 보기"
              onclick="window.MiracleMultiplayer.selectCharacter('${c.id}')"
              class="w-2 h-2 rounded-full bg-amber-300/80 hover:bg-amber-400 transition-all"></button>
    `).join('');

    modal.innerHTML = `
      <div class="mp-entry-card mc-card modal-scroll w-full max-w-2xl rounded-3xl p-3 sm:p-5 text-center flex flex-col max-h-[94dvh] overflow-hidden">
        <div class="mp-entry-header flex items-center justify-between border-b-2 border-amber-300 pb-2 mb-2 shrink-0">
          <div class="text-left min-w-0">
            <span class="inline-block px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-950 font-jua text-[10px]">🌐 에피소드 4 오픈월드 협동</span>
            <h2 class="font-jua text-base sm:text-xl text-amber-950 mt-0.5 truncate">멀티플레이 캐릭터 &amp; 방 입장</h2>
          </div>
          <button type="button" onclick="window.MiracleMultiplayer.closeEntryModal()"
                  class="mc-btn px-3 py-1 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-jua text-xs shrink-0">닫기 ✕</button>
        </div>

        <div class="mp-room-row bg-amber-50/90 border-2 border-amber-300 rounded-2xl p-2 mb-2 text-left shrink-0">
          <label for="mp-room-input" class="mp-room-label block font-jua text-xs text-amber-900 mb-1">🏠 함께 들어갈 방 이름 (같은 방 이름 입력 시 친구와 연결)</label>
          <input id="mp-room-input" type="text" maxlength="16" value="광릉내1방"
                 style="user-select: text; -webkit-user-select: text; touch-action: auto;"
                 class="w-full px-3 py-1.5 rounded-xl border-2 border-amber-400 bg-white font-bold text-slate-900 text-sm" />
        </div>

        <div class="mp-char-section text-left mb-2 flex flex-col min-h-0 flex-1">
          <div class="flex items-center justify-between gap-2 mb-1 shrink-0">
            <span class="font-jua text-xs sm:text-sm text-amber-950 truncate">🎭 캐릭터 선택 (좌우 스와이프 · 인게임 3D)</span>
            <span id="mp-char-index-badge" class="px-2 py-0.5 rounded-full bg-amber-200/90 text-amber-950 font-jua text-[10px] shrink-0">1 / ${MP_SELECTABLE_CHARACTERS.length}</span>
          </div>

          <div class="mp-char-carousel-wrap relative flex items-center min-h-0 flex-1">
            <button type="button" aria-label="이전 캐릭터" onclick="window.MiracleMultiplayer.stepCharacter(-1)"
                    class="mp-char-nav-btn mp-char-nav-prev mc-btn-slim">‹</button>
            <div id="mp-char-track" class="mp-char-scroll-track">${charSlotsHtml}</div>
            <button type="button" aria-label="다음 캐릭터" onclick="window.MiracleMultiplayer.stepCharacter(1)"
                    class="mp-char-nav-btn mp-char-nav-next mc-btn-slim">›</button>
          </div>

          <div class="mp-char-dots-row flex items-center justify-center gap-1.5 mt-1 shrink-0">
            <div id="mp-char-dots" class="flex items-center gap-1">${dotsHtml}</div>
          </div>
          <p class="mp-char-swipe-hint text-[10px] sm:text-[11px] text-amber-900/75 font-bold text-center mt-0.5 shrink-0">
            👈 좌우로 터치 스와이프해 캐릭터를 고르고, ↻ 뒷모습으로 전체 모습을 확인하세요 👉
          </p>
        </div>

        <div class="mp-mission-banner p-2 rounded-2xl bg-sky-50 border border-sky-300 text-left text-[11px] text-sky-950 mb-2 leading-snug shrink-0">
          <b>🏗️ 협동 미션 1 — 반석 위의 집 확장형:</b>
          외곽 나무(도끼질 5회 → 🪵나무 1)와 바위(채굴 5회 → 🪨돌 1)를 캐서 <b>돌 20개 + 나무 20개</b>를 함께 모아 집을 세워 보세요!
        </div>

        <button id="mp-enter-world-btn" type="button" onclick="window.MiracleMultiplayer.enterMultiplayerWorld()"
                class="mp-enter-btn mc-btn w-full py-2 sm:py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-jua text-sm sm:text-lg shadow-lg shrink-0">
          🌐 갈릴리 탐험가로 입장하기!
        </button>
      </div>
    `;
    document.body.appendChild(modal);
    const track = document.getElementById('mp-char-track');
    this.bindCharTrackSwipeInteraction(track);
    this.refreshAllCharacterPortraits();
    this.selectCharacter(this.selectedCharId, { scroll: true, instant: true, silent: true });
    return modal;
  },

  toggleQuestCard() {
    this.questCollapsed = !this.questCollapsed;
    const body = document.getElementById('mp-quest-body');
    const tog = document.getElementById('mp-quest-toggle');
    if (body) body.classList.toggle('hidden', this.questCollapsed);
    if (tog) tog.textContent = this.questCollapsed ? '▾' : '▴';
  },

  positionRightHud() {
    const badge = document.getElementById('mp-online-badge');
    const hud = document.getElementById('miracle-mp-hud');
    const hudTopRight = document.getElementById('hud-top-right');
    let safeTop = 48;
    if (hudTopRight) {
      const r = hudTopRight.getBoundingClientRect();
      if (r && r.bottom > 0) safeTop = Math.max(44, Math.ceil(r.bottom) + 6);
    }
    if (badge) {
      badge.style.top = `${safeTop}px`;
    }
    if (hud) {
      let hudTopY = safeTop + 32;
      if (badge && !badge.classList.contains('hidden')) {
        const br = badge.getBoundingClientRect();
        if (br && br.bottom > 0) hudTopY = Math.ceil(br.bottom) + 6;
      }
      hud.style.top = `${hudTopY}px`;
    }
  },

  ensureMultiplayerHUD() {
    // 1) 항상 화면에 고정되는 [접속자 수 · 방 이름] 전용 상단 배지 (퀘스트창을 접어도 항상 표시!)
    let badge = document.getElementById('mp-online-badge');
    if (!badge) {
      badge = document.createElement('div');
      badge.id = 'mp-online-badge';
      badge.className = 'hidden fixed right-2 sm:right-3 z-30 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 border border-emerald-400 text-white shadow-lg backdrop-blur-sm pointer-events-auto';
      badge.style.top = '52px';
      badge.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
        <span id="mp-online-count-text" class="font-jua text-[11px] text-emerald-200 whitespace-nowrap">접속 중 1명</span>
        <span id="mp-online-room-text" class="text-[10px] text-slate-300 truncate max-w-[78px]">· 광릉내1방</span>
        <button type="button" onclick="window.MiracleMultiplayer.exitToOpening()"
                class="ml-0.5 px-1.5 py-0.5 rounded-full bg-slate-700 hover:bg-slate-600 text-[9px] font-jua text-slate-200 shrink-0">나가기</button>
      `;
      document.body.appendChild(badge);
    }

    // 2) 컴팩트 공동 퀘스트 미니창 (접기/펼치기 지원 · 향후 다중 공동 퀘스트 확장 대비 구조) + 초소형 감정표현/인사 바
    let hud = document.getElementById('miracle-mp-hud');
    if (hud) {
      this.positionRightHud();
      return hud;
    }
    hud = document.createElement('div');
    hud.id = 'miracle-mp-hud';
    hud.className = 'hidden fixed right-2 sm:right-3 z-20 flex flex-col items-end gap-1 pointer-events-auto';
    hud.style.top = '84px';
    hud.innerHTML = `
      <div class="w-[170px] sm:w-[186px] p-2 rounded-2xl bg-slate-900/86 border border-emerald-400/85 text-white shadow-lg backdrop-blur-sm text-left">
        <div class="flex items-center justify-between gap-1 cursor-pointer" onclick="window.MiracleMultiplayer.toggleQuestCard()">
          <span class="font-jua text-[11px] text-amber-300 truncate">🏗️ 공동#1 반석의 집</span>
          <button id="mp-quest-toggle" type="button" class="text-[10px] text-slate-300 leading-none px-1">▴</button>
        </div>
        <div id="mp-quest-body" class="mt-1 space-y-1">
          <div class="flex items-center justify-between text-[10px] font-jua">
            <span class="text-sky-300">🪨 <b id="mp-hud-stone">0/20</b></span>
            <span class="text-amber-300">🪵 <b id="mp-hud-wood">0/20</b></span>
          </div>
          <div class="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div id="mp-hud-prog" class="h-full bg-gradient-to-r from-emerald-400 to-amber-300 transition-all duration-200" style="width:0%"></div>
          </div>
          <div class="flex items-center justify-between gap-1">
            <span id="mp-hud-carry" class="text-[9px] text-emerald-200 font-bold truncate">🎒 🪨0 · 🪵0</span>
            <button type="button" onclick="window.MiracleMultiplayer.teleportNearRockSite()"
                    class="px-1.5 py-0.5 rounded-md bg-amber-400 hover:bg-amber-300 text-slate-950 font-jua text-[9px] shrink-0">⛰️ 이동</button>
          </div>
        </div>
      </div>

      <!-- 초소형 감정표현 · 인사 시그널 바 (누르면 내 캐릭터와 상대방 화면 모두에 말풍선 + 신호 링 전송!) -->
      <div id="mp-emote-bar" class="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-slate-900/85 border border-slate-600/80 shadow">
        <button type="button" title="안녕!" onclick="window.MiracleMultiplayer.sendEmote('👋 안녕!')" class="w-6 h-6 rounded-full hover:bg-slate-700 text-xs flex items-center justify-center">👋</button>
        <button type="button" title="같이 해요!" onclick="window.MiracleMultiplayer.sendEmote('🙌 같이 해요!')" class="w-6 h-6 rounded-full hover:bg-slate-700 text-xs flex items-center justify-center">🙌</button>
        <button type="button" title="사랑해요!" onclick="window.MiracleMultiplayer.sendEmote('❤️ 축복해요!')" class="w-6 h-6 rounded-full hover:bg-slate-700 text-xs flex items-center justify-center">❤️</button>
        <button type="button" title="힘내요!" onclick="window.MiracleMultiplayer.sendEmote('💪 파이팅!')" class="w-6 h-6 rounded-full hover:bg-slate-700 text-xs flex items-center justify-center">💪</button>
        <button type="button" title="여기로 와요!" onclick="window.MiracleMultiplayer.sendEmote('📍 여기로!')" class="w-6 h-6 rounded-full hover:bg-slate-700 text-xs flex items-center justify-center">📍</button>
      </div>
    `;
    document.body.appendChild(hud);

    // 3) 내 캐릭터 머리 위 메시지 말풍선 (상대방에게도 동일 신호 전송!)
    if (!document.getElementById('mp-local-bubble')) {
      const lb = document.createElement('div');
      lb.id = 'mp-local-bubble';
      lb.className = 'hidden fixed z-30 pointer-events-none px-2.5 py-1 rounded-2xl bg-amber-300 text-slate-950 border-2 border-white font-jua text-xs shadow-lg whitespace-nowrap';
      lb.style.transform = 'translate(-50%, -100%)';
      document.body.appendChild(lb);
    }

    // 4) 채집(나무 도끼질 5회 / 돌 캐기 5회) & 반석 재료 놓기 전용 하단 액션 버튼
    let actWrap = document.getElementById('mp-harvest-btn-wrap');
    if (!actWrap) {
      actWrap = document.createElement('div');
      actWrap.id = 'mp-harvest-btn-wrap';
      actWrap.className = 'hidden fixed bottom-24 sm:bottom-28 left-1/2 -translate-x-1/2 z-30 pointer-events-auto';
      actWrap.innerHTML = `
        <button id="mp-harvest-btn" type="button"
                onclick="window.MiracleMultiplayer.performContextAction()"
                class="mc-btn px-5 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 border-2 border-white text-slate-950 font-jua text-sm sm:text-base shadow-2xl">
          🪓 나무 베기 (0/5)
        </button>
      `;
      document.body.appendChild(actWrap);
    }
    this.positionRightHud();
    return hud;
  },

  openEntryModal() {
    const modal = this.ensureEntryModal();
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    this.refreshAllCharacterPortraits();
    this.selectCharacter(this.selectedCharId, { scroll: true, instant: true, silent: true });
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => this.scrollToCharacter(this.selectedCharId, true));
    }
  },

  closeEntryModal() {
    const modal = document.getElementById('mp-entry-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  },

  enterMultiplayerWorld(forcedRoomId, forcedCharId) {
    if (typeof discardPausedGameSession === 'function') discardPausedGameSession(true);
    if (typeof setHudMenuOpen === 'function') setHudMenuOpen(false);
    if (typeof hideMissionGuideBubbleImmediately === 'function') hideMissionGuideBubbleImmediately();
    if (forcedCharId) this.selectCharacter(forcedCharId);
    const roomInput = document.getElementById('mp-room-input');
    this.roomId = (forcedRoomId || (roomInput ? roomInput.value.trim() : '') || '광릉내1방').slice(0, 16);
    this.closeEntryModal();

    const cfg = this.getCharConfig(this.selectedCharId);
    window.selectedMiracleHeroPreset = { preset: cfg.preset, idx: cfg.idx };

    this.active = true;
    window.isMiracleMultiplayerMode = true;

    // 멀티플레이 방 미션 상태 초기화 또는 저장 상태 로드
    this.loadRoomMissionFromLocal();

    // 화면 숨기고 에피소드 4 오픈월드 입장 (전용 멀티플레이 모드!)
    ['screen-opening', 'screen-class', 'screen-map'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.classList.add('hidden'); el.classList.remove('flex'); }
    });
    if (typeof isMenuBgmActive !== 'undefined') isMenuBgmActive = false;
    if (typeof currentEpisode !== 'undefined') currentEpisode = 'miracle';
    if (typeof currentStage !== 'undefined') currentStage = 1;
    if (typeof currentMode !== 'undefined') currentMode = 'junior';
    if (typeof isPlaying !== 'undefined') isPlaying = true;
    if (typeof gameState !== 'undefined') gameState = 'PLAY';

    const hudTop = document.getElementById('hud-top');
    if (hudTop) { hudTop.classList.remove('hidden'); hudTop.classList.add('flex'); }
    if (typeof syncHudMenuInfo === 'function') syncHudMenuInfo();
    if (typeof updateMiracleGuideButtonVisibility === 'function') updateMiracleGuideButtonVisibility();
    const jz = document.getElementById('joystick-zone');
    const cb = document.getElementById('cam-bottom-bar');
    const az = document.getElementById('action-zone');
    if (jz) jz.style.display = 'block';
    if (cb) cb.style.display = 'flex';
    if (az) az.style.display = 'flex';

    if (typeof miracleMainStagesCleared !== 'undefined') {
      miracleMainStagesCleared[1] = true;
      miracleMainStagesCleared[2] = true;
      miracleMainStagesCleared[3] = true;
      miracleMainStagesCleared[4] = true;
    }
    if (typeof miracleIsPostResurrection !== 'undefined') miracleIsPostResurrection = true;

    if (typeof buildMiracleOpenWorld === 'function') {
      buildMiracleOpenWorld(false);
    }

    // 멀티플레이 플레이어를 확장 반석 부지 근처(x=50, z=24)에 안전하게 배치
    const sx = 50, sz = 24;
    const sy = (typeof getMiracleOpenWorldGroundHeight === 'function') ? getMiracleOpenWorldGroundHeight(sx, sz) : 0.25;
    if (typeof playerPos !== 'undefined' && playerPos) {
      playerPos.set(sx, sy, sz);
      if (typeof playerGroup !== 'undefined' && playerGroup) playerGroup.position.copy(playerPos);
      if (typeof snapCameraToPlayer === 'function') snapCameraToPlayer();
    }

    this.connectTransport();
    this.ensureMultiplayerHUD();
    const hud = document.getElementById('miracle-mp-hud');
    if (hud) hud.classList.remove('hidden');
    this.syncHUD();
    this.positionRightHud();

    if (typeof playSfx === 'function') playSfx('clear');
    if (typeof showToast === 'function') {
      showToast(`🌐 [${this.roomId}] 멀티플레이 입장! 나무(5회 도끼질)·돌(5회 채굴)을 각 20개 모아 반석 위의 집을 완성하세요!`);
    }
  },

  exitToOpening() {
    if (typeof discardPausedGameSession === 'function') discardPausedGameSession(true);
    this.leaveRoom();
    if (typeof openScreen === 'function') openScreen('screen-opening');
  },

  leaveRoom() {
    if (this.active) {
      this.broadcastMessage({ type: 'leave', peerId: this.peerId });
    }
    this.active = false;
    window.isMiracleMultiplayerMode = false;
    window.selectedMiracleHeroPreset = { preset: 'hero', idx: 0 };

    if (this.channel) {
      try { this.channel.close(); } catch (e) {}
      this.channel = null;
    }
    this.remotePlayers.forEach(rp => {
      if (rp.mesh && typeof worldGroup !== 'undefined' && worldGroup) worldGroup.remove(rp.mesh);
      if (rp.label) rp.label.remove();
      if (rp.bubble) rp.bubble.remove();
    });
    this.remotePlayers.clear();
    this.signalRings.forEach(sr => {
      if (sr.mesh && typeof worldGroup !== 'undefined' && worldGroup) worldGroup.remove(sr.mesh);
    });
    this.signalRings = [];

    const badge = document.getElementById('mp-online-badge');
    if (badge) badge.classList.add('hidden');
    const lb = document.getElementById('mp-local-bubble');
    if (lb) lb.classList.add('hidden');
    const hud = document.getElementById('miracle-mp-hud');
    if (hud) hud.classList.add('hidden');
    const actWrap = document.getElementById('mp-harvest-btn-wrap');
    if (actWrap) actWrap.classList.add('hidden');
    if (typeof window.updateMiracleMiniNavigatorUI === 'function') {
      window.updateMiracleMiniNavigatorUI({ visible: false });
    }
  },

  getRoomStorageKey() {
    return 'ep4_mp_room_state_' + encodeURIComponent(this.roomId || 'default');
  },

  loadRoomMissionFromLocal() {
    this.mission.stoneDeposited = 0;
    this.mission.woodDeposited = 0;
    this.mission.carryStone = 0;
    this.mission.carryWood = 0;
    this.mission.completed = false;
    this.mission.builtStage = 0;
    try {
      const raw = localStorage.getItem(this.getRoomStorageKey());
      if (raw) {
        const d = JSON.parse(raw);
        if (d && typeof d.stone === 'number' && typeof d.wood === 'number') {
          this.mission.stoneDeposited = Math.min(this.mission.stoneReq, Math.max(0, d.stone));
          this.mission.woodDeposited = Math.min(this.mission.woodReq, Math.max(0, d.wood));
          this.mission.completed = Boolean(d.completed && this.mission.stoneDeposited >= this.mission.stoneReq && this.mission.woodDeposited >= this.mission.woodReq);
        }
      }
    } catch (e) {}
  },

  saveRoomMissionToLocal() {
    try {
      localStorage.setItem(this.getRoomStorageKey(), JSON.stringify({
        stone: this.mission.stoneDeposited,
        wood: this.mission.woodDeposited,
        completed: this.mission.completed,
        updatedAt: Date.now()
      }));
    } catch (e) {}
  },

  resetRockHouseMission() {
    this.mission.stoneDeposited = 0;
    this.mission.woodDeposited = 0;
    this.mission.carryStone = 0;
    this.mission.carryWood = 0;
    this.mission.completed = false;
    this.mission.builtStage = 0;
    this.saveRoomMissionToLocal();
    this.rebuildGrandRockHouseVisuals();
    this.syncHUD();
    this.broadcastMessage({
      type: 'mission_sync',
      peerId: this.peerId,
      stone: 0,
      wood: 0,
      completed: false,
      reset: true
    });
    if (typeof showToast === 'function') showToast('🔄 반석 위의 집 확장형 협동 미션을 처음부터 다시 시작합니다!');
  },

  connectTransport() {
    if (this.channel) {
      try { this.channel.close(); } catch (e) {}
      this.channel = null;
    }
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.channel = new BroadcastChannel('ep4_mp_room_' + this.roomId);
        this.channel.onmessage = (ev) => this.handleIncomingMessage(ev.data);
      } catch (e) {}
    }
    if (!this._storageBound) {
      this._storageBound = true;
      window.addEventListener('storage', (ev) => {
        if (!this.active) return;
        if (ev.key === 'ep4_mp_evt_' + this.roomId && ev.newValue) {
          try { this.handleIncomingMessage(JSON.parse(ev.newValue)); } catch (e) {}
        }
      });
    }
    this.broadcastMessage({
      type: 'hello',
      peerId: this.peerId,
      name: (typeof explorerDisplayName !== 'undefined' && explorerDisplayName) ? explorerDisplayName : (window.explorerName || '대원'),
      preset: (window.selectedMiracleHeroPreset && window.selectedMiracleHeroPreset.preset) || 'hero',
      idx: (window.selectedMiracleHeroPreset && window.selectedMiracleHeroPreset.idx) || 0,
      stone: this.mission.stoneDeposited,
      wood: this.mission.woodDeposited,
      completed: this.mission.completed
    });
  },

  broadcastMessage(msg) {
    if (!this.active) return;
    const payload = Object.assign({ roomId: this.roomId, ts: Date.now() }, msg);
    if (this.channel) {
      try { this.channel.postMessage(payload); } catch (e) {}
    }
    try {
      localStorage.setItem('ep4_mp_evt_' + this.roomId, JSON.stringify(payload));
    } catch (e) {}
    const fbBase = String(window.MP_FIREBASE_DB_URL || '').replace(/\/+$/, '');
    if (fbBase && msg && msg.type === 'mission_sync') {
      const roomKey = encodeURIComponent(this.roomId);
      try {
        fetch(`${fbBase}/mp_rooms/${roomKey}/mission.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stone: this.mission.stoneDeposited,
            wood: this.mission.woodDeposited,
            completed: this.mission.completed,
            reset: Boolean(msg.reset),
            ts: Date.now()
          })
        }).catch(() => {});
      } catch (e) {}
    }
  },

  handleIncomingMessage(msg) {
    if (!this.active || !msg || msg.peerId === this.peerId) return;
    if (msg.roomId && msg.roomId !== this.roomId) return;

    if (msg.type === 'leave') {
      const rp = this.remotePlayers.get(msg.peerId);
      if (rp) {
        if (rp.mesh && typeof worldGroup !== 'undefined' && worldGroup) worldGroup.remove(rp.mesh);
        if (rp.label) rp.label.remove();
        if (rp.bubble) rp.bubble.remove();
        this.remotePlayers.delete(msg.peerId);
        this.syncHUD();
      }
      return;
    }

    if (msg.type === 'hello' || msg.type === 'state') {
      const safePreset = MP_FORBIDDEN_PRESETS.includes(msg.preset) ? 'hero' : (msg.preset || 'hero');
      let rp = this.remotePlayers.get(msg.peerId);
      if (!rp) {
        const mesh = (typeof window.createLowPolyPersonMesh === 'function')
          ? window.createLowPolyPersonMesh(safePreset, msg.idx || 0)
          : new THREE.Group();
        const px = typeof msg.x === 'number' ? msg.x : 50;
        const pz = typeof msg.z === 'number' ? msg.z : 24;
        const py = typeof msg.y === 'number' ? msg.y : ((typeof getMiracleOpenWorldGroundHeight === 'function') ? getMiracleOpenWorldGroundHeight(px, pz) : 0);
        mesh.position.set(px, py, pz);
        if (typeof worldGroup !== 'undefined' && worldGroup) worldGroup.add(mesh);
        const lbl = (typeof createWorldLabel === 'function') ? createWorldLabel(`🟢 ${msg.name || '친구'}`) : null;
        const bub = document.createElement('div');
        bub.className = 'hidden fixed z-30 pointer-events-none px-2.5 py-1 rounded-2xl bg-white text-slate-950 border-2 border-emerald-400 font-jua text-xs shadow-lg whitespace-nowrap';
        bub.style.transform = 'translate(-50%, -100%)';
        document.body.appendChild(bub);
        rp = {
          peerId: msg.peerId,
          name: msg.name || '친구',
          preset: safePreset,
          idx: msg.idx || 0,
          mesh,
          label: lbl,
          bubble: bub,
          targetPos: new THREE.Vector3(px, py, pz),
          rotY: msg.rotY || 0,
          chopping: false,
          emote: '',
          emoteTimer: 0,
          lastEmoteAt: 0,
          lastSeen: performance.now()
        };
        this.remotePlayers.set(msg.peerId, rp);
        if (typeof showToast === 'function') showToast(`👋 ${rp.name} 친구가 [${this.roomId}] 방에 합류했어요!`);
        this.syncHUD();
      }
      if (typeof msg.x === 'number' && typeof msg.z === 'number') {
        rp.targetPos.set(msg.x, typeof msg.y === 'number' ? msg.y : rp.targetPos.y, msg.z);
      }
      if (typeof msg.rotY === 'number') rp.rotY = msg.rotY;
      rp.chopping = Boolean(msg.chopping);
      rp.lastSeen = performance.now();

      // Firebase/상태 패킷에 실려 온 상대방 감정표현 시그널 자동 감지 및 말풍선·링 출력!
      if (msg.lastEmote && msg.lastEmote.text && msg.lastEmote.at && msg.lastEmote.at > (rp.lastEmoteAt || 0)) {
        this.triggerRemoteEmoteVisual(rp, msg.lastEmote.text, msg.lastEmote.at);
      }
    }

    if (msg.type === 'emote') {
      const rp = this.remotePlayers.get(msg.peerId);
      if (rp) {
        this.triggerRemoteEmoteVisual(rp, String(msg.text || ''), msg.at || Date.now());
      } else if (msg.text) {
        if (typeof playSfx === 'function') playSfx('switch');
        if (typeof showToast === 'function') showToast(`💬 ${msg.name || '친구'}: ${msg.text}`);
      }
    }

    if (msg.type === 'mission_sync' || msg.type === 'hello') {
      if (typeof msg.stone === 'number' && typeof msg.wood === 'number') {
        const nextStone = msg.reset ? msg.stone : Math.max(this.mission.stoneDeposited, Math.min(this.mission.stoneReq, msg.stone));
        const nextWood = msg.reset ? msg.wood : Math.max(this.mission.woodDeposited, Math.min(this.mission.woodReq, msg.wood));
        const changed = (nextStone !== this.mission.stoneDeposited || nextWood !== this.mission.woodDeposited || Boolean(msg.reset));
        this.mission.stoneDeposited = nextStone;
        this.mission.woodDeposited = nextWood;
        if (msg.reset) this.mission.completed = false;
        if (changed) {
          this.saveRoomMissionToLocal();
          this.rebuildGrandRockHouseVisuals();
          this.syncHUD();
          if (!this.mission.completed && this.mission.stoneDeposited >= this.mission.stoneReq && this.mission.woodDeposited >= this.mission.woodReq) {
            this.completeRockHouseMission();
          }
        }
      }
    }
  },

  spawnEmoteSignalRing(pos, colorHex = 0xfacc15) {
    if (!pos || typeof worldGroup === 'undefined' || !worldGroup) return;
    const mat = new THREE.MeshBasicMaterial({ color: colorHex, side: THREE.DoubleSide, transparent: true, opacity: 0.90 });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.95, 20), mat);
    ring.rotation.x = -Math.PI * 0.5;
    ring.position.set(pos.x, (pos.y || 0) + 0.16, pos.z);
    worldGroup.add(ring);
    this.signalRings.push({ mesh: ring, mat, life: 1.35, maxLife: 1.35 });
  },

  triggerRemoteEmoteVisual(rp, text, atTs) {
    if (!rp || !text) return;
    rp.emote = text;
    rp.emoteTimer = 4.2;
    rp.lastEmoteAt = atTs || Date.now();
    if (rp.label) rp.label.innerHTML = `🟢 ${rp.name}`;
    if (rp.bubble) {
      rp.bubble.textContent = `💬 ${rp.name}: ${text}`;
      rp.bubble.classList.remove('hidden');
    }
    if (rp.mesh) this.spawnEmoteSignalRing(rp.mesh.position, 0x34d399);
    if (typeof playSfx === 'function') playSfx('switch');
    if (typeof showToast === 'function') showToast(`💬 ${rp.name}: ${text}`);
  },

  _mapEmoteTextToAnimKind(text) {
    const t = String(text || '');
    if (t.includes('👋')) return 'wave';
    if (t.includes('🙌')) return 'cheer';
    if (t.includes('❤️')) return 'bless';
    if (t.includes('💪')) return 'pump';
    if (t.includes('📍')) return 'beckon';
    return 'wave';
  },

  sendEmote(text) {
    if (!this.active) return;
    const nowAt = Date.now();
    const myName = (typeof explorerDisplayName !== 'undefined' && explorerDisplayName) ? explorerDisplayName : (window.explorerName || '대원');
    this.localEmote = { text: String(text || ''), at: nowAt, timer: 3.8 };
    if (window.ep4CharacterAnimator && typeof window.ep4CharacterAnimator.triggerEmote === 'function') {
      window.ep4CharacterAnimator.triggerEmote(this._mapEmoteTextToAnimKind(text), 1.65);
    }
    const lb = document.getElementById('mp-local-bubble');
    if (lb) {
      lb.textContent = text;
      lb.classList.remove('hidden');
    }
    if (typeof playerPos !== 'undefined' && playerPos) {
      this.spawnEmoteSignalRing(playerPos, 0xfacc15);
    }
    if (typeof playSfx === 'function') playSfx('switch');
    if (typeof showToast === 'function') showToast(`📡 신호 전송 · ${myName}: ${text}`);
    this.broadcastMessage({ type: 'emote', peerId: this.peerId, name: myName, text, at: nowAt });
    // Firebase 온라인 릴레이에도 즉시 전송해 다른 기기 친구들이 바로 말풍선과 신호를 볼 수 있게 함!
    if (window.MP_FIREBASE_DB_URL && typeof fetch === 'function') {
      this.syncWithFirebaseRelay();
    }
  },

  getNavigatorTarget() {
    if (!this.active) return null;
    const site = window.MIRACLE_GRAND_BEDROCK_POS || { x: 63, z: 18 };
    const sy = (typeof getMiracleOpenWorldGroundHeight === 'function') ? getMiracleOpenWorldGroundHeight(site.x, site.z) : 0.25;
    if (this.mission.completed || this.mission.carryStone > 0 || this.mission.carryWood > 0) {
      return {
        pos: new THREE.Vector3(site.x, sy, site.z),
        label: this.mission.completed ? '🏠 반석 위의 집' : '⛰️ 반석 집터'
      };
    }
    const needStone = Math.max(0, this.mission.stoneReq - this.mission.stoneDeposited);
    const needWood = Math.max(0, this.mission.woodReq - this.mission.woodDeposited);
    const preferKind = (needStone > needWood) ? 'stone' : (needWood > 0 ? 'wood' : 'stone');
    const nodes = Array.isArray(window.miracleHarvestNodes) ? window.miracleHarvestNodes : [];
    let best = null, bestD = Infinity;
    for (let i = 0; i < nodes.length; i++) {
      const nd = nodes[i];
      if (!nd || nd.depleted) continue;
      if (needStone > 0 && needWood > 0 && nd.kind !== preferKind) continue;
      if (needStone === 0 && nd.kind === 'stone') continue;
      if (needWood === 0 && nd.kind === 'wood') continue;
      const d = Math.hypot(playerPos.x - nd.x, playerPos.z - nd.z);
      if (d < bestD) { bestD = d; best = nd; }
    }
    if (best) {
      return {
        pos: new THREE.Vector3(best.x, best.y || 0.25, best.z),
        label: best.kind === 'wood' ? '🪵 가까운 나무' : '🪨 가까운 바위'
      };
    }
    return { pos: new THREE.Vector3(site.x, sy, site.z), label: '⛰️ 반석 집터' };
  },

  teleportNearRockSite() {
    if (!this.active) return;
    const site = window.MIRACLE_GRAND_BEDROCK_POS || { x: 63, z: 18 };
    const tx = site.x - 10.5, tz = site.z + 4.0;
    const ty = (typeof getMiracleOpenWorldGroundHeight === 'function') ? getMiracleOpenWorldGroundHeight(tx, tz) : 0.25;
    if (typeof playerPos !== 'undefined' && playerPos) {
      playerPos.set(tx, ty, tz);
      if (typeof playerGroup !== 'undefined' && playerGroup) playerGroup.position.copy(playerPos);
      if (typeof snapCameraToPlayer === 'function') snapCameraToPlayer();
    }
    if (typeof playSfx === 'function') playSfx('jump');
    if (typeof showToast === 'function') showToast('⛰️ 확장된 반석 위의 집 건축 부지로 이동했어요!');
  },

  onOpenWorldBuilt() {
    if (!this.active) return;
    const site = window.MIRACLE_GRAND_BEDROCK_POS || { x: 63, z: 18 };
    const by = (typeof getMiracleOpenWorldGroundHeight === 'function') ? getMiracleOpenWorldGroundHeight(site.x, site.z) : 0.25;

    const siteGrp = new THREE.Group();
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(6.8, 7.6, 32),
      new THREE.MeshBasicMaterial({ color: 0x34d399, side: THREE.DoubleSide, transparent: true, opacity: 0.80 })
    );
    ring.rotation.x = -Math.PI * 0.5;
    ring.position.y = 0.86;
    siteGrp.add(ring);

    const houseGrp = new THREE.Group();
    houseGrp.position.y = 0.80;
    siteGrp.add(houseGrp);

    siteGrp.position.set(site.x, by, site.z);
    if (typeof worldGroup !== 'undefined' && worldGroup) worldGroup.add(siteGrp);

    if (this.mission.siteLabel) this.mission.siteLabel.remove();
    const sLbl = (typeof createWorldLabel === 'function')
      ? createWorldLabel(`🏗️ [협동] 반석 위의 집 (🪨${this.mission.stoneDeposited}/20 · 🪵${this.mission.woodDeposited}/20)`)
      : null;

    this.mission.siteGroup = siteGrp;
    this.mission.houseGroup = houseGrp;
    this.mission.siteRing = ring;
    this.mission.siteLabel = sLbl;
    this.mission.builtStage = -1;

    // 기존 접속 친구들 메시 다시 부착
    this.remotePlayers.forEach(rp => {
      if (rp.mesh && typeof worldGroup !== 'undefined' && worldGroup) worldGroup.add(rp.mesh);
    });

    this.rebuildGrandRockHouseVisuals();
    this.ensureMultiplayerHUD();
    const badge = document.getElementById('mp-online-badge');
    if (badge) badge.classList.remove('hidden');
    const hud = document.getElementById('miracle-mp-hud');
    if (hud) hud.classList.remove('hidden');
    const guideBtn = document.getElementById('miracle-guide-btn');
    if (guideBtn) guideBtn.classList.add('hidden');
    const guideBub = document.getElementById('miracle-guide-bubble');
    if (guideBub) guideBub.classList.add('hidden');
    if (typeof guideArrowGroup !== 'undefined' && guideArrowGroup) {
      guideArrowGroup.visible = false;
    }
    this.syncHUD();
  },

  rebuildGrandRockHouseVisuals() {
    const hGrp = this.mission.houseGroup;
    if (!hGrp) return;
    const total = this.mission.stoneDeposited + this.mission.woodDeposited;
    const done = (this.mission.stoneDeposited >= this.mission.stoneReq && this.mission.woodDeposited >= this.mission.woodReq);
    const stage = done ? 5 : (total >= 32 ? 4 : (total >= 22 ? 3 : (total >= 12 ? 2 : (total >= 4 ? 1 : 0))));
    if (stage === this.mission.builtStage) return;
    this.mission.builtStage = stage;

    while (hGrp.children.length > 0) hGrp.remove(hGrp.children[0]);

    const mkOrg = (w, h, d, col, x, y, z, seed) => {
      const geo = (typeof createOrganicBoxGeo === 'function')
        ? createOrganicBoxGeo(w, h, d, seed, 0.06, 0.96, 2)
        : new THREE.BoxGeometry(w, h, d);
      return createLowPolyMesh(geo, col, x, y, z, true);
    };

    // Stage 1: 반석 주춧돌 기초 & 네 모서리 석조 기둥
    if (stage >= 1) {
      hGrp.add(mkOrg(8.8, 0.65, 7.2, '#b8a993', 0, 0.32, 0, 910));
      [[-4.0, -3.2], [4.0, -3.2], [-4.0, 3.2], [4.0, 3.2]].forEach(([px, pz], i) => {
        hGrp.add(mkOrg(0.95, 2.2, 0.95, '#d4bc94', px, 1.4, pz, 915 + i));
      });
    }
    // Stage 2: 1층 견고한 비정형 석재 벽체 & 아치 목재 문
    if (stage >= 2) {
      hGrp.add(mkOrg(8.2, 3.4, 6.6, '#ead8b8', 0, 2.2, 0, 920));
      hGrp.add(mkOrg(1.9, 2.5, 0.35, '#6b3818', 0, 1.75, 3.35, 922));
      [-2.6, 2.6].forEach((wx, wi) => {
        const win = createLowPolyMesh(new THREE.BoxGeometry(1.1, 1.1, 0.22), '#f59e0b', wx, 2.35, 3.32, false);
        win.userData._emissiveGlow = true;
        hGrp.add(win);
      });
    }
    // Stage 3: 백향목 지붕 들보 + 1층 옥상 난간 + 측면 석재 계단
    if (stage >= 3) {
      hGrp.add(mkOrg(8.8, 0.36, 7.2, '#cfa972', 0, 4.05, 0, 925));
      for (let b = -3; b <= 3; b++) {
        const beam = createLowPolyMesh(new THREE.CylinderGeometry(0.12, 0.13, 7.45, 5), '#6b4226', b * 1.15, 3.84, 0, false);
        beam.rotation.x = Math.PI * 0.5;
        hGrp.add(beam);
      }
      // 동측 외벽 돌계단
      for (let s = 0; s < 6; s++) {
        hGrp.add(mkOrg(1.25, 0.42, 0.85, '#c6aa80', 4.85, 0.55 + s * 0.58, 2.2 - s * 0.72, 930 + s));
      }
    }
    // Stage 4: 2층 햇살 다락방 & 아마포 차양
    if (stage >= 4) {
      hGrp.add(mkOrg(5.4, 2.8, 4.4, '#f3e5cb', -1.2, 5.55, -0.8, 940));
      hGrp.add(mkOrg(5.8, 0.32, 4.8, '#d4bc94', -1.2, 7.05, -0.8, 942));
      const upWin = createLowPolyMesh(new THREE.BoxGeometry(1.3, 1.0, 0.22), '#fde047', -1.2, 5.65, 1.45, false);
      upWin.userData._emissiveGlow = true;
      hGrp.add(upWin);
      if (typeof createOrganicLinenAwningGroup === 'function' && typeof MIRACLE_LINEN_SHADES !== 'undefined') {
        const awn = createOrganicLinenAwningGroup(3.4, 1.8, MIRACLE_LINEN_SHADES[2], '#6b4226', 945, 0.18, true, 2.3);
        awn.position.set(2.2, 5.9, 1.2);
        hGrp.add(awn);
      }
    }
    // Stage 5: 완공된 영광의 반석 위의 집 (황금 지붕 테두리 + 등불 + 감람나무 화분)
    if (stage >= 5) {
      hGrp.add(mkOrg(6.0, 0.22, 5.0, '#eab308', -1.2, 7.28, -0.8, 950));
      [-3.8, 3.8].forEach((lx) => {
        const pot = createLowPolyMesh(new THREE.CylinderGeometry(0.32, 0.24, 0.45, 6), '#b86232', lx, 0.78, 3.9, false);
        const bush = createLowPolyMesh(new THREE.DodecahedronGeometry(0.42, 0), '#4d7c0f', lx, 1.24, 3.9, false);
        hGrp.add(pot, bush);
      });
      if (this.mission.siteRing && this.mission.siteRing.material) {
        this.mission.siteRing.material.color.setHex(0xfacc15);
      }
    }
  },

  spawnHitParticles(wx, wy, wz, colorHex) {
    for (let i = 0; i < 6; i++) {
      const p = createLowPolyMesh(
        new THREE.DodecahedronGeometry(0.12 + Math.random() * 0.08, 0),
        colorHex,
        wx + (Math.random() - 0.5) * 0.6,
        wy + 0.9 + Math.random() * 0.6,
        wz + (Math.random() - 0.5) * 0.6,
        false
      );
      if (typeof worldGroup !== 'undefined' && worldGroup) worldGroup.add(p);
      this.particles.push({
        mesh: p,
        vx: (Math.random() - 0.5) * 3.6,
        vy: 2.2 + Math.random() * 2.4,
        vz: (Math.random() - 0.5) * 3.6,
        life: 0.55
      });
    }
  },

  performContextAction() {
    if (!this.active || !this.nearestTarget) return;
    if (this.harvestCooldown > 0) return;

    const tgt = this.nearestTarget;
    if (tgt.kind === 'deliver') {
      const addStone = Math.min(this.mission.carryStone, this.mission.stoneReq - this.mission.stoneDeposited);
      const addWood = Math.min(this.mission.carryWood, this.mission.woodReq - this.mission.woodDeposited);
      if (addStone <= 0 && addWood <= 0) {
        if (typeof showToast === 'function') showToast('✨ 필요한 재료를 모두 모았어요!');
        return;
      }
      this.mission.stoneDeposited += addStone;
      this.mission.woodDeposited += addWood;
      this.mission.carryStone = Math.max(0, this.mission.carryStone - addStone);
      this.mission.carryWood = Math.max(0, this.mission.carryWood - addWood);
      if (typeof playerChopAnimTimer !== 'undefined') playerChopAnimTimer = 0.35;
      if (typeof playSfx === 'function') playSfx('build');
      const site = window.MIRACLE_GRAND_BEDROCK_POS || { x: 63, z: 18 };
      this.spawnHitParticles(site.x, getMiracleOpenWorldGroundHeight(site.x, site.z) + 1.0, site.z, '#facc15');
      this.saveRoomMissionToLocal();
      this.rebuildGrandRockHouseVisuals();
      this.syncHUD();
      this.broadcastMessage({
        type: 'mission_sync',
        peerId: this.peerId,
        stone: this.mission.stoneDeposited,
        wood: this.mission.woodDeposited,
        completed: this.mission.completed
      });

      if (typeof showToast === 'function') {
        showToast(`🏗️ 반석 위에 재료를 쌓았어요! (🪨 ${this.mission.stoneDeposited}/20 · 🪵 ${this.mission.woodDeposited}/20)`);
      }

      if (!this.mission.completed && this.mission.stoneDeposited >= this.mission.stoneReq && this.mission.woodDeposited >= this.mission.woodReq) {
        this.completeRockHouseMission();
      }
      this.harvestCooldown = 0.25;
      return;
    }

    // 나무 베기 (도끼질 5회 → 나무 1개) 또는 돌 캐기 (채굴 5회 → 돌 1개)
    const node = tgt.node;
    if (!node || node.depleted) return;

    const isWood = (node.kind === 'wood');
    if (isWood && this.mission.carryWood >= this.mission.maxCarryEach) {
      if (typeof showToast === 'function') showToast('🎒 나무를 가득(5개) 들었어요! 넓은 반석 부지에 먼저 가져다 놓으세요!');
      if (typeof playSfx === 'function') playSfx('wrong');
      return;
    }
    if (!isWood && this.mission.carryStone >= this.mission.maxCarryEach) {
      if (typeof showToast === 'function') showToast('🎒 돌을 가득(5개) 들었어요! 넓은 반석 부지에 먼저 가져다 놓으세요!');
      if (typeof playSfx === 'function') playSfx('wrong');
      return;
    }

    // 도끼질 / 돌 캐기 모션 발동!
    this.harvestCooldown = 0.24;
    if (typeof playerChopAnimTimer !== 'undefined') playerChopAnimTimer = 0.28;
    if (typeof playSfx === 'function') playSfx(isWood ? 'axe' : 'hammer');

    // 타격 시 나무/바위가 움찔거리는 탄성 피드백 + 파편 파티클
    node.hp = Math.max(0, node.hp - 1);
    const doneHits = node.maxHp - node.hp;
    if (node.mesh) {
      node.mesh.scale.set(node.baseScaleX * 0.92, node.baseScaleY * 1.04, node.baseScaleZ * 0.92);
      node._shakeTimer = 0.14;
    }
    this.spawnHitParticles(node.x, node.y, node.z, isWood ? '#a16207' : '#94a3b8');

    if (node.hp <= 0) {
      node.depleted = true;
      node.respawnTimer = 22.0;
      if (node.mesh) node.mesh.visible = false;
      if (isWood) {
        this.mission.carryWood++;
        if (typeof playSfx === 'function') playSfx('rescue');
        if (typeof showToast === 'function') showToast(`🪵 나무 1개 획득! (들고 있음 🪵${this.mission.carryWood}/${this.mission.maxCarryEach}) · 반석 부지에 쌓으세요!`);
      } else {
        this.mission.carryStone++;
        if (typeof playSfx === 'function') playSfx('rescue');
        if (typeof showToast === 'function') showToast(`🪨 돌 1개 획득! (들고 있음 🪨${this.mission.carryStone}/${this.mission.maxCarryEach}) · 반석 부지에 쌓으세요!`);
      }
      this.syncHUD();
    } else {
      if (typeof showToast === 'function') {
        showToast(isWood ? `🪓 탁! 나무 도끼질 (${doneHits}/5)` : `⛏️ 쾅! 바위 돌 캐기 (${doneHits}/5)`);
      }
    }
    this.updateHarvestButtonUI();
  },

  completeRockHouseMission() {
    this.mission.completed = true;
    this.saveRoomMissionToLocal();
    this.rebuildGrandRockHouseVisuals();
    this.syncHUD();
    this.broadcastMessage({
      type: 'mission_sync',
      peerId: this.peerId,
      stone: this.mission.stoneDeposited,
      wood: this.mission.woodDeposited,
      completed: true
    });

    // 완공된 대형 반석 위의 집 안에 갇히지 않도록 전면 안전 지대로 이동
    const site = window.MIRACLE_GRAND_BEDROCK_POS || { x: 63, z: 18 };
    const safeX = site.x - 10.5, safeZ = site.z + 5.5;
    if (typeof playerPos !== 'undefined' && playerPos && Math.hypot(playerPos.x - site.x, playerPos.z - site.z) < 9.0) {
      playerPos.set(safeX, getMiracleOpenWorldGroundHeight(safeX, safeZ), safeZ);
      if (typeof playerGroup !== 'undefined' && playerGroup) playerGroup.position.copy(playerPos);
      if (typeof snapCameraToPlayer === 'function') snapCameraToPlayer();
    }

    if (typeof playSfx === 'function') playSfx('clear');
    if (typeof openMiracleDialog === 'function') {
      openMiracleDialog({
        speaker: '예수님 · 반석 위의 집 완성!',
        category: 'word',
        badgeLabel: '📖 멀티플레이 협동 미션 완료 말씀',
        text: '"그러므로 누구든지 나의 이 말을 듣고 행하는 자는 그 집을 반석 위에 지은 지혜로운 사람 같으리니 비가 내리고 창수가 나고 바람이 불어 그 집에 부딪치되 무너지지 아니하나니 이는 주추를 반석 위에 놓은 까닭이요" (마태복음 7장 24~25절)',
        btnText: '🙌 아멘! 반석 위의 집 감상하기',
        replayText: '🔄 다시 함께 짓기',
        onReplay: () => this.resetRockHouseMission()
      });
    }
  },

  syncHUD() {
    const cntEl = document.getElementById('mp-online-count-text');
    const rmEl = document.getElementById('mp-online-room-text');
    const stEl = document.getElementById('mp-hud-stone');
    const wdEl = document.getElementById('mp-hud-wood');
    const progEl = document.getElementById('mp-hud-prog');
    const crEl = document.getElementById('mp-hud-carry');
    const onlineCount = 1 + this.remotePlayers.size;
    if (cntEl) cntEl.textContent = `접속 중 ${onlineCount}명`;
    if (rmEl) rmEl.textContent = `· ${this.roomId}`;
    if (stEl) stEl.textContent = `${this.mission.stoneDeposited}/${this.mission.stoneReq}`;
    if (wdEl) wdEl.textContent = `${this.mission.woodDeposited}/${this.mission.woodReq}`;
    if (progEl) {
      const pct = Math.min(100, Math.round(((this.mission.stoneDeposited + this.mission.woodDeposited) / (this.mission.stoneReq + this.mission.woodReq)) * 100));
      progEl.style.width = `${pct}%`;
    }
    if (crEl) {
      crEl.textContent = this.mission.completed
        ? '🎉 완공 완료!'
        : `🎒 🪨${this.mission.carryStone} · 🪵${this.mission.carryWood}`;
    }
    if (this.mission.siteLabel) {
      this.mission.siteLabel.innerHTML = this.mission.completed
        ? '🏠✨ [완공] 반석 위에 세운 지혜로운 집!'
        : `🏗️ [협동] 반석 위의 집 (🪨${this.mission.stoneDeposited}/20 · 🪵${this.mission.woodDeposited}/20)`;
    }
    this.positionRightHud();
  },

  updateHarvestButtonUI() {
    const wrap = document.getElementById('mp-harvest-btn-wrap');
    const btn = document.getElementById('mp-harvest-btn');
    if (!wrap || !btn) return;
    if (!this.active || !this.nearestTarget || (typeof miracleDialogState !== 'undefined' && miracleDialogState && miracleDialogState.active)) {
      wrap.classList.add('hidden');
      return;
    }
    wrap.classList.remove('hidden');
    const tgt = this.nearestTarget;
    if (tgt.kind === 'deliver') {
      btn.textContent = `🏗️ 반석 위에 쌓기! (🪨+${this.mission.carryStone} 🪵+${this.mission.carryWood})`;
      btn.className = 'mc-btn px-5 py-2.5 rounded-2xl bg-emerald-400 hover:bg-emerald-300 border-2 border-white text-slate-950 font-jua text-sm sm:text-base shadow-2xl animate-pulse';
    } else if (tgt.kind === 'wood') {
      const done = tgt.node.maxHp - tgt.node.hp;
      btn.textContent = `🪓 나무 도끼질 (${done}/5)`;
      btn.className = 'mc-btn px-5 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 border-2 border-white text-slate-950 font-jua text-sm sm:text-base shadow-2xl';
    } else {
      const done = tgt.node.maxHp - tgt.node.hp;
      btn.textContent = `⛏️ 바위 돌 캐기 (${done}/5)`;
      btn.className = 'mc-btn px-5 py-2.5 rounded-2xl bg-sky-400 hover:bg-sky-300 border-2 border-white text-slate-950 font-jua text-sm sm:text-base shadow-2xl';
    }
  },

  updateFrame(dt, now) {
    if (!this.active) return;

    if (this.harvestCooldown > 0) this.harvestCooldown = Math.max(0, this.harvestCooldown - dt);

    // 1) 채집 파티클 물리 업데이트
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.life -= dt;
      pt.vy -= 9.8 * dt;
      pt.mesh.position.x += pt.vx * dt;
      pt.mesh.position.y += pt.vy * dt;
      pt.mesh.position.z += pt.vz * dt;
      pt.mesh.rotation.y += dt * 7;
      if (pt.life <= 0) {
        if (typeof worldGroup !== 'undefined' && worldGroup) worldGroup.remove(pt.mesh);
        this.particles.splice(i, 1);
      }
    }

    // 1-B) 감정표현 신호 링 애니메이션 & 내 말풍선 화면 투영 위치 갱신
    for (let i = this.signalRings.length - 1; i >= 0; i--) {
      const sr = this.signalRings[i];
      sr.life -= dt;
      const p = 1 - Math.max(0, sr.life / sr.maxLife);
      const sc = 1.0 + p * 4.2;
      sr.mesh.scale.set(sc, sc, 1);
      if (sr.mat) sr.mat.opacity = Math.max(0, 0.9 * (1 - p));
      if (sr.life <= 0) {
        if (typeof worldGroup !== 'undefined' && worldGroup) worldGroup.remove(sr.mesh);
        this.signalRings.splice(i, 1);
      }
    }
    const localBub = document.getElementById('mp-local-bubble');
    if (this.localEmote && this.localEmote.timer > 0) {
      this.localEmote.timer -= dt;
      if (localBub && typeof camera !== 'undefined' && camera && typeof playerPos !== 'undefined' && playerPos) {
        const v = new THREE.Vector3(playerPos.x, playerPos.y + 2.55, playerPos.z);
        v.project(camera);
        if (v.z <= 1) {
          localBub.style.left = `${(v.x * 0.5 + 0.5) * window.innerWidth}px`;
          localBub.style.top = `${(-v.y * 0.5 + 0.5) * window.innerHeight}px`;
          localBub.classList.remove('hidden');
        } else {
          localBub.classList.add('hidden');
        }
      }
      if (this.localEmote.timer <= 0 && localBub) localBub.classList.add('hidden');
    }

    // 2) 채집 노드(나무/외곽 바위) 재생성 & 흔들림 복구 + 가장 가까운 인터랙션 대상 탐색
    const nodes = Array.isArray(window.miracleHarvestNodes) ? window.miracleHarvestNodes : [];
    let bestTarget = null;
    let bestDist = 4.2;

    // 반석 위의 집 재료 전달 범위 체크 우선 (반석 기반 충돌 외곽 바로 앞에서 쾌적하게 전달!)
    const site = window.MIRACLE_GRAND_BEDROCK_POS || { x: 63, z: 18 };
    const distSite = Math.hypot(playerPos.x - site.x, playerPos.z - site.z);
    if (this.mission.siteLabel && typeof updateWorldLabelPos === 'function') {
      const sy = getMiracleOpenWorldGroundHeight(site.x, site.z);
      updateWorldLabelPos(this.mission.siteLabel, new THREE.Vector3(site.x, sy + 2.4, site.z), distSite < 32.0);
    }
    if (!this.mission.completed && distSite < 10.6 && (this.mission.carryStone > 0 || this.mission.carryWood > 0)) {
      bestTarget = { kind: 'deliver', dist: distSite };
    } else if (!this.mission.completed) {
      for (let i = 0; i < nodes.length; i++) {
        const nd = nodes[i];
        if (nd._shakeTimer > 0) {
          nd._shakeTimer -= dt;
          if (nd._shakeTimer <= 0 && nd.mesh) {
            nd.mesh.scale.set(nd.baseScaleX, nd.baseScaleY, nd.baseScaleZ);
          }
        }
        if (nd.depleted) {
          nd.respawnTimer -= dt;
          if (nd.respawnTimer <= 0) {
            nd.depleted = false;
            nd.hp = nd.maxHp;
            if (nd.mesh) {
              nd.mesh.visible = true;
              nd.mesh.scale.set(nd.baseScaleX, nd.baseScaleY, nd.baseScaleZ);
            }
          }
          continue;
        }
        const d = Math.hypot(playerPos.x - nd.x, playerPos.z - nd.z);
        if (d < bestDist) {
          bestDist = d;
          bestTarget = { kind: nd.kind, node: nd, dist: d };
        }
      }
    }
    this.nearestTarget = bestTarget;
    this.updateHarvestButtonUI();

    // 3) 원격 접속 친구들 아바타 보간 & 타임아웃 정리
    const staleMs = 12000;
    let countChanged = false;
    this.remotePlayers.forEach((rp, pid) => {
      if (now - rp.lastSeen > staleMs) {
        if (rp.mesh && typeof worldGroup !== 'undefined' && worldGroup) worldGroup.remove(rp.mesh);
        if (rp.label) rp.label.remove();
        if (rp.bubble) rp.bubble.remove();
        this.remotePlayers.delete(pid);
        countChanged = true;
        return;
      }
      if (rp.mesh) {
        const prevX = rp.mesh.position.x, prevZ = rp.mesh.position.z;
        rp.mesh.position.lerp(rp.targetPos, Math.min(1, dt * 8.0));
        rp.mesh.rotation.y = (typeof lerpAngle === 'function') ? lerpAngle(rp.mesh.rotation.y, rp.rotY, dt * 10.0) : rp.rotY;
        const spd = Math.hypot(rp.mesh.position.x - prevX, rp.mesh.position.z - prevZ) / Math.max(0.001, dt);
        if (rp.chopping && typeof window.updateDiscipleSmoothPose === 'function') {
          window.updateDiscipleSmoothPose(rp.mesh, dt, now, 'chop', { skipBodyOffset: true });
        } else if (rp.emoteTimer > 2.2 && typeof window.updateDiscipleSmoothPose === 'function') {
          window.updateDiscipleSmoothPose(rp.mesh, dt, now, this._mapEmoteTextToAnimKind(rp.emote), { skipBodyOffset: true });
        } else if (typeof window.applyMiracleNpcLimbAnimation === 'function') {
          window.applyMiracleNpcLimbAnimation(rp.mesh, {
            speed: spd,
            isMoving: spd > 0.35,
            strideFactor: 1.45,
            legAmp: 0.64,
            armAmp: 0.56
          }, dt);
        } else {
          const u = rp.mesh.userData || {};
          const sw = spd > 0.4 ? Math.sin(now * 0.015) * 0.6 : 0;
          if (u.lLeg && u.rLeg) { u.lLeg.rotation.x = sw; u.rLeg.rotation.x = -sw; }
          if (u.lArm && u.rArm) {
            u.lArm.rotation.x = rp.chopping ? (-1.6 + Math.sin(now * 0.045) * 0.9) : (-sw * 0.55);
            u.rArm.rotation.x = sw * 0.55;
          }
        }
        if (rp.emoteTimer > 0) {
          rp.emoteTimer -= dt;
          if (rp.bubble && typeof camera !== 'undefined' && camera) {
            const bv = new THREE.Vector3(rp.mesh.position.x, rp.mesh.position.y + 2.75, rp.mesh.position.z);
            bv.project(camera);
            if (bv.z <= 1) {
              rp.bubble.style.left = `${(bv.x * 0.5 + 0.5) * window.innerWidth}px`;
              rp.bubble.style.top = `${(-bv.y * 0.5 + 0.5) * window.innerHeight}px`;
              rp.bubble.classList.remove('hidden');
            } else {
              rp.bubble.classList.add('hidden');
            }
          }
          if (rp.emoteTimer <= 0) {
            if (rp.label) rp.label.innerHTML = `🟢 ${rp.name}`;
            if (rp.bubble) rp.bubble.classList.add('hidden');
          }
        }
        if (rp.label && typeof updateWorldLabelPos === 'function') {
          const d = Math.hypot(playerPos.x - rp.mesh.position.x, playerPos.z - rp.mesh.position.z);
          updateWorldLabelPos(rp.label, new THREE.Vector3(rp.mesh.position.x, rp.mesh.position.y + 0.5, rp.mesh.position.z), d < 42);
        }
      }
    });
    if (countChanged) this.syncHUD();

    // 4) 내 위치·상태 주기적 송신 (BroadcastChannel 120ms 주기 + 선택적 Firebase REST 450ms 주기)
    this.syncTimer += dt;
    if (this.syncTimer >= 0.12) {
      this.syncTimer = 0;
      const myName = (typeof explorerDisplayName !== 'undefined' && explorerDisplayName) ? explorerDisplayName : (window.explorerName || '대원');
      const sel = window.selectedMiracleHeroPreset || { preset: 'hero', idx: 0 };
      this.broadcastMessage({
        type: 'state',
        peerId: this.peerId,
        name: myName,
        preset: sel.preset,
        idx: sel.idx,
        x: Number(playerPos.x.toFixed(2)),
        y: Number(playerPos.y.toFixed(2)),
        z: Number(playerPos.z.toFixed(2)),
        rotY: Number((typeof playerFacing !== 'undefined' ? playerFacing : 0).toFixed(2)),
        chopping: Boolean(typeof playerChopAnimTimer !== 'undefined' && playerChopAnimTimer > 0)
      });
    }

    // 선택적 Firebase Realtime DB 온라인 동기화 (MP_FIREBASE_DB_URL 설정 시 자동 작동)
    if (window.MP_FIREBASE_DB_URL && typeof fetch === 'function') {
      this.remoteSyncTimer += dt;
      if (this.remoteSyncTimer >= 0.45) {
        this.remoteSyncTimer = 0;
        this.syncWithFirebaseRelay();
      }
    }
  },

  async syncWithFirebaseRelay() {
    const base = String(window.MP_FIREBASE_DB_URL || '').replace(/\/+$/, '');
    if (!base) return;
    const roomKey = encodeURIComponent(this.roomId);
    const myName = (typeof explorerDisplayName !== 'undefined' && explorerDisplayName) ? explorerDisplayName : (window.explorerName || '대원');
    const sel = window.selectedMiracleHeroPreset || { preset: 'hero', idx: 0 };
    try {
      await fetch(`${base}/mp_rooms/${roomKey}/players/${this.peerId}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: myName, preset: sel.preset, idx: sel.idx,
          x: Number(playerPos.x.toFixed(2)), y: Number(playerPos.y.toFixed(2)), z: Number(playerPos.z.toFixed(2)),
          rotY: Number((typeof playerFacing !== 'undefined' ? playerFacing : 0).toFixed(2)),
          chopping: Boolean(typeof playerChopAnimTimer !== 'undefined' && playerChopAnimTimer > 0),
          lastEmote: (this.localEmote && this.localEmote.at) ? { text: this.localEmote.text, at: this.localEmote.at } : null,
          ts: Date.now()
        })
      });
      const res = await fetch(`${base}/mp_rooms/${roomKey}.json`);
      const data = await res.json();
      if (data && data.players) {
        Object.keys(data.players).forEach(pid => {
          const p = data.players[pid];
          if (!p || pid === this.peerId || Date.now() - (p.ts || 0) > 15000) return;
          this.handleIncomingMessage(Object.assign({ type: 'state', peerId: pid, roomId: this.roomId }, p));
        });
      }
      if (data && data.mission) {
        this.handleIncomingMessage(Object.assign({ type: 'mission_sync', peerId: 'relay', roomId: this.roomId }, data.mission));
      }
    } catch (e) {}
  }
};
window.MiracleMultiplayer = MiracleMultiplayer;
window.onMiracleClubLogoLoaded = function (clubKey) {
  MiracleMultiplayer.refreshPortraitForClubKey(clubKey);
};

// PC 키보드 [E] / [F] 키로 채집·건축 즉시 실행 지원
window.positionMultiplayerRightHud = function () {
  MiracleMultiplayer.positionRightHud();
};

if (!window.__miracleMpKeyBound) {
  window.__miracleMpKeyBound = true;
  window.addEventListener('keydown', (e) => {
    if (!MiracleMultiplayer.active) return;
    if (typeof miracleDialogState !== 'undefined' && miracleDialogState && miracleDialogState.active) return;
    if (e.code === 'KeyE' || e.code === 'KeyF') {
      e.preventDefault();
      MiracleMultiplayer.performContextAction();
    }
  });
}

// 오프닝 화면 [🌐 멀티 플레이] 버튼 클릭 핸들러 (이름/생일 검증 + 에피소드 4 완료 해금 검사!)
let _lastMpTap = 0;
window.safeOpenMultiplayerEntry = async function () {
  const now = Date.now();
  if (now - _lastMpTap < 250) return;
  _lastMpTap = now;

  const inputEl = document.getElementById('opening-name-input');
  const birthEl = document.getElementById('opening-birth-input');
  const warnEl = document.getElementById('opening-input-warn');
  const rawName = inputEl ? inputEl.value.trim() : '';
  const rawBirth = birthEl ? birthEl.value.replace(/[^0-9]/g, '').trim() : '';

  if (!rawName || rawBirth.length !== 4) {
    if (warnEl) {
      warnEl.classList.remove('hidden');
      warnEl.textContent = !rawName
        ? '⚠️ 탐험 대원 이름을 입력해 주세요!'
        : '⚠️ 생일 4자리 숫자(예: 0504)를 정확히 입력해 주세요!';
    }
    if (typeof playSfx === 'function') playSfx('wrong');
    if (typeof showToast === 'function') {
      showToast(!rawName ? '⚠️ 탐험 대원 이름을 입력해 주세요!' : '⚠️ 생일 4자리(예: 0504)를 입력해 주세요!');
    }
    return;
  }

  if (warnEl) warnEl.classList.add('hidden');
  if (typeof explorerDisplayName !== 'undefined') explorerDisplayName = rawName;
  if (typeof explorerBirth !== 'undefined') explorerBirth = rawBirth;
  window.explorerName = `${rawName}(${rawBirth})`;
  if (typeof explorerName !== 'undefined') explorerName = window.explorerName;

  if (typeof loadLocalPlayerProgress === 'function') loadLocalPlayerProgress(window.explorerName);
  if (typeof loadMiracleNotebookProgress === 'function') loadMiracleNotebookProgress();

  // 구글 시트 기록도 조회해 에피소드 4 완료 여부 최신 동기화
  if (!MiracleMultiplayer.isUnlocked() && typeof syncPlayerProgressFromSheet === 'function') {
    try { await syncPlayerProgressFromSheet(); } catch (e) {}
  }

  if (!MiracleMultiplayer.isUnlocked()) {
    if (warnEl) {
      warnEl.classList.remove('hidden');
      warnEl.textContent = '🔒 멀티플레이는 에피소드 4(예수님의 기적)까지 모두 완료해야 해금돼요!';
    }
    if (typeof playSfx === 'function') playSfx('wrong');
    if (typeof showToast === 'function') {
      showToast('🔒 멀티플레이는 에피소드 4까지 완료해야 입장할 수 있어요! 먼저 탐험을 완주해 주세요!');
    }
    return;
  }

  if (typeof requestGameFullscreen === 'function') requestGameFullscreen();
  if (typeof playSfx === 'function') playSfx('rescue');
  MiracleMultiplayer.openEntryModal();
};
