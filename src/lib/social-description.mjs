/** Shared social-preview budget introduced by the source SEO remediation. */
export const SOCIAL_DESCRIPTION_MAX = 125;

/** @param {string} description */
export function buildSocialDescription(description) {
  return description.length <= SOCIAL_DESCRIPTION_MAX
    ? description
    : `${description
        .slice(0, 121)
        .replace(/\s+\S*$/, '')
        .replace(/[\s,;:.!?-]+$/, '')}…`;
}
