import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Shield, Building2, Clock, Edit2, Trash2, X, UserPlus, Search, Mail, ShieldAlert } from 'lucide-react';
import type { Profile } from '../hooks/useProfile';
import { createClient } from '@supabase/supabase-js';
import { SearchableSelect } from '../components/SearchableSelect';
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

  const handleDeleteUser = async (id: string, name: string | null) => {
    if (!window.confirm(`Tem certeza que deseja DELETAR o perfil de ${name || 'este usuário'}? Ele perderá acesso ao sistema.`)) return;
    
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (!error) {
      setUsers(users.filter(u => u.id !== id));
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
    master_admin: 'text-rose-700 bg-rose-100 border-rose-200',
    diretoria: 'text-purple-700 bg-purple-100 border-purple-200',
    gestor: 'text-amber-700 bg-amber-100 border-amber-200',
    ti: 'text-blue-700 bg-blue-100 border-blue-200',
    compras: 'text-emerald-700 bg-emerald-100 border-emerald-200',
    usuario: 'text-slate-600 bg-slate-100 border-slate-200',
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
             <Shield className="text-primary-600" size={32} />
             Administração de Usuários
          </h1>
          <p className="text-slate-500 text-lg">Gerenciamento centralizado de identidades corporativas.</p>
        </div>
        <button 
          onClick={() => setIsAddingUser(true)}
          className="bg-slate-950 dark:bg-white dark:text-slate-950 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 transition-all shadow-xl active:scale-95"
        >
          <UserPlus size={20} strokeWidth={3} />
          Novo Usuário
        </button>
      </header>

      {/* Busca e Dashboard Rápido */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center">
            <Search className="ml-4 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar por nome ou e-mail corporativo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-transparent border-none outline-none font-bold text-slate-900 dark:text-white" 
            />
        </div>
        <div className="bg-primary-600 text-white p-6 rounded-3xl shadow-lg shadow-primary-600/20 flex flex-col justify-center">
           <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Total de Contas</p>
           <p className="text-2xl font-black">{users.length}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black border-b border-slate-100 dark:border-slate-800">
                <th className="px-8 py-5">Perfil</th>
                <th className="px-8 py-5">Identidade Corporativa</th>
                <th className="px-8 py-5">Atribuição (Role)</th>
                <th className="px-8 py-5">Departamento</th>
                <th className="px-8 py-5 text-right">Auditoria</th>
                <th className="px-8 py-5 text-center">Gestão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-8 py-10 h-20 bg-slate-50/10"></td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-slate-500 italic font-medium">Nenhum usuário correspondente à busca.</td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-all group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-400 border border-slate-200 dark:border-slate-700 group-hover:bg-primary-600 group-hover:text-white group-hover:border-primary-600 transition-all">
                          {u.full_name ? u.full_name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <span className="font-black text-slate-900 dark:text-white text-sm">
                          {u.full_name || 'Anônimo'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                        <Mail size={14} className="text-slate-300" />
                        {u.email}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={clsx("inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-black border uppercase tracking-wider shadow-sm", roleColors[u.role] || roleColors.usuario, "border-current/10")}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-sm font-black text-primary-600 dark:text-primary-400 uppercase tracking-tighter">
                        <Building2 size={14} />
                        {u.department || 'GLOBAL'}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="inline-flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase">
                        <Clock size={12} />
                        {(u as any).created_at ? new Date((u as any).created_at).toLocaleDateString() : '-'}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-center gap-1">
                        <button 
                          onClick={() => handleEditClick(u)}
                          className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950 rounded-xl transition-all"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(u.id, u.full_name)}
                          className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-xl transition-all"
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

      {/* Modais Modernizados */}
      {(editingUser || isAddingUser) && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
           <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 w-full max-w-xl shadow-2xl border border-slate-100 dark:border-slate-800 scale-in-center animate-in zoom-in duration-300">
              <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-4">
                   <div className="w-14 h-14 rounded-3xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 flex items-center justify-center">
                      {isAddingUser ? <UserPlus size={28} /> : <Edit2 size={28} />}
                   </div>
                   <div>
                     <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                        {isAddingUser ? 'Novo Usuário' : 'Editar Identidade'}
                     </h3>
                     <p className="text-slate-500 font-medium">Configurações de acesso e departamento.</p>
                   </div>
                </div>
                <button onClick={() => { setEditingUser(null); setIsAddingUser(false); }} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                  <X size={32} />
                </button>
              </div>

              {isAddingUser ? (
                 <form onSubmit={handleAddUser} className="space-y-6">
                    {addError && <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 flex items-center gap-2 font-bold text-sm"><ShieldAlert size={18} /> {addError}</div>}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2 col-span-full">
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nome Completo</label>
                          <input required type="text" value={addForm.name} onChange={e => setAddForm({...addForm, name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">E-mail Corporativo</label>
                          <input required type="email" value={addForm.email} onChange={e => setAddForm({...addForm, email: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Senha Inicial</label>
                          <input required type="password" value={addForm.password} onChange={e => setAddForm({...addForm, password: e.target.value})} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold" />
                       </div>
                       <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Cargo / Nível</label>
                         <SearchableSelect options={roleOptions} value={addForm.role} onChange={val => setAddForm({...addForm, role: val})} placeholder="Cargo" />
                       </div>
                       <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Setor</label>
                         <SearchableSelect options={departmentOptions} value={addForm.department} onChange={val => setAddForm({...addForm, department: val})} placeholder="Setor" />
                       </div>
                    </div>
                    <div className="pt-8 border-t border-slate-50 dark:border-slate-800 flex justify-end gap-3">
                       <button type="submit" disabled={actionLoading} className="bg-primary-600 hover:bg-primary-500 text-white px-10 py-4 rounded-2xl font-black shadow-xl active:scale-95 disabled:opacity-50">
                         {actionLoading ? 'Processando...' : 'CRIAR CONTA'}
                       </button>
                    </div>
                 </form>
              ) : editingUser && (
                <div className="space-y-8">
                   <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-black text-slate-400 uppercase mb-1">Identificação</p>
                      <p className="text-lg font-black text-slate-900 dark:text-white leading-tight">{editingUser.full_name}</p>
                      <p className="text-sm font-bold text-primary-600">{editingUser.email}</p>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Alterar Nível</label>
                         <SearchableSelect options={roleOptions} value={editForm.role} onChange={val => setEditForm({...editForm, role: val})} placeholder="Cargo" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Remanejar Setor</label>
                         <SearchableSelect options={departmentOptions} value={editForm.department} onChange={val => setEditForm({...editForm, department: val})} placeholder="Setor" />
                      </div>
                   </div>
                   <div className="pt-8 border-t border-slate-50 dark:border-slate-800 flex justify-end gap-3">
                       <button onClick={handeSaveUser} disabled={actionLoading} className="bg-primary-600 hover:bg-primary-500 text-white px-10 py-4 rounded-2xl font-black shadow-xl active:scale-95 disabled:opacity-50">
                         {actionLoading ? 'Salvando...' : 'SALVAR ALTERAÇÕES'}
                       </button>
                    </div>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
}
