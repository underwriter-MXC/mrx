import * as React from 'react';

export interface MrxTrustTopRatedIconProps extends React.SVGProps<SVGSVGElement> {
  title?: string;
}

export function MrxTrustTopRatedIcon({ title = 'Top Rated', ...props }: MrxTrustTopRatedIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-label={title} role="img" {...props}>
      <title>{title}</title>
      <path d="M32 9l6.5 13 14.5 2-10.5 10 2.5 14.5L32 41l-13 7.5L21.5 34 11 24l14.5-2Z" fill="none" stroke="#0B1F3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M18 54h28" fill="none" stroke="#C8A24A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M14 57h36" fill="none" stroke="#C8A24A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default MrxTrustTopRatedIcon;
