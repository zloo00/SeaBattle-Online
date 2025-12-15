import { Request } from "express";
import { User } from "../models/user";
import { verifyJwt } from "../auth/jwt";

export interface GraphQLContext {
  user:
    | {
        id: string;
        username: string;
        email: string;
      }
    | null;
}

export const buildContext = async ({ req }: { req: Request }): Promise<GraphQLContext> => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return { user: null };
  }

  const payload = verifyJwt(token);
  if (!payload) {
    return { user: null };
  }

  const user = await User.findById(payload.sub).lean();
  if (!user) {
    return { user: null };
  }

  return { user: { id: user._id.toString(), username: user.username, email: user.email } };
};
