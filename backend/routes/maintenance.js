// Maintenance Ticket API
const express = require('express');
const fetch = require('node-fetch');

const router = express.Router();

// In-memory storage for maintenance tickets
const maintenanceTickets = [];

const createRouter = () => {
  const MAINTENANCE_API_TOKEN = process.env.MAINTENANCE_API_TOKEN || 'DEMO_MAINTENANCE_TOKEN';
  const N8N_MAINTENANCE_WEBHOOK = process.env.N8N_MAINTENANCE_WEBHOOK || 'http://localhost:5678/webhook/maintenance-ticket';
  const N8N_REROUTE_WEBHOOK = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/notification-trigger';

  console.log('🔧 Maintenance Router Initialized');
  console.log('   N8N_MAINTENANCE_WEBHOOK:', N8N_MAINTENANCE_WEBHOOK);
  console.log('   N8N_REROUTE_WEBHOOK:', N8N_REROUTE_WEBHOOK);

  // POST endpoint to receive maintenance ticket notifications
  router.post('/ticket', async (req, res) => {
    // Validate token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7);
    if (token !== MAINTENANCE_API_TOKEN) {
      return res.status(403).json({ error: 'Invalid token' });
    }

    const payload = req.body;

    // Add ticket metadata
    const ticket = {
      ...payload,
      id: `TICKET_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      created_at: new Date().toISOString(),
      status: 'open'
    };

    // Store in memory
    maintenanceTickets.unshift(ticket);

    // Keep only last 50 tickets
    if (maintenanceTickets.length > 50) {
      maintenanceTickets.pop();
    }

    console.log('🔧 Maintenance ticket received:', ticket.id);

    // Forward to n8n webhook for external processing
    try {
      console.log('📤 Attempting to forward to n8n:', N8N_MAINTENANCE_WEBHOOK);
      console.log('📦 Payload:', JSON.stringify(ticket, null, 2));

      const n8nResponse = await fetch(N8N_MAINTENANCE_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticket)
      });

      console.log('📬 n8n response status:', n8nResponse.status);
      if (n8nResponse.ok) {
        console.log('✅ Forwarded maintenance ticket to n8n');
        const responseData = await n8nResponse.text();
        console.log('✅ n8n response:', responseData);
      } else {
        const responseText = await n8nResponse.text();
        console.error('❌ n8n webhook responded with error:', n8nResponse.status);
        console.error('❌ Error details:', responseText);
      }
    } catch (n8nError) {
      console.error('❌ Failed to forward to n8n:', n8nError.message);
      console.error('❌ Stack:', n8nError.stack);
    }

    res.json({
      success: true,
      ticket_id: ticket.id,
      message: 'Maintenance ticket created successfully'
    });
  });

  // GET endpoint to fetch ticket history
  router.get('/history', (req, res) => {
    res.json({
      tickets: maintenanceTickets,
      total: maintenanceTickets.length
    });
  });

  // GET endpoint to fetch single ticket
  router.get('/ticket/:id', (req, res) => {
    const ticket = maintenanceTickets.find(t => t.id === req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    res.json({ ticket });
  });

  // PATCH endpoint to update ticket status
  router.patch('/ticket/:id', (req, res) => {
    const ticket = maintenanceTickets.find(t => t.id === req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const { status, resolution, technician } = req.body;

    if (status) ticket.status = status;
    if (resolution) ticket.resolution = resolution;
    if (technician) ticket.assigned_to = technician;
    ticket.updated_at = new Date().toISOString();

    console.log(`🔧 Ticket ${ticket.id} updated: status=${status}`);

    res.json({
      success: true,
      ticket
    });
  });

  // DELETE endpoint to clear ticket history
  router.delete('/history', (req, res) => {
    const count = maintenanceTickets.length;
    maintenanceTickets.length = 0;
    console.log(`🗑️ Cleared ${count} maintenance tickets`);
    res.json({
      success: true,
      message: `Cleared ${count} tickets`
    });
  });

  return router;
};

module.exports = { router: createRouter };
