function Block({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-[#E6F1FB] rounded ${className}`} />;
}

function TotalValueHeaderSkeleton() {
  return (
    <div>
      <Block className="h-4 w-40 mb-2" />
      <Block className="h-10 w-56 mb-3" />
      <div className="flex items-center gap-3 mb-8">
        <Block className="h-6 w-20 rounded-full" />
        <Block className="h-4 w-28" />
      </div>
    </div>
  );
}

function StatCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
      {[0, 1, 2].map((i) => (
        <div key={i} className="bg-white border border-[#DCE7F5] rounded-xl p-4">
          <Block className="h-3 w-20 mb-2" />
          <Block className="h-6 w-24" />
        </div>
      ))}
    </div>
  );
}

function HoldingsListSkeleton() {
  return (
    <div className="lg:col-span-2 bg-white border border-[#DCE7F5] rounded-xl p-5">
      <Block className="h-4 w-20 mb-4" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center justify-between gap-3 py-3 border-b border-gray-100 last:border-0">
          <div className="min-w-0 flex-1 space-y-1.5">
            <Block className="h-4 w-14" />
            <Block className="h-3 w-32" />
            <Block className="h-3 w-24" />
          </div>
          <div className="flex-shrink-0 space-y-1.5 text-right">
            <Block className="h-4 w-16 ml-auto" />
            <Block className="h-3 w-10 ml-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}

function AllocationSkeleton() {
  return (
    <div className="bg-white border border-[#DCE7F5] rounded-xl p-5">
      <Block className="h-4 w-20 mb-4" />
      <div className="flex justify-center py-4">
        <div className="animate-pulse rounded-full border-[16px] border-[#E6F1FB] h-[168px] w-[168px]" />
      </div>
      <div className="mt-2 space-y-2">
        {[0, 1, 2].map((i) => (
          <Block key={i} className="h-3 w-full" />
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div>
      <TotalValueHeaderSkeleton />
      <StatCardsSkeleton />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <HoldingsListSkeleton />
        <AllocationSkeleton />
      </div>
    </div>
  );
}

export function InsightsSkeleton() {
  return (
    <div className="space-y-2">
      <Block className="h-3 w-full" />
      <Block className="h-3 w-full" />
      <Block className="h-3 w-2/3" />
    </div>
  );
}
