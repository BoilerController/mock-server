import { clamp, JSON_HEADERS, randomBetween } from "./helpers.ts";
import { setExternalLoadWatts } from "./p1.ts";
import { MAX_BOILER_WATTS, MOCK_DEVICE_IP } from "./config.ts";

// Boiler Controller Mock - Simulates the Boiler Controller firmware API

interface BoilerState {
  heatingPercentage: number;
  temperature: number;
  power: number;
  totalWh: number;
  lastEnergyTimestamp: number;
  rssi: number;
}

const startupTime = new Date();

const state: BoilerState = {
  heatingPercentage: 0,
  temperature: 20.0,
  power: 0,
  totalWh: 0,
  lastEnergyTimestamp: Date.now(),
  rssi: -58,
};

function estimateBoilerPower(percentage: number): number {
  if (percentage <= 0) {
    return 0;
  }
  const minWatts = 200;
  return Math.round(minWatts + (MAX_BOILER_WATTS - minWatts) * (percentage / 100) + randomBetween(-15, 15));
}

function tickState(): void {
  const now = Date.now();
  const elapsedHours = (now - state.lastEnergyTimestamp) / 3_600_000;

  if (elapsedHours > 0) {
    state.totalWh += state.power * elapsedHours;
    state.lastEnergyTimestamp = now;
  }

  const targetTemp = state.heatingPercentage > 0
    ? 20 + (state.heatingPercentage / 100) * 60
    : Math.max(20, state.temperature - 0.05);

  state.temperature = clamp(
    state.temperature + (targetTemp - state.temperature) * 0.05 + randomBetween(-0.1, 0.1),
    15,
    85,
  );

  state.rssi = clamp(state.rssi + Math.round(randomBetween(-1, 1)), -90, -30);

  if (state.heatingPercentage > 0) {
    state.power = estimateBoilerPower(state.heatingPercentage);
    setExternalLoadWatts(state.power);
  }
}

setInterval(tickState, 5_000);

function formatDateTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

// GET /api/system
export function handleSystemRequest(): Response {
  const body = {
    system: {
      firmwareVersion: 1,
      cpuFrequency: "240 MHz",
      ip: MOCK_DEVICE_IP,
      currentDateTime: formatDateTime(new Date()),
      upSince: formatDateTime(startupTime),
      wifiStrength: state.rssi,
    },
  };
  return new Response(JSON.stringify(body), { status: 200, headers: JSON_HEADERS });
}

// GET /api/status
export function handleStatusRequest(): Response {
  tickState();
  const body = {
    power: state.power,
    heatingPercentage: state.heatingPercentage,
    temperature: Math.round(state.temperature * 10) / 10,
    total: Math.round(state.totalWh),
    rssi: state.rssi,
  };
  return new Response(JSON.stringify(body), { status: 200, headers: JSON_HEADERS });
}

// GET /api/heat?percentage=<0..100>
export function handleHeatRequest(params: URLSearchParams): Response {
  const percentageParam = params.get("percentage");
  if (percentageParam !== null) {
    const parsed = parseInt(percentageParam, 10);
    if (!isNaN(parsed)) {
      state.heatingPercentage = clamp(parsed, 0, 100);
      state.power = estimateBoilerPower(state.heatingPercentage);
      setExternalLoadWatts(state.power);
    }
  }
  return new Response("OK", { status: 200, headers: { "Content-Type": "text/plain" } });
}

// GET /api/reboot
export function handleRebootRequest(): Response {
  state.heatingPercentage = 0;
  state.power = 0;
  setExternalLoadWatts(0);
  return new Response("Restart ESP", { status: 200, headers: { "Content-Type": "text/plain" } });
}

// GET /api/factoryreset
export function handleFactoryResetRequest(): Response {
  state.heatingPercentage = 0;
  state.temperature = 20.0;
  state.power = 0;
  state.totalWh = 0;
  state.rssi = -58;
  setExternalLoadWatts(0);
  return new Response("OK", { status: 200, headers: { "Content-Type": "text/plain" } });
}

// POST /api/update  (multipart/form-data with firmware .bin)
export async function handleUpdateRequest(request: Request): Promise<Response> {
  try {
    await request.body?.cancel();
  } catch {
    // ignore
  }
  return new Response("OK", { status: 200, headers: { "Content-Type": "text/plain" } });
}
