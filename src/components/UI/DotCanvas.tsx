import { useEffect, useRef } from 'react';

const DotCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Exact parameters from design spec
    const SPACING = 10;
    const R_BASE = 1.0;
    const R_LIT = 1.15;
    const A_BASE = 0.18;
    const A_LIT = 0.55;
    const REACH = 110;

    let mx = -9999;
    let my = -9999;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      draw();
    };

    const draw = () => {
      ctx!.clearRect(0, 0, canvas.width, canvas.height);

      const cols = Math.ceil(canvas.width / SPACING) + 1;
      const rows = Math.ceil(canvas.height / SPACING) + 1;

      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const x = c * SPACING + SPACING * 0.5;
          const y = r * SPACING + SPACING * 0.5;

          const d = Math.hypot(x - mx, y - my);
          const t = d < REACH ? Math.pow(1 - d / REACH, 1.6) : 0;

          const radius = R_BASE + (R_LIT - R_BASE) * t;
          const alpha = A_BASE + (A_LIT - A_BASE) * t;

          ctx!.beginPath();
          ctx!.arc(x, y, radius, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(220, 220, 225, ${alpha})`;
          ctx!.fill();
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      draw();
    };

    const handleResize = () => {
      resize();
    };

    // Initial setup
    resize();

    // Event listeners
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} id="dot-canvas" />;
};

export default DotCanvas;