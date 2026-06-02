/* ── app.js — AIML Chat frontend ─────────────────────────────────────────── */

'use strict';

// ─── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'aiml-chats-v2';

function loadChats() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}

function saveChats(chats) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
}

function uuid() {
  return crypto.randomUUID ? crypto.randomUUID()
    : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
}

// ─── State ────────────────────────────────────────────────────────────────────

let chats      = loadChats();       // [{id, title, messages[], createdAt, updatedAt}]
let activeChatId = null;
let isBotTyping  = false;

function getChat(id) { return chats.find(c => c.id === id) || null; }

function createChat() {
  const chat = {
    id: uuid(),
    title: 'New chat',
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  chats.unshift(chat);
  saveChats(chats);
  return chat;
}

function deleteChat(id) {
  // Tell server to drop its session
  fetch(`/api/session/${id}`, { method: 'DELETE' }).catch(() => {});
  chats = chats.filter(c => c.id !== id);
  saveChats(chats);
}

function addMessage(chatId, role, content) {
  const chat = getChat(chatId);
  if (!chat) return;
  chat.messages.push({ role, content, time: Date.now() });
  chat.updatedAt = Date.now();
  if (chat.messages.length === 1 && role === 'user') {
    chat.title = content.slice(0, 48) + (content.length > 48 ? '…' : '');
  }
  saveChats(chats);
}

// ─── DOM refs ─────────────────────────────────────────────────────────────────

const sidebar        = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const chatList       = document.getElementById('chat-list');
const messagesEl     = document.getElementById('messages');
const welcomeEl      = document.getElementById('welcome');
const topbarTitle    = document.getElementById('topbar-title');
const btnNewChat     = document.getElementById('btn-new-chat');
const btnDeleteChat  = document.getElementById('btn-delete-chat');
const btnSend        = document.getElementById('btn-send');
const inputEl        = document.getElementById('input');
const btnToggle      = document.getElementById('btn-toggle-sidebar');
const btnOpen        = document.getElementById('btn-open-sidebar');

// ─── Sidebar toggle ───────────────────────────────────────────────────────────

function openSidebar() {
  sidebar.classList.add('open');
  sidebarOverlay.classList.add('open');
}
function closeSidebar() {
  sidebar.classList.remove('open');
  sidebarOverlay.classList.remove('open');
}

btnToggle.addEventListener('click', closeSidebar);
btnOpen.addEventListener('click', openSidebar);
sidebarOverlay.addEventListener('click', closeSidebar);

// ─── Chat list render ─────────────────────────────────────────────────────────

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
    item.innerHTML = `
      <span class="chat-item-icon">💬</span>
      <span class="chat-item-title">${escHtml(chat.title)}</span>
      <button class="chat-item-del btn-icon" title="Delete" data-id="${chat.id}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
          <path d="M9 6V4h6v2"/>
        </svg>
      </button>`;

    item.addEventListener('click', (e) => {
      if (e.target.closest('.chat-item-del')) return;
      switchChat(chat.id);
      closeSidebar();
    });

    item.querySelector('.chat-item-del').addEventListener('click', (e) => {
      e.stopPropagation();
      handleDeleteChat(chat.id);
    });

    chatList.appendChild(item);
  }
}

function handleDeleteChat(id) {
  deleteChat(id);
  if (activeChatId === id) {
    activeChatId = null;
    showWelcome();
  }
  renderChatList();
}

// ─── Message rendering ────────────────────────────────────────────────────────

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderMessages(chat) {
  messagesEl.innerHTML = '';
  welcomeEl.classList.add('hidden');
  messagesEl.classList.remove('hidden');
  btnDeleteChat.classList.remove('hidden');
  topbarTitle.textContent = chat.title;

  for (const msg of chat.messages) {
    appendMessageEl(msg.role, msg.content, false);
  }
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
  return group;
}

function removeTypingIndicator() {
  document.getElementById('typing-indicator')?.remove();
}

function scrollToBottom(smooth = true) {
  messagesEl.scrollTo({ top: messagesEl.scrollHeight, behavior: smooth ? 'smooth' : 'instant' });
}

// ─── Show/hide views ──────────────────────────────────────────────────────────

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

  // Create a chat if none is active
  if (!activeChatId) {
    const chat = createChat();
    activeChatId = chat.id;
    messagesEl.classList.remove('hidden');
    welcomeEl.classList.add('hidden');
    btnDeleteChat.classList.remove('hidden');
  }

  // Add user message
  addMessage(activeChatId, 'user', text);
  topbarTitle.textContent = getChat(activeChatId)?.title || 'Chat';
  appendMessageEl('user', text);
  scrollToBottom(true);
  renderChatList();

  // Disable input, show typing
  isBotTyping = true;
  btnSend.disabled = true;
  inputEl.disabled = true;
  inputEl.value = '';
  autoResize();
  const typingEl = showTypingIndicator();

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, sessionId: activeChatId }),
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

// ─── Input handling ───────────────────────────────────────────────────────────

function autoResize() {
  inputEl.style.height = 'auto';
  inputEl.style.height = Math.min(inputEl.scrollHeight, 200) + 'px';
}

inputEl.addEventListener('input', () => {
  autoResize();
  btnSend.disabled = inputEl.value.trim() === '' || isBotTyping;
});

inputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    if (!btnSend.disabled) sendMessage(inputEl.value);
  }
});

btnSend.addEventListener('click', () => {
  if (!btnSend.disabled) sendMessage(inputEl.value);
});

// ─── Quick-prompt chips ───────────────────────────────────────────────────────

document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => sendMessage(chip.dataset.prompt));
});

// ─── New chat ─────────────────────────────────────────────────────────────────

btnNewChat.addEventListener('click', () => {
  showWelcome();
  closeSidebar();
  inputEl.focus();
});

// ─── Delete active chat ───────────────────────────────────────────────────────

btnDeleteChat.addEventListener('click', () => {
  if (!activeChatId) return;
  if (!confirm('Delete this conversation?')) return;
  handleDeleteChat(activeChatId);
});

// ─── Boot ─────────────────────────────────────────────────────────────────────

showWelcome();
renderChatList();
inputEl.focus();

// Restore last active chat if there's one
if (chats.length > 0) {
  // Don't auto-open; just show the welcome screen so user can pick a chat
}
