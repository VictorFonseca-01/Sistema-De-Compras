import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Settings2,
  Activity,
  Building2
} from 'lucide-react';
import { clsx } from 'clsx';
import type { Asset } from '../services/assetService';

interface BulkActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { type: 'status' | 'local', value: string, notes: string }) => void;
  selectedCount: number;
  isProcessing: boolean;
}

export function BulkActionModal({ isOpen, onClose, onConfirm, selectedCount, isProcessing }: BulkActionModalProps) {
  const [actionType, setActionType] = useState<'status' | 'local'>('status');
  const [statusValue, setStatusValue] = useState<Asset['status']>('em_uso');
  const [localValue, setLocalValue] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      type: actionType,
      value: actionType === 'status' ? statusValue : localValue,
      notes
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gp-bg/80 backdrop-blur-sm animate-fade-in text-gp-text">
      <div className="gp-card w-full max-w-xl shadow-2xl border-gp-blue/20 overflow-hidden animate-zoom-in">
        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gp-blue/10 text-gp-blue flex items-center justify-center shadow-inner text-gp-blue">
                <Settings2 size={28} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gp-text">Ações em Massa</h3>
                <p className="text-[11px] font-bold text-gp-blue uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle2 size={12} /> {selectedCount} itens selecionados
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gp-surface2 rounded-xl transition-colors text-gp-text3"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
               <button 
                type="button"
                onClick={() => setActionType('status')}
                className={clsx(
                  "flex flex-col items-center gap-3 p-5 rounded-2xl border transition-all",
                  actionType === 'status' ? "bg-gp-blue/5 border-gp-blue text-gp-blue" : "bg-gp-surface2 border-gp-border text-gp-text3 hover:border-gp-text"
                )}
               >
                 <Activity size={24} />
                 <span className="text-[11px] font-bold uppercase tracking-wider">Alterar Situação</span>
               </button>
               <button 
                type="button"
                onClick={() => setActionType('local')}
                className={clsx(
                  "flex flex-col items-center gap-3 p-5 rounded-2xl border transition-all",
                  actionType === 'local' ? "bg-gp-blue/5 border-gp-blue text-gp-blue" : "bg-gp-surface2 border-gp-border text-gp-text3 hover:border-gp-text"
                )}
               >
                 <Building2 size={24} />
                 <span className="text-[11px] font-bold uppercase tracking-wider">Mover Local</span>
               </button>
            </div>

            <div className="space-y-4">
              {actionType === 'status' ? (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gp-text3 uppercase tracking-widest ml-1">Nova Situação para o Lote</label>
                  <select 
                    value={statusValue}
                    onChange={(e) => setStatusValue(e.target.value as any)}
                    className="gp-input h-12 px-4 font-bold bg-transparent"
                  >
                    <option value="em_estoque">EM ESTOQUE (DEVOLVER)</option>
                    <option value="em_uso">EM USO EXTERNO</option>
                    <option value="manutencao">ENCAMINHAR PARA MANUTENÇÃO</option>
                    <option value="baixado">BAIXAR DEFINITIVAMENTE</option>
                  </select>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gp-text3 uppercase tracking-widest ml-1">Nova Unidade / Localização</label>
                  <input 
                    type="text"
                    required
                    placeholder="Ex: Sala de TI, Setor de Conferência..."
                    value={localValue}
                    onChange={(e) => setLocalValue(e.target.value)}
                    className="gp-input h-12"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gp-text3 uppercase tracking-widest ml-1">Justificativa para a Auditoria</label>
                <textarea 
                  required
                  rows={3}
                  placeholder="Informar o motivo da transição em massa..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="gp-input p-4 resize-none min-h-[100px]"
                />
              </div>
            </div>

            {statusValue === 'baixado' && actionType === 'status' && (
              <div className="flex items-start gap-4 p-4 bg-gp-error/5 border border-gp-error/20 rounded-2xl">
                <AlertTriangle size={24} className="text-gp-error shrink-0 mt-0.5" />
                <p className="text-[11px] text-gp-error font-bold leading-relaxed">
                  CUIDADO: Você está prestes a dar baixa em múltiplos ativos de forma irreversível. Esta ação será auditada individualmente.
                </p>
              </div>
            )}

            <div className="flex gap-4 pt-2">
              <button 
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="flex-1 h-14 btn-premium-secondary rounded-2xl text-[11px] font-bold uppercase tracking-widest"
              >
                CANCELAR
              </button>
              <button 
                type="submit"
                disabled={isProcessing || (actionType === 'local' && !localValue) || !notes}
                className="flex-1 h-14 btn-premium-primary rounded-2xl text-[11px] font-bold uppercase tracking-widest shadow-xl shadow-gp-blue/10"
              >
                {isProcessing ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                ) : (
                  <>EXECUTAR EM MASSA</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
