/* BB STORE – ENGLISH PWA – Extreme Student Edition */
const state = {
  lessons: null,
  questions: null,
  chapters: null,
  currentView: 'home',
  teachIndex: 0,
  practiceIndex: 0,
  practiceFilter: 'all',
  practiceWrongOnly: false,
  wrongIds: JSON.parse(localStorage.getItem('bb_wrong_ids') || '[]'),
  testIndex: 0,
  testAnswers: {},
  testStarted: false,
  selectedOption: null,
  speech: window.speechSynthesis,
  taughtIds: JSON.parse(localStorage.getItem('bb_taught') || '[]')
};

function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const el = document.getElementById('view-' + name);
  if (el) { el.classList.add('active'); state.currentView = name; }
  if (name === 'learn') renderTeach();
  if (name === 'rules') renderRules();
  if (name === 'practice') startPractice();
  if (name === 'results') renderResults();
  if (name === 'contrasts') renderContrasts();
  if (name === 'checklist') renderChecklist();
}
document.querySelectorAll('[data-view]').forEach(btn => {
  btn.addEventListener('click', () => showView(btn.dataset.view));
});

async function loadData() {
  try {
    const [lessons, questions, chapters] = await Promise.all([
      fetch('data/lessons.json').then(r => r.json()),
      fetch('data/questions.json').then(r => r.json()),
      fetch('data/chapters.json').then(r => r.json()).catch(() => [])
    ]);
    state.lessons = lessons;
    state.questions = questions;
    state.chapters = chapters;
    updateHomeProgress();
    console.log('BB STORE loaded:', questions.length, 'questions');
  } catch (e) {
    console.error('Failed to load data', e);
  }
}

function updateHomeProgress() {
  const taught = state.taughtIds.length;
  const totalRules = (state.lessons?.sections || []).filter(s => s.rule_number).length || 12;
  const practiceDone = parseInt(localStorage.getItem('bb_practice_count') || '0');
  const testPct = parseInt(localStorage.getItem('bb_progress') || '0');
  const teachPct = Math.min(100, Math.round((taught / totalRules) * 100));
  const pracPct = Math.min(100, Math.round((practiceDone / 50) * 100));
  const overall = Math.round(teachPct * 0.3 + pracPct * 0.3 + testPct * 0.4);
  const bar = document.getElementById('home-progress');
  const pctEl = document.getElementById('progress-pct');
  if (bar) bar.style.width = overall + '%';
  if (pctEl) pctEl.textContent = overall;
}

function getTeachSections() {
  if (!state.lessons) return [];
  return state.lessons.sections.filter(s =>
    s.type === 'rule' || s.type === 'interactive_examples' || s.type === 'checklist' || !s.type
  );
}

function renderTeach() {
  if (!state.lessons) return;
  const sections = getTeachSections();
  if (!sections.length) return;
  if (state.teachIndex >= sections.length) state.teachIndex = 0;
  const s = sections[state.teachIndex];
  const card = document.getElementById('teach-card');
  if (!card) return;
  let html = `<div class="teach-step">`;
  if (s.rule_number) html += `<div class="rule-badge">Rule ${s.rule_number}</div>`;
  html += `<h2>${s.title}</h2>`;
  html += `<p class="source">${s.source_content || s.description || ''}</p>`;
  if (s.bengali_explanation) {
    html += `<div class="bn-box"><span class="bn-label">বাংলা</span><p class="bn">${s.bengali_explanation}</p></div>`;
  }
  if (s.student_tip) html += `<div class="tip-box">💡 <strong>Student Tip:</strong> ${s.student_tip}</div>`;
  if (s.note) html += `<div class="note-box">⚠️ ${s.note}</div>`;
  if (Array.isArray(s.categories)) {
    html += `<div class="categories">`;
    s.categories.forEach(cat => {
      html += `<div class="cat-card"><h4>${cat.name}</h4><div class="cat-examples">${(cat.examples || []).map(e => `<span class="chip">${e}</span>`).join('')}</div>${cat.note ? `<p class="cat-note">${cat.note}</p>` : ''}</div>`;
    });
    html += `</div>`;
  }
  if (Array.isArray(s.examples) && s.examples.length) {
    html += `<div class="examples-block"><h4>Examples</h4>`;
    s.examples.forEach(ex => { html += `<div class="example">${typeof ex === 'string' ? ex : JSON.stringify(ex)}</div>`; });
    html += `</div>`;
  }
  if (Array.isArray(s.key_contrast)) {
    html += `<div class="contrast-block"><h4>Key Contrasts</h4>`;
    s.key_contrast.forEach(c => {
      html += `<div class="contrast-row"><span class="c-phrase">${c.phrase}</span><span class="c-arrow">→</span><span class="c-meaning">${c.meaning}</span></div>`;
    });
    html += `</div>`;
  }
  if (Array.isArray(s.items)) {
    html += `<ul class="checklist">`;
    s.items.forEach(item => { html += `<li>${item}</li>`; });
    html += `</ul>`;
  }
  html += `</div>`;
  card.innerHTML = html;
  if (s.id && !state.taughtIds.includes(s.id)) {
    state.taughtIds.push(s.id);
    localStorage.setItem('bb_taught', JSON.stringify(state.taughtIds));
    updateHomeProgress();
  }
  const counter = document.getElementById('teach-counter');
  if (counter) counter.textContent = `${state.teachIndex + 1} / ${sections.length}`;
}

