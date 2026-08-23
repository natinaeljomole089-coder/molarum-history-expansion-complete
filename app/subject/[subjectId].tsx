import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/use-colors";
import { SUBJECT_CATALOG, type SubjectId, unitsForSubject } from "@/lib/molarum/catalog";
import { useStudyLibrary } from "@/lib/molarum/provider";

export default function SubjectScreen() {
  const { subjectId: rawSubjectId } = useLocalSearchParams<{ subjectId: string }>();
  const subject = SUBJECT_CATALOG.find((item) => item.id === rawSubjectId) ?? null;
  const colors = useColors();
  const router = useRouter();
  const { questions, attempts } = useStudyLibrary();
  const units = subject ? unitsForSubject(questions, subject.id as SubjectId) : [];
  const completedCount = units.filter((unit) => attempts.some((attempt) => attempt.unitKey === unit.unitKey)).length;
  const progress = units.length ? Math.round((completedCount / units.length) * 100) : 0;

  if (!subject) return <View style={[styles.center, { backgroundColor: colors.background }]}><MaterialIcons name="menu-book" size={42} color="#B66CFF" /><Text style={[styles.centerTitle, { color: colors.foreground }]}>Subject unavailable</Text><Pressable onPress={() => router.replace("/")} style={styles.returnButton}><Text style={styles.returnText}>Back to Library</Text></Pressable></View>;

  const startNextUnit = () => {
    const nextUnit = units.find((unit) => !attempts.some((attempt) => attempt.unitKey === unit.unitKey)) ?? units[0];
    if (nextUnit) router.push(`/unit/${encodeURIComponent(nextUnit.unitKey)}`);
  };

  return <FlatList
    style={{ backgroundColor: colors.background }}
    contentContainerStyle={styles.content}
    data={units}
    keyExtractor={(item) => item.unitKey}
    ListHeaderComponent={<View style={styles.headerStack}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back to Library" onPress={() => router.back()} style={styles.backButton}><MaterialIcons name="arrow-back" size={22} color={colors.foreground} /></Pressable>
      <View style={styles.subjectHero}><View style={[styles.subjectIcon, { backgroundColor: `${subject.accent}28`, borderColor: `${subject.accent}72` }]}><MaterialIcons name="science" size={31} color={subject.accent} /></View><View style={styles.heroCopy}><Text style={[styles.subjectName, { color: colors.foreground }]}>{subject.title}</Text><Text style={[styles.subjectMeta, { color: colors.muted }]}>{units.length ? `${units.length} units · ${units.reduce((sum, unit) => sum + unit.questions.length, 0)} questions` : "Content coming soon"}</Text></View></View>
      {units.length ? <View style={[styles.progressCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={styles.progressTop}><View><Text style={[styles.progressTitle, { color: colors.foreground }]}>Your subject progress</Text><Text style={[styles.progressDetail, { color: colors.muted }]}>{completedCount ? `${completedCount} unit${completedCount === 1 ? "" : "s"} practiced` : "Begin your first practice session"}</Text></View><Text style={[styles.progressValue, { color: subject.accent }]}>{progress}%</Text></View><View style={[styles.track, { backgroundColor: "#1B233E" }]}><View style={[styles.fill, { backgroundColor: subject.accent, width: `${Math.max(2, progress)}%` }]} /></View></View> : null}
      {units.length ? <Pressable accessibilityRole="button" accessibilityLabel={`Start ${subject.title} practice`} onPress={startNextUnit} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}><MaterialIcons name="play-arrow" size={22} color="#FFFFFF" /><Text style={styles.primaryButtonText}>{completedCount ? "Practice next unit" : "Start practice"}</Text><MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" /></Pressable> : null}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{units.length ? "Units" : "Coming soon"}</Text>
    </View>}
    renderItem={({ item, index }) => {
      const practiced = attempts.some((attempt) => attempt.unitKey === item.unitKey);
      return <Pressable accessibilityRole="button" accessibilityLabel={`Open ${item.unitTitle}`} onPress={() => router.push(`/unit/${encodeURIComponent(item.unitKey)}`)} style={({ pressed }) => [styles.unitCard, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}><View style={[styles.unitNumber, { backgroundColor: practiced ? `${subject.accent}2B` : "#181E35" }]}><Text style={[styles.unitNumberText, { color: practiced ? subject.accent : colors.muted }]}>{index + 1}</Text></View><View style={styles.unitCopy}><Text numberOfLines={1} style={[styles.unitTitle, { color: colors.foreground }]}>{item.unitTitle.replace(/^Unit \d+:\s*/i, "")}</Text><Text style={[styles.unitDetail, { color: colors.muted }]}>{item.questions.length} questions · {practiced ? "Practiced" : "Ready to start"}</Text></View>{practiced ? <View style={styles.continuePill}><Text style={styles.continuePillText}>Practice again</Text></View> : null}<MaterialIcons name="chevron-right" size={22} color={colors.muted} /></Pressable>;
    }}
    ListEmptyComponent={<View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={styles.emptyIcon}><MaterialIcons name="hourglass-empty" size={30} color="#FBBF24" /></View><Text style={[styles.emptyTitle, { color: colors.foreground }]}>This subject is on the way</Text><Text style={[styles.emptyText, { color: colors.muted }]}>Practice units will appear here when they are ready.</Text><Pressable onPress={() => router.replace("/")} style={styles.libraryLink}><Text style={styles.libraryLinkText}>Explore available subjects</Text></Pressable></View>}
  />;
}

const styles = StyleSheet.create({
  content: { gap: 11, paddingHorizontal: 18, paddingTop: 15, paddingBottom: 34 },
  headerStack: { gap: 15, paddingBottom: 4 },
  backButton: { alignItems: "center", backgroundColor: "#11172B", borderColor: "#252E4C", borderRadius: 14, borderWidth: 1, height: 43, justifyContent: "center", width: 43 },
  subjectHero: { alignItems: "center", flexDirection: "row", gap: 14 },
  subjectIcon: { alignItems: "center", borderRadius: 20, borderWidth: 1, height: 68, justifyContent: "center", width: 68 },
  heroCopy: { flex: 1, gap: 4 },
  subjectName: { fontSize: 28, fontWeight: "900", letterSpacing: -0.6 },
  subjectMeta: { fontSize: 13 },
  progressCard: { borderRadius: 20, borderWidth: 1, gap: 14, padding: 16 },
  progressTop: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  progressTitle: { fontSize: 15, fontWeight: "900" },
  progressDetail: { fontSize: 12, marginTop: 3 },
  progressValue: { fontSize: 26, fontWeight: "900" },
  track: { borderRadius: 4, height: 7, overflow: "hidden" },
  fill: { borderRadius: 4, height: "100%" },
  primaryButton: { alignItems: "center", backgroundColor: "#FF8A1F", borderRadius: 17, flexDirection: "row", justifyContent: "center", minHeight: 55, paddingHorizontal: 17 },
  primaryButtonText: { color: "#FFFFFF", flex: 1, fontSize: 16, fontWeight: "900", textAlign: "center" },
  sectionTitle: { fontSize: 20, fontWeight: "900", marginTop: 4 },
  unitCard: { alignItems: "center", borderRadius: 17, borderWidth: 1, flexDirection: "row", gap: 11, minHeight: 76, padding: 12 },
  unitNumber: { alignItems: "center", borderRadius: 14, height: 40, justifyContent: "center", width: 40 },
  unitNumberText: { fontSize: 15, fontWeight: "900" },
  unitCopy: { flex: 1, gap: 4 },
  unitTitle: { fontSize: 14, fontWeight: "900" },
  unitDetail: { fontSize: 11 },
  continuePill: { backgroundColor: "#213A32", borderRadius: 12, paddingHorizontal: 8, paddingVertical: 5 },
  continuePillText: { color: "#6EE7B7", fontSize: 10, fontWeight: "900" },
  emptyCard: { alignItems: "center", borderRadius: 22, borderWidth: 1, gap: 9, marginTop: 4, padding: 26 },
  emptyIcon: { alignItems: "center", backgroundColor: "#352B18", borderRadius: 18, height: 55, justifyContent: "center", width: 55 },
  emptyTitle: { fontSize: 19, fontWeight: "900", textAlign: "center" },
  emptyText: { fontSize: 13, lineHeight: 19, textAlign: "center" },
  libraryLink: { backgroundColor: "#271E48", borderRadius: 14, marginTop: 4, minHeight: 46, justifyContent: "center", paddingHorizontal: 15 },
  libraryLinkText: { color: "#CBB6FF", fontSize: 13, fontWeight: "900" },
  center: { alignItems: "center", flex: 1, gap: 14, justifyContent: "center", padding: 24 },
  centerTitle: { fontSize: 20, fontWeight: "900" },
  returnButton: { backgroundColor: "#FF8A1F", borderRadius: 15, paddingHorizontal: 18, paddingVertical: 13 },
  returnText: { color: "#FFFFFF", fontWeight: "900" },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
});
