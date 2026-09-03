import { useEffect, useState, useMemo } from 'react';
import ProtectedRoute from '../components/ProtectedRoute';
import AppShell, { PageHeading } from '../components/AppShell';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

// ── Full Integration Registry ────────────────────────────────────────────────
const PROVIDERS = [
  // ── Communication ────────────────────────────────────────────────────────
  { id: 'gmail',         name: 'Gmail',          emoji: '✉️',  color: '#ef4444', category: 'Communication', authType: 'oauth',   desc: 'Send and read operational email.',                 docsUrl: 'https://console.cloud.google.com/', docsLabel: 'Google Cloud Console', manualField: 'Access Token',          envVars: ['GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET'],  setupSteps: ['Go to Google Cloud Console', 'Create OAuth 2.0 credentials', 'Enable Gmail API', 'Paste Client ID & Secret in .env'] },
  { id: 'slack',         name: 'Slack',          emoji: '💬',  color: '#4a154b', category: 'Communication', authType: 'oauth',   desc: 'Post messages to channels and workspaces.',       docsUrl: 'https://api.slack.com/apps', docsLabel: 'Slack API Console', manualField: 'Bot Token',              envVars: ['SLACK_CLIENT_ID','SLACK_CLIENT_SECRET'],    setupSteps: ['Go to api.slack.com/apps', 'Create a new app', 'Add chat:write scope', 'Install to workspace & copy Bot Token'] },
  { id: 'discord',       name: 'Discord',        emoji: '🎮',  color: '#5865f2', category: 'Communication', authType: 'manual',  desc: 'Post bot messages to Discord channels.',          docsUrl: 'https://discord.com/developers/applications', docsLabel: 'Discord Dev Portal', manualField: 'Bot Token', setupSteps: ['Go to Discord Developer Portal', 'Create New Application → Bot', 'Enable MESSAGE CONTENT intent', 'Copy the Bot Token'] },
  { id: 'twilio',        name: 'Twilio',         emoji: '📱',  color: '#f22f46', category: 'Communication', authType: 'manual',  desc: 'Send SMS and WhatsApp messages.',                 docsUrl: 'https://console.twilio.com/', docsLabel: 'Twilio Console', manualField: 'Auth Token',             setupSteps: ['Log into Twilio Console', 'Find Auth Token on dashboard', 'Copy Account SID + Auth Token'] },
  { id: 'zoom',          name: 'Zoom',           emoji: '📹',  color: '#2d8cff', category: 'Communication', authType: 'manual',  desc: 'Create meetings and send in-meeting messages.',   docsUrl: 'https://marketplace.zoom.us/', docsLabel: 'Zoom Marketplace', manualField: 'OAuth Access Token',   setupSteps: ['Go to Zoom Marketplace', 'Build Server-to-Server OAuth app', 'Copy Access Token after authorizing'] },

  // ── Social Media ─────────────────────────────────────────────────────────
  { id: 'twitter',       name: 'Twitter / X',    emoji: '🐦',  color: '#000000', category: 'Social Media',  authType: 'manual',  desc: 'Post tweets and read your timeline.',             docsUrl: 'https://developer.twitter.com/en/portal/dashboard', docsLabel: 'Twitter Dev Portal', manualField: 'Bearer Token', setupSteps: ['Go to developer.twitter.com', 'Create a Project + App', 'Generate Bearer Token under "Keys and Tokens"', 'Paste it here'] },
  { id: 'linkedin',      name: 'LinkedIn',       emoji: '💼',  color: '#0077b5', category: 'Social Media',  authType: 'oauth',   desc: 'Post to your LinkedIn feed and company pages.',   docsUrl: 'https://www.linkedin.com/developers/apps', docsLabel: 'LinkedIn Dev Portal', manualField: 'Access Token', envVars: ['LINKEDIN_CLIENT_ID','LINKEDIN_CLIENT_SECRET'], setupSteps: ['Go to linkedin.com/developers/apps and create an app', 'Under Products, add "Share on LinkedIn" & "Sign In with LinkedIn using OpenID Connect"', 'Under Auth → OAuth 2.0 settings, add redirect URI: http://localhost:5000/api/integrations/oauth/linkedin/callback', 'Paste Client ID & Client Secret in server/.env'] },
  { id: 'facebook',      name: 'Facebook',       emoji: '👥',  color: '#1877f2', category: 'Social Media',  authType: 'manual',  desc: 'Post to Facebook pages and get insights.',        docsUrl: 'https://developers.facebook.com/', docsLabel: 'Meta for Developers', manualField: 'Page Access Token', setupSteps: ['Go to developers.facebook.com', 'Create an App (Business type)', 'Add Facebook Login product', 'Generate a Page Access Token via Graph API Explorer'] },
  { id: 'instagram',     name: 'Instagram',      emoji: '📸',  color: '#e1306c', category: 'Social Media',  authType: 'manual',  desc: 'Post photos and get account stats.',              docsUrl: 'https://developers.facebook.com/', docsLabel: 'Meta for Developers', manualField: 'Access Token', setupSteps: ['Requires a Facebook App (same as Facebook)', 'Connect an Instagram Business Account to a Facebook Page', 'Use Graph API Explorer to get Instagram access token'] },
  { id: 'youtube',       name: 'YouTube',        emoji: '▶️',  color: '#ff0000', category: 'Social Media',  authType: 'manual',  desc: 'Get video stats and manage your channel.',        docsUrl: 'https://console.cloud.google.com/', docsLabel: 'Google Cloud Console', manualField: 'API Key',       setupSteps: ['Go to Google Cloud Console', 'Enable YouTube Data API v3', 'Create API Key credentials', 'Paste the API key here'] },
  { id: 'reddit',        name: 'Reddit',         emoji: '🤖',  color: '#ff4500', category: 'Social Media',  authType: 'manual',  desc: 'Post to subreddits and read feeds.',              docsUrl: 'https://www.reddit.com/prefs/apps', docsLabel: 'Reddit Apps', manualField: 'Access Token',   setupSteps: ['Go to reddit.com/prefs/apps', 'Create a script app', 'Use OAuth2 flow to get Access Token with submit/read scopes'] },
  { id: 'pinterest',     name: 'Pinterest',      emoji: '📌',  color: '#e60023', category: 'Social Media',  authType: 'manual',  desc: 'Create pins and manage boards.',                  docsUrl: 'https://developers.pinterest.com/', docsLabel: 'Pinterest Developers', manualField: 'Access Token', setupSteps: ['Go to developers.pinterest.com', 'Create an app', 'Request pins:read_write + boards:read scopes', 'Generate Access Token'] },
  { id: 'tiktok',        name: 'TikTok',         emoji: '🎵',  color: '#010101', category: 'Social Media',  authType: 'manual',  desc: 'Post videos and get account analytics.',          docsUrl: 'https://developers.tiktok.com/', docsLabel: 'TikTok for Developers', manualField: 'Access Token', comingSoon: false, setupSteps: ['Go to developers.tiktok.com', 'Apply for Content Posting API access', 'Create an app and complete OAuth flow', 'Paste your Access Token'] },

  // ── Productivity ─────────────────────────────────────────────────────────
  { id: 'google-sheets', name: 'Google Sheets',  emoji: '📊',  color: '#34a853', category: 'Productivity',  authType: 'oauth',   desc: 'Append rows and read ranges from spreadsheets.', docsUrl: 'https://console.cloud.google.com/', docsLabel: 'Google Cloud Console', manualField: 'Access Token', envVars: ['GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET'], setupSteps: ['Google OAuth already configured if Gmail is set up', 'Just click Connect via OAuth'] },
  { id: 'notion',        name: 'Notion',         emoji: '📝',  color: '#ffffff', category: 'Productivity',  authType: 'manual',  desc: 'Read and write Notion databases and pages.',      docsUrl: 'https://www.notion.so/my-integrations', docsLabel: 'Notion Integrations', manualField: 'Integration Token', setupSteps: ['Go to notion.so/my-integrations', 'Create a new integration', 'Copy the Internal Integration Token', 'Share your Notion pages with the integration'] },
  { id: 'airtable',      name: 'Airtable',       emoji: '⬡',   color: '#fbbf24', category: 'Productivity',  authType: 'manual',  desc: 'Append and query Airtable base records.',         docsUrl: 'https://airtable.com/create/tokens', docsLabel: 'Airtable Tokens', manualField: 'Personal Access Token', setupSteps: ['Go to airtable.com/create/tokens', 'Create a token with data.records:write scope', 'Select the bases you want to access'] },
  { id: 'trello',        name: 'Trello',         emoji: '📋',  color: '#0052cc', category: 'Productivity',  authType: 'manual',  desc: 'Create and move cards across Trello boards.',     docsUrl: 'https://trello.com/app-key', docsLabel: 'Trello App Key', manualField: 'API Key + Token', setupSteps: ['Go to trello.com/app-key', 'Copy your API Key', 'Click "Token" link on same page to generate a Token', 'Paste both as: key:token'] },
  { id: 'asana',         name: 'Asana',          emoji: '✅',  color: '#f06a6a', category: 'Productivity',  authType: 'manual',  desc: 'Create tasks and update project status.',         docsUrl: 'https://app.asana.com/0/my-apps', docsLabel: 'Asana My Apps', manualField: 'Personal Access Token', setupSteps: ['Go to app.asana.com/0/my-apps', 'Create a new Personal Access Token', 'Give it a name and copy the token'] },
  { id: 'calendly',      name: 'Calendly',       emoji: '📅',  color: '#006bff', category: 'Productivity',  authType: 'manual',  desc: 'Trigger on new bookings and manage events.',      docsUrl: 'https://developer.calendly.com/', docsLabel: 'Calendly Developer', manualField: 'Personal Access Token', setupSteps: ['Go to developer.calendly.com', 'Navigate to Personal Access Tokens', 'Generate a new token'] },
  { id: 'google-drive',  name: 'Google Drive',   emoji: '💾',  color: '#1fa463', category: 'Productivity',  authType: 'manual',  desc: 'Upload, download, and manage Drive files.',       docsUrl: 'https://console.cloud.google.com/', docsLabel: 'Google Cloud Console', manualField: 'Access Token', setupSteps: ['Enable Google Drive API in Google Cloud Console', 'Generate OAuth 2.0 token with drive.file scope', 'Paste the access token here'] },
  { id: 'dropbox',       name: 'Dropbox',        emoji: '📦',  color: '#0061ff', category: 'Productivity',  authType: 'manual',  desc: 'Upload and download files from Dropbox.',         docsUrl: 'https://www.dropbox.com/developers/apps', docsLabel: 'Dropbox Apps', manualField: 'Access Token', setupSteps: ['Go to dropbox.com/developers/apps', 'Create a Scoped Access app', 'Generate an Access Token under Permissions'] },

  // ── AI ───────────────────────────────────────────────────────────────────
  { id: 'openrouter',    name: 'OpenRouter',     emoji: '🤖',  color: '#c084fc', category: 'AI',            authType: 'manual',  desc: 'Access 100+ AI models via a single API key.',     docsUrl: 'https://openrouter.ai/keys', docsLabel: 'OpenRouter Dashboard', manualField: 'API Key', setupSteps: ['Go to openrouter.ai/keys', 'Create a new API key', 'Optionally set a usage limit', 'Paste the key here'] },
  { id: 'gemini',        name: 'Google Gemini',  emoji: '✨',  color: '#67e8f9', category: 'AI',            authType: 'manual',  desc: 'Generate content and workflows with Gemini AI.',  docsUrl: 'https://aistudio.google.com/app/apikey', docsLabel: 'Google AI Studio', manualField: 'API Key', setupSteps: ['Go to aistudio.google.com', 'Click "Get API key"', 'Create key in a project', 'Paste it here'] },

  // ── Marketing ────────────────────────────────────────────────────────────
  { id: 'mailchimp',     name: 'Mailchimp',      emoji: '🐒',  color: '#ffe01b', category: 'Marketing',     authType: 'manual',  desc: 'Manage email campaigns and subscriber lists.',    docsUrl: 'https://admin.mailchimp.com/account/api/', docsLabel: 'Mailchimp API Keys', manualField: 'API Key', setupSteps: ['Log into Mailchimp', 'Go to Account → Extras → API keys', 'Create a new API key'] },
  { id: 'sendgrid',      name: 'SendGrid',       emoji: '📨',  color: '#1a82e2', category: 'Marketing',     authType: 'manual',  desc: 'Send transactional and marketing emails.',        docsUrl: 'https://app.sendgrid.com/settings/api_keys', docsLabel: 'SendGrid API Keys', manualField: 'API Key', setupSteps: ['Go to SendGrid Settings → API Keys', 'Create an API Key with Mail Send permission'] },

  // ── E-commerce ───────────────────────────────────────────────────────────
  { id: 'shopify',       name: 'Shopify',        emoji: '🛍️',  color: '#96bf48', category: 'E-commerce',    authType: 'manual',  desc: 'Sync orders, products, and customer data.',       docsUrl: 'https://shopify.dev/docs/apps/auth/admin-app-access-tokens', docsLabel: 'Shopify Dev Docs', manualField: 'Admin API Token', setupSteps: ['Go to your Shopify Admin', 'Settings → Apps → Develop apps', 'Create an app and install it', 'Copy the Admin API access token'] },

  // ── Payments & Financial Risk ─────────────────────────────────────────────
  { id: 'razorpay',      name: 'Razorpay',       emoji: '💳',  color: '#38bdf8', category: 'Payments',      authType: 'manual',  desc: 'Automated vendor payouts, instant disbursements & OTP approval.', docsUrl: 'https://dashboard.razorpay.com/#/access/api_keys', docsLabel: 'Razorpay Dashboard', manualField: 'Key ID:Key Secret', envVars: ['RAZORPAY_KEY_ID','RAZORPAY_KEY_SECRET'], setupSteps: ['Go to dashboard.razorpay.com', 'Navigate to Settings → API Keys', 'Generate Key ID & Key Secret', 'Paste in server/.env or paste here as key_id:key_secret'] },
  { id: 'agentguard',    name: 'AgentGuard ZK',  emoji: '🛡️',  color: '#22d3ee', category: 'Payments',      authType: 'manual',  desc: 'Zero-Knowledge spending verification & merchant whitelist guardrail.', docsUrl: 'https://snarkjs.org', docsLabel: 'AgentGuard ZK Specs', manualField: 'Private Auth Secret (optional)', setupSteps: ['Powered by Circom Groth16 Zero-Knowledge circuits', 'Guarantees vendor payments never exceed cryptographic budget limits', 'Ready out-of-the-box — no external API key required'] },
  { id: 'stripe',        name: 'Stripe',         emoji: '💳',  color: '#635bff', category: 'Payments',      authType: 'manual',  desc: 'React to payment events and create charges.',     docsUrl: 'https://dashboard.stripe.com/apikeys', docsLabel: 'Stripe Dashboard', manualField: 'Secret Key', setupSteps: ['Go to Stripe Dashboard → Developers → API Keys', 'Copy the Secret Key (starts with sk_)'] },

  // ── CRM ──────────────────────────────────────────────────────────────────
  { id: 'hubspot',       name: 'HubSpot',        emoji: '🔶',  color: '#ff7a59', category: 'CRM',           authType: 'manual',  desc: 'Create and update CRM contacts and deals.',       docsUrl: 'https://app.hubspot.com/private-apps', docsLabel: 'HubSpot App Settings', manualField: 'Private App Token', setupSteps: ['Go to HubSpot → Settings → Integrations → Private Apps', 'Create a private app with CRM permissions', 'Copy the access token'] },

  // ── Development ──────────────────────────────────────────────────────────
  { id: 'github',        name: 'GitHub',         emoji: '🐙',  color: '#e5edf8', category: 'Development',   authType: 'manual',  desc: 'Trigger on PRs, issues, commits, and releases.',  docsUrl: 'https://github.com/settings/tokens', docsLabel: 'GitHub Settings', manualField: 'Personal Access Token', setupSteps: ['Go to GitHub → Settings → Developer Settings → Personal Access Tokens', 'Generate a Fine-grained token with repo permissions'] },
  { id: 'jira',          name: 'Jira',           emoji: 'J',   color: '#0052cc', category: 'Development',   authType: 'manual',  desc: 'Create and update issues in Jira projects.',      docsUrl: 'https://id.atlassian.com/manage-profile/security/api-tokens', docsLabel: 'Atlassian API Tokens', manualField: 'API Token', setupSteps: ['Go to id.atlassian.com/manage-profile/security/api-tokens', 'Create a new API token', 'Use as: email:token in base64'] },
  { id: 'webhook',       name: 'Webhook',        emoji: '⚡',  color: '#38bdf8', category: 'Development',   authType: 'manual',  desc: 'Trigger workflows from any external HTTP source.', docsUrl: null, manualField: 'Secret (optional)', setupSteps: ['No setup needed', 'Optionally add a secret to verify incoming requests'] },
];

