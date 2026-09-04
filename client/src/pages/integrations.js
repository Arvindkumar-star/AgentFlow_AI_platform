import { useEffect, useState, useMemo } from 'react';
import { Key, Shield, Sparkles, CheckCircle2, RefreshCw, ExternalLink, Trash2, Info, Lock } from 'lucide-react';
import ProtectedRoute from '../components/ProtectedRoute';
import AppShell from '../components/AppShell';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import BYOKModal from '../components/Integrations/BYOKModal';

// ── Full Integration Registry ────────────────────────────────────────────────
const PROVIDERS = [
  // ── Communication ────────────────────────────────────────────────────────
  { id: 'gmail',         name: 'Gmail',          emoji: '✉️',  color: '#ef4444', category: 'Communication', authType: 'oauth',   desc: 'Send and read operational email.',                 docsUrl: 'https://console.cloud.google.com/', docsLabel: 'Google Cloud Console', manualField: 'Access Token',          envVars: ['GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET'],  setupSteps: ['Go to Google Cloud Console', 'Create OAuth 2.0 credentials', 'Enable Gmail API', 'Paste Client ID & Secret or use BYOK'] },
  { id: 'slack',         name: 'Slack',          emoji: '💬',  color: '#4a154b', category: 'Communication', authType: 'both',    desc: 'Post messages to channels and workspaces via Webhook or Bot Token.', docsUrl: 'https://api.slack.com/apps', docsLabel: 'Slack API Console', manualField: 'Bot Token (xoxb-...) or Webhook URL', envVars: ['SLACK_CLIENT_ID','SLACK_CLIENT_SECRET'], setupSteps: ['Create incoming webhook or Slack Bot', 'Copy Webhook URL or xoxb- token', 'Configure custom BYOK keys'] },
  { id: 'discord',       name: 'Discord',        emoji: '🎮',  color: '#5865f2', category: 'Communication', authType: 'byok',    desc: 'Post bot messages and rich alerts to Discord channels.', docsUrl: 'https://discord.com/developers/applications', docsLabel: 'Discord Dev Portal', manualField: 'Webhook URL or Bot Token', setupSteps: ['Go to Channel Settings → Integrations → Webhooks', 'Copy Webhook URL', 'Paste into BYOK configuration'] },
  { id: 'twilio',        name: 'Twilio',         emoji: '📱',  color: '#f22f46', category: 'Communication', authType: 'byok',    desc: 'Send SMS and WhatsApp messages.',                 docsUrl: 'https://console.twilio.com/', docsLabel: 'Twilio Console', manualField: 'Auth Token',             setupSteps: ['Log into Twilio Console', 'Find Auth Token on dashboard', 'Copy Account SID + Auth Token'] },
  { id: 'zoom',          name: 'Zoom',           emoji: '📹',  color: '#2d8cff', category: 'Communication', authType: 'byok',    desc: 'Create meetings and send in-meeting messages.',   docsUrl: 'https://marketplace.zoom.us/', docsLabel: 'Zoom Marketplace', manualField: 'OAuth Access Token',   setupSteps: ['Go to Zoom Marketplace', 'Build Server-to-Server OAuth app', 'Copy Access Token after authorizing'] },

  // ── Social Media ─────────────────────────────────────────────────────────
  { id: 'twitter',       name: 'Twitter / X',    emoji: '🐦',  color: '#38bdf8', category: 'Social Media',  authType: 'byok',    desc: 'Post tweets and read timeline streams.',          docsUrl: 'https://developer.twitter.com/en/portal/dashboard', docsLabel: 'Twitter Dev Portal', manualField: 'Bearer Token', setupSteps: ['Go to developer.twitter.com', 'Create a Project + App', 'Generate Bearer Token under "Keys and Tokens"', 'Paste it here'] },
  { id: 'linkedin',      name: 'LinkedIn',       emoji: '💼',  color: '#0077b5', category: 'Social Media',  authType: 'oauth',   desc: 'Post to your LinkedIn feed and company pages.',   docsUrl: 'https://www.linkedin.com/developers/apps', docsLabel: 'LinkedIn Dev Portal', manualField: 'Access Token', envVars: ['LINKEDIN_CLIENT_ID','LINKEDIN_CLIENT_SECRET'], setupSteps: ['Go to linkedin.com/developers/apps and create an app', 'Under Products, add "Share on LinkedIn"', 'Under Auth, generate OAuth token or BYOK key'] },
  { id: 'facebook',      name: 'Facebook',       emoji: '👥',  color: '#1877f2', category: 'Social Media',  authType: 'byok',    desc: 'Post to Facebook pages and get insights.',        docsUrl: 'https://developers.facebook.com/', docsLabel: 'Meta for Developers', manualField: 'Page Access Token', setupSteps: ['Go to developers.facebook.com', 'Create an App (Business type)', 'Add Facebook Login product', 'Generate a Page Access Token via Graph API Explorer'] },
  { id: 'instagram',     name: 'Instagram',      emoji: '📸',  color: '#e1306c', category: 'Social Media',  authType: 'byok',    desc: 'Post photos and get account stats.',              docsUrl: 'https://developers.facebook.com/', docsLabel: 'Meta for Developers', manualField: 'Access Token', setupSteps: ['Requires a Facebook App', 'Connect an Instagram Business Account', 'Use Graph API Explorer to get Instagram access token'] },
  { id: 'youtube',       name: 'YouTube',        emoji: '▶️',  color: '#ff0000', category: 'Social Media',  authType: 'byok',    desc: 'Get video stats and manage your channel.',        docsUrl: 'https://console.cloud.google.com/', docsLabel: 'Google Cloud Console', manualField: 'API Key',       setupSteps: ['Go to Google Cloud Console', 'Enable YouTube Data API v3', 'Create API Key credentials', 'Paste the API key here'] },
  { id: 'reddit',        name: 'Reddit',         emoji: '🤖',  color: '#ff4500', category: 'Social Media',  authType: 'byok',    desc: 'Post to subreddits and read feeds.',              docsUrl: 'https://www.reddit.com/prefs/apps', docsLabel: 'Reddit Apps', manualField: 'Access Token',   setupSteps: ['Go to reddit.com/prefs/apps', 'Create a script app', 'Use OAuth2 flow to get Access Token with submit/read scopes'] },
  { id: 'pinterest',     name: 'Pinterest',      emoji: '📌',  color: '#e60023', category: 'Social Media',  authType: 'byok',    desc: 'Create pins and manage boards.',                  docsUrl: 'https://developers.pinterest.com/', docsLabel: 'Pinterest Developers', manualField: 'Access Token', setupSteps: ['Go to developers.pinterest.com', 'Create an app', 'Request pins:read_write scopes', 'Generate Access Token'] },
  { id: 'tiktok',        name: 'TikTok',         emoji: '🎵',  color: '#010101', category: 'Social Media',  authType: 'byok',    desc: 'Post videos and get account analytics.',          docsUrl: 'https://developers.tiktok.com/', docsLabel: 'TikTok for Developers', manualField: 'Access Token', setupSteps: ['Go to developers.tiktok.com', 'Apply for Content Posting API access', 'Create an app and complete OAuth flow'] },

  // ── Productivity ─────────────────────────────────────────────────────────
  { id: 'google-sheets', name: 'Google Sheets',  emoji: '📊',  color: '#34a853', category: 'Productivity',  authType: 'oauth',   desc: 'Append rows and read ranges from spreadsheets.', docsUrl: 'https://console.cloud.google.com/', docsLabel: 'Google Cloud Console', manualField: 'Access Token', envVars: ['GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET'], setupSteps: ['Google OAuth already configured if Gmail is set up', 'Connect via OAuth or paste custom access token'] },
  { id: 'notion',        name: 'Notion',         emoji: '📝',  color: '#ffffff', category: 'Productivity',  authType: 'byok',    desc: 'Read and write Notion databases and pages.',      docsUrl: 'https://www.notion.so/my-integrations', docsLabel: 'Notion Integrations', manualField: 'Integration Token', setupSteps: ['Go to notion.so/my-integrations', 'Create a new integration', 'Copy the Internal Integration Token', 'Share your Notion pages with the integration'] },
  { id: 'airtable',      name: 'Airtable',       emoji: '⬡',   color: '#fbbf24', category: 'Productivity',  authType: 'byok',    desc: 'Append and query Airtable base records.',         docsUrl: 'https://airtable.com/create/tokens', docsLabel: 'Airtable Tokens', manualField: 'Personal Access Token', setupSteps: ['Go to airtable.com/create/tokens', 'Create a token with data.records:write scope', 'Select the bases you want to access'] },
  { id: 'trello',        name: 'Trello',         emoji: '📋',  color: '#0052cc', category: 'Productivity',  authType: 'byok',    desc: 'Create and move cards across Trello boards.',     docsUrl: 'https://trello.com/app-key', docsLabel: 'Trello App Key', manualField: 'API Key + Token', setupSteps: ['Go to trello.com/app-key', 'Copy your API Key', 'Click "Token" link on same page to generate a Token', 'Paste both as: key:token'] },
  { id: 'asana',         name: 'Asana',          emoji: '✅',  color: '#f06a6a', category: 'Productivity',  authType: 'byok',    desc: 'Create tasks and update project status.',         docsUrl: 'https://app.asana.com/0/my-apps', docsLabel: 'Asana My Apps', manualField: 'Personal Access Token', setupSteps: ['Go to app.asana.com/0/my-apps', 'Create a new Personal Access Token', 'Give it a name and copy the token'] },
  { id: 'calendly',      name: 'Calendly',       emoji: '📅',  color: '#006bff', category: 'Productivity',  authType: 'byok',    desc: 'Trigger on new bookings and manage events.',      docsUrl: 'https://developer.calendly.com/', docsLabel: 'Calendly Developer', manualField: 'Personal Access Token', setupSteps: ['Go to developer.calendly.com', 'Navigate to Personal Access Tokens', 'Generate a new token'] },
  { id: 'google-drive',  name: 'Google Drive',   emoji: '💾',  color: '#1fa463', category: 'Productivity',  authType: 'byok',    desc: 'Upload, download, and manage Drive files.',       docsUrl: 'https://console.cloud.google.com/', docsLabel: 'Google Cloud Console', manualField: 'Access Token', setupSteps: ['Enable Google Drive API in Google Cloud Console', 'Generate OAuth 2.0 token with drive.file scope', 'Paste the access token here'] },
  { id: 'dropbox',       name: 'Dropbox',        emoji: '📦',  color: '#0061ff', category: 'Productivity',  authType: 'byok',    desc: 'Upload and download files from Dropbox.',         docsUrl: 'https://www.dropbox.com/developers/apps', docsLabel: 'Dropbox Apps', manualField: 'Access Token', setupSteps: ['Go to dropbox.com/developers/apps', 'Create a Scoped Access app', 'Generate an Access Token under Permissions'] },

  // ── AI & LLMs ─────────────────────────────────────────────────────────────
  { id: 'openrouter',    name: 'OpenRouter',     emoji: '🤖',  color: '#c084fc', category: 'AI',            authType: 'byok',    desc: 'Access 100+ AI models via a single custom API key.', docsUrl: 'https://openrouter.ai/keys', docsLabel: 'OpenRouter Dashboard', manualField: 'API Key', setupSteps: ['Go to openrouter.ai/keys', 'Create a new API key', 'Optionally set a usage limit', 'Paste the key in BYOK modal'] },
  { id: 'gemini',        name: 'Google Gemini',  emoji: '✨',  color: '#67e8f9', category: 'AI',            authType: 'byok',    desc: 'Generate content and workflows with Gemini AI.',  docsUrl: 'https://aistudio.google.com/app/apikey', docsLabel: 'Google AI Studio', manualField: 'API Key', setupSteps: ['Go to aistudio.google.com', 'Click "Get API key"', 'Create key in a project', 'Paste in BYOK modal'] },

  // ── Marketing ────────────────────────────────────────────────────────────
  { id: 'mailchimp',     name: 'Mailchimp',      emoji: '🐒',  color: '#ffe01b', category: 'Marketing',     authType: 'byok',    desc: 'Manage email campaigns and subscriber lists.',    docsUrl: 'https://admin.mailchimp.com/account/api/', docsLabel: 'Mailchimp API Keys', manualField: 'API Key', setupSteps: ['Log into Mailchimp', 'Go to Account → Extras → API keys', 'Create a new API key'] },
  { id: 'sendgrid',      name: 'SendGrid',       emoji: '📨',  color: '#1a82e2', category: 'Marketing',     authType: 'byok',    desc: 'Send transactional and marketing emails.',        docsUrl: 'https://app.sendgrid.com/settings/api_keys', docsLabel: 'SendGrid API Keys', manualField: 'API Key', setupSteps: ['Go to SendGrid Settings → API Keys', 'Create an API Key with Mail Send permission'] },

  // ── E-commerce ───────────────────────────────────────────────────────────
  { id: 'shopify',       name: 'Shopify',        emoji: '🛍️',  color: '#96bf48', category: 'E-commerce',    authType: 'byok',    desc: 'Sync orders, products, and customer data.',       docsUrl: 'https://shopify.dev/docs/apps/auth/admin-app-access-tokens', docsLabel: 'Shopify Dev Docs', manualField: 'Admin API Token', setupSteps: ['Go to your Shopify Admin', 'Settings → Apps → Develop apps', 'Create an app and install it', 'Copy the Admin API access token'] },

  // ── Payments & Financial Risk ─────────────────────────────────────────────
  { id: 'razorpay',      name: 'Razorpay',       emoji: '💳',  color: '#38bdf8', category: 'Payments',      authType: 'byok',    desc: 'Automated vendor payouts, instant disbursements & OTP approval.', docsUrl: 'https://dashboard.razorpay.com/#/access/api_keys', docsLabel: 'Razorpay Dashboard', manualField: 'Key ID & Secret', envVars: ['RAZORPAY_KEY_ID','RAZORPAY_KEY_SECRET'], setupSteps: ['Go to dashboard.razorpay.com', 'Navigate to Settings → API Keys', 'Generate Key ID & Key Secret', 'Supply in BYOK modal with test verification'] },
  { id: 'agentguard',    name: 'AgentGuard ZK',  emoji: '🛡️',  color: '#10b981', category: 'Payments',      authType: 'builtin', desc: 'Zero-Knowledge Groth16 spending verification & whitelist guardrail.', docsUrl: 'https://snarkjs.org', docsLabel: 'AgentGuard ZK Specs', manualField: 'Built-in BN128 Circuit', setupSteps: ['Powered by Circom Groth16 Zero-Knowledge circuits', 'Guarantees vendor payments never exceed cryptographic budget limits', 'Active out-of-the-box — no keys required'] },
  { id: 'stripe',        name: 'Stripe',         emoji: '💳',  color: '#635bff', category: 'Payments',      authType: 'byok',    desc: 'React to payment events and create charges.',     docsUrl: 'https://dashboard.stripe.com/apikeys', docsLabel: 'Stripe Dashboard', manualField: 'Secret Key', setupSteps: ['Go to Stripe Dashboard → Developers → API Keys', 'Copy the Secret Key (starts with sk_)'] },

  // ── CRM & Dev ────────────────────────────────────────────────────────────
  { id: 'hubspot',       name: 'HubSpot',        emoji: '🔶',  color: '#ff7a59', category: 'CRM',           authType: 'byok',    desc: 'Create and update CRM contacts and deals.',       docsUrl: 'https://app.hubspot.com/private-apps', docsLabel: 'HubSpot App Settings', manualField: 'Private App Token', setupSteps: ['Go to HubSpot → Settings → Integrations → Private Apps', 'Create a private app with CRM permissions', 'Copy the access token'] },
  { id: 'github',        name: 'GitHub',         emoji: '🐙',  color: '#e5edf8', category: 'Development',   authType: 'byok',    desc: 'Trigger on PRs, issues, commits, and releases.',  docsUrl: 'https://github.com/settings/tokens', docsLabel: 'GitHub Settings', manualField: 'Personal Access Token', setupSteps: ['Go to GitHub → Settings → Developer Settings → Personal Access Tokens', 'Generate a Fine-grained token with repo permissions'] },
  { id: 'jira',          name: 'Jira',           emoji: 'J',   color: '#0052cc', category: 'Development',   authType: 'byok',    desc: 'Create and update issues in Jira projects.',      docsUrl: 'https://id.atlassian.com/manage-profile/security/api-tokens', docsLabel: 'Atlassian API Tokens', manualField: 'API Token', setupSteps: ['Go to id.atlassian.com/manage-profile/security/api-tokens', 'Create a new API token', 'Use as: email:token in base64'] },
  { id: 'webhook',       name: 'Webhook',        emoji: '⚡',  color: '#38bdf8', category: 'Development',   authType: 'byok',    desc: 'Trigger workflows from any external HTTP source.', docsUrl: null, manualField: 'Secret (optional)', setupSteps: ['No setup needed', 'Optionally add a secret to verify incoming requests'] },
];

