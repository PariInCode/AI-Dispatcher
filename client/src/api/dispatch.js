import api from "./client";

export const getDrivers = () => api.get("/drivers").then((r) => r.data);
export const getEvents = () => api.get("/dispatch/events").then((r) => r.data);
export const sendOrder = (rawText, customerName) =>
  api.post("/dispatch", { rawText, customerName }).then((r) => r.data);
export const cancelDriver = (orderId, reason) =>
  api.post("/disruption/cancel", { orderId, reason }).then((r) => r.data);
export const resetDemo = () => api.post("/disruption/reset").then((r) => r.data);
export const sendUrgent = (rawText, customerName) =>
  api.post("/disruption/urgent", { rawText, customerName }).then((r) => r.data);