# boiler-controller-mock-server

Mock server that simulates the Boiler Controller firmware API.

## Requirements

- [Deno](https://deno.land/) runtime

## Running the Server

Mock mode (no real device):

```bash
deno run --allow-net --allow-env main.ts
```

Real device mode (forwards `/api/*` calls to the actual Boiler Controller):

```bash
BC_DEVICE_IP="192.168.1.50" deno run --allow-net --allow-env main.ts
```

The server will start on `http://localhost:8080`. P1 simulation is always active, regardless of mode.

## Boiler Controller API

Base URL: `http://localhost:8080`  
API prefix: `/api`

### GET /api/system

Returns device and runtime information.

```json
{
  "system": {
    "firmwareVersion": 1,
    "cpuFrequency": "240 MHz",
    "ip": "192.168.1.123",
    "currentDateTime": "2026-04-23 20:15:00",
    "upSince": "2026-04-22 11:03:18",
    "wifiStrength": -58
  }
}
```

### GET /api/status

Returns the current boiler status.

```json
{
  "power": 1320,
  "heatingPercentage": 60,
  "temperature": 65.0,
  "total": 12345,
  "rssi": -50
}
```

### GET /api/heat

Sets the heating percentage. The value is clamped to 0–100.

```
GET /api/heat?percentage=60
```

Response: `OK`

### GET /api/reboot

Simulates an ESP reboot (resets boiler state to idle).

```
GET /api/reboot
```

Response: `Restart ESP`

### GET /api/factoryreset

Simulates a factory reset (resets all state to defaults).

```
GET /api/factoryreset
```

Response: `OK`

### POST /api/update

Accepts a firmware `.bin` file upload (mock: discards the body and returns OK).

```
POST /api/update
Content-Type: multipart/form-data

update=<firmware.bin>
```

Response: `OK`

---

## Simulated P1 Meter

Stateful mock that lets clients poll a P1 reading while you adjust the scenario.

```
GET /p1/reading
GET /p1/change-scenario?scenario=mixed_clouds
GET /p1/change-scenario?scenario=swinging_grid&negative=true
```

| Scenario key        | Description                                          | Expected range        |
| ------------------- | ---------------------------------------------------- | --------------------- |
| `sunny_export`      | Steady export around −3 kW                           | −3.2 kW – −2.8 kW    |
| `sunny_export_low`  | Steady export around −1.5 kW                         | −1.7 kW – −0.8 kW    |
| `mixed_clouds`      | Cloud breaks causing swings between −4 kW and −1 kW  | −4 kW – −1 kW         |
| `swinging_grid`     | Similar pattern but between −2 kW and +0.5 kW        | −2 kW – 0.5 kW        |

The boiler's power consumption (driven by `heatingPercentage`) is automatically added to the P1 reading via `externalLoadWatts`.
