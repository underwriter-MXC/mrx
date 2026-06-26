import * as React from 'react';

export interface MrxTrustTrustedIconProps extends React.SVGProps<SVGSVGElement> {
  title?: string;
}

export function MrxTrustTrustedIcon({ title = 'Trusted', ...props }: MrxTrustTrustedIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-label={title} role="img" {...props}>
      <title>{title}</title>
      <path d="M32 7l20 8v14c0 13-7 22-20 28-13-6-20-15-20-28V15Z" fill="none" stroke="#0B1F3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M22 32l7 7 15-17" fill="none" stroke="#C8A24A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default MrxTrustTrustedIcon;
