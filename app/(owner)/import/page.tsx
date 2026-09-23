import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/app/components/ui";
import ImportForm from "./ImportForm";

export const metadata: Metadata = { title: "Import spreadsheet" };
export const dynamic = "force-dynamic";

export default async function ImportPage({ searchParams }: PageProps<"/import">) {
  const { pond } = await searchParams;
  const [ponds, feedTypes] = await Promise.all([
    prisma.pond.findMany({
      orderBy: { id: "asc" },
      select: { id: true, name: true, _count: { select: { dailyLogs: true } } },
    }),
    prisma.feedType.findMany({ select: { code: true, packSizeKg: true, pricePerKg: true } }),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Digitise records"
        title="Import a pond spreadsheet"
        description="Upload the Fish Pond Performance Report exported as CSV. Fisheye reads every monthly block, checks the sheet against its own totals, and shows what it found before anything is saved."
      />
      <ImportForm
        ponds={ponds.map((entry) => ({ id: entry.id, name: entry.name, records: entry._count.dailyLogs }))}
        catalog={feedTypes}
        defaultPondId={typeof pond === "string" ? Number(pond) : null}
      />
    </>
  );
}
