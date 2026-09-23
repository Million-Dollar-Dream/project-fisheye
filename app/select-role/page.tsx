import { BrandMark, ArrowRightIcon, FishIcon, WaterIcon } from "../ui";

export default async function SelectRolePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="grid min-h-dvh bg-stone-50 lg:grid-cols-2 dark:bg-stone-950">
      <section className="hidden border-r border-stone-200 bg-emerald-950 p-12 text-white lg:flex lg:flex-col lg:justify-between dark:border-white/10">
        <div className="flex items-center gap-3">
          <BrandMark />
          <span className="text-base font-semibold">Fisheye</span>
        </div>
        <div className="max-w-lg pb-8">
          <p className="mb-4 text-sm font-medium text-emerald-300">Aquaculture, simplified</p>
          <h1 className="text-balance text-5xl font-semibold leading-tight">
            Better records make healthier ponds.
          </h1>
          <p className="mt-5 max-w-md text-pretty text-base leading-7 text-emerald-100/70">
            A focused workspace for tracking daily feed, fish health, inventory, and harvest readiness.
          </p>
        </div>
        <p className="text-xs text-emerald-200/60">Pond operations · One clear view</p>
      </section>

      <main className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <BrandMark />
            <span className="font-semibold text-stone-950 dark:text-white">Fisheye</span>
          </div>

          <p className="mb-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
            Welcome back
          </p>
          <h2 className="text-balance text-3xl font-semibold text-stone-950 dark:text-white">
            How are you using Fisheye today?
          </h2>
          <p className="mt-3 text-pretty text-sm leading-6 text-stone-500 dark:text-stone-400">
            Choose your role so we can take you to the right workspace.
          </p>

          <div className="mt-8 space-y-3">
            <form action="/api/role/set" method="POST">
              <input type="hidden" name="role" value="owner" />
              <input type="hidden" name="next" value={next ?? "/"} />
              <button
                type="submit"
                className="group flex w-full items-center gap-4 rounded-2xl border border-stone-200 bg-white p-4 text-left shadow-sm hover:border-emerald-200 dark:border-white/10 dark:bg-white/5 dark:hover:border-emerald-800"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                  <WaterIcon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-stone-950 dark:text-white">
                    Farm owner
                  </span>
                  <span className="mt-1 block text-xs text-stone-500 dark:text-stone-400">
                    Review pond performance and inventory
                  </span>
                </span>
                <ArrowRightIcon className="size-4 shrink-0 text-stone-400 group-hover:text-emerald-700" />
              </button>
            </form>

            <form action="/api/role/set" method="POST">
              <input type="hidden" name="role" value="worker" />
              <input type="hidden" name="next" value={next ?? "/log"} />
              <button
                type="submit"
                className="group flex w-full items-center gap-4 rounded-2xl border border-stone-200 bg-white p-4 text-left shadow-sm hover:border-emerald-200 dark:border-white/10 dark:bg-white/5 dark:hover:border-emerald-800"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-600 dark:bg-white/10 dark:text-stone-300">
                  <FishIcon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-stone-950 dark:text-white">
                    Farm worker
                  </span>
                  <span className="mt-1 block text-xs text-stone-500 dark:text-stone-400">
                    Record today&apos;s feed and fish health
                  </span>
                </span>
                <ArrowRightIcon className="size-4 shrink-0 text-stone-400 group-hover:text-emerald-700" />
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-stone-400 dark:text-stone-500">
            You can switch roles at any time.
          </p>
        </div>
      </main>
    </div>
  );
}
