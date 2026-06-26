import * as React from 'react';

export interface MrxMarketingLeadsIconProps extends React.SVGProps<SVGSVGElement> {
  title?: string;
}

export function MrxMarketingLeadsIcon({ title = 'Leads', ...props }: MrxMarketingLeadsIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-label={title} role="img" {...props}>
      <title>{title}</title>
      <path d="M12 36h10l24 12V16L22 28H12Z" fill="none" stroke="#0B1F3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M22 36v12h8l-4-12" fill="none" stroke="#C8A24A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M50 25c3 2 4 5 4 7s-1 5-4 7" fill="none" stroke="#C8A24A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M14 57h36" fill="none" stroke="#C8A24A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default MrxMarketingLeadsIcon;
