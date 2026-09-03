SPECIFICATION SHEET: AGENTGUARD ZK GUARDRAIL NODE
Target System: Agentflow_AI Platform Expansion

Target Track: Razorpay AI Buildathon — AI Risk Manager / Open Track

Directive: Seamlessly integrate a Zero-Knowledge Mathematical Spend Verification Node into the existing Node.js/Express backend and Next.js React Flow (@xyflow/react) frontend canvas without breaking existing agent execution flows or MongoDB schemas.

1. ARCHITECTURAL INTEGRATION DIRECTIVE
The AgentGuard Node acts as a pre-execution deterministic circuit interceptor within the Agentflow_AI graph. When the Planner Agent constructs a workflow containing financial or payout nodes, or when an operator drags an AgentGuard Node onto the React Flow canvas, execution must pass through mathematical ZK verification before calling any Razorpay API endpoint.

Key Rules for Antigravity Execution
Zero Breaking Changes: Extend existing Execution, ExecutionLog, and Workflow schemas—do not replace them.

Isolated Circuit Logic: Keep all Circom circuits and SnarkJS verification logic modularized within server/src/services/agentGuardService.js.

Agent Fallback Integration: If ZK verification fails, pass control directly to the existing Recovery Agent with error code ZK_CONSTRAINT_VIOLATION.

2. UPDATED FILE STRUCTURE ADDITIONS
Plaintext
Agentflow_AI/
├── server/
│   ├── circuits/
│   │   ├── spend_guard.circom      # ZK Spend & Whitelist Circuit
│   │   └── compile.sh              # Circuit build automation
│   ├── src/
│   │   ├── keys/
│   │   │   ├── verification_key.json
│   │   │   └── spend_guard.wasm
│   │   ├── services/
│   │   │   └── agentGuardService.js # ZK Proof generation & SnarkJS verifier
│   │   ├── agents/
│   │   │   └── validationAgent.js   # Extended to run ZK checks when node type == 'agentGuard'
│   │   └── routes/
│   │       └── agentGuardRoutes.js  # Verification API endpoints
└── client/
    └── src/
        └── components/
            ├── NodePalette/
            │   └── AgentGuardPaletteItem.jsx  # Canvas Drag-and-Drop item
            └── WorkflowCanvas/
                └── nodes/
                    └── AgentGuardNode.jsx     # Custom React Flow Node Component
3. PHASED IMPLEMENTATION PLAN
PHASE 1: ZK Circuit & Cryptographic Keys Setup
Objective
Compile the Circom circuit and export verification assets to the server services directory.

1.1 File Creation — server/circuits/spend_guard.circom
Code snippet
pragma circom 2.1.6;

include "../../node_modules/circomlib/circuits/comparators.circom";

template SpendGuard() {
    // Private Inputs (Only known locally to the execution session)
    signal input privateAuthSecret;
    signal input maxAllowedSpend;

    // Public Inputs (Exposed to Express Verifier & Logs)
    signal input requestedAmount;
    signal input targetMerchantId;
    signal input allowedMerchantId;

    // Output Signal
    signal output isVerified;

    // Constraint 1: Requested Amount <= Max Allowed Spend Limit (64-bit comparison)
    component compLess = LessEqThan(64);
    compLess.in[0] <== requestedAmount;
    compLess.in[1] <== maxAllowedSpend;

    // Constraint 2: Merchant ID Match
    component compMerchant = IsEqual();
    compMerchant.in[0] <== targetMerchantId;
    compMerchant.in[1] <== allowedMerchantId;

    // Combined Check
    isVerified <== compLess.out * compMerchant.out;
    isVerified === 1;
}

component main {public [requestedAmount, targetMerchantId, allowedMerchantId]} = SpendGuard();
1.2 File Creation — server/circuits/compile.sh
Bash
#!/bin/bash
mkdir -p build
circom spend_guard.circom --r1cs --wasm --sym -o build/

cd build
snarkjs powersoftau new bn128 12 pot12_0000.ptau -v
snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="Agentflow Setup" -v -e="entropy_1"
snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v

snarkjs groth16 setup spend_guard.r1cs pot12_final.ptau spend_guard_0000.zkey
snarkjs zkey contribute spend_guard_0000.zkey spend_guard_final.zkey --name="Agentflow Contrib" -v -e="entropy_2"
snarkjs zkey export verificationkey spend_guard_final.zkey verification_key.json

