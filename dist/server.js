

   import { createRequire } from 'module';

   const require = createRequire(import.meta.url);

  

// src/app.ts
import express from "express";

// src/modules/auth/auth.route.ts
import { Router } from "express";

// src/db/index.ts
import { Pool } from "pg";

// src/config/index.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({
  path: path.join(process.cwd(), ".env")
});
var config = {
  port: process.env.PORT,
  connection_string: process.env.CONNECTION_STRING,
  jwt_secret: process.env.JWT_SECRET,
  access_token_duration: process.env.ACCESS_TOKEN_DURATION,
  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS
};
var config_default = config;

// src/db/index.ts
var pool = new Pool({
  connectionString: config_default.connection_string
});
var initDB = async () => {
  try {
    await pool.query(`
       CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY, 
            name VARCHAR(50), 
            email VARCHAR(50) UNIQUE NOT NULL,
            password TEXT NOT NULL,role VARCHAR(25) DEFAULT 'contributor',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
            )
        `);
    await pool.query(
      `CREATE TABLE IF NOT EXISTS issues (
          id SERIAL PRIMARY KEY,
          title VARCHAR(150) NOT NULL,
          description TEXT NOT NULL,
          type VARCHAR(20) NOT NULL,
          status VARCHAR(20) DEFAULT 'open',
          reporter_id INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )`
    );
    console.log("DB connected successfully!!!");
  } catch (error) {
    console.log(error);
  }
};

// src/modules/auth/auth.service.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
var createUserIntoDB = async (payload) => {
  const { name, email, password, role } = payload;
  const hashPassword = await bcrypt.hash(password, config_default.bcrypt_salt_rounds);
  const result = await pool.query(
    `
    INSERT INTO users(name, email, password, role) VALUES($1,$2,$3,COALESCE($4,'contributor')) RETURNING *
    `,
    [name, email, hashPassword, role]
  );
  delete result.rows[0].password;
  return result;
};
var loginUserIntoDB = async (payload) => {
  const { email, password } = payload;
  const userData = await pool.query(`SELECT * FROM users WHERE email=$1`, [
    email
  ]);
  if (userData.rows.length === 0) {
    throw new Error("Invalid Credentials");
  }
  const user = userData.rows[0];
  const matchPassword = await bcrypt.compare(password, user.password);
  if (!matchPassword) {
    throw new Error("Invalid Credentials");
  }
  delete userData.rows[0].password;
  const jwtPayload = {
    id: user.id,
    name: user.name,
    role: user.role,
    email: user.email
  };
  const token = jwt.sign(jwtPayload, config_default.jwt_secret, {
    expiresIn: "1d"
  });
  return { token, user };
};
var authService = {
  createUserIntoDB,
  loginUserIntoDB
};

// src/utils/sendResponse.ts
var sendResponse = (res, data) => {
  res.status(data.statusCode).json({
    success: data.success,
    message: data.message,
    data: data.data,
    error: data.error
  });
};
var sendResponse_default = sendResponse;

// src/modules/auth/auth.controller.ts
import { StatusCodes } from "http-status-codes";
var registerUser = async (req, res) => {
  try {
    const result = await authService.createUserIntoDB(req.body);
    sendResponse_default(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "User registered successfully",
      data: result.rows[0]
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      success: false,
      message: error instanceof Error ? error.message : "An unexpected error occurred",
      error
    });
  }
};
var loginUser = async (req, res) => {
  try {
    const result = await authService.loginUserIntoDB(req.body);
    sendResponse_default(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Login successful",
      data: result
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      success: false,
      message: error instanceof Error ? error.message : "An unexpected error occurred",
      error
    });
  }
};
var authController = {
  registerUser,
  loginUser
};

// src/modules/auth/auth.route.ts
var router = Router();
router.post("/signup", authController.registerUser);
router.post("/login", authController.loginUser);
var authRouter = router;

// src/modules/issue/issue.route.ts
import { Router as Router2 } from "express";

// src/utils/formatIssue.ts
var formatIssue = (issue, reporter = null) => ({
  id: issue.id,
  title: issue.title,
  description: issue.description,
  type: issue.type,
  status: issue.status,
  reporter: reporter ?? null,
  created_at: issue.created_at,
  updated_at: issue.updated_at
});

