import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Mail, Lock, AlertCircle, User, ArrowRight } from 'lucide-react';
import { SearchableSelect } from '../components/SearchableSelect';
import { clsx } from 'clsx';
import { useTheme } from '../context/ThemeContext';

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
  { value: 'usuario', label: 'Funcionário' },
  { value: 'gestor', label: 'Gestor' },
  { value: 'diretoria', label: 'Diretoria' },
];

const labelClass = 'block text-[11px] font-bold uppercase tracking-widest mb-2';

export default function Register() {
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState('usuario');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { theme } = useTheme();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.endsWith('@globalp.com.br')) {
      setError('Apenas e-mails @globalp.com.br são permitidos.');
      return;
    }
    setLoading(true);
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name, department, role } },
    });
    if (signUpError) {
      setError(signUpError.message.includes('Apenas e-mails')
        ? 'Apenas e-mails @globalp.com.br são permitidos.'
        : signUpError.message);
    } else {
      navigate('/');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-start md:items-center justify-center p-4 py-12 bg-gp-bg overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl overflow-hidden bg-gp-surface border border-gp-border shadow-gp-shadow-lg my-auto">
        {/* Header */}
        <div className="px-8 pt-10 pb-8 text-center bg-gp-surface2 border-b border-gp-border">
          <div className="w-14 h-14 mx-auto mb-5 rounded-xl flex items-center justify-center p-3 bg-gp-blue/10 border border-gp-blue/20">
            <img 
              src="/logo-branca.png" 
              alt="Global Parts" 
              className={clsx(
                "w-full h-full object-contain transition-all",
                theme === 'light' && "invert brightness-0"
              )} 
            />
          </div>
          <h1 className="text-xl font-bold text-gp-text tracking-tight">Criar Nova Conta</h1>
          <p className="text-[11px] font-bold uppercase tracking-widest mt-1.5 text-gp-blue">
            Sistema de Compras · Registro Corporativo
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} className="px-8 py-8 space-y-6">
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl text-[13px] font-medium bg-gp-error/10 border border-gp-error/20 text-gp-error">
              <AlertCircle size={16} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Name */}
            <div className="md:col-span-2">
              <label className={clsx(labelClass, "text-gp-text3")}>Nome Completo</label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gp-text3" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Victor Fonseca"
                  required
                  className="gp-input pl-11 pr-4 py-3 text-[14px]"
                />
              </div>
            </div>

            {/* Department */}
            <div>
              <label className={clsx(labelClass, "text-gp-text3")}>Departamento</label>
              <SearchableSelect
                options={departmentOptions}
                value={department}
                onChange={dept => {
                  setDepartment(dept);
                  if (dept === 'TI') setRole('ti');
                  else if (role === 'ti') setRole('usuario');
                }}
                placeholder="Selecione..."
              />
            </div>

            {/* Role */}
            <div>
              <label className={clsx(labelClass, "text-gp-text3")}>Cargo no Setor</label>
              <SearchableSelect
                options={department === 'TI' ? [{ value: 'ti', label: 'Equipe de TI' }] : roleOptions}
                value={role}
                onChange={val => setRole(val)}
                disabled={department === 'TI'}
                placeholder="Selecione..."
              />
            </div>

            {/* Email */}
            <div>
              <label className={clsx(labelClass, "text-gp-text3")}>E-mail Corporativo</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gp-text3" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="usuario@globalp.com.br"
                  required
                  className="gp-input pl-11 pr-4 py-3 text-[14px]"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className={clsx(labelClass, "text-gp-text3")}>Senha de Acesso</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gp-text3" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  required
                  className="gp-input pl-11 pr-4 py-3 text-[14px]"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-premium-primary w-full py-3.5 rounded-xl text-[13px]"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Finalizar Cadastro
                <ArrowRight size={18} strokeWidth={2.5} />
              </>
            )}
          </button>

          <div className="pt-5 border-t border-gp-border text-center space-y-4">
            <button
              type="button"
              onClick={() => {
                setName('Auditor de Testes');
                setDepartment('TI');
                setRole('ti');
                setEmail(`teste_${Math.floor(Math.random() * 1000)}@globalp.com.br`);
                setPassword('teste123456');
              }}
              className="text-[10px] font-bold text-gp-blue uppercase tracking-widest hover:underline opacity-60 hover:opacity-100 transition-all"
            >
              [ TESTE: Gerar Dados Aleatórios ]
            </button>
            <p className="text-[12px] text-gp-text3">
              Já possui conta?{' '}
              <Link
                to="/login"
                className="font-bold text-gp-blue hover:text-gp-blue/80 transition-colors"
              >
                Fazer login
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
