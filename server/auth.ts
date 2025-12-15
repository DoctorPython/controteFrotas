import type { Request, Response, NextFunction } from "express";
import { supabase, supabaseAdmin } from "./supabase";
import type { UserRole } from "@shared/schema";

// Estender o tipo Request para incluir informações do usuário
declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: string;
      email: string;
      username: string;
      role: UserRole;
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


