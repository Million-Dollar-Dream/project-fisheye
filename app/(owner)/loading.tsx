export default function Loading() {
  return (
    <div aria-busy="true" aria-label="…">
      <div className="shimmer h-4 w-40 rounded" />
      <div className="shimmer mt-3 h-8 w-72 max-w-full rounded-lg" />
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-32 rounded-lg border border-line bg-surface p-5">
            <div className="shimmer h-3.5 w-24 rounded" />
            <div className="shimmer mt-4 h-7 w-32 rounded-md" />
            <div className="shimmer mt-3 h-3 w-20 rounded" />
          </div>
        ))}
      </div>
      <div className="mt-6 h-80 rounded-lg border border-line bg-surface p-5">
        <div className="shimmer h-4 w-36 rounded" />
        <div className="shimmer mt-6 h-56 rounded-lg" />
      </div>
    </div>
  );
}
