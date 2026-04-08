import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useProfile } from '../hooks/useProfile';
import { 
  Clock, 
  CheckCircle2, 
  XCircle,
  AlertCircle,
  FileText, 
  Tag, 
  Calendar, 
  ShieldCheck,
  User,
  Hash,
  ChevronRight,
  Activity,
  Trash2,
  Download,
  Image as ImageIcon,
  Building2,
  Gavel,
  Link as LinkIcon,
  Play,
  Plus,
  BadgeDollarSign
} from 'lucide-react';
import { clsx } from 'clsx';
import { toast } from 'react-hot-toast';

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
  ti_estimated_cost?: number;
  ti_technical_opinion?: string;
  ti_reference_link?: string;
  ti_reference_site?: string;
  tracking_code?: string;
  delivery_prediction?: string;
  invoice_number?: string;
  company_id: string;
  department_id: string;
  profiles: {
    full_name: string;
    email: string;
    department: string;
  };
}

interface Attachment {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  is_technical?: boolean;
  is_quote?: boolean;
  created_at: string;
}

interface RequestHistory {
  id: string;
  old_status?: string;
  new_status: string;
  comment: string;
  created_at: string;
  profiles: {
    full_name: string;
  };
}

interface Quote {
  id: string;
  supplier_name: string;
  price: number;
  description: string;
  purchase_link?: string;
  supplier_site?: string;
  observations?: string;
  quoted_value?: number;
  is_selected: boolean;
  justification: string;
  quote_date: string;
  created_at: string;
}

const statusMap: Record<string, { label: string; badge: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }> }> = {
  PENDING_GESTOR:        { label: 'Aguardando Gestor',    badge: 'gp-badge-amber',  icon: Clock },
  PENDING_TI:            { label: 'Análise Técnica (TI)',   badge: 'gp-badge-blue',   icon: FileText },
  PENDING_COMPRAS:       { label: 'Em Cotação',           badge: 'gp-badge-purple', icon: Clock },
  PENDING_DIRETORIA:     { label: 'Aguardando Diretoria', badge: 'gp-badge-purple', icon: Clock },
  PENDING_COMPRAS_FINAL: { label: 'Finalização de Compra', badge: 'gp-badge-blue',   icon: ShieldCheck },
  COMPLETED:             { label: 'Solicitação Concluída',  badge: 'gp-badge-success', icon: CheckCircle2 },
  REJECTED:              { label: 'Solicitação Recusada',   badge: 'gp-badge-red',    icon: XCircle },
  ADJUSTMENT_NEEDED:     { label: 'Ajuste Necessário',    badge: 'gp-badge-amber',  icon: AlertCircle },
};