document.getElementById('teach-next')?.addEventListener('click', () => {
  const sections = getTeachSections();
  if (state.teachIndex < sections.length - 1) { state.teachIndex++; renderTeach(); window.scrollTo(0, 0); }
});
document.getElementById('teach-prev')?.addEventListener('click', () => {
  if (state.teachIndex > 0) { state.teachIndex--; renderTeach(); window.scrollTo(0, 0); }
});

function speak(text, lang = 'en-IN') {
  if (!state.speech || !text) return;
  state.speech.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang; u.rate = 0.9;
  state.speech.speak(u);
}
document.getElementById('btn-play')?.addEventListener('click', () => {
  const sections = getTeachSections();
  const s = sections[state.teachIndex];
  if (s) speak([s.title, s.source_content, s.student_tip].filter(Boolean).join('. '));
});
document.getElementById('btn-pause')?.addEventListener('click', () => state.speech?.pause());
document.getElementById('btn-stop')?.addEventListener('click', () => state.speech?.cancel());

function renderRules() {
  const container = document.getElementById('all-rules');
  if (!container || !state.lessons) return;
  container.innerHTML = state.lessons.sections.filter(s => s.rule_number).map(s => `
    <div class="rule-item" onclick="jumpToTeach('${s.id}')">
      <h3>Rule ${s.rule_number}: ${s.title}</h3>
      <p>${(s.source_content || '').slice(0, 140)}${(s.source_content || '').length > 140 ? '…' : ''}</p>
      <p class="bn">${s.bengali_explanation || ''}</p>
    </div>`).join('');
}
function jumpToTeach(id) {
  const sections = getTeachSections();
  const idx = sections.findIndex(s => s.id === id);
  if (idx >= 0) { state.teachIndex = idx; showView('learn'); }
}

function renderContrasts() {
  const el = document.getElementById('contrasts-content');
  if (!el || !state.lessons) return;
  const section = state.lessons.sections.find(s => s.id === 'key-contrasts' || s.type === 'interactive_examples');
  if (!section) { el.innerHTML = '<p class="empty-msg">Contrasts loading…</p>'; return; }
  let html = `<h2>${section.title}</h2><p class="muted">${section.description || ''}</p><div class="contrast-list">`;
  (section.examples || []).forEach(ex => { html += `<div class="contrast-card">${ex}</div>`; });
  html += `</div>`;
  el.innerHTML = html;
}

function renderChecklist() {
  const el = document.getElementById('checklist-content');
  if (!el || !state.lessons) return;
  const section = state.lessons.sections.find(s => s.id === 'student-checklist');
  if (!section) { el.innerHTML = '<p class="empty-msg">Checklist loading…</p>'; return; }
  let html = `<h2>${section.title}</h2><ul class="checklist big">`;
  (section.items || []).forEach((item, i) => {
    const done = localStorage.getItem('check_' + i) === '1';
    html += `<li class="${done ? 'done' : ''}"><label><input type="checkbox" ${done ? 'checked' : ''} onchange="toggleCheck(${i}, this.checked)"> ${item}</label></li>`;
  });
  html += `</ul>`;
  el.innerHTML = html;
}
function toggleCheck(i, checked) { localStorage.setItem('check_' + i, checked ? '1' : '0'); }

