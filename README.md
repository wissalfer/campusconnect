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

---

# Guide pédagogique pas à pas

## Architecture Clean Architecture du projet

Le projet reprend les quatre responsabilités du TP :

```text
src/
├── domain/                         # Règles métier et contrats
│   ├── campus.ts                   # Entités Student, HelpRequest, Proposal...
│   └── campus-repository.ts        # Port CampusRepository
├── application/                    # Cas d'utilisation
│   └── campus-use-cases.ts         # Créer, proposer, accepter, clôturer...
├── infrastructure/                # Implémentations techniques
│   ├── sqlite-db.ts                # Connexion, schéma et données SQLite
│   ├── sqlite-campus-repository.ts # Implémentation du port CampusRepository
│   ├── auth-session.ts             # Sessions HTTP-only
│   └── campus-repository.ts        # Instance branchée sur l'application
├── presentation/                   # Composants React interactifs
│   └── components/
├── app/                            # Pages Next.js et routage App Router
└── lib/
    └── actions.ts                  # Pont entre formulaires et use cases
```

### Direction des dépendances

```text
Presentation -> Application -> Domain
      |
      v
Infrastructure
```

- `domain` n'importe aucun autre dossier technique.
- `application` reçoit un `CampusRepository` et ne connaît pas SQLite.
- `infrastructure` implémente les contrats Domain avec SQLite.
- `presentation` appelle les use cases ou affiche leurs données.

Pour remplacer SQLite, il suffirait de créer une nouvelle implémentation de `CampusRepository` et de remplacer l'instance dans `src/infrastructure/campus-repository.ts`. Les use cases pourraient rester inchangés.

Cette section explique le projet pour quelqu’un qui découvre Next.js.

## 1. Vue générale de l’architecture

```text
Navigateur (HTML + React)
        |
        | formulaire / clic
        v
Server Actions (src/lib/actions.ts)
        |
        | lecture/écriture vérifiée
        v
Authentification (src/lib/auth.ts)
        |
        | cookie signé
        v
Base SQLite (src/lib/db.ts)
```

Next.js utilise ici le dossier `src/app` comme structure des routes :

- un dossier devient une URL ;
- `page.tsx` contient le contenu de cette URL ;
- `layout.tsx` contient les éléments affichés autour de toutes les pages ;
- les composants sont placés dans `src/components` pour être réutilisés ;
- les règles données, session et métier sont placées dans `src/lib`.

## 2. Ce qui existe dans chaque couche

### Couche présentation

Les fichiers dans `src/app` sont les écrans. Ils sont principalement exécutés côté serveur :

| Fichier | URL | Rôle |
|---|---|---|
| `src/app/layout.tsx` | Toutes | Menu, utilisateur connecté, déconnexion, CSS global |
| `src/app/page.tsx` | `/` | Présentation et demandes récentes |
| `src/app/login/page.tsx` | `/login` | Connexion |
| `src/app/register/page.tsx` | `/register` | Inscription |
| `src/app/profile/page.tsx` | `/profile` | Modification du profil |
| `src/app/requests/page.tsx` | `/requests` | Liste et filtres |
| `src/app/requests/new/page.tsx` | `/requests/new` | Création d’une demande |
| `src/app/requests/[id]/page.tsx` | `/requests/ID` | Détail, propositions, clôture et évaluation |
| `src/app/dashboard/page.tsx` | `/dashboard` | Demandes, aides et séances personnelles |
| `src/app/admin/page.tsx` | `/admin` | Modération réservée au rôle administrateur |

Le symbole `[id]` signifie que l’URL est dynamique. `/requests/4` appelle donc `src/app/requests/[id]/page.tsx` avec `id = 4`.

### Couche composants

| Fichier | Rôle |
|---|---|
| `src/components/AuthForms.tsx` | Champs de connexion et d’inscription |
| `src/components/RequestForms.tsx` | Demande, profil, proposition, signalement et évaluation |

Ces composants utilisent `"use client"` parce qu’ils utilisent `useState`, les événements et `router.refresh()`.

### Couche métier

`src/lib/actions.ts` contient les opérations autorisées : inscription, connexion, demande, proposition, acceptation, clôture, évaluation, signalement et modération.

Une Server Action suit généralement cette séquence :

1. lire l’utilisateur connecté ;
2. valider les données avec Zod ;
3. rechercher la demande/proposition concernée ;
4. vérifier le rôle ou le statut ;
5. modifier SQLite ;
6. réactualiser les chemins avec `revalidatePath` ;
7. rediriger ou retourner un message.

### Couche authentification

`src/lib/auth.ts` contient :

- `createSession()` : crée un cookie signé ;
- `clearSession()` : supprime le cookie ;
- `getCurrentUser()` : retrouve l’utilisateur à partir du cookie.

