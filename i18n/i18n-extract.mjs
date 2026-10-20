// Lists translatable text (text nodes + key attributes) from the English pages, in page order.
import fs from 'fs';
import path from 'path';

const site = process.argv[2];
const out = process.argv[3];
const files = ['index.html', 'about.html', 'services.html', 'work.html', 'contact.html',
  'work/notco.html', 'work/irene-castro.html', 'work/qarmela.html', 'work/fossil-fuel.html'];

// Blank out regions we never translate, keeping offsets stable.
export function mask(html) {
  return html.replace(/<(script|style|svg)\b[\s\S]*?<\/\1>|<!--[\s\S]*?-->/gi, m => ' '.repeat(m.length));
}
const worth = s => /[A-Za-zÀ-ÿ]/.test(s) && !/^(https?:|\/|#|mailto:|tel:)/.test(s);
export const norm = s => s.replace(/\s+/g, ' ').trim();

if (import.meta.url.endsWith("i18n-extract.mjs") && process.argv[1]?.endsWith("i18n-extract.mjs")) {
const seen = new Map();
for (const f of files) {
  const html = fs.readFileSync(path.join(site, f), 'utf8');
  const m = mask(html);
  const add = s => { s = norm(s); if (s && worth(s) && !seen.has(s)) seen.set(s, f); };
  for (const x of m.matchAll(/>([^<>]+)</g)) add(x[1]);
  for (const x of m.matchAll(/\s(alt|aria-label|placeholder|title)="([^"]*)"/g)) add(x[2]);
  for (const x of m.matchAll(/<meta (?:name|property)="(?:description|og:title|og:description)" content="([^"]*)"/g)) add(x[1]);
}
const obj = {};
let cur = '';
for (const [s, f] of seen) { if (f !== cur) { obj[`@@ ${f}`] = ''; cur = f; } obj[s] = ''; }
fs.writeFileSync(out, JSON.stringify(obj, null, 1));
console.log(seen.size, "segments");
}
