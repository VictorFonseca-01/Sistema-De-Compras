import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Search, 
  Barcode, 
  Plus, 
  ExternalLink,
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
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-1">
          <h1 className="gp-page-title">
             Inventário Global
          </h1>
          <p className="gp-page-subtitle">Controle centralizado de ativos, hardware e patrimônio físico.</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
          {['master_admin', 'ti', 'compras', 'gestor', 'diretoria'].includes(profile?.role || '') && (
            <>
              <button onClick={() => navigate('/importar-estoque')} className="btn-premium-secondary px-4 py-2.5">
                <TableIcon size={16} /> <span className="hidden sm:inline">IMPORTAR EXCEL</span>
              </button>
              <button onClick={() => setShowScanner(true)} className="btn-premium-secondary px-4 py-2.5">
                <Barcode size={16} strokeWidth={3} /> <span className="hidden sm:inline">ESCANEAR</span>
              </button>
              <button onClick={() => navigate('/novo-ativo')} className="btn-premium-primary">
                <Plus size={18} strokeWidth={3} /> NOVO ATIVO
              </button>
            </>
          )}
        </div>
      </header>

      {showScanner && <BarcodeScanner onScan={(text) => { setSearchTerm(text); setShowScanner(false); }} onClose={() => setShowScanner(false)} />}

      <div className="gp-card p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-3 text-gp-text3 group-focus-within:text-gp-blue transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Pesquisar patrimônio, nome, local..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="gp-input pl-11 h-11" 
            />
          </div>
          
          <div className="flex items-center bg-gp-surface2 p-1 rounded-xl border border-gp-border w-full sm:w-fit shadow-inner">
             {[
               { id: 'recent', label: 'Recentes' }, 
               { id: 'az', label: 'A-Z' }
             ].map((sort) => (
                <button 
                  key={sort.id} 
                  onClick={() => { setSortOrder(sort.id as any); setSortConfig(null); }} 
                  className={clsx(
                    "flex-1 sm:flex-none px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 relative", 
                    sortOrder === sort.id && !sortConfig
                      ? "bg-gp-blue text-white shadow-lg" 
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
               className="bg-transparent border-none outline-none text-xs font-bold text-gp-text cursor-pointer min-w-[80px] sm:min-w-[100px] hover:text-gp-blue transition-colors"
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
      </div>

      {/* Mobile Card List */}
      <div className="grid grid-cols-1 gap-4 sm:hidden">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="gp-card p-4 animate-pulse space-y-3">
              <div className="flex justify-between items-start">
                <div className="h-4 w-32 bg-gp-border rounded" />
                <div className="h-6 w-24 bg-gp-border rounded-lg" />
              </div>
              <div className="h-5 w-full bg-gp-border/50 rounded" />
            </div>
          ))
        ) : filteredAssets.length === 0 ? (
          <div className="gp-card p-8 text-center text-gp-text3 italic text-sm">
             Nenhum ativo encontrado.
          </div>
        ) : (
          paginatedAssets.map((asset) => {
            const isSelected = selectedAssetIds.has(asset.id);
            const displayName = (asset.nome_item === 'Item sem nome' || !asset.nome_item) 
              ? (asset.modelo || asset.marca || 'Ativo sem Identificação') 
              : asset.nome_item;
            const sLabels: any = { em_estoque: 'Estoque', em_uso: 'Em Uso', manutencao: 'Manut.', baixado: 'Baixado' };
            const s = sLabels[asset.status] || asset.status;
            const sColor = statusColors[asset.status];

            return (
              <div 
                key={asset.id} 
                className={clsx(
                  "relative group overflow-hidden bg-gp-surface border-l-4 rounded-2xl p-4 shadow-lg transition-all active:scale-[0.98] border-y border-r border-gp-border w-full",
                  isSelected ? "border-l-gp-blue bg-gp-blue/5" : "border-l-gp-border hover:border-l-gp-blue/40"
                )}
                onClick={() => navigate(`/estoque/${asset.id}`)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div 
                      onClick={(e) => { e.stopPropagation(); toggleSelectAsset(asset.id); }}
                      className={clsx(
                        "w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all shrink-0",
                        isSelected ? "bg-gp-blue border-gp-blue text-white" : "border-gp-border bg-gp-surface2"
                      )}
                    >
                      {isSelected && <CheckCircle size={14} strokeWidth={3} />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black text-gp-blue uppercase tracking-widest bg-gp-blue/10 px-2 py-0.5 rounded leading-none border border-gp-blue/20">
                          {asset.numero_patrimonio || 'S/N'}
                        </span>
                        <span className="text-[10px] font-bold text-gp-text3 uppercase tracking-tighter opacity-60">
                           {asset.categoria || 'Hardware'}
                        </span>
                      </div>
                      <h4 className="font-bold text-gp-text text-base truncate pr-2">{displayName}</h4>
                    </div>
                  </div>
                  <div className={clsx("gp-badge gp-badge-sm shrink-0 whitespace-nowrap px-2 font-black", sColor)}>
                    {s}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-t border-gp-border/50 bg-gp-surface2/30 -mx-5 px-5">
                   <div className="min-w-0">
                      <p className="text-[9px] font-black text-gp-text3 uppercase tracking-wide mb-1 opacity-50">Local Atual</p>
                      <p className="text-[13px] font-bold text-gp-text truncate">{asset.local || 'Estoque Central'}</p>
                   </div>
                   <div className="min-w-0">
                      <p className="text-[9px] font-black text-gp-text3 uppercase tracking-wide mb-1 opacity-50">Empresa/Unidade</p>
                      <p className="text-[13px] font-bold text-gp-blue truncate">{asset.empresa || 'Global Parts'}</p>
                   </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                   <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-gp-surface3 border border-gp-border flex items-center justify-center text-[10px] font-bold text-gp-text3">
                         {asset.usuario_nome_importado?.charAt(0) || '-'}
                      </div>
                      <span className="text-[11px] font-bold text-gp-text2 truncate max-w-[120px]">
                        {asset.usuario_nome_importado || 'Sem responsável'}
                      </span>
                   </div>
                   <div className="text-[10px] font-bold text-gp-text3 opacity-40 uppercase tracking-tighter">
                      Mod: {new Date(asset.created_at).toLocaleDateString('pt-BR')}
                   </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Desktop/Tablet Table */}
      <div className="gp-table-wrap hidden sm:block">
        <table className="gp-table">
          <thead>
            <tr>
              <th className="gp-th w-14 text-center">
                <div className="flex items-center justify-center">
                  <input 
                    type="checkbox" 
                    checked={filteredAssets.length > 0 && selectedAssetIds.size === filteredAssets.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gp-border2 bg-gp-surface text-gp-blue focus:ring-gp-blue transition-all cursor-pointer"
                  />
                </div>
              </th>
              <th onClick={() => toggleSort('numero_patrimonio')} className="gp-th cursor-pointer group/th">
                <div className="flex items-center gap-2">
                  PATRIMÔNIO
                  {getSortIcon('numero_patrimonio')}
                </div>
              </th>
              <th onClick={() => toggleSort('nome_item')} className="gp-th cursor-pointer group/th">
                <div className="flex items-center gap-2">
                  ITEM / MODELO
                  {getSortIcon('nome_item')}
                </div>
              </th>
              <th onClick={() => toggleSort('local')} className="gp-th cursor-pointer group/th">
                <div className="flex items-center gap-2">
                  LOCALIZAÇÃO
                  {getSortIcon('local')}
                </div>
              </th>
              <th onClick={() => toggleSort('usuario_nome_importado')} className="gp-th cursor-pointer group/th">
                <div className="flex items-center gap-2">
                  RESPONSÁVEL
                  {getSortIcon('usuario_nome_importado')}
                </div>
              </th>
              <th onClick={() => toggleSort('status')} className="gp-th cursor-pointer group/th">
                <div className="flex items-center gap-2">
                  SITUAÇÃO
                  {getSortIcon('status')}
                </div>
              </th>
              <th className="gp-th text-right">AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={7} className="px-4 py-8">
                    <div className="h-10 bg-gp-surface2 rounded-xl" />
                  </td>
                </tr>
              ))
            ) : filteredAssets.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-20 text-center">
                  <div className="gp-empty">
                    <div className="gp-empty-icon"><Package size={32} /></div>
                    <p className="text-gp-text3 font-medium">Nenhum item encontrado no inventário.</p>
                  </div>
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
                    className={clsx("cursor-pointer transition-colors", isSelected ? "bg-gp-blue/5" : "hover:bg-gp-bg-sec")} 
                  >
                    <td className="gp-td text-center" onClick={(e) => { e.stopPropagation(); toggleSelectAsset(asset.id); }}>
                      <div className="flex items-center justify-center">
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => toggleSelectAsset(asset.id)}
                          className="w-4 h-4 rounded border-gp-border2 bg-gp-surface text-gp-blue focus:ring-gp-blue transition-all cursor-pointer"
                        />
                      </div>
                    </td>
                    <td className="gp-td" onClick={() => navigate(`/estoque/${asset.id}`)}>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gp-surface2 border border-gp-border flex items-center justify-center font-black text-gp-text2 group-hover:bg-gp-blue group-hover:text-white transition-all shadow-sm">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gp-text leading-none mb-1">
                            {asset.numero_patrimonio || 'S/N'}
                          </p>
                          <p className="text-[10px] font-black text-gp-blue-light uppercase tracking-widest leading-none">
                             {asset.codigo_gps || asset.codigo_barras || 'PENDENTE'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="gp-td">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-gp-text truncate max-w-[200px]">{displayName}</span>
                        <span className="text-[10px] text-gp-text3 font-bold uppercase tracking-wide">{asset.marca || 'S/M'} • {asset.modelo || 'S/M'}</span>
                      </div>
                    </td>
                    <td className="gp-td">
                      <div className="flex flex-col">
                        <span className="text-[12px] font-bold text-gp-text uppercase tracking-wide truncate max-w-[150px]">{asset.local || 'Estoque'}</span>
                        <span className="text-[9px] text-gp-text3 font-bold uppercase opacity-60 tracking-tighter">{asset.empresa || 'GLOBAL'}</span>
                      </div>
                    </td>
                    <td className="gp-td">
                      <div className="flex flex-col">
                        <span className="text-[12px] font-bold text-gp-blue truncate max-w-[150px]">{asset.usuario_nome_importado || '-'}</span>
                        <span className="text-[9px] text-gp-text3 font-bold uppercase tracking-tighter opacity-60">{asset.departamento || 'GERAL'}</span>
                      </div>
                    </td>
                    <td className="gp-td">
                      <span className={clsx("gp-badge gp-badge-sm font-black", statusColors[asset.status])}>
                        {statusLabels[asset.status] || asset.status}
                      </span>
                    </td>
                    <td className="gp-td text-right">
                      <div className="inline-flex items-center justify-center w-9 h-9 text-gp-text3 hover:text-gp-blue rounded-xl hover:bg-gp-blue/10 transition-all">
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-8 py-8 bg-gp-surface2 border border-gp-border rounded-2xl shadow-inner mt-10">
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-gp-blue shadow-[0_0_10px_rgba(59,130,246,0.3)] animate-pulse" />
             <p className="text-[11px] font-black text-gp-text uppercase tracking-widest leading-none">
               {filteredAssets.length} <span className="text-gp-muted opacity-60 ml-1">Ativos catalogados</span>
             </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              disabled={currentPage === 1} 
              onClick={() => setCurrentPage(prev => prev - 1)} 
              className="gp-pagination-btn"
            >
              Anterior
            </button>
            
            <div className="flex items-center gap-1.5 px-2 py-1.5 bg-gp-surface3/30 rounded-xl border border-gp-border/50">
              {getPaginationGroup().map((page, i) => (
                <button 
                  key={i} 
                  disabled={page === '...'} 
                  onClick={() => typeof page === 'number' && setCurrentPage(page)} 
                  className={clsx(
                    "gp-pagination-item",
                    currentPage === page && "gp-pagination-item-active"
                  )}
                >
                  {page}
                </button>
              ))}
            </div>

            <button 
              disabled={currentPage === totalPages} 
              onClick={() => setCurrentPage(prev => prev + 1)} 
              className="gp-pagination-btn"
            >
              Próxima
            </button>
          </div>
        </div>
      )}

      {selectedAssetIds.size > 0 && ['master_admin', 'ti', 'compras', 'gestor', 'diretoria'].includes(profile?.role || '') && (
        <div className="fixed bottom-24 sm:bottom-8 left-1/2 -translate-x-1/2 z-50 animate-fade-slide-up w-[92%] sm:w-auto">
           <div className="bg-gp-navy2 border border-gp-blue/30 shadow-2xl shadow-gp-blue/40 rounded-2xl px-5 py-4 flex items-center justify-between sm:justify-start gap-8 backdrop-blur-xl">
              <div className="flex items-center gap-4 sm:border-r sm:border-white/10 sm:pr-8">
                 <div className="w-10 h-10 rounded-xl bg-gp-blue text-white flex items-center justify-center shadow-lg shadow-gp-blue/40">
                    <CheckCircle size={20} strokeWidth={3} />
                 </div>
                 <div className="min-w-0">
                    <p className="text-sm font-black text-white truncate">{selectedAssetIds.size} selecionados</p>
                    <p className="text-[9px] font-black text-gp-blue-light uppercase tracking-[0.2em] leading-none mt-1">Gestão de Lote</p>
                 </div>
              </div>
              <div className="flex items-center gap-3">
                 <button 
                  onClick={() => setIsBulkModalOpen(true)}
                  className="btn-premium-primary px-6 py-2.5 rounded-xl text-[11px] font-black"
                 >
                    <Settings2 size={16} /> <span className="hidden sm:inline">AÇÕES EM LOTE</span>
                 </button>
                 <button 
                  onClick={() => setSelectedAssetIds(new Set())}
                  className="btn-premium-secondary bg-white/5 border-white/10 text-white hover:bg-white/10 px-6 py-2.5 rounded-xl text-[11px] font-black"
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
