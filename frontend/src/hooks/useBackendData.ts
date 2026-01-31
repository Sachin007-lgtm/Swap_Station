import { useState, useEffect, useCallback } from 'react';
import { Station, Alert, Recommendation } from '@/types/station';
import { io, Socket } from 'socket.io-client';

const API_URL = 'http://localhost:5000';

export const useBackendData = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [socket, setSocket] = useState<Socket | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    const newSocket = io(API_URL);

    newSocket.on('connect', () => {
      console.log('✅ Connected to backend');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from backend');
      setIsConnected(false);
    });

    newSocket.on('stationsUpdate', (data) => {
      console.log('📡 Received stations update:', data);
      setStations(transformStations(data));
      setLastUpdate(new Date());
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Fetch initial data
  useEffect(() => {
    fetchStations();
    fetchAlerts();
    
    // Poll for updates every 5 seconds as fallback
    const interval = setInterval(() => {
      fetchStations();
      fetchAlerts();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Transform backend station data to frontend format
  const transformStations = (backendStations: any[]): Station[] => {
    return backendStations.map((station) => ({
      id: station.id,
      name: station.name,
      location: station.location,
      status: station.status || 'normal',
      metrics: {
        swapRate: station.metrics?.swapRate || 0,
        queueLength: station.metrics?.queueLength || 0,
        chargedBatteries: station.metrics?.chargedBatteries || 0,
        chargerUptime: station.metrics?.chargerUptimePercent || 0,
        errorFrequency: station.metrics?.errorFrequency || 0,
      },
      lastUpdate: station.lastUpdate || new Date().toISOString(),
      coordinates: station.coordinates || { lat: 0, lng: 0 },
    }));
  };

  // Fetch all stations
  const fetchStations = async () => {
    try {
      const response = await fetch(`${API_URL}/api/monitoring/all`);
      if (response.ok) {
        const data = await response.json();
        setStations(transformStations(data.stations || []));
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error fetching stations:', error);
    }
  };

  // Fetch alerts
  const fetchAlerts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/alerts`);
      if (response.ok) {
        const data = await response.json();
        
        // Backend returns array directly, not { alerts: [...] }
        const backendAlerts = Array.isArray(data) ? data : (data.alerts || []);
        
        // Transform backend alerts to frontend format
        const transformedAlerts: Alert[] = backendAlerts.flatMap((alert: any) => 
          (alert.triggers || []).map((trigger: any, index: number) => ({
            id: `alert-${alert.stationId}-${trigger.name}-${index}`,
            stationId: alert.stationId,
            stationName: alert.stationName,
            type: trigger.name,
            severity: trigger.severity === 'Critical' ? 'critical' : 'high',
            message: trigger.reason,
            timestamp: alert.timestamp || new Date().toISOString(),
            acknowledged: false,
          }))
        );
        
        setAlerts(transformedAlerts);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  // Fetch recommendations for a station
  const fetchRecommendations = async (stationId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/decisions/evaluate/${stationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'conservative' }),
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Get decision IDs from the response
        const decisions = data.recommendations || [];
        
        // Transform backend recommendations to frontend format
        const transformedRecs: Recommendation[] = decisions.map((rec: any, index: number) => ({
          id: rec.id || `rec-${stationId}-${index}`,
          decisionId: rec.id, // Store decision ID for approval
          stationId: stationId,
          stationName: data.station?.name || '',
          type: 'action',
          priority: rec.explanation?.confidence === 'High' ? 'high' : rec.explanation?.confidence === 'Low' ? 'low' : 'medium',
          action: rec.action,
          reason: rec.explanation?.why || '',
          expectedImpact: rec.explanation?.expectedImpact || rec.explanation?.impact || '',
          impact: rec.explanation?.impact || rec.explanation?.expectedImpact || '',
          confidence: rec.explanation?.confidenceScore || (rec.explanation?.confidence === 'High' ? 90 : rec.explanation?.confidence === 'Medium' ? 70 : 50),
          timestamp: new Date().toISOString(),
        }));
        
        setRecommendations(prev => [
          ...prev.filter(r => r.stationId !== stationId),
          ...transformedRecs
        ]);
        
        return transformedRecs;
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
    return [];
  };

  // Approve a recommendation (execute the decision)
  const approveRecommendation = async (decisionId: string, mode: 'live_demo' | 'simulation' = 'simulation') => {
    try {
      const response = await fetch(`${API_URL}/api/decisions/approve/${decisionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Recommendation approved and executed:', data);
        return data;
      } else {
        console.error('Failed to approve recommendation');
        return null;
      }
    } catch (error) {
      console.error('Error approving recommendation:', error);
      return null;
    }
  };

  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    );
  }, []);

  const getStationById = useCallback(
    (id: string) => stations.find((s) => s.id === id),
    [stations]
  );

  const getAlertsByStation = useCallback(
    (stationId: string) => alerts.filter((a) => a.stationId === stationId),
    [alerts]
  );

  const getRecommendationsByStation = useCallback(
    (stationId: string) => {
      const stationRecs = recommendations.filter((r) => r.stationId === stationId);
      // If no recommendations loaded yet, fetch them
      if (stationRecs.length === 0) {
        fetchRecommendations(stationId);
      }
      return stationRecs;
    },
    [recommendations]
  );

  const stats = {
    totalStations: stations.length,
    normalStations: stations.filter((s) => s.status === 'normal').length,
    warningStations: stations.filter((s) => s.status === 'warning').length,
    criticalStations: stations.filter((s) => s.status === 'critical').length,
    activeAlerts: alerts.filter((a) => !a.acknowledged).length,
    totalSwapsToday: stations.reduce((acc, s) => acc + s.metrics.swapRate * 4, 0),
  };

  return {
    stations,
    alerts,
    recommendations,
    isConnected,
    lastUpdate,
    stats,
    acknowledgeAlert,
    getStationById,
    getAlertsByStation,
    getRecommendationsByStation,
    fetchRecommendations,
    approveRecommendation,
  };
};
