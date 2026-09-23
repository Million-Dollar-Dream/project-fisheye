import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { dayKeyToDate, formatDay, todayKey } from "@/lib/dates";
import { getFeedTypes, getPondDetail } from "@/lib/queries";
import { ClipboardIcon, DownloadIcon } from "@/app/components/icons";
import { Badge, PageHeader, Tabs, buttonClass } from "@/app/components/ui";
import PondOverview from "./PondOverview";
import PondRecords from "./PondRecords";
import PondData from "./PondData";
import PondSettingsForm from "./PondSettingsForm";

export const dynamic = "force-dynamic";

const VIEWS = ["overview", "records", "data", "settings"] as const;
type View = (typeof VIEWS)[number];

export async function generateMetadata({ params }: PageProps<"/ponds/[id]">): Promise<Metadata> {
  const detail = await getPondDetail(Number((await params).id));
  return { title: detail?.pond.name ?? "Pond" };
}

export default async function PondPage({ params, searchParams }: PageProps<"/ponds/[id]">) {
  const pondId = Number((await params).id);
  if (!Number.isInteger(pondId)) notFound();
  const query = await searchParams;
  const today = todayKey();

  const [detail, feedTypes] = await Promise.all([getPondDetail(pondId, today), getFeedTypes()]);
  if (!detail) notFound();

  const view: View = VIEWS.includes(query.view as View) ? (query.view as View) : "overview";
  const { pond, metrics } = detail;
  const warningCount = detail.imports.reduce(
    (sum, batch) => sum + batch.findings.filter((finding) => finding.severity === "warning").length,
    0,
  );
  const base = `/ponds/${pond.id}`;

  return (
    <>
      <nav className="mb-3 text-sm text-ink-3" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">
          Overview
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-ink-2">{pond.name}</span>
      </nav>

      <PageHeader
        title={pond.name}
        meta={
          <>
            {pond.species && <Badge tone="brand">{pond.species}</Badge>}
            {metrics.stockedAt ? (
              <Badge>Stocked {formatDay(dayKeyToDate(metrics.stockedAt))}</Badge>
            ) : (
              <Badge tone="warning">Stocking date not set</Badge>
            )}
            {metrics.daysOfCulture !== null && (
              <Badge>
                Day {metrics.daysOfCulture} · Month {metrics.cultureMonth}
              </Badge>
            )}
            {metrics.currentFeedCode && <Badge>Feeding {metrics.currentFeedCode}</Badge>}
          </>
        }
        actions={
          <>
            {metrics.lastLogDate && (
              <a href={`${base}/export`} className={buttonClass("secondary")}>
                <DownloadIcon className="size-4" />
                Export CSV
              </a>
            )}
            <Link href={`/log/${pond.id}?returnTo=${encodeURIComponent(`${base}?view=records`)}`} className={buttonClass("primary")}>
              <ClipboardIcon className="size-4" />
              Log today
            </Link>
          </>
        }
      />

      <Tabs
        active={view}
        items={[
          { key: "overview", label: "Overview", href: base },
          { key: "records", label: "Daily records", href: `${base}?view=records`, count: metrics.totals.daysLogged },
          { key: "data", label: "Data & imports", href: `${base}?view=data`, count: warningCount || undefined },
          { key: "settings", label: "Settings", href: `${base}?view=settings` },
        ]}
      />

      {view === "overview" && <PondOverview detail={detail} feedTypes={feedTypes} />}
      {view === "records" && (
        <PondRecords
          detail={detail}
          feedTypes={feedTypes}
          month={typeof query.month === "string" ? query.month : undefined}
          today={today}
        />
      )}
      {view === "data" && <PondData detail={detail} />}
      {view === "settings" && (
        <PondSettingsForm
          pond={{
            id: pond.id,
            name: pond.name,
            species: pond.species,
            stockedAt: metrics.stockedAt,
            stockedCount: pond.stockedCount,
            assumedFcr: pond.assumedFcr,
            active: pond.active,
          }}
        />
      )}
    </>
  );
}
