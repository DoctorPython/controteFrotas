import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

// Carregar variáveis de ambiente
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.resolve(__dirname, "..", ".env") });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Erro: SUPABASE_URL e SUPABASE_SERVICE_KEY são obrigatórios no arquivo .env");
  process.exit(1);
}

// Criar cliente Supabase com service key (permite operações admin)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function changeUserPassword(email: string, newPassword: string) {
  try {
    console.log(`\n🔍 Buscando usuário com email: ${email}...`);
    
    // Buscar usuário pelo email usando a API Admin
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error("❌ Erro ao listar usuários:", listError.message);
      return false;
    }

    const user = users.users.find(u => u.email === email);
    
    if (!user) {
      console.error(`❌ Usuário com email ${email} não encontrado.`);
      return false;
    }

    console.log(`✅ Usuário encontrado: ${user.email} (ID: ${user.id})`);
    console.log(`\n🔐 Alterando senha...`);

    // Atualizar senha usando a API Admin
    const { data, error } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (error) {
      console.error("❌ Erro ao alterar senha:", error.message);
      return false;
    }

    console.log(`\n✅ Senha alterada com sucesso para o usuário ${email}!`);
    console.log(`\n📝 Detalhes:`);
    console.log(`   Email: ${data.user.email}`);
    console.log(`   ID: ${data.user.id}`);
    console.log(`   Última atualização: ${data.user.updated_at}`);
    
    return true;
  } catch (error: any) {
    console.error("❌ Erro inesperado:", error.message);
    return false;
  }
}

// Executar script
const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.log("\n📖 Uso: tsx scripts/change-user-password.ts <email> <nova-senha>");
  console.log("\nExemplo:");
  console.log("  tsx scripts/change-user-password.ts martinsgomes527@gmail.com MinhaNovaSenha123!");
  console.log("\n⚠️  A senha deve ter pelo menos 6 caracteres.");
  process.exit(1);
}

if (newPassword.length < 6) {
  console.error("❌ Erro: A senha deve ter pelo menos 6 caracteres.");
  process.exit(1);
}

changeUserPassword(email, newPassword)
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error("❌ Erro fatal:", error);
    process.exit(1);
  });

