'use strict';
/* CozyDesk part 2: Room, Calendar, Alarms, Study, Clock, Game */
const XD = { events: [], alarms: [], study: {}, zones: ['Asia/Dhaka', 'Europe/London', 'America/New_York', 'Europe/Amsterdam'], theme: 'maroon', best: 0, days: [], goal: 120, lastFired: '' };
const X = (S.ext = Object.assign({}, XD, S.ext || {}));
X.events = Array.isArray(X.events) ? X.events : [];
X.alarms = Array.isArray(X.alarms) ? X.alarms : [];
X.zones = Array.isArray(X.zones) ? X.zones.filter(z => typeof z === 'string') : [...XD.zones];
X.days = Array.isArray(X.days) ? X.days.filter(d => typeof d === 'string') : [];
X.study = X.study && typeof X.study === 'object' && !Array.isArray(X.study) ? X.study : {};
X.goal = Number.isFinite(+X.goal) && +X.goal >= 10 ? +X.goal : 120;
X.best = Number.isFinite(+X.best) ? Math.max(0, +X.best) : 0;
X.activeStudy = X.activeStudy && typeof X.activeStudy.subject === 'string' && Number.isFinite(+X.activeStudy.startedAt) ? X.activeStudy : null;
const sv = () => { S.ext = X; save(); };
const today = () => new Date().toLocaleDateString('en-CA');
const shout = (t, ms = 5000) => { const b = $('#bubble'); b.textContent = t; b.classList.add('show'); clearTimeout(hideT); hideT = setTimeout(() => b.classList.remove('show'), ms); };
// Study streaks are earned by recording a real study session, not by merely opening the app.
const streak = () => { let n = 0; const d = new Date(); while (X.days.includes(d.toLocaleDateString('en-CA'))) { n++; d.setDate(d.getDate() - 1); } return n; };
const studySec = (day) => Object.values(X.study[day] || {}).reduce((a, b) => a + b, 0);
const studyAll = () => Object.keys(X.study).reduce((a, d) => a + studySec(d), 0);
const hm = (s) => { const m = Math.round(s / 60); return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`; };
const dd = (date) => Math.round((new Date(date + 'T00:00') - new Date(today() + 'T00:00')) / 864e5);

/* ---------- inject tabs ---------- */
const TABS = [['room', 'Room'], ['calendar', 'Calendar'], ['alarms', 'Alarms'], ['study', 'Study'], ['clock', 'Clock'], ['game', 'Game']];
const nav = $('nav'), panel = $('#panel');
TABS.forEach(([id, label]) => { const b = document.createElement('button'); b.dataset.tab = id; b.textContent = label; nav.insertBefore(b, $('.spacer')); });
(() => {
  const group = (label, icon, ids) => {
    const d = document.createElement('details'); d.className = 'nav-group';
    const summary = document.createElement('summary'); summary.textContent = icon + ' ' + label; d.appendChild(summary);
    const menu = document.createElement('div'); menu.className = 'nav-menu';
    ids.forEach(id => { const b = nav.querySelector('[data-tab="' + id + '"]'); if (b) menu.appendChild(b); });
    d.appendChild(menu);
    nav.insertBefore(d, $('.spacer'));
    d.addEventListener('click', e => { if (e.target.closest('[data-tab]')) d.open = false; });
  };
  group('Productivity','✦',['tasks','notes','timer','study','calendar','alarms']);
  group('Cozy Space','⌂',['room','game']);
  group('More','☾',['clock','settings']);
})();
const sec = (id, html) => { const d = document.createElement('div'); d.className = 'tab'; d.id = 'tab-' + id; d.innerHTML = html; panel.appendChild(d); };

sec('room', `<h2>Pet Room</h2>
<div class="room-toolbar"><label class="theme-picker">Room mood <select id="roomTheme"></select></label>
<div class="room-actions"><button data-go="bed"><span>🛏️</span> Bed</button><button data-go="desk"><span>📝</span> Desk</button><button data-go="shelf"><span>📖</span> Read</button><button data-go="plant"><span>🌷</span> Plant</button><button data-go="window"><span>🪟</span> Window</button><button data-go="toys"><span>🧸</span> Toys</button><button data-go="any" class="surprise-cta"><span>✨</span> Surprise me</button></div></div>
<svg id="room" class="room" viewBox="0 0 400 260" data-theme="pink" role="img" aria-label="A dreamy pastel kitty house room">
<defs>
 <linearGradient id="roomGlow" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff7fb"/><stop offset="1" stop-color="#f4eaff"/></linearGradient>
 <linearGradient id="rugGrad" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffdce9"/><stop offset="1" stop-color="#e7dcff"/></linearGradient>
 <filter id="softShadow" x="-30%" y="-30%" width="160%" height="170%"><feGaussianBlur stdDeviation="3"/></filter>
</defs>
<rect class="wall" width="400" height="190"/><rect class="floor" y="190" width="400" height="70"/>
<path d="M0 0H400V190H0Z" fill="url(#roomGlow)" opacity=".2"/>
<!-- dreamy window and curtains -->
<rect x="28" y="25" width="105" height="91" rx="13" fill="#fff8fc" stroke="#d99bb9" stroke-width="4"/>
<rect class="sky" x="36" y="33" width="89" height="75" rx="8"/>
<circle class="sunMoon" cx="103" cy="51" r="12" fill="#fff0ad"/>
<g class="sunRays" stroke="#fff8d8" stroke-width="3" stroke-linecap="round"><path d="M101 67L86 133"/><path d="M112 68L128 133"/><path d="M92 70L76 122"/><path d="M120 69L139 120"/></g>
<g class="dustMotes" fill="#fff"><circle cx="150" cy="95" r="2"/><circle cx="142" cy="132" r="1.6"/><circle cx="228" cy="116" r="1.8"/><circle cx="335" cy="136" r="1.5"/></g>
<path d="M38 91q17-18 32 0t32 0t22 0v15H38Z" fill="#fff" opacity=".72"/>
<path d="M27 25q-13 30 1 83q12-8 15-1V29Z" fill="#f3aeca" opacity=".9"/>
<path d="M134 25q13 30-1 83q-12-8-15-1V29Z" fill="#f3aeca" opacity=".9"/>
<path d="M26 24h110" stroke="#bd7d9f" stroke-width="5" stroke-linecap="round"/>
<!-- wall garland -->
<path d="M160 26q42 42 84 0t84 0" fill="none" stroke="#d99bb9" stroke-width="2"/>
<g class="garland"><path d="M172 34l-6 12 12 0Z" fill="#f7b8cf"/><path d="M207 43l-6 12 12 0Z" fill="#d9c7ff"/><path d="M244 34l-6 12 12 0Z" fill="#f7b8cf"/><path d="M281 26l-6 12 12 0Z" fill="#d9c7ff"/><path d="M315 32l-6 12 12 0Z" fill="#f7b8cf"/></g>
<!-- framed kitty portrait -->
<rect x="165" y="68" width="54" height="55" rx="7" fill="#fff7fb" stroke="#dba6c1" stroke-width="3"/>
<rect x="171" y="74" width="42" height="43" rx="4" fill="#f6eaff"/>
<path d="M181 91l4-9 8 7 8-7 4 9v12q-12 12-24 0Z" fill="#fff" stroke="#d9a7bf" stroke-width="1.5"/>
<circle cx="188" cy="97" r="1.7" fill="#6f5366"/><circle cx="198" cy="97" r="1.7" fill="#6f5366"/><path d="M191 102q2 3 4 0" fill="none" stroke="#cf829f" stroke-width="1.5"/>
<!-- floating shelves and books -->
<rect x="244" y="76" width="105" height="6" rx="3" fill="#bd8ba5"/>
<rect x="254" y="54" width="12" height="22" rx="2" fill="#f3aeca"/><rect x="269" y="48" width="13" height="28" rx="2" fill="#c9b8f4"/><rect x="285" y="57" width="12" height="19" rx="2" fill="#a9d7c0"/>
<path d="M305 76q8-22 16 0Z" fill="#f7c9d9"/><circle cx="313" cy="55" r="8" fill="#a8d8b8"/>
<!-- soft contact shadows under the furniture -->
<ellipse cx="201" cy="199" rx="66" ry="7" fill="#74556c" opacity=".14" filter="url(#softShadow)"/>
<ellipse cx="330" cy="202" rx="62" ry="8" fill="#74556c" opacity=".16" filter="url(#softShadow)"/>
<ellipse cx="39" cy="219" rx="23" ry="5" fill="#74556c" opacity=".13" filter="url(#softShadow)"/>
<!-- study desk -->
<rect x="145" y="155" width="112" height="9" rx="3" fill="#bd8ba5"/><rect x="153" y="164" width="7" height="34" fill="#a97896"/><rect x="243" y="164" width="7" height="34" fill="#a97896"/>
<rect x="184" y="125" width="39" height="27" rx="4" fill="#fff6fb" stroke="#bd8ba5" stroke-width="2"/><rect x="189" y="130" width="29" height="17" rx="2" fill="#c8c0f2"/><path d="M199 153h9" stroke="#bd8ba5" stroke-width="3"/>
<!-- bed with canopy -->
<rect x="278" y="159" width="108" height="37" rx="10" fill="#bd8ba5"/>
<rect x="274" y="146" width="112" height="31" rx="11" fill="#fff1f7" stroke="#dba6c1" stroke-width="2"/>
<rect x="282" y="150" width="39" height="19" rx="8" fill="#fff" />
<path d="M325 148q27 8 57 0v27h-57Z" fill="#f3c7dc"/>
<path d="M326 152q20 12 42 0" fill="none" stroke="#fff" stroke-width="2" opacity=".8"/>
<!-- rug -->
<ellipse cx="192" cy="224" rx="100" ry="23" fill="url(#rugGrad)" opacity=".95"/>
<ellipse cx="192" cy="224" rx="82" ry="15" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="3 5" opacity=".8"/>
<!-- plant and lamp -->
<g id="plant" class="locked"><path d="M25 190h27l-4 27H29Z" fill="#d69a9c"/><path d="M38 190q-23-20-17-30q17 0 19 25q2-27 19-29q7 17-16 34" fill="#86bd9a"/><path d="M38 191q-7-29 5-36" stroke="#649b79" stroke-width="2" fill="none"/></g>
<g id="teddy" class="locked"><circle cx="94" cy="219" r="10" fill="#c58a74"/><circle cx="94" cy="205" r="8" fill="#d6a18d"/><circle cx="88" cy="199" r="4" fill="#d6a18d"/><circle cx="100" cy="199" r="4" fill="#d6a18d"/><circle cx="91" cy="205" r="1.3" fill="#553b45"/><circle cx="97" cy="205" r="1.3" fill="#553b45"/></g>
<g id="lamp" class="locked"><path d="M355 143h5v53h-5Z" fill="#b887a2"/><path d="M342 145l15-24 16 24Z" fill="#ffe4a9" stroke="#d5a8bf" stroke-width="2"/><circle cx="358" cy="145" r="19" fill="#ffe8ae" opacity=".16" class="lampGlow"/></g>
<!-- extra cozy room decor: flower corner, plush toys and tiny details -->
<g class="roomFlowers">
 <path d="M18 183q-7-24 5-35q9 11 1 34q11-24 25-17q-1 19-25 24" fill="#8fbd91"/>
 <path d="M22 184q-4-29 8-37" fill="none" stroke="#6f9d79" stroke-width="2"/>
 <path d="M13 184h35l-5 31H18Z" fill="#e9a7c2" stroke="#c985a5" stroke-width="2"/>
 <path d="M16 192h29" stroke="#fff1f7" stroke-width="3" opacity=".8"/>
 <g transform="translate(54 157)">
  <path d="M0 24q-9-22 2-31q10 12 1 31q10-23 22-15q-2 17-22 20" fill="#9bc99d"/>
  <path d="M-7 23h34l-4 24H-3Z" fill="#c9b8ef" stroke="#a18acb" stroke-width="2"/>
  <g transform="translate(9 -1)" fill="#ffc4dd" stroke="#e89aba" stroke-width="1"><ellipse cy="-7" rx="4" ry="7"/><ellipse cy="7" rx="4" ry="7"/><ellipse cx="-7" rx="7" ry="4"/><ellipse cx="7" rx="7" ry="4"/><circle r="3" fill="#ffe69a" stroke="none"/></g>
 </g>
 <g transform="translate(365 91)">
  <path d="M0 0q-8 16 0 29q8-13 0-29" fill="#8fbd91"/>
  <g fill="#f5b5d0"><circle cx="-7" cy="8" r="4"/><circle cx="7" cy="8" r="4"/><circle cy="0" r="4"/><circle cy="15" r="4"/></g><circle cy="8" r="3" fill="#ffe69a"/>
 </g>
</g>
<g class="toyDecor">
 <ellipse cx="116" cy="235" rx="17" ry="5" fill="#b78ca7" opacity=".18"/>
 <g transform="translate(116 215)">
  <circle cy="-7" r="10" fill="#e7b08f"/><circle cx="-7" cy="-15" r="5" fill="#e7b08f"/><circle cx="7" cy="-15" r="5" fill="#e7b08f"/>
  <circle cx="-3" cy="-8" r="1.4" fill="#5a4250"/><circle cx="3" cy="-8" r="1.4" fill="#5a4250"/>
  <ellipse cy="5" rx="12" ry="8" fill="#f2c5d8"/><path d="M-4 -1q4 4 8 0" fill="none" stroke="#b87991" stroke-width="1.5"/>
 </g>
 <g transform="translate(150 229)"><path d="M-13 0h26l-3 9h-20Z" fill="#b7a5e4"/><circle cx="-7" cy="10" r="3" fill="#927dbb"/><circle cx="7" cy="10" r="3" fill="#927dbb"/><path d="M-8 -1l8-9 8 9" fill="#f5c2d8"/></g>
</g>
<g class="wallDetails">
 <rect x="236" y="105" width="44" height="37" rx="5" fill="#fff8fc" stroke="#d8a6c1" stroke-width="3"/>
 <rect x="241" y="110" width="34" height="27" rx="3" fill="#eee7ff"/>
 <path d="M258 131q-12-9 0-17q12 8 0 17" fill="#e99cbb"/>
 <path d="M290 113q12-12 24 0q-12 16-24 0" fill="#f6c4d8"/>
 <path d="M304 111l-4-7m4 7 5-7" stroke="#c98ba8" stroke-width="2" stroke-linecap="round"/>
</g>
<!-- bunny -->
<g id="rb">
<ellipse cx="-7" cy="-60" rx="4.5" ry="13" fill="#f3d3dc"/><ellipse cx="7" cy="-60" rx="4.5" ry="13" fill="#f3d3dc"/><ellipse cx="-7" cy="-59" rx="2" ry="8" fill="#f7a8bf"/><ellipse cx="7" cy="-59" rx="2" ry="8" fill="#f7a8bf"/>
<ellipse cx="0" cy="-12" rx="14" ry="12" fill="#f6dfe6"/><ellipse cx="0" cy="-32" rx="17" ry="14" fill="#fff5f8" stroke="#e6bfd0" stroke-width="1"/>
<ellipse cx="-11" cy="-26" rx="3.5" ry="2.2" fill="#ff8fab" opacity=".6"/><ellipse cx="11" cy="-26" rx="3.5" ry="2.2" fill="#ff8fab" opacity=".6"/>
<circle cx="-6" cy="-32" r="2.8" fill="#3a1220"/><circle cx="6" cy="-32" r="2.8" fill="#3a1220"/><circle cx="-5" cy="-33.2" r="1" fill="#fff"/><circle cx="7" cy="-33.2" r="1" fill="#fff"/><circle cx="0" cy="-28" r="1.5" fill="#e0708d"/><path d="M-3 -25q1.5 2.5 3 0q1.5 2.5 3 0" stroke="#a63e5c" stroke-width="1" fill="none"/>
</g>
<circle id="ball" cx="130" cy="240" r="8" fill="#f5a0c1"/>
<rect id="blanket" class="hide" x="305" y="160" width="80" height="26" rx="6" fill="#f4a6bb"/><text id="rzzz" class="hide" x="335" y="135" fill="#bd83b0" font-size="16">Zzz…</text>
<g class="roomSparkles" fill="#fff"><circle cx="151" cy="54" r="2"/><circle cx="365" cy="42" r="2.5"/><circle cx="232" cy="142" r="2"/></g>
</svg>
<div class="soundscape" aria-label="Cozy Soundscape"><div class="soundscape-copy"><span class="soundscape-icon">♫</span><div><b>Cozy Soundscape</b><small>Soft sounds for your little room</small></div></div>
<div class="soundscape-controls"><select id="soundKind" aria-label="Ambient sound"><option value="rain">🌧 Rain</option><option value="fire">🔥 Fireplace</option><option value="lofi">🎧 Lo-fi beats</option><option value="forest">🐦 Forest birds</option></select><button id="soundToggle" type="button" aria-pressed="false">▶ Play</button></div><p id="soundStatus" class="sound-status">Sound is off · choose a mood</p></div>
<div id="unlocks" class="room-progress-grid" aria-label="Room collection progress"></div>`);

sec('calendar', `<h2>Calendar</h2><div id="calGrid"></div>
<div class="row wrap"><input id="evTitle" placeholder="Event title…"><select id="evType"><option>Exam</option><option>Assignment</option><option>Birthday</option><option>Reminder</option></select><input type="date" id="evDate"><button id="evAdd">Add</button></div><ul id="evList"></ul>`);
sec('alarms', `<h2>Alarms</h2><div class="row wrap"><input type="time" id="alTime"><input id="alLabel" placeholder="Label (Study, Class…)"><label class="muted"><input type="checkbox" id="alDaily"> Daily</label><button id="alAdd">Add</button></div><ul id="alList"></ul>`);
sec('study', `<h2>Study</h2><div class="row wrap"><input id="stSub" list="stSubs" placeholder="Subject (e.g. C Programming)"><datalist id="stSubs"></datalist><button id="stGo">Start</button><span id="stClock" class="muted"></span></div>
<div class="row"><label class="muted">Daily goal (min) <input type="number" id="stGoal" min="10" step="10" size="4"></label></div>
<div class="pbar"><div id="stBar"></div></div><p id="stSum" class="muted"></p><ul id="stList"></ul>`);
sec('clock', `<h2>World Clock</h2><div class="row"><select id="zSel"></select><button id="zAdd">Add</button></div><ul id="zList"></ul>`);
sec('game', `<h2>Carrot Catch 🥕</h2><p class="muted">Move the mouse to move the basket. 30 seconds.</p><canvas id="gcanvas" width="420" height="300"></canvas><div class="row"><button id="gStart">Start</button><span class="muted" id="gBest"></span></div>`);

nav.addEventListener('click', (e) => {
  const b = e.target.closest('[data-tab]');
  if (b) {
    const t = b.dataset.tab;
    document.querySelectorAll('nav [data-tab]').forEach((x) => x.classList.toggle('active', x.dataset.tab === t));
    document.querySelectorAll('.tab').forEach((x) => x.classList.toggle('active', x.id === 'tab-' + t));
    ({ room: renderRoom, calendar: renderCal, alarms: renderAlarms, study: renderStudy, clock: renderClock }[t] || (() => {}))();
  }
  if (e.target.id === 'btnSleep') setTimeout(roomSync, 0);
});

/* ---------- Pet Room ---------- */
const SPOTS = { bed: [320, 174], desk: [200, 200], shelf: [170, 200], plant: [75, 205], window: [100, 205], toys: [150, 238], center: [200, 225] };
const THEMES = [['pink', 1], ['maroon', 1], ['night', 1], ['autumn', 2], ['winter', 3], ['nature', 4], ['minimal', 5], ['cozy', 6]];
const rb = $('#rb');
function goto(n) {
  const spot = SPOTS[n] || SPOTS.center;
  rb.setAttribute('transform', `translate(${spot[0]} ${spot[1]})`);
  rb.dataset.spot = n;
}
goto('center');
function unlocked() {
  const done = S.tasks.filter((t) => t.done).length;
  return { plant: studyAll() >= 1800, teddy: done >= 10, lamp: streak() >= 7, lvl: lvlOf(S.xp).l, done };
}
function roomSync() {
  const sl = S.mode.sleepy;
  $('#room').classList.toggle('dim', sl);
  $('#blanket').classList.toggle('hide', !sl);
  $('#rzzz').classList.toggle('hide', !sl);
  if (sl) goto('bed');
}
function renderRoom() {
  const u = unlocked();
  $('#roomTheme').innerHTML = THEMES.map(([t, l]) => `<option value="${t}" ${u.lvl < l ? 'disabled' : ''}>${t}${u.lvl < l ? ' (Lv ' + l + ')' : ''}</option>`).join('');
  $('#roomTheme').value = X.theme; $('#room').dataset.theme = X.theme;
  $('#plant').classList.toggle('locked', !u.plant); $('#teddy').classList.toggle('locked', !u.teddy); $('#lamp').classList.toggle('locked', !u.lamp);
  const plantPct = Math.min(100, studyAll() / 1800 * 100), teddyPct = Math.min(100, u.done / 10 * 100), lampPct = Math.min(100, streak() / 7 * 100);
  $('#unlocks').innerHTML = [
    ['🌿','Plant','30 min study',plantPct,u.plant ? 'Collected' : hm(studyAll()) + ' so far'],
    ['🧸','Teddy','10 completed tasks',teddyPct,Math.min(u.done,10) + '/10 tasks'],
    ['🌙','Moon lamp','7-day streak',lampPct,streak() + '/7 days']
  ].map(([icon,name,goal,pct,status]) => '<div class="room-progress-card"><div class="progress-heading"><span class="progress-emoji">' + icon + '</span><span><b>' + name + '</b><small>' + goal + '</small></span></div><div class="mini-progress"><i style="width:' + pct + '%"></i></div><small class="progress-status">' + status + '</small></div>').join('');
  roomSync();
}
$('#roomTheme').onchange = (e) => { X.theme = e.target.value; sv(); $('#room').dataset.theme = X.theme; };
$('#tab-room').addEventListener('click', (e) => {
  const action = e.target.closest('[data-go]');
  if (!action || S.mode.sleepy) return;
  const g = action.dataset.go;
  const choices = ['bed', 'desk', 'shelf', 'plant', 'window', 'toys'];
  const n = g === 'any' ? choices.filter((spot) => spot !== rb.dataset.spot)[Math.floor(Math.random() * (choices.filter((spot) => spot !== rb.dataset.spot).length))] : g;
  goto(n);
  shout(({bed:'Time for a cozy rest! 💤',desk:'A little study time! 📚',shelf:'Story time! 📖',plant:'Hello, little plant! 🌿',window:'Look at the pretty sky! ☁️',toys:'Play time! 🧸'})[n] || 'Surprise! ✨', 2600);
  mood(n === 'toys' ? 'playful' : n === 'shelf' || n === 'desk' ? 'focused' : 'curious');
  setTimeout(applyMood, 3000);
});
setInterval(() => { // gentle wandering, only while the Room tab is visible
  if (document.hidden || !$('#tab-room').classList.contains('active') || S.mode.sleepy || S.mode.quiet || S.mode.focus) return;
  goto(['desk', 'shelf', 'plant', 'window', 'toys', 'center'][Math.floor(Math.random() * 6)]);
}, 15000);

/* ---------- Calendar ---------- */
let cal = new Date(); cal.setDate(1);
function renderCal() {
  const y = cal.getFullYear(), m = cal.getMonth(), first = new Date(y, m, 1).getDay(), dim = new Date(y, m + 1, 0).getDate();
  let h = `<div class="row"><button id="cPrev">‹</button><b class="grow2">${cal.toLocaleString('en', { month: 'long' })} ${y}</b><button id="cNext">›</button></div><div class="cgrid">` + ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d) => `<i>${d}</i>`).join('');
  for (let i = 0; i < first; i++) h += '<span></span>';
  for (let d = 1; d <= dim; d++) { const k = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`; h += `<button class="day ${k === today() ? 'today' : ''} ${X.events.some((e) => e.date === k) ? 'has' : ''}" data-d="${k}">${d}</button>`; }
  $('#calGrid').innerHTML = h + '</div>';
  const ev = [...X.events].sort((a, b) => a.date.localeCompare(b.date));
  $('#evList').innerHTML = ev.map((e) => { const n = dd(e.date); const t = n === 0 ? 'Today' : n > 0 ? `${n} day${n > 1 ? 's' : ''}` : 'past'; return `<li class="${n < 0 ? 'past' : ''}" data-id="${e.id}"><span class="grow">${esc(e.title)} <small class="muted">· ${e.type} · ${e.date}</small></span><b>${t}</b><button class="del">✕</button></li>`; }).join('');
}
$('#calGrid').onclick = (e) => {
  if (e.target.id === 'cPrev') cal.setMonth(cal.getMonth() - 1); else if (e.target.id === 'cNext') cal.setMonth(cal.getMonth() + 1);
  else if (e.target.dataset.d) { $('#evDate').value = e.target.dataset.d; return; } else return;
  renderCal();
};
$('#evAdd').onclick = () => {
  const title = $('#evTitle').value.trim(), date = $('#evDate').value; if (!title || !date) return;
  X.events.push({ id: uid(), title, date, type: $('#evType').value }); $('#evTitle').value = ''; sv(); renderCal(); shout('Added to the calendar! 📅');
};
$('#evList').onclick = (e) => { const li = e.target.closest('li'); if (li && e.target.classList.contains('del')) { X.events = X.events.filter((x) => x.id !== li.dataset.id); sv(); renderCal(); } };

