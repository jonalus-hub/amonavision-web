// Demo "photos" and "video" drawn with the characters of the AmonaVision illustrations:
// the child with the orange curl (frame illustration), the brown-haired mother in orange and
// the blond adult in grey (family illustration). Flat shapes, same colours.
const C = {
  skin: '#F5C9A0', skin2: '#E8B48A', orange: '#F7941D', cream: '#FAF7F2', dark: '#141414',
  grey: '#d9d9d9', brown: '#5a3a22', blond: '#c9a227', cheek: '#F7A05A', pants: '#33415e',
};
const rad = d => d * Math.PI / 180;

function eyes(lx, rx, y, r, blink) {
  if (blink) return `<path d="M${lx - r - 1} ${y} h${2 * r + 2} M${rx - r - 1} ${y} h${2 * r + 2}" stroke="${C.dark}" stroke-width="${r * 0.75}" stroke-linecap="round"/>`;
  return `<circle cx="${lx}" cy="${y}" r="${r}" fill="${C.dark}"/><circle cx="${rx}" cy="${y}" r="${r}" fill="${C.dark}"/>`;
}

// The child, in the frame illustration's own coordinates (torso bottom centre at 274,290).
function kid({ x, y, s = 1, arms = 'up', wave = 0, blink = false, mouth = 'smile', shirt = C.orange, lap = false, hold = '' }) {
  const arm = (sx, sy, ex, ey) => `<path d="M${sx} ${sy} L${ex} ${ey}" stroke="${shirt}" stroke-width="16" stroke-linecap="round"/><circle cx="${ex}" cy="${ey}" r="11" fill="${C.skin}"/>`;
  const L = [235, 225], R = [313, 225];
  let a = '';
  if (arms === 'up') a = arm(...L, 200 - wave, 188) + arm(...R, 348 + wave, 188);
  else if (arms === 'down') a = arm(...L, 214, 282) + arm(...R, 334, 282);
  else if (arms === 'wave') {
    const g = rad(-62 + wave);
    a = arm(...L, 214, 282) + arm(...R, R[0] + 58 * Math.cos(g), R[1] + 58 * Math.sin(g));
  } else if (arms === 'hold') a = arm(...L, 214, 282) + arm(...R, 318, 178);   // right hand up by the mouth
  const m = {
    smile: `<path d="M262 172 Q274 184 286 172" fill="none" stroke="${C.dark}" stroke-width="3" stroke-linecap="round"/>`,
    open: `<path d="M261 170 Q274 192 287 170 Z" fill="${C.dark}"/><path d="M267 181 Q274 186 281 181" fill="none" stroke="#e8737a" stroke-width="3" stroke-linecap="round"/>`,
    oh: `<ellipse cx="276" cy="176" rx="7" ry="8.5" fill="${C.dark}"/>`,
  }[mouth];
  const lapEl = lap ? `<ellipse cx="274" cy="292" rx="58" ry="15" fill="${C.pants}"/>` : '';
  return `<g transform="translate(${x} ${y}) scale(${s}) translate(-274 -290)">
    ${lapEl}
    <path d="M222 290 Q222 205 274 205 Q326 205 326 290Z" fill="${shirt}"/>
    ${a}
    <circle cx="274" cy="150" r="45" fill="${C.skin}"/>
    <path d="M268 106 Q262 90 276 88 Q292 88 286 102" fill="none" stroke="${C.orange}" stroke-width="4" stroke-linecap="round"/>
    ${eyes(259, 289, 155, 4.5, blink)}
    <circle cx="250" cy="170" r="7" fill="${C.cheek}" opacity="0.9"/><circle cx="298" cy="170" r="7" fill="${C.cheek}" opacity="0.9"/>
    ${m}
    ${hold}
  </g>`;
}

