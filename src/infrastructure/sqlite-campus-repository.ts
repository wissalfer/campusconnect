// Couche Infrastructure : implémentation technique du contrat CampusRepository.
// Remplacer SQLite par LocalStorage ou une API ne devrait pas obliger à modifier les use cases.
import { db } from "./sqlite-db";
import type { CampusRepository, DashboardData, RequestFilters } from "@/domain/campus-repository";
import type { HelpRequest, Proposal, Review, Student } from "@/domain/campus";

type RequestRow = {
  id:number; author_id:number; name:string; title:string; description:string; subject:string;
  level:string; availability:string; status:HelpRequest["status"]; accepted_proposal_id:number|null; report_count:number;
};

function toRequest(row: RequestRow): HelpRequest {
  return {
    id: row.id,
    authorId: row.author_id,
    authorName: row.name,
    title: row.title,
    description: row.description,
    subject: row.subject,
    level: row.level,
    availability: row.availability,
    status: row.status,
    acceptedProposalId: row.accepted_proposal_id,
    reportCount: row.report_count,
  };
}

export class SqliteCampusRepository implements CampusRepository {
  findRecentRequests(limit: number): HelpRequest[] {
    return (db.prepare(`
      SELECT r.*, u.name FROM requests r JOIN users u ON u.id=r.author_id
      WHERE r.status!='closed' ORDER BY r.created_at DESC LIMIT ?
    `).all(limit) as RequestRow[]).map(toRequest);
  }

  findRequests(filters: RequestFilters): HelpRequest[] {
    const conditions = ["r.status!='closed'"];
    const params: unknown[] = [];
    if (filters.subject) { conditions.push("r.subject LIKE ?"); params.push(`%${filters.subject}%`); }
    if (filters.level) { conditions.push("r.level=?"); params.push(filters.level); }
    if (filters.status) { conditions.push("r.status=?"); params.push(filters.status); }
    if (filters.query) {
      conditions.push("(r.title LIKE ? OR r.description LIKE ?)");
      params.push(`%${filters.query}%`, `%${filters.query}%`);
    }
    return (db.prepare(`
      SELECT r.*, u.name FROM requests r JOIN users u ON u.id=r.author_id
      WHERE ${conditions.join(" AND ")} ORDER BY r.created_at DESC
    `).all(...params) as RequestRow[]).map(toRequest);
  }

  findRequestById(requestId: number): HelpRequest | null {
    const row = db.prepare(`
      SELECT r.*, u.name FROM requests r JOIN users u ON u.id=r.author_id WHERE r.id=?
    `).get(requestId) as RequestRow | undefined;
    return row ? toRequest(row) : null;
  }

  findProposals(requestId: number): Proposal[] {
    type Row = { id:number; request_id:number; student_id:number; name:string; title:string; message:string; skills:string; status:Proposal["status"] };
    return (db.prepare(`
      SELECT p.*, u.name, u.skills, r.title FROM proposals p JOIN users u ON u.id=p.student_id JOIN requests r ON r.id=p.request_id
      WHERE p.request_id=? ORDER BY p.created_at DESC
    `).all(requestId) as Row[]).map((row) => ({
      id: row.id, requestId: row.request_id, title: row.title, studentId: row.student_id,
      studentName: row.name, message: row.message, skills: row.skills, status: row.status,
    }));
  }

  findReview(requestId: number, reviewerId: number): Review | null {
    const row = db.prepare("SELECT * FROM reviews WHERE request_id=? AND reviewer_id=?").get(requestId, reviewerId) as
      { id:number; request_id:number; reviewer_id:number; reviewee_id:number; rating:number; comment:string } | undefined;
    return row ? {
      id: row.id, requestId: row.request_id, reviewerId: row.reviewer_id,
      revieweeId: row.reviewee_id, rating: row.rating, comment: row.comment,
    } : null;
  }

  findDashboard(studentId: number): DashboardData {
    const published = (db.prepare(`
      SELECT r.*, u.name FROM requests r JOIN users u ON u.id=r.author_id
      WHERE r.author_id=? AND r.status!='closed' ORDER BY r.created_at DESC
    `).all(studentId) as RequestRow[]).map(toRequest);

    type ProposalRow = { id:number; request_id:number; title:string; student_id:number; name:string; message:string; skills:string; status:Proposal["status"] };
    const proposals = (db.prepare(`
      SELECT p.*, r.title, u.name, u.skills FROM proposals p
      JOIN requests r ON r.id=p.request_id JOIN users u ON u.id=p.student_id
      WHERE p.student_id=? ORDER BY p.created_at DESC
    `).all(studentId) as ProposalRow[]).map((row) => ({
      id: row.id, requestId: row.request_id, title: row.title, studentId: row.student_id,
      studentName: row.name, message: row.message, skills: row.skills, status: row.status,
    }));

    const completed = (db.prepare(`
      SELECT r.*, u.name FROM requests r JOIN users u ON u.id=r.author_id
      WHERE r.status='completed' AND (r.author_id=? OR r.accepted_proposal_id IN
      (SELECT id FROM proposals WHERE student_id=?))
    `).all(studentId, studentId) as RequestRow[]).map(toRequest);
    return { published, proposals, completed };
  }

