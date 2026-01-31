import { useState } from 'react';
import { Station } from '@/types/station';
import { useBackendData } from '@/hooks/useBackendData';
import { StationDetail } from '@/components/dashboard/StationDetail';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Zap,
  MapPin,
  Navigation,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MapViewProps {
  onBack: () => void;
}

export const MapView = ({ onBack }: MapViewProps) => {
  const {
    stations,
    alerts,
    recommendations,
    isConnected,
    acknowledgeAlert,
    getAlertsByStation,
    getRecommendationsByStation,
    fetchRecommendations,
  } = useBackendData();

  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedArea, setSelectedArea] = useState('');

  const filteredStations = stations.filter(station => {
    const matchesSearch = station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      station.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Sidebar */}
      <div className="flex h-full">
        <aside className="w-80 bg-card border-r border-white/5 flex flex-col">
          {/* Logo & Title */}
          <div className="p-6 border-b border-white/5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Zap className="w-6 h-6 text-primary-foreground fill-current" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">STATION FINDER</h1>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Live Network Status</p>
              </div>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="p-6 space-y-4 border-b border-white/5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search stations, cities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <select
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground"
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
              >
                <option value="">State</option>
                <option value="delhi">Delhi</option>
                <option value="mumbai">Mumbai</option>
              </select>
              <select
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground"
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
              >
                <option value="">Area</option>
                <option value="north">North</option>
                <option value="south">South</option>
              </select>
            </div>

            <Button
              variant="outline"
              className="w-full gap-2 border-white/10 hover:bg-primary hover:text-primary-foreground"
            >
              <Navigation className="w-4 h-4" />
              USE MY LOCATION
            </Button>

            <Button
              variant="ghost"
              className="w-full gap-2 text-muted-foreground hover:text-foreground"
              onClick={() => {
                setSearchQuery('');
                setSelectedState('');
                setSelectedArea('');
              }}
            >
              <RotateCcw className="w-4 h-4" />
              RELOAD MAP VIEW
            </Button>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Results</h3>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {filteredStations.length} STATIONS
              </Badge>
            </div>

            <div className="space-y-3">
              {filteredStations.map((station) => (
                <div
                  key={station.id}
                  onClick={() => setSelectedStation(station)}
                  className={cn(
                    "p-4 rounded-xl border cursor-pointer transition-all",
                    selectedStation?.id === station.id
                      ? "bg-primary/10 border-primary"
                      : "bg-card border-white/5 hover:border-primary/50"
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-bold text-sm mb-1">{station.name}</h4>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {station.location}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-[10px] font-bold",
                        station.status === 'critical' && "bg-destructive/10 text-destructive",
                        station.status === 'warning' && "bg-accent/10 text-accent",
                        station.status === 'normal' && "bg-primary/10 text-primary"
                      )}
                    >
                      {station.metrics.swapRate}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {station.metrics.chargedBatteries < 3 ? 'GRID-PRIMARY' : 'SOLAR-HYBRID'}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-primary hover:bg-primary/10"
                    >
                      NAVIGATE <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Map Area */}
        <main className="flex-1 relative bg-muted/20">
          {/* Map Controls */}
          <div className="absolute top-6 right-6 z-10 flex flex-col gap-2">
            <Button
              size="icon"
              variant="secondary"
              className="w-10 h-10 rounded-xl bg-card border border-white/5 shadow-lg"
            >
              +
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="w-10 h-10 rounded-xl bg-card border border-white/5 shadow-lg"
            >
              −
            </Button>
          </div>

          {/* User Location Button */}
          <div className="absolute top-6 right-20 z-10">
            <Button
              size="icon"
              variant="secondary"
              className="w-10 h-10 rounded-full bg-card border border-white/5 shadow-lg"
            >
              <Navigation className="w-4 h-4" />
            </Button>
          </div>

          {/* Map Placeholder - In production, integrate Leaflet/Mapbox here */}
          <div className="w-full h-full bg-gradient-to-br from-muted/10 to-muted/30 flex items-center justify-center relative overflow-hidden">
            {/* Simulated Map Grid */}
            <div className="absolute inset-0 opacity-10">
              <div className="grid grid-cols-12 grid-rows-12 h-full w-full">
                {Array.from({ length: 144 }).map((_, i) => (
                  <div key={i} className="border border-white/5" />
                ))}
              </div>
            </div>

            {/* Station Markers */}
            {filteredStations.map((station, index) => (
              <div
                key={station.id}
                onClick={() => setSelectedStation(station)}
                className="absolute cursor-pointer group"
                style={{
                  left: `${20 + (index * 15) % 60}%`,
                  top: `${30 + (index * 20) % 40}%`,
                }}
              >
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all",
                  "border-4 border-background",
                  station.status === 'critical' && "bg-destructive",
                  station.status === 'warning' && "bg-accent",
                  station.status === 'normal' && "bg-primary",
                  selectedStation?.id === station.id && "scale-125 ring-4 ring-primary/50"
                )}>
                  <Zap className="w-6 h-6 text-white fill-current" />
                </div>

                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-popover text-popover-foreground px-3 py-2 rounded-lg text-xs font-medium shadow-xl border border-white/10 whitespace-nowrap">
                    <div className="font-bold">{station.name}</div>
                    <div className="text-muted-foreground">{station.metrics.swapRate} swaps</div>
                  </div>
                </div>
              </div>
            ))}

            {/* Map Attribution */}
            <div className="absolute bottom-4 right-4 text-xs text-muted-foreground bg-card/80 backdrop-blur-sm px-3 py-1 rounded-lg border border-white/5">
              © Leaflet | © OpenStreetMap
            </div>
          </div>
        </main>
      </div>

      {/* Station Detail Modal */}
      {selectedStation && (
        <StationDetail
          station={selectedStation}
          alerts={getAlertsByStation(selectedStation.id)}
          recommendations={getRecommendationsByStation(selectedStation.id)}
          onClose={() => setSelectedStation(null)}
          onAcknowledge={acknowledgeAlert}
          onEvaluate={fetchRecommendations}
        />
      )}
    </div>
  );
};
