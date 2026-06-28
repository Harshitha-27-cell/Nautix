import React, { useMemo } from 'react';

const Bubble = ({ style, color }) => (
  <div
    className="absolute rounded-full"
    style={{
      ...style,
      border: `1px solid rgba(255,255,255,0.3)`,
      backgroundColor: 'rgba(255,255,255,0.15)',
      backdropFilter: 'blur(2px)',
      boxShadow: `0 0 15px rgba(255,255,255,0.2), inset 0 0 10px rgba(255,255,255,0.1)`,
    }}
  />
);

const FloatingOrb = ({ style, color }) => (
  <div
    className="absolute rounded-full blur-2xl"
    style={{
      ...style,
      backgroundColor: color,
    }}
  />
);

const OceanBackground = ({ density = 'medium', variant = 'default' }) => {
  const bubbleCount = density === 'light' ? 60 : density === 'heavy' ? 120 : 90;
  const orbCount = density === 'light' ? 3 : density === 'heavy' ? 7 : 5;

  const colors = ['#4cc9f0', '#00b4d8', '#3a86c8', '#ffffff'];

  const bubbles = useMemo(
    () =>
      Array.from({ length: bubbleCount }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        size: `${8 + Math.random() * 40}px`,
        delay: `${Math.random() * 18}s`,
        duration: `${12 + Math.random() * 20}s`,
        opacity: 0.4 + Math.random() * 0.4,
        color: colors[i % colors.length],
      })),
    [bubbleCount]
  );

  const orbs = useMemo(
    () =>
      Array.from({ length: orbCount }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: `${100 + Math.random() * 300}px`,
        duration: `${15 + Math.random() * 25}s`,
        delay: `${Math.random() * 10}s`,
        color: colors[i % colors.length],
      })),
    [orbCount]
  );

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
      {/* Underwater image background */}
      
      {/* Subtle dark overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#070d19]/30 via-[#070d19]/40 to-[#040810]/70" />

      {/* Floating orbs (glowing blobs) */}
      {orbs.map((orb) => (
        <FloatingOrb
          key={orb.id}
          style={{
            left: orb.left,
            top: orb.top,
            width: orb.size,
            height: orb.size,
            opacity: 0.12,
            animation: `orb-float ${orb.duration} ${orb.delay} ease-in-out infinite`,
          }}
          color={orb.color}
        />
      ))}

      {/* Rising bubbles */}
      {bubbles.map((b) => (
        <Bubble
          key={b.id}
          style={{
            left: b.left,
            width: b.size,
            height: b.size,
            bottom: '-10%',
            opacity: b.opacity,
            animation: `bubble-rise ${b.duration} ${b.delay} linear infinite`,
          }}
          color={b.color}
        />
      ))}
    </div>
  );
};

export default OceanBackground;

