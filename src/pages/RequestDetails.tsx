import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useProfile } from '../hooks/useProfile';
import { 
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText, 
  Tag, 
  Calendar, 
  ExternalLink, 
  ShieldCheck 
} from 'lucide-react';

interface Request {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  estimated_cost: number;
  priority: string;
  status: string;
  current_step: string;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
  };
}

const statusMap: Record<string, { label: string; color: string }> = {
  pending_gestor: { label: 'Aguardando Gestor', color: 'bg-amber-100 text-amber-700' },
  pending_ti: { label: 'Em Análise TI', color: 'bg-blue-100 text-blue-700' },
  pending_compras: { label: 'Em Compras', color: 'bg-indigo-100 text-indigo-700' },
  pending_diretoria: { label: 'Aguardando Diretoria', color: 'bg-purple-100 text-purple-700' },
  approved: { label: 'Aprovado Final', color: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Recusado', color: 'bg-rose-100 text-rose-700' },
  adjustment_needed: { label: 'Ajuste Necessário', color: 'bg-orange-100 text-orange-700' },
};

export default function RequestDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [request, setRequest] = useState<Request | null>(null);
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const fetchRequest = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('requests')
      .select('*, profiles(full_name, email)')
      .eq('id', id)
      .single();

    if (!error && data) {
      setRequest(data);
      const { data: linksData } = await supabase
        .from('request_links')
        .select('*')
        .eq('request_id', id);
      setLinks(linksData || []);
    }
    setLoading(false);
  };

  const handleAction = async (nextStatus: string, nextStep: string) => {
    if (!request || !profile) return;
    setActionLoading(true);
    
    const { error } = await supabase
      .from('requests')
      .update({ 
        status: nextStatus,
        current_step: nextStep
      })
      .eq('id', request.id);

    if (!error) {
      fetchRequest();
    }
    setActionLoading(false);
  };

  if (loading) return <div className="p-8 text-center animate-pulse">Carregando detalhes...</div>;
  if (!request) return <div className="p-8 text-center">Solicitação não encontrada.</div>;

  const currentStatus = statusMap[request.status] || { label: request.status, color: 'bg-slate-100' };
  const isApprover = profile?.role === request.current_step || profile?.role === 'master_admin';
  const isFinalized = request.status === 'approved' || request.status === 'rejected';

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft size={20} />
        Voltar para a lista
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-4 ${currentStatus.color}`}>
                  {currentStatus.label}
                </div>
                <h1 className="text-3xl font-bold">{request.title}</h1>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-y border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <p className="text-xs text-slate-500 uppercase font-bold">Solicitante</p>
                <p className="font-medium text-sm">{request.profiles?.full_name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-500 uppercase font-bold">Categoria</p>
                <p className="font-medium text-sm flex items-center gap-1">
                  <Tag size={14} className="text-primary-500" />
                  {request.category}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-500 uppercase font-bold">Data</p>
                <p className="font-medium text-sm flex items-center gap-1">
                  <Calendar size={14} />
                  {new Date(request.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-500 uppercase font-bold">Custo Estimado</p>
                <p className="font-bold text-sm text-primary-600">
                  R$ {Number(request.estimated_cost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <div className="py-8 space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <FileText size={20} className="text-slate-400" />
                Justificativa
              </h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
                {request.description}
              </p>
            </div>

            {links.length > 0 && (
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <h3 className="text-sm font-bold flex items-center gap-2 text-slate-500">
                  <ExternalLink size={16} />
                  Links e Referências
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {links.map((link, i) => (
                    <a 
                      key={i} 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-slate-100 transition-colors group"
                    >
                      <span className="text-sm font-medium">{link.label}</span>
                      <ExternalLink size={14} className="text-slate-400 group-hover:text-primary-500" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-6">
          {isApprover && !isFinalized && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md border-2 border-primary-100 dark:border-primary-900 p-6 space-y-4">
              <div className="flex items-center gap-2 text-primary-600 mb-2">
                <ShieldCheck size={20} />
                <h3 className="font-bold">Ações de Aprovação</h3>
              </div>
              <p className="text-sm text-slate-500">
                Como <strong>{profile?.role}</strong>, você precisa validar esta solicitação.
              </p>
              
              <div className="space-y-2 pt-2">
                <button
                  disabled={actionLoading}
                  onClick={() => {
                    let nextStatus = '';
                    let nextStep = '';
                    if (request.status === 'pending_gestor') { nextStatus = 'pending_ti'; nextStep = 'ti'; }
                    else if (request.status === 'pending_ti') { nextStatus = 'pending_compras'; nextStep = 'compras'; }
                    else if (request.status === 'pending_compras') { nextStatus = 'pending_diretoria'; nextStep = 'diretoria'; }
                    else if (request.status === 'pending_diretoria') { nextStatus = 'approved'; nextStep = 'diretoria'; }
                    
                    handleAction(nextStatus, nextStep);
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle2 size={20} />
                  Aprovar Etapa
                </button>
                
                <button
                  disabled={actionLoading}
                  onClick={() => handleAction('rejected', request.current_step)}
                  className="w-full bg-white hover:bg-rose-50 text-rose-600 border-2 border-rose-100 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <XCircle size={20} />
                  Reprovar
                </button>

                <button
                  disabled={actionLoading}
                  onClick={() => handleAction('adjustment_needed', 'usuario')}
                  className="w-full text-slate-500 hover:text-orange-600 text-sm font-medium py-2 transition-all flex items-center justify-center gap-2"
                >
                  <AlertCircle size={16} />
                  Solicitar Ajustes
                </button>
              </div>
            </div>
          )}

          <div className="bg-slate-100 dark:bg-slate-800/50 rounded-2xl p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Clock size={18} />
              Status do Fluxo
            </h3>
            <div className="space-y-4">
              {[
                { step: 'gestor', label: '1. Gestor Imediato' },
                { step: 'ti', label: '2. Avaliação de TI' },
                { step: 'compras', label: '3. Cotação Compras' },
                { step: 'diretoria', label: '4. Diretoria' },
              ].map((s, idx) => {
                const isActive = request.current_step === s.step;
                const isPast = ['pending_ti', 'pending_compras', 'pending_diretoria', 'approved'].indexOf(request.status) > idx;
                
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isPast ? 'bg-emerald-500 text-white' : isActive ? 'bg-primary-500 text-white animate-pulse' : 'bg-slate-300 text-slate-500'
                    }`}>
                      {isPast ? <CheckCircle2 size={14} /> : idx + 1}
                    </div>
                    <span className={`text-sm font-medium ${isActive ? 'text-primary-600' : 'text-slate-500'}`}>
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
