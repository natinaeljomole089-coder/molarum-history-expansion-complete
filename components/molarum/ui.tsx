import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/use-colors";
import type { ActiveBankOrigin } from "@/lib/molarum/types";

export function NotebookHeader({ eyebrow, title, subtitle, backLabel, onBack }: { eyebrow?: string; title: string; subtitle?: string; backLabel?: string; onBack?: () => void }) {
  const colors = useColors();
  return (
    <View style={styles.header}>
      {onBack ? <Pressable accessibilityRole="button" accessibilityLabel={backLabel ?? "Go back"} onPress={onBack} style={({ pressed }) => [styles.back, { borderColor: colors.border }, pressed && styles.pressed]}><MaterialIcons name="arrow-back" size={20} color={colors.foreground} /><Text style={[styles.backText, { color: colors.foreground }]}>{backLabel ?? "Back"}</Text></Pressable> : null}
      {eyebrow ? <Text style={[styles.eyebrow, { color: colors.primary }]}>{eyebrow.toUpperCase()}</Text> : null}
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color: colors.muted }]}>{subtitle}</Text> : null}
    </View>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  const colors = useColors();
  return <Text style={[styles.sectionLabel, { color: colors.muted }]}>{children}</Text>;
}

export function Notice({ children, tone = "warning" }: { children: ReactNode; tone?: "warning" | "success" | "neutral" }) {
  const colors = useColors();
  const background = tone === "warning" ? "#FFF5DB" : tone === "success" ? "#EAF3EB" : colors.surface;
  const textColor = tone === "warning" ? "#72550F" : tone === "success" ? "#355B43" : colors.foreground;
  return <View style={[styles.notice, { backgroundColor: background, borderColor: colors.border }]}><MaterialIcons name={tone === "warning" ? "fact-check" : tone === "success" ? "check-circle" : "info-outline"} size={18} color={textColor} /><Text style={[styles.noticeText, { color: textColor }]}>{children}</Text></View>;
}

export function StatusPill({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "success" | "warning" | "error" }) {
  const colors = useColors();
  const palette = tone === "success" ? { background: "#E2EFE4", color: "#355B43" } : tone === "warning" ? { background: "#FFF2CF", color: "#72550F" } : tone === "error" ? { background: "#FBE5E2", color: colors.error } : { background: colors.surface, color: colors.muted };
  return <View style={[styles.pill, { backgroundColor: palette.background, borderColor: colors.border }]}><Text style={[styles.pillText, { color: palette.color }]}>{label}</Text></View>;
}

export function ActiveBankStatus({ origin, questionCount, sourceCatalogVersion }: { origin: ActiveBankOrigin; questionCount: number; sourceCatalogVersion?: string | null }) {
  const colors = useColors();
  const label = origin === "packaged_validated" ? "Packaged validated bank" : origin === "imported_draft" ? "Imported bank · AI draft" : "No active bank";
  const tone = origin === "none" ? "warning" : origin === "imported_draft" ? "neutral" : "success";
  const detail = origin === "packaged_validated"
    ? `${questionCount} source-grounded questions available offline.`
    : origin === "imported_draft"
      ? `${questionCount} imported questions active. Validate external content before sharing it.`
      : "No valid local content is active. Restore the packaged bank or import a validated bank.";
  return <View accessibilityRole="summary" style={[styles.bankStatus, { backgroundColor: colors.surface, borderColor: colors.border }]}><StatusPill tone={tone} label={label} /><Text style={[styles.bankStatusText, { color: colors.muted }]}>{detail}</Text>{sourceCatalogVersion ? <Text style={[styles.bankVersion, { color: colors.muted }]}>Bank version: {sourceCatalogVersion}</Text> : null}</View>;
}

export function ActionButton({ label, onPress, disabled, secondary = false, icon }: { label: string; onPress: () => void; disabled?: boolean; secondary?: boolean; icon?: keyof typeof MaterialIcons.glyphMap }) {
  const colors = useColors();
  const backgroundColor = secondary ? colors.surface : colors.primary;
  const color = secondary ? colors.foreground : "#FFF9F0";
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, { backgroundColor, borderColor: secondary ? colors.border : colors.primary }, disabled && styles.disabled, pressed && !disabled && styles.pressed]}><View style={styles.buttonContent}>{icon ? <MaterialIcons name={icon} size={18} color={color} /> : null}<Text style={[styles.buttonText, { color }]}>{label}</Text></View></Pressable>;
}

export function LinkRow({ title, detail, onPress, icon = "chevron-right" }: { title: string; detail: string; onPress: () => void; icon?: keyof typeof MaterialIcons.glyphMap }) {
  const colors = useColors();
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.linkRow, { borderBottomColor: colors.border }, pressed && styles.pressed]}><View style={styles.linkText}><Text style={[styles.linkTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.linkDetail, { color: colors.muted }]}>{detail}</Text></View><MaterialIcons name={icon} size={22} color={colors.muted} /></Pressable>;
}

const styles = StyleSheet.create({
  header: { gap: 6, paddingBottom: 10 },
  eyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 1.3 },
  title: { fontFamily: "Georgia", fontSize: 30, fontWeight: "700", letterSpacing: -0.5, lineHeight: 37 },
  subtitle: { fontSize: 14, lineHeight: 21 },
  back: { alignSelf: "flex-start", alignItems: "center", borderWidth: 1, borderRadius: 18, flexDirection: "row", gap: 4, marginBottom: 5, paddingHorizontal: 9, paddingVertical: 6 },
  backText: { fontSize: 13, fontWeight: "700" },
  sectionLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 1.1, marginTop: 16, marginBottom: 8 },
  notice: { alignItems: "flex-start", borderWidth: 1, borderRadius: 14, flexDirection: "row", gap: 9, padding: 12 },
  noticeText: { flex: 1, fontSize: 13, lineHeight: 19 },
  pill: { alignSelf: "flex-start", borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  pillText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.2 },
  bankStatus: { borderRadius: 14, borderWidth: 1, gap: 7, padding: 12 },
  bankStatusText: { fontSize: 12, lineHeight: 18 },
  bankVersion: { fontSize: 11, fontWeight: "700", lineHeight: 16 },
  button: { borderWidth: 1, borderRadius: 14, minHeight: 48, justifyContent: "center", paddingHorizontal: 16 },
  buttonContent: { alignItems: "center", flexDirection: "row", gap: 8, justifyContent: "center" },
  buttonText: { fontSize: 15, fontWeight: "800" },
  linkRow: { alignItems: "center", borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: "row", gap: 10, minHeight: 68, paddingVertical: 11 },
  linkText: { flex: 1, gap: 3 },
  linkTitle: { fontSize: 16, fontWeight: "800" },
  linkDetail: { fontSize: 13, lineHeight: 18 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.45 },
});
