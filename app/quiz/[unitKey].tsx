import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

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
  const { ready, bankDescriptor, questions, inProgressQuiz, saveAttempt, saveInProgressQuiz, discardInProgressQuiz } = useStudyLibrary();
  const unit = unitByKey(questions, unitKey);
  const eligibleQueue = useMemo(() => filterQuizQuestions(unit?.questions ?? [], selectedDifficulty), [unit, selectedDifficulty]);
  const savedQuiz = isResumableQuiz(inProgressQuiz, unitKey, questions, bankDescriptor?.bankId ?? null) ? inProgressQuiz : null;
  const staleDraft = inProgressQuiz?.unitKey === unitKey && Boolean(inProgressQuiz) && !savedQuiz;
  const questionById = useMemo(() => new Map(questions.map((item) => [item.id, item])), [questions]);
  const savedQueueKey = savedQuiz?.queueQuestionIds.join("|") ?? "";
  const hasSavedQuiz = Boolean(savedQuiz);
  const queue = useMemo(() => hasSavedQuiz ? savedQueueKey.split("|").map((id) => questionById.get(id)).filter((item): item is NonNullable<typeof item> => Boolean(item)) : eligibleQueue, [eligibleQueue, hasSavedQuiz, questionById, savedQueueKey]);
  const [index, setIndex] = useState(savedQuiz?.index ?? 0);
  const [response, setResponse] = useState(savedQuiz?.response ?? "");
  const [submitted, setSubmitted] = useState(savedQuiz?.submitted ?? false);
  const [correctCount, setCorrectCount] = useState(savedQuiz?.correctCount ?? 0);
  const [elapsedSeconds, setElapsedSeconds] = useState(savedQuiz?.elapsedSeconds ?? 0);
  const startedAt = useRef(savedQuiz?.startedAt ?? new Date().toISOString());
  const elapsedRef = useRef(savedQuiz?.elapsedSeconds ?? 0);
  const announcedAnswer = useRef("");
  const submittingRef = useRef(false);
  const completingRef = useRef(false);
  const progressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const question = queue[index];
  const correct = question ? isAnswerCorrect(question, response) : false;
  const effectiveTimed = savedQuiz?.timed ?? timed;
  const initializedSessionKey = useRef<string | null>(null);

  useEffect(() => {
    const sessionKey = `${unitKey}:${bankDescriptor?.bankId ?? ""}`;
    if (!ready || !bankDescriptor?.bankId || initializedSessionKey.current === sessionKey) return;
    initializedSessionKey.current = sessionKey;
    if (!savedQuiz) {
      setIndex(0);
      setResponse("");
      setSubmitted(false);
      setCorrectCount(0);
      setElapsedSeconds(0);
      startedAt.current = new Date().toISOString();
      elapsedRef.current = 0;
      submittingRef.current = false;
      announcedAnswer.current = "";
      return;
    }
    setIndex(savedQuiz.index);
    setResponse(savedQuiz.response);
    setSubmitted(savedQuiz.submitted);
    setCorrectCount(savedQuiz.correctCount);
    setElapsedSeconds(savedQuiz.elapsedSeconds);
    startedAt.current = savedQuiz.startedAt;
    elapsedRef.current = savedQuiz.elapsedSeconds;
    submittingRef.current = false;
    announcedAnswer.current = "";
  }, [bankDescriptor?.bankId, ready, savedQuiz, unitKey]);

  const persistProgress = useCallback((elapsed: number) => {
    if (completingRef.current || !unit || !queue.length || !question) return;
    saveInProgressQuiz({ unitKey, unitTitle: unit.unitTitle, difficulty: savedQuiz?.difficulty ?? selectedDifficulty, timed: savedQuiz?.timed ?? timed, queueQuestionIds: queue.map((item) => item.id), index, response, submitted, correctCount, elapsedSeconds: elapsed, startedAt: startedAt.current, updatedAt: new Date().toISOString() });
  }, [correctCount, index, question, queue, response, saveInProgressQuiz, savedQuiz?.difficulty, savedQuiz?.timed, selectedDifficulty, submitted, timed, unit, unitKey]);

  useEffect(() => {
    if (!effectiveTimed || (submitted && index === queue.length - 1)) return;
    const interval = setInterval(() => setElapsedSeconds((value) => value + 1), 1000);
    return () => clearInterval(interval);
  }, [effectiveTimed, submitted, index, queue.length]);
  useEffect(() => { elapsedRef.current = elapsedSeconds; }, [elapsedSeconds]);
  useEffect(() => {
    if (!submitted || !question) return;
    const key = `${question.id}:${response}`;
    if (announcedAnswer.current === key) return;
    announcedAnswer.current = key;
    void AccessibilityInfo.announceForAccessibility(correct ? "Correct answer." : `Not correct. The answer is ${question.answer}.`);
  }, [correct, question, response, submitted]);
  useEffect(() => {
    if (progressTimerRef.current) clearTimeout(progressTimerRef.current);
    progressTimerRef.current = setTimeout(() => persistProgress(elapsedRef.current), submitted ? 0 : 300);
    return () => {
      if (progressTimerRef.current) clearTimeout(progressTimerRef.current);
    };
  }, [correctCount, index, persistProgress, response, submitted]);
  useEffect(() => { if (effectiveTimed && elapsedSeconds > 0 && elapsedSeconds % 15 === 0) persistProgress(elapsedSeconds); }, [effectiveTimed, elapsedSeconds, persistProgress]);

  const submit = (value = response) => {
    if (submittingRef.current || submitted || !question || !value.trim()) return;
    submittingRef.current = true;
    setResponse(value);
    if (isAnswerCorrect(question, value)) setCorrectCount((count) => count + 1);
    setSubmitted(true);
  };
  const next = () => {
    if (completingRef.current || !question) return;
    if (index === queue.length - 1) {
      completingRef.current = true;
      setIsCompleting(true);
      try {
        const attemptId = saveAttempt({ unitKey, unitTitle: unit?.unitTitle ?? "Unit", correct: correctCount, total: queue.length, timed: effectiveTimed, elapsedSeconds });
        router.replace({ pathname: "/results/[attemptId]" as never, params: { attemptId } });
      } catch {
        completingRef.current = false;
        setIsCompleting(false);
        Alert.alert("Could not save results", "Your quiz is still open. Please try the results button again.");
      }
      return;
    }
    setIndex((value) => value + 1); setResponse(""); setSubmitted(false); submittingRef.current = false; announcedAnswer.current = "";
  };
  const exit = () => Alert.alert("Leave practice?", "Your answers are saved on this device. You can continue this session later.", [
    { text: "Keep practicing", style: "cancel" },
    { text: "Save and exit", onPress: () => router.replace({ pathname: "/unit/[unitKey]" as never, params: { unitKey } }) },
    { text: "Discard session", style: "destructive", onPress: () => { discardInProgressQuiz(); router.replace({ pathname: "/unit/[unitKey]" as never, params: { unitKey } }); } },
  ]);

  if (!ready) return <View style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator color="#B66CFF" /><Text style={[styles.centerText, { color: colors.muted }]}>Restoring your practice…</Text></View>;
  if (!unit || !question) return <View style={[styles.center, { backgroundColor: colors.background }]}><MaterialIcons name="quiz" size={43} color="#B66CFF" /><Text style={[styles.centerTitle, { color: colors.foreground }]}>Practice isn’t ready</Text><Text style={[styles.centerText, { color: colors.muted }]}>Choose another lesson to continue learning.</Text><Pressable onPress={() => router.replace("/")} style={styles.returnButton}><Text style={styles.returnText}>Back to Library</Text></Pressable></View>;

  const progress = `${((index + 1) / queue.length) * 100}%` as `${number}%`;
  const subject = unitKey.split("::")[0]?.replace(/(^|_)([a-z])/g, (_match: string, prefix: string, letter: string) => `${prefix} ${letter.toUpperCase()}`).trim();
  return <View style={[styles.screen, { backgroundColor: colors.background }]}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={styles.topLine}><Pressable onPress={exit} accessibilityRole="button" accessibilityLabel="Exit practice" style={({ pressed }) => [styles.iconButton, { borderColor: colors.border }, pressed && styles.pressed]}><MaterialIcons name="close" size={22} color={colors.foreground} /></Pressable><View style={styles.unitChip}><Text style={styles.unitChipText}>{subject} · Unit {unit.unitId.replace("Unit ", "")}</Text></View>{effectiveTimed ? <View style={styles.timerChip}><MaterialIcons name="timer" size={15} color="#FFAE51" /><Text style={styles.timerText}>{secondsToClock(elapsedSeconds)}</Text></View> : <View style={styles.timerPlaceholder} />}</View>
    {staleDraft ? <View style={styles.staleCard}><MaterialIcons name="info-outline" size={19} color="#FBBF24" /><Text style={styles.staleText}>An earlier saved session is unavailable. This is a fresh practice.</Text></View> : null}
    <View style={styles.progressMeta}><Text style={[styles.progressText, { color: colors.foreground }]}>Question {index + 1} <Text style={{ color: colors.muted }}>of {queue.length}</Text></Text><Text style={styles.pointsText}>{correctCount} correct</Text></View>
    <View style={styles.progressTrack}><View style={[styles.progressFill, { width: progress }]} /></View>
    <View style={styles.questionArea}><Text style={styles.questionType}>{question.type.replace(/_/g, " ")}</Text><Text style={[styles.questionText, { color: colors.foreground }]}>{question.question}</Text></View>
    {question.options.length ? <View style={styles.options}>{question.options.map((option, optionIndex) => {
      const selected = response === option; const revealCorrect = submitted && option === question.answer; const revealWrong = submitted && selected && !correct;
      const border = revealCorrect ? "#46D69C" : revealWrong ? "#FB7185" : selected ? "#A784FF" : colors.border;
      const background = revealCorrect ? "#153B35" : revealWrong ? "#3A1E2A" : selected ? "#28204D" : colors.surface;
      return <Pressable key={option} disabled={submitted} accessibilityRole="button" accessibilityState={{ selected, disabled: submitted }} accessibilityLabel={`Answer ${String.fromCharCode(65 + optionIndex)}: ${option}`} onPress={() => submit(option)} style={({ pressed }) => [styles.option, { borderColor: border, backgroundColor: background }, pressed && !submitted && styles.pressed]}><View style={[styles.optionLetter, { backgroundColor: selected ? border : "#182039" }]}><Text style={styles.optionLetterText}>{String.fromCharCode(65 + optionIndex)}</Text></View><Text style={[styles.optionText, { color: colors.foreground }]}>{option}</Text>{revealCorrect ? <MaterialIcons name="check-circle" size={20} color="#6EE7B7" /> : null}{revealWrong ? <MaterialIcons name="cancel" size={20} color="#FB7185" /> : null}</Pressable>;
    })}</View> : <View style={styles.responseArea}><TextInput value={response} editable={!submitted} onChangeText={setResponse} placeholder={question.type === "numerical" ? "Enter your answer" : "Write your answer"} placeholderTextColor={colors.muted} style={[styles.responseInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.foreground }]} multiline={question.type === "short_answer"} returnKeyType="done" accessibilityLabel="Your answer" />{!submitted ? <Pressable disabled={!response.trim()} onPress={() => submit()} style={({ pressed }) => [styles.checkButton, { opacity: response.trim() ? 1 : 0.5 }, pressed && styles.pressed]}><Text style={styles.checkText}>Check answer</Text></Pressable> : null}</View>}
    {submitted ? <View style={styles.feedbackArea}><View style={[styles.feedbackCard, { backgroundColor: correct ? "#143A34" : "#3A1D29", borderColor: correct ? "#2F9B78" : "#8D3B55" }]}><MaterialIcons name={correct ? "celebration" : "lightbulb"} size={23} color={correct ? "#6EE7B7" : "#FFB26B"} /><View style={styles.feedbackCopy}><Text style={[styles.feedbackTitle, { color: correct ? "#8AF0C2" : "#FFD4A8" }]}>{correct ? "Correct!" : "Not quite"}</Text>{!correct ? <Text style={[styles.answerText, { color: colors.foreground }]}>Answer: {question.answer}</Text> : null}</View></View><View style={[styles.explanationCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.explanationLabel, { color: "#B66CFF" }]}>WHY THIS ANSWER</Text><Text style={[styles.explanationText, { color: colors.muted }]}>{question.explanation}</Text></View><Pressable onPress={next} disabled={isCompleting} accessibilityRole="button" accessibilityState={{ disabled: isCompleting }} style={({ pressed }) => [styles.nextButton, isCompleting && styles.nextDisabled, pressed && !isCompleting && styles.pressed]}><Text style={styles.nextText}>{isCompleting ? "Saving results…" : index === queue.length - 1 ? "See my results" : "Next question"}</Text><MaterialIcons name={isCompleting ? "hourglass-top" : "arrow-forward"} size={21} color="#FFFFFF" /></Pressable></View> : null}
  </ScrollView></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, content: { gap: 17, paddingBottom: 34, paddingHorizontal: 18, paddingTop: 16 },
  topLine: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" }, iconButton: { alignItems: "center", backgroundColor: "#11172B", borderRadius: 14, borderWidth: 1, height: 43, justifyContent: "center", width: 43 },
  unitChip: { backgroundColor: "#171B31", borderRadius: 14, flex: 1, marginHorizontal: 9, paddingHorizontal: 10, paddingVertical: 8 }, unitChipText: { color: "#D6C7FF", fontSize: 11, fontWeight: "900", textAlign: "center" },
  timerChip: { alignItems: "center", backgroundColor: "#342517", borderRadius: 14, flexDirection: "row", gap: 4, minWidth: 55, paddingHorizontal: 8, paddingVertical: 8 }, timerText: { color: "#FFD39E", fontSize: 11, fontWeight: "900" }, timerPlaceholder: { width: 43 },
  staleCard: { alignItems: "center", backgroundColor: "#382D18", borderColor: "#705923", borderRadius: 15, borderWidth: 1, flexDirection: "row", gap: 9, padding: 12 }, staleText: { color: "#FBE1A7", flex: 1, fontSize: 12, lineHeight: 17 },
  progressMeta: { flexDirection: "row", justifyContent: "space-between" }, progressText: { fontSize: 14, fontWeight: "900" }, pointsText: { color: "#B66CFF", fontSize: 12, fontWeight: "900" }, progressTrack: { backgroundColor: "#202742", borderRadius: 6, height: 7, overflow: "hidden" }, progressFill: { backgroundColor: "#FF8A1F", borderRadius: 6, height: "100%" },
  questionArea: { gap: 9, paddingTop: 3 }, questionType: { color: "#B66CFF", fontSize: 10, fontWeight: "900", letterSpacing: 1.2, textTransform: "uppercase" }, questionText: { fontSize: 24, fontWeight: "800", letterSpacing: -0.4, lineHeight: 33 },
  options: { gap: 10 }, option: { alignItems: "center", borderRadius: 18, borderWidth: 1, flexDirection: "row", gap: 11, minHeight: 62, paddingHorizontal: 13, paddingVertical: 11 }, optionLetter: { alignItems: "center", borderRadius: 12, height: 30, justifyContent: "center", width: 30 }, optionLetterText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" }, optionText: { flex: 1, fontSize: 15, fontWeight: "700", lineHeight: 21 },
  responseArea: { gap: 10 }, responseInput: { borderRadius: 17, borderWidth: 1, fontSize: 15, minHeight: 100, padding: 14, textAlignVertical: "top" }, checkButton: { alignItems: "center", backgroundColor: "#FF8A1F", borderRadius: 16, justifyContent: "center", minHeight: 52 }, checkText: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
  feedbackArea: { gap: 11 }, feedbackCard: { alignItems: "center", borderRadius: 18, borderWidth: 1, flexDirection: "row", gap: 11, padding: 14 }, feedbackCopy: { flex: 1, gap: 2 }, feedbackTitle: { fontSize: 16, fontWeight: "900" }, answerText: { fontSize: 13, fontWeight: "700" },
  explanationCard: { borderRadius: 18, borderWidth: 1, gap: 7, padding: 14 }, explanationLabel: { fontSize: 10, fontWeight: "900", letterSpacing: 1.1 }, explanationText: { fontSize: 13, lineHeight: 20 }, nextButton: { alignItems: "center", backgroundColor: "#FF8A1F", borderRadius: 18, flexDirection: "row", justifyContent: "center", minHeight: 56, paddingHorizontal: 18 }, nextText: { color: "#FFFFFF", flex: 1, fontSize: 16, fontWeight: "900", textAlign: "center" },
  center: { alignItems: "center", flex: 1, gap: 11, justifyContent: "center", padding: 24 }, centerTitle: { fontSize: 20, fontWeight: "900" }, centerText: { fontSize: 13, textAlign: "center" }, returnButton: { backgroundColor: "#FF8A1F", borderRadius: 15, marginTop: 4, paddingHorizontal: 18, paddingVertical: 13 }, returnText: { color: "#FFFFFF", fontWeight: "900" }, nextDisabled: { opacity: 0.65 }, pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
});
