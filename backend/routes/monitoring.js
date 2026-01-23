// STEP 2: Build Real-Time Monitoring Model
const express = require('express');

const router = express.Router();

const createRouter = (stationsData) => {
  // Compute monitoring metrics for a station
  const computeMetrics = (station) => {
    const signals = station.recentSignals;
    
    // Swap rate (swaps per 15 min)
    const swapEvents = signals.filter(s => s.type === 'swap_event');
    const recentSwaps = swapEvents.filter(s => 
      new Date(s.timestamp).getTime() > Date.now() - 15 * 60 * 1000
    );
    const swapRate = recentSwaps.length;

    // Charger status
    const chargerSignals = signals.filter(s => s.type === 'charger_status');
    const chargerUptimePercent = chargerSignals.length > 0 
      ? Math.round(chargerSignals.filter(s => s.data.status === 'up').length / chargerSignals.length * 100)
      : 100;

    // Battery inventory
    const batterySignals = signals.filter(s => s.type === 'battery_inventory');
    const chargedBatteries = batterySignals.length > 0 
      ? batterySignals[batterySignals.length - 1].data.charged || 5
      : 5;

    // Error frequency
    const errorSignals = signals.filter(s => s.type === 'error_log');
    const errorFrequency = errorSignals.length;

    // Queue estimation (demand/capacity)
    const queueLength = Math.max(0, swapRate - chargedBatteries / 2);

    return {
      swapRate,
      queueLength: Math.round(queueLength),
      chargedBatteries,
      chargerUptimePercent,
      errorFrequency,
      timestamp: new Date()
    };
  };

  // Get metrics for a single station
  router.get('/station/:stationId', (req, res) => {
    const station = stationsData.get(req.params.stationId);
    if (!station) return res.status(404).json({ error: 'Station not found' });
    
    const metrics = computeMetrics(station);
    res.json({ stationId: req.params.stationId, metrics });
  });

  // Get metrics for all stations
  router.get('/all', (req, res) => {
    const allStations = Array.from(stationsData.entries()).map(([id, station]) => {
      const metrics = computeMetrics(station);
      
      // Determine status based on metrics
      let status = 'normal';
      if (metrics.queueLength > 10 || metrics.chargedBatteries < 3 || metrics.chargerUptimePercent < 80) {
        status = 'critical';
      } else if (metrics.queueLength > 5 || metrics.chargedBatteries < 6 || metrics.chargerUptimePercent < 90) {
        status = 'warning';
      }
      
      return {
        id: id,
        name: station.name,
        location: station.city,
        status: status,
        metrics: metrics,
        lastUpdate: new Date().toISOString(),
        coordinates: station.coordinates || { lat: 0, lng: 0 }
      };
    });
    
    res.json({ stations: allStations });
  });

  // Update station metrics in-memory
  router.post('/update-metrics/:stationId', (req, res) => {
    const station = stationsData.get(req.params.stationId);
    if (!station) return res.status(404).json({ error: 'Station not found' });
    
    const metrics = computeMetrics(station);
    station.metrics = metrics;
    station.lastUpdate = new Date();
    
    res.json({ success: true, metrics });
  });

  return router;
};

module.exports = { router: createRouter };
