# CampusConnect

CampusConnect est une plateforme Next.js permettant aux étudiants de publier des demandes d’aide, de proposer leurs compétences, d’organiser des séances de révision et d’évaluer les participants.

## Fonctionnalités

- Inscription, connexion et profil étudiant
- Publication et recherche de demandes par matière, niveau et statut
- Proposition d’aide et décision exclusive par l’auteur
- Cycle ouvert → aide acceptée → séance terminée
- Évaluation limitée aux participants après clôture
- Tableau de bord personnel
- Signalements et espace administrateur
- Persistance locale SQLite après rechargement

## Installation

Prérequis : Node.js 20 ou supérieur.

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

Pour une compilation de production :

```bash
npm run build
npm start
```

## Configuration

Le projet utilise SQLite par défaut. Aucun compte externe n’est nécessaire. Vous pouvez définir les variables suivantes :

- `DATABASE_PATH` : chemin du fichier SQLite. Par défaut `campusconnect.db` à la racine.
- `AUTH_SECRET` : secret utilisé pour signer les sessions. Une valeur distincte doit être configurée en production.

Exemple :

```dotenv
AUTH_SECRET=changez-ce-secret
DATABASE_PATH=C:/chemin/vers/campusconnect.db
```

## Comptes de démonstration

Tous les comptes ont le mot de passe `Campus123!` :

| Rôle | Adresse |
|---|---|
| Étudiante | `ines@campus.test` |
| Étudiant | `yassine@campus.test` |
| Étudiante | `sarah@campus.test` |
| Administrateur | `admin@campus.test` |

## Parcours principal

1. Se connecter ou créer un compte.
2. Publier une demande depuis `Demandes` ou le tableau de bord.
3. Avec un autre compte, ouvrir la demande et proposer une aide.
4. Avec le compte auteur, accepter une proposition.
5. Clôturer la séance depuis la demande.
6. Évaluer uniquement depuis un compte participant.

## Règles métier et sécurité

- Seul l’auteur peut modifier, accepter une proposition ou clôturer sa demande.
- Une demande acceptée ou terminée n’accepte plus de nouvelles propositions.
- Les décisions, clôtures, évaluations et signalements sont contrôlés côté serveur.
- Les opérations administrateur exigent le rôle `admin`.
- Les formulaires sont validés côté client et avec Zod côté serveur.
- Les mots de passe sont hachés avec bcrypt et les sessions sont signées avec des cookies HTTP-only.

## Fonctionnalité originale

Le profil étudiant permet aux utilisateurs d’exposer leurs compétences. Les propositions affichent ces compétences et les demandes peuvent être filtrées, offrant une recommandation humaine simple avant une mise en relation.

## Limites connues

- SQLite convient à une démonstration locale ou à un déploiement à instance unique.
- Aucun service temps réel, calendrier externe ou notification par email n’est intégré.
- Les fichiers téléversés ne sont pas pris en charge.
- Il n’existe pas encore de flux de vérification email.

## Usage des outils d’IA

Une partie de la génération initiale du code et de cette documentation a été assistée par une IA. Les parcours métier, l’implémentation et les données ont été vérifiés avant livraison.
