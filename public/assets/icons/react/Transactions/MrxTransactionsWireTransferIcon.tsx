import * as React from 'react';

export interface MrxTransactionsWireTransferIconProps extends React.SVGProps<SVGSVGElement> {
  title?: string;
}

export function MrxTransactionsWireTransferIcon({ title = 'Wire Transfer', ...props }: MrxTransactionsWireTransferIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-label={title} role="img" {...props}>
      <title>{title}</title>
      <circle cx="32" cy="32" r="19" fill="none" stroke="#0B1F3A" strokeWidth="2.5"/>
  <path d="M27 25c0-4 3-6 7-6s7 3 7 6c0 5-4 6-8 7s-7 2-7 6 3 7 8 7 8-3 8-7" fill="none" stroke="#C8A24A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M34 17L34 48" fill="none" stroke="#C8A24A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M14 57h36" fill="none" stroke="#C8A24A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default MrxTransactionsWireTransferIcon;