const CATEGORIES = ['All', 'Payments', 'Social Media', 'Communication', 'Productivity', 'AI', 'Marketing', 'E-commerce', 'Finance', 'CRM', 'Development'];

// ── Setup Guide Modal ────────────────────────────────────────────────────────
function SetupModal({ provider, onClose, onConnect }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--bg-panel)', border: `1px solid ${provider.color}40`,
        borderRadius: '1.25rem', padding: '2rem', width: '100%', maxWidth: '500px',
        boxShadow: `0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px ${provider.color}20`,
        animation: 'modalIn 0.2s ease',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <span style={{
            width: 52, height: 52, borderRadius: '1rem', flexShrink: 0,
            background: `${provider.color}20`, border: `1px solid ${provider.color}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24,
          }}>{provider.emoji}</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Connect {provider.name}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>{provider.desc}</div>
          </div>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', fontSize: 20, lineHeight: 1, padding: '4px' }}>✕</button>
        </div>

        {/* Setup steps */}
        {provider.setupSteps?.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-faint)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              Setup Steps
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {provider.setupSteps.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    background: `${provider.color}20`, border: `1px solid ${provider.color}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, color: provider.color,
                  }}>{i + 1}</span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.5, paddingTop: 2 }}>{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Docs link */}
        {provider.docsUrl && (
          <a href={provider.docsUrl} target="_blank" rel="noreferrer" style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.625rem 1rem', borderRadius: '0.75rem', marginBottom: '1rem',
            background: 'var(--bg-panel-muted)', border: '1px solid var(--border)',
            fontSize: '0.8rem', color: 'var(--accent)', textDecoration: 'none',
            transition: 'border-color 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            🔗 Open {provider.docsLabel || 'Developer Docs'} ↗
          </a>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '0.625rem' }}>
          <button className="button-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="button" style={{ flex: 2, background: provider.color, color: '#fff' }} onClick={() => { onClose(); onConnect(provider); }}>
            Got my token — Connect ↗
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Credential Modal ─────────────────────────────────────────────────────────
function CredentialModal({ provider, isOAuthUnconfigured, onClose, onSave }) {
  const [value, setValue] = useState('');
  const [busy, setBusy]   = useState(false);
  const [err, setErr]     = useState('');

  const handleSave = async () => {
    if (!value.trim()) { setErr('Please enter a value'); return; }
    setBusy(true);
    try {
      await api.post('/integrations', { provider: provider.id, accessToken: value.trim() });
      onSave(provider.id);
      onClose();
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to save credential');
    } finally { setBusy(false); }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--bg-panel)', border: `1px solid ${provider.color}40`,
        borderRadius: '1.25rem', padding: '1.75rem', width: '100%', maxWidth: '460px',
        boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px ${provider.color}20`,
        animation: 'modalIn 0.2s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1.25rem' }}>
          <span style={{
            width: 44, height: 44, borderRadius: '0.875rem', flexShrink: 0, fontSize: 22,
            background: `${provider.color}20`, border: `1px solid ${provider.color}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{provider.emoji}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
              {isOAuthUnconfigured ? `Connect ${provider.name} (manual)` : `Connect ${provider.name}`}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 1 }}>{provider.desc}</div>
          </div>
        </div>

        {isOAuthUnconfigured && (
          <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: '0.75rem', background: 'rgba(251,191,36,.08)', border: '1px solid rgba(251,191,36,.25)', fontSize: '0.8rem', color: '#fbbf24', lineHeight: 1.6 }}>
            <strong>OAuth not configured.</strong> Add <code style={{ background: 'rgba(0,0,0,0.3)', padding: '0.1rem 0.3rem', borderRadius: '0.25rem' }}>{provider.envVars?.join(', ')}</code> to <code style={{ background: 'rgba(0,0,0,0.3)', padding: '0.1rem 0.3rem', borderRadius: '0.25rem' }}>server/.env</code> for one-click OAuth. For now, paste your token below.
          </div>
        )}

        {!isOAuthUnconfigured && provider.docsUrl && (
          <div style={{ marginBottom: '0.875rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Get your {provider.manualField} from{' '}
            <a href={provider.docsUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>{provider.docsLabel}</a>.
          </div>
        )}

        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>
          {provider.manualField}
        </label>
        <input
          className="input" type="password"
          placeholder={`Paste your ${provider.manualField}`}
          value={value} onChange={e => { setValue(e.target.value); setErr(''); }}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          autoFocus style={{ marginBottom: err ? '0.5rem' : '0.875rem' }}
        />
        {err && <div style={{ fontSize: '0.8rem', color: '#ef4444', marginBottom: '0.75rem' }}>{err}</div>}

        <div style={{ display: 'flex', gap: '0.625rem' }}>
          <button className="button-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="button" style={{ flex: 1 }} onClick={handleSave} disabled={busy}>
            {busy ? 'Saving…' : 'Save & connect'}
          </button>
        </div>
        <p style={{ marginTop: '0.875rem', fontSize: '0.7rem', color: 'var(--text-faint)', lineHeight: 1.5 }}>
          🔒 AES-256 encrypted at rest · Never logged or exposed
        </p>
      </div>
    </div>
  );
}

// ── Integration Card ─────────────────────────────────────────────────────────
function IntegrationCard({ provider, isConnected, oauthConfigured, onConnect, onDisconnect, onSetup }) {
  const isOAuth  = provider.authType === 'oauth';
  const canOAuth = isOAuth && oauthConfigured;

  return (
    <div style={{
      background: 'var(--bg-panel)',
      border: `1px solid ${isConnected ? provider.color + '55' : 'var(--border)'}`,
      borderRadius: '1rem', padding: '1.125rem',
      display: 'flex', flexDirection: 'column', gap: '0.75rem',
      transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.15s',
      boxShadow: isConnected ? `0 0 0 1px ${provider.color}15, 0 4px 20px rgba(0,0,0,.15)` : 'var(--shadow)',
      position: 'relative', cursor: 'default',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = provider.color + '80'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = isConnected ? provider.color + '55' : 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
    >
      {/* Color accent top bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, borderRadius: '1rem 1rem 0 0', background: isConnected ? `linear-gradient(90deg, ${provider.color}, transparent)` : 'transparent', transition: 'background 0.3s' }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <span style={{
            width: 38, height: 38, borderRadius: '0.625rem', flexShrink: 0, fontSize: 18,
            background: `${provider.color}18`, border: `1px solid ${provider.color}35`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{provider.emoji}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.1 }}>{provider.name}</div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-faint)', marginTop: 2, letterSpacing: '0.05em' }}>{provider.category.toUpperCase()}</div>
          </div>
        </div>
        <span style={{
          borderRadius: 999, padding: '0.15rem 0.5rem', fontSize: '0.6rem', fontWeight: 700,
          color: isConnected ? '#10b981' : 'var(--text-faint)',
          background: isConnected ? 'rgba(16,185,129,.12)' : 'var(--bg-panel-muted)',
          border: `1px solid ${isConnected ? 'rgba(16,185,129,.3)' : 'var(--border)'}`,
          whiteSpace: 'nowrap',
        }}>
          {isConnected ? '● CONNECTED' : '○ NOT CONNECTED'}
        </span>
      </div>

      {/* Description */}
      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5, flex: 1, margin: 0 }}>
        {provider.desc}
      </p>

      {/* Auth badge */}
      <div>
        <span style={{
          fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.04em',
          color: canOAuth ? '#10b981' : 'var(--text-faint)',
          background: canOAuth ? 'rgba(16,185,129,.08)' : 'var(--bg-panel-muted)',
          border: `1px solid ${canOAuth ? 'rgba(16,185,129,.2)' : 'var(--border)'}`,
          borderRadius: 999, padding: '0.1rem 0.5rem',
        }}>
          {canOAuth ? '🔐 OAuth 2.0' : isOAuth ? '⚙ OAuth (manual fallback)' : '🔑 API Key / Token'}
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {/* Setup guide button */}
        <button
          onClick={() => onSetup(provider)}
          style={{
            borderRadius: '0.625rem', padding: '0.45rem 0.625rem',
            fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
            background: 'var(--bg-panel-muted)', border: '1px solid var(--border)',
            color: 'var(--text-muted)', transition: 'all 0.15s', flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = provider.color; e.currentTarget.style.color = provider.color; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          title="View setup guide"
        >📖</button>

        {/* Main connect button */}
        <button
          onClick={() => onConnect(provider)}
          style={{
            flex: 1, borderRadius: '0.625rem', padding: '0.45rem',
            fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
            background: `${provider.color}18`, border: `1px solid ${provider.color}45`,
            color: provider.color, transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = `${provider.color}30`; e.currentTarget.style.borderColor = provider.color; }}
          onMouseLeave={e => { e.currentTarget.style.background = `${provider.color}18`; e.currentTarget.style.borderColor = `${provider.color}45`; }}
        >
          {canOAuth ? (isConnected ? '↺ Reconnect OAuth' : '🔐 Connect OAuth') : (isConnected ? '↺ Update token' : '+ Connect')}
        </button>

        {isConnected && (
          <button
            onClick={() => onDisconnect(provider.id)}
            style={{
              borderRadius: '0.625rem', padding: '0.45rem 0.625rem',
              fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
              background: 'transparent', border: '1px solid rgba(239,68,68,0.3)',
              color: '#ef4444', transition: 'all 0.15s', flexShrink: 0,
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            title="Disconnect"
          >✕</button>
        )}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function Integrations() {
  const { token } = useAuthStore();
  const [statusMap,      setStatusMap]      = useState({});
  const [oauthConfig,    setOauthConfig]    = useState({});
  const [activeCategory, setActiveCategory] = useState('All');
  const [search,         setSearch]         = useState('');
  const [modal,          setModal]          = useState(null);   // credential modal
  const [setupModal,     setSetupModal]     = useState(null);   // setup guide modal
  const [notice,         setNotice]         = useState('');
  const [error,          setError]          = useState('');
  const [hint,           setHint]           = useState('');

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  const loadStatus = () =>
    api.get('/integrations/status')
      .then(r => {
        const map = {};
        (r.data.status || []).forEach(s => { map[s.provider] = s.isConnected; });
        setStatusMap(map);
      }).catch(() => {});

  useEffect(() => {
    loadStatus();
    fetch(`${API_BASE}/integrations/config`)
      .then(r => r.json())
      .then(d => setOauthConfig(d.configured || {}))
      .catch(() => {});

    const params = new URLSearchParams(window.location.search);
    const connected = params.get('connected');
    const errMsg    = params.get('error');
    const hintMsg   = params.get('hint');
    if (connected) { setNotice(`✓ ${connected} connected!`); setTimeout(() => setNotice(''), 5000); loadStatus(); }
    if (errMsg) { setError(decodeURIComponent(errMsg)); if (hintMsg) setHint(decodeURIComponent(hintMsg)); }
    if (connected || errMsg) window.history.replaceState({}, '', '/integrations');
  }, []);

  const handleConnect = (provider) => {
    const isOAuth  = provider.authType === 'oauth';
    const canOAuth = isOAuth && oauthConfig[provider.id];
    if (canOAuth) {
      window.location.href = `${API_BASE}/integrations/oauth/${provider.id}/start?token=${encodeURIComponent(token)}&origin=${encodeURIComponent(window.location.origin)}`;
    } else {
      setModal({ ...provider, isOAuthUnconfigured: isOAuth && !oauthConfig[provider.id] });
      setError(''); setHint('');
    }
  };

  const handleDisconnect = async (providerId) => {
    try { await api.post('/integrations', { provider: providerId, accessToken: '' }); } catch {}
    setStatusMap(prev => ({ ...prev, [providerId]: false }));
    setNotice(`${providerId} disconnected.`);
    setTimeout(() => setNotice(''), 3000);
  };

  const handleManualSave = (providerId) => {
    setStatusMap(prev => ({ ...prev, [providerId]: true }));
    setNotice(`✓ ${providerId} connected!`);
    setTimeout(() => setNotice(''), 4000);
  };

  // Filter: search + category
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return PROVIDERS.filter(p => {
      const matchCat =
        activeCategory === 'All' ||
        p.category === activeCategory ||
        (activeCategory === 'Finance' && p.category === 'Payments') ||
        (activeCategory === 'Payments' && (p.category === 'Payments' || p.category === 'Finance'));
      const matchSearch = !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [search, activeCategory]);

  const connectedCount = PROVIDERS.filter(p => statusMap[p.id]).length;

  return (
    <ProtectedRoute>
      <AppShell title="Integrations — Connect your tools">
        <style>{`
          @keyframes modalIn { from { opacity:0; transform:scale(0.95) translateY(-8px); } to { opacity:1; transform:scale(1) translateY(0); } }
          @keyframes fadeUp  { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        `}</style>

        {/* ── Page heading ── */}
        <div style={{ marginBottom: '1.5rem', animation: 'fadeUp 0.3s ease' }}>
          <div style={{ fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 700, marginBottom: '0.375rem' }}>Integrations</div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Connect your tools</h1>
          <p style={{ margin: '0.375rem 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Search and connect any platform — social media, email, productivity, and more.
          </p>
        </div>

        {/* ── Search + Stats bar ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap',
          padding: '0.875rem 1rem', background: 'var(--bg-panel)',
          border: '1px solid var(--border)', borderRadius: '1rem', marginBottom: '1rem',
        }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 180 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)', fontSize: 14, pointerEvents: 'none' }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search integrations… (Twitter, LinkedIn, Sheets…)"
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'var(--bg-panel-muted)', border: '1px solid var(--border)',
                borderRadius: '0.625rem', padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                fontSize: '0.82rem', color: 'var(--text-primary)', outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', fontSize: 14, lineHeight: 1 }}>✕</button>
            )}
          </div>

          <div style={{ width: 1, height: 20, background: 'var(--border)', flexShrink: 0 }} />

          {/* Stats */}
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            <span style={{ color: '#10b981', fontWeight: 700 }}>{connectedCount}</span>
            <span> / {PROVIDERS.length} connected</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-faint)' }}>·</span>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {filtered.length} shown
          </div>
        </div>

        {/* ── Category tabs ── */}
        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                borderRadius: 999, padding: '0.25rem 0.75rem',
                fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                background: activeCategory === cat ? 'var(--accent-bg)' : 'transparent',
                border: `1px solid ${activeCategory === cat ? 'var(--accent)' : 'var(--border)'}`,
                color: activeCategory === cat ? 'var(--accent)' : 'var(--text-muted)',
                transition: 'all 0.15s',
              }}
            >{cat}</button>
          ))}
        </div>

        {/* ── Notices ── */}
        {notice && (
          <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: '0.75rem', background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.25)', fontSize: '0.875rem', color: '#10b981', animation: 'fadeUp 0.3s ease' }}>{notice}</div>
        )}
        {error && (
          <div style={{ marginBottom: '1rem', padding: '0.875rem 1rem', borderRadius: '0.75rem', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.25)', fontSize: '0.875rem', color: '#ef4444', animation: 'fadeUp 0.3s ease' }}>
            <div style={{ fontWeight: 600 }}>⚠ {error}</div>
            {hint && <div style={{ marginTop: '0.375rem', fontSize: '0.8rem', color: '#fca5a5', lineHeight: 1.5 }}>{hint}</div>}
            <button onClick={() => { setError(''); setHint(''); }} style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>Dismiss</button>
          </div>
        )}

        {/* ── Integration grid ── */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-faint)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem', opacity: 0.4 }}>🔍</div>
            <div style={{ fontSize: '0.9rem' }}>No integrations match "<strong>{search}</strong>"</div>
            <button onClick={() => { setSearch(''); setActiveCategory('All'); }} style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Clear search</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '0.875rem', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))' }}>
            {filtered.map((provider, i) => (
              <div key={provider.id} style={{ animation: `fadeUp 0.3s ease ${i * 0.03}s both` }}>
                <IntegrationCard
                  provider={provider}
                  isConnected={!!statusMap[provider.id]}
                  oauthConfigured={!!oauthConfig[provider.id]}
                  onConnect={handleConnect}
                  onDisconnect={handleDisconnect}
                  onSetup={setSetupModal}
                />
              </div>
            ))}
          </div>
        )}

        {/* ── Footer ── */}
        <div style={{ marginTop: '2rem', padding: '1rem 1.25rem', borderRadius: '0.875rem', background: 'var(--bg-panel)', border: '1px solid var(--border)', fontSize: '0.75rem', color: 'var(--text-faint)', lineHeight: 1.7 }}>
          🔒 All credentials are <strong style={{ color: 'var(--text-muted)' }}>AES-256 encrypted</strong> before storage and never exposed in API responses. OAuth providers (Gmail, Slack, Google Sheets) require their app credentials in <code style={{ background: 'var(--bg-panel-muted)', padding: '0.1rem 0.3rem', borderRadius: '0.25rem' }}>server/.env</code>.
        </div>
      </AppShell>

      {/* Modals */}
      {setupModal && (
        <SetupModal
          provider={setupModal}
          onClose={() => setSetupModal(null)}
          onConnect={(p) => handleConnect(p)}
        />
      )}
      {modal && (
        <CredentialModal
          provider={modal}
          isOAuthUnconfigured={modal.isOAuthUnconfigured}
          onClose={() => setModal(null)}
          onSave={handleManualSave}
        />
      )}
    </ProtectedRoute>
  );
}
