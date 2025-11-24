// This runs in the background of the browser
// It handles initialization events or long-running tasks

declare var chrome: any;

chrome.runtime.onInstalled.addListener(() => {
  console.log('BandCast Extension installed');
});

// Example: Listen for messages from the popup or content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CAST_REQUEST') {
    // In a real extension, we might coordinate the Casting session here
    // or inject the Cast SDK if not present.
    console.log('Cast request received', message.payload);
    sendResponse({ status: 'processing' });
  }
});