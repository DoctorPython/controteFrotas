# Guia de Configuração - Sistema de Autenticação

## ✅ Passo 1: Migração do Banco de Dados

**Status: CONCLUÍDO** ✅

A migração `create_auth_tables_and_policies` foi aplicada com sucesso no projeto **projetoFrota**.

As seguintes estruturas foram criadas:
- ✅ Tabela `users` com RLS habilitado
- ✅ Tabela `user_vehicles` com RLS habilitado
- ✅ Índices para performance
- ✅ Função e trigger para criação automática de usuários
- ✅ Políticas de segurança (RLS)

## 📝 Passo 2: Criar Usuário Administrador

Você precisa criar um usuário administrador. Siga um dos métodos abaixo:

### Método A: Via Supabase Dashboard (Recomendado)

1. Acesse: https://app.supabase.com/project/rtgdjxgbmdjzxwkhllxt
2. Vá em **Authentication** > **Users**
3. Clique em **Add User** > **Create New User**
4. Preencha:
   - **Email**: `admin@fleetrack.com` (ou o email desejado)
   - **Password**: (defina uma senha segura)
   - **Auto Confirm User**: ✅ (marcado)
   - **User Metadata** (opcional):
     ```json
     {
       "username": "Administrador",
       "role": "admin"
     }
     ```
5. Clique em **Create User**

### Método B: Via SQL (se o usuário já existe)

Se você já criou o usuário no auth, execute o script `setup-admin-user.sql`:

```sql
UPDATE users 
SET role = 'admin', username = 'Administrador'
WHERE email = 'admin@fleetrack.com';
```

## 🔑 Passo 3: Configurar Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env`:

```env
# Supabase Backend (já deve existir)
SUPABASE_URL=https://rtgdjxgbmdjzxwkhllxt.supabase.co
SUPABASE_SERVICE_KEY=sua-service-key-aqui

# Supabase Frontend (NOVAS - adicione estas)
VITE_SUPABASE_URL=https://rtgdjxgbmdjzxwkhllxt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0Z2RqeGdibWRqenh3a2hsbHh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNDM5MzIsImV4cCI6MjA4MDYxOTkzMn0.SEIsjtx904wV1svpFGQfJe1ya9NXF2EfhpgmrI2xixY
```

**Nota**: A chave `VITE_SUPABASE_ANON_KEY` acima é a chave anon do seu projeto. Você também pode usar a chave publishable moderna:
- `sb_publishable_bh4NINNrdi18X9lK-z1P1A_lZ6DZGW8`

Para obter a `SUPABASE_SERVICE_KEY`:
1. Acesse o Supabase Dashboard
2. Vá em **Settings** > **API**
3. Copie a **service_role key** (mantenha segura!)

## 🚗 Passo 4: Associar Veículos a Usuários (Opcional)

Para usuários comuns verem seus veículos, você precisa associá-los. Existem 10 veículos no banco atualmente.

### Associar veículos a um usuário comum:

```sql
-- Substitua 'usuario@exemplo.com' pelo email do usuário
-- Substitua '4b50e29f-93e3-479e-b3e9-ab4bc33d17e4' pelo ID do veículo

INSERT INTO user_vehicles (user_id, vehicle_id)
SELECT u.id, '4b50e29f-93e3-479e-b3e9-ab4bc33d17e4'::uuid
FROM users u
WHERE u.email = 'usuario@exemplo.com';
```

### Associar múltiplos veículos:

```sql
-- Associar todos os veículos a um usuário (útil para testes)
INSERT INTO user_vehicles (user_id, vehicle_id)
SELECT 
  (SELECT id FROM users WHERE email = 'usuario@exemplo.com'),
  id
FROM vehicles;
```

## 🧪 Passo 5: Testar o Sistema

1. **Inicie o servidor**:
   ```bash
   npm run dev
   ```

2. **Acesse a aplicação**:
   - Abra: http://localhost:5000
   - Você será redirecionado para `/login`

3. **Faça login com o usuário admin**:
   - Email: `admin@fleetrack.com` (ou o email que você configurou)
   - Senha: (a senha que você definiu)

4. **Verifique**:
   - ✅ Você deve ver todos os veículos (admin tem acesso total)
   - ✅ Menu completo disponível
   - ✅ Pode criar/editar/excluir veículos

5. **Teste com usuário comum**:
   - Crie um novo usuário via Dashboard
   - Associe alguns veículos a ele (Passo 4)
   - Faça login e verifique:
     - ✅ Apenas seus veículos são visíveis
     - ✅ Menu limitado (sem Veículos CRUD, Geofences, Relatórios)
     - ✅ Não pode criar/editar/excluir veículos

## 📊 Informações do Projeto

- **Projeto**: projetoFrota
- **ID**: rtgdjxgbmdjzxwkhllxt
- **URL**: https://rtgdjxgbmdjzxwkhllxt.supabase.co
- **Região**: sa-east-1 (São Paulo)
- **Status**: ACTIVE_HEALTHY

## 🔒 Segurança

- ✅ Row Level Security (RLS) habilitado
- ✅ Políticas de segurança configuradas
- ✅ Tokens JWT para autenticação
- ✅ Validação de permissões no backend e frontend

## 🆘 Troubleshooting

### Erro: "Token inválido ou expirado"
- Verifique se as variáveis de ambiente estão configuradas corretamente
- Certifique-se de que `VITE_SUPABASE_ANON_KEY` está no `.env`

### Erro: "Usuário não encontrado"
- Verifique se o usuário foi criado no Supabase Auth
- Execute o script `setup-admin-user.sql` para garantir que o registro existe na tabela `users`

### Usuário comum não vê veículos
- Verifique se os veículos foram associados na tabela `user_vehicles`
- Execute: `SELECT * FROM user_vehicles WHERE user_id = 'id-do-usuario';`

### Erro ao criar veículo (403 Forbidden)
- Apenas administradores podem criar veículos
- Verifique se o usuário tem `role = 'admin'` na tabela `users`





