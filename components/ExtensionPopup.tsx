import React from 'react';
import { Cast, ExternalLink, Settings, Info } from 'lucide-react';

interface ExtensionPopupProps {
  onCast: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const ExtensionPopup: React.FC<ExtensionPopupProps> = ({ onCast, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute top-14 right-4 w-72 bg-white rounded-lg shadow-xl border border-slate-200 z-50 overflow-hidden font-sans transform origin-top-right transition-all">
      {/* Extension Header */}
      <div className="bg-slate-50 p-3 border-b border-slate-100 flex items-center justify-between">
         <div className="flex items-center gap-2">
           <div className="bg-gradient-to-br from-blue-500 to-cyan-400 w-6 h-6 rounded flex items-center justify-center">
             <Cast className="w-3 h-3 text-white" />
           </div>
           <span className="font-semibold text-slate-700 text-sm">BCast</span>
         </div>
         <div className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">BETA</div>
      </div>

      {/* Main Action Area */}
      <div className="p-4">
         <div className="mb-4 text-center">
            <p className="text-xs text-slate-500 mb-2">Detected Album</p>
            <div className="font-bold text-slate-800 truncate">Neon Horizons</div>
            <div className="text-xs text-slate-500 truncate">Synthwave Collective</div>
         </div>

         <button 
           onClick={() => {
             onCast();
             onClose();
           }}
           className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors shadow-sm active:transform active:scale-95"
         >
           <Cast className="w-4 h-4" />
           Cast to TV
         </button>
      </div>

      {/* Footer Links */}
      <div className="bg-slate-50 p-2 border-t border-slate-100 grid grid-cols-2 gap-px text-center">
         <button className="p-2 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded flex items-center justify-center gap-1 transition-colors">
            <Settings className="w-3 h-3" /> Settings
         </button>
         <button className="p-2 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded flex items-center justify-center gap-1 transition-colors">
            <Info className="w-3 h-3" /> About
         </button>
      </div>
      
      {/* Triangle pointer */}
      <div className="absolute -top-1.5 right-3 w-3 h-3 bg-slate-50 border-t border-l border-slate-100 transform rotate-45"></div>
    </div>
  );
};

export default ExtensionPopup;