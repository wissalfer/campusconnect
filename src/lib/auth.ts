// Couche authentification : cette session est indépendante de React et fonctionne côté serveur.
import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { db } from "./db";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "campusconnect-development-secret-change-me");

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  speciality: string;
  level: string;
  skills: string;
  role: "student" | "admin";
};

// createSession transforme l'utilisateur en jeton signé puis le place dans un cookie inaccessible au JavaScript.
export async function createSession(user: SessionUser) {
  const token = await new SignJWT({ user }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(secret);
  const cookieStore = await cookies();
  cookieStore.set("campus_session", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete("campus_session");
}

// getCurrentUser lit le cookie, vérifie sa signature et recharge l'utilisateur depuis SQLite.
// Elle retourne null si l'utilisateur n'est pas connecté ou si le cookie est invalide.
export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("campus_session")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    const userId = (payload.user as SessionUser)?.id;
    if (!userId) return null;
    return db.prepare("SELECT id,name,email,speciality,level,skills,role FROM users WHERE id=?").get(userId) as SessionUser | undefined || null;
  } catch {
    return null;
  }
}
