import type { Metadata } from "next";
import { cookies } from "next/headers";
import { signIn } from "../actions/session";
import { ArrowRightIcon, BrandMark, ChartIcon, ClipboardIcon, FileIcon, UserIcon } from "../components/icons";
import { buttonClass, inputClass } from "../components/ui";
import { NAME_COOKIE } from "@/lib/role";

export const metadata: Metadata = { title: "Sign in" };

export default async function SelectRolePage({ searchParams }: PageProps<"/select-role">) {
  const { next } = await searchParams;
  const savedName = (await cookies()).get(NAME_COOKIE)?.value ?? "";
  const nextPath = typeof next === "string" ? next : "";

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden overflow-hidden bg-sidebar p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(900px 500px at 10% 110%, rgba(20,163,173,0.35), transparent 60%), radial-gradient(700px 400px at 100% 0%, rgba(11,110,121,0.35), transparent 60%)",
          }}
        />
        <div className="relative flex items-center gap-3">
          <BrandMark className="size-9" />
          <span className="text-lg font-semibold tracking-tight">Fisheye</span>
        </div>

        <div className="relative max-w-xl">
          <p className="mb-4 text-sm font-medium text-[#7fd3d9]">Pond performance records</p>
          <h1 className="text-balance text-[44px] leading-[1.1] font-semibold tracking-tight">
            From the pond-side spreadsheet to one live view of the farm.
          </h1>
          <p className="mt-5 max-w-lg text-pretty text-base leading-7 text-sidebar-ink/75">
            Workers log feed and mortality from their phones. Owners see feed cost, growth and projected
            harvest for every pond, with the history carried over from the existing sheets.
          </p>

          <ul className="mt-10 grid gap-4 text-sm text-sidebar-ink/85 sm:grid-cols-3">
            <HeroPoint icon={<FileIcon className="size-4" />} title="Digitised">
              Existing pond sheets imported and cross-checked
            </HeroPoint>
            <HeroPoint icon={<ClipboardIcon className="size-4" />} title="Daily entry">
              Built for phones, one screen per pond
            </HeroPoint>
            <HeroPoint icon={<ChartIcon className="size-4" />} title="Decisions">
              Feed cost, FCR, growth and harvest estimates
            </HeroPoint>
          </ul>
        </div>

        <p className="relative text-xs text-sidebar-muted">Phase 1 · Pond records and daily logging</p>
      </section>

      <main className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <BrandMark className="size-9" />
            <span className="text-lg font-semibold tracking-tight text-ink">Fisheye</span>
          </div>

          <h2 className="text-balance text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Who is using Fisheye?
          </h2>
          <p className="mt-2 text-pretty text-sm leading-6 text-ink-2">
            Choose a workspace. You can switch at any time.
          </p>

          <div className="mt-8 space-y-4">
            <form action={signIn} className="rounded-xl border border-line bg-surface p-5 shadow-xs">
              <input type="hidden" name="role" value="owner" />
              <input type="hidden" name="next" value={nextPath} />
              <div className="flex items-start gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                  <ChartIcon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-ink">Farm owner</h3>
                  <p className="mt-0.5 text-sm text-ink-3">
                    Dashboard, pond performance, feed stock and spreadsheet import.
                  </p>
                </div>
              </div>
              <button type="submit" className={`${buttonClass("primary", "md")} mt-4 w-full`}>
                Open dashboard
                <ArrowRightIcon className="size-4" />
              </button>
            </form>

            <form action={signIn} className="rounded-xl border border-line bg-surface p-5 shadow-xs">
              <input type="hidden" name="role" value="worker" />
              <input type="hidden" name="next" value={nextPath} />
              <div className="flex items-start gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-surface-3 text-ink-2">
                  <ClipboardIcon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-ink">Farm worker</h3>
                  <p className="mt-0.5 text-sm text-ink-3">
                    Record today&apos;s feed, dead fish and sample weights.
                  </p>
                </div>
              </div>
              <label htmlFor="worker-name" className="mt-4 mb-1.5 block text-sm font-medium text-ink-2">
                Your name
              </label>
              <div className="relative">
                <UserIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3" />
                <input
                  id="worker-name"
                  name="name"
                  defaultValue={savedName}
                  required
                  maxLength={40}
                  autoComplete="given-name"
                  placeholder="e.g. Ahmad"
                  className={`${inputClass} h-11 pl-9 text-base`}
                />
              </div>
              <button type="submit" className={`${buttonClass("secondary", "md")} mt-3 w-full`}>
                Start daily log
                <ArrowRightIcon className="size-4" />
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

function HeroPoint({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <li className="rounded-lg border border-white/10 bg-white/5 p-4">
      <span className="mb-3 flex size-7 items-center justify-center rounded-md bg-white/10 text-[#7fd3d9]">{icon}</span>
      <p className="font-semibold text-white">{title}</p>
      <p className="mt-1 text-xs leading-5 text-sidebar-ink/70">{children}</p>
    </li>
  );
}
