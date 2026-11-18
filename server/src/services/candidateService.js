import Driver from "../models/Driver.js";
import "../models/Vehicle.js";

export function toAgentDriver(d) {
  return {
    id: String(d._id),
    name: d.name,
    status: d.status,
    rating: d.rating,
    skills: d.skills || [],
    location: { lat: d.location.lat, lng: d.location.lng, label: d.location.label },
    vehicle: {
      plate: d.vehicle.plate,
      type: d.vehicle.type,
      capacityKg: d.vehicle.capacityKg,
      covered: d.vehicle.covered,
      refrigerated: d.vehicle.refrigerated,
      hasLoader: d.vehicle.hasLoader,
    },
  };
}

export async function getCandidates() {
  const drivers = await Driver.find().populate("vehicle");
  return drivers.filter((d) => d.vehicle).map(toAgentDriver);
}

export function toAgentOrder(orderDoc) {
  const o = orderDoc.toObject ? orderDoc.toObject() : orderDoc;
  return {
    rawText: o.rawText,
    pickup: o.pickup,
    drop: o.drop,
    load: o.load,
    deadline: o.deadline ? new Date(o.deadline).toISOString() : null,
    priority: o.priority,
  };
}