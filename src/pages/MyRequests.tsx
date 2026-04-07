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
  pending_gestor: { label: 'Aguardando Gestor', badgeClass: 'gp-badge-amber', icon: Clock },
  pending_ti: { label: 'Em Análise TI', badgeClass: 'gp-badge-blue', icon: FileText },
  pending_diretoria: { label: 'Aut. Diretoria', badgeClass: 'gp-badge-purple', icon: Clock },
  pending_compras: { label: 'Em Compras', badgeClass: 'gp-badge-purple', icon: Clock },
  approved: { label: 'Aprovado Final', badgeClass: 'gp-badge-success', icon: CheckCircle2 },
  rejected: { label: 'Recusado', badgeClass: 'gp-badge-red', icon: XCircle },
  adjustment_needed: { label: 'Ajuste Necessário', badgeClass: 'gp-badge-amber', icon: Clock },
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
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-1">
          <h1 className="gp-page-title">Solicitações</h1>
          <p className="gp-page-subtitle">Central de acompanhamento e auditoria de compras corporativas.</p>
        </div>
        <Link 
          to="/solicitacoes/nova"
          className="btn-premium-primary w-full lg:w-auto"
        >
          <Plus size={18} strokeWidth={3} />
          NOVA SOLICITAÇÃO
        </Link>
      </header>

      {/* Filters Bar */}
      <div className="gp-card p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:gap-5 items-center">
        <div className="relative flex-1 w-full group">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gp-text3 group-focus-within:text-gp-blue transition-colors" />
          <input 
            type="text" 
            placeholder="Pesquisar por título ou requerente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="gp-input pl-11"
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
              placeholder="Filtro Status"
            />
          </div>
        </div>
      </div>

      {/* Mobile Card List */}
      <div className="grid grid-cols-1 gap-4 sm:hidden">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="gp-card p-5 animate-pulse space-y-4">
              <div className="flex justify-between items-start">
                <div className="h-4 w-32 bg-gp-surface3 rounded" />
                <div className="h-6 w-24 bg-gp-surface3 rounded-lg" />
              </div>
              <div className="h-6 w-full bg-gp-surface2 rounded" />
              <div className="h-4 w-40 bg-gp-surface2 rounded" />
            </div>
          ))
        ) : filteredRequests.length === 0 ? (
          <div className="gp-empty">
             <div className="gp-empty-icon"><FileText size={32} /></div>
             <p className="text-gp-text3 font-medium">Nenhuma solicitação encontrada.</p>
          </div>
        ) : (
          filteredRequests.map((req) => {
            const status = statusMap[req.status] || { label: req.status, badgeClass: 'gp-badge-gray', icon: Clock };
            return (
              <Link 
                key={req.id} 
                to={`/solicitacoes/${req.id}`}
                className="gp-card p-5 active:scale-[0.98] transition-all flex flex-col gap-3 group relative overflow-hidden"
              >
                <div className="flex justify-between items-start gap-3 relative z-10">
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] text-gp-text3 font-black uppercase tracking-widest truncate opacity-60">
                       {new Date(req.created_at).toLocaleDateString()} • { (req as any).companies?.name || 'MATRIZ' }
                    </span>
                    <span className="font-bold text-gp-text truncate mt-1 text-[15px]">
                      {req.profiles?.full_name}
                    </span>
                  </div>
                  <div className={clsx("gp-badge gp-badge-sm flex-shrink-0 font-black", status.badgeClass)}>
                    <status.icon size={10} strokeWidth={3} />
                    {status.label.toUpperCase()}
                  </div>
                </div>

                <div className="flex flex-col border-t border-gp-border pt-4 relative z-10">
                  <span className="font-bold text-gp-text group-hover:text-gp-blue transition-colors line-clamp-2 text-[14px] leading-tight mb-3">
                    {req.title}
                  </span>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                       <span className={clsx(
                           "text-[9px] font-black uppercase tracking-widest",
                           (req.priority === 'alta' || req.priority === 'critica') ? 'text-gp-error' : 'text-gp-blue-light'
                       )}>
                           {req.priority} • {req.category}
                       </span>
                    </div>
                    <span className="text-sm font-black text-gp-text">
                       {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(req.estimated_cost)}
                    </span>
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gp-blue/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              </Link>
            )
          })
        )}
      </div>

      {/* Desktop/Tablet Table */}
      <div className="gp-table-container hidden sm:block">
        <table className="gp-table">
          <thead>
            <tr>
              <th className="gp-th">REQUERENTE / UNIDADE</th>
              <th className="gp-th">TÍTULO & PRIORIDADE</th>
              <th className="gp-th">STATUS ATUAL</th>
              <th className="gp-th text-right">AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                   <td className="gp-td px-6" colSpan={4}>
                      <div className="gp-skeleton h-12 w-full mb-1" />
                   </td>
                </tr>
              ))
            ) : filteredRequests.length === 0 ? (
              <tr>
                <td colSpan={4} className="gp-td py-20 text-center">
                  <div className="gp-empty">
                    <div className="gp-empty-icon"><FileText size={32} /></div>
                    <p className="text-gp-text3 font-medium">Nenhuma solicitação encontrada para os filtros aplicados.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredRequests.map((req) => {
                const status = statusMap[req.status] || { label: req.status, badgeClass: 'gp-badge-gray', icon: Clock };
                return (
                  <tr 
                    key={req.id} 
                    className="cursor-pointer hover:bg-gp-surface2 transition-all group" 
                    onClick={() => navigate(`/solicitacoes/${req.id}`)}
                  >
                    <td className="gp-td">
                      <div className="flex flex-col">
                        <span className="font-bold text-gp-text text-[14px] leading-tight">
                          {req.profiles?.full_name || 'Usuário'}
                        </span>
                        <span className="text-[10px] text-gp-muted font-black uppercase tracking-widest mt-1.5 leading-none">
                          { (req as any).departments?.name || 'Geral' } • { (req as any).companies?.name || 'MATRIZ' }
                        </span>
                      </div>
                    </td>
                    <td className="gp-td">
                      <div className="flex flex-col max-w-sm">
                        <span className="font-bold text-gp-text leading-tight group-hover:text-gp-blue transition-colors">
                          {req.title}
                        </span>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={clsx(
                             "text-[9px] font-black uppercase tracking-widest",
                             (req.priority === 'alta' || req.priority === 'critica') ? 'text-gp-error' : 'text-gp-blue-light'
                          )}>
                             {req.priority}
                          </span>
                          <span className="text-[9px] text-gp-text3 opacity-30">•</span>
                          <span className="text-[9px] text-gp-muted font-black uppercase tracking-widest">{req.category}</span>
                        </div>
                      </div>
                    </td>
                    <td className="gp-td">
                      <div className={clsx("gp-badge font-black", status.badgeClass)}>
                        <status.icon size={11} strokeWidth={3} />
                        {status.label.toUpperCase()}
                      </div>
                    </td>
                    <td className="gp-td text-right">
                      <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gp-surface2 text-gp-text3 group-hover:bg-gp-blue group-hover:text-white transition-all shadow-sm border border-gp-border">
                        <ArrowUpRight size={18} strokeWidth={2.5} />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
