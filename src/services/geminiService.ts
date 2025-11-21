import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

// Initialize the Gemini client
// API Key embedded for distribution
const apiKey = import.meta.env.VITE_GOOGLE_API_KEY || "AIzaSyDoUBZe5ch7egumFutVbqlXNkb5TzVrpM8";
if (!apiKey) {
  console.error("Missing API key");
}
const ai = new GoogleGenAI({ apiKey: apiKey });

export const analyzePrompt = async (userPrompt: string): Promise<AnalysisResult> => {
  if (!userPrompt.trim()) {
    throw new Error("Prompt cannot be empty");
  }


  const modelId = "gemini-2.5-flash";

  const systemInstruction = `
    You are a world-class Expert Prompt Engineer and AI Interaction Specialist. 
    Your goal is to help users write better prompts for Large Language Models (LLMs).
    Analyze the user's input prompt based on clarity, specificity, context, constraints, and persona.
    
    IMPORTANT: Provide ALL output in KOREAN (분석 내용과 개선된 프롬프트 모두 한국어로 작성).
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER, description: "A score from 0 to 100 rating the prompt quality." },
            summary: { type: Type.STRING, description: "A one-sentence summary of the analysis in Korean." },
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of 1-3 things the prompt does well in Korean."
            },
            weaknesses: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of 1-3 things the prompt lacks in Korean."
            },
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Specific, actionable advice to improve the prompt in Korean."
            },
            optimizedPrompt: { type: Type.STRING, description: "A fully rewritten, optimized version of the prompt in Korean." },
          },
          required: ["score", "summary", "strengths", "weaknesses", "suggestions", "optimizedPrompt"],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from AI");
    }

    const result = JSON.parse(text) as AnalysisResult;
    return result;

  } catch (error) {
    console.error("Error analyzing prompt:", error);
    throw error;
  }
};
