import type { Metadata } from "next";
import "./globals.css";
import type { ReactNode } from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { logout } from "@/lib/actions";

// Métadonnées de l'application : elles servent notamment au titre de l'onglet et au partage de lien.
export const metadata: Metadata = {
  title: "CampusConnect",
  description: "Entraide et partage entre étudiants",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="fr">
      <body>
        <header className="site-header">
          <Link className="brand" href="/" aria-label="CampusConnect, accueil">
            <span className="brand-mark">C</span>
            <span>CampusConnect</span>
          </Link>
          <nav className="main-nav" aria-label="Navigation principale">
            <Link href="/requests">Demandes</Link>
            {user && <Link href="/dashboard">Tableau de bord</Link>}
            {user?.role === "admin" && <Link href="/admin">Administration</Link>}
          </nav>
          <div className="header-actions">
            {user ? (
              <>
                <span className="avatar" aria-hidden="true">{user.name.slice(0, 1).toUpperCase()}</span>
                <Link className="profile-link" href="/profile">{user.name}</Link>
                <form action={logout}>
                  <button className="button button-ghost" type="submit">Déconnexion</button>
                </form>
              </>
            ) : (
              <>
                <Link className="button button-ghost" href="/login">Connexion</Link>
                <Link className="button button-primary" href="/register">S’inscrire</Link>
              </>
            )}
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
