import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getPondMonthlyStats, getPondSummary } from "@/lib/pondSummary";

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

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-8 dark:bg-black sm:px-8">
      <main className="mx-auto max-w-5xl">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Ponds
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Feed usage, mortality, and harvest estimates across all ponds.
            </p>
          </div>
          <Link
            href="/log"
            className="shrink-0 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
          >
            Log today&apos;s data
          </Link>
        </header>

        {pondsWithStats.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            No ponds yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pondsWithStats.map(({ pond, monthlyStats, summary }) => (
              <Link
                key={pond.id}
                href={`/ponds/${pond.id}`}
                className="block rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-zinc-300 hover:shadow dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
                    {pond.name}
                  </h2>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    Capacity {pond.capacity.toLocaleString()}
                  </span>
                </div>
                <dl className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex items-center justify-between">
                    <dt className="text-zinc-600 dark:text-zinc-400">
                      Feed used this month
                    </dt>
                    <dd className="font-medium text-zinc-900 dark:text-zinc-50">
                      {formatKg(monthlyStats.feedUsedThisMonthKg)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-zinc-600 dark:text-zinc-400">
                      Dead fish this month
                    </dt>
                    <dd className="font-medium text-zinc-900 dark:text-zinc-50">
                      {monthlyStats.deadFishThisMonth.toLocaleString()}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-zinc-600 dark:text-zinc-400">
                      Est. harvest weight
                    </dt>
                    <dd className="font-medium text-zinc-900 dark:text-zinc-50">
                      {formatKg(summary.totalEstimatedWeightToHarvestKg)}
                    </dd>
                  </div>
                </dl>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
