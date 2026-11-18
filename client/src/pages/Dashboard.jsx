import { useCallback, useEffect, useState } from "react";
import {
  getDrivers,
  getEvents,
  sendOrder,
  sendUrgent,
  cancelDriver,
  resetDemo,
} from "../api/dispatch";
import OrderForm from "../components/orders/OrderForm";
import DecisionPanel from "../components/agent/DecisionPanel";
import EventTimeline from "../components/agent/EventTimeline";
import DriverList from "../components/drivers/DriverList";
import StatsStrip from "../components/drivers/StatsStrip";
import LiveMap from "../components/map/LiveMap";
import TruckIcon from "../components/ui/TruckIcon";

const APP_NAME = "RaastaSaathi";

function Logo() {
  const [ok, setOk] = useState(true);
  return ok ? (
    <img
      src="/logo.png"
      alt=""
      onError={() => setOk(false)}
      className="h-10 w-10 rounded-md object-contain"
    />
  ) : (
    <span className="flex h-10 w-10 items-center justify-center rounded-md bg-marigold text-ink">
      <TruckIcon className="h-6 w-6" />
    </span>
  );
}

export default function Dashboard() {
  const [drivers, setDrivers] = useState([]);
  const [events, setEvents] = useState([]);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      const [d, e] = await Promise.all([getDrivers(), getEvents()]);
      setDrivers(d);
      setEvents(e);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function run(fn) {
    setBusy(true);
    setError("");
    try {
      setResult(await fn());
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setBusy(false);
      await refresh();
    }
  }

  const handleSubmit = (text, customer, urgent, image) => {
    setResult(null); // clear the previous slip so the working state shows
    return run(() => (urgent ? sendUrgent(text, customer, image) : sendOrder(text, customer, image)));
  };
  const handleCancel = (orderId) => run(() => cancelDriver(orderId, "vehicle breakdown"));
  const handleReset = async () => {
    await resetDemo();
    setResult(null);
    await refresh();
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30">
        <div className="bg-road text-white">
          <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-3">
              <img
                src="/Logo.png"
                alt="TruckSaathi Logo"
                className="h-10 w-10 object-contain"
              />
              <div>
                <h1 className="font-display text-2xl font-semibold leading-none">{APP_NAME}</h1>
                <p className="mt-1 text-sm text-white/70">Dispatch for small transport businesses</p>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="rounded-md border border-white/35 px-3 py-1.5 text-sm text-white/90 transition hover:bg-white/10"
            >
              Reset demo
            </button>
          </div>
        </div>
        <div className="centreline" />
      </header>

      <div className="mx-auto max-w-[1500px] px-4 py-5">
        {error && (
          <div
            role="alert"
            className="mb-4 rounded-md border border-brake/30 bg-brake/10 px-3 py-2 text-sm text-brake"
          >
            {error}
          </div>
        )}
        <main className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[340px_minmax(0,1fr)_330px]">
          <div className="flex flex-col gap-5">
            <OrderForm onSubmit={handleSubmit} busy={busy} />
            <DriverList drivers={drivers} />
          </div>
          <div className="flex flex-col gap-5">
            <StatsStrip drivers={drivers} />
            <LiveMap drivers={drivers} result={result} />
            <DecisionPanel result={result} onCancel={handleCancel} busy={busy} />
          </div>
          <div className="flex flex-col gap-5">
            <EventTimeline events={events} />
          </div>
        </main>
      </div>
    </div>
  );
}
