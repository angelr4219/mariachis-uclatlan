// =============================================
// FILE: src/config/roles.ts
// Simple, hard-coded allowlists for bootstrap and local dev.
// =============================================
export const ADMIN_EMAILS: string[] = [
    'angelrocks0319@gmail.com',
    'angelr19@g.ucla.edu',
    'angelr19@ucla.edu'
    // add more admin emails here
  ];
  
  export const PERFORMER_EMAILS: string[] = [
    // optional: 'somebody@ucla.edu'
    'angelrocks0319@gmail.com',
    'angelr19@g.ucla.edu',
    'angelr19@ucla.edu'
  ];
  
  export function isAdminEmail(email?: string | null) {
    if (!email) return false;
    const e = email.toLowerCase();
    return ADMIN_EMAILS.map((x) => x.toLowerCase()).includes(e);
  }
  
  export function isPerformerEmail(email?: string | null) {
    if (!email) return false;
    const e = email.toLowerCase();
    return (
      isAdminEmail(email) ||
      PERFORMER_EMAILS.map((x) => x.toLowerCase()).includes(e)
    );
  }
  
  