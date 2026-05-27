import { pool } from "../../db";
import type { IssueFilters } from "../../types";
import type { IIssue } from "./issue.interface";

const postIssueIntoDB = async (payload: IIssue) => {
  const { title, description, type, status, reporter_id } = payload;
  const result = await pool.query(
    `INSERT INTO issues(title,description,type,status,reporter_id) VALUES($1,$2,$3,(COALESCE($4,'open')),$5) RETURNING *`,
    [title, description, type, status, reporter_id],
  );

  return result;
};

const getAllIssuesFromDB = async (params: IssueFilters) => {
  const { sort, type, status } = params;

  /* query builder */
  const conditions: string[] = [];
  const filters: any[] = [];

  if (type) {
    filters.push(type);
    conditions.push(`type = $${filters.length}`);
  }

  if (status) {
    filters.push(status);
    conditions.push(`status = $${filters.length}`);
  }

  /* based on the conditions build where conditions and sorting */
  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const orderClause =
    sort === "oldest" ? "ORDER BY created_at ASC" : "ORDER BY created_at DESC";

  const { rows: issues } = await pool.query(
    `SELECT * FROM issues ${whereClause}
     ${orderClause}`,
    filters,
  );

  /* to avoid 2nd query running if empty */
  if (!issues.length) {
    return [];
  }

  /* using set to get the unique reporter id */
  const reporterIds = [...new Set(issues.map((issue) => issue.reporter_id))];

  const { rows: users } = await pool.query(
    `SELECT id, name, role FROM users WHERE id = ANY($1)`,
    [reporterIds],
  );

  /* lookup map to get user data faster */
  const usersMap = new Map(users.map((user) => [user.id, user]));

  const result = issues.map((issue) => ({
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter: usersMap.get(issue.reporter_id),
    created_at: issue.created_at,
    updated_at: issue.updated_at,
  }));

  return result;
};

export const issueService = { postIssueIntoDB, getAllIssuesFromDB };