export default function RequestDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useProfile();
  const statusLabels: Record<string, string> = {
    PENDING_GESTOR: 'Validação Gestor',
    PENDING_TI: 'Análise Técnica (TI)',
    PENDING_COMPRAS: 'Mapa de Cotação',
    PENDING_DIRETORIA: 'Aprovação Diretoria',
    PENDING_COMPRAS_FINAL: 'Processamento de Compra',
    COMPLETED: 'Solicitação Concluída',
    REJECTED: 'Solicitação Recusada',
    ADJUSTMENT_NEEDED: 'Ajuste Necessário',
  };

  const [request, setRequest] = useState<Request | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [history, setHistory] = useState<RequestHistory[]>([]);
  const [comment, setComment] = useState('');
  
  const [quotes, setQuotes] = useState<any[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  const [newQuote, setNewQuote] = useState({ 
    supplier_name: '', 
    price: '', 
    description: '',
    purchase_link: '',
    supplier_site: '',
    observations: '',
    quoted_value: ''
  });
  const [showQuoteForm, setShowQuoteForm] = useState(false);

  // TI Specialized Fields State
  const [tiForm, setTiForm] = useState({
    ti_technical_opinion: '',
    ti_estimated_cost: '',
    ti_reference_link: '',
    ti_reference_site: ''
  });

  const fetchRequest = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('requests')
      .select('*, profiles(full_name, email, department, company_id, department_id)')
      .eq('id', id)
      .single();

    if (error || !data) {
      if (id) {
          console.error("Erro ao buscar pedido:", error);
          navigate('/solicitacoes');
      }
      return;
    }

    setRequest(data);
    setTiForm({
      ti_technical_opinion: data.ti_technical_opinion || '',
      ti_estimated_cost: data.ti_estimated_cost?.toString() || '',
      ti_reference_link: data.ti_reference_link || '',
      ti_reference_site: data.ti_reference_site || ''
    });
    setLoading(false);

    // Parallel fetch for associated data
    Promise.all([
      supabase.from('request_attachments').select('*').eq('request_id', id),
      supabase.from('request_status_history').select('*, profiles(full_name)').eq('request_id', id).order('created_at', { ascending: false }),
      supabase.from('request_quotes').select('*').eq('request_id', id).order('price', { ascending: true }),
      supabase.from('request_links').select('*').eq('request_id', id)
    ]).then(([attachRes, historyRes, quoteRes, linkRes]) => {
      if (attachRes.data) setAttachments(attachRes.data);
      if (historyRes.data) setHistory(historyRes.data);
      if (quoteRes.data) setQuotes(quoteRes.data);
      if (linkRes.data) setLinks(linkRes.data || []);
    });
  };

  useEffect(() => {
    fetchRequest();
  }, [id, profile]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isTechnical: boolean = false, isQuote: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file || !id || !profile) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('request-attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from('request_attachments')
        .insert([{
          request_id: id,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
          is_technical: isTechnical,
          is_quote: isQuote
        }]);

      if (dbError) throw dbError;

      toast.success('Arquivo enviado com sucesso!');
      fetchRequest();
    } catch (err: any) {
      toast.error('Erro no upload: ' + err.message);
    } finally {
      setUploading(false);
    }
  };


  const handleAction = async (nextStatus: string, nextStep: string, actionComment?: string) => {
    if (!request || !profile) return;
    setActionLoading(true);
    
    const updatePayload: any = { 
      status: nextStatus,
      current_step: nextStep
    };

    // If step is TI, include tech fields
    if (request.current_step === 'ti' && (isTI || isAdmin)) {
      updatePayload.ti_technical_opinion = tiForm.ti_technical_opinion;
      const techCost = tiForm.ti_estimated_cost ? parseFloat(tiForm.ti_estimated_cost) : null;
      updatePayload.ti_estimated_cost = techCost;
      updatePayload.ti_reference_link = tiForm.ti_reference_link;
      updatePayload.ti_reference_site = tiForm.ti_reference_site;
      
      // Sync official estimated cost with TI's calculated cost
      if (techCost !== null) {
        updatePayload.estimated_cost = techCost;
      }
    }

    // If step is Final Purchasing, include tracking/NF fields
    if (request.status === 'PENDING_COMPRAS_FINAL' && profile.role === 'compras') {
      updatePayload.tracking_code = request.tracking_code;
      updatePayload.invoice_number = request.invoice_number;
      updatePayload.delivery_prediction = request.delivery_prediction;
    }

    const { error: updateError } = await supabase
      .from('requests')
      .update(updatePayload)
      .eq('id', request.id);

    // OPTIMISTIC UI: Update local state immediately for instant feedback
    setRequest({
      ...request,
      status: nextStatus,
      current_step: nextStep,
      ...updatePayload
    });

    if (!updateError) {
      await supabase.from('request_status_history').insert([{
        request_id: request.id,
        old_status: request.status,
        new_status: nextStatus,
        changed_by: profile.id,
        comment: actionComment || comment || 'Status atualizado pela central de decisão.'
      }]);

      const notifications = [];
      const isRejection = nextStatus === 'REJECTED';
      const isAdjustment = nextStatus === 'ADJUSTMENT_NEEDED';
      
      let title = `Pedido Atualizado`;
      if (isRejection) title = `Pedido Recusado`;
      if (isAdjustment) title = `Ajuste Necessário`;

      notifications.push({
        user_id: request.user_id,
        title: title,
        message: isAdjustment 
          ? `Sua solicitação "${request.title}" precisa de ajustes. Veja o comentário do auditor.`
          : `Sua solicitação "${request.title}" avançou para: ${statusLabels[nextStatus] || nextStatus}.`,
        link: `/solicitacoes/${request.id}`,
        company_id: request.company_id,
        department_id: request.department_id
      });

      if (['PENDING_TI', 'PENDING_COMPRAS', 'PENDING_DIRETORIA'].includes(nextStatus)) {
        const targetRole = nextStep;
        const { data: team } = await supabase.from('profiles').select('id').eq('role', targetRole);
        
        if (team) {
          team.forEach(member => {
            if (member.id !== profile.id) {
              notifications.push({
                user_id: member.id,
                title: 'Pendência de Aprovação',
                message: `Há uma solicitação de "${request.title}" aguardando sua análise.`,
                link: `/solicitacoes/${request.id}`,
                company_id: request.company_id,
                department_id: request.department_id
              });
            }
          });
        }
      }

      if (notifications.length > 0) {
        await supabase.from('notifications').insert(notifications);
      }

      setComment('');
      toast.success(`Solicitação ${nextStatus === 'REJECTED' ? 'recusada' : 'processada'} com sucesso.`);
      fetchRequest();
    } else {
      toast.error('Erro ao processar ação: ' + updateError.message);
    }
    setActionLoading(false);
  };

  const handleAddQuote = async () => {
    if (!newQuote.supplier_name || !newQuote.price || !id) return;
    
    const { error } = await supabase
      .from('request_quotes')
      .insert([{
        request_id: id,
        supplier_name: newQuote.supplier_name,
        price: parseFloat(newQuote.price),
        description: newQuote.description,
        purchase_link: newQuote.purchase_link,
        supplier_site: newQuote.supplier_site,
        observations: newQuote.observations,
        quoted_value: newQuote.quoted_value ? parseFloat(newQuote.quoted_value) : parseFloat(newQuote.price),
        created_by: profile?.id
      }]);

    if (!error) {
      toast.success('Orçamento registrado.');
      setNewQuote({ 
        supplier_name: '', 
        price: '', 
        description: '',
        purchase_link: '',
        supplier_site: '',
        observations: '',
        quoted_value: ''
      });
      setShowQuoteForm(false);
      fetchRequest();
    } else {
      console.error("Erro ao salvar orçamento:", error);
      toast.error('Erro ao salvar orçamento: ' + error.message);
    }
  };

  const handleSelectQuote = async (quote: Quote) => {
    if (!id) return;
    
    // Update all quotes for this request to not selected
    await supabase.from('request_quotes').update({ is_selected: false }).eq('request_id', id);
    
    // Select this one
    const { error } = await supabase
      .from('request_quotes')
      .update({ is_selected: true })
      .eq('id', quote.id);

    if (!error) {
      // Sync request estimated cost with selected quote
      await supabase.from('requests').update({ estimated_cost: quote.price }).eq('id', id);
      toast.success('Fornecedor selecionado.');
      fetchRequest();
    }
  };

  const handleDeleteQuote = async (quoteId: string) => {
    if (!confirm('Excluir este orçamento?')) return;
    const { error } = await supabase.from('request_quotes').delete().eq('id', quoteId);
    if (!error) {
      toast.success('Orçamento removido.');
      fetchRequest();
    }
  };

  if (loading) return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="gp-skeleton h-4 w-48 mb-6" />
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 gp-card p-10 h-[600px] animate-pulse" />
        <div className="w-full lg:w-96 space-y-8">
           <div className="gp-card p-8 h-64 animate-pulse" />
           <div className="gp-card p-8 h-96 animate-pulse" />
        </div>
      </div>
    </div>
  );

  if (!request) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-up px-6">
      <div className="w-20 h-20 bg-gp-surface2 text-gp-text3 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner border border-gp-border">
        <AlertCircle size={40} strokeWidth={2.5} />
      </div>
      <h2 className="text-2xl font-black text-gp-text mb-2 uppercase tracking-tight">Solicitação não encontrada</h2>
      <p className="text-gp-text2 font-medium max-w-sm">Você não tem permissão para acessar este item ou ele foi removido dos nossos servidores.</p>
      <button onClick={() => navigate('/solicitacoes')} className="mt-8 btn-premium-secondary px-10 py-3.5 rounded-xl font-black uppercase text-[11px] tracking-widest">Voltar à Lista</button>
    </div>
  );

  const currentStatus = statusMap[request.status] || { label: request.status, badge: 'gp-badge-gray', icon: Clock };
  const isAdmin = profile?.role === 'master_admin';
  const isTI = profile?.role === 'ti';
  const isOwner = profile?.id === request.user_id;
  const isApprover = profile?.role === request.current_step || isAdmin;
  const isFinalized = request.status === 'COMPLETED' || request.status === 'REJECTED';
  const isAdjustment = request.status === 'ADJUSTMENT_NEEDED';

  const flowMap = ['PENDING_GESTOR', 'PENDING_TI', 'PENDING_COMPRAS', 'PENDING_DIRETORIA', 'PENDING_COMPRAS_FINAL', 'COMPLETED'];
  const currentIdx = flowMap.indexOf(request.status);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-fade-up">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-[10px] font-black text-gp-muted uppercase tracking-[0.2em] px-1 translate-y-1">
        <button onClick={() => navigate('/solicitacoes')} className="hover:text-gp-blue transition-colors">Solicitações</button>
        <ChevronRight size={14} className="opacity-30" />
        <span className="text-gp-text truncate max-w-xs">{request.title}</span>
      </nav>

      <div className="flex flex-col gap-8">
        {/* NEW PROFESSIONAL SAAS TIMELINE */}
        <div className="gp-card p-6 sm:p-10 relative overflow-hidden group/timeline">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12 relative z-10">
            <div>
              <h3 className="text-[11px] font-black text-gp-blue uppercase tracking-[0.3em] mb-2 leading-none">Andamento do Fluxo</h3>
              <p className="text-[13px] font-medium text-gp-text2 leading-tight">Acompanhe as fases de validação e aprovação corporativa.</p>
            </div>
            <div className="flex items-center gap-3">
               <div className="flex items-center gap-2 px-3 py-1.5 bg-gp-surface2 rounded-lg border border-gp-border text-[9px] font-black text-gp-muted uppercase tracking-widest leading-none">
                 <Clock size={12} className="text-gp-amber" /> {new Date(request.created_at).toLocaleDateString()}
               </div>
            </div>
          </div>

          <div className="relative z-10">
             {/* TIMELINE TRACK */}
             <div className="flex flex-col lg:flex-row gap-10 lg:gap-0 lg:items-start relative">
                {/* Vertical line for mobile */}
                <div className="lg:hidden absolute top-0 bottom-0 left-[21px] w-0.5 bg-gp-border z-0" />
                 {/* Horizontal line for desktop */}
                <div className="hidden lg:block absolute top-[22px] left-0 right-0 h-0.5 bg-gp-border z-0" />
                
                {[
                  { step: 'solicitante', label: 'Solicitação', desc: 'Abertura', status: 'PENDING_GESTOR' },
                  { step: 'gestor', label: 'Gestor', desc: 'Validação', status: 'PENDING_TI' },
                  { step: 'ti', label: 'Técnico', desc: 'Análise IT', status: 'PENDING_COMPRAS' },
                  { step: 'compras', label: 'Compras', desc: 'Cotações', status: 'PENDING_DIRETORIA' },
                  { step: 'diretoria', label: 'Diretoria', desc: 'Aprovação Boards', status: 'PENDING_COMPRAS_FINAL' },
                  { step: 'concluido', label: 'Conclusão', desc: 'Finalização NF', status: 'COMPLETED' },
                ].map((stage, idx) => {
                  // Refined Status Logic
                  let state: 'past' | 'current' | 'future' | 'refused' | 'warning' = 'future';
                  const currentIdx = flowMap.indexOf(request.status);
                  
                  // Encontrar log específico desta etapa e variáveis auxiliares
                  const stageLog = history.find(h => h.new_status === stage.status);
                  
                  // A etapa 0 (Solicitação) sempre ocorreu se o request existe
                  // A etapa atual é o índice do status atual + 1 (ex: PENDING_GESTOR [0] -> Etapa do Gestor [1] é a atual)
                  const isCurrent = (currentIdx === idx - 1 && !isFinalized) || (request.status === 'ADJUSTMENT_NEEDED' && idx === 0);
                  const isPast = (currentIdx >= idx) || request.status === 'COMPLETED';

                  if (request.status === 'ADJUSTMENT_NEEDED') {
                    if (idx === 0) state = 'warning';
                    else state = 'future';
                  } else if (request.status === 'REJECTED') {
                    const lastLog = history[0];
                    const rejectedAtIdx = flowMap.indexOf(lastLog?.old_status || '');
                    if (idx < rejectedAtIdx) state = 'past';
                    else if (idx === rejectedAtIdx) state = 'refused';
                    else state = 'future';
                  } else {
                    if (isPast && !isCurrent) state = 'past';
                    else if (isCurrent) state = 'current';
                    else state = 'future';
                  }

                  return (
                    <div key={idx} className="flex-1 flex flex-row lg:flex-col items-start lg:items-center gap-6 lg:gap-5 group/node transition-all relative z-10 min-w-0">
                      <div className={clsx(
                        "w-11 h-11 rounded-[1.2rem] border-2 flex items-center justify-center transition-all duration-700 shadow-xl relative z-10",
                        state === 'past' ? "bg-gp-blue border-gp-blue text-white" :
                        state === 'current' ? "bg-gp-surface2 border-gp-blue text-gp-blue animate-pulse-short shadow-gp-blue/20" :
                        state === 'warning' ? "bg-gp-amber border-gp-amber text-white shadow-gp-amber/20 animate-bounce-short" :
                        state === 'refused' ? "bg-gp-error border-gp-error text-white shadow-gp-error/20" :
                        "bg-gp-surface border-gp-border text-gp-muted opacity-40"
                      )}>
                        {state === 'past' ? <CheckCircle2 size={20} strokeWidth={3} /> : 
                         state === 'warning' ? <AlertCircle size={20} strokeWidth={3} /> :
                         state === 'refused' ? <XCircle size={20} strokeWidth={3} /> :
                         <span className="font-black text-xs leading-none">0{idx+1}</span>}
                      </div>
                      
                      <div className="flex flex-col lg:items-center text-left lg:text-center min-w-0 pt-1 lg:pt-0 min-h-[60px] lg:min-h-0">
                        <span className={clsx(
                          "text-[12px] font-black uppercase tracking-widest leading-none mb-2 block",
                          state === 'current' ? "text-gp-blue" : state === 'past' ? "text-gp-text" : "text-gp-muted"
                        )}>{stage.label}</span>
                        
                        {stageLog ? (
                          <div className="space-y-1 group">
                            <p className="text-[10px] font-bold text-gp-text truncate max-w-[120px]">{stageLog.profiles?.full_name}</p>
                            <p className="text-[9px] font-black text-gp-muted uppercase opacity-50">{new Date(stageLog.created_at).toLocaleDateString('pt-BR')}</p>
                          </div>
                        ) : idx === 0 ? (
                          <div className="space-y-1 group">
                             <p className="text-[10px] font-bold text-gp-text truncate max-w-[120px]">{request.profiles?.full_name}</p>
                             <p className="text-[9px] font-black text-gp-muted uppercase opacity-50">{new Date(request.created_at).toLocaleDateString('pt-BR')}</p>
                          </div>
                        ) : (
                          <span className="text-[9px] font-black text-gp-muted uppercase tracking-tighter opacity-30 leading-none">
                            {state === 'past' ? 'CONCLUÍDO' : state === 'current' ? 'AGUARDANDO...' : 'PENDENTE'}
                          </span>
                        )}
                      </div>
                      
                      {/* Detailed Popover Tooltip on Hover (Desktop) */}
                      {stageLog && (
                        <div className="hidden lg:block absolute top-[110%] left-1/2 -translate-x-1/2 w-64 bg-gp-navy2 border border-white/10 p-5 rounded-2xl shadow-3xl opacity-0 group-hover/node:opacity-100 transition-all pointer-events-none z-50">
                           <p className="text-[9px] font-black text-gp-blue-light uppercase tracking-widest mb-3 border-b border-white/10 pb-2">Feedback da Etapa</p>
                           <p className="text-[12px] font-medium text-white/80 italic leading-relaxed">"{stageLog.comment || 'Nenhuma observação informada.'}"</p>
                           <div className="flex items-center justify-between mt-4">
                              <span className="text-[9px] font-black text-white/40 uppercase">{stageLog.profiles?.full_name}</span>
                              <span className="text-[9px] font-black text-white/40 uppercase">{new Date(stageLog.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                           </div>
                        </div>
                      )}
                    </div>
                  );
                })}
             </div>
          </div>
          <Activity size={200} className="absolute -right-20 -bottom-20 text-gp-blue opacity-[0.015] -rotate-12 pointer-events-none" />
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* LADO ESQUERDO: Conteúdo Principal */}
        <div className="flex-1 space-y-6 w-full">
          {/* Cabeçalho do Pedido */}
          <div className="gp-card p-6 sm:p-10 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-10">
              <div className="flex-1 space-y-5">
                <div className={clsx("gp-badge font-black", currentStatus.badge)}>
                  <currentStatus.icon size={12} strokeWidth={3} />
                  {currentStatus.label.toUpperCase()}
                </div>
                <h1 className="gp-page-title text-3xl leading-none">
                  {request.title}
                </h1>
              </div>
              <div className="bg-gp-blue/[0.03] border border-gp-blue/20 p-6 rounded-2xl flex flex-col items-end shrink-0 shadow-inner group w-full md:w-auto">
                <p className="text-[10px] font-black text-gp-blue-light uppercase tracking-[0.2em] mb-2 leading-none border-b border-gp-blue/10 pb-2 w-full text-right">INVESTIMENTO ESTIMADO</p>
                <p className="text-3xl font-black text-gp-text group-hover:text-gp-blue transition-colors duration-500">
                  R$ {Number(request.estimated_cost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Grid de Atributos */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 py-8 border-y border-gp-border">
              <div className="space-y-2">
                <p className="flex items-center gap-1.5 text-[10px] font-black text-gp-muted uppercase tracking-widest leading-none">
                  <User size={12} strokeWidth={3} /> Requerente
                </p>
                <p className="font-bold text-gp-text text-[15px]">{request.profiles?.full_name}</p>
              </div>
              <div className="space-y-2">
                <p className="flex items-center gap-1.5 text-[10px] font-black text-gp-muted uppercase tracking-widest leading-none">
                  <Tag size={12} strokeWidth={3} /> Categoria
                </p>
                <p className="font-bold text-gp-text text-[15px]">{request.category}</p>
              </div>
              <div className="space-y-2">
                <p className="flex items-center gap-1.5 text-[10px] font-black text-gp-muted uppercase tracking-widest leading-none">
                  <Calendar size={12} strokeWidth={3} /> Criação
                </p>
                <p className="font-bold text-gp-text text-[15px]">
                  {new Date(request.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div className="space-y-2">
                <p className="flex items-center gap-1.5 text-[10px] font-black text-gp-muted uppercase tracking-widest leading-none">
                  <Hash size={12} strokeWidth={3} /> Protocolo
                </p>
                <p className="font-black text-gp-blue-light tracking-widest text-[12px] select-all">#{request.id.slice(0, 8).toUpperCase()}</p>
              </div>
            </div>

          </div>

          {/* 1. JUSTIFICATIVA — FUNCIONÁRIO/SOLICITANTE */}
          <div className="gp-card p-6 sm:p-10 space-y-6">
            <h3 className="text-[14px] font-black flex items-center gap-3 text-gp-text uppercase tracking-tight opacity-50">
              <User size={18} className="text-gp-muted" /> Responsabilidade: Solicitante
            </h3>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-gp-muted uppercase tracking-[0.15em] leading-none">Justificativa Operacional e Necessidade</label>
              <div className="bg-gp-surface2 p-6 rounded-2xl border border-gp-border text-gp-text2 text-[15px] font-medium leading-relaxed whitespace-pre-wrap shadow-inner">
                {request.description}
              </div>
            </div>

            {/* Initial Links & Media */}
            {(links.length > 0 || attachments.some(a => !a.is_technical && !a.is_quote)) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gp-border/30">
                {links.length > 0 && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gp-muted uppercase tracking-[0.15em] leading-none mb-2 block">Links de Referência</label>
                    <div className="grid gap-2">
                       {links.map((link, i) => (
                         <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-gp-surface border border-gp-border rounded-xl text-gp-blue font-bold text-[12px] hover:border-gp-blue transition-all truncate">
                           <LinkIcon size={14} /> {link.label || link.url}
                         </a>
                       ))}
                    </div>
                  </div>
                )}
                {attachments.some(a => !a.is_technical && !a.is_quote) && (
                   <div className="space-y-3">
                    <label className="text-[10px] font-black text-gp-muted uppercase tracking-[0.15em] leading-none mb-2 block">Anexos Iniciais</label>
                    <div className="grid gap-2">
                       {attachments.filter(a => !a.is_technical && !a.is_quote).map((file) => (
                         <div key={file.id} className="flex items-center justify-between p-3 bg-gp-surface border border-gp-border rounded-xl group hover:border-gp-blue/40 transition-all shadow-sm">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className="w-7 h-7 rounded-lg bg-gp-surface2 flex items-center justify-center shrink-0 border border-gp-border text-gp-muted">
                                {file.file_type?.startsWith('image/') ? <ImageIcon size={14} /> : <FileText size={14} />}
                              </div>
                              <p className="font-bold text-[11px] text-gp-text truncate leading-tight">{file.file_name}</p>
                            </div>
                            <a href={supabase.storage.from('request-attachments').getPublicUrl(file.file_path).data.publicUrl} target="_blank" download className="text-gp-muted hover:text-gp-blue transition-colors p-2"><Download size={14} /></a>
                          </div>
                       ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. VALIDAÇÃO — GESTOR (Visibility: Past Gestor step or Admin) */}
          {(currentIdx >= 1 || request.current_step === 'gestor' || isAdmin) && (
            <div className={clsx(
              "gp-card p-6 sm:p-10 space-y-6 transition-all",
              request.current_step === 'gestor' ? "border-gp-amber/30 ring-1 ring-gp-amber/5" : "opacity-80"
            )}>
              <h3 className="text-[14px] font-black flex items-center gap-3 text-gp-text uppercase tracking-tight">
                <CheckCircle2 size={18} className="text-gp-amber" /> Responsabilidade: Gestor de Área
              </h3>
              <div className="space-y-4">
                 <p className="text-[12px] font-medium text-gp-muted leading-relaxed italic">
                   {request.current_step === 'gestor' 
                     ? "Valide se a solicitação é pertinente à rotina da unidade e autorize o avanço técnico."
                     : "Validação gerencial concluída conforme histórico de auditoria."
                   }
                 </p>
                 {history.find(h => h.new_status === 'PENDING_TI') && (
                    <div className="p-5 bg-gp-surface2 rounded-xl border border-gp-border border-l-4 border-l-gp-amber">
                       <p className="text-[13px] font-medium text-gp-text2 italic">"{history.find(h => h.new_status === 'PENDING_TI')?.comment || 'Validado sem observações.'}"</p>
                       <span className="text-[9px] font-black text-gp-muted uppercase tracking-widest mt-3 block">{history.find(h => h.new_status === 'PENDING_TI')?.profiles?.full_name}</span>
                    </div>
                 )}
              </div>
            </div>
          )}

          {/* 3. ANÁLISE TÉCNICA — TI (Visibility: Past TI step or Admin) */}
          {(currentIdx >= 2 || request.current_step === 'ti' || isTI || isAdmin) && (
            <div className={clsx(
              "gp-card p-6 sm:p-10 space-y-6 transition-all",
              (request.current_step === 'ti' && !isFinalized) ? "border-gp-blue/30 ring-1 ring-gp-blue/5 shadow-lg" : "opacity-80"
            )}>
              <div className="flex justify-between items-center">
                <h3 className="text-[14px] font-black flex items-center gap-3 text-gp-text uppercase tracking-tight">
                  <FileText size={18} className="text-gp-blue" /> Responsabilidade: Auditoria de TI
                </h3>
                {(isTI || isAdmin) && (request.current_step === 'ti' || isAdjustment) && !isFinalized && (
                  <div className="flex items-center gap-2">
                    <label className="btn-premium-ghost px-4 py-2 rounded-xl cursor-pointer text-[10px] font-black">
                      {uploading ? 'ENVIANDO...' : 'PARECER TÉCNICO (DOCS)'}
                      <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                    </label>
                  </div>
                )}
              </div>
              {/* Technical Analysis Content */}
              <div className="space-y-8">
                 {/* 1. PARECER TÉCNICO */}
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-gp-muted uppercase tracking-[0.2em] leading-none mb-2 block">Parecer / Análise de Viabilidade</label>
                    {(isTI || isAdmin) && (request.current_step === 'ti' || isAdjustment) && !isFinalized ? (
                      <textarea 
                        className="gp-input px-6 py-5 min-h-[120px] resize-none text-[14px] font-medium leading-relaxed"
                        placeholder="Descreva aqui sua análise técnica detalhada..."
                        value={tiForm.ti_technical_opinion}
                        onChange={e => setTiForm({...tiForm, ti_technical_opinion: e.target.value})}
                      />
                    ) : (
                      <div className="bg-gp-surface2 p-6 rounded-2xl border border-gp-border text-gp-text2 text-[14px] font-medium leading-relaxed italic shadow-inner">
                        {request.ti_technical_opinion || "Nenhuma análise técnica registrada."}
                      </div>
                    )}
                 </div>

                 {/* 2. REFERÊNCIAS E LINKS */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6 border-y border-gp-border/30">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-gp-muted uppercase tracking-[0.2em] leading-none mb-2 block">Link de Referência</label>
                      {(isTI || isAdmin) && (request.current_step === 'ti' || isAdjustment) && !isFinalized ? (
                        <input 
                          type="url"
                          className="gp-input px-5 h-12"
                          placeholder="https://exemplo.com/produto"
                          value={tiForm.ti_reference_link}
                          onChange={e => setTiForm({...tiForm, ti_reference_link: e.target.value})}
                        />
                      ) : (
                        request.ti_reference_link ? (
                          <a href={request.ti_reference_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-gp-surface border border-gp-border rounded-xl text-gp-blue font-bold text-[13px] hover:border-gp-blue transition-all truncate">
                            <LinkIcon size={14} /> {request.ti_reference_link}
                          </a>
                        ) : <p className="text-[12px] text-gp-muted opacity-50 italic">Nenhum link informado.</p>
                      )}
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-gp-muted uppercase tracking-[0.2em] leading-none mb-2 block">Site do Fabricante / Referência</label>
                      {(isTI || isAdmin) && (request.current_step === 'ti' || isAdjustment) && !isFinalized ? (
                        <input 
                          type="text"
                          className="gp-input px-5 h-12"
                          placeholder="Ex: dell.com.br"
                          value={tiForm.ti_reference_site}
                          onChange={e => setTiForm({...tiForm, ti_reference_site: e.target.value})}
                        />
                      ) : (
                        <p className="font-bold text-gp-text text-[14px]">{request.ti_reference_site || "-"}</p>
                      )}
                    </div>
                 </div>

                 {/* 3. MÍDIAS DE APOIO */}
                 <div className="space-y-6">
                    <label className="text-[10px] font-black text-gp-muted uppercase tracking-[0.2em] leading-none mb-2 block">Mídias de Apoio (Fotos e Vídeos)</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                       {attachments.filter(a => a.is_technical || a.file_name.toLowerCase().includes('ti_')).map((file) => (
                         <div key={file.id} className="flex items-center justify-between p-4 bg-gp-surface2 border border-gp-border rounded-xl group hover:border-gp-blue/40 transition-all shadow-sm">
                           <div className="flex items-center gap-3 overflow-hidden">
                             <div className="w-8 h-8 rounded-lg bg-gp-surface flex items-center justify-center shrink-0 border border-gp-border text-gp-muted">
                               {file.file_type?.startsWith('video/') ? <Play size={14} /> : <ImageIcon size={14} />}
                             </div>
                             <p className="font-black text-[11px] text-gp-text truncate leading-tight">{file.file_name}</p>
                           </div>
                           <a href={supabase.storage.from('request-attachments').getPublicUrl(file.file_path).data.publicUrl} target="_blank" download className="text-gp-muted hover:text-gp-blue transition-colors p-2"><Download size={14} /></a>
                         </div>
                       ))}
                       {(isTI || isAdmin) && (request.current_step === 'ti' || isAdjustment) && !isFinalized && (
                         <label className="border-2 border-dashed border-gp-border rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-gp-blue/30 hover:bg-gp-blue/[0.01] transition-all group">
                             <Plus size={20} className="text-gp-muted group-hover:text-gp-blue" />
                             <span className="text-[9px] font-black uppercase text-gp-muted">Anexar Mídia</span>
                             <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, true, false)} disabled={uploading} />
                         </label>
                       )}
                    </div>
                 </div>

                 {/* 4. INVESTIMENTO ESTIMADO (REVISADO TI) */}
                 <div className="bg-gp-blue/[0.03] p-8 rounded-2xl border border-gp-blue/10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-inner">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-xl bg-gp-blue/10 border border-gp-blue/20 flex items-center justify-center text-gp-blue">
                          <BadgeDollarSign size={24} strokeWidth={2.5} />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-gp-blue-light uppercase tracking-[0.2em] mb-1">Cálculo Orçamentário TI</p>
                          <p className="text-[12px] font-medium text-gp-muted">Valor sugerido para a cotação final de compras.</p>
                       </div>
                    </div>
                    {(isTI || isAdmin) && (request.current_step === 'ti' || isAdjustment) && !isFinalized ? (
                      <div className="relative group/val w-full md:w-64">
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-gp-blue-light text-sm tracking-widest leading-none pointer-events-none">R$</div>
                        <input 
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          className="gp-input pl-14 font-black text-gp-blue"
                          value={tiForm.ti_estimated_cost}
                          onChange={e => setTiForm({...tiForm, ti_estimated_cost: e.target.value})}
                        />
                      </div>
                    ) : (
                      <p className="text-3xl font-black text-gp-text">
                        R$ {Number(request.ti_estimated_cost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    )}
                 </div>
              </div>
            </div>
          )}

          {/* 4. COTAÇÃO E ANÁLISE — COMPRAS (Visibility: Past Compras step or Admin) */}
          {(currentIdx >= 3 || request.current_step === 'compras' || profile?.role === 'compras' || isAdmin) && (
            <div className={clsx(
              "gp-card p-6 sm:p-10 space-y-6 transition-all",
              (request.current_step === 'compras' && request.status === 'PENDING_COMPRAS') ? "border-gp-purple/30 ring-1 ring-gp-purple/5 shadow-lg" : "opacity-80"
            )}>
              <div className="flex justify-between items-center">
                <h3 className="text-[14px] font-black flex items-center gap-3 text-gp-text uppercase tracking-tight">
                  <Activity size={18} className="text-gp-purple" /> Responsabilidade: Compras e Suprimentos
                </h3>
                {request.current_step === 'compras' && request.status === 'PENDING_COMPRAS' && (profile?.role === 'compras' || profile?.role === 'master_admin') && (
                  <button onClick={() => setShowQuoteForm(!showQuoteForm)} className="btn-premium-primary px-5 py-2 rounded-xl text-[10px] font-black">
                     {showQuoteForm ? 'CANCELAR' : 'REGISTRAR COTAÇÃO'}
                  </button>
                )}
              </div>

              {showQuoteForm && (
                <div className="bg-gp-surface2 p-8 rounded-2xl border border-gp-border mb-8 animate-fade-down space-y-6 shadow-2xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5 flex-1">
                      <label className="text-[10px] font-black text-gp-muted uppercase tracking-widest pl-1">Fornecedor / Razão Social</label>
                      <input type="text" placeholder="Ex: Dell Brasil" className="gp-input px-5 h-12" value={newQuote.supplier_name} onChange={e => setNewQuote({...newQuote, supplier_name: e.target.value})} />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <label className="text-[10px] font-black text-gp-muted uppercase tracking-widest pl-1">Valor Unitário Bruto (R$)</label>
                      <input type="number" placeholder="0,00" className="gp-input px-5 h-12 text-gp-blue font-bold" value={newQuote.price} onChange={e => setNewQuote({...newQuote, price: e.target.value})} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5 flex-1">
                      <label className="text-[10px] font-black text-gp-muted uppercase tracking-widest pl-1">Link Direto para Compra</label>
                      <input type="url" placeholder="https://..." className="gp-input px-5 h-12" value={newQuote.purchase_link} onChange={e => setNewQuote({...newQuote, purchase_link: e.target.value})} />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <label className="text-[10px] font-black text-gp-muted uppercase tracking-widest pl-1">Site / Fornecedor</label>
                      <input type="text" placeholder="Ex: dell.com.br" className="gp-input px-5 h-12" value={newQuote.supplier_site} onChange={e => setNewQuote({...newQuote, supplier_site: e.target.value})} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gp-muted uppercase tracking-widest pl-1">Observações da Cotação</label>
                    <textarea placeholder="Prazos, garantias, frete..." className="gp-input px-5 py-4 h-24 resize-none" value={newQuote.observations} onChange={e => setNewQuote({...newQuote, observations: e.target.value})} />
                  </div>

                  <div className="flex items-center gap-4 pt-4 border-t border-gp-border/30">
                    <label className="btn-premium-ghost px-6 py-3 rounded-xl cursor-pointer text-[11px] font-black flex items-center gap-2">
                       <Plus size={16} /> ANEXAR PDF / PROPOSTA
                       <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, false, true)} disabled={uploading} />
                    </label>
                    <button onClick={handleAddQuote} className="flex-1 btn-premium-primary py-3.5 rounded-xl font-black uppercase text-[11px] tracking-widest">REGISTRAR NO MAPA</button>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                 {quotes.length > 0 ? (
                   quotes.map((q) => (
                      <div key={q.id} className={clsx("p-5 rounded-2xl border transition-all flex items-center justify-between", q.is_selected ? "bg-gp-blue/5 border-gp-blue/30 shadow-lg scale-[1.02]" : "bg-gp-surface2/50 border-gp-border")}>
                         <div className="flex items-center gap-4">
                            <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center shadow-inner", q.is_selected ? "bg-gp-blue text-white" : "bg-gp-surface border border-gp-border text-gp-muted")}>
                               <Building2 size={20} />
                            </div>
                            <div>
                              <p className="font-black text-[14px] text-gp-text leading-none mb-1.5 uppercase tracking-tight">{q.supplier_name}</p>
                              <p className="text-[10px] font-black text-gp-muted uppercase tracking-widest">
                                R$ {Number(q.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                {q.is_selected && <span className="ml-2 text-gp-blue">• VENCEDOR</span>}
                              </p>
                            </div>
                         </div>
                         <div className="flex items-center gap-3">
                           {request.current_step === 'compras' && !isFinalized && profile?.role === 'compras' && (
                              <>
                                {!q.is_selected && (
                                   <button onClick={() => handleSelectQuote(q)} className="text-[10px] font-black text-gp-blue border border-gp-blue/20 px-3 py-1.5 rounded-lg hover:bg-gp-blue hover:text-white transition-all uppercase tracking-tighter">Escolher</button>
                                )}
                                <button onClick={() => handleDeleteQuote(q.id)} className="w-8 h-8 flex items-center justify-center text-gp-muted hover:text-gp-error transition-colors"><Trash2 size={16} /></button>
                              </>
                           )}
                           {q.is_selected && <ShieldCheck size={20} className="text-gp-blue" />}
                         </div>
                      </div>
                   ))
                 ) : (
                   <p className="text-center py-6 text-gp-muted text-[11px] font-bold uppercase tracking-widest opacity-40">Nenhum orçamento oficial vinculado.</p>
                 )}
              </div>
            </div>
          )}

          {/* 5. DECISÃO — DIRETORIA */}
          {(history.some(h => h.new_status === 'PENDING_COMPRAS_FINAL') || request.current_step === 'diretoria') && (
            <div className={clsx(
              "gp-card p-6 sm:p-10 space-y-6 transition-all",
              request.current_step === 'diretoria' ? "border-gp-error/20 ring-1 ring-gp-error/5" : "opacity-80"
            )}>
              <h3 className="text-[14px] font-black flex items-center gap-3 text-gp-text uppercase tracking-tight">
                <Gavel size={18} className="text-gp-blue-light" /> Responsabilidade: Diretoria Executiva
              </h3>
              <div className="space-y-4">
                 <p className="text-[12px] font-medium text-gp-muted leading-relaxed italic">
                   Aprovação estratégica baseada no investimento total e cotações apresentadas.
                 </p>
                 {history.find(h => ["PENDING_COMPRAS_FINAL", "COMPLETED"].includes(h.new_status) && h.comment) && (
                    <div className="p-5 bg-gp-surface2 rounded-xl border border-gp-border border-l-4 border-l-gp-blue-light">
                       <p className="text-[13px] font-medium text-gp-text2 italic">"{history.find(h => ["PENDING_COMPRAS_FINAL", "COMPLETED"].includes(h.new_status))?.comment}"</p>
                    </div>
                 )}
              </div>
            </div>
          )}

          {/* 6. FINALIZAÇÃO — COMPRAS */}
          {(history.some(h => h.new_status === 'COMPLETED') || request.current_step === 'compras' && request.status === 'PENDING_COMPRAS_FINAL') && (
             <div className={clsx(
              "gp-card p-6 sm:p-10 space-y-6 transition-all",
              (request.status === 'PENDING_COMPRAS_FINAL') ? "bg-gp-blue/[0.02] border-gp-blue/30" : "opacity-80"
            )}>
              <h3 className="text-[14px] font-black flex items-center gap-3 text-gp-text uppercase tracking-tight">
                <ShieldCheck size={18} className="text-gp-success" /> Responsabilidade: Finalização de Compra
              </h3>
              <div className="space-y-6">
                 <p className="text-[12px] font-medium text-gp-muted leading-relaxed">
                   Registro de nota fiscal, rastreio e comprovantes finais de aquisição.
                 </p>
                 
                 {request.status === 'PENDING_COMPRAS_FINAL' && profile?.role === 'compras' ? (
                    <div className="space-y-6 bg-gp-surface2 p-8 rounded-2xl border border-gp-border shadow-inner">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-gp-muted uppercase tracking-widest pl-1">Número da Nota Fiscal</label>
                             <input 
                                type="text" 
                                className="gp-input px-5 h-12" 
                                placeholder="Ex: NF-12345"
                                value={request.invoice_number || ''}
                                onChange={e => setRequest({...request, invoice_number: e.target.value})}
                             />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-gp-muted uppercase tracking-widest pl-1">Código de Rastreio</label>
                             <input 
                                type="text" 
                                className="gp-input px-5 h-12" 
                                placeholder="Ex: BR123456789"
                                value={request.tracking_code || ''}
                                onChange={e => setRequest({...request, tracking_code: e.target.value})}
                             />
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-gp-muted uppercase tracking-widest pl-1">Previsão de Entrega</label>
                          <input 
                             type="date" 
                             className="gp-input px-5 h-12" 
                             value={request.delivery_prediction || ''}
                             onChange={e => setRequest({...request, delivery_prediction: e.target.value})}
                          />
                       </div>

                       <div className="pt-4 flex flex-col sm:flex-row gap-4">
                          <label className="btn-premium-ghost px-6 py-3 rounded-xl cursor-pointer text-[11px] font-black flex items-center justify-center gap-2 flex-1">
                             <Plus size={16} /> ANEXAR NF / COMPROVANTE
                             <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, false)} disabled={uploading} />
                          </label>
                       </div>
                    </div>
                 ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <div className="p-4 bg-gp-surface2 rounded-xl border border-gp-border">
                          <p className="text-[10px] font-black text-gp-muted uppercase tracking-widest mb-1">Nota Fiscal</p>
                          <p className="font-bold text-gp-text">{request.invoice_number || '-'}</p>
                       </div>
                       <div className="p-4 bg-gp-surface2 rounded-xl border border-gp-border">
                          <p className="text-[10px] font-black text-gp-muted uppercase tracking-widest mb-1">Cód. Rastreio</p>
                          <p className="font-bold text-gp-text">{request.tracking_code || '-'}</p>
                       </div>
                    </div>
                 )}
              </div>
            </div>
          )}

          {/* CENTRAL DE DECISÃO OU FERRAMENTAS DO SOLICITANTE */}
          {(isApprover && !isFinalized) || (isOwner && isAdjustment) ? (
            <div className="gp-card p-6 sm:p-8 border-gp-blue/40 bg-gp-blue/[0.01] space-y-6 relative overflow-hidden shadow-2xl">
              <div className="flex items-center gap-4 relative z-10">
                <div className={clsx(
                  "w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-transform scale-105",
                  isAdjustment ? "bg-gp-amber text-white shadow-gp-amber/30" : "bg-gp-blue text-white shadow-gp-blue/30"
                )}>
                  {isAdjustment ? <AlertCircle size={24} strokeWidth={2.5} /> : <ShieldCheck size={24} strokeWidth={2.5} />}
                </div>
                <div>
                  <h4 className="font-black text-[18px] tracking-tighter uppercase leading-none">
                     {isAdjustment ? 'Ajuste Necessário' : (
                       <>
                         {request.current_step === 'gestor' && 'Validação Regional'}
                         {request.current_step === 'ti' && 'Parecer Técnico'}
                         {request.current_step === 'compras' && request.status === 'PENDING_COMPRAS' && 'Análise de Mercado'}
                         {request.current_step === 'diretoria' && 'Aprovação do Board'}
                         {request.current_step === 'compras' && request.status === 'PENDING_COMPRAS_FINAL' && 'Finalização Fiscal'}
                       </>
                     )}
                  </h4>
                  <p className="text-[10px] uppercase font-black text-gp-blue-light tracking-[0.2em] mt-1.5 opacity-80 leading-none">
                    {isAdjustment ? 'Revise sua solicitação e envie novamente' : 'Aguardando sua decisão no fluxo'}
                  </p>
                </div>
              </div>

              {isOwner && isAdjustment ? (
                <div className="space-y-4 pt-2 relative z-10">
                   <p className="text-[12px] font-medium text-gp-text2 leading-relaxed">
                     Sua solicitação foi devolvida para ajustes. Clique no botão abaixo para editar os campos e re-protocolar o pedido.
                   </p>
                   <button 
                    onClick={() => navigate(`/solicitacoes/nova?id=${request.id}`)}
                    className="w-full btn-premium-primary py-4 rounded-xl text-[12px] font-black uppercase tracking-widest shadow-xl shadow-gp-blue/20"
                   >
                     EDITAR SOLICITAÇÃO
                   </button>
                </div>
              ) : (
                <div className="space-y-4 pt-2 relative z-10">
                  <textarea 
                    placeholder="Justificativa ou comentário (opcional)..."
                    className="gp-input px-5 py-4 h-24 resize-none text-[14px] font-medium leading-relaxed"
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                  />
                  <div className="grid grid-cols-1 gap-3">
                    <button 
                      disabled={actionLoading}
                      onClick={() => {
                        let ns = ''; let nst = '';
                        if (request.status === 'PENDING_GESTOR') { ns = 'PENDING_TI'; nst = 'ti'; }
                        else if (request.status === 'PENDING_TI' || (request.status === 'ADJUSTMENT_NEEDED' && request.current_step === 'ti')) { ns = 'PENDING_COMPRAS'; nst = 'compras'; }
                        else if (request.status === 'PENDING_COMPRAS') { ns = 'PENDING_DIRETORIA'; nst = 'diretoria'; }
                        else if (request.status === 'PENDING_DIRETORIA') { ns = 'PENDING_COMPRAS_FINAL'; nst = 'compras'; }
                        else if (request.status === 'PENDING_COMPRAS_FINAL') { ns = 'COMPLETED'; nst = 'compras'; }
                        else if (request.status === 'ADJUSTMENT_NEEDED') { ns = 'PENDING_GESTOR'; nst = 'gestor'; }
                        handleAction(ns, nst);
                      }}
                      className="w-full btn-premium-primary py-4 rounded-xl text-[12px] font-black uppercase tracking-widest shadow-xl shadow-gp-blue/20"
                    >
                      {actionLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : 'AUTORIZAR E AVANÇAR ETAPA'}
                    </button>

                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        disabled={actionLoading}
                        onClick={() => handleAction('ADJUSTMENT_NEEDED', 'usuario')}
                        className="btn-premium-secondary py-3.5 rounded-xl text-gp-amber border-gp-amber/20 font-black uppercase text-[10px] tracking-widest"
                      >
                        SOLICITAR AJUSTE
                      </button>
                      <button 
                        disabled={actionLoading}
                        onClick={() => handleAction('REJECTED', request.current_step as any)}
                        className="btn-premium-secondary py-3.5 rounded-xl text-gp-error border-gp-error/20 font-black uppercase text-[10px] tracking-widest"
                      >
                        RECUSAR PEDIDO
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* TIMELINE DE PROCESSO (REPLACED BY NEW TOP TIMELINE) */}

          {/* HISTÓRICO */}
          {history.length > 0 && (
            <div className="gp-card p-6 sm:p-8">
              <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-gp-muted mb-10 flex items-center gap-3 leading-none">
                <Clock size={18} strokeWidth={3} /> Auditoria de Eventos
              </h4>
              <div className="space-y-8">
                {history.map((h, i) => (
                  <div key={i} className="flex gap-4 items-start border-l-2 border-gp-border pl-6 relative">
                    <div className="absolute left-[-5.5px] top-1.5 w-2.5 h-2.5 rounded-full bg-gp-border border-2 border-gp-surface" />
                    <div className="space-y-3 w-full">
                      <p className="text-[11px] font-black text-gp-text uppercase tracking-tight leading-none">{statusLabels[h.new_status] || h.new_status}</p>
                      <div className="bg-gp-surface2 p-4 rounded-xl border border-gp-border shadow-inner">
                        <p className="text-[13px] font-medium text-gp-text2 italic">"{h.comment || 'Sem observação.'}"</p>
                      </div>
                      <div className="flex items-center justify-between text-[9px] font-black text-gp-muted uppercase tracking-widest px-1">
                        <span className="text-gp-blue">{h.profiles?.full_name || 'Sistema'}</span>
                        <span className="opacity-50">{new Date(h.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
  );
}
