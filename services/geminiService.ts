
import { GoogleGenAI, Type } from "@google/genai";
import { WatchInfo, Source } from "../types";

// Note: Using a fresh instance for calls as per guidelines
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const identifyWatch = async (base64Image: string): Promise<WatchInfo> => {
  const ai = getAI();
  // Using gemini-3-pro-preview for advanced reasoning and Google Search access
  const model = 'gemini-3-pro-preview';
  
  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image,
          },
        },
        {
          text: `Use Google Search to accurately identify this vintage/antique wrist watch. 
          Analyze the dial markings, logo, sub-dials, case shape, and any visible text (like "Automatic", "Quartz", or small "T" marks). 
          Return a JSON object with:
          - modelName: The specific brand and model (e.g., "Casio DB-520 Databank").
          - releaseYear: The exact or approximate release year.
          - eraContext: The cultural/social atmosphere of that era.
          - clothingDescription: Contextually appropriate clothing for that watch in its time.
          - environmentDescription: A description of a typical environment where this watch would belong.
          - historicalFunFact: A unique fact about this specific model's horological significance.`
        },
      ],
    },
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          modelName: { type: Type.STRING },
          releaseYear: { type: Type.STRING },
          eraContext: { type: Type.STRING },
          clothingDescription: { type: Type.STRING },
          environmentDescription: { type: Type.STRING },
          historicalFunFact: { type: Type.STRING },
        },
        required: ["modelName", "releaseYear", "eraContext", "clothingDescription", "environmentDescription", "historicalFunFact"]
      }
    },
  });

  const watchData: WatchInfo = JSON.parse(response.text);

  // Extract grounding sources as required by guidelines
  const sources: Source[] = [];
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (groundingChunks) {
    groundingChunks.forEach((chunk: any) => {
      if (chunk.web && chunk.web.uri) {
        sources.push({
          title: chunk.web.title || 'View Reference',
          url: chunk.web.uri
        });
      }
    });
  }

  // Deduplicate sources by URL
  const uniqueSources = sources.reduce((acc: Source[], current) => {
    const x = acc.find(item => item.url === current.url);
    if (!x) return acc.concat([current]);
    return acc;
  }, []);

  return { ...watchData, sources: uniqueSources };
};

export const transformEra = async (
  base64Image: string,
  watch: WatchInfo
): Promise<string> => {
  const ai = getAI();
  const prompt = `Transform this photo into a historical time-portal. 
  Keep the user's hand and the ${watch.modelName} watch exactly in place. 
  1. Change the clothing on the wrist/arm to: ${watch.clothingDescription}. 
  2. Completely replace the background environment behind the hand to be: ${watch.environmentDescription}. 
  The final image should look like a professional cinematic still from ${watch.releaseYear}. 
  Maintain high realism and seamless blending.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image,
          },
        },
        { text: prompt },
      ],
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  
  throw new Error("Failed to generate transformed image");
};
