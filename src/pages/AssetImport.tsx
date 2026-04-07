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
  Eye,
  ChevronDown
} from 'lucide-react';
import { clsx } from 'clsx';
import { toast } from 'react-hot-toast';

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

const labelClass = 'block text-[10px] font-black uppercase tracking-[0.2em] mb-2.5 text-gp-muted ml-0.5 leading-none';

export default function AssetImport() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const [rawData, setRawData] = useState<ImportRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Mapping>(DEFAULT_MAP);
  
  const [processedData, setProcessedData] = useState<any[]>([]);
  const [importMode, setImportMode] = useState<'inserir' | 'atualizar' | 'ignorar_duplicados'>('atualizar');
  const [results, setResults] = useState<{ success: number; updated: number; skipped: number; errors: any[] } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setLoading(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
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
               if (c.length < 10) newMap.esta_ativo_planilha = col;
            }
            if (c.includes('obs') || c.includes('comentário')) newMap.observacoes = col;
            if (c.includes('fornecedor')) newMap.fornecedor = col;
          });
          setMapping(newMap);
          setStep(2);
          toast.success('Planilha processada com sucesso.');
        }
      } catch (err) {
        toast.error('Erro ao ler planilha.');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

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
    toast.success('Mapeamento concluído.');
  };

  const normalizeNull = (val: any): string | null => {
    if (val === null || val === undefined) return null;
    const str = String(val).trim().toLowerCase();
    if (!str || str === 'n/a' || str === 'null' || str === 'undefined' || str === '-') return null;
    return String(val).trim();
  };

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
       toast.error('Erro ao registrar lote: ' + batchErr.message);
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

      const seenPatsInBatch = new Set<string>();
      const finalAssetsToProcess: typeof assetsToUpsertRaw = [];
      
      for (let j = assetsToUpsertRaw.length - 1; j >= 0; j--) {
        const asset = assetsToUpsertRaw[j];
        const pat = asset.numero_patrimonio;
        
        if (pat && seenPatsInBatch.has(pat)) {
          skippedCount++;
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
    toast.success('Tarefa concluída.');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 px-4 sm:px-0 animate-fade-up">
      <header className="flex flex-col gap-6">
        <button 
          onClick={() => step > 1 ? setStep(step - 1) : navigate('/estoque')}
          className="flex items-center gap-2 text-gp-muted font-black hover:text-gp-blue transition-colors text-[10px] uppercase tracking-[0.2em] mb-2"
        >
          <ArrowLeft size={14} strokeWidth={3} /> {step > 1 ? 'Voltar Etapa' : 'Voltar ao Estoque'}
        </button>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="min-w-0">
            <h1 className="gp-page-title text-3xl">Importação de Ativos</h1>
            <p className="gp-page-subtitle">Alimentação em massa do inventário via TurboImport™.</p>
          </div>
          <div className="flex bg-gp-surface2 border border-gp-border p-1.5 rounded-2xl shadow-inner shrink-0">
             {[1,2,3,4].map(s => (
                <div key={s} className={clsx(
                  "w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs transition-all", 
                  step === s ? "bg-gp-blue text-white shadow-lg shadow-gp-blue/20" : "text-gp-muted opacity-40"
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
            "gp-card p-16 sm:p-32 text-center space-y-12 transition-all duration-500 relative group overflow-hidden border-3 border-dashed",
            isDragging 
              ? "bg-gp-blue/[0.03] border-gp-blue scale-[1.01] shadow-2xl shadow-gp-blue/10" 
              : loading 
                ? "opacity-60 pointer-events-none" 
                : "border-gp-border hover:border-gp-blue/30"
          )}
        >
            <div className={clsx(
              "w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto transition-all duration-700 shadow-inner border border-gp-border",
              isDragging ? "bg-gp-blue text-white scale-110 rotate-6" : "bg-gp-surface2 text-gp-muted group-hover:bg-gp-blue group-hover:text-white group-hover:rotate-[-3deg]"
            )}>
              <FileSpreadsheet size={48} strokeWidth={1} />
            </div>
            <div className="max-w-md mx-auto space-y-4">
              <h3 className="text-3xl font-black text-gp-text uppercase tracking-tight">
                {isDragging ? 'SOLTE O ARQUIVO' : 'SUBIR PLANILHA'}
              </h3>
              <p className="text-gp-text2 font-medium text-base leading-relaxed">
                Importe dados de ativos (.xlsx, .csv) e synchronize unidades, usuários e patrimônios em segundos.
              </p>
            </div>
            <div className="pt-8 relative z-10">
              <label className={clsx(
                "btn-premium-primary px-16 py-5 rounded-2xl cursor-pointer inline-flex font-black uppercase tracking-widest text-[11px] shadow-xl shadow-gp-blue/20",
                loading && "opacity-80"
              )}>
                 {loading ? (
                   <><div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin mr-4" /> TRATANDO DADOS...</>
                 ) : (
                   <><Upload size={20} strokeWidth={3} className="mr-3" /> SELECIONAR ARQUIVO</>
                 )}
                 <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} disabled={loading} />
              </label>
            </div>
            <div className="absolute top-0 left-0 w-40 h-40 bg-gp-blue/5 rounded-full blur-[80px] -translate-x-20 -translate-y-20 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      )}

      {step === 2 && (
        <div className="space-y-8 animate-fade-up">
           <div className="bg-gp-blue/[0.03] border border-gp-blue/20 p-8 rounded-[2rem] flex flex-col md:flex-row gap-6 items-center shadow-inner">
              <div className="w-16 h-16 bg-gp-blue text-white rounded-2xl flex items-center justify-center shrink-0 shadow-xl shadow-gp-blue/30">
                <Settings2 size={32} strokeWidth={2.5} />
              </div>
              <div className="text-center md:text-left">
                 <h4 className="font-black text-gp-text text-xl uppercase tracking-tight leading-none mb-2">Engenharia de Mapeamento</h4>
                 <p className="text-gp-muted font-medium text-[15px]">Associe as colunas da sua planilha aos campos do ecossistema Global Parts.</p>
              </div>
           </div>

           <div className="gp-card p-6 sm:p-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10">
                 {Object.keys(DEFAULT_MAP).map((field) => (
                    <div key={field} className="space-y-3 group">
                       <label className={labelClass}>
                          {fieldLabels[field] || field.replace('_', ' ')}
                       </label>
                       <div className="relative">
                        <select 
                          value={mapping[field]}
                          onChange={(e) => setMapping({ ...mapping, [field]: e.target.value })}
                          className="gp-input pr-12 appearance-none h-14 font-black uppercase text-[11px] tracking-widest cursor-pointer"
                        >
                           <option value="">-- Ignorar este campo --</option>
                           {columns.map(col => <option key={col} value={col}>{col}</option>)}
                        </select>
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gp-muted group-focus-within:text-gp-blue transition-colors">
                          <ChevronDown size={20} strokeWidth={3} />
                        </div>
                       </div>
                    </div>
                 ))}
              </div>
              <div className="mt-16 pt-10 border-t border-gp-border flex flex-col sm:flex-row justify-end items-center gap-6">
                    <p className="text-[11px] font-black text-gp-muted uppercase tracking-[0.2em] italic opacity-50">Confira todos os campos obrigatórios (*)</p>
                    <button onClick={handleProcessPreview} className="w-full sm:w-auto btn-premium-primary px-12 py-5 rounded-2xl shadow-xl shadow-gp-blue/20 font-black uppercase text-[11px] tracking-[0.15em]">
                      AVANÇAR PARA PREVIEW <ChevronRight size={18} strokeWidth={3} className="ml-2" />
                    </button>
              </div>
           </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-8 animate-fade-up">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="gp-card p-8 border-gp-blue/20 bg-gp-blue/[0.01]">
                 <p className="text-[10px] font-black text-gp-muted uppercase tracking-[0.25em] mb-3 opacity-60">Registros em Lote</p>
                 <p className="text-5xl font-black text-gp-text tracking-tighter">{processedData.length}</p>
              </div>
              <div className="gp-card p-8 lg:col-span-2 flex flex-col sm:flex-row items-start sm:items-center gap-8 border-gp-amber/20">
                 <div className="flex-1 space-y-4">
                    <p className="text-[10px] font-black text-gp-muted uppercase tracking-[0.25em] opacity-60">Configuração de Importação v4.6</p>
                    <div className="flex flex-wrap gap-2.5">
                       {[
                         {id: 'atualizar', label: '🚀 SINCRONIZAR TUDO', desc: 'Atualiza o que já existe'}, 
                         {id: 'inserir', label: 'INSERIR NOVOS', desc: 'Ignora conflitos'}, 
                         {id: 'ignorar_duplicados', label: 'PULAR DUPLICATAS', desc: 'Apenas novos patrimônios'}
                       ].map(m => (
                          <button 
                            key={m.id} 
                            onClick={() => setImportMode(m.id as any)} 
                            className={clsx(
                              "flex flex-col items-start px-6 py-4 rounded-2xl transition-all border shrink-0 text-left", 
                              importMode === m.id 
                                ? "bg-gp-blue text-white border-gp-blue shadow-xl shadow-gp-blue/20 scale-105" 
                                : "bg-gp-surface3 border-gp-border text-gp-muted hover:border-gp-blue/30"
                            )}
                          >
                            <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-2">{m.label}</span>
                            <span className={clsx("text-[9px] font-bold uppercase opacity-50", importMode === m.id ? "text-white" : "text-gp-muted")}>{m.desc}</span>
                          </button>
                       ))}
                    </div>
                 </div>
              </div>
           </div>

           <div className="gp-card overflow-hidden">
              <div className="p-8 border-b border-gp-border flex items-center justify-between">
                 <h3 className="font-black text-lg text-gp-text uppercase tracking-tight flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-gp-blue/10 text-gp-blue flex items-center justify-center ring-1 ring-gp-blue/20">
                     <Eye size={22} strokeWidth={2.5} />
                   </div>
                   Tratamento de Dados Post-Parsing
                 </h3>
                 <span className="text-[11px] font-black text-gp-blue-light uppercase tracking-widest">{processedData.length} linhagens detectadas</span>
              </div>
              <div className="overflow-x-auto">
                 <table className="gp-table">
                    <thead>
                       <tr>
                          <th>LINHA</th>
                          <th>PROTOCOLO</th>
                          <th>PATRIMÔNIO / ID</th>
                          <th>NOME DO ATIVO</th>
                          <th>CATEGORIA</th>
                          <th>NOTAS DE SISTEMA</th>
                       </tr>
                    </thead>
                    <tbody>
                       {processedData.slice(0, 15).map((item, idx) => (
                          <tr key={idx} className="hover:bg-gp-surface2/50 transition-colors">
                             <td className="text-[10px] font-black text-gp-muted">#{item.row_idx}</td>
                             <td>
                                <span className={clsx(
                                  "gp-badge gp-badge-sm font-black", 
                                  item.identificacao_tipo === 'patrimonio' ? "gp-badge-success" : 
                                  item.identificacao_tipo === 'gps' ? "gp-badge-blue" : 
                                  "gp-badge-gray"
                                )}>
                                  {item.identificacao_tipo.toUpperCase()}
                                </span>
                             </td>
                             <td className="font-black text-gp-blue-light font-mono text-[13px] tracking-widest">{item.numero_patrimonio || item.codigo_gps || '---'}</td>
                             <td>
                                <div className="flex flex-col">
                                  <span className="font-black text-gp-text text-[15px] leading-tight mb-1">{item.nome_item}</span>
                                  <span className="text-[10px] font-black text-gp-muted opacity-60 uppercase tracking-tighter">{item.marca} {item.modelo}</span>
                                </div>
                             </td>
                             <td className="font-black text-[11px] text-gp-muted uppercase tracking-widest">{item.categoria}</td>
                             <td className="text-[11px] font-medium text-gp-text3 truncate max-w-[200px] italic opacity-60 uppercase">
                                {item.observacoes || '--'}
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
                 {processedData.length > 15 && (
                   <div className="p-6 text-center text-[11px] font-black text-gp-muted uppercase tracking-[0.2em] bg-gp-surface2/30 border-t border-gp-border opacity-50">
                     Amostragem: Visualizando 15 de {processedData.length} registros...
                   </div>
                 )}
              </div>
           </div>

           <div className="gp-card p-10 border-gp-blue/30 bg-gp-blue/[0.01] shadow-2xl relative overflow-hidden">
              <div className="flex flex-col md:flex-row justify-between items-center gap-10 relative z-10">
                <div className="text-center md:text-left space-y-3">
                  <h4 className="font-black text-2xl text-gp-text uppercase tracking-tight leading-none">Confirmar Processamento Global</h4>
                  <p className="text-gp-muted font-medium text-base">Inicie a gravação atômica dos dados e logs de auditoria no servidor.</p>
                </div>
                <button 
                  onClick={handleExecuteImport} 
                  disabled={loading} 
                  className="w-full md:w-auto btn-premium-primary px-16 py-6 rounded-2xl shadow-2xl shadow-gp-blue/30 text-[13px] font-black uppercase tracking-[0.2em] scale-105 active:scale-100 transition-transform"
                >
                  {loading ? (
                    <div className="flex items-center gap-4">
                       <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                       OPERANDO...
                    </div>
                  ) : (<><Database size={24} strokeWidth={3} className="mr-3" /> EXECUTAR TurboImport</>)}
                </button>
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-gp-blue/5 rounded-full blur-[100px] pointer-events-none" />
           </div>
        </div>
      )}

      {step === 4 && results && (
        <div className="space-y-10 animate-fade-up">
           <div className="gp-card p-16 sm:p-24 text-center space-y-12">
              <div className="w-28 h-28 bg-gp-success/10 text-gp-success rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner border border-gp-success/20">
                <CheckCircle2 size={56} strokeWidth={2.5} />
              </div>
              <div className="space-y-4">
                <h2 className="text-4xl font-black text-gp-text uppercase tracking-tight tracking-tighter">Tarefa Concluída</h2>
                <p className="text-gp-text2 text-lg font-medium max-w-lg mx-auto">O lote de importação foi processado integralmente pelo núcleo de dados.</p>
              </div>
              <div className="flex flex-wrap justify-center gap-16 pt-6">
                 <div className="flex flex-col items-center">
                    <p className="text-[11px] font-black text-gp-muted uppercase tracking-[0.3em] mb-4 opacity-70 leading-none">Inseridos</p>
                    <p className="text-6xl font-black text-gp-success tracking-tighter">{results.success}</p>
                 </div>
                 <div className="flex flex-col items-center">
                    <p className="text-[11px] font-black text-gp-muted uppercase tracking-[0.3em] mb-4 opacity-70 leading-none">Sincronizados</p>
                    <p className="text-6xl font-black text-gp-blue-light tracking-tighter">{results.updated}</p>
                 </div>
                 {results.skipped > 0 && (
                   <div className="flex flex-col items-center">
                     <p className="text-[11px] font-black text-gp-muted uppercase tracking-[0.3em] mb-4 opacity-70 leading-none">Pulsados</p>
                     <p className="text-6xl font-black text-gp-muted/40 tracking-tighter">{results.skipped}</p>
                   </div>
                 )}
              </div>
              <div className="pt-12 flex flex-col sm:flex-row justify-center gap-5">
                 <button onClick={() => navigate('/estoque')} className="btn-premium-primary px-16 py-5 rounded-2xl shadow-2xl shadow-gp-blue/20 font-black uppercase text-[11px] tracking-widest">
                   <PackageCheck size={20} strokeWidth={3} className="mr-3" /> RETORNAR AO INVENTÁRIO
                 </button>
                 <button onClick={() => setStep(1)} className="btn-premium-ghost px-12 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest border-gp-border hover:bg-gp-surface2">
                   IMPORTAR NOVO LOTE
                 </button>
              </div>
           </div>

           {results.errors.length > 0 && (
             <div className="gp-card overflow-hidden border-gp-error/20">
                <div className="p-8 border-b border-gp-error/20 bg-gp-error/[0.03] flex items-center justify-between">
                   <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-gp-error/10 text-gp-error rounded-xl flex items-center justify-center border border-gp-error/20">
                        <AlertCircle size={24} strokeWidth={2.5} />
                      </div>
                      <h3 className="font-black text-xl text-gp-text uppercase tracking-tight">Relatório de Inconsistências</h3>
                   </div>
                   <span className="text-gp-error font-black uppercase text-xs px-3 py-1 bg-gp-error/10 rounded-lg">{results.errors.length} ERROS DETECTADOS</span>
                </div>
                <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
                   <table className="gp-table">
                     <thead>
                       <tr>
                         <th>LINHA</th>
                         <th>IDENTIFICAÇÃO</th>
                         <th>MOTIVO DA REJEIÇÃO</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-gp-error/5">
                       {results.errors.map((err, i) => (
                         <tr key={i} className="hover:bg-gp-error/[0.01] transition-colors">
                           <td className="text-[11px] font-black text-gp-error opacity-40">#{err.row}</td>
                           <td className="font-mono font-black text-gp-text tracking-widest uppercase">{err.patrimonio || '---'}</td>
                           <td className="text-gp-error font-black text-xs italic uppercase opacity-80 leading-relaxed pr-8">{err.message}</td>
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
