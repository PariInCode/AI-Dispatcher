import mongoose from "mongoose";
import "./Order.js";
import "./Driver.js";
import "./Vehicle.js";
const assignmentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", required: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" },
    score: Number,
    scoreBreakdown: { type: Map, of: Number }, // distance, capacityFit, rating, ...
    reasoning: String,
    driverMessage: String,
    customerMessage: String,
    alternatives: [
      {
        driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver" },
        score: Number,
        reason: String,
      },
    ],
    status: { type: String, enum: ["active", "cancelled", "replaced"], default: "active" },
  },
  { timestamps: true }
);

export default mongoose.model("Assignment", assignmentSchema);