import { supabase } from '../lib/supabase';

export interface Asset {
  id?: string;
  nome_item: string;
  descricao?: string;
  numero_patrimonio: string;
  codigo_barras?: string;
  codigo_gps?: string;
  categoria?: string;
  marca?: string;
  modelo?: string;
  numero_serie?: string;
  local?: string;
  empresa?: string;
  departamento?: string;
  usuario_nome_importado?: string;
  status: 'em_estoque' | 'em_uso' | 'manutencao' | 'baixado';
  valor?: number;
  fornecedor?: string;
  data_compra?: string;
  request_id?: string;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
}

export const assetService = {
  /**
   * Busca o próximo número de patrimônio sequencial formatted com 6 dígitos.
   */
  async getNextPatrimonyNumber(): Promise<string> {
    const { data, error } = await supabase
      .from('assets')
      .select('numero_patrimonio')
      .order('numero_patrimonio', { ascending: false })
      .limit(1);

    if (error) {
       console.error('Erro ao buscar último patrimônio:', error);
       return '000001';
    }

    if (!data || data.length === 0) {
      return '000001';
    }

    const lastNum = parseInt(data[0].numero_patrimonio, 10);
    const nextNum = lastNum + 1;
    return nextNum.toString().padStart(6, '0');
  },

  /**
   * Cria um novo ativo e registra a movimentação inicial.
   */
  async createAsset(asset: Asset, userId: string): Promise<{ data: any; error: any }> {
    // 1. Inserir o ativo
    const { data, error } = await supabase
      .from('assets')
      .insert([asset])
      .select()
      .single();

    if (error) return { data: null, error };

    // 2. Registrar movimentação de entrada
    const { error: moveError } = await supabase
      .from('asset_movements')
      .insert([{
        asset_id: data.id,
        tipo: 'entrada',
        user_id: userId,
        observacao: 'Entrada manual no estoque.'
      }]);

    if (moveError) console.error('Erro ao registrar movimentação:', moveError);

    return { data, error: null };
  },

  /**
   * Entrega um ativo para um usuário específico.
   */
  async assignAsset(assetId: string, targetUserId: string, performByUserId: string, notes?: string) {
    // 1. Atualizar status do ativo
    const { error: assetError } = await supabase
      .from('assets')
      .update({ status: 'em_uso' })
      .eq('id', assetId);

    if (assetError) return { error: assetError };

    // 2. Criar atribuição ativa
    const { error: assignError } = await supabase
      .from('asset_assignments')
      .insert([{
        asset_id: assetId,
        user_id: targetUserId,
        status: 'ativo'
      }]);

    if (assignError) return { error: assignError };

    // 3. Registrar movimentação de entrega
    const { error: moveError } = await supabase
      .from('asset_movements')
      .insert([{
        asset_id: assetId,
        tipo: 'entrega',
        user_id: performByUserId,
        destino_user_id: targetUserId,
        observacao: notes || 'Entrega de equipamento para uso.'
      }]);

    return { error: moveError };
  },

  /**
   * Registra a devolução de um ativo (volta para o estoque).
   */
  async returnAsset(assetId: string, performByUserId: string, notes?: string) {
    // 1. Marcar atribuições anteriores como encerradas
    await supabase
      .from('asset_assignments')
      .update({ status: 'encerrado', returned_at: new Date().toISOString() })
      .eq('asset_id', assetId)
      .eq('status', 'ativo');

    // 2. Voltar ativo para o estoque
    const { error: assetError } = await supabase
      .from('assets')
      .update({ status: 'em_estoque' })
      .eq('id', assetId);

    if (assetError) return { error: assetError };

    // 3. Registrar movimentação de devolução
    const { error: moveError } = await supabase
      .from('asset_movements')
      .insert([{
        asset_id: assetId,
        tipo: 'devolucao',
        user_id: performByUserId,
        observacao: notes || 'Retorno de equipamento ao estoque.'
      }]);

    return { error: moveError };
  },

  /**
   * Atualiza o status técnico (Manutenção, Baixa, etc)
   */
  async updateAssetStatus(assetId: string, newStatus: Asset['status'], performByUserId: string, notes?: string) {
    const { error: assetError } = await supabase
      .from('assets')
      .update({ status: newStatus })
      .eq('id', assetId);

    if (assetError) return { error: assetError };

    const { error: moveError } = await supabase
      .from('asset_movements')
      .insert([{
        asset_id: assetId,
        tipo: newStatus === 'manutencao' ? 'manutencao' : 'baixa',
        user_id: performByUserId,
        observacao: notes || `Alteração de status para ${newStatus}.`
      }]);

    return { error: moveError };
  },

  /**
   * Move o ativo para uma nova localização física.
   */
  async updateAssetLocation(assetId: string, newLocal: string, performByUserId: string, notes?: string) {
    const { error: assetError } = await supabase
      .from('assets')
      .update({ local: newLocal })
      .eq('id', assetId);

    if (assetError) return { error: assetError };

    const { error: moveError } = await supabase
      .from('asset_movements')
      .insert([{
        asset_id: assetId,
        tipo: 'movimentacao',
        user_id: performByUserId,
        observacao: notes || `Mover para localização: ${newLocal}.`
      }]);

    return { error: moveError };
  }
};
