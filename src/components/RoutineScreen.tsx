/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sun, Moon, CheckCircle2, Plus } from 'lucide-react';
import { auth } from '../firebase';
import { cn } from '../lib/utils';
import { RoutineItem } from '../types';
import { subscribeToRoutines, updateRoutineProductStatus, addRoutineProduct } from '../services/dbService';

export const RoutineScreen = () => {
  const [tab, setTab] = useState<'morning' | 'night'>('morning');
  const [routines, setRoutines] = useState<RoutineItem[]>([]);
  const [newName, setNewName] = useState('');
  const [newBrand, setNewBrand] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;
    
    const unsubscribe = subscribeToRoutines(auth.currentUser.uid, (items) => {
      setRoutines(items);
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);

  const handleToggleComplete = async (id: string | undefined, currentStatus: boolean) => {
    if (!id) return;
    await updateRoutineProductStatus(id, !currentStatus);
  };

  const handleAddProduct = async () => {
    if (!auth.currentUser || !newName || !newBrand) return;
    
    await addRoutineProduct(auth.currentUser.uid, newName, newBrand, tab);
    
    setNewName('');
    setNewBrand('');
  };

  const filteredRoutines = routines.filter(r => r.type === tab);
  
  return (
    <div className="pb-24 p-6 space-y-6">
      <h1 className="text-2xl font-display font-bold text-slate-900">Routine Screen</h1>
      
      <div className="bg-slate-100 p-1 rounded-2xl flex">
        <button 
          onClick={() => setTab('morning')}
          className={cn(
            "flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all",
            tab === 'morning' ? "bg-white text-brand-600 shadow-sm" : "text-slate-500"
          )}
        >
          <Sun size={18} /> Morning
        </button>
        <button 
          onClick={() => setTab('night')}
          className={cn(
            "flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all",
            tab === 'night' ? "bg-white text-brand-600 shadow-sm" : "text-slate-500"
          )}
        >
          <Moon size={18} /> Night
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredRoutines.length > 0 ? (
          filteredRoutines.map((product) => (
            <div 
              key={product.id} 
              onClick={() => handleToggleComplete(product.id, product.completed)}
              className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 cursor-pointer active:scale-98 transition-transform"
            >
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                product.completed ? "bg-brand-100 text-brand-600" : "bg-slate-100 text-slate-400"
              )}>
                {product.completed ? <CheckCircle2 size={24} /> : <div className="w-6 h-6 rounded-full border-2 border-slate-300" />}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900">{product.name}</h3>
                <p className="text-sm text-slate-500">{product.brand}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-slate-400 italic text-sm">
            No products added to your {tab} routine yet.
          </div>
        )}
      </div>

      <section className="pt-4">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Add product</h2>
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-6 flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-slate-200 rounded-2xl flex items-center justify-center text-slate-400">
            <Plus size={32} />
          </div>
          <div className="w-full space-y-2">
            <input 
              placeholder="Product name" 
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full bg-white border border-slate-100 px-4 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-200" 
            />
            <input 
              placeholder="Brand" 
              value={newBrand}
              onChange={(e) => setNewBrand(e.target.value)}
              className="w-full bg-white border border-slate-100 px-4 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-200" 
            />
          </div>
          <button 
            onClick={handleAddProduct}
            className="w-full bg-brand-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-brand-200 active:scale-95 transition-transform"
          >
            Add to {tab} routine
          </button>
        </div>
      </section>
    </div>
  );
};
