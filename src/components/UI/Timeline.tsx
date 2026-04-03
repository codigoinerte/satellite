import { useState, useEffect } from 'react';

interface TimelineProps {
  progress?: number;
  onProgressChange?: (progress: number) => void;
}

export function Timeline({ progress = 62, onProgressChange }: TimelineProps) {
  const [timelineProgress, setTimelineProgress] = useState(progress);
  const [selectedRange, setSelectedRange] = useState<'1D' | '1W' | '1M'>('1D');
  const [clock, setClock] = useState('00:00:00 UTC');
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const h = String(now.getUTCHours()).padStart(2, '0');
      const m = String(now.getUTCMinutes()).padStart(2, '0');
      const s = String(now.getUTCSeconds()).padStart(2, '0');
      setClock(`${h}:${m}:${s}`);
    };
    updateClock();
    const id = setInterval(updateClock, 1000);
    return () => clearInterval(id);
  }, []);

  const handleProgressChange = (newProgress: number) => {
    setTimelineProgress(newProgress);
    onProgressChange?.(newProgress);
  };

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    handleProgressChange(percentage);
  };

  return (
    <div className="timeline">
      {/* Header with label and range chips */}
      <div className="timeline-header">
        <span className="timeline-label">EPOCH</span>
        <div className="timeline-chips">
          {(['1D', '1W', '1M'] as const).map((range) => (
            <button
              key={range}
              className={`chip ${selectedRange === range ? 'on' : ''}`}
              onClick={() => setSelectedRange(range)}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Progress track */}
      <div
        className="timeline-track"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="timeline-fill" style={{ width: `${timelineProgress}%` }} />
        <div
          className="timeline-head"
          style={{ left: `${timelineProgress}%` }}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
        />
      </div>

      {/* Hour ticks */}
      <div className="timeline-ticks">
        <span>00:00</span>
        <span>06:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>24:00</span>
      </div>

      {/* Clock */}
      <div style={{ textAlign: 'right', fontSize: '9px', color: 'var(--text-md)' }}>
        {clock} UTC
      </div>
    </div>
  );
}

export default Timeline;
