import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Save, Play, Tag, ChevronDown, Wand2 } from 'lucide-react';
import { useReactFlow, ReactFlowProvider } from '@xyflow/react';
import ProtectedRoute from '../../components/ProtectedRoute';
import AppShell, { PageHeading } from '../../components/AppShell';
import WorkflowCanvas from '../../components/WorkflowCanvas';
import NodePalette from '../../components/NodePalette';
import NodeConfigPanel from '../../components/NodeConfigPanel';
import ApprovalModal from '../../components/ApprovalModal';
import { useWorkflowStore } from '../../store/workflowStore';
import { getSocket } from '../../services/socket';
import {
  serializeWorkflowPayload,
  resetWorkflowExecutionState,
  propagateWorkflowNodeStates,
} from '../../components/WorkflowCanvas/CanvasContainer';

// ── WorkflowToolbar ──────────────────────────────────────────────────────────
function WorkflowToolbar({ name, onNameChange, tags, onTagsChange, onSave, onRun, busy, saved }) {
  const [tagsOpen, setTagsOpen] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const addTag = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().replace(',', '');
      if (!tags.includes(newTag)) onTagsChange([...tags, newTag]);
      setTagInput('');
    }
  };
  const removeTag = (t) => onTagsChange(tags.filter(x => x !== t));

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.75rem',
      padding: '0.75rem 1rem',
      background: 'var(--bg-panel)',
      border: '1px solid var(--border)',
      borderRadius: '0.875rem',
      marginBottom: '1rem',
      flexWrap: 'wrap',
    }}>
      <input
        value={name}
        onChange={e => onNameChange(e.target.value)}
        placeholder="Workflow name…"
        style={{
          flex: '1 1 200px', minWidth: '160px',
          background: 'var(--bg-panel-muted)',
          border: '1px solid var(--border)',
          borderRadius: '0.625rem', padding: '0.5rem 0.75rem',
          fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)',
          outline: 'none',
        }}
        onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
        onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
      />

      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setTagsOpen(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            border: '1px solid var(--border)', borderRadius: '0.625rem',
            padding: '0.5rem 0.75rem', background: 'transparent',
            color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <Tag size={14} />
          Tags {tags.length > 0 && `(${tags.length})`}
          <ChevronDown size={13} style={{ transition: 'transform 0.2s', transform: tagsOpen ? 'rotate(180deg)' : 'none' }} />
        </button>

        {tagsOpen && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 50,
            background: 'var(--bg-panel)', border: '1px solid var(--border)',
            borderRadius: '0.75rem', padding: '0.75rem', minWidth: '220px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: tags.length ? '0.5rem' : 0 }}>
              {tags.map(t => (
                <span key={t} style={{
                  display: 'flex', alignItems: 'center', gap: '0.3rem',
                  background: 'var(--accent-bg)', color: 'var(--accent)',
                  borderRadius: '999px', padding: '0.15rem 0.5rem', fontSize: '0.72rem', fontWeight: 600,
                }}>
                  {t}
                  <button onClick={() => removeTag(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, lineHeight: 1 }}>×</button>
                </span>
              ))}
            </div>
            <input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={addTag}
              placeholder="Type tag + Enter"
              style={{
                width: '100%', background: 'var(--bg-panel-muted)', border: '1px solid var(--border)',
                borderRadius: '0.5rem', padding: '0.4rem 0.625rem', fontSize: '0.8rem',
                color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
        )}
      </div>

      <div style={{ flex: 1 }} />
      {saved && <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 500 }}>✓ Saved</span>}

      <button className="button-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }} onClick={onSave} disabled={busy}>
        <Save size={15} />
        {busy === 'saving' ? 'Saving…' : 'Save draft'}
      </button>

      <button className="button" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }} onClick={onRun} disabled={busy}>
        <Play size={14} />
        {busy === 'running' ? 'Launching…' : 'Run workflow'}
      </button>
    </div>
  );
}

