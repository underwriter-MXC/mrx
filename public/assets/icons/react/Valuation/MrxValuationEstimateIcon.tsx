import * as React from 'react';

export interface MrxValuationEstimateIconProps extends React.SVGProps<SVGSVGElement> {
  title?: string;
}

export function MrxValuationEstimateIcon({ title = 'Estimate', ...props }: MrxValuationEstimateIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-label={title} role="img" {...props}>
      <title>{title}</title>
      <rect x="18" y="9" width="28" height="46" rx="6" fill="none" stroke="#0B1F3A" strokeWidth="2.5"/>
  <rect x="23" y="15" width="18" height="9" rx="2" fill="none" stroke="#C8A24A" strokeWidth="2.5"/>
  <circle cx="25" cy="32" r="1.5" fill="#0B1F3A" stroke="#0B1F3A" strokeWidth="2"/>
  <circle cx="32" cy="32" r="1.5" fill="#0B1F3A" stroke="#0B1F3A" strokeWidth="2"/>
  <circle cx="39" cy="32" r="1.5" fill="#0B1F3A" stroke="#0B1F3A" strokeWidth="2"/>
  <circle cx="25" cy="40" r="1.5" fill="#0B1F3A" stroke="#0B1F3A" strokeWidth="2"/>
  <circle cx="32" cy="40" r="1.5" fill="#0B1F3A" stroke="#0B1F3A" strokeWidth="2"/>
  <circle cx="39" cy="40" r="1.5" fill="#0B1F3A" stroke="#0B1F3A" strokeWidth="2"/>
  <circle cx="25" cy="48" r="1.5" fill="#0B1F3A" stroke="#0B1F3A" strokeWidth="2"/>
  <circle cx="32" cy="48" r="1.5" fill="#0B1F3A" stroke="#0B1F3A" strokeWidth="2"/>
  <circle cx="39" cy="48" r="1.5" fill="#0B1F3A" stroke="#0B1F3A" strokeWidth="2"/>
  <path d="M14 57h36" fill="none" stroke="#C8A24A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default MrxValuationEstimateIcon;
