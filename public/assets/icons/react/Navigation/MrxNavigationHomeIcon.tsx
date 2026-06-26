import * as React from 'react';

export interface MrxNavigationHomeIconProps extends React.SVGProps<SVGSVGElement> {
  title?: string;
}

export function MrxNavigationHomeIcon({ title = 'Home', ...props }: MrxNavigationHomeIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-label={title} role="img" {...props}>
      <title>{title}</title>
      <path d="M10 32L32 13l22 19" fill="none" stroke="#0B1F3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M17 29v25h30V29" fill="none" stroke="#0B1F3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <rect x="27" y="39" width="10" height="15" rx="2" fill="none" stroke="#C8A24A" strokeWidth="2.5"/>
  <path d="M14 57h36" fill="none" stroke="#C8A24A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default MrxNavigationHomeIcon;
