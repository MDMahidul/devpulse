import type { Request, Response } from "express";
import { issueService } from "./issue.service";
import sendResponse from "../../utils/sendResponse";

const postIssue = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    console.log("userId from issue controller", userId);
    if (!userId) {
      sendResponse(res, {
        statusCode: 401,
        success: false,
        message: "Unauthorized access!!!",
      });
    }
    const issueData = {
      ...req.body,
      reporter_id: userId,
    };
    const result = await issueService.postIssueIntoDB(issueData);

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Issue created successfully",
      data: result.rows[0],
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error: error,
    });
  }
};

const getAllIssues = async (req: Request, res: Response) => {
  const { sort, type, status } = req.query;

  const params = {
    sort: sort === "oldest" ? "oldest" : "newest",
    type: ["bug", "feature_request"].includes(type as string)
      ? type
      : undefined,
    status: ["open", "in_progress", "resolved"].includes(status as string)
      ? status
      : undefined,
  };
  try {
    const result = await issueService.getAllIssuesFromDB(params);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issues retrieved successfully",
      data: result,
    });
  } catch (error: any) {
    console.log(error);
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error: error,
    });
  }
};

export const issueController = { postIssue, getAllIssues };
