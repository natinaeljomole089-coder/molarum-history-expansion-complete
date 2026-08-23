import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/use-colors";

export default function ToolsScreen() {
  const colors = useColors();
  const router = useRouter();
  return <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content}>
    <Text style={[styles.eyebrow, { color: "#B66CFF" }]}>STUDY COMPANION</Text>
    <Text style={[styles.title, { color: colors.foreground }]}>Tools for better practice</Text>
    <Text style={[styles.subtitle, { color: colors.muted }]}>Small choices that help every study session feel focused.</Text>
    <View style={styles.featureStack}>
      <Feature icon="tune" color="#B66CFF" title="Choose your difficulty" detail="Pick mixed, easy, medium, or hard questions before starting a lesson." />
      <Feature icon="timer" color="#FFAE51" title="Try timed practice" detail="Switch on the timer from any lesson when you want an extra challenge." />
      <Feature icon="offline-bolt" color="#6EE7B7" title="Learn anywhere" detail="Your current questions and practice progress stay available on this device." />
    </View>
    <View style={[styles.aboutCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={styles.aboutIcon}><Text style={styles.aboutIconText}>M</Text></View><View style={styles.aboutCopy}><Text style={[styles.aboutTitle, { color: colors.foreground }]}>About Molarum</Text><Text style={[styles.aboutText, { color: colors.muted }]}>Your Grade 10 learning companion, designed for focused everyday practice.</Text></View></View>
    <View style={styles.actions}><Pressable accessibilityRole="button" onPress={() => router.push("/")} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}><MaterialIcons name="local-library" size={20} color="#FFFFFF" /><Text style={styles.primaryText}>Choose a subject</Text></Pressable><Pressable accessibilityRole="button" onPress={() => router.push("/(tabs)/profile" as never)} style={({ pressed }) => [styles.secondaryButton, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}><Text style={[styles.secondaryText, { color: colors.foreground }]}>Open profile</Text><MaterialIcons name="arrow-forward" size={20} color="#B66CFF" /></Pressable></View>
  </ScrollView>;
}

function Feature({ icon, color, title, detail }: { icon: React.ComponentProps<typeof MaterialIcons>["name"]; color: string; title: string; detail: string }) {
  const colors = useColors();
  return <View style={[styles.featureCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={[styles.featureIcon, { backgroundColor: `${color}22` }]}><MaterialIcons name={icon} size={22} color={color} /></View><View style={styles.featureCopy}><Text style={[styles.featureTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.featureDetail, { color: colors.muted }]}>{detail}</Text></View></View>;
}

const styles = StyleSheet.create({
  content: { gap: 13, paddingBottom: 34, paddingHorizontal: 18, paddingTop: 21 }, eyebrow: { fontSize: 11, fontWeight: "900", letterSpacing: 1.2 }, title: { fontSize: 28, fontWeight: "900", letterSpacing: -0.7 }, subtitle: { fontSize: 14, lineHeight: 21, marginTop: -6 },
  featureStack: { gap: 10, marginTop: 6 }, featureCard: { alignItems: "center", borderRadius: 19, borderWidth: 1, flexDirection: "row", gap: 13, minHeight: 82, padding: 13 }, featureIcon: { alignItems: "center", borderRadius: 14, height: 44, justifyContent: "center", width: 44 }, featureCopy: { flex: 1, gap: 4 }, featureTitle: { fontSize: 15, fontWeight: "900" }, featureDetail: { fontSize: 12, lineHeight: 17 },
  aboutCard: { alignItems: "center", borderRadius: 20, borderWidth: 1, flexDirection: "row", gap: 12, marginTop: 4, padding: 14 }, aboutIcon: { alignItems: "center", backgroundColor: "#7441E8", borderRadius: 14, height: 46, justifyContent: "center", transform: [{ rotate: "-7deg" }], width: 46 }, aboutIconText: { color: "#FFFFFF", fontSize: 24, fontStyle: "italic", fontWeight: "900" }, aboutCopy: { flex: 1, gap: 3 }, aboutTitle: { fontSize: 15, fontWeight: "900" }, aboutText: { fontSize: 12, lineHeight: 17 },
  actions: { gap: 10, marginTop: 3 }, primaryButton: { alignItems: "center", backgroundColor: "#FF8A1F", borderRadius: 17, flexDirection: "row", gap: 10, justifyContent: "center", minHeight: 55 }, primaryText: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" }, secondaryButton: { alignItems: "center", borderRadius: 17, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", minHeight: 54, paddingHorizontal: 16 }, secondaryText: { fontSize: 14, fontWeight: "900" }, pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
});
