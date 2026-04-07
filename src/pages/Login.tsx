import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Mail, Lock, AlertCircle, ArrowRight, User, ShieldCheck } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { clsx } from 'clsx';
import { formatSyntheticEmail } from '../lib/auth-utils';
import { toast } from 'react-hot-toast';

export default function Login() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { theme } = useTheme();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!name.trim()) {
      setError('Identificação obrigatória: Insira seu nome completo.');
      return;
    }

    if (!email.endsWith('@globalp.com.br')) {
      setError('Acesso restrito: Use seu e-mail @globalp.com.br.');
      return;
    }

    setLoading(true);

    // 1. Tenta login com Identidade Sintética (Nome + E-mail)
    const authEmail = formatSyntheticEmail(name, email);
    const { error: syntheticError } = await supabase.auth.signInWithPassword({ 
      email: authEmail, 
      password 
    });

    if (!syntheticError) {
      toast.success('Autenticação bem-sucedida.');
      navigate('/');
      return;
    }

    // 2. Fallback: Se falhou, tenta login com E-mail Real (Contas Legado)
    const { error: legacyError } = await supabase.auth.signInWithPassword({ 
      email: email.toLowerCase().trim(), 
      password 
    });

    if (legacyError) {
      setError('Credenciais inválidas. Verifique nome, e-mail e senha.');
      toast.error('Falha na autenticação.');
      setLoading(false);
    } else {
      toast.success('Acesso concedido (Legado).');
      navigate('/');
    }
  };

  const labelClass = 'block text-[10px] font-black uppercase tracking-[0.2em] mb-2.5 text-gp-muted ml-0.5 leading-none';

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gp-bg relative overflow-hidden">
      {/* Elementos Decorativos de Fundo */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gp-blue/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-gp-blue/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-[440px] animate-fade-up">
        <div className="gp-card overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] border-gp-blue/20">
          {/* Brand Identity */}
          <div className="px-10 pt-12 pb-10 text-center bg-gp-surface2/50 border-b border-gp-border relative overflow-hidden">
            <div className="w-20 h-20 mx-auto mb-6 rounded-[2rem] flex items-center justify-center p-5 bg-gp-surface border border-gp-border shadow-2xl relative z-10 group hover:scale-105 transition-transform duration-500">
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
               <h1 className="text-2xl font-black text-gp-text tracking-tight uppercase">Autenticação</h1>
               <div className="flex items-center justify-center gap-3">
                  <div className="h-px w-8 bg-gp-blue/30" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gp-blue-light opacity-80">
                    Sistema de Compras
                  </p>
                  <div className="h-px w-8 bg-gp-blue/30" />
               </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gp-blue/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          </div>

          {/* Interaction Area */}
          <form onSubmit={handleLogin} className="px-10 py-10 space-y-8">
            {error && (
              <div className="flex items-center gap-4 p-5 rounded-2xl text-[13px] font-black uppercase tracking-tight bg-gp-error/10 border border-gp-error/20 text-gp-error animate-shake">
                <AlertCircle size={20} strokeWidth={3} className="shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-6">
              {/* Identity Name */}
              <div className="space-y-1 group">
                <label className={labelClass}>Identidade (Nome Completo)</label>
                <div className="relative">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gp-muted group-focus-within:text-gp-blue transition-colors">
                    <User size={18} strokeWidth={2.5} />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="DIGITE SEU NOME PARA VALIDAÇÃO"
                    required
                    className="gp-input pl-14 pr-6 py-4 text-[14px] font-bold tracking-tight"
                  />
                </div>
              </div>

              {/* Corporate Email */}
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

              {/* Secure Password */}
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
                    placeholder="••••••••"
                    required
                    className="gp-input pl-14 pr-6 py-4 text-[14px]"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="btn-premium-primary w-full py-5 rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] shadow-xl shadow-gp-blue/20 active:scale-[0.98] transition-transform"
              >
                {loading ? (
                  <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    ENTRAR NO AMBIENTE
                    <ArrowRight size={18} strokeWidth={3} className="ml-2" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-3 py-3 px-5 bg-gp-surface2 rounded-xl border border-gp-border/50">
                 <ShieldCheck size={14} className="text-gp-success" strokeWidth={3} />
                 <span className="text-[10px] font-black text-gp-muted uppercase tracking-[0.15em]">Conexão Protegida pela Global Parts Inc.</span>
              </div>
            </div>

            <div className="pt-6 border-t border-gp-border/50 text-center">
              <p className="text-[11px] font-black text-gp-muted uppercase tracking-widest">
                NOVO NA PLATAFORMA?{' '}
                <Link
                  to="/cadastro"
                  className="text-gp-blue hover:text-gp-blue-light transition-all underline decoration-2 underline-offset-4"
                >
                  SOLICITAR CADASTRO
                </Link>
              </p>
            </div>
          </form>
        </div>
        
        {/* Footer info */}
        <p className="mt-10 text-center text-[10px] font-black text-gp-muted uppercase tracking-[0.3em] opacity-40">
          © 2026 GLOBAL PARTS • SUPPLY CHAIN INTELLIGENCE
        </p>
      </div>
    </div>
  );
}
