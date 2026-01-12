
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

export interface LiveSessionCallbacks {
  onTranscription: (text: string, isUser: boolean) => void;
  onAudioChunk: (base64Audio: string) => void;
  onInterrupted: () => void;
}

export const connectTemporalGuide = (
  eraInfo: string,
  callbacks: LiveSessionCallbacks
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const sessionPromise = ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
    callbacks: {
      onopen: () => console.log('Temporal Link Established'),
      onmessage: async (message: LiveServerMessage) => {
        if (message.serverContent?.outputTranscription) {
          callbacks.onTranscription(message.serverContent.outputTranscription.text, false);
        } else if (message.serverContent?.inputTranscription) {
          callbacks.onTranscription(message.serverContent.inputTranscription.text, true);
        }

        const audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
        if (audio) {
          callbacks.onAudioChunk(audio);
        }

        if (message.serverContent?.interrupted) {
          callbacks.onInterrupted();
        }
      },
      onerror: (e) => console.error('Temporal Distortion:', e),
      onclose: () => console.log('Temporal Link Severed'),
    },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } },
      },
      systemInstruction: `You are a person living in the era described: ${eraInfo}. 
      The user is looking through a "Time Portal" at their wrist watch. 
      Speak as if you are actually there in that time. Describe the fashion, 
      the world events of that year, and react to the user's watch as a contemporary.
      Keep responses brief and immersive. You can see what the user sees through their camera.`,
      inputAudioTranscription: {},
      outputAudioTranscription: {},
    },
  });

  return sessionPromise;
};

// Audio Utilities for Live PCM
export function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export function encodePCM(data: Float32Array): string {
  const int16 = new Int16Array(data.length);
  for (let i = 0; i < data.length; i++) {
    int16[i] = data[i] * 32768;
  }
  const bytes = new Uint8Array(int16.buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
