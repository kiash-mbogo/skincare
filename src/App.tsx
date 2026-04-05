/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  Calendar, 
  BarChart3, 
  User, 
  Plus, 
  Camera, 
  LogOut, 
  ChevronRight, 
  Sun, 
  Moon, 
  CheckCircle2,
  Settings,
  Bell,
  ShoppingBag,
  Sparkles
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  GoogleGenAI, 
  Type,
  GenerateContentResponse 
} from "@google/genai";
import { cn } from './lib/utils';

// --- Gemini Setup ---

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

async function getSkincareRecommendations(skinType: string[], concerns: string[]) {
  const prompt = `Based on a skin profile with types: ${skinType.join(', ')} and concerns: ${concerns.join(', ')}, recommend 3 specific skincare products. For each product, provide the name, brand, why it's good for this profile, and a category (Cleanser, Serum, Moisturizer, etc.).`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              brand: { type: Type.STRING },
              reason: { type: Type.STRING },
              category: { type: Type.STRING },
            },
            required: ["name", "brand", "reason", "category"],
          },
        },
      },
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Gemini Error:", error);
    return [];
  }
}

async function analyzeSkinPhoto(base64Image: string) {
  const prompt = "Analyze this skin photo. Identify the skin type, visible concerns (like acne, redness, or dryness), and provide a 'Glow Score' from 1-100. Additionally, provide a breakdown of the score (Hydration, Texture, Clarity) and identify specific areas of concern (e.g., forehead, cheeks, chin). Also, give 2-3 immediate tips for improvement. Return the result in a structured JSON format.";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Image,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            skinType: { type: Type.STRING },
            concerns: { type: Type.ARRAY, items: { type: Type.STRING } },
            glowScore: { type: Type.NUMBER },
            scoreBreakdown: {
              type: Type.OBJECT,
              properties: {
                hydration: { type: Type.NUMBER },
                texture: { type: Type.NUMBER },
                clarity: { type: Type.NUMBER },
              },
              required: ["hydration", "texture", "clarity"],
            },
            areaConcerns: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  area: { type: Type.STRING },
                  concern: { type: Type.STRING },
                },
                required: ["area", "concern"],
              },
            },
            tips: { type: Type.ARRAY, items: { type: Type.STRING } },
            summary: { type: Type.STRING },
          },
          required: ["skinType", "concerns", "glowScore", "scoreBreakdown", "areaConcerns", "tips", "summary"],
        },
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return null;
  }
}

// --- Types ---

type Screen = 'landing' | 'setup' | 'home' | 'routine' | 'progress' | 'profile';

interface SkinProfile {
  type: string[];
  concerns: string[];
}

// --- Mock Data ---

const SKIN_SCORE_DATA = [
  { day: 'Mon', score: 65 },
  { day: 'Tue', score: 68 },
  { day: 'Wed', score: 62 },
  { day: 'Thu', score: 75 },
  { day: 'Fri', score: 82 },
  { day: 'Sat', score: 78 },
  { day: 'Sun', score: 85 },
];

const MORNING_ROUTINE = [
  { id: 1, name: 'Cleanser', brand: 'CeraVe Hydrating', completed: true },
  { id: 2, name: 'Toner', brand: 'Paula\'s Choice BHA', completed: false },
  { id: 3, name: 'Moisturizer', brand: 'La Roche-Posay Toleriane', completed: false },
  { id: 4, name: 'Sunscreen', brand: 'Beauty of Joseon', completed: false },
];

const NIGHT_ROUTINE = [
  { id: 1, name: 'Oil Cleanser', brand: 'Anua Heartleaf', completed: false },
  { id: 2, name: 'Cleanser', brand: 'CeraVe Hydrating', completed: false },
  { id: 3, name: 'Serum', brand: 'The Ordinary Retinol', completed: false },
  { id: 4, name: 'Moisturizer', brand: 'Kiehl\'s Ultra Facial', completed: false },
];

