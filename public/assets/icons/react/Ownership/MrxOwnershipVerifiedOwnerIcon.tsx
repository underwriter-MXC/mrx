import * as React from 'react';

export interface MrxOwnershipVerifiedOwnerIconProps extends React.SVGProps<SVGSVGElement> {
  title?: string;
}

export function MrxOwnershipVerifiedOwnerIcon({ title = 'Verified Owner', ...props }: MrxOwnershipVerifiedOwnerIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-label={title} role="img" {...props}>
      <title>{title}</title>
      <circle cx="32" cy="22" r="9" fill="none" stroke="#0B1F3A" strokeWidth="2.5"/>
  <path d="M15 54c3-12 11-18 17-18s14 6 17 18" fill="none" stroke="#0B1F3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M25 42c3 3 11 3 14 0" fill="none" stroke="#C8A24A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M14 57h36" fill="none" stroke="#C8A24A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default MrxOwnershipVerifiedOwnerIcon;
