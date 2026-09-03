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
