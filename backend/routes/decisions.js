// STEPS 3-5: Apply Triggers, Decision Logic & Explainability
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch');

const router = express.Router();

const createRouter = (stationsData, decisionsLog) => {
  // Configuration
  const REROUTE_API_ENDPOINT = process.env.REROUTE_API_ENDPOINT || 'http://localhost:5000/api/reroute-driver';
  const REROUTE_API_TOKEN = process.env.REROUTE_API_TOKEN || 'DEMO_REROUTE_TOKEN';
  const MAINTENANCE_API_ENDPOINT = process.env.MAINTENANCE_API_ENDPOINT || 'http://localhost:5000/api/maintenance/ticket';
  const MAINTENANCE_API_TOKEN = process.env.MAINTENANCE_API_TOKEN || 'DEMO_MAINTENANCE_TOKEN';
  const DEMO_DRIVER_PHONE = process.env.DEMO_DRIVER_PHONE || '+919205408755';
  const MAX_RETRIES = 3;
  
  console.log('🔧 Configuration loaded:');
  console.log('   DEMO_DRIVER_PHONE:', DEMO_DRIVER_PHONE);

  // Retry helper with exponential backoff
  const retryWithBackoff = async (fn, retries = MAX_RETRIES, delay = 1000) => {
    try {
      return await fn();
    } catch (error) {
      if (retries === 0) throw error;
      console.log(`⚠️ Retry attempt ${MAX_RETRIES - retries + 1}/${MAX_RETRIES} after ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryWithBackoff(fn, retries - 1, delay * 2);
    }
  };

  // Send notification to maintenance API
  const sendMaintenanceNotification = async (payload) => {
    const sendRequest = async () => {
      const response = await fetch(MAINTENANCE_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MAINTENANCE_API_TOKEN}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Maintenance API responded with status ${response.status}: ${text.substring(0, 200)}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        const text = await response.text();
        console.log('⚠️ Non-JSON response received:', text.substring(0, 100));
        return { success: true, rawResponse: text };
      }
    };

    try {
      const result = await retryWithBackoff(sendRequest);
      console.log('✅ Maintenance ticket created successfully:', result);
      return { success: true, response: result };
    } catch (error) {
      console.error('❌ Failed to create maintenance ticket after retries:', error.message);
      decisionsLog.push({
        id: uuidv4(),
        type: 'maintenance_notification_failure',
        timestamp: new Date(),
        payload: payload,
        error: error.message
      });
      return { success: false, error: error.message };
    }
  };

  // Send notification to reroute API
  const sendRerouteNotification = async (payload) => {
    const sendRequest = async () => {
      const response = await fetch(REROUTE_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${REROUTE_API_TOKEN}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`API responded with status ${response.status}: ${text.substring(0, 200)}`);
      }

      // Try to parse as JSON, fallback to text
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        const text = await response.text();
        console.log('⚠️ Non-JSON response received:', text.substring(0, 100));
        return { success: true, rawResponse: text };
      }
    };

    try {
      const result = await retryWithBackoff(sendRequest);
      console.log('✅ Reroute notification sent successfully:', result);
      return { success: true, response: result };
    } catch (error) {
      console.error('❌ Failed to send reroute notification after retries:', error.message);
      // Log to decisions log for tracking
      decisionsLog.push({
        id: uuidv4(),
        type: 'notification_failure',
        timestamp: new Date(),
        payload: payload,
        error: error.message
      });
      return { success: false, error: error.message };
    }
  };

  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const distanceKm = (from, to) => {
    if (!from?.coordinates || !to?.coordinates) return Number.POSITIVE_INFINITY;
    const earthRadiusKm = 6371;
    const dLat = toRadians(to.coordinates.lat - from.coordinates.lat);
    const dLng = toRadians(to.coordinates.lng - from.coordinates.lng);
    const lat1 = toRadians(from.coordinates.lat);
    const lat2 = toRadians(to.coordinates.lat);

    const a = Math.sin(dLat / 2) ** 2
      + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c;
  };

  const scoreStationForReroute = (station, currentStation) => {
    const distance = distanceKm(currentStation, station);
    const queuePenalty = station.metrics?.queueLength ?? 0;
    const batteryBonus = station.metrics?.chargedBatteries ?? 0;
    const uptimePenalty = Math.max(0, 100 - (station.metrics?.chargerUptimePercent ?? 100));

    return (distance * 0.8) + (queuePenalty * 2) + (uptimePenalty * 0.5) - (batteryBonus * 0.7);
  };

  const pickRerouteTarget = (currentStationId) => {
    const currentStation = stationsData.get(currentStationId);
    if (!currentStation) return null;

    const candidates = Array.from(stationsData.values())
      .filter(station => station.id !== currentStationId)
      .filter(station => station.metrics)
      .sort((a, b) => scoreStationForReroute(a, currentStation) - scoreStationForReroute(b, currentStation));

    return candidates[0] || null;
  };

  const executeDecision = async (decision, mode = 'simulation') => {
    // Handle Maintenance Ticket Actions
    if (decision.action === 'Create Maintenance Ticket' || decision.action === 'Alert Maintenance Team') {
      console.log('\n🔧 ========== MAINTENANCE DECISION EXECUTION ==========');
      console.log('Trigger:', decision.trigger);
      console.log('Station:', decision.stationId);
      console.log('Mode:', mode);
      console.log('======================================================\n');

      const currentStation = stationsData.get(decision.stationId);
      if (!currentStation) {
        return { executed: false, reason: 'Station not found.' };
      }

      // Collect error details from recent signals
      const errorSignals = currentStation.recentSignals
        .filter(s => s.type === 'error_log')
        .slice(-5)
        .map(s => s.data.message || 'Unknown error');

      const chargerSignals = currentStation.recentSignals.filter(s => s.type === 'charger_status');
      const downChargers = chargerSignals.filter(s => s.data.status === 'down').length;
      const totalChargers = chargerSignals.length > 0 ? chargerSignals.length : 10;
      const affectedChargers = downChargers || Math.ceil(totalChargers * (100 - currentStation.metrics.chargerUptimePercent) / 100);

      const payload = {
        action: 'maintenance_ticket',
        mode: mode,
        station: {
          id: currentStation.id,
          name: currentStation.name,
          address: `${currentStation.city}, ${currentStation.state || 'Delhi-NCR'}`,
          city: currentStation.city,
          coordinates: currentStation.coordinates
        },
        issue: {
          type: decision.trigger === 'Charger Downtime' ? 'charger_downtime' : 'charger_fault',
          severity: decision.severity.toLowerCase(),
          current_uptime: `${currentStation.metrics.chargerUptimePercent}%`,
          error_count: currentStation.metrics.errorFrequency,
          error_details: errorSignals.length > 0 ? errorSignals : ['Charger performance degraded']
        },
        impact: {
          affected_chargers: affectedChargers,
          reduced_capacity: `${Math.round((affectedChargers / totalChargers) * 100)}%`,
          estimated_queue_increase: `+${Math.ceil(currentStation.metrics.queueLength * 0.3)} drivers`,
          current_queue: currentStation.metrics.queueLength
        },
        sla: decision.severity === 'Critical' ? '2 hours' : '4 hours',
        trigger: decision.trigger,
        reason: decision.explanation?.why,
        expected_impact: decision.explanation?.expectedImpact,
        confidence: decision.explanation?.confidence,
        timestamp: new Date().toISOString()
      };

      console.log('🔧 Sending maintenance ticket:', JSON.stringify(payload, null, 2));

      const notificationResult = await sendMaintenanceNotification(payload);

      return {
        executed: notificationResult.success,
        executedAt: new Date(),
        method: mode,
        payload: payload,
        apiResponse: notificationResult.response,
        apiError: notificationResult.error,
        maintenanceTicket: {
          stationId: currentStation.id,
          stationName: currentStation.name,
          issueType: payload.issue.type,
          severity: payload.issue.severity,
          affectedChargers: affectedChargers,
          sla: payload.sla
        }
      };
    }

    // Handle Reroute Actions
    if (decision.action !== 'Reroute Drivers') {
      return {
        executed: false,
        reason: `Action "${decision.action}" is not executable in mock mode.`
      };
    }

    const currentStation = stationsData.get(decision.stationId);
    const targetStation = pickRerouteTarget(decision.stationId);
    if (!targetStation) {
      return {
        executed: false,
        reason: 'No viable reroute target found.'
      };
    }

    const distance = Number(distanceKm(currentStation, targetStation).toFixed(1));
    const expectedWaitTime = Math.max(1, Math.floor(targetStation.metrics?.queueLength / 2));
    
    // Extract confidence from decision explanation
    const confidenceMap = { 'High': 0.89, 'Medium': 0.72, 'Low': 0.55 };
    const confidence = confidenceMap[decision.explanation?.confidence] || 0.75;

    // Generate mock driver data from queue
    const queueLength = currentStation.metrics?.queueLength || 0;
    const driversToReroute = Math.min(queueLength, 3); // Reroute up to 3 drivers
    
    let payload;
    
    if (mode === 'live_demo') {
      // Live demo mode - send for first driver with phone and location
      payload = {
        mode: 'live_demo',
        driver: {
          driver_id: `DR_DEMO_${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
          phone: DEMO_DRIVER_PHONE
        },
        station_from: {
          id: decision.stationId,
          name: currentStation.name,
          city: currentStation.city
        },
        station_to: {
          id: targetStation.id,
          name: targetStation.name,
          city: targetStation.city,
          lat: targetStation.coordinates?.lat || 0,
          lng: targetStation.coordinates?.lng || 0
        },
        distance_km: distance,
        expected_wait_time_min: expectedWaitTime,
        reason: decision.trigger || 'High congestion',
        confidence: confidence
      };
    } else {
      // Simulation mode - send for multiple drivers
      const drivers = Array.from({ length: driversToReroute }, (_, i) => ({
        driver_id: `DR_${String(100 + i).padStart(3, '0')}`
      }));
      
      payload = {
        mode: 'simulation',
        drivers: drivers,
        station_from: {
          id: decision.stationId,
          name: currentStation.name,
          city: currentStation.city
        },
        station_to: {
          id: targetStation.id,
          name: targetStation.name,
          city: targetStation.city
        },
        reason: decision.trigger || 'High congestion'
      };
    }

    console.log('📤 Sending reroute notification:', JSON.stringify(payload, null, 2));

    // Send to notification API with retry logic
    const notificationResult = await sendRerouteNotification(payload);

    return {
      executed: notificationResult.success,
      executedAt: new Date(),
      method: mode,
      payload: payload,
      apiResponse: notificationResult.response,
      apiError: notificationResult.error,
      reroute: {
        fromStationId: decision.stationId,
        fromStationName: currentStation.name,
        toStationId: targetStation.id,
        toStationName: targetStation.name,
        toStationCity: targetStation.city,
        estimatedDistanceKm: distance,
        driversRerouted: mode === 'live_demo' ? 1 : driversToReroute,
        expectedWaitTimeMin: expectedWaitTime
      }
    };
  };
  // Define trigger rules (STEP 3)
  const checkTriggers = (station) => {
    const { metrics } = station;
    const triggers = [];

    // Congestion: Queue > 5 OR wait time > 7 mins
    if (metrics.queueLength > 5) {
      triggers.push({
        name: 'Congestion',
        severity: 'Warning',
        metric: 'queueLength',
        value: metrics.queueLength,
        threshold: 5,
        reason: `Queue length (${metrics.queueLength}) exceeds threshold (5)`
      });
    }

    // Stockout risk: Charged batteries < 3 AND demand rising
    if (metrics.chargedBatteries < 3 && metrics.swapRate > 5) {
      triggers.push({
        name: 'Stockout Risk',
        severity: metrics.chargedBatteries === 0 ? 'Critical' : 'Warning',
        metric: 'chargedBatteries',
        value: metrics.chargedBatteries,
        threshold: 3,
        reason: `Low battery inventory (${metrics.chargedBatteries}) with high demand (${metrics.swapRate} swaps/15min)`
      });
    }

    // Charger failure: Same error ≥ 3 times
    if (metrics.errorFrequency >= 3) {
      triggers.push({
        name: 'Charger Fault',
        severity: 'Warning',
        metric: 'errorFrequency',
        value: metrics.errorFrequency,
        threshold: 3,
        reason: `Multiple charger errors detected (${metrics.errorFrequency} errors)`
      });
    }

    // Charger downtime: Uptime < 90%
    if (metrics.chargerUptimePercent < 90) {
      triggers.push({
        name: 'Charger Downtime',
        severity: 'Warning',
        metric: 'chargerUptimePercent',
        value: metrics.chargerUptimePercent,
        threshold: 90,
        reason: `Charger uptime (${metrics.chargerUptimePercent}%) below acceptable level`
      });
    }

    // Multi-failure (escalation)
    if (triggers.length >= 2) {
      triggers.push({
        name: 'Multi-Failure Escalation',
        severity: 'Critical',
        metric: 'multiple',
        value: triggers.length,
        threshold: 2,
        reason: `Multiple issues detected simultaneously at station`
      });
    }

    return triggers;
  };

  // Decision logic (STEP 4)
  const decideAction = (station, triggers, mode = 'conservative') => {
    const actions = [];
    const explanations = [];

    triggers.forEach(trigger => {
      let action, why, expectedImpact, confidence;

      switch (trigger.name) {
        case 'Congestion':
          action = 'Reroute Drivers';
          why = `${trigger.reason}. Drivers are waiting too long.`;
          expectedImpact = 'Queue ↓ by ~35%, Wait time ↓';
          confidence = 'High';
          break;

        case 'Stockout Risk':
          action = 'Initiate Inventory Rebalance';
          why = `${trigger.reason}. Station may run out of charged batteries.`;
          expectedImpact = 'Stockout probability ↓ by ~80%';
          confidence = 'High';
          break;

        case 'Charger Fault':
          action = 'Create Maintenance Ticket';
          why = `${trigger.reason}. Charger may need service.`;
          expectedImpact = 'Prevent charger failure, Uptime ↑';
          confidence = 'Medium';
          break;

        case 'Charger Downtime':
          action = 'Alert Maintenance Team';
          why = `${trigger.reason}. Charger reliability is degrading.`;
          expectedImpact = 'Early intervention, Uptime ↑ to 95%+';
          confidence = 'Medium';
          break;

        case 'Multi-Failure Escalation':
          action = 'Escalate to On-Call Manager';
          why = `Multiple issues at ${station.name}. This requires immediate attention.`;
          expectedImpact = 'Rapid response, Prevent outage';
          confidence = 'High';
          break;

        default:
          return;
      }

      const decision = {
        id: uuidv4(),
        stationId: station.id,
        stationName: station.name,
        timestamp: new Date(),
        trigger: trigger.name,
        severity: trigger.severity,
        action,
        mode,
        explanation: {
          why,
          expectedImpact,
          confidence
        },
        status: mode === 'aggressive' ? 'auto-executed' : 'pending-approval',
        metrics: station.metrics
      };

      actions.push(decision);
      explanations.push(decision.explanation);
    });

    return { actions, explanations };
  };

  // Determine station status
  const determineStatus = (triggers) => {
    if (triggers.length === 0) return 'Normal';
    if (triggers.some(t => t.severity === 'Critical')) return 'Critical';
    return 'Warning';
  };

  // Evaluate and recommend actions
  router.post('/evaluate/:stationId', (req, res) => {
    const { mode = 'conservative' } = req.body;
    const station = stationsData.get(req.params.stationId);
    if (!station) return res.status(404).json({ error: 'Station not found' });

    const triggers = checkTriggers(station);
    const { actions, explanations } = decideAction(station, triggers, mode);
    const status = determineStatus(triggers);

    station.triggers = triggers;
    station.status = status;

    actions.forEach(action => decisionsLog.push(action));

    // Transform recommendations to match frontend format
    const transformedRecommendations = actions.map(action => ({
      id: action.id, // Include decision ID for approval
      action: action.action,
      trigger: action.trigger, // Include trigger name
      explanation: {
        why: action.explanation.why,
        expectedImpact: action.explanation.expectedImpact,
        impact: action.explanation.expectedImpact, // Add 'impact' field
        confidence: action.explanation.confidence,
        confidenceScore: action.explanation.confidence === 'High' ? 90 : action.explanation.confidence === 'Medium' ? 70 : 50
      }
    }));

    res.json({
      station: {
        id: station.id,
        name: station.name
      },
      decision: {
        stationId: req.params.stationId,
        status,
        triggers,
        recommendations: transformedRecommendations
      },
      recommendations: transformedRecommendations
    });
  });

  // Bulk evaluate all stations
  router.post('/evaluate-all', (req, res) => {
    const { mode = 'conservative' } = req.body;
    const results = [];

    for (const [stationId, station] of stationsData.entries()) {
      const triggers = checkTriggers(station);
      const { actions } = decideAction(station, triggers, mode);
      const status = determineStatus(triggers);

      station.triggers = triggers;
      station.status = status;

      actions.forEach(action => decisionsLog.push(action));

      results.push({
        stationId,
        stationName: station.name,
        status,
        triggerCount: triggers.length,
        actionCount: actions.length,
        recommendations: actions
      });
    }

    res.json({ success: true, results });
  });

  // Get recommendation explanation
  router.get('/explain/:decisionId', (req, res) => {
    const decision = decisionsLog.find(d => d.id === req.params.decisionId);
    if (!decision) return res.status(404).json({ error: 'Decision not found' });
    res.json(decision);
  });

  // Approve/Reject decision
  router.post('/approve/:decisionId', async (req, res) => {
    const decision = decisionsLog.find(d => d.id === req.params.decisionId);
    if (!decision) return res.status(404).json({ error: 'Decision not found' });

    const { mode = 'simulation' } = req.body; // 'live_demo' or 'simulation'

    decision.status = 'approved';
    decision.approvedAt = new Date();

    const execution = await executeDecision(decision, mode);
    if (execution.executed) {
      decision.status = 'executed';
      decision.execution = execution;
    } else {
      decision.execution = execution;
    }

    res.json({ success: true, decision });
  });

  // Execute a decision (mock executor for reroute)
  router.post('/execute/:decisionId', async (req, res) => {
    const decision = decisionsLog.find(d => d.id === req.params.decisionId);
    if (!decision) return res.status(404).json({ error: 'Decision not found' });

    const { mode = 'simulation' } = req.body; // 'live_demo' or 'simulation'

    const execution = await executeDecision(decision, mode);
    decision.execution = execution;
    if (execution.executed) {
      decision.status = 'executed';
      decision.executedAt = execution.executedAt;
    }

    res.json({ success: true, decision });
  });

  // Get all alerts
  router.get('/alerts', (req, res) => {
    const alerts = [];
    
    for (const [stationId, station] of stationsData.entries()) {
      if (station.triggers && station.triggers.length > 0) {
        alerts.push({
          stationId: stationId,
          stationName: station.name,
          status: station.status?.toLowerCase() || 'normal',
          triggers: station.triggers
        });
      }
    }

    res.json({ alerts });
  });

  return router;
};

