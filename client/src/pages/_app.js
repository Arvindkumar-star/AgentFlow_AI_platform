import '../styles/globals.css';
import { ThemeProvider } from 'next-themes';
import { SessionProvider } from 'next-auth/react';
import MobileGuard from '../components/MobileGuard';
import AuthSync from '../components/AuthSync';

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <AuthSync />
        <MobileGuard />
        <Component {...pageProps} />
      </ThemeProvider>
    </SessionProvider>
  );
}