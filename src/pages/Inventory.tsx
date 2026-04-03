import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Search, 
  Barcode, 
  Plus, 
  ExternalLink,
  Trash2,
  AlertTriangle,
  Table as TableIcon,
  CheckCircle,
  Filter,
  Package,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Settings2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { BarcodeScanner } from '../components/BarcodeScanner';
import { useProfile } from '../hooks/useProfile';
import { assetService } from '../services/assetService';
import { BulkActionModal } from '../components/BulkActionModal';
import { toast } from 'react-hot-toast';

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
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  
  // Estados de Gestão em Massa v5.5
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const itemsPerPage = 10;

  useEffect(() => {
    fetchAssets();
  }, [statusFilter, sortOrder, sortConfig]);

  const toggleSort = (key: string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const getSortIcon = (key: string) => {
    if (sortConfig?.key !== key) return <ArrowUpDown size={12} className="opacity-20 group-hover/th:opacity-50 transition-opacity" />;
    return sortConfig.direction === 'asc' ? <ChevronUp size={12} className="text-gp-blue" /> : <ChevronDown size={12} className="text-gp-blue" />;
  };

  async function fetchAssets() {
    setLoading(true);
    let query = supabase
      .from('assets')
      .select('*');

    if (sortConfig) {
      query = query.order(sortConfig.key, { ascending: sortConfig.direction === 'asc' });
    } else {
      query = query.order(sortOrder === 'az' ? 'nome_item' : 'created_at', { 
        ascending: sortOrder === 'az' 
      });
    }

    if (statusFilter !== 'todos') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;
    if (!error && data) {
      setAssets(data);
    }
    setLoading(false);
  }

  // Funções de Gestão em Massa v5.5
  const toggleSelectAsset = (id: string) => {
    const newSelected = new Set(selectedAssetIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedAssetIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedAssetIds.size === filteredAssets.length && filteredAssets.length > 0) {
      setSelectedAssetIds(new Set());
    } else {
      setSelectedAssetIds(new Set(filteredAssets.map(a => a.id)));
    }
  };

  async function handleBulkActionConfirm(data: { type: 'status' | 'local', value: string, notes: string }) {
    setIsBulkProcessing(true);
    const assetIds = Array.from(selectedAssetIds);

    try {
      let result;
      if (data.type === 'status') {
        result = await assetService.bulkUpdateAssetsStatus(assetIds, data.value as any, profile!.id, data.notes);
      } else {
        result = await assetService.bulkUpdateAssetsLocation(assetIds, data.value, profile!.id, data.notes);
      }

      if (result.errors) {
        toast.error(`Erro ao atualizar lote: ${result.successCount} concluídos, falha nos demais.`);
      } else {
        toast.success(`${result.successCount} ativos atualizados com sucesso!`);
        setSelectedAssetIds(new Set());
        setIsBulkModalOpen(false);
        fetchAssets();
      }
    } catch (err: any) {
      toast.error('Erro crítico no processamento em massa: ' + err.message);
    } finally {
      setIsBulkProcessing(false);
    }
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
    em_estoque: 'gp-badge-green',
    em_uso: 'gp-badge-blue',
    manutencao: 'gp-badge-amber',
    baixado: 'gp-badge-red',
  };

  const statusLabels: any = {
    em_estoque: 'Em Estoque',
    em_uso: 'Em Uso',
    manutencao: 'Manutenção',
    baixado: 'Baixado',
  };

  return (
    <div className="space-y-6 animate-fade-up pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="gp-page-title text-3xl">
             Inventário Global
          </h1>
          <p className="gp-page-subtitle">Controle centralizado de ativos, hardware e patrimônio físico.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {profile?.role === 'master_admin' && assets.length > 0 && (
            <button 
              onClick={() => { setShowEmptyConfirm(true); setEmptyConfirmStep(1); }}
              className="btn-premium-danger px-5 py-2.5 rounded-xl text-[11px]"
            >
              <Trash2 size={16} />
              {isDeleting ? 'ESVAZIANDO...' : 'ZERAR ESTOQUE'}
            </button>
          )}
          <button onClick={() => navigate('/novo-ativo')} className="btn-premium-primary px-5 py-2.5 rounded-xl text-[11px]">
            <Plus size={16} strokeWidth={3} /> NOVO ATIVO
          </button>
          <button onClick={() => navigate('/importar-estoque')} className="btn-premium-secondary px-5 py-2.5 rounded-xl text-[11px]">
            <TableIcon size={16} /> IMPORTAR EXCEL
          </button>
          <button onClick={() => setShowScanner(true)} className="btn-premium-dark px-5 py-2.5 rounded-xl text-[11px]">
            <Barcode size={16} strokeWidth={3} /> ESCANEAR
          </button>
        </div>
      </header>

      {showScanner && <BarcodeScanner onScan={(text) => { setSearchTerm(text); setShowScanner(false); }} onClose={() => setShowScanner(false)} />}

      <div className="gp-filter-bar space-y-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-3 text-gp-text3 group-focus-within:text-gp-blue transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Pesquisar por patrimônio, nome, modelo, local..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="gp-input pl-11 h-11" 
            />
          </div>
          
          <div className="flex items-center bg-gp-navy2 p-1 rounded-full border border-gp-border w-fit shadow-inner">
             {[
               { id: 'recent', label: 'Recentes' }, 
               { id: 'az', label: 'A-Z' }
             ].map((sort) => (
                <button 
                  key={sort.id} 
                  onClick={() => { setSortOrder(sort.id as any); setSortConfig(null); }} 
                  className={clsx(
                    "px-7 py-2 rounded-full text-[11px] font-extrabold uppercase tracking-widest transition-all duration-300 relative", 
                    sortOrder === sort.id && !sortConfig
                      ? "bg-gp-blue text-white shadow-[0_4px_12px_rgba(37,99,235,0.4)]" 
                      : "text-gp-text3 hover:text-gp-text"
                  )}
                >
                  {sort.label}
                </button>
             ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-gp-border">
           <div className="flex items-center gap-2.5 px-4 py-2 bg-gp-surface2 border border-gp-border rounded-xl">
             <Filter size={14} className="text-gp-text3" />
             <span className="text-[10px] font-bold uppercase text-gp-text3 tracking-widest">Situação</span>
             <select 
               value={statusFilter} 
               onChange={(e) => setStatusFilter(e.target.value)} 
               className="bg-transparent border-none outline-none text-xs font-bold text-gp-text cursor-pointer min-w-[100px]"
             >
                {['todos', 'em_estoque', 'em_uso', 'manutencao', 'baixado'].map(st => (
                  <option key={st} value={st}>{st === 'todos' ? 'Todas' : statusLabels[st]}</option>
                ))}
             </select>
           </div>

           <div className="flex items-center gap-2.5 px-4 py-2 bg-gp-surface2 border border-gp-border rounded-xl">
             <Package size={14} className="text-gp-text3" />
             <span className="text-[10px] font-bold uppercase text-gp-text3 tracking-widest">Categoria</span>
             <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="bg-transparent border-none outline-none text-xs font-bold text-gp-text cursor-pointer min-w-[100px]">
               <option value="todos">Todas</option>
               {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
             </select>
           </div>

           <div className="flex items-center gap-2.5 px-4 py-2 bg-gp-surface2 border border-gp-border rounded-xl">
             <Filter size={14} className="text-gp-text3" />
             <span className="text-[10px] font-bold uppercase text-gp-text3 tracking-widest">Unidade/Local</span>
             <select value={localFilter} onChange={(e) => setLocalFilter(e.target.value)} className="bg-transparent border-none outline-none text-xs font-bold text-gp-text cursor-pointer min-w-[100px]">
               <option value="todos">Todos</option>
               {uniqueLocals.map(loc => <option key={loc} value={loc}>{loc}</option>)}
             </select>
           </div>

           {(statusFilter !== 'todos' || categoryFilter !== 'todos' || localFilter !== 'todos' || searchTerm !== '') && (
             <button 
               onClick={() => { setStatusFilter('todos'); setCategoryFilter('todos'); setLocalFilter('todos'); setSearchTerm(''); }} 
               className="btn-premium-ghost px-4 py-2 text-[10px] text-gp-error hover:bg-gp-error/5"
             >
               LIMPAR FILTROS
             </button>
           )}
        </div>
      <div className="gp-table-wrap">
        <table className="gp-table">
          <thead>
            <tr>
              <th className="w-10">
                <div className="flex items-center justify-center">
                  <input 
                    type="checkbox" 
                    checked={filteredAssets.length > 0 && selectedAssetIds.size === filteredAssets.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gp-blue/50 bg-gp-surface2 text-gp-blue focus:ring-gp-blue transition-all cursor-pointer shadow-sm hover:border-gp-blue"
                  />
                </div>
              </th>
              <th onClick={() => toggleSort('numero_patrimonio')} className="cursor-pointer group/th">
                <div className="flex items-center gap-2">
                  PATRIMÔNIO
                  {getSortIcon('numero_patrimonio')}
                </div>
              </th>
              <th onClick={() => toggleSort('nome_item')} className="cursor-pointer group/th">
                <div className="flex items-center gap-2">
                  MARCA / MODELO
                  {getSortIcon('nome_item')}
                </div>
              </th>
              <th onClick={() => toggleSort('local')} className="cursor-pointer group/th">
                <div className="flex items-center gap-2">
                  LOCAL
                  {getSortIcon('local')}
                </div>
              </th>
              <th onClick={() => toggleSort('usuario_nome_importado')} className="cursor-pointer group/th">
                <div className="flex items-center gap-2">
                  USUÁRIO (IMPORT.)
                  {getSortIcon('usuario_nome_importado')}
                </div>
              </th>
              <th onClick={() => toggleSort('status')} className="cursor-pointer group/th">
                <div className="flex items-center gap-2">
                  SITUAÇÃO
                  {getSortIcon('status')}
                </div>
              </th>
              <th className="text-right">AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={6} className="h-20 bg-gp-surface2/50"></td>
                </tr>
              ))
            ) : filteredAssets.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-20 text-center text-gp-text3 italic font-medium">
                  Nenhum item encontrado no inventário.
                </td>
              </tr>
            ) : (
               paginatedAssets.map((asset) => {
                const isSelected = selectedAssetIds.has(asset.id);
                const displayName = (asset.nome_item === 'Item sem nome' || !asset.nome_item) 
                  ? (asset.modelo || asset.marca || 'Ativo sem Identificação') 
                  : asset.nome_item;
                return (
                  <tr 
                    key={asset.id} 
                    className={clsx("cursor-pointer transition-colors", isSelected ? "bg-gp-blue/5 border-l-2 border-l-gp-blue" : "hover:bg-gp-surface3")} 
                  >
                    <td onClick={(e) => { e.stopPropagation(); toggleSelectAsset(asset.id); }}>
                      <div className="flex items-center justify-center">
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => toggleSelectAsset(asset.id)}
                          className="w-4 h-4 rounded border-gp-blue/50 bg-gp-surface2 text-gp-blue focus:ring-gp-blue transition-all cursor-pointer shadow-sm hover:border-gp-blue"
                        />
                      </div>
                    </td>
                    <td onClick={() => navigate(`/estoque/${asset.id}`)}>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gp-surface2 flex items-center justify-center font-bold text-gp-text3 group-hover:bg-gp-blue group-hover:text-white transition-all">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gp-text leading-none mb-1">
                            {asset.numero_patrimonio || 'S/N'}
                          </p>
                          <p className="text-[10px] font-bold text-gp-blue uppercase tracking-widest flex items-center gap-1 opacity-70">
                             CODE: {asset.codigo_gps || asset.codigo_barras || 'PENDENTE'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-gp-text truncate max-w-[200px]">{displayName}</span>
                        <span className="text-[10px] text-gp-text3 font-bold uppercase tracking-wide">{asset.marca || 'S/M'} • {asset.modelo || 'S/M'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gp-text uppercase tracking-wide truncate max-w-[150px]">{asset.local || 'Estoque'}</span>
                        <span className="text-[10px] text-gp-text3 font-bold uppercase">{asset.empresa || 'GLOBAL'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gp-blue truncate max-w-[150px]">{asset.usuario_nome_importado || '-'}</span>
                        <span className="text-[9px] text-gp-text3 font-bold uppercase tracking-tighter">{asset.departamento || 'GERAL'}</span>
                      </div>
                    </td>
                    <td>
                      <span className={clsx("gp-badge", statusColors[asset.status])}>
                        {statusLabels[asset.status] || asset.status}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="inline-flex items-center justify-center w-8 h-8 text-gp-text3 group-hover:text-gp-blue rounded-lg group-hover:bg-gp-blue/10 transition-all">
                        <ExternalLink size={16} />
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
        <div className="p-8 bg-gp-surface2 border-t border-gp-border flex items-center justify-between rounded-b-2xl">
          <p className="text-[10px] font-bold text-gp-text3 uppercase tracking-widest">
            Mostrando {paginatedAssets.length} de {filteredAssets.length} registros
          </p>
          <div className="flex gap-1.5">
            <button 
              disabled={currentPage === 1} 
              onClick={() => setCurrentPage(prev => prev - 1)} 
              className="gp-page-btn w-auto px-4 text-[10px] uppercase"
            >
              Anterior
            </button>
            {getPaginationGroup().map((page, i) => (
              <button 
                key={i} 
                disabled={page === '...'} 
                onClick={() => typeof page === 'number' && setCurrentPage(page)} 
                className={clsx(
                  "gp-page-btn", 
                  currentPage === page && "active shadow-lg"
                )}
              >
                {page}
              </button>
            ))}
            <button 
              disabled={currentPage === totalPages} 
              onClick={() => setCurrentPage(prev => prev + 1)} 
              className="gp-page-btn w-auto px-4 text-[10px] uppercase"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
      </div>

      {showEmptyConfirm && (
        <div className="gp-modal-overlay">
          <div className="gp-modal max-w-md animate-fade-up">
            <div className="p-10 text-center">
              <div className="flex justify-center mb-8">
                 <div className={clsx(
                   "w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner",
                   emptyConfirmStep === 3 ? "bg-gp-success/10 text-gp-success" : "bg-gp-error/10 text-gp-error"
                 )}>
                    {emptyConfirmStep === 3 ? <CheckCircle size={32} strokeWidth={2.5} /> : <AlertTriangle size={32} strokeWidth={2.5} />}
                 </div>
              </div>
              
              {emptyConfirmStep === 1 && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-gp-text tracking-tight">Liquidação Total?</h3>
                  <p className="text-gp-text3 font-medium text-[15px] leading-relaxed">Você está prestes a apagar permanentemente <strong className="text-gp-text font-bold">{assets.length} registros</strong> de patrimônio.</p>
                  <div className="pt-6 space-y-3">
                    <button onClick={() => setEmptyConfirmStep(2)} className="w-full btn-premium-danger py-4 rounded-xl shadow-lg">CONTINUAR</button>
                    <button onClick={() => setShowEmptyConfirm(false)} className="w-full btn-premium-ghost py-3 rounded-xl text-gp-text3">CANCELAR</button>
                  </div>
                </div>
              )}

              {emptyConfirmStep === 2 && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-gp-error tracking-tight">Ação Irreversível</h3>
                  <p className="text-gp-text3 font-medium text-[15px] leading-relaxed">O sistema removerá todos os dados estruturais de hardware vinculados.</p>
                  <div className="pt-6 space-y-3">
                    <button onClick={executeEmptyInventory} disabled={isDeleting} className="w-full btn-premium-danger py-4 rounded-xl shadow-xl flex items-center justify-center">
                      {isDeleting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'SIM, DELETAR TUDO'}
                    </button>
                    <button onClick={() => setShowEmptyConfirm(false)} disabled={isDeleting} className="w-full btn-premium-ghost py-3 rounded-xl">VOLTAR</button>
                  </div>
                </div>
              )}

              {emptyConfirmStep === 3 && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-gp-success tracking-tight">Zerado!</h3>
                  <p className="text-gp-text3 font-medium text-[15px]">O inventário foi limpo com sucesso via servidor.</p>
                  <div className="pt-6">
                    <button onClick={() => setShowEmptyConfirm(false)} className="w-full btn-premium-dark py-4 rounded-xl shadow-lg">CONCLUÍDO</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Barra de Ações em Massa v5.5 */}
      {selectedAssetIds.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-fade-slide-up">
           <div className="bg-gp-navy2 border border-gp-blue/30 shadow-2xl shadow-gp-blue/20 rounded-2xl px-6 py-4 flex items-center gap-8 backdrop-blur-md">
              <div className="flex items-center gap-4 border-r border-gp-border pr-8">
                 <div className="w-10 h-10 rounded-xl bg-gp-blue text-white flex items-center justify-center shadow-lg shadow-gp-blue/20">
                    <CheckCircle size={20} strokeWidth={2.5} />
                 </div>
                 <div>
                    <p className="text-sm font-bold text-gp-text">{selectedAssetIds.size} itens selecionados</p>
                    <p className="text-[10px] font-bold text-gp-text3 uppercase tracking-widest leading-none">Gestão de Lote Ativa</p>
                 </div>
              </div>
              <div className="flex items-center gap-3">
                 <button 
                  onClick={() => setIsBulkModalOpen(true)}
                  className="btn-premium-primary px-6 py-2.5 rounded-xl text-[11px] font-bold shadow-lg shadow-gp-blue/20"
                 >
                    <Settings2 size={16} /> AÇÕES EM MASSA
                 </button>
                 <button 
                  onClick={() => setSelectedAssetIds(new Set())}
                  className="btn-premium-secondary px-6 py-2.5 rounded-xl text-[11px] font-bold"
                 >
                    LIMPAR
                 </button>
              </div>
           </div>
        </div>
      )}

      <BulkActionModal 
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        selectedCount={selectedAssetIds.size}
        isProcessing={isBulkProcessing}
        onConfirm={handleBulkActionConfirm}
      />
    </div>
  );
}
