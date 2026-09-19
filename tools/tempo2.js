const fs=require('fs');const buf=fs.readFileSync('sheets/audio.raw');const sr=11025,hop=128;const n=buf.length/2;
const fps=sr/hop,frames=Math.floor(n/hop),env=new Float32Array(frames);let prev=0;
for(let f=0;f<frames;f++){let e=0;for(let i=0;i<hop;i++){const v=buf.readInt16LE((f*hop+i)*2)/32768;e+=v*v}e=Math.log(1e-6+e);env[f]=Math.max(0,e-prev);prev=e}
const at=t=>{const i=t*fps,a=Math.floor(i);return (env[a]||0)*(1-(i-a))+(env[a+1]||0)*(i-a)};
function fit(a,b){let best={sc:-1};for(let bpm=115;bpm<=128;bpm+=0.02){const per=60/bpm;for(let ph=0;ph<per;ph+=0.01){let sc=0,c=0;for(let t=a+ph;t<b;t+=per){sc+=at(t);c++}sc/=c;if(sc>best.sc)best={sc,bpm,ph:a+ph}}}return best}
for(const [a,b] of [[21,100],[100,200],[200,300],[21,312]]){const r=fit(a,b);console.log(a,b,r.bpm.toFixed(2),r.ph.toFixed(3))}
