"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, FeedIcon, FishIcon, WaterIcon } from "../ui";

type Pond = { id: number; name: string };
type FeedType = { id: number; code: string; packingSize: number };

type Props = {
  ponds: Pond[];
  feedTypes: FeedType[];
};

type Status = {
  type: "idle" | "saving" | "success" | "error";
  message?: string;
};

const fieldClass =
  "h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base tabular-nums text-stone-950 shadow-sm placeholder:text-stone-400 hover:border-stone-400 focus:border-emerald-700 dark:border-white/15 dark:bg-white/5 dark:text-white dark:placeholder:text-stone-600 dark:hover:border-white/25";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function QuickEntryForm({ ponds, feedTypes }: Props) {
  const router = useRouter();
  const [pondId, setPondId] = useState<string>(ponds[0] ? String(ponds[0].id) : "");
  const [feedTypeId, setFeedTypeId] = useState<string>(
    feedTypes[0] ? String(feedTypes[0].id) : "",
  );
  const [feedQuantity, setFeedQuantity] = useState("");
  const [feedStatus, setFeedStatus] = useState<Status>({ type: "idle" });
  const [tailCount, setTailCount] = useState("");
  const [avgWeight, setAvgWeight] = useState("");
  const [deadFishStatus, setDeadFishStatus] = useState<Status>({ type: "idle" });

  const selectedFeed = feedTypes.find((feedType) => String(feedType.id) === feedTypeId);
  const feedWeight = Number(feedQuantity) * (selectedFeed?.packingSize ?? 0);
  const mortalityWeight = Number(tailCount) * Number(avgWeight);

  async function handleFeedSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!pondId || !feedTypeId || !feedQuantity) return;

    setFeedStatus({ type: "saving" });
    try {
      const response = await fetch(`/api/ponds/${pondId}/feed-logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: todayIso(),
          feedTypeId: Number(feedTypeId),
          quantity: Number(feedQuantity),
        }),
      });
      if (!response.ok) throw new Error("Failed to save feed log");
      setFeedStatus({ type: "success", message: "Feed entry saved." });
      setFeedQuantity("");
      router.refresh();
    } catch {
      setFeedStatus({ type: "error", message: "Could not save this feed entry. Try again." });
    }
  }

  async function handleDeadFishSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!pondId || !tailCount || !avgWeight) return;

    const tail = Number(tailCount);
    const weight = Number(avgWeight);

    setDeadFishStatus({ type: "saving" });
    try {
      const response = await fetch(`/api/ponds/${pondId}/dead-fish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: todayIso(),
          tailCount: tail,
          avgWeight: weight,
          kg: tail * weight,
        }),
      });
      if (!response.ok) throw new Error("Failed to save dead fish record");
      setDeadFishStatus({ type: "success", message: "Fish death entry saved." });
      setTailCount("");
      setAvgWeight("");
      router.refresh();
    } catch {
      setDeadFishStatus({ type: "error", message: "Could not save this fish death entry. Try again." });
    }
  }

  if (ponds.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center dark:border-white/15 dark:bg-white/5">
        <WaterIcon className="mx-auto size-6 text-stone-400" />
        <h2 className="mt-4 text-balance font-semibold text-stone-900 dark:text-white">
          There are no ponds to log
        </h2>
        <p className="mx-auto mt-1 max-w-sm text-pretty text-sm text-stone-500 dark:text-stone-400">
          Ask a farm owner to add a pond before recording today&apos;s activity.
        </p>
        <Link
          href="/select-role"
          className="mt-5 inline-flex h-10 items-center rounded-xl border border-stone-300 px-4 text-sm font-medium text-stone-800 hover:bg-stone-50 dark:border-white/15 dark:text-stone-100 dark:hover:bg-white/10"
        >
          Switch role
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
        <label htmlFor="pond" className="mb-2 block text-sm font-semibold text-stone-900 dark:text-stone-100">
          Which pond are you updating?
        </label>
        <select
          id="pond"
          value={pondId}
          onChange={(event) => setPondId(event.target.value)}
          className={fieldClass}
        >
          {ponds.map((pond) => (
            <option key={pond.id} value={pond.id}>{pond.name}</option>
          ))}
        </select>
      </div>

      <form onSubmit={handleFeedSubmit} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
        <div className="mb-5 flex items-center gap-3 border-b border-stone-100 pb-4 dark:border-white/10">
          <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
            <FeedIcon className="size-5" />
          </span>
          <div>
            <h2 className="text-balance font-semibold text-stone-950 dark:text-white">Feed used</h2>
            <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">Record the feed given today</p>
          </div>
        </div>

        {feedTypes.length === 0 ? (
          <p className="rounded-xl bg-stone-100 p-3 text-pretty text-sm text-stone-600 dark:bg-white/5 dark:text-stone-400">
            No feed types are available. Ask a farm owner to set one up first.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="feedType" className="mb-2 block text-sm font-medium text-stone-700 dark:text-stone-300">Feed type</label>
              <select id="feedType" value={feedTypeId} onChange={(event) => setFeedTypeId(event.target.value)} className={fieldClass}>
                {feedTypes.map((feedType) => (
                  <option key={feedType.id} value={feedType.id}>{feedType.code} · {feedType.packingSize} kg</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="feedQuantity" className="mb-2 block text-sm font-medium text-stone-700 dark:text-stone-300">Bags used</label>
              <input
                id="feedQuantity"
                type="number"
                inputMode="decimal"
                step="any"
                min="0"
                required
                value={feedQuantity}
                onChange={(event) => setFeedQuantity(event.target.value)}
                className={fieldClass}
                placeholder="e.g. 1.5"
                aria-describedby="feed-helper"
              />
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3 border-t border-stone-100 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
          <p id="feed-helper" className="text-xs text-stone-500 dark:text-stone-400">
            {feedQuantity && selectedFeed ? <><span className="font-medium tabular-nums text-stone-700 dark:text-stone-300">{feedWeight.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg</span> total feed</> : "Enter the number of bags used"}
          </p>
          <button
            type="submit"
            disabled={feedStatus.type === "saving" || feedTypes.length === 0}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-700 px-5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-500"
          >
            {feedStatus.type === "saving" ? "Saving entry…" : "Save feed entry"}
          </button>
        </div>
        <StatusMessage status={feedStatus} />
      </form>

      <form onSubmit={handleDeadFishSubmit} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
        <div className="mb-5 flex items-center gap-3 border-b border-stone-100 pb-4 dark:border-white/10">
          <span className="flex size-10 items-center justify-center rounded-xl bg-stone-100 text-stone-600 dark:bg-white/10 dark:text-stone-300">
            <FishIcon className="size-5" />
          </span>
          <div>
            <h2 className="text-balance font-semibold text-stone-950 dark:text-white">Fish deaths</h2>
            <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">Record losses observed today</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="tailCount" className="mb-2 block text-sm font-medium text-stone-700 dark:text-stone-300">Number of fish</label>
            <input
              id="tailCount"
              type="number"
              inputMode="numeric"
              step="1"
              min="0"
              required
              value={tailCount}
              onChange={(event) => setTailCount(event.target.value)}
              className={fieldClass}
              placeholder="e.g. 3"
              aria-describedby="mortality-helper"
            />
          </div>
          <div>
            <label htmlFor="avgWeight" className="mb-2 block text-sm font-medium text-stone-700 dark:text-stone-300">Avg. weight (kg)</label>
            <input
              id="avgWeight"
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              required
              value={avgWeight}
              onChange={(event) => setAvgWeight(event.target.value)}
              className={fieldClass}
              placeholder="e.g. 0.25"
              aria-describedby="mortality-helper"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-stone-100 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
          <p id="mortality-helper" className="text-xs text-stone-500 dark:text-stone-400">
            {tailCount && avgWeight ? <><span className="font-medium tabular-nums text-stone-700 dark:text-stone-300">{mortalityWeight.toLocaleString(undefined, { maximumFractionDigits: 3 })} kg</span> combined weight</> : "Enter a count and average weight"}
          </p>
          <button
            type="submit"
            disabled={deadFishStatus.type === "saving"}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-700 px-5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-500"
          >
            {deadFishStatus.type === "saving" ? "Saving entry…" : "Save fish death entry"}
          </button>
        </div>
        <StatusMessage status={deadFishStatus} />
      </form>
    </div>
  );
}

function StatusMessage({ status }: { status: Status }) {
  if (status.type === "success") {
    return (
      <p role="status" className="mt-3 flex items-center gap-1.5 text-pretty text-sm text-emerald-700 dark:text-emerald-400">
        <CheckIcon className="size-4" />
        {status.message}
      </p>
    );
  }

  if (status.type === "error") {
    return <p role="alert" className="mt-3 text-pretty text-sm text-red-700 dark:text-red-400">{status.message}</p>;
  }

  return null;
}
