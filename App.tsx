import React, { useState, useRef } from 'react';
import MockBandcampPage from './components/MockBandcampPage';
import ExtensionPopup from './components/ExtensionPopup';
import TvInterface from './components/TvInterface';
import { scrapeBandcampData } from './services/scraper';
import { Album, ViewMode } from './types';
import { Cast, Menu, RefreshCw, ArrowLeft, ArrowRight, Home, Star, ShieldCheck } from 'lucide-react';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.SENDER);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [scrapedAlbum, setScrapedAlbum] = useState<Album | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  const handleCast = () => {
    const data = scrapeBandcampData();
    if (data) {
      setScrapedAlbum(data);
      setViewMode(ViewMode.TV_RECEIVER);
      setIsPlaying(true);
      setCurrentTrackIndex(0);
    } else {
      alert("Could not detect album data on this page.");
    }
  };

  // TV Interface Callbacks
  const handleNext = () => {
    if (scrapedAlbum) {
      setCurrentTrackIndex(prev => (prev + 1) % scrapedAlbum.tracks.length);
    }
  };

  const handlePrev = () => {
    if (scrapedAlbum) {
      setCurrentTrackIndex(prev => (prev - 1 + scrapedAlbum.tracks.length) % scrapedAlbum.tracks.length);
    }
  };

  if (viewMode === ViewMode.TV_RECEIVER) {
    return (
      <TvInterface
        album={scrapedAlbum}
        currentTrackIndex={currentTrackIndex}
        isPlaying={isPlaying}
        onClose={() => setViewMode(ViewMode.SENDER)}
        onNext={handleNext}
        onPrev={handlePrev}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
      />
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-white overflow-hidden">
      
      {/* SIMULATED CHROME BROWSER TOOLBAR */}
      <div className="bg-[#dee1e6] text-[#3c4043] flex flex-col border-b border-[#a0a0a0]">
        
        {/* Top Tab Bar */}
        <div className="h-9 flex items-end px-2 gap-2 pt-2">
           <div className="w-56 h-full bg-white rounded-t-lg relative flex items-center px-3 text-xs shadow-[0_0_2px_rgba(0,0,0,0.2)]">
              <div className="w-4 h-4 rounded-full bg-slate-200 mr-2 flex items-center justify-center text-[8px] font-bold text-slate-600">b</div>
              <span className="truncate">Neon Horizons | Synthwave Collective</span>
              <div className="absolute right-2 text-slate-400 hover:bg-slate-100 rounded-full p-0.5">×</div>
           </div>
           <div className="p-1.5 hover:bg-white/40 rounded-full cursor-pointer">
              <div className="w-3 h-3 text-slate-600 font-bold">+</div>
           </div>
        </div>

        {/* Address & Extension Bar */}
        <div className="h-10 bg-white flex items-center px-2 gap-2">
           <div className="flex gap-2 text-slate-400">
              <ArrowLeft className="w-4 h-4 hover:text-slate-600 cursor-pointer" />
              <ArrowRight className="w-4 h-4 hover:text-slate-600 cursor-pointer" />
              <RefreshCw className="w-3.5 h-3.5 mt-0.5 hover:text-slate-600 cursor-pointer" />
           </div>
           
           <div className="flex-1 bg-[#f1f3f4] rounded-full h-7 flex items-center px-3 text-sm text-[#202124] relative group">
              <ShieldCheck className="w-3 h-3 text-slate-500 mr-2" />
              <span className="text-green-700 mr-1">https://</span>
              <span>synthwavecollective.bandcamp.com</span>
              <span className="text-slate-400">/album/neon-horizons</span>
              <div className="absolute right-2 flex items-center gap-2">
                 <Star className="w-3.5 h-3.5 text-slate-400 hover:text-blue-500 cursor-pointer" />
              </div>
           </div>

           {/* EXTENSION ICON */}
           <div className="flex items-center gap-1 border-l border-slate-200 pl-2 ml-1 relative">
              <div 
                onClick={() => setIsPopupOpen(!isPopupOpen)}
                className={`p-1.5 rounded-full cursor-pointer transition-colors ${isPopupOpen ? 'bg-blue-100 text-blue-600' : 'hover:bg-slate-100 text-slate-600'}`}
                title="BCast"
              >
                 <Cast className="w-4 h-4" />
              </div>
              <div className="w-6 h-6 rounded-full overflow-hidden border border-slate-200 ml-2">
                 <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Profile" />
              </div>
              <Menu className="w-4 h-4 text-slate-500 ml-1 cursor-pointer" />
              
              {/* EXTENSION POPUP OVERLAY */}
              <div className="absolute top-8 right-0 z-50">
                <ExtensionPopup 
                  isOpen={isPopupOpen} 
                  onClose={() => setIsPopupOpen(false)}
                  onCast={handleCast}
                />
              </div>
           </div>
        </div>
      </div>

      {/* WEBVIEW CONTENT (Mock Bandcamp) */}
      <div className="flex-1 overflow-y-auto scroll-smooth relative">
         <MockBandcampPage />
         
         {/* Instruction Overlay for Demo */}
         <div className="absolute bottom-8 left-8 bg-slate-900/90 text-white p-4 rounded-lg shadow-xl backdrop-blur-md max-w-sm pointer-events-none">
            <h4 className="font-bold text-sm mb-1 text-blue-300">Extension Demo Mode</h4>
            <p className="text-xs text-slate-300">
               Click the <Cast className="w-3 h-3 inline mx-1" /> icon in the browser toolbar above to open the extension menu and "Cast" this album to the TV interface.
            </p>
         </div>
      </div>

    </div>
  );
};

export default App;