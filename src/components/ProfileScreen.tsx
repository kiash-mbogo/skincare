/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { User, Settings, Bell, ShoppingBag, LogOut } from 'lucide-react';
import { auth } from '../firebase';
import { SkinProfile } from '../types';

interface ProfileScreenProps {
  profile: SkinProfile;
  onLogout: () => void;
}

export const ProfileScreen = ({ profile, onLogout }: ProfileScreenProps) => {
  return (
    <div className="pb-24 p-6 space-y-8">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-display font-bold text-slate-900">Profile</h1>
        <button onClick={onLogout} className="p-2 bg-white rounded-full shadow-sm border border-slate-100 text-red-500">
          <LogOut size={20} />
        </button>
      </header>

      <section className="flex flex-col items-center text-center space-y-4">
        <div className="w-24 h-24 bg-brand-100 rounded-3xl flex items-center justify-center text-brand-600 shadow-xl shadow-brand-100">
          <User size={48} />
        </div>
        <div>
          <h2 className="text-xl font-display font-bold text-slate-900">
            {auth.currentUser?.displayName || 'User'}
          </h2>
          <div className="mt-2 bg-slate-100 px-4 py-1 rounded-full text-slate-500 text-xs font-bold uppercase tracking-widest">
            {auth.currentUser?.email}
          </div>
        </div>
        <button className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2">
          <Settings size={18} /> Edit profile
        </button>
      </section>

      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-brand-50 rounded-full -mr-8 -mt-8" />
        
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-brand-100 rounded-2xl flex items-center justify-center text-brand-600">
            <User size={32} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Setting</h3>
            <p className="text-xs text-slate-500">Manage your preferences</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Skin type:</p>
            <p className="font-bold text-slate-700">{profile.type.join(' / ')}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Goal:</p>
            <p className="font-bold text-slate-700">{profile.concerns[0] || 'Clear Texture'}</p>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-start gap-3">
            <div className="mt-1 p-1 bg-brand-50 rounded-md text-brand-600">
              <Bell size={14} />
            </div>
            <p className="text-sm text-slate-600">Alarm for skin care reminder</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-1 p-1 bg-brand-50 rounded-md text-brand-600">
              <ShoppingBag size={14} />
            </div>
            <p className="text-sm text-slate-600">Reminder to purchase specific product incase they ran out</p>
          </div>
        </div>

        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 text-center">Before and current photo</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="aspect-square bg-slate-200 rounded-xl flex items-center justify-center text-[10px] font-bold text-slate-400">BEFORE</div>
            <div className="aspect-square bg-brand-100 rounded-xl flex items-center justify-center text-[10px] font-bold text-brand-400">CURRENT</div>
          </div>
        </div>
      </div>
    </div>
  );
};
