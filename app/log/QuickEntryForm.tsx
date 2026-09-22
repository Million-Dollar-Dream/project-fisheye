"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Pond = { id: number; name: string };
type FeedType = { id: number; code: string; packingSize: number };

type Props = {
  ponds: Pond[];
  feedTypes: FeedType[];
};

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
  const [feedStatus, setFeedStatus] = useState<
    { type: "idle" | "saving" | "success" | "error"; message?: string }
  >({ type: "idle" });

  const [tailCount, setTailCount] = useState("");
  const [avgWeight, setAvgWeight] = useState("");
  const [deadFishStatus, setDeadFishStatus] = useState<
    { type: "idle" | "saving" | "success" | "error"; message?: string }
  >({ type: "idle" });

  const noPonds = ponds.length === 0;

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
      setFeedStatus({ type: "success", message: "Feed log saved." });
      setFeedQuantity("");
      router.refresh();
    } catch {
      setFeedStatus({ type: "error", message: "Could not save feed log. Try again." });
    }
  }

  async function handleDeadFishSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!pondId || !tailCount || !avgWeight) return;

    const tail = Number(tailCount);
    const weight = Number(avgWeight);
    const kg = tail * weight;

    setDeadFishStatus({ type: "saving" });
    try {
      const response = await fetch(`/api/ponds/${pondId}/dead-fish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: todayIso(),
          tailCount: tail,
          avgWeight: weight,
          kg,
        }),
      });
      if (!response.ok) throw new Error("Failed to save dead fish record");
      setDeadFishStatus({ type: "success", message: "Dead fish record saved." });
      setTailCount("");
      setAvgWeight("");
      router.refresh();
    } catch {
      setDeadFishStatus({ type: "error", message: "Could not save record. Try again." });
    }
  }

  if (noPonds) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        No ponds set up yet. Ask a farm owner to add a pond first.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <label
          htmlFor="pond"
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Pond
        </label>
        <select
          id="pond"
          value={pondId}
          onChange={(e) => setPondId(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-3 text-base text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        >
          {ponds.map((pond) => (
            <option key={pond.id} value={pond.id}>
              {pond.name}
            </option>
          ))}
        </select>
      </div>

      <form
        onSubmit={handleFeedSubmit}
        className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <h2 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Feed used today
        </h2>
        <div className="space-y-3">
          <div>
            <label
              htmlFor="feedType"
              className="mb-1 block text-sm text-zinc-700 dark:text-zinc-300"
            >
              Feed type
            </label>
            <select
              id="feedType"
              value={feedTypeId}
              onChange={(e) => setFeedTypeId(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-3 text-base text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            >
              {feedTypes.map((feedType) => (
                <option key={feedType.id} value={feedType.id}>
                  {feedType.code} ({feedType.packingSize}kg/gunny)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="feedQuantity"
              className="mb-1 block text-sm text-zinc-700 dark:text-zinc-300"
            >
              Quantity (gunny)
            </label>
            <input
              id="feedQuantity"
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              required
              value={feedQuantity}
              onChange={(e) => setFeedQuantity(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-3 text-base text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              placeholder="e.g. 1.5"
            />
          </div>
          <button
            type="submit"
            disabled={feedStatus.type === "saving"}
            className="w-full rounded-lg bg-zinc-900 py-3 text-base font-medium text-white transition disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
          >
            {feedStatus.type === "saving" ? "Saving..." : "Log feed"}
          </button>
          {feedStatus.type === "success" && (
            <p className="text-sm text-green-700 dark:text-green-400">{feedStatus.message}</p>
          )}
          {feedStatus.type === "error" && (
            <p className="text-sm text-red-700 dark:text-red-400">{feedStatus.message}</p>
          )}
        </div>
      </form>

      <form
        onSubmit={handleDeadFishSubmit}
        className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <h2 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Dead fish today
        </h2>
        <div className="space-y-3">
          <div>
            <label
              htmlFor="tailCount"
              className="mb-1 block text-sm text-zinc-700 dark:text-zinc-300"
            >
              Tail count
            </label>
            <input
              id="tailCount"
              type="number"
              inputMode="numeric"
              step="1"
              min="0"
              required
              value={tailCount}
              onChange={(e) => setTailCount(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-3 text-base text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              placeholder="e.g. 3"
            />
          </div>
          <div>
            <label
              htmlFor="avgWeight"
              className="mb-1 block text-sm text-zinc-700 dark:text-zinc-300"
            >
              Average weight per fish (kg)
            </label>
            <input
              id="avgWeight"
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              required
              value={avgWeight}
              onChange={(e) => setAvgWeight(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-3 text-base text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              placeholder="e.g. 0.25"
            />
          </div>
          <button
            type="submit"
            disabled={deadFishStatus.type === "saving"}
            className="w-full rounded-lg bg-zinc-900 py-3 text-base font-medium text-white transition disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
          >
            {deadFishStatus.type === "saving" ? "Saving..." : "Log dead fish"}
          </button>
          {deadFishStatus.type === "success" && (
            <p className="text-sm text-green-700 dark:text-green-400">{deadFishStatus.message}</p>
          )}
          {deadFishStatus.type === "error" && (
            <p className="text-sm text-red-700 dark:text-red-400">{deadFishStatus.message}</p>
          )}
        </div>
      </form>
    </div>
  );
}
