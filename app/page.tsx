import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getPondMonthlyStats, getPondSummary } from "@/lib/pondSummary";
import SwitchRoleButton from "./SwitchRoleButton";
import {
  AppHeader,
  ArrowRightIcon,
  FeedIcon,
  FishIcon,
  ScaleIcon,
  WaterIcon,
} from "./ui";

export const dynamic = "force-dynamic";

async function getPondsWithStats() {
  const ponds = await prisma.pond.findMany({ orderBy: { id: "asc" } });

  return Promise.all(
    ponds.map(async (pond) => {
      const [monthlyStats, summary] = await Promise.all([
        getPondMonthlyStats(pond.id),
        getPondSummary(pond.id),
      ]);
      return { pond, monthlyStats, summary };
    }),
  );
}

function formatKg(value: number) {
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg`;
}

export default async function Home() {
  const pondsWithStats = await getPondsWithStats();
  const totals = pondsWithStats.reduce(
    (result, { pond, monthlyStats, summary }) => ({
      capacity: result.capacity + pond.capacity,
      feed: result.feed + monthlyStats.feedUsedThisMonthKg,
      harvest: result.harvest + summary.totalEstimatedWeightToHarvestKg,
    }),
    { capacity: 0, feed: 0, harvest: 0 },
  );

  return (
    <div className="min-h-dvh bg-stone-50 dark:bg-stone-950">
      <AppHeader>
        <span className="hidden items-center gap-1.5 text-xs font-medium text-stone-500 sm:flex dark:text-stone-400">
          <span className="size-1.5 rounded-full bg-emerald-600" />
          Farm overview
        </span>
        <SwitchRoleButton />
      </AppHeader>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <section className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="mb-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
              Farm dashboard
            </p>
            <h1 className="text-balance text-3xl font-semibold text-stone-950 sm:text-4xl dark:text-white">
              Your ponds, at a glance.
            </h1>
            <p className="mt-3 text-pretty text-base text-stone-600 dark:text-stone-400">
              Monitor feed usage, fish deaths, and projected harvest weight from one place.
            </p>
          </div>
          <Link
            href="/log"
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500"
          >
            Log today&apos;s data
            <ArrowRightIcon className="size-4" />
          </Link>
        </section>

        <section aria-label="Farm summary" className="mb-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SummaryCard
            icon={<WaterIcon className="size-5" />}
            label="Total capacity"
            value={totals.capacity.toLocaleString()}
            detail={`${pondsWithStats.length} active ${pondsWithStats.length === 1 ? "pond" : "ponds"}`}
          />
          <SummaryCard
            icon={<FeedIcon className="size-5" />}
            label="Feed used this month"
            value={formatKg(totals.feed)}
            detail="Across all ponds"
          />
          <SummaryCard
            icon={<ScaleIcon className="size-5" />}
            label="Projected harvest"
            value={formatKg(totals.harvest)}
            detail="Estimated live weight"
          />
        </section>

        <section>
          <div className="mb-4">
            <h2 className="text-balance text-xl font-semibold text-stone-950 dark:text-white">
              Pond performance
            </h2>
            <p className="mt-1 text-pretty text-sm text-stone-500 dark:text-stone-400">
              Select a pond to review its full history.
            </p>
          </div>

          {pondsWithStats.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center dark:border-white/15 dark:bg-white/5">
              <WaterIcon className="mx-auto size-6 text-stone-400" />
              <h3 className="mt-4 text-balance font-semibold text-stone-900 dark:text-white">
                No ponds are connected yet
              </h3>
              <p className="mx-auto mt-1 max-w-sm text-pretty text-sm text-stone-500 dark:text-stone-400">
                Once a pond is added to the farm, its daily performance will appear here.
              </p>
              <Link
                href="/select-role"
                className="mt-5 inline-flex h-10 items-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-medium text-stone-800 hover:bg-stone-50 dark:border-white/15 dark:bg-white/5 dark:text-stone-100 dark:hover:bg-white/10"
              >
                Return to role selection
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {pondsWithStats.map(({ pond, monthlyStats, summary }) => (
                <Link
                  key={pond.id}
                  href={`/ponds/${pond.id}`}
                  className="group rounded-2xl border border-stone-200 bg-white p-5 shadow-sm hover:border-emerald-200 dark:border-white/10 dark:bg-white/5 dark:hover:border-emerald-800"
                >
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                        <FishIcon className="size-5" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold text-stone-950 dark:text-white">
                          {pond.name}
                        </h3>
                        <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
                          Capacity {pond.capacity.toLocaleString()} fish
                        </p>
                      </div>
                    </div>
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-stone-200 text-stone-500 group-hover:border-emerald-200 group-hover:text-emerald-700 dark:border-white/10 dark:text-stone-400">
                      <ArrowRightIcon className="size-4" />
                    </span>
                  </div>

                  <dl className="grid grid-cols-3 divide-x divide-stone-100 border-t border-stone-100 pt-4 dark:divide-white/10 dark:border-white/10">
                    <PondStat label="Feed this month" value={formatKg(monthlyStats.feedUsedThisMonthKg)} />
                    <PondStat label="Fish deaths" value={monthlyStats.deadFishThisMonth.toLocaleString()} />
                    <PondStat label="Est. harvest" value={formatKg(summary.totalEstimatedWeightToHarvestKg)} />
                  </dl>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
      <div className="mb-4 flex items-center justify-between">
        <span className="flex size-9 items-center justify-center rounded-xl bg-stone-100 text-stone-600 dark:bg-white/10 dark:text-stone-300">
          {icon}
        </span>
        <span className="text-xs text-stone-400 dark:text-stone-500">{detail}</span>
      </div>
      <p className="text-sm text-stone-500 dark:text-stone-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-stone-950 dark:text-white">
        {value}
      </p>
    </div>
  );
}

function PondStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 px-3 first:pl-0 last:pr-0">
      <dt className="truncate text-xs text-stone-500 dark:text-stone-400">{label}</dt>
      <dd className="mt-1 truncate text-sm font-semibold tabular-nums text-stone-900 dark:text-stone-100">
        {value}
      </dd>
    </div>
  );
}
