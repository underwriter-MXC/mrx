export function normalizedHostname(hostname) {
  return String(hostname).toLowerCase().replace(/\.+$/, '');
}

export function isProductionHostname(hostname) {
  const host = normalizedHostname(hostname);
  return host === 'mineralrightsxchange.com' || host === 'www.mineralrightsxchange.com';
}
