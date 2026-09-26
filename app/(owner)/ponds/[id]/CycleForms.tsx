"use client";

import { useActionState, useState } from "react";
import { closeCycle, startCycle } from "@/app/actions/owner";
import type { FormState } from "@/app/actions/logs";
import { CheckCircleIcon, CheckIcon, XIcon } from "@/app/components/icons";
import { Card, CardHeader, Field, buttonClass, cx, inputClass } from "@/app/components/ui";
import { fcrRating } from "@/lib/cycle";

const LOSS_CAUSES = ["Disease", "Low oxygen / water quality", "Flood or overflow", "Predators or theft", "Other"];

function FormFooter({ state, pending, label, danger }: { state: FormState; pending: boolean; label: string; danger?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5 sm:col-span-2">
      <button type="submit" disabled={pending} className={buttonClass(danger ? "danger" : "primary")}>
        {pending ? "Saving…" : label}
      </button>
      {state.status === "success" && (
        <p role="status" className="flex items-center gap-1.5 text-sm text-positive">
          <CheckCircleIcon className="size-4" />
          {state.message}
        </p>
      )}
      {state.status === "error" && (
        <p role="alert" className="text-sm text-danger">
          {state.message}
        </p>
      )}
    </div>
  );
}

export function CloseCycleForm({
  pondId,
  today,
  stockedAt,
  estimatedKg,
  fishLeft,
  allDead,
  feedKg,
  targetFcr,
}: {
  pondId: number;
  today: string;
  stockedAt: string;
  estimatedKg: number;
  // Stocked minus recorded deaths, when the stocked count is known.
  fishLeft: number | null;
  allDead: boolean;
  // Feed used this cycle, for the final FCR as the harvest weight is typed.
  feedKg: number;
  targetFcr: number;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(closeCycle, { status: "idle" });
  const [outcome, setOutcome] = useState<"harvested" | "lost">(allDead ? "lost" : "harvested");
  const errors = state.status === "error" ? state.fieldErrors ?? {} : {};
  const lost = outcome === "lost";
  const [harvestKg, setHarvestKg] = useState("");
  const finalFcr = Number(harvestKg) > 0 && feedKg > 0 ? feedKg / Number(harvestKg) : null;

  return (
    <Card>
      <CardHeader
        title="Close this cycle"
        description="Record the harvest, or the loss if the whole pond died. The pond is then empty until you restock it."
      />
      <form action={formAction} className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
        <input type="hidden" name="pondId" value={pondId} />
        <fieldset className="sm:col-span-2">
          <legend className="mb-1.5 text-sm font-medium text-ink-2">What happened?</legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {(
              [
                { value: "harvested", title: "Harvested", detail: "Fish were sold or moved out.", icon: CheckIcon },
                { value: "lost", title: "Whole pond lost", detail: "The stock died, e.g. disease or low oxygen.", icon: XIcon },
              ] as const
            ).map((option) => (
              <label
                key={option.value}
                className={cx(
                  "flex cursor-pointer items-start gap-3 rounded-lg border p-3",
                  outcome === option.value
                    ? option.value === "lost"
                      ? "border-danger bg-danger-soft"
                      : "border-brand bg-brand-soft"
                    : "border-line hover:border-line-strong",
                )}
              >
                <input
                  type="radio"
                  name="outcome"
                  value={option.value}
                  checked={outcome === option.value}
                  onChange={() => setOutcome(option.value)}
                  className="sr-only"
                />
                <span
                  className={cx(
                    "flex size-7 shrink-0 items-center justify-center rounded-full",
                    option.value === "lost" ? "bg-danger text-white" : "bg-positive text-white",
                  )}
                >
                  <option.icon className="size-4" strokeWidth={2.4} />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-ink">{option.title}</span>
                  <span className="block text-xs text-ink-3">{option.detail}</span>
                </span>
              </label>
            ))}
          </div>
          {allDead && (
            <p className="mt-2 text-xs text-danger">Recorded deaths already equal the number stocked.</p>
          )}
        </fieldset>

        <Field label={lost ? "Date of loss" : "Harvest date"} htmlFor="endedAt" hint={errors.endedAt}>
          <input
            id="endedAt"
            name="endedAt"
            type="date"
            defaultValue={today}
            min={stockedAt}
            max={today}
            required
            className={cx(inputClass, errors.endedAt && "border-danger")}
          />
        </Field>

        {lost ? (
          <Field label="Cause" htmlFor="cause" hint={errors.cause}>
            <select id="cause" name="cause" defaultValue="" required className={cx(inputClass, errors.cause && "border-danger")}>
              <option value="" disabled>
                Choose…
              </option>
              {LOSS_CAUSES.map((cause) => (
                <option key={cause}>{cause}</option>
              ))}
            </select>
          </Field>
        ) : (
          <Field
            label="Harvested weight (kg)"
            htmlFor="harvestKg"
            hint={
              errors.harvestKg ??
              (finalFcr !== null ? (
                <>
                  Cycle FCR would be{" "}
                  <span
                    className={cx(
                      "font-semibold tabular-nums",
                      { good: "text-positive", watch: "text-warning", high: "text-danger" }[fcrRating(finalFcr, targetFcr)],
                    )}
                  >
                    {finalFcr.toFixed(2)}
                  </span>{" "}
                  ({Math.round(feedKg).toLocaleString("en-MY")} kg feed, target {targetFcr}).
                </>
              ) : (
                `Estimated standing stock is about ${Math.round(estimatedKg).toLocaleString("en-MY")} kg.`
              ))
            }
          >
            <input
              id="harvestKg"
              name="harvestKg"
              type="number"
              inputMode="decimal"
              step="0.1"
              min={0}
              required
              value={harvestKg}
              onChange={(event) => setHarvestKg(event.target.value)}
              className={cx(inputClass, errors.harvestKg && "border-danger")}
            />
          </Field>
        )}

        <Field
          label={lost ? "Fish lost in the final event" : "Fish harvested"}
          htmlFor="fishCount"
          hint={
            errors.fishCount ??
            (lost
              ? fishLeft !== null
                ? `About ${fishLeft.toLocaleString("en-MY")} were still alive before this, from stocking less recorded deaths.`
                : "Optional."
              : "Optional. Used for survival rate.")
          }
        >
          <input
            key={outcome}
            id="fishCount"
            name="fishCount"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            defaultValue={lost && fishLeft !== null ? fishLeft : ""}
            className={cx(inputClass, errors.fishCount && "border-danger")}
          />
        </Field>

        <Field label="Note" htmlFor="note" hint="Optional, e.g. buyer, price, what was seen before the loss.">
          <input id="note" name="note" maxLength={300} className={inputClass} />
        </Field>

        <FormFooter state={state} pending={pending} label={lost ? "Close cycle as a loss" : "Record harvest"} danger={lost} />
      </form>
    </Card>
  );
}

export function StartCycleForm({
  pondId,
  today,
  minDate,
  suggestion,
}: {
  pondId: number;
  today: string;
  minDate: string | null;
  suggestion: string | null;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(startCycle, { status: "idle" });
  const errors = state.status === "error" ? state.fieldErrors ?? {} : {};

  return (
    <Card>
      <CardHeader title="Start a new cycle" description="Enter the day fingerlings went in. The planned harvest date follows from the cycle length." />
      {suggestion && (
        <p className="mx-5 mt-4 rounded-lg bg-info-soft px-3 py-2.5 text-sm text-info">{suggestion}</p>
      )}
      <form action={formAction} className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
        <input type="hidden" name="pondId" value={pondId} />
        <Field label="Stocking date" htmlFor="startStockedAt" hint={errors.stockedAt}>
          <input
            id="startStockedAt"
            name="stockedAt"
            type="date"
            defaultValue={today}
            min={minDate ?? undefined}
            max={today}
            required
            className={cx(inputClass, errors.stockedAt && "border-danger")}
          />
        </Field>
        <Field label="Fish stocked" htmlFor="startStockedCount" hint={errors.stockedCount ?? "Number of fingerlings."}>
          <input
            id="startStockedCount"
            name="stockedCount"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            placeholder="e.g. 5000"
            className={cx(inputClass, errors.stockedCount && "border-danger")}
          />
        </Field>
        <FormFooter state={state} pending={pending} label="Start cycle" />
      </form>
    </Card>
  );
}
