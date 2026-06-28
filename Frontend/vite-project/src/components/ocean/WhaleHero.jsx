import React from 'react';

const WhaleHero = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* Hero background image */}
    <img
      src="/nautix-hero.png"
      alt=""
      className="absolute inset-0 w-full h-full object-cover object-center scale-105 animate-water-drift"
      aria-hidden="true"
    />

    {/* Dark overlay for text readability */}
    <div className="absolute inset-0 bg-gradient-to-b from-[#040810]/30 via-transparent to-[#040810]/80" />

    {/* Rising water shimmer overlay */}
    <div className="absolute inset-0 ocean-water-layer opacity-20 mix-blend-overlay" />

    {/* Animated whale SVG swimming toward user */}
    <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2 whale-swim-container">
      <svg
        width="180"
        height="120"
        viewBox="0 0 180 120"
        className="whale-look-at-user drop-shadow-2xl"
      >
        <ellipse cx="90" cy="65" rx="55" ry="35" fill="#3a86c8" />
        <ellipse cx="90" cy="70" rx="45" ry="22" fill="#90e0ef" opacity="0.5" />
        <path d="M145 55 Q175 50 170 35 Q160 52 145 55" fill="#3a86c8" />
        <circle cx="55" cy="55" r="8" fill="#1a1a2e" />
        <circle cx="57" cy="52" r="3" fill="white" />
        <ellipse cx="40" cy="68" rx="8" ry="5" fill="#ffb4b4" opacity="0.6" />
        <path d="M60 78 Q90 88 120 78" stroke="#1a1a2e" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        {[0, 1, 2, 3, 4].map((i) => (
          <line
            key={i}
            x1={70 + i * 10}
            y1={72}
            x2={70 + i * 10}
            y2={82}
            stroke="#90e0ef"
            strokeWidth="2"
            opacity="0.7"
          />
        ))}
      </svg>
    </div>

    {/* Small swimming fish in foreground */}
    {[...Array(5)].map((_, i) => (
      <div
        key={i}
        className="absolute"
        style={{
          top: `${30 + i * 12}%`,
          animation: `fish-swim-${i % 2 === 0 ? 'right' : 'left'} ${14 + i * 3}s ${i * 2}s linear infinite`,
          opacity: 0.7,
        }}
      >
        <svg width="24" height="14" viewBox="0 0 32 18" style={{ transform: i % 2 ? 'scaleX(-1)' : undefined }}>
          <ellipse cx="14" cy="9" rx="10" ry="6" fill={['#ff9f43', '#ffd93d'][i % 2]} />
          <polygon points="24,9 32,4 32,14" fill={['#ff9f43', '#ffd93d'][i % 2]} />
        </svg>
      </div>
    ))}
  </div>
);

export default WhaleHero;
