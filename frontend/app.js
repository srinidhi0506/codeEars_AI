// ---------- entrance animation ----------
window.addEventListener('DOMContentLoaded', () => {
  document.querySelector('.wrap')?.classList.add('loaded');
});

// ---------- hero waveform (decorative) ----------
(function renderHeroWave() {
  const svg = document.getElementById('hero-wave');
  if (!svg) return;
  const bars = 48;
  const gap = 600 / bars;
  let markup = '';
  for (let i = 0; i < bars; i++) {
    const h = 8 + Math.random() * 44;
    const x = i * gap + gap * 0.25;
    const w = gap * 0.5;
    const y = (60 - h) / 2;
    markup += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="1.5"></rect>`;
  }
  svg.innerHTML = markup;
})();

// ---------- mermaid init ----------
if (window.mermaid) {
  mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'loose',
    suppressErrorRendering: true,
  });
}

// ---------- elements ----------
const modeButtons = document.querySelectorAll('.mode-btn');
const modePill = document.getElementById('mode-pill');
const submitBtn = document.getElementById('submit-btn');
const runBtnLabel = submitBtn.querySelector('.run-btn-label');
const codeInput = document.getElementById('code-input');
const depthSelect = document.getElementById('depth-select');
const difficultySelect = document.getElementById('difficulty-select');
const languageSelect = document.getElementById('language-select');
const explainOutput = document.getElementById('explain-output');
const quizOutput = document.getElementById('quiz-output');
const diagramOutput = document.getElementById('diagram-output');
const diagramBtn = document.getElementById('diagram-btn');
const outputLabel = document.getElementById('output-label');
const voiceControls = document.getElementById('voice-controls');
const playBtn = document.getElementById('play-btn');
const stopBtn = document.getElementById('stop-btn');
const vuMeter = document.getElementById('vu-meter');
const statusEl = document.getElementById('status');

let mode = 'explain';
let currentExplanation = null;

// ---------- sliding tab pill ----------
function positionModePill(btn) {
  if (!modePill) return;
  modePill.style.width = `${btn.offsetWidth}px`;
  modePill.style.transform = `translateX(${btn.offsetLeft - 3}px)`;
}

window.addEventListener('DOMContentLoaded', () => {
  const activeBtn = document.querySelector('.mode-btn.active');
  if (activeBtn) positionModePill(activeBtn);
});

// ---------- mode switching ----------
modeButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    mode = btn.dataset.mode;
    positionModePill(btn);

    modeButtons.forEach((b) => {
      const isActive = b === btn;
      b.classList.toggle('active', isActive);
      b.setAttribute('aria-selected', String(isActive));
    });

    document.querySelectorAll('.explain-only').forEach((el) => el.classList.toggle('hidden', mode !== 'explain'));
    document.querySelectorAll('.quiz-only').forEach((el) => el.classList.toggle('hidden', mode !== 'quiz'));

    runBtnLabel.textContent = mode === 'explain' ? 'Explain it' : 'Generate questions';
    outputLabel.textContent = mode === 'explain' ? 'explanation' : 'interview questions';

    diagramOutput.classList.add('hidden');
    diagramBtn.classList.add('hidden');
    diagramBtn.textContent = 'Show flowchart';

    stopSpeaking();
  });
});

// ---------- submit ----------
submitBtn.addEventListener('click', async () => {
  const code = codeInput.value.trim();
  if (!code) {
    setStatus('Paste some code first.');
    return;
  }

  setStatus('');
  submitBtn.disabled = true;
  stopSpeaking();
  showSkeleton();

  try {
    if (mode === 'explain') {
      await runExplain(code);
    } else {
      await runQuiz(code);
    }
  } catch (err) {
    console.error(err);
    setStatus('Something went wrong. Check the server is running and try again.');
  } finally {
    submitBtn.disabled = false;
  }
});

function showSkeleton() {
  const target = mode === 'explain' ? explainOutput : quizOutput;
  target.innerHTML = `
    <div class="skeleton-line"></div>
    <div class="skeleton-line"></div>
    <div class="skeleton-line"></div>
    <div class="skeleton-line"></div>
  `;
}

async function runExplain(code) {
  const depth = depthSelect.value;
  const language = languageSelect.value;

  const res = await fetch('/api/explain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, depth, language }),
  });

  if (!res.ok) throw new Error('Explain request failed');
  const data = await res.json();

  const clean = sanitizeForSpeech(data.explanation);

  explainOutput.innerHTML = `<p class="output-enter">${escapeHtml(clean).replace(/\n/g, '<br>')}</p>`;
  voiceControls.classList.remove('hidden');
  diagramBtn.classList.remove('hidden');
  currentExplanation = clean;
}

async function runDiagram(code) {
  const res = await fetch('/api/diagram', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });

  if (!res.ok) throw new Error('Diagram request failed');
  const data = await res.json();

  diagramOutput.classList.remove('hidden');
  diagramOutput.innerHTML = '';

  const id = 'mermaid-' + Date.now();
  try {
    await mermaid.parse(data.mermaidCode); // throws if syntax is invalid
    const { svg } = await mermaid.render(id, data.mermaidCode);
    diagramOutput.innerHTML = svg;
  } catch (err) {
    console.error('Mermaid syntax invalid:', err);
    diagramOutput.innerHTML = '<p class="placeholder">The model produced an invalid diagram for this snippet. Click "Show flowchart" again to retry, or try a shorter snippet.</p>';
  }
}

diagramBtn.addEventListener('click', async () => {
  const code = codeInput.value.trim();
  if (!code) return;

  const isShowing = !diagramOutput.classList.contains('hidden');
  if (isShowing) {
    diagramOutput.classList.add('hidden');
    diagramBtn.textContent = 'Show flowchart';
    return;
  }

  diagramBtn.textContent = 'Generating… (up to 30s)';
  diagramBtn.disabled = true;
  diagramOutput.classList.remove('hidden');
  diagramOutput.innerHTML = '<p class="placeholder">Reasoning through the logic — free models can take a moment here…</p>';
  try {
    await runDiagram(code);
    diagramBtn.textContent = 'Hide flowchart';
  } catch (err) {
    console.error(err);
    setStatus('Diagram generation timed out or failed. Free models can be slow under load — try again.');
    diagramBtn.textContent = 'Show flowchart';
  } finally {
    diagramBtn.disabled = false;
  }
});

async function runQuiz(code) {
  const difficulty = difficultySelect.value;
  const language = languageSelect.value;

  const res = await fetch('/api/quiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, difficulty, language }),
  });

  if (!res.ok) throw new Error('Quiz request failed');
  const data = await res.json();

  quizOutput.innerHTML = '';
  data.questions.forEach((q, i) => {
    const card = document.createElement('div');
    card.className = 'question-card';
    card.style.animationDelay = `${i * 0.08}s`;
    card.innerHTML = `
      <p class="question">${i + 1}. ${escapeHtml(q.question)}</p>
      <button class="reveal-btn">Reveal answer</button>
      <p class="answer">${escapeHtml(q.answer)}</p>
    `;
    const revealBtn = card.querySelector('.reveal-btn');
    const answerEl = card.querySelector('.answer');
    revealBtn.addEventListener('click', () => {
      answerEl.classList.toggle('revealed');
      revealBtn.textContent = answerEl.classList.contains('revealed') ? 'Hide answer' : 'Reveal answer';
    });
    quizOutput.appendChild(card);
  });
}

// ---------- voice playback ----------
const SPEECH_LANG_MAP = {
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  hi: 'hi-IN',
  te: 'te-IN',
  ta: 'ta-IN',
  zh: 'zh-CN',
  ja: 'ja-JP',
  pt: 'pt-PT',
};

playBtn.addEventListener('click', () => {
  if (!currentExplanation) return;
  stopSpeaking();

  const utterance = new SpeechSynthesisUtterance(currentExplanation);
  const langTag = SPEECH_LANG_MAP[languageSelect.value] || 'en-US';
  utterance.lang = langTag;

  // Try to pick a voice that actually matches the language, if the browser has one
  const voices = window.speechSynthesis.getVoices();
  const match = voices.find((v) => v.lang === langTag) || voices.find((v) => v.lang.startsWith(langTag.split('-')[0]));
  if (match) utterance.voice = match;

  utterance.onstart = () => vuMeter.classList.add('playing');
  utterance.onend = () => vuMeter.classList.remove('playing');
  utterance.onerror = () => vuMeter.classList.remove('playing');
  window.speechSynthesis.speak(utterance);
});

stopBtn.addEventListener('click', stopSpeaking);

function stopSpeaking() {
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  }
  vuMeter.classList.remove('playing');
}

// ---------- helpers ----------
function setStatus(msg) {
  statusEl.textContent = msg;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Backup cleanup in case any markdown slips past the backend -
// stops "*" and "_" from being read aloud as literal symbols.
function sanitizeForSpeech(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_{1,2}(.*?)_{1,2}/g, '$1')
    .replace(/`{1,3}/g, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .trim();
}