// STEPS 3-5: Apply Triggers, Decision Logic & Explainability
const express = require('express');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

const createRouter = (stationsData, decisionsLog) => {
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
      action: action.action,
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
  router.post('/approve/:decisionId', (req, res) => {
    const decision = decisionsLog.find(d => d.id === req.params.decisionId);
    if (!decision) return res.status(404).json({ error: 'Decision not found' });

    decision.status = 'approved';
    decision.approvedAt = new Date();
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

module.exports = { router: createRouter };
