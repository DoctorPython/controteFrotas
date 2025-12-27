import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { supabase, supabaseAdmin } from "./supabase";
import type { UserRole, OwnerTokenPayload } from "@shared/schema";
import { storage } from "./storage";

// Estender o tipo Request para incluir informações do usuário
declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: string;
      email: string;
      username: string;
      role: UserRole;
    };
    ownerVehicle?: {
      id: string;
    };
  }
}

/**
 * Middleware para autenticar requisições usando token JWT do Supabase
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // Se for uma requisição condicional de cache (If-None-Match), retornar 304 sem corpo
      // Isso evita erros 401 em requisições de validação de cache do navegador
      if (req.headers['if-none-match']) {
        res.status(304).end();
        return;
      }
      res.status(401).json({ error: "Token de autenticação não fornecido" });
      return;
    }

    const token = authHeader.substring(7); // Remove "Bearer "

    // Verificar token com Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({ error: "Token inválido ou expirado" });
      return;
    }

    // Buscar dados do usuário na tabela users usando cliente administrativo
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, email, username, role")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      res.status(401).json({ error: "Usuário não encontrado" });
      return;
    }

    // Adicionar dados do usuário à requisição
    req.user = {
      id: userData.id,
      email: userData.email,
      username: userData.username,
      role: userData.role as UserRole,
    };

    next();
  } catch (error) {
    console.error("Erro na autenticação:", error);
    res.status(500).json({ error: "Erro interno na autenticação" });
  }
}

/**
 * Middleware para autorizar acesso baseado em roles
 */
export function authorize(roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Usuário não autenticado" });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ 
        error: "Acesso negado. Permissões insuficientes.",
        requiredRoles: roles,
        userRole: req.user.role,
      });
      return;
    }

    next();
  };
}

/**
 * Helper para extrair ID do usuário da requisição
 */
export function getUserIdFromRequest(req: Request): string | undefined {
  return req.user?.id;
}

/**
 * Helper para verificar se o usuário é admin
 */
export function isAdmin(req: Request): boolean {
  return req.user?.role === "admin";
}

// ===== OWNER AUTHENTICATION (JWT) =====

/**
 * Gera um token JWT para autenticação de proprietário de veículo
 */
export function generateOwnerToken(vehicleId: string): string {
  const secret = process.env.OWNER_JWT_SECRET || "owner-secret-key-change-in-production";
  const expiresIn = process.env.OWNER_JWT_EXPIRES_IN || "7d"; // 7 dias padrão
  
  const payload = {
    vehicleId,
    type: "owner" as const,
  };

  return jwt.sign(payload, secret, { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] });
}

/**
 * Valida e decodifica um token JWT de proprietário
 */
export function verifyOwnerToken(token: string): OwnerTokenPayload | null {
  try {
    const secret = process.env.OWNER_JWT_SECRET || "owner-secret-key-change-in-production";
    const decoded = jwt.verify(token, secret) as OwnerTokenPayload;
    
    if (decoded.type !== "owner" || !decoded.vehicleId) {
      return null;
    }
    
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Middleware para autenticar requisições de proprietários usando token JWT
 */
export async function authenticateOwner(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Token de autenticação não fornecido" });
      return;
    }

    const token = authHeader.substring(7); // Remove "Bearer "
    
    // Validar token JWT
    const payload = verifyOwnerToken(token);
    
    if (!payload) {
      res.status(401).json({ error: "Token inválido ou expirado" });
      return;
    }

    // Verificar se o veículo ainda existe no banco
    const vehicle = await storage.getVehicle(payload.vehicleId);
    
    if (!vehicle) {
      res.status(401).json({ error: "Veículo não encontrado" });
      return;
    }

    // Adicionar dados do veículo à requisição
    req.ownerVehicle = {
      id: vehicle.id,
    };

    next();
  } catch (error) {
    console.error("Erro na autenticação de proprietário:", error);
    res.status(500).json({ error: "Erro interno na autenticação" });
  }
}


