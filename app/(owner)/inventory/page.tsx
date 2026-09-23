import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getStockLevels } from "@/lib/queries";
import { dayKeyToDate, formatDay, todayKey } from "@/lib/dates";
import { formatKg, formatNumber, formatRm } from "@/lib/format";
import { LOW_STOCK_DAYS, USAGE_WINDOW_DAYS } from "@/lib/inventory";
import { deleteStockMovement } from "@/app/actions/owner";
import ConfirmButton from "@/app/components/ConfirmButton";
import { PackageIcon } from "@/app/components/icons";
import { Badge, Card, CardHeader, EmptyState, PageHeader, cx, feedColor } from "@/app/components/ui";
import StockMovementForm from "./StockMovementForm";

export const metadata: Metadata = { title: "Feed stock" };
export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const today = todayKey();
  const [{ levels, horizon }, movements] = await Promise.all([
    getStockLevels(today),
    prisma.stockMovement.findMany({
      orderBy: [{ date: "desc" }, { id: "desc" }],
      take: 30,
      include: { feedType: { select: { code: true } } },
    }),
  ]);

  const tracked = levels.filter((level) => level.onHandBags !== null);
  const stockValue = tracked.reduce(
    (sum, level) => sum + Math.max(level.onHandBags ?? 0, 0) * level.feedType.packSizeKg * level.feedType.pricePerKg,
    0,
  );
  const inUse = levels.filter((level) => level.avgDailyBags > 0 || level.onHandBags !== null);
  const idle = levels.filter((level) => !inUse.includes(level));

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Feed stock"
        description={`Stock on hand = last stocktake + deliveries − bags logged since. Usage is the average over the ${USAGE_WINDOW_DAYS} days to ${formatDay(dayKeyToDate(horizon))}.`}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader
              icon={<PackageIcon className="size-4" />}
              title="Stock by feed type"
              description={
                tracked.length > 0
                  ? `${tracked.length} of ${levels.length} types counted · ${formatRm(stockValue, 0)} on hand`
                  : "Record a stocktake to start tracking what's in the store."
              }
            />
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm tabular-nums">
                <thead>
                  <tr className="border-y border-line bg-surface-2 text-right text-xs font-medium text-ink-3">
                    <th className="px-5 py-2.5 text-left font-medium">Feed type</th>
                    <th className="px-3 py-2.5 font-medium">On hand</th>
                    <th className="px-3 py-2.5 font-medium">Use / day</th>
                    <th className="px-3 py-2.5 text-left font-medium">Days of cover</th>
                    <th className="px-5 py-2.5 text-left font-medium">Last stocktake</th>
                  </tr>
                </thead>
                <tbody>
                  {[...inUse, ...idle].map((level) => {
                    const cover = level.daysOfCover;
                    const tone = cover === null ? null : cover < 3 ? "danger" : cover < LOW_STOCK_DAYS ? "warning" : "positive";
                    return (
                      <tr
                        key={level.feedType.id}
                        className={cx("border-b border-line text-right last:border-0", !level.feedType.active && "opacity-60")}
                      >
                        <td className="px-5 py-3 text-left">
                          <span className="inline-flex items-center gap-2 font-semibold text-ink">
                            <span className="size-2.5 rounded-[3px]" style={{ background: feedColor(level.feedType.id) }} />
                            {level.feedType.code}
                          </span>
                          <span className="block text-xs text-ink-3">{level.feedType.packSizeKg} kg bags</span>
                        </td>
                        <td className="px-3 py-3">
                          {level.onHandBags !== null ? (
                            <>
                              <span className={cx("font-semibold", level.onHandBags < 0 ? "text-danger" : "text-ink")}>
                                {formatNumber(level.onHandBags, 1)} bags
                              </span>
                              <span className="block text-xs text-ink-3">
                                {formatKg(Math.max(level.onHandBags, 0) * level.feedType.packSizeKg, 0)}
                              </span>
                            </>
                          ) : (
                            <span className="text-ink-3">Not counted</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-ink-2">
                          {level.avgDailyBags > 0 ? `${formatNumber(level.avgDailyBags, 2)} bags` : "—"}
                        </td>
                        <td className="px-3 py-3 text-left">
                          {cover !== null && tone ? (
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-surface-3">
                                <div
                                  className={cx(
                                    "h-full rounded-full",
                                    tone === "danger" ? "bg-danger" : tone === "warning" ? "bg-warning" : "bg-positive",
                                  )}
                                  style={{ width: `${Math.min(cover / 30, 1) * 100}%` }}
                                />
                              </div>
                              <span className="font-medium text-ink">{formatNumber(cover, 0)} days</span>
                            </div>
                          ) : level.onHandBags !== null ? (
                            <span className="text-ink-3">Not in use</span>
                          ) : level.avgDailyBags > 0 ? (
                            <Badge tone="info">Count needed</Badge>
                          ) : (
                            <span className="text-ink-3">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-left text-ink-2">
                          {level.lastCount ? (
                            <>
                              {formatDay(dayKeyToDate(level.lastCount.date))}
                              <span className="block text-xs text-ink-3">
                                {formatNumber(level.lastCount.bags, 1)} bags
                                {level.deliveredSinceCount > 0 && ` · +${formatNumber(level.deliveredSinceCount, 1)} delivered`}
                              </span>
                            </>
                          ) : (
                            <span className="text-ink-3">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <CardHeader title="Stock movements" description="Deliveries and stocktakes, most recent first." />
            {movements.length === 0 ? (
              <EmptyState
                title="No movements yet"
                description="Record the bags in the store today as a stocktake, then log each delivery as it arrives."
              />
            ) : (
              <ul className="mt-3 divide-y divide-line">
                {movements.map((movement) => (
                  <li key={movement.id} className="flex items-center gap-4 px-5 py-3 text-sm">
                    <Badge tone={movement.kind === "count" ? "info" : "positive"}>
                      {movement.kind === "count" ? "Stocktake" : "Delivery"}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-ink">
                        {movement.feedType.code} · {movement.kind === "delivery" ? "+" : ""}
                        {formatNumber(movement.bags, 1)} bags
                      </p>
                      {movement.note && <p className="truncate text-ink-3">{movement.note}</p>}
                    </div>
                    <span className="shrink-0 text-ink-3">{formatDay(movement.date)}</span>
                    <ConfirmButton
                      action={deleteStockMovement}
                      fields={{ id: String(movement.id) }}
                      message="Delete this stock movement?"
                      label="Delete movement"
                    />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <StockMovementForm
          feedTypes={levels
            .filter((level) => level.feedType.active)
            .map((level) => ({ id: level.feedType.id, code: level.feedType.code }))}
          today={today}
        />
      </div>
    </>
  );
}
