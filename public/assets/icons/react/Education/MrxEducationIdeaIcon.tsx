import * as React from 'react';

export interface MrxEducationIdeaIconProps extends React.SVGProps<SVGSVGElement> {
  title?: string;
}

export function MrxEducationIdeaIcon({ title = 'Idea', ...props }: MrxEducationIdeaIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-label={title} role="img" {...props}>
      <title>{title}</title>
      <path d="M32 8l4.5 15.5L52 28l-15.5 4.5L32 56l-4.5-23.5L12 28l15.5-4.5Z" fill="none" stroke="#0B1F3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M50 9l1.8 6.2L58 17l-6.2 1.8L50 25l-1.8-6.2L42 17l6.2-1.8Z" fill="none" stroke="#C8A24A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M14 57h36" fill="none" stroke="#C8A24A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default MrxEducationIdeaIcon;
