// =========================================================================
// [ep4_multiplayer.js] 에피소드 4 오픈월드 전용 온라인 멀티플레이 & 협동 미션 1 (반석 위의 집 확장형)
// - 에피소드 4 완료 시 해금 · 캐릭터 선택(예수님·천사 제외) · 방 코드 입장
// - BroadcastChannel / localStorage 즉시 동기화 + 선택적 Firebase Realtime DB 온라인 릴레이 지원
// - 멀티플레이 미션 1: 반석 위의 집 확장형 (돌 20 + 나무 20, 도끼질 5회 / 돌 캐기 5회, 완료 시 말씀 출력)
// =========================================================================
window.__GAME_BUILD_VERSIONS__ = window.__GAME_BUILD_VERSIONS__ || {};
window.__GAME_BUILD_VERSIONS__.ep4_mp = '20261120_v12';

// [선택적 온라인 릴레이 설정] 무료 Firebase Realtime Database URL을 넣으면 서로 다른 기기 간 실시간 온라인 접속!
// 예: window.MP_FIREBASE_DB_URL = 'https://your-church-game-default-rtdb.asia-southeast1.firebasedatabase.app';
window.MP_FIREBASE_DB_URL = window.MP_FIREBASE_DB_URL || 'https://gwangneung-bible-game-default-rtdb.asia-southeast1.firebasedatabase.app/';

// 멀티플레이 선택 가능 캐릭터 8종 (예수님 'jesus' 및 천사 'angel'은 절대 선택 불가!)
const MP_FORBIDDEN_PRESETS = ['jesus', 'angel'];
const MP_SELECTABLE_CHARACTERS = [
  { id: 'hero',       preset: 'hero',     idx: 0, icon: '🧔', name: '갈릴리 청년',    desc: '푸른 숄과 흰 두건' },
  { id: 'disciple_1', preset: 'disciple', idx: 1, icon: '🎣', name: '어부 제자',      desc: '따뜻한 황토 로브' },
  { id: 'disciple_2', preset: 'disciple', idx: 2, icon: '🌿', name: '올리브 목자',    desc: '올리브빛 숄' },
  { id: 'female_0',   preset: 'female_0', idx: 0, icon: '👩', name: '갈릴리 자매',    desc: '코랄 베일과 로브' },
  { id: 'female_1',   preset: 'female_1', idx: 1, icon: '🌸', name: '베다니 자매',    desc: '청록빛 숄' },
  { id: 'female_2',   preset: 'female_2', idx: 2, icon: '🧺', name: '나사렛 자매',    desc: '황금빛 베일' },
  { id: 'child_0',    preset: 'child',    idx: 0, icon: '👦', name: '꼬마 탐험가(남)', desc: '씩씩한 소년 대원' },
  { id: 'child_1',    preset: 'child',    idx: 1, icon: '👧', name: '꼬마 탐험가(여)', desc: '활발한 소녀 대원' }
];
window.MP_SELECTABLE_CHARACTERS = MP_SELECTABLE_CHARACTERS;
window.MP_FORBIDDEN_PRESETS = MP_FORBIDDEN_PRESETS;

window.isMiracleMultiplayerMode = false;