const CATEGORIES = ['All', 'Payments', 'Communication', 'AI', 'Social Media', 'Productivity', 'Marketing', 'E-commerce', 'CRM', 'Development'];

// ── Integration Card ─────────────────────────────────────────────────────────
function IntegrationCard({ provider, statusInfo, oauthConfigured, onOpenBYOK, onOAuthConnect, onDisconnect }) {
  const isConnected = statusInfo?.isConnected || false;
  const isBYOK = statusInfo?.isBYOK || false;
  const maskedId = statusInfo?.maskedIdentifier || null;
  const canOAuth = provider.authType === 'oauth' && oauthConfigured;

  return (
    <div
      className="card flex flex-col justify-between p-5 rounded-2xl border transition-all duration-200 relative group"
      style={{
        background: 'var(--bg-panel)',
        borderColor: isConnected ? `${provider.color}55` : 'var(--border)',
        boxShadow: isConnected ? `0 0 20px ${provider.color}15, var(--shadow)` : 'var(--shadow)',
      }}
    >
      {/* Top Accent Strip */}
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl transition-all"
        style={{
          background: isConnected
            ? `linear-gradient(90deg, ${provider.color}, transparent)`
            : 'transparent',
        }}
      />

      {/* Top Header: Logo + Title + Status Pill */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <span
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 shadow-sm"
              style={{
                background: `${provider.color}18`,
                border: `1px solid ${provider.color}35`,
              }}
            >
              {provider.emoji}
            </span>
            <div>
              <h4 className="font-bold text-sm text-[var(--text-primary)] leading-tight">
                {provider.name}
              </h4>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-faint)]">
                {provider.category}
              </span>
            </div>
          </div>

          {/* Status Badge */}
          <span
            className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 border flex-shrink-0"
            style={{
              background: isConnected
                ? (isBYOK ? 'rgba(16, 185, 129, 0.12)' : 'rgba(56, 189, 248, 0.12)')
                : 'var(--bg-panel-muted)',
              color: isConnected
                ? (isBYOK ? '#10b981' : '#38bdf8')
                : 'var(--text-faint)',
              borderColor: isConnected
                ? (isBYOK ? 'rgba(16, 185, 129, 0.3)' : 'rgba(56, 189, 248, 0.3)')
                : 'var(--border)',
            }}
          >
            {isConnected ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: isBYOK ? '#10b981' : '#38bdf8' }} />
                <span>{isBYOK ? 'BYOK Connected' : 'OAuth Active'}</span>
              </>
            ) : (
              <span>Unconfigured</span>
            )}
          </span>
        </div>

        {/* Description */}
        <p className="text-xs text-[var(--text-muted)] leading-relaxed line-clamp-2 mb-3">
          {provider.desc}
        </p>
      </div>

      {/* Footer Info & Actions */}
      <div className="space-y-3 pt-2 border-t border-[var(--border)]">
        {/* Masked Key Preview if BYOK */}
        {isBYOK && maskedId && (
          <div className="flex items-center justify-between text-[11px] px-2.5 py-1 rounded-lg bg-[var(--bg-panel-muted)] border border-[var(--border)] font-mono text-emerald-400">
            <span className="flex items-center gap-1">
              <Lock size={10} />
              <span>Key:</span>
            </span>
            <span className="truncate max-w-[170px] font-semibold">{maskedId}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {provider.id !== 'agentguard' && (
            <button
              type="button"
              onClick={() => onOpenBYOK(provider)}
              className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition border card-hover"
              style={{
                background: isConnected ? `${provider.color}15` : 'var(--bg-panel-muted)',
                borderColor: isConnected ? `${provider.color}40` : 'var(--border)',
                color: isConnected ? provider.color : 'var(--text-primary)',
              }}
            >
              <Key size={13} />
              <span>{isConnected ? 'Manage Key / Connect' : 'Connect & Configure'}</span>
            </button>
          )}

          {/* Disconnect Button if connected */}
          {isConnected && provider.id !== 'agentguard' && (
            <button
              type="button"
              onClick={() => onDisconnect(provider.id)}
              className="py-2.5 px-3 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition flex items-center justify-center flex-shrink-0"
              title="Disconnect"
            >
              <Trash2 size={13} />
            </button>
          )}

          {/* AgentGuard Special Builtin Badge */}
          {provider.id === 'agentguard' && (
            <div className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-center text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center gap-1.5">
              <Shield size={13} />
              <span>Groth16 Engine Active</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Integrations Page ────────────────────────────────────────────────────
export default function Integrations() {
  const { token } = useAuthStore();
  const [statusMap, setStatusMap] = useState({});
  const [oauthConfig, setOauthConfig] = useState({});
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedBYOK, setSelectedBYOK] = useState(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  const loadStatus = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/integrations/status');
      const map = {};
      (data.status || []).forEach((s) => {
        map[s.provider] = s;
      });
      setStatusMap(map);
    } catch (_) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
    fetch(`${API_BASE}/integrations/config`)
      .then((r) => r.json())
      .then((d) => setOauthConfig(d.configured || {}))
      .catch(() => {});

    const params = new URLSearchParams(window.location.search);
    const connected = params.get('connected');
    const errMsg = params.get('error');
    if (connected) {
      setNotice(`✓ ${connected} connected via OAuth!`);
      setTimeout(() => setNotice(''), 5000);
      loadStatus();
    }
    if (errMsg) {
      setError(decodeURIComponent(errMsg));
    }
    if (connected || errMsg) {
      window.history.replaceState({}, '', '/integrations');
    }
  }, []);

  const handleOAuthConnect = (provider) => {
    window.location.href = `${API_BASE}/integrations/oauth/${provider.id}/start?token=${encodeURIComponent(token)}&origin=${encodeURIComponent(window.location.origin)}`;
  };

  const handleDisconnect = async (providerId) => {
    if (!confirm(`Are you sure you want to disconnect ${providerId}?`)) return;
    try {
      await api.delete(`/integrations/${providerId}/byok`);
      setNotice(`✓ ${providerId} disconnected.`);
      setTimeout(() => setNotice(''), 4000);
      loadStatus();
    } catch (err) {
      setError('Failed to disconnect');
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return PROVIDERS.filter((p) => {
      const matchCat =
        activeCategory === 'All' ||
        p.category === activeCategory ||
        (activeCategory === 'Payments' && (p.category === 'Payments' || p.category === 'Finance'));
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.desc.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [search, activeCategory]);

  const connectedCount = PROVIDERS.filter((p) => statusMap[p.id]?.isConnected).length;
  const byokCount = PROVIDERS.filter((p) => statusMap[p.id]?.isBYOK).length;

  return (
    <ProtectedRoute>
      <AppShell title="Integrations & BYOK Keys">
        <div className="space-y-6 max-w-7xl mx-auto">
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide bg-sky-500/10 text-sky-400 border border-sky-500/30 mb-2">
                <Shield size={12} />
                <span>Bring-Your-Own-Key (BYOK) Encryption Active</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--text-primary)]">
                Integrations &amp; Custom API Keys
              </h1>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
                Connect your operational tools via personal webhooks, bot tokens, and API keys with AES-256 encryption at rest.
              </p>
            </div>

            {/* Quick Stats Badges */}
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-[var(--bg-panel)] border border-[var(--border)] shadow-sm text-center min-w-[100px]">
                <div className="text-xs text-[var(--text-muted)] font-bold">Total Active</div>
                <div className="text-lg font-black text-sky-400">{connectedCount}</div>
              </div>
              <div className="p-3 rounded-2xl bg-[var(--bg-panel)] border border-[var(--border)] shadow-sm text-center min-w-[100px]">
                <div className="text-xs text-[var(--text-muted)] font-bold">BYOK Keys</div>
                <div className="text-lg font-black text-emerald-400">{byokCount}</div>
              </div>
            </div>
          </div>

          {/* Feedback Notices */}
          {notice && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>{notice}</span>
            </div>
          )}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError('')} className="underline">Dismiss</button>
            </div>
          )}

          {/* Search Bar & Category Pills */}
          <div className="p-4 rounded-2xl bg-[var(--bg-panel)] border border-[var(--border)] shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-faint)] text-xs">
                  🔍
                </span>
                <input
                  type="text"
                  placeholder="Search 30+ integrations (Discord, Slack, Razorpay...)"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input w-full pl-9 text-xs"
                />
              </div>

              <button
                type="button"
                onClick={loadStatus}
                disabled={loading}
                className="button-secondary py-2 px-3 text-xs font-bold flex items-center gap-1.5 self-end sm:self-auto"
              >
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                <span>Refresh Status</span>
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`py-1.5 px-3 rounded-xl font-bold whitespace-nowrap transition ${
                    activeCategory === cat
                      ? 'bg-[var(--accent)] text-slate-950 shadow-sm'
                      : 'bg-[var(--bg-panel-muted)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border)]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Integrations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((provider) => (
              <IntegrationCard
                key={provider.id}
                provider={provider}
                statusInfo={statusMap[provider.id]}
                oauthConfigured={oauthConfig[provider.id]}
                onOpenBYOK={(p) => setSelectedBYOK(p)}
                onOAuthConnect={handleOAuthConnect}
                onDisconnect={handleDisconnect}
              />
            ))}
          </div>
        </div>

        {/* BYOK Configuration Modal */}
        {selectedBYOK && (
          <BYOKModal
            provider={selectedBYOK}
            currentStatus={statusMap[selectedBYOK.id]}
            onClose={() => setSelectedBYOK(null)}
            onUpdated={() => {
              loadStatus();
              setNotice(`✓ ${selectedBYOK.name} BYOK credentials updated and encrypted!`);
              setTimeout(() => setNotice(''), 4000);
            }}
          />
        )}
      </AppShell>
    </ProtectedRoute>
  );
}
