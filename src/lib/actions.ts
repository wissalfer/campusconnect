"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "./db";
import { clearSession, createSession, getCurrentUser } from "./auth";

export async function register(formData: FormData) {
  const parsed = z.object({
    name: z.string().trim().min(2).max(80),
    email: z.string().trim().email(),
    password: z.string().min(8).max(100),
    speciality: z.string().trim().min(2).max(80),
    level: z.string().trim().min(2).max(40),
    skills: z.string().trim().max(300),
  }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Veuillez vérifier tous les champs." };
  const exists = db.prepare("SELECT id FROM users WHERE email=?").get(parsed.data.email.toLowerCase());
  if (exists) return { error: "Cette adresse est déjà utilisée." };
  const hashed = bcrypt.hashSync(parsed.data.password, 10);
  const result = db.prepare(`INSERT INTO users (name,email,password,speciality,level,skills,role) VALUES (?,?,?,?,?,?,?)`)
    .run(parsed.data.name, parsed.data.email.toLowerCase(), hashed, parsed.data.speciality, parsed.data.level, parsed.data.skills, "student");
  await createSession({ id: Number(result.lastInsertRowid), name: parsed.data.name, email: parsed.data.email.toLowerCase(), speciality: parsed.data.speciality, level: parsed.data.level, skills: parsed.data.skills, role: "student" });
  redirect("/dashboard");
}

export async function login(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  if (!email || !password) return { error: "Adresse email et mot de passe requis." };
  const user = db.prepare("SELECT * FROM users WHERE email=?").get(email) as (SessionUserRow & { password: string }) | undefined;
  if (!user || !bcrypt.compareSync(password, user.password)) return { error: "Identifiants incorrects." };
  await createSession({ id: user.id, name: user.name, email: user.email, speciality: user.speciality, level: user.level, skills: user.skills, role: user.role });
  redirect("/dashboard");
}

type SessionUserRow = { id:number; name:string; email:string; speciality:string; level:string; skills:string; role:"student"|"admin" };

export async function logout() {
  await clearSession();
  redirect("/");
}

export async function createRequest(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: "Vous devez être connecté." };
  const parsed = z.object({
    title: z.string().trim().min(5).max(120),
    description: z.string().trim().min(20).max(2000),
    subject: z.string().trim().min(2).max(80),
    level: z.string().trim().min(2).max(40),
    availability: z.string().trim().min(2).max(200),
  }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Veuillez renseigner une demande complète (20 caractères minimum pour la description)." };
  const result = db.prepare(`INSERT INTO requests (author_id,title,description,subject,level,availability,status) VALUES (?,?,?,?,?,?,?)`)
    .run(user.id, parsed.data.title, parsed.data.description, parsed.data.subject, parsed.data.level, parsed.data.availability, "open");
  redirect(`/requests/${Number(result.lastInsertRowid)}`);
}

export async function updateProfile(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const parsed = z.object({
    name: z.string().trim().min(2).max(80),
    speciality: z.string().trim().min(2).max(80),
    level: z.string().trim().min(2).max(40),
    skills: z.string().trim().max(300),
  }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Veuillez vérifier les informations du profil." };
  db.prepare(`UPDATE users SET name=?,speciality=?,level=?,skills=? WHERE id=?`).run(parsed.data.name,parsed.data.speciality,parsed.data.level,parsed.data.skills,user.id);
  return { success: "Profil enregistré." };
}

export async function proposeHelp(requestId: number, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const message = z.string().trim().min(10).max(1000).safeParse(formData.get("message"));
  if (!message.success) return { error: "Votre proposition doit contenir au moins 10 caractères." };
  const request = db.prepare("SELECT * FROM requests WHERE id=?").get(requestId) as { author_id:number; status:string } | undefined;
  if (!request) return { error: "Demande introuvable." };
  if (request.status !== "open") return { error: "Cette demande n’accepte plus de propositions." };
  if (request.author_id === user.id) return { error: "Vous ne pouvez pas proposer votre propre aide." };
  const exists = db.prepare("SELECT id FROM proposals WHERE request_id=? AND student_id=?").get(requestId,user.id);
  if (exists) return { error: "Vous avez déjà proposé votre aide." };
  db.prepare(`INSERT INTO proposals (request_id,student_id,message,status) VALUES (?,?,?,?)`).run(requestId,user.id,message.data,"pending");
  return { success: "Votre proposition a été envoyée." };
}

export async function decideProposal(requestId: number, proposalId: number, decision: "accepted"|"refused") {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const request = db.prepare("SELECT * FROM requests WHERE id=?").get(requestId) as { author_id:number; status:string } | undefined;
  const proposal = db.prepare("SELECT * FROM proposals WHERE id=? AND request_id=?").get(proposalId,requestId) as { status:string } | undefined;
  if (!request || !proposal) return { error: "Élément introuvable." };
  if (request.author_id !== user.id) return { error: "Seul l’auteur peut accepter ou refuser une proposition." };
  if (request.status !== "open") return { error: "Cette demande n’est plus ouverte." };
  if (proposal.status !== "pending") return { error: "Cette proposition a déjà été traitée." };
  if (decision === "accepted") {
    db.transaction(() => {
      db.prepare(`UPDATE proposals SET status='refused' WHERE request_id=? AND id<>?`).run(requestId,proposalId);
      db.prepare(`UPDATE proposals SET status='accepted' WHERE id=?`).run(proposalId);
      db.prepare(`UPDATE requests SET status='accepted',accepted_proposal_id=? WHERE id=?`).run(proposalId,requestId);
    })();
  } else {
    db.prepare(`UPDATE proposals SET status='refused' WHERE id=?`).run(proposalId);
  }
  return { success: decision === "accepted" ? "Aide acceptée." : "Proposition refusée." };
}

export async function completeRequest(requestId: number) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const request = db.prepare("SELECT * FROM requests WHERE id=?").get(requestId) as { author_id:number; status:string } | undefined;
  if (!request) return { error: "Demande introuvable." };
  if (request.author_id !== user.id) return { error: "Seul l’auteur peut clôturer la demande." };
  if (request.status !== "accepted") return { error: "La demande doit avoir une aide acceptée." };
  db.prepare(`UPDATE requests SET status='completed' WHERE id=?`).run(requestId);
  return { success: "Séance terminée." };
}

export async function addReview(requestId: number, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const request = db.prepare(`SELECT r.*, p.student_id AS helper_id FROM requests r LEFT JOIN proposals p ON p.id=r.accepted_proposal_id WHERE r.id=?`).get(requestId) as { author_id:number; helper_id:number|null; status:string } | undefined;
  if (!request) return { error: "Demande introuvable." };
  if (request.status !== "completed") return { error: "L’évaluation est autorisée après la clôture." };
  if (user.id !== request.author_id && user.id !== request.helper_id) return { error: "Vous n’avez pas participé à cette séance." };
  const exists = db.prepare("SELECT id FROM reviews WHERE request_id=? AND reviewer_id=?").get(requestId,user.id);
  if (exists) return { error: "Vous avez déjà évalué cette séance." };
  const rating = Number(formData.get("rating"));
  const comment = z.string().trim().min(5).max(500).safeParse(formData.get("comment"));
  if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !comment.success) return { error: "Note de 1 à 5 et commentaire requis." };
  const revieweeId = user.id === request.author_id ? request.helper_id : request.author_id;
  if (!revieweeId) return { error: "Participant introuvable." };
  db.prepare(`INSERT INTO reviews (request_id,reviewer_id,reviewee_id,rating,comment) VALUES (?,?,?,?,?)`).run(requestId,user.id,revieweeId,rating,comment.data);
  return { success: "Évaluation enregistrée." };
}

export async function reportRequest(requestId: number, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const reason = z.string().trim().min(5).max(500).safeParse(formData.get("reason"));
  if (!reason.success) return { error: "Indiquez une raison valide." };
  try {
    db.prepare(`INSERT INTO reports (request_id,reporter_id,reason,status) VALUES (?,?,?,?)`).run(requestId,user.id,reason.data,"pending");
  } catch {
    return { error: "Cette publication a déjà été signalée par vous." };
  }
  db.prepare(`UPDATE requests SET report_count=(SELECT COUNT(*) FROM reports WHERE request_id=? AND status='pending') WHERE id=?`).run(requestId,requestId);
  return { success: "Signalement envoyé à l’administration." };
}

export async function moderateRequest(requestId: number, action: "keep"|"hide") {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return { error: "Accès administrateur requis." };
  if (action === "hide") {
    db.prepare(`UPDATE requests SET status='closed' WHERE id=?`).run(requestId);
  }
  db.prepare(`UPDATE reports SET status=? WHERE request_id=?`).run(action === "hide" ? "treated" : "dismissed",requestId);
  db.prepare(`UPDATE requests SET report_count=0 WHERE id=?`).run(requestId);
  return { success: action === "hide" ? "Publication masquée." : "Signalement ignoré." };
}
