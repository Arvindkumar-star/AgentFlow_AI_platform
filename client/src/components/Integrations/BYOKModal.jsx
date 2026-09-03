import React, { useState, useEffect } from 'react';
import { Key, Link as LinkIcon, CheckCircle2, AlertCircle, Loader2, Trash2, Eye, EyeOff, Shield, Sparkles, ExternalLink } from 'lucide-react';
import api from '../../services/api';

export default function BYOKModal({ provider, currentStatus, onClose, onUpdated }) {
  const [authType, setAuthType] = useState('api_key');
  const [formData, setFormData] = useState({});
  const [showSecrets, setShowSecrets] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Set default auth type based on provider
    if (provider.id === 'discord') setAuthType('webhook');
    else if (provider.id === 'slack') setAuthType('webhook');
    else if (provider.id === 'razorpay') setAuthType('api_key');
    else if (provider.id === 'gmail' || provider.id === 'google-sheets') setAuthType('oauth2');
    else setAuthType('api_key');

    setFormData({});
    setTestResult(null);
    setErrorMessage('');
  }, [provider]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setTestResult(null);
    setErrorMessage('');
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    setErrorMessage('');
    try {
      const { data } = await api.post(`/integrations/${provider.id}/test`, {
        authType,
        ...formData,
      });
      setTestResult(data);
    } catch (err) {
      setTestResult({
        success: false,
        message: err.response?.data?.message || err.message || 'Connection test failed',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage('');
    try {
      const { data } = await api.post(`/integrations/${provider.id}/byok`, {
        authType,
        ...formData,
      });
      if (data.success) {
        onUpdated();
        onClose();
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to save credentials');
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm(`Are you sure you want to disconnect custom BYOK credentials for ${provider.name}?`)) return;
    setDisconnecting(true);
    try {
      await api.delete(`/integrations/${provider.id}/byok`);
      onUpdated();
      onClose();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to disconnect');
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[350] flex items-center justify-center p-4"
      style={{
        background: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-2xl p-6 sm:p-7 shadow-2xl border flex flex-col max-h-[90vh] overflow-y-auto"
        style={{
          background: 'var(--bg-panel)',
          borderColor: `${provider.color}40`,
          boxShadow: `0 25px 50px -12px rgba(0,0,0,0.6), 0 0 30px ${provider.color}15`,
        }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <span
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 shadow-md"
              style={{
                background: `${provider.color}20`,
                border: `1px solid ${provider.color}40`,
              }}
            >
              {provider.emoji}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-[var(--text-primary)]">
                  {provider.name} Custom BYOK
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Shield size={10} /> AES-256
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Supply your personal API keys or webhook URLs to execute automated tools.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-faint)] hover:text-[var(--text-primary)] p-1.5 rounded-lg transition"
          >
            ✕
          </button>
        </div>

        {/* Existing Connected Status Banner */}
        {currentStatus?.isBYOK && currentStatus?.maskedIdentifier && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <CheckCircle2 size={15} />
              <span>Active BYOK Key: <strong className="font-mono text-emerald-300">{currentStatus.maskedIdentifier}</strong></span>
            </div>
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="text-rose-400 hover:text-rose-300 flex items-center gap-1 font-bold underline"
            >
              <Trash2 size={12} />
              <span>{disconnecting ? 'Disconnecting...' : 'Remove'}</span>
            </button>
          </div>
        )}

        {/* Auth Method Selector */}
        {(provider.id === 'discord' || provider.id === 'slack') && (
          <div className="mt-4 flex gap-2 p-1 rounded-xl bg-[var(--bg-panel-muted)] border border-[var(--border)]">
            <button
              type="button"
              onClick={() => setAuthType('webhook')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                authType === 'webhook'
                  ? 'bg-[var(--accent)] text-slate-950 shadow'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <LinkIcon size={12} />
              <span>Incoming Webhook</span>
            </button>
            <button
              type="button"
              onClick={() => setAuthType('bot_token')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                authType === 'bot_token'
                  ? 'bg-[var(--accent)] text-slate-950 shadow'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Key size={12} />
              <span>Bot Token</span>
            </button>
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleSave} className="mt-4 space-y-4">
          {/* Discord Specific Fields */}
          {provider.id === 'discord' && (
            <>
              {authType === 'webhook' ? (
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">
                    Discord Webhook URL <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type={showSecrets ? 'text' : 'password'}
                    required
                    placeholder="https://discord.com/api/webhooks/..."
                    value={formData.webhookUrl || ''}
                    onChange={(e) => handleChange('webhookUrl', e.target.value)}
                    className="input w-full font-mono text-xs"
                  />
                  <p className="text-[11px] text-[var(--text-faint)] mt-1">
                    Server Settings → Integrations → Webhooks → Copy Webhook URL.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">
                      Discord Bot Token <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type={showSecrets ? 'text' : 'password'}
                      required
                      placeholder="MTAyND..."
                      value={formData.botToken || ''}
                      onChange={(e) => handleChange('botToken', e.target.value)}
                      className="input w-full font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">
                      Default Channel ID <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="1122334455667788"
                      value={formData.channelId || ''}
                      onChange={(e) => handleChange('channelId', e.target.value)}
                      className="input w-full font-mono text-xs"
                    />
                  </div>
                </>
              )}
            </>
          )}

          {/* Slack Specific Fields */}
          {provider.id === 'slack' && (
            <>
              {authType === 'webhook' ? (
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">
                    Slack Incoming Webhook URL <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type={showSecrets ? 'text' : 'password'}
                    required
                    placeholder="https://hooks.slack.com/services/..."
                    value={formData.webhookUrl || ''}
                    onChange={(e) => handleChange('webhookUrl', e.target.value)}
                    className="input w-full font-mono text-xs"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">
                      Slack Bot Token (xoxb-...) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type={showSecrets ? 'text' : 'password'}
                      required
                      placeholder="xoxb-..."
                      value={formData.botToken || ''}
                      onChange={(e) => handleChange('botToken', e.target.value)}
                      className="input w-full font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">
                      Default Channel Name or ID
                    </label>
                    <input
                      type="text"
                      placeholder="#general or C01234567"
                      value={formData.channel || ''}
                      onChange={(e) => handleChange('channel', e.target.value)}
                      className="input w-full font-mono text-xs"
                    />
                  </div>
                </>
              )}
            </>
          )}

          {/* Razorpay Specific Fields */}
          {provider.id === 'razorpay' && (
            <>
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">
                  Razorpay Key ID <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="rzp_test_..."
                  value={formData.keyId || ''}
                  onChange={(e) => handleChange('keyId', e.target.value)}
                  className="input w-full font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">
                  Razorpay Key Secret <span className="text-rose-400">*</span>
                </label>
                <input
                  type={showSecrets ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••••••"
                  value={formData.keySecret || ''}
                  onChange={(e) => handleChange('keySecret', e.target.value)}
                  className="input w-full font-mono text-xs"
                />
              </div>
            </>
          )}

          {/* Generic API Key & Tokens (OpenAI, Gemini, OpenRouter, Twitter, GitHub, etc.) */}
          {!['discord', 'slack', 'razorpay'].includes(provider.id) && (
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">
                {provider.manualField || 'API Key / Secret Token'} <span className="text-rose-400">*</span>
              </label>
              <input
                type={showSecrets ? 'text' : 'password'}
                required
                placeholder={`Paste your ${provider.name} ${provider.manualField || 'API Key'}`}
                value={formData.apiKey || formData.token || ''}
                onChange={(e) => handleChange('apiKey', e.target.value)}
                className="input w-full font-mono text-xs"
              />
            </div>
          )}

          {/* Toggle Password Visibility */}
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] pt-1">
            <button
              type="button"
              onClick={() => setShowSecrets(!showSecrets)}
              className="flex items-center gap-1.5 hover:text-[var(--text-primary)] transition"
            >
              {showSecrets ? <EyeOff size={13} /> : <Eye size={13} />}
              <span>{showSecrets ? 'Hide Values' : 'Reveal Values'}</span>
            </button>
            {provider.docsUrl && (
              <a
                href={provider.docsUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[var(--accent)] hover:underline"
              >
                <span>Get API Key</span>
                <ExternalLink size={11} />
              </a>
            )}
          </div>

          {/* Test Diagnostic Result Banner */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 animate-fadeIn ${
                testResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={16} className="text-rose-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="leading-relaxed">
                <strong>{testResult.success ? 'Success: ' : 'Error: '}</strong>
                {testResult.message}
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {errorMessage}
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing}
              className="button-secondary flex-1 py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-2"
              style={{
                borderRadius: '0.75rem',
                border: '1px solid var(--border)',
                background: 'var(--bg-panel-muted)',
                color: 'var(--text-primary)',
              }}
            >
              {testing ? (
                <>
                  <Loader2 size={14} className="animate-spin text-[var(--accent)]" />
                  <span>Pinging API...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} className="text-[var(--accent)]" />
                  <span>Test Connection</span>
                </>
              )}
            </button>

            <button
              type="submit"
              disabled={saving}
              className="button flex-1 py-2.5 px-4 text-xs font-black flex items-center justify-center gap-2 shadow-lg"
              style={{
                borderRadius: '0.75rem',
                background: 'linear-gradient(135deg, #0284c7 0%, #10b981 100%)',
                color: '#ffffff',
              }}
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin text-white" />
                  <span>Encrypting & Saving...</span>
                </>
              ) : (
                <>
                  <Shield size={14} />
                  <span>Save & Encrypt</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
