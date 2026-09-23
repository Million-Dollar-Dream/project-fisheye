import Link from "next/link";
import type { getFeedTypes, getPondDetail } from "@/lib/queries";
import { addDays, dateToDayKey, dayKeyToDate, formatDay, formatMonth } from "@/lib/dates";
import { formatAbw, formatBags, formatKg, formatNumber, formatPercent, formatRm } from "@/lib/format";
import BarChart, { type BarDatum } from "@/app/components/charts/BarChart";
import LineChart, { type LinePoint } from "@/app/components/charts/LineChart";
import {
  ChartIcon,
  CoinsIcon,
  FeedIcon,
  FishIcon,
  InfoIcon,
  ScaleIcon,
  SkullIcon,
  SparkleIcon,
} from "@/app/components/icons";
import { Card, CardHeader, EmptyState, Legend, StatCard, feedColor } from "@/app/components/ui";

type Detail = NonNullable<Awaited<ReturnType<typeof getPondDetail>>>;
type FeedTypes = Awaited<ReturnType<typeof getFeedTypes>>;

export default function PondOverview({ detail, feedTypes }: { detail: Detail; feedTypes: FeedTypes }) {
  const { pond, logs, samplings, metrics } = detail;
  const feedTypeByCode = new Map(feedTypes.map((feedType) => [feedType.code, feedType]));

  if (!metrics.lastLogDate) {
    return (
      <Card>
        <EmptyState
          icon={<ChartIcon className="size-5" />}
          title={`No records for ${pond.name} yet`}
          description="Import this pond's spreadsheet to bring its history in, or start logging today from the Daily log."
          action={
            <Link href={`/import?pond=${pond.id}`} className="text-sm font-semibold text-brand hover:underline">
              Import spreadsheet
            </Link>
          }
        />
      </Card>
    );
  }

  // Daily feed across the whole cycle, one bar per calendar day.
  const logByDay = new Map(logs.map((log) => [dateToDayKey(log.date), log]));
  const daily: BarDatum[] = [];
  for (let day = metrics.firstLogDate!; day <= metrics.lastLogDate; day = addDays(day, 1)) {
    const log = logByDay.get(day);
    const date = dayKeyToDate(day);
    daily.push({
      key: day,
      label: day.endsWith("-01") ? formatMonth(day.slice(0, 7)) : "",
      segments: [
        {
          name: log?.feedType?.code ?? "none",
          value: log?.feedKg ?? 0,
          color: feedColor(log?.feedTypeId),
        },
      ],
      tooltip: {
        title: formatDay(date, { weekday: true }),
        lines: log
          ? [
              {
                label: log.feedType?.code ?? "No feeding",
                value: log.bags > 0 ? `${formatBags(log.bags)} · ${formatKg(log.feedKg, 0)}` : "—",
                color: log.feedType ? feedColor(log.feedTypeId) : undefined,
              },
              { label: "Dead fish", value: formatNumber(log.deadCount, 0) },
              ...(log.note ? [{ label: "Note", value: log.note.slice(0, 40) }] : []),
            ]
          : [{ label: "Not recorded", value: "" }],
      },
    });
  }

  const growth: LinePoint[] = samplings.map((sampling) => ({
    key: String(sampling.id),
    label: formatDay(sampling.date, { year: false }),
    value: sampling.avgWeightKg * 1000,
    tooltip: {
      title: formatDay(sampling.date),
      lines: [
        { label: "Average weight", value: formatAbw(sampling.avgWeightKg) },
        ...(sampling.sampleSize ? [{ label: "Fish weighed", value: String(sampling.sampleSize) }] : []),
      ],
    },
  }));

  const mortality: BarDatum[] = metrics.months.map((month) => ({
    key: month.monthKey,
    label: formatMonth(month.monthKey),
    segments: [{ name: "Dead", value: month.deadCount, color: "var(--danger)" }],
    tooltip: {
      title: formatMonth(month.monthKey, "long"),
      lines: [
        { label: "Dead fish", value: formatNumber(month.deadCount, 0) },
        { label: "Weight lost", value: formatKg(month.deadKg, 2) },
      ],
    },
  }));

  const latestMonth = metrics.months.at(-1);
  const previousMonth = metrics.months.at(-2);
  const lastSampleDays = metrics.daysSinceSampling;

  return (
    <div className="space-y-6">
      <section aria-label="Key figures" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          emphasis
          label="Est. harvestable weight"
          value={formatNumber(metrics.estimatedHarvestKg, 0)}
          unit="kg"
          icon={<ScaleIcon className="size-4" />}
          sub={`${formatNumber(metrics.totals.feedKg, 0)} kg feed ÷ FCR ${pond.assumedFcr} − ${formatKg(metrics.totals.deadKg, 1)} mortality`}
        />
        <StatCard
          label="Average body weight"
          value={metrics.latestSampling ? formatAbw(metrics.latestSampling.avgWeightKg) : "—"}
          icon={<FishIcon className="size-4" />}
          sub={
            metrics.latestSampling
              ? `Sampled ${formatDay(dayKeyToDate(metrics.latestSampling.date))}${lastSampleDays !== null ? ` · ${lastSampleDays}d ago` : ""}`
              : "No sampling yet"
          }
        />
        <StatCard
          label="Feed to date"
          value={formatNumber(metrics.totals.feedKg, 0)}
          unit="kg"
          icon={<FeedIcon className="size-4" />}
          sub={`${formatBags(metrics.totals.bags)} over ${metrics.totals.daysLogged} logged days`}
        />
        <StatCard
          label="Feed cost to date"
          value={formatRm(metrics.totals.feedCostRm, 0)}
          icon={<CoinsIcon className="size-4" />}
          sub={metrics.feedCostPerKg ? `${formatRm(metrics.feedCostPerKg)} per kg of fish` : undefined}
        />
        <StatCard
          label="Mortality to date"
          value={formatNumber(metrics.totals.deadCount, 0)}
          unit="fish"
          icon={<SkullIcon className="size-4" />}
          sub={
            metrics.survivalRate !== null
              ? `${formatPercent(metrics.survivalRate)} survival · ${formatKg(metrics.totals.deadKg, 1)} lost`
              : `${formatKg(metrics.totals.deadKg, 1)} biomass lost`
          }
        />
        <StatCard
          label={latestMonth ? `Feed · ${formatMonth(latestMonth.monthKey, "long")}` : "Feed this month"}
          value={formatNumber(latestMonth?.feedKg ?? 0, 0)}
          unit="kg"
          icon={<ChartIcon className="size-4" />}
          change={
            latestMonth && previousMonth && previousMonth.feedKg > 0
              ? {
                  // Per logged day, so a month in progress compares fairly.
                  value:
                    latestMonth.feedKg / latestMonth.daysLogged / (previousMonth.feedKg / previousMonth.daysLogged) - 1,
                  label: `daily avg vs ${formatMonth(previousMonth.monthKey)}`,
                  goodWhen: "up",
                }
              : null
          }
        />
      </section>

      {!pond.stockedCount && (
        <div className="flex items-start gap-3 rounded-xl border border-info/20 bg-info-soft px-4 py-3 text-sm text-info">
          <InfoIcon className="mt-0.5 size-4 shrink-0" />
          <p className="text-pretty">
            Harvest weight is estimated the same way as the spreadsheet: feed consumed ÷ an assumed FCR of{" "}
            {pond.assumedFcr}. Add the number of fish stocked in{" "}
            <Link href={`/ponds/${pond.id}?view=settings`} className="font-semibold underline underline-offset-2">
              pond settings
            </Link>{" "}
            to also get survival rate, biomass from sampling and the actual FCR.
          </p>
        </div>
      )}

      {metrics.realizedFcr !== null && metrics.samplingBiomassKg !== null && (
        <Card className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
          <Figure label="Biomass from sampling" value={formatKg(metrics.samplingBiomassKg, 0)} detail="Live fish × latest average weight" />
          <Figure label="Actual FCR" value={formatNumber(metrics.realizedFcr, 2)} detail={`Assumed ${pond.assumedFcr}`} />
          <Figure
            label="Survival"
            value={metrics.survivalRate !== null ? formatPercent(metrics.survivalRate) : "—"}
            detail={`${formatNumber(pond.stockedCount ?? 0, 0)} stocked`}
          />
        </Card>
      )}

      <Card>
        <CardHeader
          icon={<FeedIcon className="size-4" />}
          title="Daily feed"
          description={`Kilograms fed each day, coloured by feed type · ${formatDay(dayKeyToDate(metrics.firstLogDate!))} to ${formatDay(dayKeyToDate(metrics.lastLogDate))}`}
        />
        <div className="px-5 pt-3">
          <Legend
            items={metrics.feedTypes.map((usage) => ({
              label: usage.code,
              color: feedColor(feedTypeByCode.get(usage.code)?.id),
            }))}
          />
        </div>
        <div className="px-3 pt-3 pb-4 sm:px-5">
          <BarChart data={daily} unit="kg" height={250} minLabelSpacing={1} ariaLabel={`${pond.name} daily feed in kilograms`} />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            icon={<FishIcon className="size-4" />}
            title="Growth"
            description="Average body weight from monthly sampling (grams)."
          />
          <div className="px-3 pt-4 pb-4 sm:px-5">
            {growth.length > 0 ? (
              <LineChart points={growth} unit="g" ariaLabel={`${pond.name} average body weight in grams`} height={220} />
            ) : (
              <p className="py-16 text-center text-sm text-ink-3">No samples recorded yet.</p>
            )}
          </div>
        </Card>
        <Card>
          <CardHeader
            icon={<SkullIcon className="size-4" />}
            title="Mortality by month"
            description="Dead fish counted in the daily log."
          />
          <div className="px-3 pt-4 pb-4 sm:px-5">
            <BarChart data={mortality} unit="fish" ariaLabel={`${pond.name} monthly mortality`} height={220} />
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Monthly performance"
          description="The spreadsheet's summary, recalculated from the daily records."
        />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm tabular-nums">
            <thead>
              <tr className="border-y border-line bg-surface-2 text-right text-xs font-medium text-ink-3">
                <th className="px-5 py-2.5 text-left font-medium">Month</th>
                <th className="px-3 py-2.5 font-medium">Days logged</th>
                <th className="px-3 py-2.5 font-medium">Bags</th>
                <th className="px-3 py-2.5 font-medium">Feed (kg)</th>
                <th className="px-3 py-2.5 font-medium">Feed cost</th>
                <th className="px-3 py-2.5 font-medium">Dead fish</th>
                <th className="px-3 py-2.5 font-medium">Avg weight</th>
                <th className="px-3 py-2.5 font-medium">Mortality (kg)</th>
                <th className="px-3 py-2.5 font-medium">Cum. feed (kg)</th>
                <th className="px-5 py-2.5 font-medium">Est. stock (kg)</th>
              </tr>
            </thead>
            <tbody>
              {metrics.months.map((month) => (
                <tr key={month.monthKey} className="border-b border-line text-right text-ink-2 hover:bg-surface-2">
                  <td className="px-5 py-2.5 text-left">
                    <Link
                      href={`/ponds/${pond.id}?view=records&month=${month.monthKey}`}
                      className="font-medium text-ink hover:text-brand"
                    >
                      {formatMonth(month.monthKey, "long")}
                    </Link>
                    {month.cultureMonth !== null && <span className="ml-2 text-xs text-ink-3">M{month.cultureMonth}</span>}
                  </td>
                  <td className="px-3 py-2.5">{month.daysLogged}</td>
                  <td className="px-3 py-2.5">{formatNumber(month.bags, 1)}</td>
                  <td className="px-3 py-2.5 text-ink">{formatNumber(month.feedKg, 0)}</td>
                  <td className="px-3 py-2.5">{formatRm(month.feedCostRm)}</td>
                  <td className="px-3 py-2.5">{month.deadCount}</td>
                  <td className="px-3 py-2.5">{month.avgWeightKg !== null ? formatAbw(month.avgWeightKg) : "—"}</td>
                  <td className="px-3 py-2.5">{formatNumber(month.deadKg, 2)}</td>
                  <td className="px-3 py-2.5">{formatNumber(month.cumulativeFeedKg, 0)}</td>
                  <td className="px-5 py-2.5 font-medium text-ink">{formatNumber(month.estimatedBiomassKg, 0)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-surface-2 text-right font-semibold text-ink">
                <td className="px-5 py-3 text-left">Cycle total</td>
                <td className="px-3 py-3">{metrics.totals.daysLogged}</td>
                <td className="px-3 py-3">{formatNumber(metrics.totals.bags, 1)}</td>
                <td className="px-3 py-3">{formatNumber(metrics.totals.feedKg, 0)}</td>
                <td className="px-3 py-3">{formatRm(metrics.totals.feedCostRm)}</td>
                <td className="px-3 py-3">{metrics.totals.deadCount}</td>
                <td className="px-3 py-3">{metrics.latestSampling ? formatAbw(metrics.latestSampling.avgWeightKg) : "—"}</td>
                <td className="px-3 py-3">{formatNumber(metrics.totals.deadKg, 2)}</td>
                <td className="px-3 py-3">{formatNumber(metrics.totals.feedKg, 0)}</td>
                <td className="px-5 py-3">{formatNumber(metrics.estimatedHarvestKg, 0)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardHeader title="Feed programme" description="Each feed type used this cycle, in the order it was introduced." />
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm tabular-nums">
              <thead>
                <tr className="border-y border-line bg-surface-2 text-right text-xs font-medium text-ink-3">
                  <th className="px-5 py-2.5 text-left font-medium">Feed type</th>
                  <th className="px-3 py-2.5 text-left font-medium">Period</th>
                  <th className="px-3 py-2.5 font-medium">Bags</th>
                  <th className="px-3 py-2.5 font-medium">Feed (kg)</th>
                  <th className="px-3 py-2.5 font-medium">Cost</th>
                  <th className="px-5 py-2.5 font-medium">Share</th>
                </tr>
              </thead>
              <tbody>
                {metrics.feedTypes.map((usage) => (
                  <tr key={usage.code} className="border-b border-line text-right text-ink-2 last:border-0">
                    <td className="px-5 py-2.5 text-left">
                      <span className="inline-flex items-center gap-2 font-medium text-ink">
                        <span
                          className="size-2.5 rounded-[3px]"
                          style={{ background: feedColor(feedTypeByCode.get(usage.code)?.id) }}
                        />
                        {usage.code}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-left whitespace-nowrap">
                      {formatDay(dayKeyToDate(usage.firstDate), { year: false })} –{" "}
                      {formatDay(dayKeyToDate(usage.lastDate), { year: false })}
                    </td>
                    <td className="px-3 py-2.5">{formatNumber(usage.bags, 1)}</td>
                    <td className="px-3 py-2.5">{formatNumber(usage.feedKg, 0)}</td>
                    <td className="px-3 py-2.5">{formatRm(usage.feedCostRm)}</td>
                    <td className="px-5 py-2.5">
                      {formatPercent(metrics.totals.feedKg > 0 ? usage.feedKg / metrics.totals.feedKg : 0, 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-brand-soft text-brand">
              <SparkleIcon className="size-4" />
            </span>
            <h2 className="text-[15px] font-semibold text-ink">Feeding level</h2>
          </div>
          <dl className="mt-4 space-y-3 text-sm">
            <Row
              label="Average daily feed"
              value={formatKg(metrics.recentDailyFeedKg, 1)}
              detail={`7 days to ${formatDay(dayKeyToDate(metrics.lastLogDate), { year: false })}`}
            />
            <Row
              label="Feeding rate"
              value={metrics.feedingRatePercent !== null ? `${formatNumber(metrics.feedingRatePercent, 2)}% BW/day` : "—"}
              detail="Daily feed ÷ estimated stock"
            />
            <Row label="Current feed" value={metrics.currentFeedCode ?? "—"} />
          </dl>
          <p className="mt-4 rounded-lg bg-surface-2 p-3 text-pretty text-xs leading-5 text-ink-3">
            Next phase: feed recommendations learned from this pond&apos;s feeding, growth and mortality history. They
            need a few more months of daily records and regular sampling.
          </p>
        </Card>
      </div>
    </div>
  );
}

function Figure({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div>
      <p className="text-sm text-ink-3">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-ink">{value}</p>
      <p className="text-xs text-ink-3">{detail}</p>
    </div>
  );
}

function Row({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-ink-2">
        {label}
        {detail && <span className="block text-xs text-ink-3">{detail}</span>}
      </dt>
      <dd className="font-semibold tabular-nums text-ink">{value}</dd>
    </div>
  );
}