// --- Components ---

const BottomNav = ({ active, onNavigate }: { active: Screen, onNavigate: (s: Screen) => void }) => {
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

// --- Screens ---

const LandingScreen = ({ onNext }: { onNext: () => void }) => (
  <div className="min-h-screen bg-brand-400 flex flex-col items-center justify-center p-8 text-white">
    <motion.div 
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="w-32 h-32 bg-brand-50 rounded-3xl flex items-center justify-center mb-6 shadow-xl"
    >
      <div className="flex flex-col items-center">
        <Sparkles className="text-brand-400" size={48} />
        <span className="text-brand-400 font-display font-bold text-xl mt-1">GLOW</span>
      </div>
    </motion.div>
    
    <motion.h1 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="text-3xl font-display font-bold text-center mb-2"
    >
      GLOW
    </motion.h1>
    
    <motion.p 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="text-lg font-medium text-center italic mb-12 opacity-90"
    >
      "Because Every Skin Deserves to Glow"
    </motion.p>

    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.4 }}
      className="w-full max-w-xs space-y-4"
    >
      <div className="space-y-1">
        <h2 className="text-sm font-semibold ml-1 text-white/80">Welcome</h2>
        <input 
          type="email" 
          placeholder="Email" 
          className="w-full bg-white text-slate-900 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-white/50 transition-all placeholder:text-slate-400"
        />
        <input 
          type="password" 
          placeholder="Password" 
          className="w-full bg-white text-slate-900 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-white/50 transition-all placeholder:text-slate-400"
        />
      </div>
      
      <button 
        onClick={onNext}
        className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl shadow-lg active:scale-95 transition-transform"
      >
        Login
      </button>

      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/20"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-brand-400 px-2 text-white/60 font-medium">Or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={onNext}
          className="flex items-center justify-center gap-2 bg-white text-slate-900 font-bold py-3 rounded-xl shadow-md active:scale-95 transition-transform text-sm"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
            />
          </svg>
          Google
        </button>
        <button 
          onClick={onNext}
          className="flex items-center justify-center gap-2 bg-white text-slate-900 font-bold py-3 rounded-xl shadow-md active:scale-95 transition-transform text-sm"
        >
          <User className="w-4 h-4" />
          Apple
        </button>
      </div>
      
      <button className="w-full text-center text-sm font-medium hover:underline text-white/80">
        Don't have an account? <span className="text-white font-bold">Sign Up</span>
      </button>
    </motion.div>
  </div>
);

const SetupScreen = ({ onNext }: { onNext: (profile: SkinProfile) => void }) => {
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
            <div className="flex items-center gap-3">
              <span className="font-medium">other concerns</span>
              <button className="bg-white/20 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">write down</button>
            </div>
          </div>
        </section>

        <div className="h-px bg-white/20" />

        <section>
          <h2 className="text-lg font-bold mb-4">main concerns:</h2>
          <div className="grid grid-cols-2 gap-4">
            {['Acne', 'Sensitivity', 'Dullness', 'texture', 'Dark spots'].map(concern => (
              <label key={concern} className="flex items-center gap-3 cursor-pointer group">
                <div 
                  onClick={() => toggle(concerns, setConcerns, concern)}
                  className={cn(
                    "w-6 h-6 rounded-md border-2 border-white/50 flex items-center justify-center transition-all",
                    concerns.includes(concern) ? "bg-white border-white" : "group-hover:border-white"
                  )}
                >
                  {concerns.includes(concern) && <CheckCircle2 size={16} className="text-brand-400" />}
                </div>
                <span className="capitalize font-medium">{concern}</span>
              </label>
            ))}
            <div className="flex items-center gap-3">
              <span className="font-medium">Other</span>
              <button className="bg-white/20 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">write down</button>
            </div>
          </div>
        </section>
      </div>

      <button 
        onClick={() => onNext({ type: skinType, concerns })}
        className="w-full bg-white text-brand-400 font-bold py-4 rounded-2xl shadow-xl mt-8 active:scale-95 transition-transform"
      >
        CONTINUE
      </button>
    </div>
  );
};

