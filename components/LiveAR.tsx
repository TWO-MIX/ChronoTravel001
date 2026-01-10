
import React, { useRef, useEffect, useState } from 'react';
import { WatchInfo, MarketingScenario } from '../types';
import { connectTemporalGuide, decodeBase64, decodeAudioData, encodePCM } from '../services/liveService';
import { transformEra } from '../services/geminiService';

interface LiveARProps {
  watch: WatchInfo;
  selectedScenario?: MarketingScenario;
  onExit: () => void;
}

const LiveAR: React.FC<LiveARProps> = ({ watch, selectedScenario, onExit }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const [transformedImg, setTransformedImg] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    let session: any = null;
    let stream: MediaStream | null = null;
    let visualTimer: any = null;
    let frameInterval: any = null;

    const initLive = async () => {
      stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: 640, height: 640 }, 
        audio: true 
      });
      
      if (videoRef.current) videoRef.current.srcObject = stream;

      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });

      const systemContext = selectedScenario 
        ? `${watch.eraContext}. Specifically in the context of: ${selectedScenario.description}. Environment: ${selectedScenario.environmentPrompt}.`
        : watch.eraContext;

      session = await connectTemporalGuide(systemContext, {
        onTranscription: (text, isUser) => setTranscription(`${isUser ? 'You: ' : 'Guide: '}${text}`),
        onAudioChunk: async (base64) => {
          if (!audioCtxRef.current) return;
          const ctx = audioCtxRef.current;
          nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
          const buffer = await decodeAudioData(decodeBase64(base64), ctx);
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(ctx.destination);
          source.start(nextStartTimeRef.current);
          nextStartTimeRef.current += buffer.duration;
          sourcesRef.current.add(source);
          source.onended = () => sourcesRef.current.delete(source);
        },
        onInterrupted: () => {
          sourcesRef.current.forEach(s => s.stop());
          sourcesRef.current.clear();
          nextStartTimeRef.current = 0;
        }
      });

      const source = inputCtx.createMediaStreamSource(stream);
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      processor.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0);
        session.sendRealtimeInput({
          media: { data: encodePCM(input), mimeType: 'audio/pcm;rate=16000' }
        });
      };
      source.connect(processor);
      processor.connect(inputCtx.destination);

      frameInterval = setInterval(() => {
        if (!canvasRef.current || !videoRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, 320, 320);
          canvas.toBlob((blob) => {
            if (blob) {
              const reader = new FileReader();
              reader.onloadend = () => {
                const base64 = (reader.result as string).split(',')[1];
                session.sendRealtimeInput({ media: { data: base64, mimeType: 'image/jpeg' } });
              };
              reader.readAsDataURL(blob);
            }
          }, 'image/jpeg', 0.5);
        }
      }, 1500);

      const performVisualTransmute = async () => {
        if (!videoRef.current || !canvasRef.current) return;
        setIsSyncing(true);
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = 640;
          canvas.height = 640;
          ctx.drawImage(videoRef.current, 0, 0, 640, 640);
          const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
          try {
            const transformed = await transformEra(base64, watch, selectedScenario);
            setTransformedImg(transformed);
          } catch (e) {
            console.error('Visual sync error', e);
          }
        }
        setIsSyncing(false);
      };

      performVisualTransmute();
      visualTimer = setInterval(performVisualTransmute, 5000);
    };

    initLive();

    return () => {
      stream?.getTracks().forEach(t => t.stop());
      clearInterval(visualTimer);
      clearInterval(frameInterval);
      if (session) session.close();
      audioCtxRef.current?.close();
    };
  }, [watch, selectedScenario]);

  return (
    <div className="absolute inset-0 bg-black flex flex-col z-50">
      <div className="relative flex-1 overflow-hidden bg-zinc-900">
        <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover opacity-50" />
        
        {transformedImg && (
          <div className="absolute inset-0 transition-opacity duration-1000">
             <img src={transformedImg} className="w-full h-full object-cover animate-in fade-in duration-700" alt="AR Portal" />
          </div>
        )}

        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
           <div className="flex justify-between items-start">
              <div className="glass px-4 py-2 rounded-xl border-l-4 border-blue-500">
                <p className="text-[10px] mono text-blue-400 font-bold uppercase tracking-widest">
                  {selectedScenario ? selectedScenario.title : 'Temporal Link'}
                </p>
                <p className="text-xs font-bold text-white">{watch.releaseYear} Active</p>
              </div>
              <button 
                onClick={onExit} 
                className="w-10 h-10 glass rounded-full flex items-center justify-center text-white pointer-events-auto active:scale-90"
              >
                <i className="fas fa-times"></i>
              </button>
           </div>

           <div className="space-y-4">
              {transcription && (
                <div className="glass p-3 rounded-xl max-w-[80%] animate-in slide-in-from-bottom-2">
                  <p className="text-[10px] mono text-blue-500 uppercase font-bold mb-1">Live Feed</p>
                  <p className="text-sm text-white leading-tight font-medium italic">"{transcription}"</p>
                </div>
              )}

              <div className="flex items-center gap-4">
                 <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                    {isSyncing && <div className="h-full bg-blue-500 animate-[loading_2s_ease-in-out_infinite]"></div>}
                 </div>
                 <div className="flex gap-1">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="w-1 h-3 bg-blue-500 animate-pulse" style={{ animationDelay: `${i*0.1}s` }}></div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
      
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default LiveAR;
