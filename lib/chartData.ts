export type MonthlyPoint = {
  label: string;
  value: number;
};

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: "short",
    year: "2-digit",
  });
}

export function aggregateByMonth<T>(
  records: T[],
  getDate: (record: T) => Date,
  getValue: (record: T) => number,
): MonthlyPoint[] {
  const totals = new Map<string, number>();
  for (const record of records) {
    const key = monthKey(getDate(record));
    totals.set(key, (totals.get(key) ?? 0) + getValue(record));
  }

  return Array.from(totals.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([key, value]) => ({ label: monthLabel(key), value }));
}
