import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: 'master_admin' | 'usuario' | 'gestor' | 'ti' | 'compras' | 'diretoria';
  department?: string;
  company_id?: string;
  department_id?: string;
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function getProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id);
          
          if (profileError) {
            console.error('Profile query error:', profileError);
            setError(new Error(profileError.message));
          } else if (data && data.length > 0) {
            setProfile(data[0]);
          } else {
            // Se não houver perfil, não disparamos erro fatal, apenas deixamos como null
            console.warn('Perfil não encontrado para o usuário:', user.id);
          }
        }
      } catch (err: any) {
        console.error('Error fetching profile:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    }

    getProfile();
  }, []);

  return { profile, loading, error };
}
