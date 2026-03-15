/**
 * VeritasMail service worker — bridge between content/popup and analysis API.
 * Only place that performs network calls. No persistence of email content;
 * API key stored in chrome.storage.local when user sets it (see README).
 */

const API_BASE = 'https://api.example.com'; // Placeholder: replace with real endpoint

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'ANALYZE_EMAIL') {
    handleAnalyzeRequest(sendResponse);
    return true; // async response
  }
  if (message.type === 'SAVE_API_KEY') {
    chrome.storage.local.set({ veritasmailApiKey: message.apiKey || '' }, () => {
      sendResponse({ ok: true });
    });
    return true;
  }
  if (message.type === 'GET_API_KEY') {
    chrome.storage.local.get(['veritasmailApiKey'], (result) => {
      sendResponse({ apiKey: result.veritasmailApiKey || '' });
    });
    return true;
  }
  sendResponse({ ok: false, error: 'Unknown message type' });
  return false;
});

async function handleAnalyzeRequest(sendResponse) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url || !tab.url.startsWith('https://mail.google.com/')) {
      sendResponse({ ok: false, error: 'NO_GMALL_TAB', message: 'Apri un\'email in Gmail e riprova.' });
      return;
    }

    let contentResponse = await tryGetEmailData(tab.id);
    if (!contentResponse && tab.id) {
      try {
        await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
        contentResponse = await tryGetEmailData(tab.id);
      } catch (_) {}
    }

    if (!contentResponse || !contentResponse.ok) {
      sendResponse({
        ok: false,
        error: 'EXTRACT_FAILED',
        message: contentResponse?.error === 'Impossibile estrarre'
          ? 'Apri un\'email in Gmail (clicca su un messaggio) e riprova.'
          : (contentResponse?.error || 'Impossibile leggere l\'email. Ricarica Gmail e riprova.'),
      });
      return;
    }

    const { from, subject, bodyPreview } = contentResponse.payload;
    const { apiKey } = await chrome.storage.local.get(['veritasmailApiKey']);
    const result = await callAnalyzeApi({ from, subject, bodyPreview }, apiKey || '');
    sendResponse({ ok: true, result });
  } catch (err) {
    sendResponse({
      ok: false,
      error: 'ERROR',
      message: err?.message?.includes('Could not establish connection')
        ? 'Ricarica la pagina Gmail, apri un\'email e riprova.'
        : (err?.message || 'Errore di connessione.'),
    });
  }
}

function tryGetEmailData(tabId) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, { type: 'GET_EMAIL_DATA' }, (response) => {
      if (chrome.runtime.lastError) {
        resolve(null);
        return;
      }
      resolve(response);
    });
  });
}

/**
 * Call analysis API. In production use real endpoint + Authorization header.
 * Mock: if no API key or placeholder URL, return mock result for testing.
 */
async function callAnalyzeApi(payload, apiKey) {
  const url = `${API_BASE}/analyze`;
  const isPlaceholder = API_BASE.includes('api.example.com');

  if (isPlaceholder || !apiKey) {
    return getMockResult(payload);
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(res.status === 401 ? 'API key non valida.' : `API non disponibile (${res.status}).`);
  }

  const data = await res.json();
  if (!data || typeof data.level === 'undefined') {
    throw new Error('Risposta API non valida.');
  }
  return {
    level: data.level,
    redFlags: Array.isArray(data.redFlags) ? data.redFlags : [],
    tips: Array.isArray(data.tips) ? data.tips : [],
  };
}

/** Mock result for testing without real API. Do not log email or API key. */
function getMockResult(_payload) {
  return {
    level: 'low',
    redFlags: [
      'Nessun red flag rilevato (risposta mock). Configura un endpoint reale e una API key per l\'analisi.',
    ],
    tips: [
      'Verifica sempre il mittente prima di cliccare link o allegati.',
      'Non inserire credenziali in risposta a email non richieste.',
      'In produzione, imposta l\'endpoint di analisi e la API key nelle impostazioni.',
    ],
  };
}
