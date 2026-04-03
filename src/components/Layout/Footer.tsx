import { Heart, Database } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-cyber-bg-card backdrop-blur-md border-t border-cyber-border mt-auto">
      <div className="container mx-auto px-6 py-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Info */}
          <div className="flex items-center gap-2 text-sm text-cyber-text-dim">
            <span>Powered by</span>
            <a
              href="https://www.n2yo.com/api/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyber-primary hover:text-cyber-secondary transition-colors font-semibold"
            >
              N2YO.com API
            </a>
            <Database size={16} />
          </div>

          {/* Copyright */}
          <div className="flex items-center gap-2 text-sm text-cyber-text-dim">
            <span>Made with</span>
            <Heart size={16} className="text-cyber-warning animate-pulse" fill="var(--cyber-warning)" />
            <span>by</span>
            <span className="text-cyber-primary font-semibold">SATTRACK Team</span>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyber-success animate-pulse"></div>
            <span className="text-xs text-cyber-text-dim font-semibold tracking-wide">
              SYSTEM ONLINE
            </span>
          </div>
        </div>
      </div>

      {/* Animated border */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-cyber-secondary to-transparent opacity-50"></div>
    </footer>
  );
}
