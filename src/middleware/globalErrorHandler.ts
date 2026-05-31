import type { NextFunction, Request, Response } from "express";
import sendResponse from "../utils/sendResponse";

const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  sendResponse(res, {
    statusCode: 500,
    success: false,
    message: err.message || "Internal Server Error",
    error: err,
  });
};

export default globalErrorHandler;
