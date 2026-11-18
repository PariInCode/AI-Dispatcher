import { useState } from "react";
import Card from "../ui/Card";
import Badge from "../ui/Badge";
import Tilt from "../ui/Tilt";
import TruckIcon from "../ui/TruckIcon";

const WEIGHTS = { proximity: 40, capacity_fit: 25, rating: 15, skills: 20 };
const LABELS = {
  proximity: "Distance to pickup",
  capacity_fit: "Vehicle fit",
  rating: "Driver rating",
  skills: "Skills",
};
const BAND_LABEL = {
  under_500: "under 500 kg",
  "500_2000": "500 to 2,000 kg",
  "2000_5000": "2,000 to 5,000 kg",
  over_5000: "over 5,000 kg",
  unknown: "unclear",
};

const kind = (t) => (t || "").replace("_", " ").replace(/^./, (c) => c.toUpperCase());

function fmtDeadline(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function H({ children, right }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2">
      <h3 className="font-display text-lg font-semibold leading-none text-ink">{children}</h3>
      {right}
    </div>
  );
}

function Plate({ children }) {
  return (
    <span className="rounded-[3px] border-2 border-ink bg-marigold px-1.5 font-display text-sm font-semibold tracking-wider text-ink">
      {children}
    </span>
  );
}

function RouteLine({ from, to }) {
  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <div className="text-sm text-ink/55">Pickup</div>
        <div className="truncate font-medium">{from || "Not stated"}</div>
      </div>
      <div className="flex w-16 shrink-0 items-center" aria-hidden="true">
        <span className="h-2 w-2 rounded-full bg-road" />
        <span className="h-px flex-1 border-t-2 border-dashed border-ink/30" />
        <span className="h-2 w-2 rounded-full bg-ink" />
      </div>
      <div className="min-w-0 flex-1 text-right">
        <div className="text-sm text-ink/55">Drop</div>
        <div className="truncate font-medium">{to || "Not stated"}</div>
      </div>
    </div>
  );
}

function CopyNote({ label, text }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    } catch {
      // Clipboard can be blocked by the browser; nothing else to do.
    }
  };
  return (
    <div className="rounded-md border border-ink/10 bg-white/70 px-3 py-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-ink/60">{label}</span>
        <button type="button" onClick={copy} className="text-sm font-medium text-road hover:underline">
          {done ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="mt-0.5 text-[15px] text-ink">{text}</p>
    </div>
  );
}

