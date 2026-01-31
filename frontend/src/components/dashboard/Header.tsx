import { Bell, Search, Settings, Zap, Route } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface HeaderProps {
  isScrolled?: boolean;
  isConnected: boolean;
  lastUpdate: Date;
  activeAlerts: number;
  rerouteCount: number;
  maintenanceCount: number;
  onAlertsClick: () => void;
  onRerouteClick: () => void;
  onMaintenanceClick: () => void;
}

export const Header = ({
  isScrolled = false,
  isConnected,
  lastUpdate,
  activeAlerts,
  rerouteCount,
  maintenanceCount,
  onAlertsClick,
  onRerouteClick,
  onMaintenanceClick,
}: HeaderProps) => {
  return (
    <header className={cn(
      "px-8 py-3 transition-all duration-500 sticky top-0 z-50",
      isScrolled
        ? "bg-white border-b border-gray-200 shadow-sm"
        : "bg-[#020d1a] border-b border-white/10"
    )}>
      <div className="flex items-center justify-between max-w-[1800px] mx-auto">
        {/* Logo Area */}
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-all duration-500",
            isScrolled ? "bg-primary text-primary-foreground" : "bg-white text-[#3081ce]"
          )}>
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div className="flex flex-col">
            <span className={cn(
              "text-lg font-bold tracking-tight font-poppins leading-none transition-colors duration-500",
              isScrolled ? "text-gray-900" : "text-white"
            )}>
              Station<span className={cn(
                "transition-colors duration-300",
                isScrolled ? "text-primary" : "text-white/90"
              )}>OS</span>
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={cn(
                "w-1.5 h-1.5 rounded-full transition-colors",
                isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              )} />
              <span className={cn(
                "text-[9px] font-medium uppercase tracking-wider transition-colors duration-500",
                isScrolled ? "text-gray-600" : "text-white/70"
              )}>
                {isConnected ? 'System Online' : 'Reconnect...'}
              </span>
            </div>
          </div>
        </div>

        {/* Centered Navigation */}
        <nav className={cn(
          "hidden lg:flex items-center gap-6 text-sm font-medium transition-colors duration-500",
          isScrolled ? "text-gray-600" : "text-white/80"
        )}>
          {['Dashboard', 'Stations', 'Analytics', 'Maintenance', 'Settings'].map((item) => (
            <button
              key={item}
              className={cn(
                "transition-all duration-300",
                item === 'Dashboard'
                  ? (isScrolled ? "text-gray-900 font-bold border-b-2 border-primary pb-1" : "text-white font-bold border-b-2 border-white pb-1")
                  : (isScrolled ? "hover:text-gray-900" : "hover:text-white")
              )}
            >
              {item}
            </button>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <div className="relative hidden md:block group">
            <Search className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-500",
              isScrolled ? "text-gray-500 group-focus-within:text-primary" : "text-white/60 group-focus-within:text-white"
            )} />
            <Input
              placeholder="Search..."
              className={cn(
                "pl-10 w-[240px] xl:w-[280px] h-9 rounded-full transition-all duration-300 outline-none border-0 shadow-sm",
                isScrolled
                  ? "bg-gray-100 hover:bg-gray-200 focus:bg-white text-gray-900 placeholder:text-gray-500"
                  : "bg-white/10 hover:bg-white/20 focus:bg-white/30 text-white placeholder:text-white/70"
              )}
            />
          </div>

          <div className="flex items-center gap-2">
            {[
              { icon: Route, count: rerouteCount, click: onRerouteClick, color: "bg-amber-500" },
              { icon: Bell, count: activeAlerts, click: onAlertsClick, color: "bg-red-500" },
              { icon: Settings, count: maintenanceCount, click: onMaintenanceClick, color: "bg-primary" }
            ].map((btn, i) => (
              <Button
                key={i}
                variant="ghost"
                size="icon"
                className={cn(
                  "rounded-full w-9 h-9 transition-all duration-300",
                  isScrolled
                    ? "bg-white hover:bg-gray-100 text-gray-600 hover:text-primary border border-gray-200"
                    : "bg-white/10 hover:bg-white/20 text-white border border-white/10"
                )}
                onClick={btn.click}
              >
                <div className="relative">
                  <btn.icon className="w-4 h-4" />
                  {btn.count > 0 && (
                    <span className={cn(
                      "absolute -top-1 -right-0.5 w-2 h-2 rounded-full border border-white",
                      btn.color
                    )} />
                  )}
                </div>
              </Button>
            ))}

            <div className={cn(
              "w-9 h-9 rounded-full bg-gradient-to-tr from-[#00d2ff] to-[#3a7bd5] ml-2 border-2 cursor-pointer hover:shadow-md transition-all duration-300",
              isScrolled ? "border-gray-200" : "border-white/40 shadow-lg"
            )} />
          </div>
        </div>
      </div>
    </header>
  );
};
