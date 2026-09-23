import { prisma } from "./prisma";
import { dateToDayKey, dayKeyToDate, todayKey } from "./dates";
import { computePondMetrics, type PondMetrics } from "./metrics";
import { computeStockLevels } from "./inventory";
import type { Finding } from "./import/pondReport";

export async function getPondList() {
  return prisma.pond.findMany({
    where: { active: true },
    orderBy: { id: "asc" },
    select: { id: true, name: true },
  });
}

export async function getFeedTypes({ activeOnly = false } = {}) {
  return prisma.feedType.findMany({
    where: activeOnly ? { active: true } : undefined,
    orderBy: { code: "asc" },
  });
}

export async function getPondsWithMetrics(today = todayKey()) {
  const ponds = await prisma.pond.findMany({
    where: { active: true },
    orderBy: { id: "asc" },
    include: {
      dailyLogs: { include: { feedType: { select: { code: true } } } },
      samplings: true,
    },
  });

  return ponds.map(({ dailyLogs, samplings, ...pond }) => ({
    pond,
    logs: dailyLogs,
    metrics: computePondMetrics(pond, dailyLogs, samplings, today),
  }));
}

export type PondWithMetrics = Awaited<ReturnType<typeof getPondsWithMetrics>>[number];

export async function getStockLevels(today = todayKey()) {
  const [feedTypes, movements, usage] = await Promise.all([
    getFeedTypes(),
    prisma.stockMovement.findMany(),
    prisma.dailyLog.findMany({
      where: { bags: { gt: 0 } },
      select: { feedTypeId: true, date: true, bags: true },
    }),
  ]);

  // Usage rate is measured up to the most recent record so a paused pond
  // does not read as zero consumption.
  const latest = usage.reduce<string | null>((max, row) => {
    const key = dateToDayKey(row.date);
    return max === null || key > max ? key : max;
  }, null);
  const horizon = latest && latest < today ? latest : today;

  return {
    horizon,
    levels: computeStockLevels(feedTypes, movements, usage, horizon),
  };
}

export async function getRecentActivity(limit = 6) {
  return prisma.dailyLog.findMany({
    where: { source: "app" },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: {
      pond: { select: { id: true, name: true } },
      feedType: { select: { code: true } },
    },
  });
}

export async function getOpenFindings() {
  const batches = await prisma.importBatch.findMany({
    orderBy: { importedAt: "desc" },
    include: { pond: { select: { id: true, name: true } } },
  });
  return batches.map((batch) => ({
    ...batch,
    findings: JSON.parse(batch.findings) as Finding[],
  }));
}

export async function getPondDetail(pondId: number, today = todayKey()) {
  const pond = await prisma.pond.findUnique({
    where: { id: pondId },
    include: {
      dailyLogs: {
        orderBy: { date: "asc" },
        include: { feedType: { select: { code: true, packSizeKg: true } } },
      },
      samplings: { orderBy: { date: "asc" } },
      imports: { orderBy: { importedAt: "desc" } },
    },
  });
  if (!pond) return null;

  const { dailyLogs, samplings, imports, ...rest } = pond;
  const metrics: PondMetrics = computePondMetrics(rest, dailyLogs, samplings, today);

  return {
    pond: rest,
    logs: dailyLogs,
    samplings,
    imports: imports.map((batch) => ({
      ...batch,
      findings: JSON.parse(batch.findings) as Finding[],
      summary: JSON.parse(batch.summary) as { totals: { days: number; feedKg: number; feedCostRm: number } },
    })),
    metrics,
  };
}

export async function getWorkerDay(dayKey: string) {
  const date = dayKeyToDate(dayKey);
  const ponds = await prisma.pond.findMany({
    where: { active: true },
    orderBy: { id: "asc" },
    include: {
      dailyLogs: {
        where: { date: { lte: date } },
        orderBy: { date: "desc" },
        take: 2,
        include: { feedType: { select: { code: true } } },
      },
    },
  });

  return ponds.map(({ dailyLogs, ...pond }) => {
    const today = dailyLogs.find((log) => dateToDayKey(log.date) === dayKey) ?? null;
    const previous = dailyLogs.find((log) => dateToDayKey(log.date) < dayKey) ?? null;
    return { pond, today, previous };
  });
}
