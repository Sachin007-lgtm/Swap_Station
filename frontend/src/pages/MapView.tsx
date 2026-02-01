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
  RotateCcw,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icons Generator
const createStationIcon = (status: string) => {
  const color = status === 'critical' ? '#ef4444' : status === 'warning' ? '#f59e0b' : '#22c55e';

  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
      </div>
      ${status === 'critical' ? '<span style="position: absolute; top: -5px; right: -5px; width: 10px; height: 10px; background-color: #ef4444; border-radius: 50%; border: 2px solid white;"></span>' : ''}
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -20]
  });
};

interface MapViewProps {
  onBack: () => void;
}

// Component to handle map centering
function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
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
  const [mapCenter, setMapCenter] = useState<[number, number]>([28.6139, 77.2090]); // Delhi Center
  const [mapZoom, setMapZoom] = useState(11);

  const filteredStations = stations.filter(station => {
    const matchesSearch = station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      station.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Updated to allow "Zoom Only" (shouldOpenModal = false)
  const handleStationClick = (station: Station, shouldOpenModal = true) => {
    if (shouldOpenModal) {
      setSelectedStation(station);
    }

    if (station.coordinates?.lat && station.coordinates?.lng) {
      setMapCenter([station.coordinates.lat, station.coordinates.lng]);
      setMapZoom(14);
    }
  };

  const handleResetView = () => {
    setSearchQuery('');
    setSelectedState('');
    setSelectedArea('');
    setSelectedStation(null);
    setMapCenter([28.6139, 77.2090]);
    setMapZoom(11);
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Sidebar */}
      <div className="flex h-full">
        <aside className="w-80 bg-card border-r border-white/5 flex flex-col z-20 shadow-xl">
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
              onClick={handleResetView}
            >
              <RotateCcw className="w-4 h-4" />
              RESET VIEW
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
                  onClick={() => handleStationClick(station, true)}
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

        {/* Leaflet Map Area */}
        <main className="flex-1 relative bg-slate-50">
          <MapContainer
            center={[28.6139, 77.2090]}
            zoom={11}
            scrollWheelZoom={true}
            className="w-full h-full outline-none"
          >
            <ChangeView center={mapCenter} zoom={mapZoom} />

            {/* CartoDB Positron (White/Light Theme) */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />

            {filteredStations.map((station) => (
              <Marker
                key={station.id}
                position={[station.coordinates?.lat || 28.6, station.coordinates?.lng || 77.2]}
                icon={createStationIcon(station.status)}
                eventHandlers={{
                  click: () => handleStationClick(station, false), // Zoom only
                }}
              >
                <Popup>
                  <div className="p-2 min-w-[200px]">
                    <h3 className="font-bold text-lg mb-1">{station.name}</h3>
                    <p className="text-xs text-gray-500 mb-2">{station.location}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-gray-100 p-1 rounded text-center">
                        <span className="block font-bold">{station.metrics.swapRate}</span>
                        <span className="text-[10px] text-gray-500">Swaps/Hr</span>
                      </div>
                      <div className="bg-gray-100 p-1 rounded text-center">
                        <span className="block font-bold">{station.metrics.queueLength}</span>
                        <span className="text-[10px] text-gray-500">Queue</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="w-full mt-3 h-8 text-xs"
                      onClick={() => setSelectedStation(station)}
                    >
                      View Details
                    </Button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </main>
      </div>

      {/* Station Detail Modal */}
      {selectedStation && (
        <StationDetail
          station={selectedStation}
          alerts={getAlertsByStation(selectedStation.id)}
          recommendations={getRecommendationsByStation(selectedStation.id)}
          onClose={() => {
            // Reset logic when closing details
            setSelectedStation(null);
            setMapCenter([28.6139, 77.2090]); // Pan back to Delhi
            setMapZoom(11); // Zoom out to see all
          }}
          onAcknowledge={acknowledgeAlert}
          onEvaluate={fetchRecommendations}
        />
      )}
    </div>
  );
};
