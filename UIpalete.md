SPECIFICATION SHEET: UI ENGINE & MODERN DESIGN SYSTEM OVERHAUL
Target System: Agentflow_AI Platform Expansion

Directive: Upgrade the global frontend styling system to an enterprise-grade dark aesthetic inspired by Linear, Vercel, and Shadcn UI. Implement glassmorphism cards, glowing status borders, animated React Flow connection edges, monospace code formatting, and micro-animations across all pages without changing any existing business logic or backend API routes.

1. DESIGN TOKENS & COLOR PALETTE
Plaintext
Background Base:    #0B0F17 (Deep Obsidian Slate)
Card Background:    #111827 / 70% opacity + backdrop-blur-md
Border Base:        #1E293B (Slate 800)
Border Highlight:   #38BDF8 (Electric Cyan)
Status Colors:
  - Valid / Paid:   #10B981 (Emerald Green + Subtle Ambient Glow)
  - Pending / HITL: #F59E0B (Amber Gold + Pulse Animation)
  - Violation:      #F43F5E (Rose Red + High-Contrast Flash)
Typography:
  - Sans Headings:  Plus Jakarta Sans / Inter
  - Tech / Hashes:  JetBrains Mono / Fira Code
2. FILE CREATIONS & MODIFICATIONS
Plaintext
Agentflow_AI/
└── client/
    └── src/
        ├── app/
        │   └── globals.css                # [MODIFY] Global Tailwind CSS design tokens & animations
        └── components/
            ├── Common/
            │   ├── GlassCard.jsx          # [NEW] Reusable glassmorphic container
            │   └── StatusBadge.jsx        # [NEW] Glowing pill component
            └── WorkflowCanvas/
                ├── CanvasContainer.jsx    # [MODIFY] Apply dot grid & glow styling
                └── edges/
                    └── AnimatedGlowEdge.jsx # [NEW] Custom animated React Flow connection wire
3. IMPLEMENTATION DETAILS
Phase 1: Global CSS Tokens & Keyframe Animations — client/src/app/globals.css
Inject custom utilities, glow classes, and keyframe animations into your global styles.

CSS
@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';

@layer base {
  body {
    background-color: #0b0f17;
    color: #f8fafc;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
}

/* Custom Glassmorphism Utility */
.glass-panel {
  background: rgba(17, 24, 39, 0.65);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

/* Glowing Border Effects */
.glow-emerald {
  box-shadow: 0 0 20px -3px rgba(16, 185, 129, 0.3);
}

.glow-cyan {
  box-shadow: 0 0 20px -3px rgba(56, 189, 248, 0.3);
}

.glow-rose {
  box-shadow: 0 0 25px -2px rgba(244, 63, 94, 0.4);
}

/* Flow Line Animation */
@keyframes dashdraw {
  to {
    stroke-dashoffset: -20;
  }
}

.animated-edge-path {
  stroke-dasharray: 5;
  animation: dashdraw 0.8s linear infinite;
}
Phase 2: Reusable Glass Component — client/src/components/Common/GlassCard.jsx
Create a standardized glassmorphic container to wrap all cards and dashboard sections.

JavaScript
import React from 'react';

export default function GlassCard({ children, className = '', hoverEffect = true, glowColor = 'none' }) {
  const getGlowClass = () => {
    if (glowColor === 'emerald') return 'glow-emerald border-emerald-500/30';
    if (glowColor === 'cyan') return 'glow-cyan border-cyan-500/30';
    if (glowColor === 'rose') return 'glow-rose border-rose-500/30';
    return 'border-slate-800/80';
  };

  return (
    <div
      className={`glass-panel rounded-2xl p-5 border transition-all duration-300 ease-out ${
        hoverEffect ? 'hover:scale-[1.01] hover:border-slate-700' : ''
      } ${getGlowClass()} ${className}`}
    >
      {children}
    </div>
  );
}
Phase 3: Animated Canvas Edge — client/src/components/WorkflowCanvas/edges/AnimatedGlowEdge.jsx
Upgrade connection lines on your React Flow canvas so execution pulses run along the wires.

JavaScript
import React from 'react';
import { getBezierPath } from '@xyflow/react';

export default function AnimatedGlowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      {/* Background Ambient Glow Line */}
      <path
        id={`${id}-glow`}
        d={edgePath}
        fill="none"
        stroke="#38BDF8"
        strokeWidth={4}
        strokeOpacity={0.25}
        className="blur-[2px]"
      />
      {/* Active Moving Particle Line */}
      <path
        id={id}
        style={style}
        className="animated-edge-path stroke-cyan-400"
        d={edgePath}
        strokeWidth={2}
        fill="none"
        markerEnd={markerEnd}
      />
    </>
  );
}
Phase 4: Canvas Background Dot Grid — CanvasContainer.jsx
Update your React Flow canvas background to use a high-tech dot grid pattern with glow overrides.

JavaScript
import React from 'react';
import { ReactFlow, Background, Controls } from '@xyflow/react';
import AnimatedGlowEdge from './edges/AnimatedGlowEdge';

const edgeTypes = {
  animatedGlow: AnimatedGlowEdge,
};

export default function CanvasContainer({ nodes, edges, onNodesChange, onEdgesChange }) {
  return (
    <div className="w-full h-full bg-[#0B0F17] relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{ type: 'animatedGlow' }}
        fitView
      >
        {/* Modern Dot Grid Background */}
        <Background color="#334155" gap={24} size={1.5} variant="dots" />
        <Controls className="glass-panel !border-slate-800 !bg-slate-900/80 !text-slate-200 rounded-xl" />
      </ReactFlow>
    </div>
  );
}