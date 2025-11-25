import React, { useEffect, useRef, useState } from 'react';
import { Album } from '../types';
import { Music, Radio, Volume2, Volume1, VolumeX, Play, Pause, SkipForward, SkipBack } from 'lucide-react';

interface TvInterfaceProps {
  album: Album | null;
  currentTrackIndex: number;
  isPlaying: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onTogglePlay: () => void;
}

const TvInterface: React.FC<TvInterfaceProps> = ({ 
  album, 
  currentTrackIndex, 
  isPlaying, 
  onClose,
  onNext,
  onPrev,
  onTogglePlay
}) => {
  const trackListRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showVolumeUI, setShowVolumeUI] = useState(false);
  const volumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Audio Playback Effect
  useEffect(() => {
    if (audioRef.current && album) {
      const track = album.tracks[currentTrackIndex];
      if (track?.streamUrl) {
        const currentSrc = audioRef.current.src;
        if (currentSrc !== track.streamUrl) {
          audioRef.current.src = track.streamUrl;
          audioRef.current.load();
        }
        
        if (isPlaying) {
          audioRef.current.play().catch(e => console.error("Playback failed", e));
        } else {
          audioRef.current.pause();
        }
      }
    }
  }, [currentTrackIndex, isPlaying, album]);

  // Volume Handler
  const adjustVolume = (delta: number) => {
    setVolume(prev => {
      const newVol = Math.max(0, Math.min(1, prev + delta));
      if (audioRef.current) audioRef.current.volume = newVol;
      return newVol;
    });
    
    setShowVolumeUI(true);
    if (volumeTimeoutRef.current) clearTimeout(volumeTimeoutRef.current);
    volumeTimeoutRef.current = setTimeout(() => setShowVolumeUI(false), 2000);
  };

  // Scroll active track into view
  useEffect(() => {
    if (trackListRef.current) {
      const activeElement = trackListRef.current.children[currentTrackIndex] as HTMLElement;
      if (activeElement) {
        // Reduced scroll margin for tighter view
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentTrackIndex]);

  // Remote Control (Keyboard) Support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape': onClose(); break;
        case ' ': // Spacebar
        case 'Enter': onTogglePlay(); break;
        case 'ArrowRight': onNext(); break;
        case 'ArrowLeft': onPrev(); break;
        case 'ArrowUp': adjustVolume(0.1); break;
        case 'ArrowDown': adjustVolume(-0.1); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNext, onPrev, onTogglePlay]);

  if (!album) return null;

  const currentTrack = album.tracks[currentTrackIndex];
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 bg-[#0f172a] text-white flex flex-col overflow-hidden font-sans select-none">
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          display: inline-block;
          white-space: nowrap;
          animation: marquee 15s linear infinite;
          padding-right: 2rem;
        }
        /* Custom Scrollbar for tracklist */
        .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(255,255,255,0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255,255,255,0.2);
            border-radius: 3px;
        }
      `}</style>

      {/* Hidden Audio Player */}
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={onNext}
      />

      {/* Dynamic Background */}
      <div 
        className="absolute inset-0 opacity-30 bg-cover bg-center blur-3xl scale-125 transition-all duration-1000"
        style={{ backgroundImage: `url(${album.coverUrl})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/80 to-transparent" />

      {/* Header */}
      <div className="relative z-10 h-[10vh] flex items-center justify-between px-[5vw]">
        <div className="flex items-center gap-3">
           <div className="bg-blue-600 p-2 rounded-full animate-pulse">
             <Radio className="w-6 h-6 text-white" />
           </div>
           <span className="text-xl font-bold tracking-widest text-slate-300">BCAST</span>
        </div>
        <div className="text-2xl font-light text-slate-400">
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 h-[75vh] flex px-[5vw] gap-[4vw]">
        
        {/* Left: Album Art & Info */}
        <div className="w-[42vw] flex flex-col justify-center">
          <div className={`relative aspect-square w-full rounded-2xl overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.6)] border-4 border-slate-800/50 mb-[3vh] transition-transform duration-700 ${isPlaying ? 'scale-100' : 'scale-95 opacity-90'}`}>
            <img 
              src={album.coverUrl} 
              alt={album.title} 
              className="w-full h-full object-cover"
            />
            {!isPlaying && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm">
                <Pause className="w-24 h-24 text-white opacity-80" />
              </div>
            )}
          </div>
          
          <div className="space-y-[0.5vh]">
             <h1 className="text-[4vh] font-bold leading-tight line-clamp-2 text-white">{album.title}</h1>
             <h2 className="text-[2.5vh] text-blue-400 font-medium">{album.artist}</h2>
             <div className="flex flex-wrap gap-2 pt-[1vh]">
                {album.tags?.slice(0, 4).map(tag => (
                  <span key={tag} className="px-2 py-0.5 bg-white/10 rounded-md text-[1.2vh] font-bold uppercase tracking-wide text-slate-400">
                    {tag}
                  </span>
                ))}
             </div>
          </div>
        </div>

        {/* Right: Tracklist */}
        <div className="flex-1 flex flex-col justify-center h-full overflow-hidden">
           <div className="bg-black/30 backdrop-blur-md rounded-3xl border border-white/10 h-[90%] flex flex-col overflow-hidden">
              <div className="p-[2vh] border-b border-white/5 flex justify-between items-end bg-white/5">
                 <h3 className="text-[2vh] font-semibold text-slate-200">Tracklist</h3>
                 <span className="text-[1.8vh] text-slate-500">{currentTrackIndex + 1} / {album.tracks.length}</span>
              </div>
              
              <div ref={trackListRef} className="flex-1 overflow-y-auto p-[1vh] scroll-smooth custom-scrollbar">
                 {album.tracks.map((track, idx) => {
                   const isActive = idx === currentTrackIndex;
                   return (
                    <div 
                      key={idx}
                      className={`flex items-center justify-between py-[0.8vh] px-[2vh] rounded-lg mb-[0.2vh] transition-all duration-200 ${
                        isActive
                          ? 'bg-white text-slate-900 shadow-lg scale-[1.01]' 
                          : 'text-slate-400 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-[2vh] overflow-hidden flex-1 mr-4">
                        <div className="w-[3vh] flex-shrink-0 text-center">
                          {isActive && isPlaying ? (
                            <Music className="w-[2vh] h-[2vh] animate-bounce text-blue-600" />
                          ) : (
                            <span className={`text-[1.8vh] font-mono ${isActive ? 'font-bold' : ''}`}>{idx + 1}</span>
                          )}
                        </div>
                        {/* Marquee for active track, truncate for others */}
                        <div className="flex-1 overflow-hidden relative">
                           {isActive ? (
                             <div className="w-full overflow-hidden whitespace-nowrap">
                               <span className={`text-[2vh] font-bold ${track.title.length > 30 ? 'animate-marquee' : ''}`}>
                                 {track.title}
                               </span>
                             </div>
                           ) : (
                             <span className="text-[1.8vh] font-medium truncate block">
                               {track.title}
                             </span>
                           )}
                        </div>
                      </div>
                      <span className={`text-[1.8vh] font-mono flex-shrink-0 ${isActive ? 'text-slate-600' : ''}`}>
                        {track.duration}
                      </span>
                    </div>
                   );
                 })}
              </div>
           </div>
        </div>
      </div>

      {/* Footer: Progress & Controls */}
      <div className="relative z-10 h-[15vh] px-[5vw] flex flex-col justify-center">
         
         {/* Progress Bar */}
         <div className="flex items-center gap-[2vw] mb-[2vh]">
            <span className="text-[1.8vh] font-mono text-slate-400 w-[5vw] text-right">
              {formatTime(currentTime)}
            </span>
            <div className="flex-1 h-[1vh] bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-200 ease-linear shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[1.8vh] font-mono text-slate-400 w-[5vw]">
              {formatTime(duration || 0)}
            </span>
         </div>

         {/* Controls Hint */}
         <div className="flex justify-center items-center gap-[4vw] text-slate-500 text-[1.5vh] uppercase tracking-widest">
            <ControlHint icon={<Play size="1.5vh"/>} label="Play/Pause" kbd="Space" />
            <ControlHint icon={<SkipBack size="1.5vh"/>} label="Prev" kbd="←" />
            <ControlHint icon={<SkipForward size="1.5vh"/>} label="Next" kbd="→" />
            <ControlHint icon={<Volume2 size="1.5vh"/>} label="Volume" kbd="↑ ↓" />
         </div>
      </div>

      {/* Volume Overlay - Increased Z-Index to stay on top */}
      <div className={`absolute right-[5vw] top-[15vh] z-[100] bg-black/80 backdrop-blur-xl p-[2vh] rounded-2xl border border-white/20 transition-opacity duration-300 ${showVolumeUI ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
         <div className="w-[4vh] h-[30vh] bg-slate-800/50 rounded-full relative overflow-hidden flex flex-col justify-end">
            <div 
              className="w-full bg-blue-500 transition-all duration-100 box-border border-t border-white/50"
              style={{ height: `${volume * 100}%` }}
            />
         </div>
         <div className="mt-[2vh] flex justify-center text-white">
            {volume === 0 ? <VolumeX size="2.5vh" /> : volume < 0.5 ? <Volume1 size="2.5vh" /> : <Volume2 size="2.5vh" />}
         </div>
         <div className="text-center text-[1.5vh] font-mono mt-1 text-blue-300">{Math.round(volume * 100)}%</div>
      </div>

    </div>
  );
};

const ControlHint = ({ icon, label, kbd }: { icon: React.ReactNode, label: string, kbd: string }) => (
  <div className="flex items-center gap-2">
    <div className="p-1 bg-slate-800 rounded-md border border-slate-700">{icon}</div>
    <span>{label} <span className="text-slate-600">[{kbd}]</span></span>
  </div>
);

const formatTime = (seconds: number) => {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default TvInterface;