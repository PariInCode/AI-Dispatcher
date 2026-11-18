import Order from "../models/Order.js";
import Assignment from "../models/Assignment.js";
import EventLog from "../models/EventLog.js";
import { agentDispatch } from "../services/agentClient.js";
import { getCandidates } from "../services/candidateService.js";
import { saveAssignment } from "../services/assignmentService.js";

// Mongoose enums dislike explicit nulls, so drop them
const stripNulls = (obj) =>
  Object.fromEntries(Object.entries(obj || {}).filter(([, v]) => v !== null && v !== undefined));

export async function dispatchOrder(req, res, next) {
  try {
    const { rawText, customerName } = req.body;
    if (!rawText) return res.status(400).json({ error: "rawText is required" });

    const drivers = await getCandidates();
    const result = await agentDispatch({ rawText, drivers });

    // Not enough info: return the parsed order so the UI can ask the customer
    if (result.status === "needs_clarification") {
      return res.json({ status: result.status, order: result.order });
    }

    const o = result.order;
    const order = await Order.create({
      customerName,
      rawText,
      pickup: stripNulls(o.pickup),
      drop: stripNulls(o.drop),
      load: stripNulls(o.load),
      deadline: o.deadline ? new Date(o.deadline) : undefined,
      priority: o.priority,
      status: "pending",
    });
    await EventLog.create({
      type: "order_created",
      order: order._id,
      message: `New order: ${rawText}`,
    });

    if (result.status !== "assigned") {
      return res.json({ status: result.status, order, rejected: result.rejected });
    }

    const assignment = await saveAssignment(order, result.decision);
    await EventLog.create({
      type: "assigned",
      order: order._id,
      driver: assignment.driver._id,
      message: `Assigned to ${assignment.driver.name}: ${result.decision.reasoning}`,
      meta: { source: result.decision.source, llmError: result.decision.llmError },
    });

    res.status(201).json({ status: "assigned", order, assignment, decision: result.decision });
  } catch (e) { next(e); }
}

export async function listAssignments(req, res, next) {
  try {
    const items = await Assignment.find({ status: "active" })
      .sort({ createdAt: -1 })
      .populate("driver vehicle order");
    res.json(items);
  } catch (e) { next(e); }
}

export async function listEvents(req, res, next) {
  try {
    res.json(await EventLog.find().sort({ createdAt: -1 }).limit(50));
  } catch (e) { next(e); }
}