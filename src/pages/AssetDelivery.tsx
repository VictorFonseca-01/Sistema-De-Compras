import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { assetService } from '../services/assetService';
import { useProfile } from '../hooks/useProfile';
import { 
  Truck, 
  ArrowLeft, 
  Package, 
  User, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Barcode,
  Send
} from 'lucide-react';
import { SearchableSelect } from '../components/SearchableSelect';
import { BarcodeScanner } from '../components/BarcodeScanner';

export default function AssetDelivery() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useProfile();
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [assets, setAssets] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  const [selectedAssetId, setSelectedAssetId] = useState(location.state?.assetId || '');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [notes, setNotes] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    // 1. Buscar ativos em estoque
    const { data: assetData } = await supabase
      .from('assets')
      .select('id, nome_item, numero_patrimonio, codigo_barras, status')
      .eq('status', 'em_estoque');
    
    if (assetData) setAssets(assetData);

    // 2. Buscar usuários
    const { data: userData } = await supabase
      .from('profiles')
      .select('id, full_name, email, department')
      .order('full_name');
    
    if (userData) setUsers(userData);
    setLoading(false);
  }

  const handleScanAsset = (decodedText: string) => {
    // Tenta encontrar o ativo pelo patrimônio ou código de barras
    const found = assets.find(a => 
      a.numero_patrimonio === decodedText || 
      a.codigo_barras === decodedText
    );
    if (found) {
      setSelectedAssetId(found.id);
      setShowScanner(false);
    } else {
      alert('Ativo não encontrado ou não está em estoque.');
      setShowScanner(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId || !selectedUserId || !profile) return;

    setLoading(true);
    setError(null);

    const { error: deliveryError } = await assetService.assignAsset(
      selectedAssetId,
      selectedUserId,
      profile.id,
      notes
    );

    if (deliveryError) {
      setError('Erro ao realizar entrega: ' + deliveryError.message);
    } else {
      setSuccess(true);
      setTimeout(() => navigate('/estoque'), 2500);
    }
    setLoading(false);
  };

  const assetOptions = assets.map(a => ({
    value: a.id,
    label: `${a.numero_patrimonio} - ${a.nome_item}`
  }));

  const userOptions = users.map(u => ({
    value: u.id,
    label: `${u.full_name} (${u.department || 'Sem depto'})`
  }));

  if (success) {
     return (
       <div className="flex flex-col items-center justify-center min-h-[70vh] text-center animate-fade-up">
         <div className="gp-card p-12 max-w-lg flex flex-col items-center">
           <div className="w-20 h-20 bg-gp-success/10 text-gp-success rounded-2xl flex items-center justify-center mb-8 shadow-inner">
             <Truck size={40} strokeWidth={2.5} />
           </div>
           <h2 className="text-2xl font-black text-gp-text mb-3 uppercase tracking-tight">Entrega Realizada!</h2>
           <p className="text-gp-text2 text-[15px] font-medium leading-relaxed">
             O ativo foi vinculado ao colaborador e o histórico de movimentação foi registrado com sucesso no banco de dados.
           </p>
           <div className="mt-10 flex items-center gap-3 py-3.5 px-6 bg-gp-surface2 rounded-xl border border-gp-border">
              <div className="w-4 h-4 border-2 border-gp-border2 border-t-gp-blue rounded-full animate-spin" />
              <span className="text-[11px] font-bold text-gp-text3 uppercase tracking-widest">Atualizando inventário...</span>
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
          className="flex items-center gap-2 text-gp-text3 font-bold hover:text-gp-blue transition-colors text-[10px] uppercase tracking-widest"
        >
          <ArrowLeft size={14} strokeWidth={3} /> Voltar ao Inventário
        </button>
        <div className="flex items-center gap-5">
           <div className="w-16 h-16 bg-gp-blue text-white rounded-2xl flex items-center justify-center shadow-lg shadow-gp-blue/20">
             <Send size={32} strokeWidth={2.5} />
           </div>
           <div>
             <h1 className="gp-page-title">Entrega de Ativo</h1>
             <p className="gp-page-subtitle">Vincule um equipamento do estoque a um colaborador corporativo.</p>
           </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="flex items-center gap-4 p-5 bg-gp-error/10 border border-gp-error/20 text-gp-error rounded-2xl animate-shake">
            <div className="w-10 h-10 bg-gp-error/10 rounded-xl flex items-center justify-center shrink-0">
              <AlertCircle size={24} strokeWidth={2.5} />
            </div>
            <p className="font-bold text-[14px]">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          {/* Seção 1: Equipamento */}
          <section className="gp-card p-6 sm:p-10 space-y-8">
            <div className="flex items-center gap-4 py-2 border-b border-gp-border">
              <div className="w-10 h-10 rounded-xl bg-gp-blue/10 text-gp-blue flex items-center justify-center">
                <Package size={20} strokeWidth={2.5} />
              </div>
              <h3 className="text-[16px] font-black text-gp-text tracking-tight uppercase">Equipamento Selecionado</h3>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full space-y-2">
                <label className="block text-[11px] font-bold text-gp-muted uppercase tracking-widest ml-1">Ativo Disponível</label>
                {loading && !assets.length ? (
                  <div className="gp-skeleton h-12 w-full" />
                ) : (
                  <SearchableSelect 
                    options={assetOptions}
                    value={selectedAssetId}
                    onChange={setSelectedAssetId}
                    placeholder="Selecione o patrimônio..."
                  />
                )}
              </div>
              <button 
                type="button"
                onClick={() => setShowScanner(true)}
                disabled={loading}
                className="w-full md:w-auto h-12 px-8 btn-premium-secondary rounded-xl"
              >
                <Barcode size={20} strokeWidth={2.5} />
                Escanear
              </button>
            </div>
            <p className="text-[11px] text-gp-text3 font-bold italic opacity-60">Somente itens com status <span className="text-gp-success font-black uppercase">"Em Estoque"</span> são listados.</p>

            {showScanner && (
              <BarcodeScanner 
                onScan={handleScanAsset}
                onClose={() => setShowScanner(false)} 
              />
            )}
          </section>

          {/* Seção 2: Colaborador */}
          <section className="gp-card p-6 sm:p-10 space-y-8">
            <div className="flex items-center gap-4 py-2 border-b border-gp-border">
              <div className="w-10 h-10 rounded-xl bg-gp-blue/10 text-gp-blue flex items-center justify-center">
                <User size={20} strokeWidth={2.5} />
              </div>
              <h3 className="text-[16px] font-black text-gp-text tracking-tight uppercase">Colaborador de Destino</h3>
            </div>
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-gp-muted uppercase tracking-widest ml-1">Funcionário Recebedor</label>
              {loading && !users.length ? (
                <div className="gp-skeleton h-12 w-full" />
              ) : (
                <SearchableSelect 
                  options={userOptions}
                  value={selectedUserId}
                  onChange={setSelectedUserId}
                  placeholder="Buscar colaborador por nome..."
                />
              )}
            </div>
          </section>

          {/* Seção 3: Observações */}
          <section className="gp-card bg-gp-surface overflow-hidden relative border-gp-blue/30 border-2">
            <div className="p-6 sm:p-10 space-y-8 relative z-10">
              <div className="flex items-center gap-4 py-2 border-b border-gp-border">
                <div className="w-10 h-10 rounded-xl bg-gp-blue text-white flex items-center justify-center shadow-lg shadow-gp-blue/20">
                  <FileText size={20} strokeWidth={2.5} />
                </div>
                <h3 className="text-[16px] font-black text-gp-text tracking-tight uppercase">Observações de Entrega</h3>
              </div>
              
              <textarea
                rows={4}
                placeholder="Ex: Entregue com carregador, mochila e mouse. Equipamento em excelente estado."
                className="gp-input px-6 py-4 min-h-[140px] resize-none"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
            <Truck size={180} className="absolute -right-20 -bottom-20 text-gp-blue opacity-[0.03] -rotate-12 pointer-events-none" />
          </section>
        </div>

        <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-8">
           <button
             type="button"
             onClick={() => navigate('/estoque')}
             className="w-full sm:w-auto px-10 py-3.5 btn-premium-ghost rounded-xl order-2 sm:order-1"
           >
             CANCELAR
           </button>
           <button
             type="submit"
             disabled={loading || !selectedAssetId || !selectedUserId}
             className="w-full sm:w-auto px-12 py-3.5 btn-premium-primary rounded-xl order-1 sm:order-2 shadow-gp-blue/20"
           >
             {loading ? (
               <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
             ) : (
               <>
                 <CheckCircle size={18} strokeWidth={3} />
                 CONFIRMAR ENTREGA
               </>
             )}
           </button>
        </div>
      </form>
    </div>
  );
}
