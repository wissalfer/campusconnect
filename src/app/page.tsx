// Page d'accueil : route "/", chargée côté serveur par Next.js.
// Elle lit directement SQLite pour préparer une liste récente, puis rend du JSX React.
import Link from "next/link";
import { db } from "@/lib/db";

type RequestRow={id:number;title:string;description:string;subject:string;level:string;status:string;name:string};

export default function HomePage() {
  const requests=db.prepare(`SELECT r.*,u.name FROM requests r JOIN users u ON u.id=r.author_id WHERE r.status!='closed' ORDER BY r.created_at DESC LIMIT 6`).all() as RequestRow[];
  return (
    <main className="container page">
      <section className="hero">
        <div className="hero-copy"><span className="eyebrow">Plateforme étudiante</span><h1>Apprendre ensemble,<br/>avancer plus loin.</h1><p>Publiez vos besoins, partagez vos compétences et trouvez l’aide adaptée à votre parcours universitaire.</p><div style={{display:"flex",gap:10,marginTop:24}}><Link className="button button-primary" href="/requests/new" style={{background:"white",color:"#3730a3"}}>Demander de l’aide</Link><Link className="button button-ghost" href="/requests" style={{borderColor:"rgba(255,255,255,.35)",background:"rgba(255,255,255,.10)",color:"white"}}>Explorer les demandes</Link></div></div>
        <div className="hero-art" aria-hidden="true"><div className="hero-card"><div/><div/><div/></div></div>
      </section>
      <section className="section"><div className="section-heading"><div><span className="eyebrow muted">Communauté</span><h2>Demandes récentes</h2></div><Link className="button button-ghost" href="/requests">Voir toutes les demandes</Link></div>
        {requests.length?<div className="grid">{requests.map(r=><Link className="card request-card" href={`/requests/${r.id}`} key={r.id}><div className="card-top"><span className="subject">{r.subject}</span><span className={`status ${r.status}`}>{r.status==="open"?"Ouverte":r.status==="accepted"?"Aide acceptée":r.status==="completed"?"Terminée":"Clôturée"}</span></div><h3>{r.title}</h3><p>{r.description.slice(0,110)}{r.description.length>110?"...":""}</p><div className="meta"><span>{r.level}</span><span>•</span><span>{r.name}</span></div></Link>)}</div>:<div className="empty">Aucune demande pour le moment.</div>}
      </section>
    </main>
  );
}
