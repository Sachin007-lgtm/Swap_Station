const fetch = require('node-fetch');
async function test() {
    const payload = {
        mode: "live_demo",
        driver_id: "DR_DEMO_244",
        phone: "+919205408755",
        station_from: "station-0",
        station_to: "station-2",
        distance_km: 12.2,
        expected_wait_time_min: 6,
        reason: "Congestion",
        confidence: 0.72,
        source: "SmartSwap Backend",
        type: "reroute_driver"
    };
    const res = await fetch('http://localhost:5678/webhook/notification-trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    console.log('Status:', res.status);
    console.log('Body:', await res.text());
}
test();
