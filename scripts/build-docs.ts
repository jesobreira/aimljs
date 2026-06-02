#!/usr/bin/env node
/**
 * build-docs — Generate a static documentation site into gh-pages/
 *
 * Usage:
 *   npm run build:docs
 *   npx tsx scripts/build-docs.ts
 */

import { readFile, writeFile, mkdir, readdir } from 'fs/promises';
import { join, basename, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import { marked, Renderer } from 'marked';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT  = join(ROOT, 'gh-pages');

// ─── Marked: custom renderer adds slug IDs to every heading ──────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/<[^>]+>/g, '')        // strip inline HTML
    .replace(/[^a-z0-9\s-]/g, '')  // drop special chars
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

const renderer = new Renderer();
(renderer as any).heading = ({ text, depth }: { text: string; depth: number }) => {
  const id = slugify(text);
  return `<h${depth} id="${id}">${text}</h${depth}>\n`;
};
marked.use({ renderer });

function md(src: string): string {
  return marked.parse(src) as string;
}

// ─── Collect headings for sidebar from rendered HTML ─────────────────────────

interface Heading { level: number; text: string; id: string; }

function extractHeadings(html: string): Heading[] {
  const out: Heading[] = [];
  const re = /<h([23]) id="([^"]+)">([^<]*(?:<[^/][^>]*>[^<]*<\/[^>]+>)*[^<]*)<\/h[23]>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const rawText = m[3].replace(/<[^>]+>/g, '').trim();
    if (rawText) out.push({ level: parseInt(m[1]), text: rawText, id: m[2] });
  }
  return out;
}

// ─── Page shell ───────────────────────────────────────────────────────────────

function page(opts: {
  title: string;
  description: string;
  active: string;
  body: string;
}): string {
  const navItems = [
    { href: 'index.html',           label: 'Home',            id: 'home' },
    { href: 'getting-started.html', label: 'Getting Started', id: 'getting-started' },
    { href: 'cli.html',             label: 'CLI Reference',   id: 'cli' },
    { href: 'api.html',             label: 'API Docs',        id: 'api' },
  ];
  const nav = navItems.map(n =>
    `<a href="${n.href}" class="nav-link${n.id === opts.active ? ' active' : ''}">${n.label}</a>`
  ).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <meta name="description" content="${opts.description}"/>
  <title>${opts.title} — aimljs</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🤖</text></svg>"/>
  <link rel="stylesheet" href="style.css"/>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css"/>
</head>
<body>
  <header class="site-header">
    <div class="container header-inner">
      <a href="index.html" class="logo">🤖 aimljs</a>
      <nav class="site-nav">${nav}</nav>
      <a href="https://github.com/jesobreira/aimljs" class="gh-link" target="_blank" rel="noopener">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.1.1 1.7 1.1 1.7 1.1 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.4-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17 6.1 18 6.4 18 6.4c.6 1.6.2 2.7.1 3.1.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3"/>
        </svg>
        GitHub
      </a>
    </div>
  </header>

  <main class="site-main">${opts.body}</main>

  <footer class="site-footer">
    <div class="container">
      <p>Built with <strong>aimljs</strong> · MIT License ·
         <a href="https://github.com/jesobreira/aimljs">GitHub</a></p>
    </div>
  </footer>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('pre code').forEach(el => hljs.highlightElement(el));
      document.querySelectorAll('pre').forEach(pre => {
        const btn = document.createElement('button');
        btn.className = 'copy-btn'; btn.textContent = 'Copy';
        btn.onclick = () => {
          navigator.clipboard.writeText(pre.querySelector('code')?.textContent ?? '');
          btn.textContent = 'Copied!';
          setTimeout(() => btn.textContent = 'Copy', 1500);
        };
        pre.appendChild(btn);
      });
      // Active sidebar link on scroll
      const links = document.querySelectorAll('.sidebar-link[href^="#"]');
      if (links.length) {
        const obs = new IntersectionObserver(entries => {
          entries.forEach(e => {
            if (e.isIntersecting) {
              links.forEach(l => l.classList.remove('active'));
              const a = document.querySelector('.sidebar-link[href="#' + e.target.id + '"]');
              if (a) a.classList.add('active');
            }
          });
        }, { rootMargin: '-20% 0px -70% 0px' });
        document.querySelectorAll('[id]').forEach(el => obs.observe(el));
      }
    });
  </script>
