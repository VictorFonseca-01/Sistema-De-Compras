-- ETAPA 1: BANCO DE DADOS (INVENTÁRIO E PATRIMÔNIO) - VERSÃO ATUALIZADA COM CAMPOS ESPECIAIS

-- 1. Tabela de Ativos (Assets)
CREATE TABLE IF NOT EXISTS public.assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_item TEXT NOT NULL,
    descricao TEXT,
    numero_patrimonio TEXT UNIQUE, -- Nullable para suportar "NOVO"/vazio
    codigo_barras TEXT UNIQUE,     -- Nullable
    codigo_gps TEXT,               -- Novo campo para códigos GPS
    tipo_ativo TEXT,               -- Ex: 'Proprio', 'Locado'
    categoria TEXT,
    marca TEXT,
    modelo TEXT,
    numero_serie TEXT,
    status TEXT NOT NULL DEFAULT 'em_estoque' CHECK (status IN ('em_estoque', 'em_uso', 'manutencao', 'baixado')),
    valor DECIMAL(12,2),
    fornecedor TEXT,
    data_compra DATE,
    request_id UUID REFERENCES public.requests(id) ON DELETE SET NULL,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Movimentações de Ativos (Asset Movements)
CREATE TABLE IF NOT EXISTS public.asset_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'entrega', 'devolucao', 'manutencao', 'baixa', 'importacao')),
    user_id UUID REFERENCES auth.users(id), -- Quem realizou a ação
    destino_user_id UUID REFERENCES auth.users(id), -- Para quem foi entregue
    observacao TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Atribuições Atuais (Asset Assignments)
CREATE TABLE IF NOT EXISTS public.asset_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    data_entrega TIMESTAMPTZ DEFAULT now(),
    data_devolucao TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'devolvido')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Lotes de Importação (Import Batches)
CREATE TABLE IF NOT EXISTS public.asset_import_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name TEXT NOT NULL,
    imported_by UUID REFERENCES auth.users(id),
    total_rows INTEGER DEFAULT 0,
    success_rows INTEGER DEFAULT 0,
    error_rows INTEGER DEFAULT 0,
    mode TEXT CHECK (mode IN ('inserir', 'atualizar', 'ignorar_duplicados')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Erros de Importação (Import Errors)
CREATE TABLE IF NOT EXISTS public.asset_import_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID REFERENCES public.asset_import_batches(id) ON DELETE CASCADE,
    row_number INTEGER,
    numero_patrimonio TEXT,
    codigo_barras TEXT,
    error_message TEXT,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- CONFIGURAÇÃO DE SEGURANÇA (RLS)

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_import_errors ENABLE ROW LEVEL SECURITY;

-- Políticas para ASSETS
CREATE POLICY "Admins e TI podem ver todos os ativos" ON public.assets
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('master_admin', 'ti')
        )
    );

CREATE POLICY "Usuários podem ver apenas ativos vinculados a eles" ON public.assets
    FOR SELECT TO authenticated
    USING (
        id IN (
            SELECT asset_id FROM public.asset_assignments 
            WHERE user_id = auth.uid() AND status = 'ativo'
        )
    );

CREATE POLICY "Somente TI e Admin podem modificar ativos" ON public.assets
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('master_admin', 'ti')
        )
    );

-- Políticas para MOVIMENTAÇÕES e ATRIBUIÇÕES (Somente TI/Admin)
CREATE POLICY "Somente TI e Admin acessam movimentações" ON public.asset_movements
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('master_admin', 'ti')
        )
    );

CREATE POLICY "Somente TI e Admin acessam atribuições" ON public.asset_assignments
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('master_admin', 'ti')
        )
    );

-- Políticas para IMPORTAÇÃO (Somente TI/Admin)
CREATE POLICY "Gerenciamento de importação restrito" ON public.asset_import_batches
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('master_admin', 'ti')
        )
    );

CREATE POLICY "Erros de importação restritos" ON public.asset_import_errors
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('master_admin', 'ti')
        )
    );
