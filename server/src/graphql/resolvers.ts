import { GraphQLScalarType, Kind } from "graphql";
import { User } from "../models/user";
import { registerSchema, loginSchema } from "../validation/authSchemas";
import { hashPassword, verifyPassword } from "../auth/password";
import { signJwt } from "../auth/jwt";
import { GraphQLContext } from "./context";
import { requireAuth } from "../auth/guards";

const DateScalar = new GraphQLScalarType({
  name: "Date",
  serialize(value: unknown) {
    if (value instanceof Date) {
      return value.toISOString();
    }
    return new Date(value as string | number).toISOString();
  },
  parseValue(value: unknown) {
    return new Date(value as string);
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING || ast.kind === Kind.INT) {
      return new Date(ast.value);
    }
    return null;
  }
});

export const resolvers = {
  Date: DateScalar,
  Query: {
    me: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      const currentUser = requireAuth(ctx);
      const user = await User.findById(currentUser.id);
      return user ? mapUser(user) : null;
    }
  },
  Mutation: {
    register: async (_: unknown, { input }: { input: unknown }) => {
      const data = registerSchema.parse(input);

      const existingUser = await User.findOne({
        $or: [{ email: data.email }, { username: data.username }]
      });
      if (existingUser) {
        throw new Error("User with that email or username already exists");
      }

      const passwordHash = await hashPassword(data.password);
      const user = await User.create({
        username: data.username,
        email: data.email,
        passwordHash
      });

      const token = signJwt({
        sub: user._id.toString(),
        username: user.username,
        email: user.email
      });

      return { token, user: mapUser(user) };
    },
    login: async (_: unknown, { input }: { input: unknown }) => {
      const data = loginSchema.parse(input);

      const user = await User.findOne({ email: data.email });
      if (!user) {
        throw new Error("Invalid credentials");
      }

      const matches = await verifyPassword(data.password, user.passwordHash);
      if (!matches) {
        throw new Error("Invalid credentials");
      }

      const token = signJwt({
        sub: user._id.toString(),
        username: user.username,
        email: user.email
      });

      return { token, user: mapUser(user) };
    }
  }
};

const mapUser = (user: any) => ({
  id: user._id.toString(),
  username: user.username,
  email: user.email,
  wins: user.wins,
  losses: user.losses,
  gamesPlayed: user.gamesPlayed,
  avatarUrl: user.avatarUrl,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});