// src/modules/issue/issue.service.ts
var fetchReporter = async (reporterId) => {
  const { rows } = await pool.query(
    `SELECT id, name, role FROM users WHERE id = $1`,
    [reporterId]
  );
  return rows[0] ?? null;
};
var fetchReportersMapper = async (reporterIds) => {
  const { rows } = await pool.query(
    `SELECT id, name, role FROM users WHERE id = ANY($1)`,
    [reporterIds]
  );
  return new Map(rows.map((user) => [user.id, user]));
};
var postIssueIntoDB = async (payload) => {
  const { title, description, type, status, reporter_id } = payload;
  const result = await pool.query(
    `INSERT INTO issues(title,description,type,status,reporter_id) VALUES($1,$2,$3,(COALESCE($4,'open')),$5) RETURNING *`,
    [title, description, type, status, reporter_id]
  );
  return result;
};
var getAllIssuesFromDB = async (params) => {
  const { sort, type, status } = params;
  const conditions = [];
  const filters = [];
  if (type) {
    filters.push(type);
    conditions.push(`type = $${filters.length}`);
  }
  if (status) {
    filters.push(status);
    conditions.push(`status = $${filters.length}`);
  }
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const orderClause = sort === "oldest" ? "ORDER BY created_at ASC" : "ORDER BY created_at DESC";
  const { rows: issues } = await pool.query(
    `SELECT * FROM issues ${whereClause}
     ${orderClause}`,
    filters
  );
  if (!issues.length) {
    return null;
  }
  const reporterIds = [...new Set(issues.map((issue) => issue.reporter_id))];
  const usersMap = await fetchReportersMapper(reporterIds);
  const result = issues.map(
    (issue) => formatIssue(issue, usersMap.get(issue.reporter_id) ?? null)
  );
  return result;
};
var getSingleIssueFromDB = async (id) => {
  const { rows } = await pool.query(`SELECT * FROM issues WHERE id=$1`, [id]);
  if (!rows.length) {
    return null;
  }
  const issue = rows[0];
  const reporter = await fetchReporter(issue.reporter_id);
  const result = formatIssue(issue, reporter);
  return result;
};
var deleteSingleIssueFromDB = async (id) => {
  const result = await pool.query(`DELETE FROM issues WHERE id = $1`, [id]);
  return result;
};
var updateIssueIntoDB = async (id, payload, user) => {
  const { title, description, type } = payload;
  const { rows } = await pool.query(`SELECT * FROM issues WHERE id=$1`, [id]);
  if (!rows.length) {
    return null;
  }
  if (user?.role === "contributor" && (rows[0].reporter_id !== user.id || rows[0].status !== "open")) {
    return "forbidden";
  }
  const result = await pool.query(
    `UPDATE issues SET title=COALESCE($1,title),description=COALESCE($2,description),type=COALESCE($3,type) 
        WHERE id = $4  RETURNING id, title, description, type, status, reporter_id, created_at, updated_at`,
    [title, description, type, id]
  );
  return result.rows[0];
};
var issueService = {
  postIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  deleteSingleIssueFromDB,
  updateIssueIntoDB
};

