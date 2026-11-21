import React from 'react';

export function TitleCrestSvg() {
  return (
    <svg
      viewBox="0 0 540 164"
      className="w-full max-w-[520px] h-auto select-none drop-shadow-[0_6px_0_rgba(16,36,54,0.6)]"
      role="img"
      aria-label="Rusałka: Wakacyjny Chaos"
    >
      {/* Sunburst behind crest */}
      <g fill="#f4d35e">
        <rect x="252" y="4" width="36" height="8" />
        <rect x="236" y="12" width="68" height="10" />
        <rect x="220" y="22" width="100" height="12" />
        <rect x="196" y="10" width="12" height="8" />
        <rect x="332" y="10" width="12" height="8" />
        <rect x="172" y="26" width="14" height="8" />
        <rect x="354" y="26" width="14" height="8" />
      </g>

      {/* Outer Maritime Ink Frame */}
      <rect x="14" y="30" width="512" height="114" fill="#162638" />
      {/* Warm Baltic Wooden Plaque */}
      <rect x="20" y="36" width="500" height="102" fill="#0d7ea3" />
      {/* Top highlight bevel */}
      <rect x="20" y="36" width="500" height="8" fill="#4ac4dc" />
      {/* Bottom sea shadow */}
      <rect x="20" y="128" width="500" height="10" fill="#09526b" />

      {/* Pixel Baltic waves inside bottom of plaque */}
      <g fill="#16a3b8">
        <rect x="24" y="114" width="40" height="10" />
        <rect x="84" y="118" width="44" height="10" />
        <rect x="148" y="114" width="48" height="10" />
        <rect x="216" y="118" width="46" height="10" />
        <rect x="282" y="114" width="48" height="10" />
        <rect x="350" y="118" width="44" height="10" />
        <rect x="414" y="114" width="48" height="10" />
        <rect x="480" y="118" width="36" height="10" />
      </g>

      {/* Corner Pine & Flamingo Accent Studs */}
      <rect x="28" y="44" width="10" height="10" fill="#f4d35e" stroke="#162638" strokeWidth="2" />
      <rect x="502" y="44" width="10" height="10" fill="#f4d35e" stroke="#162638" strokeWidth="2" />
      <rect x="28" y="120" width="10" height="10" fill="#f4d35e" stroke="#162638" strokeWidth="2" />
      <rect x="502" y="120" width="10" height="10" fill="#f4d35e" stroke="#162638" strokeWidth="2" />

      {/* Main Title: RUSAŁKA */}
      <text
        x="270"
        y="90"
        textAnchor="middle"
        fill="#f4d35e"
        stroke="#162638"
        strokeWidth="9"
        paintOrder="stroke fill"
        style={{
          fontFamily: '"Pixelify Sans", monospace',
          fontWeight: 700,
          fontSize: '54px',
          letterSpacing: '3px',
        }}
      >
        RUSAŁKA
      </text>

      {/* Ribbon Banner for Subtitle: WAKACYJNY CHAOS */}
      <rect x="92" y="106" width="356" height="44" fill="#162638" />
      <rect x="96" y="110" width="348" height="36" fill="#f25f5c" />
      <rect x="96" y="110" width="348" height="5" fill="#ff948d" />
      <rect x="96" y="141" width="348" height="5" fill="#b83232" />

      <text
        x="270"
        y="136"
        textAnchor="middle"
        fill="#fffdf5"
        stroke="#162638"
        strokeWidth="5"
        paintOrder="stroke fill"
        style={{
          fontFamily: '"Pixelify Sans", monospace',
          fontWeight: 700,
          fontSize: '25px',
          letterSpacing: '2px',
        }}
      >
        WAKACYJNY CHAOS
      </text>
    </svg>
  );
}

export function HeartPixelIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7 shrink-0" aria-hidden="true">
      <path
        d="M4 6h4V4h4v2h4V4h4v2h2v6h-2v2h-2v2h-2v2h-2v2h-4v-2H8v-2H6v-2H4v-2H2V6h2z"
        fill="#162638"
      />
      {filled ? (
        <>
          <path
            d="M4 8h2V6h4v2h4V6h4v2h2v4h-2v2h-2v2h-2v2h-4v-2H8v-2H6v-2H4V8z"
            fill="#f25f5c"
          />
          <rect x="6" y="8" width="3" height="2" fill="#ff948d" />
        </>
      ) : (
        <path
          d="M4 8h2V6h4v2h4V6h4v2h2v4h-2v2h-2v2h-2v2h-4v-2H8v-2H6v-2H4V8z"
          fill="#264056"
        />
      )}
    </svg>
  );
}

