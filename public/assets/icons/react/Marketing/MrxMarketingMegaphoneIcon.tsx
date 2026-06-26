import * as React from 'react';

export interface MrxMarketingMegaphoneIconProps extends React.SVGProps<SVGSVGElement> {
  title?: string;
}

export function MrxMarketingMegaphoneIcon({ title = 'Megaphone', ...props }: MrxMarketingMegaphoneIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-label={title} role="img" {...props}>
      <title>{title}</title>
      <rect x="25" y="10" width="14" height="30" rx="7" fill="none" stroke="#0B1F3A" strokeWidth="2.5"/>
  <path d="M17 29c0 9 6 16 15 16s15-7 15-16" fill="none" stroke="#C8A24A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M32 45L32 54" fill="none" stroke="#0B1F3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M24 54L40 54" fill="none" stroke="#0B1F3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M49 20c3 3 5 7 5 12s-2 9-5 12" fill="none" stroke="#C8A24A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M15 20c-3 3-5 7-5 12s2 9 5 12" fill="none" stroke="#C8A24A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M14 57h36" fill="none" stroke="#C8A24A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default MrxMarketingMegaphoneIcon;
