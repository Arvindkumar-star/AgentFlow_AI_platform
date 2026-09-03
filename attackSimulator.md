# SPECIFICATION SHEET: INTERACTIVE ZK STRESS TEST & ATTACK SIMULATOR
Target System: Agentflow_AI Platform Expansion

Target Track: Razorpay AI Buildathon — Real-time Security Testing & ZK Firewall Visualization

Directive: Build an interactive "Simulate Scam Attack" stress-test suite that allows users, auditors, and judges to inject tampered invoice payloads directly into the canvas. The engine will run the SnarkJS Groth16 circuit verifier, trigger dynamic visual feedback across the React Flow nodes, write to the /analytics audit log, and showcase the platform's cryptographic firewall.

## 1. SYSTEM ARCHITECTURE & EXOTIC THREAT FLOW
```
[Simulate Scam Attack Button]
             │
             ▼
[Inject Tampered Payload: Amount > Max Limit]
             │
             ▼
[POST /api/payouts/simulate-attack]
             │
             ▼
[AgentGuard ZK Circuit Verification] ──> Fails Constraint Check
             │
             ├───────────────────────────────────────────┐
             ▼                                           ▼
[Canvas Node Response]                         [Security Analytics Engine]
• AgentGuard Node flashes red                  • Increments "Scam Volume Blocked"
• Status badge: CONSTRAINT_VIOLATION          • Adds entry to Cryptographic Audit Log
• Emits real-time pulse animation              • Displays breach delta (e.g. +₹75,000)
```

## 2. FILE CREATIONS & MODIFICATIONS
```
Agentflow_AI/
├── server/
│   └── src/
│       └── routes/
│           └── attackRoutes.js           # [NEW] Injection endpoint & circuit failure emulator
└── client/
    └── src/
        └── components/
            ├── Testing/
            │   └── AttackSimulatorButton.jsx # [NEW] Header trigger for interactive stress testing
            ├── WorkflowCanvas.js             # [MODIFY] Handle real-time attack event visual state & button
            └── Analytics/
                └── ProofInspectorDrawer.jsx  # [MODIFY] Render constraint violation details & delta
```

## 3. IMPLEMENTATION DETAILS
### Phase 1: Attack Injection API — server/src/routes/attackRoutes.js
Create this endpoint to process simulated scam attacks and calculate security breach deltas.

```javascript
const express = require('express');
const router = express.Router();

// Simulated attack endpoint for live platform testing
router.post('/simulate-attack', (req, res) => {
  const { attackType } = req.body;

  // Define malicious scenarios
  const scenarios = {
    POLICY_BREACH: {
      id: `attack_${Date.now()}`,
      vendor: 'Unknown Overseas Vendor Corp',
      requestedAmount: 85000,
      maxLimit: 10000,
      status: 'CONSTRAINT_VIOLATION',
      proofType: 'Groth16 / BN128',
      verificationTimeMs: 44,
      breachDeltaINR: 75000,
      errorMessage: 'Public input requestedAmount (85000) exceeds boundary ceiling (10000).',
      timestamp: new Date().toISOString()
    },
    SUSPICIOUS_REGISTRAR: {
      id: `attack_${Date.now()}`,
      vendor: 'Suspicious Offshore Registrar',
      requestedAmount: 145000,
      maxLimit: 5000,
      status: 'CONSTRAINT_VIOLATION',
      proofType: 'Groth16 / BN128',
      verificationTimeMs: 46,
      breachDeltaINR: 140000,
      errorMessage: 'Public input requestedAmount (145000) exceeds boundary ceiling (5000).',
      timestamp: new Date().toISOString()
    }
  };

  const attackResult = scenarios[attackType] || scenarios.POLICY_BREACH;

  return res.status(200).json({
    success: true,
    message: 'Attack simulated successfully. AgentGuard ZK firewall intercepted constraint violation.',
    data: attackResult
  });
});

module.exports = router;
```

### Phase 2: Stress-Test Trigger Component — client/src/components/Testing/AttackSimulatorButton.jsx
Add an interactive trigger button to the canvas top navigation header.

### Phase 3: Canvas Node State Integration
Hook the attack result directly into the React Flow canvas to trigger instant visual feedback (flashes red, updates AgentGuard ZK node status, opens ProofInspectorDrawer with the failed constraint and breach delta).
