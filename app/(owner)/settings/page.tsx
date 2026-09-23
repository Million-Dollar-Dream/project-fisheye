import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { dayKeyToDate, dateToDayKey, formatDay } from "@/lib/dates";
import { ChevronRightIcon, FeedIcon, WavesIcon } from "@/app/components/icons";
import { Badge, Card, CardHeader, PageHeader } from "@/app/components/ui";
import { FeedTypeRow, NewFeedTypeForm, NewPondForm } from "./SettingsForms";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [ponds, feedTypes] = await Promise.all([
    prisma.pond.findMany({ orderBy: { id: "asc" }, include: { _count: { select: { dailyLogs: true } } } }),
    prisma.feedType.findMany({ orderBy: { code: "asc" }, include: { _count: { select: { dailyLogs: true } } } }),
  ]);

  return (
    <>
      <PageHeader eyebrow="Farm setup" title="Settings" description="Feed catalogue and prices, and the ponds on this farm." />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader
            icon={<FeedIcon className="size-4" />}
            title="Feed types & prices"
            description="Prices apply to new entries. Past records keep the price they were saved with."
          />
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-y border-line bg-surface-2 text-left text-xs text-ink-3">
                  <th className="px-5 py-2.5 font-medium">Code</th>
                  <th className="px-2 py-2.5 font-medium">Bag (kg)</th>
                  <th className="px-2 py-2.5 font-medium">RM / kg</th>
                  <th className="px-2 py-2.5 font-medium">Active</th>
                  <th className="px-5 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {feedTypes.map((feedType) => (
                  <FeedTypeRow
                    key={feedType.id}
                    feedType={{
                      id: feedType.id,
                      code: feedType.code,
                      packSizeKg: feedType.packSizeKg,
                      pricePerKg: feedType.pricePerKg,
                      active: feedType.active,
                      uses: feedType._count.dailyLogs,
                    }}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <NewFeedTypeForm />
        </Card>

        <Card>
          <CardHeader icon={<WavesIcon className="size-4" />} title="Ponds" description="Open a pond to set its species, stocking date and FCR." />
          <ul className="mt-4 divide-y divide-line border-t border-line">
            {ponds.map((pond) => (
              <li key={pond.id}>
                <Link
                  href={`/ponds/${pond.id}?view=settings`}
                  className="flex items-center gap-4 px-5 py-3 text-sm hover:bg-surface-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink">{pond.name}</p>
                    <p className="text-ink-3">
                      {[
                        pond.species,
                        pond.stockedAt ? `stocked ${formatDay(dayKeyToDate(dateToDayKey(pond.stockedAt)))}` : "not stocked",
                        `${pond._count.dailyLogs} records`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  {!pond.active && <Badge>Inactive</Badge>}
                  <ChevronRightIcon className="size-4 text-ink-3" />
                </Link>
              </li>
            ))}
          </ul>
          <NewPondForm />
        </Card>
      </div>
    </>
  );
}
