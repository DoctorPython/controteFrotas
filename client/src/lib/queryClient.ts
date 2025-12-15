import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { supabase } from "./supabase";

async function getAuthHeaders(): Promise<HeadersInit> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  
  // Tentar obter token do localStorage primeiro (mais confiável)
  const storedToken = localStorage.getItem('auth_token');
  if (storedToken) {
    headers["Authorization"] = `Bearer ${storedToken}`;
    return headers;
  }
  
  // Fallback: tentar obter do Supabase
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
      // Armazenar no localStorage para próxima vez
      localStorage.setItem('auth_token', session.access_token);
    }
  } catch (error) {
    console.warn("[DEBUG] Erro ao obter sessão do Supabase:", error);
  }
  
  return headers;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers = await getAuthHeaders();
  
  // Remover Content-Type se não houver dados (para GET, DELETE, etc)
  if (!data && method !== "POST" && method !== "PATCH" && method !== "PUT") {
    delete (headers as any)["Content-Type"];
  }
  
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const headers = await getAuthHeaders();
    const url = queryKey.join("/") as string;
    
    const res = await fetch(url, {
      headers: {
        ...headers,
        'Cache-Control': 'no-store',
        'Pragma': 'no-cache',
      },
      credentials: "include",
      cache: 'no-store',
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
