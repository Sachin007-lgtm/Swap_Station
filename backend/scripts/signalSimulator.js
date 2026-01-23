// Signal Simulator - STEP 1
// Simulates real station signals and sends them to the backend

const axios = require('axios');

const BACKEND_URL = 'http://localhost:5000';
const STATIONS = ['station-0', 'station-1', 'station-2', 'station-3', 'station-4'];

const generateSwapEvent = () => ({
  type: 'swap_event',
  data: {
    driverId: `driver-${Math.floor(Math.random() * 1000)}`,
    oldBatteryId: `bat-${Math.floor(Math.random() * 100)}`,
    newBatteryId: `bat-${Math.floor(Math.random() * 100)}`,
    swapTime: Math.floor(Math.random() * 5) + 1, // 1-5 mins
    status: 'completed'
  }
});

const generateChargerStatus = () => ({
  type: 'charger_status',
  data: {
    chargerId: `charger-${Math.floor(Math.random() * 4)}`,
    status: Math.random() > 0.1 ? 'up' : 'down', // 10% failure rate
    errorCode: Math.random() > 0.95 ? `ERR-${Math.floor(Math.random() * 100)}` : null,
    temperature: 45 + Math.random() * 20
  }
});

const generateBatteryInventory = () => ({
  type: 'battery_inventory',
  data: {
    charged: Math.floor(Math.random() * 15),
    uncharged: Math.floor(Math.random() * 10),
    totalCapacity: 20
  }
});

const generateErrorLog = () => ({
  type: 'error_log',
  data: {
    errorCode: `ERR-${Math.floor(Math.random() * 100)}`,
    message: 'Charger timeout' || 'Battery detection failed' || 'Connection lost',
    severity: Math.random() > 0.7 ? 'high' : 'medium'
  }
});

const sendSignal = async (stationId) => {
  const signalTypes = [
    generateSwapEvent,
    generateChargerStatus,
    generateBatteryInventory,
    generateErrorLog
  ];

  const randomSignal = signalTypes[Math.floor(Math.random() * signalTypes.length)]();

  try {
    const response = await axios.post(`${BACKEND_URL}/api/signals/receive`, {
      stationId,
      signalType: randomSignal.type,
      data: randomSignal.data
    });
    console.log(`✅ Signal sent to ${stationId}: ${randomSignal.type}`);
  } catch (error) {
    console.error(`❌ Error sending signal to ${stationId}:`, error.message);
  }
};

const simulateSignals = async () => {
  console.log('🚀 Starting signal simulator...');
  console.log(`📡 Sending signals every 3 seconds...`);

  // Send initial signals to all stations
  for (const stationId of STATIONS) {
    await sendSignal(stationId);
  }

  // Continuous signal stream
  setInterval(() => {
    const randomStation = STATIONS[Math.floor(Math.random() * STATIONS.length)];
    sendSignal(randomStation);
  }, 3000);
};

// Start simulator
simulateSignals();
