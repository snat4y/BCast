import React, { useEffect, useRef, useState } from 'react';
import { Album } from '../types';
import { Music, Radio, Volume2, Volume1, VolumeX, Pause, Play, SkipForward, SkipBack, Disc } from 'lucide-react';

interface TvInterfaceProps {
  album: Album | null;
  currentTrackIndex: number;
  isPlaying: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onTogglePlay: () => void;
  initialVolume?: number;
  volume?: number; // External volume level (0-1)
  onVolumeChange?: (newVolume: number) => void; // Request change to external volume
}

const MarqueeText = ({ text, isActive }: { text: string, isActive: boolean }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [duration, setDuration] = useState('0s');
  const [distance, setDistance] = useState('0px');

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && textRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const textWidth = textRef.current.scrollWidth;
        
        // Use a small threshold to avoid jitter
        if (textWidth > containerWidth + 1) {
          setIsOverflowing(true);
          const scrollDist = textWidth - containerWidth + 20; // Scroll past + padding
          setDistance(`-${scrollDist}px`);
          // Speed: 30 pixels per second
          setDuration(`${Math.max(scrollDist / 30, 5)}s`); 
        } else {
          setIsOverflowing(false);
        }
      }
    };

    // Initial check
    const timeoutId = setTimeout(checkOverflow, 100);

    const resizeObserver = new ResizeObserver(() => {
        checkOverflow();
    });

    if (containerRef.current) resizeObserver.observe(containerRef.current);
    if (textRef.current) resizeObserver.observe(textRef.current);

    return () => {
        clearTimeout(timeoutId);
        resizeObserver.disconnect();
    };
  }, [text, isActive]);

  return (
    <div ref={containerRef} className="w-full overflow-hidden relative mask-linear-fade">
      <style>{`
        @keyframes marquee {
          0%, 10% { transform: translateX(0); }
          100% { transform: translateX(${distance}); }
        }
      `}</style>
      <span 
        ref={textRef} 
        className="inline-block whitespace-nowrap"
        style={{
          animation: (isActive && isOverflowing) 
            ? `marquee ${duration} linear infinite alternate` 
            : 'none',
          willChange: 'transform'
        }}
      >
        {text}
      </span>
    </div>
  );
};

