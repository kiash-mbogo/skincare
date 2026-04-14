/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Screen = 'landing' | 'setup' | 'home' | 'routine' | 'progress' | 'profile';

export interface SkinProfile {
  type: string[];
  concerns: string[];
}

export interface SkincareRecommendation {
  name: string;
  brand: string;
  reason: string;
  category: string;
}

export interface SkinAnalysis {
  skinType: string;
  concerns: string[];
  glowScore: number;
  scoreBreakdown: {
    hydration: number;
    texture: number;
    clarity: number;
  };
  areaConcerns: {
    area: string;
    concern: string;
  }[];
  tips: string[];
  summary: string;
}

export interface RoutineItem {
  id?: string;
  userId: string;
  name: string;
  brand: string;
  completed: boolean;
  type: 'morning' | 'night';
  createdAt: any;
}
