import { AlertTriangle, CheckCircle, Clock, X, AlertCircle, Info } from 'lucide-react';
import { Alert } from '@/types/station';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface AlertsPanelProps {
  alerts: Alert[];
  onAcknowledge: (alertId: string) => void;
  onClose: () => void;
}

export const AlertsPanel = ({ alerts, onAcknowledge, onClose }: AlertsPanelProps) => {
  const sortedAlerts = [...alerts].sort((a, b) => {
    // Sort by acknowledged (unacknowledged first), then by severity, then by time
    if (a.acknowledged !== b.acknowledged) return a.acknowledged ? 1 : -1;
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const severityConfig = {
    low: {
      bg: 'bg-secondary/10',
      border: 'border-secondary/20',
      icon: Info,
      iconColor: 'text-secondary',
      dotColor: 'bg-secondary',
    },
    medium: {
      bg: 'bg-accent/10',
      border: 'border-accent/20',
      icon: AlertCircle,
      iconColor: 'text-accent',
      dotColor: 'bg-accent',
    },
    high: {
      bg: 'bg-primary/10',
      border: 'border-primary/20',
      icon: AlertTriangle,
      iconColor: 'text-primary',
      dotColor: 'bg-primary',
    },
    critical: {
      bg: 'bg-destructive/10',
      border: 'border-destructive/20',
      icon: AlertTriangle,
      iconColor: 'text-destructive',
      dotColor: 'bg-destructive',
    },
  };

  return (
    <div className="h-full flex flex-col bg-card shadow-2xl border-l border-white/5 rounded-l-3xl overflow-hidden">
      {/* Header */}
      {/* Header */}
      <div className="flex items-center justify-between p-5 pb-3 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-destructive/10 text-destructive">
            <AlertTriangle className="w-5 h-5" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="font-bold text-lg text-foreground tracking-tight">Active Alerts</h2>
            <p className="text-sm text-muted-foreground font-medium">
              {alerts.filter((a) => !a.acknowledged).length} require attention
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/5">
          <X className="w-5 h-5" strokeWidth={2.5} />
        </Button>
      </div>

      {/* Timeline */}
      <ScrollArea className="flex-1 p-5 bg-transparent">
        {sortedAlerts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-primary" strokeWidth={2} />
            </div>
            <p className="font-bold text-foreground mb-1">All Clear</p>
            <p className="text-sm">No active alerts</p>
          </div>
        ) : (
          <div className="relative pl-4">
            {/* Timeline Line */}
            <div className="absolute left-[38px] top-0 bottom-0 w-[2px] bg-white/5" />

            {/* Alert Cards */}
            <div className="space-y-4">
              {sortedAlerts.map((alert, index) => {
                const config = severityConfig[alert.severity];
                const Icon = config.icon;

                return (
                  <div
                    key={alert.id}
                    className={cn(
                      'relative pl-12 animate-fade-in-up',
                      alert.acknowledged && 'opacity-60 grayscale'
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Timeline Dot */}
                    <div className="absolute left-6 top-6 w-8 h-8 rounded-full bg-card border-4 border-muted flex items-center justify-center z-10 shadow-sm -translate-x-1/2">
                      <div className={cn('w-2.5 h-2.5 rounded-full', config.dotColor)} />
                    </div>

                    {/* Alert Card */}
                    <div
                      className={cn(
                        'p-4 rounded-[1.25rem] bg-card border border-white/5 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.2)] transition-all hover:shadow-[0_8px_20px_-4px_rgba(0,210,106,0.1)] hover:border-primary/20'
                      )}
                    >
                      <div className="flex items-start gap-4 mb-3">
                        <div className={cn('p-2.5 rounded-xl flex-shrink-0', config.bg)}>
                          <Icon className={cn('w-4 h-4', config.iconColor)} strokeWidth={2.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-sm text-foreground">
                              {alert.type}
                            </span>
                            <Badge
                              variant="secondary"
                              className={cn(
                                'text-[10px] font-bold px-2 py-0.5 rounded-full',
                                alert.severity === 'critical' && 'bg-destructive/10 text-destructive',
                                alert.severity === 'high' && 'bg-primary/10 text-primary',
                                alert.severity === 'medium' && 'bg-accent/10 text-accent',
                                alert.severity === 'low' && 'bg-secondary/10 text-secondary'
                              )}
                            >
                              {alert.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                            {alert.message}
                          </p>
                          <div className="flex items-center gap-4 text-xs font-medium">
                            <span className="text-foreground bg-white/5 px-2 py-1 rounded-md">
                              {alert.stationName}
                            </span>
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="w-3.5 h-3.5" />
                              {formatDistanceToNow(new Date(alert.timestamp), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      {!alert.acknowledged && (
                        <div className="flex justify-end pt-3 mt-1 border-t border-white/5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onAcknowledge(alert.id)}
                            className="text-xs font-bold text-primary hover:bg-primary/5 hover:text-primary rounded-full px-4 h-8"
                          >
                            Acknowledge
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
