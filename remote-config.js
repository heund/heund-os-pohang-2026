/* Phone remote → Supabase Realtime (Broadcast).
   Supabase dashboard → Project Settings → API: paste the Project URL and the publishable (or anon) key.
   Both are meant to be public; the passphrase you type on the laptop (R) and the phone is what
   keeps the remote private, and it is never stored in this file.

   Leave both empty to test on one computer: the presentation and /remote in two tabs of the same browser. */
window.REMOTE_CONFIG = {
  supabaseUrl: 'https://gsjjqcdnsokkdjjwtyns.supabase.co',          // project heund-os-remote (Seoul)
  supabaseKey: 'sb_publishable_UBDXrPyYj-3PsRU9zDtquw_xgCHsQzg',  // publishable key
};
