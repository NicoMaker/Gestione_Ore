async function caricaClienti() {
    const res = await fetch('/api/clienti');
    const data = await res.json();
    const tbody = document.querySelector('#tabella-clienti tbody');
    const select = document.getElementById('cliente_id');
    tbody.innerHTML = '';
    select.innerHTML = '<option value="">-- Seleziona Cliente --</option>';

    data.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.ragione_sociale;
        opt.dataset.oreResidue = c.ore_residue;
        select.appendChild(opt);

        const oreUtilizzate = (c.ore_acquistate - c.ore_residue).toFixed(1);
        const statoColore = c.ore_residue > 0 ? 'green' : 'red';
        const statoIcona = `<span style="font-size:1.2rem; color:${statoColore};">●</span>`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
        <td><input type="text" value="${c.ragione_sociale}"></td>
        <td><input type="text" value="${c.indirizzo}"></td>
        <td><input type="email" value="${c.email}"></td>
        <td><input type="number" step="0.1" value="${c.ore_acquistate}"></td>
        <td class="red">${oreUtilizzate}</td>
        <td class="green">${c.ore_residue.toFixed(1)}</td>
        <td>${statoIcona}</td>
        <td>
            <button type="button" onclick="salvaCliente(${c.id}, this)">Salva</button>
            <form onsubmit="return confermaEliminazione()" action="/delete_cliente/${c.id}" method="post" style="display:inline;">
                <input type="submit" value="Elimina" class="secondary">
            </form>
            <a href="/report_cliente/${c.id}" target="_blank" style="text-decoration:none; display:inline-block; margin-top:4px;">
                <button type="button" class="secondary">Stampa Report</button>
            </a>
        </td>
        `;
        tbody.appendChild(tr);
    });
}

const confermaEliminazione = () => confirm('Sei sicuro di voler eliminare il cliente?');

function salvaCliente(id, btn) {
    const tr = btn.closest('tr');
    const inputs = tr.querySelectorAll('input');
    const dati = {
        ragione_sociale: inputs[0].value,
        indirizzo: inputs[1].value,
        email: inputs[2].value,
        ore_acquistate: parseFloat(inputs[3].value)
    };
    fetch(`/update_cliente/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(dati)
    }).then(() => caricaClienti());
}

document.getElementById('form-cliente').addEventListener('submit', e => {
    e.preventDefault();
    const dati = new URLSearchParams(new FormData(e.target));
    fetch('/add_cliente', {
        method: 'POST',
        body: dati
    }).then(() => {
        e.target.reset();
        caricaClienti();
    });
});

document.getElementById('form-intervento').addEventListener('submit', e => {
    e.preventDefault();
    const form = new FormData(e.target);
    const cliente_id = form.get('cliente_id');
    const ore_utilizzate = parseFloat(form.get('ore_utilizzate'));

    const selectedOption = e.target.cliente_id.selectedOptions[0];
    const ore_residue = parseFloat(selectedOption.dataset.oreResidue);

    if (isNaN(ore_residue)) {
        alert("Errore: ore residue non disponibili.");
        return;
    }

    if (ore_utilizzate > ore_residue) {
        alert(`Non puoi registrare quelle ore: residue disponibili ${ore_residue}`);
        return;
    }

    fetch('/add_intervento', {
        method: 'POST',
        body: new URLSearchParams(form)
    }).then(() => {
        e.target.reset();
        caricaClienti();
    });
});

function confermaEliminazioneTotale() {
    if (confirm("Confermi l'eliminazione di TUTTI I DATI?")) {
        fetch('/delete_all', { method: 'POST' }).then(() => {
            alert('Tutti i dati eliminati');
            caricaClienti();
        });
    }
}

// Avvio iniziale
caricaClienti();
