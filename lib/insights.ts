import { addDays, dateToDayKey, formatDay, dayKeyToDate } from "./dates";
import { LOW_STOCK_DAYS, type StockLevel } from "./inventory";
import type { PondWithMetrics } from "./queries";
import { formatNumber } from "./format";

export type Insight = {
  severity: "critical" | "warning" | "info";
  title: string;
  detail: string;
  href?: string;
};

const SAMPLING_INTERVAL_DAYS = 30;

// Rule-based checks an owner would otherwise do by scanning the sheet.
export function buildInsights(
  ponds: PondWithMetrics[],
  stock: StockLevel[],
  findingsCount: number,
): Insight[] {
  const insights: Insight[] = [];

  for (const { pond, metrics, logs } of ponds) {
    const href = `/ponds/${pond.id}`;

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
