#!/usr/bin/env node
/**
 * aiml-serve — Expose an AIML bot as a ChatGPT-compatible REST API
 *
 * Usage:
 *   aiml-serve ./alice/          # load directory
 *   aiml-serve greetings.aiml personality.aiml
 *   aiml-serve --rosie --freeaiml
 *   aiml-serve --port 8080 --model my-bot --api-key secret ./aiml/
 *
 * Endpoints (ChatGPT-compatible):
 *   GET  /                       → API info
 *   GET  /v1/models              → list available models
 *   POST /v1/chat/completions    → chat (non-streaming and streaming)
 *   GET  /docs                   → Swagger UI
 *   GET  /openapi.json           → OpenAPI 3.0 spec
 */

import { createServer, type IncomingMessage, type ServerResponse } from 'http';
import { readFile, stat, readdir } from 'fs/promises';
import { extname, basename, join, resolve } from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { AIML1Bot, AIML2Bot, parseProperties, parseSubstitutions, parseSet, parseMap } from '../src/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require    = createRequire(import.meta.url);

// ─── ANSI ─────────────────────────────────────────────────────────────────────
const T = process.stdout.isTTY;
const c = { reset: T?'\x1b[0m':'', bold: T?'\x1b[1m':'', dim: T?'\x1b[2m':'',
            green: T?'\x1b[32m':'', cyan: T?'\x1b[36m':'', yellow: T?'\x1b[33m':'',
            red: T?'\x1b[31m':'', blue: T?'\x1b[34m':'' };

// ─── Arg parsing ──────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);

if (argv.includes('-h') || argv.includes('--help')) {
  console.log(`
${c.bold}aiml-serve${c.reset} — ChatGPT-compatible AIML API server

${c.bold}Usage:${c.reset}
  aiml-serve [options] [file|directory ...]

${c.bold}Options:${c.reset}
  -p, --port <n>       Port (default: 8080)
  -m, --model <name>   Model name in responses (default: aiml-bot-1)
  --api-key <key>      Require Bearer token in Authorization header
  --v2                 Use AIML 2.0 parser (default: auto-detect)
  --rosie              Load bundled Rosie 2.0 bot (needs dev/rosie/)
  --freeaiml           Load bundled Free-AIML 1.0 bot (needs dev/freeaiml/)
  -h, --help           Show this help
  -v, --version        Show version

${c.bold}Endpoints:${c.reset}
  GET  /                    API info
  GET  /v1/models           List models
  POST /v1/chat/completions Chat completions (stream supported)
  GET  /docs                Swagger UI
  GET  /openapi.json        OpenAPI 3.0 spec
`);
  process.exit(0);
}

if (argv.includes('-v') || argv.includes('--version')) {
  console.log(require('../package.json').version);
  process.exit(0);
}

function getArg(flag: string): string | undefined {
  const i = argv.indexOf(flag);
  return i !== -1 ? argv[i + 1] : undefined;
}

const PORT     = parseInt(getArg('-p') ?? getArg('--port') ?? '8080', 10);
const MODEL    = getArg('-m') ?? getArg('--model') ?? 'aiml-bot-1';
const API_KEY  = getArg('--api-key');
const USE_V2   = argv.includes('--v2');
const ROSIE    = argv.includes('--rosie');
const FREEAIML = argv.includes('--freeaiml');
const paths    = argv.filter(a => !a.startsWith('-') && a !== getArg('-p') && a !== getArg('--port')
                                   && a !== getArg('-m') && a !== getArg('--model')
                                   && a !== getArg('--api-key'));

// ─── Bot setup ────────────────────────────────────────────────────────────────
async function collectAimlFiles(target: string): Promise<string[]> {
  const s = await stat(target).catch(() => null);
  if (!s) return [];
  if (s.isFile()) return extname(target).toLowerCase() === '.aiml' ? [target] : [];
  const entries = await readdir(target, { withFileTypes: true });
  const results: string[] = [];
  for (const e of entries) {
    const full = join(target, e.name);
    if (e.isFile() && extname(e.name).toLowerCase() === '.aiml') results.push(full);
    else if (e.isDirectory()) results.push(...await collectAimlFiles(full));
  }
  return results;
}

