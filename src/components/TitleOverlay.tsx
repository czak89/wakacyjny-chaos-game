import React, { useEffect, useMemo, useState } from 'react';
import {
  ACHIEVEMENTS,
  ANIMATOR_SKINS,
  getSkinDef,
  isSkinUnlocked,
} from '../game/rules';
import { getAnimatorSkinPreviewUrl } from '../game/sprites';
import type {
  AnimatorSkinId,
  HighScoreEntry,
  PlayerProgress,
} from '../game/types';
import {
  LockPixelIcon,
  SoundPixelIcon,
  TitleCrestSvg,
  TrophyPixelIcon,
} from './PixelIcons';
import { TrophyCabinetModal } from './TrophyCabinetModal';

interface TitleOverlayProps {
  bestScore: number;
  leaderboard: HighScoreEntry[];
  progress: PlayerProgress;
  muted: boolean;
  onStart: () => void;
  onSelectSkin: (skin: AnimatorSkinId) => void;
  onToggleMute: () => void;
}

export function TitleOverlay({
  bestScore,
  leaderboard,
  progress,
  muted,
  onStart,
  onSelectSkin,
  onToggleMute,
}: TitleOverlayProps) {
  const [showRecords, setShowRecords] = useState(false);
  const [showTrophies, setShowTrophies] = useState(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('trophies') === '1';
  });
  const [focusedSkinId, setFocusedSkinId] = useState<AnimatorSkinId>(progress.selectedSkin);

  useEffect(() => {
    setFocusedSkinId(progress.selectedSkin);
  }, [progress.selectedSkin]);

  const skinPreviews = useMemo(() => {
    const map = {} as Record<AnimatorSkinId, string>;
    for (const skin of ANIMATOR_SKINS) {
      map[skin.id] = getAnimatorSkinPreviewUrl(skin.id);
    }
    return map;
  }, []);

  const inspectedSkin = getSkinDef(focusedSkinId);
  const inspectedUnlocked = isSkinUnlocked(
    focusedSkinId,
    progress.unlockedAchievements,
    progress.bestScore,
  );
  const unlockedCount = progress.unlockedAchievements.length;

  return (
    <>
      <div className="fixed inset-0 z-20 flex flex-col justify-between p-3 sm:p-5 pointer-events-none overflow-y-auto">
        {/* Top right sound toggle & subtle resort signature */}
        <div className="flex items-start justify-between gap-4 shrink-0">
          <div className="text-xs sm:text-sm font-semibold text-[#fffdf5] hud-stroke tracking-wide">
            owrusalka.pl · Łazy nad Bałtykiem
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleMute();
            }}
            aria-label={muted ? 'Włącz dźwięk' : 'Wycisz dźwięk'}
            className="pointer-events-auto pixel-btn-secondary w-11 h-11 flex items-center justify-center cursor-pointer"
          >
            <SoundPixelIcon muted={muted} />
          </button>
        </div>

        {/* Upper-center focal title lockup over Baltic sea & calm beach horizon */}
        <div className="flex flex-col items-center text-center mx-auto w-full max-w-xl mt-0.5 sm:mt-1 mb-auto">
          <div className="w-full max-w-[400px] sm:max-w-[450px]">
            <TitleCrestSvg />
          </div>

          {/* Compact 16-bit Animator Character Selector */}
          <div
            className="mt-2.5 px-3.5 py-2.5 bg-[#0e293d]/92 border-[3px] border-[#132030] shadow-[0_4px_0_rgba(16,36,54,0.5)] w-full max-w-lg pointer-events-auto"
            aria-label="Wybór postaci animatora"
          >
            <div className="flex items-center justify-between gap-2 text-xs font-bold text-[#fef08a] mb-2">
              <span className="uppercase tracking-wider" style={{ fontFamily: 'var(--font-pixel)' }}>
                WYBIERZ ANIMATORA
              </span>
              <span className="text-[#bae6fd] font-semibold">
                Aktywny: <strong className="text-[#fffdf5]">{getSkinDef(progress.selectedSkin).name}</strong>
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1.5 sm:gap-2" role="group" aria-label="Skórki animatora">
              {ANIMATOR_SKINS.map((skin) => {
                const unlocked = isSkinUnlocked(
                  skin.id,
                  progress.unlockedAchievements,
                  progress.bestScore,
                );
                const selected = progress.selectedSkin === skin.id;
                return (
                  <button
                    key={skin.id}
                    type="button"
                    data-testid={`skin-option-${skin.id}`}
                    aria-pressed={selected}
                    aria-disabled={!unlocked}
                    aria-label={
                      unlocked
                        ? `${skin.name} — odblokowana`
                        : `${skin.name} — zablokowana: ${skin.unlockHint}`
                    }
                    onMouseEnter={() => setFocusedSkinId(skin.id)}
                    onFocus={() => setFocusedSkinId(skin.id)}
                    onClick={(e) => {
                      e.currentTarget.blur();
                      setFocusedSkinId(skin.id);
                      if (unlocked) {
                        onSelectSkin(skin.id);
                      }
                    }}
                    className={`relative flex flex-col items-center justify-center p-1.5 border-2 transition-transform cursor-pointer ${
                      selected
                        ? 'bg-[#17516e] border-[#f4d35e] shadow-[0_3px_0_#132030] -translate-y-0.5'
                        : unlocked
                          ? 'bg-[#12364d] border-[#366482] hover:border-[#6ce5f0]'
                          : 'bg-[#0b1f2e] border-[#263a52] opacity-85 hover:border-[#7a8ea3]'
                    }`}
                  >
                    <img
                      src={skinPreviews[skin.id]}
                      alt={skin.name}
                      className={`w-10 h-10 sm:w-11 sm:h-11 object-contain pixel-canvas select-none ${
                        unlocked ? '' : 'opacity-40'
                      }`}
                    />
                    {!unlocked && (
                      <span className="absolute top-1 right-1" aria-hidden="true">
                        <LockPixelIcon className="w-3.5 h-3.5" />
                      </span>
                    )}
                    <span
                      className={`mt-1 text-[10px] sm:text-[11px] font-bold leading-none truncate w-full text-center ${
                        selected ? 'text-[#f4d35e]' : unlocked ? 'text-[#fffdf5]' : 'text-[#94a3b8]'
                      }`}
                    >
                      {skin.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-2 pt-1.5 border-t border-[#4ac4dc]/25 text-xs leading-snug text-left space-y-0.5">
              <div className={inspectedUnlocked ? 'text-[#e0f2fe] font-semibold' : 'text-[#fef08a] font-bold'}>
                {inspectedUnlocked
                  ? `${inspectedSkin.name}: ${inspectedSkin.tagline}`
                  : `${inspectedSkin.name} (zablokowana) — ${inspectedSkin.unlockHint}`}
              </div>
              <div className="text-[11px] font-bold text-[#8ce08a]">
                {inspectedSkin.bonusLabel}
              </div>
            </div>
          </div>

          {/* Primary CTA + Gablota z Trofeami + Rekordy (3 menu actions on 1 clean desktop row) */}
          <div className="mt-3.5 flex flex-wrap sm:flex-nowrap items-center justify-center gap-2.5 pointer-events-auto">
            <button
              type="button"
              data-start="true"
              onClick={(e) => {
                e.currentTarget.blur();
                onStart();
              }}
              className="pixel-btn-primary px-7 sm:px-8 py-2.5 sm:py-3 text-xl sm:text-2xl font-bold tracking-widest uppercase cursor-pointer whitespace-nowrap"
              style={{ fontFamily: 'var(--font-pixel)' }}
            >
              ZAGRAJ
            </button>

            <button
              type="button"
              data-testid="open-trophy-cabinet"
              onClick={(e) => {
                e.currentTarget.blur();
                setShowRecords(false);
                setShowTrophies(true);
              }}
              className="pixel-btn-secondary px-3.5 py-2.5 sm:py-3 text-sm sm:text-base font-bold tracking-wider uppercase cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5"
              style={{ fontFamily: 'var(--font-pixel)' }}
            >
              <TrophyPixelIcon className="w-4 h-4 shrink-0" />
              <span>
                GABLOTA Z TROFEAMI ({unlockedCount}/{ACHIEVEMENTS.length})
              </span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                setShowRecords((prev) => !prev);
              }}
              className="pixel-btn-secondary px-3.5 py-2.5 sm:py-3 text-sm sm:text-base font-bold tracking-wider uppercase cursor-pointer whitespace-nowrap"
              style={{ fontFamily: 'var(--font-pixel)' }}
            >
              {showRecords ? 'ZAMKNIJ' : 'REKORDY'}
            </button>
          </div>

          {/* Unboxed best score readout */}
          {bestScore > 0 && !showRecords && (
            <div className="mt-2 text-sm font-bold text-[#fef08a] hud-stroke tabular-nums">
              Rekord plaży: {bestScore.toLocaleString('pl-PL')} pkt
            </div>
          )}

          {/* Top 5 Leaderboard drawer */}
          {showRecords && (
            <div className="mt-3 w-full max-w-md pixel-panel p-4 text-left pointer-events-auto">
              <div className="flex items-center justify-between border-b-2 border-[#16a3b8]/40 pb-2 mb-2">
                <h2
                  className="text-lg font-bold text-[#f4d35e] tracking-wide"
                  style={{ fontFamily: 'var(--font-pixel)' }}
                >
                  TABLICA REKORDÓW RUSAŁKI
                </h2>
                <span className="text-xs text-[#bae6fd]">Top 5</span>
              </div>
              {leaderboard.length === 0 ? (
                <p className="text-sm text-[#e0f2fe] py-2">
                  Brak zapisanych wyników. Zostań pierwszym legendarnym animatorem w Łazach!
                </p>
              ) : (
                <ol className="space-y-1.5 text-sm">
                  {leaderboard.map((entry, idx) => (
                    <li
                      key={`${entry.score}-${idx}`}
                      className="flex items-center justify-between gap-2 text-[#fffdf5]"
                    >
                      <span className="truncate">
                        <span className="font-bold text-[#f4d35e] tabular-nums mr-2">
                          {idx + 1}.
                        </span>
                        {entry.rankTitle}
                      </span>
                      <span className="font-bold text-[#fef08a] tabular-nums whitespace-nowrap">
                        {entry.score.toLocaleString('pl-PL')} pkt · Dzień {entry.day}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}
        </div>

        {/* Single flat borderless control hint line in bottom safe margin */}
        <div className="text-center text-xs sm:text-sm font-semibold text-[#fffdf5] hud-stroke tracking-wide shrink-0">
          WASD / Strzałki Ruch · Spacja Zryw z Siatką · P Pauza · Telefon: Przeciągnij i Zryw
        </div>
      </div>

      <TrophyCabinetModal
        open={showTrophies}
        progress={progress}
        onClose={() => setShowTrophies(false)}
      />
    </>
  );
}
