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

const labelClass = "text-[10px] font-black text-gp-muted uppercase tracking-[0.2em] ml-1 leading-none";

export default function AssetDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [asset, setAsset] = useState<any>(null);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para Controle de Ação
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
    const { data: assetData, error: assetError } = await supabase
      .from('assets')
      .select('*, requests(*)')
      .eq('id', id)
      .single();

    if (!assetError && assetData) {
      setAsset(assetData);
    }

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
        toast.error('Operação negada: ' + error.message);
      } else {
        toast.success(`Protocolo de ${actionModal.type} gerado com sucesso.`);
        setActionModal({ open: false, type: null });
        setActionNotes('');
        setNewLocal('');
        fetchAssetDetails();
      }
    } catch (err: any) {
      toast.error('Falha crítica: ' + err.message);
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
    <div className="max-w-6xl mx-auto space-y-8 pb-16 px-4 sm:px-0">
      <div className="gp-skeleton h-4 w-32 mb-6" />
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-8">
        <div className="space-y-4 flex-1">
          <div className="gp-skeleton h-6 w-40" />
          <div className="gp-skeleton h-10 w-full max-w-lg" />
          <div className="gp-skeleton h-5 w-48" />
        </div>
        <div className="flex gap-3">
          <div className="gp-skeleton h-12 w-48 rounded-xl" />
          <div className="gp-skeleton h-12 w-12 rounded-xl" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 gp-card h-[600px] animate-pulse" />
        <div className="gp-card h-[400px] animate-pulse" />
      </div>
    </div>
  );

  if (!asset) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-up px-6">
      <div className="gp-card p-12 max-w-md flex flex-col items-center shadow-2xl">
        <div className="w-20 h-20 bg-gp-surface2 text-gp-muted rounded-3xl flex items-center justify-center mb-8 border border-gp-border shadow-inner">
          <Package size={40} strokeWidth={2.5} />
        </div>
        <h2 className="text-2xl font-black text-gp-text mb-3 uppercase tracking-tight">Ativo Independente</h2>
        <p className="text-gp-text2 text-[15px] font-medium leading-relaxed">Este equipamento não foi localizado na base de dados global.</p>
        <button 
          onClick={() => navigate('/estoque')} 
          className="btn-premium-primary px-10 py-3.5 rounded-xl mt-8 font-black uppercase text-[11px] tracking-widest"
        >
          VOLTAR AO ESTOQUE
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 px-4 sm:px-0 animate-fade-up">
      <header className="flex flex-col gap-6">
        <button 
          onClick={() => navigate('/estoque')}
          className="flex items-center gap-2 text-gp-muted font-black hover:text-gp-blue transition-colors text-[10px] uppercase tracking-[0.2em] mb-2"
        >
          <ArrowLeft size={14} strokeWidth={3} /> Voltar ao Inventário
        </button>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div className="space-y-4">
             <div className="flex items-center gap-2">
                <span className={clsx("gp-badge font-black text-[10px] tracking-widest", statusMap[asset.status]?.badge || 'gp-badge-gray')}>
                   <CircleStatusIcon status={asset.status} />
                   {statusMap[asset.status]?.label.toUpperCase()}
                </span>
             </div>
             <h1 className="gp-page-title text-3xl md:text-4xl leading-tight">{asset.nome_item}</h1>
             <div className="flex items-center gap-4 text-gp-muted font-black uppercase text-[12px] tracking-[0.15em]">
                <div className="flex items-center gap-2 bg-gp-blue/[0.03] px-3 py-1.5 rounded-lg border border-gp-blue/10">
                   <Tag size={16} className="text-gp-blue-light" strokeWidth={3} /> 
                   <span className="text-gp-blue-light">PATRIMÔNIO #{asset.numero_patrimonio}</span>
                </div>
                <div className="hidden sm:flex items-center gap-2 opacity-60">
                   <Building2 size={16} strokeWidth={2.5} />
                   <span>{asset.local || 'ESTOQUE CENTRAL'}</span>
                </div>
             </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
              <button 
                onClick={() => navigate('/entrega-ativo', { state: { assetId: asset.id } })}
                disabled={asset.status !== 'em_estoque'}
                className="btn-premium-primary flex-1 md:flex-none px-8 py-4 rounded-xl shadow-xl shadow-gp-blue/20 uppercase text-[11px] font-black tracking-widest"
              >
                <Truck size={20} strokeWidth={3} />
                ENTREGA / ATRIBUIÇÃO
              </button>
             <button className="btn-premium-secondary p-4 rounded-xl shrink-0 group">
               <MoreVertical size={20} className="group-hover:text-gp-blue transition-colors" />
             </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Lado Esquerdo: Detalhes */}
        <div className="lg:col-span-2 space-y-6">
          <section className="gp-card p-6 sm:p-10 space-y-10">
            {/* Main Specs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
              <SpecItem label="Fabricante / Marca" value={asset.marca} />
              <SpecItem label="Modelo Comercial" value={asset.modelo} />
              
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gp-muted uppercase tracking-[0.2em] ml-1 leading-none">Número de Série (SN)</label>
                <div className="flex items-center gap-3 px-5 py-3 bg-gp-surface2 border border-gp-border rounded-xl w-fit group hover:border-gp-blue transition-colors shadow-inner">
                   <Cpu size={16} className="text-gp-blue-light group-hover:text-gp-blue transition-colors" strokeWidth={2.5} />
                   <code className="text-[14px] font-black text-gp-text font-mono tracking-widest select-all">{asset.numero_serie || 'N/A'}</code>
                </div>
              </div>

              <SpecItem label="Unidade Vinculada" value={asset.local || 'MATRIZ / ESTOQUE CENTRAL'} />

              {asset.usuario_nome_importado && (
                <div className="space-y-4 col-span-full pt-10 border-t border-gp-border">
                  <label className="text-[10px] font-black text-gp-error uppercase tracking-[0.2em] ml-1 leading-none flex items-center gap-2">
                     <AlertTriangle size={12} strokeWidth={3} /> Usuário Legado / Importação
                  </label>
                  <div className="flex items-center gap-4 p-5 bg-gp-error/[0.03] border border-gp-error/10 rounded-2xl">
                    <div className="w-10 h-10 rounded-xl bg-gp-error/10 text-gp-error flex items-center justify-center shrink-0">
                       <User size={20} strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0">
                       <p className="text-lg font-black text-gp-text truncate leading-none uppercase tracking-tight">{asset.usuario_nome_importado}</p>
                       <p className="text-[10px] text-gp-muted font-black uppercase mt-2 tracking-tighter opacity-70">Vínculo não oficializado no sistema</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="pt-10 border-t border-gp-border space-y-4">
              <label className="text-[10px] font-black text-gp-muted uppercase tracking-[0.2em] ml-1 leading-none">Detalhamento / Observações</label>
              <div className="p-6 sm:p-8 bg-gp-surface2 rounded-2xl border border-gp-border shadow-inner">
                <p className="text-gp-text text-[15px] leading-relaxed font-medium">
                  {asset.descricao || asset.observacoes || 'Nenhum detalhe adicional informado no registro.'}
                </p>
              </div>
            </div>

            {/* Financials / Logistics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
               <MetricBox label="Custo Aquisição" value={`R$ ${asset.valor ? asset.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}`} color="text-gp-success" />
               <MetricBox label="Data Compra" value={asset.data_compra ? new Date(asset.data_compra).toLocaleDateString() : 'N/A'} icon={<Calendar size={14} />} />
               <MetricBox label="Fornecedor" value={asset.fornecedor || 'N/A'} />
            </div>
          </section>

          {/* Quick Actions (Cards) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {[
               { icon: RotateCcw, label: 'Devolução', color: 'text-gp-blue', bg: 'bg-gp-blue/10', hover: 'hover:border-gp-blue/40' },
               { icon: Wrench, label: 'Manutenção', color: 'text-gp-amber', bg: 'bg-gp-amber/10', hover: 'hover:border-gp-amber/40' },
               { icon: Ban, label: 'Baixa / Descarte', color: 'text-gp-error', bg: 'bg-gp-error/10', hover: 'hover:border-gp-error/40' },
               { icon: Building2, label: 'Mover Local', color: 'text-gp-muted', bg: 'bg-gp-surface3', hover: 'hover:border-gp-blue/40' }
             ].map((action, i) => (
                <button 
                  key={i} 
                  onClick={() => {
                    const type = action.label.toLowerCase()
                      .normalize("NFD")
                      .replace(/[\u0300-\u036f]/g, "")
                      .replace('mover local', 'movimentacao')
                      .replace('baixa / descarte', 'baixa') as any;
                    setActionModal({ open: true, type });
                  }}
                  className={clsx("flex flex-col items-center justify-center p-6 gp-card transition-all group relative overflow-hidden", action.hover)}
                >
                   <div className={clsx("w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-sm border border-gp-border/20", action.bg, action.color)}>
                      <action.icon size={26} strokeWidth={2.5} />
                   </div>
                   <span className="text-[10px] font-black text-gp-muted group-hover:text-gp-text transition-colors uppercase tracking-[0.15em] text-center leading-tight">
                      {action.label}
                   </span>
                   <div className={clsx("absolute -right-4 -bottom-4 w-12 h-12 rounded-full opacity-[0.03] transition-all group-hover:scale-[3]", action.bg)} />
                </button>
             ))}
          </div>
        </div>

        {/* Lado Direito: Histórico */}
        <div className="space-y-6 lg:sticky lg:top-24">
           <div className="gp-card bg-gp-surface overflow-hidden relative border-gp-blue/20 shadow-xl p-8">
              <History className="absolute -right-12 -bottom-12 text-gp-blue opacity-[0.03] -rotate-12 pointer-events-none" size={180} />
              <div className="relative z-10">
                <h3 className="text-[17px] font-black text-gp-text flex items-center gap-4 uppercase tracking-tight">
                  <div className="w-10 h-10 rounded-xl bg-gp-blue text-white flex items-center justify-center shadow-lg shadow-gp-blue/20">
                    <Activity size={22} strokeWidth={2.5} />
                  </div>
                  Auditoria Global
                </h3>
                <p className="text-gp-muted text-[13px] mt-4 font-medium leading-relaxed">
                   Rastreabilidade completa do ciclo de vida e movimentações deste ativo nos servidores Global Parts.
                </p>
              </div>
           </div>

           <div className="space-y-8 px-4 sm:px-2">
              {movements.length === 0 ? (
                <div className="py-12 text-center text-gp-muted font-medium text-[13px] uppercase tracking-widest opacity-40 italic">
                  Nenhuma atividade registrada.
                </div>
              ) : movements.map((move, i) => (
                <div key={move.id} className="relative pl-14 group">
                   {i !== movements.length - 1 && <div className="absolute left-[20px] top-12 bottom-[-28px] w-[2px] bg-gp-border"></div>}
                   
                   <div className={clsx(
                     "absolute left-0 top-0 w-10 h-10 rounded-xl border-[4px] border-gp-bg flex items-center justify-center z-10 transition-all shadow-md group-hover:scale-110",
                     move.tipo === 'entrada' ? 'bg-gp-success text-white' : 
                     move.tipo === 'entrega' ? 'bg-gp-blue text-white' :
                     'bg-gp-muted text-white'
                   )}>
                      {move.tipo === 'entrada' ? <Package size={16} strokeWidth={3} /> : 
                       move.tipo === 'entrega' ? <Truck size={16} strokeWidth={3} /> :
                       <Activity size={16} strokeWidth={3} />}
                   </div>

                   <div className="space-y-2">
                      <div className="flex justify-between items-center">
                         <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gp-muted opacity-60">
                           {new Date(move.created_at).toLocaleDateString()} · {new Date(move.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                         </p>
                         <span className="text-[9px] font-black text-gp-blue-light opacity-20 group-hover:opacity-100 transition-opacity uppercase tracking-tighter">TRX-{move.id.slice(0, 6).toUpperCase()}</span>
                      </div>
                      <h4 className="font-black text-gp-text text-[15px] uppercase tracking-tight leading-tight group-hover:text-gp-blue transition-colors">
                         {move.tipo === 'entrega' ? (move.destino?.full_name || 'DESTINATÁRIO FINAL') : 
                          move.tipo === 'entrada' ? 'CAPITALIZAÇÃO DE ESTOQUE' : move.tipo.toUpperCase()}
                      </h4>
                      <div className="bg-gp-surface2 p-4 rounded-xl border border-gp-border shadow-inner group-hover:border-gp-blue/10 transition-colors">
                         <p className="text-[13px] text-gp-text2 font-medium leading-relaxed italic">
                            "{move.observacao || 'Processo executado via painel de controle.'}"
                         </p>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <div className="w-4 h-4 bg-gp-blue/10 rounded-full flex items-center justify-center">
                           <User size={8} className="text-gp-blue" strokeWidth={3} />
                        </div>
                        <p className="text-[9px] font-black text-gp-blue-light uppercase tracking-widest leading-none">
                           AUDITOR: {move.users?.full_name || 'OPERADOR SISTEMA'}
                        </p>
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* Modal de Ação */}
      {actionModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gp-bg/90 backdrop-blur-md animate-fade-in">
          <div className="gp-card w-full max-w-lg shadow-3xl border-gp-blue/20 overflow-hidden animate-zoom-in">
            <div className="p-8 sm:p-10 space-y-8">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-5">
                  <div className={clsx(
                    "w-14 h-14 rounded-[1.25rem] flex items-center justify-center shadow-lg transition-transform animate-pulse",
                    actionModal.type === 'devolucao' ? 'bg-gp-blue/10 text-gp-blue border border-gp-blue/20' :
                    actionModal.type === 'manutencao' ? 'bg-gp-amber/10 text-gp-amber border border-gp-amber/20' :
                    actionModal.type === 'baixa' ? 'bg-gp-error/10 text-gp-error border border-gp-error/20' :
                    'bg-gp-surface3 text-gp-text border border-gp-border'
                  )}>
                    {actionModal.type === 'devolucao' && <RotateCcw size={28} strokeWidth={2.5} />}
                    {actionModal.type === 'manutencao' && <Wrench size={28} strokeWidth={2.5} />}
                    {actionModal.type === 'baixa' && <Ban size={28} strokeWidth={2.5} />}
                    {actionModal.type === 'movimentacao' && <Building2 size={28} strokeWidth={2.5} />}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-gp-text uppercase tracking-tight leading-none">Confirmar {actionModal.type}</h3>
                    <p className="text-[10px] font-black text-gp-blue-light uppercase tracking-[0.25em] mt-2 opacity-80 leading-none">Protocolo de Operação de Ativos</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActionModal({ open: false, type: null })}
                  className="p-2.5 hover:bg-gp-surface2 rounded-xl transition-colors text-gp-muted hover:text-gp-text shadow-sm"
                >
                  <X size={20} strokeWidth={3} />
                </button>
              </div>

              <div className="space-y-6">
                {actionModal.type === 'movimentacao' && (
                  <div className="space-y-2">
                    <label className={labelClass}>Destino Geográfico / Unidade</label>
                    <input 
                      type="text"
                      placeholder="Ex: Sala de Servidores - Bloco B..."
                      className="gp-input h-14 font-bold"
                      value={newLocal}
                      onChange={e => setNewLocal(e.target.value)}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className={labelClass}>Notas do Auditor / Justificativa</label>
                  <textarea 
                    placeholder="Descreva detalhadamente o motivo deste registro no inventário..."
                    className="gp-input p-5 resize-none min-h-[120px] leading-relaxed"
                    value={actionNotes}
                    onChange={e => setActionNotes(e.target.value)}
                  />
                </div>

                {actionModal.type === 'baixa' && (
                  <div className="flex items-start gap-4 p-5 bg-gp-error/[0.03] border-2 border-gp-error/20 rounded-2xl shadow-inner">
                    <AlertTriangle size={24} className="text-gp-error shrink-0 mt-0.5" strokeWidth={3} />
                    <p className="text-[12px] text-gp-error font-black uppercase tracking-tight leading-relaxed">
                      ADVERTÊNCIA: A baixa de ativo encerra o monitoramento deste item. Esta ação é irreversível e requer autorização superior.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setActionModal({ open: false, type: null })}
                  disabled={isProcessing}
                  className="flex-1 h-14 btn-premium-ghost rounded-xl text-[11px] font-black uppercase tracking-widest"
                >
                  ABORTAR
                </button>
                <button 
                  onClick={handleActionConfirm}
                  disabled={isProcessing || (actionModal.type === 'movimentacao' && !newLocal)}
                  className="flex-1 h-14 btn-premium-primary rounded-xl text-[11px] font-black uppercase tracking-[0.15em] shadow-2xl shadow-gp-blue/20"
                >
                  {isProcessing ? (
                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 size={18} strokeWidth={3} className="mr-2" /> EFETIVAR REGISTRO
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gp-blue/5 rounded-full blur-[60px] pointer-events-none" />
          </div>
        </div>
      )}
    </div>
  );
}

function SpecItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-2">
      <label className={labelClass}>{label}</label>
      <p className="text-[16px] font-black text-gp-text uppercase tracking-tight">{value || 'NÃO INFORMADO'}</p>
    </div>
  );
}

function MetricBox({ label, value, color = 'text-gp-text', icon }: { label: string; value: string; color?: string; icon?: React.ReactNode }) {
  return (
    <div className="p-6 bg-gp-surface2 border border-gp-border rounded-2xl shadow-inner group hover:border-gp-blue/20 transition-colors">
      <p className="text-[9px] font-black text-gp-muted uppercase tracking-[0.2em] mb-3 flex items-center gap-1.5 leading-none">
        {icon} {label}
      </p>
      <p className={clsx("text-lg font-black leading-none uppercase tracking-tighter truncate", color)}>{value}</p>
    </div>
  );
}

function CircleStatusIcon({ status }: { status: string }) {
  const size = 10;
  const sw = 3;
  if (status === 'em_estoque') return <CheckCircle2 size={size} strokeWidth={sw} />;
  if (status === 'em_uso') return <Truck size={size} strokeWidth={sw} />;
  if (status === 'manutencao') return <Wrench size={size} strokeWidth={sw} />;
  return <Ban size={size} strokeWidth={sw} />;
}
