import 'leaflet/dist/leaflet.css';
import { useEffect, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L, { LatLngExpression, Map as LeafletMap } from 'leaflet';
import { Station } from '@/types/station';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Navigation } from 'lucide-react';

// Fix leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Create custom icons based on status
const createStatusIcon = (status: 'normal' | 'warning' | 'critical') => {
  const colors = {
    normal: '#10b981',
    warning: '#f59e0b',
    critical: '#ef4444',
  };

  return L.divIcon({
    className: 'custom-station-marker',
    html: `
      <div style="
        background-color: ${colors[status]};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 3px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        cursor: pointer;
        animation: pulse 2s infinite;
      ">
        <div style="
          width: 8px;
          height: 8px;
          background-color: white;
          border-radius: 50%;
        "></div>
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { box-shadow: 0 4px 12px rgba(0,0,0,0.3), 0 0 0 0 ${colors[status]}40; }
          50% { box-shadow: 0 4px 12px rgba(0,0,0,0.3), 0 0 0 8px transparent; }
        }
      </style>
    `,
    iconSize: [32, 32],
    popupAnchor: [0, -16],
  });
};

// Helper to calculate distance between two points
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 3959; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

interface MapCenterProps {
  lat: number;
  lng: number;
  zoom?: number;
}

const MapCenter = ({ lat, lng, zoom = 11 }: MapCenterProps) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], zoom);
  }, [lat, lng, zoom, map]);
  return null;
};

interface StationMapProps {
  stations: Station[];
  onStationSelect: (station: Station) => void;
  userLocation?: [number, number];
}

export const StationMap = ({ stations, onStationSelect, userLocation }: StationMapProps) => {
  const mapRef = useRef<LeafletMap>(null);
  const [nearestStation, setNearestStation] = useState<Station | null>(null);
  const [userLoc, setUserLoc] = useState<[number, number] | null>(userLocation || null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([40.7128, -74.006]); // NYC default

  // Get user location on mount
  useEffect(() => {
    if (!userLoc && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc: [number, number] = [position.coords.latitude, position.coords.longitude];
          setUserLoc(loc);
          setMapCenter(loc);
        },
        () => {
          // Fallback to NYC if geolocation fails
          setMapCenter([40.7128, -74.006]);
        }
      );
    }
  }, [userLoc]);

  // Calculate nearest station
  useEffect(() => {
    if (userLoc && stations.length > 0) {
      let nearest = stations[0];
      let minDistance = calculateDistance(
        userLoc[0],
        userLoc[1],
        stations[0].coordinates.lat,
        stations[0].coordinates.lng
      );

      for (const station of stations) {
        const distance = calculateDistance(
          userLoc[0],
          userLoc[1],
          station.coordinates.lat,
          station.coordinates.lng
        );
        if (distance < minDistance) {
          minDistance = distance;
          nearest = station;
        }
      }
      setNearestStation(nearest);
    }
  }, [userLoc, stations]);

  const handleLocate = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc: [number, number] = [position.coords.latitude, position.coords.longitude];
          setUserLoc(loc);
          setMapCenter(loc);
        },
        () => alert('Unable to get your location')
      );
    }
  }, []);

  return (
    <div className="space-y-4">
      {/* Map */}
      <div className="glass-card border border-border/50 rounded-lg overflow-hidden h-[500px] relative">
        <MapContainer 
          {...({ center: mapCenter, zoom: 11 } as any)}
          className="h-full w-full"
          ref={mapRef}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Initialize map view */}
          <MapCenter lat={mapCenter[0]} lng={mapCenter[1]} zoom={11} />

          {/* User location marker */}
          {userLoc && (
            <Marker position={userLoc}>
              <Popup>
                <div className="text-sm font-semibold">Your Location</div>
              </Popup>
            </Marker>
          )}

          {/* Station markers */}
          {stations.map((station) => (
            <Marker
              key={station.id}
              position={[station.coordinates.lat, station.coordinates.lng]}
              eventHandlers={{
                click: () => onStationSelect(station),
              }}
            >
              <Popup>
                <div className="w-48 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm">{station.name}</h3>
                    <Badge
                      className={`capitalize ${
                        station.status === 'normal'
                          ? 'bg-primary text-white'
                          : station.status === 'warning'
                          ? 'bg-warning text-black'
                          : 'bg-destructive text-white'
                      }`}
                    >
                      {station.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{station.location}</p>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Queue:</span>
                      <p className="font-semibold">{station.metrics.queueLength}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Batteries:</span>
                      <p className="font-semibold">{station.metrics.chargedBatteries}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Uptime:</span>
                      <p className="font-semibold">{station.metrics.chargerUptime.toFixed(0)}%</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Swap Rate (per 15 min):</span>
                      <p className="font-semibold">{station.metrics.swapRate}</p>
                    </div>
                  </div>

                  <Button
                    onClick={() => onStationSelect(station)}
                    className="w-full h-8 text-xs"
                    size="sm"
                  >
                    View Details
                  </Button>
                </div>
              </Popup>
            </Marker>
          ))}

          <MapCenter lat={mapCenter[0]} lng={mapCenter[1]} zoom={11} />
        </MapContainer>

        {/* Locate button */}
        <Button
          onClick={handleLocate}
          size="icon"
          className="absolute bottom-4 right-4 z-20 rounded-full shadow-lg"
          title="Find my location"
        >
          <Navigation className="w-4 h-4" />
        </Button>
      </div>

      {/* Nearest Station Card */}
      {nearestStation && userLoc && (
        <div className="glass-card border border-border/50 p-4 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">📍 Nearest Station</h3>
            <Badge
              className={`capitalize ${
                nearestStation.status === 'normal'
                  ? 'bg-primary text-white'
                  : nearestStation.status === 'warning'
                  ? 'bg-warning text-black'
                  : 'bg-destructive text-white'
              }`}
            >
              {nearestStation.status}
            </Badge>
          </div>

          <div className="space-y-2">
            <div>
              <p className="font-bold text-lg">{nearestStation.name}</p>
              <p className="text-sm text-muted-foreground">{nearestStation.location}</p>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-primary">
                {calculateDistance(
                  userLoc[0],
                  userLoc[1],
                  nearestStation.coordinates.lat,
                  nearestStation.coordinates.lng
                ).toFixed(1)}{' '}
                miles away
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-xs">
              <div className="bg-background/50 p-2 rounded">
                <p className="text-muted-foreground">Queue</p>
                <p className="font-bold text-lg">{nearestStation.metrics.queueLength}</p>
              </div>
              <div className="bg-background/50 p-2 rounded">
                <p className="text-muted-foreground">Batteries</p>
                <p className="font-bold text-lg">{nearestStation.metrics.chargedBatteries}</p>
              </div>
              <div className="bg-background/50 p-2 rounded">
                <p className="text-muted-foreground">Uptime</p>
                <p className="font-bold text-lg">{nearestStation.metrics.chargerUptime.toFixed(0)}%</p>
              </div>
              <div className="bg-background/50 p-2 rounded">
                <p className="text-muted-foreground">Swaps/hr</p>
                <p className="font-bold text-lg">{nearestStation.metrics.swapRate}</p>
              </div>
            </div>

            <Button
              onClick={() => onStationSelect(nearestStation)}
              className="w-full"
              size="sm"
            >
              Open Details
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
