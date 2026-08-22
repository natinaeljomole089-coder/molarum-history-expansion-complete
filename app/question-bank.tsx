import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";

import { ActionButton, ActiveBankStatus, NotebookHeader, Notice, SectionLabel, StatusPill } from "@/components/molarum/ui";
import { useColors } from "@/hooks/use-colors";
import { pickJsonFromDevice } from "@/lib/molarum/imports";
import { summarizeImportReview, type ImportReviewSummary } from "@/lib/molarum/import-review";
import { formatValidationReport } from "@/lib/molarum/validator";
import { useStudyLibrary } from "@/lib/molarum/provider";
import type { ValidatedQuestionBank, ValidationReport } from "@/lib/molarum/types";

interface PendingImport {
  name: string;
  validated: ValidatedQuestionBank | null;
  report: ValidationReport;
  summary: ImportReviewSummary;
}

export default function QuestionBankScreen() {
  const colors = useColors();
  const router = useRouter();
  const { activeBank, activeBankOrigin, bundledQuestionCount, questions, previewQuestionBank, activateQuestionBank, resetToBundledContent } = useStudyLibrary();
  const [report, setReport] = useState<ValidationReport | null>(activeBank?.report ?? null);
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
  const [busy, setBusy] = useState(false);
  const summary = useMemo(() => activeBank?.report.unitSummary ?? [], [activeBank]);

  const importBank = async () => {
    try {
      setBusy(true);
      const picked = await pickJsonFromDevice();
      if (!picked) return;
      const result = previewQuestionBank(picked.value);
      const nextReport = result.ok ? result.value.report : result.report;
      setReport(nextReport);
      setPendingImport({ name: picked.name, validated: result.ok ? result.value : null, report: nextReport, summary: summarizeImportReview(picked.value, nextReport) });
      Alert.alert(result.ok ? "Review validated import" : "Bank rejected", result.ok ? "The selected bank is valid but has not been activated. Review its details and confirm activation below." : "The current active bank was not changed. Review the remediation details below.");
    } catch (error) {
      Alert.alert("Import stopped", error instanceof Error ? error.message : "The file could not be read.");
    } finally {
      setBusy(false);
    }
  };

  const reset = () => Alert.alert("Restore packaged validated bank?", `This will remove the ${activeBankOrigin === "imported" ? "currently imported override" : "current local bank state"} and all local review states. It will replace it with the packaged validated bank (${bundledQuestionCount} questions). Local revision records are kept.`, [{ text: "Cancel", style: "cancel" }, { text: "Restore packaged bank", style: "destructive", onPress: () => { resetToBundledContent(); setPendingImport(null); } }], { cancelable: false });
  const activatePending = () => {
    if (!pendingImport?.validated) return;
    activateQuestionBank(pendingImport.validated);
    setReport(pendingImport.report);
    Alert.alert("Validated import activated", `${pendingImport.name} is now the active local bank. Imported questions remain AI draft and teacher review recommended.`);
    setPendingImport(null);
  };
  const review = pendingImport?.summary;
  return <FlatList style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content} data={summary} keyExtractor={(item) => item.unitKey} ListHeaderComponent={<View style={{ gap: 12 }}><NotebookHeader onBack={() => router.back()} eyebrow="Local content ledger" title="Question-bank management" subtitle="Review a file before a valid import can replace local content." /><ActiveBankStatus origin={activeBank ? activeBankOrigin : "none"} questionCount={questions.length} /><Notice>Only owner-approved textbook-derived content belongs here. Failed imports never change the active bank; imported content remains AI draft and Teacher review recommended.</Notice><View style={styles.actions}><ActionButton label={busy ? "Checking import…" : "Choose JSON bank"} onPress={importBank} disabled={busy} icon="file-open" /><ActionButton label="Restore packaged bank" onPress={reset} secondary icon="restart-alt" /></View>{pendingImport && review ? <View style={[styles.review, { backgroundColor: pendingImport.validated ? "#EAF3EB" : "#FBE8E4", borderColor: colors.border }]}><Text style={[styles.reportTitle, { color: colors.foreground }]}>{pendingImport.validated ? "Pre-import review ready" : "Pre-import review: remediation required"}</Text><Text style={[styles.reviewText, { color: colors.muted }]}>{pendingImport.name} · {review.totalRecords} records · {review.preliminarilyValidRecords} valid · {review.rejectedRecords} rejected</Text><Text style={[styles.reviewText, { color: colors.muted }]}>Duplicate IDs {review.duplicateIds} · unsupported types {review.unsupportedQuestionTypes} · invalid subject prefixes {review.invalidSubjectPrefixes} · missing source notes {review.missingSourceNotes} · missing explanations {review.missingExplanations} · missing review status {review.missingReviewStatuses} · unit/distribution violations {review.unitOrDistributionViolations}</Text>{pendingImport.validated ? <View style={styles.actions}><ActionButton label="Activate validated import" onPress={activatePending} icon="check-circle" /><ActionButton label="Cancel import" secondary onPress={() => setPendingImport(null)} icon="close" /></View> : <Text style={[styles.issue, { color: colors.error }]}>The active bank is unchanged. Correct every listed issue, then choose the file again.</Text>}{review.remediationIssues.slice(0, 8).map((issue, index) => <Text key={`${issue.code}-${index}`} style={[styles.issue, { color: colors.error }]}>• {issue.questionId ? `${issue.questionId}: ` : ""}{issue.message}</Text>)}</View> : null}<View style={styles.status}><SectionLabel>Active bank</SectionLabel><StatusPill tone={activeBank ? "success" : "warning"} label={activeBank ? `${questions.length} questions active` : "No valid bank"} /></View>{!activeBank ? <Text style={[styles.fallback, { color: colors.muted }]}>Restore the packaged validated bank or choose a valid source-grounded import to continue.</Text> : null}<SectionLabel>Validated unit summary</SectionLabel></View>} renderItem={({ item }) => <View style={[styles.unit, { borderBottomColor: colors.border }]}><Text style={[styles.unitTitle, { color: colors.foreground }]}>{item.unitKey}</Text><Text style={[styles.unitDetail, { color: colors.muted }]}>{item.total} items · MC {item.typeCounts.multiple_choice}, TF {item.typeCounts.true_false}, short {item.typeCounts.short_answer}, numerical {item.typeCounts.numerical}</Text><Text style={[styles.unitDetail, { color: colors.muted }]}>Easy {item.difficultyCounts.easy}, Medium {item.difficultyCounts.medium}, Hard {item.difficultyCounts.hard}</Text></View>} ListFooterComponent={report ? <View style={[styles.report, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.reportTitle, { color: colors.foreground }]}>{report.ok ? "Latest validation accepted" : "Latest validation rejected"}</Text><Text style={[styles.reportText, { color: colors.muted }]} numberOfLines={8}>{formatValidationReport(report)}</Text>{report.issues.length ? <View style={styles.issueList}>{report.issues.slice(0, 5).map((issue, index) => <Text key={`${issue.code}-${index}`} style={[styles.issue, { color: colors.error }]}>• {issue.message}</Text>)}</View> : null}</View> : null} ListEmptyComponent={activeBank ? <Text style={[styles.fallback, { color: colors.muted }]}>No completed unit summaries are available. Restore the packaged bank or activate a valid import.</Text> : null} />;
}

const styles = StyleSheet.create({ content: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 30 }, actions: { gap: 10 }, status: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: 3 }, fallback: { fontSize: 13, lineHeight: 20 }, unit: { borderBottomWidth: StyleSheet.hairlineWidth, gap: 4, paddingVertical: 13 }, unitTitle: { fontSize: 15, fontWeight: "900" }, unitDetail: { fontSize: 12, lineHeight: 17 }, report: { borderRadius: 15, borderWidth: 1, gap: 8, marginTop: 20, padding: 14 }, review: { borderRadius: 15, borderWidth: 1, gap: 8, padding: 14 }, reviewText: { fontSize: 12, lineHeight: 18 }, reportTitle: { fontSize: 15, fontWeight: "900" }, reportText: { fontSize: 11, lineHeight: 16 }, issueList: { gap: 5 }, issue: { fontSize: 12, lineHeight: 17 } });
