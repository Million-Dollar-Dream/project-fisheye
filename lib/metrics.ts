import {
  addDays,
  dateToDayKey,
  daysBetween,
  monthKeyOf,
  monthsBetween,
} from "./dates";

export type MetricLog = {
  date: Date;
  bags: number;
  feedKg: number;
  feedCostRm: number;
  deadCount: number;
  feedType: { code: string } | null;
};

export type MetricSampling = {
  date: Date;
  avgWeightKg: number;
};

export type MetricPond = {
  stockedAt: Date | null;
  stockedCount: number | null;
  assumedFcr: number;
};

export type MonthRow = {
  monthKey: string;
  cultureMonth: number | null;
  daysLogged: number;
  bags: number;
  feedKg: number;
  feedCostRm: number;
  deadCount: number;
  avgWeightKg: number | null;
  deadKg: number;
  cumulativeFeedKg: number;
  estimatedBiomassKg: number;
  feedKgByType: Record<string, number>;
};

export type FeedTypeUsage = {
  code: string;
  bags: number;
  feedKg: number;
  feedCostRm: number;
  firstDate: string;
  lastDate: string;
};

export type PondMetrics = {
  stockedAt: string | null;
  daysOfCulture: number | null;
  cultureMonth: number | null;
  firstLogDate: string | null;
  lastLogDate: string | null;
  daysSinceLastLog: number | null;
  totals: {
    daysLogged: number;
    bags: number;
    feedKg: number;
    feedCostRm: number;
    deadCount: number;
    deadKg: number;
  };
  latestSampling: { date: string; avgWeightKg: number } | null;
  daysSinceSampling: number | null;
  // The spreadsheet's method: feed consumed ÷ assumed FCR, less mortality.
  estimatedBiomassKg: number;
  estimatedHarvestKg: number;
  feedCostPerKg: number | null;
  // Only available once the stocked count is known.
  survivalRate: number | null;
  samplingBiomassKg: number | null;
  realizedFcr: number | null;
  recentDailyFeedKg: number;
  feedingRatePercent: number | null;
  currentFeedCode: string | null;
  months: MonthRow[];
  feedTypes: FeedTypeUsage[];
};

// Average weight that applies to a day: the sample taken in the same month
// (the sheet's convention), else the latest earlier sample, else the first.
export function avgWeightResolver(samplings: MetricSampling[]) {
  const sorted = [...samplings].sort((a, b) => a.date.getTime() - b.date.getTime());
  const byMonth = new Map<string, number>();
  for (const sampling of sorted) byMonth.set(monthKeyOf(sampling.date), sampling.avgWeightKg);

  return (date: Date): number | null => {
    const sameMonth = byMonth.get(monthKeyOf(date));
    if (sameMonth !== undefined) return sameMonth;
    const earlier = sorted.filter((sampling) => sampling.date <= date).at(-1);
    return earlier?.avgWeightKg ?? sorted[0]?.avgWeightKg ?? null;
  };
}

