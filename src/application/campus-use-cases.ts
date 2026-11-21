// Couche Application : les cas d'utilisation décrivent les actions possibles.
// Ils utilisent uniquement les abstractions du Domain et ne connaissent jamais SQLite ou React.
import type { CampusRepository } from "@/domain/campus-repository";

export function listRecentRequests(repo: CampusRepository, limit = 6) {
  return repo.findRecentRequests(limit);
}

export function listRequests(repo: CampusRepository, filters: Parameters<CampusRepository["findRequests"]>[0]) {
  return repo.findRequests(filters);
}

export function getRequestDetails(repo: CampusRepository, requestId: number) {
  return {
    request: repo.findRequestById(requestId),
    proposals: repo.findProposals(requestId),
  };
}

export function getDashboard(repo: CampusRepository, studentId: number) {
  return repo.findDashboard(studentId);
}

export function getReports(repo: CampusRepository) {
  return repo.findReports();
}

export function createHelpRequest(
  repo: CampusRepository,
  authorId: number,
  input: { title: string; description: string; subject: string; level: string; availability: string },
) {
  const title = input.title.trim();
  const description = input.description.trim();
  if (!title || title.length < 5) throw new Error("Le titre doit contenir au moins 5 caractères.");
  if (description.length < 20) throw new Error("La description doit contenir au moins 20 caractères.");
  return repo.createRequest({ authorId, title, description, subject: input.subject.trim(), level: input.level, availability: input.availability.trim() });
}

export function proposeHelp(
  repo: CampusRepository,
  requestId: number,
  studentId: number,
  message: string,
) {
  const request = repo.findRequestById(requestId);
  if (!request) throw new Error("Demande introuvable.");
  if (request.status !== "open") throw new Error("Cette demande n’accepte plus de propositions.");
  if (request.authorId === studentId) throw new Error("Vous ne pouvez pas proposer votre propre aide.");
  if (repo.proposalExists(requestId, studentId)) throw new Error("Vous avez déjà proposé votre aide.");
  const cleaned = message.trim();
  if (cleaned.length < 10) throw new Error("Votre proposition doit contenir au moins 10 caractères.");
  repo.createProposal(requestId, studentId, cleaned);
}

export function decideProposal(
  repo: CampusRepository,
  requestId: number,
  proposalId: number,
  studentId: number,
  decision: "accepted" | "refused",
) {
  const request = repo.findRequestById(requestId);
  const proposal = repo.findProposals(requestId).find((item) => item.id === proposalId);
  if (!request || !proposal) throw new Error("Élément introuvable.");
  if (request.authorId !== studentId) throw new Error("Seul l’auteur peut accepter ou refuser une proposition.");
  if (request.status !== "open") throw new Error("Cette demande n’est plus ouverte.");
  if (proposal.status !== "pending") throw new Error("Cette proposition a déjà été traitée.");

  if (decision === "accepted") repo.acceptProposal(requestId, proposalId);
  else repo.refuseProposal(proposalId);
}

export function completeHelpSession(repo: CampusRepository, requestId: number, studentId: number) {
  const request = repo.findRequestById(requestId);
  if (!request) throw new Error("Demande introuvable.");
  if (request.authorId !== studentId) throw new Error("Seul l’auteur peut clôturer la demande.");
  if (request.status !== "accepted") throw new Error("La demande doit avoir une aide acceptée.");
  repo.completeRequest(requestId);
}

export function addReview(
  repo: CampusRepository,
  requestId: number,
  reviewerId: number,
  rating: number,
  comment: string,
) {
  const request = repo.findRequestById(requestId);
  if (!request) throw new Error("Demande introuvable.");
  if (request.status !== "completed") throw new Error("L’évaluation est autorisée après la clôture.");

  const proposals = repo.findProposals(requestId);
  const helper = proposals.find((item) => item.id === request.acceptedProposalId);
  if (request.authorId !== reviewerId && helper?.studentId !== reviewerId) {
    throw new Error("Vous n’avez pas participé à cette séance.");
  }
  if (repo.reviewExists(requestId, reviewerId)) throw new Error("Vous avez déjà évalué cette séance.");
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error("La note doit être comprise entre 1 et 5.");
  const cleanedComment = comment.trim();
  if (cleanedComment.length < 5) throw new Error("Le commentaire doit contenir au moins 5 caractères.");

  const revieweeId = reviewerId === request.authorId ? helper?.studentId : request.authorId;
  if (!revieweeId) throw new Error("Participant introuvable.");
  repo.createReview({ requestId, reviewerId, revieweeId, rating, comment: cleanedComment });
}

export function reportHelpRequest(repo: CampusRepository, requestId: number, reporterId: number, reason: string) {
  const cleaned = reason.trim();
  if (cleaned.length < 5) throw new Error("Indiquez une raison valide.");
  if (repo.reportExists(requestId, reporterId)) throw new Error("Cette publication a déjà été signalée par vous.");
  repo.createReport(requestId, reporterId, cleaned);
}

export function moderateHelpRequest(repo: CampusRepository, user: { role: "student" | "admin" }, requestId: number, action: "keep" | "hide") {
  if (user.role !== "admin") throw new Error("Accès administrateur requis.");
  repo.moderateRequest(requestId, action);
}
