export type StationStatus = 'normal' | 'warning' | 'critical';

export interface StationMetrics {
  swapRate: number;
  queueLength: number;
  chargedBatteries: number;
  chargerUptime: number;
  errorFrequency: number;
}

export interface Station {
  id: string;
  name: string;
  location: string;
  status: StationStatus;
  metrics: StationMetrics;
  lastUpdate: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface Alert {
  id: string;
  stationId: string;
  stationName: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface Recommendation {
  id: string;
  stationId: string;
  stationName: string;
  type: string;
  priority: 'low' | 'medium' | 'high';
  action: string;
  reason: string;
  expectedImpact: string;
  impact: string;
  confidence: number;
  timestamp: string;
  decisionId?: string;
  probableRootCause?: string;
  timeToStockoutMinutes?: number;
  /** Set when aggressive mode auto-executes: 'executed' | 'auto-execute-failed' */
  status?: string;
}

export interface Signal {
  id: string;
  stationId: string;
  signalType: string;
  data: Record<string, unknown>;
  timestamp: string;
}
