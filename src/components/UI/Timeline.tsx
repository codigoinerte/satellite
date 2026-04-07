import { useState, useEffect } from 'react';

export function Timeline() {
  const [localTime, setLocalTime] = useState('');
  const [utcTime, setUtcTime] = useState('');
  const [dayProgress, setDayProgress] = useState(0);
  const [timezone, setTimezone] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();

      // Local time
      const lh = String(now.getHours()).padStart(2, '0');
      const lm = String(now.getMinutes()).padStart(2, '0');
      const ls = String(now.getSeconds()).padStart(2, '0');
      setLocalTime(`${lh}:${lm}:${ls}`);

      // UTC time
      const uh = String(now.getUTCHours()).padStart(2, '0');
      const um = String(now.getUTCMinutes()).padStart(2, '0');
      const us = String(now.getUTCSeconds()).padStart(2, '0');
      setUtcTime(`${uh}:${um}:${us}`);

      // Day progress (0-100% based on local time)
      const secondsInDay = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      setDayProgress((secondsInDay / 86400) * 100);

      // Timezone name
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const offset = -now.getTimezoneOffset();
        const sign = offset >= 0 ? '+' : '-';
        const oh = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
        const om = String(Math.abs(offset) % 60).padStart(2, '0');
        setTimezone(`${tz} (UTC${sign}${oh}:${om})`);
      } catch {
        const offset = -now.getTimezoneOffset();
        const sign = offset >= 0 ? '+' : '-';
        const oh = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
        const om = String(Math.abs(offset) % 60).padStart(2, '0');
        setTimezone(`UTC${sign}${oh}:${om}`);
      }
    };

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="timeline">
      {/* Header */}
      <div className="timeline-header">
        <span className="timeline-label">LOCAL TIME</span>
        <span style={{ fontSize: '9px', color: 'var(--text-md)' }}>{timezone}</span>
      </div>

      {/* Progress track — shows current position in the day */}
      <div className="timeline-track">
        <div className="timeline-fill" style={{ width: `${dayProgress}%` }} />
        <div className="timeline-head" style={{ left: `${dayProgress}%` }} />
      </div>

      {/* Hour ticks */}
      <div className="timeline-ticks">
        <span>00:00</span>
        <span>06:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>24:00</span>
      </div>

      {/* Clocks */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text-md)' }}>
        <span>{localTime} LOCAL</span>
        <span>{utcTime} UTC</span>
      </div>
    </div>
  );
}

export default Timeline;
