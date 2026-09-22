import { prisma } from "@/lib/prisma";

// Assumed feed conversion ratio (kg of feed per kg of fish weight gained),
// matching the value used in the source tracking spreadsheet. Farms
// typically don't weigh every fish, so this industry-standard estimate is
// used to translate feed consumed into an estimated fish weight.
export const ASSUMED_FEED_CONVERSION_RATIO = 1.35;

export type PondSummary = {
  pondId: number;
  totalFeedConsumedKg: number;
  feedConversionRatio: number;
  estimatedTotalFishWeightKg: number;
  totalDeadFishWeightKg: number;
  totalEstimatedWeightToHarvestKg: number;
};

export type PondMonthlyStats = {
  feedUsedThisMonthKg: number;
  deadFishThisMonth: number;
};

export async function getPondMonthlyStats(
  pondId: number,
): Promise<PondMonthlyStats> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [feedLogs, deadFishRecords] = await Promise.all([
    prisma.feedLog.findMany({
      where: { pondId, date: { gte: monthStart, lt: monthEnd } },
      include: { feedType: true },
    }),
    prisma.deadFishRecord.findMany({
      where: { pondId, date: { gte: monthStart, lt: monthEnd } },
    }),
  ]);

  const feedUsedThisMonthKg = feedLogs.reduce(
    (sum, log) => sum + log.quantity * log.feedType.packingSize,
    0,
  );
  const deadFishThisMonth = deadFishRecords.reduce(
    (sum, record) => sum + record.tailCount,
    0,
  );

  return { feedUsedThisMonthKg, deadFishThisMonth };
}

export async function getPondSummary(pondId: number): Promise<PondSummary> {
  const [feedInventory, deadFishRecords] = await Promise.all([
    prisma.feedInventory.findMany({ where: { pondId } }),
    prisma.deadFishRecord.findMany({ where: { pondId } }),
  ]);

  const totalFeedConsumedKg = feedInventory.reduce(
    (sum, item) => sum + item.totalWeightKg,
    0,
  );
  const totalDeadFishWeightKg = deadFishRecords.reduce(
    (sum, record) => sum + record.kg,
    0,
  );

  const estimatedTotalFishWeightKg =
    totalFeedConsumedKg / ASSUMED_FEED_CONVERSION_RATIO;
  const totalEstimatedWeightToHarvestKg = Math.max(
    estimatedTotalFishWeightKg - totalDeadFishWeightKg,
    0,
  );

  return {
    pondId,
    totalFeedConsumedKg,
    feedConversionRatio: ASSUMED_FEED_CONVERSION_RATIO,
    estimatedTotalFishWeightKg,
    totalDeadFishWeightKg,
    totalEstimatedWeightToHarvestKg,
  };
}
