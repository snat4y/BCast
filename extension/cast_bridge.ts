
// This script runs in the MAIN WORLD (injected by content script)
// It has access to window.chrome.cast and the Cast SDK

// ---------------------------------------------------------
const CAST_APP_ID = '298333F8'; 
// ---------------------------------------------------------

const CUSTOM_NAMESPACE = 'urn:x-cast:com.bcast.data';

console.log('[BCast] Bridge Loaded');

// 1. Load the Google Cast SDK dynamically
const loadCastSdk = () => {
  const script = document.createElement('script');
  script.src = '//www.gstatic.com/cast/sdk/libs/sender/v1/cast_framework.js?loadCastFramework=1';
  document.head.appendChild(script);
};

// 2. Initialize Cast Context when SDK is ready
window['__onGCastApiAvailable'] = (isAvailable: boolean) => {
  if (isAvailable) {
    try {
      // @ts-ignore
      cast.framework.CastContext.getInstance().setOptions({
        receiverApplicationId: CAST_APP_ID,
        autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
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
  try {
    // @ts-ignore
    const context = cast.framework.CastContext.getInstance();
    
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
        alert("Cast failed. Check console for details. Ensure App ID is registered.");
    }
  }
}

// Start the process
loadCastSdk();