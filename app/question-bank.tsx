import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";

import { ActionButton, NotebookHeader, Notice, SectionLabel, StatusPill } from "@/components/molarum/ui";
import { useColors } from "@/hooks/use-colors";
import { pickJsonFromDevice } from "@/lib/molarum/imports";
import { formatValidationReport } from "@/lib/molarum/validator";
import { useStudyLibrary } from "@/lib/molarum/provider";
import type { ValidationReport } from "@/lib/molarum/types";

export default function QuestionBankScreen() {
  const colors = useColors();
  const router = useRouter();
  const { activeBank, questions, importQuestionBank, resetToBundledContent } = useStudyLibrary();
  const [report, setReport] = useState<ValidationReport | null>(activeBank?.report ?? null);
  const [busy, setBusy] = useState(false);
  const summary = useMemo(() => activeBank?.report.unitSummary ?? [], [activeBank]);

  const importBank = async () => {
    try {
      setBusy(true);
      const picked = await pickJsonFromDevice();
      if (!picked) return;
      const result = importQuestionBank(picked.value);
      setReport(result.report);
      Alert.alert(result.accepted ? "Validated bank activated" : "Bank rejected", result.accepted ? `${picked.name} passed validation and is now active on this device.` : "The current active bank was not changed. Review the validation report below.");
    } catch (error) {
      Alert.alert("Import stopped", error instanceof Error ? error.message : "The file could not be read.");
    } finally {
      setBusy(false);
    }
  };

  const reset = () => Alert.alert("Reset local content?", "This removes the imported active bank and local review states. The bundled fallback contains no questions until owner-approved source content is supplied.", [{ text: "Cancel", style: "cancel" }, { text: "Reset", style: "destructive", onPress: resetToBundledContent }]);
  return <FlatList style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content} data={summary} keyExtractor={(item) => item.unitKey} ListHeaderComponent={<View style={{ gap: 12 }}><NotebookHeader onBack={() => router.back()} eyebrow="Local content ledger" title="Question-bank management" subtitle="Files are fully checked before the active bank can change." /><Notice>Only owner-approved textbook-derived content belongs here. Invalid JSON, unsupported schemas, duplicate wording, and incorrect distributions are rejected without replacing the active bank.</Notice><View style={styles.actions}><ActionButton label={busy ? "Checking import…" : "Import JSON bank"} onPress={importBank} disabled={busy} icon="file-open" /><ActionButton label="Reset to bundled content" onPress={reset} secondary icon="restart-alt" /></View><View style={styles.status}><SectionLabel>Active bank</SectionLabel><StatusPill tone={activeBank ? "success" : "warning"} label={activeBank ? `${questions.length} questions active` : "Fallback only"} /></View>{!activeBank ? <Text style={[styles.fallback, { color: colors.muted }]}>The compact bundled fallback intentionally contains no study questions because owner-provided source material has not been supplied. All subjects remain unresolved rather than invented.</Text> : null}<SectionLabel>Validated unit summary</SectionLabel></View>} renderItem={({ item }) => <View style={[styles.unit, { borderBottomColor: colors.border }]}><Text style={[styles.unitTitle, { color: colors.foreground }]}>{item.unitKey}</Text><Text style={[styles.unitDetail, { color: colors.muted }]}>{item.total} items · MC {item.typeCounts.multiple_choice}, TF {item.typeCounts.true_false}, short {item.typeCounts.short_answer}, numerical {item.typeCounts.numerical}</Text><Text style={[styles.unitDetail, { color: colors.muted }]}>Easy {item.difficultyCounts.easy}, Medium {item.difficultyCounts.medium}, Hard {item.difficultyCounts.hard}</Text></View>} ListFooterComponent={report ? <View style={[styles.report, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.reportTitle, { color: colors.foreground }]}>{report.ok ? "Last validation accepted" : "Last validation rejected"}</Text><Text style={[styles.reportText, { color: colors.muted }]} numberOfLines={8}>{formatValidationReport(report)}</Text>{report.issues.length ? <View style={styles.issueList}>{report.issues.slice(0, 5).map((issue, index) => <Text key={`${issue.code}-${index}`} style={[styles.issue, { color: colors.error }]}>• {issue.message}</Text>)}</View> : null}</View> : null} ListEmptyComponent={activeBank ? <Text style={[styles.fallback, { color: colors.muted }]}>The active bank does not contain any completed unit summaries.</Text> : null} />;
}

const styles = StyleSheet.create({ content: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 30 }, actions: { gap: 10 }, status: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: 3 }, fallback: { fontSize: 13, lineHeight: 20 }, unit: { borderBottomWidth: StyleSheet.hairlineWidth, gap: 4, paddingVertical: 13 }, unitTitle: { fontSize: 15, fontWeight: "900" }, unitDetail: { fontSize: 12, lineHeight: 17 }, report: { borderRadius: 15, borderWidth: 1, gap: 8, marginTop: 20, padding: 14 }, reportTitle: { fontSize: 15, fontWeight: "900" }, reportText: { fontSize: 11, lineHeight: 16 }, issueList: { gap: 5 }, issue: { fontSize: 12, lineHeight: 17 } });
