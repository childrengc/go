// =========================================================================
// [ep4_miracle_stages.js - 파트 1/2] 에피소드 4 : 메인 스테이지 1 · 2 · 3
// - 오픈월드 각 스테이지 시작 지점의 지형·해안선·마을 전경·외곽 낮은 언덕·태양 그림자를 그대로 이어받아 구성
// - 스테이지 3(십자가 사건): 넓어진 골고다 언덕 정상 고원과 세 십자가 등장 연출 적용
// =========================================================================
window.__GAME_BUILD_VERSIONS__ = window.__GAME_BUILD_VERSIONS__ || {};
window.__GAME_BUILD_VERSIONS__.ep4_stages = '20261120_v13';

// 스테이지 3: 예수님과 플레이어가 무거운 십자가를 지고 걷는 통일 속도 (아무리 세게 터치해도 이 속도로 제한!)
const MIRACLE_STAGE3_CROSS_WALK_SPEED = 1.65;

let miracleStageObjects = [];
let miracleStageCutscene = { active: false, timer: 0, stageNum: 0 };

// 스테이지 내부 머리 위 태그 근접 표시 기준 거리
const MIRACLE_STAGE_TAG_DIST = 11.5;

// 스테이지별 지형 고도 계산기 (오픈월드 각 시작 지점의 경사와 높이를 그대로 반영)
window.getMiracleGroundHeight = function (x, z, st) {
  if (miracleSubMode === 'openworld') {
    return window.getMiracleOpenWorldGroundHeight(x, z);
  }
  if (miracleSubMode === 'main2_loaves') {
    // 동북쪽 외곽 오병이어 전망 언덕: 남쪽 마을 입구(z = 32, y = 0.5)에서 북쪽 언덕 정상(z = -26, y = 13.5)으로 완만하게 융기
    const hillT = Math.max(0, Math.min(1, (32 - z) / 62));
    const bump = Math.sin(x * 0.14) * Math.cos(z * 0.14) * 0.38;
    return Number((0.4 + hillT * hillT * (3 - 2 * hillT) * 13.2 + hillT * bump).toFixed(3));
  }
  if (miracleSubMode === 'main3_cross') {
    // 예루살렘 평지 돌길(z > -8)에서 넓어진 골고다 언덕 정상 고원(z <= -46, y = 9.4)으로 이어지는 오르막 지형
    if (z <= -8) {
      const climbT = Math.max(0, Math.min(1, (-8 - z) / 38));
      const smoothClimb = climbT * climbT * (3 - 2 * climbT);
      const bump = Math.sin(x * 0.14) * Math.cos(z * 0.14) * 0.25;
      return Number((smoothClimb * 9.4 + climbT * bump).toFixed(3));
    }
    return 0;
  }
  if (miracleSubMode === 'ascension') {
    // 감람산 승천 언덕 정상부 + 서쪽 예루살렘 골짜기 경사면(x < -28)을 지형 메쉬와 100% 일치시켜 원경 건물 들뜸 완벽 해소!
    if (x < -28) {
      return Number(Math.max(-8.0, (x + 28) * 0.18).toFixed(3));
    }
    const dist = Math.hypot(x / 32, (z + 4) / 32);
    const dome = Math.max(0, 1.0 - dist * dist) * 2.2;
    return Number(dome.toFixed(3));
  }
  return 0;
};

// 월드맵 에피소드 4 선택 모달에서 2회차/해금 플레이어가 특정 메인 스테이지로 바로 진입하는 헬퍼
window.startMiracleDirectSubStage = function (subId) {
  currentEpisode = 'miracle';
  const stageMap = { main1_boat: 1, main1_galilee: 1, main2_loaves: 2, main3_cross: 3, main4_tomb: 4 };
  const stNum = stageMap[subId] || 1;
  currentStage = stNum;
  enteredFromMapStageSelect = true;
  currentRunCanIssueCert = false;
  isPlaying = true;
  if (typeof loadMiracleNotebookProgress === 'function') loadMiracleNotebookProgress();
  document.getElementById('hud-top').classList.remove('hidden');
  document.getElementById('hud-mode-btn').textContent = `${MODE_META[currentMode].badge} · 🗺️맵`;
  document.getElementById('joystick-zone').style.display = 'block';
  document.getElementById('cam-bottom-bar').style.display = 'flex';
  document.getElementById('action-zone').style.display = 'flex';
  if (typeof stopMiracleOpenWorldOgg === 'function') stopMiracleOpenWorldOgg(false);
  miracleStageCutscene.active = false;
  miracleStageObjects = [];
  if (stNum === 1) buildMiracleMainStage1Galilee();
  else if (stNum === 2) buildMiracleMainStage2Loaves();
  else if (stNum === 3) buildMiracleMainStage3Cross();
  else if (stNum === 4) buildMiracleMainStage4Tomb();
  updateMiracleNotebookHudBadge();
  updateStageHUD();
  startStageBgm(stNum);
};

// -------------------------------------------------------------------------
// 1. 오픈월드 스팟 -> 본 스테이지 화면 전환 진입기 (중복 진입 방지 + 화이트페이드 안전 해제)
// -------------------------------------------------------------------------
let _isEnteringMiracleStage = false;

function enterMiracleMainStage(stageNum) {
  if (typeof miracleActiveFieldEvent !== 'undefined' && miracleActiveFieldEvent) {
    if (typeof showToast === 'function') showToast('⚠️ 진행 중인 미션을 먼저 완료한 뒤 스테이지에 입장할 수 있어요!');
    return;
  }
  if (_isEnteringMiracleStage) return;
  _isEnteringMiracleStage = true;

  if (typeof stopMiracleOpenWorldOgg === 'function') stopMiracleOpenWorldOgg(false);
  const s1Ui = document.getElementById('miracle-s1-ui');
  if (s1Ui) s1Ui.classList.add('hidden');
  const wf = document.getElementById('white-fade');
  if (wf) wf.style.opacity = '0.92';
  playSfx('dove');

  setTimeout(() => {
    try {
      currentStage = stageNum;
      miracleStageCutscene.active = false;
      miracleStageObjects = [];

      if (currentMode === 'timeattack') {
        timeRemaining = stageNum === 1 ? 52.0 : (stageNum === 2 ? 54.0 : (stageNum === 3 ? 48.0 : 48.0));
        timeAttackFirstRechargeUsed = false;
        isTimeAttackActive = true;
        const timerBox = document.getElementById('hud-timer-box');
        if (timerBox) { timerBox.classList.remove('hidden'); timerBox.classList.add('flex'); }
      } else {
        isTimeAttackActive = false;
      }

      if (stageNum === 1) buildMiracleMainStage1Galilee();
      else if (stageNum === 2) buildMiracleMainStage2Loaves();
      else if (stageNum === 3 && typeof buildMiracleMainStage3Cross === 'function') buildMiracleMainStage3Cross();
      else if (stageNum === 4 && typeof buildMiracleMainStage4Tomb === 'function') buildMiracleMainStage4Tomb();

      updateMiracleNotebookHudBadge();
      updateStageHUD();
      startStageBgm(stageNum);
    } catch (err) {
      console.error('[EP4 enterMiracleMainStage Error]', err);
      if (typeof showToast === 'function') {
        showToast('⚠️ 화면을 불러오는 중 문제가 발생해 오픈월드로 복구합니다.');
      }
      if (typeof buildMiracleOpenWorld === 'function') {
        try { buildMiracleOpenWorld(true); } catch (e2) {}
      }
    } finally {
      setTimeout(() => {
        if (wf) wf.style.opacity = '0';
        _isEnteringMiracleStage = false;
      }, 240);
    }
  }, 360);
}

function resetMiracleBoatRockingTransform() {
  if (worldGroup) {
    worldGroup.rotation.set(0, 0, 0);
    worldGroup.position.set(0, 0, 0);
  }
  if (playerGroup) {
    playerGroup.rotation.x = 0;
    playerGroup.rotation.z = 0;
  }
}

// 스테이지 1 미니게임(그물 던지기 & 풍랑 균형 잡기) 진행 중 조이스틱 이동 잠금 연동
const _prevIsPlayerMovementLockedForStages = window.isPlayerMovementLocked;
window.isPlayerMovementLocked = function () {
  let locked = false;
  if (typeof _prevIsPlayerMovementLockedForStages === 'function') {
    locked = _prevIsPlayerMovementLockedForStages();
  }
  if (miracleSubMode === 'main1_galilee' && miracleActiveMiniState) {
    const ph = miracleActiveMiniState.phase;
    if (ph === 'cast_net' || ph === 'storm_balance' || ph === 'calm') {
      return true;
    }
  }
  if (miracleSubMode === 'main2_loaves' && miracleActiveMiniState && miracleActiveMiniState.introFlyover && miracleActiveMiniState.introFlyover.active) {
    return true;
  }
  if (miracleSubMode === 'ascension' && typeof miracleAscensionState !== 'undefined' && miracleAscensionState.active) {
    return true;
  }
  return locked;
};

// -------------------------------------------------------------------------
// 2. [메인 스테이지 1] 갈릴리 바다 전면 리뉴얼
//    - 디테일한 다단 곡선 갈릴리 목선 내부 탑승 표현 (늑골·갑판판재·노·돛·로프·고물 베개·어망 바구니)
//    - 1단계: 터치(누르고 있기)로 게이지 채워 놓아 바다에 3D 그물 던지기
//    - 2단계: 풍랑 중 배가 기울면 반대쪽 터치로 균형 잡기 + 고물 베개에 누워 주무시는 예수님
//    - 3단계: 주무시는 예수님 깨우기 -> 예수님이 일어나 풍랑을 잠잠케 하심
// -------------------------------------------------------------------------
let _miracleS1KeyBound = false;

function ensureMiracleStage1UI() {
  let root = document.getElementById('miracle-s1-ui');
  if (!root) {
    root = document.createElement('div');
    root.id = 'miracle-s1-ui';
    root.className = 'hidden fixed inset-x-0 bottom-3 sm:bottom-5 z-30 flex flex-col items-center pointer-events-none px-3 select-none';
    root.innerHTML = `
      <!-- 1단계: 그물 던지기 게이지 패널 -->
      <div id="ms1-cast-panel" class="hidden pointer-events-auto w-full max-w-md bg-slate-900/85 backdrop-blur-md border-2 border-sky-400/80 rounded-2xl p-3 shadow-2xl text-white">
        <div class="flex items-center justify-between text-xs sm:text-sm font-bold mb-1.5">
          <span id="ms1-cast-title" class="text-sky-200">🎣 그물 던지기 (0/4)</span>
          <span id="ms1-cast-hint" class="text-emerald-300">초록 구간에서 손을 떼세요!</span>
        </div>
        <div class="relative h-6 w-full rounded-full bg-slate-800 border border-slate-600 overflow-hidden mb-2.5">
          <div id="ms1-cast-sweet" class="absolute top-0 bottom-0 bg-emerald-400/75 border-x-2 border-emerald-200" style="left:40%;width:20%;"></div>
          <div id="ms1-cast-fill" class="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-sky-400 to-amber-300 opacity-75" style="width:0%;"></div>
          <div id="ms1-cast-needle" class="absolute top-0 bottom-0 w-1.5 bg-white shadow-[0_0_8px_#fff] rounded-full" style="left:0%;"></div>
        </div>
        <button id="ms1-cast-btn" type="button" style="touch-action:none;"
          class="mc-btn w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 active:scale-95 text-white font-jua text-base sm:text-lg shadow-lg border-2 border-sky-200">
          🎣 꾹 눌러 힘 모으기 → 놓아서 그물 던지기!
        </button>
      </div>

      <!-- 2단계: 풍랑 균형 잡기 패널 -->
      <div id="ms1-bal-panel" class="hidden pointer-events-auto w-full max-w-lg bg-slate-900/88 backdrop-blur-md border-2 border-amber-400/80 rounded-2xl p-3 shadow-2xl text-white">
        <div class="flex items-center justify-between text-xs sm:text-sm font-bold mb-1">
          <span class="text-amber-300">⛈️ 풍랑 속 균형 잡기</span>
          <span id="ms1-bal-prog-txt" class="text-emerald-300">버티기 0%</span>
        </div>
        <div class="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden mb-2">
          <div id="ms1-bal-prog-bar" class="h-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-100" style="width:0%;"></div>
        </div>
        <div id="ms1-bal-warn" class="text-center font-jua text-xs sm:text-sm text-amber-200 mb-1.5">
          ⛵ 배가 기울면 반대쪽 버튼을 눌러 균형을 잡으세요!
        </div>
        <div class="relative h-6 w-full rounded-full bg-slate-800 border border-slate-600 overflow-hidden mb-2.5">
          <div class="absolute top-0 bottom-0 left-[32%] w-[36%] bg-emerald-500/35 border-x border-emerald-300/60"></div>
          <div class="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/50"></div>
          <div id="ms1-bal-marker" class="absolute top-0.5 bottom-0.5 w-8 -ml-4 rounded-full bg-amber-300 text-slate-900 font-bold text-xs flex items-center justify-center shadow" style="left:50%;">⛵</div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <button id="ms1-bal-left" type="button" style="touch-action:none;"
            class="mc-btn py-3.5 rounded-xl bg-sky-600 active:scale-95 text-white font-jua text-base sm:text-lg border-2 border-sky-300 shadow-lg">
            ◀ 왼쪽으로 중심!
          </button>
          <button id="ms1-bal-right" type="button" style="touch-action:none;"
            class="mc-btn py-3.5 rounded-xl bg-sky-600 active:scale-95 text-white font-jua text-base sm:text-lg border-2 border-sky-300 shadow-lg">
            오른쪽으로 중심! ▶
          </button>
        </div>
      </div>

      <!-- 3단계: 주무시는 예수님 깨우기 버튼 -->
      <div id="ms1-wake-panel" class="hidden pointer-events-auto w-full max-w-md bg-slate-900/88 backdrop-blur-md border-2 border-yellow-300 rounded-2xl p-3 shadow-2xl text-white text-center">
        <p class="font-jua text-sm text-yellow-200 mb-2">😴 거센 풍랑 속에서도 예수님이 고물 베개에 누워 주무시고 계세요!</p>
        <button id="ms1-wake-btn" type="button"
          class="mc-btn w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 font-jua text-base sm:text-lg shadow-lg border-2 border-yellow-100 animate-pulse">
          🙏 주무시는 예수님 깨우기! ("주여, 구원하소서!")
        </button>
      </div>
    `;
    document.body.appendChild(root);

    // 1단계 그물 버튼 포인터 이벤트
    const castBtn = root.querySelector('#ms1-cast-btn');
    const startCastCharge = (e) => {
      if (e) e.preventDefault();
      if (miracleSubMode !== 'main1_galilee' || !miracleActiveMiniState) return;
      const st = miracleActiveMiniState;
      if (st.phase !== 'cast_net' || st.netInFlight) return;
      st.isCharging = true;
      st.chargeVal = 0.02;
      st.chargeDir = 1;
      playSfx('step');
    };
    const releaseCastCharge = (e) => {
      if (e) e.preventDefault();
      if (miracleSubMode !== 'main1_galilee' || !miracleActiveMiniState) return;
      const st = miracleActiveMiniState;
      if (st.phase !== 'cast_net' || !st.isCharging) return;
      st.isCharging = false;
      launchGalileeFishingNet(st.chargeVal);
    };
    castBtn.addEventListener('pointerdown', startCastCharge);
    window.addEventListener('pointerup', releaseCastCharge);
    window.addEventListener('pointercancel', releaseCastCharge);

    // 2단계 좌/우 균형 버튼 포인터 이벤트 (탭 즉시 힘 + 꾹 누르기 연속 힘)
    const leftBtn = root.querySelector('#ms1-bal-left');
    const rightBtn = root.querySelector('#ms1-bal-right');
    const pressBalance = (side) => (e) => {
      if (e) e.preventDefault();
      if (miracleSubMode !== 'main1_galilee' || !miracleActiveMiniState) return;
      const st = miracleActiveMiniState;
      if (st.phase !== 'storm_balance') return;
      if (side < 0) st.holdLeft = true; else st.holdRight = true;
      st.boatTilt = THREE.MathUtils.clamp(st.boatTilt + side * 0.14, -1.0, 1.0);
      playSfx('step');
    };
    const releaseBalance = (side) => () => {
      if (!miracleActiveMiniState) return;
      if (side < 0) miracleActiveMiniState.holdLeft = false;
      else miracleActiveMiniState.holdRight = false;
    };
    leftBtn.addEventListener('pointerdown', pressBalance(-1));
    leftBtn.addEventListener('pointerup', releaseBalance(-1));
    leftBtn.addEventListener('pointerleave', releaseBalance(-1));
    leftBtn.addEventListener('pointercancel', releaseBalance(-1));

    rightBtn.addEventListener('pointerdown', pressBalance(1));
    rightBtn.addEventListener('pointerup', releaseBalance(1));
    rightBtn.addEventListener('pointerleave', releaseBalance(1));
    rightBtn.addEventListener('pointercancel', releaseBalance(1));

    // 3단계 예수님 깨우기 버튼
    const wakeBtn = root.querySelector('#ms1-wake-btn');
    wakeBtn.addEventListener('click', () => {
      if (miracleSubMode === 'main1_galilee' && miracleActiveMiniState && miracleActiveMiniState.phase === 'wake_jesus') {
        triggerGalileeCalmStormCutscene();
      }
    });
  }

  if (!_miracleS1KeyBound) {
    _miracleS1KeyBound = true;
    window.addEventListener('keydown', (e) => {
      if (miracleSubMode !== 'main1_galilee' || !miracleActiveMiniState || typeof isPlaying === 'undefined' || !isPlaying) return;
      const st = miracleActiveMiniState;
      if (st.phase === 'cast_net' && (e.code === 'Space' || e.code === 'Enter') && !e.repeat && !st.netInFlight) {
        e.preventDefault();
        st.isCharging = true;
        st.chargeVal = 0.02;
        st.chargeDir = 1;
      } else if (st.phase === 'storm_balance') {
        if ((e.code === 'ArrowLeft' || e.code === 'KeyA') && !e.repeat) {
          st.holdLeft = true;
          st.boatTilt = THREE.MathUtils.clamp(st.boatTilt - 0.14, -1.0, 1.0);
        } else if ((e.code === 'ArrowRight' || e.code === 'KeyD') && !e.repeat) {
          st.holdRight = true;
          st.boatTilt = THREE.MathUtils.clamp(st.boatTilt + 0.14, -1.0, 1.0);
        }
      } else if (st.phase === 'wake_jesus' && (e.code === 'Space' || e.code === 'Enter')) {
        triggerGalileeCalmStormCutscene();
      }
    });
    window.addEventListener('keyup', (e) => {
      if (miracleSubMode !== 'main1_galilee' || !miracleActiveMiniState) return;
      const st = miracleActiveMiniState;
      if (st.phase === 'cast_net' && (e.code === 'Space' || e.code === 'Enter') && st.isCharging) {
        st.isCharging = false;
        launchGalileeFishingNet(st.chargeVal);
      }
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') st.holdLeft = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') st.holdRight = false;
    });
  }

  return root;
}

function syncMiracleStage1UI() {
  const root = ensureMiracleStage1UI();
  const st = miracleActiveMiniState;
  if (!st || miracleSubMode !== 'main1_galilee') {
    root.classList.add('hidden');
    return;
  }
  root.classList.remove('hidden');

  const castP = root.querySelector('#ms1-cast-panel');
  const balP  = root.querySelector('#ms1-bal-panel');
  const wakeP = root.querySelector('#ms1-wake-panel');

  castP.classList.toggle('hidden', st.phase !== 'cast_net');
  balP.classList.toggle('hidden', st.phase !== 'storm_balance');
  wakeP.classList.toggle('hidden', st.phase !== 'wake_jesus');

  if (st.phase === 'cast_net') {
    const titleEl = root.querySelector('#ms1-cast-title');
    const sweetEl = root.querySelector('#ms1-cast-sweet');
    const fillEl  = root.querySelector('#ms1-cast-fill');
    const needleEl = root.querySelector('#ms1-cast-needle');
    if (titleEl) titleEl.textContent = `🎣 그물 던지기 (${st.castCaught}/${st.reqCasts})`;
    if (sweetEl) {
      const leftPct = Math.max(0, (st.targetRatio - st.sweetHalfWidth) * 100);
      const widthPct = Math.min(100 - leftPct, st.sweetHalfWidth * 200);
      sweetEl.style.left = `${leftPct.toFixed(1)}%`;
      sweetEl.style.width = `${widthPct.toFixed(1)}%`;
    }
    const pct = Math.min(100, Math.max(0, st.chargeVal * 100));
    if (fillEl) fillEl.style.width = `${pct.toFixed(1)}%`;
    if (needleEl) needleEl.style.left = `calc(${pct.toFixed(1)}% - 3px)`;
  } else if (st.phase === 'storm_balance') {
    const progPct = Math.min(100, Math.round((st.balanceProgress / st.balanceGoal) * 100));
    const progTxt = root.querySelector('#ms1-bal-prog-txt');
    const progBar = root.querySelector('#ms1-bal-prog-bar');
    const warnEl  = root.querySelector('#ms1-bal-warn');
    const marker  = root.querySelector('#ms1-bal-marker');
    const leftBtn = root.querySelector('#ms1-bal-left');
    const rightBtn = root.querySelector('#ms1-bal-right');

    if (progTxt) {
      progTxt.textContent = st.isDrainingGauge ? `⚠️ 게이지 감소 중! ${progPct}%` : `균형 버티기 ${progPct}%`;
      progTxt.className = st.isDrainingGauge ? 'text-rose-400 animate-pulse' : 'text-emerald-300';
    }
    if (progBar) {
      progBar.style.width = `${progPct}%`;
      progBar.className = st.isDrainingGauge
        ? 'h-full bg-gradient-to-r from-rose-500 to-amber-400 transition-all duration-100'
        : 'h-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-100';
    }
    if (marker) {
      const mPct = 50 + st.boatTilt * 44;
      marker.style.left = `${mPct.toFixed(1)}%`;
      marker.style.transform = `rotate(${(st.boatTilt * 28).toFixed(1)}deg)`;
    }
    if (warnEl && leftBtn && rightBtn) {
      if (st.isDrainingGauge) {
        warnEl.textContent = st.boatTilt < 0
          ? '🚨 균형을 안 잡아 게이지가 깎이고 있어요! [오른쪽 버튼 ▶]을 누르세요!'
          : '🚨 균형을 안 잡아 게이지가 깎이고 있어요! [◀ 왼쪽 버튼]을 누르세요!';
        warnEl.className = 'text-center font-jua text-xs sm:text-sm text-rose-300 mb-1.5';
        if (st.boatTilt < 0) {
          rightBtn.className = 'mc-btn py-3.5 rounded-xl bg-rose-500 active:scale-95 text-white font-jua text-base sm:text-lg border-2 border-yellow-200 shadow-lg ring-2 ring-rose-300';
          leftBtn.className  = 'mc-btn py-3.5 rounded-xl bg-slate-700 active:scale-95 text-slate-200 font-jua text-base sm:text-lg border-2 border-slate-500';
        } else {
          leftBtn.className  = 'mc-btn py-3.5 rounded-xl bg-rose-500 active:scale-95 text-white font-jua text-base sm:text-lg border-2 border-yellow-200 shadow-lg ring-2 ring-rose-300';
          rightBtn.className = 'mc-btn py-3.5 rounded-xl bg-slate-700 active:scale-95 text-slate-200 font-jua text-base sm:text-lg border-2 border-slate-500';
        }
      } else if (st.boatTilt < -0.18) {
        warnEl.textContent = '⚠️ 왼쪽으로 기울었어요! [오른쪽 버튼 ▶]을 누르세요!';
        warnEl.className = 'text-center font-jua text-xs sm:text-sm text-amber-300 mb-1.5';
        rightBtn.className = 'mc-btn py-3.5 rounded-xl bg-amber-400 active:scale-95 text-slate-900 font-jua text-base sm:text-lg border-2 border-yellow-100 shadow-lg ring-2 ring-amber-300';
        leftBtn.className  = 'mc-btn py-3.5 rounded-xl bg-slate-700 active:scale-95 text-slate-200 font-jua text-base sm:text-lg border-2 border-slate-500';
      } else if (st.boatTilt > 0.18) {
        warnEl.textContent = '⚠️ 오른쪽으로 기울었어요! [◀ 왼쪽 버튼]을 누르세요!';
        warnEl.className = 'text-center font-jua text-xs sm:text-sm text-amber-300 mb-1.5';
        leftBtn.className  = 'mc-btn py-3.5 rounded-xl bg-amber-400 active:scale-95 text-slate-900 font-jua text-base sm:text-lg border-2 border-yellow-100 shadow-lg ring-2 ring-amber-300';
        rightBtn.className = 'mc-btn py-3.5 rounded-xl bg-slate-700 active:scale-95 text-slate-200 font-jua text-base sm:text-lg border-2 border-slate-500';
      } else {
        warnEl.textContent = '✨ 아주 좋아요! 지금처럼 배의 중심을 잘 잡고 있어요!';
        warnEl.className = 'text-center font-jua text-xs sm:text-sm text-emerald-300 mb-1.5';
        leftBtn.className  = 'mc-btn py-3.5 rounded-xl bg-sky-600 active:scale-95 text-white font-jua text-base sm:text-lg border-2 border-sky-300 shadow-lg';
        rightBtn.className = 'mc-btn py-3.5 rounded-xl bg-sky-600 active:scale-95 text-white font-jua text-base sm:text-lg border-2 border-sky-300 shadow-lg';
      }
    }
  }
}

