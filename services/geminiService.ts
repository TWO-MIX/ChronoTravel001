
import { GoogleGenAI, Type } from "@google/genai";
import { WatchInfo, Source, MarketingScenario, UserPreferences, MarketAnalysis, VintageAd } from "../types";

// --- API PRESETS ---
// Using Flash models to avoid mandatory UI key-selection requirements
const IDENTIFICATION_MODEL = 'gemini-3-flash-preview'; 
const RESEARCH_MODEL = 'gemini-3-flash-preview'; 
const GENERATION_MODEL = 'gemini-2.5-flash-image'; 

/**
 * Programmatically apply branding watermark to generated images
 */
const applyWatermark = async (base64Data: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(base64Data);

      // Draw original image
      ctx.drawImage(img, 0, 0);
      
      // Configure watermark text
      const fontSize = Math.max(14, Math.floor(img.width * 0.03));
      ctx.font = `bold ${fontSize}px "JetBrains Mono", monospace`;
      const text = "#chronoportalpowerbygemini";
      const metrics = ctx.measureText(text);
      
      // Position: bottom right
      const padding = 20;
      const x = canvas.width - metrics.width - padding;
      const y = canvas.height - padding;

      // Semi-transparent background for legibility
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      if (ctx.roundRect) {
        ctx.roundRect(x - 10, y - fontSize - 5, metrics.width + 20, fontSize + 15, 8);
      } else {
        ctx.fillRect(x - 10, y - fontSize - 5, metrics.width + 20, fontSize + 15);
      }
      ctx.fill();
      
      // Draw text
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.fillText(text, x, y);
      
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(base64Data);
    img.src = base64Data;
  });
};

const HOROLOGICAL_WHITELIST = [
  "fratellowatches.com",
  "hodinkee.com",
  "chronomaddox.com",
  "omegaforums.net",
  "rolexforums.com",
  "seikoworldtime.com",
  "vintagerolexforum.com",
  "plus9time.com",
  "speedmaster101.com",
  "watchuseek.com",
  "calibercorner.com"
];

// Initialize Gemini client strictly as per guidelines
export const identifyWatch = async (base64Image: string): Promise<WatchInfo> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
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
          text: `Act as a Lead Forensic Horologist and Authentication Agent. 
          
          VIRTUAL MCP PROTOCOL:
          1. [VISUAL ANALYSIS]: Identify the brand, model, and potential reference numbers. For Seiko watches the model number is usually located on the bottom part of the dial so zoom in on that part to identify the model.
          2. [TARGETED SEARCH]: Search for identified model technical specifications, prioritizing: ${HOROLOGICAL_WHITELIST.join(", ")}.
          3. [DATA MATCHING]: Compare features against verified entries.
          4. [VERIFICATION LOG]: Output a structured forensic audit.`
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
          },
          forensicVerification: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                feature: { type: Type.STRING },
                observation: { type: Type.STRING },
                status: { type: Type.STRING, enum: ["Confirmed", "Discrepancy", "Variation"] },
                details: { type: Type.STRING }
              },
              required: ["feature", "observation", "status", "details"]
            }
          }
        },
        required: ["modelName", "releaseYear", "eraContext", "clothingDescription", "environmentDescription", "historicalFunFact", "marketingScenarios", "forensicVerification"]
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
          title: chunk.web.title || 'View Database Entry',
          url: chunk.web.uri
        });
      }
    });
  }

  return { ...watchData, sources };
};

export const transformEra = async (
  base64Image: string,
  watch: WatchInfo,
  prefs: UserPreferences,
  customScenario?: MarketingScenario,
  skipWatermark: boolean = false
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const env = customScenario?.environmentPrompt || watch.environmentDescription;
  const cloth = customScenario?.clothingPrompt || watch.clothingDescription;
  const location = prefs.country ? ` in ${prefs.country}` : '';
  const targetYear = prefs.customYear || watch.releaseYear;
  
  const prompt = `Transform this photo into a photo-realistic time-portal to the year ${targetYear}. 
  Keep the user's hand and the ${watch.modelName} watch exactly in place. 
  
  INSTRUCTIONS:
  1. CLOTHING: Change the clothing on the wrist/arm to: ${cloth}. 
  2. BACKGROUND: Completely replace the background environment with: ${env}${location}. 
  
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
    config: {
      imageConfig: {
        aspectRatio: "1:1"
      }
    }
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      const rawBase64 = `data:image/png;base64,${part.inlineData.data}`;
      if (skipWatermark) return rawBase64;
      return await applyWatermark(rawBase64);
    }
  }
  
  throw new Error("Failed to generate transformed image");
};

export const analyzeMarketValue = async (modelName: string): Promise<MarketAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: RESEARCH_MODEL, 
    contents: {
      parts: [{
        text: `Analyze market trends for: "${modelName}". Return JSON matching schema.`
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

/**
 * Searches for historical vintage advertisements for the specified watch artifact
 */
export const findVintageAds = async (watch: WatchInfo): Promise<VintageAd[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: RESEARCH_MODEL,
    contents: {
      parts: [{
        text: `Find information about real historical vintage advertisements and marketing campaigns for the ${watch.modelName} watch from approximately ${watch.releaseYear}. 
        Return a list of 3-4 significant campaigns. 
        For each, provide a catchy headline that captures the era's vibe, the specific year, and a detailed visual description of what the original print advertisement looked like.`
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
            year: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: ["id", "headline", "year", "description"]
        }
      }
    }
  });

  const ads: VintageAd[] = JSON.parse(response.text);
  
  // Extract grounding sources to satisfy guideline requirements
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (groundingChunks) {
    const webSources: Source[] = groundingChunks
      .filter((chunk: any) => chunk.web && chunk.web.uri)
      .map((chunk: any) => ({
        title: chunk.web.title || 'Historical Reference',
        url: chunk.web.uri
      }));
    
    // Attach sources to ads for reference
    ads.forEach(ad => ad.sources = webSources);
  }

  return ads;
};

/**
 * Restores a vintage ad image using the image generation model based on a descriptive prompt
 */
export const restoreAdImage = async (ad: VintageAd, modelName: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Recreate an authentic, high-quality vintage print advertisement for the ${modelName} watch as it would have appeared in a magazine in ${ad.year}. 
  The advertisement headline is: "${ad.headline}". 
  Visual Content: ${ad.description}.
  Ensure the style perfectly matches the graphic design and photography trends of ${ad.year}. Use era-appropriate fonts, color grading, and paper texture. The image should look like a professional, well-preserved historical artifact. No modern digital elements.`;

  const response = await ai.models.generateContent({
    model: GENERATION_MODEL,
    contents: {
      parts: [{ text: prompt }],
    },
    config: {
      imageConfig: {
        aspectRatio: "3:4"
      }
    }
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      const rawBase64 = `data:image/png;base64,${part.inlineData.data}`;
      // Apply app-wide branding watermark
      return await applyWatermark(rawBase64);
    }
  }
  
  throw new Error("Neural Restoration failed to produce an image artifact.");
};
