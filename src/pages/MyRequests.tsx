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
  Search,
  ArrowUpDown,
  Tag
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
  pending_gestor: { label: 'Aguardando Gestor', color: 'text-amber-700', bg: 'bg-amber-100', icon: Clock },
  pending_ti: { label: 'Em Análise TI', color: 'text-blue-700', bg: 'bg-blue-100', icon: FileText },
  pending_compras: { label: 'Em Compras', color: 'text-indigo-700', bg: 'bg-indigo-100', icon: Clock },
  pending_diretoria: { label: 'Aguardando Diretoria', color: 'text-purple-700', bg: 'bg-purple-100', icon: Clock },
  approved: { label: 'Aprovado Final', color: 'text-emerald-700', bg: 'bg-emerald-100', icon: CheckCircle2 },
  rejected: { label: 'Recusado', color: 'text-rose-700', bg: 'bg-rose-100', icon: XCircle },
  adjustment_needed: { label: 'Ajuste Necessário', color: 'text-orange-700', bg: 'bg-orange-100', icon: AlertCircle },
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
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Solicitações</h1>
          <p className="text-slate-500 text-lg">Central de acompanhamento e auditoria de compras.</p>
        </div>
        <Link 
          to="/nova-solicitacao"
          className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-xl shadow-primary-600/20 active:scale-95"
        >
          <Plus size={22} strokeWidth={3} />
          Nova Solicitação
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
            className="w-full pl-16 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent rounded-2xl outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-slate-950 transition-all font-bold text-slate-900 dark:text-white"
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
                 <th className="px-8 py-5 flex items-center gap-2">Data <ArrowUpDown size={12} /></th>
                <th className="px-8 py-5">Solicitante</th>
                <th className="px-8 py-5">Título da Solicitação</th>
                <th className="px-8 py-5">Categoria & Prioridade</th>
                <th className="px-8 py-5">Status Atual</th>
                <th className="px-8 py-5 text-right">Auditoria</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-8 py-10 h-20 bg-slate-50/10"></td>
                  </tr>
                ))
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-slate-500 italic font-medium">
                    Nenhuma solicitação encontrada com os filtros atuais.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => {
                  const status = statusMap[req.status] || { label: req.status, color: 'text-slate-700', bg: 'bg-slate-100', icon: Clock };
                  return (
                    <tr key={req.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-all cursor-pointer group" onClick={() => navigate(`/solicitacao/${req.id}`)}>
                      <td className="px-8 py-6 text-sm text-slate-500 font-bold">
                        {new Date(req.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', '')}
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="font-black text-slate-900 dark:text-white text-sm">
                            {req.profiles?.full_name || 'Usuário'}
                          </span>
                          <span className="text-[10px] text-primary-600 dark:text-primary-400 uppercase font-black tracking-widest mt-0.5">
                            {req.profiles?.department || 'Geral'}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col max-w-xs">
                          <span className="font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-primary-600 transition-colors">
                            {req.title}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">ID: {req.id.slice(0, 8)}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-1.5">
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md w-fit ring-1 ring-slate-200 dark:ring-slate-700 shadow-sm">
                            <Tag size={10} />
                            {req.category}
                          </span>
                          <span className={clsx(
                            "text-[9px] font-black uppercase tracking-widest ml-1",
                            (req.priority === 'alta' || req.priority === 'critica') ? 'text-rose-500' : 'text-slate-400'
                          )}>
                            PRIORIDADE {req.priority}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className={clsx("inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-black border shadow-sm", status.bg, status.color, "border-current/10")}>
                          <status.icon size={14} strokeWidth={3} />
                          {status.label.toUpperCase()}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <Link 
                          to={`/solicitacao/${req.id}`}
                          className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-primary-600 group-hover:text-white transition-all shadow-sm"
                        >
                          <ExternalLink size={18} />
                        </Link>
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
