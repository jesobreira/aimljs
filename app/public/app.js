/* ── app.js — AIML Chat frontend ─────────────────────────────────────────── */

'use strict';

// ─── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY     = 'aiml-chats-v2';
const SIDEBAR_KEY     = 'aiml-sidebar-collapsed';
const BOT_SELECT_KEY  = 'aiml-selected-bots';

function loadChats() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}
function saveChats(chats) { localStorage.setItem(STORAGE_KEY, JSON.stringify(chats)); }
function uuid() {
  return crypto.randomUUID?.() ||
    ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
}

// ─── Bot selection ────────────────────────────────────────────────────────────

let availableBots = [];        // fetched from /api/bots
let pendingBots   = null;      // selection in the modal (null = unchanged)

function loadSelectedBots() {
  try {
    const saved = JSON.parse(localStorage.getItem(BOT_SELECT_KEY) || 'null');
    if (Array.isArray(saved) && saved.length > 0) return saved;
  } catch {}
  return null; // null = all bots (server default)
}

function saveSelectedBots(ids) {
  localStorage.setItem(BOT_SELECT_KEY, JSON.stringify(ids));
}

let selectedBots = loadSelectedBots(); // null = all, or string[]

async function fetchBots() {
  try {
    const res  = await fetch('/api/bots');
    availableBots = await res.json();
    updateActiveBotLabel();
  } catch { /* server might still be booting */ }
}

function updateActiveBotLabel() {
  const labelEl = document.getElementById('active-bots-label');
  if (!labelEl || availableBots.length === 0) return;
  const active = selectedBots
    ? availableBots.filter(b => selectedBots.includes(b.id))
    : availableBots;
  const total = active.reduce((s, b) => s + (b.categories || 0), 0);
  labelEl.textContent = active.length === availableBots.length
    ? `All bots · ${total.toLocaleString()} categories`
    : `${active.map(b => b.label).join(', ')} · ${total.toLocaleString()} cat.`;
}

// ─── State ────────────────────────────────────────────────────────────────────

let chats        = loadChats();
let activeChatId = null;
let isBotTyping  = false;

function getChat(id) { return chats.find(c => c.id === id) || null; }

function createChat(bots) {
  const chat = {
    id: uuid(), title: 'New chat', messages: [],
    bots: bots || selectedBots || null,
    createdAt: Date.now(), updatedAt: Date.now(),
  };
  chats.unshift(chat);
  saveChats(chats);
  return chat;
}

function deleteChat(id) {
  fetch(`/api/session/${id}`, { method: 'DELETE' }).catch(() => {});
  chats = chats.filter(c => c.id !== id);
  saveChats(chats);
}

function addMessage(chatId, role, content) {
  const chat = getChat(chatId);
  if (!chat) return;
  chat.messages.push({ role, content, time: Date.now() });
  chat.updatedAt = Date.now();
  if (chat.messages.length === 1 && role === 'user')
    chat.title = content.slice(0, 48) + (content.length > 48 ? '…' : '');
  saveChats(chats);
}

// ─── DOM refs ─────────────────────────────────────────────────────────────────

const sidebar          = document.getElementById('sidebar');
const sidebarOverlay   = document.getElementById('sidebar-overlay');
const chatList         = document.getElementById('chat-list');
const messagesEl       = document.getElementById('messages');
const welcomeEl        = document.getElementById('welcome');
const topbarTitle      = document.getElementById('topbar-title');
const btnNewChat       = document.getElementById('btn-new-chat');
const btnDeleteChat    = document.getElementById('btn-delete-chat');
const btnSend          = document.getElementById('btn-send');
const inputEl          = document.getElementById('input');
const btnToggle        = document.getElementById('btn-toggle-sidebar');
const btnOpen          = document.getElementById('btn-open-sidebar');
const btnExpand        = document.getElementById('btn-expand-sidebar');
const btnOpenSettings  = document.getElementById('btn-open-settings');
const settingsOverlay  = document.getElementById('settings-overlay');
const botListEl        = document.getElementById('bot-list');
const btnCloseSettings = document.getElementById('btn-close-settings');
const btnCancel        = document.getElementById('btn-settings-cancel');
const btnApply         = document.getElementById('btn-settings-apply');
const modalTotal       = document.getElementById('modal-total');

// ─── Sidebar collapse ─────────────────────────────────────────────────────────

let sidebarCollapsed = localStorage.getItem(SIDEBAR_KEY) === '1';

function applySidebarState() {
  if (sidebarCollapsed) {
    sidebar.classList.add('collapsed');
    btnExpand.classList.remove('hidden');
  } else {
    sidebar.classList.remove('collapsed');
    btnExpand.classList.add('hidden');
  }
}

function toggleSidebarCollapse() {
  sidebarCollapsed = !sidebarCollapsed;
  localStorage.setItem(SIDEBAR_KEY, sidebarCollapsed ? '1' : '0');
  applySidebarState();
}

// Desktop toggle
btnToggle.addEventListener('click', toggleSidebarCollapse);
btnExpand.addEventListener('click', toggleSidebarCollapse);

