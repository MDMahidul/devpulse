import type { IUser } from "../modules/auth/auth.interface";
import type { IIssue } from "../modules/issue/issue.interface";


export const formatIssue = (issue: IIssue, reporter: IUser | null = null) => ({
  id: issue.id,
  title: issue.title,
  description: issue.description,
  type: issue.type,
  status: issue.status,
  reporter: reporter ?? null,
  created_at: issue.created_at,
  updated_at: issue.updated_at,
});
