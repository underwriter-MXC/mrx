import * as React from 'react';

export interface MrxProductionHistoricalProductionIconProps extends React.SVGProps<SVGSVGElement> {
  title?: string;
}

export function MrxProductionHistoricalProductionIcon({ title = 'Historical Production', ...props }: MrxProductionHistoricalProductionIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-label={title} role="img" {...props}>
      <title>{title}</title>
      <rect x="16" y="23" width="32" height="24" rx="5" fill="none" stroke="#0B1F3A" strokeWidth="2.5"/>
  <path d="M20 23c4-8 20-8 24 0" fill="none" stroke="#C8A24A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M13 52L51 52" fill="none" stroke="#0B1F3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M23 47v-9M32 47v-14M41 47v-8" fill="none" stroke="#C8A24A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M14 57h36" fill="none" stroke="#C8A24A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default MrxProductionHistoricalProductionIcon;
