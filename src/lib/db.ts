// Couche données : ce fichier ouvre SQLite, crée les tables et insère les données de démonstration.
// Les composants/pages ne doivent pas écrire directement dans SQLite : ils passent normalement par les Server Actions.
import Database from "better-sqlite3";
import path from "node:path";
import bcrypt from "bcryptjs";

const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), "campusconnect.db");
export const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// db.exec() crée toutes les relations une seule fois au démarrage si elles n'existent pas encore.
db.exec(`
  -- Tables users/requests/proposals/reviews/reports : chaque table porte une responsabilité distincte.
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    speciality TEXT NOT NULL,
    level TEXT NOT NULL,
    skills TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT 'student',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    subject TEXT NOT NULL,
    level TEXT NOT NULL,
    availability TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    accepted_proposal_id INTEGER,
    report_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(author_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS proposals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(request_id) REFERENCES requests(id) ON DELETE CASCADE,
    FOREIGN KEY(student_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id INTEGER NOT NULL,
    reviewer_id INTEGER NOT NULL,
    reviewee_id INTEGER NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(request_id) REFERENCES requests(id),
    UNIQUE(request_id, reviewer_id)
  );
  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id INTEGER NOT NULL,
    reporter_id INTEGER NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(request_id) REFERENCES requests(id) ON DELETE CASCADE,
    UNIQUE(request_id, reporter_id)
  );
`);

const count = db.prepare("SELECT COUNT(*) AS count FROM users").get() as { count: number };
if (count.count === 0) {
  const insert = db.prepare(`INSERT INTO users (name,email,password,speciality,level,skills,role) VALUES (?,?,?,?,?,?,?)`);
  const password = bcrypt.hashSync("Campus123!", 10);
  insert.run("Inès Martin", "ines@campus.test", password, "Informatique", "Licence 3", "JavaScript, React, Bases de données", "student");
  insert.run("Yassine Ben Ali", "yassine@campus.test", password, "Mathématiques", "Master 1", "Algèbre, Analyse, Python", "student");
  insert.run("Sarah Dupont", "sarah@campus.test", password, "Physique", "Licence 2", "Mécanique, Thermodynamique", "student");
  insert.run("Administrateur", "admin@campus.test", password, "Administration", "Equipe", "Modération", "admin");

  const request = db.prepare(`INSERT INTO requests (author_id,title,description,subject,level,availability,status) VALUES (?,?,?,?,?,?,?)`);
  request.run(1, "Aide pour les algorithmes graphiques", "Je prépare une soutenance sur les graphes et j’aurais besoin d’aide pour comprendre les parcours en largeur et en profondeur.", "Informatique", "Licence 3", "Vendredi soir", "open");
  request.run(2, "Révision sur les intégrales", "Recherche quelqu’un pour revoir ensemble les changements de variables et les intégrales impropres.", "Mathématiques", "Licence 2", "Samedi matin", "open");
  request.run(3, "Exercices de mécanique du point", "Besoin d’une aide méthodique pour résoudre les exercices sur le mouvement relatif.", "Physique", "Licence 2", "Mercredi après-midi", "open");
  request.run(1, "Projet React - routage", "Organisation d’une séance pour revoir les layouts, les routes dynamiques et les Server Actions.", "Informatique", "Licence 3", "Dimanche matin", "completed");

  db.prepare(`INSERT INTO proposals (request_id,student_id,message,status) VALUES (?,?,?,?)`).run(1,2,"Je peux t’expliquer les deux parcours avec des exemples visuels.","pending");
  db.prepare(`INSERT INTO proposals (request_id,student_id,message,status) VALUES (?,?,?,?)`).run(1,3,"Disponible vendredi, je peux partager mes fiches.","pending");
  db.prepare(`INSERT INTO proposals (request_id,student_id,message,status) VALUES (?,?,?,?)`).run(4,2,"Séance réalisée avec succès.","accepted");
  db.prepare(`UPDATE requests SET accepted_proposal_id=3,status='completed' WHERE id=4`);
}