const HomeScreen = ({ profile }: { profile: SkinProfile }) => {
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecs() {
      setLoading(true);
      const recs = await getSkincareRecommendations(profile.type, profile.concerns);
      setRecommendations(recs);
      setLoading(false);
    }
    fetchRecs();
  }, [profile]);
  
  return (
    <div className="pb-24 p-6 space-y-6">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Home Dashboard</h1>
          <div className="mt-2 bg-slate-100 px-4 py-2 rounded-xl text-slate-600 font-medium inline-block">
            Good morning Alvin, {today}
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
          <div className="bg-brand-100 p-4 rounded-2xl border border-brand-200">
            <h3 className="font-bold text-brand-700 mb-3">Routine :</h3>
            <ul className="space-y-2 text-sm font-medium text-brand-600">
              <li className="flex items-center gap-2"><CheckCircle2 size={14} /> Cleanser</li>
              <li className="flex items-center gap-2 opacity-60"><div className="w-3.5 h-3.5 rounded-full border border-brand-400" /> Toner</li>
              <li className="flex items-center gap-2 opacity-60"><div className="w-3.5 h-3.5 rounded-full border border-brand-400" /> Moisturizer</li>
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
            <span className="text-4xl font-display font-bold text-white">85</span>
            <span className="text-brand-400 font-bold text-sm">+12% this week</span>
          </div>
          <div className="mt-4 flex gap-1">
            {[1,2,3,4,5,6,7].map(i => (
              <div key={i} className={cn("h-1 flex-1 rounded-full", i < 6 ? "bg-brand-400" : "bg-white/20")} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

const RoutineScreen = () => {
  const [tab, setTab] = useState<'morning' | 'night'>('morning');
  
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
        {(tab === 'morning' ? MORNING_ROUTINE : NIGHT_ROUTINE).map((product) => (
          <div key={product.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
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
        ))}
      </div>

      <section className="pt-4">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Add product</h2>
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-6 flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-slate-200 rounded-2xl flex items-center justify-center text-slate-400">
            <Plus size={32} />
          </div>
          <div className="w-full space-y-2">
            <input placeholder="Product name" className="w-full bg-white border border-slate-100 px-4 py-2 rounded-xl text-sm" />
            <input placeholder="Product brand" className="w-full bg-white border border-slate-100 px-4 py-2 rounded-xl text-sm" />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Image slider area</h2>
        <div className="h-40 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-400 italic">
          Product Gallery
        </div>
      </section>
    </div>
  );
};

const ProgressScreen = () => {
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setImage(reader.result as string);
        handleAnalyze(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async (base64: string) => {
    setAnalyzing(true);
    setAnalysis(null);
    const result = await analyzeSkinPhoto(base64);
    setAnalysis(result);
    setAnalyzing(false);
  };

  return (
    <div className="pb-24 p-6 space-y-8">
      <h1 className="text-2xl font-display font-bold text-slate-900">Program Tracking</h1>
      
      <div className="bg-slate-100 rounded-3xl p-8 flex flex-col items-center text-center space-y-4 border border-slate-200">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-900">Take a photo</h2>
          <p className="text-sm text-slate-500">(use proper lighting)</p>
        </div>
        
        <div className="w-full relative group">
          {image ? (
            <div className="w-full h-64 rounded-2xl overflow-hidden border-2 border-brand-200 shadow-inner">
              <img src={image} alt="Skin" className="w-full h-full object-cover" />
              {analyzing && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center text-white space-y-3">
                  <Sparkles className="animate-spin text-brand-300" size={32} />
                  <p className="font-bold text-sm">AI Analyzing...</p>
                </div>
              )}
            </div>
          ) : (
            <label className="w-full h-48 bg-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-300 cursor-pointer hover:bg-slate-300 transition-colors">
              <Camera size={48} strokeWidth={1.5} />
              <span className="text-xs font-bold mt-2 uppercase tracking-widest">Click to upload</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          )}
        </div>
        
        {!analyzing && !analysis && image && (
          <button 
            onClick={() => image && handleAnalyze(image.split(',')[1])}
            className="bg-brand-600 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-brand-200 active:scale-95 transition-transform flex items-center gap-2"
          >
            <Sparkles size={18} /> Re-analyze
          </button>
        )}

        {!image && (
          <p className="text-sm font-medium text-slate-600">before / after comparison</p>
        )}
      </div>

      <AnimatePresence>
        {analysis && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-50 rounded-full -mr-16 -mt-16" />
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="text-brand-500" size={20} />
                <h2 className="text-lg font-bold text-slate-900">AI Skin Analysis</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Skin Type</p>
                  <p className="font-bold text-slate-900">{analysis.skinType}</p>
                </div>
                <div className="bg-brand-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-1">Glow Score</p>
                  <p className="text-2xl font-display font-bold text-brand-600">{analysis.glowScore}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-3">Score Breakdown</h3>
                  <div className="space-y-3">
                    {Object.entries(analysis.scoreBreakdown).map(([key, value]: [string, any]) => (
                      <div key={key} className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          <span>{key}</span>
                          <span>{value}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${value}%` }}
                            className="h-full bg-brand-400"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-3">Area Analysis</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {analysis.areaConcerns.map((item: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-xs font-bold text-slate-700 capitalize">{item.area}</span>
                        <span className="text-xs text-slate-500">{item.concern}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2">Expert Tips</h3>
                  <ul className="space-y-2">
                    {analysis.tips.map((tip: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <section>
        <h2 className="text-lg font-bold text-slate-900 mb-4 text-center">Weekly skin score</h2>
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={SKIN_SCORE_DATA}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                dy={10}
              />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ color: '#e11d48', fontWeight: 'bold' }}
              />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#e11d48" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#e11d48', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
};

const ProfileScreen = ({ onLogout }: { onLogout: () => void }) => {
  return (
    <div className="pb-24 p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-display font-bold text-slate-900">My profile</h1>
        <button onClick={onLogout} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
          <LogOut size={24} />
        </button>
      </div>

      <section className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">Name:</label>
          <div className="bg-slate-100 px-4 py-3 rounded-xl font-medium text-slate-700">
            Alvin Mbogo
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
            <p className="font-bold text-slate-700">Oily / Sensitive</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Goal:</p>
            <p className="font-bold text-slate-700">Clear Texture</p>
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

// --- Main App ---

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('landing');
  const [profile, setProfile] = useState<SkinProfile>({ type: [], concerns: [] });

  // Simple navigation handler
  const navigate = (screen: Screen) => {
    setCurrentScreen(screen);
    window.scrollTo(0, 0);
  };

  const handleSetupComplete = (newProfile: SkinProfile) => {
    setProfile(newProfile);
    navigate('home');
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-brand-50 relative font-sans">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScreen}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          {currentScreen === 'landing' && <LandingScreen onNext={() => navigate('setup')} />}
          {currentScreen === 'setup' && <SetupScreen onNext={handleSetupComplete} />}
          {currentScreen === 'home' && <HomeScreen profile={profile} />}
          {currentScreen === 'routine' && <RoutineScreen />}
          {currentScreen === 'progress' && <ProgressScreen />}
          {currentScreen === 'profile' && <ProfileScreen onLogout={() => navigate('landing')} />}
        </motion.div>
      </AnimatePresence>

      {['home', 'routine', 'progress', 'profile'].includes(currentScreen) && (
        <BottomNav active={currentScreen} onNavigate={navigate} />
      )}
    </div>
  );
}
