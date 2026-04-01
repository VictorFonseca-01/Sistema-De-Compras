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
  Plus
} from 'lucide-react';

interface Request {
  id: string;
  title: string;
  category: string;
  estimated_cost: number;
  priority: string;
  status: string;
  current_step: string;
  created_at: string;
}

const statusMap: Record<string, { label: string; color: string; icon: any }> = {
  pending_gestor: { label: 'Aguardando Gestor', color: 'bg-amber-100 text-amber-700', icon: Clock },
  pending_ti: { label: 'Em Análise TI', color: 'bg-blue-100 text-blue-700', icon: FileText },
  pending_compras: { label: 'Em Compras', color: 'bg-indigo-100 text-indigo-700', icon: Clock },
  pending_diretoria: { label: 'Aguardando Diretoria', color: 'bg-purple-100 text-purple-700', icon: Clock },
  approved: { label: 'Aprovado Final', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  rejected: { label: 'Recusado', color: 'bg-rose-100 text-rose-700', icon: XCircle },
  adjustment_needed: { label: 'Ajuste Necessário', color: 'bg-orange-100 text-orange-700', icon: AlertCircle },
};

export default function MyRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate('/login');
      return;
    }

    const { data, error } = await supabase
      .from('requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRequests(data);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Minhas Solicitações</h1>
          <p className="text-slate-500">Gerencie e acompanhe suas solicitações de TI.</p>
        </div>
        <Link 
          to="/nova-solicitacao"
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 transition-all"
        >
          <Plus size={20} />
          Nova Solicitação
        </Link>
      </header>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs uppercase tracking-widest font-bold">
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Título</th>
                <th className="px-6 py-4">Categoria / Prioridade</th>
                <th className="px-6 py-4">Status Atual</th>
                <th className="px-6 py-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-8 h-16 bg-slate-50/50"></td>
                  </tr>
                ))
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">
                    Nenhuma solicitação encontrada por enquanto.
                  </td>
                </tr>
              ) : (
                requests.map((req) => {
                  const status = statusMap[req.status] || { label: req.status, color: 'bg-slate-100', icon: Clock };
                  return (
                    <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(req.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', '')}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-900 dark:text-slate-100 block truncate max-w-xs">
                          {req.title}
                        </span>
                        <span className="text-xs text-slate-400">ID: {req.id.slice(0, 8)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full w-fit">
                            {req.category}
                          </span>
                          <span className={`text-[10px] uppercase font-bold tracking-tighter ${
                            req.priority === 'alta' || req.priority === 'critica' ? 'text-red-500' : 'text-slate-400'
                          }`}>
                            Prioridade {req.priority}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${status.color}`}>
                          <status.icon size={14} />
                          {status.label}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link 
                          to={`/solicitacao/${req.id}`}
                          className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 font-bold text-sm"
                        >
                          Detalhes
                          <ExternalLink size={16} />
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
