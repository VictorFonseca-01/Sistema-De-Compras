import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  Send, 
  ArrowLeft, 
  Link as LinkIcon, 
  Trash2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

type Priority = 'baixa' | 'media' | 'alta' | 'critica';

export default function NewRequest() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    try {
      // 1. Insert Request
      const { data: request, error: requestError } = await supabase
        .from('requests')
        .insert([{
          user_id: user.id,
          title: form.title,
          description: form.description,
          category: form.category,
          estimated_cost: parseFloat(form.estimated_cost),
          priority: form.priority,
          status: 'pending_gestor',
          current_step: 'gestor'
        }])
        .select()
        .single();

      if (requestError) throw requestError;

      // 2. Insert Links
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
      setTimeout(() => navigate('/'), 2000);
    } catch (err: any) {
      setError('Erro ao salvar solicitação: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="bg-emerald-100 text-emerald-600 p-6 rounded-full mb-4">
          <CheckCircle size={64} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Solicitação Enviada!</h2>
        <p className="text-slate-500 mt-2">Sua solicitação foi enviada para aprovação do gestor.</p>
        <p className="text-sm text-slate-400 mt-4 italic text-xs">Redirecionando em instantes...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 transition-colors"
      >
        <ArrowLeft size={20} />
        Voltar
      </button>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8">
        <header className="mb-8">
          <h1 className="text-2xl font-bold">Nova Solicitação de Compra</h1>
          <p className="text-slate-500">Descreva detalhadamente o item ou equipamento necessário.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 flex gap-3 text-sm">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 col-span-full">
              <label className="text-sm font-semibold">Título da Solicitação</label>
              <input
                required
                type="text"
                placeholder="Ex: Novo Notebook para Desenvolvedor"
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Categoria</label>
              <select
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
              >
                <option>Hardware</option>
                <option>Software / Licenças</option>
                <option>Acessórios</option>
                <option>Serviços / Nuvem</option>
                <option>Infraestrutura</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Prioridade</label>
              <select
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                value={form.priority}
                onChange={e => setForm({ ...form, priority: e.target.value as Priority })}
              >
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
                <option value="critica">Crítica (Interrupção de serviço)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Custo Estimado (R$)</label>
              <input
                required
                type="number"
                step="0.01"
                placeholder="0,00"
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                value={form.estimated_cost}
                onChange={e => setForm({ ...form, estimated_cost: e.target.value })}
              />
            </div>

            <div className="space-y-2 col-span-full">
              <label className="text-sm font-semibold">Justificativa / Descrição</label>
              <textarea
                required
                rows={4}
                placeholder="Explique por que este item é necessário e qual o impacto no seu trabalho."
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <LinkIcon size={16} />
              Links de Referência (Opcional)
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nome da Loja/Site"
                className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none"
                value={newLink.label}
                onChange={e => setNewLink({ ...newLink, label: e.target.value })}
              />
              <input
                type="url"
                placeholder="https://..."
                className="flex-[2] px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none"
                value={newLink.url}
                onChange={e => setNewLink({ ...newLink, url: e.target.value })}
              />
              <button 
                type="button"
                onClick={addLink}
                className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2 rounded-xl transition-colors font-semibold border border-slate-700"
              >
                Adicionar
              </button>
            </div>
            
            <div className="space-y-2">
              {links.map((link, i) => (
                <div key={i} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-xl">
                  <span className="text-sm"><span className="font-bold">{link.label}:</span> {link.url}</span>
                  <button onClick={() => removeLink(i)} className="text-red-400 hover:text-red-600">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2 rounded-xl font-semibold border border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-2 rounded-xl font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? 'Enviando...' : (
                <>
                  <Send size={18} />
                  Enviar Solicitação
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
