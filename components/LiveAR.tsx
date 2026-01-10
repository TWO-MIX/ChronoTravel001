
import React, { useRef, useEffect, useState } from 'react';
import { WatchInfo, MarketingScenario } from '../types';
import { connectTemporalGuide, decodeBase64, decodeAudioData, encodePCM } from '../services/liveService';

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
  const [transcription, setTranscription] = useState<string>('');
  const [isAudioActive, setIsAudioActive] = useState(false);

  useEffect(() => {
    let session: any = null;
    let stream: MediaStream | null = null;
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
        onTranscription: (text, isUser) => {
          setTranscription(`${isUser ? 'You: ' : 'Guide: '}${text}`);
          setIsAudioActive(!isUser);
          if (!isUser) {
             setTimeout(() => setIsAudioActive(false), 3000); // Visual falloff
          }
        },
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
          setIsAudioActive(true);
        },
        onInterrupted: () => {
          sourcesRef.current.forEach(s => s.stop());
          sourcesRef.current.clear();
          nextStartTimeRef.current = 0;
          setIsAudioActive(false);
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
    };

    initLive();

    return () => {
      stream?.getTracks().forEach(t => t.stop());
      clearInterval(frameInterval);
      if (session) session.close();
      audioCtxRef.current?.close();
    };
  }, [watch, selectedScenario]);

  return (
    <div className="absolute inset-0 bg-black flex flex-col z-50">
      <div className="relative flex-1 overflow-hidden bg-zinc-900">
        <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover opacity-80" />
        
        {/* Audio Reactive Overlay */}
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
           <div className="flex justify-between items-start">
              <div className={`glass px-4 py-2 rounded-xl border-l-4 transition-colors duration-300 ${isAudioActive ? 'border-green-400 bg-green-500/10' : 'border-blue-500'}`}>
                <p className="text-[10px] mono font-bold uppercase tracking-widest text-white/70">
                  {selectedScenario ? selectedScenario.title : 'Temporal Link'}
                </p>
                <div className="flex items-center gap-2">
                   {isAudioActive && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>}
                   <p className="text-xs font-bold text-white">{watch.releaseYear} Audio Stream</p>
                </div>
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
                <div className="glass p-4 rounded-2xl max-w-[90%] animate-in slide-in-from-bottom-2 border-l-2 border-blue-400">
                  <p className="text-[10px] mono text-blue-400 uppercase font-bold mb-1">
                    {transcription.startsWith('You:') ? 'Input Signal' : 'Temporal Response'}
                  </p>
                  <p className="text-sm text-white leading-relaxed font-medium">"{transcription.replace(/^(You: |Guide: )/, '')}"</p>
                </div>
              )}

              {/* Audio Visualizer Placeholder */}
              <div className="flex items-center gap-1 h-8 justify-center opacity-70">
                 {[1,2,3,4,5,6,7,8].map(i => (
                    <div 
                      key={i} 
                      className={`w-1 bg-white rounded-full transition-all duration-75 ${isAudioActive ? 'animate-pulse bg-green-400' : ''}`}
                      style={{ 
                        height: isAudioActive ? `${Math.random() * 100}%` : '20%',
                        animationDelay: `${i * 0.05}s`
                      }} 
                    ></div>
                 ))}
              </div>
           </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default LiveAR;
