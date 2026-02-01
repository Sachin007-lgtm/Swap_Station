# Jarvis / Batman Ops Tools Integration

This document defines integration points for **Jarvis** and **Batman** (or any external ops/command-center tools) with the Swap Station AI Copilot.

---

## Overview

- **Outbound**: Copilot pushes alerts and recommendations to Jarvis/Batman (webhooks or API).
- **Inbound**: Jarvis/Batman can acknowledge alerts, override recommendations, or trigger re-evaluation.

---

## 1. Outbound: Alerts & Recommendations to Jarvis/Batman

### Webhook (recommended)

Configure your backend to receive Copilot events by setting:

```bash
# .env (backend)
JARVIS_WEBHOOK_URL=https://your-jarvis-domain.com/api/swap-station/copilot-events
JARVIS_API_KEY=your-secret-key
```

**Payload** (POST, JSON):

```json
{
  "event_type": "alert",
  "timestamp": "2026-01-31T12:00:00.000Z",
  "source": "swap-station-copilot",
  "station_id": "station-0",
  "station_name": "Connaught Place Hub",
  "status": "warning",
  "triggers": [
    {
      "name": "Congestion",
      "severity": "Warning",
      "reason": "Queue length (6) exceeds threshold (5)",
      "metric": "queueLength",
      "value": 6,
      "threshold": 5
    }
  ],
  "recommendations": [
    {
      "id": "uuid",
      "action": "Reroute Drivers",
      "explanation": {
        "why": "Queue length (6) exceeds threshold (5). Drivers are waiting too long.",
        "expectedImpact": "Queue ↓ by ~35%, Wait time ↓",
        "confidence": "High",
        "probableRootCause": null,
        "timeToStockoutMinutes": null
      },
      "status": "pending-approval"
    }
  ],
  "metrics_snapshot": {
    "swapRate": 12,
    "queueLength": 6,
    "chargedBatteries": 8,
    "chargerUptimePercent": 95,
    "errorFrequency": 0
  }
}
```

**Event types**: `alert`, `recommendation_approved`, `recommendation_rejected`, `maintenance_ticket_created`, `reroute_executed`.

**Headers**:

- `Content-Type: application/json`
- `Authorization: Bearer <JARVIS_API_KEY>`
- `X-Source: swap-station-copilot`

**Your endpoint** should:

1. Validate `Authorization` (and optionally `X-Source`).
2. Return `200 OK` (or `204`) on success; Copilot may retry on 5xx (exponential backoff, 3 retries).

---

## 2. Inbound: Jarvis/Batman → Copilot

### 2.1 Acknowledge alert

```http
POST /api/integration/acknowledge-alert
Authorization: Bearer <COPILOT_API_KEY>
Content-Type: application/json

{
  "alert_id": "alert-station-0-Congestion-0",
  "acknowledged_by": "jarvis",
  "notes": "Handled via runbook #12"
}
```

**Response**: `200 OK`, `{ "success": true }`

### 2.2 Override recommendation (reject / defer)

```http
POST /api/integration/recommendation-override
Authorization: Bearer <COPILOT_API_KEY>
Content-Type: application/json

{
  "decision_id": "uuid",
  "action": "reject",
  "reason": "Planned maintenance in 1h; will handle then",
  "source": "batman"
}
```

**Response**: `200 OK`, `{ "success": true }`

### 2.3 Trigger re-evaluate (all stations)

```http
POST /api/decisions/evaluate-all
Authorization: Bearer <COPILOT_API_KEY>
Content-Type: application/json

{
  "mode": "conservative"
}
```

**Response**: `200 OK`, `{ "results": [ ... ] }`

---

## 3. Authentication

| Direction   | Auth model |
|------------|------------|
| Copilot → Jarvis/Batman | You provide a webhook URL + optional API key; Copilot sends `Authorization: Bearer <JARVIS_API_KEY>`. |
| Jarvis/Batman → Copilot | Set `COPILOT_API_KEY` in Copilot backend; Jarvis/Batman must send this on inbound calls. |

---

## 4. Success metrics (read-only)

Jarvis/Batman can pull Copilot success metrics for dashboards:

```http
GET /api/success-metrics
Authorization: Bearer <COPILOT_API_KEY>
```

**Response**:

```json
{
  "queueTimeReduction": 15.5,
  "stockoutReduction": 100,
  "uptimeImprovement": 2.3,
  "current": {
    "timestamp": "2026-01-31T12:00:00.000Z",
    "avgQueueTime": 4.2,
    "stockoutCount": 0,
    "avgUptime": 96.1
  },
  "period": "last vs previous half of snapshots"
}
```

---

## 5. Implementation checklist (Copilot side)

- [ ] Add `JARVIS_WEBHOOK_URL` and `JARVIS_API_KEY` to backend `.env`.
- [ ] On new alert or recommendation, POST to Jarvis webhook with payload above.
- [ ] Add routes: `POST /api/integration/acknowledge-alert`, `POST /api/integration/recommendation-override` (validate `COPILOT_API_KEY`).
- [ ] Optional: persist outbound delivery status for debugging.

---

## 6. Implementation checklist (Jarvis/Batman side)

- [ ] Expose webhook endpoint; validate Bearer token.
- [ ] Map `station_id` to your asset IDs; display alerts and recommendations in your UI.
- [ ] Optionally call Copilot inbound APIs to acknowledge alerts or override recommendations.
- [ ] Optionally poll `GET /api/success-metrics` for ops dashboards.

---

**Contact**: For custom payloads or rate limits, extend this contract and document in this file.
