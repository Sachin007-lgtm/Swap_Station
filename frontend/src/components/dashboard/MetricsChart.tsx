import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Station } from '@/types/station';
import { Button } from '@/components/ui/button';
import { ChevronDown, MoreHorizontal } from 'lucide-react';

interface MetricsChartProps {
  stations: Station[];
}

export const MetricsChart = ({ stations }: MetricsChartProps) => {
  const chartData = useMemo(() => {
    return stations.map((station) => ({
      name: station.name.split(' ')[0], // Short name
      value: station.metrics.swapRate,
      queue: station.metrics.queueLength,
    }));
  }, [stations]);

  // Find max value to highlight active bar
  const maxValue = Math.max(...chartData.map(d => d.value));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
      {/* Main Chart - "Income Tracker" Style */}
      <div className="lg:col-span-2 bg-white border border-gray-100 shadow-sm rounded-2xl p-5">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 rounded-xl">
              <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent rotate-45" />
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight text-gray-900">Station Analytics</h3>
              <p className="text-gray-600 text-sm">Real-time comparison: Swaps vs Queue</p>
            </div>
          </div>
          <Button variant="outline" className="rounded-full px-3 h-8 text-xs border-gray-300 bg-white hover:bg-gray-50 text-gray-700">
            This Week <ChevronDown className="w-3 h-3 ml-2" />
          </Button>
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barGap={4}>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 11, fontWeight: 500 }}
                dy={10}
              />
              <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white text-gray-900 p-3 rounded-xl text-xs font-medium shadow-xl border border-gray-200 min-w-[120px]">
                        <div className="mb-2 font-bold text-gray-900">{payload[0].payload.name}</div>
                        <div className="flex items-center justify-between gap-4 mb-1">
                          <span className="text-gray-600">Swaps</span>
                          <span className="font-bold text-primary">{payload[0].value}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-gray-600">Queue</span>
                          <span className="font-bold text-blue-600">{payload[1]?.value ?? 0}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="value" name="Swaps" fill="hsl(var(--primary))" radius={[4, 4, 4, 4]} barSize={12} />
              <Bar dataKey="queue" name="Queue" fill="#3b82f6" radius={[4, 4, 4, 4]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Side Panel - "Charger Uptime Analysis" */}
      <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 flex flex-col">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900">Charger Uptime Analysis</h3>
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 hover:bg-gray-100">
              <MoreHorizontal className="w-4 h-4 text-gray-600" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-green-50 rounded-xl p-3">
              <div className="text-xs text-gray-600 mb-1">Avg Uptime</div>
              <div className="text-xl font-bold text-green-600">94.2%</div>
            </div>
            <div className="bg-red-50 rounded-xl p-3">
              <div className="text-xs text-gray-600 mb-1">Min Uptime</div>
              <div className="text-xl font-bold text-red-500">78%</div>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="bg-gray-50 rounded-xl p-3 mb-4">
            <div className="text-xs text-gray-600 mb-2 font-medium">Status Distribution</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-green-400"></div>
                  <span className="text-xs text-gray-700">Excellent (&gt;95%)</span>
                </div>
                <span className="text-xs font-bold text-gray-900">5 stations</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-gray-300"></div>
                  <span className="text-xs text-gray-700">Normal (85-95%)</span>
                </div>
                <span className="text-xs font-bold text-gray-900">5 stations</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-red-400"></div>
                  <span className="text-xs text-gray-700">Critical (&lt;85%)</span>
                </div>
                <span className="text-xs font-bold text-gray-900">2 stations</span>
              </div>
            </div>
          </div>

          {/* Uptime by Station */}
          <div>
            <div className="text-xs text-gray-600 font-medium mb-3">Recent Performance</div>
            <div className="space-y-2">
              {[
                { name: 'Connaught', uptime: 98 },
                { name: 'Dwarka', uptime: 96 },
                { name: 'Noida', uptime: 94 },
                { name: 'Gurgaon', uptime: 89 },
                { name: 'Faridabad', uptime: 78 }
              ].map((station, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-20 text-xs text-gray-700 font-medium truncate">{station.name}</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${station.uptime < 85 ? 'bg-red-400' :
                          station.uptime > 95 ? 'bg-green-400' :
                            'bg-gray-400'
                        }`}
                      style={{ width: `${station.uptime}%` }}
                    />
                  </div>
                  <div className={`text-xs font-bold w-10 text-right ${station.uptime < 85 ? 'text-red-600' :
                      station.uptime > 95 ? 'text-green-600' :
                        'text-gray-700'
                    }`}>
                    {station.uptime}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
