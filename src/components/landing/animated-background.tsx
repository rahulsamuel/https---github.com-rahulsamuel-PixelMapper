'use client';

export function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />

      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-accent/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-1/3 w-72 h-72 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" />
      </div>

      <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-primary/20" />
          </pattern>

          <linearGradient id="fadeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="20%" stopColor="white" stopOpacity="0.3" />
            <stop offset="80%" stopColor="white" stopOpacity="0.3" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>

        <rect width="100%" height="100%" fill="url(#grid)" mask="url(#fadeMask)" />
        <mask id="fadeMask">
          <rect width="100%" height="100%" fill="url(#fadeGradient)" />
        </mask>

        <g className="animate-pulse-slow">
          <line x1="10%" y1="0" x2="10%" y2="100%" stroke="currentColor" strokeWidth="1" className="text-primary/30" strokeDasharray="4 4">
            <animate attributeName="y1" from="-100%" to="100%" dur="20s" repeatCount="indefinite" />
            <animate attributeName="y2" from="0" to="200%" dur="20s" repeatCount="indefinite" />
          </line>

          <line x1="30%" y1="0" x2="30%" y2="100%" stroke="currentColor" strokeWidth="1" className="text-accent/30" strokeDasharray="4 4">
            <animate attributeName="y1" from="-100%" to="100%" dur="25s" repeatCount="indefinite" />
            <animate attributeName="y2" from="0" to="200%" dur="25s" repeatCount="indefinite" />
          </line>

          <line x1="70%" y1="0" x2="70%" y2="100%" stroke="currentColor" strokeWidth="1" className="text-primary/30" strokeDasharray="4 4">
            <animate attributeName="y1" from="-100%" to="100%" dur="22s" repeatCount="indefinite" />
            <animate attributeName="y2" from="0" to="200%" dur="22s" repeatCount="indefinite" />
          </line>

          <line x1="90%" y1="0" x2="90%" y2="100%" stroke="currentColor" strokeWidth="1" className="text-accent/30" strokeDasharray="4 4">
            <animate attributeName="y1" from="-100%" to="100%" dur="18s" repeatCount="indefinite" />
            <animate attributeName="y2" from="0" to="200%" dur="18s" repeatCount="indefinite" />
          </line>
        </g>
      </svg>

      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary/40 rounded-full animate-twinkle"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>
    </div>
  );
}
