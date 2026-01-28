-- =================================================================
-- Migration 009: Adicionar colunas faltantes em hub_apps
-- Adiciona: color, description, display_order
-- =================================================================

-- 1. Adicionar coluna 'color' (TEXT, NOT NULL, DEFAULT '#3B82F6')
ALTER TABLE public.hub_apps
ADD COLUMN IF NOT EXISTS color TEXT NOT NULL DEFAULT '#3B82F6';

-- 2. Adicionar coluna 'description' (TEXT, NULLABLE)
ALTER TABLE public.hub_apps
ADD COLUMN IF NOT EXISTS description TEXT;

-- 3. Adicionar coluna 'display_order' (INTEGER, NOT NULL, DEFAULT 0)
ALTER TABLE public.hub_apps
ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;

-- 4. Atualizar registros existentes para terem valores apropriados
-- Atualizar display_order baseado na ordem de criação (created_at)
UPDATE public.hub_apps
SET display_order = subquery.row_number
FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as row_number
    FROM public.hub_apps
) AS subquery
WHERE public.hub_apps.id = subquery.id;

-- 5. Criar índice na coluna display_order para otimizar consultas ordenadas
CREATE INDEX IF NOT EXISTS idx_hub_apps_display_order ON public.hub_apps(display_order);

-- 6. Verificação
DO $$
BEGIN
    RAISE NOTICE '✅ Colunas adicionadas com sucesso à tabela hub_apps';
    RAISE NOTICE '📦 Colunas: color, description, display_order';
    RAISE NOTICE '🔍 Índice criado: idx_hub_apps_display_order';
END $$;
