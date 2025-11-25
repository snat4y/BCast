import { scrapeBandcampData } from '../services/scraper';
import { Cast } from 'lucide-react';

declare var chrome: any;

console.log('[BCast] Content Script Loaded');

// 1. Inject the Cast Bridge script into the main page execution context
const injectScript = () => {
  try {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('cast_bridge.js');
    script.onload = () => {
       script.remove(); // Clean up tag after loading
    };
    (document.head || document.documentElement).appendChild(script);
    console.log('[BCast] Bridge script injected');
  } catch (e) {
    // Suppress context invalidated errors during reload
    if (!e.message?.includes('Extension context invalidated')) {
       console.error('[BCast] Injection failed:', e);
    }
  }
};

injectScript();

// Helper to scrape and trigger cast
const triggerCast = () => {
    const albumData = scrapeBandcampData();
    if (albumData) {
      console.log('[BCast] Sending data to bridge...');
      window.postMessage({
        source: 'BCAST_CONTENT',
        type: 'INIT_CAST',
        payload: albumData
      }, '*');
    } else {
      console.warn('[BCast] No album data found');
      if (document.visibilityState === 'visible') {
         alert('Could not find album data on this page.');
      }
    }
};

// 2. Listen for messages from the Popup
chrome.runtime.onMessage.addListener((request: any, sender: any, sendResponse: any) => {
  if (request.action === "TRIGGER_CAST") {
    triggerCast();
    sendResponse({ status: "ok" });
  }
  return true;
});

// 3. Inject Floating Cast Button
const injectFloatingButton = () => {
  if (!document.getElementById('name-section') && !document.querySelector('.track_list')) {
      return; 
  }
  
  // Prevent duplicate buttons
  if (document.getElementById('bcast-floating-btn')) return;

  const btn = document.createElement('div');
  btn.id = 'bcast-floating-btn';
  btn.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 56px;
    height: 56px;
    background-color: #1da1f2;
    border-radius: 50%;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 99999;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s;
  `;
  
  btn.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6"/>
      <line x1="2" x2="2.01" y1="20" y2="20"/>
    </svg>
  `;

  btn.onmouseover = () => btn.style.transform = 'scale(1.1)';
  btn.onmouseout = () => btn.style.transform = 'scale(1)';

  btn.onclick = () => {
    triggerCast();
  };

  document.body.appendChild(btn);
};

if (document.readyState === 'complete') {
  injectFloatingButton();
} else {
  window.addEventListener('load', injectFloatingButton);
}