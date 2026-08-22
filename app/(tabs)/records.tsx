import { useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TextInput, View } from "react-native";

import { ActionButton, NotebookHeader, Notice, SectionLabel, StatusPill } from "@/components/molarum/ui";
import { useColors } from "@/hooks/use-colors";
import { useCloud } from "@/lib/molarum/cloud-provider";
import { exportScoreHistoryPdf } from "@/lib/molarum/native-actions";
import { useStudyLibrary } from "@/lib/molarum/provider";
import type { LearnerProfile } from "@/lib/molarum/types";

export default function RecordsScreen() {
  const colors = useColors();
  const cloud = useCloud();
  const { learnerProfile, updateLearnerProfile, attempts } = useStudyLibrary();
  const [profile, setProfile] = useState<LearnerProfile>(learnerProfile);
  useEffect(() => setProfile(learnerProfile), [learnerProfile]);
  const save = () => { updateLearnerProfile(profile); Alert.alert("Saved locally", "Learner details are stored only on this device."); };
  const [lastPdfUri, setLastPdfUri] = useState<string | null>(null);
  const exportPdf = async () => { try { const uri = await exportScoreHistoryPdf(profile, attempts); setLastPdfUri(uri); } catch { Alert.alert("Export unavailable", "The PDF could not be prepared on this device."); } };
  const sync = async () => { const result = await cloud.syncMyRecords(); Alert.alert(result.ok ? "Cloud sync" : "Cloud sync unavailable", result.message); };
  const uploadPdf = async () => { if (!lastPdfUri) return; const result = await cloud.uploadLearnerReport(lastPdfUri); Alert.alert(result.ok ? "Private report upload" : "Report upload unavailable", result.message); };
  return <FlatList style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content} data={attempts} keyExtractor={(item) => item.id} ListHeaderComponent={<View style={{ gap: 12 }}><NotebookHeader eyebrow={cloud.session ? "Local records with optional cloud sync" : "Device-only records"} title="Learner records" subtitle="Optional learner details and revision scores remain local until you choose an explicit cloud action." /><Notice>{cloud.session ? "You are signed in, but this screen does not sync automatically. Use Sync my records when you want a private cloud copy." : "Keep this information only if it is appropriate for the learner’s device. Sign in from Tools → Account & sync only if cross-device access is needed."}</Notice><SectionLabel>Optional learner profile</SectionLabel><View style={styles.form}>{([ ["name", "Learner name"], ["className", "Class"], ["school", "School"] ] as const).map(([key, label]) => <TextInput key={key} value={profile[key]} onChangeText={(value) => setProfile((current) => ({ ...current, [key]: value }))} placeholder={label} placeholderTextColor={colors.muted} style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.foreground }]} returnKeyType="done" accessibilityLabel={label} />)}<ActionButton label="Save local profile" secondary icon="save" onPress={save} /></View>{cloud.session ? <ActionButton label="Sync my local records" secondary icon="sync" onPress={sync} /> : null}<View style={styles.recordHeading}><SectionLabel>Score history</SectionLabel><StatusPill label={`${attempts.length} attempt${attempts.length === 1 ? "" : "s"}`} /></View><ActionButton label="Export score history to PDF" icon="picture-as-pdf" onPress={exportPdf} />{cloud.session && lastPdfUri ? <ActionButton label="Upload exported PDF privately" secondary icon="cloud-upload" onPress={uploadPdf} /> : null}</View>} renderItem={({ item }) => <View style={[styles.attempt, { borderBottomColor: colors.border }]}><View style={{ flex: 1, gap: 3 }}><Text style={[styles.attemptTitle, { color: colors.foreground }]}>{item.unitTitle}</Text><Text style={[styles.attemptDetail, { color: colors.muted }]}>{new Date(item.completedAt).toLocaleDateString()} · {item.timed ? "Timed" : "Untimed"}</Text></View><Text style={[styles.attemptScore, { color: colors.primary }]}>{item.correct}/{item.total}</Text></View>} ListEmptyComponent={<Text style={[styles.empty, { color: colors.muted }]}>No completed revision quizzes are stored yet.</Text>} />;
}

const styles = StyleSheet.create({ content: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 28 }, form: { gap: 9 }, input: { borderRadius: 13, borderWidth: 1, fontSize: 15, minHeight: 47, paddingHorizontal: 13 }, recordHeading: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: 3 }, attempt: { alignItems: "center", borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", gap: 12, minHeight: 69, paddingVertical: 10 }, attemptTitle: { fontSize: 15, fontWeight: "800" }, attemptDetail: { fontSize: 12 }, attemptScore: { fontFamily: "Georgia", fontSize: 21, fontWeight: "700" }, empty: { fontSize: 14, lineHeight: 21, paddingTop: 20 } });
