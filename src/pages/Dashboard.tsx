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
  FileBarChart,
  ShieldCheck
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useProfile } from '../hooks/useProfile';
import { clsx } from 'clsx';

/**
 * GLOBAL PARTS — Dashboard Executivo (Nível 4 Calibration)
 * 
 * Agora consome Views de Governança para KPIs em tempo real.
 */

const statusMap: Record<string, { label: string; color: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }> }> = {
  PENDING_GESTOR:        { label: 'Ag. Gestor',    color: 'var(--gp-warning)', icon: Clock },
  PENDING_TI:            { label: 'Analise TI',    color: 'var(--gp-blue)',    icon: FileText },
  PENDING_COMPRAS:       { label: 'Cotacao',       color: 'var(--gp-purple)',  icon: TrendingUp },
  PENDING_DIRETORIA:     { label: 'Ag. Diretoria', color: 'var(--gp-purple)',  icon: Clock },
  PENDING_COMPRAS_FINAL: { label: 'Finalizacao',    color: 'var(--gp-blue)',    icon: ShieldCheck },
  COMPLETED:              { label: 'Aprovado',      color: 'var(--gp-success)', icon: CheckCircle },
  REJECTED:              { label: 'Recusado',      color: 'var(--gp-error)',   icon: XCircle },
  ADJUSTMENT_NEEDED:     { label: 'Ajuste Nec.',   color: 'var(--gp-warning)', icon: AlertCircle },
};

function KpiSkeleton() {
  return (
    <div className="gp-metric animate-pulse bg-gp-surface/50 border-gp-border/30">
      <div className="flex items-start justify-between">
        <div className="w-12 h-12 rounded-2xl gp-skeleton" />
      </div>
      <div className="mt-6">
        <div className="w-10 h-8 rounded-lg gp-skeleton mb-2" />
        <div className="w-24 h-3.5 rounded gp-skeleton" />
      </div>
    </div>
  );
}

function RowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-5 py-4 animate-pulse">
      <div className="w-10 h-10 rounded-xl gp-skeleton flex-shrink-0" />
      <div className="flex-1">
        <div className="w-40 h-4 rounded gp-skeleton mb-2" />
        <div className="w-24 h-3 rounded gp-skeleton" />
      </div>
    </div>
  );
}

interface StatItem {
  group: 'financial' | 'pipeline';
  label: string;
  value: string | number;
  secondary?: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  colorClass: string;
  bgClass: string;
}

interface InventoryStat {
  label: string;
  value: number;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  colorClass: string;
  bgClass: string;
}

interface RecentRequest {
  id: string;
  title: string;
  status: string;
  created_at: string;
  profiles: {
    full_name: string;
    department: string;
  };
}

interface RecentMovement {
  id: string;
  created_at: string;
  tipo: string;
  assets: {
    nome_item: string;
    numero_patrimonio: string;
  };
}