async function loadDir(dir: string) {
  const r: Array<{name:string;content:string}> = [];
  try {
    for (const e of await readdir(dir, {withFileTypes:true})) {
      if (!e.isFile()) continue;
      r.push({ name: basename(e.name, extname(e.name)), content: await readFile(join(dir,e.name),'utf-8') });
    }
  } catch {}
  return r;
}

console.log(`\n${c.bold}aiml-serve${c.reset}  — ChatGPT-compatible AIML API\n`);

const bot = (USE_V2 || ROSIE) ? new AIML2Bot({ maxRecursionDepth: 200 }) : new AIML1Bot();

if (ROSIE) {
  const ROOT = resolve(__dirname, '../dev/rosie');
  for (const {content} of await loadDir(join(ROOT,'system')))
    bot.loadProperties(parseProperties(content));
  const subTypes: any = {normal:'normal',person:'person',person2:'person2',gender:'gender',denormal:'denormal'};
  for (const {name,content} of await loadDir(join(ROOT,'substitutions'))) {
    const t = subTypes[name.toLowerCase()]; if (t) bot.loadSubstitutions(t, parseSubstitutions(content));
  }
  for (const {name,content} of await loadDir(join(ROOT,'sets')))  bot.loadSet(name, parseSet(content));
  for (const {name,content} of await loadDir(join(ROOT,'maps')))  bot.loadMap(name, parseMap(content));
  // synthesise missing number/successor/predecessor
  const maps = (bot as any).maps as Map<string,Map<string,string>>;
  const n2n = maps.get('number2name'), nm2n = maps.get('name2number');
  const numSet = new Set<string>();
  if (n2n) for (const k of n2n.keys()) numSet.add(k);
  if (nm2n) for (const k of nm2n.keys()) numSet.add(k);
  if (numSet.size) bot.loadSet('number', numSet);
  if (n2n) {
    const nums = [...n2n.keys()].map(Number).filter(n=>!isNaN(n)).sort((a,b)=>a-b);
    const succ = new Map<string,string>(), pred = new Map<string,string>();
    for (const n of nums) { succ.set(String(n),String(n+1)); if(n>0) pred.set(String(n),String(n-1)); }
    bot.loadMap('successor',succ); bot.loadMap('predecessor',pred);
  }
  await bot.loadDirectory(join(ROOT,'aiml'), false, ['.aiml']);
  console.log(`  ${c.green}✓${c.reset} Rosie loaded`);
}

if (FREEAIML) {
  const FREE = resolve(__dirname, '../dev/freeaiml');
  await bot.loadDirectory(FREE, false, ['.aiml']);
  console.log(`  ${c.green}✓${c.reset} Free-AIML loaded`);
}

for (const p of paths) {
  process.stdout.write(`  Loading ${c.dim}${p}${c.reset}… `);
  const files = await collectAimlFiles(resolve(p));
  for (const f of files) {
    const content = await readFile(f, 'utf-8');
    await bot.loadXMLString(content, f);
  }
  console.log(`${c.green}${files.length} files${c.reset}`);
}

if (bot.categoryCount === 0 && !ROSIE && !FREEAIML && paths.length === 0) {
  console.error(`${c.yellow}Warning:${c.reset} No AIML files loaded. Pass file paths, --rosie, or --freeaiml.`);
}

console.log(`  ${c.cyan}${bot.categoryCount.toLocaleString()}${c.reset} categories ready\n`);

