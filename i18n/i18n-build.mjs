// Builds /es/ pages from the English pages + es.json, and adds hreflang + language switch to both.
import fs from 'fs';
import path from 'path';
import { mask, norm } from './i18n-extract.mjs';

const site = process.argv[2];
const dict = JSON.parse(fs.readFileSync(new URL('./es.json', import.meta.url), 'utf8'));
const BASE = 'https://www.vincastudio.com';
const enStrings = JSON.parse(fs.readFileSync(new URL('./strings.json', import.meta.url), 'utf8'));

// EN file → [EN url, ES url, ES file]
const pages = {
  'index.html':             ['/', '/es', 'es/index.html'],
  'about.html':             ['/about', '/es/nosotros', 'es/nosotros.html'],
  'services.html':          ['/services', '/es/servicios', 'es/servicios.html'],
  'work.html':              ['/work', '/es/proyectos', 'es/proyectos.html'],
  'contact.html':           ['/contact', '/es/contacto', 'es/contacto.html'],
  'work/notco.html':        ['/work/notco', '/es/proyectos/notco', 'es/proyectos/notco.html'],
  'work/irene-castro.html': ['/work/irene-castro', '/es/proyectos/irene-castro', 'es/proyectos/irene-castro.html'],
  'work/qarmela.html':      ['/work/qarmela', '/es/proyectos/qarmela', 'es/proyectos/qarmela.html'],
  'work/fossil-fuel.html':  ['/work/fossil-fuel', '/es/proyectos/fossil-fuel', 'es/proyectos/fossil-fuel.html'],
};
const enToEs = Object.fromEntries(Object.values(pages).map(([en, es]) => [en, es]));

// Headings whose Spanish word order differs from the English fragments.
const overrides = {
  'services.html': [
    ['Brand<br><em>Clarity</em><br>Audit', 'Auditoría de<br><em>Claridad</em><br>de Marca'],
    ['Brand &amp;<br><em>Sales</em><br>Sprint', 'Sprint de<br><em>Marca</em><br>y Ventas'],
    ['Launch<br><em>Pack</em>', 'Pack de<br><em>Lanzamiento</em>'],
    ['Ongoing<br>Content<br><em>Support</em>', 'Soporte de<br>Contenido<br><em>Continuo</em>'],
  ],
  'contact.html': [
    [/<span class="block">Let's build<\/span>\s*<span class="block">something<\/span>\s*<span class="block hl-pink">worth<\/span>\s*<span class="block hl-pink">talking<\/span>\s*<span class="block">about.<\/span>/,
      '<span class="block">Constru&shy;yamos</span>\n        <span class="block">algo</span>\n        <span class="block">que</span>\n        <span class="block hl-pink accent-line">dé que</span>\n        <span class="block hl-pink">hablar.</span>'],
  ],
  'work/qarmela.html': [
    ['A mark that<br>grows with<br>the <span class="coral">brand.</span>', 'Un símbolo que<br>crece con<br>la <span class="coral">marca.</span>'],
    ['A brand that<br>grows <span class="accent">everywhere.</span>', 'Una marca que<br>crece <span class="accent">en todas partes.</span>'],
  ],
};

// Spanish-only layout tweaks for longer words.
const extraCss = {
  'work/fossil-fuel.html': '@media (max-width: 600px) { .wild-h { font-size: 11vw; } .closing-quote { font-size: 12.5vw; } }',
  'contact.html': '.contact-headline .block { display: block; } .contact-headline .accent-line { padding-top: 0.12em; }',
};

const translate = s => {
  const n = norm(s);
  const t = dict[n];
  if (!t) return null;
  const lead = /^[,.:;]/.test(t) ? '' : s.match(/^\s*/)[0];
  return lead + t + s.match(/\s*$/)[0];
};

