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
    <div className="relative h-full w-full overflow-hidden bg-background/5" data-testid="dashboard-page">
      
      {/* Camada 0: Mapa em Tela Cheia */}
      <div className="absolute inset-0 z-0">
        <FleetMap
          vehicles={vehicles}
          geofences={geofences}
          selectedVehicle={selectedVehicle ?? undefined}
          followVehicle={followVehicle ?? undefined}
          onSelectVehicle={handleSelectVehicle}
        />
      </div>

      {/* Camada 1: Interface Flutuante (HUD) */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col md:flex-row p-4 gap-4">
        
        {/* Painel Esquerdo: KPIs + Lista */}
        <div className="w-full md:w-[380px] flex flex-col gap-4 pointer-events-auto h-full max-h-full">
          
          {/* KPIs Compactos */}
          <Card className="bg-background/95 backdrop-blur shadow-lg border-border/50 shrink-0">
            <CardContent className="p-4">
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-muted/50">
                  <span className="text-xs text-muted-foreground font-medium uppercase">Total</span>
                  <span className="text-xl font-bold font-mono text-foreground">{stats.total}</span>
                </div>
                <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-status-online/10">
                  <span className="text-xs text-status-online font-medium uppercase">Movendo</span>
                  <span className="text-xl font-bold font-mono text-status-online">{stats.moving}</span>
                </div>
                <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-status-away/10">
                  <span className="text-xs text-status-away font-medium uppercase">Parados</span>
                  <span className="text-xl font-bold font-mono text-status-away">{stats.stopped}</span>
                </div>
                <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-destructive/10">
                  <span className="text-xs text-destructive font-medium uppercase">Alertas</span>
                  <span className="text-xl font-bold font-mono text-destructive">{stats.alerts}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Veículos */}
          <Card className="flex-1 bg-background/95 backdrop-blur shadow-lg border-border/50 overflow-hidden flex flex-col min-h-0">
            <div className="p-3 border-b border-border/50 bg-muted/20">
              <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Truck className="h-4 w-4" /> Frota
              </h2>
              
              {/* Filtros Compactos */}
              <ScrollArea className="w-full whitespace-nowrap pb-1">
                <div className="flex gap-2">
                  <Button
                    variant={activeFilter === "all" ? "default" : "secondary"}
                    size="sm"
                    onClick={() => setActiveFilter("all")}
                    className="h-7 text-xs px-3"
                  >
                    Todos
                  </Button>
                  <Button
                    variant={activeFilter === "moving" ? "default" : "secondary"}
                    size="sm"
                    onClick={() => setActiveFilter("moving")}
                    className="h-7 text-xs px-3"
                  >
                    Movendo
                  </Button>
                  <Button
                    variant={activeFilter === "stopped" ? "default" : "secondary"}
                    size="sm"
                    onClick={() => setActiveFilter("stopped")}
                    className="h-7 text-xs px-3"
                  >
                    Parados
                  </Button>
                  <Button
                    variant={activeFilter === "alerts" ? "default" : "secondary"}
                    size="sm"
                    onClick={() => setActiveFilter("alerts")}
                    className="h-7 text-xs px-3 relative"
                  >
                    Alertas
                    {alerts.filter(a => !a.read).length > 0 && (
                      <span className="ml-1.5 flex h-2 w-2 rounded-full bg-destructive" />
                    )}
                  </Button>
                  <Button
                    variant={activeFilter === "offline" ? "default" : "secondary"}
                    size="sm"
                    onClick={() => setActiveFilter("offline")}
                    className="h-7 text-xs px-3"
                  >
                    Offline
                  </Button>
                </div>
              </ScrollArea>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-2 space-y-2">
                {isLoadingVehicles ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                  ))
                ) : filteredVehicles.length === 0 ? (
                  <div className="text-center py-12 flex flex-col items-center">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                      <Truck className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground">Nenhum veículo</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {activeFilter === "all" 
                        ? "Sua frota está vazia" 
                        : "Nenhum veículo com este filtro"}
                    </p>
                  </div>
                ) : (
                  filteredVehicles.map(vehicle => {
                    const vehicleAlertCount = alerts.filter(a => a.vehicleId === vehicle.id && !a.read).length;
                    const isSelected = selectedVehicle?.id === vehicle.id;

                    return (
                      <div
                        key={vehicle.id}
                        className={cn(
                          "group relative flex flex-col gap-2 p-3 rounded-lg border transition-all cursor-pointer",
                          isSelected 
                            ? "bg-primary/5 border-primary shadow-sm" 
                            : "bg-card border-border/50 hover:bg-accent/50 hover:border-accent"
                        )}
                        onClick={() => handleSelectVehicle(vehicle)}
                      >
                        {/* Linha Principal: Status + Nome + Placa */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={cn(
                              "w-2.5 h-2.5 rounded-full shadow-sm ring-2 ring-background",
                              getStatusColor(vehicle.status).replace("bg-", "bg-") // Assumindo que getStatusColor retorna bg-
                            )} />
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-sm truncate leading-tight">
                                {vehicle.name}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {vehicle.licensePlate}
                              </span>
                            </div>
                          </div>
                          
                          {vehicleAlertCount > 0 && (
                            <Badge variant="destructive" className="h-5 px-1.5 text-[10px] animate-pulse">
                              {vehicleAlertCount}
                            </Badge>
                          )}
                        </div>

                        {/* Linha Secundária: Métricas */}
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 p-1 rounded">
                            <Gauge className="h-3 w-3 opacity-70" />
                            <span className={cn(
                              "font-mono font-medium",
                              vehicle.currentSpeed > 0 ? "text-foreground" : ""
                            )}>
                              {vehicle.currentSpeed} <span className="text-[10px]">km/h</span>
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 p-1 rounded">
                            <Clock className="h-3 w-3 opacity-70" />
                            <span className="truncate">
                              {formatTime(vehicle.lastUpdate).replace("atrás", "")}
                            </span>
                          </div>
                        </div>
                        
                        {/* Botão de Ação Rápida (Hover) */}
                        <div className={cn(
                          "absolute right-2 top-2 opacity-0 transition-opacity",
                          isSelected ? "opacity-100" : "group-hover:opacity-100"
                        )}>
                           <MapPin className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </Card>
        </div>

        {/* Espaçador Central (para permitir ver o mapa) */}
        <div className="flex-1 pointer-events-none" />

        {/* Painel Direito: Detalhes do Veículo */}
        {selectedVehicle && (
          <div className="w-full md:w-[360px] pointer-events-auto h-full animate-in slide-in-from-right-10 fade-in duration-300">
            <Card className="h-full bg-background/95 backdrop-blur shadow-xl border-border/50 overflow-hidden flex flex-col">
              <VehicleDetailPanel
                vehicle={selectedVehicle}
                alerts={vehicleAlerts}
                onClose={handleCloseDetail}
                onFollowVehicle={handleFollowVehicle}
                isFollowing={followVehicle?.id === selectedVehicle.id}
              />
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
