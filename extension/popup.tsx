import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import ExtensionPopup from '../components/ExtensionPopup';
import { Album } from '../types';

declare var chrome: any;

// This acts as the entry point for the little popup window when you click the extension icon
const PopupEntry = () => {
  const [isOpen, setIsOpen] = useState(true);

  const handleCast = () => {
    // 1. Send message to Content Script to get Data
    // Note: In the real extension, 'chrome' is defined. In this simulator, it is not.
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs: any[]) => {
        if (tabs[0].id) {
          chrome.tabs.sendMessage(tabs[0].id, { action: "GET_ALBUM_DATA" }, (response: any) => {
            if (response && response.success) {
               // 2. Initialize Cast Session with this data
               // This usually involves sending a message to the Background script 
               // or using the Cast SDK directly if loaded in the popup.
               console.log("Casting Album:", response.data);
               
               // For now, we simulate success
               window.close(); // Close popup
            }
          });
        }
      });
    } else {
      console.warn("Chrome API not available in simulator");
      alert("This Cast button only works when packaged as an extension.");
    }
  };

  return (
    <div className="w-[300px] h-auto min-h-[200px] bg-white">
      {/* We reuse the component, but force it open */}
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