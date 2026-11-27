'use strict';
const $ = (s) => document.querySelector(s);
const KEY = 'cozydesk.v1';
const def = { xp: 0, tasks: [], notes: [], pomos: 0, mode: { sleepy: false, focus: false, quiet: false, privacy: false } };
function loadState() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    const tasks = Array.isArray(raw.tasks) ? raw.tasks : [];
    const notes = Array.isArray(raw.notes) ? raw.notes : [];
    return {
      ...def, ...raw,
      xp: Number.isFinite(+raw.xp) ? Math.max(0, +raw.xp) : 0,
      pomos: Number.isFinite(+raw.pomos) ? Math.max(0, +raw.pomos) : 0,
      tasks: tasks.filter(t => t && typeof t.text === 'string').map((t, i) => ({
        id: String(t.id || 'task-' + i), text: t.text,
        prio: ['high','med','low'].includes(t.prio) ? t.prio : 'med',
        due: typeof t.due === 'string' ? t.due : '', done: !!t.done
      })),
      notes: notes.filter(n => n && typeof n.text === 'string').map((n, i) => ({
        id: String(n.id || 'note-' + i), text: n.text, pin: !!n.pin,
        at: Number.isFinite(+n.at) ? +n.at : Date.now()
      })),
      mode: { ...def.mode, ...(raw.mode && typeof raw.mode === 'object' ? raw.mode : {}) }
    };
  } catch (_) {
    return { ...def, tasks: [], notes: [], mode: { ...def.mode } };
  }
}
let S = loadState();
const save = () => {
  try { localStorage.setItem(KEY, JSON.stringify(S)); }
  catch (err) { console.warn('CozyDesk could not save local data:', err); }
};
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const esc = (t) => t.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- Bunny ---------- */
const MOODS = {
  happy: ['M190 278 Q179 290 167 281 M190 278 Q201 290 213 281', 1],
  neutral: ['M178 283 Q190 286 202 283', 1],
  sleepy: ['M178 284 Q190 288 202 284', 0.38],
  excited: ['M176 280 Q190 304 204 280 Q190 310 176 280Z', 1.12, '#f49ab8'],
  sad: ['M176 288 Q190 276 204 288', 0.9],
  surprised: ['M183 280 Q190 276 197 280 Q197 296 190 296 Q183 296 183 280Z', 1.1, '#f49ab8'],
  bored: ['M178 284 L202 284', 0.72],
  playful: ['M177 281 Q190 300 203 281 Q190 306 177 281Z', 1, '#f49ab8'],
  focused: ['M180 284 L200 284', 0.82],
  curious: ['M178 286 Q190 279 202 286', 1.08],
  confused: ['M177 286 Q185 278 191 286 T204 283', 1]
};
function mood(m) {
  const map = { sleepy: 'sleep', sleep: 'sleep', focused: 'focus', focus: 'focus', shy: 'shy', surprised: 'surprised', excited: 'surprised', curious: 'surprised', happy: 'happy', playful: 'happy', neutral: 'happy', sad: 'shy', bored: 'focus', confused: 'surprised' };
  const state = map[m] || 'happy';
  const bunny = $('#bunnyStage');
  if (bunny) bunny.dataset.mood = state;
  document.querySelectorAll('.home-mood-btn').forEach((btn) => btn.classList.toggle('active', btn.dataset.bunnyMood === state));
  const status = $('#bunnyMoodStatus');
  if (status) status.textContent = ({ happy: 'Your bunny is happily cheering you on! ✨', focus: 'Locked in and focusing right beside you! 🎯', sleep: 'Shh… your bunny is taking a cozy nap. 💤', shy: 'Aww, you made your bunny blush! 🌸', surprised: 'Ooh! Something exciting just caught their eye! ✨' })[state];
}
document.querySelectorAll('.home-mood-btn').forEach((btn) => btn.addEventListener('click', () => mood(btn.dataset.bunnyMood)));
function bounce() {
  const b = $('#bunny'); b.classList.remove('bounce'); void b.getBoundingClientRect(); b.classList.add('bounce');
}