/* ---------- Alarms ---------- */
function beep() {
  try { const a = new AudioContext(); [0, 0.3, 0.6].forEach((d) => { const o = a.createOscillator(), g = a.createGain(); o.frequency.value = 880; g.gain.value = 0.15; o.connect(g); g.connect(a.destination); o.start(a.currentTime + d); o.stop(a.currentTime + d + 0.15); }); setTimeout(() => a.close(), 1500); } catch (e) { /* ignore */ }
}
function renderAlarms() {
  $('#alList').innerHTML = [...X.alarms].sort((a, b) => a.time.localeCompare(b.time)).map((a) => `<li data-id="${a.id}"><input type="checkbox" class="on" ${a.on ? 'checked' : ''}><span class="grow"><b>${a.time}</b> ${esc(a.label)} <small class="muted">${a.daily ? 'daily' : 'once'}</small></span><button class="del">✕</button></li>`).join('');
}
$('#alAdd').onclick = () => {
  const time = $('#alTime').value; if (!time) return;
  X.alarms.push({ id: uid(), time, label: $('#alLabel').value.trim() || 'Alarm', daily: $('#alDaily').checked, on: true });
  $('#alLabel').value = ''; sv(); renderAlarms();
  if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
};
$('#alList').onclick = (e) => {
  const li = e.target.closest('li'); if (!li) return; const a = X.alarms.find((x) => x.id === li.dataset.id);
  if (e.target.classList.contains('del')) X.alarms = X.alarms.filter((x) => x !== a); else if (e.target.classList.contains('on')) a.on = e.target.checked;
  sv(); renderAlarms();
};
setInterval(() => { // cheap string compare every 20s
  const hhmm = new Date().toTimeString().slice(0, 5), key = today() + ' ' + hhmm;
  if (X.lastFired === key) return;
  const due = X.alarms.filter((a) => a.on && a.time === hhmm); if (!due.length) return;
  X.lastFired = key;
  due.forEach((a) => {
    if (!a.daily) a.on = false;
    beep(); mood('excited'); bounce(); shout(`Hey! ${a.label} time! ⏰`, 8000); setTimeout(applyMood, 5000);
    if ('Notification' in window && Notification.permission === 'granted') new Notification('CozyDesk', { body: a.label });
  });
  sv(); renderAlarms();
}, 20000);

