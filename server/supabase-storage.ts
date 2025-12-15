import { randomUUID } from "crypto";
import { supabase, supabaseAdmin } from "./supabase";
import type { IStorage } from "./storage";
import type {
  Vehicle, InsertVehicle,
  Geofence, InsertGeofence,
  Alert, InsertAlert,
  Trip, SpeedViolation, VehicleStats,
  TrackingData,
  User, InsertUser
} from "@shared/schema";

type VehicleUpdateCallback = (vehicles: Vehicle[]) => void;

export class SupabaseStorage implements IStorage {
  private simulationInterval: ReturnType<typeof setInterval> | null = null;
  private updateCallbacks: Set<VehicleUpdateCallback> = new Set();
  private consecutiveErrors = 0;
  private lastErrorLogTime = 0;
  private readonly ERROR_LOG_INTERVAL = 30000; // Log erro a cada 30 segundos no máximo
  private readonly MAX_CONSECUTIVE_ERRORS = 5; // Pausar simulação após 5 erros consecutivos

  constructor() {
    this.startSimulation();
  }

  onVehicleUpdate(callback: VehicleUpdateCallback): () => void {
    this.updateCallbacks.add(callback);
    return () => this.updateCallbacks.delete(callback);
  }

  private async notifyVehicleUpdate() {
    try {
      const vehicles = await this.getVehicles();
      this.consecutiveErrors = 0; // Reset contador em caso de sucesso
      this.updateCallbacks.forEach(cb => {
        try {
          cb(vehicles);
        } catch (error) {
          console.error("Erro ao executar callback de atualização de veículos:", error);
        }
      });
    } catch (error) {
      this.consecutiveErrors++;
      const now = Date.now();
      
      // Só loga erro se passou tempo suficiente desde o último log
      if (now - this.lastErrorLogTime > this.ERROR_LOG_INTERVAL) {
        const errorMessage = this.isConnectionError(error) 
          ? `Erro de conexão com Supabase (${this.consecutiveErrors} erros consecutivos). Verifique sua conexão com a internet.`
          : `Erro ao notificar atualização de veículos: ${error instanceof Error ? error.message : String(error)}`;
        
        console.warn(errorMessage);
        this.lastErrorLogTime = now;
      }
    }
  }

  private isConnectionError(error: any): boolean {
    if (!error) return false;
    const errorStr = String(error).toLowerCase();
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorDetails = error?.details?.toLowerCase() || '';
    
    return (
      errorStr.includes('fetch failed') ||
      errorStr.includes('timeout') ||
      errorStr.includes('econnreset') ||
      errorStr.includes('enotfound') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('connect') ||
      errorDetails.includes('timeout') ||
      errorDetails.includes('econnreset') ||
      errorDetails.includes('enotfound')
    );
  }

