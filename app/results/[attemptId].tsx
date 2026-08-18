import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { ActionButton, NotebookHeader, Notice, StatusPill } from "@/components/molarum/ui";
import { useColors } from "@/hooks/use-colors";
import { secondsToClock } from "@/lib/molarum/quiz";
import { useStudyLibrary } from "@/lib/molarum/provider";

export default function ResultsScreen() {
  const { attemptId } = useLocalSearchParams<{ attemptId: string }>();
  const router = useRouter();
  const colors = useColors();
  const { attempts } = useStudyLibrary();
  const attempt = attempts.find((item) => item.id === attemptId);
  if (!attempt) return <View style={[styles.center, { backgroundColor: colors.background }]}><NotebookHeader title="Result unavailable" subtitle="This local attempt could not be found." onBack={() => router.replace("/")} /></View>;
  const percentage = Math.round((attempt.correct / attempt.total) * 100);
  return <View style={[styles.screen, { backgroundColor: colors.background }]}><View style={styles.content}><NotebookHeader eyebrow="Local result" title="Revision complete" subtitle={attempt.unitTitle} /><View style={[styles.scoreBlock, { backgroundColor: colors.surface, borderColor: colors.border }]}><MaterialIcons name="fact-check" size={34} color={colors.primary} /><Text style={[styles.score, { color: colors.foreground }]}>{attempt.correct}/{attempt.total}</Text><Text style={[styles.scoreCaption, { color: colors.muted }]}>{percentage}% correct on this local attempt</Text>{attempt.timed ? <StatusPill label={`Timed · ${secondsToClock(attempt.elapsedSeconds)}`} /> : <StatusPill label="Untimed practice" />}</View><Notice>Stored only on this device. This score is a revision record, not a formal assessment result.</Notice><View style={styles.actions}><ActionButton label="Replay unit" icon="replay" onPress={() => router.replace(`/unit/${encodeURIComponent(attempt.unitKey)}`)} /><ActionButton label="Return to library" secondary icon="local-library" onPress={() => router.replace("/")} /></View></View></View>;
}

const styles = StyleSheet.create({ screen: { flex: 1 }, content: { flex: 1, gap: 17, justifyContent: "center", padding: 20 }, center: { flex: 1, padding: 20 }, scoreBlock: { alignItems: "center", borderRadius: 20, borderWidth: 1, gap: 7, padding: 25 }, score: { fontFamily: "Georgia", fontSize: 52, fontWeight: "700", letterSpacing: -1 }, scoreCaption: { fontSize: 14 }, actions: { gap: 10 } });
