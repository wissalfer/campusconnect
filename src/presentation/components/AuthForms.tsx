"use client";

// Composants formulaire côté navigateur : ils affichent les erreurs et appellent les Server Actions d'authentification.
import { useState, type FormEvent } from "react";
import { login, register } from "@/lib/actions";

export function LoginForm() {
  // useState conserve les erreurs affichées dans le navigateur après l'appel serveur.
  const [state, setState] = useState<{error:string}|null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await login(new FormData(event.currentTarget));
    if (result?.error) setState(result);
  }
  return (
    <form onSubmit={submit}>
      {state?.error && <div className="error-box" role="alert">{state.error}</div>}
      <div className="field"><label htmlFor="email">Adresse email</label><input className="input" id="email" name="email" type="email" required autoComplete="email" placeholder="vous@campus.test" /></div>
      <div className="field"><label htmlFor="password">Mot de passe</label><input className="input" id="password" name="password" type="password" required autoComplete="current-password" placeholder="Votre mot de passe" /></div>
      <button className="button button-primary" type="submit">Se connecter</button>
    </form>
  );
}

export function RegisterForm() {
  const [state, setState] = useState<{error:string}|null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await register(new FormData(event.currentTarget));
    if (result?.error) setState(result);
  }
  return (
    <form onSubmit={submit}>
      {state?.error && <div className="error-box" role="alert">{state.error}</div>}
      <div className="field"><label htmlFor="name">Nom complet</label><input className="input" id="name" name="name" required minLength={2} placeholder="Prénom Nom" /></div>
      <div className="field"><label htmlFor="email">Adresse email</label><input className="input" id="email" name="email" type="email" required placeholder="vous@campus.test" /></div>
      <div className="field"><label htmlFor="password">Mot de passe</label><input className="input" id="password" name="password" type="password" required minLength={8} placeholder="Minimum 8 caractères" /></div>
      <div className="field"><label htmlFor="speciality">Spécialité</label><input className="input" id="speciality" name="speciality" required placeholder="Informatique" /></div>
      <div className="field"><label htmlFor="level">Niveau</label><select className="select" id="level" name="level" required defaultValue=""><option value="" disabled>Choisir</option><option>Licence 1</option><option>Licence 2</option><option>Licence 3</option><option>Master 1</option><option>Master 2</option></select></div>
      <div className="field"><label htmlFor="skills">Compétences</label><input className="input" id="skills" name="skills" placeholder="React, Python, Analyse..." /></div>
      <button className="button button-primary" type="submit">Créer mon compte</button>
    </form>
  );
}
