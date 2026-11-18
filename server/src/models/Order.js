import mongoose from "mongoose";

const placeSchema = new mongoose.Schema(
  { label: String, lat: Number, lng: Number },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    customerName: String,
    customerPhone: String,
    rawText: String,
    imagePath: String,
    pickup: placeSchema,
    drop: placeSchema,
    load: {
      material: String,
      weightKg: Number,
      quantity: String,
      sizeCategory: { type: String, enum: ["small", "medium", "large"] },
      handling: [String], // fragile, perishable, needs_cover, needs_loader
      source: { type: String, enum: ["text", "photo", "both"], default: "text" },
      confidence: { type: String, enum: ["low", "medium", "high"] },
    },
    deadline: Date,
    priority: { type: String, enum: ["normal", "urgent"], default: "normal" },
    status: {
      type: String,
      enum: ["pending", "assigned", "in_transit", "completed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);