// Mobile open/close
function openSidebar()  { sidebar.classList.add('open');    sidebarOverlay.classList.add('open'); }
function closeSidebar() { sidebar.classList.remove('open'); sidebarOverlay.classList.remove('open'); }
btnOpen.addEventListener('click', openSidebar);
sidebarOverlay.addEventListener('click', closeSidebar);

// ─── Chat list ────────────────────────────────────────────────────────────────

function renderChatList() {
  chatList.innerHTML = '';
  if (chats.length === 0) {
    chatList.innerHTML = '<div class="chat-empty">No conversations yet</div>';
    return;
  }
  for (const chat of chats) {
    const item = document.createElement('div');
    item.className = 'chat-item' + (chat.id === activeChatId ? ' active' : '');
    item.dataset.id = chat.id;

    // Show bot badges if non-default selection
    const botLabel = chat.bots && availableBots.length
      ? chat.bots.map(id => availableBots.find(b => b.id === id)?.label ?? id).join('+')
      : '';

    item.innerHTML = `
      <span class="chat-item-icon">💬</span>
      <span class="chat-item-title">${escHtml(chat.title)}${botLabel ? `<span class="chat-item-bots"> · ${escHtml(botLabel)}</span>` : ''}</span>
      <button class="chat-item-del btn-icon" title="Delete" data-id="${chat.id}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
        </svg>
      </button>`;

    item.addEventListener('click', e => {
      if (e.target.closest('.chat-item-del')) return;
      switchChat(chat.id); closeSidebar();
    });
    item.querySelector('.chat-item-del').addEventListener('click', e => {
      e.stopPropagation(); handleDeleteChat(chat.id);
    });
    chatList.appendChild(item);
  }
}

function handleDeleteChat(id) {
  deleteChat(id);
  if (activeChatId === id) { activeChatId = null; showWelcome(); }
  renderChatList();
}

// ─── Messages ─────────────────────────────────────────────────────────────────

function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function renderMessages(chat) {
  messagesEl.innerHTML = '';
  welcomeEl.classList.add('hidden');
  messagesEl.classList.remove('hidden');
  btnDeleteChat.classList.remove('hidden');
  topbarTitle.textContent = chat.title;
  for (const msg of chat.messages) appendMessageEl(msg.role, msg.content, false);
  scrollToBottom(false);
}

function appendMessageEl(role, content, animate = true) {
  const group = document.createElement('div');
  group.className = `msg-group ${role}`;
  if (!animate) group.style.animation = 'none';
  if (role === 'user') {
    group.innerHTML = `<div class="msg-bubble">${escHtml(content)}</div>`;
  } else {
    group.innerHTML = `
      <div class="msg-bot-avatar">🤖</div>
      <div class="msg-bot-content">
        <div class="msg-bot-name">Alice</div>
        <div class="msg-bubble">${escHtml(content)}</div>
      </div>`;
  }
  messagesEl.appendChild(group);
  return group;
}

function showTypingIndicator() {
  const group = document.createElement('div');
  group.className = 'msg-group bot msg-typing';
  group.id = 'typing-indicator';
  group.innerHTML = `
    <div class="msg-bot-avatar">🤖</div>
    <div class="msg-bot-content">
      <div class="msg-bot-name">Alice</div>
      <div class="msg-bubble">
        <span class="dot"></span><span class="dot"></span><span class="dot"></span>
      </div>
    </div>`;
  messagesEl.appendChild(group);
  scrollToBottom(true);
}

function removeTypingIndicator() { document.getElementById('typing-indicator')?.remove(); }
function scrollToBottom(smooth = true) {
  messagesEl.scrollTo({ top: messagesEl.scrollHeight, behavior: smooth ? 'smooth' : 'instant' });
}

// ─── Views ────────────────────────────────────────────────────────────────────

function showWelcome() {
  activeChatId = null;
  messagesEl.innerHTML = '';
  messagesEl.classList.add('hidden');
  welcomeEl.classList.remove('hidden');
  btnDeleteChat.classList.add('hidden');
  topbarTitle.textContent = 'New chat';
  renderChatList();
}

function switchChat(id) {
  activeChatId = id;
  const chat = getChat(id);
  if (!chat) return showWelcome();
  renderMessages(chat);
  renderChatList();
}

// ─── Send message ─────────────────────────────────────────────────────────────

async function sendMessage(text) {
  text = text.trim();
  if (!text || isBotTyping) return;

  if (!activeChatId) {
    const chat = createChat(selectedBots);
    activeChatId = chat.id;
    messagesEl.classList.remove('hidden');
    welcomeEl.classList.add('hidden');
    btnDeleteChat.classList.remove('hidden');
  }

  addMessage(activeChatId, 'user', text);
  topbarTitle.textContent = getChat(activeChatId)?.title || 'Chat';
  appendMessageEl('user', text);
  scrollToBottom(true);
  renderChatList();

  isBotTyping = true;
  btnSend.disabled = true;
  inputEl.disabled = true;
  inputEl.value = '';
  autoResize();
  showTypingIndicator();

  const chat = getChat(activeChatId);

  try {
    const body = { message: text, sessionId: activeChatId };
    if (chat?.bots) body.bots = chat.bots;

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const response = data.response || '';

    removeTypingIndicator();
    addMessage(activeChatId, 'assistant', response);
    appendMessageEl('assistant', response);
    scrollToBottom(true);
    renderChatList();
  } catch (err) {
    removeTypingIndicator();
    const errMsg = 'Sorry, I could not connect to the server.';
    addMessage(activeChatId, 'assistant', errMsg);
    appendMessageEl('assistant', errMsg);
    scrollToBottom(true);
    console.error('Chat error:', err);
  } finally {
    isBotTyping = false;
    btnSend.disabled = inputEl.value.trim() === '';
    inputEl.disabled = false;
    inputEl.focus();
  }
}