/* ---------- Study ---------- */
let stT = null, stStart = 0, stSub = '';
function renderStudy() {
  const day = X.study[today()] || {}, tot = studySec(today());
  $('#stSubs').innerHTML = [...new Set(Object.values(X.study).flatMap((d) => Object.keys(d)))].map((s) => `<option value="${esc(s)}">`).join('');
  $('#stGoal').value = X.goal;
  $('#stBar').style.width = Math.min(100, (tot / 60 / X.goal) * 100) + '%';
  $('#stSum').textContent = `Today: ${hm(tot)} of ${X.goal}m goal · Study streak (active days): ${streak()} · Pomodoros: ${S.pomos}`;
  $('#stList').innerHTML = Object.entries(day).map(([s, v]) => `<li><span class="grow">${esc(s)}</span><b>${hm(v)}</b></li>`).join('');
}
$('#stGoal').onchange = (e) => { X.goal = Math.max(10, +e.target.value || 120); sv(); renderStudy(); };
$('#stGo').onclick = () => {
  if (stT) {
    clearInterval(stT); stT = null;
    const sec = Math.min(12 * 60 * 60, Math.max(0, Math.round((Date.now() - stStart) / 1000)));
    X.study[today()] = X.study[today()] || {};
    X.study[today()][stSub] = (X.study[today()][stSub] || 0) + sec;
    if (sec > 0 && !X.days.includes(today())) { X.days.push(today()); X.days = X.days.slice(-60); }
    X.activeStudy = null;
    addXP(Math.floor(sec / 120)); sv(); $('#stGo').textContent = 'Start'; $('#stClock').textContent = ''; shout('Nice study session! 📚'); renderStudy(); return;
  }
  stSub = $('#stSub').value.trim() || 'General'; stStart = Date.now();
  X.activeStudy = { subject: stSub, startedAt: stStart }; sv();
  $('#stGo').textContent = 'Stop';
  stT = setInterval(() => { $('#stClock').textContent = stSub + ' · ' + fmt(Math.floor((Date.now() - stStart) / 1000)); }, 1000);
};
if (X.activeStudy && Date.now() - X.activeStudy.startedAt < 12 * 60 * 60 * 1000) {
  stSub = X.activeStudy.subject; stStart = +X.activeStudy.startedAt;
  $('#stGo').textContent = 'Stop';
  $('#stClock').textContent = stSub + ' · ' + fmt(Math.floor((Date.now() - stStart) / 1000));
  stT = setInterval(() => { $('#stClock').textContent = stSub + ' · ' + fmt(Math.floor((Date.now() - stStart) / 1000)); }, 1000);
} else if (X.activeStudy) { X.activeStudy = null; sv(); }