// Replace text nodes and selected attributes outside script/style/svg/comments.
function translateHtml(html) {
  const m = mask(html);
  const edits = [];
  for (const x of m.matchAll(/>([^<>]+)</g)) {
    const t = translate(x[1]);
    if (t != null) edits.push([x.index + 1, x[1].length, t]);
  }
  for (const x of m.matchAll(/\s(?:alt|aria-label|placeholder|title)="([^"]*)"/g)) {
    const t = dict[norm(x[1])];
    if (t) edits.push([x.index + x[0].length - 1 - x[1].length, x[1].length, t.replace(/"/g, '&quot;')]);
  }
  for (const x of m.matchAll(/<meta (?:name|property)="(?:description|og:title|og:description)" content="([^"]*)"/g)) {
    const t = dict[norm(x[1])];
    if (t) edits.push([x.index + x[0].length - 1 - x[1].length, x[1].length, t.replace(/"/g, '&quot;')]);
  }
  edits.sort((a, b) => b[0] - a[0]);
  for (const [i, len, t] of edits) html = html.slice(0, i) + t + html.slice(i + len);
  return html;
}

// Make relative asset/link paths absolute, based on the EN page's URL directory.
function absolutize(html, enFile) {
  const dir = enFile.includes('/') ? '/' + path.posix.dirname(enFile) + '/' : '/';
  const abs = p => {
    if (/^(?:[a-z]+:|\/|#|data:|\$\{)/i.test(p) || p === '') return p;
    return path.posix.normalize(dir + p);
  };
  html = html.replace(/(\s(?:src|href|poster|data-src)=")([^"]*)"/g, (_, a, p) => `${a}${abs(p)}"`);
  html = html.replace(/(\ssrcset=")([^"]*)"/g, (_, a, v) => a + v.split(',').map(s => s.trim().replace(/^\S+/, abs)).join(', ') + '"');
  html = html.replace(/url\((['"]?)([^'")]+)\1\)/g, (_, q, p) => `url(${q}${abs(p)}${q})`);
  return html;
}

// Point internal page links at the Spanish URLs.
function localizeLinks(html) {
  return html.replace(/(\shref=")([^"]*)"/g, (all, a, p) => {
    const [pathPart, hash = ''] = p.split('#');
    if (!pathPart.startsWith('/') && pathPart !== '') return all;
    if (pathPart === '' ) return all;
    const es = enToEs[pathPart.replace(/\.html$/, '').replace(/^\/index$/, '/')];
    return es ? `${a}${es}${hash ? '#' + hash : ''}"` : all;
  });
}

const langCss = `<style>
    .nav-links .nav-lang a {
      display: inline-block;
      padding: 0.3rem 0.75rem;
      border: 1px solid rgba(255,255,255,0.28);
      border-radius: 100px;
      color: rgba(255,255,255,0.85);
      transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s;
    }
    .nav-links .nav-lang a:hover { color: #fff; border-color: rgba(255,255,255,0.6); transform: translateY(-1px); }
    .nav-links .nav-lang a:focus-visible { outline: 2px solid #F0B45E; outline-offset: 3px; }
    .nav-links .nav-lang a:active { transform: scale(0.95); opacity: 0.8; }
    .nav-links:has(.nav-lang) { align-items: center; }
    .nav-links .lang-long, .mobile-menu .lang-short { display: none; }
    .mobile-menu li a[hreflang] { font-size: 1.15rem; letter-spacing: 0.04em; color: rgba(233,227,220,0.6); margin-top: 1.25rem; }
    .mobile-menu li a[hreflang]:hover, .mobile-menu li a[hreflang]:focus-visible { color: #DC85B7; }
  </style>`;

function addLangBits(html, enUrl, esUrl, lang) {
  const alt = [
    `<link rel="alternate" hreflang="en" href="${BASE}${enUrl}" />`,
    `<link rel="alternate" hreflang="es" href="${BASE}${esUrl}" />`,
    `<link rel="alternate" hreflang="x-default" href="${BASE}${enUrl}" />`,
    `<meta property="og:locale" content="${lang === 'es' ? 'es_ES' : 'en_GB'}" />`,
    `<meta property="og:locale:alternate" content="${lang === 'es' ? 'en_GB' : 'es_ES'}" />`,
  ];
  html = html.replace(/\s*<!-- LANG -->[\s\S]*?<!-- \/LANG -->/, '');
  html = html.replace(/(\n([ \t]*)<!-- \/SEO -->)/, (m, a, ws) => `\n${ws}<!-- LANG -->` + alt.map(t => `\n${ws}${t}`).join('') + `\n${ws}<!-- /LANG -->` + a);
  html = html.replace(/\s*<style>\s*\.nav-links \.nav-lang a \{[\s\S]*?<\/style>/, '');
  html = html.replace('</head>', `  ${langCss}\n</head>`);
  const sw = lang === 'es'
    ? `<li class="nav-lang"><a href="${enUrl}" lang="en" hreflang="en" aria-label="View this page in English"><span class="lang-short">EN</span><span class="lang-long">English</span></a></li>`
    : `<li class="nav-lang"><a href="${esUrl}" lang="es" hreflang="es" aria-label="Ver esta página en español"><span class="lang-short">ES</span><span class="lang-long">Español</span></a></li>`;
  html = html.replace(/\s*<li class="nav-lang">.*?<\/li>/, '');
  html = html.replace(/(<ul class="nav-links">[\s\S]*?)(\n(\s*)<\/ul>)/, (m, a, b, ws) => `${a}\n${ws}  ${sw}${b}`);
  return html;
}

const missing = new Set();
for (const [enFile, [enUrl, esUrl, esFile]] of Object.entries(pages)) {
  const enPath = path.join(site, enFile);
  let en = fs.readFileSync(enPath, 'utf8');
  en = addLangBits(en, enUrl, esUrl, 'en');
  fs.writeFileSync(enPath, en);

  let es = en.replace(/\s*<li class="nav-lang">.*?<\/li>/, '');
  for (const [from, to] of overrides[enFile] || []) {
    const before = es; es = es.replace(from, to);
    if (es === before) console.warn('override not applied:', enFile, String(from).slice(0, 40));
  }
  es = translateHtml(es);
  es = absolutize(es, enFile);
  es = localizeLinks(es);
  es = es.replace('<html lang="en"', '<html lang="es"');
  es = es.replace(/(<link rel="canonical" href=")[^"]*"/, `$1${BASE}${esUrl}"`);
  es = es.replace(/(<meta property="og:url" content=")[^"]*"/, `$1${BASE}${esUrl}"`);
  es = es.replace(/'Close menu'/g, "'Cerrar menú'").replace(/'Open menu'/g, "'Abrir menú'");
  es = es.replace(/"inLanguage":"en"/, '"inLanguage":"es"');
  es = addLangBits(es, enUrl, esUrl, 'es');
  if (extraCss[enFile]) es = es.replace('</head>', `  <style>${extraCss[enFile]}</style>\n</head>`);

  const out = path.join(site, esFile);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, es);

  // Report English text left untranslated (excluding names kept on purpose).
  const mm = mask(es);
  for (const x of mm.matchAll(/>([^<>]+)</g)) { const n = norm(x[1]); if (n in enStrings && !(n in dict)) missing.add(`${esFile}: ${n}`); }
  console.log('built', esFile);
}
if (missing.size) console.log('\nStill English (check):\n' + [...missing].join('\n'));
