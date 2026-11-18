import Driver from "../models/Driver.js";
import Assignment from "../models/Assignment.js";

export async function saveAssignment(order, decision) {
  const driver = await Driver.findById(decision.driver_id);
  const assignment = await Assignment.create({
    order: order._id,
    driver: driver._id,
    vehicle: driver.vehicle,
    score: decision.score,
    scoreBreakdown: decision.breakdown,
    reasoning: decision.reasoning,
    driverMessage: decision.driverMessage,
    customerMessage: decision.customerMessage,
    alternatives: (decision.alternatives || []).map((a) => ({
      driver: a.driver_id,
      score: a.score,
    })),
  });

  driver.status = "busy";
  await driver.save();
  order.status = "assigned";
  await order.save();

  return Assignment.findById(assignment._id).populate("driver vehicle");
}