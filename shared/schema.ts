import { z } from "zod";

export type VehicleStatus = "moving" | "stopped" | "idle" | "offline";
export type IgnitionStatus = "on" | "off";
export type AlertType = "speed" | "geofence_entry" | "geofence_exit" | "geofence_dwell" | "system";
export type AlertPriority = "critical" | "warning" | "info";
export type GeofenceType = "circle" | "polygon";
export type GeofenceRuleType = "entry" | "exit" | "dwell" | "time_violation";

export const vehicleSchema = z.object({
  id: z.string(),
  name: z.string(),
  licensePlate: z.string(),
  model: z.string().optional(),
  status: z.enum(["moving", "stopped", "idle", "offline"]),
  ignition: z.enum(["on", "off"]),
  currentSpeed: z.number(),
  speedLimit: z.number(),
  heading: z.number(),
  latitude: z.number(),
  longitude: z.number(),
  accuracy: z.number(),
  lastUpdate: z.string(),
  batteryLevel: z.number().optional(),
});

export type Vehicle = z.infer<typeof vehicleSchema>;

export const insertVehicleSchema = vehicleSchema.omit({ id: true });
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;

export const locationPointSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  speed: z.number(),
  heading: z.number(),
  timestamp: z.string(),
  accuracy: z.number().optional(),
});

export type LocationPoint = z.infer<typeof locationPointSchema>;

export const routeEventSchema = z.object({
  id: z.string(),
  type: z.enum(["departure", "arrival", "stop", "speed_violation", "geofence_entry", "geofence_exit"]),
  latitude: z.number(),
  longitude: z.number(),
  timestamp: z.string(),
  duration: z.number().optional(),
  speed: z.number().optional(),
  speedLimit: z.number().optional(),
  geofenceName: z.string().optional(),
  address: z.string().optional(),
});

export type RouteEvent = z.infer<typeof routeEventSchema>;

export const tripSchema = z.object({
  id: z.string(),
  vehicleId: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  totalDistance: z.number(),
  travelTime: z.number(),
  stoppedTime: z.number(),
  averageSpeed: z.number(),
  maxSpeed: z.number(),
  stopsCount: z.number(),
  points: z.array(locationPointSchema),
  events: z.array(routeEventSchema),
});

export type Trip = z.infer<typeof tripSchema>;

export const geofenceRuleSchema = z.object({
  type: z.enum(["entry", "exit", "dwell", "time_violation"]),
  enabled: z.boolean(),
  dwellTimeMinutes: z.number().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  toleranceSeconds: z.number().optional(),
});

export type GeofenceRule = z.infer<typeof geofenceRuleSchema>;

export const geofenceSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  type: z.enum(["circle", "polygon"]),
  active: z.boolean(),
  center: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
  radius: z.number().optional(),
  points: z.array(z.object({
    latitude: z.number(),
    longitude: z.number(),
  })).optional(),
  rules: z.array(geofenceRuleSchema),
  vehicleIds: z.array(z.string()),
  lastTriggered: z.string().optional(),
  color: z.string().optional(),
});

export type Geofence = z.infer<typeof geofenceSchema>;

export const insertGeofenceSchema = geofenceSchema.omit({ id: true });
export type InsertGeofence = z.infer<typeof insertGeofenceSchema>;

export const alertSchema = z.object({
  id: z.string(),
  type: z.enum(["speed", "geofence_entry", "geofence_exit", "geofence_dwell", "system"]),
  priority: z.enum(["critical", "warning", "info"]),
  vehicleId: z.string(),
  vehicleName: z.string(),
  message: z.string(),
  timestamp: z.string(),
  read: z.boolean(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  speed: z.number().optional(),
  speedLimit: z.number().optional(),
  geofenceName: z.string().optional(),
});

export type Alert = z.infer<typeof alertSchema>;

export const insertAlertSchema = alertSchema.omit({ id: true });
export type InsertAlert = z.infer<typeof insertAlertSchema>;

export const speedViolationSchema = z.object({
  id: z.string(),
  vehicleId: z.string(),
  vehicleName: z.string(),
  speed: z.number(),
  speedLimit: z.number(),
  excessSpeed: z.number(),
  timestamp: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  duration: z.number(),
});

export type SpeedViolation = z.infer<typeof speedViolationSchema>;

export const vehicleStatsSchema = z.object({
  totalViolations: z.number(),
  vehiclesWithViolations: z.number(),
  averageExcessSpeed: z.number(),
  violationsByDay: z.array(z.object({
    date: z.string(),
    count: z.number(),
  })),
  topViolators: z.array(z.object({
    vehicleId: z.string(),
    vehicleName: z.string(),
    totalViolations: z.number(),
    averageExcessSpeed: z.number(),
    lastViolation: z.string(),
  })),
});

export type VehicleStats = z.infer<typeof vehicleStatsSchema>;

// User Role Types
export type UserRole = "admin" | "user";

// User Schema
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  username: z.string(),
  role: z.enum(["admin", "user"]),
  createdAt: z.string().optional(),
});

export type User = z.infer<typeof userSchema>;

export const insertUserSchema = z.object({
  email: z.string().email(),
  username: z.string(),
  role: z.enum(["admin", "user"]).default("user"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;

// User-Vehicle Relationship Schema
export const userVehicleSchema = z.object({
  userId: z.string(),
  vehicleId: z.string(),
});

export type UserVehicle = z.infer<typeof userVehicleSchema>;

// Authentication Schemas
export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const authResponseSchema = z.object({
  user: userSchema,
  token: z.string(),
  session: z.object({
    access_token: z.string(),
    refresh_token: z.string(),
    expires_in: z.number(),
  }).optional(),
});

export type AuthResponse = z.infer<typeof authResponseSchema>;

// Schema para dados de rastreamento em tempo real
export const trackingDataSchema = z.object({
  licensePlate: z.string().min(1, "Placa do veículo é obrigatória"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  speed: z.number().min(0),
  heading: z.number().min(0).max(360).optional(),
  accuracy: z.number().min(0).optional(),
  timestamp: z.string().optional(),
});

export type TrackingData = z.infer<typeof trackingDataSchema>;

// Owner Authentication Schemas
export const ownerAuthSchema = z.object({
  licensePlate: z.string().min(1, "Placa do veículo é obrigatória"),
});

export type OwnerAuthInput = z.infer<typeof ownerAuthSchema>;

export const ownerAuthResponseSchema = z.object({
  token: z.string(),
  vehicle: z.object({
    id: z.string(),
    name: z.string(),
    licensePlate: z.string(),
    model: z.string().optional(),
    status: z.string(),
  }),
  expiresIn: z.number(),
});

export type OwnerAuthResponse = z.infer<typeof ownerAuthResponseSchema>;

// Owner Token Payload (for JWT)
export interface OwnerTokenPayload {
  vehicleId: string;
  type: "owner";
  iat: number;
  exp: number;
}
