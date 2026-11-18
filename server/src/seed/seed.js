import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import Vehicle from "../models/Vehicle.js";
import Driver from "../models/Driver.js";
import Order from "../models/Order.js";
import Assignment from "../models/Assignment.js";
import EventLog from "../models/EventLog.js";

const dir = path.dirname(fileURLToPath(import.meta.url));
const load = (f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf-8"));

async function seed() {
  await connectDB();
  await Promise.all([
    Vehicle.deleteMany(), Driver.deleteMany(), Order.deleteMany(),
    Assignment.deleteMany(), EventLog.deleteMany(),
  ]);

  const vehicles = await Vehicle.insertMany(load("vehicles.json"));
  const byPlate = Object.fromEntries(vehicles.map((v) => [v.plate, v._id]));

  const drivers = load("drivers.json").map((d) => ({
    name: d.name,
    phone: d.phone,
    rating: d.rating,
    skills: d.skills,
    status: "available",
    location: { label: d.label, lat: d.lat, lng: d.lng },
    vehicle: byPlate[d.plate],
  }));
  await Driver.insertMany(drivers);
  await Order.insertMany(load("orders.json"));

  console.log(`Seeded ${vehicles.length} vehicles, ${drivers.length} drivers, orders`);
  await mongoose.disconnect();
}

seed().catch((e) => { console.error(e); process.exit(1); });