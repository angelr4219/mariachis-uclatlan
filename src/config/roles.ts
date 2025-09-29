// =============================================
// FILE: src/config/roles.ts
// Simple, hard-coded allowlists for bootstrap and local dev.
// =============================================
export const ADMIN_EMAILS: string[] = [
    'angelrocks0319@gmail.com',
    'angelr19@g.ucla.edu',
    'angelr19@ucla.edu',
    'uclatlan@ucla.edu',
    'uclatlan@g.ucla.edu',
    'enriquerodgon09@g.ucla.edu',
    'andelapena1374@gmail.com',
    // add more admin emails here
  ];
  
  export const PERFORMER_EMAILS: string[] = [
    // optional: 'somebody@ucla.edu'
    'angelrocks0319@gmail.com',
    'angelr19@g.ucla.edu',
    'angelr19@ucla.edu',
    'uclatlan@ucla.edu',
    'uclatlan@g.ucla.edu',
    'enriquerodgon09@g.ucla.edu',
    'andelapena1374@gmail.com',
    ''

  ];
  

// Check if the email is an admin (case‑insensitive)
export const isAdminEmail = (email?: string): boolean => {
  if (!email) return false;
  const lowerEmail = email.toLowerCase();
  return ADMIN_EMAILS.some((admin) => admin.toLowerCase() === lowerEmail);
};

// Check if the email is a performer (case‑insensitive)
export const isPerformerEmail = (email?: string): boolean => {
  if (!email) return false;
  const lowerEmail = email.toLowerCase();
  return PERFORMER_EMAILS.some((performer) => performer.toLowerCase() === lowerEmail);
};