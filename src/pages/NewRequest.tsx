import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  Send, 
  ArrowLeft, 
  Link as LinkIcon, 
  Trash2,
  CheckCircle,
  AlertCircle,
  FileText,
  BadgeDollarSign,
  Zap,
  Plus,
  Info,
  Image as ImageIcon,
  File as FileIcon,
  Paperclip
} from 'lucide-react';


import { useProfile } from '../hooks/useProfile';
import { SearchableSelect } from '../components/SearchableSelect';
import { toast } from 'react-hot-toast';

type Priority = 'baixa' | 'media' | 'alta' | 'critica';

const categoriaOptions = [
  { value: "Mouse", label: "Mouse" },
  { value: "Teclado", label: "Teclado" },
  { value: "Fone de Ouvido", label: "Fone de Ouvido" },
  { value: "Câmera", label: "Câmera" },
  { value: "Computador", label: "Computador" },
  { value: "Notebook", label: "Notebook" },
  { value: "Celular", label: "Celular" },
  { value: "Adaptadores em geral (especifique na descrição)", label: "Adaptadores em geral (especifique na descrição)" },
  { value: "Hardware", label: "Hardware" },
  { value: "Software / Licenças", label: "Software / Licenças" },
  { value: "Acessórios", label: "Acessórios" },
  { value: "Serviços / Nuvem", label: "Serviços / Nuvem" },
  { value: "Infraestrutura", label: "Infraestrutura" }
];

const prioridadeOptions = [
  { value: 'baixa', label: 'Baixa' },
  { value: 'media', label: 'Média' },
  { value: 'alta', label: 'Alta' },
  { value: 'critica', label: 'Crítica (Interrupção de serviço)' },
];

const labelClass = 'block text-[10px] font-black uppercase tracking-[0.2em] mb-2.5 text-gp-muted ml-0.5 leading-none';

