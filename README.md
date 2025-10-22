# Pokemon Caching

Prototype de site web qui permet de capturer des figurines Pokemon equipees de puces NFC NTAG213. Chaque tag ouvre directement la page du Pokemon via une URL encodee, ce qui ajoute automatiquement la capture au Pokedex local.

## Fonctionnalites actuelles

- Interface statique (HTML, CSS, JavaScript natif) sans dependances externes.
- Capture automatique lorsqu'on ouvre `capture.html` avec un identifiant (ex. `capture.html?pokemon=pikachu`).
- Mise a jour de la progression et stockage local dans le navigateur (`localStorage`).
- Liste des figurines avec indices, lieu d'exposition et types.
- Illustrations distantes via les sprites officiels de PokeAPI (aucune image hebergee localement).
- Affichage en silhouette pour les Pokemon non captures afin de garder la surprise.
- Informations detaillees masquees tant que la capture n'est pas realisee (nom/type/lieu remplaces par `???`, seul l'indice reste visible).
- Verification geographique optionnelle: un Pokemon n'est capturable que si le joueur se trouve dans le rayon defini autour de la figurine.
- Bouton de reinitialisation du Pokedex local.

## Mise en route

1. Servez le dossier via un serveur HTTP statique (exemples : `npx serve`, `python -m http.server`, ou hebergement Netlify/Vercel).
2. Ouvrez le site depuis ton smartphone ou tout autre appareil pouvant ouvrir un lien NFC.
3. Approche la figurine de ton telephone : le lien encode t'amene sur `capture.html` et valide la capture, puis utilise le bouton pour revenir a l'accueil.

> Astuce : pour tester sur desktop, simulez des captures en ajoutant manuellement des identifiants dans `localStorage` (`localStorage.setItem("pokemon-caching-progress-v1", '["pikachu"]')`).

## Associer une puce NFC a un Pokemon

1. Programmez la puce NTAG213 avec un identifiant stable (texte brut, URL ou JSON).
2. Ajoutez cet identifiant dans le tableau `tagIds` du Pokemon correspondant dans `scripts/data/pokedex.js`.
3. Renseignez les coordonnees GPS (`coordinates`) et le rayon maximum (`captureRadiusMeters`) pour definir la zone de capture autorisee. Si ces champs sont omis, la capture sera possible depuis n'importe ou. L'algorithme tient compte de la precision GPS (`coords.accuracy`) avant de refuser la capture.
4. Pour ouvrir une page dediee lors du scan, encodez une URL du type `https://ton-site.exemple/capture.html?pokemon=pikachu`. La page reconnaitra l'identifiant, verifiera la position, puis confirmera la capture.
5. Deploiement : mettez a jour le site avec votre nouvelle configuration.

Le code accepte l'identifiant fourni dans l'URL (parametres `pokemon`, `id` ou `tag`). Choisis une convention d'identifiants et encode-la sur chaque puce NFC. Les images sont chargees a la volee depuis les sprites officiels exposes par PokeAPI.

## Limitations et prochaines etapes

- Pour les appareils qui ne declenchent pas automatiquement l'URL NFC, prevois un QR code ou un code court qui pointe vers `capture.html`.
- Aucune authentification ou persistence serveur pour le moment. Ajoutez un backend (ex : Supabase, Firebase, FastAPI + base de donnees) pour :
  - Sauvegarder la progression des joueurs.
  - Organiser des evenements avec scores en temps reel.
  - Gerer l'inventaire des figurines.
- Ajouter un mode admin pour enregistrer de nouvelles figurines directement depuis le terrain.
- Prevoir un systeme anti-triche si le jeu devient competitif (signature des tags, validation cote serveur).

## Structure du projet

```
pokemon_caching/
|-- index.html        # Accueil et Pokedex
|-- capture.html      # Page de capture (via URL NFC)
|-- styles/
|   `-- main.css      # Style global
`-- scripts/
    |-- app.js        # Logique d'affichage de l'accueil et du Pokedex
    |-- capture.js    # Traitement d'une capture via URL + verification GPS
    |-- utils/
    |   |-- geo.js         # Fonctions de calcul de distance
    |   `-- pokemonAssets.js # Construction des URLs de sprites distants
    `-- data/
        `-- pokedex.js # Configuration des figurines
```

## Idees d'extensions

- Mode cartes : afficher la position des figurines sur un plan interactif (Leaflet, Mapbox).
- Integration 3D : montrer les figurines imprimees avec un viewer (Three.js + glTF).
- Classements : toujours mettre en avant l'objectif de collection (bonus pour la vitesse, la rarete).
- Mode hors ligne : mise en cache via un Service Worker pour jouer sans reseau.
