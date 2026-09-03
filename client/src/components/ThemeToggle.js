import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="theme-toggle" />;

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      id="theme-toggle-btn"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="theme-toggle"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      <span
        style={{
          display: 'inline-flex',
          transition: 'transform 0.35s cubic-bezier(.34,1.56,.64,1), opacity 0.25s',
          transform: isDark ? 'rotate(0deg) scale(1)' : 'rotate(-20deg) scale(0.9)',
        }}
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </span>
    </button>
  );
}