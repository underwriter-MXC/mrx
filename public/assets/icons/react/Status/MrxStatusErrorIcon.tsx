import * as React from 'react';

export interface MrxStatusErrorIconProps extends React.SVGProps<SVGSVGElement> {
  title?: string;
}

export function MrxStatusErrorIcon({ title = 'Error', ...props }: MrxStatusErrorIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-label={title} role="img" {...props}>
      <title>{title}</title>
      <circle cx="32" cy="32" r="22" fill="none" stroke="#0B1F3A" strokeWidth="2.5"/>
  <path d="M24 24L40 40" fill="none" stroke="#C8A24A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M40 24L24 40" fill="none" stroke="#C8A24A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default MrxStatusErrorIcon;
