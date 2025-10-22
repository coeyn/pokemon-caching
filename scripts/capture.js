import { pokedex } from "./data/pokedex.js";
import { markAsCaught } from "./app.js";
import { getPokemonImageUrl } from "./utils/pokemonAssets.js";
import { haversineDistanceMeters, formatDistance } from "./utils/geo.js";

const feedback = document.querySelector("#capture-feedback");
const backButton = document.querySelector("#back-home");

if (backButton) {
  backButton.addEventListener("click", () => {
    const homeUrl = new URL("./", window.location.href);
    window.location.href = homeUrl.href;
  });
}

processCapture();

async function processCapture() {
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

  try {
    await validateGeolocation(match);
  } catch (error) {
    feedback.innerHTML = `
      <p class="last-catch__title">Localisation requise</p>
      <p class="last-catch__subtitle">
        ${sanitize(error.message)}
      </p>
    `;
    addRetryButton();
    return;
  }

  markAsCaught(match.id);

  const imageUrl = getPokemonImageUrl(match);

  feedback.innerHTML = `
    ${
      imageUrl
        ? `<img class="pokemon-card__image" src="${imageUrl}" alt="Illustration de ${match.name}" onerror="this.remove()" />`
        : ""
    }
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

function addRetryButton() {
  if (!feedback || feedback.querySelector("#retry-capture")) {
    return;
  }
  const button = document.createElement("button");
  button.id = "retry-capture";
  button.type = "button";
  button.textContent = "Reessayer";
  button.addEventListener("click", () => {
    feedback.innerHTML = `
      <p class="last-catch__title">Nouvelle tentative...</p>
      <p class="last-catch__subtitle">
        Autorise l'acces a ta position pour capturer ce Pokemon.
      </p>
    `;
    processCapture();
  });
  feedback.appendChild(button);
}

function getCaptureRadiusMeters(pokemon) {
  const fallback = 50;
  if (!pokemon || typeof pokemon.captureRadiusMeters !== "number") {
    return fallback;
  }
  return pokemon.captureRadiusMeters;
}

async function validateGeolocation(pokemon) {
  if (!pokemon.coordinates) {
    return;
  }

  if (!("geolocation" in navigator)) {
    throw new Error(
      "Ton appareil ne supporte pas la geolocalisation. Capture impossible."
    );
  }

  const position = await requestCurrentPosition();
  const { latitude, longitude } = position.coords;
  const distance = haversineDistanceMeters(
    latitude,
    longitude,
    pokemon.coordinates.latitude,
    pokemon.coordinates.longitude
  );
  const radius = getCaptureRadiusMeters(pokemon);

  if (!Number.isFinite(distance)) {
    throw new Error("Position GPS invalide. Verifie ton appareil et reessaie.");
  }

  const accuracy = Number.isFinite(position.coords.accuracy)
    ? position.coords.accuracy
    : 0;

  const effectiveDistance = Math.max(distance - accuracy, 0);

  if (effectiveDistance > radius) {
    throw new Error(
      `Tu es trop loin de la figurine (${formatDistance(
        distance
      )}, precision ${formatDistance(accuracy)}). Approche-toi a moins de ${radius} m.`
    );
  }
}

function requestCurrentPosition() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, (error) => {
      switch (error.code) {
        case error.PERMISSION_DENIED:
          reject(
            new Error(
              "Autorise la geolocalisation pour capturer ce Pokemon."
            )
          );
          break;
        case error.POSITION_UNAVAILABLE:
          reject(
            new Error("Impossible d'obtenir la position actuelle. Reessaie.")
          );
          break;
        case error.TIMEOUT:
          reject(
            new Error("Le GPS a mis trop de temps a repondre. Reessaie.")
          );
          break;
        default:
          reject(new Error("Erreur GPS inattendue. Reessaie."));
      }
    }, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
  });
}
