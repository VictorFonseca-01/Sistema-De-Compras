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
  Barcode
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
       <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in zoom-in duration-500">
         <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-[2rem] flex items-center justify-center mb-8 shadow-xl shadow-blue-500/20">
           <Truck size={48} strokeWidth={3} />
         </div>
         <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-2">Entrega Realizada!</h2>
         <p className="text-slate-500 text-lg max-w-sm">
           O ativo foi vinculado ao usuário e o histórico de movimentação foi registrado com sucesso.
         </p>
         <div className="mt-8 flex items-center gap-2 text-slate-400 font-bold text-sm uppercase tracking-widest">
            <div className="w-4 h-4 border-2 border-slate-300 border-t-primary-600 rounded-full animate-spin"></div>
            Atualizando inventário...
         </div>
       </div>
     );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-6 duration-700">
      <header className="flex flex-col gap-4">
        <button 
          onClick={() => navigate('/estoque')}
          className="btn-premium-ghost px-3 py-1 rounded-lg text-[10px] uppercase tracking-widest"
        >
          <ArrowLeft size={14} /> Descartar
        </button>
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Entrega de Ativo</h1>
        <p className="text-slate-500 text-lg">Vincule um equipamento do estoque a um colaborador.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 p-6 rounded-[2rem] border border-rose-100 dark:border-rose-800 flex gap-4 items-center">
            <AlertCircle size={24} />
            <p className="font-bold">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8">
          <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm p-10 space-y-8 hover:border-primary-500/30 transition-all duration-500 group">
             <h3 className="text-xl font-black flex items-center gap-3">
               <div className="w-10 h-10 rounded-2xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                 <Package size={20} />
               </div>
               Equipamento Selecionado
             </h3>
             <div className="flex gap-4 items-end">
               <div className="flex-1 space-y-3">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ativo disponível</label>
                 {loading ? (
                   <div className="h-[60px] w-full bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl"></div>
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
                 className="h-[60px] px-6 bg-slate-900 text-white dark:bg-white dark:text-slate-950 rounded-2xl flex items-center gap-2 font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 shadow-lg disabled:opacity-50"
               >
                 <Barcode size={20} />
                 Scan
               </button>
             </div>
             <p className="text-[10px] text-slate-400 font-bold italic ml-1">Somente itens com status "Em Estoque" aparecem nesta lista.</p>

             {showScanner && (
               <BarcodeScanner 
                 onScan={handleScanAsset}
                 onClose={() => setShowScanner(false)} 
               />
             )}
          </section>

          <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm p-10 space-y-8 hover:border-blue-500/30 transition-all duration-500 group">
             <h3 className="text-xl font-black flex items-center gap-3">
               <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                 <User size={20} />
               </div>
               Colaborador de Destino
             </h3>
             <div className="space-y-3">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Funcionário Recebedor</label>
               {loading ? (
                 <div className="h-[60px] w-full bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl"></div>
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

          <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm p-10 space-y-8">
             <h3 className="text-xl font-black flex items-center gap-3">
               <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center">
                 <FileText size={20} />
               </div>
               Observações de Entrega
             </h3>
             <textarea
                rows={4}
                placeholder="Ex: Entregue com carregador, mochila e mouse. Equipamento sem riscos aparentes."
                className="w-full px-8 py-6 bg-slate-50 dark:bg-slate-800 border-2 border-transparent rounded-[2rem] focus:border-primary-500 focus:bg-white dark:focus:bg-slate-950 outline-none transition-all font-medium text-slate-600 dark:text-slate-300 resize-none leading-relaxed"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
          </section>
        </div>

        <div className="flex justify-end pt-5">
           <button
             type="submit"
             disabled={loading || !selectedAssetId || !selectedUserId}
             className="w-full sm:w-auto btn-premium-primary px-12 py-5 rounded-[2rem] shadow-2xl shadow-primary-500/30"
           >
             {loading ? 'PROCESSANDO...' : (
               <>
                 <CheckCircle size={22} strokeWidth={3} />
                 CONFIRMAR ENTREGA
               </>
             )}
           </button>
        </div>
      </form>
    </div>
  );
}
