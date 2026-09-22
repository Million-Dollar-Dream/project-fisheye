export default async function SelectRolePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <main className="w-full max-w-sm">
        <h1 className="mb-1 text-center text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Fisheye
        </h1>
        <p className="mb-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Who&apos;s using this device?
        </p>
        <div className="space-y-3">
          <form action="/api/role/set" method="POST">
            <input type="hidden" name="role" value="owner" />
            <input type="hidden" name="next" value={next ?? "/"} />
            <button
              type="submit"
              className="w-full rounded-lg bg-zinc-900 py-4 text-base font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
            >
              Farm Owner
            </button>
          </form>
          <form action="/api/role/set" method="POST">
            <input type="hidden" name="role" value="worker" />
            <input type="hidden" name="next" value={next ?? "/log"} />
            <button
              type="submit"
              className="w-full rounded-lg border border-zinc-300 bg-white py-4 text-base font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            >
              Farm Worker
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
