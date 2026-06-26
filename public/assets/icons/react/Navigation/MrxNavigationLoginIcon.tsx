import * as React from 'react';

export interface MrxNavigationLoginIconProps extends React.SVGProps<SVGSVGElement> {
  title?: string;
}

export function MrxNavigationLoginIcon({ title = 'Login', ...props }: MrxNavigationLoginIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-label={title} role="img" {...props}>
      <title>{title}</title>
      <rect x="14" y="14" width="36" height="36" rx="8" fill="none" stroke="#0B1F3A" strokeWidth="2.5"/>
  <circle cx="32" cy="32" r="7" fill="none" stroke="#C8A24A" strokeWidth="2.5"/>
  <path d="M32 19v-6M32 51v-6M19 32h-6M51 32h-6" fill="none" stroke="#0B1F3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M14 57h36" fill="none" stroke="#C8A24A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default MrxNavigationLoginIcon;