export function FlamingoPixelIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="11" y="3" width="6" height="4" fill="#162638" />
      <rect x="12" y="4" width="4" height="3" fill="#ff6eb4" />
      <rect x="9" y="5" width="3" height="3" fill="#f4d35e" />
      <rect x="13" y="7" width="3" height="6" fill="#ff6eb4" />
      <rect x="4" y="12" width="14" height="8" fill="#162638" />
      <rect x="5" y="13" width="12" height="6" fill="#ff6eb4" />
      <rect x="7" y="14" width="4" height="2" fill="#fffdf7" />
    </svg>
  );
}

export function WafflePixelIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="4" y="9" width="16" height="12" fill="#162638" />
      <rect x="5" y="10" width="14" height="10" fill="#d4a32c" />
      <rect x="7" y="12" width="3" height="2" fill="#8d5b32" />
      <rect x="12" y="12" width="3" height="2" fill="#8d5b32" />
      <rect x="7" y="16" width="3" height="2" fill="#8d5b32" />
      <rect x="12" y="16" width="3" height="2" fill="#8d5b32" />
      <rect x="7" y="5" width="10" height="5" fill="#fffdf7" />
      <rect x="10" y="3" width="4" height="3" fill="#f25f5c" />
    </svg>
  );
}

export function KidPinePixelIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="5" y="4" width="14" height="5" fill="#f25f5c" />
      <rect x="6" y="9" width="12" height="7" fill="#ffd2a6" />
      <rect x="8" y="11" width="2" height="2" fill="#162638" />
      <rect x="14" y="11" width="2" height="2" fill="#162638" />
      <rect x="6" y="16" width="12" height="5" fill="#52b788" />
    </svg>
  );
}

export function SoundPixelIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
      <path d="M4 9h4l5-4v14l-5-4H4V9z" fill="#fffdf5" stroke="#162638" strokeWidth="1.5" />
      {muted ? (
        <path d="M16 9l5 6M21 9l-5 6" stroke="#f25f5c" strokeWidth="2.5" strokeLinecap="square" />
      ) : (
        <>
          <path d="M16 9c1.5 1.5 1.5 4.5 0 6" stroke="#f4d35e" strokeWidth="2.2" fill="none" />
          <path d="M19 6.5c2.8 2.8 2.8 8.2 0 11" stroke="#f4d35e" strokeWidth="2.2" fill="none" />
        </>
      )}
    </svg>
  );
}

export function PausePixelIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
      <rect x="5" y="4" width="5" height="16" fill="#fffdf5" stroke="#162638" strokeWidth="1.5" />
      <rect x="14" y="4" width="5" height="16" fill="#fffdf5" stroke="#162638" strokeWidth="1.5" />
    </svg>
  );
}

export function DashNetPixelIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M4 19l7-7" stroke="#f4d35e" strokeWidth="3" strokeLinecap="square" />
      <rect x="10" y="4" width="10" height="10" fill="#fffdf5" stroke="#162638" strokeWidth="2" />
      <path d="M10 9h10M15 4v10" stroke="#16a3b8" strokeWidth="1.5" />
    </svg>
  );
}

