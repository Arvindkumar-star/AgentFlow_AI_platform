SPECIFICATION SHEET: RAZORPAY PAYOUT NODE (HITL)
Target System: Agentflow_AI Platform Expansion

Target Track: Razorpay AI Buildathon — Automated Payouts & Risk Management

Directive: Add a Razorpay Payout Node to the workflow canvas that converts validated output from the AgentGuard ZK Node into a Razorpay Draft Payout Order and triggers human approval via AppShell notifications before final execution.

1. ARCHITECTURAL INTEGRATION DIRECTIVE
The Razorpay Payout Node executes immediately downstream of the AgentGuard Node. It must:

Verify that incoming state has status: "PROOF_VALID". If state is ZK_REJECTED, abort payout generation immediately.

Call the Razorpay Sandbox Payouts API (POST /v1/payouts) to create a Draft Payout.

Create a pending human approval ticket in MongoDB and emit an AppShell event with a 1-Click Approve button.

2. FILE STRUCTURE ADDITIONS
Agentflow_AI/
├── server/
│   ├── src/
│   │   ├── services/
│   │   │   └── razorpayService.js   # Razorpay SDK / REST API Wrapper
│   │   ├── agents/
│   │   │   └── payoutAgent.js       # Executes payout drafts & HITL state management
│   │   └── routes/
│   │       └── payoutRoutes.js       # Approval & Webhook callbacks
└── client/
    └── src/
        └── components/
            ├── NodePalette/
            │   └── RazorpayPaletteItem.jsx
            └── WorkflowCanvas/
                └── nodes/
                    └── RazorpayNode.jsx     # Custom Node displaying Draft & Approval UI

3. PHASED IMPLEMENTATION PLAN
PHASE 1: Backend Service & Agent Setup
1.1 File Creation — server/src/services/razorpayService.js
1.2 File Creation — server/src/agents/payoutAgent.js
1.3 Execution Agent Dispatcher integration in server/src/agents/executionAgent.js
1.4 Route Creation — server/src/routes/payoutRoutes.js (mounted in server/src/index.js)

PHASE 2: Frontend Canvas Node Extension
2.1 File Creation — client/src/components/WorkflowCanvas/nodes/RazorpayNode.jsx
2.2 File Creation — client/src/components/NodePalette/RazorpayPaletteItem.jsx

PHASE 3: Palette & Canvas Registration
3.1 Register in client/src/components/WorkflowCanvas.js (nodeTypes & NODE_TYPE_META)
3.2 Register in client/src/components/NodePalette.js under 'Payments & Actions'
3.3 Add fields in client/src/components/NodeConfigPanel.js
3.4 Wire upstream state: inherit requestedAmount, vendor from AgentGuard ZK Node output
