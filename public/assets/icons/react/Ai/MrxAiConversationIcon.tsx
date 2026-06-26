import * as React from 'react';

export interface MrxAiConversationIconProps extends React.SVGProps<SVGSVGElement> {
  title?: string;
}

export function MrxAiConversationIcon({ title = 'Conversation', ...props }: MrxAiConversationIconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-label={title} role="img" {...props}>
      <title>{title}</title>
      <path d="M14 18h34a8 8 0 0 1 8 8v13a8 8 0 0 1-8 8H31l-13 8v-8h-4a8 8 0 0 1-8-8V26a8 8 0 0 1 8-8Z" fill="none" stroke="#0B1F3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  <circle cx="24" cy="33" r="1.7" fill="#C8A24A" stroke="#C8A24A" strokeWidth="2"/>
  <circle cx="32" cy="33" r="1.7" fill="#C8A24A" stroke="#C8A24A" strokeWidth="2"/>
  <circle cx="40" cy="33" r="1.7" fill="#C8A24A" stroke="#C8A24A" strokeWidth="2"/>
  <path d="M14 57h36" fill="none" stroke="#C8A24A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default MrxAiConversationIcon;
