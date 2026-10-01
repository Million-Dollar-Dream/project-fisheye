"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { signOut } from "../actions/session";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { useI18n } from "../components/I18nProvider";
import LanguageSwitcher from "../components/LanguageSwitcher";
import ScenarioSwitch from "../components/ScenarioSwitch";
import { MANY_PONDS } from "@/lib/farmMap";
import type { Scenario } from "@/lib/scenario";
import {
  BrandMark,
  ClipboardIcon,
  GridIcon,
  HarvestIcon,
  LogoutIcon,
  MapIcon,
  PackageIcon,
  SettingsIcon,
  UploadIcon,
  WavesIcon,
} from "../components/icons";
import { SPRING } from "../components/motion";
import { cx } from "../components/ui";


// The first TOP_ITEMS sit above the pond list; the rest are operations.
const TOP_ITEMS = 3;
const NAV: { href: string; label: MessageKey; icon: typeof GridIcon }[] = [
  { href: "/", label: "nav.overview", icon: GridIcon },
  { href: "/farms", label: "nav.farmMap", icon: MapIcon },
  { href: "/harvests", label: "nav.harvests", icon: HarvestIcon },
  { href: "/log", label: "nav.dailyLog", icon: ClipboardIcon },
  { href: "/inventory", label: "nav.feedStock", icon: PackageIcon },
  { href: "/import", label: "nav.import", icon: UploadIcon },
  { href: "/settings", label: "nav.settings", icon: SettingsIcon },
];

