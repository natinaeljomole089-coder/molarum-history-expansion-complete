import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";

import { useColors } from "@/hooks/use-colors";
import { secondsToClock } from "@/lib/molarum/quiz";
import { useStudyLibrary } from "@/lib/molarum/provider";

export default function ResultsScreen() {
  const { attemptId } = useLocalSearchParams<{ attemptId: string }>();
  const router = useRouter();
  const colors = useColors();
  const { attempts } = useStudyLibrary();
  const attempt = attempts.find((item) => item.id === attemptId);
  if (!attempt) return <View style={[styles.center, { backgroundColor: colors.background }]}><MaterialIcons name="insights" size={42} color="#B66CFF" /><Text style={[styles.centerTitle, { color: colors.foreground }]}>Result not found</Text><Text style={[styles.centerText, { color: colors.muted }]}>Return to the Library and choose a lesson to continue.</Text><Pressable onPress={() => router.replace("/")} style={styles.primaryButton}><Text style={styles.primaryText}>Back to Library</Text></Pressable></View>;
  const percentage = Math.round((attempt.correct / attempt.total) * 100);
  const mood = percentage >= 80 ? { title: "Excellent work!", message: "You’re building strong understanding.", icon: "celebration" as const, color: "#6EE7B7" } : percentage >= 55 ? { title: "Nice progress!", message: "A quick review will make this even stronger.", icon: "trending-up" as const, color: "#B66CFF" } : { title: "Keep going!", message: "Practice is how progress happens.", icon: "auto-awesome" as const, color: "#FFAE51" };
  return <View style={[styles.screen, { backgroundColor: colors.background }]}><ScrollView contentContainerStyle={styles.content}>
    <Pressable onPress={() => router.replace("/")} accessibilityRole="button" accessibilityLabel="Back to Library" style={styles.closeButton}><MaterialIcons name="close" size={22} color={colors.foreground} /></Pressable>
    <View style={styles.hero}><View style={[styles.heroIcon, { backgroundColor: `${mood.color}24`, borderColor: `${mood.color}55` }]}><MaterialIcons name={mood.icon} size={34} color={mood.color} /></View><Text style={[styles.eyebrow, { color: mood.color }]}>PRACTICE COMPLETE</Text><Text style={[styles.title, { color: colors.foreground }]}>{mood.title}</Text><Text style={[styles.subtitle, { color: colors.muted }]}>{attempt.unitTitle}</Text></View>
    <View style={[styles.scoreCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={styles.scoreCircle}><Text style={styles.scorePercent}>{percentage}%</Text><Text style={styles.scoreLabel}>score</Text></View><View style={styles.scoreCopy}><Text style={[styles.scoreTitle, { color: colors.foreground }]}>{attempt.correct} correct answers</Text><Text style={[styles.scoreText, { color: colors.muted }]}>{mood.message}</Text><View style={styles.modeRow}><MaterialIcons name={attempt.timed ? "timer" : "self-improvement"} size={16} color="#B66CFF" /><Text style={[styles.modeText, { color: colors.muted }]}>{attempt.timed ? `${secondsToClock(attempt.elapsedSeconds)} timed practice` : "Practice at your pace"}</Text></View></View></View>
    <View style={styles.quickStats}><View style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.statValue, { color: "#6EE7B7" }]}>{attempt.correct}</Text><Text style={[styles.statLabel, { color: colors.muted }]}>Correct</Text></View><View style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.statValue, { color: "#FB7185" }]}>{attempt.total - attempt.correct}</Text><Text style={[styles.statLabel, { color: colors.muted }]}>To review</Text></View><View style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.statValue, { color: "#B66CFF" }]}>{attempt.total}</Text><Text style={[styles.statLabel, { color: colors.muted }]}>Questions</Text></View></View>
    <View style={styles.actions}><Pressable onPress={() => router.replace(`/unit/${encodeURIComponent(attempt.unitKey)}`)} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}><MaterialIcons name="replay" size={20} color="#FFFFFF" /><Text style={styles.primaryText}>Practice this unit again</Text></Pressable><Pressable onPress={() => router.replace({ pathname: "/subject/[subjectId]" as never, params: { subjectId: attempt.unitKey.split("::")[0] } })} style={({ pressed }) => [styles.secondaryButton, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}><Text style={[styles.secondaryText, { color: colors.foreground }]}>Back to subject</Text><MaterialIcons name="arrow-forward" size={19} color="#B66CFF" /></Pressable></View>
  </ScrollView></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, content: { flexGrow: 1, gap: 18, paddingBottom: 34, paddingHorizontal: 18, paddingTop: 16 },
  closeButton: { alignItems: "center", alignSelf: "flex-end", backgroundColor: "#11172B", borderColor: "#252E4C", borderRadius: 14, borderWidth: 1, height: 43, justifyContent: "center", width: 43 },
  hero: { alignItems: "center", gap: 7, marginTop: 4 }, heroIcon: { alignItems: "center", borderRadius: 24, borderWidth: 1, height: 74, justifyContent: "center", width: 74 },
  eyebrow: { fontSize: 10, fontWeight: "900", letterSpacing: 1.2, marginTop: 4 }, title: { fontSize: 29, fontWeight: "900", letterSpacing: -0.6 }, subtitle: { fontSize: 13, textAlign: "center" },
  scoreCard: { alignItems: "center", borderRadius: 22, borderWidth: 1, flexDirection: "row", gap: 17, padding: 17 }, scoreCircle: { alignItems: "center", backgroundColor: "#352477", borderColor: "#9C76FF", borderRadius: 50, borderWidth: 5, height: 92, justifyContent: "center", width: 92 }, scorePercent: { color: "#FFFFFF", fontSize: 24, fontWeight: "900" }, scoreLabel: { color: "#D7C7FF", fontSize: 10, fontWeight: "800" },
  scoreCopy: { flex: 1, gap: 5 }, scoreTitle: { fontSize: 16, fontWeight: "900" }, scoreText: { fontSize: 12, lineHeight: 17 }, modeRow: { alignItems: "center", flexDirection: "row", gap: 6, marginTop: 3 }, modeText: { flex: 1, fontSize: 11, fontWeight: "700" },
  quickStats: { flexDirection: "row", gap: 9 }, stat: { alignItems: "center", borderRadius: 17, borderWidth: 1, flex: 1, gap: 3, minHeight: 80, justifyContent: "center", paddingHorizontal: 6 }, statValue: { fontSize: 20, fontWeight: "900" }, statLabel: { fontSize: 10, fontWeight: "800" },
  actions: { gap: 10 }, primaryButton: { alignItems: "center", backgroundColor: "#FF8A1F", borderRadius: 17, flexDirection: "row", gap: 10, justifyContent: "center", minHeight: 55, paddingHorizontal: 16 }, primaryText: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" }, secondaryButton: { alignItems: "center", borderRadius: 17, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", minHeight: 54, paddingHorizontal: 16 }, secondaryText: { fontSize: 14, fontWeight: "900" },
  center: { alignItems: "center", flex: 1, gap: 12, justifyContent: "center", padding: 24 }, centerTitle: { fontSize: 20, fontWeight: "900" }, centerText: { fontSize: 13, textAlign: "center" }, pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
});
