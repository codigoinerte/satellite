import { Satellite, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

export function Header() {
  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="bg-cyber-bg-card backdrop-blur-md border-b border-cyber-border sticky top-0 z-40"
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Satellite size={32} color="var(--cyber-primary)" className="animate-pulse" />
              <div className="absolute inset-0 blur-xl bg-cyber-primary/30"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold">SATTRACK</h1>
              <p className="text-xs text-cyber-text-dim tracking-wider">GLOBAL MONITORING SYSTEM</p>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex items-center gap-6">
            <a
              href="#"
              className="text-cyber-text-dim hover:text-cyber-primary transition-colors font-semibold text-sm tracking-wide"
            >
              DOCS
            </a>
            <a
              href="#"
              className="text-cyber-text-dim hover:text-cyber-primary transition-colors font-semibold text-sm tracking-wide"
            >
              API
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 border border-cyber-border rounded hover:bg-cyber-primary/10 transition-all flex items-center gap-2"
            >
              <ExternalLink size={20} color="var(--cyber-primary)" />
            </a>
          </nav>
        </div>
      </div>

      {/* Animated border */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-cyber-primary to-transparent opacity-50"></div>
    </motion.header>
  );
}
