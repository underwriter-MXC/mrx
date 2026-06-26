import * as React from 'react';

export interface MrxProductionGasMoleculeIconProps extends React.SVGProps<SVGSVGElement> {
  title?: string;
}

export function MrxProductionGasMoleculeIcon({ title = 'Gas Molecule', ...props }: MrxProductionGasMoleculeIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-label={title} role="img" {...props}>
      <title>{title}</title>
      <path d="M17 18L32 32" fill="none" stroke="#0B1F3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M47 18L32 32" fill="none" stroke="#0B1F3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M32 32L19 48" fill="none" stroke="#0B1F3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M32 32L47 48" fill="none" stroke="#0B1F3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M19 48L47 48" fill="none" stroke="#C8A24A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <circle cx="17" cy="18" r="4" fill="none" stroke="#0B1F3A" strokeWidth="2.5"/>
  <circle cx="47" cy="18" r="4" fill="none" stroke="#0B1F3A" strokeWidth="2.5"/>
  <circle cx="32" cy="32" r="4" fill="none" stroke="#C8A24A" strokeWidth="2.5"/>
  <circle cx="19" cy="48" r="4" fill="none" stroke="#0B1F3A" strokeWidth="2.5"/>
  <circle cx="47" cy="48" r="4" fill="none" stroke="#0B1F3A" strokeWidth="2.5"/>
  <path d="M14 57h36" fill="none" stroke="#C8A24A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default MrxProductionGasMoleculeIcon;
