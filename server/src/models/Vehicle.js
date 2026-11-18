import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
  {
    plate: { type: String, required: true, unique: true },
    type: {
      type: String,
      enum: ["mini_truck", "pickup", "open_truck", "covered_truck", "refrigerated", "flatbed"],
      required: true,
    },
    capacityKg: { type: Number, required: true },
    covered: { type: Boolean, default: false },
    refrigerated: { type: Boolean, default: false },
    hasLoader: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Vehicle", vehicleSchema);