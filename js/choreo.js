// 부채춤 '아름다운 나라' — 19명(여10·남9) 재구성 안무 데이터
// 좌표(단위 m, 무대 10m × 6m 기준): x 0 = 객석에서 볼 때 왼쪽 끝 → 10 = 오른쪽 끝
//                                  y 0 = 무대 뒤(배경막) → 6 = 무대 앞(객석 쪽)
// 번호: 1~10 여학생(원), 11~19 남학생(네모)
(function (root) {
  const MUSIC = { bpm: 122.66, firstBeat: 21.26, start: 21.26, end: 313.0, barOffset: 2 };

  // ---------- 동작 사전 (fs = 그림용 부채 상태, pose = 그림용 자세) ----------
  const P = {
    standWaitDown: { pose: "stand", fs: "closed", foot: "두 발 모아 서기", arm: "두 팔 힘 빼고 아래로", fan: "접은 부채를 두 손에 하나씩, 허리 옆에 늘어뜨리기", look: "고개 숙여 발끝 보기" },
    kneelFloorSolo: { pose: "kneel", fs: "floor", foot: "무릎 꿇고 앉기", arm: "두 손을 부채 손잡이 위에", fan: "부채를 펴서 무릎 앞 바닥에 엎어 두기", look: "고개 숙이기" },
    off: { pose: "off", fs: "closed", foot: "무대 옆 커튼 뒤에서 기다리기", arm: "-", fan: "접은 채 들고 있기", look: "-" },
    crouchWait: { pose: "crouch", fs: "floor", foot: "무릎 꿇고 엉덩이를 뒤꿈치에 붙여 웅크리기", arm: "두 팔 앞으로 모아 바닥에", fan: "부채를 펴서 바닥에 엎어 두기", look: "바닥(고개 숙임)" },
    openWalk: { pose: "walk", fs: "chest", foot: "뒤꿈치부터 사뿐사뿐, 한 박에 한 걸음", arm: "두 팔을 가슴 앞으로", fan: "첫 소리에 '촥' 펴기 → 두 부채를 나란히 가슴 높이 수평, 좌우로 물결", look: "가는 방향" },
    riseUp: { pose: "stand", fs: "up", foot: "4박 동안 천천히 일어나기", arm: "두 팔을 V자로 머리 위", fan: "바닥의 부채를 들어 머리 위 45°, 부채 면이 객석을 보게", look: "부채를 따라 위로 → 정면" },
    walkChestWave: { pose: "walk", fs: "chest", foot: "뒤꿈치부터 사뿐사뿐, 한 박에 한 걸음", arm: "두 팔을 가슴 앞으로", fan: "가슴 높이 수평, 좌우로 물결", look: "가는 방향 → 도착하면 정면" },
    gatherUp: { pose: "stand", fs: "up", foot: "제자리 서기", arm: "두 팔을 천천히 위로", fan: "가슴 높이에서 머리 위로 들어 올리기", look: "가운데 친구" },
    archRoof: { pose: "stand", fs: "roof", foot: "두 발 모아 서기", arm: "두 팔을 쭉 펴서 귀 옆까지", fan: "머리 위 수평(지붕) — 옆 친구 부채 끝과 닿게", look: "정면" },
    hideCrouch: { pose: "crouch", fs: "hold", foot: "아치 안에서 무릎 굽혀 웅크리기", arm: "두 팔 가슴에 모으기", fan: "부채를 가슴에 붙여 숨기기", look: "아래" },
    kneelDown: { pose: "kneel", fs: "low", foot: "4박에 걸쳐 무릎 꿇고 앉기", arm: "두 팔 앞으로 낮게", fan: "부채를 바닥 가까이 수평으로 내리기", look: "부채 끝" },
    riseBoys: { pose: "stand", fs: "up", foot: "웅크린 자세에서 일어나며 한 걸음 뒤로", arm: "두 팔을 V자로 머리 위", fan: "바닥의 부채를 들어 머리 위 45°", look: "정면 위" },
    soloStandHigh: { pose: "stand", fs: "spin", foot: "제자리 서기", arm: "오른팔 높이, 왼팔 옆으로", fan: "오른손 부채 머리 위, 왼손 부채 어깨 옆", look: "오른손 부채" },
    kneelSweep: { pose: "kneel", fs: "low", foot: "무릎 꿇고 앉기", arm: "두 팔 앞으로 낮게", fan: "바닥 가까이 수평, 2박에 한 번씩 좌우로 쓸기", look: "부채 끝" },
    up: { pose: "stand", fs: "up", foot: "두 발 어깨너비", arm: "두 팔 V자(머리 위 45°)", fan: "머리 위 45°, 부채 면이 객석을 보게", look: "정면" },
    upSway: { pose: "stand", fs: "up", foot: "두 발 어깨너비, 무릎 살짝 굽혔다 펴기", arm: "두 팔 V자(머리 위 45°)", fan: "머리 위 45°에서 2박씩 좌우로 크게 흔들기", look: "정면 위" },
    circleChest: { pose: "stand", fs: "circleChest", foot: "두 발 모아 서기", arm: "팔꿈치를 옆구리에 붙이기", fan: "두 부채 손잡이를 맞대 몸 앞 가슴 높이에 동그라미 세우기", look: "정면" },
    pushFront: { pose: "kneel", fs: "low", foot: "무릎 꿇고 앉기", arm: "두 팔을 앞으로 쭉 → 당기기", fan: "바닥 가까이 수평으로 앞으로 밀었다 당기기(4박)", look: "부채 끝" },
    walkTo: { pose: "walk", fs: "hold", foot: "뒤꿈치부터 사뿐사뿐 걷기", arm: "두 팔 가슴 앞", fan: "부채를 가슴에 붙여 들기", look: "가는 방향" },
    enter: { pose: "walk", fs: "low", foot: "무대 옆에서 사뿐사뿐 걸어 나오기", arm: "두 팔 앞으로 낮게", fan: "부채를 펴서 허리 아래로 낮게 들기", look: "가는 방향" },
    sideLow: { pose: "stand", fs: "downOpen", foot: "두 발 어깨너비", arm: "두 팔 허리 옆으로 내리기", fan: "허리 옆에서 좌우로 흔들기", look: "정면" },
    spin: { pose: "spin", fs: "spin", foot: "제자리에서 작은 걸음으로 오른쪽으로 돌기(8박에 한 바퀴, 치마가 펴지게)", arm: "오른팔 머리 위 45°, 왼팔 허리 옆", fan: "오른손 부채 머리 위, 왼손 부채 허리 옆에 비스듬히", look: "오른손 부채 보며 돌기" },
    circleHigh: { pose: "stand", fs: "circleHigh", foot: "제자리", arm: "두 팔 머리 위로 모으기", fan: "두 부채 손잡이를 맞대 머리 위에 동그라미", look: "정면" },
    circle: { pose: "stand", fs: "circle", foot: "제자리", arm: "팔꿈치 붙이고 두 손을 코 앞에", fan: "동그라미를 얼굴 앞으로 — 원 가운데가 코 높이, 눈까지 가리기", look: "부채 뒤에서 정면" },
    circleKneel: { pose: "kneel", fs: "circle", foot: "무릎 꿇고 앉기(허리 세우기)", arm: "팔꿈치 붙이고 두 손을 코 앞에", fan: "두 부채 손잡이를 맞대 얼굴 앞 동그라미 — 원 가운데가 코 높이, 눈까지 가리기", look: "부채 뒤에서 정면" },
    butterfly: { pose: "stand", fs: "butterfly", foot: "두 발 모아 서기", arm: "팔꿈치 굽혀 두 손을 얼굴 양옆에", fan: "두 부채를 얼굴 양옆에 세로로 세우기(나비 날개) — 얼굴은 보이게", look: "정면" },
    sideWave: { pose: "stand", fs: "side", foot: "두 발 어깨너비", arm: "두 팔 옆으로 어깨 높이", fan: "부채를 옆으로 눕혀 2박씩 좌우로 흔들기", look: "정면" },
    walkHold: { pose: "walk", fs: "hold", foot: "뒤꿈치부터 사뿐사뿐, 한 박에 한 걸음", arm: "두 팔 가슴 앞", fan: "부채를 펴서 가슴에 붙이기(옆 친구에게 닿지 않게)", look: "가는 방향" },
    kneelLowSide: { pose: "kneel", fs: "ringLow", foot: "무릎 꿇고 앉기", arm: "두 팔 옆·아래로", fan: "바닥 가까이에서 옆으로 펼치기", look: "정면" },
    waveSide: { pose: "stand", fs: "side", foot: "두 발 어깨너비", arm: "두 팔 옆으로", fan: "옆으로 펴서 2박씩 좌우로 흔들기", look: "가운데 꽃" },
    pillarKneel: { pose: "kneel", fs: "vertical", foot: "무릎 꿇고 앉기", arm: "두 팔 몸 옆으로", fan: "부채를 몸 옆에 세로로 세우기(기둥)", look: "정면" },
    pillarStand: { pose: "stand", fs: "vertical", foot: "두 발 모아 서기", arm: "두 팔 몸 옆으로 조금 높게", fan: "부채를 몸 옆에 세로로 세우기 — 앞 친구 부채보다 한 뼘 높게", look: "정면" },
    ringStand: { pose: "stand", fs: "ring", foot: "두 발 모아 서기", arm: "두 팔을 옆·아래로 둥글게", fan: "옆으로 펼쳐 꽃잎 — 옆 친구 부채와 이어지게", look: "정면" },
    ringKneel: { pose: "kneel", fs: "ringLow", foot: "무릎 꿇고 앉기", arm: "두 팔을 옆·아래로 둥글게", fan: "바닥 가까이 옆으로 펼쳐 꽃 아래쪽 테두리", look: "정면" },
    bud: { pose: "stand", fs: "bud", foot: "두 발 모아 서기", arm: "두 팔을 머리 위로 모으기", fan: "두 부채를 머리 위에서 세로로 붙이기(꽃봉오리)", look: "정면" },
    kneelLow: { pose: "kneel", fs: "low", foot: "무릎 꿇고 앉기", arm: "두 팔 앞으로 낮게", fan: "부채를 바닥 가까이 수평으로", look: "부채" },
    chestSide: { pose: "stand", fs: "chest", foot: "두 발 모아 서기", arm: "두 팔을 가슴 앞에서 옆으로", fan: "가슴 높이 수평, 옆으로 펼치기", look: "정면" },
    wingSide: { pose: "stand", fs: "side", foot: "두 발 어깨너비", arm: "두 팔을 옆으로 쭉(어깨 높이)", fan: "양옆으로 세워 펼치기(날개)", look: "정면" },
    archSway: { pose: "stand", fs: "roof", foot: "무릎 살짝 굽혔다 펴기", arm: "두 팔 머리 위", fan: "지붕 모양 그대로 2박씩 좌우로 물결", look: "정면" },
    trainChest: { pose: "stand", fs: "chestLow", foot: "앞 친구 바로 뒤(한 걸음 간격), 발 모으기", arm: "두 팔을 허리 앞으로", fan: "허리 높이 수평으로 앞으로 펼쳐 좌우로 흔들기", look: "정면" },
    turnVertical: { pose: "spin", fs: "upVertical", foot: "제자리에서 한 바퀴(4박)", arm: "두 팔 머리 위", fan: "부채를 세로로 세워 머리 위에서 흔들기", look: "돌면서 부채" },
    facePartner: { pose: "stand", fs: "butterfly", foot: "짝 쪽으로 몸 돌리기", arm: "두 손 얼굴 양옆", fan: "얼굴 옆에 세로로 세워 흔들기", look: "짝 얼굴" },
    sideStepBand: { pose: "walk", fs: "side", foot: "무대 오른쪽(객석에서 볼 때)으로 옆걸음 — 2박에 한 걸음", arm: "두 팔을 옆으로 쭉", fan: "세로로 세워 옆 친구 부채와 이어진 띠, 2박씩 위아래 교차", look: "가는 방향" },
    march: { pose: "walk", fs: "side", foot: "가는 방향을 보고 제자리 걸음", arm: "한 팔 앞, 한 팔 뒤로 쭉", fan: "세로로 세워 앞뒤로", look: "가는 방향" },
    flowerCore: { pose: "stand", fs: "roof", foot: "두 발 모아 서기", arm: "두 팔 쭉 위로", fan: "머리 위 수평 — 꽃의 윗부분", look: "정면" },
    ringSway: { pose: "stand", fs: "ring", foot: "무릎 살짝 굽혔다 펴기", arm: "두 팔 옆·아래로 둥글게", fan: "꽃 테두리 모양 그대로 2박씩 위아래로 살짝 출렁", look: "정면" },
    chestWave: { pose: "stand", fs: "chest", foot: "두 발 모아 서기", arm: "두 팔 가슴 앞", fan: "가슴 높이 수평, 옆 친구 부채와 이어서 좌우 물결", look: "정면" },
    standReady: { pose: "stand", fs: "up", foot: "두 발 모아 서기", arm: "오른팔 위로 준비", fan: "회전 준비 — 오른손 부채 머리 위", look: "정면" },
    upVertical: { pose: "stand", fs: "upVertical", foot: "두 발 모아 서기", arm: "두 팔 쭉 위로", fan: "머리 위에 세로로 세우기(가운데 기둥)", look: "정면" },
    circleTilt: { pose: "kneel", fs: "circle", foot: "무릎 꿇고 앉기", arm: "팔꿈치 붙이기", fan: "얼굴 앞 동그라미를 2박씩 좌우로 기울이기", look: "부채 뒤에서 정면" },
    sideStepChest: { pose: "walk", fs: "chestLow", foot: "옆걸음(2박에 한 걸음, 오른쪽 → 왼쪽 → 제자리)", arm: "두 팔 허리 앞", fan: "두 부채를 붙여 허리 앞 수평", look: "정면" },
    roofOneByOne: { pose: "stand", fs: "roof", foot: "제자리", arm: "차례가 오면 두 팔 쭉 위로", fan: "왼쪽 친구가 올린 다음 한 박 뒤에 머리 위 수평으로 올리기", look: "정면" },
    riseWaveUp: { pose: "kneel", fs: "roof", foot: "무릎 꿇은 채 허리 세우기", arm: "차례대로 두 팔 위로", fan: "왼쪽 친구부터 한 박씩 차례로 머리 위로 올리기(파도)", look: "정면" },
    stackSolo: { pose: "kneel", fs: "stack", foot: "무릎 꿇고 앉기(허리 세우기)", arm: "두 손을 얼굴 앞에서 위로", fan: "두 부채를 세로로 겹쳐 얼굴 앞 → 머리 위까지 층층이 쌓기(8박), 4박씩 위아래", look: "부채" },
    wingDown: { pose: "stand", fs: "wingDown", foot: "두 발 어깨너비로 멈춤", arm: "두 팔을 옆·아래 45°로 쭉", fan: "날개처럼 비스듬히 펼쳐 멈춤", look: "정면" },
    downOpen: { pose: "stand", fs: "downOpen", foot: "두 발 모아 서기", arm: "두 팔 아래로", fan: "펴서 허리 옆 아래로", look: "가운데 친구" },
    tail: { pose: "stand", fs: "vertical", foot: "앞 친구 뒤 대각선에 서기", arm: "두 팔 몸 옆으로 올리기", fan: "세로로 세워 머리 옆 — 앞 친구보다 한 뼘 높게(공작 꼬리)", look: "정면" },
    duetCircle: { pose: "stand", fs: "side", foot: "짝과 앞뒤로 겹쳐 서기", arm: "두 팔을 몸 옆에서 크게 돌리기", fan: "세로로 세워 몸 옆에서 큰 원 그리기(4박)", look: "부채" },
    duetLowSpin: { pose: "spin", fs: "lowFront", foot: "4박 제자리 회전 → 4박 멈춤", arm: "한 팔 위, 한 팔 치마 앞", fan: "한 부채 머리 위 수평, 한 부채 치마 앞 수평", look: "정면" },
    floorFan: { pose: "kneel", fs: "floor", foot: "무릎 꿇고 앉기", arm: "두 손 앞으로 내리기", fan: "부채를 무릎 앞 바닥에 펼쳐 놓기", look: "부채" },
    riseLow: { pose: "stand", fs: "low", foot: "4박에 걸쳐 일어나기", arm: "두 팔 앞으로 낮게", fan: "무릎 높이 수평으로 앞으로 밀기", look: "정면" },
    roofWalk: { pose: "walk", fs: "roof", foot: "사뿐사뿐 걷기(한 박에 한 걸음)", arm: "두 팔 쭉 위로", fan: "머리 위 수평(지붕) 그대로 걷기", look: "가는 방향" },
    ringTurn: { pose: "spin", fs: "ring", foot: "친구들과 등을 맞대고 작은 걸음으로 시계 방향 돌기(16박에 한 바퀴)", arm: "두 팔을 옆으로 둥글게", fan: "옆으로 펼쳐 꽃 테두리 — 옆 친구 부채와 이어지게", look: "정면" },
    lowBand: { pose: "lean", fs: "lowBand", foot: "무릎 살짝 굽히고 상체 숙이기", arm: "두 팔 앞 아래로", fan: "무릎~정강이 높이 수평, 옆 친구와 이어진 띠", look: "부채" },
    roofRise: { pose: "stand", fs: "roof", foot: "상체 세우며 서기", arm: "왼쪽 친구부터 반 박씩 차례로 두 팔 쭉 위로", fan: "머리 위 수평 띠", look: "정면" },
    waveRoll: { pose: "stand", fs: "roof", foot: "숙였다 펴기 반복", arm: "위 → 아래 → 위", fan: "파도: 왼쪽 친구가 숙이면 반 박 뒤 따라 숙여 부채를 무릎까지 내렸다 다시 머리 위로 (한 사람 기준 2박 위, 2박 아래)", look: "부채" },
    closeFan: { pose: "stand", fs: "closed", foot: "두 발 모아 서기", arm: "두 팔 아래로", fan: "마지막 소리에 '촥' 접기 → 두 손에 하나씩 허리 옆에 늘어뜨리기", look: "정면" },
    walkClosed: { pose: "walk", fs: "closed", foot: "사뿐사뿐 걷기", arm: "두 팔 아래로", fan: "접은 부채 두 손에 하나씩", look: "가는 방향 → 정면" },
    standClosed: { pose: "stand", fs: "closed", foot: "두 발 모아 서기", arm: "두 팔 아래로", fan: "접은 부채를 허리 옆에", look: "정면(객석)" },
    bowWave: { pose: "bow", fs: "bowFloor", foot: "왼쪽 친구부터 반 박씩 차례로 무릎 꿇고 앉기", arm: "두 손 모아 바닥", fan: "접은 부채를 무릎 앞 바닥에 내려놓기", look: "바닥(큰절)" },
    bow: { pose: "bow", fs: "bowFloor", foot: "무릎 꿇고 앉아 상체 숙이기", arm: "두 손 모아 바닥", fan: "무릎 앞 바닥", look: "바닥(큰절)" }
  };

  // ---------- 대형 도우미 ----------
  function line(n, x0, y0, x1, y1, tag) {
    const out = [];
    for (let i = 0; i < n; i++) { const t = n === 1 ? 0.5 : i / (n - 1); out.push([+(x0 + (x1 - x0) * t).toFixed(3), +(y0 + (y1 - y0) * t).toFixed(3), tag]); }
    return out;
  }
  function arc(n, cx, cy, r, a0, a1, tag) { // 각도 0 = 객석 기준 오른쪽, 90 = 무대 앞
    const out = [];
    for (let i = 0; i < n; i++) { const a = (a0 + (a1 - a0) * (n === 1 ? 0.5 : i / (n - 1))) * Math.PI / 180; out.push([+(cx + r * Math.cos(a)).toFixed(3), +(cy + r * Math.sin(a)).toFixed(3), tag]); }
    return out;
  }
  const mirror = (slots) => slots.map(([x, y, t]) => [+(10 - x).toFixed(3), y, t]);
  const range = (a, b) => { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; };
  const GIRLS = range(1, 10), BOYS = range(11, 19);
  const BL = [11, 12, 13, 14], BR = [15, 16, 17, 18];
  const NS = [1, 2, 3, 4, 5, 6, 7, 10]; // 회전 담당(8, 9) 뺀 여학생

  // 대형: pins = 고정 위치, groups = 후보 안에서 가장 가까운 사람이 자리 차지(선이 엇갈리지 않게 자동 배정)
  // group.pick: 후보 번호 배열 또는 "rest"(아직 자리 없는 모두)
  const F = [
    { id: "start", name: "시작 자세", tin: 5, tout: 21.3, ordered: true,
      pins: { 1: [5, 4.3, "solo"], 8: [-0.9, 5.2, "offL"], 9: [10.9, 5.2, "offR"], 10: [10.9, 3.4, "offR"], 19: [5, 1.5, "boyC"] },
      groups: [
        { pick: [2, 3, 4, 5, 6, 7], slots: line(6, 0.8, 1.4, 3.8, 2.4, "waitLine") },
        { pick: BL, slots: [[0.6, 4.9, "crouch"], [1.3, 4.6, "crouch"], [2.0, 4.9, "crouch"], [2.7, 4.6, "crouch"]] },
        { pick: BR, slots: [[7.3, 4.6, "crouch"], [8.0, 4.9, "crouch"], [8.7, 4.6, "crouch"], [9.4, 4.9, "crouch"]] }
      ] },
    { id: "gather", name: "솔로 둘러싸기", tin: 26.0, tout: 29.0, ordered: true,
      pins: { 1: [5, 4.3, "solo"], 8: [-0.9, 5.2, "offL"], 9: [10.9, 5.2, "offR"], 10: [10.9, 3.4, "offR"], 19: [5, 1.5, "boyC"] },
      keep: BOYS.filter(b => b !== 19),
      groups: [{ pick: [2, 3, 4, 5, 6, 7], slots: arc(6, 5, 4.1, 1.2, 195, 345, "ring") }] },
    { id: "kneelArc", name: "반원 무릎 · 남자 일어나기", tin: 30.0, tout: 40.0,
      pins: { 1: [5, 4.4, "solo"], 8: [-0.9, 5.2, "offL"], 9: [10.9, 5.2, "offR"], 10: [10.9, 3.4, "offR"], 19: [5, 1.7, "boyC"] },
      groups: [
        { pick: [2, 3, 4, 5, 6, 7], slots: arc(6, 5, 4.0, 1.55, 195, 345, "ring") },
        { pick: BL, slots: line(4, 0.6, 3.9, 2.5, 3.9, "boysL") },
        { pick: BR, slots: line(4, 7.5, 3.9, 9.4, 3.9, "boysR") }
      ] },
    { id: "spinEnter", name: "좌우 회전 · 두 층 꽃", tin: 44.5, tout: 58.8,
      pins: { 8: [1.8, 5.0, "spinL"], 9: [8.2, 5.0, "spinR"], 10: [6.4, 3.9, "back"], 19: [5, 1.8, "boyC"] },
      groups: [
        { pick: NS, slots: [[3.7, 5.0, "front"], [4.55, 5.25, "front"], [5.45, 5.25, "front"], [6.3, 5.0, "front"], [3.6, 3.9, "back"], [4.5, 3.6, "back"], [5.5, 3.6, "back"], [6.4, 3.9, "back"]] },
        { pick: BL, slots: line(4, 0.6, 3.4, 2.6, 3.4, "boysL") },
        { pick: BR, slots: line(4, 7.4, 3.4, 9.4, 3.4, "boysR") }
      ] },
    { id: "bigFlower", name: "가운데 큰 꽃", tin: 61.2, tout: 71.8,
      pins: { 8: [2.5, 4.3, "endL"], 19: [5, 2.2, "boyC"] },
      groups: [
        { pick: [1, 2, 3, 4, 5, 6, 7, 9, 10], slots: [[4.1, 5.25, "front"], [4.7, 5.45, "front"], [5.3, 5.45, "front"], [5.9, 5.25, "front"], [3.5, 4.3, "back"], [4.0, 3.5, "back"], [5.0, 3.2, "bud"], [6.0, 3.5, "back"], [6.5, 4.3, "back"]] },
        { pick: BL, slots: [[0.6, 4.8, "pillarF"], [1.3, 4.8, "pillarF"], [0.6, 3.9, "pillarB"], [1.3, 3.9, "pillarB"]] },
        { pick: BR, slots: mirror([[0.6, 4.8, "pillarF"], [1.3, 4.8, "pillarF"], [0.6, 3.9, "pillarB"], [1.3, 3.9, "pillarB"]]) }
      ] },
    { id: "twoRows", name: "두 줄 · 끝 날개", tin: 73.6, tout: 83.2,
      pins: { 8: [2.2, 4.3, "wing"], 9: [7.8, 4.3, "wing"], 19: [5, 2.2, "boyC"] },
      groups: [
        { pick: NS, slots: line(5, 3.4, 3.3, 6.6, 3.3, "back").concat([[4.2, 4.9, "front"], [5.0, 5.1, "front"], [5.8, 4.9, "front"]]) },
        { pick: BL, slots: [[0.6, 4.2, "kneelB"], [1.3, 4.2, "kneelB"], [0.6, 5.1, "kneelB"], [1.3, 5.1, "kneelB"]] },
        { pick: BR, slots: mirror([[0.6, 4.2, "kneelB"], [1.3, 4.2, "kneelB"], [0.6, 5.1, "kneelB"], [1.3, 5.1, "kneelB"]]) }
      ] },
    { id: "trains", name: "네 줄 기차", tin: 86.0, tout: 103.0,
      pins: { 19: [5, 4.0, "train"], 8: [3.6, 4.0, "train"], 9: [6.4, 4.0, "train"] },
      groups: [
        { pick: BL, slots: line(4, 1.3, 2.9, 1.3, 5.0, "train") },
        { pick: BR, slots: line(4, 8.7, 2.9, 8.7, 5.0, "train") },
        { pick: GIRLS, slots: line(5, 3.6, 2.6, 3.6, 5.4, "train").concat(line(5, 6.4, 2.6, 6.4, 5.4, "train")) }
      ] },
    { id: "lineL", name: "한 줄 짝 마주 보기", tin: 104.6, tout: 107.0,
      pins: { 8: [2.378, 3.5, "pairA"], 9: [6.822, 3.5, "pairA"] },
      groups: [{ pick: "rest", slots: line(19, 0.6, 3.5, 8.6, 3.5, "pair").map((s, i) => [s[0], i % 2 ? 4.1 : 3.5, i % 2 ? "pairB" : "pairA"]) }] },
    { id: "lineR", name: "옆걸음 띠(오른쪽으로)", tin: 117.0, tout: 121.0,
      pins: { 8: [3.178, 3.5, "pairA"], 9: [7.622, 3.5, "pairA"] },
      groups: [{ pick: "rest", slots: line(19, 1.4, 3.5, 9.4, 3.5, "pair").map((s, i) => [s[0], i % 2 ? 4.1 : 3.5, i % 2 ? "pairB" : "pairA"]) }] },
    { id: "clusters", name: "네 그룹 꽃", tin: 123.6, tout: 139.0,
      pins: { 19: [6.1, 3.6, "core"], 8: [1.6, 3.6, "core"], 9: [8.4, 3.6, "core"] },
      groups: [
        { pick: BL, slots: [[0.9, 4.1, "petal"], [2.3, 4.1, "petal"], [1.25, 4.7, "petal"], [1.95, 4.7, "petal"]] },
        { pick: BR, slots: [[7.7, 4.1, "petal"], [9.1, 4.1, "petal"], [8.05, 4.7, "petal"], [8.75, 4.7, "petal"]] },
        { pick: NS, slots: [[3.9, 3.6, "core"], [3.2, 4.1, "petal"], [4.6, 4.1, "petal"], [3.9, 4.7, "petal"],
          [5.4, 4.1, "petal"], [6.8, 4.1, "petal"], [5.75, 4.7, "petal"], [6.45, 4.7, "petal"]] }
      ] },
    { id: "frontKneel", name: "층층 부채 원", tin: 144.0, tout: 153.6,
      pins: { 8: [0.6, 3.9, "spin"], 9: [9.4, 3.9, "spin"], 19: [5.0, 2.8, "back"] },
      groups: [
        { pick: BOYS, slots: line(8, 1.4, 5.3, 8.6, 5.3, "front") },
        { pick: NS, slots: line(7, 1.4, 3.8, 8.6, 3.8, "back").concat([[5.0, 4.6, "centerFront"]]) }
      ] },
    { id: "symFlower", name: "대칭 큰 꽃", tin: 155.6, tout: 161.0,
      pins: { 8: [0.7, 2.6, "backRow"], 9: [9.3, 2.6, "backRow"] },
      groups: [
        { pick: BOYS, slots: [[4.6, 3.7, "pillar"], [5.4, 3.7, "pillar"], [2.2, 4.2, "circleS"], [2.8, 4.9, "circleS"], [3.6, 5.3, "circleS"], [7.8, 4.2, "circleS"], [7.2, 4.9, "circleS"], [6.4, 5.3, "circleS"], [5.0, 1.6, "backRow"]] },
        { pick: NS, slots: [[3.7, 2.9, "arch"], [4.5, 2.5, "arch"], [5.5, 2.5, "arch"], [6.3, 2.9, "arch"], [1.6, 1.9, "backRow"], [2.6, 1.7, "backRow"], [7.4, 1.7, "backRow"], [8.4, 1.9, "backRow"]] }
      ] },
    { id: "altRows", name: "두 줄 · 남녀 번갈아", tin: 163.4, tout: 184.4,
      pins: { 8: [1.5, 3.2, "backG"], 9: [8.5, 3.2, "backG"] },
      groups: [
        { pick: BOYS, slots: line(13, 0.6, 4.7, 9.4, 4.7, "x").filter((s, i) => i % 2 === 0).map(s => [s[0], s[1], "frontB"]).concat([[4.3, 3.2, "backB"], [5.7, 3.2, "backB"]]) },
        { pick: NS, slots: line(13, 0.6, 4.7, 9.4, 4.7, "x").filter((s, i) => i % 2 === 1).map(s => [s[0], s[1], "frontG"]).concat([[2.9, 3.2, "backG"], [7.1, 3.2, "backG"]]) }
      ] },
    { id: "peacock", name: "세 송이 공작", tin: 187.6, tout: 192.4,
      pins: { 4: [5.0, 4.9, "soloStack"], 8: [1.9, 4.3, "tail"], 9: [8.1, 4.3, "tail"] },
      groups: [
        { pick: BOYS, slots: [[2.3, 5.0, "wingF"], [7.7, 5.0, "wingF"], [3.6, 4.5, "midB"], [6.4, 4.5, "midB"]] },
        { pick: "rest", slots: [[1.9, 4.3, "tail"], [2.2, 3.6, "tail"], [2.5, 2.9, "tail"], [2.8, 2.2, "tail"], [8.1, 4.3, "tail"], [7.8, 3.6, "tail"], [7.5, 2.9, "tail"], [7.2, 2.2, "tail"]].concat(line(6, 3.5, 1.6, 6.5, 1.6, "back")) }
      ] },
    { id: "duetWalls", name: "가운데 듀엣 · 좌우 부채 벽", tin: 197.4, tout: 208.2,
      pins: { 4: [4.8, 4.0, "duet"], 10: [5.3, 3.4, "duet"], 19: [5.0, 2.3, "duetBack"], 8: [0.7, 5.1, "wallF"], 9: [9.3, 5.1, "wallF"] },
      groups: [
        { pick: [1, 2, 3, 5, 6, 7, 8, 9], slots: [[0.7, 5.1, "wallF"], [1.4, 5.1, "wallF"], [2.1, 5.1, "wallF"], [7.9, 5.1, "wallF"], [8.6, 5.1, "wallF"], [9.3, 5.1, "wallF"], [2.1, 4.2, "wallM"], [7.9, 4.2, "wallM"]] },
        { pick: BOYS, slots: [[0.7, 4.2, "wallM"], [1.4, 4.2, "wallM"], [8.6, 4.2, "wallM"], [9.3, 4.2, "wallM"], [0.7, 3.3, "wallB"], [1.4, 3.3, "wallB"], [8.6, 3.3, "wallB"], [9.3, 3.3, "wallB"]] }
      ] },
    { id: "girlsFront", name: "앞줄 여자 · 뒷줄 남자", tin: 211.6, tout: 224.4,
      groups: [
        { pick: GIRLS, slots: line(10, 0.7, 4.7, 9.3, 4.7, "front") },
        { pick: BOYS, slots: line(9, 1.2, 3.3, 8.8, 3.3, "back") }
      ] },
    { id: "twoFlowers", name: "두 송이 회전 꽃", tin: 230.2, tout: 244.0,
      pins: { 8: [0.9, 4.9, "ring"], 9: [9.1, 4.9, "ring"] },
      groups: [
        { pick: NS, slots: [[2.65, 3.95, "core"], [3.35, 3.95, "core"], [2.65, 4.65, "core"], [3.35, 4.65, "core"], [6.65, 3.95, "core"], [7.35, 3.95, "core"], [6.65, 4.65, "core"], [7.35, 4.65, "core"]] },
        { pick: BOYS, slots: [[1.2, 3.3, "ringB"], [2.0, 2.6, "ringB"], [3.0, 2.3, "ringB"], [4.0, 2.6, "ringB"], [5.0, 3.1, "ringB"], [6.0, 2.6, "ringB"], [7.0, 2.3, "ringB"], [8.0, 2.6, "ringB"], [8.8, 3.3, "ringB"]] }
      ] },
    { id: "longLine", name: "한 줄 물결 · 파도", tin: 246.4, tout: 278.0,
      pins: { 8: [0.6, 4.3, "line"], 9: [9.4, 4.3, "line"] },
      groups: [
        { pick: NS, slots: [1.578, 2.556, 3.533, 4.511, 5.489, 6.467, 7.445, 8.422].map(x => [x, 4.3, "line"]) },
        { pick: BOYS, slots: [1.089, 2.067, 3.045, 4.022, 5.0, 5.978, 6.956, 7.934, 8.911].map(x => [x, 3.4, "backB"]) }
      ] },
    { id: "finale", name: "피날레 3층 꽃", tin: 281.4, tout: 303.6,
      pins: { 8: [1.2, 4.3, "spin"], 9: [8.8, 4.3, "spin"] },
      groups: [
        { pick: NS, slots: [[3.2, 4.95, "front"], [3.85, 5.2, "front"], [4.6, 5.35, "front"], [5.4, 5.35, "front"], [6.15, 5.2, "front"], [6.8, 4.95, "front"], [3.0, 4.05, "mid"], [7.0, 4.05, "mid"]] },
        { pick: BOYS, slots: [[3.8, 3.95, "mid"], [4.6, 3.9, "mid"], [5.4, 3.9, "mid"], [6.2, 3.95, "mid"], [3.4, 3.1, "back"], [4.2, 3.0, "back"], [5.0, 2.95, "back"], [5.8, 3.0, "back"], [6.6, 3.1, "back"]] }
      ] },
    { id: "bowLine", name: "인사 줄", tin: 309.0, tout: 322.0,
      groups: [
        { pick: GIRLS, slots: [0.6, 1.578, 2.556, 3.533, 4.511, 5.489, 6.467, 7.445, 8.422, 9.4].map(x => [x, 4.3, "line"]) },
        { pick: BOYS, slots: [1.089, 2.067, 3.045, 4.022, 5.0, 5.978, 6.956, 7.934, 8.911].map(x => [x, 3.4, "backB"]) }
      ] }
  ];

  // ---------- 구간 · 박 단위 동작 ----------
  // [시작초, 끝초, 신호(보고 듣는 것), { 역할: 동작 }] — 역할 = 자리 이름(tag) · "G"(여) · "B"(남) · "all" · "#번호"
  // 4초보다 긴 박은 화면에서 4초 이하로 자동 분할
  const S = [
    { title: "시작 자세", easy: "조명이 켜져도 움직이지 않아요. 남자는 웅크리고, 여자는 고개를 숙이고 기다려요.", beats: [
      [5, 13, "조명 켜짐 — 그대로 멈춤", { waitLine: "standWaitDown", solo: "kneelFloorSolo", offL: "off", offR: "off", crouch: "crouchWait", boyC: "crouchWait" }],
      [13, 21.26, "조용한 시간(0:13~0:20) — 숨소리도 멈춤", { waitLine: "standWaitDown", solo: "kneelFloorSolo", offL: "off", offR: "off", crouch: "crouchWait", boyC: "crouchWait" }] ] },
    { title: "부채 펴고 걸어 나오기", easy: "음악 첫 소리에 여자들이 부채를 '촥' 펴고, 가운데 친구(1번)를 향해 걸어 나와요.", beats: [
      [21.26, 23.2, "음악 첫 소리(0:21) = 부채 펴는 순간", { waitLine: "openWalk", solo: "riseUp", offL: "off", offR: "off", crouch: "crouchWait", boyC: "crouchWait" }],
      [23.2, 26.0, "가운데 쪽 친구부터 출발", { waitLine: "walkChestWave", solo: "up", offL: "off", offR: "off", crouch: "crouchWait", boyC: "crouchWait" }] ] },
    { title: "1번 둘러싸기 · 첫 아치", easy: "여자 6명이 1번 앞에 반달 모양으로 서서 부채 지붕(아치)을 만들어요.", beats: [
      [26.0, 28.0, "반달 모양 완성", { ring: "gatherUp", solo: "up", offL: "off", offR: "off", crouch: "crouchWait", boyC: "crouchWait" }],
      [28.0, 29.0, "아치 완성 — 1번은 안에 숨기", { ring: "archRoof", solo: "hideCrouch", offL: "off", offR: "off", crouch: "crouchWait", boyC: "crouchWait" }] ] },
    { title: "여자 앉기 · 남자 일어나기", easy: "여자는 반달 모양으로 앉고, 남자는 웅크렸다가 일어나 부채를 높이 흔들어요.", beats: [
      [29.0, 30.0, "여자 앉기 · 남자 일어나기 신호", { ring: "kneelDown", solo: "soloStandHigh", offL: "off", offR: "off", crouch: "riseBoys", boyC: "riseBoys" }],
      [30.0, 34.0, "남자 부채 흔들기", { ring: "kneelSweep", solo: "up", offL: "off", offR: "off", boysL: "upSway", boysR: "upSway", boyC: "upSway" }] ] },
    { title: "여자 아치 · 남자 부채 동그라미", easy: "여자는 일어나 다시 아치, 남자는 부채로 가슴 앞에 동그라미를 세워요.", beats: [
      [34.0, 38.0, "여자 일어나 아치", { ring: "archRoof", solo: "hideCrouch", offL: "off", offR: "off", boysL: "circleChest", boysR: "circleChest", boyC: "circleChest" }],
      [38.0, 40.0, "여자 다시 앉아 부채 밀기", { ring: "pushFront", solo: "up", offL: "off", offR: "off", boysL: "up", boysR: "up", boyC: "up" }] ] },
    { title: "8·9·10번 등장", easy: "무대 옆에서 8·9·10번이 걸어 나오고, 가운데 여자들은 두 줄로 자리를 잡아요.", beats: [
      [40.0, 44.5, "8·9·10번 등장", { solo: "walkTo", ring: "kneelSweep", offL: "enter", offR: "enter", boysL: "sideLow", boysR: "sideLow", boyC: "up" }] ] },
    { title: "좌우 회전 · 꽃송이", easy: "8번(왼쪽)과 9번(오른쪽)이 치마를 펴며 돌고, 가운데 여자들은 부채로 꽃을 만들어요.", beats: [
      [44.5, 48.5, "꽃송이 머리 위로", { spinL: "spin", spinR: "spin", front: "circleHigh", back: "circleHigh", boysL: "sideWave", boysR: "sideWave", boyC: "up" }],
      [48.5, 53.0, "꽃송이 얼굴 앞으로 — 얼굴 가리기", { spinL: "spin", spinR: "spin", front: "circleKneel", back: "circleKneel", boysL: "sideWave", boysR: "sideWave", boyC: "up" }],
      [53.0, 58.8, "두 층 꽃: 앞줄 앉은 꽃, 뒷줄 서서 나비", { spinL: "spin", spinR: "spin", front: "circleKneel", back: "butterfly", boysL: "sideWave", boysR: "sideWave", boyC: "up" }] ] },
    { title: "가운데 큰 꽃", easy: "여자들이 가운데 모여 큰 꽃을 만들어요. 2초마다 '지붕'과 '꽃 테두리'를 번갈아 해요.", beats: [
      [58.8, 61.2, "가운데로 모이기", { all: "walkHold" }],
      [61.2, 63.0, "지붕", { back: "archRoof", bud: "archRoof", front: "kneelLowSide", endL: "waveSide", pillarF: "pillarKneel", pillarB: "pillarStand", boyC: "up" }],
      [63.0, 65.0, "꽃 테두리", { back: "ringStand", bud: "ringStand", front: "ringKneel", endL: "waveSide", pillarF: "pillarKneel", pillarB: "pillarStand", boyC: "up" }],
      [65.0, 67.0, "지붕", { back: "archRoof", bud: "archRoof", front: "kneelLowSide", endL: "waveSide", pillarF: "pillarKneel", pillarB: "pillarStand", boyC: "up" }],
      [67.0, 69.0, "꽃 테두리", { back: "ringStand", bud: "ringStand", front: "ringKneel", endL: "waveSide", pillarF: "pillarKneel", pillarB: "pillarStand", boyC: "up" }],
      [69.0, 70.0, "지붕", { back: "archRoof", bud: "archRoof", front: "kneelLowSide", endL: "waveSide", pillarF: "pillarKneel", pillarB: "pillarStand", boyC: "up" }],
      [70.0, 71.8, "꽃봉오리 — 가운데 한 명만 서기", { back: "kneelLow", bud: "bud", front: "kneelLow", endL: "waveSide", pillarF: "pillarKneel", pillarB: "pillarStand", boyC: "up" }] ] },
    { title: "두 줄 · 끝 날개 · 끝 회전", easy: "뒷줄은 아치, 앞줄은 꽃송이, 양 끝(8번·9번)은 날개를 펴다가 돌아요.", beats: [
      [71.8, 73.6, "두 줄로 이동", { all: "walkHold" }],
      [73.6, 76.0, "뒷줄 가슴 수평 · 앞줄 꽃송이", { back: "chestSide", front: "circleKneel", wing: "wingSide", kneelB: "circleKneel", boyC: "up" }],
      [76.0, 80.0, "뒷줄 아치 · 양 끝 날개", { back: "archRoof", front: "circleKneel", wing: "wingSide", kneelB: "circleKneel", boyC: "up" }],
      [80.0, 83.2, "양 끝 회전 · 아치 물결", { back: "archSway", front: "circleKneel", wing: "spin", kneelB: "circleKneel", boyC: "archSway" }] ] },
    { title: "네 줄 기차", easy: "네 줄로 앞뒤 기차처럼 서서, 허리 높이 물결과 제자리 한 바퀴를 번갈아 해요.", beats: [
      [83.2, 86.0, "기차 줄로 이동", { all: "walkHold" }],
      [86.0, 91.0, "허리 높이 물결", { all: "trainChest" }],
      [91.0, 94.0, "제자리 한 바퀴 · 부채 세로", { all: "turnVertical" }],
      [94.0, 96.0, "허리 높이 물결", { all: "trainChest" }],
      [96.0, 98.0, "제자리 한 바퀴", { all: "turnVertical" }],
      [98.0, 99.0, "허리 높이 물결", { all: "trainChest" }],
      [99.0, 101.0, "제자리 한 바퀴", { all: "turnVertical" }],
      [101.0, 103.0, "허리 높이 물결", { all: "trainChest" }] ] },
    { title: "한 줄 · 짝 보기 · 옆걸음 띠", easy: "지그재그 한 줄이 되어 짝을 보고, 부채를 이어 띠를 만든 채 오른쪽으로 옆걸음해요.", beats: [
      [103.0, 104.6, "한 줄로 퍼지기", { all: "walkHold" }],
      [104.6, 107.0, "짝과 마주 보기", { all: "facePartner" }],
      [107.0, 113.0, "옆걸음 시작(객석에서 볼 때 오른쪽으로)", { all: "sideStepBand" }],
      [113.0, 117.0, "짝과 부채 교차하며 옆걸음", { all: "sideStepBand" }],
      [117.0, 121.0, "가는 방향 보고 제자리 걸음", { all: "march" }] ] },
    { title: "네 그룹 꽃", easy: "네 모둠으로 모여 지붕을 만든 뒤, 모둠마다 둥근 꽃을 피워요.", beats: [
      [121.0, 123.6, "네 모둠으로 모이기", { all: "walkHold" }],
      [123.6, 127.0, "모둠별 지붕", { all: "archRoof" }],
      [127.0, 139.0, "모둠별 꽃 — 가운데는 위, 둘레는 테두리", { core: "flowerCore", petal: "ringSway" }] ] },
    { title: "꽃 풀기 · 남자 앞줄로", easy: "꽃을 풀고 여자는 뒤로 한 걸음, 남자는 앞줄로 나와요. 가슴 높이 물결을 치며 움직여요.", beats: [
      [139.0, 141.5, "꽃 풀기 — 여자 뒤로, 남자 앞으로", { all: "walkChestWave" }],
      [141.5, 144.0, "두 줄 완성하며 물결", { all: "walkChestWave" }] ] },
    { title: "층층 부채 원", easy: "앞줄은 앉아서, 뒷줄은 서서 부채 동그라미를 층층이 쌓아요. 양 끝은 돌아요.", beats: [
      [144.0, 146.0, "남자 앞줄 앉기", { front: "kneelLow", centerFront: "chestWave", back: "chestWave", spin: "standReady" }],
      [146.0, 148.0, "부채 원 들어 올리기", { front: "circleKneel", centerFront: "wingSide", back: "circleHigh", spin: "spin" }],
      [148.0, 153.6, "층층 꽃 · 양 끝 회전", { front: "circleKneel", centerFront: "wingSide", back: "circleHigh", spin: "spin" }] ] },
    { title: "대칭 큰 꽃", easy: "가운데 남자 둘이 기둥, 그 뒤 여자는 아치, 앞 양옆은 앉아서 꽃송이를 만들어요.", beats: [
      [153.6, 155.6, "가운데로 모이기", { all: "walkHold" }],
      [155.6, 158.0, "기둥 · 아치 · 앞 꽃", { pillar: "upVertical", arch: "archRoof", circleS: "circleKneel", backRow: "up" }],
      [158.0, 161.0, "기둥 흔들기 · 앞 꽃 기울이기", { pillar: "upSway", arch: "archRoof", circleS: "circleTilt", backRow: "upSway" }] ] },
    { title: "남녀 번갈아 두 줄", easy: "앞줄은 남·여 번갈아 서서 옆걸음, 뒤에서 부채를 올리고, 앉았다 섰다를 반복해요.", beats: [
      [161.0, 163.4, "두 줄로 이동", { all: "walkHold" }],
      [163.4, 168.0, "앞줄 옆걸음 · 뒷줄 지붕", { frontB: "sideStepChest", frontG: "sideStepChest", backB: "archRoof", backG: "archRoof" }],
      [168.0, 170.0, "앞줄 남자부터 차례로 부채 올리기", { frontB: "roofOneByOne", frontG: "roofOneByOne", backB: "archRoof", backG: "archRoof" }],
      [170.0, 174.0, "앞줄 앉아 꽃송이", { frontB: "circleKneel", frontG: "circleKneel", backB: "archRoof", backG: "archRoof" }],
      [174.0, 176.0, "앉은 채 차례로 부채 올리기(파도)", { frontB: "riseWaveUp", frontG: "riseWaveUp", backB: "archRoof", backG: "archRoof" }],
      [176.0, 178.0, "전원 서서 지붕", { all: "archRoof" }],
      [178.0, 182.0, "앞줄 다시 앉아 꽃송이", { frontB: "circleKneel", frontG: "circleKneel", backB: "archRoof", backG: "archRoof" }],
      [182.0, 184.4, "뒤부터 부채 올리며 전원 서기", { all: "archRoof" }] ] },
    { title: "세 송이 공작", easy: "4번이 가운데 앉아 부채를 층층이 쌓고, 양옆은 공작 꼬리처럼 부채를 세워요.", beats: [
      [184.4, 187.6, "공작 자리로", { all: "walkHold" }],
      [187.6, 190.0, "층층 부채 · 날개 멈춤", { soloStack: "stackSolo", wingF: "wingDown", midB: "downOpen", tail: "tail", back: "up" }],
      [190.0, 192.4, "층층 부채 위아래", { soloStack: "stackSolo", wingF: "wingDown", midB: "downOpen", tail: "tail", back: "upSway" }] ] },
    { title: "가운데 듀엣 · 좌우 부채 벽", easy: "4번·10번이 가운데에서 짝 춤을 추고 19번이 뒤에서 부채를 들어요. 나머지는 양쪽에서 부채 동그라미 벽을 만들어요.", beats: [
      [192.4, 197.4, "가슴 수평으로 흔들며 이동", { all: "walkChestWave" }],
      [197.4, 200.0, "듀엣 — 몸 옆 큰 원", { duet: "duetCircle", duetBack: "up", wallF: "circleKneel", wallM: "circle", wallB: "circleHigh" }],
      [200.0, 204.0, "듀엣 — 돌고 멈추기", { duet: "duetLowSpin", duetBack: "upSway", wallF: "circleTilt", wallM: "circle", wallB: "circleHigh" }],
      [204.0, 208.2, "듀엣 반복", { duet: "duetCircle", duetBack: "upSway", wallF: "circleTilt", wallM: "circle", wallB: "circleHigh" }] ] },
    { title: "앞줄 여자 꽃 10송이", easy: "여자 10명이 앞줄에 앉아 꽃 10송이, 남자 9명은 뒤에서 나비 날개를 만들어요.", beats: [
      [208.2, 211.6, "두 줄로 이동", { all: "walkChestWave" }],
      [211.6, 213.0, "두 줄 물결", { front: "chestWave", back: "chestWave" }],
      [213.0, 215.0, "앞줄 무릎 앉기", { front: "kneelLow", back: "chestWave" }],
      [215.0, 217.0, "부채 바닥에 펼치기", { front: "floorFan", back: "chestWave" }],
      [217.0, 224.4, "꽃 10송이 멈춤", { front: "circleKneel", back: "butterfly" }] ] },
    { title: "두 송이 회전 꽃", easy: "여자 4명씩 두 모둠이 등을 맞대고 꽃 테두리를 만들어 천천히 돌아요. 남자는 뒤에서 부채 동그라미 배경을 만들어요.", beats: [
      [224.4, 226.0, "가운데부터 꽃 풀기", { front: "riseLow", back: "archRoof" }],
      [226.0, 230.2, "지붕 띠 들고 두 무리로", { all: "roofWalk" }],
      [230.2, 233.0, "가운데 서기 · 둘레 꽃송이", { core: "bud", ring: "circleKneel", ringB: "circle" }],
      [233.0, 244.0, "등 맞대고 꽃 테두리 · 천천히 돌기", { core: "ringTurn", ring: "circleTilt", ringB: "circle" }] ] },
    { title: "한 줄 물결과 파도", easy: "무대 가득 한 줄로 서서 부채 띠를 만들고, 왼쪽부터 파도를 보내요.", beats: [
      [244.0, 246.4, "한 줄로 이동", { all: "walkChestWave" }],
      [246.4, 255.0, "가슴 높이 물결 띠", { all: "chestWave" }],
      [255.0, 259.0, "숙여서 바닥 띠", { all: "lowBand" }],
      [259.0, 262.0, "왼쪽부터 부채 올리기 — 머리 위 띠", { all: "roofRise" }],
      [262.0, 278.0, "파도 — 왼쪽에서 오른쪽으로(약 4번)", { all: "waveRoll" }] ] },
    { title: "피날레 3층 꽃", easy: "가운데에 3층 큰 꽃을 만들고, 양 끝 8번·9번은 돌다가 앉아서 꽃송이로 마무리해요.", beats: [
      [278.0, 281.4, "가운데로 모이기", { all: "walkChestWave" }],
      [281.4, 285.0, "가운데 물결 · 양 끝 따로 서기", { front: "chestWave", mid: "chestWave", back: "chestWave", spin: "chestWave" }],
      [285.0, 290.0, "지붕 · 양 끝 회전", { front: "archRoof", mid: "archRoof", back: "archRoof", spin: "spin" }],
      [290.0, 293.0, "3층 꽃 완성", { front: "ringKneel", mid: "ringStand", back: "flowerCore", spin: "spin" }],
      [293.0, 301.0, "피날레 멈춤 · 양 끝 앉아 꽃송이", { front: "ringKneel", mid: "ringSway", back: "flowerCore", spin: "circleKneel" }],
      [301.0, 303.6, "음악이 작아짐 — 접을 준비", { front: "ringKneel", mid: "ringStand", back: "flowerCore", spin: "circleKneel" }] ] },
    { title: "부채 접기 · 인사", easy: "마지막 소리에 부채를 '촥' 접고 한 줄로 선 뒤, 왼쪽 친구부터 차례로 큰절해요.", beats: [
      [303.6, 305.0, "마지막 소리 = 부채 접는 순간", { all: "closeFan" }],
      [305.0, 309.0, "한 줄로 걸어가기", { all: "walkClosed" }],
      [309.0, 313.0, "한 줄 정렬 · 정면", { all: "standClosed" }],
      [313.0, 317.0, "음악 끊김(5:13) — 왼쪽부터 차례로 큰절", { all: "bowWave" }],
      [317.0, 320.0, "절 유지", { all: "bow" }],
      [320.0, 322.0, "천천히 일어나기", { all: "standClosed" }] ] }
  ];

  // 핵심 대형 그림으로 따로 보여 줄 순간
  const KEY = [
    [18, "시작 자세"], [28.5, "첫 아치"], [36, "여자 아치 · 남자 동그라미"], [56, "좌우 회전 · 두 층 꽃"], [64, "가운데 큰 꽃"],
    [78, "두 줄 · 끝 날개"], [88, "네 줄 기차"], [110, "옆걸음 띠"], [132, "네 그룹 꽃"], [150, "층층 부채 원"],
    [158, "대칭 큰 꽃"], [172, "남녀 번갈아 · 앞줄 꽃송이"], [190, "세 송이 공작"], [198, "가운데 듀엣"], [220, "꽃 10송이"],
    [238, "두 송이 회전 꽃"], [257, "숙여서 바닥 띠"], [260.5, "머리 위 띠"], [296, "피날레 3층 꽃"], [318, "큰절"]
  ];

  const MOMENTS = [
    { t: 21.26, title: "부채 펴는 순간", fs: "chest", text: "음악 첫 소리(0:21)에 맞춰 엄지로 부채 살을 밀어 '촥' 한 번에 펴요. 펴자마자 두 부채를 나란히 가슴 높이에 수평으로 들어요. 남자와 1번은 부채를 바닥에 펴 둔 채 시작해요." },
    { t: 50, title: "얼굴 가리는 높이", fs: "circle", text: "두 부채의 손잡이를 맞대 동그라미를 만들어요. 동그라미 가운데가 코 높이, 위쪽 끝이 이마보다 조금 위에 오게 해서 눈까지 가려요. 팔꿈치는 옆구리에 붙여요." },
    { t: 32, title: "머리 위 45° (V자)", fs: "up", text: "두 팔을 머리 위로 V자로 뻗어요. 팔과 머리 사이가 시계의 10시·2시 방향(약 45°)이에요. 부채 면은 객석을 보게 세워요." },
    { t: 28.5, title: "머리 위 수평 (지붕)", fs: "roof", text: "두 팔을 귀 옆까지 쭉 뻗고 부채를 하늘과 나란히 눕혀요. 옆 친구 부채 끝과 살짝 닿게 해서 이어진 지붕을 만들어요." },
    { t: 64, title: "꽃 테두리 (링)", fs: "ring", text: "두 팔을 옆·아래로 둥글게 벌려 부채를 옆으로 펼쳐요. 옆 친구 부채 끝과 이어서 큰 꽃의 테두리를 만들어요." },
    { t: 56, title: "나비 날개", fs: "butterfly", text: "팔꿈치를 굽혀 두 손을 얼굴 양옆에 두고, 부채를 세로로 세워요. 얼굴은 부채 사이로 보여야 해요." },
    { t: 50, title: "회전", fs: "spin", text: "오른손 부채는 머리 위 45°, 왼손 부채는 허리 옆에 비스듬히 들어요. 작은 걸음으로 오른쪽으로 돌며 8박에 한 바퀴 돌아요." },
    { t: 190, title: "층층 부채", fs: "stack", text: "두 부채를 세로로 겹쳐 얼굴 앞에서 시작해 머리 위까지 한 칸씩 쌓아 올려요(8박)." },
    { t: 303.6, title: "부채 접는 순간", fs: "closed", text: "마지막 소리(5:03)가 끝나는 순간 손목을 안으로 돌리며 '촥' 접어요. 접은 부채는 두 손에 하나씩 허리 옆으로 늘어뜨려요." }
  ];

  const DATA = { MUSIC, P, F, S, KEY, MOMENTS, GIRLS, BOYS, video: { id: "wA_sY-Wriqw", file: "부채춤_아름다운 나라.mp4", duration: 348.65, fps: 30 } };
  if (typeof module !== "undefined" && module.exports) module.exports = DATA; else root.CHOREO = DATA;
})(typeof window !== "undefined" ? window : globalThis);