function buildDetailedPlayableGalileeShip() {
  const ship = new THREE.Group();
  const cHullOuter = '#7c4318';
  const cHullTrim  = '#5c2d0c';
  const cDeckLight = '#c27a34';
  const cDeckDark  = '#a66224';
  const cBench     = '#8a4a18';
  const cSail      = '#fef3c7';
  const cSailBand  = '#f3dfb0';
  const cRope      = '#d6b685';

  // 1) 다단 곡선 목선 선체 & 갑판 판재 (5구간 테이퍼드 선체)
  const hullSections = [
    { z: -9.8, w: 3.4, len: 3.4 },
    { z: -6.4, w: 6.2, len: 3.8 },
    { z: -2.2, w: 8.6, len: 4.8 },
    { z:  2.6, w: 8.8, len: 5.0 },
    { z:  7.2, w: 6.6, len: 4.4 },
    { z: 10.6, w: 3.8, len: 3.0 }
  ];
  hullSections.forEach((sec, idx) => {
    // 하부 용골 선체
    const lowerHull = createLowPolyMesh(new THREE.BoxGeometry(sec.w * 0.86, 1.15, sec.len), cHullTrim, 0, -0.88, sec.z);
    // 상부 넓은 선체 외벽
    const upperHull = createLowPolyMesh(new THREE.BoxGeometry(sec.w, 0.58, sec.len + 0.15), cHullOuter, 0, -0.18, sec.z);
    ship.add(lowerHull, upperHull);

    // 줄무늬 목재 갑판 판재
    const plankCount = Math.max(3, Math.round(sec.w / 1.15));
    const pw = (sec.w - 0.7) / plankCount;
    for (let p = 0; p < plankCount; p++) {
      const px = -(sec.w - 0.7) * 0.5 + (p + 0.5) * pw;
      const plank = createLowPolyMesh(
        new THREE.BoxGeometry(pw - 0.05, 0.14, sec.len),
        (p + idx) % 2 === 0 ? cDeckLight : cDeckDark,
        px, -0.02, sec.z, false
      );
      ship.add(plank);
    }

    // 좌·우 곡선 뱃전 난간(Gunwale) & 내부 목재 늑골(Ribs)
    const wallH = 1.05;
    const halfW = sec.w * 0.5 - 0.18;
    const wallL = createLowPolyMesh(new THREE.BoxGeometry(0.36, wallH, sec.len + 0.1), cHullOuter, -halfW, wallH * 0.5, sec.z);
    const wallR = createLowPolyMesh(new THREE.BoxGeometry(0.36, wallH, sec.len + 0.1), cHullOuter,  halfW, wallH * 0.5, sec.z);
    const railCapL = createLowPolyMesh(new THREE.BoxGeometry(0.48, 0.16, sec.len + 0.15), cHullTrim, -halfW, wallH + 0.06, sec.z, false);
    const railCapR = createLowPolyMesh(new THREE.BoxGeometry(0.48, 0.16, sec.len + 0.15), cHullTrim,  halfW, wallH + 0.06, sec.z, false);
    const ribL = createLowPolyMesh(new THREE.BoxGeometry(0.18, 0.92, 0.22), cHullTrim, -halfW + 0.24, 0.45, sec.z, false);
    const ribR = createLowPolyMesh(new THREE.BoxGeometry(0.18, 0.92, 0.22), cHullTrim,  halfW - 0.24, 0.45, sec.z, false);
    ship.add(wallL, wallR, railCapL, railCapR, ribL, ribR);
  });

  // 2) 날렵하게 솟아오른 이물(선수) & 고물(선미) 장식 기둥 + 방향타(Rudder)
  const prowCone = createLowPolyMesh(new THREE.ConeGeometry(1.9, 3.6, 5), cHullOuter, 0, 0.25, -12.6);
  prowCone.rotation.x = -Math.PI / 2 - 0.24;
  prowCone.scale.set(0.95, 1.0, 0.55);
  const prowPost = createLowPolyMesh(new THREE.CylinderGeometry(0.20, 0.34, 3.2, 6), cHullTrim, 0, 1.45, -12.1);
  prowPost.rotation.x = -0.32;
  const prowCap = createLowPolyMesh(new THREE.DodecahedronGeometry(0.30, 0), '#eab308', 0, 2.95, -12.6, false);

  const sternCone = createLowPolyMesh(new THREE.ConeGeometry(2.0, 3.0, 5), cHullOuter, 0, 0.25, 12.8);
  sternCone.rotation.x = Math.PI / 2 + 0.22;
  sternCone.scale.set(0.98, 1.0, 0.58);
  const sternPost = createLowPolyMesh(new THREE.CylinderGeometry(0.20, 0.32, 3.0, 6), cHullTrim, 0, 1.4, 12.3);
  sternPost.rotation.x = 0.28;

  // 선미 우측 방향타(키 노)
  const rudderShaft = createLowPolyMesh(new THREE.CylinderGeometry(0.10, 0.12, 4.4, 6), cHullTrim, 2.6, 0.2, 11.4, false);
  rudderShaft.rotation.set(0.45, 0, -0.22);
  const rudderBlade = createLowPolyMesh(new THREE.BoxGeometry(0.14, 1.5, 0.72), cBench, 2.95, -1.15, 12.6, false);
  rudderBlade.rotation.set(0.45, 0, -0.22);
  ship.add(prowCone, prowPost, prowCap, sternCone, sternPost, rudderShaft, rudderBlade);

  // 3) 선내 가로 나무 벤치 2개 + 고물(선미) 단상 & 예수님이 누우시는 붉은 직물 베개 침상
  [-6.2, 3.2].forEach(bz => {
    const bw = bz < 0 ? 5.2 : 7.4;
    ship.add(createLowPolyMesh(new THREE.BoxGeometry(bw, 0.18, 0.78), cBench, 0, 0.56, bz, false));
  });

  // 고물(z = 7.4 ~ 10.6) 단상과 베개
  const sternDeck = createLowPolyMesh(new THREE.BoxGeometry(5.6, 0.42, 3.4), cBench, 0, 0.24, 8.6);
  const sternRug  = createLowPolyMesh(new THREE.BoxGeometry(4.2, 0.08, 2.5), '#991b1b', 0, 0.49, 8.5, false);
  const pillow    = createLowPolyMesh(new THREE.IcosahedronGeometry(0.44, 0), '#dc2626', 0, 0.64, 9.75, false);
  pillow.scale.set(1.45, 0.52, 0.95);
  const pillowTrim = createLowPolyMesh(new THREE.BoxGeometry(1.1, 0.12, 0.12), '#eab308', 0, 0.62, 9.35, false);
  ship.add(sternDeck, sternRug, pillow, pillowTrim);

  // 4) 돛대 + 대각선 활대 + 곡면 부푼 돛 + 로프 리깅 + 노 4자루 + 고물 등불
  const mast = createLowPolyMesh(new THREE.CylinderGeometry(0.24, 0.34, 10.6, 8), cHullTrim, 0, 5.2, -3.4);
  const mastStep = createLowPolyMesh(new THREE.BoxGeometry(1.1, 0.42, 1.1), cHullOuter, 0, 0.22, -3.4, false);
  const yard = createLowPolyMesh(new THREE.CylinderGeometry(0.12, 0.16, 8.6, 6), cHullTrim, 0, 8.6, -3.1);
  yard.rotation.z = Math.PI / 2 - 0.14;

  // 부드럽게 바람을 머금고 부푼 곡면 저폴리곤 돛 (sailPivot으로 풍랑 시 흔들림 연출)
  const sailPivot = new THREE.Group();
  sailPivot.position.set(0, 8.4, -3.1);
  const sailGeo = new THREE.PlaneGeometry(7.6, 5.4, 6, 5);
  const sPos = sailGeo.attributes.position;
  for (let i = 0; i < sPos.count; i++) {
    const sx = sPos.getX(i);
    const sy = sPos.getY(i);
    const u = sx / 3.8;
    const v = sy / 2.7;
    const billow = Math.cos(u * Math.PI * 0.45) * Math.cos(v * Math.PI * 0.42) * 1.15;
    sPos.setZ(i, billow);
  }
  const sailNon = sailGeo.toNonIndexed();
  sailNon.computeVertexNormals();
  const sailMesh = new THREE.Mesh(sailNon, matLowPolyDouble(cSail));
  sailMesh.position.set(0, -2.7, 0.25);
  sailMesh.castShadow = true;
  const sailBand1 = createLowPolyMesh(new THREE.BoxGeometry(7.2, 0.26, 0.14), cSailBand, 0, -1.6, 1.12, false);
  const sailBand2 = createLowPolyMesh(new THREE.BoxGeometry(7.0, 0.26, 0.14), cSailBand, 0, -3.8, 1.02, false);
  sailPivot.add(sailMesh, sailBand1, sailBand2);

  // 앞·뒤 돛대 밧줄(리깅)
  const ropeFront = createBranchSegmentMesh(new THREE.Vector3(0, 9.6, -3.4), new THREE.Vector3(0, 2.2, -11.8), 0.05, 0.05, cRope);
  const ropeBackL = createBranchSegmentMesh(new THREE.Vector3(0, 9.5, -3.4), new THREE.Vector3(-3.3, 1.1, 6.2), 0.045, 0.045, cRope);
  const ropeBackR = createBranchSegmentMesh(new THREE.Vector3(0, 9.5, -3.4), new THREE.Vector3( 3.3, 1.1, 6.2), 0.045, 0.045, cRope);

  // 양옆 노 4자루
  [-1, 1].forEach(side => {
    [-0.6, 3.4].forEach(oz => {
      const oar = createLowPolyMesh(new THREE.CylinderGeometry(0.06, 0.075, 4.8, 5), '#b45309', side * 4.5, 0.85, oz, false);
      oar.rotation.z = side * 1.24;
      oar.rotation.y = side * 0.18;
      ship.add(oar);
    });
  });

  // 말린 그물 뭉치 & 어획 물고기 바구니 (1단계에서 잡은 물고기가 실제로 쌓임!)
  const netCoil = createLowPolyMesh(new THREE.CylinderGeometry(0.75, 0.92, 0.45, 8), '#d6c6a5', -2.4, 0.25, -5.2, false);
  const catchBasketGrp = new THREE.Group();
  catchBasketGrp.position.set(-2.3, 0.05, 0.8);
  catchBasketGrp.add(
    createLowPolyMesh(new THREE.CylinderGeometry(0.82, 0.64, 0.72, 9), '#a16207', 0, 0.36, 0),
    createLowPolyMesh(new THREE.CylinderGeometry(0.86, 0.86, 0.12, 9), '#78350f', 0, 0.72, 0, false)
  );

  // 고물 등불 (따뜻한 황금빛)
  const lanternPole = createLowPolyMesh(new THREE.CylinderGeometry(0.05, 0.06, 2.4, 5), cHullTrim, -2.3, 1.6, 10.6, false);
  const lanternLamp = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.28, 0),
    new THREE.MeshBasicMaterial({ color: 0xfef08a })
  );
  lanternLamp.position.set(-2.3, 2.75, 10.6);

  ship.add(mast, mastStep, yard, sailPivot, ropeFront, ropeBackL, ropeBackR, netCoil, catchBasketGrp, lanternPole, lanternLamp);
  return { ship, sailPivot, catchBasketGrp };
}

function pickNextGalileeFishSchoolTarget() {
  const st = miracleActiveMiniState;
  if (!st) return;
  const ratio = 0.28 + Math.random() * 0.50; // 0.28 ~ 0.78
  st.targetRatio = ratio;
  const targetX = -8.5 - ratio * 18.0;
  const targetZ = -1.5 + (Math.random() - 0.5) * 3.5;
  st.targetFishPos.set(targetX, -0.78, targetZ);
  if (st.fishSchoolGroup) {
    st.fishSchoolGroup.position.copy(st.targetFishPos);
    st.fishSchoolGroup.visible = true;
  }
  syncMiracleStage1UI();
}

function launchGalileeFishingNet(powerRatio) {
  const st = miracleActiveMiniState;
  if (!st || st.netInFlight) return;
  st.netInFlight = true;
  st.netFlightT = 0;
  st.netPowerUsed = powerRatio;

  const landX = -8.5 - powerRatio * 18.0;
  const landZ = st.targetFishPos.z;
  st.netStartPos.set(playerPos.x - 0.6, 1.55, playerPos.z);
  st.netEndPos.set(landX, -0.82, landZ);
  if (st.flyingNetMesh) {
    st.flyingNetMesh.visible = true;
    st.flyingNetMesh.position.copy(st.netStartPos);
    st.flyingNetMesh.scale.set(0.45, 0.45, 0.45);
  }
  playerChopAnimTimer = 0.35;
  playSfx('jump');
}

