import { useEffect, useState } from 'react';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  Plus,
  ArrowRight,
  TrendingUp,
  Activity,
  Package,
  Wrench,
  AlertCircle,
  XCircle,
  BarChart3,
  FileBarChart
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { useProfile } from '../hooks/useProfile';
import { clsx } from 'clsx';

const statusMap: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending_gestor: { label: 'Aguardando Gestor', color: 'text-amber-500', bg: 'bg-amber-500/10', icon: Clock },
  pending_ti: { label: 'Em Análise TI', color: 'text-blue-500', bg: 'bg-blue-500/10', icon: FileText },
  pending_compras: { label: 'Em Compras', color: 'text-fuchsia-500', bg: 'bg-fuchsia-500/10', icon: TrendingUp },
  pending_diretoria: { label: 'Aguardando Diretoria', color: 'text-purple-500', bg: 'bg-purple-500/10', icon: Clock },
  approved: { label: 'Aprovado Final', color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: CheckCircle },
  rejected: { label: 'Recusado', color: 'text-rose-500', bg: 'bg-rose-500/10', icon: XCircle },
  adjustment_needed: { label: 'Ajuste Necessário', color: 'text-orange-500', bg: 'bg-orange-500/10', icon: AlertCircle },
};

// --- Skeleton Components ---
function MetricSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800 animate-pulse">
      <div className="flex flex-col gap-5">
        <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl"></div>
        <div>
          <div className="w-24 h-3 bg-slate-100 dark:bg-slate-800 rounded-full mb-3"></div>
          <div className="w-16 h-9 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
        </div>
      </div>
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="divide-y divide-slate-50 dark:divide-slate-800">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between p-6 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800"></div>
            <div>
              <div className="w-48 h-4 bg-slate-100 dark:bg-slate-800 rounded-lg mb-2"></div>
              <div className="w-32 h-3 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [loading, setLoading] = useState(true);
  
  // Dashboard 2.0 States
  const [requestStats, setRequestStats] = useState<any[]>([]);
  const [inventoryStats, setInventoryStats] = useState<any[]>([]);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [recentMovements, setRecentMovements] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      // 1. Fetch Requests & Stats
      const { data: requests } = await supabase.from('requests').select('*, profiles(full_name)');
      if (requests) {
        const counts = {
          pending: requests.filter(r => r.status.startsWith('pending')).length,
          approved: requests.filter(r => r.status === 'approved').length,
          rejected: requests.filter(r => r.status === 'rejected').length,
        };
        setRequestStats([
          { label: 'Pendentes', value: counts.pending, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'Aprovadas', value: counts.approved, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        ]);
        setRecentRequests(requests.slice(0, 4).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      }

      // 2. Fetch Assets & Inventory Stats
      const { data: assets } = await supabase.from('assets').select('*');
      if (assets) {
        const counts = {
          total: assets.length,
          stock: assets.filter(a => a.status === 'em_estoque').length,
          use: assets.filter(a => a.status === 'em_uso').length,
          maintenance: assets.filter(a => a.status === 'manutencao').length,
          totalValue: assets.reduce((acc, a) => acc + (Number(a.valor) || 0), 0)
        };

        setInventoryStats([
          { label: 'Em Estoque', value: counts.stock, icon: Package, color: 'text-primary-500', bg: 'bg-primary-500/10' },
          { label: 'Em Uso', value: counts.use, icon: Activity, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Manutenção', value: counts.maintenance, icon: Wrench, color: 'text-rose-500', bg: 'bg-rose-500/10' },
        ]);

        // Simple Chart Data
        const distribution = [
          { label: 'Estoque', count: counts.stock, color: '#3b82f6', percent: counts.total ? (counts.stock / counts.total) * 100 : 0 },
          { label: 'Uso', count: counts.use, color: '#10b981', percent: counts.total ? (counts.use / counts.total) * 100 : 0 },
          { label: 'Ajuste', count: counts.maintenance, color: '#f43f5e', percent: counts.total ? (counts.maintenance / counts.total) * 100 : 0 },
        ];
        setChartData(distribution);
      }

      // 3. Fetch Recent Movements
      const { data: movements } = await supabase
        .from('asset_movements')
        .select('*, assets(nome_item, numero_patrimonio)')
        .order('created_at', { ascending: false })
        .limit(4);
      if (movements) setRecentMovements(movements);

      setLoading(false);
    }

    fetchData();
  }, []);

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      {/* Header Premium */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
            Dashboard <span className="text-primary-600">2.0</span>
          </h1>
          <p className="text-slate-500 text-lg font-medium">Bem-vindo, {profile?.full_name?.split(' ')[0] || 'Gestor'}. Sistema 100% operacional.</p>
        </div>
        <div className="flex gap-3">
           <button onClick={() => navigate('/relatorios')} className="btn-premium-secondary px-6 py-4 rounded-2xl flex items-center gap-2">
             <FileBarChart size={20} /> RELATÓRIO EXECUTIVO
           </button>
           <button onClick={() => navigate('/nova-solicitacao')} className="btn-premium-primary px-8 py-4 rounded-2xl shadow-xl shadow-primary-600/20">
             <Plus size={22} strokeWidth={3} /> NOVA SOLICITAÇÃO
           </button>
        </div>
      </header>

      {/* Grid de KPIs SaaS — Mista (Compras + Estoque) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <MetricSkeleton key={i} />)
        ) : (
          <>
            {[...requestStats, ...inventoryStats].map((stat, i) => (
              <div key={i} className="group bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-20 h-20 ${stat.bg} rounded-bl-full opacity-20 -mr-6 -mt-6 group-hover:scale-125 transition-transform`}></div>
                <div className="flex flex-col gap-4 relative z-10">
                  <div className={`${stat.color} ${stat.bg} p-3 rounded-2xl w-fit group-hover:scale-110 transition-transform`}>
                    <stat.icon size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white uppercase leading-none">{stat.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gráfico Visual de Distribuição */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
           <div className="flex justify-between items-center mb-8">
             <h3 className="text-xl font-black flex items-center gap-2">
               <BarChart3 size={20} className="text-primary-500" />
               Status do Inventário
             </h3>
           </div>
           
           <div className="flex-1 flex flex-col justify-center items-center gap-10">
              <div className="relative w-48 h-48 flex items-center justify-center">
                 <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    {chartData.map((d, i) => {
                      const offset = chartData.slice(0, i).reduce((acc, curr) => acc + curr.percent, 0);
                      return (
                        <circle
                          key={i}
                          cx="18" cy="18" r="16"
                          fill="transparent"
                          stroke={d.color}
                          strokeWidth="4"
                          strokeDasharray={`${d.percent} ${100 - d.percent}`}
                          strokeDashoffset={-offset}
                          className="transition-all duration-1000 ease-out"
                        />
                      );
                    })}
                 </svg>
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-3xl font-black text-slate-900 dark:text-white">
                      {chartData.reduce((acc, d) => acc + d.count, 0)}
                    </p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ativos</p>
                 </div>
              </div>

              <div className="w-full space-y-3">
                 {chartData.map((d, i) => (
                   <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                         <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{d.label}</span>
                      </div>
                      <span className="text-sm font-black text-slate-900 dark:text-white">{Math.round(d.percent)}%</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Listas de Atividade Recente (Solicitações + Movimentações) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Recent Requests */}
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-black flex items-center gap-2">
                <FileText size={18} className="text-amber-500" />
                Novas Solicitações
              </h3>
              <Link to="/solicitacoes" className="btn-premium-ghost px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest">Ver tudo</Link>
            </div>
            {loading ? <ActivitySkeleton /> : (
              <div className="divide-y divide-slate-50 dark:divide-slate-800">
                {recentRequests.map(req => (
                  <Link key={req.id} to={`/solicitacao/${req.id}`} className="flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/30 group-hover:text-amber-600">
                        <FileText size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-600 transition-colors truncate max-w-[200px]">{req.title}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{req.profiles?.full_name} • {new Date(req.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className={clsx("px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border", statusMap[req.status]?.bg || 'bg-slate-100', statusMap[req.status]?.color || 'text-slate-500', "border-current/10")}>
                      {statusMap[req.status]?.label || req.status}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent Movements */}
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-black flex items-center gap-2">
                <ArrowRight size={18} className="text-primary-500" />
                Histórico do Estoque
              </h3>
              <Link to="/estoque" className="btn-premium-ghost px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest">Abrir Inventário</Link>
            </div>
            {loading ? <ActivitySkeleton /> : (
              <div className="divide-y divide-slate-50 dark:divide-slate-800">
                {recentMovements.length > 0 ? recentMovements.map(move => (
                  <div key={move.id} className="flex items-center justify-between p-5 group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 group-hover:text-primary-600">
                        <Activity size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary-600 transition-colors truncate max-w-[200px]">{move.assets?.nome_item}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Patr: {move.assets?.numero_patrimonio} • {new Date(move.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-black text-primary-600 bg-primary-100/50 dark:bg-primary-900/20 px-2 py-1 rounded-md uppercase">{move.tipo}</span>
                  </div>
                )) : (
                  <div className="p-10 text-center text-slate-400 italic text-sm">Nenhuma movimentação registrada.</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
