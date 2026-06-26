import * as React from 'react';

export interface MrxGeologySeismicWaveIconProps extends React.SVGProps<SVGSVGElement> {
  title?: string;
}

export function MrxGeologySeismicWaveIcon({ title = 'Seismic Wave', ...props }: MrxGeologySeismicWaveIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-label={title} role="img" {...props}>
      <title>{title}</title>
      <path d="M9 45c10-10 18-10 28 0s15 6 18 2" fill="none" stroke="#0B1F3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M9 34c10-8 19-8 28 0s15 5 18 2" fill="none" stroke="#C8A24A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M9 23c10-6 19-6 28 0s15 4 18 2" fill="none" stroke="#0B1F3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M20 17L44 52" fill="none" stroke="#0B1F3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M14 57h36" fill="none" stroke="#C8A24A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default MrxGeologySeismicWaveIcon;
