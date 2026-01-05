-- ============================================
-- Hub Flexibase - Schema Inicial
-- Execute este script no SQL Editor do Supabase
-- http://192.168.1.220:54323/project/default/sql
-- ============================================

-- 1. Criar o schema 'hub' para separar dos outros dados
CREATE SCHEMA IF NOT EXISTS hub;

-- 2. Criar enum para níveis de acesso
CREATE TYPE hub.access_level AS ENUM ('editor', 'viewer', 'locked');

-- 3. Criar enum para roles de usuário
CREATE TYPE hub.user_role AS ENUM ('admin', 'user');

-- ============================================
-- TABELA: profiles
-- Extensão dos usuários do auth.users
-- ============================================
CREATE TABLE hub.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    role hub.user_role DEFAULT 'user' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índice para busca por role
CREATE INDEX idx_profiles_role ON hub.profiles(role);

-- ============================================
-- TABELA: applications
-- Aplicações disponíveis no hub
-- ============================================
CREATE TABLE hub.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT NOT NULL DEFAULT 'Box',
    color TEXT NOT NULL DEFAULT '#6366f1',
    port INTEGER NOT NULL,
    base_url TEXT NOT NULL DEFAULT 'http://192.168.1.220',
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    display_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_port UNIQUE (port)
);

-- Índice para ordenação
CREATE INDEX idx_applications_order ON hub.applications(display_order);
CREATE INDEX idx_applications_active ON hub.applications(is_active);

-- ============================================
-- TABELA: permissions
-- Permissões de usuários para aplicações
-- ============================================
CREATE TABLE hub.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES hub.profiles(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES hub.applications(id) ON DELETE CASCADE,
    access_level hub.access_level DEFAULT 'locked' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_user_app UNIQUE (user_id, application_id)
);

-- Índices para consultas frequentes
CREATE INDEX idx_permissions_user ON hub.permissions(user_id);
CREATE INDEX idx_permissions_app ON hub.permissions(application_id);

-- ============================================
-- TRIGGERS: Atualizar updated_at automaticamente
-- ============================================
CREATE OR REPLACE FUNCTION hub.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON hub.profiles
    FOR EACH ROW EXECUTE FUNCTION hub.update_updated_at();

CREATE TRIGGER applications_updated_at
    BEFORE UPDATE ON hub.applications
    FOR EACH ROW EXECUTE FUNCTION hub.update_updated_at();

CREATE TRIGGER permissions_updated_at
    BEFORE UPDATE ON hub.permissions
    FOR EACH ROW EXECUTE FUNCTION hub.update_updated_at();

-- ============================================
-- TRIGGER: Criar perfil automaticamente ao registrar
-- ============================================
CREATE OR REPLACE FUNCTION hub.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO hub.profiles (id, full_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION hub.handle_new_user();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE hub.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE hub.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE hub.permissions ENABLE ROW LEVEL SECURITY;

-- PROFILES: Usuário vê apenas seu próprio perfil, admin vê todos
CREATE POLICY "Users can view own profile" ON hub.profiles
    FOR SELECT USING (
        auth.uid() = id OR 
        EXISTS (SELECT 1 FROM hub.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Users can update own profile" ON hub.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles" ON hub.profiles
    FOR ALL USING (
        EXISTS (SELECT 1 FROM hub.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- APPLICATIONS: Todos autenticados podem ver apps ativos
CREATE POLICY "Authenticated users can view active apps" ON hub.applications
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND is_active = true
    );

CREATE POLICY "Admins can view all apps" ON hub.applications
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM hub.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can manage apps" ON hub.applications
    FOR ALL USING (
        EXISTS (SELECT 1 FROM hub.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- PERMISSIONS: Usuário vê apenas suas permissões, admin vê todas
CREATE POLICY "Users can view own permissions" ON hub.permissions
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (SELECT 1 FROM hub.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can manage permissions" ON hub.permissions
    FOR ALL USING (
        EXISTS (SELECT 1 FROM hub.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ============================================
-- DADOS INICIAIS: Inserir as 5 aplicações existentes
-- ============================================
INSERT INTO hub.applications (name, description, icon, color, port, display_order) VALUES
    ('Gerador de Imagem', 'Ferramenta para criação e edição de imagens', 'Image', '#8B5CF6', 8080, 1),
    ('Gerador de QrCode', 'Crie QR Codes personalizados para seus projetos', 'QrCode', '#06B6D4', 8081, 2),
    ('Gestão de Indicadores', 'Sistema completo de gestão e análise de indicadores', 'BarChart3', '#10B981', 8082, 3),
    ('Análise de Editais', 'Análise inteligente de editais e licitações', 'FileSearch', '#F59E0B', 8083, 4),
    ('Controle de Frotas', 'Gerenciamento completo da frota de veículos', 'Car', '#EF4444', 8084, 5);

-- ============================================
-- VIEW: Apps com permissões do usuário atual
-- ============================================
CREATE OR REPLACE VIEW hub.user_apps AS
SELECT 
    a.id,
    a.name,
    a.description,
    a.icon,
    a.color,
    a.port,
    a.base_url,
    a.display_order,
    COALESCE(p.access_level, 'locked'::hub.access_level) as access_level
FROM hub.applications a
LEFT JOIN hub.permissions p ON p.application_id = a.id AND p.user_id = auth.uid()
WHERE a.is_active = true
ORDER BY a.display_order;

-- ============================================
-- FUNÇÃO: Buscar apps do usuário com permissões
-- ============================================
CREATE OR REPLACE FUNCTION hub.get_user_applications()
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    icon TEXT,
    color TEXT,
    port INTEGER,
    base_url TEXT,
    display_order INTEGER,
    access_level hub.access_level
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.name,
        a.description,
        a.icon,
        a.color,
        a.port,
        a.base_url,
        a.display_order,
        COALESCE(p.access_level, 'locked'::hub.access_level) as access_level
    FROM hub.applications a
    LEFT JOIN hub.permissions p ON p.application_id = a.id AND p.user_id = auth.uid()
    WHERE a.is_active = true
    ORDER BY a.display_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Mensagem de sucesso
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ Schema hub criado com sucesso!';
    RAISE NOTICE '📦 Tabelas: profiles, applications, permissions';
    RAISE NOTICE '🔒 RLS configurado';
    RAISE NOTICE '📱 5 aplicações iniciais inseridas';
END $$;

