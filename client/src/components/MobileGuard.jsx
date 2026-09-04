import React, { useState, useEffect } from 'react';
import { 
  Monitor, 
  Laptop, 
  Copy, 
  Check, 
  Share2, 
  Sparkles, 
  ShieldCheck, 
  Workflow, 
  Terminal, 
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { useMediaQuery } from '../hooks/useMediaQuery';

export default function MobileGuard() {
  const isMobileViewport = useMediaQuery('(max-width: 767px)');
  const [copied, setCopied] = useState(false);
  const [bypassed, setBypassed] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    // Check if user already chose to bypass in this session
    if (typeof window !== 'undefined') {
      const sessionBypass = sessionStorage.getItem('agentflow_mobile_bypass');
      if (sessionBypass === 'true') {
        setBypassed(true);
      }
      if (typeof navigator !== 'undefined' && navigator.share) {
        setCanShare(true);
      }
    }
  }, []);

  const handleCopyLink = async () => {
    if (typeof window === 'undefined') return;

    const url = window.location.href;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        // Fallback for older browsers or insecure contexts
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy platform URL:', err);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareLink = async () => {
    if (typeof window === 'undefined' || !navigator.share) return;
    try {
      await navigator.share({
        title: 'Agentflow_AI Platform',
        text: 'Access Agentflow_AI multi-agent orchestration and security canvas:',
        url: window.location.href,
      });
    } catch (_) {
      // User cancelled share or unsupported
    }
  };

  const handleBypass = () => {
    setBypassed(true);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('agentflow_mobile_bypass', 'true');
      } catch (_) {}
    }
  };

  // If not on mobile viewport or bypassed, do not render overlay
  if (!isMobileViewport || bypassed) {
    return null;
  }

  return (
    <div
      id="mobile-screen-guard"
      className="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      style={{
        backgroundColor: '#090d16',
        backgroundImage: `
          radial-gradient(at 0% 0%, rgba(56, 189, 248, 0.15) 0px, transparent 50%),
          radial-gradient(at 100% 100%, rgba(16, 185, 129, 0.12) 0px, transparent 50%),
          radial-gradient(at 50% 50%, rgba(99, 102, 241, 0.08) 0px, transparent 60%)
        `,
      }}
    >
      {/* Dynamic Animated Ambient Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] bg-sky-500/20 rounded-full blur-3xl pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-10 right-10 w-[240px] h-[240px] bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      
      {/* Background Subtle Grid Texture */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* Main Glassmorphic Card Container */}
      <div
        className="relative z-10 w-full max-w-md rounded-3xl p-6 sm:p-8 text-center flex flex-col items-center border border-slate-700/60 shadow-2xl my-auto"
        style={{
          background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.94) 0%, rgba(9, 13, 22, 0.98) 100%)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 35px -5px rgba(56, 189, 248, 0.22)',
        }}
      >
        {/* Animated Glowing Ring & Device Icon */}
        <div className="relative mb-5 group">
          {/* Outer Pulsing Aura */}
          <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-400 opacity-60 blur-lg animate-pulse-slow" />
          
          {/* Icon Housing */}
          <div
            className="relative w-20 h-20 rounded-2xl flex items-center justify-center p-[2px] shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, #38bdf8 0%, #6366f1 50%, #10b981 100%)',
            }}
          >
            <div className="w-full h-full rounded-[14px] bg-slate-950/90 flex items-center justify-center backdrop-blur-md">
              <Monitor size={38} className="text-sky-400 drop-shadow-[0_0_12px_rgba(56,189,248,0.7)]" />
            </div>
          </div>

          {/* Status Badge Ring */}
          <span className="absolute -bottom-1 -right-1 flex h-6 w-6">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-6 w-6 bg-slate-900 border-2 border-emerald-400 items-center justify-center text-[10px] font-black text-emerald-400">
              ✓
            </span>
          </span>
        </div>

        {/* Platform Tag */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-sky-500/10 text-sky-400 border border-sky-500/30 mb-3 shadow-inner">
          <Laptop size={12} className="text-sky-400" />
          <span>Desktop Experience Preferred</span>
        </div>

        {/* Headline */}
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight">
          Agentflow_AI is <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">Optimized for Desktop</span>
        </h1>

        {/* Subtext */}
        <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed max-w-sm">
          To access the multi-agent canvas, real-time telemetry logs, and BYOK integration engine, please open this link on a desktop or laptop browser.
        </p>

        {/* Desktop Feature Badges */}
        <div className="mt-5 w-full grid grid-cols-1 gap-2 text-left">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400 shrink-0">
              <Workflow size={15} />
            </div>
            <div className="text-[11px] text-slate-300">
              <span className="font-semibold text-slate-100">Multi-Agent DAG Canvas:</span> Interactive node wiring & pipeline debugging.
            </div>
          </div>

          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
              <Terminal size={15} />
            </div>
            <div className="text-[11px] text-slate-300">
              <span className="font-semibold text-slate-100">Real-Time Telemetry:</span> High-throughput socket logs & execution traces.
            </div>
          </div>

          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
              <ShieldCheck size={15} />
            </div>
            <div className="text-[11px] text-slate-300">
              <span className="font-semibold text-slate-100">BYOK Integration Engine:</span> Fast Razorpay & ZK Guard security rails.
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 w-full space-y-2.5">
          {/* Copy Platform Link Button */}
          <button
            type="button"
            id="copy-platform-link-btn"
            onClick={handleCopyLink}
            className="w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition duration-200 shadow-xl active:scale-[0.98]"
            style={{
              background: copied
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'linear-gradient(135deg, #0284c7 0%, #2563eb 50%, #4f46e5 100%)',
              color: '#ffffff',
              boxShadow: copied
                ? '0 8px 25px -4px rgba(16, 185, 129, 0.45)'
                : '0 8px 25px -4px rgba(2, 132, 199, 0.45)',
            }}
          >
            {copied ? (
              <>
                <Check size={16} className="text-white animate-bounce" strokeWidth={3} />
                <span>Link Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy size={16} />
                <span>Copy Platform Link</span>
              </>
            )}
          </button>

          {/* Quick Native Share (if available on mobile device) */}
          {canShare && (
            <button
              type="button"
              onClick={handleShareLink}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 transition flex items-center justify-center gap-2"
            >
              <Share2 size={14} className="text-sky-400" />
              <span>Share to Desktop Device</span>
            </button>
          )}

          {/* Bypass Option */}
          <button
            type="button"
            id="bypass-mobile-guard-btn"
            onClick={handleBypass}
            className="w-full pt-2 pb-1 text-[11px] text-slate-500 hover:text-slate-300 transition underline underline-offset-4 decoration-slate-700 hover:decoration-slate-400 cursor-pointer block text-center"
          >
            Continue anyway (May experience layout constraint limits)
          </button>
        </div>
      </div>
    </div>
  );
}
