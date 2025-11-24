import React, { useEffect, useRef } from 'react';
import { Album, Track } from '../types';
import { Play, Pause, FastForward, Rewind, Music, Radio } from 'lucide-react';

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

  // Scroll active track into view
  useEffect(() => {
    if (trackListRef.current) {
      const activeElement = trackListRef.current.children[currentTrackIndex] as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentTrackIndex]);

  // Simulate Remote Control (Keyboard Support)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case ' ': // Spacebar
        case 'Enter':
          onTogglePlay();
          break;
        case 'ArrowRight':
          onNext();
          break;
        case 'ArrowLeft':
          onPrev();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNext, onPrev, onTogglePlay]);

  if (!album) return null;

  const currentTrack = album.tracks[currentTrackIndex];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 text-white flex flex-col overflow-hidden">
      {/* Background Gradient/Blur */}
      <div 
        className="absolute inset-0 opacity-20 bg-cover bg-center blur-3xl scale-110"
        style={{ backgroundImage: `url(${album.coverUrl})` }}
      />
      
      {/* Top Bar: TV Status */}
      <div className="relative z-10 flex justify-between items-center p-8 text-slate-400 uppercase tracking-widest text-sm font-semibold">
        <div className="flex items-center gap-2">
           <Radio className="w-5 h-5 animate-pulse text-blue-400" />
           <span>Chromecast • BandCast Source</span>
        </div>
        <div>
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex flex-1 p-12 gap-16 items-center">
        
        {/* Left: Album Art & Now Playing */}
        <div className="w-1/3 flex flex-col gap-8">
          <div className="aspect-square w-full rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-4 border-slate-800">
            <img 
              src={album.coverUrl} 
              alt={album.title} 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="space-y-2">
             <h1 className="text-4xl font-bold leading-tight line-clamp-2">{album.title}</h1>
             <h2 className="text-2xl text-slate-400 font-medium">{album.artist}</h2>
             <div className="flex gap-2 mt-2">
                {album.tags?.slice(0, 3).map(tag => (
                  <span key={tag} className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-wide text-blue-300">
                    {tag}
                  </span>
                ))}
             </div>
          </div>
        </div>

        {/* Right: Tracklist */}
        <div className="flex-1 h-[60vh] flex flex-col bg-black/20 rounded-3xl p-8 backdrop-blur-sm border border-white/5">
           <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
              <h3 className="text-xl font-semibold text-slate-300">Tracklist</h3>
              <span className="text-sm text-slate-500">{album.tracks.length} tracks</span>
           </div>
           
           <div ref={trackListRef} className="flex-1 overflow-y-auto pr-4 space-y-1">
              {album.tracks.map((track, idx) => (
                <div 
                  key={idx}
                  className={`flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${
                    idx === currentTrackIndex 
                      ? 'bg-white text-black scale-100 shadow-lg' 
                      : 'text-slate-400 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`w-6 text-center text-sm font-mono ${idx === currentTrackIndex ? 'text-blue-600 font-bold' : 'text-slate-600'}`}>
                      {idx === currentTrackIndex ? <Music className="w-4 h-4 animate-bounce mx-auto"/> : idx + 1}
                    </span>
                    <span className="font-medium text-lg">{track.title}</span>
                  </div>
                  <span className={`text-sm font-mono ${idx === currentTrackIndex ? 'text-black' : 'text-slate-600'}`}>
                    {track.duration}
                  </span>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* Bottom: Progress Bar & Simulated Controls Hint */}
      <div className="relative z-10 p-12 pt-0">
        <div className="flex items-center gap-8">
           {/* Progress Line */}
           <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
             <div 
               className={`h-full bg-blue-500 rounded-full transition-all duration-1000 ease-linear ${isPlaying ? 'w-2/3' : 'w-1/3 opacity-50'}`} 
             />
           </div>
           
           <div className="flex items-center gap-2 text-slate-400 text-sm">
             <span>{currentTrack.duration}</span>
           </div>
        </div>

        {/* On-screen Remote Hints */}
        <div className="mt-8 flex justify-center gap-12 text-slate-500 text-xs uppercase tracking-widest">
           <div className="flex items-center gap-2">
             <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-700 font-sans">SPACE</kbd>
             <span>Play/Pause</span>
           </div>
           <div className="flex items-center gap-2">
             <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-700 font-sans">← / →</kbd>
             <span>Seek Track</span>
           </div>
           <div className="flex items-center gap-2">
             <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-700 font-sans">ESC</kbd>
             <span>Exit TV Mode</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default TvInterface;
