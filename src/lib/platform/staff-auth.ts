export function staffLoginRedirectTo(origin: string) {
  return new URL('/staff/', origin).toString();
}

export function staffPasswordRecoveryRedirectTo() {
  return 'https://mineralrightsxchange.com/staff/';
}
