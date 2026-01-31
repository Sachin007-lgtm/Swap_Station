// STEP 1: Collect & Stream Station Signals
const express = require('express');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

const createRouter = (stationsData, io) => {
  // Receive signal from a station
  router.post('/receive', (req, res) => {
    const { stationId, signalType, data } = req.body;
    
    if (!stationsData.has(stationId)) {
      return res.status(404).json({ error: 'Station not found' });
    }

    const station = stationsData.get(stationId);
    const signal = {
      id: uuidv4(),
      type: signalType, // 'swap_event', 'charger_status', 'battery_inventory', 'error_log'
      data,
      timestamp: new Date(),
      processed: false
    };

    station.recentSignals.push(signal);
    // Keep only last 100 signals
    if (station.recentSignals.length > 100) {
      station.recentSignals.shift();
    }

    // Broadcast to all connected clients
    io.emit('signal-received', {
      stationId,
      signal,
      timestamp: new Date()
    });

    res.json({ success: true, signalId: signal.id });
  });

  // Stream signals (batch)
  router.post('/batch', (req, res) => {
    const { signals } = req.body;
    
    const results = signals.map(sig => {
      if (!stationsData.has(sig.stationId)) {
        return { stationId: sig.stationId, success: false, error: 'Station not found' };
      }

      const station = stationsData.get(sig.stationId);
      const signal = {
        id: uuidv4(),
        type: sig.type,
        data: sig.data,
        timestamp: new Date(),
        processed: false
      };

      station.recentSignals.push(signal);
      if (station.recentSignals.length > 100) {
        station.recentSignals.shift();
      }

      io.emit('signal-received', { stationId: sig.stationId, signal });
      return { stationId: sig.stationId, success: true, signalId: signal.id };
    });

    res.json({ success: true, results });
  });

  // Get recent signals for a station
  router.get('/:stationId/recent', (req, res) => {
    const station = stationsData.get(req.params.stationId);
    if (!station) return res.status(404).json({ error: 'Station not found' });
    res.json(station.recentSignals);
  });

  return router;
};

module.exports = { router: createRouter };
