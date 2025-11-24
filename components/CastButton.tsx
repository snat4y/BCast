import React from 'react';
import { Cast } from 'lucide-react';

interface CastButtonProps {
  isCasting: boolean;
  onClick: () => void;
}

const CastButton: React.FC<CastButtonProps> = ({ isCasting, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`p-2 rounded-full transition-all duration-300 flex items-center gap-2 px-4 ${
        isCasting 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
      }`}
      aria-label={isCasting ? "Disconnect Cast" : "Cast to Device"}
    >
      <Cast className={`w-5 h-5 ${isCasting ? 'fill-current' : ''}`} />
      <span className="font-medium text-sm hidden sm:block">
        {isCasting ? 'Connected to Living Room TV' : 'Cast'}
      </span>
    </button>
  );
};

export default CastButton;