// ─── Input ────────────────────────────────────────────────────────────────────

function autoResize() {
  inputEl.style.height = 'auto';
  inputEl.style.height = Math.min(inputEl.scrollHeight, 200) + 'px';
}
inputEl.addEventListener('input', () => {
  autoResize();
  btnSend.disabled = inputEl.value.trim() === '' || isBotTyping;
});
inputEl.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (!btnSend.disabled) sendMessage(inputEl.value); }
});
btnSend.addEventListener('click', () => { if (!btnSend.disabled) sendMessage(inputEl.value); });

// ─── Chips ────────────────────────────────────────────────────────────────────

document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => sendMessage(chip.dataset.prompt));
});

// ─── New chat ─────────────────────────────────────────────────────────────────

btnNewChat.addEventListener('click', () => {
  showWelcome(); closeSidebar(); inputEl.focus();
});

// ─── Delete chat ──────────────────────────────────────────────────────────────

btnDeleteChat.addEventListener('click', () => {
  if (!activeChatId) return;
  if (!confirm('Delete this conversation?')) return;
  handleDeleteChat(activeChatId);
});

// ─── Settings modal ───────────────────────────────────────────────────────────

function renderBotList() {
  botListEl.innerHTML = '';
  if (availableBots.length === 0) {
    botListEl.innerHTML = '<p style="padding:16px;color:var(--text-dim);font-size:13px">Loading bots…</p>';
    return;
  }

  const active = pendingBots ?? selectedBots ?? availableBots.map(b => b.id);

  for (const bot of availableBots) {
    const checked = active.includes(bot.id);
    const item = document.createElement('label');
    item.className = 'bot-item' + (checked ? ' checked' : '');
    item.innerHTML = `
      <input type="checkbox" class="bot-checkbox" value="${bot.id}" ${checked ? 'checked' : ''}/>
      <div class="bot-item-info">
        <div class="bot-item-label">
          ${escHtml(bot.label)}
          <span class="bot-item-cats">${(bot.categories || 0).toLocaleString()} cat.</span>
        </div>
        <div class="bot-item-desc">${escHtml(bot.description)}</div>
      </div>`;

    const checkbox = item.querySelector('input');
    checkbox.addEventListener('change', () => {
      item.classList.toggle('checked', checkbox.checked);
      syncPendingBots();
    });
    botListEl.appendChild(item);
  }
  syncPendingBots();
}

function syncPendingBots() {
  const checked = [...botListEl.querySelectorAll('.bot-checkbox:checked')].map(cb => cb.value);
  pendingBots = checked;

  // Update total count label
  const total = availableBots
    .filter(b => checked.includes(b.id))
    .reduce((s, b) => s + (b.categories || 0), 0);
  modalTotal.textContent = `${checked.length} bot${checked.length !== 1 ? 's' : ''} · ~${total.toLocaleString()} categories`;

  // Disable apply if nothing selected
  btnApply.disabled = checked.length === 0;
}

function openSettings() {
  pendingBots = null; // reset to current selection
  renderBotList();
  settingsOverlay.classList.remove('hidden');
  // If bots not yet loaded, fetch now
  if (availableBots.length === 0) fetchBots().then(renderBotList);
}

function closeSettings() {
  settingsOverlay.classList.add('hidden');
  pendingBots = null;
}

btnOpenSettings.addEventListener('click', openSettings);
btnCloseSettings.addEventListener('click', closeSettings);
btnCancel.addEventListener('click', closeSettings);
settingsOverlay.addEventListener('click', e => { if (e.target === settingsOverlay) closeSettings(); });

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !settingsOverlay.classList.contains('hidden')) closeSettings();
});

btnApply.addEventListener('click', () => {
  if (!pendingBots || pendingBots.length === 0) return;

  // Save selection (null means all)
  const isAll = pendingBots.length === availableBots.length;
  selectedBots = isAll ? null : pendingBots;
  saveSelectedBots(selectedBots ?? availableBots.map(b => b.id));

  closeSettings();
  updateActiveBotLabel();

  // Start a fresh new chat with the new selection
  showWelcome();
  inputEl.focus();
});

// ─── Boot ─────────────────────────────────────────────────────────────────────

applySidebarState();
showWelcome();
renderChatList();
fetchBots();
inputEl.focus();

// Add a tiny style for chat item bot tag
const style = document.createElement('style');
style.textContent = '.chat-item-bots{font-size:10px;color:var(--text-xs);font-weight:400}';
document.head.appendChild(style);