/* ---------- Speech (random + cooldown) ---------- */
const LINES = {
  idle: ['Hey… are you still there? 👀', "Let's get something done today. ✨", "I'm bored. Game?", 'Did somebody say snacks?', 'You have been busy. Water break? 💧'],
  poke: ['Hehe, that tickles!', 'Boop! 🌷', 'Hi hi hi!', 'Yes? I was napping… almost.'],
  task: ['YESSS! Another one done! 🎉', 'Task crushed! ✨', 'Look at you go!'],
  timer: ['We did it! Take a tiny break. 🌷', 'Focus session complete! 🌷'],
  note: ['Got it! I will keep that safe. 🤫', 'Saved, locally on your PC.'],
  sleep: ["I'm sleepy…", 'Five more minutes? 🥺', 'Good night… 😴'],
  ignored: ["Wow. I'm invisible now? 😭"]
};
let lastSay = 0, lastAct = Date.now(), hideT;
const pick = (a) => a[Math.floor(Math.random() * a.length)];
function say(kind, force) {
  const quiet = S.mode.quiet || S.mode.sleepy || S.mode.privacy || S.mode.focus;
  if (!force && (quiet || Date.now() - lastSay < 60000)) return;
  lastSay = Date.now();
  const b = $('#bubble'); b.textContent = pick(LINES[kind]); b.classList.add('show');
  clearTimeout(hideT); hideT = setTimeout(() => b.classList.remove('show'), 4500);
}
// One low-frequency check (every 45s) instead of constant polling.
setInterval(() => {
  if (document.hidden) return;
  const idle = Date.now() - lastAct;
  if (idle > 600000) { mood('sad'); say('ignored'); }
  else if (Math.random() < 0.5) { mood(pick(['happy', 'curious', 'playful', 'bored'])); say('idle'); }
}, 45000);
document.addEventListener('pointerdown', () => (lastAct = Date.now()));
function floatBunnyHeart(event) {
  const stage = $('#bunnyStage');
  if (!stage) return;
  const rect = stage.getBoundingClientRect();
  const heart = document.createElement('span');
  heart.className = 'bunny-floating-heart';
  heart.setAttribute('aria-hidden', 'true');
  heart.textContent = pick(['💖', '🌸', '✨', '💕']);
  const x = Number.isFinite(event.clientX) ? event.clientX - rect.left : rect.width / 2;
  const y = Number.isFinite(event.clientY) ? event.clientY - rect.top : rect.height / 2;
  heart.style.left = Math.max(8, Math.min(rect.width - 28, x - 8)) + 'px';
  heart.style.top = Math.max(8, Math.min(rect.height - 30, y - 8)) + 'px';
  stage.appendChild(heart);
  heart.addEventListener('animationend', () => heart.remove(), { once: true });
  setTimeout(() => heart.remove(), 1300);
}
$('#bunny').addEventListener('click', (event) => {
  floatBunnyHeart(event);
  mood('excited');
  bounce();
  addXP(2, 'Your bunny hopped with joy! +2 Cozy XP 💖');
  setTimeout(applyMood, 2500);
});

/* ---------- XP ---------- */
const lvlOf = (xp) => { let l = 1, need = 100; while (xp >= need) { xp -= need; l++; need = l * 100; } return { l, cur: xp, need }; };
function addXP(n, message = '') {
  S.xp += n;
  save();
  renderStats();
  const stage = $('#bunnyStage');
  if (stage) {
    const toast = document.createElement('span');
    toast.className = 'cozy-xp-pop';
    toast.textContent = '+' + n + ' XP';
    toast.setAttribute('aria-hidden', 'true');
    stage.appendChild(toast);
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
    setTimeout(() => toast.remove(), 1800);
  }
  if (message) {
    const bubble = $('#bubble');
    bubble.textContent = message;
    bubble.classList.add('show');
    clearTimeout(hideT);
    hideT = setTimeout(() => bubble.classList.remove('show'), 4200);
  }
}
function renderStats() {
  const { l, cur, need } = lvlOf(S.xp);
  $('#lvl').textContent = 'Lv ' + l; $('#xpTxt').textContent = `${cur}/${need}`; $('#xpFill').style.width = (cur / need) * 100 + '%';
  const open = S.tasks.filter((t) => !t.done).length;
  $('#homeSummary').textContent = `${open} open task(s) · ${S.notes.length} note(s) · ${S.pomos} focus session(s) completed.`;
}

