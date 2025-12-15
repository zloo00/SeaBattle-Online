import { GraphQLScalarType, Kind } from "graphql";
import { User } from "../models/user";
import { registerSchema, loginSchema } from "../validation/authSchemas";
import { hashPassword, verifyPassword } from "../auth/password";
import { signJwt } from "../auth/jwt";
import { GraphQLContext } from "./context";
import { requireAuth } from "../auth/guards";
import { GameRoom } from "../models/gameRoom";
import { Ship } from "../models/ship";
import { placeShipsSchema } from "../validation/gameSchemas";
import { validateShipFleet } from "../validation/shipValidation";

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
    },
    myShips: async (_: unknown, { roomId }: { roomId: string }, ctx: GraphQLContext) => {
      const currentUser = requireAuth(ctx);
      const room = await GameRoom.findById(roomId);

      if (!room || room.isDeleted) {
        throw new Error("Комната не найдена");
      }

      const isParticipant = room.participants.some(
        (id) => id.toString() === currentUser.id
      );
      if (!isParticipant) {
        throw new Error("Вы не участник этой комнаты");
      }

      const ships = await Ship.find({ roomId: room._id, playerId: currentUser.id });
      return ships.map(mapShip);
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
    },
    placeShips: async (_: unknown, { input }: { input: unknown }, ctx: GraphQLContext) => {
      const currentUser = requireAuth(ctx);
      const data = placeShipsSchema.parse(input);

      const room = await GameRoom.findById(data.roomId);
      if (!room || room.isDeleted) {
        throw new Error("Комната не найдена");
      }

      const isParticipant = room.participants.some(
        (id) => id.toString() === currentUser.id
      );
      if (!isParticipant) {
        throw new Error("Вы не участник этой комнаты");
      }

      validateShipFleet(data.ships);

      await Ship.deleteMany({ roomId: room._id, playerId: currentUser.id });

      const createdShips = await Ship.insertMany(
        data.ships.map((ship) => ({
          ...ship,
          roomId: room._id,
          playerId: currentUser.id,
          hits: 0
        }))
      );

      if (room.status === "waiting") {
        room.status = "placing";
      }

      const placedPlayers = await Ship.distinct("playerId", { roomId: room._id });
      const expectedPlayers = room.participants.length;
      if (expectedPlayers > 0 && placedPlayers.length >= expectedPlayers) {
        room.status = "playing";
        if (!room.currentTurn) {
          room.currentTurn = room.participants[0] ?? null;
        }
      }
      await room.save();

      return createdShips.map(mapShip);
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

const mapShip = (ship: any) => ({
  id: ship._id.toString(),
  playerId: ship.playerId.toString(),
  roomId: ship.roomId.toString(),
  startX: ship.startX,
  startY: ship.startY,
  length: ship.length,
  orientation: ship.orientation,
  hits: ship.hits,
  createdAt: ship.createdAt,
  updatedAt: ship.updatedAt
});
