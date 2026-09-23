"use client";

import { useActionState } from "react";
import { createPond, saveFeedType } from "@/app/actions/owner";
import type { FormState } from "@/app/actions/logs";
import { CheckIcon, PlusIcon } from "@/app/components/icons";
import { buttonClass, cx, inputClass } from "@/app/components/ui";

const compactInput = `${inputClass} h-9`;

export function FeedTypeRow({
  feedType,
}: {
  feedType: { id: number; code: string; packSizeKg: number; pricePerKg: number; active: boolean; uses: number };
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(saveFeedType, { status: "idle" });
  const formId = `feed-type-${feedType.id}`;
  const errors = state.status === "error" ? state.fieldErrors ?? {} : {};
  const message = state.status === "error" ? Object.values(errors)[0] ?? state.message : null;

  return (
    <tr className="border-b border-line align-top last:border-0">
      <td className="px-5 py-2.5">
        <form id={formId} action={formAction}>
          <input type="hidden" name="id" value={feedType.id} />
        </form>
        <input
          form={formId}
          name="code"
          defaultValue={feedType.code}
          aria-label="Feed code"
          className={cx(compactInput, "w-24 font-medium uppercase", errors.code && "border-danger")}
        />
        <p className="mt-1 text-xs text-ink-3">{feedType.uses} {feedType.uses === 1 ? "day" : "days"} logged</p>
      </td>
      <td className="px-2 py-2.5">
        <input
          form={formId}
          name="packSizeKg"
          type="number"
          step="any"
          min={0}
          defaultValue={feedType.packSizeKg}
          aria-label={`${feedType.code} bag size in kg`}
          className={cx(compactInput, "w-20", errors.packSizeKg && "border-danger")}
        />
      </td>
      <td className="px-2 py-2.5">
        <input
          form={formId}
          name="pricePerKg"
          type="number"
          step="0.01"
          min={0}
          defaultValue={feedType.pricePerKg}
          aria-label={`${feedType.code} price per kg`}
          className={cx(compactInput, "w-24", errors.pricePerKg && "border-danger")}
        />
      </td>
      <td className="px-2 py-2.5">
        <label className="flex h-9 items-center">
          <input
            form={formId}
            type="checkbox"
            name="active"
            defaultChecked={feedType.active}
            aria-label={`${feedType.code} active`}
            className="size-4 accent-[var(--brand)]"
          />
        </label>
      </td>
      <td className="px-5 py-2.5 text-right">
        <button form={formId} type="submit" disabled={pending} className={buttonClass("secondary", "sm")}>
          {state.status === "success" && !pending ? <CheckIcon className="size-3.5 text-positive" /> : null}
          {pending ? "Saving" : state.status === "success" ? "Saved" : "Save"}
        </button>
        {message && <p className="mt-1 max-w-36 text-left text-xs text-danger">{message}</p>}
      </td>
    </tr>
  );
}

export function NewFeedTypeForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(saveFeedType, { status: "idle" });
  const errors = state.status === "error" ? state.fieldErrors ?? {} : {};

  return (
    <form action={formAction} className="border-t border-line p-5">
      <p className="mb-3 text-sm font-medium text-ink-2">Add a feed type</p>
      <div className="grid grid-cols-[1fr_1fr_1fr_auto] items-start gap-2">
        <input name="code" placeholder="Code" required aria-label="Feed code" className={cx(compactInput, "uppercase", errors.code && "border-danger")} />
        <input name="packSizeKg" type="number" step="any" min={0} placeholder="Bag kg" defaultValue={20} required aria-label="Bag size in kg" className={compactInput} />
        <input name="pricePerKg" type="number" step="0.01" min={0} placeholder="RM / kg" required aria-label="Price per kg" className={compactInput} />
        <button type="submit" disabled={pending} className={buttonClass("primary", "sm") + " h-9"}>
          <PlusIcon className="size-3.5" />
          Add
        </button>
      </div>
      {state.status !== "idle" && (
        <p className={cx("mt-2 text-sm", state.status === "error" ? "text-danger" : "text-positive")}>
          {state.status === "error" ? Object.values(errors)[0] ?? state.message : state.message}
        </p>
      )}
    </form>
  );
}

export function NewPondForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(createPond, { status: "idle" });
  const errors = state.status === "error" ? state.fieldErrors ?? {} : {};

  return (
    <form action={formAction} className="border-t border-line p-5">
      <p className="mb-3 text-sm font-medium text-ink-2">Add a pond</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <input name="name" placeholder="Pond name" required maxLength={40} aria-label="Pond name" className={cx(compactInput, errors.name && "border-danger")} />
        <input name="stockedAt" type="date" aria-label="Stocking date" className={cx(compactInput, errors.stockedAt && "border-danger")} />
        <button type="submit" disabled={pending} className={buttonClass("primary", "sm") + " h-9"}>
          <PlusIcon className="size-3.5" />
          Add pond
        </button>
      </div>
      {state.status === "error" && (
        <p className="mt-2 text-sm text-danger">{Object.values(errors)[0] ?? state.message}</p>
      )}
    </form>
  );
}
