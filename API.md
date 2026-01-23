# API Reference - Swap Station Monitoring System

Base URL: `http://localhost:5000`

## Signal Collection (STEP 1)

### Send Single Signal
```http
POST /api/signals/receive

{
  "stationId": "station-0",
  "signalType": "swap_event",
  "data": {
    "driverId": "driver-123",
    "oldBatteryId": "bat-456",
    "newBatteryId": "bat-789",
    "swapTime": 3,
    "status": "completed"
  }
}
```

**Response:**
```json
{
  "success": true,
  "signalId": "uuid-here"
}
```

### Batch Send Signals
```http
POST /api/signals/batch

{
  "signals": [
    {
      "stationId": "station-0",
      "type": "swap_event",
      "data": { "driverId": "d-1", "swapTime": 2 }
    },
    {
      "stationId": "station-1",
      "type": "battery_inventory",
      "data": { "charged": 5, "uncharged": 3 }
    }
  ]
}
```

### Get Recent Signals
```http
GET /api/signals/station-0/recent

```

**Response:**
```json
[
  {
    "id": "uuid",
    "type": "swap_event",
    "data": { "driverId": "d-1", "swapTime": 2 },
    "timestamp": "2026-01-23T10:30:00.000Z",
    "processed": false
  }
]
```

---

## Monitoring Model (STEP 2)

### Get Metrics for One Station
```http
GET /api/monitoring/station/station-0

```

**Response:**
```json
{
  "stationId": "station-0",
  "metrics": {
    "swapRate": 12,
    "queueLength": 3,
    "chargedBatteries": 8,
    "chargerUptimePercent": 98,
    "errorFrequency": 1,
    "timestamp": "2026-01-23T10:30:00.000Z"
  }
}
```

### Get Metrics for All Stations
```http
GET /api/monitoring/all

```

**Response:**
```json
[
  {
    "stationId": "station-0",
    "stationName": "NYC Hub 1",
    "city": "NYC",
    "metrics": { ... }
  },
  {
    "stationId": "station-1",
    "stationName": "LA Hub 2",
    "city": "LA",
    "metrics": { ... }
  }
]
```

### Refresh Metrics
```http
POST /api/monitoring/update-metrics/station-0

```

---

## Decision Engine (STEPS 3-5)

### Evaluate Station
```http
POST /api/decisions/evaluate/station-0

{
  "mode": "conservative"
}
```

**Modes:**
- `conservative` (default): Recommend only
- `aggressive`: Auto-execute actions

**Response:**
```json
{
  "stationId": "station-0",
  "status": "Warning",
  "triggers": [
    {
      "name": "Congestion",
      "severity": "Warning",
      "metric": "queueLength",
      "value": 6,
      "threshold": 5,
      "reason": "Queue length (6) exceeds threshold (5)"
    },
    {
      "name": "Stockout Risk",
      "severity": "Critical",
      "metric": "chargedBatteries",
      "value": 2,
      "threshold": 3,
      "reason": "Low battery inventory (2) with high demand (8 swaps/15min)"
    }
  ],
  "recommendations": [
    {
      "id": "uuid",
      "stationId": "station-0",
      "stationName": "NYC Hub 1",
      "timestamp": "2026-01-23T10:30:00.000Z",
      "trigger": "Congestion",
      "severity": "Warning",
      "action": "Reroute Drivers",
      "mode": "conservative",
      "explanation": {
        "why": "Queue length (6) exceeds threshold (5). Drivers are waiting too long.",
        "expectedImpact": "Queue ↓ by ~35%, Wait time ↓",
        "confidence": "High"
      },
      "status": "pending-approval",
      "metrics": { ... }
    },
    {
      "id": "uuid",
      "stationId": "station-0",
      "stationName": "NYC Hub 1",
      "timestamp": "2026-01-23T10:30:00.000Z",
      "trigger": "Stockout Risk",
      "severity": "Critical",
      "action": "Initiate Inventory Rebalance",
      "mode": "conservative",
      "explanation": {
        "why": "Low battery inventory (2) with high demand (8 swaps/15min). Station may run out of charged batteries.",
        "expectedImpact": "Stockout probability ↓ by ~80%",
        "confidence": "High"
      },
      "status": "pending-approval",
      "metrics": { ... }
    }
  ],
  "explanations": [
    {
      "why": "Queue length (6) exceeds threshold (5)...",
      "expectedImpact": "Queue ↓ by ~35%, Wait time ↓",
      "confidence": "High"
    }
  ]
}
```

### Evaluate All Stations
```http
POST /api/decisions/evaluate-all

{
  "mode": "conservative"
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "stationId": "station-0",
      "stationName": "NYC Hub 1",
      "status": "Critical",
      "triggerCount": 2,
      "actionCount": 2,
      "recommendations": [ ... ]
    },
    {
      "stationId": "station-1",
      "stationName": "LA Hub 2",
      "status": "Normal",
      "triggerCount": 0,
      "actionCount": 0,
      "recommendations": []
    }
  ]
}
```

### Get Decision Explanation
```http
GET /api/decisions/explain/decision-uuid

```

**Response:**
```json
{
  "id": "decision-uuid",
  "stationId": "station-0",
  "stationName": "NYC Hub 1",
  "timestamp": "2026-01-23T10:30:00.000Z",
  "trigger": "Stockout Risk",
  "severity": "Critical",
  "action": "Initiate Inventory Rebalance",
  "mode": "conservative",
  "explanation": {
    "why": "Low battery inventory (2) with high demand (8 swaps/15min). Station may run out of charged batteries.",
    "expectedImpact": "Stockout probability ↓ by ~80%",
    "confidence": "High"
  },
  "status": "pending-approval",
  "metrics": { ... }
}
```

