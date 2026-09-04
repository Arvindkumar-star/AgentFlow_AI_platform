import React, { useCallback } from 'react';
import { ReactFlow, Background, Controls } from '@xyflow/react';
import AnimatedGlowEdge from './edges/AnimatedGlowEdge';
import AttackSimulatorButton from '../Testing/AttackSimulatorButton';
import api from '../../services/api';

const edgeTypes = {
  animatedGlow: AnimatedGlowEdge,
};

/**
 * Serializes and normalizes canvas nodes and edges before API transmission.
 * Ensures every node and edge object automatically defaults to label: node.data.label || node.id || 'Node'
 * so that database validation for Path 'label' is required never throws an error.
 */
export function serializeWorkflowPayload(nodes = [], edges = []) {
  const serializedNodes = (nodes || []).map((node) => {
    const fallbackLabel = node.data?.label || node.label || node.data?.name || node.id || 'Node';
    const rawType = String(node.type || node.data?.type || node.id || '').toLowerCase();
    const cleanData = { ...(node.data || {}) };

    // Strip transient simulation attack data so it is never permanently written to database
    delete cleanData.threatType;
    delete cleanData.threatBadge;
    delete cleanData.threatMessage;
    cleanData.isAttacked = false;
    cleanData.isBlocked = false;

    if (cleanData.payload?.detectedEntities || cleanData.payload?.injectedPrompt) {
      delete cleanData.payload;
    }

    if (
      cleanData.status === 'PII_LEAK_PREVENTED' ||
      cleanData.status === 'PROMPT_INJECTION_DETECTED' ||
      cleanData.status === 'HALTED'
    ) {
      if (rawType.includes('agentguard') || rawType.includes('zk') || rawType.includes('guard')) {
        cleanData.status = 'GROTH16_VERIFIED';
        cleanData.isPassing = true;
        cleanData.isVerified = true;
      } else {
        cleanData.status = 'READY';
      }
    }

    return {
      ...node,
      id: String(node.id),
      type: node.type || node.data?.type || 'default',
      label: fallbackLabel,
      position: node.position || { x: 0, y: 0 },
      data: {
        ...cleanData,
        label: cleanData.label || fallbackLabel,
      },
    };
  });

  const serializedEdges = (edges || []).map((edge) => {
    const rawLabel = edge.label || edge.data?.label;
    const cleanLabel = (rawLabel && !String(rawLabel).startsWith('xy-edge') && rawLabel !== edge.id) ? rawLabel : undefined;
    return {
      ...edge,
      id: String(edge.id),
      source: String(edge.source),
      target: String(edge.target),
      type: edge.type || 'animatedGlow',
      label: cleanLabel,
      animated: edge.animated !== undefined ? edge.animated : true,
    };
  });

  return { nodes: serializedNodes, edges: serializedEdges };
}

/**
 * Finds all downstream node IDs reachable from a given start node via edges.
 */
export function getDownstreamNodeIds(startNodeId, edges = []) {
  const visited = new Set();
  const queue = [String(startNodeId)];
  while (queue.length > 0) {
    const current = queue.shift();
    (edges || []).forEach((edge) => {
      if (String(edge.source) === current && !visited.has(String(edge.target))) {
        visited.add(String(edge.target));
        queue.push(String(edge.target));
      }
    });
  }
  return visited;
}

/**
 * Finds all upstream ancestor node IDs that lead to targetNodeId via edges.
 */
export function getUpstreamNodeIds(targetNodeId, edges = []) {
  const visited = new Set();
  const queue = [String(targetNodeId)];
  while (queue.length > 0) {
    const current = queue.shift();
    (edges || []).forEach((edge) => {
      if (String(edge.target) === current && !visited.has(String(edge.source))) {
        visited.add(String(edge.source));
        queue.push(String(edge.source));
      }
    });
  }
  return visited;
}

