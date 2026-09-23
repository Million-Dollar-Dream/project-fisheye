"use client";

import { useActionState, useState } from "react";
import { saveDailyLog, type FormState } from "@/app/actions/logs";
import { CheckIcon, FeedIcon, MinusIcon, PlusIcon, SkullIcon } from "@/app/components/icons";
import { buttonClass, cx } from "@/app/components/ui";
import { formatBags, formatKg, formatRm } from "@/lib/format";

type FeedTypeOption = { id: number; code: string; packSizeKg: number; pricePerKg: number };

type Props = {
  pondId: number;
  pondName: string;
  date: string;
  returnTo: string;
  feedTypes: FeedTypeOption[];
  existing: {
    feedTypeId: number | null;
    bags: number;
    deadCount: number;
    note: string | null;
    recordedBy: string | null;
    source: string;
  } | null;
  previous: {
    date: string;
    feedTypeId: number | null;
    feedCode: string | null;
    bags: number;
    deadCount: number;
  } | null;
  defaultFeedTypeId: number | null;
};

const QUICK_BAGS = [0.5, 1, 1.5, 2, 2.5, 3];

export default function DailyEntryForm({
  pondId,
  pondName,
  date,
  returnTo,
  feedTypes,
  existing,
  previous,
  defaultFeedTypeId,
}: Props) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(saveDailyLog, { status: "idle" });

  const initialFeed = existing
    ? existing.bags > 0 && existing.feedTypeId
      ? String(existing.feedTypeId)
      : "none"
    : String(defaultFeedTypeId ?? feedTypes[0]?.id ?? "none");
  const [feedTypeId, setFeedTypeId] = useState(initialFeed);
  const [bags, setBags] = useState(existing ? String(existing.bags || "") : "");
  const [deadCount, setDeadCount] = useState(existing ? String(existing.deadCount) : "0");

  const selected = feedTypes.find((feedType) => String(feedType.id) === feedTypeId);
  const bagsValue = Number(bags) || 0;
  const noFeed = feedTypeId === "none";
  const feedKg = selected && !noFeed ? bagsValue * selected.packSizeKg : 0;
  const errors = state.status === "error" ? state.fieldErrors ?? {} : {};

  function copyPrevious() {
    if (!previous) return;
    if (previous.bags > 0 && previous.feedTypeId) {
      setFeedTypeId(String(previous.feedTypeId));
      setBags(String(previous.bags));
    } else {
      setFeedTypeId("none");
      setBags("");
    }
  }

  function stepBags(delta: number) {
    const next = Math.max(0, Math.round((bagsValue + delta) * 2) / 2);
    setBags(next === 0 ? "" : String(next));
    if (noFeed && next > 0) setFeedTypeId(String(defaultFeedTypeId ?? feedTypes[0]?.id ?? "none"));
  }

  function stepDead(delta: number) {
    setDeadCount(String(Math.max(0, (Number(deadCount) || 0) + delta)));
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="pondId" value={pondId} />
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <input type="hidden" name="feedTypeId" value={feedTypeId} />
      <input type="hidden" name="bags" value={noFeed ? "0" : bags || "0"} />

      {existing && (
        <p className="rounded-lg bg-info-soft px-3 py-2 text-sm text-info">
          Already recorded{existing.recordedBy ? ` by ${existing.recordedBy}` : existing.source === "import" ? " from the spreadsheet" : ""}. Saving
          will update it.
        </p>
      )}

      {previous && (
        <button
          type="button"
          onClick={copyPrevious}
          className="flex w-full items-center justify-between gap-3 rounded-xl border border-dashed border-line-strong bg-surface-2 px-4 py-3 text-left text-sm hover:border-brand/50 hover:bg-brand-soft/40"
        >
          <span className="min-w-0">
            <span className="block font-medium text-ink">Same as last entry</span>
            <span className="block truncate text-ink-3">
              {previous.bags > 0 ? `${previous.feedCode} · ${formatBags(previous.bags)}` : "No feeding"}
            </span>
          </span>
          <span className="shrink-0 rounded-lg bg-surface px-3 py-1.5 font-semibold text-brand shadow-xs">Copy</span>
        </button>
      )}

      <fieldset className="rounded-xl border border-line bg-surface p-4 shadow-xs">
        <legend className="sr-only">Feed</legend>
        <div className="mb-3 flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-brand-soft text-brand">
            <FeedIcon className="size-4.5" />
          </span>
          <h2 className="font-semibold text-ink">Feed given</h2>
        </div>

        <p id="feed-type-label" className="mb-2 text-sm font-medium text-ink-2">
          Feed type
        </p>
        <div role="radiogroup" aria-labelledby="feed-type-label" className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {feedTypes.map((feedType) => {
            const active = String(feedType.id) === feedTypeId;
            return (
              <button
                key={feedType.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setFeedTypeId(String(feedType.id))}
                className={cx(
                  "flex h-14 flex-col items-center justify-center rounded-lg border text-sm font-semibold transition-colors",
                  active
                    ? "border-brand bg-brand-soft text-brand ring-1 ring-brand"
                    : "border-line bg-surface text-ink hover:border-line-strong",
                )}
              >
                {feedType.code}
                <span className={cx("text-[11px] font-normal", active ? "text-brand/80" : "text-ink-3")}>
                  {feedType.packSizeKg} kg bag
                </span>
              </button>
            );
          })}
          <button
            type="button"
            role="radio"
            aria-checked={noFeed}
            onClick={() => {
              setFeedTypeId("none");
              setBags("");
            }}
            className={cx(
              "flex h-14 items-center justify-center rounded-lg border text-sm font-semibold",
              noFeed ? "border-ink-2 bg-surface-3 text-ink ring-1 ring-ink-2" : "border-line text-ink-3 hover:border-line-strong",
            )}
          >
            No feeding
          </button>
        </div>
        {errors.feedTypeId && <p className="mt-2 text-sm text-danger">{errors.feedTypeId}</p>}

        {!noFeed && (
          <>
            <label htmlFor="bags-input" className="mt-5 mb-2 block text-sm font-medium text-ink-2">
              Bags used
            </label>
            <Stepper
              id="bags-input"
              value={bags}
              onChange={setBags}
              onStep={stepBags}
              step={0.5}
              inputMode="decimal"
              placeholder="0"
              invalid={Boolean(errors.bags)}
              unit="bags"
            />
            <div className="mt-2.5 flex flex-wrap gap-2">
              {QUICK_BAGS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setBags(String(value))}
                  className={cx(
                    "h-9 min-w-12 rounded-lg border px-3 text-sm font-medium tabular-nums",
                    bagsValue === value
                      ? "border-brand bg-brand-soft text-brand"
                      : "border-line text-ink-2 hover:border-line-strong",
                  )}
                >
                  {value}
                </button>
              ))}
            </div>
            {errors.bags && <p className="mt-2 text-sm text-danger">{errors.bags}</p>}
            <p className="mt-3 text-sm text-ink-3">
              {selected && bagsValue > 0 ? (
                <>
                  = <span className="font-semibold tabular-nums text-ink">{formatKg(feedKg)}</span> ·{" "}
                  <span className="tabular-nums">{formatRm(feedKg * selected.pricePerKg)}</span>
                </>
              ) : (
                "Enter bags or tap a quick amount."
              )}
            </p>
          </>
        )}
      </fieldset>

      <fieldset className="rounded-xl border border-line bg-surface p-4 shadow-xs">
        <legend className="sr-only">Mortality</legend>
        <div className="mb-3 flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-danger-soft text-danger">
            <SkullIcon className="size-4.5" />
          </span>
          <h2 className="font-semibold text-ink">Dead fish found</h2>
        </div>
        <label htmlFor="dead-input" className="sr-only">
          Dead fish count
        </label>
        <Stepper
          id="dead-input"
          name="deadCount"
          value={deadCount}
          onChange={setDeadCount}
          onStep={stepDead}
          step={1}
          inputMode="numeric"
          placeholder="0"
          invalid={Boolean(errors.deadCount)}
          unit="fish"
        />
        {errors.deadCount && <p className="mt-2 text-sm text-danger">{errors.deadCount}</p>}
      </fieldset>

      <details className="group rounded-xl border border-line bg-surface shadow-xs" open={Boolean(existing?.note)}>
        <summary className="flex h-12 cursor-pointer items-center justify-between px-4 text-sm font-medium text-ink-2">
          Add a note (optional)
          <PlusIcon className="size-4 transition-transform group-open:rotate-45" />
        </summary>
        <div className="px-4 pb-4">
          <label htmlFor="note" className="sr-only">
            Note
          </label>
          <textarea
            id="note"
            name="note"
            rows={3}
            maxLength={500}
            defaultValue={existing?.note ?? ""}
            placeholder="e.g. Fish slow to feed, water looked cloudy"
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-base text-ink placeholder:text-ink-3 focus:border-brand focus:outline-none"
          />
        </div>
      </details>

      {state.status === "error" && state.message && (
        <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
          {errors.date ?? state.message}
        </p>
      )}

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur">
        <div className="mx-auto max-w-2xl">
          <button type="submit" disabled={pending} className={`${buttonClass("primary", "lg")} w-full`}>
            <CheckIcon className="size-5" />
            {pending ? "Saving…" : existing ? `Update ${pondName}` : `Save ${pondName}`}
          </button>
        </div>
      </div>
    </form>
  );
}

