export default function StatsStrip({ drivers }) {
  const count = (s) => drivers.filter((d) => d.status === s).length;
  const items = [
    { label: "Free to dispatch", n: count("available"), dot: "bg-road" },
    { label: "On a job", n: count("busy"), dot: "bg-marigold" },
    { label: "Off duty", n: count("off_duty"), dot: "bg-brake" },
  ];

  return (
    <div className="grid grid-cols-3 divide-x divide-ink/10 overflow-hidden rounded-md border border-ink/10 bg-white">
      {items.map((it) => (
        <div key={it.label} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
          <span className="font-display text-4xl font-semibold leading-none">{it.n}</span>
          <span className="flex items-center gap-1.5 text-sm text-ink/60">
            <span className={`h-2 w-2 rounded-full ${it.dot}`} />
            {it.label}
          </span>
        </div>
      ))}
    </div>
  );
}
