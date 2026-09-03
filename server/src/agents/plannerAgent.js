/**
 * Planner Agent
 * Determines node execution order and emits a confidence score.
 * Pure — no HTTP, no Mongo calls.
 */

function plannerAgent(workflow) {
  const { nodes, edges } = workflow;

  // Build adjacency list
  const adj = {};
  nodes.forEach((n) => { adj[n.id] = []; });
  edges.forEach((e) => {
    if (adj[e.source]) adj[e.source].push(e.target);
  });

  // Find start nodes (no incoming edges)
  const hasIncoming = new Set(edges.map((e) => e.target));
  const startNodes = nodes.filter((n) => !hasIncoming.has(n.id));

  // Topological sort (BFS)
  const order = [];
  const visited = new Set();
  const queue = [...startNodes.map((n) => n.id)];

  while (queue.length > 0) {
    const current = queue.shift();
    if (visited.has(current)) continue;
    visited.add(current);
    order.push(current);
    (adj[current] || []).forEach((next) => {
      if (!visited.has(next)) queue.push(next);
    });
  }

  // Add any unvisited nodes (disconnected)
  nodes.forEach((n) => {
    if (!visited.has(n.id)) order.push(n.id);
  });

  // Build node map for output
  const nodeMap = {};
  nodes.forEach((n) => { nodeMap[n.id] = n; });

  const plan = order.map((id, index) => ({
    step: index + 1,
    nodeId: id,
    node: nodeMap[id],
  }));

  const confidenceScore = plan.length > 0 ? Math.min(0.95, 0.7 + plan.length * 0.05) : 0.5;

  return { plan, confidenceScore, totalSteps: plan.length };
}

module.exports = { plannerAgent };