/* ---------- Modes ---------- */
function applyMood() { mood(S.mode.sleepy ? 'sleepy' : S.mode.focus ? 'focused' : 'happy'); }
function applyModes() {
  const m = S.mode;
  document.body.classList.toggle('sleepy', m.sleepy); document.body.classList.toggle('focus', m.focus);
  document.body.classList.toggle('quiet', m.quiet); document.body.classList.toggle('private', m.privacy);
  $('#btnSleep').classList.toggle('on', m.sleepy); $('#btnFocus').classList.toggle('on', m.focus);
  $('#btnQuiet').classList.toggle('on', m.quiet); $('#btnPrivacy').classList.toggle('on', m.privacy);
  $('#btnSleep').textContent = m.sleepy ? 'Wake up' : 'Sleepy';
  applyMood(); save();
}
const toggle = (k, line) => () => { S.mode[k] = !S.mode[k]; applyModes(); if (S.mode[k] && line) { $('#bubble').textContent = line; $('#bubble').classList.add('show'); setTimeout(() => $('#bubble').classList.remove('show'), 3500); } };
$('#btnSleep').onclick = toggle('sleepy', "I'm sleepy… good night… 😴");
$('#btnFocus').onclick = toggle('focus', "Focus mode ON. I'll stay quiet. 🤫");
$('#btnQuiet').onclick = toggle('quiet', 'Quiet mode ON. 🤍');
$('#btnPrivacy').onclick = toggle('privacy', 'Privacy mode ON. 🔒');

/* ---------- Tabs ---------- */
document.querySelectorAll('nav [data-tab]').forEach((b) => (b.onclick = () => {
  document.querySelectorAll('nav [data-tab]').forEach((x) => x.classList.toggle('active', x === b));
  document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t.id === 'tab-' + b.dataset.tab));
}));

/* ---------- Tasks ---------- */
function renderTasks() {
  const order = { high: 0, med: 1, low: 2 };
  const list = [...S.tasks].sort((a, b) => a.done - b.done || order[a.prio] - order[b.prio]);
  $('#taskList').innerHTML = list.map((t) => `<li class="p-${t.prio} ${t.done ? 'done' : ''}" data-id="${t.id}">
    <input type="checkbox" ${t.done ? 'checked' : ''}><span class="grow">${esc(t.text)} ${t.due ? `<small class="muted">· ${t.due}</small>` : ''}</span><button class="del">✕</button></li>`).join('');
  renderStats();
}
$('#addTask').onclick = () => {
  const text = $('#taskText').value.trim(); if (!text) return;
  S.tasks.push({ id: uid(), text, prio: $('#taskPrio').value, due: $('#taskDue').value, done: false });
  $('#taskText').value = ''; save(); renderTasks();
};
$('#taskList').onclick = (e) => {
  const li = e.target.closest('li'); if (!li) return;
  const t = S.tasks.find((x) => x.id === li.dataset.id);
  if (e.target.classList.contains('del')) S.tasks = S.tasks.filter((x) => x !== t);
  else if (e.target.type === 'checkbox') {
    t.done = e.target.checked;
    if (t.done) { addXP(20, 'Task complete! You earned +20 Cozy XP! 🎉'); mood('excited'); bounce(); setTimeout(applyMood, 3000); }
  }
  save(); renderTasks();
};

