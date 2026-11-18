import dotenv from "dotenv";
dotenv.config();

export const env = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ai-dispatcher",
  agentUrl: process.env.AGENT_URL || "http://127.0.0.1:8000",
};