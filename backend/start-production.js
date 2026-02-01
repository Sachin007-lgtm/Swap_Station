// Production starter - runs both server and signal simulator
const { spawn } = require('child_process');

console.log('🚀 Starting production services...');

// Start the main server
const server = spawn('node', ['server.js'], {
  stdio: 'inherit',
  env: process.env
});

// Wait a bit for server to start, then start simulator
setTimeout(() => {
  console.log('🔄 Starting signal simulator...');
  const simulator = spawn('node', ['scripts/signalSimulator.js'], {
    stdio: 'inherit',
    env: { ...process.env, BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:5000' }
  });

  simulator.on('error', (err) => {
    console.error('❌ Simulator error:', err);
  });
}, 3000);

server.on('error', (err) => {
  console.error('❌ Server error:', err);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n👋 Shutting down services...');
  process.exit(0);
});
