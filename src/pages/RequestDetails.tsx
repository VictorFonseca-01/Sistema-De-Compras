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
  File as FileIcon
} from 'lucide-react';
import { clsx } from 'clsx';

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

const statusMap: Record<string, { label: string; badge: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }> }> = {
  pending_gestor:    { label: 'Aguardando Gestor',    badge: 'gp-badge-amber',  icon: Clock },
  pending_ti:        { label: 'Em Análise TI',        badge: 'gp-badge-blue',   icon: FileText },
  pending_compras:   { label: 'Em Compras',           badge: 'gp-badge-purple', icon: Clock },
  pending_diretoria: { label: 'Aguardando Diretoria', badge: 'gp-badge-purple', icon: Clock },
  approved:          { label: 'Aprovado Final',       badge: 'gp-badge-green',  icon: CheckCircle2 },
  rejected:          { label: 'Recusado',             badge: 'gp-badge-red',    icon: XCircle },
  adjustment_needed: { label: 'Ajuste Necessário',    badge: 'gp-badge-amber',  icon: AlertCircle },
};

export default function RequestDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useProfile();
  const statusLabels: Record<string, string> = {
    pending_gestor: 'Aguardando Gestor',
    pending_ti: 'Em Análise TI',
    pending_compras: 'Em Compras',
    pending_diretoria: 'Aguardando Diretoria',
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
  
  // States para edição técnica (TI/Compras)
  const [editValue, setEditValue] = useState('');
  const [newLink, setNewLink] = useState({ label: '', url: '' });
  const [history, setHistory] = useState<RequestHistory[]>([]);
  const [comment, setComment] = useState('');

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

    // O RLS agora cuida da segurança no banco de dados.
    // Para a UI, apenas validamos se o dado retornou.
    if (!data) {
      navigate('/solicitacoes');
      return;
    }

    setRequest(data);
    setEditValue(data.estimated_cost?.toString() || '');
    setLoading(false);

    // Fetch related data
    const { data: linkData } = await supabase.from('request_links').select('*').eq('request_id', id);
    if (linkData) setLinks(linkData);

    const { data: attachData } = await supabase.from('request_attachments').select('*').eq('request_id', id);
    if (attachData) setAttachments(attachData);

    const { data: historyData } = await supabase.from('request_status_history').select('*, profiles(full_name)').eq('request_id', id).order('created_at', { ascending: false });
    if (historyData) setHistory(historyData);
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

      fetchRequest();
    } catch (err: any) {
      alert('Erro no upload: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAttachment = async (attachment: Attachment) => {
    if (!confirm('Deseja excluir este anexo?')) return;

    try {
      await supabase.storage.from('request-attachments').remove([attachment.file_path]);
      await supabase.from('request_attachments').delete().eq('id', attachment.id);
      fetchRequest();
    } catch (err: any) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  const handleAddLink = async () => {
    if (!newLink.label || !newLink.url || !id) return;
    
    const { error } = await supabase
      .from('request_links')
      .insert([{
        request_id: id,
        label: newLink.label,
        url: newLink.url
      }]);

    if (!error) {
      setNewLink({ label: '', url: '' });
      fetchRequest();
    }
  };

  const handleUpdateValue = async () => {
    if (!id) return;
    const { error } = await supabase
      .from('requests')
      .update({ estimated_cost: parseFloat(editValue) })
      .eq('id', id);

    if (!error) {
      alert('Valor atualizado com sucesso!');
      fetchRequest();
    }
  };



  const handleAction = async (nextStatus: string, nextStep: string, actionComment?: string) => {
    if (!request || !profile) return;
    setActionLoading(true);
    
    // 1. Atualizar o status da solicitação
    const { error: updateError } = await supabase
      .from('requests')
      .update({ 
        status: nextStatus,
        current_step: nextStep
      })
      .eq('id', request.id);

    if (!updateError) {
      // 2. Registrar no histórico de auditoria
      await supabase.from('request_status_history').insert([{
        request_id: request.id,
        old_status: request.status,
        new_status: nextStatus,
        changed_by: profile.id,
        comment: actionComment || comment || 'Status atualizado pela central de decisão.'
      }]);

      // 3. Notificações Inteligentes
      const notifications = [];

      // A. Notificar o Solicitante sempre
      notifications.push({
        user_id: request.user_id,
        title: `Pedido ${nextStatus === 'rejected' ? 'Recusado' : 'Atualizado'}`,
        message: `Sua solicitação "${request.title}" avançou para: ${statusLabels[nextStatus] || nextStatus}.`,
        link: `/solicitacoes/${request.id}`
      });

      // B. Notificar o próximo Time de Aprovação
      if (['pending_ti', 'pending_compras', 'pending_diretoria'].includes(nextStatus)) {
        const targetRole = nextStep; // 'ti', 'compras', ou 'diretoria'
        const { data: team } = await supabase.from('profiles').select('id').eq('role', targetRole);
        
        if (team) {
          team.forEach(member => {
            if (member.id !== profile.id) { // Não notificar quem acabou de aprovar
              notifications.push({
                user_id: member.id,
                title: 'Ação Necessária: Pendência',
                message: `Há uma solicitação de "${request.title}" aguardando sua análise técnica/financeira.`,
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
      fetchRequest();
    } else {
      alert('Erro ao processar ação: ' + updateError.message);
    }
    setActionLoading(false);
  };

  if (loading) return (
    <div className="max-w-6xl mx-auto space-y-8 animate-pulse pb-20">
      <div className="h-4 w-48 bg-gp-surface2 rounded mb-6" />
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 gp-card p-10 h-[600px]" />
        <div className="w-full lg:w-96 space-y-8">
           <div className="gp-card p-8 h-64" />
           <div className="gp-card p-8 h-96" />
        </div>
      </div>
    </div>
  );
  if (!request) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-up">
      <div className="w-20 h-20 bg-gp-surface2 text-gp-text3 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner">
        <AlertCircle size={40} />
      </div>
      <h2 className="text-2xl font-bold text-gp-text mb-2">Solicitação não encontrada</h2>
      <p className="text-gp-text3 font-medium">Você não tem permissão para acessar este item ou ele foi removido ou arquivado.</p>
      <button onClick={() => navigate('/solicitacoes')} className="mt-8 btn-premium-secondary px-8 py-3 rounded-xl">Voltar à Lista</button>
    </div>
  );

  const currentStatus = statusMap[request.status] || { label: request.status, badge: 'gp-badge-gray', icon: Clock };
  const isApprover = profile?.role === request.current_step || profile?.role === 'master_admin';
  const isFinalized = request.status === 'approved' || request.status === 'rejected';

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-fade-up">
      <nav className="flex items-center gap-2 text-[12px] font-bold text-gp-text3 uppercase tracking-wider">
        <button onClick={() => navigate('/solicitacoes')} className="hover:text-gp-blue transition-colors">Solicitações</button>
        <ChevronRight size={14} className="opacity-40" />
        <span className="text-gp-text truncate max-w-xs">{request.title}</span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* LADO ESQUERDO: Dados Principais */}
        <div className="flex-1 space-y-6 w-full">
          <div className="gp-card p-8 sm:p-10">
             <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-10 overflow-hidden">
                <div className="flex-1 space-y-4">
                   <div className={clsx("gp-badge", currentStatus.badge)}>
                     <currentStatus.icon size={13} strokeWidth={3} />
                     {currentStatus.label.toUpperCase()}
                   </div>
                   <h1 className="gp-page-title text-3xl leading-tight">
                     {request.title}
                   </h1>
                </div>
                <div className="bg-gp-blue/5 border border-gp-blue/20 p-6 rounded-2xl flex flex-col items-end shrink-0 shadow-inner group">
                   <p className="text-[10px] font-bold text-gp-text3 uppercase tracking-widest mb-1 shadow-sm px-2 py-0.5 bg-gp-surface2 rounded-md">VALOR ESTIMADO</p>
                   <p className="text-3xl font-black text-gp-blue group-hover:scale-105 transition-transform">
                     R$ {Number(request.estimated_cost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                   </p>
                </div>
             </div>

             <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 py-8 border-y border-gp-border">
               <div className="space-y-2">
                  <p className="flex items-center gap-1.5 text-[10px] font-bold text-gp-text3 uppercase tracking-widest ml-1">
                    <User size={12} strokeWidth={2.5} /> Solicitante
                  </p>
                  <p className="font-bold text-gp-text ml-1 text-sm">{request.profiles?.full_name}</p>
               </div>
               <div className="space-y-2">
                  <p className="flex items-center gap-1.5 text-[10px] font-bold text-gp-text3 uppercase tracking-widest ml-1">
                    <Tag size={12} strokeWidth={2.5} /> Categoria
                  </p>
                  <p className="font-bold text-gp-text ml-1 text-sm">{request.category}</p>
               </div>
               <div className="space-y-2">
                  <p className="flex items-center gap-1.5 text-[10px] font-bold text-gp-text3 uppercase tracking-widest ml-1">
                    <Calendar size={12} strokeWidth={2.5} /> Aberto em
                  </p>
                  <p className="font-bold text-gp-text ml-1 text-sm">
                    {new Date(request.created_at).toLocaleDateString('pt-BR')}
                  </p>
               </div>
               <div className="space-y-2">
                  <p className="flex items-center gap-1.5 text-[10px] font-bold text-gp-text3 uppercase tracking-widest ml-1">
                    <Hash size={12} strokeWidth={2.5} /> Protocolo
                  </p>
                  <p className="font-bold text-gp-text3 tracking-wider ml-1 text-xs select-all">#{request.id.slice(0, 8).toUpperCase()}</p>
               </div>
             </div>

             <div className="py-10 space-y-4">
                <h3 className="text-[17px] font-bold flex items-center gap-3 text-gp-text tracking-tight">
                  <FileText size={20} className="text-gp-blue" strokeWidth={2} />
                  Contexto e Justificativa
                </h3>
                <div className="bg-gp-surface2/50 p-8 rounded-2xl border border-gp-border leading-relaxed text-gp-text2 text-[15px] font-medium whitespace-pre-wrap shadow-inner">
                  {request.description}
                  {/* Seções de links e anexos removidas daqui para serem consolidadas no painel lateral */}
                </div>
             </div>
          </div>
        </div>

        {/* LADO DIREITO: Timeline e Ações */}
        <div className="w-full lg:w-96 space-y-6 lg:sticky lg:top-24">
          
          {/* PAINEL CONSOLIDADO DE ATIVOS (NOVO) */}
          <div className="gp-card overflow-hidden border-gp-blue/30 border-2 shadow-2xl">
            <div className="p-6 bg-gp-surface2 border-b border-gp-border flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gp-blue text-white flex items-center justify-center">
                    <Paperclip size={16} strokeWidth={2.5} />
                  </div>
                  <h4 className="font-bold text-[14px] text-gp-text uppercase tracking-tight">Ativos e Mídias</h4>
               </div>
               {(profile?.role === 'ti' || profile?.role === 'compras' || profile?.role === 'master_admin' || (profile?.id === request.user_id && request.status === 'adjustment_needed')) && (
                  <label className="w-8 h-8 rounded-lg bg-gp-surface border border-gp-border flex items-center justify-center text-gp-blue hover:bg-gp-blue hover:text-white cursor-pointer transition-all shadow-sm">
                    <Plus size={16} strokeWidth={3} />
                    <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                  </label>
               )}
            </div>
            
            <div className="p-5 space-y-5 max-h-[400px] overflow-y-auto custom-scrollbar">
               {/* Links */}
               {links.length > 0 && (
                 <div className="space-y-3">
                   <p className="text-[10px] font-black text-gp-text3 uppercase tracking-widest flex items-center gap-2">
                     <ExternalLink size={12} /> Referências Web
                   </p>
                   <div className="space-y-2">
                     {links.map((link, i) => (
                       <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-gp-surface border border-gp-border rounded-lg hover:border-gp-blue transition-all group">
                          <span className="font-bold text-[12px] text-gp-text truncate pr-2">{link.label}</span>
                          <ChevronRight size={14} className="text-gp-text3 group-hover:text-gp-blue transition-all" />
                       </a>
                     ))}
                   </div>
                 </div>
               )}

               {/* Arquivos */}
               {attachments.length > 0 && (
                 <div className="space-y-3 pt-2 border-t border-gp-border">
                   <p className="text-[10px] font-black text-gp-text3 uppercase tracking-widest flex items-center gap-2">
                     <FileIcon size={12} /> Documentos & Fotos
                   </p>
                   <div className="space-y-2">
                     {attachments.map((file) => {
                       const isImage = file.file_type?.startsWith('image/');
                       return (
                         <div key={file.id} className="flex items-center justify-between p-3 bg-gp-surface2 border border-gp-border rounded-lg group hover:border-gp-blue/40 transition-all">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className="w-8 h-8 rounded-lg bg-gp-surface flex items-center justify-center shrink-0 border border-gp-border text-gp-text3">
                                {isImage ? <ImageIcon size={16} /> : <FileIcon size={16} />}
                              </div>
                              <div className="truncate">
                                <p className="font-bold text-[11px] text-gp-text truncate">{file.file_name}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <a 
                                href={supabase.storage.from('request-attachments').getPublicUrl(file.file_path).data.publicUrl}
                                target="_blank"
                                download={file.file_name}
                                className="p-1.5 text-gp-text3 hover:text-gp-blue transition-colors"
                                title="Visualizar / Baixar"
                              >
                                {isImage ? <ImageIcon size={14} /> : <Download size={14} />}
                              </a>
                              {(profile?.role === 'ti' || profile?.role === 'compras' || profile?.role === 'master_admin') && (
                                <button 
                                  onClick={() => handleDeleteAttachment(file)}
                                  className="p-1.5 text-gp-text3 hover:text-gp-error transition-colors"
                                  title="Excluir"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                         </div>
                       );
                     })}
                   </div>
                 </div>
               )}

               {links.length === 0 && attachments.length === 0 && (
                 <div className="py-6 text-center opacity-40">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-gp-text3">Nenhum ativo vinculado</p>
                 </div>
               )}
            </div>
          </div>
          
          {/* Central de Enriquecimento (TI e Compras) */}
          {(profile?.role === 'ti' || profile?.role === 'compras' || profile?.role === 'master_admin') && !isFinalized && (
            <div className="gp-card p-8 border-gp-blue/20 shadow-lg space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gp-blue/10 text-gp-blue flex items-center justify-center">
                  <Activity size={20} strokeWidth={2} />
                </div>
                <div>
                  <h4 className="font-bold text-[15px] text-gp-text">Edição Técnica</h4>
                  <p className="text-[10px] uppercase font-bold text-gp-text3 tracking-widest">Ajuste de Valor e Links</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gp-text3 uppercase tracking-widest ml-1">Atualizar Valor (R$)</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <div className="absolute left-4 top-3.5 font-bold text-gp-text3 text-sm">R$</div>
                      <input 
                        type="number" 
                        className="gp-input pl-10 h-11"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                      />
                    </div>
                    <button 
                      onClick={handleUpdateValue}
                      className="btn-premium-primary px-5 rounded-xl text-[11px] h-11"
                    >
                      OK
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-gp-border space-y-3">
                  <label className="text-[11px] font-bold text-gp-text3 uppercase tracking-widest ml-1">Novo Link de Referência</label>
                  <input 
                    type="text" 
                    placeholder="Título (ex: Amazon)"
                    className="gp-input h-11 px-4 py-3"
                    value={newLink.label}
                    onChange={e => setNewLink({ ...newLink, label: e.target.value })}
                  />
                  <div className="flex gap-2">
                    <input 
                      type="url" 
                      placeholder="URL do Produto"
                      className="flex-1 gp-input h-11 px-4 py-3"
                      value={newLink.url}
                      onChange={e => setNewLink({ ...newLink, url: e.target.value })}
                    />
                    <button 
                      onClick={handleAddLink}
                      className="btn-premium-dark px-4 rounded-xl h-11"
                    >
                      <Plus size={18} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Caixa de Decisão (Apenas p/ Aprovador) */}
          {isApprover && !isFinalized && (
            <div className="bg-gp-surface text-gp-text rounded-2xl p-8 shadow-2xl border-2 border-gp-blue/40 space-y-6 relative overflow-hidden">
               <div className="flex items-center gap-3 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-gp-blue text-white flex items-center justify-center shadow-lg shadow-gp-blue/20">
                    <ShieldCheck size={20} strokeWidth={2} />
                  </div>
                  <div>
                    <h4 className="font-bold text-[17px] tracking-tight">Central de Decisão</h4>
                    <p className="text-[10px] uppercase font-bold text-gp-blue-light tracking-widest">Pendente sua ação</p>
                  </div>
               </div>
               
               <div className="space-y-3 pt-2 relative z-10">
                  <textarea 
                    placeholder="Adicionar observação (opcional)..."
                    className="gp-input px-4 py-3 h-20 resize-none text-[13px] font-medium"
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    rows={2}
                  />
                  <button 
                    disabled={actionLoading}
                    onClick={() => {
                      let nextStatus = ''; let nextStep = '';
                      if (request.status === 'pending_gestor') { nextStatus = 'pending_ti'; nextStep = 'ti'; }
                      else if (request.status === 'pending_ti') { nextStatus = 'pending_compras'; nextStep = 'compras'; }
                      else if (request.status === 'pending_compras') { nextStatus = 'pending_diretoria'; nextStep = 'diretoria'; }
                      else if (request.status === 'pending_diretoria') { nextStatus = 'approved'; nextStep = 'diretoria'; }
                      handleAction(nextStatus, nextStep);
                    }}
                    className="w-full btn-premium-primary py-4 rounded-xl text-[12px] shadow-lg"
                  >
                    {actionLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : ( <CheckCircle2 size={18} strokeWidth={3} className="mr-2" /> )} APROVAR ETAPA
                  </button>
                  <button 
                    disabled={actionLoading}
                    onClick={() => handleAction('rejected', request.current_step)}
                    className="w-full bg-gp-surface2 hover:bg-gp-error hover:text-white border border-gp-border font-bold text-[12px] py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    {actionLoading ? (
                       <div className="w-5 h-5 border-2 border-gp-error/30 border-t-gp-error rounded-full animate-spin" />
                    ) : ( <XCircle size={18} className="mr-2" /> )} REPROVAR TOTAL
                  </button>
               </div>
               <div className="absolute top-0 right-0 w-32 h-32 bg-gp-blue opacity-[0.03] rounded-full -translate-y-12 translate-x-12" />
            </div>
          )}

          {/* Timeline Vertical do Fluxo */}
          <div className="gp-card p-8 shadow-sm">
             <h4 className="font-bold text-[11px] uppercase tracking-widest text-gp-text3 mb-8 flex items-center gap-2.5">
                <Activity size={18} strokeWidth={2} /> Fluxo de Processo
             </h4>
             <div className="space-y-10 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gp-border">
                {[
                  { step: 'gestor', label: 'Gestor Imediato', desc: 'Validação de necessidade' },
                  { step: 'ti', label: 'Análise de TI', desc: 'Viabilidade técnica' },
                  { step: 'compras', label: 'Cotação Compras', desc: 'Melhor custo/benefício' },
                  { step: 'diretoria', label: 'Diretoria Executiva', desc: 'Aprovação orçamentária' },
                ].map((s, idx) => {
                  const isActive = request.current_step === s.step && !isFinalized;
                  const isPast = ['pending_ti', 'pending_compras', 'pending_diretoria', 'approved'].indexOf(request.status) > idx;
                  const isRejected = request.status === 'rejected' && request.current_step === s.step;
                  
                  return (
                    <div key={idx} className="relative pl-10 group">
                      <div className={clsx(
                        "absolute left-0 top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-500 z-10",
                        isRejected ? "bg-gp-error border-gp-error shadow-lg shadow-gp-error/20 text-white" :
                        isPast ? "bg-gp-success border-gp-success text-white shadow-lg shadow-gp-success/10" : 
                        isActive ? "bg-gp-blue border-gp-blue text-white scale-110 shadow-lg shadow-gp-blue/20" : 
                        "bg-gp-surface border-gp-border text-gp-text3"
                      )}>
                        {isPast ? <CheckCircle2 size={12} strokeWidth={3} /> : 
                         isRejected ? <XCircle size={12} strokeWidth={3} /> :
                         <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                      </div>
                      <div className="flex flex-col">
                        <span className={clsx("font-bold text-[13px]", 
                          isActive ? "text-gp-blue" : 
                          isPast ? "text-gp-text" : 
                          isRejected ? "text-gp-error" : "text-gp-text3"
                        )}>
                          {s.label}
                        </span>
                        <span className="text-[10px] font-bold text-gp-text3 opacity-60 uppercase tracking-tighter">{s.desc}</span>
                      </div>
                    </div>
                  );
                })}
             </div>
          </div>

          {/* Histórico de Auditoria Real */}
          {history.length > 0 && (
            <div className="gp-card p-8 shadow-sm">
               <h4 className="font-bold text-[11px] uppercase tracking-widest text-gp-text3 mb-8 flex items-center gap-2.5">
                  <Clock size={18} strokeWidth={2} /> Auditoria do Sistema
               </h4>
               <div className="space-y-6">
                  {history.map((h, i) => (
                    <div key={i} className="flex gap-4 items-start border-l-2 border-gp-border pl-6 relative">
                       <div className="absolute left-[-5px] top-1.5 w-2 h-2 rounded-full bg-gp-border"></div>
                       <div className="space-y-1.5 w-full">
                          <p className="text-[11px] font-bold text-gp-text leading-tight uppercase tracking-tight">
                            {statusLabels[h.new_status] || h.new_status}
                          </p>
                          <p className="text-[12px] font-medium text-gp-text2 italic leading-relaxed bg-gp-surface2/50 p-3 rounded-lg border border-gp-border">
                            "{h.comment || 'Sem observação registrada.'}"
                          </p>
                          <div className="flex items-center justify-between mt-2">
                             <div className="flex items-center gap-1.5">
                               <div className="w-4 h-4 bg-gp-blue/10 rounded-full flex items-center justify-center">
                                 <User size={8} className="text-gp-blue" />
                               </div>
                               <span className="text-[9px] font-bold text-gp-text3 uppercase">
                                  {h.profiles?.full_name?.split(' ')[0] || 'Sistema'}
                               </span>
                             </div>
                             <span className="text-[9px] font-bold text-gp-text3 opacity-40">
                                {new Date(h.created_at).toLocaleDateString('pt-BR')} {new Date(h.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                             </span>
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
