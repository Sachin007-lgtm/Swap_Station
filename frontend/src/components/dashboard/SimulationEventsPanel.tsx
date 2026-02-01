import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Bell, ChevronDown, Route, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { cn } from '@/lib/utils';

interface SimulationEvent {
  id: string;
  timestamp: string;
  mode: string;
  drivers?: Array<{ driver_id: string }>;
  driver?: { driver_id: string; phone: string };
  station_from: string | { id: string; name: string; city: string };
  station_to: string | { id: string; name: string; city: string; lat?: number; lng?: number };
  distance_km?: number;
  expected_wait_time_min?: number;
  reason?: string;
  confidence?: number;
}

interface SimulationEventsPanelProps {
  onCountChange?: (count: number) => void;
  forceOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  variant?: 'inline' | 'sidebar';
}

export const SimulationEventsPanel = ({
  onCountChange,
  forceOpen,
  onOpenChange,
  onClose,
  variant = 'inline',
}: SimulationEventsPanelProps) => {
  const [events, setEvents] = useState<SimulationEvent[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/reroute-driver/history`);
      if (response.ok) {
        const data = await response.json();
        const nextEvents = (data.history || []).reverse();
        setEvents(nextEvents); // Most recent first
        onCountChange?.(nextEvents.length);
        setLastUpdated(new Date());
      } else {
        onCountChange?.(0);
      }
    } catch (error) {
      console.error('Error fetching simulation events:', error);
      onCountChange?.(0);
    }
  };

  const clearEvents = async () => {
    try {
      setClearing(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/reroute-driver/history`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setEvents([]);
        onCountChange?.(0);
      }
    } catch (error) {
      console.error('Error clearing simulation events:', error);
    } finally {
      setClearing(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    // Refresh every 3 seconds
    const interval = setInterval(fetchEvents, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof forceOpen === 'boolean') {
      setIsOpen(forceOpen);
    }
  }, [forceOpen]);

  const renderEvents = () => {
    if (events.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-orange-500/20 blur-xl"></div>
            <div className="relative p-6 rounded-2xl bg-gradient-to-br from-amber-100/50 to-orange-100/50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200/50 dark:border-amber-800/50">
              <Route className="w-16 h-16 text-amber-500/70" strokeWidth={1.5} />
            </div>
          </div>
          <h4 className="text-lg font-semibold text-foreground mb-2">No Notifications Yet</h4>
          <p className="text-sm text-muted-foreground max-w-xs">
            Reroute events will appear here when drivers are redirected to different stations
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4 h-full overflow-y-auto px-6 py-4 scrollbar-thin scrollbar-thumb-gray-200">
        {events.map((event, idx) => {
          const drivers = event.mode === 'simulation' ? event.drivers || [] : [event.driver || {}];
          const driverIds = drivers
            .map((driver: any) => driver?.driver_id)
            .filter(Boolean) as string[];
          const visibleDrivers = driverIds.slice(0, 3);
          const extraDrivers = driverIds.length - visibleDrivers.length;
          const stationMap: { [key: string]: string } = {
            'station-0': 'ST_100',
            'station-1': 'ST_101',
            'station-2': 'ST_102',
            'station-3': 'ST_103',
            'station-4': 'ST_104',
          };

          // Extract from station ID
          const fromStationId = typeof event.station_from === 'string' ? event.station_from : event.station_from?.id;
          const fromStationName = typeof event.station_from === 'object' ? event.station_from?.name : null;
          const fromStation = fromStationName || stationMap[fromStationId] || (fromStationId ? fromStationId.toUpperCase() : 'UNKNOWN');

          // Handle station_to being either string or object with location
          const targetStationId = typeof event.station_to === 'string'
            ? event.station_to
            : event.station_to?.id;
          const targetStationName = typeof event.station_to === 'object' ? event.station_to?.name : null;
          const targetStation = targetStationName || stationMap[targetStationId] || (targetStationId ? targetStationId.toUpperCase() : 'UNKNOWN');

          const isLiveDemo = event.mode === 'live_demo';

          return (
            <div
              key={idx}
              className="group bg-white rounded-[1.5rem] border-none shadow-[0_2px_10px_-2px_rgba(0,0,0,0.05)] transition-all duration-200 hover:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.08)] p-5"
            >
              <div className="flex items-start gap-4">
                {/* Icon on left */}
                <div className={cn(
                  "flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center mt-1",
                  isLiveDemo ? "bg-amber-50" : "bg-blue-50"
                )}>
                  {event.mode === 'simulation' ? (
                    <Route className={cn("w-6 h-6", isLiveDemo ? "text-amber-500" : "text-blue-500")} />
                  ) : (
                    <Route className={cn("w-6 h-6", isLiveDemo ? "text-amber-500" : "text-blue-500")} />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Title */}
                  <div className="font-bold text-foreground mb-1 text-base">
                    Reroute: <span className={isLiveDemo ? 'text-amber-600' : 'text-blue-600'}>{fromStation}</span> → <span className={isLiveDemo ? 'text-amber-600' : 'text-blue-600'}>{targetStation}</span>
                  </div>

                  {/* Description */}
                  <div className="text-sm text-gray-500 space-y-1.5 font-medium">
                    {/* Driver info */}
                    {driverIds.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="bg-gray-100 px-2 py-0.5 rounded-md text-xs text-gray-700">Driver {visibleDrivers[0]}</span>
                        {extraDrivers > 0 && <span className="text-xs">+{extraDrivers} others</span>}
                      </div>
                    )}

                    {/* Trip details */}
                    {(event.distance_km || event.expected_wait_time_min) && (
                      <div className="flex items-center gap-2 text-xs">
                        {event.distance_km && <span>{event.distance_km} km</span>}
                        {event.distance_km && event.expected_wait_time_min && <span className="text-gray-300">•</span>}
                        {event.expected_wait_time_min && <span>~{event.expected_wait_time_min} min wait</span>}
                      </div>
                    )}

                    {/* Reason for live demo */}
                    {event.mode === 'live_demo' && event.reason && (
                      <div className="italic text-amber-600/80 text-xs bg-amber-50 px-3 py-2 rounded-xl">
                        "{event.reason}"
                      </div>
                    )}
                  </div>
                </div>

                {/* Timestamp on right */}
                <div className="flex-shrink-0 text-right">
                  <div className="text-xs font-semibold text-gray-400">
                    {new Date(event.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (variant === 'inline') {
    // Only show inline panel if there are events
    if (events.length === 0) {
      return null;
    }

    return (
      <Card className="bg-gradient-to-br from-muted/50 to-muted/30">
        <Button
          onClick={() => {
            const nextOpen = !isOpen;
            setIsOpen(nextOpen);
            onOpenChange?.(nextOpen);
          }}
          variant="ghost"
          className="w-full justify-between p-6 h-auto hover:bg-muted/50"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900">
                <Bell className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              {events.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {events.length}
                </span>
              )}
            </div>
            <div className="text-left">
              <h3 className="text-lg font-semibold">Reroute Notifications</h3>
              <p className="text-xs text-muted-foreground">{events.length} active event{events.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <ChevronDown
            className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </Button>

        {isOpen && <div className="border-t px-6 pb-6">{renderEvents()}</div>}
      </Card>
    );
  }

  const simCount = events.filter((event) => event.mode === 'simulation').length;
  const liveCount = events.filter((event) => event.mode !== 'simulation').length;

  return (
    <div className="h-full flex flex-col bg-white shadow-2xl border-l border-border">
      {/* Header */}
      <div className="p-6 pb-4 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/20">
              <Route className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                Reroute Notifications
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Real-time driver rerouting events</p>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-destructive/10">
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="bg-gradient-to-br from-background/60 to-background/40 backdrop-blur-sm rounded-lg p-3 border border-border/50">
            <div className="text-2xl font-bold text-foreground">{events.length}</div>
            <div className="text-xs text-muted-foreground">Total Events</div>
          </div>
          <div className="bg-gradient-to-br from-secondary/60 to-secondary/40 backdrop-blur-sm rounded-lg p-3 border border-border/50">
            <div className="text-2xl font-bold text-foreground">{simCount}</div>
            <div className="text-xs text-muted-foreground">Simulation</div>
          </div>
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-sm rounded-lg p-3 border border-border/50">
            <div className="text-2xl font-bold text-foreground">{liveCount}</div>
            <div className="text-xs text-muted-foreground">Live Demo</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/30">
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Waiting for updates…'}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={events.length === 0 || clearing}
            onClick={clearEvents}
            className="h-8 hover:bg-destructive/10 hover:text-destructive"
          >
            {clearing ? 'Clearing…' : 'Clear All'}
          </Button>
        </div>
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-hidden p-6">
        {renderEvents()}
      </div>
    </div>
  );
};
