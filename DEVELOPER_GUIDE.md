# 🛠️ Developer Guide - Development Tips & Troubleshooting

## 🚀 Development Workflow

### Starting Fresh
```bash
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Signal Simulator  
cd backend
npm run signal-simulator

# Terminal 3: Frontend
cd frontend
npm run dev
```

**Open browser**: `http://localhost:3000`

### Hot Reload
- **Frontend**: Automatically refreshes when you save files
- **Backend**: Need to restart manually (Ctrl+C, then npm start)
- **Signal Simulator**: Need to restart manually

---

## 📝 Understanding the Code

### Backend Architecture

#### [backend/server.js](../backend/server.js)
Main Express server that:
1. Sets up CORS for frontend
2. Initializes WebSocket (Socket.io)
3. Creates 5 mock stations
4. Mounts routes for signals, monitoring, decisions

**Key line**: `io.emit('signal-received', ...)` broadcasts to all connected clients

#### [backend/routes/signals.js](../backend/routes/signals.js)
Handles incoming station signals:
- `POST /api/signals/receive` - One signal
- `POST /api/signals/batch` - Multiple signals
- Stores signals in station's array (max 100)
- Broadcasts to WebSocket clients

**Key pattern**:
```javascript
const signal = { id, type, data, timestamp };
station.recentSignals.push(signal);
io.emit('signal-received', { stationId, signal });
```

#### [backend/routes/monitoring.js](../backend/routes/monitoring.js)
Computes metrics from signals:
- `computeMetrics(station)` - Main function
- Filters signals by type
- Calculates each metric
- Updates station.metrics

**Key metric computation**:
```javascript
const swapEvents = signals.filter(s => s.type === 'swap_event');
const recentSwaps = swapEvents.filter(s => 
  new Date(s.timestamp).getTime() > Date.now() - 15 * 60 * 1000  // Last 15 min
);
const swapRate = recentSwaps.length;
```

#### [backend/routes/decisions.js](../backend/routes/decisions.js)
Three functions:
1. `checkTriggers(station)` - Detects problems
2. `decideAction(station, triggers)` - Recommends actions
3. `determineStatus(triggers)` - Sets station status

**Decision flow**:
```
Station metrics → Check triggers → Decide actions → Explainability layer
```

### Frontend Architecture

#### [frontend/src/App.jsx](../frontend/src/App.jsx)
Main component that:
1. Fetches stations & alerts on load
2. Sets up WebSocket listener
3. Polls for updates every 5 seconds
4. Renders Dashboard or Alerts based on page state

**Key state**:
```javascript
const [stationsData, setStationsData] = useState([])
const [alerts, setAlerts] = useState([])
const [currentPage, setCurrentPage] = useState('dashboard')
```

#### [frontend/src/pages/Dashboard.jsx](../frontend/src/pages/Dashboard.jsx)
Two views:
1. **City View**: All stations at once
2. **Station Detail**: Single station deep dive

**Toggle**: Click station → detail view, click back → city view

#### [frontend/src/components/CityView.jsx](../frontend/src/components/CityView.jsx)
Grid of station cards:
- Color-coded by status (Normal/Warning/Critical)
- Shows 4 key metrics
- Shows trigger count
- Click to select → detail view

#### [frontend/src/components/StationDetail.jsx](../frontend/src/components/StationDetail.jsx)
Detailed analysis of single station:
- All 5 metrics with icons
- Active triggers with explanations
- AI recommendations with "Why" + "Impact" + "Confidence"
- Recent signals log
- Re-evaluate button

---

## 🧪 Testing & Debugging

### Test 1: Verify Backend is Running
```bash
curl http://localhost:5000/api/stations
# Should return JSON array with 5 stations
```

### Test 2: Send a Signal
```bash
curl -X POST http://localhost:5000/api/signals/receive \
  -H "Content-Type: application/json" \
  -d '{
    "stationId": "station-0",
    "signalType": "error_log",
    "data": { "errorCode": "TEST", "severity": "high" }
  }'
```

### Test 3: Check Signals Were Received
```bash
curl http://localhost:5000/api/signals/station-0/recent
# Should show your signal in the array
```

### Test 4: Check Metrics Updated
```bash
curl http://localhost:5000/api/monitoring/station/station-0
# Should show errorFrequency increased by 1
```

