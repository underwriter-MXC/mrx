import * as React from 'react';

export interface MrxValuationMoneyBagIconProps extends React.SVGProps<SVGSVGElement> {
  title?: string;
}

export function MrxValuationMoneyBagIcon({ title = 'Money Bag', ...props }: MrxValuationMoneyBagIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-label={title} role="img" {...props}>
      <title>{title}</title>
      <path d="M25 10h14l-4 8h-6Z" fill="none" stroke="#C8A24A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M21 21c-7 7-11 15-11 24 0 8 8 12 22 12s22-4 22-12c0-9-4-17-11-24Z" fill="none" stroke="#0B1F3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M28 30c0-3 2-5 5-5s5 2 5 5-2 4-5 4-5 1-5 4 2 5 5 5 5-2 5-5" fill="none" stroke="#C8A24A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M33 24L33 46" fill="none" stroke="#C8A24A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M14 57h36" fill="none" stroke="#C8A24A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default MrxValuationMoneyBagIcon;
