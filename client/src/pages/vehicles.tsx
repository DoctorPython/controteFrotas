import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Plus, Trash2, Edit2, Truck, MapPin, Gauge, 
  Battery, AlertTriangle, Check, X, Navigation, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertVehicleSchema } from "@shared/schema";
import type { Vehicle, InsertVehicle } from "@shared/schema";

type VehicleFormState = Omit<InsertVehicle, "lastUpdate"> & {
  lastUpdate?: string;
};

const createEmptyForm = (): VehicleFormState => ({
  name: "",
  licensePlate: "",
  model: "",
  status: "stopped",
  ignition: "off",
  currentSpeed: 0,
  speedLimit: 60,
  heading: 0,
  latitude: -23.5505,
  longitude: -46.6333,
  accuracy: 5,
  batteryLevel: undefined,
});

const buildFormFromVehicle = (vehicle: Vehicle): VehicleFormState => ({
  name: vehicle.name,
  licensePlate: vehicle.licensePlate,
  model: vehicle.model ?? "",
  status: vehicle.status,
  ignition: vehicle.ignition,
  currentSpeed: vehicle.currentSpeed,
  speedLimit: vehicle.speedLimit,
  heading: vehicle.heading,
  latitude: vehicle.latitude,
  longitude: vehicle.longitude,
  accuracy: vehicle.accuracy,
  batteryLevel: vehicle.batteryLevel,
});

