import { api } from '../api.js';

function diffClass(d) {
  if (!d) return 'diff-beginner';
  if (d === 'intermediate') return 'diff-intermediate';
  if (d === 'advanced') return 'diff-advanced';
  return 'diff-beginner';
}

async function openQuiz(quiz) {
  let detail;
  try { detail = await api.get(`/quiz/${quiz.id}`); } catch(e) { window._metis.toast(e.message,'error'); return; }
  const questions = detail.questions ?? [];
  let qi = 0, answers = [], selected = null, revealed = false, xpEarned = 0;

  function renderQuestion(overlay) {
    const q = questions[qi];
    if (!q) return renderResults(overlay);
    overlay.querySelector('.modal').innerHTML = `
      <button class="modal-close" id="qclose">✕</button>
      <div class="text-sm text-secondary" style="margin-bottom:12px">Question ${qi+1} of ${questions.length}</div>
      <div style="font-weight:600;font-size:16px;margin-bottom:20px">${q.question}</div>
      <div id="options">
        ${(q.options ?? []).map((opt, i) => `
          <div class="quiz-option" data-idx="${i}">${opt}</div>`).join('')}
      </div>
      <div id="feedback" style="margin-top:14px;font-size:14px"></div>
      <div style="margin-top:20px;text-align:right">
        <button id="next-btn" class="btn btn-primary" disabled>${qi === questions.length-1 ? 'Finish' : 'Next'}</button>
      </div>
    `;

    overlay.querySelector('#qclose').onclick = () => overlay.remove();

    overlay.querySelectorAll('.quiz-option').forEach(opt => {
      opt.addEventListener('click', () => {
        if (revealed) return;
        overlay.querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        selected = parseInt(opt.dataset.idx);
      });
    });

    overlay.querySelector('#next-btn').disabled = true;
    overlay.querySelector('#options').addEventListener('click', e => {
      const opt = e.target.closest('.quiz-option');
      if (!opt || revealed) return;
      selected = parseInt(opt.dataset.idx);
      revealed = true;
      const correct = q.correct_answer ?? q.correct_index ?? 0;
      answers.push({ selected, correct });
      overlay.querySelectorAll('.quiz-option').forEach((o, i) => {
        o.classList.add('revealed');
        if (i === correct) o.classList.add('correct');
        else if (i === selected) o.classList.add('wrong');
      });
      const fb = overlay.querySelector('#feedback');
      if (selected === correct) {
        fb.innerHTML = `<span style="color:var(--success)">✓ Correct!</span> ${q.explanation ?? ''}`;
      } else {
        fb.innerHTML = `<span style="color:var(--danger)">✗ Incorrect.</span> ${q.explanation ?? ''}`;
      }
      overlay.querySelector('#next-btn').disabled = false;
    });

    overlay.querySelector('#next-btn').addEventListener('click', () => {
      if (!revealed) return;
      qi++; selected = null; revealed = false;
      renderQuestion(overlay);
    });
  }

  async function renderResults(overlay) {
    const correct = answers.filter(a => a.selected === a.correct).length;
    const score = Math.round((correct / questions.length) * 100);
    overlay.querySelector('.modal').innerHTML = `
      <div style="text-align:center;padding:20px 0">
        <div style="font-size:48px;margin-bottom:12px">${score >= 70 ? '🏆' : '📚'}</div>
        <h2 style="margin-bottom:8px">${score >= 70 ? 'Great work!' : 'Keep practising!'}</h2>
        <p class="text-secondary" style="margin-bottom:20px">${correct} / ${questions.length} correct · ${score}%</p>
        <div id="xp-display" style="font-size:24px;font-weight:700;color:var(--accent);margin-bottom:24px"></div>
        <button class="btn btn-primary" id="done-btn">Done</button>
      </div>`;
    overlay.querySelector('#done-btn').onclick = () => overlay.remove();

    try {
      const res = await api.post(`/quiz/${quiz.id}/submit`, { answers });
      xpEarned = res.xp_earned ?? 0;
      const xpEl = overlay.querySelector('#xp-display');
      let n = 0;
      const step = Math.ceil(xpEarned / 20);
      const timer = setInterval(() => {
        n = Math.min(n + step, xpEarned);
        xpEl.textContent = `+${n} XP`;
        if (n >= xpEarned) { clearInterval(timer); }
      }, 50);
      const me = await api.get('/auth/me');
      localStorage.setItem('metis_user', JSON.stringify(me));
      window._metis.refreshShell();
    } catch(e) { window._metis.toast(e.message, 'error'); }
  }

  const overlay = window._metis.openModal(`
    <button class="modal-close" id="qclose">✕</button>
    <div class="loading">Loading quiz…</div>`);
  overlay.querySelector('#qclose').onclick = () => overlay.remove();
  renderQuestion(overlay);
}

export async function render(el) {
  const [quizzes, stats] = await Promise.all([
    api.get('/quiz/'),
    api.get('/users/me/stats'),
  ]);
  const user = stats.user ?? {};
  let activeTab = 'quizzes';

  function drawTab() {
    const pane = document.getElementById('tab-pane');
    if (activeTab === 'quizzes') {
      const cats = ['All', ...new Set(quizzes.map(q => q.category).filter(Boolean))];
      let cat = 'All';

      function drawQuizzes() {
        const filtered = cat === 'All' ? quizzes : quizzes.filter(q => q.category === cat);
        pane.innerHTML = `
          <div class="filter-pills" id="cat-pills">
            ${cats.map(c => `<span class="pill ${c===cat?'active':''}" data-cat="${c}">${c}</span>`).join('')}
          </div>
          <div class="quiz-grid">
            ${filtered.map(q => {
              const locked = (user.level ?? 0) < (q.min_level ?? 0);
              return `
                <div class="quiz-card ${locked?'locked':''}" data-id="${q.id}">
                  <span class="diff-badge ${diffClass(q.difficulty)}">${q.difficulty ?? 'beginner'}</span>
                  ${locked ? `<span class="diff-badge" style="background:#fef3c7;color:#d97706;margin-left:4px">Lv ${q.min_level}+</span>` : ''}
                  <div style="font-weight:600;margin-bottom:6px">${q.title}</div>
                  <div class="text-sm text-secondary">${q.description ?? ''}</div>
                  <div class="text-sm text-secondary" style="margin-top:10px">📂 ${q.category ?? '—'} · ${q.question_count ?? 0} questions</div>
                </div>`;
            }).join('')}
          </div>`;

        pane.querySelector('#cat-pills')?.addEventListener('click', e => {
          const p = e.target.closest('.pill');
          if (p) { cat = p.dataset.cat; drawQuizzes(); }
        });

        pane.querySelectorAll('.quiz-card:not(.locked)').forEach(card =>
          card.addEventListener('click', () => openQuiz(quizzes.find(q => q.id == card.dataset.id)))
        );
      }
      drawQuizzes();

    }
  }

  el.innerHTML = `
    <div class="tabs" id="tabs">
      <button class="tab-btn active" data-tab="quizzes">Quizzes</button>
    </div>
    <div id="tab-pane"></div>`;

  document.getElementById('tabs').addEventListener('click', e => {
    const btn = e.target.closest('.tab-btn');
    if (!btn) return;
    document.querySelectorAll('#tabs .tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeTab = btn.dataset.tab;
    drawTab();
  });

  drawTab();
}
