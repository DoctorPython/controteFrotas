import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { authenticate, authorize, getUserIdFromRequest, isAdmin } from "./auth";
import { supabase } from "./supabase";
import { 
  insertVehicleSchema, 
  insertGeofenceSchema, 
  insertAlertSchema, 
  trackingDataSchema,
  loginSchema 
} from "@shared/schema";

const clients = new Set<WebSocket>();

function broadcastVehicles(vehicles: unknown[]) {
  const message = JSON.stringify({ type: "vehicles", data: vehicles });
  
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      try {
      client.send(message);
      } catch (error) {
        console.error("Erro ao enviar mensagem WebSocket:", error);
        clients.delete(client);
      }
    }
  });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  storage.onVehicleUpdate(broadcastVehicles);

  // ===== AUTHENTICATION ROUTES =====
  app.post("/api/auth/login", async (req, res) => {
    // #region agent log
    console.log("[DEBUG] Login iniciado", { email: req.body?.email, timestamp: new Date().toISOString() });
    // #endregion
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/5350ddc0-a357-4865-97e5-f7e2dd27cc6d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'server/routes.ts:45',message:'Validação falhou',data:{errors:parsed.error.errors},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        return res.status(400).json({ 
          error: "Dados inválidos", 
          details: parsed.error.errors 
        });
      }

      const { email, password } = parsed.data;
      // #region agent log
      console.log("[DEBUG] Iniciando autenticação Supabase", { email, timestamp: new Date().toISOString() });
      // #endregion

      // Autenticar com Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      // #region agent log
      console.log("[DEBUG] Resultado autenticação Supabase", { 
        hasUser: !!authData?.user, 
        hasError: !!authError, 
        errorMessage: authError?.message, 
        userId: authData?.user?.id,
        timestamp: new Date().toISOString()
      });
      // #endregion

      if (authError || !authData.user) {
        return res.status(401).json({ 
          error: "Credenciais inválidas",
          message: "Email ou senha incorretos"
        });
      }

      // #region agent log
      console.log("[DEBUG] Buscando usuário na tabela users", { userId: authData.user.id, timestamp: new Date().toISOString() });
      // #endregion
      // Buscar dados do usuário na tabela users
      const user = await storage.getUserById(authData.user.id);
      // #region agent log
      console.log("[DEBUG] Resultado getUserById", { 
        found: !!user, 
        userId: user?.id, 
        userEmail: user?.email,
        timestamp: new Date().toISOString()
      });
      // #endregion
      if (!user) {
        return res.status(401).json({ 
          error: "Usuário não encontrado",
          message: "Conta não configurada corretamente"
        });
      }

      // #region agent log
      console.log("[DEBUG] Login bem-sucedido, enviando resposta", { 
        userId: user.id, 
        hasSession: !!authData.session?.access_token,
        timestamp: new Date().toISOString()
      });
      // #endregion
      res.json({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
        },
        token: authData.session?.access_token,
        session: {
          access_token: authData.session?.access_token || "",
          refresh_token: authData.session?.refresh_token || "",
          expires_in: authData.session?.expires_in || 3600,
        },
      });
    } catch (error) {
      // #region agent log
      console.log("[DEBUG] Erro capturado no login", { 
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      // #endregion
      console.error("Erro no login:", error);
      res.status(500).json({ error: "Erro interno ao fazer login" });
    }
  });

  app.post("/api/auth/logout", authenticate, async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        await supabase.auth.signOut();
      }
      res.json({ success: true, message: "Logout realizado com sucesso" });
    } catch (error) {
      console.error("Erro no logout:", error);
      res.status(500).json({ error: "Erro ao fazer logout" });
    }
  });

  app.get("/api/auth/me", authenticate, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const user = await storage.getUserById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      res.json({
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      });
    } catch (error) {
      console.error("Erro ao buscar dados do usuário:", error);
      res.status(500).json({ error: "Erro ao buscar dados do usuário" });
    }
  });

  wss.on("connection", (ws) => {
    clients.add(ws);
    console.log("WebSocket client connected");

    storage.getVehicles()
      .then(vehicles => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "vehicles", data: vehicles }));
        }
      })
      .catch(error => {
        // Reduz verbosidade para erros de conexão recorrentes
        const isConnectionError = error?.message?.includes('fetch failed') || 
                                  error?.message?.includes('timeout') ||
                                  error?.details?.includes('timeout');
        
        if (isConnectionError) {
          console.warn("Erro de conexão ao buscar veículos para WebSocket. Verifique a conexão com o Supabase.");
        } else {
          console.error("Erro ao buscar veículos para WebSocket:", error);
        }
      });

    ws.on("close", () => {
      clients.delete(ws);
      console.log("WebSocket client disconnected");
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
      clients.delete(ws);
    });
  });

  app.get("/api/vehicles", authenticate, async (req, res) => {
    try {
      const userId = isAdmin(req) ? undefined : getUserIdFromRequest(req);
      const vehicles = await storage.getVehicles(userId);
      // Desabilitar cache HTTP para evitar requisições condicionais sem token
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'Pragma': 'no-cache',
        'Expires': '0',
      });
      res.json(vehicles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vehicles" });
    }
  });

  app.get("/api/vehicles/:id", async (req, res) => {
    try {
      const vehicle = await storage.getVehicle(req.params.id);
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      res.json(vehicle);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vehicle" });
    }
  });

  app.post("/api/vehicles", authenticate, authorize(["admin"]), async (req, res) => {
    try {
      const parsed = insertVehicleSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid vehicle data", details: parsed.error.errors });
      }
      const vehicle = await storage.createVehicle(parsed.data);
      res.status(201).json(vehicle);
    } catch (error) {
      res.status(500).json({ error: "Failed to create vehicle" });
    }
  });

  // Endpoint para receber dados de rastreamento em tempo real
  app.post("/api/tracking", async (req, res) => {
    try {
      const parsed = trackingDataSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          error: "Dados de rastreamento inválidos", 
          details: parsed.error.errors 
        });
      }

      const vehicle = await storage.updateVehicleTracking(parsed.data);
      if (!vehicle) {
        return res.status(404).json({ 
          error: "Veículo não encontrado", 
          message: `Nenhum veículo encontrado com a placa: ${parsed.data.licensePlate}` 
        });
      }

      res.json({
        success: true,
        message: "Localização atualizada com sucesso",
        vehicle: {
          id: vehicle.id,
          name: vehicle.name,
          licensePlate: vehicle.licensePlate,
          latitude: vehicle.latitude,
          longitude: vehicle.longitude,
          currentSpeed: vehicle.currentSpeed,
          status: vehicle.status,
          lastUpdate: vehicle.lastUpdate,
        }
      });
    } catch (error) {
      console.error("Erro ao processar dados de rastreamento:", error);
      res.status(500).json({ error: "Falha ao processar dados de rastreamento" });
    }
  });

  app.patch("/api/vehicles/:id", authenticate, authorize(["admin"]), async (req, res) => {
    try {
      const parsed = insertVehicleSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid vehicle data", details: parsed.error.errors });
      }
      const vehicle = await storage.updateVehicle(req.params.id, parsed.data);
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      res.json(vehicle);
    } catch (error) {
      res.status(500).json({ error: "Failed to update vehicle" });
    }
  });

  app.delete("/api/vehicles/:id", authenticate, authorize(["admin"]), async (req, res) => {
    try {
      const success = await storage.deleteVehicle(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete vehicle" });
    }
  });

  app.get("/api/geofences", authenticate, authorize(["admin"]), async (req, res) => {
    try {
      const geofences = await storage.getGeofences();
      res.json(geofences);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch geofences" });
    }
  });

  app.get("/api/geofences/:id", authenticate, authorize(["admin"]), async (req, res) => {
    try {
      const geofence = await storage.getGeofence(req.params.id);
      if (!geofence) {
        return res.status(404).json({ error: "Geofence not found" });
      }
      res.json(geofence);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch geofence" });
    }
  });

  app.post("/api/geofences", authenticate, authorize(["admin"]), async (req, res) => {
    try {
      const geofence = await storage.createGeofence(req.body);
      res.status(201).json(geofence);
    } catch (error) {
      res.status(500).json({ error: "Failed to create geofence" });
    }
  });

  app.patch("/api/geofences/:id", authenticate, authorize(["admin"]), async (req, res) => {
    try {
      const geofence = await storage.updateGeofence(req.params.id, req.body);
      if (!geofence) {
        return res.status(404).json({ error: "Geofence not found" });
      }
      res.json(geofence);
    } catch (error) {
      res.status(500).json({ error: "Failed to update geofence" });
    }
  });

  app.delete("/api/geofences/:id", authenticate, authorize(["admin"]), async (req, res) => {
    try {
      const success = await storage.deleteGeofence(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Geofence not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete geofence" });
    }
  });

  app.get("/api/alerts", authenticate, async (req, res) => {
    try {
      const userId = isAdmin(req) ? undefined : getUserIdFromRequest(req);
      const alerts = await storage.getAlerts(userId);
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  });

  app.get("/api/alerts/:id", async (req, res) => {
    try {
      const alert = await storage.getAlert(req.params.id);
      if (!alert) {
        return res.status(404).json({ error: "Alert not found" });
      }
      res.json(alert);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch alert" });
    }
  });

  app.post("/api/alerts", async (req, res) => {
    try {
      const alert = await storage.createAlert(req.body);
      res.status(201).json(alert);
    } catch (error) {
      res.status(500).json({ error: "Failed to create alert" });
    }
  });

  app.patch("/api/alerts/:id", async (req, res) => {
    try {
      const alert = await storage.updateAlert(req.params.id, req.body);
      if (!alert) {
        return res.status(404).json({ error: "Alert not found" });
      }
      res.json(alert);
    } catch (error) {
      res.status(500).json({ error: "Failed to update alert" });
    }
  });

  app.post("/api/alerts/mark-all-read", async (req, res) => {
    try {
      await storage.markAllAlertsRead();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark alerts as read" });
    }
  });

  app.delete("/api/alerts/clear-read", async (req, res) => {
    try {
      await storage.clearReadAlerts();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear read alerts" });
    }
  });

  app.get("/api/trips", authenticate, async (req, res) => {
    try {
      const { vehicleId, startDate, endDate } = req.query;
      
      if (!vehicleId || typeof vehicleId !== "string") {
        return res.status(400).json({ error: "Vehicle ID is required" });
      }
      
      const start = startDate ? String(startDate) : new Date().toISOString();
      const end = endDate ? String(endDate) : new Date().toISOString();
      
      const userId = isAdmin(req) ? undefined : getUserIdFromRequest(req);
      const trips = await storage.getTrips(vehicleId, start, end, userId);
      res.json(trips);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trips" });
    }
  });

  app.get("/api/reports/violations", authenticate, authorize(["admin"]), async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      const start = startDate ? String(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const end = endDate ? String(endDate) : new Date().toISOString();
      
      const violations = await storage.getSpeedViolations(start, end);
      res.json(violations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch violations" });
    }
  });

  app.get("/api/reports/speed-stats", authenticate, authorize(["admin"]), async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      const start = startDate ? String(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const end = endDate ? String(endDate) : new Date().toISOString();
      
      const stats = await storage.getSpeedStats(start, end);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch speed stats" });
    }
  });

  return httpServer;
}
