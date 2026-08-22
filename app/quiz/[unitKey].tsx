import { useLocalSearchParams, useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { ActionButton, ActiveBankStatus, NotebookHeader, Notice, StatusPill } from "@/components/molarum/ui";
import { useColors } from "@/hooks/use-colors";
import { unitByKey } from "@/lib/molarum/catalog";
import { filterQuizQuestions } from "@/lib/molarum/filters";
import { isAnswerCorrect, secondsToClock } from "@/lib/molarum/quiz";
import { isResumableQuiz } from "@/lib/molarum/quiz-session";
import { useStudyLibrary } from "@/lib/molarum/provider";
import type { Difficulty } from "@/lib/molarum/types";

export default function QuizScreen() {
  const params = useLocalSearchParams<{ unitKey: string; difficulty?: string; timed?: string }>();
  const unitKey = Array.isArray(params.unitKey) ? params.unitKey[0] : params.unitKey;
  const selectedDifficulty = params.difficulty === "easy" || params.difficulty === "medium" || params.difficulty === "hard" ? (params.difficulty as Difficulty) : "mixed";
  const timed = params.timed === "1";
  const router = useRouter();
  const colors = useColors();
  const { activeBank, activeBankOrigin, bankDescriptor, questions, reviewStates, inProgressQuiz, saveAttempt, saveInProgressQuiz, discardInProgressQuiz } = useStudyLibrary();
  const unit = unitByKey(questions, unitKey);
  const eligibleQueue = useMemo(() => filterQuizQuestions(unit?.questions ?? [], reviewStates, selectedDifficulty), [unit, reviewStates, selectedDifficulty]);
  const savedQuiz = isResumableQuiz(inProgressQuiz, unitKey, questions, bankDescriptor?.bankId ?? null)
    ? inProgressQuiz
    : null;
  const staleDraft = inProgressQuiz?.unitKey === unitKey && Boolean(inProgressQuiz) && !savedQuiz;
  const queue = useMemo(
    () => savedQuiz ? savedQuiz.queueQuestionIds.map((id) => questions.find((question) => question.id === id)).filter((question): question is NonNullable<typeof question> => Boolean(question)) : eligibleQueue,
    [eligibleQueue, questions, savedQuiz],
  );
  const [index, setIndex] = useState(savedQuiz?.index ?? 0);
  const [response, setResponse] = useState(savedQuiz?.response ?? "");
  const [submitted, setSubmitted] = useState(savedQuiz?.submitted ?? false);
  const [correctCount, setCorrectCount] = useState(savedQuiz?.correctCount ?? 0);
  const [elapsedSeconds, setElapsedSeconds] = useState(savedQuiz?.elapsedSeconds ?? 0);
  const startedAt = useRef(savedQuiz?.startedAt ?? new Date().toISOString());
  const elapsedRef = useRef(savedQuiz?.elapsedSeconds ?? 0);
  const announcedAnswer = useRef("");
  const question = queue[index];
  const correct = question ? isAnswerCorrect(question, response) : false;

  const persistProgress = useCallback((elapsed: number) => {
    if (!unit || !queue.length || !question) return;
    saveInProgressQuiz({
      unitKey,
      unitTitle: unit.unitTitle,
      difficulty: savedQuiz?.difficulty ?? selectedDifficulty,
      timed: savedQuiz?.timed ?? timed,
      queueQuestionIds: queue.map((item) => item.id),
      index,
      response,
      submitted,
      correctCount,
      elapsedSeconds: elapsed,
      startedAt: startedAt.current,
      updatedAt: new Date().toISOString(),
    });
  }, [correctCount, index, question, queue, response, saveInProgressQuiz, savedQuiz?.difficulty, savedQuiz?.timed, selectedDifficulty, submitted, timed, unit, unitKey]);

  useEffect(() => {
    if (!timed || (submitted && index === queue.length - 1)) return;
    const interval = setInterval(() => setElapsedSeconds((value) => value + 1), 1000);
    return () => clearInterval(interval);
  }, [timed, submitted, index, queue.length]);

  useEffect(() => {
    elapsedRef.current = elapsedSeconds;
  }, [elapsedSeconds]);

  useEffect(() => {
    if (!submitted || !question) return;
    const key = `${question.id}:${response}`;
    if (announcedAnswer.current === key) return;
    announcedAnswer.current = key;
    void AccessibilityInfo.announceForAccessibility(correct ? "Answer recorded. Correct." : `Answer recorded. Not correct. The answer is ${question.answer}.`);
  }, [correct, question, response, submitted]);

  useEffect(() => {
    persistProgress(elapsedRef.current);
  }, [correctCount, index, persistProgress, response, submitted]);

  useEffect(() => {
    if (timed && elapsedSeconds > 0 && elapsedSeconds % 15 === 0) persistProgress(elapsedSeconds);
  }, [elapsedSeconds, persistProgress, timed]);

  const submit = (value = response) => {
    if (!question || !value.trim()) return;
    setResponse(value);
    if (isAnswerCorrect(question, value)) setCorrectCount((count) => count + 1);
    setSubmitted(true);
  };

  const next = () => {
    if (!question) return;
    if (index === queue.length - 1) {
      const attemptId = saveAttempt({ unitKey, unitTitle: unit?.unitTitle ?? "Unit", correct: correctCount, total: queue.length, timed: savedQuiz?.timed ?? timed, elapsedSeconds });
      router.replace({ pathname: "/results/[attemptId]" as never, params: { attemptId } });
      return;
    }
    setIndex((value) => value + 1);
    setResponse("");
    setSubmitted(false);
    announcedAnswer.current = "";
  };

  const exit = () => {
    Alert.alert("Leave this revision quiz?", "Your in-progress answers are saved locally and can be resumed. A completed score is saved only when you finish the unit.", [
      { text: "Continue quiz", style: "cancel" },
      { text: "Exit and keep progress", onPress: () => router.replace({ pathname: "/unit/[unitKey]" as never, params: { unitKey } }) },
      { text: "Discard progress", style: "destructive", onPress: () => { discardInProgressQuiz(); router.replace({ pathname: "/unit/[unitKey]" as never, params: { unitKey } }); } },
    ]);
  };

  if (!unit || !question) {
    return <View style={[styles.center, { backgroundColor: colors.background }]}><NotebookHeader title="Quiz unavailable" subtitle="There are no eligible local questions for this unit." onBack={() => router.back()} /><ActionButton label="Choose another unit" onPress={() => router.replace("/")} icon="local-library" /></View>;
  }

  const progress = `${((index + 1) / queue.length) * 100}%` as `${number}%`;
  const effectiveTimed = savedQuiz?.timed ?? timed;
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}> 
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.topLine}>
          <Pressable onPress={exit} accessibilityRole="button" accessibilityLabel="Exit quiz" style={({ pressed }) => [styles.exit, { borderColor: colors.border }, pressed && styles.pressed]}>
            <MaterialIcons name="close" size={18} color={colors.foreground} />
            <Text style={[styles.exitText, { color: colors.foreground }]}>Exit unit</Text>
          </Pressable>
          {effectiveTimed ? <StatusPill tone="neutral" label={secondsToClock(elapsedSeconds)} /> : null}
        </View>
        <ActiveBankStatus origin={activeBank ? activeBankOrigin : "none"} questionCount={questions.length} sourceCatalogVersion={bankDescriptor?.sourceCatalogVersion} />
        {staleDraft ? <Notice tone="warning">A saved draft belongs to a different or unavailable bank version and cannot be resumed safely. Start a fresh quiz or discard the old draft.</Notice> : <Notice tone="success">{savedQuiz ? "Resumed local revision attempt. Progress continues to save on this device." : "Progress saves locally while you work. This is a revision tool, not a formal assessment."}</Notice>}
        <View style={styles.progressMeta}>
          <Text style={[styles.progressText, { color: colors.muted }]}>Question {index + 1} of {queue.length}</Text>
          <Text style={[styles.progressText, { color: colors.primary }]}>{question.difficulty}</Text>
        </View>
        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}><View style={[styles.progressFill, { backgroundColor: colors.primary, width: progress }]} /></View>

        <View style={styles.questionArea}>
          <Text style={[styles.questionType, { color: colors.primary }]}>{question.type.replace(/_/g, " ")}</Text>
          <Text style={[styles.questionText, { color: colors.foreground }]}>{question.question}</Text>
          <Text style={[styles.source, { color: colors.muted }]}>Source: {question.sourceNote}</Text>
        </View>

        {question.options.length ? (
          <View style={styles.options}>
            {question.options.map((option) => {
              const selected = response === option;
              const revealCorrect = submitted && option === question.answer;
              const revealWrong = submitted && selected && !correct;
              const border = revealCorrect ? colors.success : revealWrong ? colors.error : selected ? colors.primary : colors.border;
              const background = revealCorrect ? "#E9F3EB" : revealWrong ? "#FBE8E4" : selected ? "#F4E3D7" : colors.surface;
              return <Pressable key={option} disabled={submitted} accessibilityRole="button" accessibilityState={{ selected, disabled: submitted }} accessibilityLabel={`Answer option: ${option}`} onPress={() => submit(option)} style={({ pressed }) => [styles.option, { borderColor: border, backgroundColor: background }, pressed && !submitted && styles.pressed]}>
                <View style={[styles.optionDot, { borderColor: border, backgroundColor: selected ? border : "transparent" }]}>{selected ? <MaterialIcons name="check" size={13} color="#FFFFFF" /> : null}</View>
                <Text style={[styles.optionText, { color: colors.foreground }]}>{option}</Text>
              </Pressable>;
            })}
          </View>
        ) : (
          <View style={styles.responseArea}>
            <TextInput value={response} editable={!submitted} onChangeText={setResponse} placeholder={question.type === "numerical" ? "Enter your numerical answer" : "Write your answer"} placeholderTextColor={colors.muted} style={[styles.responseInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.foreground }]} multiline={question.type === "short_answer"} returnKeyType="done" accessibilityLabel="Your answer" />
            {!submitted ? <ActionButton label="Check answer" onPress={() => submit()} disabled={!response.trim()} /> : null}
          </View>
        )}

        {submitted ? (
          <View style={styles.feedbackArea}>
            <View style={[styles.feedback, { borderColor: correct ? colors.success : colors.error, backgroundColor: correct ? "#E9F3EB" : "#FBE8E4" }]}>
              <MaterialIcons name={correct ? "check-circle" : "info"} size={20} color={correct ? colors.success : colors.error} />
              <View style={styles.feedbackCopy}>
                <Text style={{ color: correct ? "#355B43" : "#8A3329", fontWeight: "900" }}>{correct ? "Correct" : "Not quite"}</Text>
                {!correct ? <Text style={{ color: "#8A3329", fontSize: 13 }}>Answer: {question.answer}</Text> : null}
              </View>
            </View>
            <Notice tone="neutral">{question.explanation}</Notice>
            <ActionButton label={index === queue.length - 1 ? "Save result locally" : "Next question"} onPress={next} icon="arrow-forward" />
          </View>
        ) : null}
        {staleDraft ? <ActionButton label="Discard incompatible draft" secondary icon="delete-outline" onPress={discardInProgressQuiz} /> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flexGrow: 1, gap: 16, paddingBottom: 32, paddingHorizontal: 20, paddingTop: 18 },
  center: { flex: 1, gap: 12, padding: 20 },
  topLine: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  exit: { alignItems: "center", borderRadius: 18, borderWidth: 1, flexDirection: "row", gap: 4, paddingHorizontal: 9, paddingVertical: 6 },
  exitText: { fontSize: 13, fontWeight: "800" },
  progressMeta: { flexDirection: "row", justifyContent: "space-between" },
  progressText: { fontSize: 12, fontWeight: "800", textTransform: "capitalize" },
  progressTrack: { borderRadius: 99, height: 5, overflow: "hidden" },
  progressFill: { height: "100%" },
  questionArea: { gap: 9, paddingTop: 5 },
  questionType: { fontSize: 11, fontWeight: "900", letterSpacing: 1.2, textTransform: "uppercase" },
  questionText: { fontFamily: "Georgia", fontSize: 22, fontWeight: "700", lineHeight: 31 },
  source: { fontSize: 11, lineHeight: 16 },
  options: { gap: 9 },
  option: { alignItems: "center", borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: 11, minHeight: 54, paddingHorizontal: 13, paddingVertical: 11 },
  optionDot: { alignItems: "center", borderRadius: 99, borderWidth: 1.5, height: 21, justifyContent: "center", width: 21 },
  optionText: { flex: 1, fontSize: 15, lineHeight: 21 },
  responseArea: { gap: 10 },
  responseInput: { borderRadius: 14, borderWidth: 1, fontSize: 15, minHeight: 88, padding: 13, textAlignVertical: "top" },
  feedbackArea: { gap: 12 },
  feedback: { alignItems: "center", borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: 10, padding: 13 },
  feedbackCopy: { flex: 1, gap: 3 },
  pressed: { opacity: 0.76, transform: [{ scale: 0.985 }] },
});
