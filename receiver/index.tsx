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
  const [systemVolume, setSystemVolume] = useState(1);

  useEffect(() => {
    // @ts-ignore
    const context = cast.framework.CastReceiverContext.getInstance();
    
    // @ts-ignore
    const playerManager = context.getPlayerManager();
    
    // Get initial system volume
    const initialSystemVolume = context.getSystemVolume();
    if (initialSystemVolume) {
        setSystemVolume(initialSystemVolume.level);
    }

    // Configure options to prevent timeout
    // @ts-ignore
    const options = new cast.framework.CastReceiverOptions();
    options.disableIdleTimeout = true; // Keep receiver open indefinitely

    const CUSTOM_CHANNEL = 'urn:x-cast:com.bcast.data';
    
    context.addCustomMessageListener(CUSTOM_CHANNEL, (event: any) => {
      const data = event.data;
      if (data.type === 'LOAD_ALBUM') {
        const albumData = data.payload;
        
        // Find first playable track (one with a streamUrl)
        let startIndex = 0;
        if (albumData.tracks && albumData.tracks.length > 0) {
            startIndex = albumData.tracks.findIndex((t: any) => t.streamUrl);
            if (startIndex === -1) startIndex = 0; // Fallback even if nothing is playable
        }

        setAlbum(albumData);
        setCurrentTrackIndex(startIndex);
        // Only auto-play if we found a playable track
        setIsPlaying(albumData.tracks[startIndex]?.streamUrl ? true : false);
      }
    });

    // Listen to System Volume Changes (from Phone or Remote)
    // @ts-ignore
    const onSystemVolumeChanged = (event) => {
        // We can trust getSystemVolume() to be current
        const vol = context.getSystemVolume();
        if (vol) {
          setSystemVolume(vol.level);
        }
    };

    // @ts-ignore
    context.addEventListener(cast.framework.system.EventType.SYSTEM_VOLUME_CHANGED, onSystemVolumeChanged);

    context.start(options);
    
    console.log("Receiver App Started. Waiting for Cast connection...");

    return () => {
       // @ts-ignore
       context.removeEventListener(cast.framework.system.EventType.SYSTEM_VOLUME_CHANGED, onSystemVolumeChanged);
    };
  }, []);

  const handleVolumeChange = (newVol: number) => {
      // @ts-ignore
      const context = cast.framework.CastReceiverContext.getInstance();
      context.setSystemVolumeLevel(newVol);
      setSystemVolume(newVol); // Optimistic update
  };

  const handleNext = () => {
    if (!album) return;
    let nextIdx = currentTrackIndex;
    let attempts = 0;
    // Loop until we find a track with a streamUrl or we've cycled through all
    do {
        nextIdx = (nextIdx + 1) % album.tracks.length;
        attempts++;
    } while (!album.tracks[nextIdx].streamUrl && attempts < album.tracks.length);

    if (attempts < album.tracks.length && album.tracks[nextIdx].streamUrl) {
        setCurrentTrackIndex(nextIdx);
        setIsPlaying(true);
    }
  };

  const handlePrev = () => {
    if (!album) return;
    let prevIdx = currentTrackIndex;
    let attempts = 0;
    // Loop until we find a track with a streamUrl
    do {
        prevIdx = (prevIdx - 1 + album.tracks.length) % album.tracks.length;
        attempts++;
    } while (!album.tracks[prevIdx].streamUrl && attempts < album.tracks.length);

    if (attempts < album.tracks.length && album.tracks[prevIdx].streamUrl) {
        setCurrentTrackIndex(prevIdx);
        setIsPlaying(true);
    }
  };

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
      volume={systemVolume} // Pass system volume to UI
      onVolumeChange={handleVolumeChange} // Allow UI to control system volume
      onClose={() => setAlbum(null)}
      onNext={handleNext}
      onPrev={handlePrev}
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