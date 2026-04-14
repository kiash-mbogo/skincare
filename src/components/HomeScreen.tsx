/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Bell, ChevronRight, CheckCircle2, ShoppingBag, Sparkles } from 'lucide-react';
import { auth } from '../firebase';
import { cn } from '../lib/utils';
import { SkinProfile, RoutineItem, SkincareRecommendation } from '../types';
import { getSkincareRecommendations } from '../services/aiService';
import { subscribeToLatestAnalysis, subscribeToRoutines } from '../services/dbService';

interface HomeScreenProps {
  profile: SkinProfile;
}

export const HomeScreen = ({ profile }: HomeScreenProps) => {
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const [recommendations, setRecommendations] = useState<SkincareRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [latestAnalysis, setLatestAnalysis] = useState<any>(null);
  const [routines, setRoutines] = useState<RoutineItem[]>([]);

  const fetchRecs = async () => {
    setLoading(true);
    setError(null);
    try {
      const recs = await getSkincareRecommendations(profile.type, profile.concerns);
      setRecommendations(recs);
    } catch (err: any) {
      setError(err.message || "Something went wrong while fetching recommendations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!auth.currentUser) return;

    fetchRecs();

    // Fetch latest analysis
    const unsubAnalysis = subscribeToLatestAnalysis(auth.currentUser.uid, (data) => {
      setLatestAnalysis(data);
    });

    // Fetch routines
    const unsubRoutine = subscribeToRoutines(auth.currentUser.uid, (items) => {
      setRoutines(items);
      setLoading(false);
    });

    return () => {
      unsubAnalysis();
      unsubRoutine();
    };
  }, [profile]);

  const morningRoutines = routines.filter(r => r.type === 'morning');
  
  return (
    <div className="pb-24 p-6 space-y-6">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Home Dashboard</h1>
          <div className="mt-2 bg-slate-100 px-4 py-2 rounded-xl text-slate-600 font-medium inline-block">
            Good morning {auth.currentUser?.displayName?.split(' ')[0] || 'Alvin'}, {today}
          </div>
        </div>
        <button className="p-2 bg-white rounded-full shadow-sm border border-slate-100">
          <Bell size={20} className="text-slate-600" />
        </button>
      </header>

      <section>
        <div className="flex justify-between items-end mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Today's routine</h2>
            <p className="text-sm text-slate-500">Morning routine</p>
          </div>
          <button className="text-brand-600 text-sm font-bold flex items-center gap-1">
            View all <ChevronRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-brand-100 p-4 rounded-2xl border border-brand-200 min-h-[140px]">
            <h3 className="font-bold text-brand-700 mb-3">Routine :</h3>
            <ul className="space-y-2 text-sm font-medium text-brand-600">
              {morningRoutines.length > 0 ? (
                morningRoutines.slice(0, 3).map((r, i) => (
                  <li key={i} className={cn("flex items-center gap-2", !r.completed && "opacity-60")}>
                    {r.completed ? <CheckCircle2 size={14} /> : <div className="w-3.5 h-3.5 rounded-full border border-brand-400" />}
                    {r.name}
                  </li>
                ))
              ) : (
                <li className="text-xs italic opacity-60">No morning routine set</li>
              )}
            </ul>
          </div>
          
          <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200 flex flex-col justify-center items-center text-center">
            <ShoppingBag className="text-slate-400 mb-2" size={24} />
            <h3 className="font-bold text-slate-700 text-sm">Recommended brand</h3>
            <p className="text-xs text-slate-500 mt-1">Based on your {profile.type.join(' & ')} skin</p>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="text-brand-500" size={20} />
          <h2 className="text-lg font-bold text-slate-900">AI Recommendations</h2>
        </div>
        
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 p-6 rounded-3xl text-center space-y-3">
            <p className="text-sm text-red-600 font-medium">{error}</p>
            <button 
              onClick={fetchRecs}
              className="text-xs font-bold text-red-700 uppercase tracking-widest bg-red-100 px-4 py-2 rounded-full hover:bg-red-200 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {recommendations.map((rec, idx) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                key={idx} 
                className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex gap-4"
              >
                <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600 shrink-0">
                  <ShoppingBag size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-brand-500 uppercase tracking-widest">{rec.category}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">• {rec.brand}</span>
                  </div>
                  <h3 className="font-bold text-slate-900">{rec.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{rec.reason}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-900">Skin Progress</h2>
          <button className="text-xs font-bold text-slate-400 uppercase tracking-widest">Write down</button>
        </div>
        <div className="bg-slate-900 h-40 rounded-3xl p-6 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-400/20 rounded-full -mr-16 -mt-16 blur-2xl" />
          <p className="text-white/60 text-sm mb-1">Current Glow Score</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-display font-bold text-white">{latestAnalysis?.glowScore || '--'}</span>
            {latestAnalysis && <span className="text-brand-400 font-bold text-sm">Latest Analysis</span>}
          </div>
          <div className="mt-4 flex gap-1">
            {[1,2,3,4,5,6,7].map(i => (
              <div key={i} className={cn("h-1 flex-1 rounded-full", (latestAnalysis?.glowScore / 14) >= i ? "bg-brand-400" : "bg-white/20")} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
