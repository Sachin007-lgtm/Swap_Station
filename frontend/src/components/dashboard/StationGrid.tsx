import { Station } from '@/types/station';
import { StationCard } from './StationCard';

interface StationGridProps {
  stations: Station[];
  onStationClick: (station: Station) => void;
}

export const StationGrid = ({ stations, onStationClick }: StationGridProps) => {
  // Sort stations: critical first, then warning, then normal
  const sortedStations = [...stations].sort((a, b) => {
    const priority = { critical: 0, warning: 1, normal: 2 };
    return priority[a.status] - priority[b.status];
  });

  const statusCounts = {
    critical: stations.filter(s => s.status === 'critical').length,
    warning: stations.filter(s => s.status === 'warning').length,
    normal: stations.filter(s => s.status === 'normal').length,
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Station Overview</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Monitoring {stations.length} locations across Delhi-NCR
            </p>
          </div>
          <div className="flex items-center gap-3">
            {statusCounts.critical > 0 && (
              <div className="flex items-center gap-1.5 text-xs">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="font-semibold text-gray-600">{statusCounts.critical} Critical</span>
              </div>
            )}
            {statusCounts.warning > 0 && (
              <div className="flex items-center gap-1.5 text-xs">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="font-semibold text-gray-600">{statusCounts.warning} Warning</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-xs">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="font-semibold text-gray-600">{statusCounts.normal} Healthy</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedStations.map((station, index) => (
            <div
              key={station.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <StationCard
                station={station}
                onClick={() => onStationClick(station)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
