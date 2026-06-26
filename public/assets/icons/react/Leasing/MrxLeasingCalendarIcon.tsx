import * as React from 'react';

export interface MrxLeasingCalendarIconProps extends React.SVGProps<SVGSVGElement> {
  title?: string;
}

export function MrxLeasingCalendarIcon({ title = 'Calendar', ...props }: MrxLeasingCalendarIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-label={title} role="img" {...props}>
      <title>{title}</title>
      <rect x="12" y="14" width="40" height="38" rx="5" fill="none" stroke="#0B1F3A" strokeWidth="2.5"/>
  <path d="M21 9L21 20" fill="none" stroke="#C8A24A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M43 9L43 20" fill="none" stroke="#C8A24A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M12 25L52 25" fill="none" stroke="#0B1F3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <circle cx="22" cy="34" r="1.3" fill="#C8A24A" stroke="#C8A24A" strokeWidth="2"/>
  <circle cx="32" cy="34" r="1.3" fill="#C8A24A" stroke="#C8A24A" strokeWidth="2"/>
  <circle cx="42" cy="34" r="1.3" fill="#C8A24A" stroke="#C8A24A" strokeWidth="2"/>
  <circle cx="22" cy="43" r="1.3" fill="#C8A24A" stroke="#C8A24A" strokeWidth="2"/>
  <circle cx="32" cy="43" r="1.3" fill="#C8A24A" stroke="#C8A24A" strokeWidth="2"/>
  <circle cx="42" cy="43" r="1.3" fill="#C8A24A" stroke="#C8A24A" strokeWidth="2"/>
  <path d="M14 57h36" fill="none" stroke="#C8A24A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default MrxLeasingCalendarIcon;
