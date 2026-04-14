/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { Screen, SkinProfile } from './types';
import { 
  subscribeToAuthChanges, 
  logout 
} from './services/authService';
import { 
  saveUserProfile, 
  getUserProfile 
} from './services/dbService';
import { BottomNav } from './components/BottomNav';
import { LandingScreen } from './components/LandingScreen';
import { SetupScreen } from './components/SetupScreen';
import { HomeScreen } from './components/HomeScreen';
import { RoutineScreen } from './components/RoutineScreen';
import { ProgressScreen } from './components/ProgressScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { ChatAssistant } from './components/ChatAssistant';

// --- Main App ---

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('landing');
  const [profile, setProfile] = useState<SkinProfile | null>(null);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Fetch profile
        const userProfile = await getUserProfile(firebaseUser.uid);
        if (userProfile) {
          setProfile(userProfile);
          setCurrentScreen('home');
        } else {
          setCurrentScreen('setup');
        }
      } else {
        setProfile(null);
        setCurrentScreen('landing');
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Simple navigation handler
  const navigate = (screen: Screen) => {
    setCurrentScreen(screen);
    window.scrollTo(0, 0);
  };

  const handleSetupComplete = async (newProfile: SkinProfile) => {
    if (!user) return;
    
    await saveUserProfile(user.uid, {
      ...newProfile,
      name: user.displayName || 'User'
    });
    setProfile(newProfile);
    navigate('home');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-50 flex items-center justify-center">
        <Sparkles className="animate-spin text-brand-400" size={48} />
      </div>
    );
  }

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
          {currentScreen === 'home' && profile && <HomeScreen profile={profile} />}
          {currentScreen === 'routine' && <RoutineScreen />}
          {currentScreen === 'progress' && <ProgressScreen />}
          {currentScreen === 'profile' && profile && <ProfileScreen profile={profile} onLogout={() => logout()} />}
        </motion.div>
      </AnimatePresence>
      
      {['home', 'routine', 'progress', 'profile'].includes(currentScreen) && (
        <BottomNav active={currentScreen} onNavigate={navigate} />
      )}

      {profile && ['home', 'routine', 'progress', 'profile'].includes(currentScreen) && (
        <ChatAssistant profile={profile} />
      )}
    </div>
  );
}
