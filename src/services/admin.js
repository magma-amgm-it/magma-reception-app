// Admin-only feature gate. The Admin Dashboard, feedback inbox, and any other
// "owner-only" controls are visible only to these emails.
//
// To add another admin (e.g. a manager), append their email to ADMIN_EMAILS.
// To remove yourself as the only admin, edit this list — there's no UI for it
// on purpose (keeps the gate dead-simple and tamper-resistant from the client).

const ADMIN_EMAILS = [
  'abhishek.desai@magma-amgm.org',
  'abhishekdesai769@gmail.com',
];

const normalize = (email) => (email || '').trim().toLowerCase();

export function isAdmin(email) {
  if (!email) return false;
  return ADMIN_EMAILS.map(normalize).includes(normalize(email));
}

export function getAdminEmails() {
  return [...ADMIN_EMAILS];
}
