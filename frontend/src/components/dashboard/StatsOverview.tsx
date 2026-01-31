import { ArrowUpRight, ArrowDownRight, Zap, Users, Battery, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Station } from '@/types/station';

interface StatsOverviewProps {
  stations: Station[];
}

export const StatsOverview = ({ stations = [] }: StatsOverviewProps) => {
  // Calculate aggregate stats
  const totalSwaps = stations.reduce((acc, s) => acc + s.metrics.swapRate, 0);
  const totalQueue = stations.reduce((acc, s) => acc + s.metrics.queueLength, 0);
  const avgUptime = stations.length > 0
    ? stations.reduce((acc, s) => acc + s.metrics.chargerUptime, 0) / stations.length
    : 0;
  const totalErrors = stations.reduce((acc, s) => acc + s.metrics.errorFrequency, 0);

  const stats = [
    {
      label: 'Total Swaps',
      value: totalSwaps.toLocaleString(),
      change: '+12.5%',
      trend: 'up',
      icon: Zap,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Queue Length',
      value: totalQueue.toString(),
      change: '-2.4%',
      trend: 'down',
      icon: Users,
      color: 'text-secondary',
      bg: 'bg-secondary/10',
    },
    {
      label: 'Avg Uptime',
      value: `${avgUptime.toFixed(1)}%`,
      change: '+0.8%',
      trend: 'up',
      icon: Activity,
      color: 'text-accent',
      bg: 'bg-accent/10',
    },
    {
      label: 'Active Errors',
      value: totalErrors.toString(),
      change: '-5%',
      trend: 'down',
      icon: Battery,
      color: 'text-destructive',
      bg: 'bg-destructive/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 flex flex-col justify-between h-[140px] relative overflow-hidden group hover:-translate-y-1 hover:shadow-md transition-all duration-300"
        >
          <div className="flex justify-between items-start">
            <div className={cn("p-2.5 rounded-xl", stat.bg)}>
              <stat.icon className={cn("w-5 h-5", stat.color)} />
            </div>
            <div className={cn(
              "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
              stat.trend === 'up' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
            )}>
              {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {stat.change}
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-bold text-gray-900 tracking-tight mb-0.5">
              {stat.value}
            </h3>
            <p className="text-gray-600 font-medium text-xs">
              {stat.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
