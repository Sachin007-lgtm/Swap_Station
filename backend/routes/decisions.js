// STEPS 3-5: Apply Triggers, Decision Logic & Explainability
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch');
const { computeMetricsFromSignals } = require('./monitoring');
const Groq = require('groq-sdk');

const router = express.Router();

const createRouter = (stationsData, decisionsLog) => {
  // Configuration
  const PORT = process.env.PORT || 5000;
  const REROUTE_API_ENDPOINT = process.env.REROUTE_API_ENDPOINT || `http://localhost:${PORT}/api/reroute-driver`;
  const REROUTE_API_TOKEN = process.env.REROUTE_API_TOKEN || 'DEMO_REROUTE_TOKEN';
  const MAINTENANCE_API_ENDPOINT = process.env.MAINTENANCE_API_ENDPOINT || `http://localhost:${PORT}/api/maintenance/ticket`;
  const MAINTENANCE_API_TOKEN = process.env.MAINTENANCE_API_TOKEN || 'DEMO_MAINTENANCE_TOKEN';
  const DEMO_DRIVER_PHONE = process.env.DEMO_DRIVER_PHONE || '+919818166684';
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  const MAX_RETRIES = 3;

  // Initialize Groq Client
  let groqClient = null;
  if (GROQ_API_KEY) {
    groqClient = new Groq({ apiKey: GROQ_API_KEY });
    console.log('🧠 Groq AI initialized');
  } else {
    console.warn('⚠️ GROQ_API_KEY missing. Falling back to rule-based logic.');
  }

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
          error_details: errorSignals.length > 0 ? errorSignals : ['Charger performance degraded'],
          probable_root_cause: decision.explanation?.probableRootCause || (errorSignals.length > 0 ? `Recurring errors: ${errorSignals.slice(-3).join('; ')}` : 'Charger performance degraded')
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
        probable_root_cause: decision.explanation?.probableRootCause || null,
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

  // Helper: detect recurring fault (same error code ≥ 3 in recent signals)
  const getRecurringFault = (station) => {
    const errorSignals = (station.recentSignals || []).filter(s => s.type === 'error_log').slice(-20);
    const byCode = {};
    errorSignals.forEach(s => {
      const code = s.data?.errorCode || s.data?.message || s.data?.code || 'UNKNOWN';
      byCode[code] = (byCode[code] || 0) + 1;
    });
    const entry = Object.entries(byCode).find(([, count]) => count >= 3);
    return entry ? { code: entry[0], count: entry[1] } : null;
  };

  // Define trigger rules (STEP 3) - Consistent logic
  const checkTriggers = (station) => {
    return checkTriggersForStation(station);
  };

  // --- LLM DECISION HELPER ---
  const getGroqDecision = async (station, triggers) => {
    if (!groqClient) return null;

    const systemPrompt = `You are an operational AI for an EV Battery Swap Station Network. 
Analyze station metrics and triggers to recommend actions. 
Your goal is to minimize driver wait times and ensure battery availability.

Output JSON ONLY in this format:
{
  "actions": [
    {
      "trigger": "Trigger Name",
      "severity": "Warning|Critical",
      "action": "Action Name", 
      "explanation": {
        "why": "Reasoning...",
        "expectedImpact": "Impact...",
        "confidence": "High|Medium|Low",
        "probableRootCause": "Optional..."
      }
    }
  ]
}

Allowed Actions: 'Reroute Drivers', 'Initiate Inventory Rebalance', 'Create Maintenance Ticket', 'Alert Maintenance Team', 'Escalate to On-Call Manager'.
`;

    const userPrompt = `
Station: ${station.name} (${station.city})
Metrics:
- Queue: ${station.metrics.queueLength}
- Swap Rate: ${station.metrics.swapRate}/15min
- Charged Batteries: ${station.metrics.chargedBatteries}
- Uptime: ${station.metrics.chargerUptimePercent}%
- Errors: ${station.metrics.errorFrequency}

Active Triggers: ${JSON.stringify(triggers)}

Recommend actions.
`;

    try {
      const completion = await groqClient.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.1,
        response_format: { type: 'json_object' }
      });

      return JSON.parse(completion.choices[0].message.content);
    } catch (err) {
      console.error('❌ Groq API Error:', err.message);
      return null;
    }
  };

  // Decision logic (STEP 4) + explainability (probable root cause, stockout prediction)
  const decideAction = async (station, triggers, mode = 'conservative') => {
    const actions = [];
    const explanations = [];

    // try LLM first
    let llmResult = null;
    if (triggers.length > 0) {
      // Only call LLM if there are triggers to analyze
      console.log(`🤖 Consulting AI for ${station.id}...`);
      llmResult = await getGroqDecision(station, triggers);
    }

    if (llmResult && llmResult.actions && Array.isArray(llmResult.actions)) {
      console.log(`✅ AI returned ${llmResult.actions.length} recommendations`);
      llmResult.actions.forEach(rec => {
        const decision = {
          id: uuidv4(),
          stationId: station.id,
          stationName: station.name,
          timestamp: new Date(),
          trigger: rec.trigger,
          severity: rec.severity,
          action: rec.action,
          mode,
          explanation: rec.explanation,
          status: mode === 'aggressive' ? 'auto-executed' : 'pending-approval',
          metrics: station.metrics,
          source: 'AI-Groq'
        };
        actions.push(decision);
        explanations.push(decision.explanation);
      });
      return { actions, explanations };
    }

    // FALLBACK: Rule-based logic (original) if LLM fails or no key
    if (triggers.length > 0 && !groqClient) console.log('⚠️ Using Rule-based Fallback');

    triggers.forEach(trigger => {
      let action, why, expectedImpact, confidence, probableRootCause, timeToStockoutMinutes;

      switch (trigger.name) {
        case 'Congestion':
          action = 'Reroute Drivers';
          why = `${trigger.reason}. Drivers are waiting too long.`;
          expectedImpact = 'Queue ↓ by ~35%, Wait time ↓';
          confidence = 'High';
          break;

        case 'Demand Surge':
          action = 'Reroute Drivers';
          why = `${trigger.reason}. Consider rerouting to reduce load.`;
          expectedImpact = 'Load balancing, Queue ↓';
          confidence = 'High';
          break;

        case 'Stockout Risk':
          action = 'Initiate Inventory Rebalance';
          timeToStockoutMinutes = trigger.timeToStockoutMinutes;
          why = trigger.timeToStockoutMinutes
            ? `${trigger.reason}. Estimated time to stockout: ~${trigger.timeToStockoutMinutes} min.`
            : `${trigger.reason}. Station may run out of charged batteries.`;
          expectedImpact = 'Stockout probability ↓ by ~80%';
          confidence = 'High';
          break;

        case 'Charger Fault':
          action = 'Create Maintenance Ticket';
          probableRootCause = 'Repeated errors suggest hardware or calibration issue.';
          why = `${trigger.reason}. Charger may need service.`;
          expectedImpact = 'Prevent charger failure, Uptime ↑';
          confidence = 'Medium';
          break;

        case 'Recurring Fault':
          action = 'Create Maintenance Ticket';
          probableRootCause = `Same error (${trigger.errorCode || 'pattern'}) repeated — likely root cause: hardware or firmware.`;
          why = `${trigger.reason}`;
          expectedImpact = 'Prevent charger failure, Uptime ↑';
          confidence = 'High';
          break;

        case 'Charger Downtime':
          action = 'Alert Maintenance Team';
          probableRootCause = `Uptime at ${station.metrics?.chargerUptimePercent}% — likely charger failures or connectivity.`;
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
          confidence,
          ...(probableRootCause && { probableRootCause }),
          ...(timeToStockoutMinutes != null && { timeToStockoutMinutes })
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

  // Actions that can be auto-executed (have executeDecision implementation)
  const EXECUTABLE_ACTIONS = ['Reroute Drivers', 'Create Maintenance Ticket', 'Alert Maintenance Team'];

  const isExecutable = (action) => EXECUTABLE_ACTIONS.includes(action.action);

  // Evaluate and recommend actions
  router.post('/evaluate/:stationId', async (req, res) => {
    const { mode = 'conservative' } = req.body;
    const station = stationsData.get(req.params.stationId);
    if (!station) return res.status(404).json({ error: 'Station not found' });

    // Refresh metrics from signals before evaluating
    station.metrics = computeMetricsFromSignals(station);
    station.lastUpdate = new Date();

    const triggers = checkTriggers(station);
    // Updated to await async decideAction
    const { actions, explanations } = await decideAction(station, triggers, mode);
    const status = determineStatus(triggers);

    station.triggers = triggers;
    station.status = status;

    actions.forEach(action => decisionsLog.push(action));

    // Aggressive mode: auto-execute executable actions (in simulation to avoid accidental live calls)
    if (mode === 'aggressive') {
      for (const action of actions) {
        if (isExecutable(action)) {
          try {
            const result = await executeDecision(action, 'simulation');
            action.status = result.executed ? 'executed' : 'auto-execute-failed';
            action.execution = result;
            action.executedAt = result.executedAt;
            if (result.executed) {
              console.log(`[Aggressive] Auto-executed: ${action.action} for ${action.stationId}`);
            } else {
              console.log(`[Aggressive] Auto-execute failed: ${action.action} - ${result.reason}`);
            }
          } catch (err) {
            action.status = 'auto-execute-failed';
            action.execution = { executed: false, error: err.message };
            console.error(`[Aggressive] Auto-execute error:`, err.message);
          }
        }
      }
    }

    // Transform recommendations to match frontend format
    const transformedRecommendations = actions.map(action => ({
      id: action.id,
      action: action.action,
      trigger: action.trigger,
      status: action.status,
      ...(action.execution && { execution: action.execution }),
      explanation: {
        why: action.explanation.why,
        expectedImpact: action.explanation.expectedImpact,
        impact: action.explanation.expectedImpact,
        confidence: action.explanation.confidence,
        confidenceScore: action.explanation.confidence === 'High' ? 90 : action.explanation.confidence === 'Medium' ? 70 : 50,
        ...(action.explanation.probableRootCause && { probableRootCause: action.explanation.probableRootCause }),
        ...(action.explanation.timeToStockoutMinutes != null && { timeToStockoutMinutes: action.explanation.timeToStockoutMinutes })
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
  router.post('/evaluate-all', async (req, res) => {
    const { mode = 'conservative' } = req.body;
    const results = [];

    for (const [stationId, station] of stationsData.entries()) {
      station.metrics = computeMetricsFromSignals(station);
      station.lastUpdate = new Date();

      const triggers = checkTriggers(station);
      const { actions } = await decideAction(station, triggers, mode);
      const status = determineStatus(triggers);

      station.triggers = triggers;
      station.status = status;

      actions.forEach(action => decisionsLog.push(action));

      // Aggressive mode: auto-execute executable actions
      if (mode === 'aggressive') {
        for (const action of actions) {
          if (isExecutable(action)) {
            try {
              const result = await executeDecision(action, 'simulation');
              action.status = result.executed ? 'executed' : 'auto-execute-failed';
              action.execution = result;
              action.executedAt = result.executedAt;
              if (result.executed) {
                console.log(`[Aggressive] Auto-executed: ${action.action} for ${action.stationId}`);
              }
            } catch (err) {
              action.status = 'auto-execute-failed';
              action.execution = { executed: false, error: err.message };
            }
          }
        }
      }

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

// Export checkTriggers for use in other modules (must refresh metrics first)
const checkTriggersForStation = (station) => {
  if (!station.metrics) return [];
  const { metrics } = station;
  const triggers = [];

  // Updated thresholds for higher sensitivity
  if (metrics.queueLength > 3) {
    triggers.push({
      name: 'Congestion',
      severity: 'Warning',
      metric: 'queueLength',
      value: metrics.queueLength,
      threshold: 3,
      reason: `Queue length (${metrics.queueLength}) exceeds threshold (3)`
    });
  }

  const baseline = metrics.swapRateBaseline ?? metrics.swapRate;
  if (baseline > 0 && metrics.swapRate >= 2 * baseline && metrics.swapRate >= 4) {
    triggers.push({
      name: 'Demand Surge',
      severity: 'Warning',
      metric: 'swapRate',
      value: metrics.swapRate,
      threshold: 2 * baseline,
      reason: `Swap rate (${metrics.swapRate}/15min) is 2× baseline (${baseline})`
    });
  }

  if (metrics.chargedBatteries < 4 && metrics.swapRate > 4) {
    triggers.push({
      name: 'Stockout Risk',
      severity: metrics.chargedBatteries < 2 ? 'Critical' : 'Warning',
      metric: 'chargedBatteries',
      value: metrics.chargedBatteries,
      threshold: 4,
      reason: `Low battery inventory (${metrics.chargedBatteries}) with high demand (${metrics.swapRate} swaps/15min)`
    });
  }

  const errorSignals = (station.recentSignals || []).filter(s => s.type === 'error_log').slice(-20);
  const byCode = {};
  errorSignals.forEach(s => {
    const code = s.data?.errorCode || s.data?.message || s.data?.code || 'UNKNOWN';
    byCode[code] = (byCode[code] || 0) + 1;
  });
  const recurring = Object.entries(byCode).find(([, count]) => count >= 3);

  if (recurring) {
    triggers.push({
      name: 'Recurring Fault',
      severity: 'Warning',
      metric: 'errorFrequency',
      value: recurring[1],
      threshold: 3,
      reason: `Same error (${recurring[0]}) repeated ${recurring[1]} times — likely root cause`,
      errorCode: recurring[0]
    });
  } else if (metrics.errorFrequency >= 3) {
    triggers.push({
      name: 'Charger Fault',
      severity: 'Warning',
      metric: 'errorFrequency',
      value: metrics.errorFrequency,
      threshold: 3,
      reason: `Multiple charger errors detected (${metrics.errorFrequency} errors)`
    });
  }

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
