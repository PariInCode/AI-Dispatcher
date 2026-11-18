import express from "express";
import cors from "cors";
import driversRoutes from "./routes/drivers.routes.js";
import ordersRoutes from "./routes/orders.routes.js";
import dispatchRoutes from "./routes/dispatch.routes.js";
import disruptionRoutes from "./routes/disruption.routes.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true }));
app.use("/api/drivers", driversRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/dispatch", dispatchRoutes);
app.use("/api/disruption", disruptionRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

export default app;