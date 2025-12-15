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

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    me: User
    myShips(roomId: ID!): [Ship!]!
  }

  type Mutation {
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    placeShips(input: PlaceShipsInput!): [Ship!]!
  }
`;
