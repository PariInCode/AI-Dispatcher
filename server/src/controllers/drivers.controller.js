import Driver from "../models/Driver.js";

export async function listDrivers(req, res, next) {
  try {
    const drivers = await Driver.find().populate("vehicle");
    res.json(drivers);
  } catch (e) { next(e); }
}

export async function updateDriverStatus(req, res, next) {
  try {
    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    ).populate("vehicle");
    if (!driver) return res.status(404).json({ error: "Driver not found" });
    res.json(driver);
  } catch (e) { next(e); }
}