// ─── OpenAPI spec ─────────────────────────────────────────────────────────────
const OPENAPI = {
  openapi: '3.0.3',
  info: {
    title: 'AIML Bot API',
    description: 'ChatGPT-compatible API powered by **aimljs**.\n\nUse this API as a drop-in replacement for the OpenAI Chat Completions API.',
    version: require('../package.json').version,
    contact: { url: 'https://github.com/jesobreira/aimljs' },
  },
  servers: [{ url: `http://localhost:${PORT}`, description: 'Local server' }],
  ...(API_KEY ? {
    components: { securitySchemes: { BearerAuth: { type:'http', scheme:'bearer' } } },
    security: [{ BearerAuth:[] }],
  } : {}),
  paths: {
    '/v1/models': {
      get: {
        operationId: 'listModels',
        summary: 'List models',
        description: 'Returns the list of available AIML bot models.',
        tags: ['Models'],
        responses: {
          '200': {
            description: 'List of models',
            content: { 'application/json': { schema: {
              type:'object',
              properties: {
                object: { type:'string', example:'list' },
                data:   { type:'array', items: { $ref:'#/components/schemas/Model' } },
              },
            }}},
          },
        },
      },
    },
    '/v1/chat/completions': {
      post: {
        operationId: 'createChatCompletion',
        summary: 'Create chat completion',
        description: 'Send messages to the AIML bot and receive a response.\n\nBehaves like the OpenAI Chat Completions API — the last `user` message is sent to the bot. Previous messages are replayed to rebuild conversation context.\n\nSet `stream: true` to receive a Server-Sent Events stream.',
        tags: ['Chat'],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref:'#/components/schemas/ChatCompletionRequest' } } },
        },
        responses: {
          '200': {
            description: 'Chat completion response (or SSE stream if `stream: true`)',
            content: {
              'application/json': { schema: { $ref:'#/components/schemas/ChatCompletionResponse' } },
              'text/event-stream': { schema: { type:'string', description:'SSE chunks, one per line' } },
            },
          },
          '400': { description:'Bad request' },
          '401': { description:'Unauthorized — invalid or missing API key' },
        },
      },
    },
  },
  components: {
    schemas: {
      Model: {
        type:'object',
        properties: {
          id:       { type:'string', example: MODEL },
          object:   { type:'string', example:'model' },
          created:  { type:'integer', example: 1700000000 },
          owned_by: { type:'string', example:'aimljs' },
        },
      },
      ChatMessage: {
        type:'object',
        required: ['role','content'],
        properties: {
          role:    { type:'string', enum:['system','user','assistant'], description:'`system` sets bot properties; `user` is the human turn; `assistant` is a previous bot reply.' },
          content: { type:'string', example:'Hello!' },
          name:    { type:'string', description:'Optional speaker name / session namespace.' },
        },
      },
      ChatCompletionRequest: {
        type:'object',
        required: ['messages'],
        properties: {
          model:       { type:'string', example: MODEL, description:'Ignored — present for API compatibility.' },
          messages:    { type:'array', items:{ $ref:'#/components/schemas/ChatMessage' }, minItems:1 },
          stream:      { type:'boolean', default:false, description:'Stream the response as SSE.' },
          user:        { type:'string', description:'Session identifier. Conversations with the same `user` share predicate state.' },
          temperature: { type:'number', description:'Ignored — present for API compatibility.' },
          max_tokens:  { type:'integer', description:'Ignored — present for API compatibility.' },
        },
      },
      ChatCompletionChoice: {
        type:'object',
        properties: {
          index:         { type:'integer', example:0 },
          message:       { $ref:'#/components/schemas/ChatMessage' },
          finish_reason: { type:'string', example:'stop' },
        },
      },
      ChatCompletionUsage: {
        type:'object',
        properties: {
          prompt_tokens:     { type:'integer' },
          completion_tokens: { type:'integer' },
          total_tokens:      { type:'integer' },
        },
      },
      ChatCompletionResponse: {
        type:'object',
        properties: {
          id:      { type:'string', example:'chatcmpl-aimljs-abc123' },
          object:  { type:'string', example:'chat.completion' },
          created: { type:'integer', example:1700000000 },
          model:   { type:'string', example: MODEL },
          choices: { type:'array', items:{ $ref:'#/components/schemas/ChatCompletionChoice' } },
          usage:   { $ref:'#/components/schemas/ChatCompletionUsage' },
        },
      },
    },
  },
  tags: [
    { name:'Chat',   description:'Core chat endpoint — ChatGPT-compatible' },
    { name:'Models', description:'Model discovery' },
  ],
};

