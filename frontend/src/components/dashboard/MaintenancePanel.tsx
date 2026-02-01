import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wrench, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MaintenanceTicket {
  id: string;
  created_at: string;
  status: string;
  mode: string;
  station: {
    id: string;
    name: string;
    address: string;
    city: string;
  };
  issue: {
    type: string;
    severity: string;
    current_uptime: string;
    error_count: number;
    error_details: string[];
  };
  impact: {
    affected_chargers: number;
    reduced_capacity: string;
    estimated_queue_increase: string;
    current_queue: number;
  };
  sla: string;
  trigger: string;
  reason: string;
  expected_impact: string;
  confidence: string;
}

interface MaintenancePanelProps {
  onCountChange?: (count: number) => void;
  forceOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  variant?: 'inline' | 'sidebar';
}

export const MaintenancePanel = ({
  onCountChange,
  forceOpen,
  onOpenChange,
  onClose,
  variant = 'inline',
}: MaintenancePanelProps) => {
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchTickets = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/maintenance/history');
      if (response.ok) {
        const data = await response.json();
        const nextTickets = data.tickets || [];
        setTickets(nextTickets);
        onCountChange?.(nextTickets.length);
        setLastUpdated(new Date());
      } else {
        onCountChange?.(0);
      }
    } catch (error) {
      console.error('Error fetching maintenance tickets:', error);
      onCountChange?.(0);
    }
  };

  const clearTickets = async () => {
    try {
      setClearing(true);
      const response = await fetch('http://localhost:5000/api/maintenance/history', {
        method: 'DELETE',
      });
      if (response.ok) {
        setTickets([]);
        onCountChange?.(0);
      }
    } catch (error) {
      console.error('Error clearing maintenance tickets:', error);
    } finally {
      setClearing(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof forceOpen === 'boolean') {
      setIsOpen(forceOpen);
    }
  }, [forceOpen]);

  const renderTickets = () => {
    if (tickets.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-red-500/20 blur-xl"></div>
            <div className="relative p-6 rounded-2xl bg-gradient-to-br from-orange-100/50 to-red-100/50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200/50 dark:border-orange-800/50">
              <Wrench className="w-16 h-16 text-orange-500/70" strokeWidth={1.5} />
            </div>
          </div>
          <h4 className="text-lg font-semibold text-foreground mb-2">No Maintenance Tickets</h4>
          <p className="text-sm text-muted-foreground max-w-xs">
            Maintenance tickets will appear here when charger issues are detected
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4 h-full overflow-y-auto px-6 py-4 scrollbar-thin scrollbar-thumb-orange-200">
        {tickets.map((ticket, idx) => {
          const severityColors = {
            critical: 'border-l-4 border-l-red-500',
            warning: 'border-l-4 border-l-orange-500',
            info: 'border-l-4 border-l-blue-500'
          };

          const iconBgColors = {
            critical: 'bg-red-50',
            warning: 'bg-orange-50',
            info: 'bg-blue-50'
          };

          const iconColors = {
            critical: 'text-red-500',
            warning: 'text-orange-500',
            info: 'text-blue-500'
          };

          const severity = ticket.issue.severity as 'critical' | 'warning' | 'info';

          return (
            <div
              key={idx}
              className={`group bg-card rounded-[1.5rem] shadow-[0_2px_10px_-2px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.3)] transition-all duration-200 p-5 overflow-hidden border border-border/50 ${severityColors[severity]}`}
            >
              <div className="flex items-start gap-4">
                {/* Icon on left */}
                <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center mt-1 ${iconBgColors[severity]}`}>
                  <AlertTriangle className={`w-6 h-6 ${iconColors[severity]}`} strokeWidth={2} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Title */}
                  <div className="font-bold text-foreground mb-1 text-base">
                    {ticket.issue.type === 'charger_downtime' ? 'Charger Downtime' : 'Charger Fault'}
                    <span className="text-muted-foreground font-normal mx-2">-</span>
                    <span className={iconColors[severity]}>{ticket.station.name}</span>
                  </div>

                  {/* Description */}
                  <div className="text-sm text-gray-500 space-y-2">
                    {/* Station info */}
                    <div className="flex items-center gap-2 text-xs font-semibold bg-gray-50 p-2 rounded-lg w-fit">
                      <span className="truncate max-w-[200px]">{ticket.station.address}</span>
                    </div>

                    {/* Issue details list */}
                    <div className="flex flex-wrap gap-2 text-xs font-medium">
                      <span className="bg-muted px-2 py-1 rounded-md text-muted-foreground">{ticket.impact.affected_chargers} chargers affected</span>
                      <span className="bg-muted px-2 py-1 rounded-md text-muted-foreground">{ticket.issue.current_uptime} uptime</span>
                      <span className="bg-muted px-2 py-1 rounded-md text-muted-foreground">{ticket.issue.error_count} errors</span>
                    </div>

                    {/* Impact & SLA */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-2">
                      <span className="text-xs font-semibold text-gray-400">SLA: {ticket.sla}</span>
                      <Badge variant="outline" className={`capitalize ${iconColors[severity]} ${iconBgColors[severity]} border-transparent`}>
                        {ticket.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Date */}
                <div className="flex-shrink-0 text-right">
                  <span className="text-xs font-bold text-gray-400">
                    {new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (variant === 'sidebar') {
    return (
      <div className="flex flex-col h-full bg-background shadow-2xl border-l border-border">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-white/10 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Wrench className="w-5 h-5 text-orange-500" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Maintenance Tickets</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="hover:bg-muted"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 p-2 rounded-lg bg-muted/50 text-center">
              <div className="text-xs text-muted-foreground">Total</div>
              <div className="text-lg font-bold">{tickets.length}</div>
            </div>
            <div className="flex-1 p-2 rounded-lg bg-red-500/10 text-center">
              <div className="text-xs text-red-600 dark:text-red-400">Critical</div>
              <div className="text-lg font-bold text-red-600 dark:text-red-400">
                {tickets.filter(t => t.issue.severity === 'critical').length}
              </div>
            </div>
            <div className="flex-1 p-2 rounded-lg bg-orange-500/10 text-center">
              <div className="text-xs text-orange-600 dark:text-orange-400">Warning</div>
              <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                {tickets.filter(t => t.issue.severity === 'warning').length}
              </div>
            </div>
          </div>

          {/* Last updated & Clear */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Loading...'}
            </span>
            {tickets.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearTickets}
                disabled={clearing}
                className="h-7 px-2 text-xs hover:text-destructive"
              >
                {clearing ? 'Clearing...' : 'Clear All'}
              </Button>
            )}
          </div>
        </div>

        {/* Tickets List */}
        <div className="flex-1 p-4 overflow-hidden">
          {renderTickets()}
        </div>
      </div>
    );
  }

  return null;
};
