
import { GoogleGenAI, Type } from "@google/genai";
import { WatchInfo, Source, MarketingScenario, UserPreferences, MarketAnalysis, VintageAd } from "../types";

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
          text: `Act as a Master Horologist Agent (Visual ID Protocol). Your goal is to identify this watch with forensic precision.

          EXECUTION PLAN:
          1. [VISUAL SCAN] Transcribe every legible letter/number on the dial and bezel. Note distinct features (hands shape, indices, sub-dial layout).
          2. [SEARCH QUERY] Use the Google Search tool to cross-reference these visual markers. Search for specific dial variations to find the exact Reference Number (Ref. No).
          3. [VERIFICATION] Compare the search results visually with the input image to confirm the match.
          4. [OUTPUT] Compile the final data into the required JSON format.

          Output Constraints:
          - modelName: Must include Brand + Model + (Optional) Nickname/Reference. Example: "Omega Speedmaster Professional 105.012 'Moonwatch'".
          - releaseYear: The specific year this reference was introduced.
          - eraContext: 1-2 sentences capturing the zeitgeist of that year.
          - clothingDescription: Historically accurate fashion for a wearer of this specific watch in that year.
          - environmentDescription: A setting that fits the watch's purpose (e.g. Race track for chronographs, Dive boat for divers, Boardroom for dress watches).
          - historicalFunFact: A specific, non-generic fact about this model's history.
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
  const targetYear = prefs.customYear || watch.releaseYear;
  
  // Enhanced prompt to strictly enforce year aesthetics
  const prompt = `Transform this photo into a immersive time-portal to the year ${targetYear}. 
  Keep the user's hand and the ${watch.modelName} watch exactly in place (do not modify the watch face). 
  
  INSTRUCTIONS:
  1. CLOTHING: Change the clothing on the wrist/arm to: ${cloth}. 
     - CRITICAL: The fabric, cut, and style must be accurate to ${targetYear}. 
     - If ${targetYear} is futuristic (e.g. 2077), use sci-fi technical fabrics, circuitry patterns, or cyberware.
     
  2. BACKGROUND: Completely replace the background environment. 
     - Base Scene: ${env}${location}. 
     - CRITICAL: Re-imagine this environment visually for the year ${targetYear}.
     - If ${targetYear} > 2050: Use cyberpunk aesthetics, neon lights, holograms, flying traffic, high-tech architecture.
     - If ${targetYear} < 1950: Use sepia tones, period architecture, vintage cars, steam/smoke.
     - If ${targetYear} is contemporary: Use modern styling.
     
  The final image should look like a professional cinematic still from a movie set in ${targetYear}. 
  Maintain high realism, correct lighting, and seamless blending between the hand and the new world.`;

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
  const targetYear = prefs.customYear || watch.releaseYear;
  
  const prompt = `Generate a wide angle panoramic environmental shot (16:9 aspect ratio).
  Location: ${env}${location}.
  Time Period: ${targetYear}.
  
  VISUAL DIRECTIVE:
  Render this environment strictly as it would appear in the year ${targetYear}.
  - If the year is futuristic (e.g. 2077+), strictly enforce a Cyberpunk/Sci-Fi aesthetic: Neon signs, holograms, flying cars, mega-structures, dark rainy atmosphere or high-tech utopia.
  - If historical, ensure total period accuracy.
  
  Style: Cinematic, photorealistic, immersive, high detail. 
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
    model: IDENTIFICATION_MODEL, 
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

export const findVintageAds = async (watch: WatchInfo): Promise<VintageAd[]> => {
  const ai = getAI();
  
  const response = await ai.models.generateContent({
    model: IDENTIFICATION_MODEL,
    contents: {
      parts: [{
        text: `Act as a specialized horological archivist. Find 3 distinct, real-world vintage advertising campaigns specifically for the exact watch model: "${watch.modelName}" released around ${watch.releaseYear}.

        CRITICAL INSTRUCTIONS:
        1. STRICTLY MATCH THE MODEL: If the watch is a specific reference (e.g. "Seiko 6139 Pogue", "Omega Speedmaster 105.012"), do not return generic brand ads. Return ads specifically for that model reference or specific line.
        2. IGNORE GENERIC ADS: If you cannot find a specific ad for this exact model, find the closest specific model variant from that year, but strictly avoid modern ads or generic brand awareness campaigns.
        3. ERA ACCURACY: Focus on the marketing messaging and visual style from ${watch.releaseYear} or the immediate years following.
        
        For each ad, provide:
        1. The main headline or slogan used (e.g. "The Watch That Went To The Moon").
        2. A detailed description of the visual imagery (layout, people, background, specific watch angle).
        3. The approximate year it ran.
        4. A highly detailed image generation prompt to digitally recreate this specific ad poster. Include details about film grain, typography style, and color grading of that specific year.
        
        Return as JSON.`
      }]
    },
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            headline: { type: Type.STRING },
            description: { type: Type.STRING },
            year: { type: Type.STRING },
            visualPrompt: { type: Type.STRING }
          },
          required: ["id", "headline", "description", "year", "visualPrompt"]
        }
      }
    }
  });

  return JSON.parse(response.text) as VintageAd[];
};

export const restoreAdImage = async (ad: VintageAd, watchModel: string): Promise<string> => {
  const ai = getAI();
  
  const prompt = `Create a high-fidelity vintage advertisement poster for the ${watchModel}.
  Year: ${ad.year}.
  Headline style: "${ad.headline}".
  Visuals: ${ad.visualPrompt}.
  Style: Authentic ${ad.year} magazine print advertisement, slightly worn paper texture, retro typography, nostalgic color grading.
  Ensure the watch is featured prominently and accurately matches the era's aesthetic.`;

  const response = await ai.models.generateContent({
    model: GENERATION_MODEL,
    contents: {
      parts: [{ text: prompt }],
    },
    config: {
      imageConfig: { aspectRatio: "3:4" }
    }
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  
  throw new Error("Failed to restore ad image");
};
