import React from 'react';
import type { GamePhase, HighScoreEntry, RunStats } from '../game/types';
import { FlamingoPixelIcon, KidPinePixelIcon, WafflePixelIcon } from './PixelIcons';

interface StatusModalProps {
  phase: GamePhase;
  stats: RunStats | null;
  leaderboard: HighScoreEntry[];
  onResume: () => void;
  onRestart: () => void;
  onReturnTitle: () => void;
}

export function StatusModal({
  phase,
  stats,
  leaderboard,
  onResume,
  onRestart,
  onReturnTitle,
}: StatusModalProps) {
  if (phase !== 'paused' && phase !== 'gameover') return null;

  if (phase === 'paused') {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pause-heading"
        className="fixed inset-0 z-30 bg-[#0b2234]/70 flex items-center justify-center p-4"
      >
        <div className="pixel-panel w-full max-w-sm p-6 text-center">
          <h2
            id="pause-heading"
            className="text-3xl font-bold text-[#f4d35e] tracking-wider"
            style={{ fontFamily: 'var(--font-pixel)' }}
          >
            PRZERWA NA GOFRA
          </h2>
          <p className="mt-2 text-sm text-[#e0f2fe]">
            Mewy czekają w zawieszeniu, a dmuchańce grzecznie stoją na piasku.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={onResume}
              className="pixel-btn-primary w-full py-3 text-lg font-bold uppercase tracking-wider cursor-pointer"
              style={{ fontFamily: 'var(--font-pixel)' }}
            >
              WZNÓW GRĘ
            </button>
            <button
              type="button"
              onClick={onRestart}
              className="pixel-btn-secondary w-full py-2.5 text-base font-bold uppercase tracking-wider cursor-pointer"
              style={{ fontFamily: 'var(--font-pixel)' }}
            >
              ZACZNIJ OD NOWA
            </button>
            <button
              type="button"
              onClick={onReturnTitle}
              className="w-full py-2 text-sm font-bold text-[#bae6fd] hover:text-[#fffdf5] cursor-pointer"
            >
              Powrót do menu głównego
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gameover-heading"
      className="fixed inset-0 z-30 bg-[#0b2234]/75 flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="pixel-panel-sand w-full max-w-md p-5 sm:p-6 text-center">
        <div className="text-xs font-extrabold uppercase tracking-widest text-[#0d7ea3]">
          POCZTÓWKA Z OW RUSAŁKA · ŁAZY
        </div>

        <h2
          id="gameover-heading"
          className="mt-1 text-3xl sm:text-4xl font-bold text-[#162638] leading-tight"
          style={{ fontFamily: 'var(--font-pixel)' }}
        >
          KONIEC TURNUSU!
        </h2>

        {stats && (
          <>
            <div className="mt-2 text-sm font-bold text-[#2d6a4f]">
              Ranga: {stats.rankTitle}
              {stats.isNewRecord && (
                <span className="ml-2 text-[#f25f5c] font-extrabold">· NOWY REKORD!</span>
              )}
            </div>

            {/* Hero Score Display */}
            <div className="mt-3 py-3 border-y-2 border-[#162638]/20">
              <div className="text-xs font-bold uppercase tracking-wider text-[#162638]/70">
                KOŃCOWY WYNIK
              </div>
              <div
                data-testid="final-score"
                className="text-4xl sm:text-5xl font-bold text-[#f25f5c] tabular-nums leading-none mt-1"
                style={{ fontFamily: 'var(--font-pixel)' }}
              >
                {stats.score.toLocaleString('pl-PL')}
              </div>
              <div className="mt-1.5 text-xs font-bold text-[#162638]/80 tabular-nums">
                Rekord: {stats.bestScore.toLocaleString('pl-PL')} pkt · Dzień {stats.day} · Maks. kombo ×{stats.maxCombo}
              </div>
            </div>

            {/* 3 Breakdown Stat Tiles */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="bg-[#fffaf0] border-2 border-[#162638] p-2.5 flex flex-col items-center">
                <FlamingoPixelIcon className="w-5 h-5" />
                <div className="mt-1 text-xl font-bold tabular-nums text-[#162638]" style={{ fontFamily: 'var(--font-pixel)' }}>
                  {stats.inflatablesCaught}
                </div>
                <div className="text-[11px] font-bold text-[#162638]/70">Dmuchańce</div>
              </div>
              <div className="bg-[#fffaf0] border-2 border-[#162638] p-2.5 flex flex-col items-center">
                <WafflePixelIcon className="w-5 h-5" />
                <div className="mt-1 text-xl font-bold tabular-nums text-[#162638]" style={{ fontFamily: 'var(--font-pixel)' }}>
                  {stats.wafflesCollected}
                </div>
                <div className="text-[11px] font-bold text-[#162638]/70">Gofry</div>
              </div>
              <div className="bg-[#fffaf0] border-2 border-[#162638] p-2.5 flex flex-col items-center">
                <KidPinePixelIcon className="w-5 h-5" />
                <div className="mt-1 text-xl font-bold tabular-nums text-[#162638]" style={{ fontFamily: 'var(--font-pixel)' }}>
                  {stats.kidsFound}
                </div>
                <div className="text-[11px] font-bold text-[#162638]/70">Dzieciaki</div>
              </div>
            </div>

            <p className="mt-3 text-xs sm:text-sm font-semibold text-[#162638]/85 italic leading-snug">
              „{stats.postcardNote}”
            </p>
          </>
        )}

        {/* Compact Top 3 Records */}
        {leaderboard.length > 0 && (
          <div className="mt-3 pt-2.5 border-t-2 border-[#162638]/15 text-left">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#0d7ea3] mb-1">
              Najlepsi animatorzy
            </div>
            <div className="space-y-1 text-xs font-bold text-[#162638]">
              {leaderboard.slice(0, 3).map((entry, idx) => (
                <div key={`${entry.score}-${idx}`} className="flex justify-between gap-2">
                  <span className="truncate">
                    {idx + 1}. {entry.rankTitle}
                  </span>
                  <span className="tabular-nums whitespace-nowrap">
                    {entry.score.toLocaleString('pl-PL')} pkt
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            data-start="true"
            onClick={onRestart}
            className="pixel-btn-primary flex-1 py-3 text-lg font-bold uppercase tracking-wider cursor-pointer whitespace-nowrap"
            style={{ fontFamily: 'var(--font-pixel)' }}
          >
            ZAGRAJ PONOWNIE
          </button>
          <button
            type="button"
            onClick={onReturnTitle}
            className="pixel-btn-secondary px-5 py-3 text-base font-bold uppercase tracking-wider cursor-pointer whitespace-nowrap"
            style={{ fontFamily: 'var(--font-pixel)' }}
          >
            MENU
          </button>
        </div>
      </div>
    </div>
  );
}
