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
