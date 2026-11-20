import Link from "next/link";
import { db } from "@/lib/db";

type Row={id:number;title:string;description:string;subject:string;level:string;status:string;name:string};

export default async function RequestsPage({searchParams}:{searchParams:Promise<{subject?:string;level?:string;status?:string;q?:string}>}) {
  const filters=await searchParams;
  const conditions=["r.status!='closed'"];
  const params:unknown[]=[];
  if(filters.subject){conditions.push("r.subject LIKE ?");params.push(`%${filters.subject}%`);}
  if(filters.level){conditions.push("r.level=?");params.push(filters.level);}
  if(filters.status){conditions.push("r.status=?");params.push(filters.status);}
  if(filters.q){conditions.push("(r.title LIKE ? OR r.description LIKE ?)");params.push(`%${filters.q}%`,`%${filters.q}%`);}
  const requests=db.prepare(`SELECT r.*,u.name FROM requests r JOIN users u ON u.id=r.author_id WHERE ${conditions.join(" AND ")} ORDER BY r.created_at DESC`).all(...params) as Row[];
  return (
    <main className="container page">
      <div className="section-heading"><div><span className="eyebrow muted">Communauté</span><h1 className="page-title">Toutes les demandes</h1></div><Link className="button button-primary" href="/requests/new">Créer une demande</Link></div>
      <form className="filter-bar" method="get">
        <div className="field"><label htmlFor="q">Recherche</label><input className="input" id="q" name="q" defaultValue={filters.q||""} placeholder="Titre ou mots-clés"/></div>
        <div className="field"><label htmlFor="subject">Matière</label><input className="input" id="subject" name="subject" defaultValue={filters.subject||""} placeholder="Ex. Informatique"/></div>
        <div className="field"><label htmlFor="level">Niveau</label><select className="select" id="level" name="level" defaultValue={filters.level||""}><option value="">Tous les niveaux</option><option>Licence 1</option><option>Licence 2</option><option>Licence 3</option><option>Master 1</option><option>Master 2</option></select></div>
        <div className="field"><label htmlFor="status">Statut</label><select className="select" id="status" name="status" defaultValue={filters.status||""}><option value="">Tous les statuts</option><option value="open">Ouverte</option><option value="accepted">Aide acceptée</option><option value="completed">Terminée</option></select></div>
        <button className="button button-primary" type="submit">Filtrer</button>
      </form>
      {requests.length?<div className="grid">{requests.map(r=><Link className="card request-card" href={`/requests/${r.id}`} key={r.id}><div className="card-top"><span className="subject">{r.subject}</span><span className={`status ${r.status}`}>{r.status==="open"?"Ouverte":r.status==="accepted"?"Aide acceptée":r.status==="completed"?"Terminée":"Clôturée"}</span></div><h3>{r.title}</h3><p>{r.description.slice(0,130)}{r.description.length>130?"...":""}</p><div className="meta"><span>{r.level}</span><span>•</span><span>{r.name}</span></div></Link>)}</div>:<div className="empty"><strong>Aucun résultat</strong><p>Modifiez vos filtres ou publiez la première demande correspondante.</p></div>}
    </main>
  );
}
