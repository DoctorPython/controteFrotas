import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import type { User, UserRole } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isUser: boolean;
  accessToken: string | null; // Token de acesso para requisições API
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const isLoggingInRef = React.useRef(false); // Flag para evitar checkAuth durante login

  const checkAuth = useCallback(async () => {
    // #region agent log
    console.log("[DEBUG FRONTEND] checkAuth iniciado");
    // #endregion
    try {
      setLoading(true);
      
      // Verificar sessão do Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      // #region agent log
      console.log("[DEBUG FRONTEND] checkAuth - resultado getSession", {
        hasSession: !!session,
        hasError: !!sessionError,
        errorMessage: sessionError?.message,
        hasAccessToken: !!session?.access_token
      });
      // #endregion
      
      if (sessionError || !session) {
        // #region agent log
        console.log("[DEBUG FRONTEND] checkAuth - sem sessão, limpando usuário e token");
        fetch('http://127.0.0.1:7242/ingest/5350ddc0-a357-4865-97e5-f7e2dd27cc6d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client/src/contexts/auth-context.tsx:45',message:'Sem sessão - removendo token do localStorage',data:{hasSessionError:!!sessionError,sessionErrorMessage:sessionError?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        setUser(null);
        setAccessToken(null);
        localStorage.removeItem('auth_token');
        setLoading(false);
        return;
      }
      
      // Atualizar token se a sessão foi encontrada
      if (session?.access_token) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/5350ddc0-a357-4865-97e5-f7e2dd27cc6d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client/src/contexts/auth-context.tsx:57',message:'Armazenando token no localStorage',data:{tokenLength:session.access_token.length,hasToken:!!session.access_token},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        setAccessToken(session.access_token);
        localStorage.setItem('auth_token', session.access_token);
      }

      // Buscar dados do usuário na API
      // #region agent log
      console.log("[DEBUG FRONTEND] checkAuth - buscando /api/auth/me");
      // #endregion
      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      // #region agent log
      console.log("[DEBUG FRONTEND] checkAuth - resposta /api/auth/me", {
        status: response.status,
        ok: response.ok
      });
      // #endregion

      if (response.ok) {
        const userData = await response.json();
        // #region agent log
        console.log("[DEBUG FRONTEND] checkAuth - usuário encontrado", { userId: userData?.id });
        // #endregion
        setUser(userData);
      } else {
        // #region agent log
        console.log("[DEBUG FRONTEND] checkAuth - erro na API, limpando usuário");
        // #endregion
        setUser(null);
      }
    } catch (error) {
      // #region agent log
      console.error("[DEBUG FRONTEND] checkAuth - erro capturado", error);
      // #endregion
      console.error("Erro ao verificar autenticação:", error);
      setUser(null);
    } finally {
      // #region agent log
      console.log("[DEBUG FRONTEND] checkAuth - finalizando, desativando loading");
      // #endregion
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    // #region agent log
    console.log("[DEBUG FRONTEND] Login iniciado no frontend", { email });
    // #endregion
    try {
      isLoggingInRef.current = true; // Marcar que estamos fazendo login
      setLoading(true);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/5350ddc0-a357-4865-97e5-f7e2dd27cc6d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client/src/contexts/auth-context.tsx:62',message:'Fazendo requisição fetch',data:{url:'/api/auth/login'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
      // #endregion
      
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/5350ddc0-a357-4865-97e5-f7e2dd27cc6d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client/src/contexts/auth-context.tsx:70',message:'Resposta recebida',data:{status:response.status,statusText:response.statusText,ok:response.ok},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
      // #endregion

      if (!response.ok) {
        const error = await response.json();
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/5350ddc0-a357-4865-97e5-f7e2dd27cc6d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client/src/contexts/auth-context.tsx:72',message:'Erro na resposta',data:{errorMessage:error.message,error},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
        // #endregion
        throw new Error(error.message || "Erro ao fazer login");
      }

      const data = await response.json();
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/5350ddc0-a357-4865-97e5-f7e2dd27cc6d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client/src/contexts/auth-context.tsx:75',message:'Dados recebidos com sucesso',data:{hasUser:!!data.user,hasSession:!!data.session,hasAccessToken:!!data.session?.access_token},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
      // #endregion
      
      // Armazenar token no Supabase client (opcional - apenas para compatibilidade)
      // Fazemos isso de forma não bloqueante para não travar o login
      if (data.session?.access_token && import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
        // #region agent log
        console.log("[DEBUG FRONTEND] Configurando sessão Supabase (não bloqueante)", { 
          hasAccessToken: !!data.session.access_token, 
          hasRefreshToken: !!data.session.refresh_token
        });
        // #endregion
        // Executar setSession de forma não bloqueante com timeout
        Promise.race([
          supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          }).then(({ data: sessionData, error: sessionError }) => {
            // #region agent log
            console.log("[DEBUG FRONTEND] Resultado setSession", { 
              hasSession: !!sessionData.session,
              hasError: !!sessionError,
              errorMessage: sessionError?.message
            });
            // #endregion
            if (sessionError) {
              console.warn("[DEBUG FRONTEND] Erro ao configurar sessão Supabase (não crítico):", sessionError);
            }
          }).catch((sessionErr) => {
            // #region agent log
            console.error("[DEBUG FRONTEND] Exceção ao configurar sessão Supabase:", sessionErr);
            // #endregion
            console.warn("[DEBUG FRONTEND] Erro ao configurar sessão Supabase (não crítico):", sessionErr);
          }),
          new Promise((resolve) => setTimeout(resolve, 2000)) // Timeout de 2 segundos
        ]).catch(() => {
          console.warn("[DEBUG FRONTEND] Timeout ao configurar sessão Supabase (não crítico)");
        });
      } else {
        // #region agent log
        console.log("[DEBUG FRONTEND] Pulando setSession - variáveis de ambiente não configuradas ou sem token", {
          hasUrl: !!import.meta.env.VITE_SUPABASE_URL,
          hasKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
          hasToken: !!data.session?.access_token
        });
        // #endregion
      }

      // #region agent log
      console.log("[DEBUG FRONTEND] Definindo usuário no estado", { userId: data.user?.id, userEmail: data.user?.email });
      // #endregion
      setUser(data.user);
      // Armazenar token para uso nas requisições API
      if (data.session?.access_token) {
        // #region agent log
        console.log("[DEBUG FRONTEND] Armazenando token de acesso");
        fetch('http://127.0.0.1:7242/ingest/5350ddc0-a357-4865-97e5-f7e2dd27cc6d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client/src/contexts/auth-context.tsx:193',message:'Armazenando token após login bem-sucedido',data:{tokenLength:data.session.access_token.length,hasToken:!!data.session.access_token},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        setAccessToken(data.session.access_token);
        // Também armazenar no localStorage como backup
        localStorage.setItem('auth_token', data.session.access_token);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/5350ddc0-a357-4865-97e5-f7e2dd27cc6d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client/src/contexts/auth-context.tsx:199',message:'Token armazenado no localStorage após login',data:{storedToken:localStorage.getItem('auth_token')?.substring(0,20)||'none'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
      }
      // #region agent log
      console.log("[DEBUG FRONTEND] Redirecionando para dashboard", { userId: data.user?.id });
      // #endregion
      setLocation("/");
      // #region agent log
      console.log("[DEBUG FRONTEND] Redirecionamento executado");
      // #endregion
      // Aguardar um pouco antes de permitir checkAuth novamente
      setTimeout(() => {
        isLoggingInRef.current = false;
      }, 1000);
    } catch (error) {
      // #region agent log
      console.error("[DEBUG FRONTEND] Erro capturado no frontend", { 
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined
      });
      // #endregion
      console.error("Erro no login:", error);
      isLoggingInRef.current = false; // Resetar flag em caso de erro
      throw error;
    } finally {
      // #region agent log
      console.log("[DEBUG FRONTEND] Desativando loading");
      // #endregion
      setLoading(false);
    }
  }, [setLocation]);

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
      }

      await supabase.auth.signOut();
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('auth_token');
      setLocation("/login");
    } catch (error) {
      console.error("Erro no logout:", error);
    } finally {
      setLoading(false);
    }
  }, [setLocation]);

  useEffect(() => {
    // Só verificar autenticação se não houver usuário já definido e não estivermos fazendo login
    // Isso evita limpar o usuário após um login bem-sucedido
    if (!user && !isLoggingInRef.current) {
      checkAuth();
    }

    // Escutar mudanças na autenticação do Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // #region agent log
      console.log("[DEBUG FRONTEND] onAuthStateChange", { 
        event, 
        hasSession: !!session, 
        hasUser: !!user,
        isLoggingIn: isLoggingInRef.current
      });
      // #endregion
      
      // Ignorar eventos durante o processo de login
      if (isLoggingInRef.current) {
        // #region agent log
        console.log("[DEBUG FRONTEND] onAuthStateChange ignorado - login em progresso");
        // #endregion
        return;
      }
      
      if (event === "SIGNED_OUT" || !session) {
        // Só limpar usuário se realmente não houver sessão
        if (!session) {
          setUser(null);
        }
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        // Só verificar autenticação se não houver usuário já definido
        if (!user) {
          await checkAuth();
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [checkAuth, user]); // Adicionar user como dependência

  // Carregar token do localStorage na inicialização
  React.useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      setAccessToken(storedToken);
    }
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    isUser: user?.role === "user",
    accessToken,
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}


