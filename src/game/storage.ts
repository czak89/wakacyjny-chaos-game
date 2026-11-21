import { ACHIEVEMENTS, createDefaultProgress, parseSkinParam, resolveSelectedSkin } from './rules';
import type { AchievementId, HighScoreEntry, PlayerProgress } from './types';

const SCORES_KEY = 'rusalka_wakacyjny_chaos_scores_v1';
const MUTE_KEY = 'rusalka_wakacyjny_chaos_mute_v1';
const PROGRESS_KEY = 'rusalka_wakacyjny_chaos_progress_v1';

const VALID_ACHIEVEMENT_IDS = new Set<string>(ACHIEVEMENTS.map((a) => a.id));

export function loadLeaderboard(): HighScoreEntry[] {
  try {
    const raw = window.localStorage.getItem(SCORES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (entry): entry is HighScoreEntry =>
          entry &&
          typeof entry.score === 'number' &&
          typeof entry.day === 'number' &&
          typeof entry.rankTitle === 'string',
      )
      .slice(0, 5);
  } catch {
    return [];
  }
}

export function saveLeaderboard(entries: HighScoreEntry[]): void {
  try {
    window.localStorage.setItem(SCORES_KEY, JSON.stringify(entries.slice(0, 5)));
  } catch {
    // Ignore storage quota or sandbox restrictions.
  }
}

export function loadMuted(): boolean {
  try {
    return window.localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

export function saveMuted(muted: boolean): void {
  try {
    window.localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch {
    // Ignore storage errors.
  }
}

export function loadProgress(): PlayerProgress {
  const defaults = createDefaultProgress();
  try {
    const raw = window.localStorage.getItem(PROGRESS_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<PlayerProgress> | null;
    if (!parsed || typeof parsed !== 'object') return defaults;

    const unlockedAchievements: AchievementId[] = Array.isArray(parsed.unlockedAchievements)
      ? Array.from(
          new Set(
            parsed.unlockedAchievements.filter(
              (id): id is AchievementId => typeof id === 'string' && VALID_ACHIEVEMENT_IDS.has(id),
            ),
          ),
        )
      : [];

    const bestScore = Math.max(0, Number(parsed.bestScore) || 0);
    const desiredSkin = parseSkinParam(typeof parsed.selectedSkin === 'string' ? parsed.selectedSkin : null) ?? 'boy';
    const selectedSkin = resolveSelectedSkin(desiredSkin, unlockedAchievements, bestScore);

    return {
      selectedSkin,
      unlockedAchievements,
      totalInflatables: Math.max(0, Number(parsed.totalInflatables) || 0),
      totalWaffles: Math.max(0, Number(parsed.totalWaffles) || 0),
      totalKids: Math.max(0, Number(parsed.totalKids) || 0),
      totalSeagullsDodged: Math.max(0, Number(parsed.totalSeagullsDodged) || 0),
      bestCombo: Math.max(1, Number(parsed.bestCombo) || 1),
      bestScore,
    };
  } catch {
    return defaults;
  }
}

export function saveProgress(progress: PlayerProgress): void {
  try {
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // Ignore storage quota or sandbox restrictions.
  }
}
