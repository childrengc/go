// =========================================================================
// [ep3_david_st3_end.js - 전반부 (1/2)] 에피소드 3 : 스테이지 3 (다윗성 월드·조약돌 바닥·건물 질감·랜덤 자원)
// - 스테이지 3 타임어택 기본 시간 상향 (32.0초 -> 48.0초)
// - 모바일 세로모드에서 좌측 상단 퀘스트창(#david-st3-quest-tracker)이 상단 미션 안내창(#hud-top)과 겹치지 않도록 동적 위치 보정 유지
// - 고대 이스라엘 성읍 조약돌 바닥(makeDavidCityStoneTex) 및 건물 외벽·처마·우물 광장 디자인 100% 유지
// =========================================================================

window.__GAME_BUILD_VERSIONS__ = window.__GAME_BUILD_VERSIONS__ || {};
window.__GAME_BUILD_VERSIONS__.ep3_st3_end = '3.12.3';

// -------------------------------------------------------------------------
// 1. 진행 중인 퀘스트 초소형 코너 배지 UI (모바일 세로모드 상단 안내창 겹침 자동 방지)
// -------------------------------------------------------------------------
function positionDavidStage3QuestTrackerBelowHUD() {
  const tracker = document.getElementById('david-st3-quest-tracker');
  if (!tracker || tracker.classList.contains('hidden')) return;

  const menuBtn = document.getElementById('hud-menu-btn');
  let safeBottom = 46;

  if (menuBtn) {
    const r = menuBtn.getBoundingClientRect();
    if (r && r.bottom > 0) {
      safeBottom = Math.max(42, Math.ceil(r.bottom) + 8);
    }
  }

  tracker.style.top = `${safeBottom}px`;
}

function ensureDavidStage3QuestTrackerUI() {
  const uiRoot = ensureDavidCustomUI();
  let tracker = document.getElementById('david-st3-quest-tracker');
  if (!tracker) {
    tracker = document.createElement('div');
    tracker.id = 'david-st3-quest-tracker';
    tracker.className =
      'hidden fixed left-2 z-20 px-2.5 py-1.5 rounded-xl bg-slate-900/75 backdrop-blur-sm border border-amber-400/80 text-white shadow-md flex flex-col gap-0.5 pointer-events-none';
    tracker.style.top = '46px';
    tracker.innerHTML = `
      <div class="flex items-center gap-1.5">
        <span id="david-st3-quest-title" class="text-[11px] font-jua text-amber-300 leading-none">📜 퀘스트</span>
      </div>
      <div id="david-st3-quest-reqs" class="text-[11px] font-bold text-emerald-300 leading-tight"></div>
    `;
    uiRoot.appendChild(tracker);

    window.addEventListener('resize', positionDavidStage3QuestTrackerBelowHUD);
    window.addEventListener('orientationchange', () => {
      setTimeout(positionDavidStage3QuestTrackerBelowHUD, 120);
    });
  }
  return tracker;
}

function updateDavidStage3QuestTrackerUI() {
  const tracker = ensureDavidStage3QuestTrackerUI();
  if (
    currentEpisode !== 'david' ||
    currentStage !== 3 ||
    !davidCurrentActiveQuestNpc ||
    davidCurrentActiveQuestNpc.completed
  ) {
    tracker.classList.add('hidden');
    return;
  }

  const npc = davidCurrentActiveQuestNpc;
  tracker.classList.remove('hidden');
  positionDavidStage3QuestTrackerBelowHUD();

  const titleEl = document.getElementById('david-st3-quest-title');
  const reqsEl = document.getElementById('david-st3-quest-reqs');

  if (titleEl) titleEl.textContent = `📜 ${npc.roleTitle}`;

  if (npc.req && reqsEl) {
    const parts = [];
    if (npc.req.wood > 0) {
      const wDone = davidInventory.wood >= npc.req.wood;
      parts.push(`<span class="${wDone ? 'text-emerald-300' : 'text-amber-200'}">🪵${Math.min(davidInventory.wood, npc.req.wood)}/${npc.req.wood}</span>`);
    }
    if (npc.req.stone > 0) {
      const sDone = davidInventory.stone >= npc.req.stone;
      parts.push(`<span class="${sDone ? 'text-emerald-300' : 'text-sky-200'}">🪨${Math.min(davidInventory.stone, npc.req.stone)}/${npc.req.stone}</span>`);
    }
    if (npc.req.iron > 0) {
      const iDone = davidInventory.iron >= npc.req.iron;
      parts.push(`<span class="${iDone ? 'text-emerald-300' : 'text-orange-200'}">⚙️${Math.min(davidInventory.iron, npc.req.iron)}/${npc.req.iron}</span>`);
    }

    const allMet =
      davidInventory.wood >= npc.req.wood &&
      davidInventory.stone >= npc.req.stone &&
      davidInventory.iron >= npc.req.iron;

    reqsEl.innerHTML = allMet
      ? `<span class="text-yellow-300 animate-pulse">✅ 완료! ${npc.roleTitle}에게 이동</span>`
      : parts.join(' · ');
  }
}

