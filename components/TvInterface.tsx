import React, { useEffect, useRef, useState } from 'react';
import { Album } from '../types';
import { Music, Radio, Volume2, Volume1, VolumeX, Pause, Play, SkipForward, SkipBack } from 'lucide-react';

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
          const dist = textWidth - containerWidth + 20; // Scroll past + padding
          setDistance(`-${dist}px`);
          // Speed: 30 pixels per second
          setDuration(`${Math.max(dist / 30, 5)}s`); 
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
    if (!audioRef.current || !currentTrack) return;

    // Safety: don't attempt to play if no stream (e.g. unreleased track)
    if (!currentTrack.streamUrl) return;

    const audio = audioRef.current;

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

    if (isPlaying) {
      if (audio.paused && audio.src) {
        audio.play().catch(e => console.warn("Play interrupted:", e));
      }
    } else {
      audio.pause();
    }
  }, [isPlaying]);

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
        // We use scrollTo on the container instead of scrollIntoView to prevent the 
        // entire page/viewport from scrolling up when the list is at the bottom.
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
        className="absolute inset-0 opacity-30 bg-cover bg-center blur-3xl scale-125 transition-all duration-1000"
        style={{ backgroundImage: `url(${album.coverUrl})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/90 to-transparent" />

      {/* Header */}
      <div className="relative z-10 h-[10vh] flex items-center justify-between px-[5vw] flex-shrink-0">
        <div className="flex items-center gap-3">
           <div className="bg-blue-600 p-2 rounded-full animate-pulse">
             <Radio className="w-6 h-6 text-white" />
           </div>
           <span className="text-xl font-bold tracking-widest text-slate-300">BCAST</span>
        </div>
        <div className="text-[3vh] font-light text-slate-400 font-mono tracking-widest">
          {timeString}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-1 px-[5vw] pt-[2vh] pb-[18vh] gap-[5vw] overflow-hidden min-h-0 items-start">
        
        {/* Left Column: Artwork - Anchored Top Left, Max Height within area */}
        <div className="flex-shrink-0 h-full">
          <div 
            className={`relative aspect-square h-full rounded-xl overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.6)] border-4 border-slate-800/50 transition-all duration-700 ${isPlaying ? 'scale-100' : 'scale-95 opacity-90'}`}
          >
            <img 
              src={album.coverUrl} 
              alt={album.title} 
              className="w-full h-full object-cover"
            />
            {!isPlaying && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm">
                <Pause className="w-[25%] h-[25%] text-white opacity-80" />
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Album Info & Tracklist */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 h-full"> 
           
           {/* Info Block */}
           <div className="mb-[4vh] flex-shrink-0">
             <h1 className="text-[5vh] font-bold leading-tight text-white mb-[1vh] line-clamp-2">{album.title}</h1>
             <h2 className="text-[3.5vh] text-blue-400 font-medium truncate">{album.artist}</h2>
           </div>

           {/* Tracklist Container */}
           <div className="flex-1 bg-black/20 backdrop-blur-md rounded-2xl border border-white/10 flex flex-col overflow-hidden relative"> 
              <div className="p-[2vh] border-b border-white/5 flex justify-between items-end bg-white/5 flex-shrink-0">
                 <h3 className="text-[2vh] font-semibold text-slate-200 uppercase tracking-wider">Tracks</h3>
                 <span className="text-[1.8vh] text-slate-500 font-mono">{currentTrackIndex + 1} / {album.tracks.length}</span>
              </div>
              
              <div ref={trackListRef} className="flex-1 overflow-y-auto p-[1vh] scroll-smooth custom-scrollbar">
                 {album.tracks.map((track, idx) => {
                   const isActive = idx === currentTrackIndex;
                   const isPlayable = !!track.streamUrl;
                   
                   return (
                    <div 
                      key={idx}
                      data-track-index={idx}
                      className={`flex items-center justify-between py-[1.5vh] px-[2vh] rounded-lg mb-[0.2vh] transition-all duration-200 ${
                        isActive
                          ? 'bg-white text-slate-900 shadow-lg scale-[1.01] origin-left' 
                          : isPlayable
                            ? 'text-slate-400 hover:bg-white/5'
                            : 'text-slate-600 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center gap-[2vh] overflow-hidden flex-1 mr-4">
                        <div className="w-[3vh] flex-shrink-0 text-center">
                          {isActive && isPlaying ? (
                            <Music className="w-[2vh] h-[2vh] animate-bounce text-blue-600" />
                          ) : (
                            <span className={`text-[2vh] font-mono ${isActive ? 'font-bold' : ''}`}>{idx + 1}</span>
                          )}
                        </div>
                        
                        <div className="flex-1 overflow-hidden relative w-full min-w-0">
                           {isActive ? (
                             <MarqueeText text={track.title} isActive={true} />
                           ) : (
                             <span className="text-[2vh] font-medium truncate block">
                               {track.title}
                             </span>
                           )}
                        </div>
                      </div>
                      <span className={`text-[2vh] font-mono flex-shrink-0 ${isActive ? 'text-slate-600' : ''}`}>
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
      <div className="absolute bottom-0 left-0 right-0 z-20 h-[15vh] px-[5vw] bg-gradient-to-t from-[#0f172a] via-[#0f172a] to-transparent flex flex-col justify-center">
         <div className="flex items-center gap-[2vw] mb-[2vh]">
            <span className="text-[2vh] font-mono text-slate-400 w-[6vw] text-right">
              {formatTime(currentTime)}
            </span>
            <div className="flex-1 h-[1vh] bg-slate-800 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-200 ease-linear shadow-[0_0_15px_rgba(59,130,246,0.6)]" 
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