import { Album, Track } from '../types';

export const scrapeBandcampData = (): Album | null => {
  try {
    // Selectors based on standard Bandcamp DOM structure
    const nameSection = document.getElementById('name-section');
    if (!nameSection) throw new Error("Not a valid Bandcamp album page");

    const title = nameSection.querySelector('.trackTitle')?.textContent?.trim() || "Unknown Album";
    // Artist often appears as "by ArtistName"
    const artistContainer = nameSection.querySelector('h3');
    const artist = artistContainer?.querySelector('a')?.textContent?.trim() || 
                   artistContainer?.textContent?.replace(/^by\s+/, '').trim() || 
                   "Unknown Artist";

    // Artwork
    const artContainer = document.getElementById('tralbumArt');
    const coverUrl = artContainer?.querySelector('a.popupImage img')?.getAttribute('src') || 
                     artContainer?.querySelector('img')?.getAttribute('src') || "";

    // Tracks
    const trackRows = document.querySelectorAll('#track_table .track_row_view');
    const tracks: Track[] = [];

    trackRows.forEach((row, index) => {
      const titleEl = row.querySelector('.track-title');
      const timeEl = row.querySelector('.time');
      
      if (titleEl) {
        tracks.push({
          title: titleEl.textContent?.trim() || `Track ${index + 1}`,
          duration: timeEl?.textContent?.trim() || "--:--",
          position: index + 1
        });
      }
    });

    // If no track table (single track release), try to construct one from main info
    if (tracks.length === 0) {
       tracks.push({
         title: title,
         duration: document.querySelector('.time_total')?.textContent?.trim() || "3:00",
         position: 1
       });
    }

    // Tags
    const tags = Array.from(document.querySelectorAll('.tag')).map(t => t.textContent || "");
    
    // Release Date
    const credits = document.querySelector('.tralbum-credits')?.textContent;
    const releaseDate = credits?.match(/released\s+(.+?)(?:\n|$)/i)?.[1] || "";

    return {
      artist,
      title,
      coverUrl,
      tracks,
      releaseDate,
      tags,
      url: window.location.href
    };
  } catch (e) {
    console.error("Scraping failed:", e);
    return null;
  }
};