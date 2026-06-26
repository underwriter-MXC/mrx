import * as React from 'react';

export interface MrxMapsTexasIconProps extends React.SVGProps<SVGSVGElement> {
  title?: string;
}

export function MrxMapsTexasIcon({ title = 'Texas', ...props }: MrxMapsTexasIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-label={title} role="img" {...props}>
      <title>{title}</title>
      <path d="M20 12l16 3 9 10-3 10 7 8-8 10-13-4-7 4-7-9 5-10-4-10Z" fill="none" stroke="#0B1F3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <circle cx="33" cy="32" r="3" fill="#C8A24A" stroke="#C8A24A" strokeWidth="2"/>
    </svg>
  );
}

export default MrxMapsTexasIcon;
