import { SqliteCampusRepository } from "./sqlite-campus-repository";

// Instance technique unique utilisée par la présentation.
// Les use cases restent indépendants : ils ne voient que CampusRepository.
export const campusRepository = new SqliteCampusRepository();
