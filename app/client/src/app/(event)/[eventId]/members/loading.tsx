import { ChevronLeft } from "lucide-react"

export default function MembersLoading() {
  return (
    <div className="max-w-2xl mx-auto w-full">
      <div className="bg-[#151a30]/50 backdrop-blur-xl border border-white/5 rounded-[24px] p-6 shadow-2xl animate-pulse">
        <div className="flex items-center gap-2 mb-4">
          <ChevronLeft className="size-4 text-muted" />
          <div className="h-4 w-12 bg-muted rounded"></div>
        </div>
        
        <div className="flex flex-row justify-between items-start mb-8">
          <div className="flex flex-col items-start gap-2">
            <div className="h-8 w-48 bg-muted rounded"></div>
            <div className="h-4 w-24 bg-muted rounded"></div>
          </div>
          <div className="h-10 w-24 bg-muted rounded-lg"></div>
        </div>

        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-muted/20 border border-white/5 rounded-2xl">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-muted rounded-full"></div>
                <div className="flex flex-col gap-2">
                  <div className="h-4 w-32 bg-muted rounded"></div>
                  <div className="h-3 w-20 bg-muted rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
