import { describe, expect, it } from "vitest";

import { BANK_POINTER_KEY, createBankDescriptor, readActiveBankRecord, stageAndActivateBank, type KeyValueStore } from "../lib/molarum/bank-storage";
import { validateQuestionBank } from "../lib/molarum/validator";
import type { QuestionType, StudyQuestion } from "../lib/molarum/types";

const types: QuestionType[] = [...Array<QuestionType>(20).fill("multiple_choice"), ...Array<QuestionType>(4).fill("true_false"), ...Array<QuestionType>(8).fill("short_answer"), ...Array<QuestionType>(8).fill("numerical")];
const difficulties = [...Array(14).fill("easy"), ...Array(18).fill("medium"), ...Array(8).fill("hard")] as StudyQuestion["difficulty"][];

function validatedFixture(version: string) {
  const questions: StudyQuestion[] = types.map((type, index) => {
    const base = { id: `chemistry-u01-${String(index + 1).padStart(3, "0")}`, unitId: "Unit 1", unitTitle: "Unit 1: Storage Fixture", topic: "Fixture", question: `Storage fixture ${version} ${index + 1}`, explanation: "Fixture explanation.", difficulty: difficulties[index], sourceNote: "Fixture source note.", reviewStatus: "ai_draft" as const };
    if (type === "multiple_choice") return { ...base, type, options: ["A", "B", "C", "D"], answer: "A" };
    if (type === "true_false") return { ...base, type, options: ["True", "False"], answer: "True" };
    return { ...base, type, options: [], answer: type === "numerical" ? "1" : "Fixture answer" };
  });
  const result = validateQuestionBank({ schemaVersion: 1, generatedAt: "2026-08-22T00:00:00.000Z", sourceCatalogVersion: version, questions });
  if (!result.ok) throw new Error("Fixture must validate.");
  return result.value;
}

class MemoryStore implements KeyValueStore {
  readonly values = new Map<string, string>();
  failPointerWrite = false;
  async getItem(key: string) { return this.values.get(key) ?? null; }
  async setItem(key: string, value: string) {
    if (this.failPointerWrite && key === BANK_POINTER_KEY) throw new Error("simulated pointer write failure");
    this.values.set(key, value);
  }
  async removeItem(key: string) { this.values.delete(key); }
}

describe("versioned active-bank storage", () => {
  it("creates a stable descriptor for unchanged source-grounded content", () => {
    const bank = validatedFixture("fixture-v1");
    expect(createBankDescriptor(bank, "packaged_validated")).toEqual(createBankDescriptor(bank, "packaged_validated"));
  });

  it("activates only a fully written and verified bank record", async () => {
    const store = new MemoryStore();
    const first = validatedFixture("fixture-v1");
    const descriptor = await stageAndActivateBank(store, first, "packaged_validated");
    const active = await readActiveBankRecord(store);
    expect(active?.descriptor).toEqual(descriptor);
    expect(active?.activeBank.bank.sourceCatalogVersion).toBe("fixture-v1");
  });

  it("keeps the last-known-good pointer when a replacement pointer write is interrupted", async () => {
    const store = new MemoryStore();
    const first = validatedFixture("fixture-v1");
    const firstDescriptor = await stageAndActivateBank(store, first, "packaged_validated");
    store.failPointerWrite = true;
    await expect(stageAndActivateBank(store, validatedFixture("fixture-v2"), "imported_draft")).rejects.toThrow("pointer");
    const recovered = await readActiveBankRecord(store);
    expect(recovered?.descriptor.bankId).toBe(firstDescriptor.bankId);
    expect(recovered?.activeBank.bank.sourceCatalogVersion).toBe("fixture-v1");
  });
});
