
import { GoogleGenAI, Type } from "@google/genai";
import { WatchInfo, Source, MarketingScenario, UserPreferences, MarketAnalysis } from "../types";

// --- API PRESETS ---
// Model for analyzing images and text (Identification)
// Note: Nano Banana (gemini-2.5-flash-image) does not support tools/search, so we use Gemini 3 Flash for identification.
const IDENTIFICATION_MODEL = 'gemini-3-flash-preview'; 

// Model for generating visual results (Nano Banana)
// As requested, this is set to 'gemini-2.5-flash-image' for image transformation and panorama generation.
const GENERATION_MODEL = 'gemini-2.5-flash-image'; 

// Note: Using a fresh instance for calls as per guidelines
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const identifyWatch = async (base64Image: string): Promise<WatchInfo> => {
  const ai = getAI();
  
  const response = await ai.models.generateContent({
    model: IDENTIFICATION_MODEL,
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
  prefs: UserPreferences,
  customScenario?: MarketingScenario
): Promise<string> => {
  const ai = getAI();
  
  const env = customScenario?.environmentPrompt || watch.environmentDescription;
  const cloth = customScenario?.clothingPrompt || watch.clothingDescription;
  
  // Construct user persona string
  const demographic = `${prefs.age ? prefs.age + ' year old ' : ''}${prefs.gender || 'person'}`;
  const location = prefs.country ? ` in ${prefs.country}` : '';
  
  const prompt = `Transform this photo into a historical time-portal. 
  Keep the user's hand and the ${watch.modelName} watch exactly in place. 
  1. Change the clothing on the wrist/arm to: ${cloth}, styled specifically for a ${demographic}. 
  2. Completely replace the background environment behind the hand to be: ${env}${location}. 
  The final image should look like a professional cinematic still from ${watch.releaseYear}. 
  Maintain high realism and seamless blending.`;

  const response = await ai.models.generateContent({
    model: GENERATION_MODEL,
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

export const generatePanorama = async (
  watch: WatchInfo, 
  prefs: UserPreferences, 
  customScenario?: MarketingScenario
): Promise<string> => {
  const ai = getAI();
  
  const env = customScenario?.environmentPrompt || watch.environmentDescription;
  const location = prefs.country ? ` in ${prefs.country}` : '';
  
  const prompt = `Generate a wide angle panoramic environmental shot (16:9 aspect ratio) of: ${env}${location}. 
  This image acts as a 360-degree background environment for a first-person view.
  Style: Cinematic, photorealistic, immersive, high detail, era-appropriate (${watch.releaseYear}). 
  Perspective: Eye-level looking out at the horizon. Wide field of view.`;

  const response = await ai.models.generateContent({
    model: GENERATION_MODEL,
    contents: {
      parts: [{ text: prompt }],
    },
    config: {
      imageConfig: { aspectRatio: "16:9" }
    }
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  
  throw new Error("Failed to generate panorama");
};

export const analyzeMarketValue = async (modelName: string): Promise<MarketAnalysis> => {
  const ai = getAI();
  const currentYear = new Date().getFullYear();
  
  const response = await ai.models.generateContent({
    model: IDENTIFICATION_MODEL, // Uses Gemini 3 Flash for search capabilities
    contents: {
      parts: [{
        text: `Act as a professional vintage watch market analyst (MCP Agent). 
        Perform a search on eBay sold listings, Chrono24, and auction results for: "${modelName}".
        
        1. Determine the current market price range (min and max) in USD.
        2. Analyze the price trend over the last 3 years (${currentYear - 3}, ${currentYear - 2}, ${currentYear - 1}). Estimate the average market value for each of those years based on historical knowledge and search results.
        3. Determine the market sentiment (Bullish, Bearish, or Stable).
        4. Give it an investment rating (S, A, B, C).
        5. Provide a short, 1-sentence insight about its collectability.
        
        Return ONLY valid JSON matching this schema.`
      }]
    },
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          currency: { type: Type.STRING },
          currentMinPrice: { type: Type.NUMBER },
          currentMaxPrice: { type: Type.NUMBER },
          priceHistory: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                year: { type: Type.STRING },
                averagePrice: { type: Type.NUMBER }
              },
              required: ["year", "averagePrice"]
            }
          },
          marketSentiment: { type: Type.STRING, enum: ["Bullish", "Bearish", "Stable"] },
          investmentRating: { type: Type.STRING },
          insight: { type: Type.STRING }
        },
        required: ["currency", "currentMinPrice", "currentMaxPrice", "priceHistory", "marketSentiment", "investmentRating", "insight"]
      }
    }
  });

  return JSON.parse(response.text) as MarketAnalysis;
};
