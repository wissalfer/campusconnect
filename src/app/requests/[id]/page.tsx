import { notFound, redirect } from "next/navigation";
import { campusRepository } from "@/infrastructure/campus-repository";
import { getCurrentUser } from "@/infrastructure/auth-session";
import { getRequestDetails } from "@/application/campus-use-cases";
import { completeRequest, decideProposal } from "@/lib/actions";
import { ProposalForm, ReportForm, ReviewForm } from "@/presentation/components/RequestForms";

export default async function RequestDetailPage({params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  const requestId=Number(id);
  if(!Number.isInteger(requestId)) notFound();
  const details=getRequestDetails(campusRepository,requestId);
  const request=details.request;
  if(!request) notFound();
  const user=await getCurrentUser();
  const proposals=details.proposals;
  const accepted=proposals.find(p=>p.status==="accepted");
  const canReview=Boolean(user && request.status==="completed" && (user.id===request.authorId || user.id===accepted?.studentId));
  const hasReview=user?campusRepository.findReview(requestId,user.id):null;

  async function acceptProposal(proposalId:number){ "use server"; await decideProposal(requestId,proposalId,"accepted"); redirect(`/requests/${requestId}`); }
  async function refuseProposal(proposalId:number){ "use server"; await decideProposal(requestId,proposalId,"refused"); redirect(`/requests/${requestId}`); }
  async function closeRequest(){ "use server"; await completeRequest(requestId); redirect(`/requests/${requestId}`); }

  return (
    <main className="container page"><div className="detail-layout">
      <article className="card detail-card"><div className="card-top"><span className="subject">{request.subject}</span><span className={`status ${request.status}`}>{request.status==="open"?"Ouverte":request.status==="accepted"?"Aide acceptée":request.status==="completed"?"Terminée":"Clôturée"}</span></div><h1>{request.title}</h1><p className="description">{request.description}</p><div className="meta"><span>{request.level}</span><span>•</span><span>{request.availability}</span><span>•</span><span>Publié par {request.authorName}</span></div>
        {user?.id===request.authorId && request.status==="accepted" && <form action={closeRequest} style={{marginTop:20}}><button className="button button-success" type="submit">Marquer la séance comme terminée</button></form>}
      </article>
      <aside className="card side-card">
        {request.status==="open" ? (user ? (user.id===request.authorId?<p className="muted">Vous êtes l’auteur de cette demande. Gérez les propositions ci-dessous.</p>:<ProposalForm requestId={requestId}/>):<p>Veuillez <a href="/login" style={{color:"#087f8c",fontWeight:800}}>vous connecter</a> pour proposer votre aide.</p>) : <p className="muted">Cette demande n’accepte plus de nouvelles propositions.</p>}
        {user && <details style={{marginTop:16,borderTop:"1px solid var(--line)",paddingTop:12}}><summary style={{cursor:"pointer",fontWeight:750}}>Signaler la publication</summary><div style={{marginTop:12}}><ReportForm requestId={requestId}/></div></details>}
      </aside>
    </div>
    {user?.id===request.authorId && <section className="section"><h2>Propositions reçues</h2><div className="card">{proposals.length?proposals.map(p=><div className="proposal" key={p.id}><div className="card-top"><strong>{p.studentName}</strong><span className={`status ${p.status}`}>{p.status==="pending"?"En attente":p.status==="accepted"?"Acceptée":"Refusée"}</span></div><p>{p.message}</p><small className="muted">Compétences : {p.skills||"Non renseignées"}</small>{request.status==="open"&&p.status==="pending"&&<div className="proposal-actions"><form action={acceptProposal.bind(null,p.id)}><button className="button button-success" type="submit">Accepter</button></form><form action={refuseProposal.bind(null,p.id)}><button className="button button-ghost" type="submit">Refuser</button></form></div>}</div>):<div className="empty">Aucune proposition reçue pour le moment.</div>}</div></section>}
    {canReview&&!hasReview&&<section className="section" style={{maxWidth:620}}><h2>Évaluer la séance</h2><div className="card"><ReviewForm requestId={requestId}/></div></section>}
    </main>
  );
}
// Route dynamique "/requests/[id]" : [id] est récupéré depuis l'URL.
// Cette page assemble les détails, propositions, clôture, signalement et évaluation selon les droits.
