import type { ReactNode } from "react";
import { reopenLastCycle } from "@/app/actions/owner";
import ConfirmButton from "@/app/components/ConfirmButton";
import { FcrValue, harvestLabel } from "@/app/components/cycle";
import { CheckIcon, XIcon } from "@/app/components/icons";
import { Badge, Card, CardHeader, EmptyState, cx } from "@/app/components/ui";
import { addDays, dateToDayKey, daysBetween, formatDay } from "@/lib/dates";
import { formatKg, formatNumber, formatPercent, formatRm } from "@/lib/format";
import type { getPondDetail } from "@/lib/queries";
import { CloseCycleForm, StartCycleForm } from "./CycleForms";

type Detail = NonNullable<Awaited<ReturnType<typeof getPondDetail>>>;

export default function PondCycle({ detail, today, suggestion }: { detail: Detail; today: string; suggestion: string | null }) {
  const { pond, cycle, cycles, metrics } = detail;
  const running = cycle.state === "growing" || cycle.state === "ready";
  const lastEnd = cycles[0] ? dateToDayKey(cycles[0].endedAt) : null;

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="space-y-6">
        {running && (
          <CloseCycleForm
            pondId={pond.id}
            today={today}
            stockedAt={cycle.stockedAt}
            estimatedKg={metrics.samplingBiomassKg ?? metrics.estimatedHarvestKg}
            fishLeft={pond.stockedCount ? Math.max(pond.stockedCount - metrics.totals.deadCount, 0) : null}
            allDead={Boolean(pond.stockedCount && metrics.totals.deadCount >= pond.stockedCount)}
            feedKg={metrics.totals.feedKg}
            targetFcr={pond.assumedFcr}
          />
        )}
        {!running && (
          <>
            {cycle.state === "empty" && (
              <Card
                className={cx("flex items-start gap-3 p-5", cycle.lastOutcome === "lost" && "border-danger/30 bg-danger-soft")}
              >
                <span
                  className={cx(
                    "flex size-8 shrink-0 items-center justify-center rounded-full text-white",
                    cycle.lastOutcome === "lost" ? "bg-danger" : "bg-positive",
                  )}
                >
                  {cycle.lastOutcome === "lost" ? <XIcon className="size-4" strokeWidth={2.4} /> : <CheckIcon className="size-4" strokeWidth={2.4} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">
                    {cycle.lastOutcome === "lost" ? "Pond is empty after a total loss" : "Pond is empty after harvest"}
                  </p>
                  <p className="mt-0.5 text-sm text-ink-2">
                    {harvestLabel(cycle, today)} (since {formatDay(cycles[0].endedAt)}). Daily logs after this date count
                    toward the next cycle.
                  </p>
                </div>
                <ConfirmButton
                  action={reopenLastCycle}
                  fields={{ pondId: String(pond.id) }}
                  message={`Reopen cycle ${cycles[0].number}? Use this only if it was closed by mistake.`}
                  label="Reopen last cycle"
                  className="text-ink-2!"
                >
                  Undo close
                </ConfirmButton>
              </Card>
            )}
            <StartCycleForm
              pondId={pond.id}
              today={today}
              minDate={lastEnd ? addDays(lastEnd, 1) : null}
              suggestion={suggestion}
            />
          </>
        )}
      </div>

      <Card>
        <CardHeader title="Past cycles" description="Closed cycles for this pond, newest first." />
        {cycles.length === 0 ? (
          <EmptyState title="No closed cycles yet" description="When you record a harvest or a loss, the cycle's results are kept here." />
        ) : (
          <ul className="mt-3 divide-y divide-line border-t border-line">
            {cycles.map((past) => {
              const lost = past.outcome === "lost";
              const days = daysBetween(dateToDayKey(past.stockedAt), dateToDayKey(past.endedAt));
              const fcr = !lost && past.harvestKg ? past.feedKg / past.harvestKg : null;
              const survival =
                !lost && past.stockedCount && past.fishCount !== null ? past.fishCount / past.stockedCount : null;
              return (
                <li key={past.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-ink">Cycle {past.number}</p>
                    <Badge tone={lost ? "danger" : "positive"}>{lost ? `Lost · ${past.cause ?? "cause not given"}` : "Harvested"}</Badge>
                    <span className="text-xs text-ink-3">
                      {formatDay(past.stockedAt)} – {formatDay(past.endedAt)} · {days} days
                    </span>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
                    {lost ? (
                      <>
                        <Stat label="Harvest" value="0 kg" danger />
                        <Stat label="Feed used" value={formatKg(past.feedKg, 0)} />
                        <Stat label="Feed cost" value={formatRm(past.feedCostRm, 0)} sub="Written off" />
                        <Stat
                          label="Fish lost"
                          value={formatNumber(past.deadCount + (past.fishCount ?? 0), 0)}
                          sub={past.stockedCount ? `of ${formatNumber(past.stockedCount, 0)} stocked` : undefined}
                        />
                      </>
                    ) : (
                      <>
                        <Stat
                          label="Harvested"
                          value={formatKg(past.harvestKg ?? 0, 0)}
                          sub={survival !== null ? `${formatPercent(survival)} survival` : `${formatNumber(past.deadCount, 0)} dead`}
                        />
                        <Stat label="Feed used" value={formatKg(past.feedKg, 0)} sub={formatRm(past.feedCostRm, 0)} />
                        <Stat label="FCR" value={<FcrValue fcr={fcr} target={pond.assumedFcr} />} sub={`target ${pond.assumedFcr}`} />
                        <Stat
                          label="Feed cost per kg"
                          value={past.harvestKg ? formatRm(past.feedCostRm / past.harvestKg) : "—"}
                        />
                      </>
                    )}
                  </dl>
                  {past.note && <p className="mt-2 text-sm text-ink-3">{past.note}</p>}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Stat({ label, value, sub, danger }: { label: string; value: ReactNode; sub?: string; danger?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-ink-3">{label}</dt>
      <dd className={cx("font-medium tabular-nums", danger ? "text-danger" : "text-ink")}>{value}</dd>
      {sub && <dd className="text-xs text-ink-3">{sub}</dd>}
    </div>
  );
}
