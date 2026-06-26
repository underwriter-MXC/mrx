import * as React from 'react';

export interface MrxTrustAwardIconProps extends React.SVGProps<SVGSVGElement> {
  title?: string;
}

export function MrxTrustAwardIcon({ title = 'Award', ...props }: MrxTrustAwardIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-label={title} role="img" {...props}>
      <title>{title}</title>
      <path d="M18 48h28l4-19-12 7-6-16-6 16-12-7Z" fill="none" stroke="#0B1F3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M20 54h24" fill="none" stroke="#C8A24A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M14 57h36" fill="none" stroke="#C8A24A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default MrxTrustAwardIcon;
