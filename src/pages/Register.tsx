import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Mail, Lock, AlertCircle, User, ArrowRight, Building2, ShieldCheck, Zap } from 'lucide-react';
import { SearchableSelect } from '../components/SearchableSelect';
import { clsx } from 'clsx';
import { useTheme } from '../context/ThemeContext';
import { formatSyntheticEmail } from '../lib/auth-utils';
import { toast } from 'react-hot-toast';

const roleOptions = [
  { value: 'usuario', label: 'Funcionário (Colaborador)' },
  { value: 'gestor', label: 'Gestor (Aprovação Regional)' },
  { value: 'diretoria', label: 'Diretoria (Conselho Executivo)' },
];

const labelClass = 'block text-[10px] font-black uppercase tracking-[0.2em] mb-2.5 text-gp-muted ml-0.5 leading-none';

export default function Register() {
  const [name, setName] = useState('');
  const [companies, setCompanies] = useState<{id: string, name: string}[]>([]);
  const [departments, setDepartments] = useState<{id: string, name: string}[]>([]);
  const [companyId, setCompanyId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [role, setRole] = useState('usuario');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { theme } = useTheme();

  useEffect(() => {
    async function loadData() {
      const { data: cos } = await supabase.from('companies').select('id, name').eq('active', true).order('name');
      const { data: depts } = await supabase.from('departments').select('id, name').eq('active', true).order('name');
      if (cos) setCompanies(cos);
      if (depts) setDepartments(depts);
      
      if (cos) {
        const matriz = cos.find(c => c.name === 'Matriz');
        if (matriz) setCompanyId(matriz.id);
      }
    }
    loadData();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!companyId || !departmentId) {
      setError('Configuração incompleta: Selecione Unidade e Departamento.');
      return;
    }

    if (!email.endsWith('@globalp.com.br')) {
      setError('Domínio não autorizado: Use @globalp.com.br.');
      return;
    }

    setLoading(true);
    
    const selectedDept = departments.find(d => d.id === departmentId)?.name;
    const authEmail = formatSyntheticEmail(name, email);

    const { error: signUpError } = await supabase.auth.signUp({
      email: authEmail,
      password,
      options: { 
        data: { 
          full_name: name, 
          department: selectedDept,
          department_id: departmentId,
          company_id: companyId,
          role 
        } 
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      toast.error('Falha no registro.');
    } else {
      toast.success('Solicitação de acesso enviada.');
      navigate('/');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gp-bg relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-gp-blue/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-gp-blue/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="w-full max-w-[640px] animate-fade-up">
        <div className="gp-card overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] border-gp-blue/20">
          {/* Brand Identity */}
          <div className="px-10 pt-12 pb-10 text-center bg-gp-surface2/50 border-b border-gp-border relative overflow-hidden">
            <div className="w-20 h-20 mx-auto mb-6 rounded-[2rem] flex items-center justify-center p-5 bg-gp-surface border border-gp-border shadow-2xl relative z-10 group hover:rotate-12 transition-transform duration-500">
              <img 
                src="/logo-branca.png" 
                alt="Global Parts" 
                className={clsx(
                  "w-full h-full object-contain transition-all duration-300",
                  theme === 'light' ? "invert" : "brightness-110"
                )} 
              />
            </div>
            <div className="relative z-10 space-y-2">
               <h1 className="text-2xl font-black text-gp-text tracking-tight uppercase">Provisionamento</h1>
               <div className="flex items-center justify-center gap-3">
                  <div className="h-px w-8 bg-gp-blue/30" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gp-blue-light opacity-80">
                    Novo Cadastro Corporativo
                  </p>
                  <div className="h-px w-8 bg-gp-blue/30" />
               </div>
            </div>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleRegister} className="px-10 py-10 space-y-8">
            {error && (
              <div className="flex items-center gap-4 p-5 rounded-2xl text-[13px] font-black uppercase tracking-tight bg-gp-error/10 border border-gp-error/20 text-gp-error animate-shake">
                <AlertCircle size={20} strokeWidth={3} className="shrink-0" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
              {/* Identity Name */}
              <div className="md:col-span-2 space-y-1 group">
                <label className={labelClass}>Identidade (Nome Completo)</label>
                <div className="relative">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gp-muted group-focus-within:text-gp-blue transition-colors">
                    <User size={18} strokeWidth={2.5} />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="DIGITE SEU NOME PARA PROTOCOLO"
                    required
                    className="gp-input pl-14 pr-6 py-4 text-[14px] font-bold tracking-tight"
                  />
                </div>
              </div>

              {/* Unit/Company */}
              <div className="space-y-1">
                <label className={labelClass}>Unidade Regional</label>
                <SearchableSelect
                  options={companies.map(c => ({ value: c.id, label: c.name }))}
                  value={companyId}
                  onChange={setCompanyId}
                  placeholder="Selecione Unidade..."
                />
              </div>

              {/* Department */}
              <div className="space-y-1">
                <label className={labelClass}>Lotação / Setor</label>
                <SearchableSelect
                  options={departments.map(d => ({ value: d.id, label: d.name }))}
                  value={departmentId}
                  onChange={id => {
                    setDepartmentId(id);
                    const deptName = departments.find(d => d.id === id)?.name;
                    if (deptName === 'TI') setRole('ti');
                    else if (role === 'ti') setRole('usuario');
                  }}
                  placeholder="Selecione Departamento..."
                />
              </div>

              {/* Role */}
              <div className="md:col-span-2 space-y-1">
                <label className={labelClass}>Atribuição de Cargo</label>
                <SearchableSelect
                  options={departments.find(d => d.id === departmentId)?.name === 'TI' 
                    ? [{ value: 'ti', label: 'Especialista em Tecnologia (TI)' }] 
                    : roleOptions
                  }
                  value={role}
                  onChange={setRole}
                  disabled={!departmentId || departments.find(d => d.id === departmentId)?.name === 'TI'}
                  placeholder="Escolha sua função no ecossistema..."
                />
              </div>

              {/* Email */}
              <div className="space-y-1 group">
                <label className={labelClass}>E-mail Corporativo</label>
                <div className="relative">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gp-muted group-focus-within:text-gp-blue transition-colors">
                    <Mail size={18} strokeWidth={2.5} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="USUARIO@GLOBALP.COM.BR"
                    required
                    className="gp-input pl-14 pr-6 py-4 text-[14px] font-black tracking-tight"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1 group">
                <label className={labelClass}>Senha de Acesso</label>
                <div className="relative">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gp-muted group-focus-within:text-gp-blue transition-colors">
                    <Lock size={18} strokeWidth={2.5} />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="MÍNIMO 6 CARACTERES"
                    minLength={6}
                    required
                    className="gp-input pl-14 pr-6 py-4 text-[14px]"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="btn-premium-primary w-full py-5 rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] shadow-xl shadow-gp-blue/20 active:scale-[0.98] transition-transform"
              >
                {loading ? (
                  <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    CONFIRMAR SOLICITAÇÃO
                    <ArrowRight size={18} strokeWidth={3} className="ml-3" />
                  </>
                )}
              </button>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 py-3 px-4 bg-gp-surface2 rounded-xl border border-gp-border/50">
                  <ShieldCheck size={14} className="text-gp-success" strokeWidth={3} />
                  <span className="text-[9px] font-black text-gp-muted uppercase tracking-[0.1em]">Protocolo Criptografado</span>
                </div>
                <div className="flex items-center gap-3 py-3 px-4 bg-gp-surface2 rounded-xl border border-gp-border/50">
                  <Zap size={14} className="text-gp-blue" strokeWidth={3} />
                  <span className="text-[9px] font-black text-gp-muted uppercase tracking-[0.1em]">Aprovação em Tempo Real</span>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-gp-border/50 text-center">
              <p className="text-[11px] font-black text-gp-muted uppercase tracking-widest">
                JÁ POSSUI ACESSO ATIVO?{' '}
                <Link
                  to="/login"
                  className="text-gp-blue hover:text-gp-blue-light transition-all underline decoration-2 underline-offset-4"
                >
                  AUTENTICAR-SE
                </Link>
              </p>
            </div>
          </form>
        </div>
        <p className="mt-10 text-center text-[10px] font-black text-gp-muted uppercase tracking-[0.3em] opacity-40">
          © 2026 GLOBAL PARTS • SUPPLY CHAIN INTELLIGENCE
        </p>
      </div>
    </div>
  );
}