function isActive(pathname: string, href: string) {
  // The farm map's own farm pages (/farms/3) are sidebar items of their own.
  return href === "/" || href === "/farms" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export default function OwnerNav({
  ponds,
  userName,
  scenario,
}: {
  ponds: { id: number; name: string; farm: { id: number; name: string } | null }[];
  userName: string | null;
  /** Null when the demo scenario hasn't been built, which hides the switch. */
  scenario: Scenario | null;
}) {
  const pathname = usePathname();
  const { t } = useI18n();
  // With many ponds the sidebar lists farms instead, each opening its own
  // map and cycles; only the farm being viewed shows its ponds.
  const grouped = ponds.length > MANY_PONDS;
  const farms = new Map<number, { id: number; name: string; ponds: typeof ponds }>();
  for (const pond of ponds) {
    if (!pond.farm) continue;
    const farm = farms.get(pond.farm.id) ?? { ...pond.farm, ponds: [] };
    farm.ponds.push(pond);
    farms.set(pond.farm.id, farm);
  }
  const unassigned = ponds.filter((pond) => !pond.farm);
  const farmOpen = (farm: { id: number; ponds: typeof ponds }) =>
    isActive(pathname, `/farms/${farm.id}`) || farm.ponds.some((pond) => isActive(pathname, `/ponds/${pond.id}`));
  const pondItem = (pond: (typeof ponds)[number]) => (
    <NavItem
      key={pond.id}
      href={`/ponds/${pond.id}`}
      label={pond.name}
      icon={WavesIcon}
      active={isActive(pathname, `/ponds/${pond.id}`)}
    />
  );

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-sidebar text-sidebar-ink lg:flex">
        <Link href="/" className="flex h-16 items-center gap-3 px-5">
          <BrandMark className="size-8" />
          <span className="text-[17px] font-semibold tracking-tight text-white">Fisheye</span>
        </Link>

        <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label={t("nav.main")}>
          <ul className="space-y-0.5">
            {NAV.slice(0, TOP_ITEMS).map((item) => (
              <NavItem key={item.href} {...item} label={t(item.label)} active={isActive(pathname, item.href)} />
            ))}
          </ul>

          <p className="mt-6 mb-2 px-3 text-[11px] font-semibold tracking-wider text-sidebar-muted uppercase">
            {grouped ? t("nav.farms") : t("nav.ponds")}
          </p>
          {grouped ? (
            <ul className="space-y-0.5">
              {[...farms.values()].map((farm) => (
                <li key={farm.id}>
                  <ul>
                    <NavItem
                      href={`/farms/${farm.id}`}
                      label={farm.name}
                      icon={MapIcon}
                      count={farm.ponds.length}
                      active={isActive(pathname, `/farms/${farm.id}`)}
                    />
                  </ul>
                  {farmOpen(farm) && (
                    <ul className="my-1 ml-5 space-y-0.5 border-l border-white/10 pl-2">{farm.ponds.map(pondItem)}</ul>
                  )}
                </li>
              ))}
              {unassigned.map(pondItem)}
            </ul>
          ) : (
            <ul className="space-y-0.5">{ponds.map(pondItem)}</ul>
          )}

          <p className="mt-6 mb-2 px-3 text-[11px] font-semibold tracking-wider text-sidebar-muted uppercase">
            {t("nav.operations")}
          </p>
          <ul className="space-y-0.5">
            {NAV.slice(TOP_ITEMS).map((item) => (
              <NavItem key={item.href} {...item} label={t(item.label)} active={isActive(pathname, item.href)} />
            ))}
          </ul>
        </nav>

        <div className="border-t border-white/10 p-3">
          {scenario && <ScenarioSwitch scenario={scenario} className="mb-2" />}
          <LanguageSwitcher tone="dark" className="mb-2 w-full [&>select]:w-full" />
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white">
              {(userName ?? "Owner").slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{userName ?? t("nav.farmOwner")}</p>
              <p className="text-xs text-sidebar-muted">{t("nav.ownerWorkspace")}</p>
            </div>
            <form action={signOut}>
              <button
                type="submit"
                className="flex size-8 items-center justify-center rounded-md text-sidebar-muted hover:bg-white/10 hover:text-white"
                aria-label={t("nav.switchRole")}
                title={t("nav.switchRole")}
              >
                <LogoutIcon className="size-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-30 border-b border-white/10 bg-sidebar text-sidebar-ink lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2.5">
            <BrandMark className="size-7" />
            <span className="font-semibold tracking-tight text-white">Fisheye</span>
          </Link>
          <div className="flex items-center gap-1">
            <LanguageSwitcher tone="dark" />
            <form action={signOut}>
              <button type="submit" className="flex size-9 items-center justify-center rounded-md text-sidebar-muted" aria-label={t("nav.switchRole")}>
                <LogoutIcon className="size-4" />
              </button>
            </form>
          </div>
        </div>
        {scenario && <ScenarioSwitch scenario={scenario} className="px-4 pb-2" />}
        <nav className="overflow-x-auto px-2 pb-2" aria-label={t("nav.main")}>
          <ul className="flex min-w-max gap-1">
            {[
              ...NAV.slice(0, TOP_ITEMS).map((item) => ({ ...item, label: t(item.label) })),
              ...(grouped
                ? [...farms.values()].map((farm) => ({ href: `/farms/${farm.id}`, label: farm.name, icon: MapIcon }))
                : []),
              ...(grouped ? [] : ponds).map((pond) => ({ href: `/ponds/${pond.id}`, label: pond.name, icon: WavesIcon })),
              ...NAV.slice(TOP_ITEMS).map((item) => ({ ...item, label: t(item.label) })),
            ].map(
              (item) => (
                <li key={item.href} className="relative">
                  {isActive(pathname, item.href) && <ActivePill layoutId="mobile-nav-active" />}
                  <Link
                    href={item.href}
                    aria-current={isActive(pathname, item.href) ? "page" : undefined}
                    className={cx(
                      "relative flex h-8 items-center rounded-md px-3 text-sm font-medium transition-colors",
                      isActive(pathname, item.href) ? "text-white" : "text-sidebar-ink/80",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </nav>
      </header>
    </>
  );
}

function NavItem({
  href,
  label,
  icon: Icon,
  active,
  count,
}: {
  href: string;
  label: string;
  icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactNode;
  active: boolean;
  count?: number;
}) {
  return (
    <li className="relative">
      {active && <ActivePill layoutId="sidebar-active" />}
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={cx(
          "relative flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
          active ? "text-white" : "text-sidebar-ink/80 hover:bg-white/5 hover:text-white",
        )}
      >
        <Icon className={cx("size-4.5", active ? "text-white" : "text-sidebar-muted")} />
        <span className="flex-1 truncate">{label}</span>
        {count !== undefined && <span className="font-mono text-[11px] text-sidebar-muted tabular-nums">{count}</span>}
      </Link>
    </li>
  );
}

// The active item's highlight, which slides between items on navigation
// (the shared-layout pattern from SmoothUI's animated-tabs).
function ActivePill({ layoutId }: { layoutId: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.span
      layoutId={layoutId}
      transition={reduceMotion ? { duration: 0 } : SPRING}
      className="absolute inset-0 rounded-md bg-sidebar-active"
    />
  );
}
