// The fox companion's state: name, growth points, and which care actions happened each day.
// Stored in this browser's localStorage, like the journal.
import type { FoxPose, FoxStage } from "@/components/Fox";
import { dateKey, load, remove, save } from "./storage";
import { loadFoundEggs, type EggId } from "./eggs";

export type CareKind = "task" | "breath" | "journal";

/** What each care action gives, once per day. */
export const CARE: Record<CareKind, { resource: "sun" | "breeze" | "dew"; label: string; points: number }> = {
  task: { resource: "sun", label: "陽光", points: 10 },
  breath: { resource: "breeze", label: "微風", points: 5 },
  journal: { resource: "dew", label: "露水", points: 10 },
};

/**
 * Points needed to reach each stage. At most 25 points a day, so with full care every day:
 * stage 2 in 1 week, stage 3 in 3 weeks, stage 4 in about 6 weeks, stage 5 in 3 months (90 × 25).
 */
export const STAGE_AT: Record<FoxStage, number> = { 1: 0, 2: 175, 3: 525, 4: 1125, 5: 2250 };

export const STAGE_OUTFIT: Record<FoxStage, string> = {
  1: "",
  2: "戴上了紅色小領巾",
  3: "圍上了苔綠圍巾",
  4: "穿上了深藍羽織",
  5: "穿上了桂花羽織",
};

export type FoxState = {
  name: string;
  points: number;
  sun: number;
  breeze: number;
  dew: number;
  /** Care given per day ("YYYY-MM-DD"). */
  days: Record<string, Partial<Record<CareKind, true>>>;
  /** The last day the app was opened. */
  lastVisit: string;
  /** Highest stage already celebrated, so each growth is celebrated once. */
  seenStage: FoxStage;
};

export function stageFor(points: number): FoxStage {
  return ([5, 4, 3, 2, 1] as FoxStage[]).find((s) => points >= STAGE_AT[s]) ?? 1;
}

/** Progress toward the next stage, 0–1 (1 at the final stage). */
export function progressToNext(points: number) {
  const stage = stageFor(points);
  if (stage === 5) return 1;
  const from = STAGE_AT[stage];
  const to = STAGE_AT[(stage + 1) as FoxStage];
  return (points - from) / (to - from);
}

export function loadFox(): FoxState | null {
  return load<FoxState>("fox");
}

export function saveFox(state: FoxState) {
  save("fox", state);
}

export function newFox(name: string): FoxState {
  return { name, points: 0, sun: 0, breeze: 0, dew: 0, days: {}, lastVisit: dateKey(), seenStage: 1 };
}

/** `date` defaults to today; morning care after midnight is recorded on the new calendar day. */
export function caredToday(state: FoxState, kind: CareKind, date = dateKey()) {
  return Boolean(state.days[date]?.[kind]);
}

/** Gives today's care of this kind. Returns the new state, or the same state if already given today. */
export function giveCare(state: FoxState, kind: CareKind, date = dateKey()): FoxState {
  if (caredToday(state, kind, date)) return state;
  const today = date;
  const { resource, points } = CARE[kind];
  return {
    ...state,
    points: state.points + points,
    [resource]: state[resource] + points,
    days: { ...state.days, [today]: { ...state.days[today], [kind]: true } },
  };
}

/** Whole days between two "YYYY-MM-DD" dates. */
export function daysBetween(from: string, to: string) {
  const ms = (d: string) => {
    const [y, m, day] = d.split("-").map(Number);
    return Date.UTC(y, m - 1, day);
  };
  return Math.round((ms(to) - ms(from)) / 86_400_000);
}

/** Number of different days the visitor has cared for the fox. */
export function daysTogether(state: FoxState) {
  return Object.keys(state.days).length;
}

// --- handbook (圖鑑) ---

/** The most points a day can give (all three kinds of care). */
export const MAX_POINTS_PER_DAY = CARE.task.points + CARE.breath.points + CARE.journal.points;

/** Fewest days of full care until `stage` is reached (0 if already there). */
export function daysUntil(points: number, stage: FoxStage) {
  return Math.max(0, Math.ceil((STAGE_AT[stage] - points) / MAX_POINTS_PER_DAY));
}

/** Poses the visitor has seen the fox do, for the pose collection. */
export function loadSeenPoses(): FoxPose[] {
  return load<FoxPose[]>("foxPoses") ?? [];
}

export function markPoseSeen(pose: FoxPose) {
  const seen = loadSeenPoses();
  if (!seen.includes(pose)) save("foxPoses", [...seen, pose]);
}

// --- demo mode: fast-forward for a presentation, then put the real fox back ---

type Backup = { fox: FoxState | null; poses: FoxPose[]; eggs?: EggId[] };

export function hasDemoBackup() {
  return load<Backup>("foxBackup") !== null;
}

/** Saves the real fox once, before the first demo change. */
export function backupForDemo() {
  if (!hasDemoBackup()) save("foxBackup", { fox: loadFox(), poses: loadSeenPoses(), eggs: loadFoundEggs() } satisfies Backup);
}

export function restoreFromDemo() {
  const backup = load<Backup>("foxBackup");
  if (!backup) return;
  if (backup.fox) saveFox(backup.fox);
  else remove("fox");
  save("foxPoses", backup.poses);
  save("eggs", backup.eggs ?? []);
  remove("foxBackup");
}
