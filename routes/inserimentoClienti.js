const db = require("../db");
const fs = require("fs");
const path = require("path");


// ✅ Carica dati da JSON unico
const data = JSON.parse(fs.readFileSync(path.join(__dirname, "../public/JSON/Percentuali_generazione.json"), "utf8"));
const gruppi = data.gruppi;
const NUM_CLIENTI = data.numero_clienti_totali;
const CLIENTI_PER_GRUPPO = Math.floor(NUM_CLIENTI / gruppi.length);

db.serialize(() => {
    const insertCliente = db.prepare(`
    INSERT INTO clienti (ragione_sociale, indirizzo, email, ore_acquistate, ore_residue)
    VALUES (?, ?, ?, ?, ?)
  `);

    const clientiInseriti = [];

    gruppi.forEach((gruppo, gIndex) => {
        for (let i = 0; i < CLIENTI_PER_GRUPPO; i++) {
            const n = gIndex * CLIENTI_PER_GRUPPO + i + 1;
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

    let completed = 0;

    const insertNext = () => {
        if (completed >= clientiInseriti.length) {
            insertCliente.finalize(() => {
                console.log("✅ Tutti i clienti e interventi inseriti.");
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


const randomOreAcquistate = () =>
    Math.floor(Math.random() * 100) + 1;

const randomPercentuale = (min, max)
    + (Math.random() * (max - min) + min).toFixed(3);

function generaInterventi(totaleOre) {
    const interventi = [];
    let oreRimanenti = totaleOre;
    let giorno = 1;

    while (oreRimanenti > 0) {
        const ore = Math.min(oreRimanenti, Math.floor(Math.random() * 5) + 1);
        interventi.push({
            tipo_servizio: `Intervento ${interventi.length + 1}`,
            ore_utilizzate: ore,
            data: `2025-07-${String(giorno++).padStart(2, "0")} 10:00:00`
        });
        oreRimanenti -= ore;
    }

    return interventi;
}

module.exports = {
    randomOreAcquistate,
    randomPercentuale,
    generaInterventi
};
