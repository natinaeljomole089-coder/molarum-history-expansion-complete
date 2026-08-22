import { useRouter } from "expo-router";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import { ActionButton, NotebookHeader, Notice, SectionLabel } from "@/components/molarum/ui";
import { useColors } from "@/hooks/use-colors";
import { copyText, exportTextFile } from "@/lib/molarum/native-actions";

const MASTER_PROMPT = `Create Grade 10 revision questions only from owner-provided source pages for one extracted unit. Do not use web search, general knowledge, or unapproved sources. Return exactly 40 questions: 20 multiple choice, 4 true/false, 8 short answer, and 8 numerical; 14 easy, 18 medium, and 8 hard. Use the required Molarum JSON schema. Every item must include a non-empty sourceNote, source-grounded explanation, and reviewStatus ai_draft. If source coverage is insufficient, do not invent content; record unresolved_after_retries_or_capacity in manifest.json and review_issues.md.`;

const BLUEPRINT = `# Molarum — Grade 10 Offline Study Library\n\n## Android delivery\nMolarum is a local-only Expo Android app. Learner profile details, question-bank imports, review states, and score history remain on the device.\n\n## Source governance\nOnly owner-provided Grade 10 textbooks, PDFs, or excerpts can be used to create questions. Extract the relevant source pages for one unit before generating content. Do not execute scripts from uploaded archives.\n\n## Validation\nCompleted units must contain exactly 40 questions: 20 multiple choice, 4 true/false, 8 short answer, and 8 numerical. Difficulty split: 14 easy, 18 medium, 8 hard. All questions require ai_draft review status, non-empty source notes, explanations, and answer keys.\n\n## Master prompt\n${MASTER_PROMPT}\n`;

export default function BlueprintScreen() {
  const colors = useColors();
  const router = useRouter();
  const download = async () => { try { await exportTextFile("Molarum-project-blueprint.md", BLUEPRINT, "text/markdown"); } catch { Alert.alert("Download unavailable", "The blueprint file could not be prepared on this device."); } };
  const copy = async () => { try { await copyText(MASTER_PROMPT); Alert.alert("Master prompt copied", "The source-governed prompt is now in your clipboard."); } catch { Alert.alert("Copy unavailable", "The master prompt could not be copied on this device."); } };
  return <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content}><NotebookHeader onBack={() => router.back()} eyebrow="Project documentation" title="Blueprint" subtitle="Portable governance notes for owner-managed source and delivery work." /><Notice>Downloading this blueprint shares a local document. It does not upload source materials or learner data.</Notice><View style={styles.actions}><ActionButton label="Download blueprint" icon="download" onPress={download} /><ActionButton label="Copy master prompt" secondary icon="content-copy" onPress={copy} /></View><SectionLabel>Core rules</SectionLabel><View style={[styles.notes, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.notesText, { color: colors.foreground }]}>Use only owner-provided Grade 10 sources. Validate locally. Keep unresolved units unresolved when evidence is insufficient. Question content is source-grounded and revision-only.</Text></View><SectionLabel>Master prompt</SectionLabel><View style={[styles.prompt, { backgroundColor: "#13243A" }]}><Text style={styles.promptText}>{MASTER_PROMPT}</Text></View></ScrollView>;
}

const styles = StyleSheet.create({ content: { gap: 13, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 30 }, actions: { gap: 10 }, notes: { borderRadius: 15, borderWidth: 1, padding: 14 }, notesText: { fontSize: 14, lineHeight: 21 }, prompt: { borderRadius: 15, padding: 15 }, promptText: { color: "#F7F1E4", fontSize: 12, lineHeight: 18 } });
