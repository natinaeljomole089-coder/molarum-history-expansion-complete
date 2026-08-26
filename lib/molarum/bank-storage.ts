import type { BankDescriptor, ValidatedQuestionBank } from "./types";

export const BANK_POINTER_KEY = "molarum.local-study-library.active-bank-pointer.v1";
const BANK_RECORD_PREFIX = "molarum.local-study-library.bank-record.v1.";
export const CURRENT_BUNDLED_SOURCE_CATALOG = "owner-drive-grade10-textbooks-2026-08-24-full-expanded-history-continuation-5";
export const PRIOR_BUNDLED_SOURCE_CATALOGS = new Set(["owner-drive-grade10-textbooks-2026-08-22", "owner-drive-grade10-textbooks-2026-08-22-expanded", "owner-drive-grade10-textbooks-2026-08-22-full-expanded", "owner-drive-grade10-textbooks-2026-08-22-full-expanded-continuation-1", "owner-drive-grade10-textbooks-2026-08-23-full-expanded-continuation-2", "owner-drive-grade10-textbooks-2026-08-23-full-expanded-continuation-3", "owner-drive-grade10-textbooks-2026-08-24-full-expanded-history-continuation-1", "owner-drive-grade10-textbooks-2026-08-24-full-expanded-history-continuation-2", "owner-drive-grade10-textbooks-2026-08-24-full-expanded-history-continuation-3", "owner-drive-grade10-textbooks-2026-08-24-full-expanded-history-continuation-4"]);

export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export interface StoredBankRecord {
  schemaVersion: 1;
  descriptor: BankDescriptor;
  activeBank: ValidatedQuestionBank;
  writtenAt: string;
}

export function shouldUpgradeStagedPackagedBank(staged: Pick<StoredBankRecord, "activeBank" | "descriptor"> | null) {
  return Boolean(staged && staged.descriptor.origin === "packaged_validated" && staged.activeBank.bank.sourceCatalogVersion !== CURRENT_BUNDLED_SOURCE_CATALOG);
}

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function createBankDescriptor(activeBank: ValidatedQuestionBank, origin: BankDescriptor["origin"]): BankDescriptor {
  const fingerprint = [origin, activeBank.bank.sourceCatalogVersion, activeBank.bank.generatedAt, activeBank.bank.questions.map((question) => question.id).join("|")].join("::");
  return {
    bankId: `molarum-${origin}-${stableHash(fingerprint)}`,
    origin,
    sourceCatalogVersion: activeBank.bank.sourceCatalogVersion,
    questionCount: activeBank.bank.questions.length,
  };
}

function recordKey(bankId: string) {
  return `${BANK_RECORD_PREFIX}${bankId}`;
}

function temporaryRecordKey(bankId: string) {
  return `${recordKey(bankId)}.pending`;
}

function parseRecord(value: string | null): StoredBankRecord | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<StoredBankRecord>;
    if (parsed.schemaVersion !== 1 || !parsed.descriptor?.bankId || !parsed.activeBank?.bank || !parsed.activeBank?.report) return null;
    return parsed as StoredBankRecord;
  } catch {
    return null;
  }
}

/** Writes a candidate record fully, verifies it, and changes the active pointer only last. */
export async function stageAndActivateBank(store: KeyValueStore, activeBank: ValidatedQuestionBank, origin: BankDescriptor["origin"]) {
  const descriptor = createBankDescriptor(activeBank, origin);
  const record: StoredBankRecord = { schemaVersion: 1, descriptor, activeBank, writtenAt: new Date().toISOString() };
  const serialised = JSON.stringify(record);
  const temporaryKey = temporaryRecordKey(descriptor.bankId);
  const finalKey = recordKey(descriptor.bankId);

  await store.setItem(temporaryKey, serialised);
  if (parseRecord(await store.getItem(temporaryKey))?.descriptor.bankId !== descriptor.bankId) throw new Error("Temporary bank verification failed; the active bank was not changed.");
  await store.setItem(finalKey, serialised);
  if (parseRecord(await store.getItem(finalKey))?.descriptor.bankId !== descriptor.bankId) throw new Error("Stored bank verification failed; the active bank was not changed.");
  await store.setItem(BANK_POINTER_KEY, JSON.stringify({ schemaVersion: 1, bankId: descriptor.bankId }));
  const pointer = await store.getItem(BANK_POINTER_KEY);
  if (!pointer || JSON.parse(pointer).bankId !== descriptor.bankId) throw new Error("Active bank pointer verification failed; the active bank was not changed.");
  await store.removeItem(temporaryKey).catch(() => undefined);
  return descriptor;
}

export async function readActiveBankRecord(store: KeyValueStore) {
  const pointerValue = await store.getItem(BANK_POINTER_KEY);
  if (!pointerValue) return null;
  try {
    const pointer = JSON.parse(pointerValue) as { schemaVersion?: number; bankId?: string };
    if (pointer.schemaVersion !== 1 || !pointer.bankId) return null;
    const record = parseRecord(await store.getItem(recordKey(pointer.bankId)));
    return record?.descriptor.bankId === pointer.bankId ? record : null;
  } catch {
    return null;
  }
}