  private startSimulation() {
    this.simulationInterval = setInterval(async () => {
      // Pausar simulação se houver muitos erros consecutivos
      if (this.consecutiveErrors >= this.MAX_CONSECUTIVE_ERRORS) {
        return; // Pula esta iteração
      }

      try {
        const vehicles = await this.getVehicles();
        this.consecutiveErrors = 0; // Reset contador em caso de sucesso
        
        for (const vehicle of vehicles) {
          if (vehicle.status === "moving") {
            const speedChange = (Math.random() - 0.5) * 10;
            const newSpeed = Math.max(0, Math.min(120, vehicle.currentSpeed + speedChange));
            
            const latChange = (Math.random() - 0.5) * 0.002;
            const lngChange = (Math.random() - 0.5) * 0.002;
            
            const headingChange = (Math.random() - 0.5) * 30;
            const newHeading = (vehicle.heading + headingChange + 360) % 360;

            try {
              const { error } = await supabase
                .from("vehicles")
                .update({
                  current_speed: Math.round(newSpeed),
                  heading: Math.round(newHeading),
                  latitude: vehicle.latitude + latChange,
                  longitude: vehicle.longitude + lngChange,
                  last_update: new Date().toISOString(),
                })
                .eq("id", vehicle.id);
              
              if (error) {
                throw error;
              }
            } catch (error) {
              // Erros individuais de veículo não incrementam o contador global
              // para não pausar toda a simulação por um veículo específico
              if (this.isConnectionError(error)) {
                this.consecutiveErrors++;
              }
            }
          }
        }
        
        await this.notifyVehicleUpdate();
      } catch (error) {
        this.consecutiveErrors++;
        const now = Date.now();
        
        // Só loga erro se passou tempo suficiente desde o último log
        if (now - this.lastErrorLogTime > this.ERROR_LOG_INTERVAL) {
          if (this.isConnectionError(error)) {
            console.warn(
              `Erro de conexão com Supabase na simulação (${this.consecutiveErrors}/${this.MAX_CONSECUTIVE_ERRORS} erros). ` +
              `Simulação será pausada temporariamente se o limite for atingido.`
            );
          } else {
            console.error("Erro na simulação de veículos:", error);
          }
          this.lastErrorLogTime = now;
        }
        
        // Se atingiu o limite, pausa a simulação e tenta novamente após um tempo
        if (this.consecutiveErrors >= this.MAX_CONSECUTIVE_ERRORS) {
          console.warn(
            `Simulação pausada devido a ${this.consecutiveErrors} erros consecutivos. ` +
            `Tentando reconectar automaticamente...`
          );
          
          // Tenta reconectar após 30 segundos
          setTimeout(() => {
            this.consecutiveErrors = 0;
            console.log("Tentando retomar simulação...");
          }, 30000);
        }
      }
    }, 3000);
  }

  // ===== VEHICLES =====
  async getVehicles(userId?: string): Promise<Vehicle[]> {
    let query = supabase.from("vehicles").select("*");
    
    // Se userId fornecido, filtrar apenas veículos do usuário
    if (userId) {
      const vehicleIds = await this.getUserVehicleIds(userId);
      if (vehicleIds.length === 0) {
        return []; // Usuário não tem veículos associados
      }
      query = query.in("id", vehicleIds);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return (data || []).map(this.mapVehicleFromDb);
  }

  async getVehicle(id: string): Promise<Vehicle | undefined> {
    const { data, error } = await supabase
      .from("vehicles")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error || !data) return undefined;
    return this.mapVehicleFromDb(data);
  }

  async getVehicleByPlate(licensePlate: string): Promise<Vehicle | undefined> {
    const { data, error } = await supabase
      .from("vehicles")
      .select("*")
      .eq("license_plate", licensePlate)
      .single();
    
    if (error || !data) return undefined;
    return this.mapVehicleFromDb(data);
  }

  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    const id = randomUUID();
    const dbVehicle = this.mapVehicleToDb({ ...vehicle, id });
    
    const { data, error } = await supabase
      .from("vehicles")
      .insert(dbVehicle)
      .select()
      .single();
    