### Approve Decision
```http
POST /api/decisions/approve/decision-uuid

```

**Response:**
```json
{
  "success": true,
  "decision": {
    "id": "decision-uuid",
    "status": "approved",
    "approvedAt": "2026-01-23T10:35:00.000Z",
    ...
  }
}
```

---

## Dashboard APIs (STEP 6)

### Get All Stations
```http
GET /api/stations

```

**Response:**
```json
[
  {
    "id": "station-0",
    "name": "NYC Hub 1",
    "city": "NYC",
    "status": "Warning",
    "metrics": {
      "swapRate": 12,
      "queueLength": 6,
      "chargedBatteries": 2,
      "chargerUptimePercent": 95,
      "errorFrequency": 2
    },
    "recentSignals": [ ... ],
    "lastUpdate": "2026-01-23T10:30:00.000Z",
    "triggers": [ ... ]
  }
]
```

### Get Single Station
```http
GET /api/stations/station-0

```

**Response:**
```json
{
  "id": "station-0",
  "name": "NYC Hub 1",
  "city": "NYC",
  "status": "Warning",
  "metrics": { ... },
  "recentSignals": [ ... ],
  "lastUpdate": "2026-01-23T10:30:00.000Z",
  "triggers": [ ... ]
}
```

### Get Alerts (Sorted by Risk)
```http
GET /api/alerts

```

**Response:**
```json
[
  {
    "stationId": "station-0",
    "stationName": "NYC Hub 1",
    "status": "Critical",
    "triggers": [
      {
        "name": "Stockout Risk",
        "severity": "Critical",
        "reason": "Low battery inventory (2) with high demand (8 swaps/15min)"
      }
    ],
    "metrics": { ... },
    "timestamp": "2026-01-23T10:30:00.000Z"
  },
  {
    "stationId": "station-1",
    "stationName": "LA Hub 2",
    "status": "Warning",
    "triggers": [ ... ],
    "metrics": { ... },
    "timestamp": "2026-01-23T10:31:00.000Z"
  }
]
```

### Get Decision History
```http
GET /api/decisions-log

```

**Response:**
```json
[
  {
    "id": "uuid",
    "stationId": "station-0",
    "trigger": "Congestion",
    "action": "Reroute Drivers",
    "status": "pending-approval",
    "timestamp": "2026-01-23T10:30:00.000Z"
  },
  {
    "id": "uuid",
    "stationId": "station-1",
    "trigger": "Charger Fault",
    "action": "Create Maintenance Ticket",
    "status": "approved",
    "timestamp": "2026-01-23T10:25:00.000Z"
  }
]
```

---

## Signal Types

### Swap Event
```json
{
  "type": "swap_event",
  "data": {
    "driverId": "driver-123",
    "oldBatteryId": "bat-456",
    "newBatteryId": "bat-789",
    "swapTime": 3,
    "status": "completed"
  }
}
```

### Charger Status
```json
{
  "type": "charger_status",
  "data": {
    "chargerId": "charger-1",
    "status": "up",
    "errorCode": null,
    "temperature": 45
  }
}
```

### Battery Inventory
```json
{
  "type": "battery_inventory",
  "data": {
    "charged": 8,
    "uncharged": 5,
    "totalCapacity": 20
  }
}
```

### Error Log
```json
{
  "type": "error_log",
  "data": {
    "errorCode": "ERR-001",
    "message": "Charger timeout",
    "severity": "high"
  }
}
```

---

## Trigger Rules Reference

| Trigger | Condition | Severity | Action |
|---------|-----------|----------|--------|
| Congestion | `queue > 5` | Warning | Reroute Drivers |
| Stockout Risk | `batteries < 3 && demand > 5` | Warning/Critical | Inventory Rebalance |
| Charger Fault | `errors >= 3` | Warning | Create Maintenance Ticket |
| Charger Downtime | `uptime < 90%` | Warning | Alert Maintenance |
| Multi-Failure | `triggers >= 2` | Critical | Escalate to Manager |

---

## Example: Full Request/Response Cycle

### 1. Send signals
```bash
curl -X POST http://localhost:5000/api/signals/batch \
  -H "Content-Type: application/json" \
  -d '{
    "signals": [
      { "stationId": "station-0", "type": "error_log", "data": { "errorCode": "E1", "severity": "high" } },
      { "stationId": "station-0", "type": "error_log", "data": { "errorCode": "E2", "severity": "high" } },
      { "stationId": "station-0", "type": "error_log", "data": { "errorCode": "E3", "severity": "high" } }
    ]
  }'
```

### 2. Get metrics
```bash
curl http://localhost:5000/api/monitoring/station/station-0
```

### 3. Evaluate
```bash
curl -X POST http://localhost:5000/api/decisions/evaluate/station-0 \
  -H "Content-Type: application/json" \
  -d '{"mode": "conservative"}'
```

### 4. Get alerts
```bash
curl http://localhost:5000/api/alerts
```

### 5. Approve decision
```bash
curl -X POST http://localhost:5000/api/decisions/approve/{decisionId} \
  -H "Content-Type: application/json"
```

---

**For more details, see [README.md](README.md) and [QUICKSTART.md](QUICKSTART.md)**