export function computePondMetrics(
  pond: MetricPond,
  logs: MetricLog[],
  samplings: MetricSampling[],
  today: string,
): PondMetrics {
  const sortedLogs = [...logs].sort((a, b) => a.date.getTime() - b.date.getTime());
  const sortedSamplings = [...samplings].sort((a, b) => a.date.getTime() - b.date.getTime());
  const avgWeightOn = avgWeightResolver(sortedSamplings);
  const stockedKey = pond.stockedAt ? dateToDayKey(pond.stockedAt) : null;
  const stockedMonth = pond.stockedAt ? monthKeyOf(pond.stockedAt) : null;

  const monthMap = new Map<string, MonthRow>();
  const typeMap = new Map<string, FeedTypeUsage>();
  const totals = { daysLogged: 0, bags: 0, feedKg: 0, feedCostRm: 0, deadCount: 0, deadKg: 0 };

  for (const log of sortedLogs) {
    const monthKey = monthKeyOf(log.date);
    const dayKey = dateToDayKey(log.date);
    let month = monthMap.get(monthKey);
    if (!month) {
      month = {
        monthKey,
        cultureMonth: stockedMonth ? monthsBetween(stockedMonth, monthKey) : null,
        daysLogged: 0,
        bags: 0,
        feedKg: 0,
        feedCostRm: 0,
        deadCount: 0,
        avgWeightKg: null,
        deadKg: 0,
        cumulativeFeedKg: 0,
        estimatedBiomassKg: 0,
        feedKgByType: {},
      };
      monthMap.set(monthKey, month);
    }

    const deadKg = log.deadCount * (avgWeightOn(log.date) ?? 0);
    month.daysLogged += 1;
    month.bags += log.bags;
    month.feedKg += log.feedKg;
    month.feedCostRm += log.feedCostRm;
    month.deadCount += log.deadCount;
    month.deadKg += deadKg;

    totals.daysLogged += 1;
    totals.bags += log.bags;
    totals.feedKg += log.feedKg;
    totals.feedCostRm += log.feedCostRm;
    totals.deadCount += log.deadCount;
    totals.deadKg += deadKg;

    if (log.feedType && log.bags > 0) {
      const code = log.feedType.code;
      month.feedKgByType[code] = (month.feedKgByType[code] ?? 0) + log.feedKg;
      const usage = typeMap.get(code) ?? {
        code,
        bags: 0,
        feedKg: 0,
        feedCostRm: 0,
        firstDate: dayKey,
        lastDate: dayKey,
      };
      usage.bags += log.bags;
      usage.feedKg += log.feedKg;
      usage.feedCostRm += log.feedCostRm;
      usage.lastDate = dayKey;
      typeMap.set(code, usage);
    }
  }

  for (const sampling of sortedSamplings) {
    const month = monthMap.get(monthKeyOf(sampling.date));
    if (month) month.avgWeightKg = sampling.avgWeightKg;
  }

  const months = [...monthMap.values()].sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  let cumulativeFeed = 0;
  let cumulativeDeadKg = 0;
  for (const month of months) {
    cumulativeFeed += month.feedKg;
    cumulativeDeadKg += month.deadKg;
    month.cumulativeFeedKg = cumulativeFeed;
    month.estimatedBiomassKg = Math.max(cumulativeFeed / pond.assumedFcr - cumulativeDeadKg, 0);
  }

  const firstLogDate = sortedLogs[0] ? dateToDayKey(sortedLogs[0].date) : null;
  const lastLogDate = sortedLogs.at(-1) ? dateToDayKey(sortedLogs.at(-1)!.date) : null;
  const latest = sortedSamplings.at(-1);
  const latestSampling = latest
    ? { date: dateToDayKey(latest.date), avgWeightKg: latest.avgWeightKg }
    : null;

  const estimatedBiomassKg = totals.feedKg / pond.assumedFcr;
  const estimatedHarvestKg = Math.max(estimatedBiomassKg - totals.deadKg, 0);

  const alive = pond.stockedCount ? Math.max(pond.stockedCount - totals.deadCount, 0) : null;
  const samplingBiomassKg = alive !== null && latestSampling ? alive * latestSampling.avgWeightKg : null;

  // Average daily feed over the last 7 days of records.
  const recentFrom = lastLogDate ? addDays(lastLogDate, -6) : null;
  const recentFeedKg = recentFrom
    ? sortedLogs
        .filter((log) => dateToDayKey(log.date) >= recentFrom)
        .reduce((sum, log) => sum + log.feedKg, 0)
    : 0;
  const recentDailyFeedKg = recentFeedKg / 7;
  const biomassForRate = samplingBiomassKg ?? estimatedHarvestKg;

  const currentFeedCode =
    [...sortedLogs].reverse().find((log) => log.feedType && log.bags > 0)?.feedType?.code ?? null;

  return {
    stockedAt: stockedKey,
    daysOfCulture: stockedKey ? Math.max(daysBetween(stockedKey, today), 0) : null,
    cultureMonth: stockedMonth ? Math.max(monthsBetween(stockedMonth, today.slice(0, 7)), 0) : null,
    firstLogDate,
    lastLogDate,
    daysSinceLastLog: lastLogDate ? daysBetween(lastLogDate, today) : null,
    totals,
    latestSampling,
    daysSinceSampling: latestSampling ? daysBetween(latestSampling.date, today) : null,
    estimatedBiomassKg,
    estimatedHarvestKg,
    feedCostPerKg: estimatedHarvestKg > 0 ? totals.feedCostRm / estimatedHarvestKg : null,
    survivalRate: pond.stockedCount && alive !== null ? alive / pond.stockedCount : null,
    samplingBiomassKg,
    realizedFcr: samplingBiomassKg ? totals.feedKg / samplingBiomassKg : null,
    recentDailyFeedKg,
    feedingRatePercent:
      biomassForRate > 0 && recentDailyFeedKg > 0 ? (recentDailyFeedKg / biomassForRate) * 100 : null,
    currentFeedCode,
    months,
    feedTypes: [...typeMap.values()].sort((a, b) => a.firstDate.localeCompare(b.firstDate)),
  };
}
