# 🏗️ System Architecture

## High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    SWAP STATION MONITORING SYSTEM                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────┐
│  Stations   │  (Real or Simulated)
└──────┬──────┘
       │ Send Signals
       ↓
┌──────────────────────────────────────────────────────────┐
│              BACKEND (Node.js + Express)                 │
│                                                          │
│  STEP 1: Signal Collection                              │
│  ├─ POST /api/signals/receive                          │
│  ├─ POST /api/signals/batch                            │
│  └─ GET /api/signals/:stationId/recent                 │
│                                                          │
│  STEP 2: Monitoring Model                              │
│  ├─ Compute metrics from signals                        │
│  ├─ Swap rate, Queue, Batteries, Uptime, Errors        │
│  └─ GET /api/monitoring/all                            │
│                                                          │
│  STEP 3: Trigger Rules Engine                          │
│  ├─ Congestion (queue > 5)                             │
│  ├─ Stockout Risk (batteries < 3 + demand)             │
│  ├─ Charger Fault (errors ≥ 3)                         │
│  ├─ Charger Downtime (uptime < 90%)                    │
│  └─ Multi-Failure (2+ issues)                          │
│                                                          │
│  STEP 4: Decision Engine                               │
│  ├─ Trigger → Action mapping                           │
│  ├─ Conservative vs Aggressive modes                   │
│  └─ POST /api/decisions/evaluate/:stationId            │
│                                                          │
│  STEP 5: Explainability Layer                          │
│  ├─ Why: Which metric triggered                        │
│  ├─ Impact: Expected metric improvement                │
│  ├─ Confidence: High / Medium / Low                    │
│  └─ GET /api/decisions/explain/:decisionId             │
└──────────┬───────────────────────────────────────────────┘
           │ WebSocket (Real-time) + REST API
           ↓
┌──────────────────────────────────────────────────────────┐
│            FRONTEND (React + Vite + WebSocket)          │
│                                                          │
│  STEP 6: Operations Dashboard                          │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  City View: All Stations                         │  │
│  │  ┌─────────────────────────────────────────────┐ │  │
│  │  │ [🟢 NYC] [🟡 LA] [🟢 Chicago]... (Cards)   │ │  │
│  │  │ Queue | Batteries | Uptime | Swaps         │ │  │
│  │  └─────────────────────────────────────────────┘ │  │
│  │          ↓ Click on station                     │  │
│  │  ┌─────────────────────────────────────────────┐ │  │
│  │  │ Station Detail View                         │ │  │
│  │  │ • All 5 metrics                             │ │  │
│  │  │ • Active triggers & reasons                 │ │  │
│  │  │ • AI Recommendations                        │ │  │
│  │  │   Why: [explanation]                        │ │  │
│  │  │   Impact: [expected improvement]            │ │  │
│  │  │   Confidence: [High/Medium/Low]             │ │  │
│  │  │ • Re-evaluate button                        │ │  │
│  │  └─────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  Alerts Panel: All Alerts Sorted by Risk               │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🔴 Critical (2) | ⚠️  Warning (3)              │   │
│  │ [Station] [Trigger] [Metrics] [Recommendation]│   │
│  └─────────────────────────────────────────────────┘   │
└──────────┬───────────────────────────────────────────────┘
           │ User Approves/Rejects
           ↓
┌──────────────────────────────────────────────────────────┐
│  STEP 7: Integration (Ready to Connect)                 │
│  ├─ POST /api/decisions/approve/:decisionId             │
│  ├─ → Maintenance systems (create tickets)              │
│  ├─ → Driver apps (rerouting notifications)             │
│  └─ → Ops tools (analytics, logging)                    │
└──────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### Backend Structure