export function WeatherPixelIcon({
  kind,
  className = 'w-5 h-5',
}: {
  kind: 'sunny' | 'fog' | 'rain' | 'sunset';
  className?: string;
}) {
  if (kind === 'sunny') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <rect x="10" y="1" width="4" height="3" fill="#fff8b8" />
        <rect x="10" y="20" width="4" height="3" fill="#f7d459" />
        <rect x="1" y="10" width="3" height="4" fill="#f7d459" />
        <rect x="20" y="10" width="3" height="4" fill="#f7d459" />
        <rect x="4" y="4" width="3" height="3" fill="#f7d459" />
        <rect x="17" y="4" width="3" height="3" fill="#f7d459" />
        <rect x="4" y="17" width="3" height="3" fill="#d99b26" />
        <rect x="17" y="17" width="3" height="3" fill="#d99b26" />
        <rect x="6" y="6" width="12" height="12" fill="#132030" />
        <rect x="7" y="7" width="10" height="10" fill="#f7d459" />
        <rect x="8" y="8" width="5" height="4" fill="#fff8b8" />
        <rect x="13" y="13" width="4" height="4" fill="#d99b26" />
      </svg>
    );
  }
  if (kind === 'fog') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <rect x="4" y="5" width="14" height="5" fill="#132030" />
        <rect x="5" y="6" width="12" height="3" fill="#e8eff5" />
        <rect x="2" y="11" width="18" height="5" fill="#132030" />
        <rect x="3" y="12" width="16" height="3" fill="#cbd5e1" />
        <rect x="6" y="17" width="14" height="5" fill="#132030" />
        <rect x="7" y="18" width="12" height="3" fill="#94a3b8" />
      </svg>
    );
  }
  if (kind === 'rain') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <rect x="4" y="4" width="16" height="9" fill="#132030" />
        <rect x="6" y="3" width="10" height="3" fill="#132030" />
        <rect x="5" y="5" width="14" height="7" fill="#7a8ea3" />
        <rect x="7" y="4" width="8" height="3" fill="#cbd5e1" />
        <rect x="6" y="15" width="2" height="5" fill="#6ce5f0" />
        <rect x="11" y="16" width="2" height="5" fill="#6ce5f0" />
        <rect x="16" y="15" width="2" height="5" fill="#6ce5f0" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="5" y="5" width="14" height="9" fill="#132030" />
      <rect x="6" y="6" width="12" height="7" fill="#fb923c" />
      <rect x="8" y="7" width="8" height="3" fill="#fff8b8" />
      <rect x="2" y="13" width="20" height="4" fill="#132030" />
      <rect x="3" y="14" width="18" height="2" fill="#8a4c70" />
      <rect x="4" y="18" width="16" height="3" fill="#3b376e" />
      <rect x="8" y="18" width="8" height="2" fill="#ffad70" />
    </svg>
  );
}

export function TrophyPixelIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="5" y="3" width="14" height="10" fill="#132030" />
      <rect x="2" y="5" width="4" height="6" fill="#132030" />
      <rect x="18" y="5" width="4" height="6" fill="#132030" />
      <rect x="3" y="6" width="2" height="4" fill="#d99b26" />
      <rect x="19" y="6" width="2" height="4" fill="#d99b26" />
      <rect x="6" y="4" width="12" height="8" fill="#f7d459" />
      <rect x="7" y="5" width="4" height="5" fill="#fff8b8" />
      <rect x="14" y="5" width="3" height="6" fill="#d99b26" />
      <rect x="9" y="13" width="6" height="4" fill="#132030" />
      <rect x="10" y="13" width="4" height="4" fill="#d99b26" />
      <rect x="6" y="17" width="12" height="4" fill="#132030" />
      <rect x="7" y="18" width="10" height="2" fill="#9c6638" />
    </svg>
  );
}

export function LockPixelIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="7" y="3" width="10" height="8" fill="#132030" />
      <rect x="9" y="5" width="6" height="6" fill="#cbd5e1" />
      <rect x="10" y="7" width="4" height="4" fill="#132030" />
      <rect x="4" y="10" width="16" height="11" fill="#132030" />
      <rect x="5" y="11" width="14" height="9" fill="#f7d459" />
      <rect x="6" y="12" width="12" height="2" fill="#fff8b8" />
      <rect x="11" y="14" width="2" height="4" fill="#132030" />
    </svg>
  );
}

export function SeagullPixelIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="2" y="6" width="7" height="4" fill="#132030" />
      <rect x="15" y="6" width="7" height="4" fill="#132030" />
      <rect x="3" y="7" width="6" height="2" fill="#cbd5e1" />
      <rect x="15" y="7" width="6" height="2" fill="#cbd5e1" />
      <rect x="7" y="8" width="10" height="8" fill="#132030" />
      <rect x="8" y="9" width="8" height="6" fill="#fffef9" />
      <rect x="10" y="10" width="2" height="2" fill="#dc2626" />
      <rect x="14" y="11" width="5" height="3" fill="#fb923c" />
    </svg>
  );
}

