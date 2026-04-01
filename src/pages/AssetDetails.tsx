import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  ArrowLeft, 
  Package, 
  Tag, 
  History, 
  User, 
  Truck,
  RotateCcw,
  Wrench,
  Ban,
  MoreVertical,
  Activity
} from 'lucide-react';
import { clsx } from 'clsx';

export default function AssetDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState<any>(null);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchAssetDetails();
    }
  }, [id]);

  async function fetchAssetDetails() {
    setLoading(true);
    // 1. Buscar ativo
    const { data: assetData, error: assetError } = await supabase
      .from('assets')
      .select('*, requests(*)')
      .eq('id', id)
      .single();

    if (!assetError && assetData) {
      setAsset(assetData);
    }

    // 2. Buscar movimentações
    const { data: moveData, error: moveError } = await supabase
      .from('asset_movements')
      .select('*, users:user_id(full_name), destino:destino_user_id(full_name)')
      .eq('asset_id', id)
      .order('created_at', { ascending: false });

    if (!moveError && moveData) {
      setMovements(moveData);
    }

    setLoading(false);
  }

  const statusColors: any = {
    em_estoque: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    em_uso: 'bg-blue-100 text-blue-700 border-blue-200',
    manutencao: 'bg-amber-100 text-amber-700 border-amber-200',
    baixado: 'bg-rose-100 text-rose-700 border-rose-200',
  };

  const statusLabels: any = {
    em_estoque: 'Disponível no Estoque',
    em_uso: 'Em Uso Externo',
    manutencao: 'Em Manutenção Técnica',
    baixado: 'Ativo Baixado / Descarte',
  };

  if (loading) return <div className="p-20 text-center animate-pulse">Carregando detalhes do ativo...</div>;
  if (!asset) return <div className="p-20 text-center">Ativo não encontrado.</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in slide-in-from-bottom-6 duration-700 pb-20">
      <header className="flex flex-col gap-4">
        <button 
          onClick={() => navigate('/estoque')}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary-600 transition-colors"
        >
          <ArrowLeft size={14} /> Voltar ao Estoque
        </button>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-1">
             <div className="flex items-center gap-2">
                <span className={clsx("px-2 py-0.5 rounded-lg text-[10px] font-black border uppercase tracking-wider", statusColors[asset.status])}>
                  {statusLabels[asset.status]}
                </span>
             </div>
             <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{asset.nome_item}</h1>
             <p className="text-slate-500 font-bold text-lg flex items-center gap-2">
                <Tag size={18} /> Patrimônio #{asset.numero_patrimonio}
             </p>
          </div>
          <div className="flex gap-3">
             <button 
               onClick={() => navigate('/entregar', { state: { assetId: asset.id } })}
               className="bg-slate-950 dark:bg-white dark:text-slate-950 text-white px-8 py-3.5 rounded-2xl font-black flex items-center gap-2 transition-all shadow-xl active:scale-95"
             >
               <Truck size={20} strokeWidth={3} />
               ENTREGAR P/ USUÁRIO
             </button>
             <button className="p-3.5 bg-white dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 rounded-2xl hover:text-slate-900 dark:hover:text-white transition-all shadow-sm">
               <MoreVertical size={20} />
             </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Lado Esquerdo: Detalhes */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm p-10 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Fabricante / Marca</label>
                <p className="text-lg font-black text-slate-900 dark:text-white">{asset.marca || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Modelo Comercial</label>
                <p className="text-lg font-black text-slate-900 dark:text-white">{asset.modelo || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Número de Série (SN)</label>
                <p className="text-base font-bold text-slate-600 dark:text-slate-400 font-mono bg-slate-50 dark:bg-slate-800/50 px-3 py-1 rounded-lg w-fit">{asset.numero_serie || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Código de Barras</label>
                <p className="text-base font-bold text-slate-600 dark:text-slate-400 font-mono">{asset.codigo_barras || 'N/A'}</p>
              </div>
            </div>

            <div className="pt-10 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Descrição Técnica / Observações</label>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                {asset.descricao || asset.observacoes || 'Nenhum detalhe adicional informado.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 border-t border-slate-100 dark:border-slate-800">
               <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Custo Aquisição</p>
                  <p className="text-xl font-black text-emerald-600">R$ {asset.valor ? asset.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}</p>
               </div>
               <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Data da Compra</p>
                  <p className="text-xl font-black text-slate-700 dark:text-slate-300">
                    {asset.data_compra ? new Date(asset.data_compra).toLocaleDateString() : 'N/A'}
                  </p>
               </div>
               <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fornecedor</p>
                  <p className="text-lg font-black text-slate-700 dark:text-slate-300 truncate">{asset.fornecedor || 'N/A'}</p>
               </div>
            </div>
          </section>

          {/* Quick Actions (Cards) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             {[
               { icon: RotateCcw, label: 'Registrar Devolução', color: 'text-blue-500', bg: 'bg-blue-50' },
               { icon: Wrench, label: 'Manutenção', color: 'text-amber-500', bg: 'bg-amber-50' },
               { icon: Ban, label: 'Dar Baixa (Descarte)', color: 'text-rose-500', bg: 'bg-rose-50' },
               { icon: Package, label: 'Mover Localização', color: 'text-slate-500', bg: 'bg-slate-50' }
             ].map((action, i) => (
                <button key={i} className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl group hover:border-primary-500 transition-all hover:shadow-xl hover:-translate-y-1">
                   <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center mb-3", action.bg, action.color)}>
                      <action.icon size={22} />
                   </div>
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center group-hover:text-primary-600">{action.label}</span>
                </button>
             ))}
          </div>
        </div>

        {/* Lado Direito: Timeline de Movimentações */}
        <div className="space-y-6">
           <div className="bg-slate-950 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
              <History className="absolute -right-10 -bottom-10 text-white/5 -rotate-12" size={160} />
              <h3 className="text-xl font-black flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                  <Activity size={20} />
                </div>
                Rastreabilidade
              </h3>
              <p className="text-white/60 text-sm mt-2 relative z-10 font-medium">Histórico completo de posse e manutenção deste ativo.</p>
           </div>

           <div className="space-y-4">
              {movements.map((move, i) => (
                <div key={move.id} className="relative pl-10 group pb-4">
                   {/* Linha vertical */}
                   {i !== movements.length - 1 && <div className="absolute left-[19px] top-8 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-800"></div>}
                   
                   {/* Circle */}
                   <div className={clsx(
                     "absolute left-0 top-1 w-10 h-10 rounded-2xl border-4 border-white dark:border-slate-950 flex items-center justify-center z-10 transition-all",
                     move.tipo === 'entrada' ? 'bg-emerald-500 text-white' : 
                     move.tipo === 'entrega' ? 'bg-blue-500 text-white' :
                     'bg-slate-400 text-white'
                   )}>
                      {move.tipo === 'entrada' ? <Package size={14} /> : 
                       move.tipo === 'entrega' ? <User size={14} /> :
                       <Activity size={14} />}
                   </div>

                   <div className="space-y-1">
                      <div className="flex justify-between items-start">
                         <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                           {new Date(move.created_at).toLocaleDateString()} — {new Date(move.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                         </p>
                         <span className="text-[10px] font-black text-slate-400 opacity-50">#{move.id.slice(0, 4)}</span>
                      </div>
                      <h4 className="font-black text-slate-900 dark:text-white capitalize leading-tight">
                         {move.tipo === 'entrega' ? `Atribuído a ${move.destino?.full_name || 'Desconhecido'}` : 
                          move.tipo === 'entrada' ? 'Entrada no Inventário' : move.tipo}
                      </h4>
                      <p className="text-sm text-slate-500 font-medium leading-relaxed italic">
                         "{move.observacao || 'Nenhum detalhe.'}"
                      </p>
                      <p className="text-[10px] font-black text-primary-600 uppercase tracking-tighter">
                         Por: {move.users?.full_name || 'Sistema'}
                      </p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}