// ── Builder inner (needs ReactFlow context) ──────────────────────────────────
function BuilderInner() {
  const router = useRouter();
  const { generate, execute } = useWorkflowStore();
  const canvasRef = useRef(null);

  const [prompt, setPrompt]     = useState('');
  const [workflow, setWorkflow] = useState(null);
  const [name, setName]         = useState('');
  const [tags, setTags]         = useState([]);
  const [busy, setBusy]         = useState(false);
  const [saved, setSaved]       = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
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

  // Real-time canvas sync for HITL Payout approvals
  useEffect(() => {
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
  }, [handleApproved, handlePending, handleRejected]);

  // Generate from prompt
  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setBusy('generating');
    try {
      const data = await generate(prompt);
      setWorkflow(data.workflow);
      setName(data.workflow?.name || 'Generated workflow');
      setTags([]);
      setSaved(false);
      setSelectedNode(null);
    } catch (e) {
      alert(e.response?.data?.message || 'Generation failed');
    } finally {
      setBusy(false);
    }
  };

  // Save draft
  const handleSave = async () => {
    if (!workflow) return;
    setBusy('saving');
    try {
      let savedWf;
      const wfName = name.trim() || workflow.name || 'Untitled workflow';
      const { nodes: serializedNodes, edges: serializedEdges } = serializeWorkflowPayload(
        workflow.nodes || [],
        workflow.edges || []
      );
      if (workflow._id) {
        savedWf = await useWorkflowStore.getState().update(workflow._id, {
          name: wfName,
          tags,
          nodes: serializedNodes,
          edges: serializedEdges,
        });
      } else {
        savedWf = await useWorkflowStore.getState().create({
          name: wfName,
          tags,
          nodes: serializedNodes,
          edges: serializedEdges,
        });
        setWorkflow(savedWf);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      return savedWf;
    } catch (e) {
      alert(e.response?.data?.message || 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  // Run
  const handleRun = async () => {
    if (!workflow) return;
    setBusy('running');
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

      (workflow.nodes || []).forEach((n) => {
        const t = String(n.type || n.data?.type || n.id || '').toLowerCase();
        
        // Check AgentGuard ceiling and requestedAmount
        if (t.includes('agentguard') || t.includes('zk') || t.includes('guard')) {
          if (n.data?.maxLimit !== undefined && n.data?.maxLimit !== null) {
            dynMaxLimit = Number(n.data.maxLimit);
          }
          if (n.data?.requestedAmount !== undefined && n.data?.requestedAmount !== null) {
            const amt = Number(n.data.requestedAmount);
            if (amt > 0 && (amt !== 4200 || dynRequestedAmount === null)) {
              dynRequestedAmount = amt;
            }
          }
        }

        // Check Razorpay payout amount
        if (t.includes('razorpay') || t.includes('payout')) {
          const amt = Number(n.data?.amount ?? n.data?.requestedAmount);
          if (!isNaN(amt) && amt > 0) {
            if (amt !== 4200 || dynRequestedAmount === null) {
              dynRequestedAmount = amt;
            }
          }
          if (n.data?.vendor) {
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
        workflow.nodes || [],
        workflow.edges || [],
        {
          amount: effectiveAmount,
          maxLimit: effectiveMaxLimit,
          vendor: effectiveVendor,
        }
      );

      // 4. Propagate Downstream & Parent Node States along connected edges:
      const normalizedNodes = propagateWorkflowNodeStates({
        nodes: cleanedNodes,
        edges: cleanedEdges,
        isVerified: !isPolicyViolation,
        errorMessage: isPolicyViolation ? `Requested ₹${Number(effectiveAmount || 0).toLocaleString('en-IN')} exceeds policy ceiling ₹${Number(effectiveMaxLimit || 0).toLocaleString('en-IN')}` : null,
      });

      // Find the target downstream Razorpay node (if any)
      const targetRazorpayNode = normalizedNodes.find(n => {
        const t = String(n.type || n.data?.type || n.id || '').toLowerCase();
        return t.includes('razorpay') || t.includes('payout');
      });

      setWorkflow((wf) => ({ ...wf, nodes: normalizedNodes, edges: cleanedEdges }));

      let targetId = workflow._id;
      const wfName = name.trim() || workflow.name || 'Untitled workflow';
      if (!targetId) {
        const savedWf = await useWorkflowStore.getState().create({
          name: wfName,
          tags,
          nodes: normalizedNodes,
          edges: cleanedEdges,
        });
        setWorkflow(savedWf);
        targetId = savedWf._id;
      } else {
        await useWorkflowStore.getState().update(targetId, {
          name: wfName,
          tags,
          nodes: normalizedNodes,
          edges: cleanedEdges,
        });
      }

      const dynamicPayload = {
        requestedAmount: effectiveAmount,
        maxLimit: effectiveMaxLimit,
        amount: effectiveAmount,
        vendor: effectiveVendor,
        vendor_name: effectiveVendor,
      };

      const exec = await execute(targetId, dynamicPayload);
      const execId = exec?._id || exec?.executionId || exec?.id || exec?.data?._id;

      if (!isPolicyViolation && execId) {
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

  // Canvas changes
  const handleCanvasChange = ({ nodes, edges }) => {
    setWorkflow(wf => wf ? { ...wf, nodes, edges } : null);
  };

  // Add node from palette (click)
  const handleAddNode = (type, label) => {
    const id = `${type}-${Date.now()}`;
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
      id,
      type,
      label: nodeLabel,
      position: { x: 200 + Math.random() * 200, y: 200 + Math.random() * 100 },
      data: defaultData,
    };
    setWorkflow(wf => {
      const base = wf || { nodes: [], edges: [], name: 'Untitled workflow', _id: null };
      return { ...base, nodes: [...(base.nodes || []), newNode] };
    });
    if (!workflow) setName('Untitled workflow');
  };

  // Drop node from palette onto canvas
  const handleDrop = useCallback((event) => {
    event.preventDefault();
    const type  = event.dataTransfer.getData('application/agentflow-node-type');
    const label = event.dataTransfer.getData('application/agentflow-node-label');
    if (!type) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const position = {
      x: event.clientX - bounds.left - 80,
      y: event.clientY - bounds.top  - 40,
    };
    const id = `${type}-${Date.now()}`;
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
    const newNode = { id, type, label: nodeLabel, position, data: defaultData };
    setWorkflow(wf => {
      const base = wf || { nodes: [], edges: [], name: 'Untitled workflow', _id: null };
      return { ...base, nodes: [...(base.nodes || []), newNode] };
    });
    if (!workflow) setName('Untitled workflow');
  }, [workflow]);

  // Node config save
  const handleNodeSave = (updated) => {
    setWorkflow(wf => ({
      ...wf,
      nodes: (wf.nodes || []).map(n => n.id === updated.id ? updated : n),
    }));
    setSelectedNode(updated);
  };

  const hasWorkflow = !!workflow;

  return (
    <div>
      <PageHeading
        eyebrow="Prompt to graph"
        title="Describe an operation."
        description="The agent planner will turn your intent into an executable workflow."
      />

      {/* ── Prompt input panel ── */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
        <textarea
          className="input"
          style={{ minHeight: '6rem', resize: 'vertical' }}
          placeholder="e.g. When a new invoice arrives, append it to Google Sheets and notify Slack…"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => e.ctrlKey && e.key === 'Enter' && handleGenerate()}
        />
        <div style={{ marginTop: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>Ctrl+Enter to generate</span>
          <button
            className="button"
            onClick={handleGenerate}
            disabled={!!busy || !prompt.trim()}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Wand2 size={15} />
            {busy === 'generating' ? 'Generating graph…' : 'Generate workflow'}
          </button>
        </div>
      </div>

      {/* ── Canvas + palette + config (3-col layout) ── */}
      <div>
        {hasWorkflow && (
          <WorkflowToolbar
            name={name}
            onNameChange={setName}
            tags={tags}
            onTagsChange={setTags}
            onSave={handleSave}
            onRun={handleRun}
            busy={busy}
            saved={saved}
          />
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 240px', gap: '1rem', alignItems: 'start' }}>
          {/* Left: Node palette */}
          <div style={{ minWidth: 0 }}>
            <NodePalette onAdd={handleAddNode} />
          </div>

          {/* Center: Canvas */}
          <div ref={canvasRef} style={{ minWidth: 0 }}>
            {hasWorkflow && (
              <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontWeight: 600, margin: 0, fontSize: '0.95rem' }}>{name}</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.1rem 0 0' }}>
                    {workflow.nodes?.length || 0} nodes · {workflow.edges?.length || 0} edges · draft
                  </p>
                </div>
                <button
                  className="button-secondary"
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', marginLeft: 'auto' }}
                  onClick={() => workflow._id && router.push(`/workflows/${workflow._id}`)}
                  disabled={!workflow._id}
                >
                  Open editor →
                </button>
              </div>
            )}
            <WorkflowCanvas
              nodes={workflow?.nodes || []}
              edges={workflow?.edges || []}
              onChange={handleCanvasChange}
              onSelect={setSelectedNode}
              onDrop={handleDrop}
            />
          </div>

          {/* Right: Node config panel */}
          <div style={{ minWidth: 0 }}>
            <NodeConfigPanel node={selectedNode} onSave={handleNodeSave} />
          </div>
        </div>
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
    </div>
  );
}

// ── Page wrapper (ReactFlowProvider required) ────────────────────────────────
export default function Builder() {
  return (
    <ProtectedRoute>
      <AppShell title="AI workflow builder">
        <ReactFlowProvider>
          <BuilderInner />
        </ReactFlowProvider>
      </AppShell>
    </ProtectedRoute>
  );
}
