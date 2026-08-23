import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { type ComponentProps, useEffect, useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, View } from "react-native";

import { useColors } from "@/hooks/use-colors";
import { SUBJECT_CATALOG } from "@/lib/molarum/catalog";
import { useStudyLibrary } from "@/lib/molarum/provider";

function streakForAttempts(dates: string[]) {
  const uniqueDays = new Set(dates.map((date) => new Date(date).toISOString().slice(0, 10)));
  let cursor = new Date();
  if (!uniqueDays.has(cursor.toISOString().slice(0, 10))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (uniqueDays.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export default function ProfileScreen() {
  const colors = useColors();
  const { learnerProfile, updateLearnerProfile, attempts } = useStudyLibrary();
  const [name, setName] = useState(learnerProfile.name);
  useEffect(() => setName(learnerProfile.name), [learnerProfile.name]);
  const stats = useMemo(() => {
    const total = attempts.reduce((sum, attempt) => sum + attempt.total, 0);
    const correct = attempts.reduce((sum, attempt) => sum + attempt.correct, 0);
    const bySubject = attempts.reduce<Record<string, { correct: number; total: number }>>((result, attempt) => {
      const subjectId = attempt.unitKey.split("::")[0] ?? "";
      const previous = result[subjectId] ?? { correct: 0, total: 0 };
      result[subjectId] = { correct: previous.correct + attempt.correct, total: previous.total + attempt.total };
      return result;
    }, {});
    const strongestId = Object.entries(bySubject).sort(([, left], [, right]) => right.correct / Math.max(right.total, 1) - left.correct / Math.max(left.total, 1))[0]?.[0];
    return {
      total,
      average: total ? Math.round((correct / total) * 100) : 0,
      streak: streakForAttempts(attempts.map((attempt) => attempt.completedAt)),
      strongest: SUBJECT_CATALOG.find((subject) => subject.id === strongestId)?.title ?? "Keep practicing",
      achievements: [
        ...(attempts.length >= 1 ? [{ icon: "rocket-launch" as const, label: "First session" }] : []),
        ...(attempts.length >= 5 ? [{ icon: "local-fire-department" as const, label: "5 sessions" }] : []),
        ...(total >= 10 && correct / total >= 0.8 ? [{ icon: "workspace-premium" as const, label: "80% average" }] : []),
      ],
    };
  }, [attempts]);
  const displayName = name.trim() || "Learner";
  const initials = displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  return <FlatList
    style={{ backgroundColor: colors.background }}
    contentContainerStyle={styles.content}
    data={attempts.slice(0, 5)}
    keyExtractor={(item) => item.id}
    ListHeaderComponent={<View style={styles.headerStack}>
      <Text style={[styles.eyebrow, { color: "#B66CFF" }]}>YOUR LEARNING SPACE</Text>
      <View style={styles.profileRow}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
        <View style={styles.profileCopy}><Text style={[styles.welcome, { color: colors.muted }]}>Welcome back,</Text><Text style={[styles.name, { color: colors.foreground }]}>{displayName}</Text><Text style={[styles.streak, { color: "#FFAE51" }]}>{stats.streak ? `${stats.streak}-day streak` : "Start your learning streak today"}</Text></View>
      </View>
      <View style={[styles.nameCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.fieldLabel, { color: colors.muted }]}>Display name</Text>
        <TextInput value={name} onChangeText={setName} onEndEditing={() => updateLearnerProfile({ ...learnerProfile, name: name.trim() })} placeholder="Your name" placeholderTextColor={colors.muted} style={[styles.nameInput, { color: colors.foreground }]} accessibilityLabel="Your display name" returnKeyType="done" />
      </View>
      <View style={[styles.progressCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.progressTop}><View><Text style={[styles.cardTitle, { color: colors.foreground }]}>Your progress</Text><Text style={[styles.cardSupport, { color: colors.muted }]}>A snapshot of your completed practice</Text></View><Text style={[styles.average, { color: "#B66CFF" }]}>{stats.average}%</Text></View>
        <View style={[styles.track, { backgroundColor: "#1A2140" }]}><View style={[styles.fill, { backgroundColor: "#FF8A1F", width: `${Math.max(3, stats.average)}%` }]} /></View>
      </View>
      <View style={styles.statsGrid}>
        <StatCard icon="quiz" value={String(stats.total)} label="Questions practiced" color="#B66CFF" />
        <StatCard icon="emoji-events" value={`${stats.average}%`} label="Average score" color="#6EE7B7" />
        <StatCard icon="auto-awesome" value={stats.strongest} label="Strongest subject" color="#FFAE51" wide />
      </View>
      {stats.achievements.length ? <View style={[styles.achievementCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.achievementTitle, { color: colors.foreground }]}>Earned achievements</Text><View style={styles.achievementRow}>{stats.achievements.map((achievement) => <View key={achievement.label} style={styles.achievement}><MaterialIcons name={achievement.icon} size={17} color="#FFAE51" /><Text style={styles.achievementText}>{achievement.label}</Text></View>)}</View></View> : null}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent learning</Text>
    </View>}
    renderItem={({ item }) => <View style={[styles.activityCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={[styles.activityIcon, { backgroundColor: "#1E1A38" }]}><MaterialIcons name="school" size={20} color="#B66CFF" /></View><View style={styles.activityBody}><Text numberOfLines={1} style={[styles.activityTitle, { color: colors.foreground }]}>{item.unitTitle}</Text><Text style={[styles.activityDetail, { color: colors.muted }]}>{new Date(item.completedAt).toLocaleDateString()} · {item.timed ? "Timed" : "Practice"}</Text></View><Text style={[styles.activityScore, { color: "#6EE7B7" }]}>{item.correct}/{item.total}</Text></View>}
    ListEmptyComponent={<View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}><MaterialIcons name="rocket-launch" size={28} color="#B66CFF" /><Text style={[styles.emptyTitle, { color: colors.foreground }]}>Your learning story starts here</Text><Text style={[styles.emptyText, { color: colors.muted }]}>Complete a practice session and your activity will appear here.</Text></View>}
  />;
}

function StatCard({ icon, value, label, color, wide = false }: { icon: ComponentProps<typeof MaterialIcons>["name"]; value: string; label: string; color: string; wide?: boolean }) {
  const colors = useColors();
  return <View style={[styles.statCard, wide && styles.statWide, { backgroundColor: colors.surface, borderColor: colors.border }]}><MaterialIcons name={icon} size={20} color={color} /><View style={styles.statCopy}><Text numberOfLines={1} style={[styles.statValue, { color: colors.foreground }]}>{value}</Text><Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text></View></View>;
}

const styles = StyleSheet.create({
  content: { gap: 11, paddingHorizontal: 18, paddingTop: 20, paddingBottom: 32 },
  headerStack: { gap: 14, paddingBottom: 4 },
  eyebrow: { fontSize: 11, fontWeight: "900", letterSpacing: 1.2 },
  profileRow: { alignItems: "center", flexDirection: "row", gap: 14 },
  avatar: { alignItems: "center", backgroundColor: "#6238D9", borderColor: "#B66CFF", borderRadius: 32, borderWidth: 2, height: 64, justifyContent: "center", width: 64 },
  avatarText: { color: "#FFFFFF", fontSize: 21, fontWeight: "900" },
  profileCopy: { flex: 1, gap: 2 },
  welcome: { fontSize: 13 },
  name: { fontSize: 25, fontWeight: "900", letterSpacing: -0.5 },
  streak: { fontSize: 13, fontWeight: "800" },
  nameCard: { borderRadius: 18, borderWidth: 1, paddingHorizontal: 15, paddingVertical: 11 },
  fieldLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 0.5, textTransform: "uppercase" },
  nameInput: { fontSize: 16, fontWeight: "700", minHeight: 38, paddingVertical: 4 },
  progressCard: { borderRadius: 20, borderWidth: 1, gap: 15, padding: 16 },
  progressTop: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  cardTitle: { fontSize: 17, fontWeight: "900" },
  cardSupport: { fontSize: 12, marginTop: 3 },
  average: { fontSize: 28, fontWeight: "900" },
  track: { borderRadius: 4, height: 8, overflow: "hidden" },
  fill: { borderRadius: 4, height: "100%" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: { borderRadius: 17, borderWidth: 1, flex: 1, gap: 9, minHeight: 92, padding: 13 },
  statWide: { flexBasis: "100%", flexDirection: "row", alignItems: "center", minHeight: 68 },
  statCopy: { flex: 1 },
  statValue: { fontSize: 18, fontWeight: "900" },
  statLabel: { fontSize: 11, lineHeight: 15, marginTop: 2 },
  achievementCard: { borderRadius: 18, borderWidth: 1, gap: 10, padding: 14 },
  achievementTitle: { fontSize: 15, fontWeight: "900" },
  achievementRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  achievement: { alignItems: "center", backgroundColor: "#2B213E", borderRadius: 12, flexDirection: "row", gap: 5, paddingHorizontal: 9, paddingVertical: 7 },
  achievementText: { color: "#F5D1A0", fontSize: 11, fontWeight: "800" },
  sectionTitle: { fontSize: 18, fontWeight: "900", marginTop: 5 },
  activityCard: { alignItems: "center", borderRadius: 17, borderWidth: 1, flexDirection: "row", gap: 11, minHeight: 72, padding: 12 },
  activityIcon: { alignItems: "center", borderRadius: 13, height: 40, justifyContent: "center", width: 40 },
  activityBody: { flex: 1, gap: 3 },
  activityTitle: { fontSize: 14, fontWeight: "800" },
  activityDetail: { fontSize: 12 },
  activityScore: { fontSize: 15, fontWeight: "900" },
  empty: { alignItems: "center", borderRadius: 18, borderWidth: 1, gap: 8, padding: 22 },
  emptyTitle: { fontSize: 16, fontWeight: "900", textAlign: "center" },
  emptyText: { fontSize: 13, lineHeight: 19, textAlign: "center" },
});
