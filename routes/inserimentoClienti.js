const db = require("../db");
const fs = require("fs");
const path = require("path");

// ✅ Costante: numero utente che ha creato i dati (solo console.log, non va nel DB)
const USER_ID_CREAZIONE = parseInt(process.argv[2] || "1");

// ✅ FUNZIONI UTILI
const randomOreAcquistate = () =>
    Math.floor(Math.random() * 100) + 1;

const randomPercentuale = (min, max) =>
    +(Math.random() * (max - min) + min).toFixed(3);


function generaInterventi(totaleOre) {
    const interventi = [];
    let oreRimanenti = totaleOre;
    let giorno = 1;

    while (oreRimanenti > 0) {
        const ore = Math.min(oreRimanenti, Math.floor(Math.random() * 5) + 1);
        interventi.push({
            tipo_servizio: `Intervento numero ${interventi.length + 1}`,
            ore_utilizzate: ore,
            data: `2025-07-${String(giorno++).padStart(2, "0")} 10:00:00`
        });
        oreRimanenti -= ore;
    }

    return interventi;
}

// ✅ Carica dati da JSON
const data = JSON.parse(fs.readFileSync(path.join(__dirname, "../public/JSON/Percentuali_generazione.json"), "utf8"));
const gruppi = data.gruppi;
const NUM_CLIENTI = data.numero_clienti_totali;

// ✅ Calcolo distribuzione clienti
const CLIENTI_PER_GRUPPO_BASE = Math.floor(NUM_CLIENTI / gruppi.length);
const RESTO = NUM_CLIENTI % gruppi.length;

const clientiInseriti = [];

gruppi.forEach((gruppo, gIndex) => {
    const clientiDaCreare = CLIENTI_PER_GRUPPO_BASE + (gIndex < RESTO ? 1 : 0);

    for (let i = 0; i < clientiDaCreare; i++) {
        const n = clientiInseriti.length + 1;
        const oreAcquistate = randomOreAcquistate();
        const percentuale = randomPercentuale(gruppo.range[0], gruppo.range[1]);
        const oreUsate = +(oreAcquistate * percentuale).toFixed(1);
        const oreResidue = +(oreAcquistate - oreUsate).toFixed(1);
        const interventi = oreUsate > 0 ? generaInterventi(oreUsate) : [];

        clientiInseriti.push({
            ragione_sociale: `Cliente ${n}`,
            indirizzo: `Via Cliente ${n}`,
            email: `cliente${n}@mail.com`,
            ore_acquistate: oreAcquistate,
            ore_residue: oreResidue,
            interventi,
            status: gruppo.status
        });
    }
});

// ✅ Inserimento nel DB
db.serialize(() => {
    const insertCliente = db.prepare(`
        INSERT INTO clienti (ragione_sociale, indirizzo, email, ore_acquistate, ore_residue)
        VALUES (?, ?, ?, ?, ?)
    `);

    let completed = 0;

    const insertNext = () => {
        if (completed >= clientiInseriti.length) {
            insertCliente.finalize(() => {
                console.log(`\n✅ Tutti i ${NUM_CLIENTI} clienti e relativi interventi inseriti`);
                db.close();
            });
            return;
        }

        const cliente = clientiInseriti[completed];
        insertCliente.run(
            cliente.ragione_sociale,
            cliente.indirizzo,
            cliente.email,
            cliente.ore_acquistate,
            cliente.ore_residue,
            function () {
                const clienteId = this.lastID;

                // 🧾 Log dettagliato per ogni cliente
                console.log(`   ➕ ${cliente.ragione_sociale}`);
                console.log(`      📍 Indirizzo: ${cliente.indirizzo}`);
                console.log(`      📧 Email: ${cliente.email}`);
                console.log(`      ⏱️ Ore acquistate: ${cliente.ore_acquistate}`);
                console.log(`      🔄 Ore residue: ${cliente.ore_residue}`);

                if (cliente.interventi.length > 0) {
                    console.log(`      📋 Interventi creati per questo cliente:`);
                    cliente.interventi.forEach((int, idx) => {
                        console.log(`         #${idx + 1}: ${int.tipo_servizio} - ${int.ore_utilizzate}h il ${int.data}`);
                    });
                } else {
                    console.log(`      ⚠️ Nessun intervento generato per questo cliente.`);
                }

                if (cliente.interventi.length === 0) {
                    completed++;
                    insertNext();
                    return;
                }

                const insertIntervento = db.prepare(`
                    INSERT INTO interventi (cliente_id, tipo_servizio, ore_utilizzate, data_intervento)
                    VALUES (?, ?, ?, ?)
                `);

                let done = 0;
                cliente.interventi.forEach((int) => {
                    insertIntervento.run(
                        clienteId,
                        int.tipo_servizio,
                        int.ore_utilizzate,
                        int.data,
                        () => {
                            done++;
                            if (done === cliente.interventi.length) {
                                insertIntervento.finalize();
                                completed++;
                                insertNext();
                            }
                        }
                    );
                });
            }
        );
    };

    insertNext();
});

module.exports = {
    randomOreAcquistate,
    randomPercentuale,
    generaInterventi
};
