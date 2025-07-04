// Preloader Component - Dynamic Canvas Sunrise Animation
// Features: Real-time canvas drawing of sun rising over sea horizon
// Updated: Fullscreen canvas animation with fade transitions

import { useEffect, useRef, useState } from 'react';

const Preloader = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationProgress = 0;
    const animationDuration = 3000; // 3 seconds
    const startTime = Date.now();

    // Set canvas size to full viewport
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const drawSunrise = (progress) => {
      const width = canvas.width;
      const height = canvas.height;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Sky gradient (dawn to day)
      const skyGradient = ctx.createLinearGradient(0, 0, 0, height * 0.7);
      const skyProgress = Math.min(progress * 1.5, 1);
      
      if (skyProgress < 0.5) {
        // Dawn colors
        skyGradient.addColorStop(0, `hsl(220, 50%, ${10 + skyProgress * 20}%)`);
        skyGradient.addColorStop(0.3, `hsl(25, 60%, ${15 + skyProgress * 25}%)`);
        skyGradient.addColorStop(1, `hsl(35, 70%, ${20 + skyProgress * 30}%)`);
      } else {
        // Day colors
        const dayProgress = (skyProgress - 0.5) * 2;

        skyGradient.addColorStop(0, `hsl(200, 60%, ${30 + dayProgress * 40}%)`);
        skyGradient.addColorStop(0.3, `hsl(45, 80%, ${40 + dayProgress * 35}%)`);
        skyGradient.addColorStop(1, `hsl(50, 90%, ${50 + dayProgress * 30}%)`);
      }

      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, width, height * 0.7);

      // Sea
      const seaGradient = ctx.createLinearGradient(0, height * 0.7, 0, height);
      const seaProgress = Math.min(progress * 1.2, 1);

      seaGradient.addColorStop(0, `hsl(200, 80%, ${20 + seaProgress * 25}%)`);
      seaGradient.addColorStop(1, `hsl(210, 70%, ${15 + seaProgress * 20}%)`);
      
      ctx.fillStyle = seaGradient;
      ctx.fillRect(0, height * 0.7, width, height * 0.3);

      // Horizon line
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 + progress * 0.4})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, height * 0.7);
      ctx.lineTo(width, height * 0.7);
      ctx.stroke();

      // Sun
      const sunRadius = Math.min(width, height) * 0.08;
      const sunX = width * 0.5;
      const sunStartY = height * 0.9; // Start below horizon
      const sunEndY = height * 0.3;   // End high in sky
      const sunY = sunStartY - (sunStartY - sunEndY) * progress;

      // Sun glow
      const glowGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius * 3);

      glowGradient.addColorStop(0, `rgba(255, 200, 50, ${0.6 * progress})`);
      glowGradient.addColorStop(0.3, `rgba(255, 150, 0, ${0.4 * progress})`);
      glowGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
      
      ctx.fillStyle = glowGradient;
      ctx.fillRect(sunX - sunRadius * 3, sunY - sunRadius * 3, sunRadius * 6, sunRadius * 6);

      // Sun reflection on water (only when sun is visible)
      if (sunY < height * 0.7) {
        const reflectionGradient = ctx.createLinearGradient(sunX, height * 0.7, sunX, height);

        reflectionGradient.addColorStop(0, `rgba(255, 200, 50, ${0.8 * progress})`);
        reflectionGradient.addColorStop(0.5, `rgba(255, 150, 0, ${0.4 * progress})`);
        reflectionGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
        
        ctx.fillStyle = reflectionGradient;
        ctx.fillRect(sunX - sunRadius * 0.5, height * 0.7, sunRadius, height * 0.3);
      }

      // Sun body
      const sunGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius);

      sunGradient.addColorStop(0, '#FFD700');
      sunGradient.addColorStop(0.7, '#FFA500');
      sunGradient.addColorStop(1, '#FF8C00');
      
      ctx.fillStyle = sunGradient;
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
      ctx.fill();

      // Sun rays (only when sun is above horizon)
      if (sunY < height * 0.7) {
        const rayCount = 12;
        const rayLength = sunRadius * 1.5;
        const rayOpacity = Math.min((height * 0.7 - sunY) / (sunRadius * 2), 1);
        
        ctx.strokeStyle = `rgba(255, 215, 0, ${rayOpacity * 0.8})`;
        ctx.lineWidth = 3;
        
        for (let i = 0; i < rayCount; i++) {
          const angle = (i / rayCount) * Math.PI * 2 + (progress * 0.5); // Slow rotation
          const startX = sunX + Math.cos(angle) * (sunRadius + 10);
          const startY = sunY + Math.sin(angle) * (sunRadius + 10);
          const endX = sunX + Math.cos(angle) * (sunRadius + rayLength);
          const endY = sunY + Math.sin(angle) * (sunRadius + rayLength);
          
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }
      }

      // Clouds (subtle)
      if (progress > 0.3) {
        const cloudOpacity = (progress - 0.3) * 0.4;

        ctx.fillStyle = `rgba(255, 255, 255, ${cloudOpacity})`;
        
        // Simple cloud shapes
        const drawCloud = (x, y, scale) => {
          ctx.beginPath();
          ctx.arc(x, y, 20 * scale, 0, Math.PI * 2);
          ctx.arc(x + 25 * scale, y, 35 * scale, 0, Math.PI * 2);
          ctx.arc(x + 50 * scale, y, 20 * scale, 0, Math.PI * 2);
          ctx.arc(x + 30 * scale, y - 15 * scale, 25 * scale, 0, Math.PI * 2);
          ctx.fill();
        };

        drawCloud(width * 0.2, height * 0.25, 0.8);
        drawCloud(width * 0.7, height * 0.35, 0.6);
        drawCloud(width * 0.85, height * 0.2, 0.7);
      }
    };

    const animate = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;

      animationProgress = Math.min(elapsed / animationDuration, 1);

      drawSunrise(animationProgress);

      if (animationProgress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete, start fade out after a brief pause
        setTimeout(() => {
          setIsComplete(true);
        }, 500);
      }
    };

    // Start animation
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className={`preloader ${isComplete ? 'loaded' : ''}`}>
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1
        }}
      />
    </div>
  );
};

export default Preloader;
