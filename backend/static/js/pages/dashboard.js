import { api } from '../api.js';

export async function render(el) {
  const [stats, quizzes] = await Promise.all([
    api.get('/users/me/stats'),
    api.get('/quiz/'),
  ]);

  const user = stats.user ?? stats;
  const skillBreakdown = stats.skill_breakdown ?? {};
  const recentActivity = stats.recent_activity ?? [];

  el.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-emoji">⚡</div><div class="stat-value">${user.xp ?? 0}</div><div class="stat-label">Total XP</div></div>
      <div class="stat-card"><div class="stat-emoji">🏆</div><div class="stat-value">${user.level ?? 0}</div><div class="stat-label">Level</div></div>
      <div class="stat-card"><div class="stat-emoji">🔥</div><div class="stat-value">${user.streak ?? 0}</div><div class="stat-label">Day streak</div></div>
      <div class="stat-card"><div class="stat-emoji">📝</div><div class="stat-value">${stats.quizzes_completed ?? 0}</div><div class="stat-label">Quizzes done</div></div>
    </div>

    <div class="grid-2" style="gap:16px">
      <div class="card">
        <div class="card-title">Skill breakdown</div>
        ${Object.entries(skillBreakdown).length
          ? Object.entries(skillBreakdown).map(([skill, pct]) => `
              <div style="margin-bottom:14px">
                <div class="flex justify-between text-sm" style="margin-bottom:4px">
                  <span>${skill}</span><span>${pct}%</span>
                </div>
                <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
              </div>`).join('')
          : '<p class="text-secondary text-sm">Complete quizzes to see skill data.</p>'
        }
      </div>
      <div class="card">
        <div class="card-title">Recent activity</div>
        ${recentActivity.length
          ? recentActivity.slice(0, 6).map(a => `
              <div class="flex justify-between items-center" style="padding:8px 0;border-bottom:1px solid var(--border)">
                <span class="text-sm">${a.quiz_title ?? 'Quiz'}</span>
                <span class="text-sm font-bold" style="color:var(--success)">+${a.xp_earned ?? 0} XP</span>
              </div>`).join('')
          : '<p class="text-secondary text-sm">No activity yet. Play a quiz!</p>'
        }
      </div>
    </div>
  `;
}
