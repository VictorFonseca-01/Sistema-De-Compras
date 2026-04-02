import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Domain check
    if (!email.endsWith('@globalp.com.br')) {
      setError('Apenas e-mails do domínio @globalp.com.br são permitidos.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError('Credenciais inválidas ou erro ao conectar.');
      setLoading(false);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 font-sans">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-700">
        <div className="bg-slate-950 p-12 text-white text-center border-b border-white/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 to-transparent pointer-events-none opacity-50"></div>
          <div className="relative z-10 space-y-2">
              <div className="w-20 h-20 bg-slate-900/50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl border border-white/5 p-4">
                 <img src="/logo-branca.png" alt="Global Parts Logo" className="w-full h-full object-contain" />
              </div>
             <h2 className="text-4xl font-black tracking-tighter uppercase">Sistema de Compras</h2>
             <p className="text-primary-400 font-black text-[10px] uppercase tracking-[0.3em]">Global Parts • Infraestrutura</p>
          </div>
        </div>
        
        <form onSubmit={handleLogin} className="p-10 space-y-8">
          {error && (
            <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 p-4 rounded-2xl border border-rose-100 dark:border-rose-800 flex gap-4 items-center text-sm font-bold animate-in shake duration-500">
              <div className="w-8 h-8 bg-rose-100 dark:bg-rose-900/50 rounded-xl flex items-center justify-center shrink-0">
                <AlertCircle size={18} />
              </div>
              {error}
            </div>
          )}
          
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Corporativo</label>
              <div className="relative group">
                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary-600 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-500 rounded-full"></div>
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
                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary-600 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-500 rounded-full"></div>
                <Lock className="absolute left-6 top-5 text-slate-400 group-focus-within:text-primary-600 transition-colors" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-16 pr-6 py-5 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white border-2 border-transparent rounded-[1.5rem] focus:bg-white dark:focus:bg-slate-950 outline-none transition-all font-bold placeholder:text-slate-500"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-premium-primary py-5 rounded-[2rem] shadow-2xl shadow-primary-600/20"
          >
            {loading ? (
              <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                ENTRAR NO SISTEMA
                <ArrowRight size={22} strokeWidth={3} />
              </>
            )}
          </button>

          <div className="pt-10 border-t border-slate-100 dark:border-slate-800 space-y-6 text-center">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
              Não possui acesso? {' '}
              <Link to="/cadastro" className="text-primary-600 hover:text-primary-500 transition-colors">
                CADASTRAR MINHA CONTA
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
