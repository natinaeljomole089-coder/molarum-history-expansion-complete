import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { NotebookHeader, Notice, SectionLabel, StatusPill } from "@/components/molarum/ui";
import { useColors } from "@/hooks/use-colors";
import { SUBJECT_CATALOG, unitsForSubject } from "@/lib/molarum/catalog";
import { useStudyLibrary } from "@/lib/molarum/provider";

export default function LibraryScreen() {
  const colors = useColors();
  const router = useRouter();
  const { ready, activeBank, questions } = useStudyLibrary();
  const [search, setSearch] = useState("");
  const data = useMemo(() => SUBJECT_CATALOG.filter((subject) => subject.title.toLowerCase().includes(search.trim().toLowerCase())), [search]);

  if (!ready) return <View style={[styles.loading, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.primary} /><Text style={{ color: colors.muted }}>Opening your local study desk…</Text></View>;

  return <FlatList style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" data={data} keyExtractor={(item) => item.id} ListHeaderComponent={<View style={styles.headerStack}><NotebookHeader eyebrow="Offline study library" title="Molarum" subtitle="Grade 10 revision tools stored on this device." /><Notice>Revision tool only. Every imported question remains labelled <Text style={{ fontWeight: "800" }}>Teacher review recommended</Text>.</Notice><View style={[styles.searchBox, { borderColor: colors.border, backgroundColor: colors.surface }]}><MaterialIcons name="search" size={20} color={colors.muted} /><TextInput value={search} onChangeText={setSearch} placeholder="Search a subject" placeholderTextColor={colors.muted} style={[styles.searchInput, { color: colors.foreground }]} returnKeyType="done" accessibilityLabel="Search subjects" /></View><View style={styles.statusLine}><SectionLabel>Library index</SectionLabel><StatusPill tone={activeBank ? "success" : "warning"} label={activeBank ? `${questions.length} validated questions` : "No validated bank"} /></View>{!activeBank ? <Text style={[styles.emptyNote, { color: colors.muted }]}>Owner-approved source materials have not yet been installed. Select a subject to view its local content state or import a validated bank in Tools.</Text> : null}</View>} renderItem={({ item }) => {
    const units = unitsForSubject(questions, item.id);
    const count = units.reduce((total, unit) => total + unit.questions.length, 0);
    return <Pressable accessibilityRole="button" accessibilityLabel={`Open ${item.title}`} onPress={() => router.push({ pathname: "/subject/[subjectId]" as never, params: { subjectId: item.id } })} style={({ pressed }) => [styles.subjectRow, { borderBottomColor: colors.border }, pressed && styles.pressed]}><View style={[styles.colorMark, { backgroundColor: item.accent }]} /><View style={styles.subjectBody}><Text style={[styles.subjectTitle, { color: colors.foreground }]}>{item.title}</Text><Text style={[styles.subjectDetail, { color: colors.muted }]}>{units.length ? `${units.length} validated unit${units.length === 1 ? "" : "s"} · ${count} questions` : "Content unresolved — source pages required"}</Text></View><View style={styles.subjectRight}>{units.length ? <StatusPill tone="success" label="Active" /> : <StatusPill tone="warning" label="Pending" />}<MaterialIcons name="chevron-right" size={22} color={colors.muted} /></View></Pressable>;
  }} ListEmptyComponent={<Text style={[styles.emptyNote, { color: colors.muted }]}>No subjects match your search.</Text>} />;
}

const styles = StyleSheet.create({
  loading: { alignItems: "center", flex: 1, gap: 12, justifyContent: "center" },
  content: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 24 },
  headerStack: { gap: 14, paddingBottom: 6 },
  searchBox: { alignItems: "center", borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: 9, minHeight: 48, paddingHorizontal: 13 },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 10 },
  statusLine: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  emptyNote: { fontSize: 13, lineHeight: 20, marginBottom: 10 },
  subjectRow: { alignItems: "center", borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", gap: 12, minHeight: 79, paddingVertical: 12 },
  colorMark: { borderRadius: 3, height: 42, width: 5 },
  subjectBody: { flex: 1, gap: 4 },
  subjectTitle: { fontFamily: "Georgia", fontSize: 19, fontWeight: "700" },
  subjectDetail: { fontSize: 12, lineHeight: 18 },
  subjectRight: { alignItems: "flex-end", gap: 5 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.99 }] },
});
