"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddInventoryForm({ pondId }: { pondId: number }) {
  const router = useRouter();
  const [packingSize, setPackingSize] = useState("");
  const [gunnyQuantity, setGunnyQuantity] = useState("");
  const [status, setStatus] = useState<
    { type: "idle" | "saving" | "success" | "error"; message?: string }
  >({ type: "idle" });

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!packingSize || !gunnyQuantity) return;

    const packing = Number(packingSize);
    const gunny = Number(gunnyQuantity);
    const totalWeightKg = packing * gunny;

    setStatus({ type: "saving" });
    try {
      const response = await fetch(`/api/ponds/${pondId}/feed-inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packingSize: packing,
          gunnyQuantity: gunny,
          totalWeightKg,
        }),
      });
      if (!response.ok) throw new Error("Failed to save inventory");
      setStatus({ type: "success", message: "Inventory added." });
      setPackingSize("");
      setGunnyQuantity("");
      router.refresh();
    } catch {
      setStatus({ type: "error", message: "Could not save inventory. Try again." });
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div>
        <label
          htmlFor="packingSize"
          className="mb-1 block text-xs text-zinc-600 dark:text-zinc-400"
        >
          Packing size (kg)
        </label>
        <input
          id="packingSize"
          type="number"
          inputMode="decimal"
          step="any"
          min="0"
          required
          value={packingSize}
          onChange={(e) => setPackingSize(e.target.value)}
          className="w-28 rounded-lg border border-zinc-300 bg-white px-2 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          placeholder="20"
        />
      </div>
      <div>
        <label
          htmlFor="gunnyQuantity"
          className="mb-1 block text-xs text-zinc-600 dark:text-zinc-400"
        >
          Gunny quantity
        </label>
        <input
          id="gunnyQuantity"
          type="number"
          inputMode="decimal"
          step="any"
          min="0"
          required
          value={gunnyQuantity}
          onChange={(e) => setGunnyQuantity(e.target.value)}
          className="w-28 rounded-lg border border-zinc-300 bg-white px-2 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          placeholder="10"
        />
      </div>
      <button
        type="submit"
        disabled={status.type === "saving"}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
      >
        {status.type === "saving" ? "Saving..." : "Add inventory"}
      </button>
      {status.type === "success" && (
        <p className="text-xs text-green-700 dark:text-green-400">{status.message}</p>
      )}
      {status.type === "error" && (
        <p className="text-xs text-red-700 dark:text-red-400">{status.message}</p>
      )}
    </form>
  );
}
