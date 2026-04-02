import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { assetService } from '../services/assetService';
import type { Asset } from '../services/assetService';
import { useProfile } from '../hooks/useProfile';
import { 
  PackagePlus, 
  ArrowLeft, 
  Barcode, 
  CheckCircle, 
  AlertCircle,
  Hash,
  Monitor,
  MapPin,
  ClipboardList
} from 'lucide-react';
import { BarcodeScanner } from '../components/BarcodeScanner';
import { SearchableSelect } from '../components/SearchableSelect';

const categoryOptions = [
  { value: 'Notebook', label: 'Notebook' },
  { value: 'Desktop', label: 'Desktop' },
  { value: 'Monitor', label: 'Monitor' },
  { value: 'Smartphone', label: 'Smartphone' },
  { value: 'Impressora', label: 'Impressora' },
  { value: 'Scanner', label: 'Scanner' },
  { value: 'Teclado', label: 'Teclado' },
  { value: 'Mouse', label: 'Mouse' },
  { value: 'Headset', label: 'Headset' },
  { value: 'Servidor', label: 'Servidor' },
  { value: 'Switch/Roteador', label: 'Switch/Roteador' },
  { value: 'Outros', label: 'Outros' },
];

export default function NewAsset() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  const [form, setForm] = useState<Partial<Asset>>({
    nome_item: '',
    numero_patrimonio: '',
    marca: '',
    modelo: '',
    numero_serie: '',
    categoria: 'Notebook',
    local: '',
    empresa: '',
    departamento: '',
    status: 'em_estoque',
    observacoes: ''
  });

  useEffect(() => {
    fetchNextPatrimony();
  }, []);

  async function fetchNextPatrimony() {
    const nextNum = await assetService.getNextPatrimonyNumber();
    setForm(prev => ({ ...prev, numero_patrimonio: nextNum }));
  }

  const handleScan = (code: string) => {
    setForm(prev => ({ ...prev, numero_serie: code }));
    setShowScanner(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    setLoading(true);
    setError(null);

    const { error: createError } = await assetService.createAsset(
      form as Asset,
      profile.id
    );

    if (createError) {
      setError('Erro ao salvar ativo: ' + (createError as any).message);
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => navigate('/estoque'), 2000);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in zoom-in duration-500">
        <div className="w-24 h-24 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-xl shadow-primary-500/20">
          <CheckCircle size={48} strokeWidth={3} />
        </div>
        <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-2">Ativo Registrado!</h2>
        <p className="text-slate-500 text-lg max-w-sm">
          O equipamento foi adicionado ao estoque e o patrimônio #{form.numero_patrimonio} foi reservado.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-6 duration-700 pb-20">
      <header className="flex flex-col gap-4">
        <button 
          onClick={() => navigate('/estoque')}
          className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary-600 transition-colors"
        >
          <ArrowLeft size={14} /> Voltar ao Inventário
        </button>
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-4">
           <div className="w-12 h-12 bg-primary-600 text-white rounded-3xl flex items-center justify-center shadow-lg shadow-primary-500/20">
             <PackagePlus size={28} />
           </div>
           Novo Ativo Individual
        </h1>
        <p className="text-slate-500 text-lg">Cadastre um novo equipamento manualmente no estoque central.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 p-6 rounded-[2rem] border border-rose-100 dark:border-rose-800 flex gap-4 items-center">
            <AlertCircle size={24} />
            <p className="font-bold">{error}</p>
          </div>
        )}

        {/* Seção 1: Identificação Patrimonial */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm p-10 space-y-8">
           <h3 className="text-xl font-black flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center">
               <Hash size={20} />
             </div>
             Identificação e Patrimônio
           </h3>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-white">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Número de Patrimônio (Sugerido)</label>
                <div className="relative">
                  <div className="absolute left-6 top-4 font-black text-primary-500">#</div>
                  <input
                    required
                    type="text"
                    className="w-full pl-12 pr-6 py-4 bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-100 dark:border-primary-900/50 rounded-[1.5rem] outline-none font-black text-primary-600 text-xl tracking-widest"
                    value={form.numero_patrimonio}
                    onChange={e => setForm({ ...form, numero_patrimonio: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Número de Série (S/N)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ex: ABC123XYZ"
                    className="flex-1 px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent rounded-[1.5rem] focus:border-primary-500 focus:bg-white dark:focus:bg-slate-950 outline-none transition-all font-bold text-slate-900 dark:text-white"
                    value={form.numero_serie}
                    onChange={e => setForm({ ...form, numero_serie: e.target.value })}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowScanner(true)}
                    className="w-14 h-14 bg-slate-900 text-white dark:bg-white dark:text-slate-950 rounded-2xl flex items-center justify-center active:scale-95 transition-all shadow-lg"
                  >
                    <Barcode size={24} />
                  </button>
                </div>
              </div>
           </div>
        </section>

        {/* Seção 2: Detalhes do Hardware */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm p-10 space-y-8">
           <h3 className="text-xl font-black flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
               <Monitor size={20} />
             </div>
             Especificações do Equipamento
           </h3>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3 col-span-full">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição do Item</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Notebook Dell Latitude 5420 i7 16GB"
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent rounded-[1.5rem] focus:border-primary-500 focus:bg-white dark:focus:bg-slate-950 outline-none transition-all font-bold text-slate-900 dark:text-white"
                  value={form.nome_item}
                  onChange={e => setForm({ ...form, nome_item: e.target.value })}
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
                <SearchableSelect 
                  options={categoryOptions}
                  value={form.categoria || 'Notebook'}
                  onChange={val => setForm({ ...form, categoria: val })}
                  placeholder="Escolher..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Marca</label>
                  <input
                    type="text"
                    placeholder="Dell"
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent rounded-[1.5rem] focus:border-primary-500 outline-none font-bold"
                    value={form.marca}
                    onChange={e => setForm({ ...form, marca: e.target.value })}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Modelo</label>
                  <input
                    type="text"
                    placeholder="Latitude 5420"
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent rounded-[1.5rem] focus:border-primary-500 outline-none font-bold"
                    value={form.modelo}
                    onChange={e => setForm({ ...form, modelo: e.target.value })}
                  />
                </div>
              </div>
           </div>
        </section>

        {/* Seção 3: Localização e Organização */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm p-10 space-y-8">
           <h3 className="text-xl font-black flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
               <MapPin size={20} />
             </div>
             Localização e Posse
           </h3>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unidade / Local</label>
                <input
                  type="text"
                  placeholder="Ex: Sede São Paulo"
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent rounded-[1.5rem] focus:border-primary-500 outline-none font-bold"
                  value={form.local}
                  onChange={e => setForm({ ...form, local: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Empresa</label>
                  <input
                    type="text"
                    placeholder="GlobalP"
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent rounded-[1.5rem] focus:border-primary-500 outline-none font-bold"
                    value={form.empresa}
                    onChange={e => setForm({ ...form, empresa: e.target.value })}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Departamento</label>
                  <input
                    type="text"
                    placeholder="Operacional"
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent rounded-[1.5rem] focus:border-primary-500 outline-none font-bold"
                    value={form.departamento}
                    onChange={e => setForm({ ...form, departamento: e.target.value })}
                  />
                </div>
              </div>
           </div>
        </section>

        {/* Seção 4: Observações */}
        <section className="bg-slate-950 rounded-[2.5rem] p-10 space-y-8 text-white">
           <h3 className="text-xl font-black flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center">
               <ClipboardList size={20} />
             </div>
             Informações Adicionais
           </h3>
           <textarea
              rows={4}
              placeholder="Detalhes sobre garantia, acessórios inclusos ou estado de conservação..."
              className="w-full px-8 py-6 bg-white/10 border border-white/5 rounded-[2rem] focus:border-primary-500 outline-none transition-all font-medium text-white placeholder:text-white/20 resize-none leading-relaxed"
              value={form.observacoes}
              onChange={e => setForm({ ...form, observacoes: e.target.value })}
            />
        </section>

        <div className="flex justify-end gap-4 pt-5">
           <button
             type="button"
             onClick={() => navigate('/estoque')}
             className="px-10 py-5 rounded-2xl font-black text-slate-400 hover:text-slate-900 transition-all"
           >
             DESCARTAR
           </button>
           <button
             type="submit"
             disabled={loading || !form.nome_item || !form.numero_patrimonio}
             className="w-full sm:w-auto bg-primary-600 hover:bg-primary-500 text-white px-12 py-5 rounded-[2rem] font-black flex items-center justify-center gap-3 transition-all shadow-2xl shadow-primary-500/30 active:scale-95 disabled:opacity-50"
           >
             {loading ? 'SALVANDO...' : (
               <>
                 <CheckCircle size={22} strokeWidth={3} />
                 CADASTRAR EQUIPAMENTO
               </>
             )}
           </button>
        </div>
      </form>

      {showScanner && (
        <BarcodeScanner 
          onScan={handleScan}
          onClose={() => setShowScanner(false)} 
        />
      )}
    </div>
  );
}
