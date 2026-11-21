import React, { useRef, useState } from 'react';
import { DashNetPixelIcon } from './PixelIcons';

interface MobileControlsProps {
  dashReadyRatio: number;
  onMove: (dx: number, dy: number, active: boolean) => void;
  onDash: () => void;
}

export function MobileControls({ dashReadyRatio, onMove, onDash }: MobileControlsProps) {
  const padRef = useRef<HTMLDivElement | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const [knob, setKnob] = useState<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });

  const maxRadius = 42;

  const updateVector = (clientX: number, clientY: number) => {
    const el = padRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    const clamped = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);
    const kx = dist > 2 ? Math.cos(angle) * clamped : 0;
    const ky = dist > 2 ? Math.sin(angle) * clamped : 0;

    setKnob({ x: kx, y: ky, active: true });
    onMove(kx / maxRadius, ky / maxRadius, true);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== null) return;
    pointerIdRef.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    updateVector(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== e.pointerId) return;
    updateVector(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== e.pointerId) return;
    pointerIdRef.current = null;
    setKnob({ x: 0, y: 0, active: false });
    onMove(0, 0, false);
  };

  const dashReady = dashReadyRatio >= 0.99;

  return (
    <div className="fixed inset-x-0 bottom-0 z-15 pointer-events-none flex sm:hidden items-end justify-between px-5 pb-6">
      {/* Left Virtual Thumbstick */}
      <div
        ref={padRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        role="group"
        aria-label="Sterowanie ruchem animatora"
        className="pointer-events-auto relative w-28 h-28 rounded-full border-3 border-[#162638] bg-[#0f2a3e]/55 flex items-center justify-center touch-none"
      >
        <div
          className="w-12 h-12 rounded-full border-3 border-[#162638] bg-[#f4d35e] shadow-[0_3px_0_#162638]"
          style={{
            transform: `translate3d(${knob.x}px, ${knob.y}px, 0)`,
          }}
        />
      </div>

      {/* Right Tactile Dash Button */}
      <button
        type="button"
        onPointerDown={(e) => {
          e.preventDefault();
          onDash();
        }}
        aria-label="Zryw z siatką"
        className={`pointer-events-auto w-20 h-20 rounded-full flex flex-col items-center justify-center border-3 border-[#162638] cursor-pointer active:translate-y-1 ${
          dashReady
            ? 'bg-[#f25f5c] text-[#fffdf5] shadow-[inset_0_3px_0_#ff948d,0_5px_0_#162638]'
            : 'bg-[#1e3a52]/80 text-[#cbd5e1] shadow-[0_3px_0_#162638]'
        }`}
      >
        <DashNetPixelIcon className="w-7 h-7" />
        <span
          className="text-xs font-bold tracking-wider mt-0.5"
          style={{ fontFamily: 'var(--font-pixel)' }}
        >
          ZRYW
        </span>
      </button>
    </div>
  );
}
