import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';
import { useProfile } from '../hooks/useProfile';
import { parsePatrimonyValue } from '../utils/assetParser';
import { 
  ArrowLeft, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight,
  Database,
  PackageCheck,
  FileSpreadsheet,
  Settings2,
  Eye
} from 'lucide-react';
import { clsx } from 'clsx';

interface ImportRow {
  [key: string]: any;
}

interface Mapping {
  [key: string]: string;
}

const DEFAULT_MAP: Mapping = {
  nome_item: '',
  numero_patrimonio: '',
  marca: '',
  modelo: '',
  numero_serie: '',
  categoria: '',
  local: '',
  usuario_nome: '',
  empresa: '',
  departamento: '',
  valor: '',
  fornecedor: '',
  data_compra: '',
  observacoes: '',
  esta_ativo_planilha: '',
};

const fieldLabels: Record<string, string> = {
  nome_item: 'Ativo (Descrição) *',
  numero_patrimonio: 'Nº Patrimônio *',
  marca: 'Marca',
  modelo: 'Modelo',
  numero_serie: 'Número de Série',
  categoria: 'Categoria',
  local: 'Local / Unidade',
  usuario_nome: 'Usuário',
  empresa: 'Empresa',
  departamento: 'Departamento',
  valor: 'Valor',
  fornecedor: 'Fornecedor',
  data_compra: 'Data de Compra',
  observacoes: 'Observações / Motivo',
  esta_ativo_planilha: 'Status Ativo (Sim/Não)',
};

