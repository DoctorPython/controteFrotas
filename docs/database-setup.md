# Configuração do Banco de Dados - Sistema de Autenticação

Este documento descreve como configurar o banco de dados no Supabase para o sistema de autenticação.

## Passos para Configuração

### 1. Executar o Script SQL

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Copie e cole o conteúdo do arquivo `database-setup.sql`
5. Execute o script

### 2. Criar Usuário Administrador

Após executar o script, você precisa criar um usuário administrador. Você pode fazer isso de duas formas:

#### Opção A: Via Supabase Dashboard

1. Vá em **Authentication** > **Users**
2. Clique em **Add User** > **Create New User**
3. Preencha:
   - Email: `admin@fleetrack.com` (ou o email desejado)
   - Password: (defina uma senha segura)
   - Auto Confirm User: ✅ (marcado)
4. Após criar, vá em **SQL Editor** e execute:

```sql
-- Atualizar o usuário criado para ser admin
UPDATE users 
SET role = 'admin', username = 'Administrador'
WHERE email = 'martinsgomes527@gmail.com';
```

#### Opção B: Via API/Script

```sql
-- Primeiro, crie o usuário no auth.users (isso deve ser feito via Supabase Auth API)
-- Depois, atualize o role para admin:
UPDATE users 
SET role = 'admin'
WHERE email = 'seu-email@exemplo.com';
```

### 3. Associar Veículos a Usuários

Para associar veículos a usuários (necessário para usuários comuns verem seus veículos):

```sql
-- Exemplo: Associar veículo com ID 'v1' ao usuário com email 'usuario@exemplo.com'
INSERT INTO user_vehicles (user_id, vehicle_id)
SELECT u.id, 'v1'
FROM users u
WHERE u.email = 'usuario@exemplo.com';
```

### 4. Variáveis de Ambiente

Certifique-se de que as seguintes variáveis estão configuradas no arquivo `.env`:

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_KEY=sua-service-key-aqui
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

Você pode encontrar essas chaves em:
- Supabase Dashboard > **Settings** > **API**

## Estrutura das Tabelas

### Tabela `users`
- `id` (UUID): ID do usuário (referência a auth.users)
- `email` (TEXT): Email do usuário
- `username` (TEXT): Nome de usuário
- `role` (TEXT): Nível de permissão ('admin' ou 'user')
- `created_at` (TIMESTAMPTZ): Data de criação

### Tabela `user_vehicles`
- `user_id` (UUID): ID do usuário
- `vehicle_id` (UUID): ID do veículo
- Chave primária composta: (user_id, vehicle_id)

## Segurança (RLS)

O script configura Row Level Security (RLS) para garantir que:
- Usuários comuns só veem seus próprios dados
- Administradores veem todos os dados
- Apenas administradores podem criar/deletar relacionamentos usuário-veículo

## Testando

Após a configuração, você pode testar:

1. Fazer login com o usuário administrador
2. Verificar que todos os veículos são visíveis
3. Criar um usuário comum e associar alguns veículos
4. Fazer login com o usuário comum e verificar que apenas seus veículos são visíveis