/**
 * Global Cascading Node State Synchronization:
 * When an execution or approval occurs (e.g., HITL payment approved):
 * - If action succeeds (PAID / SUCCESS / VERIFIED):
 *   Triggers a state pass across the active branch: clears all upstream error/halt badges
 *   (PII_LEAK_PREVENTED, CONSTRAINT_VIOLATION) on parent nodes and sets them to GROTH16_VERIFIED / SUCCESS (Emerald Green).
 * - If action fails (HALTED / BLOCKED / REJECTED):
 *   Cascades HALTED state to all downstream child nodes.
 * - Never allows a child node to display PAID while its connected upstream node remains in a HALTED/FAILED state.
 */
export function syncBranchStatesOnAction({ nodes = [], edges = [], activeNodeId, actionStatus = 'PAID' }) {
  const isApprovalSuccess = actionStatus === 'PAID' || actionStatus === 'SUCCESS' || actionStatus === 'SENT' || actionStatus === 'VERIFIED';
  const isFailure = actionStatus === 'HALTED' || actionStatus === 'BLOCKED' || actionStatus === 'REJECTED' || actionStatus === 'FAILED';

  const upstreamIds = activeNodeId ? getUpstreamNodeIds(activeNodeId, edges) : new Set();
  const downstreamIds = activeNodeId ? getDownstreamNodeIds(activeNodeId, edges) : new Set();

  return (nodes || []).map((node) => {
    const isTarget = activeNodeId ? String(node.id) === String(activeNodeId) : false;
    const isUpstream = upstreamIds.has(String(node.id));
    const isDownstream = downstreamIds.has(String(node.id));
    const rawType = String(node.type || node.data?.type || node.id || '').toLowerCase();
    const isAgentGuard = rawType.includes('agentguard') || rawType.includes('zk') || rawType.includes('guard');
    const isRazorpay = rawType.includes('razorpay') || rawType.includes('payout');
    const isGmail = rawType.includes('gmail') || rawType.includes('email');
    const isAi = rawType.includes('ai') || rawType.includes('llm');

    if (isApprovalSuccess) {
      if (isTarget || (!activeNodeId && isRazorpay)) {
        return {
          ...node,
          data: {
            ...node.data,
            status: actionStatus,
            payoutStatus: isRazorpay ? 'PAID' : node.data?.payoutStatus,
            isBlocked: false,
            threatBadge: null,
            threatMessage: null,
            isAttacked: false,
            errorMessage: null,
          },
        };
      }
      if (isUpstream || (!activeNodeId && isAgentGuard)) {
        // Clear all upstream error/halt badges and set parent nodes to Emerald Green (GROTH16_VERIFIED / SUCCESS)
        const parentStatus = isAgentGuard ? 'GROTH16_VERIFIED' : 'SUCCESS';
        return {
          ...node,
          data: {
            ...node.data,
            status: parentStatus,
            isPassing: true,
            isVerified: true,
            isAttacked: false,
            isBlocked: false,
            threatBadge: null,
            threatMessage: null,
            threatType: null,
            errorMessage: null,
            breachDeltaINR: 0,
          },
        };
      }
      if (isDownstream) {
        let downstreamStatus = 'SUCCESS';
        if (isRazorpay) downstreamStatus = 'PAID';
        else if (isGmail) downstreamStatus = 'SENT';
        return {
          ...node,
          data: {
            ...node.data,
            status: downstreamStatus,
            payoutStatus: isRazorpay ? 'PAID' : node.data?.payoutStatus,
            isBlocked: false,
            threatBadge: null,
            threatMessage: null,
            isAttacked: false,
            errorMessage: null,
          },
        };
      }
    }

    if (isFailure) {
      if (isTarget || isDownstream) {
        return {
          ...node,
          data: {
            ...node.data,
            status: 'HALTED',
            payoutStatus: isRazorpay ? 'BLOCKED' : node.data?.payoutStatus,
            isBlocked: true,
            threatBadge: node.data?.threatBadge || 'HALTED',
            threatMessage: 'Execution halted: Upstream dependency failed.',
          },
        };
      }
    }

    return node;
  });
}

