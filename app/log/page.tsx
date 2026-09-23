import type { Metadata } from "next";
import Link from "next/link";
import { addDays, dayKeyToDate, formatDay, isDayKey, todayKey } from "@/lib/dates";
import { formatBags, formatNumber } from "@/lib/format";
import { getWorkerDay } from "@/lib/queries";
import { getSession } from "@/lib/session";
import {
  CheckCircleIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleIcon,
} from "../components/icons";
import { cx } from "../components/ui";

export const metadata: Metadata = { title: "Daily log" };
export const dynamic = "force-dynamic";

export default async function DailyLogPage({ searchParams }: PageProps<"/log">) {
  const params = await searchParams;
  const today = todayKey();
  const requested = typeof params.date === "string" ? params.date : today;
  const date = isDayKey(requested) && requested <= today ? requested : today;
  const savedPondId = Number(params.saved);

  const [ponds, session] = await Promise.all([getWorkerDay(date), getSession()]);
  const done = ponds.filter((entry) => entry.today).length;
  const isToday = date === today;
  const savedPond = ponds.find((entry) => entry.pond.id === savedPondId)?.pond;
  const nextPending = ponds.find((entry) => !entry.today);

  return (
    <>
      {savedPond && (
        <div
          role="status"
          className="mb-4 flex items-center gap-3 rounded-xl border border-positive/25 bg-positive-soft px-4 py-3 text-sm text-positive"
        >
          <CheckCircleIcon className="size-5 shrink-0" />
          <span className="font-medium">{savedPond.name} saved.</span>
          {nextPending && (
            <Link
              href={`/log/${nextPending.pond.id}?date=${date}`}
              className="ml-auto font-semibold underline-offset-2 hover:underline"
            >
              Next: {nextPending.pond.name}
            </Link>
          )}
        </div>
      )}

      <section className="mb-5">
        <p className="text-sm text-ink-3">
          {session?.name ? `Hi ${session.name},` : "Hello,"} {isToday ? "here's today's checklist." : "catching up on a past day."}
        </p>
        <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-line bg-surface p-1.5 shadow-xs">
          <Link
            href={`/log?date=${addDays(date, -1)}`}
            className="flex size-11 items-center justify-center rounded-lg text-ink-2 hover:bg-surface-3"
            aria-label="Previous day"
          >
            <ChevronLeftIcon className="size-5" />
          </Link>
          <div className="text-center">
            <p className="text-base font-semibold text-ink">
              {isToday ? "Today" : formatDay(dayKeyToDate(date), { weekday: true, year: false })}
            </p>
            <p className="text-xs text-ink-3">{formatDay(dayKeyToDate(date), { weekday: isToday })}</p>
          </div>
          {isToday ? (
            <span className="size-11" aria-hidden="true" />
          ) : (
            <Link
              href={`/log?date=${addDays(date, 1)}`}
              className="flex size-11 items-center justify-center rounded-lg text-ink-2 hover:bg-surface-3"
              aria-label="Next day"
            >
              <ChevronRightIcon className="size-5" />
            </Link>
          )}
        </div>
      </section>

      <section aria-labelledby="progress-heading" className="mb-4">
        <div className="mb-2 flex items-baseline justify-between">
          <h1 id="progress-heading" className="text-lg font-semibold text-ink">
            Ponds
          </h1>
          <p className="text-sm tabular-nums text-ink-2">
            <span className="font-semibold text-ink">{done}</span> of {ponds.length} logged
          </p>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-3" aria-hidden="true">
          <div
            className="h-full rounded-full bg-brand transition-all"
            style={{ width: `${ponds.length ? (done / ponds.length) * 100 : 0}%` }}
          />
        </div>
      </section>

      <ul className="space-y-2.5">
        {ponds.map(({ pond, today: entry, previous }) => (
          <li key={pond.id}>
            <Link
              href={`/log/${pond.id}?date=${date}`}
              className={cx(
                "flex items-center gap-4 rounded-xl border bg-surface p-4 shadow-xs transition-colors active:bg-surface-2",
                entry ? "border-line" : "border-line hover:border-brand/40",
              )}
            >
              <span
                className={cx(
                  "flex size-11 shrink-0 items-center justify-center rounded-full",
                  entry ? "bg-positive-soft text-positive" : "bg-surface-3 text-ink-3",
                )}
              >
                {entry ? <CheckIcon className="size-5" strokeWidth={2.4} /> : <CircleIcon className="size-5" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-semibold text-ink">{pond.name}</span>
                <span className="mt-0.5 block truncate text-sm text-ink-3">
                  {entry ? (
                    <>
                      {entry.bags > 0 ? `${entry.feedType?.code} · ${formatBags(entry.bags)}` : "No feeding"}
                      {" · "}
                      {formatNumber(entry.deadCount, 0)} dead
                      {entry.recordedBy && ` · by ${entry.recordedBy}`}
                    </>
                  ) : previous ? (
                    <>
                      Last: {previous.bags > 0 ? `${previous.feedType?.code} · ${formatBags(previous.bags)}` : "no feeding"}{" "}
                      on {formatDay(previous.date, { year: false })}
                    </>
                  ) : (
                    "No records yet"
                  )}
                </span>
              </span>
              <span
                className={cx(
                  "shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold",
                  entry ? "text-ink-3" : "bg-brand text-brand-ink",
                )}
              >
                {entry ? "Edit" : "Log"}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {ponds.length === 0 && (
        <p className="rounded-xl border border-dashed border-line-strong bg-surface p-8 text-center text-sm text-ink-3">
          No active ponds. Ask the farm owner to add one.
        </p>
      )}
    </>
  );
}