// -------------------------------------------------------------------------
// 2. 도시 바닥 고대 이스라엘 성읍 조약돌(Cobblestone) 포장 텍스처 & 건물 외벽 텍스처 생성기
// -------------------------------------------------------------------------
let _davidCityStoneTex = null;
function makeDavidCityStoneTex(repeatX = 36, repeatY = 36) {
  if (_davidCityStoneTex && repeatX === 36 && repeatY === 36) return _davidCityStoneTex;

  const W = 256;
  const H = 256;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');

  let seed = 77319042;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  const wrapDelta = (d, max) => {
    if (d > max * 0.5) return d - max;
    if (d < -max * 0.5) return d + max;
    return d;
  };

  const stonePalette = [
    [168, 158, 140],
    [148, 139, 125],
    [128, 124, 116],
    [104, 102,  98],
    [158, 142, 118],
    [136, 131, 118],
    [115, 109, 100],
    [175, 165, 148],
    [140, 126, 108],
    [ 92,  91,  88],
    [152, 146, 136]
  ];

  const stones = [];

  const targetMain = 60;
  let attempts = 0;
  while (stones.length < targetMain && attempts < 4500) {
    attempts++;
    const cx = rand() * W;
    const cy = rand() * H;
    const minDist = 24.0 - Math.min(5.5, attempts * 0.002);
    let ok = true;
    for (let i = 0; i < stones.length; i++) {
      const dx = wrapDelta(cx - stones[i].x, W);
      const dy = wrapDelta(cy - stones[i].y, H);
      if (Math.hypot(dx, dy) < minDist) {
        ok = false;
        break;
      }
    }
    if (ok) {
      const rx = 1.02 + rand() * 0.34;
      const ry = 0.78 + rand() * 0.26;
      const ang = (rand() - 0.5) * 1.05;
      stones.push({
        x: cx,
        y: cy,
        rx,
        ry,
        ang,
        cosA: Math.cos(ang),
        sinA: Math.sin(ang),
        radius: 15.2 + rand() * 4.2,
        lobeP1: rand() * Math.PI * 2,
        lobeP2: rand() * Math.PI * 2,
        lobeA1: 0.04 + rand() * 0.05,
        lobeA2: 0.02 + rand() * 0.04,
        col: stonePalette[Math.floor(rand() * stonePalette.length)],
        grainPhase: rand() * 100
      });
    }
  }

  for (let iter = 0; iter < 3; iter++) {
    const mx = new Float32Array(stones.length);
    const my = new Float32Array(stones.length);
    for (let i = 0; i < stones.length; i++) {
      for (let j = i + 1; j < stones.length; j++) {
        const dx = wrapDelta(stones[j].x - stones[i].x, W);
        const dy = wrapDelta(stones[j].y - stones[i].y, H);
        const d = Math.hypot(dx, dy) || 0.001;
        const targetD = 26.2;
        if (d < targetD) {
          const push = (targetD - d) * 0.25;
          mx[i] -= (dx / d) * push;
          my[i] -= (dy / d) * push;
          mx[j] += (dx / d) * push;
          my[j] += (dy / d) * push;
        }
      }
    }
    for (let i = 0; i < stones.length; i++) {
      stones[i].x = (stones[i].x + mx[i] + W) % W;
      stones[i].y = (stones[i].y + my[i] + H) % H;
    }
  }

  for (let gy = 0; gy < 32; gy++) {
    for (let gx = 0; gx < 32; gx++) {
      const cx = (gx + 0.5) * (W / 32);
      const cy = (gy + 0.5) * (H / 32);
      let nearestSurf = 1e9;
      let nearestCenter = 1e9;
      for (let i = 0; i < stones.length; i++) {
        const st = stones[i];
        const dx = wrapDelta(cx - st.x, W);
        const dy = wrapDelta(cy - st.y, H);
        const centerDist = Math.hypot(dx, dy);
        if (centerDist < nearestCenter) nearestCenter = centerDist;
        const rx = (dx * st.cosA + dy * st.sinA) / st.rx;
        const ry = (-dx * st.sinA + dy * st.cosA) / st.ry;
        const surfDist = Math.hypot(rx, ry) - st.radius;
        if (surfDist < nearestSurf) nearestSurf = surfDist;
      }
      if (nearestSurf > 2.2 && nearestCenter > 13.5) {
        const ang = (rand() - 0.5) * 1.4;
        stones.push({
          x: (cx + (rand() - 0.5) * 1.4 + W) % W,
          y: (cy + (rand() - 0.5) * 1.4 + H) % H,
          rx: 0.90 + rand() * 0.22,
          ry: 0.84 + rand() * 0.20,
          ang,
          cosA: Math.cos(ang),
          sinA: Math.sin(ang),
          radius: Math.min(11.2, nearestSurf + 5.2),
          lobeP1: rand() * Math.PI * 2,
          lobeP2: rand() * Math.PI * 2,
          lobeA1: 0.03 + rand() * 0.04,
          lobeA2: 0.02 + rand() * 0.03,
          col: stonePalette[Math.floor(rand() * stonePalette.length)],
          grainPhase: rand() * 100
        });
      }
    }
  }

  const imgData = ctx.createImageData(W, H);
  const data = imgData.data;
  const tau = Math.PI * 2;

  const smin = (a, b, k) => {
    const h = Math.max(k - Math.abs(a - b), 0.0) / k;
    return Math.min(a, b) - h * h * k * 0.25;
  };

  for (let py = 0; py < H; py++) {
    for (let px = 0; px < W; px++) {
      const wx = px + 1.2 * Math.sin((py / H) * tau * 3 + 0.4);
      const wy = py + 1.2 * Math.cos((px / W) * tau * 3 + 1.1);

      let d1 = 1e9, d2 = 1e9, d3 = 1e9, d4 = 1e9;
      let s1 = null;
      let lx1 = 0, ly1 = 0;

      for (let i = 0; i < stones.length; i++) {
        const st = stones[i];
        const dx = wrapDelta(wx - st.x, W);
        const dy = wrapDelta(wy - st.y, H);
        if (Math.abs(dx) > 48 || Math.abs(dy) > 48) continue;

        const rx = (dx * st.cosA + dy * st.sinA) / st.rx;
        const ry = (-dx * st.sinA + dy * st.cosA) / st.ry;
        const theta = Math.atan2(ry, rx);
        const lobe = 1.0 + st.lobeA1 * Math.cos(2 * theta + st.lobeP1) + st.lobeA2 * Math.sin(3 * theta + st.lobeP2);

        const d = Math.hypot(rx, ry) - st.radius * lobe;

        if (d < d1) {
          d4 = d3; d3 = d2; d2 = d1; d1 = d;
          s1 = st; lx1 = dx; ly1 = dy;
        } else if (d < d2) {
          d4 = d3; d3 = d2; d2 = d;
        } else if (d < d3) {
          d4 = d3; d3 = d;
        } else if (d < d4) {
          d4 = d;
        }
      }

      const e12 = 0.55 * (d2 - d1);
      const e13 = 0.55 * (d3 - d1);
      const e14 = 0.55 * (d4 - d1);
      const neighborClearance = smin(smin(e12, e13, 3.8), e14, 3.4);
      const ownOvalLimit = -d1 + 1.8;
      const pebbleDist = smin(neighborClearance, ownOvalLimit, 3.2);

      const nHash = Math.sin(px * 12.9898 + py * 78.233) * 43758.5453;
      const fineNoise = (nHash - Math.floor(nHash)) - 0.5;
      const patchNoise =
        Math.sin((px / W) * tau * 9 + (s1 ? s1.grainPhase : 0)) *
        Math.cos((py / H) * tau * 9 - (s1 ? s1.grainPhase : 0));

      const mortarGap = 0.95;
      const idx = (py * W + px) * 4;

      if (pebbleDist < mortarGap) {
        const depth = Math.max(0, Math.min(1, (pebbleDist + 1.2) / (mortarGap + 1.2)));
        const mr = 42 + depth * 22 + fineNoise * 12;
        const mg = 36 + depth * 19 + fineNoise * 10;
        const mb = 30 + depth * 16 + fineNoise * 8;
        data[idx]     = Math.max(0, Math.min(255, Math.round(mr)));
        data[idx + 1] = Math.max(0, Math.min(255, Math.round(mg)));
        data[idx + 2] = Math.max(0, Math.min(255, Math.round(mb)));
        data[idx + 3] = 255;
      } else {
        const rim = Math.min(1.0, (pebbleDist - mortarGap) / 5.4);
        const dome = Math.pow(rim, 0.46);

        const normX = lx1 / (s1.radius * s1.rx);
        const normY = ly1 / (s1.radius * s1.ry);
        const sunDot = (-normX * 0.65 - normY * 0.76);
        const shade = Math.max(-0.24, Math.min(0.22, sunDot * 0.19));
        const centerCrown = Math.max(0, 1.0 - Math.hypot(normX, normY) * 0.85) * 0.08;

        const factor = (0.65 + 0.35 * dome) + shade + centerCrown;
        const weather = patchNoise * 8.5 + fineNoise * 11.5;

        const r = s1.col[0] * factor + weather;
        const g = s1.col[1] * factor + weather * 0.95;
        const b = s1.col[2] * factor + weather * 0.88;

        data[idx]     = Math.max(0, Math.min(255, Math.round(r)));
        data[idx + 1] = Math.max(0, Math.min(255, Math.round(g)));
        data[idx + 2] = Math.max(0, Math.min(255, Math.round(b)));
        data[idx + 3] = 255;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.needsUpdate = true;

  if (repeatX === 36 && repeatY === 36) {
    _davidCityStoneTex = tex;
  }
  return tex;
}

const _davidWallTexCache = {};
function makeDavidBuildingWallTex(variant = 0) {
  const key = `wall_v_${variant % 4}`;
  if (_davidWallTexCache[key]) return _davidWallTexCache[key];

  const schemes = [
    { bg: '#e8d0a7', b1: '#f5e1be', b2: '#dabb8a', b3: '#cfa972', mortar: '#9c784c', frieze: '#b45309' },
    { bg: '#e6c29f', b1: '#f3d4b6', b2: '#d9ae86', b3: '#c8986c', mortar: '#8c5832', frieze: '#9a3412' },
    { bg: '#ece0b9', b1: '#f7eed0', b2: '#dfd0a0', b3: '#cfc08e', mortar: '#8f7e4f', frieze: '#a16207' },
    { bg: '#dcd6ce', b1: '#eae5df', b2: '#cdc5ba', b3: '#beb5a8', mortar: '#78716c', frieze: '#57534e' }
  ];
  const sc = schemes[variant % schemes.length];

  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d');

  ctx.fillStyle = sc.mortar;
  ctx.fillRect(0, 0, 128, 128);

  const bricks = [sc.b1, sc.b2, sc.b3, sc.bg];
  const rowH = 16;
  const colW = 32;

  for (let r = 0; r < 8; r++) {
    const offX = (r % 2) * 16;
    for (let col = -1; col < 5; col++) {
      const bx = col * colW + offX;
      const by = r * rowH;
      ctx.fillStyle = bricks[(r * 5 + col + 8) % bricks.length];
      ctx.fillRect(bx + 1, by + 1, colW - 2, rowH - 2);

      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.fillRect(bx + 2, by + 2, colW - 4, 2);
      ctx.fillStyle = 'rgba(60,35,15,0.18)';
      ctx.fillRect(bx + 2, by + rowH - 3, colW - 4, 2);

      ctx.fillStyle = 'rgba(90,60,30,0.14)';
      ctx.fillRect(bx + 6 + ((r * 7) % 14), by + 6, 3, 3);
      ctx.fillRect(bx + 18 + ((col * 5) % 8), by + 9, 2, 2);
    }
  }

  ctx.fillStyle = sc.frieze;
  ctx.fillRect(0, 0, 128, 6);
  ctx.fillRect(0, 120, 128, 8);
  for (let x = 4; x < 128; x += 16) {
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(x, 2, 6, 3);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  _davidWallTexCache[key] = tex;
  return tex;
}

function makeDetailedBuildingWallMat(variant = 0) {
  return new THREE.MeshLambertMaterial({ map: makeDavidBuildingWallTex(variant) });
}

function registerCitySolidBox(cx, cz, w, d, topY, pad = 0.30) {
  const minX = cx - w / 2 - pad;
  const maxX = cx + w / 2 + pad;
  const minZ = cz - d / 2 - pad;
  const maxZ = cz + d / 2 + pad;
  colliders.push({ minX, maxX, minZ, maxZ });
  platforms.push({ minX, maxX, minZ, maxZ, topY });
  davidCityBuildingBoxes.push({ minX, maxX, minZ, maxZ, topY });
}

let davidStage3KingTrail = [];

function lockCompletedQuestBuilding(cx, cz, w, d, topY, completedGroup) {
  registerCitySolidBox(cx, cz, w, d, topY, 0.28);
  if (completedGroup) {
    completedGroup.traverse(child => {
      if (child.isMesh && !wallMeshes.includes(child)) {
        wallMeshes.push(child);
      }
    });
  }
  resolvePlayerOutOfCityBuildings();
  if (typeof davidRetainers !== 'undefined' && Array.isArray(davidRetainers)) {
    davidRetainers.forEach(ret => resolveRetainerOutOfCityBuildings(ret));
  }
}

function isCityFloorSpotClear(x, z, pad = 1.35) {
  for (const b of davidCityBuildingBoxes) {
    if (x + pad > b.minX && x - pad < b.maxX && z + pad > b.minZ && z - pad < b.maxZ) {
      return false;
    }
  }
  return true;
}

function isRetainerSpotClear(x, z, curY = 0, pad = 0.46) {
  if (currentMapRectBounds !== null) {
    if (
      x < currentMapRectBounds.minX + pad ||
      x > currentMapRectBounds.maxX - pad ||
      z < currentMapRectBounds.minZ + pad ||
      z > currentMapRectBounds.maxZ - pad
    ) {
      return false;
    }
  }
  for (const b of davidCityBuildingBoxes) {
    if (curY >= b.topY - 0.55) continue;
    if (x + pad > b.minX && x - pad < b.maxX && z + pad > b.minZ && z - pad < b.maxZ) {
      return false;
    }
  }
  return true;
}

function isRetainerLineClear(x1, z1, x2, z2, curY = 0, pad = 0.40) {
  const dist = Math.hypot(x2 - x1, z2 - z1);
  if (dist < 0.05) return isRetainerSpotClear(x2, z2, curY, pad);
  const steps = Math.max(2, Math.ceil(dist / 0.45));
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const sx = x1 + (x2 - x1) * t;
    const sz = z1 + (z2 - z1) * t;
    if (!isRetainerSpotClear(sx, sz, curY, pad)) return false;
  }
  return true;
}

function resolveRetainerOutOfCityBuildings(ret) {
  if (!ret || !ret.mesh) return;
  const pos = ret.mesh.position;
  const pad = 0.46;
  for (const b of davidCityBuildingBoxes) {
    if (pos.y >= b.topY - 0.55) continue;
    const minX = b.minX - pad;
    const maxX = b.maxX + pad;
    const minZ = b.minZ - pad;
    const maxZ = b.maxZ + pad;
    if (pos.x > minX && pos.x < maxX && pos.z > minZ && pos.z < maxZ) {
      const dLeft = pos.x - minX;
      const dRight = maxX - pos.x;
      const dNorth = pos.z - minZ;
      const dSouth = maxZ - pos.z;
      const minSide = Math.min(dLeft, dRight, dNorth, dSouth);
      if (minSide === dLeft) pos.x = minX - 0.08;
      else if (minSide === dRight) pos.x = maxX + 0.08;
      else if (minSide === dNorth) pos.z = minZ - 0.08;
      else pos.z = maxZ + 0.08;
    }
  }
}

function getKingTrailPointAtDist(targetDist) {
  if (!davidStage3KingTrail || davidStage3KingTrail.length === 0) {
    const sinF = Math.sin(playerFacing);
    const cosF = Math.cos(playerFacing);
    return {
      x: playerPos.x - sinF * targetDist,
      z: playerPos.z - cosF * targetDist,
      y: playerPos.y
    };
  }
  let acc = 0;
  let prevX = playerPos.x;
  let prevZ = playerPos.z;
  let prevY = playerPos.y;
  for (let i = 0; i < davidStage3KingTrail.length; i++) {
    const pt = davidStage3KingTrail[i];
    const seg = Math.hypot(pt.x - prevX, pt.z - prevZ);
    if (acc + seg >= targetDist && seg > 0.001) {
      const r = (targetDist - acc) / seg;
      return {
        x: prevX + (pt.x - prevX) * r,
        z: prevZ + (pt.z - prevZ) * r,
        y: prevY + (pt.y - prevY) * r
      };
    }
    acc += seg;
    prevX = pt.x;
    prevZ = pt.z;
    prevY = pt.y;
  }
  const last = davidStage3KingTrail[davidStage3KingTrail.length - 1];
  return { x: last.x, z: last.z, y: last.y };
}

function resolvePlayerOutOfCityBuildings() {
  for (const b of davidCityBuildingBoxes) {
    if (playerPos.y >= b.topY - 0.55) continue;

    if (
      playerPos.x > b.minX && playerPos.x < b.maxX &&
      playerPos.z > b.minZ && playerPos.z < b.maxZ
    ) {
      const dLeft = playerPos.x - b.minX;
      const dRight = b.maxX - playerPos.x;
      const dNorth = playerPos.z - b.minZ;
      const dSouth = b.maxZ - playerPos.z;
      const minSide = Math.min(dLeft, dRight, dNorth, dSouth);

      if (minSide === dLeft) playerPos.x = b.minX - 0.18;
      else if (minSide === dRight) playerPos.x = b.maxX + 0.18;
      else if (minSide === dNorth) playerPos.z = b.minZ - 0.18;
      else playerPos.z = b.maxZ + 0.18;
    }
  }
}

// -------------------------------------------------------------------------
// 3. 맵 가장자리 성벽(석조 텍스처 + 반투명 시야 보장) 및 성벽 밖 곧은 길 생성
// -------------------------------------------------------------------------
function buildDavidCastleWallPerimeter(limit, withSouthGate = true) {
  const wallTrimMat = matVoxel('#b45309', '#78350f');
  const wallH = 8.2;
  const wallThick = 3.4;

  const addTransparentWallSegment = (w, h, d, x, y, z, isTrim = false, v = 0) => {
    const mat = isTrim ? wallTrimMat.clone() : makeDetailedBuildingWallMat(v);
    const box = createBox(w, h, d, mat, x, y, z);
    worldGroup.add(box);
    wallMeshes.push(box);
    return box;
  };

  const addWallSpanAlongX = (xStart, xEnd, zPos, segCount) => {
    const totalW = xEnd - xStart;
    const segW = totalW / segCount;
    for (let i = 0; i < segCount; i++) {
      const cx = xStart + (i + 0.5) * segW;
      addTransparentWallSegment(segW, wallH, wallThick, cx, wallH / 2, zPos, false, 0);
      addTransparentWallSegment(segW, 0.55, wallThick + 0.4, cx, wallH + 0.275, zPos, true);
      const merlonOffsets = segW >= 9.0 ? [-segW * 0.3, 0, segW * 0.3] : [-segW * 0.25, segW * 0.25];
      merlonOffsets.forEach(ox => {
        addTransparentWallSegment(1.8, 1.2, wallThick + 0.16, cx + ox, wallH + 1.15, zPos, false, 3);
      });
    }
  };

  const addWallSpanAlongZ = (zStart, zEnd, xPos, segCount) => {
    const totalD = zEnd - zStart;
    const segD = totalD / segCount;
    for (let i = 0; i < segCount; i++) {
      const cz = zStart + (i + 0.5) * segD;
      addTransparentWallSegment(wallThick, wallH, segD, xPos, wallH / 2, cz, false, 0);
      addTransparentWallSegment(wallThick + 0.4, 0.55, segD, xPos, wallH + 0.275, cz, true);
      const merlonOffsets = segD >= 9.0 ? [-segD * 0.3, 0, segD * 0.3] : [-segD * 0.25, segD * 0.25];
      merlonOffsets.forEach(oz => {
        addTransparentWallSegment(wallThick + 0.16, 1.2, 1.8, xPos, wallH + 1.15, cz + oz, false, 3);
      });
    }
  };

  const towerHalf = 3.4;
  const spanCountHalf = Math.max(2, Math.round((limit - towerHalf * 2) / 12.0));

  addWallSpanAlongX(-limit + towerHalf, -towerHalf, -limit, spanCountHalf);
  addWallSpanAlongX( towerHalf,  limit - towerHalf, -limit, spanCountHalf);

  addWallSpanAlongZ(-limit + towerHalf, -towerHalf, -limit, spanCountHalf);
  addWallSpanAlongZ( towerHalf,  limit - towerHalf, -limit, spanCountHalf);
  addWallSpanAlongZ(-limit + towerHalf, -towerHalf,  limit, spanCountHalf);
  addWallSpanAlongZ( towerHalf,  limit - towerHalf,  limit, spanCountHalf);

  if (withSouthGate) {
    const gateOuterX = 11.4;
    const southWingW = (limit - towerHalf) - gateOuterX;
    const southSegs = Math.max(2, Math.round(southWingW / 10.6));
    addWallSpanAlongX(-limit + towerHalf, -gateOuterX, limit, southSegs);
    addWallSpanAlongX( gateOuterX,  limit - towerHalf, limit, southSegs);

    const wingCenter = (limit + gateOuterX) / 2;
    const wingSolidW = limit - gateOuterX + 1.2;
    registerCitySolidBox(-wingCenter, limit, wingSolidW, wallThick + 0.4, wallH + 1.8, 0.25);
    registerCitySolidBox( wingCenter, limit, wingSolidW, wallThick + 0.4, wallH + 1.8, 0.25);
  } else {
    addWallSpanAlongX(-limit + towerHalf, -towerHalf, limit, spanCountHalf);
    addWallSpanAlongX( towerHalf,  limit - towerHalf, limit, spanCountHalf);
  }

  const towerCoords = [
    [-limit, -limit], [limit, -limit], [-limit, limit], [limit, limit],
    [-limit, 0], [limit, 0], [0, -limit]
  ];
  if (!withSouthGate) towerCoords.push([0, limit]);

  towerCoords.forEach(([tx, tz]) => {
    const tBodyH = wallH + 3.2;
    const tBody = createBox(6.8, tBodyH, 6.8, makeDetailedBuildingWallMat(3), tx, tBodyH / 2, tz);
    const tRoof = createBox(7.4, 0.7, 7.4, wallTrimMat.clone(), tx, tBodyH + 0.35, tz);
    worldGroup.add(tBody, tRoof);
    wallMeshes.push(tBody, tRoof);
  });

  for (let i = -limit + 16; i <= limit - 16; i += 24) {
    addWallTorch(i, 3.5, -limit + 2.0);
    if (!withSouthGate || Math.abs(i) > 14) addWallTorch(i, 3.5, limit - 2.0);
    addWallTorch(-limit + 2.0, 3.5, i);
    addWallTorch( limit - 2.0, 3.5, i);
  }

  if (withSouthGate) {
    const outGrassMat = new THREE.MeshLambertMaterial({ map: makeGrassFieldTex() });
    const highwayMat = new THREE.MeshLambertMaterial({ map: makeDavidCityStoneTex(2.2, 32) });
    const curbMat = matDavidCached('#94a3b8', '#64748b');

    const outerGround = createBox(limit * 3.0, 1.2, 130, outGrassMat, 0, -0.62, limit + 64, false);
    outerGround.receiveShadow = true;
    worldGroup.add(outerGround);

    const roadLen = 125;
    const roadCenterZ = limit + roadLen / 2 - 2;
    worldGroup.add(
      createBox(8.6, 0.08, roadLen, highwayMat, 0, 0.04, roadCenterZ, false),
      createBox(0.65, 0.22, roadLen, curbMat, -4.65, 0.11, roadCenterZ, false),
      createBox(0.65, 0.22, roadLen, curbMat,  4.65, 0.11, roadCenterZ, false)
    );

    for (let rz = limit + 12; rz <= limit + 108; rz += 16) {
      addPalmTree(-9.5, rz, 1.15, false);
      addPalmTree( 9.5, rz, 1.15, false);
      worldGroup.add(
        createBox(0.45, 1.6, 0.45, curbMat, -5.3, 0.8, rz, false),
        createBox(0.45, 1.6, 0.45, curbMat,  5.3, 0.8, rz, false)
      );
    }
  }
}

// -------------------------------------------------------------------------
// 4. 디테일한 인물(상인·건축가·경비병·왕궁 전령) & 신하 2명 & 하늘 원통 빛기둥 모델링
// -------------------------------------------------------------------------
function createNpcSkyBeacon(colorHex) {
  const beaconGrp = new THREE.Group();
  const cylGeo = new THREE.CylinderGeometry(0.95, 0.95, 62, 20, 1, true);
  const cylMat = new THREE.MeshBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: 0.26,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const outerCyl = new THREE.Mesh(cylGeo, cylMat);
  outerCyl.position.y = 31.0;

  const coreGeo = new THREE.CylinderGeometry(0.35, 0.35, 62, 12, 1, true);
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.38,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const innerCyl = new THREE.Mesh(coreGeo, coreMat);
  innerCyl.position.y = 31.0;

  beaconGrp.add(outerCyl, innerCyl);
  beaconGrp.userData = { outerCyl, innerCyl };
  return beaconGrp;
}

function createDetailedCityNpcMesh(roleId) {
  const g = new THREE.Group();
  const skin = matDavidCached('#fed7aa', '#fdba74');
  const darkSkin = matDavidCached('#f59e0b', '#d97706');
  const eyeWhite = matDavidCached('#ffffff');
  const pupilMat = matDavidCached('#0f172a');
  const sandalMat = matDavidCached('#451a03');
  const goldMat = matDavidCached('#facc15', '#ca8a04');

  let robePrimary, robeSecondary, sashMat, hairColor;
  if (roleId === 'merchant') {
    robePrimary = matDavidCached('#7e22ce', '#581c87');
    robeSecondary = matDavidCached('#f59e0b', '#d97706');
    sashMat = matDavidCached('#ef4444', '#b91c1c');
    hairColor = matDavidCached('#334155');
  } else if (roleId === 'architect') {
    robePrimary = matDavidCached('#0369a1', '#075985');
    robeSecondary = matDavidCached('#b45309', '#78350f');
    sashMat = matDavidCached('#fde047', '#ca8a04');
    hairColor = matDavidCached('#78350f');
  } else if (roleId === 'guard') {
    robePrimary = matDavidCached('#991b1b', '#7f1d1d');
    robeSecondary = matDavidCached('#d97706', '#92400e');
    sashMat = matDavidCached('#475569', '#1e293b');
    hairColor = matDavidCached('#1e293b');
  } else {
    robePrimary = matDavidCached('#1d4ed8', '#1e3a8a');
    robeSecondary = matDavidCached('#f8fafc', '#e2e8f0');
    sashMat = goldMat;
    hairColor = matDavidCached('#451a03');
  }

  const lLeg = new THREE.Group(); lLeg.position.set(-0.22, 0.7, 0);
  lLeg.add(
    createBox(0.32, 0.52, 0.32, skin, 0, -0.26, 0),
    createBox(0.36, 0.16, 0.42, sandalMat, 0, -0.60, 0.03)
  );
  const rLeg = new THREE.Group(); rLeg.position.set(0.22, 0.7, 0);
  rLeg.add(
    createBox(0.32, 0.52, 0.32, skin, 0, -0.26, 0),
    createBox(0.36, 0.16, 0.42, sandalMat, 0, -0.60, 0.03)
  );

  const torso = createBox(0.88, 1.08, 0.48, robePrimary, 0, 1.22, 0);
  const robeCoatL = createBox(0.28, 1.06, 0.54, robeSecondary, -0.29, 1.22, 0);
  const robeCoatR = createBox(0.28, 1.06, 0.54, robeSecondary,  0.29, 1.22, 0);
  const collar = createBox(0.62, 0.16, 0.54, goldMat, 0, 1.70, 0.02);
  const belt = createBox(0.94, 0.18, 0.56, sashMat, 0, 0.96, 0);
  const buckle = createBox(0.22, 0.20, 0.60, goldMat, 0, 0.96, 0);

  const head = createBox(0.76, 0.76, 0.76, skin, 0, 2.12, 0);
  const nose = createBox(0.12, 0.16, 0.12, darkSkin, 0, 2.08, 0.40);
  const lEyeW = createBox(0.18, 0.12, 0.05, eyeWhite, -0.18, 2.16, 0.38);
  const rEyeW = createBox(0.18, 0.12, 0.05, eyeWhite,  0.18, 2.16, 0.38);
  const lPupil = createBox(0.10, 0.10, 0.06, pupilMat, -0.16, 2.16, 0.39);
  const rPupil = createBox(0.10, 0.10, 0.06, pupilMat,  0.16, 2.16, 0.39);
  const lBrow = createBox(0.20, 0.06, 0.06, hairColor, -0.18, 2.26, 0.39);
  const rBrow = createBox(0.20, 0.06, 0.06, hairColor,  0.18, 2.26, 0.39);
  const beard = createBox(0.78, 0.28, 0.26, hairColor, 0, 1.84, 0.30);
  const mustache = createBox(0.46, 0.08, 0.12, hairColor, 0, 1.96, 0.39);

  g.add(
    lLeg, rLeg, torso, robeCoatL, robeCoatR, collar, belt, buckle,
    head, nose, lEyeW, rEyeW, lPupil, rPupil, lBrow, rBrow, beard, mustache
  );

  if (roleId === 'merchant') {
    g.add(
      createBox(0.92, 0.34, 0.92, matDavidCached('#fde047', '#eab308'), 0, 2.52, 0),
      createBox(0.78, 0.22, 0.78, matDavidCached('#9333ea'), 0, 2.74, 0),
      createBox(0.18, 0.22, 0.14, matDavidCached('#ef4444'), 0, 2.58, 0.45),
      createBox(0.42, 0.38, 0.26, matDavidCached('#d97706'), -0.44, 0.88, 0.18)
    );
  } else if (roleId === 'architect') {
    g.add(
      createBox(0.86, 0.26, 0.86, matDavidCached('#f8fafc', '#cbd5e1'), 0, 2.50, 0),
      createBox(0.90, 0.10, 0.90, matDavidCached('#0284c7'), 0, 2.40, 0),
      createBox(0.56, 0.58, 0.08, robeSecondary, 0, 0.95, 0.28)
    );
  } else if (roleId === 'guard') {
    g.add(
      createBox(0.88, 0.32, 0.88, goldMat, 0, 2.50, 0),
      createBox(0.14, 0.36, 0.86, goldMat, -0.40, 2.22, 0),
      createBox(0.14, 0.36, 0.86, goldMat,  0.40, 2.22, 0),
      createBox(0.18, 0.42, 0.58, matDavidCached('#ef4444', '#b91c1c'), 0, 2.82, 0),
      createBox(0.96, 1.15, 0.12, matDavidCached('#7f1d1d'), 0, 1.18, -0.28)
    );
  } else {
    g.add(
      createBox(0.86, 0.24, 0.86, matDavidCached('#1e3a8a'), 0, 2.50, 0),
      createBox(0.90, 0.14, 0.90, goldMat, 0, 2.42, 0),
      createBox(0.16, 0.36, 0.16, matDavidCached('#38bdf8'), 0, 2.72, 0.36)
    );
  }

  const lArm = new THREE.Group(); lArm.position.set(-0.60, 1.56, 0);
  lArm.add(createBox(0.30, 0.66, 0.30, robePrimary, 0, -0.28, 0), createBox(0.24, 0.20, 0.24, skin, 0, -0.68, 0));

  const rArm = new THREE.Group(); rArm.position.set(0.60, 1.56, 0);
  rArm.add(createBox(0.30, 0.66, 0.30, robePrimary, 0, -0.28, 0), createBox(0.24, 0.20, 0.24, skin, 0, -0.68, 0));

  if (roleId === 'merchant') {
    rArm.add(
      createBox(0.08, 0.42, 0.08, goldMat, 0, -0.68, 0.30, false),
      createBox(0.46, 0.06, 0.06, goldMat, 0, -0.48, 0.30, false),
      createBox(0.16, 0.06, 0.16, goldMat, -0.20, -0.65, 0.30, false),
      createBox(0.16, 0.06, 0.16, goldMat,  0.20, -0.65, 0.30, false)
    );
  } else if (roleId === 'architect') {
    lArm.add(createBox(0.42, 0.16, 0.16, matDavidCached('#fef9c3', '#fde047'), 0, -0.68, 0.26, false));
    rArm.add(
      createBox(0.08, 0.48, 0.08, goldMat, 0, -0.65, 0.28, false),
      createBox(0.32, 0.08, 0.08, goldMat, -0.12, -0.85, 0.28, false)
    );
  } else if (roleId === 'guard') {
    lArm.add(
      createBox(0.62, 0.88, 0.12, goldMat, -0.14, -0.35, 0.26),
      createBox(0.46, 0.70, 0.14, matDavidCached('#991b1b'), -0.14, -0.35, 0.28)
    );
    rArm.add(
      createBox(0.10, 2.35, 0.10, sandalMat, 0.05, 0.15, 0.28),
      createBox(0.22, 0.48, 0.10, matDavidCached('#cbd5e1', '#64748b'), 0.05, 1.42, 0.28)
    );
  } else {
    rArm.add(
      createBox(0.10, 0.10, 0.55, goldMat, 0, -0.68, 0.36, false),
      createBox(0.24, 0.24, 0.14, goldMat, 0, -0.68, 0.65, false)
    );
  }

  g.add(lArm, rArm);
  g.userData = { lLeg, rLeg, lArm, rArm };
  return g;
}

function createDavidRetainerMesh(retainerIdx) {
  const g = new THREE.Group();
  const isFirst = (retainerIdx === 0);
  const tunicMat = isFirst ? matDavidCached('#f8fafc', '#e2e8f0') : matDavidCached('#eff6ff', '#dbeafe');
  const cloakMat = isFirst ? matDavidCached('#0284c7', '#0369a1') : matDavidCached('#059669', '#047857');
  const goldMat = matDavidCached('#facc15', '#ca8a04');
  const skin = matDavidCached('#fed7aa', '#fdba74');
  const hairMat = matDavidCached('#451a03');
  const eyeWhite = matDavidCached('#ffffff');
  const eyeMat = matDavidCached('#0f172a');

  const lLeg = new THREE.Group(); lLeg.position.set(-0.20, 0.68, 0);
  lLeg.add(createBox(0.30, 0.52, 0.30, skin, 0, -0.26, 0), createBox(0.34, 0.15, 0.38, hairMat, 0, -0.58, 0.02));
  const rLeg = new THREE.Group(); rLeg.position.set(0.20, 0.68, 0);
  rLeg.add(createBox(0.30, 0.52, 0.30, skin, 0, -0.26, 0), createBox(0.34, 0.15, 0.38, hairMat, 0, -0.58, 0.02));

  const torso = createBox(0.82, 1.00, 0.46, tunicMat, 0, 1.16, 0);
  const sash = createBox(0.32, 1.02, 0.50, cloakMat, isFirst ? -0.22 : 0.22, 1.16, 0);
  const belt = createBox(0.86, 0.14, 0.50, goldMat, 0, 0.92, 0);

  const head = createBox(0.70, 0.70, 0.70, skin, 0, 2.02, 0);
  const hair = createBox(0.76, 0.26, 0.76, hairMat, 0, 2.34, 0);
  const headband = createBox(0.78, 0.10, 0.78, goldMat, 0, 2.24, 0);
  const lEyeW = createBox(0.16, 0.11, 0.04, eyeWhite, -0.15, 2.06, 0.35);
  const rEyeW = createBox(0.16, 0.11, 0.04, eyeWhite,  0.15, 2.06, 0.35);
  const lEye = createBox(0.09, 0.09, 0.05, eyeMat, -0.15, 2.06, 0.36);
  const rEye = createBox(0.09, 0.09, 0.05, eyeMat,  0.15, 2.06, 0.36);

  const lArm = new THREE.Group(); lArm.position.set(-0.54, 1.50, 0);
  lArm.add(createBox(0.26, 0.62, 0.26, tunicMat, 0, -0.26, 0), createBox(0.22, 0.18, 0.22, skin, 0, -0.62, 0));

  const rArm = new THREE.Group(); rArm.position.set(0.54, 1.50, 0);
  rArm.add(createBox(0.26, 0.62, 0.26, tunicMat, 0, -0.26, 0), createBox(0.22, 0.18, 0.22, skin, 0, -0.62, 0));

  const packGroup = new THREE.Group();
  packGroup.position.set(0, 1.18, -0.42);
  g.add(packGroup);

  g.add(lLeg, rLeg, torso, sash, belt, head, hair, headband, lEyeW, rEyeW, lEye, rEye, lArm, rArm);
  g.userData = { lLeg, rLeg, lArm, rArm, packGroup };
  return g;
}

// -------------------------------------------------------------------------
// 5. 벽돌·회벽 질감과 서까래·창틀 디테일이 적용된 다윗성 건축물 빌더
// -------------------------------------------------------------------------
function buildDavidCityPalace(cx, cz) {
  const cedarMat = matVoxel('#78350f', '#451a03');
  const goldMat = matDavidCached('#facc15', '#ca8a04');
  const colMat = matVoxel('#f8fafc', '#cbd5e1');

  const base = createBox(20, 1.2, 14, makeDetailedBuildingWallMat(3), cx, 0.6, cz);
  const mainHall = createBox(18, 6.4, 11, makeDetailedBuildingWallMat(0), cx, 4.4, cz);
  const cedarRoof = createBox(19.2, 0.9, 12.2, cedarMat.clone(), cx, 8.05, cz);
  const upperTower = createBox(10, 4.1, 7, makeDetailedBuildingWallMat(2), cx, 10.55, cz - 1.0);
  const crownRoof = createBox(11.0, 0.7, 8.0, goldMat, cx, 12.95, cz - 1.0);
  worldGroup.add(base, mainHall, cedarRoof, upperTower, crownRoof);
  wallMeshes.push(mainHall, cedarRoof, upperTower);

  [-6.5, -2.5, 2.5, 6.5].forEach(ox => {
    const col = createBox(1.1, 6.4, 1.1, colMat.clone(), cx + ox, 4.4, cz + 6.2);
    worldGroup.add(col);
    wallMeshes.push(col);
  });
  addWallTorch(cx - 4.5, 3.2, cz + 6.85);
  addWallTorch(cx + 4.5, 3.2, cz + 6.85);

  registerCitySolidBox(cx, cz, 20.0, 14.0, 12.5, 0.35);
}

function buildDavidCityTabernacle(cx, cz) {
  const tentWhite = matVoxel('#f8fafc', '#e2e8f0').clone();
  const tentBlue = matVoxel('#1d4ed8', '#1e3a8a').clone();
  const tentPurple = matVoxel('#7e22ce', '#581c87').clone();
  const goldMat = matDavidCached('#facc15', '#ca8a04');

  const platform = createBox(16, 0.8, 12, matDavidCached('#cbd5e1', '#94a3b8'), cx, 0.4, cz);
  const tentBody = createBox(12, 5.1, 8.5, tentWhite, cx, 3.35, cz);
  const roofBlue = createBox(12.8, 0.8, 9.2, tentBlue, cx, 6.3, cz);
  const roofTop = createBox(10.5, 0.7, 7.5, tentPurple, cx, 7.05, cz);
  worldGroup.add(platform, tentBody, roofBlue, roofTop);
  wallMeshes.push(tentBody, roofBlue, roofTop);

  const arkBox = createBox(2.2, 1.3, 1.3, goldMat, cx, 1.45, cz + 3.2);
  const cherubL = createBox(0.5, 0.7, 0.5, goldMat, cx - 0.65, 2.45, cz + 3.2);
  const cherubR = createBox(0.5, 0.7, 0.5, goldMat, cx + 0.65, 2.45, cz + 3.2);
  worldGroup.add(arkBox, cherubL, cherubR);
  addWallTorch(cx - 4.8, 2.5, cz + 5.2);
  addWallTorch(cx + 4.8, 2.5, cz + 5.2);

  registerCitySolidBox(cx, cz - 0.3, 12.6, 9.0, 7.2, 0.35);
}

function buildClimbableTwoStoryHouse(cx, cz, stairSide = 'east', colorVariant = 0) {
  const wallMat = makeDetailedBuildingWallMat(colorVariant);
  const trimMat = matVoxel('#92400e', '#5c2d0c').clone();
  const stairMat = matVoxel('#cbd5e1', '#64748b').clone();
  const awningMat = matVoxel(colorVariant % 2 === 0 ? '#0284c7' : '#16a34a', '#0f172a').clone();
  const frameMat = matDavidCached('#78350f', '#451a03');
  const winMat = matDavidCached('#1e293b');

  const w = 9.0, h1 = 3.6, d = 7.4;
  const body1FH = 3.30;
  const slabH = 0.30;

  const body1F = createBox(w, body1FH, d, wallMat, cx, body1FH / 2, cz);
  const slab2F = createBox(w + 0.36, slabH, d + 0.36, trimMat, cx, body1FH + slabH / 2, cz);
  const zFront = cz + d / 2;
  const door1F = createBox(1.6, 2.3, 0.10, trimMat, cx, 1.15, zFront + 0.06);
  const lintel1F = createBox(2.1, 0.24, 0.16, frameMat, cx, 2.44, zFront + 0.09);
  worldGroup.add(body1F, slab2F, door1F, lintel1F);
  wallMeshes.push(body1F, slab2F);

  [-2.6, 2.6].forEach(ox => {
    worldGroup.add(
      createBox(1.3, 1.2, 0.08, frameMat, cx + ox, 2.05, zFront + 0.05),
      createBox(0.95, 0.90, 0.05, winMat, cx + ox, 2.05, zFront + 0.12)
    );
  });
  for (let bx = -w / 2 + 0.9; bx <= w / 2 - 0.9; bx += 1.8) {
    worldGroup.add(createBox(0.22, 0.20, d + 0.64, frameMat, cx + bx, body1FH - 0.14, cz));
  }

  platforms.push({
    minX: cx - w / 2 - 0.25,
    maxX: cx + w / 2 + 0.25,
    minZ: cz - d / 2 - 0.25,
    maxZ: cz + d / 2 + 0.25,
    topY: h1
  });
  davidCityBuildingBoxes.push({
    minX: cx - w / 2 - 0.25,
    maxX: cx + w / 2 + 0.25,
    minZ: cz - d / 2 - 0.25,
    maxZ: cz + d / 2 + 0.25,
    topY: h1
  });

  const roomW = 3.6, roomH = 2.6, roomD = 4.0;
  const roomX = cx + (stairSide === 'east' ? -2.2 : 2.2);
  const roomZ = cz - 1.2;
  const body2F = createBox(roomW, roomH, roomD, makeDetailedBuildingWallMat(colorVariant + 1), roomX, h1 + roomH / 2, roomZ);
  const roof2F = createBox(roomW + 0.4, 0.36, roomD + 0.4, awningMat, roomX, h1 + roomH + 0.18, roomZ);
  worldGroup.add(body2F, roof2F);
  wallMeshes.push(body2F, roof2F);
  registerCitySolidBox(roomX, roomZ, roomW, roomD, h1 + roomH, 0.20);

  const dir = (stairSide === 'east') ? 1 : -1;
  const stairW = 2.4;
  const stairX = cx + dir * (w / 2 + stairW / 2 + 0.02);
  const stepDepth = 1.20;
  const startZ = cz + d / 2 - 0.60;

  for (let s = 1; s <= 6; s++) {
    const stepTopY = s * 0.6;
    const sz = startZ - (s - 1) * stepDepth;
    const visualH = (s === 6) ? (stepTopY - 0.02) : stepTopY;
    const stepBox = createBox(stairW, visualH, stepDepth, stairMat.clone(), stairX, visualH / 2, sz);
    worldGroup.add(stepBox);
    wallMeshes.push(stepBox);

    const pMinX = Math.min(stairX - stairW / 2 - 0.15, cx + dir * (w / 2 - 0.3));
    const pMaxX = Math.max(stairX + stairW / 2 + 0.15, cx + dir * (w / 2 - 0.3));
    platforms.push({
      minX: pMinX,
      maxX: pMaxX,
      minZ: sz - stepDepth * 0.60,
      maxZ: sz + stepDepth * 0.60,
      topY: stepTopY
    });
  }
}

function buildOpenShopBuildingWithKeeper(cx, cz, w, d, facing = 'south', shopType = 'fruit', idx = 0) {
  const woodMat = matVoxel('#78350f', '#451a03');
  const awningCol1 = (shopType === 'fruit') ? '#16a34a' : (shopType === 'pottery' ? '#ea580c' : (shopType === 'cloth' ? '#9333ea' : '#0284c7'));
  const awningMat = matVoxel(awningCol1, '#0f172a').clone();
  const h = 4.5;

  const isNS = (facing === 'south' || facing === 'north');
  const fSign = (facing === 'south' || facing === 'east') ? 1 : -1;

  const roofBox = createBox(w + 0.4, 0.55, d + 0.4, woodMat.clone(), cx, h + 0.275, cz);
  const signAwning = createBox(
    isNS ? w + 0.5 : 1.7,
    0.42,
    isNS ? 1.7 : d + 0.5,
    awningMat,
    cx + (isNS ? 0 : fSign * (w / 2 + 0.88)),
    h - 0.35,
    cz + (isNS ? fSign * (d / 2 + 0.88) : 0)
  );
  worldGroup.add(roofBox, signAwning);
  wallMeshes.push(roofBox, signAwning);

  if (isNS) {
    const backWall = createBox(w - 1.6, h, 0.8, makeDetailedBuildingWallMat(idx), cx, h / 2, cz - fSign * (d / 2 - 0.4));
    const sideL = createBox(0.8, h, d, makeDetailedBuildingWallMat(idx), cx - w / 2 + 0.4, h / 2, cz);
    const sideR = createBox(0.8, h, d, makeDetailedBuildingWallMat(idx), cx + w / 2 - 0.4, h / 2, cz);
    const counter = createBox(w - 2.0, 1.15, 1.1, woodMat.clone(), cx, 0.58, cz + fSign * (d / 2 - 1.3));
    worldGroup.add(backWall, sideL, sideR, counter);
    wallMeshes.push(backWall, sideL, sideR);

    const itemCols = ['#ef4444', '#facc15', '#22c55e', '#a855f7'];
    [-1.8, 0, 1.8].forEach((ox, i) => {
      worldGroup.add(createBox(0.75, 0.48, 0.65, matDavidCached(itemCols[(idx + i) % itemCols.length]), cx + ox, 1.40, cz + fSign * (d / 2 - 1.3)));
    });

    const keeper = createDetailedCityNpcMesh(idx % 2 === 0 ? 'merchant' : 'architect');
    keeper.position.set(cx, 0, cz - fSign * 0.4);
    keeper.rotation.y = (fSign === 1) ? 0 : Math.PI;
    worldGroup.add(keeper);
    davidCityShopkeepers.push({ mesh: keeper, phase: idx * 1.1 });
  } else {
    const backWall = createBox(0.8, h, d - 1.6, makeDetailedBuildingWallMat(idx), cx - fSign * (w / 2 - 0.4), h / 2, cz);
    const sideN = createBox(w, h, 0.8, makeDetailedBuildingWallMat(idx), cx, h / 2, cz - d / 2 + 0.4);
    const sideS = createBox(w, h, 0.8, makeDetailedBuildingWallMat(idx), cx, h / 2, cz + d / 2 - 0.4);
    const counter = createBox(1.1, 1.15, d - 2.0, woodMat.clone(), cx + fSign * (w / 2 - 1.3), 0.58, cz);
    worldGroup.add(backWall, sideN, sideS, counter);
    wallMeshes.push(backWall, sideN, sideS);

    const itemCols = ['#f97316', '#38bdf8', '#fde047', '#ec4899'];
    [-1.8, 0, 1.8].forEach((oz, i) => {
      worldGroup.add(createBox(0.65, 0.48, 0.75, matDavidCached(itemCols[(idx + i) % itemCols.length]), cx + fSign * (w / 2 - 1.3), 1.40, cz + oz));
    });

    const keeper = createDetailedCityNpcMesh(idx % 2 === 0 ? 'merchant' : 'architect');
    keeper.position.set(cx - fSign * 0.4, 0, cz);
    keeper.rotation.y = (fSign === 1) ? (Math.PI / 2) : (-Math.PI / 2);
    worldGroup.add(keeper);
    davidCityShopkeepers.push({ mesh: keeper, phase: idx * 1.1 });
  }

  registerCitySolidBox(cx, cz, w, d, h + 0.4, 0.30);
}

function buildSolidCityBuildingBlock(cx, cz, w, h, d, variant = 0) {
  const wallMat = makeDetailedBuildingWallMat(variant);
  const roofMat = matVoxel('#92400e', '#5c2d0c').clone();
  const beamMat = matDavidCached('#78350f', '#451a03');
  const winFrameMat = matDavidCached('#b45309', '#78350f');
  const winMat = matDavidCached('#1e293b');
  const doorMat = matDavidCached('#451a03');
  const stoneQuoinMat = matDavidCached('#d6d3d1', '#a8a29e');

  const plinthH = 0.36;
  const bodyH = Math.max(1.0, h - plinthH);
  const plinth = createBox(w + 0.22, plinthH, d + 0.22, stoneQuoinMat, cx, plinthH / 2, cz);
  const body = createBox(w, bodyH, d, wallMat, cx, plinthH + bodyH / 2, cz);
  const roof = createBox(w + 0.45, 0.45, d + 0.45, roofMat, cx, h + 0.225, cz);
  worldGroup.add(plinth, body, roof);
  wallMeshes.push(body, roof);

  if (w >= d) {
    const count = Math.max(1, Math.floor(w / 7.5));
    const zFront = cz + d / 2;
    const zBack = cz - d / 2;
    for (let i = 0; i < count; i++) {
      const ox = -w / 2 + (i + 0.5) * (w / count);
      worldGroup.add(
        createBox(1.4, 2.0, 0.10, doorMat, cx + ox, plinthH + 1.0, zFront + 0.06),
        createBox(1.8, 0.22, 0.16, beamMat, cx + ox, plinthH + 2.12, zFront + 0.09),
        createBox(1.35, 1.30, 0.08, winFrameMat, cx + ox + 1.85, 2.65, zFront + 0.05),
        createBox(1.05, 1.00, 0.05, winMat, cx + ox + 1.85, 2.65, zFront + 0.12),
        createBox(1.35, 1.30, 0.08, winFrameMat, cx + ox - 1.85, 2.65, zBack - 0.05),
        createBox(1.05, 1.00, 0.05, winMat, cx + ox - 1.85, 2.65, zBack - 0.12)
      );
    }
    for (let bx = -w / 2 + 1.2; bx <= w / 2 - 1.2; bx += 2.6) {
      worldGroup.add(createBox(0.22, 0.20, d + 0.68, beamMat, cx + bx, h - 0.16, cz));
    }
  } else {
    const count = Math.max(1, Math.floor(d / 7.5));
    const xFront = cx + w / 2;
    const xBack = cx - w / 2;
    for (let i = 0; i < count; i++) {
      const oz = -d / 2 + (i + 0.5) * (d / count);
      worldGroup.add(
        createBox(0.10, 2.0, 1.4, doorMat, xFront + 0.06, plinthH + 1.0, cz + oz),
        createBox(0.16, 0.22, 1.8, beamMat, xFront + 0.09, plinthH + 2.12, cz + oz),
        createBox(0.08, 1.30, 1.35, winFrameMat, xFront + 0.05, 2.65, cz + oz + 1.85),
        createBox(0.05, 1.00, 1.05, winMat, xFront + 0.12, 2.65, cz + oz + 1.85),
        createBox(0.08, 1.30, 1.35, winFrameMat, xBack - 0.05, 2.65, cz + oz - 1.85),
        createBox(0.05, 1.00, 1.05, winMat, xBack - 0.12, 2.65, cz + oz - 1.85)
      );
    }
    for (let bz = -d / 2 + 1.2; bz <= d / 2 - 1.2; bz += 2.6) {
      worldGroup.add(createBox(w + 0.68, 0.20, 0.22, beamMat, cx, h - 0.16, cz + bz));
    }
  }

  registerCitySolidBox(cx, cz, w, d, h + 0.4, 0.30);
}

function buildDenseMazeCityAndStreets() {
  davidCityShopkeepers = [];
  davidCityPedestrians = [];

  const twoStorySpecs = [
    { x: -42, z: -26, side: 'east', var: 0 },
    { x: -42, z:  22, side: 'east', var: 1 },
    { x:  42, z: -26, side: 'west', var: 0 },
    { x:  42, z:  22, side: 'west', var: 1 },
    { x: -20, z: -34, side: 'east', var: 1 },
    { x:  20, z:  30, side: 'west', var: 0 },
    { x: -54, z: -48, side: 'east', var: 2 },
    { x:  54, z:  48, side: 'west', var: 3 }
  ];
  twoStorySpecs.forEach(sp => {
    buildClimbableTwoStoryHouse(sp.x, sp.z, sp.side, sp.var);
  });

  const shopSpecs = [
    { x: -17, z:  18, w: 8.5, d: 6.5, facing: 'north', type: 'fruit' },
    { x:  17, z:  18, w: 8.5, d: 6.5, facing: 'north', type: 'pottery' },
    { x: -18, z:  -2, w: 8.5, d: 6.5, facing: 'south', type: 'cloth' },
    { x:  18, z:  -2, w: 8.5, d: 6.5, facing: 'south', type: 'bakery' },
    { x: -32, z:  -2, w: 8.0, d: 6.5, facing: 'south', type: 'fruit' },
    { x:  32, z:  -2, w: 8.0, d: 6.5, facing: 'south', type: 'pottery' },
    { x: -46, z:  36, w: 8.5, d: 6.5, facing: 'north', type: 'cloth' },
    { x:  46, z: -38, w: 8.5, d: 6.5, facing: 'south', type: 'bakery' }
  ];
  shopSpecs.forEach((sh, idx) => {
    buildOpenShopBuildingWithKeeper(sh.x, sh.z, sh.w, sh.d, sh.facing, sh.type, idx);
  });

  const cityMazeBlocks = [
    { x: -60,   z: -26.5, w: 7.5, h: 4.9, d: 27.0, v: 0 },
    { x: -36,   z: -60,   w: 28.0, h: 4.8, d: 7.5, v: 1 },
    { x: -36,   z: -48,   w: 20.0, h: 4.6, d: 7.5, v: 2 },
    { x: -28.6, z: -35.2, w: 6.4, h: 4.5, d: 14.5, v: 3 },
    { x: -30,   z: -15,   w: 15.0, h: 4.7, d: 7.5, v: 0 },
    { x: -58,   z:  -3.5, w: 8.5, h: 4.7, d: 13.0, v: 1 },
    { x: -16,   z: -20,   w: 7.5, h: 4.8, d: 14.0, v: 2 },
    { x: -15.0, z: -56,   w: 10.0, h: 4.7, d: 7.5, v: 0 },

    { x:  60,   z: -26.5, w: 7.5, h: 4.9, d: 27.0, v: 1 },
    { x:  36,   z: -60,   w: 28.0, h: 4.8, d: 7.5, v: 0 },
    { x:  34,   z: -48,   w: 18.0, h: 4.6, d: 7.5, v: 3 },
    { x:  28.6, z: -35.2, w: 6.4, h: 4.5, d: 14.5, v: 2 },
    { x:  30,   z: -15,   w: 15.0, h: 4.7, d: 7.5, v: 1 },
    { x:  58,   z:  -3.5, w: 8.5, h: 4.7, d: 13.0, v: 0 },
    { x:  16,   z: -20,   w: 7.5, h: 4.8, d: 14.0, v: 3 },
    { x:  19.5, z: -34,   w: 7.6, h: 4.6, d: 7.5, v: 2 },
    { x:  15.0, z: -56,   w: 10.0, h: 4.7, d: 7.5, v: 1 },

    { x: -60,   z:  16,   w: 7.5, h: 4.8, d: 22.0, v: 2 },
    { x: -42,   z:   8,   w: 8.5, h: 4.5, d: 12.0, v: 0 },
    { x: -60,   z:  46,   w: 7.5, h: 4.8, d: 24.0, v: 1 },
    { x: -40,   z:  60,   w: 28.0, h: 4.8, d: 7.5, v: 3 },
    { x: -34,   z:  48,   w: 18.0, h: 4.6, d: 7.5, v: 0 },
    { x: -29,   z:  32,   w: 8.0, h: 4.6, d: 18.0, v: 2 },
    { x: -17,   z:  31,   w: 9.0, h: 4.5, d: 12.0, v: 1 },
    { x: -18,   z:  46,   w: 10.0, h: 4.8, d: 7.5, v: 3 },
    { x: -18,   z:  59,   w: 10.0, h: 4.8, d: 7.5, v: 0 },

    { x:  60,   z:  16,   w: 7.5, h: 4.8, d: 22.0, v: 3 },
    { x:  42,   z:   8,   w: 8.5, h: 4.5, d: 12.0, v: 1 },
    { x:  61.2, z:  38.0, w: 5.2, h: 4.8, d: 11.0, v: 0 },
    { x:  40,   z:  60,   w: 28.0, h: 4.8, d: 7.5, v: 2 },
    { x:  34,   z:  48,   w: 18.0, h: 4.6, d: 7.5, v: 1 },
    { x:  31,   z:  33.0, w: 8.0, h: 4.6, d: 16.0, v: 3 },
    { x:  30,   z:  19.5, w: 10.0, h: 4.5, d: 7.0, v: 0 },
    { x:  18,   z:  46,   w: 10.0, h: 4.8, d: 7.5, v: 2 },
    { x:  18,   z:  59,   w: 10.0, h: 4.8, d: 7.5, v: 1 }
  ];

  cityMazeBlocks.forEach(b => {
    buildSolidCityBuildingBlock(b.x, b.z, b.w, b.h, b.d, b.v);
  });

  [
    [-59.0, -11.5, 9.0, 3.8],
    [ 59.0, -11.5, 9.0, 3.8],
    [-21.0, -58.0, 3.6, 8.5],
    [ 21.0, -58.0, 3.6, 8.5],
    [-28.6, -43.5, 7.2, 3.2],
    [ 28.6, -43.5, 7.2, 3.2],
    [-25.0, -34.5, 3.2, 10.0],
    [ 24.5, -34.5, 3.6, 8.5],
    [ 30.5,  24.0, 9.5, 3.4],
    [ 59.0,  44.5, 6.5, 4.0]
  ].forEach(([jx, jz, jw, jd]) => {
    registerCitySolidBox(jx, jz, jw, jd, 5.0, 0.25);
  });

  const plazaCanvas = document.createElement('canvas');
  plazaCanvas.width = 256;
  plazaCanvas.height = 256;
  const pCtx = plazaCanvas.getContext('2d');
  pCtx.fillStyle = '#e7dac2';
  pCtx.fillRect(0, 0, 256, 256);

  const tileN = 8;
  const tileSz = 256 / tileN;
  for (let r = 0; r < tileN; r++) {
    for (let c = 0; c < tileN; c++) {
      const isEdge = (r === 0 || r === tileN - 1 || c === 0 || c === tileN - 1);
      const isInnerFrame = (r === 1 || r === tileN - 2 || c === 1 || c === tileN - 2);
      pCtx.fillStyle = isEdge ? '#c9b38c' : (isInnerFrame ? '#d8c5a3' : ((r + c) % 2 === 0 ? '#ede2ce' : '#e2d4ba'));
      pCtx.fillRect(c * tileSz + 2, r * tileSz + 2, tileSz - 4, tileSz - 4);
      pCtx.strokeStyle = '#8c7656';
      pCtx.lineWidth = 2;
      pCtx.strokeRect(c * tileSz + 1, r * tileSz + 1, tileSz - 2, tileSz - 2);
    }
  }
  pCtx.strokeStyle = '#92400e';
  pCtx.lineWidth = 4;
  pCtx.strokeRect(6, 6, 244, 244);
  pCtx.strokeRect(34, 34, 188, 188);

  const plazaTex = new THREE.CanvasTexture(plazaCanvas);
  plazaTex.magFilter = THREE.NearestFilter;
  const plazaFloorMat = new THREE.MeshLambertMaterial({
    map: plazaTex,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1
  });
  const plazaBorderMat = matDavidCached('#d6c5a5', '#9c8665');
  const plazaPodiumMat = matDavidCached('#cbd5e1', '#94a3b8');

  const plazaSize = 18.0;
  const plazaCenterZ = 6.2;
  const plazaMainSlab = createBox(plazaSize, 0.05, plazaSize, plazaFloorMat, 0, 0.035, plazaCenterZ, false);
  plazaMainSlab.receiveShadow = true;

  const heraldApronSlab = createBox(8.4, 0.05, 4.0, plazaFloorMat, 0, 0.035, -4.8, false);
  heraldApronSlab.receiveShadow = true;

  const wellSquareBase1 = createBox(7.6, 0.08, 7.6, plazaBorderMat, 0, 0.10, 8.0, false);
  const wellSquareBase2 = createBox(5.4, 0.08, 5.4, plazaPodiumMat, 0, 0.18, 8.0, false);

  const rimS = createBox(plazaSize + 0.9, 0.06, 0.45, plazaBorderMat, 0, 0.09, plazaCenterZ + plazaSize / 2 + 0.225, false);
  const rimW = createBox(0.45, 0.06, plazaSize, plazaBorderMat, -plazaSize / 2 - 0.225, 0.09, plazaCenterZ, false);
  const rimE = createBox(0.45, 0.06, plazaSize, plazaBorderMat,  plazaSize / 2 + 0.225, 0.09, plazaCenterZ, false);
  const rimNL = createBox(5.25, 0.06, 0.45, plazaBorderMat, -6.825, 0.09, -3.025, false);
  const rimNR = createBox(5.25, 0.06, 0.45, plazaBorderMat,  6.825, 0.09, -3.025, false);
  const apronRimW = createBox(0.45, 0.06, 3.55, plazaBorderMat, -4.425, 0.09, -5.025, false);
  const apronRimE = createBox(0.45, 0.06, 3.55, plazaBorderMat,  4.425, 0.09, -5.025, false);
  const apronRimN = createBox(9.30, 0.06, 0.45, plazaBorderMat,  0,     0.09, -7.025, false);

  worldGroup.add(
    plazaMainSlab, heraldApronSlab, wellSquareBase1, wellSquareBase2,
    rimS, rimW, rimE, rimNL, rimNR, apronRimW, apronRimE, apronRimN
  );

  const wellMat = matDavidCached('#94a3b8', '#64748b');
  const woodMat = matDavidCached('#451a03');
  worldGroup.add(
    createBox(3.4, 1.0, 3.4, wellMat, 0, 0.72, 8),
    createBox(2.4, 0.08, 2.4, new THREE.MeshBasicMaterial({ color: 0x0284c7 }), 0, 1.26, 8, false),
    createBox(0.28, 2.2, 0.28, woodMat, -1.3, 2.32, 8),
    createBox(0.28, 2.2, 0.28, woodMat,  1.3, 2.32, 8),
    createBox(3.4, 0.35, 1.4, woodMat, 0, 3.55, 8)
  );
  registerCitySolidBox(0, 8, 3.6, 3.6, 3.6, 0.35);

  const pedestrianRoutes = [
    { x1: -11,  z1:   2.8, x2:  11,  z2:   2.8, spd: 2.2 },
    { x1:  11,  z1:  12.5, x2: -11,  z2:  12.5, spd: 2.1 },
    { x1:  -3.2, z1: 14,   x2:  -3.2, z2: 52,   spd: 2.4 },
    { x1:   3.2, z1: 52,   x2:   3.2, z2: 14,   spd: 2.2 },
    { x1: -48,  z1:  -8.2, x2: -22,  z2:  -8.2, spd: 2.0 },
    { x1:  22,  z1:  -8.2, x2:  48,  z2:  -8.2, spd: 2.1 },
    { x1: -50.5, z1: -36,  x2: -50.5, z2: -8,   spd: 2.2 },
    { x1:  50.5, z1: -36,  x2:  50.5, z2: -8,   spd: 2.2 },
    { x1: -23.2, z1:  16,  x2: -23.2, z2: 40,   spd: 2.3 },
    { x1:  50.5, z1:   6,  x2:  50.5, z2: 38,   spd: 2.1 },
    { x1: -46,  z1:  54,   x2: -25,  z2:  54,   spd: 2.0 },
    { x1:  25,  z1:  54,   x2:  46,  z2:  54,   spd: 2.0 },
    { x1: -46,  z1: -54,   x2: -24,  z2: -54,   spd: 2.1 },
    { x1:  24,  z1: -54,   x2:  46,  z2: -54,   spd: 2.1 }
  ];

  pedestrianRoutes.forEach((rt, idx) => {
    const pedMesh = (typeof createFollowerPersonMesh === 'function')
      ? createFollowerPersonMesh(idx)
      : createDetailedCityNpcMesh(idx % 2 === 0 ? 'merchant' : 'architect');
    pedMesh.position.set(rt.x1, 0, rt.z1);
    worldGroup.add(pedMesh);
    davidCityPedestrians.push({
      mesh: pedMesh,
      x1: rt.x1, z1: rt.z1,
      x2: rt.x2, z2: rt.z2,
      targetX: rt.x2, targetZ: rt.z2,
      forward: true,
      speed: rt.spd,
      heading: Math.atan2(rt.x2 - rt.x1, rt.z2 - rt.z1),
      phase: idx * 0.8
    });
  });
}

function buildQuestBuildableStructures(mapLimit = 68) {
  const marketRoot = new THREE.Group();
  marketRoot.position.set(-28, 0, 8);
  const basePad = createBox(8.5, 0.20, 6.0, matDavidCached('#d9a05b', '#92400e'), 0, 0.10, 0, false);
  const unfinishedFrame = createBox(8.2, 0.16, 5.8, new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35 }), 0, 0.28, 0, false);
  const completedMarket = new THREE.Group();
  const woodMat = matDavidCached('#78350f', '#451a03');
  const awning1 = matVoxel('#ef4444', '#b91c1c').clone();
  const awning2 = matVoxel('#fef08a', '#eab308').clone();
  completedMarket.add(
    createBox(8.2, 3.6, 0.7, makeDetailedBuildingWallMat(0), 0, 2.0, -2.5),
    createBox(0.45, 3.6, 0.45, woodMat, -3.6, 2.0, -1.9),
    createBox(0.45, 3.6, 0.45, woodMat,  3.6, 2.0, -1.9),
    createBox(0.45, 3.6, 0.45, woodMat, -3.6, 2.0,  2.4),
    createBox(0.45, 3.6, 0.45, woodMat,  3.6, 2.0,  2.4),
    createBox(8.6, 0.45, 2.8, awning1, 0, 4.05, -1.45),
    createBox(8.6, 0.45, 2.8, awning2, 0, 3.95,  1.45),
    createBox(6.8, 1.10, 1.6, woodMat, 0, 0.75, 0.4),
    createBox(1.2, 0.55, 1.0, matDavidCached('#f97316'), -1.8, 1.58, 0.4),
    createBox(1.2, 0.55, 1.0, matDavidCached('#22c55e'),  0.0, 1.58, 0.4),
    createBox(1.2, 0.55, 1.0, matDavidCached('#a855f7'),  1.8, 1.58, 0.4)
  );
  completedMarket.visible = false;
  marketRoot.add(basePad, unfinishedFrame, completedMarket);
  marketRoot.userData = { unfinishedFrame, completedMarket, cx: -28, cz: 8, w: 8.5, d: 6.0, topY: 4.3 };
  worldGroup.add(marketRoot);
  davidCityBuildings.marketGroup = marketRoot;
  davidCityBuildingBoxes.push({ minX: -28 - 4.4, maxX: -28 + 4.4, minZ: 8 - 3.2, maxZ: 8 + 3.2, topY: 0.35 });

  const houseRoot = new THREE.Group();
  houseRoot.position.set(28, 0, 8);
  const hPad = createBox(9.0, 0.24, 7.0, matDavidCached('#94a3b8', '#64748b'), 0, 0.12, 0, false);
  const hUnfinished = createBox(8.6, 0.16, 6.6, new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35 }), 0, 0.32, 0, false);
  const completedHouse = new THREE.Group();
  const stoneWall = makeDetailedBuildingWallMat(1);
  const woodBeam = matVoxel('#78350f', '#451a03').clone();
  completedHouse.add(
    createBox(8.4, 4.4, 6.4, stoneWall, 0, 2.44, 0),
    createBox(8.8, 0.5, 6.8, woodBeam, 0, 4.89, 0),
    createBox(4.8, 2.4, 4.4, makeDetailedBuildingWallMat(2), 1.2, 6.34, -0.5),
    createBox(5.2, 0.4, 4.8, woodBeam, 1.2, 7.74, -0.5),
    createBox(1.6, 2.6, 0.12, woodBeam, -1.2, 1.54, 3.27),
    createBox(1.3, 1.3, 0.10, matDavidCached('#1e293b'), 2.0, 2.65, 3.26)
  );
  completedHouse.visible = false;
  houseRoot.add(hPad, hUnfinished, completedHouse);
  houseRoot.userData = { unfinishedFrame: hUnfinished, completedHouse, cx: 28, cz: 8, w: 8.8, d: 6.8, topY: 7.95 };
  worldGroup.add(houseRoot);
  davidCityBuildings.houseGroup = houseRoot;
  davidCityBuildingBoxes.push({ minX: 28 - 4.6, maxX: 28 + 4.6, minZ: 8 - 3.6, maxZ: 8 + 3.6, topY: 0.35 });

  const gateZ = mapLimit;
  const gateRoot = new THREE.Group();
  gateRoot.position.set(0, 0, gateZ);
  const towerMat = makeDetailedBuildingWallMat(0);
  const ironMat = matDavidCached('#475569', '#1e293b');
  const goldStud = matDavidCached('#facc15');

  const tL = createBox(7.2, 9.6, 5.8, towerMat, -7.8, 4.8, 0);
  const tR = createBox(7.2, 9.6, 5.8, makeDetailedBuildingWallMat(0),  7.8, 4.8, 0);
  const tArchLintel = createBox(8.4, 2.0, 5.4, makeDetailedBuildingWallMat(0), 0, 8.6, 0);
  const tTop = createBox(23.2, 2.4, 6.0, makeDetailedBuildingWallMat(1), 0, 10.8, 0);
  gateRoot.add(tL, tR, tArchLintel, tTop);
  wallMeshes.push(tL, tR, tArchLintel, tTop);

  registerCitySolidBox(-7.8, gateZ, 7.2, 5.8, 12.0, 0.20);
  registerCitySolidBox( 7.8, gateZ, 7.2, 5.8, 12.0, 0.20);
  registerCitySolidBox( 0.0, gateZ - 0.4, 8.6, 2.2, 12.0, 0.15);

  const brokenGate = new THREE.Group();
  const bDoorL = createBox(3.6, 6.5, 0.5, matDavidCached('#78350f'), -2.4, 3.0, 0);
  bDoorL.rotation.z = -0.28;
  const bDoorR = createBox(3.6, 6.0, 0.5, matDavidCached('#78350f'),  2.5, 2.6, 0.8);
  bDoorR.rotation.x = 0.35;
  brokenGate.add(bDoorL, bDoorR);

  const repairedGate = new THREE.Group();
  repairedGate.add(
    createBox(3.8, 7.4, 0.65, ironMat, -2.1, 3.7, 0),
    createBox(3.8, 7.4, 0.65, ironMat,  2.1, 3.7, 0),
    createBox(3.2, 0.4, 0.72, goldStud, -2.1, 5.4, 0),
    createBox(3.2, 0.4, 0.72, goldStud,  2.1, 5.4, 0),
    createBox(3.2, 0.4, 0.72, goldStud, -2.1, 2.2, 0),
    createBox(3.2, 0.4, 0.72, goldStud,  2.1, 2.2, 0)
  );
  repairedGate.visible = false;

  gateRoot.add(brokenGate, repairedGate);
  gateRoot.userData = { brokenGate, repairedGate };
  worldGroup.add(gateRoot);
  davidCityBuildings.gateGroup = gateRoot;
}

