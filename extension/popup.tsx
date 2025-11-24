import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import ExtensionPopup from '../components/ExtensionPopup';

declare var chrome: any;
declare var cast: any;

// ---------------------------------------------------------
// TODO: SAME APP ID AS IN cast_bridge.ts
const CAST_APP_ID = '298333F8'; 
// ---------------------------------------------------------

const PopupEntry = () => {
  const [isOpen, setIsOpen] = useState(true);

  // Initialize Cast Context when popup opens
  useEffect(() => {
    const initCast = () => {
      if (typeof cast !== 'undefined' && cast.framework) {
        try {
          cast.framework.CastContext.getInstance().setOptions({
            receiverApplicationId: CAST_APP_ID,
            autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
          });
        } catch(e) { console.log("Context already initialized"); }
      }
    };
    
    // Check if SDK is loaded
    if (window['chrome'] && window['chrome']['cast']) {
      initCast();
    } else {
      window['__onGCastApiAvailable'] = (isAvailable: boolean) => {
        if (isAvailable) initCast();
      };
    }
  }, []);

  const handleCast = () => {
    // 1. Get Data from Content Script
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs: any[]) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { action: "GET_ALBUM_DATA" }, async (response: any) => {
            if (response && response.success) {
               await startPopupCast(response.data);
            } else {
               alert("Go to a Bandcamp album page to cast.");
            }
          });
        }
      });
    }
  };

  const startPopupCast = async (albumData: any) => {
     try {
       const context = cast.framework.CastContext.getInstance();
       await context.requestSession();
       const session = context.getCurrentSession();
       if (session) {
         session.sendMessage('urn:x-cast:com.bcast.data', {
            type: 'LOAD_ALBUM',
            payload: albumData
         });
         window.close();
       }
     } catch (e) {
       console.error("Popup Cast Error:", e);
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