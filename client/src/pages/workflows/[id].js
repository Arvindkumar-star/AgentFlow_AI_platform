import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Play, Save } from 'lucide-react';
import { ReactFlowProvider } from '@xyflow/react';
import ProtectedRoute from '../../components/ProtectedRoute';
import AppShell, { PageHeading, StatusBadge } from '../../components/AppShell';
import WorkflowCanvas from '../../components/WorkflowCanvas';
import NodePalette from '../../components/NodePalette';
import NodeConfigPanel from '../../components/NodeConfigPanel';
import ApprovalModal from '../../components/ApprovalModal';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import {
  serializeWorkflowPayload,
  resetWorkflowExecutionState,
  propagateWorkflowNodeStates,
  syncBranchStatesOnAction,
} from '../../components/WorkflowCanvas/CanvasContainer';

function EditorInner({ id }) {
  const router = useRouter();
  const [workflow, setWorkflow] = useState(null);
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [approvalModalData, setApprovalModalData] = useState(null);

  const handleApproved = useCallback((evt) => {
    const d = evt?.detail || evt || {};
    setWorkflow((wf) => {
      if (!wf?.nodes) return wf;
      // Global Cascading Node State Synchronization:
      // Clear upstream error/halt badges on parent nodes, setting them to GROTH16_VERIFIED, and active node to PAID
      const updatedNodes = syncBranchStatesOnAction({
        nodes: wf.nodes,
        edges: wf.edges,
        activeNodeId: d.nodeId,
        actionStatus: 'PAID',
      });
      return { ...wf, nodes: updatedNodes };
    });
  }, []);

  const handlePending = useCallback((evt) => {
    const d = evt?.detail || evt || {};
    if (d.nodeId) {
      setWorkflow((wf) => {
        if (!wf?.nodes) return wf;
        const updatedNodes = wf.nodes.map((n) => {
          if (n.id === d.nodeId) {
            return {
              ...n,
              data: {
                ...n.data,
                payoutStatus: 'PENDING_APPROVAL',
                status: 'PENDING_APPROVAL',
                payoutId: d.payoutId,
                amount: d.amount || n.data?.amount,
                vendor: d.vendor || n.data?.vendor,
              }
            };
          }
          return n;
        });
        return { ...wf, nodes: updatedNodes };
      });

      // Automatically open the OTP Approval Modal!
      setApprovalModalData({
        payoutId: d.payoutId,
        nodeId: d.nodeId,
        amount: d.amount,
        vendor: d.vendor || 'AWS India',
        accountNumber: '11214311215411',
        mode: 'NEFT',
      });
    }
  }, []);

  const handleRejected = useCallback((evt) => {
    const d = evt?.detail || evt || {};
    setWorkflow((wf) => {
      if (!wf?.nodes) return wf;
      const updatedNodes = wf.nodes.map((n) => {
        const isMatch = Boolean(d.nodeId ? n.id === d.nodeId : (d.payoutId ? n.data?.payoutId === d.payoutId : false));
        if (isMatch) {
          return {
            ...n,
            data: {
              ...n.data,
              payoutStatus: 'REJECTED',
              status: 'REJECTED',
            },
          };
        }
        return n;
      });
      return { ...wf, nodes: updatedNodes };
    });
  }, []);

  useEffect(() => {
    if (id) {
      api.get(`/workflows/${id}`)
        .then(r => {
          const wf = r.data.workflow;
          if (wf?.nodes) {
            // Normalize nodes to clean initial idle states so they are clean and neutral on open
            const { nodes: cleanedNodes, edges: cleanedEdges } = resetWorkflowExecutionState(
              wf.nodes,
              wf.edges || [],
              { amount: 4200, maxLimit: 10000 }
            );
            wf.nodes = cleanedNodes;
            wf.edges = cleanedEdges;
          }
          setWorkflow(wf);
        })
        .catch(() => {});
    }

    const socket = getSocket();
    socket.connect();

    socket.on('payout_approved', handleApproved);
    socket.on('payout:approved', handleApproved);
    socket.on('payout_pending', handlePending);
    socket.on('payout_rejected', handleRejected);
    if (typeof window !== 'undefined') {
      window.addEventListener('payout-approved', handleApproved);
      window.addEventListener('payout-pending', handlePending);
    }

    return () => {
      socket.off('payout_approved', handleApproved);
      socket.off('payout:approved', handleApproved);
      socket.off('payout_pending', handlePending);
      socket.off('payout_rejected', handleRejected);
      if (typeof window !== 'undefined') {
        window.removeEventListener('payout-approved', handleApproved);
        window.removeEventListener('payout-pending', handlePending);
      }
    };
  }, [id, handleApproved, handlePending, handleRejected]);

  const handleChange = ({ nodes, edges }) =>
    setWorkflow(wf => wf ? { ...wf, nodes, edges } : null);

  const handleAddNode = (type, label) => {
    const nodeLabel = (type === 'razorpay' || type === 'razorpay_payout' || type === 'payout') ? 'Razorpay Vendor Payout' : label;
    const defaultData = { type, label: nodeLabel };
    if (type === 'agentGuard' || type === 'agent_guard') {
      defaultData.maxLimit = 1000;
      defaultData.requestedAmount = 500;
      defaultData.targetMerchantId = 1;
      defaultData.allowedMerchantId = 1;
    }
    if (type === 'razorpay' || type === 'razorpay_payout' || type === 'payout') {
      defaultData.amount = 500;
      defaultData.vendor = 'AWS India';
      defaultData.accountNumber = '11214311215411';
      defaultData.mode = 'NEFT';
    }
    const node = {
      id: `${type}-${Date.now()}`,
      type,
      label: nodeLabel,
      data: defaultData,
      position: { x: 200 + (workflow?.nodes?.length || 0) * 60, y: 200 },
    };
    setWorkflow(wf => wf ? { ...wf, nodes: [...(wf.nodes || []), node] } : null);
  };

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    const type  = event.dataTransfer.getData('application/agentflow-node-type');
    const label = event.dataTransfer.getData('application/agentflow-node-label');
    if (!type || !workflow) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const position = {
      x: event.clientX - bounds.left - 80,
      y: event.clientY - bounds.top  - 40,
    };
    const nodeLabel = (type === 'razorpay' || type === 'razorpay_payout' || type === 'payout') ? 'Razorpay Vendor Payout' : label;
    const defaultData = { type, label: nodeLabel };
    if (type === 'agentGuard' || type === 'agent_guard') {
      defaultData.maxLimit = 1000;
      defaultData.requestedAmount = 500;
      defaultData.targetMerchantId = 1;
      defaultData.allowedMerchantId = 1;
    }
    if (type === 'razorpay' || type === 'razorpay_payout' || type === 'payout') {
      defaultData.amount = 500;
      defaultData.vendor = 'AWS India';
      defaultData.accountNumber = '11214311215411';
      defaultData.mode = 'NEFT';
    }
    const newNode = {
      id: `${type}-${Date.now()}`,
      type, label: nodeLabel,
      position,
      data: defaultData,
    };
    setWorkflow(wf => ({ ...wf, nodes: [...(wf.nodes || []), newNode] }));
  }, [workflow]);

  const handleSave = async () => {
    if (!workflow) return;
    setBusy(true);
    try {
      const { nodes: serializedNodes, edges: serializedEdges } = serializeWorkflowPayload(
        workflow.nodes || [],
        workflow.edges || []
      );
      const { data } = await api.put(`/workflows/${id}`, {
        name: workflow.name,
        description: workflow.description,
        nodes: serializedNodes,
        edges: serializedEdges,
      });
      setWorkflow(data.workflow);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      alert(e.response?.data?.message || 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  const handleExecute = async () => {
    setBusy(true);
    try {
      // 1. Dispatch event to forcibly purge all previous error, halted, or threat states & reset simulation
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('workflow-run-start'));
        window.dispatchEvent(new CustomEvent('zk-simulation-reset'));
      }

      // 2. Discover requested amount and ceiling
      let dynRequestedAmount = null;
      let dynMaxLimit = null;
      let dynVendor = null;

      // Prioritize active selected node values
      if (selected?.data) {
        const amt = Number(selected.data.amount ?? selected.data.requestedAmount);
        if (!isNaN(amt) && amt > 0) {
          dynRequestedAmount = amt;
        }
        if (selected.data.maxLimit) {
          dynMaxLimit = Number(selected.data.maxLimit);
        }
        if (selected.data.vendor) {
          dynVendor = selected.data.vendor;
        }
      }

      (workflow?.nodes || []).forEach(n => {
        const t = String(n.type || n.data?.type || n.id || '').toLowerCase();
        
        // Check AgentGuard ceiling and requestedAmount
        if (t.includes('agentguard') || t.includes('zk') || t.includes('guard')) {
          if (!dynMaxLimit && n.data?.maxLimit !== undefined && n.data?.maxLimit !== null) {
            dynMaxLimit = Number(n.data.maxLimit);
          }
          if (dynRequestedAmount === null && n.data?.requestedAmount !== undefined && n.data?.requestedAmount !== null) {
            dynRequestedAmount = Number(n.data.requestedAmount);
          }
        }

        // Check Razorpay payout amount
        if (t.includes('razorpay') || t.includes('payout')) {
          const amt = Number(n.data?.amount ?? n.data?.requestedAmount);
          if (!isNaN(amt) && amt > 0 && dynRequestedAmount === null) {
            dynRequestedAmount = amt;
          }
          if (!dynVendor && n.data?.vendor) {
            dynVendor = n.data.vendor;
          }
        }

        if (t.includes('invoice') || t.includes('email') || t.includes('trigger')) {
          const amt = Number(n.data?.amount ?? n.data?.invoiceTotal ?? n.data?.requestedAmount);
          if (!isNaN(amt) && amt > 0 && dynRequestedAmount === null) {
            dynRequestedAmount = amt;
          }
        }
      });

      const effectiveAmount = dynRequestedAmount !== null ? dynRequestedAmount : 4200;
      const effectiveMaxLimit = dynMaxLimit !== null ? dynMaxLimit : 10000;
      const effectiveVendor = dynVendor || 'AWS India';
      const isPolicyViolation = effectiveAmount > effectiveMaxLimit;

      // 3. Forcibly purge previous error/threat states & reset clean payload values
      const { nodes: cleanedNodes, edges: cleanedEdges } = resetWorkflowExecutionState(
        workflow?.nodes || [],
        workflow?.edges || [],
        {
          amount: effectiveAmount,
          maxLimit: effectiveMaxLimit,
          vendor: effectiveVendor,
        }
      );

      // 4. Downstream & Parent Node State Syncing:
      // If AgentGuard passes (Green): connected downstream nodes update to Green (PAID / SENT / SUCCESS / VERIFIED).
      // If AgentGuard fails (Red): connected downstream nodes set status: "HALTED" with blocked visual badge.
      const synchronizedNodes = propagateWorkflowNodeStates({
        nodes: cleanedNodes,
        edges: cleanedEdges,
        isVerified: !isPolicyViolation,
        errorMessage: isPolicyViolation ? `Requested ₹${Number(effectiveAmount || 0).toLocaleString('en-IN')} exceeds policy ceiling ₹${Number(effectiveMaxLimit || 0).toLocaleString('en-IN')}` : null,
      });

      // Find the target downstream Razorpay node (if any)
      const targetRazorpayNode = synchronizedNodes.find(n => {
        const t = String(n.type || n.data?.type || n.id || '').toLowerCase();
        return t.includes('razorpay') || t.includes('payout');
      });

      setWorkflow(wf => ({
        ...wf,
        nodes: synchronizedNodes,
        edges: cleanedEdges,
      }));

      // 5. Trigger execution with dynamic invoice payload
      const dynamicPayload = {
        requestedAmount: effectiveAmount,
        maxLimit: effectiveMaxLimit,
        amount: effectiveAmount,
        vendor: effectiveVendor,
        vendor_name: effectiveVendor,
      };

      const r = await api.post(`/workflows/${id}/execute`, {
        inputs: dynamicPayload,
      });

      const execId = r.data?.execution?._id || r.data?.executionId || r.data?.id || r.data?._id;

      if (isPolicyViolation) {
        // If policy violation, open the Proof Inspector Drawer to show the intercepted violation
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('zk-threat-simulated', {
            detail: {
              attackScenario: 'custom_overlimit',
              requestedAmount: effectiveAmount,
              maxLimit: effectiveMaxLimit,
              breachDeltaINR: effectiveAmount - effectiveMaxLimit,
              errorMessage: `Requested ₹${Number(effectiveAmount || 0).toLocaleString('en-IN')} exceeds policy ceiling ₹${Number(effectiveMaxLimit || 0).toLocaleString('en-IN')}`,
            }
          }));
        }
      } else if (execId) {
        // Automatic Execution Page Navigation: immediately redirect to live execution view
        router.push(`/executions/${execId}`);
        return;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      alert(e.response?.data?.message || 'Execution failed');
    } finally {
      setBusy(false);
    }
  };

  const handleNodeSave = (updated) => {
    setWorkflow(wf => ({
      ...wf,
      nodes: (wf.nodes || []).map(n => n.id === updated.id ? updated : n),
    }));
    setSelected(updated);
  };

  if (!workflow) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', opacity: 0.3 }}>⬡</div>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.75rem' }}>Loading workflow…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeading
        eyebrow="Canvas editor"
        title={workflow.name}
        description={workflow.description}
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            {saved && <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 500 }}>✓ Saved</span>}
            <StatusBadge status={workflow.status} />
            <button className="button-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={handleSave} disabled={busy}>
              <Save size={15} />
              {busy ? 'Saving…' : 'Save changes'}
            </button>
            <button className="button" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={handleExecute}>
              <Play size={14} />
              Run workflow
            </button>
          </div>
        }
      />

      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '220px 1fr 240px', alignItems: 'start' }}>
        <NodePalette onAdd={handleAddNode} />
        <WorkflowCanvas
          nodes={workflow.nodes || []}
          edges={workflow.edges || []}
          onChange={handleChange}
          onSelect={setSelected}
          onDrop={handleDrop}
        />
        <NodeConfigPanel node={selected} onSave={handleNodeSave} />
      </div>

      <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-faint)', display: 'flex', gap: '1rem' }}>
        <span>{workflow.nodes?.length || 0} nodes</span>
        <span>{workflow.edges?.length || 0} edges</span>
        <span>v{workflow.version || 1}</span>
      </div>

      {approvalModalData && (
        <ApprovalModal
          isOpen={Boolean(approvalModalData)}
          payout={approvalModalData}
          onClose={() => setApprovalModalData(null)}
          onApproved={(p) => {
            handleApproved({
              nodeId: approvalModalData.nodeId,
              payoutId: p?.payoutId || approvalModalData.payoutId,
              status: 'PAID',
            });
            setApprovalModalData(null);
          }}
          onRejected={() => setApprovalModalData(null)}
        />
      )}
    </>
  );
}

export default function Editor() {
  const router = useRouter();
  const { id } = router.query;

  return (
    <ProtectedRoute>
      <AppShell title="Workflow editor">
        <ReactFlowProvider>
          <EditorInner id={id} />
        </ReactFlowProvider>
      </AppShell>
    </ProtectedRoute>
  );
}
