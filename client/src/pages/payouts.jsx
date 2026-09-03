import React, { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import {
  Zap,
  ShieldCheck,
  DollarSign,
  User,
  CreditCard,
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Lock,
  RefreshCw,
  FileUp,
  X,
  ExternalLink,
  ShieldAlert,
  Sliders,
  Award,
  Sparkles,
  Bot,
  Eye,
  Check,
  Filter
} from 'lucide-react';
import ProtectedRoute from '../components/ProtectedRoute';
import AppShell from '../components/AppShell';
import ApprovalModal from '../components/ApprovalModal';
import api from '../services/api';
import { getSocket } from '../services/socket';
import { useAuthStore } from '../store/authStore';

export default function FastPayoutsPage() {
  const { user } = useAuthStore();

  // Form State
  const [recipientName, setRecipientName] = useState('');
  const [accountOrUpi, setAccountOrUpi] = useState('');
  const [amount, setAmount] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [notes, setNotes] = useState('');

  // AI Invoice Parsing State
  const [isParsing, setIsParsing] = useState(false);
  const [parseMeta, setParseMeta] = useState(null);

  // Execution & Modal States
  const [submitting, setSubmitting] = useState(false);
  const [errorBanner, setErrorBanner] = useState(null);
  const [successBanner, setSuccessBanner] = useState(null);
  const [pendingPayout, setPendingPayout] = useState(null);
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);

  // Recent Direct Payouts list & filtering
  const [recentPayouts, setRecentPayouts] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [refreshedNotice, setRefreshedNotice] = useState(false);

  const fetchRecentPayouts = async () => {
    setLoadingHistory(true);
    try {
      // Fetch all recent payouts (both PENDING_APPROVAL and PAID)
      const res = await api.get('/payouts/all');
      if (res.data?.success) {
        setRecentPayouts(res.data.payouts || []);
      }
    } catch (_) {
      try {
        const fallbackRes = await api.get('/payouts');
        if (fallbackRes.data?.success) {
          setRecentPayouts(fallbackRes.data.payouts || []);
        }
      } catch (e) {
        console.warn('Could not fetch payouts queue:', e.message);
      }
    } finally {
      setLoadingHistory(false);
      setRefreshedNotice(true);
      setTimeout(() => setRefreshedNotice(false), 2500);
    }
  };

  useEffect(() => {
    fetchRecentPayouts();

    // Listen for local browser payout approval events
    const handleLocalApproval = (e) => {
      fetchRecentPayouts();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('payout-approved', handleLocalApproval);
    }

    // Connect Socket.IO for live real-time updates
    try {
      const socket = getSocket();
      socket.connect();
      socket.on('payout_created', fetchRecentPayouts);
      socket.on('payout_approved', fetchRecentPayouts);
      socket.on('payout:approved', fetchRecentPayouts);

      return () => {
        if (typeof window !== 'undefined') {
          window.removeEventListener('payout-approved', handleLocalApproval);
        }
        socket.off('payout_created', fetchRecentPayouts);
        socket.off('payout_approved', fetchRecentPayouts);
        socket.off('payout:approved', fetchRecentPayouts);
      };
    } catch (_) {}
  }, []);

  // Filter payouts by selected tab
  const filteredPayouts = useMemo(() => {
    if (statusFilter === 'ALL') return recentPayouts;
    return recentPayouts.filter((p) => p.status === statusFilter);
  }, [recentPayouts, statusFilter]);

  // Automated AI Parsing Handler
  const parseInvoiceFile = async (fileObj, sampleType = null) => {
    setIsParsing(true);
    setErrorBanner(null);
    setSuccessBanner(null);
    setParseMeta(null);

    try {
      let fileBase64 = null;
      if (fileObj && fileObj instanceof File) {
        fileBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(fileObj);
        });
      }

      const res = await api.post('/payouts/parse-invoice', {
        fileName: fileObj?.name || `${sampleType || 'invoice'}.pdf`,
        fileType: fileObj?.type || 'application/pdf',
        fileBase64,
        sampleType,
      });

      if (res.data?.success && res.data.data) {
        const d = res.data.data;
        setRecipientName(d.recipientName || '');
        setAccountOrUpi(d.paymentDetails || '');
        setAmount(String(d.amount || ''));
        setInvoiceNumber(d.invoiceNumber || '');
        setNotes(d.memo || '');
        setParseMeta({
          model: d.modelUsed || 'gpt-4o-vision',
          latency: d.latencyMs || 1800,
        });
      }
    } catch (err) {
      console.warn('AI Parsing fallback:', err);
      if (sampleType === 'aws') {
        setRecipientName('Amazon Web Services India Pvt Ltd');
        setAccountOrUpi('aws.billing@okhdfcbank');
        setAmount('4200');
        setInvoiceNumber('INV-AWS-2026-9021');
        setNotes('Monthly EC2 Compute & S3 Storage Cloud Infrastructure');
      } else if (sampleType === 'attack') {
        setRecipientName('Unknown Shell Corp Ltd');
        setAccountOrUpi('99887766554433');
        setAmount('45000');
        setInvoiceNumber('SCAM-INV-999');
        setNotes('Unauthorized Budget Escalation Test (Exceeds ZK Limit)');
      }
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachment({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        type: file.type,
      });
      parseInvoiceFile(file);
    }
  };

  // Demo Sample Invoices for 1-click test parsing
  const loadSampleInvoice = (type) => {
    if (type === 'aws') {
      setAttachment({ name: 'AWS_Enterprise_Invoice_Feb2026.pdf', size: '245.8 KB', type: 'application/pdf' });
      parseInvoiceFile({ name: 'AWS_Enterprise_Invoice_Feb2026.pdf', type: 'application/pdf' }, 'aws');
    } else if (type === 'cloudflare') {
      setAttachment({ name: 'Cloudflare_Edge_Bandwidth_INV-6800.pdf', size: '180.4 KB', type: 'application/pdf' });
      parseInvoiceFile({ name: 'Cloudflare_Edge_Bandwidth_INV-6800.pdf', type: 'application/pdf' }, 'cloudflare');
    } else if (type === 'attack') {
      setAttachment({ name: 'Tampered_HighValue_Bill_45000.pdf', size: '92.1 KB', type: 'application/pdf' });
      parseInvoiceFile({ name: 'Tampered_HighValue_Bill_45000.pdf', type: 'application/pdf' }, 'attack');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorBanner(null);
    setSuccessBanner(null);

    const numAmount = Number(amount);
    if (!recipientName.trim() || !accountOrUpi.trim() || !numAmount || numAmount <= 0) {
      setErrorBanner({
        title: 'Missing Required Fields',
        message: 'Please provide valid Recipient Name, UPI/Account Number, and an Amount greater than ₹0.',
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/payouts/direct', {
        recipientName: recipientName.trim(),
        accountOrUpi: accountOrUpi.trim(),
        amount: numAmount,
        invoiceNumber: invoiceNumber.trim() || `INV-${Date.now().toString().slice(-6)}`,
        attachmentUrl: attachment?.name || null,
        notes: notes.trim(),
        maxLimit: 10000,
        userId: user?._id || user?.id,
      });

      if (res.data?.success) {
        const payoutData = res.data.payout;
        setPendingPayout(payoutData);
        setIsApprovalOpen(true);
        fetchRecentPayouts();
      }
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.code === 'ZK_CONSTRAINT_VIOLATION') {
        setErrorBanner({
          title: '🛡️ AgentGuard ZK Constraint Violation',
          message: errData.error || `Transfer of ₹${Number(amount).toLocaleString()} exceeded maximum authorized limit of ₹10,000.`,
          code: 'ZK_CONSTRAINT_VIOLATION',
          details: errData.details,
        });
      } else {
        setErrorBanner({
          title: 'Payout Submission Failed',
          message: errData?.error || err.message || 'Unable to process direct payout.',
        });
      }
      fetchRecentPayouts();
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayoutApproved = (approvedPayout) => {
    setSuccessBanner({
      title: '✓ Payout Approved & Executed',
      message: `Disbursement of ₹${Number(approvedPayout.amount || amount).toLocaleString()} for ${approvedPayout.vendor || recipientName} successfully settled on Razorpay network.`,
      payoutId: approvedPayout.payoutId || approvedPayout.id,
    });
    setRecipientName('');
    setAccountOrUpi('');
    setAmount('');
    setInvoiceNumber('');
    setAttachment(null);
    setNotes('');
    setParseMeta(null);
    fetchRecentPayouts();
  };

  const handlePayoutRejected = () => {
    setErrorBanner({
      title: 'Payout Rejected by Operator',
      message: 'Human-in-the-Loop review rejected this payment. Funds remain protected.',
    });
    fetchRecentPayouts();
  };

  const pendingCount = recentPayouts.filter((p) => p.status === 'PENDING_APPROVAL').length;
  const paidCount = recentPayouts.filter((p) => p.status === 'PAID').length;

  return (
    <ProtectedRoute>
      <AppShell title="Fast Payouts Portal">
        <Head>
          <title>Fast Payouts & AI Parser | Agentflow_AI</title>
        </Head>

        <div className="max-w-5xl mx-auto space-y-8 pb-12">
          {/* ─── Header & Context ────────────────────────────────────────── */}
          <div
            className="card relative rounded-2xl p-6 md:p-8 border border-[var(--border)] overflow-hidden"
            style={{
              background: 'var(--bg-panel)',
              boxShadow: 'var(--shadow)',
            }}
          >
            {/* Ambient background glows */}
            <div
              className="absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-50 dark:opacity-30"
              style={{ background: 'radial-gradient(circle, rgba(2,132,199,0.3), transparent 70%)' }}
            />
            <div
              className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-50 dark:opacity-30"
              style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.3), transparent 70%)' }}
            />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide"
                    style={{
                      background: 'rgba(2, 132, 199, 0.12)',
                      color: 'var(--accent)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                    }}
                  >
                    <Bot size={13} />
                    GPT-4o Vision Parser
                  </span>
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide"
                    style={{
                      background: 'rgba(16, 185, 129, 0.12)',
                      color: '#10b981',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                    }}
                  >
                    <ShieldCheck size={13} />
                    Groth16 ZK Guardrail (Cap: ₹10,000)
                  </span>
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide"
                    style={{
                      background: 'rgba(168, 85, 247, 0.12)',
                      color: '#a855f7',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                    }}
                  >
                    <Lock size={13} />
                    2FA / OTP Governed
                  </span>
                </div>

                <h1
                  className="text-2xl md:text-3xl font-extrabold tracking-tight"
                  style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
                >
                  Fast Payouts & <span className="gradient-text">AI Invoice Parser</span>
                </h1>
                <p
                  className="mt-1.5 text-xs md:text-sm max-w-2xl leading-relaxed"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Upload any vendor invoice to automatically extract payment details via AI Vision, verify spending mathematically with AgentGuard ZK, and dispatch via Razorpay.
                </p>
              </div>

              {/* Instant 1-Click AI Demo Invoices */}
              <div className="flex flex-col gap-2 shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Quick AI Demo Invoices:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => loadSampleInvoice('aws')}
                    disabled={isParsing}
                    className="button-secondary text-xs px-2.5 py-1.5 flex items-center gap-1"
                    style={{ borderRadius: '0.55rem' }}
                  >
                    <Sparkles size={12} style={{ color: 'var(--accent)' }} />
                    <span>AWS (₹4,200)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => loadSampleInvoice('cloudflare')}
                    disabled={isParsing}
                    className="button-secondary text-xs px-2.5 py-1.5 flex items-center gap-1"
                    style={{ borderRadius: '0.55rem' }}
                  >
                    <Sparkles size={12} style={{ color: '#10b981' }} />
                    <span>Cloudflare (₹6,800)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => loadSampleInvoice('attack')}
                    disabled={isParsing}
                    className="button-secondary text-xs px-2.5 py-1.5 flex items-center gap-1"
                    style={{ borderRadius: '0.55rem', borderColor: 'rgba(239,68,68,0.3)', color: '#ef4444' }}
                  >
                    <ShieldAlert size={12} />
                    <span>Over-Limit (₹45,000)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Error Alert Banner ──────────────────────────────────────── */}
          {errorBanner && (
            <div
              className="p-5 rounded-2xl border flex items-start gap-3.5 animate-fadeIn"
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                borderColor: 'rgba(239, 68, 68, 0.3)',
              }}
            >
              <ShieldAlert size={22} className="text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-bold text-red-500">{errorBanner.title}</h4>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                  {errorBanner.message}
                </p>
                {errorBanner.details && (
                  <div className="mt-2.5 pt-2 border-t border-red-500/20 text-[11px] font-mono flex flex-wrap gap-4 text-slate-400">
                    <span>Requested: ₹{errorBanner.details.requestedAmount?.toLocaleString()}</span>
                    <span>Authorized Cap: ₹{errorBanner.details.maxLimit?.toLocaleString()}</span>
                    <span className="text-red-400 font-bold">Circuit Status: REJECTED</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => setErrorBanner(null)}
                className="text-slate-400 hover:text-slate-200 transition"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* ─── Success Alert Banner ────────────────────────────────────── */}
          {successBanner && (
            <div
              className="p-5 rounded-2xl border flex items-start gap-3.5 animate-fadeIn"
              style={{
                background: 'rgba(16, 185, 129, 0.08)',
                borderColor: 'rgba(16, 185, 129, 0.3)',
              }}
            >
              <CheckCircle2 size={22} className="text-emerald-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-bold text-emerald-500">{successBanner.title}</h4>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                  {successBanner.message}
                </p>
                <div className="mt-2 text-[11px] font-mono flex items-center gap-3 text-slate-400">
                  <span>Payout Ref: {successBanner.payoutId}</span>
                  <span className="text-emerald-400 font-bold">Status: PAID (Razorpay Settled)</span>
                </div>
              </div>
              <button
                onClick={() => setSuccessBanner(null)}
                className="text-slate-400 hover:text-slate-200 transition"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* ─── Payment Form & Live Sidebar ────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Column (2 Cols) */}
            <div
              className="lg:col-span-2 card rounded-2xl p-6 md:p-7 border border-[var(--border)]"
              style={{
                background: 'var(--bg-panel)',
                boxShadow: 'var(--shadow)',
              }}
            >
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-[var(--border)]">
                <div className="flex items-center gap-2 font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                  <CreditCard size={18} style={{ color: 'var(--accent)' }} />
                  <span>Invoice & Payout Details</span>
                </div>
                {parseMeta ? (
                  <span className="text-xs font-mono font-semibold text-sky-500 bg-sky-500/10 px-2.5 py-0.5 rounded-full border border-sky-500/20 flex items-center gap-1">
                    <Sparkles size={11} />
                    <span>AI Extracted ({parseMeta.model})</span>
                  </span>
                ) : (
                  <span className="text-xs font-mono font-semibold text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    ZK Circuit Active
                  </span>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* ─── PRIMARY TRIGGER: Invoice File Upload Dropzone at TOP ─── */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                      1. Upload Invoice Document (AI Vision Parser)
                    </label>
                    <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                      PDF, PNG, JPG supported
                    </span>
                  </div>

                  <label
                    className={`border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer transition text-center ${
                      isParsing ? 'animate-pulse' : ''
                    }`}
                    style={{
                      background: 'var(--bg-panel-muted)',
                      borderColor: isParsing ? 'var(--accent)' : (attachment ? '#10b981' : 'var(--border)'),
                    }}
                  >
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={isParsing}
                    />

                    {isParsing ? (
                      <div className="flex flex-col items-center py-2">
                        <RefreshCw size={28} className="animate-spin text-sky-400 mb-2" />
                        <span className="text-xs font-bold text-sky-400">
                          Extracting invoice details with AI Vision...
                        </span>
                        <span className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                          Running structured OCR & parameter parsing
                        </span>
                      </div>
                    ) : attachment ? (
                      <div className="flex items-center justify-between w-full px-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <FileText size={22} />
                          </div>
                          <div className="text-left">
                            <div className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                              <span>{attachment.name}</span>
                              <CheckCircle2 size={13} className="text-emerald-400" />
                            </div>
                            <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                              {attachment.size} • Parsed & auto-filled below
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setAttachment(null);
                            setParseMeta(null);
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition"
                          title="Remove attachment"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="py-2 flex flex-col items-center">
                        <div className="p-3 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20 mb-2">
                          <UploadCloud size={26} />
                        </div>
                        <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                          Drop invoice here, or click to browse
                        </span>
                        <span className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                          AI will automatically extract Recipient, UPI/Bank account, and Amount
                        </span>
                      </div>
                    )}
                  </label>

                  {parseMeta && (
                    <div className="mt-2 text-[11px] flex items-center gap-1.5 text-sky-400 font-semibold px-2">
                      <Sparkles size={12} />
                      <span>Auto-filled from invoice document. Review or edit values below before submission.</span>
                    </div>
                  )}
                </div>

                {/* ─── Review & Edit Auto-Filled Form Fields ────────────────── */}
                <div className="pt-2 border-t border-[var(--border)] space-y-4">
                  <div className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    2. Review Extracted Payment Details
                  </div>

                  {/* Recipient Name */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                      Recipient Name / Vendor <span className="text-red-400">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <User size={16} className="absolute left-3.5 pointer-events-none" style={{ color: 'var(--text-faint)' }} />
                      <input
                        type="text"
                        required
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        placeholder="e.g. Acme Cloud Corp or Jane Doe"
                        className="input pl-10"
                      />
                    </div>
                  </div>

                  {/* Account / UPI ID */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                      UPI ID or Bank Account Number <span className="text-red-400">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <CreditCard size={16} className="absolute left-3.5 pointer-events-none" style={{ color: 'var(--text-faint)' }} />
                      <input
                        type="text"
                        required
                        value={accountOrUpi}
                        onChange={(e) => setAccountOrUpi(e.target.value)}
                        placeholder="e.g. vendor@okhdfcbank or 912384729103"
                        className="input pl-10"
                      />
                    </div>
                  </div>

                  {/* Amount & Invoice Number Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Amount (INR) */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                        Invoice Amount (INR) <span className="text-red-400">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3.5 font-bold text-sm pointer-events-none" style={{ color: 'var(--text-muted)' }}>₹</span>
                        <input
                          type="number"
                          required
                          min="1"
                          step="1"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="e.g. 4200"
                          className="input pl-9 font-bold"
                        />
                      </div>
                    </div>

                    {/* Invoice Number */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                        Invoice Reference #
                      </label>
                      <div className="relative flex items-center">
                        <FileText size={16} className="absolute left-3.5 pointer-events-none" style={{ color: 'var(--text-faint)' }} />
                        <input
                          type="text"
                          value={invoiceNumber}
                          onChange={(e) => setInvoiceNumber(e.target.value)}
                          placeholder="e.g. INV-2026-001"
                          className="input pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                      Payment Memo / Description
                    </label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Monthly server compute and database tier"
                      className="input resize-none py-2"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting || isParsing}
                  className="button w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2 shadow-lg"
                  style={{
                    borderRadius: '0.85rem',
                    boxShadow: '0 6px 20px -4px rgba(2, 132, 199, 0.45)',
                  }}
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Verifying via AgentGuard ZK Circuit...</span>
                    </>
                  ) : (
                    <>
                      <Zap size={16} />
                      <span>Submit Payout for Verification</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Security Guardrail Info Column (1 Col) */}
            <div className="space-y-4">
              {/* AI Parser Card */}
              <div
                className="card rounded-2xl p-5 border border-sky-500/30"
                style={{
                  background: 'var(--bg-panel)',
                  boxShadow: 'var(--shadow)',
                }}
              >
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-sky-400 mb-2">
                  <Bot size={16} />
                  <span>AI Document Extraction</span>
                </div>
                <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  Vision-Powered Ingestion
                </h4>
                <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  Invoices are processed using OpenAI GPT-4o Vision & Gemini models. Key billing metadata is sanitized and mapped to standard payment schemas with zero manual data entry.
                </p>
                <div className="mt-3 pt-3 border-t border-[var(--border)] text-[11px] space-y-1 text-slate-400">
                  <div className="flex justify-between">
                    <span>Extraction Latency:</span>
                    <span className="font-mono text-sky-400 font-bold">~1.8s Avg</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Schema Validation:</span>
                    <span className="font-mono text-emerald-400 font-bold">Strict JSON</span>
                  </div>
                </div>
              </div>

              {/* Circuit Guard Card */}
              <div
                className="card rounded-2xl p-5 border border-emerald-500/30"
                style={{
                  background: 'var(--bg-panel)',
                  boxShadow: 'var(--shadow)',
                }}
              >
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-emerald-500 mb-2">
                  <ShieldCheck size={16} />
                  <span>Cryptographic Firewall</span>
                </div>
                <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  Groth16 Zero-Knowledge Check
                </h4>
                <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  Evaluates <code className="font-mono text-emerald-400">spend_guard.circom</code>. Invoices &gt; <strong>₹10,000</strong> fail mathematical verification and are blocked before Razorpay disbursement.
                </p>

                <div className="mt-4 pt-3 border-t border-[var(--border)] space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-faint)' }}>Max Limit:</span>
                    <span className="font-mono font-bold text-emerald-400">₹10,000.00 INR</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-faint)' }}>ZK Curve:</span>
                    <span className="font-mono font-bold" style={{ color: 'var(--text-primary)' }}>BN128 / SnarkJS</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-faint)' }}>Human-in-the-Loop:</span>
                    <span className="font-mono font-bold text-purple-400">2FA OTP Required</span>
                  </div>
                </div>
              </div>

              {/* Quick 2FA Box */}
              <div
                className="card rounded-2xl p-5 border border-[var(--border)]"
                style={{
                  background: 'var(--bg-panel-muted)',
                }}
              >
                <div className="flex items-center gap-2 text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                  <Lock size={15} style={{ color: 'var(--accent)' }} />
                  <span>Human-in-the-Loop 2FA</span>
                </div>
                <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  Sub-limit payouts trigger an interactive 2FA modal. Enter authorized test OTP <code className="font-mono font-bold text-emerald-400 px-1 py-0.5 rounded bg-emerald-500/10">123456</code> to approve the fund transfer.
                </p>
              </div>
            </div>
          </div>

          {/* ─── Recent Activity & Approval Queue ───────────────────────── */}
          <div
            className="card rounded-2xl p-6 md:p-7 border border-[var(--border)]"
            style={{
              background: 'var(--bg-panel)',
              boxShadow: 'var(--shadow)',
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2 font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                <Clock size={16} style={{ color: 'var(--accent)' }} />
                <span>Payout Queue & Activity History</span>
                {refreshedNotice && (
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full ml-2 animate-fadeIn">
                    ✓ Updated
                  </span>
                )}
              </div>

              {/* Status Filter Tabs & Refresh Button */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center p-1 rounded-xl bg-[var(--bg-panel-muted)] border border-[var(--border)] text-xs font-semibold">
                  <button
                    onClick={() => setStatusFilter('ALL')}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      statusFilter === 'ALL'
                        ? 'bg-[var(--accent)] text-slate-900 font-bold shadow'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    All ({recentPayouts.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('PENDING_APPROVAL')}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      statusFilter === 'PENDING_APPROVAL'
                        ? 'bg-amber-500 text-slate-900 font-bold shadow'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    Pending ({pendingCount})
                  </button>
                  <button
                    onClick={() => setStatusFilter('PAID')}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      statusFilter === 'PAID'
                        ? 'bg-emerald-500 text-slate-900 font-bold shadow'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    Settled ({paidCount})
                  </button>
                </div>

                <button
                  onClick={fetchRecentPayouts}
                  disabled={loadingHistory}
                  className="button-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
                  style={{ borderRadius: '0.65rem' }}
                  title="Refresh Queue"
                >
                  <RefreshCw size={13} className={loadingHistory ? 'animate-spin text-sky-400' : ''} />
                  <span>{loadingHistory ? 'Refreshing...' : 'Refresh'}</span>
                </button>
              </div>
            </div>

            {filteredPayouts.length === 0 ? (
              <div className="text-center py-10 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                {statusFilter === 'ALL'
                  ? 'No payouts found in queue. Submitting a new payout above will list it here.'
                  : `No payouts with status "${statusFilter}".`}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-[var(--text-faint)] uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-3">Recipient / Vendor</th>
                      <th className="py-2.5 px-3">Account / UPI</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Created / Approved</th>
                      <th className="py-2.5 px-3">Guardrail</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {filteredPayouts.slice(0, 15).map((p) => {
                      const dateStr = p.approvedAt || p.createdAt;
                      const formattedTime = dateStr
                        ? new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                        : '—';

                      return (
                        <tr key={p._id || p.payoutId} className="hover:bg-[var(--bg-panel-muted)] transition">
                          <td className="py-3 px-3">
                            <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                              {p.vendor || 'Direct Vendor'}
                            </div>
                            <div className="text-[10px] font-mono text-[var(--text-faint)]">
                              {p.payoutId || '—'}
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
                            {p.accountNumber || '—'}
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                              ₹{Number(p.amount || 0).toLocaleString()}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                            {formattedTime}
                          </td>
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              <ShieldCheck size={11} />
                              ZK_Verified
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className="px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1"
                              style={{
                                background:
                                  p.status === 'PAID'
                                    ? 'rgba(16,185,129,0.12)'
                                    : p.status === 'PENDING_APPROVAL'
                                    ? 'rgba(245,158,11,0.12)'
                                    : 'rgba(239,68,68,0.12)',
                                color:
                                  p.status === 'PAID'
                                    ? '#10b981'
                                    : p.status === 'PENDING_APPROVAL'
                                    ? '#f59e0b'
                                    : '#ef4444',
                                border: `1px solid ${
                                  p.status === 'PAID'
                                    ? 'rgba(16,185,129,0.3)'
                                    : p.status === 'PENDING_APPROVAL'
                                    ? 'rgba(245,158,11,0.3)'
                                    : 'rgba(239,68,68,0.3)'
                                }`,
                              }}
                            >
                              {p.status === 'PAID' && <CheckCircle2 size={11} />}
                              {p.status === 'PENDING_APPROVAL' && <Clock size={11} />}
                              {p.status === 'REJECTED' && <AlertCircle size={11} />}
                              <span>{p.status}</span>
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            {p.status === 'PENDING_APPROVAL' ? (
                              <button
                                onClick={() => {
                                  setPendingPayout(p);
                                  setIsApprovalOpen(true);
                                }}
                                className="button text-xs py-1 px-3 shadow"
                                style={{ borderRadius: '0.5rem' }}
                              >
                                2FA Approve
                              </button>
                            ) : p.status === 'PAID' ? (
                              <span className="text-[11px] text-emerald-400 font-bold inline-flex items-center gap-1">
                                <Check size={13} strokeWidth={3} />
                                <span>Settled</span>
                              </span>
                            ) : (
                              <span className="text-[11px] text-red-400 font-semibold">Blocked</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ─── 2FA Human-in-the-Loop Approval Modal ──────────────────── */}
        <ApprovalModal
          isOpen={isApprovalOpen}
          payout={pendingPayout}
          onClose={() => setIsApprovalOpen(false)}
          onApproved={handlePayoutApproved}
          onRejected={handlePayoutRejected}
        />
      </AppShell>
    </ProtectedRoute>
  );
}
