// This script runs in the MAIN WORLD (injected by content script)
// It has access to window.chrome.cast and the Cast SDK

interface Window {
  cast: any;
  chrome: any;
  __onGCastApiAvailable: (isAvailable: boolean) => void;
}

// ---------------------------------------------------------
const CAST_APP_ID = '298333F8'; 
const CUSTOM_NAMESPACE = 'urn:x-cast:com.bcast.data';
// ---------------------------------------------------------

console.log('[BCast] Bridge Loaded');

// 1. Load the Google Cast SDK dynamically
const loadCastSdk = () => {
  if (document.querySelector('script[src*="cast_framework.js"]')) {
      console.log('[BCast] SDK script already present');
      return;
  }
  const script = document.createElement('script');
  script.src = '//www.gstatic.com/cast/sdk/libs/sender/v1/cast_framework.js?loadCastFramework=1';
  document.head.appendChild(script);
};

// 2. Initialize Cast Context when SDK is ready
window.__onGCastApiAvailable = (isAvailable: boolean) => {
  if (isAvailable && window.cast) {
    try {
      window.cast.framework.CastContext.getInstance().setOptions({
        receiverApplicationId: CAST_APP_ID,
        autoJoinPolicy: window.chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
      });
      console.log('[BCast] SDK Initialized with ID:', CAST_APP_ID);
    } catch (e) {
      console.error('[BCast] SDK Init Error:', e);
    }
  }
};

// 3. Listen for messages from Content Script
window.addEventListener('message', async (event) => {
  // Only accept messages from ourselves
  if (event.source !== window || !event.data || event.data.source !== 'BCAST_CONTENT') {
    return;
  }

  if (event.data.type === 'INIT_CAST') {
    console.log('[BCast] Casting requested for:', event.data.payload.title);
    startCasting(event.data.payload);
  }
});

async function startCasting(albumData: any) {
  // FIX: Access cast via window to avoid ReferenceError
  if (!window.cast || !window.cast.framework) {
      alert("Cast SDK is loading... please wait a moment and try again.");
      return;
  }

  try {
    const context = window.cast.framework.CastContext.getInstance();
    
    // Request session (opens the Cast dialog)
    await context.requestSession();
    
    const session = context.getCurrentSession();
    if (!session) {
        throw new Error("Failed to create session");
    }

    // Send the Album Data to the receiver via custom channel
    session.sendMessage(CUSTOM_NAMESPACE, {
      type: 'LOAD_ALBUM',
      payload: albumData
    })
    .then(() => console.log('[BCast] Data sent to receiver'))
    .catch((e: any) => console.error('[BCast] Send Error:', e));

  } catch (error) {
    console.error('[BCast] Cast Error:', error);
    if (String(error).includes('cancel')) {
        // User cancelled dialog
    } else {
        // Optional: alert user if it's a real error
    }
  }
}

// Start the process
loadCastSdk();