import { addDays, dateToDayKey, dayKeyToDate, daysBetween, formatDay, formatMonth } from "./dates";
import { LOW_STOCK_DAYS, type StockLevel } from "./inventory";
import type { PondWithMetrics } from "./queries";
import { formatNumber } from "./format";
import { fcrRating, harvestForecast, supplyGaps } from "./cycle";

export type Insight = {
  severity: "critical" | "warning" | "info";
  title: string;
  detail: string;
  href?: string;
};

const SAMPLING_INTERVAL_DAYS = 30;
const HARVEST_NOTICE_DAYS = 14;
const EMPTY_NOTICE_DAYS = 30;

// Rule-based checks an owner would otherwise do by scanning the sheet.
export function buildInsights(
  ponds: PondWithMetrics[],
  stock: StockLevel[],
  findingsCount: number,
  today: string,
): Insight[] {
  const insights: Insight[] = [];

  for (const { pond, metrics, logs, cycle } of ponds) {
    const href = `/ponds/${pond.id}`;
    const cycleHref = `/ponds/${pond.id}?view=cycle`;

    if (cycle.state === "empty") {
      const days = daysBetween(cycle.since, today);
      if (days >= EMPTY_NOTICE_DAYS) {
        insights.push({
          severity: "info",
          title: `${pond.name}: empty for ${days} days`,
          detail: `Last cycle ${cycle.lastOutcome === "lost" ? "was lost" : "was harvested"} ${formatDay(dayKeyToDate(cycle.since))}. Restock to keep supply going.`,
          href: cycleHref,
        });
      }
      continue;
    }

    // Recorded deaths reaching the stocked count means nothing is left.
    if (pond.stockedCount && metrics.totals.deadCount >= pond.stockedCount) {
      insights.push({
        severity: "critical",
        title: `${pond.name}: all stocked fish recorded dead`,
        detail: `${formatNumber(metrics.totals.deadCount, 0)} dead of ${formatNumber(pond.stockedCount, 0)} stocked. Close the cycle as a loss so estimates and the harvest plan stop counting this pond.`,
        href: cycleHref,
      });
    } else if (pond.stockedCount && metrics.totals.deadCount >= pond.stockedCount / 2) {
      insights.push({
        severity: "warning",
        title: `${pond.name}: over half the stock recorded dead`,
        detail: `${formatNumber(metrics.totals.deadCount, 0)} of ${formatNumber(pond.stockedCount, 0)} fish. If the pond is wiped out, close the cycle as a loss.`,
        href: cycleHref,
      });
    }

    if (metrics.realizedFcr !== null && fcrRating(metrics.realizedFcr, pond.assumedFcr) === "high") {
      insights.push({
        severity: "warning",
        title: `${pond.name}: FCR ${metrics.realizedFcr.toFixed(2)}, above target ${pond.assumedFcr}`,
        detail: `${formatNumber(metrics.totals.feedKg, 0)} kg of feed for about ${formatNumber(metrics.samplingBiomassKg ?? 0, 0)} kg of fish. Check for overfeeding, uneaten feed or unrecorded deaths, and reweigh a sample.`,
        href,
      });
    }

    if (cycle.state === "ready") {
      insights.push({
        severity: "warning",
        title: `${pond.name}: ready to harvest`,
        detail:
          cycle.daysToHarvest === 0
            ? "Planned harvest is today. Record the harvest when it's done."
            : `${-cycle.daysToHarvest} days past the planned harvest (${formatDay(dayKeyToDate(cycle.plannedHarvestAt))}). Record the harvest when it's done.`,
        href: cycleHref,
      });
    } else if (cycle.state === "growing" && cycle.daysToHarvest <= HARVEST_NOTICE_DAYS) {
      insights.push({
        severity: "info",
        title: `${pond.name}: harvest in ${cycle.daysToHarvest} days`,
        detail: `Planned for ${formatDay(dayKeyToDate(cycle.plannedHarvestAt))}. Line up buyers and labour.`,
        href: cycleHref,
      });
    }

    if (metrics.lastLogDate && metrics.daysSinceLastLog !== null && metrics.daysSinceLastLog > 1) {
      insights.push({
        severity: metrics.daysSinceLastLog > 3 ? "critical" : "warning",
        title: `${pond.name}: no entries for ${metrics.daysSinceLastLog} days`,
        detail: `Last record was ${formatDay(dayKeyToDate(metrics.lastLogDate))}. Feed and mortality since then are unrecorded.`,
        href: "/log",
      });
    }

    if (
      metrics.lastLogDate &&
      metrics.daysSinceSampling !== null &&
      metrics.daysSinceSampling > SAMPLING_INTERVAL_DAYS - 5
    ) {
      insights.push({
        severity: "warning",
        title: `${pond.name}: sampling due`,
        detail: `Fish were last weighed ${formatDay(dayKeyToDate(metrics.latestSampling!.date))} (${metrics.daysSinceSampling} days ago). Weigh a sample to keep growth and harvest estimates current.`,
        href: `/log/${pond.id}`,
      });
    }

    const spike = findMortalitySpike(logs);
    if (spike) {
      insights.push({
        severity: "critical",
        title: `${pond.name}: mortality spike on ${formatDay(dayKeyToDate(spike.date), { year: false })}`,
        detail: `${spike.count} dead fish against a usual ${formatNumber(spike.baseline, 1)} a day. Check water quality and feeding response.`,
        href,
      });
    }

    if (metrics.lastLogDate && !pond.stockedCount) {
      insights.push({
        severity: "info",
        title: `${pond.name}: stocking count missing`,
        detail: "Add the number of fingerlings stocked to unlock survival rate and actual FCR from sampling.",
        href: `/ponds/${pond.id}?view=settings`,
      });
    }
  }

  for (const level of stock) {
    if (!level.feedType.active || level.avgDailyBags === 0) continue;
    if (level.onHandBags === null) {
      insights.push({
        severity: "info",
        title: `${level.feedType.code}: no stocktake recorded`,
        detail: `In use at ${formatNumber(level.avgDailyBags, 1)} bags a day. Count the store once to start tracking days of stock left.`,
        href: "/inventory",
      });
    } else if (level.daysOfCover !== null && level.daysOfCover < LOW_STOCK_DAYS) {
      insights.push({
        severity: level.daysOfCover < 3 ? "critical" : "warning",
        title: `${level.feedType.code}: about ${formatNumber(level.daysOfCover, 0)} days of feed left`,
        detail: `${formatNumber(Math.max(level.onHandBags, 0), 1)} bags on hand at ${formatNumber(level.avgDailyBags, 1)} bags a day. Plan the next order.`,
        href: "/inventory",
      });
    }
  }

  const gaps = supplyGaps(harvestForecast(ponds, today));
  if (gaps.length > 0) {
    insights.push({
      severity: "warning",
      title: `No harvest planned in ${gaps.length} ${gaps.length === 1 ? "month" : "months"}`,
      detail: `${gaps.map((month) => formatMonth(month.monthKey, "long")).join(", ")}. Stagger the next stocking to keep fish available all year.`,
      href: "/#cycles",
    });
  }

  if (findingsCount > 0) {
    insights.push({
      severity: "info",
      title: `${findingsCount} spreadsheet ${findingsCount === 1 ? "issue" : "issues"} found on import`,
      detail: "Totals that did not match the daily rows were recalculated. Review what changed.",
      href: ponds.find((entry) => entry.metrics.lastLogDate)
        ? `/ponds/${ponds.find((entry) => entry.metrics.lastLogDate)!.pond.id}?view=data`
        : "/import",
    });
  }

  const order = { critical: 0, warning: 1, info: 2 };
  return insights.sort((a, b) => order[a.severity] - order[b.severity]);
}

// Highest single-day count in the last 7 days of records that is at least 3
// fish and 3x the daily average of the 28 days before it.
function findMortalitySpike(logs: { date: Date; deadCount: number }[]) {
  if (logs.length === 0) return null;
  const sorted = [...logs].sort((a, b) => a.date.getTime() - b.date.getTime());
  const last = dateToDayKey(sorted.at(-1)!.date);
  const recentFrom = addDays(last, -6);
  const baselineFrom = addDays(recentFrom, -28);

  const recent = sorted.filter((log) => dateToDayKey(log.date) >= recentFrom);
  const baselineTotal = sorted
    .filter((log) => {
      const key = dateToDayKey(log.date);
      return key >= baselineFrom && key < recentFrom;
    })
    .reduce((sum, log) => sum + log.deadCount, 0);
  const baseline = baselineTotal / 28;

  const worst = recent.reduce((max, log) => (log.deadCount > max.deadCount ? log : max), recent[0]);
  if (!worst || worst.deadCount < 3 || worst.deadCount < baseline * 3) return null;
  return { date: dateToDayKey(worst.date), count: worst.deadCount, baseline };
}
