// node tools/check-flex.js [--full]  — 인원수를 바꿔 가며 대형이 제대로 만들어지는지 점검
const BASE = require("../js/choreo.js");
const FLEX = require("../js/choreo-flex.js");
const PLAN = require("../js/plan.js");

const COMBOS = [[10, 9], [12, 12], [8, 4], [4, 8], [15, 5], [20, 20], [6, 2], [13, 8], [9, 11], [16, 14], [24, 16], [5, 3], [3, 5], [20, 0], [0, 12], [2, 2], [3, 1], [1, 3], [4, 0], [0, 4], [30, 10], [10, 30], [18, 18]];
const FLEXAPI = require("../js/choreo-flex.js");
const stageFor = (n, g, b) => FLEXAPI.suggestStage(g, b);
const full = process.argv.includes("--full");
let bad = 0;

for (const [nG, nB] of COMBOS) {
  const N = nG + nB, ST = stageFor(N, nG, nB);
  let D, forms;
  try {
    D = FLEX.make(nG, nB, ST, BASE);
    forms = PLAN.resolveFormations(D);
  } catch (e) { console.log(`여${nG}·남${nB} (${N}명, ${ST.W}×${ST.D}m) ✗ ${e.message}`); bad++; continue; }
  const ids = D.GIRLS.concat(D.BOYS);
  const tight = [];
  for (const f of forms) {
    let worst = { d: 9 };
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
      const a = f.pos[ids[i]], b = f.pos[ids[j]];
      if (a.x < -0.2 || b.x < -0.2 || a.x > ST.W + 0.2 || b.x > ST.W + 0.2) continue; // 무대 밖 대기
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < worst.d) worst = { d, a: ids[i], b: ids[j] };
    }
    const off = ids.filter(id => f.pos[id].x < -0.2 || f.pos[id].x > ST.W + 0.2).length;
    if (worst.d < 0.55) { tight.push(`${f.id} ${worst.a}·${worst.b}번 ${worst.d.toFixed(2)}m`); }
    void off;
  }
  const line = `여${nG}·남${nB} (${N}명, ${ST.W}×${ST.D}m) 대형 ${forms.length}개` + (tight.length ? ` ✗ 간격 좁음 ${tight.length}곳: ${tight.slice(0, 4).join(", ")}` : " ✓ 간격 OK");
  console.log(line);
  if (tight.length) bad++;
  if (full) {
    const plan = PLAN.build(D);
    const hard = plan.trans.reduce((n, tr) => n + tr.issues.filter(i => i.kind === "충돌").length, 0);
    const fast = plan.trans.flatMap(tr => Object.values(tr.movers).filter(m => m.moving && m.len / (tr.t1 - tr.t0 - m.delay) > 1.15).map(m => `${m.id}번`));
    console.log(`   이동: 부딪힘 ${hard}건, 빠른 걸음 ${fast.length}명${hard ? " ✗" : " ✓"}`);
    if (hard) bad++;
  }
}
console.log(bad ? `문제 ${bad}건` : "모두 통과");
process.exitCode = bad ? 1 : 0;
