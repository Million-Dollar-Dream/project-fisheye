import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getPondSummary } from "@/lib/pondSummary";
import { aggregateByMonth } from "@/lib/chartData";
import BarChart from "./BarChart";

export const dynamic = "force-dynamic";

function formatKg(value: number) {
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg`;
}

function formatDate(date: Date) {
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function PondDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const pondId = Number((await params).id);
  if (Number.isNaN(pondId)) notFound();

  const pond = await prisma.pond.findUnique({ where: { id: pondId } });
  if (!pond) notFound();

  const [feedLogs, deadFishRecords, feedInventory, summary] = await Promise.all([
    prisma.feedLog.findMany({
      where: { pondId },
      include: { feedType: true },
      orderBy: { date: "desc" },
    }),
    prisma.deadFishRecord.findMany({
      where: { pondId },
      orderBy: { date: "desc" },
    }),
    prisma.feedInventory.findMany({ where: { pondId }, orderBy: { id: "desc" } }),
    getPondSummary(pondId),
  ]);

  const feedUsageByMonth = aggregateByMonth(
    feedLogs,
    (log) => log.date,
    (log) => log.quantity * log.feedType.packingSize,
  );
  const mortalityByMonth = aggregateByMonth(
    deadFishRecords,
    (record) => record.date,
    (record) => record.tailCount,
  );

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-8 dark:bg-black sm:px-8">
      <main className="mx-auto max-w-5xl">
        <Link
          href="/"
          className="mb-4 inline-block text-sm text-zinc-600 hover:underline dark:text-zinc-400"
        >
          ← All ponds
        </Link>
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {pond.name}
          </h1>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            Capacity {pond.capacity.toLocaleString()}
          </span>
        </header>

        <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
            <dt className="text-xs text-zinc-500 dark:text-zinc-400">
              Total feed consumed
            </dt>
            <dd className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {formatKg(summary.totalFeedConsumedKg)}
            </dd>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
            <dt className="text-xs text-zinc-500 dark:text-zinc-400">
              Feed conversion ratio
            </dt>
            <dd className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {summary.feedConversionRatio.toFixed(2)}
            </dd>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
            <dt className="text-xs text-zinc-500 dark:text-zinc-400">
              Est. total fish weight
            </dt>
            <dd className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {formatKg(summary.estimatedTotalFishWeightKg)}
            </dd>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
            <dt className="text-xs text-zinc-500 dark:text-zinc-400">
              Est. weight to harvest
            </dt>
            <dd className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {formatKg(summary.totalEstimatedWeightToHarvestKg)}
            </dd>
          </div>
        </section>

        <section className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <BarChart title="Feed usage by month (kg)" data={feedUsageByMonth} />
          <BarChart title="Mortality by month (tail count)" data={mortalityByMonth} />
        </section>

        <section className="mb-8">
          <h2 className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-50">
            Feed inventory
          </h2>
          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                  <th className="px-3 py-2 font-medium">Packing size</th>
                  <th className="px-3 py-2 font-medium">Gunny quantity</th>
                  <th className="px-3 py-2 font-medium">Total weight</th>
                </tr>
              </thead>
              <tbody>
                {feedInventory.map((item) => (
                  <tr key={item.id} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
                    <td className="px-3 py-2 text-zinc-900 dark:text-zinc-50">{item.packingSize} kg</td>
                    <td className="px-3 py-2 text-zinc-900 dark:text-zinc-50">{item.gunnyQuantity}</td>
                    <td className="px-3 py-2 text-zinc-900 dark:text-zinc-50">{formatKg(item.totalWeightKg)}</td>
                  </tr>
                ))}
                {feedInventory.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-3 py-4 text-center text-zinc-500 dark:text-zinc-400">
                      No inventory recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-50">
            Feed log history
          </h2>
          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Feed type</th>
                  <th className="px-3 py-2 font-medium">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {feedLogs.map((log) => (
                  <tr key={log.id} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
                    <td className="px-3 py-2 text-zinc-900 dark:text-zinc-50">{formatDate(log.date)}</td>
                    <td className="px-3 py-2 text-zinc-900 dark:text-zinc-50">{log.feedType.code}</td>
                    <td className="px-3 py-2 text-zinc-900 dark:text-zinc-50">{log.quantity} gunny</td>
                  </tr>
                ))}
                {feedLogs.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-3 py-4 text-center text-zinc-500 dark:text-zinc-400">
                      No feed logs recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-50">
            Dead fish history
          </h2>
          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Tail count</th>
                  <th className="px-3 py-2 font-medium">Avg weight</th>
                  <th className="px-3 py-2 font-medium">Kg</th>
                </tr>
              </thead>
              <tbody>
                {deadFishRecords.map((record) => (
                  <tr key={record.id} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
                    <td className="px-3 py-2 text-zinc-900 dark:text-zinc-50">{formatDate(record.date)}</td>
                    <td className="px-3 py-2 text-zinc-900 dark:text-zinc-50">{record.tailCount}</td>
                    <td className="px-3 py-2 text-zinc-900 dark:text-zinc-50">{record.avgWeight} kg</td>
                    <td className="px-3 py-2 text-zinc-900 dark:text-zinc-50">{record.kg} kg</td>
                  </tr>
                ))}
                {deadFishRecords.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-4 text-center text-zinc-500 dark:text-zinc-400">
                      No dead fish recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
