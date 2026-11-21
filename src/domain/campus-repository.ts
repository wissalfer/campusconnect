// Port Domain : l'interface annonce ce que l'application peut demander au stockage.
// Elle ne contient aucun SQL, aucun SQLite et aucune référence à Next.js.
import type { HelpRequest, Proposal, Review, Student } from "./campus";

export type RequestFilters = {
  subject?: string;
  level?: string;
  status?: string;
  query?: string;
};

export type DashboardData = {
  published: HelpRequest[];
  proposals: Proposal[];
  completed: HelpRequest[];
};

export interface CampusRepository {
  findRecentRequests(limit: number): HelpRequest[];
  findRequests(filters: RequestFilters): HelpRequest[];
  findRequestById(requestId: number): HelpRequest | null;
  findProposals(requestId: number): Proposal[];
  findReview(requestId: number, reviewerId: number): Review | null;
  findDashboard(studentId: number): DashboardData;
  findReports(): Array<HelpRequest & { authorName: string; pendingCount: number }>;

  createRequest(input: Omit<HelpRequest, "id" | "authorName" | "status" | "acceptedProposalId" | "reportCount">): number;
  createProposal(requestId: number, studentId: number, message: string): void;
  acceptProposal(requestId: number, proposalId: number): void;
  refuseProposal(proposalId: number): void;
  completeRequest(requestId: number): void;
  createReview(input: Omit<Review, "id">): void;
  createReport(requestId: number, reporterId: number, reason: string): void;
  moderateRequest(requestId: number, action: "keep" | "hide"): void;
  updateProfile(studentId: number, input: Pick<Student, "name" | "speciality" | "level" | "skills">): void;

  findUserByEmail(email: string): (Student & { password: string }) | null;
  findUserById(userId: number): Student | null;
  createUser(input: Omit<Student, "id" | "role"> & { password: string }): number;
  emailExists(email: string): boolean;
  proposalExists(requestId: number, studentId: number): boolean;
  reportExists(requestId: number, reporterId: number): boolean;
  reviewExists(requestId: number, reviewerId: number): boolean;
}
