import React, { useRef, useState } from 'react';

/**
 * Premium glassmorphism card component with 3D tilt effects on cursor hover.
 */
export default function Card({ 
  children, 
  enableTilt = true, 
  onClick,
  className = '', 
  ...props 
}) {
  const cardRef = useRef(null);
  const [transform, setTransform] = useState('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');

  const handleMouseMove = (e) => {
    if (!enableTilt || !cardRef.current) return;
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();

    // Mouse coordinates relative to card element
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Normalize coordinates from -0.5 to 0.5
    const normX = (x / rect.width) - 0.5;
    const normY = (y / rect.height) - 0.5;

    // Max rotation in degrees
    const maxTilt = 8;
    const rotY = (normX * maxTilt).toFixed(2);
    const rotX = (-normY * maxTilt).toFixed(2);

    setTransform(`perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.02, 1.02, 1.02)`);
  };

  const handleMouseLeave = () => {
    if (!enableTilt) return;
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        transform,
        transition: 'transform 0.15s cubic-bezier(0.25, 0.8, 0.25, 1), border-color 0.25s ease, box-shadow 0.25s ease',
        transformStyle: 'preserve-3d',
      }}
      className={`glass-card bg-surface-raised/40 border border-white/5 rounded-2xl shadow-card p-5 ${
        onClick ? 'cursor-pointer hover:border-brand-primary/40' : ''
      } ${className}`}
      {...props}
    >
      {/* 3D Depth Inner Wrapper */}
      <div style={{ transform: 'translateZ(15px)', transformStyle: 'preserve-3d' }}>
        {children}
      </div>
    </div>
  );
}
