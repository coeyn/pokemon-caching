const OFFICIAL_ARTWORK_BASE =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork";
const DEFAULT_SPRITE_BASE =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";

export function getPokemonImageUrl(pokemon) {
  const numericId = extractNumericId(pokemon?.number);
  if (numericId) {
    return `${OFFICIAL_ARTWORK_BASE}/${numericId}.png`;
  }

  const fallbackSlug = normalizeSlug(pokemon?.id ?? pokemon?.name);
  if (fallbackSlug) {
    return `${DEFAULT_SPRITE_BASE}/${fallbackSlug}.png`;
  }

  return null;
}

export function getPokemonImageUrlByIdentifier(identifier) {
  const numericId = extractNumericId(identifier);
  if (numericId) {
    return `${OFFICIAL_ARTWORK_BASE}/${numericId}.png`;
  }

  const fallbackSlug = normalizeSlug(identifier);
  if (fallbackSlug) {
    return `${DEFAULT_SPRITE_BASE}/${fallbackSlug}.png`;
  }

  return null;
}

function extractNumericId(value) {
  if (!value) {
    return null;
  }
  const match = String(value).match(/\d+/);
  if (!match) {
    return null;
  }
  const parsed = parseInt(match[0], 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeSlug(value) {
  if (!value) {
    return null;
  }
  return String(value).trim().toLowerCase();
}