export default function NewRequest() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { profile } = useProfile();
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Hardware',
    estimated_cost: '',
    priority: 'media' as Priority,
  });

  const [links, setLinks] = useState<{ label: string; url: string }[]>([]);
  const [newLink, setNewLink] = useState({ label: '', url: '' });
  const [tempAttachments, setTempAttachments] = useState<{ file: File; id: string }[]>([]);

  const addLink = () => {
    if (newLink.label && newLink.url) {
      setLinks([...links, newLink]);
      setNewLink({ label: '', url: '' });
      toast.success('Link adicionado à fila.');
    }
  };

  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newAttachments = files.map(file => ({
      file,
      id: Math.random().toString(36).substring(7)
    }));
    setTempAttachments([...tempAttachments, ...newAttachments]);
    toast.success(`${files.length} arquivo(s) selecionado(s).`);
  };

  const removeAttachment = (id: string) => {
    setTempAttachments(tempAttachments.filter(a => a.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError('Sessão expirada. Faça login novamente.');
      setLoading(false);
      return;
    }

    // Validação específica para TI
    if (profile?.role === 'ti') {
      if (!form.estimated_cost) {
        setError('Analistas de TI devem informar o valor estimado.');
        setLoading(false);
        return;
      }
      if (links.length === 0) {
        setError('Analistas de TI devem anexar pelo menos um link de referência.');
        setLoading(false);
        return;
      }
    }

    try {
      let finalCompanyId = profile?.company_id;
      let finalDepartmentId = profile?.department_id;

      const { data: request, error: requestError } = await supabase
        .from('requests')
        .insert([{
          user_id: user.id,
          title: form.title,
          description: form.description,
          category: form.category,
          estimated_cost: form.estimated_cost ? parseFloat(form.estimated_cost) : null,
          priority: form.priority,
          status: 'pending_gestor',
          current_step: 'gestor',
          company_id: finalCompanyId,
          department_id: finalDepartmentId
        }])
        .select()
        .single();

      if (requestError) throw requestError;

      if (request && profile?.department) {
        const { data: gestores } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'gestor')
          .eq('department', profile.department);

        if (gestores && gestores.length > 0) {
          const notificationsToInsert = gestores.map(g => ({
            user_id: g.id,
            title: 'Nova Solicitação Pendente',
            message: `O colaborador ${profile.full_name} criou uma nova solicitação: "${form.title}".`,
            link: `/solicitacoes/${request.id}`
          }));
          await supabase.from('notifications').insert(notificationsToInsert);
        }
      }

      if (links.length > 0 && request) {
        const linksToInsert = links.map(l => ({
          request_id: request.id,
          label: l.label,
          url: l.url
        }));
        await supabase.from('request_links').insert(linksToInsert);
      }

      if (tempAttachments.length > 0 && request) {
        for (const item of tempAttachments) {
          const fileExt = item.file.name.split('.').pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const filePath = `${request.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('request-attachments')
            .upload(filePath, item.file);

          if (!uploadError) {
            await supabase.from('request_attachments').insert([{
              request_id: request.id,
              file_name: item.file.name,
              file_path: filePath,
              file_type: item.file.type
            }]);
          }
        }
      }

      setSuccess(true);
      toast.success('Solicitação protocolada com sucesso!');
      setTimeout(() => navigate('/solicitacoes'), 2500);
    } catch (err: any) {
      setError('Falha ao registrar pedido: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center animate-fade-up px-6">
        <div className="gp-card p-12 max-w-lg flex flex-col items-center shadow-2xl">
          <div className="w-20 h-20 bg-gp-success/10 text-gp-success rounded-3xl flex items-center justify-center mb-8 shadow-inner border border-gp-success/20">
            <CheckCircle size={40} strokeWidth={3} />
          </div>
          <h2 className="text-2xl font-black text-gp-text mb-3 uppercase tracking-tight">Pedido Protocolado</h2>
          <p className="text-gp-text2 text-[15px] font-medium leading-relaxed">
            Sua requisição foi enviada ao servidor e já está na fila de aprovação do seu gestor imediato.
          </p>
          <div className="mt-10 flex items-center gap-3 py-3.5 px-8 bg-gp-surface2 rounded-xl border border-gp-border">
             <div className="w-4 h-4 border-2 border-gp-border2 border-t-gp-blue rounded-full animate-spin" />
             <span className="text-[11px] font-black text-gp-muted uppercase tracking-widest">Aguarde...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 pb-16 px-4 sm:px-0 animate-fade-up">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
           <button 
             onClick={() => navigate(-1)}
             className="flex items-center gap-2 text-gp-muted font-black hover:text-gp-blue transition-colors mb-4 text-[10px] uppercase tracking-[0.2em]"
           >
             <ArrowLeft size={14} strokeWidth={3} /> Voltar à Lista
           </button>
           <h1 className="gp-page-title">Nova Solicitação</h1>
           <p className="gp-page-subtitle">Inicie um novo processo de aquisição de infraestrutura corporativa.</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="flex items-center gap-4 p-5 bg-gp-error/10 border border-gp-error/20 text-gp-error rounded-2xl animate-shake">
            <div className="w-10 h-10 bg-gp-error/10 rounded-xl flex items-center justify-center shrink-0">
              <AlertCircle size={22} strokeWidth={3} />
            </div>
            <p className="font-bold text-[14px] leading-tight">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          {/* Seção 1: Identificação */}
          <section className="gp-card p-6 sm:p-10 space-y-8">
            <div className="flex items-center gap-4 py-2 border-b border-gp-border">
              <div className="w-10 h-10 rounded-xl bg-gp-blue-muted text-gp-blue-light flex items-center justify-center">
                <Zap size={22} strokeWidth={2.5} />
              </div>
              <h3 className="text-[16px] font-black text-gp-text tracking-tight uppercase">Identificação Estrutural</h3>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-1">
                <label className={labelClass}>Título do Pedido</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Novo Notebook para Desenvolvedor Backend"
                  className="gp-input"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className={labelClass}>Categoria Corporativa</label>
                  <SearchableSelect 
                    options={categoriaOptions}
                    value={form.category}
                    onChange={(val) => setForm({ ...form, category: val })}
                    placeholder="Selecione..."
                  />
                </div>
                <div className="flex items-center gap-4 p-5 bg-gp-blue/[0.02] border border-gp-blue/10 rounded-2xl shadow-inner">
                   <Info size={20} className="text-gp-blue-light flex-shrink-0" strokeWidth={2.5} />
                   <p className="text-[12px] font-medium text-gp-text3 leading-snug">
                     A triagem técnica da equipe de TI depende da categorização correta do item solicitado.
                   </p>
                </div>
              </div>
            </div>
          </section>

          {/* Seção 2: Prioridade e Custo */}
          <section className="gp-card p-6 sm:p-10 space-y-8">
             <div className="flex items-center gap-4 py-2 border-b border-gp-border">
              <div className="w-10 h-10 rounded-xl bg-gp-amber/10 text-gp-amber flex items-center justify-center border border-gp-amber/20 shadow-inner">
                <BadgeDollarSign size={22} strokeWidth={2.5} />
              </div>
              <h3 className="text-[16px] font-black text-gp-text tracking-tight uppercase">Impacto e Investimento</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-1">
                <label className={labelClass}>Nível de Urgência</label>
                <SearchableSelect 
                  options={prioridadeOptions}
                  value={form.priority}
                  onChange={(val) => {
                    const newPriority = (val || 'media') as Priority;
                    setForm(prev => ({ ...prev, priority: newPriority }));
                  }}
                  placeholder="Selecione..."
                />
              </div>

              <div className="space-y-1">
                <label className={labelClass}>Valor Orçamentário (R$)</label>
                <div className="relative group/input">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-gp-blue-light text-sm tracking-widest leading-none pointer-events-none">R$</div>
                  <input
                    required={profile?.role === 'ti'}
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    className="gp-input pl-14 font-black text-gp-text focus:text-gp-blue"
                    value={form.estimated_cost}
                    onChange={e => setForm(prev => ({ ...prev, estimated_cost: e.target.value }))}
                  />
                </div>
                {profile?.role !== 'ti' && (
                  <p className="mt-2 text-[10px] font-black text-gp-muted uppercase tracking-[0.15em] pl-1 opacity-50 leading-none">Campo opcional para solicitantes</p>
                )}
              </div>
            </div>
          </section>

          {/* Seção 3: Justificativa */}
          <section className="gp-card p-6 sm:p-10 space-y-8">
            <div className="flex items-center gap-4 py-2 border-b border-gp-border">
              <div className="w-10 h-10 rounded-xl bg-gp-blue/10 text-gp-blue flex items-center justify-center">
                <FileText size={22} strokeWidth={2.5} />
              </div>
              <h3 className="text-[16px] font-black text-gp-text tracking-tight uppercase">Justificativa Operacional</h3>
            </div>
            <div className="space-y-1">
               <label className={labelClass}>Motivação e Descrição</label>
               <textarea
                required
                placeholder="Descreva detalhadamente a necessidade técnica ou funcional deste equipamento em sua rotina de trabalho..."
                className="gp-input px-6 py-5 min-h-[160px] resize-none leading-relaxed"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </section>

          {/* Seção 4: Links */}
          <section className="gp-card bg-gp-surface overflow-hidden relative border-gp-blue/20 border-2 shadow-xl">
            <div className="p-6 sm:p-10 space-y-8 relative z-10">
              <div className="flex items-center gap-4 py-2 border-b border-gp-border">
                <div className="w-10 h-10 rounded-xl bg-gp-blue text-white flex items-center justify-center shadow-lg shadow-gp-blue/30">
                  <LinkIcon size={22} strokeWidth={2.5} />
                </div>
                <h3 className="text-[16px] font-black text-gp-text tracking-tight uppercase">Referências de Mercado</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <input
                  type="text"
                  placeholder="Título (Ex: Kabum)"
                  className="gp-input md:col-span-4"
                  value={newLink.label}
                  onChange={e => setNewLink({ ...newLink, label: e.target.value })}
                />
                <div className="md:col-span-8 flex gap-3">
                  <input
                    type="url"
                    placeholder="Cole a URL do produto aqui..."
                    className="flex-1 gp-input"
                    value={newLink.url}
                    onChange={e => setNewLink({ ...newLink, url: e.target.value })}
                  />
                  <button 
                    type="button"
                    onClick={addLink}
                    className="btn-premium-primary px-6 rounded-xl flex-shrink-0"
                  >
                    <Plus size={22} strokeWidth={3} />
                  </button>
                </div>
              </div>
              
              {links.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                  {links.map((link, i) => (
                    <div key={i} className="flex items-center justify-between bg-gp-surface2 border border-gp-border p-5 rounded-2xl group hover:border-gp-blue/40 hover:bg-gp-blue/[0.01] transition-all shadow-sm">
                      <div className="flex flex-col min-w-0">
                         <span className="font-black text-[13px] text-gp-text truncate mb-1">{link.label}</span>
                         <span className="text-[10px] font-medium text-gp-muted truncate opacity-80 uppercase tracking-widest leading-none">{link.url}</span>
                      </div>
                      <button onClick={() => removeLink(i)} className="text-gp-muted hover:text-gp-error p-2 transition-colors ml-3 hover:bg-gp-error/5 rounded-lg">
                        <Trash2 size={16} strokeWidth={2.5} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <LinkIcon size={180} className="absolute -right-24 -bottom-24 text-gp-blue opacity-[0.025] -rotate-12 pointer-events-none" />
          </section>

          {/* Seção 5: Documentos */}
          <section className="gp-card p-6 sm:p-10 space-y-8">
            <div className="flex items-center justify-between py-2 border-b border-gp-border">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gp-blue/10 text-gp-blue flex items-center justify-center">
                  <Paperclip size={22} strokeWidth={2.5} />
                </div>
                <h3 className="text-[16px] font-black text-gp-text tracking-tight uppercase">Mídias e Arquivos</h3>
              </div>
              <label className="btn-premium-secondary px-6 py-2.5 rounded-xl text-[10px] cursor-pointer font-black tracking-widest shadow-inner transition-transform active:scale-95">
                 <Plus size={16} className="mr-2" strokeWidth={4} /> ADICIONAR
                 <input type="file" multiple className="hidden" onChange={handleFileSelect} />
              </label>
            </div>

            {tempAttachments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {tempAttachments.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-5 bg-gp-surface2 border border-gp-border rounded-2xl group hover:border-gp-blue/20 transition-all shadow-sm">
                    <div className="flex items-center gap-4 overflow-hidden">
                       <div className="w-11 h-11 rounded-xl bg-gp-surface border border-gp-border flex items-center justify-center text-gp-muted shrink-0 shadow-inner group-hover:text-gp-blue transition-colors">
                         {item.file.type.startsWith('image/') ? <ImageIcon size={20} /> : <FileIcon size={20} />}
                       </div>
                       <div className="truncate">
                          <p className="font-black text-[13px] text-gp-text truncate mb-1 leading-none">{item.file.name}</p>
                          <p className="text-[10px] font-black text-gp-muted uppercase tracking-tighter opacity-60">{(item.file.size / 1024).toFixed(0)} KB · {item.file.type.split('/')[1]}</p>
                       </div>
                    </div>
                    <button type="button" onClick={() => removeAttachment(item.id)} className="p-2.5 text-gp-muted hover:text-gp-error transition-colors hover:bg-gp-error/5 rounded-xl">
                       <Trash2 size={18} strokeWidth={2.5} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-14 text-center border-3 border-dashed border-gp-border rounded-[2.5rem] bg-gp-surface2/[0.05] group hover:border-gp-blue/20 transition-colors">
                 <div className="w-16 h-16 bg-gp-surface2 border border-gp-border rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner text-gp-muted group-hover:text-gp-blue/40 transition-colors">
                    <FileIcon size={24} strokeWidth={2.5} />
                 </div>
                 <p className="text-gp-muted font-black text-[11px] uppercase tracking-[0.2em] leading-relaxed max-w-xs mx-auto">
                   Arraste arquivos ou clique no botão acima para anexar PDFs, imagens ou orçamentos técnicos.
                 </p>
              </div>
            )}
          </section>
        </div>

        <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-10">
           <button
             type="button"
             onClick={() => navigate(-1)}
             className="w-full sm:w-auto px-10 py-4 btn-premium-ghost rounded-xl text-[11px] font-black uppercase tracking-widest order-2 sm:order-1"
           >
             DESCARTAR RASCUNHO
           </button>
           <button
             type="submit"
             disabled={loading}
             className="w-full sm:w-auto px-14 py-4 btn-premium-primary rounded-xl text-[12px] font-black uppercase tracking-[0.15em] order-1 sm:order-2 shadow-2xl shadow-gp-blue/30"
           >
             {loading ? (
               <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
             ) : (
               <>
                 <Send size={18} strokeWidth={3} className="mr-2.5" />
                 PROTOCOLAR PEDIDO
               </>
             )}
           </button>
        </div>
      </form>
    </div>
  );
}