    if (error) throw error;
    this.notifyVehicleUpdate().catch(err => 
      console.error("Erro ao notificar atualização após criar veículo:", err)
    );
    return this.mapVehicleFromDb(data);
  }

  async updateVehicle(id: string, updates: Partial<Vehicle>): Promise<Vehicle | undefined> {
    const dbUpdates = this.mapVehicleToDb(updates as Vehicle);
    
    const { data, error } = await supabase
      .from("vehicles")
      .update(dbUpdates)
      .eq("id", id)
      .select()
      .single();
    
    if (error || !data) return undefined;
    this.notifyVehicleUpdate().catch(err => 
      console.error("Erro ao notificar atualização após atualizar veículo:", err)
    );
    return this.mapVehicleFromDb(data);
  }

  async updateVehicleTracking(trackingData: TrackingData): Promise<Vehicle | undefined> {
    const vehicle = await this.getVehicleByPlate(trackingData.licensePlate);
    if (!vehicle) return undefined;

    // Calcular velocidade baseada na mudança de posição se velocidade não for fornecida ou for 0
    let calculatedSpeed = trackingData.speed;
    const timestamp = trackingData.timestamp ? new Date(trackingData.timestamp).getTime() : Date.now();
    const lastUpdateTime = new Date(vehicle.lastUpdate).getTime();
    const timeDiff = (timestamp - lastUpdateTime) / 1000; // diferença em segundos

    // Se velocidade é 0 ou não foi fornecida, e há mudança de posição, calcular velocidade
    if (calculatedSpeed === 0 && timeDiff > 0) {
      const distance = this.calculateDistance(
        vehicle.latitude,
        vehicle.longitude,
        trackingData.latitude,
        trackingData.longitude
      ); // distância em metros
      const speedInMps = distance / timeDiff; // metros por segundo
      calculatedSpeed = Math.round(speedInMps * 3.6); // converter para km/h
    }

    // Calcular status baseado na velocidade
    // - 0 km/h: stopped
    // - 1-4 km/h: idle
    // - >= 5 km/h: moving
    let status: Vehicle["status"];
    if (calculatedSpeed === 0) {
      status = "stopped";
    } else if (calculatedSpeed < 5) {
      status = "idle";
    } else {
      status = "moving";
    }

    const timestampStr = trackingData.timestamp ?? new Date().toISOString();

    const { data, error } = await supabase
      .from("vehicles")
      .update({
        latitude: trackingData.latitude,
        longitude: trackingData.longitude,
        current_speed: calculatedSpeed,
        heading: trackingData.heading ?? vehicle.heading,
        accuracy: trackingData.accuracy ?? vehicle.accuracy,
        status,
        ignition: calculatedSpeed > 0 ? "on" : "off",
        last_update: timestampStr,
      })
      .eq("id", vehicle.id)
      .select()
      .single();

    if (error || !data) return undefined;
    this.notifyVehicleUpdate().catch(err => 
      console.error("Erro ao notificar atualização após atualizar rastreamento:", err)
    );
    return this.mapVehicleFromDb(data);
  }

  // Função auxiliar para calcular distância entre duas coordenadas (Haversine)
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Raio da Terra em metros
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // distância em metros
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  async deleteVehicle(id: string): Promise<boolean> {
    const { error } = await supabase
      .from("vehicles")
      .delete()
      .eq("id", id);
    
    if (!error) {
      this.notifyVehicleUpdate().catch(err => 
        console.error("Erro ao notificar atualização após deletar veículo:", err)
      );
    }
    return !error;
  }

  // ===== GEOFENCES =====
  async getGeofences(): Promise<Geofence[]> {
    const { data, error } = await supabase
      .from("geofences")
      .select("*");
    
    if (error) throw error;
    return (data || []).map(this.mapGeofenceFromDb);
  }

  async getGeofence(id: string): Promise<Geofence | undefined> {
    const { data, error } = await supabase
      .from("geofences")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error || !data) return undefined;
    return this.mapGeofenceFromDb(data);
  }

  async createGeofence(geofence: InsertGeofence): Promise<Geofence> {
    const id = randomUUID();
    const dbGeofence = this.mapGeofenceToDb({ ...geofence, id });
    
    const { data, error } = await supabase
      .from("geofences")
      .insert(dbGeofence)
      .select()
      .single();
    
    if (error) throw error;
    return this.mapGeofenceFromDb(data);
  }

  async updateGeofence(id: string, updates: Partial<Geofence>): Promise<Geofence | undefined> {
    const dbUpdates = this.mapGeofenceToDb(updates as Geofence);
    
    const { data, error } = await supabase
      .from("geofences")
      .update(dbUpdates)
      .eq("id", id)
      .select()
      .single();
    
    if (error || !data) return undefined;
    return this.mapGeofenceFromDb(data);
  }

  async deleteGeofence(id: string): Promise<boolean> {
    const { error } = await supabase
      .from("geofences")
      .delete()
      .eq("id", id);
    
    return !error;
  }

  // ===== ALERTS =====
  async getAlerts(userId?: string): Promise<Alert[]> {
    let query = supabase.from("alerts").select("*").order("timestamp", { ascending: false });
    
    // Se userId fornecido, filtrar apenas alertas dos veículos do usuário
    if (userId) {
      const vehicleIds = await this.getUserVehicleIds(userId);
      if (vehicleIds.length === 0) {
        return []; // Usuário não tem veículos associados
      }
      query = query.in("vehicle_id", vehicleIds);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return (data || []).map(this.mapAlertFromDb);
  }

  async getAlert(id: string): Promise<Alert | undefined> {
    const { data, error } = await supabase
      .from("alerts")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error || !data) return undefined;
    return this.mapAlertFromDb(data);
  }

  async createAlert(alert: InsertAlert): Promise<Alert> {
    const id = randomUUID();
    const dbAlert = this.mapAlertToDb({ ...alert, id });
    
    const { data, error } = await supabase
      .from("alerts")
      .insert(dbAlert)
      .select()
      .single();
    
    if (error) throw error;
    return this.mapAlertFromDb(data);
  }

  async updateAlert(id: string, updates: Partial<Alert>): Promise<Alert | undefined> {
    const dbUpdates = this.mapAlertToDb(updates as Alert);
    
    const { data, error } = await supabase
      .from("alerts")
      .update(dbUpdates)
      .eq("id", id)
      .select()
      .single();
    
    if (error || !data) return undefined;
    return this.mapAlertFromDb(data);
  }

  async markAllAlertsRead(): Promise<void> {
    const { error } = await supabase
      .from("alerts")
      .update({ read: true })
      .eq("read", false);
    
    if (error) {
      console.error("Erro ao marcar alertas como lidos:", error);
      throw error;
    }
  }

  async clearReadAlerts(): Promise<void> {
    const { error } = await supabase
      .from("alerts")
      .delete()
      .eq("read", true);
    
    if (error) {
      console.error("Erro ao limpar alertas lidos:", error);
      throw error;
    }
  }

  // ===== TRIPS (gerados dinamicamente) =====
  async getTrips(vehicleId: string, startDate: string, endDate: string, userId?: string): Promise<Trip[]> {
    // Se userId fornecido, verificar se o veículo pertence ao usuário
    if (userId) {
      const vehicleIds = await this.getUserVehicleIds(userId);
      if (!vehicleIds.includes(vehicleId)) {
        return []; // Veículo não pertence ao usuário
      }
    }
    // Gera viagem simulada (mesmo comportamento do MemStorage)
    return [this.generateSampleTrip(vehicleId, startDate, endDate)];
  }

  async getSpeedViolations(startDate: string, endDate: string, userId?: string): Promise<SpeedViolation[]> {
    const violations = await this.generateSpeedViolations(startDate, endDate);
    
    // Se userId fornecido, filtrar apenas violações dos veículos do usuário
    if (userId) {
      const vehicleIds = await this.getUserVehicleIds(userId);
      return violations.filter(v => vehicleIds.includes(v.vehicleId));
    }
    
    return violations;
  }

  async getSpeedStats(startDate: string, endDate: string, userId?: string): Promise<VehicleStats> {
    const violations = await this.getSpeedViolations(startDate, endDate, userId);
    
    const byVehicle = new Map<string, { count: number; totalExcess: number; lastViolation: string; name: string }>();
    
    violations.forEach(v => {
      const existing = byVehicle.get(v.vehicleId);
      if (existing) {
        existing.count++;
        existing.totalExcess += v.excessSpeed;
        if (new Date(v.timestamp) > new Date(existing.lastViolation)) {
          existing.lastViolation = v.timestamp;
        }
      } else {
        byVehicle.set(v.vehicleId, {
          count: 1,
          totalExcess: v.excessSpeed,
          lastViolation: v.timestamp,
          name: v.vehicleName,
        });
      }
    });
    
    const byDay = new Map<string, number>();
    violations.forEach(v => {
      const day = v.timestamp.split("T")[0];
      byDay.set(day, (byDay.get(day) || 0) + 1);
    });
    
    const topViolators = Array.from(byVehicle.entries())
      .map(([vehicleId, data]) => ({
        vehicleId,
        vehicleName: data.name,
        totalViolations: data.count,
        averageExcessSpeed: data.totalExcess / data.count,
        lastViolation: data.lastViolation,
      }))
      .sort((a, b) => b.totalViolations - a.totalViolations)
      .slice(0, 10);
    
    return {
      totalViolations: violations.length,
      vehiclesWithViolations: byVehicle.size,
      averageExcessSpeed: violations.length > 0 
        ? violations.reduce((sum, v) => sum + v.excessSpeed, 0) / violations.length 
        : 0,
      violationsByDay: Array.from(byDay.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      topViolators,
    };
  }

  // ===== MAPEAMENTO DB <-> APP =====
  private mapVehicleFromDb(row: any): Vehicle {
    return {
      id: row.id,
      name: row.name,
      licensePlate: row.license_plate,
      model: row.model,
      status: row.status,
      ignition: row.ignition,
      currentSpeed: row.current_speed,
      speedLimit: row.speed_limit,
      heading: row.heading,
      latitude: row.latitude,
      longitude: row.longitude,
      accuracy: row.accuracy,
      lastUpdate: row.last_update,
      batteryLevel: row.battery_level,
    };
  }

  private mapVehicleToDb(vehicle: Partial<Vehicle>): any {
    const result: any = {};
    if (vehicle.id !== undefined) result.id = vehicle.id;
    if (vehicle.name !== undefined) result.name = vehicle.name;
    if (vehicle.licensePlate !== undefined) result.license_plate = vehicle.licensePlate;
    if (vehicle.model !== undefined) result.model = vehicle.model;
    if (vehicle.status !== undefined) result.status = vehicle.status;
    if (vehicle.ignition !== undefined) result.ignition = vehicle.ignition;
    if (vehicle.currentSpeed !== undefined) result.current_speed = vehicle.currentSpeed;
    if (vehicle.speedLimit !== undefined) result.speed_limit = vehicle.speedLimit;
    if (vehicle.heading !== undefined) result.heading = vehicle.heading;
    if (vehicle.latitude !== undefined) result.latitude = vehicle.latitude;
    if (vehicle.longitude !== undefined) result.longitude = vehicle.longitude;
    if (vehicle.accuracy !== undefined) result.accuracy = vehicle.accuracy;
    if (vehicle.lastUpdate !== undefined) result.last_update = vehicle.lastUpdate;
    if (vehicle.batteryLevel !== undefined) result.battery_level = vehicle.batteryLevel;
    return result;
  }

  private mapGeofenceFromDb(row: any): Geofence {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      type: row.type,
      active: row.active,
      center: row.center,
      radius: row.radius,
      points: row.points,
      rules: row.rules || [],
      vehicleIds: row.vehicle_ids || [],
      lastTriggered: row.last_triggered,
      color: row.color,
    };
  }

  private mapGeofenceToDb(geofence: Partial<Geofence>): any {
    const result: any = {};
    if (geofence.id !== undefined) result.id = geofence.id;
    if (geofence.name !== undefined) result.name = geofence.name;
    if (geofence.description !== undefined) result.description = geofence.description;
    if (geofence.type !== undefined) result.type = geofence.type;
    if (geofence.active !== undefined) result.active = geofence.active;
    if (geofence.center !== undefined) result.center = geofence.center;
    if (geofence.radius !== undefined) result.radius = geofence.radius;
    if (geofence.points !== undefined) result.points = geofence.points;
    if (geofence.rules !== undefined) result.rules = geofence.rules;
    if (geofence.vehicleIds !== undefined) result.vehicle_ids = geofence.vehicleIds;
    if (geofence.lastTriggered !== undefined) result.last_triggered = geofence.lastTriggered;
    if (geofence.color !== undefined) result.color = geofence.color;
    return result;
  }

  private mapAlertFromDb(row: any): Alert {
    return {
      id: row.id,
      type: row.type,
      priority: row.priority,
      vehicleId: row.vehicle_id,
      vehicleName: row.vehicle_name,
      message: row.message,
      timestamp: row.timestamp,
      read: row.read,
      latitude: row.latitude,
      longitude: row.longitude,
      speed: row.speed,
      speedLimit: row.speed_limit,
      geofenceName: row.geofence_name,
    };
  }

  private mapAlertToDb(alert: Partial<Alert>): any {
    const result: any = {};
    if (alert.id !== undefined) result.id = alert.id;
    if (alert.type !== undefined) result.type = alert.type;
    if (alert.priority !== undefined) result.priority = alert.priority;
    if (alert.vehicleId !== undefined) result.vehicle_id = alert.vehicleId;
    if (alert.vehicleName !== undefined) result.vehicle_name = alert.vehicleName;
    if (alert.message !== undefined) result.message = alert.message;
    if (alert.timestamp !== undefined) result.timestamp = alert.timestamp;
    if (alert.read !== undefined) result.read = alert.read;
    if (alert.latitude !== undefined) result.latitude = alert.latitude;
    if (alert.longitude !== undefined) result.longitude = alert.longitude;
    if (alert.speed !== undefined) result.speed = alert.speed;
    if (alert.speedLimit !== undefined) result.speed_limit = alert.speedLimit;
    if (alert.geofenceName !== undefined) result.geofence_name = alert.geofenceName;
    return result;
  }

  // ===== GERADORES DE DADOS SIMULADOS =====
  private generateSampleTrip(vehicleId: string, startDate: string, endDate: string): Trip {
    const start = new Date(startDate);
    const baseLat = -23.5505;
    const baseLng = -46.6333;
    
    const points: Trip["points"] = [];
    const events: Trip["events"] = [];
    
    let currentTime = new Date(start);
    currentTime.setHours(8, 0, 0, 0);
    const tripEnd = new Date(start);
    tripEnd.setHours(17, 0, 0, 0);
    
    let lat = baseLat;
    let lng = baseLng;
    let totalDistance = 0;
    let stoppedTime = 0;
    let maxSpeed = 0;
    let totalSpeed = 0;
    let speedCount = 0;
    
    events.push({
      id: randomUUID(),
      type: "departure",
      latitude: lat,
      longitude: lng,
      timestamp: currentTime.toISOString(),
      address: "Rua Augusta, 1234 - Consolação, São Paulo",
    });
    
    while (currentTime < tripEnd) {
      const speed = 30 + Math.random() * 50;
      const heading = Math.random() * 360;
      
      lat += (Math.random() - 0.5) * 0.01;
      lng += (Math.random() - 0.5) * 0.01;
      
      points.push({
        latitude: lat,
        longitude: lng,
        speed: Math.round(speed),
        heading: Math.round(heading),
        timestamp: currentTime.toISOString(),
        accuracy: 3 + Math.random() * 5,
      });
      
      totalDistance += speed * (5 / 60);
      if (speed > maxSpeed) maxSpeed = speed;
      totalSpeed += speed;
      speedCount++;
      
      if (Math.random() < 0.02 && speed > 65) {
        events.push({
          id: randomUUID(),
          type: "speed_violation",
          latitude: lat,
          longitude: lng,
          timestamp: currentTime.toISOString(),
          speed: Math.round(speed),
          speedLimit: 60,
        });
      }
      
      if (Math.random() < 0.01) {
        const stopDuration = 5 + Math.random() * 25;
        stoppedTime += stopDuration;
        events.push({
          id: randomUUID(),
          type: "stop",
          latitude: lat,
          longitude: lng,
          timestamp: currentTime.toISOString(),
          duration: stopDuration,
          address: `Rua ${Math.floor(Math.random() * 1000)}, São Paulo`,
        });
      }
      
      currentTime = new Date(currentTime.getTime() + 5 * 60 * 1000);
    }
    
    events.push({
      id: randomUUID(),
      type: "arrival",
      latitude: lat,
      longitude: lng,
      timestamp: currentTime.toISOString(),
      address: "Av. Paulista, 1000 - Bela Vista, São Paulo",
    });
    
    return {
      id: randomUUID(),
      vehicleId,
      startTime: new Date(start.setHours(8, 0, 0, 0)).toISOString(),
      endTime: currentTime.toISOString(),
      totalDistance: Math.round(totalDistance * 1000),
      travelTime: (tripEnd.getTime() - new Date(start.setHours(8, 0, 0, 0)).getTime()) / 60000 - stoppedTime,
      stoppedTime: Math.round(stoppedTime),
      averageSpeed: Math.round(totalSpeed / speedCount),
      maxSpeed: Math.round(maxSpeed),
      stopsCount: events.filter(e => e.type === "stop").length,
      points,
      events: events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
    };
  }

  private async generateSpeedViolations(startDate: string, endDate: string): Promise<SpeedViolation[]> {
    const vehicles = await this.getVehicles();
    const violations: SpeedViolation[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dailyViolations = 5 + Math.floor(Math.random() * 12);
      
      for (let i = 0; i < dailyViolations; i++) {
        const vehicle = vehicles[Math.floor(Math.random() * vehicles.length)];
        if (!vehicle) continue;
        
        const speed = vehicle.speedLimit + 8 + Math.floor(Math.random() * 35);
        
        violations.push({
          id: randomUUID(),
          vehicleId: vehicle.id,
          vehicleName: vehicle.name,
          speed,
          speedLimit: vehicle.speedLimit,
          excessSpeed: speed - vehicle.speedLimit,
          timestamp: new Date(d.getTime() + Math.random() * 86400000).toISOString(),
          latitude: -23.5 + Math.random() * 0.1,
          longitude: -46.6 + Math.random() * 0.1,
          duration: 15 + Math.floor(Math.random() * 90),
        });
      }
    }
    
    return violations.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  private async generateSpeedStats(startDate: string, endDate: string): Promise<VehicleStats> {
    const violations = await this.generateSpeedViolations(startDate, endDate);
    
    const byVehicle = new Map<string, { count: number; totalExcess: number; lastViolation: string; name: string }>();
    
    violations.forEach(v => {
      const existing = byVehicle.get(v.vehicleId);
      if (existing) {
        existing.count++;
        existing.totalExcess += v.excessSpeed;
        if (new Date(v.timestamp) > new Date(existing.lastViolation)) {
          existing.lastViolation = v.timestamp;
        }
      } else {
        byVehicle.set(v.vehicleId, {
          count: 1,
          totalExcess: v.excessSpeed,
          lastViolation: v.timestamp,
          name: v.vehicleName,
        });
      }
    });
    
    const byDay = new Map<string, number>();
    violations.forEach(v => {
      const day = v.timestamp.split("T")[0];
      byDay.set(day, (byDay.get(day) || 0) + 1);
    });
    
    const topViolators = Array.from(byVehicle.entries())
      .map(([vehicleId, data]) => ({
        vehicleId,
        vehicleName: data.name,
        totalViolations: data.count,
        averageExcessSpeed: data.totalExcess / data.count,
        lastViolation: data.lastViolation,
      }))
      .sort((a, b) => b.totalViolations - a.totalViolations)
      .slice(0, 10);
    
    return {
      totalViolations: violations.length,
      vehiclesWithViolations: byVehicle.size,
      averageExcessSpeed: violations.length > 0 
        ? violations.reduce((sum, v) => sum + v.excessSpeed, 0) / violations.length 
        : 0,
      violationsByDay: Array.from(byDay.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      topViolators,
    };
  }

  // ===== AUTHENTICATION & USERS =====
  async getUserByEmail(email: string): Promise<User | undefined> {
    // Usar cliente administrativo para garantir acesso mesmo com RLS
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("email", email)
      .single();
    
    if (error || !data) return undefined;
    return this.mapUserFromDb(data);
  }

  async getUserById(id: string): Promise<User | undefined> {
    // #region agent log
    console.log("[DEBUG] getUserById chamado", { userId: id, timestamp: new Date().toISOString() });
    // #endregion
    // Usar cliente administrativo para garantir acesso mesmo com RLS
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", id)
      .single();
    // #region agent log
    console.log("[DEBUG] Resultado query getUserById", { 
      hasData: !!data, 
      hasError: !!error, 
      errorCode: error?.code, 
      errorMessage: error?.message, 
      dataEmail: data?.email,
      timestamp: new Date().toISOString()
    });
    // #endregion
    
    if (error) {
      console.error("Erro ao buscar usuário por ID:", error);
      return undefined;
    }
    
    if (!data) return undefined;
    return this.mapUserFromDb(data);
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = randomUUID();
    const dbUser = {
      id,
      email: user.email,
      username: user.username,
      role: user.role || "user",
      created_at: new Date().toISOString(),
    };
    
    // Usar cliente administrativo para garantir acesso mesmo com RLS
    const { data, error } = await supabaseAdmin
      .from("users")
      .insert(dbUser)
      .select()
      .single();
    
    if (error) throw error;
    return this.mapUserFromDb(data);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const dbUpdates: any = {};
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.username !== undefined) dbUpdates.username = updates.username;
    if (updates.role !== undefined) dbUpdates.role = updates.role;
    
    // Usar cliente administrativo para garantir acesso mesmo com RLS
    const { data, error } = await supabaseAdmin
      .from("users")
      .update(dbUpdates)
      .eq("id", id)
      .select()
      .single();
    
    if (error || !data) return undefined;
    return this.mapUserFromDb(data);
  }

  // ===== USER-VEHICLE RELATIONSHIPS =====
  async getUserVehicles(userId: string): Promise<Vehicle[]> {
    const vehicleIds = await this.getUserVehicleIds(userId);
    if (vehicleIds.length === 0) {
      return [];
    }
    
    const { data, error } = await supabase
      .from("vehicles")
      .select("*")
      .in("id", vehicleIds);
    
    if (error) throw error;
    return (data || []).map(this.mapVehicleFromDb);
  }

  async getUserVehicleIds(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from("user_vehicles")
      .select("vehicle_id")
      .eq("user_id", userId);
    
    if (error) throw error;
    return (data || []).map(row => row.vehicle_id);
  }

  async createUserVehicle(userId: string, vehicleId: string): Promise<void> {
    const { error } = await supabase
      .from("user_vehicles")
      .insert({
        user_id: userId,
        vehicle_id: vehicleId,
      });
    
    if (error) throw error;
  }

  async deleteUserVehicle(userId: string, vehicleId: string): Promise<void> {
    const { error } = await supabase
      .from("user_vehicles")
      .delete()
      .eq("user_id", userId)
      .eq("vehicle_id", vehicleId);
    
    if (error) throw error;
  }

  // ===== MAPEAMENTO USER DB <-> APP =====
  private mapUserFromDb(row: any): User {
    return {
      id: row.id,
      email: row.email,
      username: row.username,
      role: row.role,
      createdAt: row.created_at,
    };
  }
}