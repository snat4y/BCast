import React from 'react';
import { Play, Heart, Share2 } from 'lucide-react';

const MockBandcampPage: React.FC = () => {
  return (
    <div className="bg-[#fff] min-h-full font-sans text-[#333]">
      {/* Bandcamp Header Simulation */}
      <div className="border-b border-gray-300 py-4 mb-8 bg-white">
        <div className="max-w-[960px] mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-24 h-8 bg-slate-200 rounded flex items-center justify-center text-slate-500 font-bold text-lg italic">
              bandcamp
            </div>
            <div className="hidden md:flex gap-4 text-sm text-gray-500">
               <span>Discover</span>
               <span>Fan Accounts</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <input type="text" placeholder="Search and discover music" className="bg-slate-100 border border-slate-300 rounded px-3 py-1 text-sm w-48" />
            <div className="w-8 h-8 rounded-full bg-blue-500"></div>
          </div>
        </div>
      </div>

      {/* Main Content Centered */}
      <div className="max-w-[960px] mx-auto px-4 pb-20">
        
        {/* Banner */}
        <div className="w-full h-32 bg-gradient-to-r from-indigo-900 to-purple-800 mb-8 rounded-sm"></div>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          
          {/* Left Column: Info & Tracks */}
          <div className="flex-1 min-w-0">
            <div id="name-section" className="mb-6">
               <h2 className="trackTitle text-3xl font-bold mb-1 tracking-tight text-slate-900">
                 Neon Horizons
               </h2>
               <h3 className="text-lg text-slate-500">
                 by <a href="#" className="text-slate-800 font-normal hover:underline">Synthwave Collective</a>
               </h3>
            </div>

            <div className="mb-6 flex gap-2">
               <button className="bg-white border border-slate-300 rounded px-3 py-1 text-sm font-bold text-slate-600 flex items-center gap-1">
                 <Share2 className="w-3 h-3" /> Share / Embed
               </button>
               <button className="bg-white border border-slate-300 rounded px-3 py-1 text-sm font-bold text-slate-600 flex items-center gap-1">
                 <Heart className="w-3 h-3" /> Wishlist
               </button>
            </div>

            {/* Mock Player */}
            <div className="inline-block relative mb-8">
              <div className="flex items-center gap-2 border border-slate-300 p-1 pr-3 rounded bg-white">
                 <div className="w-10 h-10 bg-slate-800 flex items-center justify-center cursor-pointer hover:bg-slate-700">
                    <Play className="w-5 h-5 text-white fill-current" />
                 </div>
                 <div className="flex flex-col">
                    <span className="text-xs text-slate-500">Now Playing</span>
                    <span className="text-sm font-bold">Night Call (feat. Starwalker)</span>
                 </div>
                 <div className="ml-4 text-xs font-mono text-slate-500">0:00 / 4:20</div>
              </div>
            </div>

            <div className="mb-4 text-sm font-bold text-slate-700">Digital Album</div>
            <div className="mb-8 text-sm text-slate-600 leading-relaxed">
               <p className="mb-2">Includes high-quality download in MP3, FLAC and more. Paying supporters also get unlimited streaming via the free Bandcamp app.</p>
               <div className="mt-4">
                  <a href="#" className="text-blue-600 hover:underline font-bold text-lg">Buy Digital Album</a>
                  <span className="ml-2 text-slate-500 text-lg">€7 EUR or more</span>
               </div>
            </div>

            {/* Track List - DOM Scraper Targets this */}
            <table id="track_table" className="w-full text-sm text-slate-800 mb-8">
               <tbody>
                  {[
                    { title: "Night Call (feat. Starwalker)", time: "4:20" },
                    { title: "Cyberpunk Dreams", time: "3:45" },
                    { title: "Analog Sunrise", time: "5:12" },
                    { title: "Mainframe Breach", time: "3:30" },
                    { title: "Neon Rain", time: "4:05" },
                    { title: "Velocity", time: "3:55" }
                  ].map((track, i) => (
                    <tr key={i} className="track_row_view group hover:bg-blue-50 cursor-pointer">
                       <td className="py-2 pl-2 w-8 text-slate-500 text-xs align-middle">
                         <div className="group-hover:hidden">{i + 1}.</div>
                         <Play className="hidden group-hover:block w-3 h-3 fill-current text-slate-800" />
                       </td>
                       <td className="py-2 align-middle">
                         <div className="track-title font-medium group-hover:underline">{track.title}</div>
                       </td>
                       <td className="py-2 pr-2 text-right align-middle">
                         <span className="time text-slate-500 text-xs">{track.time}</span>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
             
            <div className="text-xs text-slate-500 leading-6 max-w-lg">
               <div className="tralbum-credits mb-4">
                 released October 15, 2023<br/>
                 Produced by The Collective.<br/>
                 Mastered by Analog Dave.
               </div>
               <div className="flex flex-wrap gap-2">
                  {["electronic", "synthwave", "retrowave", "80s", "cyberpunk"].map(tag => (
                     <span key={tag} className="tag bg-slate-100 px-2 py-0.5 rounded text-slate-500 hover:underline cursor-pointer">
                       {tag}
                     </span>
                  ))}
               </div>
            </div>
          </div>

          {/* Right Column: Art */}
          <div className="w-full md:w-[350px] flex-shrink-0">
             <div id="tralbumArt" className="mb-6 relative group cursor-pointer">
                <a className="popupImage">
                   <img 
                     src="https://images.unsplash.com/photo-1535905557558-afc4877a26fc?auto=format&fit=crop&q=80&w=800" 
                     alt="Album Art" 
                     className="w-full aspect-square object-cover shadow-sm border border-slate-200"
                   />
                </a>
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
             </div>

             <div className="border-t border-slate-200 pt-4">
                <h4 className="font-bold text-xs text-slate-500 uppercase mb-2">Discography</h4>
                <div className="grid grid-cols-2 gap-2">
                   <div className="bg-slate-200 aspect-square"></div>
                   <div className="bg-slate-200 aspect-square"></div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MockBandcampPage;