/* ---------- Notes ---------- */
function renderNotes() {
  const q = $('#noteSearch').value.toLowerCase();
  const list = S.notes.filter((n) => n.text.toLowerCase().includes(q)).sort((a, b) => b.pin - a.pin || b.at - a.at);
  $('#noteList').innerHTML = list.map((n) => `<li data-id="${n.id}"><span class="grow">${n.pin ? '📌 ' : ''}${esc(n.text)}</span><button class="pin">Pin</button><button class="del">✕</button></li>`).join('');
  renderStats();
}
$('#noteText').value = localStorage.getItem('cozydesk.draft') || '';
$('#noteText').oninput = (e) => localStorage.setItem('cozydesk.draft', e.target.value); // auto-save draft
$('#noteSearch').oninput = renderNotes;
$('#addNote').onclick = () => {
  const text = $('#noteText').value.trim(); if (!text) return;
  S.notes.push({ id: uid(), text, pin: false, at: Date.now() });
  $('#noteText').value = ''; localStorage.removeItem('cozydesk.draft'); save(); renderNotes(); say('note', true);
};
$('#noteList').onclick = (e) => {
  const li = e.target.closest('li'); if (!li) return;
  const n = S.notes.find((x) => x.id === li.dataset.id);
  if (e.target.classList.contains('del')) S.notes = S.notes.filter((x) => x !== n);
  if (e.target.classList.contains('pin')) n.pin = !n.pin;
  save(); renderNotes();
};

/* ---------- Timer (interval only runs while active) ---------- */
let secs = 1500, total = 1500, tick = null, timerEndAt = 0, isFocus = true;
const fmt = (s) => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
function setTimer(min, focus) {
  stop(); secs = total = min * 60; isFocus = focus;
  $('#clock').textContent = fmt(secs); $('#tStart').textContent = 'Start';
}
function stop() { clearInterval(tick); tick = null; timerEndAt = 0; }
function done() {
  stop(); $('#tStart').textContent = 'Start';
  const msg = isFocus ? 'Focus session complete! 🌷' : 'Break is over. Ready?';
  if (isFocus) { S.pomos++; addXP(50, 'Focus session complete! +50 Cozy XP! 🌷'); save(); }
  mood('excited'); bounce(); setTimeout(applyMood, 4000); renderStats();
  $('#pomoCount').textContent = `Focus sessions completed: ${S.pomos}`;
  if ('Notification' in window) { Notification.requestPermission().then((p) => p === 'granted' && new Notification('CozyDesk', { body: msg })); }
  secs = total; $('#clock').textContent = fmt(secs);
}
$('#tStart').onclick = () => {
  if (tick) {
    secs = Math.max(0, Math.ceil((timerEndAt - Date.now()) / 1000));
    stop(); $('#clock').textContent = fmt(secs); $('#tStart').textContent = 'Resume';
    return;
  }
  if (secs <= 0) secs = total;
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {});
  }
  timerEndAt = Date.now() + secs * 1000;
  $('#tStart').textContent = 'Pause';
  tick = setInterval(() => {
    secs = Math.max(0, Math.ceil((timerEndAt - Date.now()) / 1000));
    $('#clock').textContent = fmt(secs);
    if (secs <= 0) done();
  }, 250);
};
$('#tFocus').onclick = () => setTimer(25, true);
$('#tBreak').onclick = () => setTimer(5, false);
$('#tReset').onclick = () => setTimer(total / 60, isFocus);
$('#taskText').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#addTask').click(); });
$('#noteText').addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') $('#addNote').click(); });

/* ---------- Windows helper ---------- */
document.querySelectorAll('[data-act]').forEach((b) => (b.onclick = () => window.cozy && window.cozy.systemAction(b.dataset.act)));
$('#resetAll').onclick = () => {
  if (confirm('Delete all CozyDesk data saved by this app on this device?')) {
    localStorage.removeItem(KEY);
    localStorage.removeItem('cozydesk.draft');
    location.reload();
  }
};

/* ---------- Init ---------- */
$('#pomoCount').textContent = `Focus sessions completed: ${S.pomos}`;
renderTasks(); renderNotes(); applyModes();
