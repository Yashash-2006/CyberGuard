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
    Analyze the following ${context} for cybersecurity threats, specifically phishing, scams, and social engineering patterns.
    
    Content: "${content}"
    
    Return the analysis in valid JSON format with the following structure:
    {
      "isThreat": boolean,
      "level": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      "explanation": "Brief explanation of why it is or isn't a threat",
      "category": "Phishing" | "Scam" | "Social Engineering" | "Safe",
      "defenceTips": ["Tip 1", "Tip 2"]
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