const MiracleMultiplayer = {
  active: false,
  peerId: 'mp_' + Math.random().toString(36).slice(2, 10),
  roomId: '광릉내1방',
  selectedCharId: 'hero',
  channel: null,
  syncTimer: 0,
  remoteSyncTimer: 0,
  remotePlayers: new Map(), // peerId -> { name, preset, idx, mesh, label, targetPos, rotY, lastSeen, chopping, emote, emoteTimer }
  particles: [],
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
    this.selectCharacter(charId);
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

  selectCharacter(charId) {
    const cfg = this.getCharConfig(charId);
    this.selectedCharId = cfg.id;
    window.selectedMiracleHeroPreset = { preset: cfg.preset, idx: cfg.idx };
    const cards = document.querySelectorAll('#mp-char-grid button[data-char-id]');
    cards.forEach(btn => {
      const isSel = btn.dataset.charId === cfg.id;
      btn.className = isSel
        ? 'mc-btn p-2 rounded-2xl bg-amber-300 border-2 border-amber-700 text-amber-950 text-left shadow-md scale-[1.02]'
        : 'mc-btn p-2 rounded-2xl bg-white/90 hover:bg-amber-50 border-2 border-amber-200 text-slate-800 text-left';
    });
    if (typeof playSfx === 'function') playSfx('switch');
  },

  ensureEntryModal() {
    let modal = document.getElementById('mp-entry-modal');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'mp-entry-modal';
    modal.className = 'hidden fixed inset-0 z-50 items-center justify-center p-2.5 sm:p-4 bg-slate-950/75 backdrop-blur-sm';
    const charCardsHtml = MP_SELECTABLE_CHARACTERS.map(c => `
      <button type="button" data-char-id="${c.id}" onclick="window.MiracleMultiplayer.selectCharacter('${c.id}')"
              class="mc-btn p-2 rounded-2xl bg-white/90 hover:bg-amber-50 border-2 border-amber-200 text-slate-800 text-left">
        <div class="flex items-center gap-1.5">
          <span class="text-xl leading-none">${c.icon}</span>
          <div class="min-w-0">
            <div class="font-jua text-xs sm:text-sm truncate">${c.name}</div>
            <div class="text-[10px] text-slate-500 truncate">${c.desc}</div>
          </div>
        </div>
      </button>
    `).join('');

    modal.innerHTML = `
      <div class="mc-card modal-scroll w-full max-w-lg rounded-3xl p-4 sm:p-5 text-center">
        <div class="flex items-center justify-between border-b-2 border-amber-300 pb-2 mb-3">
          <div class="text-left">
            <span class="inline-block px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-950 font-jua text-[10px]">🌐 에피소드 4 오픈월드 협동</span>
            <h2 class="font-jua text-lg sm:text-xl text-amber-950 mt-0.5">멀티플레이 캐릭터 & 방 입장</h2>
          </div>
          <button type="button" onclick="window.MiracleMultiplayer.closeEntryModal()"
                  class="mc-btn px-3 py-1 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-jua text-xs">닫기 ✕</button>
        </div>

        <div class="bg-amber-50/90 border-2 border-amber-300 rounded-2xl p-2.5 mb-3 text-left">
          <label for="mp-room-input" class="block font-jua text-xs text-amber-900 mb-1">🏠 함께 들어갈 방 이름 (같은 방 이름 입력 시 친구와 연결)</label>
          <input id="mp-room-input" type="text" maxlength="16" value="광릉내1방"
                 style="user-select: text; -webkit-user-select: text; touch-action: auto;"
                 class="w-full px-3 py-1.5 rounded-xl border-2 border-amber-400 bg-white font-bold text-slate-900 text-sm" />
        </div>

        <div class="text-left mb-3">
          <div class="flex items-center justify-between mb-1.5">
            <span class="font-jua text-xs sm:text-sm text-amber-950">🎭 캐릭터 선택 (8종 · 예수님/천사 제외)</span>
            <span class="text-[10px] text-slate-500">미션 1: 반석 위의 집 확장형</span>
          </div>
          <div id="mp-char-grid" class="grid grid-cols-2 gap-2">${charCardsHtml}</div>
        </div>

        <div class="p-2.5 rounded-2xl bg-sky-50 border border-sky-300 text-left text-[11px] text-sky-950 mb-3 leading-snug">
          <b>🏗️ 협동 미션 1 — 반석 위의 집 확장형:</b><br/>
          외곽 나무(도끼질 5회 → 🪵나무 1)와 큼직한 바위(채굴 5회 → 🪨돌 1)를 캐서 <b>돌 20개 + 나무 20개</b>를 넓은 반석 위에 함께 모아 멋진 집을 세워 보세요!
        </div>

        <button id="mp-enter-world-btn" type="button" onclick="window.MiracleMultiplayer.enterMultiplayerWorld()"
                class="mc-btn w-full py-2.5 sm:py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-jua text-base sm:text-lg shadow-lg">
          🌐 멀티플레이 오픈월드 입장하기!
        </button>
      </div>
    `;
    document.body.appendChild(modal);
    this.selectCharacter(this.selectedCharId);
    return modal;
  },

  ensureMultiplayerHUD() {
    let hud = document.getElementById('miracle-mp-hud');
    if (hud) return hud;
    hud = document.createElement('div');
    hud.id = 'miracle-mp-hud';
    hud.className = 'hidden fixed right-2 sm:right-3 z-20 flex flex-col items-end gap-1.5 pointer-events-auto';
    hud.style.top = '88px';
    hud.innerHTML = `
      <div class="w-[218px] sm:w-[248px] p-2.5 rounded-2xl bg-slate-900/88 border-2 border-emerald-400 text-white shadow-xl backdrop-blur-sm text-left">
        <div class="flex items-center justify-between gap-1 mb-1">
          <span id="mp-hud-room" class="font-jua text-[11px] sm:text-xs text-emerald-300 truncate">🌐 광릉내1방 · 1명</span>
          <button type="button" onclick="window.MiracleMultiplayer.exitToOpening()"
                  class="px-1.5 py-0.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-[10px] font-jua text-slate-200 shrink-0">나가기</button>
        </div>
        <div class="font-jua text-xs text-amber-300 mb-1">🏗️ 협동: 반석 위의 집 확장형</div>
        <div class="grid grid-cols-2 gap-1.5 mb-1.5">
          <div class="px-2 py-1 rounded-xl bg-slate-800 border border-slate-600 text-center">
            <div class="text-[10px] text-slate-300">🪨 돌</div>
            <div id="mp-hud-stone" class="font-jua text-xs text-sky-300">0 / 20</div>
          </div>
          <div class="px-2 py-1 rounded-xl bg-slate-800 border border-slate-600 text-center">
            <div class="text-[10px] text-slate-300">🪵 나무</div>
            <div id="mp-hud-wood" class="font-jua text-xs text-amber-300">0 / 20</div>
          </div>
        </div>
        <div id="mp-hud-carry" class="text-[10px] text-emerald-200 font-bold mb-1.5">🎒 들고 있음: 🪨0 · 🪵0 (반석에 놓기)</div>
        <div class="flex items-center justify-between gap-1">
          <button type="button" onclick="window.MiracleMultiplayer.sendEmote('👋 안녕!')" class="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px]">👋</button>
          <button type="button" onclick="window.MiracleMultiplayer.sendEmote('🙌 같이 해요!')" class="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px]">🙌</button>
          <button type="button" onclick="window.MiracleMultiplayer.sendEmote('🏗️ 여기로!')" class="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px]">🏗️</button>
          <button type="button" onclick="window.MiracleMultiplayer.teleportNearRockSite()" class="px-2 py-0.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-jua text-[10px] flex-1">⛰️ 반석으로</button>
        </div>
      </div>
    `;
    document.body.appendChild(hud);

    // 채집(나무 도끼질 5회 / 돌 캐기 5회) & 반석 재료 놓기 전용 하단 액션 버튼
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
    return hud;
  },

  openEntryModal() {
    const modal = this.ensureEntryModal();
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    this.selectCharacter(this.selectedCharId);
  },

  closeEntryModal() {
    const modal = document.getElementById('mp-entry-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  },

  enterMultiplayerWorld(forcedRoomId, forcedCharId) {
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

    if (typeof playSfx === 'function') playSfx('clear');
    if (typeof showToast === 'function') {
      showToast(`🌐 [${this.roomId}] 멀티플레이 입장! 나무(5회 도끼질)·돌(5회 채굴)을 각 20개 모아 반석 위의 집을 완성하세요!`);
    }
  },

  exitToOpening() {
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
    });
    this.remotePlayers.clear();

    const hud = document.getElementById('miracle-mp-hud');
    if (hud) hud.classList.add('hidden');
    const actWrap = document.getElementById('mp-harvest-btn-wrap');
    if (actWrap) actWrap.classList.add('hidden');
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
        rp = {
          peerId: msg.peerId,
          name: msg.name || '친구',
          preset: safePreset,
          idx: msg.idx || 0,
          mesh,
          label: lbl,
          targetPos: new THREE.Vector3(px, py, pz),
          rotY: msg.rotY || 0,
          chopping: false,
          emote: '',
          emoteTimer: 0,
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
    }

    if (msg.type === 'emote') {
      const rp = this.remotePlayers.get(msg.peerId);
      if (rp) {
        rp.emote = String(msg.text || '');
        rp.emoteTimer = 3.2;
        if (rp.label) rp.label.innerHTML = `🟢 ${rp.name} · ${rp.emote}`;
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

  sendEmote(text) {
    if (!this.active) return;
    if (typeof playSfx === 'function') playSfx('switch');
    if (typeof showToast === 'function') showToast(`💬 나: ${text}`);
    this.broadcastMessage({ type: 'emote', peerId: this.peerId, text });
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
    const hud = document.getElementById('miracle-mp-hud');
    if (hud) hud.classList.remove('hidden');
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
    const roomEl = document.getElementById('mp-hud-room');
    const stEl = document.getElementById('mp-hud-stone');
    const wdEl = document.getElementById('mp-hud-wood');
    const crEl = document.getElementById('mp-hud-carry');
    const onlineCount = 1 + this.remotePlayers.size;
    if (roomEl) roomEl.textContent = `🌐 ${this.roomId} · ${onlineCount}명`;
    if (stEl) stEl.textContent = `${this.mission.stoneDeposited} / ${this.mission.stoneReq}`;
    if (wdEl) wdEl.textContent = `${this.mission.woodDeposited} / ${this.mission.woodReq}`;
    if (crEl) {
      crEl.textContent = this.mission.completed
        ? '🎉 반석 위의 집 완공 완료!'
        : `🎒 들고 있음: 🪨${this.mission.carryStone} · 🪵${this.mission.carryWood} (최대 각 ${this.mission.maxCarryEach})`;
    }
    if (this.mission.siteLabel) {
      this.mission.siteLabel.innerHTML = this.mission.completed
        ? '🏠✨ [완공] 반석 위에 세운 지혜로운 집!'
        : `🏗️ [협동] 반석 위의 집 (🪨${this.mission.stoneDeposited}/20 · 🪵${this.mission.woodDeposited}/20)`;
    }
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

    // 2) 채집 노드(나무/외곽 바위) 재생성 & 흔들림 복구 + 가장 가까운 인터랙션 대상 탐색
    const nodes = Array.isArray(window.miracleHarvestNodes) ? window.miracleHarvestNodes : [];
    let bestTarget = null;
    let bestDist = 4.2;

    // 반석 위의 집 재료 전달 범위 체크 우선
    const site = window.MIRACLE_GRAND_BEDROCK_POS || { x: 63, z: 18 };
    const distSite = Math.hypot(playerPos.x - site.x, playerPos.z - site.z);
    if (this.mission.siteLabel && typeof updateWorldLabelPos === 'function') {
      const sy = getMiracleOpenWorldGroundHeight(site.x, site.z);
      updateWorldLabelPos(this.mission.siteLabel, new THREE.Vector3(site.x, sy + 2.4, site.z), distSite < 32.0);
    }
    if (!this.mission.completed && distSite < 10.2 && (this.mission.carryStone > 0 || this.mission.carryWood > 0)) {
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
        this.remotePlayers.delete(pid);
        countChanged = true;
        return;
      }
      if (rp.mesh) {
        const prevX = rp.mesh.position.x, prevZ = rp.mesh.position.z;
        rp.mesh.position.lerp(rp.targetPos, Math.min(1, dt * 8.0));
        rp.mesh.rotation.y = (typeof lerpAngle === 'function') ? lerpAngle(rp.mesh.rotation.y, rp.rotY, dt * 10.0) : rp.rotY;
        const spd = Math.hypot(rp.mesh.position.x - prevX, rp.mesh.position.z - prevZ) / Math.max(0.001, dt);
        const u = rp.mesh.userData || {};
        const sw = spd > 0.4 ? Math.sin(now * 0.015) * 0.6 : 0;
        if (u.lLeg && u.rLeg) { u.lLeg.rotation.x = sw; u.rLeg.rotation.x = -sw; }
        if (u.lArm && u.rArm) {
          u.lArm.rotation.x = rp.chopping ? (-1.6 + Math.sin(now * 0.045) * 0.9) : (-sw * 0.55);
          u.rArm.rotation.x = sw * 0.55;
        }
        if (rp.emoteTimer > 0) {
          rp.emoteTimer -= dt;
          if (rp.emoteTimer <= 0 && rp.label) rp.label.innerHTML = `🟢 ${rp.name}`;
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

// PC 키보드 [E] / [F] 키로 채집·건축 즉시 실행 지원
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
