import * as React from 'react';

export interface MrxStatusPendingIconProps extends React.SVGProps<SVGSVGElement> {
  title?: string;
}

export function MrxStatusPendingIcon({ title = 'Pending', ...props }: MrxStatusPendingIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-label={title} role="img" {...props}>
      <title>{title}</title>
      <path d="M15 48l4-12 25-25 9 9-25 25Z" fill="none" stroke="#0B1F3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M38 17L47 26" fill="none" stroke="#C8A24A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M15 48l12-4" fill="none" stroke="#0B1F3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M14 57h36" fill="none" stroke="#C8A24A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default MrxStatusPendingIcon;
