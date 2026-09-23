"use client";

import { useActionState } from "react";
import { updatePond } from "@/app/actions/owner";
import type { FormState } from "@/app/actions/logs";
import { CheckCircleIcon } from "@/app/components/icons";
import { Card, CardHeader, Field, buttonClass, cx, inputClass } from "@/app/components/ui";

type Pond = {
  id: number;
  name: string;
  species: string | null;
  stockedAt: string | null;
  stockedCount: number | null;
  assumedFcr: number;
  active: boolean;
};

export default function PondSettingsForm({ pond }: { pond: Pond }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(updatePond, { status: "idle" });
  const errors = state.status === "error" ? state.fieldErrors ?? {} : {};

  return (
    <Card className="max-w-3xl">
      <CardHeader title="Pond settings" description="Stocking details drive days of culture, survival and FCR." />
      <form action={formAction} className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
        <input type="hidden" name="id" value={pond.id} />
        <Field label="Pond name" htmlFor="name" hint={errors.name}>
          <input id="name" name="name" defaultValue={pond.name} required maxLength={40} className={cx(inputClass, errors.name && "border-danger")} />
        </Field>
        <Field label="Species" htmlFor="species" hint="e.g. Red tilapia, Jade perch">
          <input id="species" name="species" defaultValue={pond.species ?? ""} maxLength={60} className={inputClass} />
        </Field>
        <Field label="Stocking date" htmlFor="stockedAt" hint={errors.stockedAt ?? "Start of this culture cycle (month 0)."}>
          <input
            id="stockedAt"
            name="stockedAt"
            type="date"
            defaultValue={pond.stockedAt ?? ""}
            className={cx(inputClass, errors.stockedAt && "border-danger")}
          />
        </Field>
        <Field label="Fish stocked" htmlFor="stockedCount" hint={errors.stockedCount ?? "Number of fingerlings. Unlocks survival and actual FCR."}>
          <input
            id="stockedCount"
            name="stockedCount"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            defaultValue={pond.stockedCount ?? ""}
            placeholder="e.g. 5000"
            className={cx(inputClass, errors.stockedCount && "border-danger")}
          />
        </Field>
        <Field
          label="Assumed FCR"
          htmlFor="assumedFcr"
          hint={errors.assumedFcr ?? "Kg of feed per kg of fish. The spreadsheet uses 1.35."}
        >
          <input
            id="assumedFcr"
            name="assumedFcr"
            type="number"
            inputMode="decimal"
            step="0.01"
            min={0.5}
            max={5}
            defaultValue={pond.assumedFcr}
            required
            className={cx(inputClass, errors.assumedFcr && "border-danger")}
          />
        </Field>
        <div className="flex items-end">
          <label className="flex h-10 items-center gap-2.5 text-sm text-ink-2">
            <input type="checkbox" name="active" defaultChecked={pond.active} className="size-4 accent-[var(--brand)]" />
            Active (shown on the dashboard and daily log)
          </label>
        </div>

        <div className="flex items-center gap-3 border-t border-line pt-5 sm:col-span-2">
          <button type="submit" disabled={pending} className={buttonClass("primary")}>
            {pending ? "Saving…" : "Save settings"}
          </button>
          {state.status === "success" && (
            <p role="status" className="flex items-center gap-1.5 text-sm text-positive">
              <CheckCircleIcon className="size-4" />
              {state.message}
            </p>
          )}
          {state.status === "error" && !state.fieldErrors && (
            <p role="alert" className="text-sm text-danger">
              {state.message}
            </p>
          )}
        </div>
      </form>
    </Card>
  );
}
