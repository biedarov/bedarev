// legal pages: the same language as the landing, switchable
(() => {
  const get = () => { try { return localStorage.getItem('bm_lang'); } catch (e) { return null; } };
  const set = l => { document.documentElement.dataset.lang = l; document.documentElement.lang = l; try { localStorage.setItem('bm_lang', l); } catch (e) { /* ignore */ } };
  set(get() || 'en'); // English unless the visitor chose Russian
  document.querySelector('.lang').addEventListener('click', () => set(document.documentElement.dataset.lang === 'en' ? 'ru' : 'en'));
})();