// Export checkTriggers for use in other modules
const checkTriggersForStation = (station) => {
  const { metrics } = station;
  const triggers = [];

  // Congestion: Queue > 5 OR wait time > 7 mins
  if (metrics.queueLength > 5) {
    triggers.push({
      name: 'Congestion',
      severity: 'Warning',
      metric: 'queueLength',
      value: metrics.queueLength,
      threshold: 5,
      reason: `Queue length (${metrics.queueLength}) exceeds threshold (5)`
    });
  }

  // Stockout risk: Charged batteries < 3 AND demand rising
  if (metrics.chargedBatteries < 3 && metrics.swapRate > 5) {
    triggers.push({
      name: 'Stockout Risk',
      severity: metrics.chargedBatteries === 0 ? 'Critical' : 'Warning',
      metric: 'chargedBatteries',
      value: metrics.chargedBatteries,
      threshold: 3,
      reason: `Low battery inventory (${metrics.chargedBatteries}) with high demand (${metrics.swapRate} swaps/15min)`
    });
  }

  // Charger failure: Same error ≥ 3 times
  if (metrics.errorFrequency >= 3) {
    triggers.push({
      name: 'Charger Fault',
      severity: 'Warning',
      metric: 'errorFrequency',
      value: metrics.errorFrequency,
      threshold: 3,
      reason: `Multiple charger errors detected (${metrics.errorFrequency} errors)`
    });
  }

  // Charger downtime: Uptime < 90%
  if (metrics.chargerUptimePercent < 90) {
    triggers.push({
      name: 'Charger Downtime',
      severity: 'Warning',
      metric: 'chargerUptimePercent',
      value: metrics.chargerUptimePercent,
      threshold: 90,
      reason: `Charger uptime (${metrics.chargerUptimePercent}%) below acceptable level`
    });
  }

  // Multi-failure (escalation)
  if (triggers.length >= 2) {
    triggers.push({
      name: 'Multi-Failure Escalation',
      severity: 'Critical',
      metric: 'multiple',
      value: triggers.length,
      threshold: 2,
      reason: `Multiple issues detected simultaneously at station`
    });
  }

  return triggers;
};

module.exports = { router: createRouter, checkTriggersForStation };
