"use client";

import { useActionState, useState } from "react";
import { recordStockMovement } from "@/app/actions/owner";
import type { FormState } from "@/app/actions/logs";
import { CheckCircleIcon } from "@/app/components/icons";
import { Card, CardHeader, Field, buttonClass, cx, inputClass } from "@/app/components/ui";

export default function StockMovementForm({
  feedTypes,
  today,
}: {
  feedTypes: { id: number; code: string }[];
  today: string;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(recordStockMovement, { status: "idle" });
  const [kind, setKind] = useState<"count" | "delivery">("count");
  const errors = state.status === "error" ? state.fieldErrors ?? {} : {};

  return (
    <Card className="h-fit">
      <CardHeader title="Record stock" description="Count the store, or add a delivery." />
      <form action={formAction} className="space-y-4 p-5">
        <input type="hidden" name="kind" value={kind} />
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-surface-3 p-1" role="radiogroup" aria-label="Movement type">
          {(["count", "delivery"] as const).map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={kind === option}
              onClick={() => setKind(option)}
              className={cx(
                "h-8 rounded-md text-sm font-medium",
                kind === option ? "bg-surface text-ink shadow-xs" : "text-ink-3 hover:text-ink",
              )}
            >
              {option === "count" ? "Stocktake" : "Delivery"}
            </button>
          ))}
        </div>

        <Field label="Feed type" htmlFor="feedTypeId" hint={errors.feedTypeId}>
          <select id="feedTypeId" name="feedTypeId" className={inputClass} required defaultValue="">
            <option value="" disabled>
              Choose
            </option>
            {feedTypes.map((feedType) => (
              <option key={feedType.id} value={feedType.id}>
                {feedType.code}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={kind === "count" ? "Bags in store" : "Bags received"} htmlFor="bags" hint={errors.bags}>
            <input
              id="bags"
              name="bags"
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              required
              className={cx(inputClass, errors.bags && "border-danger")}
            />
          </Field>
          <Field label="Date" htmlFor="date" hint={errors.date}>
            <input id="date" name="date" type="date" max={today} defaultValue={today} required className={inputClass} />
          </Field>
        </div>
        <Field label="Note (optional)" htmlFor="stock-note">
          <input
            id="stock-note"
            name="note"
            maxLength={200}
            placeholder={kind === "delivery" ? "Supplier, invoice no." : "Counted by"}
            className={inputClass}
          />
        </Field>
        <button type="submit" disabled={pending} className={`${buttonClass("primary")} w-full`}>
          {pending ? "Saving…" : kind === "count" ? "Save stocktake" : "Save delivery"}
        </button>
        {state.status === "success" && (
          <p role="status" className="flex items-center gap-1.5 text-sm text-positive">
            <CheckCircleIcon className="size-4" />
            {state.message}
          </p>
        )}
        <p className="text-xs leading-5 text-ink-3">
          A stocktake resets the balance to what&apos;s physically in the store at the end of that day. Bags logged by
          workers afterwards are subtracted automatically.
        </p>
      </form>
    </Card>
  );
}
