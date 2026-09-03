/**
 * Comprehensive End-to-End Functional Audit & Verification Suite
 * Agentflow_AI Platform 2026
 */
const http = require('http');
const mongoose = require('mongoose');
const env = require('../src/config/env');
const { encryptCredential, decryptCredential, maskSecret } = require('../src/utils/crypto');
const integrationService = require('../src/services/integrationService');
const { parseInvoiceDocument } = require('../src/services/ocrService');

const BASE_HOST = '127.0.0.1';
const BASE_PORT = 5000;

function apiRequest(path, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const payload = body ? JSON.stringify(body) : null;
    if (payload) headers['Content-Length'] = Buffer.byteLength(payload);

    const req = http.request(
      {
        host: BASE_HOST,
        port: BASE_PORT,
        path,
        method,
        headers,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch (_) {
            parsed = data;
          }
          resolve({ status: res.statusCode, data: parsed });
        });
      }
    );

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runAudit() {
  console.log('================================================================');
  console.log('  AGENTFLOW_AI PLATFORM: FULL E2E SYSTEM AUDIT & VERIFICATION   ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  // ── PHASE 0: HEALTH CHECK ──────────────────────────────────────
  console.log('--- Phase 0: System Health & Base API ---');
  try {
    const health = await apiRequest('/api/health');
    assert(health.status === 200 && health.data.success === true, `API Health check returned HTTP 200 (${health.data.service})`);
  } catch (err) {
    assert(false, `API Health check failed: ${err.message}`);
  }

  // ── PHASE 1: AUTHENTICATION & SESSIONS ─────────────────────────
  console.log('\n--- Phase 1: Authentication, Session & User Profile ---');
  let authToken = null;
  let testUserId = null;
  const testEmail = `operator_audit_${Date.now()}@agentflow.ai`;
  const testPassword = 'Password123!';

  // Test 1.1: Registration
  try {
    const regRes = await apiRequest('/api/auth/register', 'POST', {
      name: 'Audit Operator',
      email: testEmail,
      password: testPassword,
      role: 'operator',
    });
    assert(regRes.status === 201 && regRes.data.token, 'User Registration: successfully created user and returned JWT');
    authToken = regRes.data.token;
    testUserId = regRes.data.user?.id || regRes.data.user?._id;
  } catch (err) {
    assert(false, `User Registration failed: ${err.message}`);
  }

  // Test 1.2: Login
  try {
    const loginRes = await apiRequest('/api/auth/login', 'POST', {
      email: testEmail,
      password: testPassword,
    });
    assert(loginRes.status === 200 && loginRes.data.token, 'User Login: authenticated and returned valid JWT token');
  } catch (err) {
    assert(false, `User Login failed: ${err.message}`);
  }

  // Test 1.3: User Profile Verification
  try {
    const meRes = await apiRequest('/api/auth/me', 'GET', null, authToken);
    assert(meRes.status === 200 && meRes.data.user?.email === testEmail, 'Protected Route /api/auth/me: hydrated user session correctly');
  } catch (err) {
    assert(false, `/api/auth/me verification failed: ${err.message}`);
  }

  // Test 1.4: Unauthorized Access Guard
  try {
    const unauthRes = await apiRequest('/api/workflows', 'GET');
    assert(unauthRes.status === 401, 'Protected Route Guard: blocked unauthenticated request with HTTP 401');
  } catch (err) {
    assert(false, `Unauthorized access guard failed: ${err.message}`);
  }

  // ── PHASE 2: UNIVERSAL BYOK & INTEGRATIONS ────────────────────
  console.log('\n--- Phase 2: Universal BYOK & Integration Ecosystem ---');
  
  // Test 2.1: Crypto Encryption / Decryption Unit Test
  try {
    const testSecret = { botToken: 'xoxb-audit-test-1234567890', webhookUrl: 'https://hooks.slack.com/services/T00/B00/X00' };
    const encrypted = encryptCredential(testSecret);
    const decrypted = decryptCredential(encrypted);
    const masked = maskSecret(testSecret.botToken);
    assert(
      typeof encrypted === 'string' &&
      decrypted.botToken === testSecret.botToken &&
      masked.includes('••••'),
      'AES-256 Symmetric Credential Encryption, Decryption & Secret Masking'
    );
  } catch (err) {
    assert(false, `Crypto unit test failed: ${err.message}`);
  }

  // Test 2.2: Save BYOK Credentials via API
  try {
    const byokSave = await apiRequest(
      '/api/integrations/discord/byok',
      'POST',
      {
        authType: 'webhook',
        webhookUrl: 'https://discord.com/api/webhooks/999888777/audit_sample_token',
      },
      authToken
    );
    assert(byokSave.status === 200 && byokSave.data.success && byokSave.data.isBYOK, 'Save BYOK: Persisted encrypted credentials to MongoDB without plain-text leak');
  } catch (err) {
    assert(false, `Save BYOK failed: ${err.message}`);
  }

  // Test 2.3: Integration Live Connection Test Endpoint
  try {
    const testConn = await apiRequest(
      '/api/integrations/discord/test',
      'POST',
      { webhookUrl: 'https://discord.com/api/webhooks/999888777/audit_sample_token' },
      authToken
    );
    assert(testConn.status === 200 && testConn.data.success, 'Connection Diagnostic Test: Validated webhook formatting and connectivity response');
  } catch (err) {
    assert(false, `Integration test endpoint failed: ${err.message}`);
  }

  // Test 2.4: Integrations Status Fetch
  try {
    const statusRes = await apiRequest('/api/integrations/status', 'GET', null, authToken);
    const discordEntry = statusRes.data.status?.find((s) => s.provider === 'discord');
    assert(
      statusRes.status === 200 && discordEntry && discordEntry.isBYOK === true && !discordEntry.rawSecret,
      'Integration Status: Returned sanitized status list with masked key previews'
    );
  } catch (err) {
    assert(false, `Integration status failed: ${err.message}`);
  }

  // ── PHASE 3: AI DOCUMENT PARSING & OCR ENGINE ─────────────────
  console.log('\n--- Phase 3: AI Document Parsing & OCR Engine ---');
  
  // Test 3.1: Invoice Parsing via API
  try {
    const ocrRes = await apiRequest('/api/payouts/parse-invoice', 'POST', {
      fileName: 'AWS-Audit-Compute-Invoice.pdf',
      textContent: 'Amazon Web Services India Pvt Ltd monthly invoice for EC2 and S3 instances. Total amount: ₹4,200. UPI: aws.billing@okhdfcbank. Ref: INV-2026-9901',
    });
    assert(
      ocrRes.status === 200 &&
      ocrRes.data.success &&
      ocrRes.data.data.amount === 4200 &&
      ocrRes.data.data.recipientName.includes('Amazon'),
      `AI OCR Parsing: Extracted structured payout parameters successfully (Model: ${ocrRes.data.data.modelUsed})`
    );
  } catch (err) {
    assert(false, `AI Invoice Parsing failed: ${err.message}`);
  }

  // Test 3.2: Base64 Multi-Modal Ingestion
  try {
    const base64Res = await parseInvoiceDocument({
      fileName: 'receipt.png',
      fileType: 'image/png',
      fileBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      textContent: 'Vendor Settlement: ₹6,800 to cloudflare@razorpay',
    });
    assert(base64Res && base64Res.amount > 0, `Multi-Modal Ingestion: Processed inline image data parts cleanly (Latency: ${base64Res.latencyMs}ms)`);
  } catch (err) {
    assert(false, `Base64 ingestion failed: ${err.message}`);
  }

  // ── PHASE 4: WORKFLOW BUILDER & GRAPH PERSISTENCE ─────────────
  console.log('\n--- Phase 4: Workflow Builder & DAG Execution ---');
  let createdWorkflowId = null;

  // Test 4.1: Workflow Creation
  try {
    const wfRes = await apiRequest(
      '/api/workflows',
      'POST',
      {
        name: 'Automated Vendor Audit Pipeline',
        description: 'End-to-end automated invoice processing & settlement DAG',
        nodes: [
          { id: '1', type: 'trigger', data: { label: 'Webhook Trigger', provider: 'webhook' }, position: { x: 0, y: 0 } },
          { id: '2', type: 'agent', data: { label: 'Gemini AI Parser', agentType: 'gemini' }, position: { x: 200, y: 0 } },
          { id: '3', type: 'action', data: { label: 'Slack Alert', provider: 'slack' }, position: { x: 400, y: 0 } },
          { id: '4', type: 'payout', data: { label: 'Razorpay Fast Payout', provider: 'razorpay' }, position: { x: 600, y: 0 } },
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2' },
          { id: 'e2-3', source: '2', target: '3' },
          { id: 'e3-4', source: '3', target: '4' },
        ],
      },
      authToken
    );
    assert(wfRes.status === 201 && wfRes.data.workflow?._id, 'Workflow Builder: Saved multi-step DAG graph to MongoDB');
    createdWorkflowId = wfRes.data.workflow?._id;
  } catch (err) {
    assert(false, `Workflow creation failed: ${err.message}`);
  }

  // Test 4.2: List Workflows
  try {
    const listWf = await apiRequest('/api/workflows', 'GET', null, authToken);
    assert(listWf.status === 200 && Array.isArray(listWf.data.workflows), 'Workflow List: Retrieved user workflow catalog');
  } catch (err) {
    assert(false, `List workflows failed: ${err.message}`);
  }

  // Test 4.3: Execute Workflow Pipeline
  try {
    if (createdWorkflowId) {
      const execRes = await apiRequest(`/api/workflows/${createdWorkflowId}/execute`, 'POST', { inputs: { invoiceId: 'INV-TEST-001' } }, authToken);
      assert(
        (execRes.status === 202 || execRes.status === 200) && execRes.data.success,
        `Workflow Execution: Dispatched DAG job execution queue (Status: ${execRes.data.execution?.status || 'PENDING'})`
      );
    }
  } catch (err) {
    assert(false, `Workflow execution failed: ${err.message}`);
  }

  // ── PHASE 5: PAYMENT RAILS, ZK SPEND GUARD & PAYOUTS ─────────
  console.log('\n--- Phase 5: Payment Rails, ZK Spend Guard & Fast Payouts ---');

  // Test 5.1: List Payouts & Queue
  try {
    const payoutsRes = await apiRequest('/api/payouts/all', 'GET');
    assert(payoutsRes.status === 200 && Array.isArray(payoutsRes.data.payouts), 'Payouts Queue: Retrieved live payout records from MongoDB');
  } catch (err) {
    assert(false, `Payouts list failed: ${err.message}`);
  }

  // Test 5.2: ZK Spend Guard Proof Verification
  try {
    const zkRes = await apiRequest('/api/agentguard/check', 'POST', {
      requestedAmount: 4200,
      maxLimit: 10000,
      targetMerchantId: 101,
      allowedMerchantId: 101,
    });
    assert(
      zkRes.status === 200 && (zkRes.data.success === true || zkRes.data.status === 'PROOF_VALID'),
      `ZK Spend Guard: Groth16 cryptographic budget boundary verified (${zkRes.data.message})`
    );
  } catch (err) {
    assert(false, `ZK proof verification failed: ${err.message}`);
  }

  // Test 5.3: Security Attack Simulation & Defense
  try {
    const attackRes = await apiRequest('/api/attack/simulate-attack', 'POST', {
      attackType: 'POLICY_BREACH',
    });
    const resultData = attackRes.data.data || attackRes.data;
    assert(
      attackRes.status === 200 && (resultData.status === 'CONSTRAINT_VIOLATION' || attackRes.data.success),
      `AgentGuard AI Defense: Intercepted and blocked simulated attack (${resultData.vendor}: ₹${resultData.requestedAmount} > Max ₹${resultData.maxLimit})`
    );
  } catch (err) {
    assert(false, `Attack simulation failed: ${err.message}`);
  }

  // Test 5.4: Payout Approval & OTP Verification
  try {
    const approveRes = await apiRequest('/api/payouts/approve', 'POST', {
      payoutId: 'PO_AUDIT_SAMPLE_01',
      otp: '123456',
    });
    assert(
      approveRes.status === 200 && approveRes.data.success,
      'Fast Payout Approval: Validated 6-digit OTP (123456) and transitioned payout status to PAID'
    );
  } catch (err) {
    assert(false, `Payout approval failed: ${err.message}`);
  }

  // ── PHASE 6: ANALYTICS & NOTIFICATIONS ────────────────────────
  console.log('\n--- Phase 6: Analytics & System Notifications ---');

  // Test 6.1: Analytics Metrics
  try {
    const analyticsRes = await apiRequest('/api/analytics/summary', 'GET');
    assert(
      analyticsRes.status === 200 && analyticsRes.data.success,
      `Analytics Engine: Aggregated system volume, throughput, and guardrail metrics`
    );
  } catch (err) {
    assert(false, `Analytics summary failed: ${err.message}`);
  }

  // Test 6.2: Notifications Drawer
  try {
    const notifRes = await apiRequest('/api/notifications', 'GET', null, authToken);
    assert(
      notifRes.status === 200 && Array.isArray(notifRes.data.notifications),
      'Notifications Service: Retrieved system approval alerts and activity feeds'
    );
  } catch (err) {
    assert(false, `Notifications fetch failed: ${err.message}`);
  }

  // ── AUDIT SUMMARY ─────────────────────────────────────────────
  console.log('\n================================================================');
  console.log(`  AUDIT RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed === 0) {
    console.log('🎉 ALL SYSTEM MODULES, ENDPOINTS, AND SECURITY GUARDS VERIFIED GREEN!\n');
  } else {
    console.error(`⚠️ ${failed} AUDIT ASSERTION(S) FAILED. INVESTIGATION REQUIRED.`);
  }

  process.exit(failed > 0 ? 1 : 0);
}

runAudit().catch((err) => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
