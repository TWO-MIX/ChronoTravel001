
import { GoogleGenAI, Type } from "@google/genai";
import { WatchInfo, Source, MarketingScenario, UserPreferences, MarketAnalysis, VintageAd } from "../types";

// --- API PRESETS ---
// Switched to Gemini 3 Flash for all identification and research tasks as per user constraint.
const IDENTIFICATION_MODEL = 'gemini-3-flash-preview'; 
const RESEARCH_MODEL = 'gemini-3-flash-preview'; 
const GENERATION_MODEL = 'gemini-2.5-flash-image'; 

/**
 * Creates a high-contrast "Blueprint" or "Vectorized" version of the image.
 * This assists the AI in identifying structural features (bezel markings, indices, hand shapes)
 * by stripping away noise, reflections, and complex lighting, matching technical drawings.
 */
export const vectorizeImage = async (base64Data: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(base64Data);

      canvas.width = img.width;
      canvas.height = img.height;
      
      // Step 1: Draw grayscale high-contrast base to isolate geometry
      ctx.filter = 'grayscale(100%) contrast(400%) brightness(110%)';
      ctx.drawImage(img, 0, 0);

      // Step 2: Edge detection overlay (simulating technical schematic tracing)
      ctx.globalCompositeOperation = 'difference';
      ctx.drawImage(img, 1, 1); 
      
      // Final Pass: Blueprint aesthetic for forensic analysis
      const finalCanvas = document.createElement('canvas');
      const finalCtx = finalCanvas.getContext('2d');
      if (!finalCtx) return resolve(base64Data);
      finalCanvas.width = img.width;
      finalCanvas.height = img.height;
      finalCtx.filter = 'invert(100%) contrast(150%) brightness(120%)';
      finalCtx.drawImage(canvas, 0, 0);
      
      resolve(finalCanvas.toDataURL('image/jpeg', 0.8).split(',')[1]);
    };
    img.src = `data:image/jpeg;base64,${base64Data}`;
  });
};

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
      ctx.drawImage(img, 0, 0);
      const fontSize = Math.max(14, Math.floor(img.width * 0.03));
      ctx.font = `bold ${fontSize}px "JetBrains Mono", monospace`;
      const text = "#chronoportalpowerbygemini";
      const metrics = ctx.measureText(text);
      const padding = 20;
      const x = canvas.width - metrics.width - padding;
      const y = canvas.height - padding;
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      if (ctx.roundRect) {
        ctx.roundRect(x - 10, y - fontSize - 5, metrics.width + 20, fontSize + 15, 8);
      } else {
        ctx.fillRect(x - 10, y - fontSize - 5, metrics.width + 20, fontSize + 15);
      }
      ctx.fill();
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
  "www.watchhunter.org/reference/seiko-watch-catalog-pdf-library",
  "seikoworldtime.com",
  "watchbase.com",
  "plus9time.com",
  "watchuseek.com",
  "calibercorner.com",
  "chrono24.com",
  "vintagewatchresources.com"
];

export const identifyWatch = async (originalBase64: string, blueprintBase64: string): Promise<WatchInfo> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: IDENTIFICATION_MODEL,
    contents: [{
      parts: [
        { text: "IMAGE A: PHOTOGRAPH" },
        { inlineData: { mimeType: 'image/jpeg', data: originalBase64 } },
        { text: "IMAGE B: STRUCTURAL BLUEPRINT (VECTOR MAPPING)" },
        { inlineData: { mimeType: 'image/jpeg', data: blueprintBase64 } },
        {
          text: `ACT AS A FORENSIC HOROLOGIST. Identify this watch using dual-stream technical verification.
          
          PHASE 1: STRUCTURAL MATCHING
          Examine IMAGE B specifically. Treat it as a technical schematic. Compare the hand-pinion center, lug geometry, crown guards, and bezel markers against technical watch manuals and patent drawings. 
          Analyze the dial layout vectors (sub-dial spacing, date window position) against official blueprints.
          
          PHASE 2: VISUAL VERIFICATION
          Cross-reference with IMAGE A to verify branding, dial text (e.g., 'T SWISS T'), and material patina to narrow down the specific reference number.
          
          PHASE 3: DATABASE SEARCH
          Search ${HOROLOGICAL_WHITELIST.join(", ")} to confirm the exact model and release year.
          
          Return JSON format precisely.`
        },
      ],
    }],
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          modelName: { type: Type.STRING, description: "Full brand and exact reference number" },
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
          },
          associatedMovies: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                movieTitle: { type: Type.STRING },
                characterName: { type: Type.STRING },
                context: { type: Type.STRING }
              },
              required: ["movieTitle", "characterName", "context"]
            }
          }
        },
        required: ["modelName", "releaseYear", "eraContext", "clothingDescription", "environmentDescription", "historicalFunFact", "marketingScenarios", "forensicVerification", "associatedMovies"]
      }
    },
  });

  const watchData: WatchInfo = JSON.parse(response.text || "{}");
  const sources: Source[] = [];
  const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
  if (groundingMetadata && groundingMetadata.groundingChunks) {
    groundingMetadata.groundingChunks.forEach((chunk: any) => {
      if (chunk.web && chunk.web.uri) {
        sources.push({ title: chunk.web.title || 'View Database Entry', url: chunk.web.uri });
      }
    });
  }
  return { ...watchData, sources };
};

// Fix: Completed the transformEra function to iterate through response parts and extract the generated image.
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
  const targetYear = prefs.customYear || watch.releaseYear;
  
  const prompt = `Transform this photo into a photorealistic scene set in the year ${targetYear}. 
  CRITICAL INSTRUCTION: Do NOT include any text, numbers, letters, years, labels, or graphical watermarks in the image. 
  
  RETAIN: The user's arm/hand and the ${watch.modelName} watch exactly as they appear in the original photo.
  ALTER CLOTHING: Replace current clothing with: ${cloth}. 
  ALTER BACKGROUND: Replace current background with a realistic: ${env}.
  STYLIZATION: Use the film grain and color grading of high-quality photography from ${targetYear}.`;

  const response = await ai.models.generateContent({
    model: GENERATION_MODEL,
    contents: [{
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
        { text: prompt },
      ],
    }],
    config: { imageConfig: { aspectRatio: "9:16" } }
  });

  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64 = part.inlineData.data;
        const imageUrl = `data:image/png;base64,${base64}`;
        return skipWatermark ? imageUrl : await applyWatermark(imageUrl);
      }
    }
  }
  
  throw new Error("No image generated by the temporal engine.");
};

// Fix: Added the missing analyzeMarketValue function required by InvestorView.tsx.
/**
 * Analyzes the market value and collector sentiment for a specific watch model.
 * Uses Google Search grounding to fetch real-time and recent sales data.
 */
export const analyzeMarketValue = async (modelName: string): Promise<MarketAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: RESEARCH_MODEL,
    contents: `Analyze the current collector market for the following watch: ${modelName}. 
    Provide historical price data for the last 3 years, current market sentiment, and an investment rating (A+, A, B, C). 
    Include a concise expert horological insight.`,
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

  return JSON.parse(response.text || "{}");
};
