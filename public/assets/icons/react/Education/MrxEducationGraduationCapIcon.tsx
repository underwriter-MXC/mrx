import * as React from 'react';

export interface MrxEducationGraduationCapIconProps extends React.SVGProps<SVGSVGElement> {
  title?: string;
}

export function MrxEducationGraduationCapIcon({ title = 'Graduation Cap', ...props }: MrxEducationGraduationCapIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-label={title} role="img" {...props}>
      <title>{title}</title>
      <path d="M8 24l24-12 24 12-24 12Z" fill="none" stroke="#0B1F3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M18 30v12c7 6 21 6 28 0V30" fill="none" stroke="#C8A24A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M14 57h36" fill="none" stroke="#C8A24A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default MrxEducationGraduationCapIcon;
