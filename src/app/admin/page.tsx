import { redirect } from "next/navigation";
import { campusRepository } from "@/infrastructure/campus-repository";
import { getReports } from "@/application/campus-use-cases";
import { getCurrentUser } from "@/infrastructure/auth-session";
import { moderateRequest } from "@/lib/actions";

// Route "/admin" : page réservée aux administrateurs.
// Cette vérification doit rester côté serveur, même si le lien n'apparaît que pour les admins.
export default async function AdminPage() {
  const user=await getCurrentUser();
  if(!user) redirect("/login"); // Les visiteurs anonymes sont envoyés vers la connexion.
  if(user.role!=="admin") redirect("/dashboard"); // Un étudiant ne peut pas ouvrir cette page.
  const reports=getReports(campusRepository);

  // Les actions serveur ne modifient jamais directement React : elles changent SQLite.
  async function keep(requestId:number){ "use server"; await moderateRequest(requestId,"keep"); }
  async function hide(requestId:number){ "use server"; await moderateRequest(requestId,"hide"); }

  return <main className="container page"><div className="section-heading"><div><span className="eyebrow muted">Administration</span><h1 className="page-title">Publications signalées</h1></div></div>
    {reports.length?<div className="table-wrap"><table className="table"><thead><tr><th>Publication</th><th>Auteur</th><th>Matière</th><th>Signalements</th><th>Actions</th></tr></thead><tbody>{reports.map(r=><tr key={r.id}><td><strong>{r.title}</strong></td><td>{r.authorName}</td><td>{r.subject}</td><td>{r.pendingCount}</td><td><div style={{display:"flex",gap:8}}><form action={keep.bind(null,r.id)}><button className="button button-ghost" type="submit">Conserver</button></form><form action={hide.bind(null,r.id)}><button className="button button-danger" type="submit">Masquer</button></form></div></td></tr>)}</tbody></table></div>:<div className="empty"><strong>Aucun signalement en attente</strong><p>L’espace de modération est à jour.</p></div>}
  </main>;
}
// Route "/admin" : espace réservé aux utilisateurs dont le rôle est "admin".
