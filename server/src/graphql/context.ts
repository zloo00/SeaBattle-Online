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

const resolveUserFromToken = async (token: string | null) => {
  if (!token) {
    return null;
  }
  const payload = verifyJwt(token);
  if (!payload) {
    return null;
  }
  const user = await User.findById(payload.sub).lean();
  if (!user) {
    return null;
  }
  return { id: user._id.toString(), username: user.username, email: user.email };
};

export const buildContext = async ({ req }: { req: Request }): Promise<GraphQLContext> => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const user = await resolveUserFromToken(token);
  return { user };
};

export const buildWsContext = async ({
  connectionParams
}: {
  connectionParams?: Record<string, unknown>;
}): Promise<GraphQLContext> => {
  const authHeader =
    (connectionParams?.Authorization as string | undefined) ||
    (connectionParams?.authorization as string | undefined) ||
    "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const user = await resolveUserFromToken(token);
  return { user };
};
