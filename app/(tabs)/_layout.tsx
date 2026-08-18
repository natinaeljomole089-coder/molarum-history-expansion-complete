import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/use-colors";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.muted, tabBarStyle: { backgroundColor: colors.background, borderTopColor: colors.border, height: 56 + bottomPadding, paddingBottom: bottomPadding, paddingTop: 7 }, tabBarLabelStyle: { fontSize: 11, fontWeight: "700" } }}><Tabs.Screen name="index" options={{ title: "Library", tabBarIcon: ({ color }) => <MaterialIcons name="local-library" size={24} color={color} /> }} /><Tabs.Screen name="records" options={{ title: "Records", tabBarIcon: ({ color }) => <MaterialIcons name="assignment" size={24} color={color} /> }} /><Tabs.Screen name="tools" options={{ title: "Tools", tabBarIcon: ({ color }) => <MaterialIcons name="build" size={23} color={color} /> }} /></Tabs>;
}
