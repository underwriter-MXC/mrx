import * as React from 'react';

export interface MrxStatusRefreshIconProps extends React.SVGProps<SVGSVGElement> {
  title?: string;
}

export function MrxStatusRefreshIcon({ title = 'Refresh', ...props }: MrxStatusRefreshIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-label={title} role="img" {...props}>
      <title>{title}</title>
      <path d="M48 25a18 18 0 0 0-31-8" fill="none" stroke="#0B1F3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M16 17v12h12" fill="none" stroke="#C8A24A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M16 39a18 18 0 0 0 31 8" fill="none" stroke="#0B1F3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M48 47V35H36" fill="none" stroke="#C8A24A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default MrxStatusRefreshIcon;
