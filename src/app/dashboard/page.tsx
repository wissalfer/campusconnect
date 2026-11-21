import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export default async function DashboardPage() {
  const user=await getCurrentUser();
  if(!user) redirect("/login");
  type RequestSummary={id:number;title:string;subject:string;level:string;status:string};
  type ProposalSummary={id:number;title:string;message:string;status:string;request_id:number};
  const published=db.prepare(`SELECT r.*,u.name FROM requests r JOIN users u ON u.id=r.author_id WHERE r.author_id=? AND r.status!='closed' ORDER BY r.created_at DESC`).all(user.id) as RequestSummary[];
  const proposals=db.prepare(`SELECT p.*,r.title,r.status AS request_status,r.id AS request_id FROM proposals p JOIN requests r ON r.id=p.request_id WHERE p.student_id=? ORDER BY p.created_at DESC`).all(user.id) as ProposalSummary[];
  const completed=db.prepare(`SELECT r.*,u.name FROM requests r JOIN users u ON u.id=r.author_id WHERE r.status='completed' AND (r.author_id=? OR r.accepted_proposal_id IN (SELECT id FROM proposals WHERE student_id=?))`).all(user.id,user.id) as RequestSummary[];
  return (
    <main className="container page"><div className="section-heading"><div><span className="eyebrow muted">Vue personnelle</span><h1 className="page-title">Bonjour, {user.name}</h1></div><Link className="button button-primary" href="/requests/new">Nouvelle demande</Link></div>
      <div className="stats"><div className="card stat"><strong>{published.length}</strong><span>Demandes publiées</span></div><div className="card stat"><strong>{proposals.length}</strong><span>Aides proposées</span></div><div className="card stat"><strong>{completed.length}</strong><span>Séances réalisées</span></div><div className="card stat"><strong>{published.filter(r=>r.status==="accepted").length}</strong><span>En cours</span></div></div>
      <div className="tabs" role="tablist" aria-label="Tableau de bord"><span className="tab active" role="tab" aria-selected="true">Mes demandes</span></div>
      <section className="table-wrap"><table className="table"><thead><tr><th>Titre</th><th>Matière</th><th>Niveau</th><th>Statut</th><th></th></tr></thead><tbody>{published.length?published.map(r=><tr key={r.id}><td><strong>{r.title}</strong></td><td>{r.subject}</td><td>{r.level}</td><td><span className={`status ${r.status}`}>{r.status==="open"?"Ouverte":r.status==="accepted"?"Aide acceptée":"Terminée"}</span></td><td><Link href={`/requests/${r.id}`}>Voir</Link></td></tr>):<tr><td colSpan={5}><div className="empty">Vous n’avez pas encore publié de demande.</div></td></tr>}</tbody></table></section>
      <section className="section"><h2>Aides proposées</h2><div className="table-wrap"><table className="table"><thead><tr><th>Demande</th><th>Votre proposition</th><th>Statut</th><th></th></tr></thead><tbody>{proposals.length?proposals.map(p=><tr key={p.id}><td><strong>{p.title}</strong></td><td>{p.message.slice(0,80)}...</td><td><span className={`status ${p.status}`}>{p.status==="pending"?"En attente":p.status==="accepted"?"Acceptée":"Refusée"}</span></td><td><Link href={`/requests/${p.request_id}`}>Voir</Link></td></tr>):<tr><td colSpan={4}><div className="empty">Vous n’avez pas encore proposé votre aide.</div></td></tr>}</tbody></table></div></section>
    </main>
  );
}
// Route "/dashboard" : espace personnel accessible après connexion.
// Les trois requêtes SQL alimentent les cartes et tableaux publiées, proposées et réalisées.
