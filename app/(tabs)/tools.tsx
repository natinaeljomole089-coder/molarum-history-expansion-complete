import { useRouter } from "expo-router";
import { FlatList, StyleSheet, View } from "react-native";

import { LinkRow, NotebookHeader, Notice, SectionLabel } from "@/components/molarum/ui";
import { useColors } from "@/hooks/use-colors";

const TOOL_LINKS = [
  { title: "Account & sync", detail: "Optional sign-in and private learner-record sync.", route: "/cloud" },
  { title: "Question-bank management", detail: "Import, validate, inspect, or reset the local active bank.", route: "/question-bank" },
  { title: "Project blueprint", detail: "Download source-governance documentation or copy the master prompt.", route: "/blueprint" },
] as const;

export default function ToolsScreen() {
  const colors = useColors();
  const router = useRouter();
  return <FlatList style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content} data={TOOL_LINKS} keyExtractor={(item) => item.title} ListHeaderComponent={<View style={{ gap: 11 }}><NotebookHeader eyebrow="Content desk" title="Tools" subtitle="Local controls for source-governed content and optional cloud coordination." /><Notice>Invalid question-bank files are rejected before any active local content changes. Cloud features are opt-in and never replace the device copy automatically.</Notice><SectionLabel>Content management</SectionLabel></View>} renderItem={({ item }) => <LinkRow title={item.title} detail={item.detail} onPress={() => router.push(item.route as never)} />} />;
}

const styles = StyleSheet.create({ content: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 28 } });
