// 음악 박자(BPM)와 박 위치 추정: 에너지 변화(onset) → 자기상관
const fs = require('fs');
const buf = fs.readFileSync(process.argv[2]);
const sr = 11025, hop = 256;
const n = buf.length / 2, s = new Float32Array(n);
for (let i = 0; i < n; i++) s[i] = buf.readInt16LE(i * 2) / 32768;
const frames = Math.floor(n / hop), env = new Float32Array(frames);
let prev = 0;
for (let f = 0; f < frames; f++) {
  let e = 0; for (let i = 0; i < hop; i++) { const v = s[f * hop + i]; e += v * v; }
  e = Math.log(1e-6 + e); env[f] = Math.max(0, e - prev); prev = e;
}
const fps = sr / hop;
function tempo(a, b) { // 구간 [a,b]초
  const fa = Math.floor(a * fps), fb = Math.floor(b * fps);
  let best = 0, bl = 0;
  for (let bpm = 60; bpm <= 160; bpm += 0.5) {
    const lag = fps * 60 / bpm; let c = 0;
    for (let f = fa; f < fb - lag * 4; f++) c += env[f] * (env[Math.round(f + lag)] + 0.5 * env[Math.round(f + 2 * lag)]);
    if (c > best) { best = c; bl = bpm; }
  }
  return bl;
}
const segs = [[21, 60], [60, 100], [100, 140], [140, 180], [180, 220], [220, 260], [260, 300], [21, 300]];
for (const [a, b] of segs) console.log(`${a}-${b}s: ${tempo(a, b)} BPM`);
// 박 위상: 21~300s 전체 BPM으로 가장 강한 위상 찾기
const bpm = +process.argv[3] || tempo(21, 300), per = 60 / bpm;
let bestPh = 0, bestSc = -1;
for (let ph = 0; ph < per; ph += 0.005) {
  let sc = 0; for (let t = 21 + ph; t < 300; t += per) sc += env[Math.round(t * fps)] || 0;
  if (sc > bestSc) { bestSc = sc; bestPh = ph; }
}
console.log('BPM', bpm, 'first beat', (21 + bestPh).toFixed(3), 'period', per.toFixed(4));
