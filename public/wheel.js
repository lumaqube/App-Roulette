// The wheel, drawn on a canvas. Segments (colour, cover, name) are drawn once into an offscreen
// layer whenever the items, a cover or the size change; each frame only turns that layer and
// draws the rim with its chasing bulbs and the hub.
// Angles: canvas radians, 0 = right, clockwise. The pointer is at the top (-PI/2).
export const POINTER = -Math.PI / 2;
const PALETTE = ['#ff4d6d', '#ffb703', '#06d6a0', '#3a86ff', '#9b5de5', '#ff7b00', '#00bbf9', '#f15bb5'];

export class Wheel {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.items = [];
    this.size = 0;
    this.layer = document.createElement('canvas');
    this.dirty = true;
  }

  get seg() { return (Math.PI * 2) / Math.max(1, this.items.length); }

  // items: [{ id, name, img }] in wheel order; colours are given here (no two neighbours alike).
  setItems(items) {
    const n = items.length;
    this.items = items.map((it, i) => {
      let c = i % PALETTE.length;
      if (i === n - 1 && n > 1 && c === 0) c = 3; // the last one touches the first
      return { ...it, color: PALETTE[c] };
    });
    this.dirty = true;
  }

  resize(cssSize) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const px = Math.max(50, Math.round(cssSize * dpr));
    if (px === this.size) return;
    this.size = px;
    this.canvas.width = this.canvas.height = px;
    this.canvas.style.width = this.canvas.style.height = cssSize + 'px';
    this.layer.width = this.layer.height = px;
    this.dirty = true;
  }

  // The segment under the pointer at rotation `angle`.
  indexAt(angle) {
    const n = this.items.length;
    if (!n) return -1;
    let k = Math.round((POINTER - angle) / this.seg) % n;
    return k < 0 ? k + n : k;
  }

  // Rotation that brings segment k under the pointer, at or after `from`, plus `turns` full turns.
  // `jitter` (-0.5..0.5 of a segment) keeps the stop from always being dead centre.
  targetFor(k, from, turns, jitter = 0) {
    const want = POINTER - (k + jitter) * this.seg;
    let delta = (want - from) % (Math.PI * 2);
    if (delta < 0) delta += Math.PI * 2;
    return from + delta + turns * Math.PI * 2;
  }

  buildLayer() {
    const g = this.layer.getContext('2d');
    const S = this.size, c = S / 2, R = S * 0.43, n = this.items.length, seg = this.seg;
    g.clearRect(0, 0, S, S);
    if (!n) return;
    g.save();
    g.translate(c, c);
    for (let i = 0; i < n; i++) {
      const it = this.items[i];
      const a0 = i * seg - seg / 2, a1 = a0 + seg;
      // wedge with a light-to-colour gradient
      const grad = g.createRadialGradient(0, 0, R * 0.1, 0, 0, R);
      grad.addColorStop(0, shade(it.color, 0.35));
      grad.addColorStop(0.75, it.color);
      grad.addColorStop(1, shade(it.color, -0.18));
      g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, R, a0, a1); g.closePath();
      g.fillStyle = grad; g.fill();
      // divider
      g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = Math.max(2, S * 0.006);
      g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a0) * R, Math.sin(a0) * R); g.stroke();

      g.save();
      g.rotate(i * seg);
      // the cover: a round photo near the rim
      const rImg = R * 0.72;
      const d = Math.min(2 * rImg * Math.sin(seg / 2) * 0.86, R * 0.42);
      if (it.img && d > S * 0.03) {
        g.save();
        g.translate(rImg, 0);
        g.rotate(Math.PI / 2); // upright when the segment is at the top
        g.beginPath(); g.arc(0, 0, d / 2, 0, Math.PI * 2); g.closePath();
        g.fillStyle = '#fff'; g.shadowColor = 'rgba(0,0,0,0.35)'; g.shadowBlur = S * 0.012; g.fill();
        g.shadowBlur = 0;
        g.beginPath(); g.arc(0, 0, d / 2 - S * 0.006, 0, Math.PI * 2); g.clip();
        const im = it.img, sc = Math.max(d / im.width, d / im.height);
        g.drawImage(im, -im.width * sc / 2, -im.height * sc / 2, im.width * sc, im.height * sc);
        g.restore();
      } else if (d > S * 0.03) {
        // no cover: a white disc with the first letter
        g.save();
        g.translate(rImg, 0); g.rotate(Math.PI / 2);
        g.beginPath(); g.arc(0, 0, d / 2, 0, Math.PI * 2);
        g.fillStyle = 'rgba(255,255,255,0.92)'; g.fill();
        g.fillStyle = it.color; g.font = `700 ${d * 0.5}px Fredoka, sans-serif`;
        g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText((it.name || '?').trim().charAt(0).toUpperCase(), 0, d * 0.03);
        g.restore();
      }
      // the name, along the radius, inside the cover
      const fs = Math.min(R * 0.07, 2 * (R * 0.36) * Math.sin(seg / 2) * 0.55);
      if (fs > S * 0.012) {
        g.font = `600 ${fs}px Fredoka, sans-serif`;
        g.textAlign = 'right'; g.textBaseline = 'middle';
        const maxW = rImg - d / 2 - R * 0.3; // stays clear of the hub (0.19 R)
        const label = fit(g, it.name || '', maxW);
        g.lineWidth = fs * 0.22; g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineJoin = 'round';
        g.strokeText(label, rImg - d / 2 - R * 0.04, 0);
        g.fillStyle = '#fff';
        g.fillText(label, rImg - d / 2 - R * 0.04, 0);
      }
      g.restore();
    }
    g.restore();
    this.dirty = false;
  }

  // phase: bulb animation time (s); mode: 'idle' | 'spin' | 'won'
  draw(angle, phase, mode) {
    if (this.dirty) this.buildLayer();
    const g = this.ctx, S = this.size, c = S / 2, R = S * 0.43;
    g.clearRect(0, 0, S, S);
    // shadow under the wheel
    g.save();
    g.beginPath(); g.arc(c, c + S * 0.012, R * 1.1, 0, Math.PI * 2);
    g.fillStyle = 'rgba(20,0,40,0.35)'; g.filter = `blur(${Math.round(S * 0.012)}px)`; g.fill();
    g.restore();
    // turning segments
    g.save();
    g.translate(c, c); g.rotate(angle); g.translate(-c, -c);
    g.drawImage(this.layer, 0, 0);
    g.restore();
    // rim
    const rim = g.createLinearGradient(0, c - R * 1.1, 0, c + R * 1.1);
    rim.addColorStop(0, '#ffe08a'); rim.addColorStop(0.5, '#f4a300'); rim.addColorStop(1, '#ffd25a');
    g.beginPath(); g.arc(c, c, R * 1.085, 0, Math.PI * 2); g.arc(c, c, R * 0.995, 0, Math.PI * 2, true);
    g.fillStyle = rim; g.fill('evenodd');
    g.beginPath(); g.arc(c, c, R * 0.995, 0, Math.PI * 2); g.lineWidth = S * 0.006; g.strokeStyle = 'rgba(120,60,0,0.45)'; g.stroke();
    // bulbs: chase while idle, race while spinning, all blink when won
    const bulbs = 24;
    for (let i = 0; i < bulbs; i++) {
      const a = (i / bulbs) * Math.PI * 2 - Math.PI / 2;
      const x = c + Math.cos(a) * R * 1.04, y = c + Math.sin(a) * R * 1.04;
      let on;
      if (mode === 'won') on = Math.floor(phase * 6) % 2 === 0;
      else if (mode === 'spin') on = (i + Math.floor(phase * 22)) % 3 === 0;
      else on = (i + Math.floor(phase * 4)) % 2 === 0;
      const r = S * 0.0115;
      if (on) {
        const glow = g.createRadialGradient(x, y, 0, x, y, r * 3);
        glow.addColorStop(0, 'rgba(255,255,220,0.9)'); glow.addColorStop(1, 'rgba(255,240,150,0)');
        g.fillStyle = glow; g.beginPath(); g.arc(x, y, r * 3, 0, Math.PI * 2); g.fill();
      }
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2);
      g.fillStyle = on ? '#fffbe0' : '#b86b00'; g.fill();
    }
    // hub
    const hub = g.createRadialGradient(c - R * 0.04, c - R * 0.05, R * 0.02, c, c, R * 0.19);
    hub.addColorStop(0, '#fff7d1'); hub.addColorStop(0.55, '#ffc23d'); hub.addColorStop(1, '#e07b00');
    g.beginPath(); g.arc(c, c, R * 0.19, 0, Math.PI * 2);
    g.fillStyle = hub; g.shadowColor = 'rgba(0,0,0,0.35)'; g.shadowBlur = S * 0.02; g.fill();
    g.shadowBlur = 0;
    g.lineWidth = S * 0.008; g.strokeStyle = '#fff'; g.stroke();
  }
}

function fit(g, text, maxW) {
  if (maxW <= 0) return '';
  if (g.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 1 && g.measureText(t + '…').width > maxW) t = t.slice(0, -1);
  return t + '…';
}

// lighter (amt > 0) or darker (amt < 0) version of a #rrggbb colour
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const ch = s => { const v = (n >> s) & 255; return Math.round(amt > 0 ? v + (255 - v) * amt : v * (1 + amt)); };
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}
