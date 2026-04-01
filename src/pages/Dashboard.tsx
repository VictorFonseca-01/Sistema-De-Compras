import { useEffect, useState } from 'react';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Plus
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [stats, setStats] = useState([
    { label: 'Pendentes', value: '0', icon: Clock, color: 'text-amber-500', key: 'pending' },
    { label: 'Em Análise TI', value: '0', icon: FileText, color: 'text-blue-500', key: 'pending_ti' },
    { label: 'Aprovadas', value: '0', icon: CheckCircle, color: 'text-emerald-500', key: 'approved' },
    { label: 'Recusadas', value: '0', icon: AlertCircle, color: 'text-rose-500', key: 'rejected' },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const { data: requests } = await supabase.from('requests').select('status');
      
      if (requests) {
        const counts = {
          pending: requests.filter(r => r.status.startsWith('pending_') && r.status !== 'pending_ti').length,
          pending_ti: requests.filter(r => r.status === 'pending_ti').length,
          approved: requests.filter(r => r.status === 'approved').length,
          rejected: requests.filter(r => r.status === 'rejected').length,
        };

        setStats(prev => prev.map(s => ({ 
          ...s, 
          value: counts[s.key as keyof typeof counts].toString() 
        })));
      }
      setLoading(false);
    }

    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Dashboard</h1>
          <p className="text-slate-500">Bem-vindo ao Sistema de Solicitação de Compras de TI.</p>
        </div>
        <Link 
          to="/nova-solicitacao"
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg shadow-primary-600/20"
        >
          <Plus size={20} />
          Criar Solicitação
        </Link>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                  {stat.label}
                </p>
                <p className="text-3xl font-bold mt-1 text-slate-900 dark:text-slate-50">
                  {loading ? '...' : stat.value}
                </p>
              </div>
              <div className={`${stat.color} bg-current/10 p-3 rounded-lg`}>
                <stat.icon size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-2">Novo Usuário?</h2>
          <p className="text-primary-100 max-w-md mb-6">
            Lembre-se que todas as solicitações passam por um fluxo de aprovação que inclui seu Gestor, TI, Compras e Diretoria.
          </p>
          <Link 
            to="/solicitacoes" 
            className="inline-block bg-white text-primary-700 px-6 py-2 rounded-lg font-bold hover:bg-primary-50 transition-colors"
          >
            Ver minhas solicitações
          </Link>
        </div>
        <FileText className="absolute -right-4 -bottom-4 text-white/10 w-64 h-64 -rotate-12" />
      </div>
    </div>
  );
}
