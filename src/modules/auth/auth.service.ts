import { pool } from "../../db";
import bcrypt from "bcryptjs";
import type { IUser } from "./auth.interface";
import jwt from "jsonwebtoken";
import config from "../../config";

const createUserIntoDB = async (payload: IUser) => {
  const { name, email, password, role } = payload;
  const hashPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `
    INSERT INTO users(name, email, password, role) VALUES($1,$2,$3,COALESCE($4,'contributor')) RETURNING *
    `,
    [name, email, hashPassword, role],
  );
  delete result.rows[0].password;

  return result;
};

const loginUserIntoDB = async (payload: {
  email: string;
  password: string;
}) => {
  const { email, password } = payload;

  const userData = await pool.query(`SELECT * FROM users WHERE email=$1`, [
    email,
  ]);

  if (userData.rows.length === 0) {
    throw new Error("Invalid Credentials");
  }

  /* get user data */
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
    email: user.email,
  };

  const token = jwt.sign(jwtPayload, config.jwt_secret, {
    expiresIn: config.access_token_duration,
  });

  return { token, user };
};

export const authService = {
  createUserIntoDB,
  loginUserIntoDB,
};
