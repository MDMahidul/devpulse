import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import { userRouter } from "./modules/user/user.route";

const app: Application = express();

/* middleware */
app.use(express.json());

app.use("/api/users", userRouter);

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "DevPluse",
    test: "Yo test",
  });
});

export default app;
