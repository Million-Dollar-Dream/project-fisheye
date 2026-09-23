import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import {
  addDays,
  dateToDayKey,
  dayKeyToDate,
  daysBetween,
  formatDay,
  isDayKey,
  todayKey,
} from "@/lib/dates";
import { formatAbw, formatBags } from "@/lib/format";
import { ChevronLeftIcon } from "../../components/icons";
import DailyEntryForm from "./DailyEntryForm";
import SamplingForm from "./SamplingForm";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/log/[pondId]">): Promise<Metadata> {
  const pond = await prisma.pond.findUnique({ where: { id: Number((await params).pondId) } });
  return { title: pond ? `Log ${pond.name}` : "Daily log" };
}

export default async function PondEntryPage({ params, searchParams }: PageProps<"/log/[pondId]">) {
  const pondId = Number((await params).pondId);
  const query = await searchParams;
  if (!Number.isInteger(pondId)) notFound();

  const today = todayKey();
  const requested = typeof query.date === "string" ? query.date : today;
  const date = isDayKey(requested) && requested <= today ? requested : today;
  const returnTo = typeof query.returnTo === "string" && query.returnTo.startsWith("/ponds/") ? query.returnTo : "";

  const [pond, feedTypes, session] = await Promise.all([
    prisma.pond.findUnique({
      where: { id: pondId },
      include: {
        dailyLogs: {
          where: { date: { lte: dayKeyToDate(date), gte: dayKeyToDate(addDays(date, -7)) } },
          orderBy: { date: "desc" },
          include: { feedType: { select: { code: true } } },
        },
        samplings: { orderBy: { date: "desc" }, take: 1 },
      },
    }),
    prisma.feedType.findMany({ where: { active: true }, orderBy: { code: "asc" } }),
    getSession(),
  ]);
  if (!pond) notFound();

  const existing = pond.dailyLogs.find((log) => dateToDayKey(log.date) === date) ?? null;
  const history = pond.dailyLogs.filter((log) => dateToDayKey(log.date) < date);
  const previous =
    history[0] ??
    (await prisma.dailyLog.findFirst({
      where: { pondId, date: { lt: dayKeyToDate(date) } },
      orderBy: { date: "desc" },
      include: { feedType: { select: { code: true } } },
    }));
  const lastFeedTypeId =
    history.find((log) => log.feedTypeId && log.bags > 0)?.feedTypeId ?? previous?.feedTypeId ?? null;

  const lastSampling = pond.samplings[0] ?? null;
  const daysSinceSampling = lastSampling ? daysBetween(dateToDayKey(lastSampling.date), date) : null;
  const dayOfCulture = pond.stockedAt ? daysBetween(dateToDayKey(pond.stockedAt), date) : null;
  const tooOldForWorker = session?.role === "worker" && daysBetween(date, today) > 7;

  return (
    <>
      <Link
        href={returnTo || `/log?date=${date}`}
        className="mb-4 inline-flex h-9 items-center gap-1 rounded-lg pr-2 text-sm font-medium text-ink-2 hover:text-ink"
      >
        <ChevronLeftIcon className="size-4" />
        {returnTo ? "Back to records" : "All ponds"}
      </Link>

      <header className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{pond.name}</h1>
        <p className="mt-1 text-sm text-ink-2">
          {formatDay(dayKeyToDate(date), { weekday: true })}
          {dayOfCulture !== null && dayOfCulture >= 0 && (
            <span className="text-ink-3"> · Day {dayOfCulture} of culture</span>
          )}
        </p>
      </header>

      {tooOldForWorker ? (
        <p className="rounded-xl border border-warning/30 bg-warning-soft p-4 text-sm text-warning">
          This day is more than a week ago. Ask the farm owner to correct it.
        </p>
      ) : (
        <DailyEntryForm
          key={`${pond.id}-${date}`}
          pondId={pond.id}
          pondName={pond.name}
          date={date}
          returnTo={returnTo}
          feedTypes={feedTypes.map(({ id, code, packSizeKg, pricePerKg }) => ({ id, code, packSizeKg, pricePerKg }))}
          existing={
            existing
              ? {
                  feedTypeId: existing.feedTypeId,
                  bags: existing.bags,
                  deadCount: existing.deadCount,
                  note: existing.note,
                  recordedBy: existing.recordedBy,
                  source: existing.source,
                }
              : null
          }
          previous={
            previous
              ? {
                  date: dateToDayKey(previous.date),
                  feedTypeId: previous.feedTypeId,
                  feedCode: previous.feedType?.code ?? null,
                  bags: previous.bags,
                  deadCount: previous.deadCount,
                }
              : null
          }
          defaultFeedTypeId={lastFeedTypeId}
        />
      )}

      {!tooOldForWorker && (
        <SamplingForm
          pondId={pond.id}
          date={date}
          lastSampling={
            lastSampling
              ? {
                  label: `${formatAbw(lastSampling.avgWeightKg)} on ${formatDay(lastSampling.date)}`,
                  daysAgo: daysSinceSampling ?? 0,
                }
              : null
          }
        />
      )}

      {history.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-ink-2">Previous 7 days</h2>
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
            {history.map((log) => (
              <li key={log.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                <span className="text-ink-2">{formatDay(log.date, { weekday: true, year: false })}</span>
                <span className="tabular-nums text-ink">
                  {log.bags > 0 ? `${log.feedType?.code} · ${formatBags(log.bags)}` : "No feeding"}
                  <span className="text-ink-3"> · {log.deadCount} dead</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
