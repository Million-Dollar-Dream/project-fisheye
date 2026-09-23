"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, PlusIcon } from "../../ui";

const fieldClass =
  "h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm tabular-nums text-stone-950 shadow-sm placeholder:text-stone-400 hover:border-stone-400 focus:border-emerald-700 dark:border-white/15 dark:bg-white/5 dark:text-white dark:placeholder:text-stone-600 dark:hover:border-white/25";

export default function AddInventoryForm({ pondId }: { pondId: number }) {
  const router = useRouter();
  const [packingSize, setPackingSize] = useState("");
  const [gunnyQuantity, setGunnyQuantity] = useState("");
  const [status, setStatus] = useState<{
    type: "idle" | "saving" | "success" | "error";
    message?: string;
  }>({ type: "idle" });

  const totalWeight = Number(packingSize) * Number(gunnyQuantity);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!packingSize || !gunnyQuantity) return;

    const packing = Number(packingSize);
    const gunny = Number(gunnyQuantity);

    setStatus({ type: "saving" });
    try {
      const response = await fetch(`/api/ponds/${pondId}/feed-inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packingSize: packing,
          gunnyQuantity: gunny,
          totalWeightKg: packing * gunny,
        }),
      });
      if (!response.ok) throw new Error("Failed to save inventory");
      setStatus({ type: "success", message: "Inventory added." });
      setPackingSize("");
      setGunnyQuantity("");
      router.refresh();
    } catch {
      setStatus({ type: "error", message: "Could not add inventory. Try again." });
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5 dark:border-white/10 dark:bg-white/5"
    >
      <div className="mb-4 flex items-center gap-2">
        <PlusIcon className="size-4 text-emerald-700 dark:text-emerald-400" />
        <h3 className="text-sm font-semibold text-stone-900 dark:text-white">Add inventory</h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div>
          <label htmlFor="packingSize" className="mb-2 block text-xs font-medium text-stone-600 dark:text-stone-400">
            Bag size (kg)
          </label>
          <input
            id="packingSize"
            type="number"
            inputMode="decimal"
            step="any"
            min="0"
            required
            value={packingSize}
            onChange={(event) => setPackingSize(event.target.value)}
            className={fieldClass}
            placeholder="20"
          />
        </div>
        <div>
          <label htmlFor="gunnyQuantity" className="mb-2 block text-xs font-medium text-stone-600 dark:text-stone-400">
            Number of bags
          </label>
          <input
            id="gunnyQuantity"
            type="number"
            inputMode="decimal"
            step="any"
            min="0"
            required
            value={gunnyQuantity}
            onChange={(event) => setGunnyQuantity(event.target.value)}
            className={fieldClass}
            placeholder="10"
          />
        </div>
        <button
          type="submit"
          disabled={status.type === "saving"}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-500"
        >
          {status.type === "saving" ? "Adding…" : "Add stock"}
        </button>
      </div>
      {packingSize && gunnyQuantity && (
        <p className="mt-3 text-xs text-stone-500 dark:text-stone-400">
          Total weight: <span className="font-medium tabular-nums text-stone-700 dark:text-stone-300">{totalWeight.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg</span>
        </p>
      )}
      {status.type === "success" && (
        <p role="status" className="mt-3 flex items-center gap-1.5 text-pretty text-sm text-emerald-700 dark:text-emerald-400">
          <CheckIcon className="size-4" />
          {status.message}
        </p>
      )}
      {status.type === "error" && (
        <p role="alert" className="mt-3 text-pretty text-sm text-red-700 dark:text-red-400">{status.message}</p>
      )}
    </form>
  );
}
