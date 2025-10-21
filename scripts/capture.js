import { pokedex } from "./data/pokedex.js";
import { markAsCaught } from "./app.js";

const feedback = document.querySelector("#capture-feedback");
const backButton = document.querySelector("#back-home");

if (backButton) {
  backButton.addEventListener("click", () => {
    const homeUrl = new URL("./", window.location.href);
    window.location.href = homeUrl.href;
  });
}

processCapture();

function processCapture() {
  if (!feedback) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const linkValue =
    params.get("pokemon") ?? params.get("id") ?? params.get("tag");

  if (!linkValue) {
    feedback.innerHTML = `
      <p class="last-catch__title">Parametres manquants</p>
      <p class="last-catch__subtitle">
        Ajoute <code>?pokemon=bulbizarre</code> (ou <code>?tag=...</code>) a l'URL.
      </p>
    `;
    return;
  }

  const match = findPokemon(linkValue);
  if (!match) {
    feedback.innerHTML = `
      <p class="last-catch__title">Pokemon inconnu</p>
      <p class="last-catch__subtitle">
        Aucun Pokemon ne correspond a "${sanitize(linkValue)}".
        Mets a jour le fichier <code>scripts/data/pokedex.js</code>.
      </p>
    `;
    return;
  }

  markAsCaught(match.id);

  feedback.innerHTML = `
    <p class="last-catch__title">${match.name} capture !</p>
    <p class="last-catch__subtitle">
      Cette capture est enregistree sur cet appareil.
    </p>
  `;
}

function findPokemon(value) {
  const normalizedId = normalizePokemonId(value);
  const byId = pokedex.find(
    (p) => normalizePokemonId(p.id) === normalizedId
  );
  if (byId) {
    return byId;
  }

  const normalizedTag = normalizeTagId(value);
  return pokedex.find((pokemon) =>
    (pokemon.tagIds ?? []).some(
      (tag) => normalizeTagId(tag) === normalizedTag
    )
  );
}

function normalizePokemonId(value) {
  return String(value).trim().toLowerCase();
}

function normalizeTagId(value) {
  return String(value).trim().toUpperCase();
}

function sanitize(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}
