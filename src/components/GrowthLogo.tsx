import React from 'react';

export interface GrowthLogoProps {
  size?: number | string;
  className?: string;
  colorClassName?: string;
  variant?: 'white' | 'gradient' | 'pink' | 'emerald' | 'custom';
  alt?: string;
}

export const GrowthLogo: React.FC<GrowthLogoProps> = ({
  size = 32,
  className = '',
  colorClassName,
  variant = 'white',
  alt = 'Growth Logo',
}) => {
  const pixelSize = typeof size === 'number' ? `${size}px` : size;

  if (variant === 'gradient' || variant === 'emerald') {
    return (
      <img
        src="/assets/aistudio/growth_logo_clean_emerald.png"
        alt={alt}
        style={{ width: pixelSize, height: pixelSize }}
        className={`object-contain shrink-0 select-none pointer-events-none ${className}`}
      />
    );
  }

  if (variant === 'pink') {
    return (
      <img
        src="/assets/aistudio/growth_logo_clean_pink.png"
        alt={alt}
        style={{ width: pixelSize, height: pixelSize }}
        className={`object-contain shrink-0 select-none pointer-events-none ${className}`}
      />
    );
  }

  if (variant === 'white' && !colorClassName) {
    return (
      <img
        src="/assets/aistudio/growth_logo_clean_white.png"
        alt={alt}
        style={{ width: pixelSize, height: pixelSize }}
        className={`object-contain shrink-0 select-none pointer-events-none ${className}`}
      />
    );
  }

  // CSS mask approach allows applying any custom background gradient / color dynamically
  const resolvedColorClass = colorClassName || 'bg-white';

  return (
    <div
      role="img"
      aria-label={alt}
      className={`inline-block shrink-0 ${resolvedColorClass} ${className}`}
      style={{
        width: pixelSize,
        height: pixelSize,
        maskImage: 'url(/assets/aistudio/growth_logo_clean_white.png)',
        WebkitMaskImage: 'url(/assets/aistudio/growth_logo_clean_white.png)',
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
      }}
    />
  );
};
