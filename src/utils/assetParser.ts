/**
 * Utilitário para processar e classificar valores de patrimônio reais (muitas vezes "sujos").
 */

export interface ParsedAsset {
  numero_patrimonio: string | null;
  codigo_gps: string | null;
  categoria?: string;
  tipo_ativo?: string;
  empresa?: string | null;
  departamento?: string | null;
  usuario_nome?: string | null;
  observacoes?: string;
  identificacao_tipo: 'patrimonio' | 'gps' | 'novo' | 'classificacao' | 'desconhecido';
  valor_original: string;
}

export function parsePatrimonyValue(rawVal: any): ParsedAsset {
  const strVal = String(rawVal || '').trim();
  const lowerVal = strVal.toLowerCase();

  // 1. Valores Vazios ou "NOVO"
  if (!strVal || lowerVal === 'novo' || lowerVal === 'null' || lowerVal === 'n/a') {
    return {
      numero_patrimonio: null,
      codigo_gps: null,
      identificacao_tipo: 'novo',
      valor_original: strVal || '(vazio)',
      observacoes: 'Ativo novo sem patrimônio atribuído'
    };
  }

  // 2. Códigos GPS
  // Regra: Se começar com "GPS", é código GPS. Se for Impressora, é prioridade.
  if (lowerVal.startsWith('gps')) {
    return {
      numero_patrimonio: null,
      codigo_gps: strVal,
      identificacao_tipo: 'gps',
      valor_original: strVal
    };
  }

  // 3. Numérico (Patrimônio Padrão)
  const isNumeric = /^\d+$/.test(strVal);
  if (isNumeric) {
    return {
      numero_patrimonio: strVal.padStart(6, '0'),
      codigo_gps: null,
      identificacao_tipo: 'patrimonio',
      valor_original: strVal
    };
  }

  // 4. Classificações Especiais (Ex: Impressora Própria)
  if (lowerVal.includes('impressora') && (lowerVal.includes('própria') || lowerVal.includes('propria'))) {
    return {
      numero_patrimonio: null,
      codigo_gps: null,
      categoria: 'Impressora',
      tipo_ativo: 'Proprio',
      observacoes: 'Dispositivo Próprio (não inventariado como ativo fixo)',
      identificacao_tipo: 'classificacao',
      valor_original: strVal
    };
  }

  // 5. Fallback para outros textos (Tratar como patrimônio se não for GPS)
  return {
    numero_patrimonio: strVal,
    codigo_gps: null,
    identificacao_tipo: 'patrimonio',
    valor_original: strVal,
    observacoes: `Patrimônio alfanumérico detectado: ${strVal}`
  };
}
