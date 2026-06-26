import * as React from 'react';

export interface MrxAgentsAiTeamIconProps extends React.SVGProps<SVGSVGElement> {
  title?: string;
}

export function MrxAgentsAiTeamIcon({ title = 'AI Team', ...props }: MrxAgentsAiTeamIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-label={title} role="img" {...props}>
      <title>{title}</title>
      <rect x="14" y="18" width="36" height="30" rx="8" fill="none" stroke="#0B1F3A" strokeWidth="2.5"/>
  <path d="M32 18L32 10" fill="none" stroke="#C8A24A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <circle cx="32" cy="8" r="2.5" fill="#C8A24A" stroke="#C8A24A" strokeWidth="2"/>
  <circle cx="25" cy="32" r="3" fill="none" stroke="#C8A24A" strokeWidth="2.5"/>
  <circle cx="39" cy="32" r="3" fill="none" stroke="#C8A24A" strokeWidth="2.5"/>
  <path d="M24 41h16" fill="none" stroke="#0B1F3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M9 29L14 29" fill="none" stroke="#C8A24A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M50 29L55 29" fill="none" stroke="#C8A24A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M14 57h36" fill="none" stroke="#C8A24A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default MrxAgentsAiTeamIcon;
