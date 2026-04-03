import { motion } from 'framer-motion';
import { Satellite, Globe2, Zap, Radio } from 'lucide-react';

interface StatsPanelProps {
  satelliteCount: number;
  isLoading: boolean;
}

export function StatsPanel({ satelliteCount, isLoading }: StatsPanelProps) {
  const stats = [
    {
      icon: Satellite,
      label: 'Tracked Satellites',
      value: isLoading ? '...' : satelliteCount,
      color: 'var(--cyber-primary)',
    },
    {
      icon: Globe2,
      label: 'Countries',
      value: isLoading ? '...' : '8+',
      color: 'var(--cyber-secondary)',
    },
    {
      icon: Radio,
      label: 'Update Rate',
      value: '5 min',
      color: 'var(--cyber-success)',
    },
    {
      icon: Zap,
      label: 'Status',
      value: 'Active',
      color: 'var(--cyber-warning)',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;

        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="cyber-card p-4 hover:shadow-[0_0_20px_rgba(0,255,249,0.3)] transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <Icon size={24} color={stat.color} />
              {stat.label === 'Status' && (
                <div className="w-2 h-2 rounded-full bg-cyber-success animate-pulse"></div>
              )}
            </div>

            <div className="text-3xl font-bold mb-1" style={{ color: stat.color }}>
              {stat.value}
            </div>

            <div className="text-xs text-cyber-text-dim font-semibold tracking-wide uppercase">
              {stat.label}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
