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

// Reception / intake staff — they manage the front desk and are the only
// non-admins who may open the Client Log (which holds sensitive client data).
// General staff never see it. Add teammates' emails here as they join/leave.
const RECEPTION_EMAILS = [
  'abhishek.desai@magma-amgm.org',
  'emilie.rousseau@magma-amgm.org',
  'jennifer.manlabao@magma-amgm.org',
  'kenza.trabelsi@magma-amgm.org',
  'audra.colebrooke@magma-amgm.org',
  'nataliia.mospak@magma-amgm.org',
];

const normalize = (email) => (email || '').trim().toLowerCase();

export function isAdmin(email) {
  if (!email) return false;
  return ADMIN_EMAILS.map(normalize).includes(normalize(email));
}

// Reception access includes admins (admins can see everything).
export function isReception(email) {
  if (!email) return false;
  if (isAdmin(email)) return true;
  return RECEPTION_EMAILS.map(normalize).includes(normalize(email));
}

export function getAdminEmails() {
  return [...ADMIN_EMAILS];
}
