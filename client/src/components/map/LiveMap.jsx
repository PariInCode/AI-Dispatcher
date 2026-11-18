import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Card from "../ui/Card";
import { truckSvg } from "../../utils/truck";

const STATUS_COLOR = { available: "#0f5b46", busy: "#d9961a", off_duty: "#d43d2f" };

function driverIcon(status, assigned) {
  const size = assigned ? 38 : 28;
  const bg = assigned ? "" : `background:${STATUS_COLOR[status] || "#64748b"};`;
  return L.divIcon({
    className: "",
    html: `<div class="drv ${assigned ? "drv-assigned" : ""}" style="width:${size}px;height:${size}px;${bg}">${truckSvg(Math.round(size * 0.55))}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

function pinIcon(kind, letter) {
  return L.divIcon({
    className: "",
    html: `<div class="pin pin-${kind}"><span>${letter}</span></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 34],
    popupAnchor: [0, -34],
  });
}

function FitBounds({ points }) {
  const map = useMap();
  const key = points.map((p) => p.join(",")).join("|");
  useEffect(() => {
    if (points.length > 1) map.fitBounds(points, { padding: [48, 48], maxZoom: 11, animate: true });
    else if (points.length === 1) map.setView(points[0], 11);
  }, [map, key]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

function Legend() {
  const items = [
    ["#0f5b46", "Free"],
    ["#d9961a", "On a job"],
    ["#d43d2f", "Off duty"],
    ["#14201c", "Assigned driver"],
  ];
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink/60">
      {items.map(([c, l]) => (
        <span key={l} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />
          {l}
        </span>
      ))}
    </div>
  );
}

export default function LiveMap({ drivers, result }) {
  const order = result?.order;
  const assignedId = result?.decision?.driver_id;
  const hasCoords = (p) => p && p.lat != null && p.lng != null;
  const pickup = hasCoords(order?.pickup) ? [order.pickup.lat, order.pickup.lng] : null;
  const drop = hasCoords(order?.drop) ? [order.drop.lat, order.drop.lng] : null;
  const assigned = drivers.find((d) => d._id === assignedId);
  const assignedPos = assigned ? [assigned.location.lat, assigned.location.lng] : null;

  const focus = [assignedPos, pickup, drop].filter(Boolean);
  const fitPoints = focus.length ? focus : drivers.map((d) => [d.location.lat, d.location.lng]);

  return (
    <Card title="Live map">
      <div className="relative z-0 overflow-hidden rounded border border-ink/10">
        <MapContainer center={[28.6, 77.25]} zoom={9} scrollWheelZoom className="h-[420px] w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
          <FitBounds points={fitPoints} />

          {assignedPos && pickup && (
            <Polyline
              positions={[assignedPos, pickup]}
              pathOptions={{ color: "#14201c", weight: 3, dashArray: "2 10", lineCap: "round", className: "route-march" }}
            />
          )}
          {pickup && drop && (
            <Polyline
              positions={[pickup, drop]}
              pathOptions={{ color: "#0f5b46", weight: 4, opacity: 0.85, lineCap: "round" }}
            />
          )}

          {drivers.map((d) => {
            const isAssigned = d._id === assignedId;
            return (
              <Marker
                key={d._id}
                position={[d.location.lat, d.location.lng]}
                zIndexOffset={isAssigned ? 1000 : 0}
                icon={driverIcon(d.status, isAssigned)}
              >
                <Popup>
                  <strong>{d.name}</strong>
                  <br />
                  {d.vehicle?.type?.replace("_", " ")}, {d.vehicle?.capacityKg} kg
                  <br />
                  {d.location?.label}
                </Popup>
              </Marker>
            );
          })}

          {pickup && (
            <Marker position={pickup} icon={pinIcon("pickup", "P")} zIndexOffset={500}>
              <Popup>Pickup: {order.pickup.label}</Popup>
            </Marker>
          )}
          {drop && (
            <Marker position={drop} icon={pinIcon("drop", "D")} zIndexOffset={500}>
              <Popup>Drop: {order.drop.label}</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
      <Legend />
      <p className="text-sm text-ink/45">Lines are straight-line previews, not road routes.</p>
    </Card>
  );
}