```
backend/
├── server.js
│   ├─ Express app setup
│   ├─ CORS configuration
│   ├─ Socket.io setup
│   ├─ Initialize 5 mock stations
│   └─ Mount all routes
│
├── routes/
│   ├── signals.js (STEP 1)
│   │   ├─ Receive single signal
│   │   ├─ Batch receive signals
│   │   ├─ Store in station.recentSignals[]
│   │   └─ Broadcast via WebSocket
│   │
│   ├── monitoring.js (STEP 2)
│   │   ├─ computeMetrics(station)
│   │   ├─ Calculate swap rate
│   │   ├─ Calculate queue length
│   │   ├─ Count charged batteries
│   │   ├─ Calculate uptime %
│   │   ├─ Count error frequency
│   │   └─ Return metrics object
│   │
│   └── decisions.js (STEPS 3-5)
│       ├─ checkTriggers(station)
│       │  ├─ Check congestion
│       │  ├─ Check stockout risk
│       │  ├─ Check charger fault
│       │  ├─ Check charger downtime
│       │  └─ Check multi-failure
│       │
│       ├─ decideAction(station, triggers)
│       │  ├─ Map triggers to actions
│       │  ├─ Generate explanations
│       │  └─ Return recommendations
│       │
│       └─ determineStatus(triggers)
│          └─ Return: Normal | Warning | Critical
│
└── scripts/
    └── signalSimulator.js
        ├─ Generate fake signals
        ├─ Send every 3 seconds
        └─ Test data for development
```

### Frontend Structure

```
frontend/
├── src/
│   ├── main.jsx
│   │   └─ ReactDOM render
│   │
│   ├── App.jsx (Main Component)
│   │   ├─ Fetch stations & alerts on load
│   │   ├─ Setup WebSocket listener
│   │   ├─ Setup polling (5 sec)
│   │   ├─ Route between Dashboard & Alerts
│   │   ├─ AlertsPanel component
│   │   └─ AlertCard component
│   │
│   ├── pages/
│   │   └── Dashboard.jsx
│   │       ├─ Two views: city & station
│   │       ├─ CityView → All stations
│   │       ├─ StationDetail → Single station
│   │       └─ Toggle between views
│   │
│   ├── components/
│   │   ├── CityView.jsx
│   │   │   ├─ Grid of station cards
│   │   │   ├─ Color by status
│   │   │   ├─ Show 4 metrics
│   │   │   ├─ Show trigger count
│   │   │   └─ Click to detail
│   │   │
│   │   └── StationDetail.jsx
│   │       ├─ Display all 5 metrics
│   │       ├─ Show active triggers
│   │       ├─ Display recommendations
│   │       │  ├─ Why: [explanation]
│   │       │  ├─ Impact: [improvement]
│   │       │  └─ Confidence: [score]
│   │       ├─ Show recent signals
│   │       └─ Re-evaluate button
│   │
│   └── CSS files
│       ├── index.css (global)
│       ├── App.css (main app)
│       ├── Dashboard.css (dashboard page)
│       ├── CityView.css (cards)
│       └── StationDetail.css (detail view)
│
├── vite.config.js
│   ├─ Vite configuration
│   ├─ Dev server on :3000
│   └─ Proxy to backend :5000
│
└── index.html
    └─ Entry HTML file
```

---

## Data Flow

### Signal Reception Flow
```
Station sends signal
        ↓
POST /api/signals/receive
        ↓
Backend receives & validates
        ↓
Create signal object with id, type, data, timestamp
        ↓
Add to station.recentSignals[]
        ↓
Broadcast via WebSocket: io.emit('signal-received', ...)
        ↓
Frontend receives & updates (or polls next interval)
```

### Metrics Computation Flow
```
Signals in station.recentSignals[]
        ↓
computeMetrics(station) called
        ↓
Filter signals by type (swap_event, charger_status, etc.)
        ↓
Calculate each metric:
  • swapRate: count recent swap events
  • queueLength: estimate from demand vs capacity
  • chargedBatteries: latest battery inventory
  • chargerUptimePercent: up events / total events
  • errorFrequency: count error logs
        ↓
Return metrics object
        ↓
Store in station.metrics
        ↓
Available via GET /api/monitoring/...
```

### Decision Flow
```
GET request to evaluate station
        ↓
checkTriggers(station) - Analyze metrics against rules
        ↓
For each triggered rule:
  • Create trigger object with name, severity, reason
  • Add to triggers[]
        ↓
decideAction(station, triggers) - Map triggers to actions
        ↓
For each trigger:
  • Create recommendation with action, explanation
  • Add to recommendations[]
        ↓
determineStatus(triggers) - Set station.status
        ↓
Return response with triggers + recommendations
        ↓
Frontend displays in Dashboard
```

---

## Real-Time Architecture

