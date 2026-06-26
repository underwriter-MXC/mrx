import * as React from 'react';

export interface MrxEducationLibraryIconProps extends React.SVGProps<SVGSVGElement> {
  title?: string;
}

export function MrxEducationLibraryIcon({ title = 'Library', ...props }: MrxEducationLibraryIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-label={title} role="img" {...props}>
      <title>{title}</title>
      <path d="M14 14h17c4 0 7 3 7 7v35c0-4-3-7-7-7H14Z" fill="none" stroke="#0B1F3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M50 14H37c-4 0-7 3-7 7v35c0-4 3-7 7-7h13Z" fill="none" stroke="#C8A24A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M14 57h36" fill="none" stroke="#C8A24A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default MrxEducationLibraryIcon;
