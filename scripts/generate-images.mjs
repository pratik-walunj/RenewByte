/**
 * Generates placeholder product, hero and blog artwork as optimised WebP.
 *
 *   npm run images:generate
 *
 * These are neutral studio-style renders so the demo catalogue looks consistent.
 * Replace them with real photos of each unit (upload via /admin or Cloudinary).
 * No manufacturer logos are drawn.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const out = (...p) => path.join(root, "public", "images", ...p);

/** Colourways: body tones + wallpaper palette. */
export const STYLES = {
  silver: { body: ["#e6e9ee", "#c9ced6"], edge: "#b3b9c3", deck: "#d9dde3", keys: "#2b2f36", wall: ["#1e3a8a", "#3b82f6", "#93c5fd"] },
  graphite: { body: ["#4b5059", "#2f333a"], edge: "#23262b", deck: "#3a3e45", keys: "#16181c", wall: ["#0f172a", "#334155", "#94a3b8"] },
  black: { body: ["#2a2d33", "#15171a"], edge: "#0e0f11", deck: "#1f2226", keys: "#0b0c0e", wall: ["#111827", "#7c3aed", "#f472b6"] },
  spacegray: { body: ["#8a8f98", "#6b7079"], edge: "#5b6068", deck: "#7c818a", keys: "#1f2227", wall: ["#0c4a6e", "#0ea5e9", "#a5f3fc"] },
  midnight: { body: ["#2d3446", "#1b2130"], edge: "#141925", deck: "#262d3d", keys: "#10131a", wall: ["#022c22", "#059669", "#6ee7b7"] },
  gaming: { body: ["#25282e", "#101114"], edge: "#08090a", deck: "#1c1e22", keys: "#0a0a0b", wall: ["#1f0a0a", "#dc2626", "#fb923c"], rgb: true },
};

const W = 1200;
const H = 900;

function wallpaper(id, [a, b, c]) {
  return `
  <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${a}"/>
    <stop offset="0.55" stop-color="${b}"/>
    <stop offset="1" stop-color="${c}"/>
  </linearGradient>`;
}

function stage(extra = "") {
  return `
  <defs>
    <radialGradient id="bg" cx="0.5" cy="0.42" r="0.75">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="1" stop-color="#e9edf2"/>
    </radialGradient>
    <radialGradient id="shadow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#0f172a" stop-opacity="0.28"/>
      <stop offset="1" stop-color="#0f172a" stop-opacity="0"/>
    </radialGradient>
    ${extra}
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>`;
}

function waves(x, y, w, h, s) {
  return `
    <g opacity="0.55">
      <path d="M${x} ${y + h * 0.7} C ${x + w * 0.3} ${y + h * 0.45}, ${x + w * 0.6} ${y + h * 0.95}, ${x + w} ${y + h * 0.55} L ${x + w} ${y + h} L ${x} ${y + h} Z" fill="${s.wall[2]}" opacity="0.35"/>
      <path d="M${x} ${y + h * 0.82} C ${x + w * 0.35} ${y + h * 0.6}, ${x + w * 0.7} ${y + h * 1.02}, ${x + w} ${y + h * 0.72} L ${x + w} ${y + h} L ${x} ${y + h} Z" fill="${s.wall[1]}" opacity="0.5"/>
    </g>`;
}

