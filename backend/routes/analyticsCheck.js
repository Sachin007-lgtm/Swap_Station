const express = require('express');
const Groq = require('groq-sdk');
const supabase = require('../db/supabaseClient');
require('dotenv').config();

const router = express.Router();

const createRouter = (stationsData, decisionsLog) => {
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    let groqClient = null;

    if (GROQ_API_KEY) {
        groqClient = new Groq({ apiKey: GROQ_API_KEY });
        console.log('✅ Groq Client Initialized for Analytics Chat');
    } else {
        console.warn('⚠️ GROQ_API_KEY missing. Analytics Chatbot will not function.');
    }

    router.post('/chat', async (req, res) => {
        const { query } = req.body;

        if (!groqClient) {
            return res.status(503).json({
                answer: "I'm sorry, but I'm currently offline (API Key missing). Please check the backend configuration."
            });
        }

        if (!query) {
            return res.status(400).json({ error: "Query is required" });
        }

        // 1. Live Context Gathering (In-Memory)
        const stations = Array.from(stationsData.values()).map(s => ({
            name: s.name,
            status: s.status,
            metrics: s.metrics,
            triggers: s.triggers
        }));

        const activeAlerts = stations
            .filter(s => s.triggers && s.triggers.length > 0)
            .map(s => `${s.name}: ${s.triggers.map(t => t.name).join(', ')}`);

        const recentDecisions = decisionsLog.slice(-10).map(d =>
            `${d.timestamp.toISOString().split('T')[1].split('.')[0]} - ${d.action} for ${d.stationName} (${d.trigger})`
        );

        // 2. Historical Context (Supabase)
        let historicalContext = "No historical data available.";
        if (supabase) {
            try {
                // Fetch signal counts for the last 24 hours
                const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

                const { data: signalStats, error: sigError } = await supabase
                    .from('signals')
                    .select('type, station_id', { count: 'exact' })
                    .gt('timestamp', oneDayAgo);

                const { data: totalDecisions, error: decError } = await supabase
                    .from('decisions')
                    .select('id', { count: 'exact' })
                    .gt('created_at', oneDayAgo);

                if (!sigError && !decError) {
                    historicalContext = `
                    Last 24 Hours Summary:
                    - Total Signals Received: ${signalStats.length}
                    - Total Automated Decisions: ${totalDecisions.length}
                    - Station with most signals: ${getTopStation(signalStats)}
                    `;
                }
            } catch (err) {
                console.warn('⚠️ Failed to fetch historical context:', err.message);
            }
        }

        // 3. Prompt Engineering
        const systemPrompt = `You are the "StationOS Analytics Assistant", an expert AI for an EV Battery Swap Network.
    
    Current System State (Real-time):
    - Total Stations: ${stations.length}
    - Critical Stations: ${stations.filter(s => s.status === 'Critical').length}
    - Warning Stations: ${stations.filter(s => s.status === 'Warning').length}
    
    Station Data:
    ${JSON.stringify(stations, null, 2)}
    
    Active Alerts:
    ${activeAlerts.length > 0 ? activeAlerts.join('\n') : "None"}
    
    Historical Context (Supabase):
    ${historicalContext}
    
    Recent Automated Decisions (from memory):
    ${recentDecisions.join('\n')}
    
    Instructions:
    - Answer based on both REAL-TIME and HISTORICAL data provided.
    - If asked for a "Monthly Report" or broad summary, use the historical context.
    - If asked about "critical" stations, list them with their current issues from the real-time data.
    - Be concise, professional, and insightful.
    - Do not hallucinate data. If data is missing (like specific monthly numbers not in context), say you only have the last 24 hours of data currently cached for analysis.
    `;

        try {
            const completion = await groqClient.chat.completions.create({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: query }
                ],
                model: 'llama-3.3-70b-versatile',
                temperature: 0.3,
                max_tokens: 500
            });

            const answer = completion.choices[0]?.message?.content || "I couldn't generate an answer at this time.";

            res.json({ answer });

        } catch (error) {
            console.error('❌ Groq Chat Error:', error.message);
            res.status(500).json({
                answer: "I encountered an error while processing your request. Please try again."
            });
        }
    });

    const getTopStation = (signals) => {
        if (!signals || signals.length === 0) return "N/A";
        const counts = {};
        signals.forEach(s => counts[s.station_id] = (counts[s.station_id] || 0) + 1);
        return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    };

    return router;
};

module.exports = { router: createRouter };
