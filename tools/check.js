// node tools/check.js — 대형 간격 · 이동 충돌 · 속도 점검
const D = require("../js/choreo.js");
const { build } = require("../js/plan.js");
const fs = require("fs"), path = require("path");
const plan = build(D);
// 브라우저용: 미리 계산한 우회 경로·출발 박 저장
const routes = plan.exportRoutes();
fs.writeFileSync(path.join(__dirname, "../js/plan-data.js"), "// tools/check.js가 만든 파일 — 직접 고치지 마세요\nwindow.PLAN_ROUTES = " + JSON.stringify(routes) + ";\n");
let bad = 0;
console.log("대형", plan.forms.length, "개 · 박", plan.beats.length, "개 · 전환", plan.trans.length, "개");
for (const s of plan.staticIssues) { console.log(`[간격] ${s.form}: ${s.a}번-${s.b}번 ${s.d.toFixed(2)}m`); bad++; }
for (const tr of plan.trans) {
  const A = plan.forms[tr.from], B = plan.forms[tr.to];
  const moved = Object.values(tr.movers).filter(m => m.moving);
  const fast = moved.filter(m => m.len / (tr.t1 - tr.t0 - m.delay) > 1.1);
  const special = moved.filter(m => m.route !== "s" || m.delay > 0);
  const hard = tr.issues.filter(i => i.kind === "충돌"), warn = tr.issues.filter(i => i.kind === "좁음");
  console.log(`${A.id} → ${B.id} (${tr.t0}~${tr.t1}s, ${moved.length}명 이동)` +
    (special.length ? " 우회/대기: " + special.map(m => `${m.id}번(${m.route}${m.delay ? "," + Math.round(m.delay / plan.BEAT) + "박" : ""})`).join(" ") : "") +
    (fast.length ? " 빠름: " + fast.map(m => `${m.id}번 ${(m.len / (tr.t1 - tr.t0 - m.delay)).toFixed(2)}m/s`).join(" ") : ""));
  for (const i of hard) { console.log(`   ✗ 충돌 ${i.a}번-${i.b}번 ${i.d.toFixed(2)}m @${i.t.toFixed(2)}s`); bad++; }
  for (const i of warn) console.log(`   △ 좁음 ${i.a}번-${i.b}번 ${i.d.toFixed(2)}m @${i.t.toFixed(2)}s`);
}
// 박 · 동작 누락 검사
for (const b of plan.beats) for (const id of plan.ids) if (!plan.presetFor(id, b)) { console.log(`[동작 없음] ${b.t0.toFixed(1)}s ${b.cue} — ${id}번(${plan.tagOf(id, b.t0)})`); bad++; }
// 저장한 경로로 다시 만들어 결과가 같은지 확인
const again = build(D, routes);
const hard2 = again.trans.reduce((n, tr) => n + tr.issues.filter(i => i.kind === "충돌").length, 0);
console.log("미리 계산한 경로로 다시 확인: 충돌", hard2, "건");
console.log(bad ? `문제 ${bad}건` : "문제 없음");
process.exitCode = bad ? 1 : 0;
