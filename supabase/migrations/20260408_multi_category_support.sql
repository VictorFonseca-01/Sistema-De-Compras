-- ======================================================================
-- SANEAMENTO DE CATEGORIAS E SUPORTE MULTI-CATEGORIA
-- ======================================================================

-- 1. Padronizar todas as solicitações existentes como TI / Tecnologia
-- Isso garante que o fluxo legado continue funcionando perfeitamente.
UPDATE public.requests 
SET category = 'TI / Tecnologia' 
WHERE category IS NULL OR category NOT IN ('TI / Tecnologia', 'Mobiliário', 'Infraestrutura', 'Administrativo', 'Serviços', 'Outros');

-- Note: No PostgreSQL, a coluna TEXT não precisa de alteração de tamanho para novos valores.
-- A validação dos valores será feita na camada de aplicação (NewRequest.tsx).

-- Recarregar esquema
NOTIFY pgrst, 'reload schema';
