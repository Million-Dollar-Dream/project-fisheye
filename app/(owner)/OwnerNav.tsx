"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "../actions/session";
import {
  BrandMark,
  ClipboardIcon,
  GridIcon,
  LogoutIcon,
  PackageIcon,
  SettingsIcon,
  UploadIcon,
  WavesIcon,
} from "../components/icons";
import { cx } from "../components/ui";

const NAV = [
  { href: "/", label: "Overview", icon: GridIcon },
  { href: "/log", label: "Daily log", icon: ClipboardIcon },
  { href: "/inventory", label: "Feed stock", icon: PackageIcon },
  { href: "/import", label: "Import sheet", icon: UploadIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export default function OwnerNav({
  ponds,
  userName,
}: {
  ponds: { id: number; name: string }[];
  userName: string | null;
}) {
  const pathname = usePathname();

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-sidebar text-sidebar-ink lg:flex">
        <Link href="/" className="flex h-16 items-center gap-3 px-5">
          <BrandMark className="size-8" />
          <span className="text-[17px] font-semibold tracking-tight text-white">Fisheye</span>
        </Link>

        <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label="Main">
          <ul className="space-y-0.5">
            {NAV.slice(0, 1).map((item) => (
              <NavItem key={item.href} {...item} active={isActive(pathname, item.href)} />
            ))}
          </ul>

          <p className="mt-6 mb-2 px-3 text-[11px] font-semibold tracking-wider text-sidebar-muted uppercase">
            Ponds
          </p>
          <ul className="space-y-0.5">
            {ponds.map((pond) => (
              <NavItem
                key={pond.id}
                href={`/ponds/${pond.id}`}
                label={pond.name}
                icon={WavesIcon}
                active={isActive(pathname, `/ponds/${pond.id}`)}
              />
            ))}
          </ul>

          <p className="mt-6 mb-2 px-3 text-[11px] font-semibold tracking-wider text-sidebar-muted uppercase">
            Operations
          </p>
          <ul className="space-y-0.5">
            {NAV.slice(1).map((item) => (
              <NavItem key={item.href} {...item} active={isActive(pathname, item.href)} />
            ))}
          </ul>
        </nav>

        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white">
              {(userName ?? "Owner").slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{userName ?? "Farm owner"}</p>
              <p className="text-xs text-sidebar-muted">Owner workspace</p>
            </div>
            <form action={signOut}>
              <button
                type="submit"
                className="flex size-8 items-center justify-center rounded-md text-sidebar-muted hover:bg-white/10 hover:text-white"
                aria-label="Switch role"
                title="Switch role"
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
          <form action={signOut}>
            <button type="submit" className="flex size-9 items-center justify-center rounded-md text-sidebar-muted" aria-label="Switch role">
              <LogoutIcon className="size-4" />
            </button>
          </form>
        </div>
        <nav className="overflow-x-auto px-2 pb-2" aria-label="Main">
          <ul className="flex min-w-max gap-1">
            {[NAV[0], ...ponds.map((pond) => ({ href: `/ponds/${pond.id}`, label: pond.name, icon: WavesIcon })), ...NAV.slice(1)].map(
              (item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cx(
                      "flex h-8 items-center rounded-md px-3 text-sm font-medium",
                      isActive(pathname, item.href) ? "bg-sidebar-active text-white" : "text-sidebar-ink/80",
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
}: {
  href: string;
  label: string;
  icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactNode;
  active: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={cx(
          "flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
          active ? "bg-sidebar-active text-white" : "text-sidebar-ink/80 hover:bg-white/5 hover:text-white",
        )}
      >
        <Icon className={cx("size-4.5", active ? "text-[#7fd3d9]" : "text-sidebar-muted")} />
        {label}
      </Link>
    </li>
  );
}
