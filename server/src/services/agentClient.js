import axios from "axios";
import { env } from "../config/env.js";

const http = axios.create({ baseURL: env.agentUrl, timeout: 60000 });

async function call(path, body) {
  try {
    const { data } = await http.post(path, body);
    return data;
  } catch (e) {
    console.error("Agent request failed:", {
      message: e.message,
      status: e.response?.status,
      response: e.response?.data,
    });
    const detail = e.response?.data?.detail || e.message;
    throw new Error(`Agent error: ${typeof detail === "string" ? detail : JSON.stringify(detail)}`);
  }
}

export const agentDispatch = ({ rawText, drivers }) =>
  call("/dispatch", { rawText, drivers });

export const agentReplan = ({ order, drivers, cancelledDriverId, reason }) =>
  call("/replan", { order, drivers, cancelledDriverId, reason });