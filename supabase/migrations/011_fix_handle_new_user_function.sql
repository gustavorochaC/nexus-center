-- =================================================================
-- Migration 011: Corrigir função handle_new_user para criar perfis corretamente
-- Garante que o trigger funcione para novos usuários
-- =================================================================

-- Remover função antiga se existir (para garantir limpeza)
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Criar função corrigida com tratamento de erros
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Inserir perfil em public.hub_profiles
    INSERT INTO public.hub_profiles (
        id,
        email,
        role,
        is_active,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        'user', -- Role padrão
        true,   -- Usuário ativo por padrão
        COALESCE(NEW.created_at, NOW()),
        COALESCE(NEW.created_at, NOW())
    )
    ON CONFLICT (id) DO UPDATE
        SET 
            email = EXCLUDED.email,
            updated_at = NOW();
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log do erro (em produção, usar sistema de logs adequado)
        RAISE WARNING 'Erro ao criar perfil para usuário %: %', NEW.id, SQLERRM;
        -- Retornar NEW mesmo em caso de erro para não bloquear criação do usuário
        RETURN NEW;
END;
$$;

-- Recriar trigger se necessário (caso tenha sido removido)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Verificação
DO $$
BEGIN
    RAISE NOTICE '✅ Função handle_new_user() corrigida e trigger recriado';
    RAISE NOTICE '🔍 Trigger configurado para executar após INSERT em auth.users';
END $$;
