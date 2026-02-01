// Reroute Driver Endpoint - Receives reroute notifications and forwards to n8n + Twilio SMS
const express = require('express');
const fetch = require('node-fetch');
const twilio = require('twilio');
const router = express.Router();

// Initialize Twilio
const twilioClient = process.env.TWILIO_ACCOUNT_SID ? new twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
) : null;

// Store reroute history
const rerouteHistory = [];

// Middleware to validate Bearer token
const validateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const expectedToken = process.env.REROUTE_API_TOKEN || 'DEMO_REROUTE_TOKEN';

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
    status: 'received',
    sms_status: 'pending'
  };

  rerouteHistory.push(notification);

  // 1. Send SMS via Twilio (Priority)
  if (twilioClient) {
    const targetPhone = process.env.DEMO_DRIVER_PHONE || '+919818166684'; // Default to user provided number
    const messageBody = `🚗 DRIVER ALERT: Reroute Requested.\nFrom: ${payload.station_from}\nTo: ${payload.station_to}\nReason: Congestion (Swap Rate > 15/hr)\nAction Required: Divert immediately.`;

    try {
      console.log(`📱 Sending SMS to ${targetPhone}...`);
      const message = await twilioClient.messages.create({
        body: messageBody,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: targetPhone
      });
      console.log(`✅ SMS Sent! SID: ${message.sid}`);
      notification.sms_status = 'sent';
      notification.sms_sid = message.sid;
    } catch (smsError) {
      console.error('❌ SMS Failed:', smsError.message);
      notification.sms_status = 'failed';
      notification.sms_error = smsError.message;
    }
  } else {
    console.warn('⚠️ Twilio Config missing in .env, skipping SMS.');
    notification.sms_status = 'skipped_no_config';
  }

  // 2. Forward to n8n webhook (Secondary)
  const n8nWebhook = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/notification-trigger';

  try {
    console.log('📤 Forwarding to n8n:', n8nWebhook);

    // Fire and forget n8n to speed up response
    fetch(n8nWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(async (n8nResponse) => {
      if (n8nResponse.ok) {
        console.log('✅ Sent to n8n');
      } else {
        console.error('❌ n8n error:', n8nResponse.status);
      }
    }).catch(err => console.error('❌ n8n fetch error:', err.message));

  } catch (error) {
    console.error('❌ Failed to prepare n8n request:', error.message);
  }

  // Return success response immediately
  res.json({
    success: true,
    notification_id: notification.id,
    sms_status: notification.sms_status,
    timestamp: notification.timestamp
  });
});

// GET /api/reroute-driver/history - View reroute history
router.get('/history', (req, res) => {
  const transformedHistory = rerouteHistory.slice(-50).map((notification) => ({
    id: notification.id,
    timestamp: notification.timestamp,
    ...notification.payload,
    sms_status: notification.sms_status
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
