// 인원수(여·남)와 무대 크기를 넣으면 대형을 계산해 주는 안무 생성기
// 자리를 좌표로 적어 두는 대신 "규칙"(줄 · 부채꼴 · 모둠)으로 만들어, 사람 수가 달라져도 같은 모양이 나옵니다.
// 반환값은 js/choreo.js와 같은 모양이라 js/plan.js · js/figures.js · 화면 코드를 그대로 씁니다.
(function (root) {
  const MIN_GAP = 0.72; // 대형에서 옆 사람과 최소 간격(m) — 사이로 지나갈 수 있게 넉넉히
  const seq = (a, b) => { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // 같은 인원이면 언제나 같은 대형이 나오도록 하는 난수(고정 씨앗)
  function rngOf(seed) { let x = seed * 1664525 + 1013904223; return () => { x = (x * 1664525 + 1013904223) % 4294967296; return x / 4294967296; }; }

  function make(nG, nB, stage, base) {
    const BASE = base || root.CHOREO;
    const W = (stage && stage.W) || 10, D = (stage && stage.D) || 6;
    const rnd = rngOf(nG * 131 + nB * 17 + Math.round(W * 10) + Math.round(D * 3));
    const N = nG + nB;
    const G = seq(1, nG), B = seq(nG + 1, nG + nB), ALL = G.concat(B);
    const cx = W / 2, xMin = 0.6, xMax = W - 0.6, wide = xMax - xMin;
    const Y = f => +(D * f).toFixed(3);
    const X = f => +(xMin + wide * f).toFixed(3);
    const spreadK = Math.min(1.9, Math.max(1, (nG + nB) / 19));   // 인원이 많으면 옆으로 더 넓게
    const Xw = f => X(0.5 + (f - 0.5) * spreadK);                  // 가운데 기준으로 넓힌 위치

    // ---------- 역할 (인원이 적으면 남녀를 섞어서라도 채움) ----------
    const used = new Set();
    const take = (...pools) => {
      for (const pool of pools.concat([ALL])) for (const id of pool || []) if (!used.has(id)) { used.add(id); return id; }
      return ALL[0];
    };
    const gRev = G.slice().reverse(), bRev = B.slice().reverse();
    const R = {};
    R.solo = take(G, B);          // 시작 솔로(가운데)
    R.spinL = take(gRev, bRev);   // 왼쪽 회전
    R.spinR = take(gRev, bRev);   // 오른쪽 회전
    R.pillar = take(bRev, gRev);  // 가운데 기둥
    R.stack = take(G, B);         // 층층 부채 솔로
    R.duetA = R.stack;
    R.duetB = take(G, B);         // 듀엣 짝
    if (R.duetB === R.duetA) R.duetB = ALL.find(id => id !== R.duetA) || R.duetA;   // 짝은 서로 다른 사람
    if (R.spinR === R.spinL) R.spinR = ALL.find(id => id !== R.spinL) || R.spinL;
    // 언제나 따로 자리를 주는 사람들
    const FIXED = [R.solo, R.spinL, R.spinR, R.pillar];
    const gOf = ex => G.filter(id => !ex.includes(id));
    const bOf = ex => B.filter(id => !ex.includes(id));

    // ---------- 자리 만들기 ----------
    const P = (x, y, tag) => [+clamp(x, -1.2, W + 1.2).toFixed(3), +clamp(y, 0.55, D - 0.7).toFixed(3), tag];
    function spread(n, x0, x1) {
      if (n <= 0) return [];
      if (n === 1) return [(x0 + x1) / 2];
      const o = []; for (let i = 0; i < n; i++) o.push(x0 + (x1 - x0) * i / (n - 1));
      return o;
    }
    // 한 줄 — 너무 좁으면 두 줄로 자동으로 나눔
    function row(n, y, tag, opt) {
      opt = opt || {};
      const x0 = opt.x0 != null ? opt.x0 : xMin, x1 = opt.x1 != null ? opt.x1 : xMax;
      const gap = opt.gap || MIN_GAP, back = opt.back || 0.85;
      if (n <= 0) return [];
      if (n === 1) return [P((x0 + x1) / 2, y, tag)];
      if ((x1 - x0) / (n - 1) >= gap) return spread(n, x0, x1).map(x => P(x, y, tag));
      const n1 = Math.ceil(n / 2), n2 = n - n1, sh = (x1 - x0) / (2 * Math.max(1, n1 - 1));
      return spread(n1, x0, x1).map(x => P(x, y, tag)).concat(spread(n2, x0 + sh, x1 - sh).map(x => P(x, y - back, tag)));
    }
    // 부채꼴 — 각도 0 = 객석에서 볼 때 오른쪽, 90 = 무대 앞
    function arcAt(n, ccx, ccy, a0, a1, tag, r) {
      const o = [];
      if (n === 1) { const a = (a0 + a1) / 2 * Math.PI / 180; return [P(ccx + r * Math.cos(a), ccy + r * Math.sin(a), tag)]; }
      for (let i = 0; i < n; i++) { const a = (a0 + (a1 - a0) * i / (n - 1)) * Math.PI / 180; o.push(P(ccx + r * Math.cos(a), ccy + r * Math.sin(a), tag)); }
      return o;
    }
    // 부채꼴 — 한 겹에 다 못 앉으면 두세 겹으로
    function arcFit(n, ccx, ccy, a0, a1, tag, minR, maxR) {
      minR = minR || 0.9;
      maxR = maxR || Math.max(minR + 0.6, Math.min(W * 0.42, D * 0.6));   // 무대를 벗어나지 않게
      if (n <= 0) return [];
      const span = Math.abs(a1 - a0) * Math.PI / 180;
      const need = k => k > 1 ? MIN_GAP / (2 * Math.sin(Math.max(0.03, span / (k - 1) / 2))) : minR;
      if (!maxR) return arcAt(n, ccx, ccy, a0, a1, tag, Math.max(minR, need(n)));
      const cap = Math.max(2, Math.floor(span * maxR / MIN_GAP) + 1);
      if (n <= cap) return arcAt(n, ccx, ccy, a0, a1, tag, Math.max(minR, Math.min(maxR, need(n))));
      const rings = Math.ceil(n / cap), out = [];
      let left = n;
      for (let k = 0; k < rings; k++) {
        const take2 = Math.ceil(left / (rings - k)), r = Math.max(minR, maxR - k * 0.85);
        out.push(...arcAt(take2, ccx, ccy, a0 + (k % 2) * 3, a1 - (k % 2) * 3, tag, r));
        left -= take2;
      }
      return out;
    }
    // 모둠 꽃: 가운데(core) 1명 + 둘레(petal)
    function cluster(n, ccx, ccy, coreTag, petalTag) {
      if (n <= 0) return [];
      const o = [P(ccx, ccy - 0.35, coreTag || "core")];
      if (n > 1) o.push(...arcFit(n - 1, ccx, ccy + 0.15, 170, 10, petalTag || "petal", 0.85));
      return o;
    }
    // 네모 모둠(좌·우 끝)
    function block(n, ccx, ccy, tag, cols, gap) {
      gap = gap || 0.75;
      // 무대 밖으로 나가지 않게 칸 수를 정하고, 넘치면 뒤쪽 줄로 보냄
      const room = Math.max(1.2, Math.min(ccx - 0.5, W - 0.5 - ccx) * 2 + gap);
      cols = cols || Math.max(2, Math.min(Math.floor(room / gap), Math.max(2, Math.round(Math.sqrt(n)))));
      const rowsFit = Math.max(1, Math.floor((ccy - 0.7) / gap) + 1);
      const fit = Math.min(n, cols * rowsFit), o = [];
      for (let i = 0; i < fit; i++) o.push(P(ccx + (i % cols - (cols - 1) / 2) * gap, ccy - Math.floor(i / cols) * gap, tag));
      if (n > fit) o.push(...row(n - fit, 0.75, tag, { x0: xMin, x1: xMax, gap: 0.7 }));
      return o;
    }
    function colSlots(n, x, tag) {
      tag = tag || "train";
      const y0 = Y(0.42), y1 = D - 0.7, len = y1 - y0;
      if (n <= 1) return n ? [P(x, (y0 + y1) / 2, tag)] : [];
      if (len / (n - 1) >= 0.7) { const o = []; for (let i = 0; i < n; i++) o.push(P(x, y0 + len * i / (n - 1), tag)); return o; }
      const n1 = Math.ceil(n / 2), n2 = n - n1, o = [];       // 두 겹으로 (좌·우 35cm씩)
      for (let i = 0; i < n1; i++) o.push(P(x - 0.36, y0 + len * i / Math.max(1, n1 - 1), tag));
      for (let i = 0; i < n2; i++) o.push(P(x + 0.36, y0 + 0.35 + len * i / Math.max(1, n2 - 1) * 0.94, tag));
      return o;
    }
    const halves = a => [a.slice(0, Math.ceil(a.length / 2)), a.slice(Math.ceil(a.length / 2))];
    // 앞 한 줄 + 그 사이사이(뒷줄). 여학생이 3명보다 적으면 전원으로 줄을 만듦
    const lineIds = nG >= 3 ? G : ALL;
    const backIds = ALL.filter(id => !lineIds.includes(id));
    function lineSlots() { return row(lineIds.length, Y(0.72), "line"); }
    function gapRow(n, y, tag) {
      if (n <= 0) return [];
      const front = lineSlots().filter(s2 => Math.abs(s2[1] - Y(0.72)) < 0.01).map(s2 => s2[0]).sort((a, b) => a - b);
      const gaps = []; for (let i = 0; i < front.length - 1; i++) gaps.push((front[i] + front[i + 1]) / 2);
      if (gaps.length >= n) return spread(n, 0, gaps.length - 1).map(v => P(gaps[Math.round(v)], y, tag));
      return row(n, y, tag, { x0: X(0.05), x1: X(0.95) });
    }
    // 지그재그 한 줄
    function zig(shift) {
      const xs = spread(N, xMin + shift, xMax - 0.8 + shift), dx = xs.length > 1 ? Math.abs(xs[1] - xs[0]) : 1;
      const dy = Math.max(0.45, Math.sqrt(Math.max(0.05, MIN_GAP * MIN_GAP - dx * dx)));
      return xs.map((x, i) => P(x, Y(0.58) + (i % 2 ? dy : 0), i % 2 ? "pairB" : "pairA"));
    }

    const F = [];
    let boyStart = [];
    // 자리 밀어내기: 너무 붙은 자리를 서로 밀어 간격을 만들고, 원래 모양으로 살짝 당겨 둠
    function relax(f) {
      const pts = [];
      for (const k of Object.keys(f.pins || {})) { const a = f.pins[k]; if (a[0] > -0.3 && a[0] < W + 0.3) pts.push({ a, fix: true }); }
      for (const a of f.obstacles || []) if (a[0] > -0.3 && a[0] < W + 0.3) pts.push({ a: a.slice(), fix: true });
      for (const g of f.groups || []) for (const a of g.slots) if (a[0] > -0.3 && a[0] < W + 0.3) pts.push({ a, fix: false, hx: a[0], hy: a[1] });
      const GAP = MIN_GAP + 0.03;
      for (let it = 0; it < 140; it++) {
        let moved = 0;
        for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
          const p = pts[i], q = pts[j];
          if (p.fix && q.fix) continue;
          let dx = q.a[0] - p.a[0], dy = q.a[1] - p.a[1];
          let d = Math.hypot(dx, dy);
          if (d >= GAP) continue;
          if (d < 1e-4) { dx = (rnd() - 0.5) * 0.02; dy = (rnd() - 0.5) * 0.02; d = Math.hypot(dx, dy) || 1e-4; }
          const push = (GAP - d) / d * 0.5, mx = dx * push, my = dy * push;
          const wp = p.fix ? 0 : q.fix ? 1 : 0.5, wq = q.fix ? 0 : p.fix ? 1 : 0.5;
          p.a[0] -= mx * wp * 2; p.a[1] -= my * wp * 2;
          q.a[0] += mx * wq * 2; q.a[1] += my * wq * 2;
          moved++;
        }
        for (const p of pts) {
          if (p.fix) continue;
          p.a[0] += (p.hx - p.a[0]) * 0.04; p.a[1] += (p.hy - p.a[1]) * 0.04;
          p.a[0] = clamp(p.a[0], 0.45, W - 0.45); p.a[1] = clamp(p.a[1], 0.55, D - 0.7);
        }
        if (!moved) break;
      }
      for (const p of pts) { p.a[0] = +p.a[0].toFixed(3); p.a[1] = +p.a[1].toFixed(3); }
      return f;
    }
    // 인원 맞춤 대형은 앞 구간에서 조금 일찍 움직이기 시작(자리 잡을 시간을 벌기 위해)
    const add = o => {
      const hold = o.tout - o.tin;
      const lead = (nG + nB) > 24 ? Math.min(2.2, hold * 0.32) : Math.min(1.2, hold * 0.2);
      if (hold > 2.5) o.tout = +(o.tout - lead).toFixed(2);
      F.push(relax(o));
    };

    // 1 시작 자세
    {
      const wait = gOf(FIXED), bs = bOf(FIXED), [bl, br] = halves(bs);
      const n1 = wait.length > 7 ? Math.ceil(wait.length / 2) : wait.length, n2 = wait.length - n1;
      boyStart = block(bl.length, X(0.12), Y(0.82), "crouch").concat(block(br.length, X(0.88), Y(0.82), "crouch"));
      add({ id: "start", name: "시작 자세", tin: 5, tout: 21.3, ordered: true,
        pins: { [R.solo]: P(cx, Y(0.72), "solo"), [R.spinL]: P(-0.9, Y(0.86), "offL"), [R.spinR]: P(W + 0.9, Y(0.86), "offR"), [R.pillar]: P(cx, Y(0.25), "boyC") },
        groups: [
          { pick: wait, slots: spread(n1, xMin, Math.max(xMin + 1, cx - 1.3)).map((x, i) => P(x, Y(0.2) + i * 0.17, "waitLine"))
            .concat(spread(n2, xMin + 0.5, Math.max(xMin + 1.5, cx - 0.9)).map((x, i) => P(x, Y(0.34) + i * 0.17, "waitLine"))) },
          { pick: bl, slots: block(bl.length, X(0.12), Y(0.82), "crouch") },
          { pick: br, slots: block(br.length, X(0.88), Y(0.82), "crouch") }
        ] });
    }
    // 2 솔로 둘러싸기
    {
      const wait = gOf(FIXED);
      add({ id: "gather", name: "솔로 둘러싸기", tin: 26.0, tout: 29.0, ordered: true, keep: bOf(FIXED), obstacles: boyStart,
        pins: { [R.solo]: P(cx, Y(0.72), "solo"), [R.spinL]: P(-0.9, Y(0.86), "offL"), [R.spinR]: P(W + 0.9, Y(0.86), "offR"), [R.pillar]: P(cx, Y(0.25), "boyC") },
        groups: [{ pick: wait, slots: arcFit(wait.length, cx, Y(0.68), 195, 345, "ring", 1.1) }] });
    }
    // 3 반원 무릎 · 남자 일어나기
    {
      const wait = gOf(FIXED), [bl, br] = halves(bOf(FIXED));
      add({ id: "kneelArc", name: "반원 무릎 · 남자 일어나기", tin: 30.0, tout: 40.0,
        pins: { [R.solo]: P(cx, Y(0.73), "solo"), [R.spinL]: P(-0.9, Y(0.86), "offL"), [R.spinR]: P(W + 0.9, Y(0.86), "offR"), [R.pillar]: P(cx, Y(0.28), "boyC") },
        groups: [
          { pick: wait, slots: arcFit(wait.length, cx, Y(0.66), 195, 345, "ring", 1.5) },
          { pick: bl, slots: row(bl.length, Y(0.65), "boysL", { x0: xMin, x1: X(0.25) }) },
          { pick: br, slots: row(br.length, Y(0.65), "boysR", { x0: X(0.75), x1: xMax }) }
        ] });
    }
    // 4 좌우 회전 · 두 층 꽃
    {
      const gs = gOf([R.spinL, R.spinR, R.pillar]), [bl, br] = halves(bOf([R.spinL, R.spinR, R.pillar]));
      const f = Math.ceil(gs.length / 2);
      add({ id: "spinEnter", name: "좌우 회전 · 두 층 꽃", tin: 44.5, tout: 58.8,
        pins: { [R.spinL]: P(X(0.16), Y(0.84), "spinL"), [R.spinR]: P(X(0.84), Y(0.84), "spinR"), [R.pillar]: P(cx, Y(0.3), "boyC") },
        groups: [
          { pick: gs, slots: arcFit(f, cx, Y(0.72), 205, 335, "front", 1.1).concat(arcFit(gs.length - f, cx, Y(0.54), 200, 340, "back", 1.3)) },
          { pick: bl, slots: row(bl.length, Y(0.56), "boysL", { x0: xMin, x1: X(0.25) }) },
          { pick: br, slots: row(br.length, Y(0.56), "boysR", { x0: X(0.75), x1: xMax }) }
        ] });
    }
    // 5 가운데 큰 꽃
    {
      const gs = gOf([R.spinL, R.pillar]), [bl, br] = halves(bOf([R.spinL, R.pillar]));
      const f = Math.max(1, Math.round(gs.length * 0.4)), bk = gs.length - f;
      const back = arcFit(bk, cx, Y(0.58), 200, 340, "back", 1.25);
      if (back.length) back[Math.floor(back.length / 2)][2] = "bud";
      add({ id: "bigFlower", name: "가운데 큰 꽃", tin: 61.2, tout: 71.8,
        pins: { [R.spinL]: P(X(0.2), Y(0.72), "endL"), [R.pillar]: P(cx, Y(0.37), "boyC") },
        groups: [
          { pick: gs, slots: arcFit(f, cx, Y(0.78), 210, 330, "front", 1.0).concat(back) },
          { pick: bl, slots: block(bl.length, X(0.08), Y(0.8), "pillarF").map((s, i) => [s[0], s[1], i < 2 ? "pillarF" : "pillarB"]) },
          { pick: br, slots: block(br.length, X(0.92), Y(0.8), "pillarF").map((s, i) => [s[0], s[1], i < 2 ? "pillarF" : "pillarB"]) }
        ] });
    }
    // 6 두 줄 · 끝 날개
    {
      const gs = gOf([R.spinL, R.spinR, R.pillar]), [bl, br] = halves(bOf([R.spinL, R.spinR, R.pillar]));
      const f = Math.max(1, Math.round(gs.length * 0.38));
      add({ id: "twoRows", name: "두 줄 · 끝 날개", tin: 73.6, tout: 83.2,
        pins: { [R.spinL]: P(X(0.17), Y(0.72), "wing"), [R.spinR]: P(X(0.83), Y(0.72), "wing"), [R.pillar]: P(cx, Y(0.37), "boyC") },
        groups: [
          { pick: gs, slots: row(gs.length - f, Y(0.55), "back", { x0: Xw(0.26), x1: Xw(0.74) }).concat(row(f, Y(0.83), "front", { x0: Xw(0.36), x1: Xw(0.64) })) },
          { pick: bl, slots: block(bl.length, X(0.07), Y(0.85), "kneelB") },
          { pick: br, slots: block(br.length, X(0.93), Y(0.85), "kneelB") }
        ] });
    }
    // 7 네 줄 기차
    {
      const [bl, br] = halves(bOf([R.pillar])), [g1, g2] = halves(G);
      add({ id: "trains", name: "네 줄 기차", tin: 86.0, tout: 103.0,
        pins: { [R.pillar]: P(cx, Y(0.67), "train") },
        groups: [
          { pick: bl, slots: colSlots(bl.length, X(0.08)) },
          { pick: br, slots: colSlots(br.length, X(0.92)) },
          { pick: G, slots: colSlots(g1.length, X(0.33)).concat(colSlots(g2.length, X(0.67))) }
        ] });
    }
    // 8·9 한 줄 · 옆걸음 띠
    for (const [id, name, tin, tout, sh] of [["lineL", "한 줄 짝 마주 보기", 104.6, 107.0, 0], ["lineR", "옆걸음 띠(오른쪽으로)", 117.0, 121.0, 0.8]]) {
      const z = zig(sh), iL = Math.max(0, Math.min(z.length - 1, Math.floor(N * 0.25))), iR = Math.max(0, Math.min(z.length - 1, Math.floor(N * 0.72)));
      add({ id, name, tin, tout, pins: { [R.spinL]: z[iL], [R.spinR]: z[iR] },
        groups: [{ pick: "rest", slots: z.filter((_, i) => i !== iL && i !== iR) }] });
    }
    // 10 네 그룹 꽃
    {
      const [bl, br] = halves(bOf([R.spinL, R.spinR, R.pillar])), [g1, g2] = halves(gOf([R.spinL, R.spinR]));
      const cL = P(X(0.1), Y(0.65) - 0.35, "core"), cR = P(X(0.9), Y(0.65) - 0.35, "core"), cM = P(X(0.66), Y(0.65) - 0.35, "core");
      add({ id: "clusters", name: "네 그룹 꽃", tin: 123.6, tout: 139.0,
        pins: { [R.spinL]: cL, [R.spinR]: cR, [R.pillar]: cM },
        groups: [
          { pick: bl, slots: cluster(bl.length + 1, X(0.1), Y(0.65)).slice(1) },
          { pick: br, slots: cluster(br.length + 1, X(0.9), Y(0.65)).slice(1) },
          { pick: g1, slots: cluster(g1.length, X(0.34), Y(0.65)) },
          { pick: g2, slots: cluster(g2.length + 1, X(0.66), Y(0.65)).slice(1) }
        ] });
    }
    // 11 층층 부채 원
    {
      const gs = gOf([R.spinL, R.spinR]), bs = bOf([R.pillar]);
      add({ id: "frontKneel", name: "층층 부채 원", tin: 144.0, tout: 153.6,
        pins: { [R.spinL]: P(xMin, Y(0.65), "spin"), [R.spinR]: P(xMax, Y(0.65), "spin"), [R.pillar]: P(cx, Y(0.45), "back") },
        groups: [
          { pick: bs, slots: row(bs.length, Y(0.88), "front", { x0: X(0.07), x1: X(0.93) }) },
          { pick: gs, slots: row(gs.length - 1, Y(0.62), "back", { x0: X(0.07), x1: X(0.93) }).concat([P(cx, Y(0.76), "centerFront")]) }
        ] });
    }
    // 12 대칭 큰 꽃
    {
      const gs = gOf([R.spinL, R.spinR]), bs = B;
      const pil = Math.min(2, bs.length), rest = bs.length - pil, [rl, rr] = halves(seq(1, rest));
      const a = Math.max(1, Math.round(gs.length * 0.55));
      add({ id: "symFlower", name: "대칭 큰 꽃", tin: 155.6, tout: 161.0,
        pins: { [R.spinL]: P(X(0.04), Y(0.42), "backRow"), [R.spinR]: P(X(0.96), Y(0.42), "backRow") },
        groups: [
          { pick: bs, slots: [P(cx - 0.4, Y(0.62), "pillar"), P(cx + 0.4, Y(0.62), "pillar")].slice(0, pil)
            .concat(arcFit(rl.length, X(0.18), Y(0.72), 120, 20, "circleS", 0.9))
            .concat(arcFit(rr.length, X(0.82), Y(0.72), 160, 60, "circleS", 0.9)) },
          { pick: gs, slots: arcFit(a, cx, Y(0.34), 200, 340, "arch", 1.2).concat(row(gs.length - a, Y(0.26), "backRow", { x0: Xw(0.12), x1: Xw(0.88) })) }
        ] });
    }
    // 13 두 줄 · 남녀 번갈아
    {
      const gs = gOf([R.spinL, R.spinR]), bs = B;
      const fit = Math.max(2, Math.floor(wide / MIN_GAP) + 1);
      const front = Math.min(gs.length + bs.length, fit);
      let fb = Math.min(bs.length, Math.ceil(front / 2)), fg = Math.min(gs.length, front - fb);
      const xs = spread(fb + fg, xMin, xMax), sB = [], sG = [];
      for (let i = 0; i < xs.length; i++) {
        const wantB = i % 2 === 0;
        if ((wantB && sB.length < fb) || sG.length >= fg) sB.push(P(xs[i], Y(0.78), "frontB"));
        else sG.push(P(xs[i], Y(0.78), "frontG"));
      }
      add({ id: "altRows", name: "두 줄 · 남녀 번갈아", tin: 163.4, tout: 184.4,
        pins: { [R.spinL]: P(X(0.08), Y(0.53), "backG"), [R.spinR]: P(X(0.92), Y(0.53), "backG") },
        groups: [
          { pick: bs, slots: sB.concat(row(bs.length - sB.length, Y(0.5), "backB", { x0: Xw(0.2), x1: Xw(0.8) })) },
          { pick: gs, slots: sG.concat(row(gs.length - sG.length, Y(0.5), "backG", { x0: X(0.04), x1: X(0.96) })) }
        ] });
    }
    // 14 세 송이 공작
    {
      const wings = Math.min(4, B.length);
      const bs = bOf([R.stack, R.spinL, R.spinR]);
      const wingSlots = [P(X(0.22), Y(0.84), "wingF"), P(X(0.78), Y(0.84), "wingF"), P(cx - 1.4, Y(0.75), "midB"), P(cx + 1.4, Y(0.75), "midB")].slice(0, Math.min(wings, bs.length));
      const restIds = ALL.filter(id => ![R.stack, R.spinL, R.spinR].includes(id)).length - wingSlots.length;
      const tails = Math.max(0, Math.min(restIds, Math.round(restIds * 0.6))), tb = restIds - tails;
      const tl = Math.ceil(tails / 2), tr = tails - tl;
      const diag = (n, x0, y0, dx) => { const o = []; for (let i = 0; i < n; i++) o.push(P(x0 + dx * i, y0 - 0.62 * i, "tail")); return o; };
      add({ id: "peacock", name: "세 송이 공작", tin: 187.6, tout: 192.4,
        pins: { [R.stack]: P(cx, Y(0.82), "soloStack"), [R.spinL]: P(X(0.17), Y(0.72), "tail"), [R.spinR]: P(X(0.83), Y(0.72), "tail") },
        groups: [
          { pick: bs, slots: wingSlots },
          { pick: "rest", slots: diag(tl, X(0.19), Y(0.64), 0.12).concat(diag(tr, X(0.81), Y(0.64), -0.12)).concat(row(tb, Y(0.25), "back", { x0: Xw(0.28), x1: Xw(0.72) })) }
        ] });
    }
    // 15 가운데 듀엣 · 좌우 부채 벽
    {
      const gs = gOf([R.duetA, R.duetB, R.spinL, R.spinR, R.pillar]), bs = bOf([R.duetA, R.duetB, R.spinL, R.spinR, R.pillar]);
      const [gl, gr] = halves(gs), [blw, brw] = halves(bs);
      const wallW = f2 => Math.min(0.36, 0.14 + f2 * 0.035);   // 사람이 많으면 벽을 넓게
      const wall = (n, side, y, tag) => { const w = wallW(n); return row(n, y, tag, side < 0 ? { x0: xMin, x1: X(w), gap: 0.7, back: 0.8 } : { x0: X(1 - w), x1: xMax, gap: 0.7, back: 0.8 }); };
      add({ id: "duetWalls", name: "가운데 듀엣 · 좌우 부채 벽", tin: 197.4, tout: 208.2,
        pins: { [R.duetA]: P(cx - 0.25, Y(0.67), "duet"), [R.duetB]: P(cx + 0.3, Y(0.57), "duet"), [R.pillar]: P(cx, Y(0.38), "duetBack"),
          [R.spinL]: P(xMin, Y(0.85), "wallF"), [R.spinR]: P(xMax, Y(0.85), "wallF") },
        groups: [
          { pick: gs, slots: wall(gl.length + 1, -1, Y(0.85), "wallF").concat(wall(gr.length + 1, 1, Y(0.85), "wallF")) },
          { pick: bs, slots: wall(blw.length, -1, Y(0.68), "wallM").concat(wall(brw.length, 1, Y(0.68), "wallM")) }
        ] });
    }
    // 16 앞줄 여자 · 뒷줄 남자
    add({ id: "girlsFront", name: "앞줄 여자 · 뒷줄 남자", tin: 211.6, tout: 224.4,
      groups: [
        { pick: G, slots: row(nG, Y(0.78), "front") },
        { pick: B, slots: row(nB, Y(0.55), "back", { x0: X(0.05), x1: X(0.95) }) }
      ] });
    // 17 두 송이 회전 꽃
    {
      const gs = gOf([R.spinL, R.spinR]), a = Math.ceil(gs.length / 2);
      add({ id: "twoFlowers", name: "두 송이 회전 꽃", tin: 230.2, tout: 244.0,
        pins: { [R.spinL]: P(X(0.04), Y(0.85), "ring"), [R.spinR]: P(X(0.96), Y(0.85), "ring") },
        groups: [
          { pick: gs, slots: block(a, Xw(0.28), Y(0.75), "core", Math.min(4, Math.ceil(a / 2))).concat(block(gs.length - a, Xw(0.72), Y(0.75), "core", Math.min(4, Math.ceil((gs.length - a) / 2)))) },
          { pick: B, slots: arcFit(nB, cx, Y(0.16), 200, 340, "ringB", 2.1, Math.min(cx - 0.7, D - Y(0.16) - 0.5)) }
        ] });
    }
    // 18 한 줄 물결 · 파도
    {
      const ls = lineSlots(), iL = 0, iR = ls.length - 1;
      const lineRest = lineIds.filter(id => id !== R.spinL && id !== R.spinR);
      add({ id: "longLine", name: "한 줄 물결 · 파도", tin: 246.4, tout: 278.0,
        pins: { [R.spinL]: ls[iL], [R.spinR]: ls[iR] },
        groups: [
          { pick: lineRest, slots: ls.filter((_, i) => i !== iL && i !== iR) },
          { pick: backIds, slots: gapRow(backIds.length, Y(0.55), "backB") }
        ] });
    }
    // 19 피날레 3층 꽃
    {
      const gs = gOf([R.spinL, R.spinR]), f = Math.max(1, Math.round(gs.length * 0.68)), m = Math.ceil(nB * 0.45);
      add({ id: "finale", name: "피날레 3층 꽃", tin: 281.4, tout: 303.6,
        pins: { [R.spinL]: P(X(0.06), Y(0.72), "spin"), [R.spinR]: P(X(0.94), Y(0.72), "spin") },
        groups: [
          { pick: gs, slots: arcFit(f, cx, Y(0.7), 205, 335, "front", 1.25).concat(row(gs.length - f, Y(0.66), "mid", { x0: Xw(0.2), x1: Xw(0.8) })) },
          { pick: B, slots: row(m, Y(0.62), "mid", { x0: Xw(0.3), x1: Xw(0.7), gap: 0.75 }).concat(row(nB - m, Y(0.48), "back", { x0: Xw(0.24), x1: Xw(0.76), gap: 0.75 })) }
        ] });
    }
    // 20 인사 줄
    add({ id: "bowLine", name: "인사 줄", tin: 309.0, tout: 322.0,
      groups: [
        { pick: lineIds, slots: lineSlots() },
        { pick: backIds, slots: gapRow(backIds.length, Y(0.55), "backB") }
      ] });

    // ---------- 설명 속 번호를 실제 역할 번호로 ----------
    const fix = t => t
      .replace(/8·9·10번 등장/g, `${R.spinL}·${R.spinR}번 등장`)
      .replace(/8번\(왼쪽\)과 9번\(오른쪽\)/g, `${R.spinL}번(왼쪽)과 ${R.spinR}번(오른쪽)`)
      .replace(/양 끝 8번·9번/g, `양 끝 ${R.spinL}번·${R.spinR}번`)
      .replace(/8번·9번/g, `${R.spinL}번·${R.spinR}번`)
      .replace(/4번·10번/g, `${R.duetA}번·${R.duetB}번`)
      .replace(/4번/g, `${R.stack}번`)
      .replace(/19번/g, `${R.pillar}번`)
      .replace(/1번(?![0-9])/g, `${R.solo}번`)
      .replace(/여자 10명/g, `여자 ${nG}명`)
      .replace(/남자 9명/g, `남자 ${nB}명`)
      .replace(/꽃 10송이/g, `꽃 ${nG}송이`);
    const S = BASE.S.map(sec => ({ title: fix(sec.title), easy: fix(sec.easy), beats: sec.beats.map(b => [b[0], b[1], fix(b[2]), b[3]]) }));

    return { flex: true, minGap: 0.34, warnGap: 0.5, MUSIC: BASE.MUSIC, P: BASE.P, F, S, KEY: BASE.KEY, MOMENTS: BASE.MOMENTS, GIRLS: G, BOYS: B, video: BASE.video, stage: { W, D }, roles: R, counts: { nG, nB } };
  }

  // 인원수에 맞는 무대 크기 추천(가로·세로 m)
  function suggestStage(nG, nB) {
    const n = nG + nB;
    return { W: Math.round(Math.max(8, Math.min(16, 8 + n * 0.17)) * 2) / 2, D: Math.round(Math.max(5, Math.min(9, 5 + n * 0.07)) * 2) / 2 };
  }
  const API = { make, suggestStage, MIN_GAP };
  if (typeof module !== "undefined" && module.exports) module.exports = API; else root.FLEX = API;
})(typeof window !== "undefined" ? window : globalThis);
