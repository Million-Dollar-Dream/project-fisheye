export default function Loading() {
  return (
    <div className="min-h-dvh bg-stone-50 dark:bg-stone-950">
      <div className="h-16 border-b border-stone-200 bg-white dark:border-white/10 dark:bg-stone-950" />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="h-4 w-28 rounded bg-stone-200 dark:bg-white/10" />
        <div className="mt-4 h-10 w-full max-w-md rounded-lg bg-stone-200 dark:bg-white/10" />
        <div className="mt-3 h-5 w-full max-w-xl rounded bg-stone-100 dark:bg-white/5" />
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-36 rounded-2xl border border-stone-200 bg-white dark:border-white/10 dark:bg-white/5" />
          ))}
        </div>
        <div className="mt-10 h-6 w-40 rounded bg-stone-200 dark:bg-white/10" />
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {[0, 1].map((item) => (
            <div key={item} className="h-48 rounded-2xl border border-stone-200 bg-white dark:border-white/10 dark:bg-white/5" />
          ))}
        </div>
      </main>
    </div>
  );
}