  findReports(): Array<HelpRequest & { authorName:string; pendingCount:number }> {
    type Row = RequestRow & { author:string; pending_count:number };
    return (db.prepare(`
      SELECT r.*, u.name AS author,
      (SELECT COUNT(*) FROM reports x WHERE x.request_id=r.id AND x.status='pending') AS pending_count
      FROM requests r JOIN users u ON u.id=r.author_id
      WHERE r.id IN (SELECT request_id FROM reports WHERE status='pending')
      ORDER BY r.report_count DESC
    `).all() as Row[]).map((row) => ({
      ...toRequest({ ...row, name: row.author }), authorName: row.author, pendingCount: row.pending_count,
    }));
  }

  createRequest(input: Omit<HelpRequest,"id"|"authorName"|"status"|"acceptedProposalId"|"reportCount">): number {
    const result = db.prepare(`
      INSERT INTO requests (author_id,title,description,subject,level,availability,status)
      VALUES (?,?,?,?,?,?,?)
    `).run(input.authorId,input.title,input.description,input.subject,input.level,input.availability,"open");
    return Number(result.lastInsertRowid);
  }

  createProposal(requestId:number,studentId:number,message:string) {
    db.prepare("INSERT INTO proposals (request_id,student_id,message,status) VALUES (?,?,?,?)")
      .run(requestId,studentId,message,"pending");
  }

  acceptProposal(requestId:number,proposalId:number) {
    db.transaction(() => {
      db.prepare("UPDATE proposals SET status='refused' WHERE request_id=? AND id<>?").run(requestId,proposalId);
      db.prepare("UPDATE proposals SET status='accepted' WHERE id=?").run(proposalId);
      db.prepare("UPDATE requests SET status='accepted',accepted_proposal_id=? WHERE id=?").run(proposalId,requestId);
    })();
  }

  refuseProposal(proposalId:number) { db.prepare("UPDATE proposals SET status='refused' WHERE id=?").run(proposalId); }
  completeRequest(requestId:number) { db.prepare("UPDATE requests SET status='completed' WHERE id=?").run(requestId); }

  createReview(input: Omit<Review,"id">) {
    db.prepare("INSERT INTO reviews (request_id,reviewer_id,reviewee_id,rating,comment) VALUES (?,?,?,?,?)")
      .run(input.requestId,input.reviewerId,input.revieweeId,input.rating,input.comment);
  }

  createReport(requestId:number,reporterId:number,reason:string) {
    db.prepare("INSERT INTO reports (request_id,reporter_id,reason,status) VALUES (?,?,?,?)")
      .run(requestId,reporterId,reason,"pending");
    db.prepare("UPDATE requests SET report_count=(SELECT COUNT(*) FROM reports WHERE request_id=? AND status='pending') WHERE id=?")
      .run(requestId,requestId);
  }

  moderateRequest(requestId:number,action:"keep"|"hide") {
    if(action==="hide") db.prepare("UPDATE requests SET status='closed' WHERE id=?").run(requestId);
    db.prepare("UPDATE reports SET status=? WHERE request_id=?").run(action==="hide"?"treated":"dismissed",requestId);
    db.prepare("UPDATE requests SET report_count=0 WHERE id=?").run(requestId);
  }

  updateProfile(studentId:number,input:Pick<Student,"name"|"speciality"|"level"|"skills">) {
    db.prepare("UPDATE users SET name=?,speciality=?,level=?,skills=? WHERE id=?")
      .run(input.name,input.speciality,input.level,input.skills,studentId);
  }

  findUserByEmail(email:string): (Student & {password:string}) | null {
    return db.prepare("SELECT * FROM users WHERE email=?").get(email) as (Student & {password:string}) | null;
  }

  findUserById(userId:number): Student | null {
    return db.prepare("SELECT id,name,email,speciality,level,skills,role FROM users WHERE id=?").get(userId) as Student | null;
  }

  createUser(input:Omit<Student,"id"|"role"> & {password:string}):number {
    const result=db.prepare("INSERT INTO users (name,email,password,speciality,level,skills,role) VALUES (?,?,?,?,?,?,?)")
      .run(input.name,input.email,input.password,input.speciality,input.level,input.skills,"student");
    return Number(result.lastInsertRowid);
  }

  emailExists(email:string) { return Boolean(db.prepare("SELECT id FROM users WHERE email=?").get(email)); }
  proposalExists(requestId:number,studentId:number) { return Boolean(db.prepare("SELECT id FROM proposals WHERE request_id=? AND student_id=?").get(requestId,studentId)); }
  reportExists(requestId:number,reporterId:number) { return Boolean(db.prepare("SELECT id FROM reports WHERE request_id=? AND reporter_id=?").get(requestId,reporterId)); }
  reviewExists(requestId:number,reviewerId:number) { return Boolean(db.prepare("SELECT id FROM reviews WHERE request_id=? AND reviewer_id=?").get(requestId,reviewerId)); }
}
