import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  ArrowLeft, 
  Package, 
  Tag, 
  History, 
  User, 
  Truck,
  RotateCcw,
  Wrench,
  Ban,
  MoreVertical,
  Activity,
  Calendar,
  Building2,
  Cpu,
  X,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { clsx } from 'clsx';
import { useProfile } from '../hooks/useProfile';
import { assetService } from '../services/assetService';
import { toast } from 'react-hot-toast';

export default function AssetDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [asset, setAsset] = useState<any>(null);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para Controle de Ação v5.0
  const [actionModal, setActionModal] = useState<{ open: boolean; type: 'devolucao' | 'manutencao' | 'baixa' | 'movimentacao' | null }>({
    open: false,
    type: null
  });
  const [actionNotes, setActionNotes] = useState('');
  const [newLocal, setNewLocal] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (id) {
      fetchAssetDetails();
    }
  }, [id]);

  async function fetchAssetDetails() {
    setLoading(true);
    // 1. Buscar ativo
    const { data: assetData, error: assetError } = await supabase
      .from('assets')
      .select('*, requests(*)')
      .eq('id', id)
      .single();

    if (!assetError && assetData) {
      setAsset(assetData);
    }

    // 2. Buscar movimentações
    const { data: moveData, error: moveError } = await supabase
      .from('asset_movements')
      .select('*, users:user_id(full_name), destino:destino_user_id(full_name)')
      .eq('asset_id', id)
      .order('created_at', { ascending: false });

    if (!moveError && moveData) {
      setMovements(moveData);
    }

    setLoading(false);
  }

  async function handleActionConfirm() {
    if (!profile || !actionModal.type) return;
    
    setIsProcessing(true);
    let error: any = null;

    try {
      if (actionModal.type === 'devolucao') {
        const result = await assetService.returnAsset(id!, profile.id, actionNotes);
        error = result.error;
      } else if (actionModal.type === 'movimentacao') {
        const result = await assetService.updateAssetLocation(id!, newLocal, profile.id, actionNotes);
        error = result.error;
      } else {
        const status = actionModal.type === 'manutencao' ? 'manutencao' : 'baixado';
        const result = await assetService.updateAssetStatus(id!, status, profile.id, actionNotes);
        error = result.error;
      }

      if (error) {
        toast.error('Erro ao processar ação: ' + error.message);
      } else {
        toast.success(`Ação de ${actionModal.type} realizada com sucesso!`);
        setActionModal({ open: false, type: null });
        setActionNotes('');
        setNewLocal('');
        fetchAssetDetails(); // Atualiza a tela e o histórico
      }
    } catch (err: any) {
      toast.error('Erro inesperado: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  }

  const statusMap: any = {
    em_estoque: { label: 'Disponível no Estoque', badge: 'gp-badge-success' },
    em_uso: { label: 'Em Uso Externo', badge: 'gp-badge-blue' },
    manutencao: { label: 'Em Manutenção Técnica', badge: 'gp-badge-warning' },
    baixado: { label: 'Ativo Baixado / Descarte', badge: 'gp-badge-red' },
  };

  if (loading) return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 animate-fade-up">
      <div className="h-4 w-32 bg-gp-border rounded mb-4 animate-pulse"></div>
      <div className="flex justify-between items-end">
        <div className="space-y-4">
          <div className="h-6 w-40 bg-gp-border rounded animate-pulse"></div>
          <div className="h-12 w-96 bg-gp-border rounded-xl animate-pulse"></div>
          <div className="h-6 w-48 bg-gp-border rounded animate-pulse"></div>
        </div>
        <div className="flex gap-3">
          <div className="h-12 w-48 bg-gp-border rounded-xl animate-pulse"></div>
          <div className="h-12 w-12 bg-gp-border rounded-xl animate-pulse"></div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 h-[500px] bg-gp-surface2 border border-gp-border rounded-[2rem] animate-pulse"></div>
        <div className="h-[400px] bg-gp-surface2 border border-gp-border rounded-[2rem] animate-pulse"></div>
      </div>
    </div>
  );
  if (!asset) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-up">
      <div className="gp-card p-12 max-w-md flex flex-col items-center">
        <div className="w-20 h-20 bg-gp-surface2 text-gp-text3 rounded-2xl flex items-center justify-center mb-6">
          <Package size={40} />
        </div>
        <h2 className="text-xl font-bold text-gp-text mb-2">Ativo não encontrado</h2>
        <p className="text-gp-text3 text-sm font-medium">Verifique o link ou se o item ainda existe no inventário.</p>
        <button 
          onClick={() => navigate('/estoque')} 
          className="btn-premium-primary px-8 py-3 rounded-xl mt-8"
        >
          VOLTAR AO ESTOQUE
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-fade-up">
      <header className="flex flex-col gap-5">
        <button 
          onClick={() => navigate('/estoque')}
          className="flex items-center gap-2 text-gp-text3 font-bold hover:text-gp-blue transition-colors text-[12px] uppercase tracking-wider"
        >
          <ArrowLeft size={16} /> Voltar ao Estoque
        </button>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-2">
             <div className="flex items-center gap-2">
                <span className={clsx("gp-badge", statusMap[asset.status]?.badge || 'gp-badge-gray')}>
                  {statusMap[asset.status]?.label.toUpperCase()}
                </span>
             </div>
             <h1 className="gp-page-title text-3xl md:text-4xl">{asset.nome_item}</h1>
             <p className="gp-page-subtitle flex items-center gap-2">
                <Tag size={18} className="text-gp-blue" /> Patrimônio #{asset.numero_patrimonio}
             </p>
          </div>
          <div className="flex gap-3">
              <button 
                onClick={() => navigate('/entrega-ativo', { state: { assetId: asset.id } })}
                disabled={asset.status !== 'em_estoque'}
                className="btn-premium-primary px-6 py-3 rounded-xl shadow-gp-blue/20"
              >
                <Truck size={18} strokeWidth={2} />
                ENTREGAR P/ USUÁRIO
              </button>
             <button className="btn-premium-secondary p-3 rounded-xl">
               <MoreVertical size={20} />
             </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Lado Esquerdo: Detalhes */}
        <div className="lg:col-span-2 space-y-6">
          <section className="gp-card p-8 sm:p-10 space-y-10">
            {/* Main Specs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gp-text3 uppercase tracking-widest ml-1">Fabricante / Marca</label>
                <p className="text-lg font-bold text-gp-text">{asset.marca || 'N/A'}</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gp-text3 uppercase tracking-widest ml-1">Modelo Comercial</label>
                <p className="text-lg font-bold text-gp-text">{asset.modelo || 'N/A'}</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gp-text3 uppercase tracking-widest ml-1">Número de Série (SN)</label>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gp-surface2 border border-gp-border rounded-lg w-fit">
                   <Cpu size={14} className="text-gp-blue" />
                   <code className="text-[13px] font-bold text-gp-text font-mono">{asset.numero_serie || 'N/A'}</code>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gp-text3 uppercase tracking-widest ml-1">Localização Atual</label>
                <div className="flex items-center gap-2">
                   <Building2 size={16} className="text-gp-blue" />
                   <p className="text-sm font-bold text-gp-text uppercase tracking-wide">{asset.local || 'Estoque Central'}</p>
                </div>
              </div>
              {asset.usuario_nome_importado && (
                <div className="space-y-1.5 col-span-full pt-6 border-t border-gp-border">
                  <label className="text-[10px] font-bold text-gp-error uppercase tracking-widest ml-1">Usuário de Referência (Importação)</label>
                  <div className="flex items-center gap-3">
                    <User size={18} className="text-gp-error opacity-70" />
                    <p className="text-lg font-bold text-gp-text">{asset.usuario_nome_importado}</p>
                  </div>
                  <p className="text-[10px] text-gp-text3 font-medium italic mt-1">*Este usuário não está vinculado via sistema, apenas registrado na importação.</p>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="pt-8 border-t border-gp-border space-y-3">
              <label className="text-[10px] font-bold text-gp-text3 uppercase tracking-widest ml-1">Descrição Técnica / Observações</label>
              <div className="p-5 bg-gp-surface2 rounded-2xl border border-gp-border">
                <p className="text-gp-text2 text-[14px] leading-relaxed font-medium">
                  {asset.descricao || asset.observacoes || 'Nenhum detalhe adicional informado.'}
                </p>
              </div>
            </div>

            {/* Financials */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
               <div className="p-5 bg-gp-surface2 border border-gp-border rounded-2xl">
                  <p className="text-[10px] font-bold text-gp-text3 uppercase tracking-widest mb-2">Custo Aquisição</p>
                  <p className="text-xl font-bold text-gp-success leading-none">R$ {asset.valor ? asset.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}</p>
               </div>
               <div className="p-5 bg-gp-surface2 border border-gp-border rounded-2xl">
                  <p className="text-[10px] font-bold text-gp-text3 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Calendar size={12} /> Data da Compra
                  </p>
                  <p className="text-xl font-bold text-gp-text leading-none">
                    {asset.data_compra ? new Date(asset.data_compra).toLocaleDateString() : 'N/A'}
                  </p>
               </div>
               <div className="p-5 bg-gp-surface2 border border-gp-border rounded-2xl">
                  <p className="text-[10px] font-bold text-gp-text3 uppercase tracking-widest mb-2">Fornecedor</p>
                  <p className="text-[15px] font-bold text-gp-text truncate leading-none">{asset.fornecedor || 'N/A'}</p>
               </div>
            </div>
          </section>

          {/* Quick Actions (Cards) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {[
               { icon: RotateCcw, label: 'Devolução', color: 'text-gp-blue', bg: 'bg-gp-blue-muted', hover: 'hover:border-gp-blue' },
               { icon: Wrench, label: 'Manutenção', color: 'text-gp-warning', bg: 'bg-gp-warning/10', hover: 'hover:border-gp-warning' },
               { icon: Ban, label: 'Baixa', color: 'text-gp-error', bg: 'bg-gp-error/10', hover: 'hover:border-gp-error' },
               { icon: Package, label: 'Mover Local', color: 'text-gp-text3', bg: 'bg-gp-surface3', hover: 'hover:border-gp-blue' }
             ].map((action, i) => (
                <button 
                  key={i} 
                  onClick={() => {
                    const type = action.label.toLowerCase()
                      .normalize("NFD")
                      .replace(/[\u0300-\u036f]/g, "")
                      .replace('mover local', 'movimentacao') as any;
                    setActionModal({ open: true, type });
                  }}
                  className={clsx("flex flex-col items-center justify-center p-6 gp-card transition-all group", action.hover)}
                >
                   <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110", action.bg, action.color)}>
                      <action.icon size={22} />
                   </div>
                   <span className="text-[10px] font-bold text-gp-text3 uppercase tracking-widest text-center">{action.label}</span>
                </button>
             ))}
          </div>
        </div>

        {/* Lado Direito: Timeline de Movimentações */}
        <div className="space-y-6">
           <div className="gp-card bg-gp-surface overflow-hidden relative border-gp-blue/30 border-2 p-8">
              <History className="absolute -right-10 -bottom-10 text-gp-blue opacity-[0.05] -rotate-12" size={160} />
              <div className="relative z-10">
                <h3 className="text-lg font-bold text-gp-text flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gp-blue text-white flex items-center justify-center shadow-lg shadow-gp-blue/20">
                    <Activity size={20} strokeWidth={2} />
                  </div>
                  Rastreabilidade
                </h3>
                <p className="text-gp-text3 text-sm mt-3 font-medium leading-relaxed">Histórico completo de auditoria para o ciclo de vida deste ativo.</p>
              </div>
           </div>

           <div className="space-y-6 px-2">
              {movements.length === 0 ? (
                <div className="py-10 text-center text-gp-text3 italic text-sm">
                  Nenhuma movimentação registrada.
                </div>
              ) : movements.map((move, i) => (
                <div key={move.id} className="relative pl-12 group">
                   {/* Linha vertical */}
                   {i !== movements.length - 1 && <div className="absolute left-[19px] top-10 bottom-[-24px] w-0.5 bg-gp-border"></div>}
                   
                   {/* Circle Badge */}
                   <div className={clsx(
                     "absolute left-0 top-0 w-10 h-10 rounded-[14px] border-[3px] border-background flex items-center justify-center z-10 transition-all shadow-sm ring-4 ring-background",
                     move.tipo === 'entrada' ? 'bg-gp-success text-white shadow-gp-success/30' : 
                     move.tipo === 'entrega' ? 'bg-gp-blue text-white shadow-gp-blue/30' :
                     'bg-gp-text3 text-white'
                   )}>
                      {move.tipo === 'entrada' ? <Package size={14} /> : 
                       move.tipo === 'entrega' ? <User size={14} /> :
                       <Activity size={14} />}
                   </div>

                   <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                         <p className="text-[10px] font-bold uppercase tracking-widest text-gp-text3">
                           {new Date(move.created_at).toLocaleDateString()} — {new Date(move.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                         </p>
                         <span className="text-[9px] font-black text-gp-text3 opacity-30">#{move.id.slice(0, 4).toUpperCase()}</span>
                      </div>
                      <h4 className="font-bold text-gp-text text-[15px] capitalize leading-tight">
                         {move.tipo === 'entrega' ? `Atribuído a ${move.destino?.full_name || 'Desconhecido'}` : 
                          move.tipo === 'entrada' ? 'Entrada no Inventário' : move.tipo}
                      </h4>
                      <p className="text-[13px] text-gp-text3 font-medium leading-relaxed italic border-l-2 border-gp-border pl-3 my-2">
                         "{move.observacao || 'Nenhum detalhe adicional.'}"
                      </p>
                      <p className="text-[9px] font-bold text-gp-blue-light uppercase tracking-widest">
                         Auditado por: {move.users?.full_name || 'Sistema'}
                      </p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* Modal de Ação v5.0 */}
      {actionModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gp-bg/80 backdrop-blur-sm animate-fade-in">
          <div className="gp-card w-full max-w-lg shadow-2xl border-gp-blue/20 overflow-hidden animate-zoom-in">
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className={clsx(
                    "w-12 h-12 rounded-2xl flex items-center justify-center",
                    actionModal.type === 'devolucao' ? 'bg-gp-blue/10 text-gp-blue' :
                    actionModal.type === 'manutencao' ? 'bg-gp-warning/10 text-gp-warning' :
                    actionModal.type === 'baixa' ? 'bg-gp-error/10 text-gp-error' :
                    'bg-gp-surface3 text-gp-text'
                  )}>
                    {actionModal.type === 'devolucao' && <RotateCcw size={24} />}
                    {actionModal.type === 'manutencao' && <Wrench size={24} />}
                    {actionModal.type === 'baixa' && <Ban size={24} />}
                    {actionModal.type === 'movimentacao' && <Package size={24} />}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gp-text capitalize">Confirmar {actionModal.type}</h3>
                    <p className="text-[11px] font-bold text-gp-text3 uppercase tracking-widest">Ação de Gestão de Ativos</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActionModal({ open: false, type: null })}
                  className="p-2 hover:bg-gp-surface2 rounded-xl transition-colors text-gp-text3"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-5">
                {actionModal.type === 'movimentacao' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gp-text3 uppercase tracking-widest ml-1">Nova Localização</label>
                    <input 
                      type="text"
                      placeholder="Ex: Hangar 4, Setor Técnico B..."
                      className="gp-input h-12"
                      value={newLocal}
                      onChange={e => setNewLocal(e.target.value)}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gp-text3 uppercase tracking-widest ml-1">Observações / Motivo</label>
                  <textarea 
                    rows={3}
                    placeholder="Descreva o motivo desta ação..."
                    className="gp-input p-4 resize-none min-h-[100px]"
                    value={actionNotes}
                    onChange={e => setActionNotes(e.target.value)}
                  />
                </div>

                {actionModal.type === 'baixa' && (
                  <div className="flex items-start gap-3 p-4 bg-gp-error/5 border border-gp-error/20 rounded-xl">
                    <AlertTriangle size={20} className="text-gp-error shrink-0 mt-0.5" />
                    <p className="text-[11px] text-gp-error font-bold leading-relaxed">
                      ATENÇÃO: A baixa de ativo é uma ação irreversível. O item será marcado como descartado ou fora de uso definitivo.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setActionModal({ open: false, type: null })}
                  disabled={isProcessing}
                  className="flex-1 h-12 btn-premium-secondary rounded-xl text-[11px] font-bold"
                >
                  CANCELAR
                </button>
                <button 
                  onClick={handleActionConfirm}
                  disabled={isProcessing || (actionModal.type === 'movimentacao' && !newLocal)}
                  className="flex-1 h-12 btn-premium-primary rounded-xl text-[11px] font-bold shadow-lg shadow-gp-blue/10"
                >
                  {isProcessing ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 size={16} /> CONFIRMAR
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