// -------------------------------------------------------------------------
// 6. 난이도별 맞춤형 랜덤 자원 스폰 & 퀘스트 수락 시 보유 자원 0 초기화
// -------------------------------------------------------------------------
function spawnDavidCityResourceNode(kind, x, z, baseY = 0) {
  const grp = new THREE.Group();
  let visualMesh, ringCol, title;

  if (kind === 'wood') {
    visualMesh = createLogBlockMesh(1.15, 0.72, 0.85);
    visualMesh.position.y = 0.55;
    ringCol = 0x22c55e;
    title = '🪵 백향목 나무 자재';
  } else if (kind === 'stone') {
    visualMesh = new THREE.Group();
    visualMesh.add(
      createBox(1.05, 0.75, 0.95, matDavidCached('#cbd5e1', '#64748b'), 0, 0.45, 0),
      createBox(0.75, 0.45, 0.75, matDavidCached('#f8fafc', '#94a3b8'), 0, 0.85, 0)
    );
    ringCol = 0x38bdf8;
    title = '🪨 다듬은 건축용 돌';
  } else {
    visualMesh = new THREE.Group();
    visualMesh.add(
      createBox(0.95, 0.72, 0.95, matDavidCached('#334155', '#0f172a'), 0, 0.42, 0),
      createBox(0.45, 0.45, 0.45, matDavidCached('#38bdf8', '#0284c7'), -0.22, 0.78, 0.15, false),
      createBox(0.38, 0.38, 0.38, matDavidCached('#facc15'), 0.24, 0.72, -0.15, false)
    );
    ringCol = 0xf59e0b;
    title = '⚙️ 단단한 철광석';
  }

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.9, 1.28, 20),
    new THREE.MeshBasicMaterial({ color: ringCol, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.06;

  grp.add(visualMesh, ring);
  grp.position.set(x, baseY, z);
  worldGroup.add(grp);

  const floorTag = baseY > 1.5 ? ' (2층 옥상)' : '';
  const bonusTag = currentMode === 'timeattack' ? ' (+5.5초!)' : '';
  davidCityResources.push({
    kind,
    title: `${title}${floorTag}`,
    group: grp,
    mesh: visualMesh,
    baseY,
    pos: new THREE.Vector3(x, baseY + 0.5, z),
    beingPickedUp: false,
    pickupTimer: 0,
    assignedRetainerIdx: 0,
    collected: false,
    respawnTimer: 0,
    label: createWorldLabel(`${title}${floorTag}${bonusTag}`)
  });
}

function spawnRandomizedStage3Resources() {
  davidCityResources.forEach(res => {
    if (res.group) worldGroup.remove(res.group);
    if (res.label) res.label.remove();
  });
  davidCityResources = [];

  davidRetainers.forEach(ret => {
    ret.fetchingRes = null;
    ret.pickupAnimTimer = 0;
  });

  const easyPools = {
    wood: [
      [-14, 8, 0], [-19, 4, 0], [-12, 14, 0], [-25, 16, 0], [-8, -2, 0], [-15, -8, 0], [8, 14, 0], [-6, 20, 0]
    ],
    stone: [
      [14, 8, 0], [19, 4, 0], [12, 14, 0], [25, 16, 0], [8, -2, 0], [15, -8, 0], [6, 20, 0], [18, 24, 0]
    ],
    iron: [
      [-6, 30, 0], [6, 30, 0], [-4, 46, 0], [4, 46, 0], [0, 24, 0], [-8, 38, 0], [8, 38, 0], [0, 50, 0]
    ]
  };

  const mediumPools = {
    wood: [
      [-34, -8, 0], [34, -8, 0], [-24, -22, 0], [24, -22, 0],
      [-40.5, -24.5, 3.6], [40.5, -24.5, 3.6], [-34, 14, 0], [-24, -38, 0], [24, -38, 0]
    ],
    stone: [
      [34, 12, 0], [24, 24, 0], [38, 28, 0], [40.5, 23.5, 3.6],
      [18.5, 31.5, 3.6], [48, 8, 0], [24, 40, 0], [36, -18, 0]
    ],
    iron: [
      [-34, 18, 0], [-24, 26, 0], [-24, 42, 0], [-40.5, 23.5, 3.6],
      [-18.5, -32.5, 3.6], [-48, 8, 0], [-36, 38, 0], [8, 48, 0]
    ]
  };

  const hardPools = {
    wood: [
      [-52.5, -46.5, 3.6], [-40.5, -24.5, 3.6], [40.5, -24.5, 3.6],
      [-46, -54, 0], [46, -54, 0], [-52, -32, 0], [52, -32, 0], [-35, -42, 0], [35, -42, 0]
    ],
    stone: [
      [52.5, 49.5, 3.6], [40.5, 23.5, 3.6], [18.5, 31.5, 3.6],
      [48, 54, 0], [52, 26, 0], [52, -16, 0], [38, 42, 0], [48, -42, 0]
    ],
    iron: [
      [-40.5, 23.5, 3.6], [-18.5, -32.5, 3.6],
      [-48, 54, 0], [-52, 28, 0], [-52, -16, 0], [-38, 42, 0], [-48, -42, 0], [46, 54, 0]
    ]
  };

  const isKinder = (currentMode === 'kinder');
  const isHard = (currentMode === 'senior' || currentMode === 'timeattack');
  const selectedPools = isKinder ? easyPools : (isHard ? hardPools : mediumPools);
  const spawnCountPerKind = isKinder ? 6 : 5;

  ['wood', 'stone', 'iron'].forEach(kind => {
    const shuffled = [...selectedPools[kind]].sort(() => Math.random() - 0.5);
    const chosen = shuffled.slice(0, spawnCountPerKind);

    chosen.forEach(([bx, bz, by]) => {
      let fx = bx;
      let fz = bz;
      if (by === 0) {
        for (let attempt = 0; attempt < 5; attempt++) {
          const candX = bx + (Math.random() - 0.5) * 3.2;
          const candZ = bz + (Math.random() - 0.5) * 3.2;
          if (isCityFloorSpotClear(candX, candZ, 1.25)) {
            fx = candX;
            fz = candZ;
            break;
          }
        }
      }
      spawnDavidCityResourceNode(kind, fx, fz, by);
    });
  });
}

function resetDavidStage3InventoryAndRespawnResources() {
  davidInventory.wood = 0;
  davidInventory.stone = 0;
  davidInventory.iron = 0;
  spawnRandomizedStage3Resources();
  updateDavidStage3InventoryHUD();
  updateDavidStage3QuestTrackerUI();
}

function updateDavidStage3InventoryHUD() {
  if (carriedBlockGroup) {
    while (carriedBlockGroup.children.length > 0) carriedBlockGroup.remove(carriedBlockGroup.children[0]);
  }

  const items = [];
  for (let i = 0; i < davidInventory.wood; i++) items.push('#78350f');
  for (let i = 0; i < davidInventory.stone; i++) items.push('#94a3b8');
  for (let i = 0; i < davidInventory.iron; i++) items.push('#38bdf8');

  davidRetainers.forEach((ret, rIdx) => {
    const pack = ret.mesh.userData.packGroup;
    if (!pack) return;
    while (pack.children.length > 0) pack.remove(pack.children[0]);
    const myItems = items.filter((_, idx) => (idx % 2) === rIdx);
    myItems.slice(0, 4).forEach((hex, sIdx) => {
      pack.add(createBox(0.56, 0.28, 0.42, matDavidCached(hex), 0, sIdx * 0.30, 0, false));
    });
  });

  const hudBox = document.getElementById('hud-block-box');
  if (hudBox && currentEpisode === 'david' && currentStage === 3) {
    hudBox.classList.add('hidden');
    hudBox.classList.remove('flex');
  }
  updateDavidStage3QuestTrackerUI();
}

function buildDavidStage3World() {
  clearWorld();
  ensureDavidCustomUI();
  ensureDavidStage3QuestTrackerUI();
  hideAllDavidCustomUI();

  scene.background = new THREE.Color(0x38bdf8);
  scene.fog = new THREE.Fog(0xbae6fd, 95, 270);

  const mapLimit = 68;
  const isKinder = (currentMode === 'kinder');
  const isHard = (currentMode === 'senior' || currentMode === 'timeattack');

  currentMapRectBounds = {
    minX: -mapLimit + 2.4,
    maxX:  mapLimit - 2.4,
    minZ: -mapLimit + 2.4,
    maxZ:  mapLimit - 2.2
  };

  davidCityNpcs = [];
  davidCityResources = [];
  davidRetainers = [];
  davidCityShopkeepers = [];
  davidCityPedestrians = [];
  davidCityBuildingBoxes = [];
  davidInventory = { wood: 0, stone: 0, iron: 0 };
  davidCurrentActiveQuestNpc = null;
  davidActiveNearNpc = null;
  davidDialogTargetNpc = null;
  davidNpcAutoDialogCooldown = 0;
  davidProphetUnlocked = false;
  davidStage3Cutscene.active = false;

  // [스테이지 3 요청사항] 타임어택 기본 시작 시간을 32.0초 -> 48.0초로 대폭 연장!
  if (currentMode === 'timeattack') {
    timeRemaining = 48.0;
  }

  const cityStoneMat = new THREE.MeshLambertMaterial({ map: makeDavidCityStoneTex() });

  const baseGround = createBox(mapLimit * 2.2, 1, mapLimit * 2.2, cityStoneMat, 0, -0.5, 0, false);
  baseGround.receiveShadow = true;
  worldGroup.add(baseGround);

  buildDavidCastleWallPerimeter(mapLimit, true);
  buildDavidCityPalace(0, -14);
  buildDavidCityTabernacle(0, -50);
  buildDenseMazeCityAndStreets();
  buildQuestBuildableStructures(mapLimit);

  spawnRandomizedStage3Resources();

  const reqWood1 = isKinder ? 1 : 2;
  const reqStone2 = isKinder ? 1 : (isHard ? 2 : 1);
  const reqWood2 = isKinder ? 1 : (isHard ? 2 : 1);
  const reqIron3 = isKinder ? 1 : 2;

  const npcConfigs = [
    {
      id: 'merchant',
      roleTitle: '🏪 상인',
      x: -22.5, z: 11.5,
      rotY: 0,
      pitch: 1.15,
      beaconColor: 0xfacc15,
      req: { wood: reqWood1, stone: 0, iron: 0 },
      questLine: `"왕이시여, 상가를 지어야 하는데 나무가 필요합니다! 지금부터 성 안의 나무 ${reqWood1}개를 새로 구해주시옵소서!"`,
      thanksLine: `"오오! 다윗 왕이시여 감사합니다! 왕께서 주신 나무로 멋진 상가를 세웠습니다!"`
    },
    {
      id: 'architect',
      roleTitle: '📐 건축가',
      x: 22.5, z: 11.5,
      rotY: 0,
      pitch: 0.92,
      beaconColor: 0x38bdf8,
      req: { wood: reqWood2, stone: reqStone2, iron: 0 },
      questLine: `"왕이시여, 집을 지어야 하는데 돌과 나무가 필요합니다! 지금부터 돌 ${reqStone2}개와 나무 ${reqWood2}개를 새로 찾아주시옵소서!"`,
      thanksLine: `"찬양받으소서 다윗 왕이시여! 튼튼한 돌과 나무 덕분에 백성들의 집이 완성되었습니다!"`
    },
    {
      id: 'guard',
      roleTitle: '🛡️ 경비병',
      x: -2.5, z: mapLimit - 9.5,
      rotY: Math.PI,
      pitch: 0.78,
      beaconColor: 0xf97316,
      req: { wood: 0, stone: 0, iron: reqIron3 },
      questLine: `"왕이시여, 성벽 대성문이 고장나 성문을 고쳐야 합니다! 지금부터 철 ${reqIron3}개를 새로 찾아 갖다주시옵소서!"`,
      thanksLine: `"충성! 왕께서 가져다주신 철로 다윗성의 남쪽 대성문을 완벽히 고쳤습니다!"`
    },
    {
      id: 'herald',
      roleTitle: '📯 왕궁 전령',
      x: 0, z: -4.5,
      rotY: 0,
      pitch: 1.25,
      beaconColor: 0xa855f7,
      req: null,
      questLine: `"왕이시여! 성 안의 상인, 건축가, 경비병의 요청을 한 분씩 차례대로 해결해 주시옵소서!"`,
      thanksLine: `"왕이시여! 온 백성이 왕의 지혜를 칭송하고 있습니다! 이제 북쪽 끝 언약의 성막 앞에 계신 선지자님께 가보시옵소서!"`
    }
  ];

  npcConfigs.forEach(cfg => {
    const npcGrp = new THREE.Group();
    const mesh = createDetailedCityNpcMesh(cfg.id);
    if (cfg.rotY) mesh.rotation.y = cfg.rotY;
    const beacon = createNpcSkyBeacon(cfg.beaconColor);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.3, 1.8, 28),
      new THREE.MeshBasicMaterial({
        color: cfg.beaconColor,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1
      })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = (cfg.id === 'herald') ? 0.085 : 0.06;

    npcGrp.add(mesh, beacon, ring);
    npcGrp.position.set(cfg.x, 0, cfg.z);
    worldGroup.add(npcGrp);

    const lbl = createWorldLabel(`💬 ${cfg.roleTitle}`);
    davidCityNpcs.push({
      ...cfg,
      group: npcGrp,
      mesh,
      beacon,
      ring,
      pos: new THREE.Vector3(cfg.x, 0.5, cfg.z),
      started: false,
      completed: false,
      autoPromptedInZone: false,
      label: lbl
    });
  });

  const prophetGrp = new THREE.Group();
  const prophetMesh = createSamuelMesh();
  const prophetBeacon = createNpcSkyBeacon(0x22d3ee);
  prophetBeacon.visible = false;
  prophetGrp.add(prophetMesh, prophetBeacon);
  prophetGrp.position.set(0, 0, -42.5);
  worldGroup.add(prophetGrp);

  const prophetRing = new THREE.Mesh(
    new THREE.RingGeometry(1.5, 2.1, 28),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide })
  );
  prophetRing.rotation.x = -Math.PI / 2;
  prophetRing.position.set(0, 0.07, -40.5);
  prophetRing.visible = false;
  worldGroup.add(prophetRing);

  targetObject = {
    type: 'nathan_prophet',
    mesh: prophetMesh,
    beacon: prophetBeacon,
    spotRing: prophetRing,
    pos: new THREE.Vector3(0, 1.2, -40.5),
    label: createWorldLabel('✨ 나단 선지자 (백성들의 민원을 모두 마친 뒤 오세요!)'),
    triggered: false
  };

  const retainerNames = ['왕실 보좌관', '왕실 서기관'];
  [-1.4, 1.4].forEach((ox, rIdx) => {
    const rMesh = createDavidRetainerMesh(rIdx);
    rMesh.position.set(ox, 0, 16.2);
    rMesh.rotation.y = Math.PI;
    worldGroup.add(rMesh);
    davidRetainers.push({
      index: rIdx,
      name: retainerNames[rIdx],
      mesh: rMesh,
      heading: Math.PI,
      fetchingRes: null,
      pickupAnimTimer: 0
    });
  });

  playerPos.set(0, 0, 14.0);
  davidStage3KingTrail = [
    { x: 0, z: 14.0, y: 0 },
    { x: 0, z: 15.6, y: 0 },
    { x: 0, z: 17.2, y: 0 },
    { x: 0, z: 18.8, y: 0 }
  ];
  lastGroundedY = 0;
  playerVelY = 0; isGrounded = true; playerFacing = Math.PI;
  cameraYaw = 0; cameraTargetYaw = 0;
  rebuildPlayerAppearance();
  if (playerGroup) playerGroup.rotation.y = Math.PI;
  if (guideArrowGroup) guideArrowGroup.visible = (currentMode !== 'senior');
  if (typeof window.setGlobalCameraViewMode === 'function') {
    window.setGlobalCameraViewMode('default');
  } else {
    window.globalCameraViewMode = 'default';
  }
  snapCameraToPlayer();
  updateStageHUD();
  updateDavidStage3QuestTrackerUI();
}
// =========================================================================
// [ep3_david_st3_end.js - 후반부 (2/2)] 에피소드 3 : 스테이지 3 진행 로직, 암전 성경절 엔딩 및 플러그인 등록
// - 스테이지 3: 나단 선지자 이름표를 처음부터 띄우지 않고, 3가지 퀘스트 해결 후 왕궁 전령이 소개한 이후에 공개
// - 스테이지 3 타임어택: 기본 시간 48초 상향, 자재 아이템 획득 시 +5.5초 부여, 퀘스트 완료 시 +7.0초 부여
// - 에피소드 3 엔딩: 별도 버튼 생성 없이 왕좌에서 일어나 엔딩 세상을 둘러본 뒤 다시 왕좌로 가면 월드맵 이동 선택창 오픈
// =========================================================================

