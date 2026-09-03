import { Skeleton } from "@/components/ui/skeleton"

export default function HomeLoading() {
  return (
    <div className="relative overflow-x-hidden min-h-screen">
      {/* Header Skeleton */}
      <header className="glass-panel rounded-[20px] flex justify-between items-center py-4 px-5 md:px-8 top-4 z-40 fixed w-[calc(100%-2rem)] max-w-5xl mx-auto left-0 right-0">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <Skeleton className="h-6 w-32 rounded-md hidden sm:block" />
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <Skeleton className="h-4 w-24 mb-1 rounded-sm" />
            <Skeleton className="h-3 w-16 ml-auto rounded-sm" />
          </div>
          <Skeleton className="w-10 h-10 rounded-full" />
          <Skeleton className="h-10 w-20 rounded-xl" />
        </div>
      </header>

      {/* Main Content Skeleton */}
      <main className="max-w-5xl mx-auto min-h-screen px-5 pt-32 pb-24 relative z-0 md:px-8">
        
        {/* Welcome Section */}
        <section className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32 rounded-sm" />
              <Skeleton className="h-9 w-64 rounded-md" />
              <Skeleton className="h-5 w-48 rounded-sm" />
            </div>
          </div>
        </section>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            {/* Quick Actions */}
            <section>
              <div className="flex justify-between items-end mb-4">
                <Skeleton className="h-6 w-36 rounded-sm" />
                <Skeleton className="h-4 w-32 rounded-sm" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                <Skeleton className="rounded-2xl min-h-[160px] sm:min-h-[180px] h-full w-full" />
                <Skeleton className="rounded-2xl min-h-[160px] sm:min-h-[180px] h-full w-full" />
                <Skeleton className="rounded-2xl min-h-[160px] sm:min-h-[180px] h-full w-full" />
                <Skeleton className="rounded-2xl min-h-[160px] sm:min-h-[180px] h-full w-full" />
              </div>
            </section>

            {/* Requires Attention */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <Skeleton className="h-6 w-48 rounded-sm" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
              <div className="flex flex-col gap-3">
                <Skeleton className="rounded-2xl h-[100px] w-full" />
                <Skeleton className="rounded-2xl h-[100px] w-full" />
              </div>
            </section>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Recent Events */}
            <section className="glass-panel rounded-[24px] p-6">
              <div className="flex justify-between items-center mb-6">
                <Skeleton className="h-6 w-36 rounded-sm" />
                <Skeleton className="h-4 w-20 rounded-sm" />
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex justify-between">
                  <div className="flex gap-4">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-32 rounded-sm" />
                      <Skeleton className="h-4 w-24 rounded-sm" />
                    </div>
                  </div>
                  <div className="space-y-2 text-right">
                    <Skeleton className="h-5 w-16 ml-auto rounded-sm" />
                    <Skeleton className="h-4 w-12 ml-auto rounded-sm" />
                  </div>
                </div>
                <div className="flex justify-between">
                  <div className="flex gap-4">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-32 rounded-sm" />
                      <Skeleton className="h-4 w-24 rounded-sm" />
                    </div>
                  </div>
                  <div className="space-y-2 text-right">
                    <Skeleton className="h-5 w-16 ml-auto rounded-sm" />
                    <Skeleton className="h-4 w-12 ml-auto rounded-sm" />
                  </div>
                </div>
              </div>
            </section>

            {/* Recent Activity */}
            <section className="glass-panel rounded-[24px] p-6 flex-grow">
              <div className="flex justify-between items-center mb-6">
                <Skeleton className="h-6 w-36 rounded-sm" />
                <Skeleton className="h-4 w-16 rounded-sm" />
              </div>
              <div className="flex flex-col gap-5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="w-2 h-2 rounded-full mt-1.5 shrink-0" />
                    <div className="space-y-2 w-full">
                      <Skeleton className="h-4 w-full max-w-[240px] rounded-sm" />
                      <Skeleton className="h-3 w-3/4 max-w-[180px] rounded-sm" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
