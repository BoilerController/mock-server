import { JSON_HEADERS } from "./helpers.ts";
import { handleP1ChangeScenarioRequest, handleP1ReadingRequest } from "./p1.ts";
import { handleBoilerRequest } from "./boiler.ts";
import { REAL_DEVICE_BASE_URL } from "./config.ts";

// Boiler Controller Mock Server

async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const params = url.searchParams;

  // Boiler Controller API
  if (pathname.startsWith("/api/")) {
    return await handleBoilerRequest(request);
  }

  // P1 Meter Mock
  if (pathname === "/p1/reading") {
    return handleP1ReadingRequest();
  }

  if (pathname === "/p1/change-scenario") {
    return handleP1ChangeScenarioRequest(params);
  }

  return new Response(JSON.stringify({ error: "not found" }), {
    status: 404,
    headers: JSON_HEADERS,
  });
}

const PORT = 8080;

console.log(`Boiler Controller Mock Server running on http://localhost:${PORT}`);
console.log(
  REAL_DEVICE_BASE_URL
    ? `Proxying boiler API calls to real device: ${REAL_DEVICE_BASE_URL}`
    : "Using in-memory mock implementation (no real device configured)"
);

Deno.serve({ port: PORT }, handleRequest);