// The adults, from the family illustration, normalised so the torso bottom centre is at 0,0.
function adult({ x, y, s = 2.2, hair = 'brown', armL = 'down', armR = 'down', waveL = 0, waveR = 0, blink = false, mouth = 'smile', lap = false, book = false }) {
  const top = hair === 'brown' ? C.orange : C.grey;
  const skin = hair === 'brown' ? C.skin : C.skin2;
  const hairEl = hair === 'brown'
    ? `<path d="M-26 -80 Q-23 -105 0 -105 Q23 -105 26 -80 Q15 -94 0 -94 Q-15 -94 -26 -80Z" fill="${C.brown}"/>`
    : `<path d="M-26 -76 Q-25 -107 0 -107 Q25 -107 26 -76 L26 -58 Q21 -90 0 -92 Q-21 -90 -26 -58Z" fill="${C.blond}"/>`;
  const arm = (sx, sy, ex, ey) => `<path d="M${sx} ${sy} L${ex} ${ey}" stroke="${top}" stroke-width="9" stroke-linecap="round"/><circle cx="${ex}" cy="${ey}" r="5.5" fill="${skin}"/>`;
  const SL = [-23, -33], SR = [23, -33];
  const pose = (side, kind, w) => {
    const S = side === 'L' ? SL : SR, sign = side === 'L' ? -1 : 1;
    if (kind === 'down') return arm(...S, S[0] + sign * 8, -3);
    if (kind === 'wave') { const g = rad(side === 'L' ? -118 + w : -62 + w); return arm(...S, S[0] + 34 * Math.cos(g), S[1] + 34 * Math.sin(g)); }
    if (kind === 'book') return arm(...S, sign * 13, -22);
    if (kind === 'hug') return arm(...S, S[0] + sign * 30, -18);
    return '';
  };
  const m = {
    smile: `<path d="M-7 -63 Q0 -57 7 -63" fill="none" stroke="${C.dark}" stroke-width="2.5" stroke-linecap="round"/>`,
    open: `<path d="M-7.5 -64 Q0 -53 7.5 -64 Z" fill="${C.dark}"/>`,
  }[mouth];
  const lapEl = lap ? `<ellipse cx="0" cy="1" rx="35" ry="8" fill="${C.pants}"/>` : '';
  const bookEl = book ? `<g transform="translate(0 -27)"><path d="M-25 -9 L0 -6 L25 -9 L25 9 L0 12 L-25 9Z" fill="${C.orange}"/><path d="M-23 -10 L-1 -7 L-1 9 L-23 7Z" fill="${C.cream}"/><path d="M23 -10 L1 -7 L1 9 L23 7Z" fill="${C.cream}"/><path d="M-19 -4 L-5 -2 M-19 0 L-5 2 M-19 4 L-8 5.5 M5 -2 L19 -4 M5 2 L19 0 M8 5.5 L19 4" stroke="#c9c4bc" stroke-width="1.3"/></g>` : '';
  return `<g transform="translate(${x} ${y}) scale(${s})">
    ${lapEl}
    <path d="M-32 0 Q-32 -42 0 -42 Q32 -42 32 0Z" fill="${top}"/>
    ${pose('L', armL, waveL)}${pose('R', armR, waveR)}
    ${bookEl}
    <circle cx="0" cy="-75" r="26" fill="${skin}"/>
    ${hairEl}
    ${eyes(-9, 9, -74, 3, blink)}
    <circle cx="-15" cy="-65" r="3.5" fill="${C.cheek}" opacity="0.6"/><circle cx="15" cy="-65" r="3.5" fill="${C.cheek}" opacity="0.6"/>
    ${m}
  </g>`;
}

function dog({ x, y, s = 1, blink = false }) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M40 -30 Q78 -46 70 -78" fill="none" stroke="#c98b52" stroke-width="12" stroke-linecap="round"/>
    <path d="M-52 0 Q-58 -70 0 -76 Q58 -70 52 0Z" fill="#c98b52"/>
    <ellipse cx="0" cy="-8" rx="40" ry="10" fill="#b37845"/>
    <ellipse cx="-33" cy="-128" rx="15" ry="27" fill="#7a4a2a" transform="rotate(18 -33 -128)"/>
    <ellipse cx="33" cy="-128" rx="15" ry="27" fill="#7a4a2a" transform="rotate(-18 33 -128)"/>
    <circle cx="0" cy="-112" r="38" fill="#c98b52"/>
    <ellipse cx="0" cy="-93" rx="21" ry="15" fill="#ecc89c"/>
    ${eyes(-14, 14, -118, 4.5, blink)}
    <ellipse cx="0" cy="-101" rx="7" ry="5" fill="${C.dark}"/>
    <path d="M-11 -91 Q0 -82 11 -91" fill="none" stroke="${C.dark}" stroke-width="3" stroke-linecap="round"/>
    <path d="M-5 -88 Q0 -72 5 -88Z" fill="#e8737a"/>
  </g>`;
}

const cloud = (x, y, k = 1) => `<g transform="translate(${x} ${y}) scale(${k})" fill="${C.cream}"><circle cx="-30" cy="6" r="22"/><circle cx="0" cy="-6" r="30"/><circle cx="32" cy="6" r="22"/><rect x="-52" y="6" width="106" height="22" rx="11"/></g>`;
const daisy = (x, y, k = 1) => {
  let p = '';
  for (let i = 0; i < 8; i++) p += `<ellipse cx="0" cy="-11" rx="5" ry="10" fill="#fff" transform="rotate(${i * 45})"/>`;
  return `<g transform="translate(${x} ${y}) scale(${k})">${p}<circle r="7" fill="#f2b632"/></g>`;
};
const wave = (y, color, w = 6, amp = 10, len = 120, off = 0) => {
  let d = `M${-len + off} ${y}`;
  for (let x = -len + off; x < 1100; x += len) d += ` q${len / 4} ${-amp} ${len / 2} 0 t${len / 2} 0`;
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>`;
};

