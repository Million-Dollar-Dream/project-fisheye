import Link from "next/link";
import { signOut } from "../actions/session";
import { ArrowLeftIcon, BrandMark, LogoutIcon, UserIcon } from "../components/icons";
import { getSession } from "@/lib/session";

export default async function WorkerLayout({ children }: LayoutProps<"/log">) {
  const session = await getSession();

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between gap-3 px-4">
          <Link href="/log" className="flex items-center gap-2.5">
            <BrandMark className="size-8" />
            <span className="font-semibold tracking-tight text-ink">Fisheye</span>
            <span className="hidden rounded-md bg-surface-3 px-1.5 py-0.5 text-xs font-medium text-ink-2 sm:inline">
              Daily log
            </span>
          </Link>
          <div className="flex items-center gap-1">
            {session?.role === "owner" ? (
              <Link
                href="/"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-ink-2 hover:bg-surface-3"
              >
                <ArrowLeftIcon className="size-4" />
                Dashboard
              </Link>
            ) : (
              session?.name && (
                <span className="inline-flex h-9 items-center gap-1.5 px-2 text-sm text-ink-2">
                  <UserIcon className="size-4" />
                  {session.name}
                </span>
              )
            )}
            <form action={signOut}>
              <button
                type="submit"
                className="inline-flex size-9 items-center justify-center rounded-lg text-ink-3 hover:bg-surface-3 hover:text-ink"
                aria-label="Switch user"
                title="Switch user"
              >
                <LogoutIcon className="size-4.5" />
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 pt-5 pb-28">{children}</main>
    </div>
  );
}
