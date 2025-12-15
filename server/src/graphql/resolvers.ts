import { GraphQLScalarType, Kind } from "graphql";
import { withFilter } from "graphql-subscriptions";
import { User } from "../models/user";
import { registerSchema, loginSchema } from "../validation/authSchemas";
import { hashPassword, verifyPassword } from "../auth/password";
import { signJwt } from "../auth/jwt";
import { GraphQLContext } from "./context";
import { requireAuth } from "../auth/guards";
import { GameRoom } from "../models/gameRoom";
import { Ship } from "../models/ship";
import { Message } from "../models/message";
import { Shot } from "../models/shot";
import {
  messageInputSchema,
  placeShipsSchema,
  createRoomSchema,
  joinRoomSchema,
  leaveRoomSchema,
  roomSearchSchema,
  makeShotSchema
} from "../validation/gameSchemas";
import { validateShipFleet } from "../validation/shipValidation";
import { MESSAGE_ADDED, ROOM_UPDATED, SHOT_FIRED, pubsub } from "./pubsub";
import { checkHit, checkSunk, checkWin } from "../services/combat";

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
    messages: async (_: unknown, { roomId }: { roomId: string }, ctx: GraphQLContext) => {
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

      const messages = await Message.find({ roomId: room._id })
        .sort({ timestamp: 1 })
        .limit(100);
      return messages.map(mapMessage);
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
    },
    shots: async (_: unknown, { roomId }: { roomId: string }, ctx: GraphQLContext) => {
      const currentUser = requireAuth(ctx);
      const room = await GameRoom.findById(roomId);
      if (!room || room.isDeleted) {
        throw new Error("Room not found");
      }
      const isParticipant = room.participants.some(
        (id) => id.toString() === currentUser.id
      );
      if (!isParticipant) {
        throw new Error("You are not part of this room");
      }
      const records = await Shot.find({ roomId: room._id }).sort({ timestamp: 1 });
      return records.map(mapShot);
    },
    room: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      const currentUser = requireAuth(ctx);
      const room = await GameRoom.findById(id);
      if (!room || room.isDeleted) {
        throw new Error("Room not found");
      }
      const isParticipant = room.participants.some(
        (participantId) => participantId.toString() === currentUser.id
      );
      if (!isParticipant) {
        throw new Error("You are not part of this room");
      }
      return mapRoom(room);
    },
    getPublicRooms: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      requireAuth(ctx);
      const rooms = await GameRoom.find({
        isDeleted: false,
        password: { $in: [null, ""] }
      })
        .sort({ createdAt: -1 })
        .limit(50);
      return rooms.map(mapRoom);
    },
    searchRooms: async (_: unknown, { term }: { term: string }, ctx: GraphQLContext) => {
      requireAuth(ctx);
      const { term: parsedTerm } = roomSearchSchema.parse({ term });
      const rooms = await GameRoom.find({
        isDeleted: false,
        name: { $regex: parsedTerm, $options: "i" }
      })
        .sort({ createdAt: -1 })
        .limit(50);
      return rooms.map(mapRoom);
    },
    getMyRooms: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      const currentUser = requireAuth(ctx);
      const rooms = await GameRoom.find({
        isDeleted: false,
        participants: currentUser.id
      }).sort({ updatedAt: -1 });
      return rooms.map(mapRoom);
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
    sendMessage: async (_: unknown, { input }: { input: unknown }, ctx: GraphQLContext) => {
      const currentUser = requireAuth(ctx);
      const data = messageInputSchema.parse(input);

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

      const message = await Message.create({
        roomId: room._id,
        userId: currentUser.id,
        username: currentUser.username,
        text: data.text,
        timestamp: new Date()
      });

      const mapped = mapMessage(message);
      await pubsub.publish(MESSAGE_ADDED, { messageAdded: mapped });

      return mapped;
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
      await publishRoomUpdate(room);

      return createdShips.map(mapShip);
    },
    createRoom: async (_: unknown, { input }: { input: unknown }, ctx: GraphQLContext) => {
      const currentUser = requireAuth(ctx);
      const data = createRoomSchema.parse(input);

      const room = await GameRoom.create({
        name: data.name,
        password: data.password?.trim() || undefined,
        status: "waiting",
        maxPlayers: 2,
        participants: [currentUser.id],
        isDeleted: false
      });

      await User.findByIdAndUpdate(currentUser.id, {
        $addToSet: { participantRooms: room._id }
      });

      await publishRoomUpdate(room);
      return mapRoom(room);
    },
    joinRoom: async (_: unknown, { input }: { input: unknown }, ctx: GraphQLContext) => {
      const currentUser = requireAuth(ctx);
      const data = joinRoomSchema.parse(input);

      const room = await GameRoom.findById(data.roomId);
      if (!room || room.isDeleted) {
        throw new Error("Room not found");
      }

      const alreadyParticipant = room.participants.some(
        (id) => id.toString() === currentUser.id
      );
      if (alreadyParticipant) {
        return mapRoom(room);
      }

      if (room.participants.length >= room.maxPlayers) {
        throw new Error("Room is full");
      }

      const requiresPassword = room.password && room.password.length > 0;
      if (requiresPassword) {
        const provided = data.password?.trim() || "";
        if (room.password !== provided) {
          throw new Error("Invalid room password");
        }
      }

      room.participants.push(currentUser.id as any);
      await room.save();
      await publishRoomUpdate(room);
      await User.findByIdAndUpdate(currentUser.id, {
        $addToSet: { participantRooms: room._id }
      });

      return mapRoom(room);
    },
    leaveRoom: async (_: unknown, { input }: { input: unknown }, ctx: GraphQLContext) => {
      const currentUser = requireAuth(ctx);
      const data = leaveRoomSchema.parse(input);

      const room = await GameRoom.findById(data.roomId);
      if (!room || room.isDeleted) {
        throw new Error("Room not found");
      }

      const beforeCount = room.participants.length;
      room.participants = room.participants.filter(
        (id) => id.toString() !== currentUser.id
      ) as any;

      if (beforeCount === room.participants.length) {
        throw new Error("You are not part of this room");
      }

      if (room.participants.length === 0) {
        room.status = "waiting";
        room.currentTurn = null;
        room.winner = null;
      }

      await room.save();
      await publishRoomUpdate(room);
      await User.findByIdAndUpdate(currentUser.id, {
        $pull: { participantRooms: room._id }
      });

      return mapRoom(room);
    },
    makeShot: async (_: unknown, { input }: { input: unknown }, ctx: GraphQLContext) => {
      const currentUser = requireAuth(ctx);
      const data = makeShotSchema.parse(input);

      const room = await GameRoom.findById(data.roomId);
      if (!room || room.isDeleted) {
        throw new Error("Room not found");
      }

      const isParticipant = room.participants.some(
        (id) => id.toString() === currentUser.id
      );
      if (!isParticipant) {
        throw new Error("You are not part of this room");
      }

      if (room.status !== "playing") {
        throw new Error("Game is not currently in progress");
      }
      if (!room.currentTurn || room.currentTurn.toString() !== currentUser.id) {
        throw new Error("It is not your turn");
      }

      const opponentId = room.participants.find(
        (id) => id.toString() !== currentUser.id
      );
      if (!opponentId) {
        throw new Error("Waiting for an opponent");
      }

      const existingShot = await Shot.findOne({
        roomId: room._id,
        playerId: currentUser.id,
        x: data.x,
        y: data.y
      });
      if (existingShot) {
        throw new Error("You have already fired at this cell");
      }

      const enemyShips = await Ship.find({ roomId: room._id, playerId: opponentId });
      if (!enemyShips.length) {
        throw new Error("Opponent has not placed ships yet");
      }

      const targetShip = checkHit(enemyShips, data.x, data.y);
      let result: "miss" | "hit" | "sunk" = "miss";

      if (targetShip) {
        const updatedShip = await Ship.findByIdAndUpdate(
          targetShip._id,
          { $inc: { hits: 1 } },
          { new: true }
        );
        if (updatedShip && checkSunk(updatedShip)) {
          result = "sunk";
        } else {
          result = "hit";
        }
      }

      const shot = await Shot.create({
        roomId: room._id,
        playerId: currentUser.id,
        x: data.x,
        y: data.y,
        result,
        timestamp: new Date()
      });

      let winnerDeclared = false;
      if (result === "hit" || result === "sunk") {
        const refreshedShips = await Ship.find({
          roomId: room._id,
          playerId: opponentId
        });
        if (checkWin(refreshedShips)) {
          room.status = "finished";
          room.winner = currentUser.id as any;
          room.currentTurn = null;
          winnerDeclared = true;
        }
      }

      if (!winnerDeclared) {
        room.currentTurn = opponentId as any;
      }

      await room.save();
      await publishRoomUpdate(room);
      const mapped = mapShot(shot);
      await pubsub.publish(SHOT_FIRED, { shotFired: mapped });
      return mapped;
    }
  },
  Subscription: {
    messageAdded: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([MESSAGE_ADDED]),
        async (payload, variables, ctx: GraphQLContext) => {
          const currentUser = ctx.user;
          if (!currentUser) {
            throw new Error("Unauthorized");
          }
          if (payload.messageAdded.roomId !== variables.roomId) {
            return false;
          }
          const room = await GameRoom.findById(variables.roomId);
          if (!room || room.isDeleted) {
            return false;
          }
          return room.participants.some((id) => id.toString() === currentUser.id);
        }
      )
    },
    shotFired: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([SHOT_FIRED]),
        async (payload, variables, ctx: GraphQLContext) => {
          const currentUser = ctx.user;
          if (!currentUser) {
            throw new Error("Unauthorized");
          }
          if (payload.shotFired.roomId !== variables.roomId) {
            return false;
          }
          const room = await GameRoom.findById(variables.roomId);
          if (!room || room.isDeleted) {
            return false;
          }
          return room.participants.some((id) => id.toString() === currentUser.id);
        }
      )
    }
    ,
    roomUpdated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([ROOM_UPDATED]),
        async (payload, variables, ctx: GraphQLContext) => {
          const currentUser = ctx.user;
          if (!currentUser) {
            throw new Error("Unauthorized");
          }
          if (payload.roomUpdated.id !== variables.roomId) {
            return false;
          }
          const room = await GameRoom.findById(variables.roomId);
          if (!room || room.isDeleted) {
            return false;
          }
          return room.participants.some((id) => id.toString() === currentUser.id);
        }
      )
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

