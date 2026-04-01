import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Mail, Lock, AlertCircle, User, ArrowRight } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
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
          department: department
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
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden">
        <div className="bg-primary-900 p-8 text-white text-center border-b border-primary-800">
          <h2 className="text-3xl font-bold">Criar Conta</h2>
          <p className="text-primary-200 mt-2">Acesso ao Sistema de Compras</p>
        </div>
        
        <form onSubmit={handleRegister} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-950/50 text-red-500 p-3 rounded-lg border border-red-900 flex gap-2 items-center text-sm">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Nome Completo</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-slate-500" size={18} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu Nome Completo"
                  className="w-full pl-10 pr-4 py-2 bg-slate-800 text-slate-100 border border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all placeholder-slate-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Departamento</label>
              <div className="relative">
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 text-slate-100 border border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all appearance-none"
                  required
                >
                  <option value="" disabled>Selecione seu Departamento</option>
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

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">E-mail Corporativo</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-slate-500" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@globalp.com.br"
                  className="w-full pl-10 pr-4 py-2 bg-slate-800 text-slate-100 border border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all placeholder-slate-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-500" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo de 6 caracteres"
                  minLength={6}
                  className="w-full pl-10 pr-4 py-2 bg-slate-800 text-slate-100 border border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all placeholder-slate-500"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {loading ? 'Cadastrando...' : 'Finalizar Cadastro'}
            {!loading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
          </button>

          <p className="text-center text-sm text-slate-400 mt-6 pt-6 border-t border-slate-800">
            Já possui uma conta? {' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">
              Fazer Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
