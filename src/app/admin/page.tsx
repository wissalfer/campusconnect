import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { moderateRequest } from "@/lib/actions";

export default async function AdminPage() {
  const user=await getCurrentUser();
  if(!user) redirect("/login");
  if(user.role!=="admin") redirect("/dashboard");
  type ReportRow={id:number;title:string;subject:string;report_count:number;status:string;author:string;pending_count:number};
  const reports=db.prepare(`SELECT r.id,r.title,r.subject,r.report_count,r.status,u.name AS author,
    (SELECT COUNT(*) FROM reports x WHERE x.request_id=r.id AND x.status='pending') AS pending_count
    FROM requests r JOIN users u ON u.id=r.author_id
    WHERE r.id IN (SELECT request_id FROM reports WHERE status='pending')
    ORDER BY r.report_count DESC`).all() as ReportRow[];

  async function keep(requestId:number){ "use server"; await moderateRequest(requestId,"keep"); }
  async function hide(requestId:number){ "use server"; await moderateRequest(requestId,"hide"); }

  return <main className="container page"><div className="section-heading"><div><span className="eyebrow muted">Administration</span><h1 className="page-title">Publications signalées</h1></div></div>
    {reports.length?<div className="table-wrap"><table className="table"><thead><tr><th>Publication</th><th>Auteur</th><th>Matière</th><th>Signalements</th><th>Actions</th></tr></thead><tbody>{reports.map(r=><tr key={r.id}><td><strong>{r.title}</strong></td><td>{r.author}</td><td>{r.subject}</td><td>{r.pending_count}</td><td><div style={{display:"flex",gap:8}}><form action={keep.bind(null,r.id)}><button className="button button-ghost" type="submit">Conserver</button></form><form action={hide.bind(null,r.id)}><button className="button button-danger" type="submit">Masquer</button></form></div></td></tr>)}</tbody></table></div>:<div className="empty"><strong>Aucun signalement en attente</strong><p>L’espace de modération est à jour.</p></div>}
  </main>;
}
