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
import { assetService } from '../services/assetService';
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

const statusMap: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending_gestor: { label: 'Aguardando Gestor', color: 'text-amber-700', bg: 'bg-amber-100', icon: Clock },
  pending_ti: { label: 'Em Análise TI', color: 'text-blue-700', bg: 'bg-blue-100', icon: FileText },
  pending_compras: { label: 'Em Compras', color: 'text-indigo-700', bg: 'bg-indigo-100', icon: Clock },
  pending_diretoria: { label: 'Aguardando Diretoria', color: 'text-purple-700', bg: 'bg-purple-100', icon: Clock },
  approved: { label: 'Aprovado Final', color: 'text-emerald-700', bg: 'bg-emerald-100', icon: CheckCircle2 },
  rejected: { label: 'Recusado', color: 'text-rose-700', bg: 'bg-rose-100', icon: XCircle },
  adjustment_needed: { label: 'Ajuste Necessário', color: 'text-orange-700', bg: 'bg-orange-100', icon: AlertCircle },
};

export default function RequestDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [request, setRequest] = useState<Request | null>(null);
  const [links, setLinks] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLinked, setIsLinked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // States para edição técnica (TI/Compras)
  const [editValue, setEditValue] = useState('');
  const [newLink, setNewLink] = useState({ label: '', url: '' });

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const fetchRequest = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('requests')
      .select('*, profiles(full_name, email, department)')
      .eq('id', id)
      .single();

    if (!error && data) {
      setRequest(data);
      setEditValue(data.estimated_cost?.toString() || '');
      
      // Buscar links
      const { data: linksData } = await supabase
        .from('request_links')
        .select('*')
        .eq('request_id', id);
      setLinks(linksData || []);

      // Buscar anexos
      const { data: attachmentsData } = await supabase
        .from('request_attachments')
        .select('*')
        .eq('request_id', id);
      setAttachments(attachmentsData || []);

      // Verificar se já está no estoque
      const { data: assetData } = await supabase
        .from('assets')
        .select('id')
        .eq('request_id', id)
        .maybeSingle();
      
      setIsLinked(!!assetData);
    }
    setLoading(false);
  };

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

  const handleAddToStock = async () => {
    if (!request || !profile) return;
    setActionLoading(true);
    try {
      const nextPatrimony = await assetService.getNextPatrimonyNumber();
      const { error } = await assetService.createAsset({
        nome_item: request.title,
        descricao: request.description,
        numero_patrimonio: nextPatrimony,
        codigo_barras: nextPatrimony,
        categoria: request.category,
        valor: request.estimated_cost,
        status: 'em_estoque',
        request_id: request.id
      }, profile.id);

      if (!error) {
        setIsLinked(true);
        alert(`Ativo criado com sucesso! Patrimônio: ${nextPatrimony}`);
      } else {
        alert('Erro ao criar ativo: ' + error.message);
      }
    } catch (err: any) {
      alert('Erro: ' + err.message);
    } finally {
      setActionLoading(false);
    }
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

  if (loading) return <div className="p-20 text-center animate-pulse font-black text-slate-300 uppercase tracking-widest">Carregando Auditoria...</div>;
  if (!request) return <div className="p-20 text-center font-bold">Solicitação não encontrada ou acesso negado.</div>;

  const currentStatus = statusMap[request.status] || { label: request.status, color: 'text-slate-700', bg: 'bg-slate-100', icon: Clock };
  const isApprover = profile?.role === request.current_step || profile?.role === 'master_admin';
  const isFinalized = request.status === 'approved' || request.status === 'rejected';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <nav className="flex items-center gap-2 text-sm font-bold text-slate-400">
        <button onClick={() => navigate('/solicitacoes')} className="hover:text-primary-600 transition-colors">Solicitações</button>
        <ChevronRight size={14} />
        <span className="text-slate-900 dark:text-slate-100 truncate max-w-xs">{request.title}</span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* LADO ESQUERDO: Dados Principais */}
        <div className="flex-1 space-y-8 w-full">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm p-10">
             <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-10">
               <div>
                  <div className={clsx("inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black border mb-6", currentStatus.bg, currentStatus.color, "border-current/10")}>
                    <currentStatus.icon size={16} strokeWidth={3} />
                    {currentStatus.label.toUpperCase()}
                  </div>
                  <h1 className="text-4xl font-black text-slate-900 dark:text-white leading-tight">
                    {request.title}
                  </h1>
               </div>
               <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 flex flex-col items-end shrink-0">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Custo Estimado</p>
                  <p className="text-2xl font-black text-primary-600">
                    R$ {Number(request.estimated_cost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
               </div>
             </div>

             <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 py-8 border-y border-slate-50 dark:border-slate-800">
               <div className="space-y-2">
                  <p className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <User size={12} /> Solicitante
                  </p>
                  <p className="font-bold text-slate-900 dark:text-slate-100">{request.profiles?.full_name}</p>
               </div>
               <div className="space-y-2">
                  <p className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <Tag size={12} /> Categoria
                  </p>
                  <p className="font-bold text-slate-900 dark:text-slate-100">{request.category}</p>
               </div>
               <div className="space-y-2">
                  <p className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <Calendar size={12} /> Aberto em
                  </p>
                  <p className="font-bold text-slate-900 dark:text-slate-100">
                    {new Date(request.created_at).toLocaleDateString('pt-BR')}
                  </p>
               </div>
               <div className="space-y-2">
                  <p className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <Hash size={12} /> Protocolo
                  </p>
                  <p className="font-bold text-slate-400 tracking-tighter">#{request.id.slice(0, 8).toUpperCase()}</p>
               </div>
             </div>

             <div className="py-10 space-y-6">
                <h3 className="text-xl font-black flex items-center gap-2 tracking-tight">
                  <FileText size={22} className="text-primary-500" />
                  Contexto e Justificativa
                </h3>
                <div className="bg-slate-50 dark:bg-slate-950/50 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 leading-relaxed text-slate-600 dark:text-slate-400 font-medium whitespace-pre-wrap">
                  {request.description}
                </div>
             </div>

             {links.length > 0 && (
               <div className="pt-10 border-t border-slate-50 dark:border-slate-800 space-y-6">
                 <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <ExternalLink size={18} /> Links de Referência
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {links.map((link, i) => (
                      <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:border-primary-500 hover:shadow-lg transition-all group">
                         <span className="font-bold text-sm">{link.label}</span>
                         <ExternalLink size={16} className="text-slate-300 group-hover:text-primary-500" />
                      </a>
                    ))}
                 </div>
               </div>
             )}

             {/* MÓDULO DE ANEXOS */}
             <div className="pt-10 border-t border-slate-50 dark:border-slate-800 space-y-6">
               <div className="flex items-center justify-between">
                 <h3 className="text-xl font-black flex items-center gap-2 tracking-tight">
                   <Paperclip size={22} className="text-primary-500" />
                   Documentos e Evidências
                 </h3>
                 {(profile?.role === 'ti' || profile?.role === 'compras' || profile?.role === 'master_admin') && (
                   <label className={clsx(
                     "flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-black cursor-pointer transition-all active:scale-95",
                     uploading && "opacity-50 cursor-not-allowed"
                   )}>
                     {uploading ? (
                       <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                     ) : (
                       <Plus size={14} strokeWidth={3} />
                     )}
                     ANEXAR ARQUIVO
                     <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                   </label>
                 )}
               </div>

               {attachments.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {attachments.map((file) => {
                     const isImage = file.file_type?.startsWith('image/');
                     return (
                       <div key={file.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl group hover:border-primary-500 transition-all">
                         <div className="flex items-center gap-3 overflow-hidden">
                           <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-700 text-slate-400">
                             {isImage ? <ImageIcon size={20} /> : <FileIcon size={20} />}
                           </div>
                           <div className="truncate">
                             <p className="font-bold text-sm text-slate-700 dark:text-slate-200 truncate">{file.file_name}</p>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                               {new Date(file.created_at).toLocaleDateString('pt-BR')}
                             </p>
                           </div>
                         </div>
                         <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <a 
                             href={supabase.storage.from('request-attachments').getPublicUrl(file.file_path).data.publicUrl}
                             target="_blank"
                             download={file.file_name}
                             className="p-2 text-slate-400 hover:text-primary-600 transition-colors"
                           >
                             <Download size={18} />
                           </a>
                           {(profile?.role === 'ti' || profile?.role === 'compras' || profile?.role === 'master_admin') && (
                             <button 
                               onClick={() => handleDeleteAttachment(file)}
                               className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                             >
                               <Trash2 size={18} />
                             </button>
                           )}
                         </div>
                       </div>
                     );
                   })}
                 </div>
               ) : (
                 <div className="p-10 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
                   <Paperclip size={40} className="mx-auto text-slate-200 mb-4" />
                   <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Nenhum anexo enviado</p>
                 </div>
               )}
             </div>
          </div>
        </div>

        {/* LADO DIREITO: Timeline e Ações */}
        <div className="w-full lg:w-96 space-y-8 sticky top-24">
          
          {/* Central de Enriquecimento (TI e Compras) */}
          {(profile?.role === 'ti' || profile?.role === 'compras' || profile?.role === 'master_admin') && !isFinalized && (
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center">
                  <Activity size={20} />
                </div>
                <div>
                  <h4 className="font-black text-lg">Edição Técnica</h4>
                  <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Ajuste de Valor e Links</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Atualizar Valor (R$)</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <div className="absolute left-4 top-3 font-black text-slate-400 text-sm">R$</div>
                      <input 
                        type="number" 
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary-500 rounded-xl outline-none font-bold transition-all"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                      />
                    </div>
                    <button 
                      onClick={handleUpdateValue}
                      className="px-4 bg-primary-600 text-white rounded-xl font-black text-xs hover:bg-primary-500 transition-all"
                    >
                      OK
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-50 dark:border-slate-800 space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Novo Link de Referência</label>
                  <input 
                    type="text" 
                    placeholder="Título (ex: Amazon)"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary-500 rounded-xl outline-none font-bold text-sm transition-all"
                    value={newLink.label}
                    onChange={e => setNewLink({ ...newLink, label: e.target.value })}
                  />
                  <div className="flex gap-2">
                    <input 
                      type="url" 
                      placeholder="URL do Produto"
                      className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary-500 rounded-xl outline-none font-bold text-sm transition-all"
                      value={newLink.url}
                      onChange={e => setNewLink({ ...newLink, url: e.target.value })}
                    />
                    <button 
                      onClick={handleAddLink}
                      className="px-4 bg-slate-900 text-white rounded-xl font-black transition-all active:scale-95"
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
            <div className="bg-slate-950 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-primary-500/10 border border-primary-500/20 space-y-6">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary-600 flex items-center justify-center">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h4 className="font-black text-lg">Central de Decisão</h4>
                    <p className="text-[10px] uppercase font-black text-primary-400 tracking-widest">Pendente sua ação</p>
                  </div>
               </div>
               
               <div className="space-y-3 pt-2">
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
                    className="w-full bg-primary-600 hover:bg-primary-500 text-white font-black py-4 rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle2 size={20} strokeWidth={3} /> APROVAR ETAPA
                  </button>
                  <button 
                    disabled={actionLoading}
                    onClick={() => handleAction('rejected', request.current_step)}
                    className="w-full bg-white/10 hover:bg-rose-600 text-white font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 border border-white/10"
                  >
                    <XCircle size={20} /> REPROVAR TOTAL
                  </button>
               </div>
            </div>
          )}

          {/* Caixa de Estoque (Apenas p/ TI/Admin em solicitações aprovadas) */}
          {(profile?.role === 'ti' || profile?.role === 'master_admin') && request.status === 'approved' && (
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
                    <Plus size={20} />
                  </div>
                  <div>
                    <h4 className="font-black text-lg">Vínculo de Estoque</h4>
                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Integração Patrimonial</p>
                  </div>
               </div>

               {isLinked ? (
                 <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 p-4 rounded-2xl flex items-center gap-2">
                    <CheckCircle2 size={18} />
                    <span className="font-bold text-sm">Item já integrado ao inventário.</span>
                 </div>
               ) : (
                 <button 
                   disabled={actionLoading}
                   onClick={handleAddToStock}
                   className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                 >
                   {actionLoading ? 'PROCESSANDO...' : (
                     <>
                       <Plus size={20} strokeWidth={3} /> ADICIONAR AO ESTOQUE
                     </>
                   )}
                 </button>
               )}
            </div>
          )}

          {/* Timeline Vertical do Fluxo */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
             <h4 className="font-black text-sm uppercase tracking-widest text-slate-400 mb-8 flex items-center gap-2">
                <Activity size={18} /> Fluxo de Processo
             </h4>
             <div className="space-y-10 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
                {[
                  { step: 'gestor', label: 'Gestor Imediato', desc: 'Validação de necessidade' },
                  { step: 'ti', label: 'Análise de TI', desc: 'Viabilidade técnica' },
                  { step: 'compras', label: 'Cotação Compras', desc: 'Melhor custo/benefício' },
                  { step: 'diretoria', label: 'Diretoria Executiva', desc: 'Aprovação orçamentária' },
                ].map((s, idx) => {
                  const isActive = request.current_step === s.step;
                  const isPast = ['pending_ti', 'pending_compras', 'pending_diretoria', 'approved'].indexOf(request.status) > idx;
                  
                  return (
                    <div key={idx} className="relative pl-10 group">
                      <div className={clsx(
                        "absolute left-0 top-1 w-6 h-6 rounded-full border-4 flex items-center justify-center transition-all duration-500",
                        isPast ? "bg-emerald-500 border-emerald-100 dark:border-emerald-900/30 text-white" : 
                        isActive ? "bg-primary-600 border-primary-100 dark:border-primary-900/30 text-white scale-125 shadow-lg shadow-primary-500/20" : 
                        "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-300"
                      )}>
                        {isPast ? <CheckCircle2 size={12} strokeWidth={3} /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                      </div>
                      <div className="flex flex-col">
                        <span className={clsx("font-black text-sm", isActive ? "text-primary-600" : isPast ? "text-slate-900 dark:text-slate-100" : "text-slate-400")}>
                          {s.label}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{s.desc}</span>
                      </div>
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
