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
  Plus
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

  const addLink = () => {
    if (newLink.label && newLink.url) {
      setLinks([...links, newLink]);
      setNewLink({ label: '', url: '' });
    }
  };

  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
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

      if (links.length > 0 && request) {
        const linksToInsert = links.map(l => ({
          request_id: request.id,
          label: l.label,
          url: l.url
        }));
        const { error: linksError } = await supabase.from('request_links').insert(linksToInsert);
        if (linksError) throw linksError;
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in zoom-in duration-500">
        <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-[2rem] flex items-center justify-center mb-8 shadow-xl shadow-emerald-500/20">
          <CheckCircle size={48} strokeWidth={3} />
        </div>
        <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-2">Solicitação Enviada!</h2>
        <p className="text-slate-500 text-lg max-w-sm">
          Sua requisição foi protocolada com sucesso e já está na fila de aprovação do seu gestor.
        </p>
        <div className="mt-8 flex items-center gap-2 text-slate-400 font-bold text-sm uppercase tracking-widest">
           <div className="w-4 h-4 border-2 border-slate-300 border-t-primary-600 rounded-full animate-spin"></div>
           Redirecionando...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-6 duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
           <button 
             onClick={() => navigate(-1)}
             className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary-600 mb-2 transition-colors"
           >
             <ArrowLeft size={14} /> Voltar
           </button>
           <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Nova Solicitação</h1>
           <p className="text-slate-500 text-lg">Inicie um novo processo de aquisição de infraestrutura.</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 p-6 rounded-[2rem] border border-rose-100 dark:border-rose-800 flex gap-4 items-center animate-in shake duration-500">
            <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/50 rounded-xl flex items-center justify-center shrink-0">
              <AlertCircle size={24} />
            </div>
            <p className="font-bold">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8">
          {/* Seção 1: Identificação */}
          <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm p-10 space-y-8">
            <h3 className="text-xl font-black flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 flex items-center justify-center">
                <Zap size={20} />
              </div>
              Identificação do Item
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3 col-span-full">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Título do Pedido</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Novo Notebook para Desenvolvedor Backend"
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent rounded-[1.5rem] focus:border-primary-500 focus:bg-white dark:focus:bg-slate-950 outline-none transition-all font-bold text-slate-900 dark:text-white"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria de Ativo</label>
                <SearchableSelect 
                  options={categoriaOptions}
                  value={form.category}
                  onChange={(val) => setForm({ ...form, category: val })}
                  placeholder="Selecione..."
                />
              </div>

              <div className="space-y-3 font-bold text-slate-400 text-sm flex items-end pb-4">
                 <p className="leading-tight opacity-70 italic">Certifique-se que a categoria condiz com o item para agilizar a triagem técnica pela equipe de TI.</p>
              </div>
            </div>
          </section>

          {/* Seção 2: Prioridade e Custo */}
          <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm p-10 space-y-8">
             <h3 className="text-xl font-black flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center">
                <BadgeDollarSign size={20} />
              </div>
              Prioridade e Investimento
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Urguência do Pedido</label>
                <SearchableSelect 
                  options={prioridadeOptions}
                  value={form.priority}
                  onChange={(val) => setForm({ ...form, priority: val as Priority })}
                  placeholder="Prioridade..."
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Custo Estimado (R$)</label>
                <div className="relative">
                  <div className="absolute left-6 top-4 font-black text-slate-400">R$</div>
                  <input
                    required={profile?.role === 'ti'}
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    className={clsx(
                      "w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent rounded-[1.5rem] focus:border-primary-500 focus:bg-white dark:focus:bg-slate-950 outline-none transition-all font-black text-primary-600",
                      profile?.role !== 'ti' && "opacity-80"
                    )}
                    value={form.estimated_cost}
                    onChange={e => setForm({ ...form, estimated_cost: e.target.value })}
                  />
                  {profile?.role !== 'ti' && (
                    <p className="mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">Opcional para seu cargo</p>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Seção 3: Justificativa */}
          <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm p-10 space-y-8">
            <h3 className="text-xl font-black flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center">
                <FileText size={20} />
              </div>
              Justificativa Técnica
            </h3>
            <div className="space-y-3">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Motivação da Compra</label>
               <textarea
                required
                rows={5}
                placeholder="Explique detalhadamente por que este item é necessário. Use dados técnicos se possível para facilitar a aprovação."
                className="w-full px-8 py-6 bg-slate-50 dark:bg-slate-800 border-2 border-transparent rounded-[2rem] focus:border-primary-500 focus:bg-white dark:focus:bg-slate-950 outline-none transition-all font-medium text-slate-600 dark:text-slate-300 resize-none leading-relaxed"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </section>

          {/* Seção 4: Links */}
          <section className="bg-slate-950 rounded-[2.5rem] p-10 space-y-8 text-white relative overflow-hidden">
            <LinkIcon size={200} className="absolute -right-20 -bottom-20 text-white/5 -rotate-12" />
            <h3 className="text-xl font-black flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center">
                <LinkIcon size={20} />
              </div>
              Referências e Orçamentos
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
              <input
                type="text"
                placeholder="Título (Ex: Kabum)"
                className="px-6 py-4 bg-white/10 border border-white/5 rounded-[1.2rem] outline-none placeholder:text-slate-500 font-bold focus:bg-white/20 transition-all"
                value={newLink.label}
                onChange={e => setNewLink({ ...newLink, label: e.target.value })}
              />
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="URL Completa (https://...)"
                  className="flex-1 px-6 py-4 bg-white/10 border border-white/5 rounded-[1.2rem] outline-none placeholder:text-slate-500 font-bold focus:bg-white/20 transition-all"
                  value={newLink.url}
                  onChange={e => setNewLink({ ...newLink, url: e.target.value })}
                />
                <button 
                  type="button"
                  onClick={addLink}
                  className="bg-primary-600 hover:bg-primary-500 text-white px-8 rounded-2xl font-black transition-all active:scale-95"
                >
                  <Plus size={24} strokeWidth={3} />
                </button>
              </div>
            </div>
            
            {links.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative z-10">
                {links.map((link, i) => (
                  <div key={i} className="flex items-center justify-between bg-white/5 border border-white/5 px-6 py-4 rounded-[1.2rem] group hover:bg-white/10 transition-all">
                    <div className="flex flex-col">
                       <span className="font-black text-sm">{link.label}</span>
                       <span className="text-[10px] text-slate-500 truncate max-w-[200px]">{link.url}</span>
                    </div>
                    <button onClick={() => removeLink(i)} className="text-slate-500 hover:text-rose-500 p-2 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-10">
           <button
             type="button"
             onClick={() => navigate(-1)}
             className="w-full sm:w-auto px-10 py-4 rounded-2xl font-black text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all order-2 sm:order-1"
           >
             DESCARTAR
           </button>
           <button
             type="submit"
             disabled={loading}
             className="w-full sm:w-auto bg-primary-600 hover:bg-primary-500 text-white px-12 py-5 rounded-[2rem] font-black flex items-center justify-center gap-3 transition-all shadow-2xl shadow-primary-500/30 active:scale-95 disabled:opacity-50 order-1 sm:order-2"
           >
             {loading ? (
               <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
             ) : (
               <>
                 <Send size={22} strokeWidth={3} />
                 PROTOCOLOAR SOLICITAÇÃO
               </>
             )}
           </button>
        </div>
      </form>
    </div>
  );
}
