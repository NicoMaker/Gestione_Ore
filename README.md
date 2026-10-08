# Gestione Ore — v2.0

Gestione delle ore acquistate dai clienti e degli interventi di assistenza (Node.js, Express 5, SQLite).

## Avvio

```bash
cd backend
npm install
cp .env.example .env     # imposta PORT (default 3000)
npm start                # oppure: npm run dev
npm run seed             # (opzionale) dati di esempio
```

Apri `http://localhost:3000`. Controllo di stato: `GET /health`.

## Novità della v2.0

- **Fix Linux/macOS/Docker**: le cartelle `frontend/CSS|HTML|JS` sono ora `css|html|js`, coerenti con i percorsi del server (prima funzionava solo su file system case-insensitive).
- **Dipendenze**: Express 5, Multer 2, rimosso `body-parser` (ora `express.json()` / `express.urlencoded()`); Node ≥ 20.
- **Server**: header di sicurezza di base, `x-powered-by` disattivato, SQLite in modalità WAL, chiusura ordinata su `SIGINT`/`SIGTERM`.
- **Ambiente**: il file `.env` non è più nel repository (c'è `.env.example`); `.gitignore` corretto.
- **Interfaccia**: nuovo `frontend/css/theme.css` con modalità scura automatica, focus da tastiera visibile, tabelle più leggibili, rispetto di `prefers-reduced-motion` e favicon incorporata (niente più dipendenza da un sito esterno).