function Rejected({ items }) {
  if (!items?.length) return null;
  return (
    <div>
      <H>Ruled out</H>
      <ul className="space-y-1.5 text-sm">
        {items.map((r) => (
          <li key={r.driver_id}>
            <span className="font-medium text-ink">{r.name}</span>
            <span className="text-ink/55"> {r.reasons.join("; ")}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function DecisionPanel({ result, onCancel, busy }) {
  if (busy && !result) {
    return (
      <Card title="Working on it">
        <div className="road-strip" aria-hidden="true">
          <span className="rig">
            <TruckIcon className="h-7 w-7" />
          </span>
        </div>
        <p className="text-sm text-ink/60">
          Reading the order, checking which vehicles can carry it and choosing a driver. This can
          take several seconds.
        </p>
      </Card>
    );
  }

  if (!result) {
    return (
      <Card title="Agent decision">
        <div className="flex items-start gap-3 rounded border border-dashed border-ink/20 p-4 text-ink/60">
          <TruckIcon className="mt-0.5 h-6 w-6 shrink-0 text-road" />
          <p className="text-[15px]">
            No order yet. Pick a quick order on the left or type your own, then press Dispatch. The
            slip for the chosen driver appears here.
          </p>
        </div>
      </Card>
    );
  }

  if (result.status === "needs_clarification") {
    const o = result.order || {};
    return (
      <Card title="Need more information" className="border-l-4 border-l-brake">
        <p className="text-[15px] text-ink/75">
          The agent could not tell where this order starts or ends, so it did not guess. Ask the
          customer, then send it again.
        </p>
        <ul className="space-y-1 text-[15px]">
          <li>
            <span className="text-ink/55">Pickup: </span>
            {o.pickup?.label || "not stated"}
            {o.pickup?.label && o.pickup?.lat == null && " (place not recognised)"}
          </li>
          <li>
            <span className="text-ink/55">Drop: </span>
            {o.drop?.label || "not stated"}
            {o.drop?.label && o.drop?.lat == null && " (place not recognised)"}
          </li>
        </ul>
      </Card>
    );
  }

  if (result.status === "no_candidates") {
    return (
      <Card title="No eligible driver" className="border-l-4 border-l-brake">
        <p className="text-[15px] text-ink/75">
          Every driver is ruled out for this load right now, so the order is on hold instead of
          going to the wrong truck.
        </p>
        <Rejected items={result.rejected} />
      </Card>
    );
  }

  const d = result.decision;
  const order = result.order || {};
  const load = order.load || {};
  const reassigned = result.status === "reassigned";
  const urgent = order.priority === "urgent";

  const stamp = reassigned
    ? { text: "Reassigned", color: "text-[#9a5b00]" }
    : urgent
      ? { text: "Urgent", color: "text-brake" }
      : { text: "Assigned", color: "text-road" };

  const slipNo = order._id ? `No. ${String(order._id).slice(-5).toUpperCase()}` : "";
  const loadText = [
    load.material,
    load.weightKg ? `${Number(load.weightKg).toLocaleString("en-IN")} kg` : null,
    load.quantity,
  ]
    .filter(Boolean)
    .join(", ");
  const deadline = fmtDeadline(order.deadline);

  return (
    <Tilt>
      <div key={`${order._id || "order"}-${d.driver_id}`} className="slip p-5 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-display text-lg font-semibold leading-none text-ink/60">
              Consignment slip
            </div>
            <div className="mt-1 text-sm text-ink/45">
              {[slipNo, order.customerName].filter(Boolean).join("  ")}
            </div>
          </div>
          <span className={`stamp ${stamp.color}`}>{stamp.text}</span>
        </div>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate font-display text-5xl font-semibold leading-none">{d.name}</div>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink/70">
              <span>{kind(d.vehicle_type)}</span>
              <Plate>{d.vehicle_plate}</Plate>
              <span>{d.pickup_km} km from pickup</span>
            </div>
          </div>
          <div className="shrink-0 text-right leading-none">
            <span className="font-display text-5xl font-semibold text-road">
              {Math.round(d.score ?? 0)}
            </span>
            <span className="font-display text-xl text-ink/40">/100</span>
            <div className="mt-1 text-xs text-ink/50">match score</div>
          </div>
        </div>

        <div className="perf" />

        <RouteLine from={order.pickup?.label} to={order.drop?.label} />

        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {loadText && (
            <div>
              <dt className="text-ink/55">Load</dt>
              <dd className="font-medium">{loadText}</dd>
            </div>
          )}
          {deadline && (
            <div>
              <dt className="text-ink/55">Deliver by</dt>
              <dd className="font-medium">{deadline}</dd>
            </div>
          )}
          {load.handling?.length > 0 && (
            <div className="col-span-2">
              <dt className="mb-1 text-ink/55">Handling</dt>
              <dd className="flex flex-wrap gap-1.5">
                {load.handling.map((h) => (
                  <Badge key={h}>{h.replaceAll("_", " ")}</Badge>
                ))}
              </dd>
            </div>
          )}
        </dl>

        <div className="mt-5">
          <H
            right={
              <Badge tone={d.source === "llm" ? "green" : "amber"}>
                {d.source === "llm" ? "AI explanation" : "Built-in explanation"}
              </Badge>
            }
          >
            Why this driver
          </H>
          <p className="border-l-[3px] border-marigold pl-3 text-[15px] leading-relaxed text-ink/85">
            {d.reasoning}
          </p>
        </div>

        {load.photo && (
          <div className="mt-5">
            <H>From the photo</H>
            {load.photo.error ? (
              <p className="text-sm text-ink/65">
                The photo could not be analysed, so this was dispatched on the text alone.
              </p>
            ) : (
              <>
                <ul className="space-y-0.5 text-sm text-ink/80">
                  <li>
                    <span className="text-ink/55">Looks like: </span>
                    {load.photo.material || "unclear"}
                    {load.photo.quantity ? `, ${load.photo.quantity}` : ""}
                  </li>
                  <li>
                    <span className="text-ink/55">Rough weight: </span>
                    {BAND_LABEL[load.photo.weightBand] || "unclear"}{" "}
                    <span className="text-ink/40">(an estimate)</span>
                  </li>
                  {load.photo.handling?.length > 0 && (
                    <li>
                      <span className="text-ink/55">Handling: </span>
                      {load.photo.handling.join(", ").replaceAll("_", " ")}
                    </li>
                  )}
                  <li>
                    <span className="text-ink/55">Confidence: </span>
                    {load.photo.confidence}
                  </li>
                </ul>
                {load.photo.mismatch && (
                  <div className="mt-2 rounded-md border border-marigold/60 bg-marigold/15 px-3 py-2 text-sm text-ink/85">
                    The order says {load.weightKg} kg, but the photo suggests{" "}
                    {BAND_LABEL[load.photo.weightBand]}. Worth confirming with the customer.
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {result.bumped && (
          <div className="mt-5 rounded-md border border-marigold/60 bg-marigold/15 p-3">
            <H>Job moved to make room</H>
            <p className="text-sm text-ink/85">
              &ldquo;{result.bumped.order.rawText}&rdquo;{" "}
              {result.bumped.status === "reassigned"
                ? `was reassigned to ${result.bumped.decision.name}.`
                : "has no other eligible driver right now and is back in the queue."}
            </p>
            {result.bumped.status === "reassigned" && (
              <p className="mt-1 text-sm text-ink/65">{result.bumped.decision.reasoning}</p>
            )}
          </div>
        )}

        <div className="mt-5">
          <H>Message drafts</H>
          <div className="space-y-2">
            <CopyNote label="To the driver" text={d.driverMessage} />
            <CopyNote label="To the customer" text={d.customerMessage} />
          </div>
        </div>

        <div className="mt-5">
          <H>Score breakdown</H>
          <div className="space-y-1.5">
            {Object.entries(d.breakdown || {}).map(([k, v]) => (
              <div key={k} className="grid grid-cols-[140px_1fr_48px] items-center gap-3 text-sm">
                <span className="text-ink/65">{LABELS[k] || k}</span>
                <div className="h-1.5 overflow-hidden rounded-full bg-ink/10">
                  <div
                    className="h-full rounded-full bg-road"
                    style={{ width: `${Math.min(100, (v / (WEIGHTS[k] || 1)) * 100)}%` }}
                  />
                </div>
                <span className="text-right font-display text-base text-ink/70">
                  {v}/{WEIGHTS[k]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {d.alternatives?.length > 0 && (
          <div className="mt-5">
            <H>Other eligible drivers</H>
            <ul className="space-y-1 text-sm text-ink/80">
              {d.alternatives.map((a) => (
                <li key={a.driver_id}>
                  {a.name} <span className="text-ink/40">{a.score}/100</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {d.rejected?.length > 0 && (
          <div className="mt-5">
            <Rejected items={d.rejected} />
          </div>
        )}

        <button
          onClick={() => onCancel(order._id)}
          disabled={busy}
          className="mt-6 w-full rounded-md border border-brake/40 bg-white px-4 py-2.5 font-medium text-brake shadow-[0_3px_0_rgba(212,61,47,0.25)] transition active:translate-y-[2px] active:shadow-none disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
        >
          {busy ? "Re-planning" : `${d.name} cancels (breakdown)`}
        </button>
      </div>
    </Tilt>
  );
}
