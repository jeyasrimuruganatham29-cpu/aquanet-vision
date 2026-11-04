import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';

export default function AnimatedBackground() {
  const canvasRef = useRef(null);
  const { isDark } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Particle nodes representing floating aquatic IoT sensors and water molecules
    const particleCount = 45;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2.5 + 1,
      speedX: (Math.random() - 0.5) * 0.4,
      speedY: (Math.random() - 0.5) * 0.4 - 0.15, // slight upward float
      opacity: Math.random() * 0.5 + 0.2,
      pulseSpeed: Math.random() * 0.02 + 0.01,
    }));

    let step = 0;

    const render = () => {
      step += 0.012;
      ctx.clearRect(0, 0, width, height);

      // Gradient background mesh
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      if (isDark) {
        bgGrad.addColorStop(0, '#030712');
        bgGrad.addColorStop(0.4, '#060E1A');
        bgGrad.addColorStop(0.8, '#0A1F44');
        bgGrad.addColorStop(1, '#050D1A');
      } else {
        bgGrad.addColorStop(0, '#F8FAFC');
        bgGrad.addColorStop(0.4, '#EFF6FF');
        bgGrad.addColorStop(0.8, '#E0F2FE');
        bgGrad.addColorStop(1, '#F0F9FF');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle luminous fluid waves in the bottom third
      const waveColor = isDark
        ? 'rgba(0, 245, 255, 0.025)'
        : 'rgba(0, 180, 216, 0.035)';
      ctx.fillStyle = waveColor;

      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = 0; x <= width; x += 30) {
        const y =
          height -
          120 +
          Math.sin(x * 0.003 + step) * 25 +
          Math.sin(x * 0.006 - step * 0.5) * 15;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();

      // Second wave layer with offset
      const wave2Color = isDark
        ? 'rgba(0, 119, 182, 0.03)'
        : 'rgba(56, 189, 248, 0.04)';
      ctx.fillStyle = wave2Color;
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = 0; x <= width; x += 40) {
        const y =
          height -
          80 +
          Math.cos(x * 0.004 - step * 0.8) * 20 +
          Math.sin(x * 0.002 + step) * 10;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();

      // Draw and connect particles
      particles.forEach((p, idx) => {
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        const currentOpacity =
          p.opacity + Math.sin(step * 10 * p.pulseSpeed) * 0.15;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = isDark
          ? `rgba(0, 245, 255, ${Math.max(0.05, currentOpacity * 0.7)})`
          : `rgba(0, 119, 182, ${Math.max(0.05, currentOpacity * 0.4)})`;
        ctx.fill();

        // Connect nearby particles with subtle synapses
        for (let j = idx + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            const lineAlpha = (1 - dist / 110) * (isDark ? 0.07 : 0.04);
            ctx.strokeStyle = isDark
              ? `rgba(0, 245, 255, ${lineAlpha})`
              : `rgba(0, 119, 182, ${lineAlpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[-1] transition-opacity duration-700"
    />
  );
}
