import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Shield, Building2, Clock, Edit2, Trash2, X, UserPlus, Search, Users, Save, AlertCircle } from 'lucide-react';
import { useProfile, type Profile } from '../hooks/useProfile';
import { createClient } from '@supabase/supabase-js';
import { SearchableSelect } from '../components/SearchableSelect';
import { ConfirmModal } from '../components/ConfirmModal';
import { clsx } from 'clsx';

const departmentOptions = [
  { value: 'Administrativo', label: 'Administrativo' },
  { value: 'Comercial', label: 'Comercial' },
  { value: 'Compras', label: 'Compras' },
  { value: 'Diretoria', label: 'Diretoria' },
  { value: 'Engenharia', label: 'Engenharia' },
  { value: 'Estoque', label: 'Estoque' },
  { value: 'Financeiro', label: 'Financeiro' },
  { value: 'Logística', label: 'Logística' },
  { value: 'Operacional', label: 'Operacional' },
  { value: 'Recursos Humanos', label: 'Recursos Humanos (RH)' },
  { value: 'TI', label: 'Tecnologia (TI)' },
  { value: 'Outro', label: 'Outro' },
];

const roleOptions = [
  { value: 'usuario', label: 'Usuário Comum' },
  { value: 'gestor', label: 'Gestor de Departamento' },
  { value: 'ti', label: 'Tecnologia da Informação (TI)' },
  { value: 'compras', label: 'Departamento de Compras' },
  { value: 'diretoria', label: 'Diretoria' },
  { value: 'master_admin', label: 'Administrador Master' }
];

