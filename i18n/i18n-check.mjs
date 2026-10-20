// Flags leftover English phrases and relative paths in the Spanish pages.
import fs from 'fs';
for (const f of process.argv.slice(2)) {
  const h = fs.readFileSync(f, 'utf8');
  const m = h.replace(/<(script|style|svg)\b[\s\S]*?<\/\1>|<!--[\s\S]*?-->/gi, '');
  const txt = [...m.matchAll(/>([^<>]+)</g)].map(x => x[1].replace(/\s+/g, ' ').trim()).filter(Boolean);
  const eng = txt.filter(t => /\b(the|and|your|with|our|we|you|for|that|this)\b/i.test(t) && !/Decision For A Long Night|Back From The Dead|Fossil Free|Not Hangover/i.test(t));
  const rel = [...h.matchAll(/(?:src|href)="(\.\.?\/[^"]*|brand_assets[^"]*)"/g)].map(x => x[1]);
  const urls = [...h.matchAll(/url\(([^)]*)\)/g)].map(x => x[1]).filter(u => !/^['"]?(\/|data:|http|#)/.test(u));
  console.log(f, '| english:', eng.length, eng.slice(0, 4), '| relative:', rel.length, rel.slice(0, 2), '| url():', urls.slice(0, 2));
}
