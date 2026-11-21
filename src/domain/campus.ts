// Couche Domain : les types métier ne dépendent ni de Next.js, ni de React, ni de SQLite.
// Ces entités décrivent les concepts du projet et restent utilisables si le stockage change.

export type UserRole = "student" | "admin";
export type RequestStatus = "open" | "accepted" | "completed" | "closed";
export type ProposalStatus = "pending" | "accepted" | "refused";

export type Student = {
  id: number;
  name: string;
  email: string;
  speciality: string;
  level: string;
  skills: string;
  role: UserRole;
};

export type HelpRequest = {
  id: number;
  authorId: number;
  authorName: string;
  title: string;
  description: string;
  subject: string;
  level: string;
  availability: string;
  status: RequestStatus;
  acceptedProposalId: number | null;
  reportCount: number;
};

export type Proposal = {
  id: number;
  requestId: number;
  title: string;
  studentId: number;
  studentName: string;
  message: string;
  skills: string;
  status: ProposalStatus;
};

export type Review = {
  id: number;
  requestId: number;
  reviewerId: number;
  revieweeId: number;
  rating: number;
  comment: string;
};

export type Report = {
  id: number;
  requestId: number;
  reporterId: number;
  reason: string;
  status: "pending" | "treated" | "dismissed";
};
