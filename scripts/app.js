import { pokedex } from "./data/pokedex.js";

const storageKey = "safari-nfc-progress-v1";

const captureStatusMessage = document.querySelector(
  "#capture-status-message"
);
const lastCatch = document.querySelector("#last-catch");
const pokedexGrid = document.querySelector("#pokedex-grid");
const progressFill = document.querySelector("#progress-fill");
const progressSummary = document.querySelector("#progress-summary");
const resetButton = document.querySelector("#reset-progress");

let caughtSet = loadProgress();
let highlightedPokemonId = null;

hydrateFromQuery();
renderPokedex();
updateProgress();
focusLinkedCard();

if (resetButton) {
  resetButton.addEventListener("click", () => {
    const confirmed = window.confirm(
      "Es-tu sur de vouloir effacer ta progression locale ?"
    );

    if (!confirmed) {
      return;
    }

    caughtSet.clear();
    persistProgress();
    highlightedPokemonId = null;
    renderDefaultCaptureMessage();
    renderPokedex();
    updateProgress();
  });
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      return new Set();
    }
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch (error) {
    console.warn("Impossible de lire la progression:", error);
    return new Set();
  }
}

function persistProgress() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(Array.from(caughtSet)));
  } catch (error) {
    console.warn("Impossible d'enregistrer la progression:", error);
  }
}

function renderPokedex() {
  if (!pokedexGrid) {
    return;
  }

  const cards = pokedex
    .map((pokemon) => {
      const caught = caughtSet.has(pokemon.id);
      const highlighted = highlightedPokemonId === pokemon.id;
      const typeList = pokemon.types ? pokemon.types.join(" / ") : "Inconnu";
      const hint = pokemon.hint ?? "Indice a definir.";

      return `
        <article class="pokemon-card${caught ? " caught" : ""}${highlighted ? " highlighted" : ""}" data-id="${pokemon.id}">
          <h3>${pokemon.number ? `${pokemon.number} - ` : ""}${pokemon.name}</h3>
          <p><strong>Type :</strong> ${typeList}</p>
          <p><strong>Lieu :</strong> ${pokemon.habitat ?? "A definir"}</p>
          <p>${hint}</p>
        </article>
      `;
    })
    .join("");

  pokedexGrid.innerHTML = cards;
}

function findPokemonByTag(candidates) {
  if (!candidates.size) {
    return null;
  }

  const normalizedCandidates = new Set(
    Array.from(candidates).map((value) => normalizeTagId(value))
  );

  return pokedex.find((pokemon) =>
    (pokemon.tagIds ?? []).some((tag) =>
      normalizedCandidates.has(normalizeTagId(tag))
    )
  );
}

function normalizeTagId(value) {
  return String(value).trim().toUpperCase();
}

function normalizePokemonId(value) {
  return String(value).trim().toLowerCase();
}

function findPokemonById(value) {
  if (!value) {
    return null;
  }
  const target = normalizePokemonId(value);
  return pokedex.find((pokemon) => normalizePokemonId(pokemon.id) === target);
}

function updateProgress() {
  if (!progressFill || !progressSummary) {
    return;
  }
  const total = pokedex.length;
  const caught = caughtSet.size;
  const percent = total === 0 ? 0 : Math.round((caught / total) * 100);
  progressFill.style.width = `${percent}%`;
  progressSummary.textContent = `${caught} / ${total} Pokemon captures (${percent} %)`;
}

function focusLinkedCard() {
  if (!highlightedPokemonId || !pokedexGrid) {
    return;
  }
  const card = pokedexGrid.querySelector(`[data-id="${highlightedPokemonId}"]`);
  if (card) {
    card.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

function hydrateFromQuery() {
  if (!lastCatch || !captureStatusMessage) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const linkedParam =
    params.get("pokemon") ?? params.get("id") ?? params.get("tag");

  if (!linkedParam) {
    renderDefaultCaptureMessage();
    return;
  }

  const byId = findPokemonById(linkedParam);
  const byTag = findPokemonByTag(new Set([linkedParam]));
  const match = byId ?? byTag;

  if (!match) {
    captureStatusMessage.textContent = `Aucun Pokemon ne correspond a "${linkedParam}". Verifie ton URL ou mets a jour la configuration.`;
    lastCatch.innerHTML = `
      <p class="last-catch__title">Tag non reconnu</p>
      <p class="last-catch__subtitle">Ajoute cet identifiant dans la configuration si besoin.</p>
    `;
    return;
  }

  highlightedPokemonId = match.id;

  if (!caughtSet.has(match.id)) {
    caughtSet.add(match.id);
    persistProgress();
  }

  captureStatusMessage.textContent = `${match.name} capture via URL NFC.`;
  lastCatch.innerHTML = `
    <p class="last-catch__title">${match.name} rejoint ton equipe !</p>
    <p class="last-catch__subtitle">Indice: ${match.hint ?? "A completer."}</p>
  `;
}

function renderDefaultCaptureMessage() {
  if (captureStatusMessage) {
    captureStatusMessage.textContent =
      "Aucune capture detectee pour le moment. Scanne une figurine pour commencer.";
  }
  if (lastCatch) {
    lastCatch.innerHTML = `
      <p class="last-catch__title">Pas encore de Pokemon capture.</p>
      <p class="last-catch__subtitle">Tu en verras le resume ici.</p>
    `;
  }
}
