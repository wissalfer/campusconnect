import Link from "next/link";
import { LoginForm } from "@/presentation/components/AuthForms";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/infrastructure/auth-session";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  return <main className="auth-layout"><aside className="auth-aside"><div className="auth-aside-inner"><span className="eyebrow">CampusConnect</span><h1>Bienvenue parmi nous.</h1><p>Retrouvez vos demandes, vos propositions d’aide et vos prochaines séances de révision.</p></div></aside><section className="auth-main"><div className="auth-card"><h2>Connexion</h2><p className="muted">Accédez à votre espace étudiant.</p><LoginForm/><p style={{marginTop:20}}>Pas encore de compte ? <Link href="/register" style={{color:"#4f46e5",fontWeight:750}}>S’inscrire</Link></p></div></section></main>;
}
// Route "/login" : Server Component qui redirige les utilisateurs déjà connectés.