// -------------------------------------------------------------------------
// 1. NPC 말풍선 대화창 (단일 퀘스트 잠금, 수락 시 자원 0 초기화, 완공 건물 충돌 잠금, 타임어택 +7초)
// -------------------------------------------------------------------------
function syncCityNpcBeaconsForActiveQuest() {
  davidCityNpcs.forEach(n => {
    if (!n.beacon) return;
    if (n.completed) {
      n.beacon.visible = false;
    } else if (davidCurrentActiveQuestNpc) {
      n.beacon.visible = (n === davidCurrentActiveQuestNpc);
    } else {
      const allThreeDone = davidCityNpcs.filter(x => x.id !== 'herald').every(x => x.completed);
      n.beacon.visible = (n.id === 'herald') ? allThreeDone : true;
    }
  });
}

function openDavidNpcDialog(npc) {
  ensureDavidCustomUI();
  ensureDavidStage3QuestTrackerUI();
  const dlg = document.getElementById('david-npc-dialog');
  const nameEl = document.getElementById('david-npc-name');
  const textEl = document.getElementById('david-npc-text');
  const btnEl = document.getElementById('david-npc-action-btn');
  if (!dlg || !npc) return;

  if (!dlg.classList.contains('hidden')) return;

  davidDialogTargetNpc = npc;
  npc.autoPromptedInZone = true;
  dlg.classList.remove('david-stage2-intro');
  dlg.classList.remove('hidden');
  nameEl.textContent = npc.roleTitle;

  let fullLine = '';
  let canCompleteNow = false;
  let canAcceptNewQuest = false;

  if (
    davidCurrentActiveQuestNpc &&
    davidCurrentActiveQuestNpc !== npc &&
    !davidCurrentActiveQuestNpc.completed
  ) {
    fullLine = `"왕이시여! 지금은 먼저 약속하신 [${davidCurrentActiveQuestNpc.roleTitle}]의 요청을 진행 중이십니다. 그 일을 먼저 마친 뒤에 찾아주시옵소서!"`;
    btnEl.textContent = '먼저 해결하고 오겠네';
  } else if (npc.id === 'herald') {
    const allThreeDone = davidCityNpcs.filter(n => n.id !== 'herald').every(n => n.completed);
    npc.started = true;
    if (allThreeDone) {
      fullLine = npc.thanksLine;
      btnEl.textContent = '✨ 선지자님께 가겠네!';
      canCompleteNow = true;
    } else {
      fullLine = npc.questLine;
      btnEl.textContent = '해결해주겠네';
    }
  } else if (npc.completed) {
    fullLine = npc.thanksLine;
    btnEl.textContent = '평안하길 바라네!';
  } else if (davidCurrentActiveQuestNpc === npc) {
    const hasEnough =
      davidInventory.wood >= npc.req.wood &&
      davidInventory.stone >= npc.req.stone &&
      davidInventory.iron >= npc.req.iron;

    npc._hadEnoughWhenOpened = hasEnough;
    if (hasEnough) {
      fullLine = npc.thanksLine;
      btnEl.textContent = '🔨 자재 건네주고 완성하기!';
      canCompleteNow = true;
    } else {
      fullLine = npc.questLine;
      btnEl.textContent = '계속 찾아보겠네';
    }
  } else {
    canAcceptNewQuest = true;
    npc._hadEnoughWhenOpened = false;
    fullLine = npc.questLine;
    btnEl.textContent = '해결해주겠네';
  }

  npc._pendingAcceptNewQuest = canAcceptNewQuest;
  npc._pendingComplete = canCompleteNow;
  textEl.textContent = '';

  if (npc._typingTimer) clearInterval(npc._typingTimer);
  let shownLen = 0;
  npc._typingTimer = setInterval(() => {
    shownLen += 2;
    textEl.textContent = fullLine.slice(0, shownLen);
    if (shownLen >= fullLine.length) {
      clearInterval(npc._typingTimer);
      npc._typingTimer = null;
    }
  }, 35);

  playAnimaleseSpeech(fullLine, npc.pitch || 1.0);
}

