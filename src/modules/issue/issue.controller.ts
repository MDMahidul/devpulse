import type { Request, Response } from "express";
import { issueService } from "./issue.service";
import sendResponse from "../../utils/sendResponse";
import type { IssueFilters } from "../../types";
import { StatusCodes } from "http-status-codes";

const postIssue = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
   // console.log("userId from issue controller", userId);
    if (!userId) {
      sendResponse(res, {
        statusCode: StatusCodes.UNAUTHORIZED,
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
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Issue created successfully",
      data: result.rows[0],
    });
  } catch (error: unknown) {
    sendResponse(res, {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      success: false,
      message: error instanceof Error ? error.message : "An unexpected error occurred",
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
    const result = await issueService.getAllIssuesFromDB(
      params as IssueFilters,
    );
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Issues retrieved successfully",
      data: result,
    });
  } catch (error: unknown) {
    sendResponse(res, {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      success: false,
      message: error instanceof Error ? error.message : "An unexpected error occurred",
      error: error,
    });
  }
};

const getSingleIssue = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await issueService.getSingleIssueFromDB(id as string);
    if (!result) {
      sendResponse(res, {
        statusCode: StatusCodes.NOT_FOUND,
        success: false,
        message: "Issue Not Found!!",
        data: {},
      });
    }

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Issue retrieved successfully",
      data: result,
    });
  } catch (error: unknown) {
    sendResponse(res, {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      success: false,
      message: error instanceof Error ? error.message : "An unexpected error occurred",
      error: error,
    });
  }
};

const deleteSingleIssue = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await issueService.deleteSingleIssueFromDB(id as string);
    if (result.rowCount === 0) {
      sendResponse(res, {
        statusCode: StatusCodes.NOT_FOUND,
        success: false,
        message: "Issue Not Found!!",
        data: {},
      });
    }

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Issue deleted successfully",
    });
  } catch (error: unknown) {
    sendResponse(res, {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      success: false,
      message: error instanceof Error ? error.message : "An unexpected error occurred",
      error: error,
    });
  }
};

const updateIssue = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await issueService.updateIssueIntoDB(
      id as string,
      req.body,
      req.user!,
    );
    if (!result) {
      sendResponse(res, {
        statusCode: StatusCodes.NOT_FOUND,
        success: false,
        message: "Issue Not Found!!",
        data: {},
      });
    }

    if (result === "forbidden") {
      sendResponse(res, {
        statusCode: StatusCodes.FORBIDDEN,
        success: false,
        message: "Forbidden!!",
        data: {},
      });
    }

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Issue updated successfully",
      data: result,
    });
  } catch (error: unknown) {
    sendResponse(res, {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      success: false,
      message: error instanceof Error ? error.message : "An unexpected error occurred",
      error: error,
    });
  }
};

export const issueController = {
  postIssue,
  getAllIssues,
  getSingleIssue,
  deleteSingleIssue,
  updateIssue,
};
