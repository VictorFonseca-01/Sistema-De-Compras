import { useEffect, useState } from 'react';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Plus,
  ArrowRight,
  TrendingUp,
  Activity
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [stats, setStats] = useState([
    { label: 'Pendentes', value: '0', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10', key: 'pending' },
    { label: 'Em Análise TI', value: '0', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10', key: 'pending_ti' },
    { label: 'Aprovadas', value: '0', icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10', key: 'approved' },
    { label: 'Recusadas', value: '0', icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-500/10', key: 'rejected' },
  ]);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: requests } = await supabase.from('requests').select('*, profiles(full_name)');
      
      if (requests) {
        const counts = {
          pending: requests.filter(r => r.status.startsWith('pending_') && r.status !== 'pending_ti').length,
          pending_ti: requests.filter(r => r.status === 'pending_ti').length,
          approved: requests.filter(r => r.status === 'approved').length,
          rejected: requests.filter(r => r.status === 'rejected').length,
        };

        setStats(prev => prev.map(s => ({ 
          ...s, 
          value: counts[s.key as keyof typeof counts].toString() 
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
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Bem-vindo, Colaborador
          </h1>
          <p className="text-slate-500 text-lg">Aqui está o que está acontecendo no sistema hoje.</p>
        </div>
        <Link 
          to="/nova-solicitacao"
          className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-xl shadow-primary-600/20 active:scale-95"
        >
          <Plus size={22} strokeWidth={3} />
          Nova Solicitação
        </Link>
      </header>

      {/* Grid de Métricas SaaS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="group bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-300 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bg} rounded-bl-[100px] opacity-20 -mr-8 -mt-8 group-hover:scale-110 transition-transform`}></div>
            <div className="flex flex-col gap-4 relative z-10">
              <div className={`${stat.color} ${stat.bg} p-3 rounded-2xl w-fit`}>
                <stat.icon size={28} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">
                  {stat.label}
                </p>
                <p className="text-4xl font-black text-slate-900 dark:text-white">
                  {loading ? '...' : stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Atividade Recente */}
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
             {recentRequests.length > 0 ? (
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
                     <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-md">
                        {req.status.replace('pending_', '')}
                     </span>
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
                className="inline-flex items-center gap-2 bg-white text-primary-700 px-6 py-3 rounded-2xl font-black hover:bg-indigo-50 transition-all shadow-xl active:scale-95"
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
