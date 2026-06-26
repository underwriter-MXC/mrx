import * as React from 'react';

export interface MrxAiAiAnalysisIconProps extends React.SVGProps<SVGSVGElement> {
  title?: string;
}

export function MrxAiAiAnalysisIcon({ title = 'AI Analysis', ...props }: MrxAiAiAnalysisIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-label={title} role="img" {...props}>
      <title>{title}</title>
      <path d="M24 47c-8-2-13-8-13-17 0-8 6-14 14-14 3-6 14-6 17 0 7 1 11 7 11 14 0 10-7 17-17 17" fill="none" stroke="#0B1F3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M24 16v31M40 16v31" fill="none" stroke="#C8A24A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M24 27h-7M24 37h-8M40 26h8M40 37h7" fill="none" stroke="#C8A24A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M14 57h36" fill="none" stroke="#C8A24A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default MrxAiAiAnalysisIcon;
