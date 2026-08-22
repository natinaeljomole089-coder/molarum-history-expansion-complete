import { Alert, FlatList, StyleSheet, Text, TextInput, View } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";

import { ActionButton, NotebookHeader, Notice, SectionLabel, StatusPill } from "@/components/molarum/ui";
import { useColors } from "@/hooks/use-colors";
import { useCloud } from "@/lib/molarum/cloud-provider";

export default function CloudScreen() {
  const router = useRouter();
  const colors = useColors();
  const cloud = useCloud();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const run = async (action: () => Promise<{ ok: boolean; message: string }>) => { setBusy(true); const result = await action(); setBusy(false); Alert.alert(result.ok ? "Molarum cloud" : "Cloud action unavailable", result.message); };

  const accountSection = !cloud.configured ? <Notice>Cloud sync is not configured for this build. Local revision remains available.</Notice> : cloud.session ? <View style={styles.section}><StatusPill tone="success" label={`${cloud.role ?? "signed-in"} account`} /><Text style={[styles.identity, { color: colors.foreground }]}>{cloud.session.user.email}</Text><Text style={[styles.detail, { color: colors.muted }]}>Nothing syncs automatically. Use the actions below when you choose to send or download cloud data.</Text><ActionButton label="Sign out" secondary icon="logout" onPress={() => cloud.signOut()} /></View> : <View style={styles.form}><TextInput value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" placeholder="Email address" placeholderTextColor={colors.muted} style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.foreground }]} /><TextInput value={password} onChangeText={setPassword} autoCapitalize="none" secureTextEntry placeholder="Password" placeholderTextColor={colors.muted} style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.foreground }]} /><ActionButton label={busy ? "Working…" : "Sign in"} icon="login" disabled={busy} onPress={() => run(() => cloud.signIn(email, password))} /><ActionButton label="Create account" secondary icon="person-add" disabled={busy} onPress={() => run(() => cloud.signUp(email, password))} /></View>;

  return <FlatList style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content} data={[]} renderItem={() => null} ListHeaderComponent={<View style={{ gap: 12 }}><NotebookHeader onBack={() => router.back()} eyebrow="Optional cloud layer" title="Account & sync" subtitle="Sign in only when you want private cloud sync or teacher-managed content." /><Notice>Your quizzes work without an account. Molarum never uploads attempts, profile details, reports, or source files automatically.</Notice><SectionLabel>Account</SectionLabel>{accountSection}{cloud.session ? <><SectionLabel>My device records</SectionLabel><ActionButton label="Sync my local records" icon="sync" disabled={busy} onPress={() => run(cloud.syncMyRecords)} /><ActionButton label="Download active teacher content" secondary icon="cloud-download" disabled={busy} onPress={() => run(cloud.pullActiveTeacherContent)} /></> : null}{cloud.isTeacher ? <><SectionLabel>Teacher publishing</SectionLabel><Notice>Publishing keeps the current local validated bank and review states unchanged on this device. Learners can only download the active published version.</Notice><ActionButton label="Publish active question bank" icon="publish" disabled={busy} onPress={() => run(cloud.publishActiveQuestionBank)} /><ActionButton label="Publish local review states" secondary icon="rule" disabled={busy} onPress={() => run(cloud.publishReviewStates)} /><ActionButton label="Upload a private source PDF" secondary icon="upload-file" disabled={busy} onPress={() => run(cloud.pickAndUploadSourceMaterial)} /></> : null}</View>} />;
}

const styles = StyleSheet.create({ content: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 28 }, form: { gap: 9 }, section: { gap: 9 }, input: { borderRadius: 13, borderWidth: 1, fontSize: 15, minHeight: 47, paddingHorizontal: 13 }, identity: { fontSize: 16, fontWeight: "800" }, detail: { fontSize: 13, lineHeight: 19 } });