mkdir -p ../../src/keys
cp verification_key.json ../../src/keys/
cp spend_guard_js/spend_guard.wasm ../../src/keys/
PHASE 2: Backend Integration & Service Layer Extension
2.1 File Creation — server/src/services/agentGuardService.js
JavaScript
const snarkjs = require('snarkjs');
const fs = require('fs');
const path = require('path');

const vKeyPath = path.join(__dirname, '../keys/verification_key.json');

class AgentGuardService {
  async verifyProof(proof, publicSignals) {
    try {
      if (!fs.readFileSync(vKeyPath)) {
        throw new Error("Verification key missing. Run compile.sh first.");
      }
      const vKey = JSON.parse(fs.readFileSync(vKeyPath, 'utf8'));
      const isValid = await snarkjs.groth16.verify(vKey, publicSignals, proof);
      return isValid;
    } catch (error) {
      console.error("AgentGuard ZK Verification Failed:", error.message);
      return false;
    }
  }

  generatePublicSignals(requestedAmount, targetMerchant, allowedMerchant, isPassing) {
    return [
      requestedAmount.toString(),
      targetMerchant.toString(),
      allowedMerchant.toString(),
      isPassing ? "1" : "0"
    ];
  }
}

module.exports = new AgentGuardService();
2.2 Extension — server/src/agents/validationAgent.js
Update validationAgent.js to inspect if a node belongs to the agentGuard category and execute SnarkJS verification prior to passing execution state to the executionAgent:

JavaScript
const agentGuardService = require('../services/agentGuardService');

async function processValidationNode(node, executionContext) {
  if (node.type === 'agentGuard') {
    const { proof, publicSignals, maxLimit, requestedAmount } = node.data;

    const isValid = await agentGuardService.verifyProof(proof, publicSignals);

    if (!isValid || requestedAmount > maxLimit) {
      return {
        status: 'FAILED',
        errorCode: 'ZK_CONSTRAINT_VIOLATION',
        reason: `Spending limit violated: Requested ₹${requestedAmount} exceeds max allowance ₹${maxLimit}`,
        triggerRecovery: true
      };
    }

    return {
      status: 'SUCCESS',
      message: 'ZK Proof Verified. Financial execution bounded and safe.'
    };
  }

  // Fallback to standard validation agent rules...
}
PHASE 3: Next.js Frontend React Flow Canvas Extensions
3.1 Custom React Flow Node — client/src/components/WorkflowCanvas/nodes/AgentGuardNode.jsx
JavaScript
import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { ShieldCheck, ShieldAlert } from 'lucide-react';

export default function AgentGuardNode({ data, selected }) {
  const isPassing = data?.requestedAmount <= data?.maxLimit;

  return (
    <div className={`px-4 py-3 shadow-md rounded-xl bg-slate-900 border-2 font-sans ${selected ? 'border-cyan-400' : 'border-slate-800'}`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-cyan-400" />
      
      <div className="flex items-center gap-3">
        {isPassing ? (
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
        ) : (
          <ShieldAlert className="w-6 h-6 text-rose-400 animate-bounce" />
        )}
        <div>
          <div className="text-xs font-bold text-slate-100">AgentGuard ZK Node</div>
          <div className="text-[10px] text-slate-400 font-mono">
            Max: ₹{data?.maxLimit || 1000} | Req: ₹{data?.requestedAmount || 0}
          </div>
        </div>
      </div>

      <div className="mt-2 text-[9px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-cyan-300">
        {isPassing ? "STATUS: PROOF_VALID" : "STATUS: ZK_REJECTED"}
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-cyan-400" />
    </div>
  );
}
4. TESTING & VERIFICATION STEPS FOR ANTIGRAVITY
Execute cd server/circuits && bash compile.sh and verify verification_key.json is written to server/src/keys/.

Open http://localhost:3000/workflows/builder and drag AgentGuard Node onto the canvas.

Set maxLimit = 1000 and requestedAmount = 500. Run workflow execution. Confirm status transitions to COMPLETED and Socket.IO logs show ZK Proof Verified.

Set requestedAmount = 50000. Trigger execution. Confirm status transitions to RECOVERING / ESCALATED via the Recovery Agent with ZK_CONSTRAINT_VIOLATION.
