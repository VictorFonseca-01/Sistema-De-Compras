import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { clsx } from 'clsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { theme } = useTheme();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.endsWith('@globalp.com.br')) {
      setError('Apenas e-mails @globalp.com.br são permitidos.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError('Credenciais inválidas ou erro ao conectar.');
      setLoading(false);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gp-bg">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-gp-surface border border-gp-border shadow-gp-shadow-lg">
        {/* Card Header */}
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
          <h1 className="text-xl font-bold text-gp-text tracking-tight">Sistema de Compras</h1>
          <p className="text-[11px] font-bold uppercase tracking-widest mt-1.5 text-gp-blue">
            Global Parts · Infraestrutura
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="px-8 py-8 space-y-6">
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl text-[13px] font-medium bg-gp-error/10 border border-gp-error/20 text-gp-error">
              <AlertCircle size={16} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest mb-2 text-gp-text3">
                E-mail Corporativo
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gp-text3"
                />
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
              <label className="block text-[11px] font-bold uppercase tracking-widest mb-2 text-gp-text3">
                Senha de Acesso
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gp-text3"
                />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
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
                Entrar no Sistema
                <ArrowRight size={18} strokeWidth={2.5} />
              </>
            )}
          </button>

          <div className="pt-5 border-t border-gp-border text-center space-y-4">
            <button
              type="button"
              onClick={() => {
                setEmail('admin@globalp.com.br');
                setPassword('admin123456');
              }}
              className="text-[10px] font-bold text-gp-blue uppercase tracking-widest hover:underline opacity-60 hover:opacity-100 transition-all"
            >
              [ TESTE: Preencher Admin ]
            </button>
            <p className="text-[12px] text-gp-text3">
              Não possui acesso?{' '}
              <Link
                to="/cadastro"
                className="font-bold text-gp-blue hover:text-gp-blue/80 transition-colors"
              >
                Cadastrar conta
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