function getPracticePool() {
  let qs = state.questions || [];
  if (state.practiceWrongOnly && state.wrongIds.length) qs = qs.filter(q => state.wrongIds.includes(q.id));
  if (state.practiceFilter !== 'all') {
    qs = qs.filter(q => (q.topic || '').toLowerCase().includes(state.practiceFilter.toLowerCase()) || (q.rule || '') === state.practiceFilter);
  }
  return qs.length ? qs : (state.questions || []);
}

function startPractice() {
  state.practiceIndex = 0;
  state.selectedOption = null;
  renderPracticeFilterBar();
  renderPracticeQ();
}

function renderPracticeFilterBar() {
  const bar = document.getElementById('practice-filters');
  if (!bar) return;
  const topics = ['all', 'A and An', 'The', 'Omission', 'Repetition', 'Mixed', 'Error Correction'];
  bar.innerHTML = topics.map(t =>
    `<button class="filter-chip ${state.practiceFilter === t ? 'active' : ''}" data-filter="${t}">${t === 'all' ? 'All' : t}</button>`
  ).join('') +
  `<button class="filter-chip ${state.practiceWrongOnly ? 'active wrong' : ''}" id="btn-wrong-only">Wrong only (${state.wrongIds.length})</button>`;
  bar.querySelectorAll('[data-filter]').forEach(btn => {
    btn.onclick = () => { state.practiceFilter = btn.dataset.filter; state.practiceIndex = 0; renderPracticeFilterBar(); renderPracticeQ(); };
  });
  document.getElementById('btn-wrong-only')?.addEventListener('click', () => {
    state.practiceWrongOnly = !state.practiceWrongOnly;
    state.practiceIndex = 0;
    renderPracticeFilterBar();
    renderPracticeQ();
  });
}

function renderPracticeQ() {
  const qs = getPracticePool();
  if (!qs.length) { document.getElementById('pq-text').textContent = 'No questions match this filter.'; return; }
  const q = qs[state.practiceIndex % qs.length];
  document.getElementById('pq-meta').textContent = `${q.id} · ${q.topic} · Rule ${q.rule} · ${q.difficulty}`;
  document.getElementById('pq-text').textContent = q.question;
  const optsEl = document.getElementById('pq-options');
  optsEl.innerHTML = '';
  state.selectedOption = null;
  document.getElementById('pq-feedback').hidden = true;
  document.getElementById('pq-next').hidden = true;
  document.getElementById('pq-submit').hidden = false;
  if (q.type === 'mcq' && q.options?.length) {
    q.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'opt-btn';
      btn.textContent = opt;
      btn.onclick = () => {
        optsEl.querySelectorAll('.opt-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        state.selectedOption = opt;
      };
      optsEl.appendChild(btn);
    });
  } else {
    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'fill-input';
    input.placeholder = q.type === 'error' ? 'Type the corrected sentence…' : 'Type your answer…';
    input.autocomplete = 'off';
    input.style.cssText = 'width:100%;padding:0.85rem;border-radius:10px;border:2px solid #475569;background:#1e293b;color:#f1f5f9;font-size:1rem;';
    optsEl.appendChild(input);
    input.focus();
  }
}

function isAnswerCorrect(q, userAns) {
  const correct = String(q.answer).toLowerCase().trim();
  const given = String(userAns || '').toLowerCase().trim();
  if (!given) return false;
  if (given === correct) return true;
  if (correct.includes('/') && given.replace(/\s/g, '') === correct.replace(/\s/g, '')) return true;
  if (q.type === 'error') {
    const keyParts = correct.split(/[.\/]/).map(s => s.trim()).filter(Boolean);
    return keyParts.some(p => given.includes(p.toLowerCase()));
  }
  return given.includes(correct) || correct.includes(given);
}

