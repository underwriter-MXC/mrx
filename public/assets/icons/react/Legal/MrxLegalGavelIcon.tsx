import * as React from 'react';

export interface MrxLegalGavelIconProps extends React.SVGProps<SVGSVGElement> {
  title?: string;
}

export function MrxLegalGavelIcon({ title = 'Gavel', ...props }: MrxLegalGavelIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-label={title} role="img" {...props}>
      <title>{title}</title>
      <rect x="15" y="13" width="20" height="8" rx="2" fill="none" stroke="#0B1F3A" strokeWidth="2.5"/>
  <rect x="30" y="24" width="20" height="8" rx="2" fill="none" stroke="#C8A24A" strokeWidth="2.5"/>
  <path d="M27 20L43 36" fill="none" stroke="#0B1F3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M17 53L47 53" fill="none" stroke="#0B1F3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M14 57h36" fill="none" stroke="#C8A24A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default MrxLegalGavelIcon;
