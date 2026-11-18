import app from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
process.on("unhandledRejection", (e) => console.error("Unhandled rejection:", e));
process.on("uncaughtException", (e) => console.error("Uncaught exception:", e));

connectDB()
  .then(() => app.listen(env.port, () => console.log(`Server on :${env.port}`)))
  .catch((e) => {
    console.error("DB connection failed:", e.message);
    process.exit(1);
  });