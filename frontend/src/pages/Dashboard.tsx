import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Station } from '@/types/station';
import { useBackendData } from '@/hooks/useBackendData';
import { useCopilotMode } from '@/contexts/CopilotModeContext';
import { Header } from '@/components/dashboard/Header';
import { StatsOverview } from '@/components/dashboard/StatsOverview';
import { SuccessMetricsSection } from '@/components/dashboard/SuccessMetricsSection';
import { StationGrid } from '@/components/dashboard/StationGrid';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
import { SimulationEventsPanel } from '@/components/dashboard/SimulationEventsPanel';
import { MaintenancePanel } from '@/components/dashboard/MaintenancePanel';
import { StationDetail } from '@/components/dashboard/StationDetail';
import { MetricsChart } from '@/components/dashboard/MetricsChart';
import { ChatbotPanel } from '@/components/dashboard/ChatbotPanel';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Map as MapIcon, CheckCircle, Bell, Sparkles } from 'lucide-react';
import { Toaster, toast } from 'sonner'; // Exploring using sonner if installed, but stick to manual for now

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
  const [showChat, setShowChat] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { copilotMode, setCopilotMode } = useCopilotMode();

  // Toast Notification State (Manual Implementation for guarantees)
  const [toastMessage, setToastMessage] = useState<{ title: string, msg: string } | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Action Wrapper for UI Feedback
  const handleApproveRecommendation = async (id: string, mode: 'live_demo' | 'simulation') => {
    console.log('🔘 Approve Clicked for:', id);
    try {
      // 1. Show "Sending..." state? 
      // For now, just trigger backend
      const result = await approveRecommendation(id, mode);

      // 2. Show Success Toast
      console.log('✅ Action Success, showing toast');
      const actionName = result?.action || 'Action';
      setToastMessage({
        title: 'Action Executed Successfully',
        msg: `${actionName} command has been processed via ${mode === 'live_demo' ? 'SMS' : 'Simulation'}.`
      });

      // 4. Auto-hide after 4 seconds
      setTimeout(() => setToastMessage(null), 4000);

    } catch (err) {
      console.error('❌ Approval failed', err);
      setToastMessage({
        title: 'Action Failed',
        msg: 'Could not communicate with server.'
      });
    }
  };

  const handleScrollToStations = () => {
    const element = document.getElementById('stations-grid');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col relative">
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
        onStationsClick={handleScrollToStations}
        onChatClick={() => setShowChat(true)}
        copilotMode={copilotMode}
        onCopilotModeChange={setCopilotMode}
      />

      {/* Analytics Chatbot */}
      <ChatbotPanel isOpen={showChat} onClose={() => setShowChat(false)} />

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

          {/* Copilot mode bar */}
          <div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-sm font-semibold text-gray-700">AI Copilot mode</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCopilotMode('conservative')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${copilotMode === 'conservative' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Conservative
              </button>
              <button
                type="button"
                onClick={() => setCopilotMode('aggressive')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${copilotMode === 'aggressive' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Aggressive
              </button>
            </div>
            <p className="text-xs text-gray-500">
              {copilotMode === 'conservative' ? 'Recommend only — ops approve each action' : 'Auto-execute on high risk'}
            </p>
          </div>

          <StatsOverview stations={stations} />

          <SuccessMetricsSection />

          <div className="grid grid-cols-1 gap-8">
            <MetricsChart stations={stations} />
          </div>

          <div id="stations-grid">
            <StationGrid
              stations={stations}
              onStationClick={setSelectedStation}
            />
          </div>
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

      {/* Detail Modal */}
      {selectedStation && (
        <StationDetail
          station={selectedStation}
          alerts={getAlertsByStation(selectedStation.id)}
          recommendations={getRecommendationsByStation(selectedStation.id, copilotMode)}
          onClose={() => setSelectedStation(null)}
          onAcknowledge={acknowledgeAlert}
          onEvaluate={(stationId) => fetchRecommendations(stationId, copilotMode)}
          onApprove={handleApproveRecommendation}
          copilotMode={copilotMode}
          onCopilotModeChange={setCopilotMode}
        />
      )}

      {/* Custom Toast Notification - Force Highest Z-Index */}
      {toastMessage && (
        <div className="fixed top-8 right-8 z-[100000] animate-in slide-in-from-top-5 fade-in duration-300">
          <div className="bg-slate-900/95 text-white p-4 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/20 backdrop-blur-xl flex items-start gap-4 cursor-pointer min-w-[320px]" onClick={() => setToastMessage(null)}>
            <div className="bg-green-500/20 p-2 rounded-full mt-0.5">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white mb-1">{toastMessage.title}</h4>
              <p className="text-xs text-slate-300 leading-relaxed opacity-90">{toastMessage.msg}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
