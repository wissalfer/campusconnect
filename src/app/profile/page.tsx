import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ProfileForm } from "@/components/RequestForms";

export default async function ProfilePage() {
  const user=await getCurrentUser();
  if(!user) redirect("/login");
  return <main className="container page"><div style={{maxWidth:720,margin:"0 auto"}}><span className="eyebrow muted">Mon profil</span><h1 className="page-title" style={{marginBottom:20}}>Informations étudiantes</h1><div className="card"><ProfileForm user={user}/></div></div></main>;
}
// Route "/profile" : affichage et modification des informations étudiantes.
