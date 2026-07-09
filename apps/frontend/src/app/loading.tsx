export default function RootLoading() {
  return (
    <div className="container-luxury flex min-h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <p className="text-sm text-muted">Loading…</p>
      </div>
    </div>
  );
}
