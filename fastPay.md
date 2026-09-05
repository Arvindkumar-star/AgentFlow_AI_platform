# Agentflow_AI System Architecture & Specification Sheet

Target Platform: Agentflow_AI
Core Stack: Next.js 14+ (App Router), React Flow, Tailwind CSS, Supabase / PostgreSQL, SnarkJS (Groth16 ZK), Razorpay Node SDK
Primary Objective: Execute a production-ready, multi-tenant UI/UX refactor. Ensure absolute technical isolation between the Visual Canvas Editor and the Standalone Fast Payouts Portal while maintaining a unified AgentGuard ZK security engine.

---

### 1. System Architecture Diagram
+----------------------------------------------------------------------------------------+
|                                 AGENTFLOW_AI PLATFORM                                  |
|                                                                                        |
|  +----------------------------------------------------------------------------------+  |
|  |                     App Shell & Global Providers (/app/layout.tsx)               |  |
|  |  * Fixed Left Sidebar Navigation (/components/layout/Sidebar.tsx)                  |  |
|  |  * Theme Provider (next-themes - Light / Dark Mode)                              |  |
|  |  * Auth Session & Tenant Provider (user_id Context)                            |  |
|  +--------------------------+-------------------------------------------------------+  |
|                             |                                                          |
|       +---------------------+---------------------+---------------------+              |
|       |                     |                     |                     |              |
|       v                     v                     v                     v              |
|  +---------------+   +---------------+   +---------------+   +---------------+         |
|  |   Dashboard   |   | Canvas Editor |   |  Fast Payouts |   | Documentation |         |
|  |  /dashboard   |   |  /workflows   |   |   /payouts    |   | /about, /help |         |
|  +-------+-------+   +-------+-------+   +-------+-------+   +-------+-------+         |
|          |                   |                   |                   |                 |
+----------+-------------------+-------------------+-------------------+-----------------+
|                   |                   |                   |
v                   v                   v                   v
+----------------------------------------------------------------------------------------+
|                             BACKEND ENGINE & SECURITY API                              |
|                                                                                        |
|  +----------------------------------------------------------------------------------+  |
|  |                             AgentGuard ZK Firewall                               |  |
|  |  * SnarkJS / Groth16 Proof Verifier (maxLimit financial policy enforcement)     |  |
|  |  * Data Leakage Prevention (DLP-704 Regex & PII Inspection)                    |  |
|  |  * Prompt Injection Shield (Malicious payload interception)                       |  |
|  +--------------------------+-------------------------------------------------------+  |
|                             |                                                          |
|       +---------------------+---------------------+                                    |
|       v                                           v                                    |
|  +-------------------------+             +-------------------------+                   |
|  | Human-in-the-Loop (HITL)|             | Multi-Rail Executions   |                   |
|  | Interactive Approval    |             | Razorpay / Gmail / LLMs |                   |
|  +-------------------------+             +-------------------------+                   |
+----------------------------------------------------------------------------------------+

---

### 2. Global App Shell & Layout Settings (`app/layout.tsx`)

* **Theme System:** Configured via `next-themes` with full dual-mode support (Light and Dark). Dynamic styling utilizing Tailwind CSS tokens (`bg-slate-50 dark:bg-slate-950`, `text-slate-900 dark:text-slate-100`, `border-slate-200 dark:border-slate-800`).
* **Sidebar Navigation (`components/layout/Sidebar.tsx`):** Fixed left navigation panel containing interactive links:
  * 📊 Dashboard (`/dashboard`)
  * 🎨 Workflows (`/workflows`)
  * ⚡ Fast Payouts (`/payouts`)
  * ℹ️ About (`/about`)
  * ❓ Help (`/help`)
  * ⚙️ Settings (`/settings`)
* **Tenant Isolation Context:** Automatically extracts authenticated `user_id` from the active session and injects it into all database operations and API calls to enforce strict multi-tenant data scoping.

---

### 3. Route-by-Route Technical Specifications

#### Route: `/dashboard` (Analytics & Execution Dashboard)
* **Metrics Grid:** 4 real-time analytics cards (Total Runs, Active Workflows, Threats Intercepted, Success Rate %).
* **Live Activity Stream:** Real-time security events feed (VERIFIED, PROMPT_INJECTION_DETECTED, PII_LEAK_PREVENTED, PAID).
* **Global Audit Table:** Paginated history table with date range, status, and workflow type filters.

#### Route: `/workflows/[id]` (Visual Workflow Canvas Editor)
* **React Flow Engine:** Interactive grid for node types (Trigger, AI/LLM, AgentGuard ZK, Razorpay Payout, Gmail) with glowing status borders (Emerald Green = Success, Rose Red = Violation).
* **ZK Inspector Drawer:** Slide-out side panel showing Groth16 cryptographic proof parameters (BN128 curve), verification latency (~29ms), and sanitized output payloads.
* **Non-Payment Autonomy:** AI or messaging-only workflows run independently without initializing payment modules or requiring Razorpay credentials.

#### Route: `/payouts` (Standalone Fast Payouts Portal)
* **Simplified Form UI:** Direct fields for Recipient Name, UPI ID / Account, Invoice Amount (INR), and Invoice Attachment.
* **Dedicated API Endpoint (`/api/payouts/direct`):** Invokes AgentGuard ZK validation directly on submit. Triggers HITL modal if sub-limit, executes payout via Razorpay SDK upon approval, and logs record directly to database without modifying canvas state.

#### Route: `/about` (Platform Overview)
* **Header Badges:** Indicators for Built for Razorpay AI Buildathon, Groth16 ZK Engine, Next.js 14.
* **Core Pillars:** 3-card grid highlighting Cryptographic Security, Deterministic Execution, and Human-in-the-Loop Safeguards.
* **Architect Profile:** Developer card for Arvind Kumar (Lead Architect & Full-Stack AI Developer) with links to GitHub (`github.com/Arvindkumar-star`) and LinkedIn (`linkedin.com/in/arvind-kumar-4364a0338`).

#### Route: `/help` (Help & Documentation)
* **Searchable Knowledge Base:** Interactive filter input for guides and FAQs.
* **4-Step Quickstart Grid:** Cards for Canvas Setup, Setting ZK Policy Limits, Attack Simulations, and HITL Approvals.
* **Accordion FAQs:** Interactive answers addressing policy limits, PII data masking, and error recovery.

---

### 4. Backend Architecture & Security Isolation

#### Decoupled API Execution
Execution flows are handled on separate backend routes to ensure total modular independence:
* Canvas workflows execute via `/api/workflows/execute`.
* Direct payouts execute via `/api/payouts/direct`.
An error in canvas rendering or state mutation cannot affect direct payouts, and vice versa.

#### Stateless AgentGuard ZK Engine
The security firewall functions as a standalone utility service. It evaluates financial policy limits (`maxLimit`), scans for PII leaks (`DLP-704`), and blocks prompt injections on demand without storing mutable state between requests.

#### Database & Audit Integrity
All execution logs are persisted to a central `executions` table in Supabase / PostgreSQL. Both canvas workflow runs and direct payouts write to this table under the appropriate `user_id` tag, keeping the main dashboard feed unified regardless of where transactions originate.