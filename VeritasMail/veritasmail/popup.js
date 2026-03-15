/**
 * VeritasMail popup — request analysis from background, show report and tips.
 * No permanent storage of reports; only in-memory for session.
 */

(function () {
  'use strict';

  const states = {
    empty: 'state-empty',
    loading: 'state-loading',
    error: 'state-error',
    report: 'state-report',
  };

  const els = {
    stateEmpty: document.getElementById('state-empty'),
    stateLoading: document.getElementById('state-loading'),
    stateError: document.getElementById('state-error'),
    stateReport: document.getElementById('state-report'),
    errorMessage: document.getElementById('error-message'),
    levelBadge: document.getElementById('level-badge'),
    redFlags: document.getElementById('red-flags'),
    tipsList: document.getElementById('tips-list'),
    btnAnalyze: document.getElementById('btn-analyze'),
    btnRetry: document.getElementById('btn-retry'),
    btnAnalyzeAgain: document.getElementById('btn-analyze-again'),
    btnSaveKey: document.getElementById('btn-save-key'),
    apiKeyInput: document.getElementById('api-key'),
  };

  function showState(name) {
    Object.values(states).forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.hidden = id !== name;
    });
  }

  function showError(message) {
    if (els.errorMessage) els.errorMessage.textContent = message;
    showState(states.error);
  }

  function showReport(result) {
    const level = (result.level || 'low').toLowerCase();
    const levelLabels = { low: 'Basso', medium: 'Medio', high: 'Alto' };
    const levelLabel = levelLabels[level] || level;

    if (els.levelBadge) {
      els.levelBadge.textContent = levelLabel;
      els.levelBadge.className = 'level-badge level-' + (level === 'high' ? 'high' : level === 'medium' ? 'medium' : 'low');
    }

    if (els.redFlags) {
      els.redFlags.innerHTML = '';
      (result.redFlags || []).forEach((text) => {
        const li = document.createElement('li');
        li.textContent = text;
        els.redFlags.appendChild(li);
      });
    }

    if (els.tipsList) {
      els.tipsList.innerHTML = '';
      (result.tips || []).forEach((text) => {
        const li = document.createElement('li');
        li.textContent = text;
        els.tipsList.appendChild(li);
      });
    }

    showState(states.report);
  }

  function runAnalysis() {
    showState(states.loading);
    chrome.runtime.sendMessage({ type: 'ANALYZE_EMAIL' }, (response) => {
      if (chrome.runtime.lastError) {
        showError('Errore di connessione con l\'estensione.');
        return;
      }
      if (!response) {
        showError('Nessuna risposta. Riprova.');
        return;
      }
      if (!response.ok) {
        showError(response.message || response.error || 'Si è verificato un errore.');
        return;
      }
      showReport(response.result);
    });
  }

  els.btnAnalyze?.addEventListener('click', runAnalysis);
  els.btnRetry?.addEventListener('click', runAnalysis);
  els.btnAnalyzeAgain?.addEventListener('click', runAnalysis);

  els.btnSaveKey?.addEventListener('click', () => {
    const key = els.apiKeyInput?.value?.trim() || '';
    chrome.runtime.sendMessage({ type: 'SAVE_API_KEY', apiKey: key }, () => {
      if (els.apiKeyInput) els.apiKeyInput.value = '';
      els.apiKeyInput?.setAttribute('placeholder', key ? 'Salvata.' : 'Rimossa.');
    });
  });

  chrome.storage.local.get(['veritasmailApiKey'], (result) => {
    if (result.veritasmailApiKey && els.apiKeyInput) {
      els.apiKeyInput.placeholder = '•••••••• (già impostata)';
    }
  });

  showState(states.empty);
})();
