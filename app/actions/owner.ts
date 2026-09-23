"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/session";
import { dayKeyToDate, isDayKey, todayKey } from "@/lib/dates";
import { PondReportError, normalizeFeedCode, parsePondReport } from "@/lib/import/pondReport";
import { buildImportPlan } from "@/lib/import/plan";
import { commitImportPlan } from "@/lib/import/commit";
import type { FormState } from "./logs";

const MAX_SHEET_BYTES = 900 * 1024;

function text(formData: FormData, name: string, max = 80) {
  return String(formData.get(name) ?? "").trim().slice(0, max);
}

function optionalNumber(formData: FormData, name: string) {
  const raw = text(formData, name);
  if (raw === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : NaN;
}

function invalid(fieldErrors: Record<string, string>): FormState {
  return { status: "error", message: "Check the highlighted fields.", fieldErrors };
}

async function nameTaken(name: string, exceptId?: number) {
  const existing = await prisma.pond.findUnique({ where: { name } });
  return existing !== null && existing.id !== exceptId;
}

export async function updatePond(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireOwner();
  const id = Number(formData.get("id"));
  const name = text(formData, "name", 40);
  const species = text(formData, "species", 60) || null;
  const stockedAt = text(formData, "stockedAt");
  const stockedCount = optionalNumber(formData, "stockedCount");
  const assumedFcr = optionalNumber(formData, "assumedFcr");

  const errors: Record<string, string> = {};
  if (!name) errors.name = "Enter a pond name.";
  else if (await nameTaken(name, id)) errors.name = "Another pond already has this name.";
  if (stockedAt && (!isDayKey(stockedAt) || stockedAt > todayKey())) errors.stockedAt = "Enter a valid past date.";
  if (stockedCount !== null && (!Number.isInteger(stockedCount) || stockedCount < 1)) {
    errors.stockedCount = "Enter a whole number of fish, or leave blank.";
  }
  if (assumedFcr === null || !(assumedFcr >= 0.5 && assumedFcr <= 5)) errors.assumedFcr = "FCR is usually between 0.8 and 2.5.";
  if (Object.keys(errors).length > 0) return invalid(errors);

  await prisma.pond.update({
    where: { id },
    data: {
      name,
      species,
      stockedAt: stockedAt ? dayKeyToDate(stockedAt) : null,
      stockedCount: stockedCount ?? null,
      assumedFcr: assumedFcr as number,
      active: formData.get("active") === "on",
    },
  });
  revalidatePath("/", "layout");
  return { status: "success", message: "Pond settings saved." };
}

export async function createPond(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireOwner();
  const name = text(formData, "name", 40);
  const species = text(formData, "species", 60) || null;
  const stockedAt = text(formData, "stockedAt");

  const errors: Record<string, string> = {};
  if (!name) errors.name = "Enter a pond name.";
  else if (await nameTaken(name)) errors.name = "A pond with this name already exists.";
  if (stockedAt && (!isDayKey(stockedAt) || stockedAt > todayKey())) errors.stockedAt = "Enter a valid past date.";
  if (Object.keys(errors).length > 0) return invalid(errors);

  const pond = await prisma.pond.create({
    data: { name, species, stockedAt: stockedAt ? dayKeyToDate(stockedAt) : null },
  });
  revalidatePath("/", "layout");
  redirect(`/ponds/${pond.id}`);
}

export async function saveFeedType(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireOwner();
  const id = formData.get("id") ? Number(formData.get("id")) : null;
  const code = normalizeFeedCode(text(formData, "code", 20));
  const packSizeKg = optionalNumber(formData, "packSizeKg");
  const pricePerKg = optionalNumber(formData, "pricePerKg");

  const errors: Record<string, string> = {};
  if (!code) errors.code = "Use letters then numbers, e.g. SM0320.";
  if (packSizeKg === null || !(packSizeKg > 0 && packSizeKg <= 100)) errors.packSizeKg = "Bag size in kg.";
  if (pricePerKg === null || !(pricePerKg >= 0 && pricePerKg <= 100)) errors.pricePerKg = "Price per kg in RM.";
  if (code) {
    const existing = await prisma.feedType.findUnique({ where: { code } });
    if (existing && existing.id !== id) errors.code = "This feed code already exists.";
  }
  if (Object.keys(errors).length > 0) return invalid(errors);

  const data = {
    code: code as string,
    packSizeKg: packSizeKg as number,
    pricePerKg: pricePerKg as number,
    active: id ? formData.get("active") === "on" : true,
  };
  if (id) await prisma.feedType.update({ where: { id }, data });
  else await prisma.feedType.create({ data });

  revalidatePath("/", "layout");
  return { status: "success", message: id ? "Saved. New entries use this price." : `${code} added.` };
}

export async function recordStockMovement(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireOwner();
  const feedTypeId = Number(formData.get("feedTypeId"));
  const kind = text(formData, "kind");
  const date = text(formData, "date");
  const bags = optionalNumber(formData, "bags");
  const note = text(formData, "note", 200) || null;

  const errors: Record<string, string> = {};
  if (!(await prisma.feedType.findUnique({ where: { id: feedTypeId } }))) errors.feedTypeId = "Choose a feed type.";
  if (kind !== "delivery" && kind !== "count") errors.kind = "Choose delivery or stocktake.";
  if (!isDayKey(date) || date > todayKey()) errors.date = "Enter a valid date.";
  if (bags === null || !(bags >= 0 && bags <= 100000) || (kind === "delivery" && bags === 0)) {
    errors.bags = "Enter the number of bags.";
  }
  if (Object.keys(errors).length > 0) return invalid(errors);

  await prisma.stockMovement.create({
    data: { feedTypeId, kind, date: dayKeyToDate(date), bags: bags as number, note },
  });
  revalidatePath("/", "layout");
  return { status: "success", message: kind === "count" ? "Stocktake recorded." : "Delivery recorded." };
}

export async function deleteStockMovement(formData: FormData) {
  await requireOwner();
  await prisma.stockMovement.delete({ where: { id: Number(formData.get("id")) } });
  revalidatePath("/", "layout");
}

export async function deleteSampling(formData: FormData) {
  await requireOwner();
  await prisma.sampling.delete({ where: { id: Number(formData.get("id")) } });
  revalidatePath("/", "layout");
}

export async function deleteImportBatch(formData: FormData) {
  await requireOwner();
  // Cascades to the daily logs and samplings created by this import.
  await prisma.importBatch.delete({ where: { id: Number(formData.get("id")) } });
  revalidatePath("/", "layout");
}

export async function importSpreadsheet(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireOwner();
  const file = formData.get("file");
  const target = text(formData, "target");
  const newPondName = text(formData, "newPondName", 40);
  const species = text(formData, "species", 60) || null;

  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "Choose a CSV file to import." };
  }
  if (file.size > MAX_SHEET_BYTES) {
    return { status: "error", message: "That file is too large for a pond report (limit 900 KB)." };
  }

  const errors: Record<string, string> = {};
  let pondId: number | null = null;
  if (target === "new") {
    if (!newPondName) errors.newPondName = "Name the new pond.";
    else if (await nameTaken(newPondName)) errors.newPondName = "A pond with this name already exists.";
  } else {
    pondId = Number(target);
    if (!(await prisma.pond.findUnique({ where: { id: pondId } }))) errors.target = "Choose a pond.";
  }
  if (Object.keys(errors).length > 0) return invalid(errors);

  let plan;
  try {
    const parsed = parsePondReport(await file.text());
    plan = buildImportPlan(parsed, await prisma.feedType.findMany());
  } catch (error) {
    if (error instanceof PondReportError) return { status: "error", message: error.message };
    throw error;
  }
  if (plan.logs.length === 0) {
    return { status: "error", message: "The sheet has monthly blocks but no daily entries to import." };
  }

  const result = await commitImportPlan(
    prisma,
    plan,
    pondId !== null ? { pondId } : { newPond: { name: newPondName, species } },
    file.name.slice(0, 120),
  );

  revalidatePath("/", "layout");
  redirect(`/ponds/${result.pondId}?view=data&imported=${result.batchId}`);
}