/* ---------- World clock ---------- */
const ZONES = ['Asia/Dhaka', 'Asia/Kolkata', 'Asia/Dubai', 'Asia/Tokyo', 'Europe/London', 'Europe/Amsterdam', 'Europe/Berlin', 'America/New_York', 'America/Chicago', 'America/Los_Angeles', 'Australia/Sydney'];
const zname = (z) => z.split('/')[1].replace('_', ' ');
function renderClock() {
  $('#zSel').innerHTML = ZONES.map((z) => `<option value="${z}">${zname(z)}</option>`).join('');
  $('#zList').innerHTML = X.zones.map((z) => {
    const t = new Date().toLocaleTimeString('en-GB', { timeZone: z, hour: '2-digit', minute: '2-digit' });
    return `<li data-z="${z}"><span class="grow">${zname(z)}</span><b>${t}</b><button class="del">✕</button></li>`;
  }).join('');
}
$('#zAdd').onclick = () => { const z = $('#zSel').value; if (!X.zones.includes(z)) { X.zones.push(z); sv(); renderClock(); } };
$('#zList').onclick = (e) => { const li = e.target.closest('li'); if (li && e.target.classList.contains('del')) { X.zones = X.zones.filter((z) => z !== li.dataset.z); sv(); renderClock(); } };
setInterval(() => { if (!document.hidden && $('#tab-clock').classList.contains('active')) renderClock(); }, 20000);

