export function sanitizeEmail(email?: string): string {
  return email ? email.replace(/\s/g, '') : '';
}
