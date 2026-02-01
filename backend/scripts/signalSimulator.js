// Signal Simulator (RAW → DERIVED)
// Simulates real IoT telemetry (DATA 1)
// Derives ops signals (DATA 2)
// Sends ops signals to backend

const axios = require('axios');

const BACKEND_URL = process.env.BACKEND_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:5000';
const STATIONS = ['station-0', 'station-1', 'station-2', 'station-3', 'station-4'];

const TOTAL_BATTERIES_PER_STATION = 12; // Reduced from 20

// -----------------------------
// STEP 1: RAW DATA (DATA 1)
// -----------------------------

const generateRawTelemetry = (batteryId) => {
  const soc = Math.floor(Math.random() * 85); // Biased lower to create more congestion/stockout risk

  return {
    deviceID: batteryId,
    ts: new Date().toISOString(),
    soc,
    soh: 95 + Math.random() * 5,
    lat: 28.5022,
    lon: 77.4151,
    speed: Math.random() * 5,
    voltage: 48 + Math.random() * 6,
    mosfetTemp: 25 + Math.random() * 30,
    chargeFetStatus: Math.random() > 0.1 ? 1 : 0,
    chargingStatus: soc < 80 ? '0' : '1',
    alarms: {
      cellUnbalance: Math.random() > 0.97 ? 1 : 0,
      packOVP: Math.random() > 0.98 ? 1 : 0,
      CFETFail: Math.random() > 0.98 ? 1 : 0
    }
  };
};

// -----------------------------
// STEP 2: DERIVATION LOGIC
// -----------------------------

const deriveSwapEvent = (telemetry) => {
  // Increased probability: higher SoC threshold and higher speed threshold
  if (telemetry.soc < 45 && telemetry.speed < 2) {
    return {
      type: 'swap_event',
      data: {
        driverId: `driver-${Math.floor(Math.random() * 1000)}`,
        oldBatteryId: telemetry.deviceID,
        newBatteryId: `bat-${Math.floor(Math.random() * 100)}`,
        swapTime: Math.floor(Math.random() * 5) + 1,
        status: 'completed'
      }
    };
  }
  return null;
};

const deriveChargerStatus = (telemetry) => {
  let status = 'up';
  let errorCode = null;

  if (
    telemetry.chargeFetStatus === 0 ||
    telemetry.alarms.CFETFail ||
    telemetry.alarms.packOVP
  ) {
    status = 'down';
    errorCode = telemetry.alarms.packOVP
      ? 'PACK_OVERVOLT'
      : telemetry.alarms.CFETFail
        ? 'CFET_FAIL'
        : 'CHARGER_FAULT';
  }

  return {
    type: 'charger_status',
    data: {
      chargerId: `charger-${Math.floor(Math.random() * 4)}`,
      status,
      errorCode,
      temperature: telemetry.mosfetTemp
    }
  };
};

const deriveErrorLog = (telemetry) => {
  if (telemetry.alarms.cellUnbalance) {
    return {
      type: 'error_log',
      data: {
        errorCode: 'CELL_UNBALANCE',
        message: 'Cell voltage imbalance detected',
        severity: 'high'
      }
    };
  }

  if (telemetry.alarms.packOVP) {
    return {
      type: 'error_log',
      data: {
        errorCode: 'PACK_OVERVOLT',
        message: 'Battery pack overvoltage',
        severity: 'high'
      }
    };
  }

  return null;
};

const deriveBatteryInventory = (batteryTelemetries) => {
  const charged = batteryTelemetries.filter(b => b.soc >= 80).length;
  const uncharged = batteryTelemetries.filter(b => b.soc < 30).length;

  return {
    type: 'battery_inventory',
    data: {
      charged,
      uncharged,
      totalCapacity: TOTAL_BATTERIES_PER_STATION
    }
  };
};

// -----------------------------
// STEP 3: SEND TO BACKEND
// -----------------------------

const sendSignal = async (stationId, signal) => {
  try {
    await axios.post(`${BACKEND_URL}/api/signals/receive`, {
      stationId,
      signalType: signal.type,
      data: signal.data
    });

    console.log(`✅ ${signal.type} sent to ${stationId}`);
  } catch (err) {
    console.error(`❌ Failed to send ${signal.type} to ${stationId}`, err.message);
  }
};

// -----------------------------
// STEP 4: MAIN SIMULATION LOOP
// -----------------------------

const simulateStation = async (stationId) => {
  const batteries = [];

  // Generate raw telemetry for all batteries
  for (let i = 0; i < TOTAL_BATTERIES_PER_STATION; i++) {
    batteries.push(generateRawTelemetry(`bat-${i}`));
  }

  // Derive inventory signal
  const inventorySignal = deriveBatteryInventory(batteries);
  await sendSignal(stationId, inventorySignal);

  // Derive per-battery signals
  for (const telemetry of batteries) {
    const swapEvent = deriveSwapEvent(telemetry);
    if (swapEvent) await sendSignal(stationId, swapEvent);

    const chargerStatus = deriveChargerStatus(telemetry);
    await sendSignal(stationId, chargerStatus);

    const errorLog = deriveErrorLog(telemetry);
    if (errorLog) await sendSignal(stationId, errorLog);
  }
};

const simulateSignals = async () => {
  console.log('🚀 Starting RAW → DERIVED signal simulator');
  console.log('📡 Emitting realistic ops signals every 5 seconds\n');

  setInterval(async () => {
    const randomStation =
      STATIONS[Math.floor(Math.random() * STATIONS.length)];
    await simulateStation(randomStation);
  }, 5000);
};

// -----------------------------
// START
// -----------------------------

// Only auto-start if run directly, not when required as module
if (require.main === module) {
  simulateSignals();
}

// Export for integration into server
module.exports = { simulateSignals };
