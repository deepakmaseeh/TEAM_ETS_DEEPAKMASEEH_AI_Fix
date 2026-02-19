import React, { useEffect, useState } from 'react';

const HealthGauge = ({ score }) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  useEffect(() => {
    // Animate score on mount or change
    let start = 0;
    const end = score;
    if (start === end) return;

    const duration = 1000;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      
      setAnimatedScore(Math.floor(start + (end - start) * ease));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [score]);

  // Color logic
  const getColor = (s) => {
    if (s >= 90) return 'var(--success)'; // Green
    if (s >= 70) return 'var(--info)';    // Blue
    if (s >= 50) return '#f59e0b';        // Orange
    return 'var(--danger)';               // Red
  };

  const color = getColor(animatedScore);

  return (
    <div style={{ position: 'relative', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
        {/* Background Circle */}
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="transparent"
          stroke="var(--bg-tertiary)"
          strokeWidth="6"
        />
        {/* Progress Circle */}
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.1s ease, stroke 0.5s ease' }}
        />
      </svg>
      <div style={{ position: 'absolute', textAlign: 'center' }}>
        <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
          {animatedScore}
        </span>
        <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', display: 'block', marginTop: '-2px' }}>
          %
        </span>
      </div>
    </div>
  );
};

export default HealthGauge;
