import React, { useState, useEffect } from 'react';
import { Monitor, Laptop, Copy, Check, ExternalLink, ShieldAlert, Sparkles, X, ArrowRight } from 'lucide-react';

export default function MobileBlocker() {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkViewport = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  const handleCopyUrl = async () => {
    try {
      if (typeof window !== 'undefined') {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (_) {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (!mounted || !isMobile || dismissed) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-5 md:hidden"
      style={{
        background: 'rgba(11, 15, 23, 0.96)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {/* Background Ambient Neon Glows */}
      <div
        className="absolute -top-32 -right-32 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-40"
        style={{ background: 'radial-gradient(circle, #38bdf8, transparent 70%)' }}
      />
      <div
        className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-40"
        style={{ background: 'radial-gradient(circle, #10b981, transparent 70%)' }}
      />

      {/* Modal Container */}
      <div
        className="relative z-10 w-full max-w-md rounded-3xl p-6 sm:p-8 border border-slate-700/60 shadow-2xl text-center flex flex-col items-center"
        style={{
          background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)',
          color: '#f8fafc',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75), 0 0 40px -10px rgba(56, 189, 248, 0.25)',
        }}
      >
        {/* Device Icon Insignia */}
        <div className="relative mb-5">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl p-0.5"
            style={{
              background: 'linear-gradient(135deg, #0284c7 0%, #10b981 100%)',
              boxShadow: '0 10px 25px -5px rgba(56, 189, 248, 0.4)',
            }}
          >
            <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center">
              <Monitor size={36} className="text-sky-400 animate-pulse" />
            </div>
          </div>
          <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center border-2 border-slate-900 font-bold text-xs shadow-md">
            !
          </span>
        </div>

        {/* Badges */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide bg-sky-500/10 text-sky-400 border border-sky-500/30 mb-3">
          <Laptop size={12} />
          <span>Desktop Experience Recommended</span>
        </div>

        {/* Title & Subtitle */}
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-100">
          Desktop Display <span className="text-sky-400">Required</span>
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
          Agentflow_AI&apos;s visual canvas editor, multi-agent DAG pipelines, and security dashboards are engineered and optimized for desktop and laptop screens.
        </p>

        {/* Instruction Card */}
        <div className="mt-5 w-full p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-left">
          <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Sparkles size={12} />
            <span>Optimal Hardware Specs</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Please open this platform on a device with a screen width of at least <strong>1024px</strong> for full workflow architecting and interactive node editing capabilities.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 w-full space-y-2.5">
          {/* Copy URL Button */}
          <button
            type="button"
            onClick={handleCopyUrl}
            className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition shadow-lg"
            style={{
              background: copied
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              boxShadow: copied
                ? '0 6px 20px -4px rgba(16, 185, 129, 0.4)'
                : '0 6px 20px -4px rgba(2, 132, 199, 0.4)',
            }}
          >
            {copied ? (
              <>
                <Check size={16} className="text-white" strokeWidth={3} />
                <span>✓ Platform URL Copied!</span>
              </>
            ) : (
              <>
                <Copy size={16} />
                <span>Copy Platform URL to Send to PC</span>
              </>
            )}
          </button>

          {/* Dismiss / Continue anyway */}
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition border border-transparent hover:border-slate-700/50 flex items-center justify-center gap-1.5"
          >
            <span>Proceed in Mobile Read-Only View</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
