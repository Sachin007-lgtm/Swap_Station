// STEP 1: Collect & Stream Station Signals
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../db/supabaseClient');

const router = express.Router();

const createRouter = (stationsData, io) => {
  // Receive signal from a station
  router.post('/receive', async (req, res) => {
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

    // Save to Supabase (Async - fire and forget)
    if (supabase) {
      supabase.from('signals').insert({
        station_id: stationId,
        type: signalType,
        value: data
      }).then(({ error }) => {
        if (error) console.error('Error saving signal to Supabase:', error.message);
      });
    }

    res.json({ success: true, signalId: signal.id });
  });

  // Stream signals (batch)
  router.post('/batch', async (req, res) => {
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

    // Bulk save to Supabase
    if (supabase) {
      const dbSignals = signals
        .filter(sig => stationsData.has(sig.stationId))
        .map(sig => ({
          station_id: sig.stationId,
          type: sig.type,
          value: sig.data
        }));

      if (dbSignals.length > 0) {
        supabase.from('signals').insert(dbSignals).then(({ error }) => {
          if (error) console.error('Error saving batch signals to Supabase:', error.message);
        });
      }
    }

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
