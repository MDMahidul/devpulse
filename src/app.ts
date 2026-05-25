import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import { authRouter } from "./modules/auth/auth.route";

const app: Application = express();

/* middleware */
app.use(express.json());

app.use("/api/auth", authRouter);

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "DevPluse",
    test: "Yo test",
  });
});

export default app;
