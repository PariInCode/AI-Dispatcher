import Card from "../ui/Card";

const KIND = {
  order_created: ["New order", "bg-ink/40"],
  assigned: ["Assigned", "bg-road"],
  driver_cancelled: ["Driver cancelled", "bg-brake"],
  reassigned: ["Reassigned", "bg-marigold"],
  urgent_order: ["Urgent order", "bg-brake"],
  order_bumped: ["Job moved", "bg-marigold"],
};

export default function EventTimeline({ events }) {
  return (
    <Card title="Activity log">
      {events.length === 0 && (
        <p className="text-sm text-ink/55">
          Nothing yet. Dispatch an order and each step shows up here.
        </p>
      )}
      <ol className="max-h-[640px] overflow-y-auto pr-1">
        {events.map((e, i) => {
          const [label, dot] = KIND[e.type] || [e.type, "bg-ink/40"];
          return (
            <li key={e._id} className="relative pb-4 pl-6 last:pb-0">
              {i < events.length - 1 && (
                <span className="absolute left-[5px] top-3 h-full w-px bg-ink/15" />
              )}
              <span
                className={`absolute left-0 top-1 h-[11px] w-[11px] rounded-full ring-4 ring-white ${dot}`}
              />
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-semibold">{label}</span>
                <span className="font-display text-sm text-ink/45">
                  {new Date(e.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <p className="mt-0.5 text-sm leading-snug text-ink/70">{e.message}</p>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
