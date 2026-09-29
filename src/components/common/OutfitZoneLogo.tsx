import React from 'react';

interface OutfitZoneLogoProps {
  className?: string;
  variant?: 'stacked' | 'horizontal' | 'mark' | 'center-editorial';
  iconSize?: number;
  textColor?: string;
}

export const OutfitZoneLogo: React.FC<OutfitZoneLogoProps> = ({
  className = 'h-10 text-white',
  variant = 'horizontal',
  textColor = 'currentColor',
}) => {
  if (variant === 'stacked') {
    return (
      <div className={`flex flex-col items-center justify-center text-center select-none ${className}`}>
        {/* Coat Hanger Mark */}
        <svg
          viewBox="0 0 200 120"
          className="w-24 h-14"
          fill={textColor}
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Top Hook */}
          <path d="M100 18 C100 12 105 6 112 6 C119 6 125 12 125 19 C125 25 120 30 115 34 C109 37 104 42 103 48 L97 48 C98 39 104 33 111 29 C115 26 119 22 119 19 C119 15 116 12 112 12 C108 12 106 15 106 18 Z" />
          {/* Triangular Hanger Body */}
          <path d="M100 48 L175 80 C180 82 183 87 181 92 C179 97 174 100 169 100 L31 100 C26 100 21 97 19 92 C17 87 20 82 25 80 Z" fillRule="evenodd" />
          <path d="M100 58 L38 85 C36 86 35 88 35 90 C36 92 38 93 40 93 L160 93 C162 93 164 92 165 90 C165 88 164 86 162 85 Z" fill="#0c0c0e" />
          {/* Bottom Bar */}
          <rect x="20" y="93" width="160" height="10" rx="5" />
        </svg>

        {/* Brand Typography */}
        <div className="mt-1 font-syne font-black tracking-wider leading-none">
          <div className="text-xl sm:text-2xl tracking-[0.2em]">OUTFIT</div>
          <div className="text-xl sm:text-2xl tracking-[0.25em] mt-0.5">ZONE</div>
        </div>
      </div>
    );
  }

  if (variant === 'mark') {
    return (
      <svg
        viewBox="0 0 200 120"
        className={className}
        fill={textColor}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M100 18 C100 12 105 6 112 6 C119 6 125 12 125 19 C125 25 120 30 115 34 C109 37 104 42 103 48 L97 48 C98 39 104 33 111 29 C115 26 119 22 119 19 C119 15 116 12 112 12 C108 12 106 15 106 18 Z" />
        <path d="M100 48 L175 80 C180 82 183 87 181 92 C179 97 174 100 169 100 L31 100 C26 100 21 97 19 92 C17 87 20 82 25 80 Z" fillRule="evenodd" />
        <path d="M100 58 L38 85 C36 86 35 88 35 90 C36 92 38 93 40 93 L160 93 C162 93 164 92 165 90 C165 88 164 86 162 85 Z" fill="#0c0c0e" />
        <rect x="20" y="93" width="160" height="10" rx="5" />
      </svg>
    );
  }

  if (variant === 'center-editorial') {
    return (
      <div className={`flex flex-col items-center justify-center text-center select-none ${className}`}>
        <div className="font-syne font-black tracking-[0.2em] text-lg sm:text-2xl leading-none uppercase">
          OUTFIT
        </div>
        <div className="font-syne font-black tracking-[0.25em] text-lg sm:text-2xl leading-none uppercase mt-0.5">
          ZONE
        </div>
        <div className="text-[7px] sm:text-[9px] tracking-[0.3em] uppercase text-neutral-400 font-semibold mt-1">
          WEAR IN THE ZONE
        </div>
      </div>
    );
  }

  // Horizontal variant (Ideal for Top Bars & Headers)
  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 select-none ${className}`}>
      {/* Coat Hanger Mark */}
      <svg
        viewBox="0 0 200 120"
        className="h-8 w-11 shrink-0"
        fill={textColor}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M100 18 C100 12 105 6 112 6 C119 6 125 12 125 19 C125 25 120 30 115 34 C109 37 104 42 103 48 L97 48 C98 39 104 33 111 29 C115 26 119 22 119 19 C119 15 116 12 112 12 C108 12 106 15 106 18 Z" />
        <path d="M100 48 L175 80 C180 82 183 87 181 92 C179 97 174 100 169 100 L31 100 C26 100 21 97 19 92 C17 87 20 82 25 80 Z" />
        <path d="M100 58 L38 85 C36 86 35 88 35 90 C36 92 38 93 40 93 L160 93 C162 93 164 92 165 90 C165 88 164 86 162 85 Z" fill="#0c0c0e" />
        <rect x="20" y="93" width="160" height="10" rx="5" />
      </svg>

      {/* Brand Text */}
      <div className="flex flex-col text-right justify-center">
        <span className="font-syne text-lg sm:text-xl font-black tracking-wider uppercase leading-none">
          OUTFIT ZONE
        </span>
        <span className="text-[9px] sm:text-[10px] tracking-widest uppercase text-neutral-400 font-medium mt-0.5">
          WEAR IN THE ZONE
        </span>
      </div>
    </div>
  );
};
