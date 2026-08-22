import * as Clipboard from "expo-clipboard";
import { File, Paths } from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

import type { LearnerProfile, QuizAttempt } from "./types";
import { buildScoreHistoryHtml } from "./report-html";

export { buildScoreHistoryHtml } from "./report-html";

function safeFileName(value: string) {
  return value.replace(/[^a-z0-9._-]+/gi, "-").replace(/-+/g, "-").toLowerCase();
}

function downloadOnWeb(filename: string, content: string, mimeType: string) {
  if (typeof document === "undefined") throw new Error("Download is not available in this environment.");
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function exportTextFile(filename: string, content: string, mimeType = "application/json") {
  const safeName = safeFileName(filename);
  if (Platform.OS === "web") {
    downloadOnWeb(safeName, content, mimeType);
    return;
  }
  const file = new File(Paths.cache, safeName);
  file.create({ overwrite: true, intermediates: true });
  file.write(content);
  if (!(await Sharing.isAvailableAsync())) throw new Error("File sharing is unavailable on this device.");
  await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: `Export ${safeName}` });
}

export async function copyText(value: string) {
  await Clipboard.setStringAsync(value);
}

export function buildScoreHistorySummary(profile: LearnerProfile, attempts: QuizAttempt[]) {
  const learner = profile.name.trim() || "Learner not recorded";
  const rows = attempts.map((attempt) => `${new Date(attempt.completedAt).toLocaleDateString()} · ${attempt.unitTitle} · ${attempt.correct}/${attempt.total} · ${attempt.timed ? "Timed" : "Untimed"} · ${attempt.bankSourceCatalogVersion} · ${attempt.bankOrigin === "packaged_validated" ? "Packaged validated" : attempt.bankOrigin === "imported_draft" ? "Imported AI draft" : "Legacy record"}`).join("\n");
  return ["Molarum local revision history", `Learner: ${learner}`, `Completed attempts: ${attempts.length}`, "", rows || "No completed revision quizzes recorded.", "", "Saved locally. This is a source-grounded revision record, not a formal assessment."].join("\n");
}

export interface PreparedScoreHistoryExport {
  uri: string | null;
  fileName: string;
  format: "pdf" | "html";
  retainedOnDevice: boolean;
}

export async function prepareScoreHistoryExport(profile: LearnerProfile, attempts: QuizAttempt[]): Promise<PreparedScoreHistoryExport> {
  const html = buildScoreHistoryHtml(profile, attempts);
  if (Platform.OS === "web") {
    const fileName = "molarum-score-history.html";
    downloadOnWeb(fileName, html, "text/html");
    return { uri: null, fileName, format: "html", retainedOnDevice: false };
  }
  const fileName = `molarum-score-history-${new Date().toISOString().slice(0, 10)}.pdf`;
  const rendered = await Print.printToFileAsync({ html });
  const source = new File(rendered.uri);
  const retained = new File(Paths.document, fileName);
  if (retained.exists) retained.delete();
  source.copy(retained);
  return { uri: retained.uri, fileName, format: "pdf", retainedOnDevice: true };
}

export async function sharePreparedScoreHistory(uri: string) {
  if (!(await Sharing.isAvailableAsync())) return { ok: false, message: "Sharing is unavailable on this device. The generated PDF remains retained inside Molarum; retry Share when a compatible file provider or sharing app is available." };
  await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "Share Molarum revision history" });
  return { ok: true, message: "The system share sheet opened for the retained local PDF." };
}

export async function exportScoreHistoryPdf(profile: LearnerProfile, attempts: QuizAttempt[]): Promise<string | null> {
  const prepared = await prepareScoreHistoryExport(profile, attempts);
  if (prepared.uri) {
    const shared = await sharePreparedScoreHistory(prepared.uri);
    if (!shared.ok) throw new Error(shared.message);
  }
  return prepared.uri;
}
