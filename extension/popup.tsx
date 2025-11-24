import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import ExtensionPopup from '../components/ExtensionPopup';
import '../src/index.css'; // Import Tailwind CSS locally

declare var chrome: any;

const PopupEntry = () => {
  const [isOpen, setIsOpen] = useState(true);

  const handleCast = () => {
    // We cannot run the Cast SDK in the popup due to CSP restrictions on external scripts.
    // Instead, we send a message to the active tab's content script to trigger the cast flow.
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs: any[]) => {
        const activeTab = tabs[0];
        if (activeTab?.id) {
          chrome.tabs.sendMessage(activeTab.id, { action: "TRIGGER_CAST" });
          window.close();
        }
      });
    } else {
        console.warn("Chrome API not available (are you in development mode?)");
    }
  };

  return (
    <div className="w-[300px] h-auto min-h-[200px] bg-white">
      <ExtensionPopup 
        isOpen={isOpen} 
        onClose={() => window.close()} 
        onCast={handleCast} 
      />
    </div>
  );
};

const root = document.getElementById('popup-root');
if (root) {
  ReactDOM.createRoot(root).render(<PopupEntry />);
}