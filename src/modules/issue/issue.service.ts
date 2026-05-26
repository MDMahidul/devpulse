import { pool } from "../../db";
import type { IIssue } from "./issue.interface";

const postIssueIntoDB = async (payload: IIssue) => {
  const { title, description, type, status, reporter_id } = payload;
  const result = await pool.query(
    `INSERT INTO issues(title,description,type,status,reporter_id) VALUES($1,$2,$3,(COALESCE($4,'open')),$5) RETURNING *`,
    [title, description, type, status, reporter_id],
  );

  return result;
};

export const issueService = { postIssueIntoDB };
