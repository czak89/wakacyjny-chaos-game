import React, { useEffect } from 'react';
import { ACHIEVEMENTS, getAchievementProgressValue, getSkinDef } from '../game/rules';
import type { AchievementIconKind, PlayerProgress } from '../game/types';
import {
  CheckPixelIcon,
  FlamingoPixelIcon,
  KidPinePixelIcon,
  LifeguardBuoyPixelIcon,
  LockPixelIcon,
  SeagullPixelIcon,
  TrophyPixelIcon,
  WafflePixelIcon,
} from './PixelIcons';

interface TrophyCabinetModalProps {
  open: boolean;
  progress: PlayerProgress;
  onClose: () => void;
}

function TrophyBadgeIcon({ kind, className }: { kind: AchievementIconKind; className?: string }) {
  switch (kind) {
    case 'flamingo':
      return <FlamingoPixelIcon className={className} />;
    case 'lifeguard':
      return <LifeguardBuoyPixelIcon className={className} />;
    case 'waffle':
      return <WafflePixelIcon className={className} />;
    case 'seagull':
      return <SeagullPixelIcon className={className} />;
    case 'kid':
      return <KidPinePixelIcon className={className} />;
    default:
      return <TrophyPixelIcon className={className} />;
  }
}

export function TrophyCabinetModal({ open, progress, onClose }: TrophyCabinetModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const unlockedCount = progress.unlockedAchievements.length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="trophy-cabinet-heading"
      data-testid="trophy-cabinet-screen"
      className="fixed inset-0 z-40 bg-[#091c2b]/92 flex items-center justify-center p-3 sm:p-6 overflow-y-auto pointer-events-auto"
    >
      {/* 16-bit Baltic Wooden Trophy Cabinet Frame */}
      <div className="w-full max-w-4xl bg-[#5c371b] border-4 border-[#132030] shadow-[0_8px_0_#132030] p-2 sm:p-3 my-auto">
        <div className="bg-[#0e2a3f] border-[3px] border-[#cfa06b] p-4 sm:p-5">
          {/* Cabinet Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-[3px] border-[#9c6638] pb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#163d58] border-[3px] border-[#f4d35e] flex items-center justify-center shadow-[0_3px_0_#132030]">
                <TrophyPixelIcon className="w-8 h-8" />
              </div>
              <div className="text-left">
                <div className="text-[11px] font-extrabold uppercase tracking-widest text-[#6ce5f0]">
                  O.W. RUSAŁKA · ŁAZY NAD BAŁTYKIEM
                </div>
                <h2
                  id="trophy-cabinet-heading"
                  className="text-2xl sm:text-3xl font-bold text-[#f4d35e] tracking-wider leading-none mt-0.5"
                  style={{ fontFamily: 'var(--font-pixel)' }}
                >
                  GABLOTA Z TROFEAMI
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#bae6fd]">
                  ZDOBYTE TROFEA
                </div>
                <div
                  className="text-xl sm:text-2xl font-bold text-[#fffdf5] tabular-nums leading-none"
                  style={{ fontFamily: 'var(--font-pixel)' }}
                >
                  {unlockedCount} / {ACHIEVEMENTS.length}
                </div>
              </div>
              <button
                type="button"
                data-testid="close-trophy-cabinet"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onClose();
                }}
                className="pixel-btn-primary px-4 py-2 text-sm sm:text-base font-bold uppercase tracking-wider cursor-pointer whitespace-nowrap"
                style={{ fontFamily: 'var(--font-pixel)' }}
              >
                POWRÓT
              </button>
            </div>
          </div>

          {/* Lifetime Baltic Career Summary Strip */}
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2 bg-[#091f30] border-2 border-[#264b66] p-2.5 text-center">
            <div>
              <div className="text-[10px] font-bold uppercase text-[#6ce5f0]">Rekord podejścia</div>
              <div className="text-base font-bold text-[#f4d35e] tabular-nums" style={{ fontFamily: 'var(--font-pixel)' }}>
                {progress.bestScore.toLocaleString('pl-PL')} pkt
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase text-[#6ce5f0]">Dmuchańce</div>
              <div className="text-base font-bold text-[#fffdf5] tabular-nums" style={{ fontFamily: 'var(--font-pixel)' }}>
                {progress.totalInflatables}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase text-[#6ce5f0]">Gofry</div>
              <div className="text-base font-bold text-[#fffdf5] tabular-nums" style={{ fontFamily: 'var(--font-pixel)' }}>
                {progress.totalWaffles}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase text-[#6ce5f0]">Uniki przed mewami</div>
              <div className="text-base font-bold text-[#fffdf5] tabular-nums" style={{ fontFamily: 'var(--font-pixel)' }}>
                {progress.totalSeagullsDodged}
              </div>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <div className="text-[10px] font-bold uppercase text-[#6ce5f0]">Dzieciaki z lasu</div>
              <div className="text-base font-bold text-[#fffdf5] tabular-nums" style={{ fontFamily: 'var(--font-pixel)' }}>
                {progress.totalKids}
              </div>
            </div>
          </div>

          {/* Wooden Display Shelves — Pixel-Art Trophy Grid */}
          <ul
            data-testid="trophy-shelf-grid"
            className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
          >
            {ACHIEVEMENTS.map((ach) => {
              const isDone = progress.unlockedAchievements.includes(ach.id);
              const rawCur = getAchievementProgressValue(ach, progress);
              const cur = Math.min(ach.target, rawCur);
              const ratio = Math.min(1, cur / ach.target);
              const rewardSkin = ach.rewardSkinId ? getSkinDef(ach.rewardSkinId) : null;

              return (
                <li
                  key={ach.id}
                  data-testid={`trophy-card-${ach.id}`}
                  data-unlocked={isDone ? 'true' : 'false'}
                  className={`relative flex flex-col justify-between border-[3px] p-3 text-left ${
                    isDone
                      ? 'bg-[#143d44] border-[#f4d35e] shadow-[0_4px_0_#132030]'
                      : 'bg-[#0a1d2d] border-[#263a52]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Trophy Pedestal Icon */}
                    <div className="flex flex-col items-center shrink-0">
                      <div
                        className={`relative w-14 h-14 flex items-center justify-center border-[3px] ${
                          isDone
                            ? 'bg-[#1f5663] border-[#f4d35e]'
                            : 'bg-[#0f2538] border-[#364d63]'
                        }`}
                      >
                        <div className={isDone ? '' : 'opacity-40'}>
                          <TrophyBadgeIcon kind={ach.iconKind} className="w-9 h-9" />
                        </div>
                        {!isDone && (
                          <span className="absolute -top-1.5 -right-1.5" aria-hidden="true">
                            <LockPixelIcon className="w-4 h-4" />
                          </span>
                        )}
                        {isDone && (
                          <span className="absolute -top-1.5 -right-1.5 bg-[#132030] p-0.5" aria-hidden="true">
                            <CheckPixelIcon className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                      {/* Wooden pedestal base under icon */}
                      <div
                        className={`w-16 h-2 border-x-2 border-b-2 border-[#132030] ${
                          isDone ? 'bg-[#cfa06b]' : 'bg-[#613a1c]'
                        }`}
                      />
                    </div>

                    {/* Trophy Title & Description */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h3
                          className={`text-sm sm:text-base font-bold leading-tight ${
                            isDone ? 'text-[#f4d35e]' : 'text-[#e2e8f0]'
                          }`}
                          style={{ fontFamily: 'var(--font-pixel)' }}
                        >
                          {ach.title}
                        </h3>
                      </div>
                      <p className="mt-1 text-xs text-[#cbd5e1] leading-snug">
                        {ach.description}
                      </p>
                    </div>
                  </div>

                  {/* Reward + Progress Footer */}
                  <div className="mt-2.5 pt-2 border-t border-[#4ac4dc]/20 space-y-1.5">
                    {rewardSkin && (
                      <div className="text-[11px] font-bold text-[#8ce08a] leading-tight">
                        Nagroda: postać {rewardSkin.name} ({rewardSkin.bonusLabel})
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2 text-[11px] font-bold">
                      <span className={isDone ? 'text-[#8ce08a]' : 'text-[#94a3b8]'}>
                        {isDone ? 'ZDOBYTE TROFEUM' : 'POSTĘP'}
                      </span>
                      <span className="text-[#fef08a] tabular-nums">
                        {cur.toLocaleString('pl-PL')} / {ach.target.toLocaleString('pl-PL')}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-[#132030] border border-[#263a52] overflow-hidden">
                      <div
                        className={`h-full origin-left ${isDone ? 'bg-[#52b788]' : 'bg-[#f4d35e]'}`}
                        style={{ transform: `scaleX(${ratio})` }}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
