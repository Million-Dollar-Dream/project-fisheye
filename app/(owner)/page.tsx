import Link from "next/link";
import { daysInMonth, dateToDayKey, todayKey } from "@/lib/dates";
import { formatAbw, formatNumber, formatRm } from "@/lib/format";
import { estimateBoxes } from "@/lib/harvest";
import { MANY_PONDS, buildFarmGroups } from "@/lib/farmMap";
import { getI18n } from "@/lib/i18n/server";
import { getBoxKg } from "@/lib/settings";
import { getFarms, getMonthlyFeedCost, getPondsWithMetrics } from "@/lib/queries";
import { FarmMap, FarmSummaryGrid, HealthBadge } from "../components/harvest";
import { ArrowRightIcon, BoxIcon, HarvestIcon, MapIcon, ScaleIcon, SkullIcon } from "../components/icons";
import { Card, CardHeader, PageHeader, StatCard, buttonClass, cx } from "../components/ui";

export const dynamic = "force-dynamic";

// The ready banner shows this many ponds and links to the farm map for the rest.
const MAX_READY_CARDS = 6;

export default async function OverviewPage() {
  const today = todayKey();
  const i18n = await getI18n();
  const { t, fmt } = i18n;
  const [ponds, farms, boxKg, monthCost] = await Promise.all([
    getPondsWithMetrics(today),
    getFarms(),
    getBoxKg(),
    getMonthlyFeedCost(today),
  ]);

  const withData = ponds.filter((entry) => entry.metrics.lastLogDate);
  // Feed cost on the latest day anyone logged, across every pond.
  const latestDay = withData.map(({ metrics }) => metrics.lastLogDate!).sort().at(-1) ?? null;
  const daily = { dayKey: latestDay, costRm: 0, ponds: 0 };
  for (const { logs } of withData) {
    const cost = logs.filter((log) => dateToDayKey(log.date) === latestDay).reduce((sum, log) => sum + log.feedCostRm, 0);
    if (cost > 0) {
      daily.costRm += cost;
      daily.ponds += 1;
    }
  }
  const readyPonds = ponds.filter((entry) => entry.harvestability === "ready");
  const farmGroups = buildFarmGroups(ponds, farms, boxKg, t("farmMap.unassigned"));

  const nextHarvest = ponds
    .flatMap(({ pond, cycle }) => (cycle.state === "growing" || cycle.state === "ready" ? [{ pond, cycle }] : []))
    .sort((a, b) => a.cycle.plannedHarvestAt.localeCompare(b.cycle.plannedHarvestAt))[0];

  const totals = withData.reduce(
    (sum, { metrics }) => ({
      harvestKg: sum.harvestKg + metrics.estimatedHarvestKg,
      feedKg: sum.feedKg + metrics.totals.feedKg,
      costRm: sum.costRm + metrics.totals.feedCostRm,
      dead: sum.dead + metrics.totals.deadCount,
      harvestedKg: sum.harvestedKg + metrics.harvested.kg,
    }),
    { harvestKg: 0, feedKg: 0, costRm: 0, dead: 0, harvestedKg: 0 },
  );

  // This month so far against last month, compared per day so a month in
  // progress isn't set against a full one.
  const dayOfMonth = Number(today.slice(8, 10));
  const lastMonthDays = daysInMonth(monthCost.lastMonth.monthKey);
  const costChange =
    monthCost.lastMonth.costRm > 0 && dayOfMonth > 0
      ? monthCost.thisMonth.costRm / dayOfMonth / (monthCost.lastMonth.costRm / lastMonthDays) - 1
      : null;
  const thisMonthName = fmt.month(monthCost.thisMonth.monthKey, "long");
  const lastMonthName = fmt.month(monthCost.lastMonth.monthKey);

  return (
    <>
      <PageHeader
        eyebrow={fmt.dayKey(today, { weekday: true })}
        title={t("overview.title")}
        description={
          t("overview.description", { ponds: ponds.length, withData: withData.length }) +
          (nextHarvest
            ? nextHarvest.cycle.daysToHarvest > 0
              ? " " + t("overview.nextHarvest", { pond: nextHarvest.pond.name, n: nextHarvest.cycle.daysToHarvest })
              : " " + t("overview.pondReady", { pond: nextHarvest.pond.name })
            : "")
        }
      />

      <section aria-label={t("overview.keyFigures")} className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          emphasis
          label={t("overview.standingStock")}
          value={formatNumber(totals.harvestKg, 0)}
          unit="kg"
          icon={<ScaleIcon className="size-4" />}
          sub={t("overview.standingStockSub", { boxes: estimateBoxes(totals.harvestKg, boxKg), n: withData.length })}
        />
        <StatCard
          label={t("overview.feedCostDaily")}
          value={formatRm(daily.costRm, 0)}
          change={costChange !== null ? { value: costChange, label: t("overview.dailyVs", { month: lastMonthName }), goodWhen: "down" } : null}
          sub={daily.dayKey ? t("overview.dailyCostSub", { date: fmt.dayKey(daily.dayKey), n: daily.ponds }) : undefined}
          secondary={{
            label: t("overview.feedCostOverall"),
            value: formatRm(totals.costRm, 0),
            sub: t("overview.overallCostSub", { cost: formatRm(monthCost.thisMonth.costRm, 0), month: thisMonthName }),
          }}
        />
        <StatCard
          label={t("overview.deadCycle")}
          value={formatNumber(totals.dead, 0)}
          unit={t("unit.fish")}
          icon={<SkullIcon className="size-4" />}
          sub={totals.harvestedKg > 0 ? t("overview.harvestedCycle", { kg: formatNumber(totals.harvestedKg, 0) }) : undefined}
        />
      </section>

      {readyPonds.length > 0 && (
        <section
          aria-label={t("overview.readyTitle")}
          className="mb-6 rounded-lg border border-line border-l-4 bg-surface p-5 sm:p-6"
          style={{ borderLeftColor: "var(--stage-5)" }}
        >
          <div className="flex flex-wrap items-start gap-3">
            <HarvestIcon className="mt-1 size-6 shrink-0" style={{ color: "var(--stage-5)" }} />
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
                {t("overview.readyTitleCount", { n: readyPonds.length })}
              </h2>
              <p className="text-sm text-ink-2">{t("overview.readyDescription")}</p>
            </div>
          </div>
          <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {readyPonds.slice(0, MAX_READY_CARDS).map(({ pond, metrics, timing, health, cycle }) => (
              <li key={pond.id}>
                <Link
                  href={`/ponds/${pond.id}?view=cycle`}
                  className="flex h-full flex-col rounded-md border border-line bg-surface-2 p-4 hover:border-line-strong"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-lg font-semibold text-ink">{pond.name}</p>
                    {health && <HealthBadge level={health.level} />}
                  </div>
                  <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums text-ink">
                    ~{formatNumber(metrics.estimatedHarvestKg, 0)}
                    <span className="ml-1 text-base font-medium text-ink-3">kg</span>
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-2">
                    <BoxIcon className="size-4 text-ink-3" />
                    {t("overview.aboutBoxes", { n: estimateBoxes(metrics.estimatedHarvestKg, boxKg), kg: boxKg })}
                  </p>
                  <p className="mt-2 text-xs font-medium" style={{ color: "var(--stage-5)" }}>
                    {timing?.atTarget
                      ? t("overview.atTarget", { abw: formatAbw(timing.latestAbwKg ?? 0) })
                      : cycle.state === "ready" && cycle.daysToHarvest < 0
                        ? t("cycle.readyPast", { n: -cycle.daysToHarvest })
                        : t("cycle.harvestToday")}
                  </p>
                  <span className={cx(buttonClass("primary", "sm"), "mt-3 self-start")}>{t("overview.recordHarvest")}</span>
                </Link>
              </li>
            ))}
          </ul>
          {readyPonds.length > MAX_READY_CARDS && (
            <Link href="/farms" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">
              {t("overview.readyMore", { n: readyPonds.length - MAX_READY_CARDS })}
              <ArrowRightIcon className="size-4" />
            </Link>
          )}
        </section>
      )}

      {ponds.length > MANY_PONDS ? (
        <Card className="mb-6" as="section">
          <CardHeader
            title={t("farmMap.farmsTitle")}
            description={t("farmMap.farmsDescription")}
            action={
              <Link href="/farms" className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">
                {t("farmMap.open")}
                <ArrowRightIcon className="size-4" />
              </Link>
            }
          />
          <div className="p-5">
            <FarmSummaryGrid farms={farmGroups} />
          </div>
        </Card>
      ) : (
        <>
          <Card className="mb-6" as="section">
            <CardHeader
              icon={<MapIcon className="size-4" />}
              title={t("farmMap.title")}
              description={t("farmMap.overviewDescription")}
              action={
                <Link href="/farms" className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">
                  {t("farmMap.open")}
                  <ArrowRightIcon className="size-4" />
                </Link>
              }
            />
            <div className="p-5">
              <FarmMap farms={farmGroups} size="sm" />
            </div>
          </Card>
        </>
      )}
    </>
  );
}
