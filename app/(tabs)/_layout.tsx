import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/use-colors";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.muted, sceneStyle: { backgroundColor: colors.background }, tabBarStyle: { backgroundColor: "#0C1122", borderTopColor: colors.border, borderTopWidth: 1, height: 62 + bottomPadding, paddingBottom: bottomPadding, paddingTop: 8 }, tabBarItemStyle: { borderRadius: 14, marginHorizontal: 5 }, tabBarLabelStyle: { fontSize: 11, fontWeight: "800" } }}><Tabs.Screen name="index" options={{ title: "Library", tabBarIcon: ({ color }) => <MaterialIcons name="local-library" size={23} color={color} /> }} /><Tabs.Screen name="tools" options={{ title: "Tools", tabBarIcon: ({ color }) => <MaterialIcons name="tune" size={23} color={color} /> }} /><Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color }) => <MaterialIcons name="person-outline" size={24} color={color} /> }} /></Tabs>;
}
