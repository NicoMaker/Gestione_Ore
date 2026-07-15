// ==================== CONFIG · STATO GLOBALE & RIFERIMENTI DOM ====================
// Global variables
let currentAction = null;
const editingClientId = null;
const originalClientData = {};

// DOM elements
const formCliente = document.getElementById("form-cliente");
const formIntervento = document.getElementById("form-intervento");
const tabellaClienti = document.getElementById("tabella-clienti");
const clienteSelect = document.getElementById("cliente_id");
const oreUtilizzateInput = document.getElementById("ore_utilizzate");
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modal-title");
const modalMessage = document.getElementById("modal-message");
const modalConfirm = document.getElementById("modal-confirm");
const modalCancel = document.getElementById("modal-cancel");
const alert = document.getElementById("alert");
const alertMessage = document.getElementById("alert-message");
const alertClose = document.getElementById("alert-close");

// Navigation
const hamburger = document.querySelector(".hamburger");
const navMenu = document.querySelector(".nav-menu");

// --- Ricerca Clienti nella select ---
const searchClientiInput = document.getElementById("search-clienti");
const dipendentiSearchGroup = document.getElementById(
  "dipendenti-search-group",
);
const searchDipendentiInput = document.getElementById("search-dipendenti");
const listaDipendenti = document.getElementById("lista-dipendenti");
const searchListaClientiInput = document.getElementById("search-lista-clienti");

let clientiList = [];
let dipendentiList = [];

let statusFilter = [
  "status-success",
  "status-warning",
  "status-light-danger",
  "status-danger",
];
