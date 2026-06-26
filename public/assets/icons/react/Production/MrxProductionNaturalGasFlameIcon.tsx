import * as React from 'react';

export interface MrxProductionNaturalGasFlameIconProps extends React.SVGProps<SVGSVGElement> {
  title?: string;
}

export function MrxProductionNaturalGasFlameIcon({ title = 'Natural Gas Flame', ...props }: MrxProductionNaturalGasFlameIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-label={title} role="img" {...props}>
      <title>{title}</title>
      <path d="M32 8c8 9 15 18 15 29a15 15 0 0 1-30 0c0-8 5-13 10-20-1 8 5 11 5 11 3-5 3-12 0-20Z" fill="none" stroke="#0B1F3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M32 40c-4 5-3 11 0 15 5-3 7-8 4-15" fill="none" stroke="#C8A24A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M14 57h36" fill="none" stroke="#C8A24A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default MrxProductionNaturalGasFlameIcon;
