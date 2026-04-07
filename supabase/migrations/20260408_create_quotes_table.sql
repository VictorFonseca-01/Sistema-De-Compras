-- CREATE TABLE FOR REQUEST QUOTES
CREATE TABLE IF NOT EXISTS public.request_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
    supplier_name TEXT NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    description TEXT,
    is_selected BOOLEAN DEFAULT false,
    justification TEXT,
    quote_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- ENABLE RLS
ALTER TABLE public.request_quotes ENABLE ROW LEVEL SECURITY;

-- POLICIES
CREATE POLICY "Users can view quotes for their requests"
    ON public.request_quotes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.requests
            WHERE id = request_quotes.request_id
            AND (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('master_admin', 'gestor', 'ti', 'diretoria', 'compras')))
        )
    );

CREATE POLICY "Purchasings and Admins can manage quotes"
    ON public.request_quotes FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('master_admin', 'compras')
        )
    );

-- INDEXES
CREATE INDEX idx_request_quotes_request_id ON public.request_quotes(request_id);
