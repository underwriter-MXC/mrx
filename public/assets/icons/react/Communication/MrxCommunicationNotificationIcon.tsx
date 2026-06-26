import * as React from 'react';

export interface MrxCommunicationNotificationIconProps extends React.SVGProps<SVGSVGElement> {
  title?: string;
}

export function MrxCommunicationNotificationIcon({ title = 'Notification', ...props }: MrxCommunicationNotificationIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-label={title} role="img" {...props}>
      <title>{title}</title>
      <path d="M20 45h24l-3-5V29a9 9 0 0 0-18 0v11Z" fill="none" stroke="#0B1F3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M28 49a4 4 0 0 0 8 0" fill="none" stroke="#C8A24A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M14 57h36" fill="none" stroke="#C8A24A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default MrxCommunicationNotificationIcon;
