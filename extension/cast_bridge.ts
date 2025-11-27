
// This script runs in the MAIN WORLD (injected by content script)
// It has access to window.chrome.cast, the Cast SDK, AND Bandcamp's window.TralbumData

interface Window {
  cast: any;
  chrome: any;
  __onGCastApiAvailable: (isAvailable: boolean) => void;
  TralbumData: any; // Bandcamp Global Data
}

const CAST_APP_ID = '298333F8'; 
const CUSTOM_NAMESPACE = 'urn:x-cast:com.bcast.data';

// State tracking
let isCastApiInitialized = false;
let pendingCastRequest: any = null;

console.log('[BCast] Bridge Loaded');

const initializeCastApi = () => {
  if (isCastApiInitialized) return;

  if (window.cast && window.cast.framework) {
    try {
       // Initialize the CastContext
       window.cast.framework.CastContext.getInstance().setOptions({
        receiverApplicationId: CAST_APP_ID,
        autoJoinPolicy: window.chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
      });

      isCastApiInitialized = true;
      console.log('[BCast] SDK Initialized & Ready via Poll/Callback');

      // Execute queued request if one exists
      if (pendingCastRequest) {
        console.log('[BCast] Executing queued cast request...');
        const data = pendingCastRequest;
        pendingCastRequest = null;
        startCasting(data);
      }
    } catch (e) {
      console.error('[BCast] SDK Init Error:', e);
    }
  }
};

// 1. Set global callback
window.__onGCastApiAvailable = (isAvailable: boolean) => {
  if (isAvailable) {
    initializeCastApi();
  }
};

// 2. Poll for SDK existence (Fallback if callback is missed)
const checkSdkInterval = setInterval(() => {
  if (window.cast && window.cast.framework) {
    initializeCastApi();
    clearInterval(checkSdkInterval);
  }
}, 500);

// 3. Load the Google Cast SDK dynamically
const loadCastSdk = () => {
  if (document.querySelector('script[src*="cast_framework.js"]')) {
      // If script exists, just check initialization
      initializeCastApi();
      return;
  }
  
  const script = document.createElement('script');
  script.src = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';
  document.head.appendChild(script);
};

// Helper: Reconstruct tracklist from Bandcamp's authoritative TralbumData
// This ensures we get ALL tracks (including unplayable/unreleased ones) with correct metadata.
const reconstructTracks = (albumData: any) => {
  try {
    // @ts-ignore
    const tralbum = window.TralbumData;
    
    if (tralbum && tralbum.trackinfo) {
       console.log('[BCast] Found TralbumData. Reconstructing tracklist for accuracy...');
       
       const newTracks = tralbum.trackinfo.map((t: any, idx: number) => {
          let streamUrl = null;
          
          if (t.file) {
             // Prefer 128kbps MP3
             streamUrl = t.file['mp3-128'] || Object.values(t.file)[0];
          }

          // Format duration (t.duration is usually seconds float)
          let durationStr = "--:--";
          if (t.duration) {
              const mins = Math.floor(t.duration / 60);
              const secs = Math.floor(t.duration % 60);
              durationStr = `${mins}:${secs.toString().padStart(2, '0')}`;
          }

          return { 
              title: t.title,
              duration: durationStr,
              position: t.track_num || (idx + 1),
              streamUrl: streamUrl
          };
       });

       return {
           ...albumData,
           tracks: newTracks
       };
    } else {
      console.warn('[BCast] No TralbumData found. Using DOM-scraped data.');
    }
  } catch (e) {
    console.error('[BCast] Error reconstructing tracks:', e);
  }
  return albumData;
};

// 4. Listen for messages from Content Script
window.addEventListener('message', async (event) => {
  if (event.source !== window || !event.data || event.data.source !== 'BCAST_CONTENT') {
    return;
  }

  if (event.data.type === 'INIT_CAST') {
    // We ignore the tracks passed from scraper and rebuild them from source of truth
    const enrichedData = reconstructTracks(event.data.payload);
    startCasting(enrichedData);
  }
});

async function startCasting(albumData: any) {
  // QUEUE LOGIC: If SDK isn't ready, save data and wait.
  if (!isCastApiInitialized || !window.cast || !window.cast.framework) {
      console.log('[BCast] SDK not ready. Request queued.');
      pendingCastRequest = albumData;
      loadCastSdk();
      return;
  }

  try {
    const context = window.cast.framework.CastContext.getInstance();
    
    // Request session (opens the Cast dialog)
    await context.requestSession();
    
    const session = context.getCurrentSession();
    if (!session) {
        throw new Error("No active session");
    }

    // Send the Album Data
    session.sendMessage(CUSTOM_NAMESPACE, {
      type: 'LOAD_ALBUM',
      payload: albumData
    })
    .then(() => console.log('[BCast] Data sent to receiver'))
    .catch((e: any) => console.error('[BCast] Send Error:', e));

  } catch (error) {
    if (error !== 'cancel') {
        console.error('[BCast] Cast session handling:', error);
    }
  }
}

// Start loading the SDK immediately
loadCastSdk();