### Test 5: Trigger a Rule (Charger Fault)
```bash
# Send 3 error signals to trigger "Charger Fault"
for i in {1..3}; do
  curl -X POST http://localhost:5000/api/signals/receive \
    -H "Content-Type: application/json" \
    -d "{\"stationId\":\"station-0\",\"signalType\":\"error_log\",\"data\":{\"errorCode\":\"E$i\"}}"
done
```

### Test 6: Evaluate Station
```bash
curl -X POST http://localhost:5000/api/decisions/evaluate/station-0 \
  -H "Content-Type: application/json" \
  -d '{"mode":"conservative"}'
# Should show triggers and recommendations
```

### Test 7: Check Alerts
```bash
curl http://localhost:5000/api/alerts
# Should show station-0 with Critical status
```

---

## 🔍 Debugging Tips

### Backend Debugging

**Check console output:**
```
📡 Signal received for station-0: error_log
✅ Signal sent to station-0: battery_inventory
```

**Enable verbose logging** (edit [server.js](../backend/server.js)):
```javascript
app.use(express.json());
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});
```

**Inspect station data** (edit [server.js](../backend/server.js)):
```javascript
app.get('/debug/stations', (req, res) => {
  const debug = Array.from(stationsData.entries()).map(([id, station]) => ({
    id,
    name: station.name,
    signals: station.recentSignals.length,
    metrics: station.metrics,
    triggers: station.triggers.length
  }));
  res.json(debug);
});
// Then: curl http://localhost:5000/debug/stations
```

### Frontend Debugging

**Open DevTools** (Press F12):

1. **Console tab**
   - Shows errors
   - Use `console.log()` in code

2. **Network tab**
   - See `/api/*` requests
   - Check WebSocket connection status
   - See response data

3. **Application tab**
   - Check localStorage
   - See WebSocket frames

**Common issues:**

```javascript
// If API calls fail, check:
// 1. Backend running? 
fetch('http://localhost:5000/api/stations').then(r => r.json()).then(console.log)

// 2. CORS enabled?
// Check for errors in console

// 3. WebSocket connected?
// In console: io should exist globally
```

---

## 🎨 Customizing the Dashboard

### Change Colors
Edit [frontend/src/components/CityView.css](../frontend/src/components/CityView.css):

```css
.station-card.status-critical {
  border-left-color: #ff0000; /* Change red */
}

.station-card.status-warning {
  border-left-color: #ffaa00; /* Change orange */
}
```

### Change Metrics Displayed
Edit [frontend/src/components/CityView.jsx](../frontend/src/components/CityView.jsx):

```javascript
// Add or remove MetricBox calls
<MetricBox label="Swaps" value={station.metrics.swapRate} unit="/15min" />
```

### Add New Card Type
Create `frontend/src/components/NewView.jsx`:

```javascript
export default function NewView({ stations }) {
  return (
    <div className="new-view">
      {/* Your component here */}
    </div>
  )
}
```

Import in `App.jsx` and add route.

---

## 🔄 Adding a New Trigger Rule

### Step 1: Define the Rule
Edit [backend/routes/decisions.js](../backend/routes/decisions.js) - `checkTriggers()` function:

```javascript
// STEP 3: Add new trigger
if (metrics.customValue > THRESHOLD) {
  triggers.push({
    name: 'Custom Alert',
    severity: 'Warning',
    metric: 'customValue',
    value: metrics.customValue,
    threshold: THRESHOLD,
    reason: `Custom metric (${metrics.customValue}) exceeds threshold (${THRESHOLD})`
  });
}
```

### Step 2: Define the Action
In `decideAction()` function:

```javascript
case 'Custom Alert':
  action = 'Custom Action';
  why = 'Why this action is needed';
  expectedImpact = 'What will improve';
  confidence = 'High';
  break;
```

### Step 3: Test It
```bash
# Send signals to trigger the condition
# Evaluate the station
curl -X POST http://localhost:5000/api/decisions/evaluate/station-0 \
  -H "Content-Type: application/json" \
  -d '{"mode":"conservative"}'
# Check for your new trigger in response
```

---

## 📊 Adding a New Metric

### Step 1: Compute the Metric
Edit [backend/routes/monitoring.js](../backend/routes/monitoring.js) - `computeMetrics()`:

