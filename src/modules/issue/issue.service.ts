import { pool } from "../../db";
import type { IIssue } from "./issue.interface";

const postIssueIntoDB = async(payload:IIssue) => {
    const {title,description,type,status,reporter_id}=payload;

    const result=await pool.query(`INSERT INTO issues(title,description,type,status,reporter_id) VALUES`)

};

export const issueService = { postIssueIntoDB };