Le cookie est HTTP-only : le JavaScript du navigateur ne peut pas le lire. Cela limite les risques liés aux attaques JavaScript.

### Couche données

`src/lib/db.ts` ouvre SQLite, crée les tables et insère les utilisateurs/demandes de démonstration au premier démarrage.

| Table | Contient |
|---|---|
| `users` | identité, mot de passe hashé, profil, rôle |
| `requests` | demande, auteur, matière, niveau, disponibilité, statut |
| `proposals` | proposition d’un étudiant pour une demande |
| `reviews` | note et commentaire après une séance |
| `reports` | signalements adressés à l’administration |

## 3. Scénario 1 : inscription et connexion

1. L’utilisateur ouvre `/register`.
2. `RegisterForm` récupère les valeurs du formulaire.
3. `register()` reçoit un `FormData`.
4. Zod vérifie les champs.
5. bcrypt hache le mot de passe.
6. SQLite insère l’utilisateur.
7. `createSession()` crée le cookie.
8. Next.js redirige vers `/dashboard`.

La connexion suit le même principe : `login()` vérifie l’e-mail, compare le mot de passe au hash bcrypt et crée le cookie.

## 4. Scénario 2 : publier une demande

1. L’utilisateur connecté ouvre `/requests/new`.
2. `CreateRequestForm` affiche les champs.
3. `createRequest()` vérifie que l’utilisateur est connecté.
4. Zod vérifie titre, description, matière, niveau et disponibilité.
5. SQLite insère la demande avec le statut `open`.
6. Les chemins `/`, `/requests` et `/dashboard` sont réactualisés.
7. Next.js ouvre `/requests/ID`.

## 5. Scénario 3 : proposer son aide

1. Un étudiant ouvre `/requests/ID`.
2. Si l’état est `open`, `ProposalForm` est affiché.
3. `proposeHelp()` vérifie la connexion et le statut.
4. Il interdit les propositions sur sa propre demande.
5. SQLite ajoute une proposition avec `pending`.
6. La page est réactualisée grâce à `revalidatePath` et `router.refresh()`.

## 6. Scénario 4 : accepter une proposition

1. Seul l’auteur de la demande voit les boutons Accepter/Refuser.
2. `acceptProposal()` appelle `decideProposal(..., "accepted")`.
3. Le serveur vérifie à nouveau que l’utilisateur est l’auteur.
4. La demande devient `accepted`.
5. La proposition sélectionnée devient `accepted`.
6. Les autres propositions deviennent `refused`.
7. L’auteur est redirigé vers la demande actualisée.

## 7. Scénario 5 : terminer puis évaluer

1. Après acceptation, l’auteur voit « Marquer la séance comme terminée ».
2. `completeRequest()` vérifie l’auteur et l’état `accepted`.
3. SQLite passe la demande à `completed`.
4. Les participants voient maintenant `ReviewForm`.
5. `addReview()` vérifie que la demande est terminée.
6. Il vérifie que l’utilisateur est auteur ou aideur accepté.
7. SQLite enregistre une note unique par demande et par participant.

## 8. Scénario 6 : signaler et modérer

1. Un étudiant utilise `ReportForm` sur une demande.
2. `reportRequest()` empêche un même utilisateur de signaler plusieurs fois.
3. Un administrateur ouvre `/admin`.
4. `moderateRequest()` vérifie le rôle `admin`.
5. Conserver ignore le signalement ; Masquer clôture la demande.

## 9. Rechargement et actualisation

Le problème « la donnée change mais l’écran reste ancien » est traité à deux niveaux :

- `revalidatePath(...)` demande à Next.js de refaire la lecture des données serveur ;
- `router.refresh()` demande au composant client de recharger la page React.
- les boutons serveur utilisant les formulaires utilisent aussi une redirection après mutation.

Ces mécanismes garantissent que le statut affiché correspond à SQLite après acceptation, clôture ou évaluation.

## 10. Règles importantes à retenir

- Ne jamais faire confiance uniquement aux boutons HTML : les contrôles existent aussi dans `src/lib/actions.ts`.
- Toujours vérifier l’identité avec `getCurrentUser()`.
- Toujours vérifier les droits avant une modification.
- Toujours valider côté serveur avec Zod.
- Le navigateur ne doit pas pouvoir contourner les règles métier.
- Une demande clôturée ne reçoit plus de proposition.
- Une évaluation n’est autorisée qu’après clôture aux participants.

## 11. Fichiers de configuration

| Fichier | Rôle |
|---|---|
| `package.json` | scripts npm et dépendances |
| `next.config.ts` | configuration Next.js |
| `tsconfig.json` | configuration TypeScript |
| `eslint.config.mjs` | règles de qualité du code |
| `.env.example` | exemple de configuration |
| `.gitignore` | fichiers exclus de Git |
| `campusconnect.db` | données SQLite locales, générées automatiquement |
