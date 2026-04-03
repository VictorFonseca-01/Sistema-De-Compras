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
  File as FileIcon
} from 'lucide-react';

import { clsx } from 'clsx';
import { useProfile } from '../hooks/useProfile';
import { SearchableSelect } from '../components/SearchableSelect';

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

const labelClass = 'block text-[11px] font-bold uppercase tracking-widest mb-2 opacity-70 ml-1';

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
      setError('Você precisa estar logado para criar uma solicitação.');
      setLoading(false);
      return;
    }

    // Validação específica para TI
    if (profile?.role === 'ti') {
      if (!form.estimated_cost) {
        setError('Como analista de TI, você deve informar o valor estimado do item.');
        setLoading(false);
        return;
      }
      if (links.length === 0) {
        setError('Como analista de TI, você deve anexar pelo menos um Link de Referência/Compra.');
        setLoading(false);
        return;
      }
    }

    try {
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
          current_step: 'gestor'
        }])
        .select()
        .single();

      if (requestError) throw requestError;

      // 1.5. Notificar Gestores do Departamento
      if (request && profile?.department) {
        // Buscar gestores do mesmo departamento
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
        const { error: linksError } = await supabase.from('request_links').insert(linksToInsert);
        if (linksError) throw linksError;
      }

      // NOVO: Upload e Registro de Anexos
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
      setTimeout(() => navigate('/solicitacoes'), 2500);
    } catch (err: any) {
      setError('Erro ao salvar solicitação: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center animate-fade-up">
        <div className="gp-card p-12 max-w-lg flex flex-col items-center">
          <div className="w-20 h-20 bg-gp-success/10 text-gp-success rounded-2xl flex items-center justify-center mb-8 shadow-inner">
            <CheckCircle size={40} strokeWidth={2} />
          </div>
          <h2 className="text-2xl font-bold text-gp-text mb-3">Solicitação Protocolada</h2>
          <p className="text-gp-text3 text-base leading-relaxed">
            Sua requisição foi enviada com sucesso e já está aguardando a aprovação do seu gestor imediato.
          </p>
          <div className="mt-10 flex items-center gap-3 py-3 px-6 bg-gp-surface2 rounded-xl border border-gp-border">
             <div className="w-4 h-4 border-2 border-gp-border2 border-t-gp-blue rounded-full animate-spin" />
             <span className="text-[11px] font-bold text-gp-text3 uppercase tracking-widest">Redirecionando...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 animate-fade-up">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
           <button 
             onClick={() => navigate(-1)}
             className="flex items-center gap-2 text-gp-text3 font-bold hover:text-gp-blue transition-colors mb-2 text-[12px] uppercase tracking-wider"
           >
             <ArrowLeft size={16} /> Voltar
           </button>
           <h1 className="gp-page-title">Nova Solicitação</h1>
           <p className="gp-page-subtitle">Inicie um novo processo de aquisição de infraestrutura corporativa.</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="flex items-center gap-4 p-5 bg-gp-error/10 border border-gp-error/20 text-gp-error rounded-2xl animate-shake">
            <div className="w-10 h-10 bg-gp-error/10 rounded-xl flex items-center justify-center shrink-0">
              <AlertCircle size={24} />
            </div>
            <p className="font-bold text-[14px]">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          {/* Seção 1: Identificação */}
          <section className="gp-card p-8 sm:p-10 space-y-8">
            <div className="flex items-center gap-4 py-2 border-b border-gp-border">
              <div className="w-10 h-10 rounded-xl bg-gp-blue-muted text-gp-blue-light flex items-center justify-center">
                <Zap size={20} strokeWidth={2} />
              </div>
              <h3 className="text-lg font-bold text-gp-text tracking-tight">Identificação do Item</h3>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className={labelClass}>Título do Pedido</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Novo Notebook para Desenvolvedor Backend"
                  className="gp-input px-5 py-3.5"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Categoria de Ativo</label>
                  <SearchableSelect 
                    options={categoriaOptions}
                    value={form.category}
                    onChange={(val) => setForm({ ...form, category: val })}
                    placeholder="Selecione..."
                  />
                </div>
                <div className="flex items-center gap-3 p-4 bg-gp-surface2 border border-gp-border rounded-2xl">
                   <Info size={18} className="text-gp-blue flex-shrink-0" />
                   <p className="text-[12px] font-medium text-gp-text3 leading-snug">
                     A categoria correta ajuda na triagem técnica da equipe de TI.
                   </p>
                </div>
              </div>
            </div>
          </section>

          {/* Seção 2: Prioridade e Custo */}
          <section className="gp-card p-8 sm:p-10 space-y-8">
             <div className="flex items-center gap-4 py-2 border-b border-gp-border">
              <div className="w-10 h-10 rounded-xl bg-gp-warning/10 text-gp-warning flex items-center justify-center">
                <BadgeDollarSign size={20} strokeWidth={2} />
              </div>
              <h3 className="text-lg font-bold text-gp-text tracking-tight">Prioridade e Investimento</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div>
                <label className={labelClass}>Urgência do Pedido</label>
                <SearchableSelect 
                  options={prioridadeOptions}
                  value={form.priority}
                  onChange={(val) => setForm({ ...form, priority: val as Priority })}
                  placeholder="Prioridade..."
                />
              </div>

              <div>
                <label className={labelClass}>Custo Estimado (R$)</label>
                <div className="relative">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-gp-text3 text-sm">R$</div>
                  <input
                    required={profile?.role === 'ti'}
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    className={clsx(
                      "gp-input pl-12 pr-5 py-3.5 font-bold text-gp-blue-light",
                      profile?.role !== 'ti' && "opacity-80"
                    )}
                    value={form.estimated_cost}
                    onChange={e => setForm({ ...form, estimated_cost: e.target.value })}
                  />
                </div>
                {profile?.role !== 'ti' && (
                  <p className="mt-2 text-[10px] font-bold text-gp-text3 uppercase tracking-widest pl-2">Opcional para seu cargo</p>
                )}
              </div>
            </div>
          </section>

          {/* Seção 3: Justificativa */}
          <section className="gp-card p-8 sm:p-10 space-y-8">
            <div className="flex items-center gap-4 py-2 border-b border-gp-border">
              <div className="w-10 h-10 rounded-xl bg-gp-blue-muted text-gp-blue-light flex items-center justify-center">
                <FileText size={20} strokeWidth={2} />
              </div>
              <h3 className="text-lg font-bold text-gp-text tracking-tight">Justificativa Técnica</h3>
            </div>
            <div>
               <label className={labelClass}>Motivação da Compra</label>
               <textarea
                required
                rows={5}
                placeholder="Explique por que este item é necessário em sua rotina..."
                className="gp-input px-6 py-4 min-h-[140px] resize-none"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </section>

          {/* Seção 4: Links */}
          <section className="gp-card bg-gp-surface overflow-hidden relative border-gp-blue/30 border-2">
            <div className="p-8 sm:p-10 space-y-8 relative z-10">
              <div className="flex items-center gap-4 py-2 border-b border-gp-border">
                <div className="w-10 h-10 rounded-xl bg-gp-blue text-white flex items-center justify-center shadow-lg shadow-gp-blue/20">
                  <LinkIcon size={20} strokeWidth={2} />
                </div>
                <h3 className="text-lg font-bold text-gp-text tracking-tight">Referências e Orçamentos</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <input
                  type="text"
                  placeholder="Nome do Site (Ex: Kabum)"
                  className="gp-input md:col-span-4 px-4 py-3"
                  value={newLink.label}
                  onChange={e => setNewLink({ ...newLink, label: e.target.value })}
                />
                <div className="md:col-span-8 flex gap-3">
                  <input
                    type="url"
                    placeholder="URL completa do produto..."
                    className="flex-1 gp-input px-4 py-3"
                    value={newLink.url}
                    onChange={e => setNewLink({ ...newLink, url: e.target.value })}
                  />
                  <button 
                    type="button"
                    onClick={addLink}
                    className="btn-premium-primary px-5 rounded-xl flex-shrink-0"
                  >
                    <Plus size={20} strokeWidth={2} />
                  </button>
                </div>
              </div>
              
              {links.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
                  {links.map((link, i) => (
                    <div key={i} className="flex items-center justify-between bg-gp-surface2 border border-gp-border px-5 py-4 rounded-xl group hover:border-gp-blue/40 transition-all">
                      <div className="flex flex-col min-w-0">
                         <span className="font-bold text-[13px] text-gp-text truncate">{link.label}</span>
                         <span className="text-[10px] text-gp-text3 truncate opacity-60">{link.url}</span>
                      </div>
                      <button onClick={() => removeLink(i)} className="text-gp-text3 hover:text-gp-error p-2 transition-colors ml-2">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Background decoration */}
            <LinkIcon size={160} className="absolute -right-20 -bottom-20 text-gp-blue opacity-[0.015] -rotate-12 pointer-events-none" />
          </section>

          {/* Seção 5: Documentos (NOVO) */}
          <section className="gp-card p-8 sm:p-10 space-y-8">
            <div className="flex items-center justify-between py-2 border-b border-gp-border">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gp-blue-muted text-gp-blue-light flex items-center justify-center">
                  <Plus size={20} strokeWidth={2} />
                </div>
                <h3 className="text-lg font-bold text-gp-text tracking-tight">Anexos e Documentos</h3>
              </div>
              <label className="btn-premium-secondary px-6 py-2.5 rounded-xl text-[10px] cursor-pointer">
                 <Plus size={14} className="mr-2" strokeWidth={3} /> ADICIONAR ARQUIVO
                 <input type="file" multiple className="hidden" onChange={handleFileSelect} />
              </label>
            </div>

            {tempAttachments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {tempAttachments.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-gp-surface2 border border-gp-border rounded-xl">
                    <div className="flex items-center gap-3 overflow-hidden">
                       <div className="w-10 h-10 rounded-lg bg-gp-surface border border-gp-border flex items-center justify-center text-gp-text3 shrink-0">
                         {item.file.type.startsWith('image/') ? <ImageIcon size={18} /> : <FileIcon size={18} />}
                       </div>
                       <div className="truncate">
                          <p className="font-bold text-[13px] text-gp-text truncate">{item.file.name}</p>
                          <p className="text-[10px] font-bold text-gp-text3 uppercase">{(item.file.size / 1024).toFixed(0)} KB</p>
                       </div>
                    </div>
                    <button type="button" onClick={() => removeAttachment(item.id)} className="p-2 text-gp-text3 hover:text-gp-error transition-colors">
                       <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center border-2 border-dashed border-gp-border rounded-2xl bg-gp-surface2/30">
                 <p className="text-gp-text3 font-bold text-[11px] uppercase tracking-widest">
                   Nenhum documento anexado. Clique em "Adicionar Arquivo".
                 </p>
              </div>
            )}
          </section>
        </div>

        <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-8">
           <button
             type="button"
             onClick={() => navigate(-1)}
             className="w-full sm:w-auto px-10 py-3.5 btn-premium-secondary rounded-xl text-[12px] font-bold order-2 sm:order-1"
           >
             DESCARTAR SOLICITAÇÃO
           </button>
           <button
             type="submit"
             disabled={loading}
             className="w-full sm:w-auto px-12 py-3.5 btn-premium-primary rounded-xl text-[12px] font-bold order-1 sm:order-2 shadow-gp-blue/20"
           >
             {loading ? (
               <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
             ) : (
               <>
                 <Send size={16} strokeWidth={2} />
                 PROTOCOLAR PEDIDO
               </>
             )}
           </button>
        </div>
      </form>
    </div>
  );
}