</body>
</html>`;
}

// ─── CSS ──────────────────────────────────────────────────────────────────────

const CSS = `
/* ── Reset ──────────────────────────────────────────────────────────────── */
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0d1117;--bg2:#161b22;--bg3:#21262d;--bg4:#2d333b;
  --border:#30363d;--text:#e6edf3;--text-dim:#8b949e;--text-xs:#484f58;
  --accent:#10a37f;--accent2:#58a6ff;--red:#f85149;
  --font:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  --mono:'SF Mono','Fira Code','Cascadia Code',Consolas,monospace;
  --radius:8px;
}
html{scroll-behavior:smooth}
body{font-family:var(--font);background:var(--bg);color:var(--text);line-height:1.7;font-size:16px}
a{color:var(--accent2);text-decoration:none}
a:hover{text-decoration:underline}
::-webkit-scrollbar{width:6px;height:6px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:#30363d;border-radius:3px}

/* ── Layout ──────────────────────────────────────────────────────────────── */
.container{max-width:1100px;margin:0 auto;padding:0 24px}

/* ── Header ──────────────────────────────────────────────────────────────── */
.site-header{background:rgba(13,17,23,.92);border-bottom:1px solid var(--border);
  position:sticky;top:0;z-index:50;backdrop-filter:blur(12px)}
.header-inner{display:flex;align-items:center;gap:20px;height:60px}
.logo{font-size:17px;font-weight:700;color:var(--text);letter-spacing:-.3px}
.logo:hover{text-decoration:none;color:var(--accent)}
.site-nav{display:flex;gap:4px;flex:1}
.nav-link{font-size:14px;color:var(--text-dim);padding:5px 10px;border-radius:6px;
  transition:color .15s,background .15s}
.nav-link:hover{color:var(--text);background:var(--bg3);text-decoration:none}
.nav-link.active{color:var(--text);background:var(--bg3);font-weight:500}
.gh-link{display:flex;align-items:center;gap:6px;font-size:13.5px;color:var(--text-dim);
  padding:5px 10px;border:1px solid var(--border);border-radius:6px;transition:all .15s;white-space:nowrap}
.gh-link:hover{color:var(--text);border-color:var(--text-dim);text-decoration:none}

/* ── Hero ────────────────────────────────────────────────────────────────── */
.hero{padding:80px 0 64px;text-align:center;
  background:radial-gradient(ellipse 80% 50% at 50% -10%,rgba(16,163,127,.15),transparent)}
.hero-badge{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;
  text-transform:uppercase;letter-spacing:.08em;color:var(--accent);
  background:rgba(16,163,127,.12);border:1px solid rgba(16,163,127,.3);
  border-radius:20px;padding:4px 12px;margin-bottom:20px}
.hero-title{font-size:clamp(36px,6vw,64px);font-weight:800;line-height:1.1;
  letter-spacing:-1px;margin-bottom:16px}
.hero-title span{background:linear-gradient(135deg,#10a37f,#58a6ff);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.hero-sub{font-size:clamp(16px,2vw,20px);color:var(--text-dim);max-width:580px;
  margin:0 auto 36px}
.hero-actions{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
.btn{display:inline-flex;align-items:center;gap:8px;padding:10px 22px;
  border-radius:var(--radius);font-size:15px;font-weight:500;cursor:pointer;
  transition:all .15s;text-decoration:none}
.btn-primary{background:var(--accent);color:#fff}
.btn-primary:hover{background:#0d8c6e;text-decoration:none;color:#fff}
.btn-secondary{background:var(--bg3);color:var(--text);border:1px solid var(--border)}
.btn-secondary:hover{border-color:var(--text-dim);text-decoration:none}
.hero-install{margin-top:32px;background:var(--bg2);border:1px solid var(--border);
  border-radius:var(--radius);padding:14px 24px;display:inline-flex;align-items:center;
  gap:12px;font-family:var(--mono);font-size:15px}
.hero-install .prompt{color:var(--accent)}

/* ── Features ────────────────────────────────────────────────────────────── */
.features{padding:64px 0;border-top:1px solid var(--border)}
.section-title{font-size:clamp(22px,3vw,30px);font-weight:700;margin-bottom:8px;letter-spacing:-.5px}
.section-sub{color:var(--text-dim);margin-bottom:40px;font-size:16px}
.feature-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:16px}
.feature-card{background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius);
  padding:24px;transition:border-color .2s,transform .2s}
.feature-card:hover{border-color:rgba(88,166,255,.3);transform:translateY(-2px)}
.feature-icon{font-size:28px;margin-bottom:12px}
.feature-title{font-size:15px;font-weight:600;margin-bottom:6px}
.feature-desc{font-size:14px;color:var(--text-dim);line-height:1.6}

/* ── Showcase ────────────────────────────────────────────────────────────── */
.showcase{padding:64px 0;border-top:1px solid var(--border)}
.showcase-grid{display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center}
.showcase-text h2{font-size:clamp(22px,3vw,30px);font-weight:700;margin-bottom:12px;letter-spacing:-.5px}
.showcase-text p{color:var(--text-dim);font-size:15px;line-height:1.7;margin-bottom:20px}
.showcase-text ul{color:var(--text-dim);font-size:15px;padding-left:20px;line-height:2}
.showcase-text li::marker{color:var(--accent)}

/* ── Stats ───────────────────────────────────────────────────────────────── */
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:1px;
  background:var(--border);border:1px solid var(--border);border-radius:var(--radius);
  overflow:hidden;margin:64px 0}
.stat{background:var(--bg2);padding:28px;text-align:center}
.stat-num{font-size:32px;font-weight:800;color:var(--accent);line-height:1}
.stat-label{font-size:13px;color:var(--text-dim);margin-top:6px}

/* ── Prose ───────────────────────────────────────────────────────────────── */
.prose{max-width:860px;margin:0 auto;padding:48px 24px}
.prose h1{font-size:clamp(26px,4vw,40px);font-weight:800;letter-spacing:-.5px;
  margin:0 0 8px;padding-bottom:16px;border-bottom:1px solid var(--border)}
.prose h2{font-size:clamp(20px,2.5vw,26px);font-weight:700;margin:48px 0 14px;
  padding-bottom:8px;border-bottom:1px solid var(--border);letter-spacing:-.3px}
.prose h3{font-size:18px;font-weight:600;margin:32px 0 12px}
.prose h4{font-size:15px;font-weight:600;margin:20px 0 8px;color:var(--text-dim)}
.prose p{margin:0 0 16px}
.prose ul,.prose ol{margin:0 0 16px;padding-left:24px}
.prose li{margin-bottom:6px}
.prose li::marker{color:var(--accent)}
.prose strong{font-weight:600}
.prose code{font-family:var(--mono);font-size:.85em;background:var(--bg3);
  border:1px solid var(--border);border-radius:4px;padding:2px 6px;color:#79c0ff}
.prose pre{background:#0d1117;border:1px solid var(--border);border-radius:var(--radius);
  padding:20px;overflow-x:auto;margin:0 0 24px;position:relative}
.prose pre code{background:none;border:none;padding:0;font-size:13.5px;color:inherit}
.prose table{width:100%;border-collapse:collapse;margin:0 0 24px;font-size:14.5px}
.prose th{background:var(--bg3);padding:10px 14px;text-align:left;
  font-weight:600;border:1px solid var(--border)}
.prose td{padding:10px 14px;border:1px solid var(--border);color:var(--text-dim)}
.prose tr:nth-child(even) td{background:rgba(255,255,255,.02)}
.prose blockquote{border-left:3px solid var(--accent);padding:12px 20px;margin:0 0 24px;
  background:rgba(16,163,127,.06);border-radius:0 var(--radius) var(--radius) 0}
.prose blockquote p{margin:0;color:var(--text-dim);font-style:italic}
.prose hr{border:none;border-top:1px solid var(--border);margin:40px 0}
.prose img{border-radius:var(--radius);border:1px solid var(--border)}

/* ── Docs layout (two-column) ────────────────────────────────────────────── */
.docs-layout{display:grid;grid-template-columns:240px 1fr;min-height:calc(100vh - 120px)}
.docs-sidebar{border-right:1px solid var(--border);position:sticky;top:60px;
  height:calc(100vh - 60px);overflow-y:auto;padding:16px 0}
.sidebar-group{margin-bottom:4px}
.sidebar-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;
  color:var(--text-xs);padding:12px 16px 4px;display:block}
.sidebar-link{display:block;font-size:13px;color:var(--text-dim);
  padding:5px 16px;border-radius:0;transition:color .12s,background .12s;
  border-left:2px solid transparent;margin:0}
.sidebar-link:hover{color:var(--text);background:rgba(255,255,255,.04);text-decoration:none}
.sidebar-link.active{color:var(--accent2);background:rgba(88,166,255,.07);
  border-left-color:var(--accent2)}
.sidebar-link.h3{padding-left:28px;font-size:12.5px}
.docs-content{min-width:0}
.docs-content .prose{max-width:none;padding:40px 52px 60px}

/* ── Copy button ─────────────────────────────────────────────────────────── */
pre{position:relative}
.copy-btn{position:absolute;top:10px;right:10px;background:var(--bg4);
  border:1px solid var(--border);color:var(--text-dim);font-size:11px;
  padding:3px 10px;border-radius:5px;cursor:pointer;font-family:var(--font);
  transition:all .15s;opacity:0;pointer-events:none}
pre:hover .copy-btn{opacity:1;pointer-events:auto}
.copy-btn:hover{color:var(--text);border-color:var(--text-dim)}

/* ── Footer ──────────────────────────────────────────────────────────────── */
.site-main{min-height:calc(100vh - 120px)}
.site-footer{border-top:1px solid var(--border);padding:28px 0;
  text-align:center;color:var(--text-dim);font-size:13.5px}
.site-footer a{color:var(--text-dim)}
.site-footer a:hover{color:var(--text)}

/* ── Responsive ──────────────────────────────────────────────────────────── */
@media(max-width:800px){
  .showcase-grid{grid-template-columns:1fr}
  .docs-layout{grid-template-columns:1fr}
  .docs-sidebar{display:none}
  .docs-content .prose{padding:24px}
}
@media(max-width:600px){
  .site-nav{display:none}
  .hero-actions{flex-direction:column;align-items:center}
}
`.trim();

// ─── Individual page builders ─────────────────────────────────────────────────

function buildIndex(): string {
  const features = [
    { icon:'📄', title:'AIML 1.0 & 2.0', desc:'All standard tags for both versions — wildcards, conditions, transforms, triple store, and more.' },
    { icon:'🌐', title:'Isomorphic', desc:'Node.js ≥ 18 and modern browsers. ESM + CJS dual build with zero mandatory runtime deps.' },
    { icon:'💾', title:'Sessions', desc:'Per-user predicates, history, topics, and AIML 2.0 triple store with full serialisation.' },
    { icon:'✅', title:'Validation CLI', desc:'aiml-validate lints AIML files before deployment — exits 1 on errors, ideal for CI.' },
    { icon:'🤖', title:'ChatGPT API', desc:'aiml-serve exposes any bot as a ChatGPT-compatible REST API with streaming and Swagger UI.' },
    { icon:'🗺', title:'Data Formats', desc:'Properties, substitutions, sets, maps — text, JSON, or Pandorabots array-of-arrays format.' },
    { icon:'🔒', title:'Opt-in Features', desc:'&lt;system&gt; and &lt;javascript&gt; tags are disabled by default; enable them per-bot for trusted AIML.' },
    { icon:'📚', title:'Full docs', desc:'JSDoc on every public symbol, auto-generated API reference, and real-world examples.' },
  ].map(f => `<div class="feature-card">
    <div class="feature-icon">${f.icon}</div>
    <div class="feature-title">${f.title}</div>
    <div class="feature-desc">${f.desc}</div>
  </div>`).join('');

  const code = `<pre><code class="language-typescript">import { AIML2Bot } from 'aimljs';

const bot = new AIML2Bot({
  properties: { name: 'Alice' },
  maps: { capitals: { france: 'Paris' } },
  maxRecursionDepth: 200,
});

await bot.loadDirectory('./aiml');

// Single-turn
const { response, sessionId } = await bot.talk('hello');

// Multi-turn — predicates persist per session
await bot.talk('my name is Bob', sessionId);
const r = await bot.talk('what is my name?', sessionId);
console.log(r.response); // "Your name is Bob."

// Serialise → store → restore
const saved = bot.serializeSession(sessionId);
const id    = bot.loadSerializedSession(saved);</code></pre>`;

  const body = `
<section class="hero">
  <div class="container">
    <div class="hero-badge">🤖 TypeScript · AIML 1.0 + 2.0</div>
    <h1 class="hero-title">Build chatbots with<br/><span>AIML in TypeScript</span></h1>
    <p class="hero-sub">Full-featured AIML parser, validator, and runtime — Node.js and the browser.</p>
    <div class="hero-actions">
      <a href="getting-started.html" class="btn btn-primary">Get Started →</a>
      <a href="cli.html"             class="btn btn-secondary">CLI Reference</a>
      <a href="api.html"             class="btn btn-secondary">API Docs</a>
      <a href="https://github.com/jesobreira/aimljs" class="btn btn-secondary" target="_blank">GitHub</a>
    </div>
    <div class="hero-install"><span class="prompt">$</span><code>npm install aimljs</code></div>
  </div>
</section>

<section class="features">
  <div class="container">
    <h2 class="section-title">Everything you need</h2>
    <p class="section-sub">From file parsing to a production-ready API server.</p>
    <div class="feature-grid">${features}</div>
  </div>
</section>

<section class="showcase">
  <div class="container">
    <div class="showcase-grid">
      <div class="showcase-text">
        <h2>Simple, powerful API</h2>
        <p>Load any AIML knowledge base and start chatting in a few lines. Sessions persist predicates, history, and topics across turns.</p>
        <ul>
          <li>Auto-detects AIML 1.0 / 2.0 per file</li>
          <li>Load from disk, File API, or inline string</li>
          <li>Pandorabots data formats supported</li>
          <li>Drop-in ChatGPT API with <code>aiml-serve</code></li>
        </ul>
        <a href="getting-started.html" class="btn btn-primary" style="margin-top:8px">Read the docs →</a>
      </div>
      <div>${code}</div>
    </div>
  </div>
</section>

<div class="container">
  <div class="stats">
    <div class="stat"><div class="stat-num">2</div><div class="stat-label">AIML versions</div></div>
    <div class="stat"><div class="stat-num">50+</div><div class="stat-label">Template tags</div></div>
    <div class="stat"><div class="stat-num">151</div><div class="stat-label">Unit tests</div></div>
    <div class="stat"><div class="stat-num">20K+</div><div class="stat-label">Categories (Rosie+Free)</div></div>
  </div>
</div>`;

  return page({ title:'Home', description:'Full-featured AIML 1.0/2.0 library for TypeScript.', active:'home', body });
}

async function buildGettingStarted(): Promise<string> {
  let src = await readFile(join(ROOT, 'README.md'), 'utf-8');
  src = src.replace(/^#[^\n]*\n/, ''); // drop top-level H1 (we title the page differently)
  const html = md(src);
  return page({
    title: 'Getting Started',
    description: 'Install aimljs and build your first AIML chatbot.',
    active: 'getting-started',
    body: `<div class="prose">${html}</div>`,
  });
}

async function buildCli(): Promise<string> {
  const src = `# CLI Reference

aimljs ships two command-line tools.

---

## aiml-validate

Validate AIML files for syntax errors before loading them into your bot.

### Install

\`\`\`bash
npm install -g aimljs          # global
npx aimljs aiml-validate ...  # one-off, no install
\`\`\`

### Usage

\`\`\`
aiml-validate [options] <file|directory> [...]

Options:
  -r, --recursive    Recurse into subdirectories
  -s, --stats        Show per-file category count and parse time
  -q, --quiet        Only print errors (suppress warnings)
  --json             Output results as JSON (for CI pipelines)
  -v, --version      Show version
  -h, --help         Show help
\`\`\`

### Examples

\`\`\`bash
aiml-validate greetings.aiml
aiml-validate ./alice/
aiml-validate -r --stats ./knowledge-base/
aiml-validate --json -r ./aiml/ > report.json   # exits 1 on errors
\`\`\`

### Sample output

\`\`\`
✓ greetings.aiml   (42 categories, 8ms)
✓ personality.aiml (318 categories, 22ms)
✗ broken.aiml
  ✗ error   <category> missing <template> [category]

Results: 3 files checked
  360 categories loaded
  2 valid
  1 with errors (1 total)
\`\`\`

---

## aiml-serve

Expose any AIML bot as a **ChatGPT-compatible REST API** with a Swagger UI.

### Install

\`\`\`bash
npm install -g aimljs
\`\`\`

### Usage

\`\`\`
aiml-serve [options] [file|directory ...]

Options:
  -p, --port <n>       Port (default: 8080)
  -m, --model <name>   Model name in API responses (default: aiml-bot-1)
  --api-key <key>      Require Bearer token in Authorization header
  --v2                 Force AIML 2.0 parser
  --rosie              Load bundled Rosie 2.0 bot (needs dev/rosie/)
  --freeaiml           Load bundled Free-AIML bot (needs dev/freeaiml/)
  -h, --help           Show help
\`\`\`

### Examples

\`\`\`bash
aiml-serve --port 8080 ./alice/
aiml-serve --api-key mysecret ./alice/
aiml-serve --model alice-v1 --rosie --freeaiml
\`\`\`

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| \`GET\`  | \`/\`                      | API info |
| \`GET\`  | \`/v1/models\`             | List models |
| \`POST\` | \`/v1/chat/completions\`   | Chat — ChatGPT-compatible |
| \`GET\`  | \`/docs\`                  | Swagger UI |
| \`GET\`  | \`/openapi.json\`          | OpenAPI 3.0 spec |

### Request / response

\`\`\`bash
curl http://localhost:8080/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -d '{"messages":[{"role":"user","content":"hello"}],"user":"alice"}'
\`\`\`

\`\`\`json
{
  "id": "chatcmpl-aimljs-4s49pq3j",
  "object": "chat.completion",
  "created": 1700000000,
  "model": "aiml-bot-1",
  "choices": [{
    "index": 0,
    "message": { "role": "assistant", "content": "Hi there!" },
    "finish_reason": "stop"
  }],
  "usage": { "prompt_tokens": 3, "completion_tokens": 3, "total_tokens": 6 }
}
\`\`\`

### Streaming

Pass \`"stream": true\` to receive SSE word-by-word — works with any ChatGPT-compatible client:

\`\`\`bash
curl http://localhost:8080/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -d '{"messages":[{"role":"user","content":"hello"}],"stream":true}'
\`\`\`

### Use with the OpenAI SDK

\`\`\`typescript
import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'http://localhost:8080/v1',
  apiKey: 'none',  // or your --api-key value
});

const res = await client.chat.completions.create({
  model: 'aiml-bot-1',
  messages: [{ role: 'user', content: 'hello' }],
  user: 'my-session',  // session ID — bot remembers predicates
});
console.log(res.choices[0].message.content);
\`\`\`

### Session management

The \`user\` field is used as the **session ID**. Conversations with the same \`user\` value share predicate state — the bot remembers names, topics, etc. across requests.

---

## Opt-in features

Two template tags are **disabled by default** for security. Enable them explicitly per bot:

### \`<system>\` — shell execution (Node.js only)

Runs a shell command and inserts stdout into the response.

\`\`\`typescript
const bot = new AIML1Bot({ enableSystem: true });
\`\`\`

\`\`\`xml
<category>
  <pattern>WHAT TIME IS IT</pattern>
  <template>The time is <system>date +%H:%M:%S</system>.</template>
</category>
\`\`\`

> ⚠️ Only enable for AIML files you fully trust. Disabling it (the default)
> causes \`<system>\` to produce empty output rather than throwing.

### \`<javascript>\` — inline JS

Evaluates a JS expression with \`new Function()\` and returns the result as a string.

\`\`\`typescript
const bot = new AIML1Bot({ enableJavaScript: true });
\`\`\`

\`\`\`xml
<category>
  <pattern>CALCULATE *</pattern>
  <template><javascript>
    var expr = '<star/>';
    if (/^[0-9+\\-*/.() ]+$/.test(expr)) return String(eval(expr));
    return 'Invalid expression.';
  </javascript></template>
</category>
\`\`\`

### \`<gossip>\` — silent logging via subclass

\`<gossip>\` fires \`handleGossip(text)\` without producing any output. Override it by subclassing:

\`\`\`typescript
class LoggingBot extends AIML1Bot {
  protected handleGossip(text: string): void {
    console.log('[gossip]', text);
  }
}
\`\`\`
`;

  const html = md(src);
  const headings = extractHeadings(html);
  const sidebarLinks = headings.map(h =>
    `<a href="#${h.id}" class="sidebar-link${h.level === 3 ? ' h3' : ''}">${h.text}</a>`
  ).join('');

  return page({
    title: 'CLI Reference',
    description: 'aiml-validate and aiml-serve CLI tools for aimljs.',
    active: 'cli',
    body: `
<div class="docs-layout">
  <aside class="docs-sidebar">
    <div class="sidebar-group">
      <span class="sidebar-label">Tools</span>
      ${sidebarLinks}
    </div>
  </aside>
  <div class="docs-content"><div class="prose">${html}</div></div>
</div>`,
  });
}

async function buildApi(): Promise<string> {
  // Collect all class docs in preferred order
  const classOrder = ['AIMLBot', 'AIML1Bot', 'AIML2Bot', 'Session', 'PatternMatcher', 'Normalizer'];
  const docsDir = join(ROOT, 'docs');
  const parts: string[] = [];

  // Start with globals index (filtered)
  try {
    const raw = await readFile(join(docsDir, 'globals.md'), 'utf-8');
    // Drop the top breadcrumb line and render
    const clean = raw.replace(/^\[.*?\]\(.*?\)\n+\*+\n+/m, '');
    parts.push(md(clean));
  } catch {}

  // Append each class page
  for (const cls of classOrder) {
    try {
      const raw = await readFile(join(docsDir, 'classes', `${cls}.md`), 'utf-8');
      const clean = raw.replace(/^\[.*?\]\(.*?\)\n+\*+\n+/m, '');
      parts.push(`<hr/>\n${md(clean)}`);
    } catch {}
  }

  const content = parts.length > 0 ? parts.join('\n') : md(`
# API Reference

Run \`npm run docs\` then \`npm run build:docs\` to populate this page.

## Classes

| Class | Description |
|---|---|
| \`AIMLBot\` | Base bot — loading, sessions, talk |
| \`AIML1Bot\` | AIML 1.0 with data-file helpers |
| \`AIML2Bot\` | AIML 2.0 with maps, triples, sraix |
| \`Session\` | Per-user conversation state |
| \`PatternMatcher\` | Low-level pattern engine |
| \`Normalizer\` | Text normalisation & substitution |
`);

  const headings = extractHeadings(content);
  const sidebarLinks = headings.slice(0, 60).map(h =>
    `<a href="#${h.id}" class="sidebar-link${h.level === 3 ? ' h3' : ''}">${h.text}</a>`
  ).join('');

  return page({
    title: 'API Reference',
    description: 'Full API reference for aimljs classes, methods, and types.',
    active: 'api',
    body: `
<div class="docs-layout">
  <aside class="docs-sidebar">
    <div class="sidebar-group">
      <span class="sidebar-label">API Reference</span>
      ${sidebarLinks || '<span class="sidebar-link" style="color:var(--text-xs);cursor:default">Run npm run docs first</span>'}
    </div>
  </aside>
  <div class="docs-content"><div class="prose">${content}</div></div>
</div>`,
  });
}

// ─── Build ────────────────────────────────────────────────────────────────────

async function build() {
  await mkdir(OUT, { recursive: true });

  await writeFile(join(OUT, 'style.css'), CSS);
  console.log('  ✓ style.css');

  const pages: Array<[string, string | Promise<string>]> = [
    ['index.html',           buildIndex()],
    ['getting-started.html', buildGettingStarted()],
    ['cli.html',             buildCli()],
    ['api.html',             buildApi()],
  ];

  for (const [name, src] of pages) {
    await writeFile(join(OUT, name), await src);
    console.log(`  ✓ ${name}`);
  }

  await writeFile(join(OUT, '.nojekyll'), '');
  console.log('\n✅ Site built →', OUT, '\n');
}

console.log('\n📚 Building documentation site…\n');
build().catch(err => { console.error(err); process.exit(1); });