```javascript
const customMetric = signals.filter(s => s.type === 'custom_signal').length;
```

### Step 2: Return It
In the return statement:

```javascript
return {
  swapRate,
  queueLength,
  chargedBatteries,
  chargerUptimePercent,
  errorFrequency,
  customMetric,  // Add here
  timestamp: new Date()
};
```

### Step 3: Display in Dashboard
Edit [frontend/src/components/StationDetail.jsx](../frontend/src/components/StationDetail.jsx):

```javascript
<MetricCard
  icon={<CustomIcon size={32} />}
  label="Custom Metric"
  value={station.metrics.customMetric}
  unit="units"
  status="normal"
/>
```

### Step 4: Test It
```bash
curl http://localhost:5000/api/monitoring/station/station-0
# Should show your new metric
```

---

## 🚀 Performance Tips

### Reduce Signal Volume
In [backend/scripts/signalSimulator.js](../backend/scripts/signalSimulator.js):

```javascript
// Change from 3000ms to higher value
setInterval(() => {
  const randomStation = STATIONS[Math.floor(Math.random() * STATIONS.length)];
  sendSignal(randomStation);
}, 5000); // Change from 3000 to 5000ms
```

### Reduce Dashboard Polling
In [frontend/src/App.jsx](../frontend/src/App.jsx):

```javascript
// Change from 5000ms to higher value
const interval = setInterval(() => {
  axios.get('/api/stations').then(res => setStationsData(res.data))
}, 10000); // Change from 5000 to 10000ms
```

### Limit Recent Signals
In [backend/routes/signals.js](../backend/routes/signals.js):

```javascript
// Keep only last 50 signals instead of 100
if (station.recentSignals.length > 50) {
  station.recentSignals.shift();
}
```

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot POST /api/signals/receive"
**Solution**: Check backend is running and CORS is enabled in [server.js](../backend/server.js#L9)

### Issue: Frontend shows "All systems normal" but simulator is running
**Solution**: 
- Check backend console for "Signal received" logs
- Check frontend console (F12) for errors
- Refresh page (Ctrl+F5)
- Check WebSocket connection in Network tab

### Issue: Alerts never show
**Solution**:
- Send multiple error signals to trigger "Charger Fault"
- Call `/api/decisions/evaluate/station-0` endpoint
- Check decision response has triggers

### Issue: Dashboard takes 10+ seconds to load
**Solution**:
- Close signal simulator if not needed
- Clear browser cache
- Check network tab for slow endpoints

### Issue: Station metrics not updating
**Solution**:
- Run `/api/monitoring/update-metrics/station-0`
- Send signals first (need data to compute metrics)
- Check recent signals with `/api/signals/station-0/recent`

---

## 📚 Code Organization

### Backend Layers

```
server.js (Main server setup)
    ↓
routes/signals.js (Signal collection)
    ↓
routes/monitoring.js (Metrics computation)
    ↓
routes/decisions.js (Rules & decisions)
    ↓
WebSocket broadcast to frontend
```

### Frontend Layers

```
main.jsx (Entry point)
    ↓
App.jsx (API calls, WebSocket, routing)
    ↓
Dashboard.jsx (Two views)
    ↓
CityView.jsx (All stations)
StationDetail.jsx (Single station)
    ↓
CSS for styling
```

---

## ✨ Best Practices

### When Adding Features
1. **Add to backend first**: Create route → test with curl
2. **Update frontend**: Import component → test in browser
3. **Test API**: Use curl or Postman
4. **Check console**: Browser DevTools & terminal

### When Debugging
1. **Check backend console** for errors/logs
2. **Open frontend console** (F12) for client errors
3. **Use Network tab** to inspect API responses
4. **Test API directly** with curl

### When Modifying Rules
1. **Edit checkTriggers()** to add condition
2. **Edit decideAction()** to add recommendation
3. **Send test signals** to trigger the rule
4. **Evaluate station** to see result

---

## 🎓 Learning Resources

**Express.js**: Routes, middleware, error handling  
**React**: Hooks (useState, useEffect), components  
**Socket.io**: Real-time WebSocket connections  
**CSS3**: Grid, flexbox, animations  

---

**Happy coding! 🚀**
