import { useState } from 'react';
import {
  X,
  Battery,
  Users,
  Zap,
  AlertCircle,
  Clock,
  TrendingUp,
  Lightbulb,
  RefreshCw,
  CheckCircle,
  ArrowRight,
  MapPin,
} from 'lucide-react';
import { Station, Alert, Recommendation } from '@/types/station';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface StationDetailProps {
  station: Station;
  alerts: Alert[];
  recommendations: Recommendation[];
  onClose: () => void;
  onAcknowledge: (alertId: string) => void;
  // Accept any promise shape to avoid type mismatch with fetchRecommendations
  onEvaluate?: (stationId: string) => Promise<any>;
  onApprove?: (decisionId: string, mode: 'live_demo' | 'simulation') => Promise<any>;
}

export const StationDetail = ({
  station,
  alerts,
  recommendations,
  onClose,
  onAcknowledge,
  onEvaluate,
  onApprove,
}: StationDetailProps) => {
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rerouteMode, setRerouteMode] = useState<'simulation' | 'live_demo'>('live_demo');

  const handleEvaluate = async () => {
    setIsEvaluating(true);
    if (onEvaluate) {
      await onEvaluate(station.id);
    }
    setTimeout(() => setIsEvaluating(false), 2000);
  };

  const handleApprove = async (decisionId: string) => {
    if (!onApprove || !decisionId) return;

    setApprovingId(decisionId);
    try {
      await onApprove(decisionId, rerouteMode); // Use selected mode
      // Refresh recommendations after approval
      if (onEvaluate) {
        await onEvaluate(station.id);
      }
    } catch (error) {
      console.error('Error approving recommendation:', error);
    } finally {
      setApprovingId(null);
    }
  };

  const statusConfig = {
    normal: {
      color: 'text-primary',
      bg: 'bg-primary/10',
      border: 'border-primary/30',
      glow: 'shadow-[0_0_40px_hsl(142_76%_46%/0.15)]',
    },
    warning: {
      color: 'text-warning',
      bg: 'bg-warning/10',
      border: 'border-warning/30',
      glow: 'shadow-[0_0_40px_hsl(38_92%_50%/0.15)]',
    },
    critical: {
      color: 'text-destructive',
      bg: 'bg-destructive/10',
      border: 'border-destructive/30',
      glow: 'shadow-[0_0_40px_hsl(0_84%_60%/0.15)]',
    },
  };

  const config = statusConfig[station.status];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
      <div
        className={cn(
          'glass-card w-full max-w-4xl max-h-[90vh] overflow-hidden border-2 animate-scale-in',
          config.border,
          config.glow
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border/50">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div
                className={cn(
                  'w-3 h-3 rounded-full animate-pulse',
                  station.status === 'normal' && 'bg-primary',
                  station.status === 'warning' && 'bg-warning',
                  station.status === 'critical' && 'bg-destructive'
                )}
              />
              <h2 className="text-2xl font-bold">{station.name}</h2>
              <Badge className={cn('uppercase', config.bg, config.color)}>
                {station.status}
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{station.location}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleEvaluate}
              disabled={isEvaluating}
              className="gap-2"
            >
              <RefreshCw className={cn('w-4 h-4', isEvaluating && 'animate-spin')} />
              {isEvaluating ? 'Evaluating...' : 'Re-evaluate'}
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {/* Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <MetricCard
              icon={Zap}
              label="Swap Rate (per 15 min)"
              value={`${station.metrics.swapRate}`}
              trend={station.metrics.swapRate > 10 ? 'up' : 'down'}
            />
            <MetricCard
              icon={Users}
              label="Queue Length"
              value={station.metrics.queueLength.toString()}
              status={
                station.metrics.queueLength > 10
                  ? 'critical'
                  : station.metrics.queueLength > 5
                    ? 'warning'
                    : 'normal'
              }
            />
            <MetricCard
              icon={Battery}
              label="Charged Batteries"
              value={station.metrics.chargedBatteries.toString()}
              status={
                station.metrics.chargedBatteries < 3
                  ? 'critical'
                  : station.metrics.chargedBatteries < 6
                    ? 'warning'
                    : 'normal'
              }
            />
            <MetricCard
              icon={TrendingUp}
              label="Charger Uptime"
              value={`${station.metrics.chargerUptime.toFixed(1)}%`}
              status={
                station.metrics.chargerUptime < 80
                  ? 'critical'
                  : station.metrics.chargerUptime < 90
                    ? 'warning'
                    : 'normal'
              }
            />
            <MetricCard
              icon={AlertCircle}
              label="Error Frequency"
              value={station.metrics.errorFrequency.toString()}
              status={
                station.metrics.errorFrequency > 3
                  ? 'critical'
                  : station.metrics.errorFrequency > 0
                    ? 'warning'
                    : 'normal'
              }
            />
          </div>

          {/* Tabs */}
          <Tabs defaultValue="recommendations" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="recommendations" className="gap-2">
                <Lightbulb className="w-4 h-4" />
                AI Recommendations
                {recommendations.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {recommendations.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="alerts" className="gap-2">
                <AlertCircle className="w-4 h-4" />
                Alerts
                {alerts.filter((a) => !a.acknowledged).length > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {alerts.filter((a) => !a.acknowledged).length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="recommendations" className="space-y-4">
              {recommendations.length > 0 && (
                <div className="bg-muted/50 rounded-lg p-4 mb-4 flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Reroute Mode</Label>

                  </div>
                  <div className="flex items-center space-x-3">
                    <Label htmlFor="mode-toggle" className="text-sm font-medium cursor-pointer">
                      {rerouteMode === 'simulation' ? 'Simulation' : 'Live Demo'}
                    </Label>
                    <Switch
                      id="mode-toggle"
                      checked={rerouteMode === 'live_demo'}
                      onCheckedChange={(checked) => setRerouteMode(checked ? 'live_demo' : 'simulation')}
                    />
                  </div>
                </div>
              )}

              {recommendations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-primary/50" />
                  <p>No recommendations at this time</p>
                  <p className="text-sm">Station is operating optimally</p>
                </div>
              ) : (
                recommendations.map((rec, index) => (
                  <RecommendationCard
                    key={rec.id}
                    recommendation={rec}
                    index={index}
                    onApprove={handleApprove}
                    isApproving={approvingId === rec.decisionId}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="alerts" className="space-y-3">
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-primary/50" />
                  <p>No alerts for this station</p>
                </div>
              ) : (
                alerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onAcknowledge={() => onAcknowledge(alert.id)}
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

interface MetricCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  status?: 'normal' | 'warning' | 'critical';
  trend?: 'up' | 'down';
}

const MetricCard = ({ icon: Icon, label, value, status = 'normal', trend }: MetricCardProps) => {
  const statusColors = {
    normal: 'text-foreground',
    warning: 'text-warning',
    critical: 'text-destructive',
  };

  return (
    <div className="bg-card rounded-2xl p-4 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.2)] border border-white/5">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 rounded-lg bg-white/5 text-muted-foreground">
          <Icon className="w-4 h-4" />
        </div>
        {trend && (
          <TrendingUp
            className={cn(
              'w-4 h-4',
              trend === 'up' ? 'text-primary' : 'text-destructive rotate-180'
            )}
          />
        )}
      </div>
      <div className={cn('text-2xl font-bold tracking-tight', statusColors[status])}>
        {value}
      </div>
      <div className="text-sm font-medium text-muted-foreground">
        {label}
      </div>
    </div>
  );
};

interface RecommendationCardProps {
  recommendation: Recommendation;
  index: number;
  onApprove?: (decisionId: string) => void;
  isApproving?: boolean;
}

const RecommendationCard = ({ recommendation, index, onApprove, isApproving }: RecommendationCardProps) => {
  const priorityConfig = {
    low: { bg: 'bg-card', border: 'border-white/5', badge: 'bg-secondary/10 text-secondary', shadow: 'shadow-sm' },
    medium: { bg: 'bg-card', border: 'border-accent/20', badge: 'bg-accent/10 text-accent', shadow: 'shadow-md' },
    high: { bg: 'bg-card', border: 'border-primary/20', badge: 'bg-primary/10 text-primary', shadow: 'shadow-lg' },
  };

  const config = priorityConfig[recommendation.priority];

  return (
    <div
      className={cn(
        'p-6 rounded-[1.5rem] animate-fade-in-up border',
        config.bg,
        config.border,
        config.shadow
      )}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/20 text-primary">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-lg text-foreground">{recommendation.action}</h4>
            <Badge className={cn('mt-1 px-2 py-0.5 rounded-full font-semibold', config.badge)} variant="secondary">
              {recommendation.priority} priority
            </Badge>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Confidence</div>
          <div className="flex items-center gap-2">
            <Progress value={recommendation.confidence} className="w-20 h-2 bg-muted" />
            <span className="font-mono font-bold text-primary">
              {recommendation.confidence}%
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4 bg-muted/50 p-4 rounded-xl">
        <div>
          <div className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1">
            Why
          </div>
          <p className="text-sm font-medium text-foreground">{recommendation.reason}</p>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1">
            Expected Impact
          </div>
          <p className="text-sm font-bold text-primary">{recommendation.impact}</p>
        </div>
      </div>

      <div className="flex justify-end mt-5">
        <Button
          className="gap-2 rounded-full px-6 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-0.5"
          onClick={() => onApprove && recommendation.decisionId && onApprove(recommendation.decisionId)}
          disabled={isApproving || !recommendation.decisionId}
        >
          {isApproving ? 'Approving...' : 'Take Action'}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

interface AlertCardProps {
  alert: Alert;
  onAcknowledge: () => void;
}

const AlertCard = ({ alert, onAcknowledge }: AlertCardProps) => {
  const severityConfig = {
    low: { bg: 'bg-muted/50', border: 'border-muted' },
    medium: { bg: 'bg-warning/10', border: 'border-warning/30' },
    high: { bg: 'bg-destructive/10', border: 'border-destructive/30' },
    critical: { bg: 'bg-destructive/20', border: 'border-destructive/50' },
  };

  const config = severityConfig[alert.severity];

  return (
    <div
      className={cn(
        'p-4 rounded-lg border',
        config.bg,
        config.border,
        alert.acknowledged && 'opacity-50'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle
              className={cn(
                'w-4 h-4',
                alert.severity === 'critical' && 'text-destructive animate-pulse',
                alert.severity === 'high' && 'text-destructive',
                alert.severity === 'medium' && 'text-warning',
                alert.severity === 'low' && 'text-muted-foreground'
              )}
            />
            <span className="font-medium">{alert.type}</span>
          </div>
          <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
          </span>
        </div>
        {!alert.acknowledged && (
          <Button size="sm" variant="outline" onClick={onAcknowledge}>
            Acknowledge
          </Button>
        )}
        {alert.acknowledged && (
          <CheckCircle className="w-5 h-5 text-primary" />
        )}
      </div>
    </div>
  );
};
