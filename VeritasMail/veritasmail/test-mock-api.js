/**
 * Sanity check: mock API response contract (level, redFlags, tips).
 * Run with: node test-mock-api.js
 * No Chrome APIs required.
 */
function getMockResult() {
  return {
    level: 'low',
    redFlags: ['Nessun red flag rilevato (risposta mock). Configura un endpoint reale e una API key per l\'analisi.'],
    tips: [
      'Verifica sempre il mittente prima di cliccare link o allegati.',
      'Non inserire credenziali in risposta a email non richieste.',
      'In produzione, imposta l\'endpoint di analisi e la API key nelle impostazioni.',
    ],
  };
}

const result = getMockResult();
const ok = result && typeof result.level === 'string' && ['low', 'medium', 'high'].includes(result.level) &&
  Array.isArray(result.redFlags) && Array.isArray(result.tips) &&
  result.tips.length >= 1;
if (!ok) throw new Error('Mock API contract invalid');
console.log('Mock API contract OK:', result.level, result.redFlags.length, 'redFlags', result.tips.length, 'tips');
