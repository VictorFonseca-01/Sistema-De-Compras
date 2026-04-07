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
import { toast } from 'react-hot-toast';

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

const labelClass = 'block text-[10px] font-black uppercase tracking-[0.2em] mb-2.5 text-gp-muted ml-0.5 leading-none';

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
    toast.success('Scanner: S/N capturado.');
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
      setError('Falha na persistência: ' + (createError as any).message);
      setLoading(false);
    } else {
      setSuccess(true);
      toast.success('Ativo capitalizado com sucesso.');
      setTimeout(() => navigate('/estoque'), 2000);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center animate-fade-up px-6">
        <div className="gp-card p-12 max-w-lg flex flex-col items-center shadow-2xl">
          <div className="w-20 h-20 bg-gp-success/10 text-gp-success rounded-3xl flex items-center justify-center mb-8 shadow-inner border border-gp-success/20">
            <CheckCircle size={40} strokeWidth={3} />
          </div>
          <h2 className="text-2xl font-black text-gp-text mb-3 uppercase tracking-tight">Ativo Registrado</h2>
          <p className="text-gp-text2 text-[15px] font-medium leading-relaxed">
            O equipamento foi adicionado ao inventário global e o patrimônio <span className="text-gp-blue font-black tracking-widest">#{form.numero_patrimonio}</span> foi reservado.
          </p>
          <div className="mt-10 flex items-center gap-3 py-3.5 px-8 bg-gp-surface2 rounded-xl border border-gp-border">
             <div className="w-4 h-4 border-2 border-gp-border2 border-t-gp-blue rounded-full animate-spin" />
             <span className="text-[11px] font-black text-gp-muted uppercase tracking-widest">Atualizando banco...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 px-4 sm:px-0 animate-fade-up">
      <header className="flex flex-col gap-6">
        <button 
          onClick={() => navigate('/estoque')}
          className="flex items-center gap-2 text-gp-muted font-black hover:text-gp-blue transition-colors text-[10px] uppercase tracking-[0.2em] mb-2"
        >
          <ArrowLeft size={14} strokeWidth={3} /> Voltar ao Inventário
        </button>
        <div className="flex items-center gap-6">
           <div className="w-16 h-16 bg-gp-blue text-white rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-gp-blue/20 shrink-0">
             <PackagePlus size={32} strokeWidth={2.5} />
           </div>
           <div className="min-w-0">
             <h1 className="gp-page-title text-3xl">Novo Ativo Individual</h1>
             <p className="gp-page-subtitle">Cadastre um novo equipamento manualmente no estoque central.</p>
           </div>
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
                <Hash size={22} strokeWidth={2.5} />
              </div>
              <h3 className="text-[16px] font-black text-gp-text tracking-tight uppercase">Identificação Patrimonial</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1">
                <label className={labelClass}>Patrimônio (ID Global)</label>
                <div className="relative group/input">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-gp-blue-light text-[17px] leading-none pointer-events-none">#</div>
                  <input
                    required
                    type="text"
                    className="gp-input pl-12 font-black text-gp-blue-light text-xl tracking-[0.2em] focus:text-gp-blue"
                    value={form.numero_patrimonio}
                    onChange={e => setForm({ ...form, numero_patrimonio: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className={labelClass}>Número de Série (S/N)</label>
                <div className="flex gap-2.5">
                  <input
                    type="text"
                    placeholder="Ex: ABC123XYZ"
                    className="flex-1 gp-input font-black uppercase tracking-widest placeholder:opacity-20"
                    value={form.numero_serie}
                    onChange={e => setForm({ ...form, numero_serie: e.target.value })}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowScanner(true)}
                    className="btn-premium-secondary w-14 h-14 rounded-xl flex-shrink-0 shadow-sm transition-transform active:scale-95"
                    title="Abrir Scanner de Câmera"
                  >
                    <Barcode size={24} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Seção 2: Hardware */}
          <section className="gp-card p-6 sm:p-10 space-y-8">
            <div className="flex items-center gap-4 py-2 border-b border-gp-border">
              <div className="w-10 h-10 rounded-xl bg-gp-amber/10 text-gp-amber flex items-center justify-center border border-gp-amber/20 shadow-inner">
                <Monitor size={22} strokeWidth={2.5} />
              </div>
              <h3 className="text-[16px] font-black text-gp-text tracking-tight uppercase">Propriedades Técnicas</h3>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-1">
                <label className={labelClass}>Nome/Descrição do Item</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Notebook Dell Latitude 5420 i7 16GB"
                  className="gp-input"
                  value={form.nome_item}
                  onChange={e => setForm({ ...form, nome_item: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className={labelClass}>Categoria de Ativo</label>
                  <SearchableSelect 
                    options={categoryOptions}
                    value={form.categoria || 'Notebook'}
                    onChange={val => setForm({ ...form, categoria: val })}
                    placeholder="Selecionar..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className={labelClass}>Fabricante</label>
                    <input
                      type="text"
                      placeholder="Dell"
                      className="gp-input"
                      value={form.marca}
                      onChange={e => setForm({ ...form, marca: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>Modelo</label>
                    <input
                      type="text"
                      placeholder="Latitude 5420"
                      className="gp-input"
                      value={form.modelo}
                      onChange={e => setForm({ ...form, modelo: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Seção 3: Localização */}
          <section className="gp-card p-6 sm:p-10 space-y-8">
            <div className="flex items-center gap-4 py-2 border-b border-gp-border">
              <div className="w-10 h-10 rounded-xl bg-gp-success/10 text-gp-success flex items-center justify-center border border-gp-success/20 shadow-inner">
                <MapPin size={22} strokeWidth={2.5} />
              </div>
              <h3 className="text-[16px] font-black text-gp-text tracking-tight uppercase">Alocação Geográfica</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1">
                <label className={labelClass}>Unidade Corporativa / Local</label>
                <input
                  type="text"
                  placeholder="Ex: Sede Administrativa SP"
                  className="gp-input"
                  value={form.local}
                  onChange={e => setForm({ ...form, local: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className={labelClass}>Empresa</label>
                  <input
                    type="text"
                    placeholder="GlobalP"
                    className="gp-input"
                    value={form.empresa}
                    onChange={e => setForm({ ...form, empresa: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>Departamento</label>
                  <input
                    type="text"
                    placeholder="TI Central"
                    className="gp-input"
                    value={form.departamento}
                    onChange={e => setForm({ ...form, departamento: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Seção 4: Notas */}
          <section className="gp-card bg-gp-surface overflow-hidden relative border-gp-blue/20 border-2 shadow-xl">
            <div className="p-6 sm:p-10 space-y-8 relative z-10">
              <div className="flex items-center gap-4 py-2 border-b border-gp-border">
                <div className="w-10 h-10 rounded-xl bg-gp-blue text-white flex items-center justify-center shadow-lg shadow-gp-blue/30">
                  <ClipboardList size={22} strokeWidth={2.5} />
                </div>
                <h3 className="text-[16px] font-black text-gp-text tracking-tight uppercase">Notas do Ativo</h3>
              </div>
              
              <textarea
                rows={4}
                placeholder="Estado de conservação, detalhes de garantia, acessórios inclusos ou configurações específicas de hardware..."
                className="gp-input px-6 py-5 min-h-[140px] resize-none leading-relaxed"
                value={form.observacoes}
                onChange={e => setForm({ ...form, observacoes: e.target.value })}
              />
            </div>
            <ClipboardList size={180} className="absolute -right-24 -bottom-24 text-gp-blue opacity-[0.025] -rotate-12 pointer-events-none" />
          </section>
        </div>

        <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-10">
           <button
             type="button"
             onClick={() => navigate('/estoque')}
             className="w-full sm:w-auto px-10 py-4 btn-premium-ghost rounded-xl text-[11px] font-black uppercase tracking-widest order-2 sm:order-1"
           >
             DESCARTAR RASCUNHO
           </button>
           <button
             type="submit"
             disabled={loading || !form.nome_item || !form.numero_patrimonio}
             className="w-full sm:w-auto px-14 py-4 btn-premium-primary rounded-xl text-[12px] font-black uppercase tracking-[0.15em] order-1 sm:order-2 shadow-2xl shadow-gp-blue/30"
           >
             {loading ? (
               <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
             ) : (
               <>
                 <CheckCircle size={18} strokeWidth={3} className="mr-2.5" />
                 CONFIRMAR CADASTRO
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
