import Link from "next/link";
import { redirect } from "next/navigation";
import { campusRepository } from "@/infrastructure/campus-repository";
import { getDashboard } from "@/application/campus-use-cases";
import { getCurrentUser } from "@/infrastructure/auth-session";

// Tableau de bord : les données sont lues via Application puis regroupées avant l'affichage.
export default async function DashboardPage() {
  const user=await getCurrentUser();
  if(!user) redirect("/login");
  const dashboard=getDashboard(campusRepository,user.id);
  const {published,proposals,completed}=dashboard;
  return (
    <main className="container page"><div className="section-heading"><div><span className="eyebrow muted">Vue personnelle</span><h1 className="page-title">Bonjour, {user.name}</h1></div><Link className="button button-primary" href="/requests/new">Nouvelle demande</Link></div>
      <div className="stats"><div className="card stat"><strong>{published.length}</strong><span>Demandes publiées</span></div><div className="card stat"><strong>{proposals.length}</strong><span>Aides proposées</span></div><div className="card stat"><strong>{completed.length}</strong><span>Séances réalisées</span></div><div className="card stat"><strong>{published.filter(r=>r.status==="accepted").length}</strong><span>En cours</span></div></div>
      <div className="tabs" role="tablist" aria-label="Tableau de bord"><span className="tab active" role="tab" aria-selected="true">Mes demandes</span></div>
      <section className="table-wrap"><table className="table"><thead><tr><th>Titre</th><th>Matière</th><th>Niveau</th><th>Statut</th><th></th></tr></thead><tbody>{published.length?published.map(r=><tr key={r.id}><td><strong>{r.title}</strong></td><td>{r.subject}</td><td>{r.level}</td><td><span className={`status ${r.status}`}>{r.status==="open"?"Ouverte":r.status==="accepted"?"Aide acceptée":"Terminée"}</span></td><td><Link href={`/requests/${r.id}`}>Voir</Link></td></tr>):<tr><td colSpan={5}><div className="empty">Vous n’avez pas encore publié de demande.</div></td></tr>}</tbody></table></section>
      <section className="section"><h2>Aides proposées</h2><div className="table-wrap"><table className="table"><thead><tr><th>Demande</th><th>Votre proposition</th><th>Statut</th><th></th></tr></thead><tbody>{proposals.length?proposals.map(p=><tr key={p.id}><td><strong>{p.title}</strong></td><td>{p.message.slice(0,80)}...</td><td><span className={`status ${p.status}`}>{p.status==="pending"?"En attente":p.status==="accepted"?"Acceptée":"Refusée"}</span></td><td><Link href={`/requests/${p.requestId}`}>Voir</Link></td></tr>):<tr><td colSpan={4}><div className="empty">Vous n’avez pas encore proposé votre aide.</div></td></tr>}</tbody></table></div></section>
    </main>
  );
}
// Route "/dashboard" : espace personnel accessible après connexion.
// Les trois requêtes SQL alimentent les cartes et tableaux publiées, proposées et réalisées.
