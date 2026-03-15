/**
 * VeritasMail content script — Gmail DOM extraction only.
 * Single responsibility: read from DOM only the data needed (from, subject, body)
 * for the currently visible email. No analysis, no network, no persistence.
 */

(function () {
  'use strict';

  const BODY_MAX_CHARS = 5000; // Truncate body for API; avoid sending huge payloads

  /**
   * Safely get text content, trimmed. Prefer text over raw HTML for privacy.
   */
  function getText(el) {
    if (!el || !el.textContent) return '';
    return el.textContent.trim();
  }

  /**
   * Extract sender (From) — multiple fallbacks for Gmail layout changes.
   */
  function extractFrom() {
    const byEmail = document.querySelector('span[email]');
    if (byEmail) return (byEmail.getAttribute('email') || getText(byEmail)).trim();

    const byHovercard = document.querySelector('[data-hovercard-id]');
    if (byHovercard) return (byHovercard.getAttribute('data-hovercard-id') || getText(byHovercard)).trim();

    const fromLabels = ['From', 'Da', 'From:', 'Da:'];
    for (const label of fromLabels) {
      const spans = document.querySelectorAll('span');
      for (const s of spans) {
        if (s.textContent.trim() === label || s.textContent.trim().startsWith(label)) {
          const next = s.nextElementSibling || s.parentElement?.nextElementSibling;
          if (next) return getText(next);
          const parent = s.closest('div');
          if (parent) {
            const addr = parent.querySelector('[email], [data-email]');
            if (addr) return (addr.getAttribute('email') || addr.getAttribute('data-email') || getText(addr)).trim();
            return getText(parent);
          }
        }
      }
    }

    const gD = document.querySelector('.gD');
    if (gD) return getText(gD);

    const gE = document.querySelector('.gE');
    if (gE) return getText(gE);

    return '';
  }

  /**
   * Extract subject — thread view title / subject line. Gmail uses .hP.
   */
  function extractSubject() {
    const hP = document.querySelector('.hP');
    if (hP) return getText(hP);

    const hPAll = document.getElementsByClassName('hP');
    if (hPAll.length) return getText(hPAll[0]);

    const h2 = document.querySelector('h2[data-thread-perm-id], h2.PX, [role="main"] h2');
    if (h2) return getText(h2);

    const subj = document.querySelector('[data-legacy-message-id] ~ div span');
    if (subj) return getText(subj);

    return '';
  }

  /**
   * Extract body preview — main message content. Gmail uses .a3s (body) and .ii (message content).
   */
  function extractBody() {
    const selectors = [
      '.a3s.aiL',
      'div.a3s',
      '[role="listitem"] .a3s',
      '.ii.gt',
      '.ii',
      '[data-message-id] .ii.gt',
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) {
        const raw = getText(el);
        if (raw.length > 0) {
          return raw.length > BODY_MAX_CHARS ? raw.slice(0, BODY_MAX_CHARS) + '…' : raw;
        }
      }
    }
    const iiAll = document.getElementsByClassName('ii');
    if (iiAll.length) {
      const raw = getText(iiAll[iiAll.length - 1]);
      if (raw.length > 0) return raw.length > BODY_MAX_CHARS ? raw.slice(0, BODY_MAX_CHARS) + '…' : raw;
    }
    const a3sAll = document.getElementsByClassName('a3s');
    if (a3sAll.length) {
      const raw = getText(a3sAll[a3sAll.length - 1]);
      if (raw.length > 0) return raw.length > BODY_MAX_CHARS ? raw.slice(0, BODY_MAX_CHARS) + '…' : raw;
    }
    return '';
  }

  /**
   * Single entry: build payload and send to background. No storage, no API key.
   * Consider success if we have at least subject or body (from is optional).
   */
  function getEmailData() {
    const payload = {
      from: extractFrom(),
      subject: extractSubject(),
      bodyPreview: extractBody(),
    };

    const hasAny = payload.from || payload.subject || payload.bodyPreview;
    if (!hasAny) {
      return { ok: false, error: 'Impossibile estrarre', payload };
    }
    return { ok: true, payload };
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type !== 'GET_EMAIL_DATA') {
      sendResponse({ ok: false, error: 'Unknown message type' });
      return;
    }
    try {
      const result = getEmailData();
      sendResponse(result);
    } catch (err) {
      sendResponse({ ok: false, error: 'Impossibile estrarre', payload: null });
    }
    return true; // keep channel open for async sendResponse
  });
})();
