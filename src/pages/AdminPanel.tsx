import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Shield, Building2, Clock, Edit2, Trash2, X, UserPlus, Search, Mail, ShieldAlert, Users } from 'lucide-react';
import { useProfile, type Profile } from '../hooks/useProfile';
import { createClient } from '@supabase/supabase-js';
import { SearchableSelect } from '../components/SearchableSelect';
import { ConfirmModal } from '../components/ConfirmModal';
import { clsx } from 'clsx';

const departmentOptions = [
  { value: "Administrativo", label: "Administrativo" },
  { value: "Comercial", label: "Comercial" },
  { value: "Compras", label: "Compras" },
  { value: "Diretoria", label: "Diretoria" },
  { value: "Engenharia", label: "Engenharia" },
  { value: "Estoque", label: "Estoque" },
  { value: "Financeiro", label: "Financeiro" },
  { value: "Logística", label: "Logística" },
  { value: "Operacional", label: "Operacional" },
  { value: "Recursos Humanos", label: "Recursos Humanos (RH)" },
  { value: "TI", label: "Tecnologia (TI)" },
  { value: "Outro", label: "Outro" }
];

const roleOptions = [
  { value: "usuario", label: "Usuário Comum" },
  { value: "gestor", label: "Gestor de Departamento" },
  { value: "ti", label: "Tecnologia da Informação (TI)" },
  { value: "compras", label: "Departamento de Compras" },
  { value: "diretoria", label: "Diretoria" },
  { value: "master_admin", label: "Administrador Master" }
];

const supabaseAdminAuth = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

