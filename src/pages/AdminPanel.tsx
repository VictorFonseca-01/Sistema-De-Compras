import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Shield, BuildingIcon, Clock } from 'lucide-react';
import type { Profile } from '../hooks/useProfile';

export default function AdminPanel() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setUsers(data as Profile[]);
    setLoading(false);
  };

  const roleColors: Record<string, string> = {
    master_admin: 'bg-rose-100 text-rose-700 border-rose-200',
    diretoria: 'bg-purple-100 text-purple-700 border-purple-200',
    gestor: 'bg-amber-100 text-amber-700 border-amber-200',
    ti: 'bg-blue-100 text-blue-700 border-blue-200',
    compras: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    usuario: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="text-primary-500" />
            Painel da TI / Diretoria
          </h1>
          <p className="text-slate-500">Gestão global de acessos e usuários corporativos.</p>
        </div>
      </header>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4">
          <div className="bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 p-3 rounded-xl">
            <Users size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg">Usuários Registrados</h3>
            <p className="text-sm text-slate-500">{users.length} contas cadastradas na base de dados</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs uppercase tracking-widest font-bold">
                <th className="px-6 py-4">Usuário</th>
                <th className="px-6 py-4">E-mail Corporativo</th>
                <th className="px-6 py-4">Nível de Acesso (Cargo)</th>
                <th className="px-6 py-4">Departamento</th>
                <th className="px-6 py-4 text-right">Cadastrado em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-8 h-16 bg-slate-50/50 dark:bg-slate-800/30"></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">
                    Nenhum usuário encontrado na base de dados.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-sm text-slate-600 dark:text-slate-300">
                          {u.full_name ? u.full_name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {u.full_name || 'Sem nome informado'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-sm">
                      {u.email}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${roleColors[u.role] || roleColors.usuario} uppercase tracking-wider`}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-slate-500">
                        <BuildingIcon size={14} />
                        {u.department || 'Não definido'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                        <Clock size={12} />
                        {(u as any).created_at ? new Date((u as any).created_at).toLocaleDateString('pt-BR') : '-'}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
