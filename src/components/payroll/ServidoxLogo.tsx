import React from 'react';

interface ServidoxLogoProps {
  className?: string;
  size?: number;
  variant?: 'full' | 'icon' | 'watermark';
}

export const ServidoxLogo: React.FC<ServidoxLogoProps> = ({
  className = '',
  size = 48,
  variant = 'full',
}) => {
  const logoSrc = '/assets/aistudio/Sans_titre_b7fbb046.png';

  if (variant === 'icon') {
    return (
      <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
        <img
          src={logoSrc}
          alt="SERVI-DOX Logo"
          style={{ width: size, height: size }}
          className="object-contain"
          onError={(e) => {
            // Fallback SVG if image fails
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      </div>
    );
  }

  if (variant === 'watermark') {
    return (
      <div
        className={`pointer-events-none select-none flex flex-col items-center justify-center text-center ${className}`}
      >
        <div className="relative flex flex-col items-center justify-center">
          {/* Official SERVI-DOX Logo Image centered in watermark with subtle opacity */}
          <div className="w-56 h-56 sm:w-72 sm:h-72 opacity-[0.09] filter grayscale contrast-125 mb-1 select-none">
            <img
              src={logoSrc}
              alt="SERVI-DOX Filigrane"
              className="w-full h-full object-contain pointer-events-none select-none"
            />
          </div>

          {/* Sceau de sécurité et texte officiel en filigrane */}
          <div className="opacity-[0.08] select-none text-slate-900 flex flex-col items-center">
            <div className="font-black text-2xl sm:text-3xl tracking-[0.25em] uppercase">
              ★ SERVI-DOX ★
            </div>
            <div className="text-[10px] sm:text-[11px] font-extrabold tracking-widest uppercase mt-0.5">
              DOCUMENT OFFICIEL CERTIFIÉ • ALGER
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Full Brand Logo for top-left
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative flex-shrink-0">
        <div className="w-14 h-14 rounded-xl bg-white border border-slate-200/90 shadow-xs p-1 flex items-center justify-center">
          <img
            src={logoSrc}
            alt="SERVI-DOX Logo Officiel"
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="font-black text-xl tracking-tight text-slate-900">
            SERVI<span className="text-blue-600">-DOX</span>
          </span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 tracking-wider">
            PRO
          </span>
        </div>
        <p className="text-[11px] font-semibold text-slate-600 leading-tight">
          Bureau d'Affaires & Assistance Administrative
        </p>
      </div>
    </div>
  );
};
