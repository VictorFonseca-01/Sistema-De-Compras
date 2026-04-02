import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';
import { useProfile } from '../hooks/useProfile';
import { parsePatrimonyValue } from '../utils/assetParser';
import { 
  ArrowLeft, 
  FileBox, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Table as TableIcon,
  ChevronRight,
  Database,
  Search,
  PackageCheck
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
  const [importMode, setImportMode] = useState<'inserir' | 'atualizar' | 'ignorar_duplicados'>('inserir');
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
      
      // Pegar todas as linhas brutas como arrays para identificar o cabeçalho
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
      
      if (rows.length > 0) {
        // 1. Encontrar a linha de cabeçalho (a primeira que tem mais de 2 células preenchidas com texto)
        let headerRowIndex = 0;
        for (let i = 0; i < Math.min(rows.length, 10); i++) {
          const row = rows[i];
          const textCells = row.filter(c => typeof c === 'string' && c.length > 2);
          if (textCells.length >= 3) { // Se tem pelo menos 3 colunas de texto, provável cabeçalho
            headerRowIndex = i;
            break;
          }
        }

        const headers = rows[headerRowIndex].map(h => String(h || '').trim()).filter(h => h !== '');
        setColumns(headers);

        // 2. Extrair os dados a partir da linha após o cabeçalho
        const data = XLSX.utils.sheet_to_json(ws, { 
          range: headerRowIndex,
          defval: null
        }) as ImportRow[];
        
        setRawData(data);
        
        // Tenta auto-mapear colunas óbvias
        const newMap = { ...DEFAULT_MAP };
        headers.forEach(col => {
          const c = col.toLowerCase();
          if (c.includes('item') || c.includes('nome') || c === 'ativo') newMap.nome_item = col;
          if (c.includes('patrimonio') || c.includes('patrimônio') || c.includes('plaqueta')) newMap.numero_patrimonio = col;
          if (c.includes('marca')) newMap.marca = col;
          if (c.includes('modelo') || c === 'model') newMap.modelo = col;
          if (c.includes('serie') || c.includes('série') || c === 'sn' || c === 's/n') newMap.numero_serie = col;
          if (c.includes('categoria')) newMap.categoria = col;
          if (c.includes('empresa')) newMap.empresa = col;
          if (c.includes('departamento') || c.includes('depto')) newMap.departamento = col;
          if (c.includes('valor') || c.includes('preço')) newMap.valor = col;
          if (c.includes('local') || c.includes('unidade')) newMap.local = col;
          if (c.includes('usuario') || c.includes('usuário') || c.includes('dono')) newMap.usuario_nome = col;
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
      // Pega o valor bruto da coluna mapeada como patrimônio
      const rawPatrimonio = row[mapping.numero_patrimonio];
      const parsed = parsePatrimonyValue(rawPatrimonio);
      
      return {
        ...parsed,
        row_idx: idx + 1,
        nome_item: row[mapping.nome_item] || 'Item sem nome',
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
        observacoes: `${parsed.observacoes || ''} ${row[mapping.observacoes] || ''}`.trim()
      };
    });

    setProcessedData(processed);
    setStep(3);
  };

  // --- STEP 3: EXECUTE IMPORT ---
  const handleExecuteImport = async () => {
    if (!profile) return;
    setLoading(true);
    
    // 1. Criar lote de importação
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

    // 2. Processamento em Lotes (Chunking 50 por vez)
    const chunkSize = 50;
    for (let i = 0; i < processedData.length; i += chunkSize) {
      const chunk = processedData.slice(i, i + chunkSize);
      
      const assetsToUpsert = chunk.map(item => ({
        nome_item: item.nome_item,
        descricao: item.observacoes,
        numero_patrimonio: item.numero_patrimonio,
        codigo_gps: item.codigo_gps,
        tipo_ativo: item.tipo_ativo,
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
        status: 'em_estoque'
      }));

      try {
        let resultData: any[] = [];
        
        if (importMode === 'atualizar') {
          const { data: upserted, error } = await supabase
            .from('assets')
            .upsert(assetsToUpsert, { 
              onConflict: 'numero_patrimonio', // Baseado no patrimônio (único)
              ignoreDuplicates: false
            })
            .select('id');
          if (error) throw error;
          resultData = upserted || [];
          updatedCount += resultData.length;
        } else if (importMode === 'ignorar_duplicados') {
          const { data: inserted, error } = await supabase
            .from('assets')
            .upsert(assetsToUpsert, { 
              onConflict: 'numero_patrimonio',
              ignoreDuplicates: true
            })
            .select('id');
          if (error) throw error;
          resultData = inserted || [];
          successCount += resultData.length;
          skippedCount += (chunk.length - resultData.length);
        } else {
          const { data: inserted, error } = await supabase
            .from('assets')
            .insert(assetsToUpsert)
            .select('id');
          if (error) throw error;
          resultData = inserted || [];
          successCount += resultData.length;
        }

        // Registrar Movimentações em Lote para este bloco
        if (resultData.length > 0) {
          const movements = resultData.map(asset => ({
            asset_id: asset.id,
            tipo: 'importacao',
            user_id: profile.id,
            observacao: `Importação em lote (${importMode}): ${fileName}`
          }));
          await supabase.from('asset_movements').insert(movements);
        }

      } catch (error: any) {
        // Se o bloco falhar, tentamos salvar os erros individualmente apenas deste bloco
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

    // 3. Finalizar Lote
    await supabase.from('asset_import_batches').update({
       success_rows: successCount + updatedCount,
       error_rows: errors.length
    }).eq('id', batch.id);

    setResults({ success: successCount, updated: updatedCount, skipped: skippedCount, errors });
    setStep(4);
    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in slide-in-from-bottom-6 duration-700 pb-20">
      <header className="flex flex-col gap-4">
        <button 
          onClick={() => step > 1 ? setStep(step - 1) : navigate('/estoque')}
          className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary-600 transition-colors"
        >
          <ArrowLeft size={14} /> {step > 1 ? 'Voltar Etapa' : 'Voltar ao Estoque'}
        </button>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Importação de Inventário</h1>
            <p className="text-slate-500 text-lg">Suba planilhas Excel e organize seus ativos dinamicamente.</p>
          </div>
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
             {[1,2,3,4].map(s => (
                <div key={s} className={clsx("w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs", step === s ? "bg-primary-600 text-white shadow-lg" : "text-slate-400")}>{s}</div>
             ))}
          </div>
        </div>
      </header>

      {/* STEP 1: UPLOAD */}
      {step === 1 && (
        <div 
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) {
              // Trigger the same logic as file input
              const fakeEvent = { target: { files: [file] } } as any;
              handleFileUpload(fakeEvent);
            }
          }}
          className={clsx(
            "rounded-[2.5rem] border-4 border-dashed p-20 text-center space-y-8 transition-all duration-500 relative group overflow-hidden",
            isDragging 
              ? "bg-primary-50/80 dark:bg-primary-900/20 border-primary-500 dark:border-primary-400 shadow-[0_0_40px_rgba(99,102,241,0.2)] scale-[1.01]" 
              : loading 
                ? "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 pointer-events-none" 
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-primary-400 dark:hover:border-primary-500/50 hover:bg-primary-50/50 dark:hover:bg-primary-900/10"
          )}
        >
           <div className={clsx(
             "w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto transition-all duration-500",
             isDragging 
               ? "bg-primary-100 dark:bg-primary-900/40 text-primary-600 scale-125 rotate-[-6deg]" 
               : "bg-slate-50 dark:bg-slate-800 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/40 text-slate-400 group-hover:text-primary-600 group-hover:scale-110"
           )}>
              <FileBox size={48} />
           </div>
           <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                {isDragging ? 'Solte o arquivo aqui!' : 'Selecione seu arquivo'}
              </h3>
              <p className="text-slate-500 font-medium mt-1">Formatos suportados: .xlsx, .xls e .csv (Planilhas reais com dados variados)</p>
           </div>
           <div className="pt-4 flex flex-col items-center gap-4 relative z-10">
              <label 
                className={clsx(
                  "text-white px-12 py-5 rounded-[2rem] font-black shadow-xl shadow-primary-500/20 cursor-pointer transition-all flex items-center gap-3",
                  loading ? "bg-primary-400" : "bg-primary-600 hover:bg-primary-500 active:scale-95 group-hover:scale-105"
                )}
              >
                 {loading ? (
                   <>
                     <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                     PROCESSANDO...
                   </>
                 ) : (
                   <>
                     <Upload size={24} strokeWidth={3} />
                     ESCOLHER PLANILHA
                   </>
                 )}
                 <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} disabled={loading} />
              </label>
              <button className="text-slate-400 hover:text-primary-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-colors">
                 <Download size={14} /> Baixar Modelo Sugerido
              </button>
           </div>
        </div>
      )}

      {/* STEP 2: MAPPING */}
      {step === 2 && (
        <div className="space-y-8 animate-in fade-in duration-500">
           <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-8 rounded-[2.5rem] flex gap-5 items-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shrink-0">
                 <TableIcon size={24} />
              </div>
              <div>
                 <h4 className="font-black text-blue-900 dark:text-blue-300 text-lg leading-tight">Mapeamento de Colunas</h4>
                 <p className="text-blue-700 dark:text-blue-400 font-medium text-sm">Relacione as colunas da sua planilha com os campos do sistema.</p>
              </div>
           </div>

           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                 {Object.keys(DEFAULT_MAP).map((field) => (
                    <div key={field} className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                          {field.replace('_', ' ')} {field === 'nome_item' || field === 'numero_patrimonio' ? '*' : ''}
                       </label>
                       <select 
                         value={mapping[field]}
                         onChange={(e) => setMapping({ ...mapping, [field]: e.target.value })}
                         className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-primary-500 rounded-[1.5rem] px-5 py-4 outline-none font-bold text-slate-700 dark:text-slate-300 transition-all appearance-none"
                       >
                          <option value="">-- Não Mapear --</option>
                          {columns.map(col => <option key={col} value={col}>{col}</option>)}
                       </select>
                    </div>
                 ))}
              </div>
              <div className="mt-12 pt-10 border-t border-slate-50 dark:border-slate-800 flex justify-end">
                  <button 
                    onClick={handleProcessPreview}
                    className="bg-slate-950 dark:bg-white dark:text-slate-950 text-white px-12 py-5 rounded-[2rem] font-black flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95"
                  >
                    CONTINUAR PARA PREVIEW <ChevronRight size={20} />
                  </button>
              </div>
           </div>
        </div>
      )}

      {/* STEP 3: PREVIEW INTELIGENTE */}
      {step === 3 && (
        <div className="space-y-8 animate-in fade-in duration-500">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total de Linhas</p>
                 <p className="text-3xl font-black text-slate-900 dark:text-white">{processedData.length}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm col-span-2 flex items-center gap-4">
                 <div className="flex-1 space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Modo de Importação</p>
                    <div className="flex gap-2">
                       {['inserir', 'atualizar', 'ignorar_duplicados'].map(m => (
                          <button 
                            key={m}
                            onClick={() => setImportMode(m as any)}
                            className={clsx("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all", importMode === m ? "bg-slate-950 dark:bg-white dark:text-slate-950 text-white border-transparent shadow-lg" : "text-slate-400 border-slate-200 dark:border-slate-800")}
                          >
                            {m.replace('_', ' ')}
                          </button>
                       ))}
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-50 dark:border-slate-800">
                 <h3 className="font-black text-xl flex items-center gap-3">
                   <div className="w-10 h-10 rounded-2xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 flex items-center justify-center">
                     <Search size={20} />
                   </div>
                   Preview do Tratamento de Dados
                 </h3>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100 dark:border-slate-800">
                       <tr>
                          <th className="px-8 py-5">Original</th>
                          <th className="px-8 py-5">Tipo Identificado</th>
                          <th className="px-8 py-5">Patrimônio / GPS</th>
                          <th className="px-8 py-5">Marca / Modelo</th>
                          <th className="px-8 py-5">Categoria Sugerida</th>
                          <th className="px-8 py-5">Observações</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                       {processedData.slice(0, 10).map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                             <td className="px-8 py-5 font-bold text-slate-400">{item.valor_original}</td>
                             <td className="px-8 py-5">
                                <span className={clsx("px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border", 
                                  item.identificacao_tipo === 'patrimonio' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                  item.identificacao_tipo === 'gps' ? "bg-blue-50 text-blue-600 border-blue-100" :
                                  item.identificacao_tipo === 'novo' ? "bg-purple-50 text-purple-600 border-purple-100" :
                                  "bg-slate-100 text-slate-500 border-slate-200"
                                )}>
                                   {item.identificacao_tipo}
                                </span>
                             </td>
                             <td className="px-8 py-5 font-black text-slate-900 dark:text-white font-mono">
                                {item.numero_patrimonio || item.codigo_gps || '-'}
                             </td>
                             <td className="px-8 py-5">
                                <div className="flex flex-col">
                                   <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{item.marca || '-'}</span>
                                   <span className="text-[10px] text-slate-400 font-medium uppercase">{item.modelo || '-'}</span>
                                </div>
                             </td>
                             <td className="px-8 py-5 text-sm font-bold text-slate-600 dark:text-slate-400">
                                {item.categoria}
                             </td>
                             <td className="px-8 py-5 text-[10px] text-slate-400 font-bold uppercase truncate max-w-xs transition-all">
                                {item.observacoes}
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
                 {processedData.length > 10 && (
                   <div className="p-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">
                      Exibindo as primeiras 10 de {processedData.length} linhas...
                   </div>
                 )}
              </div>
           </div>

           <div className="flex justify-between items-center bg-slate-950 dark:bg-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
              {loading && (
                <div className="absolute inset-0 bg-slate-950/80 dark:bg-white/80 backdrop-blur-sm z-20 flex items-center justify-center rounded-[2.5rem]">
                  <div className="flex items-center gap-4 text-white dark:text-slate-900">
                    <div className="w-8 h-8 border-3 border-white/30 dark:border-slate-900/30 border-t-white dark:border-t-slate-900 rounded-full animate-spin"></div>
                    <span className="font-black text-lg tracking-wider">IMPORTANDO DADOS...</span>
                  </div>
                </div>
              )}
              <div className="text-white dark:text-slate-950">
                 <h4 className="font-black text-lg">Pronto para processar?</h4>
                 <p className="text-white/60 dark:text-slate-500 font-bold text-sm">Os dados serão validados quanto a duplicidade final antes de salvar.</p>
              </div>
              <button 
                onClick={handleExecuteImport}
                disabled={loading}
                className="bg-primary-600 hover:bg-primary-500 text-white px-12 py-5 rounded-[2rem] font-black flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? 'IMPORTANDO...' : (
                   <>
                     <Database size={24} strokeWidth={3} /> INICIAR IMPORTAÇÃO
                   </>
                )}
              </button>
           </div>
        </div>
      )}

      {/* STEP 4: RESULTADOS */}
      {step === 4 && results && (
        <div className="space-y-8 animate-in zoom-in duration-500">
           <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
              <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl">
                 <CheckCircle2 size={48} strokeWidth={3} />
              </div>
              <div className="space-y-2">
                 <h2 className="text-4xl font-black text-slate-900 dark:text-white">Importação Finalizada</h2>
                 <p className="text-slate-500 text-lg font-medium">Relatório completo do lote processado.</p>
              </div>

              <div className="flex justify-center gap-10 pt-8">
                 <div className="text-center group">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Inseridos</p>
                    <p className="text-4xl font-black text-emerald-600 transition-transform group-hover:scale-110">{results.success}</p>
                 </div>
                 <div className="text-center group">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Atualizados</p>
                    <p className="text-4xl font-black text-blue-600 transition-transform group-hover:scale-110">{results.updated}</p>
                 </div>
                 {results.skipped > 0 && (
                   <div className="text-center group">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pulados</p>
                      <p className="text-4xl font-black text-slate-400 transition-transform group-hover:scale-110">{results.skipped}</p>
                   </div>
                 )}
                 <div className="text-center group">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Erros</p>
                    <p className={clsx("text-4xl font-black transition-transform group-hover:scale-110", results.errors.length > 0 ? "text-rose-600" : "text-slate-200")}>{results.errors.length}</p>
                 </div>
              </div>

              <div className="pt-8 flex justify-center gap-4">
                 <button onClick={() => navigate('/estoque')} className="px-10 py-5 bg-slate-950 dark:bg-white dark:text-slate-950 text-white rounded-[2rem] font-black shadow-xl active:scale-95 transition-all flex items-center gap-3">
                    <PackageCheck size={24} /> IR PARA O ESTOQUE
                 </button>
                 <button onClick={() => setStep(1)} className="px-10 py-5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-[2rem] font-black active:scale-95 transition-all">
                    NOVA IMPORTAÇÃO
                 </button>
              </div>
           </div>

           {results.errors.length > 0 && (
             <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden overflow-y-auto max-h-96">
                <div className="p-8 border-b border-rose-50 dark:border-rose-900/20 bg-rose-50/30 dark:bg-rose-900/10">
                   <h3 className="font-black text-rose-600 flex items-center gap-3">
                      <AlertCircle size={20} /> Relatório de Erros por Linha
                   </h3>
                </div>
                <table className="w-full text-left">
                   <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-[10px] uppercase font-black">
                      <tr>
                         <th className="px-8 py-4">Linha</th>
                         <th className="px-8 py-4">Patrimônio Tentado</th>
                         <th className="px-8 py-4">Mensagem de Erro</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {results.errors.map((err, i) => (
                         <tr key={i}>
                            <td className="px-8 py-4 font-black text-slate-400">{err.row}</td>
                            <td className="px-8 py-4 font-black text-slate-900 dark:text-white">{err.patrimonio || 'N/A'}</td>
                            <td className="px-8 py-4 text-xs font-bold text-rose-500 italic">{err.message}</td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
           )}
        </div>
      )}
    </div>
  );
}
