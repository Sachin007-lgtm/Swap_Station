# Reroute Notification Integration

## Overview
The system now sends real reroute notifications to your backend endpoint with full retry logic and error tracking.

## Configuration

### Environment Variables
Create a `.env` file in the `backend/` directory:

```bash
REROUTE_API_ENDPOINT=https://your-backend-domain.com/api/reroute-driver
REROUTE_API_TOKEN=DEMO_REROUTE_TOKEN
DEMO_DRIVER_PHONE=+91XXXXXXXXXX
PORT=5000
```

Replace:
- `your-backend-domain.com` with your actual domain
- `DEMO_REROUTE_TOKEN` with your actual service token
- `+91XXXXXXXXXX` with actual demo driver phone

## How It Works

### 1. When Congestion is Detected
- System detects queue > 5
- Recommends "Reroute Drivers"
- Shows in dashboard with explanation

### 2. Ops Manager Approves
```bash
POST /api/decisions/approve/:decisionId
Body: { "mode": "live_demo" }  # or "simulation"
```

### 3. System Executes Reroute
- Finds best nearby station
- Builds payload (see below)
- Sends to your endpoint with retry logic (up to 3 retries)
- Logs success/failure

## Payload Formats

### Live Demo Mode
```json
{
  "mode": "live_demo",
  "driver": {
    "driver_id": "DR_DEMO_042",
    "phone": "+91XXXXXXXXXX"
  },
  "station_from": "station-0",
  "station_to": "station-3",
  "distance_km": 1.3,
  "expected_wait_time_min": 2,
  "reason": "Congestion",
  "confidence": 0.89
}
```

### Simulation Mode
```json
{
  "mode": "simulation",
  "drivers": [
    { "driver_id": "DR_100" },
    { "driver_id": "DR_101" }
  ],
  "station_from": "station-0",
  "station_to": "station-3",
  "reason": "Congestion"
}
```

## Retry Logic

- **Max retries**: 3 attempts
- **Backoff**: Exponential (1s, 2s, 4s)
- **Logging**: All failures logged to `decisionsLog`

## Error Tracking

Failed notifications are logged with:
```json
{
  "id": "uuid",
  "type": "notification_failure",
  "timestamp": "2026-01-30T10:30:00Z",
  "payload": {...},
  "error": "API responded with status 500..."
}
```

## Testing

### Test with simulation mode:
```bash
curl -X POST http://localhost:5000/api/decisions/approve/:decisionId \
  -H "Content-Type: application/json" \
  -d '{"mode":"simulation"}'
```

### Test with live demo:
```bash
curl -X POST http://localhost:5000/api/decisions/approve/:decisionId \
  -H "Content-Type: application/json" \
  -d '{"mode":"live_demo"}'
```

## Your Backend Endpoint

Your `/api/reroute-driver` endpoint should:
1. Validate the Bearer token
2. Log the decision
3. Forward to n8n webhook
4. Return success response

Example response:
```json
{
  "success": true,
  "notification_id": "notif_123",
  "n8n_status": "queued"
}
```

## Next Steps

1. Replace env vars in `.env` with real values
2. Test with simulation mode first
3. Verify logs in console
4. Enable live_demo mode when ready
5. Monitor `decisionsLog` for failures
