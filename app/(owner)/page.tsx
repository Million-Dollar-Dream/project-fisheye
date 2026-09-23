import Link from "next/link";
import { dayKeyToDate, formatDay, formatMonth, relativeDays, todayKey } from "@/lib/dates";
import { formatAbw, formatBags, formatKg, formatNumber, formatRm } from "@/lib/format";
import { buildInsights, type Insight } from "@/lib/insights";
import { getOpenFindings, getPondsWithMetrics, getRecentActivity, getStockLevels } from "@/lib/queries";
import BarChart, { type BarDatum } from "../components/charts/BarChart";
import Sparkline from "../components/charts/Sparkline";
import {
  AlertIcon,
  ArrowRightIcon,
  ChartIcon,
  ChevronRightIcon,
  ClipboardIcon,
  CoinsIcon,
  FeedIcon,
  InfoIcon,
  ScaleIcon,
  SkullIcon,
  UploadIcon,
} from "../components/icons";
import { Badge, Card, CardHeader, EmptyState, Legend, PageHeader, StatCard, buttonClass, cx } from "../components/ui";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const today = todayKey();
  const [ponds, stock, batches, activity] = await Promise.all([
    getPondsWithMetrics(today),
    getStockLevels(today),
    getOpenFindings(),
    getRecentActivity(6),
  ]);

  const withData = ponds.filter((entry) => entry.metrics.lastLogDate);
  const findingsCount = batches.reduce(
    (sum, batch) => sum + batch.findings.filter((finding) => finding.severity === "warning").length,
    0,
  );
  const insights = buildInsights(ponds, stock.levels, findingsCount);

  const totals = withData.reduce(
    (sum, { metrics }) => ({
      harvestKg: sum.harvestKg + metrics.estimatedHarvestKg,
      feedKg: sum.feedKg + metrics.totals.feedKg,
      bags: sum.bags + metrics.totals.bags,
      costRm: sum.costRm + metrics.totals.feedCostRm,
      dead: sum.dead + metrics.totals.deadCount,
    }),
    { harvestKg: 0, feedKg: 0, bags: 0, costRm: 0, dead: 0 },
  );

  // Farm-wide monthly series, stacked by pond.
  const monthKeys = [...new Set(withData.flatMap(({ metrics }) => metrics.months.map((month) => month.monthKey)))].sort();
  const pondColor = (index: number) => `var(--series-${(index % 8) + 1})`;
  const monthly = monthKeys.map((monthKey) => {
    const rows = withData.map(({ pond, metrics }, index) => ({
      pond,
      color: pondColor(index),
      row: metrics.months.find((month) => month.monthKey === monthKey),
    }));
    return {
      monthKey,
      feedKg: rows.reduce((sum, entry) => sum + (entry.row?.feedKg ?? 0), 0),
      costRm: rows.reduce((sum, entry) => sum + (entry.row?.feedCostRm ?? 0), 0),
      dead: rows.reduce((sum, entry) => sum + (entry.row?.deadCount ?? 0), 0),
      pondDays: rows.reduce((sum, entry) => sum + (entry.row?.daysLogged ?? 0), 0),
      rows,
    };
  });
  const chartData: BarDatum[] = monthly.map((month) => ({
    key: month.monthKey,
    label: formatMonth(month.monthKey),
    segments: month.rows.map((entry) => ({
      name: entry.pond.name,
      value: entry.row?.feedKg ?? 0,
      color: entry.color,
    })),
    tooltip: {
      title: formatMonth(month.monthKey, "long"),
      lines: [
        ...month.rows
          .filter((entry) => entry.row)
          .map((entry) => ({ label: entry.pond.name, value: formatKg(entry.row!.feedKg, 0), color: entry.color })),
        { label: "Feed cost", value: formatRm(month.costRm, 0) },
        { label: "Dead fish", value: formatNumber(month.dead, 0) },
      ],
    },
  }));

  const latest = monthly.at(-1);
  const previous = monthly.at(-2);
  // Compare feed per logged pond-day so a month in progress isn't compared
  // against a full month.
  const dailyFeed = (month?: { feedKg: number; pondDays: number }) =>
    month && month.pondDays > 0 ? month.feedKg / month.pondDays : 0;
  const feedChange = latest && previous && dailyFeed(previous) > 0 ? dailyFeed(latest) / dailyFeed(previous) - 1 : null;
  const loggedToday = ponds.filter(({ logs }) => logs.some((log) => log.date.toISOString().slice(0, 10) === today)).length;
  const avgCostPerKg = totals.harvestKg > 0 ? totals.costRm / totals.harvestKg : null;

  return (
    <>
      <PageHeader
        eyebrow={formatDay(dayKeyToDate(today), { weekday: true })}
        title="Farm overview"
        description={`${ponds.length} ponds registered · ${withData.length} with records. Figures are for the current culture cycle.`}
        actions={
          <>
            <Link href="/import" className={buttonClass("secondary")}>
              <UploadIcon className="size-4" />
              Import sheet
            </Link>
            <Link href="/log" className={buttonClass("primary")}>
              <ClipboardIcon className="size-4" />
              Daily log
            </Link>
          </>
        }
      />

      <section aria-label="Key figures" className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          emphasis
          label="Est. standing stock"
          value={formatNumber(totals.harvestKg, 0)}
          unit="kg"
          icon={<ScaleIcon className="size-4" />}
          sub={`Feed ÷ FCR, less mortality · ${withData.length} ${withData.length === 1 ? "pond" : "ponds"}`}
        />
        <StatCard
          label="Feed cost this cycle"
          value={formatRm(totals.costRm, 0)}
          icon={<CoinsIcon className="size-4" />}
          sub={avgCostPerKg ? `${formatRm(avgCostPerKg)} feed per kg of fish` : undefined}
        />
        <StatCard
          label={latest ? `Feed used · ${formatMonth(latest.monthKey, "long")}` : "Feed used"}
          value={formatNumber(latest?.feedKg ?? 0, 0)}
          unit="kg"
          icon={<FeedIcon className="size-4" />}
          change={
            feedChange !== null && previous
              ? { value: feedChange, label: `daily avg vs ${formatMonth(previous.monthKey)}`, goodWhen: "up" }
              : null
          }
          sub={feedChange === null ? `${formatNumber(totals.feedKg, 0)} kg this cycle` : undefined}
        />
        <StatCard
          label="Mortality this cycle"
          value={formatNumber(totals.dead, 0)}
          unit="fish"
          icon={<SkullIcon className="size-4" />}
          sub={latest ? `${formatNumber(latest.dead, 0)} in ${formatMonth(latest.monthKey, "long")}` : undefined}
        />
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <Card className="flex h-full flex-col">
            <CardHeader
              icon={<ChartIcon className="size-4" />}
              title="Monthly feed"
              description="Feed consumed per month across the farm. Hover a bar for cost and mortality."
              action={
                withData.length > 1 ? (
                  <Legend items={withData.map(({ pond }, index) => ({ label: pond.name, color: pondColor(index) }))} />
                ) : undefined
              }
            />
            <div className="flex flex-1 flex-col px-3 pt-4 pb-4 sm:px-5">
              {chartData.length > 0 ? (
                <BarChart data={chartData} unit="kg" ariaLabel="Monthly feed consumed in kilograms" height={280} fill />
              ) : (
                <EmptyState
                  icon={<ChartIcon className="size-5" />}
                  title="No feed records yet"
                  description="Import a pond spreadsheet or start the daily log."
                />
              )}
            </div>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-ink">Today&apos;s logging</h2>
              <Badge tone={loggedToday === ponds.length && ponds.length > 0 ? "positive" : "neutral"}>
                {loggedToday}/{ponds.length} ponds
              </Badge>
            </div>
            <div className="mt-4 flex gap-1" aria-hidden="true">
              {ponds.map(({ pond, logs }) => {
                const done = logs.some((log) => log.date.toISOString().slice(0, 10) === today);
                return (
                  <span
                    key={pond.id}
                    title={`${pond.name}: ${done ? "logged" : "not logged"}`}
                    className={cx("h-2 flex-1 rounded-full", done ? "bg-positive" : "bg-surface-3")}
                  />
                );
              })}
            </div>
            <p className="mt-3 text-sm text-ink-3">
              {loggedToday === 0
                ? "No entries yet today. Workers log from the Daily log on their phones."
                : `${loggedToday} of ${ponds.length} ponds have today's feed and mortality recorded.`}
            </p>
          </Card>

          <Card>
            <CardHeader
              title="Needs attention"
              description={insights.length === 0 ? "Nothing needs attention." : undefined}
              action={insights.length > 0 ? <Badge>{insights.length}</Badge> : undefined}
            />
            <ul className="mt-3 divide-y divide-line">
              {insights.slice(0, 3).map((insight) => (
                <InsightRow key={insight.title} insight={insight} />
              ))}
            </ul>
            {insights.length === 0 && <div className="h-4" />}
          </Card>

        </aside>
      </div>

      <Card className="mt-6">
        <CardHeader title="Ponds" description="Current cycle performance for each pond." />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-y border-line bg-surface-2 text-left text-xs font-medium text-ink-3">
                <th className="px-5 py-2.5 font-medium">Pond</th>
                <th className="px-3 py-2.5 font-medium">Stage</th>
                <th className="px-3 py-2.5 text-right font-medium">Avg weight</th>
                <th className="px-3 py-2.5 text-right font-medium">Est. stock</th>
                <th className="px-3 py-2.5 text-right font-medium">Feed to date</th>
                <th className="px-3 py-2.5 text-right font-medium">Dead</th>
                <th className="px-3 py-2.5 font-medium">Daily feed, 60 days</th>
                <th className="px-3 py-2.5 font-medium">Last entry</th>
                <th className="w-10 px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {ponds.map(({ pond, metrics, logs }) => {
                const hasData = Boolean(metrics.lastLogDate);
                const recent = logs
                  .map((log) => ({ key: log.date.toISOString().slice(0, 10), kg: log.feedKg }))
                  .sort((a, b) => a.key.localeCompare(b.key))
                  .slice(-60)
                  .map((entry) => entry.kg);
                return (
                  <tr key={pond.id} className="group border-b border-line last:border-0 hover:bg-surface-2">
                    <td className="px-5 py-3">
                      <Link href={`/ponds/${pond.id}`} className="font-semibold text-ink hover:text-brand">
                        {pond.name}
                      </Link>
                      <p className="text-xs text-ink-3">{pond.species ?? (hasData ? "Species not set" : "Not stocked")}</p>
                    </td>
                    <td className="px-3 py-3">
                      {metrics.daysOfCulture !== null ? (
                        <>
                          <p className="font-medium tabular-nums text-ink">Day {metrics.daysOfCulture}</p>
                          <p className="text-xs text-ink-3">
                            {metrics.currentFeedCode ? `on ${metrics.currentFeedCode}` : `Month ${metrics.cultureMonth}`}
                          </p>
                        </>
                      ) : (
                        <span className="text-ink-3">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-ink">
                      {metrics.latestSampling ? formatAbw(metrics.latestSampling.avgWeightKg) : <span className="text-ink-3">—</span>}
                    </td>
                    <td className="px-3 py-3 text-right font-medium tabular-nums text-ink">
                      {hasData ? formatKg(metrics.estimatedHarvestKg, 0) : <span className="font-normal text-ink-3">—</span>}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-ink-2">
                      {hasData ? formatKg(metrics.totals.feedKg, 0) : <span className="text-ink-3">—</span>}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-ink-2">
                      {hasData ? formatNumber(metrics.totals.deadCount, 0) : <span className="text-ink-3">—</span>}
                    </td>
                    <td className="px-3 py-3">
                      {hasData ? (
                        <Sparkline values={recent} label={`${pond.name} daily feed trend`} />
                      ) : (
                        <span className="text-xs text-ink-3">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {metrics.lastLogDate ? (
                        <LastEntry dayKey={metrics.lastLogDate} today={today} />
                      ) : (
                        <Link href={`/import?pond=${pond.id}`} className="text-xs font-medium text-brand hover:underline">
                          Import history
                        </Link>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Link
                        href={`/ponds/${pond.id}`}
                        aria-label={`Open ${pond.name}`}
                        className="inline-flex size-7 items-center justify-center rounded-md text-ink-3 group-hover:text-ink"
                      >
                        <ChevronRightIcon className="size-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="mt-6">
        <CardHeader title="Recent entries" description="Latest records from the daily log." />
        {activity.length === 0 ? (
          <p className="px-5 pt-3 pb-5 text-sm text-ink-3">
            Entries made in the app appear here as soon as they&apos;re saved.
          </p>
        ) : (
          <ul className="mt-3 grid grid-cols-1 border-t border-line sm:grid-cols-2 xl:grid-cols-3">
            {activity.map((log) => (
              <li key={log.id} className="flex items-start justify-between gap-3 border-b border-line px-5 py-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-ink">
                    {log.pond.name}
                    <span className="font-normal text-ink-3"> · {formatDay(log.date, { year: false })}</span>
                  </p>
                  <p className="truncate text-ink-3">
                    {log.bags > 0 ? `${log.feedType?.code} ${formatBags(log.bags)}` : "No feeding"} · {log.deadCount} dead
                  </p>
                </div>
                <span className="shrink-0 text-xs text-ink-3">{log.recordedBy ?? "—"}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

function LastEntry({ dayKey, today }: { dayKey: string; today: string }) {
  const label = relativeDays(dayKey, today);
  const stale = dayKey < today && label !== "yesterday";
  return (
    <div>
      <p className={cx("font-medium", stale ? "text-warning" : "text-ink")}>{label.charAt(0).toUpperCase() + label.slice(1)}</p>
      <p className="text-xs text-ink-3">{formatDay(dayKeyToDate(dayKey))}</p>
    </div>
  );
}

function InsightRow({ insight }: { insight: Insight }) {
  const Icon = insight.severity === "info" ? InfoIcon : AlertIcon;
  const tone =
    insight.severity === "critical"
      ? "bg-danger-soft text-danger"
      : insight.severity === "warning"
        ? "bg-warning-soft text-warning"
        : "bg-info-soft text-info";
  const content = (
    <>
      <span className={cx("mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md", tone)}>
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-ink">{insight.title}</span>
        <span className="mt-0.5 block text-pretty text-xs leading-5 text-ink-3">{insight.detail}</span>
      </span>
      {insight.href && <ArrowRightIcon className="mt-1 size-4 shrink-0 text-ink-3" />}
    </>
  );
  return (
    <li>
      {insight.href ? (
        <Link href={insight.href} className="flex items-start gap-3 px-5 py-3.5 hover:bg-surface-2">
          {content}
        </Link>
      ) : (
        <div className="flex items-start gap-3 px-5 py-3.5">{content}</div>
      )}
    </li>
  );
}
