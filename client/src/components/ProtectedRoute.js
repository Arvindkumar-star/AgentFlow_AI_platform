import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '../store/authStore';

export default function ProtectedRoute({ children }) {
  const router = useRouter();
  const { token, hydrated } = useAuthStore();
  useEffect(() => { if (hydrated && !token) router.replace('/login'); }, [hydrated, token, router]);
  if (!hydrated || !token) return <div className="grid-bg flex min-h-screen items-center justify-center text-slate-400">Checking session…</div>;
  return children;
}
