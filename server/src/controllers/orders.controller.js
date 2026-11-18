import Order from "../models/Order.js";
import EventLog from "../models/EventLog.js";

export async function listOrders(req, res, next) {
  try {
    res.json(await Order.find().sort({ createdAt: -1 }));
  } catch (e) { next(e); }
}

export async function createOrder(req, res, next) {
  try {
    const order = await Order.create(req.body);
    await EventLog.create({
      type: "order_created",
      order: order._id,
      message: `New order: ${order.rawText || "structured order"}`,
    });
    res.status(201).json(order);
  } catch (e) { next(e); }
}