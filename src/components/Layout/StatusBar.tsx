interface StatusBarProps {
  total: number;
  leo: number;
  geo: number;
  meo: number;
  lastUpdate: string;
}

export function StatusBar({ total, leo, geo, meo, lastUpdate }: StatusBarProps) {
  return (
    <footer className="statusbar">
      <div className="statusbar-left">
        <div className="status-item ok">
          <span>●</span> API ONLINE
        </div>
        <div className="status-item">
          EPOCH <span>{lastUpdate}</span>
        </div>
        <div className="status-item">
          OBJECTS <span>{total}</span>
        </div>
      </div>
      <div className="statusbar-right">
        <div className="status-item">
          LEO <span>{leo}</span>
        </div>
        <div className="status-item">
          MEO <span>{meo}</span>
        </div>
        <div className="status-item">
          GEO <span>{geo}</span>
        </div>
        <div className="status-item">
          SOURCE <span>CelesTrak</span>
        </div>
      </div>
    </footer>
  );
}
