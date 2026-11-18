import mongoose from "mongoose";
import "./Vehicle.js";

const driverSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: String,
    telegramChatId: String,
    location: {
      label: String,
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    status: { type: String, enum: ["available", "busy", "off_duty"], default: "available" },
    availableFrom: { type: Date, default: Date.now },
    rating: { type: Number, default: 4.0 },
    skills: [String], // fragile, perishable, heavy, loading_help, night_driving
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" },
  },
  { timestamps: true }
);

export default mongoose.model("Driver", driverSchema);