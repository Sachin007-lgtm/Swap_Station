import { useState, useEffect, useCallback } from 'react';
import { Station, Alert, Recommendation } from '@/types/station';
import { mockStations, mockAlerts, mockRecommendations } from '@/data/mockData';

export const useStationData = () => {
  const [stations, setStations] = useState<Station[]>(mockStations);
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const [recommendations, setRecommendations] = useState<Recommendation[]>(mockRecommendations);
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStations((prev) =>
        prev.map((station) => {
          // Randomly fluctuate metrics
          const fluctuation = () => (Math.random() - 0.5) * 2;
          const clamp = (val: number, min: number, max: number) =>
            Math.max(min, Math.min(max, val));

          const newMetrics = {
            swapRate: clamp(
              Math.round(station.metrics.swapRate + fluctuation() * 2),
              0,
              25
            ),
            queueLength: clamp(
              Math.round(station.metrics.queueLength + fluctuation()),
              0,
              20
            ),
            chargedBatteries: clamp(
              Math.round(station.metrics.chargedBatteries + fluctuation()),
              0,
              30
            ),
            chargerUptime: clamp(
              station.metrics.chargerUptime + fluctuation() * 0.5,
              50,
              100
            ),
            errorFrequency: clamp(
              Math.round(station.metrics.errorFrequency + fluctuation() * 0.3),
              0,
              10
            ),
          };

          // Determine status based on metrics
          let newStatus: Station['status'] = 'normal';
          if (
            newMetrics.queueLength > 10 ||
            newMetrics.chargedBatteries < 3 ||
            newMetrics.chargerUptime < 80
          ) {
            newStatus = 'critical';
          } else if (
            newMetrics.queueLength > 5 ||
            newMetrics.chargedBatteries < 6 ||
            newMetrics.chargerUptime < 90
          ) {
            newStatus = 'warning';
          }

          return {
            ...station,
            metrics: newMetrics,
            status: newStatus,
            lastUpdate: new Date().toISOString(),
          };
        })
      );
      setLastUpdate(new Date());
    }, 3000);

    return () => clearInterval(interval);
  }, []);

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
    (stationId: string) =>
      recommendations.filter((r) => r.stationId === stationId),
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
  };
};
