import { GoogleGenAI } from "@google/genai";

const apiKey = import.meta.env.VITE_GOOGLE_API_KEY || "AIzaSyDoUBZe5ch7egumFutVbqlXNkb5TzVrpM8";
const ai = new GoogleGenAI({ apiKey: apiKey });

export const translateToEnglish = async (koreanText: string): Promise<string> => {
    const modelId = "gemini-2.5-flash";

    const systemInstruction = `
    You are a professional translator specializing in AI prompts.
    Translate the given Korean prompt into natural, professional English.
    Maintain the intent, tone, and technical accuracy.
    Output ONLY the translated text, nothing else.
  `;

    try {
        const response = await ai.models.generateContent({
            model: modelId,
            contents: `Translate this to English:\n\n${koreanText}`,
            config: {
                systemInstruction: systemInstruction,
            },
        });

        const text = response.text;
        if (!text) {
            throw new Error("No response from translator");
        }

        return text.trim();
    } catch (error) {
        console.error("Translation error:", error);
        throw error;
    }
};
