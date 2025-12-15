import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface JwtPayload {
  sub: string;
  username: string;
  email: string;
}

export const signJwt = (payload: JwtPayload) => {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: "7d" });
};

export const verifyJwt = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, env.jwtSecret) as JwtPayload;
  } catch {
    return null;
  }
};