function buildMiracleMainStage1Galilee() {
  clearWorld();
  resetMiracleBoatRockingTransform();
  miracleSubMode = 'main1_galilee';
  miracleStageObjects = [];

  if (typeof setupMiracleDynamicSunAndShadows === 'function') {
    setupMiracleDynamicSunAndShadows();
  }

  scene.background = new THREE.Color(0x38bdf8);
  scene.fog = new THREE.Fog(0x7dd3fc, 65, 230);

  const isKinder = (currentMode === 'kinder');
  const reqCasts = isKinder ? 3 : 4;
  const sweetHalfWidth = isKinder ? 0.13 : 0.095;
  const balanceGoal = isKinder ? 10.5 : 14.5;

  miracleActiveMiniState = {
    phase: 'cast_net', // 'cast_net' | 'storm_balance' | 'wake_jesus' | 'calm'
    castCaught: 0,
    reqCasts,
    sweetHalfWidth,
    targetRatio: 0.52,
    chargeVal: 0,
    chargeDir: 1,
    isCharging: false,
    netInFlight: false,
    netFlightT: 0,
    netPowerUsed: 0,
    netStartPos: new THREE.Vector3(),
    netEndPos: new THREE.Vector3(),
    targetFishPos: new THREE.Vector3(-17, -0.78, -1.5),
    splashTimer: 0,
    // 2단계 풍랑 균형 잡기 상태
    boatTilt: 0,
    waveGustForce: 0.48,
    waveGustDir: 1,
    waveGustTimer: 1.4,
    holdLeft: false,
    holdRight: false,
    balanceProgress: 0,
    balanceGoal,
    tiltWarnCooldown: 0,
    // 3D 참조 객체
    seaMesh: null,
    boatRootGroup: null,
    sailPivot: null,
    catchBasketGrp: null,
    fishSchoolGroup: null,
    schoolFishes: [],
    ambientFishes: [],
    flyingNetMesh: null,
    splashRingMesh: null,
    jesusMesh: null,
    jesusLabel: null,
    peterMesh: null,
    waves: [],
    skyClouds: [],
    seaBirds: []
  };

  currentMapRectBounds = { minX: -3.8, maxX: 3.8, minZ: -7.5, maxZ: 7.5 };

  // 1) 갈릴리 바다 수면 — 비정형 삼각 분할 소프트 로우폴리 수면 (오픈월드와 동일 스타일!)
  const seaFloor = (typeof createIrregularLowPolyWaterMesh === 'function')
    ? createIrregularLowPolyWaterMesh(380, 380, 44, 44, 17, { shoreRightEdgeX: 28, shallowBandW: 54, opacity: 0.85, isStorm: false })
    : (() => {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(380, 380, 32, 32), new THREE.MeshLambertMaterial({ color: 0x0284c7, flatShading: true }));
        m.rotation.x = -Math.PI / 2;
        return m;
      })();
  seaFloor.position.y = -1.15;
  seaFloor.receiveShadow = true;
  worldGroup.add(seaFloor);
  miracleActiveMiniState.seaMesh = seaFloor;

  // 2) 동쪽 해안 원경 (Image 1 스타일 해안 단차·경사진 모래 물가 · 비정형 선착장 · 벽돌가옥 · 언덕 돌담)
  const smooth01S1 = (a, b, v) => {
    const t = Math.max(0, Math.min(1, (v - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  const s1ShoreHeight = (lx, lz) => {
    const wx = lx + 78; // 월드 X (x≈20이 물가)
    const dShore = wx - 20.0;
    if (dShore < -1.0) return -1.35 + (dShore + 1.0) * 0.08;
    if (dShore < 4.5) return -1.35 + smooth01S1(-1.0, 4.5, dShore) * 0.72; // 완만히 경사진 모래 물가
    if (dShore < 7.0) return -0.63 + smooth01S1(4.5, 7.0, dShore) * 0.68;  // 약간의 해안 둑 단차!
    const inlandT = Math.max(0, (dShore - 7.0) / 112);
    return 0.05 + Math.pow(inlandT, 0.92) * 14.0 + Math.sin(lx * 0.08) * Math.cos(lz * 0.06) * 0.62;
  };
  const cS1Sand   = new THREE.Color('#ebd8ae');
  const cS1Bank   = new THREE.Color('#cfa572');
  const cS1Meadow = new THREE.Color('#b6b968');
  const cS1Ochre  = new THREE.Color('#d8b674');
  const cS1Slope  = new THREE.Color('#cf9f60');
  const cS1Hill   = new THREE.Color('#6a9b43');
  const shoreMesh = (typeof createCrispLowPolyFacetedTerrain === 'function')
    ? createCrispLowPolyFacetedTerrain(120, 260, 28, 42, s1ShoreHeight, (mx, my, mz, slopeFlat, hash2, outCol) => {
        const dShore = (mx + 78) - 20.0;
        if (dShore < 4.5) {
          outCol.copy(cS1Sand);
        } else if (dShore < 7.2) {
          outCol.copy(cS1Bank);
        } else if (my > 6.5) {
          outCol.copy(cS1Hill);
        } else if (my > 2.2 && slopeFlat < 0.94) {
          outCol.copy(cS1Slope);
        } else {
          const patch = hash2(Math.floor(mx * 0.14), Math.floor(mz * 0.14));
          outCol.copy(cS1Meadow).lerp(cS1Ochre, 0.28 + patch * 0.52);
        }
      }, 0.85)
    : new THREE.Mesh(new THREE.PlaneGeometry(120, 260, 24, 36), new THREE.MeshLambertMaterial({ color: '#9ec164', flatShading: true }));
  shoreMesh.position.set(78, 0, 0);
  worldGroup.add(shoreMesh);

  // 해안 물가 로우폴리 바위 & 부들(갈대) 수초 장식
  const s1CoastGrp = new THREE.Group();
  for (let ci = 0; ci < 14; ci++) {
    const cz = -42 + ci * 6.4;
    if (Math.abs(cz) < 4.2) continue; // 선착장 제외
    const rx = 20.5 + (ci % 3) * 1.4;
    const ry = s1ShoreHeight(rx - 78, cz);
    const st = createLowPolyMesh(new THREE.DodecahedronGeometry(0.55 + (ci % 3) * 0.22, 0), ci % 2 === 0 ? '#cbd5e1' : '#a8a29e', rx, ry + 0.18, cz, false);
    st.scale.set(1.3, 0.58, 1.1);
    s1CoastGrp.add(st);
    if (typeof createShorelineCattailCluster === 'function' && ci % 2 === 0) {
      const cat = createShorelineCattailCluster(0.95 + (ci % 3) * 0.12);
      cat.position.set(rx + 2.4, s1ShoreHeight(rx + 2.4 - 78, cz), cz + 0.8);
      s1CoastGrp.add(cat);
    }
  }
  if (typeof mergeStaticLowPolyGroupToVertexColor === 'function') {
    mergeStaticLowPolyGroupToVertexColor(s1CoastGrp, { registerWall: false, castShadow: false });
  }
  worldGroup.add(s1CoastGrp);

  // 비정형 소프트 로우폴리 갈릴리 선착장 다리
  const s1Pier = (typeof createOrganicGalileePierGroup === 'function')
    ? createOrganicGalileePierGroup(12.8, 3.8, 73)
    : createLowPolyMesh(new THREE.BoxGeometry(12.5, 0.35, 3.8), '#92400e', 0, 0.25, 0);
  s1Pier.position.set(22, 0.0, 0);
  worldGroup.add(s1Pier);

  addJudeanRoadsideBuilding(44, -18, 1, -Math.PI / 2, 0.95, false, 'stonebrick');
  addJudeanRoadsideBuilding(48,  14, 0, -Math.PI / 2, 0.95, false, 'plaster');
  addJudeanRoadsideBuilding(54,  -2, 2, -Math.PI / 2, 0.96, false, 'stonebrick');
  addLowPolyPalmTree(30, -12, 1.1, false);
  addLowPolyPalmTree(32,  10, 1.1, false);

  if (typeof buildStageDryStoneTerraceWalls === 'function') {
    buildStageDryStoneTerraceWalls(
      [
        { pts: [[56, -42], [60, -24], [62, -6], [60, 16], [56, 36]], courses: 3 },
        { pts: [[68, -32], [72, -10], [72, 14], [68, 34]], courses: 3 }
      ],
      (wx, wz) => s1ShoreHeight(wx - 78, wz),
      710
    );
  }

  if (typeof createBumpyLowPolyHillMesh === 'function') {
    createBumpyLowPolyHillMesh(88, -55, 26, 13.5, 24, '#7ca344', 11, false);
    createBumpyLowPolyHillMesh(92,   5, 24,  8.5, 22, '#84a955', 22, false);
    createBumpyLowPolyHillMesh(86,  55, 25,  9.0, 22, '#789c4a', 33, false);
  }

  [[-36, 24, -45, 1.3], [32, 26, -40, 1.4], [-42, 22, 15, 1.2], [40, 25, 22, 1.3], [0, 28, -55, 1.5], [0, 26, 48, 1.25]]
    .forEach(([cx, cy, cz, sc]) => {
      const cl = createLowPolyCloudGroup(sc, false);
      cl.position.set(cx, cy, cz);
      worldGroup.add(cl);
      miracleActiveMiniState.skyClouds.push(cl);
    });

  // 바다 위를 나는 갈매기 5마리
  if (typeof window.createFlyingBirdMesh === 'function') {
    for (let b = 0; b < 5; b++) {
      const bm = window.createFlyingBirdMesh('#f8fafc', '#cbd5e1', 0.9 + (b % 2) * 0.2);
      worldGroup.add(bm);
      miracleActiveMiniState.seaBirds.push({
        mesh: bm,
        rad: 22 + b * 6,
        baseY: 13 + (b % 3) * 3.5,
        angle: b * 1.25,
        speed: 0.26 + (b % 2) * 0.08,
        phase: b * 1.4
      });
    }
  }

  // 파도 장식
  for (let i = 0; i < 40; i++) {
    const ang = (i / 40) * Math.PI * 2;
    const dist = 14 + (i % 5) * 7.5;
    const wx = Math.cos(ang) * dist;
    const wz = Math.sin(ang) * dist;
    if (wx > 16) continue;
    const waveMesh = createLowPolyMesh(new THREE.DodecahedronGeometry(1.45, 0), '#38bdf8', wx, -0.92, wz, false);
    waveMesh.scale.set(2.3, 0.35, 0.85);
    worldGroup.add(waveMesh);
    miracleActiveMiniState.waves.push({ mesh: waveMesh, baseY: -0.92, phase: i * 0.65 });
  }

  // 3) 디테일한 탑승용 갈릴리 어선 조립 (boatRootGroup)
  const { ship, sailPivot, catchBasketGrp } = buildDetailedPlayableGalileeShip();
  worldGroup.add(ship);
  miracleActiveMiniState.boatRootGroup = ship;
  miracleActiveMiniState.sailPivot = sailPivot;
  miracleActiveMiniState.catchBasketGrp = catchBasketGrp;

  // 배 고물(선미) 위 예수님 (1단계에는 앉아/서 계시다 2단계 풍랑 시작 시 베개에 누워 주무심)
  const jesusMesh = createLowPolyPersonMesh('jesus', 0);
  jesusMesh.position.set(0, 0.48, 8.2);
  jesusMesh.rotation.y = Math.PI;
  ship.add(jesusMesh);
  miracleActiveMiniState.jesusMesh = jesusMesh;
  miracleActiveMiniState.jesusLabel = createWorldLabel('✨ 배 고물에 계신 예수님');
  miracleActiveMiniState.jesusLabel.style.opacity = '0';

  // 이물(선수) 쪽 어부 시몬 베드로
  const peterMesh = createLowPolyPersonMesh('disciple', 1);
  peterMesh.position.set(1.6, 0.05, -6.2);
  peterMesh.rotation.y = -Math.PI * 0.25;
  ship.add(peterMesh);
  miracleActiveMiniState.peterMesh = peterMesh;

  // 4) 1단계용 바다 물고기 떼 타깃 + 날아가는 3D 저폴리곤 그물 + 물보라 링
  const fishSchoolGrp = new THREE.Group();
  const fRing = new THREE.Mesh(
    new THREE.RingGeometry(1.75, 2.45, 22),
    new THREE.MeshBasicMaterial({ color: 0x34d399, side: THREE.DoubleSide, transparent: true, opacity: 0.88 })
  );
  fRing.rotation.x = -Math.PI / 2;
  fRing.position.y = 0.06;
  const fInnerRing = new THREE.Mesh(
    new THREE.RingGeometry(0.85, 1.35, 18),
    new THREE.MeshBasicMaterial({ color: 0xfef08a, side: THREE.DoubleSide, transparent: true, opacity: 0.72 })
  );
  fInnerRing.rotation.x = -Math.PI / 2;
  fInnerRing.position.y = 0.08;
  fishSchoolGrp.add(fRing, fInnerRing);
  for (let k = 0; k < 6; k++) {
    const fAng = (k / 6) * Math.PI * 2;
    const fish = (typeof createLowPolyFishMesh === 'function')
      ? createLowPolyFishMesh(null, 0.95 + (k % 2) * 0.18, k)
      : createLowPolyMesh(new THREE.ConeGeometry(0.26, 0.82, 5), '#f97316', 0, 0, 0, false);
    fish.position.set(Math.cos(fAng) * 1.25, 0.24 + (k % 3) * 0.14, Math.sin(fAng) * 1.25);
    fish.rotation.y = fAng + Math.PI * 0.5;
    fishSchoolGrp.add(fish);
    miracleActiveMiniState.schoolFishes.push({ mesh: fish, phase: k * 1.1 });
  }
  worldGroup.add(fishSchoolGrp);
  miracleActiveMiniState.fishSchoolGroup = fishSchoolGrp;

  // 갈릴리 바다 수면 아래·주변을 자유롭게 헤엄치는 다양한 소프트 로우폴리 물고기 18마리!
  if (typeof createLowPolyFishMesh === 'function') {
    for (let af = 0; af < 18; af++) {
      const fScale = 0.72 + (af % 4) * 0.18;
      const fMesh = createLowPolyFishMesh(null, fScale, af);
      const cx = -15.5 + ((af * 11) % 24) - 10; // 주로 배 왼쪽(-X)과 앞/뒤 맑은 갈릴리 수역
      const cz = -16.0 + ((af * 13) % 32);
      const radX = 3.2 + (af % 4) * 1.4;
      const radZ = 2.6 + ((af + 1) % 3) * 1.3;
      const spd = (0.45 + (af % 5) * 0.12) * (af % 2 === 0 ? 1 : -1);
      const baseY = -0.96 + (af % 3) * 0.10;
      const ang = (af / 18) * Math.PI * 2;
      fMesh.position.set(cx + Math.cos(ang) * radX, baseY, cz + Math.sin(ang) * radZ);
      worldGroup.add(fMesh);
      miracleActiveMiniState.ambientFishes.push({
        mesh: fMesh, cx, cz, radX, radZ, baseY,
        angle: ang, speed: spd, phase: af * 0.85
      });
    }
  }

  // 3D 던지는 어망(펼쳐지는 8각 원뿔형 로우폴리 그물)
  const netGrp = new THREE.Group();
  const netCone = new THREE.Mesh(
    new THREE.ConeGeometry(1.85, 1.15, 8, 1, true),
    new THREE.MeshLambertMaterial({ color: 0xe7d3a7, wireframe: true })
  );
  const netRim = new THREE.Mesh(
    new THREE.TorusGeometry(1.85, 0.09, 5, 12),
    new THREE.MeshLambertMaterial({ color: 0xb45309, flatShading: true })
  );
  netRim.rotation.x = Math.PI / 2;
  netRim.position.y = -0.55;
  netGrp.add(netCone, netRim);
  netGrp.visible = false;
  worldGroup.add(netGrp);
  miracleActiveMiniState.flyingNetMesh = netGrp;

  const splashRing = new THREE.Mesh(
    new THREE.RingGeometry(0.6, 1.35, 18),
    new THREE.MeshBasicMaterial({ color: 0xe0f2fe, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
  );
  splashRing.rotation.x = -Math.PI / 2;
  splashRing.visible = false;
  worldGroup.add(splashRing);
  miracleActiveMiniState.splashRingMesh = splashRing;

  // 어떤 시점(1인칭·올려봄)으로 입장했더라도 스테이지 1은 항상 기본 시점으로 고정!
  window.globalCameraViewMode = 'default';
  const camLblEl = document.getElementById('global-camera-view-label');
  if (camLblEl) camLblEl.textContent = '기본';

  // 플레이어를 좌현 난간 앞에 세우고 서쪽 바다(물고기 떼)를 바라보게 배치
  playerPos.set(-3.1, 0.06, -1.5);
  lastGroundedY = 0.06;
  playerVelY = 0;
  isGrounded = true;
  playerFacing = -Math.PI / 2;
  cameraYaw = Math.PI / 2;
  cameraTargetYaw = Math.PI / 2;
  snapCameraToPlayer();

  pickNextGalileeFishSchoolTarget();
  syncMiracleStage1UI();
  showToast(`🎣 [1단계] 버튼을 꾹 눌러 게이지가 초록 구간에 닿을 때 놓아 그물을 던지세요! (${reqCasts}회 성공)`);
}

function startGalileeStormPhase() {
  const st = miracleActiveMiniState;
  window.globalCameraViewMode = 'default';
  const camLblEl = document.getElementById('global-camera-view-label');
  if (camLblEl) camLblEl.textContent = '기본';

  st.phase = 'storm_balance';
  st.boatTilt = 0.28;
  st.waveGustDir = 1;
  st.waveGustForce = (currentMode === 'kinder') ? 0.50 : 0.68;
  st.waveGustTimer = 1.6;
  st.balanceProgress = 0;
  st.noBalanceInputTimer = 0;
  st.isDrainingGauge = false;
  st.holdLeft = false;
  st.holdRight = false;
  st.isCharging = false;
  st.netInFlight = false;

  if (st.fishSchoolGroup) st.fishSchoolGroup.visible = false;
  if (st.flyingNetMesh) st.flyingNetMesh.visible = false;

  scene.background = new THREE.Color(0x1e293b);
  scene.fog = new THREE.Fog(0x1e293b, 26, 108);
  if (st.seaMesh && typeof tintIrregularLowPolyWater === 'function') {
    tintIrregularLowPolyWater(st.seaMesh, true);
  }
  if (st.skyClouds) {
    st.skyClouds.forEach(cl => {
      cl.traverse(ch => {
        if (ch.isMesh) ch.material = matLowPoly('#334155');
      });
    });
  }

  // [핵심 요청 반영] 풍랑 중에는 예수님이 고물 붉은 베개 침상에 편안히 누워 주무시도록 자세 변경!
  if (st.jesusMesh) {
    st.jesusMesh.position.set(0, 0.72, 9.45);
    st.jesusMesh.rotation.set(-Math.PI / 2, 0, 0);
    if (st.jesusMesh.userData) {
      if (st.jesusMesh.userData.lArm) st.jesusMesh.userData.lArm.rotation.set(-0.25, 0, 0.20);
      if (st.jesusMesh.userData.rArm) st.jesusMesh.userData.rArm.rotation.set(-0.25, 0, -0.20);
      if (st.jesusMesh.userData.lLeg) st.jesusMesh.userData.lLeg.rotation.x = 0;
      if (st.jesusMesh.userData.rLeg) st.jesusMesh.userData.rLeg.rotation.x = 0;
    }
  }
  if (st.jesusLabel) {
    st.jesusLabel.innerHTML = '😴 풍랑 속에서도 베개에 누워 평안히 주무시는 예수님';
  }

  // 플레이어를 배 중앙 갑판으로 이동 & 고물 쪽(+Z) 카메라를 정면으로 마주 보도록 배치 (고물에 누우신 예수님과 캐릭터가 함께 보임!)
  playerPos.set(0, 0.06, -0.8);
  lastGroundedY = 0.06;
  playerFacing = 0;
  cameraTargetYaw = 0;
  snapCameraToPlayer();

  playRainOrSeaSound(5.5, true);
  playSfx('thunder');
  startStageBgm(1);
  syncMiracleStage1UI();
  updateStageHUD();
  showToast('⛈️ [2단계] 큰 풍랑이 몰아쳐요! 배가 기울어지는 반대쪽 버튼을 눌러 균형을 잡으세요! (고물에는 예수님이 누워 주무시고 계세요)');
}

function triggerGalileeCalmStormCutscene() {
  const st = miracleActiveMiniState;
  if (!st || st.phase === 'calm') return;
  st.phase = 'calm';
  isTimeAttackActive = false;
  st.holdLeft = false;
  st.holdRight = false;

  const s1Ui = document.getElementById('miracle-s1-ui');
  if (s1Ui) s1Ui.classList.add('hidden');
  if (st.jesusLabel) st.jesusLabel.style.opacity = '0';

  const wf = document.getElementById('white-fade');
  if (wf) wf.style.opacity = '0.82';
  setTimeout(() => {
    scene.background = new THREE.Color(0x38bdf8);
    scene.fog = new THREE.Fog(0xbae6fd, 55, 200);
    if (st.seaMesh && typeof tintIrregularLowPolyWater === 'function') {
      tintIrregularLowPolyWater(st.seaMesh, false);
    }
    if (st.skyClouds) {
      st.skyClouds.forEach(cl => {
        cl.traverse(ch => {
          if (ch.isMesh) ch.material = matLowPoly('#ffffff');
        });
      });
    }
    if (wf) wf.style.opacity = '0';
  }, 340);

  miracleStageCutscene.active = true;
  miracleStageCutscene.timer = 0;
  miracleStageCutscene.stageNum = 1;
  startStageBgm(1);
  playSfx('clear');
  showToast('✨ 예수께서 일어나 바람을 꾸짖으시며 "잠잠하라! 고요하라!" 하시니 바람이 그치고 아주 잔잔하여졌습니다!');
}

function updateMiracleMainStage1Frame(dt, now) {
  if (typeof updateMiracleDynamicSun === 'function') {
    updateMiracleDynamicSun(dt, now);
  }
  const st = miracleActiveMiniState;
  if (!st) return;

  const isStorming = (st.phase === 'storm_balance' || st.phase === 'wake_jesus');

  // 1) 파도, 갈매기, 베드로, 돛 애니메이션
  if (st.waves) {
    const amp = isStorming ? 1.05 : 0.20;
    const spd = isStorming ? 0.0095 : 0.003;
    st.waves.forEach(w => {
      w.mesh.position.y = w.baseY + Math.sin(now * spd + w.phase) * amp;
    });
  }
  if (st.seaBirds) {
    const tSec = now * 0.001;
    st.seaBirds.forEach(b => {
      b.angle += dt * b.speed;
      const nx = Math.cos(b.angle) * b.rad;
      const nz = Math.sin(b.angle) * b.rad;
      b.mesh.position.set(nx, b.baseY + Math.sin(tSec * 1.5 + b.phase) * 0.9, nz);
      b.mesh.rotation.y = Math.atan2(-Math.sin(b.angle), Math.cos(b.angle));
      const fl = Math.sin(tSec * 9.5 + b.phase) * 0.55;
      if (b.mesh.userData && b.mesh.userData.wingL) {
        b.mesh.userData.wingL.rotation.z = fl;
        b.mesh.userData.wingR.rotation.z = -fl;
      }
    });
  }
  if (st.sailPivot) {
    st.sailPivot.rotation.x = isStorming
      ? (0.14 + Math.sin(now * 0.014) * 0.14)
      : (0.04 + Math.sin(now * 0.003) * 0.04);
  }
  if (st.peterMesh && st.peterMesh.userData) {
    const pu = st.peterMesh.userData;
    const sway = Math.sin(now * (isStorming ? 0.012 : 0.004)) * 0.35;
    if (pu.lArm && pu.rArm) {
      pu.lArm.rotation.x = isStorming ? (-1.2 + sway) : (-0.3 + sway * 0.4);
      pu.rArm.rotation.x = isStorming ? (-1.2 - sway) : (-0.3 - sway * 0.4);
    }
  }

  // 바다 속을 자유롭게 유영하는 소프트 로우폴리 물고기 18마리 & 타깃 물고기 꼬리 흔들림 애니메이션
  if (Array.isArray(st.ambientFishes) && st.ambientFishes.length > 0) {
    const tSecF = now * 0.001;
    st.ambientFishes.forEach((af) => {
      af.angle += dt * af.speed * (isStorming ? 1.45 : 1.0);
      const nx = af.cx + Math.cos(af.angle) * af.radX;
      const nz = af.cz + Math.sin(af.angle) * af.radZ;
      const vx = -Math.sin(af.angle) * af.radX * af.speed;
      const vz =  Math.cos(af.angle) * af.radZ * af.speed;
      af.mesh.position.set(nx, af.baseY + Math.sin(tSecF * 2.4 + af.phase) * 0.08, nz);
      af.mesh.rotation.y = Math.atan2(vx, vz);
      if (af.mesh.userData && af.mesh.userData.tailPivot) {
        af.mesh.userData.tailPivot.rotation.y = Math.sin(tSecF * 11.0 + af.phase) * 0.36;
      }
    });
  }
  if (Array.isArray(st.schoolFishes)) {
    const tSecS = now * 0.001;
    st.schoolFishes.forEach((sf) => {
      if (sf.mesh && sf.mesh.userData && sf.mesh.userData.tailPivot) {
        sf.mesh.userData.tailPivot.rotation.y = Math.sin(tSecS * 12.5 + sf.phase) * 0.42;
      }
    });
  }

  // 물보라 링 연출
  if (st.splashTimer > 0 && st.splashRingMesh) {
    st.splashTimer -= dt;
    const sProg = 1.0 - Math.max(0, st.splashTimer / 0.55);
    const sc = 0.7 + sProg * 2.4;
    st.splashRingMesh.scale.set(sc, sc, 1);
    st.splashRingMesh.material.opacity = Math.max(0, 0.9 * (1 - sProg));
    if (st.splashTimer <= 0) st.splashRingMesh.visible = false;
  }

  // 2) 폭풍 잠잠케 하심 컷신 (누워 계시던 예수님이 벌떡 일어나 손을 드심!)
  if (miracleStageCutscene.active) {
    miracleStageCutscene.timer += dt;
    const t = miracleStageCutscene.timer;
    if (st.boatRootGroup) {
      st.boatRootGroup.rotation.z = THREE.MathUtils.lerp(st.boatRootGroup.rotation.z, 0, dt * 5.0);
      st.boatRootGroup.position.y = THREE.MathUtils.lerp(st.boatRootGroup.position.y, 0, dt * 5.0);
    }
    if (playerGroup) playerGroup.rotation.z = 0;

    if (st.jesusMesh) {
      // 누운 자세(-PI/2)에서 우뚝 일어서는 부드러운 전환 (rotation.y = Math.PI → -Z 정면 방향!)
      const riseT = Math.min(1, t / 0.85);
      st.jesusMesh.rotation.x = THREE.MathUtils.lerp(-Math.PI / 2, 0, riseT);
      st.jesusMesh.rotation.y = Math.PI;
      st.jesusMesh.position.y = THREE.MathUtils.lerp(0.72, 0.48, riseT);
      st.jesusMesh.position.z = THREE.MathUtils.lerp(9.45, 8.2, riseT);
      if (st.jesusMesh.userData && st.jesusMesh.userData.rArm) {
        st.jesusMesh.userData.rArm.rotation.x = -2.25 + Math.sin(now * 0.008) * 0.18;
      }
    }
    cameraTargetYaw = Math.PI;
    // 풍랑이 멈춘 뒤 카메라가 예수님 정면(-Z 앞쪽)으로 부드럽게 이동해 일어나신 예수님을 비춤!
    if (typeof applyCoreCameraByMode === 'function') applyCoreCameraByMode();

    if (t >= 3.3) {
      miracleStageCutscene.active = false;
      miracleMainStagesCleared[1] = true;
      unlockMiracleNotebookEntry('mir_storm', true);
      unlockMiracleNotebookEntry('mir_fish', true);
      saveMiracleNotebookProgress();
      openStageClearModal(1);
    }
    return;
  }

  // 3) [1단계: 그물 던지기]
  if (st.phase === 'cast_net') {
    if (st.boatRootGroup) {
      st.boatRootGroup.position.y = Math.sin(now * 0.0025) * 0.14;
      st.boatRootGroup.rotation.z = Math.sin(now * 0.002) * 0.035;
    }
    if (st.fishSchoolGroup) {
      st.fishSchoolGroup.rotation.y += dt * 1.4;
      st.fishSchoolGroup.position.y = -0.82 + Math.sin(now * 0.006) * 0.16;
    }

    if (st.isCharging) {
      const chargeSpeed = (currentMode === 'kinder') ? 0.88 : 1.15;
      st.chargeVal += st.chargeDir * chargeSpeed * dt;
      if (st.chargeVal >= 1.0) { st.chargeVal = 1.0; st.chargeDir = -1; }
      else if (st.chargeVal <= 0.0) { st.chargeVal = 0.0; st.chargeDir = 1; }
      if (playerLimbs && playerLimbs.rArm && playerLimbs.lArm) {
        playerLimbs.rArm.rotation.x = -1.6 - st.chargeVal * 0.9;
        playerLimbs.lArm.rotation.x = -0.9 - st.chargeVal * 0.5;
      }
      syncMiracleStage1UI();
    }

    if (st.netInFlight && st.flyingNetMesh) {
      st.netFlightT += dt * 1.65;
      const u = Math.min(1.0, st.netFlightT);
      const nx = THREE.MathUtils.lerp(st.netStartPos.x, st.netEndPos.x, u);
      const nz = THREE.MathUtils.lerp(st.netStartPos.z, st.netEndPos.z, u);
      const ny = THREE.MathUtils.lerp(st.netStartPos.y, st.netEndPos.y, u) + Math.sin(u * Math.PI) * 5.2;
      st.flyingNetMesh.position.set(nx, ny, nz);
      st.flyingNetMesh.rotation.y += dt * 6.5;
      const spread = 0.45 + Math.sin(u * Math.PI * 0.75) * 0.85;
      st.flyingNetMesh.scale.set(spread, spread * 0.85, spread);

      if (u >= 1.0) {
        st.netInFlight = false;
        st.flyingNetMesh.visible = false;
        if (st.splashRingMesh) {
          st.splashRingMesh.position.set(st.netEndPos.x, -0.85, st.netEndPos.z);
          st.splashRingMesh.visible = true;
          st.splashTimer = 0.55;
        }

        const diff = st.netPowerUsed - st.targetRatio;
        if (Math.abs(diff) <= st.sweetHalfWidth) {
          st.castCaught++;
          playSfx('rescue');
          if (currentMode === 'timeattack') timeRemaining += 6.0;
          // 배 안 물고기 바구니에 잡은 물고기 실제로 추가
          if (st.catchBasketGrp && typeof createLowPolyFishMesh === 'function') {
            for (let k = 0; k < 2; k++) {
              const caughtF = createLowPolyFishMesh((st.castCaught + k) % 2 === 0 ? '#f97316' : '#38bdf8', 0.72);
              caughtF.position.set((Math.random() - 0.5) * 0.45, 0.55 + st.castCaught * 0.08, (Math.random() - 0.5) * 0.45);
              caughtF.rotation.set(0.3, Math.random() * 6.28, 0.4);
              st.catchBasketGrp.add(caughtF);
            }
          }

          if (st.castCaught >= st.reqCasts) {
            showToast('🐟 만선이에요! 그물 가득 물고기를 잡았는데 갑자기 거센 폭풍우가 몰려옵니다!');
            startGalileeStormPhase();
            return;
          } else {
            updateStageHUD();
            showToast(`🐟 대성공! 그물로 물고기 떼를 잡아 올렸어요! (${st.castCaught}/${st.reqCasts})`);
            st.chargeVal = 0;
            pickNextGalileeFishSchoolTarget();
          }
        } else {
          playSfx('wrong');
          st.chargeVal = 0;
          showToast(diff < 0
            ? '💦 그물이 조금 짧게 떨어졌어요! 버튼을 조금 더 길게 눌러 던져보세요!'
            : '💦 그물이 너무 멀리 날아갔어요! 초록 구간에서 손을 떼보세요!');
          syncMiracleStage1UI();
        }
      }
    }
  }

  // 4) [2단계: 풍랑 중 균형 잡기 + 예수님 누워 주무시기]
  if (st.phase === 'storm_balance') {
    const isKinder = (currentMode === 'kinder');
    st.waveGustTimer -= dt;
    if (st.waveGustTimer <= 0) {
      st.waveGustDir = (Math.random() < 0.65) ? -st.waveGustDir : st.waveGustDir;
      const baseStrength = isKinder ? 0.48 : 0.68;
      st.waveGustForce = st.waveGustDir * (baseStrength + Math.random() * 0.24);
      st.waveGustTimer = isKinder ? (2.0 + Math.random() * 1.0) : (1.5 + Math.random() * 0.9);
      if (Math.random() < 0.45) playSfx('thunder');
    }

    // 파도 흔들림 + 플레이어의 반대쪽 힘주기 적용
    const waveOsc = Math.sin(now * 0.0045) * (isKinder ? 0.14 : 0.22);
    let playerForce = 0;
    const controlPower = isKinder ? 1.85 : 1.70;
    if (st.holdLeft)  playerForce -= controlPower;
    if (st.holdRight) playerForce += controlPower;

    st.boatTilt += (st.waveGustForce + waveOsc + playerForce) * dt;
    // 중앙 약한 자연 복원력
    st.boatTilt *= (1.0 - dt * 0.22);
    st.boatTilt = THREE.MathUtils.clamp(st.boatTilt, -1.0, 1.0);

    // 카메라가 반대쪽(+Z 고물 뒤)에서 -Z(배 앞쪽)를 바라보므로, 화면 오른쪽(+X) 기울기 = -rotZ, 화면 왼쪽(-X) 기울기 = +rotZ!
    const rollAngle = -st.boatTilt * 0.44;
    if (st.boatRootGroup) {
      st.boatRootGroup.rotation.z = rollAngle;
      st.boatRootGroup.position.y = Math.sin(now * 0.006) * 0.48;
      st.boatRootGroup.rotation.x = Math.cos(now * 0.0048) * 0.055;
    }
    if (playerGroup) {
      playerGroup.rotation.z = rollAngle;
    }
    // 플레이어 양팔 균형잡기 포즈
    if (playerLimbs && playerLimbs.lArm && playerLimbs.rArm) {
      playerLimbs.lArm.rotation.z = 0.75 - st.boatTilt * 0.45;
      playerLimbs.rArm.rotation.z = -0.75 - st.boatTilt * 0.45;
    }

    // 예수님 누워서 평안히 호흡하는 미세 움직임
    if (st.jesusMesh) {
      st.jesusMesh.position.y = 0.72 + Math.sin(now * 0.003) * 0.02;
    }

    // 좌·우 버튼을 계속 안 누르고 방치하거나 배가 크게 기울면 균형 게이지가 실제로 깎이도록 처리!
    if (st.holdLeft || st.holdRight) {
      st.noBalanceInputTimer = 0;
    } else {
      st.noBalanceInputTimer = (st.noBalanceInputTimer || 0) + dt;
    }

    if (st.tiltWarnCooldown > 0) st.tiltWarnCooldown -= dt;
    const outOfSafeZone = Math.abs(st.boatTilt) > 0.56;
    const idleUnbalanced = (!st.holdLeft && !st.holdRight && st.noBalanceInputTimer > 1.35 && Math.abs(st.boatTilt) > 0.08);

    if (outOfSafeZone || idleUnbalanced) {
      st.isDrainingGauge = true;
      const drainRate = outOfSafeZone ? (isKinder ? 1.35 : 1.85) : (isKinder ? 1.05 : 1.45);
      st.balanceProgress = Math.max(0, st.balanceProgress - dt * drainRate);
      if (st.tiltWarnCooldown <= 0) {
        st.tiltWarnCooldown = 2.0;
        playSfx('wrong');
        showToast(st.boatTilt < 0
          ? '🚨 배가 기울어 균형 게이지가 깎이고 있어요! [오른쪽 버튼 ▶]을 빠르게 눌러주세요!'
          : '🚨 배가 기울어 균형 게이지가 깎이고 있어요! [◀ 왼쪽 버튼]을 빠르게 눌러주세요!');
      }
    } else {
      st.isDrainingGauge = false;
      st.balanceProgress += dt;
    }

    syncMiracleStage1UI();

    if (st.balanceProgress >= st.balanceGoal) {
      st.phase = 'wake_jesus';
      st.holdLeft = false;
      st.holdRight = false;
      if (st.jesusLabel) {
        st.jesusLabel.innerHTML = '🙏 누워 주무시는 예수님 깨우기! ("주여, 우리가 죽겠나이다!")';
      }
      if (playerLimbs && playerLimbs.lArm && playerLimbs.rArm) {
        playerLimbs.lArm.rotation.z = 0;
        playerLimbs.rArm.rotation.z = 0;
      }
      playSfx('rescue');
      syncMiracleStage1UI();
      updateStageHUD();
      showToast('🙏 풍랑 속에서 끝까지 균형을 잡았어요! 이제 고물에 누워 주무시는 예수님을 깨워드려요!');
    }
  }

  // 5) [3단계: 주무시는 예수님 깨우기 (버튼 클릭 또는 가까이 걸어가기 모두 지원)]
  if (st.phase === 'wake_jesus') {
    const gentleRoll = Math.sin(now * 0.004) * 0.14;
    if (st.boatRootGroup) {
      st.boatRootGroup.rotation.z = THREE.MathUtils.lerp(st.boatRootGroup.rotation.z, gentleRoll, dt * 3.0);
      st.boatRootGroup.position.y = Math.sin(now * 0.005) * 0.30;
    }
    if (playerGroup) playerGroup.rotation.z = gentleRoll;

    if (st.jesusMesh) {
      const worldJPos = new THREE.Vector3();
      st.jesusMesh.getWorldPosition(worldJPos);
      const jd = Math.hypot(playerPos.x - worldJPos.x, playerPos.z - worldJPos.z);
      if (jd < 3.0) {
        triggerGalileeCalmStormCutscene();
        return;
      }
    }
  }

  // 예수님 머리 위 태그 표시
  if (st.jesusMesh && st.jesusLabel) {
    const worldJPos = new THREE.Vector3();
    st.jesusMesh.getWorldPosition(worldJPos);
    const showTag = (st.phase === 'storm_balance' || st.phase === 'wake_jesus');
    updateWorldLabelPos(st.jesusLabel, worldJPos, showTag);
  }
}

// -------------------------------------------------------------------------
// 3. [메인 스테이지 2] 오병이어 사건 (오픈월드 동북쪽 외곽 전망 언덕 지형 그대로 연동)
// -------------------------------------------------------------------------
function buildMiracleMainStage2Loaves() {
  clearWorld();
  resetMiracleBoatRockingTransform();
  miracleSubMode = 'main2_loaves';
  miracleStageObjects = [];

  if (typeof setupMiracleDynamicSunAndShadows === 'function') {
    setupMiracleDynamicSunAndShadows();
  }

  scene.background = new THREE.Color(0x38bdf8);
  scene.fog = new THREE.Fog(0xbae6fd, 90, 290);

  const isKinder = (currentMode === 'kinder');
  const reqBaskets = isKinder ? 8 : 12;

  miracleActiveMiniState = {
    phase: 'find_boy',
    boyFound: false,
    basketsGathered: 0,
    reqBaskets,
    jesusPos: new THREE.Vector3(0, getMiracleGroundHeight(0, -24, 2), -24),
    jesusLabel: null,
    crowdList: [],
    introFlyover: { active: true, timer: 0, duration: 3.4 }
  };

  currentMapRectBounds = { minX: -32, maxX: 32, minZ: -38, maxZ: 34 };

  // 오픈월드와 동일한 크리스프 비인덱스 로우폴리 지형 + 언덕 돌담 + 비정형 벽돌 가옥 혼합 배치
  const s2HeightFn = (vx, vz) => {
    let vy = getMiracleGroundHeight(vx, vz, 2);
    if (vz > 34) vy = Math.max(-0.3, 0.4 - (vz - 34) * 0.03);
    return vy;
  };
  const cS2Meadow = new THREE.Color('#b6b968');
  const cS2Ochre  = new THREE.Color('#d8b674');
  const cS2Slope  = new THREE.Color('#cf9f60');
  const cS2Olive  = new THREE.Color('#8ea854');
  const cS2Top    = new THREE.Color('#7c9a45');
  const cS2Path   = new THREE.Color('#dfb984');
  const hillMesh = (typeof createCrispLowPolyFacetedTerrain === 'function')
    ? createCrispLowPolyFacetedTerrain(180, 180, 50, 50, s2HeightFn, (mx, my, mz, slopeFlat, hash2, outCol) => {
        const onTrail = Math.abs(mx - Math.sin(mz * 0.08) * 4.5) < 3.8 && mz > -24 && mz < 55;
        if (onTrail) {
          outCol.copy(cS2Path);
        } else if (my > 9.5) {
          outCol.copy(cS2Top);
        } else if (my > 2.5 && slopeFlat < 0.945) {
          outCol.copy(cS2Slope);
        } else if (my > 3.2) {
          outCol.copy(cS2Olive);
        } else {
          const patch = hash2(Math.floor(mx * 0.14), Math.floor(mz * 0.14));
          outCol.copy(cS2Meadow).lerp(cS2Ochre, 0.28 + patch * 0.54);
        }
      }, 0.78)
    : new THREE.Mesh(new THREE.PlaneGeometry(180, 180, 48, 48), new THREE.MeshLambertMaterial({ color: '#9ec164', flatShading: true }));
  worldGroup.add(hillMesh);

  if (typeof buildStageDryStoneTerraceWalls === 'function') {
    buildStageDryStoneTerraceWalls(
      [
        { pts: [[-30, 18], [-22, 8], [-18, -4], [-22, -18]], courses: 3 },
        { pts: [[ 30, 18], [ 22, 8], [ 18, -4], [ 22, -18]], courses: 3 },
        { pts: [[-28, -28], [-14, -34], [14, -34], [28, -28]], courses: 2 }
      ],
      s2HeightFn,
      740
    );
  }

  const distantSea = new THREE.Mesh(
    new THREE.PlaneGeometry(180, 260),
    new THREE.MeshLambertMaterial({ color: 0x0284c7, transparent: true, opacity: 0.86, flatShading: true })
  );
  distantSea.rotation.x = -Math.PI / 2;
  distantSea.position.set(-115, -0.35, 30);
  worldGroup.add(distantSea);

  // 경사진 언덕(z < 32) 대신 남쪽 낮은 평지(z = 36~56)에 마을 집(비정형 벽돌 가옥 혼합) 배치
  const villageVistaHouses = [
    { x: -24, z: 36, v: 0, yaw:  0.22, sc: 0.96, m: 'stonebrick' },
    { x:  24, z: 36, v: 2, yaw: -0.22, sc: 0.96, m: 'plaster' },
    { x: -34, z: 44, v: 1, yaw:  0.18, sc: 0.94, m: 'plaster' },
    { x:  34, z: 44, v: 4, yaw: -0.18, sc: 0.94, m: 'stonebrick' },
    { x: -20, z: 48, v: 3, yaw:  0.15, sc: 0.95, m: 'plaster' },
    { x:  -5, z: 52, v: 1, yaw: -0.08, sc: 0.98, m: 'stonebrick' },
    { x:  14, z: 48, v: 2, yaw: -0.20, sc: 0.95, m: 'stonebrick' },
    { x: -38, z: 56, v: 0, yaw:  0.28, sc: 0.92, m: 'plaster' }
  ];
  villageVistaHouses.forEach(vh => {
    addJudeanRoadsideBuilding(vh.x, vh.z, vh.v, vh.yaw, vh.sc, false, vh.m);
  });

  if (typeof createBumpyLowPolyHillMesh === 'function') {
    for (let i = 0; i < 6; i++) {
      createBumpyLowPolyHillMesh(-40 + i * 18, -52 - (i % 2) * 5, 18, 6.8 + (i % 2) * 1.5, 16, '#7ca344', i + 10, true);
    }
    for (let i = 0; i < 5; i++) {
      createBumpyLowPolyHillMesh(48 + (i % 2) * 5, -36 + i * 18, 17, 6.5 + (i % 2) * 1.5, 17, '#84a955', i + 30, true);
    }
  }

  if (typeof addLowPolyCanopyTree === 'function') {
    addLowPolyCanopyTree(-20, -26, 1.25, true);
    addLowPolyCanopyTree( 20, -28, 1.25, true);
  }

  [
    [-22, 2], [22, 2], [-24, -8], [24, -8], [-22, -22], [22, -22],
    [-16, -34], [16, -34], [-26, -16], [26, -16]
  ].forEach(([tx, tz], i) => {
    if (i % 3 === 0) addLowPolyCypressPineTree(tx, tz, 1.15, true);
    else addLowPolyOliveTree(tx, tz, 1.15 + (i % 2) * 0.15, true);
  });

  if (typeof addLowPolyWildflowerCluster === 'function') {
    [[-10, 18], [10, 16], [-12, 4], [12, 6], [-14, -10], [14, -8], [-8, -28], [8, -28]].forEach(([fx, fz]) => {
      addLowPolyWildflowerCluster(fx, fz, 1.0);
    });
  }
  if (typeof createLowPolyAnimalMesh === 'function') {
    const deer = createLowPolyAnimalMesh('deer', 0.95);
    deer.position.set(-15, getMiracleGroundHeight(-15, -4, 2), -4);
    deer.rotation.y = 0.8;
    worldGroup.add(deer);
  }

  addLowPolyRock(-12, 6, 1.5, 0.75, '#94a3b8', true);
  addLowPolyRock( 14, -4, 1.7, 0.80, '#8c8275', true);

  [[-24, 28, -20, 1.25], [22, 30, -15, 1.35], [0, 32, -38, 1.4], [-18, 26, 18, 1.15]].forEach(([cx, cy, cz, sc]) => {
    const cl = createLowPolyCloudGroup(sc, false);
    cl.position.set(cx, cy, cz);
    worldGroup.add(cl);
  });

  const jY = getMiracleGroundHeight(0, -24, 2);
  const jesusMesh = createLowPolyPersonMesh('jesus', 0);
  jesusMesh.position.set(0, jY, -24);
  worldGroup.add(jesusMesh);
  miracleActiveMiniState.jesusLabel = createWorldLabel('✨ 무리를 불쌍히 여기시는 예수님');
  miracleActiveMiniState.jesusLabel.style.opacity = '0';

  // 많은 인파(52명)가 언덕에 둘러앉아 말씀을 듣는 장관 연출 (중앙 보행 통로 확보)
  const crowdRows = [
    { count: 10, rad:  6.4 },
    { count: 13, rad: 10.2 },
    { count: 14, rad: 14.2 },
    { count: 15, rad: 18.2 }
  ];
  let crowdIdx = 0;
  crowdRows.forEach((row, rIdx) => {
    for (let i = 0; i < row.count; i++) {
      const frac = i / Math.max(1, row.count - 1);
      const ang = -0.14 * Math.PI + frac * (1.28 * Math.PI);
      const jitterR = ((crowdIdx * 7) % 5 - 2) * 0.42;
      const cx = Math.cos(ang) * (row.rad + jitterR);
      const cz = -22 + Math.sin(ang) * (row.rad + jitterR) * 0.86;
      // 예수님 앞 중앙 오르막 통로(폭 약 3m)는 비워 두어 쾌적하게 이동
      if (Math.abs(cx) < 1.9 && cz > -21 && cz < -4) { crowdIdx++; continue; }
      const cy = getMiracleGroundHeight(cx, cz, 2);
      const preset = (crowdIdx % 3 === 0) ? 'woman' : (crowdIdx % 7 === 0 ? 'disciple' : 'villager');
      const pMesh = createLowPolyPersonMesh(preset, crowdIdx);
      pMesh.position.set(cx, cy, cz);
      pMesh.lookAt(0, cy, -24);
      worldGroup.add(pMesh);
      miracleActiveMiniState.crowdList.push({ mesh: pMesh, baseX: cx, baseZ: cz, phase: crowdIdx * 0.65 });
      crowdIdx++;
    }
  });

  // [요청 반영] 많은 인파 영역 전체에서 매 플레이마다 도시락 소년 위치를 완전 랜덤 배치!
  let boyX = 9.5, boyZ = -13.0;
  for (let tries = 0; tries < 60; tries++) {
    const rAng = -0.08 * Math.PI + Math.random() * (1.16 * Math.PI);
    const rDist = 7.4 + Math.random() * 11.4;
    const cxCand = Math.cos(rAng) * rDist;
    const czCand = -22 + Math.sin(rAng) * rDist * 0.85;
    // 중앙 보행 통로(|x| < 2.4), 바위((-12,6), (14,-4)), 맵 외곽 제외
    if (Math.abs(cxCand) < 2.5 && czCand > -21 && czCand < -4) continue;
    if (Math.hypot(cxCand + 12, czCand - 6) < 3.4 || Math.hypot(cxCand - 14, czCand + 4) < 3.6) continue;
    if (Math.abs(cxCand) > 19.5 || czCand < -23.5 || czCand > -4.5) continue;
    boyX = Number(cxCand.toFixed(2));
    boyZ = Number(czCand.toFixed(2));
    break;
  }
  const boyY = getMiracleGroundHeight(boyX, boyZ, 2);
  const boyGrp = new THREE.Group();
  const boyMesh = createLowPolyPersonMesh('child', 7);
  const lunchBasketGrp = new THREE.Group();
  const basketMesh = createLowPolyMesh(new THREE.CylinderGeometry(0.32, 0.25, 0.32, 8), '#d97706', 0, 0.80, 0.40);
  const bread1 = createLowPolyMesh(new THREE.IcosahedronGeometry(0.11, 0), '#f59e0b', -0.09, 0.98, 0.42, false);
  const bread2 = createLowPolyMesh(new THREE.IcosahedronGeometry(0.11, 0), '#fbbf24',  0.09, 0.98, 0.38, false);
  const tinyFish = (typeof createLowPolyFishMesh === 'function')
    ? createLowPolyFishMesh('#38bdf8', 0.34)
    : createLowPolyMesh(new THREE.ConeGeometry(0.08, 0.24, 4), '#38bdf8', 0, 1.02, 0.44, false);
  tinyFish.position.set(0.02, 1.02, 0.44);
  tinyFish.rotation.y = 0.7;
  lunchBasketGrp.add(basketMesh, bread1, bread2, tinyFish);
  lunchBasketGrp.visible = false; // 멀리서 눈에 띄지 않도록 숨김 -> 가까이 다가갈 때 노출!
  boyGrp.add(boyMesh, lunchBasketGrp);
  boyGrp.position.set(boyX, boyY, boyZ);
  boyGrp.lookAt(0, boyY, -24);
  boyGrp.visible = true;
  worldGroup.add(boyGrp);

  const boyLbl = createWorldLabel('🍱 보리떡 5개와 물고기 2마리 도시락이 여기 있어요!');
  boyLbl.style.opacity = '0';
  miracleStageObjects.push({
    kind: 'lunch_boy',
    mesh: boyGrp,
    basketGroup: lunchBasketGrp,
    pos: new THREE.Vector3(boyX, boyY + 0.5, boyZ),
    done: false,
    label: boyLbl
  });

  // [요청 반영] 도시락을 갖고 있지 않은 어린이 함정 모델 7명 (매번 인파 곳곳에 랜덤 배치, 소년과 겹침 방지)
  const decoyLines = [
    '👧 나는 도시락이 없어요!',
    '👦 저도 도시락을 안 가져왔어요!',
    '👧 배고파요~ 저는 도시락이 없어요!',
    '👦 어? 저는 빵도 물고기도 없는데요!',
    '👧 도시락을 가진 친구가 인파 어딘가에 있어요!',
    '👦 저는 빈손으로 왔어요! 도시락이 없어요!',
    '👧 저한테는 도시락이 없어요! 다른 친구를 찾아보세요!'
  ];
  const placedKids = [{ x: boyX, z: boyZ }];
  for (let idx = 0; idx < 7; idx++) {
    let fx = (idx % 2 === 0 ? -1 : 1) * (6.5 + idx * 1.4);
    let fz = -9.5 - idx * 1.4;
    for (let t = 0; t < 40; t++) {
      const a = -0.08 * Math.PI + Math.random() * (1.16 * Math.PI);
      const r = 7.0 + Math.random() * 11.8;
      const cx2 = Math.cos(a) * r;
      const cz2 = -22 + Math.sin(a) * r * 0.85;
      if (Math.abs(cx2) < 2.4 && cz2 > -21 && cz2 < -4) continue;
      if (Math.abs(cx2) > 19.5 || cz2 < -23.5 || cz2 > -4.5) continue;
      if (placedKids.some(pk => Math.hypot(pk.x - cx2, pk.z - cz2) < 3.6)) continue;
      fx = Number(cx2.toFixed(2));
      fz = Number(cz2.toFixed(2));
      break;
    }
    placedKids.push({ x: fx, z: fz });
    const dy = getMiracleGroundHeight(fx, fz, 2);
    const dMesh = createLowPolyPersonMesh('child', idx + 12);
    dMesh.position.set(fx, dy, fz);
    dMesh.lookAt(0, dy, -24);
    dMesh.visible = true;
    worldGroup.add(dMesh);

    const dLbl = createWorldLabel(decoyLines[idx % decoyLines.length]);
    dLbl.style.opacity = '0';
    miracleStageObjects.push({
      kind: 'decoy_child',
      mesh: dMesh,
      pos: new THREE.Vector3(fx, dy + 0.5, fz),
      msg: decoyLines[idx % decoyLines.length],
      lastToastAt: 0,
      label: dLbl
    });
  }

  // 스테이지 2 시작 시 기본 시점으로 고정 + 버드뷰로 언덕을 한 번 훑고 캐릭터 시점으로 내려옴!
  window.globalCameraViewMode = 'default';
  const camLbl2 = document.getElementById('global-camera-view-label');
  if (camLbl2) camLbl2.textContent = '기본';

  playerPos.set(0, getMiracleGroundHeight(0, 18, 2), 18);
  lastGroundedY = playerPos.y;
  playerVelY = 0;
  isGrounded = true;
  playerFacing = Math.PI;
  cameraYaw = 0;
  cameraTargetYaw = 0;
  snapCameraToPlayer();

  showToast('🦅 벳새다 언덕에 모인 수많은 인파를 둘러본 뒤, 보리떡 5개와 물고기 2마리 도시락을 가진 소년을 찾아보세요!');
}

function spawnTwelveLeftoverBaskets(count) {
  for (let i = 0; i < count; i++) {
    const ang = (i / count) * Math.PI * 2;
    const rad = 6.5 + (i % 3) * 4.2;
    const bx = Math.cos(ang) * rad;
    const bz = -18 + Math.sin(ang) * (rad * 0.75);
    const by = getMiracleGroundHeight(bx, bz, 2);

    const bGrp = new THREE.Group();
    const basket = createLowPolyMesh(new THREE.CylinderGeometry(0.48, 0.36, 0.45, 8), '#d97706', 0, 0.25, 0);
    const breadCap = createLowPolyMesh(new THREE.IcosahedronGeometry(0.38, 0), '#fde047', 0, 0.52, 0, false);
    breadCap.scale.set(1.1, 0.6, 1.1);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.85, 1.25, 18),
      new THREE.MeshBasicMaterial({ color: 0x4ade80, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.06;
    bGrp.add(basket, breadCap, ring);
    bGrp.position.set(bx, by, bz);
    worldGroup.add(bGrp);

    const lbl = createWorldLabel(`🧺 남은 떡 광주리 (${i + 1}/${count})`);
    lbl.style.opacity = '0';
    miracleStageObjects.push({
      kind: 'leftover_basket',
      mesh: bGrp,
      pos: new THREE.Vector3(bx, by + 0.4, bz),
      done: false,
      label: lbl
    });
  }
}

function updateMiracleMainStage2Frame(dt, now) {
  if (typeof updateMiracleDynamicSun === 'function') {
    updateMiracleDynamicSun(dt, now);
  }
  const st = miracleActiveMiniState;
  let nextGuidePos = null;

  // 시작 버드뷰 언덕 스윕 인트로 진행 (끝나면 자동으로 캐릭터 기본 시점으로 착륙!)
  if (st.introFlyover && st.introFlyover.active) {
    st.introFlyover.timer += dt;
    if (typeof applyCoreCameraByMode === 'function') applyCoreCameraByMode();
    if (st.introFlyover.timer >= (st.introFlyover.duration || 3.4)) {
      st.introFlyover.active = false;
      if (typeof snapCameraToPlayer === 'function') snapCameraToPlayer();
      showToast('🍱 이제 언덕 위 많은 인파 속에서 도시락을 가진 어린아이를 직접 찾아보세요!');
    }
  }

  if (st.crowdList) {
    st.crowdList.forEach(c => {
      const u = c.mesh.userData;
      if (u && u.lArm && u.rArm) {
        const wave = Math.sin(now * 0.005 + c.phase) * 0.25;
        u.lArm.rotation.x = -0.35 + wave;
        u.rArm.rotation.x = -0.35 - wave;
      }
    });
  }

  if (st.phase === 'find_boy') {
    const boyObj = miracleStageObjects.find(x => x.kind === 'lunch_boy');
    // 인파가 모인 언덕 중앙 방향으로만 안내(정확한 꼬마 위치는 직접 탐색!)
    const distToCrowdCenter = Math.hypot(playerPos.x - 0, playerPos.z - (-14));
    if (distToCrowdCenter > 13.0) {
      nextGuidePos = new THREE.Vector3(0, getMiracleGroundHeight(0, -14, 2), -14);
    }

    // 함정 역할: 도시락 없는 어린이들 근접 태그 및 말풍선 토스트
    miracleStageObjects.forEach(dc => {
      if (dc.kind !== 'decoy_child') return;
      const dd = Math.hypot(playerPos.x - dc.pos.x, playerPos.z - dc.pos.z);
      updateWorldLabelPos(dc.label, dc.pos, dd < 4.2);
      if (dd < 2.2 && (!dc.lastToastAt || now - dc.lastToastAt > 4200)) {
        dc.lastToastAt = now;
        playSfx('step');
        showToast(dc.msg);
      }
    });

    if (boyObj && !boyObj.done) {
      const d = Math.hypot(playerPos.x - boyObj.pos.x, playerPos.z - boyObj.pos.z);
      // 아주 가까이(4.2m 이내) 다가갔을 때만 도시락 에셋과 머리 위 태그 함께 노출!
      if (boyObj.basketGroup) {
        boyObj.basketGroup.visible = (d < 4.2);
      }
      updateWorldLabelPos(boyObj.label, boyObj.pos, d < 4.2);

      if (d < 2.4) {
        boyObj.done = true;
        boyObj.mesh.visible = false;
        boyObj.label.style.opacity = '0';
        miracleStageObjects.forEach(dc => {
          if (dc.kind === 'decoy_child' && dc.label) dc.label.style.opacity = '0';
        });
        st.phase = 'bring_to_jesus';
        playSfx('rescue');
        if (currentMode === 'timeattack') timeRemaining += 7.0;
        if (st.jesusLabel) st.jesusLabel.innerHTML = '🍞 예수님께 어린아이의 오병이어 도시락 드리기!';
        updateStageHUD();
        showToast('🍞 드디어 찾았어요! 어린아이의 보리떡 5개와 물고기 2마리를 언덕 위 예수님께 가져다드리세요!');
      }
    }
  } else if (st.phase === 'bring_to_jesus') {
    nextGuidePos = st.jesusPos;
    const jd = Math.hypot(playerPos.x - st.jesusPos.x, playerPos.z - st.jesusPos.z);
    if (st.jesusLabel) updateWorldLabelPos(st.jesusLabel, st.jesusPos, jd < MIRACLE_STAGE_TAG_DIST);

    if (jd < 3.0) {
      st.phase = 'gather_baskets';
      if (st.jesusLabel) st.jesusLabel.style.opacity = '0';
      spawnTwelveLeftoverBaskets(st.reqBaskets);
      playSfx('clear');
      if (currentMode === 'timeattack') timeRemaining += 8.0;
      updateStageHUD();
      showToast(`🧺 [3단계] 예수님이 축사하시자 모두가 배불리 먹었습니다! 남은 조각 ${st.reqBaskets}광주리를 모두 거두세요!`);
    }
  } else if (st.phase === 'gather_baskets') {
    miracleStageObjects.forEach(obj => {
      if (obj.kind !== 'leftover_basket' || obj.done) return;
      obj.mesh.rotation.y += dt * 1.8;
      const d = Math.hypot(playerPos.x - obj.pos.x, playerPos.z - obj.pos.z);
      updateWorldLabelPos(obj.label, obj.pos, d < MIRACLE_STAGE_TAG_DIST);
      if (!nextGuidePos) nextGuidePos = obj.pos;

      if (d < 2.3) {
        obj.done = true;
        obj.mesh.visible = false;
        obj.label.style.opacity = '0';
        st.basketsGathered++;
        playSfx('rescue');
        if (currentMode === 'timeattack') timeRemaining += 4.0;

        if (st.basketsGathered >= st.reqBaskets) {
          miracleMainStagesCleared[2] = true;
          unlockMiracleNotebookEntry('mir_loaves', true);
          saveMiracleNotebookProgress();
          openStageClearModal(2);
          return;
        } else {
          updateStageHUD();
          showToast(`🧺 남은 조각 광주리 수거! (${st.basketsGathered}/${st.reqBaskets})`);
        }
      }
    });
  }

  if (nextGuidePos && guideArrowGroup && guideArrowGroup.visible) {
    const baseFacing = (window.globalCameraViewMode === 'fps') ? (cameraYaw + Math.PI) : playerFacing;
    guideArrowGroup.rotation.y = Math.atan2(nextGuidePos.x - playerPos.x, nextGuidePos.z - playerPos.z) - baseFacing;
  }
}

// -------------------------------------------------------------------------
// [스테이지 공용] 리디자인 소프트 로우 폴리곤 비정형 예루살렘 성전 & 외곽 계단 성문 단지 빌더
// - 오픈월드 성전과 동일한 비정형 석조 매스 · 아치 성문 · 붉은 휘장 · 야긴/보아스 기둥 · 정점색 병합 적용
// -------------------------------------------------------------------------
function buildStageJerusalemTemple(cx = 0, cy = 0, cz = 54, scale = 1.0, rotY = 0, withOuterGate = true, gateDist = 16) {
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

  const rootGrp = new THREE.Group();
  const makeOrgBox = (target, w, h, d, col, x, y, z, seed, irr = 0.032, taper = 0.96, seg = 2) => {
    const geo = (typeof createOrganicBoxGeo === 'function')
      ? createOrganicBoxGeo(w, h, d, seed, irr, taper, seg)
      : new THREE.BoxGeometry(w, h, d);
    const m = createLowPolyMesh(geo, col, x, y, z, true);
    target.add(m);
    return m;
  };

  // [A] 전면 외곽 비정형 망루 & 양측 계단 성문
  if (withOuterGate) {
    const outerGateGrp = new THREE.Group();
    [-4.0, 4.0].forEach((tx, idx) => {
      makeOrgBox(outerGateGrp, 2.55, 5.2, 2.55, cCourtWall, tx, 2.6, 0, 610 + idx, 0.038, 0.89, 2);
      makeOrgBox(outerGateGrp, 2.75, 0.44, 2.75, cSandDark, tx, 5.34, 0, 614 + idx, 0.04, 0.96, 1);
      [[-0.95, -0.95], [0.95, -0.95], [-0.95, 0.95], [0.95, 0.95]].forEach(([mx, mz], mi) => {
        makeOrgBox(outerGateGrp, 0.46, 0.50, 0.46, cCourtWall, tx + mx, 5.76, mz, 620 + idx * 4 + mi, 0.08, 0.86, 1);
      });
      outerGateGrp.add(createLowPolyMesh(new THREE.BoxGeometry(0.42, 1.05, 2.62), cDarkVoid, tx, 3.25, 0, false));
    });
    makeOrgBox(outerGateGrp, 6.0, 0.96, 1.90, cSandDark, 0, 4.55, 0, 630, 0.036, 0.96, 2);
    makeOrgBox(outerGateGrp, 3.3, 0.40, 2.02, cGoldMain, 0, 4.58, 0, 631, 0.04, 0.96, 1);
    [-2.65, 2.65].forEach((bx, bi) => {
      makeOrgBox(outerGateGrp, 0.68, 1.05, 0.68, cSandBase, bx, 0.52, -1.55, 634 + bi, 0.05, 0.92, 1);
      const br = createLowPolyMesh(new THREE.CylinderGeometry(0.32, 0.20, 0.36, 7), cBronze, bx, 1.22, -1.55, false);
      const fl = createLowPolyMesh(new THREE.DodecahedronGeometry(0.20, 0), '#fb923c', bx, 1.50, -1.55, false);
      fl.userData._emissiveGlow = true;
      outerGateGrp.add(br, fl);
    });
    [-7.4, 7.4].forEach((wx, idx) => {
      makeOrgBox(outerGateGrp, 4.5, 3.85, 1.65, cSandBase, wx, 1.92, 0, 640 + idx, 0.034, 0.94, 2);
    });
    [-10.2, 10.2].forEach((ox, idx) => {
      makeOrgBox(outerGateGrp, 2.40, 4.85, 2.40, cCourtWall, ox, 2.42, 0, 645 + idx, 0.038, 0.89, 2);
      makeOrgBox(outerGateGrp, 2.62, 0.42, 2.62, cSandDark, ox, 4.96, 0, 648 + idx, 0.04, 0.96, 1);
    });
    [-8.6, -7.4, -6.2, 6.2, 7.4, 8.6].forEach((bx, bi) => {
      makeOrgBox(outerGateGrp, 0.56, 0.54, 0.64, cSandDark, bx, 4.08, -0.45, 665 + bi, 0.08, 0.88, 1);
    });
    [-7.4, 7.4].forEach((sx, si) => {
      for (let s = 0; s < 4; s++) {
        const sh = 0.45 * (s + 1);
        const sd = 2.8 - s * 0.6;
        makeOrgBox(outerGateGrp, 3.6, sh, sd, s % 2 === 0 ? cSandDark : cSandBase, sx, sh * 0.5, -1.8 + s * 0.3, 675 + si * 4 + s, 0.035, 0.97, 1);
      }
    });
    if (typeof mergeStaticLowPolyGroupToVertexColor === 'function') {
      mergeStaticLowPolyGroupToVertexColor(outerGateGrp, { registerWall: true, castShadow: true });
    }
    outerGateGrp.position.set(0, 0, -gateDist);
    rootGrp.add(outerGateGrp);
  }

  // [B] 비정형 사암 기단 & 4모서리 망루 성벽 & 순백색 성소 본관 (야긴·보아스 청동기둥 + 붉은 휘장)
  const templeGrp = new THREE.Group();
  makeOrgBox(templeGrp, 18.2, 1.25, 16.2, cSandBase, 0, 0.62, 0, 701, 0.028, 0.95, 2);
  makeOrgBox(templeGrp, 15.6, 0.56, 13.6, cSandDark, 0, 1.48, 0.1, 702, 0.025, 0.97, 2);
  for (let s = 0; s < 3; s++) {
    const sh = 0.40 * (s + 1);
    const sd = 2.6 - s * 0.68;
    makeOrgBox(templeGrp, 8.0 - s * 0.35, sh, sd, s % 2 === 0 ? cSandDark : cSandBase, 0, sh * 0.5, -8.5 + s * 0.34, 710 + s, 0.035, 0.97, 1);
  }

  const wH = 2.75, wT = 0.85;
  makeOrgBox(templeGrp, 5.5, wH, wT, cCourtWall, -4.7, 1.2 + wH * 0.5, -6.5, 720, 0.032, 0.94, 2);
  makeOrgBox(templeGrp, 5.5, wH, wT, cCourtWall,  4.7, 1.2 + wH * 0.5, -6.5, 721, 0.032, 0.94, 2);
  makeOrgBox(templeGrp, 4.4, 0.92, wT + 0.14, cSandDark, 0, 1.2 + wH - 0.35, -6.5, 722, 0.035, 0.95, 2);
  makeOrgBox(templeGrp, 15.2, wH, wT, cCourtWall, 0, 1.2 + wH * 0.5, 6.5, 723, 0.030, 0.94, 2);
  makeOrgBox(templeGrp, wT, wH, 13.0, cCourtWall, -7.3, 1.2 + wH * 0.5, 0, 724, 0.030, 0.94, 2);
  makeOrgBox(templeGrp, wT, wH, 13.0, cCourtWall,  7.3, 1.2 + wH * 0.5, 0, 725, 0.030, 0.94, 2);

  if (typeof createOrganicArchedEntranceGroup === 'function') {
    const outerArch = createOrganicArchedEntranceGroup(2.15, 2.35, cSandDark, cDarkVoid, cGoldMain, 728);
    outerArch.position.set(0, 1.22, -6.55);
    outerArch.rotation.y = Math.PI;
    templeGrp.add(outerArch);
  }

  [[-7.3, -6.5], [7.3, -6.5], [-7.3, 6.5], [7.3, 6.5]].forEach(([tx, tz], idx) => {
    makeOrgBox(templeGrp, 2.35, 4.1, 2.35, cCourtWall, tx, 1.2 + 2.05, tz, 750 + idx, 0.038, 0.88, 2);
    makeOrgBox(templeGrp, 2.55, 0.44, 2.55, cSandDark, tx, 1.2 + 4.18, tz, 755 + idx, 0.04, 0.96, 1);
  });

  makeOrgBox(templeGrp, 5.6, 3.6, 1.75, cCourtWall, 0, 1.65 + 1.80, -2.55, 780, 0.032, 0.94, 2);
  makeOrgBox(templeGrp, 6.1, 0.44, 2.05, cSandDark,  0, 1.65 + 3.72, -2.55, 781, 0.04, 0.96, 1);
  if (typeof createOrganicArchedEntranceGroup === 'function') {
    const innerArch = createOrganicArchedEntranceGroup(2.1, 2.55, cGoldMain, cDarkVoid, cBronze, 782);
    innerArch.position.set(0, 1.65, -3.40);
    innerArch.rotation.y = Math.PI;
    templeGrp.add(innerArch);
  }

  const sBaseY = 1.68, sH = 8.6;
  makeOrgBox(templeGrp, 11.0, sH, 3.0, cWhiteWarm, 0, sBaseY + sH * 0.5, 0.15, 800, 0.022, 0.96, 2);
  makeOrgBox(templeGrp,  9.6, sH, 6.0, cWhiteWarm, 0, sBaseY + sH * 0.5, 2.85, 801, 0.022, 0.96, 2);
  makeOrgBox(templeGrp,  4.5, 6.2, 0.50, cWhiteShade, 0, sBaseY + 3.1, -1.28, 810, 0.03, 0.97, 2);
  makeOrgBox(templeGrp,  4.8, 0.42, 0.62, cGoldMain,  0, sBaseY + 6.32, -1.32, 814, 0.04, 0.96, 1);
  templeGrp.add(
    createLowPolyMesh(new THREE.BoxGeometry(3.2, 5.3, 0.18), cDarkVoid, 0, sBaseY + 2.65, -1.42, false),
    createLowPolyMesh(createOrganicBoxGeo(1.75, 4.95, 0.18, 813, 0.03, 0.98, 2), cGoldMain, 0, sBaseY + 2.52, -1.52, true),
    createLowPolyMesh(createOrganicBoxGeo(0.76, 5.15, 0.24, 811, 0.08, 0.92, 2), cCrimson, -1.16, sBaseY + 2.62, -1.60, true),
    createLowPolyMesh(createOrganicBoxGeo(0.76, 5.15, 0.24, 812, 0.08, 0.92, 2), cCrimson,  1.16, sBaseY + 2.62, -1.60, true),
    createLowPolyMesh(createOrganicBoxGeo(3.25, 0.56, 0.26, 815, 0.06, 0.96, 2), cCrimson, 0, sBaseY + 5.12, -1.62, true)
  );
  [-2.45, 2.45].forEach(px => {
    templeGrp.add(
      createLowPolyMesh(new THREE.CylinderGeometry(0.46, 0.54, 0.55, 8), cSandDark, px, sBaseY + 0.28, -1.68, true),
      createLowPolyMesh(new THREE.CylinderGeometry(0.32, 0.38, 5.4, 8), cBronze, px, sBaseY + 3.2, -1.68, true),
      createLowPolyMesh(new THREE.CylinderGeometry(0.56, 0.34, 0.72, 8), cGoldBright, px, sBaseY + 6.15, -1.68, true)
    );
  });

  const pilH = sH - 1.4;
  [-4.5, -3.2, 3.2, 4.5].forEach((px, i) => {
    templeGrp.add(createLowPolyMesh(new THREE.CylinderGeometry(0.28, 0.34, pilH, 6), cWhiteShade, px, sBaseY + pilH * 0.5, -1.34, true));
    makeOrgBox(templeGrp, 0.78, 0.44, 0.52, cGoldMain, px, sBaseY + pilH + 0.16, -1.34, 820 + i, 0.06, 1.08, 1);
  });

  const topY = sBaseY + sH;
  makeOrgBox(templeGrp, 11.4, 0.58, 3.35, cGoldMain,   0, topY - 0.55, 0.15, 850, 0.03, 1.02, 2);
  makeOrgBox(templeGrp, 10.0, 0.58, 6.25, cGoldMain,   0, topY - 0.55, 2.85, 851, 0.03, 1.02, 2);
  makeOrgBox(templeGrp, 11.6, 0.48, 3.55, cWhiteShade, 0, topY + 0.06, 0.15, 852, 0.03, 1.01, 2);
  makeOrgBox(templeGrp, 10.2, 0.48, 6.45, cWhiteShade, 0, topY + 0.06, 2.85, 853, 0.03, 1.01, 2);
  makeOrgBox(templeGrp, 11.7, 0.34, 3.65, cGoldBright, 0, topY + 0.45, 0.15, 854, 0.03, 1.00, 1);
  makeOrgBox(templeGrp, 10.3, 0.34, 6.55, cGoldBright, 0, topY + 0.45, 2.85, 855, 0.03, 1.00, 1);

  const spikeGeo = new THREE.ConeGeometry(0.28, 0.80, 4);
  for (let i = -5; i <= 5; i++) {
    const sp = createLowPolyMesh(spikeGeo, cGoldBright, i * 1.02, topY + 0.98, -1.48, false);
    sp.rotation.y = Math.PI / 4;
    templeGrp.add(sp);
  }
  for (let i = -4; i <= 4; i++) {
    const sp = createLowPolyMesh(spikeGeo, cGoldBright, i * 1.08, topY + 0.98, 5.82, false);
    sp.rotation.y = Math.PI / 4;
    templeGrp.add(sp);
  }

  if (typeof mergeStaticLowPolyGroupToVertexColor === 'function') {
    mergeStaticLowPolyGroupToVertexColor(templeGrp, { registerWall: true, castShadow: true });
  }
  rootGrp.add(templeGrp);
  rootGrp.position.set(cx, cy, cz);
  rootGrp.rotation.y = rotY;
  rootGrp.scale.set(scale, scale, scale);
  worldGroup.add(rootGrp);

  if (Math.abs(rotY) < 0.05 && scale >= 0.9) {
    colliders.push(
      { minX: cx - 9.3 * scale, maxX: cx + 9.3 * scale, minZ: cz - 8.2 * scale, maxZ: cz + 8.3 * scale },
      { minX: cx - 4.2 * scale, maxX: cx + 4.2 * scale, minZ: cz - 10.0 * scale, maxZ: cz - 7.9 * scale }
    );
    if (withOuterGate) {
      const gz = cz - gateDist * scale;
      colliders.push(
        { minX: cx - 11.8 * scale, maxX: cx - 2.6 * scale, minZ: gz - 3.6 * scale, maxZ: gz + 1.8 * scale },
        { minX: cx + 2.6 * scale,  maxX: cx + 11.8 * scale, minZ: gz - 3.6 * scale, maxZ: gz + 1.8 * scale }
      );
    }
  }
  return rootGrp;
}

// -------------------------------------------------------------------------
// [공용 헬퍼] 얼굴·두건 관통 0% — 등에 지는 나무 십자가 모델 빌더
// - 수직 기둥과 가로 들보를 등 뒤(-Z <= -0.45)에 깔끔히 안착시키고 어깨 결속 로프 표현
// -------------------------------------------------------------------------
function createCarryableWoodenCross(scale = 1.0) {
  const crossGrp = new THREE.Group();
  const cWoodDark  = '#562b10';
  const cWoodGrain = '#6e3a18';
  const cRope      = '#ccb082';
  const mkOrg = (w, h, d, col, x, y, z, sd, irr = 0.09, taper = 0.92, seg = 2) => {
    const geo = (typeof createOrganicBoxGeo === 'function')
      ? createOrganicBoxGeo(w, h, d, sd, irr, taper, seg)
      : new THREE.BoxGeometry(w, h, d);
    return createLowPolyMesh(geo, col, x, y, z, true);
  };

  // 비정형 손도끼 가공 세로 기둥 (등 뒤 z = -0.56 위치, 머리/후드 관통 0%)
  const vBeam = mkOrg(0.21, 2.74, 0.19, cWoodDark, 0, 1.44, -0.56, 401, 0.10, 0.91, 2);
  vBeam.rotation.x = 0.08;
  // 비정형 가로 들보 (끝단이 거칠게 다듬어진 통나무)
  const hBeam = mkOrg(2.08, 0.20, 0.18, cWoodGrain, 0, 1.98, -0.51, 402, 0.11, 0.94, 3);
  hBeam.rotation.z = 0.025;
  // 중앙 교차점 X자 결속 밧줄 & 나무 쐐기
  const knotA = mkOrg(0.32, 0.08, 0.25, cRope, 0, 1.98, -0.51, 403, 0.06, 0.96, 1);
  knotA.rotation.z = 0.78;
  const knotB = mkOrg(0.32, 0.08, 0.25, cRope, 0, 1.98, -0.51, 404, 0.06, 0.96, 1);
  knotB.rotation.z = -0.78;
  const strapL = createBranchSegmentMesh(new THREE.Vector3(-0.26, 1.92, -0.45), new THREE.Vector3(-0.24, 1.50, 0.04), 0.032, 0.032, cRope);
  const strapR = createBranchSegmentMesh(new THREE.Vector3( 0.26, 1.92, -0.45), new THREE.Vector3( 0.24, 1.50, 0.04), 0.032, 0.032, cRope);

  crossGrp.add(vBeam, hBeam, knotA, knotB, strapL, strapR);
  crossGrp.scale.set(scale, scale, scale);
  crossGrp.userData.crossStyle = 'organic_soft_lowpoly_v13';
  return crossGrp;
}

// -------------------------------------------------------------------------
// 4. [메인 스테이지 3] 십자가 사건: 새 예루살렘 성전 단지(출발지 뒤편) + 넓어진 골고다 언덕과 세 십자가
// -------------------------------------------------------------------------
function buildMiracleMainStage3Cross() {
  clearWorld();
  resetMiracleBoatRockingTransform();
  miracleSubMode = 'main3_cross';
  miracleStageObjects = [];

  if (typeof setupMiracleDynamicSunAndShadows === 'function') {
    setupMiracleDynamicSunAndShadows();
  }

  scene.background = new THREE.Color(0x94a3b8);
  scene.fog = new THREE.Fog(0x94a3b8, 55, 195);

  miracleActiveMiniState = {
    phase: 'find_jesus',
    cluesFound: 0,
    reqClues: 2,
    jesusMesh: null,
    jesusLabel: null,
    crossProp: null,
    goalRing: null,
    goalPos: new THREE.Vector3(0, getMiracleGroundHeight(0, -50, 3), -50),
    goalLabel: null,
    summitCrossesGrp: null,
    stumbleCheckpoints: [-19.5, -31.0, -41.5],
    stumbleIdx: 0,
    stumbleState: 'none', // 'none' | 'falling' | 'down'
    stumbleFallAmt: 0,
    stumbleHoldTime: 0,
    standUpEffort: 0,
    stumbleTimer: 0,
    stumbleDusts: []
  };

  currentMapRectBounds = { minX: -26, maxX: 26, minZ: -60, maxZ: 34 };

  // 오픈월드와 동일한 크리스프 비인덱스 로우폴리 지형 + 성전 앞 큰벽돌 도로 + 골고다 언덕 돌담
  const s3HeightFn = (vx, vz) => getMiracleGroundHeight(vx, vz, 3);
  const cS3Plaza    = new THREE.Color('#c7baa4');
  const cS3Road     = new THREE.Color('#dfb984');
  const cS3Meadow   = new THREE.Color('#b6b968');
  const cS3Ochre    = new THREE.Color('#d8b674');
  const cS3Slope    = new THREE.Color('#cf9f60');
  const cS3Golgotha = new THREE.Color('#9e907c');
  const roadMesh = (typeof createCrispLowPolyFacetedTerrain === 'function')
    ? createCrispLowPolyFacetedTerrain(130, 140, 44, 52, s3HeightFn, (mx, my, mz, slopeFlat, hash2, outCol) => {
        const onCenterRoad = Math.abs(mx) < 5.4 && mz > -50;
        if (mz >= -6 && mz <= 66 && Math.abs(mx) < 18) {
          outCol.copy(cS3Plaza);
        } else if (onCenterRoad) {
          outCol.copy(cS3Road);
        } else if (mz < -8 && Math.abs(mx) < 28) {
          outCol.copy(slopeFlat < 0.94 ? cS3Slope : cS3Golgotha);
        } else {
          const patch = hash2(Math.floor(mx * 0.14), Math.floor(mz * 0.14));
          outCol.copy(cS3Meadow).lerp(cS3Ochre, 0.30 + patch * 0.52);
        }
      }, 0.65)
    : new THREE.Mesh(new THREE.PlaneGeometry(130, 140, 44, 56), new THREE.MeshLambertMaterial({ color: '#d6ccc2', flatShading: true }));
  worldGroup.add(roadMesh);

  if (typeof buildStageIrregularStonePavement === 'function') {
    buildStageIrregularStonePavement(
      [{ minX: -7.5, maxX: 7.5, minZ: -6.5, maxZ: 36.5, stepX: 2.0, stepZ: 1.72 }],
      s3HeightFn,
      910
    );
  }
  if (typeof buildStageDryStoneTerraceWalls === 'function') {
    buildStageDryStoneTerraceWalls(
      [
        { pts: [[-22, -14], [-15, -26], [-12, -40], [-18, -52]], courses: 3 },
        { pts: [[ 22, -14], [ 15, -26], [ 12, -40], [ 18, -52]], courses: 3 }
      ],
      s3HeightFn,
      780
    );
  }

  // 북쪽 골고다 언덕 정상(z = -54)의 비정형 소프트 로우폴리 세 십자가
  const summitCrossesGrp = new THREE.Group();
  [
    [ 0.0, -54.5, 1.42, 0.0],
    [-7.2, -53.0, 1.08,  0.18],
    [ 7.2, -53.0, 1.08, -0.18]
  ].forEach(([cx, cz, sc, rotY], idx) => {
    const cy = getMiracleGroundHeight(cx, cz, 3);
    const singleCross = (typeof createOrganicLowPolyCrossMesh === 'function')
      ? createOrganicLowPolyCrossMesh(sc, { seed: 420 + idx * 29, withBase: true, withPlaque: idx === 0 })
      : new THREE.Group();
    if (singleCross.children.length === 0) {
      const rockBase = createLowPolyMesh(new THREE.DodecahedronGeometry(1.05 * sc, 0), '#78716c', 0, 0.35 * sc, 0, true);
      rockBase.scale.set(1.25, 0.55, 1.25);
      const vBeam = createLowPolyMesh(new THREE.CylinderGeometry(0.20 * sc, 0.25 * sc, 5.5 * sc, 6), '#5c2d0c', 0, 2.75 * sc, 0, true);
      const hBeam = createLowPolyMesh(new THREE.CylinderGeometry(0.16 * sc, 0.16 * sc, 3.3 * sc, 6), '#5c2d0c', 0, 4.0 * sc, 0, true);
      hBeam.rotation.z = Math.PI / 2;
      singleCross.add(rockBase, vBeam, hBeam);
    }
    singleCross.position.set(cx, cy - 0.10 * sc, cz);
    singleCross.rotation.y = rotY;
    summitCrossesGrp.add(singleCross);
  });
  worldGroup.add(summitCrossesGrp);
  miracleActiveMiniState.summitCrossesGrp = summitCrossesGrp;

  // ✅ 출발지 바로 뒤편(z = 38 외곽 성문 ~ z = 54 성전 본관)에 리디자인 비정형 예루살렘 성전 단지 배치!
  buildStageJerusalemTemple(0, 0, 54, 1.0, 0, true, 16);

  // 계단끼리 겹치지 않도록 넉넉한 간격(11.5m) + 비정형 벽돌 가옥 혼합 배치
  const streetHouses = [
    { x: -15.0, z: 27.5, v: 0, yaw:  Math.PI / 2, m: 'stonebrick' },
    { x:  15.0, z: 27.5, v: 1, yaw: -Math.PI / 2, m: 'plaster' },
    { x: -15.0, z: 15.5, v: 2, yaw:  Math.PI / 2, m: 'plaster' },
    { x:  15.0, z: 15.5, v: 2, yaw: -Math.PI / 2, m: 'stonebrick' },
    { x: -15.0, z:  4.0, v: 1, yaw:  Math.PI / 2, m: 'stonebrick' },
    { x:  15.0, z:  4.0, v: 0, yaw: -Math.PI / 2, m: 'plaster' },
    { x: -15.0, z: -7.5, v: 4, yaw:  Math.PI / 2, m: 'plaster' },
    { x:  15.0, z: -7.5, v: 4, yaw: -Math.PI / 2, m: 'stonebrick' }
  ];
  streetHouses.forEach(sh => {
    addJudeanRoadsideBuilding(sh.x, sh.z, sh.v, sh.yaw, 0.96, false, sh.m);
  });

  if (typeof createBumpyLowPolyHillMesh === 'function') {
    createBumpyLowPolyHillMesh(-44, -28, 18, 7.5, 18, '#7ca344', 5, true);
    createBumpyLowPolyHillMesh( 44, -28, 18, 7.5, 18, '#84a955', 6, true);
    createBumpyLowPolyHillMesh(  0, -78, 28, 9.5, 18, '#8c8275', 7, true);
  }

  [[-3.4, -20], [3.6, -28], [-3.0, -36], [3.2, -42], [-12.5, -24], [12.5, -34], [-14.0, -48], [14.0, -48]].forEach(([rx, rz], i) => {
    addLowPolyRock(rx, rz, 1.45, 0.75, i % 2 === 0 ? '#78716c' : '#94a3b8', true);
  });
  [[-19, -22], [19, -22], [-20, -36], [20, -36], [-18, -52], [18, -52]].forEach(([tx, tz], i) => {
    if (i % 2 === 0) addLowPolyCypressPineTree(tx, tz, 1.15, true);
    else addLowPolyOliveTree(tx, tz, 1.15, true);
  });

  [[-18, 22, -25, 1.2], [18, 24, -30, 1.3], [0, 26, -55, 1.4]].forEach(([cx, cy, cz, sc]) => {
    const cl = createLowPolyCloudGroup(sc, false);
    cl.position.set(cx, cy, cz);
    worldGroup.add(cl);
  });

  const clueSpecs = [
    { x: -5.5, z: 18, title: '😢 울고 있는 예루살렘 여인 (단서 1/2)', msg: '"로마 병사들이 예수님을 끌고 북쪽 성문 골목으로 지나갔어요! 어서 앞쪽 거리로 가보세요!"' },
    { x:  5.5, z:  4, title: '🗣️ 안타까워하는 시골 행인 (단서 2/2)', msg: '"저기 성문 앞 오르막길 입구에서 예수님이 무거운 십자가 때문에 쓰러지셨어요! 달려가 도와드리세요!"' }
  ];
  clueSpecs.forEach((cs, idx) => {
    const cy = getMiracleGroundHeight(cs.x, cs.z, 3);
    const grp = new THREE.Group();
    const npc = createLowPolyPersonMesh(idx === 0 ? 'woman' : 'villager', idx + 3);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.1, 1.55, 20),
      new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.08;
    grp.add(npc, ring);
    grp.position.set(cs.x, cy, cs.z);
    worldGroup.add(grp);

    const lbl = createWorldLabel(cs.title);
    lbl.style.opacity = '0';
    miracleStageObjects.push({
      kind: 'cross_clue',
      mesh: grp,
      pos: new THREE.Vector3(cs.x, cy + 0.5, cs.z),
      msg: cs.msg,
      done: false,
      label: lbl
    });
  });

  const jY = getMiracleGroundHeight(0, -10, 3);
  const jGrp = new THREE.Group();
  const jesusBodyPivot = new THREE.Group();
  const jesusMesh = createLowPolyPersonMesh('jesus', 0);
  const crossMesh = createCarryableWoodenCross(1.0);
  jesusBodyPivot.add(jesusMesh, crossMesh);

  const jRing = new THREE.Mesh(
    new THREE.RingGeometry(1.4, 2.0, 24),
    new THREE.MeshBasicMaterial({ color: 0xf43f5e, side: THREE.DoubleSide })
  );
  jRing.rotation.x = -Math.PI / 2;
  jRing.position.y = 0.08;
  jGrp.add(jesusBodyPivot, jRing);
  jGrp.position.set(0, jY, -8.5);
  jGrp.rotation.y = Math.PI; // 골고다 언덕(-Z) 방향을 향해 힘겹게 걸어감
  jGrp.visible = false;
  worldGroup.add(jGrp);

  miracleActiveMiniState.jesusMesh = jGrp;
  miracleActiveMiniState.jesusPersonMesh = jesusMesh;
  miracleActiveMiniState.jesusBodyPivot = jesusBodyPivot;
  miracleActiveMiniState.jesusRing = jRing;
  miracleActiveMiniState.crossProp = crossMesh;
  miracleActiveMiniState.carryPrompted = false;
  miracleActiveMiniState.carryPromptCooldown = 0;
  miracleActiveMiniState.jesusLabel = createWorldLabel('✝️ 힘겹게 십자가를 지고 가시는 예수님 (다가가서 [내가 들기])');
  miracleActiveMiniState.jesusLabel.style.opacity = '0';

  const gY = getMiracleGroundHeight(0, -50, 3);
  const gRing = new THREE.Mesh(
    new THREE.RingGeometry(2.2, 3.1, 28),
    new THREE.MeshBasicMaterial({ color: 0xfef08a, side: THREE.DoubleSide })
  );
  gRing.rotation.x = -Math.PI / 2;
  gRing.position.set(0, gY + 0.12, -50);
  gRing.visible = false;
  worldGroup.add(gRing);
  miracleActiveMiniState.goalRing = gRing;
  miracleActiveMiniState.goalLabel = createWorldLabel('⛰️ 골고다 언덕 정상 세 십자가 앞 목적지');
  miracleActiveMiniState.goalLabel.style.opacity = '0';

  // 스테이지 3은 항상 기본 시점 카메라로 고정 진행!
  window.globalCameraViewMode = 'default';
  const camLbl3 = document.getElementById('global-camera-view-label');
  if (camLbl3) camLbl3.textContent = '기본';

  playerPos.set(0, 0, 28);
  lastGroundedY = 0;
  playerVelY = 0;
  isGrounded = true;
  playerFacing = Math.PI;
  cameraYaw = 0;
  cameraTargetYaw = 0;
  snapCameraToPlayer();

  showToast('😢 [1단계] 예루살렘 성전 앞 거리에서 사람들의 단서(2곳)를 듣고 예수님이 십자가를 지고 가시는 곳을 찾으세요!');
}

function attachCrossToPlayerBack() {
  if (!carriedBlockGroup) return;
  while (carriedBlockGroup.children.length > 0) carriedBlockGroup.remove(carriedBlockGroup.children[0]);
  // carriedBlockGroup은 heroGrp 기준 (0, 1.22, -0.36)에 위치 -> 보정하여 createCarryableWoodenCross를 등 뒤에 완벽 밀착!
  const crossGrp = createCarryableWoodenCross(0.96);
  crossGrp.userData.isCarriedCross = true;
  crossGrp.position.set(0, -1.22, 0.36);
  carriedBlockGroup.add(crossGrp);
}

// 스테이지 3에서 십자가 무게에 넘어져 방향키(조이스틱)로 다시 일어날 때까지 이동 잠금 연동
const _ep4StagesOrigMoveLock = window.isPlayerMovementLocked;
window.isPlayerMovementLocked = function () {
  const prev = (typeof _ep4StagesOrigMoveLock === 'function') ? _ep4StagesOrigMoveLock() : false;
  const stumbling = (
    miracleSubMode === 'main3_cross' &&
    miracleActiveMiniState &&
    miracleActiveMiniState.phase === 'carry' &&
    (miracleActiveMiniState.stumbleState !== 'none' || miracleActiveMiniState.stumbleTimer > 0)
  );
  return prev || stumbling;
};

function openMiracleStage3CrossFailModal() {
  const st = miracleActiveMiniState;
  if (st) st.phase = 'failed';
  isPlaying = false;
  isTimeAttackActive = false;
  if (typeof miracleDialogState !== 'undefined' && miracleDialogState.active) {
    const dlg = document.getElementById('miracle-dialog-modal');
    if (dlg) dlg.classList.add('hidden');
    miracleDialogState.active = false;
  }
  playSfx('wrong');
  const iconEl = document.getElementById('retry-modal-icon');
  const titleEl = document.getElementById('retry-modal-title');
  const descEl = document.getElementById('retry-modal-desc');
  if (iconEl) iconEl.textContent = '✝️';
  if (titleEl) titleEl.textContent = '예수님께서 혼자 십자가를 지고 올라가셨어요...';
  if (descEl) {
    descEl.innerHTML = '내가 십자가를 대신 들지 않아 스테이지 3에 실패했어요.<br/>다시 도전해서 예수님께 다가가 <b>[내가 들기]</b>를 눌러 함께 올라가요!';
  }
  const rm = document.getElementById('retry-modal');
  if (rm) {
    rm.classList.remove('hidden');
    rm.classList.add('flex');
  }
}

function acceptCarryJesusCross() {
  const st = miracleActiveMiniState;
  if (!st || st.phase !== 'find_jesus') return;
  st.phase = 'carry';
  // 이미 지나친 넘어짐 체크포인트는 건너뛰고 앞으로 남은 오르막에서만 자연스럽게 넘어지도록 조정
  if (Array.isArray(st.stumbleCheckpoints)) {
    while (st.stumbleIdx < st.stumbleCheckpoints.length && playerPos.z <= st.stumbleCheckpoints[st.stumbleIdx] + 2.5) {
      st.stumbleIdx++;
    }
  }
  if (st.crossProp) st.crossProp.visible = false;
  if (st.jesusRing) st.jesusRing.visible = false;
  if (st.jesusBodyPivot) {
    st.jesusBodyPivot.rotation.x = 0;
    st.jesusBodyPivot.position.y = 0;
  }
  if (st.jesusLabel) st.jesusLabel.innerHTML = '✨ 함께 걸으시는 예수님';
  if (st.goalRing) st.goalRing.visible = true;
  attachCrossToPlayerBack();
  startStageBgm(3);
  playSfx('build');
  if (currentMode === 'timeattack') timeRemaining += 10.0;
  updateStageHUD();
  showToast('✝️ [2단계] 내가 무거운 십자가를 대신 짊어졌어요! 예수님 걸음처럼 천천히, 넘어져도 다시 일어나 끝까지 올라가요!');
}

function updateMiracleMainStage3Frame(dt, now) {
  if (typeof updateMiracleDynamicSun === 'function') {
    updateMiracleDynamicSun(dt, now);
  }
  const st = miracleActiveMiniState;
  if (!st || st.phase === 'failed') return;
  let nextGuidePos = null;

  if (st.carryPromptCooldown > 0) st.carryPromptCooldown -= dt;

  // 넘어질 때 튀어 오른 먼지 파티클 업데이트
  if (Array.isArray(st.stumbleDusts) && st.stumbleDusts.length > 0) {
    for (let i = st.stumbleDusts.length - 1; i >= 0; i--) {
      const d = st.stumbleDusts[i];
      d.life -= dt;
      d.vy -= 6.5 * dt;
      d.mesh.position.x += d.vx * dt;
      d.mesh.position.y += d.vy * dt;
      d.mesh.position.z += d.vz * dt;
      const sc = Math.max(0.01, d.life / d.maxLife);
      d.mesh.scale.set(sc, sc, sc);
      if (d.life <= 0) {
        worldGroup.remove(d.mesh);
        st.stumbleDusts.splice(i, 1);
      }
    }
  }

  if (st.phase === 'find_jesus') {
    miracleStageObjects.forEach(obj => {
      if (obj.kind !== 'cross_clue' || obj.done) return;
      const d = Math.hypot(playerPos.x - obj.pos.x, playerPos.z - obj.pos.z);
      updateWorldLabelPos(obj.label, obj.pos, d < MIRACLE_STAGE_TAG_DIST);
      if (!nextGuidePos) nextGuidePos = obj.pos;

      if (d < 2.5) {
        obj.done = true;
        obj.label.style.opacity = '0';
        st.cluesFound++;
        playSfx('switch');
        if (currentMode === 'timeattack') timeRemaining += 6.0;

        if (st.cluesFound >= st.reqClues) {
          if (st.jesusMesh) st.jesusMesh.visible = true;
          updateStageHUD();
          showToast('✝️ 앞쪽에서 예수님이 십자가를 지고 골고다로 올라가고 계세요! 정상에 닿기 전에 [내가 들기]를 눌러 도와드리세요!');
        } else {
          updateStageHUD();
          showToast(obj.msg);
        }
      }
    });

    if (st.cluesFound >= st.reqClues && st.jesusMesh) {
      // [요청 반영] 내가 들기를 하지 않으면 예수님이 십자가를 지고 골고다 정상까지 계속 올라가며, 도착 시 스테이지 3 실패!
      const jPos = st.jesusMesh.position;
      const dialogOpen = (typeof miracleDialogState !== 'undefined' && miracleDialogState.active);
      if (!dialogOpen) {
        jPos.z -= dt * MIRACLE_STAGE3_CROSS_WALK_SPEED;
        jPos.y = getMiracleGroundHeight(jPos.x, jPos.z, 3);
      }
      const stepPhase = now * 0.0048;
      if (st.jesusBodyPivot) {
        st.jesusBodyPivot.rotation.x = 0.16 + Math.abs(Math.sin(stepPhase)) * 0.05;
        st.jesusBodyPivot.position.y = Math.abs(Math.sin(stepPhase)) * 0.06;
      }
      if (st.jesusPersonMesh && st.jesusPersonMesh.userData) {
        const ju = st.jesusPersonMesh.userData;
        const swing = dialogOpen ? 0 : Math.sin(stepPhase) * 0.42;
        if (ju.lLeg && ju.rLeg) { ju.lLeg.rotation.x = swing; ju.rLeg.rotation.x = -swing; }
        if (ju.lArm && ju.rArm) {
          ju.lArm.rotation.x = 2.42 + Math.sin(stepPhase * 2) * 0.05;
          ju.rArm.rotation.x = 2.42 - Math.sin(stepPhase * 2) * 0.05;
          ju.lArm.rotation.z =  0.22;
          ju.rArm.rotation.z = -0.22;
        }
      }

      // 내가 들기를 하지 않아 예수님이 먼저 골고다 십자가 정상에 도착하면 실패 판정 + 재시도 모달!
      if (jPos.z <= -49.2) {
        if (st.jesusLabel) st.jesusLabel.style.opacity = '0';
        openMiracleStage3CrossFailModal();
        return;
      }

      nextGuidePos = st.jesusMesh.position;
      const jd = Math.hypot(playerPos.x - jPos.x, playerPos.z - jPos.z);
      updateWorldLabelPos(st.jesusLabel, jPos, jd < MIRACLE_STAGE_TAG_DIST);

      if (jd < 3.1 && !dialogOpen && st.carryPromptCooldown <= 0) {
        st.carryPromptCooldown = 3.5;
        if (typeof openMiracleDialog === 'function') {
          openMiracleDialog({
            speaker: '십자가를 지신 예수님',
            category: 'story',
            text: '"예수님께서 무거운 십자가를 등에 지고 힘겹게 골고다 언덕으로 걸어가고 계세요! 구레네 시몬처럼 예수님 대신 내가 십자가를 들고 갈까요?"',
            showCancel: true,
            cancelText: '잠시 뒤에 들기',
            btnText: '✝️ 내가 들기 (십자가 대신 지기)',
            onConfirm: () => { acceptCarryJesusCross(); },
            onCancel: () => {
              st.carryPromptCooldown = 3.2;
              showToast('⚠️ 어서 도와드리지 않으면 예수님께서 혼자 정상까지 올라가시게 돼요!');
            }
          });
        } else {
          acceptCarryJesusCross();
        }
      }
    }
  } else if (st.phase === 'carry') {
    nextGuidePos = st.goalPos;

    // [요청 반영] 골고다 오르막 도중 무거운 십자가에 넘어졌을 때:
    // - 방향키/조이스틱을 조작하지 않으면 무릎을 꿇은 채 가만히 엎드려 있고,
    // - 방향키(WASD/화살표) 또는 조이스틱을 조작하면 힘내서 다시 일어남!
    if (
      st.stumbleState === 'none' &&
      Array.isArray(st.stumbleCheckpoints) &&
      st.stumbleIdx < st.stumbleCheckpoints.length &&
      playerPos.z <= st.stumbleCheckpoints[st.stumbleIdx]
    ) {
      st.stumbleIdx++;
      st.stumbleState = 'falling';
      st.stumbleFallAmt = 0;
      st.stumbleHoldTime = 0;
      st.standUpEffort = 0;
      st.stumbleTimer = 1;
      playSfx('crumble');
      showToast('😣 무거운 십자가에 넘어졌어요! 방향키(조이스틱)를 움직여 다시 일어나세요!');
      for (let k = 0; k < 7; k++) {
        const ang = (k / 7) * Math.PI * 2;
        const dust = createLowPolyMesh(new THREE.DodecahedronGeometry(0.16, 0), '#d6c19c', playerPos.x + Math.cos(ang) * 0.4, playerPos.y + 0.18, playerPos.z + Math.sin(ang) * 0.4, false);
        worldGroup.add(dust);
        st.stumbleDusts.push({
          mesh: dust,
          vx: Math.cos(ang) * (1.5 + Math.random()),
          vy: 1.8 + Math.random() * 1.2,
          vz: Math.sin(ang) * (1.5 + Math.random()),
          life: 0.75,
          maxLife: 0.75
        });
      }
    }

    if (st.stumbleState !== 'none') {
      let fallAmt = 1.0;

      if (st.stumbleState === 'falling') {
        st.stumbleFallAmt = Math.min(1.0, (st.stumbleFallAmt || 0) + dt / 0.44);
        fallAmt = st.stumbleFallAmt;
        if (st.stumbleFallAmt >= 1.0) {
          st.stumbleState = 'down';
          st.stumbleHoldTime = 0;
        }
      } else if (st.stumbleState === 'down') {
        st.stumbleHoldTime = (st.stumbleHoldTime || 0) + dt;
        const hasDirInput = Boolean(
          (window.lastRawMoveInput && window.lastRawMoveInput.mag > 0.20) ||
          (typeof keys !== 'undefined' && keys && (
            keys['ArrowUp'] || keys['ArrowDown'] || keys['ArrowLeft'] || keys['ArrowRight'] ||
            keys['KeyW'] || keys['KeyS'] || keys['KeyA'] || keys['KeyD']
          )) ||
          (typeof joyMove !== 'undefined' && joyMove && Math.hypot(joyMove.x || 0, joyMove.y || 0) > 0.20)
        );

        // 넘어진 직후 0.25초 착지 후부터 방향키 입력 시 부드럽게 일어남; 키 입력이 없으면 가만히 넘어진 채 유지!
        if (hasDirInput && st.stumbleHoldTime >= 0.25) {
          st.standUpEffort = Math.min(1.0, (st.standUpEffort || 0) + dt * 1.55);
        } else if (!hasDirInput) {
          st.standUpEffort = Math.max(0, (st.standUpEffort || 0) - dt * 0.65);
        }

        fallAmt = Math.max(0, 1.0 - (st.standUpEffort || 0)) + (hasDirInput ? 0 : Math.sin(st.stumbleHoldTime * 2.8) * 0.018);

        if ((st.standUpEffort || 0) >= 1.0) {
          st.stumbleState = 'none';
          st.stumbleFallAmt = 0;
          st.standUpEffort = 0;
          st.stumbleHoldTime = 0;
          st.stumbleTimer = 0;
          fallAmt = 0;
          playSfx('step');
          showToast('💪 힘내서 다시 일어났어요! 끝까지 골고다 정상으로 올라가요!');
        }
      }

      if (st.stumbleState !== 'none') {
        if (playerGroup) {
          playerGroup.rotation.x = fallAmt * 0.74;
          playerGroup.scale.set(1, 1.0 - fallAmt * 0.28, 1);
        }
        if (playerLimbs && playerLimbs.lLeg && playerLimbs.rLeg) {
          playerLimbs.lLeg.rotation.x = fallAmt * 1.1;
          playerLimbs.rLeg.rotation.x = -fallAmt * 0.65;
        }
        if (playerLimbs && playerLimbs.lArm && playerLimbs.rArm) {
          playerLimbs.lArm.rotation.x = THREE.MathUtils.lerp(2.40, -1.15, Math.min(1, fallAmt));
          playerLimbs.rArm.rotation.x = THREE.MathUtils.lerp(2.40, -1.15, Math.min(1, fallAmt));
          playerLimbs.lArm.rotation.z = 0.28 * (1 - Math.min(1, fallAmt));
          playerLimbs.rArm.rotation.z = -0.28 * (1 - Math.min(1, fallAmt));
        }
        // 넘어져 있는 동안 예수님이 옆에서 부축하며 손을 내미는 모션
        if (st.jesusPersonMesh && st.jesusPersonMesh.userData && st.jesusPersonMesh.userData.lArm) {
          st.jesusPersonMesh.userData.lArm.rotation.x = -1.1;
        }
      } else if (playerGroup) {
        playerGroup.rotation.x = 0.14;
        playerGroup.scale.set(1, 1, 1);
      }
    } else {
      if (playerGroup) {
        playerGroup.rotation.x = 0.14; // 십자가 무게로 상체가 살짝 숙여진 채 걸어감
        playerGroup.scale.set(1, 1, 1);
      }
      if (playerLimbs && playerLimbs.lArm && playerLimbs.rArm) {
        playerLimbs.lArm.rotation.x = 2.40;
        playerLimbs.rArm.rotation.x = 2.40;
        playerLimbs.lArm.rotation.z =  0.22;
        playerLimbs.rArm.rotation.z = -0.22;
      }
    }

    if (st.jesusMesh) {
      const targetJX = playerPos.x + 1.5;
      const targetJZ = playerPos.z - 0.6;
      const prevX = st.jesusMesh.position.x;
      const prevZ = st.jesusMesh.position.z;
      st.jesusMesh.position.x = THREE.MathUtils.lerp(st.jesusMesh.position.x, targetJX, dt * 4.5);
      st.jesusMesh.position.z = THREE.MathUtils.lerp(st.jesusMesh.position.z, targetJZ, dt * 4.5);
      st.jesusMesh.position.y = getMiracleGroundHeight(st.jesusMesh.position.x, st.jesusMesh.position.z, 3);
      st.jesusMesh.rotation.y = playerFacing;

      // 옆에서 함께 걸어가는 예수님 보행 애니메이션
      const moved = Math.hypot(st.jesusMesh.position.x - prevX, st.jesusMesh.position.z - prevZ);
      if (st.jesusPersonMesh && st.jesusPersonMesh.userData && st.stumbleState === 'none') {
        const ju = st.jesusPersonMesh.userData;
        const jSwing = moved > 0.005 ? Math.sin(now * 0.011) * 0.48 : 0;
        if (ju.lLeg && ju.rLeg) { ju.lLeg.rotation.x = jSwing; ju.rLeg.rotation.x = -jSwing; }
        if (ju.lArm && ju.rArm) {
          ju.lArm.rotation.x = -jSwing * 0.5; ju.rArm.rotation.x = jSwing * 0.5;
          ju.lArm.rotation.z = 0; ju.rArm.rotation.z = 0;
        }
      }
      updateWorldLabelPos(st.jesusLabel, st.jesusMesh.position, true);
    }

    const gd = Math.hypot(playerPos.x - st.goalPos.x, playerPos.z - st.goalPos.z);
    if (st.goalLabel) updateWorldLabelPos(st.goalLabel, st.goalPos, gd < 14.0);

    if (gd < 3.6) {
      st.phase = 'golgotha_arrived';
      st.stumbleState = 'none';
      st.stumbleTimer = 0;
      if (playerGroup) {
        playerGroup.rotation.x = 0;
        playerGroup.scale.set(1, 1, 1);
      }
      if (playerLimbs && playerLimbs.lArm && playerLimbs.rArm) {
        playerLimbs.lArm.rotation.z = 0;
        playerLimbs.rArm.rotation.z = 0;
      }
      if (carriedBlockGroup) {
        while (carriedBlockGroup.children.length > 0) carriedBlockGroup.remove(carriedBlockGroup.children[0]);
      }
      if (st.goalLabel) st.goalLabel.style.opacity = '0';
      if (st.jesusLabel) st.jesusLabel.style.opacity = '0';
      miracleMainStagesCleared[3] = true;
      saveMiracleNotebookProgress();
      openStageClearModal(3);
      return;
    }
  }

  if (nextGuidePos && guideArrowGroup && guideArrowGroup.visible) {
    const baseFacing = (window.globalCameraViewMode === 'fps') ? (cameraYaw + Math.PI) : playerFacing;
    guideArrowGroup.rotation.y = Math.atan2(nextGuidePos.x - playerPos.x, nextGuidePos.z - playerPos.z) - baseFacing;
  }
}
// =========================================================================
// [ep4_miracle_stages.js - 파트 2/2] 메인 스테이지 4(빈 무덤 마을 미로) · 감람산 승천/재림 엔딩 및 플러그인 등록
// - 스테이지 4 서쪽 원경에 넓어진 골고다 언덕과 세 십자가 연동
// - 외곽 닫힌 다면체 언덕 내부 진입 차단 및 스테이지 종료 후 오픈월드 안전 복귀 연동
// =========================================================================

// -------------------------------------------------------------------------
// 5. [메인 스테이지 4] 빈 무덤 찾기 (오픈월드 남부 예루살렘 마을 ~ 동산 무덤 지형 연동)
// -------------------------------------------------------------------------
function buildMiracleMainStage4Tomb() {
  clearWorld();
  resetMiracleBoatRockingTransform();
  miracleSubMode = 'main4_tomb';
  miracleStageObjects = [];

  if (typeof setupMiracleDynamicSunAndShadows === 'function') {
    setupMiracleDynamicSunAndShadows();
  }

  scene.background = new THREE.Color(0x64748b);
  scene.fog = new THREE.Fog(0x94a3b8, 48, 185);

  const isKinder = (currentMode === 'kinder');
  const reqClues = isKinder ? 2 : 3;

  miracleActiveMiniState = {
    phase: 'maze_clues', // 'maze_clues' | 'go_tomb' | 'angel_met'
    cluesFound: 0,
    reqClues,
    gateBlockerMesh: null,
    gateCollider: null,
    angelMesh: null,
    tombPos: new THREE.Vector3(0, 0.5, -38),
    tombLabel: null,
    houseRects: [],
    romanSoldiers: [],
    romanHintNpc: null,
    spottedCooldown: 0,
    spottedCount: 0
  };

  const halfW = 28, halfD = 48;
  currentMapRectBounds = { minX: -halfW + 1.5, maxX: halfW - 1.5, minZ: -halfD + 2.0, maxZ: halfD - 2.0 };

  // 1) 예루살렘 마을 바닥·북쪽 동산 정원·서쪽 골고다 언덕 (오픈월드와 동일한 크리스프 비인덱스 로우폴리 지형)
  const s4HeightFn = (vx, vz) => {
    const golDist = Math.hypot((vx - (-50)) / 28, (vz - (-10)) / 28);
    if (golDist < 1.0 && Math.abs(vx) > halfW + 1.0) {
      const clampedD = Math.max(0, (golDist - 0.25) / 0.75);
      const gt = 1.0 - Math.min(1.0, clampedD);
      return gt * gt * (3 - 2 * gt) * 9.0;
    }
    return 0;
  };
  const cS4Village  = new THREE.Color('#dfb984');
  const cS4Ochre    = new THREE.Color('#d8b674');
  const cS4Garden   = new THREE.Color('#8ea854');
  const cS4Meadow   = new THREE.Color('#b6b968');
  const cS4Golgotha = new THREE.Color('#9e907c');
  const terrainMesh = (typeof createCrispLowPolyFacetedTerrain === 'function')
    ? createCrispLowPolyFacetedTerrain(150, 140, 44, 42, s4HeightFn, (mx, my, mz, slopeFlat, hash2, outCol) => {
        const golDist = Math.hypot((mx - (-50)) / 28, (mz - (-10)) / 28);
        if (golDist < 0.95 && mx < -30) {
          outCol.copy(cS4Golgotha);
        } else if (mz < -22) {
          const patch = hash2(Math.floor(mx * 0.16), Math.floor(mz * 0.16));
          outCol.copy(cS4Garden).lerp(cS4Meadow, 0.2 + patch * 0.45);
        } else {
          const patch = hash2(Math.floor(mx * 0.15), Math.floor(mz * 0.15));
          outCol.copy(cS4Village).lerp(cS4Ochre, patch * 0.55);
        }
      }, 0.65)
    : new THREE.Mesh(new THREE.PlaneGeometry(150, 140, 44, 40), new THREE.MeshLambertMaterial({ color: '#dfc49a', flatShading: true }));
  worldGroup.add(terrainMesh);

  // 마을 입구~동산 성문까지 비정형 큰벽돌 바닥 + 동산 가장자리 언덕 돌담
  if (typeof buildStageIrregularStonePavement === 'function') {
    buildStageIrregularStonePavement(
      [{ minX: -14, maxX: 14, minZ: -22, maxZ: 42, stepX: 2.35, stepZ: 2.05 }],
      s4HeightFn,
      960
    );
  }
  if (typeof buildStageDryStoneTerraceWalls === 'function') {
    buildStageDryStoneTerraceWalls(
      [
        { pts: [[-24, -28], [-18, -38], [-10, -44]], courses: 3 },
        { pts: [[ 24, -28], [ 18, -38], [ 10, -44]], courses: 3 }
      ],
      s4HeightFn,
      820
    );
  }

  // 서쪽 골고다 언덕 정상 고원 위의 비정형 세 십자가 원경 배치
  [[-50, -10, 1.32, 0.0], [-55, -8.5, 1.00, 0.2], [-45, -8.5, 1.00, -0.2]].forEach(([cx, cz, sc, ry], ci) => {
    const cy = 8.6;
    if (typeof createOrganicLowPolyCrossMesh === 'function') {
      const cMesh = createOrganicLowPolyCrossMesh(sc, { seed: 470 + ci * 23, withBase: true, withPlaque: ci === 0 });
      cMesh.position.set(cx, cy - 0.12 * sc, cz);
      cMesh.rotation.y = ry;
      worldGroup.add(cMesh);
    } else {
      const vBeam = createLowPolyMesh(new THREE.CylinderGeometry(0.18 * sc, 0.22 * sc, 5.0 * sc, 6), '#5c2d0c', cx, cy + 2.5 * sc, cz);
      const hBeam = createLowPolyMesh(new THREE.CylinderGeometry(0.15 * sc, 0.15 * sc, 3.0 * sc, 6), '#5c2d0c', cx, cy + 3.6 * sc, cz);
      hBeam.rotation.z = Math.PI / 2;
      worldGroup.add(vBeam, hBeam);
    }
  });

  // 주변 가장자리 닫힌 다면체 언덕 배치 (충돌 판정 활성화)
  if (typeof createBumpyLowPolyHillMesh === 'function') {
    createBumpyLowPolyHillMesh( 45, -25, 18, 7.0, 18, '#7ca344', 12, true);
    createBumpyLowPolyHillMesh( 46,  18, 18, 6.5, 18, '#84a955', 15, true);
    createBumpyLowPolyHillMesh(-22, -62, 22, 7.5, 16, '#7ca344', 18, true);
    createBumpyLowPolyHillMesh( 22, -62, 22, 7.5, 16, '#84a955', 21, true);
  }

  // [스테이지 4 리디자인] 오픈월드 스타일의 촘촘한 유대 마을 가옥 + 구불구불한 골목길 + 로마 병사 은신처 구성!
  // 외곽 좌·우 8채 + 골목길 내부 6채 = 총 14채로 자연스러운 시야 차단 골목길 형성
  const stage4Houses = [
    // 외곽 서/동 골목 경계 가옥 (8채)
    [-21.5,  26.0, 0,  Math.PI / 2, 0.84, 'stonebrick'],
    [-21.5,  13.0, 1,  Math.PI / 2, 0.84, 'plaster'],
    [-21.5,   0.0, 2,  Math.PI / 2, 0.84, 'stonebrick'],
    [-21.5, -13.0, 3,  Math.PI / 2, 0.84, 'plaster'],
    [ 21.5,  26.0, 1, -Math.PI / 2, 0.84, 'plaster'],
    [ 21.5,  13.0, 2, -Math.PI / 2, 0.84, 'stonebrick'],
    [ 21.5,   0.0, 3, -Math.PI / 2, 0.84, 'plaster'],
    [ 21.5, -13.0, 0, -Math.PI / 2, 0.84, 'stonebrick'],
    // 골목길을 촘촘히 구획하는 내부 마을 가옥 (6채 — 로마 병사 시야를 막아주는 은신처!)
    [ -9.5,  24.0, 1,  0.0,         0.78, 'stonebrick'],
    [  9.5,  24.0, 0,  Math.PI,     0.78, 'plaster'],
    [  0.0,  12.0, 2,  Math.PI / 2, 0.80, 'stonebrick'],
    [-10.0,   0.0, 4,  0.0,         0.78, 'plaster'],
    [ 10.0,   0.0, 1,  Math.PI,     0.78, 'stonebrick'],
    [  0.0, -12.0, 3, -Math.PI / 2, 0.80, 'plaster']
  ];
  stage4Houses.forEach(([hx, hz, v, yaw, sc, masonry]) => {
    const beforeCnt = Array.isArray(window.miracleBuildingBounds) ? window.miracleBuildingBounds.length : 0;
    addJudeanRoadsideBuilding(hx, hz, v, yaw, sc, false, masonry);
    // 로마 병사 시야선(Line-of-Sight) 차단 판정용 사각형 등록
    if (Array.isArray(window.miracleBuildingBounds) && window.miracleBuildingBounds.length > beforeCnt) {
      const b = window.miracleBuildingBounds[window.miracleBuildingBounds.length - 1];
      miracleActiveMiniState.houseRects.push({ minX: b.minX, maxX: b.maxX, minZ: b.minZ, maxZ: b.maxZ });
    } else {
      const hw = 3.2 * sc, hd = 2.8 * sc;
      miracleActiveMiniState.houseRects.push({ minX: hx - hw, maxX: hx + hw, minZ: hz - hd, maxZ: hz + hd });
    }
  });

  // 동산 입구 북쪽 성벽(좌·우) & 단서 수집 전까지 동산 입구를 막고 있는 나무 성문
  const addNorthGardenWall = (x, z, w, d, sd) => {
    const wGeo = (typeof createOrganicBoxGeo === 'function')
      ? createOrganicBoxGeo(w, 3.8, d, sd, 0.03, 0.96, 2)
      : new THREE.BoxGeometry(w, 3.8, d);
    const wMesh = createLowPolyMesh(wGeo, '#ead7b7', x, 1.9, z);
    const topCap = createLowPolyMesh(new THREE.BoxGeometry(w + 0.24, 0.36, d + 0.24), '#c89654', x, 3.98, z, false);
    worldGroup.add(wMesh, topCap);
    wallMeshes.push(wMesh, topCap);
    colliders.push({ minX: x - w * 0.5 - 0.35, maxX: x + w * 0.5 + 0.35, minZ: z - d * 0.5 - 0.35, maxZ: z + d * 0.5 + 0.35 });
    miracleActiveMiniState.houseRects.push({ minX: x - w * 0.5, maxX: x + w * 0.5, minZ: z - d * 0.5, maxZ: z + d * 0.5 });
  };
  addNorthGardenWall(-16.5, -24, 23, 1.8, 17);
  addNorthGardenWall( 16.5, -24, 23, 1.8, 19);

  const gateBlocker = createLowPolyMesh(new THREE.BoxGeometry(10.2, 3.8, 1.1), '#78350f', 0, 1.9, -24);
  worldGroup.add(gateBlocker);
  wallMeshes.push(gateBlocker);
  const gateCol = { minX: -5.2, maxX: 5.2, minZ: -25.0, maxZ: -23.0 };
  colliders.push(gateCol);
  miracleActiveMiniState.gateBlockerMesh = gateBlocker;
  miracleActiveMiniState.gateCollider = gateCol;

  // [출발 전 힌트 NPC] 출발 광장 길가(2.8, 35.0)에서 로마 군인을 만나면 안 된다고 미리 알려주는 예루살렘 이웃!
  const hintGrp = new THREE.Group();
  const hintNpcMesh = createLowPolyPersonMesh('villager', 17);
  hintNpcMesh.rotation.y = -0.35;
  const hintRing = new THREE.Mesh(
    new THREE.RingGeometry(0.95, 1.38, 20),
    new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide })
  );
  hintRing.rotation.x = -Math.PI / 2;
  hintRing.position.y = 0.08;
  hintGrp.add(hintNpcMesh, hintRing);
  hintGrp.position.set(2.8, 0, 35.0);
  worldGroup.add(hintGrp);
  const hintLbl = createWorldLabel('💬 예루살렘 이웃 (출발 전 꼭 들어요! 로마 병사 주의)');
  hintLbl.style.opacity = '1';
  miracleActiveMiniState.romanHintNpc = {
    kind: 'roman_hint_npc',
    mesh: hintGrp,
    npcMesh: hintNpcMesh,
    pos: new THREE.Vector3(2.8, 0.5, 35.0),
    label: hintLbl,
    warned: false,
    lastWarnAt: 0,
    hintText: '🤫 "조심하세요! 로마 군인들이 골목길을 순찰하고 있어요! 로마 군인을 만나면 안 돼요 — 노란 시야 불빛에 들키지 않도록 집 사이 골목 뒤로 숨어 빈 무덤으로 가세요!"'
  };

  // [순찰 로마 병사 배치] 골목길 교차로를 순찰하며 전방 시야 콘(Vision Cone)으로 감시! (집 뒤에 숨으면 시야 차단)
  const sightRange = isKinder ? 7.2 : 8.8;
  const sightHalfAngle = isKinder ? 0.48 : 0.56; // 약 27.5° ~ 32°
  const patrolRoutes = [
    { ax: -14.5, az:  18.0, bx:  14.5, bz:  18.0, spd: isKinder ? 2.5 : 3.2, startT: 0.20 },
    { ax:  14.5, az:   6.0, bx: -14.5, bz:   6.0, spd: isKinder ? 2.6 : 3.4, startT: 0.55 },
    { ax: -14.5, az:  -6.0, bx:  14.5, bz:  -6.0, spd: isKinder ? 2.5 : 3.3, startT: 0.78 }
  ];
  if (!isKinder) {
    patrolRoutes.push({ ax: 12.5, az: -18.0, bx: -12.5, bz: -18.0, spd: 3.4, startT: 0.35 });
  }
  const buildVisionConeGeo = (rad, halfAng, segs = 10) => {
    const verts = [];
    for (let s = 0; s < segs; s++) {
      const a0 = -halfAng + (s / segs) * (halfAng * 2);
      const a1 = -halfAng + ((s + 1) / segs) * (halfAng * 2);
      verts.push(0, 0, 0, Math.sin(a0) * rad, 0, Math.cos(a0) * rad, Math.sin(a1) * rad, 0, Math.cos(a1) * rad);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    return g;
  };
  patrolRoutes.forEach((pr, idx) => {
    const sGrp = new THREE.Group();
    const sMesh = (typeof window.createRomanSoldierMesh === 'function')
      ? window.createRomanSoldierMesh(idx)
      : createLowPolyPersonMesh('villager', 40 + idx);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.30,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const visionCone = new THREE.Mesh(buildVisionConeGeo(sightRange, sightHalfAngle, 10), coneMat);
    visionCone.position.y = 0.10;
    sGrp.add(sMesh, visionCone);

    const sx = pr.ax + (pr.bx - pr.ax) * pr.startT;
    const sz = pr.az + (pr.bz - pr.az) * pr.startT;
    sGrp.position.set(sx, 0, sz);
    const initAng = Math.atan2(pr.bx - pr.ax, pr.bz - pr.az);
    sGrp.rotation.y = initAng;
    worldGroup.add(sGrp);

    const sLbl = createWorldLabel('🛡️ 로마 병사 (시야 주의!)');
    sLbl.style.opacity = '0';
    miracleActiveMiniState.romanSoldiers.push({
      mesh: sGrp,
      bodyMesh: sMesh,
      visionCone,
      coneMat,
      label: sLbl,
      ax: pr.ax, az: pr.az,
      bx: pr.bx, bz: pr.bz,
      goingToB: true,
      speed: pr.spd,
      heading: initAng,
      sightRange,
      sightHalfAngle,
      pauseTimer: 0,
      phase: idx * 1.4
    });
  });

  // 2) 골목길 은신처 구석구석에서 무덤의 단서를 알려주는 NPC 3명 (무릎 높이 불규칙 빛의 원 적용)
  const clueNpcSpots = [
    { x: -15.5, z: 27.5, preset: 'woman',    title: '🏺 향품을 준비한 살로메',   msg: '"로마 병사 눈을 피해 잘 오셨어요! 새 돌무덤은 북쪽 성문 너머 감람나무 동산에 있어요!"' },
    { x:  15.5, z:  8.5, preset: 'woman',    title: '🌿 새벽에 길을 나선 요안나', msg: '"무덤 입구를 막았던 커다란 돌이 이미 굴러가 버렸대요! 집 뒤 골목으로 북쪽 동산에 가세요!"' },
    { x: -15.5, z: -6.5, preset: 'disciple', title: '🏃 달려가는 요한과 베드로',  msg: '"동산 문이 열렸어요! 무덤 안에 세마포만 놓여 있고 빛나는 천사가 앉아 있어요!"' }
  ];
  for (let i = 0; i < reqClues; i++) {
    const cs = clueNpcSpots[i];
    const grp = new THREE.Group();
    const npc = createLowPolyPersonMesh(cs.preset, i + 4);
    const aura = (typeof createIrregularKneeLightAura === 'function')
      ? createIrregularKneeLightAura(0x38bdf8, i + 10)
      : new THREE.Mesh(new THREE.RingGeometry(1.1, 1.6, 20), new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide }));
    if (!aura.userData || !aura.userData.outerCrown) {
      aura.rotation.x = -Math.PI / 2;
      aura.position.y = 0.08;
    }
    grp.add(npc, aura);
    grp.position.set(cs.x, 0, cs.z);
    worldGroup.add(grp);

    const lbl = createWorldLabel(`${cs.title} (단서 ${i + 1}/${reqClues})`);
    lbl.style.opacity = '0';
    miracleStageObjects.push({
      kind: 'tomb_clue',
      mesh: grp,
      npcMesh: npc,
      kneeAura: aura,
      baseX: cs.x,
      baseZ: cs.z,
      pos: new THREE.Vector3(cs.x, 0.5, cs.z),
      msg: cs.msg,
      done: false,
      phase: i * 1.1,
      label: lbl
    });
  }

  // 3) 북쪽 끝 동산(z = -42)의 디테일 비정형 소프트 로우폴리 열린 무덤과 굴러간 비정형 돌문, 빛나는 천사
  let tombGroup;
  if (typeof createDetailedOrganicTombGroup === 'function') {
    tombGroup = createDetailedOrganicTombGroup({ scale: 1.15, openGlow: true, seed: 860 });
    tombGroup.position.set(0, -0.05, -42.2);
    worldGroup.add(tombGroup);
    if (Array.isArray(tombGroup.userData.wallRocks)) {
      wallMeshes.push(...tombGroup.userData.wallRocks);
    }
  } else {
    tombGroup = new THREE.Group();
    const tombBackRock = createLowPolyMesh(new THREE.DodecahedronGeometry(5.6, 0), '#8f9bb0', 0, 2.8, -49.2);
    tombGroup.add(tombBackRock);
    worldGroup.add(tombGroup);
    wallMeshes.push(tombBackRock);
  }
  miracleActiveMiniState.tombMeshGroup = tombGroup;
  colliders.push({ minX: -9.5, maxX: 9.5, minZ: -52.0, maxZ: -41.4 });

  const angelMesh = createLowPolyPersonMesh('angel', 0);
  angelMesh.position.set(-1.6, 0.1, -39.2);
  worldGroup.add(angelMesh);

  const tombRing = new THREE.Mesh(
    new THREE.RingGeometry(1.8, 2.5, 24),
    new THREE.MeshBasicMaterial({ color: 0xfef08a, side: THREE.DoubleSide })
  );
  tombRing.rotation.x = -Math.PI / 2;
  tombRing.position.set(0, 0.15, -38.0);
  worldGroup.add(tombRing);

  miracleActiveMiniState.angelMesh = angelMesh;
  miracleActiveMiniState.tombPos.set(0, 0.5, -38.0);
  miracleActiveMiniState.tombLabel = createWorldLabel('🔒 동산의 빈 무덤 (단서를 모두 모으면 열려요!)');
  miracleActiveMiniState.tombLabel.style.opacity = '0';

  if (typeof addLowPolyCanopyTree === 'function') {
    addLowPolyCanopyTree(-18, -36, 1.2, true);
    addLowPolyCanopyTree( 18, -36, 1.2, true);
  }
  [[-14, -30], [14, -30], [-12, -42], [12, -42]].forEach(([tx, tz], i) => {
    if (i % 2 === 0) addLowPolyOliveTree(tx, tz, 1.2, true);
    else addLowPolyCypressPineTree(tx, tz, 1.2, true);
  });

  if (typeof addLowPolyWildflowerCluster === 'function') {
    [[-8, -32], [8, -32], [-6, -38], [6, -38]].forEach(([fx, fz]) => {
      addLowPolyWildflowerCluster(fx, fz, 1.0);
    });
  }

  [[-18, 24, -35, 1.2], [18, 26, -32, 1.3], [0, 28, 10, 1.25]].forEach(([cx, cy, cz, sc]) => {
    const cl = createLowPolyCloudGroup(sc, false);
    cl.position.set(cx, cy, cz);
    worldGroup.add(cl);
  });

  playerPos.set(0, 0, 40);
  lastGroundedY = 0;
  playerVelY = 0;
  isGrounded = true;
  playerFacing = Math.PI;
  cameraYaw = 0;
  cameraTargetYaw = 0;
  snapCameraToPlayer();

  showToast(`🌅 [1단계] 로마 병사의 눈을 피해 촘촘한 마을 골목길에서 단서 ${reqClues}개를 모아 빈 무덤으로 나아가세요!`);
}

function isStage4SightBlockedByHouses(x1, z1, x2, z2, houseRects) {
  if (!Array.isArray(houseRects) || houseRects.length === 0) return false;
  const steps = 8;
  for (let s = 1; s < steps; s++) {
    const t = s / steps;
    const px = x1 + (x2 - x1) * t;
    const pz = z1 + (z2 - z1) * t;
    for (let i = 0; i < houseRects.length; i++) {
      const r = houseRects[i];
      if (px >= r.minX && px <= r.maxX && pz >= r.minZ && pz <= r.maxZ) return true;
    }
  }
  return false;
}
window.isStage4SightBlockedByHouses = isStage4SightBlockedByHouses;

function updateMiracleMainStage4Frame(dt, now) {
  if (typeof updateMiracleDynamicSun === 'function') {
    updateMiracleDynamicSun(dt, now);
  }
  const st = miracleActiveMiniState;
  let nextGuidePos = null;

  // 0) 출발 전 힌트 NPC (로마 군인을 만나면 안 된다는 사전 안내!)
  if (st.romanHintNpc && st.phase !== 'angel_met') {
    const hn = st.romanHintNpc;
    const hd = Math.hypot(playerPos.x - hn.pos.x, playerPos.z - hn.pos.z);
    updateWorldLabelPos(hn.label, hn.pos, hd < 13.0);
    if (hn.npcMesh && hn.npcMesh.userData) {
      const angToP = Math.atan2(playerPos.x - hn.pos.x, playerPos.z - hn.pos.z);
      hn.npcMesh.rotation.y = lerpAngle(hn.npcMesh.rotation.y, angToP, dt * 5.0);
      if (hn.npcMesh.userData.rArm) {
        hn.npcMesh.userData.rArm.rotation.x = -1.1 + Math.sin(now * 0.008) * 0.35;
      }
    }
    if (hd < 4.6 && (!hn.warned || now - hn.lastWarnAt > 8500)) {
      hn.warned = true;
      hn.lastWarnAt = now;
      if (hn.label) hn.label.innerHTML = '🤫 로마 병사의 노란 시야를 피해 집 뒤로 숨어 이동하세요!';
      playSfx('switch');
      showToast(hn.hintText);
    }
  }

  // 1) 순찰 로마 병사 이동 & 전방 시야 콘 감지 (집 뒤에 숨으면 시야 완벽 차단!)
  if (st.spottedCooldown > 0) st.spottedCooldown -= dt;
  if (Array.isArray(st.romanSoldiers) && st.phase !== 'angel_met') {
    st.romanSoldiers.forEach((sol) => {
      const tx = sol.goingToB ? sol.bx : sol.ax;
      const tz = sol.goingToB ? sol.bz : sol.az;
      const dx = tx - sol.mesh.position.x;
      const dz = tz - sol.mesh.position.z;
      const dist = Math.hypot(dx, dz);

      if (sol.pauseTimer > 0) {
        sol.pauseTimer -= dt;
        const u = sol.bodyMesh && sol.bodyMesh.userData;
        if (u && u.lLeg && u.rLeg) { u.lLeg.rotation.x = 0; u.rLeg.rotation.x = 0; }
      } else if (dist < 0.45) {
        sol.goingToB = !sol.goingToB;
        sol.pauseTimer = 0.65;
      } else {
        const step = Math.min(dist, sol.speed * dt);
        sol.mesh.position.x += (dx / dist) * step;
        sol.mesh.position.z += (dz / dist) * step;
        const targetAng = Math.atan2(dx, dz);
        sol.heading = lerpAngle(sol.heading, targetAng, Math.min(1, dt * 8.0));
        sol.mesh.rotation.y = sol.heading;
        const u = sol.bodyMesh && sol.bodyMesh.userData;
        if (u && u.lLeg && u.rLeg) {
          const sw = Math.sin(now * 0.013 + sol.phase) * 0.52;
          u.lLeg.rotation.x = sw;
          u.rLeg.rotation.x = -sw;
          if (u.rArm) u.rArm.rotation.x = -0.35 - sw * 0.35;
        }
      }

      const pdx = playerPos.x - sol.mesh.position.x;
      const pdz = playerPos.z - sol.mesh.position.z;
      const pDist = Math.hypot(pdx, pdz);
      updateWorldLabelPos(sol.label, sol.mesh.position, pDist < 15.0);

      let spottedNow = false;
      if (pDist < sol.sightRange && playerPos.z < 33.5 && playerPos.z > -24.5) {
        const fwdX = Math.sin(sol.heading), fwdZ = Math.cos(sol.heading);
        const dot = (pdx * fwdX + pdz * fwdZ) / Math.max(0.001, pDist);
        const inCone = (pDist < 1.65) || (dot >= Math.cos(sol.sightHalfAngle));
        if (inCone && !isStage4SightBlockedByHouses(sol.mesh.position.x, sol.mesh.position.z, playerPos.x, playerPos.z, st.houseRects)) {
          spottedNow = true;
        }
      }

      if (sol.coneMat && sol.coneMat.color) {
        sol.coneMat.color.setHex(spottedNow ? 0xef4444 : 0xfbbf24);
        sol.coneMat.opacity = spottedNow ? 0.52 : 0.28;
      }

      if (spottedNow && st.spottedCooldown <= 0) {
        st.spottedCooldown = 2.2;
        st.spottedCount = (st.spottedCount || 0) + 1;
        playSfx('wrong');
        const df = document.getElementById('damage-flash');
        if (df) {
          df.style.opacity = '0.55';
          setTimeout(() => { df.style.opacity = '0'; }, 260);
        }
        playerPos.set(0, 0, 38.5);
        lastGroundedY = 0;
        playerVelY = 0;
        if (playerGroup) playerGroup.position.copy(playerPos);
        if (typeof snapCameraToPlayer === 'function') snapCameraToPlayer();
        showToast('🚨 로마 병사에게 들켰어요! 집 사이 골목길 뒤로 숨어서 병사의 시야를 피해 이동해 보세요!');
      }
    });
  }

  if (st.phase === 'maze_clues') {
    miracleStageObjects.forEach((obj, idx) => {
      if (obj.kind !== 'tomb_clue' || obj.done) return;

      if (obj.kneeAura && typeof updateIrregularKneeLightAura === 'function') {
        updateIrregularKneeLightAura(obj.kneeAura, now, idx);
      }

      const swayX = Math.sin(now * 0.003 + obj.phase) * 1.4;
      const prevX = obj.mesh.position.x;
      obj.mesh.position.x = obj.baseX + swayX;
      obj.pos.x = obj.mesh.position.x;

      if (obj.npcMesh && obj.npcMesh.userData) {
        const u = obj.npcMesh.userData;
        const dirSign = (obj.mesh.position.x >= prevX) ? 1 : -1;
        obj.npcMesh.rotation.y = lerpAngle(obj.npcMesh.rotation.y, dirSign * (Math.PI * 0.5), dt * 6.0);
        const w = Math.cos(now * 0.012 + obj.phase) * 0.48;
        if (u.lLeg && u.rLeg) { u.lLeg.rotation.x = w; u.rLeg.rotation.x = -w; }
        if (u.lArm && u.rArm) { u.lArm.rotation.x = -w * 0.5; u.rArm.rotation.x = w * 0.5; }
      }

      const d = Math.hypot(playerPos.x - obj.pos.x, playerPos.z - obj.pos.z);
      updateWorldLabelPos(obj.label, obj.pos, d < MIRACLE_STAGE_TAG_DIST);
      if (!nextGuidePos) nextGuidePos = obj.pos;

      if (d < 2.5) {
        obj.done = true;
        obj.label.style.opacity = '0';
        st.cluesFound++;
        playSfx('rescue');
        if (currentMode === 'timeattack') timeRemaining += 6.0;

        if (st.cluesFound >= st.reqClues) {
          st.phase = 'go_tomb';
          if (st.gateBlockerMesh) st.gateBlockerMesh.visible = false;
          if (st.gateCollider) { st.gateCollider.minX = 9999; st.gateCollider.maxX = 9999; }
          if (st.tombLabel) st.tombLabel.innerHTML = '✨ 돌문이 굴러간 빈 무덤! (천사에게 가기)';
          scene.background = new THREE.Color(0x38bdf8);
          scene.fog = new THREE.Fog(0xbae6fd, 55, 200);
          updateStageHUD();
          showToast('🌅 단서를 모두 모아 북쪽 동산 문이 열렸어요! 빛나는 천사가 있는 빈 무덤 앞으로 달려가세요!');
        } else {
          updateStageHUD();
          showToast(obj.msg);
        }
      }
    });
  } else if (st.phase === 'go_tomb') {
    nextGuidePos = st.tombPos;
    const td = Math.hypot(playerPos.x - st.tombPos.x, playerPos.z - st.tombPos.z);
    if (st.tombLabel) updateWorldLabelPos(st.tombLabel, st.tombPos, td < 12.5);

    if (td < 3.2) {
      st.phase = 'angel_met';
      isTimeAttackActive = false;
      if (st.tombLabel) st.tombLabel.style.opacity = '0';
      miracleMainStagesCleared[4] = true;
      miracleIsPostResurrection = true;
      unlockMiracleNotebookEntry('mir_resurrect', true);
      saveMiracleNotebookProgress();
      openStageClearModal(4);
      return;
    }
  }

  if (nextGuidePos && guideArrowGroup && guideArrowGroup.visible) {
    const baseFacing = (window.globalCameraViewMode === 'fps') ? (cameraYaw + Math.PI) : playerFacing;
    guideArrowGroup.rotation.y = Math.atan2(nextGuidePos.x - playerPos.x, nextGuidePos.z - playerPos.z) - baseFacing;
  }
}

// -------------------------------------------------------------------------
// 6. [최종 엔딩] 감람산 승천 언덕 (오픈월드 남동쪽 외곽 감람산 `x = 88, z = 74` 지형 연동)
// -------------------------------------------------------------------------
let miracleAscensionState = {
  active: false,
  timer: 0,
  jesusCloudGroup: null,
  spotObj: null,
  modalShown: false
};

function startMiracleAscensionEnding() {
  buildEndingWorld();
}

function buildMiracleEndingWorld() {
  clearWorld();
  resetMiracleBoatRockingTransform();
  ensureMiracleCustomUI();
  hideAllMiracleCustomUI();
  miracleSubMode = 'ascension';
  targetObject = null;

  const isPostAscension = Boolean(typeof miracleAscensionSeen !== 'undefined' && miracleAscensionSeen);

  if (typeof setupMiracleDynamicSunAndShadows === 'function') {
    setupMiracleDynamicSunAndShadows();
  }

  scene.background = new THREE.Color(0x38bdf8);
  scene.fog = new THREE.Fog(0xe0f2fe, 75, 250);
  currentMapRectBounds = { minX: -28, maxX: 28, minZ: -28, maxZ: 28 };

  // 감람산 지형 — getMiracleGroundHeight(vx, vz, 4)와 100% 동일한 함수를 사용해 서쪽 원경 건물과 성전이 땅에 정확히 밀착!
  const ascHeightFn = (vx, vz) => getMiracleGroundHeight(vx, vz, 4);
  const cAscTop    = new THREE.Color('#7c9a45');
  const cAscOlive  = new THREE.Color('#8ea854');
  const cAscMeadow = new THREE.Color('#b6b968');
  const cAscOchre  = new THREE.Color('#d8b674');
  const cAscSlope  = new THREE.Color('#cf9f60');
  const mountMesh = (typeof createCrispLowPolyFacetedTerrain === 'function')
    ? createCrispLowPolyFacetedTerrain(160, 160, 44, 44, ascHeightFn, (mx, my, mz, slopeFlat, hash2, outCol) => {
        if (mx < -30) {
          outCol.copy(cAscOchre);
        } else if (my > 1.6) {
          outCol.copy(cAscTop);
        } else if (slopeFlat < 0.945) {
          outCol.copy(cAscSlope);
        } else {
          const patch = hash2(Math.floor(mx * 0.16), Math.floor(mz * 0.16));
          outCol.copy(cAscOlive).lerp(cAscMeadow, 0.25 + patch * 0.45);
        }
      }, 0.72)
    : new THREE.Mesh(new THREE.PlaneGeometry(160, 160, 44, 44), new THREE.MeshLambertMaterial({ color: '#82a84d', flatShading: true }));
  worldGroup.add(mountMesh);

  if (typeof buildStageDryStoneTerraceWalls === 'function') {
    buildStageDryStoneTerraceWalls(
      [
        { pts: [[-22, -16], [-18, -4], [-20, 10], [-14, 20]], courses: 3 },
        { pts: [[ 22, -16], [ 18, -4], [ 20, 10], [ 14, 20]], courses: 3 },
        { pts: [[-16, -24], [0, -26], [16, -24]], courses: 2 }
      ],
      ascHeightFn,
      860
    );
  }

  const summitPadY = getMiracleGroundHeight(0, -8, 4);
  const summitPad = createLowPolyMesh(new THREE.CylinderGeometry(7.5, 8.5, 0.35, 16), '#f5e6c8', 0, summitPadY + 0.12, -8);
  worldGroup.add(summitPad);

  // 서쪽 골짜기 원경 건물 3채: 경사면에 살짝 깊이 묻히도록 Y 오프셋 -0.25 보정하여 절대 뜨지 않게 밀착!
  const b1 = addJudeanRoadsideBuilding(-44, -12, 1, Math.PI / 2, 0.95, false, 'stonebrick');
  if (b1) b1.position.y -= 0.25;
  const b2 = addJudeanRoadsideBuilding(-46,   8, 0, Math.PI / 2, 0.95, false, 'plaster');
  if (b2) b2.position.y -= 0.25;
  const b3 = addJudeanRoadsideBuilding(-56,  -2, 2, Math.PI / 2, 1.00, false, 'stonebrick');
  if (b3) b3.position.y -= 0.25;

  // ✅ 감람산 서쪽 골짜기 너머 예루살렘 성전 원경도 실제 지형 높이(getMiracleGroundHeight(-62, -2, 4))에 밀착 배치!
  if (typeof buildStageJerusalemTemple === 'function') {
    const templeGroundY = getMiracleGroundHeight(-62, -2, 4);
    buildStageJerusalemTemple(-62, templeGroundY - 0.35, -2, 0.85, Math.PI / 2, false);
  }

  if (typeof createBumpyLowPolyHillMesh === 'function') {
    createBumpyLowPolyHillMesh( 46, -24, 20, 6.5, 18, '#529336', 31, true);
    createBumpyLowPolyHillMesh( 48,  16, 20, 6.8, 18, '#6da344', 32, true);
    createBumpyLowPolyHillMesh(  0, -52, 24, 7.2, 18, '#428329', 33, true);
  }

  if (typeof addLowPolyCanopyTree === 'function') {
    addLowPolyCanopyTree(-16, -12, 1.25, true);
    addLowPolyCanopyTree( 16, -12, 1.25, true);
  }

  [[-14, 8], [14, 8], [-18, -6], [18, -6], [-12, -18], [12, -18], [-22, 16], [22, 16]].forEach(([tx, tz], i) => {
    if (i % 3 === 0) addLowPolyCypressPineTree(tx, tz, 1.2, true);
    else addLowPolyOliveTree(tx, tz, 1.2 + (i % 2) * 0.15, true);
  });

  if (typeof addLowPolyWildflowerCluster === 'function') {
    [[-8, 4], [8, 4], [-10, -2], [10, -2], [-6, 12], [6, 12]].forEach(([fx, fz]) => {
      addLowPolyWildflowerCluster(fx, fz, 1.0);
    });
  }

  [[-18, 20, -22, 1.2], [18, 22, -20, 1.3], [-24, 18, 8, 1.15], [24, 19, 10, 1.2]].forEach(([cx, cy, cz, sc]) => {
    const cl = createLowPolyCloudGroup(sc, false);
    cl.position.set(cx, cy, cz);
    worldGroup.add(cl);
  });

  const jesusBaseY = summitPadY + 0.30;
  let jesusCloudGroup = null;
  let jesusMesh = null;
  let footCloudGroup = null;
  let footCloudPuffs = [];
  let angelL = null;
  let angelR = null;

  if (!isPostAscension) {
    // [최초 승천 전] 감람산 단상 위에 예수님과 양옆 두 천사 배치 (승천 시 천사도 함께 올라감!)
    jesusCloudGroup = new THREE.Group();
    jesusMesh = createLowPolyPersonMesh('jesus', 0);
    jesusMesh.position.set(0, 0, 0);
    jesusCloudGroup.add(jesusMesh);

    footCloudGroup = new THREE.Group();
    footCloudGroup.position.set(0, -0.05, 0);
    footCloudGroup.visible = false;
    const puffSpecs = [
      { x:  0.00, y: -0.18, z:  0.00, r: 1.05, sx: 1.35, sy: 0.62, sz: 1.25, col: 0xffffff, delay: 1.55 },
      { x: -0.95, y: -0.22, z:  0.35, r: 0.85, sx: 1.22, sy: 0.58, sz: 1.15, col: 0xf8fafc, delay: 1.85 },
      { x:  0.98, y: -0.20, z:  0.28, r: 0.88, sx: 1.22, sy: 0.60, sz: 1.15, col: 0xfef9c3, delay: 1.95 },
      { x: -0.52, y: -0.26, z: -0.85, r: 0.90, sx: 1.25, sy: 0.60, sz: 1.12, col: 0xf1f5f9, delay: 2.15 },
      { x:  0.60, y: -0.24, z: -0.82, r: 0.86, sx: 1.20, sy: 0.58, sz: 1.15, col: 0xffffff, delay: 2.25 },
      { x: -1.65, y: -0.35, z: -0.15, r: 0.82, sx: 1.30, sy: 0.55, sz: 1.12, col: 0xf1f5f9, delay: 2.55 },
      { x:  1.70, y: -0.32, z: -0.10, r: 0.84, sx: 1.30, sy: 0.56, sz: 1.12, col: 0xffffff, delay: 2.65 },
      { x:  0.05, y: -0.38, z:  1.15, r: 0.92, sx: 1.35, sy: 0.58, sz: 1.10, col: 0xfef3c7, delay: 2.85 },
      { x: -0.10, y: -0.58, z: -0.20, r: 1.25, sx: 1.45, sy: 0.55, sz: 1.35, col: 0xe0f2fe, delay: 3.10 }
    ];
    puffSpecs.forEach((p, idx) => {
      const pMat = new THREE.MeshLambertMaterial({
        color: p.col,
        flatShading: true,
        transparent: true,
        opacity: 0.0,
        depthWrite: false
      });
      const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(p.r, 0), pMat);
      puff.position.set(p.x, p.y, p.z);
      puff.scale.set(0.01, 0.01, 0.01);
      puff.rotation.set(idx * 0.4, idx * 0.9, 0);
      footCloudGroup.add(puff);
      footCloudPuffs.push({ mesh: puff, mat: pMat, spec: p, phase: idx * 0.85 });
    });
    jesusCloudGroup.add(footCloudGroup);

    jesusCloudGroup.position.set(0, jesusBaseY, -8.5);
    worldGroup.add(jesusCloudGroup);

    angelL = createLowPolyPersonMesh('angel', 1); angelL.position.set(-3.8, summitPadY + 0.30, -7.2);
    angelR = createLowPolyPersonMesh('angel', 2); angelR.position.set( 3.8, summitPadY + 0.30, -7.2);
    worldGroup.add(angelL, angelR);
  } else {
    // [승천 이후 상태] 예수님은 이미 하늘로 승천하신 뒤 — 단상 위 평온한 하늘빛 기둥과 높은 흰 구름만 남음!
    const skyBeam = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 2.4, 34, 16, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false })
    );
    skyBeam.position.set(0, summitPadY + 17.2, -8.5);
    const highCloud = createLowPolyCloudGroup(1.85, false);
    highCloud.position.set(0, summitPadY + 21.0, -8.5);
    worldGroup.add(skyBeam, highCloud);
  }

  // 제자 11명 배치 (승천 이후 상태에서는 모두 하늘을 우러러보는 고개 각도 적용!)
  for (let i = 0; i < 11; i++) {
    const ang = (i / 10) * Math.PI - Math.PI;
    const dx = Math.cos(ang) * 6.5;
    const dz = -6 + Math.sin(ang) * 4.5;
    if (Math.abs(dx) < 2.2 && dz > -4) continue;
    const groundY = getMiracleGroundHeight(dx, dz, 4);
    const distFromPad = Math.hypot(dx, dz + 8);
    const baseY = (distFromPad <= 8.4) ? Math.max(groundY, summitPadY + 0.30) : groundY;
    const dMesh = createLowPolyPersonMesh('disciple', i);
    dMesh.position.set(dx, baseY, dz);
    dMesh.lookAt(0, baseY, -8.5);
    if (isPostAscension && dMesh.userData && dMesh.userData.head) {
      dMesh.userData.head.rotation.x = -0.40;
    }
    worldGroup.add(dMesh);
    endingCelebrationPeople.push({ mesh: dMesh, baseY, phase: i * 0.6 });
  }

  // 감람산 하늘에 평화롭게 선회하는 흰 비둘기 6마리
  window.miracleSkyBirds = [];
  if (typeof window.createFlyingBirdMesh === 'function') {
    for (let b = 0; b < 6; b++) {
      const dove = window.createFlyingBirdMesh('#ffffff', '#f1f5f9', 0.92);
      worldGroup.add(dove);
      window.miracleSkyBirds.push({
        mesh: dove,
        cx: 0,
        cz: -8,
        radX: 16 + (b % 3) * 6,
        radZ: 14 + (b % 2) * 5,
        baseY: summitPadY + 11 + (b % 3) * 3,
        angle: (b / 6) * Math.PI * 2,
        speed: 0.25 * (b % 2 === 0 ? 1 : -1),
        bobAmp: 0.8,
        flapSpeed: 9.0,
        phase: b * 1.1
      });
    }
  }

  const ringY = getMiracleGroundHeight(0, -5.0, 4);
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(1.8, 2.5, 28),
    new THREE.MeshBasicMaterial({ color: 0xfef08a, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(0, ringY + 0.12, -5.0);
  worldGroup.add(ring);

  const ascLbl = createWorldLabel(
    isPostAscension
      ? '☁️ 예수님 승천의 자리 (다가가면 오픈월드 · 월드맵 선택창이 열려요!)'
      : '👑 감람산 승천 언덕 (예수님께 다가가 승천하는 모습 보기!)'
  );
  ascLbl.style.opacity = '0';

  const spotObj = {
    type: 'mount_olives_ascension',
    pos: new THREE.Vector3(0, ringY + 0.8, -5.0),
    jesusPos: new THREE.Vector3(0, jesusBaseY + 0.8, -8.5),
    spotRing: ring,
    label: ascLbl,
    triggered: false
  };

  miracleAscensionState = {
    active: false,
    timer: 0,
    baseY: jesusBaseY,
    summitPadY,
    jesusCloudGroup,
    jesusMesh,
    angelL,
    angelR,
    footCloudGroup,
    footCloudPuffs,
    camLookCurrent: new THREE.Vector3(0, jesusBaseY + 1.4, -8.5),
    spotObj,
    modalShown: isPostAscension
  };

  const startY = getMiracleGroundHeight(0, 9.0, 4);
  playerPos.set(0, startY, 9.0);
  lastGroundedY = startY;
  playerFacing = Math.PI;
  cameraYaw = 0;
  cameraTargetYaw = 0;
  rebuildPlayerAppearance();
  snapCameraToPlayer();
  // 엔딩 세상에서도 좌측 HUD([나의 복음서 수첩] & [오픈월드로 돌아가기])를 즉시 표시!
  updateMiracleNotebookHudBadge();

  setTimeout(() => {
    const certBtn = document.getElementById('cert-open-btn');
    if (certBtn) certBtn.classList.add('hidden');
  }, 0);
}

function triggerMiracleAscensionSequence() {
  if (miracleAscensionState.active) return;
  const sp = miracleAscensionState.spotObj;
  if (miracleAscensionState.modalShown) {
    if (typeof showEndingWorldMapChoiceModal === 'function') {
      showEndingWorldMapChoiceModal();
    } else if (typeof showEndingCertificate === 'function') {
      showEndingCertificate();
    }
    return;
  }

  miracleAscensionState.active = true;
  miracleAscensionState.timer = 0;
  miracleAscensionState.camLookCurrent = new THREE.Vector3(0, miracleAscensionState.baseY + 1.3, -8.5);
  playerFacing = Math.atan2(0 - playerPos.x, -8.5 - playerPos.z);
  if (sp && sp.label) sp.label.style.opacity = '0';
  if (sp && sp.spotRing) sp.spotRing.visible = false;
  unlockMiracleNotebookEntry('wd_matt2820', true);
  playSfx('clear');
  showToast('✨ 예수님과 양옆의 두 천사가 함께 하늘로 승천하십니다! 발 아래 구름이 서서히 피어오릅니다!');
}

function updateMiracleEndingFrame(dt, now) {
  if (typeof updateMiracleDynamicSun === 'function') {
    updateMiracleDynamicSun(dt, now);
  }
  if (Array.isArray(window.miracleSkyBirds) && window.miracleSkyBirds.length > 0) {
    const tSec = now * 0.001;
    window.miracleSkyBirds.forEach(b => {
      if (!b || !b.mesh) return;
      b.angle += dt * b.speed;
      const nx = b.cx + Math.cos(b.angle) * b.radX;
      const nz = b.cz + Math.sin(b.angle) * b.radZ;
      const ny = b.baseY + Math.sin(b.angle * 2 + b.phase) * b.bobAmp;
      const vx = -Math.sin(b.angle) * b.radX * b.speed;
      const vz =  Math.cos(b.angle) * b.radZ * b.speed;
      b.mesh.position.set(nx, ny, nz);
      b.mesh.rotation.y = Math.atan2(vx, vz);
      const flap = Math.sin(tSec * b.flapSpeed + b.phase) * 0.52;
      if (b.mesh.userData && b.mesh.userData.wingL) {
        b.mesh.userData.wingL.rotation.z = flap;
        b.mesh.userData.wingR.rotation.z = -flap;
      }
    });
  }
  const st = miracleAscensionState;
  const sp = st.spotObj;

  if (!st.active) {
    if (sp) {
      const tdRing = Math.hypot(playerPos.x - sp.pos.x, playerPos.z - sp.pos.z);
      const tdJesus = sp.jesusPos
        ? Math.hypot(playerPos.x - sp.jesusPos.x, playerPos.z - sp.jesusPos.z)
        : 999;
      const td = Math.min(tdRing, tdJesus);
      updateWorldLabelPos(sp.label, sp.pos, td < 12.5);
      if (guideArrowGroup && guideArrowGroup.visible) {
        const baseFacing = (window.globalCameraViewMode === 'fps') ? (cameraYaw + Math.PI) : playerFacing;
        guideArrowGroup.rotation.y = Math.atan2(sp.pos.x - playerPos.x, sp.pos.z - playerPos.z) - baseFacing;
      }
      if ((tdRing < 3.1 || tdJesus < 4.4) && !sp.triggered) {
        sp.triggered = true;
        triggerMiracleAscensionSequence();
      } else if (td > 5.0 && st.modalShown) {
        sp.triggered = false;
      }
    }
    return;
  }

  st.timer += dt;
  const t = st.timer;

  // 1) 예수님 승천 + 양옆의 두 천사 동반 승천 연출!
  if (st.jesusCloudGroup && t < 6.8) {
    const riseSpeed = t < 1.6 ? THREE.MathUtils.lerp(0.85, 1.95, t / 1.6) : 2.55;
    st.jesusCloudGroup.position.y += dt * riseSpeed;

    // [요청 반영] 양옆의 두 천사도 예수님과 나란히 하늘로 승천!
    const riseOffset = st.jesusCloudGroup.position.y - st.baseY;
    if (st.angelL) {
      st.angelL.position.y = st.baseY + riseOffset * 0.96 + Math.sin(t * 2.4) * 0.14;
      st.angelL.position.x = -3.8 + Math.sin(t * 1.1) * 0.25;
      const au = st.angelL.userData;
      if (au && au.lArm && au.rArm) {
        au.lArm.rotation.z = 0.55 + Math.sin(t * 3.0) * 0.15;
        au.rArm.rotation.z = -0.35;
      }
    }
    if (st.angelR) {
      st.angelR.position.y = st.baseY + riseOffset * 0.96 + Math.cos(t * 2.4) * 0.14;
      st.angelR.position.x = 3.8 - Math.sin(t * 1.1) * 0.25;
      const au = st.angelR.userData;
      if (au && au.lArm && au.rArm) {
        au.lArm.rotation.z = 0.35;
        au.rArm.rotation.z = -0.55 - Math.sin(t * 3.0) * 0.15;
      }
    }

    // 예수님 축복하는 두 팔 올림 모션
    if (st.jesusMesh && st.jesusMesh.userData) {
      const ju = st.jesusMesh.userData;
      const armT = Math.min(1, t / 1.4);
      if (ju.lArm && ju.rArm) {
        ju.lArm.rotation.x = THREE.MathUtils.lerp(0, -1.35, armT);
        ju.rArm.rotation.x = THREE.MathUtils.lerp(0, -1.35, armT);
        ju.lArm.rotation.z = THREE.MathUtils.lerp(0,  0.48, armT);
        ju.rArm.rotation.z = THREE.MathUtils.lerp(0, -0.48, armT);
      }
    }

    // 2) 예수님 몸이 떠오른 뒤(t >= 1.55초) 발쪽에서 구름이 서서히 피어오름
    if (st.footCloudGroup && Array.isArray(st.footCloudPuffs)) {
      if (t >= 1.55) {
        st.footCloudGroup.visible = true;
        st.footCloudGroup.rotation.y += dt * 0.22;
        st.footCloudPuffs.forEach(item => {
          const localT = Math.max(0, Math.min(1, (t - item.spec.delay) / 1.35));
          const smooth = localT * localT * (3 - 2 * localT);
          const sc = Math.max(0.01, smooth);
          item.mesh.scale.set(item.spec.sx * sc, item.spec.sy * sc, item.spec.sz * sc);
          item.mesh.position.y = item.spec.y + Math.sin(t * 1.8 + item.phase) * 0.08 * smooth;
          item.mat.opacity = smooth * 0.90;
        });
      } else {
        st.footCloudGroup.visible = false;
      }
    }

    // 3) 카메라 로우앵글 전환
    const lowCamProgress = Math.min(1, t / 5.5);
    const camLowY = (st.summitPadY || 2.0) + THREE.MathUtils.lerp(1.15, 0.95, lowCamProgress);
    const camLowZ = THREE.MathUtils.lerp(-0.4, 2.2, lowCamProgress);
    const camLowX = Math.sin(lowCamProgress * 0.75) * 1.65;
    camera.position.lerp(new THREE.Vector3(camLowX, camLowY, camLowZ), Math.min(1, dt * 3.4));

    const desiredLook = new THREE.Vector3(0, st.jesusCloudGroup.position.y + 1.35, -8.5);
    if (!st.camLookCurrent) st.camLookCurrent = desiredLook.clone();
    st.camLookCurrent.lerp(desiredLook, Math.min(1, dt * 5.0));
    camera.lookAt(st.camLookCurrent);
  }

  if (t >= 5.8 && !st.modalShown) {
    st.modalShown = true;
    // 승천 완료 상태 기록 & 저장 → 이후 오픈월드 감람산 언덕 & 엔딩 세상 모두 승천 이후 상태 반영!
    miracleAscensionSeen = true;
    miracleMainStagesCleared[1] = true;
    miracleMainStagesCleared[2] = true;
    miracleMainStagesCleared[3] = true;
    miracleMainStagesCleared[4] = true;
    miracleIsPostResurrection = true;
    if (typeof saveMiracleNotebookProgress === 'function') saveMiracleNotebookProgress();
    if (typeof recordStageClearProgress === 'function') recordStageClearProgress('miracle', 4);

    const bf = document.getElementById('black-fade');
    if (bf) {
      document.getElementById('black-fade-icon').textContent = '☁️';
      document.getElementById('black-fade-title').textContent =
        '"너희 가운데서 하늘로 올려지신 이 예수는 하늘로 가심을 본 그대로 오시리라"';
      document.getElementById('black-fade-sub').textContent =
        '사도행전 1장 11절 · 아멘 주 예수여 오시옵소서 (요한계시록 22:20)';
      bf.style.opacity = '1';
      speakText('너희 가운데서 하늘로 올려지신 이 예수는 하늘로 가심을 본 그대로 오시리라');
    }

    setTimeout(() => {
      if (bf) bf.style.opacity = '0';
      st.active = false;
      // 승천 완료 후 예수님·천사 숨기고 승천 자리 선택창 활성화
      if (st.jesusCloudGroup) st.jesusCloudGroup.visible = false;
      if (st.angelL) st.angelL.visible = false;
      if (st.angelR) st.angelR.visible = false;
      setTimeout(() => {
        if (sp && sp.spotRing) sp.spotRing.visible = true;
        if (sp && sp.label) {
          sp.label.innerHTML = '☁️ 예수님 승천의 자리 (다가가면 오픈월드 · 월드맵 선택창이 열려요!)';
        }
      }, 1500);
      if (typeof showEndingCertificate === 'function') {
        showEndingCertificate();
      }
    }, 5200);
  }
}

// -------------------------------------------------------------------------
// 7. 에피소드 4 플러그인 등록 (REGISTER_EPISODE) - 시작부터 끝(});)까지 완전한 블록
// -------------------------------------------------------------------------
if (typeof EPISODE_MASTER_ADMIN_LOCK !== 'undefined') {
  EPISODE_MASTER_ADMIN_LOCK.miracle = false;
}

if (typeof window.playMiracleOpenWorldOgg !== 'function') {
  let _fallbackOgg = null;
  window.playMiracleOpenWorldOgg = function () {
    if (miracleSubMode !== 'openworld') return;
    if (!_fallbackOgg) {
      _fallbackOgg = new Audio('assets/music/miracle01.ogg');
      _fallbackOgg.loop = true;
      _fallbackOgg.volume = 0.6;
    }
    if (_fallbackOgg.paused) {
      _fallbackOgg.play().catch(() => {});
    }
  };
  window.stopMiracleOpenWorldOgg = function (reset = false) {
    if (_fallbackOgg && !_fallbackOgg.paused) _fallbackOgg.pause();
    if (_fallbackOgg && reset) _fallbackOgg.currentTime = 0;
  };
}

REGISTER_EPISODE('miracle', {
  locked: false,
  avatarIcon: '🕊️',
  scripture: MIRACLE_SCRIPTURE,
  certMeta: {
    badge: '🕊️ 에피소드 4 : 예수님의 기적과 부활·재림 언약 완주!',
    title: '갈릴리에서 감람산까지, 다시 오실 예수님을 기다려요!',
    verse: '"하늘로 올려지신 이 예수는 하늘로 가심을 본 그대로 오시리라" (사도행전 1:11)',
    mission: '갈릴리 바다·오병이어·십자가의 길·빈 무덤 부활 및 복음서 오픈월드 완주',
    prefix: 'JES-'
  },
  getBaseGroundHeight: function (x, z, st) {
    return window.getMiracleGroundHeight(x, z, st);
  },
  scheduleBgmBeat: function (ctx, step, st, mode, playing, timeRem, toFreq) {
    if (miracleSubMode === 'openworld') {
      const menuActive = (typeof isMenuBgmActive !== 'undefined' && isMenuBgmActive);
      if (!playing || menuActive) {
        if (typeof window.stopMiracleOpenWorldOgg === 'function') window.stopMiracleOpenWorldOgg(false);
      } else if (typeof window.playMiracleOpenWorldOgg === 'function') {
        window.playMiracleOpenWorldOgg();
      }
      return 2500;
    }
    if (typeof window.stopMiracleOpenWorldOgg === 'function') {
      window.stopMiracleOpenWorldOgg(false);
    }
    return scheduleMiracleBgmBeat(ctx, step, st, mode, playing, timeRem, toFreq);
  },
  createHeroMesh: function () {
    return createMiracleHeroMesh();
  },
  onCloseScreen: function () {
    if (typeof window.stopMiracleOpenWorldOgg === 'function') window.stopMiracleOpenWorldOgg(true);
    hideAllMiracleCustomUI();
  },
  clearState: function () {
    if (typeof window.stopMiracleOpenWorldOgg === 'function') window.stopMiracleOpenWorldOgg(true);
    hideAllMiracleCustomUI();
    clearMiracleFieldEventObjects();
    miracleStageSpots = [];
    miracleEventSpots = [];
    miracleRumorNpcs = [];
    miracleAmbientProps = [];
    miracleStageObjects = [];
    window.miracleSkyBirds = [];
    window.miracleBuildingBounds = [];
    window.miracleRooftopSpawnSpots = [];
    window.miracleGrowingFields = [];
    window.miracleWorldTreePositions = [];
    window.miracleZacchaeusGroveTrees = [];
    miracleStageCutscene.active = false;
    _isEnteringMiracleStage = false;
    if (typeof playerGroup !== 'undefined' && playerGroup) {
      playerGroup.rotation.x = 0;
      playerGroup.scale.set(1, 1, 1);
    }
    if (typeof miracleSunSystem !== 'undefined') {
      miracleSunSystem.sunVisualGroup = null;
      miracleSunSystem.cullEntries = [];
      miracleSunSystem.cullBuilt = false;
    }
  },
  getPlayerMoveSpeed: function (st, baseSpeed) {
    // 스테이지 3: 십자가를 대신 짊어진 상태에서는 아무리 세게 터치해도 원래 예수님 걷는 속도(1.65 m/s)와 정확히 동일하게 제한!
    if (miracleSubMode === 'main3_cross' && miracleActiveMiniState && miracleActiveMiniState.phase === 'carry') {
      return MIRACLE_STAGE3_CROSS_WALK_SPEED;
    }
    return baseSpeed;
  },
  getInitialTime: function (st) {
    return st === 1 ? 52.0 : (st === 2 ? 54.0 : 48.0);
  },
  buildStage: function (st) {
    rebuildPlayerAppearance();
    if (st === 1) {
      buildMiracleOpenWorld(false);
    } else if (st === 2) {
      buildMiracleMainStage2Loaves();
    } else if (st === 3) {
      buildMiracleMainStage3Cross();
    }
  },
  buildEndingWorld: function () {
    buildMiracleEndingWorld();
  },
  endingToast: '☁️ 감람산 정상에서 제자들과 함께 예수님의 승천과 다시 오실 재림의 약속을 확인하세요!',
  updateHUD: function (st, badge, countIcon, countText, missionText) {
    updateMiracleNotebookHudBadge();
    if (miracleSubMode === 'openworld') {
      const clearedCnt = Object.values(miracleMainStagesCleared).filter(Boolean).length;
      const nextSt = (typeof getNextActiveMainStageNumber === 'function') ? getNextActiveMainStageNumber() : 1;
      badge.textContent = miracleIsPostResurrection ? '복음서 오픈월드 (부활 후)' : '복음서 오픈월드';
      countIcon.textContent = '📖';
      countText.textContent = `주요사건 ${clearedCnt}/4 · 수첩 ${miracleCollectedIds.size}/36`;
      missionText.textContent = miracleIsPostResurrection
        ? '부활하신 예수님의 증언(엠마오·도마·바닷가 아침식사)을 체험하고 빛기둥이 비추는 감람산 정상으로 오르세요!'
        : `빛기둥이 비추는 [메인 스테이지 ${nextSt}]을(를) 순서대로 진행하고, 반짝이는 빛의 원이 있는 비유·사건을 체험하세요!`;
    } else if (miracleSubMode === 'main1_galilee') {
      const ms = miracleActiveMiniState;
      badge.textContent = '갈릴리 바다 · 스테이지 1';
      countIcon.textContent = ms.phase === 'cast_net' ? '🎣' : '⛵';
      countText.textContent = ms.phase === 'cast_net'
        ? `그물 성공 ${ms.castCaught}/${ms.reqCasts}`
        : (ms.phase === 'storm_balance'
          ? `균형 ${Math.min(100, Math.round((ms.balanceProgress / ms.balanceGoal) * 100))}%`
          : '예수님 깨우기!');
      missionText.textContent = ms.phase === 'cast_net'
        ? '버튼을 꾹 눌러 게이지가 초록 구간에 왔을 때 손을 떼 바다에 그물을 던지세요!'
        : (ms.phase === 'storm_balance'
          ? '거센 풍랑으로 배가 기울어요! 기울어지는 반대쪽 버튼을 눌러 균형을 유지하세요!'
          : '고물 베개에 누워 주무시는 예수님을 깨워 폭풍우를 잠재워 달라고 도움을 구하세요!');
    } else if (miracleSubMode === 'main2_loaves') {
      const ms = miracleActiveMiniState;
      badge.textContent = '오병이어 · 스테이지 2';
      countIcon.textContent = '🍞';
      countText.textContent = ms.phase === 'gather_baskets'
        ? `광주리 ${ms.basketsGathered}/${ms.reqBaskets}`
        : (ms.phase === 'bring_to_jesus' ? '예수님께 전달' : '도시락 찾기');
      missionText.textContent = ms.phase === 'find_boy'
        ? '많은 인파 속에서 보리떡 5개와 물고기 2마리 도시락을 가진 어린아이를 가까이 다가가 찾아보세요!'
        : (ms.phase === 'bring_to_jesus'
          ? '어린아이의 오병이어 도시락을 언덕 위 예수님께 가져다드리세요!'
          : `모두가 배불리 먹었습니다! 언덕 곳곳에 남은 조각 ${ms.reqBaskets}광주리를 모두 거두세요!`);
    } else if (miracleSubMode === 'main3_cross') {
      const ms = miracleActiveMiniState;
      badge.textContent = '십자가의 길 · 스테이지 3';
      countIcon.textContent = '✝️';
      countText.textContent = ms.phase === 'find_jesus' ? `단서 ${ms.cluesFound}/${ms.reqClues}` : '십자가 동행 등반';
      missionText.textContent = ms.phase === 'find_jesus'
        ? '단서를 듣고 예수님이 정상에 도착하시기 전에 다가가 [내가 들기]를 선택하세요!'
        : '예수님 걸음에 맞춰 무거운 십자가를 등에 지고 골고다 언덕 정상까지 올라가세요!';
    } else if (miracleSubMode === 'main4_tomb') {
      const ms = miracleActiveMiniState;
      badge.textContent = '빈 무덤 · 스테이지 4';
      countIcon.textContent = '🌅';
      countText.textContent = ms.phase === 'maze_clues' ? `단서 ${ms.cluesFound}/${ms.reqClues}` : '빈 무덤 발견';
      missionText.textContent = ms.phase === 'maze_clues'
        ? `새벽 마을 미로에서 사람들에게 단서 ${ms.reqClues}개를 찾아 동산 무덤 문을 여세요!`
        : '굴러간 돌문 앞 빛나는 천사에게 다가가 예수님의 부활 소식을 들으세요!';
    } else {
      badge.textContent = '감람산 승천 언덕';
      countIcon.textContent = '☁️';
      countText.textContent = '재림의 약속';
      missionText.textContent = '감람산 정상으로 나아가 예수님의 승천과 다시 오실 재림의 약속을 확인하세요!';
    }
  },
  proceedNextStage: function (st) {
    isPlaying = true;
    isTimeAttackActive = false;
    const timerBox = document.getElementById('hud-timer-box');
    if (timerBox) timerBox.classList.add('hidden');
    const s1Ui = document.getElementById('miracle-s1-ui');
    if (s1Ui) s1Ui.classList.add('hidden');
    const wf = document.getElementById('white-fade');
    if (wf) wf.style.opacity = '0';
    buildMiracleOpenWorld(true);
    if (typeof syncMiracleMainStageSequentialBeams === 'function') {
      syncMiracleMainStageSequentialBeams();
    }
    startStageBgm(st);
  },
  updateStageFrame: function (dt, now, st) {
    if (miracleSubMode === 'openworld') updateMiracleOpenWorldFrame(dt, now);
    else if (miracleSubMode === 'main1_galilee') updateMiracleMainStage1Frame(dt, now);
    else if (miracleSubMode === 'main2_loaves') updateMiracleMainStage2Frame(dt, now);
    else if (miracleSubMode === 'main3_cross') updateMiracleMainStage3Frame(dt, now);
    else if (miracleSubMode === 'main4_tomb') updateMiracleMainStage4Frame(dt, now);
    else if (miracleSubMode === 'ascension' || st === 4) updateMiracleEndingFrame(dt, now);
  }
});