import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { CreateRequestForm } from "@/components/RequestForms";

export default async function NewRequestPage() {
  if (!(await getCurrentUser())) redirect("/login");
  return <main className="container page"><div style={{maxWidth:720,margin:"0 auto"}}><span className="eyebrow muted">Nouvelle demande</span><h1 className="page-title" style={{marginBottom:20}}>À quoi avez-vous besoin d’aide ?</h1><div className="card"><CreateRequestForm/></div></div></main>;
}
