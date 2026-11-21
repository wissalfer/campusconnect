import Link from "next/link";
import { RegisterForm } from "@/components/AuthForms";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  return <main className="auth-layout"><aside className="auth-aside"><div className="auth-aside-inner"><span className="eyebrow">Rejoindre le campus</span><h1>Partagez vos connaissances.</h1><p>Créez votre profil étudiant et identifiez les compétences que vous pouvez apporter à la communauté.</p></div></aside><section className="auth-main"><div className="auth-card"><h2>Créer un compte</h2><p className="muted">Quelques informations suffisent pour commencer.</p><RegisterForm/><p style={{marginTop:20}}>Déjà inscrit ? <Link href="/login" style={{color:"#4f46e5",fontWeight:750}}>Se connecter</Link></p></div></section></main>;
}
// Route "/register" : page d'inscription contenant le formulaire réutilisable RegisterForm.
