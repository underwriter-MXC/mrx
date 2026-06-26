import * as React from 'react';

export interface MrxOwnershipParcelIconProps extends React.SVGProps<SVGSVGElement> {
  title?: string;
}

export function MrxOwnershipParcelIcon({ title = 'Parcel', ...props }: MrxOwnershipParcelIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-label={title} role="img" {...props}>
      <title>{title}</title>
      <path d="M32 57s17-17 17-33a17 17 0 1 0-34 0c0 16 17 33 17 33Z" fill="none" stroke="#0B1F3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <circle cx="32" cy="25" r="6" fill="none" stroke="#C8A24A" strokeWidth="2.5"/>
    </svg>
  );
}

export default MrxOwnershipParcelIcon;
