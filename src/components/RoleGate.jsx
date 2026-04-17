import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LoadingScreen from './LoadingScreen';
import { ROLE_DASHBOARDS } from '@/constants/roles';

/**
 * RoleGate component to handle RBAC.
 * @param {string} role - The required role (e.g., 'student', 'teacher', 'admin').
 */
export default function RoleGate({ children, role }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    if (role && profile && profile.role !== role) {
      const target = ROLE_DASHBOARDS[profile.role] || '/login';
      router.push(target);
    }
  }, [user, profile, loading, role, router]);

  if (loading) return <LoadingScreen />;

  if (!user) return null;

  if (role && profile?.role !== role) return null;

  return children;
}