/**
 * Forcibly purges all previous error, halted, or threat states from nodes and edges,
 * resetting node data payloads to default clean values before starting execution.
 */
export function resetWorkflowExecutionState(nodes = [], edges = [], options = {}) {
  const defaultAmount = options.amount !== undefined ? Number(options.amount) : 4200;
  const defaultMaxLimit = options.maxLimit !== undefined ? Number(options.maxLimit) : 10000;
  const defaultVendor = options.vendor || 'AWS India';

  const cleanedNodes = (nodes || []).map((node) => {
    const rawType = String(node.type || node.data?.type || node.id || '').toLowerCase();
    const isAgentGuard = rawType.includes('agentguard') || rawType.includes('zk') || rawType.includes('guard');
    const isRazorpay = rawType.includes('razorpay') || rawType.includes('payout');
    const isGmail = rawType.includes('gmail') || rawType.includes('email');
    const isAi = rawType.includes('ai') || rawType.includes('llm');

    const cleanData = {
      ...(node.data || {}),
      // Purge all error, threat, and block states
      isAttacked: false,
      isBlocked: false,
      threatBadge: null,
      threatMessage: null,
      threatType: null,
      errorMessage: null,
      breachDeltaINR: 0,
    };

    if (isAgentGuard) {
      cleanData.requestedAmount = defaultAmount;
      cleanData.maxLimit = defaultMaxLimit;
      cleanData.status = defaultAmount <= defaultMaxLimit ? 'GROTH16_VERIFIED' : 'ARMED / READY';
      cleanData.isPassing = defaultAmount <= defaultMaxLimit;
      cleanData.isVerified = defaultAmount <= defaultMaxLimit;
    } else if (isRazorpay) {
      cleanData.amount = defaultAmount;
      cleanData.requestedAmount = defaultAmount;
      cleanData.vendor = defaultVendor;
      cleanData.status = 'READY';
      cleanData.payoutStatus = 'READY';
    } else if (isGmail) {
      cleanData.status = 'READY';
      // Clean simulated leaked payloads
      if (cleanData.payload?.detectedEntities) {
        cleanData.payload = null;
      }
    } else if (isAi) {
      cleanData.status = 'READY';
      // Clean simulated injected prompt payloads
      if (cleanData.payload?.injectedPrompt) {
        cleanData.payload = null;
      }
    } else {
      cleanData.status = 'READY';
    }

    return {
      ...node,
      data: cleanData,
    };
  });

  const cleanedEdges = (edges || []).map((edge) => ({
    ...edge,
    animated: true,
    style: undefined,
  }));

  return { nodes: cleanedNodes, edges: cleanedEdges };
}

/**
 * Propagates node statuses along connected edges:
 * - If AgentGuard passes: connected downstream nodes transition to Emerald Green (SUCCESS / PAID / SENT / VERIFIED).
 * - If AgentGuard fails: connected downstream nodes transition to HALTED with a blocked badge.
 */