window.confirmDavidNpcDialog = function () {
  // 스테이지 2 시작 대면 대화 중일 때는 스테이지 2 대화 진행 함수로 연결
  if (
    currentEpisode === 'david' &&
    currentStage === 2 &&
    davidStage2Dialogue.active
  ) {
    window.advanceDavidStage2Dialogue();
    return;
  }

  // 스테이지 3 나단 선지자 언약 말풍선 확인 시 즉시 스테이지 클리어 모달 오픈
  if (
    currentEpisode === 'david' &&
    currentStage === 3 &&
    davidStage3Cutscene.active
  ) {
    if (davidStage3Cutscene._typingTimer) {
      clearInterval(davidStage3Cutscene._typingTimer);
      davidStage3Cutscene._typingTimer = null;
    }
    const dlgEl = document.getElementById('david-npc-dialog');
    if (dlgEl) dlgEl.classList.add('hidden');
    if (animaleseTimer) { clearInterval(animaleseTimer); animaleseTimer = null; }
    davidStage3Cutscene.active = false;
    openStageClearModal(3);
    return;
  }

  const dlg = document.getElementById('david-npc-dialog');
  if (dlg) dlg.classList.add('hidden');
  if (animaleseTimer) { clearInterval(animaleseTimer); animaleseTimer = null; }

  davidNpcAutoDialogCooldown = 1.5;

  const npc = davidDialogTargetNpc;
  davidDialogTargetNpc = null;
  if (!npc) return;
  if (npc._typingTimer) { clearInterval(npc._typingTimer); npc._typingTimer = null; }

  npc.autoPromptedInZone = true;

  // 새 퀘스트를 수락하는 순간 보유 자원을 0으로 초기화하고 난이도별 랜덤 위치에 자원 재배치
  if (npc._pendingAcceptNewQuest) {
    npc._pendingAcceptNewQuest = false;
    npc.started = true;
    davidCurrentActiveQuestNpc = npc;

    resetDavidStage3InventoryAndRespawnResources();
    syncCityNpcBeaconsForActiveQuest();
    updateStageHUD();

    playSfx('switch');
    return;
  }

  // 퀘스트 완료 처리 (타임어택 시 +7초 부여)
  if (npc._pendingComplete) {
    npc._pendingComplete = false;
    if (npc.id === 'herald') {
      npc.completed = true;
      davidCurrentActiveQuestNpc = null;
      syncCityNpcBeaconsForActiveQuest();
      npc.ring.material.color.setHex(0x22c55e);
      npc.label.innerHTML = `✅ ${npc.roleTitle} (북쪽 성막의 선지자님께 가세요!)`;
      davidProphetUnlocked = true;
      if (targetObject && targetObject.spotRing) targetObject.spotRing.visible = true;
      if (targetObject && targetObject.beacon) targetObject.beacon.visible = true;
      // 왕궁 전령이 소개한 이후에 비로소 나단 선지자 이름표를 공개!
      if (targetObject && targetObject.label) {
        targetObject.label.style.display = 'block';
        targetObject.label.innerHTML = '✨ 나단 선지자 (다가가서 하나님의 영원한 언약 듣기!)';
      }
      if (currentMode === 'timeattack') timeRemaining += 7.0;
      updateDavidStage3QuestTrackerUI();
      playSfx('clear');
      updateStageHUD();
      return;
    }

    davidInventory.wood = 0;
    davidInventory.stone = 0;
    davidInventory.iron = 0;

    npc.completed = true;
    davidCurrentActiveQuestNpc = null;
    syncCityNpcBeaconsForActiveQuest();
    updateDavidStage3InventoryHUD();
    updateDavidStage3QuestTrackerUI();

    npc.ring.material.color.setHex(0x22c55e);
    npc.label.innerHTML = `✅ ${npc.roleTitle} (해결 완료!)`;
    playSfx('hammer');
    playSfx('rescue');

    // [스테이지 3 요청사항] 타임어택 모드에서 퀘스트 완료 시 +7.0초 부여!
    if (currentMode === 'timeattack') timeRemaining += 7.0;
    const bonusMsg = (currentMode === 'timeattack') ? ' (+7초 시간 연장!)' : '';

    // 완성된 상가·새 집 건물을 뚫고 지나갈 수 없도록 충돌 박스 즉시 활성화
    if (npc.id === 'merchant' && davidCityBuildings.marketGroup) {
      const u = davidCityBuildings.marketGroup.userData;
      u.unfinishedFrame.visible = false;
      u.completedMarket.visible = true;
      lockCompletedQuestBuilding(u.cx, u.cz, u.w, u.d, u.topY, u.completedMarket);
      showToast(`🏪 상인의 상가가 멋지게 지어졌습니다!${bonusMsg} 이제 다음 빛기둥의 백성을 만나보세요!`);
    } else if (npc.id === 'architect' && davidCityBuildings.houseGroup) {
      const u = davidCityBuildings.houseGroup.userData;
      u.unfinishedFrame.visible = false;
      u.completedHouse.visible = true;
      lockCompletedQuestBuilding(u.cx, u.cz, u.w, u.d, u.topY, u.completedHouse);
      showToast(`🏠 건축가의 새 집이 튼튼하게 완성되었습니다!${bonusMsg} 이제 다음 빛기둥의 백성을 만나보세요!`);
    } else if (npc.id === 'guard' && davidCityBuildings.gateGroup) {
      davidCityBuildings.gateGroup.userData.brokenGate.visible = false;
      davidCityBuildings.gateGroup.userData.repairedGate.visible = true;
      showToast(`🛡️ 고장났던 다윗성 남쪽 대성문이 철로 단단히 수리되었습니다!${bonusMsg}`);
    }

    const doneCount = davidCityNpcs.filter(n => n.id !== 'herald' && n.completed).length;
    if (doneCount >= 3) {
      const herald = davidCityNpcs.find(n => n.id === 'herald');
      if (herald) {
        herald.autoPromptedInZone = false;
        herald.ring.material.color.setHex(0x38bdf8);
        herald.label.innerHTML = '📯 왕궁 전령 (선지자님 위치를 알려드려요!)';
      }
      syncCityNpcBeaconsForActiveQuest();
    }
    updateStageHUD();
  }
};

