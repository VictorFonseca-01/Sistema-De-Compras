import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Shield, Building2, Clock, Edit2, Trash2, X, UserPlus, Search, Users, Save, AlertCircle } from 'lucide-react';
import { useProfile, type Profile } from '../hooks/useProfile';
import { createClient } from '@supabase/supabase-js';
import { SearchableSelect } from '../components/SearchableSelect';
import { ConfirmModal } from '../components/ConfirmModal';
import { clsx } from 'clsx';
import { formatSyntheticEmail } from '../lib/auth-utils';

interface Company {
  id: string;
  name: string;
  city: string;
}

interface Department {
  id: string;
  name: string;
}

interface ManagerScope {
  id?: string;
  scope_type: 'company' | 'department' | 'custom';
  company_id: string;
  department_id?: string;
}

const roleOptions = [
  { value: 'usuario', label: 'Usuário Comum' },
  { value: 'gestor', label: 'Gestor (Acesso por Escopo)' },
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
  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [editForm, setEditForm] = useState({ 
    role: '', 
    department_id: '', 
    company_id: '',
    department: '' 
  });
  
  const [userScopes, setUserScopes] = useState<ManagerScope[]>([]);
  const [isAddingScope, setIsAddingScope] = useState(false);
  const [newScope, setNewScope] = useState<ManagerScope>({ scope_type: 'company', company_id: '' });

  const [isAddingUser, setIsAddingUser] = useState(false);
  const [addForm, setAddForm] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    role: 'usuario', 
    department_id: '',
    company_id: ''
  });
  const [addError, setAddError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  const [userToDelete, setUserToDelete] = useState<Profile | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    const [usersRes, companiesRes, deptsRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('companies').select('*').eq('active', true),
      supabase.from('departments').select('*').eq('active', true)
    ]);

    if (usersRes.data) setUsers(usersRes.data as Profile[]);
    if (companiesRes.data) setCompanies(companiesRes.data);
    if (deptsRes.data) setDepartments(deptsRes.data);
    setLoading(false);
  };

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

  const handleEditClick = async (u: Profile) => {
    setEditingUser(u);
    setEditForm({ 
      role: u.role, 
      department_id: u.department_id || '', 
      company_id: u.company_id || '',
      department: u.department || ''
    });

    if (u.role === 'gestor') {
      const { data } = await supabase.from('manager_scopes').select('*').eq('user_id', u.id).eq('active', true);
      setUserScopes(data || []);
    } else {
      setUserScopes([]);
    }
  };

  const addScope = async () => {
    if (!editingUser || !newScope.company_id) return;
    setActionLoading(true);
    const { data, error } = await supabase.from('manager_scopes').insert([{
      user_id: editingUser.id,
      scope_type: newScope.scope_type,
      company_id: newScope.company_id,
      department_id: newScope.department_id || null
    }]).select().single();

    if (!error && data) {
      setUserScopes([...userScopes, data]);
      setIsAddingScope(false);
      setNewScope({ scope_type: 'company', company_id: '' });
    }
    setActionLoading(false);
  };

  const removeScope = async (id: string) => {
    setActionLoading(true);
    const { error } = await supabase.from('manager_scopes').delete().eq('id', id);
    if (!error) {
      setUserScopes(userScopes.filter(s => s.id !== id));
    }
    setActionLoading(false);
  };

  const handeSaveUser = async () => {
    if (!editingUser) return;
    setActionLoading(true);

    const { error } = await supabase
      .from('profiles')
      .update({ 
        role: editForm.role as any, 
        department_id: editForm.department_id,
        company_id: editForm.company_id,
        department: departments.find(d => d.id === editForm.department_id)?.name // mantendo legado
      })
      .eq('id', editingUser.id);
    
    if (!error) {
       await fetchInitialData();
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

    // Identidade Sintética na criação administrativa
    const authEmail = formatSyntheticEmail(addForm.name, addForm.email);

    const { data: newUser, error: signUpError } = await supabaseAdminAuth.auth.signUp({
      email: authEmail,
      password: addForm.password,
      options: { data: { 
        full_name: addForm.name, 
        department_id: addForm.department_id,
        company_id: addForm.company_id,
        department: departments.find(d => d.id === addForm.department_id)?.name // mantendo legado
      } }
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
        setAddForm({ 
          name: '', 
          email: '', 
          password: '', 
          role: 'usuario', 
          department_id: '',
          company_id: ''
        });
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
        <div className="overflow-x-auto no-scrollbar">
          <table className="gp-table min-w-[800px] w-full">
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
                          <label className={labelClass}>Unidade Principal</label>
                          <SearchableSelect options={companies.map(c => ({ value: c.id, label: `${c.name} (${c.city})` }))} value={addForm.company_id} onChange={val => setAddForm({...addForm, company_id: val})} placeholder="Selecione Unidade" />
                       </div>
                       <div>
                          <label className={labelClass}>Departamento Principal</label>
                          <SearchableSelect options={departments.map(d => ({ value: d.id, label: d.name }))} value={addForm.department_id} onChange={val => setAddForm({...addForm, department_id: val})} placeholder="Selecione Setor" />
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
                  <div className="space-y-8 max-h-[70vh] overflow-y-auto pr-2">
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
                          <SearchableSelect options={roleOptions} value={editForm.role} onChange={val => {
                              setEditForm({...editForm, role: val});
                              if (val !== 'gestor') setUserScopes([]);
                          }} placeholder="Role" />
                       </div>
                       <div>
                          <label className={labelClass}>Unidade Principal</label>
                          <SearchableSelect options={companies.map(c => ({ value: c.id, label: `${c.name} (${c.city})` }))} value={editForm.company_id} onChange={val => setEditForm({...editForm, company_id: val})} placeholder="Unidade" />
                       </div>
                       <div className="col-span-full">
                          <label className={labelClass}>Remanejar Departamento</label>
                          <SearchableSelect options={departments.map(d => ({ value: d.id, label: d.name }))} value={editForm.department_id} onChange={val => setEditForm({...editForm, department_id: val})} placeholder="Setor" />
                       </div>
                    </div>

                    {editForm.role === 'gestor' && (
                       <div className="pt-8 space-y-6">
                          <div className="flex items-center justify-between border-b border-gp-border pb-4">
                             <div>
                                <h4 className="font-bold text-gp-text flex items-center gap-2">
                                   <Building2 size={18} className="text-gp-blue" />
                                   Escopos de Visualização
                                </h4>
                                <p className="text-[11px] text-gp-text3 uppercase font-bold tracking-widest mt-1">Defina quais empresas/setores este gestor pode monitorar.</p>
                             </div>
                             <button 
                                onClick={() => setIsAddingScope(!isAddingScope)}
                                className="btn-premium-secondary px-4 py-2 rounded-lg text-[10px]"
                             >
                                {isAddingScope ? 'FECHAR' : 'NOVO ESCOPO'}
                             </button>
                          </div>

                          {isAddingScope && (
                             <div className="p-6 bg-gp-surface3 rounded-2xl border-2 border-gp-blue/20 space-y-5 animate-fade-up">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                   <div>
                                      <label className={labelClass}>Tipo de Escopo</label>
                                      <SearchableSelect 
                                         options={[
                                            { value: 'company', label: 'Empresa Inteira' },
                                            { value: 'department', label: 'Depto Específico' }
                                         ]} 
                                         value={newScope.scope_type} 
                                         onChange={val => setNewScope({...newScope, scope_type: val as any, department_id: undefined})} 
                                      />
                                   </div>
                                   <div>
                                      <label className={labelClass}>Empresa/Unidade</label>
                                      <SearchableSelect 
                                         options={companies.map(c => ({ value: c.id, label: c.name }))} 
                                         value={newScope.company_id} 
                                         onChange={val => setNewScope({...newScope, company_id: val})} 
                                      />
                                   </div>
                                   {newScope.scope_type === 'department' && (
                                      <div className="col-span-full">
                                         <label className={labelClass}>Departamento</label>
                                         <SearchableSelect 
                                            options={departments.map(d => ({ value: d.id, label: d.name }))} 
                                            value={newScope.department_id || ''} 
                                            onChange={val => setNewScope({...newScope, department_id: val})} 
                                         />
                                      </div>
                                   )}
                                </div>
                                <div className="flex justify-end gap-2">
                                   <button onClick={addScope} disabled={actionLoading || !newScope.company_id} className="btn-premium-primary px-6 py-2 rounded-xl text-[11px]">ADICIONAR REGRA</button>
                                </div>
                             </div>
                          )}

                          <div className="space-y-3">
                             {userScopes.length === 0 ? (
                                <p className="text-[12px] text-gp-text3 italic py-4 text-center border-2 border-dashed border-gp-border rounded-xl">Nenhum escopo configurado. O gestor não verá solicitações de terceiros.</p>
                             ) : (
                                userScopes.map((scope) => {
                                   const company = companies.find(c => c.id === scope.company_id);
                                   const dept = departments.find(d => d.id === scope.department_id);
                                   return (
                                      <div key={scope.id} className="flex items-center justify-between p-4 bg-gp-surface2 border border-gp-border rounded-xl group hover:border-gp-blue/30 transition-all">
                                         <div className="flex items-center gap-4">
                                            <div className={clsx(
                                               "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                                               scope.scope_type === 'company' ? 'bg-gp-blue/10 text-gp-blue' : 'bg-gp-purple/10 text-gp-purple'
                                            )}>
                                               {scope.scope_type === 'company' ? <Building2 size={16} /> : <Users size={16} />}
                                            </div>
                                            <div>
                                               <p className="text-[13px] font-bold text-gp-text">
                                                  {scope.scope_type === 'company' ? `Toda a Unidade: ${company?.name}` : `Setor ${dept?.name} em ${company?.name}`}
                                               </p>
                                               <p className="text-[10px] text-gp-text3 font-bold uppercase tracking-widest mt-0.5">
                                                  {scope.scope_type === 'company' ? 'Visibilidade Total da Filial' : 'Visibilidade Restrita ao Setor'}
                                               </p>
                                            </div>
                                         </div>
                                         <button onClick={() => removeScope(scope.id!)} className="p-2 text-gp-text3 hover:text-gp-error transition-colors">
                                            <Trash2 size={16} />
                                         </button>
                                      </div>
                                   );
                                })
                             )}
                          </div>
                       </div>
                    )}

                    <div className="pt-6 mt-8 border-t border-gp-border flex justify-end gap-3 sticky bottom-0 bg-gp-surface py-4">
                       <button type="button" onClick={() => setEditingUser(null)} className="btn-premium-secondary px-6 py-2.5 rounded-xl text-[12px]">FECHAR</button>
                       <button onClick={handeSaveUser} disabled={actionLoading} className="btn-premium-primary px-8 py-3 rounded-xl text-[12px] shadow-gp-blue/20">
                         {actionLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (
                            <>
                              <Save size={16} />
                              SALVAR CONFIGURAÇÕES
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
