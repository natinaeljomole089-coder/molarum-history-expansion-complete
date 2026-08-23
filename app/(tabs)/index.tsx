import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/use-colors";
import { SUBJECT_CATALOG, unitsForSubject } from "@/lib/molarum/catalog";
import { useStudyLibrary } from "@/lib/molarum/provider";

const SUBJECT_ICONS: Record<string, React.ComponentProps<typeof MaterialIcons>["name"]> = {
  chemistry: "science",
  physics: "bolt",
  biology: "eco",
  mathematics: "calculate",
  geography: "public",
  history: "hourglass-empty",
  citizenship: "groups",
  economics: "show-chart",
  health_pe: "favorite",
};

export default function LibraryScreen() {
  const colors = useColors();
  const router = useRouter();
  const { ready, questions, attempts, inProgressQuiz, bankDescriptor } = useStudyLibrary();
  const progress = useMemo(() => attempts.reduce<Record<string, number>>((result, attempt) => {
    const key = attempt.unitKey.split("::")[0] ?? "";
    result[key] = (result[key] ?? 0) + 1;
    return result;
  }, {}), [attempts]);
  const resume = inProgressQuiz && inProgressQuiz.bankId === bankDescriptor?.bankId ? inProgressQuiz : null;

  if (!ready) return <View style={[styles.loading, { backgroundColor: colors.background }]}><ActivityIndicator color="#B66CFF" /><Text style={[styles.loadingText, { color: colors.muted }]}>Preparing your learning space…</Text></View>;

  return <FlatList
    style={{ backgroundColor: colors.background }}
    contentContainerStyle={styles.content}
    data={SUBJECT_CATALOG}
    numColumns={2}
    columnWrapperStyle={styles.columns}
    keyExtractor={(subject) => subject.id}
    ListHeaderComponent={<View style={styles.headerStack}>
      <View style={styles.brandRow}><View style={styles.brandMark}><Text style={styles.brandMarkText}>M</Text></View><View><Text style={[styles.brand, { color: colors.foreground }]}>Molarum</Text><Text style={[styles.tagline, { color: colors.muted }]}>Study smarter. Anywhere.</Text></View></View>
      <View style={styles.heroCard}>
        <View style={styles.heroGlow} /><View style={styles.heroBody}><Text style={styles.heroKicker}>GRADE 10 LEARNING</Text><Text style={styles.heroNumber}>{questions.length.toLocaleString()}</Text><Text style={styles.heroTitle}>Questions ready for practice</Text><Text style={styles.heroSupport}>Build confidence across your subjects, even offline.</Text></View><View style={styles.heroIcon}><MaterialIcons name="auto-stories" size={34} color="#FFFFFF" /></View>
      </View>
      {resume ? <Pressable accessibilityRole="button" accessibilityLabel="Continue saved practice" onPress={() => router.push({ pathname: "/quiz/[unitKey]" as never, params: { unitKey: resume.unitKey, difficulty: resume.difficulty, timed: resume.timed ? "1" : "0" } })} style={({ pressed }) => [styles.continueCard, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}><View style={styles.continueIcon}><MaterialIcons name="play-arrow" size={21} color="#FFFFFF" /></View><View style={styles.continueCopy}><Text style={[styles.continueTitle, { color: colors.foreground }]}>Continue learning</Text><Text numberOfLines={1} style={[styles.continueDetail, { color: colors.muted }]}>{resume.unitTitle}</Text></View><MaterialIcons name="arrow-forward" size={21} color="#FFAE51" /></Pressable> : <View style={[styles.momentumCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><MaterialIcons name="local-fire-department" size={22} color="#FF8A1F" /><Text style={[styles.momentumText, { color: colors.foreground }]}>{attempts.length ? "Keep your momentum going" : "Your next lesson starts here"}</Text></View>}
      <View style={styles.sectionHead}><View><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Browse subjects</Text><Text style={[styles.sectionSupport, { color: colors.muted }]}>Choose a subject to start learning</Text></View><View style={styles.questionPill}><Text style={styles.questionPillText}>{questions.length.toLocaleString()} Qs</Text></View></View>
    </View>}
    renderItem={({ item }) => {
      const units = unitsForSubject(questions, item.id);
      const questionCount = units.reduce((sum, unit) => sum + unit.questions.length, 0);
      const available = units.length > 0;
      const completed = progress[item.id] ?? 0;
      return <Pressable disabled={!available} accessibilityRole="button" accessibilityLabel={available ? `Open ${item.title}` : `${item.title} is coming soon`} onPress={() => router.push({ pathname: "/subject/[subjectId]" as never, params: { subjectId: item.id } })} style={({ pressed }) => [styles.subjectCard, { backgroundColor: colors.surface, borderColor: colors.border, opacity: available ? 1 : 0.66 }, pressed && available && styles.pressed]}><View style={styles.subjectTop}><View style={[styles.subjectIcon, { backgroundColor: `${item.accent}26` }]}><MaterialIcons name={SUBJECT_ICONS[item.id]} size={22} color={item.accent} /></View><MaterialIcons name="chevron-right" size={19} color={available ? colors.muted : "#6F7892"} /></View><Text numberOfLines={1} style={[styles.subjectTitle, { color: colors.foreground }]}>{item.title}</Text><Text numberOfLines={1} style={[styles.subjectDetail, { color: colors.muted }]}>{available ? `${units.length} units · ${questionCount} Qs` : "Coming soon"}</Text>{available ? <View style={styles.subjectFooter}><View style={[styles.miniTrack, { backgroundColor: "#1E2741" }]}><View style={[styles.miniFill, { backgroundColor: item.accent, width: `${Math.min(100, completed * 18)}%` }]} /></View><Text style={[styles.progressText, { color: completed ? item.accent : colors.muted }]}>{completed ? `${completed} done` : "Start"}</Text></View> : <View style={styles.subjectFooter}><Text style={[styles.pending, { color: "#FBBF24" }]}>Not available yet</Text></View>}</Pressable>;
    }}
  />;
}

const styles = StyleSheet.create({
  loading: { alignItems: "center", flex: 1, gap: 12, justifyContent: "center" },
  loadingText: { fontSize: 14, fontWeight: "700" },
  content: { gap: 11, paddingHorizontal: 18, paddingTop: 20, paddingBottom: 34 },
  columns: { gap: 11 },
  headerStack: { gap: 15, paddingBottom: 7 },
  brandRow: { alignItems: "center", flexDirection: "row", gap: 10 },
  brandMark: { alignItems: "center", backgroundColor: "#7441E8", borderRadius: 12, height: 38, justifyContent: "center", transform: [{ rotate: "-7deg" }], width: 38 },
  brandMarkText: { color: "#FFFFFF", fontSize: 22, fontStyle: "italic", fontWeight: "900" },
  brand: { fontSize: 24, fontWeight: "900", letterSpacing: -0.6 },
  tagline: { fontSize: 13, marginTop: 1 },
  heroCard: { backgroundColor: "#332276", borderColor: "#7048E8", borderRadius: 24, borderWidth: 1, minHeight: 154, overflow: "hidden", padding: 19, position: "relative" },
  heroGlow: { backgroundColor: "#7048E8", borderRadius: 110, height: 220, opacity: 0.48, position: "absolute", right: -88, top: -58, width: 220 },
  heroBody: { gap: 3, maxWidth: "68%" },
  heroKicker: { color: "#D9C4FF", fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  heroNumber: { color: "#FFFFFF", fontSize: 34, fontWeight: "900", letterSpacing: -1, marginTop: 4 },
  heroTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  heroSupport: { color: "#D8CEFA", fontSize: 12, lineHeight: 17, marginTop: 3 },
  heroIcon: { alignItems: "center", backgroundColor: "#9A67FF", borderColor: "#DCCBFF", borderRadius: 18, borderWidth: 1, height: 62, justifyContent: "center", position: "absolute", right: 20, top: 47, width: 62 },
  continueCard: { alignItems: "center", borderRadius: 18, borderWidth: 1, flexDirection: "row", gap: 11, minHeight: 66, paddingHorizontal: 13 },
  continueIcon: { alignItems: "center", backgroundColor: "#FF8A1F", borderRadius: 13, height: 39, justifyContent: "center", width: 39 },
  continueCopy: { flex: 1, gap: 2 },
  continueTitle: { fontSize: 15, fontWeight: "900" },
  continueDetail: { fontSize: 12 },
  momentumCard: { alignItems: "center", borderRadius: 16, borderWidth: 1, flexDirection: "row", gap: 9, minHeight: 51, paddingHorizontal: 14 },
  momentumText: { fontSize: 13, fontWeight: "800" },
  sectionHead: { alignItems: "flex-end", flexDirection: "row", justifyContent: "space-between", marginTop: 3 },
  sectionTitle: { fontSize: 20, fontWeight: "900", letterSpacing: -0.35 },
  sectionSupport: { fontSize: 12, marginTop: 3 },
  questionPill: { backgroundColor: "#1B1936", borderColor: "#41316E", borderRadius: 20, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
  questionPillText: { color: "#C4A8FF", fontSize: 11, fontWeight: "900" },
  subjectCard: { borderRadius: 19, borderWidth: 1, flex: 1, gap: 8, minHeight: 158, padding: 13 },
  subjectTop: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  subjectIcon: { alignItems: "center", borderRadius: 13, height: 43, justifyContent: "center", width: 43 },
  subjectTitle: { fontSize: 15, fontWeight: "900", marginTop: 1 },
  subjectDetail: { fontSize: 11, lineHeight: 16 },
  subjectFooter: { gap: 6, marginTop: "auto" },
  miniTrack: { borderRadius: 3, height: 4, overflow: "hidden" },
  miniFill: { borderRadius: 3, height: "100%" },
  progressText: { fontSize: 10, fontWeight: "900" },
  pending: { fontSize: 10, fontWeight: "900" },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
});
