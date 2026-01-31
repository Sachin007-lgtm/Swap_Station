// Reroute Driver Endpoint - Receives reroute notifications and forwards to n8n
const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

// Store reroute history
const rerouteHistory = [];

// Middleware to validate Bearer token
const validateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const expectedToken = process.env.REROUTE_API_TOKEN || 'demo_reroute_secret_123';
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }
  
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Invalid authorization format' });
  }
  
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  if (token !== expectedToken) {
    return res.status(403).json({ error: 'Invalid token' });
  }
  
  next();
};

// POST /api/reroute-driver - Main endpoint
router.post('/', validateToken, async (req, res) => {
  const payload = req.body;
  
  // Validate payload
  if (!payload.mode || !payload.station_from || !payload.station_to) {
    return res.status(400).json({ 
      error: 'Invalid payload',
      required: ['mode', 'station_from', 'station_to']
    });
  }
  
  // Store in history
  const notification = {
    id: `notif_${Date.now()}`,
    timestamp: new Date().toISOString(),
    payload: payload,
    status: 'received'
  };
  
  rerouteHistory.push(notification);
  
  // Forward to n8n webhook
  const n8nWebhook = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook-test/notification-trigger';
  
  try {
    console.log('📤 Forwarding to n8n:', n8nWebhook);
    console.log('📦 Payload:', JSON.stringify(payload, null, 2));
    
    const n8nResponse = await fetch(n8nWebhook, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    console.log('📬 n8n response status:', n8nResponse.status);
    
    if (n8nResponse.ok) {
      const n8nData = await n8nResponse.json().catch(() => ({}));
      notification.status = 'sent_to_n8n';
      notification.n8nResponse = n8nData;
      console.log('✅ Successfully sent to n8n');
    } else {
      const errorText = await n8nResponse.text();
      console.error('❌ n8n webhook responded with error:', n8nResponse.status);
      console.error('❌ Error details:', errorText);
      notification.status = 'n8n_error';
      notification.error = `n8n returned status ${n8nResponse.status}: ${errorText}`;
    }
  } catch (error) {
    console.error('❌ Failed to send to n8n:', error.message);
    console.error('❌ Stack:', error.stack);
    notification.status = 'failed';
    notification.error = error.message;
  }
  
  // Return success response
  res.json({
    success: true,
    notification_id: notification.id,
    n8n_status: notification.status,
    timestamp: notification.timestamp,
    mode: payload.mode // Include mode in response for debugging
  });
});

// GET /api/reroute-driver/history - View reroute history
router.get('/history', (req, res) => {
  const transformedHistory = rerouteHistory.slice(-50).map((notification) => ({
    id: notification.id,
    timestamp: notification.timestamp,
    ...notification.payload,
  }));

  res.json({
    total: rerouteHistory.length,
    history: transformedHistory
  });
});

// DELETE /api/reroute-driver/history - Clear reroute history
router.delete('/history', (req, res) => {
  rerouteHistory.length = 0;
  res.json({ success: true, total: rerouteHistory.length });
});

module.exports = router;