document.getElementById('pq-submit')?.addEventListener('click', () => {
  const qs = getPracticePool();
  const q = qs[state.practiceIndex % qs.length];
  let userAns = state.selectedOption;
  const fill = document.getElementById('fill-input');
  if (fill) userAns = fill.value.trim();
  const feedback = document.getElementById('pq-feedback');
  const ok = isAnswerCorrect(q, userAns);
  if (!ok) {
    if (!state.wrongIds.includes(q.id)) { state.wrongIds.push(q.id); localStorage.setItem('bb_wrong_ids', JSON.stringify(state.wrongIds)); }
  } else {
    state.wrongIds = state.wrongIds.filter(id => id !== q.id);
    localStorage.setItem('bb_wrong_ids', JSON.stringify(state.wrongIds));
  }
  const count = parseInt(localStorage.getItem('bb_practice_count') || '0') + 1;
  localStorage.setItem('bb_practice_count', String(count));
  updateHomeProgress();
  feedback.hidden = false;
  feedback.className = 'q-feedback ' + (ok ? 'ok' : 'bad');
  feedback.innerHTML = ok
    ? `✓ Correct!<br>${q.explanation}<span class="bn">${q.bengali_explanation || ''}</span>`
    : `✗ Incorrect. Correct answer: <strong>${q.answer}</strong><br>${q.explanation}<span class="bn">${q.bengali_explanation || ''}</span>`;
  document.getElementById('pq-submit').hidden = true;
  document.getElementById('pq-next').hidden = false;
});
document.getElementById('pq-next')?.addEventListener('click', () => { state.practiceIndex++; renderPracticeQ(); });

document.getElementById('start-test')?.addEventListener('click', () => {
  state.testIndex = 0; state.testAnswers = {}; state.testStarted = true;
  document.getElementById('test-intro').hidden = true;
  document.getElementById('test-area').hidden = false;
  document.getElementById('test-result').hidden = true;
  renderTestQ();
});

function renderTestQ() {
  const qs = state.questions || [];
  if (state.testIndex >= qs.length) { finishTest(); return; }
  const q = qs[state.testIndex];
  document.getElementById('test-counter').textContent = `${state.testIndex + 1} / ${qs.length}`;
  document.getElementById('test-progress-fill').style.width = ((state.testIndex / qs.length) * 100) + '%';
  document.getElementById('tq-meta').textContent = `${q.id} · ${q.topic} · ${q.difficulty}`;
  document.getElementById('tq-text').textContent = q.question;
  const optsEl = document.getElementById('tq-options');
  optsEl.innerHTML = '';
  state.selectedOption = null;
  if (q.type === 'mcq' && q.options?.length) {
    q.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'opt-btn';
      btn.textContent = opt;
      btn.onclick = () => {
        optsEl.querySelectorAll('.opt-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        state.selectedOption = opt;
      };
      optsEl.appendChild(btn);
    });
  } else {
    const input = document.createElement('input');
    input.type = 'text'; input.id = 'test-fill'; input.placeholder = 'Type answer…'; input.autocomplete = 'off';
    input.style.cssText = 'width:100%;padding:0.85rem;border-radius:10px;border:2px solid #475569;background:#1e293b;color:#f1f5f9;font-size:1rem;';
    optsEl.appendChild(input);
  }
}

function saveCurrentAnswer() {
  const qs = state.questions || [];
  const q = qs[state.testIndex];
  if (!q) return;
  let ans = state.selectedOption;
  const fill = document.getElementById('test-fill');
  if (fill) ans = fill.value.trim();
  state.testAnswers[q.id] = ans || '';
}
document.getElementById('tq-next')?.addEventListener('click', () => { saveCurrentAnswer(); state.testIndex++; renderTestQ(); });
document.getElementById('tq-skip')?.addEventListener('click', () => {
  if (state.questions[state.testIndex]) state.testAnswers[state.questions[state.testIndex].id] = '';
  state.testIndex++; renderTestQ();
});

