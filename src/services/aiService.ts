/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";
import { SkincareRecommendation, SkinAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function getSkincareRecommendations(skinType: string[], concerns: string[]): Promise<SkincareRecommendation[]> {
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
  } catch (error: any) {
    console.error("Gemini Error:", error);
    const message = error.message?.includes("API key") 
      ? "AI service is currently unavailable. Please check back later." 
      : "Failed to generate recommendations. Please try again.";
    throw new Error(message);
  }
}

export async function analyzeSkinPhoto(base64Image: string): Promise<SkinAnalysis | null> {
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
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    const message = error.message?.includes("API key") 
      ? "AI analysis is currently unavailable. Please check back later." 
      : "Failed to analyze photo. Please ensure the image is clear and try again.";
    throw new Error(message);
  }
}

export async function chatWithAI(message: string, history: { role: string, content: string }[], skinProfile: any): Promise<string> {
  const systemPrompt = `You are Glow AI, a professional skincare assistant. 
  The user has the following skin profile: ${JSON.stringify(skinProfile)}. 
  Provide helpful, concise, and scientifically-backed skincare advice. 
  If the user asks about products, recommend ones suitable for their skin type. 
  Always encourage seeing a dermatologist for serious concerns.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: [
        { role: "user", parts: [{ text: systemPrompt }] },
        ...history.map((h: any) => ({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.content }]
        })),
        { role: "user", parts: [{ text: message }] }
      ],
    });

    return response.text || "I'm sorry, I couldn't generate a response.";
  } catch (error: any) {
    console.error("Chat Error:", error);
    throw new Error("Failed to get AI response. Please try again.");
  }
}
