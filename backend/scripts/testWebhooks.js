const fetch = require('node-fetch');

const N8N_REROUTE_WEBHOOK = 'http://localhost:5678/webhook/notification-trigger';
const N8N_MAINTENANCE_WEBHOOK = 'http://localhost:5678/webhook/maintenance-ticket';

async function testWebhooks() {
    console.log('🧪 Testing n8n Webhook Connections...');

    try {
        console.log(`🔗 Testing Reroute Webhook: ${N8N_REROUTE_WEBHOOK}`);
        const res1 = await fetch(N8N_REROUTE_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ test: true, source: 'test-script' })
        });
        console.log(`Reroute Webhook Status: ${res1.status} ${res1.statusText}`);
    } catch (e) {
        console.error(`❌ Reroute Webhook Failed: ${e.message}`);
    }

    try {
        console.log(`🔗 Testing Maintenance Webhook: ${N8N_MAINTENANCE_WEBHOOK}`);
        const res2 = await fetch(N8N_MAINTENANCE_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ test: true, source: 'test-script' })
        });
        console.log(`Maintenance Webhook Status: ${res2.status} ${res2.statusText}`);
    } catch (e) {
        console.error(`❌ Maintenance Webhook Failed: ${e.message}`);
    }
}

testWebhooks();
