import { Station, Alert, Recommendation, Signal } from '@/types/station';

export const mockStations: Station[] = [
  {
    id: 'station-0',
    name: 'NYC Central Hub',
    location: 'Manhattan, New York',
    status: 'normal',
    metrics: {
      swapRate: 12,
      queueLength: 2,
      chargedBatteries: 18,
      chargerUptime: 98.5,
      errorFrequency: 0,
    },
    lastUpdate: new Date().toISOString(),
    coordinates: { lat: 40.7128, lng: -74.006 },
  },
  {
    id: 'station-1',
    name: 'LA Downtown',
    location: 'Los Angeles, California',
    status: 'warning',
    metrics: {
      swapRate: 8,
      queueLength: 6,
      chargedBatteries: 5,
      chargerUptime: 92.3,
      errorFrequency: 2,
    },
    lastUpdate: new Date().toISOString(),
    coordinates: { lat: 34.0522, lng: -118.2437 },
  },
  {
    id: 'station-2',
    name: 'Chicago Loop',
    location: 'Chicago, Illinois',
    status: 'critical',
    metrics: {
      swapRate: 3,
      queueLength: 12,
      chargedBatteries: 2,
      chargerUptime: 75.0,
      errorFrequency: 5,
    },
    lastUpdate: new Date().toISOString(),
    coordinates: { lat: 41.8781, lng: -87.6298 },
  },
  {
    id: 'station-3',
    name: 'Boston Harbor',
    location: 'Boston, Massachusetts',
    status: 'normal',
    metrics: {
      swapRate: 15,
      queueLength: 1,
      chargedBatteries: 22,
      chargerUptime: 99.2,
      errorFrequency: 0,
    },
    lastUpdate: new Date().toISOString(),
    coordinates: { lat: 42.3601, lng: -71.0589 },
  },
  {
    id: 'station-4',
    name: 'Seattle Tech Park',
    location: 'Seattle, Washington',
    status: 'warning',
    metrics: {
      swapRate: 10,
      queueLength: 4,
      chargedBatteries: 8,
      chargerUptime: 88.7,
      errorFrequency: 3,
    },
    lastUpdate: new Date().toISOString(),
    coordinates: { lat: 47.6062, lng: -122.3321 },
  },
];

export const mockAlerts: Alert[] = [
  {
    id: 'alert-1',
    stationId: 'station-2',
    stationName: 'Chicago Loop',
    type: 'Multi-Failure',
    severity: 'critical',
    message: 'Multiple systems experiencing failures. Immediate attention required.',
    timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
    acknowledged: false,
  },
  {
    id: 'alert-2',
    stationId: 'station-1',
    stationName: 'LA Downtown',
    type: 'Congestion',
    severity: 'high',
    message: 'Queue length exceeds threshold. Consider driver rerouting.',
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    acknowledged: false,
  },
  {
    id: 'alert-3',
    stationId: 'station-4',
    stationName: 'Seattle Tech Park',
    type: 'Charger Downtime',
    severity: 'medium',
    message: 'Charger uptime below 90%. Maintenance recommended.',
    timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
    acknowledged: true,
  },
  {
    id: 'alert-4',
    stationId: 'station-2',
    stationName: 'Chicago Loop',
    type: 'Stockout Risk',
    severity: 'high',
    message: 'Battery inventory critically low with rising demand.',
    timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
    acknowledged: false,
  },
];

export const mockRecommendations: Recommendation[] = [
  {
    id: 'rec-1',
    stationId: 'station-2',
    action: 'Escalate to Manager',
    reason: 'Multi-failure scenario detected with queue congestion and low battery inventory.',
    impact: 'Prevents service outage affecting 50+ drivers in the next hour.',
    confidence: 95,
    priority: 'high',
  },
  {
    id: 'rec-2',
    stationId: 'station-1',
    action: 'Reroute Drivers',
    reason: 'Queue length of 6 exceeds optimal threshold of 5.',
    impact: 'Reduces average wait time from 25 min to 10 min.',
    confidence: 87,
    priority: 'medium',
  },
  {
    id: 'rec-3',
    stationId: 'station-4',
    action: 'Create Maintenance Ticket',
    reason: 'Charger uptime at 88.7%, below the 90% threshold.',
    impact: 'Prevents potential charger failure affecting 30 daily swaps.',
    confidence: 82,
    priority: 'medium',
  },
  {
    id: 'rec-4',
    stationId: 'station-2',
    action: 'Inventory Rebalance',
    reason: 'Only 2 charged batteries remaining with 12 drivers in queue.',
    impact: 'Restores service capacity within 45 minutes.',
    confidence: 91,
    priority: 'high',
  },
];

export const generateMockSignal = (stationId: string): Signal => ({
  id: `signal-${Date.now()}`,
  stationId,
  signalType: ['swap_complete', 'battery_charged', 'error_log', 'queue_update'][
    Math.floor(Math.random() * 4)
  ],
  data: {
    value: Math.floor(Math.random() * 100),
    timestamp: new Date().toISOString(),
  },
  timestamp: new Date().toISOString(),
});

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'normal':
      return 'text-primary';
    case 'warning':
      return 'text-warning';
    case 'critical':
      return 'text-destructive';
    default:
      return 'text-muted-foreground';
  }
};

export const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'low':
      return 'bg-muted text-muted-foreground';
    case 'medium':
      return 'bg-warning/20 text-warning border-warning/30';
    case 'high':
      return 'bg-destructive/20 text-destructive border-destructive/30';
    case 'critical':
      return 'bg-destructive text-destructive-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
};
