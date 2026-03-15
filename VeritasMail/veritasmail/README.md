# VeritasMail

**Estensione browser per l’analisi del rischio phishing nelle email Gmail.**  
VeritasMail integra una dashboard di report forense e consigli di prevenzione direttamente nel flusso di lettura della posta, senza bundler né dipendenze esterne (Vanilla JS e CSS).

---

## Panoramica

VeritasMail è un’estensione Chrome/Chromium in **Manifest V3** che:

- Estrae in modo sicuro **mittente**, **oggetto** e **anteprima del corpo** dall’email attualmente aperta in Gmail.
- Invia i dati a un servizio di analisi (configurabile) e riceve un **livello di minaccia** (basso / medio / alto), **red flag** e **consigli di sicurezza**.
- Mostra il risultato in una **dashboard** compatta (popup) con sezioni dedicate a report e educazione alla sicurezza.

I dati non vengono memorizzati in modo permanente; l’analisi è eseguita on demand e le chiamate di rete sono effettuate esclusivamente dal service worker.

---

## Requisiti

- **Browser:** Chrome o altro browser Chromium compatibile con Manifest V3.
- **Sito:** utilizzo su **Gmail** (`https://mail.google.com/*`). L’estensione non modifica le pagine; legge solo il DOM della conversazione aperta.

---

## Installazione

L’estensione si installa in modalità **unpacked** (sviluppo o uso interno).

1. Apri Chrome e vai a **`chrome://extensions/`**.
2. Abilita **Modalità sviluppatore** (interruttore in alto a destra).
3. Clicca **Carica estensione non pacchettizzata**.
4. Seleziona la cartella **`veritasmail`** (la directory che contiene `manifest.json`).
5. VeritasMail apparirà nell’elenco; opzionalmente, fissala nella barra degli strumenti per accedere rapidamente all’icona.

Dopo aver aggiornato l’estensione da codice, ricaricarla da `chrome://extensions/` e, se necessario, ricaricare la scheda Gmail.

---

## Utilizzo

1. Apri **Gmail** e seleziona un messaggio (apri la conversazione in modo che sia visibile il contenuto).
2. Clicca l’**icona VeritasMail** nella barra delle estensioni.
3. Nel popup clicca **Analizza email**.
4. Consulta:
   - **Report di analisi phishing:** livello di minaccia e elenco di red flag.
   - **Educazione e prevenzione:** consigli personalizzati in base all’esito.

Se la scheda attiva non è Gmail o nessuna email è aperta, il popup mostrerà un messaggio esplicito; in tal caso apri un’email in Gmail e riprova.

---

## Configurazione (API e backend)

### API key

- **Opzionale.** Se il backend di analisi richiede autenticazione, apri **Impostazioni** nel popup, inserisci l’API key e clicca **Salva**.
- La key è conservata **solo in locale** in `chrome.storage.local`; non viene trasmessa ad altri servizi oltre al backend configurato.

### Endpoint di analisi

- L’endpoint predefinito è un **placeholder** (`https://api.example.com/analyze`). Per un’analisi reale è necessario sostituirlo con il proprio servizio (es. LLM o threat intelligence) aggiornando la costante `API_BASE` in `background.js`.
- In ambienti sensibili si consiglia un **backend dedicato** che custodisce l’API key e espone un endpoint chiamato dall’estensione, così la key non risiede mai nel client.

### Comportamento senza backend configurato

In assenza di API key o con endpoint placeholder, l’estensione restituisce un **report mock** (livello basso e messaggi informativi) per consentire test e demo senza servizio esterno.

---

## Privacy e sicurezza

| Aspetto | Comportamento |
|--------|----------------|
| **Dati email** | Usati solo in memoria e inviati al servizio di analisi solo al momento dell’avvio dell’analisi. Nessuna persistenza locale dei contenuti. |
| **Permessi** | `activeTab`, `scripting`, `storage` e accesso a `https://mail.google.com/*`. Nessun accesso a tutte le schede né a domini non Gmail. |
| **Chiamate di rete** | Eseguite solo dal **service worker** (background), non dal content script né dalla pagina, per evitare CORS e ridurre la superficie di attacco. |

---

## Architettura e struttura file

```
veritasmail/
├── manifest.json       # Configurazione MV3, permessi, content script, action
├── background.js       # Service worker: messaggi, orchestrazione, chiamate API
├── content.js          # Estrazione dati da Gmail (from, subject, bodyPreview)
├── popup.html          # Markup della dashboard
├── popup.js            # Logica UI e richiesta analisi
├── popup.css            # Stili della dashboard
├── Logo/
│   └── Logo.png        # Logo e icone estensione (16, 48, 128 px scalati da Chrome)
└── README.md
```

- **Content script:** legge il DOM della pagina Gmail e risponde alle richieste del background; non effettua chiamate di rete né memorizza dati.
- **Background:** riceve le richieste dal popup, ottiene i dati dalla tab Gmail (via content script), chiama l’API di analisi e restituisce il risultato al popup.

---

## Test e manutenzione

### Verifica rapida

1. Caricare l’estensione dalla cartella `veritasmail` (vedi [Installazione](#installazione)).
2. Aprire Gmail, aprire un’email, cliccare l’icona VeritasMail e **Analizza email**.
3. Controllare che vengano mostrati report e consigli (anche in modalità mock).

### Estrazione dati da Gmail

L’estrazione si basa sui selettori DOM attuali di Gmail (es. `.hP` per l’oggetto, `.a3s` / `.ii` per il corpo). In caso di modifiche al layout da parte di Google, l’estrazione potrebbe fallire; in tal caso è necessario aggiornare i selettori in `content.js`.

### Icone

Le icone dell’estensione (barra di Chrome e installazione) e il logo nella dashboard sono forniti da **`Logo/Logo.png`**. Chrome scala automaticamente l’immagine alle dimensioni richieste (16, 48, 128 px).

---

## Licenza

Vedi il file `LICENSE` nella root del repository.
