import { useEffect, useRef, useState } from 'react';

const DotCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hovered, setHovered] = useState({ x: 0, y: 0 });
  const [dots, setDots] = useState<Array<{ x: number; y: number; alpha: number }>>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to full window
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Create initial dots
    const newDots = Array.from({ length: 100 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      alpha: Math.random() * 0.5 + 0.5
    }));
    setDots(newDots);

    // Handle resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw dots
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = 'rgba(220, 220, 225, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;

    dots.forEach(dot => {
      const d = Math.sqrt(
        Math.pow(dot.x - hovered.x, 2) + 
        Math.pow(dot.y - hovered.y, 2)
      );
      const alpha = Math.pow(1 - d/110, 1.6);
      
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, 10, 0, Math.PI*2);
      ctx.fillStyle = `rgba(220, 220, 225, ${alpha})`;
      ctx.fill();
    });
  }, [hovered, dots]);

  return (
    <div className="dot-canvas">
      <canvas
        ref={canvasRef}
        onMouseMove={(e) => setHovered({
          x: e.clientX,
          y: e.clientY
        })}
      ></canvas>
    </div>
  );
};

export default DotCanvas;