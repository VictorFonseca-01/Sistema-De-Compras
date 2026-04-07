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
  ExternalLink, 
  ShieldCheck,
  User,
  Hash,
  ChevronRight,
  Activity,
  Plus,
  Paperclip,
  Trash2,
  Download,
  Image as ImageIcon,
  File as FileIcon,
  Building2,
  Gavel
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
  created_at: string;
}

interface RequestLink {
  id: string;
  label: string;
  url: string;
}

interface RequestHistory {
  id: string;
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
  is_selected: boolean;
  justification: string;
  quote_date: string;
  created_at: string;
}

const statusMap: Record<string, { label: string; badge: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }> }> = {
  pending_gestor:        { label: 'Aguardando Gestor',    badge: 'gp-badge-amber',  icon: Clock },
  pending_ti:            { label: 'Em Análise TI',        badge: 'gp-badge-blue',   icon: FileText },
  pending_compras:       { label: 'Fila de Orçamentos',   badge: 'gp-badge-purple', icon: Clock },
  pending_diretoria:     { label: 'Aguardando Diretoria', badge: 'gp-badge-purple', icon: Clock },
  pending_compras_final: { label: 'Finalização de Compra', badge: 'gp-badge-blue',   icon: ShieldCheck },
  approved:              { label: 'Aprovado Final',       badge: 'gp-badge-success', icon: CheckCircle2 },
  rejected:              { label: 'Recusado',             badge: 'gp-badge-red',    icon: XCircle },
  adjustment_needed:     { label: 'Ajuste Necessário',    badge: 'gp-badge-amber',  icon: AlertCircle },
};

