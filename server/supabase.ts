import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

// Garante carregamento do .env
config({ path: path.resolve(process.cwd(), ".env") });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("SUPABASE_URL e SUPABASE_SERVICE_KEY são obrigatórios. Verifique seu arquivo .env");
}

// Cliente para operações de autenticação (pode ter contexto de usuário)
export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Cliente administrativo separado que sempre usa service key e ignora RLS
// Este cliente não deve ser usado para operações de autenticação
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
});