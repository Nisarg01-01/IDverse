// Loading skeleton components for better UX

export function SkeletonLine({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-zinc-800 rounded ${className}`} />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 animate-pulse">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-10 h-10 bg-zinc-800 rounded-full" />
        <div className="flex-1">
          <div className="h-4 bg-zinc-800 rounded w-1/3 mb-2" />
          <div className="h-3 bg-zinc-800 rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-3 bg-zinc-800 rounded w-full" />
        <div className="h-3 bg-zinc-800 rounded w-4/5" />
        <div className="h-3 bg-zinc-800 rounded w-3/5" />
      </div>
    </div>
  );
}

export function SkeletonCredentialList() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 animate-pulse">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-zinc-800 rounded" />
              <div>
                <div className="h-4 bg-zinc-800 rounded w-32 mb-1" />
                <div className="h-3 bg-zinc-800 rounded w-24" />
              </div>
            </div>
            <div className="h-6 bg-zinc-800 rounded w-16" />
          </div>
          <div className="h-3 bg-zinc-800 rounded w-full" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonForm() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-4 bg-zinc-800 rounded w-24 mb-2" />
        <div className="h-10 bg-zinc-800 rounded w-full" />
      </div>
      <div>
        <div className="h-4 bg-zinc-800 rounded w-32 mb-2" />
        <div className="h-10 bg-zinc-800 rounded w-full" />
      </div>
      <div>
        <div className="h-4 bg-zinc-800 rounded w-28 mb-2" />
        <div className="h-24 bg-zinc-800 rounded w-full" />
      </div>
      <div className="h-12 bg-zinc-800 rounded w-full" />
    </div>
  );
}
