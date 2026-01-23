# 🎯 Getting Started - Swap Station Monitoring System

## 📋 What You Have

Your project is fully scaffolded with a **7-step architecture** for real-time monitoring:

```
Signals → Metrics → Rules → Decisions → Explainability → Dashboard → Actions
```

## 🚀 Quick Start (5 minutes)

### Windows Users
```bash
# In PowerShell from project root
cd c:\Users\sachi\Desktop\Swap_station
.\setup.bat
```

### Mac/Linux Users
```bash
cd ~/Desktop/Swap_station
bash setup.sh
```

## 🖥️ Running the System (3 terminals)

### Terminal 1: Backend Server
```bash
cd backend
npm start
```
✅ Server runs on `http://localhost:5000`

### Terminal 2: Signal Simulator (in another terminal)
```bash
cd backend
npm run signal-simulator
```
✅ Sends realistic station signals every 3 seconds

### Terminal 3: Frontend Dashboard (in another terminal)
```bash
cd frontend
npm run dev
```
✅ Dashboard runs on `http://localhost:3000`

## 🌐 Access the Dashboard

Open your browser: **http://localhost:3000**

You should see:
- 5 swap stations (NYC, LA, Chicago, Boston, Seattle)
- Green/Yellow/Red status indicators
- Live metrics (queue, batteries, uptime, swap rate)
- Alerts panel

## 📡 What's Happening

1. **Signal Simulator** sends random station signals (swap events, charger status, battery inventory, errors)
2. **Backend** collects signals and computes metrics
3. **Trigger Rules** detect when thresholds are crossed
4. **Decision Engine** recommends actions with explanations
5. **Frontend Dashboard** displays everything in real-time

## 🎮 Try These Actions

### 1. View City Dashboard
- **Green cards**: All systems normal
- **Yellow cards**: Warning (queue high, batteries low, etc.)
- **Red cards**: Critical (multiple failures)

### 2. Click on a Station
- See detailed metrics
- View active triggers
- Read AI recommendations with full explanations

### 3. Re-evaluate a Station
- Click "🔍 Re-evaluate Station" button
- New decision engine run
- Updated recommendations

### 4. Check Alerts Panel
- See all critical/warning alerts
- Sorted by severity
- Each alert shows triggers and metrics

## 🧪 Test API Directly

### Send a Signal
```bash
curl -X POST http://localhost:5000/api/signals/receive \
  -H "Content-Type: application/json" \
  -d '{
    "stationId": "station-0",
    "signalType": "error_log",
    "data": {
      "errorCode": "ERR-001",
      "message": "Charger timeout",
      "severity": "high"
    }
  }'
```

### Get All Alerts
```bash
curl http://localhost:5000/api/alerts
```

### Get Station Metrics
```bash
curl http://localhost:5000/api/monitoring/all
```

### Evaluate a Station
```bash
curl -X POST http://localhost:5000/api/decisions/evaluate/station-0 \
  -H "Content-Type: application/json" \
  -d '{"mode": "conservative"}'
```

## 📚 Project Structure

```
Swap_station/
├── backend/
│   ├── server.js                    # Main Express server
│   ├── routes/
│   │   ├── signals.js              # STEP 1: Signal collection
│   │   ├── monitoring.js           # STEP 2: Metrics calculation
│   │   └── decisions.js            # STEPS 3-5: Rules, decisions, explanations
│   ├── scripts/
│   │   └── signalSimulator.js      # Simulates station signals
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                 # Main app with alerts panel
│   │   ├── pages/
│   │   │   └── Dashboard.jsx       # City view & station detail
│   │   ├── components/
│   │   │   ├── CityView.jsx        # Station cards
│   │   │   └── StationDetail.jsx   # Detailed analysis
│   │   ├── App.css
│   │   └── index.css
│   ├── vite.config.js
│   ├── index.html
│   └── package.json
│
├── README.md                        # Full documentation
└── setup.bat/setup.sh              # Setup scripts
```

## 🎯 Understanding the 7 Steps

### STEP 1: Signal Collection ✅
**Files**: [backend/routes/signals.js](../backend/routes/signals.js)

Receives real-time data from stations:
- `POST /api/signals/receive` - Single signal
- `POST /api/signals/batch` - Batch signals
- `GET /api/signals/:stationId/recent` - Get recent

### STEP 2: Monitoring Model ✅
**Files**: [backend/routes/monitoring.js](../backend/routes/monitoring.js)

Computes metrics from signals:
- Swap rate
- Queue length
- Battery inventory
- Charger uptime
- Error frequency

### STEP 3: Trigger Rules ✅
**Files**: [backend/routes/decisions.js](../backend/routes/decisions.js) - `checkTriggers()` function

Detects problems:
- Congestion (queue > 5)
- Stockout risk (batteries < 3 + demand rising)
- Charger fault (errors ≥ 3)
- Charger downtime (uptime < 90%)
- Multi-failure (2+ issues)

