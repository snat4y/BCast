import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import TvInterface from '../components/TvInterface';
import { Album } from '../types';

/**
 * THIS APP MUST BE HOSTED ON A PUBLIC URL (e.g., https://my-receiver.com)
 * The Chromecast device loads this URL.
 */
const ReceiverApp = () => {
  const [album, setAlbum] = useState<Album | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // @ts-ignore
    const context = cast.framework.CastReceiverContext.getInstance();
    
    // Configure options to prevent timeout
    // @ts-ignore
    const options = new cast.framework.CastReceiverOptions();
    options.disableIdleTimeout = true; // Keep receiver open indefinitely

    const CUSTOM_CHANNEL = 'urn:x-cast:com.bcast.data';
    
    context.addCustomMessageListener(CUSTOM_CHANNEL, (event: any) => {
      const data = event.data;
      if (data.type === 'LOAD_ALBUM') {
        setAlbum(data.payload);
        setIsPlaying(true);
      }
    });

    context.start(options);
    
    console.log("Receiver App Started. Waiting for Cast connection...");
  }, []);

  if (!album) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">BCast</h1>
          <p className="text-slate-400">Ready to Cast. Waiting for content...</p>
        </div>
      </div>
    );
  }

  return (
    <TvInterface 
      album={album}
      currentTrackIndex={currentTrackIndex}
      isPlaying={isPlaying}
      onClose={() => setAlbum(null)}
      onNext={() => setCurrentTrackIndex(i => (i + 1) % album.tracks.length)}
      onPrev={() => setCurrentTrackIndex(i => (i - 1 + album.tracks.length) % album.tracks.length)}
      onTogglePlay={() => setIsPlaying(!isPlaying)}
    />
  );
};

// Only mount if we are in the receiver build entry point
const root = document.getElementById('receiver-root');
if (root) {
  ReactDOM.createRoot(root).render(<ReceiverApp />);
}

export default ReceiverApp;