function updateDavidStage3HUD(badge, countIcon, countText, missionText) {
  updateDavidStage3InventoryHUD();

  // 전령이 나단 선지자를 소개하기 전에는 나단 선지자 머리 위 이름표를 숨김 유지
  if (targetObject && targetObject.label && targetObject.type === 'nathan_prophet') {
    targetObject.label.style.display = davidProphetUnlocked ? 'block' : 'none';
  }

  const doneCount = davidCityNpcs.filter(n => n.id !== 'herald' && n.completed).length;
  badge.textContent = '다윗성 · 스테이지 3';
  countIcon.textContent = '👑';
  countText.textContent = davidProphetUnlocked ? '선지자 방문' : `민원 ${doneCount}/3 완료`;

  if (davidProphetUnlocked) {
    missionText.textContent = '북쪽 언약의 성막 앞으로 가서 선지자를 통해 하나님의 영원한 언약을 들으세요!';
  } else if (davidCurrentActiveQuestNpc) {
    const qNpc = davidCurrentActiveQuestNpc;
    const reqParts = [];
    if (qNpc.req) {
      if (qNpc.req.wood > 0) reqParts.push(`🪵 나무 ${Math.min(davidInventory.wood, qNpc.req.wood)}/${qNpc.req.wood}개`);
      if (qNpc.req.stone > 0) reqParts.push(`🪨 돌 ${Math.min(davidInventory.stone, qNpc.req.stone)}/${qNpc.req.stone}개`);
      if (qNpc.req.iron > 0) reqParts.push(`⚙️ 철 ${Math.min(davidInventory.iron, qNpc.req.iron)}/${qNpc.req.iron}개`);
    }
    const reqSummary = reqParts.join(', ');
    const allMet = Boolean(
      qNpc.req &&
      davidInventory.wood >= qNpc.req.wood &&
      davidInventory.stone >= qNpc.req.stone &&
      davidInventory.iron >= qNpc.req.iron
    );
    if (allMet) {
      missionText.textContent = `[${qNpc.roleTitle}] 요청 자재(${reqSummary})를 모두 모았어요! ${qNpc.roleTitle}에게 돌아가 전달하세요!`;
    } else if (reqSummary) {
      missionText.textContent = `[${qNpc.roleTitle}] 퀘스트 진행 중! ${reqSummary}를 모아 ${qNpc.roleTitle}에게 전달하세요!`;
    } else {
      missionText.textContent = `현재 진행 중: [${qNpc.roleTitle}]의 요청 자재를 새로 모아 전달하세요!`;
    }
  } else if (doneCount >= 3) {
    missionText.textContent = '3가지 민원을 모두 해결했어요! 중앙 왕궁 앞 [왕궁 전령]에게 가세요!';
  } else {
    missionText.textContent = '하늘까지 솟은 빛기둥의 백성에게 다가가 한 분씩 차례대로 퀘스트를 받아 해결하세요!';
  }
  setTimeout(positionDavidStage3QuestTrackerBelowHUD, 0);
}

function triggerDavidStage3Action(targetObj) {
  if (!davidProphetUnlocked) {
    playSfx('wrong');
    showToast('👑 먼저 상인·건축가·경비병의 요청을 모두 해결하고 왕궁 전령에게 안내를 받으세요!');
    return;
  }
  targetObj.triggered = true;
  startDavidStage3CovenantCutscene();
}

// -------------------------------------------------------------------------
// 2. 상가 건물 내부 주인(8명), 골목길 행인(14명), 신하(2명) 및 자재 수집 업데이트 (+5.5초 보너스)
// -------------------------------------------------------------------------
function updateCityShopkeepersAndPedestrians(dt, now) {
  davidCityShopkeepers.forEach((sk) => {
    const u = sk.mesh.userData;
    if (u && u.lArm && u.rArm) {
      const w = Math.sin(now * 0.005 + sk.phase) * 0.32;
      u.lArm.rotation.x = -0.5 + w;
      u.rArm.rotation.x = -0.5 - w;
    }
  });

  davidCityPedestrians.forEach((ped, idx) => {
    const u = ped.mesh.userData;
    const curX = ped.mesh.position.x;
    const curZ = ped.mesh.position.z;

    for (const b of davidCityBuildingBoxes) {
      const pad = 0.55;
      if (curX > b.minX - pad && curX < b.maxX + pad && curZ > b.minZ - pad && curZ < b.maxZ + pad) {
        const dL = Math.abs(curX - (b.minX - pad));
        const dR = Math.abs((b.maxX + pad) - curX);
        const dN = Math.abs(curZ - (b.minZ - pad));
        const dS = Math.abs((b.maxZ + pad) - curZ);
        const m = Math.min(dL, dR, dN, dS);
        if (m === dL) ped.mesh.position.x = b.minX - pad - 0.05;
        else if (m === dR) ped.mesh.position.x = b.maxX + pad + 0.05;
        else if (m === dN) ped.mesh.position.z = b.minZ - pad - 0.05;
        else ped.mesh.position.z = b.maxZ + pad + 0.05;
      }
    }

    const dToKing = Math.hypot(playerPos.x - ped.mesh.position.x, playerPos.z - ped.mesh.position.z);

    if (dToKing < 2.3 && Math.abs(playerPos.y) < 1.0) {
      const toKingAng = Math.atan2(playerPos.x - ped.mesh.position.x, playerPos.z - ped.mesh.position.z);
      ped.heading = lerpAngle(ped.heading, toKingAng, dt * 10);
      ped.mesh.rotation.y = ped.heading;
      if (u) {
        if (u.lLeg) u.lLeg.rotation.x = 0;
        if (u.rLeg) u.rLeg.rotation.x = 0;
        if (u.lArm) u.lArm.rotation.x = -0.85;
        if (u.rArm) u.rArm.rotation.x = -0.85;
      }
      return;
    }

    const dx = ped.targetX - ped.mesh.position.x;
    const dz = ped.targetZ - ped.mesh.position.z;
    const dist = Math.hypot(dx, dz);

    if (dist < 0.45) {
      ped.forward = !ped.forward;
      ped.targetX = ped.forward ? ped.x2 : ped.x1;
      ped.targetZ = ped.forward ? ped.z2 : ped.z1;
    } else {
      const step = Math.min(dist, ped.speed * dt);
      const baseAng = Math.atan2(dx, dz);
      const nx = ped.mesh.position.x + (dx / dist) * step;
      const nz = ped.mesh.position.z + (dz / dist) * step;

      if (isCityFloorSpotClear(nx, nz, 0.65)) {
        ped.mesh.position.x = nx;
        ped.mesh.position.z = nz;
        ped.heading = lerpAngle(ped.heading, baseAng, dt * 8);
      } else {
        let steered = false;
        const steerAngles = [0.45, -0.45, 0.9, -0.9, 1.35, -1.35];
        for (const off of steerAngles) {
          const testAng = baseAng + off;
          const tx = ped.mesh.position.x + Math.sin(testAng) * step;
          const tz = ped.mesh.position.z + Math.cos(testAng) * step;
          if (isCityFloorSpotClear(tx, tz, 0.65)) {
            ped.mesh.position.x = tx;
            ped.mesh.position.z = tz;
            ped.heading = lerpAngle(ped.heading, testAng, dt * 10);
            steered = true;
            break;
          }
        }
        if (!steered) {
          ped.forward = !ped.forward;
          ped.targetX = ped.forward ? ped.x2 : ped.x1;
          ped.targetZ = ped.forward ? ped.z2 : ped.z1;
        }
      }

      ped.mesh.rotation.y = ped.heading;

      const swing = Math.sin(now * 0.014 + ped.phase + idx) * 0.55;
      if (u) {
        if (u.lLeg) u.lLeg.rotation.x = swing;
        if (u.rLeg) u.rLeg.rotation.x = -swing;
        if (u.lArm) u.lArm.rotation.x = -swing * 0.65;
        if (u.rArm) u.rArm.rotation.x = swing * 0.65;
      }
    }
  });
}

function updateDavidRetainersAndResources(dt, now) {
  davidCityResources.forEach((res, idx) => {
    if (res.collected) {
      res.respawnTimer -= dt;
      if (res.respawnTimer <= 0) {
        res.collected = false;
        res.beingPickedUp = false;
        res.pickupTimer = 0;
        res.group.visible = true;
        res.group.scale.set(1, 1, 1);
      }
      return;
    }

    res.mesh.rotation.y += dt * 2.0;
    const horizDist = Math.hypot(playerPos.x - res.pos.x, playerPos.z - res.pos.z);
    const heightDiff = Math.abs(playerPos.y - res.baseY);
    updateWorldLabelPos(res.label, res.pos, horizDist < 24);

    if (!res.beingPickedUp && horizDist < 3.8 && heightDiff < 1.8) {
      res.beingPickedUp = true;
      res.pickupTimer = 0;
      const clearRet = davidRetainers.find(
        r => !r.fetchingRes && isRetainerLineClear(r.mesh.position.x, r.mesh.position.z, res.pos.x, res.pos.z, r.mesh.position.y, 0.32)
      );
      const idleRet = clearRet || davidRetainers.find(r => !r.fetchingRes) || davidRetainers[idx % Math.max(1, davidRetainers.length)];
      if (idleRet) {
        res.assignedRetainerIdx = idleRet.index;
        idleRet.fetchingRes = res;
        idleRet.pickupAnimTimer = 0.55;
      }
      playSfx('build');
    }

    if (res.beingPickedUp) {
      res.pickupTimer += dt;
      const p = Math.min(1, res.pickupTimer / 0.45);
      const sc = Math.max(0.1, 1 - p * 0.85);
      res.group.scale.set(sc, sc, sc);
      res.mesh.rotation.y += dt * 10;

      if (res.pickupTimer >= 0.45) {
        res.beingPickedUp = false;
        res.collected = true;
        res.respawnTimer = 8.5;
        res.group.visible = false;
        res.label.style.opacity = '0';

        const ret = davidRetainers[res.assignedRetainerIdx];
        if (ret && ret.fetchingRes === res) {
          ret.fetchingRes = null;
        }

        davidInventory[res.kind] = (davidInventory[res.kind] || 0) + 1;
        updateDavidStage3InventoryHUD();
        updateStageHUD();

        if (davidCurrentActiveQuestNpc && davidCurrentActiveQuestNpc.req) {
          const req = davidCurrentActiveQuestNpc.req;
          const nowEnough =
            davidInventory.wood >= req.wood &&
            davidInventory.stone >= req.stone &&
            davidInventory.iron >= req.iron;
          if (nowEnough && !davidCurrentActiveQuestNpc._hadEnoughWhenOpened) {
            davidCurrentActiveQuestNpc.autoPromptedInZone = false;
          }
        }

        playSfx('rescue');
        // [스테이지 3 요청사항] 아이템(자재) 획득 시 타임어택 보너스 시간을 +5.5초로 상향!
        if (currentMode === 'timeattack') timeRemaining += 5.5;
        const retName = ret ? ret.name : '신하';
        const timeTag = currentMode === 'timeattack' ? ' (+5.5초 시간 연장!)' : '';
        if (!davidCurrentActiveQuestNpc) {
          showToast(`🙌 ${retName}이(가) ${res.title}을(를) 챙겼습니다!${timeTag} (※ 퀘스트 수락 시 0으로 초기화)`);
        } else {
          showToast(`🙌 ${retName}이(가) ${res.title} 획득!${timeTag} (🪵${davidInventory.wood} · 🪨${davidInventory.stone} · ⚙️${davidInventory.iron})`);
        }
      }
    }
  });

  if (
    davidStage3KingTrail.length === 0 ||
    Math.hypot(playerPos.x - davidStage3KingTrail[0].x, playerPos.z - davidStage3KingTrail[0].z) > 0.24
  ) {
    davidStage3KingTrail.unshift({ x: playerPos.x, z: playerPos.z, y: playerPos.y });
    if (davidStage3KingTrail.length > 90) davidStage3KingTrail.pop();
  }

  const sinF = Math.sin(playerFacing);
  const cosF = Math.cos(playerFacing);
  const backDist = 1.95;
  const leftSideX = playerPos.x - sinF * backDist - cosF * 1.12;
  const leftSideZ = playerPos.z - cosF * backDist + sinF * 1.12;
  const rightSideX = playerPos.x - sinF * backDist + cosF * 1.12;
  const rightSideZ = playerPos.z - cosF * backDist - sinF * 1.12;

  const kingLeftClear = isRetainerSpotClear(playerPos.x - cosF * 1.65, playerPos.z + sinF * 1.65, playerPos.y, 0.52);
  const kingRightClear = isRetainerSpotClear(playerPos.x + cosF * 1.65, playerPos.z - sinF * 1.65, playerPos.y, 0.52);
  const backLeftClear = isRetainerSpotClear(leftSideX, leftSideZ, playerPos.y, 0.58);
  const backRightClear = isRetainerSpotClear(rightSideX, rightSideZ, playerPos.y, 0.58);
  const useSingleFile = !(kingLeftClear && kingRightClear && backLeftClear && backRightClear);

  davidRetainers.forEach((ret, rIdx) => {
    const u = ret.mesh.userData;
    const curX = ret.mesh.position.x;
    const curY = ret.mesh.position.y;
    const curZ = ret.mesh.position.z;
    let targetX, targetY, targetZ;
    let isPickingUp = false;

    if (ret.fetchingRes && !ret.fetchingRes.collected) {
      isPickingUp = true;
      const offsetAng = (rIdx === 0 ? -0.5 : 0.5);
      const candX = ret.fetchingRes.pos.x + Math.sin(offsetAng) * 0.65;
      const candZ = ret.fetchingRes.pos.z + Math.cos(offsetAng) * 0.65;
      if (isRetainerSpotClear(candX, candZ, ret.fetchingRes.baseY, 0.42)) {
        targetX = candX;
        targetZ = candZ;
      } else {
        targetX = ret.fetchingRes.pos.x;
        targetZ = ret.fetchingRes.pos.z;
      }
      targetY = ret.fetchingRes.baseY;
    } else {
      ret.fetchingRes = null;
      const sideCandX = (rIdx === 0 ? leftSideX : rightSideX);
      const sideCandZ = (rIdx === 0 ? leftSideZ : rightSideZ);

      if (!useSingleFile && isRetainerSpotClear(sideCandX, sideCandZ, playerPos.y, 0.52)) {
        targetX = sideCandX;
        targetZ = sideCandZ;
        targetY = playerPos.y;
      } else {
        const trailDist = (rIdx === 0 ? 1.75 : 3.25);
        const tp = getKingTrailPointAtDist(trailDist);
        targetX = tp.x;
        targetZ = tp.z;
        targetY = tp.y;
      }
    }

    let steerX = targetX;
    let steerZ = targetZ;
    if (!isRetainerLineClear(curX, curZ, targetX, targetZ, curY, 0.38)) {
      for (let i = 0; i < davidStage3KingTrail.length; i++) {
        const wp = davidStage3KingTrail[i];
        if (
          Math.hypot(wp.x - curX, wp.z - curZ) > 0.35 &&
          isRetainerSpotClear(wp.x, wp.z, curY, 0.42) &&
          isRetainerLineClear(curX, curZ, wp.x, wp.z, curY, 0.35)
        ) {
          steerX = wp.x;
          steerZ = wp.z;
          break;
        }
      }
    }

    if (!isPickingUp && rIdx === 1 && davidRetainers[0]) {
      const leadPos = davidRetainers[0].mesh.position;
      const dLead = Math.hypot(curX - leadPos.x, curZ - leadPos.z);
      const dGoal = Math.hypot(targetX - curX, targetZ - curZ);
      if (dLead < 1.15 && dGoal < 1.8) {
        steerX = curX;
        steerZ = curZ;
      }
    }

    const dx = steerX - curX;
    const dz = steerZ - curZ;
    const dist = Math.hypot(dx, dz);
    const spd = isPickingUp ? 12.0 : 8.2;

    if (dist > 0.20) {
      const step = Math.min(dist, spd * dt);
      const baseAng = Math.atan2(dx, dz);
      let moved = false;
      let moveAng = baseAng;

      const tryOffsets = [0, 0.42, -0.42, 0.85, -0.85, 1.30, -1.30, 1.75, -1.75];
      for (let k = 0; k < tryOffsets.length; k++) {
        const ang = baseAng + tryOffsets[k];
        const nx = curX + Math.sin(ang) * step;
        const nz = curZ + Math.cos(ang) * step;
        if (isRetainerSpotClear(nx, nz, curY, 0.45)) {
          ret.mesh.position.x = nx;
          ret.mesh.position.z = nz;
          moveAng = ang;
          moved = true;
          break;
        }
      }

      if (!moved) {
        const nxOnly = curX + Math.sin(baseAng) * step;
        const nzOnly = curZ + Math.cos(baseAng) * step;
        if (isRetainerSpotClear(nxOnly, curZ, curY, 0.45)) {
          ret.mesh.position.x = nxOnly;
          moved = true;
        } else if (isRetainerSpotClear(curX, nzOnly, curY, 0.45)) {
          ret.mesh.position.z = nzOnly;
          moved = true;
        }
      }

      resolveRetainerOutOfCityBuildings(ret);

      ret.heading = lerpAngle(ret.heading, moveAng, dt * 12);
      ret.mesh.rotation.y = ret.heading;

      const walkSwing = Math.sin(now * 0.018 + rIdx * 1.5) * 0.65;
      if (u.lLeg && u.rLeg) {
        u.lLeg.rotation.x = walkSwing;
        u.rLeg.rotation.x = -walkSwing;
      }
      if (!isPickingUp && u.lArm && u.rArm) {
        u.lArm.rotation.x = -walkSwing * 0.6;
        u.rArm.rotation.x = walkSwing * 0.6;
      }
    } else {
      resolveRetainerOutOfCityBuildings(ret);
      if (u.lLeg && u.rLeg) {
        u.lLeg.rotation.x = 0;
        u.rLeg.rotation.x = 0;
      }
      if (!isPickingUp && u.lArm && u.rArm) {
        u.lArm.rotation.x = 0;
        u.rArm.rotation.x = 0;
      }
    }

    ret.mesh.position.y = THREE.MathUtils.lerp(ret.mesh.position.y, targetY, Math.min(1, dt * 10));

    if (ret.pickupAnimTimer > 0) {
      ret.pickupAnimTimer -= dt;
      if (ret.fetchingRes) {
        ret.mesh.rotation.y = Math.atan2(
          ret.fetchingRes.pos.x - ret.mesh.position.x,
          ret.fetchingRes.pos.z - ret.mesh.position.z
        );
      }
      const grabWave = Math.sin(now * 0.045) * 0.75;
      ret.mesh.rotation.x = 0.28;
      if (u.lArm && u.rArm) {
        u.lArm.rotation.x = -1.35 + grabWave;
        u.rArm.rotation.x = -1.35 - grabWave;
      }
    } else {
      ret.mesh.rotation.x = 0;
    }
  });
}