### STEP 4: Decision Logic ✅
**Files**: [backend/routes/decisions.js](../backend/routes/decisions.js) - `decideAction()` function

Recommends actions:
- Reroute Drivers
- Inventory Rebalance
- Create Maintenance Ticket
- Alert Maintenance Team
- Escalate Outage

### STEP 5: Explainability ✅
**Files**: [backend/routes/decisions.js](../backend/routes/decisions.js) - `explanation` field

Every recommendation explains:
- **Why** it was triggered
- **Expected Impact** on metrics
- **Confidence** level

### STEP 6: Dashboard (Ops Interface) ✅
**Files**: [frontend/src/App.jsx](../frontend/src/App.jsx), [CityView.jsx](../frontend/src/components/CityView.jsx), [StationDetail.jsx](../frontend/src/components/StationDetail.jsx)

Shows:
- City view with all stations
- Station detail with metrics
- Alerts panel

### STEP 7: Integration (Ready to Connect) ✅
**Files**: [backend/routes/decisions.js](../backend/routes/decisions.js) - `POST /api/decisions/approve/:decisionId`

Ready to integrate with:
- Maintenance systems
- Driver apps
- Ops tools

## 🛠️ Customization

### Add a New Trigger
Edit [backend/routes/decisions.js](../backend/routes/decisions.js) in `checkTriggers()`:

```javascript
// Add "Solar Panel Issues"
if (metrics.solarUptimePercent < 50) {
  triggers.push({
    name: 'Solar Panel Degradation',
    severity: 'Warning',
    metric: 'solarUptimePercent',
    value: metrics.solarUptimePercent,
    threshold: 50,
    reason: `Solar panels operating at only ${metrics.solarUptimePercent}%`
  });
}
```

### Change Trigger Threshold
In `checkTriggers()`, adjust values:
```javascript
// Default: Queue > 5, change to Queue > 10
if (metrics.queueLength > 10) {
  // ... trigger
}
```

### Add New Metric
Edit [backend/routes/monitoring.js](../backend/routes/monitoring.js) in `computeMetrics()`:

```javascript
// Add solar uptime metric
const solarUptimePercent = solarSignals.length > 0
  ? Math.round(solarSignals.filter(s => s.data.status === 'on').length / solarSignals.length * 100)
  : 100;
```

### Change Dashboard Colors
Edit [frontend/src/components/CityView.css](../frontend/src/components/CityView.css):

```css
.status-badge-critical {
  background: rgba(239, 68, 68, 0.2);  /* Change this RGB */
  color: #ef4444;
}
```

## 🐛 Debugging

### Check Backend Logs
```bash
# In Terminal 1, look for:
📡 Signal received for station-0: swap_event
✅ Signal sent to station-0: battery_inventory
```

### Check Frontend Console
```bash
# Press F12 in browser
# Look for WebSocket connections
# Check network requests to /api/*
```

### Check Signal Simulator
```bash
# In Terminal 2, look for:
✅ Signal sent to station-0: swap_event
❌ Error sending signal to station-0: Connection refused
```

## 📊 Example Workflow

1. **Simulator sends charger error signals** to station-0
2. **Backend computes metrics** - error frequency rises
3. **Trigger rule fires** - "Charger Fault" (3+ errors)
4. **Decision engine recommends** - "Create Maintenance Ticket"
5. **Explainability layer explains** - "Multiple charger errors detected, early intervention recommended"
6. **Dashboard shows** - station-0 turns Yellow/Red
7. **Ops manager approves** - ticket created in maintenance system

## 🚀 Next Steps for Hackathon

**Day 1-2**: Get familiar with dashboard
- Start backend & simulator
- Open dashboard
- Click stations to see details
- Read explanations

**Day 3**: Modify a trigger
- Change a threshold value
- Run evaluation
- See new recommendations

**Day 4-5**: Add a new signal type
- Add signal handler
- Add metric computation
- Add trigger rule
- See it in dashboard

## 📞 Need Help?

**Backend won't start?**
```bash
cd backend
npm install
npm start
```

**Frontend can't connect?**
- Check backend is running on `:5000`
- Check `vite.config.js` proxy is set to `http://localhost:5000`
- Refresh browser

**No signals appearing?**
- Run signal simulator: `npm run signal-simulator`
- Check backend console for "Signal received" messages
- Check network tab in browser DevTools

**Dashboard looks broken?**
- Clear browser cache (Ctrl+Shift+Del)
- Hard refresh (Ctrl+F5)
- Check browser console (F12) for errors

## 🎉 You're Ready!

Everything is set up and running. Open **http://localhost:3000** and explore!

The system is designed to show the judges that AI in operations is about **giving teams the right information at the right time**, not replacing them.

**Good luck! 🚀**
