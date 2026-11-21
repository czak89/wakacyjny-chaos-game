import React from 'react';
import type { AchievementIconKind, AchievementToast } from '../game/types';
import {
  FlamingoPixelIcon,
  KidPinePixelIcon,
  LifeguardBuoyPixelIcon,
  SeagullPixelIcon,
  TrophyPixelIcon,
  WafflePixelIcon,
} from './PixelIcons';

function AchievementIcon({ kind, className }: { kind: AchievementIconKind; className?: string }) {
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

interface AchievementToastBannerProps {
  toast: AchievementToast | null;
}

export function AchievementToastBanner({ toast }: AchievementToastBannerProps) {
  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="achievement-toast"
      className="fixed top-16 sm:top-20 right-3 sm:right-5 z-30 pointer-events-none max-w-[92vw] sm:max-w-sm"
    >
      <div className="bg-[#0e2a3f]/95 border-[3px] border-[#f4d35e] shadow-[0_5px_0_#132030] px-3.5 py-2.5 flex items-start gap-3">
        <div className="w-10 h-10 shrink-0 bg-[#163d58] border-2 border-[#f4d35e] flex items-center justify-center">
          <AchievementIcon kind={toast.iconKind} className="w-7 h-7" />
        </div>
        <div className="min-w-0 flex-1 text-left">
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#f4d35e] leading-none">
            OSIĄGNIĘCIE ODBLOKOWANE!
          </div>
          <div
            className="mt-1 text-base sm:text-lg font-bold text-[#fffdf5] leading-tight"
            style={{ fontFamily: 'var(--font-pixel)' }}
          >
            {toast.title}
          </div>
          <div className="mt-0.5 text-xs font-semibold text-[#bae6fd] leading-snug">
            {toast.description}
          </div>
          {toast.rewardSkinName && (
            <div className="mt-1 text-xs font-extrabold text-[#8ce08a] leading-tight">
              + Nowa skórka animatora: {toast.rewardSkinName}!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