// ─── Swagger UI HTML ──────────────────────────────────────────────────────────
const SWAGGER_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>AIML Bot API — Swagger UI</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css"/>
  <style>
    body { margin:0; background:#1a1a1a; }
    .swagger-ui .topbar { background:#111; }
    .swagger-ui .topbar .download-url-wrapper { display:none; }
    .swagger-ui .info .title { color:#10a37f; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: '/openapi.json',
      dom_id: '#swagger-ui',
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
      layout: 'BaseLayout',
      deepLinking: true,
      defaultModelsExpandDepth: 2,
      tryItOutEnabled: true,
    });
  </script>
</body>
</html>`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function json(res: ServerResponse, data: unknown, status = 200) {
  const body = JSON.stringify(data);
  res.writeHead(status, { 'Content-Type':'application/json', 'Access-Control-Allow-Origin':'*' });
  res.end(body);
}

function countTokens(text: string): number {
  // rough approximation: ~4 chars per token
  return Math.ceil(text.length / 4);
}

function newCompletionId(): string {
  return `chatcmpl-aimljs-${Math.random().toString(36).slice(2,10)}`;
}

// ─── Request handler ──────────────────────────────────────────────────────────
async function handleRequest(req: IncomingMessage, res: ServerResponse) {
  const url  = req.url?.split('?')[0] ?? '/';
  const method = req.method ?? 'GET';

  // CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    return res.end();
  }

  // API key check
  if (API_KEY) {
    const auth = req.headers['authorization'] ?? '';
    const provided = auth.startsWith('Bearer ') ? auth.slice(7) : auth;
    if (provided !== API_KEY) {
      return json(res, { error: { message:'Invalid API key', type:'invalid_request_error', code:'invalid_api_key' } }, 401);
    }
  }

  // GET /
  if (url === '/' && method === 'GET') {
    return json(res, {
      name: 'AIML Bot API',
      version: require('../package.json').version,
      model: MODEL,
      categories: bot.categoryCount,
      docs: `http://localhost:${PORT}/docs`,
      openapi: `http://localhost:${PORT}/openapi.json`,
    });
  }

  // GET /openapi.json
  if (url === '/openapi.json' && method === 'GET') {
    res.writeHead(200, { 'Content-Type':'application/json', 'Access-Control-Allow-Origin':'*' });
    return res.end(JSON.stringify(OPENAPI, null, 2));
  }

  // GET /docs
  if ((url === '/docs' || url === '/docs/') && method === 'GET') {
    res.writeHead(200, { 'Content-Type':'text/html' });
    return res.end(SWAGGER_HTML);
  }

  // GET /v1/models
  if (url === '/v1/models' && method === 'GET') {
    return json(res, {
      object: 'list',
      data: [{
        id: MODEL, object:'model',
        created: Math.floor(Date.now() / 1000),
        owned_by: 'aimljs',
      }],
    });
  }

  // POST /v1/chat/completions
  if (url === '/v1/chat/completions' && method === 'POST') {
    let body = '';
    for await (const chunk of req) body += chunk;

    let parsed: any;
    try { parsed = JSON.parse(body); }
    catch { return json(res, { error:{ message:'Invalid JSON', type:'invalid_request_error' } }, 400); }

    const { messages, stream = false, user } = parsed as {
      messages?: Array<{role:string;content:string;name?:string}>;
      stream?: boolean;
      user?: string;
    };

    if (!Array.isArray(messages) || messages.length === 0) {
      return json(res, { error:{ message:'messages is required and must be non-empty', type:'invalid_request_error' } }, 400);
    }

    // Session ID: use `user` field, else derive from request (each request gets a unique session
    // so previous assistant messages in the payload are replayed manually)
    const sessionId = user ?? `req-${newCompletionId()}`;

    // Apply system messages as bot property overrides
    for (const msg of messages) {
      if (msg.role === 'system') {
        // System messages can override bot name/properties
        // e.g. "You are Alice, a helpful assistant"
        const nameMatch = msg.content.match(/you are ([A-Za-z]+)/i);
        if (nameMatch) bot.setProperty('name', nameMatch[1]);
      }
    }

    // Replay prior assistant/user turns into the session so predicates are rebuilt
    // This makes the API stateless from the caller's perspective
    const session = bot.getOrCreateSession(sessionId);
    const alreadyReplayed = session.getHistory().length;
    const priorTurns: Array<{user:string;assistant:string}> = [];

    let pendingUser: string | null = null;
    for (const msg of messages.slice(0, -1)) { // all except last
      if (msg.role === 'user') pendingUser = msg.content;
      else if (msg.role === 'assistant' && pendingUser !== null) {
        priorTurns.push({ user: pendingUser, assistant: msg.content });
        pendingUser = null;
      }
    }

    // Only replay turns we haven't seen before
    for (const turn of priorTurns.slice(alreadyReplayed)) {
      // Add turn directly without running through the bot (avoids double processing)
      session.addTurn(turn.user, turn.assistant);
    }

    // Find last user message
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUser) {
      return json(res, { error:{ message:'No user message found', type:'invalid_request_error' } }, 400);
    }

    const userText = lastUser.content;
    const promptTokens = messages.reduce((s, m) => s + countTokens(m.content), 0);

    // Process through bot
    const response = await bot.talkSession(userText, session);
    const finalResponse = response || "(I don't have an answer for that.)";
    const completionTokens = countTokens(finalResponse);
    const id = newCompletionId();
    const created = Math.floor(Date.now() / 1000);

    if (stream) {
      // Server-Sent Events streaming
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });

      const chunkData = (content: string, finishReason: string | null = null) => ({
        id, object:'chat.completion.chunk', created, model: MODEL,
        choices: [{ index:0, delta: content ? { role:'assistant', content } : {}, finish_reason: finishReason }],
      });

      // Stream word by word for a natural feel
      const words = finalResponse.split(' ');
      for (let i = 0; i < words.length; i++) {
        const chunk = (i === 0 ? words[i] : ' ' + words[i]);
        res.write(`data: ${JSON.stringify(chunkData(chunk))}\n\n`);
        await new Promise(r => setTimeout(r, 15)); // small delay for streaming effect
      }

      res.write(`data: ${JSON.stringify(chunkData('', 'stop'))}\n\n`);
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    // Standard JSON response
    return json(res, {
      id, object: 'chat.completion', created, model: MODEL,
      choices: [{
        index: 0,
        message: { role:'assistant', content: finalResponse },
        finish_reason: 'stop',
      }],
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: promptTokens + completionTokens,
      },
    });
  }

  // 404
  json(res, { error:{ message:`Cannot ${method} ${url}`, type:'invalid_request_error' } }, 404);
}

// ─── Server ───────────────────────────────────────────────────────────────────
const server = createServer(async (req, res) => {
  try { await handleRequest(req, res); }
  catch (err) {
    console.error('Request error:', err);
    json(res, { error:{ message:'Internal server error', type:'server_error' } }, 500);
  }
});

server.listen(PORT, () => {
  console.log(`${c.green}${c.bold}Server running${c.reset}\n`);
  console.log(`  API    ${c.cyan}http://localhost:${PORT}/v1/chat/completions${c.reset}`);
  console.log(`  Models ${c.cyan}http://localhost:${PORT}/v1/models${c.reset}`);
  console.log(`  Docs   ${c.cyan}http://localhost:${PORT}/docs${c.reset}`);
  if (API_KEY) console.log(`  ${c.yellow}API key required${c.reset}: Authorization: Bearer <key>`);
  console.log('\n  Press Ctrl-C to stop\n');
});
