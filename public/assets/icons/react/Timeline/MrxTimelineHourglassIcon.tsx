import * as React from 'react';

export interface MrxTimelineHourglassIconProps extends React.SVGProps<SVGSVGElement> {
  title?: string;
}

export function MrxTimelineHourglassIcon({ title = 'Hourglass', ...props }: MrxTimelineHourglassIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-label={title} role="img" {...props}>
      <title>{title}</title>
      <path d="M20 10h24M20 54h24M22 10c0 15 20 15 20 29 0 7-5 11-10 15-5-4-10-8-10-15 0-14 20-14 20-29" fill="none" stroke="#0B1F3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M27 25L37 25" fill="none" stroke="#C8A24A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M14 57h36" fill="none" stroke="#C8A24A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default MrxTimelineHourglassIcon;