function updateDavidStage3Frame(dt, now) {
  if (davidOpeningState.active) return;
  if (davidNpcAutoDialogCooldown > 0) davidNpcAutoDialogCooldown -= dt;

  positionDavidStage3QuestTrackerBelowHUD();
  resolvePlayerOutOfCityBuildings();
  updateDavidRetainersAndResources(dt, now);
  updateCityShopkeepersAndPedestrians(dt, now);

  const dlgEl = document.getElementById('david-npc-dialog');
  const isDialogHidden = (!dlgEl || dlgEl.classList.contains('hidden'));

  davidActiveNearNpc = null;
  let minNpcD = 999;

  davidCityNpcs.forEach((npc, idx) => {
    if (npc.mesh.userData && npc.mesh.userData.lArm && npc.mesh.userData.rArm) {
      const wave = Math.sin(now * 0.006 + idx) * 0.35;
      npc.mesh.userData.lArm.rotation.x = npc.completed ? (-2.2 + wave) : wave;
      npc.mesh.userData.rArm.rotation.x = npc.completed ? (-2.2 - wave) : -wave;
    }

    if (npc.beacon && npc.beacon.visible) {
      const pulse = 1.0 + Math.sin(now * 0.004 + idx) * 0.14;
      npc.beacon.scale.set(pulse, 1, pulse);
    }

    const d = Math.hypot(playerPos.x - npc.pos.x, playerPos.z - npc.pos.z);
    updateWorldLabelPos(npc.label, npc.pos, d < 32);

    if (d > 4.8) {
      npc.autoPromptedInZone = false;
    }

    if (d < 4.2 && d < minNpcD) {
      minNpcD = d;
      davidActiveNearNpc = npc;
    }

    if (
      d < 3.0 &&
      !npc.autoPromptedInZone &&
      isDialogHidden &&
      davidNpcAutoDialogCooldown <= 0 &&
      Math.abs(playerPos.y) < 1.2
    ) {
      const allThreeDone = davidCityNpcs.filter(n => n.id !== 'herald').every(n => n.completed);
      const hasEnoughForNpc = npc.req
        ? (davidInventory.wood >= npc.req.wood && davidInventory.stone >= npc.req.stone && davidInventory.iron >= npc.req.iron)
        : false;

      const shouldAutoOpen =
        (!davidCurrentActiveQuestNpc && !npc.completed && npc.id !== 'herald') ||
        (davidCurrentActiveQuestNpc === npc && !npc.completed && hasEnoughForNpc) ||
        (davidCurrentActiveQuestNpc && davidCurrentActiveQuestNpc !== npc && !npc.completed) ||
        (npc.id === 'herald' && (!npc.started || (allThreeDone && !npc.completed)));

      if (shouldAutoOpen) {
        openDavidNpcDialog(npc);
      }
    }
  });

  const pBtn = document.getElementById('puzzle-build-btn');
  if (davidActiveNearNpc && isDialogHidden) {
    pBtn.classList.remove('hidden');
    pBtn.textContent = `💬 ${davidActiveNearNpc.roleTitle}와 대화하기!`;
  } else {
    pBtn.classList.add('hidden');
  }

  if (targetObject && !targetObject.triggered) {
    if (targetObject.beacon && targetObject.beacon.visible) {
      const bPulse = 1.0 + Math.sin(now * 0.005) * 0.16;
      targetObject.beacon.scale.set(bPulse, 1, bPulse);
    }

    const td = Math.hypot(playerPos.x - targetObject.pos.x, playerPos.z - targetObject.pos.z);
    // 전령이 소개하여 davidProphetUnlocked가 true가 되기 전에는 나단 선지자 이름표를 절대 띄우지 않음!
    if (targetObject.label) {
      targetObject.label.style.display = davidProphetUnlocked ? 'block' : 'none';
    }
    updateWorldLabelPos(targetObject.label, targetObject.pos, davidProphetUnlocked && td < 34);

    const ctxBtn = document.getElementById('context-action-btn');
    if (davidProphetUnlocked && td < 4.5) {
      ctxBtn.classList.remove('hidden');
      ctxBtn.textContent = '✨ 선지자에게 하나님의 언약 듣기!';
      if (td < 2.8) triggerContextAction();
    } else {
      ctxBtn.classList.add('hidden');
    }

    if (guideArrowGroup && guideArrowGroup.visible) {
      const baseFacing = (window.globalCameraViewMode === 'fps') ? (cameraYaw + Math.PI) : playerFacing;
      let guidePt = targetObject.pos;
      if (!davidProphetUnlocked) {
        if (davidCurrentActiveQuestNpc && !davidCurrentActiveQuestNpc.completed) {
          const req = davidCurrentActiveQuestNpc.req;
          let neededKind = null;
          if (req.wood > davidInventory.wood) neededKind = 'wood';
          else if (req.stone > davidInventory.stone) neededKind = 'stone';
          else if (req.iron > davidInventory.iron) neededKind = 'iron';

          if (neededKind) {
            let bestRes = null;
            let bestD = 9999;
            davidCityResources.forEach(r => {
              if (!r.collected && r.kind === neededKind) {
                const distToR = Math.hypot(playerPos.x - r.pos.x, playerPos.z - r.pos.z);
                if (distToR < bestD) {
                  bestD = distToR;
                  bestRes = r;
                }
              }
            });
            guidePt = bestRes ? bestRes.pos : davidCurrentActiveQuestNpc.pos;
          } else {
            guidePt = davidCurrentActiveQuestNpc.pos;
          }
        } else {
          const nextNpc = davidCityNpcs.find(n => n.id !== 'herald' && !n.completed);
          if (!nextNpc) {
            const herald = davidCityNpcs.find(n => n.id === 'herald');
            guidePt = herald ? herald.pos : targetObject.pos;
          } else {
            guidePt = nextNpc.pos;
          }
        }
      }
      guideArrowGroup.rotation.y = Math.atan2(guidePt.x - playerPos.x, guidePt.z - playerPos.z) - baseFacing;
    }
  }
}

function startDavidStage3CovenantCutscene() {
  isPlaying = false;
  isTimeAttackActive = false;
  ensureDavidCustomUI();
  hideAllDavidCustomUI();
  const tracker = document.getElementById('david-st3-quest-tracker');
  if (tracker) tracker.classList.add('hidden');

  document.getElementById('context-action-btn').classList.add('hidden');
  document.getElementById('puzzle-build-btn').classList.add('hidden');
  document.getElementById('hud-mission-box').classList.add('hidden');
  if (typeof hideMissionGuideBubbleImmediately === 'function') hideMissionGuideBubbleImmediately();
  if (targetObject && targetObject.beacon) targetObject.beacon.visible = false;

  if (targetObject && targetObject.label) {
    targetObject.label.style.display = 'block';
    targetObject.label.innerHTML = '💬 나단 선지자: "다윗 왕이시여! 네 집과 네 나라가 내 앞에서 영원히 보전되고 네 왕위가 영원히 견고하리라!"';
    targetObject.label.style.opacity = '1';
  }

  const dlg = document.getElementById('david-npc-dialog');
  const nameEl = document.getElementById('david-npc-name');
  const textEl = document.getElementById('david-npc-text');
  const btnEl = document.getElementById('david-npc-action-btn');
  const nathanMsg = '"다윗 왕이시여! 여호와께서 말씀하시기를 \'네 집과 네 나라가 내 앞에서 영원히 보전되고 네 왕위가 영원히 견고하리라!\' 하셨나이다!" (사무엘하 7:16)';

  if (dlg && nameEl && textEl && btnEl) {
    dlg.classList.remove('david-stage2-intro');
    dlg.classList.remove('hidden');
    nameEl.textContent = '✨ 나단 선지자 (하나님의 언약 메시지)';
    btnEl.textContent = '아멘';
    textEl.textContent = '';

    if (davidStage3Cutscene._typingTimer) clearInterval(davidStage3Cutscene._typingTimer);
    let shownLen = 0;
    davidStage3Cutscene._typingTimer = setInterval(() => {
      shownLen += 2;
      textEl.textContent = nathanMsg.slice(0, shownLen);
      if (shownLen >= nathanMsg.length) {
        clearInterval(davidStage3Cutscene._typingTimer);
        davidStage3Cutscene._typingTimer = null;
      }
    }, 32);
  }

  playerPos.set(0, 0, -39.5);
  playerFacing = Math.PI;
  if (playerGroup) {
    playerGroup.position.copy(playerPos);
    playerGroup.rotation.y = Math.PI;
  }

  playAnimaleseSpeech('다윗 왕이시여 네 집과 네 나라가 내 앞에서 영원히 보전되고 네 왕위가 영원히 견고하리라', 0.88);
  davidStage3Cutscene.active = true;
  davidStage3Cutscene.timer = 0;
  playSfx('clear');
  showToast('✨ 나단 선지자가 다윗왕에게 하나님의 영원한 왕위 언약을 선포합니다! (사무엘하 7:16)');
}

function updateDavidStage3CutsceneFrame(dt, now) {
  if (!davidStage3Cutscene.active) return false;
  davidStage3Cutscene.timer += dt;
  const t = davidStage3Cutscene.timer;

  camera.position.lerp(new THREE.Vector3(3.5, 4.5, -34.0), 0.1);
  camera.lookAt(0, 2.2, -42.5);

  if (targetObject && targetObject.label) {
    updateWorldLabelPos(targetObject.label, new THREE.Vector3(0, 3.1, -42.5), true);
  }

  if (targetObject && targetObject.mesh && targetObject.mesh.userData.rArm) {
    targetObject.mesh.userData.rArm.rotation.x = -2.1 + Math.sin(now * 0.01) * 0.25;
  }

  if (t >= 6.2) {
    if (davidStage3Cutscene._typingTimer) {
      clearInterval(davidStage3Cutscene._typingTimer);
      davidStage3Cutscene._typingTimer = null;
    }
    const dlg = document.getElementById('david-npc-dialog');
    if (dlg) dlg.classList.add('hidden');
    if (targetObject && targetObject.label) targetObject.label.style.opacity = '0';
    davidStage3Cutscene.active = false;
    openStageClearModal(3);
  }
  return true;
}

