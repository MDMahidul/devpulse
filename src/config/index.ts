import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.join(process.cwd(), ".env"),
});
const config = {
  port: process.env.PORT,
  connection_string: process.env.CONNECTION_STRING as string,
  jwt_secret: process.env.JWT_SECRET as string,
  access_token_duration: process.env.ACCESS_TOKEN_DURATION as string,
};

export default config;
