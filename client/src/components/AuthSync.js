import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { useAuthStore } from '../store/authStore';

/**
 * AuthSync Component
 * Automatically synchronizes NextAuth Google OAuth sessions with our backend JWT authentication.
 * Ensures the client always holds a valid cryptographically signed backend JWT token and redirects to dashboard.
 */
export default function AuthSync() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { token, user, googleLogin } = useAuthStore();
  const syncingRef = useRef(false);

  useEffect(() => {
    async function syncSessionWithBackend() {
      if (status === 'authenticated' && session?.user?.email && !syncingRef.current) {
        const isInvalidToken = !token || token.startsWith('jwt_fallback_') || token.startsWith('oauth_jwt_');
        const isDifferentUser = user?.email && user.email.toLowerCase() !== session.user.email.toLowerCase();

        if (isInvalidToken || isDifferentUser) {
          syncingRef.current = true;
          try {
            await googleLogin({
              name: session.user.name || 'Google Operator',
              email: session.user.email,
              avatar: session.user.image,
              googleId: session.user.id,
            });
            if (['/login', '/register', '/'].includes(router.pathname)) {
              router.replace('/dashboard');
            }
          } catch (err) {
            console.error('[AuthSync] Error synchronizing Google session with backend API:', err);
            if (['/login', '/register', '/'].includes(router.pathname)) {
              router.replace('/dashboard');
            }
          } finally {
            syncingRef.current = false;
          }
        } else if (['/login', '/register', '/'].includes(router.pathname)) {
          router.replace('/dashboard');
        }
      }
    }

    syncSessionWithBackend();
  }, [session, status, token, user, googleLogin, router]);

  return null;
}
