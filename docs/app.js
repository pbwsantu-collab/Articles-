/* BB STORE – ENGLISH PWA Application Logic */

const state = {
  lessons: null,
  questions: null,
  chapters: null,
  currentView: 'home',
  teachIndex: 0,
  practiceIndex: 0,
  testIndex: 0,
  testAnswers: {},
  testStarted: false,
  selectedOption: null,
  speech: window.speechSynthesis
};

function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const el = document.getElementById('view-' + name);
  if (el) {
    el.classList.add('active');
    state.currentView = name;
  }
  if (name === 'learn') renderTeach();
  if (name === 'rules') renderRules();
  if (name === 'practice') startPractice();
  if (name === 'results') renderResults();
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
    console.log('Data loaded:', questions.length, 'questions');
  } catch (e) {
    console.error('Failed to load data', e);
    const card = document.getElementById('chapter-card');
    if (card) card.innerHTML += '<p style="color:#f87171">Data not generated yet. Run python main.py --all</p>';
  }
}

function updateHomeProgress() {
  const prog = localStorage.getItem('bb_progress') || 0;
  const fill = document.getElementById('home-progress');
  const pct = document.getElementById('progress-pct');
  if (fill) fill.style.width = prog + '%';
  if (pct) pct.textContent = prog;
}

function renderTeach() {
  if (!state.lessons) return;
  const sections = state.lessons.sections.filter(s => s.type === 'rule' || !s.type);
  if (state.teachIndex >= sections.length) state.teachIndex = 0;
  const s = sections[state.teachIndex];
  const card = document.getElementById('teach-card');
  let html = `<div class="teach-step">
    <h2>Rule ${s.rule_number || ''} — ${s.title}</h2>
    <p>${s.source_content || ''}</p>`;
  if (s.bengali_explanation) {
    html += `<p class="bn">${s.bengali_explanation}</p>`;
  }
  if (Array.isArray(s.examples)) {
    s.examples.slice(0, 6).forEach(ex => {
      html += `<div class="example">${typeof ex === 'string' ? ex : JSON.stringify(ex)}</div>`;
    });
  } else if (s.examples && typeof s.examples === 'object') {
    Object.entries(s.examples).forEach(([k, arr]) => {
      html += `<p><strong>${k}</strong></p>`;
      (arr || []).forEach(ex => html += `<div class="example">${ex}</div>`);
    });
  }
  if (s.note) html += `<p><em>Note: ${s.note}</em></p>`;
  html += `</div>`;
  card.innerHTML = html;
  document.getElementById('teach-counter').textContent = `${state.teachIndex + 1} / ${sections.length}`;
}

document.getElementById('teach-next')?.addEventListener('click', () => {
  const sections = state.lessons?.sections.filter(s => s.type === 'rule' || !s.type) || [];
  if (state.teachIndex < sections.length - 1) {
    state.teachIndex++;
    renderTeach();
  }
});
document.getElementById('teach-prev')?.addEventListener('click', () => {
  if (state.teachIndex > 0) {
    state.teachIndex--;
    renderTeach();
  }
});

function speak(text, lang = 'en-IN') {
  if (!state.speech) return;
  state.speech.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = 0.9;
  state.speech.speak(u);
}
document.getElementById('btn-play')?.addEventListener('click', () => {
  const s = state.lessons?.sections[state.teachIndex];
  if (s) speak(s.narration_mixed || s.source_content || s.title);
});
document.getElementById('btn-pause')?.addEventListener('click', () => state.speech?.pause());
document.getElementById('btn-stop')?.addEventListener('click', () => state.speech?.cancel());

function renderRules() {
  const container = document.getElementById('all-rules');
  if (!state.lessons) return;
  container.innerHTML = state.lessons.sections
    .filter(s => s.rule_number)
    .map(s => `
      <div class="rule-item">
        <h3>Rule ${s.rule_number}: ${s.title}</h3>
        <p>${(s.source_content || '').slice(0, 120)}…</p>
        <p class="bn" style="color:#a5f3fc;font-size:0.85rem">${s.bengali_explanation || ''}</p>
      </div>
    `).join('');
}

function startPractice() {
  state.practiceIndex = 0;
  state.selectedOption = null;
  renderPracticeQ();
}

function renderPracticeQ() {
  const qs = state.questions || [];
  if (!qs.length) {
    document.getElementById('pq-text').textContent = 'No questions loaded.';
    return;
  }
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
    input.placeholder = 'Type your answer…';
    input.style.cssText = 'width:100%;padding:0.85rem;border-radius:10px;border:2px solid #475569;background:#1e293b;color:#f1f5f9;font-size:1rem;';
    optsEl.appendChild(input);
  }
}