/* ---------- Carrot Catch ---------- */
(function game() {
  const c = $('#gcanvas'), g = c.getContext('2d');
  let run = false, score = 0, t0 = 0, last = 0, spawn = 0, bx = 210, carrots = [];
  $('#gBest').textContent = 'Best: ' + X.best;
  c.onpointermove = (e) => { const r = c.getBoundingClientRect(); bx = (e.clientX - r.left) * (c.width / r.width); if (!run) draw(30); };
  $('#gStart').onclick = () => { if (run) return; run = true; score = 0; carrots = []; t0 = last = performance.now(); spawn = 0; mood('playful'); requestAnimationFrame(loop); };
  function loop(t) {
    if (!run) return;
    const dt = (t - last) / 1000; last = t; spawn -= dt;
    if (spawn <= 0) { carrots.push({ x: 20 + Math.random() * 380, y: -10, v: 90 + Math.random() * 90 }); spawn = 0.6; }
    carrots.forEach((k) => (k.y += k.v * dt));
    carrots = carrots.filter((k) => { if (k.y > 256 && k.y < 292 && Math.abs(k.x - bx) < 34) { score++; return false; } return k.y < 310; });
    const left = 30 - (t - t0) / 1000; draw(left);
    if (left <= 0) return end();
    requestAnimationFrame(loop);
  }
  function draw(left) {
    g.fillStyle = '#fff7fb'; g.fillRect(0, 0, 420, 300);
    g.strokeStyle = '#f3dce8'; g.lineWidth = 1;
    for (let y = 42; y < 300; y += 36) { g.beginPath(); g.moveTo(0, y); g.lineTo(420, y); g.stroke(); }
    carrots.forEach((k) => { g.fillStyle = '#f39a45'; g.beginPath(); g.moveTo(k.x - 7, k.y); g.lineTo(k.x + 7, k.y); g.lineTo(k.x, k.y + 23); g.fill(); g.fillStyle = '#78b98b'; g.fillRect(k.x - 3, k.y - 7, 6, 7); });
    g.fillStyle = '#e9a4c3'; g.beginPath(); g.roundRect(bx - 34, 276, 68, 16, 8); g.fill();
    g.fillStyle = '#77556c'; g.font = '600 14px Segoe UI'; g.fillText(`Score ${score}   Time ${Math.max(0, Math.ceil(left))}`, 12, 22);
  }
  function end() {
    run = false; if (score > X.best) X.best = score; addXP(score * 2); sv();
    $('#gBest').textContent = `Score ${score} · Best ${X.best} · +${score * 2} XP`;
    mood('excited'); bounce(); shout('Yay, so many carrots! 🥕'); setTimeout(applyMood, 3000);
  }
  draw(30);
})();


