-- =================================================================
-- Migration 010: Criar perfis para usuários órfãos
-- Cria perfis em public.hub_profiles para usuários que existem em auth.users
-- mas não têm perfil correspondente
-- =================================================================

-- Inserir perfis faltantes para usuários órfãos
INSERT INTO public.hub_profiles (id, email, role, is_active, created_at, updated_at)
SELECT 
    u.id,
    u.email,
    'user' as role, -- Role padrão
    true as is_active, -- Usuário ativo por padrão
    u.created_at,
    u.created_at as updated_at -- Usar created_at como updated_at inicial
FROM auth.users u
LEFT JOIN public.hub_profiles p ON u.id = p.id
WHERE p.id IS NULL -- Apenas usuários sem perfil
ON CONFLICT (id) DO NOTHING; -- Evitar duplicatas se já existir

-- Verificação
DO $$
DECLARE
    orphan_count INTEGER;
    total_users INTEGER;
    total_profiles INTEGER;
BEGIN
    -- Contar usuários órfãos restantes
    SELECT COUNT(*) INTO orphan_count
    FROM auth.users u
    LEFT JOIN public.hub_profiles p ON u.id = p.id
    WHERE p.id IS NULL;
    
    -- Contar total de usuários e perfis
    SELECT COUNT(*) INTO total_users FROM auth.users;
    SELECT COUNT(*) INTO total_profiles FROM public.hub_profiles;
    
    RAISE NOTICE '✅ Migration 010 executada com sucesso';
    RAISE NOTICE '📊 Total de usuários em auth.users: %', total_users;
    RAISE NOTICE '📊 Total de perfis em hub_profiles: %', total_profiles;
    RAISE NOTICE '⚠️ Usuários órfãos restantes: %', orphan_count;
    
    IF orphan_count > 0 THEN
        RAISE WARNING '⚠️ Ainda existem % usuários sem perfil!', orphan_count;
    ELSE
        RAISE NOTICE '✅ Todos os usuários têm perfis!';
    END IF;
END $$;
