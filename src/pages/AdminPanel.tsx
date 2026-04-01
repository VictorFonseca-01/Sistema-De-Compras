import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Shield, BuildingIcon, Clock, Edit2, Trash2, X, CheckCircle, UserPlus } from 'lucide-react';
import type { Profile } from '../hooks/useProfile';
import { createClient } from '@supabase/supabase-js';

// Cliente secundário para criar usuários sem deslogar o admin
const supabaseAdminAuth = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

export default function AdminPanel() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [editForm, setEditForm] = useState({ role: '', department: '' });
  
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', email: '', password: '', role: 'usuario', department: '' });
  const [addError, setAddError] = useState('');

  const [actionLoading, setActionLoading] = useState(false);

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

  const handleEditClick = (u: Profile) => {
    setEditingUser(u);
    setEditForm({ role: u.role, department: u.department || '' });
  };

  const handeSaveUser = async () => {
    if (!editingUser) return;
    setActionLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({ role: editForm.role as any, department: editForm.department })
      .eq('id', editingUser.id);
    
    if (!error) {
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, role: editForm.role as any, department: editForm.department } : u));
      setEditingUser(null);
    } else {
      alert('Erro ao atualizar usuário: ' + error.message);
    }
    setActionLoading(false);
  };

  const handleDeleteUser = async (id: string, name: string | null) => {
    if (!window.confirm(`Tem certeza que deseja DELETAR o perfil de ${name || 'este usuário'}? Ele perderá acesso ao sistema.`)) return;
    
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (!error) {
      setUsers(users.filter(u => u.id !== id));
    } else {
      alert('Erro ao deletar: ' + error.message);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    setActionLoading(true);

    if (!addForm.email.endsWith('@globalp.com.br')) {
      setAddError('O e-mail deve ser @globalp.com.br');
      setActionLoading(false);
      return;
    }

    // Cria o usuário na tabela auth.users silenciosamente
    const { data: newUser, error: signUpError } = await supabaseAdminAuth.auth.signUp({
      email: addForm.email,
      password: addForm.password,
      options: {
        data: {
          full_name: addForm.name,
          department: addForm.department
        }
      }
    });

    if (signUpError) {
      setAddError(signUpError.message);
      setActionLoading(false);
      return;
    }

    // Se criou sucesso, precisamos aguardar o trigger criar o profile, depois atualizar o cargo!
    // Esperamos 2 segundos pro trigger rodar de forma segura
    setTimeout(async () => {
      if (newUser.user) {
        if (addForm.role !== 'usuario') {
          await supabase.from('profiles').update({ role: addForm.role as any }).eq('id', newUser.user.id);
        }
        await fetchUsers(); // Recarrega tabela
        setIsAddingUser(false);
        setAddForm({ name: '', email: '', password: '', role: 'usuario', department: '' });
      }
      setActionLoading(false);
    }, 2000);
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
        <button 
          onClick={() => setIsAddingUser(true)}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg shadow-primary-600/20"
        >
          <UserPlus size={20} />
          Adicionar Usuário
        </button>
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
                <th className="px-6 py-4 text-center">Ações</th>
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
                        {(u as any).created_at ? new Date((u as any).created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', '') : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleEditClick(u)}
                          className="p-2 text-slate-400 hover:text-primary-500 hover:bg-primary-500/10 rounded-lg transition-colors"
                          title="Editar Usuário"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(u.id, u.full_name)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Excluir Perfil"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Edit2 className="text-primary-500" size={24} />
                Editar Perfil
              </h3>
              <button 
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-300 block mb-2">Funcionário</label>
                <div className="px-4 py-2 bg-slate-800/50 text-slate-400 rounded-lg border border-slate-800">
                  {editingUser.full_name} ({editingUser.email})
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300 block mb-2">Nível de Acesso (Cargo)</label>
                <select 
                  value={editForm.role}
                  onChange={e => setEditForm({...editForm, role: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-800 text-slate-100 border border-slate-700 rounded-lg outline-none focus:border-primary-500"
                >
                  <option value="usuario">Usuário Comum</option>
                  <option value="gestor">Gestor de Departamento</option>
                  <option value="ti">Tecnologia da Informação (TI)</option>
                  <option value="compras">Departamento de Compras</option>
                  <option value="diretoria">Diretoria</option>
                  <option value="master_admin">Administrador Master</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300 block mb-2">Departamento</label>
                <select
                  value={editForm.department}
                  onChange={(e) => setEditForm({...editForm, department: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-800 text-slate-100 border border-slate-700 rounded-lg outline-none focus:border-primary-500"
                >
                  <option value="">Não definido</option>
                  <option value="Administrativo">Administrativo</option>
                  <option value="Comercial">Comercial</option>
                  <option value="Compras">Compras</option>
                  <option value="Diretoria">Diretoria</option>
                  <option value="Engenharia">Engenharia</option>
                  <option value="Estoque">Estoque</option>
                  <option value="Financeiro">Financeiro</option>
                  <option value="Logística">Logística</option>
                  <option value="Operacional">Operacional</option>
                  <option value="Recursos Humanos">Recursos Humanos (RH)</option>
                  <option value="TI">Tecnologia (TI)</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
            </div>

            <div className="mt-8 flex gap-3 justify-end">
              <button 
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 text-slate-300 hover:text-white transition-colors font-medium border border-transparent"
              >
                Cancelar
              </button>
              <button 
                onClick={handeSaveUser}
                disabled={actionLoading}
                className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg shadow-primary-600/20 disabled:opacity-50"
              >
                {actionLoading ? 'Salvando...' : (
                  <>
                    <CheckCircle size={18} /> Salvar Alterações
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <UserPlus className="text-primary-500" size={24} />
                Adicionar Novo Usuário
              </h3>
              <button 
                onClick={() => setIsAddingUser(false)}
                className="text-slate-400 hover:text-white transition-colors"
                disabled={actionLoading}
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddUser} className="space-y-4">
              {addError && <div className="text-red-500 bg-red-500/10 p-2 rounded text-sm">{addError}</div>}
              
              <div>
                <label className="text-sm font-medium text-slate-300 block mb-2">Nome Completo *</label>
                <input required type="text" value={addForm.name} onChange={e => setAddForm({...addForm, name: e.target.value})} className="w-full px-4 py-2 bg-slate-800 text-slate-100 border border-slate-700 rounded-lg outline-none" />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300 block mb-2">E-mail Corporativo *</label>
                <input required type="email" value={addForm.email} onChange={e => setAddForm({...addForm, email: e.target.value})} className="w-full px-4 py-2 bg-slate-800 text-slate-100 border border-slate-700 rounded-lg outline-none" />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300 block mb-2">Senha Provisória *</label>
                <input required type="password" minLength={6} value={addForm.password} onChange={e => setAddForm({...addForm, password: e.target.value})} className="w-full px-4 py-2 bg-slate-800 text-slate-100 border border-slate-700 rounded-lg outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-300 block mb-2">Cargo</label>
                  <select value={addForm.role} onChange={e => setAddForm({...addForm, role: e.target.value})} className="w-full px-4 py-2 bg-slate-800 text-slate-100 border border-slate-700 rounded-lg outline-none">
                    <option value="usuario">Usuário</option>
                    <option value="gestor">Gestor</option>
                    <option value="ti">TI</option>
                    <option value="compras">Compras</option>
                    <option value="diretoria">Diretoria</option>
                    <option value="master_admin">Master Admin</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300 block mb-2">Departamento</label>
                  <select value={addForm.department} onChange={e => setAddForm({...addForm, department: e.target.value})} className="w-full px-4 py-2 bg-slate-800 text-slate-100 border border-slate-700 rounded-lg outline-none">
                    <option value="">Nenhum</option>
                    <option value="Administrativo">Administrativo</option>
                    <option value="TI">TI</option>
                    <option value="Diretoria">Diretoria</option>
                    <option value="Compras">Compras</option>
                    <option value="Comercial">Comercial</option>
                    <option value="Recursos Humanos">RH</option>
                  </select>
                </div>
              </div>

              <div className="mt-8 flex gap-3 justify-end pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setIsAddingUser(false)} disabled={actionLoading} className="px-4 py-2 text-slate-300 hover:text-white transition-colors font-medium">Cancelar</button>
                <button type="submit" disabled={actionLoading} className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg disabled:opacity-50">
                  {actionLoading ? 'Criando...' : 'Finalizar Criação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