// -------------------------------------------------------------------------
// 3. [엔딩 월드] 왕좌 착석 -> 암전 후 메시아 성경절 -> 둘러보기 선택 시 왕좌에서 일어나 이동 -> 다시 왕좌에 가면 창 오픈
// -------------------------------------------------------------------------
function createEmptyThroneWithGuideArrow(cx, cz) {
  const root = new THREE.Group();
  const goldMat = matDavidCached('#facc15', '#ca8a04');
  const redVelvet = matDavidCached('#991b1b', '#7f1d1d');
  const stoneStep = makeDetailedBuildingWallMat(0);

  root.add(
    createBox(7.6, 0.5, 6.8, stoneStep, 0, 0.25, 0.6),
    createBox(6.0, 0.5, 5.2, stoneStep, 0, 0.75, 0.0),
    createBox(4.4, 0.5, 3.8, goldMat,   0, 1.25, -0.5)
  );

  platforms.push(
    { minX: cx - 3.8, maxX: cx + 3.8, minZ: cz - 2.8, maxZ: cz + 4.0, topY: 0.50 },
    { minX: cx - 3.0, maxX: cx + 3.0, minZ: cz - 2.6, maxZ: cz + 2.6, topY: 1.00 },
    { minX: cx - 2.2, maxX: cx + 2.2, minZ: cz - 2.4, maxZ: cz + 1.4, topY: 1.55 }
  );

  root.add(
    createBox(2.4, 0.35, 1.9, redVelvet, 0, 1.68, -0.5),
    createBox(2.6, 3.4,  0.36, goldMat,  0, 3.20, -1.36),
    createBox(2.0, 2.8,  0.12, redVelvet, 0, 3.10, -1.12),
    createBox(0.38, 1.0, 1.9, goldMat,  -1.15, 2.18, -0.5),
    createBox(0.38, 1.0, 1.9, goldMat,   1.15, 2.18, -0.5)
  );
  colliders.push({ minX: cx - 1.5, maxX: cx + 1.5, minZ: cz - 1.8, maxZ: cz - 1.1 });

  const arrowGrp = new THREE.Group();
  const arrowMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  const arrowBorder = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
  arrowGrp.add(
    createBox(0.45, 1.1, 0.35, arrowMat, 0, 0.95, 0, false),
    createBox(1.35, 0.32, 0.38, arrowMat, 0, 0.42, 0, false),
    createBox(0.95, 0.28, 0.38, arrowMat, 0, 0.16, 0, false),
    createBox(0.50, 0.28, 0.38, arrowMat, 0, -0.10, 0, false),
    createBox(0.55, 1.2, 0.25, arrowBorder, 0, 0.95, -0.08, false)
  );
  arrowGrp.position.set(0, 4.2, -0.4);
  root.add(arrowGrp);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(1.1, 1.55, 28),
    new THREE.MeshBasicMaterial({ color: 0xfde047, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(0, 1.88, -0.4);
  root.add(ring);

  root.userData = { arrowGrp, ring };
  return root;
}

function startDavidEndingBlackoutAndCert() {
  runDavidBlackoutSequence(
    [
      {
        icon: '👑',
        html: '"보라 날이 이르리니 내가 다윗에게 한 의로운 가지를 일으킬 것이라<br/>그가 왕이 되어 지혜롭게 다스리며 세상에서 정의와 공의를 행할 것이며"',
        sub: '- 예레미야 23장 5절 -',
        voiceText: '보라 날이 이르리니 내가 다윗에게 한 의로운 가지를 일으킬 것이라 그가 왕이 되어 지혜롭게 다스리며 세상에서 정의와 공의를 행할 것이며',
        durationMs: 12600
      },
      {
        icon: '✨',
        html: '"아브라함과 다윗의 자손 예수 그리스도의 계보라"',
        sub: '- 마태복음 1장 1절 (다윗의 후손으로 오신 구원자 메시아) -',
        voiceText: '아브라함과 다윗의 자손 예수 그리스도의 계보라',
        durationMs: 6800
      }
    ],
    () => {
      isPlaying = true;
      if (typeof setInGameHudControlsVisible === 'function') setInGameHudControlsVisible(true);
      joyX = 0;
      joyY = 0;
      keys = {};
      currentMoveSpeed = 0;
      cameraYaw = Math.PI;
      cameraTargetYaw = Math.PI;
      snapCameraToPlayer();

      // 별도의 인증서/월드맵 버튼을 띄우지 않고 왕좌를 통해서만 창이 열리도록 유지
      const certOpenBtn = document.getElementById('cert-open-btn');
      if (certOpenBtn) certOpenBtn.classList.add('hidden');
      const ctxBtn = document.getElementById('context-action-btn');
      if (ctxBtn) ctxBtn.classList.add('hidden');

      if (typeof showEndingCertificate === 'function') {
        showEndingCertificate();
      }
    }
  );
}

function buildDavidEndingWorld() {
  hideAllDavidCustomUI();
  const tracker = document.getElementById('david-st3-quest-tracker');
  if (tracker) tracker.classList.add('hidden');

  scene.background = new THREE.Color(0x38bdf8);
  scene.fog = new THREE.Fog(0xbae6fd, 65, 195);

  const endLimit = 34;
  currentMapRectBounds = {
    minX: -endLimit + 2.4,
    maxX:  endLimit - 2.4,
    minZ: -endLimit + 2.4,
    maxZ:  endLimit - 2.4
  };

  davidThroneEnding.seated = false;
  davidThroneEnding.seatTimer = 0;
  davidThroneEnding.modalShown = false;
  davidThroneEnding.waitingToLeaveThrone = false;

  const cityStoneMat = new THREE.MeshLambertMaterial({ map: makeDavidCityStoneTex() });
  const marbleMat = matDavidCached('#f8fafc', '#e2e8f0');
  const carpetMat = matDavidCached('#b91c1c', '#7f1d1d');
  const goldMat = matDavidCached('#facc15', '#ca8a04');

  worldGroup.add(
    createBox(endLimit * 2.4, 1, endLimit * 2.4, cityStoneMat, 0, -0.5, 0, false),
    createBox(26, 0.06, 34, marbleMat, 0, 0.03, -4, false),
    createBox(4.8, 0.06, 28, carpetMat, 0, 0.09, -2, false)
  );

  buildDavidCastleWallPerimeter(endLimit, false);

  [-10.5, 10.5].forEach(px => {
    for (let pz = -14; pz <= 8; pz += 5.5) {
      const col = createBox(1.2, 6.4, 1.2, marbleMat.clone(), px, 3.26, pz);
      const cap = createBox(1.5, 0.45, 1.5, goldMat, px, 6.68, pz);
      worldGroup.add(col, cap);
      wallMeshes.push(col);
    }
  });
  [[-18, 12], [18, 12], [-22, -4], [22, -4], [-18, -18], [18, -18]].forEach(([tx, tz]) => {
    addPalmTree(tx, tz, 1.25, true);
  });

  const throneGrp = createEmptyThroneWithGuideArrow(0, -8);
  throneGrp.position.set(0, 0, -8);
  worldGroup.add(throneGrp);
  davidThroneEnding.throneGroup = throneGrp;
  davidThroneEnding.arrowGroup = throneGrp.userData.arrowGrp;

  addWallTorch(-4.2, 2.2, -5.2);
  addWallTorch( 4.2, 2.2, -5.2);

  if (typeof createFollowerPersonMesh === 'function') {
    for (let i = 0; i < 22; i++) {
      const ang = (i / 22) * Math.PI * 2;
      const rad = (i % 2 === 0) ? 8.8 : 11.4;
      const px = Math.cos(ang) * rad;
      const pz = -5 + Math.sin(ang) * rad;
      if (Math.abs(px) < 3.4 && pz > -5) continue;
      const person = createFollowerPersonMesh(i);
      person.position.set(px, 0, pz);
      person.lookAt(0, 1.8, -8.4);
      worldGroup.add(person);
      endingCelebrationPeople.push({ mesh: person, phase: i * 0.65 });
    }
  }

  targetObject = {
    type: 'david_throne',
    pos: new THREE.Vector3(0, 1.8, -8.4),
    label: createWorldLabel('⬇️ 빈 왕좌 위로 올라가세요! (화살표 위치로 이동)'),
    triggered: false
  };

  playerPos.set(0, 0, 9.5);
  lastGroundedY = 0;
  playerFacing = Math.PI;
  cameraYaw = 0; cameraTargetYaw = 0;
  rebuildPlayerAppearance();
  if (playerGroup) playerGroup.rotation.y = Math.PI;

  setTimeout(() => {
    const certOpenBtn = document.getElementById('cert-open-btn');
    if (certOpenBtn) certOpenBtn.classList.add('hidden');
    const ctxBtn = document.getElementById('context-action-btn');
    if (ctxBtn) ctxBtn.classList.add('hidden');
  }, 0);
}

function seatDavidOnThroneAndShowMessiahVerse() {
  if (davidThroneEnding.seated) return;
  davidThroneEnding.seated = true;
  davidThroneEnding.seatTimer = 0;
  davidThroneEnding.waitingToLeaveThrone = false;

  if (targetObject) targetObject.triggered = true;
  if (targetObject && targetObject.label) targetObject.label.style.opacity = '0';
  if (davidThroneEnding.arrowGroup) davidThroneEnding.arrowGroup.visible = false;
  if (davidThroneEnding.throneGroup && davidThroneEnding.throneGroup.userData.ring) {
    davidThroneEnding.throneGroup.userData.ring.visible = false;
  }
  document.getElementById('context-action-btn').classList.add('hidden');

  if (typeof setPlayerMeshVisibilityForCamera === 'function') {
    setPlayerMeshVisibilityForCamera(false);
  }

  joyX = 0;
  joyY = 0;
  keys = {};
  currentMoveSpeed = 0;
  const knob = document.getElementById('joystick-knob');
  if (knob) knob.style.transform = 'translate(0,0)';

  playerPos.set(0, 1.65, -8.45);
  playerVelY = 0;
  isGrounded = true;
  playerFacing = 0;
  if (playerGroup) {
    playerGroup.position.copy(playerPos);
    playerGroup.rotation.y = 0;
  }
  if (playerLimbs) {
    if (playerLimbs.lLeg) playerLimbs.lLeg.rotation.x = -1.25;
    if (playerLimbs.rLeg) playerLimbs.rLeg.rotation.x = -1.25;
    if (playerLimbs.rArm) playerLimbs.rArm.rotation.x = -1.8;
  }

  playSfx('clear');

  // 이미 한 번 왕좌에 앉아 암전 성경절을 본 뒤, 일어나서 엔딩 세상을 둘러보다가 다시 왕좌로 돌아온 경우:
  // 암전 연출 없이 즉시 월드맵 이동 선택창을 띄움!
  if (davidThroneEnding.modalShown) {
    if (typeof showEndingWorldMapChoiceModal === 'function') {
      showEndingWorldMapChoiceModal();
    } else if (typeof showEndingCertificate === 'function') {
      showEndingCertificate();
    }
    return;
  }

  showToast('👑 다윗왕이 보좌에 올랐습니다!');
}

function updateDavidEndingThroneFrame(dt, now) {
  if (davidOpeningState.active) return;

  // 별도 버튼을 만들지 않도록 하단 컨텍스트 버튼 및 인증서 버튼은 항상 숨김 유지
  const ctxBtn = document.getElementById('context-action-btn');
  if (ctxBtn && !ctxBtn.classList.contains('hidden')) ctxBtn.classList.add('hidden');
  const certOpenBtn = document.getElementById('cert-open-btn');
  if (certOpenBtn && !certOpenBtn.classList.contains('hidden')) certOpenBtn.classList.add('hidden');

  if (!davidThroneEnding.seated) {
    if (davidThroneEnding.arrowGroup && davidThroneEnding.arrowGroup.visible) {
      davidThroneEnding.arrowGroup.position.y = 4.2 + Math.sin(now * 0.006) * 0.42;
      davidThroneEnding.arrowGroup.rotation.y += dt * 2.4;
    }

    if (targetObject) {
      const td = Math.hypot(playerPos.x - targetObject.pos.x, playerPos.z - targetObject.pos.z);

      // 왕좌에서 일어나 밖으로 걸어 나오는 중인 경우: 왕좌에서 충분히 멀어지면(td > 3.2) 다시 왕좌 안내 화살표와 링을 활성화!
      if (davidThroneEnding.waitingToLeaveThrone) {
        if (td > 3.2) {
          davidThroneEnding.waitingToLeaveThrone = false;
          targetObject.triggered = false;
          if (davidThroneEnding.arrowGroup) davidThroneEnding.arrowGroup.visible = true;
          if (davidThroneEnding.throneGroup && davidThroneEnding.throneGroup.userData.ring) {
            davidThroneEnding.throneGroup.userData.ring.visible = true;
          }
          if (targetObject.label) {
            targetObject.label.innerHTML = '👑 다윗의 왕좌 (다시 올라가면 월드맵 이동 선택창이 열려요!)';
          }
        }
        return;
      }

      updateWorldLabelPos(targetObject.label, targetObject.pos, td < 30);

      if (guideArrowGroup && guideArrowGroup.visible) {
        const baseFacing = (window.globalCameraViewMode === 'fps') ? (cameraYaw + Math.PI) : playerFacing;
        guideArrowGroup.rotation.y = Math.atan2(targetObject.pos.x - playerPos.x, targetObject.pos.z - playerPos.z) - baseFacing;
      }

      if (td < 1.85 && playerPos.y >= 0.9) {
        seatDavidOnThroneAndShowMessiahVerse();
      }
    }
    return;
  }

  // 왕좌에 앉아 있는 상태: 암전 성경절 이후 모달창이 닫혔고 플레이어가 이동 조작을 하면 왕좌에서 일어나 걸어 다닐 수 있도록 전환!
  if (davidThroneEnding.modalShown) {
    const endModal = document.getElementById('ending-modal');
    const choiceModal = document.getElementById('ending-map-choice-modal');
    const isAnyModalOpen =
      (endModal && !endModal.classList.contains('hidden')) ||
      (choiceModal && !choiceModal.classList.contains('hidden'));

    if (!isAnyModalOpen && (currentMoveSpeed > 0.08 || !isGrounded)) {
      davidThroneEnding.seated = false;
      davidThroneEnding.waitingToLeaveThrone = true;
      if (playerLimbs) {
        if (playerLimbs.lLeg) playerLimbs.lLeg.rotation.x = 0;
        if (playerLimbs.rLeg) playerLimbs.rLeg.rotation.x = 0;
        if (playerLimbs.rArm) playerLimbs.rArm.rotation.x = 0;
      }
      return;
    }
  }

  davidThroneEnding.seatTimer += dt;
  playerPos.set(0, 1.65, -8.45);
  playerVelY = 0;
  isGrounded = true;
  playerFacing = 0;
  if (playerGroup) {
    playerGroup.position.copy(playerPos);
    playerGroup.rotation.y = (window.globalCameraViewMode === 'fps') ? (cameraYaw + Math.PI) : 0;
  }
  if (playerLimbs) {
    if (playerLimbs.lLeg) playerLimbs.lLeg.rotation.x = -1.25;
    if (playerLimbs.rLeg) playerLimbs.rLeg.rotation.x = -1.25;
    if (playerLimbs.rArm) playerLimbs.rArm.rotation.x = -1.8 + Math.sin(now * 0.008) * 0.35;
  }

  if (!davidThroneEnding.modalShown) {
    camera.position.lerp(new THREE.Vector3(0, 4.8, -1.2), 0.08);
    camera.lookAt(0, 2.5, -8.5);
  }

  if (davidThroneEnding.seatTimer >= 1.10 && !davidThroneEnding.modalShown) {
    davidThroneEnding.modalShown = true;
    startDavidEndingBlackoutAndCert();
  }
}

// -------------------------------------------------------------------------
// 4. 에피소드 3 통합 플러그인 등록 & 액션 버튼 단일 훅 연동
// -------------------------------------------------------------------------
if (!window._davidPuzzleHookRegistered) {
  window._davidPuzzleHookRegistered = true;
  const _origTriggerPuzzleBtn = window.triggerPuzzleBuildOrSwitch;
  window.triggerPuzzleBuildOrSwitch = function () {
    if (currentEpisode === 'david') {
      if (currentStage === 1) {
        performDavidStage1Action();
      } else if (currentStage === 3 && davidActiveNearNpc) {
        openDavidNpcDialog(davidActiveNearNpc);
      }
      return;
    }
    if (typeof _origTriggerPuzzleBtn === 'function') _origTriggerPuzzleBtn();
  };
}

REGISTER_EPISODE('david', {
  locked: true,
  avatarIcon: '🪉',
  scripture: DAVID_SCRIPTURE,
  certMeta: {
    badge: '👑 에피소드 3 : 믿음의 목동 다윗왕 완주!',
    title: '양을 지키던 목동에서 백성을 섬기는 왕으로!',
    verse: '"보라 날이 이르리니 내가 다윗에게 한 의로운 가지를 일으킬 것이라 그가 왕이 되어 지혜롭게 다스리며" (예레미야 23:5)',
    mission: '베들레헴 양 떼 수호, 엘라 골짜기 승리 및 다윗성 백성 섬김 완주',
    prefix: 'DAV-'
  },
  getBaseGroundHeight: function (x, z, st) {
    if (st === 1) return getDavidStage1GroundHeight(x, z);
    return 0;
  },
  scheduleBgmBeat: function (ctx, step, st, mode, playing, timeRem, toFreq) {
    return scheduleDavidBgmBeat(ctx, step, st, mode, playing, timeRem, toFreq);
  },
  createHeroMesh: function () {
    return createDavidHeroMesh();
  },
  onCloseScreen: function () {
    hideAllDavidCustomUI();
    const tracker = document.getElementById('david-st3-quest-tracker');
    if (tracker) tracker.classList.add('hidden');
  },
  clearState: function () {
    hideAllDavidCustomUI();
    const tracker = document.getElementById('david-st3-quest-tracker');
    if (tracker) tracker.classList.add('hidden');
    davidBaseFlock = [];
    davidSheepList = [];
    davidFollowingSheep = [];
    davidPredators = [];
    davidFeedItems = [];
    davidWallMaterials = [];
    davidPlacedWallMat = 0;
    davidWallSectionTiers = [0, 0, 0, 0, 0, 0, 0];
    davidWallPanelPlatforms = [];
    davidSheepEatParticles = [];
    davidVanishingSheepAnims = [];
    davidLostSheepCount = 0;
    davidSlingStones = [];
    davidStonesUnlockedAim = false;
    davidGoliathHazards = [];
    davidPhilistineSoldiers = [];
    davidIsraelSoldiers = [];
    davidCityNpcs = [];
    davidCityResources = [];
    davidRetainers = [];
    davidCityShopkeepers = [];
    davidCityPedestrians = [];
    davidCityBuildingBoxes = [];
    davidStage3KingTrail = [];
    davidCurrentActiveQuestNpc = null;
    davidThroneEnding.seated = false;
    davidThroneEnding.modalShown = false;
    davidThroneEnding.waitingToLeaveThrone = false;
    davidAnointCutscene.active = false;
    davidStage2Cutscene.active = false;
    davidStage3Cutscene.active = false;
    davidStage2Dialogue.active = false;
    davidAimState.active = false;
    davidFlyingStone.active = false;
  },
  getInitialTime: function (st) {
    return st === 1 ? 26.0 : (st === 2 ? 22.0 : 48.0);
  },
  buildStage: function (st) {
    rebuildPlayerAppearance();
    if (st === 1) buildDavidStage1World();
    else if (st === 2) buildDavidStage2World();
    else if (st === 3) buildDavidStage3World();
  },
  buildEndingWorld: function () {
    buildDavidEndingWorld();
  },
  endingToast: '👑 성벽 안 백성들의 환호를 받으며 화살표가 가리키는 빈 왕좌 위로 올라가 보세요!',
  updateHUD: function (st, badge, countIcon, countText, missionText) {
    if (st === 1) {
      updateDavidCarriedItemsVisual();
      badge.textContent = '베들레헴 · 스테이지 1';
      if (davidStage1Phase === 'find_sheep') {
        countIcon.textContent = '🐑';
        countText.textContent = `양 ${davidGatheredSheepCount}/5마리`;
        missionText.textContent = '언덕 위 바위와 나무 뒤에 숨어 있는 양 5마리를 찾아 사각형 목초지로 데려오세요!';
      } else if (davidStage1Phase === 'feed_sheep') {
        countIcon.textContent = '🌿';
        countText.textContent = `배부름 ${Math.round(davidHungerGauge)}%`;
        missionText.textContent = '주변에서 먹이를 찾아 양을 배부르게 해주세요!';
      } else if (davidStage1Phase === 'defend_sheep') {
        countIcon.textContent = '🛡️';
        const curSpec = getDavidTierVisualSpec(Math.min(davidMaxWallTier, davidWallTier + 1));
        countText.textContent = davidWallTier >= davidMaxWallTier
          ? `방어 완료 (${Math.ceil(davidDefenseTimer)}초)`
          : `${curSpec.name} ${davidPlacedWallMat}/7개`;
        missionText.textContent = '담장이 없는 쪽으로 맹수가 오면 양이 사라져요! 지팡이로 쫓아내며 자원 7개씩 모아 담을 쌓으세요!';
      } else {
        countIcon.textContent = '📯';
        countText.textContent = '언덕 아래 집으로';
        missionText.textContent = '북쪽 내리막 오솔길을 따라 언덕 아래 아버지 이새의 집으로 내려가 사무엘 선지자를 만나세요!';
      }
    } else if (st === 2) {
      updateDavidStage2HUD(badge, countIcon, countText, missionText);
    } else if (st === 3) {
      updateDavidStage3HUD(badge, countIcon, countText, missionText);
    } else {
      countIcon.textContent = '👑';
      badge.textContent = '다윗왕의 보좌';
      countText.textContent = '왕좌 등극 👑';
      missionText.textContent = '👑 화살표가 표시된 왕좌 위로 올라가거나 성 안을 자유롭게 둘러보세요!';
    }
  },
  triggerContextAction: function (st, targetObj) {
    if (st === 1) {
      if (davidStage1Phase !== 'go_home') {
        playSfx('wrong');
        showToast('🐑 먼저 언덕 위에서 양 찾기와 먹이 주기, 맹수 디펜스를 모두 마쳐주세요!');
        return;
      }
      targetObj.triggered = true;
      startDavidStage1AnointCutscene();
    } else if (st === 2) {
      triggerDavidStage2Action(targetObj);
    } else if (st === 3) {
      triggerDavidStage3Action(targetObj);
    } else if (st === 4) {
      seatDavidOnThroneAndShowMessiahVerse();
    }
  },
  proceedNextStage: function (st) {
    if (st === 1) {
      currentStage = 2; isPlaying = true;
      if (currentMode === 'timeattack') { timeRemaining = 22.0; timeAttackFirstRechargeUsed = false; isTimeAttackActive = true; }
      rebuildPlayerAppearance();
      buildDavidStage2World();
      startStageBgm(2);
    } else if (st === 2) {
      currentStage = 3; isPlaying = true;
      if (currentMode === 'timeattack') { timeRemaining = 48.0; timeAttackFirstRechargeUsed = false; isTimeAttackActive = true; }
      rebuildPlayerAppearance();
      buildDavidStage3World();
      startStageBgm(3);
    } else {
      const wf = document.getElementById('white-fade');
      if (wf) wf.style.opacity = '1';
      playSfx('dove');
      setTimeout(() => {
        isPlaying = true; isTimeAttackActive = false;
        document.getElementById('hud-timer-box').classList.add('hidden');
        buildEndingWorld();
        setTimeout(() => { if (wf) wf.style.opacity = '0'; }, 350);
      }, 700);
    }
  },
  updateCutsceneFrame: function (dt, now) {
    if (updateDavidAnointCutsceneFrame(dt, now)) return true;
    if (updateDavidStage2CutsceneFrame(dt, now)) return true;
    if (updateDavidStage3CutsceneFrame(dt, now)) return true;
    return false;
  },
  updateStageFrame: function (dt, now, st) {
    if (st === 1) updateDavidStage1Frame(dt, now);
    else if (st === 2) updateDavidStage2Frame(dt, now);
    else if (st === 3) updateDavidStage3Frame(dt, now);
    else if (st === 4) updateDavidEndingThroneFrame(dt, now);
  }
});