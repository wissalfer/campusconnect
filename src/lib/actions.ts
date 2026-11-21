"use server";

// Couche Presentation : cette passerelle reçoit les formulaires Next.js.
// Les règles métier sont délégées aux use cases Application.
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { campusRepository } from "@/infrastructure/campus-repository";
import { clearSession, createSession, getCurrentUser } from "@/infrastructure/auth-session";
import {
  addReview as addReviewUseCase,
  completeHelpSession,
  createHelpRequest,
  decideProposal as decideProposalUseCase,
  moderateHelpRequest,
  proposeHelp as proposeHelpUseCase,
  reportHelpRequest,
} from "@/application/campus-use-cases";

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
  if (campusRepository.emailExists(parsed.data.email.toLowerCase())) return { error: "Cette adresse est déjà utilisée." };

  const id = campusRepository.createUser({
    name: parsed.data.name,
    email: parsed.data.email.toLowerCase(),
    password: bcrypt.hashSync(parsed.data.password, 10),
    speciality: parsed.data.speciality,
    level: parsed.data.level,
    skills: parsed.data.skills,
  });
  await createSession({
    id, name: parsed.data.name, email: parsed.data.email.toLowerCase(),
    speciality: parsed.data.speciality, level: parsed.data.level,
    skills: parsed.data.skills, role: "student",
  });
  redirect("/dashboard");
}

export async function login(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  if (!email || !password) return { error: "Adresse email et mot de passe requis." };

  const user = campusRepository.findUserByEmail(email);
  if (!user || !bcrypt.compareSync(password, user.password)) return { error: "Identifiants incorrects." };
  await createSession({
    id: user.id, name: user.name, email: user.email, speciality: user.speciality,
    level: user.level, skills: user.skills, role: user.role,
  });
  redirect("/dashboard");
}

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
  if (!parsed.success) return { error: "Veuillez renseigner une demande complète." };

  try {
    const requestId = createHelpRequest(campusRepository, user.id, parsed.data);
    revalidatePath("/");
    revalidatePath("/requests");
    revalidatePath("/dashboard");
    redirect(`/requests/${requestId}`);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Impossible de publier la demande." };
  }
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

  campusRepository.updateProfile(user.id, parsed.data);
  revalidatePath("/", "layout");
  return { success: "Profil enregistré." };
}

export async function proposeHelp(requestId: number, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  try {
    proposeHelpUseCase(campusRepository, requestId, user.id, String(formData.get("message") || ""));
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Impossible de proposer votre aide." };
  }
  revalidatePath(`/requests/${requestId}`);
  revalidatePath("/dashboard");
  return { success: "Votre proposition a été envoyée." };
}

export async function decideProposal(requestId: number, proposalId: number, decision: "accepted" | "refused") {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  try {
    decideProposalUseCase(campusRepository, requestId, proposalId, user.id, decision);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Impossible de traiter cette proposition." };
  }
  revalidatePath(`/requests/${requestId}`);
  revalidatePath("/dashboard");
  return { success: decision === "accepted" ? "Aide acceptée." : "Proposition refusée." };
}

export async function completeRequest(requestId: number) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  try {
    completeHelpSession(campusRepository, requestId, user.id);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Impossible de clôturer la séance." };
  }
  revalidatePath(`/requests/${requestId}`);
  revalidatePath("/dashboard");
  revalidatePath("/");
  return { success: "Séance terminée." };
}

export async function addReview(requestId: number, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  try {
    addReviewUseCase(
      campusRepository,
      requestId,
      user.id,
      Number(formData.get("rating")),
      String(formData.get("comment") || ""),
    );
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Impossible d’enregistrer l’évaluation." };
  }
  revalidatePath(`/requests/${requestId}`);
  revalidatePath("/dashboard");
  return { success: "Évaluation enregistrée." };
}

export async function reportRequest(requestId: number, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  try {
    reportHelpRequest(campusRepository, requestId, user.id, String(formData.get("reason") || ""));
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Impossible d’envoyer le signalement." };
  }
  revalidatePath(`/requests/${requestId}`);
  revalidatePath("/admin");
  return { success: "Signalement envoyé à l’administration." };
}

export async function moderateRequest(requestId: number, action: "keep" | "hide") {
  const user = await getCurrentUser();
  if (!user) return { error: "Accès administrateur requis." };
  try {
    moderateHelpRequest(campusRepository, user, requestId, action);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Impossible de modérer la publication." };
  }
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/requests");
  return { success: action === "hide" ? "Publication masquée." : "Signalement ignoré." };
}
