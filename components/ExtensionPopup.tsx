import React from 'react';
import { Cast, Settings, Info, Music } from 'lucide-react';

interface ExtensionPopupProps {
  onCast: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const ExtensionPopup: React.FC<ExtensionPopupProps> = ({ onCast, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="w-full h-full bg-white flex flex-col font-sans">
      {/* Extension Header */}
      <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between">
         <div className="flex items-center gap-2">
           <div className="bg-gradient-to-br from-blue-600 to-cyan-500 w-8 h-8 rounded-lg flex items-center justify-center shadow-sm">
             <Cast className="w-4 h-4 text-white" />
           </div>
           <div>
             <h1 className="font-bold text-slate-800 text-base leading-tight">BCast</h1>
             <span className="text-[10px] text-slate-500 font-medium">Bandcamp to TV</span>
           </div>
         </div>
         <div className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold border border-blue-100">v0.1</div>
      </div>

      {/* Main Action Area */}
      <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
         <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
            <Music className="w-8 h-8" />
         </div>
         
         <h2 className="text-slate-800 font-semibold mb-1">Ready to Cast</h2>
         <p className="text-xs text-slate-500 mb-6 max-w-[200px]">
           Navigate to any Bandcamp album page and click the button below.
         </p>

         <button 
           onClick={() => {
             onCast();
             onClose();
           }}
           className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-95 group"
         >
           <Cast className="w-5 h-5 group-hover:animate-pulse" />
           Cast Current Album
         </button>
      </div>

      {/* Footer Links */}
      <div className="bg-slate-50 p-3 border-t border-slate-100 grid grid-cols-2 gap-4 text-center">
         <button className="text-xs text-slate-500 hover:text-blue-600 flex items-center justify-center gap-1.5 transition-colors">
            <Settings className="w-3.5 h-3.5" /> Settings
         </button>
         <button className="text-xs text-slate-500 hover:text-blue-600 flex items-center justify-center gap-1.5 transition-colors">
            <Info className="w-3.5 h-3.5" /> About
         </button>
      </div>
    </div>
  );
};

export default ExtensionPopup;