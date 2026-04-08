import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Shield, 
  Building2, 
  Clock, 
  Edit2, 
  Trash2, 
  X, 
  UserPlus, 
  Search, 
  Users, 
  AlertCircle,
  Plus,
  ShieldCheck,
  Zap,
  Globe
} from 'lucide-react';
import { useProfile, type Profile } from '../hooks/useProfile';
import { createClient } from '@supabase/supabase-js';
import { SearchableSelect } from '../components/SearchableSelect';
import { MultiSearchableSelect } from '../components/MultiSearchableSelect';
import { ConfirmModal } from '../components/ConfirmModal';
import { clsx } from 'clsx';
import { formatSyntheticEmail } from '../lib/auth-utils';
import { toast } from 'react-hot-toast';

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
  can_edit?: boolean;
}

const roleOptions = [
  { value: 'usuario', label: 'Colaborador (Usuário)' },
  { value: 'gestor', label: 'Gestor (Acesso Regional)' },
  { value: 'ti', label: 'Analista de TI' },
  { value: 'compras', label: 'Suprimentos / Compras' },
  { value: 'diretoria', label: 'Conselho / Diretoria' },
  { value: 'master_admin', label: 'Super Administrador' }
];

const supabaseAdminAuth = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const labelClass = 'block text-[10px] font-black uppercase tracking-[0.2em] mb-2.5 text-gp-muted ml-0.5 leading-none';

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
  const [newScope, setNewScope] = useState<{
    scope_type: 'company' | 'department';
    company_ids: string[];
    department_id?: string;
    can_edit: boolean;
  }>({ 
    scope_type: 'company', 
    company_ids: [],
    can_edit: false 
  });

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

    if (u.role === 'gestor' || u.role === 'usuario') {
      const { data } = await supabase.from('manager_scopes').select('*').eq('user_id', u.id).eq('active', true);
      setUserScopes(data || []);
    } else {
      setUserScopes([]);
    }
  };

  const addScope = async () => {
    if (!editingUser || newScope.company_ids.length === 0) return;
    setActionLoading(true);

    try {
      const inserts = newScope.company_ids.map(compId => ({
        user_id: editingUser.id,
        scope_type: newScope.scope_type,
        company_id: compId,
        department_id: newScope.department_id || null,
        can_edit: newScope.can_edit
      }));

      const { data, error } = await supabase.from('manager_scopes').insert(inserts).select();

      if (!error && data) {
        setUserScopes([...userScopes, ...data]);
        setIsAddingScope(false);
        setNewScope({ 
          scope_type: 'company', 
          company_ids: [],
          can_edit: false 
        });
        toast.success(`${data.length} regras de acesso ativadas.`);
      } else if (error) {
        throw error;
      }
    } catch (err: any) {
      toast.error('Erro ao adicionar escopo: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const removeScope = async (id: string) => {
    setActionLoading(true);
    const { error } = await supabase.from('manager_scopes').delete().eq('id', id);
    if (!error) {
      setUserScopes(userScopes.filter(s => s.id !== id));
      toast.success('Escopo removido.');
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
        department: departments.find(d => d.id === editForm.department_id)?.name
      })
      .eq('id', editingUser.id);
    
    if (!error) {
       toast.success('Políticas de acesso atualizadas.');
       await fetchInitialData();
       setEditingUser(null);
    } else {
      toast.error('Erro na atualização: ' + error.message);
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
      toast.error('Revogação falhou: ' + error.message);
    } else {
      toast.success('Acesso removido permanentemente.');
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
      setAddError('Domínio obrigatório: @globalp.com.br');
      setActionLoading(false);
      return;
    }

    const authEmail = formatSyntheticEmail(addForm.name, addForm.email);

    const { data: newUser, error: signUpError } = await supabaseAdminAuth.auth.signUp({
      email: authEmail,
      password: addForm.password,
      options: { data: { 
        full_name: addForm.name, 
        department_id: addForm.department_id,
        company_id: addForm.company_id,
        department: departments.find(d => d.id === addForm.department_id)?.name
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
        toast.success(`Usuário ${addForm.name} provisionado.`);
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
    }, 1500);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 px-4 sm:px-0 animate-fade-up">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        <div>
          <p className="flex items-center gap-2 text-gp-muted font-black text-[10px] uppercase tracking-[0.2em] mb-4">
             <Shield size={14} strokeWidth={3} className="text-gp-blue" /> Painel de Governança
          </p>
          <h1 className="gp-page-title text-3xl">Usuários e Empresas</h1>
          <p className="gp-page-subtitle">Gestão centralizada de contas, unidades e privilégios na rede Global Parts.</p>
        </div>
        <button 
          onClick={() => setIsAddingUser(true)}
          className="w-full md:w-auto btn-premium-primary px-10 py-4 rounded-xl shadow-2xl shadow-gp-blue/20 uppercase text-[11px] font-black tracking-widest"
        >
          <UserPlus size={18} strokeWidth={3} className="mr-2.5" />
          PROVISIONAR NOVO ACESSO
        </button>
      </header>

      {/* Filter & Hero KPI */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 gp-card p-4 flex items-center group focus-within:border-gp-blue/40 transition-all">
           <div className="relative w-full">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gp-muted group-focus-within:text-gp-blue transition-colors" size={20} strokeWidth={2.5} />
              <input 
                type="text" 
                placeholder="Pesquisar por nome do colaborador, setor ou e-mail corporativo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-6 py-3 bg-transparent outline-none text-[15px] font-bold placeholder:text-gp-muted/50 text-gp-text" 
              />
           </div>
        </div>

        <div className="gp-card p-6 border-l-4 border-l-gp-blue bg-gp-blue/[0.02]">
           <div className="flex justify-between items-start">
             <div>
                <p className="text-[10px] font-black text-gp-muted uppercase tracking-[0.2em] mb-2 opacity-60">Contas Ativas</p>
                <div className="flex items-baseline gap-1.5">
                   <p className="text-4xl font-black text-gp-text tracking-tighter">{users.length}</p>
                   <span className="text-[10px] font-black text-gp-success uppercase tracking-widest leading-none">Status: OK</span>
                </div>
             </div>
             <div className="w-12 h-12 rounded-xl bg-gp-blue text-white flex items-center justify-center shadow-lg shadow-gp-blue/20">
                <Users size={22} strokeWidth={2.5} />
             </div>
           </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="gp-table-wrap p-2 sm:p-4 bg-gp-surface2/30">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="gp-table min-w-[900px] w-full">
            <thead>
              <tr>
                <th className="w-1/3">COLABORADOR / IDENTIDADE</th>
                <th>PRIVILÉGIOS</th>
                <th>ALOCAÇÃO CORPORATIVA</th>
                <th>REGISTRO</th>
                <th className="text-center">GESTÃO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gp-border/30">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="p-8">
                       <div className="gp-skeleton h-14 w-full" />
                    </td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <div className="w-16 h-16 bg-gp-surface2 rounded-2xl flex items-center justify-center mx-auto mb-6 text-gp-muted shadow-inner">
                       <Search size={32} strokeWidth={1} />
                    </div>
                    <p className="text-gp-muted font-black uppercase text-[11px] tracking-[0.2em]">Nenhum perfil localizado na base de dados.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gp-surface2/50 transition-colors group">
                    <td>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gp-surface3 flex items-center justify-center font-black text-gp-muted border border-gp-border text-lg shadow-sm group-hover:border-gp-blue/20 transition-colors">
                          {u.full_name ? u.full_name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div className="flex flex-col min-w-0">
                           <span className="font-black text-gp-text text-[15px] leading-tight mb-1 group-hover:text-gp-blue transition-colors uppercase tracking-tight">{u.full_name || 'Anônimo'}</span>
                           <span className="text-[11px] text-gp-muted font-black uppercase tracking-tighter opacity-70 truncate max-w-[220px]">{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={clsx(
                        "gp-badge font-black text-[9px] tracking-[0.15em] px-3 py-1 ring-1 ring-inset",
                        u.role === 'master_admin' ? 'bg-gp-blue text-white ring-gp-blue/40 shadow-lg shadow-gp-blue/10' :
                        u.role === 'diretoria' ? 'bg-gp-purple/10 text-gp-purple ring-gp-purple/20' :
                        u.role === 'gestor' ? 'bg-gp-amber/10 text-gp-amber ring-gp-amber/20' :
                        u.role === 'ti' ? 'bg-gp-blue/10 text-gp-blue-light ring-gp-blue/20' :
                        u.role === 'compras' ? 'bg-gp-success/10 text-gp-success ring-gp-success/20' : 'bg-gp-surface3 text-gp-muted ring-gp-border'
                      )}>
                        {u.role.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-3 text-[13px] font-black text-gp-text uppercase tracking-tight">
                        <Building2 size={16} className="text-gp-blue-light opacity-40 shrink-0" strokeWidth={2.5} />
                        <span className="truncate">{u.department || 'GERAL GLOBALP'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col text-[10px] font-black text-gp-muted uppercase tracking-[0.2em] gap-1.5">
                        <span className="flex items-center gap-2 opacity-50"><Clock size={12} strokeWidth={3} /> CRIAÇÃO</span>
                        <span className="text-gp-text leading-none">{(u as any).created_at ? new Date((u as any).created_at).toLocaleDateString() : '--'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleEditClick(u)}
                          className="p-3 rounded-xl hover:bg-gp-blue/10 transition-colors text-gp-muted hover:text-gp-blue border border-transparent hover:border-gp-blue/20 shadow-sm"
                          title="Gerenciar Privilégios"
                        >
                          <Edit2 size={18} strokeWidth={2.5} />
                        </button>
                        {u.id !== currentUser?.id && (
                          <button 
                            onClick={() => setUserToDelete(u)}
                            className="p-3 rounded-xl hover:bg-gp-error/10 transition-colors text-gp-muted hover:text-gp-error border border-transparent hover:border-gp-error/20 shadow-sm"
                            title="Revogar Acesso"
                          >
                            <Trash2 size={18} strokeWidth={2.5} />
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gp-bg/90 backdrop-blur-md animate-fade-in shadow-inner">
           <div className="gp-card w-full max-w-3xl shadow-3xl border-gp-blue/20 overflow-hidden animate-zoom-in">
              <div className="p-8 sm:p-12 relative">
                <div className="flex justify-between items-start mb-12">
                  <div className="flex items-center gap-6">
                     <div className="w-16 h-16 rounded-[1.5rem] bg-gp-blue text-white flex items-center justify-center shadow-2xl shadow-gp-blue/30 scale-110">
                        {isAddingUser ? <UserPlus size={32} strokeWidth={2.5} /> : <ShieldCheck size={32} strokeWidth={2.5} />}
                     </div>
                     <div>
                       <h3 className="text-2xl font-black text-gp-text tracking-tight uppercase leading-none">
                          {isAddingUser ? 'Provisionar Usuário' : 'Matriz de Acessos'}
                       </h3>
                       <p className="text-[12px] font-black text-gp-blue-light uppercase tracking-[0.25em] mt-3 opacity-80 leading-none">Segurança de Dados e Perímetros corporativos</p>
                     </div>
                  </div>
                  <button onClick={() => { setEditingUser(null); setIsAddingUser(false); }} className="p-3 text-gp-muted hover:text-gp-text hover:bg-gp-surface2 rounded-xl transition-all">
                    <X size={24} strokeWidth={3} />
                  </button>
                </div>

                {isAddingUser ? (
                  <form onSubmit={handleAddUser} className="space-y-8">
                    {addError && (
                      <div className="p-5 bg-gp-error/10 text-gp-error rounded-2xl border border-gp-error/20 flex items-center gap-4 text-[13px] font-black uppercase tracking-tight animate-shake">
                        <AlertCircle size={22} strokeWidth={3} /> {addError}
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                       <div className="col-span-full space-y-1">
                          <label className={labelClass}>Nome Completo</label>
                          <input required type="text" placeholder="Ex: Victor Fonseca" value={addForm.name} onChange={e => setAddForm({...addForm, name: e.target.value})} className="gp-input" />
                       </div>
                       <div className="space-y-1">
                          <label className={labelClass}>E-mail Corporativo (@globalp.com.br)</label>
                          <input required type="email" placeholder="v.fonseca@globalp.com.br" value={addForm.email} onChange={e => setAddForm({...addForm, email: e.target.value})} className="gp-input" />
                       </div>
                       <div className="space-y-1">
                          <label className={labelClass}>Senha Temporária</label>
                          <input required type="password" placeholder="Mínimo 6 caracteres" value={addForm.password} onChange={e => setAddForm({...addForm, password: e.target.value})} className="gp-input" />
                       </div>
                       <div className="space-y-1">
                          <label className={labelClass}>Nível de Privilégio</label>
                          <SearchableSelect options={roleOptions} value={addForm.role} onChange={val => setAddForm({...addForm, role: val})} placeholder="Definir Role" />
                       </div>
                       <div className="space-y-1">
                          <label className={labelClass}>Unidade Regional</label>
                          <SearchableSelect options={companies.map(c => ({ value: c.id, label: `${c.name} (${c.city})` }))} value={addForm.company_id} onChange={val => setAddForm({...addForm, company_id: val})} placeholder="Selecionar Unidade" />
                       </div>
                       <div className="col-span-full space-y-1">
                          <label className={labelClass}>Departamento Atribuído</label>
                          <SearchableSelect options={departments.map(d => ({ value: d.id, label: d.name }))} value={addForm.department_id} onChange={val => setAddForm({...addForm, department_id: val})} placeholder="Definir Lotação" />
                       </div>
                    </div>

                    <div className="pt-10 flex justify-end gap-4">
                       <button type="button" onClick={() => setIsAddingUser(false)} className="btn-premium-ghost px-10 py-4 rounded-xl text-[11px] font-black uppercase tracking-widest">DESCARTAR</button>
                       <button type="submit" disabled={actionLoading} className="btn-premium-primary px-12 py-4 rounded-xl text-[12px] font-black uppercase tracking-[0.15em] shadow-xl shadow-gp-blue/20 min-w-[220px]">
                         {actionLoading ? <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div> : 'FINALIZAR PROVISIONAMENTO'}
                       </button>
                    </div>
                  </form>
                ) : editingUser && (
                  <div className="space-y-10 max-h-[65vh] overflow-y-auto custom-scrollbar pr-4">
                    <div className="p-6 bg-gp-surface2 rounded-2xl border border-gp-border flex items-center gap-6 shadow-inner relative overflow-hidden group">
                       <div className="w-16 h-16 rounded-[1.25rem] bg-gp-surface3 flex items-center justify-center font-black text-gp-muted text-2xl border border-gp-border shadow-sm group-hover:border-gp-blue/20 transition-all">
                         {editingUser.full_name?.charAt(0).toUpperCase()}
                       </div>
                       <div className="space-y-2">
                          <h4 className="text-xl font-black text-gp-text uppercase tracking-tight leading-none">{editingUser.full_name}</h4>
                          <div className="flex items-center gap-3">
                             <p className="text-[12px] text-gp-blue-light font-black uppercase tracking-widest opacity-80">{editingUser.email}</p>
                             <div className="w-1 h-1 bg-gp-muted rounded-full opacity-30" />
                             <span className="text-[10px] text-gp-muted font-black uppercase tracking-widest">ID: {editingUser.id.slice(0, 8)}</span>
                          </div>
                       </div>
                       <Globe className="absolute -right-6 -bottom-6 text-gp-blue opacity-[0.03] group-hover:scale-110 transition-transform duration-700" size={120} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                       <div className="space-y-1">
                          <label className={labelClass}>Alterar Categoria de Acesso</label>
                          <SearchableSelect options={roleOptions} value={editForm.role} onChange={val => {
                              setEditForm({...editForm, role: val});
                              if (val !== 'gestor') setUserScopes([]);
                          }} placeholder="Privilégios" />
                       </div>
                       <div className="space-y-1">
                          <label className={labelClass}>Movimentar Unidade</label>
                          <SearchableSelect options={companies.map(c => ({ value: c.id, label: `${c.name} (${c.city})` }))} value={editForm.company_id} onChange={val => setEditForm({...editForm, company_id: val})} placeholder="Unidade" />
                       </div>
                       <div className="col-span-full space-y-1">
                          <label className={labelClass}>Remanejar Departamento Principal</label>
                          <SearchableSelect options={departments.map(d => ({ value: d.id, label: d.name }))} value={editForm.department_id} onChange={val => setEditForm({...editForm, department_id: val})} placeholder="Setor Operacional" />
                       </div>
                    </div>

                    {/* REMOVIDA RESTRIÇÃO DE ROLE PARA GESTÃO DE ESCOPOS */}
                    <div className="pt-12 space-y-8 border-t border-gp-border">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 bg-gp-amber/5 p-6 rounded-2xl border border-gp-amber/10">
                             <div>
                                <h4 className="font-black text-gp-text text-[15px] flex items-center gap-3 uppercase tracking-tight">
                                   <div className="w-10 h-10 rounded-xl bg-gp-amber/10 text-gp-amber flex items-center justify-center shadow-inner">
                                      <Globe size={22} strokeWidth={2.5} />
                                   </div>
                                   Definição de Perímetro (Escopos)
                                </h4>
                                <p className="text-[11px] text-gp-muted font-black uppercase tracking-[0.2em] mt-3 opacity-60 leading-relaxed">
                                   Configure quais empresas ou departamentos este gestor poderá auditar e aprovar.
                                </p>
                             </div>
                             <button 
                                onClick={() => setIsAddingScope(!isAddingScope)}
                                className="w-full sm:w-auto btn-premium-secondary px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] shadow-lg shadow-black/5"
                             >
                                {isAddingScope ? 'FECHAR EDITOR' : (
                                   <><Plus size={16} strokeWidth={3} className="mr-2" /> NOVO ESCOPO</>
                                )}
                             </button>
                          </div>

                          {isAddingScope && (
                             <div className="p-8 bg-gp-surface2 rounded-[2rem] border-2 border-gp-blue/20 space-y-6 animate-fade-up shadow-2xl relative overflow-hidden">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 relative z-10">
                                   <div className="space-y-1">
                                      <label className={labelClass}>Nível de Visibilidade</label>
                                      <SearchableSelect 
                                         options={[
                                            { value: 'company', label: 'Unidade / Empresa Inteira' },
                                            { value: 'department', label: 'Filtro por Departamento' }
                                         ]} 
                                         value={newScope.scope_type} 
                                         onChange={val => setNewScope({...newScope, scope_type: val as any, department_id: undefined})} 
                                      />
                                   </div>
                                   <div className="space-y-1">
                                      <label className={labelClass}>Empresa Alvo</label>
                                      <MultiSearchableSelect 
                                         options={companies.map(c => ({ value: c.id, label: c.name }))} 
                                         value={newScope.company_ids} 
                                         onChange={vals => setNewScope({...newScope, company_ids: vals})} 
                                         placeholder="Selecionar Unidades"
                                      />
                                   </div>
                                   {newScope.scope_type === 'department' && (
                                      <div className="col-span-full space-y-1">
                                         <label className={labelClass}>Departamento de Auditoria</label>
                                         <SearchableSelect 
                                            options={departments.map(d => ({ value: d.id, label: d.name }))} 
                                            value={newScope.department_id || ''} 
                                            onChange={val => setNewScope({...newScope, department_id: val})} 
                                         />
                                      </div>
                                   )}
                                   <div className="col-span-full pt-2 flex items-center gap-3">
                                      <label className="relative inline-flex items-center cursor-pointer group">
                                         <input 
                                            type="checkbox" 
                                            className="sr-only peer"
                                            checked={newScope.can_edit}
                                            onChange={e => setNewScope({...newScope, can_edit: e.target.checked})}
                                         />
                                         <div className="w-11 h-6 bg-gp-surface3 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gp-blue"></div>
                                      </label>
                                      <span className="text-[11px] font-black uppercase tracking-widest text-gp-text">Permitir Edição (Acesso de Escrita)</span>
                                   </div>
                                </div>
                                <div className="flex justify-end gap-3 pt-4 relative z-10">
                                   <button onClick={() => setIsAddingScope(false)} className="btn-premium-ghost px-6 py-3 text-[10px] font-black uppercase">CANCELAR</button>
                                   <button onClick={addScope} disabled={actionLoading || newScope.company_ids.length === 0} className="btn-premium-primary px-10 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-gp-blue/30">ATIVAR REGRA DE ACESSO</button>
                                </div>
                                <Zap className="absolute -left-10 -bottom-10 text-gp-blue opacity-[0.03] -rotate-12" size={140} />
                             </div>
                          )}

                          <div className="space-y-4">
                             {userScopes.length === 0 ? (
                                <div className="p-10 text-center border-3 border-dashed border-gp-border rounded-[2.5rem] bg-gp-surface2/[0.05]">
                                   <Globe size={32} className="mx-auto mb-4 text-gp-muted opacity-30" strokeWidth={1} />
                                   <p className="text-[11px] text-gp-muted font-black uppercase tracking-[0.2em] max-w-xs mx-auto italic leading-relaxed opacity-60">
                                      Nenhum perímetro geográfico configurado. Este usuário não terá acesso a solicitações globais.
                                   </p>
                                </div>
                             ) : userScopes.map((scope) => {
                                const company = companies.find(c => c.id === scope.company_id);
                                const dept = departments.find(d => d.id === scope.department_id);
                                return (
                                   <div key={scope.id} className="flex items-center justify-between p-5 bg-gp-surface2 border border-gp-border rounded-2xl group hover:border-gp-blue/30 transition-all shadow-sm">
                                      <div className="flex items-center gap-6 min-w-0">
                                         <div className={clsx(
                                            "w-12 h-12 rounded-[1.1rem] flex items-center justify-center shrink-0 shadow-inner border border-gp-border/30 group-hover:scale-105 transition-transform",
                                            scope.scope_type === 'company' ? 'bg-gp-blue/10 text-gp-blue' : 'bg-gp-purple/10 text-gp-purple'
                                         )}>
                                            {scope.scope_type === 'company' ? <Building2 size={24} strokeWidth={2.5} /> : <Users size={24} strokeWidth={2.5} />}
                                         </div>
                                         <div className="min-w-0">
                                            <p className="text-[14px] font-black text-gp-text uppercase tracking-tight leading-tight mb-2 truncate">
                                               {scope.scope_type === 'company' ? `UNIDADE TOTAL: ${company?.name}` : `SETOR ${dept?.name} EM ${company?.name}`}
                                            </p>
                                            <div className="flex items-center gap-3">
                                               <span className={clsx(
                                                  "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md",
                                                  scope.scope_type === 'company' ? "bg-gp-blue/10 text-gp-blue" : "bg-gp-purple/10 text-gp-purple"
                                               )}>
                                                  {scope.scope_type === 'company' ? 'REDIRECIONAMENTO GLOBAL' : 'REDIRECIONAMENTO LOCAL'}
                                               </span>
                                               <span className={clsx(
                                                  "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md",
                                                  scope.can_edit ? "bg-gp-success/10 text-gp-success" : "bg-gp-surface3 text-gp-muted"
                                               )}>
                                                  {scope.can_edit ? 'PERMISSÃO DE EDIÇÃO' : 'SOMENTE VISUALIZAÇÃO'}
                                               </span>
                                            </div>
                                         </div>
                                      </div>
                                      <button onClick={() => removeScope(scope.id!)} className="p-3 text-gp-muted hover:text-gp-error transition-colors hover:bg-gp-error/5 rounded-xl">
                                         <Trash2 size={20} strokeWidth={2.5} />
                                      </button>
                                   </div>
                                );
                             })}
                          </div>
                    </div>

                    <div className="pt-10 flex flex-col sm:flex-row justify-end items-center gap-4 border-t border-gp-border sticky -bottom-1 bg-gp-surface py-6">
                       <button type="button" onClick={() => setEditingUser(null)} className="w-full sm:w-auto px-10 py-4 btn-premium-ghost rounded-xl text-[11px] font-black uppercase tracking-widest">DESCARTAR</button>
                       <button onClick={handeSaveUser} disabled={actionLoading} className="w-full sm:w-auto px-14 py-4 btn-premium-primary rounded-xl text-[12px] font-black uppercase tracking-[0.15em] shadow-2xl shadow-gp-blue/30 min-w-[280px]">
                         {actionLoading ? <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div> : (
                            <>
                              <ShieldCheck size={20} strokeWidth={3} className="mr-2" />
                              CONFIRMAR POLÍTICAS DE ACESSO
                            </>
                         )}
                       </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="absolute top-0 right-0 w-48 h-48 bg-gp-blue/5 rounded-full blur-[80px] pointer-events-none" />
           </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleDeleteUser}
        title="Revogar Acesso Permanente?"
        message={`Esta ação excluirá as credenciais e o perfil de ${userToDelete?.full_name?.toUpperCase()} da infraestrutura Global Parts. Esta operação é irreversível e será auditada.`}
        confirmText="SIM, REVOGAR ACESSO"
        cancelText="MANTER CONTA"
        variant="danger"
        loading={actionLoading}
      />
    </div>
  );
}
