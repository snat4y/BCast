import { scrapeBandcampData } from '../services/scraper';
import { Cast } from 'lucide-react';

declare var chrome: any;

console.log('[BCast] Content Script Loaded');

// 1. Inject the Cast Bridge script into the main page execution context
const injectScript = () => {
  try {
    const script = document.createElement('script');
    // We must get the full URL of the resource inside the extension
    script.src = chrome.runtime.getURL('cast_bridge.js');
    script.onload = () => {
       script.remove(); // Clean up tag after loading
    };
    (document.head || document.documentElement).appendChild(script);
    console.log('[BCast] Bridge script injected');
  } catch (e) {
    console.error('[BCast] Injection failed:', e);
  }
};

injectScript();

// 2. Listen for messages from the Popup (alternative trigger)
chrome.runtime.onMessage.addListener((request: any, sender: any, sendResponse: any) => {
  if (request.action === "GET_ALBUM_DATA") {
    const albumData = scrapeBandcampData();
    if (albumData) {
      sendResponse({ success: true, data: albumData });
    } else {
      sendResponse({ success: false, error: "No album found on this page" });
    }
  }
});

// 3. Inject Floating Cast Button
const injectFloatingButton = () => {
  // Check if we are on a valid album page
  if (!document.getElementById('name-section') && !document.querySelector('.track_list')) {
      return; // Not an album page
  }

  const btn = document.createElement('div');
  // Styling for the floating button
  btn.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 56px;
    height: 56px;
    background-color: #1da1f2; /* Bandcamp Blue-ish */
    border-radius: 50%;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 99999;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s;
  `;
  
  // Icon (SVG)
  btn.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6"/>
      <line x1="2" x2="2.01" y1="20" y2="20"/>
    </svg>
  `;

  btn.onmouseover = () => btn.style.transform = 'scale(1.1)';
  btn.onmouseout = () => btn.style.transform = 'scale(1)';

  btn.onclick = () => {
    const albumData = scrapeBandcampData();
    if (albumData) {
      console.log('[BCast] Button Clicked. Sending data to bridge...');
      // Post message to the Main World where cast_bridge.js lives
      window.postMessage({
        source: 'BCAST_CONTENT',
        type: 'INIT_CAST',
        payload: albumData
      }, '*');
    } else {
      alert('Could not find album data on this page.');
    }
  };

  document.body.appendChild(btn);
};

// Wait for page load
if (document.readyState === 'complete') {
  injectFloatingButton();
} else {
  window.addEventListener('load', injectFloatingButton);
}