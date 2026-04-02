import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Search, 
  Barcode, 
  Plus, 
  ExternalLink,
  Warehouse,
  Trash2,
  AlertTriangle,
  Table as TableIcon,
  X,
  CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { BarcodeScanner } from '../components/BarcodeScanner';
import { useProfile } from '../hooks/useProfile';

export default function Inventory() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);
  const [emptyConfirmStep, setEmptyConfirmStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [categoryFilter, setCategoryFilter] = useState('todos');
  const [localFilter, setLocalFilter] = useState('todos');
  const [showScanner, setShowScanner] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchAssets();
  }, [statusFilter]);

  async function fetchAssets() {
    setLoading(true);
    let query = supabase
      .from('assets')
      .select('*')
      .order('numero_patrimonio', { ascending: false });

    if (statusFilter !== 'todos') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;
    if (!error && data) {
      setAssets(data);
    }
    setLoading(false);
  }

  // Extrair categorias e locais únicos para os filtros
  const uniqueCategories = Array.from(new Set(assets.map(a => a.categoria).filter(Boolean)));
  const uniqueLocals = Array.from(new Set(assets.map(a => a.local).filter(Boolean)));

  async function executeEmptyInventory() {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('assets')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); 

      if (error) throw error;
      
      setEmptyConfirmStep(3); // Success step
      fetchAssets();
    } catch (err: any) {
      alert('Erro ao esvaziar estoque: ' + err.message);
      setShowEmptyConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  }

  const filteredAssets = assets.filter(a => {
    const matchesSearch = 
      a.nome_item.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.numero_patrimonio.includes(searchTerm) ||
      (a.codigo_barras && a.codigo_barras.includes(searchTerm)) ||
      (a.modelo && a.modelo.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = categoryFilter === 'todos' || a.categoria === categoryFilter;
    const matchesLocal = localFilter === 'todos' || a.local === localFilter;
    
    return matchesSearch && matchesCategory && matchesLocal;
  });

  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);
  const paginatedAssets = filteredAssets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const statusColors: any = {
    em_estoque: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    em_uso: 'bg-blue-100 text-blue-700 border-blue-200',
    manutencao: 'bg-amber-100 text-amber-700 border-amber-200',
    baixado: 'bg-rose-100 text-rose-700 border-rose-200',
  };

  const statusLabels: any = {
    em_estoque: 'Em Estoque',
    em_uso: 'Em Uso',
    manutencao: 'Manutenção',
    baixado: 'Baixado',
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
             <Warehouse className="text-primary-600" size={32} />
             Controle de Estoque e Patrimônio
          </h1>
          <p className="text-slate-500 text-lg">Inventário centralizado de ativos e hardware.</p>
        </div>
        <div className="flex gap-3">
          {profile?.role === 'master_admin' && assets.length > 0 && (
            <button 
              onClick={() => { setShowEmptyConfirm(true); setEmptyConfirmStep(1); }}
              className="bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20 px-6 py-3 rounded-2xl font-black flex items-center gap-2 transition-all active:scale-95"
              title="Apagar todo o estoque"
            >
              <Trash2 size={20} />
              {isDeleting ? 'Esvaziando...' : 'Esvaziar Estoque'}
            </button>
          )}
          <button 
            onClick={() => navigate('/novo-ativo')}
            className="bg-primary-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-primary-500/20"
          >
            <Plus size={20} strokeWidth={3} />
            Novo Ativo
          </button>
          <button 
            onClick={() => navigate('/importar-estoque')}
            className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-6 py-3 rounded-2xl font-black flex items-center gap-2 transition-all border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 active:scale-95"
          >
            <TableIcon size={20} />
            Importar Excel
          </button>
          <button 
            onClick={() => setShowScanner(true)}
            className="bg-slate-950 dark:bg-white dark:text-slate-950 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 transition-all shadow-xl active:scale-95"
          >
            <Barcode size={20} strokeWidth={3} />
            Escanear
          </button>
        </div>
      </header>

      {showScanner && (
        <BarcodeScanner 
          onScan={(text) => {
            setSearchTerm(text);
            setShowScanner(false);
          }}
          onClose={() => setShowScanner(false)} 
        />
      )}

      {/* Busca e Filtros */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 bg-white dark:bg-slate-900 p-3 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center">
              <Search className="ml-4 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="Buscar por patrimônio, nome, modelo ou código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-2 bg-transparent border-none outline-none font-bold text-slate-900 dark:text-white" 
              />
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
             {['todos', 'em_estoque', 'em_uso', 'manutencao', 'baixado'].map((st) => (
               <button
                 key={st}
                 onClick={() => setStatusFilter(st)}
                 className={clsx(
                   "px-6 py-2.5 rounded-[1.5rem] text-[10px] uppercase font-black tracking-widest transition-all",
                   statusFilter === st 
                    ? "bg-slate-900 dark:bg-white dark:text-slate-950 text-white shadow-lg" 
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                 )}
               >
                 {st.replace('_', ' ')}
               </button>
             ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
           {/* Filtro de Categoria */}
           <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
             <span className="text-[9px] font-black uppercase text-slate-400 ml-3 tracking-[0.2em]">Categoria:</span>
             <select 
               value={categoryFilter}
               onChange={(e) => setCategoryFilter(e.target.value)}
               className="bg-transparent border-none outline-none text-xs font-black text-slate-600 dark:text-slate-200 pr-4"
             >
               <option value="todos">Todas as Categorias</option>
               {uniqueCategories.map(cat => (
                 <option key={cat} value={cat}>{cat}</option>
               ))}
             </select>
           </div>

           {/* Filtro de Local */}
           <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
             <span className="text-[9px] font-black uppercase text-slate-400 ml-3 tracking-[0.2em]">Local:</span>
             <select 
               value={localFilter}
               onChange={(e) => setLocalFilter(e.target.value)}
               className="bg-transparent border-none outline-none text-xs font-black text-slate-600 dark:text-slate-200 pr-4"
             >
               <option value="todos">Todos os Locais</option>
               {uniqueLocals.map(loc => (
                 <option key={loc} value={loc}>{loc}</option>
               ))}
             </select>
           </div>

           {/* Contador de Filtro */}
           {(categoryFilter !== 'todos' || localFilter !== 'todos') && (
             <button 
               onClick={() => { setCategoryFilter('todos'); setLocalFilter('todos'); }}
               className="text-[9px] font-black text-rose-500 uppercase tracking-widest hover:underline ml-2"
             >
               Limpar Filtros Avançados
             </button>
           )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black border-b border-slate-100 dark:border-slate-800">
                <th className="px-8 py-5">Patrimônio</th>
                <th className="px-8 py-5">Marca / Modelo</th>
                <th className="px-8 py-5">Local</th>
                <th className="px-8 py-5">Usuário (Import.)</th>
                <th className="px-8 py-5">Situação</th>
                <th className="px-8 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-8 py-8 h-20 bg-slate-50/10"></td>
                  </tr>
                ))
              ) : filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-slate-500 italic font-medium">Nenhum item encontrado no estoque.</td>
                </tr>
              ) : (
                 paginatedAssets.map((asset) => (
                  <tr 
                    key={asset.id} 
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-all group cursor-pointer"
                    onClick={() => navigate(`/estoque/${asset.id}`)}
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center font-black group-hover:bg-primary-600 group-hover:text-white transition-all">
                            {asset.nome_item.charAt(0).toUpperCase()}
                         </div>
                         <div className="flex flex-col">
                            <span className="font-black text-slate-900 dark:text-white text-base font-mono leading-none">
                               {asset.numero_patrimonio || asset.codigo_gps || 'S/N'}
                            </span>
                            {asset.codigo_gps && <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest mt-1">Código GPS</span>}
                            {!asset.numero_patrimonio && !asset.codigo_gps && <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest mt-1">Pendente</span>}
                         </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-slate-400 font-bold text-xs">
                             <Barcode size={14} className="opacity-50" />
                             {asset.codigo_barras || 'N/A'}
                          </div>
                          {asset.tipo_ativo && (
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                               TIPO: {asset.tipo_ativo}
                            </span>
                          )}
                       </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 dark:text-white text-sm truncate max-w-[200px]">{asset.nome_item}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{asset.marca} {asset.modelo}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                       <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">{asset.local || '-'}</span>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex flex-col">
                          <span className="text-xs font-black text-primary-600 dark:text-primary-400">{asset.usuario_nome_importado || '-'}</span>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <span className={clsx(
                         "px-3 py-1 rounded-xl text-[10px] font-black border uppercase tracking-wider",
                         statusColors[asset.status] || 'bg-slate-100 text-slate-600 border-slate-200'
                       )}>
                         {statusLabels[asset.status] || asset.status}
                       </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <div className="inline-flex items-center justify-center w-10 h-10 text-slate-400 hover:text-primary-600 rounded-xl hover:bg-primary-50 transition-all">
                          <ExternalLink size={18} />
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="px-8 py-6 bg-slate-50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Mostrando {Math.min(filteredAssets.length, ((currentPage - 1) * itemsPerPage) + 1)} - {Math.min(filteredAssets.length, currentPage * itemsPerPage)} de {filteredAssets.length} registros
            </p>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-800 disabled:opacity-30 hover:bg-white dark:hover:bg-slate-800 transition-all"
              >
                Anterior
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={clsx(
                    "w-10 h-10 rounded-xl text-[10px] font-black flex items-center justify-center transition-all",
                    currentPage === i + 1 
                      ? "bg-primary-600 text-white shadow-lg" 
                      : "text-slate-400 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
                  )}
                >
                  {i + 1}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-800 disabled:opacity-30 hover:bg-white dark:hover:bg-slate-800 transition-all"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Confirmação de Exclusão SaaS */}
      {showEmptyConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 border border-slate-200 dark:border-slate-800">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                 <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-900/30 text-rose-600 flex items-center justify-center shrink-0">
                    {emptyConfirmStep === 3 ? <CheckCircle size={28} /> : <AlertTriangle size={28} />}
                 </div>
                 <button 
                   onClick={() => setShowEmptyConfirm(false)}
                   disabled={isDeleting}
                   className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50"
                 >
                   <X size={24} />
                 </button>
              </div>

              {emptyConfirmStep === 1 && (
                <div className="space-y-4">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Esvaziar Estoque?</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">
                    Você está prestes a apagar permanentemente <strong className="text-slate-900 dark:text-white">{assets.length} registros</strong> de ativos. Esta ação não pode ser desfeita. Tem certeza?
                  </p>
                  <div className="pt-6 flex gap-3">
                    <button 
                      onClick={() => setShowEmptyConfirm(false)}
                      className="flex-1 px-4 py-3 rounded-2xl font-black text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                    >
                      CANCELAR
                    </button>
                    <button 
                      onClick={() => setEmptyConfirmStep(2)}
                      className="flex-1 px-4 py-3 rounded-2xl font-black bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
                    >
                      SIM, CONTINUAR
                    </button>
                  </div>
                </div>
              )}

              {emptyConfirmStep === 2 && (
                 <div className="space-y-4">
                  <h3 className="text-2xl font-black text-rose-600 tracking-tight">Última Chance</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">
                    Para garantir que não foi um clique acidental, confirme novamente. Todos os dados patrimoniais vão desaparecer.
                  </p>
                  <div className="pt-6 flex gap-3">
                    <button 
                      onClick={() => setShowEmptyConfirm(false)}
                      disabled={isDeleting}
                      className="flex-1 px-4 py-3 rounded-2xl font-black text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
                    >
                      CANCELAR
                    </button>
                    <button 
                      onClick={executeEmptyInventory}
                      disabled={isDeleting}
                      className="flex-1 px-4 py-3 rounded-2xl font-black bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/30 active:scale-95 transition-all flex items-center justify-center disabled:opacity-70"
                    >
                      {isDeleting ? (
                         <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : 'DELETAR TUDO'}
                    </button>
                  </div>
                </div>
              )}

              {emptyConfirmStep === 3 && (
                 <div className="space-y-4 text-center">
                  <h3 className="text-2xl font-black text-emerald-600 tracking-tight mt-2">Sucesso!</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">
                    O estoque foi esvaziado com segurança.
                  </p>
                  <div className="pt-6">
                    <button 
                      onClick={() => setShowEmptyConfirm(false)}
                      className="w-full px-4 py-3 rounded-2xl font-black bg-slate-900 dark:bg-white dark:text-slate-900 text-white shadow-lg active:scale-95 transition-all"
                    >
                      FECHAR
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
