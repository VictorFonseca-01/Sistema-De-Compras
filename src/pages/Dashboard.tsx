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

const statusMap: Record<string, { label: string; color: string; icon: any }> = {
  pending_gestor:    { label: 'Ag. Gestor',    color: 'var(--gp-warning)', icon: Clock },
  pending_ti:        { label: 'Em Análise TI', color: 'var(--gp-blue)',    icon: FileText },
  pending_compras:   { label: 'Em Compras',    color: 'var(--gp-purple)',  icon: TrendingUp },
  pending_diretoria: { label: 'Ag. Diretoria', color: 'var(--gp-purple)',  icon: Clock },
  approved:          { label: 'Aprovado',      color: 'var(--gp-success)', icon: CheckCircle },
  rejected:          { label: 'Recusado',      color: 'var(--gp-error)',   icon: XCircle },
  adjustment_needed: { label: 'Ajuste Nec.',   color: 'var(--gp-warning)', icon: AlertCircle },
};

function KpiSkeleton() {
  return (
    <div className="gp-metric animate-pulse">
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-xl gp-skeleton" />
      </div>
      <div className="mt-4">
        <div className="w-8 h-7 rounded gp-skeleton mb-2" />
        <div className="w-20 h-3 rounded gp-skeleton" />
      </div>
    </div>
  );
}

function RowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-5 py-4 animate-pulse">
      <div className="w-9 h-9 rounded-lg gp-skeleton flex-shrink-0" />
      <div className="flex-1">
        <div className="w-40 h-3.5 rounded gp-skeleton mb-2" />
        <div className="w-24 h-2.5 rounded gp-skeleton" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [loading, setLoading] = useState(true);
  const [requestStats, setRequestStats] = useState<any[]>([]);
  const [inventoryStats, setInventoryStats] = useState<any[]>([]);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [recentMovements, setRecentMovements] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const { data: requests } = await supabase.from('requests').select('*, profiles(full_name)');
      if (requests) {
        const counts = {
          pending: requests.filter(r => r.status.startsWith('pending')).length,
          approved: requests.filter(r => r.status === 'approved').length,
          totalCost: requests.reduce((acc, r) => acc + (Number(r.estimated_cost) || 0), 0)
        };
        setRequestStats([
          { label: 'Pendentes', value: counts.pending, icon: Clock, colorClass: 'text-gp-warning', bgClass: 'bg-gp-warning/10' },
          { label: 'Aprovadas', value: counts.approved, icon: CheckCircle, colorClass: 'text-gp-success', bgClass: 'bg-gp-success/10' },
          { 
            label: 'Investimento Total', 
            value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(counts.totalCost), 
            icon: BarChart3, 
            colorClass: 'text-gp-blue', 
            bgClass: 'bg-gp-blue/10' 
          },
        ]);
        setRecentRequests(
          [...requests].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 4)
        );
      }

      const { data: assets } = await supabase.from('assets').select('*');
      if (assets) {
        const total = assets.length;
        const stock = assets.filter(a => a.status === 'em_estoque').length;
        const use = assets.filter(a => a.status === 'em_uso').length;
        const maintenance = assets.filter(a => a.status === 'manutencao').length;
        setInventoryStats([
          { label: 'Em Estoque', value: stock, icon: Package, colorClass: 'text-gp-blue', bgClass: 'bg-gp-blue/10' },
          { label: 'Em Uso', value: use, icon: Activity, colorClass: 'text-gp-success', bgClass: 'bg-gp-success/10' },
          { label: 'Manutenção', value: maintenance, icon: Wrench, colorClass: 'text-gp-error', bgClass: 'bg-gp-error/10' },
        ]);
        setChartData([
          { label: 'Estoque', count: stock, color: 'var(--gp-blue)', percent: total ? (stock / total) * 100 : 0 },
          { label: 'Em Uso', count: use, color: 'var(--gp-success)', percent: total ? (use / total) * 100 : 0 },
          { label: 'Manutenção', count: maintenance, color: 'var(--gp-error)', percent: total ? (maintenance / total) * 100 : 0 },
        ]);
      }

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
    <div className="space-y-8 pb-16 animate-fade-up">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="gp-page-title">
            Dashboard
          </h1>
          <p className="gp-page-subtitle">
            Olá, {profile?.full_name || 'usuário'}. O sistema está operacional e atualizado.
          </p>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <button
            onClick={() => navigate('/relatorios')}
            className="btn-premium-secondary px-5 py-2.5 rounded-xl text-[12px]"
          >
            <FileBarChart size={16} strokeWidth={2} />
            Relatório Executivo
          </button>
          <button
            onClick={() => navigate('/nova-solicitacao')}
            className="btn-premium-primary px-5 py-2.5 rounded-xl text-[12px]"
          >
            <Plus size={16} strokeWidth={2.5} />
            Nova Solicitação
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <KpiSkeleton key={i} />)
          : [...requestStats, ...inventoryStats].map((stat, i) => (
              <div key={i} className="gp-metric group">
                <div className={clsx("gp-metric-icon", stat.bgClass, stat.colorClass)}>
                  <stat.icon size={20} strokeWidth={2.5} />
                </div>
                <div className="mt-4">
                  <p className="gp-metric-value">{stat.value}</p>
                  <p className="gp-metric-label">{stat.label}</p>
                </div>
              </div>
            ))
        }
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Donut Chart */}
        <div className="gp-card p-8 flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gp-blue/10 text-gp-blue flex items-center justify-center">
              <BarChart3 size={20} strokeWidth={2} />
            </div>
            <h3 className="text-[15px] font-bold text-gp-text">Situação do Inventário</h3>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center gap-10">
            {/* Donut */}
            <div className="relative w-48 h-48">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--gp-border)" strokeWidth="3" />
                {chartData.map((d, i) => {
                  const offset = chartData.slice(0, i).reduce((acc, curr) => acc + curr.percent, 0);
                  const circumference = 2 * Math.PI * 15.5;
                  return (
                    <circle
                      key={i}
                      cx="18" cy="18" r="15.5"
                      fill="transparent"
                      stroke={d.color}
                      strokeWidth="3.5"
                      strokeDasharray={`${(d.percent / 100) * circumference} ${circumference}`}
                      strokeDashoffset={-((offset / 100) * circumference)}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-3xl font-black text-gp-text">
                  {chartData.reduce((acc, d) => acc + d.count, 0)}
                </p>
                <p className="text-[10px] font-bold text-gp-text3 uppercase tracking-[0.2em] mt-1">Ativos</p>
              </div>
            </div>

            {/* Legend */}
            <div className="w-full space-y-3">
              {chartData.map((d, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gp-surface2 border border-gp-border rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shadow-sm" style={{ background: d.color }} />
                    <span className="text-[13px] font-bold text-gp-text2">{d.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-bold text-gp-text3 opacity-60">{d.count} un</span>
                    <span className="text-[13px] font-black text-gp-text">
                      {Math.round(d.percent)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity — 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Requests */}
          <div className="gp-card overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gp-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gp-warning/10 text-gp-warning flex items-center justify-center">
                  <FileText size={20} strokeWidth={2} />
                </div>
                <h3 className="text-[15px] font-bold text-gp-text">Solicitações Recentes</h3>
              </div>
              <Link
                to="/solicitacoes"
                className="btn-premium-ghost px-4 py-2 text-[11px] hover:bg-gp-surface2"
              >
                Ver todas <ArrowRight size={14} className="ml-2" />
              </Link>
            </div>

            {loading
              ? [1, 2, 3].map(i => <RowSkeleton key={i} />)
              : recentRequests.length === 0
                ? (
                  <div className="gp-empty py-16">
                    <div className="gp-empty-icon"><FileText size={24} /></div>
                    <p className="text-[13px] font-bold uppercase tracking-widest opacity-50">Nenhuma solicitação ativa</p>
                  </div>
                )
                : recentRequests.map(req => {
                    const s = statusMap[req.status];
                    return (
                      <Link
                        key={req.id}
                        to={`/solicitacao/${req.id}`}
                        className="flex items-center gap-4 px-6 py-4 transition-all hover:bg-gp-surface2 border-b border-gp-border last:border-0 group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-gp-surface border border-gp-border flex items-center justify-center group-hover:border-gp-blue/40 transition-colors">
                          <FileText size={18} className="text-gp-text3" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-bold text-gp-text truncate mb-0.5">{req.title}</p>
                          <p className="text-[11px] font-bold text-gp-text3 uppercase tracking-tighter opacity-60">
                            {req.profiles?.full_name} · {new Date(req.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        {s && (
                          <span
                            className="gp-badge text-[9px] h-6"
                            style={{ background: `${s.color}15`, color: s.color, borderColor: `${s.color}25` }}
                          >
                            {s.label}
                          </span>
                        )}
                      </Link>
                    );
                  })
            }
          </div>

          {/* Recent Movements */}
          <div className="gp-card overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gp-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gp-blue/10 text-gp-blue flex items-center justify-center">
                  <Activity size={20} strokeWidth={2} />
                </div>
                <h3 className="text-[15px] font-bold text-gp-text">Movimentações do Estoque</h3>
              </div>
              <Link
                to="/estoque"
                className="btn-premium-ghost px-4 py-2 text-[11px] hover:bg-gp-surface2"
              >
                Ver estoque <ArrowRight size={14} className="ml-2" />
              </Link>
            </div>

            {loading
              ? [1, 2, 3].map(i => <RowSkeleton key={i} />)
              : recentMovements.length === 0
                ? (
                  <div className="gp-empty py-16">
                    <div className="gp-empty-icon"><Activity size={24} /></div>
                    <p className="text-[13px] font-bold uppercase tracking-widest opacity-50">Sem movimentações pendentes</p>
                  </div>
                )
                : recentMovements.map(move => (
                    <div
                      key={move.id}
                      className="flex items-center gap-4 px-6 py-4 border-b border-gp-border last:border-0 transition-colors hover:bg-gp-surface2 group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gp-surface border border-gp-border flex items-center justify-center group-hover:border-gp-blue/40 transition-colors">
                        <Activity size={18} className="text-gp-blue" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-bold text-gp-text truncate mb-0.5">
                          {move.assets?.nome_item}
                        </p>
                        <p className="text-[11px] font-bold text-gp-text3 uppercase tracking-tighter opacity-60">
                          Patr: {move.assets?.numero_patrimonio} · {new Date(move.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <span className="gp-badge gp-badge-blue text-[9px] h-6">
                        {move.tipo.toUpperCase()}
                      </span>
                    </div>
                  ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}