const supabaseAdminAuth = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const labelClass = 'block text-[10px] font-bold uppercase tracking-widest mb-2 opacity-70';

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
      const lower = searchTerm.toLowerCase();
      setFilteredUsers(users.filter(u => 
        u.full_name?.toLowerCase().includes(lower) ||
        u.email.toLowerCase().includes(lower) ||
        u.department?.toLowerCase().includes(lower) ||
        u.role.toLowerCase().includes(lower)
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

  return (
    <div className="space-y-8 animate-fade-up pb-16">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="gp-page-title flex items-center gap-3">
             <Shield className="text-primary-500" size={24} />
             Governança e Acessos
          </h1>
          <p className="gp-page-subtitle">Gestão centralizada de usuários e permissões da rede corporativa.</p>
        </div>
        <button 
          onClick={() => setIsAddingUser(true)}
          className="btn-premium-primary px-6 py-3 rounded-xl"
        >
          <UserPlus size={18} strokeWidth={2} />
          NOVO USUÁRIO
        </button>
      </header>

      {/* Filter & Hero KPI */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 gp-card p-4 flex items-center">
           <div className="relative w-full group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gp-slate group-focus-within:text-gp-blue transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="Pesquisar por nome, setor ou e-mail corporativo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-transparent outline-none text-[15px] font-medium placeholder:text-gp-muted" 
              />
           </div>
        </div>

        <div className="gp-metric border-l-[4px] border-l-gp-blue">
           <div className="flex justify-between items-start">
             <div>
                <p className="gp-metric-label">Contas Ativas</p>
                <p className="gp-metric-value">{users.length}</p>
             </div>
             <div className="gp-metric-icon bg-gp-blue-muted text-gp-blue">
                <Users size={20} />
             </div>
           </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="gp-table-wrap">
        <div className="overflow-x-auto">
          <table className="gp-table">
            <thead>
              <tr>
                <th className="w-1/3">Perfil do Usuário</th>
                <th className="">Atribuição</th>
                <th className="">Departamento</th>
                <th className="">Auditoria</th>
                <th className="text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="p-8">
                       <div className="gp-skeleton h-12 w-full" />
                    </td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="gp-empty">
                    <div className="gp-empty-icon"><Search size={24} /></div>
                    <p>Nenhum perfil encontrado na base de dados.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gp-surface3 flex items-center justify-center font-bold text-gp-slate border border-gp-border">
                          {u.full_name ? u.full_name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div className="flex flex-col">
                           <span className="font-bold text-gp-text">{u.full_name || 'Anônimo'}</span>
                           <span className="text-[11px] text-gp-text3 truncate max-w-[200px]">{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={clsx(
                        "gp-badge",
                        u.role === 'master_admin' ? 'gp-badge-gray border-gp-blue text-gp-blue' :
                        u.role === 'diretoria' ? 'gp-badge-purple' :
                        u.role === 'gestor' ? 'gp-badge-amber' :
                        u.role === 'ti' ? 'gp-badge-blue' :
                        u.role === 'compras' ? 'gp-badge-green' : 'gp-badge-gray'
                      )}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2 text-[13px] font-medium text-gp-text2">
                        <Building2 size={14} className="text-gp-text3" />
                        {u.department || 'Global Parts'}
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col text-[10px] font-bold text-gp-text3">
                        <span className="flex items-center gap-1"><Clock size={10} /> CRIADO EM</span>
                        <span className="text-gp-text2">{(u as any).created_at ? new Date((u as any).created_at).toLocaleDateString() : '-'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center justify-center gap-1">
                        <button 
                          onClick={() => handleEditClick(u)}
                          className="btn-premium-ghost p-2 rounded-lg"
                        >
                          <Edit2 size={16} />
                        </button>
                        {u.id !== currentUser?.id && (
                          <button 
                            onClick={() => setUserToDelete(u)}
                            className="btn-premium-ghost p-2 rounded-lg text-gp-error hover:bg-gp-error/10 hover:border-gp-error/20"
                          >
                            <Trash2 size={16} />
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

      {/* Add/Edit Modal */}
      {(editingUser || isAddingUser) && (
        <div className="gp-modal-overlay">
           <div className="gp-modal max-w-2xl animate-fade-up">
              <div className="p-6 sm:p-8">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-xl bg-gp-blue-muted text-gp-blue flex items-center justify-center">
                        {isAddingUser ? <UserPlus size={24} /> : <Edit2 size={24} />}
                     </div>
                     <div>
                       <h3 className="text-lg font-bold text-gp-text tracking-tight">
                          {isAddingUser ? 'Adicionar Novo Usuário' : 'Editar Permissões'}
                       </h3>
                       <p className="text-[13px] text-gp-text3 mt-0.5">Gestão de credenciais e níveis de acesso corporativo.</p>
                     </div>
                  </div>
                  <button onClick={() => { setEditingUser(null); setIsAddingUser(false); }} className="p-2 text-gp-text3 hover:text-gp-text transition-colors">
                    <X size={20} />
                  </button>
                </div>

                {isAddingUser ? (
                  <form onSubmit={handleAddUser} className="space-y-6">
                    {addError && (
                      <div className="p-4 bg-gp-error/10 text-gp-error rounded-xl border border-gp-error/20 flex items-center gap-3 text-[13px] font-medium">
                        <AlertCircle size={18} /> {addError}
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="col-span-full">
                          <label className={labelClass}>Nome Completo</label>
                          <input required type="text" placeholder="Ex: Victor Fonseca" value={addForm.name} onChange={e => setAddForm({...addForm, name: e.target.value})} className="gp-input px-4 py-2.5" />
                       </div>
                       <div>
                          <label className={labelClass}>E-mail Corporativo</label>
                          <input required type="email" placeholder="nome@globalp.com.br" value={addForm.email} onChange={e => setAddForm({...addForm, email: e.target.value})} className="gp-input px-4 py-2.5" />
                       </div>
                       <div>
                          <label className={labelClass}>Senha Provisória</label>
                          <input required type="password" value={addForm.password} onChange={e => setAddForm({...addForm, password: e.target.value})} className="gp-input px-4 py-2.5" />
                       </div>
                       <div>
                          <label className={labelClass}>Nível de Acesso</label>
                          <SearchableSelect options={roleOptions} value={addForm.role} onChange={val => setAddForm({...addForm, role: val})} placeholder="Selecione Role" />
                       </div>
                       <div>
                          <label className={labelClass}>Departamento</label>
                          <SearchableSelect options={departmentOptions} value={addForm.department} onChange={val => setAddForm({...addForm, department: val})} placeholder="Selecione Setor" />
                       </div>
                    </div>

                    <div className="pt-6 mt-6 border-t border-gp-border flex justify-end gap-3">
                       <button type="button" onClick={() => setIsAddingUser(false)} className="btn-premium-secondary px-6 py-2.5 rounded-xl text-[12px]">CANCELAR</button>
                       <button type="submit" disabled={actionLoading} className="btn-premium-primary px-8 py-2.5 rounded-xl text-[12px]">
                         {actionLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'CRIAR CONTA'}
                       </button>
                    </div>
                  </form>
                ) : editingUser && (
                  <div className="space-y-8">
                    <div className="p-5 bg-gp-surface2 rounded-xl border border-gp-border flex items-center gap-4">
                       <div className="w-12 h-12 rounded-lg bg-gp-surface3 flex items-center justify-center font-bold text-gp-text3">
                         {editingUser.full_name?.charAt(0).toUpperCase()}
                       </div>
                       <div>
                          <h4 className="font-bold text-gp-text">{editingUser.full_name}</h4>
                          <p className="text-[13px] text-gp-blue-light font-medium">{editingUser.email}</p>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div>
                          <label className={labelClass}>Redefinir Nível</label>
                          <SearchableSelect options={roleOptions} value={editForm.role} onChange={val => setEditForm({...editForm, role: val})} placeholder="Role" />
                       </div>
                       <div>
                          <label className={labelClass}>Remanejar Setor</label>
                          <SearchableSelect options={departmentOptions} value={editForm.department} onChange={val => setEditForm({...editForm, department: val})} placeholder="Setor" />
                       </div>
                    </div>

                    <div className="pt-6 mt-6 border-t border-gp-border flex justify-end gap-3">
                       <button type="button" onClick={() => setEditingUser(null)} className="btn-premium-secondary px-6 py-2.5 rounded-xl text-[12px]">CANCELAR</button>
                       <button onClick={handeSaveUser} disabled={actionLoading} className="btn-premium-primary px-8 py-2.5 rounded-xl text-[12px]">
                         {actionLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (
                            <>
                              <Save size={16} />
                              SALVAR ALTERAÇÕES
                            </>
                         )}
                       </button>
                    </div>
                  </div>
                )}
              </div>
           </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleDeleteUser}
        title="Revogar Acesso?"
        message={`Você está removendo ${userToDelete?.full_name} da base corporativa. O acesso será revogado imediatamente.`}
        confirmText="SIM, REVOGAR"
        cancelText="MANTER"
        variant="danger"
        loading={actionLoading}
      />
    </div>
  );
}
