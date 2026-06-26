import * as React from 'react';

export interface MrxSearchDatabaseIconProps extends React.SVGProps<SVGSVGElement> {
  title?: string;
}

export function MrxSearchDatabaseIcon({ title = 'Database', ...props }: MrxSearchDatabaseIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-label={title} role="img" {...props}>
      <title>{title}</title>
      <path d="M14 18c0-5 8-9 18-9s18 4 18 9-8 9-18 9-18-4-18-9Z" fill="none" stroke="#0B1F3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M14 18v24c0 5 8 9 18 9s18-4 18-9V18" fill="none" stroke="#0B1F3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M14 30c0 5 8 9 18 9s18-4 18-9" fill="none" stroke="#C8A24A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M14 57h36" fill="none" stroke="#C8A24A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default MrxSearchDatabaseIcon;