### WebSocket Connection
```
Frontend (App.jsx) initializes on mount:
        ↓
const socket = io('http://localhost:5000')
        ↓
socket.on('stations-update', (data) => setStationsData(data))
socket.on('signal-received', (data) => refreshAlerts())
        ↓
Backend broadcasts when signal received:
        ↓
io.emit('signal-received', { stationId, signal, timestamp })
        ↓
All connected clients receive update instantly
```

### Polling Fallback
```
Every 5 seconds (if WebSocket fails):
        ↓
GET /api/stations
GET /api/alerts
        ↓
Update frontend state
        ↓
Re-render dashboard with latest data
```

---

## Trigger Rules Decision Tree

```
Station Metrics
        ↓
Is queue > 5?
├─ YES → CONGESTION (Warning)
│        Action: Reroute Drivers
│
Is batteries < 3 AND demand > 5?
├─ YES → STOCKOUT RISK (Warning/Critical)
│        Action: Inventory Rebalance
│
Is errors >= 3?
├─ YES → CHARGER FAULT (Warning)
│        Action: Create Maintenance Ticket
│
Is uptime < 90%?
├─ YES → CHARGER DOWNTIME (Warning)
│        Action: Alert Maintenance Team
│
Are 2+ triggers active?
├─ YES → MULTI-FAILURE ESCALATION (Critical)
│        Action: Escalate to Manager
│
Is 0 triggers active?
├─ YES → NORMAL (Green)
│        Status: All Systems OK
```

---

## Database Model (Current: In-Memory)

```javascript
stationsData = Map<stationId, Station>

Station {
  id: "station-0",
  name: "NYC Hub 1",
  city: "NYC",
  status: "Normal" | "Warning" | "Critical",
  
  metrics: {
    swapRate: number,
    queueLength: number,
    chargedBatteries: number,
    chargerUptimePercent: number,
    errorFrequency: number,
    timestamp: Date
  },
  
  recentSignals: [
    {
      id: string,
      type: "swap_event" | "charger_status" | "battery_inventory" | "error_log",
      data: object,
      timestamp: Date,
      processed: boolean
    }
  ],
  
  triggers: [
    {
      name: string,
      severity: "Warning" | "Critical",
      metric: string,
      value: number,
      threshold: number,
      reason: string
    }
  ],
  
  lastUpdate: Date
}

decisionsLog = [
  {
    id: string,
    stationId: string,
    timestamp: Date,
    trigger: string,
    action: string,
    severity: string,
    explanation: {
      why: string,
      expectedImpact: string,
      confidence: "High" | "Medium" | "Low"
    },
    status: "pending-approval" | "approved" | "rejected",
    metrics: { ... }
  }
]
```

---

## Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Real-time**: Socket.io
- **Utilities**: UUID, CORS

### Frontend
- **Library**: React 18
- **Build Tool**: Vite
- **HTTP**: Axios
- **Real-time**: Socket.io-client
- **Icons**: Lucide React

### Styling
- **CSS**: CSS3 (Grid, Flexbox, Animations)
- **Design**: Dark theme (Slate/Blue palette)
- **Responsiveness**: Mobile-friendly grid

---

## Deployment Architecture (Future)

```
┌─────────────────┐
│  Load Balancer  │
└────────┬────────┘
         │
    ┌────┴────┐
    ↓         ↓
┌─────────┐ ┌─────────┐
│Backend-1│ │Backend-2│  (Scaled horizontally)
│ :5000   │ │ :5000   │
└────┬────┘ └────┬────┘
     │           │
     └─────┬─────┘
           ↓
    ┌─────────────┐
    │  Database   │  (PostgreSQL/MongoDB)
    └─────────────┘
           
┌─────────────────────┐
│  CDN / Static Host  │
│  (Frontend React)   │
└─────────────────────┘

┌──────────────────┐
│  External APIs   │
│  • Maintenance   │
│  • Driver App    │
│  • Analytics     │
└──────────────────┘
```

---

## Security Layers (For Production)

```
Client Request
    ↓
HTTPS/TLS Encryption
    ↓
Rate Limiter
    ↓
JWT Authentication
    ↓
Authorization Checks
    ↓
Input Validation
    ↓
Business Logic
    ↓
Database Query (with parameterization)
    ↓
Response Encryption
    ↓
Client Receives
```

---

**Architecture designed for scalability, maintainability, and real-time operations** 🚀
