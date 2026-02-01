const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();
const supabase = require('./db/supabaseClient');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// In-memory data store
const stationsData = new Map();
const decisionsLog = [];
const successMetricsSnapshots = []; // { timestamp, avgQueueTime, stockoutCount, avgUptime }
const SNAPSHOT_INTERVAL_MS = 5 * 60 * 1000; // 5 min
const MAX_SNAPSHOTS = 48; // 4h at 5-min intervals (or 24h at 30-min if we change interval)

// Initialize 5 mock stations
const initStations = () => {
  const cities = [
    { name: 'Connaught Place', lat: 28.6315, lng: 77.2167 },
    { name: 'Dwarka', lat: 28.5921, lng: 77.0460 },
    { name: 'Noida Sector 18', lat: 28.5705, lng: 77.3206 },
    { name: 'Gurgaon Cyber Hub', lat: 28.4942, lng: 77.0868 },
    { name: 'Faridabad NIT', lat: 28.3949, lng: 77.3163 }
  ];

  cities.forEach((city, idx) => {
    stationsData.set(`station-${idx}`, {
      id: `station-${idx}`,
      name: `${city.name} Hub`,
      city: city.name,
      location: `${city.name}, NCR`,
      status: 'Normal',
      metrics: {
        swapRate: idx === 0 ? 12 : Math.floor(Math.random() * 20), // CP has high swap rate
        queueLength: idx === 0 ? 7 : Math.floor(Math.random() * 8), // CP has queue issue
        chargedBatteries: idx === 1 ? 2 : Math.floor(Math.random() * 15), // Dwarka has low batteries
        chargerUptimePercent: idx === 2 ? 85 : 95 + Math.random() * 5, // Noida has uptime issue
        errorFrequency: idx === 3 ? 4 : Math.floor(Math.random() * 3) // Gurgaon has errors
      },
      coordinates: { lat: city.lat, lng: city.lng },
      recentSignals: [],
      lastUpdate: new Date(),
      triggers: []
    });
  });
};

const syncStationsToSupabase = async () => {
  if (!supabase) return;

  console.log('🔄 Syncing stations to Supabase...');
  const stations = Array.from(stationsData.values()).map(s => ({
    station_id: s.id,
    name: s.name,
    location: s.location,
    city: s.city,
    status: s.status.toLowerCase(), // 'normal', 'warning', 'critical'
  }));

  const { error } = await supabase
    .from('stations')
    .upsert(stations, { onConflict: 'station_id' });

  if (error) {
    console.error('❌ Failed to sync stations to Supabase:', error.message);
  } else {
    console.log('✅ Stations synced to Supabase successfully');
  }
};

initStations();
syncStationsToSupabase();

// ===== STEP 1: Signal Collection =====
const signalRoutes = require('./routes/signals');
app.use('/api/signals', signalRoutes.router(stationsData, io));

// ===== STEP 2: Monitoring Model =====
const monitoringRoutes = require('./routes/monitoring');
app.use('/api/monitoring', monitoringRoutes.router(stationsData));

// ===== STEPS 3-5: Decision Engine & Explainability =====
const decisionRoutes = require('./routes/decisions');
app.use('/api/decisions', decisionRoutes.router(stationsData, decisionsLog));

// ===== Reroute Notification Endpoint =====
const rerouteRoutes = require('./routes/reroute');
app.use('/api/reroute-driver', rerouteRoutes);

// ===== Maintenance Ticket Endpoint =====
const maintenanceRoutes = require('./routes/maintenance');
app.use('/api/maintenance', maintenanceRoutes.router());

// ===== Analytics Chatbot Endpoint =====
const analyticsRoutes = require('./routes/analyticsCheck');
app.use('/api/analytics', analyticsRoutes.router(stationsData, decisionsLog));

// ===== STEP 6: Dashboard API =====
app.get('/api/stations', (req, res) => {
  const stations = Array.from(stationsData.values());
  res.json(stations);
});

app.get('/api/stations/:id', (req, res) => {
  const station = stationsData.get(req.params.id);
  if (!station) return res.status(404).json({ error: 'Station not found' });
  res.json(station);
});

