import { JSON_HEADERS } from "./helpers.ts";
import { handleP1ChangeScenarioRequest, handleP1ReadingRequest } from "./p1.ts";
import {
  handleFactoryResetRequest,
  handleHeatRequest,
  handleRebootRequest,
  handleStatusRequest,
  handleSystemRequest,
  handleUpdateRequest,
} from "./boiler.ts";

// Boiler Controller Mock Server

async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const params = url.searchParams;
  const method = request.method;

  // Boiler Controller API
  if (method === "GET" && pathname === "/api/system") {
    return handleSystemRequest();
  }

  if (method === "GET" && pathname === "/api/status") {
    return handleStatusRequest();
  }

  if (method === "GET" && pathname === "/api/heat") {
    return handleHeatRequest(params);
  }

  if (method === "GET" && pathname === "/api/reboot") {
    return handleRebootRequest();
  }

  if (method === "GET" && pathname === "/api/factoryreset") {
    return handleFactoryResetRequest();
  }

  if (method === "POST" && pathname === "/api/update") {
    return await handleUpdateRequest(request);
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

Deno.serve({ port: PORT }, handleRequest);
