-- Script para configurar usuário administrador
-- Execute este script APÓS criar o usuário no Supabase Auth (via Dashboard ou API)

-- IMPORTANTE: Substitua 'admin@fleetrack.com' pelo email do usuário que você criou
-- Este script assume que o usuário já existe na tabela auth.users

-- Atualizar o usuário para ser administrador
UPDATE users 
SET 
  role = 'admin',
  username = COALESCE(username, 'Administrador')
WHERE email = 'admin@fleetrack.com';

-- Verificar se o usuário foi atualizado corretamente
SELECT id, email, username, role, created_at 
FROM users 
WHERE email = 'admin@fleetrack.com';

-- Se o usuário não existir na tabela users mas existir em auth.users,
-- você pode inserir manualmente:
-- INSERT INTO users (id, email, username, role)
-- SELECT id, email, 'Administrador', 'admin'
-- FROM auth.users
-- WHERE email = 'admin@fleetrack.com';