function Stepper({
  id,
  name,
  value,
  onChange,
  onStep,
  step,
  inputMode,
  placeholder,
  invalid,
  unit,
}: {
  id: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  onStep: (delta: number) => void;
  step: number;
  inputMode: "decimal" | "numeric";
  placeholder: string;
  invalid: boolean;
  unit: string;
}) {
  return (
    <div
      className={cx(
        "flex h-14 items-stretch overflow-hidden rounded-xl border bg-surface",
        invalid ? "border-danger" : "border-line-strong focus-within:border-brand",
      )}
    >
      <button
        type="button"
        onClick={() => onStep(-step)}
        className="flex w-16 items-center justify-center border-r border-line text-ink-2 active:bg-surface-3"
        aria-label={`Decrease by ${step}`}
      >
        <MinusIcon className="size-5" />
      </button>
      <div className="relative flex flex-1 items-center">
        <input
          id={id}
          name={name}
          type="number"
          inputMode={inputMode}
          step={step === 1 ? 1 : "any"}
          min={0}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          aria-invalid={invalid}
          className="h-full w-full bg-transparent text-center text-2xl font-semibold tabular-nums text-ink placeholder:text-ink-3 focus:outline-none"
        />
        <span className="pointer-events-none absolute right-3 text-sm text-ink-3">{unit}</span>
      </div>
      <button
        type="button"
        onClick={() => onStep(step)}
        className="flex w-16 items-center justify-center border-l border-line text-ink-2 active:bg-surface-3"
        aria-label={`Increase by ${step}`}
      >
        <PlusIcon className="size-5" />
      </button>
    </div>
  );
}
