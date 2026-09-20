(function () {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const store = { get(k, d) { try { const v = localStorage.getItem("buchaeflex." + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem("buchaeflex." + k, JSON.stringify(v)); } catch (e) { } } };

  // 인원수 · 무대 크기 (주소의 ?g=12&b=11 이 있으면 그것을 먼저 씀)
  const q = new URLSearchParams(location.search);
  const cfg = Object.assign({ nG: 10, nB: 9, W: 0, D: 0 }, store.get("cfg", {}));
  if (q.has("g")) cfg.nG = +q.get("g");
  if (q.has("b")) cfg.nB = +q.get("b");
  cfg.nG = Math.max(0, Math.min(30, Math.round(cfg.nG)));
  cfg.nB = Math.max(0, Math.min(30, Math.round(cfg.nB)));
  if (cfg.nG + cfg.nB < 4) cfg.nB = 4 - cfg.nG;
  if (cfg.nG + cfg.nB > 40) cfg.nB = Math.max(0, 40 - cfg.nG);
  const auto = window.FLEX.suggestStage(cfg.nG, cfg.nB);
  const stage = { W: cfg.W || auto.W, D: cfg.D || auto.D };
  const t0build = performance.now();
  const D = window.FLEX.make(cfg.nG, cfg.nB, stage, window.CHOREO);
  const plan = window.PLAN.build(D);
  const buildMs = Math.round(performance.now() - t0build);
  const FPS = D.video.fps, DUR = D.video.duration, BEAT = plan.BEAT;
  const RO = D.roles;

  const S = {
    t: 5, playing: false, speed: 1, src: "none", hi: store.get("hi", null), filter: "all", mode: store.get("mode", "top"),
    set: Object.assign({ W: stage.W, Dp: stage.D, step: 0.5, view: "student" }, store.get("set", {}), { W: stage.W, Dp: stage.D }), beatIdx: -1, loop: false
  };

  // ---------- 글자 도우미 ----------
  const fmt = t => { t = Math.max(0, t); const m = Math.floor(t / 60), s = t - m * 60; return `${m}:${s < 10 ? "0" : ""}${s.toFixed(2)}`; };
  const fmtS = t => { const m = Math.floor(t / 60), s = Math.floor(t - m * 60); return `${m}:${s < 10 ? "0" : ""}${s}`; };
  const aud = () => S.set.view === "audience";
  const sx = () => 1, sy = () => 1;   // 좌표가 이미 실제 m 단위
  const badge = id => `<span class="badge ${id > 10 ? "b" : ""}" title="${id <= 10 ? "여" : "남"}">${id}</span>`;
  function lr(x) { const left = x < stage.W * 0.34, right = x > stage.W * 0.66; if (!left && !right) return "가운데"; return (left ^ !aud()) ? "왼쪽" : "오른쪽"; }
  function zone(x, y) {
    if (x < -0.2) return aud() ? "무대 밖 (왼쪽 옆)" : "무대 밖 (오른쪽 옆)";
    if (x > stage.W + 0.2) return aud() ? "무대 밖 (오른쪽 옆)" : "무대 밖 (왼쪽 옆)";
    const fb = y > stage.D * 0.72 ? "앞" : y > stage.D * 0.43 ? "가운데" : "뒤", side = lr(x);
    if (fb === "가운데" && side === "가운데") return "무대 한가운데";
    if (side === "가운데") return `${fb}쪽 가운데`;
    if (fb === "가운데") return `가운데 줄 ${side}`;
    return `${fb}쪽 ${side}`;
  }
  const coord = (x, y) => `가로 ${Math.max(0, Math.min(stage.W, x)).toFixed(1)}m · 앞에서 ${(stage.D - y).toFixed(1)}m`;
  function dirWord(dx, dy) {
    // 작은 쪽 성분이 큰 쪽의 1/4보다 작으면 무시(한 방향으로만 말하기)
    const ax = Math.abs(dx), ay = Math.abs(dy);
    if (ax < ay * 0.25 && ax < 0.4) dx = 0;
    if (ay < ax * 0.25 && ay < 0.4) dy = 0;
    const side = dx > 0.12 ? (aud() ? "오른쪽" : "왼쪽") : dx < -0.12 ? (aud() ? "왼쪽" : "오른쪽") : "";
    const fb = dy > 0.12 ? "앞" : dy < -0.12 ? "뒤" : "";
    const w = [side, fb].filter(Boolean).join(" ");
    if (!w) return "제자리";
    return w + (w.endsWith("뒤") ? "로" : "으로");
  }
  const steps = (dx, dy) => Math.max(1, Math.round(Math.hypot(dx * sx(), dy * sy()) / S.set.step));

  function moveDesc(id, beat) {
    const mv = plan.moveDuring(id, beat); if (!mv) return null;
    const { tr, m } = mv, pts = m.pts, dest = m.p1;
    const parts = [];
    if (m.traj) {   // 서로 피하면서 걸어가는 길
      const straight = Math.hypot(dest[0] - m.p0[0], dest[1] - m.p0[1]);
      const n = Math.max(1, Math.round(m.len / S.set.step));
      const curvy = m.len > straight * 1.12;
      parts.push(`${dirWord(dest[0] - m.p0[0], dest[1] - m.p0[1])} <b>${n}걸음</b>${curvy ? " (사람 사이를 피해 살짝 돌아서)" : ""}`);
    } else if (m.route[0] === "o" || m.route[0] === "O") {
      const mid = [(m.p0[0] + m.p1[0]) / 2, (m.p0[1] + m.p1[1]) / 2], wp = pts[1];
      const how = wp[1] < mid[1] - 0.1 ? "뒤쪽으로 둥글게 돌아서" : wp[1] > mid[1] + 0.1 ? "앞쪽으로 둥글게 돌아서" : "옆으로 둥글게 돌아서";
      const n = Math.max(1, Math.round(m.len * Math.hypot(sx(), sy()) / Math.SQRT2 / S.set.step));
      parts.push(`${how} ${dirWord(dest[0] - m.p0[0], dest[1] - m.p0[1])} <b>${n}걸음</b>`);
    } else {
      for (let i = 1; i < pts.length; i++) {
        const dx = pts[i][0] - pts[i - 1][0], dy = pts[i][1] - pts[i - 1][1];
        if (Math.hypot(dx, dy) < 0.08) continue;
        parts.push(`${dirWord(dx, dy)} <b>${steps(dx, dy)}걸음</b>`);
      }
    }
    const db = Math.round(((m.startT != null ? m.startT - tr.t0 : m.delay)) / BEAT);
    const start = db ? `<span class="warn">${db}박 기다렸다 출발${m.waitFor ? ` (${m.waitFor}번이 먼저 지나간 뒤)` : ""}</span>` : "바로 출발";
    const startLbl = m.startT != null ? m.startT : tr.t0 + m.delay;
    const near = (tr.near[id] || []).filter(n => n.d < 0.95).slice(0, 2).map(n =>
      n.rel === "behind" ? `${n.other}번 <b>뒤로</b> 지나가기` : n.rel === "front" ? `${n.other}번 <b>앞으로</b> 지나가기` : `${n.other}번 옆을 지나가기`);
    const tight = tr.issues.some(i => i.kind === "좁음" && (i.a === id || i.b === id));
    return {
      tr, m,
      html: `<span class="mv">${parts.join(" → ")}</span><span class="sm">→ ${zone(dest[0], dest[1])} (${coord(dest[0], dest[1])})</span>` +
        `<span class="pass">${fmtS(startLbl)} ${start} · ${fmtS(tr.t1)}까지 도착${near.length ? " · " + near.join(", ") : ""}${tight ? ` · <span class="warn">좁은 곳: 부채를 가슴에 붙이기</span>` : ""}</span>`,
      text: parts.join(" → ").replace(/<[^>]+>/g, "") + ` → ${zone(dest[0], dest[1])}` + (db ? ` (${db}박 기다렸다)` : "") + (near.length ? ` · ${near.join(", ").replace(/<[^>]+>/g, "")}` : "")
    };
  }

  // ---------- 박 세기 ----------
  function countAt(t) {
    if (t < D.MUSIC.firstBeat - 0.05 || t > D.MUSIC.end + 0.3) return null;
    const k = Math.floor((t - D.MUSIC.firstBeat) / BEAT + 1e-6);
    return (((k - D.MUSIC.barOffset) % 8) + 8) % 8 + 1;
  }
  const countRange = b => { const a = countAt(b.t0 + 0.01); if (!a) return ""; const n = Math.max(1, Math.round((b.t1 - b.t0) / BEAT)); return `${n}박 동안 · ${a}박째에 시작`; };

  // ---------- 시계 · 영상 ----------
  const video = $("#video"); let yt = null, ytReady = false;
  function curTime() {
    if (S.src === "video") return video.currentTime;
    if (S.src === "yt" && ytReady) return yt.getCurrentTime();
    return S.t;
  }
  function seek(t) {
    t = Math.max(0, Math.min(DUR - 0.01, t));
    S.t = t;
    if (S.src === "video") video.currentTime = t;
    else if (S.src === "yt" && ytReady) yt.seekTo(t, true);
    render(true);
  }
  function setPlaying(p) {
    S.playing = p;
    if (S.src === "video") { if (p) video.play().catch(() => { }); else video.pause(); }
    else if (S.src === "yt" && ytReady) { if (p) yt.playVideo(); else yt.pauseVideo(); }
    $("#bPlay").textContent = p ? "⏸ 멈춤" : "▶ 재생";
    if (p) { last = performance.now(); requestAnimationFrame(tick); }
  }
  let last = 0;
  function tick(now) {
    if (!S.playing) return;
    const dt = (now - last) / 1000; last = now;
    if (S.src === "none" || (S.src === "yt" && !ytReady)) { S.t = Math.min(DUR, S.t + dt * S.speed); if (S.t >= DUR) setPlaying(false); }
    else S.t = curTime();
    if (S.loop) { const b = plan.beatAt(S.t); const cur = plan.beats[S.beatIdx]; if (cur && S.t >= cur.t1) { seek(cur.t0); } else if (!cur) void b; }
    render();
    requestAnimationFrame(tick);
  }
  function step(frames) { if (S.playing) setPlaying(false); const t = Math.round(curTime() * FPS + frames) / FPS; seek(t); }

  function useVideo(url) {
    video.src = url; S.src = "video";
    $("#vidMsg").hidden = true; $("#ytBox").hidden = true; video.hidden = false;
    video.playbackRate = S.speed;
    video.addEventListener("loadedmetadata", () => { video.currentTime = S.t; }, { once: true });
  }
  video.addEventListener("error", () => { if (S.src === "video" && !video.dataset.user) { S.src = "none"; $("#vidMsg").hidden = false; video.hidden = true; } });
  video.addEventListener("seeked", () => { if (!S.playing) { S.t = video.currentTime; render(true); } });
  video.addEventListener("pause", () => { if (S.src === "video" && S.playing) setPlaying(false); });
  // 같은 폴더에 영상이 있으면 자동으로 열기(내 컴퓨터에서 열 때)
  if (location.protocol === "file:" || /^(localhost|127\.)/.test(location.hostname)) useVideo(encodeURI(D.video.file)); else { video.hidden = true; }
  $("#vidPick").addEventListener("change", e => { const f = e.target.files[0]; if (!f) return; video.dataset.user = "1"; useVideo(URL.createObjectURL(f)); });
  $("#ytBtn").addEventListener("click", () => {
    $("#vidMsg").hidden = true; $("#ytBox").hidden = false; video.hidden = true; S.src = "yt";
    window.onYouTubeIframeAPIReady = () => {
      yt = new YT.Player("ytPlayer", { videoId: D.video.id, playerVars: { rel: 0, playsinline: 1, modestbranding: 1, start: Math.floor(S.t) },
        events: { onReady: () => { ytReady = true; yt.setPlaybackRate(S.speed); yt.seekTo(S.t, true); yt.pauseVideo(); },
          onStateChange: e => { if (e.data === 1 && !S.playing) setPlaying(true); if (e.data === 2 && S.playing) { S.playing = false; $("#bPlay").textContent = "▶ 재생"; S.t = yt.getCurrentTime(); render(true); } } } });
    };
    const sc = document.createElement("script"); sc.src = "https://www.youtube.com/iframe_api"; document.head.appendChild(sc);
  });

  // ---------- 시간 막대 ----------
  const scrub = $("#scrub"), zoom = $("#zoom");
  $("#bands").innerHTML = D.S.map((sec, i) => { const a = sec.beats[0][0], b = sec.beats[sec.beats.length - 1][1], a0 = i === 0 ? 0 : a; const b0 = i === D.S.length - 1 ? DUR : D.S[i + 1].beats[0][0]; return `<span style="flex:${(b0 - a0).toFixed(2)}" title="${sec.title}"></span>`; }).join("");
  $("#keys").innerHTML = D.KEY.map(([t, n]) => `<b style="left:${(t / DUR * 100).toFixed(2)}%" title="${n}"></b>`).join("");
  function tFromX(el, clientX) { const r = el.getBoundingClientRect(); return (clientX - r.left) / r.width * DUR; }
  scrub.addEventListener("pointerdown", e => { scrub.setPointerCapture(e.pointerId); if (S.playing) setPlaying(false); seek(tFromX(scrub, e.clientX)); });
  scrub.addEventListener("pointermove", e => { if (scrub.hasPointerCapture(e.pointerId)) seek(tFromX(scrub, e.clientX)); });
  scrub.addEventListener("keydown", e => { if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); e.stopPropagation(); step((e.key === "ArrowRight" ? 1 : -1) * (e.shiftKey ? FPS : 1)); } });
  const ZW = 6; // 확대 막대: 앞뒤 3초
  let zDrag = null;
  zoom.addEventListener("pointerdown", e => { zoom.setPointerCapture(e.pointerId); if (S.playing) setPlaying(false); zDrag = { x: e.clientX, t: curTime() }; });
  zoom.addEventListener("pointermove", e => { if (!zDrag) return; const w = zoom.getBoundingClientRect().width; const t = zDrag.t - (e.clientX - zDrag.x) / w * ZW; seek(Math.round(t * FPS) / FPS); });
  zoom.addEventListener("pointerup", () => zDrag = null);
  zoom.addEventListener("pointercancel", () => zDrag = null);
  function drawZoom(t) {
    const w = 1000, h = 46, a = t - ZW / 2, px = v => (v - a) / ZW * w;
    const o = [`<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">`];
    for (const b of plan.beats) { if (b.t1 < a || b.t0 > a + ZW) continue; o.push(`<rect x="${px(b.t0).toFixed(1)}" y="0" width="${(px(b.t1) - px(b.t0)).toFixed(1)}" height="${h}" fill="${b.index % 2 ? "var(--blue-soft)" : "var(--pink-soft)"}"/>`); }
    for (let f = Math.ceil(a * FPS); f <= (a + ZW) * FPS; f++) { const x = px(f / FPS).toFixed(1), big = f % FPS === 0; o.push(`<line x1="${x}" y1="${h}" x2="${x}" y2="${big ? h - 18 : h - 6}" stroke="var(--muted)" stroke-width="${big ? 1.5 : 0.6}"/>`); if (big) o.push(`<text x="${+x + 3}" y="${h - 22}" font-size="11" fill="var(--muted)">${fmtS(f / FPS)}</text>`); }
    for (let k = Math.ceil((a - D.MUSIC.firstBeat) / BEAT); ; k++) { const bt = D.MUSIC.firstBeat + k * BEAT; if (bt > a + ZW) break; if (bt < D.MUSIC.firstBeat || bt > D.MUSIC.end) continue; const c = ((k - D.MUSIC.barOffset) % 8 + 8) % 8 + 1; const x = px(bt).toFixed(1); o.push(`<circle cx="${x}" cy="10" r="${c === 1 ? 6 : 3.5}" fill="${c === 1 ? "var(--pink)" : "var(--ink)"}" opacity="0.8"/><text x="${x}" y="30" text-anchor="middle" font-size="11" font-weight="700" fill="var(--ink)">${c}</text>`); }
    o.push(`<line x1="${w / 2}" y1="0" x2="${w / 2}" y2="${h}" stroke="var(--pink)" stroke-width="3"/></svg>`);
    zoom.innerHTML = o.join("");
  }

  // ---------- 그리기 ----------
  let lastDiag = 0;
  function render(force) {
    const t = S.src === "none" || !S.playing ? S.t : (S.t = curTime());
    $("#thumb").style.left = (t / DUR * 100) + "%";
    $("#timeLbl").textContent = `${fmt(t)} · ${Math.round(t * FPS)}프레임`;
    const c = countAt(t);
    $("#countBig").textContent = c || "–";
    $("#countSub").innerHTML = c ? `<span class="dots">${[1, 2, 3, 4, 5, 6, 7, 8].map(i => `<i class="${i === c ? "on" : ""}"></i>`).join("")}</span>` : (t < D.MUSIC.firstBeat ? "음악 전 — 0:21에 첫 소리" : "음악 끝");
    drawZoom(t);
    const now = performance.now();
    if (force || now - lastDiag > 45) {
      lastDiag = now;
      $("#diag").innerHTML = S.mode === "front" ? FIG.front(plan, t, { hi: S.hi }) : FIG.top(plan, t, { hi: S.hi, flip: !aud() });
    }
    const b = plan.beatAt(t);
    if (b.index !== S.beatIdx || force === "beat") { S.beatIdx = b.index; renderBeat(b); }
  }
  $("#diag").addEventListener("click", e => { const g = e.target.closest("[data-id]"); if (!g) return; const id = +g.dataset.id; setHi(S.hi === id ? null : id); });

  function renderBeat(b) {
    const sec = D.S[b.sec];
    $("#secKick").textContent = `${b.sec + 1}. 구간 · ${fmtS(D.S[b.sec].beats[0][0])}~`;
    $("#secTitle").textContent = sec.title;
    $("#secEasy").textContent = sec.easy;
    $("#beatTime").textContent = `${fmt(b.t0)} ~ ${fmt(b.t1)}  ${countRange(b)}`;
    $("#beatCue").textContent = "신호: " + b.cue;
    $("#memo").value = store.get("memo." + b.t0.toFixed(2), "");
    const rows = [];
    for (const id of plan.ids) {
      if (S.filter === "G" && id > 10) continue;
      if (S.filter === "B" && id <= 10) continue;
      const pr = plan.presetFor(id, b) || {}, p = plan.posAt(id, b.t0 + 0.01), mv = moveDesc(id, b);
      const walkingPreset = pr.pose === "walk";
      const foot = mv && !walkingPreset ? `사뿐사뿐 걸어서 이동<span class="sm">도착 후: ${pr.foot}</span>` : pr.foot;
      const fan = mv && !walkingPreset ? `이동하는 동안 부채를 가슴에 붙이기<span class="sm">도착 후: ${pr.fan}</span>` : pr.fan;
      rows.push(`<tr class="${S.hi === id ? "hi" : ""} ${mv ? "moving" : ""}" data-id="${id}"><td>${badge(id)}</td><td>${zone(p[0], p[1])}<span class="sm">${coord(p[0], p[1])}</span></td><td>${foot || "-"}</td><td>${pr.arm || "-"}</td><td>${fan || "-"}</td><td>${pr.look || "-"}</td><td>${mv ? mv.html : '<span class="sm">제자리</span>'}</td></tr>`);
    }
    $("#tbody").innerHTML = rows.join("");
    $$("#p-sections .beats button").forEach(x => x.classList.toggle("on", +x.dataset.i === b.index));
  }
  $("#tbody").addEventListener("click", e => { const tr = e.target.closest("tr[data-id]"); if (tr) setHi(S.hi === +tr.dataset.id ? null : +tr.dataset.id); });
  $("#memo").addEventListener("input", e => { const b = plan.beats[S.beatIdx]; if (b) store.set("memo." + b.t0.toFixed(2), e.target.value); });

  function setHi(id) { S.hi = id; store.set("hi", id); $("#who").value = id || ""; render("beat"); render(true); }

  // ---------- 조작 ----------
  $("#bPlay").onclick = () => setPlaying(!S.playing);
  $("#bBackF").onclick = () => step(-1); $("#bFwdF").onclick = () => step(1);
  $("#bBack1").onclick = () => step(-FPS); $("#bFwd1").onclick = () => step(FPS);
  $("#bPrevBeat").onclick = () => { const b = plan.beats[S.beatIdx]; const t = curTime(); seek(t - b.t0 > 0.4 ? b.t0 : (plan.beats[Math.max(0, S.beatIdx - 1)].t0)); };
  $("#bNextBeat").onclick = () => { const n = plan.beats[Math.min(plan.beats.length - 1, S.beatIdx + 1)]; seek(n.t0); };
  $("#speed").onchange = e => { S.speed = +e.target.value; if (S.src === "video") video.playbackRate = S.speed; if (S.src === "yt" && ytReady) yt.setPlaybackRate(S.speed); };
  $("#loop").onchange = e => S.loop = e.target.checked;
  document.addEventListener("keydown", e => {
    if (e.target.matches("input,select,textarea")) return;
    if (e.key === " ") { e.preventDefault(); setPlaying(!S.playing); }
    else if (e.key === "ArrowLeft" || e.key === ",") { e.preventDefault(); step(e.shiftKey ? -FPS : -1); }
    else if (e.key === "ArrowRight" || e.key === ".") { e.preventDefault(); step(e.shiftKey ? FPS : 1); }
    else if (e.key === "[") $("#bPrevBeat").click();
    else if (e.key === "]") $("#bNextBeat").click();
  });
  $$(".dtabs button").forEach(bt => bt.onclick = () => { S.mode = bt.dataset.mode; store.set("mode", S.mode); $$(".dtabs button").forEach(x => x.setAttribute("aria-selected", x === bt)); render(true); });
  $$(".dtabs button").forEach(x => x.setAttribute("aria-selected", x.dataset.mode === S.mode));
  $$(".filters .chip").forEach(ch => ch.onclick = () => { S.filter = ch.dataset.f; $$(".filters .chip").forEach(x => x.setAttribute("aria-pressed", x === ch)); render("beat"); });
  const who = $("#who"), stuSel = $("#stuSel");
  plan.ids.forEach(id => { const o = `<option value="${id}">${id}번 (${id <= 10 ? "여" : "남"})</option>`; who.insertAdjacentHTML("beforeend", o); stuSel.insertAdjacentHTML("beforeend", o); });
  who.value = S.hi || ""; who.onchange = () => setHi(who.value ? +who.value : null);

  // 인원수 · 무대 크기 설정
  $("#nG").value = cfg.nG; $("#nB").value = cfg.nB;
  $("#stW").value = stage.W; $("#stD").value = stage.D; $("#stStep").value = S.set.step;
  $("#cntInfo").textContent = `여 ${cfg.nG}명 · 남 ${cfg.nB}명 = 모두 ${cfg.nG + cfg.nB}명 · 무대 ${stage.W}×${stage.D}m · 계산 ${buildMs}ms`;
  $("#roleInfo").innerHTML = [["가운데 솔로", RO.solo], ["왼쪽 회전", RO.spinL], ["오른쪽 회전", RO.spinR], ["층층 부채 · 듀엣", RO.duetA], ["듀엣 짝", RO.duetB], ["가운데 기둥", RO.pillar]]
    .map(([n, id]) => `<span class="rolechip">${badge(id)}${n}</span>`).join("");
  const apply = (over) => { store.set("cfg", Object.assign({}, cfg, over)); location.search = `?g=${(over && over.nG) ?? cfg.nG}&b=${(over && over.nB) ?? cfg.nB}`; };
  $("#makeBtn").onclick = () => apply({ nG: +$("#nG").value, nB: +$("#nB").value, W: +$("#stW").value, D: +$("#stD").value });
  $("#autoStage").onclick = () => { const a2 = window.FLEX.suggestStage(+$("#nG").value, +$("#nB").value); $("#stW").value = a2.W; $("#stD").value = a2.D; };
  $$('input[name=view]').forEach(r => r.checked = r.value === S.set.view);
  const saveSet = () => { S.set = { W: stage.W, Dp: stage.D, step: +$("#stStep").value || 0.5, view: ($('input[name=view]:checked') || {}).value || "student" }; store.set("set", S.set); render("beat"); render(true); renderStudent(); renderSafety(); };
  $("#stStep").addEventListener("change", saveSet);
  $$('input[name=view]').forEach(r => r.addEventListener("change", saveSet));

  // ---------- 아래 탭 ----------
  $$(".tabs button").forEach(bt => bt.onclick = () => {
    $$(".tabs button").forEach(x => x.setAttribute("aria-selected", x === bt));
    ["sections", "key", "student", "dict", "safety", "practice"].forEach(n => $("#p-" + n).hidden = n !== bt.dataset.tab);
    if (bt.dataset.tab === "key") renderKey();
  });

  // 구간 목록
  $("#p-sections").innerHTML = `<div class="seclist">` + D.S.map((sec, si) => {
    const bs = plan.beats.filter(b => b.sec === si);
    return `<div class="sec"><h3><span class="t">${fmtS(bs[0].t0)}</span>${si + 1}. ${sec.title}</h3><p>${sec.easy}</p><div class="beats">${bs.map(b => `<button data-i="${b.index}"><span class="t">${fmtS(b.t0)}</span>${b.cue}</button>`).join("")}</div></div>`;
  }).join("") + `</div>`;
  $("#p-sections").addEventListener("click", e => { const b = e.target.closest("button[data-i]"); if (b) { seek(plan.beats[+b.dataset.i].t0 + 0.02); window.scrollTo({ top: 0, behavior: "smooth" }); } });

  // 핵심 대형 그림
  let keyDone = false;
  function renderKey() {
    if (keyDone) return; keyDone = true;
    $("#p-key").innerHTML = `<p class="note">중요한 순간 ${D.KEY.length}장면이에요. 위는 객석에서 본 모습, 아래는 위에서 본 자리예요. 카드를 누르면 그 장면으로 가요.</p><div class="gallery">` +
      D.KEY.map(([t, n]) => `<button class="kcard" data-t="${t}" style="padding:0;text-align:left;font:inherit;color:inherit;cursor:pointer"><div class="pics">${FIG.front(plan, t, {})}${FIG.top(plan, t, { flip: !aud(), paths: false })}</div><div class="cap"><b>${n}</b><span>${fmtS(t)}</span></div></button>`).join("") + `</div>`;
  }
  $("#p-key").addEventListener("click", e => { const c = e.target.closest("[data-t]"); if (c) { seek(+c.dataset.t); window.scrollTo({ top: 0, behavior: "smooth" }); } });

  // 학생별 동선표
  stuSel.value = S.hi || 1;
  $("#stuName").value = store.get("name." + stuSel.value, "");
  function renderStudent() {
    const id = +stuSel.value;
    const rows = plan.beats.map(b => {
      const pr = plan.presetFor(id, b) || {}, p = plan.posAt(id, b.t0 + 0.01), mv = moveDesc(id, b);
      return `<tr><td><b>${fmtS(b.t0)}</b><span class="sm">${countRange(b)}</span></td><td>${b.cue}${store.get("memo." + b.t0.toFixed(2), "") ? `<span class="sm">🎵 ${store.get("memo." + b.t0.toFixed(2), "")}</span>` : ""}</td><td>${zone(p[0], p[1])}</td><td>${pr.foot || "-"} / ${pr.arm || "-"}<span class="sm">부채: ${pr.fan || "-"} · 시선: ${pr.look || "-"}</span></td><td>${mv ? mv.html : '<span class="sm">제자리</span>'}</td></tr>`;
    }).join("");
    const nm = $("#stuName").value.trim();
    $("#stuBody").innerHTML = `<h3>${badge(id)} ${id}번 ${id <= 10 ? "(여)" : "(남)"} ${nm ? "· " + nm : ""} 동선표</h3><p class="note">왼쪽·오른쪽은 ${aud() ? "객석에서 볼 때" : "무대에서 객석을 볼 때(내 몸 기준)"}예요. 걸음 수는 무대 ${S.set.W}m×${S.set.Dp}m, 한 걸음 ${S.set.step}m 기준이에요.</p><div class="tablewrap"><table><thead><tr><th>시간</th><th>신호</th><th>내 자리</th><th>동작</th><th>이동</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  stuSel.onchange = () => { $("#stuName").value = store.get("name." + stuSel.value, ""); renderStudent(); };
  $("#stuName").oninput = e => { store.set("name." + stuSel.value, e.target.value); renderStudent(); };
  $("#stuPrint").onclick = () => { document.body.classList.add("print-stu"); window.print(); setTimeout(() => document.body.classList.remove("print-stu"), 500); };

  // 부채 동작 사전
  $("#p-dict").innerHTML = `<p class="note">부채를 펴는 순간, 접는 순간, 얼굴을 가리는 높이, 머리 위 각도예요. 카드를 누르면 그 장면으로 가요.</p><div class="dict">` +
    D.MOMENTS.map(m => `<div class="dcard">${FIG.single(m.fs, true, m.fs === "spin" ? "spin" : "stand")}<div><h3>${m.title}</h3><p>${m.text}</p><button class="btn" data-t="${m.t}">▶ ${fmtS(m.t)} 장면 보기</button></div></div>`).join("") + `</div>`;
  $("#p-dict").addEventListener("click", e => { const c = e.target.closest("[data-t]"); if (c) { seek(+c.dataset.t); window.scrollTo({ top: 0, behavior: "smooth" }); } });

  // 안전 동선 점검
  function renderSafety() {
    const hard = plan.trans.reduce((n, tr) => n + tr.issues.filter(i => i.kind === "충돌").length, 0);
    const tightAll = plan.trans.reduce((n, tr) => n + tr.issues.filter(i => i.kind === "좁음").length, 0);
    $("#p-safety").innerHTML = `<p class="safe-sum">${hard === 0 ? "✅ 서로 부딪히는 곳 없음" : `⚠ 아주 좁게 스치는 곳 ${hard}곳 — 그 구간은 천천히 연습하세요`}</p>
      <p class="note">모두가 서로 피하면서 걷도록 계산했어요(가까워지면 자동으로 비켜 갑니다). 줄 사이로 지나갈 때는 ${Math.round(plan.warnGap * 100)}cm보다 가까워질 수 있어요 — <b>부채를 가슴에 붙이고 몸을 옆으로</b> 돌려 지나가면 됩니다. 좁은 곳 ${tightAll}군데는 아래에 표시했어요. 무대를 조금 더 넓게 잡으면 여유가 생겨요.</p><div class="safe">` +
      plan.trans.map(tr => {
        const A = plan.forms[tr.from], B = plan.forms[tr.to];
        const special = Object.values(tr.movers).filter(m => m.moving && (m.route !== "s" || m.delay > 0 || (m.startT != null && m.startT > tr.t0 + 0.2)));
        const narrow = tr.issues.filter(i => i.kind === "좁음");
        const behind = [];
        for (const id of plan.ids) for (const n of (tr.near[id] || [])) if (n.rel === "behind" && n.d < 0.95 && tr.movers[id].moving) behind.push(`${id}번 → ${n.other}번 뒤로`);
        return `<div class="sec"><h3><span class="t">${fmtS(tr.t0)}~${fmtS(tr.t1)}</span>${A.name} → ${B.name}</h3>
          <ul>${special.length ? special.map(m => `<li>${badge(m.id)} ${(m.startT != null ? m.startT - tr.t0 : m.delay) > 0.2 ? `<b>${Math.round(((m.startT != null ? m.startT - tr.t0 : m.delay)) / BEAT)}박 기다렸다</b> 출발` : "바로 출발"}${m.route !== "s" ? " · " + (m.route === "bk" ? "뒤쪽 길로 돌아가기" : m.route === "fr" ? "앞쪽 길로 돌아가기" : m.route === "hv" || m.route === "vh" ? "ㄱ자로 꺾어 가기" : "둥글게 돌아가기") : ""}</li>`).join("") : "<li>모두 곧게 이동</li>"}
          ${behind.length ? `<li>뒤로 지나가기: ${[...new Set(behind)].slice(0, 8).join(", ")}</li>` : ""}
          ${narrow.length ? `<li class="warn">좁은 곳(부채를 가슴에 붙이기): ${narrow.map(i => `${i.a}·${i.b}번`).join(", ")}</li>` : ""}</ul></div>`;
      }).join("") + `</div>`;
  }

  // 연습 순서
  $("#p-practice").innerHTML = `<div class="practice card"><h3>연습 순서 제안 (${cfg.nG + cfg.nB}명: 여 ${cfg.nG} · 남 ${cfg.nB})</h3>
    <ol>
      <li><b>기본 부채 동작 6가지</b>를 자리에서 먼저: 펴기·접기 → 가슴 수평 물결 → 머리 위 45°(V자) → 머리 위 지붕 → 얼굴 앞 동그라미(꽃송이) → 옆 날개. '부채 동작 사전' 탭의 그림을 보며 해요.</li>
      <li><b>바닥 표시</b>: 무대에 가로 1m마다 번호 테이프(0~${stage.W}), 앞에서 1m·2m·3m 줄을 붙이면 '가로 4.5m · 앞에서 1.2m'를 바로 찾을 수 있어요.</li>
      <li><b>쉬운 구간부터</b>: 한 줄 물결과 파도(4:04~4:38) → 꽃 10송이(3:29~3:44) → 네 줄 기차(1:23~1:43).</li>
      <li><b>도입</b>(0:05~0:58): 1번 솔로, 반달 모양, 8·9·10번 등장 타이밍.</li>
      <li><b>이동이 많은 구간</b>(1:43~2:24, 3:04~3:31)은 음악 없이 0.5배 속도로 '기다렸다 출발' 학생부터 확인해요. '안전 동선 점검' 탭에 누가 먼저 가는지 정리돼 있어요.</li>
      <li><b>특별 역할</b>: ${RO.spinL}·${RO.spinR}번 회전, ${RO.stack}번 층층 부채, ${RO.duetA}·${RO.duetB}번 듀엣, ${RO.pillar}번 가운데 기둥은 따로 연습한 뒤 합쳐요.</li>
      <li>전체 연습 때는 '몇 번 구간부터'라고 부르고, 화면의 박 세기(1~8)를 같이 세면 박자가 잘 맞아요.</li>
    </ol></div>`;

  // 시작
  renderStudent(); renderSafety();
  const startT = +(new URLSearchParams(location.search).get("t") || 5);
  S.t = startT; render(true);
  window.BUCHAE = { seek, plan, state: S, data: D, cfg };
})();
