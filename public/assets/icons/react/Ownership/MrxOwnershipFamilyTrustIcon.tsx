import * as React from 'react';

export interface MrxOwnershipFamilyTrustIconProps extends React.SVGProps<SVGSVGElement> {
  title?: string;
}

export function MrxOwnershipFamilyTrustIcon({ title = 'Family Trust', ...props }: MrxOwnershipFamilyTrustIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-label={title} role="img" {...props}>
      <title>{title}</title>
      <circle cx="24" cy="24" r="7" fill="none" stroke="#0B1F3A" strokeWidth="2.5"/>
  <circle cx="42" cy="25" r="6" fill="none" stroke="#C8A24A" strokeWidth="2.5"/>
  <path d="M10 54c2-10 8-15 14-15s12 5 14 15" fill="none" stroke="#0B1F3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M34 54c2-8 7-12 12-12 4 0 8 3 10 10" fill="none" stroke="#C8A24A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M14 57h36" fill="none" stroke="#C8A24A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default MrxOwnershipFamilyTrustIcon;
