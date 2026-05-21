
function SmallTimelineChart({ findings }: { findings: any[] }) {
  const days = 14;
  const buckets: { label: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    buckets.push({ label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }), count: 0 });
  }
  findings.forEach((f) => {
    const ts = (f.createdAt && f.createdAt.toDate) ? f.createdAt.toDate() : f.createdAt ? new Date(f.createdAt) : null;
    if (!ts) return;
    const idx = buckets.findIndex((b, idxLocal) => {
      const day = new Date();
      day.setDate(new Date().getDate() - (days - 1 - idxLocal));
      return ts.getDate() === day.getDate() && ts.getMonth() === day.getMonth() && ts.getFullYear() === day.getFullYear();
    });
    if (idx >= 0) buckets[idx].count += 1;
  });

  const max = Math.max(...buckets.map((b) => b.count), 1);
  return (
    <div className="w-full h-24 mb-3 px-2">
      <svg viewBox={`0 0 ${buckets.length} 100`} preserveAspectRatio="none" className="w-full h-full">
        {buckets.map((b, i) => {
          const h = (b.count / max) * 80;
          return (
            <g key={i}>
              <rect x={i + 0.2} y={90 - h} width={0.8} height={h} rx="0.2" fill="rgba(99,102,241,0.9)" />
              <title>{`${b.label}: ${b.count}`}</title>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
