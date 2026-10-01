"use client";

import { useRouter } from "next/navigation";
import { useI18n } from "@/app/components/I18nProvider";

// One dropdown instead of a chip per pond, so 100 ponds stay usable.
export default function PondFilter({
  ponds,
  value,
}: {
  ponds: { id: number; name: string; farm: { id: number; name: string } | null }[];
  value: number | null;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const farms = new Map<string, typeof ponds>();
  for (const pond of ponds) {
    const key = pond.farm?.name ?? "";
    farms.set(key, [...(farms.get(key) ?? []), pond]);
  }
  return (
    <select
      aria-label={t("harvests.filterPond")}
      value={value ?? ""}
      onChange={(event) => router.push(event.target.value ? `/harvests?pond=${event.target.value}` : "/harvests", { scroll: false })}
      className="h-9 w-full max-w-xs rounded-lg border border-line bg-surface px-3 text-sm font-medium text-ink"
    >
      <option value="">{t("harvests.allPonds")}</option>
      {[...farms.entries()].map(([farm, list]) =>
        farm ? (
          <optgroup key={farm} label={farm}>
            {list.map((pond) => (
              <option key={pond.id} value={pond.id}>
                {pond.name}
              </option>
            ))}
          </optgroup>
        ) : (
          list.map((pond) => (
            <option key={pond.id} value={pond.id}>
              {pond.name}
            </option>
          ))
        ),
      )}
    </select>
  );
}
