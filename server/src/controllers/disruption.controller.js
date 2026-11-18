import Driver from "../models/Driver.js";
import Order from "../models/Order.js";
import Assignment from "../models/Assignment.js";
import EventLog from "../models/EventLog.js";
import { agentReplan , agentDispatch } from "../services/agentClient.js";
import { getCandidates, toAgentOrder } from "../services/candidateService.js";
import { saveAssignment } from "../services/assignmentService.js";


const stripNulls = (obj) =>
  Object.fromEntries(Object.entries(obj || {}).filter(([, v]) => v !== null && v !== undefined));

export async function urgentOrder(req, res, next) {
  try {
    const { rawText, customerName } = req.body;
    if (!rawText) return res.status(400).json({ error: "rawText is required" });

    // Jobs that may be moved: assigned, normal priority
    const active = await Assignment.find({ status: "active" }).populate("order");
    const bumpable = new Map(
      active
        .filter((a) => a.order && a.order.priority === "normal" && a.order.status === "assigned")
        .map((a) => [String(a.driver), a])
    );

    const drivers = (await getCandidates()).map((d) =>
      d.status === "busy" && bumpable.has(d.id) ? { ...d, status: "available", bumpable: true } : d
    );

    const result = await agentDispatch({ rawText, drivers });
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
      priority: "urgent",
      status: "pending",
    });
    await EventLog.create({ type: "urgent_order", order: order._id, message: `Urgent order: ${rawText}` });

    if (result.status !== "assigned") {
      return res.json({ status: result.status, order, rejected: result.rejected });
    }

    const displaced = bumpable.get(result.decision.driver_id) || null;
    if (displaced) {
      displaced.status = "replaced";
      await displaced.save();
      displaced.order.status = "pending";
      await displaced.order.save();
    }

    const assignment = await saveAssignment(order, result.decision);
    await EventLog.create({
      type: "assigned",
      order: order._id,
      driver: assignment.driver._id,
      message: `Assigned to ${assignment.driver.name}: ${result.decision.reasoning}`,
      meta: { source: result.decision.source, llmError: result.decision.llmError },
    });

    let bumped = null;
    if (displaced) {
      const displacedOrder = displaced.order;
      await EventLog.create({
        type: "order_bumped",
        order: displacedOrder._id,
        driver: assignment.driver._id,
        message: `${assignment.driver.name} moved to an urgent order. Re-planning: ${displacedOrder.rawText}`,
      });

      const replan = await agentReplan({
        order: toAgentOrder(displacedOrder),
        drivers: await getCandidates(),
        cancelledDriverId: result.decision.driver_id,
        reason: "moved to an urgent order",
      });

      if (replan.status === "assigned") {
        const newAssign = await saveAssignment(displacedOrder, replan.decision);
        await EventLog.create({
          type: "reassigned",
          order: displacedOrder._id,
          driver: newAssign.driver._id,
          message: `Reassigned to ${newAssign.driver.name}: ${replan.decision.reasoning}`,
        });
        bumped = { order: displacedOrder, status: "reassigned", assignment: newAssign, decision: replan.decision };
      } else {
        await EventLog.create({
          type: "reassigned",
          order: displacedOrder._id,
          message: "No eligible replacement driver found; order is back in the queue",
        });
        bumped = { order: displacedOrder, status: "pending", rejected: replan.rejected };
      }
    }

    res.status(201).json({ status: "assigned", order, assignment, decision: result.decision, bumped });
  } catch (e) { next(e); }
}




export async function cancelDriver(req, res, next) {
  try {
    const { orderId, reason = "driver cancelled" } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    const current = await Assignment.findOne({ order: orderId, status: "active" }).populate("driver");
    if (!current) return res.status(400).json({ error: "Order has no active assignment" });

    const cancelledDriver = current.driver;
    current.status = "cancelled";
    await current.save();
    cancelledDriver.status = "off_duty";
    await cancelledDriver.save();
    await EventLog.create({
      type: "driver_cancelled",
      order: order._id,
      driver: cancelledDriver._id,
      message: `${cancelledDriver.name} cancelled: ${reason}`,
    });

    const drivers = await getCandidates();
    const result = await agentReplan({
      order: toAgentOrder(order),
      drivers,
      cancelledDriverId: String(cancelledDriver._id),
      reason,
    });

    if (result.status !== "assigned") {
      order.status = "pending";
      await order.save();
      await EventLog.create({
        type: "reassigned",
        order: order._id,
        message: "No eligible replacement driver found",
      });
      return res.json({ status: result.status, order, rejected: result.rejected });
    }

    const assignment = await saveAssignment(order, result.decision);
    await EventLog.create({
      type: "reassigned",
      order: order._id,
      driver: assignment.driver._id,
      message: `Reassigned to ${assignment.driver.name}: ${result.decision.reasoning}`,
      meta: { source: result.decision.source, llmError: result.decision.llmError },
    });

    res.json({ status: "reassigned", order, assignment, decision: result.decision });
  } catch (e) { next(e); }
}

// Demo helper: put everything back to a clean state
export async function resetDemo(req, res, next) {
  try {
    await Promise.all([Order.deleteMany(), Assignment.deleteMany(), EventLog.deleteMany()]);
    await Driver.updateMany({}, { status: "available" });
    res.json({ ok: true });
  } catch (e) { next(e); }
}