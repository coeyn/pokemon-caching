import { pokedex } from "./data/pokedex.js";

const storageKey = "pokemon-caching-progress-v1";

const pokedexGrid = document.querySelector("#pokedex-grid");
const progressFill = document.querySelector("#progress-fill");
const progressSummary = document.querySelector("#progress-summary");
const resetButton = document.querySelector("#reset-progress");

let caughtSet = loadProgress();

renderPokedex();
updateProgress();

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
      const typeList = pokemon.types ? pokemon.types.join(" / ") : "Inconnu";
      const hint = pokemon.hint ?? "Indice a definir.";

      return `
        <article class="pokemon-card${caught ? " caught" : ""}" data-id="${pokemon.id}">
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

export function markAsCaught(pokemonId) {
  caughtSet.add(pokemonId);
  persistProgress();
  renderPokedex();
  updateProgress();
}
