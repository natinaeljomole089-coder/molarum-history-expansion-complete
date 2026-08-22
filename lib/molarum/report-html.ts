import type { LearnerProfile, QuizAttempt } from "./types";

function escapeHtml(value: string) {
  return value.replace(/[&<>'\"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" })[character] ?? character);
}

export function buildScoreHistoryHtml(profile: LearnerProfile, attempts: QuizAttempt[]) {
  const profileRows = [["Learner", profile.name || "Not recorded"], ["Class", profile.className || "Not recorded"], ["School", profile.school || "Not recorded"]];
  const rows = attempts.map((attempt) => `<tr><td>${escapeHtml(new Date(attempt.completedAt).toLocaleDateString())}</td><td>${escapeHtml(attempt.unitTitle)}</td><td>${attempt.correct}/${attempt.total}</td><td>${attempt.timed ? "Timed" : "Untimed"}</td><td>Saved locally</td></tr>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><style>@page{margin:28px}body{font-family:Arial,sans-serif;color:#13243A}h1{font-family:Georgia,serif;font-size:24px;margin:0 0 6px}p{color:#5B6570;font-size:11px}table{width:100%;border-collapse:collapse;margin:18px 0}td,th{border-bottom:1px solid #D9CDB8;padding:8px;text-align:left;font-size:11px}th{background:#F7F1E4;color:#A7582B}.note{margin-top:24px;padding:10px;background:#FFF7E0;color:#72550F;font-size:10px}</style></head><body><h1>Molarum score history</h1><p>Local device revision record exported ${escapeHtml(new Date().toLocaleString())}</p><table>${profileRows.map(([label, value]) => `<tr><th>${label}</th><td>${escapeHtml(value)}</td></tr>`).join("")}</table><h2>Completed revision attempts</h2><table><thead><tr><th>Date</th><th>Unit</th><th>Score</th><th>Mode</th><th>Persistence</th></tr></thead><tbody>${rows || "<tr><td colspan=\"5\">No completed revision quizzes recorded.</td></tr>"}</tbody></table><div class="note">Saved locally. This is a revision record, not a formal assessment. Question content is marked Teacher review recommended.</div></body></html>`;
}
