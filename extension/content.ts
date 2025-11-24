import { scrapeBandcampData } from '../services/scraper';

declare var chrome: any;

// This script runs on the actual Bandcamp page
console.log('BandCast Content Script Loaded');

// Listen for messages from the Popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "GET_ALBUM_DATA") {
    const albumData = scrapeBandcampData();
    if (albumData) {
      sendResponse({ success: true, data: albumData });
    } else {
      sendResponse({ success: false, error: "No album found on this page" });
    }
  }
});

// Optional: Inject a small floating cast button directly into the page
const injectFloatingButton = () => {
  const btn = document.createElement('button');
  btn.innerText = 'Cast Album';
  btn.style.position = 'fixed';
  btn.style.bottom = '20px';
  btn.style.right = '20px';
  btn.style.zIndex = '9999';
  btn.onclick = () => {
    // Logic to trigger cast
    alert('Use the extension icon to cast!');
  };
  document.body.appendChild(btn);
};

// injectFloatingButton();