app.get('/api/alerts', (req, res) => {
  // Import trigger checking from decisions route
  const decisionsModule = require('./routes/decisions');

  const alerts = [];
  stationsData.forEach((station) => {
    // Compute triggers on the fly
    const triggers = decisionsModule.checkTriggersForStation(station);

    if (triggers.length > 0) {
      // Determine status based on trigger severity
      const hasCritical = triggers.some(t => t.severity === 'Critical');
      const status = hasCritical ? 'Critical' : 'Warning';

      alerts.push({
        stationId: station.id,
        stationName: station.name,
        status: status,
        triggers: triggers,
        metrics: station.metrics,
        timestamp: station.lastUpdate
      });
    }
  });

  // Sort by severity
  alerts.sort((a, b) => {
    const riskOrder = { Critical: 0, Warning: 1, Normal: 2 };
    return riskOrder[a.status] - riskOrder[b.status];
  });

  res.json(alerts);
});

app.get('/api/decisions-log', (req, res) => {
  res.json(decisionsLog.slice(-50)); // Last 50 decisions
});

// Success metrics: record snapshot (call from monitoring or on interval)
const recordSuccessMetricsSnapshot = () => {
  const stations = Array.from(stationsData.values()).filter(s => s.metrics);
  if (stations.length === 0) return;
  const avgQueueTime = stations.reduce((a, s) => a + (s.metrics.queueLength || 0), 0) / stations.length;
  const avgUptime = stations.reduce((a, s) => a + (s.metrics.chargerUptimePercent || 100), 0) / stations.length;
  const stockoutRiskStations = stations.filter(s => (s.metrics.chargedBatteries || 0) < 3 && (s.metrics.swapRate || 0) > 5).length;
  successMetricsSnapshots.push({
    timestamp: new Date(),
    avgQueueTime: Math.round(avgQueueTime * 10) / 10,
    stockoutCount: stockoutRiskStations,
    avgUptime: Math.round(avgUptime * 10) / 10
  });
  if (successMetricsSnapshots.length > MAX_SNAPSHOTS) successMetricsSnapshots.shift();
};

// Record snapshot every 5 min
setInterval(recordSuccessMetricsSnapshot, SNAPSHOT_INTERVAL_MS);
setTimeout(recordSuccessMetricsSnapshot, 5000); // First snapshot after 5s

app.get('/api/success-metrics', (req, res) => {
  if (successMetricsSnapshots.length < 4) {
    return res.json({
      queueTimeReduction: null,
      stockoutReduction: null,
      uptimeImprovement: null,
      message: 'Collecting baseline data (need at least 4 snapshots)',
      current: successMetricsSnapshots[successMetricsSnapshots.length - 1] || null,
      snapshotsCount: successMetricsSnapshots.length
    });
  }
  const half = Math.floor(successMetricsSnapshots.length / 2);
  const recent = successMetricsSnapshots.slice(-half);
  const previous = successMetricsSnapshots.slice(-half * 2, -half);
  const avg = (arr, key) => arr.length ? arr.reduce((a, s) => a + (s[key] || 0), 0) / arr.length : 0;
  const recentQueue = avg(recent, 'avgQueueTime');
  const prevQueue = avg(previous, 'avgQueueTime');
  const recentStockout = avg(recent, 'stockoutCount');
  const prevStockout = avg(previous, 'stockoutCount');
  const recentUptime = avg(recent, 'avgUptime');
  const prevUptime = avg(previous, 'avgUptime');
  res.json({
    queueTimeReduction: prevQueue > 0 ? Math.round((1 - recentQueue / prevQueue) * 1000) / 10 : null,
    stockoutReduction: prevStockout > 0 ? Math.round((1 - recentStockout / prevStockout) * 1000) / 10 : (recentStockout === 0 ? 100 : null),
    uptimeImprovement: prevUptime > 0 ? Math.round((recentUptime - prevUptime) * 10) / 10 : null,
    current: successMetricsSnapshots[successMetricsSnapshots.length - 1],
    period: 'last vs previous half of snapshots'
  });
});

// WebSocket for real-time updates
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.emit('stations-update', Array.from(stationsData.values()));
  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
  console.log(`💻 Frontend expected at http://localhost:3000`);
  
  // Auto-start signal simulator
  console.log('🔄 Starting integrated signal simulator...');
  const { simulateSignals } = require('./scripts/signalSimulator');
  simulateSignals();
});

// Export for testing
module.exports = { app, stationsData, decisionsLog, io };
