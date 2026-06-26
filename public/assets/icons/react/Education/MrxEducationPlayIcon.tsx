import * as React from 'react';

export interface MrxEducationPlayIconProps extends React.SVGProps<SVGSVGElement> {
  title?: string;
}

export function MrxEducationPlayIcon({ title = 'Play', ...props }: MrxEducationPlayIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-label={title} role="img" {...props}>
      <title>{title}</title>
      <rect x="11" y="17" width="34" height="30" rx="5" fill="none" stroke="#0B1F3A" strokeWidth="2.5"/>
  <path d="M45 29l10-7v20l-10-7Z" fill="none" stroke="#C8A24A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M27 25l9 7-9 7Z" fill="none" stroke="#C8A24A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M14 57h36" fill="none" stroke="#C8A24A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default MrxEducationPlayIcon;