export default function AssetImport() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  
  const [step, setStep] = useState(1); // 1: Upload, 2: Mapping, 3: Preview, 4: Results
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const [rawData, setRawData] = useState<ImportRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Mapping>(DEFAULT_MAP);
  
  const [processedData, setProcessedData] = useState<any[]>([]);
  const [importMode, setImportMode] = useState<'inserir' | 'atualizar' | 'ignorar_duplicados'>('atualizar');
  const [results, setResults] = useState<{ success: number; updated: number; skipped: number; errors: any[] } | null>(null);

  // --- STEP 1: UPLOAD & READ ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setLoading(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
      
      if (rows.length > 0) {
        let headerRowIndex = 0;
        for (let i = 0; i < Math.min(rows.length, 10); i++) {
          const row = rows[i];
          const textCells = row.filter(c => typeof c === 'string' && c.length > 2);
          if (textCells.length >= 3) {
            headerRowIndex = i;
            break;
          }
        }

        const headers = rows[headerRowIndex].map(h => String(h || '').trim()).filter(h => h !== '');
        setColumns(headers);

        const data = XLSX.utils.sheet_to_json(ws, { 
          range: headerRowIndex,
          defval: null
        }) as ImportRow[];
        
        setRawData(data);
        
        const newMap = { ...DEFAULT_MAP };
        headers.forEach(col => {
          const c = col.toLowerCase();
          if (c.includes('item') || c.includes('nome') || c === 'ativo' || c.includes('descrição')) {
             if (!newMap.nome_item) newMap.nome_item = col;
          }
          if (c.includes('patrimonio') || c.includes('patrimônio') || c.includes('plaqueta') || c === 'patr' || c.includes('nº patrimônio')) newMap.numero_patrimonio = col;
          if (c.includes('marca')) newMap.marca = col;
          if (c.includes('modelo') || c === 'model') newMap.modelo = col;
          if (c.includes('serie') || c.includes('série') || c === 'sn' || c === 's/n') newMap.numero_serie = col;
          if (c.includes('categoria')) newMap.categoria = col;
          if (c.includes('empresa')) newMap.empresa = col;
          if (c.includes('departamento') || c.includes('depto')) newMap.departamento = col;
          if (c.includes('valor') || c.includes('preço')) newMap.valor = col;
          if (c.includes('local') || c.includes('unidade')) newMap.local = col;
          if (c.includes('usuario') || c.includes('usuário') || c.includes('dono')) newMap.usuario_nome = col;
          if (c.includes('ativ') || c === 'ativo' || c === 'active') {
             if (c.length < 10) newMap.esta_ativo_planilha = col; // Evita pegar "Descrição" se for coluna A: Ativ
          }
          if (c.includes('obs') || c.includes('comentário')) newMap.observacoes = col;
          if (c.includes('fornecedor')) newMap.fornecedor = col;
        });
        setMapping(newMap);
        setStep(2);
      }
      setLoading(false);
    };
    reader.readAsBinaryString(file);
  };

  // --- STEP 2: PROCESS & PREVIEW ---
  const handleProcessPreview = () => {
    const processed = rawData.map((row, idx) => {
      const rawPatrimonio = row[mapping.numero_patrimonio];
      const parsed = parsePatrimonyValue(rawPatrimonio);

      let finalName = row[mapping.nome_item] || 'Item sem nome';
      if (parsed.identificacao_tipo === 'classificacao' && parsed.valor_original) {
        finalName = `${finalName} - ${parsed.valor_original}`;
      }

      return {
        ...parsed,
        row_idx: idx + 1,
        nome_item: finalName,
        marca: row[mapping.marca] || '',
        modelo: row[mapping.modelo] || '',
        numero_serie: row[mapping.numero_serie] || '',
        local: row[mapping.local] || null,
        usuario_nome: row[mapping.usuario_nome] || null,
        empresa: row[mapping.empresa] || null,
        departamento: row[mapping.departamento] || null,
        categoria: parsed.categoria || row[mapping.categoria] || 'Outros',
        valor: parseFloat(String(row[mapping.valor] || '0').replace(',', '.')),
        fornecedor: row[mapping.fornecedor] || '',
        tipo_ativo: parsed.tipo_ativo || 'Proprio',
        esta_ativo_planilha: row[mapping.esta_ativo_planilha] || null,
        observacoes: `${parsed.observacoes || ''} ${row[mapping.observacoes] || ''}`.trim()
      };
    });

    setProcessedData(processed);
    setStep(3);
  };

  const normalizeNull = (val: any): string | null => {
    if (val === null || val === undefined) return null;
    const str = String(val).trim().toLowerCase();
    if (!str || str === 'n/a' || str === 'null' || str === 'undefined' || str === '-') return null;
    return String(val).trim();
  };

  // --- STEP 3: EXECUTE IMPORT ---
  const handleExecuteImport = async () => {
    if (!profile) return;
    setLoading(true);
    
    const { data: batch, error: batchErr } = await supabase
      .from('asset_import_batches')
      .insert([{
        file_name: fileName,
        imported_by: profile.id,
        total_rows: processedData.length,
        mode: importMode
      }])
      .select()
      .single();

    if (batchErr) {
       alert('Erro ao criar lote: ' + batchErr.message);
       setLoading(false);
       return;
    }

    let successCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const errors: any[] = [];
    const allInsertedIds: string[] = [];

    const chunkSize = 250;
    for (let i = 0; i < processedData.length; i += chunkSize) {
      const chunk = processedData.slice(i, i + chunkSize);
      
      const assetsToUpsertRaw = chunk.map(item => ({
        nome_item: item.nome_item,
        descricao: item.observacoes,
        numero_patrimonio: normalizeNull(item.numero_patrimonio),
        codigo_gps: normalizeNull(item.codigo_gps),
        tipo_ativo: item.tipo_ativo || 'Proprio',
        categoria: item.categoria,
        marca: item.marca,
        modelo: item.modelo,
        numero_serie: item.numero_serie,
        local: item.local,
        usuario_nome_importado: item.usuario_nome,
        empresa: item.empresa,
        departamento: item.departamento,
        valor: item.valor,
        fornecedor: item.fornecedor,
        esta_ativo_planilha: item.esta_ativo_planilha,
        status: 'em_estoque'
      }));

      // --- Deduplicação de Planilha v4.5 (Filtro de Limpeza) ---
      const seenPatsInBatch = new Set<string>();
      const finalAssetsToProcess: typeof assetsToUpsertRaw = [];
      
      // Processamos de trás para frente para garantir que a ÚLTIMA informação da planilha prevaleça
      for (let j = assetsToUpsertRaw.length - 1; j >= 0; j--) {
        const asset = assetsToUpsertRaw[j];
        const pat = asset.numero_patrimonio;
        
        if (pat && seenPatsInBatch.has(pat)) {
          skippedCount++; // Contabilizamos como linha de planilha repetida
          continue;
        }
        
        if (pat) seenPatsInBatch.add(pat);
        finalAssetsToProcess.unshift(asset);
      }

      try {
        let resultData: any[] = [];
        
        if (importMode === 'ignorar_duplicados') {
          const pats = finalAssetsToProcess.map(a => a.numero_patrimonio).filter(Boolean) as string[];
          const gpss = finalAssetsToProcess.map(a => a.codigo_gps).filter(Boolean) as string[];
          
          if (pats.length > 0 || gpss.length > 0) {
            let query = supabase.from('assets').select('numero_patrimonio, codigo_gps');
            const conditions: string[] = [];
            if (pats.length > 0) conditions.push(`numero_patrimonio.in.(${pats.join(',')})`);
            if (gpss.length > 0) conditions.push(`codigo_gps.in.(${gpss.join(',')})`);
            
            const { data: matched } = await query.or(conditions.join(','));
            const allExistingKeys = [...(matched || []).map(m => m.numero_patrimonio), ...(matched || []).map(m => m.codigo_gps)].filter(Boolean);
            
            const filteredAssets = finalAssetsToProcess.filter(a => {
              const isDupe = (a.numero_patrimonio && allExistingKeys.includes(a.numero_patrimonio)) || 
                             (a.codigo_gps && allExistingKeys.includes(a.codigo_gps));
              if (isDupe) skippedCount++;
              return !isDupe;
            });

            if (filteredAssets.length > 0) {
              const { data: inserted, error } = await supabase.from('assets').insert(filteredAssets).select('id');
              if (error) throw error;
              resultData = inserted || [];
              successCount += resultData.length;
            }
          } else {
             const { data: inserted, error } = await supabase.from('assets').insert(finalAssetsToProcess).select('id');
              if (error) throw error;
              resultData = inserted || [];
              successCount += resultData.length;
          }

        } else if (importMode === 'atualizar') {
          const { data: upserted, error } = await supabase
            .from('assets')
            .upsert(finalAssetsToProcess, { onConflict: 'numero_patrimonio', ignoreDuplicates: false })
            .select('id');
          if (error) throw error;
          resultData = upserted || [];
          updatedCount += resultData.length;
        } else {
          const { data: inserted, error } = await supabase.from('assets').insert(finalAssetsToProcess).select('id');
          if (error) throw error;
          resultData = inserted || [];
          successCount += resultData.length;
        }

        if (resultData.length > 0) {
          allInsertedIds.push(...resultData.map(a => a.id));
        }

      } catch (error: any) {
        chunk.forEach(item => {
          errors.push({ row: item.row_idx, patrimonio: item.numero_patrimonio || 'N/A', message: error.message });
        });
        const errorLogs = chunk.map(item => ({
          batch_id: batch.id,
          row_number: item.row_idx,
          numero_patrimonio: item.numero_patrimonio,
          error_message: error.message,
          raw_data: item
        }));
        await supabase.from('asset_import_errors').insert(errorLogs);
      }
    }

    if (allInsertedIds.length > 0) {
      const movements = allInsertedIds.map(id => ({
        asset_id: id,
        tipo: 'importacao',
        user_id: profile.id,
        observacao: `Importação Turbo: ${fileName}`
      }));
      await supabase.from('asset_movements').insert(movements);
    }

    await supabase.from('asset_import_batches').update({
       success_rows: successCount + updatedCount,
       error_rows: errors.length
    }).eq('id', batch.id);

    setResults({ success: successCount, updated: updatedCount, skipped: skippedCount, errors });
    setStep(4);
    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-fade-up">
      <header className="flex flex-col gap-5">
        <button 
          onClick={() => step > 1 ? setStep(step - 1) : navigate('/estoque')}
          className="flex items-center gap-2 text-gp-text3 font-bold hover:text-gp-blue transition-colors text-[12px] uppercase tracking-wider"
        >
          <ArrowLeft size={16} /> {step > 1 ? 'Voltar Etapa' : 'Voltar ao Estoque'}
        </button>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="gp-page-title">Importação de Ativos</h1>
            <p className="gp-page-subtitle">Suba planilhas em massa para organizar seu inventário dinamicamente.</p>
          </div>
          <div className="flex bg-gp-surface2 border border-gp-border p-1.5 rounded-2xl shadow-inner">
             {[1,2,3,4].map(s => (
                <div key={s} className={clsx(
                  "w-9 h-9 rounded-[14px] flex items-center justify-center font-bold text-xs transition-all", 
                  step === s ? "bg-gp-blue text-white shadow-lg shadow-gp-blue/20" : "text-gp-text3 opacity-50"
                )}>
                  {s}
                </div>
             ))}
          </div>
        </div>
      </header>

      {step === 1 && (
        <div 
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) {
              const fakeEvent = { target: { files: [file] } } as any;
              handleFileUpload(fakeEvent);
            }
          }}
          className={clsx(
            "gp-card p-16 sm:p-24 text-center space-y-10 transition-all duration-500 relative group overflow-hidden border-2 border-dashed",
            isDragging 
              ? "bg-gp-blue-muted border-gp-blue scale-[1.01] shadow-gp-blue/10" 
              : loading 
                ? "opacity-60 pointer-events-none" 
                : "border-gp-border hover:border-gp-blue/40"
          )}
        >
            <div className={clsx(
              "w-24 h-24 rounded-[32px] flex items-center justify-center mx-auto transition-all duration-500",
              isDragging ? "bg-gp-blue text-white scale-125 rotate-[-6deg]" : "bg-gp-surface2 text-gp-text3 group-hover:bg-gp-blue group-hover:text-white group-hover:scale-110"
            )}>
              <FileSpreadsheet size={48} strokeWidth={1.5} />
            </div>
            <div className="max-w-md mx-auto">
              <h3 className="text-2xl font-bold text-gp-text">
                {isDragging ? 'Solte para importar!' : 'Selecione sua Planilha'}
              </h3>
              <p className="text-gp-text3 font-medium mt-3 leading-relaxed">
                Arraste seu arquivo Excel (.xlsx, .xls) ou CSV para processar os ativos automaticamente.
              </p>
            </div>
            <div className="pt-6 relative z-10">
              <label className={clsx(
                "btn-premium-primary px-12 py-4 rounded-xl cursor-pointer inline-flex",
                loading && "opacity-80"
              )}>
                 {loading ? (
                   <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3" /> PROCESSANDO...</>
                 ) : (
                   <><Upload size={20} strokeWidth={2} className="mr-3" /> ESCOLHER ARQUIVO</>
                 )}
                 <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} disabled={loading} />
              </label>
            </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-fade-up">
           <div className="bg-gp-blue/10 border border-gp-blue/20 p-6 rounded-2xl flex gap-4 items-center">
              <div className="w-12 h-12 bg-gp-blue text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-gp-blue/20">
                <Settings2 size={24} />
              </div>
              <div>
                 <h4 className="font-bold text-gp-text text-[15px] leading-tight">Mapeamento de Colunas</h4>
                 <p className="text-gp-text3 font-medium text-[13px]">Vincule os campos do sistema com as colunas detectadas em sua planilha.</p>
              </div>
           </div>

           <div className="gp-card p-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                 {Object.keys(DEFAULT_MAP).map((field) => (
                    <div key={field} className="space-y-2">
                       <label className="block text-[11px] font-bold text-gp-text3 uppercase tracking-widest ml-1">
                          {fieldLabels[field] || field.replace('_', ' ')}
                       </label>
                       <div className="relative">
                        <select 
                          value={mapping[field]}
                          onChange={(e) => setMapping({ ...mapping, [field]: e.target.value })}
                          className="gp-input pr-10 appearance-none py-3"
                        >
                           <option value="">-- Ignorar Coluna --</option>
                           {columns.map(col => <option key={col} value={col}>{col}</option>)}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gp-text3 opacity-40">
                          <ChevronRight size={18} className="rotate-90" />
                        </div>
                       </div>
                    </div>
                 ))}
              </div>
              <div className="mt-12 pt-8 border-t border-gp-border flex justify-end">
                    <button onClick={handleProcessPreview} className="btn-premium-primary px-10 py-4 rounded-xl shadow-gp-blue/20">
                      CONFIRMAR MAPEAMENTO <ChevronRight size={20} />
                    </button>
              </div>
           </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6 animate-fade-up">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="gp-card p-8">
                 <p className="text-[11px] font-bold text-gp-text3 uppercase tracking-widest mb-1.5 opacity-60">Total de Registros</p>
                 <p className="text-4xl font-bold text-gp-text">{processedData.length}</p>
              </div>
              <div className="gp-card p-8 col-span-2 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                 <div className="flex-1 space-y-2">
                    <p className="text-[11px] font-bold text-gp-text3 uppercase tracking-widest opacity-60">Configuração de Inteligência (v4.4)</p>
                    <div className="flex flex-wrap gap-2 pt-1">
                       {[
                         {id: 'atualizar', label: '🚀 SINCRONIZAR TUDO (Recomendado)'}, 
                         {id: 'inserir', label: 'SOMENTE NOVOS (Dá erro se existir)'}, 
                         {id: 'ignorar_duplicados', label: 'PULAR EXISTENTES'}
                       ].map(m => (
                          <button 
                            key={m.id} 
                            onClick={() => setImportMode(m.id as any)} 
                            className={clsx(
                              "px-4 py-2.5 rounded-xl text-[10px] font-bold transition-all border", 
                              importMode === m.id 
                                ? "bg-gp-blue text-white border-gp-blue shadow-lg shadow-gp-blue/20" 
                                : "bg-gp-surface3 border-gp-border text-gp-text3 hover:border-gp-blue/40"
                            )}
                          >
                            {m.label}
                          </button>
                       ))}
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-gp-blue/10 border border-gp-blue/20 p-5 rounded-2xl flex gap-4 items-center animate-fade-up">
              <div className="w-10 h-10 bg-gp-blue/20 text-gp-blue rounded-xl flex items-center justify-center shrink-0 border border-gp-blue/30 shadow-sm shadow-gp-blue/10">
                <Database size={20} />
              </div>
              <p className="text-gp-text font-medium text-[13px] leading-snug">
                <strong className="text-gp-blue">Dica Profissional:</strong> O modo <strong className="font-bold">Sincronizar Tudo</strong> identifica itens existentes pelo número do patrimônio e atualiza local, usuário e status automaticamente.
              </p>
            </div>

           <div className="gp-card overflow-hidden">
              <div className="p-8 border-b border-gp-border bg-gp-blue/5">
                 <h3 className="font-bold text-lg text-gp-text flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-gp-blue text-white flex items-center justify-center">
                     <Eye size={20} strokeWidth={2} />
                   </div>
                   Preview do Tratamento de Ativos
                 </h3>
              </div>
              <div className="overflow-x-auto">
                 <table className="gp-table">
                    <thead>
                       <tr>
                          <th>Dado na Planilha</th>
                          <th>Identificação</th>
                          <th>Patrimônio / GPS</th>
                          <th>Equipamento</th>
                          <th>Categoria</th>
                          <th>Notas</th>
                       </tr>
                    </thead>
                    <tbody>
                       {processedData.slice(0, 10).map((item, idx) => (
                          <tr key={idx}>
                             <td className="font-bold opacity-50">{item.valor_original}</td>
                             <td>
                                <span className={clsx(
                                  "gp-badge", 
                                  item.identificacao_tipo === 'patrimonio' ? "gp-badge-success" : 
                                  item.identificacao_tipo === 'gps' ? "gp-badge-blue" : 
                                  item.identificacao_tipo === 'novo' ? "gp-badge-purple" : "gp-badge-gray"
                                )}>
                                  {item.identificacao_tipo.toUpperCase()}
                                </span>
                             </td>
                             <td className="font-bold text-gp-blue-light font-mono text-[13px]">{item.numero_patrimonio || item.codigo_gps || '-'}</td>
                             <td>
                                <div className="flex flex-col">
                                  <span className="font-bold text-gp-text text-sm">{item.nome_item}</span>
                                  <span className="text-[10px] font-bold text-gp-text3 opacity-60 uppercase">{item.marca} {item.modelo}</span>
                                </div>
                             </td>
                             <td className="font-bold text-xs">{item.categoria}</td>
                             <td className="text-[11px] font-medium text-gp-text3 truncate max-w-[150px] italic">
                                {item.observacoes || 'N/A'}
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
                 {processedData.length > 10 && (
                   <div className="p-5 text-center text-[11px] font-bold text-gp-text3 uppercase tracking-widest bg-gp-surface2/50 border-t border-gp-border">
                     Visualizando as primeiras 10 de {processedData.length} linhas tratadas...
                   </div>
                 )}
              </div>
           </div>

           <div className="gp-card bg-gp-surface overflow-hidden relative border-gp-blue/30 border-2 p-8 shadow-2xl">
              {loading && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-20 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-3 border-gp-blue/30 border-t-gp-blue rounded-full animate-spin" />
                    <span className="font-bold text-lg text-gp-text tracking-widest animate-pulse">IMPORTANDO ATIVOS...</span>
                  </div>
                </div>
              )}
              <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
                <div className="text-center md:text-left">
                  <h4 className="font-bold text-xl text-gp-text">Executar Importação Final</h4>
                  <p className="text-gp-text3 font-medium text-sm mt-1">Os dados serão processados e as movimentações de auditoria geradas.</p>
                </div>
                <button 
                  onClick={handleExecuteImport} 
                  disabled={loading} 
                  className="w-full md:w-auto btn-premium-primary px-16 py-4 rounded-xl shadow-gp-blue/30 text-lg"
                >
                  {loading ? 'PROCESSANDO...' : (<><Database size={22} strokeWidth={2.5} className="mr-3" /> INICIAR TurboImport</>)}
                </button>
              </div>
           </div>
        </div>
      )}

      {step === 4 && results && (
        <div className="space-y-8 animate-fade-up">
           <div className="gp-card p-16 text-center space-y-10">
              <div className="w-24 h-24 bg-gp-success/10 text-gp-success rounded-[32px] flex items-center justify-center mx-auto shadow-inner shadow-gp-success/5">
                <CheckCircle2 size={48} strokeWidth={2} />
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-bold text-gp-text">Importação Finalizada</h2>
                <p className="text-gp-text3 text-base font-medium max-w-md mx-auto">O processamento do lote TurboImport concluído com sucesso.</p>
              </div>
              <div className="flex flex-wrap justify-center gap-12 pt-4">
                 <div className="flex flex-col items-center">
                   <p className="text-[11px] font-bold text-gp-text3 uppercase tracking-widest mb-3 opacity-60">Inseridos</p>
                   <p className="text-5xl font-bold text-gp-success">{results.success}</p>
                 </div>
                 <div className="flex flex-col items-center">
                   <p className="text-[11px] font-bold text-gp-text3 uppercase tracking-widest mb-3 opacity-60">Atualizados</p>
                   <p className="text-5xl font-bold text-gp-blue">{results.updated}</p>
                 </div>
                 {results.skipped > 0 && (
                   <div className="flex flex-col items-center">
                     <p className="text-[11px] font-bold text-gp-text3 uppercase tracking-widest mb-3 opacity-60">Pulados</p>
                     <p className="text-5xl font-bold text-gp-text3">{results.skipped}</p>
                   </div>
                 )}
                 <div className="flex flex-col items-center">
                   <p className="text-[11px] font-bold text-gp-text3 uppercase tracking-widest mb-3 opacity-60">Erros</p>
                   <p className={clsx("text-5xl font-bold", results.errors.length > 0 ? "text-gp-red" : "text-gp-border")}>
                    {results.errors.length}
                   </p>
                 </div>
              </div>
              <div className="pt-10 flex flex-col sm:flex-row justify-center gap-4">
                 <button onClick={() => navigate('/estoque')} className="btn-premium-primary px-12 py-4 rounded-xl shadow-gp-blue/20">
                   <PackageCheck size={20} strokeWidth={2} className="mr-3" /> VER INVENTÁRIO ATUALIZADO
                 </button>
                 <button onClick={() => setStep(1)} className="btn-premium-secondary px-10 py-4 rounded-xl font-bold">
                   NOVA PLANILHA
                 </button>
              </div>
           </div>

           {results.errors.length > 0 && (
             <div className="gp-card overflow-hidden">
                <div className="p-8 border-b border-gp-red/20 bg-gp-red/5 flex items-center gap-4 text-gp-red">
                  <AlertCircle size={24} />
                  <h3 className="font-bold text-lg">Relatório de Inconsistências</h3>
                </div>
                <div className="overflow-x-auto max-h-[500px]">
                  <table className="gp-table">
                    <thead>
                      <tr>
                        <th>Linha</th>
                        <th>Identificação Patrimonial</th>
                        <th>Mensagem de Erro</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.errors.map((err, i) => (
                        <tr key={i} className="bg-gp-red/5">
                          <td className="font-bold opacity-50">#{err.row}</td>
                          <td className="font-mono font-bold text-gp-text">{err.patrimonio || 'N/A'}</td>
                          <td className="text-gp-red font-bold text-xs italic">{err.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             </div>
           )}
        </div>
      )}
    </div>
  );
}
