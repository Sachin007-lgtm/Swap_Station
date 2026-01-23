# 🔋 Swap Station Monitoring System

Real-time AI-powered monitoring system for EV battery swap stations. Detects risks, makes intelligent decisions, and explains recommendations to operations teams.

## 🎯 Vision

**"We don't replace ops teams. We give them early signals, the best action, and a clear reason — so they can act before drivers are impacted."**

## 🏗️ Architecture

```
Station Signals → Monitoring Model → Trigger Rules → Decision Engine → Explainability → Ops Dashboard → Actions
```

## 📋 System Components (7 Steps)

### **STEP 1: Collect & Stream Signals** ✅
Real-time data collection from all swap stations:
- Swap events (driver arrivals/completions)
- Charger status (up/down/errors)
- Battery inventory (charged vs uncharged)
- Error logs

**Routes:**
- `POST /api/signals/receive` - Send single signal
- `POST /api/signals/batch` - Batch send signals
- `GET /api/signals/:stationId/recent` - Get recent signals

### **STEP 2: Monitoring Model** ✅
Transforms raw signals into actionable metrics:
- Swap rate (swaps per 15 min)
- Queue length (derived from demand vs capacity)
- Charged battery count
- Charger uptime %
- Error frequency trend

**Routes:**
- `GET /api/monitoring/station/:stationId` - Single station metrics
- `GET /api/monitoring/all` - All stations metrics
- `POST /api/monitoring/update-metrics/:stationId` - Refresh metrics

### **STEP 3: Trigger Thresholds** ✅
Rules engine that detects when something is wrong:

| Trigger | Condition | Severity |
|---------|-----------|----------|
| Congestion | Queue > 5 OR wait time > 7 mins | Warning |
| Stockout Risk | Charged batteries < 3 AND demand rising | Warning/Critical |
| Charger Fault | Same error repeated ≥ 3 times | Warning |
| Charger Downtime | Uptime < 90% | Warning |
| Multi-Failure | 2+ issues detected | Critical |

### **STEP 4: Decision Logic** ✅
Smart recommendations based on triggered conditions:

| Trigger | Action |
|---------|--------|
| Congestion | Reroute Drivers |
| Stockout Risk | Initiate Inventory Rebalance |
| Charger Fault | Create Maintenance Ticket |
| Charger Downtime | Alert Maintenance Team |
| Multi-Failure | Escalate to On-Call Manager |

**Modes:**
- **Conservative**: Recommend only (default)
- **Aggressive**: Auto-execute during high risk

### **STEP 5: Explainability** ✅
Every recommendation includes:
- **Why**: Which metric crossed which threshold
- **Expected Impact**: How it will improve metrics
- **Confidence**: High / Medium / Low

Example: _"Queue exceeded threshold (6 > 5) and charged batteries dropped to 2. Rerouting will reduce wait time by ~35%. Confidence: High."_

### **STEP 6: Ops Dashboard** ✅
Real-time UI for operations teams:

**City View:**
- Green/Yellow/Red status cards for all stations
- Live metrics at a glance
- Quick access to alerts

**Station Detail View:**
- Detailed metrics breakdown
- Active triggers + reason
- AI recommendations with explanations
- Recent signals log
- Approval controls for actions

**Alerts Panel:**
- Sorted by risk (Critical → Warning)
- Filterable by station/type
- Direct action recommendations

**Routes:**
- `GET /api/stations` - All stations
- `GET /api/stations/:id` - Station detail
- `GET /api/alerts` - All alerts sorted by risk
- `GET /api/decisions-log` - Decision history

### **STEP 7: Integration** ✅
(Ready to connect to):
- Maintenance systems (create tickets)
- Driver apps (push rerouting notifications)
- Ops tools (Jarvis/Batman)
- Analytics (track success metrics)

**Success Metrics:**
- Avg queue time ↓
- Stockouts ↓
- Charger uptime ↑
- Driver satisfaction ↑

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- npm/yarn

### Backend Setup

```bash
cd backend
npm install
npm start  # Starts on http://localhost:5000
```

In another terminal, start the signal simulator:
```bash
npm run signal-simulator
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev  # Starts on http://localhost:3000
```

### API Base URL
- Backend: `http://localhost:5000`
- Frontend: `http://localhost:3000`
- WebSocket: `ws://localhost:5000`

---

## 📡 Signal Format

### Send a Signal
```bash
curl -X POST http://localhost:5000/api/signals/receive \
  -H "Content-Type: application/json" \
  -d '{
    "stationId": "station-0",
    "signalType": "swap_event",
    "data": {
      "driverId": "driver-123",
      "oldBatteryId": "bat-456",
      "newBatteryId": "bat-789",
      "swapTime": 3,
      "status": "completed"
    }
  }'
```

### Batch Send Signals
```bash
curl -X POST http://localhost:5000/api/signals/batch \
  -H "Content-Type: application/json" \
  -d '{
    "signals": [
      {
        "stationId": "station-0",
        "type": "charger_status",
        "data": { "chargerId": "charger-1", "status": "up" }
      },
      {
        "stationId": "station-1",
        "type": "battery_inventory",
        "data": { "charged": 8, "uncharged": 5 }
      }
    ]
  }'
```

---

## 🔍 Evaluation & Decisions

### Evaluate Station
```bash
curl -X POST http://localhost:5000/api/decisions/evaluate/station-0 \
  -H "Content-Type: application/json" \
  -d '{ "mode": "conservative" }'
```

