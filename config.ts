// Boiler Controller Mock Server configuration

const rawDeviceIp = Deno.env.get("BC_DEVICE_IP")?.trim() ?? "";

// IP of the Boiler Controller device, used in GET /api/system and for proxying.
export const MOCK_DEVICE_IP = rawDeviceIp || "192.168.1.123";

// When BC_DEVICE_IP is set, all /api/* calls are forwarded to the real device.
// Null means pure mock mode.
export const REAL_DEVICE_BASE_URL: string | null = rawDeviceIp ? `http://${rawDeviceIp}` : null;

// Maximum boiler power in watts (used to simulate power based on heatingPercentage).
export const MAX_BOILER_WATTS = 2000;
