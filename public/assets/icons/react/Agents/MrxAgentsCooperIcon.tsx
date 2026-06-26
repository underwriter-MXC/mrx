import * as React from 'react';

export interface MrxAgentsCooperIconProps extends React.SVGProps<SVGSVGElement> {
  title?: string;
}

export function MrxAgentsCooperIcon({ title = 'Cooper', ...props }: MrxAgentsCooperIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-label={title} role="img" {...props}>
      <title>{title}</title>
      <path d="M32 7l20 8v18c0 11-8 19-20 24-12-5-20-13-20-24V15Z" fill="none" stroke="#0B1F3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <circle cx="32" cy="25" r="7" fill="none" stroke="#C8A24A" strokeWidth="2.5"/>
  <path d="M20 48c2-9 7-14 12-14s10 5 12 14" fill="none" stroke="#C8A24A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <text x="32" y="29" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="8" fontWeight="700" fill="#0B1F3A">C</text>
  <path d="M14 57h36" fill="none" stroke="#C8A24A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default MrxAgentsCooperIcon;
