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
  pending_compras: { label: 'Em Compras', badgeClass: 'gp-badge-purple', icon: Clock },
  pending_diretoria: { label: 'Aguardando Diretoria', badgeClass: 'gp-badge-purple', icon: Clock },
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
      .select('*, profiles!inner(full_name, department)')
      .order('created_at', { ascending: false });

    // Filtros de RBAC
    if (profile.role === 'usuario') {
      query = query.eq('user_id', user.id);
    } else if (profile.role === 'gestor') {
      query = query.eq('profiles.department', profile.department);
    }
    // master_admin, ti, compras, diretoria veem tudo

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
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="gp-page-title">Solicitações</h1>
          <p className="gp-page-subtitle">Central de acompanhamento e auditoria de compras corporativas.</p>
        </div>
        <Link 
          to="/solicitacoes/nova"
          className="btn-premium-primary px-6 py-3 rounded-xl shadow-gp-blue/20"
        >
          <Plus size={18} strokeWidth={2} />
          NOVA SOLICITAÇÃO
        </Link>
      </header>

      {/* Filters Bar */}
      <div className="gp-card p-5 flex flex-col md:flex-row gap-5 items-center">
        <div className="relative flex-1 w-full group">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gp-text3 group-focus-within:text-gp-blue transition-colors" />
          <input 
            type="text" 
            placeholder="Pesquisar por título ou solicitante..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="gp-input pl-11 pr-4 py-3"
          />
        </div>
        <div className="w-full md:w-64 flex items-center gap-3">
          <Filter size={16} className="text-gp-text3 flex-shrink-0" />
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

      <div className="gp-table-wrap">
        <div className="overflow-x-auto">
          <table className="gp-table">
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
                            {req.profiles?.department || 'Geral'} • {new Date(req.created_at).toLocaleDateString()}
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
