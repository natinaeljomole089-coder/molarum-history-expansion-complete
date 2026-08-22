import { useLocalSearchParams, useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { ActionButton, ActiveBankStatus, NotebookHeader, Notice, StatusPill } from "@/components/molarum/ui";
import { useColors } from "@/hooks/use-colors";
import { secondsToClock } from "@/lib/molarum/quiz";
import { useStudyLibrary } from "@/lib/molarum/provider";

export default function ResultsScreen() {
  const { attemptId } = useLocalSearchParams<{ attemptId: string }>();
  const router = useRouter();
  const colors = useColors();
  const { activeBank, activeBankOrigin, bankDescriptor, attempts, questions } = useStudyLibrary();
  const attempt = attempts.find((item) => item.id === attemptId);
  if (!attempt) return <View style={[styles.center, { backgroundColor: colors.background }]}><NotebookHeader title="Result unavailable" subtitle="This local revision record could not be found." onBack={() => router.replace("/")} /><ActionButton label="View local records" onPress={() => router.replace("/(tabs)/records")} icon="assignment" /><ActionButton label="Return to library" secondary onPress={() => router.replace("/")} icon="local-library" /></View>;
  const percentage = Math.round((attempt.correct / attempt.total) * 100);
  return <View style={[styles.screen, { backgroundColor: colors.background }]}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"><NotebookHeader eyebrow="Local result" title="Revision complete" subtitle={attempt.unitTitle} /><ActiveBankStatus origin={activeBank ? activeBankOrigin : "none"} questionCount={questions.length} sourceCatalogVersion={bankDescriptor?.sourceCatalogVersion} /><View style={[styles.scoreBlock, { backgroundColor: colors.surface, borderColor: colors.border }]}><MaterialIcons name="fact-check" size={34} color={colors.primary} /><Text style={[styles.score, { color: colors.foreground }]}>{attempt.correct}/{attempt.total}</Text><Text style={[styles.scoreCaption, { color: colors.muted }]}>{percentage}% correct · {attempt.total - attempt.correct} incorrect</Text>{attempt.timed ? <StatusPill label={`Timed · ${secondsToClock(attempt.elapsedSeconds)}`} /> : <StatusPill label="Untimed practice" />}</View><View style={[styles.detailBlock, { borderColor: colors.border, backgroundColor: colors.surface }]}><Text style={[styles.detailText, { color: colors.foreground }]}>Saved locally</Text><Text style={[styles.detailText, { color: colors.muted }]}>Unit: {attempt.unitTitle}</Text><Text style={[styles.detailText, { color: colors.muted }]}>Completed: {new Date(attempt.completedAt).toLocaleString()}</Text><Text style={[styles.detailText, { color: colors.muted }]}>Question count: {attempt.total}</Text><Text style={[styles.detailText, { color: colors.muted }]}>Bank: {attempt.bankSourceCatalogVersion} ({attempt.bankOrigin === "imported_draft" ? "Imported AI draft" : attempt.bankOrigin === "packaged_validated" ? "Packaged validated" : "Legacy record"})</Text></View><Notice>Saved locally. This score is a source-grounded revision record, not a formal assessment result.</Notice><View style={styles.actions}><ActionButton label="Replay unit" icon="replay" onPress={() => router.replace(`/unit/${encodeURIComponent(attempt.unitKey)}`)} /><ActionButton label="View local records" secondary icon="assignment" onPress={() => router.replace("/(tabs)/records")} /><ActionButton label="Return to library" secondary onPress={() => router.replace("/")} /></View></ScrollView></View>;
}

const styles = StyleSheet.create({ screen: { flex: 1 }, content: { flexGrow: 1, gap: 17, justifyContent: "center", padding: 20 }, center: { flex: 1, gap: 12, padding: 20 }, scoreBlock: { alignItems: "center", borderRadius: 20, borderWidth: 1, gap: 7, padding: 25 }, score: { fontFamily: "Georgia", fontSize: 52, fontWeight: "700", letterSpacing: -1 }, scoreCaption: { fontSize: 14, textAlign: "center" }, detailBlock: { borderRadius: 14, borderWidth: 1, gap: 5, padding: 13 }, detailText: { fontSize: 13, lineHeight: 19 }, actions: { gap: 10 } });
