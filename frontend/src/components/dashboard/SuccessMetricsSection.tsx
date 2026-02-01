import { useState, useEffect } from 'react';
import { TrendingDown, Package, Activity } from 'lucide-react';

const API_URL = 'http://localhost:5000';

interface SuccessMetricsData {
  queueTimeReduction: number | null;
  stockoutReduction: number | null;
  uptimeImprovement: number | null;
  message?: string;
  current?: {
    avgQueueTime: number;
    stockoutCount: number;
    avgUptime: number;
  };
  snapshotsCount?: number;
  period?: string;
}

export const SuccessMetricsSection = () => {
  const [data, setData] = useState<SuccessMetricsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch(`${API_URL}/api/success-metrics`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !data) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Success Metrics</h3>
        <p className="text-sm text-gray-500">{data?.message || 'Loading...'}</p>
      </div>
    );
  }

  const cards = [
    {
      label: 'Queue time reduction',
      value: data.queueTimeReduction != null ? `${data.queueTimeReduction}%` : '—',
      icon: TrendingDown,
      good: data.queueTimeReduction != null && data.queueTimeReduction > 0,
      sub: data.current != null ? `Current avg queue: ${data.current.avgQueueTime}` : undefined,
    },
    {
      label: 'Stockout reduction',
      value: data.stockoutReduction != null ? `${data.stockoutReduction}%` : '—',
      icon: Package,
      good: data.stockoutReduction != null && data.stockoutReduction >= 0,
      sub: data.current != null ? `At-risk stations: ${data.current.stockoutCount}` : undefined,
    },
    {
      label: 'Uptime improvement',
      value: data.uptimeImprovement != null ? `+${data.uptimeImprovement}%` : '—',
      icon: Activity,
      good: data.uptimeImprovement != null && data.uptimeImprovement > 0,
      sub: data.current != null ? `Current avg uptime: ${data.current.avgUptime}%` : undefined,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Success Metrics</h3>
        {data.period && (
          <span className="text-xs text-gray-500">{data.period}</span>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100"
          >
            <div className={`p-2 rounded-lg ${card.good ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
              <card.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-sm font-medium text-gray-600">{card.label}</p>
              {card.sub && <p className="text-xs text-gray-500 mt-0.5">{card.sub}</p>}
            </div>
          </div>
        ))}
      </div>
      {data.snapshotsCount != null && data.snapshotsCount < 4 && (
        <p className="text-xs text-amber-600 mt-2">Collecting baseline data ({data.snapshotsCount}/4 snapshots)</p>
      )}
    </div>
  );
};
