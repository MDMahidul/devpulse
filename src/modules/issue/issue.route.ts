import { Router } from "express";
import { issueController } from "./issue.controller";
import auth from "../../middleware/auth";
import { USER_ROLE } from "../../types";

const router = Router();

router.post(
  "/",
  auth(USER_ROLE.contributor, USER_ROLE.maintainer),
  issueController.postIssue,
);
router.get("/", issueController.getAllIssues);
router.get("/:id", issueController.getSingleIssue);
router.delete("/:id",auth(USER_ROLE.maintainer), issueController.deleteSingleIssue);
router.patch("/:id", auth(USER_ROLE.contributor, USER_ROLE.maintainer), issueController.updateIssue);

export const issueRouter = router;
