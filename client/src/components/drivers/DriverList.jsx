import Card from "../ui/Card";
import Badge from "../ui/Badge";

const STATUS = {
  available: ["green", "Free"],
  busy: ["amber", "On a job"],
  off_duty: ["red", "Off duty"],
};
const BAR = { available: "bg-road", busy: "bg-marigold", off_duty: "bg-brake" };

const kind = (t) => (t || "").replace("_", " ").replace(/^./, (c) => c.toUpperCase());

export default function DriverList({ drivers }) {
  return (
    <Card title="Fleet" right={<span className="text-sm text-ink/50">{drivers.length} drivers</span>}>
      <ul className="-mx-4 divide-y divide-ink/[0.07]">
        {drivers.map((d) => {
          const [tone, label] = STATUS[d.status] || ["neutral", d.status];
          return (
            <li
              key={d._id}
              className="relative flex items-center justify-between gap-3 py-2.5 pl-6 pr-4"
            >
              <span
                className={`absolute inset-y-2.5 left-3 w-[3px] rounded-full ${BAR[d.status] || "bg-ink/20"}`}
              />
              <div className="min-w-0">
                <div className="truncate font-medium">{d.name}</div>
                <div className="flex flex-wrap items-center gap-x-3 text-xs text-ink/55">
                  <span>{kind(d.vehicle?.type)}</span>
                  <span>{d.vehicle?.capacityKg?.toLocaleString("en-IN")} kg</span>
                  <span className="truncate">{d.location?.label}</span>
                </div>
              </div>
              <Badge tone={tone}>{label}</Badge>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
