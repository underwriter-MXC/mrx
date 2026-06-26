import * as React from 'react';

export interface MrxValuationHandshakeIconProps extends React.SVGProps<SVGSVGElement> {
  title?: string;
}

export function MrxValuationHandshakeIcon({ title = 'Handshake', ...props }: MrxValuationHandshakeIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-label={title} role="img" {...props}>
      <title>{title}</title>
      <path d="M10 36l10-10 10 10 8-8 16 14" fill="none" stroke="#0B1F3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M22 38l8 8c3 3 7 3 10 0l5-5" fill="none" stroke="#C8A24A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M14 48l10-10M50 48l-10-10" fill="none" stroke="#0B1F3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M14 57h36" fill="none" stroke="#C8A24A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default MrxValuationHandshakeIcon;
