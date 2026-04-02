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
  CheckCircle,
  Filter,
  Package
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
  const [sortOrder, setSortOrder] = useState<'recent' | 'az'>('recent');
  const itemsPerPage = 10;

  useEffect(() => {
    fetchAssets();
  }, [statusFilter, sortOrder]);

  async function fetchAssets() {
    setLoading(true);
    let query = supabase
      .from('assets')
      .select('*')
      .order(sortOrder === 'az' ? 'nome_item' : 'created_at', { 
        ascending: sortOrder === 'az' 
      });

    if (statusFilter !== 'todos') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;
    if (!error && data) {
      setAssets(data);
    }
    setLoading(false);
  }

  const uniqueCategories = Array.from(new Set(assets.map(a => a.categoria).filter(Boolean)));
  const uniqueLocals = Array.from(new Set(assets.map(a => a.local).filter(Boolean)));

  async function executeEmptyInventory() {
    setIsDeleting(true);
    try {
      const { error } = await supabase.rpc('empty_asset_inventory');
      if (error) throw error;
      setEmptyConfirmStep(3);
      fetchAssets();
    } catch (err: any) {
      alert('Erro ao esvaziar estoque: ' + err.message);
      setShowEmptyConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  }

  const filteredAssets = assets.filter(a => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      (a.nome_item || '').toLowerCase().includes(term) ||
      (a.numero_patrimonio || '').includes(searchTerm) ||
      (a.codigo_barras && a.codigo_barras.includes(searchTerm)) ||
      (a.modelo && a.modelo.toLowerCase().includes(term)) ||
      (a.local && a.local.toLowerCase().includes(term)) ||
      (a.empresa && a.empresa.toLowerCase().includes(term)) ||
      (a.usuario_nome_importado && a.usuario_nome_importado.toLowerCase().includes(term)) ||
      (a.codigo_gps && a.codigo_gps.toLowerCase().includes(term));
    
    const matchesCategory = categoryFilter === 'todos' || a.categoria === categoryFilter;
    const matchesLocal = localFilter === 'todos' || a.local === localFilter;
    
    return matchesSearch && matchesCategory && matchesLocal;
  });

  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);
  const paginatedAssets = filteredAssets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getPaginationGroup = () => {
    const total = totalPages;
    const current = currentPage;
    const size = 5;
    if (total <= size) return Array.from({ length: total }, (_, i) => i + 1);
    let start = Math.max(current - Math.floor(size / 2), 1);
    let end = start + size - 1;
    if (end > total) { end = total; start = end - size + 1; }
    const pages: (number | string)[] = [];
    if (start > 1) { pages.push(1); if (start > 2) pages.push('...'); }
    for (let i = start; i <= end; i++) { pages.push(i); }
    if (end < total) { if (end < total - 1) pages.push('...'); pages.push(total); }
    return pages;
  };

  const statusColors: any = {
    em_estoque: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/10',
    em_uso: 'text-blue-500 bg-blue-500/10 border-blue-500/20 shadow-blue-500/10',
    manutencao: 'text-amber-500 bg-amber-500/10 border-amber-500/20 shadow-amber-500/10',
    baixado: 'text-rose-500 bg-rose-500/10 border-rose-500/20 shadow-rose-500/10',
  };

  const statusLabels: any = {
    em_estoque: 'Em Estoque',
    em_uso: 'Em Uso',
    manutencao: 'Manutenção',
    baixado: 'Baixado',
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20 font-sans">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-3 leading-none">
             <Warehouse className="text-primary-600" size={40} />
             Inventário <span className="text-primary-600">Global</span>
          </h1>
          <p className="text-slate-500 text-lg font-medium">Controle centralizado de ativos, hardware e patrimônio físico.</p>
        </div>
        <div className="flex gap-3">
          {profile?.role === 'master_admin' && assets.length > 0 && (
            <button 
              onClick={() => { setShowEmptyConfirm(true); setEmptyConfirmStep(1); }}
              className="btn-premium-danger px-6 py-3 rounded-2xl shadow-sm"
            >
              <Trash2 size={20} />
              {isDeleting ? 'Esvaziando...' : 'Zerar Estoque'}
            </button>
          )}
          <button onClick={() => navigate('/novo-ativo')} className="btn-premium-primary px-6 py-3 rounded-2xl shadow-xl shadow-primary-600/20">
            <Plus size={20} strokeWidth={3} /> Novo Ativo
          </button>
          <button onClick={() => navigate('/importar-estoque')} className="btn-premium-secondary px-6 py-3 rounded-2xl">
            <TableIcon size={20} /> Importar Excel
          </button>
          <button onClick={() => setShowScanner(true)} className="btn-premium-dark px-6 py-3 rounded-2xl">
            <Barcode size={20} strokeWidth={3} /> Escanear
          </button>
        </div>
      </header>

      {showScanner && <BarcodeScanner onScan={(text) => { setSearchTerm(text); setShowScanner(false); }} onClose={() => setShowScanner(false)} />}

      <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 animate-in slide-in-from-top-4 duration-700">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 relative group">
            <Search className="absolute left-6 top-4 text-slate-400 group-focus-within:text-primary-600 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Pesquisar por patrimônio, nome, modelo, local, empresa ou CPF/Usuário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-16 pr-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent rounded-[1.5rem] outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-slate-950 transition-all font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400" 
            />
          </div>
          
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-[1.5rem]">
             {[{ id: 'recent', label: 'Recentes' }, { id: 'az', label: 'A-Z' }].map((sort) => (
                <button 
                  key={sort.id} 
                  onClick={() => setSortOrder(sort.id as any)} 
                  className={clsx(
                    "px-6 py-2 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all", 
                    sortOrder === sort.id ? "btn-premium-primary shadow-lg" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  )}
                >
                  {sort.label}
                </button>
             ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
           <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 px-5 py-3 rounded-2xl relative group/select">
             <Filter size={14} className="text-slate-400" />
             <span className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Situação:</span>
             <select 
               value={statusFilter} 
               onChange={(e) => setStatusFilter(e.target.value)} 
               className="bg-transparent border-none outline-none text-xs font-black text-slate-700 dark:text-slate-200 pr-8 appearance-none cursor-pointer"
             >
                {['todos', 'em_estoque', 'em_uso', 'manutencao', 'baixado'].map(st => (
                  <option key={st} value={st}>{st === 'todos' ? 'Todas' : statusLabels[st]}</option>
                ))}
             </select>
           </div>

           <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 px-5 py-3 rounded-2xl relative group/select">
             <Package size={14} className="text-slate-400" />
             <span className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Categoria:</span>
             <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="bg-transparent border-none outline-none text-xs font-black text-slate-700 dark:text-slate-200 pr-8 appearance-none cursor-pointer">
               <option value="todos">Todas</option>
               {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
             </select>
           </div>

           <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 px-5 py-3 rounded-2xl relative group/select">
             <Warehouse size={14} className="text-slate-400" />
             <span className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Local:</span>
             <select value={localFilter} onChange={(e) => setLocalFilter(e.target.value)} className="bg-transparent border-none outline-none text-xs font-black text-slate-700 dark:text-slate-200 pr-8 appearance-none cursor-pointer">
               <option value="todos">Todos</option>
               {uniqueLocals.map(loc => <option key={loc} value={loc}>{loc}</option>)}
             </select>
           </div>

           {(statusFilter !== 'todos' || categoryFilter !== 'todos' || localFilter !== 'todos' || searchTerm !== '') && (
             <button 
               onClick={() => { setStatusFilter('todos'); setCategoryFilter('todos'); setLocalFilter('todos'); setSearchTerm(''); }} 
               className="btn-premium-ghost px-4 py-2 rounded-xl text-[9px] uppercase tracking-widest text-rose-500 hover:text-rose-600"
             >
               Limpar Filtros
             </button>
           )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black border-b border-slate-100 dark:border-slate-800">
                <th className="px-8 py-5">Ativo / Identificação</th>
                <th className="px-8 py-5">Especificações</th>
                <th className="px-8 py-5">Localidade & Empresa</th>
                <th className="px-8 py-5">Responsável (Import.)</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Auditoria</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {loading ? Array.from({ length: 5 }).map((_, i) => (<tr key={i} className="animate-pulse"><td colSpan={6} className="px-8 py-8 h-20 bg-slate-50/10"></td></tr>)) : filteredAssets.length === 0 ? (<tr><td colSpan={6} className="px-8 py-20 text-center text-slate-500 italic font-medium">Nenhum item encontrado no inventário.</td></tr>) : (
                paginatedAssets.map((asset) => {
                  const displayName = (asset.nome_item === 'Item sem nome' || !asset.nome_item) ? (asset.modelo || asset.marca || 'Ativo sem Identificação') : asset.nome_item;
                  return (
                    <tr key={asset.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-all group cursor-pointer" onClick={() => navigate(`/estoque/${asset.id}`)}>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className={clsx(
                             "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg transition-all shadow-sm border",
                             "bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-primary-600 group-hover:text-white group-hover:border-primary-500"
                          )}>
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-black text-slate-900 dark:text-white text-base tracking-tight leading-none mb-1">
                              {asset.numero_patrimonio || 'S/N'}
                            </span>
                            <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest flex items-center gap-1">
                               <Barcode size={10} /> CODE: {asset.codigo_gps || asset.codigo_barras || 'PENDENTE'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-black text-slate-900 dark:text-slate-100 text-sm truncate max-w-[200px]">{displayName}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">{asset.marca || 'Sem Marca'} • {asset.modelo || 'Sem Modelo'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wide truncate max-w-[150px]">{asset.local || 'Estoque Central'}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">{asset.empresa || 'GLOBAL'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-primary-600 dark:text-primary-400 truncate max-w-[150px]">{asset.usuario_nome_importado || '-'}</span>
                          <span className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">{asset.departamento || 'GERAL'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={clsx(
                           "px-4 py-2 rounded-xl text-[10px] font-black border uppercase tracking-wider shadow-sm",
                           statusColors[asset.status] || 'bg-slate-100 text-slate-600 border-slate-200'
                        )}>
                          {statusLabels[asset.status] || asset.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="inline-flex items-center justify-center w-10 h-10 text-slate-400 group-hover:text-primary-600 rounded-2xl group-hover:bg-primary-50 dark:group-hover:bg-primary-950 transition-all shadow-sm">
                          <ExternalLink size={18} />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="px-8 py-8 bg-slate-50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mostrando {paginatedAssets.length} de {filteredAssets.length} registros no filtro atual</p>
            <div className="flex gap-2">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="btn-premium-secondary px-6 py-2.5 rounded-xl text-[10px] uppercase tracking-widest font-black disabled:opacity-50">Anterior</button>
              {getPaginationGroup().map((page, i) => (
                <button 
                  key={i} 
                  disabled={page === '...'} 
                  onClick={() => typeof page === 'number' && setCurrentPage(page)} 
                  className={clsx(
                    "w-10 h-10 rounded-xl text-[10px] font-black flex items-center justify-center transition-all", 
                    currentPage === page ? "btn-premium-primary shadow-lg pointer-events-none" : "btn-premium-secondary border border-slate-100 dark:border-slate-800"
                  )}
                >
                  {page}
                </button>
              ))}
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="btn-premium-secondary px-6 py-2.5 rounded-xl text-[10px] uppercase tracking-widest font-black disabled:opacity-50">Próxima</button>
            </div>
          </div>
        )}
      </div>

      {showEmptyConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 border border-slate-200 dark:border-slate-800">
            <div className="p-10">
              <div className="flex justify-between items-start mb-8">
                 <div className="w-16 h-16 rounded-3xl bg-rose-100 dark:bg-rose-900/30 text-rose-600 flex items-center justify-center shrink-0 shadow-inner">
                    {emptyConfirmStep === 3 ? <CheckCircle size={32} /> : <AlertTriangle size={32} />}
                 </div>
                 <button onClick={() => setShowEmptyConfirm(false)} disabled={isDeleting} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50"><X size={28} /></button>
              </div>
              
              {emptyConfirmStep === 1 && (
                <div className="space-y-6">
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">Liquidação Total?</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">Você está prestes a apagar permanentemente <strong className="text-slate-900 dark:text-white font-black underline decoration-rose-500/30DecorationThickness[2px]">{assets.length} registros</strong> de patrimônio. Esta ação é irreversível.</p>
                  <div className="pt-8 flex flex-col gap-3">
                    <button onClick={() => setEmptyConfirmStep(2)} className="w-full btn-premium-danger py-5 rounded-2xl shadow-xl shadow-rose-500/20">ESTOU CIENTE, CONTINUAR</button>
                    <button onClick={() => setShowEmptyConfirm(false)} className="w-full btn-premium-ghost py-4 rounded-xl text-slate-500">CANCELAR OPERAÇÃO</button>
                  </div>
                </div>
              )}

              {emptyConfirmStep === 2 && (
                <div className="space-y-6">
                  <h3 className="text-3xl font-black text-rose-600 tracking-tighter leading-none uppercase italic">Atenção Crítica</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">O sistema removerá todos os dados estruturais de hardware vinculados a esta conta.</p>
                  <div className="pt-8 flex flex-col gap-3">
                    <button onClick={executeEmptyInventory} disabled={isDeleting} className="w-full btn-premium-danger py-5 rounded-2xl shadow-2xl flex items-center justify-center disabled:opacity-70">
                      {isDeleting ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div> : 'SIM, DELETAR TUDO AGORA'}
                    </button>
                    <button onClick={() => setShowEmptyConfirm(false)} disabled={isDeleting} className="w-full btn-premium-ghost py-4 rounded-xl text-slate-500">VOLTAR</button>
                  </div>
                </div>
              )}

              {emptyConfirmStep === 3 && (
                <div className="space-y-6 text-center">
                  <h3 className="text-3xl font-black text-emerald-600 tracking-tighter mt-2 leading-none">ZERADO!</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">O inventário foi limpo com sucesso e com segurança via servidor. 🛠️✨</p>
                  <div className="pt-8">
                    <button onClick={() => setShowEmptyConfirm(false)} className="w-full btn-premium-dark py-5 rounded-2xl shadow-xl">RETORNAR AO DASHBOARD</button>
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
