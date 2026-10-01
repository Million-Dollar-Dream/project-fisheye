import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/app/components/ui";
import { getI18n } from "@/lib/i18n/server";
import ImportForm from "./ImportForm";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("pond.importSpreadsheet") };
}
export const dynamic = "force-dynamic";

export default async function ImportPage({ searchParams }: PageProps<"/import">) {
  const { pond } = await searchParams;
  const { t } = await getI18n();
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
        eyebrow={t("import.eyebrow")}
        title={t("import.title")}
        description={t("import.description")}
      />
      <ImportForm
        ponds={ponds.map((entry) => ({ id: entry.id, name: entry.name, records: entry._count.dailyLogs }))}
        catalog={feedTypes}
        defaultPondId={typeof pond === "string" ? Number(pond) : null}
      />
    </>
  );
}
