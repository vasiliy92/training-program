const PROGRAM = { 1: MESO1, 2: MESO2, 3: MESO3 };
let currentMeso = 1;
let currentWeek = 1;
let currentDay = null;
let currentExerciseIdx = 0;
let timerInterval = null;
let timerSeconds = 0;
let timerRunning = false;
let completedSets = {};
let currentExercises = [];
function getWeightKey(part) { return 'w_' + part.label.replace(/[^a-zа-яё0-9]/gi, ''); }
const _ls = {
get(key) { try { return localStorage.getItem(key); } catch(e) { return null; } },
set(key, val) { try { localStorage.setItem(key, val); } catch(e) {} },
};
function getCurrentWeight(part) {
if (!part.weightKg) return null;
const saved = _ls.get(getWeightKey(part));
return saved ? parseFloat(saved) : part.weightKg;
}
function increaseWeight(part) {
const current = getCurrentWeight(part);
const newWeight = Math.round((current + part.weightStep) * 10) / 10;
_ls.set(getWeightKey(part), newWeight);
return newWeight;
}
function decreaseWeight(part) {
const current = getCurrentWeight(part);
const newWeight = Math.round((current - part.weightStep) * 10) / 10;
if (newWeight < part.weightKg * 0.5) return current;
_ls.set(getWeightKey(part), newWeight);
return newWeight;
}
function fmtWeight(kg) { return kg % 1 === 0 ? kg + ' кг' : kg.toFixed(1) + ' кг'; }
function fmt(s) {
const m = Math.floor(s/60);
const sec = s%60;
return `${m}:${sec.toString().padStart(2,'0')}`;
}
function fmtRest(s) {
if (s >= 60) {
const m = Math.floor(s/60);
const sec = s%60;
return sec ? `${m} мин ${sec} с` : `${m} мин`;
}
return `${s} с`;
}
function getMesoData() { return PROGRAM[currentMeso]; }
function getDayData(day) { return getMesoData().days[day]; }
function getWeekOffset() {
const baseWeeks = {1:1, 2:5, 3:9};
return baseWeeks[currentMeso] - 1;
}
function isDeload() { return currentWeek === 4; }
function getAdjustedReps(baseReps) {
if (typeof baseReps === 'string') return baseReps;
const weekInMeso = currentWeek;
if (weekInMeso === 4) return Math.max(1, Math.round(baseReps * 0.7));
return baseReps + (weekInMeso - 1);
}
function getAdjustedSets(baseSets) {
if (currentWeek === 4) return Math.max(1, Math.round(baseSets / 2));
return baseSets;
}
function getPartReps(p) {
return p.fixedReps ? (isDeload() ? Math.max(1, Math.round(p.reps * 0.7)) : p.reps) : getAdjustedReps(p.reps);
}
function buildSupersetFormat(ex) {
if (!ex.parts) return '';
const parts = ex.parts.map(p => {
const reps = getPartReps(p);
const w = p.weightKg ? ' (' + fmtWeight(getCurrentWeight(p)) + ')' : '';
return p.label + ' ' + reps + w;
}).join(' → сразу ');
const restText = ex.rest >= 60 ? `${Math.floor(ex.rest/60)} мин ${ex.rest%60?ex.rest%60+' с':''}`.trim() : `${ex.rest} с`;
return `${parts} → отдых ${restText}`;
}
function showScreen(name) {
document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
const map = {home:'screenHome', workout:'screenWorkout', exercise:'screenExercise', warmup:'screenWarmup', cooldown:'screenCooldown', flags:'screenFlags'};
document.getElementById(map[name]).classList.add('active');
document.querySelectorAll('.bottom-nav button').forEach(b => b.classList.remove('active'));
const navMap = {home:0, warmup:1, cooldown:2, flags:3};
if (navMap[name] !== undefined) {
document.querySelectorAll('.bottom-nav button')[navMap[name]].classList.add('active');
}
if (name === 'home') renderHome();
window.scrollTo(0,0);
}
function renderHome() {
const meso = getMesoData();
const wb = document.getElementById('weekBadge');
const realWeek = getWeekOffset() + currentWeek;
wb.textContent = isDeload() ? `Неделя ${realWeek} — Разгрузка` : `Неделя ${realWeek}`;
document.getElementById('homePullups').textContent = meso.pullVol;
document.getElementById('homePushups').textContent = meso.pushVol;
document.querySelectorAll('.meso-tab').forEach(t => {
t.classList.toggle('active', parseInt(t.dataset.meso) === currentMeso);
});
const ws = document.getElementById('weekSelector');
ws.innerHTML = '';
for (let w = 1; w <= 4; w++) {
const d = document.createElement('div');
d.className = 'week-btn' + (w === currentWeek ? ' active' : '') + (w === 4 ? ' deload' : '');
d.dataset.week = w;
d.textContent = w === 4 ? '4 ⚡' : w;
d.onclick = () => { currentWeek = w; renderHome(); };
ws.appendChild(d);
}
const dc = document.getElementById('dayCards');
dc.innerHTML = '';
const days = ['mon','wed','fri'];
days.forEach(day => {
const dd = getDayData(day);
const card = document.createElement('div');
card.className = `card card-clickable day-card ${dd.css}`;
card.setAttribute('data-day', day);
card.setAttribute('role', 'button');
card.setAttribute('tabindex', '0');
if (isDeload() && day === 'wed') {
card.innerHTML = `<div class="day-label">${dd.label}</div><div class="day-title">Отдых</div><div class="day-subtitle">Разгрузочная неделя — среда свободна</div>`;
card.style.opacity = '0.4';
card.style.cursor = 'default';
card.style.pointerEvents = 'none';
card.removeAttribute('tabindex');
} else {
let totalPull = 0, totalPush = 0, exerciseCount = 0;
dd.exercises.forEach(e => {
if (e.isSuperset && e.parts) {
e.parts.forEach(p => {
const name = p.label.toLowerCase();
const sets = getAdjustedSets(e.sets);
const reps = getPartReps(p);
if (name.includes('подтяг')) totalPull += sets * reps;
if (name.includes('отжиман')) totalPush += sets * reps;
});
exerciseCount++;
} else {
const name = e.name.toLowerCase();
const sets = getAdjustedSets(e.sets);
if (typeof e.reps === 'number') {
const reps = getAdjustedReps(e.reps);
if (name.includes('подтяг')) totalPull += sets * reps;
if (name.includes('отжиман')) totalPush += sets * reps;
}
exerciseCount++;
}
});
card.innerHTML = `
<div class="day-label">${dd.label}</div>
<div class="day-title">${dd.title}${isDeload() ? ' <span class="deload-badge">РАЗГРУЗКА</span>' : ''}</div>
<div class="day-subtitle">${dd.subtitle}</div>
<div class="day-stats">
<div class="day-stat"><strong>${totalPull}</strong> подтягиваний</div>
<div class="day-stat"><strong>${totalPush}</strong> отжиманий</div>
<div class="day-stat"><strong>${exerciseCount}</strong> упражнений</div>
</div>`;
}
dc.appendChild(card);
});
}
document.addEventListener('click', function(e) {
const card = e.target.closest('.day-card[data-day]');
if (card) {
const day = card.getAttribute('data-day');
if (day) openWorkout(day);
}
});
document.addEventListener('keydown', function(e) {
if (e.key === 'Enter' || e.key === ' ') {
const card = e.target.closest('.day-card[data-day]');
if (card) {
e.preventDefault();
const day = card.getAttribute('data-day');
if (day) openWorkout(day);
}
}
});
function openWorkout(day) {
currentDay = day;
const dd = getDayData(day);
const wc = document.getElementById('workoutContent');
let title = dd.title;
if (isDeload()) title += ' <span class="deload-badge">РАЗГРУЗКА</span>';
let html = `<div class="exercise-header"><h2>${title}</h2><div class="meta">${dd.label} • ${dd.subtitle}</div></div>`;
if (dd.isCluster) {
html += `<div class="cluster-explain"><strong>Кластеры:</strong> ${dd.clusterExplain}</div>`;
}
currentExercises = dd.exercises;
if (dd.isTest) {
if (currentWeek === 2) {
currentExercises = dd.exercises.filter(e => !e.name.startsWith('Тест:'));
currentExercises.push(
{ name: "Подтягивания (доп.)", sets: 2, reps: 6, rest: 120, reserve: 3, pace: "Медленно вниз (2 с), мощно вверх",
technique: ["Техника та же"], why: "Вместо теста — дополнительный объём. Тест только на неделях 9 и 11." },
{ name: "Отжимания (доп.)", sets: 2, reps: 12, rest: 90, reserve: 3, pace: "Медленно вниз (2 с), пауза 1 с, мощно вверх",
technique: ["Техника та же"], why: "Вместо теста — дополнительный объём. Тест только на неделях 9 и 11." }
);
html += `<div class="card test-card"><p style="font-size:13px;line-height:1.5">На неделе 10 тест НЕ делается. Вместо него — 2 дополнительных подхода подтягиваний по 6 и 2 подхода отжиманий по 12. Тест только на неделях 9 и 11.</p></div>`;
} else if (isDeload()) {
currentExercises = dd.exercises.filter(e => !e.name.startsWith('Тест:'));
} else {
html += `<div class="card test-card"><p style="font-size:13px;line-height:1.5">${dd.testNote}</p></div>`;
}
}
currentExercises.forEach((ex, i) => {
const sets = getAdjustedSets(ex.sets);
const reps = typeof ex.reps === 'number' ? getAdjustedReps(ex.reps) : ex.reps;
let restText = '';
if (ex.rest) restText += `Отдых между подходами: ${fmtRest(ex.rest)}`;
if (ex.restInner) restText += ` | Внутри: ${fmtRest(ex.restInner)}`;
if (ex.isSuperset) {
const partsSummary = ex.parts.map(p => {
const r = getPartReps(p);
return `${r} ${p.label}`;
}).join(' + ');
const weightsInfo = ex.parts.filter(p => p.weightKg).map(p => `${p.label}: ${fmtWeight(getCurrentWeight(p))}`).join(' | ');
html += `
<div class="card card-clickable" onclick="openExercise(${i})">
<div class="superset-badge">${ex.name}</div>
<p>${sets} × (${partsSummary}) | Запас: ${ex.reserve}</p>
<p style="margin-top:2px;font-size:12px;color:var(--accent2)">${buildSupersetFormat(ex)}</p>
${weightsInfo ? `<p class="superset-weight">${weightsInfo}</p>` : ''}
${restText ? `<p style="margin-top:2px;font-size:12px;color:var(--accent2)">${restText}</p>` : ''}
</div>`;
return;
}
if (ex.isClusterSuperset) {
html += `
<div class="card card-clickable" onclick="openExercise(${i})">
<div class="superset-badge">${ex.name}</div>
<p>${sets} раундов | Запас: ${ex.reserve}</p>
<p style="margin-top:2px;font-size:12px;color:var(--accent2)">${ex.clusterFormat}</p>
<p style="margin-top:2px;font-size:12px;color:var(--accent2)">Итого за раунд: ${ex.pullTotal} подт + ${ex.pushTotal} отж | ${restText}</p>
</div>`;
return;
}
html += `
<div class="card card-clickable" onclick="openExercise(${i})">
<h3>${ex.name}</h3>
${ex.isLadder ? `<p>${sets} раунда × лестница (${reps}) | Запас: ${ex.reserve}</p>
<p style="margin-top:2px;font-size:12px;color:var(--orange)">${ex.ladderFormat}</p>` :
ex.isEmom ? `<p>${ex.emomMinutes} мин | ${reps} повторений/мин | Запас: ${ex.reserve}</p>` :
`<p>${sets} × ${reps} | Запас: ${ex.reserve} | ${ex.pace}</p>
${ex.weight ? `<p class="superset-weight">Вес: ${ex.weight}</p>` : ''}
${ex.progression ? `<p class="superset-progression">Прогрессия: ${ex.progression}</p>` : ''}
${ex.isCluster ? `<p style="margin-top:4px;font-size:12px;color:var(--green)">${ex.clusterFormat}</p>` : ''}`}
${restText && !ex.isLadder ? `<p style="margin-top:4px;font-size:12px;color:var(--accent2)">${restText}</p>` : ''}
</div>`;
});
html += `
<div class="tech-toggle" onclick="toggleTech(this)" style="margin-top:20px">
<span class="arrow">▶</span> Правила регрессии и мониторинг
</div>
<div class="tech-content">
<div class="tech-step"><div class="tech-step-num">1</div><div><strong>Не можете выполнить 2 подхода подряд?</strong> — урежьте повторения на 20%. Лучше меньше, но качественно.</div></div>
<div class="tech-step"><div class="tech-step-num">2</div><div><strong>Утренняя готовность &lt; 6/10 два дня подряд?</strong> — урежьте объём на 30%. Это сигнал о накопленной усталости.</div></div>
<div class="tech-step"><div class="tech-step-num">3</div><div><strong>Боль в локте/плече?</strong> — немедленно остановите подход. Замените обратный хват на нейтральный. Увеличьте паузу между тренировками до 72 ч.</div></div>
<div class="tech-step"><div class="tech-step-num">4</div><div><strong>Неделя 1 нового мезоцикла?</strong> — первые 2 подхода каждого упражнения сделайте на 1 повторение меньше. Организм адаптируется к новому объёму.</div></div>
</div>`;
wc.innerHTML = html;
showScreen('workout');
}