**Response:**
```json
{
  "stationId": "station-0",
  "status": "Warning",
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
      "severity": "Warning",
      "explanation": {
        "why": "Queue length (6) exceeds threshold (5). Drivers are waiting too long.",
        "expectedImpact": "Queue ↓ by ~35%, Wait time ↓",
        "confidence": "High"
      },
      "status": "pending-approval"
    }
  ]
}
```

### Approve Decision
```bash
curl -X POST http://localhost:5000/api/decisions/approve/:decisionId \
  -H "Content-Type: application/json"
```

---

## 🎮 Dashboard Features

### City View
- **Status Cards**: Green (Normal), Yellow (Warning), Red (Critical)
- **Metrics Grid**: Queue, Batteries, Uptime, Swap Rate at a glance
- **Click to Detail**: Select any station for detailed analysis

### Station Detail
- **Live Metrics**: All 5 key metrics with status indicators
- **Active Triggers**: See what triggered the alert and why
- **AI Recommendations**: Get the recommended action with full explanation
- **Re-evaluate**: Manually trigger new evaluation
- **Signal Log**: See recent data inputs from the station

### Alerts Panel
- **Summary**: Critical count + Warning count
- **Sorted List**: Most critical stations first
- **Trigger Details**: Understand what's happening
- **Metrics Preview**: Quick metric snapshot per alert

---

## 📊 Data Flow Example

1. **Station sends swap_event signal** → Backend receives
2. **Monitoring engine processes** → Calculates new metrics
3. **Trigger rules fire** → "Queue now = 6 (exceeds threshold 5)"
4. **Decision engine recommends** → "Reroute Drivers"
5. **Explainability layer explains** → "This will reduce wait time by 35%"
6. **Dashboard shows** → Red alert card with recommendation
7. **Ops manager approves** → Action executed

---

## 🛠️ Development

### Project Structure
```
Swap_station/
├── backend/
│   ├── server.js                 # Main server
│   ├── routes/
│   │   ├── signals.js           # STEP 1: Signal collection
│   │   ├── monitoring.js        # STEP 2: Metrics computation
│   │   └── decisions.js         # STEPS 3-5: Rules, decisions, explain
│   ├── scripts/
│   │   └── signalSimulator.js   # Simulates real station signals
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── App.jsx              # Main app + Alerts panel
    │   ├── pages/
    │   │   └── Dashboard.jsx    # STEP 6: Main dashboard
    │   └── components/
    │       ├── CityView.jsx     # City-wide station view
    │       └── StationDetail.jsx # Detailed station analysis
    ├── index.html
    ├── vite.config.js
    └── package.json
```

### Adding New Triggers
Edit [backend/routes/decisions.js](backend/routes/decisions.js#L15) `checkTriggers()` function:

```javascript
// Example: Add "Low Battery Uptime"
if (metrics.chargerUptimePercent < 70) {
  triggers.push({
    name: 'Critical Charger Downtime',
    severity: 'Critical',
    metric: 'chargerUptimePercent',
    value: metrics.chargerUptimePercent,
    threshold: 70,
    reason: `Charger critical downtime (${metrics.chargerUptimePercent}%)`
  });
}
```

### WebSocket Real-time Updates
Backend emits updates to all connected clients:
```javascript
io.emit('signal-received', { stationId, signal, timestamp });
io.emit('stations-update', stationsArray);
```

Frontend subscribes:
```javascript
socket.on('signal-received', (data) => { /* update UI */ });
socket.on('stations-update', (data) => { /* refresh stations */ });
```

---

## 📈 Metrics Computed

For each station, the monitoring model computes:

```javascript
{
  swapRate: number,              // Swaps per 15 minutes
  queueLength: number,           // Estimated drivers waiting
  chargedBatteries: number,      // Available charged units
  chargerUptimePercent: number,  // 0-100%
  errorFrequency: number,        // Recent errors count
  timestamp: Date
}
```

---

## 🎓 How to Use in Hackathon

1. **Day 1**: Scaffold & demo station cards (Step 6)
2. **Day 2**: Wire signals → metrics → dashboard (Steps 1-2)
3. **Day 3**: Add trigger rules (Step 3)
4. **Day 4**: Decision logic + explainability (Steps 4-5)
5. **Day 5**: Polish, demo to judges

**Judge Pitch:**
> "We built an AI system that gives ops teams early warning before drivers are impacted. Every alert explains why it happened and what action to take. It's not about replacing humans—it's about giving them the right information at the right time."

---

## 📝 Environment Variables

### Backend (.env)
```
PORT=5000
NODE_ENV=development
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000
```

---

## 🐛 Troubleshooting

**Backend won't start?**
```bash
cd backend && npm install && npm start
```

**Frontend can't connect to API?**
- Check backend is running on `:5000`
- Check CORS is enabled in [server.js](backend/server.js#L9)
- Check vite proxy config in [vite.config.js](frontend/vite.config.js#L5)

**Signals not appearing?**
- Run signal simulator: `npm run signal-simulator`
- Check backend console for "Signal received" logs
- Check WebSocket connection in browser DevTools

---

## 🎉 Next Steps

1. Deploy to Azure / AWS
2. Add real database (MongoDB / PostgreSQL)
3. Integrate with real station APIs
4. Add machine learning for predictive alerts
5. Create mobile app for on-the-go monitoring

---

**Built with ❤️ for EV swap station operations**
