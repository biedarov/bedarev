// Accounts and plans, shared by the landing page and the app: Supabase Auth in the browser,
// payments through the "billing" Edge Function (it holds the Stripe key, the browser never does).
(function () {
  'use strict';
  const C = window.BM_CONFIG;
  // the site root is the folder above this script: <root>/assets/account.js
  const ROOT = ((document.currentScript && document.currentScript.src) || location.href).replace(/assets\/account\.js.*$/, '');
  const sb = window.supabase.createClient(C.url, C.key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
  const store = {
    get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } },
    del: k => { try { localStorage.removeItem(k); } catch (e) { /* storage blocked */ } },
  };
  const lang = () => (store.get('bm_lang') === 'en' ? 'en' : 'ru');
  const RANK = { none: 0, free: 1, pro: 2, max: 3 };
  let session = null, plan = 'none';
  const subs = [];
  const emit = ev => subs.forEach(f => { try { f(ev); } catch (e) { console.error(e); } });
  // the last known plan, so the page does not flash "free" while the real one loads
  const cachedPlan = uid => { try { const c = JSON.parse(store.get('bm_plan')); return c && c.uid === uid ? c.plan : 'free'; } catch (e) { return 'free'; } };
  // a saved session means a known user: start from their cached plan before Supabase restores the session
  try { const t = JSON.parse(store.get('sb-' + new URL(C.url).hostname.split('.')[0] + '-auth-token')); if (t && t.user) plan = cachedPlan(t.user.id); } catch (e) { /* no saved session */ }

  async function refreshPlan() {
    if (!session) { plan = 'none'; return plan; }
    const { data, error } = await sb.rpc('my_plan');
    if (error || !data) return plan;
    store.set('bm_plan', JSON.stringify({ uid: session.user.id, plan: data }));
    if (data !== plan) { plan = data; emit('plan'); }
    return plan;
  }

  const ready = new Promise(resolve => {
    sb.auth.onAuthStateChange((event, s) => {
      const was = session ? session.user.id : null;
      session = s || null;
      if (!session) { plan = 'none'; if (event === 'SIGNED_OUT') store.del('bm_plan'); }
      else if (was !== session.user.id) plan = cachedPlan(session.user.id);
      if (event === 'INITIAL_SESSION') resolve(session);
      // Supabase asks not to await other calls inside this callback
      if (session && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN')) setTimeout(refreshPlan, 0);
      emit(event);
    });
  });

  async function billing(action, extra) {
    const body = Object.assign({ action, lang: lang(), return_url: location.origin + location.pathname }, extra || {});
    const { data, error } = await sb.functions.invoke('billing', { body });
    if (error) {
      let msg = error.message;
      try { const j = await error.context.json(); msg = j.message || j.error || msg; } catch (e) { /* not JSON */ }
      throw new Error(msg);
    }
    return data;
  }

  // screenshots and local demos only: on this machine the seed page can open the app without an account
  if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname) && store.get('bm_demo') === '1') {
    const user = { id: 'demo', email: 'demo@localhost' }, dp = store.get('bm_demo_plan') || 'max'; // bm_demo_plan: preview another plan
    window.BM = { sb, demo: true, ready: Promise.resolve({ user }), root: ROOT, test: !!C.test, cloud: false, session: { user }, user, plan: dp, has: need => RANK[dp] >= RANK[need], on: () => { }, refreshPlan: async () => dp,
      signOut: async () => store.del('bm_demo'), subscriptions: async () => [], accountData: async () => ({ account: user }), afterCheckout: () => { },
      portal: async () => { }, checkout: async () => { }, syncBilling: async () => 'max', deleteAccount: async () => store.del('bm_demo') };
    return;
  }
  window.BM = {
    sb, ready, root: ROOT, test: !!C.test, cloud: !!C.cloud,
    get session() { return session; },
    get user() { return session ? session.user : null; },
    get plan() { return plan; },
    has: need => RANK[plan] >= RANK[need],
    on: f => subs.push(f),
    refreshPlan,
    signUp: (email, password, meta) => sb.auth.signUp({ email, password, options: { emailRedirectTo: ROOT + '?welcome=1', data: meta } }),
    signIn: (email, password) => sb.auth.signInWithPassword({ email, password }),
    signOut: () => sb.auth.signOut(),
    resetPassword: email => sb.auth.resetPasswordForEmail(email, { redirectTo: ROOT + '?reset=1' }),
    updatePassword: password => sb.auth.updateUser({ password }),
    checkout: async (p, interval) => { const d = await billing('checkout', { plan: p, interval }); location.href = d.url; },
    portal: async () => { const d = await billing('portal'); location.href = d.url; },
    syncBilling: async () => { await billing('sync'); return refreshPlan(); },
    deleteAccount: async () => { await billing('delete-account'); store.del('bm_plan'); await sb.auth.signOut(); },
    subscriptions: async () => (await sb.from('subscriptions').select('plan, billing_interval, status, current_period_end, cancel_at_period_end, created_at').order('updated_at', { ascending: false })).data || [],
    // everything the server keeps about the account (GDPR: right of access / portability)
    accountData: async () => {
      const u = session ? session.user : null; if (!u) return null;
      const [p, s] = await Promise.all([sb.from('profiles').select('*').maybeSingle(), sb.from('subscriptions').select('*')]);
      return { account: { id: u.id, email: u.email, created_at: u.created_at, last_sign_in_at: u.last_sign_in_at }, profile: p.data, subscriptions: s.data || [] };
    },
    // back from Stripe Checkout: ?checkout=success|cancel
    afterCheckout: async cb => {
      const m = location.search.match(/[?&]checkout=(success|cancel)/); if (!m) return;
      history.replaceState(null, '', location.pathname + location.hash);
      await ready;
      if (m[1] === 'success') { try { await window.BM.syncBilling(); } catch (e) { console.error(e); } }
      cb(m[1], plan);
    },
  };
})();
