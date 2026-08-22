import { useLocalSearchParams, useRouter } from "expo-router";
import { FlatList, StyleSheet, Text, View } from "react-native";

import { ActionButton, LinkRow, NotebookHeader, Notice, SectionLabel, StatusPill } from "@/components/molarum/ui";
import { useColors } from "@/hooks/use-colors";
import { SUBJECT_CATALOG, type SubjectId, topicsForUnit, unitsForSubject } from "@/lib/molarum/catalog";
import { useStudyLibrary } from "@/lib/molarum/provider";

export default function SubjectScreen() {
  const { subjectId: rawSubjectId } = useLocalSearchParams<{ subjectId: string }>();
  const subject = SUBJECT_CATALOG.find((item) => item.id === rawSubjectId) ?? null;
  const colors = useColors();
  const router = useRouter();
  const { questions } = useStudyLibrary();
  const units = subject ? unitsForSubject(questions, subject.id as SubjectId) : [];

  if (!subject) return <View style={[styles.center, { backgroundColor: colors.background }]}><NotebookHeader title="Subject unavailable" subtitle="This subject is not in the approved library index." /><ActionButton label="Return to library" onPress={() => router.replace("/")} icon="local-library" /></View>;
  return <FlatList style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content} data={units} keyExtractor={(item) => item.unitKey} ListHeaderComponent={<View style={{ gap: 10 }}><NotebookHeader onBack={() => router.back()} eyebrow="Subject shelf" title={subject.title} subtitle={units.length ? `${units.length} locally validated units are available.` : "No owner-approved source pages have been installed for this subject."} /><Notice>{units.length ? "Each question is source-referenced and available for offline revision." : "This subject is unresolved_after_retries_or_capacity until owner-provided source pages and a valid 40-question unit are available."}</Notice><SectionLabel>{units.length ? "Validated units" : "Content status"}</SectionLabel></View>} renderItem={({ item }) => <LinkRow title={item.unitTitle} detail={`${item.questions.length} questions · ${topicsForUnit(item.questions).length} source-grounded concepts`} onPress={() => router.push(`/unit/${encodeURIComponent(item.unitKey)}`)} />} ListEmptyComponent={<View style={[styles.unresolved, { borderColor: colors.border, backgroundColor: colors.surface }]}><StatusPill tone="warning" label="Unresolved" /><Text style={[styles.unresolvedTitle, { color: colors.foreground }]}>No validated units available</Text><Text style={[styles.unresolvedText, { color: colors.muted }]}>Molarum will not manufacture Grade 10 content. Import a validated, owner-approved bank once relevant source pages have been extracted.</Text><ActionButton label="Open question-bank management" onPress={() => router.push("/question-bank")} icon="settings" /></View>} />;
}

const styles = StyleSheet.create({ content: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 30 }, center: { alignItems: "center", flex: 1, justifyContent: "center", padding: 24 }, unresolved: { borderRadius: 16, borderWidth: 1, gap: 8, marginTop: 4, padding: 16 }, unresolvedTitle: { fontFamily: "Georgia", fontSize: 20, fontWeight: "700" }, unresolvedText: { fontSize: 14, lineHeight: 21 } });
