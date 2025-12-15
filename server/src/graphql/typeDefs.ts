import { gql } from "apollo-server-express";

export const typeDefs = gql`
  scalar Date

  enum GameRoomStatus {
    waiting
    placing
    playing
    finished
  }

  enum ShotResult {
    miss
    hit
    sunk
  }

  enum ShipOrientation {
    horizontal
    vertical
  }

  type User {
    id: ID!
    username: String!
    email: String!
    wins: Int!
    losses: Int!
    gamesPlayed: Int!
    avatarUrl: String
    createdAt: Date!
    updatedAt: Date!
  }

  type GameRoom {
    id: ID!
    name: String!
    status: GameRoomStatus!
    maxPlayers: Int!
    currentTurn: ID
    winner: ID
    password: String
    participants: [ID!]!
    isDeleted: Boolean!
    createdAt: Date!
    updatedAt: Date!
  }

  type Shot {
    id: ID!
    playerId: ID!
    roomId: ID!
    x: Int!
    y: Int!
    result: ShotResult!
    timestamp: Date!
    createdAt: Date!
    updatedAt: Date!
  }

  type Message {
    id: ID!
    roomId: ID!
    userId: ID!
    username: String!
    text: String!
    timestamp: Date!
    createdAt: Date!
    updatedAt: Date!
  }

  type Ship {
    id: ID!
    playerId: ID!
    roomId: ID!
    startX: Int!
    startY: Int!
    length: Int!
    orientation: ShipOrientation!
    hits: Int!
    createdAt: Date!
    updatedAt: Date!
  }

  input SendMessageInput {
    roomId: ID!
    text: String!
  }

  input ShipPlacementInput {
    startX: Int!
    startY: Int!
    length: Int!
    orientation: ShipOrientation!
  }

  input PlaceShipsInput {
    roomId: ID!
    ships: [ShipPlacementInput!]!
  }

  input RegisterInput {
    username: String!
    email: String!
    password: String!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input CreateRoomInput {
    name: String!
    password: String
  }

  input JoinRoomInput {
    roomId: ID!
    password: String
  }

  input LeaveRoomInput {
    roomId: ID!
  }

  input MakeShotInput {
    roomId: ID!
    x: Int!
    y: Int!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    me: User
    messages(roomId: ID!): [Message!]!
    myShips(roomId: ID!): [Ship!]!
    shots(roomId: ID!): [Shot!]!
    room(id: ID!): GameRoom
    getPublicRooms: [GameRoom!]!
    searchRooms(term: String!): [GameRoom!]!
    getMyRooms: [GameRoom!]!
  }

  type Mutation {
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    sendMessage(input: SendMessageInput!): Message!
    placeShips(input: PlaceShipsInput!): [Ship!]!
    createRoom(input: CreateRoomInput!): GameRoom!
    joinRoom(input: JoinRoomInput!): GameRoom!
    leaveRoom(input: LeaveRoomInput!): GameRoom!
    makeShot(input: MakeShotInput!): Shot!
  }

  type Subscription {
    messageAdded(roomId: ID!): Message!
    shotFired(roomId: ID!): Shot!
  }
`;