const TvInterface: React.FC<TvInterfaceProps> = ({ 
  album, 
  currentTrackIndex, 
  isPlaying, 
  onClose,
  onNext,
  onPrev,
  onTogglePlay,
  initialVolume = 1,
  volume: externalVolume,
  onVolumeChange
}) => {
  const trackListRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [internalVolume, setInternalVolume] = useState(initialVolume);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showVolumeUI, setShowVolumeUI] = useState(false);
  const volumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentTrack = album?.tracks[currentTrackIndex];

  // Determine if we are controlled externally (TV Receiver) or locally (Sender/Browser)
  const isExternalControl = typeof externalVolume === 'number';
  const effectiveVolume = isExternalControl ? externalVolume : internalVolume;

  // --- AUDIO LOGIC ---

  // Handle Track Source Changes Imperatively
  useEffect(() => {
    if (!audioRef.current) return;
    const audio = audioRef.current;

    // If no track or no stream URL (unavailable), don't play
    if (!currentTrack || !currentTrack.streamUrl) {
        audio.pause();
        return;
    }

    const loadAndPlay = async () => {
      try {
        // 1. Pause current playback
        audio.pause();
        
        // 2. Set new source
        audio.src = currentTrack.streamUrl || '';
        audio.currentTime = 0;
        setCurrentTime(0);

        // 3. Load metadata
        audio.load();

        // 4. Resume if playing
        if (isPlaying) {
          await audio.play();
        }
      } catch (err) {
        console.error("Audio Load Error:", err);
      }
    };

    loadAndPlay();
  }, [currentTrackIndex, currentTrack?.streamUrl]); // Re-run when track changes

  // Handle Play/Pause Toggle
  useEffect(() => {
    if (!audioRef.current) return;
    const audio = audioRef.current;
    
    if (!currentTrack?.streamUrl) return;

    if (isPlaying) {
      if (audio.paused && audio.src) {
        audio.play().catch(e => console.warn("Play interrupted:", e));
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack]);

  // Handle Volume
  useEffect(() => {
    if (audioRef.current) {
      // If controlled externally (e.g. Chromecast System Volume), we set the audio element 
      // volume to 1.0 (max) and let the hardware/system volume handle the attenuation.
      // Otherwise, we apply the volume gain to the element itself.
      audioRef.current.volume = isExternalControl ? 1.0 : effectiveVolume;
    }
  }, [effectiveVolume, isExternalControl]);

  // --- UI LOGIC ---

  const adjustVolume = (delta: number) => {
    const newVol = Math.max(0, Math.min(1, effectiveVolume + delta));
    const roundedVol = Math.round(newVol * 100) / 100; // Round to 2 decimal places

    if (isExternalControl && onVolumeChange) {
      onVolumeChange(roundedVol);
    } else {
      setInternalVolume(roundedVol);
    }
    
    setShowVolumeUI(true);
    if (volumeTimeoutRef.current) clearTimeout(volumeTimeoutRef.current);
    volumeTimeoutRef.current = setTimeout(() => setShowVolumeUI(false), 2000);
  };

  // Auto-scroll tracklist without scrolling parent
  useEffect(() => {
    if (trackListRef.current) {
      const activeElement = trackListRef.current.querySelector(`[data-track-index="${currentTrackIndex}"]`) as HTMLElement;
      if (activeElement) {
        const container = trackListRef.current;
        const offsetTop = activeElement.offsetTop;
        const elHeight = activeElement.clientHeight;
        const containerHeight = container.clientHeight;
        
        // Calculate the scroll position to center the element
        const targetScroll = offsetTop - (containerHeight / 2) + (elHeight / 2);
        
        container.scrollTo({ 
          top: targetScroll, 
          behavior: 'smooth' 
        });
      }
    }
  }, [currentTrackIndex]);

  // Keyboard Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling behavior for arrow keys and space
      if([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }

      switch (e.key) {
        case 'Escape': onClose(); break;
        case ' ': 
        case 'Enter': onTogglePlay(); break;
        case 'ArrowRight': onNext(); break;
        case 'ArrowLeft': onPrev(); break;
        case 'ArrowUp': adjustVolume(0.01); break; // 1% Granularity
        case 'ArrowDown': adjustVolume(-0.01); break; // 1% Granularity
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNext, onPrev, onTogglePlay, effectiveVolume, isExternalControl]);

  if (!album) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const timeString = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <div className="fixed inset-0 z-50 bg-[#0f172a] text-white flex flex-col overflow-hidden font-sans select-none">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 3px; }
        .mask-linear-fade {
            mask-image: linear-gradient(to right, black 85%, transparent 100%);
            -webkit-mask-image: linear-gradient(to right, black 85%, transparent 100%);
        }
      `}</style>

      {/* Persistent Audio Element */}
      <audio
        ref={audioRef}
        preload="auto"
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={onNext}
        onError={(e) => {
          console.error("Audio Playback Error", e.currentTarget.error);
        }}
      />

      {/* Dynamic Background */}
      <div 
        className="absolute inset-0 opacity-20 bg-cover bg-center blur-3xl scale-125 transition-all duration-1000"
        style={{ backgroundImage: `url(${album.coverUrl})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/95 to-slate-900/80" />

      {/* Header */}
      <div className="relative z-10 h-[8vh] flex items-center justify-between px-[5vw] flex-shrink-0">
        <div className="flex items-center gap-3">
           <div className="bg-blue-600 p-1.5 rounded-lg">
             <Radio className="w-5 h-5 text-white" />
           </div>
           <span className="text-lg font-bold tracking-widest text-slate-300">BCAST</span>
        </div>
        <div className="text-[2.5vh] font-light text-slate-400 font-mono tracking-widest">
          {timeString}
        </div>
      </div>

      {/* Main Content Area */}
      {/* Anchored top-left, gap between cols, padding for footer */}
      <div className="relative z-10 flex flex-1 px-[5vw] pt-[2vh] pb-[16vh] gap-[4vw] overflow-hidden items-start h-full">
        
        {/* Left Column: Artwork 
            - Flex shrink 0 prevents squishing
            - h-full makes it fill vertical space available in parent
            - aspect-square enforces 1:1 ratio based on height
        */}
        <div className="flex-shrink-0 h-full aspect-square">
          <div 
            className={`relative w-full h-full rounded-xl overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.6)] border border-slate-700/50 bg-slate-900 transition-all duration-700 ${isPlaying ? 'scale-100' : 'scale-95 opacity-90'}`}
          >
            <img 
              src={album.coverUrl} 
              alt={album.title} 
              className="w-full h-full object-cover"
            />
            {/* Overlay if paused */}
            {!isPlaying && currentTrack?.streamUrl && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center backdrop-blur-[2px]">
                <Pause className="w-[20%] h-[20%] text-white opacity-80" />
              </div>
            )}
            {/* Overlay if unavailable */}
            {!currentTrack?.streamUrl && (
               <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                  <span className="bg-red-500/20 text-red-200 px-4 py-2 rounded-full border border-red-500/30 text-[2vh] font-bold uppercase tracking-wider">
                     Track Unavailable
                  </span>
               </div>
            )}
          </div>
        </div>

        {/* Right Column: Album Info & Tracklist */}
        <div className="flex-1 flex flex-col min-w-0 h-full"> 
           
           {/* Info Block - Above Tracklist */}
           <div className="mb-[3vh] flex-shrink-0">
             <h1 className="text-[5vh] font-bold leading-none text-white mb-[1.5vh] line-clamp-2">{album.title}</h1>
             <h2 className="text-[3.5vh] text-blue-400 font-medium truncate opacity-90">{album.artist}</h2>
             {/* Metadata line (Release Date) - Tags removed */}
             {album.releaseDate && (
                <div className="mt-[1vh] text-[1.8vh] text-slate-500 font-mono uppercase tracking-widest">
                    Released: {album.releaseDate}
                </div>
             )}
           </div>

           {/* Tracklist Container */}
           <div className="flex-1 bg-white/5 backdrop-blur-md rounded-xl border border-white/5 flex flex-col overflow-hidden relative shadow-2xl"> 
              <div className="p-[2vh] border-b border-white/5 flex justify-between items-end bg-black/20 flex-shrink-0">
                 <h3 className="text-[1.8vh] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Disc className="w-4 h-4" /> Tracklist
                 </h3>
                 <span className="text-[1.8vh] text-slate-500 font-mono">
                    {album.tracks.filter(t => t.streamUrl).length} Playable / {album.tracks.length} Total
                 </span>
              </div>
              
              <div ref={trackListRef} className="flex-1 overflow-y-auto p-[1vh] scroll-smooth custom-scrollbar">
                 {album.tracks.map((track, idx) => {
                   const isActive = idx === currentTrackIndex;
                   const isPlayable = !!track.streamUrl;
                   
                   return (
                    <div 
                      key={idx}
                      data-track-index={idx}
                      className={`flex items-center justify-between py-[1.8vh] px-[2vh] rounded-lg mb-[0.2vh] transition-all duration-200 ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-lg scale-[1.01] origin-left z-10' 
                          : isPlayable
                            ? 'text-slate-300 hover:bg-white/5'
                            : 'text-slate-600 opacity-40' // Unavailable state
                      }`}
                    >
                      <div className="flex items-center gap-[2vh] overflow-hidden flex-1 mr-4">
                        <div className="w-[3vh] flex-shrink-0 text-center flex justify-center">
                          {isActive && isPlaying ? (
                            <Music className="w-[2vh] h-[2vh] animate-bounce text-white" />
                          ) : (
                            <span className={`text-[2vh] font-mono ${isActive ? 'font-bold' : ''}`}>{idx + 1}</span>
                          )}
                        </div>
                        
                        <div className="flex-1 overflow-hidden relative w-full min-w-0">
                           {isActive ? (
                             <MarqueeText text={track.title} isActive={true} />
                           ) : (
                             <span className="text-[2.2vh] font-medium truncate block">
                               {track.title} 
                               {!isPlayable && <span className="ml-2 text-[1.5vh] border border-slate-600 rounded px-1.5 py-0.5 align-middle opacity-70">N/A</span>}
                             </span>
                           )}
                        </div>
                      </div>
                      <span className={`text-[2vh] font-mono flex-shrink-0 ${isActive ? 'text-blue-100' : 'opacity-70'}`}>
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
      <div className="absolute bottom-0 left-0 right-0 z-20 h-[14vh] px-[5vw] bg-gradient-to-t from-[#0b1120] to-transparent flex flex-col justify-center">
         <div className="flex items-center gap-[2vw] mb-[2vh]">
            <span className="text-[2vh] font-mono text-slate-400 w-[6vw] text-right">
              {formatTime(currentTime)}
            </span>
            <div className="flex-1 h-[0.8vh] bg-slate-800 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-200 ease-linear shadow-[0_0_15px_rgba(59,130,246,0.8)]" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[2vh] font-mono text-slate-400 w-[6vw]">
              {formatTime(duration || 0)}
            </span>
         </div>

         <div className="flex justify-center items-center gap-[4vw] text-slate-500 text-[1.5vh] uppercase tracking-widest">
            <ControlHint icon={<Play size="1.5vh"/>} label="Play/Pause" kbd="Space" />
            <ControlHint icon={<SkipBack size="1.5vh"/>} label="Prev" kbd="←" />
            <ControlHint icon={<SkipForward size="1.5vh"/>} label="Next" kbd="→" />
            <ControlHint icon={<Volume2 size="1.5vh"/>} label="Volume" kbd="↑ ↓" />
         </div>
      </div>

      {/* Volume Overlay */}
      <div className={`absolute right-[5vw] top-[15vh] z-[100] bg-black/80 backdrop-blur-xl p-[2vh] rounded-2xl border border-white/20 transition-opacity duration-300 ${showVolumeUI ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
         <div className="w-[4vh] h-[30vh] bg-slate-800/50 rounded-full relative overflow-hidden flex flex-col justify-end">
            <div 
              className="w-full bg-blue-500 transition-all duration-100 box-border border-t border-white/50"
              style={{ height: `${effectiveVolume * 100}%` }}
            />
         </div>
         <div className="mt-[2vh] flex justify-center text-white">
            {effectiveVolume === 0 ? <VolumeX size="2.5vh" /> : effectiveVolume < 0.5 ? <Volume1 size="2.5vh" /> : <Volume2 size="2.5vh" />}
         </div>
         <div className="text-center text-[1.5vh] font-mono mt-1 text-blue-300">{Math.round(effectiveVolume * 100)}%</div>
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
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default TvInterface;