# FinSchool

Première tranche MVP de FinSchool, une interface en français pour suivre les frais scolaires d'une petite école.

## Démarrer

Prérequis : Node.js 18 ou plus récent.

```sh
npm install
npm run dev
```

Ouvrir l'adresse locale affichée par Vite. Pour générer la version de production : `npm run build`.

## Déploiement GitHub Pages

Le workflow `.github/workflows/deploy.yml` construit et publie le site sur GitHub Pages après un push sur `main` ou `aboudra015-finschool-mvp`. Le dépôt doit utiliser GitHub Actions comme source Pages. L'URL du site de projet sera `https://aboudra015.github.io/FinSchool/`.

## Fonctionnalités

- Tableau de bord des encaissements, soldes à recouvrer et derniers paiements.
- Liste des élèves, recherche, filtres « impayés » et « à jour », et fiche détaillée.
- Ajout d'élèves et saisie manuelle de règlements en espèces ou mobile money.
- Historique des paiements et reçu imprimable.
- Comptes d'équipe fictifs et invitations simulées avec rôles indicatifs.
- Parcours de paiement mobile simulé, aperçu de rappel WhatsApp et statut de synchronisation de démonstration.

Cette version est une démonstration : elle conserve les modifications dans le stockage local du navigateur, sans vrai compte utilisateur, contrôle d'accès, synchronisation entre appareils, débit mobile money ou envoi WhatsApp. Aucune clé API ou connexion à un fournisseur externe n'est utilisée.
