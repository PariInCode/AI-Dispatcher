import mongoose from "mongoose";
import "./Order.js";
import "./Driver.js";
const eventLogSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "order_created",
        "assigned",
        "driver_cancelled",
        "reassigned",
        "urgent_order",
        "order_completed",
        "order_bumped",
      ],
      required: true,
    },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver" },
    message: String,
    meta: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

export default mongoose.model("EventLog", eventLogSchema);