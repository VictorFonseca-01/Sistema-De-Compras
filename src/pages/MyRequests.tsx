import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  FileText, 
  ExternalLink, 
  Clock, 
  CheckCircle2, 
  XCircle,
  AlertCircle,
  Plus,
  Search
} from 'lucide-react';
import { clsx } from 'clsx';
import { SearchableSelect } from '../components/SearchableSelect';

interface Request {
  id: string;
  title: string;
  category: string;
  estimated_cost: number;
  priority: string;
  status: string;
  current_step: string;
  created_at: string;
  profiles: {
    full_name: string;
    department: string;
  };
}

const statusMap: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending_gestor: { label: 'Aguardando Gestor', color: 'text-amber-500', bg: 'bg-amber-500/10', icon: Clock },
  pending_ti: { label: 'Em Análise TI', color: 'text-blue-500', bg: 'bg-blue-500/10', icon: FileText },
  pending_compras: { label: 'Em Compras', color: 'text-fuchsia-500', bg: 'bg-fuchsia-500/10', icon: Clock },
  pending_diretoria: { label: 'Aguardando Diretoria', color: 'text-purple-500', bg: 'bg-purple-500/10', icon: Clock },
  approved: { label: 'Aprovado Final', color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: CheckCircle2 },
  rejected: { label: 'Recusado', color: 'text-rose-500', bg: 'bg-rose-500/10', icon: XCircle },
  adjustment_needed: { label: 'Ajuste Necessário', color: 'text-orange-500', bg: 'bg-orange-500/10', icon: AlertCircle },
};

export default function MyRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<Request[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    let result = requests;
    if (searchTerm) {
      result = result.filter(r => 
        r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.profiles?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter(r => r.status === statusFilter);
    }
    setFilteredRequests(result);
  }, [searchTerm, statusFilter, requests]);

  const fetchRequests = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate('/login');
      return;
    }

    const { data, error } = await supabase
      .from('requests')
      .select('*, profiles(full_name, department)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRequests(data);
      setFilteredRequests(data);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">Solicitações</h1>
          <p className="text-slate-500 text-lg font-medium">Central de acompanhamento e auditoria de compras.</p>
        </div>
        <Link 
          to="/nova-solicitacao"
          className="bg-primary-600 hover:bg-primary-500 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 transition-all shadow-xl shadow-primary-600/20 active:scale-95"
        >
          <Plus size={22} strokeWidth={3} />
          NOVA SOLICITAÇÃO
        </Link>
      </header>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-6 items-center animate-in slide-in-from-top-4 duration-700">
        <div className="relative flex-1 w-full group">
          <Search size={20} className="absolute left-6 top-4 text-slate-400 group-focus-within:text-primary-600 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Pesquisar por título, ID ou nome do solicitante..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-16 pr-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent rounded-2xl outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-slate-950 transition-all font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
        </div>
        <div className="w-full md:w-72">
          <SearchableSelect 
            options={[
              { value: 'all', label: 'Todos os Status' },
              ...Object.keys(statusMap).map(key => ({ value: key, label: statusMap[key].label }))
            ]}
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            placeholder="Filtrar por Status"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black border-b border-slate-100 dark:border-slate-800">
                 <th className="px-8 py-5">Identidade</th>
                <th className="px-8 py-5">Título & Prioridade</th>
                <th className="px-8 py-5">Status Atual</th>
                <th className="px-8 py-5 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-2">
                        <div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 animate-pulse rounded"></div>
                        <div className="h-3 w-20 bg-slate-100 dark:bg-slate-800 animate-pulse rounded opacity-50"></div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-2">
                        <div className="h-4 w-40 bg-slate-100 dark:bg-slate-800 animate-pulse rounded"></div>
                        <div className="h-3 w-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded opacity-50"></div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="h-7 w-28 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl"></div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl ml-auto"></div>
                    </td>
                  </tr>
                ))
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-slate-500 italic font-medium">
                    Nenhuma solicitação encontrada.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => {
                  const status = statusMap[req.status] || { label: req.status, color: 'text-slate-700', bg: 'bg-slate-100', icon: Clock };
                  return (
                    <tr key={req.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-all cursor-pointer group hover:-translate-y-0.5 duration-300" onClick={() => navigate(`/solicitacao/${req.id}`)}>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="font-black text-slate-900 dark:text-white text-sm">
                            {req.profiles?.full_name || 'Usuário'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
                            {req.profiles?.department || 'Geral'} • {new Date(req.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col max-w-sm">
                          <span className="font-black text-slate-900 dark:text-slate-100 group-hover:text-primary-600 transition-colors">
                            {req.title}
                          </span>
                          <span className={clsx(
                             "text-[9px] font-black uppercase tracking-widest mt-1",
                             (req.priority === 'alta' || req.priority === 'critica') ? 'text-rose-500' : 'text-slate-400'
                          )}>
                             Pioridade {req.priority} • {req.category}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className={clsx("inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black border shadow-sm", status.bg, status.color, "border-current/10")}>
                          <status.icon size={13} strokeWidth={3} />
                          {status.label.toUpperCase()}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button 
                          onClick={() => navigate(`/solicitacao/${req.id}`)}
                          className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-primary-600 group-hover:text-white transition-all shadow-sm"
                        >
                          <ExternalLink size={18} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
