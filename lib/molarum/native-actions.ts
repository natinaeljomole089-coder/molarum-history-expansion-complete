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

export async function exportScoreHistoryPdf(profile: LearnerProfile, attempts: QuizAttempt[]) {
  const html = buildScoreHistoryHtml(profile, attempts);
  if (Platform.OS === "web") {
    await Print.printAsync({});
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  if (!(await Sharing.isAvailableAsync())) throw new Error("PDF sharing is unavailable on this device.");
  await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "Export Molarum score history" });
}
