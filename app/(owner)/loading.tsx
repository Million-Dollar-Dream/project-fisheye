export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="animate-pulse">
      <div className="h-4 w-40 rounded bg-surface-3" />
      <div className="mt-3 h-8 w-72 rounded-lg bg-surface-3" />
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-32 rounded-xl border border-line bg-surface" />
        ))}
      </div>
      <div className="mt-6 h-80 rounded-xl border border-line bg-surface" />
    </div>
  );
}
