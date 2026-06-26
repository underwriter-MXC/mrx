import * as React from 'react';

export interface MrxLeasingRoyaltyCheckIconProps extends React.SVGProps<SVGSVGElement> {
  title?: string;
}

export function MrxLeasingRoyaltyCheckIcon({ title = 'Royalty Check', ...props }: MrxLeasingRoyaltyCheckIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-label={title} role="img" {...props}>
      <title>{title}</title>
      <path d="M32 8s16 18 16 31a16 16 0 0 1-32 0C16 26 32 8 32 8Z" fill="none" stroke="#0B1F3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M26 38h12M26 45h12" fill="none" stroke="#C8A24A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M14 57h36" fill="none" stroke="#C8A24A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default MrxLeasingRoyaltyCheckIcon;
