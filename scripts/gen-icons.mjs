// Generates PNG app icons with zero dependencies (Node's built-in zlib).
// Keeps the project free of any remote image asset.
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, "..", "public", "icons");
mkdirSync(outDir, { recursive: true });

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function draw(size, { maskable = false, rounded = !maskable } = {}) {
  const buf = Buffer.alloc(size * size * 4, 0);
  const set = (x, y, r, g, b, a = 255) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 4;
    const na = a / 255;
    buf[i] = Math.round(lerp(buf[i], r, na));
    buf[i + 1] = Math.round(lerp(buf[i + 1], g, na));
    buf[i + 2] = Math.round(lerp(buf[i + 2], b, na));
    buf[i + 3] = Math.max(buf[i + 3], a);
  };

  const safe = maskable ? 0.8 : 1; // keep art inside safe zone for maskable
  const cx = size / 2;
  const pad = (size * (1 - safe)) / 2;

  // Background gradient (forest 600 -> forest 950)
  for (let y = 0; y < size; y++) {
    const t = y / size;
    const r = Math.round(lerp(0x2d, 0x0b, t));
    const g = Math.round(lerp(0x65, 0x20, t));
    const b = Math.round(lerp(0x43, 0x15, t));
    for (let x = 0; x < size; x++) set(x, y, r, g, b, 255);
  }

  // Sun
  const sunX = cx - size * 0.16 * safe * 0.6;
  const sunY = size * 0.32;
  const sunR = size * 0.11 * safe;
  for (let y = Math.floor(sunY - sunR); y <= sunY + sunR; y++) {
    for (let x = Math.floor(sunX - sunR); x <= sunX + sunR; x++) {
      const d = Math.hypot(x - sunX, y - sunY);
      if (d <= sunR) set(x, y, 0xe9, 0xb4, 0x4c, 255);
    }
  }

  // Mountains (cream) - two triangles
  const drawTriangle = (ax, ay, bx, by, tx, ty, r, g, b) => {
    const minX = Math.floor(Math.min(ax, bx, tx));
    const maxX = Math.ceil(Math.max(ax, bx, tx));
    const minY = Math.floor(Math.min(ay, by, ty));
    const maxY = Math.ceil(Math.max(ay, by, ty));
    const sign = (px, py, x1, y1, x2, y2) => (px - x2) * (y1 - y2) - (x1 - x2) * (py - y2);
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const d1 = sign(x, y, ax, ay, bx, by);
        const d2 = sign(x, y, bx, by, tx, ty);
        const d3 = sign(x, y, tx, ty, ax, ay);
        const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
        const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
        if (!(hasNeg && hasPos)) set(x, y, r, g, b, 255);
      }
    }
  };

  const baseY = size - pad - size * 0.12 * safe;
  // back mountain (muted)
  drawTriangle(
    cx - size * 0.45 * safe, baseY,
    cx - size * 0.05 * safe, baseY,
    cx - size * 0.24 * safe, size * 0.42,
    0xd6, 0xc1, 0x97,
  );
  // front mountain (cream)
  drawTriangle(
    cx + size * 0.02 * safe, baseY,
    cx + size * 0.46 * safe, baseY,
    cx + size * 0.24 * safe, size * 0.36,
    0xf6, 0xf1, 0xe4,
  );

  // Ground band
  for (let y = Math.floor(baseY); y < size; y++) {
    for (let x = 0; x < size; x++) set(x, y, 0x1f, 0x51, 0x36, 255);
  }

  // Pine tree (left, dark green)
  const treeX = cx - size * 0.26 * safe;
  const treeTop = size * 0.46;
  const treeBot = baseY + 2;
  const treeW = size * 0.13 * safe;
  for (let tier = 0; tier < 3; tier++) {
    const tTop = treeTop + tier * size * 0.08 * safe;
    const tBot = tTop + size * 0.1 * safe;
    const w = treeW * (0.55 + tier * 0.2);
    drawTriangle(treeX - w, tBot, treeX + w, tBot, treeX, tTop, 0x17, 0x3d, 0x2a);
  }

  // Rounded-corner alpha mask (skipped for maskable/full-bleed icons)
  if (rounded) {
    const radius = size * 0.22;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = Math.max(radius - x, 0, x - (size - radius));
        const dy = Math.max(radius - y, 0, y - (size - radius));
        if (Math.hypot(dx, dy) > radius) {
          const i = (y * size + x) * 4;
          buf[i + 3] = 0;
        }
      }
    }
  }

  return buf;
}

const targets = [
  { file: "icon-192.png", size: 192, opts: {} },
  { file: "icon-512.png", size: 512, opts: {} },
  { file: "icon-maskable-512.png", size: 512, opts: { maskable: true } },
  // Full-bleed square for iOS home screen (iOS applies its own mask).
  { file: "apple-touch-icon.png", size: 180, opts: { rounded: false } },
];

for (const t of targets) {
  const png = encodePNG(t.size, t.size, draw(t.size, t.opts));
  writeFileSync(resolve(outDir, t.file), png);
  console.log(`wrote icons/${t.file} (${png.length} bytes)`);
}
