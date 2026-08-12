import { moods, songs } from "../data";
import { MoodId, Song } from "../types";

function distance(a: number, b: number) {
  return Math.abs(a - b);
}

export function recommendSongs(moodId: MoodId): { songs: Song[]; score: number } {
  const mood = moods.find((item) => item.id === moodId)!;

  const ranked = songs
    .map((song) => {
      const moodBonus = song.moods.includes(moodId) ? 0.35 : 0;
      const energyFit = 1 - distance(song.energy, mood.energy);
      const valenceFit = 1 - distance(song.valence, mood.valence);
      const bpmTarget = moodId === "energized" ? 120 : moodId === "calm" ? 80 : moodId === "romantic" ? 95 : 100;
      const bpmFit = 1 - Math.min(distance(song.bpm, bpmTarget) / 100, 1);

      const score =
        moodBonus +
        energyFit * 0.3 +
        valenceFit * 0.25 +
        bpmFit * 0.1;

      return { song, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((item) => item.song);

  const avgFit =
    ranked.reduce((total, song) => {
      return total + (1 - distance(song.energy, mood.energy)) * 50 + (1 - distance(song.valence, mood.valence)) * 50;
    }, 0) / Math.max(ranked.length, 1);

  return {
    songs: ranked,
    score: Math.round(Math.min(Math.max(avgFit, 50), 98)),
  };
}