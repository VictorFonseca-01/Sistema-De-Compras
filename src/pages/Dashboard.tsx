import { useEffect, useState } from 'react';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  Plus,
  ArrowRight,
  TrendingUp,
  Activity
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { useProfile } from '../hooks/useProfile';
import { clsx } from 'clsx';
import { AlertCircle, XCircle } from 'lucide-react';

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
    <div className="bg-white dark:bg-slate-900 p-10 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 animate-pulse">
      <div className="flex flex-col gap-5">
        <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl"></div>
        <div>
          <div className="w-24 h-3 bg-slate-100 dark:bg-slate-800 rounded-full mb-3"></div>
          <div className="w-16 h-9 bg-slate-100 dark:bg-slate-800 rounded-xl mb-1"></div>
        </div>
        <div className="pt-4 border-t border-slate-50 dark:border-white/5">
          <div className="w-28 h-2 bg-slate-100 dark:bg-slate-800 rounded-full mb-2"></div>
          <div className="w-20 h-5 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="divide-y divide-slate-50 dark:divide-slate-800">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center justify-between p-6 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800"></div>
            <div>
              <div className="w-48 h-4 bg-slate-100 dark:bg-slate-800 rounded-lg mb-2"></div>
              <div className="w-32 h-3 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
            </div>
          </div>
          <div className="w-28 h-7 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { profile } = useProfile();
  const [stats, setStats] = useState([
    { label: 'Pendentes Gestor', value: '0', total: '0', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10', key: 'pending_gestor' },
    { label: 'Em Análise TI', value: '0', total: '0', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10', key: 'pending_ti' },
    { label: 'Em Compras', value: '0', total: '0', icon: TrendingUp, color: 'text-fuchsia-500', bg: 'bg-fuchsia-500/10', key: 'pending_compras' },
    { label: 'Aprovadas', value: '0', total: '0', icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10', key: 'approved' },
  ]);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: requests } = await supabase.from('requests').select('*, profiles(full_name)');
      
      if (requests) {
        const counts = {
          pending_gestor: requests.filter(r => r.status === 'pending_gestor').length,
          pending_ti: requests.filter(r => r.status === 'pending_ti').length,
          pending_compras: requests.filter(r => r.status === 'pending_compras').length,
          approved: requests.filter(r => r.status === 'approved').length,
        };

        const totals = {
          pending_gestor: requests.filter(r => r.status === 'pending_gestor').reduce((acc, r) => acc + (r.estimated_cost || 0), 0),
          pending_ti: requests.filter(r => r.status === 'pending_ti').reduce((acc, r) => acc + (r.estimated_cost || 0), 0),
          pending_compras: requests.filter(r => r.status === 'pending_compras').reduce((acc, r) => acc + (r.estimated_cost || 0), 0),
          approved: requests.filter(r => r.status === 'approved').reduce((acc, r) => acc + (r.estimated_cost || 0), 0),
        };

        setStats(prev => prev.map(s => ({ 
          ...s, 
          value: counts[s.key as keyof typeof counts].toString(),
          total: totals[s.key as keyof typeof totals].toLocaleString('pt-BR', { minimumFractionDigits: 2 })
        })));

        setRecentRequests(requests.slice(0, 5).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      }
      setLoading(false);
    }

    fetchData();
  }, []);

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            Bem-vindo, {profile?.full_name?.split(' ')[0] || 'Colaborador'}
          </h1>
          <p className="text-slate-500 text-lg font-medium">Aqui está o que está acontecendo no sistema hoje.</p>
        </div>
        <Link 
          to="/nova-solicitacao"
          className="btn-premium-primary px-8 py-4 rounded-2xl"
        >
          <Plus size={22} strokeWidth={3} />
          NOVA SOLICITAÇÃO
        </Link>
      </header>

      {/* Grid de Métricas SaaS — com Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          <>
            <MetricSkeleton />
            <MetricSkeleton />
            <MetricSkeleton />
            <MetricSkeleton />
          </>
        ) : (
          stats.map((stat) => (
            <div key={stat.label} className="group bg-white dark:bg-slate-900 p-10 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-28 h-28 ${stat.bg} rounded-bl-[100px] opacity-20 -mr-10 -mt-10 group-hover:scale-125 transition-transform duration-500`}></div>
              <div className="flex flex-col gap-5 relative z-10">
                <div className={`${stat.color} ${stat.bg} p-3.5 rounded-2xl w-fit transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-3deg]`}>
                  <stat.icon size={28} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">
                    {stat.label}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-black text-slate-900 dark:text-white">
                      {stat.value}
                    </p>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-tighter mb-1.5 whitespace-nowrap">
                      Solicitações
                    </p>
                  </div>
                  <div className="mt-5 pt-5 border-t border-slate-50 dark:border-white/5">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-70">Total Acumulado (R$)</p>
                     <p className={clsx("text-lg font-black", stat.color)}>R$ {stat.total}</p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Atividade Recente — com Skeleton */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Activity size={20} className="text-primary-500" />
              Solicitações Recentes
            </h3>
            <Link to="/solicitacoes" className="text-primary-600 hover:text-primary-500 font-bold text-sm flex items-center gap-1">
              Ver tudo <ArrowRight size={16} />
            </Link>
          </div>
          <div className="flex-1">
             {loading ? (
               <ActivitySkeleton />
             ) : recentRequests.length > 0 ? (
               <div className="divide-y divide-slate-50 dark:divide-slate-800">
                 {recentRequests.map((req) => (
                   <Link key={req.id} to={`/solicitacao/${req.id}`} className="flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 group-hover:text-primary-500 transition-colors">
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100">{req.title}</p>
                          <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">{req.profiles?.full_name} • {new Date(req.created_at).toLocaleDateString()}</p>
                        </div>
                     </div>
                     {(() => {
                       const status = statusMap[req.status] || { label: req.status, color: 'text-slate-500', bg: 'bg-slate-100', icon: Activity };
                       return (
                         <div className={clsx("inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black border uppercase tracking-widest shadow-sm", status.bg, status.color, "border-current/10")}>
                           <status.icon size={12} strokeWidth={3} />
                           {status.label}
                         </div>
                       );
                     })()}
                   </Link>
                 ))}
               </div>
             ) : (
               <div className="p-20 text-center text-slate-400 italic">Nenhuma atividade recente para exibir.</div>
             )}
          </div>
        </div>

        {/* Banner Informativo SaaS */}
        <div className="flex flex-col gap-6">
          <div className="bg-gradient-to-br from-indigo-600 to-primary-700 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden group">
            <TrendingUp size={160} className="absolute -right-12 -bottom-12 text-white/5 rotate-12 group-hover:rotate-0 transition-transform duration-700" />
            <div className="relative z-10">
              <h4 className="text-2xl font-black mb-4 leading-tight">Eficiência no Fluxo de TI</h4>
              <p className="text-indigo-100 mb-8 leading-relaxed opacity-90">
                Lembre-se que todas as solicitações são rastreadas e passam por auditoria para garantir a melhor alocação de recursos.
              </p>
              <Link 
                to="/nova-solicitacao" 
                className="btn-premium px-6 py-3 rounded-2xl bg-white text-primary-700 hover:bg-indigo-50 shadow-xl"
              >
                Nova Compra <Plus size={18} />
              </Link>
            </div>
          </div>

          <div className="bg-slate-950 rounded-3xl p-8 text-white border border-slate-800">
            <h4 className="font-bold text-lg mb-2">Dica Pro</h4>
            <p className="text-slate-400 text-sm leading-relaxed">
              Use os links de referência para agilizar a cotação pelo departamento de compras.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
