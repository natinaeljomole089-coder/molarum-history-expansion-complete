import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { useColors } from "@/hooks/use-colors";
import { topicsForUnit, unitByKey } from "@/lib/molarum/catalog";
import { filterQuizQuestions } from "@/lib/molarum/filters";
import { useStudyLibrary } from "@/lib/molarum/provider";
import type { Difficulty } from "@/lib/molarum/types";

const FILTERS: { label: string; value: Difficulty | "mixed" }[] = [{ label: "Mixed", value: "mixed" }, { label: "Easy", value: "easy" }, { label: "Medium", value: "medium" }, { label: "Hard", value: "hard" }];

export default function UnitDetailScreen() {
  const { unitKey: rawUnitKey } = useLocalSearchParams<{ unitKey: string }>();
  const unitKey = Array.isArray(rawUnitKey) ? rawUnitKey[0] : rawUnitKey;
  const router = useRouter();
  const colors = useColors();
  const { questions, bankDescriptor, inProgressQuiz } = useStudyLibrary();
  const unit = unitByKey(questions, unitKey);
  const [difficulty, setDifficulty] = useState<Difficulty | "mixed">("mixed");
  const [timed, setTimed] = useState(false);
  const available = useMemo(() => filterQuizQuestions(unit?.questions ?? [], difficulty), [unit, difficulty]);

  if (!unit) return <View style={[styles.center, { backgroundColor: colors.background }]}><MaterialIcons name="error-outline" size={42} color="#FB7185" /><Text style={[styles.centerTitle, { color: colors.foreground }]}>This lesson is unavailable</Text><Text style={[styles.centerText, { color: colors.muted }]}>Choose another subject to keep learning.</Text><Pressable onPress={() => router.replace("/")} style={styles.returnButton}><Text style={styles.returnText}>Back to Library</Text></Pressable></View>;

  const topics = topicsForUnit(unit.questions);
  const savedQuizForUnit = inProgressQuiz && inProgressQuiz.unitKey === unitKey && inProgressQuiz.bankId === bankDescriptor?.bankId ? inProgressQuiz : null;
  const subjectTitle = unit.unitKey.split("::")[0]?.replace(/(^|_)([a-z])/g, (_, prefix: string, letter: string) => `${prefix} ${letter.toUpperCase()}`).trim();

  return <FlatList
    style={{ backgroundColor: colors.background }}
    contentContainerStyle={styles.content}
    data={topics}
    keyExtractor={(topic) => topic}
    ListHeaderComponent={<View style={styles.headerStack}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back to subject" onPress={() => router.back()} style={styles.backButton}><MaterialIcons name="arrow-back" size={22} color={colors.foreground} /></Pressable>
      <Text style={[styles.eyebrow, { color: "#B66CFF" }]}>{subjectTitle?.toUpperCase()}</Text>
      <Text style={[styles.title, { color: colors.foreground }]}>{unit.unitTitle.replace(/^Unit \d+:\s*/i, "")}</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>{unit.questions.length} questions · Choose your practice style</Text>
      <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={styles.infoIcon}><MaterialIcons name="psychology" size={22} color="#B66CFF" /></View><View style={styles.infoCopy}><Text style={[styles.infoTitle, { color: colors.foreground }]}>Practice at your pace</Text><Text style={[styles.infoText, { color: colors.muted }]}>Your session is saved on this device so you can return later.</Text></View></View>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Difficulty</Text>
      <View style={styles.filters}>{FILTERS.map((filter) => <Pressable key={filter.value} disabled={Boolean(savedQuizForUnit)} onPress={() => setDifficulty(filter.value)} accessibilityRole="button" accessibilityState={{ selected: difficulty === filter.value, disabled: Boolean(savedQuizForUnit) }} style={({ pressed }) => [styles.filter, { backgroundColor: difficulty === filter.value ? "#3B267B" : colors.surface, borderColor: difficulty === filter.value ? "#9F7AFF" : colors.border, opacity: savedQuizForUnit ? 0.55 : 1 }, pressed && !savedQuizForUnit && styles.pressed]}><Text style={[styles.filterText, { color: difficulty === filter.value ? "#E6D9FF" : colors.muted }]}>{filter.label}</Text></Pressable>)}</View>
      <View style={[styles.timerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={styles.timerIcon}><MaterialIcons name="timer" size={21} color="#FFAE51" /></View><View style={styles.timerCopy}><Text style={[styles.timerTitle, { color: colors.foreground }]}>Timed practice</Text><Text style={[styles.timerDetail, { color: colors.muted }]}>{savedQuizForUnit ? `Saved as ${savedQuizForUnit.timed ? "timed" : "untimed"} practice.` : "Track how long your session takes."}</Text></View><Switch disabled={Boolean(savedQuizForUnit)} value={savedQuizForUnit?.timed ?? timed} onValueChange={setTimed} trackColor={{ false: "#29314D", true: "#6C42DE" }} thumbColor={(savedQuizForUnit?.timed ?? timed) ? "#FFFFFF" : "#B4BDD0"} accessibilityLabel="Toggle timed practice" /></View>
      {savedQuizForUnit ? <View style={[styles.resumeHint, { backgroundColor: "#211B3D", borderColor: "#513D8F" }]}><MaterialIcons name="history" size={18} color="#CBB6FF" /><Text style={styles.resumeHintText}>Your saved session will resume at question {savedQuizForUnit.index + 1} with its original settings.</Text></View> : null}
      {available.length ? <Pressable accessibilityRole="button" accessibilityLabel={savedQuizForUnit ? "Continue saved practice" : "Start practice"} onPress={() => router.push({ pathname: "/quiz/[unitKey]", params: { unitKey, difficulty, timed: timed ? "1" : "0" } })} style={({ pressed }) => [styles.startButton, pressed && styles.pressed]}><MaterialIcons name={savedQuizForUnit ? "play-arrow" : "rocket-launch"} size={21} color="#FFFFFF" /><Text style={styles.startText}>{savedQuizForUnit ? "Continue practice" : "Start practice"}</Text><Text style={styles.startCount}>{available.length} Qs</Text></Pressable> : <View style={[styles.noQuestions, { backgroundColor: colors.surface, borderColor: colors.border }]}><MaterialIcons name="info-outline" size={24} color="#FBBF24" /><Text style={[styles.noQuestionsText, { color: colors.muted }]}>Try another difficulty to find questions for this lesson.</Text></View>}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Topics in this unit</Text>
    </View>}
    renderItem={({ item, index }) => <View style={[styles.topicRow, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.topicNumber, { color: "#B66CFF" }]}>{String(index + 1).padStart(2, "0")}</Text><Text style={[styles.topicText, { color: colors.foreground }]}>{item}</Text></View>}
    ListFooterComponent={<View style={styles.footer} />}
  />;
}

const styles = StyleSheet.create({
  content: { gap: 10, paddingHorizontal: 18, paddingTop: 15, paddingBottom: 34 },
  headerStack: { gap: 13, paddingBottom: 3 },
  backButton: { alignItems: "center", backgroundColor: "#11172B", borderColor: "#252E4C", borderRadius: 14, borderWidth: 1, height: 43, justifyContent: "center", width: 43 },
  eyebrow: { fontSize: 11, fontWeight: "900", letterSpacing: 1.1, marginTop: 4 },
  title: { fontSize: 28, fontWeight: "900", letterSpacing: -0.7 },
  subtitle: { fontSize: 13, marginTop: -6 },
  infoCard: { alignItems: "center", borderRadius: 18, borderWidth: 1, flexDirection: "row", gap: 11, padding: 13 },
  infoIcon: { alignItems: "center", backgroundColor: "#211B3D", borderRadius: 13, height: 42, justifyContent: "center", width: 42 },
  infoCopy: { flex: 1, gap: 3 },
  infoTitle: { fontSize: 14, fontWeight: "900" },
  infoText: { fontSize: 12, lineHeight: 17 },
  sectionTitle: { fontSize: 17, fontWeight: "900", marginTop: 2 },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  filter: { borderRadius: 14, borderWidth: 1, minHeight: 42, paddingHorizontal: 14, justifyContent: "center" },
  filterText: { fontSize: 12, fontWeight: "900" },
  timerCard: { alignItems: "center", borderRadius: 18, borderWidth: 1, flexDirection: "row", gap: 11, padding: 13 },
  timerIcon: { alignItems: "center", backgroundColor: "#3C2818", borderRadius: 12, height: 39, justifyContent: "center", width: 39 },
  timerCopy: { flex: 1, gap: 2 },
  timerTitle: { fontSize: 14, fontWeight: "900" },
  timerDetail: { fontSize: 12 },
  topicRow: { alignItems: "center", borderRadius: 15, borderWidth: 1, flexDirection: "row", gap: 12, minHeight: 55, paddingHorizontal: 13 },
  topicNumber: { fontSize: 12, fontWeight: "900", width: 24 },
  topicText: { flex: 1, fontSize: 13, fontWeight: "700", lineHeight: 19 },
  footer: { marginTop: 10 },
  startButton: { alignItems: "center", backgroundColor: "#FF8A1F", borderRadius: 18, flexDirection: "row", gap: 10, minHeight: 57, paddingHorizontal: 17 },
  startText: { color: "#FFFFFF", flex: 1, fontSize: 16, fontWeight: "900" },
  startCount: { color: "#FFF2E5", fontSize: 12, fontWeight: "900" },
  noQuestions: { alignItems: "center", borderRadius: 18, borderWidth: 1, flexDirection: "row", gap: 10, padding: 15 },
  resumeHint: { alignItems: "center", borderRadius: 15, borderWidth: 1, flexDirection: "row", gap: 9, padding: 12 }, resumeHintText: { color: "#D9CBFF", flex: 1, fontSize: 12, lineHeight: 17 },
  noQuestionsText: { flex: 1, fontSize: 13, lineHeight: 18 },
  center: { alignItems: "center", flex: 1, gap: 12, justifyContent: "center", padding: 24 },
  centerTitle: { fontSize: 20, fontWeight: "900" },
  centerText: { fontSize: 13, textAlign: "center" },
  returnButton: { backgroundColor: "#FF8A1F", borderRadius: 15, marginTop: 4, paddingHorizontal: 18, paddingVertical: 13 },
  returnText: { color: "#FFFFFF", fontWeight: "900" },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
});
