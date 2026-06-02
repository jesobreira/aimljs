/**
 * Example 5 — Browser usage
 *
 * This file shows how to use aiml.js in a browser environment.
 * It is NOT a runnable Node.js file — it demonstrates browser-specific
 * patterns using the Web APIs (File, FileReader, fetch, localStorage).
 *
 * In a real project, bundle this with your favourite bundler
 * (Vite, webpack, Rollup, Parcel, …).
 *
 * Demonstrates:
 *  - Loading AIML via fetch()
 *  - Loading AIML from <input type="file">
 *  - Loading pre-built content (no file access needed)
 *  - Persisting a session in localStorage
 */

import { AIML1Bot } from '../src';

// ─── 1. Load AIML via fetch ───────────────────────────────────────────────────

export async function initBotFromFetch(aimlUrls: string[]): Promise<AIML1Bot> {
  const bot = new AIML1Bot({ properties: { name: 'WebBot' } });

  const responses = await Promise.all(aimlUrls.map(url => fetch(url)));
  for (const response of responses) {
    if (!response.ok) throw new Error(`Failed to fetch ${response.url}`);
    const xml = await response.text();
    const fileName = new URL(response.url).pathname.split('/').pop();
    await bot.loadXMLString(xml, fileName);
  }

  return bot;
}

// ─── 2. Load AIML from <input type="file"> ────────────────────────────────────

export async function initBotFromFileInput(
  fileInput: HTMLInputElement,
): Promise<AIML1Bot> {
  const bot = new AIML1Bot({ properties: { name: 'UploadBot' } });

  const files = Array.from(fileInput.files ?? []);
  if (files.length === 0) throw new Error('No files selected');

  // Pass File objects directly — aiml.js reads them with FileReader
  await bot.loadFiles(files);

  return bot;
}

// ─── 3. Inline content (works identically in Node.js and browser) ─────────────

export async function initBotFromContent(): Promise<AIML1Bot> {
  const GREETING_AIML = `<?xml version="1.0"?>
<aiml version="1.0">
  <category>
    <pattern>HELLO</pattern>
    <template>Hi there!</template>
  </category>
  <category>
    <pattern>MY NAME IS *</pattern>
    <template><think><set name="name"><star/></set></think>Nice to meet you, <star/>!</template>
  </category>
  <category>
    <pattern>WHAT IS MY NAME</pattern>
    <template>You are <get name="name"/>.</template>
  </category>
</aiml>`;

  const bot = new AIML1Bot({ properties: { name: 'Alice' } });
  await bot.loadFile({ name: 'greeting.aiml', content: GREETING_AIML });
  return bot;
}

// ─── 4. Persist a session in localStorage ────────────────────────────────────

export function saveSession(bot: AIML1Bot, sessionId: string): void {
  const json = bot.serializeSession(sessionId);
  localStorage.setItem(`aiml-session-${sessionId}`, json);
}

export function restoreSession(bot: AIML1Bot, sessionId: string): string | null {
  const json = localStorage.getItem(`aiml-session-${sessionId}`);
  if (!json) return null;
  return bot.loadSerializedSession(json);
}

// ─── 5. Wire up a simple chat UI ─────────────────────────────────────────────

export function createChatUI(
  bot: AIML1Bot,
  input: HTMLInputElement,
  sendBtn: HTMLButtonElement,
  log: HTMLElement,
  sessionId: string,
): void {
  const appendMessage = (who: 'user' | 'bot', text: string) => {
    const p = document.createElement('p');
    p.textContent = `${who === 'user' ? 'You' : 'Bot'}: ${text}`;
    p.style.color = who === 'user' ? '#333' : '#0066cc';
    log.appendChild(p);
    log.scrollTop = log.scrollHeight;
  };

  const send = async () => {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    appendMessage('user', text);

    const { response } = await bot.talk(text, sessionId);
    appendMessage('bot', response);

    // Persist the session after every turn
    saveSession(bot, sessionId);
  };

  sendBtn.addEventListener('click', send);
  input.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter') send();
  });
}

// ─── 6. Full browser bootstrap example ───────────────────────────────────────

/**
 * Drop this into a browser page:
 *
 * ```html
 * <input id="chat-input" type="text" placeholder="Say something…" />
 * <button id="send-btn">Send</button>
 * <div id="chat-log"></div>
 * <script type="module" src="./05-browser-usage.js"></script>
 * ```
 */
export async function bootstrap(): Promise<void> {
  const SESSION_ID = 'default';

  const bot = await initBotFromContent();

  // Try to restore a previous session from localStorage
  const restored = restoreSession(bot, SESSION_ID);
  const sid = restored ?? SESSION_ID;

  createChatUI(
    bot,
    document.getElementById('chat-input') as HTMLInputElement,
    document.getElementById('send-btn') as HTMLButtonElement,
    document.getElementById('chat-log') as HTMLElement,
    sid,
  );

  console.log(`Bot ready. ${bot.categoryCount} categories loaded.`);
}
