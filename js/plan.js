// 안무 데이터 → 19명 자리 배정 · 이동 경로 · 충돌 피하기 · 시간별 위치
(function (root) {
  const MIN_GAP = 0.5;   // 이보다 가까우면 부딪힘(m, 몸 중심 사이)
  const WARN_GAP = 0.65; // 이보다 가까우면 "좁게 지나감"
  const BEAT = 60 / 122.66;
  const MAX_SPEED = 1.25; // m/s — 한 박에 한 걸음(약 1m/s)보다 조금 빠른 정도까지

  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

  // 후보(cands)를 자리(slots)에 배정: 이동 거리 합이 가장 작게(선이 엇갈리지 않음)
  function assign(cands, slots, prevPos) {
    const n = slots.length, m = cands.length;
    const cost = (c, s) => { const p = prevPos[c]; return p ? dist(p, slots[s]) : 0; };
    // 탐욕 시작
    const pairs = [];
    for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) pairs.push([cost(cands[i], j), i, j]);
    pairs.sort((a, b) => a[0] - b[0]);
    const slotOf = new Array(m).fill(-1), candOf = new Array(n).fill(-1);
    for (const [, i, j] of pairs) if (slotOf[i] < 0 && candOf[j] < 0) { slotOf[i] = j; candOf[j] = i; }
    // 교환으로 개선
    let improved = true, guard = 0;
    while (improved && guard++ < 200) {
      improved = false;
      for (let a = 0; a < m; a++) for (let b = a + 1; b < m; b++) {
        const sa = slotOf[a], sb = slotOf[b];
        if (sa < 0 && sb < 0) continue;
        const cur = (sa >= 0 ? cost(cands[a], sa) : 0) + (sb >= 0 ? cost(cands[b], sb) : 0);
        const alt = (sb >= 0 ? cost(cands[a], sb) : 0) + (sa >= 0 ? cost(cands[b], sa) : 0);
        if (alt < cur - 1e-9) { slotOf[a] = sb; slotOf[b] = sa; if (sa >= 0) candOf[sa] = b; if (sb >= 0) candOf[sb] = a; improved = true; }
      }
    }
    const out = {};
    for (let j = 0; j < n; j++) out[cands[candOf[j]]] = slots[j];
    return out;
  }

  function resolveFormations(D) {
    const all = D.GIRLS.concat(D.BOYS);
    let prev = {};
    return D.F.map((f, fi) => {
      const pos = {};
      for (const [id, s] of Object.entries(f.pins || {})) pos[+id] = s;
      for (const id of f.keep || []) pos[id] = prev[id];
      const pinned = Object.values(f.pins || {});
      for (const g of f.groups || []) {
        const cands = (g.pick === "rest" ? all : g.pick).filter(id => !pos[id]);
        g.slots = g.slots.filter(sl => !pinned.some(pp => Math.abs(pp[0] - sl[0]) < 0.01 && Math.abs(pp[1] - sl[1]) < 0.01));
        if (f.ordered) cands.forEach((id, i) => { if (g.slots[i]) pos[id] = g.slots[i]; });
        else Object.assign(pos, assign(cands, g.slots, prev));
      }
      for (const id of all) if (!pos[id]) throw new Error(`${f.id}: ${id}번 자리 없음`);
      const P = {};
      for (const id of all) P[id] = { x: pos[id][0], y: pos[id][1], tag: pos[id][2] };
      prev = Object.fromEntries(all.map(id => [id, [P[id].x, P[id].y, P[id].tag]]));
      return Object.assign({}, f, { pos: P, index: fi });
    });
  }

  // ---------- 경로 ----------
  function routePoints(p0, p1, route) {
    const dx = p1[0] - p0[0], dy = p1[1] - p0[1], L = Math.hypot(dx, dy) || 1;
    const nx = -dy / L, ny = dx / L; // 진행 방향 왼쪽(객석 기준 좌표계)
    const mid = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2];
    switch (route) {
      case "hv": return [p0, [p1[0], p0[1]], p1];
      case "vh": return [p0, [p0[0], p1[1]], p1];
      case "o+": return [p0, [mid[0] + nx * 0.8, mid[1] + ny * 0.8], p1];
      case "o-": return [p0, [mid[0] - nx * 0.8, mid[1] - ny * 0.8], p1];
      case "O+": return [p0, [mid[0] + nx * 1.4, mid[1] + ny * 1.4], p1];
      case "O-": return [p0, [mid[0] - nx * 1.4, mid[1] - ny * 1.4], p1];
      case "bk": { const yb = Math.max(0.4, Math.min(p0[1], p1[1]) - 0.8); return [p0, [p0[0], yb], [p1[0], yb], p1]; }
      case "fr": { const yf = Math.min(5.8, Math.max(p0[1], p1[1]) + 0.7); return [p0, [p0[0], yf], [p1[0], yf], p1]; }
      default: return [p0, p1];
    }
  }
  const ROUTES = ["s", "o+", "o-", "hv", "vh", "O+", "O-", "bk", "fr"];
  const polyLen = pts => { let s = 0; for (let i = 1; i < pts.length; i++) s += dist(pts[i - 1], pts[i]); return s; };
  function pointAt(pts, s) {
    for (let i = 1; i < pts.length; i++) {
      const d = dist(pts[i - 1], pts[i]);
      if (s <= d || i === pts.length - 1) { const k = d ? Math.min(1, s / d) : 1; return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k]; }
      s -= d;
    }
    return pts[pts.length - 1];
  }
  function moverPos(m, t) {
    if (!m.moving) return m.p0;
    const start = m.t0 + m.delay, dur = m.t1 - start;
    const k = Math.max(0, Math.min(1, (t - start) / dur));
    const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; // 부드럽게 출발·도착
    return pointAt(m.pts, e * m.len);
  }

  function checkPair(a, b, t0, t1) {
    let min = 1e9, tmin = t0;
    for (let t = t0; t <= t1 + 1e-9; t += 0.05) { const d = dist(moverPos(a, t), moverPos(b, t)); if (d < min) { min = d; tmin = t; } }
    return { min, tmin };
  }

  function planTransition(A, B, ids, pre) {
    const t0 = A.tout, t1 = B.tin, D = t1 - t0;
    const M = {};
    for (const id of ids) {
      const p0 = [A.pos[id].x, A.pos[id].y], p1 = [B.pos[id].x, B.pos[id].y];
      const moving = dist(p0, p1) > 0.05;
      M[id] = { id, p0, p1, t0, t1, moving, route: "s", delay: 0, pts: [p0, p1], len: dist(p0, p1) };
    }
    const movers = ids.filter(id => M[id].moving).sort((a, b) => M[b].len - M[a].len);
    if (pre) { // 미리 계산한 경로 사용(브라우저에서 빠르게)
      for (const id of ids) if (pre[id]) { const [route, ds] = pre[id]; const pts = routePoints(M[id].p0, M[id].p1, route); Object.assign(M[id], { route, delay: ds * BEAT, pts, len: polyLen(pts) }); }
    }
    const maxDelaySteps = Math.max(0, Math.min(6, Math.floor((D - 0.8) / BEAT)));
    const conflictsOf = (id) => {
      let c = 0, worst = 1e9;
      for (const o of ids) { if (o === id) continue; if (!M[id].moving && !M[o].moving) continue; const r = checkPair(M[id], M[o], t0, t1); if (r.min < MIN_GAP) { c++; } worst = Math.min(worst, r.min); }
      return { c, worst };
    };
    for (let pass = 0; pass < (pre ? 0 : 6); pass++) {
      let any = false;
      for (const id of movers) {
        const cur = conflictsOf(id);
        if (cur.c === 0) continue;
        any = true;
        let best = null;
        for (const route of ROUTES) for (let ds = 0; ds <= maxDelaySteps; ds++) {
          const pts = routePoints(M[id].p0, M[id].p1, route), len = polyLen(pts), delay = ds * BEAT;
          if (pts.some(p => p[1] < 0.2 || p[1] > 5.9 || p[0] < -1.2 || p[0] > 11.2)) continue;
          if (len / (D - delay) > MAX_SPEED) continue; // 너무 빠르면 안 됨
          const save = { route: M[id].route, delay: M[id].delay, pts: M[id].pts, len: M[id].len };
          Object.assign(M[id], { route, delay, pts, len });
          const r = conflictsOf(id);
          const score = r.c * 1000 + ds * 3 + (route === "s" ? 0 : route[0] === "o" ? 2 : 4) + (len - dist(M[id].p0, M[id].p1)) - Math.min(r.worst, WARN_GAP) * 2;
          if (!best || score < best.score) best = { score, route, delay, pts, len };
          Object.assign(M[id], save);
        }
        if (best) Object.assign(M[id], { route: best.route, delay: best.delay, pts: best.pts, len: best.len });
      }
      if (!any) break;
    }
    // 둘이 서로 엇갈릴 때: 두 사람의 경로·출발 박을 함께 바꿔 보기
    const options = (id) => {
      const out = [];
      for (const route of ROUTES) for (let ds = 0; ds <= maxDelaySteps; ds++) {
        const pts = routePoints(M[id].p0, M[id].p1, route), len = polyLen(pts), delay = ds * BEAT;
        if (pts.some(p => p[1] < 0.2 || p[1] > 5.9 || p[0] < -1.2 || p[0] > 11.2)) continue;
        if (len / (D - delay) > MAX_SPEED) continue;
        out.push({ route, delay, pts, len, cost: ds * 3 + (route === "s" ? 0 : route[0] === "o" ? 2 : 4) + (len - dist(M[id].p0, M[id].p1)) });
      }
      return out;
    };
    for (let round = 0; round < (pre ? 0 : 3); round++) {
      let fixed = false;
      for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
        const a = ids[i], b = ids[j];
        if (!M[a].moving && !M[b].moving) continue;
        if (checkPair(M[a], M[b], t0, t1).min >= MIN_GAP) continue;
        const oa = M[a].moving ? options(a) : [null], ob = M[b].moving ? options(b) : [null];
        const saveA = { route: M[a].route, delay: M[a].delay, pts: M[a].pts, len: M[a].len };
        const saveB = { route: M[b].route, delay: M[b].delay, pts: M[b].pts, len: M[b].len };
        const base = conflictsOf(a).c + conflictsOf(b).c;
        let best = null;
        for (const x of oa) {
          if (x) Object.assign(M[a], x);
          for (const y of ob) {
            if (y) Object.assign(M[b], y);
            if (checkPair(M[a], M[b], t0, t1).min < MIN_GAP) continue;
            const c = conflictsOf(a).c + conflictsOf(b).c;
            if (c >= base) continue;
            const score = c * 1000 + (x ? x.cost : 0) + (y ? y.cost : 0);
            if (!best || score < best.score) best = { score, x, y };
          }
          Object.assign(M[b], saveB);
        }
        Object.assign(M[a], saveA);
        if (best) { if (best.x) Object.assign(M[a], best.x); if (best.y) Object.assign(M[b], best.y); fixed = true; }
      }
      if (!fixed) break;
    }
    // 결과: 남은 충돌, 좁은 곳, 누가 누구 뒤로 지나가는지
    const issues = [], near = {};
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
      const a = M[ids[i]], b = M[ids[j]];
      if (!a.moving && !b.moving) continue;
      const r = checkPair(a, b, t0, t1);
      const ends = Math.min(dist(a.p0, b.p0), dist(a.p1, b.p1));
      if (r.min < MIN_GAP) issues.push({ kind: "충돌", a: a.id, b: b.id, d: r.min, t: r.tmin });
      else if (r.min < WARN_GAP && r.min < ends - 0.08) issues.push({ kind: "좁음", a: a.id, b: b.id, d: r.min, t: r.tmin });
      if (r.min < 1.1) {
        const pa = moverPos(a, r.tmin), pb = moverPos(b, r.tmin);
        const rel = pa[1] < pb[1] - 0.15 ? "behind" : pa[1] > pb[1] + 0.15 ? "front" : "side";
        (near[a.id] = near[a.id] || []).push({ other: b.id, rel, d: r.min, t: r.tmin, otherMoving: b.moving });
        const relB = rel === "behind" ? "front" : rel === "front" ? "behind" : "side";
        (near[b.id] = near[b.id] || []).push({ other: a.id, rel: relB, d: r.min, t: r.tmin, otherMoving: a.moving });
      }
    }
    for (const id of ids) if (near[id]) near[id].sort((x, y) => x.d - y.d);
    // 늦게 출발하는 이유: 먼저 지나가는 친구
    for (const id of ids) {
      const m = M[id];
      if (m.moving && m.delay > 0) {
        const cand = (near[id] || []).filter(n => n.otherMoving && M[n.other].delay < m.delay);
        m.waitFor = cand.length ? cand[0].other : null;
      }
    }
    return { from: A.index, to: B.index, t0, t1, movers: M, issues, near };
  }

  function build(D, pre) {
    const forms = resolveFormations(D);
    const ids = D.GIRLS.concat(D.BOYS);
    const trans = [];
    for (let i = 0; i < forms.length - 1; i++) trans.push(planTransition(forms[i], forms[i + 1], ids, pre && pre[i]));
    // 박 목록 (4초 넘으면 나눔)
    const beats = [];
    D.S.forEach((sec, si) => sec.beats.forEach(([a, b, cue, map], bi) => {
      const n = Math.max(1, Math.ceil((b - a) / 4 - 1e-6));
      for (let k = 0; k < n; k++) beats.push({ sec: si, t0: a + (b - a) * k / n, t1: a + (b - a) * (k + 1) / n, cue: n > 1 ? `${cue}${k ? " (계속 " + (k + 1) + "/" + n + ")" : " (1/" + n + ")"}` : cue, map, part: k, parts: n });
    }));
    beats.forEach((b, i) => b.index = i);
    // 정적 대형 간격 검사
    const staticIssues = [];
    forms.forEach(f => {
      for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
        const a = f.pos[ids[i]], b = f.pos[ids[j]], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 0.55) staticIssues.push({ form: f.id, a: ids[i], b: ids[j], d });
      }
    });

    function formAt(t) { // 가장 최근에 도착한 대형
      let k = 0; for (let i = 0; i < forms.length; i++) if (forms[i].tin <= t + 1e-6) k = i; return forms[k];
    }
    function transAt(t) { return trans.find(tr => t >= tr.t0 - 1e-6 && t <= tr.t1 + 1e-6 && tr.t1 > tr.t0) || null; }
    function posAt(id, t) {
      const tr = transAt(t);
      if (tr) return moverPos(tr.movers[id], t);
      const f = t < forms[0].tin ? forms[0] : formAt(t); return [f.pos[id].x, f.pos[id].y];
    }
    function beatAt(t) { let r = beats[0]; for (const b of beats) if (b.t0 <= t + 1e-6) r = b; return r; }
    function tagOf(id, t) { return formAt(t).pos[id].tag; }
    function presetFor(id, beat) {
      const tag = tagOf(id, beat.t0), m = beat.map;
      const key = m["#" + id] || m[tag] || m[id <= 10 ? "G" : "B"] || m.all;
      return key ? D.P[key] ? Object.assign({ key }, D.P[key]) : null : null;
    }
    // 이 박 동안 이 사람의 이동(겹치는 전환)
    function moveDuring(id, beat) {
      for (const tr of trans) {
        const m = tr.movers[id];
        if (!m.moving) continue;
        const s = tr.t0 + m.delay;
        if (s < beat.t1 - 0.05 && tr.t1 > beat.t0 + 0.05) return { tr, m };
      }
      return null;
    }
    const exportRoutes = () => trans.map(tr => Object.fromEntries(Object.values(tr.movers).filter(m => m.moving && (m.route !== "s" || m.delay > 0)).map(m => [m.id, [m.route, Math.round(m.delay / BEAT)]])));
    return { forms, trans, beats, staticIssues, exportRoutes, posAt, beatAt, formAt, transAt, tagOf, presetFor, moveDuring, ids, BEAT };
  }

  const API = { build, dist, MIN_GAP, WARN_GAP };
  if (typeof module !== "undefined" && module.exports) module.exports = API; else root.PLAN = API;
})(typeof window !== "undefined" ? window : globalThis);