/** Front view: open laptop facing the camera. */
function front(s) {
  const sx = 250, sy = 150, sw = 700, sh = 440;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${stage(`${wallpaper("wall", s.wall)}
    <linearGradient id="lid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s.body[0]}"/><stop offset="1" stop-color="${s.body[1]}"/></linearGradient>
    <linearGradient id="base" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s.body[0]}"/><stop offset="1" stop-color="${s.edge}"/></linearGradient>
    <linearGradient id="glare" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.16"/><stop offset="0.45" stop-color="#fff" stop-opacity="0"/></linearGradient>`)}
  <ellipse cx="600" cy="712" rx="470" ry="34" fill="url(#shadow)"/>
  <rect x="${sx - 22}" y="${sy - 22}" width="${sw + 44}" height="${sh + 50}" rx="22" fill="url(#lid)"/>
  <rect x="${sx - 14}" y="${sy - 14}" width="${sw + 28}" height="${sh + 34}" rx="14" fill="#0b0d10"/>
  <rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" rx="4" fill="url(#wall)"/>
  ${waves(sx, sy, sw, sh, s)}
  <rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" rx="4" fill="url(#glare)"/>
  <circle cx="600" cy="${sy - 7}" r="3" fill="#1f2937"/>
  <path d="M130 ${sy + sh + 38} L1070 ${sy + sh + 38} L1110 ${sy + sh + 70} Q1112 ${sy + sh + 84} 1096 ${sy + sh + 86} L104 ${sy + sh + 86} Q88 ${sy + sh + 84} 90 ${sy + sh + 70} Z" fill="url(#base)"/>
  <rect x="530" y="${sy + sh + 38}" width="140" height="10" rx="5" fill="${s.edge}" opacity="0.7"/>
  <rect x="104" y="${sy + sh + 84}" width="992" height="4" rx="2" fill="#000" opacity="0.18"/>
  </svg>`;
}

/** Three-quarter view with visible keyboard deck. */
function angle(s) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${stage(`${wallpaper("wall", s.wall)}
    <linearGradient id="lid" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${s.body[0]}"/><stop offset="1" stop-color="${s.body[1]}"/></linearGradient>
    <linearGradient id="deck" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${s.deck}"/><stop offset="1" stop-color="${s.body[1]}"/></linearGradient>`)}
  <ellipse cx="610" cy="760" rx="480" ry="40" fill="url(#shadow)"/>
  <!-- screen -->
  <path d="M300 120 L930 175 L905 560 L285 600 Z" fill="url(#lid)"/>
  <path d="M314 138 L914 190 L891 546 L298 584 Z" fill="#0b0d10"/>
  <path d="M328 152 L900 202 L878 532 L312 568 Z" fill="url(#wall)"/>
  <path d="M328 152 L900 202 L889 367 L320 390 Z" fill="#fff" opacity="0.07"/>
  <!-- deck -->
  <path d="M285 600 L905 560 L1105 690 L420 760 Z" fill="url(#deck)"/>
  <path d="M420 760 L1105 690 L1108 706 L424 778 Z" fill="${s.edge}"/>
  <!-- keyboard -->
  <g fill="${s.keys}" opacity="0.92">
    ${Array.from({ length: 5 }, (_, r) =>
      Array.from({ length: 13 }, (_, c) => {
        const t = c / 13, u = r / 5;
        const x0 = 360 + t * 560 + u * 95;
        const y0 = 610 - t * 36 + u * 60;
        return `<path d="M${x0} ${y0} l38 -2.5 l6 10 l-38 2.6 Z"/>`;
      }).join("")).join("")}
  </g>
  ${s.rgb ? `<path d="M360 610 L920 574 L1015 674 L455 712 Z" fill="${s.wall[1]}" opacity="0.12"/>` : ""}
  <path d="M640 712 L820 698 L850 735 L668 750 Z" fill="${s.body[1]}" opacity="0.55"/>
  </svg>`;
}

/** Closed lid seen from above at an angle. */
function closed(s) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${stage(`<linearGradient id="lid" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${s.body[0]}"/><stop offset="1" stop-color="${s.body[1]}"/></linearGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.18"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`)}
  <ellipse cx="600" cy="700" rx="500" ry="46" fill="url(#shadow)"/>
  <path d="M190 300 L990 250 L1080 610 L140 660 Z" fill="url(#lid)"/>
  <path d="M190 300 L990 250 L1000 290 L196 342 Z" fill="url(#sheen)"/>
  <path d="M140 660 L1080 610 L1082 632 L142 684 Z" fill="${s.edge}"/>
  <ellipse cx="608" cy="455" rx="34" ry="20" fill="${s.edge}" opacity="0.35"/>
  </svg>`;
}

/** Side profile showing ports and thickness. */
function side(s) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${stage(`<linearGradient id="body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s.body[0]}"/><stop offset="1" stop-color="${s.body[1]}"/></linearGradient>`)}
  <ellipse cx="600" cy="560" rx="520" ry="26" fill="url(#shadow)"/>
  <rect x="110" y="420" width="980" height="46" rx="14" fill="url(#body)"/>
  <rect x="110" y="466" width="980" height="62" rx="18" fill="url(#body)"/>
  <rect x="110" y="462" width="980" height="6" fill="${s.edge}"/>
  <g fill="#0b0d10">
    <rect x="200" y="486" width="46" height="18" rx="5"/>
    <rect x="266" y="488" width="30" height="14" rx="7"/>
    <rect x="314" y="488" width="30" height="14" rx="7"/>
    <rect x="364" y="484" width="64" height="22" rx="3"/>
    <circle cx="460" cy="495" r="8"/>
  </g>
  <g fill="${s.edge}" opacity="0.8">
    ${Array.from({ length: 16 }, (_, i) => `<rect x="${780 + i * 14}" y="492" width="6" height="12" rx="3"/>`).join("")}
  </g>
  </svg>`;
}

function hero() {
  const s = STYLES.silver;
  const g = STYLES.graphite;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1200" viewBox="0 0 1600 1200">
  <defs>
    <radialGradient id="bg" cx="0.55" cy="0.45" r="0.8"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e7ecf2"/></radialGradient>
    <radialGradient id="shadow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#0f172a" stop-opacity="0.3"/><stop offset="1" stop-color="#0f172a" stop-opacity="0"/></radialGradient>
    ${wallpaper("w1", s.wall)}${wallpaper("w2", g.wall)}
    <linearGradient id="lid1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${s.body[0]}"/><stop offset="1" stop-color="${s.body[1]}"/></linearGradient>
    <linearGradient id="lid2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${g.body[0]}"/><stop offset="1" stop-color="${g.body[1]}"/></linearGradient>
  </defs>
  <rect width="1600" height="1200" fill="url(#bg)"/>
  <circle cx="1180" cy="330" r="260" fill="#dbeafe" opacity="0.55"/>
  <!-- back laptop (graphite) -->
  <ellipse cx="1090" cy="830" rx="420" ry="36" fill="url(#shadow)"/>
  <path d="M840 250 L1340 300 L1320 640 L825 670 Z" fill="url(#lid2)"/>
  <path d="M852 266 L1326 312 L1308 628 L838 656 Z" fill="#0b0d10"/>
  <path d="M864 278 L1314 322 L1297 616 L850 644 Z" fill="url(#w2)"/>
  <path d="M825 670 L1320 640 L1470 760 L950 806 Z" fill="${g.deck}"/>
  <path d="M950 806 L1470 760 L1472 776 L952 822 Z" fill="${g.edge}"/>
  <!-- front laptop (silver) -->
  <ellipse cx="640" cy="1000" rx="560" ry="48" fill="url(#shadow)"/>
  <path d="M230 260 L960 330 L930 790 L210 840 Z" fill="url(#lid1)"/>
  <path d="M246 280 L942 346 L915 774 L226 822 Z" fill="#0b0d10"/>
  <path d="M262 296 L926 360 L900 758 L242 806 Z" fill="url(#w1)"/>
  <path d="M262 296 L926 360 L914 540 L252 560 Z" fill="#fff" opacity="0.08"/>
  <path d="M210 840 L930 790 L1170 950 L380 1020 Z" fill="${s.deck}"/>
  <path d="M380 1020 L1170 950 L1174 970 L384 1042 Z" fill="${s.edge}"/>
  <g fill="${s.keys}" opacity="0.9">
    ${Array.from({ length: 5 }, (_, r) =>
      Array.from({ length: 13 }, (_, c) => {
        const t = c / 13, u = r / 5;
        const x0 = 300 + t * 650 + u * 115;
        const y0 = 852 - t * 45 + u * 74;
        return `<path d="M${x0} ${y0} l44 -3 l7 12 l-44 3 Z"/>`;
      }).join("")).join("")}
  </g>
  </svg>`;
}

function blogCover(hueA, hueB, variant) {
  const shapes = {
    a: `<circle cx="920" cy="220" r="180" fill="#fff" opacity="0.08"/><circle cx="260" cy="560" r="240" fill="#fff" opacity="0.06"/>`,
    b: `<rect x="700" y="80" width="420" height="420" rx="48" fill="#fff" opacity="0.07" transform="rotate(12 910 290)"/>`,
    c: `<path d="M0 520 C 300 380, 700 660, 1200 420 L1200 630 L0 630 Z" fill="#fff" opacity="0.08"/>`,
    d: `<g opacity="0.1" fill="#fff">${Array.from({ length: 8 }, (_, i) => `<rect x="${120 + i * 130}" y="${120 + (i % 3) * 60}" width="70" height="${260 - (i % 3) * 60}" rx="10"/>`).join("")}</g>`,
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${hueA}"/><stop offset="1" stop-color="${hueB}"/></linearGradient></defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  ${shapes[variant]}
  <g transform="translate(360 150) scale(0.4)" opacity="0.95">
    <rect x="228" y="128" width="744" height="490" rx="22" fill="#e6e9ee"/>
    <rect x="248" y="148" width="704" height="450" rx="6" fill="#0f172a"/>
    <rect x="262" y="162" width="676" height="422" rx="4" fill="${hueB}" opacity="0.7"/>
    <path d="M130 640 L1070 640 L1110 672 Q1112 686 1096 688 L104 688 Q88 686 90 672 Z" fill="#cfd4dc"/>
  </g>
  </svg>`;
}

async function render(svg, file, width) {
  await mkdir(path.dirname(file), { recursive: true });
  let img = sharp(Buffer.from(svg));
  if (width) img = img.resize({ width });
  await writeFile(file, await img.webp({ quality: 82, effort: 5 }).toBuffer());
}

const VIEWS = { front, angle, closed, side };

async function main() {
  for (const [name, style] of Object.entries(STYLES)) {
    for (const [view, fn] of Object.entries(VIEWS)) {
      await render(fn(style), out("products", `${name}-${view}.webp`));
    }
  }
  await render(hero(), out("home", "hero.webp"));
  const covers = [
    ["best-refurbished-laptops-under-30000", "#1e3a8a", "#3b82f6", "a"],
    ["refurbished-vs-used-laptop-difference", "#0f172a", "#475569", "b"],
    ["how-to-choose-a-laptop-for-students", "#065f46", "#10b981", "c"],
    ["best-business-laptops-for-professionals", "#1f2937", "#6366f1", "d"],
    ["how-to-check-laptop-battery-health", "#78350f", "#f59e0b", "c"],
    ["laptop-maintenance-tips", "#312e81", "#8b5cf6", "a"],
  ];
  for (const [slug, a, b, v] of covers) {
    await render(blogCover(a, b, v), out("blog", slug, "cover.webp"));
  }
  const og = blogCover("#0f172a", "#2563eb", "b");
  await mkdir(out("brand"), { recursive: true });
  await writeFile(out("brand", "og-default.png"), await sharp(Buffer.from(og)).png().toBuffer());
  console.log("Images generated in public/images");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
