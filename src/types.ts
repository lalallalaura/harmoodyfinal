export type MoodId = "energized" | "calm" | "romantic" | "light";

export interface Mood {
  id: MoodId;
  label: string;
  emoji: string;
  description: string;
  energy: number;
  valence: number;
}

export interface Song {
  id: number;
  title: string;
  artist: string;
  bpm: number;
  valence: number;
  energy: number;
  moods: MoodId[];
  cover: string;
}

export interface SpotifyTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  cover: string;
  durationMs: number;
  popularity: number;
  previewUrl: string | null;
  spotifyUrl: string | null;
}