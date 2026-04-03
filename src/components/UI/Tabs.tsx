import { motion } from 'framer-motion';
import { Globe, Table } from 'lucide-react';

interface TabsProps {
  activeTab: 'globe' | 'table';
  onTabChange: (tab: 'globe' | 'table') => void;
}

export function Tabs({ activeTab, onTabChange }: TabsProps) {
  const tabs = [
    { id: 'globe' as const, label: '3D Globe', icon: Globe },
    { id: 'table' as const, label: 'Data Table', icon: Table },
  ];

  return (
    <div className="flex gap-2 p-2 bg-cyber-bg-card backdrop-blur-md border-b border-cyber-border">
      <div className="container mx-auto px-4 flex gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative px-6 py-3 font-semibold text-sm tracking-wide transition-all flex items-center gap-2 ${
                isActive
                  ? 'text-cyber-bg-darker'
                  : 'text-cyber-text-dim hover:text-cyber-primary'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-gradient-to-r from-cyber-primary to-cyber-accent rounded"
                  style={{ zIndex: -1 }}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon size={18} />
              <span>{tab.label}</span>

              {isActive && (
                <motion.div
                  className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-transparent via-cyber-primary to-transparent rounded-full"
                  layoutId="tabIndicator"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
