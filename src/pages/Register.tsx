import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Mail, Lock, AlertCircle, User, ArrowRight } from 'lucide-react';
import { SearchableSelect } from '../components/SearchableSelect';

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
  { value: "usuario", label: "Funcionário" },
  { value: "gestor", label: "Gestor" },
  { value: "diretoria", label: "Diretoria" }
];

export default function Register() {
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState('usuario');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Front-end domain validation
    if (!email.endsWith('@globalp.com.br')) {
      setError('Apenas e-mails do domínio @globalp.com.br são permitidos.');
      return;
    }

    setLoading(true);

      const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          department: department,
          role: role
        }
      }
    });

    if (signUpError) {
      if (signUpError.message.includes('Apenas e-mails')) {
        setError('Apenas e-mails do domínio @globalp.com.br são permitidos.');
      } else {
        setError(signUpError.message);
      }
    } else {
      navigate('/');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 font-sans py-10">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-700">
        <div className="bg-slate-950 p-12 text-white text-center border-b border-white/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 to-transparent pointer-events-none opacity-50"></div>
          <div className="relative z-10 space-y-2">
             <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary-600/20">
                <User size={32} className="text-white" />
             </div>
             <h2 className="text-4xl font-black tracking-tighter uppercase">Criar Nova Conta</h2>
             <p className="text-primary-400 font-black text-[10px] uppercase tracking-[0.3em]">Sistema de Compras • Registro Corporativo</p>
          </div>
        </div>
        
        <form onSubmit={handleRegister} className="p-10 space-y-8">
          {error && (
            <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 p-4 rounded-2xl border border-rose-100 dark:border-rose-800 flex gap-4 items-center text-sm font-bold animate-in shake duration-500">
              <div className="w-8 h-8 bg-rose-100 dark:bg-rose-900/50 rounded-xl flex items-center justify-center shrink-0">
                <AlertCircle size={18} />
              </div>
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3 col-span-full">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
              <div className="relative group">
                <User className="absolute left-6 top-5 text-slate-400 group-focus-within:text-primary-600 transition-colors" size={20} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Victor Fonseca"
                  className="w-full pl-16 pr-6 py-5 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white border-2 border-transparent rounded-[1.5rem] focus:bg-white dark:focus:bg-slate-950 outline-none transition-all font-bold placeholder:text-slate-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Departamento</label>
              <SearchableSelect
                options={departmentOptions}
                value={department}
                onChange={(dept) => {
                  setDepartment(dept);
                  if (dept === 'TI') setRole('ti');
                  else if (role === 'ti') setRole('usuario');
                }}
                placeholder="Selecione..."
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Seu Cargo no Setor</label>
              <SearchableSelect
                options={department === 'TI' ? [{ value: 'ti', label: 'Equipe de TI' }] : roleOptions}
                value={role}
                onChange={(val) => setRole(val)}
                disabled={department === 'TI'}
                placeholder="Selecione..."
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Corporativo (@globalp)</label>
              <div className="relative group">
                <Mail className="absolute left-6 top-5 text-slate-400 group-focus-within:text-primary-600 transition-colors" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@globalp.com.br"
                  className="w-full pl-16 pr-6 py-5 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white border-2 border-transparent rounded-[1.5rem] focus:bg-white dark:focus:bg-slate-950 outline-none transition-all font-bold placeholder:text-slate-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha de Acesso</label>
              <div className="relative group">
                <Lock className="absolute left-6 top-5 text-slate-400 group-focus-within:text-primary-600 transition-colors" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  className="w-full pl-16 pr-6 py-5 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white border-2 border-transparent rounded-[1.5rem] focus:bg-white dark:focus:bg-slate-950 outline-none transition-all font-bold placeholder:text-slate-500"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-500 text-white font-black py-5 rounded-[2rem] shadow-2xl shadow-primary-600/20 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 mt-4"
          >
            {loading ? (
              <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                FINALIZAR MEU CADASTRO
                <ArrowRight size={22} strokeWidth={3} />
              </>
            )}
          </button>

          <div className="pt-10 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest text-center">
              Já possui conta cadastrada? {' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-500 transition-colors">
                FAZER LOGIN AGORA
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
