import type { JwtPayload } from "jsonwebtoken";
import { pool } from "../../db";
import type { IssueFilters } from "../../types";
import type { IIssue } from "./issue.interface";
import { formatIssue } from "../../utils/formatIssue";

const fetchReporter = async (reporterId: string) => {
  const { rows } = await pool.query(
    `SELECT id, name, role FROM users WHERE id = $1`,
    [reporterId],
  );
  return rows[0] ?? null;
};

const fetchReportersMapper = async (reporterIds: string[]) => {
  const { rows } = await pool.query(
    `SELECT id, name, role FROM users WHERE id = ANY($1)`,
    [reporterIds],
  );

  /* lookup map to get user data  */
  return new Map(rows.map((user) => [user.id, user]));
};

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
    return null;
  }

  /* using set to get the unique reporter id */
  const reporterIds = [...new Set(issues.map((issue) => issue.reporter_id))];
  const usersMap = await fetchReportersMapper(reporterIds);

  const result = issues.map((issue) =>
    formatIssue(issue, usersMap.get(issue.reporter_id) ?? null),
  );

  return result;
};

const getSingleIssueFromDB = async (id: string) => {
  const { rows } = await pool.query(`SELECT * FROM issues WHERE id=$1`, [id]);
  if (!rows.length) {
    return null;
  }
  const issue = rows[0];
  const reporter = await fetchReporter(issue.reporter_id);
  const result = formatIssue(issue, reporter);

  return result;
};

const deleteSingleIssueFromDB = async (id: string) => {
  const result = await pool.query(`DELETE FROM issues WHERE id = $1`, [id]);

  return result;
};

const updateIssueIntoDB = async (
  id: string,
  payload: Partial<IIssue>,
  user: JwtPayload,
) => {
  const { title, description, type } = payload;
  const { rows } = await pool.query(`SELECT * FROM issues WHERE id=$1`, [id]);
  if (!rows.length) {
    return null;
  }
  if (
    user?.role === "contributor" &&
    (rows[0].reporter_id !== user.id || rows[0].status !== "open")
  ) {
    return "forbidden";
  }
  const result = await pool.query(
    `UPDATE issues SET title=COALESCE($1,title),description=COALESCE($2,description),type=COALESCE($3,type) 
        WHERE id = $4  RETURNING id, title, description, type, status, reporter_id, created_at, updated_at`,
    [title, description, type, id],
  );
  return result.rows[0];
};

export const issueService = {
  postIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  deleteSingleIssueFromDB,
  updateIssueIntoDB,
};
