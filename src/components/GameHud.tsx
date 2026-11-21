import React from 'react';
import type { HudSnapshot } from '../game/types';
import {
  FlamingoPixelIcon,
  HeartPixelIcon,
  KidPinePixelIcon,
  PausePixelIcon,
  SoundPixelIcon,
  WafflePixelIcon,
  WeatherEventPixelIcon,
  WeatherPixelIcon,
} from './PixelIcons';

interface GameHudProps {
  hud: HudSnapshot;
  muted: boolean;
  onTogglePause: () => void;
  onToggleMute: () => void;
}

export function GameHud({ hud, muted, onTogglePause, onToggleMute }: GameHudProps) {
  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-3 sm:p-4">
      {/* Top Perimeter Cluster */}
      <div className="flex items-start justify-between gap-2">
        {/* Top-Left: Hearts + Day + Live Weather + Combo */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1" aria-label={`Zdrowie: ${hud.hp} z ${hud.maxHp}`}>
            {Array.from({ length: hud.maxHp }).map((_, idx) => (
              <HeartPixelIcon key={idx} filled={idx < hud.hp} />
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs sm:text-sm font-bold text-[#fffdf5] hud-stroke">
            <span className="tabular-nums">DZIEŃ {hud.day}</span>
            <span aria-hidden="true">·</span>
            <span
              data-testid="hud-weather"
              className="inline-flex items-center gap-1.5 text-[#fef08a] whitespace-nowrap"
            >
              <WeatherPixelIcon kind={hud.weather} className="w-4 h-4 shrink-0" />
              <span>{hud.weatherLabel}</span>
              <span className="hidden sm:inline text-[#e0f2fe] font-semibold">
                ({hud.weatherEffectHint})
              </span>
            </span>
            {hud.combo > 1 && (
              <span className="text-[#ffad70] tabular-nums">
                KOMBO ×{hud.combo}
              </span>
            )}
            {hud.sugarRushRemaining > 0 && (
              <span className="text-[#f4d35e] tabular-nums">
                SZAŁ {Math.ceil(hud.sugarRushRemaining)}s
              </span>
            )}
          </div>

          {hud.combo > 1 && (
            <div className="w-28 h-2 bg-[#162638] border border-[#162638] overflow-hidden">
              <div
                className="h-full bg-[#f4d35e] transition-transform duration-75 origin-left"
                style={{ transform: `scaleX(${hud.comboTimerRatio})` }}
              />
            </div>
          )}
        </div>

        {/* Top-Center: Active Dynamic Weather Event OR Chaos Event Banner */}
        {hud.activeWeatherEvent ? (
          <div
            role="status"
            data-testid="hud-weather-event"
            className="hidden sm:flex items-center gap-3 pixel-panel px-4 py-2 max-w-lg text-left"
            style={{
              borderColor:
                hud.activeWeatherEvent.kind === 'thunderstorm'
                  ? '#6ce5f0'
                  : hud.activeWeatherEvent.kind === 'strong_wind'
                    ? '#f7d459'
                    : '#52b788',
            }}
          >
            <div className="shrink-0 w-9 h-9 bg-[#0a1c2b] border-2 border-[#132030] flex items-center justify-center">
              <WeatherEventPixelIcon kind={hud.activeWeatherEvent.kind} className="w-7 h-7" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <div
                  className="text-sm sm:text-base font-bold tracking-wide whitespace-nowrap"
                  style={{
                    fontFamily: 'var(--font-pixel)',
                    color:
                      hud.activeWeatherEvent.kind === 'thunderstorm'
                        ? '#6ce5f0'
                        : hud.activeWeatherEvent.kind === 'strong_wind'
                          ? '#f7d459'
                          : '#8ce08a',
                  }}
                >
                  {hud.activeWeatherEvent.title}
                </div>
                <span className="text-[11px] font-bold text-[#bae6fd] tabular-nums whitespace-nowrap">
                  {Math.ceil(hud.activeWeatherEvent.remaining)}s
                </span>
              </div>
              <div className="text-xs font-semibold text-[#fffdf5] leading-tight">
                {hud.activeWeatherEvent.subtitle}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#fef08a] mt-0.5">
                {hud.activeWeatherEvent.effectBadge}
              </div>
              <div className="mt-1 w-full h-1.5 bg-[#0a1c2b] overflow-hidden">
                <div
                  className="h-full origin-left"
                  style={{
                    backgroundColor:
                      hud.activeWeatherEvent.kind === 'thunderstorm'
                        ? '#6ce5f0'
                        : hud.activeWeatherEvent.kind === 'strong_wind'
                          ? '#f7d459'
                          : '#52b788',
                    transform: `scaleX(${Math.max(
                      0,
                      hud.activeWeatherEvent.remaining / hud.activeWeatherEvent.duration,
                    )})`,
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          hud.activeEvent && (
            <div
              role="status"
              className="hidden sm:flex flex-col items-center pixel-panel px-4 py-1.5 max-w-md text-center"
            >
              <div
                className="text-sm sm:text-base font-bold text-[#f4d35e] tracking-wide whitespace-nowrap"
                style={{ fontFamily: 'var(--font-pixel)' }}
              >
                {hud.activeEvent.title}
              </div>
              <div className="text-xs font-semibold text-[#fffdf5] leading-tight">
                {hud.activeEvent.subtitle}
              </div>
              <div className="mt-1 w-full h-1.5 bg-[#0a1c2b] overflow-hidden">
                <div
                  className="h-full bg-[#f25f5c] origin-left"
                  style={{
                    transform: `scaleX(${Math.max(0, hud.activeEvent.remaining / hud.activeEvent.duration)})`,
                  }}
                />
              </div>
            </div>
          )
        )}

        {/* Top-Right: Hero Score + Utility Square Controls */}
        <div className="flex items-start gap-2.5 sm:gap-3">
          <div className="text-right">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#bae6fd] hud-stroke">
              WYNIK
            </div>
            <div
              data-testid="hud-score"
              className="text-2xl sm:text-4xl font-bold leading-none text-[#fffdf5] hud-stroke tabular-nums"
              style={{ fontFamily: 'var(--font-pixel)' }}
            >
              {Math.round(hud.score).toLocaleString('pl-PL')}
            </div>
            <div className="text-[11px] font-semibold text-[#fef08a] hud-stroke tabular-nums mt-0.5">
              REKORD {Math.round(hud.bestScore).toLocaleString('pl-PL')}
            </div>
          </div>

          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleMute();
              }}
              aria-label={muted ? 'Włącz dźwięk' : 'Wycisz dźwięk'}
              className="pixel-btn-secondary w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center cursor-pointer"
            >
              <SoundPixelIcon muted={muted} />
            </button>
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onTogglePause();
              }}
              aria-label="Pauza"
              className="pixel-btn-secondary w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center cursor-pointer"
            >
              <PausePixelIcon />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile compact Weather / Chaos Event strip tucked right below top HUD */}
      {hud.activeWeatherEvent ? (
        <div
          data-testid="hud-weather-event-mobile"
          className="sm:hidden mx-auto mt-1 pixel-panel px-3 py-1.5 flex items-center gap-2 max-w-[94vw]"
        >
          <WeatherEventPixelIcon kind={hud.activeWeatherEvent.kind} className="w-5 h-5 shrink-0" />
          <div className="min-w-0">
            <div
              className="text-xs font-bold text-[#6ce5f0] tracking-wide leading-tight"
              style={{ fontFamily: 'var(--font-pixel)' }}
            >
              {hud.activeWeatherEvent.title} ({Math.ceil(hud.activeWeatherEvent.remaining)}s)
            </div>
            <div className="text-[11px] font-medium text-[#fffdf5] leading-tight">
              {hud.activeWeatherEvent.effectBadge}
            </div>
          </div>
        </div>
      ) : (
        hud.activeEvent && (
          <div className="sm:hidden mx-auto mt-1 pixel-panel px-3 py-1 text-center max-w-[92vw]">
            <div
              className="text-xs font-bold text-[#f4d35e] tracking-wide"
              style={{ fontFamily: 'var(--font-pixel)' }}
            >
              {hud.activeEvent.title}
            </div>
            <div className="text-[11px] font-medium text-[#fffdf5] leading-tight">
              {hud.activeEvent.subtitle}
            </div>
          </div>
        )
      )}

      {/* Bottom Perimeter Tally (Desktop & Tablet — stays completely out of central playfield) */}
      <div className="hidden sm:flex items-end justify-between">
        <div className="flex items-center gap-4 text-sm font-bold text-[#fffdf5] hud-stroke tabular-nums">
          <span className="inline-flex items-center gap-1.5" title="Złapane dmuchańce">
            <FlamingoPixelIcon className="w-5 h-5" />
            {hud.inflatablesCaught}
          </span>
          <span className="inline-flex items-center gap-1.5" title="Zebrane gofry">
            <WafflePixelIcon className="w-5 h-5" />
            {hud.wafflesCollected}
          </span>
          <span className="inline-flex items-center gap-1.5" title="Odnalezione dzieciaki">
            <KidPinePixelIcon className="w-5 h-5" />
            {hud.kidsFound}
          </span>
        </div>

        <div className="text-xs font-bold text-[#fffdf5] hud-stroke">
          {hud.dashReadyRatio >= 0.99 ? 'ZRYW GOTOWY [SPACJA]' : 'ŁADOWANIE ZRYWU...'}
        </div>
      </div>
    </div>
  );
}
