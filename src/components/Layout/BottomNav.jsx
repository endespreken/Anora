import React from 'react';
import { Hash, MessageSquare, Users } from 'lucide-react';

export default function BottomNav({ activeTab, onChangeTab, unreadTabs = [] }) {
  const tabs = [
    { id: 'spaces', label: 'Spaces', icon: Hash },
    { id: 'pms', label: 'Chats', icon: MessageSquare },
    { id: 'connections', label: 'Friends', icon: Users },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-md border-t border-border z-50 h-16 flex items-center justify-around px-2 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        const hasUnread = unreadTabs.includes(tab.id);
        
        return (
          <button
            key={tab.id}
            onClick={() => onChangeTab(tab.id)}
            className={`relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
              isActive ? 'text-primary' : 'text-textMuted hover:text-text'
            }`}
          >
            <div className="relative">
              <Icon size={22} className={isActive ? 'fill-primary/10' : ''} />
              {hasUnread && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-accent rounded-full border-2 border-surface animate-pulse"></span>
              )}
            </div>
            <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
