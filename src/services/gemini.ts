/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import { ThreatLevel } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface AnalysisResult {
  isThreat: boolean;
  level: ThreatLevel;
  explanation: string;
  category: 'Phishing' | 'Scam' | 'Social Engineering' | 'Safe';
  defenceTips: string[];
}

export async function analyzePotentialThreat(content: string, context: string = 'SMS Message'): Promise<AnalysisResult> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not defined');
  }

  const prompt = `
    System: You are Sentinel AI, a high-performance cybersecurity analysis engine. 
    Analyze the provided ${context} for phishing, scams, and social engineering.
    Provide precise classification based on modern threat vectors.
    
    Content: "${content}"
    
    Response Format (JSON):
    {
      "isThreat": boolean,
      "level": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      "explanation": "concise technical breakdown",
      "category": "Phishing" | "Scam" | "Social Engineering" | "Safe",
      "defenceTips": ["instantly actionable tip"]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error('Empty response from AI');
    
    return JSON.parse(resultText) as AnalysisResult;
  } catch (error) {
    console.error('Error in Gemini analysis:', error);
    return {
      isThreat: false,
      level: ThreatLevel.LOW,
      explanation: "Unable to analyze at this moment. Proceed with caution.",
      category: 'Safe',
      defenceTips: ["Avoid clicking any links", "Verify the sender through official channels"]
    };
  }
}