export default function VehiclesPage() {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isGettingGPS, setIsGettingGPS] = useState(false);
  
  const [formData, setFormData] = useState<VehicleFormState>(() => createEmptyForm());

  const { data: vehicles = [], isLoading: isLoadingVehicles } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: VehicleFormState) => {
      const response = await apiRequest("POST", "/api/vehicles", {
        ...data,
        lastUpdate: new Date().toISOString(),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      toast({ title: "Veículo criado", description: "O novo veículo foi criado com sucesso." });
      closeForm();
    },
    onError: (error: Error) => {
      toast({ 
        title: "Erro", 
        description: error.message || "Não foi possível criar o veículo.", 
        variant: "destructive" 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/vehicles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      toast({ title: "Veículo excluído", description: "O veículo foi excluído com sucesso." });
      if (selectedVehicle?.id === editingVehicle?.id) {
        setSelectedVehicle(null);
      }
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível excluir o veículo.", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: VehicleFormState }) => {
      const response = await apiRequest("PATCH", `/api/vehicles/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      toast({ title: "Veículo atualizado", description: "As alterações foram salvas com sucesso." });
      closeForm();
    },
    onError: (error: Error) => {
      toast({ 
        title: "Erro", 
        description: error.message || "Não foi possível atualizar o veículo.", 
        variant: "destructive" 
      });
    },
  });

  const resetForm = () => {
    setFormData(createEmptyForm());
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setFormMode("create");
    setEditingVehicle(null);
    resetForm();
  };

  const handleOpenCreate = () => {
    setFormMode("create");
    setEditingVehicle(null);
    resetForm();
    setIsFormOpen(true);
  };

  const handleOpenEdit = (vehicle: Vehicle) => {
    setFormMode("edit");
    setEditingVehicle(vehicle);
    setFormData(buildFormFromVehicle(vehicle));
    setIsFormOpen(true);
  };

  const getCurrentGPSLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "GPS não disponível",
        description: "Seu navegador não suporta geolocalização ou você está usando HTTP. Use HTTPS (ngrok) para GPS funcionar.",
        variant: "destructive",
      });
      return;
    }

    setIsGettingGPS(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const accuracy = Math.round(position.coords.accuracy ?? 0);
        const heading = position.coords.heading ?? 0;

        setFormData({
          ...formData,
          latitude,
          longitude,
          accuracy,
          heading,
        });

        setIsGettingGPS(false);
        toast({
          title: "Localização obtida!",
          description: `GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (Precisão: ${accuracy}m)`,
        });
      },
      (error) => {
        setIsGettingGPS(false);
        let errorMessage = "Erro ao obter localização GPS.";
        
        if (error.message.includes("secure") || error.message.includes("Only secure origins")) {
          errorMessage = "GPS requer HTTPS. Use ngrok ou configure HTTPS no servidor.";
        } else if (error.code === error.PERMISSION_DENIED) {
          errorMessage = "Permissão de localização negada. Permita o acesso à localização nas configurações do navegador.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = "Localização não disponível. Verifique se o GPS está ativo.";
        } else if (error.code === error.TIMEOUT) {
          errorMessage = "Tempo esgotado ao obter localização. Tente novamente.";
        } else {
          errorMessage = error.message;
        }

        toast({
          title: "Erro ao obter GPS",
          description: errorMessage,
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

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      closeForm();
    } else {
      setIsFormOpen(true);
    }
  };

  const handleSubmit = () => {
    // Validação básica
    if (!formData.name.trim()) {
      toast({ title: "Erro", description: "Digite um nome para o veículo.", variant: "destructive" });
      return;
    }
    if (!formData.licensePlate.trim()) {
      toast({ title: "Erro", description: "Digite a placa do veículo.", variant: "destructive" });
      return;
    }

    // Validação de campos numéricos obrigatórios
    const numericFields = {
      currentSpeed: formData.currentSpeed,
      speedLimit: formData.speedLimit,
      heading: formData.heading,
      latitude: formData.latitude,
      longitude: formData.longitude,
      accuracy: formData.accuracy,
    };

    for (const [field, value] of Object.entries(numericFields)) {
      if (value === null || value === undefined || isNaN(Number(value))) {
        const fieldNames: Record<string, string> = {
          currentSpeed: "Velocidade Atual",
          speedLimit: "Limite de Velocidade",
          heading: "Direção",
          latitude: "Latitude",
          longitude: "Longitude",
          accuracy: "Precisão",
        };
        toast({ 
          title: "Erro de validação", 
          description: `O campo "${fieldNames[field]}" deve ser um número válido.`, 
          variant: "destructive" 
        });
        return;
      }
    }

    // Garantir que todos os valores numéricos sejam números válidos
    const validatedData = {
      ...formData,
      currentSpeed: Number(formData.currentSpeed),
      speedLimit: Number(formData.speedLimit),
      heading: Number(formData.heading),
      latitude: Number(formData.latitude),
      longitude: Number(formData.longitude),
      accuracy: Number(formData.accuracy),
      batteryLevel: formData.batteryLevel !== undefined && formData.batteryLevel !== null 
        ? Number(formData.batteryLevel) 
        : undefined,
      lastUpdate: new Date().toISOString(),
    };

    // Validação com Zod
    const validation = insertVehicleSchema.safeParse(validatedData);

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast({ 
        title: "Erro de validação", 
        description: firstError?.message || "Dados inválidos.", 
        variant: "destructive" 
      });
      return;
    }

    const isEditing = formMode === "edit" && editingVehicle;
    if (isEditing) {
      // Para atualização, remover campos que não devem ser atualizados
      const { lastUpdate, ...updateData } = validatedData;
      updateMutation.mutate({ id: editingVehicle.id, data: updateData });
      return;
    }
    createMutation.mutate(validatedData);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Nunca";
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="h-full flex flex-col" data-testid="vehicles-page">
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-bold mb-1" data-testid="text-page-title">Gestão de Veículos</h1>
        <p className="text-muted-foreground">Cadastre e gerencie os veículos da frota</p>
      </div>

      <div className="flex-1 flex min-h-0">
        <div className="w-[500px] flex-shrink-0 border-r border-border bg-sidebar flex flex-col">
          <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
            <h2 className="font-semibold text-lg">Lista de Veículos</h2>
          <Button onClick={handleOpenCreate} className="gap-2" data-testid="button-create-vehicle">
            <Plus className="h-4 w-4" />
            Novo Veículo
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {isLoadingVehicles ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))
            ) : vehicles.length === 0 ? (
              <div className="text-center py-8">
                <Truck className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum veículo cadastrado</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Clique em "Novo Veículo" para adicionar um veículo
                </p>
              </div>
            ) : (
              vehicles.map(vehicle => (
                <Card
                  key={vehicle.id}
                  className={cn(
                    "cursor-pointer hover-elevate",
                    selectedVehicle?.id === vehicle.id && "ring-2 ring-primary"
                  )}
                  onClick={() => setSelectedVehicle(vehicle)}
                  data-testid={`vehicle-${vehicle.id}`}
                >
                  <CardContent className="p-4">
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
                    
                    {vehicle.model && (
                      <p className="text-xs text-muted-foreground mb-2">
                        {vehicle.model}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
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
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                      <MapPin className="h-3 w-3" />
                      <span className="font-mono">
                        {vehicle.latitude.toFixed(6)}, {vehicle.longitude.toFixed(6)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(vehicle);
                        }}
                        data-testid={`edit-${vehicle.id}`}
                      >
                        <Edit2 className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Tem certeza que deseja excluir este veículo?")) {
                            deleteMutation.mutate(vehicle.id);
                          }
                        }}
                        data-testid={`delete-${vehicle.id}`}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedVehicle ? (
          <div className="p-6 space-y-6 overflow-y-auto">
            <div>
              <h3 className="text-xl font-semibold mb-2">{selectedVehicle.name}</h3>
              <p className="text-sm text-muted-foreground">{selectedVehicle.licensePlate}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Informações Básicas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Modelo:</span>
                    <span className="font-medium">{selectedVehicle.model || "Não informado"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant="secondary" className="text-xs">
                      {getStatusLabel(selectedVehicle.status)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ignição:</span>
                    <span className="font-medium">{selectedVehicle.ignition === "on" ? "Ligada" : "Desligada"}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Localização</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Latitude:</span>
                    <span className="font-mono text-xs">{selectedVehicle.latitude.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Longitude:</span>
                    <span className="font-mono text-xs">{selectedVehicle.longitude.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Precisão:</span>
                    <span className="font-medium">{selectedVehicle.accuracy}m</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Velocidade</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Atual:</span>
                    <span className={cn(
                      "font-mono font-medium",
                      selectedVehicle.currentSpeed > selectedVehicle.speedLimit && "text-destructive"
                    )}>
                      {selectedVehicle.currentSpeed} km/h
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Limite:</span>
                    <span className="font-mono font-medium">{selectedVehicle.speedLimit} km/h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Direção:</span>
                    <span className="font-mono font-medium">{selectedVehicle.heading}°</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Sistema</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {selectedVehicle.batteryLevel !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bateria:</span>
                      <span className="font-medium">{selectedVehicle.batteryLevel}%</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Última atualização:</span>
                    <span className="font-medium text-xs">{formatDate(selectedVehicle.lastUpdate)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Truck className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Selecione um veículo para ver os detalhes</p>
            </div>
          </div>
        )}
      </div>

      <Dialog open={isFormOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {formMode === "edit" ? "Editar Veículo" : "Novo Veículo"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Caminhão 01"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="licensePlate">Placa *</Label>
                <Input
                  id="licensePlate"
                  value={formData.licensePlate}
                  onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })}
                  placeholder="ABC-1234"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Modelo</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="Ex: Mercedes Actros"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: Vehicle["status"]) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="moving">Em Movimento</SelectItem>
                    <SelectItem value="stopped">Parado</SelectItem>
                    <SelectItem value="idle">Ocioso</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ignition">Ignição *</Label>
                <Select
                  value={formData.ignition}
                  onValueChange={(value: Vehicle["ignition"]) => setFormData({ ...formData, ignition: value })}
                >
                  <SelectTrigger id="ignition">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="on">Ligada</SelectItem>
                    <SelectItem value="off">Desligada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentSpeed">Velocidade Atual (km/h) *</Label>
                <Input
                  id="currentSpeed"
                  type="number"
                  min="0"
                  value={formData.currentSpeed ?? ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "") return;
                    const numValue = Number(value);
                    if (!isNaN(numValue)) {
                      setFormData({ ...formData, currentSpeed: numValue });
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="speedLimit">Limite de Velocidade (km/h) *</Label>
                <Input
                  id="speedLimit"
                  type="number"
                  min="0"
                  value={formData.speedLimit ?? ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "") return;
                    const numValue = Number(value);
                    if (!isNaN(numValue)) {
                      setFormData({ ...formData, speedLimit: numValue });
                    }
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="heading">Direção (0-360°) *</Label>
                <Input
                  id="heading"
                  type="number"
                  min="0"
                  max="360"
                  value={formData.heading ?? ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "") return;
                    const numValue = Number(value);
                    if (!isNaN(numValue)) {
                      setFormData({ ...formData, heading: numValue });
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accuracy">Precisão (metros) *</Label>
                <Input
                  id="accuracy"
                  type="number"
                  min="0"
                  value={formData.accuracy ?? ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "") return;
                    const numValue = Number(value);
                    if (!isNaN(numValue)) {
                      setFormData({ ...formData, accuracy: numValue });
                    }
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Localização GPS</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={getCurrentGPSLocation}
                  disabled={isGettingGPS}
                  className="gap-2"
                >
                  {isGettingGPS ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Obtendo GPS...
                    </>
                  ) : (
                    <>
                      <Navigation className="h-4 w-4" />
                      Obter Localização GPS
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Clique no botão para preencher automaticamente latitude, longitude, precisão e direção
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude (-90 a 90) *</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  min="-90"
                  max="90"
                  value={formData.latitude ?? ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || value === "-") {
                      // Permite campo vazio ou sinal negativo durante digitação
                      return;
                    }
                    const numValue = Number(value);
                    if (!isNaN(numValue)) {
                      setFormData({ ...formData, latitude: numValue });
                    }
                  }}
                  onBlur={(e) => {
                    // Garante que sempre tenha um valor válido ao sair do campo
                    const value = e.target.value;
                    if (value === "" || isNaN(Number(value))) {
                      setFormData({ ...formData, latitude: formData.latitude ?? 0 });
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude (-180 a 180) *</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  min="-180"
                  max="180"
                  value={formData.longitude ?? ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || value === "-") {
                      // Permite campo vazio ou sinal negativo durante digitação
                      return;
                    }
                    const numValue = Number(value);
                    if (!isNaN(numValue)) {
                      setFormData({ ...formData, longitude: numValue });
                    }
                  }}
                  onBlur={(e) => {
                    // Garante que sempre tenha um valor válido ao sair do campo
                    const value = e.target.value;
                    if (value === "" || isNaN(Number(value))) {
                      setFormData({ ...formData, longitude: formData.longitude ?? 0 });
                    }
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="batteryLevel">Nível de Bateria (%)</Label>
              <Input
                id="batteryLevel"
                type="number"
                min="0"
                max="100"
                value={formData.batteryLevel ?? ""}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "") {
                    setFormData({ ...formData, batteryLevel: undefined });
                    return;
                  }
                  const numValue = Number(value);
                  if (!isNaN(numValue)) {
                    setFormData({ ...formData, batteryLevel: numValue });
                  }
                }}
                placeholder="Opcional"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeForm} disabled={isSaving}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving}>
              <Check className="h-4 w-4 mr-2" />
              {isSaving ? "Salvando..." : formMode === "edit" ? "Salvar Alterações" : "Criar Veículo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}

