import * as React from 'react';

export interface MrxProductionPressureGaugeIconProps extends React.SVGProps<SVGSVGElement> {
  title?: string;
}

export function MrxProductionPressureGaugeIcon({ title = 'Pressure Gauge', ...props }: MrxProductionPressureGaugeIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-label={title} role="img" {...props}>
      <title>{title}</title>
      <path d="M14 44a20 20 0 1 1 36 0" fill="none" stroke="#0B1F3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M32 42L43 27" fill="none" stroke="#C8A24A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <circle cx="32" cy="42" r="3" fill="none" stroke="#C8A24A" strokeWidth="2.5"/>
  <path d="M18 44h28" fill="none" stroke="#0B1F3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M14 57h36" fill="none" stroke="#C8A24A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default MrxProductionPressureGaugeIcon;
