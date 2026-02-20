const STORAGE_KEY = 'brick-breaker-highscores';
const MAX_ENTRIES = 10;

export interface HighScoreEntry {
  score: number;
  level: number;
  maxCombo: number;
  timePlaying: number;
  date: string; // ISO string
}

class HighScoreService {
  private entries: HighScoreEntry[] = [];

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.entries = JSON.parse(raw);
      }
    } catch {
      this.entries = [];
    }
  }

  private persist(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.entries));
  }

  getAll(): HighScoreEntry[] {
    return [...this.entries];
  }

  /** Returns the index the entry was inserted at, or -1 if it didn't make the list. */
  save(entry: HighScoreEntry): number {
    this.entries.push(entry);
    this.entries.sort((a, b) => b.score - a.score);
    this.entries = this.entries.slice(0, MAX_ENTRIES);
    this.persist();

    // Find the saved entry's rank (match by date to identify the exact entry)
    const idx = this.entries.findIndex(e => e.date === entry.date && e.score === entry.score);
    return idx;
  }

  isHighScore(score: number): boolean {
    if (this.entries.length < MAX_ENTRIES) return true;
    return score > this.entries[this.entries.length - 1].score;
  }

  getTopScore(): number {
    return this.entries.length > 0 ? this.entries[0].score : 0;
  }

  clear(): void {
    this.entries = [];
    localStorage.removeItem(STORAGE_KEY);
  }
}

export const highScores = new HighScoreService();
