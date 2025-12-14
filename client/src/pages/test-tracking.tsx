import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Play, Square, MapPin, Gauge, Navigation, 
  Radio, AlertCircle, CheckCircle2, Loader2, Plus, Smartphone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertVehicleSchema } from "@shared/schema";
import type { Vehicle, InsertVehicle } from "@shared/schema";
import type { TrackingData } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface GeolocationPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

export default function TestTrackingPage() {
  const { toast } = useToast();
  const [isTracking, setIsTracking] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [licensePlate, setLicensePlate] = useState<string>("");
  const [updateInterval, setUpdateInterval] = useState<number>(5); // segundos
  const [lastPosition, setLastPosition] = useState<GeolocationPosition | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [newVehicleName, setNewVehicleName] = useState<string>("");
  const [newVehiclePlate, setNewVehiclePlate] = useState<string>("");
  const [currentGPSPosition, setCurrentGPSPosition] = useState<GeolocationPosition | null>(null);
  const [useManualLocation, setUseManualLocation] = useState(false);
  const [manualLatitude, setManualLatitude] = useState<string>("");
  const [manualLongitude, setManualLongitude] = useState<string>("");
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [trackingStats, setTrackingStats] = useState({
    sent: 0,
    errors: 0,
    lastSent: null as Date | null,
  });
  
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPositionRef = useRef<GeolocationPosition | null>(null);

  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

  const createVehicleMutation = useMutation({
    mutationFn: async (data: InsertVehicle) => {
      const response = await apiRequest("POST", "/api/vehicles", {
        ...data,
        lastUpdate: new Date().toISOString(),
      });
      return response.json();
    },
    onSuccess: (vehicle: Vehicle) => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      setSelectedVehicleId(vehicle.id);
      setLicensePlate(vehicle.licensePlate);
      setIsCreateDialogOpen(false);
      setNewVehicleName("");
      setNewVehiclePlate("");
      setCurrentGPSPosition(null);
      toast({
        title: "Veículo criado!",
        description: `${vehicle.name} foi cadastrado com sucesso.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar veículo",
        description: error.message || "Não foi possível criar o veículo.",
        variant: "destructive",
      });
    },
  });

  const sendTrackingMutation = useMutation({
    mutationFn: async (data: TrackingData) => {
      const response = await apiRequest("POST", "/api/tracking", data);
      return response.json();
    },
    onSuccess: () => {
      setTrackingStats(prev => ({
        ...prev,
        sent: prev.sent + 1,
        lastSent: new Date(),
      }));
    },
    onError: (error: Error) => {
      setTrackingStats(prev => ({
        ...prev,
        errors: prev.errors + 1,
      }));
      toast({
        title: "Erro ao enviar localização",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleVehicleChange = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (vehicle) {
      setLicensePlate(vehicle.licensePlate);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGpsError("Geolocalização não é suportada neste navegador. Use a opção de entrada manual.");
      setUseManualLocation(true);
      setIsCreateDialogOpen(true);
      return;
    }

    setIsGettingLocation(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const geoPos: GeolocationPosition = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy ?? 0,
          heading: position.coords.heading ?? null,
          speed: position.coords.speed ?? null,
          timestamp: position.timestamp,
        };
        setCurrentGPSPosition(geoPos);
        setIsGettingLocation(false);
        setUseManualLocation(false);
        setIsCreateDialogOpen(true);
        toast({
          title: "Localização obtida!",
          description: "Preencha o nome e placa do veículo.",
        });
      },
      (error) => {
        setIsGettingLocation(false);
        const errorMsg = error.message.includes("secure") || error.message.includes("Only secure origins")
          ? "GPS requer HTTPS. Use a opção de entrada manual abaixo ou configure HTTPS no servidor."
          : error.message;
        setGpsError(errorMsg);
        setUseManualLocation(true);
        setIsCreateDialogOpen(true);
        toast({
          title: "GPS não disponível",
          description: "Use a entrada manual de coordenadas",
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleCreateVehicle = () => {
    if (!newVehicleName.trim()) {
      toast({
        title: "Erro",
        description: "Digite um nome para o veículo",
        variant: "destructive",
      });
      return;
    }

    if (!newVehiclePlate.trim()) {
      toast({
        title: "Erro",
        description: "Digite a placa do veículo",
        variant: "destructive",
      });
      return;
    }

    let latitude: number;
    let longitude: number;
    let accuracy: number;

    if (useManualLocation) {
      const lat = parseFloat(manualLatitude);
      const lng = parseFloat(manualLongitude);
      
      if (isNaN(lat) || lat < -90 || lat > 90) {
        toast({
          title: "Erro",
          description: "Latitude inválida. Use um valor entre -90 e 90.",
          variant: "destructive",
        });
        return;
      }
      
      if (isNaN(lng) || lng < -180 || lng > 180) {
        toast({
          title: "Erro",
          description: "Longitude inválida. Use um valor entre -180 e 180.",
          variant: "destructive",
        });
        return;
      }
      
      latitude = lat;
      longitude = lng;
      accuracy = 10; // Precisão padrão para entrada manual
    } else {
      if (!currentGPSPosition) {
        toast({
          title: "Erro",
          description: "Localização GPS não disponível. Use a entrada manual.",
          variant: "destructive",
        });
        return;
      }
      latitude = currentGPSPosition.latitude;
      longitude = currentGPSPosition.longitude;
      accuracy = Math.round(currentGPSPosition.accuracy);
    }

    const vehicleData: InsertVehicle = {
      name: newVehicleName.trim(),
      licensePlate: newVehiclePlate.toUpperCase().trim(),
      model: "Smartphone",
      status: "stopped",
      ignition: "off",
      currentSpeed: 0,
      speedLimit: 60,
      heading: currentGPSPosition?.heading ?? 0,
      latitude,
      longitude,
      accuracy,
      lastUpdate: new Date().toISOString(),
    };

    // Validação com Zod
    const validation = insertVehicleSchema.safeParse(vehicleData);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast({
        title: "Erro de validação",
        description: firstError?.message || "Dados inválidos.",
        variant: "destructive",
      });
      return;
    }

    createVehicleMutation.mutate(vehicleData);
  };

  const sendTrackingData = (position: GeolocationPosition) => {
    if (!licensePlate.trim()) {
      toast({
        title: "Erro",
        description: "Selecione um veículo ou informe uma placa",
        variant: "destructive",
      });
      return;
    }

    const trackingData: TrackingData = {
      licensePlate: licensePlate.toUpperCase(),
      latitude: position.latitude,
      longitude: position.longitude,
      speed: position.speed ? Math.round(position.speed * 3.6) : 0, // m/s para km/h
      heading: position.heading ?? undefined,
      accuracy: Math.round(position.accuracy),
      timestamp: new Date(position.timestamp).toISOString(),
    };

    sendTrackingMutation.mutate(trackingData);
  };

  const startTracking = () => {
    if (!licensePlate.trim()) {
      toast({
        title: "Erro",
        description: "Selecione um veículo ou informe uma placa",
        variant: "destructive",
      });
      return;
    }

    if (!navigator.geolocation) {
      toast({
        title: "Erro",
        description: "Geolocalização não é suportada neste navegador",
        variant: "destructive",
      });
      return;
    }

    setIsTracking(true);
    setTrackingStats({ sent: 0, errors: 0, lastSent: null });

    // Obter posição inicial
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const geoPos: GeolocationPosition = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy ?? 0,
          heading: position.coords.heading ?? null,
          speed: position.coords.speed ?? null,
          timestamp: position.timestamp,
        };
        setLastPosition(geoPos);
        lastPositionRef.current = geoPos;
        sendTrackingData(geoPos);
      },
      (error) => {
        const errorMsg = error.message.includes("secure") || error.message.includes("Only secure origins")
          ? "GPS requer HTTPS. Configure HTTPS no servidor ou use localhost para testes."
          : error.message;
        toast({
          title: "Erro ao obter localização",
          description: errorMsg,
          variant: "destructive",
        });
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    // Watch position para atualizações contínuas
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const geoPos: GeolocationPosition = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy ?? 0,
          heading: position.coords.heading ?? null,
          speed: position.coords.speed ?? null,
          timestamp: position.timestamp,
        };
        setLastPosition(geoPos);
        lastPositionRef.current = geoPos;
      },
      (error) => {
        const errorMsg = error.message.includes("secure") || error.message.includes("Only secure origins")
          ? "GPS requer HTTPS. Configure HTTPS no servidor ou use localhost para testes."
          : error.message;
        toast({
          title: "Erro ao monitorar localização",
          description: errorMsg,
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    // Enviar dados periodicamente
    intervalRef.current = setInterval(() => {
      if (lastPositionRef.current) {
        sendTrackingData(lastPositionRef.current);
      }
    }, updateInterval * 1000);
  };

  const stopTracking = () => {
    setIsTracking(false);
    
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    lastPositionRef.current = null;
  };

  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, []);

  const formatTime = (date: Date | null) => {
    if (!date) return "Nunca";
    return date.toLocaleTimeString("pt-BR");
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl" data-testid="test-tracking-page">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">Teste de Rastreamento em Tempo Real</h1>
        <p className="text-sm text-muted-foreground">
          Use o GPS do seu smartphone para simular um veículo em tempo real
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Configuração</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="vehicle-select">Selecione um Veículo</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={getCurrentLocation}
                  disabled={isTracking || isGettingLocation}
                  className="gap-2"
                >
                  {isGettingLocation ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Obtendo GPS...
                    </>
                  ) : (
                    <>
                      <Smartphone className="h-4 w-4" />
                      Cadastrar Aparelho
                    </>
                  )}
                </Button>
              </div>
              <Select
                value={selectedVehicleId}
                onValueChange={handleVehicleChange}
                disabled={isTracking}
              >
                <SelectTrigger id="vehicle-select">
                  <SelectValue placeholder="Selecione um veículo..." />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.length === 0 ? (
                    <SelectItem value="none" disabled>
                      Nenhum veículo cadastrado
                    </SelectItem>
                  ) : (
                    vehicles.map(vehicle => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.name} - {vehicle.licensePlate}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Ou clique em "Cadastrar Aparelho" para criar um novo veículo usando seu GPS
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="license-plate">Placa do Veículo *</Label>
              <Input
                id="license-plate"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                placeholder="ABC-1234"
                disabled={isTracking || !!selectedVehicle}
              />
              <p className="text-xs text-muted-foreground">
                {selectedVehicle 
                  ? `Placa do veículo selecionado: ${selectedVehicle.licensePlate}`
                  : "Informe a placa do veículo que será rastreado"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="interval">Intervalo de Envio (segundos)</Label>
              <Input
                id="interval"
                type="number"
                min="1"
                max="60"
                value={updateInterval}
                onChange={(e) => setUpdateInterval(Number(e.target.value))}
                disabled={isTracking}
              />
              <p className="text-xs text-muted-foreground">
                A localização será enviada a cada {updateInterval} segundo(s)
              </p>
            </div>

            <div className="flex gap-2 flex-wrap">
              {!isTracking ? (
                <>
                  <Button 
                    onClick={startTracking} 
                    className="gap-2 flex-1"
                    disabled={!licensePlate.trim()}
                  >
                    <Play className="h-4 w-4" />
                    Iniciar Rastreamento (GPS)
                  </Button>
                  <Button 
                    onClick={() => {
                      if (!licensePlate.trim()) {
                        toast({
                          title: "Erro",
                          description: "Selecione um veículo ou informe uma placa",
                          variant: "destructive",
                        });
                        return;
                      }
                      // Tentar obter localização uma vez e enviar
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                          (position) => {
                            const geoPos: GeolocationPosition = {
                              latitude: position.coords.latitude,
                              longitude: position.coords.longitude,
                              accuracy: position.coords.accuracy ?? 0,
                              heading: position.coords.heading ?? null,
                              speed: position.coords.speed ?? null,
                              timestamp: position.timestamp,
                            };
                            sendTrackingData(geoPos);
                            toast({
                              title: "Localização enviada!",
                              description: "Dados enviados com sucesso.",
                            });
                          },
                          (error) => {
                            toast({
                              title: "GPS não disponível",
                              description: "Use a entrada manual abaixo ou configure HTTPS",
                              variant: "destructive",
                            });
                          },
                          { enableHighAccuracy: true, timeout: 5000 }
                        );
                      } else {
                        toast({
                          title: "GPS não suportado",
                          description: "Use a entrada manual",
                          variant: "destructive",
                        });
                      }
                    }}
                    variant="outline"
                    className="gap-2"
                    disabled={!licensePlate.trim()}
                  >
                    <MapPin className="h-4 w-4" />
                    Enviar Agora
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={stopTracking} 
                  variant="destructive"
                  className="gap-2"
                >
                  <Square className="h-4 w-4" />
                  Parar Rastreamento
                </Button>
              )}
            </div>
            
            {!isTracking && (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-xs text-muted-foreground mb-2">
                  <strong>Dica:</strong> Se o GPS não funcionar (erro de HTTPS), use o botão "Enviar Agora" 
                  para enviar sua localização manualmente. Você pode clicar várias vezes enquanto se move.
                </p>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Input
                    type="number"
                    step="any"
                    placeholder="Latitude"
                    value={manualLatitude}
                    onChange={(e) => setManualLatitude(e.target.value)}
                    className="text-xs"
                  />
                  <Input
                    type="number"
                    step="any"
                    placeholder="Longitude"
                    value={manualLongitude}
                    onChange={(e) => setManualLongitude(e.target.value)}
                    className="text-xs"
                  />
                </div>
                {manualLatitude && manualLongitude && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-2 gap-2"
                    onClick={() => {
                      const lat = parseFloat(manualLatitude);
                      const lng = parseFloat(manualLongitude);
                      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                        const manualPos: GeolocationPosition = {
                          latitude: lat,
                          longitude: lng,
                          accuracy: 10,
                          heading: null,
                          speed: null,
                          timestamp: Date.now(),
                        };
                        sendTrackingData(manualPos);
                        toast({
                          title: "Localização enviada!",
                          description: `Coordenadas: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
                        });
                      } else {
                        toast({
                          title: "Coordenadas inválidas",
                          description: "Verifique os valores",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <MapPin className="h-3 w-3" />
                    Enviar Coordenadas Manuais
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {isTracking && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                Rastreamento Ativo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {lastPosition ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Latitude:</span>
                        <span className="font-mono font-medium">
                          {lastPosition.latitude.toFixed(6)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Longitude:</span>
                        <span className="font-mono font-medium">
                          {lastPosition.longitude.toFixed(6)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Gauge className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Velocidade:</span>
                        <span className="font-mono font-medium">
                          {lastPosition.speed ? Math.round(lastPosition.speed * 3.6) : 0} km/h
                        </span>
                      </div>
                      {lastPosition.heading !== null && (
                        <div className="flex items-center gap-2 text-sm">
                          <Navigation className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Direção:</span>
                          <span className="font-mono font-medium">
                            {Math.round(lastPosition.heading)}°
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Radio className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Precisão:</span>
                    <span className="font-medium">{Math.round(lastPosition.accuracy)}m</span>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Obtendo localização...
                  </p>
                </div>
              )}

              <div className="pt-4 border-t">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {trackingStats.sent}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Enviados
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-destructive">
                      {trackingStats.errors}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Erros
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">
                      {formatTime(trackingStats.lastSent)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Último envio
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Instruções</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary" />
              <p>Certifique-se de que o veículo já está cadastrado no sistema</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary" />
              <p>Permita o acesso à localização quando solicitado pelo navegador</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary" />
              <p>Para melhor precisão, use o smartphone ao ar livre</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary" />
              <p>O veículo aparecerá no Dashboard em tempo real</p>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 text-warning" />
              <p>A velocidade será calculada automaticamente pelo GPS do dispositivo</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary" />
              <p>Use "Cadastrar Aparelho" para criar um veículo automaticamente com sua localização atual</p>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 text-warning" />
              <div>
                <p className="font-medium mb-1">Problema com GPS?</p>
                <p className="text-xs">
                  Se aparecer erro de "secure origins", use a entrada manual de coordenadas no diálogo de cadastro.
                  Para obter suas coordenadas: abra o Google Maps, toque e segure no local onde você está, 
                  e copie as coordenadas que aparecem na parte inferior.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog 
        open={isCreateDialogOpen} 
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            setNewVehicleName("");
            setNewVehiclePlate("");
            setCurrentGPSPosition(null);
            setManualLatitude("");
            setManualLongitude("");
            setGpsError(null);
            setUseManualLocation(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cadastrar Aparelho como Veículo</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {gpsError && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md space-y-2 text-sm">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">GPS não disponível</span>
                </div>
                <p className="text-muted-foreground text-xs pl-6">
                  {gpsError}
                </p>
                <p className="text-muted-foreground text-xs pl-6">
                  Use a entrada manual abaixo para informar suas coordenadas.
                </p>
              </div>
            )}

            {currentGPSPosition && !useManualLocation && (
              <div className="p-3 bg-muted rounded-md space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="font-medium">Localização GPS obtida:</span>
                </div>
                <div className="pl-6 space-y-1 text-muted-foreground">
                  <div>
                    <span className="font-mono">
                      {currentGPSPosition.latitude.toFixed(6)}, {currentGPSPosition.longitude.toFixed(6)}
                    </span>
                  </div>
                  <div>
                    Precisão: {Math.round(currentGPSPosition.accuracy)}m
                  </div>
                </div>
              </div>
            )}

            {useManualLocation && (
              <div className="p-3 bg-muted rounded-md space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>Entrada Manual de Coordenadas</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="manual-lat" className="text-xs">Latitude (-90 a 90)</Label>
                    <Input
                      id="manual-lat"
                      type="number"
                      step="any"
                      value={manualLatitude}
                      onChange={(e) => setManualLatitude(e.target.value)}
                      placeholder="-23.5505"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="manual-lng" className="text-xs">Longitude (-180 a 180)</Label>
                    <Input
                      id="manual-lng"
                      type="number"
                      step="any"
                      value={manualLongitude}
                      onChange={(e) => setManualLongitude(e.target.value)}
                      placeholder="-46.6333"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Dica: Você pode obter suas coordenadas usando o Google Maps (toque longo no mapa)
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="new-vehicle-name">Nome do Veículo *</Label>
              <Input
                id="new-vehicle-name"
                value={newVehicleName}
                onChange={(e) => setNewVehicleName(e.target.value)}
                placeholder="Ex: Meu Smartphone"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-vehicle-plate">Placa do Veículo *</Label>
              <Input
                id="new-vehicle-plate"
                value={newVehiclePlate}
                onChange={(e) => setNewVehiclePlate(e.target.value.toUpperCase())}
                placeholder="ABC-1234"
                maxLength={8}
              />
              <p className="text-xs text-muted-foreground">
                Use uma placa fictícia para teste (ex: TEST-0001)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setNewVehicleName("");
                setNewVehiclePlate("");
                setCurrentGPSPosition(null);
              }}
              disabled={createVehicleMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateVehicle}
              disabled={createVehicleMutation.isPending || (!currentGPSPosition && !useManualLocation)}
              className="gap-2"
            >
              {createVehicleMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Criar Veículo
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

