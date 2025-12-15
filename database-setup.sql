-- Script de configuração do banco de dados para autenticação
-- Execute este script no SQL Editor do Supabase

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de relacionamento usuário-veículo (many-to-many)
CREATE TABLE IF NOT EXISTS user_vehicles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, vehicle_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_vehicles_user_id ON user_vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_vehicles_vehicle_id ON user_vehicles(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Função para criar usuário automaticamente quando um usuário é criado no auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar registro na tabela users quando um usuário é criado no auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Row Level Security (RLS) - Usuários podem ver apenas seus próprios dados
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas seus próprios dados
CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Política: Admins podem ver todos os usuários
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS para user_vehicles
ALTER TABLE user_vehicles ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas seus próprios relacionamentos
CREATE POLICY "Users can view own vehicle relationships"
  ON user_vehicles FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Admins podem ver todos os relacionamentos
CREATE POLICY "Admins can view all vehicle relationships"
  ON user_vehicles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Política: Admins podem inserir relacionamentos
CREATE POLICY "Admins can insert vehicle relationships"
  ON user_vehicles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Política: Admins podem deletar relacionamentos
CREATE POLICY "Admins can delete vehicle relationships"
  ON user_vehicles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Comentários nas tabelas
COMMENT ON TABLE users IS 'Tabela de usuários do sistema com níveis de permissão';
COMMENT ON TABLE user_vehicles IS 'Relacionamento many-to-many entre usuários e veículos';
COMMENT ON COLUMN users.role IS 'Nível de permissão: admin (acesso total) ou user (acesso restrito)';