export default function AdminPanel() {
  const { profile: currentUser } = useProfile();
  const [users, setUsers] = useState<Profile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [editForm, setEditForm] = useState({ role: '', department: '' });
  
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', email: '', password: '', role: 'usuario', department: '' });
  const [addError, setAddError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  const [userToDelete, setUserToDelete] = useState<Profile | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      setFilteredUsers(users.filter(u => 
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
      ));
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) {
      setUsers(data as Profile[]);
      setFilteredUsers(data as Profile[]);
    }
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
       await fetchUsers();
       setEditingUser(null);
    } else {
      alert('Erro ao atualizar usuário: ' + error.message);
    }
    setActionLoading(false);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setActionLoading(true);
    const { error } = await supabase.rpc('execute_profile_deletion', { 
      profile_uuid: userToDelete.id 
    });
    if (error) {
      alert('A exclusão falhou no banco: ' + error.message);
    } else {
      setUsers(users.filter(u => u.id !== userToDelete.id));
      setUserToDelete(null);
    }
    setActionLoading(false);
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

    const { data: newUser, error: signUpError } = await supabaseAdminAuth.auth.signUp({
      email: addForm.email,
      password: addForm.password,
      options: { data: { full_name: addForm.name, department: addForm.department } }
    });

    if (signUpError) {
      setAddError(signUpError.message);
      setActionLoading(false);
      return;
    }

    setTimeout(async () => {
      if (newUser.user) {
        if (addForm.role !== 'usuario') {
          await supabase.from('profiles').update({ role: addForm.role as any }).eq('id', newUser.user.id);
        }
        await fetchUsers();
        setIsAddingUser(false);
        setAddForm({ name: '', email: '', password: '', role: 'usuario', department: '' });
      }
      setActionLoading(false);
    }, 2000);
  };

  const roleColors: Record<string, string> = {
    master_admin: 'text-white bg-slate-900 border-slate-900 shadow-slate-200/50 dark:bg-white dark:text-slate-900',
    diretoria: 'text-fuchsia-600 bg-fuchsia-500/10 border-fuchsia-500/20 shadow-fuchsia-100',
    gestor: 'text-amber-600 bg-amber-500/10 border-amber-500/20 shadow-amber-100',
    ti: 'text-blue-600 bg-blue-500/10 border-blue-500/20 shadow-blue-100',
    compras: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-100',
    usuario: 'text-slate-500 bg-slate-500/10 border-slate-500/20 shadow-slate-100',
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20 font-sans">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-3 leading-none">
             <Shield className="text-primary-600" size={40} />
             Governança <span className="text-primary-600">e Acessos</span>
          </h1>
          <p className="text-slate-500 text-lg font-medium">Administração centralizada de usuários e permissões corporativas.</p>
        </div>
        <button 
          onClick={() => setIsAddingUser(true)}
          className="btn-premium-primary px-8 py-4 rounded-2xl shadow-xl shadow-primary-600/20"
        >
          <UserPlus size={22} strokeWidth={3} />
          NOVO USUÁRIO
        </button>
      </header>

      {/* Advanced Filter & Dashboard Hub 💎 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center animate-in slide-in-from-top-4 duration-700">
           <div className="relative group">
              <Search className="absolute left-6 top-4 text-slate-400 group-focus-within:text-primary-600 transition-colors" size={24} />
              <input 
                type="text" 
                placeholder="Pesquisar por nome, cargo ou e-mail corporativo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-16 pr-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent rounded-[1.5rem] outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-slate-950 transition-all font-bold text-slate-900 dark:text-white placeholder:text-slate-400" 
              />
           </div>
        </div>

        <div className="bg-slate-950 dark:bg-white p-8 rounded-[3rem] shadow-2xl flex flex-col justify-center relative overflow-hidden group hover:scale-[1.02] transition-all duration-500">
           <Users className="absolute -right-6 -bottom-6 text-white/10 dark:text-slate-900/10 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700" size={140} />
           <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Total de Contas</p>
              <p className="text-5xl font-black text-white dark:text-slate-950 tracking-tighter">{users.length}</p>
           </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black border-b border-slate-100 dark:border-slate-800">
                <th className="px-8 py-6">Perfil do Usuário</th>
                <th className="px-8 py-6">Rede Corporativa</th>
                <th className="px-8 py-6">Atribuição / Nível</th>
                <th className="px-8 py-6">Departamento</th>
                <th className="px-8 py-6 text-right">Auditoria</th>
                <th className="px-8 py-6 text-center">Gestão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {loading ? Array.from({ length: 6 }).map((_, i) => (<tr key={i} className="animate-pulse"><td colSpan={6} className="px-8 py-10 bg-slate-50/10"></td></tr>)) : filteredUsers.length === 0 ? (<tr><td colSpan={6} className="px-8 py-20 text-center text-slate-500 italic font-medium">Nenhum perfil correspondente na base de dados.</td></tr>) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-all group border-b border-slate-50 dark:border-slate-800">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-400 border border-slate-200 dark:border-slate-700 group-hover:bg-slate-950 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-slate-900 group-hover:scale-105 transition-all shadow-sm">
                          {u.full_name ? u.full_name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div className="flex flex-col">
                           <span className="font-black text-slate-900 dark:text-white text-base tracking-tight leading-none">
                             {u.full_name || 'Anônimo'}
                           </span>
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID: {u.id.slice(0, 8)}...</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-slate-500 font-bold text-sm bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-xl w-fit border border-slate-100 dark:border-slate-800">
                        <Mail size={14} className="text-slate-400" />
                        <span className="truncate max-w-[220px]">{u.email}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={clsx(
                        "inline-flex items-center px-4 py-2 rounded-xl text-[10px] font-black border uppercase tracking-widest shadow-sm",
                        roleColors[u.role] || roleColors.usuario,
                        "border-current/10"
                      )}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-xs font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest">
                        <Building2 size={16} />
                        {u.department || 'GLOBAL'}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="inline-flex flex-col text-[10px] text-slate-400 font-black uppercase tracking-tighter">
                        <span className="flex items-center justify-end gap-1"><Clock size={12} /> CRIADO EM</span>
                        <span className="text-slate-600 dark:text-slate-200">{(u as any).created_at ? new Date((u as any).created_at).toLocaleDateString() : '-'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleEditClick(u)}
                          className="btn-premium-ghost w-10 h-10 rounded-xl transition-all"
                        >
                          <Edit2 size={18} />
                        </button>
                        {u.id !== currentUser?.id && (
                          <button 
                            onClick={() => setUserToDelete(u)}
                            className="btn-premium-ghost text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 w-10 h-10 rounded-xl"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modern UI Modals 💎 */}
      {(editingUser || isAddingUser) && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
           <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] p-12 w-full max-w-2xl shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-500">
              <div className="flex justify-between items-start mb-12">
                <div className="flex items-center gap-6">
                   <div className="w-20 h-20 rounded-[2rem] bg-primary-100 dark:bg-primary-900/30 text-primary-600 flex items-center justify-center shadow-inner">
                      {isAddingUser ? <UserPlus size={36} /> : <Edit2 size={36} />}
                   </div>
                   <div className="space-y-1">
                     <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                        {isAddingUser ? 'CRIAR ACESSO' : 'ATUALIZAR PERFIL'}
                     </h3>
                     <p className="text-slate-500 text-lg font-medium">Gestão de credenciais e níveis de auditoria.</p>
                   </div>
                </div>
                <button onClick={() => { setEditingUser(null); setIsAddingUser(false); }} className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                  <X size={36} />
                </button>
              </div>

              {isAddingUser ? (
                 <form onSubmit={handleAddUser} className="space-y-8">
                    {addError && <div className="p-5 bg-rose-50 text-rose-600 rounded-[1.5rem] border border-rose-100 flex items-center gap-3 font-black text-sm uppercase tracking-wide"><ShieldAlert size={20} /> {addError}</div>}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-3 col-span-full">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">NOME COMPLETO DO COLABORADOR</label>
                          <input required type="text" placeholder="Ex: Victor Fonseca" value={addForm.name} onChange={e => setAddForm({...addForm, name: e.target.value})} className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-800 border-2 border-transparent rounded-[1.5rem] font-bold text-lg focus:border-primary-500 focus:bg-white dark:focus:bg-slate-950 transition-all" />
                       </div>
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-MAIL CORPORATIVO</label>
                          <input required type="email" placeholder="nome@globalp.com.br" value={addForm.email} onChange={e => setAddForm({...addForm, email: e.target.value})} className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-800 border-2 border-transparent rounded-[1.5rem] font-bold focus:border-primary-500 focus:bg-white dark:focus:bg-slate-950 transition-all" />
                       </div>
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">SENHA PROVISÓRIA</label>
                          <input required type="password" value={addForm.password} onChange={e => setAddForm({...addForm, password: e.target.value})} className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-800 border-2 border-transparent rounded-[1.5rem] font-bold focus:border-primary-500 focus:bg-white dark:focus:bg-slate-950 transition-all" />
                       </div>
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">NÍVEL DE ACESSO</label>
                          <SearchableSelect options={roleOptions} value={addForm.role} onChange={val => setAddForm({...addForm, role: val})} placeholder="Selecione Role" />
                       </div>
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">DEPARTAMENTO</label>
                          <SearchableSelect options={departmentOptions} value={addForm.department} onChange={val => setAddForm({...addForm, department: val})} placeholder="Selecione Setor" />
                       </div>
                    </div>
                    <div className="pt-10 border-t border-slate-50 dark:border-slate-800 flex justify-end">
                       <button type="submit" disabled={actionLoading} className="w-full md:w-auto btn-premium-primary px-12 py-5 rounded-[1.5rem] shadow-2xl shadow-primary-600/30">
                         {actionLoading ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div> : 'FINALIZAR E CRIAR CONTA'}
                       </button>
                    </div>
                 </form>
              ) : editingUser && (
                <div className="space-y-10">
                   <div className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-800 flex flex-col gap-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">IDENTIDADE VERIFICADA</p>
                      <h4 className="text-2xl font-black text-slate-900 dark:text-white leading-none">{editingUser.full_name}</h4>
                      <p className="text-base font-bold text-primary-600 dark:text-primary-400 tracking-tight">{editingUser.email}</p>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">REDEFINIR NÍVEL</label>
                         <SearchableSelect options={roleOptions} value={editForm.role} onChange={val => setEditForm({...editForm, role: val})} placeholder="Role" />
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">REMANEJAR SETOR</label>
                         <SearchableSelect options={departmentOptions} value={editForm.department} onChange={val => setEditForm({...editForm, department: val})} placeholder="Setor" />
                      </div>
                   </div>
                   <div className="pt-10 border-t border-slate-50 dark:border-slate-800 flex justify-end">
                       <button onClick={handeSaveUser} disabled={actionLoading} className="w-full md:w-auto btn-premium-primary px-12 py-5 rounded-[1.5rem] shadow-2xl shadow-primary-600/30">
                         {actionLoading ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div> : 'CONFIRMAR ALTERAÇÕES'}
                       </button>
                    </div>
                </div>
              )}
           </div>
        </div>
      )}
      <ConfirmModal 
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleDeleteUser}
        title="Revogar Acesso Permanentemente?"
        message={`Você está removendo ${userToDelete?.full_name} da base corporativa. Esta ação desconectará o usuário imediatamente e limpará seu histórico de atividades.`}
        confirmText="SIM, REVOGAR ACESSO"
        cancelText="MANTER CONTA"
        variant="danger"
        loading={actionLoading}
      />
    </div>
  );
}
