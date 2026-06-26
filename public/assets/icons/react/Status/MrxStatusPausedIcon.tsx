import * as React from 'react';

export interface MrxStatusPausedIconProps extends React.SVGProps<SVGSVGElement> {
  title?: string;
}

export function MrxStatusPausedIcon({ title = 'Paused', ...props }: MrxStatusPausedIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-label={title} role="img" {...props}>
      <title>{title}</title>
      <circle cx="32" cy="32" r="22" fill="none" stroke="#0B1F3A" strokeWidth="2.5"/>
  <path d="M21 33l8 8 16-18" fill="none" stroke="#C8A24A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default MrxStatusPausedIcon;