/* Local Web Audio soundscape: no external files or network requests. */
(() => {
 const toggle=$('#soundToggle'), select=$('#soundKind'), status=$('#soundStatus');
 if(!toggle||!select||!status)return;
 let ctx=null, master=null, src=null, timer=null, playing=false;
 const stop=()=>{playing=false;if(timer){clearInterval(timer);timer=null;}if(src){try{src.stop();}catch(_){}src=null;}if(master&&ctx)master.gain.setTargetAtTime(.0001,ctx.currentTime,.08);toggle.textContent='▶ Play';toggle.setAttribute('aria-pressed','false');};
 const note=(freq,dur,type='sine',vol=.025)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(.0001,ctx.currentTime);g.gain.exponentialRampToValueAtTime(vol,ctx.currentTime+.04);g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+dur);o.connect(g);g.connect(master);o.start();o.stop(ctx.currentTime+dur+.05);};
 const noise=()=>{const b=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*.4;return b;};
 const start=()=>{stop();try{ctx=ctx||new(window.AudioContext||window.webkitAudioContext)();ctx.resume();master=ctx.createGain();master.gain.value=.18;master.connect(ctx.destination);const kind=select.value;
 if(kind==='lofi'){const notes=[261.63,329.63,392,440,392,329.63,293.66,349.23];let i=0;note(notes[i++],1.3,'sine',.04);timer=setInterval(()=>{if(!playing)return;note(notes[i++%notes.length],1.3,'sine',.035);if(i%4===0)note(130.81,.5,'triangle',.02);},650);}
 else if(kind==='forest'){timer=setInterval(()=>{if(playing)note(1500+Math.random()*900,.2,'sine',.018);},1700);}
 else{src=ctx.createBufferSource();src.buffer=noise();src.loop=true;const f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=kind==='fire'?650:1200;const g=ctx.createGain();g.gain.value=kind==='fire'?.25:.16;src.connect(f);f.connect(g);g.connect(master);src.start();if(kind==='fire')timer=setInterval(()=>{if(playing)note(100+Math.random()*90,.12,'triangle',.02);},900);}
 playing=true;toggle.textContent='Ⅱ Pause';toggle.setAttribute('aria-pressed','true');status.textContent=({rain:'Rain is falling softly ☔',fire:'A tiny fireplace is crackling 🔥',lofi:'A gentle lo-fi loop is playing 🎧',forest:'Birds are singing outside 🌿'})[kind];
 }catch(_){status.textContent='Audio is unavailable in this browser.';stop();}};
 toggle.addEventListener('click',()=>playing?stop():start());select.addEventListener('change',()=>{if(playing)start();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing)stop();});
})();
document.addEventListener('click',event=>{
 if(event.target.closest('#tStart'))setTimeout(()=>{const b=$('#tStart');if(b&&(b.textContent==='Pause'||b.textContent==='Resume')){goto('desk');mood('focused');shout('Study time! I’m at the desk with you 📚',3200);}else if(b&&b.textContent==='Start'){goto('center');applyMood();}},0);
 if(event.target.closest('#tReset')){goto('center');applyMood();}
});

renderRoom();
