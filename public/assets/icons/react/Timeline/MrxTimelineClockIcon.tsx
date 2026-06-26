import * as React from 'react';

export interface MrxTimelineClockIconProps extends React.SVGProps<SVGSVGElement> {
  title?: string;
}

export function MrxTimelineClockIcon({ title = 'Clock', ...props }: MrxTimelineClockIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-label={title} role="img" {...props}>
      <title>{title}</title>
      <circle cx="32" cy="32" r="21" fill="none" stroke="#0B1F3A" strokeWidth="2.5"/>
  <path d="M32 18L32 33" fill="none" stroke="#0B1F3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M32 33L43 39" fill="none" stroke="#C8A24A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M14 57h36" fill="none" stroke="#C8A24A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default MrxTimelineClockIcon;
