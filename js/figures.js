// 그림: 위에서 본 대형도 · 객석에서 본 그림(한복 입은 아이 + 부채)
(function (root) {
  const FAN = { rim: "#F2559A", mid: "#8FD15A", core: "#FFE06A", edge: "#FFC2DC", stick: "#B07A45" };
  const SKIN = "#F2CFAE", HAIR = "#2A2626";
  const G = { skirtTop: "#5BCBE0", skirtBot: "#1E95B3", top: "#FFFFFF", ribbon: "#F06AA5" };
  const B = { vest: "#2F6FD0", vestDark: "#1F4FA0", shirt: "#FFFFFF", pants: "#F4F4F4", band: "#2F6FD0" };
  const r1 = n => Math.round(n * 10) / 10;

  // 반원 부채: 경첩(hx,hy)에서 dir 방향으로 펼침. flat<1이면 눕힌 부채(옆에서 보여 납작)
  function fan(hx, hy, dirDeg, R, flat = 1) {
    const d = dirDeg * Math.PI / 180, c = Math.cos(d), s = Math.sin(d);
    const ring = (rad) => {
      let p = "";
      for (let a = -90; a <= 90; a += 10) {
        const ar = a * Math.PI / 180, lx = rad * Math.cos(ar), ly = rad * Math.sin(ar) * flat;
        p += (a === -90 ? "M" : "L") + r1(hx + lx * c - ly * s) + " " + r1(hy + lx * s + ly * c);
      }
      return p + `L${r1(hx)} ${r1(hy)}Z`;
    };
    return `<path d="${ring(R)}" fill="${FAN.rim}" stroke="${FAN.edge}" stroke-width="${r1(R * 0.08)}" stroke-linejoin="round"/>` +
      `<path d="${ring(R * 0.7)}" fill="${FAN.mid}"/><path d="${ring(R * 0.42)}" fill="${FAN.core}"/>` +
      `<circle cx="${r1(hx)}" cy="${r1(hy)}" r="${r1(R * 0.08)}" fill="${FAN.stick}"/>`;
  }
  function fanCircle(cx, cy, R) {
    return `<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(R)}" fill="${FAN.rim}" stroke="${FAN.edge}" stroke-width="${r1(R * 0.08)}"/>` +
      `<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(R * 0.7)}" fill="${FAN.mid}"/><circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(R * 0.42)}" fill="${FAN.core}"/>` +
      `<line x1="${r1(cx)}" y1="${r1(cy)}" x2="${r1(cx)}" y2="${r1(cy + R * 1.05)}" stroke="${FAN.stick}" stroke-width="${r1(R * 0.1)}" stroke-linecap="round"/>`;
  }
  function closedFan(x, y, len, ang = 90) {
    const a = ang * Math.PI / 180;
    return `<line x1="${r1(x)}" y1="${r1(y)}" x2="${r1(x + Math.cos(a) * len)}" y2="${r1(y + Math.sin(a) * len)}" stroke="${FAN.rim}" stroke-width="${r1(len * 0.28)}" stroke-linecap="round"/>` +
      `<line x1="${r1(x)}" y1="${r1(y)}" x2="${r1(x + Math.cos(a) * len * 0.5)}" y2="${r1(y + Math.sin(a) * len * 0.5)}" stroke="${FAN.mid}" stroke-width="${r1(len * 0.14)}" stroke-linecap="round"/>`;
  }

  // 한 사람: (fx,fy) = 발 가운데, k = 크기 배율
  function person(fx, fy, k, girl, pose, fs, num, opts = {}) {
    if (pose === "off") return "";
    const X = v => r1(fx + v * k), Y = v => r1(fy + v * k), K = v => r1(v * k);
    const low = pose === "kneel" ? 44 : pose === "crouch" ? 78 : pose === "bow" ? 60 : pose === "lean" ? 22 : 0;
    const sh = -118 + low, hy = -137 + low + (pose === "bow" ? 22 : pose === "lean" ? 10 : pose === "crouch" ? 18 : 0);
    const out = [];
    const arm = (x1, y1, x2, y2) => out.push(`<path d="M${X(x1)} ${Y(y1)} L${X(x2)} ${Y(y2)}" stroke="${girl ? G.top : B.shirt}" stroke-width="${K(9)}" stroke-linecap="round"/>`);
    // 아래 몸
    if (girl) {
      const flare = pose === "spin" ? 54 : pose === "kneel" || pose === "bow" ? 44 : pose === "crouch" ? 36 : 32;
      const top = -86 + low;
      out.push(`<path d="M${X(-13)} ${Y(top)} L${X(13)} ${Y(top)} L${X(flare)} ${Y(0)} Q${X(0)} ${Y(8)} ${X(-flare)} ${Y(0)} Z" fill="url(#skirt)" stroke="#167E98" stroke-width="${K(1.2)}"/>`);
      if (pose === "spin") out.push(`<path d="M${X(-62)} ${Y(-18)} Q${X(0)} ${Y(14)} ${X(62)} ${Y(-18)}" fill="none" stroke="currentColor" stroke-width="${K(2.2)}" stroke-dasharray="${K(5)} ${K(5)}" opacity="0.55"/>`);
    } else {
      if (pose === "kneel" || pose === "bow" || pose === "crouch") {
        out.push(`<rect x="${X(-24)}" y="${Y(-22)}" width="${K(48)}" height="${K(22)}" rx="${K(9)}" fill="${B.pants}" stroke="#CFCFCF" stroke-width="${K(1)}"/>`);
      } else {
        const spread = pose === "walk" || pose === "spin" ? 10 : 5;
        out.push(`<path d="M${X(-15)} ${Y(-72 + low)} L${X(-2)} ${Y(-72 + low)} L${X(-3 - spread + 8)} ${Y(0)} L${X(-16 - spread)} ${Y(0)} Z" fill="${B.pants}" stroke="#CFCFCF" stroke-width="${K(1)}"/>`);
        out.push(`<path d="M${X(2)} ${Y(-72 + low)} L${X(15)} ${Y(-72 + low)} L${X(16 + spread)} ${Y(0)} L${X(3 + spread - 8)} ${Y(0)} Z" fill="${B.pants}" stroke="#CFCFCF" stroke-width="${K(1)}"/>`);
      }
    }
    // 부채 뒤쪽(몸 뒤로 가는 것 없음) → 몸통
    if (girl) {
      out.push(`<path d="M${X(-16)} ${Y(sh)} Q${X(0)} ${Y(sh - 5)} ${X(16)} ${Y(sh)} L${X(14)} ${Y(sh + 30)} L${X(-14)} ${Y(sh + 30)} Z" fill="${G.top}" stroke="#D8D8D8" stroke-width="${K(1)}"/>`);
      out.push(`<path d="M${X(-2)} ${Y(sh + 14)} l${K(-7)} ${K(14)} M${X(2)} ${Y(sh + 14)} l${K(7)} ${K(14)}" stroke="${G.ribbon}" stroke-width="${K(3)}" stroke-linecap="round"/>`);
    } else {
      out.push(`<path d="M${X(-16)} ${Y(sh)} Q${X(0)} ${Y(sh - 5)} ${X(16)} ${Y(sh)} L${X(15)} ${Y(sh + 48)} L${X(-15)} ${Y(sh + 48)} Z" fill="${B.shirt}" stroke="#D8D8D8" stroke-width="${K(1)}"/>`);
      out.push(`<path d="M${X(-15)} ${Y(sh + 2)} L${X(-4)} ${Y(sh + 2)} L${X(-2)} ${Y(sh + 48)} L${X(-15)} ${Y(sh + 48)} Z M${X(15)} ${Y(sh + 2)} L${X(4)} ${Y(sh + 2)} L${X(2)} ${Y(sh + 48)} L${X(15)} ${Y(sh + 48)} Z" fill="${B.vest}" stroke="${B.vestDark}" stroke-width="${K(1)}"/>`);
    }
    // 머리
    out.push(`<circle cx="${X(0)}" cy="${Y(hy)}" r="${K(13)}" fill="${SKIN}" stroke="#D9AE8A" stroke-width="${K(1)}"/>`);
    if (girl) out.push(`<path d="M${X(-13)} ${Y(hy)} Q${X(-12)} ${Y(hy - 15)} ${X(0)} ${Y(hy - 15)} Q${X(12)} ${Y(hy - 15)} ${X(13)} ${Y(hy)} Q${X(8)} ${Y(hy - 8)} ${X(0)} ${Y(hy - 9)} Q${X(-8)} ${Y(hy - 8)} ${X(-13)} ${Y(hy)} Z" fill="${HAIR}"/><circle cx="${X(0)}" cy="${Y(hy - 17)}" r="${K(6)}" fill="${HAIR}"/>`);
    else out.push(`<path d="M${X(-13)} ${Y(hy - 1)} Q${X(0)} ${Y(hy - 20)} ${X(13)} ${Y(hy - 1)} Q${X(0)} ${Y(hy - 9)} ${X(-13)} ${Y(hy - 1)} Z" fill="${HAIR}"/><rect x="${X(-13)}" y="${Y(hy - 8)}" width="${K(26)}" height="${K(4)}" fill="${B.band}"/>`);
    // 팔 + 부채 (보는 사람 기준: 화면 왼쪽 = 학생의 오른손)
    const L = -1, Rr = 1, s = sh;
    const both = (fn) => { fn(L); fn(Rr); };
    switch (fs) {
      case "closed": both(d => { arm(d * 15, s + 4, d * 20, s + 44); out.push(closedFan(X(d * 20), Y(s + 44), K(28))); }); break;
      case "floor": case "bowFloor":
        both(d => { arm(d * 15, s + 4, d * 22, pose === "stand" ? s + 44 : -8); });
        if (fs === "floor") both(d => out.push(fan(X(d * 26), Y(-2), d < 0 ? 180 : 0, K(28), 0.3)));
        else both(d => out.push(closedFan(X(d * 10), Y(-4), K(24), d < 0 ? 180 : 0)));
        break;
      case "hold": both(d => { arm(d * 15, s + 4, d * 9, s + 20); out.push(fan(X(d * 9), Y(s + 20), -90 + d * 30, K(20))); }); break;
      case "chest": both(d => { arm(d * 15, s + 4, d * 12, s + 24); out.push(fan(X(d * 12), Y(s + 24), d < 0 ? 180 : 0, K(36), 0.35)); }); break;
      case "chestLow": both(d => { arm(d * 15, s + 4, d * 14, s + 40); out.push(fan(X(d * 14), Y(s + 40), d < 0 ? 180 : 0, K(36), 0.35)); }); break;
      case "low": both(d => { arm(d * 15, s + 4, d * 22, s + 58); out.push(fan(X(d * 22), Y(s + 58), d < 0 ? 180 : 0, K(34), 0.32)); }); break;
      case "lowBand": both(d => { arm(d * 15, s + 4, d * 20, s + 60); out.push(fan(X(d * 20), Y(s + 60), d < 0 ? 180 : 0, K(44), 0.3)); }); break;
      case "up": both(d => { arm(d * 15, s + 2, d * 38, s - 44); out.push(fan(X(d * 38), Y(s - 44), -90 + d * 38, K(34))); }); break;
      case "upVertical": both(d => { arm(d * 15, s + 2, d * 9, s - 52); out.push(fan(X(d * 9), Y(s - 52), -90 + d * 12, K(30))); }); break;
      case "roof": both(d => { arm(d * 15, s + 2, d * 14, s - 54); out.push(fan(X(d * 14), Y(s - 54), d < 0 ? 180 : 0, K(40), 0.35)); }); break;
      case "bud": arm(-15, s + 2, -3, s - 52); arm(15, s + 2, 3, s - 52); out.push(fan(X(-3), Y(s - 52), -100, K(26)) + fan(X(3), Y(s - 52), -80, K(26))); break;
      case "circle": both(d => arm(d * 15, s + 4, d * 6, s + 10)); out.push(fanCircle(X(0), Y(hy + 2), K(34))); break;
      case "circleHigh": both(d => arm(d * 15, s + 2, d * 5, s - 40)); out.push(fanCircle(X(0), Y(s - 72), K(32))); break;
      case "circleChest": both(d => arm(d * 15, s + 4, d * 5, s + 36)); out.push(fanCircle(X(0), Y(s + 8), K(32))); break;
      case "side": both(d => { arm(d * 15, s + 4, d * 56, s + 2); out.push(fan(X(d * 56), Y(s + 2), d < 0 ? 180 : 0, K(32))); }); break;
      case "wingDown": both(d => { arm(d * 15, s + 4, d * 48, s + 36); out.push(fan(X(d * 48), Y(s + 36), d < 0 ? 145 : 35, K(34))); }); break;
      case "ring": both(d => { arm(d * 15, s + 4, d * 44, s + 28); out.push(fan(X(d * 44), Y(s + 28), d < 0 ? 160 : 20, K(38))); }); break;
      case "ringLow": both(d => { arm(d * 15, s + 4, d * 40, s + 40); out.push(fan(X(d * 40), Y(s + 40), d < 0 ? 172 : 8, K(36))); }); break;
      case "butterfly": both(d => { arm(d * 15, s + 4, d * 20, s - 10); out.push(fan(X(d * 20), Y(s - 10), -90 + d * 22, K(28))); }); break;
      case "vertical": both(d => { arm(d * 15, s + 4, d * 26, s - 2); out.push(fan(X(d * 26), Y(s - 2), -90 + d * 8, K(30))); }); break;
      case "downOpen": both(d => { arm(d * 15, s + 4, d * 24, s + 48); out.push(fan(X(d * 24), Y(s + 48), 90 - d * 15, K(28))); }); break;
      case "spin": arm(-15, s + 2, -36, s - 46); out.push(fan(X(-36), Y(s - 46), -125, K(32))); arm(15, s + 4, 32, s + 40); out.push(fan(X(32), Y(s + 40), 30, K(30))); break;
      case "lowFront": arm(-15, s + 2, -14, s - 54); out.push(fan(X(-14), Y(s - 54), 180, K(38), 0.35)); arm(15, s + 4, 16, s + 56); out.push(fan(X(16), Y(s + 56), 0, K(38), 0.35)); break;
      case "stack": both(d => arm(d * 15, s + 4, d * 5, s - 4)); out.push(fan(X(0), Y(s + 2), -90, K(24)) + fan(X(0), Y(s - 18), -90, K(26)) + fan(X(0), Y(s - 40), -90, K(28))); break;
      default: both(d => arm(d * 15, s + 4, d * 20, s + 44));
    }
    // 번호표
    if (num != null) {
      const by = Y(14), bx = X(0), rr = K(11) < 8 ? 8 : K(11);
      out.push(girl ? `<circle cx="${bx}" cy="${by}" r="${rr}" fill="var(--girl)" stroke="var(--panel)" stroke-width="1.5"/>`
        : `<rect x="${r1(bx - rr)}" y="${r1(by - rr)}" width="${r1(rr * 2)}" height="${r1(rr * 2)}" rx="${r1(rr * 0.3)}" fill="var(--boy)" stroke="var(--panel)" stroke-width="1.5"/>`);
      out.push(`<text x="${bx}" y="${r1(by + rr * 0.36)}" text-anchor="middle" font-size="${r1(rr * 1.05)}" font-weight="700" fill="#fff">${num}</text>`);
    }
    const glow = opts.hi ? `<ellipse cx="${X(0)}" cy="${Y(-70)}" rx="${K(62)}" ry="${K(95)}" fill="var(--hi)" opacity="0.35"/>` : "";
    return `<g opacity="${opts.dim ? 0.3 : 1}">${glow}${out.join("")}</g>`;
  }

  const DEFS = `<defs><linearGradient id="skirt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${G.skirtTop}"/><stop offset="1" stop-color="${G.skirtBot}"/></linearGradient></defs>`;

  // 객석에서 본 그림
  function front(plan, t, opts = {}) {
    const ST = plan.stage || { W: 10, D: 6 }, SW = ST.W, SD = ST.D, sizeK = Math.min(1, 11 / SW);
    const W = 1000, H = 560, backY = 170, frontY = 520;
    const map = (x, y) => { const d = Math.max(0, Math.min(1, y / SD)); const half = 360 + d * 140; return [500 + (x - SW / 2) / (SW / 2) * half, backY + d * (frontY - backY), (0.62 + 0.5 * d) * sizeK]; };
    const beat = plan.beatAt(t);
    const people = plan.ids.map(id => { const p = plan.posAt(id, t); const pr = plan.presetFor(id, beat) || {}; const mv = plan.moveDuring(id, beat); return { id, p, pr, moving: mv && t >= mv.tr.t0 + mv.m.delay && t <= mv.tr.t1 }; })
      .sort((a, b) => a.p[1] - b.p[1]);
    const s = [`<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="객석에서 본 그림 ${Math.floor(t)}초" style="color:var(--ink)">${DEFS}`];
    s.push(`<rect width="${W}" height="${H}" fill="var(--stage-bg)"/>`);
    s.push(`<rect x="60" y="20" width="880" height="${backY - 14}" rx="8" fill="var(--back)"/>`);
    s.push(`<text x="500" y="46" text-anchor="middle" font-size="15" fill="var(--muted)" letter-spacing="3">무대 뒤 (배경막)</text>`);
    const [bl] = map(0, 0), [br] = map(SW, 0), [fl] = map(0, SD), [frr] = map(SW, SD);
    s.push(`<path d="M${bl} ${backY} L${br} ${backY} L${frr} ${frontY} L${fl} ${frontY} Z" fill="var(--floor)" stroke="var(--floor-line)"/>`);
    for (let x = 1; x < SW; x++) { const a = map(x, 0), b = map(x, SD); s.push(`<line x1="${r1(a[0])}" y1="${backY}" x2="${r1(b[0])}" y2="${frontY}" stroke="var(--floor-line)" stroke-dasharray="4 7" opacity="${Math.abs(x - SW / 2) < 0.01 ? 0.9 : 0.45}"/>`); }
    for (let y = 1; y < SD; y++) { const a = map(0, y), b = map(SW, y); s.push(`<line x1="${r1(a[0])}" y1="${r1(a[1])}" x2="${r1(b[0])}" y2="${r1(b[1])}" stroke="var(--floor-line)" stroke-dasharray="4 7" opacity="0.45"/>`); }
    s.push(`<text x="500" y="${H - 14}" text-anchor="middle" font-size="15" fill="var(--muted)" letter-spacing="3">객 석 (보는 사람)</text>`);
    for (const q of people) {
      const [fx, fy, k] = map(Math.max(-0.6, Math.min(SW + 0.6, q.p[0])), q.p[1]);
      const pose = q.moving && q.pr.pose !== "walk" ? "walk" : q.pr.pose || "stand";
      const fsv = q.moving && q.pr.pose !== "walk" ? "hold" : q.pr.fs || "closed";
      const off = q.p[0] < -0.2 || q.p[0] > SW + 0.2;
      s.push(off ? `<g opacity="0.35">${person(fx, fy, k * 0.9, q.id <= 10, "stand", "closed", q.id)}</g>` : person(fx, fy, k, q.id <= 10, pose, fsv, q.id, { hi: opts.hi === q.id, dim: opts.hi && opts.hi !== q.id }));
    }
    s.push(`</svg>`);
    return s.join("");
  }

  // 위에서 본 대형도 (flip = 학생 기준: 객석이 위쪽)
  function top(plan, t, opts = {}) {
    const ST = plan.stage || { W: 10, D: 6 }, SW = ST.W, SD = ST.D;
    const W = 1000, H = 660, SC = Math.min(900 / SW, 540 / SD);
    const PL = (W - SW * SC) / 2, PT = (H - SD * SC) / 2 + 10;
    const flip = !!opts.flip;
    // 객석 기준: 객석이 아래(앞 = 아래) · 학생 기준: 객석이 위, 좌우도 뒤집힘
    const Q = (x, y) => flip ? [PL + (SW - x) * SC, PT + (SD - y) * SC] : [PL + x * SC, PT + y * SC];
    const s = [`<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="위에서 본 대형도" font-family="inherit">`];
    s.push(`<rect width="${W}" height="${H}" fill="var(--stage-bg)"/>`);
    const [x0, y0] = Q(0, 0), [x1, y1] = Q(SW, SD);
    const rx = Math.min(x0, x1), ry = Math.min(y0, y1);
    s.push(`<rect x="${r1(rx)}" y="${r1(ry)}" width="${r1(SW * SC)}" height="${r1(SD * SC)}" rx="6" fill="var(--floor)" stroke="var(--floor-line)"/>`);
    for (let x = 1; x < SW; x++) { const a = Q(x, 0), b = Q(x, SD); const mid = Math.abs(x - SW / 2) < 0.01; s.push(`<line x1="${r1(a[0])}" y1="${r1(a[1])}" x2="${r1(b[0])}" y2="${r1(b[1])}" stroke="var(--floor-line)" stroke-dasharray="5 7" opacity="${mid ? 1 : 0.55}" stroke-width="${mid ? 2 : 1}"/>`); }
    for (let y = 1; y < SD; y++) { const a = Q(0, y), b = Q(SW, y); s.push(`<line x1="${r1(a[0])}" y1="${r1(a[1])}" x2="${r1(b[0])}" y2="${r1(b[1])}" stroke="var(--floor-line)" stroke-dasharray="5 7" opacity="0.55"/>`); }
    // 눈금: 가로(객석 기준 왼쪽 끝 0m) · 앞에서 거리
    const frontEdge = Q(0, SD)[1], backEdge = Q(0, 0)[1];
    const labY = frontEdge + (flip ? -12 : 18);
    for (let x = 0; x <= SW; x++) { const a = Q(x, SD); s.push(`<text x="${r1(a[0])}" y="${r1(labY)}" text-anchor="middle" font-size="12" fill="var(--muted)">${x}</text>`); }
    for (let y = 0; y <= SD; y++) { const a = Q(0, y), b = Q(SW, y); const lx = flip ? b[0] - 8 : a[0] - 8; s.push(`<text x="${r1(lx)}" y="${r1(a[1] + 4)}" text-anchor="end" font-size="12" fill="var(--muted)">${SD - y}</text>`); }
    const audY = flip ? frontEdge - 30 : frontEdge + 42, backLabY = flip ? backEdge + 38 : backEdge - 26;
    s.push(`<text x="${W / 2}" y="${audY}" text-anchor="middle" font-size="15" font-weight="700" fill="var(--ink)" letter-spacing="4">객 석 (앞)</text>`);
    s.push(`<text x="${W / 2}" y="${backLabY}" text-anchor="middle" font-size="14" fill="var(--muted)" letter-spacing="3">무대 뒤 (배경막)</text>`);
    s.push(`<text x="${PL}" y="${audY}" font-size="12" fill="var(--muted)">${flip ? "◀ 학생의 왼쪽" : "◀ 객석에서 볼 때 왼쪽"}</text>`);
    s.push(`<text x="${r1(PL + SW * SC)}" y="${audY}" text-anchor="end" font-size="12" fill="var(--muted)">${flip ? "학생의 오른쪽 ▶" : "객석에서 볼 때 오른쪽 ▶"}</text>`);
    // 이동 경로(지금 또는 곧 시작하는 이동)
    const tr = plan.transAt(t) || plan.trans.find(x => x.t0 > t && x.t0 - t < (opts.lookahead ?? 3));
    if (tr && opts.paths !== false) {
      for (const id of plan.ids) {
        const m = tr.movers[id]; if (!m.moving) continue;
        const dim = opts.hi && opts.hi !== id;
        const pts = m.pts.map(p => Q(Math.max(-0.5, Math.min(SW + 0.5, p[0])), p[1]));
        const d = "M" + pts.map(p => `${r1(p[0])} ${r1(p[1])}`).join(" L");
        const col = id <= 10 ? "var(--girl)" : "var(--boy)";
        s.push(`<path d="${d}" fill="none" stroke="${col}" stroke-width="${opts.hi === id ? 4 : 2}" stroke-dasharray="${m.delay > 0 ? "2 6" : "7 6"}" opacity="${dim ? 0.15 : 0.8}" marker-end="url(#ah${id <= 10 ? "g" : "b"})"/>`);
      }
    }
    s.push(`<defs><marker id="ahg" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--girl)"/></marker><marker id="ahb" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--boy)"/></marker></defs>`);
    // 사람
    const beat = plan.beatAt(t);
    const order = plan.ids.slice().sort((a, b) => plan.posAt(a, t)[1] - plan.posAt(b, t)[1]);
    for (const id of order) {
      const p = plan.posAt(id, t), [cx, cy] = Q(Math.max(-0.45, Math.min(SW + 0.45, p[0])), p[1]);
      const pr = plan.presetFor(id, beat) || {}, off = p[0] < -0.2 || p[0] > SW + 0.2;
      const dim = off || (opts.hi && opts.hi !== id);
      const r = Math.max(9, Math.min(17, SC * 0.19)), girl = id <= 10, col = girl ? "var(--girl)" : "var(--boy)";
      const g = [`<g opacity="${off ? 0.4 : dim ? 0.25 : 1}" data-id="${id}" style="cursor:pointer">`];
      if (opts.hi === id) g.push(`<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r + 14}" fill="var(--hi)" opacity="0.45"/>`);
      if (pr.pose === "kneel" || pr.pose === "bow" || pr.pose === "crouch") g.push(`<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r + 6}" fill="none" stroke="${col}" stroke-width="2" stroke-dasharray="3 3"/>`);
      if (pr.pose === "spin") g.push(`<path d="M${r1(cx - r - 9)} ${r1(cy)} a${r + 9} ${r + 9} 0 1 1 ${r + 9} ${r + 9}" fill="none" stroke="var(--ink)" stroke-width="2" stroke-dasharray="4 4"/>`);
      g.push(girl ? `<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r}" fill="${col}" stroke="var(--ink)" stroke-width="1.5"/>`
        : `<rect x="${r1(cx - r)}" y="${r1(cy - r)}" width="${2 * r}" height="${2 * r}" rx="5" fill="${col}" stroke="var(--ink)" stroke-width="1.5"/>`);
      g.push(`<text x="${r1(cx)}" y="${r1(cy + r * 0.36)}" text-anchor="middle" font-size="${r1(r * 0.95)}" font-weight="700" fill="#fff">${id}</text>`);
      if (off) g.push(`<text x="${r1(cx)}" y="${r1(cy + r + 14)}" text-anchor="middle" font-size="11" fill="var(--muted)">대기</text>`);
      g.push(`</g>`);
      s.push(g.join(""));
    }
    s.push(`</svg>`);
    return s.join("");
  }

  // 부채 동작 한 장면(사전용)
  function single(fs, girl = true, pose = "stand") {
    return `<svg viewBox="-90 -230 180 250" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="부채 동작">${DEFS}<rect x="-90" y="-230" width="180" height="250" fill="var(--stage-bg)"/><line x1="-80" y1="0" x2="80" y2="0" stroke="var(--floor-line)"/>${person(0, 0, 1, girl, pose, fs, null)}</svg>`;
  }

  root.FIG = { front, top, single, person };
})(window);