export function CheckPixelIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M4 12h3v3h3v-3h3V9h3V6h4v4h-3v3h-3v3h-3v3H7v-3H4v-4z"
        fill="#52b788"
        stroke="#132030"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function LifeguardBuoyPixelIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      {/* Outer dark ink ring */}
      <path
        d="M7 2h10v2h3v3h2v10h-2v3h-3v2H7v-2H4v-3H2V7h2V4h3V2z"
        fill="#132030"
      />
      {/* White buoy base */}
      <path
        d="M8 4h8v2h2v2h2v8h-2v2h-2v2H8v-2H6v-2H4V8h2V6h2V4z"
        fill="#fffef9"
      />
      {/* Red rescue bands */}
      <rect x="9" y="4" width="6" height="4" fill="#f25757" />
      <rect x="9" y="16" width="6" height="4" fill="#f25757" />
      <rect x="4" y="9" width="4" height="6" fill="#f25757" />
      <rect x="16" y="9" width="4" height="6" fill="#f25757" />
      {/* Inner hole */}
      <rect x="8" y="8" width="8" height="8" fill="#132030" />
      <rect x="9" y="9" width="6" height="6" fill="#18a8bd" />
      <rect x="10" y="10" width="2" height="2" fill="#6ce5f0" />
    </svg>
  );
}

export function WeatherEventPixelIcon({
  kind,
  className = 'w-6 h-6',
}: {
  kind: 'thunderstorm' | 'strong_wind' | 'sea_breeze';
  className?: string;
}) {
  if (kind === 'thunderstorm') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        {/* Storm cloud */}
        <rect x="3" y="3" width="18" height="9" fill="#132030" />
        <rect x="6" y="1" width="11" height="4" fill="#132030" />
        <rect x="4" y="4" width="16" height="7" fill="#334155" />
        <rect x="7" y="2" width="9" height="4" fill="#64748b" />
        <rect x="5" y="9" width="14" height="2" fill="#1e293b" />
        {/* 16-bit jagged lightning bolt */}
        <path
          d="M11 10h6l-3 5h4l-7 8 1-6H8l3-7z"
          fill="#132030"
          stroke="#132030"
          strokeWidth="1.5"
        />
        <path d="M11.5 11h4l-2.5 4.5h3.5l-5.5 6.2 0.8-4.7H9l2.5-6z" fill="#f7d459" />
        <rect x="11" y="12" width="2" height="3" fill="#fff8b8" />
      </svg>
    );
  }
  if (kind === 'strong_wind') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        {/* Bold 16-bit gale wind swirls */}
        <rect x="2" y="5" width="15" height="4" fill="#132030" />
        <rect x="15" y="2" width="5" height="5" fill="#132030" />
        <rect x="3" y="6" width="13" height="2" fill="#e0f2fe" />
        <rect x="16" y="3" width="3" height="3" fill="#6ce5f0" />

        <rect x="1" y="11" width="20" height="4" fill="#132030" />
        <rect x="2" y="12" width="18" height="2" fill="#fffef9" />
        <rect x="18" y="10" width="4" height="3" fill="#f7d459" />

        <rect x="4" y="17" width="14" height="4" fill="#132030" />
        <rect x="16" y="18" width="5" height="4" fill="#132030" />
        <rect x="5" y="18" width="12" height="2" fill="#6ce5f0" />
        <rect x="17" y="19" width="3" height="2" fill="#e0f2fe" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      {/* Crisp Baltic sea breeze wave & sparkle */}
      <rect x="2" y="8" width="18" height="4" fill="#132030" />
      <rect x="3" y="9" width="16" height="2" fill="#6ce5f0" />
      <rect x="5" y="14" width="16" height="4" fill="#132030" />
      <rect x="6" y="15" width="14" height="2" fill="#8ce08a" />
      <rect x="15" y="3" width="4" height="4" fill="#132030" />
      <rect x="16" y="4" width="2" height="2" fill="#fff8b8" />
    </svg>
  );
}