function finishTest() {
  document.getElementById('test-area').hidden = true;
  const resultEl = document.getElementById('test-result');
  resultEl.hidden = false;
  const qs = state.questions;
  let correct = 0, wrong = 0, skipped = 0;
  const byTopic = {};
  qs.forEach(q => {
    const given = String(state.testAnswers[q.id] || '').toLowerCase().trim();
    const topic = q.topic || 'Other';
    if (!byTopic[topic]) byTopic[topic] = { c: 0, t: 0 };
    byTopic[topic].t++;
    if (!given) skipped++;
    else if (isAnswerCorrect(q, given)) { correct++; byTopic[topic].c++; }
    else {
      wrong++;
      if (!state.wrongIds.includes(q.id)) state.wrongIds.push(q.id);
    }
  });
  localStorage.setItem('bb_wrong_ids', JSON.stringify(state.wrongIds));
  const total = qs.length;
  const pct = Math.round((correct / total) * 100);
  let level = 'Keep Learning';
  if (pct >= 90) level = 'Excellent — Exam Ready';
  else if (pct >= 75) level = 'Very Good';
  else if (pct >= 60) level = 'Good';
  else if (pct >= 40) level = 'Needs Practice';
  localStorage.setItem('bb_last_result', JSON.stringify({ correct, wrong, skipped, pct, level, byTopic, date: new Date().toISOString() }));
  localStorage.setItem('bb_progress', String(Math.max(pct, parseInt(localStorage.getItem('bb_progress') || '0'))));
  let topicHtml = Object.entries(byTopic).map(([t, v]) => `<div class="topic-row"><span>${t}</span><span>${v.c}/${v.t}</span></div>`).join('');
  resultEl.innerHTML = `
    <div class="score-big">${pct}%</div>
    <div class="level-badge">${level}</div>
    <p>Correct: ${correct} · Wrong: ${wrong} · Skipped: ${skipped}</p>
    <div class="topic-breakdown"><h4>By Topic</h4>${topicHtml}</div>
    <button class="primary-btn" style="margin-top:1.25rem" onclick="showView('results')">Full Review</button>
    <button class="secondary-btn" style="margin-top:0.75rem;width:100%" onclick="retryWrongFromTest()">Retry Wrong Only</button>
    <button class="secondary-btn" style="margin-top:0.5rem;width:100%" onclick="showView('home')">Home</button>`;
  updateHomeProgress();
}
function retryWrongFromTest() { state.practiceWrongOnly = true; state.practiceFilter = 'all'; showView('practice'); }

function renderResults() {
  const data = localStorage.getItem('bb_last_result');
  const el = document.getElementById('results-content');
  if (!el) return;
  if (!data) { el.innerHTML = '<p class="empty-msg">No test results yet. Complete the 100-Question Test.</p>'; return; }
  const r = JSON.parse(data);
  let topicHtml = '';
  if (r.byTopic) {
    topicHtml = '<div class="topic-breakdown"><h4>Topic Breakdown</h4>' +
      Object.entries(r.byTopic).map(([t, v]) => `<div class="topic-row"><span>${t}</span><span>${v.c}/${v.t}</span></div>`).join('') + '</div>';
  }
  el.innerHTML = `
    <div class="score-big">${r.pct}%</div>
    <div class="level-badge">${r.level}</div>
    <p>Correct: ${r.correct} · Wrong: ${r.wrong} · Skipped: ${r.skipped}</p>
    <p style="color:var(--text-muted);margin-top:0.5rem">Taken: ${new Date(r.date).toLocaleString()}</p>
    ${topicHtml}
    <p style="margin-top:1rem">Wrong answers saved: <strong>${state.wrongIds.length}</strong></p>
    <button class="primary-btn" style="margin-top:1rem;width:100%" onclick="retryWrongFromTest()">Practice Wrong Answers</button>`;
}

function printQuestions() {
  const qs = state.questions || [];
  const area = document.getElementById('print-area');
  area.innerHTML = '<h2>BB STORE – Determiners & Articles – Question Paper</h2>' +
    qs.map((q, i) => `<p><strong>${i + 1}.</strong> ${q.question} ${q.options?.length ? '(' + q.options.join(' / ') + ')' : ''}</p>`).join('');
  window.print();
}
function printAnswers() {
  const qs = state.questions || [];
  const area = document.getElementById('print-area');
  area.innerHTML = '<h2>Answer Key – Determiners & Articles</h2>' +
    qs.map((q, i) => `<p><strong>${i + 1}.</strong> ${q.answer} <em>(${q.topic} · Rule ${q.rule})</em></p>`).join('');
  window.print();
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(console.warn);
}
loadData().then(() => console.log('BB STORE PWA ready – Extreme Student Edition'));
