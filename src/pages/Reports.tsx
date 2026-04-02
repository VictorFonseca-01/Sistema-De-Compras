import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  TrendingUp, 
  Printer, 
  ChevronLeft,
  Calendar,
  Building2,
  Package,
  FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';

export default function Reports() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);

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

    // 2. Requests KPIs
    const { data: requests } = await supabase.from('requests').select('*');
    const requestKPIs = {
      total: requests?.length || 0,
      approved: requests?.filter(r => r.status === 'approved').length || 0,
      pending: requests?.filter(r => r.status.startsWith('pending')).length || 0,
      rejected: requests?.filter(r => r.status === 'rejected').length || 0,
    };

    // 3. Departments distribution
    const departments = assets?.reduce((acc: any, a) => {
      const dept = a.departamento || 'Não Informado';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {});

    setReportData({ assetKPIs, requestKPIs, departments });
    setLoading(false);
  }

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-3 border-gp-border2 border-t-gp-blue rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-up pb-16 print:space-y-0 print:pb-0">
      {/* Header — Oculto na Impressão */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 print:hidden">
        <div>
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-gp-text3 font-bold hover:text-gp-blue transition-colors mb-2 text-[12px] uppercase tracking-wider"
          >
            <ChevronLeft size={16} /> Voltar ao Dashboard
          </button>
          <h1 className="gp-page-title flex items-center gap-3">
             <FileText className="text-gp-blue" size={24} />
             Relatório Executivo
          </h1>
          <p className="gp-page-subtitle">Panorama consolidado de hardware e despesas corporativas.</p>
        </div>
        <button 
          onClick={handlePrint} 
          className="btn-premium-primary px-6 py-3 rounded-xl"
        >
          <Printer size={18} strokeWidth={2} /> IMPRIMIR / PDF
        </button>
      </header>

      {/* Report Canvas */}
      <div className="gp-card p-10 sm:p-12 print:shadow-none print:border-none print:p-0">
        
        {/* Report Brand Header */}
        <div className="flex justify-between items-start border-b border-gp-border pb-10 mb-10">
           <div className="flex items-center gap-5">
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-2xl font-bold"
                style={{ background: 'linear-gradient(135deg, var(--gp-blue) 0%, var(--gp-blue-dim) 100%)' }}
              >G</div>
              <div>
                 <h2 className="text-xl font-bold text-gp-text leading-none tracking-tight">GLOBAL PARTNER</h2>
                 <p className="text-gp-text3 font-bold uppercase tracking-widest text-[9px] mt-1.5">Inventory Management System • Executive Report</p>
              </div>
           </div>
           <div className="text-right">
              <p className="text-[10px] font-bold text-gp-text3 uppercase tracking-widest mb-1.5 flex items-center justify-end gap-1.5">
                <Calendar size={12} /> DATA DE EMISSÃO
              </p>
              <div className="text-gp-text font-bold text-lg">
                 {new Date().toLocaleDateString('pt-BR')}
              </div>
           </div>
        </div>

        {/* Section 1: RESUMO PATRIMONIAL */}
        <div className="space-y-6 mb-12">
           <h3 className="text-sm font-bold text-gp-text uppercase tracking-widest flex items-center gap-3 opacity-80">
              <Package className="text-gp-blue" size={18} /> RESUMO PATRIMONIAL
           </h3>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 bg-gp-surface2 rounded-xl border border-gp-border">
                 <p className="text-[10px] font-bold text-gp-text3 uppercase tracking-widest mb-2">Total de Ativos</p>
                 <p className="text-3xl font-bold text-gp-text">{reportData.assetKPIs.total}</p>
                 <span className="gp-badge gp-badge-gray mt-3">Hardware Registrado</span>
              </div>
              <div className="p-5 bg-gp-surface2 rounded-xl border border-gp-border">
                 <p className="text-[10px] font-bold text-gp-text3 uppercase tracking-widest mb-2">Valor Estimado</p>
                 <p className="text-2xl font-bold text-gp-text truncate">
                   R$ {reportData.assetKPIs.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                 </p>
                 <span className="gp-badge gp-badge-blue mt-3">Investimento Total</span>
              </div>
              <div className="p-5 bg-gp-surface2 rounded-xl border border-gp-border">
                 <p className="text-[10px] font-bold text-gp-text3 uppercase tracking-widest mb-2">Em Uso</p>
                 <p className="text-3xl font-bold text-gp-blue">{reportData.assetKPIs.inUse}</p>
                 <span className="gp-badge gp-badge-green mt-3">
                   {((reportData.assetKPIs.inUse / reportData.assetKPIs.total) * 100 || 0).toFixed(1)}% Taxa
                 </span>
              </div>
              <div className="p-5 bg-gp-surface2 rounded-xl border border-gp-border">
                 <p className="text-[10px] font-bold text-gp-text3 uppercase tracking-widest mb-2">Manutenção</p>
                 <p className="text-3xl font-bold text-gp-error">{reportData.assetKPIs.maintenance}</p>
                 <span className="gp-badge gp-badge-red mt-3">Crítico</span>
              </div>
           </div>
        </div>

        {/* Section 2: Solicitações e Fluxo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
           <div className="space-y-6">
              <h3 className="text-sm font-bold text-gp-text uppercase tracking-widest flex items-center gap-3 opacity-80">
                 <TrendingUp className="text-gp-warning" size={18} /> FLUXO DE COMPRAS
              </h3>
              <div className="space-y-3">
                 {[
                   { label: 'Aprovados Final', value: reportData.requestKPIs.approved, colorClass: 'bg-gp-success' },
                   { label: 'Pendentes em Fluxo', value: reportData.requestKPIs.pending, colorClass: 'bg-gp-warning' },
                   { label: 'Recusados', value: reportData.requestKPIs.rejected, colorClass: 'bg-gp-error' },
                 ].map((item, i) => (
                   <div key={i} className="flex items-center justify-between p-4 bg-gp-surface2 rounded-xl border border-gp-border">
                      <span className="text-[13px] font-medium text-gp-text2">{item.label}</span>
                      <div className="flex items-center gap-4">
                         <div className="w-24 sm:w-32 h-2 bg-gp-border rounded-full overflow-hidden">
                            <div 
                              className={clsx("h-full rounded-full", item.colorClass)} 
                              style={{ width: `${(item.value / reportData.requestKPIs.total * 100) || 0}%` }}
                            />
                         </div>
                         <span className="font-bold text-gp-text w-6 text-right">{item.value}</span>
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           <div className="space-y-6">
              <h3 className="text-sm font-bold text-gp-text uppercase tracking-widest flex items-center gap-3 opacity-80">
                 <Building2 className="text-gp-blue" size={18} /> DISTRIBUIÇÃO POR SETOR
              </h3>
              <div className="flex flex-wrap gap-2.5">
                 {Object.entries(reportData.departments).map(([dept, count]: any) => (
                   <div key={dept} className="px-4 py-3 bg-gp-surface2 border border-gp-border rounded-xl flex flex-col items-center min-w-[100px]">
                      <span className="text-[9px] font-bold text-gp-text3 uppercase tracking-wider">{dept}</span>
                      <span className="text-base font-bold text-gp-text mt-0.5">{count} Ativos</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Footer Audit Information */}
        <div className="mt-16 pt-10 border-t border-gp-border">
           <p className="text-gp-text3 text-[11px] font-medium max-w-2xl mx-auto text-center leading-relaxed opacity-60">
             Documento gerado automaticamente pelo Sistema de Inventário Global Partner. 
             Informações baseadas nos registros ativos em tempo real do banco de dados corporativo.
           </p>
           <div className="mt-12 flex flex-col sm:flex-row justify-center gap-10 sm:gap-24">
              <div className="flex flex-col items-center">
                 <div className="w-44 border-b border-gp-border mb-3" />
                 <span className="text-[9px] font-bold text-gp-text3 uppercase tracking-widest">Responsável TI</span>
              </div>
              <div className="flex flex-col items-center">
                 <div className="w-44 border-b border-gp-border mb-3" />
                 <span className="text-[9px] font-bold text-gp-text3 uppercase tracking-widest">Assinatura Diretoria</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
