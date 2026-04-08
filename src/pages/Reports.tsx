import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Printer, 
  ChevronLeft,
  Calendar,
  Building2,
  Package,
  FileText,
  ShieldCheck,
  Zap,
  BarChart3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { clsx } from 'clsx';

export default function Reports() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);
  const { theme } = useTheme();

  useEffect(() => {
    fetchReportData();
  }, []);

  async function fetchReportData() {
    setLoading(true);
    
    // 1. Assets KPIs
    const { data: assets } = await supabase.from('assets').select('*');
    const assetKPIs = {
      total: assets?.length || 0,
      value: assets?.reduce((acc, a) => acc + (Number(a.valor) || 0), 0) || 0,
      inUse: assets?.filter(a => a.status === 'em_uso').length || 0,
      stock: assets?.filter(a => a.status === 'em_estoque').length || 0,
      maintenance: assets?.filter(a => a.status === 'manutencao').length || 0,
    };

    // 2. Requests KPIs & Category Aggregation
    const { data: requests } = await supabase.from('requests').select('*');
    const requestKPIs = {
      total: requests?.length || 0,
      approved: requests?.filter(r => r.status === 'COMPLETED').length || 0,
      pending: requests?.filter(r => r.status.startsWith('PENDING')).length || 0,
      rejected: requests?.filter(r => r.status === 'REJECTED').length || 0,
    };

    // Calculate Category Breakdown
    const categoryAgg: Record<string, { count: number; investment: number }> = {};
    requests?.forEach(r => {
      const cat = r.category || 'Outros';
      const cost = Number(r.estimated_cost) || 0;
      if (!categoryAgg[cat]) categoryAgg[cat] = { count: 0, investment: 0 };
      categoryAgg[cat].count++;
      categoryAgg[cat].investment += cost;
    });

    // 3. Departments distribution
    const departments = assets?.reduce((acc: any, a) => {
      const dept = a.departamento || 'OPERACIONAL';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {});

    setReportData({ assetKPIs, requestKPIs, departments, categoryAgg });
    setLoading(false);
  }

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-6">
        <div className="w-12 h-12 border-4 border-gp-blue/10 border-t-gp-blue rounded-full animate-spin" />
        <p className="text-[11px] font-black text-gp-muted uppercase tracking-[0.3em] animate-pulse">Compilando Relatório Global...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-up pb-20 px-4 sm:px-0 print:p-0 print:space-y-0">
      {/* Header — Oculto na Impressão */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 print:hidden">
        <div>
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-gp-muted font-black hover:text-gp-blue transition-colors mb-4 text-[10px] uppercase tracking-[0.2em]"
          >
            <ChevronLeft size={14} strokeWidth={3} /> Dashboard Operacional
          </button>
          <h1 className="gp-page-title text-3xl flex items-center gap-4">
             <FileText className="text-gp-blue" size={32} strokeWidth={2.5} />
             Relatório de Compras
          </h1>
          <p className="gp-page-subtitle">Panorama consolidado de fluxos, aquisições e ativos da rede Global Parts.</p>
        </div>
        <button 
          onClick={handlePrint} 
          className="btn-premium-primary px-10 py-4 rounded-xl shadow-2xl shadow-gp-blue/20 font-black uppercase text-[11px] tracking-widest whitespace-nowrap"
        >
          <Printer size={18} strokeWidth={3} className="mr-3" /> GERAR PDF / IMPRIMIR
        </button>
      </header>

      {/* Report Canvas */}
      <div className="gp-card p-8 sm:p-16 print:shadow-none print:border-none print:p-0 bg-gp-surface relative overflow-hidden">
        
        {/* Marca d'água de fundo */}
        <BarChart3 className="absolute -right-20 -top-20 text-gp-blue opacity-[0.02] -rotate-12 pointer-events-none print:hidden" size={400} />

        {/* Report Brand Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gp-border pb-12 mb-16 relative z-10">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-gp-surface2 border border-gp-border rounded-[2rem] flex items-center justify-center p-5 shadow-inner">
                <img 
                  src="/logo-preta.png" 
                  alt="Global Parts" 
                  className="w-12 h-12 object-contain hidden print:block" 
                />
                <img 
                  src={theme === 'light' ? '/logo-preta.png' : '/logo-branca.png'} 
                  alt="Global Parts" 
                  className="w-12 h-12 object-contain print:hidden" 
                />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-gp-text leading-none tracking-tight">GLOBAL PARTS</h2>
                <p className="text-gp-blue-light font-black uppercase tracking-[0.25em] text-[10px] opacity-80 leading-none">Intelligence • Inventory Management</p>
                <div className="flex items-center gap-2 pt-2">
                   <ShieldCheck size={12} className="text-gp-success" />
                   <span className="text-[9px] font-black text-gp-muted uppercase tracking-widest">Documento Auditado e Criptografado</span>
                </div>
              </div>
            </div>
           <div className="text-right mt-8 sm:mt-0">
              <p className="text-[10px] font-black text-gp-muted uppercase tracking-[0.3em] mb-3 flex items-center justify-end gap-2 leading-none">
                <Calendar size={12} strokeWidth={3} /> EMISSÃO DO PROTOCOLO
              </p>
              <div className="text-gp-text font-black text-xl tracking-tight leading-none">
                 {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()}
              </div>
           </div>
        </div>

        {/* Section 1: RESUMO PATRIMONIAL */}
        <div className="space-y-8 mb-20 relative z-10">
           <h3 className="text-[11px] font-black text-gp-text uppercase tracking-[0.3em] flex items-center gap-4 bg-gp-surface2 w-fit px-5 py-2.5 rounded-xl border border-gp-border shadow-sm">
              <Package className="text-gp-blue" size={16} strokeWidth={3} /> KPI — ATIVOS E HARDWARE
           </h3>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <ReportMetricCard label="Inventário Total" value={reportData.assetKPIs.total} badge="Itens em Base" />
              <ReportMetricCard label="Capex Acumulado" value={`R$ ${reportData.assetKPIs.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} badge="Investimento" />
              <ReportMetricCard 
                label="Ativos Operacionais" 
                value={reportData.assetKPIs.inUse} 
                badge={`${((reportData.assetKPIs.inUse / reportData.assetKPIs.total) * 100 || 0).toFixed(1)}% de Uso`} 
                highlight="blue" 
              />
              <ReportMetricCard label="Em Manutenção" value={reportData.assetKPIs.maintenance} badge="Indisponíveis" highlight="red" />
           </div>
        </div>

        {/* Section 2: Solicitações e Fluxo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-20 relative z-10">
           <div className="space-y-8">
              <h3 className="text-[11px] font-black text-gp-text uppercase tracking-[0.3em] flex items-center gap-4 bg-gp-surface2 w-fit px-5 py-2.5 rounded-xl border border-gp-border shadow-sm">
                 <Zap className="text-gp-amber" size={16} strokeWidth={3} /> FLUXO DE AQUISIÇÕES
              </h3>
              <div className="space-y-5">
                 {[
                   { label: 'SOLICITAÇÕES APROVADAS', value: reportData.requestKPIs.approved, colorClass: 'bg-gp-success' },
                   { label: 'AGUARDANDO PROCESSO', value: reportData.requestKPIs.pending, colorClass: 'bg-gp-amber' },
                   { label: 'PROPOSTAS REJEITADAS', value: reportData.requestKPIs.rejected, colorClass: 'bg-gp-error' },
                 ].map((item, i) => (
                   <div key={i} className="flex flex-col gap-3 group">
                      <div className="flex justify-between items-end">
                         <span className="text-[10px] font-black text-gp-muted uppercase tracking-widest group-hover:text-gp-text transition-colors">{item.label}</span>
                         <span className="font-black text-gp-text text-lg leading-none">{item.value}</span>
                      </div>
                      <div className="h-2.5 bg-gp-surface2 rounded-full overflow-hidden border border-gp-border shadow-inner">
                         <div 
                           className={clsx("h-full rounded-full transition-all duration-1000 ease-out shadow-lg", item.colorClass)} 
                           style={{ width: `${(item.value / reportData.requestKPIs.total * 100) || 0}%` }}
                         />
                      </div>
                   </div>
                 ))}
                 <div className="p-5 bg-gp-blue/[0.02] border border-gp-blue/10 rounded-2xl mt-4">
                    <p className="text-[11px] text-gp-muted font-medium italic opacity-60">Total de {reportData.requestKPIs.total} pedidos protocolados no exercício fiscal atual.</p>
                 </div>
              </div>
           </div>

           <div className="space-y-8">
              <h3 className="text-[11px] font-black text-gp-text uppercase tracking-[0.3em] flex items-center gap-4 bg-gp-surface2 w-fit px-5 py-2.5 rounded-xl border border-gp-border shadow-sm">
                 <Building2 className="text-gp-blue" size={16} strokeWidth={3} /> DENSIDADE POR SETOR
              </h3>
              <div className="grid grid-cols-2 gap-4">
                 {Object.entries(reportData.departments).map(([dept, count]: any) => (
                   <div key={dept} className="p-5 bg-gp-surface2 border border-gp-border rounded-xl flex flex-col items-center justify-center text-center shadow-inner group hover:bg-gp-surface transition-all">
                      <span className="text-[9px] font-black text-gp-muted uppercase tracking-[0.2em] mb-2 truncate w-full group-hover:text-gp-blue transition-colors">{dept}</span>
                      <span className="text-2xl font-black text-gp-text tracking-tight leading-none">{count}</span>
                      <span className="text-[9px] font-black text-gp-muted uppercase mt-2 opacity-40">Unidades Hardware</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Section 3: Investimento Setorial (NOVA) */}
        <div className="space-y-8 mb-20 relative z-10">
           <h3 className="text-[11px] font-black text-gp-text uppercase tracking-[0.3em] flex items-center gap-4 bg-gp-surface2 w-fit px-5 py-2.5 rounded-xl border border-gp-border shadow-sm">
              <BarChart3 className="text-gp-blue" size={16} strokeWidth={3} /> ANÁLISE DE INVESTIMENTO SETORIAL
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(reportData.categoryAgg as Record<string, any>).sort((a,b) => b[1].investment - a[1].investment).slice(0, 6).map(([cat, data], i) => (
                <div key={i} className="p-6 bg-gp-surface2 border border-gp-border rounded-2xl shadow-inner group">
                   <div className="flex justify-between items-start mb-4">
                      <p className="text-[10px] font-black text-gp-muted uppercase tracking-widest truncate max-w-[140px]">{cat}</p>
                      <span className="text-[9px] font-black text-gp-blue bg-gp-blue/10 px-2 py-0.5 rounded">{data.count} SOLIC.</span>
                   </div>
                   <p className="text-xl font-black text-gp-text tracking-tight">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.investment)}
                   </p>
                   <div className="mt-4 h-1.5 bg-gp-surface rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gp-blue rounded-full opacity-60" 
                        style={{ width: `${Math.min(100, (data.investment / (reportData.assetKPIs.value || 1)) * 100)}%` }}
                      />
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* Footer Audit Information */}
        <div className="mt-24 pt-12 border-t border-gp-border relative z-10">
           <div className="max-w-2xl mx-auto text-center space-y-6">
              <p className="text-gp-muted text-[11px] font-black uppercase tracking-[0.2em] leading-relaxed opacity-40">
                Documento de validade estritamente corporativa • Não divulgar externamente • Sistema Auditado
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-16 pt-12">
                 <div className="flex flex-col items-center gap-4">
                    <div className="w-64 h-px bg-gp-border" />
                    <span className="text-[10px] font-black text-gp-muted uppercase tracking-[0.25em]">Responsabilidade Técnica IT</span>
                 </div>
                 <div className="flex flex-col items-center gap-4">
                    <div className="w-64 h-px bg-gp-border" />
                    <span className="text-[10px] font-black text-gp-muted uppercase tracking-[0.25em]">Compliance / Diretoria</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function ReportMetricCard({ label, value, badge, highlight = 'gray' }: { label: string; value: string | number; badge: string; highlight?: 'gray' | 'blue' | 'red' }) {
  return (
    <div className="p-8 bg-gp-surface2 rounded-[1.5rem] border border-gp-border shadow-inner group hover:border-gp-blue/20 transition-all">
       <p className="text-[9px] font-black text-gp-muted uppercase tracking-[0.25em] mb-4 opacity-70 group-hover:text-gp-blue transition-colors leading-none">{label}</p>
       <p className={clsx(
         "text-3xl font-black tracking-tighter leading-none mb-6 truncate",
         highlight === 'red' ? 'text-gp-error' : highlight === 'blue' ? 'text-gp-blue-light' : 'text-gp-text'
       )}>{value}</p>
       <span className={clsx(
         "gp-badge gp-badge-sm font-black tracking-widest",
         highlight === 'red' ? 'gp-badge-red' : highlight === 'blue' ? 'gp-badge-blue' : 'gp-badge-gray'
       )}>
         {badge.toUpperCase()}
       </span>
    </div>
  );
}

