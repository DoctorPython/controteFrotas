import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Truck, MapPin, Gauge, Battery, AlertTriangle, 
  Filter, Clock, Navigation, Activity, CircleStop
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { FleetMap } from "@/components/fleet-map";
import { VehicleDetailPanel } from "@/components/vehicle-detail-panel";
import { useVehicleWebSocket } from "@/hooks/use-websocket";
import type { Vehicle, Alert, Geofence } from "@shared/schema";

type FilterType = "all" | "moving" | "stopped" | "alerts" | "offline";

export default function Dashboard() {

  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [followVehicle, setFollowVehicle] = useState<Vehicle | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  // Conectar WebSocket para atualizações em tempo real
  useVehicleWebSocket();

  const { data: vehicles = [], isLoading: isLoadingVehicles } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
    refetchInterval: 10000,
  });

  const { data: alerts = [] } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
    refetchInterval: 10000,
  });

  const { data: geofences = [] } = useQuery<Geofence[]>({
    queryKey: ["/api/geofences"],
  });

  const filteredVehicles = useMemo(() => {
    if (activeFilter === "all") return vehicles;
    
    return vehicles.filter(vehicle => {
      switch (activeFilter) {
        case "moving":
          return vehicle.status === "moving";
        case "stopped":
          return vehicle.status === "stopped" || vehicle.status === "idle";
        case "alerts":
          return alerts.some(a => a.vehicleId === vehicle.id && !a.read);
        case "offline":
          return vehicle.status === "offline";
        default:
          return true;
      }
    });
  }, [vehicles, activeFilter, alerts]);

  const getStatusColor = (status: Vehicle["status"]) => {
    switch (status) {
      case "moving": return "bg-status-online";
      case "stopped": return "bg-status-away";
      case "idle": return "bg-status-away";
      case "offline": return "bg-status-offline";
    }
  };

  const getStatusLabel = (status: Vehicle["status"]) => {
    switch (status) {
      case "moving": return "Em Movimento";
      case "stopped": return "Parado";
      case "idle": return "Ocioso";
      case "offline": return "Offline";
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffSeconds < 60) return `${diffSeconds}s atrás`;
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}min atrás`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h atrás`;
    return date.toLocaleDateString("pt-BR");
  };

  const handleSelectVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setFollowVehicle(null);
  };

  const handleCloseDetail = () => {
    setSelectedVehicle(null);
    setFollowVehicle(null);
  };

  const handleFollowVehicle = () => {
    if (selectedVehicle) {
      setFollowVehicle(selectedVehicle);
    }
  };

  const vehicleAlerts = selectedVehicle 
    ? alerts.filter(a => a.vehicleId === selectedVehicle.id)
    : [];

  const stats = {
    total: vehicles.length,
    moving: vehicles.filter(v => v.status === 'moving').length,
    stopped: vehicles.filter(v => v.status === 'stopped' || v.status === 'idle').length,
    alerts: alerts.filter(a => !a.read).length,
  };
  
  return (
    <div className="h-full flex flex-col" data-testid="dashboard-page">
      {/* Stats Cards */}
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-1" data-testid="text-page-title">Dashboard da Frota</h1>
          <p className="text-muted-foreground">Monitoramento e rastreamento de veículos em tempo real</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Veículos</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono" data-testid="text-stat-total">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">Ativos na frota</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Movimento</CardTitle>
              <Activity className="h-4 w-4 text-status-online" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono text-status-online" data-testid="text-stat-moving">{stats.moving}</div>
              <p className="text-xs text-muted-foreground mt-1">Atualmente em trânsito</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Parados</CardTitle>
              <CircleStop className="h-4 w-4 text-status-away" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono text-status-away" data-testid="text-stat-stopped">{stats.stopped}</div>
              <p className="text-xs text-muted-foreground mt-1">Estacionados ou ociosos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alertas Recentes</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono text-destructive" data-testid="text-stat-alerts">{stats.alerts}</div>
              <p className="text-xs text-muted-foreground mt-1">Não lidos</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Map and Vehicle List */}
      <div className="flex-1 flex min-h-0">
        {/* Vehicle List Sidebar - 320px */}
        <div className="w-[320px] flex-shrink-0 border-r border-border bg-sidebar flex flex-col">
        <div className="p-4 border-b border-sidebar-border">
          <h2 className="font-semibold text-lg mb-3">Frota</h2>
          
          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("all")}
              className="text-xs"
            >
              Todos
            </Button>
            <Button
              variant={activeFilter === "moving" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("moving")}
              className="text-xs"
            >
              Em Movimento
            </Button>
            <Button
              variant={activeFilter === "stopped" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("stopped")}
              className="text-xs"
            >
              Parados
            </Button>
            <Button
              variant={activeFilter === "alerts" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("alerts")}
              className="text-xs relative"
            >
              Alertas
              {alerts.filter(a => !a.read).length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center">
                  {alerts.filter(a => !a.read).length}
                </span>
              )}
            </Button>
            <Button
              variant={activeFilter === "offline" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("offline")}
              className="text-xs"
            >
              Offline
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {isLoadingVehicles ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))
            ) : filteredVehicles.length === 0 ? (
              <div className="text-center py-8">
                <Truck className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">
                  {activeFilter === "all" 
                    ? "Nenhum veículo cadastrado" 
                    : "Nenhum veículo encontrado"}
                </p>
              </div>
            ) : (
              filteredVehicles.map(vehicle => {
                const vehicleAlertCount = alerts.filter(a => a.vehicleId === vehicle.id && !a.read).length;
                const isSelected = selectedVehicle?.id === vehicle.id;

                return (
                  <Card
                    key={vehicle.id}
                    className={cn(
                      "cursor-pointer hover-elevate min-h-20",
                      isSelected && "ring-2 ring-primary"
                    )}
                    onClick={() => handleSelectVehicle(vehicle)}
                    data-testid={`vehicle-${vehicle.id}`}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className={cn("w-3 h-3 rounded-full flex-shrink-0", getStatusColor(vehicle.status))} />
                          <div className="flex-1 min-w-0">
                            <span className="font-medium block truncate">{vehicle.name}</span>
                            <span className="text-xs text-muted-foreground">{vehicle.licensePlate}</span>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-[10px] flex-shrink-0">
                          {getStatusLabel(vehicle.status)}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                        <div className="flex items-center gap-1">
                          <Gauge className="h-3 w-3" />
                          <span className={cn(
                            "font-mono font-medium",
                            vehicle.currentSpeed > vehicle.speedLimit && "text-destructive"
                          )}>
                            {vehicle.currentSpeed} km/h
                          </span>
                          {vehicle.currentSpeed > vehicle.speedLimit && (
                            <AlertTriangle className="h-3 w-3 text-destructive" />
                          )}
                        </div>
                        {vehicle.batteryLevel !== undefined && (
                          <div className="flex items-center gap-1">
                            <Battery className="h-3 w-3" />
                            <span>{vehicle.batteryLevel}%</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatTime(vehicle.lastUpdate)}</span>
                        </div>
                        {vehicleAlertCount > 0 && (
                          <Badge variant="destructive" className="h-4 px-1.5 text-[10px]">
                            {vehicleAlertCount}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Map Area - flex-1 */}
      <div className="flex-1 relative">
        <FleetMap
          vehicles={vehicles}
          geofences={geofences}
          selectedVehicle={selectedVehicle}
          followVehicle={followVehicle}
          onSelectVehicle={handleSelectVehicle}
        />
      </div>

      {/* Details Panel - 360px */}
      {selectedVehicle ? (
        <div className="w-[360px] flex-shrink-0 border-l border-border">
          <VehicleDetailPanel
            vehicle={selectedVehicle}
            alerts={vehicleAlerts}
            onClose={handleCloseDetail}
            onFollowVehicle={handleFollowVehicle}
            isFollowing={followVehicle?.id === selectedVehicle.id}
          />
        </div>
      ) : (
        <div className="w-[360px] flex-shrink-0 border-l border-border bg-sidebar flex items-center justify-center">
          <div className="text-center p-6">
            <MapPin className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-sm text-muted-foreground">
              Selecione um veículo para ver os detalhes
            </p>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
