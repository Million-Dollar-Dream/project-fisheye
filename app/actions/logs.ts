"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { daysBetween, dayKeyToDate, isDayKey, todayKey } from "@/lib/dates";

export type FormState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string>;
};

// Workers can correct the last week; owners can edit any day.
const WORKER_EDIT_WINDOW_DAYS = 7;

function numberField(formData: FormData, name: string) {
  const raw = String(formData.get(name) ?? "").trim();
  if (raw === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : NaN;
}

function checkDate(date: string, role: "owner" | "worker"): string | null {
  if (!isDayKey(date)) return "Choose a valid date.";
  const age = daysBetween(date, todayKey());
  if (age < 0) return "You can't record a future date.";
  if (role === "worker" && age > WORKER_EDIT_WINDOW_DAYS) {
    return `Workers can record up to ${WORKER_EDIT_WINDOW_DAYS} days back. Ask the owner to fix older days.`;
  }
  return null;
}

export async function saveDailyLog(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession();
  const pondId = Number(formData.get("pondId"));
  const date = String(formData.get("date") ?? "");
  const feedTypeRaw = String(formData.get("feedTypeId") ?? "");
  const bags = numberField(formData, "bags") ?? 0;
  const deadCount = numberField(formData, "deadCount") ?? 0;
  const note = String(formData.get("note") ?? "").trim().slice(0, 500) || null;
  const returnTo = String(formData.get("returnTo") ?? "");

  const fieldErrors: Record<string, string> = {};
  const dateError = checkDate(date, session.role);
  if (dateError) fieldErrors.date = dateError;
  if (!Number.isFinite(bags) || bags < 0 || bags > 200) fieldErrors.bags = "Enter bags between 0 and 200.";
  if (!Number.isInteger(deadCount) || deadCount < 0 || deadCount > 100000) {
    fieldErrors.deadCount = "Enter a whole number of fish.";
  }

  const feedTypeId = feedTypeRaw && feedTypeRaw !== "none" ? Number(feedTypeRaw) : null;
  if (bags > 0 && !feedTypeId) fieldErrors.feedTypeId = "Choose the feed type used.";

  const [pond, feedType] = await Promise.all([
    Number.isInteger(pondId) ? prisma.pond.findUnique({ where: { id: pondId } }) : null,
    feedTypeId ? prisma.feedType.findUnique({ where: { id: feedTypeId } }) : null,
  ]);
  if (!pond) return { status: "error", message: "This pond no longer exists." };
  if (feedTypeId && !feedType) fieldErrors.feedTypeId = "That feed type no longer exists.";

  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", message: "Check the highlighted fields.", fieldErrors };
  }

  const usedFeed = bags > 0 ? feedType : null;
  const feedKg = usedFeed ? bags * usedFeed.packSizeKg : 0;
  const data = {
    feedTypeId: usedFeed?.id ?? null,
    bags: usedFeed ? bags : 0,
    feedKg,
    feedCostRm: usedFeed ? feedKg * usedFeed.pricePerKg : 0,
    deadCount,
    note,
    recordedBy: session.name ?? (session.role === "owner" ? "Owner" : "Worker"),
    // An edited imported day becomes an app record.
    source: "app",
    importBatchId: null,
  };

  await prisma.dailyLog.upsert({
    where: { pondId_date: { pondId, date: dayKeyToDate(date) } },
    update: data,
    create: { pondId, date: dayKeyToDate(date), ...data },
  });

  revalidatePath("/", "layout");
  redirect(
    returnTo.startsWith("/ponds/") ? returnTo : `/log?date=${date}&saved=${pondId}`,
  );
}

export async function saveSampling(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession();
  const pondId = Number(formData.get("pondId"));
  const date = String(formData.get("date") ?? "");
  const fishCount = numberField(formData, "fishCount");
  const totalWeightKg = numberField(formData, "totalWeightKg");

  const fieldErrors: Record<string, string> = {};
  const dateError = checkDate(date, session.role);
  if (dateError) fieldErrors.date = dateError;
  if (fishCount === null || !Number.isInteger(fishCount) || fishCount < 1 || fishCount > 10000) {
    fieldErrors.fishCount = "Enter how many fish were weighed.";
  }
  if (totalWeightKg === null || !Number.isFinite(totalWeightKg) || totalWeightKg <= 0 || totalWeightKg > 10000) {
    fieldErrors.totalWeightKg = "Enter their total weight in kg.";
  }
  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", message: "Check the highlighted fields.", fieldErrors };
  }

  const pond = await prisma.pond.findUnique({ where: { id: pondId } });
  if (!pond) return { status: "error", message: "This pond no longer exists." };

  await prisma.sampling.create({
    data: {
      pondId,
      date: dayKeyToDate(date),
      avgWeightKg: (totalWeightKg as number) / (fishCount as number),
      sampleSize: fishCount as number,
      recordedBy: session.name ?? (session.role === "owner" ? "Owner" : "Worker"),
    },
  });

  revalidatePath("/", "layout");
  return { status: "success", message: "Sample saved." };
}

export async function deleteDailyLog(formData: FormData) {
  const session = await requireSession();
  const id = Number(formData.get("id"));
  const log = await prisma.dailyLog.findUnique({ where: { id } });
  if (!log) return;

  if (session.role !== "owner") {
    const age = daysBetween(log.date.toISOString().slice(0, 10), todayKey());
    if (log.source !== "app" || age > WORKER_EDIT_WINDOW_DAYS) {
      throw new Error("Only the owner can remove this record");
    }
  }

  await prisma.dailyLog.delete({ where: { id } });
  revalidatePath("/", "layout");
}