export default function RequestDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useProfile();
  const statusLabels: Record<string, string> = {
    pending_gestor: 'Aguardando Gestor',
    pending_ti: 'Em Análise TI',
    pending_compras: 'Fila de Orçamentos',
    pending_diretoria: 'Aguardando Diretoria',
    pending_compras_final: 'Finalização de Compra',
    approved: 'Aprovado',
    rejected: 'Recusado',
    adjustment_needed: 'Ajuste Necessário',
  };

  const [request, setRequest] = useState<Request | null>(null);
  const [links, setLinks] = useState<RequestLink[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [history, setHistory] = useState<RequestHistory[]>([]);
  const [comment, setComment] = useState('');
  
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [newQuote, setNewQuote] = useState({ supplier_name: '', price: '', description: '' });
  const [showQuoteForm, setShowQuoteForm] = useState(false);

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
    setLoading(false);

    // Fetch related data
    const { data: linkData } = await supabase.from('request_links').select('*').eq('request_id', id);
    if (linkData) setLinks(linkData);

    const { data: attachData } = await supabase.from('request_attachments').select('*').eq('request_id', id);
    if (attachData) setAttachments(attachData);

    const { data: historyData } = await supabase.from('request_status_history').select('*, profiles(full_name)').eq('request_id', id).order('created_at', { ascending: false });
    if (historyData) setHistory(historyData);

    const { data: quoteData } = await supabase.from('request_quotes').select('*').eq('request_id', id).order('price', { ascending: true });
    if (quoteData) setQuotes(quoteData);
  };

  useEffect(() => {
    fetchRequest();
  }, [id, profile]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
          file_type: file.type
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
    
    const { error: updateError } = await supabase
      .from('requests')
      .update({ 
        status: nextStatus,
        current_step: nextStep
      })
      .eq('id', request.id);

    if (!updateError) {
      await supabase.from('request_status_history').insert([{
        request_id: request.id,
        old_status: request.status,
        new_status: nextStatus,
        changed_by: profile.id,
        comment: actionComment || comment || 'Status atualizado pela central de decisão.'
      }]);

      const notifications = [];
      notifications.push({
        user_id: request.user_id,
        title: `Pedido ${nextStatus === 'rejected' ? 'Recusado' : 'Atualizado'}`,
        message: `Sua solicitação "${request.title}" avançou para: ${statusLabels[nextStatus] || nextStatus}.`,
        link: `/solicitacoes/${request.id}`
      });

      if (['pending_ti', 'pending_compras', 'pending_diretoria'].includes(nextStatus)) {
        const targetRole = nextStep;
        const { data: team } = await supabase.from('profiles').select('id').eq('role', targetRole);
        
        if (team) {
          team.forEach(member => {
            if (member.id !== profile.id) {
              notifications.push({
                user_id: member.id,
                title: 'Pendência de Aprovação',
                message: `Há uma solicitação de "${request.title}" aguardando sua análise.`,
                link: `/solicitacoes/${request.id}`
              });
            }
          });
        }
      }

      if (notifications.length > 0) {
        await supabase.from('notifications').insert(notifications);
      }

      setComment('');
      toast.success(`Pedido ${nextStatus === 'rejected' ? 'recusado' : 'aprovado'} com sucesso.`);
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
        created_by: profile?.id
      }]);

    if (!error) {
      toast.success('Orçamento registrado.');
      setNewQuote({ supplier_name: '', price: '', description: '' });
      setShowQuoteForm(false);
      fetchRequest();
    } else {
      toast.error('Erro ao salvar orçamento.');
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
  const isApprover = profile?.role === request.current_step || profile?.role === 'master_admin';
  const isFinalized = request.status === 'approved' || request.status === 'rejected';

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-fade-up">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-[10px] font-black text-gp-muted uppercase tracking-[0.2em]">
        <button onClick={() => navigate('/solicitacoes')} className="hover:text-gp-blue transition-colors">Solicitações</button>
        <ChevronRight size={14} className="opacity-30" />
        <span className="text-gp-text truncate max-w-xs">{request.title}</span>
      </nav>

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
                <p className="text-[10px] font-black text-gp-blue-light uppercase tracking-[0.2em] mb-2 leading-none border-b border-gp-blue/10 pb-2 w-full text-right">ORÇAMENTO ESTIMADO</p>
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

            {/* Descrição */}
            <div className="py-10 space-y-5">
              <h3 className="text-[16px] font-black flex items-center gap-3 text-gp-text uppercase tracking-tight">
                <FileText size={20} className="text-gp-blue" strokeWidth={2.5} />
                Detalhamento da Necessidade
              </h3>
              <div className="bg-gp-surface2 p-6 sm:p-8 rounded-2xl border border-gp-border leading-relaxed text-gp-text2 text-[15px] font-medium whitespace-pre-wrap shadow-inner min-h-[120px]">
                {request.description}
              </div>
            </div>
          </div>

          {/* PAINEL DE ORÇAMENTOS E LICITAÇÃO */}
          {(!isFinalized || quotes.length > 0) && (
            <div className="gp-card p-6 sm:p-10 border-gp-purple/20 bg-gp-purple/[0.01]">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gp-purple text-white flex items-center justify-center shadow-lg shadow-gp-purple/20">
                    <Gavel size={24} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gp-text uppercase tracking-tight">Mapa de Cotações</h3>
                    <p className="text-[10px] font-black text-gp-purple uppercase tracking-[0.2em] mt-1 opacity-70">Auditoria de Preços e Fornecedores</p>
                  </div>
                </div>
                {(profile?.role === 'compras' || profile?.role === 'master_admin') && !isFinalized && (
                  <button 
                    onClick={() => setShowQuoteForm(!showQuoteForm)}
                    className="btn-premium-primary px-6 py-3 rounded-xl text-[10px] font-black"
                  >
                    {showQuoteForm ? 'CANCELAR' : 'NOVA COTAÇÃO'}
                  </button>
                )}
              </div>

              {showQuoteForm && (
                <div className="bg-gp-surface2 p-6 rounded-2xl border border-gp-border mb-8 animate-fade-down">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gp-muted uppercase tracking-widest ml-1">Fornecedor</label>
                      <input 
                        type="text" 
                        placeholder="Nome da empresa..."
                        className="gp-input h-12 px-5"
                        value={newQuote.supplier_name}
                        onChange={e => setNewQuote({...newQuote, supplier_name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gp-muted uppercase tracking-widest ml-1">Preço (R$)</label>
                      <div className="relative">
                        <div className="absolute left-4 top-3.5 font-black text-gp-muted text-sm">R$</div>
                        <input 
                          type="number" 
                          className="gp-input h-12 pl-12"
                          value={newQuote.price}
                          onChange={e => setNewQuote({...newQuote, price: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 mb-6">
                    <label className="text-[10px] font-black text-gp-muted uppercase tracking-widest ml-1">Observações</label>
                    <textarea 
                      className="gp-input p-5 h-24 resize-none"
                      placeholder="Ex: Entrega em 5 dias, garantia..."
                      value={newQuote.description}
                      onChange={e => setNewQuote({...newQuote, description: e.target.value})}
                    />
                  </div>
                  <button 
                    onClick={handleAddQuote}
                    className="w-full btn-premium-primary py-4 rounded-xl font-black uppercase text-[11px] tracking-widest"
                  >
                    SALVAR COTAÇÃO
                  </button>
                </div>
              )}

              <div className="space-y-4">
                {quotes.length === 0 ? (
                  <div className="py-12 text-center border-2 border-dashed border-gp-border rounded-2xl opacity-40">
                    <div className="gp-empty-icon mb-4"><Building2 size={32} /></div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-gp-muted">Aguardando orçamentos</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {quotes.map((quote) => (
                      <div 
                        key={quote.id} 
                        className={clsx(
                          "group p-6 rounded-2xl border transition-all relative overflow-hidden",
                          quote.is_selected 
                            ? "bg-gp-blue/5 border-gp-blue/30 shadow-lg" 
                            : "bg-gp-surface border-gp-border hover:border-gp-muted"
                        )}
                      >
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                          <div className="flex items-center gap-5">
                            <div className={clsx(
                              "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                              quote.is_selected ? "bg-gp-blue text-white" : "bg-gp-surface2 text-gp-muted border border-gp-border"
                            )}>
                              <Building2 size={24} />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-black text-lg text-gp-text truncate mb-1">{quote.supplier_name}</h4>
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black text-gp-muted uppercase tracking-widest">{new Date(quote.quote_date).toLocaleDateString()}</span>
                                {quote.is_selected && (
                                  <span className="gp-badge gp-badge-sm gp-badge-blue font-black uppercase text-[8px] tracking-widest">ESCOLHIDO</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-8 w-full md:w-auto mt-4 md:mt-0 border-t md:border-0 pt-4 md:pt-0">
                            <div className="text-right">
                              <p className="text-[10px] font-black text-gp-muted uppercase tracking-widest mb-1 opacity-60 leading-none">VALOR</p>
                              <p className={clsx("text-2xl font-black transition-colors", quote.is_selected ? "text-gp-blue" : "text-gp-text")}>
                                R$ {Number(quote.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {(profile?.role === 'compras' || profile?.role === 'master_admin') && !isFinalized && (
                                <>
                                  {!quote.is_selected && (
                                    <button 
                                      onClick={() => handleSelectQuote(quote)}
                                      className="btn-premium-ghost px-4 h-11 border-gp-blue/20 text-gp-blue"
                                    >
                                      ESCOLHER
                                    </button>
                                  )}
                                  <button 
                                    onClick={() => handleDeleteQuote(quote.id)}
                                    className="w-11 h-11 flex items-center justify-center text-gp-muted hover:text-gp-error rounded-xl transition-all"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        {quote.description && <p className="mt-4 text-[13px] font-medium text-gp-text2 italic border-t border-gp-border/30 pt-4">"{quote.description}"</p>}
                        {quote.is_selected && <div className="absolute right-0 bottom-0 opacity-[0.03] p-4"><ShieldCheck size={120} /></div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* LADO DIREITO: Assets e Ferramentas */}
        <div className="w-full lg:w-[400px] space-y-6 lg:sticky lg:top-24">
          <div className="gp-card overflow-hidden border-gp-blue/20 shadow-xl">
            <div className="p-6 bg-gp-surface2 border-b border-gp-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gp-blue text-white flex items-center justify-center">
                  <Paperclip size={18} strokeWidth={2.5} />
                </div>
                <h4 className="font-black text-[13px] text-gp-text uppercase tracking-widest">Ativos e Mídias</h4>
              </div>
              {(profile?.role === 'ti' || profile?.role === 'compras' || profile?.role === 'master_admin' || (profile?.id === request.user_id && request.status === 'adjustment_needed')) && (
                <label className="w-9 h-9 rounded-xl bg-gp-surface border border-gp-border flex items-center justify-center text-gp-blue hover:bg-gp-blue hover:text-white cursor-pointer transition-all">
                  {uploading ? <div className="w-4 h-4 border-2 border-current border-t-transparent animate-spin rounded-full" /> : <Plus size={18} strokeWidth={3} />}
                  <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                </label>
              )}
            </div>
            <div className="p-4 sm:p-6 space-y-6 max-h-[450px] overflow-y-auto">
              {links.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-gp-muted uppercase tracking-widest flex items-center gap-2 mb-4 leading-none"><ExternalLink size={12} strokeWidth={3} /> Referências</p>
                  <div className="space-y-2">
                    {links.map((link, i) => (
                      <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-gp-surface border border-gp-border rounded-xl hover:border-gp-blue transition-all group shadow-sm">
                        <span className="font-bold text-[13px] text-gp-text truncate pr-2">{link.label}</span>
                        <ChevronRight size={16} className="text-gp-muted group-hover:text-gp-blue transition-all" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {attachments.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-4 bg-gp-surface2 border border-gp-border rounded-xl group hover:border-gp-blue/40 transition-all shadow-sm">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-xl bg-gp-surface flex items-center justify-center shrink-0 border border-gp-border text-gp-muted shadow-inner">
                      {file.file_type?.startsWith('image/') ? <ImageIcon size={20} /> : <FileIcon size={20} />}
                    </div>
                    <div className="truncate">
                      <p className="font-black text-[12px] text-gp-text truncate leading-tight">{file.file_name}</p>
                      <p className="text-[9px] font-bold text-gp-muted uppercase mt-1">{(file.file_type || 'file').split('/')[1]}</p>
                    </div>
                  </div>
                  <a href={supabase.storage.from('request-attachments').getPublicUrl(file.file_path).data.publicUrl} target="_blank" download className="w-8 h-8 rounded-lg flex items-center justify-center text-gp-muted hover:text-gp-blue hover:bg-gp-blue/10"><Download size={16} /></a>
                </div>
              ))}
            </div>
          </div>

          {/* CENTRAL DE DECISÃO */}
          {isApprover && !isFinalized && (
            <div className="gp-card p-6 sm:p-8 border-gp-blue/40 bg-gp-blue/[0.01] space-y-6 relative overflow-hidden shadow-2xl">
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-gp-blue text-white flex items-center justify-center shadow-lg shadow-gp-blue/30 scale-105">
                  <ShieldCheck size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <h4 className="font-black text-[18px] tracking-tighter uppercase leading-none">Verificação Regional</h4>
                  <p className="text-[10px] uppercase font-black text-gp-blue-light tracking-[0.2em] mt-1.5 opacity-80 leading-none">Aguardando seu veredito</p>
                </div>
              </div>
              <div className="space-y-4 pt-2 relative z-10">
                <textarea 
                  placeholder="Justificativa (opcional)..."
                  className="gp-input px-5 py-4 h-24 resize-none text-[14px] font-medium leading-relaxed"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                />
                <div className="grid grid-cols-1 gap-3">
                  <button 
                    disabled={actionLoading}
                    onClick={() => {
                      let ns = ''; let nst = '';
                      if (request.status === 'pending_gestor') { ns = 'pending_ti'; nst = 'ti'; }
                      else if (request.status === 'pending_ti') { ns = 'pending_compras'; nst = 'compras'; }
                      else if (request.status === 'pending_compras') { ns = 'pending_diretoria'; nst = 'diretoria'; }
                      else if (request.status === 'pending_diretoria') { ns = 'pending_compras_final'; nst = 'compras'; }
                      else if (request.status === 'pending_compras_final') { ns = 'approved'; nst = 'compras'; }
                      handleAction(ns, nst);
                    }}
                    className="w-full btn-premium-primary py-4 rounded-xl text-[12px] font-black uppercase tracking-widest shadow-xl shadow-gp-blue/20"
                  >
                    {actionLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : 'Confirmar Aprovação'}
                  </button>
                  <button 
                    disabled={actionLoading}
                    onClick={() => handleAction('rejected', request.current_step)}
                    className="w-full btn-premium-ghost py-3.5 rounded-xl text-gp-error hover:bg-gp-error/5 border-gp-error/20 font-black uppercase text-[10px] tracking-widest"
                  >
                    Recusar Solicitação
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TIMELINE DE PROCESSO */}
          <div className="gp-card p-6 sm:p-8">
            <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-gp-muted mb-10 flex items-center gap-3 leading-none underline decoration-gp-blue/30 underline-offset-8">
              <Activity size={18} strokeWidth={3} /> Fluxo de Protocolo
            </h4>
            <div className="space-y-10 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gp-border">
              {[
                { step: 'gestor', label: 'Gestor Imediato', desc: 'SLA: 2h' },
                { step: 'ti', label: 'Auditoria TI', desc: 'SLA: 4h' },
                { step: 'compras', label: 'Cotação Compras', desc: 'Orçamentos' },
                { step: 'diretoria', label: 'Conselho Exec.', desc: 'Avaliação' },
                { step: 'compras_final', label: 'Compras Final', desc: 'Aquisição' },
              ].map((s, idx) => {
                const isActive = request.current_step === s.step && !isFinalized;
                const flowOrder = ['pending_gestor', 'pending_ti', 'pending_compras', 'pending_diretoria', 'pending_compras_final', 'approved'];
                const currentIdx = flowOrder.indexOf(request.status);
                const isPast = currentIdx > idx || request.status === 'approved';
                const isRejected = request.status === 'rejected' && request.current_step === s.step;
                
                return (
                  <div key={idx} className="relative pl-10 group">
                    <div className={clsx(
                      "absolute left-0 top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-500 z-10 shadow-sm",
                      isRejected ? "bg-gp-error border-gp-error text-white" :
                      isPast ? "bg-gp-success border-gp-success text-white" : 
                      isActive ? "bg-gp-blue border-gp-blue text-white ring-4 ring-gp-blue/10" : 
                      "bg-gp-surface border-gp-border text-gp-muted"
                    )}>
                      {isPast ? <CheckCircle2 size={12} strokeWidth={3} /> : 
                       isRejected ? <XCircle size={12} strokeWidth={3} /> :
                       <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                    </div>
                    <div className="flex flex-col">
                      <span className={clsx("font-black text-[13px] uppercase tracking-wide leading-none", 
                        isActive ? "text-gp-blue" : 
                        isPast ? "text-gp-text" : 
                        isRejected ? "text-gp-error" : "text-gp-muted"
                      )}>{s.label}</span>
                      <span className="text-[10px] font-bold text-gp-muted opacity-60 uppercase mt-1 tracking-tighter leading-none">{s.desc}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

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
  );
}