const SCENES = {
  // 1. At the beach – "The water is freezing, but the kids won't get out."
  beach() {
    let drops = '';
    [[410, 318, 7], [398, 352, 5], [552, 312, 6], [568, 346, 5], [430, 290, 4], [530, 288, 4], [380, 380, 4], [585, 380, 4]]
      .forEach(([cx, cy, r]) => { drops += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffffff" opacity="0.9"/>`; });
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 640">
      <rect width="960" height="640" fill="#a8dcec"/>
      <circle cx="810" cy="105" r="54" fill="#FFD27A"/>
      ${cloud(190, 92)}${cloud(560, 66, 0.7)}
      <rect y="292" width="960" height="220" fill="#3d93b8"/>
      <rect y="292" width="960" height="10" fill="#357fa0"/>
      ${wave(330, '#6fb4d2', 4, 6, 90, 20)}${wave(368, '#6fb4d2', 4, 6, 110, 60)}
      ${adult({ x: 290, y: 476, s: 2.35, hair: 'brown', armR: 'wave', waveR: -10, mouth: 'open' })}
      ${kid({ x: 480, y: 476, s: 1.05, arms: 'up', mouth: 'open' })}
      ${adult({ x: 668, y: 476, s: 2.3, hair: 'blond', armL: 'down', armR: 'down' })}
      ${drops}
      <path d="M0 432 q30 -12 60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 L960 520 L0 520Z" fill="#4a9fc4"/>
      ${wave(432, C.cream, 6, 12, 120, 0)}
      <path d="M0 512 Q240 478 480 500 T960 492 L960 640 L0 640Z" fill="#ecd08f"/>
      <path d="M0 512 Q240 478 480 500 T960 492" fill="none" stroke="${C.cream}" stroke-width="8" stroke-linecap="round"/>
      <g transform="translate(828 560)"><path d="M-34 -30 L34 -30 L26 40 L-26 40Z" fill="${C.orange}"/><rect x="-38" y="-38" width="76" height="12" rx="6" fill="#e2810f"/><path d="M-30 -34 Q0 -84 30 -34" fill="none" stroke="#e2810f" stroke-width="6"/></g>
      <g fill="#f4e4c8"><circle cx="150" cy="590" r="9"/><circle cx="176" cy="604" r="6"/><circle cx="640" cy="606" r="7"/></g>
    </svg>`;
  },

  // 2. Picnic in the park – "even the dog is smiling"
  picnic() {
    let stripes = '';
    for (let i = 1; i < 6; i++) {
      const t = i / 6;
      stripes += `<path d="M${280 + 420 * t} 430 L${170 + 650 * t} 640" stroke="#e8a24a" stroke-width="16" opacity="0.6"/>`;
    }
    [470, 520, 580].forEach((yy, i) => {
      const k = (yy - 430) / 210, xl = 280 - 110 * k, xr = 700 + 120 * k;
      stripes += `<path d="M${xl} ${yy} L${xr} ${yy}" stroke="#e8a24a" stroke-width="${12 + i * 3}" opacity="0.6"/>`;
    });
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 640">
      <defs><clipPath id="blanket"><path d="M170 640 L280 430 L700 430 L820 640Z"/></clipPath></defs>
      <rect width="960" height="640" fill="#cde9f2"/>
      ${cloud(700, 80, 0.8)}${cloud(420, 120, 0.55)}
      <path d="M0 250 Q220 190 450 240 T960 220 L960 340 L0 340Z" fill="#a7d08a"/>
      <rect y="300" width="960" height="340" fill="#86c464"/>
      <rect x="92" y="150" width="34" height="210" rx="8" fill="#7a5233"/>
      <g fill="#5fa35a"><circle cx="109" cy="140" r="82"/><circle cx="52" cy="196" r="56"/><circle cx="168" cy="196" r="60"/></g>
      <path d="M170 640 L280 430 L700 430 L820 640Z" fill="#f3e6d0"/>
      <g clip-path="url(#blanket)">${stripes}</g>
      ${adult({ x: 300, y: 528, s: 2.2, hair: 'blond', armL: 'down', armR: 'down', lap: true })}
      ${kid({ x: 482, y: 536, s: 0.95, arms: 'up', mouth: 'open', lap: true })}
      ${adult({ x: 664, y: 528, s: 2.25, hair: 'brown', armL: 'down', armR: 'wave', waveR: 8, mouth: 'open', lap: true })}
      <g transform="translate(232 588)"><path d="M-46 -22 L46 -22 L38 34 L-38 34Z" fill="#b07a45"/><path d="M-40 -6 L40 -6 M-38 10 L38 10" stroke="#8d5e30" stroke-width="4"/><path d="M-34 -22 Q0 -70 34 -22" fill="none" stroke="#8d5e30" stroke-width="7"/><circle cx="-16" cy="-28" r="13" fill="#e5533d"/><circle cx="10" cy="-30" r="13" fill="${C.orange}"/><path d="M10 -43 q6 -8 12 -6" stroke="#4f8f3f" stroke-width="4" fill="none" stroke-linecap="round"/></g>
      ${dog({ x: 846, y: 612, s: 0.95 })}
      <g transform="translate(470 600)"><ellipse rx="44" ry="12" fill="#ffffff"/><ellipse rx="30" ry="7" fill="#e9dcc8"/></g>
    </svg>`;
  },

  // 3. Bedtime story – "We're reading the book you gave her."
  bedtime() {
    let stars = '';
    [[690, 110, 3], [760, 150, 2.5], [820, 100, 2], [720, 200, 2], [800, 210, 3]].forEach(([cx, cy, r]) => { stars += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.cream}"/>`; });
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 640">
      <defs><clipPath id="win"><rect x="650" y="70" width="210" height="170" rx="10"/></clipPath></defs>
      <rect width="960" height="640" fill="#27364f"/>
      <rect x="0" y="560" width="960" height="80" fill="#1f2b40"/>
      <rect x="640" y="60" width="230" height="190" rx="16" fill="#3a4b68"/>
      <g clip-path="url(#win)"><rect x="650" y="70" width="210" height="170" fill="#172234"/>${stars}<circle cx="790" cy="140" r="34" fill="${C.cream}"/><circle cx="806" cy="128" r="30" fill="#172234"/></g>
      <rect x="752" y="70" width="6" height="170" fill="#3a4b68"/>
      <circle cx="135" cy="330" r="150" fill="#FFD27A" opacity="0.16"/>
      <circle cx="135" cy="330" r="90" fill="#FFD27A" opacity="0.18"/>
      <rect x="55" y="420" width="160" height="150" rx="12" fill="#8a5a3a"/>
      <rect x="70" y="470" width="130" height="8" rx="4" fill="#6f4529"/>
      <rect x="128" y="330" width="14" height="92" fill="#d9d9d9"/>
      <path d="M84 340 L186 340 L164 262 L106 262Z" fill="${C.orange}"/>
      <rect x="380" y="250" width="520" height="250" rx="30" fill="#8a5a3a"/>
      <ellipse cx="640" cy="420" rx="150" ry="48" fill="${C.cream}"/>
      ${kid({ x: 640, y: 520, s: 1.0, arms: 'down', mouth: 'smile' })}
      <path d="M360 478 Q640 440 920 478 L920 640 L360 640Z" fill="#f0e4d0"/>
      <path d="M360 520 Q640 484 920 520 M360 560 Q640 526 920 560" fill="none" stroke="${C.orange}" stroke-width="12" opacity="0.8"/>
      <g id="teddy" transform="translate(528 466)"><circle cx="0" cy="0" r="24" fill="#b07a45"/><circle cx="-18" cy="-20" r="10" fill="#b07a45"/><circle cx="18" cy="-20" r="10" fill="#b07a45"/><circle cx="-7" cy="-3" r="3" fill="${C.dark}"/><circle cx="7" cy="-3" r="3" fill="${C.dark}"/><ellipse cx="0" cy="7" rx="7" ry="5" fill="#ecc89c"/></g>
      ${adult({ x: 300, y: 600, s: 2.6, hair: 'brown', armL: 'book', armR: 'book', book: true, lap: true })}
    </svg>`;
  },

  // 4. A daisy in the garden – the photo the visitor sends in step 1
  flower() {
    let fence = '', flowers = '';
    for (let x = 10; x < 960; x += 58) fence += `<path d="M${x} 440 L${x} 250 L${x + 20} 228 L${x + 40} 250 L${x + 40} 440Z" fill="#efe3cf"/>`;
    [[70, 470, 1], [160, 500, 0.8], [800, 480, 1.1], [880, 520, 0.9], [740, 540, 0.8], [220, 560, 1]].forEach(([fx, fy, k], i) => {
      flowers += `<path d="M${fx} ${fy} L${fx} ${fy + 120}" stroke="#4f8f3f" stroke-width="5"/>`;
      flowers += i % 2 ? daisy(fx, fy, k * 1.4) : `<circle cx="${fx}" cy="${fy}" r="${16 * k}" fill="${C.orange}"/><circle cx="${fx}" cy="${fy}" r="${6 * k}" fill="#e2810f"/>`;
    });
    const hold = `<path d="M320 186 L328 150" stroke="#4f8f3f" stroke-width="3.5" stroke-linecap="round"/>${daisy(329, 146, 0.95)}`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 640">
      <rect width="960" height="640" fill="#bfe6f0"/>
      <circle cx="140" cy="90" r="48" fill="#FFD27A"/>
      ${cloud(760, 90, 0.75)}
      <rect x="0" y="300" width="960" height="18" fill="#e3d4bb"/><rect x="0" y="390" width="960" height="18" fill="#e3d4bb"/>
      ${fence}
      <g fill="#6fb35f"><circle cx="40" cy="430" r="70"/><circle cx="930" cy="420" r="80"/><circle cx="860" cy="450" r="50"/></g>
      <rect y="430" width="960" height="210" fill="#88c766"/>
      ${flowers}
      ${kid({ x: 480, y: 660, s: 1.95, arms: 'hold', mouth: 'oh', hold })}
    </svg>`;
  },

  // 5. The video: the family on the sofa, waving hello to Grandma (t in seconds)
  hello(t = 0) {
    const sway = Math.sin(t * Math.PI * 2 * 1.4);
    const sway2 = Math.sin(t * Math.PI * 2 * 1.4 + 1.3);
    const bob = Math.abs(Math.sin(t * Math.PI * 2 * 0.9)) * 10;
    const blinkAt = (times) => times.some(b => t >= b && t < b + 0.14);
    const talk = Math.sin(t * Math.PI * 2 * 2.2) > 0.2 ? 'open' : 'smile';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 540">
      <rect width="960" height="540" fill="#eadcc8"/>
      <rect y="470" width="960" height="70" fill="#b98a5c"/>
      <g transform="translate(110 64)"><rect width="150" height="112" rx="16" fill="${C.orange}"/><rect x="18" y="14" width="114" height="66" rx="5" fill="#242424"/><circle cx="75" cy="47" r="20" fill="#2d2d2d"/><circle cx="75" cy="42" r="10" fill="${C.skin}"/><path d="M63 66 Q63 54 75 54 Q87 54 87 66Z" fill="${C.orange}"/><g fill="#141414"><circle cx="45" cy="96" r="7"/><circle cx="65" cy="96" r="7"/><circle cx="85" cy="96" r="7"/><circle cx="105" cy="96" r="7"/></g></g>
      <g transform="translate(860 470)"><path d="M-36 0 L-30 -66 L30 -66 L36 0Z" fill="${C.orange}"/><g fill="#5fa35a"><ellipse cx="-22" cy="-110" rx="16" ry="46" transform="rotate(-24 -22 -110)"/><ellipse cx="0" cy="-124" rx="16" ry="54"/><ellipse cx="22" cy="-110" rx="16" ry="46" transform="rotate(24 22 -110)"/></g></g>
      <rect x="110" y="236" width="740" height="180" rx="44" fill="#5b5f6b"/>
      <rect x="128" y="376" width="704" height="96" rx="26" fill="#6b707d"/>
      ${adult({ x: 300, y: 408, s: 2.35, hair: 'brown', armL: 'wave', waveL: 26 * sway, armR: 'down', mouth: talk, blink: blinkAt([1.1, 3.6]), lap: true })}
      ${kid({ x: 480, y: 410 - bob, s: 1.05, arms: 'wave', wave: 28 * sway2, mouth: 'open', blink: blinkAt([2.3, 4.8]), lap: true })}
      ${adult({ x: 660, y: 408, s: 2.3, hair: 'blond', armL: 'down', armR: 'wave', waveR: 26 * sway2, mouth: 'smile', blink: blinkAt([0.6, 3.0, 5.2]), lap: true })}
      <rect x="84" y="300" width="74" height="176" rx="30" fill="#4d515c"/>
      <rect x="802" y="300" width="74" height="176" rx="30" fill="#4d515c"/>
    </svg>`;
  },
};
