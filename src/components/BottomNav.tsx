/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Home, Calendar, BarChart3, User } from 'lucide-react';
import { cn } from '../lib/utils';
import { Screen } from '../types';

interface BottomNavProps {
  active: Screen;
  onNavigate: (s: Screen) => void;
}

export const BottomNav = ({ active, onNavigate }: BottomNavProps) => {
  const items = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'routine', icon: Calendar, label: 'Routine' },
    { id: 'progress', icon: BarChart3, label: 'Progress' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-3 flex justify-between items-center z-50">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id as Screen)}
          className={cn(
            "flex flex-col items-center gap-1 transition-colors",
            active === item.id ? "text-brand-600" : "text-slate-400 hover:text-slate-600"
          )}
        >
          <item.icon size={22} strokeWidth={active === item.id ? 2.5 : 2} />
          <span className="text-[10px] font-medium uppercase tracking-wider">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};
