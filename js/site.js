/* AmonaVision: page language. Texts come from i18n.js (window.AV). */
(() => {
  'use strict';
  const AV = window.AV;

  function apply() {
    const t = AV.t;
    document.documentElement.lang = AV.lang;
    document.title = t('meta.title');
    document.querySelector('meta[name="description"]').setAttribute('content', t('meta.description'));
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    // Only our own strings from i18n.js, never user input: safe to set as markup.
    document.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
    document.querySelectorAll('[data-i18n-attr]').forEach(el => {
      el.dataset.i18nAttr.split(';').forEach(pair => {
        const [attr, key] = pair.split(':');
        el.setAttribute(attr, t(key));
      });
    });
    document.querySelectorAll('.lang button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === AV.lang)));
  }

  document.querySelectorAll('.lang button').forEach(b => b.addEventListener('click', () => AV.setLang(b.dataset.lang)));
  AV.onLang(apply);
  apply();
})();
