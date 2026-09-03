import '../styles/globals.css';
import { ThemeProvider } from 'next-themes';
import { SessionProvider } from 'next-auth/react';
import MobileBlocker from '../components/MobileBlocker';

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <MobileBlocker />
        <Component {...pageProps} />
      </ThemeProvider>
    </SessionProvider>
  );
}