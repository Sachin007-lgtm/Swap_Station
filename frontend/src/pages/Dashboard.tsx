import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Station } from '@/types/station';
import { useBackendData } from '@/hooks/useBackendData';
import { Header } from '@/components/dashboard/Header';
import { StatsOverview } from '@/components/dashboard/StatsOverview';
import { StationGrid } from '@/components/dashboard/StationGrid';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
import { SimulationEventsPanel } from '@/components/dashboard/SimulationEventsPanel';
import { MaintenancePanel } from '@/components/dashboard/MaintenancePanel';
import { StationDetail } from '@/components/dashboard/StationDetail';
import { MetricsChart } from '@/components/dashboard/MetricsChart';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Map as MapIcon } from 'lucide-react';

export const Dashboard = () => {
  const navigate = useNavigate();
  const {
    stations,
    alerts,
    recommendations,
    isConnected,
    lastUpdate,
    stats,
    acknowledgeAlert,
    getAlertsByStation,
    getRecommendationsByStation,
    fetchRecommendations,
    approveRecommendation,
  } = useBackendData();

  const [showAlerts, setShowAlerts] = useState(false);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [rerouteCount, setRerouteCount] = useState(0);
  const [showReroutes, setShowReroutes] = useState(false);
  const [maintenanceCount, setMaintenanceCount] = useState(0);
  const [showMaintenance, setShowMaintenance] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header
        isScrolled={isScrolled}
        isConnected={isConnected}
        lastUpdate={lastUpdate}
        activeAlerts={stats.activeAlerts}
        rerouteCount={rerouteCount}
        maintenanceCount={maintenanceCount}
        onAlertsClick={() => setShowAlerts(!showAlerts)}
        onRerouteClick={() => setShowReroutes(!showReroutes)}
        onMaintenanceClick={() => setShowMaintenance(!showMaintenance)}
      />

      <main
        className={cn(
          'flex-1 p-8 transition-all duration-300',
          showAlerts && 'pr-[520px]'
        )}
      >
        <div className="max-w-[1600px] mx-auto space-y-8">
          {/* Dashboard Header */}
          <div className="flex items-center justify-between p-6 bg-white rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <h2 className="text-2xl font-bold text-gray-900">Operations Overview</h2>
              </div>
              <p className="text-sm text-gray-600 font-medium">Monitoring all swap stations in real-time</p>
            </div>
            <Button
              onClick={() => navigate('/map')}
              className="gap-2 h-11 px-6 rounded-xl shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground transform transition-all active:scale-95"
            >
              <MapIcon className="w-4 h-4" />
              <span className="font-semibold">Map View</span>
            </Button>
          </div>

          <StatsOverview stations={stations} />

          <div className="grid grid-cols-1 gap-8">
            <MetricsChart stations={stations} />
          </div>

          <StationGrid
            stations={stations}
            onStationClick={setSelectedStation}
          />
        </div>
      </main>

      {/* Sidebars */}
      <aside
        className={cn(
          'fixed right-0 top-0 h-full w-[520px] transition-transform duration-300 z-[60]',
          showAlerts ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <AlertsPanel
          alerts={alerts}
          onAcknowledge={acknowledgeAlert}
          onClose={() => setShowAlerts(false)}
        />
      </aside>

      {showReroutes && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70]" onClick={() => setShowReroutes(false)} />
      )}
      <aside className={cn(
        'fixed right-0 top-0 h-full w-[480px] transition-transform duration-300 z-[80] glass-card m-4 border border-white/20 shadow-2xl rounded-3xl overflow-hidden',
        showReroutes ? 'translate-x-0' : 'translate-x-[120%]'
      )}>
        <SimulationEventsPanel variant="sidebar" onClose={() => setShowReroutes(false)} onCountChange={setRerouteCount} />
      </aside>

      {showMaintenance && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70]" onClick={() => setShowMaintenance(false)} />
      )}
      <aside className={cn(
        'fixed right-0 top-0 h-full w-[480px] transition-transform duration-300 z-[80] glass-card m-4 border border-white/20 shadow-2xl rounded-3xl overflow-hidden',
        showMaintenance ? 'translate-x-0' : 'translate-x-[120%]'
      )}>
        <MaintenancePanel variant="sidebar" onClose={() => setShowMaintenance(false)} onCountChange={setMaintenanceCount} />
      </aside>

      {selectedStation && (
        <StationDetail
          station={selectedStation}
          alerts={getAlertsByStation(selectedStation.id)}
          recommendations={getRecommendationsByStation(selectedStation.id)}
          onClose={() => setSelectedStation(null)}
          onAcknowledge={acknowledgeAlert}
          onEvaluate={fetchRecommendations}
          onApprove={approveRecommendation}
        />
      )}
    </div>
  );
};
