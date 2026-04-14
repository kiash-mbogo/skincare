/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Camera, Sparkles, Plus } from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { auth } from '../firebase';
import { cn } from '../lib/utils';
import { analyzeSkinPhoto } from '../services/aiService';
import { subscribeToAnalyses, saveSkinAnalysis } from '../services/dbService';

const SKIN_SCORE_DATA = [
  { day: 'Mon', score: 65 },
  { day: 'Tue', score: 68 },
  { day: 'Wed', score: 62 },
  { day: 'Thu', score: 75 },
  { day: 'Fri', score: 82 },
  { day: 'Sat', score: 78 },
  { day: 'Sun', score: 85 },
];

export const ProgressScreen = () => {
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!auth.currentUser) return;
    
    const unsubscribe = subscribeToAnalyses(auth.currentUser.uid, (items) => {
      setHistory(items);
      if (items.length > 0 && !analysis) {
        setAnalysis(items[0]);
        setImage(items[0].photoUrl);
      }
    });
    
    return unsubscribe;
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setImage(reader.result as string);
        handleAnalyze(base64String, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async (base64: string, fullDataUrl: string) => {
    if (!auth.currentUser) return;
    setAnalyzing(true);
    setAnalysis(null);
    setError(null);
    try {
      const result = await analyzeSkinPhoto(base64);
      if (result) {
        const analysisData = await saveSkinAnalysis(auth.currentUser.uid, result, fullDataUrl);
        setAnalysis(analysisData);
      }
    } catch (err: any) {
      setError(err.message || "Failed to analyze photo. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="pb-24 p-6 space-y-6">
      <h1 className="text-2xl font-display font-bold text-slate-900">Skin Progress</h1>
      
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-slate-900">Weekly Skin Score</h2>
          <div className="px-3 py-1 bg-brand-50 text-brand-600 text-[10px] font-bold rounded-full uppercase tracking-widest">
            +12% this week
          </div>
        </div>
        
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={SKIN_SCORE_DATA}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                dy={10}
              />
              <YAxis hide domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
              />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#6366f1" 
                strokeWidth={4} 
                dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900">Photo Analysis</h2>
          <label className="bg-brand-600 text-white p-2 rounded-xl shadow-lg shadow-brand-200 cursor-pointer active:scale-95 transition-transform">
            <Plus size={20} />
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
        </div>

        <div className="aspect-square bg-slate-100 rounded-3xl border-2 border-dashed border-slate-200 overflow-hidden relative group">
          {image ? (
            <img src={image} alt="Skin" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Camera size={48} strokeWidth={1.5} />
              <p className="text-sm font-medium">Upload a photo for AI analysis</p>
            </div>
          )}
          
          {analyzing && (
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex flex-col items-center justify-center text-white gap-4">
              <Sparkles className="animate-spin" size={48} />
              <p className="font-bold animate-pulse">AI is analyzing your skin...</p>
            </div>
          )}
        </div>

        {!analyzing && !analysis && image && (
          <button 
            onClick={() => image && handleAnalyze(image.split(',')[1], image)}
            className="bg-brand-600 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-brand-200 active:scale-95 transition-transform flex items-center gap-2"
          >
            <Sparkles size={18} /> Re-analyze
          </button>
        )}

        {error && (
          <div className="bg-red-50 border border-red-100 p-4 rounded-2xl text-center">
            <p className="text-sm text-red-600 font-medium">{error}</p>
          </div>
        )}

        {analysis && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl space-y-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-display font-bold text-slate-900">{analysis.glowScore}</h3>
                <p className="text-xs font-bold text-brand-500 uppercase tracking-widest">Glow Score</p>
              </div>
              <div className="text-right">
                <h3 className="font-bold text-slate-900 capitalize">{analysis.skinType}</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Detected Type</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-slate-50 rounded-2xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Hydration</p>
                <p className="font-bold text-slate-900">{analysis.scoreBreakdown.hydration}%</p>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-2xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Texture</p>
                <p className="font-bold text-slate-900">{analysis.scoreBreakdown.texture}%</p>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-2xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Clarity</p>
                <p className="font-bold text-slate-900">{analysis.scoreBreakdown.clarity}%</p>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-3 text-sm">Area Concerns</h4>
              <div className="space-y-2">
                {analysis.areaConcerns.map((ac: any, i: number) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-brand-50 rounded-xl">
                    <span className="text-sm font-bold text-brand-700 capitalize">{ac.area}</span>
                    <span className="text-xs font-medium text-brand-600">{ac.concern}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-3 text-sm">AI Recommendations</h4>
              <ul className="space-y-2">
                {analysis.tips.map((tip: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-500 italic leading-relaxed">
                "{analysis.summary}"
              </p>
            </div>
          </motion.div>
        )}
      </section>
    </div>
  );
};
