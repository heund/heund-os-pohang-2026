/* ═══════════════════════════════════════════════════════════
   Remote link — shared by the presentation (index.html) and the phone (remote.html)

   Both sides join one Supabase Realtime Broadcast channel. Its name is derived from the
   passphrase (SHA-256), so the passphrase never travels or sits in the code, and only a device
   that knows it can reach the presentation. Messages:
     phone  → screen   'cmd'   { a: 'next' | 'prev' | 'video' }
     phone  → screen   'hello' {}                         (asks for the current state)
     screen → phone    'state' { i, last, label, next, video, active, at }
   Without Supabase settings (remote-config.js) it falls back to BroadcastChannel:
   two tabs of the same browser, for testing.
   ═══════════════════════════════════════════════════════════ */
(() => {
  const CFG = window.REMOTE_CONFIG || {};
  const SUPABASE_JS = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/dist/umd/supabase.min.js';
  const EVENTS = ['cmd', 'hello', 'state'];

  async function topicFor(pass) {
    const bytes = new TextEncoder().encode(`heund-os/remote/${pass.trim()}`);
    const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
    return `heund-${[...hash.slice(0, 20)].map((b) => b.toString(16).padStart(2, '0')).join('')}`;
  }

  let loading;
  const loadSupabase = () => loading || (loading = new Promise((resolve, reject) => {
    if (window.supabase) return resolve(window.supabase);
    const s = document.createElement('script');
    s.src = SUPABASE_JS;
    s.onload = () => resolve(window.supabase);
    s.onerror = () => { loading = null; reject(new Error('supabase-js could not be loaded')); };
    document.head.appendChild(s);
  }));

  const configured = () => Boolean(CFG.supabaseUrl && CFG.supabaseKey);

  // connect(pass, onMessage(event, payload), onStatus('online' | 'local' | 'connecting' | 'offline' | 'error'))
  async function connect(pass, onMessage, onStatus = () => {}) {
    const topic = await topicFor(pass);

    if (!configured()) {
      const bc = new BroadcastChannel(topic);
      bc.onmessage = (e) => e.data && onMessage(e.data.event, e.data.payload || {});
      setTimeout(() => onStatus('local'), 0);
      return { mode: 'local', send: (event, payload = {}) => bc.postMessage({ event, payload }), close: () => bc.close() };
    }

    onStatus('connecting');
    const lib = await loadSupabase();
    const client = lib.createClient(CFG.supabaseUrl, CFG.supabaseKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const channel = client.channel(topic, { config: { broadcast: { self: false, ack: false } } });
    EVENTS.forEach((event) => channel.on('broadcast', { event }, ({ payload }) => onMessage(event, payload || {})));
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') onStatus('online');
      else if (status === 'CLOSED') onStatus('offline');
      else onStatus('error');                     // CHANNEL_ERROR / TIMED_OUT: supabase-js keeps retrying
    });
    return {
      mode: 'supabase',
      send: (event, payload = {}) => channel.send({ type: 'broadcast', event, payload }).catch(() => {}),
      close: () => client.removeChannel(channel),
    };
  }

  window.RemoteLink = { connect, topicFor, configured };
})();
