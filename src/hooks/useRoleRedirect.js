import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './useAuth';
import { supabase } from '@/lib/supabase';
import { ROLE_DASHBOARDS } from '@/constants/roles';

export function useRoleRedirect() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    // Safely check for intended role cookie
    const cookies = document.cookie.split('; ');
    const intendedCookie = cookies.find((c) => c.startsWith('intended_role='));
    const intendedRole = intendedCookie ? intendedCookie.split('=')[1] : null;

    if (intendedRole && profile && intendedRole !== profile.role) {
      // Execute the role upgrade natively on the client using the active session
      supabase
        .from('profiles')
        .update({ role: intendedRole })
        .eq('id', user.id)
        .then(() => {
          document.cookie = 'intended_role=; path=/; max-age=0'; // clear cookie
          window.location.href = ROLE_DASHBOARDS[intendedRole] || '/student/dashboard';
        });
      return;
    }

    // Clear it anyway just in case it matched
    if (intendedCookie) {
      document.cookie = 'intended_role=; path=/; max-age=0';
    }

    if (profile) {
      router.push(ROLE_DASHBOARDS[profile.role] || '/student/dashboard');
    }
  }, [user, profile, loading, router]);

  return { loading };
}
