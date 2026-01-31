import { Battery, Users, Zap, AlertCircle, MapPin, ChevronRight, Activity } from 'lucide-react';
import { Station } from '@/types/station';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface StationCardProps {
  station: Station;
  onClick: () => void;
}

export const StationCard = ({ station, onClick }: StationCardProps) => {
  const isCritical = station.status === 'critical';
  const isWarning = station.status === 'warning';

  return (
    <div
      onClick={onClick}
      className={cn(
        'group bg-white border border-gray-100 shadow-sm rounded-2xl p-5 cursor-pointer relative overflow-hidden hover:shadow-md transition-all',
        isCritical && 'ring-2 ring-red-200'
      )}
    >
      {/* Decorative background blob for status */}
      {isCritical && (
        <div className="absolute -right-10 -top-10 w-24 h-24 bg-red-50 rounded-full blur-3xl" />
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
            isCritical ? "bg-red-50 text-red-600" :
              isWarning ? "bg-amber-50 text-amber-600" : "bg-green-50 text-green-600"
          )}>
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 group-hover:text-primary transition-colors">
              {station.name}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-0.5">
              <MapPin className="w-3 h-3" />
              {station.location}
            </div>
          </div>
        </div>

        <Badge
          variant="secondary"
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-semibold",
            isCritical ? "bg-red-50 text-red-600 hover:bg-red-100" :
              "bg-blue-50 text-blue-600 hover:bg-blue-100"
          )}
        >
          {station.status}
        </Badge>
      </div>

      {/* Description-like stats area */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="bg-blue-50 rounded-full px-3 py-1 text-[11px] font-semibold text-blue-600 flex items-center gap-1">
          <Zap className="w-2.5 h-2.5" />
          {station.metrics.swapRate} Swaps
        </div>
        <div className="bg-blue-50 rounded-full px-3 py-1 text-[11px] font-semibold text-blue-600 flex items-center gap-1">
          <Users className="w-2.5 h-2.5" />
          {station.metrics.queueLength} Wait
        </div>
        <div className="bg-blue-50 rounded-full px-3 py-1 text-[11px] font-semibold text-blue-600 flex items-center gap-1">
          <Battery className="w-2.5 h-2.5" />
          {station.metrics.chargedBatteries} Rdy
        </div>
      </div>

      {/* Bottom Action Area */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          {station.metrics.queueLength > 5 && (
            <div className="flex items-center text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
              <Activity className="w-3 h-3 mr-1" />
              High Traffic
            </div>
          )}
          {station.metrics.errorFrequency > 0 && (
            <div className="flex items-center text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-md">
              <AlertCircle className="w-3 h-3 mr-1" />
              Errors
            </div>
          )}
        </div>

        <Button
          size="icon"
          variant="ghost"
          className="rounded-full bg-gray-50 hover:bg-primary hover:text-white transition-colors w-8 h-8"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
