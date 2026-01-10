
import { GoogleGenAI, Type } from "@google/genai";
import { WatchInfo, Source, MarketingScenario } from "../types";

// Note: Using a fresh instance for calls as per guidelines
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const identifyWatch = async (base64Image: string): Promise<WatchInfo> => {
  const ai = getAI();
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
          Analyze the dial markings, logo, and case. 
          Return a JSON object with:
          - modelName: Brand and model.
          - releaseYear: Release year.
          - eraContext: Atmosphere of the era.
          - clothingDescription: Standard attire for the era.
          - environmentDescription: Standard environment for the era.
          - historicalFunFact: Unique fact.
          - marketingScenarios: An array of 3 possible historical marketing scenarios for this specific watch based on its actual history or category (e.g., Space for Speedmasters, Diving for Submariners, Office for Databanks, Aviation for Navitimers). Each should have:
              - id: unique string
              - title: short catchy name (e.g. "Lunar Landing", "Deep Sea Exploration", "80s Wall Street")
              - description: short historical blurb about how it was marketed
              - environmentPrompt: specific description of the background for AI image generation
              - clothingPrompt: specific description of what the user's arm/sleeve should look like`
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
          marketingScenarios: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                environmentPrompt: { type: Type.STRING },
                clothingPrompt: { type: Type.STRING },
              },
              required: ["id", "title", "description", "environmentPrompt", "clothingPrompt"]
            }
          }
        },
        required: ["modelName", "releaseYear", "eraContext", "clothingDescription", "environmentDescription", "historicalFunFact", "marketingScenarios"]
      }
    },
  });

  const watchData: WatchInfo = JSON.parse(response.text);

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

  const uniqueSources = sources.reduce((acc: Source[], current) => {
    const x = acc.find(item => item.url === current.url);
    if (!x) return acc.concat([current]);
    return acc;
  }, []);

  return { ...watchData, sources: uniqueSources };
};

export const transformEra = async (
  base64Image: string,
  watch: WatchInfo,
  customScenario?: MarketingScenario
): Promise<string> => {
  const ai = getAI();
  
  const env = customScenario?.environmentPrompt || watch.environmentDescription;
  const cloth = customScenario?.clothingPrompt || watch.clothingDescription;
  
  const prompt = `Transform this photo into a historical time-portal. 
  Keep the user's hand and the ${watch.modelName} watch exactly in place. 
  1. Change the clothing on the wrist/arm to: ${cloth}. 
  2. Completely replace the background environment behind the hand to be: ${env}. 
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