const mapMessage = (message: any) => ({
  id: message._id.toString(),
  roomId: message.roomId.toString(),
  userId: message.userId.toString(),
  username: message.username,
  text: message.text,
  timestamp: message.timestamp,
  createdAt: message.createdAt,
  updatedAt: message.updatedAt
});

const mapShot = (shot: any) => ({
  id: shot._id.toString(),
  playerId: shot.playerId.toString(),
  roomId: shot.roomId.toString(),
  x: shot.x,
  y: shot.y,
  result: shot.result,
  timestamp: shot.timestamp,
  createdAt: shot.createdAt,
  updatedAt: shot.updatedAt
});

const mapRoom = (room: any) => ({
  id: room._id.toString(),
  name: room.name,
  status: room.status,
  maxPlayers: room.maxPlayers,
  currentTurn: room.currentTurn ? room.currentTurn.toString() : null,
  winner: room.winner ? room.winner.toString() : null,
  password: room.password ?? null,
  participants: room.participants.map((id: any) => id.toString()),
  isDeleted: room.isDeleted,
  createdAt: room.createdAt,
  updatedAt: room.updatedAt
});

const publishRoomUpdate = async (room: any) => {
  await pubsub.publish(ROOM_UPDATED, { roomUpdated: mapRoom(room) });
};
