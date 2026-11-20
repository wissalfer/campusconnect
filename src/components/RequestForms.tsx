"use client";

import { useState, type FormEvent } from "react";
import { addReview, createRequest, proposeHelp, reportRequest, updateProfile } from "@/lib/actions";

export function CreateRequestForm() {
  const [state,setState]=useState<{error:string}|null>(null);
  async function submit(event:FormEvent<HTMLFormElement>) { event.preventDefault(); const result=await createRequest(new FormData(event.currentTarget)); if(result?.error)setState(result); }
  return (
    <form className="form-stack" onSubmit={submit}>
      {state?.error && <div className="error-box" role="alert">{state.error}</div>}
      <div className="field"><label htmlFor="title">Titre</label><input className="input" id="title" name="title" required minLength={5} maxLength={120} placeholder="Ex. Aide pour les requêtes SQL" /></div>
      <div className="field"><label htmlFor="description">Description détaillée</label><textarea className="textarea" id="description" name="description" required minLength={20} maxLength={2000} placeholder="Décrivez précisément ce que vous souhaitez réviser..." /></div>
      <div className="field"><label htmlFor="subject">Matière</label><input className="input" id="subject" name="subject" required placeholder="Informatique" /></div>
      <div className="field"><label htmlFor="level">Niveau</label><select className="select" id="level" name="level" required defaultValue=""><option value="" disabled>Choisir un niveau</option><option>Licence 1</option><option>Licence 2</option><option>Licence 3</option><option>Master 1</option><option>Master 2</option></select></div>
      <div className="field"><label htmlFor="availability">Disponibilité</label><input className="input" id="availability" name="availability" required placeholder="Samedi après-midi" /></div>
      <button className="button button-primary" type="submit">Publier la demande</button>
    </form>
  );
}

export function ProfileForm({ user }: { user: {name:string; speciality:string; level:string; skills:string} }) {
  const [state,setState]=useState<{error?:string;success?:string}|null>(null);
  async function submit(event:FormEvent<HTMLFormElement>) { event.preventDefault(); const result=await updateProfile(new FormData(event.currentTarget)); if(result)setState(result); }
  return (
    <form className="form-stack" onSubmit={submit}>
      {state?.error && <div className="error-box" role="alert">{state.error}</div>}
      {state?.success && <div className="success-box" role="status">{state.success}</div>}
      <div className="field"><label htmlFor="name">Nom complet</label><input className="input" id="name" name="name" defaultValue={user.name} required /></div>
      <div className="field"><label htmlFor="speciality">Spécialité</label><input className="input" id="speciality" name="speciality" defaultValue={user.speciality} required /></div>
      <div className="field"><label htmlFor="level">Niveau</label><input className="input" id="level" name="level" defaultValue={user.level} required /></div>
      <div className="field"><label htmlFor="skills">Compétences</label><textarea className="textarea" id="skills" name="skills" defaultValue={user.skills} /></div>
      <button className="button button-primary" type="submit">Enregistrer</button>
    </form>
  );
}

export function ProposalForm({ requestId }: { requestId:number }) {
  const [state,setState]=useState<{error?:string;success?:string}|null>(null);
  async function submit(event:FormEvent<HTMLFormElement>) { event.preventDefault(); const result=await proposeHelp(requestId,new FormData(event.currentTarget)); if(result)setState(result); }
  return (
    <form className="form-stack" onSubmit={submit}>
      {state?.error && <div className="error-box" role="alert">{state.error}</div>}
      {state?.success && <div className="success-box" role="status">{state.success}</div>}
      <div className="field"><label htmlFor="message">Pourquoi pouvez-vous aider ?</label><textarea className="textarea" id="message" name="message" required minLength={10} maxLength={1000} /></div>
      <button className="button button-primary" type="submit">Proposer mon aide</button>
    </form>
  );
}

export function ReportForm({ requestId }: { requestId:number }) {
  const [state,setState]=useState<{error?:string;success?:string}|null>(null);
  async function submit(event:FormEvent<HTMLFormElement>) { event.preventDefault(); const result=await reportRequest(requestId,new FormData(event.currentTarget)); if(result)setState(result); }
  return (
    <form className="form-stack" onSubmit={submit}>
      {state?.error && <div className="error-box" role="alert">{state.error}</div>}
      {state?.success && <div className="success-box" role="status">{state.success}</div>}
      <div className="field"><label htmlFor="reason">Raison du signalement</label><textarea className="textarea" id="reason" name="reason" required minLength={5} /></div>
      <button className="button button-danger" type="submit">Signaler</button>
    </form>
  );
}

export function ReviewForm({ requestId }: { requestId:number }) {
  const [state,setState]=useState<{error?:string;success?:string}|null>(null);
  async function submit(event:FormEvent<HTMLFormElement>) { event.preventDefault(); const result=await addReview(requestId,new FormData(event.currentTarget)); if(result)setState(result); }
  return (
    <form className="form-stack" onSubmit={submit}>
      {state?.error && <div className="error-box" role="alert">{state.error}</div>}
      {state?.success && <div className="success-box" role="status">{state.success}</div>}
      <div className="field"><label htmlFor="rating">Note</label><select className="select" id="rating" name="rating" defaultValue="5"><option value="5">5 - Excellent</option><option value="4">4 - Très bien</option><option value="3">3 - Bien</option><option value="2">2 - À améliorer</option><option value="1">1 - Insuffisant</option></select></div>
      <div className="field"><label htmlFor="comment">Commentaire</label><textarea className="textarea" id="comment" name="comment" required minLength={5} /></div>
      <button className="button button-primary" type="submit">Publier l’évaluation</button>
    </form>
  );
}
