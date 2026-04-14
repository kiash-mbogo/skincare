/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CheckCircle2, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { SkinProfile } from '../types';

interface SetupScreenProps {
  onNext: (profile: SkinProfile) => void;
}

export const SetupScreen = ({ onNext }: SetupScreenProps) => {
  const [skinType, setSkinType] = useState<string[]>([]);
  const [concerns, setConcerns] = useState<string[]>([]);

  const toggle = (list: string[], setList: (l: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  return (
    <div className="min-h-screen bg-brand-400 p-8 text-white flex flex-col">
      <h1 className="text-2xl font-display font-bold text-center mb-8">Skin profile setup</h1>
      
      <div className="flex-1 space-y-8">
        <section>
          <h2 className="text-lg font-bold mb-4">Tell us about ur skin.</h2>
          <div className="space-y-3">
            {['oily', 'Dryness', 'combination', 'sensitive'].map(type => (
              <label key={type} className="flex items-center gap-3 cursor-pointer group">
                <div 
                  onClick={() => toggle(skinType, setSkinType, type)}
                  className={cn(
                    "w-6 h-6 rounded-md border-2 border-white/50 flex items-center justify-center transition-all",
                    skinType.includes(type) ? "bg-white border-white" : "group-hover:border-white"
                  )}
                >
                  {skinType.includes(type) && <CheckCircle2 size={16} className="text-brand-400" />}
                </div>
                <span className="capitalize font-medium">{type}</span>
              </label>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-4">What are ur concerns?</h2>
          <div className="flex flex-wrap gap-2">
            {['Acne', 'Aging', 'Dark spots', 'Pores', 'Redness', 'Texture'].map(concern => (
              <button
                key={concern}
                onClick={() => toggle(concerns, setConcerns, concern)}
                className={cn(
                  "px-4 py-2 rounded-full border-2 border-white/30 text-sm font-medium transition-all",
                  concerns.includes(concern) ? "bg-white text-brand-400 border-white" : "hover:border-white/60"
                )}
              >
                {concern}
              </button>
            ))}
          </div>
        </section>
      </div>

      <button 
        disabled={skinType.length === 0 || concerns.length === 0}
        onClick={() => onNext({ type: skinType, concerns })}
        className="w-full bg-white text-brand-400 font-bold py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Complete setup <ChevronRight size={20} />
      </button>
    </div>
  );
};
