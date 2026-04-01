import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Search, 
  Barcode, 
  Plus, 
  ExternalLink,
  Tag,
  Warehouse
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { BarcodeScanner } from '../components/BarcodeScanner';

export default function Inventory() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [showScanner, setShowScanner] = useState(false);

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

  const filteredAssets = assets.filter(a => 
    a.nome_item.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.numero_patrimonio.includes(searchTerm) ||
    (a.codigo_barras && a.codigo_barras.includes(searchTerm)) ||
    (a.modelo && a.modelo.toLowerCase().includes(searchTerm.toLowerCase()))
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
          <button 
            onClick={() => navigate('/importar-estoque')}
            className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-6 py-3 rounded-2xl font-black flex items-center gap-2 transition-all border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 active:scale-95"
          >
            <Plus size={20} />
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

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black border-b border-slate-100 dark:border-slate-800">
                <th className="px-8 py-5">Patrimônio</th>
                <th className="px-8 py-5">Plaqueta</th>
                <th className="px-8 py-5">Ativo / Equipamento</th>
                <th className="px-8 py-5">Categoria</th>
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
                filteredAssets.map((asset) => (
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
                        <span className="font-black text-slate-900 dark:text-white text-sm">{asset.nome_item}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{asset.marca} {asset.modelo}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="inline-flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <Tag size={12} />
                          {asset.categoria}
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
      </div>
    </div>
  );
}
