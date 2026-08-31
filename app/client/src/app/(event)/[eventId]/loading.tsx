export default function EventHomeLoading() {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 animate-pulse">
      <div className="flex flex-col gap-8 lg:col-span-7">
        <section className="mb-2 flex flex-col items-center text-center">
          <div className="mb-4 h-16 w-16 rounded-full bg-muted"></div>
          <div className="mb-2 h-10 w-48 rounded bg-muted"></div>
          <div className="mb-2 h-4 w-64 rounded bg-muted"></div>
          <div className="h-4 w-32 rounded bg-muted"></div>
        </section>

        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 rounded-2xl bg-muted"></div>
          <div className="h-24 rounded-2xl bg-muted"></div>
        </div>
        
        <div className="h-48 rounded-2xl bg-muted"></div>
      </div>

      <aside className="flex flex-col gap-6 lg:col-span-5">
        <div className="h-64 rounded-2xl bg-muted"></div>
        <div className="h-64 rounded-2xl bg-muted"></div>
      </aside>
    </div>
  )
}
