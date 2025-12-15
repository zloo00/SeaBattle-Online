import { GraphQLContext } from "../graphql/context";

export const requireAuth = (ctx: GraphQLContext) => {
  if (!ctx.user) {
    throw new Error("Unauthorized");
  }
  return ctx.user;
};
