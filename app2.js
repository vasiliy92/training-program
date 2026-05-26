function openExercise(idx) {
currentExerciseIdx = idx;
const ex = currentExercises[idx];
const sets = getAdjustedSets(ex.sets);
const reps = typeof ex.reps === 'number' ? getAdjustedReps(ex.reps) : ex.reps;
const ec = document.getElementById('exerciseContent');
const key = `${currentMeso}-${currentWeek}-${currentDay}-${idx}`;
if (!completedSets[key]) completedSets[key] = new Set();
let html = '';
if (ex.isSuperset) {
html += `<div class="exercise-header">
<h2>${ex.name}</h2>
<div class="meta">${sets} подходов | Запас: ${ex.reserve}</div>
</div>`;
html += `<div class="cluster-explain" style="border-color:rgba(225,112,85,0.3);background:rgba(225,112,85,0.08)">
<strong style="color:#e17055">Формат:</strong> ${buildSupersetFormat(ex)}
</div>`;
html += '<div style="margin:0 0 12px">';
ex.parts.forEach((p, pi) => {
const adjReps = getPartReps(p);
const weightHtml = p.weightKg ? `
<div style="display:flex;align-items:center;gap:8px">
<span style="font-size:15px;color:#e17055;font-weight:700">${fmtWeight(getCurrentWeight(p))}</span>
<button onclick="changeWeight(${idx},${pi},-1)" style="width:28px;height:28px;border-radius:50%;border:1px solid var(--border);background:var(--bg2);color:var(--text1);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center">−</button>
<button onclick="changeWeight(${idx},${pi},1)" style="width:28px;height:28px;border-radius:50%;border:1px solid rgba(225,112,85,0.4);background:rgba(225,112,85,0.15);color:#e17055;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center">+</button>
</div>` : '';
html += `<div style="display:flex;justify-content:space-between;align-items:baseline;padding:6px 0;border-bottom:1px solid var(--border)">
<div>
<strong style="color:var(--text1)">${adjReps} × ${p.label}</strong>
<div style="font-size:12px;color:var(--text2)">${p.pace}</div>
</div>
${weightHtml}
</div>`;
});
const progs = ex.parts.filter(p => p.progression);
if (progs.length) {
html += `<div style="margin-top:8px;padding:8px 12px;background:rgba(225,112,85,0.08);border:1px solid rgba(225,112,85,0.2);border-radius:8px;font-size:12px;color:var(--text2);line-height:1.5">
<strong style="color:#e17055">Как растёт вес:</strong> Вес НЕ меняется автоматически. Жмите <span style="color:#e17055;font-weight:700">+</span> только если на этой тренировке все повторения во всех подходах даются с запасом 3+ (могли бы ещё 3 сделать). Не готовы — вес остаётся. Это нормально.`;
progs.forEach(p => {
html += `<div style="margin-top:4px">${p.label}: ${p.progression}</div>`;
});
html += `</div>`;
}
html += '</div>';
html += '<div style="margin:16px 0">';
for (let s = 0; s < sets; s++) {
const done = completedSets[key].has(s);
const partsReps = ex.parts.map(p => {
const r = getPartReps(p);
return `${r} ${p.label}`;
}).join(' + ');
html += `
<div class="set-row">
<div class="set-num ${done?'done':''}">${s+1}</div>
<div class="set-info">
<div class="set-reps">${partsReps}</div>
<div class="set-detail">${ex.parts.map(p => `${getPartReps(p)} ${p.label}`).join(' → ')} → отдых</div>
</div>
<div class="set-check ${done?'done':''}" onclick="toggleSet(${idx},${s},this)"></div>
</div>`;
}
html += '</div>';
const doneCount = completedSets[key].size;
const pct = Math.round(doneCount / sets * 100);
html += `<div class="progress-text" style="font-size:13px;color:var(--text2);margin-bottom:4px">Прогресс: ${doneCount}/${sets}</div>
<div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:${pct}%"></div></div>`;
if (ex.rest) {
html += `
<div class="timer-section" id="timerSection">
<div class="timer-label">Отдых между подходами</div>
<div class="timer-display" id="timerDisplay">${fmt(ex.rest)}</div>
<div class="timer-btns">
<button class="timer-btn start" id="timerStartBtn" onclick="startTimer(${ex.rest})">Старт</button>
<button class="timer-btn skip" onclick="resetTimer(${ex.rest})">Сброс</button>
</div>
</div>`;
}
html += `
<div class="tech-toggle" onclick="toggleTech(this)">
<span class="arrow">▶</span> Техника выполнения
</div>
<div class="tech-content">
${ex.technique.map((step, i) => `<div class="tech-step"><div class="tech-step-num">${i+1}</div><div>${step}</div></div>`).join('')}
</div>`;
html += `<div class="why-box"><strong>Зачем:</strong> ${ex.why}</div>`;
} else if (ex.isClusterSuperset) {
html += `<div class="exercise-header">
<h2>${ex.name}</h2>
<div class="meta">${sets} раундов | Запас: ${ex.reserve}</div>
</div>`;
html += `<div class="cluster-explain" style="border-color:rgba(225,112,85,0.3);background:rgba(225,112,85,0.08)">
<strong style="color:#e17055">Формат:</strong> ${ex.clusterFormat}
</div>`;
const pullMicros = ex.pullReps.split('+');
const pushMicros = ex.pushReps.split('+');
html += '<div style="margin:0 0 12px">';
html += `<div style="padding:6px 0;border-bottom:1px solid var(--border)">
<strong style="color:var(--text1)">Кластер подтягиваний: ${ex.pullReps}</strong>
<div style="font-size:12px;color:var(--text2)">${pullMicros.join(' → ' + ex.restInner + 'с → ')} = ${ex.pullTotal} подтягиваний</div>
</div>`;
html += `<div style="padding:6px 0;border-bottom:1px solid var(--border)">
<strong style="color:var(--text1)">Кластер отжиманий: ${ex.pushReps}</strong>
<div style="font-size:12px;color:var(--text2)">${pushMicros.join(' → ' + ex.restInner + 'с → ')} = ${ex.pushTotal} отжиманий</div>
</div>`;
html += `<div style="margin-top:8px;font-size:12px;color:var(--text2)">
Итого за раунд: <strong>${ex.pullTotal} подтягиваний</strong> + <strong>${ex.pushTotal} отжиманий</strong> → отдых ${fmtRest(ex.rest)}
</div>`;
html += '</div>';
html += '<div style="margin:16px 0">';
for (let s = 0; s < sets; s++) {
const done = completedSets[key].has(s);
html += `
<div class="set-row">
<div class="set-num ${done?'done':''}">${s+1}</div>
<div class="set-info">
<div class="set-reps">Раунд ${s+1}: кластер подт (${ex.pullReps}) + кластер отж (${ex.pushReps})</div>
<div class="set-detail">${ex.pullTotal} подт + ${ex.pushTotal} отж → отдых ${fmtRest(ex.rest)}</div>
</div>
<div class="set-check ${done?'done':''}" onclick="toggleSet(${idx},${s},this)"></div>
</div>`;
}
html += '</div>';
const doneCountCS = completedSets[key].size;
const pctCS = Math.round(doneCountCS / sets * 100);
const totalPull = ex.pullTotal * sets;
const totalPush = ex.pushTotal * sets;
const donePull = ex.pullTotal * doneCountCS;
const donePush = ex.pushTotal * doneCountCS;
html += `<div class="progress-text" style="font-size:13px;color:var(--text2);margin-bottom:4px">Прогресс: ${doneCountCS}/${sets} раундов | ${donePull}/${totalPull} подт + ${donePush}/${totalPush} отж</div>
<div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:${pctCS}%"></div></div>`;
if (ex.rest) {
html += `
<div class="timer-section" id="timerSection">
<div class="timer-label">Отдых между раундами</div>
<div class="timer-display" id="timerDisplay">${fmt(ex.rest)}</div>
<div class="timer-btns">
<button class="timer-btn start" id="timerStartBtn" onclick="startTimer(${ex.rest})">Старт</button>
<button class="timer-btn skip" onclick="resetTimer(${ex.rest})">Сброс</button>
</div>
</div>`;
}
if (ex.restInner) {
html += `
<div class="timer-section" id="innerTimerSection" style="margin-top:8px;border-color:var(--border)">
<div class="timer-label">Пауза между микро-подходами</div>
<div class="timer-display" id="innerTimerDisplay" style="font-size:36px">${fmt(ex.restInner)}</div>
<div class="timer-btns">
<button class="timer-btn start" id="innerTimerStartBtn" onclick="startInnerTimer(${ex.restInner})">Старт</button>
<button class="timer-btn skip" onclick="resetInnerTimer(${ex.restInner})">Сброс</button>
</div>
</div>`;
}
html += `
<div class="tech-toggle" onclick="toggleTech(this)">
<span class="arrow">▶</span> Техника выполнения
</div>
<div class="tech-content">
${ex.technique.map((step, i) => `<div class="tech-step"><div class="tech-step-num">${i+1}</div><div>${step}</div></div>`).join('')}
</div>`;
html += `<div class="why-box"><strong>Зачем:</strong> ${ex.why}</div>`;
} else {
html += `<div class="exercise-header">
<h2>${ex.name}</h2>
<div class="meta">${sets} × ${reps} | Запас: ${ex.reserve} | ${ex.pace}</div>
${ex.weight ? `<div class="meta" style="color:#e17055;font-weight:600">Вес: ${ex.weight}</div>` : ''}
${ex.progression ? `<div class="meta" style="font-size:12px;font-style:italic">Прогрессия: ${ex.progression}</div>` : ''}
</div>`;
if (ex.isLadder) {
const steps = reps.split('-');
const totalReps = steps.reduce((a, b) => a + parseInt(b), 0);
html += `<div style="margin:0 0 12px;padding:8px 12px;background:rgba(253,203,110,0.06);border:1px solid rgba(253,203,110,0.15);border-radius:8px">`;
html += `<div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap">`;
steps.forEach((step, si) => {
html += `<span style="background:rgba(253,203,110,0.15);color:var(--orange);font-weight:700;font-size:14px;padding:4px 10px;border-radius:6px">${step}</span>`;
if (si < steps.length - 1) {
html += `<span style="color:var(--text2);font-size:11px">${ex.restInner}с</span>`;
}
});
html += `</div>`;
html += `<div style="margin-top:8px;font-size:12px;color:var(--text2)">${totalReps} повторений за раунд → отдых ${fmtRest(ex.rest)}</div>`;
html += `</div>`;
html += '<div style="margin:16px 0">';
for (let s = 0; s < sets; s++) {
const done = completedSets[key].has(s);
html += `
<div class="set-row">
<div class="set-num ${done?'done':''}">${s+1}</div>
<div class="set-info">
<div class="set-reps">Раунд ${s+1}</div>
<div class="set-detail">${totalReps} повторений</div>
</div>
<div class="set-check ${done?'done':''}" onclick="toggleSet(${idx},${s},this)"></div>
</div>`;
}
html += '</div>';
const doneCountL = completedSets[key].size;
const pctL = Math.round(doneCountL / sets * 100);
html += `<div class="progress-text" style="font-size:13px;color:var(--text2);margin-bottom:4px">Прогресс: ${doneCountL}/${sets} раунда</div>
<div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:${pctL}%"></div></div>`;
if (ex.rest) {
html += `
<div class="timer-section" id="timerSection">
<div class="timer-label">Отдых между раундами</div>
<div class="timer-display" id="timerDisplay">${fmt(ex.rest)}</div>
<div class="timer-btns">
<button class="timer-btn start" id="timerStartBtn" onclick="startTimer(${ex.rest})">Старт</button>
<button class="timer-btn skip" onclick="resetTimer(${ex.rest})">Сброс</button>
</div>
</div>`;
}
if (ex.restInner) {
html += `
<div class="timer-section" id="innerTimerSection" style="margin-top:8px;border-color:var(--border)">
<div class="timer-label">Пауза между ступенями</div>
<div class="timer-display" id="innerTimerDisplay" style="font-size:36px">${fmt(ex.restInner)}</div>
<div class="timer-btns">
<button class="timer-btn start" id="innerTimerStartBtn" onclick="startInnerTimer(${ex.restInner})">Старт</button>
<button class="timer-btn skip" onclick="resetInnerTimer(${ex.restInner})">Сброс</button>
</div>
</div>`;
}
html += `
<div class="tech-toggle" onclick="toggleTech(this)">
<span class="arrow">▶</span> Техника выполнения
</div>
<div class="tech-content">
${ex.technique.map((step, i) => `<div class="tech-step"><div class="tech-step-num">${i+1}</div><div>${step}</div></div>`).join('')}
</div>`;
html += `<div class="why-box"><strong>Зачем:</strong> ${ex.why}</div>`;
ec.innerHTML = html;
showScreen('exercise');
return;
} else if (ex.isEmom) {
html += `<div class="cluster-explain" style="border-color:rgba(116,185,255,0.3);background:rgba(116,185,255,0.08)"><strong>EMOM:</strong> Каждую минуту — ${ex.reps} повторений. Остаток минуты — отдых. Всего ${ex.emomMinutes} минут.</div>`;
}
html += '<div style="margin:16px 0">';
for (let s = 0; s < sets; s++) {
const done = completedSets[key].has(s);
const repDisplay = typeof reps === 'string' ? reps.split('-')[Math.min(s, reps.split('-').length-1)] || reps : reps;
html += `
<div class="set-row">
<div class="set-num ${done?'done':''}">${s+1}</div>
<div class="set-info">
<div class="set-reps">${repDisplay} повторений</div>
<div class="set-detail">${ex.pace}</div>
</div>
<div class="set-check ${done?'done':''}" onclick="toggleSet(${idx},${s},this)"></div>
</div>`;
}
html += '</div>';
const doneCount = completedSets[key].size;
const pct = Math.round(doneCount / sets * 100);
html += `<div class="progress-text" style="font-size:13px;color:var(--text2);margin-bottom:4px">Прогресс: ${doneCount}/${sets}</div>
<div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:${pct}%"></div></div>`;
if (ex.rest) {
html += `
<div class="timer-section" id="timerSection">
<div class="timer-label">Отдых между подходами</div>
<div class="timer-display" id="timerDisplay">${fmt(ex.rest)}</div>
<div class="timer-btns">
<button class="timer-btn start" id="timerStartBtn" onclick="startTimer(${ex.rest})">Старт</button>
<button class="timer-btn skip" onclick="resetTimer(${ex.rest})">Сброс</button>
</div>
</div>`;
}
html += `
<div class="tech-toggle" onclick="toggleTech(this)">
<span class="arrow">▶</span> Техника выполнения
</div>
<div class="tech-content">
${ex.technique.map((step, i) => `<div class="tech-step"><div class="tech-step-num">${i+1}</div><div>${step}</div></div>`).join('')}
</div>`;
html += `<div class="why-box"><strong>Зачем:</strong> ${ex.why}</div>`;
}
ec.innerHTML = html;
showScreen('exercise');
}
function changeWeight(exIdx, partIdx, direction) {
const ex = currentExercises[exIdx];
const part = ex.parts[partIdx];
if (!part.weightKg) return;
if (direction > 0) increaseWeight(part);
else decreaseWeight(part);
openExercise(exIdx);
}
function toggleSet(exIdx, setIdx, el) {
const key = `${currentMeso}-${currentWeek}-${currentDay}-${exIdx}`;
if (!completedSets[key]) completedSets[key] = new Set();
if (completedSets[key].has(setIdx)) {
completedSets[key].delete(setIdx);
el.classList.remove('done');
el.parentElement.querySelector('.set-num').classList.remove('done');
} else {
completedSets[key].add(setIdx);
el.classList.add('done');
el.parentElement.querySelector('.set-num').classList.add('done');
}
const ex = currentExercises[exIdx];
const sets = getAdjustedSets(ex.sets);
const doneCount = completedSets[key].size;
const pct = Math.round(doneCount / sets * 100);
const fills = document.querySelectorAll('.progress-bar-fill');
if (fills.length) fills[0].style.width = pct + '%';
const progText = document.querySelector('.progress-text');
if (progText) {
let label = 'подходов';
if (ex.isClusterSuperset || ex.isLadder) label = 'раундов';
progText.textContent = `Прогресс: ${doneCount}/${sets} ${label}`;
}
}
function startTimer(total) {
if (timerRunning) {
clearInterval(timerInterval);
timerRunning = false;
document.getElementById('timerStartBtn').textContent = 'Старт';
document.getElementById('timerDisplay').classList.remove('running');
return;
}
timerSeconds = total;
timerRunning = true;
document.getElementById('timerStartBtn').textContent = 'Пауза';
document.getElementById('timerDisplay').classList.add('running');
timerInterval = setInterval(() => {
timerSeconds--;
const display = document.getElementById('timerDisplay');
display.textContent = fmt(timerSeconds);
if (timerSeconds <= 0) {
clearInterval(timerInterval);
timerRunning = false;
display.classList.remove('running');
display.classList.add('done');
display.textContent = 'ВРЕМЯ!';
document.getElementById('timerStartBtn').textContent = 'Старт';
if (navigator.vibrate) navigator.vibrate([200,100,200]);
}
}, 1000);
}
function resetTimer(total) {
clearInterval(timerInterval);
timerRunning = false;
timerSeconds = total;
const display = document.getElementById('timerDisplay');
display.textContent = fmt(total);
display.classList.remove('running','done');
document.getElementById('timerStartBtn').textContent = 'Старт';
}
let innerTimerInterval = null;
let innerTimerRunning = false;
let innerTimerSeconds = 0;
function startInnerTimer(total) {
if (innerTimerRunning) {
clearInterval(innerTimerInterval);
innerTimerRunning = false;
document.getElementById('innerTimerStartBtn').textContent = 'Старт';
document.getElementById('innerTimerDisplay').classList.remove('running');
return;
}
innerTimerSeconds = total;
innerTimerRunning = true;
document.getElementById('innerTimerStartBtn').textContent = 'Пауза';
document.getElementById('innerTimerDisplay').classList.add('running');
innerTimerInterval = setInterval(() => {
innerTimerSeconds--;
const display = document.getElementById('innerTimerDisplay');
display.textContent = fmt(innerTimerSeconds);
if (innerTimerSeconds <= 0) {
clearInterval(innerTimerInterval);
innerTimerRunning = false;
display.classList.remove('running');
display.classList.add('done');
display.textContent = 'ВРЕМЯ!';
document.getElementById('innerTimerStartBtn').textContent = 'Старт';
if (navigator.vibrate) navigator.vibrate([100,50,100]);
}
}, 1000);
}
function resetInnerTimer(total) {
clearInterval(innerTimerInterval);
innerTimerRunning = false;
innerTimerSeconds = total;
const display = document.getElementById('innerTimerDisplay');
display.textContent = fmt(total);
display.classList.remove('running','done');
document.getElementById('innerTimerStartBtn').textContent = 'Старт';
}
function toggleTech(el) {
el.classList.toggle('open');
el.nextElementSibling.classList.toggle('open');
}
document.querySelectorAll('.meso-tab').forEach(t => {
t.addEventListener('click', () => {
currentMeso = parseInt(t.dataset.meso);
currentWeek = 1;
renderHome();
});
});
renderHome();