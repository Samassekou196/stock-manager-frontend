# Stock Manager — Frontend

Interface web (React) de l'application de gestion de stock et de ventes.
Backend : [stock-manager-backend](https://github.com/Samassekou196/stock-manager-backend).

## Pages
Connexion, tableau de bord, produits, ventes avec impression de reçu, clients, fournisseurs, achats (commandes fournisseurs et réceptions), inventaire (mouvements de stock, ajustements, lots), rapports. Les pages d'administration sont réservées au rôle `ADMIN`.

## Lancer en local
Prérequis : Node.js 18+ et le backend démarré sur http://localhost:8080.

```bash
npm install
npm start
```
Ouvre http://localhost:3000 et connecte-toi avec le compte administrateur créé au démarrage du backend.

## Configuration
Copie `.env.example` en `.env` pour changer l'adresse de l'API. Le fichier `.env` n'est jamais versionné.

## Scripts
- `npm start` : serveur de développement
- `npm test` : tests
- `npm run build` : version de production (`build/`)

## Licence
MIT — voir [LICENSE](LICENSE).
