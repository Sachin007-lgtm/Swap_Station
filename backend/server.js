const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const { v4: uuidv4 } = require('uuid');

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

// Initialize 5 mock stations
const initStations = () => {
  const cities = [
    { name: 'NYC', lat: 40.7128, lng: -74.0060 },
    { name: 'LA', lat: 34.0522, lng: -118.2437 },
    { name: 'Chicago', lat: 41.8781, lng: -87.6298 },
    { name: 'Boston', lat: 42.3601, lng: -71.0589 },
    { name: 'Seattle', lat: 47.6062, lng: -122.3321 }
  ];
  
  cities.forEach((city, idx) => {
    stationsData.set(`station-${idx}`, {
      id: `station-${idx}`,
      name: `${city.name} Central Hub`,
      city: city.name,
      location: `${city.name}, USA`,
      status: 'Normal',
      metrics: {
        swapRate: Math.floor(Math.random() * 20),
        queueLength: Math.floor(Math.random() * 8),
        chargedBatteries: Math.floor(Math.random() * 15),
        chargerUptimePercent: 95 + Math.random() * 5,
        errorFrequency: Math.floor(Math.random() * 3)
      },
      coordinates: { lat: city.lat, lng: city.lng },
      recentSignals: [],
      lastUpdate: new Date(),
      triggers: []
    });
  });
};

initStations();

// ===== STEP 1: Signal Collection =====
const signalRoutes = require('./routes/signals');
app.use('/api/signals', signalRoutes.router(stationsData, io));

// ===== STEP 2: Monitoring Model =====
const monitoringRoutes = require('./routes/monitoring');
app.use('/api/monitoring', monitoringRoutes.router(stationsData));

// ===== STEPS 3-5: Decision Engine & Explainability =====
const decisionRoutes = require('./routes/decisions');
app.use('/api/decisions', decisionRoutes.router(stationsData, decisionsLog));

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
  const alerts = Array.from(stationsData.values())
    .filter(s => s.triggers.length > 0)
    .map(s => ({
      stationId: s.id,
      stationName: s.name,
      status: s.status,
      triggers: s.triggers,
      metrics: s.metrics,
      timestamp: s.lastUpdate
    }))
    .sort((a, b) => {
      const riskOrder = { Critical: 0, Warning: 1, Normal: 2 };
      return riskOrder[a.status] - riskOrder[b.status];
    });
  res.json(alerts);
});

app.get('/api/decisions-log', (req, res) => {
  res.json(decisionsLog.slice(-50)); // Last 50 decisions
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
});

// Export for testing
module.exports = { app, stationsData, decisionsLog, io };
