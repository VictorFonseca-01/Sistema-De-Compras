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
            .eq('id', user.id)
            .single();
          
          if (profileError) {
            console.error('Profile query error:', profileError);
            setError(new Error(profileError.message));
          } else if (data) {
            setProfile(data);
          } else {
            setError(new Error('Perfil não encontrado para este usuário.'));
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
