import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getPondSummary } from "@/lib/pondSummary";
import { aggregateByMonth } from "@/lib/chartData";
import SwitchRoleButton from "../../SwitchRoleButton";
import {
  AppHeader,
  ArrowLeftIcon,
  ArrowRightIcon,
  FeedIcon,
  FishIcon,
  PackageIcon,
  ScaleIcon,
  SparkleIcon,
  WaterIcon,
} from "../../ui";
import BarChart from "./BarChart";
import AddInventoryForm from "./AddInventoryForm";

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
    <div className="min-h-dvh bg-stone-50 dark:bg-stone-950">
      <AppHeader>
        <Link
          href="/"
          className="hidden items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-stone-500 hover:bg-stone-100 hover:text-stone-800 sm:flex dark:text-stone-400 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <ArrowLeftIcon className="size-3.5" />
          All ponds
        </Link>
        <SwitchRoleButton />
      </AppHeader>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <Link
          href="/"
          className="mb-7 inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-900 sm:hidden dark:text-stone-400 dark:hover:text-white"
        >
          <ArrowLeftIcon className="size-4" />
          All ponds
        </Link>

        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
              <WaterIcon className="size-4" />
              Pond overview
            </div>
            <h1 className="text-balance text-3xl font-semibold text-stone-950 sm:text-4xl dark:text-white">
              {pond.name}
            </h1>
            <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
              Stocking capacity <span className="font-medium tabular-nums text-stone-700 dark:text-stone-300">{pond.capacity.toLocaleString()} fish</span>
            </p>
          </div>
          <Link
            href="/log"
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500"
          >
            Log pond data
            <ArrowRightIcon className="size-4" />
          </Link>
        </header>

        <dl className="mb-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard icon={<FeedIcon className="size-5" />} label="Feed consumed" value={formatKg(summary.totalFeedConsumedKg)} />
          <MetricCard icon={<ScaleIcon className="size-5" />} label="Feed conversion" value={summary.feedConversionRatio.toFixed(2)} detail="FCR" />
          <MetricCard icon={<FishIcon className="size-5" />} label="Est. fish weight" value={formatKg(summary.estimatedTotalFishWeightKg)} />
          <MetricCard icon={<WaterIcon className="size-5" />} label="Est. harvest" value={formatKg(summary.totalEstimatedWeightToHarvestKg)} accent />
        </dl>

        <section className="mb-10">
          <div className="mb-4">
            <SectionHeading title="Performance trends" description="Monthly feed and fish death patterns for this pond." />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <BarChart title="Feed usage by month (kg)" data={feedUsageByMonth} />
            <BarChart title="Fish deaths by month" data={mortalityByMonth} />
          </div>
        </section>

        <section className="mb-10 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5 dark:border-emerald-900 dark:bg-emerald-950/40">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm dark:bg-white/10 dark:text-emerald-400">
              <SparkleIcon className="size-4" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-balance text-sm font-semibold text-emerald-950 dark:text-emerald-100">Feed recommendations</h2>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-white/10 dark:text-emerald-300">Planned</span>
              </div>
              <p className="mt-1 max-w-3xl text-pretty text-sm leading-6 text-emerald-900/70 dark:text-emerald-200/70">
                Future recommendations will use this pond&apos;s feed, fish death, and growth history to suggest daily feed amounts.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <div className="mb-4">
            <SectionHeading title="Feed inventory" description="Current stock recorded for this pond." icon={<PackageIcon className="size-4" />} />
          </div>
          <DataTable>
            <table className="w-full min-w-xl text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/70 text-left text-xs text-stone-500 dark:border-white/10 dark:bg-white/5 dark:text-stone-400">
                  <th className="px-4 py-3 font-medium">Bag size</th>
                  <th className="px-4 py-3 font-medium">Number of bags</th>
                  <th className="px-4 py-3 text-right font-medium">Total weight</th>
                </tr>
              </thead>
              <tbody>
                {feedInventory.map((item) => (
                  <tr key={item.id} className="border-b border-stone-100 last:border-0 dark:border-white/10">
                    <td className="px-4 py-3.5 tabular-nums text-stone-700 dark:text-stone-300">{item.packingSize} kg</td>
                    <td className="px-4 py-3.5 tabular-nums text-stone-700 dark:text-stone-300">{item.gunnyQuantity}</td>
                    <td className="px-4 py-3.5 text-right font-medium tabular-nums text-stone-950 dark:text-white">{formatKg(item.totalWeightKg)}</td>
                  </tr>
                ))}
                {feedInventory.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-pretty text-sm text-stone-500 dark:text-stone-400">
                      No inventory recorded. Add the first stock entry below.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </DataTable>
          <AddInventoryForm pondId={pondId} />
        </section>

        <section className="mb-10">
          <div className="mb-4 flex items-end justify-between gap-4">
            <SectionHeading title="Feed history" description={`${feedLogs.length} recorded ${feedLogs.length === 1 ? "entry" : "entries"}.`} icon={<FeedIcon className="size-4" />} />
            <Link href="/log" className="mb-0.5 shrink-0 text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400">Add entry</Link>
          </div>
          <DataTable>
            <table className="w-full min-w-xl text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/70 text-left text-xs text-stone-500 dark:border-white/10 dark:bg-white/5 dark:text-stone-400">
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Feed type</th>
                  <th className="px-4 py-3 text-right font-medium">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {feedLogs.map((log) => (
                  <tr key={log.id} className="border-b border-stone-100 last:border-0 dark:border-white/10">
                    <td className="whitespace-nowrap px-4 py-3.5 text-stone-700 dark:text-stone-300">{formatDate(log.date)}</td>
                    <td className="px-4 py-3.5 font-medium text-stone-950 dark:text-white">{log.feedType.code}</td>
                    <td className="px-4 py-3.5 text-right tabular-nums text-stone-700 dark:text-stone-300">{log.quantity} bags</td>
                  </tr>
                ))}
                {feedLogs.length === 0 && <EmptyTableRow colSpan={3} message="No feed entries recorded yet." />}
              </tbody>
            </table>
          </DataTable>
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <SectionHeading title="Fish death history" description={`${deadFishRecords.length} recorded ${deadFishRecords.length === 1 ? "entry" : "entries"}.`} icon={<FishIcon className="size-4" />} />
            <Link href="/log" className="mb-0.5 shrink-0 text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400">Add entry</Link>
          </div>
          <DataTable>
            <table className="w-full min-w-2xl text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/70 text-left text-xs text-stone-500 dark:border-white/10 dark:bg-white/5 dark:text-stone-400">
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Fish count</th>
                  <th className="px-4 py-3 font-medium">Avg. weight</th>
                  <th className="px-4 py-3 text-right font-medium">Total weight</th>
                </tr>
              </thead>
              <tbody>
                {deadFishRecords.map((record) => (
                  <tr key={record.id} className="border-b border-stone-100 last:border-0 dark:border-white/10">
                    <td className="whitespace-nowrap px-4 py-3.5 text-stone-700 dark:text-stone-300">{formatDate(record.date)}</td>
                    <td className="px-4 py-3.5 font-medium tabular-nums text-stone-950 dark:text-white">{record.tailCount}</td>
                    <td className="px-4 py-3.5 tabular-nums text-stone-700 dark:text-stone-300">{record.avgWeight} kg</td>
                    <td className="px-4 py-3.5 text-right tabular-nums text-stone-700 dark:text-stone-300">{record.kg} kg</td>
                  </tr>
                ))}
                {deadFishRecords.length === 0 && <EmptyTableRow colSpan={4} message="No fish death entries recorded yet." />}
              </tbody>
            </table>
          </DataTable>
        </section>
      </main>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  detail,
  accent = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail?: string;
  accent?: boolean;
}) {
  if (accent) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-700 p-4 text-white shadow-sm dark:border-emerald-800 dark:bg-emerald-700">
        <div className="mb-5 flex size-9 items-center justify-center rounded-xl bg-white/15">{icon}</div>
        <dt className="text-xs text-emerald-100">{label}</dt>
        <dd className="mt-1 text-xl font-semibold tabular-nums">{value}</dd>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
      <div className="mb-5 flex size-9 items-center justify-center rounded-xl bg-stone-100 text-stone-600 dark:bg-white/10 dark:text-stone-300">{icon}</div>
      <dt className="text-xs text-stone-500 dark:text-stone-400">{label}</dt>
      <dd className="mt-1 text-xl font-semibold tabular-nums text-stone-950 dark:text-white">
        {value}{detail && <span className="ml-1.5 text-xs font-medium text-stone-400">{detail}</span>}
      </dd>
    </div>
  );
}

function SectionHeading({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        {icon && <span className="text-emerald-700 dark:text-emerald-400">{icon}</span>}
        <h2 className="text-balance text-lg font-semibold text-stone-950 dark:text-white">{title}</h2>
      </div>
      <p className="mt-1 text-pretty text-sm text-stone-500 dark:text-stone-400">{description}</p>
    </div>
  );
}

function DataTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5">
      {children}
    </div>
  );
}

function EmptyTableRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-8 text-center text-pretty text-sm text-stone-500 dark:text-stone-400">
        {message} <Link href="/log" className="font-medium text-emerald-700 hover:underline dark:text-emerald-400">Add one now.</Link>
      </td>
    </tr>
  );
}