// src/modules/issue/issue.controller.ts
import { StatusCodes as StatusCodes2 } from "http-status-codes";
var postIssue = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      sendResponse_default(res, {
        statusCode: StatusCodes2.UNAUTHORIZED,
        success: false,
        message: "Unauthorized access!!!"
      });
    }
    const issueData = {
      ...req.body,
      reporter_id: userId
    };
    const result = await issueService.postIssueIntoDB(issueData);
    sendResponse_default(res, {
      statusCode: StatusCodes2.CREATED,
      success: true,
      message: "Issue created successfully",
      data: result.rows[0]
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: StatusCodes2.INTERNAL_SERVER_ERROR,
      success: false,
      message: error instanceof Error ? error.message : "An unexpected error occurred",
      error
    });
  }
};
var getAllIssues = async (req, res) => {
  const { sort, type, status } = req.query;
  const params = {
    sort: sort === "oldest" ? "oldest" : "newest",
    type: ["bug", "feature_request"].includes(type) ? type : void 0,
    status: ["open", "in_progress", "resolved"].includes(status) ? status : void 0
  };
  try {
    const result = await issueService.getAllIssuesFromDB(
      params
    );
    sendResponse_default(res, {
      statusCode: StatusCodes2.OK,
      success: true,
      message: "Issues retrieved successfully",
      data: result
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: StatusCodes2.INTERNAL_SERVER_ERROR,
      success: false,
      message: error instanceof Error ? error.message : "An unexpected error occurred",
      error
    });
  }
};
var getSingleIssue = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await issueService.getSingleIssueFromDB(id);
    if (!result) {
      sendResponse_default(res, {
        statusCode: StatusCodes2.NOT_FOUND,
        success: false,
        message: "Issue Not Found!!",
        data: {}
      });
    }
    sendResponse_default(res, {
      statusCode: StatusCodes2.OK,
      success: true,
      message: "Issue retrieved successfully",
      data: result
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: StatusCodes2.INTERNAL_SERVER_ERROR,
      success: false,
      message: error instanceof Error ? error.message : "An unexpected error occurred",
      error
    });
  }
};
var deleteSingleIssue = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await issueService.deleteSingleIssueFromDB(id);
    if (result.rowCount === 0) {
      sendResponse_default(res, {
        statusCode: StatusCodes2.NOT_FOUND,
        success: false,
        message: "Issue Not Found!!",
        data: {}
      });
    }
    sendResponse_default(res, {
      statusCode: StatusCodes2.OK,
      success: true,
      message: "Issue deleted successfully"
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: StatusCodes2.INTERNAL_SERVER_ERROR,
      success: false,
      message: error instanceof Error ? error.message : "An unexpected error occurred",
      error
    });
  }
};
var updateIssue = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await issueService.updateIssueIntoDB(
      id,
      req.body,
      req.user
    );
    if (!result) {
      sendResponse_default(res, {
        statusCode: StatusCodes2.NOT_FOUND,
        success: false,
        message: "Issue Not Found!!",
        data: {}
      });
    }
    if (result === "forbidden") {
      sendResponse_default(res, {
        statusCode: StatusCodes2.FORBIDDEN,
        success: false,
        message: "Forbidden!!",
        data: {}
      });
    }
    sendResponse_default(res, {
      statusCode: StatusCodes2.OK,
      success: true,
      message: "Issue updated successfully",
      data: result
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: StatusCodes2.INTERNAL_SERVER_ERROR,
      success: false,
      message: error instanceof Error ? error.message : "An unexpected error occurred",
      error
    });
  }
};
var issueController = {
  postIssue,
  getAllIssues,
  getSingleIssue,
  deleteSingleIssue,
  updateIssue
};

// src/middleware/auth.ts
import jwt2 from "jsonwebtoken";
import { StatusCodes as StatusCodes3 } from "http-status-codes";
var auth = (...roles) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization;
      if (!token) {
        sendResponse_default(res, {
          statusCode: StatusCodes3.UNAUTHORIZED,
          success: false,
          message: "Unauthorized access!!!"
        });
      }
      const decoded = jwt2.verify(
        token,
        config_default.jwt_secret
      );
      const userData = await pool.query(
        `SELECT * FROM users WHERE email = $1`,
        [decoded.email]
      );
      const user = userData.rows[0];
      if (userData.rows.length === 0) {
        sendResponse_default(res, {
          statusCode: StatusCodes3.NOT_FOUND,
          success: false,
          message: "User not found!!!"
        });
      }
      if (roles.length && !roles.includes(user.role)) {
        sendResponse_default(res, {
          statusCode: StatusCodes3.UNAUTHORIZED,
          success: false,
          message: "Unauthorized!!!"
        });
      }
      req.user = decoded;
      next();
    } catch (error) {
      next(error);
    }
  };
};
var auth_default = auth;

// src/types/index.ts
var USER_ROLE = {
  contributor: "contributor",
  maintainer: "maintainer"
};

// src/modules/issue/issue.route.ts
var router2 = Router2();
router2.post(
  "/",
  auth_default(USER_ROLE.contributor, USER_ROLE.maintainer),
  issueController.postIssue
);
router2.get("/", issueController.getAllIssues);
router2.get("/:id", issueController.getSingleIssue);
router2.delete("/:id", auth_default(USER_ROLE.maintainer), issueController.deleteSingleIssue);
router2.patch("/:id", auth_default(USER_ROLE.contributor, USER_ROLE.maintainer), issueController.updateIssue);
var issueRouter = router2;

// src/middleware/globalErrorHandler.ts
var globalErrorHandler = (err, req, res, next) => {
  sendResponse_default(res, {
    statusCode: 500,
    success: false,
    message: err.message || "Internal Server Error",
    error: err
  });
};
var globalErrorHandler_default = globalErrorHandler;

// src/app.ts
var app = express();
app.use(express.json());
app.use("/api/auth", authRouter);
app.use("/api/issues", issueRouter);
app.use(globalErrorHandler_default);
app.get("/", (req, res) => {
  res.status(200).json({
    message: "DevPluse",
    test: "Yo test"
  });
});
var app_default = app;

// src/server.ts
var main = () => {
  const port = config_default.port;
  initDB();
  app_default.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
};
main();
//# sourceMappingURL=server.js.map