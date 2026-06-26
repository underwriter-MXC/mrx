import * as React from 'react';

export interface MrxAiAiSearchIconProps extends React.SVGProps<SVGSVGElement> {
  title?: string;
}

export function MrxAiAiSearchIcon({ title = 'AI Search', ...props }: MrxAiAiSearchIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-label={title} role="img" {...props}>
      <title>{title}</title>
      <circle cx="28" cy="28" r="16" fill="none" stroke="#0B1F3A" strokeWidth="2.5"/>
  <path d="M40 40L54 54" fill="none" stroke="#C8A24A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M21 28h14M28 21v14" fill="none" stroke="#0B1F3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M14 57h36" fill="none" stroke="#C8A24A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default MrxAiAiSearchIcon;
