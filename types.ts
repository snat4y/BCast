
export interface Track {
  title: string;
  duration: string; // e.g., "3:45"
  position: number;
  streamUrl?: string; // Secure MP3 URL
}

export interface Album {
  artist: string;
  title: string;
  coverUrl: string;
  tracks: Track[];
  releaseDate?: string;
  tags?: string[];
  url?: string;
}

export enum ViewMode {
  SENDER = 'SENDER',
  TV_RECEIVER = 'TV_RECEIVER'
}
