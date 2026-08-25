import { router } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useEffect, useState } from "react";

import { useColors } from "@/hooks/use-colors";
import { useCloud } from "@/lib/molarum/cloud-provider";

/** Handles an email-confirmation deep link while CloudProvider exchanges its one-time code. */
export default function AuthCallbackScreen() {
  const colors = useColors();
  const { ready, session } = useCloud();
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    if (!session) return;
    const timeout = setTimeout(() => router.replace("/profile"), 300);
    return () => clearTimeout(timeout);
  }, [session]);
  useEffect(() => {
    const timeout = setTimeout(() => setTimedOut(true), 4000);
    return () => clearTimeout(timeout);
  }, []);

  const needsHelp = ready && timedOut && !session;
  return <View style={[styles.container, { backgroundColor: colors.background }]}>{!needsHelp ? <ActivityIndicator color="#B66CFF" size="large" /> : null}<Text style={[styles.title, { color: colors.foreground }]}>{needsHelp ? "Could not finish sign-in" : "Finishing sign-in"}</Text><Text style={[styles.copy, { color: colors.muted }]}>{needsHelp ? "Return to Profile and sign in with your email and password. Your learning is still saved on this device." : "Your learning remains available on this device."}</Text>{needsHelp ? <Pressable accessibilityRole="button" accessibilityLabel="Return to Profile" onPress={() => router.replace("/profile")} style={({ pressed }) => [styles.button, pressed && styles.pressed]}><Text style={styles.buttonText}>Return to Profile</Text></Pressable> : null}</View>;
}

const styles = StyleSheet.create({
  container: { alignItems: "center", flex: 1, gap: 12, justifyContent: "center", padding: 24 },
  title: { fontSize: 20, fontWeight: "900" },
  copy: { fontSize: 14, textAlign: "center" },
  button: { backgroundColor: "#7441E8", borderRadius: 14, marginTop: 8, paddingHorizontal: 20, paddingVertical: 13 },
  buttonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" },
  pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
});
