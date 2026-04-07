import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Plus,
  Search,
  Filter,
  ArrowUpRight
} from 'lucide-react';
import { clsx } from 'clsx';
import { SearchableSelect } from '../components/SearchableSelect';
import { useProfile } from '../hooks/useProfile';

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

const statusMap: Record<string, { label: string; badgeClass: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }> }> = {
  pending_gestor: { label: 'Aguardando Gestor', badgeClass: 'gp-badge-warning', icon: Clock },
  pending_ti: { label: 'Em Análise TI', badgeClass: 'gp-badge-blue', icon: FileText },
  pending_diretoria: { label: 'Aguardando Diretoria', badgeClass: 'gp-badge-purple', icon: Clock },
  pending_compras: { label: 'Em Compras', badgeClass: 'gp-badge-purple', icon: Clock },
  approved: { label: 'Aprovado Final', badgeClass: 'gp-badge-success', icon: CheckCircle2 },
  rejected: { label: 'Recusado', badgeClass: 'gp-badge-red', icon: XCircle },
  adjustment_needed: { label: 'Ajuste Necessário', badgeClass: 'gp-badge-warning', icon: Clock },
};

export default function MyRequests() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [requests, setRequests] = useState<Request[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchRequests = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || !profile) {
      setLoading(false);
      return;
    }

    let query = supabase
      .from('requests')
      .select('*, profiles!inner(full_name), companies(name), departments(name)')
      .order('created_at', { ascending: false });

    // O RLS agora cuida da segurança. Removendo filtros manuais de role para simplificar.

    const { data, error } = await query;

    if (!error && data) {
      setRequests(data);
      setFilteredRequests(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (profile) {
      fetchRequests();
    }
  }, [profile]);

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

  return (
    <div className="space-y-8 animate-fade-up pb-16">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="gp-page-title">Solicitações</h1>
          <p className="gp-page-subtitle">Central de acompanhamento e auditoria de compras corporativas.</p>
        </div>
        <Link 
          to="/solicitacoes/nova"
          className="btn-premium-primary w-full sm:w-auto px-6 py-3 rounded-xl shadow-gp-blue/20 flex justify-center"
        >
          <Plus size={18} strokeWidth={2} />
          NOVA SOLICITAÇÃO
        </Link>
      </header>

      {/* Filters Bar */}
      <div className="gp-card p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:gap-5 items-center">
        <div className="relative flex-1 w-full group">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gp-text3 group-focus-within:text-gp-blue transition-colors" />
          <input 
            type="text" 
            placeholder="Pesquisar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="gp-input pl-11 pr-4 py-3 text-sm sm:text-base"
          />
        </div>
        <div className="w-full sm:w-64 flex items-center gap-3">
          <Filter size={16} className="text-gp-text3 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <SearchableSelect 
              options={[
                { value: 'all', label: 'Todos os Status' },
                ...Object.keys(statusMap).map(key => ({ value: key, label: statusMap[key].label }))
              ]}
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              placeholder="Status"
            />
          </div>
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
              <div className="h-3 w-40 bg-gp-border/50 rounded" />
            </div>
          ))
        ) : filteredRequests.length === 0 ? (
          <div className="gp-card p-8 text-center text-gp-text3 italic text-sm">
             Nenhuma solicitação encontrada.
          </div>
        ) : (
          filteredRequests.map((req) => {
            const status = statusMap[req.status] || { label: req.status, badgeClass: 'gp-badge-gray', icon: Clock };
            return (
              <Link 
                key={req.id} 
                to={`/solicitacoes/${req.id}`}
                className="gp-card p-4 active:scale-[0.98] transition-all flex flex-col gap-3 group"
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] text-gp-text3 font-bold uppercase tracking-widest truncate">
                       { (req as any).companies?.name || 'Matriz' } • {new Date(req.created_at).toLocaleDateString()}
                    </span>
                    <span className="font-bold text-gp-text truncate mt-0.5">
                      {req.profiles?.full_name}
                    </span>
                  </div>
                  <div className={clsx("gp-badge gp-badge-sm flex-shrink-0", status.badgeClass)}>
                    <status.icon size={10} strokeWidth={2.5} />
                    {status.label.toUpperCase()}
                  </div>
                </div>

                <div className="flex flex-col border-t border-gp-border pt-3">
                  <span className="font-bold text-gp-text group-hover:text-gp-blue transition-colors line-clamp-2">
                    {req.title}
                  </span>
                  <div className="flex items-center justify-between mt-2">
                    <span className={clsx(
                        "text-[9px] font-bold uppercase tracking-widest",
                        (req.priority === 'alta' || req.priority === 'critica') ? 'text-gp-error' : 'text-gp-text3'
                    )}>
                        Prioridade {req.priority} • {req.category}
                    </span>
                    <span className="text-[11px] font-bold text-gp-blue">
                       {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(req.estimated_cost)}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>

      {/* Desktop/Tablet Table */}
      <div className="gp-table-wrap hidden sm:block">
        <div className="overflow-x-auto no-scrollbar">
          <table className="gp-table min-w-full">
            <thead>
              <tr>
                <th>IDENTIDADE</th>
                <th>TÍTULO & PRIORIDADE</th>
                <th>STATUS ATUAL</th>
                <th className="text-right">AÇÃO</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td>
                      <div className="flex flex-col gap-2">
                        <div className="h-4 w-32 bg-gp-border rounded animate-pulse" />
                        <div className="h-3 w-20 bg-gp-border/50 rounded animate-pulse" />
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col gap-2">
                        <div className="h-4 w-40 bg-gp-border rounded animate-pulse" />
                        <div className="h-3 w-24 bg-gp-border/50 rounded animate-pulse" />
                      </div>
                    </td>
                    <td>
                      <div className="h-6 w-28 bg-gp-border rounded-lg animate-pulse" />
                    </td>
                    <td className="text-right">
                      <div className="w-9 h-9 bg-gp-border rounded-lg animate-pulse ml-auto" />
                    </td>
                  </tr>
                ))
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-gp-text3 italic font-medium">
                    Nenhuma solicitação encontrada para os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => {
                  const status = statusMap[req.status] || { label: req.status, badgeClass: 'gp-badge-gray', icon: Clock };
                  return (
                    <tr 
                      key={req.id} 
                      className="cursor-pointer group hover:bg-gp-hover transition-all" 
                      onClick={() => navigate(`/solicitacoes/${req.id}`)}
                    >
                      <td>
                        <div className="flex flex-col">
                          <span className="font-bold text-gp-text text-sm">
                            {req.profiles?.full_name || 'Usuário'}
                          </span>
                          <span className="text-[10px] text-gp-text3 font-bold uppercase tracking-widest mt-1">
                            { (req as any).departments?.name || 'Geral' } • { (req as any).companies?.name || 'Matriz' } • {new Date(req.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-col max-w-sm">
                          <span className="font-bold text-gp-text group-hover:text-gp-blue transition-colors">
                            {req.title}
                          </span>
                          <span className={clsx(
                             "text-[9px] font-bold uppercase tracking-widest mt-1",
                             (req.priority === 'alta' || req.priority === 'critica') ? 'text-gp-error' : 'text-gp-text3'
                          )}>
                             Pioridade {req.priority} • {req.category}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className={clsx("gp-badge", status.badgeClass)}>
                          <status.icon size={12} strokeWidth={2} />
                          {status.label.toUpperCase()}
                        </div>
                      </td>
                      <td className="text-right">
                        <button 
                          className="w-9 h-9 rounded-lg flex items-center justify-center bg-gp-surface3 text-gp-text3 group-hover:bg-gp-blue-light group-hover:text-white transition-all shadow-sm"
                        >
                          <ArrowUpRight size={18} />
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
