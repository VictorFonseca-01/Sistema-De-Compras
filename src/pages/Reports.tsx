import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  TrendingUp, 
  Printer, 
  ChevronLeft,
  Calendar,
  Building2,
  Package
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
        <div className="w-12 h-12 border-4 border-primary-600/30 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20 print:p-0">
      {/* Header — Oculto na Impressão */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 print:hidden">
        <div>
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 font-bold hover:text-primary-600 transition-colors mb-2">
            <ChevronLeft size={20} /> Voltar ao Dashboard
          </button>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
             Relatório <span className="text-primary-600">Executivo</span>
          </h1>
          <p className="text-slate-500 text-lg font-medium">Panorama consolidado de hardware e despesas.</p>
        </div>
        <div className="flex gap-3">
           <button onClick={handlePrint} className="btn-premium-primary px-8 py-4 rounded-2xl shadow-xl shadow-primary-600/20">
             <Printer size={22} strokeWidth={3} /> IMPRIMIR / PDF
           </button>
        </div>
      </header>

      {/* Report Canvas — Layout Otimizado para Impressão */}
      <div className="bg-white dark:bg-slate-900 p-12 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-sm print:shadow-none print:border-none print:p-0">
        
        {/* Report Brand Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-100 dark:border-slate-800 pb-10 mb-12">
           <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-lg">G</div>
              <div>
                 <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-none">GLOBAL PIMENTEL</h2>
                 <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Inventory Management System • Executive Report</p>
              </div>
           </div>
           <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">DATA DE EMISSÃO</p>
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black text-lg">
                 <Calendar size={18} /> {new Date().toLocaleDateString('pt-BR')}
              </div>
           </div>
        </div>

        {/* Section 1: Desempenho Patrimonial */}
        <div className="space-y-8 mb-16">
           <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              <Package className="text-primary-600" /> RESUMO PATRIMONIAL
           </h3>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total de Ativos</p>
                 <p className="text-4xl font-black text-slate-900 dark:text-white">{reportData.assetKPIs.total}</p>
                 <span className="text-[10px] font-bold text-emerald-500 uppercase">Hardware Detectado</span>
              </div>
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Valor Estimado</p>
                 <p className="text-3xl font-black text-slate-900 dark:text-white leading-none mb-1">
                   R$ {reportData.assetKPIs.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                 </p>
                 <span className="text-[10px] font-bold text-blue-500 uppercase">Investimento Total</span>
              </div>
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ativos em Uso</p>
                 <p className="text-4xl font-black text-primary-600">{reportData.assetKPIs.inUse}</p>
                 <span className="text-[10px] font-bold text-slate-400 uppercase">{( (reportData.assetKPIs.inUse / reportData.assetKPIs.total) * 100 ).toFixed(1)}% Taxa de Ocupação</span>
              </div>
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Em Manutenção</p>
                 <p className="text-4xl font-black text-rose-500">{reportData.assetKPIs.maintenance}</p>
                 <span className="text-[10px] font-bold text-rose-400 uppercase">Necessário Reparo</span>
              </div>
           </div>
        </div>

        {/* Section 2: Solicitações e Fluxo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
           <div className="space-y-6">
              <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                 <TrendingUp className="text-amber-500" /> FLUXO DE COMPRAS
              </h3>
              <div className="space-y-4">
                 {[
                   { label: 'Aprovados Final', value: reportData.requestKPIs.approved, color: 'emerald' },
                   { label: 'Pendentes em Fluxo', value: reportData.requestKPIs.pending, color: 'amber' },
                   { label: 'Recusados', value: reportData.requestKPIs.rejected, color: 'rose' },
                 ].map((item, i) => (
                   <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                      <span className="font-bold text-slate-700 dark:text-slate-300">{item.label}</span>
                      <div className="flex items-center gap-3">
                         <div className="w-32 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className={clsx("h-full rounded-full", i===0 ? 'bg-emerald-500' : i===1 ? 'bg-amber-500' : 'bg-rose-500')} 
                              style={{ width: `${(item.value / reportData.requestKPIs.total) * 100}%` }}
                            ></div>
                         </div>
                         <span className="font-black text-slate-900 dark:text-white w-8">{item.value}</span>
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           <div className="space-y-6">
              <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                 <Building2 className="text-blue-500" /> DISTRIBUIÇÃO POR SETOR
              </h3>
              <div className="flex flex-wrap gap-3">
                 {Object.entries(reportData.departments).map(([dept, count]: any) => (
                   <div key={dept} className="px-5 py-3 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{dept}</span>
                      <span className="text-xl font-black text-slate-900 dark:text-white">{count} Ativos</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Footer Audit Information */}
        <div className="mt-20 pt-10 border-t border-slate-100 dark:border-slate-800 text-center">
           <p className="text-slate-400 text-xs font-medium max-w-2xl mx-auto italic">
             Este documento é um relatório gerado automaticamente pelo Sistema de Inventário Global Pimentel. Todas as informações são baseadas nos registros ativos do banco de dados em tempo real.
           </p>
           <div className="mt-8 flex justify-center gap-20">
              <div className="flex flex-col items-center">
                 <div className="w-48 border-b border-slate-300 dark:border-slate-700 mb-2"></div>
                 <span className="text-[10px] font-black text-slate-400 uppercase">Assinatura Responsável TI</span>
              </div>
              <div className="flex flex-col items-center">
                 <div className="w-48 border-b border-slate-300 dark:border-slate-700 mb-2"></div>
                 <span className="text-[10px] font-black text-slate-400 uppercase">Assinatura Diretoria</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