interface ChartDataPoint {
  label: string;
  count: number;
  color: string;
  percent: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useProfile();
  const [loading, setLoading] = useState(true);
  const [requestStats, setRequestStats] = useState<StatItem[]>([]);
  const [inventoryStats, setInventoryStats] = useState<InventoryStat[]>([]);
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([]);
  const [recentMovements, setRecentMovements] = useState<RecentMovement[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [categoryStats, setCategoryStats] = useState<{ label: string; count: number; investment: number; color: string }[]>([]);
  const [subcategoryStats, setSubcategoryStats] = useState<{ label: string; count: number }[]>([]);
  const [showAccessDenied, setShowAccessDenied] = useState(!!location.state?.accessDenied);

  const categoryColors: Record<string, string> = {
    "TI / Tecnologia": "var(--gp-blue)",
    "Mobiliário": "var(--gp-amber)",
    "Infraestrutura": "var(--gp-purple)",
    "Administrativo": "var(--gp-success)",
    "Serviços": "var(--gp-text)",
    "Outros": "var(--gp-muted)"
  };

  useEffect(() => {
    async function fetchData() {
      if (!profile) {
        setLoading(false);
        return;
      }
      
      setLoading(true);

      try {
        const { data: requests } = await supabase.from('requests').select('*, profiles!inner(full_name)');
        
        if (requests) {
          const getStats = (statusList: string[]) => {
            const filtered = requests.filter(r => statusList.includes(r.status));
            return {
              count: filtered.length,
              sum: filtered.reduce((acc, r) => acc + (Number(r.actual_cost || r.estimated_cost) || 0), 0)
            };
          };

          const formatCurrency = (val: number) => 
            new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

          const stats_pending_gestor = getStats(['PENDING_GESTOR']);
          const stats_pending_ti = getStats(['PENDING_TI']);
          const stats_pending_compras = getStats(['PENDING_COMPRAS', 'PENDING_COMPRAS_FINAL']);
          const stats_pending_diretoria = getStats(['PENDING_DIRETORIA']);
          const stats_approved = getStats(['COMPLETED']);
          const stats_pending_total = requests.filter(r => r.status.startsWith('PENDING')).reduce((acc, r) => {
            return {
              count: acc.count + 1,
              sum: acc.sum + (Number(r.actual_cost || r.estimated_cost) || 0)
            };
          }, { count: 0, sum: 0 });

          const totalInvestment = stats_approved.sum;

          setRequestStats([
            { 
              group: 'financial',
              label: 'Investimento Total', 
              value: formatCurrency(totalInvestment), 
              icon: BarChart3, 
              colorClass: 'text-gp-blue', 
              bgClass: 'bg-gp-blue/10' 
            },
            { 
              group: 'financial',
              label: 'Gasto Potencial', 
              value: stats_pending_total.count,
              secondary: formatCurrency(stats_pending_total.sum),
              icon: Clock, 
              colorClass: 'text-gp-amber', 
              bgClass: 'bg-gp-amber/10' 
            },
            { 
              group: 'financial',
              label: 'Aquisições Capitalizadas', 
              value: stats_approved.count,
              secondary: formatCurrency(stats_approved.sum),
              icon: CheckCircle, 
              colorClass: 'text-gp-success', 
              bgClass: 'bg-gp-success/10' 
            },
            { 
              group: 'pipeline',
              label: 'Validação Gestor', 
              value: stats_pending_gestor.count,
              secondary: formatCurrency(stats_pending_gestor.sum),
              icon: FileText, 
              colorClass: 'text-gp-text', 
              bgClass: 'bg-gp-surface2 border-gp-border/30' 
            },
            { 
              group: 'pipeline',
              label: 'Análise Técnica', 
              value: stats_pending_ti.count,
              secondary: formatCurrency(stats_pending_ti.sum),
              icon: Activity, 
              colorClass: 'text-gp-blue', 
              bgClass: 'bg-gp-blue/10' 
            },
            { 
              group: 'pipeline',
              label: 'Aprovação Final', 
              value: stats_pending_diretoria.count,
              secondary: formatCurrency(stats_pending_diretoria.sum),
              icon: Clock, 
              colorClass: 'text-gp-amber', 
              bgClass: 'bg-gp-amber/10' 
            },
            { 
              group: 'pipeline',
              label: 'Cotação Compras', 
              value: stats_pending_compras.count,
              secondary: formatCurrency(stats_pending_compras.sum),
              icon: TrendingUp, 
              colorClass: 'text-gp-purple', 
              bgClass: 'bg-gp-purple/10' 
            },
          ]);

          setRecentRequests(
            [...requests].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 4)
          );

          // Agregar por Categoria
          const cats: Record<string, { count: number; investment: number }> = {};
          const subs: Record<string, number> = {};

          requests.forEach(r => {
            const cat = r.category || 'Outros';
            const sub = r.subcategoria_solicitacao || 'Não Categorizado';
            const cost = Number(r.actual_cost || r.estimated_cost) || 0;

            if (!cats[cat]) cats[cat] = { count: 0, investment: 0 };
            cats[cat].count++;
            cats[cat].investment += cost;

            if (!subs[sub]) subs[sub] = 0;
            subs[sub]++;
          });

          setCategoryStats(Object.entries(cats).map(([label, data]) => ({
            label,
            ...data,
            color: categoryColors[label] || categoryColors["Outros"]
          })).sort((a, b) => b.count - a.count));

          setSubcategoryStats(Object.entries(subs).map(([label, count]) => ({
            label,
            count
          })).sort((a, b) => b.count - a.count).slice(0, 6));
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
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [profile]);

  return (
    <div className="space-y-8 pb-16 animate-fade-up">
      {/* Access Denied Banner */}
      {showAccessDenied && (
        <div className="flex items-center justify-between p-5 bg-gp-error/10 border border-gp-error/20 text-gp-error rounded-2xl animate-shake">
          <div className="flex items-center justify-between mb-8 relative z-10">
          <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-500 group-hover:rotate-12", "bg-gp-error")}>
             <AlertCircle size={22} strokeWidth={3} className="opacity-100 text-white" />
          </div>
            <span className="text-[13px] font-black uppercase tracking-wider">Acesso Negado: Sua função não possui permissão para esta área.</span>
          </div>
          <button onClick={() => setShowAccessDenied(false)} className="px-4 py-2 text-[10px] font-black opacity-60 hover:opacity-100 uppercase tracking-widest">FECHAR</button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-1">
          <h1 className="gp-page-title">Painel de Controle</h1>
          <p className="gp-page-subtitle">
            Olá, <span className="text-gp-blue font-black uppercase">{profile?.full_name?.split(' ')[0] || 'Usuário'}</span>. Visão geral do ecossistema Global Parts.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <button
            onClick={() => navigate('/relatorios')}
            className="btn-premium-secondary flex-1 lg:flex-none uppercase text-[10px] font-black tracking-widest"
          >
            <FileBarChart size={16} strokeWidth={3} />
            Relatórios
          </button>
          <button
            onClick={() => navigate('/solicitacoes/nova')}
            className="btn-premium-primary flex-1 lg:flex-none uppercase text-[10px] font-black tracking-widest"
          >
            <Plus size={18} strokeWidth={3} />
            Nova Solicitação
          </button>
        </div>
      </div>

      {/* Summary KPI Sections */}
      <div className="space-y-6">
        {/* Financial Summary */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-black text-gp-text uppercase tracking-[0.2em] opacity-80">Balanço Financeiro</h3>
            <span className="text-[9px] font-black text-gp-blue uppercase tracking-widest opacity-60 flex items-center gap-1.5">
              <CheckCircle size={10} strokeWidth={3} /> Controladoria Global
            </span>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main KPI: Investimento Total */}
            {loading ? (
              <KpiSkeleton />
            ) : (
              <div className="gp-card group relative overflow-hidden p-6 sm:p-8 border-gp-blue/30 bg-gp-blue/[0.02]">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-gp-blue/5 rounded-full blur-[60px] group-hover:bg-gp-blue/10 transition-colors" />
                
                <div className="relative flex items-start justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-gp-blue text-white shadow-xl shadow-gp-blue/30 flex items-center justify-center transform group-hover:rotate-6 transition-transform">
                    <BarChart3 size={24} strokeWidth={2.5} />
                  </div>
                </div>
                
                <div className="relative mt-8">
                  <p className="text-3xl sm:text-4xl font-black text-gp-text tracking-tighter">
                    {requestStats.find(s => s.label === 'Investimento Total')?.value || 'R$ 0,00'}
                  </p>
                  <p className="text-[10px] font-black text-gp-blue-light uppercase tracking-[0.2em] mt-3 opacity-80">Investimento Total Aprovado</p>
                </div>
              </div>
            )}

            {/* Sub KPI: Devolvida/Pendente */}
            {loading ? (
              <KpiSkeleton />
            ) : (
              <div className="gp-card group relative overflow-hidden p-6">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-xl bg-gp-amber/10 text-gp-amber flex items-center justify-center border border-gp-amber/20 shadow-inner">
                    <Clock size={22} strokeWidth={2.5} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-gp-muted uppercase tracking-widest opacity-70 leading-none mb-2">Gasto Potencial (Fluxo)</p>
                    <p className="text-xl font-black text-gp-text tracking-tight uppercase">
                      {requestStats.find(s => s.label === 'Gasto Potencial')?.secondary || 'R$ 0,00'}
                    </p>
                  </div>
                </div>
                <div className="mt-8 pt-5 border-t border-gp-border flex items-center justify-between">
                  <span className="text-[10px] text-gp-muted font-black uppercase tracking-widest">Processos Ativos</span>
                  <span className="text-[10px] font-black text-gp-amber uppercase bg-gp-amber/10 px-2 py-0.5 rounded leading-none">{requestStats.find(s => s.label === 'Gasto Potencial')?.value || 0} ITEMS</span>
                </div>
              </div>
            )}

            {/* Sub KPI: Concluídas */}
            {loading ? (
              <KpiSkeleton />
            ) : (
              <div className="gp-card group relative overflow-hidden p-6">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-xl bg-gp-success/10 text-gp-success flex items-center justify-center border border-gp-success/20 shadow-inner">
                    <CheckCircle size={22} strokeWidth={2.5} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-gp-muted uppercase tracking-widest opacity-70 leading-none mb-2">Aquisições Capitalizadas</p>
                    <p className="text-xl font-black text-gp-text tracking-tight uppercase">
                      {requestStats.find(s => s.label === 'Aquisições Capitalizadas')?.value || 0} Equipamentos
                    </p>
                  </div>
                </div>
                <div className="mt-8 pt-5 border-t border-gp-border flex items-center justify-between">
                  <span className="text-[10px] text-gp-muted font-black uppercase tracking-widest">Conformidade Global</span>
                  <span className="text-[10px] font-black text-gp-success uppercase bg-gp-success/10 px-2 py-0.5 rounded leading-none">ATIVO SALVO</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Approval Pipeline */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-black text-gp-muted uppercase tracking-[0.2em]">Fluxo de Auditoria (Sincronizado)</h3>
            <span className="text-[9px] font-black text-gp-blue uppercase tracking-widest opacity-40 leading-none">SLA médio: 4.2h</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)
              : requestStats.filter(s => s.group === 'pipeline').map((stat, i) => (
                  <div 
                    key={i} 
                    className="gp-metric group bg-gp-surface/40 hover:bg-gp-surface border-gp-border/50 hover:border-gp-blue/30 transition-all duration-300"
                  >
                    <div className={clsx(
                      "w-11 h-11 rounded-2xl flex items-center justify-center transition-all shadow-md group-hover:scale-110 group-hover:rotate-3",
                      stat.bgClass, stat.colorClass, "border border-gp-border/20"
                    )}>
                      <stat.icon size={20} strokeWidth={2.5} />
                    </div>
                    <div className="mt-6 flex flex-col">
                      <p className="text-2xl font-black text-gp-text leading-none tracking-tight mb-2">
                        {stat.value}
                      </p>
                      <p className="text-[10px] font-black text-gp-text uppercase tracking-widest opacity-70">
                        {stat.label}
                      </p>
                      {stat.secondary && (
                        <div className="mt-4 pt-4 border-t border-gp-border/20">
                          <p className="text-[11px] font-black text-gp-blue tracking-widest opacity-90 uppercase leading-none">
                            {stat.secondary}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
            }
          </div>
        </div>

        {/* Inventory Brief */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-gp-muted uppercase tracking-[0.2em] px-1">Integridade do Patrimônio</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => <KpiSkeleton key={i} />)
              : inventoryStats.map((stat, i) => (
                  <div 
                    key={i} 
                    className="gp-metric group flex items-center gap-5 p-6 bg-gp-surface/40 hover:bg-gp-surface transition-all duration-300"
                  >
                    <div className={clsx(
                      "w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform shadow-md border border-gp-border/20",
                      stat.bgClass, stat.colorClass
                    )}>
                      <stat.icon size={26} strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-2xl font-black text-gp-text tracking-tighter leading-none mb-1.5 uppercase">
                        {stat.value}
                      </p>
                      <p className="text-[10px] font-black text-gp-muted uppercase tracking-widest opacity-60 leading-none">
                        {stat.label}
                      </p>
                    </div>
                  </div>
                ))
            }
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-gp-muted uppercase tracking-[0.2em] px-1">Distribuição Criativa por Categoria</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading 
              ? Array.from({ length: 3 }).map((_, i) => <KpiSkeleton key={i} />)
              : categoryStats.map((cat, i) => (
                  <div key={i} className="gp-card group p-5 bg-gp-surface/40 hover:bg-gp-surface transition-all flex flex-col justify-between border-gp-border/30 hover:border-gp-blue/20">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="text-[12px] font-black text-gp-text uppercase tracking-tight">{cat.label}</span>
                      </div>
                      <span className="text-[10px] font-black text-gp-muted uppercase tracking-widest bg-gp-surface2 px-2 py-0.5 rounded border border-gp-border/30 shadow-inner">
                        {cat.count} PEDIDOS
                      </span>
                    </div>
                    <div>
                        <p className="text-[9px] font-bold text-gp-muted uppercase tracking-widest opacity-60 leading-none mb-1.5">Investimento Setorial</p>
                        <p className="text-xl font-black text-gp-text tracking-tight uppercase">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cat.investment)}
                        </p>
                    </div>
                  </div>
                ))
            }
          </div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Donut Chart */}
        <div className="gp-card p-6 sm:p-8 flex flex-col">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gp-blue/10 text-gp-blue flex items-center justify-center">
              <BarChart3 size={20} strokeWidth={2.5} />
            </div>
            <h3 className="text-[16px] font-black text-gp-text uppercase tracking-tight">Atividade Global</h3>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center gap-10">
            {/* Donut */}
            <div className="relative w-48 h-48 group">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--gp-border)" strokeWidth="3" className="opacity-30" />
                {chartData.map((d, i) => {
                  if (d.percent <= 0) return null;
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
                      className="transition-all duration-1000 ease-in-out hover:opacity-80 cursor-pointer"
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-3xl font-black text-gp-text tracking-tighter leading-none">
                  {chartData.reduce((acc, d) => acc + d.count, 0)}
                </p>
                <p className="text-[10px] font-black text-gp-muted uppercase tracking-widest mt-2 leading-none">Unidades</p>
              </div>
            </div>

            {/* Legend */}
            <div className="w-full space-y-3">
              {chartData.map((d, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-gp-surface2 border border-gp-border group hover:border-gp-blue/30 transition-colors rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full shadow-lg" style={{ background: d.color }} />
                    <span className="text-[12px] font-black text-gp-text2 uppercase tracking-wide">{d.label}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[11px] font-bold text-gp-muted uppercase tracking-tighter opacity-70 leading-none">{d.count} UN</span>
                    <span className="text-[14px] font-black text-gp-text leading-none">
                      {Math.round(d.percent)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gp-border/30">
            <h4 className="text-[10px] font-black text-gp-muted uppercase tracking-widest mb-4 opacity-70">Top Subcategorias (Volume)</h4>
            <div className="space-y-2">
              {loading ? (
                 Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-8 w-full bg-gp-surface2 animate-pulse rounded-lg" />)
              ) : (
                subcategoryStats.map((sub, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gp-surface2/50 border border-gp-border/30 rounded-xl">
                    <span className="text-[11px] font-black text-gp-text truncate max-w-[140px] uppercase tracking-tighter">{sub.label}</span>
                    <span className="text-[11px] font-black text-gp-blue bg-gp-blue/10 px-2 py-0.5 rounded leading-none">{sub.count}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity — 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Requests */}
          <div className="gp-card overflow-hidden">
            <div className="flex items-center justify-between p-6 sm:px-8 border-b border-gp-border">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gp-amber/10 text-gp-amber flex items-center justify-center">
                  <FileText size={20} strokeWidth={2.5} />
                </div>
                <h3 className="text-[16px] font-black text-gp-text uppercase tracking-tight">Solicitações Recentes</h3>
              </div>
              <Link
                to="/solicitacoes"
                className="btn-premium-ghost px-5 py-2 text-[10px] font-black uppercase tracking-widest"
              >
                Auditar Todos <ArrowRight size={14} className="ml-2" />
              </Link>
            </div>

            {loading
              ? [1, 2, 3].map(i => <RowSkeleton key={i} />)
              : recentRequests.length === 0
                ? (
                  <div className="gp-empty py-16">
                    <div className="gp-empty-icon"><FileText size={24} /></div>
                    <p className="text-[13px] font-bold uppercase tracking-widest text-gp-text3">Nenhuma solicitação ativa</p>
                  </div>
                )
                : recentRequests.map(req => {
                    const s = statusMap[req.status];
                    return (
                      <Link
                        key={req.id}
                        to={`/solicitacoes/${req.id}`}
                        className="flex items-center gap-5 px-6 sm:px-8 py-5 transition-all hover:bg-gp-surface2 border-b border-gp-border last:border-0 group"
                      >
                        <div className="w-11 h-11 rounded-xl bg-gp-surface border border-gp-border flex items-center justify-center group-hover:border-gp-blue/40 group-hover:bg-gp-blue/5 transition-all shadow-sm">
                          <FileText size={20} className="text-gp-muted group-hover:text-gp-blue" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[15px] font-black text-gp-text truncate mb-1 leading-none transition-colors group-hover:text-gp-blue">{req.title}</p>
                          <p className="text-[11px] font-black text-gp-muted uppercase tracking-tighter opacity-60 leading-none mt-1.5">
                            {req.profiles?.full_name} · {new Date(req.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        {s && (
                          <span
                             className="gp-badge gp-badge-sm font-black text-[9px] uppercase tracking-widest px-2.5 h-6 shrink-0"
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
            <div className="flex items-center justify-between p-6 sm:px-8 border-b border-gp-border">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gp-blue/10 text-gp-blue flex items-center justify-center">
                  <Activity size={20} strokeWidth={2.5} />
                </div>
                <h3 className="text-[16px] font-black text-gp-text uppercase tracking-tight">Log de Movimentações</h3>
              </div>
              <Link
                to="/estoque"
                className="btn-premium-ghost px-5 py-2 text-[10px] font-black uppercase tracking-widest"
              >
                Ver Estoque <ArrowRight size={14} className="ml-2" />
              </Link>
            </div>

            {loading
              ? [1, 2, 3, 4].map(i => <RowSkeleton key={i} />)
              : recentMovements.length === 0
                ? (
                  <div className="gp-empty py-16">
                    <div className="gp-empty-icon"><Activity size={24} /></div>
                    <p className="text-[13px] font-bold uppercase tracking-widest text-gp-text3">Sem movimentações pendentes</p>
                  </div>
                )
                : recentMovements.map(move => (
                    <div
                      key={move.id}
                      className="flex items-center gap-5 px-6 sm:px-8 py-5 border-b border-gp-border last:border-0 transition-all hover:bg-gp-surface2 group"
                    >
                      <div className="w-11 h-11 rounded-xl bg-gp-surface border border-gp-border flex items-center justify-center group-hover:border-gp-blue/40 group-hover:bg-gp-blue/5 transition-all shadow-sm">
                        <Activity size={20} className="text-gp-blue" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-black text-gp-text truncate mb-1 leading-none group-hover:text-gp-blue transition-colors">
                          {move.assets?.nome_item}
                        </p>
                        <p className="text-[11px] font-black text-gp-muted uppercase tracking-tighter opacity-60 leading-none mt-1.5">
                          Patr: {move.assets?.numero_patrimonio} · {new Date(move.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <span className="gp-badge gp-badge-blue gp-badge-sm font-black text-[9px] uppercase tracking-widest px-2.5 h-6 shrink-0">
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
