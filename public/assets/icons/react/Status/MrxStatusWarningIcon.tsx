import * as React from 'react';

export interface MrxStatusWarningIconProps extends React.SVGProps<SVGSVGElement> {
  title?: string;
}

export function MrxStatusWarningIcon({ title = 'Warning', ...props }: MrxStatusWarningIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-label={title} role="img" {...props}>
      <title>{title}</title>
      <path d="M32 9l24 43H8Z" fill="none" stroke="#0B1F3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M32 24L32 38" fill="none" stroke="#C8A24A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <circle cx="32" cy="46" r="1.7" fill="#C8A24A" stroke="#C8A24A" strokeWidth="2"/>
    </svg>
  );
}

export default MrxStatusWarningIcon;
