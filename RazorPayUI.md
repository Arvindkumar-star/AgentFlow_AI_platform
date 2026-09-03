SPECIFICATION SHEET: HITL APPROVAL MODAL & PAYOUT EXECUTION
Target System: Agentflow_AI Platform Expansion

Target Track: Razorpay AI Buildathon — Human-in-the-Loop Financial Guardrails

Directive: Build a interactive Next.js Approval Modal, wire it to the AppShell header notification system, implement the backend approval/rejection endpoints, and dynamically update the React Flow canvas node state upon approval.

1. ARCHITECTURAL FLOW
Trigger: When payoutAgent.js creates a payout draft, it registers a pending transaction record in MongoDB with status: "PENDING_APPROVAL".

Notification Alert: The top navigation bar notification bell displays an active badge counter (1).

Modal Launch: Clicking the notification bell or item opens ApprovalModal.jsx.

Verification & Execution:

Entering mock OTP 123456 and clicking Approve & Execute triggers POST /api/payouts/approve.

Entering an incorrect OTP shows an error state.

Clicking Reject triggers POST /api/payouts/reject, setting status to CANCELLED and invoking recoveryAgent.js.

Real-time Canvas Sync: The Razorpay Payout Node on the workflow canvas automatically transitions its status pill from PENDING_APPROVAL to PAID (Emerald Green).

2. DETAILED FILE PROPOSALS
Phase 1: Backend Routes & State Transition
[NEW] server/src/routes/payoutRoutes.js

GET /api/payouts/pending: Fetches all payouts currently in PENDING_APPROVAL status.

POST /api/payouts/approve:
Body: { payoutId, otp, executionId, nodeId }
Logic: Validates otp === "123456". Updates MongoDB record status to PAID. Updates the active workflow execution context for nodeId to COMPLETED.

POST /api/payouts/reject:
Body: { payoutId, executionId, nodeId, reason }
Logic: Updates status to REJECTED. Triggers recoveryAgent.js with code HITL_USER_REJECTED.

Phase 2: Frontend Components
[NEW] client/src/components/ApprovalModal.jsx

UI Layout:
Header: "Financial Execution Approval Required" with a shield/lock icon.
Security Context Box: Displays Vendor, Amount (INR), Account Number, and a green badge for AgentGuard ZK Proof: VERIFIED.
Input Field: 6-digit styled OTP input (pre-filled or prompted for 123456).
Action Buttons: Approve Payout (Emerald button) and Reject & Cancel (Rose outline button).
State & Handling: Handles submitting OTP, loading spinner during request, error toast for invalid OTP, and success callback to refresh workflow state.

[MODIFY] client/src/components/Header/NotificationBell.jsx (or AppShell Navigation Header)
Polls or listens via WebSocket/SWR to GET /api/payouts/pending.
Renders a pulsing notification badge counter when pending payouts exist.
Clicking the item opens ApprovalModal.jsx.

[MODIFY] client/src/components/WorkflowCanvas/nodes/RazorpayNode.jsx
Dynamic rendering based on data status:
PENDING_APPROVAL: Amber badge with pulsing clock icon.
PAID: Emerald badge with CheckCircle2 icon.
REJECTED: Rose badge with XCircle icon.