export function propagateWorkflowNodeStates({
  nodes = [],
  edges = [],
  isVerified = true,
  threatType = null,
  threatBadge = null,
  errorMessage = null,
}) {
  const agentGuardNode = (nodes || []).find((n) => {
    const t = String(n.type || n.data?.type || n.id || '').toLowerCase();
    return t.includes('agentguard') || t.includes('zk') || t.includes('guard');
  });

  const downstreamIds = agentGuardNode
    ? getDownstreamNodeIds(agentGuardNode.id, edges)
    : new Set();

  return (nodes || []).map((node) => {
    const rawType = String(node.type || node.data?.type || node.id || '').toLowerCase();
    const isAgentGuard = rawType.includes('agentguard') || rawType.includes('zk') || rawType.includes('guard');
    const isDownstream = downstreamIds.has(String(node.id)) ||
      (!agentGuardNode && (rawType.includes('razorpay') || rawType.includes('gmail') || rawType.includes('ai')));

    if (isAgentGuard) {
      return {
        ...node,
        data: {
          ...node.data,
          status: isVerified ? 'GROTH16_VERIFIED' : (threatType === 'PII_DATA_LEAK' ? 'PII_LEAK_PREVENTED' : threatType === 'PROMPT_INJECTION' ? 'PROMPT_INJECTION_DETECTED' : 'CONSTRAINT_VIOLATION'),
          isAttacked: !isVerified,
          isPassing: isVerified,
          isVerified,
          threatType: isVerified ? null : threatType,
        },
      };
    }

    if (isDownstream) {
      if (isVerified) {
        // Success: transition downstream action nodes to Emerald Green
        let successStatus = 'SUCCESS';
        if (rawType.includes('razorpay') || rawType.includes('payout')) successStatus = 'PAID';
        else if (rawType.includes('gmail') || rawType.includes('email')) successStatus = 'SENT';
        else if (rawType.includes('ai') || rawType.includes('llm')) successStatus = 'SUCCESS';

        return {
          ...node,
          data: {
            ...node.data,
            status: successStatus,
            payoutStatus: rawType.includes('razorpay') ? 'PAID' : node.data?.payoutStatus,
            isBlocked: false,
            threatBadge: null,
            threatMessage: null,
          },
        };
      } else {
        // Failure: downstream nodes set to HALTED with blocked badge
        const badgeText = threatBadge || (threatType === 'PII_DATA_LEAK' ? 'PII_LEAK_PREVENTED' : threatType === 'PROMPT_INJECTION' ? 'PROMPT_INJECTION_DETECTED' : 'BUDGET_CEILING_BREACH');
        return {
          ...node,
          data: {
            ...node.data,
            status: 'HALTED',
            payoutStatus: rawType.includes('razorpay') ? 'BLOCKED' : node.data?.payoutStatus,
            isBlocked: true,
            threatBadge: badgeText,
            threatMessage: errorMessage || 'Execution halted: AgentGuard policy constraint violated.',
          },
        };
      }
    }

    return node;
  });
}

/**
 * Save handler for workflows that serializes nodes and edges before sending POST or PUT request.
 */
export async function handleWorkflowSave({ id, workflowId, payload = {}, nodes = [], edges = [] }) {
  const targetId = id || workflowId;
  const { nodes: serializedNodes, edges: serializedEdges } = serializeWorkflowPayload(nodes, edges);

  const requestBody = {
    ...payload,
    nodes: serializedNodes,
    edges: serializedEdges,
  };

  if (targetId) {
    const res = await api.put(`/workflows/${targetId}`, requestBody);
    return res.data;
  }
  const res = await api.post('/workflows', requestBody);
  return res.data;
}

export default function CanvasContainer({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  nodeTypes,
  onConnect,
  onNodeClick,
  fitView = true,
  onAttackTriggered,
  onSave,
  children,
}) {
  const handleSave = useCallback(async (extraPayload = {}) => {
    if (onSave) {
      const { nodes: sNodes, edges: sEdges } = serializeWorkflowPayload(nodes, edges);
      return onSave({ nodes: sNodes, edges: sEdges, ...extraPayload });
    }
  }, [nodes, edges, onSave]);

  return (
    <div className="w-full h-full bg-[#0B0F17] relative rounded-2xl overflow-hidden border border-slate-800/80">
      {/* Interactive Threat Simulator Control */}
      {onAttackTriggered && (
        <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 30 }}>
          <AttackSimulatorButton onAttackTriggered={onAttackTriggered} />
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{ type: 'animatedGlow' }}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        fitView={fitView}
      >
        {/* Modern Dot Grid Background */}
        <Background color="#334155" gap={24} size={1.5} variant="dots" />
        <Controls className="glass-panel !border-slate-800 !bg-slate-900/80 !text-slate-200 rounded-xl" />
        {children}
      </ReactFlow>
    </div>
  );
}
