import * as React from 'react';

export interface MrxEducationTutorialIconProps extends React.SVGProps<SVGSVGElement> {
  title?: string;
}

export function MrxEducationTutorialIcon({ title = 'Tutorial', ...props }: MrxEducationTutorialIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-label={title} role="img" {...props}>
      <title>{title}</title>
      <rect x="17" y="13" width="30" height="42" rx="5" fill="none" stroke="#0B1F3A" strokeWidth="2.5"/>
  <rect x="25" y="8" width="14" height="10" rx="4" fill="none" stroke="#C8A24A" strokeWidth="2.5"/>
  <path d="M25 29L40 29" fill="none" stroke="#0B1F3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M25 39L40 39" fill="none" stroke="#0B1F3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M23 29l2 2 4-5" fill="none" stroke="#C8A24A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M14 57h36" fill="none" stroke="#C8A24A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default MrxEducationTutorialIcon;