document.getElementById('pq-submit')?.addEventListener('click', () => {
  const qs = state.questions || [];
  const q = qs[state.practiceIndex % qs.length];
  let userAns = state.selectedOption;
  const fill = document.getElementById('fill-input');
  if (fill) userAns = fill.value.trim();

  const feedback = document.getElementById('pq-feedback');
  const correct = String(q.answer).toLowerCase().trim();
  const given = String(userAns || '').toLowerCase().trim();
  const ok = given === correct || given.includes(correct) || correct.includes(given);

  feedback.hidden = false;
  feedback.className = 'q-feedback ' + (ok ? 'ok' : 'bad');
  feedback.innerHTML = ok
    ? `✓ Correct!<br>${q.explanation}<span class="bn">${q.bengali_explanation || ''}</span>`
    : `✗ Incorrect. Correct answer: <strong>${q.answer}</strong><br>${q.explanation}<span class="bn">${q.bengali_explanation || ''}</span>`;

  document.getElementById('pq-submit').hidden = true;
  document.getElementById('pq-next').hidden = false;
});

document.getElementById('pq-next')?.addEventListener('click', () => {
  state.practiceIndex++;
  renderPracticeQ();
});

document.getElementById('start-test')?.addEventListener('click', () => {
  state.testIndex = 0;
  state.testAnswers = {};
  state.testStarted = true;
  document.getElementById('test-intro').hidden = true;
  document.getElementById('test-area').hidden = false;
  document.getElementById('test-result').hidden = true;
  renderTestQ();
});

function renderTestQ() {
  const qs = state.questions || [];
  if (state.testIndex >= qs.length) {
    finishTest();
    return;
  }
  const q = qs[state.testIndex];
  document.getElementById('test-counter').textContent = `${state.testIndex + 1} / ${qs.length}`;
  document.getElementById('test-progress-fill').style.width = ((state.testIndex / qs.length) * 100) + '%';
  document.getElementById('tq-meta').textContent = `${q.id} · ${q.difficulty}`;
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
    input.type = 'text';
    input.id = 'test-fill';
    input.placeholder = 'Type answer…';
    input.style.cssText = 'width:100%;padding:0.85rem;border-radius:10px;border:2px solid #475569;background:#1e293b;color:#f1f5f9;font-size:1rem;';
    optsEl.appendChild(input);
  }
}

function saveCurrentAnswer() {
  const qs = state.questions || [];
  const q = qs[state.testIndex];
  let ans = state.selectedOption;
  const fill = document.getElementById('test-fill');
  if (fill) ans = fill.value.trim();
  state.testAnswers[q.id] = ans || '';
}

document.getElementById('tq-next')?.addEventListener('click', () => {
  saveCurrentAnswer();
  state.testIndex++;
  renderTestQ();
});
document.getElementById('tq-skip')?.addEventListener('click', () => {
  state.testAnswers[state.questions[state.testIndex].id] = '';
  state.testIndex++;
  renderTestQ();
});

function finishTest() {
  document.getElementById('test-area').hidden = true;
  const resultEl = document.getElementById('test-result');
  resultEl.hidden = false;

  const qs = state.questions;
  let correct = 0, wrong = 0, skipped = 0;
  qs.forEach(q => {
    const given = String(state.testAnswers[q.id] || '').toLowerCase().trim();
    const ans = String(q.answer).toLowerCase().trim();
    if (!given) skipped++;
    else if (given === ans || given.includes(ans) || ans.includes(given)) correct++;
    else wrong++;
  });
  const total = qs.length;
  const pct = Math.round((correct / total) * 100);
  let level = 'Keep Learning';
  if (pct >= 90) level = 'Excellent';
  else if (pct >= 75) level = 'Very Good';
  else if (pct >= 60) level = 'Good';
  else if (pct >= 40) level = 'Needs Practice';

  localStorage.setItem('bb_last_result', JSON.stringify({ correct, wrong, skipped, pct, level, date: new Date().toISOString() }));
  localStorage.setItem('bb_progress', Math.max(pct, parseInt(localStorage.getItem('bb_progress') || 0)));

  resultEl.innerHTML = `
    <div class="score-big">${pct}%</div>
    <div class="level-badge">${level}</div>
    <p>Correct: ${correct} · Wrong: ${wrong} · Skipped: ${skipped}</p>
    <p style="margin-top:1rem">Total questions: ${total}</p>
    <button class="primary-btn" style="margin-top:1.25rem" onclick="showView('results')">Review Results</button>
    <button class="secondary-btn" style="margin-top:0.75rem;width:100%" onclick="showView('home')">Home</button>
  `;
  updateHomeProgress();
}

function renderResults() {
  const data = localStorage.getItem('bb_last_result');
  const el = document.getElementById('results-content');
  if (!data) {
    el.innerHTML = '<p class="empty-msg">No test results yet. Complete the 100-Question Test.</p>';
    return;
  }
  const r = JSON.parse(data);
  el.innerHTML = `
    <div class="score-big">${r.pct}%</div>
    <div class="level-badge">${r.level}</div>
    <p>Correct: ${r.correct} · Wrong: ${r.wrong} · Skipped: ${r.skipped}</p>
    <p style="color:var(--text-muted);margin-top:0.5rem">Taken: ${new Date(r.date).toLocaleString()}</p>
  `;
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
  area.innerHTML = '<h2>Answer Key</h2>' +
    qs.map((q, i) => `<p><strong>${i + 1}.</strong> ${q.answer}</p>`).join('');
  window.print();
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(console.warn);
}

loadData().then(() => {
  console.log('BB STORE PWA ready');
});
