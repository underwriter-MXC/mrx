import * as React from 'react';

export interface MrxMarketingEmailCampaignIconProps extends React.SVGProps<SVGSVGElement> {
  title?: string;
}

export function MrxMarketingEmailCampaignIcon({ title = 'Email Campaign', ...props }: MrxMarketingEmailCampaignIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-label={title} role="img" {...props}>
      <title>{title}</title>
      <rect x="10" y="17" width="44" height="30" rx="5" fill="none" stroke="#0B1F3A" strokeWidth="2.5"/>
  <path d="M12 21l20 15 20-15" fill="none" stroke="#C8A24A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M14 57h36" fill="none" stroke="#C8A24A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default MrxMarketingEmailCampaignIcon;
