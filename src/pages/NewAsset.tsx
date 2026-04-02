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
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center animate-fade-up">
        <div className="gp-card p-12 max-w-lg flex flex-col items-center">
          <div className="w-20 h-20 bg-gp-success/10 text-gp-success rounded-2xl flex items-center justify-center mb-8 shadow-inner">
            <CheckCircle size={40} strokeWidth={2} />
          </div>
          <h2 className="text-2xl font-bold text-gp-text mb-3">Ativo Registrado!</h2>
          <p className="text-gp-text3 text-base leading-relaxed">
            O equipamento foi adicionado ao estoque e o patrimônio <span className="text-gp-blue font-bold">#{form.numero_patrimonio}</span> foi reservado com sucesso.
          </p>
          <div className="mt-10 flex items-center gap-3 py-3 px-6 bg-gp-surface2 rounded-xl border border-gp-border">
             <div className="w-4 h-4 border-2 border-gp-border2 border-t-gp-blue rounded-full animate-spin" />
             <span className="text-[11px] font-bold text-gp-text3 uppercase tracking-widest">Redirecionando ao estoque...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 animate-fade-up">
      <header className="flex flex-col gap-5">
        <button 
          onClick={() => navigate('/estoque')}
          className="flex items-center gap-2 text-gp-text3 font-bold hover:text-gp-blue transition-colors text-[12px] uppercase tracking-wider"
        >
          <ArrowLeft size={16} /> Voltar ao Inventário
        </button>
        <div className="flex items-center gap-5">
           <div className="w-14 h-14 bg-gp-blue text-white rounded-2xl flex items-center justify-center shadow-lg shadow-gp-blue/20">
             <PackagePlus size={30} strokeWidth={2} />
           </div>
           <div>
             <h1 className="gp-page-title text-3xl">Novo Ativo Individual</h1>
             <p className="gp-page-subtitle">Cadastre um novo equipamento manualmente no estoque central.</p>
           </div>
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
                <Hash size={20} strokeWidth={2} />
              </div>
              <h3 className="text-lg font-bold text-gp-text tracking-tight">Identificação e Patrimônio</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-[11px] font-bold text-gp-text3 uppercase tracking-widest mb-2 ml-1">Patrimônio (ID Sugerido)</label>
                <div className="relative">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-gp-blue-light text-lg">#</div>
                  <input
                    required
                    type="text"
                    className="gp-input pl-10 pr-5 py-3.5 font-bold text-gp-blue-light text-xl tracking-widest"
                    value={form.numero_patrimonio}
                    onChange={e => setForm({ ...form, numero_patrimonio: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gp-text3 uppercase tracking-widest mb-2 ml-1">Número de Série (S/N)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ex: ABC123XYZ"
                    className="flex-1 gp-input px-5 py-3.5 font-mono uppercase"
                    value={form.numero_serie}
                    onChange={e => setForm({ ...form, numero_serie: e.target.value })}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowScanner(true)}
                    className="btn-premium-secondary w-14 h-14 rounded-xl flex-shrink-0"
                  >
                    <Barcode size={24} />
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Seção 2: Hardware */}
          <section className="gp-card p-8 sm:p-10 space-y-8">
            <div className="flex items-center gap-4 py-2 border-b border-gp-border">
              <div className="w-10 h-10 rounded-xl bg-gp-warning/10 text-gp-warning flex items-center justify-center">
                <Monitor size={20} strokeWidth={2} />
              </div>
              <h3 className="text-lg font-bold text-gp-text tracking-tight">Especificações do Equipamento</h3>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[11px] font-bold text-gp-text3 uppercase tracking-widest mb-2 ml-1">Descrição Comercial</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Notebook Dell Latitude 5420 i7 16GB"
                  className="gp-input px-5 py-3.5"
                  value={form.nome_item}
                  onChange={e => setForm({ ...form, nome_item: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[11px] font-bold text-gp-text3 uppercase tracking-widest mb-2 ml-1">Categoria de Ativo</label>
                  <SearchableSelect 
                    options={categoryOptions}
                    value={form.categoria || 'Notebook'}
                    onChange={val => setForm({ ...form, categoria: val })}
                    placeholder="Escolher..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gp-text3 uppercase tracking-widest mb-2 ml-1">Marca</label>
                    <input
                      type="text"
                      placeholder="Dell"
                      className="gp-input px-5 py-3.5"
                      value={form.marca}
                      onChange={e => setForm({ ...form, marca: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gp-text3 uppercase tracking-widest mb-2 ml-1">Modelo</label>
                    <input
                      type="text"
                      placeholder="Latitude 5420"
                      className="gp-input px-5 py-3.5"
                      value={form.modelo}
                      onChange={e => setForm({ ...form, modelo: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Seção 3: Localização */}
          <section className="gp-card p-8 sm:p-10 space-y-8">
            <div className="flex items-center gap-4 py-2 border-b border-gp-border">
              <div className="w-10 h-10 rounded-xl bg-gp-success/10 text-gp-success flex items-center justify-center">
                <MapPin size={20} strokeWidth={2} />
              </div>
              <h3 className="text-lg font-bold text-gp-text tracking-tight">Localização e Posse</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-[11px] font-bold text-gp-text3 uppercase tracking-widest mb-2 ml-1">Unidade / Local</label>
                <input
                  type="text"
                  placeholder="Ex: Sede São Paulo"
                  className="gp-input px-5 py-3.5"
                  value={form.local}
                  onChange={e => setForm({ ...form, local: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gp-text3 uppercase tracking-widest mb-2 ml-1">Empresa</label>
                  <input
                    type="text"
                    placeholder="GlobalP"
                    className="gp-input px-5 py-3.5"
                    value={form.empresa}
                    onChange={e => setForm({ ...form, empresa: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gp-text3 uppercase tracking-widest mb-2 ml-1">Departamento</label>
                  <input
                    type="text"
                    placeholder="Operacional"
                    className="gp-input px-5 py-3.5"
                    value={form.departamento}
                    onChange={e => setForm({ ...form, departamento: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Seção 4: Observações */}
          <section className="gp-card bg-gp-surface overflow-hidden relative border-gp-blue/30 border-2">
            <div className="p-8 sm:p-10 space-y-8 relative z-10">
              <div className="flex items-center gap-4 py-2 border-b border-gp-border">
                <div className="w-10 h-10 rounded-xl bg-gp-blue text-white flex items-center justify-center shadow-lg shadow-gp-blue/20">
                  <ClipboardList size={20} strokeWidth={2} />
                </div>
                <h3 className="text-lg font-bold text-gp-text tracking-tight">Informações Adicionais</h3>
              </div>
              
              <textarea
                rows={4}
                placeholder="Detalhes sobre garantia, acessórios inclusos ou estado de conservação..."
                className="gp-input px-6 py-4 min-h-[120px] resize-none"
                value={form.observacoes}
                onChange={e => setForm({ ...form, observacoes: e.target.value })}
              />
            </div>
            <ClipboardList size={160} className="absolute -right-16 -bottom-16 text-gp-blue opacity-[0.03] -rotate-12 pointer-events-none" />
          </section>
        </div>

        <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-8">
           <button
             type="button"
             onClick={() => navigate('/estoque')}
             className="w-full sm:w-auto px-10 py-3.5 btn-premium-secondary rounded-xl text-[12px] font-bold order-2 sm:order-1"
           >
             DESCARTAR
           </button>
           <button
             type="submit"
             disabled={loading || !form.nome_item || !form.numero_patrimonio}
             className="w-full sm:w-auto px-12 py-3.5 btn-premium-primary rounded-xl text-[12px] font-bold order-1 sm:order-2 shadow-gp-blue/20"
           >
             {loading ? (
               <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
             ) : (
               <>
                 <CheckCircle size={18} strokeWidth={2} />
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
